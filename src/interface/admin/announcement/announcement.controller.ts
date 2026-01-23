import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Patch,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { CurrentUser } from '@interface/common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@interface/common/decorators/current-user.decorator';
import { JwtAuthGuard, RolesGuard } from '@interface/common/guards';
import { Roles } from '@interface/common/decorators';
import { AnnouncementBusinessService } from '@business/announcement-business/announcement-business.service';
import { AnnouncementPermissionScheduler } from '@context/announcement-context/announcement-permission.scheduler';
import { CreateAnnouncementDto } from '@interface/common/dto/announcement/create-announcement.dto';
import {
  UpdateAnnouncementDto,
  UpdateAnnouncementPublicDto,
  UpdateAnnouncementFixedDto,
  UpdateAnnouncementOrderDto,
  CreateAnnouncementCategoryDto,
  UpdateAnnouncementCategoryDto,
  UpdateAnnouncementCategoryOrderDto,
} from '@interface/common/dto/announcement/update-announcement.dto';
import { UpdateAnnouncementBatchOrderDto } from '@interface/common/dto/announcement/update-announcement-batch-order.dto';
import {
  AnnouncementResponseDto,
  AnnouncementListResponseDto,
  AnnouncementCategoryResponseDto,
  AnnouncementCategoryListResponseDto,
} from '@interface/common/dto/announcement/announcement-response.dto';
import { AnnouncementSurveyStatisticsResponseDto } from '@interface/common/dto/announcement/announcement-statistics-response.dto';
import { ReplaceAnnouncementPermissionsDto } from './dto/replace-announcement-permissions.dto';
import { DismissPermissionLogsDto } from './dto/dismiss-permission-logs.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { AnnouncementPermissionLog } from '@domain/core/announcement/announcement-permission-log.entity';
import { AnnouncementPermissionAction } from '@domain/core/announcement/announcement-permission-action.types';
import { DismissedPermissionLog } from '@domain/common/dismissed-permission-log/dismissed-permission-log.entity';
import { DismissedPermissionLogType } from '@domain/common/dismissed-permission-log/dismissed-permission-log.types';

@ApiTags('A-9. 관리자 - 공지사항')
@ApiBearerAuth('Bearer')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/announcements')
export class AnnouncementController {
  constructor(
    private readonly announcementBusinessService: AnnouncementBusinessService,
    private readonly announcementPermissionScheduler: AnnouncementPermissionScheduler,
    @InjectRepository(AnnouncementPermissionLog)
    private readonly permissionLogRepository: Repository<AnnouncementPermissionLog>,
    @InjectRepository(DismissedPermissionLog)
    private readonly dismissedLogRepository: Repository<DismissedPermissionLog>,
  ) {}

  /**
   * 공지사항 목록을 조회한다 (비고정 공지만)
   */
  @Get()
  @ApiOperation({
    summary: '공지사항 목록 조회 (비고정 공지)',
    description: '비고정 공지사항 목록을 조회합니다. isFixed=false인 공지사항만 반환됩니다.',
  })
  @ApiResponse({
    status: 200,
    description: '공지사항 목록 조회 성공',
    type: AnnouncementListResponseDto,
  })
  @ApiQuery({
    name: 'isPublic',
    required: false,
    description: '공개 여부 필터',
    type: Boolean,
  })
  @ApiQuery({
    name: 'orderBy',
    required: false,
    description: '정렬 기준 (order: 정렬순서, createdAt: 생성일시)',
    enum: ['order', 'createdAt'],
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: '페이지 번호 (기본값: 1)',
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: '페이지당 개수 (기본값: 10)',
    type: Number,
    example: 10,
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: '시작일 (YYYY-MM-DD 형식)',
    type: String,
    example: '2024-01-01',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: '종료일 (YYYY-MM-DD 형식)',
    type: String,
    example: '2024-12-31',
  })
  async 공지사항_목록을_조회한다(
    @Query('isPublic') isPublic?: string,
    @Query('orderBy') orderBy?: 'order' | 'createdAt',
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<AnnouncementListResponseDto> {
    const isPublicFilter =
      isPublic === 'true' ? true : isPublic === 'false' ? false : undefined;
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;

    const result =
      await this.announcementBusinessService.공지사항_목록을_조회한다({
        isPublic: isPublicFilter,
        isFixed: false, // 비고정 공지만 조회
        orderBy: orderBy || 'order',
        page: pageNum,
        limit: limitNum,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      });

    // permissionDepartmentIds가 비어있는 항목이 있는지 확인하고 비동기로 권한 검증 배치 실행
    const hasEmptyPermissionDepartmentIds = result.items.some(
      (item) =>
        !item.permissionDepartmentIds ||
        item.permissionDepartmentIds.length === 0,
    );

    if (hasEmptyPermissionDepartmentIds) {
      // 비동기로 권한 검증 배치 실행 (응답을 기다리지 않음)
      this.announcementPermissionScheduler
        .모든_공지사항_권한을_검증한다()
        .catch((error) => {
          // 에러 로깅만 하고 응답에는 영향 없음
          console.error('권한 검증 배치 실행 중 오류:', error);
        });
    }

    return {
      items: result.items.map((item) => ({
        ...item,
        hasSurvey: !!item.survey,
      })),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: Math.ceil(result.total / result.limit),
    };
  }

  /**
   * 고정 공지사항 목록을 조회한다
   */
  @Get('fixed')
  @ApiOperation({
    summary: '고정 공지사항 목록 조회',
    description: '고정 공지사항 목록을 조회합니다. isFixed=true인 공지사항만 반환됩니다.',
  })
  @ApiResponse({
    status: 200,
    description: '고정 공지사항 목록 조회 성공',
    type: AnnouncementListResponseDto,
  })
  @ApiQuery({
    name: 'isPublic',
    required: false,
    description: '공개 여부 필터',
    type: Boolean,
  })
  @ApiQuery({
    name: 'orderBy',
    required: false,
    description: '정렬 기준 (order: 정렬순서, createdAt: 생성일시)',
    enum: ['order', 'createdAt'],
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: '페이지 번호 (기본값: 1)',
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: '페이지당 개수 (기본값: 10)',
    type: Number,
    example: 10,
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: '시작일 (YYYY-MM-DD 형식)',
    type: String,
    example: '2024-01-01',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: '종료일 (YYYY-MM-DD 형식)',
    type: String,
    example: '2024-12-31',
  })
  async 고정_공지사항_목록을_조회한다(
    @Query('isPublic') isPublic?: string,
    @Query('orderBy') orderBy?: 'order' | 'createdAt',
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<AnnouncementListResponseDto> {
    const isPublicFilter =
      isPublic === 'true' ? true : isPublic === 'false' ? false : undefined;
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;

    const result =
      await this.announcementBusinessService.고정_공지사항_목록을_조회한다({
        isPublic: isPublicFilter,
        orderBy: orderBy || 'order',
        page: pageNum,
        limit: limitNum,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      });

    // permissionDepartmentIds가 비어있는 항목이 있는지 확인하고 비동기로 권한 검증 배치 실행
    const hasEmptyPermissionDepartmentIds = result.items.some(
      (item) =>
        !item.permissionDepartmentIds ||
        item.permissionDepartmentIds.length === 0,
    );

    if (hasEmptyPermissionDepartmentIds) {
      // 비동기로 권한 검증 배치 실행 (응답을 기다리지 않음)
      this.announcementPermissionScheduler
        .모든_공지사항_권한을_검증한다()
        .catch((error) => {
          // 에러 로깅만 하고 응답에는 영향 없음
          console.error('권한 검증 배치 실행 중 오류:', error);
        });
    }

    return {
      items: result.items.map((item) => ({
        ...item,
        hasSurvey: !!item.survey,
      })),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: Math.ceil(result.total / result.limit),
    };
  }

  /**
   * 공지사항 전체 목록을 조회한다 (페이지네이션 없음)
   */
  @Get('all')
  @ApiOperation({
    summary: '공지사항 전체 목록 조회',
    description: '페이지네이션 없이 모든 공지사항을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '공지사항 전체 목록 조회 성공',
    type: [AnnouncementResponseDto],
  })
  async 공지사항_전체_목록을_조회한다(): Promise<AnnouncementResponseDto[]> {
    const items = await this.announcementBusinessService.공지사항_전체_목록을_조회한다();

    // permissionDepartmentIds가 비어있는 항목이 있는지 확인하고 비동기로 권한 검증 배치 실행
    const hasEmptyPermissionDepartmentIds = items.some(
      (item) =>
        !item.permissionDepartmentIds ||
        item.permissionDepartmentIds.length === 0,
    );

    if (hasEmptyPermissionDepartmentIds) {
      // 비동기로 권한 검증 배치 실행 (응답을 기다리지 않음)
      this.announcementPermissionScheduler
        .모든_공지사항_권한을_검증한다()
        .catch((error) => {
          // 에러 로깅만 하고 응답에는 영향 없음
          console.error('권한 검증 배치 실행 중 오류:', error);
        });
    }

    return items;
  }

  /**
   * 부서 변경 대상 목록을 조회한다
   */
  @Get('department-change-targets')
  @ApiOperation({
    summary: '부서 변경 대상 목록 조회',
    description: 'permissionDepartmentIds가 null이거나 빈 배열인 공지사항 목록을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '부서 변경 대상 목록 조회 성공',
    type: [AnnouncementResponseDto],
  })
  async 부서_변경_대상_목록을_조회한다(): Promise<AnnouncementResponseDto[]> {
    return await this.announcementBusinessService.부서_변경_대상_목록을_조회한다();
  }

  /**
   * 공지사항 카테고리 목록을 조회한다
   */
  @Get('categories')
  @ApiOperation({
    summary: '공지사항 카테고리 목록 조회',
    description: '공지사항 카테고리 목록을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '공지사항 카테고리 목록 조회 성공',
    type: AnnouncementCategoryListResponseDto,
  })
  async 공지사항_카테고리_목록을_조회한다(): Promise<AnnouncementCategoryListResponseDto> {
    const categories =
      await this.announcementBusinessService.공지사항_카테고리_목록을_조회한다();
    return {
      items: categories,
      total: categories.length,
    };
  }

  /**
   * 공지사항 카테고리를 생성한다
   */
  @Post('categories')
  @ApiOperation({
    summary: '공지사항 카테고리 생성',
    description:
      '새로운 공지사항 카테고리를 생성합니다.\n\n' +
      '**필수 필드:**\n' +
      '- `name`: 카테고리 이름\n\n' +
      '**선택 필드:**\n' +
      '- `description`: 카테고리 설명\n' +
      '- `isActive`: 활성화 여부 (기본값: true)\n' +
      '- `order`: 정렬 순서 (기본값: 0)\n\n' +
      '**참고**: `createdBy`는 토큰에서 자동으로 추출됩니다.',
  })
  @ApiResponse({
    status: 201,
    description: '공지사항 카테고리 생성 성공',
    type: AnnouncementCategoryResponseDto,
  })
  async 공지사항_카테고리를_생성한다(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createDto: CreateAnnouncementCategoryDto,
  ): Promise<AnnouncementCategoryResponseDto> {
    return await this.announcementBusinessService.공지사항_카테고리를_생성한다({
      ...createDto,
      createdBy: user.id,
    });
  }

  /**
   * 공지사항 카테고리를 수정한다
   */
  @Patch('categories/:id')
  @ApiOperation({
    summary: '공지사항 카테고리 수정',
    description:
      '공지사항의 카테고리를 수정합니다.\n\n' +
      '**모든 필드 선택사항:**\n' +
      '- `name`: 카테고리 이름\n' +
      '- `description`: 카테고리 설명\n' +
      '- `isActive`: 활성화 여부\n' +
      '- `order`: 정렬 순서\n\n' +
      '**참고**: `updatedBy`는 토큰에서 자동으로 추출됩니다.',
  })
  @ApiParam({
    name: 'id',
    description: '카테고리 ID (UUID)',
    type: String,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: '공지사항 카테고리 수정 성공',
    type: AnnouncementCategoryResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '카테고리를 찾을 수 없음',
  })
  async 공지사항_카테고리를_수정한다(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() updateDto: UpdateAnnouncementCategoryDto,
  ): Promise<AnnouncementCategoryResponseDto> {
    return await this.announcementBusinessService.공지사항_카테고리를_수정한다(
      id,
      {
        ...updateDto,
        updatedBy: user.id,
      },
    );
  }

  /**
   * 공지사항 카테고리 오더를 변경한다
   */
  @Patch('categories/:id/order')
  @ApiOperation({
    summary: '공지사항 카테고리 오더 변경',
    description:
      '공지사항 카테고리의 정렬 순서를 변경합니다.\n\n' +
      '**필수 필드:**\n' +
      '- `order`: 정렬 순서 (숫자)\n\n' +
      '**참고**: `updatedBy`는 토큰에서 자동으로 추출됩니다.',
  })
  @ApiParam({
    name: 'id',
    description: '카테고리 ID (UUID)',
    type: String,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: '공지사항 카테고리 오더 변경 성공',
    type: AnnouncementCategoryResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '카테고리를 찾을 수 없음',
  })
  async 공지사항_카테고리_오더를_변경한다(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() updateDto: UpdateAnnouncementCategoryOrderDto,
  ): Promise<AnnouncementCategoryResponseDto> {
    const result =
      await this.announcementBusinessService.공지사항_카테고리_오더를_변경한다(
        id,
        {
          ...updateDto,
          updatedBy: user.id,
        },
      );
    return result;
  }

  /**
   * 공지사항 카테고리를 삭제한다
   */
  @Delete('categories/:id')
  @ApiOperation({
    summary: '공지사항 카테고리 삭제',
    description: '공지사항 카테고리를 삭제합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '카테고리 ID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: '공지사항 카테고리 삭제 성공',
  })
  @ApiResponse({
    status: 404,
    description: '카테고리를 찾을 수 없음',
  })
  async 공지사항_카테고리를_삭제한다(
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    const result =
      await this.announcementBusinessService.공지사항_카테고리를_삭제한다(id);
    return { success: result };
  }

  /**
   * 모든 공지사항의 권한 로그 목록을 조회한다
   */
  @Get('permission-logs')
  @ApiOperation({
    summary: '공지사항 권한 로그 전체 조회',
    description:
      '모든 공지사항에서 감지된 비활성 부서 목록을 조회합니다. 관리자가 어떤 권한을 교체해야 하는지 확인할 수 있습니다.',
  })
  @ApiQuery({
    name: 'resolved',
    required: false,
    description: '해결 여부 필터 (true: 해결됨, false: 미해결, 미지정: 전체)',
    type: Boolean,
  })
  @ApiResponse({
    status: 200,
    description: '권한 로그 목록 조회 성공',
  })
  async 공지사항_권한_로그를_조회한다(
    @Query('resolved') resolvedParam?: string,
  ) {
    const where: any = {};

    // 쿼리 파라미터를 boolean으로 변환
    const resolved = resolvedParam === 'true' ? true : resolvedParam === 'false' ? false : undefined;

    if (resolved === true) {
      where.resolvedAt = Not(IsNull());
    } else if (resolved === false) {
      where.resolvedAt = IsNull();
    }

    return await this.permissionLogRepository.find({
      where,
      order: { detectedAt: 'DESC' },
      relations: ['announcement'],
    });
  }

  /**
   * Dismissed되지 않은 미해결 권한 로그를 조회한다 (모달용)
   */
  @Get('permission-logs/unread')
  @ApiOperation({
    summary: '공지사항 권한 로그 미열람 조회 (모달용)',
    description:
      '관리자가 "다시 보지 않기"를 설정하지 않은 미해결 권한 로그를 조회합니다. ' +
      '모달 표시 여부를 결정하는 데 사용됩니다.',
  })
  @ApiResponse({
    status: 200,
    description: '미열람 권한 로그 목록 조회 성공',
  })
  async 공지사항_미열람_권한_로그를_조회한다(
    @CurrentUser() user: AuthenticatedUser,
  ) {
    // 미해결 로그 조회 (detected 상태)
    const unresolvedLogs = await this.permissionLogRepository.find({
      where: {
        action: AnnouncementPermissionAction.DETECTED,
        resolvedAt: IsNull(),
      },
      order: { detectedAt: 'DESC' },
      relations: ['announcement'],
    });

    // dismissed된 로그 ID 조회
    const dismissedLogs = await this.dismissedLogRepository.find({
      where: {
        logType: DismissedPermissionLogType.ANNOUNCEMENT,
        dismissedBy: user.id,
      },
    });

    const dismissedLogIds = new Set(
      dismissedLogs.map((log) => log.permissionLogId),
    );

    // dismissed되지 않은 로그만 필터링
    return unresolvedLogs.filter((log) => !dismissedLogIds.has(log.id));
  }

  /**
   * 권한 로그를 "다시 보지 않기" 처리한다 (배치)
   */
  @Patch('permission-logs/dismiss')
  @ApiOperation({
    summary: '공지사항 권한 로그 일괄 무시 (다시 보지 않기)',
    description:
      '여러 권한 로그에 대한 모달을 더 이상 표시하지 않도록 설정합니다. ' +
      '권한 로그 관리 페이지에서는 여전히 조회 가능합니다.\n\n' +
      '**필수 필드:**\n' +
      '- `logIds`: 무시할 권한 로그 ID 배열 (UUID[])',
  })
  @ApiResponse({
    status: 200,
    description: '권한 로그 무시 처리 성공',
    schema: {
      example: {
        success: true,
        message: '3개의 권한 로그를 무시 처리했습니다.',
        dismissed: 3,
        alreadyDismissed: 1,
        notFound: 0,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청 (빈 배열 또는 잘못된 UUID)',
  })
  async 공지사항_권한_로그를_무시한다(
    @Body() dto: DismissPermissionLogsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    let dismissedCount = 0;
    let alreadyDismissedCount = 0;
    let notFoundCount = 0;

    for (const logId of dto.logIds) {
      // 권한 로그 존재 확인
      const permissionLog = await this.permissionLogRepository.findOne({
        where: { id: logId },
      });

      if (!permissionLog) {
        notFoundCount++;
        continue;
      }

      // 이미 dismissed 되었는지 확인
      const existing = await this.dismissedLogRepository.findOne({
        where: {
          logType: DismissedPermissionLogType.ANNOUNCEMENT,
          permissionLogId: logId,
          dismissedBy: user.id,
        },
      });

      if (existing) {
        alreadyDismissedCount++;
        continue;
      }

      // Dismissed 로그 생성
      await this.dismissedLogRepository.save({
        logType: DismissedPermissionLogType.ANNOUNCEMENT,
        permissionLogId: logId,
        dismissedBy: user.id,
      });

      dismissedCount++;
    }

    return {
      success: true,
      message: `${dismissedCount}개의 권한 로그를 무시 처리했습니다.`,
      dismissed: dismissedCount,
      alreadyDismissed: alreadyDismissedCount,
      notFound: notFoundCount,
    };
  }

  /**
   * 공지사항을 조회한다
   */
  @Get(':id')
  @ApiOperation({
    summary: '공지사항 상세 조회',
    description: '특정 공지사항의 상세 정보를 조회합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '공지사항 ID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: '공지사항 조회 성공',
    type: AnnouncementResponseDto,
  })
  async 공지사항을_조회한다(
    @Param('id') id: string,
  ): Promise<AnnouncementResponseDto> {
    const announcement =
      await this.announcementBusinessService.공지사항을_조회한다(id);

    // Survey 정보를 포함하여 반환
    return {
      ...announcement,
      survey: announcement.survey
        ? {
            id: announcement.survey.id,
            announcementId: announcement.survey.announcementId,
            title: announcement.survey.title,
            description: announcement.survey.description,
            startDate: announcement.survey.startDate,
            endDate: announcement.survey.endDate,
            order: announcement.survey.order,
            questions:
              announcement.survey.questions?.map((q) => ({
                id: q.id,
                title: q.title,
                type: q.type,
                form: q.form,
                isRequired: q.isRequired,
                order: q.order,
              })) || [],
            createdAt: announcement.survey.createdAt,
            updatedAt: announcement.survey.updatedAt,
          }
        : null,
    };
  }

  /**
   * 공지사항을 생성한다
   */
  @Post()
  @ApiOperation({
    summary: '공지사항 생성',
    description:
      '새로운 공지사항을 생성합니다.\n\n' +
      '**📋 Request Body 작성 가이드:**\n\n' +
      '1. **기본 정보** (필수)\n' +
      '   - `categoryId`: 공지사항 카테고리 ID (UUID) - **필수**\n' +
      '   - `title`: 공지사항 제목\n' +
      '   - `content`: 공지사항 내용 (HTML 지원)\n\n' +
      '2. **공개 설정**\n' +
      '   - `isPublic`: `true`(전사공개) 또는 `false`(제한공개)\n' +
      '   - `isFixed`: 상단 고정 여부\n' +
      '   - `mustRead`: 필독 여부\n' +
      '   - `releasedAt`, `expiredAt`: 공개 기간 (ISO 8601 형식)\n\n' +
      '3. **권한 설정** (제한공개 시)\n' +
      '   - `permissionEmployeeIds`: 특정 직원 ID 배열\n' +
      '   - `permissionDepartmentIds`: 부서 ID 배열\n' +
      '   - `permissionRankIds`: 직급 ID 배열\n' +
      '   - `permissionPositionIds`: 직책 ID 배열\n\n' +
      '4. **설문조사 추가** (선택사항)\n' +
      '   - `survey` 객체에 설문 정보 포함\n' +
      '   - `survey.questions` 배열에 질문 추가\n' +
      '   - 각 질문의 `type`에 따라 필요한 `form` 데이터 다름\n\n' +
      '⚠️ **주의사항:**\n' +
      '- `categoryId`는 필수 필드입니다. GET /admin/announcements/categories로 카테고리 목록을 조회하세요\n' +
      '- 날짜는 ISO 8601 형식 (예: `2024-01-01T00:00:00Z`)\n' +
      '- 설문 질문 타입별로 필요한 `form` 필드가 다릅니다\n' +
      '- 제한공개 시 최소 하나의 권한 필드는 필수입니다\n\n' +
      '**참고**: `createdBy`는 토큰에서 자동으로 추출됩니다.',
  })
  @ApiResponse({
    status: 201,
    description: '공지사항 생성 성공',
    type: AnnouncementResponseDto,
  })
  async 공지사항을_생성한다(
    @Body() dto: CreateAnnouncementDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<AnnouncementResponseDto> {
    // 날짜 변환
    const data = {
      ...dto,
      releasedAt: dto.releasedAt ? new Date(dto.releasedAt) : null,
      expiredAt: dto.expiredAt ? new Date(dto.expiredAt) : null,
      createdBy: user.id,
    };

    return await this.announcementBusinessService.공지사항을_생성한다(data);
  }

  /**
   * 공지사항 오더를 일괄 수정한다
   */
  @Put('batch-order')
  @ApiOperation({
    summary: '공지사항 오더 일괄 수정',
    description:
      '여러 공지사항의 정렬 순서를 한번에 수정합니다. ' +
      '프론트엔드에서 변경된 순서대로 공지사항 목록을 전달하면 됩니다.\n\n' +
      '**필수 필드:**\n' +
      '- `announcements`: 공지사항 ID와 order를 포함한 객체 배열\n' +
      '  - 각 객체: `{ id: string, order: number }`',
  })
  @ApiResponse({
    status: 200,
    description: '공지사항 오더 일괄 수정 성공',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        updatedCount: { type: 'number', example: 5 },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청 (수정할 공지사항이 없음)',
  })
  @ApiResponse({
    status: 404,
    description: '일부 공지사항을 찾을 수 없음',
  })
  async 공지사항_오더를_일괄_수정한다(
    @Body() updateDto: UpdateAnnouncementBatchOrderDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ success: boolean; updatedCount: number }> {
    return await this.announcementBusinessService.공지사항_오더를_일괄_수정한다(
      updateDto.announcements,
      user.id,
    );
  }

  /**
   * 공지사항을 수정한다
   */
  @Put(':id')
  @ApiOperation({
    summary: '공지사항 수정',
    description:
      '공지사항을 수정합니다. (비공개 상태에서만 가능)\n\n' +
      '**📋 Request Body 작성 가이드:**\n\n' +
      '1. **필수 필드**\n' +
      '   - `categoryId`: 공지사항 카테고리 ID (UUID) - **필수**\n\n' +
      '2. **수정 가능한 필드** (선택사항)\n' +
      '   - `title`: 공지사항 제목\n' +
      '   - `content`: 공지사항 내용 (HTML 지원)\n' +
      '   - `isFixed`: 상단 고정 여부\n' +
      '   - `mustRead`: 필독 여부\n' +
      '   - `releasedAt`, `expiredAt`: 공개 기간\n\n' +
      '3. **권한 설정 수정**\n' +
      '   - `isPublic`: 공개 방식 변경\n' +
      '   - `permissionEmployeeIds`: 특정 직원 권한\n' +
      '   - `permissionDepartmentIds`: 부서 권한\n' +
      '   - `permissionRankIds`: 직급 권한\n' +
      '   - `permissionPositionIds`: 직책 권한\n\n' +
      '4. **설문조사 수정/추가**\n' +
      '   - `survey` 객체를 포함하면 기존 설문 수정 또는 새 설문 생성\n' +
      '   - 기존 설문이 있으면 덮어씌워집니다\n\n' +
      '5. **첨부파일 수정**\n' +
      '   - `attachments` 배열을 전송하면 기존 첨부파일 완전 교체\n\n' +
      '⚠️ **주의사항:**\n' +
      '- `categoryId`는 필수 필드입니다. GET /admin/announcements/categories로 카테고리 목록을 조회하세요\n' +
      '- 공개된 공지사항은 수정 불가 (먼저 비공개로 전환 필요)\n' +
      '- 수정하지 않을 필드는 생략 가능합니다\n' +
      '- 날짜는 ISO 8601 형식 사용\n\n' +
      '**참고**: `updatedBy`는 토큰에서 자동으로 추출됩니다.',
  })
  @ApiParam({
    name: 'id',
    description: '공지사항 ID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: '공지사항 수정 성공',
    type: AnnouncementResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '공지사항을 찾을 수 없음',
  })
  @ApiResponse({
    status: 409,
    description: '공개된 공지사항은 수정할 수 없음. 먼저 비공개로 전환 필요',
  })
  async 공지사항을_수정한다(
    @Param('id') id: string,
    @Body() dto: UpdateAnnouncementDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<AnnouncementResponseDto> {
    // 날짜 변환
    const data: any = { ...dto, updatedBy: user.id };
    if (dto.releasedAt) {
      data.releasedAt = new Date(dto.releasedAt);
    }
    if (dto.expiredAt) {
      data.expiredAt = new Date(dto.expiredAt);
    }

    return await this.announcementBusinessService.공지사항을_수정한다(id, data);
  }

  /**
   * 공지사항_공개를_수정한다
   */
  @Patch(':id/public')
  @ApiOperation({
    summary: '공지사항 공개 상태 수정',
    description:
      '공지사항의 공개 상태를 수정합니다.\n\n' +
      '**필수 필드:**\n' +
      '- `isPublic`: 공개 여부 (boolean)\n' +
      '  - `true`: 전사공개\n' +
      '  - `false`: 제한공개\n\n' +
      '**참고**: `updatedBy`는 토큰에서 자동으로 추출됩니다.',
  })
  @ApiParam({
    name: 'id',
    description: '공지사항 ID (UUID)',
    type: String,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: '공지사항 공개 상태 수정 성공',
    type: AnnouncementResponseDto,
  })
  async 공지사항_공개를_수정한다(
    @Param('id') id: string,
    @Body() dto: UpdateAnnouncementPublicDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<AnnouncementResponseDto> {
    return await this.announcementBusinessService.공지사항_공개를_수정한다(
      id,
      dto.isPublic,
      user.id,
    );
  }

  /**
   * 공지사항_고정을_수정한다
   */
  @Patch(':id/fixed')
  @ApiOperation({
    summary: '공지사항 고정 상태 수정',
    description:
      '공지사항의 고정 상태를 수정합니다.\n\n' +
      '**필수 필드:**\n' +
      '- `isFixed`: 고정 여부 (boolean)\n' +
      '  - `true`: 상단 고정\n' +
      '  - `false`: 일반 공지\n\n' +
      '**참고**: `updatedBy`는 토큰에서 자동으로 추출됩니다.',
  })
  @ApiParam({
    name: 'id',
    description: '공지사항 ID (UUID)',
    type: String,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: '공지사항 고정 상태 수정 성공',
    type: AnnouncementResponseDto,
  })
  async 공지사항_고정을_수정한다(
    @Param('id') id: string,
    @Body() dto: UpdateAnnouncementFixedDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<AnnouncementResponseDto> {
    return await this.announcementBusinessService.공지사항_고정을_수정한다(
      id,
      dto.isFixed,
      user.id,
    );
  }

  /**
   * 공지사항을 삭제한다
   */
  @Delete(':id')
  @ApiOperation({
    summary: '공지사항 삭제',
    description: '공지사항을 삭제합니다. (비공개 상태에서만 가능)',
  })
  @ApiParam({
    name: 'id',
    description: '공지사항 ID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: '공지사항 삭제 성공',
  })
  @ApiResponse({
    status: 404,
    description: '공지사항을 찾을 수 없음',
  })
  @ApiResponse({
    status: 409,
    description: '공개된 공지사항은 삭제할 수 없음. 먼저 비공개로 전환 필요',
  })
  async 공지사항을_삭제한다(@Param('id') id: string): Promise<{
    success: boolean;
  }> {
    const result =
      await this.announcementBusinessService.공지사항을_삭제한다(id);
    return { success: result };
  }

  /**
   * 공지사항에 포함된 전체 직원에게 알림을 보낸다
   */
  @Post(':id/notifications/all')
  @ApiOperation({
    summary: '공지사항 포함된 전체 직원에게 알림 전송',
    description:
      '공지사항의 권한 설정을 기반으로 대상 직원 전체에게 알림을 전송합니다. ' +
      '전사공개인 경우 모든 직원에게, 제한공개인 경우 권한이 있는 직원들에게 알림을 전송합니다.\n\n' +
      '**쿼리 파라미터 (선택):**\n' +
      '- `path`: 알림 클릭 시 이동할 URL',
  })
  @ApiParam({
    name: 'id',
    description: '공지사항 ID (UUID)',
    type: String,
    required: true,
  })
  @ApiQuery({
    name: 'path',
    required: false,
    description: '알림 클릭 시 리다이렉트할 전체 URL (http/https로 시작)',
    type: String,
    example: 'https://cms.example.com/announcements/123',
  })
  @ApiResponse({
    status: 200,
    description: '알림 전송 성공',
    schema: {
      properties: {
        success: { type: 'boolean' },
        sentCount: { type: 'number', description: '전송 성공 건수' },
        failedCount: { type: 'number', description: '전송 실패 건수' },
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: '공지사항을 찾을 수 없음',
  })
  async 공지사항에_포함된_전체직원에게_알림을보낸다(
    @Param('id') id: string,
    @Query('path') path?: string,
  ): Promise<{
    success: boolean;
    sentCount: number;
    failedCount: number;
    message: string;
  }> {
    return await this.announcementBusinessService.공지사항에_포함된_전체직원에게_알림을보낸다(
      id,
      path,
    );
  }

  /**
   * 공지사항에 포함된 직원 중 미답변자들에게 알림을 보낸다
   */
  @Post(':id/notifications/unanswered')
  @ApiOperation({
    summary: '공지사항 설문 미답변자에게 알림 전송',
    description:
      '공지사항에 연결된 설문에 아직 응답하지 않은 직원들에게 알림을 전송합니다. ' +
      '설문이 없는 공지사항인 경우 오류를 반환합니다.\n\n' +
      '**쿼리 파라미터 (선택):**\n' +
      '- `path`: 알림 클릭 시 이동할 URL',
  })
  @ApiParam({
    name: 'id',
    description: '공지사항 ID (UUID)',
    type: String,
    required: true,
  })
  @ApiQuery({
    name: 'path',
    required: false,
    description: '알림 클릭 시 리다이렉트할 전체 URL (http/https로 시작)',
    type: String,
    example: 'https://cms.example.com/announcements/123',
  })
  @ApiResponse({
    status: 200,
    description: '알림 전송 성공',
    schema: {
      properties: {
        success: { type: 'boolean' },
        sentCount: { type: 'number', description: '전송 성공 건수' },
        failedCount: { type: 'number', description: '전송 실패 건수' },
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '설문이 없는 공지사항',
  })
  @ApiResponse({
    status: 404,
    description: '공지사항을 찾을 수 없음',
  })
  async 공지사항에_포함된_직원중_미답변자들에게_알림을보낸다(
    @Param('id') id: string,
    @Query('path') path?: string,
  ): Promise<{
    success: boolean;
    sentCount: number;
    failedCount: number;
    message: string;
  }> {
    return await this.announcementBusinessService.공지사항에_포함된_직원중_미답변자들에게_알림을보낸다(
      id,
      path,
    );
  }

  /**
   * 공지사항에 포함된 미열람자들에게 알림을 보낸다
   */
  @Post(':id/notifications/unread')
  @ApiOperation({
    summary: '공지사항 미열람자에게 알림 전송',
    description:
      '공지사항을 아직 읽지 않은 직원들에게 알림을 전송합니다. ' +
      '권한 설정을 기반으로 대상 직원 중 열람하지 않은 직원에게만 알림을 전송합니다.\n\n' +
      '**쿼리 파라미터 (선택):**\n' +
      '- `path`: 알림 클릭 시 이동할 URL',
  })
  @ApiParam({
    name: 'id',
    description: '공지사항 ID (UUID)',
    type: String,
    required: true,
  })
  @ApiQuery({
    name: 'path',
    required: false,
    description: '알림 클릭 시 리다이렉트할 전체 URL (http/https로 시작)',
    type: String,
    example: 'https://cms.example.com/announcements/123',
  })
  @ApiResponse({
    status: 200,
    description: '알림 전송 성공',
    schema: {
      properties: {
        success: { type: 'boolean' },
        sentCount: { type: 'number', description: '전송 성공 건수' },
        failedCount: { type: 'number', description: '전송 실패 건수' },
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: '공지사항을 찾을 수 없음',
  })
  async 공지사항에_포함된_미열람자들에게_알림을보낸다(
    @Param('id') id: string,
    @Query('path') path?: string,
  ): Promise<{
    success: boolean;
    sentCount: number;
    failedCount: number;
    message: string;
  }> {
    return await this.announcementBusinessService.공지사항에_포함된_미열람자들에게_알림을보낸다(
      id,
      path,
    );
  }

  /**
   * 공지사항의 무효한 권한 ID를 새로운 ID로 교체하고 관련 로그를 자동으로 해결 처리한다
   */
  @Patch(':id/replace-permissions')
  @ApiOperation({
    summary: '공지사항 권한 ID 교체 및 로그 해결',
    description:
      '비활성화된 부서/직원 ID를 새로운 ID로 교체합니다. ' +
      '예: 구 마케팅팀(DEPT_001) → 신 마케팅팀(DEPT_002)\n\n' +
      '권한 교체가 완료되면 자동으로 RESOLVED 로그가 생성됩니다.\n\n' +
      '**필수 필드:**\n' +
      '- `replacements`: 교체할 권한 ID 매핑 배열\n' +
      '  - 각 객체: `{ oldId: string, newId: string, type: "department" | "employee" | "rank" | "position" }`',
  })
  @ApiParam({
    name: 'id',
    description: '공지사항 ID (UUID)',
    type: String,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: '권한 ID 교체 성공 및 로그 해결 완료',
  })
  @ApiResponse({
    status: 404,
    description: '공지사항을 찾을 수 없음',
  })
  async 공지사항_권한을_교체한다(
    @Param('id') id: string,
    @Body() dto: ReplaceAnnouncementPermissionsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return await this.announcementBusinessService.공지사항_권한을_교체한다(
      id,
      dto,
      user.id,
    );
  }

  /**
   * 공지사항의 설문조사 통계를 조회한다
   */
  @Get(':id/survey-statistics')
  @ApiOperation({
    summary: '공지사항의 설문조사 통계 조회',
    description:
      '공지사항에 연결된 설문조사의 통계 정보를 조회합니다.\n\n' +
      '- 총 응답 완료자 수\n' +
      '- 각 질문별 응답 통계\n' +
      '  - 선택형: 옵션별 선택 수 및 비율\n' +
      '  - 체크박스: 옵션별 선택 수 및 비율 (다중 선택)\n' +
      '  - 척도: 평균, 최소/최대값, 척도별 분포\n' +
      '  - 텍스트: 응답 수',
  })
  @ApiParam({
    name: 'id',
    description: '공지사항 ID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: '설문조사 통계 조회 성공',
    type: AnnouncementSurveyStatisticsResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '공지사항 또는 설문조사를 찾을 수 없음',
  })
  async 공지사항의_설문조사_통계를_조회한다(
    @Param('id') id: string,
  ): Promise<AnnouncementSurveyStatisticsResponseDto> {
    return await this.announcementBusinessService.공지사항의_설문조사_통계를_조회한다(
      id,
    );
  }
}
