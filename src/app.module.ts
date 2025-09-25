import { createClient } from '@supabase/supabase-js';
// Test Supabase connection at startup
const supabase = createClient(
  'https://zvxcqivayqmeyfydnobm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2eGNxaXZheXFtZXlmeWRub2JtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MjIyNTcsImV4cCI6MjA2OTk5ODI1N30.1XFQImhiaqRw44BR_0CzwlgbKDpqIwBKXTkxJcFv7qk'
);
supabase.storage.listBuckets().then(({ data, error }) => {
  if (error) {
    console.error('Supabase storage error:', error.message);
  } else {
    console.log('Supabase storage buckets:', data);
  }
});

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { User } from './users/entities/user.entity';
import { Address } from './users/entities/address.entity';
import { Product } from './products/entities/product.entity';
import { Order } from './orders/order.entity';
import { OrdersModule } from './orders/orders.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        if (process.env.DATABASE_URL) {
          return {
            type: 'postgres',
            url: process.env.DATABASE_URL,
            autoLoadEntities: true,
            synchronize: true,
          };
        } else {
          return {
            type: 'postgres',
            host: 'localhost',
            port: 5432,
            username: 'postgres',
            password: '9530',
            database: 'gravixel_attires',
            autoLoadEntities: true,
            synchronize: true,
          };
        }
      },
    }),
    AuthModule,
    UsersModule,
  ProductsModule,
  OrdersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
