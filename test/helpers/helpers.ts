import * as fs from 'fs';
import * as path from 'path';
import { Helpers } from '../../src/helpers/helpers';

describe('Helpers', () => {
  const getExampleFile = async (): Promise<string> => {
    const filePath = path.join(__dirname, '../', 'mocks', 'example_file.txt');
    const data = await fs.promises.readFile(filePath);
    return Buffer.from(data).toString('base64');
  };

  it('should valide base64', async () => {
    const exampleFileBase64 = await getExampleFile();
    expect(Helpers.isValidBase64(exampleFileBase64)).toBe(true);
  });

  it('should invalided base64', async () => {
    const exampleFileBase64 = await getExampleFile();
    const wrongBase64 = exampleFileBase64.substring(0, 100);
    expect(Helpers.isValidBase64(wrongBase64)).toBe(false);
  });
});
