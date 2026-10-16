import * as ImageManipulator from 'expo-image-manipulator';

export class ImageProcessor {
  /**
   * Resizes image to max 1920 width and compresses to JPEG 75%.
   * Eliminates multi-megabyte payloads for cell network uploads.
   */
  static async compressForInspection(uri: string): Promise<string> {
    try {
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1920 } }],
        {
          compress: 0.75,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );
      return result.uri;
    } catch {
      return uri; // Fallback to raw URI if manipulation fails
    }
  }
}
