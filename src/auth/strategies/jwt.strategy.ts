import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'defaultSecret',
    });
    console.log('JWT Strategy - Using secret:', process.env.JWT_SECRET ? 'ENV_SECRET' : 'defaultSecret');
  }

  async validate(payload: any) {
    console.log('JWT Strategy - Raw payload received:', JSON.stringify(payload, null, 2));
    console.log('JWT Strategy - Payload type:', typeof payload);
    console.log('JWT Strategy - Payload keys:', Object.keys(payload || {}));
    console.log('JWT Strategy - Full payload inspection:');
    console.log('  - payload?.userId:', payload?.userId);
    console.log('  - payload?.email:', payload?.email);
    console.log('  - payload?.role:', payload?.role);
    console.log('  - payload?.sub:', payload?.sub);
    console.log('  - payload?.username:', payload?.username);
    
    // Try to extract user info from different possible fields
    const userId = payload?.userId || payload?.sub || payload?.id;
    const email = payload?.email;
    const role = payload?.role;
    
    const userObj = { 
      userId, 
      email, 
      role 
    };
    console.log('JWT Strategy - Returning user object:', JSON.stringify(userObj, null, 2));
    return userObj;
  }
}
