import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { Address } from './entities/address.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { email, password, addresses: addressData, ...userData } = createUserDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = this.userRepository.create({
      ...userData,
      email,
      password: hashedPassword,
    });

    // Save user first
    const savedUser = await this.userRepository.save(user);

    // Create and save address if provided
    if (addressData && addressData.length > 0) {
      const addresses = addressData.map(addr => 
        this.addressRepository.create({
          ...addr,
          user: savedUser,
        })
      );
      
      const savedAddresses = await this.addressRepository.save(addresses);
      savedUser.addresses = savedAddresses;
    }

    return savedUser;
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      relations: ['addresses'],
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['addresses'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      relations: ['addresses'],
    });
  }

  // Return all admin users
  async findAdmins(): Promise<User[]> {
    return this.userRepository.find({
      where: { role: UserRole.ADMIN },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    
    const { addresses: addressData, ...updateData } = updateUserDto;

    // Update user data
    Object.assign(user, updateData);

    const updatedUser = await this.userRepository.save(user);

    // Update addresses if provided
    if (addressData) {
      // Remove existing addresses
      if (user.addresses && user.addresses.length > 0) {
        await this.addressRepository.remove(user.addresses);
      }

      // Create new addresses
      if (addressData.length > 0) {
        const addresses = addressData.map(addr => 
          this.addressRepository.create({
            ...addr,
            user: updatedUser,
          })
        );
        
        const savedAddress = await this.addressRepository.save(addresses);
        updatedUser.addresses = savedAddress;
      }
    }

    return updatedUser;
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }

  async validatePassword(email: string, password: string): Promise<User | null> {
    const user = await this.findByEmail(email);
    
    if (!user) {
      return null;
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  // Set a temporary password (hashed) for an existing user. Useful for OTP flows.
  async setTemporaryPassword(userId: string, plainPassword: string): Promise<void> {
    const user = await this.findOne(userId);
    const hashed = await bcrypt.hash(plainPassword, 10);
    user.password = hashed;
    await this.userRepository.save(user);
  }

  // Change password by validating current password first
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.findOne(userId);
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      throw new Error('Current password is incorrect');
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await this.userRepository.save(user);
  }
}
