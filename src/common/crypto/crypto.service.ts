import * as crypto from 'crypto';

export class CryptoService {
  private hashSecurityBuffer = Buffer.concat(
    [Buffer.from(process.env.HASH_SECURITY_KEY || 'faraday')],
    32,
  );

  private initVector = Buffer.concat(
    [Buffer.from(process.env.HASH_INIT_VECTOR || 'tesla')],
    16,
  );

  private algorithm = 'aes-256-cbc';

  encrypt(plainText: string): string {
    const cipher = crypto.createCipheriv(
      this.algorithm,
      this.hashSecurityBuffer,
      this.initVector,
    );

    return Buffer.from(
      cipher.update(plainText, 'utf8', 'hex') + cipher.final('hex'),
    ).toString('base64');
  }

  decrypt(encryptedText: string): string {
    const buff = Buffer.from(encryptedText, 'base64');
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.hashSecurityBuffer,
      this.initVector,
    );

    return (
      decipher.update(buff.toString('utf8'), 'hex', 'utf8') +
      decipher.final('utf8')
    );
  }
}
