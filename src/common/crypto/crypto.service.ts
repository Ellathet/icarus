import * as crypto from 'crypto';

export class CryptoService {
  private hashSecurityBuffer = Buffer.concat(
    [Buffer.from(process.env.HASH_SECURITY_KEY || 'faraday')],
    32,
  );

  private initVector = crypto.randomBytes(16);
  private algorithm = 'aes-256-cbc';

  encrypt(plainText: string): string {
    const cipher = crypto.createCipheriv(
      this.algorithm,
      this.hashSecurityBuffer,
      this.initVector,
    );

    let encryptedData = cipher.update(plainText, 'utf-8', 'hex');
    encryptedData += cipher.final('hex');

    return encryptedData;
  }

  decrypt(encryptedText: string): string {
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.hashSecurityBuffer,
      this.initVector,
    );

    let decryptedData = decipher.update(encryptedText, 'hex', 'utf-8');
    decryptedData += decipher.final('utf-8');

    return decryptedData;
  }
}
