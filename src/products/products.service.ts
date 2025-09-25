import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  async create(createProductDto: CreateProductDto): Promise<Product> {
    // Auto-generate slug if not provided
    if (!createProductDto.slug) {
      createProductDto.slug = this.generateSlug(createProductDto.name);
    }
    
    const product = this.productRepository.create(createProductDto);
    return await this.productRepository.save(product);
  }

  async findAll(): Promise<Product[]> {
    return this.productRepository.find();
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto): Promise<Product> {
    // Auto-generate slug if name is being updated and slug is not provided
    if (updateProductDto.name && !updateProductDto.slug) {
      updateProductDto.slug = this.generateSlug(updateProductDto.name);
    }
    
    await this.productRepository.update(id, updateProductDto);
    return this.findOne(id);
  }

  async populateSlugs(): Promise<void> {
    const products = await this.productRepository.find();
    
    for (const product of products) {
      if (!product.slug) {
        const slug = this.generateSlug(product.name);
        await this.productRepository.update(product.id, { slug });
        console.log(`Generated slug for product ${product.id}: ${slug}`);
      }
    }
  }

  async remove(id: number): Promise<void> {
    await this.productRepository.delete(id);
  }
}
