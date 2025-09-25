import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './order.entity';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { UsersService } from '../users/users.service';
import { UsersModule } from '../users/users.module';
import { User } from '../users/entities/user.entity';
import { MailService } from '../common/services/mail.service';

@Module({
  imports: [TypeOrmModule.forFeature([Order, User]), UsersModule],
  controllers: [OrdersController],
  providers: [OrdersService, UsersService, MailService],
})
export class OrdersModule {}
