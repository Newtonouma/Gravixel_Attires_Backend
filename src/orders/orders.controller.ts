import { Controller, Post, Body, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { ContactCustomerDto } from './dto/contact-customer.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async create(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.createOrder(createOrderDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: number) {
    return this.ordersService.findOrderById(id);
  }

  @Get()
  async findAll() {
    return this.ordersService.findAllOrders();
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateStatus(@Param('id') id: number, @Body() body: UpdateOrderStatusDto) {
    return this.ordersService.updateOrderStatus(id, body.status);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateOrder(@Param('id') id: number, @Body() body: UpdateOrderDto) {
    return this.ordersService.updateOrder(id, body);
  }

  @Post(':id/contact')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async contactCustomer(@Param('id') id: number, @Body() body: ContactCustomerDto) {
    return this.ordersService.contactCustomer(id, body.subject, body.message);
  }
}
