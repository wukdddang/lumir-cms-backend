import { Module } from '@nestjs/common';
import { AuthContextModule } from '@context/auth-context';
import { UserAnnouncementController } from './announcement.controller';
import { AnnouncementBusinessModule } from '@business/announcement-business/announcement-business.module';

@Module({
  imports: [
    AuthContextModule,
    AnnouncementBusinessModule,
  ],
  controllers: [UserAnnouncementController],
})
export class UserAnnouncementModule {}
