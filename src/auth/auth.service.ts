
import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  verifyToken(token: string): { userId: string } {
    console.log('Verifying token in service...');
    try {
      const payload = this.jwtService.verify(token, { secret: process.env.JWT_SECRET }) as { userId: string };
      console.log('Token verified successfully, payload:', payload);
      return payload;
    } catch (err) {
      console.error('JWT verification failed:', err);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  async register(registerDto: RegisterDto) {
    const { firstName, lastName, email, password, phoneNumber } = registerDto;

    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    // Create user with backend format
    const user = await this.usersService.create({
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
    });

    // Generate tokens
    const token = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    // Return in frontend format
    return {
      user: {
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        role: user.role.toLowerCase(),
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
      token,
      refreshToken,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Validate user credentials
    const user = await this.usersService.validatePassword(email, password);
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const token = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    // Return in frontend format
    return {
      user: {
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        role: user.role.toLowerCase(),
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
      token,
      refreshToken,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      }) as { userId: string };

      const user = await this.usersService.findOne(payload.userId);
      
      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const newToken = this.generateAccessToken(user);
      const newRefreshToken = this.generateRefreshToken(user);

      return {
        user: {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role.toLowerCase(),
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        },
        token: newToken,
        refreshToken: newRefreshToken,
      };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async refresh(refreshToken: string) {
    return this.refreshToken(refreshToken);
  }

  async verifyUser(userPayload: { userId: string }) {
    console.log('Looking up user with ID:', userPayload.userId);
    const user = await this.usersService.findOne(userPayload.userId);
    
    if (!user) {
      console.log('User not found in database');
      throw new UnauthorizedException('User not found');
    }

    console.log('User found:', { id: user.id, email: user.email, role: user.role });
    
    // Return user in frontend format
    const result = {
      id: user.id,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      role: user.role.toLowerCase(),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
    
    console.log('Returning user data:', result);
    return result;
  }

  async loginWithCredentials(loginDto: LoginDto) {
    return this.login(loginDto);
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.validatePassword(email, password);
    if (user) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  private generateAccessToken(user: User) {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role.toLowerCase(), // Ensure consistency with frontend
    };
    console.log('generateAccessToken - Creating token with payload:', payload);
    return this.jwtService.sign(
      payload,
      {
        secret: process.env.JWT_SECRET,
        expiresIn: '15m',
      },
    );
  }

  private generateRefreshToken(user: User) {
    return this.jwtService.sign(
      {
        userId: user.id,
      },
      {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: '7d',
      },
    );
  }
}
