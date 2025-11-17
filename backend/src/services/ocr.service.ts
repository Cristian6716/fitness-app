import { ImageAnnotatorClient } from '@google-cloud/vision';
import sharp from 'sharp';

/**
 * OCR Service using Google Cloud Vision API
 */
export class OcrService {
  private client: ImageAnnotatorClient | null = null;
  private isConfigured: boolean = false;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize Google Cloud Vision client
   */
  private initialize() {
    try {
      const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
      const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

      if (!projectId || !credentialsPath) {
        console.warn('⚠️ Google Cloud Vision not configured. OCR will be disabled.');
        console.warn('⚠️ Set GOOGLE_CLOUD_PROJECT_ID and GOOGLE_APPLICATION_CREDENTIALS in .env');
        this.isConfigured = false;
        return;
      }

      // Check if credentials file exists
      const fs = require('fs');
      if (!fs.existsSync(credentialsPath)) {
        console.warn(`⚠️ Google Cloud credentials file not found: ${credentialsPath}`);
        console.warn('⚠️ OCR will be disabled. Please add your google-cloud-key.json file.');
        this.isConfigured = false;
        return;
      }

      this.client = new ImageAnnotatorClient({
        projectId,
        keyFilename: credentialsPath,
      });

      this.isConfigured = true;
      console.log('✅ Google Cloud Vision OCR initialized successfully');
    } catch (error: any) {
      console.error('❌ Failed to initialize Google Cloud Vision:', error.message);
      this.isConfigured = false;
    }
  }

  /**
   * Check if OCR is available
   */
  isAvailable(): boolean {
    return this.isConfigured && this.client !== null;
  }

  /**
   * Extract text from image using Google Cloud Vision API
   */
  async extractTextFromImage(imageBuffer: Buffer): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error('OCR service is not configured. Please set up Google Cloud Vision API credentials.');
    }

    try {
      console.log('🔍 Starting OCR text extraction...');
      console.log('📏 Original image size:', (imageBuffer.length / 1024 / 1024).toFixed(2), 'MB');

      // Optimize image before sending to Vision API
      const optimizedBuffer = await this.optimizeImage(imageBuffer);
      console.log('📏 Optimized image size:', (optimizedBuffer.length / 1024 / 1024).toFixed(2), 'MB');

      // Call Google Cloud Vision API
      console.log('☁️ Calling Google Vision API...');
      const startTime = Date.now();

      const [result] = await this.client!.textDetection({
        image: { content: optimizedBuffer },
      });

      const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`☁️ Vision API responded in ${elapsedTime}s`);

      const detections = result.textAnnotations;

      if (!detections || detections.length === 0) {
        console.log('❌ No text detected in image');
        return '';
      }

      // First annotation contains the entire text
      const fullText = detections[0].description || '';
      console.log('✅ OCR extracted', fullText.length, 'characters');

      return fullText;
    } catch (error: any) {
      console.error('❌ OCR extraction failed:', error.message);

      // Handle specific Google Cloud errors
      if (error.message?.includes('PERMISSION_DENIED')) {
        throw new Error('Google Cloud Vision API permission denied. Check your credentials and API enablement.');
      }
      if (error.message?.includes('RESOURCE_EXHAUSTED')) {
        throw new Error('Google Cloud Vision API quota exceeded. Please check your usage limits.');
      }
      if (error.message?.includes('INVALID_ARGUMENT')) {
        throw new Error('Invalid image format for OCR processing.');
      }

      throw new Error(`OCR failed: ${error.message}`);
    }
  }

  /**
   * Optimize image for OCR
   * - Convert to grayscale (better OCR, smaller size)
   * - Resize if too large (max 2000px width)
   * - Compress to reduce file size
   */
  private async optimizeImage(imageBuffer: Buffer): Promise<Buffer> {
    try {
      const image = sharp(imageBuffer);
      const metadata = await image.metadata();

      console.log('🖼️ Image dimensions:', metadata.width, 'x', metadata.height);

      // Resize if too large (Vision API works better with reasonable sizes)
      const maxWidth = 2000;
      let processedImage = image;

      if (metadata.width && metadata.width > maxWidth) {
        console.log('📐 Resizing image to max width:', maxWidth);
        processedImage = processedImage.resize(maxWidth, null, {
          withoutEnlargement: true,
        });
      }

      // Convert to grayscale and compress
      const optimizedBuffer = await processedImage
        .grayscale()
        .jpeg({ quality: 80 })
        .toBuffer();

      return optimizedBuffer;
    } catch (error: any) {
      console.warn('⚠️ Image optimization failed, using original:', error.message);
      return imageBuffer;
    }
  }

  /**
   * Extract text from multiple images (for multi-page PDFs)
   */
  async extractTextFromImages(imageBuffers: Buffer[]): Promise<string> {
    if (imageBuffers.length === 0) {
      return '';
    }

    console.log(`🔍 Processing ${imageBuffers.length} page(s) with OCR...`);

    const textPromises = imageBuffers.map((buffer, index) => {
      console.log(`📄 Processing page ${index + 1}/${imageBuffers.length}...`);
      return this.extractTextFromImage(buffer);
    });

    const texts = await Promise.all(textPromises);
    const combinedText = texts.join('\n\n--- PAGE BREAK ---\n\n');

    console.log('✅ Combined OCR text from all pages:', combinedText.length, 'characters');
    return combinedText;
  }
}

export default new OcrService();
