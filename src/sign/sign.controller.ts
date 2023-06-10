import { Controller, Post, Body } from '@nestjs/common';
import { SignService } from './sign.service';
import { SignDto } from './dto/sign.dto';

@Controller('sign')
export class SignController {
  constructor(private readonly signService: SignService) {}

  @Post()
  sign(@Body() signDto: SignDto) {
    return this.signService.addToQueue(signDto);
  }
}
