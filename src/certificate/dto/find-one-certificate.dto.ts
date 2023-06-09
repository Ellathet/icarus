import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

const FindOneCertificateParamsSchema = z.object({
  id: z.string().uuid(),
});

export class FindOneCertificateParamsDto extends createZodDto(
  FindOneCertificateParamsSchema,
) {}
