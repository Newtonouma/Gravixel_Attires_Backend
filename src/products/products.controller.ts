import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  UseGuards, 
  UseInterceptors, 
  UploadedFiles
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { SupabaseService } from '../common/services/supabase.service';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly supabaseService: SupabaseService,
  ) {}

  private parseArrayField(value: string): string[] {
    try {
      // Try to parse as JSON first (for arrays like '["M","L","XL"]')
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      // If JSON parsing fails, try comma-separated values
      return value.split(',').map((item: string) => item.trim()).filter(Boolean);
    }
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FilesInterceptor('images', 10)) // Allow up to 10 images
  async create(
    @Body() rawData: any,
    @UploadedFiles() imageFiles?: Express.Multer.File[],
  ) {
    console.log('ProductsController - Raw form data received:', rawData);
    console.log('ProductsController - Received image files:', imageFiles ? `${imageFiles.length} files` : 'None');

    try {
      // Transform FormData to proper DTO format
      const createProductDto: CreateProductDto = {
        name: rawData.name,
        description: rawData.description,
        price: Number(rawData.price),
        category: rawData.category,
        subcategory: rawData.subcategory,
        sizes: typeof rawData.sizes === 'string' 
          ? this.parseArrayField(rawData.sizes)
          : rawData.sizes || [],
        colors: typeof rawData.colors === 'string' 
          ? this.parseArrayField(rawData.colors)
          : rawData.colors || [],
        materials: typeof rawData.materials === 'string' 
          ? this.parseArrayField(rawData.materials)
          : rawData.materials || [],
        tags: typeof rawData.tags === 'string' 
          ? this.parseArrayField(rawData.tags)
          : rawData.tags || [],
        imageUrl: rawData.imageUrl || '',
        isActive: rawData.isActive === 'true' || rawData.isActive === true,
        inStock: rawData.inStock === 'true' || rawData.inStock === true,
        featured: rawData.featured === 'true' || rawData.featured === true,
      };

      console.log('ProductsController - Transformed DTO:', createProductDto);

      let imageUrls: string[] = [];

      // Handle multiple image uploads
      if (imageFiles && imageFiles.length > 0) {
        console.log('Uploading multiple images to Supabase...');
        imageUrls = await this.supabaseService.uploadMultipleFiles(imageFiles);
        console.log('Multiple images uploaded successfully:', imageUrls);
      }

      // Create product with image URLs
      const productData = {
        ...createProductDto,
        imageUrl: createProductDto.imageUrl || (imageUrls.length > 0 ? imageUrls[0] : ''),
        imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
      };

      console.log('Creating product with final data:', productData);
      return this.productsService.create(productData);
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }

  @Get()
  // Public endpoint - no authentication required
  findAll() {
    return this.productsService.findAll();
  }

  @Get(':id')
  // Public endpoint - no authentication required
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FilesInterceptor('images', 10))
  async update(
    @Param('id') id: string, 
    @Body() rawData: any,
    @UploadedFiles() imageFiles?: Express.Multer.File[],
  ) {
    console.log('ProductsController - Update raw data received:', rawData);
    console.log('ProductsController - Update received image files:', imageFiles ? `${imageFiles.length} files` : 'None');

    try {
      // Get existing product
      const existingProduct = await this.productsService.findOne(+id);
      if (!existingProduct) {
        throw new Error('Product not found');
      }

      // Handle image deletions first
      if (rawData.imagesToDelete) {
        const imagesToDelete = typeof rawData.imagesToDelete === 'string' 
          ? this.parseArrayField(rawData.imagesToDelete)
          : rawData.imagesToDelete;
        
        if (imagesToDelete.length > 0) {
          console.log('Deleting images:', imagesToDelete);
          await this.supabaseService.deleteMultipleFiles(imagesToDelete);
        }
      }

      // Handle new image uploads
      let newImageUrls: string[] = [];
      if (imageFiles && imageFiles.length > 0) {
        console.log('Uploading new images to Supabase...');
        newImageUrls = await this.supabaseService.uploadMultipleFiles(imageFiles);
        console.log('New images uploaded successfully:', newImageUrls);
      }

      // Transform FormData to DTO
      const updateProductDto: UpdateProductDto = {
        name: rawData.name,
        description: rawData.description,
        price: rawData.price ? Number(rawData.price) : undefined,
        category: rawData.category,
        subcategory: rawData.subcategory,
        sizes: typeof rawData.sizes === 'string' 
          ? this.parseArrayField(rawData.sizes)
          : rawData.sizes,
        colors: typeof rawData.colors === 'string' 
          ? this.parseArrayField(rawData.colors)
          : rawData.colors,
        materials: typeof rawData.materials === 'string' 
          ? this.parseArrayField(rawData.materials)
          : rawData.materials,
        tags: typeof rawData.tags === 'string' 
          ? this.parseArrayField(rawData.tags)
          : rawData.tags,
        imageUrl: rawData.imageUrl,
        isActive: rawData.isActive === 'true' || rawData.isActive === true,
        inStock: rawData.inStock === 'true' || rawData.inStock === true,
        featured: rawData.featured === 'true' || rawData.featured === true,
      };

      // Merge existing images with new ones (excluding deleted ones)
      const existingImageUrls = existingProduct.imageUrls || [];
      const imagesToDelete = rawData.imagesToDelete 
        ? (typeof rawData.imagesToDelete === 'string' 
            ? this.parseArrayField(rawData.imagesToDelete)
            : rawData.imagesToDelete)
        : [];
      
      const remainingImages = existingImageUrls.filter(url => !imagesToDelete.includes(url));
      const finalImageUrls = [...remainingImages, ...newImageUrls];

      // Update imageUrls and maintain backward compatibility with imageUrl
      const productData = {
        ...updateProductDto,
        imageUrls: finalImageUrls.length > 0 ? finalImageUrls : undefined,
        imageUrl: updateProductDto.imageUrl || (finalImageUrls.length > 0 ? finalImageUrls[0] : existingProduct.imageUrl),
      };

      console.log('Updating product with final data:', productData);
      return this.productsService.update(+id, productData);
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.productsService.remove(+id);
  }

  @Post('populate-slugs')
  async populateSlugs() {
    console.log('Populating slugs for all products...');
    await this.productsService.populateSlugs();
    return { message: 'Slugs populated successfully' };
  }
}
