import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { fetch } from 'undici';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;
  private bucketName = 'product-images';

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_KEY; // Use service role key for admin operations
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase URL and service key must be provided in environment variables');
    }

    this.supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        fetch: fetch as any,
      }
    });
    this.initializeBucket();
  }

  private async initializeBucket() {
    try {
      // Check if bucket exists
      const { data: buckets, error: listError } = await this.supabase.storage.listBuckets();
      console.log('Supabase storage buckets:', buckets?.map(b => b.name) || []);

      if (listError) {
        console.error('Error listing buckets:', listError);
        return;
      }

      const bucketExists = buckets?.some(bucket => bucket.name === this.bucketName);
      
      if (!bucketExists) {
        console.log(`Creating bucket: ${this.bucketName}`);
        const { error: createError } = await this.supabase.storage.createBucket(this.bucketName, {
          public: true,
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
          fileSizeLimit: 5242880, // 5MB
        });

        if (createError) {
          console.error('Error creating bucket:', createError);
        } else {
          console.log(`Bucket ${this.bucketName} created successfully`);
        }
      } else {
        console.log(`Bucket ${this.bucketName} already exists`);
      }
    } catch (error) {
      console.error('Error initializing bucket:', error);
    }
  }

  async uploadFile(file: Express.Multer.File): Promise<string> {
    try {
      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const extension = file.originalname.split('.').pop();
      const fileName = `${timestamp}-${randomString}.${extension}`;

      console.log('Uploading file to Supabase:', fileName);
      
      // Upload file to Supabase storage
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (error) {
        console.error('Supabase upload error:', error);
        throw new Error(`Failed to upload file: ${error.message}`);
      }

      // Get public URL
      const { data: urlData } = this.supabase.storage
        .from(this.bucketName)
        .getPublicUrl(fileName);

      console.log('File uploaded successfully:', urlData.publicUrl);
      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  async uploadMultipleFiles(files: Express.Multer.File[]): Promise<string[]> {
    try {
      console.log(`Uploading ${files.length} files to Supabase...`);
      
      const uploadPromises = files.map(file => this.uploadFile(file));
      const uploadedUrls = await Promise.all(uploadPromises);
      
      console.log(`Successfully uploaded ${uploadedUrls.length} files`);
      return uploadedUrls;
    } catch (error) {
      console.error('Error uploading multiple files:', error);
      throw error;
    }
  }

  async deleteFile(fileUrl: string): Promise<void> {
    try {
      // Extract filename from URL
      const fileName = fileUrl.split('/').pop();
      if (!fileName) {
        throw new Error('Invalid file URL');
      }

      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .remove([fileName]);

      if (error) {
        console.error('Supabase delete error:', error);
        throw new Error(`Failed to delete file: ${error.message}`);
      }

      console.log('File deleted successfully:', fileName);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  async deleteMultipleFiles(fileUrls: string[]): Promise<void> {
    try {
      console.log(`Deleting ${fileUrls.length} files from Supabase...`);
      
      const deletePromises = fileUrls.map(url => this.deleteFile(url));
      await Promise.all(deletePromises);
      
      console.log(`Successfully deleted ${fileUrls.length} files`);
    } catch (error) {
      console.error('Error deleting multiple files:', error);
      throw error;
    }
  }
}
