import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../users/entities/user.entity';
import { ROLES_KEY } from '../constants/auth.constants';

export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
