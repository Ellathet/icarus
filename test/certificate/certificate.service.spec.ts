import { Sequelize } from 'sequelize-typescript';
import { CertificateService } from '../../src/certificate/certificate.service';
import { createMockDB } from '../mocks/create-mock-db';
import {
  Certificate,
  WITH_PASSWORD_SCOPE,
} from '../../src/certificate/entities/certificate.entity';
import { FileService } from '../../src/common/file/file.service';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { HttpException, HttpStatus } from '@nestjs/common';
import { CryptoService } from '../../src/common/crypto/crypto.service';

describe('CertificateService', () => {
  let certificateService: CertificateService;
  let memDb: Sequelize;
  let fileService: FileService;

  beforeAll(async () => {
    memDb = await createMockDB([Certificate]);

    certificateService = new CertificateService(new FileService(), Certificate);

    fileService = new FileService();
  });

  afterAll(() => memDb.close());

  describe('find', () => {
    beforeEach(async () => {
      await Certificate.create({ key: 'test', password: 'passboor' });
    });

    afterEach(async () => {
      await memDb.truncate();
    });

    it('should return at least one certificate', async () => {
      const foundCertificates = await certificateService.findAll();

      expect(foundCertificates.rows.length > 0).toBeTruthy();
    });

    it('should return a certificate', async () => {
      const foundCertificates = await Certificate.findAll();
      const foundCertificate = await certificateService.findOne(
        foundCertificates[0].id,
      );

      expect(!!foundCertificate).toBeTruthy();
    });

    it('should return a not found', async () => {
      try {
        await certificateService.findOne(randomUUID());
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error).toHaveProperty('status', HttpStatus.NOT_FOUND);
      }
    });

    it('should return a not found when searching by keys', async () => {
      try {
        await certificateService.verifyExistsCertificates([
          randomUUID().toString(),
        ]);
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error).toHaveProperty('status', HttpStatus.NOT_FOUND);
      }
    });

    it('should return a found keys', async () => {
      const foundCertificates = await Certificate.findAll();

      const foundKeys = await certificateService.verifyExistsCertificates([
        foundCertificates[0].key,
      ]);

      expect(foundKeys).toHaveLength(1);
    });
  });

  describe('add', () => {
    afterEach(async () => {
      await memDb.truncate();
    });

    const FILE_NAME = 'example_certificate.pfx';
    const CERTIFICATE_PASSWORD = 'abcd';
    const filePath = path.join(__dirname, '../', 'mocks', FILE_NAME);

    it('should be created a .pem file', async () => {
      await fs.promises.copyFile(
        filePath,
        fileService.PATH_TO_TEMP + FILE_NAME,
      );
      const createdFileName = 'example_certificate';
      await certificateService.convertPfxToPem(
        FILE_NAME,
        createdFileName,
        CERTIFICATE_PASSWORD,
      );

      const createdFileNameWithExtension = createdFileName + '.pem';

      expect(
        fileService.verifyFileExists(createdFileNameWithExtension),
      ).toBeTruthy();

      await fileService.deleteFile(FILE_NAME);
      await fileService.deleteFile(createdFileNameWithExtension);
    });

    it('should be created a .key file', async () => {
      await fs.promises.copyFile(
        filePath,
        fileService.PATH_TO_TEMP + FILE_NAME,
      );
      const createdFileName = 'example_certificate';
      await certificateService.convertPfxToKey(
        FILE_NAME,
        createdFileName,
        CERTIFICATE_PASSWORD,
      );

      const createdFileNameWithExtension = createdFileName + '.key';

      expect(
        fileService.verifyFileExists(createdFileNameWithExtension),
      ).toBeTruthy();

      await fileService.deleteFile(FILE_NAME);
      await fileService.deleteFile(createdFileNameWithExtension);
    });

    it('should be created a .pem key file', async () => {
      await fs.promises.copyFile(
        filePath,
        fileService.PATH_TO_TEMP + FILE_NAME,
      );
      const createdFileName = 'example_certificate';
      await certificateService.convertPfxToKey(
        FILE_NAME,
        createdFileName,
        CERTIFICATE_PASSWORD,
      );

      await certificateService.convertKeyToPemKey(
        FILE_NAME + '.key',
        createdFileName,
        CERTIFICATE_PASSWORD,
      );

      const createdFileNameWithExtension = createdFileName + '-key' + '.pem';

      expect(
        fileService.verifyFileExists(createdFileNameWithExtension),
      ).toBeTruthy();

      await fileService.deleteFile(FILE_NAME);
      await fileService.deleteFile(FILE_NAME.split('.').shift() + '.key');
      await fileService.deleteFile(createdFileNameWithExtension);
    });

    it('should add certificate', async () => {
      const data = await fs.promises.readFile(filePath);
      const base64Data = Buffer.from(data).toString('base64');

      const createdCertificate = await certificateService.add({
        data: base64Data,
        key: 'feather',
        password: CERTIFICATE_PASSWORD,
      });

      const foundCertificate = await Certificate.findByPk(
        createdCertificate.id,
      );

      expect(!!foundCertificate).toBeTruthy();
      expect(
        fileService.verifyFileExists(foundCertificate.id + '.pem'),
      ).toBeTruthy();

      await fileService.deleteFile(foundCertificate.id + '.pem');

      expect(
        fileService.verifyFileExists(foundCertificate.id + '-key' + '.pem'),
      ).toBeTruthy();

      await fileService.deleteFile(foundCertificate.id + '-key' + '.pem');
    });

    it('should return a conflict ', async () => {
      await Certificate.create({
        key: 'feather',
        password: CERTIFICATE_PASSWORD,
      });

      try {
        const data = await fs.promises.readFile(filePath);
        const base64Data = Buffer.from(data).toString('base64');

        await certificateService.add({
          data: base64Data,
          key: 'feather',
          password: CERTIFICATE_PASSWORD,
        });
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error).toHaveProperty('status', HttpStatus.CONFLICT);
      }
    });

    it('should be deleted .pfx file', async () => {
      const data = await fs.promises.readFile(filePath);
      const base64Data = Buffer.from(data).toString('base64');

      const createdCertificate = await certificateService.add({
        data: base64Data,
        key: 'feather',
        password: CERTIFICATE_PASSWORD,
      });

      const foundCertificate = await Certificate.findByPk(
        createdCertificate.id,
      );

      expect(
        fileService.verifyFileExists(foundCertificate.id + '.pfx'),
      ).toBeFalsy();

      await fileService.deleteFile(foundCertificate.id + '.pem');
      await fileService.deleteFile(foundCertificate.id + '-key' + '.pem');
    });

    it('should be deleted .key file', async () => {
      const data = await fs.promises.readFile(filePath);
      const base64Data = Buffer.from(data).toString('base64');

      const createdCertificate = await certificateService.add({
        data: base64Data,
        key: 'feather',
        password: CERTIFICATE_PASSWORD,
      });

      const foundCertificate = await Certificate.findByPk(
        createdCertificate.id,
      );

      expect(
        fileService.verifyFileExists(foundCertificate.id + '.key'),
      ).toBeFalsy();

      await fileService.deleteFile(foundCertificate.id + '.pem');
      await fileService.deleteFile(foundCertificate.id + '-key' + '.pem');
    });

    it('should be saved correctly encrypt password', async () => {
      const data = await fs.promises.readFile(filePath);
      const base64Data = Buffer.from(data).toString('base64');

      const createdCertificate = await certificateService.add({
        data: base64Data,
        key: 'feather',
        password: CERTIFICATE_PASSWORD,
      });

      const foundCertificate = await Certificate.scope(
        WITH_PASSWORD_SCOPE,
      ).findByPk(createdCertificate.id);

      const cryptoService = new CryptoService();

      const decryptPassword = cryptoService.decrypt(foundCertificate.password);

      expect(decryptPassword).toBe(CERTIFICATE_PASSWORD);

      await fileService.deleteFile(createdCertificate.id + '.pem');
      await fileService.deleteFile(createdCertificate.id + '-key' + '.pem');
    });
  });

  // TO DO: Implements update test
  // describe('update', () => {
  //   const FILE_NAME = 'example_certificate.pfx';
  //   const CERTIFICATE_PASSWORD = 'abcd';
  //   const filePath = path.join(__dirname, '../', 'mocks', FILE_NAME);
  //   let createdCertificateId = null;

  //   beforeEach(async () => {
  //     const data = await fs.promises.readFile(filePath);
  //     const base64Data = Buffer.from(data).toString('base64');
  //     const createdCertificate = await certificateService.add({
  //       data: base64Data,
  //       key: 'feather',
  //       password: CERTIFICATE_PASSWORD,
  //     });

  //     createdCertificateId = createdCertificate.id;
  //   });

  //   afterEach(async () => {
  //     await memDb.truncate();
  //     await fileService.deleteFile(createdCertificateId + '.pem');
  //   });

  //   it('should update certificate', async () => {
  //     const data = await fs.promises.readFile(filePath);
  //     const base64Data = Buffer.from(data).toString('base64');

  //     console.log('ID', createdCertificateId);
  //     console.log('Found', await certificateService.findAll());

  //     await certificateService.update(createdCertificateId, {
  //       data: base64Data,
  //       key: 'wings',
  //       password: CERTIFICATE_PASSWORD,
  //     });

  //     const foundCertificate = await Certificate.findByPk(createdCertificateId);

  //     const cryptService = new CryptoService();

  //     expect(foundCertificate.key).toBe('wings');
  //     expect(cryptService.decrypt(foundCertificate.password)).toBe(
  //       CERTIFICATE_PASSWORD,
  //     );
  //     expect(
  //       fileService.verifyFileExists(foundCertificate.id + '.pem'),
  //     ).toBeTruthy();
  //   });
  // });

  describe('delete', () => {
    afterEach(async () => {
      await memDb.truncate();
    });

    let createdCertificate = null;
    const FILE_NAME = 'example_certificate.pfx';
    const CERTIFICATE_PASSWORD = 'abcd';
    const filePath = path.join(__dirname, '../', 'mocks', FILE_NAME);

    beforeEach(async () => {
      const data = await fs.promises.readFile(filePath);
      const base64Data = Buffer.from(data).toString('base64');

      createdCertificate = await certificateService.add({
        data: base64Data,
        key: 'feather',
        password: CERTIFICATE_PASSWORD,
      });
    });

    it('should be deleted .pem file', async () => {
      await certificateService.remove(createdCertificate.id);

      expect(
        fileService.verifyFileExists(createdCertificate.id + '.pem'),
      ).toBeFalsy();
    });

    it('should be deleted .pem key file', async () => {
      await certificateService.remove(createdCertificate.id);

      expect(
        fileService.verifyFileExists(createdCertificate.id + '-key' + '.pem'),
      ).toBeFalsy();
    });

    it('should be deleted certificate in table', async () => {
      await certificateService.remove(createdCertificate.id);
      try {
        await certificateService.findOne(createdCertificate.id);
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error).toHaveProperty('status', HttpStatus.NOT_FOUND);
      }
    });

    it('should be return not found', async () => {
      try {
        await certificateService.remove(randomUUID());
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error).toHaveProperty('status', HttpStatus.NOT_FOUND);
      } finally {
        await certificateService.remove(createdCertificate.id);
      }
    });
  });
});
