import {
  Processor,
  Process,
  OnQueueActive,
  OnQueueCompleted,
  OnQueueFailed,
} from '@nestjs/bull';
import { Job } from 'bull';
import { SIGN_QUEUE } from './constants';
import { SignDto } from './dto/sign.dto';
import { Injectable, Logger } from '@nestjs/common';
import { SignService } from './sign.service';

@Injectable()
@Processor(SIGN_QUEUE)
export class SignProcessor {
  private readonly logger = new Logger(SignProcessor.name);

  constructor(private signService: SignService) {}

  @Process()
  async sign(job: Job<SignDto>) {
    return await this.signService.sign(job.data);
  }

  @OnQueueActive()
  onActive(job: Job) {
    this.logger.log(`Processing job ${job.id} of type ${job.name}`);
  }

  @OnQueueCompleted()
  onCompleted(job: Job) {
    // TO DO: send to upload service
    console.log(job.returnvalue);
    this.logger.log(`Complete job ${job.id} of type ${job.name}`);
  }

  @OnQueueFailed()
  onFailed(job: Job) {
    this.logger.error(`Job ${job.id} of type ${job.name} was failed`);
  }
}
