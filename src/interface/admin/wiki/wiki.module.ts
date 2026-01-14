import { Module } from '@nestjs/common';
import { WikiBusinessModule } from '@business/wiki-business/wiki-business.module';
import { WikiController } from './wiki.controller';

@Module({
  imports: [WikiBusinessModule],
  controllers: [WikiController],
})
export class WikiModule {}
