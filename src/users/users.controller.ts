import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Temporary debug endpoint to inspect request bodies from the frontend
  @Post('debug/change-password')
  async debugChangePasswordRaw(@Body() body: any, @Req() req: any) {
    console.log('[UsersController.debugChangePasswordRaw] called');
    try {
      console.log('Headers:', req.headers ? req.headers : '<no headers>');
    } catch (e) {
      console.log('Could not read headers', e);
    }
    console.log('Raw body:', body);
    return { received: body };
  }

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    // Prevent role changes via this endpoint — check for 'role' key presence
    if (Object.prototype.hasOwnProperty.call(updateUserDto as object, 'role')) {
      throw new ForbiddenException('Changing roles via this endpoint is not allowed');
    }
    return this.usersService.update(id, updateUserDto);
  }

  @Post(':id/change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(@Param('id') id: string, @Body() body: ChangePasswordDto, @Req() req: any) {
    // Debug logging: track incoming requests to this endpoint
    console.log('[UsersController.changePassword] called for id=', id);
    try {
      console.log('Headers:', req.headers);
      console.log('Body:', body);
    } catch (e) {
      console.log('Error logging request details', e);
    }

    // Only allow the user themselves or an admin to change password
    const requester = req.user;
    if (!requester) {
      console.log('No requester (auth guard may have blocked).');
      return { message: 'Unauthorized' };
    }
    if (requester.userId !== id && requester.role !== 'admin') {
      return { message: 'Forbidden' };
    }

    await this.usersService.changePassword(id, body.currentPassword, body.newPassword);
    return { message: 'Password changed successfully' };
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
