import { CreateCertificateDto } from './create-certificate.dto';
import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export class UpdateCertificateDto extends CreateCertificateDto {}

const UpdateCertificateParamsSchema = z.object({
  id: z.string().uuid(),
});

export class UpdateCertificateParamsDto extends createZodDto(
  UpdateCertificateParamsSchema,
) {}
