import { TestingModule, Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { CryptoService } from '../../../src/common/crypto/crypto.service';

describe('CryptoService', () => {
  const isHex = (string) => {
    const hexRegex = /^[0-9a-fA-F]+$/;
    return hexRegex.test(string);
  };

  let service: CryptoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot()],
      providers: [CryptoService],
    }).compile();

    service = module.get<CryptoService>(CryptoService);
  });

  it('should be return hex', () => {
    const plainText = 'father of whims';
    expect(isHex(service.encrypt(plainText))).toBe(true);
  });

  it('should be return the decrypted plaintext', () => {
    const plainText = 'father of whims';
    const encryptedText = service.encrypt(plainText);
    const decryptedText = service.decrypt(encryptedText);
    expect(decryptedText).toBe(plainText);
  });
});
