import { z } from 'zod';
import { Helpers } from '../../helpers/helpers';
import { createZodDto } from 'nestjs-zod';

const SignSchema = z.object({
  certificates: z.array(z.string()),
  data: z.string().refine(Helpers.isValidBase64),
});

export class SignDto extends createZodDto(SignSchema) {}
