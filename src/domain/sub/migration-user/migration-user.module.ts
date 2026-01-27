import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MigrationUser } from './migration-user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MigrationUser])],
  exports: [TypeOrmModule],
})
export class MigrationUserModule {}
