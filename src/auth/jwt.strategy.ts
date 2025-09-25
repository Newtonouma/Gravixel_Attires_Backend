import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'default_secret',
    });
    console.log('JWT Strategy (main) - Using secret:', process.env.JWT_SECRET ? 'ENV_SECRET' : 'default_secret');
  }

  async validate(payload: any) {
    console.log('JWT Strategy (main) - Raw payload received:', JSON.stringify(payload, null, 2));
    console.log('JWT Strategy (main) - Payload keys:', Object.keys(payload || {}));
    
    const userObj = { 
      userId: payload?.userId, 
      email: payload?.email, 
      role: payload?.role 
    };
    console.log('JWT Strategy (main) - Returning user object:', JSON.stringify(userObj, null, 2));
    return userObj;
  }
}
