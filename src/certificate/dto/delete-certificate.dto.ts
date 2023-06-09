import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

const DeleteCertificateParamsSchema = z.object({
  id: z.string().uuid(),
});

export class DeleteCertificateParamsDto extends createZodDto(
  DeleteCertificateParamsSchema,
) {}
