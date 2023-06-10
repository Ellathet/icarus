import { Module } from '@nestjs/common';
import { SignService } from './sign.service';
import { SignController } from './sign.controller';
import { BullModule } from '@nestjs/bull';
import { SignProcessor } from './sign.processor';
import { SIGN_QUEUE } from './constants';
import { CertificateModule } from '../certificate/certificate.module';
import { FileModule } from '../common/file/file.module';
import { CryptoModule } from '../common/crypto/crypto.module';

@Module({
  imports: [
    CryptoModule,
    FileModule,
    CertificateModule,
    BullModule.registerQueue({
      name: SIGN_QUEUE,
    }),
  ],
  controllers: [SignController],
  providers: [SignService, SignProcessor],
})
export class SignModule {}
