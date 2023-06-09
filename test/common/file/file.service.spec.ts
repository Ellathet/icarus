import { TestingModule, Test } from '@nestjs/testing';
import { FileService } from '../../../src/common/file/file.service';
import * as fs from 'fs';
import * as path from 'path';

describe('FileService', () => {
  const FILE_NAME = 'example_file.jpeg';
  const getExampleFile = async (): Promise<string> => {
    const filePath = path.join(
      __dirname,
      '../../',
      'mocks',
      'example_file.txt',
    );
    const data = await fs.promises.readFile(filePath);
    return Buffer.from(data).toString('base64');
  };

  let service: FileService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FileService],
    }).compile();

    service = module.get<FileService>(FileService);
  });

  it('should write file', async () => {
    const exampleFileBase64 = await getExampleFile();
    await service.writeFile(exampleFileBase64, FILE_NAME);
    expect(service.verifyFileExists(FILE_NAME)).toBe(true);
    await service.deleteFile(FILE_NAME);
  });

  it('should delete file', async () => {
    const exampleFileBase64 = await getExampleFile();
    await service.writeFile(exampleFileBase64, FILE_NAME);
    await service.deleteFile(FILE_NAME);
    expect(service.verifyFileExists(FILE_NAME)).toBe(false);
  });

  it('should not be verified file', async () => {
    expect(service.verifyFileExists(FILE_NAME)).toBe(false);
  });

  it('should verified file', async () => {
    expect(service.verifyFileExists('.keep')).toBe(true);
  });

  it('should return the path', async () => {
    expect(service.getFilePath(FILE_NAME)).toBe(
      service.PATH_TO_TEMP + FILE_NAME,
    );
  });
});
