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
import { ReplaceAnnouncementPermissionsDto } from './dto/replace-announcement-permissions.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { AnnouncementPermissionLog } from '@domain/core/announcement/announcement-permission-log.entity';

@ApiTags('A-9. 관리자 - 공지사항')
@ApiBearerAuth('Bearer')
@Controller('admin/announcements')
export class AnnouncementController {
  constructor(
    private readonly announcementBusinessService: AnnouncementBusinessService,
    private readonly announcementPermissionScheduler: AnnouncementPermissionScheduler,
    @InjectRepository(AnnouncementPermissionLog)
    private readonly permissionLogRepository: Repository<AnnouncementPermissionLog>,
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
    return await this.announcementBusinessService.공지사항_전체_목록을_조회한다();
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
    description: '새로운 공지사항 카테고리를 생성합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '공지사항 카테고리 생성 성공',
    type: AnnouncementCategoryResponseDto,
  })
  async 공지사항_카테고리를_생성한다(
    @Body() createDto: CreateAnnouncementCategoryDto,
  ): Promise<AnnouncementCategoryResponseDto> {
    return await this.announcementBusinessService.공지사항_카테고리를_생성한다(
      createDto,
    );
  }

  /**
   * 공지사항 카테고리를 수정한다
   */
  @Patch('categories/:id')
  @ApiOperation({
    summary: '공지사항 카테고리 수정',
    description: '공지사항의 카테고리를 수정합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '카테고리 ID',
    type: String,
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
    @Param('id') id: string,
    @Body() updateDto: UpdateAnnouncementCategoryDto,
  ): Promise<AnnouncementCategoryResponseDto> {
    return await this.announcementBusinessService.공지사항_카테고리를_수정한다(
      id,
      updateDto,
    );
  }

  /**
   * 공지사항 카테고리 오더를 변경한다
   */
  @Patch('categories/:id/order')
  @ApiOperation({
    summary: '공지사항 카테고리 오더 변경',
    description: '공지사항 카테고리의 정렬 순서를 변경합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '카테고리 ID',
    type: String,
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
    @Param('id') id: string,
    @Body() updateDto: UpdateAnnouncementCategoryOrderDto,
  ): Promise<AnnouncementCategoryResponseDto> {
    const result =
      await this.announcementBusinessService.공지사항_카테고리_오더를_변경한다(
        id,
        updateDto,
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
  async 공지사항_권한_로그를_조회한다(@Query('resolved') resolved?: boolean) {
    const where: any = {};

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
    description: '새로운 공지사항을 생성합니다.',
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
      '여러 공지사항의 정렬 순서를 한번에 수정합니다. 프론트엔드에서 변경된 순서대로 공지사항 목록을 전달하면 됩니다.',
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
    description: '공지사항을 수정합니다. (비공개 상태에서만 가능)',
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
    description: '공지사항의 공개 상태를 수정합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '공지사항 ID',
    type: String,
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
    description: '공지사항의 고정 상태를 수정합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '공지사항 ID',
    type: String,
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
      '공지사항의 권한 설정을 기반으로 대상 직원 전체에게 알림을 전송합니다. 전사공개인 경우 모든 직원에게, 제한공개인 경우 권한이 있는 직원들에게 알림을 전송합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '공지사항 ID',
    type: String,
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
      '공지사항에 연결된 설문에 아직 응답하지 않은 직원들에게 알림을 전송합니다. 설문이 없는 공지사항인 경우 오류를 반환합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '공지사항 ID',
    type: String,
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
      '공지사항을 아직 읽지 않은 직원들에게 알림을 전송합니다. 권한 설정을 기반으로 대상 직원 중 열람하지 않은 직원에게만 알림을 전송합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '공지사항 ID',
    type: String,
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
      '비활성화된 부서/직원 ID를 새로운 ID로 교체합니다. 예: 구 마케팅팀(DEPT_001) → 신 마케팅팀(DEPT_002)\n\n' +
      '권한 교체가 완료되면 자동으로 RESOLVED 로그가 생성됩니다.',
  })
  @ApiParam({
    name: 'id',
    description: '공지사항 ID',
    type: String,
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
}
