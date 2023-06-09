import * as fs from 'fs';
import * as path from 'path';

export class FileService {
  public PATH_TO_TEMP: string = path.join(__dirname, '../../../', 'tmp/');

  async writeFile(base64: string, fileName: string) {
    const file = Buffer.from(base64, 'base64');
    await fs.promises.writeFile(this.PATH_TO_TEMP + fileName, file);
  }

  async deleteFile(fileName: string) {
    await fs.promises.unlink(this.PATH_TO_TEMP + fileName);
  }

  verifyFileExists(fileName: string) {
    return fs.existsSync(this.PATH_TO_TEMP + fileName);
  }

  getFilePath(fileName: string): string {
    return this.PATH_TO_TEMP + fileName;
  }
}
