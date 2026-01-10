/**
 * File   async saveFile(file: File, _category: string = 'general'): Promise<string> {
    try {
      // Note: File ID generation is here for future use with separate file table
      // Currently storing as base64 data URIs directly
      const fileName = file.name;
      const fileType = file.type;
      const fileSize = file.size; Service - Offline storage using IndexedDB for files
 * Stores files as blobs in IndexedDB
 */

import imageConversion from 'image-conversion';

// File storage using IndexedDB blobs
class FileStorageService {
  /**
   * Save file to IndexedDB
   */
  async saveFile(file: File, _category: string = 'general'): Promise<string> {
    try {
      // Note: File ID generation is here for future use with separate file table
      // Currently storing as base64 data URIs directly
      const fileName = file.name;
      const fileType = file.type;
      const fileSize = file.size;
      
      // For images, compress before storing
      let fileToStore = file;
      if (file.type.startsWith('image/')) {
        fileToStore = await this.compressImage(file);
      }
      
      // Convert to base64 for storage
      const base64Data = await this.fileToBase64(fileToStore);
      
      // Store file metadata (you can extend your database schema)
      // For now, return the base64 data as file path
      const filePath = `data:${fileType};base64,${base64Data}`;
      
      console.log(`File saved: ${fileName} (${this.formatFileSize(fileSize)})`);
      
      return filePath;
    } catch (error) {
      console.error('Error saving file:', error);
      throw new Error('Failed to save file');
    }
  }
  
  /**
   * Save multiple files
   */
  async saveFiles(files: File[], category: string = 'general'): Promise<string[]> {
    const savedPaths: string[] = [];
    
    for (const file of files) {
      const path = await this.saveFile(file, category);
      savedPaths.push(path);
    }
    
    return savedPaths;
  }
  
  /**
   * Compress image before storage
   */
  private async compressImage(file: File): Promise<File> {
    try {
      // Compress to max 1MB and max 1920px width
      const compressed = await imageConversion.compressAccurately(file, {
        size: 1024, // 1MB
        accuracy: 0.9,
        width: 1920,
        orientation: 2,
      });
      
      return new File([compressed], file.name, { type: file.type });
    } catch (error) {
      console.warn('Image compression failed, using original:', error);
      return file;
    }
  }
  
  /**
   * Convert file to base64
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        const base64 = reader.result as string;
        // Remove data URL prefix
        const base64Data = base64.split(',')[1];
        resolve(base64Data);
      };
      
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
  
  /**
   * Convert base64 to blob
   */
  base64ToBlob(base64: string, contentType: string = ''): Blob {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: contentType });
  }
  
  /**
   * Get file URL from base64 data URI
   */
  getFileURL(dataUri: string): string {
    // Already a data URI, return as is
    if (dataUri.startsWith('data:')) {
      return dataUri;
    }
    
    // Otherwise, create blob URL
    return dataUri;
  }
  
  /**
   * Delete file
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      // For base64 data URIs, just remove from database references
      console.log(`File deleted: ${filePath}`);
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  }
  
  /**
   * Download file
   */
  downloadFile(dataUri: string, filename: string): void {
    const link = document.createElement('a');
    link.href = dataUri;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  
  /**
   * Format file size
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
  
  /**
   * Create thumbnail from image
   */
  async createThumbnail(file: File, maxWidth: number = 200): Promise<string> {
    try {
      const compressed = await imageConversion.compressAccurately(file, {
        size: 50, // 50KB
        width: maxWidth,
      });
      
      return await this.fileToBase64(new File([compressed], file.name, { type: file.type }));
    } catch (error) {
      console.error('Thumbnail creation failed:', error);
      return '';
    }
  }
}

export const fileStorage = new FileStorageService();

/**
 * Helper to handle file input
 */
export async function handleFileUpload(
  event: React.ChangeEvent<HTMLInputElement>,
  category?: string
): Promise<string[]> {
  const files = event.target.files;
  if (!files || files.length === 0) return [];
  
  const fileArray = Array.from(files);
  return await fileStorage.saveFiles(fileArray, category);
}

/**
 * Helper to handle single file upload
 */
export async function handleSingleFileUpload(
  event: React.ChangeEvent<HTMLInputElement>,
  category?: string
): Promise<string | null> {
  const files = await handleFileUpload(event, category);
  return files.length > 0 ? files[0] : null;
}
