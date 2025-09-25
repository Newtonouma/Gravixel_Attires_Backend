import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers?.authorization as string | undefined;
    console.log(
      'JwtAuthGuard - Authorization header:',
      authHeader ? `Bearer ${authHeader.substring(7, 27)}...` : 'None',
    );
    console.log('JwtAuthGuard - Request URL:', request.url);
    console.log('JwtAuthGuard - Request method:', request.method);

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    console.log('JwtAuthGuard - handleRequest called');
    console.log('JwtAuthGuard - Error:', err);
    console.log('JwtAuthGuard - User:', user);
    console.log('JwtAuthGuard - Info:', info);

    // Handle expired token specifically
    if (info && info.name === 'TokenExpiredError') {
      console.log('JwtAuthGuard - Token expired, throwing UnauthorizedException');
      throw new UnauthorizedException({
        message: 'Token expired',
        statusCode: 401,
        error: 'TOKEN_EXPIRED'
      });
    }

    // Handle other JWT errors
    if (info && (info.name === 'JsonWebTokenError' || info.name === 'NotBeforeError')) {
      console.log('JwtAuthGuard - Invalid token, throwing UnauthorizedException');
      throw new UnauthorizedException({
        message: 'Invalid token',
        statusCode: 401,
        error: 'INVALID_TOKEN'
      });
    }

    // Handle other errors or missing user
    if (err || !user) {
      console.log('JwtAuthGuard - Authentication failed:', err || 'No user');
      throw new UnauthorizedException({
        message: 'Authentication failed',
        statusCode: 401,
        error: 'AUTHENTICATION_FAILED'
      });
    }

    return user;
  }
}
