import { Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AnnouncementPermissionScheduler } from '@context/announcement-context/announcement-permission.scheduler';
import { WikiPermissionScheduler } from '@context/wiki-context/wiki-permission.scheduler';

/**
 * 권한 검증 관리자 컨트롤러
 * 
 * 수동으로 권한 검증 배치 작업을 실행할 수 있는 API를 제공합니다.
 */
@ApiTags('공통. 관리자 - 권한 검증')
@ApiBearerAuth('Bearer')
@Controller('admin/permission-validation')
export class PermissionValidationController {
  constructor(
    private readonly announcementScheduler: AnnouncementPermissionScheduler,
    private readonly wikiScheduler: WikiPermissionScheduler,
  ) {}

  /**
   * 위키 권한 검증 즉시 실행
   */
  @Post('wiki')
  @ApiOperation({
    summary: '위키 권한 검증 즉시 실행',
    description: '모든 위키의 권한을 즉시 검증하고 무효한 부서 정보를 처리합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '권한 검증 완료',
    schema: {
      example: {
        success: true,
        message: '위키 권한 검증이 완료되었습니다.',
        timestamp: '2026-01-15T10:30:00.000Z',
      },
    },
  })
  async 위키_권한_검증_실행() {
    await this.wikiScheduler.모든_위키_권한을_검증한다();

    return {
      success: true,
      message: '위키 권한 검증이 완료되었습니다.',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 공지사항 권한 검증 즉시 실행
   */
  @Post('announcement')
  @ApiOperation({
    summary: '공지사항 권한 검증 즉시 실행',
    description: '모든 공지사항의 권한을 즉시 검증하고 무효한 부서/직원 정보를 처리합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '권한 검증 완료',
    schema: {
      example: {
        success: true,
        message: '공지사항 권한 검증이 완료되었습니다.',
        timestamp: '2026-01-15T10:30:00.000Z',
      },
    },
  })
  async 공지사항_권한_검증_실행() {
    await this.announcementScheduler.모든_공지사항_권한을_검증한다();

    return {
      success: true,
      message: '공지사항 권한 검증이 완료되었습니다.',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 모든 권한 검증 즉시 실행 (위키 + 공지사항)
   */
  @Post('all')
  @ApiOperation({
    summary: '모든 권한 검증 즉시 실행',
    description: '위키와 공지사항의 모든 권한을 즉시 검증합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '권한 검증 완료',
    schema: {
      example: {
        success: true,
        message: '모든 권한 검증이 완료되었습니다.',
        results: {
          wiki: '완료',
          announcement: '완료',
        },
        timestamp: '2026-01-15T10:30:00.000Z',
      },
    },
  })
  async 모든_권한_검증_실행() {
    // 병렬 실행
    await Promise.all([
      this.wikiScheduler.모든_위키_권한을_검증한다(),
      this.announcementScheduler.모든_공지사항_권한을_검증한다(),
    ]);

    return {
      success: true,
      message: '모든 권한 검증이 완료되었습니다.',
      results: {
        wiki: '완료',
        announcement: '완료',
      },
      timestamp: new Date().toISOString(),
    };
  }
}
