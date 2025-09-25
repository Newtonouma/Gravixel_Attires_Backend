import { ArgumentMetadata, Injectable, PipeTransform, BadRequestException } from '@nestjs/common';

@Injectable()
export class FormDataToDto implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (!value || typeof value !== 'object') {
      return value;
    }

    console.log('FormDataToDto - Input value:', value);
    console.log('FormDataToDto - Input keys:', Object.keys(value));

    try {
      // Transform the FormData fields to proper types
      const transformed = { ...value };

      // Convert price to number
      if (transformed.price !== undefined && transformed.price !== '') {
        const priceNum = Number(transformed.price);
        if (isNaN(priceNum)) {
          throw new BadRequestException('Price must be a valid number');
        }
        transformed.price = priceNum;
        console.log('FormDataToDto - Converted price:', transformed.price);
      }

      // Convert array fields from comma-separated strings to arrays
      const arrayFields = ['sizes', 'colors', 'materials'];
      arrayFields.forEach(field => {
        if (transformed[field] !== undefined && transformed[field] !== '') {
          if (typeof transformed[field] === 'string') {
            transformed[field] = transformed[field]
              .split(',')
              .map((item: string) => item.trim())
              .filter((item: string) => item.length > 0);
            console.log(`FormDataToDto - Converted ${field}:`, transformed[field]);
          } else if (!Array.isArray(transformed[field])) {
            transformed[field] = [];
          }
        } else {
          transformed[field] = [];
        }
      });

      // Convert boolean fields
      const booleanFields = ['isActive', 'inStock'];
      booleanFields.forEach(field => {
        if (transformed[field] !== undefined && transformed[field] !== '') {
          if (typeof transformed[field] === 'string') {
            transformed[field] = transformed[field].toLowerCase() === 'true';
            console.log(`FormDataToDto - Converted ${field}:`, transformed[field]);
          }
        }
      });

      console.log('FormDataToDto - Final transformed value:', transformed);
      return transformed;
    } catch (error) {
      console.error('FormDataToDto - Transformation error:', error);
      throw new BadRequestException(`Invalid form data: ${error.message}`);
    }
  }
}