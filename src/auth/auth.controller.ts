import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
// Removed direct JwtService usage

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('verify')
  async verify(@Req() req: Request) {
    console.log('Auth verify endpoint called');
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    console.log('Auth header:', authHeader);
    
    if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
      console.log('No valid auth header');
      return { message: 'No token provided' };
    }
    
    const token = authHeader.split(' ')[1];
    console.log('Extracted token:', token?.substring(0, 20) + '...');
    
    try {
      const payload = this.authService.verifyToken(token);
      console.log('Token payload:', payload);
      const user = await this.authService.verifyUser({ userId: payload.userId });
      console.log('Found user:', user);
      return user;
    } catch (err) {
      console.error('Token verification error:', err);
      return { message: 'Invalid or expired token' };
    }
  }

  @Get('test-protected')
  @UseGuards(JwtAuthGuard)
  async testProtected(@Req() req: any) {
    return { 
      message: 'This is a protected endpoint', 
      user: req.user,
      timestamp: new Date().toISOString()
    };
  }
}
