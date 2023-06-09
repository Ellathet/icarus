import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { CreateCertificateDto } from './dto/create-certificate.dto';
import { UpdateCertificateDto } from './dto/update-certificate.dto';
import { FileService } from '../common/file/file.service';
import { Certificate } from './entities/certificate.entity';
import { InjectModel } from '@nestjs/sequelize';
import { exec } from 'child_process';

@Injectable()
export class CertificateService {
  private readonly logger = new Logger(CertificateService.name);

  constructor(
    private fileService: FileService,

    @InjectModel(Certificate)
    private certificateRepository: typeof Certificate,
  ) {}

  async convertPfxToPem(
    fileName: string,
    certificateId: string,
    password: string,
  ) {
    await new Promise<void>((resolve, reject) => {
      exec(
        `openssl pkcs12 -passin pass:${password} -clcerts -nokeys -in ${
          this.fileService.PATH_TO_TEMP + fileName
        } -out ${this.fileService.PATH_TO_TEMP + certificateId}.pem`,
        async (error) => {
          if (error !== null) {
            reject(error);
          } else {
            resolve();
          }
        },
      );
    });
  }

  async add(createCertificateDto: CreateCertificateDto) {
    let fileName = null;

    try {
      const fileExtension = '.' + createCertificateDto.key.split('.').pop();
      const validKey = createCertificateDto.key.split('.').shift();

      const foundCertificate = await this.certificateRepository.findOne({
        where: {
          key: validKey,
        },
      });

      if (foundCertificate) {
        throw new HttpException(
          'This certificate already exists, please update or delete first',
          HttpStatus.CONFLICT,
        );
      }

      const certificate = new this.certificateRepository({
        key: validKey,
        password: createCertificateDto.password,
      });

      fileName = certificate.id + fileExtension;

      await this.fileService.writeFile(createCertificateDto.data, fileName);
      await this.convertPfxToPem(
        fileName,
        certificate.id,
        createCertificateDto.password, // From DTO because is't encrypted
      );

      await this.fileService.deleteFile(fileName);

      await certificate.save();

      return this.findOne(certificate.id);
    } catch (error) {
      this.logger.error(error);

      // Need's necessary to delete temp file on error
      if (this.fileService.verifyFileExists(fileName)) {
        await this.fileService.deleteFile(fileName);
      }
      throw error;
    }
  }

  async findAll() {
    try {
      const foundCertificates =
        await this.certificateRepository.findAndCountAll();

      return foundCertificates;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async findOne(id: string) {
    try {
      const foundCertificate = await this.certificateRepository.findByPk(id);

      if (!foundCertificate) {
        throw new HttpException('Certificate not found', HttpStatus.NOT_FOUND);
      }

      return foundCertificate;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async update(id: string, updateCertificateDto: UpdateCertificateDto) {
    let fileName = null;

    try {
      const foundCertificate = await this.findOne(id);

      fileName = foundCertificate.id + '.pem';

      if (this.fileService.verifyFileExists(fileName)) {
        await this.fileService.deleteFile(fileName);
      }

      const fileExtension = '.' + updateCertificateDto.key.split('.').pop();
      const validKey = updateCertificateDto.key.split('.').shift();

      fileName = foundCertificate.id + fileExtension;

      await this.fileService.writeFile(updateCertificateDto.data, fileName);
      await this.convertPfxToPem(
        fileName,
        foundCertificate.id,
        updateCertificateDto.password, // From DTO because is't encrypted
      );

      const updatedCertificate = await this.certificateRepository.update(
        {
          key: validKey,
          password: updateCertificateDto.password,
        },
        {
          where: {
            id: foundCertificate.id,
          },
          returning: true,
          individualHooks: true,
        },
      );

      await this.fileService.deleteFile(fileName);

      return await this.certificateRepository.findByPk(
        updatedCertificate[1][0].id,
      );
    } catch (error) {
      this.logger.error(error);

      // Need's necessary to delete temp file on error
      if (this.fileService.verifyFileExists(fileName)) {
        await this.fileService.deleteFile(fileName);
      }
      throw error;
    }
  }

  async remove(id: string) {
    try {
      const foundCertificate = await this.findOne(id);

      const fileName = foundCertificate.id + '.pem';

      if (this.fileService.verifyFileExists(fileName)) {
        await this.fileService.deleteFile(fileName);
      }

      await this.certificateRepository.destroy({
        where: {
          id: foundCertificate.id,
        },
      });
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }
}
