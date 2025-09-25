import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UsersService } from '../users/users.service';
import { MailService } from '../common/services/mail.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private usersService: UsersService,
    private mailService: MailService,
  ) {}

  async createOrder(createOrderDto: CreateOrderDto) {
    // Check if user exists
  let user = await this.usersService.findByEmail(createOrderDto.email);
    // Only generate an OTP for newly-created users. Existing users who already
    // changed their password should not receive an OTP or have their password
    // overwritten. They'll receive a tracking link instead.
    let otp: string | null = null;
    if (!user) {
      // Create new customer user with temporary password == otp
      // Split name into firstName and lastName (simple split)
      const [firstName, ...lastNameParts] = createOrderDto.name.split(' ');
      const lastName = lastNameParts.join(' ');
      // generate OTP for new user
      otp = Math.random().toString(36).slice(-8);
      user = await this.usersService.create({
        email: createOrderDto.email,
        firstName,
        lastName,
        phoneNumber: createOrderDto.phoneNumber,
        password: otp,
      });
      // Send OTP email to new user
      try {
        await this.mailService.sendOtpEmail(user.email, otp);
      } catch (e) {
        console.error('Failed to send OTP to new user:', e);
      }
    } else {
      // Existing user: do NOT overwrite their password or send an OTP.
      // They should already have access to their account. We'll provide a
      // tracking link in the confirmation email instead.
    }
    // Create order
    const order = this.orderRepository.create({
      ...createOrderDto,
      userId: user.id,
    });
    await this.orderRepository.save(order);

    // Send readable confirmation to customer
  const customerBodyLines: string[] = [];
    customerBodyLines.push(`Hi ${createOrderDto.name},`);
    customerBodyLines.push('');
    customerBodyLines.push('Thank you for your order. Here are the details:');
    customerBodyLines.push('');
    customerBodyLines.push(`Order ID: ${order.id}`);
    customerBodyLines.push(`Status: ${order.status}`);
    customerBodyLines.push(`Created At: ${order.createdAt}`);
    customerBodyLines.push('');
    customerBodyLines.push('Products:');
    for (const p of order.products as any[]) {
      customerBodyLines.push(`- ${p.name} (size: ${p.size || 'N/A'}) x ${p.quantity} — $${p.price}`);
    }
    customerBodyLines.push('');
    customerBodyLines.push('We will contact you when your order is processed.');
    if (otp) {
      customerBodyLines.push('');
      customerBodyLines.push('An account has been created for you to track orders.');
      customerBodyLines.push(`Your temporary OTP to log in and set your password is: ${otp}`);
      // Build a link to the frontend verify page. Frontend should accept ?email= and ?otp= to prefill.
      const frontendBase = process.env.FRONTEND_BASE_URL || 'http://localhost:3000';
      const changePasswordUrl = `${frontendBase}/auth/verify?email=${encodeURIComponent(user.email)}&otp=${encodeURIComponent(otp)}`;
      customerBodyLines.push('');
      customerBodyLines.push('To log in and set your password, open the link below:');
      customerBodyLines.push(changePasswordUrl);
      customerBodyLines.push('Or go to the login page and use the OTP as your password, then change it from your profile.');
    } else {
      // Existing user — include a tracking link so they can track their order without password changes
      const frontendBase = process.env.FRONTEND_BASE_URL || 'http://localhost:3000';
      const trackUrl = `${frontendBase}/orders/${order.id}`;
      customerBodyLines.push('');
      customerBodyLines.push('You can track your order using the link below:');
      customerBodyLines.push(trackUrl);
    }
    const customerBody = customerBodyLines.join('\n');

    // send order confirmation to customer
    try {
      await this.mailService.sendPlainEmail(user.email, `Order Confirmation — ${order.id}`, customerBody);
    } catch (e) {
      console.error('Failed to send order confirmation to customer:', e);
    }

    // Notify all admins in the database with readable message
    try {
      const admins = await this.usersService.findAdmins();
      const adminEmails = (admins || []).map(a => a.email).filter(e => !!e) as string[];
      if (adminEmails.length) {
        await this.mailService.sendAdminOrderAlert(order, adminEmails);
      } else {
        // fallback to configured ADMIN_EMAILS in MailService
        await this.mailService.sendAdminOrderAlert(order);
      }
    } catch (e) {
      console.error('Failed to send admin alert:', e);
    }
    return order;
  }

  async findOrderById(id: number) {
    return this.orderRepository.findOne({ where: { id } });
  }

  async findAllOrders() {
    return this.orderRepository.find();
  }

  async updateOrderStatus(id: number, status: string) {
    const order = await this.orderRepository.findOne({ where: { id } });
    if (!order) throw new Error('Order not found');
    order.status = status;
    await this.orderRepository.save(order);
    return order;
  }

  async updateOrder(id: number, data: Partial<any>) {
    const order = await this.orderRepository.findOne({ where: { id } });
    if (!order) throw new Error('Order not found');
    // Only copy allowed fields
    const allowed = ['name','email','phoneNumber','city','address','products','status'];
    for (const key of Object.keys(data || {})) {
      if (allowed.includes(key)) {
        (order as any)[key] = (data as any)[key];
      }
    }
    await this.orderRepository.save(order);
    return order;
  }

  async contactCustomer(id: number, subject: string, message: string) {
    const order = await this.orderRepository.findOne({ where: { id } });
    if (!order) throw new Error('Order not found');
    const to = order.email;
    if (!to) throw new Error('Order has no customer email');
    // Send email via MailService
    try {
      await this.mailService.sendPlainEmail(to, subject, message);
      return { success: true };
    } catch (e) {
      console.error('Failed to contact customer:', e);
      throw e;
    }
  }
}
