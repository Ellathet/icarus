import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { CreateCertificateDto } from './dto/create-certificate.dto';
import { UpdateCertificateDto } from './dto/update-certificate.dto';
import { FileService } from '../common/file/file.service';
import {
  Certificate,
  WITH_PASSWORD_SCOPE,
} from './entities/certificate.entity';
import { InjectModel } from '@nestjs/sequelize';
import { exec } from 'child_process';
import { Op } from 'sequelize';
import * as _ from 'lodash';
import * as which from 'which';

@Injectable()
export class CertificateService {
  private readonly logger = new Logger(CertificateService.name);

  constructor(
    private fileService: FileService,

    @InjectModel(Certificate)
    private certificateRepository: typeof Certificate,
  ) {}

  private async getOpenssl() {
    try {
      return await which('openssl');
    } catch (error) {
      throw new HttpException(
        'Open SSL is not installed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async convertPfxToPem(
    fileName: string,
    certificateId: string,
    password: string,
  ) {
    const opensslBin = await this.getOpenssl();
    await new Promise<void>((resolve, reject) => {
      // double "" because in windows it can contain spaces in path of bin
      exec(
        `"${opensslBin}" pkcs12 -passin pass:${password} -clcerts -nokeys -in ${
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

  async convertPfxToKey(
    fileName: string,
    certificateId: string,
    password: string,
  ) {
    const opensslBin = await this.getOpenssl();
    await new Promise<void>((resolve, reject) => {
      // double "" because in windows it can contain spaces in path of bin
      exec(
        `"${opensslBin}" pkcs12 -passin pass:${password} -passout pass:${password} -nocerts -in ${
          this.fileService.PATH_TO_TEMP + fileName
        } -out ${this.fileService.PATH_TO_TEMP + certificateId}.key`,
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

  async convertKeyToPemKey(
    fileName: string,
    certificateId: string,
    password: string,
  ) {
    const opensslBin = await this.getOpenssl();
    await new Promise<void>((resolve, reject) => {
      // double "" because in windows it can contain spaces in path of bin
      exec(
        `"${opensslBin}" rsa -passin pass:${password} -in ${
          this.fileService.PATH_TO_TEMP + fileName.split('.').shift() + '.key'
        } -out ${this.fileService.PATH_TO_TEMP + certificateId}-key.pem`,
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

  async genKeys(fileName: string, certificateId: string, password: string) {
    await this.convertPfxToPem(fileName, certificateId, password);
    await this.convertPfxToKey(fileName, certificateId, password);
    await this.convertKeyToPemKey(fileName, certificateId, password);
  }

  async add(createCertificateDto: CreateCertificateDto) {
    let fileName = null;
    let fileKeyName = null;

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

      await this.genKeys(
        fileName,
        certificate.id,
        createCertificateDto.password, // From DTO because is't encrypted
      );

      fileKeyName = fileName.split('.').shift() + '.key';

      await this.fileService.deleteFile(fileName);
      await this.fileService.deleteFile(fileKeyName);

      await certificate.save();

      return this.findOne(certificate.id);
    } catch (error) {
      this.logger.error(error);

      // Need's necessary to delete temp file on error
      if (this.fileService.verifyFileExists(fileName)) {
        await this.fileService.deleteFile(fileName);
      }

      if (this.fileService.verifyFileExists(fileKeyName)) {
        await this.fileService.deleteFile(fileKeyName);
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

  async getByKeys(keys: string[]) {
    try {
      const foundCertificates = await this.certificateRepository
        .scope(WITH_PASSWORD_SCOPE)
        .findAll({
          where: {
            key: {
              [Op.in]: keys,
            },
          },
        });

      if (foundCertificates.length < 0) {
        throw new HttpException(
          'No certificates founded',
          HttpStatus.NOT_FOUND,
        );
      }

      return foundCertificates;
    } catch (error) {
      throw error;
    }
  }

  async verifyExistsCertificates(
    certificates: string[],
  ): Promise<Certificate[]> {
    try {
      const foundCertificates = await this.getByKeys(certificates);

      const certificatesKeys = foundCertificates.map(({ key }) => key);

      const notExistsKeys = _.difference(certificatesKeys, certificates).concat(
        _.difference(certificates, certificatesKeys),
      );

      if (notExistsKeys.length > 0) {
        throw new HttpException(
          `Certificates: ${notExistsKeys.join(',')}, do not exist`,
          HttpStatus.NOT_FOUND,
        );
      }

      return foundCertificates;
    } catch (error) {
      throw error;
    }
  }

  async update(id: string, updateCertificateDto: UpdateCertificateDto) {
    let fileName = null;
    let fileKeyName = null;

    try {
      const foundCertificate = await this.findOne(id);

      fileName = foundCertificate.id + '.pem';
      fileKeyName = foundCertificate.id + '-key' + '.pem';

      if (this.fileService.verifyFileExists(fileName)) {
        await this.fileService.deleteFile(fileName);
      }

      if (this.fileService.verifyFileExists(fileKeyName)) {
        await this.fileService.deleteFile(fileKeyName);
      }

      const fileExtension = '.' + updateCertificateDto.key.split('.').pop();
      const validKey = updateCertificateDto.key.split('.').shift();

      fileName = foundCertificate.id + fileExtension;

      await this.fileService.writeFile(updateCertificateDto.data, fileName);
      await this.genKeys(
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
      await this.fileService.deleteFile(fileName.split('.').shift() + '.key');

      return await this.certificateRepository.findByPk(
        updatedCertificate[1][0].id,
      );
    } catch (error) {
      this.logger.error(error);

      // Need's necessary to delete temp file on error
      if (this.fileService.verifyFileExists(fileName)) {
        await this.fileService.deleteFile(fileName);
      }

      if (this.fileService.verifyFileExists(fileKeyName)) {
        await this.fileService.deleteFile(fileKeyName);
      }

      throw error;
    }
  }

  async remove(id: string) {
    try {
      const foundCertificate = await this.findOne(id);

      const fileName = foundCertificate.id + '.pem';
      const fileKeyName = foundCertificate.id + '-key' + '.pem';

      if (this.fileService.verifyFileExists(fileName)) {
        await this.fileService.deleteFile(fileName);
      }

      if (this.fileService.verifyFileExists(fileKeyName)) {
        await this.fileService.deleteFile(fileKeyName);
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
