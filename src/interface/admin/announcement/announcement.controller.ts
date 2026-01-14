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
import { ContentStatus } from '@domain/core/content-status.types';

@ApiTags('A-9. 관리자 - 공지사항')
@ApiBearerAuth('Bearer')
@Controller('admin/announcements')
export class AnnouncementController {
  constructor(
    private readonly announcementBusinessService: AnnouncementBusinessService,
  ) {}

  /**
   * 공지사항 목록을 조회한다
   */
  @Get()
  @ApiOperation({
    summary: '공지사항 목록 조회',
    description: '공지사항 목록을 조회합니다.',
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
    name: 'isFixed',
    required: false,
    description: '고정 여부 필터',
    type: Boolean,
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: '상태 필터',
    enum: ContentStatus,
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
  async 공지사항_목록을_조회한다(
    @Query('isPublic') isPublic?: string,
    @Query('isFixed') isFixed?: string,
    @Query('status') status?: ContentStatus,
    @Query('orderBy') orderBy?: 'order' | 'createdAt',
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<AnnouncementListResponseDto> {
    const isPublicFilter =
      isPublic === 'true' ? true : isPublic === 'false' ? false : undefined;
    const isFixedFilter =
      isFixed === 'true' ? true : isFixed === 'false' ? false : undefined;
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;

    const result =
      await this.announcementBusinessService.공지사항_목록을_조회한다({
        isPublic: isPublicFilter,
        isFixed: isFixedFilter,
        status,
        orderBy: orderBy || 'order',
        page: pageNum,
        limit: limitNum,
      });

    return {
      items: result.items,
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
    return await this.announcementBusinessService.공지사항을_조회한다(id);
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
    description: '공지사항을 수정합니다.',
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
    description: '공지사항을 삭제합니다.',
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
  ): Promise<{
    success: boolean;
    sentCount: number;
    failedCount: number;
    message: string;
  }> {
    return await this.announcementBusinessService.공지사항에_포함된_전체직원에게_알림을보낸다(
      id,
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
  ): Promise<{
    success: boolean;
    sentCount: number;
    failedCount: number;
    message: string;
  }> {
    return await this.announcementBusinessService.공지사항에_포함된_직원중_미답변자들에게_알림을보낸다(
      id,
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
  ): Promise<{
    success: boolean;
    sentCount: number;
    failedCount: number;
    message: string;
  }> {
    return await this.announcementBusinessService.공지사항에_포함된_미열람자들에게_알림을보낸다(
      id,
    );
  }
}
