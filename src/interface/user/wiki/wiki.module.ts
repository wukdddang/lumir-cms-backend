import { Module } from '@nestjs/common';
import { AuthContextModule } from '@context/auth-context';
import { UserWikiController } from './wiki.controller';
import { WikiBusinessModule } from '@business/wiki-business/wiki-business.module';

@Module({
  imports: [
    AuthContextModule,
    WikiBusinessModule,
  ],
  controllers: [UserWikiController],
})
export class UserWikiModule {}
