import { z } from 'zod';
import { Helpers } from '../../helpers/helpers';
import { createZodDto } from 'nestjs-zod';

const validFileNameRegex = /^[a-zA-Z0-9-_]+(\.[a-zA-Z0-9]+)?$/;

const CreateCertificateSchema = z.object({
  password: z.string(),
  key: z.string().regex(validFileNameRegex),
  data: z.string().refine(Helpers.isValidBase64),
});

export class CreateCertificateDto extends createZodDto(
  CreateCertificateSchema,
) {}
