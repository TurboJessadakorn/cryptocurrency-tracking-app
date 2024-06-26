import { Controller, Post, Body, Get, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PortfolioService } from './portfolio.service';
import { CreatePortfolioDto } from './portfolio.dto';
import { UserService } from '../user/user.service';

@Controller('portfolio')
export class PortfolioController {
  constructor(
    private readonly portfolioService: PortfolioService,
    private readonly userService: UserService,
  ) { }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Request() req, @Body() createPortfolioDto: CreatePortfolioDto) {
    const user = await this.userService.findById(req.user.sub);
    return this.portfolioService.create(
      user,
      createPortfolioDto.cryptocurrency,
      createPortfolioDto.logo,
      createPortfolioDto.symbol,
      createPortfolioDto.amount,
      createPortfolioDto.purchasePrice,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(@Request() req) {
    const user = await this.userService.findById(req.user.sub);
    const portfolios = await this.portfolioService.findByUser(user);

    const aggregatedPortfolios = portfolios.reduce((acc, portfolio) => {
      const key = `${portfolio.cryptocurrency}-${portfolio.symbol}`;
      if (!acc[key]) {
        acc[key] = {
          id: portfolio.id,
          name: portfolio.cryptocurrency,
          logo: portfolio.logo,
          symbol: portfolio.symbol,
          amount:  Number(portfolio.amount),
          history: [{
            date: portfolio.createdAt.toISOString().split('T')[0],
            price: portfolio.purchasePrice,
            amount:  Number(portfolio.amount),
          }],
        };
      } else {
        acc[key].amount += Number(portfolio.amount);
        acc[key].history.push({
          date: portfolio.createdAt.toISOString().split('T')[0],
          price: portfolio.purchasePrice,
          amount:  Number(portfolio.amount),
        });
      }
      return acc;
    }, {});

    return Object.values(aggregatedPortfolios);
  }

  @UseGuards(JwtAuthGuard)
  @Get('history')
  async findHistory(@Request() req) {
    const user = await this.userService.findById(req.user.sub);
    return this.portfolioService.findHistory(user);
  }
}