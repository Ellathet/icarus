export class Helpers {
  static isValidBase64(base64: string): boolean {
    try {
      const buffer = Buffer.from(base64, 'base64');
      return buffer.length > 0;
    } catch (error) {
      return false;
    }
  }
}
