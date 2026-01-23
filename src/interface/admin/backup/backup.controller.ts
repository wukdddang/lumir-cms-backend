import {
  Controller,
  Post,
  Get,
  Query,
  Logger,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
  ApiExcludeController,
} from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard } from '@interface/common/guards';
import { Roles } from '@interface/common/decorators';
import { BackupService } from '@context/backup-context/backup.service';
import { BackupRetentionService } from '@context/backup-context/backup-retention.service';
import { BackupType } from '@context/backup-context/backup.types';

/**
 * 백업 관리 컨트롤러
 *
 * 데이터베이스 백업을 수동으로 실행하고 관리할 수 있는 API를 제공합니다.
 */
@ApiExcludeController()
@ApiBearerAuth('Bearer')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/backup')
export class BackupController {
  private readonly logger = new Logger(BackupController.name);

  constructor(
    private readonly backupService: BackupService,
    private readonly retentionService: BackupRetentionService,
  ) {}

  /**
   * 수동 백업 실행
   */
  @Post('execute')
  @ApiOperation({
    summary: '수동 백업 실행',
    description: '지정한 타입의 백업을 즉시 실행합니다.',
  })
  @ApiQuery({
    name: 'type',
    enum: BackupType,
    description: '백업 타입',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: '백업 실행 완료',
    schema: {
      example: {
        success: true,
        message: '백업이 성공적으로 완료되었습니다.',
        result: {
          type: 'daily',
          filename: 'backup_daily_20260121_153045.sql.gz',
          size: 262144,
          originalSize: 1048576,
          compressionRatio: 75,
          timestamp: '2026-01-21T15:30:45.123Z',
        },
      },
    },
  })
  async executeBackup(@Query('type') type: BackupType) {
    this.logger.log(`수동 백업 실행 요청: ${type}`);

    const result = await this.backupService.createBackup(type);

    if (result.success) {
      return {
        success: true,
        message: '백업이 성공적으로 완료되었습니다.',
        result: {
          type: result.type,
          filename: result.filename,
          size: result.size,
          originalSize: result.originalSize,
          compressionRatio: result.compressionRatio,
          timestamp: result.timestamp,
        },
      };
    } else {
      return {
        success: false,
        message: '백업 실행 중 오류가 발생했습니다.',
        error: result.error,
      };
    }
  }

  /**
   * 모든 타입의 백업을 순차적으로 실행
   */
  @Post('execute-all')
  @ApiOperation({
    summary: '모든 백업 타입 실행',
    description: '모든 백업 타입을 순차적으로 실행합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '모든 백업 실행 완료',
    schema: {
      example: {
        success: true,
        message: '모든 백업이 완료되었습니다.',
        results: [
          {
            type: 'four_hourly',
            success: true,
            filename: 'backup_four_hourly_20260121_153045.sql.gz',
          },
        ],
      },
    },
  })
  async executeAllBackups() {
    this.logger.log('모든 백업 타입 실행 요청');

    const results: Array<{
      type: BackupType;
      success: boolean;
      filename: string;
      error?: string;
    }> = [];
    for (const type of Object.values(BackupType)) {
      const result = await this.backupService.createBackup(type);
      results.push({
        type: result.type,
        success: result.success,
        filename: result.filename,
        error: result.error,
      });
    }

    const successCount = results.filter((r) => r.success).length;

    return {
      success: successCount === results.length,
      message: `모든 백업이 완료되었습니다. (성공: ${successCount}/${results.length})`,
      results,
    };
  }

  /**
   * 백업 목록 조회
   */
  @Get('list')
  @ApiOperation({
    summary: '백업 목록 조회',
    description: '저장된 백업 목록을 조회합니다.',
  })
  @ApiQuery({
    name: 'type',
    enum: BackupType,
    description: '백업 타입 (선택사항)',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: '백업 목록 조회 성공',
    schema: {
      example: {
        success: true,
        backups: [
          {
            type: 'daily',
            filename: 'backup_daily_20260121_010000.sql.gz',
            createdAt: '2026-01-21T01:00:00.000Z',
            expiresAt: '2026-02-20T01:00:00.000Z',
          },
        ],
      },
    },
  })
  async listBackups(@Query('type') type?: BackupType) {
    const backups = await this.retentionService.listBackups(type);

    return {
      success: true,
      count: backups.length,
      backups,
    };
  }

  /**
   * 백업 통계 조회
   */
  @Get('statistics')
  @ApiOperation({
    summary: '백업 통계 조회',
    description: '백업 타입별 통계 정보를 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '백업 통계 조회 성공',
    schema: {
      example: {
        success: true,
        statistics: {
          byType: {
            four_hourly: {
              count: 6,
              totalSize: 6291456,
              oldestBackup: '2026-01-21T00:00:00.000Z',
            },
          },
          total: {
            count: 20,
            totalSize: 20971520,
          },
        },
      },
    },
  })
  async getStatistics() {
    const statistics = await this.retentionService.getStatistics();

    return {
      success: true,
      statistics,
    };
  }

  /**
   * 만료된 백업 정리
   */
  @Post('cleanup')
  @ApiOperation({
    summary: '만료된 백업 정리',
    description: '보관 기간이 지난 백업을 삭제합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '백업 정리 완료',
    schema: {
      example: {
        success: true,
        message: '만료된 백업 정리가 완료되었습니다.',
        result: {
          total: 30,
          deleted: 10,
          errors: 0,
        },
      },
    },
  })
  async cleanupExpiredBackups() {
    this.logger.log('만료된 백업 정리 요청');

    const result = await this.retentionService.applyRetentionPolicies();

    return {
      success: true,
      message: '만료된 백업 정리가 완료되었습니다.',
      result,
    };
  }

  /**
   * 백업 설정 조회
   */
  @Get('config')
  @ApiOperation({
    summary: '백업 설정 조회',
    description: '현재 백업 설정을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '백업 설정 조회 성공',
    schema: {
      example: {
        success: true,
        config: {
          enabled: true,
          path: './backups/database',
          maxRetries: 3,
          retryDelayMs: 5000,
          compress: true,
        },
      },
    },
  })
  async getConfig() {
    const config = this.backupService.getConfig();

    return {
      success: true,
      config,
    };
  }
}
