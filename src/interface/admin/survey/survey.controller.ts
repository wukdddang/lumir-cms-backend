import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
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
import { SurveyBusinessService } from '@business/survey-business/survey-business.service';
import {
  SurveyResponseDto,
  SurveyListResponseDto,
  CompleteSurveyDto,
} from '@interface/common/dto/survey/survey-response.dto';

@ApiTags('공통. 관리자 - 설문조사 (조회)')
@ApiBearerAuth('Bearer')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/surveys')
export class SurveyController {
  constructor(
    private readonly surveyBusinessService: SurveyBusinessService,
  ) {}

  /**
   * 설문조사 목록을 조회한다
   */
  @Get()
  @ApiOperation({
    summary: '설문조사 목록 조회',
    description: '설문조사 목록을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '설문조사 목록 조회 성공',
    type: SurveyListResponseDto,
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
  async 설문조사_목록을_조회한다(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<SurveyListResponseDto> {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;

    const result =
      await this.surveyBusinessService.설문조사_목록을_조회한다({
        page: pageNum,
        limit: limitNum,
      });

    return {
      items: result.items.map((survey) => SurveyResponseDto.from(survey)),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: Math.ceil(result.total / result.limit),
    };
  }

  /**
   * 설문조사를 조회한다
   */
  @Get(':id')
  @ApiOperation({
    summary: '설문조사 상세 조회',
    description: '특정 설문조사의 상세 정보를 조회합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '설문조사 ID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: '설문조사 조회 성공',
    type: SurveyResponseDto,
  })
  async 설문조사를_조회한다(
    @Param('id') id: string,
  ): Promise<SurveyResponseDto> {
    const survey = await this.surveyBusinessService.설문조사를_조회한다(id);
    return SurveyResponseDto.from(survey);
  }

  /**
   * 공지사항의 설문조사를 조회한다
   */
  @Get('announcement/:announcementId')
  @ApiOperation({
    summary: '공지사항의 설문조사 조회',
    description: '특정 공지사항에 연결된 설문조사를 조회합니다.',
  })
  @ApiParam({
    name: 'announcementId',
    description: '공지사항 ID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: '설문조사 조회 성공',
    type: SurveyResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '설문조사를 찾을 수 없음',
  })
  async 공지사항의_설문조사를_조회한다(
    @Param('announcementId') announcementId: string,
  ): Promise<SurveyResponseDto | null> {
    const survey =
      await this.surveyBusinessService.공지사항의_설문조사를_조회한다(
        announcementId,
      );
    return survey ? SurveyResponseDto.from(survey) : null;
  }

  /**
   * 설문조사를 생성한다
   * ⚠️ 비활성화됨: 설문조사는 공지사항을 통해서만 생성 가능합니다.
   */
  // @Post()
  // @ApiOperation({
  //   summary: '설문조사 생성 (비활성화)',
  //   description: '⚠️ 이 엔드포인트는 비활성화되었습니다. 설문조사는 공지사항 생성 시 함께 생성됩니다.',
  // })
  // @ApiResponse({
  //   status: 201,
  //   description: '설문조사 생성 성공',
  //   type: SurveyResponseDto,
  // })
  // async 설문조사를_생성한다(
  //   @Body() dto: CreateSurveyDto,
  //   @CurrentUser() user: AuthenticatedUser,
  // ): Promise<SurveyResponseDto> {
  //   // 날짜 변환
  //   const data = {
  //     ...dto,
  //     startDate: dto.startDate ? new Date(dto.startDate) : null,
  //     endDate: dto.endDate ? new Date(dto.endDate) : null,
  //   };

  //   const survey = await this.surveyBusinessService.설문조사를_생성한다(data);
  //   return SurveyResponseDto.from(survey);
  // }

  /**
   * 설문조사를 수정한다
   * ⚠️ 비활성화됨: 설문조사는 공지사항을 통해서만 수정 가능합니다.
   */
  // @Put(':id')
  // @ApiOperation({
  //   summary: '설문조사 수정 (비활성화)',
  //   description: '⚠️ 이 엔드포인트는 비활성화되었습니다. 설문조사는 공지사항 수정 시 함께 수정됩니다.',
  // })
  // @ApiParam({
  //   name: 'id',
  //   description: '설문조사 ID',
  //   type: String,
  // })
  // @ApiResponse({
  //   status: 200,
  //   description: '설문조사 수정 성공',
  //   type: SurveyResponseDto,
  // })
  // async 설문조사를_수정한다(
  //   @Param('id') id: string,
  //   @Body() dto: UpdateSurveyDto,
  //   @CurrentUser() user: AuthenticatedUser,
  // ): Promise<SurveyResponseDto> {
  //   // 날짜 변환
  //   const data: any = { ...dto };
  //   if (dto.startDate) {
  //     data.startDate = new Date(dto.startDate);
  //   }
  //   if (dto.endDate) {
  //     data.endDate = new Date(dto.endDate);
  //   }

  //   const survey = await this.surveyBusinessService.설문조사를_수정한다(
  //     id,
  //     data,
  //   );
  //   return SurveyResponseDto.from(survey);
  // }

  /**
   * 설문조사를 삭제한다
   * ⚠️ 비활성화됨: 설문조사는 공지사항을 통해서만 삭제 가능합니다.
   */
  // @Delete(':id')
  // @ApiOperation({
  //   summary: '설문조사 삭제 (비활성화)',
  //   description: '⚠️ 이 엔드포인트는 비활성화되었습니다. 설문조사는 공지사항 삭제 시 함께 삭제됩니다.',
  // })
  // @ApiParam({
  //   name: 'id',
  //   description: '설문조사 ID',
  //   type: String,
  // })
  // @ApiResponse({
  //   status: 200,
  //   description: '설문조사 삭제 성공',
  // })
  // async 설문조사를_삭제한다(@Param('id') id: string): Promise<{
  //   success: boolean;
  // }> {
  //   const result = await this.surveyBusinessService.설문조사를_삭제한다(id);
  //   return { success: result };
  // }

  /**
   * 설문 완료를 기록한다
   */
  @Post(':id/complete')
  @ApiOperation({
    summary: '설문 완료 기록',
    description: '설문 응답 완료를 기록합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '설문조사 ID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: '설문 완료 기록 성공',
  })
  async 설문_완료를_기록한다(
    @Param('id') id: string,
    @Body() dto: CompleteSurveyDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ success: boolean; message: string }> {
    await this.surveyBusinessService.설문_완료를_기록한다({
      surveyId: id,
      employeeId: dto.employeeId || user.id,
    });

    return {
      success: true,
      message: '설문 완료가 기록되었습니다.',
    };
  }
}
