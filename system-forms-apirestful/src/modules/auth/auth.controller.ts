import { Controller, Post, Body, UseGuards, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto, @Res() res: Response) {
    const result = await this.authService.login(loginDto);

    res.cookie('access_token', result.access_token, {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 1 día
    });

    res.json({user: result.user});
  }
}
