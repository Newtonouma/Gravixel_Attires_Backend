import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../users/entities/user.entity';
import { ROLES_KEY } from '../constants/auth.constants';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredRoles) {
      return true;
    }
    
    const { user } = context.switchToHttp().getRequest();
    console.log('RolesGuard - Required roles:', requiredRoles);
    console.log('RolesGuard - User object:', user);
    console.log('RolesGuard - User role:', user?.role);
    console.log('RolesGuard - User role type:', typeof user?.role);
    
    if (!user || !user.role) {
      console.log('RolesGuard - No user or no role found');
      return false;
    }
    
    // Convert required roles to lowercase for comparison since JWT payload has lowercase role
    const hasRequiredRole = requiredRoles.some((role) => {
      const requiredRoleLower = role.toLowerCase();
      const userRoleLower = String(user.role).toLowerCase();
      console.log(
        `RolesGuard - Comparing: required="${requiredRoleLower}" vs user="${userRoleLower}"`,
      );
      return userRoleLower === requiredRoleLower;
    });
    
    console.log('RolesGuard - Access granted:', hasRequiredRole);
    return hasRequiredRole;
  }
}
