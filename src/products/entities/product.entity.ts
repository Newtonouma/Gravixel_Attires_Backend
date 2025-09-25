import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true, nullable: true })
  slug?: string;

  @Column('text')
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column()
  category: string;

  @Column()
  subcategory: string;

  @Column('simple-array')
  sizes: string[];

  @Column('simple-array')
  colors: string[];

  @Column('simple-array')
  materials: string[];

  @Column('simple-array', { nullable: true })
  tags: string[];

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: true })
  inStock: boolean;

  @Column({ default: false })
  featured: boolean;

  @Column({ nullable: true })
  imageUrl?: string;

  @Column('simple-array', { nullable: true })
  imageUrls?: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
