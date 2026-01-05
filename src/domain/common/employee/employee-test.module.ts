import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Employee } from './employee.entity';
import { EmployeeTestService } from './employee-test.service';
import { Department } from '@domain/common/department/department.entity';

/**
 * 직원 테스트용 모듈
 *
 * 테스트 시 사용할 목데이터 생성 및 관리 기능을 제공합니다.
 * 실제 운영 환경에서는 사용하지 않습니다.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Employee, Department])],
  providers: [EmployeeTestService],
  exports: [EmployeeTestService],
})
export class EmployeeTestModule {}

