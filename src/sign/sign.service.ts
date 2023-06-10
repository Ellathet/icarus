import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { SignDto } from './dto/sign.dto';
import { CertificateService } from '../certificate/certificate.service';
import { exec } from 'child_process';
import * as which from 'which';
import { FileService } from '../common/file/file.service';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { CryptoService } from '../common/crypto/crypto.service';
import { InjectQueue } from '@nestjs/bull';
import { SIGN_QUEUE } from './constants';
import { Queue } from 'bull';

@Injectable()
export class SignService {
  constructor(
    private fileService: FileService,
    private certificateService: CertificateService,
    private cryptoService: CryptoService,

    @InjectQueue(SIGN_QUEUE)
    private signQueue: Queue,
  ) {}

  private OPEN_PDF_SIGN_PATH: string = path.join(
    __dirname,
    '../../java/open-pdf-sign.jar',
  );

  private async getJava(): Promise<string> {
    try {
      return await which('java');
    } catch (error) {
      throw new HttpException(
        'Java is not installed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async signPdf(pdfName: string, certificateId: string, password: string) {
    const javaBin = await this.getJava();
    await new Promise<void>((resolve, reject) => {
      exec(
        // double "" because in windows it can contain spaces in path of bin
        `"${javaBin}" -jar ${this.OPEN_PDF_SIGN_PATH} -i ${
          this.fileService.PATH_TO_TEMP + pdfName
        } -o ${this.fileService.PATH_TO_TEMP + 'signed-' + pdfName} -k ${
          this.fileService.PATH_TO_TEMP + certificateId
        }-key.pem -c ${
          this.fileService.PATH_TO_TEMP + certificateId
        }.pem --passphrase ${password}`,
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

  async addToQueue(signDto: SignDto) {
    await this.signQueue.add(signDto);
  }

  async sign(signDto: SignDto) {
    const pdfName = randomUUID() + '.pdf';

    try {
      const foundCertificates =
        await this.certificateService.verifyExistsCertificates(
          signDto.certificates,
        );

      await this.fileService.writeFile(signDto.data, pdfName);

      await Promise.all(
        signDto.certificates.map(async (key) => {
          const certificate = foundCertificates.find(({ key: k }) => k === key);

          await this.signPdf(
            pdfName,
            certificate.id,
            this.cryptoService.decrypt(certificate.password),
          );

          await this.fileService.renameFile('signed-' + pdfName, pdfName);
        }),
      );

      return pdfName;
    } catch (error) {
      if (this.fileService.verifyFileExists(pdfName)) {
        this.fileService.deleteFile(pdfName);
      }

      throw error;
    }
  }
}
