import { Module } from '@nestjs/common';
import { CertificateService } from './certificate.service';
import { CertificateController } from './certificate.controller';
import { FileModule } from '../common/file/file.module';
import { SequelizeModule } from '@nestjs/sequelize';
import { Certificate } from './entities/certificate.entity';

@Module({
  imports: [SequelizeModule.forFeature([Certificate]), FileModule],
  controllers: [CertificateController],
  providers: [CertificateService],
})
export class CertificateModule {}
