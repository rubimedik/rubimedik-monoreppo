import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

@Injectable()
export class StorageService {
  constructor(private configService: ConfigService) {
    const cloudName = this.configService.get('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get('CLOUDINARY_API_SECRET');

    if (!cloudName || !apiKey || !apiSecret) {
      console.error('CRITICAL: Cloudinary configuration is incomplete!', { 
        hasName: !!cloudName, 
        hasKey: !!apiKey, 
        hasSecret: !!apiSecret 
      });
    } else {
      console.log(`DEBUG: Cloudinary Configured - Name: ${cloudName}, Key: ${apiKey?.substring(0, 4)}...`);
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });
  }

  getMulterStorage(folder: string = 'rubimedik') {
    return new CloudinaryStorage({
      cloudinary: cloudinary,
      params: {
        folder: folder,
        allowed_formats: ['jpg', 'png', 'pdf'],
      } as any,
    });
  }

  async uploadFile(file: Express.Multer.File, folder: string = 'rubimedik'): Promise<string> {
    if (!file) {
      throw new Error('No file provided for upload');
    }
    if (!file.buffer) {
      console.error('DEBUG: File object received but buffer is missing', file);
      throw new Error('File buffer is empty or missing');
    }

    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        { 
          folder: folder,
          resource_type: 'auto',
          access_mode: 'public'
        },
        (error, result) => {
          if (error) {
            console.error('DEBUG: Cloudinary upload error:', error);
            return reject(error);
          }
          resolve(result.secure_url);
        }
      );
      upload.end(file.buffer);
    });
  }
}
