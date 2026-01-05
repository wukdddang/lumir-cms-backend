import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Department } from './department.entity';
import { DepartmentService } from './department.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Department]),
    ConfigModule,
  ],
  providers: [
    DepartmentService,
  ],
  exports: [
    DepartmentService,
  ],
})
export class DepartmentModule {}
