import { Controller, Post, Body, UseGuards, Res, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Response } from 'express';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { RequestUser } from 'src/common/interfaces/auth.interface';
import { access } from 'fs';

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

    res.json({ 
      user: result.user,
      access_token: result.access_token, 
    });
  }

  @Get('check')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  checkSession(@GetUser() user: RequestUser) {
    return {
      valid: true,
      user: {
        id: user.id,
        name: user.name, 
        email: user.email,
        role: user.role,
        towers: user.towers || [], // <-- Agregado
      },
      message: 'Session is active',
    };
  }

  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  logout(@Res() res: Response) {
    res.clearCookie('access_token');
    res.json({ success: true, message: 'Logged out' });
  }
}
