import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CertificateService } from './certificate.service';
import { CreateCertificateDto } from './dto/create-certificate.dto';
import {
  UpdateCertificateDto,
  UpdateCertificateParamsDto,
} from './dto/update-certificate.dto';
import { FindOneCertificateParamsDto } from './dto/find-one-certificate.dto';
import { DeleteCertificateParamsDto } from './dto/delete-certificate.dto';

@Controller('certificate')
export class CertificateController {
  constructor(private readonly certificateService: CertificateService) {}

  @Post()
  add(@Body() createCertificateDto: CreateCertificateDto) {
    return this.certificateService.add(createCertificateDto);
  }

  @Get()
  findAll() {
    return this.certificateService.findAll();
  }

  @Get(':id')
  findOne(@Param() { id }: FindOneCertificateParamsDto) {
    return this.certificateService.findOne(id);
  }

  @HttpCode(HttpStatus.OK)
  @Put(':id')
  update(
    @Param() { id }: UpdateCertificateParamsDto,
    @Body() updateCertificateDto: UpdateCertificateDto,
  ) {
    return this.certificateService.update(id, updateCertificateDto);
  }

  @HttpCode(HttpStatus.OK)
  @Delete(':id')
  remove(@Param() { id }: DeleteCertificateParamsDto) {
    return this.certificateService.remove(id);
  }
}
