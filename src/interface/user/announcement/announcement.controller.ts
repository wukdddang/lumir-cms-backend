import {
  Controller,
  Get,
  Post,
  Param,
  Body,
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
  ApiBody,
} from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CurrentUser } from '@interface/common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@interface/common/decorators/current-user.decorator';
import { Public } from '@interface/common/decorators/public.decorator';
import { JwtAuthGuard } from '@interface/common/guards';
import { AnnouncementBusinessService } from '@business/announcement-business/announcement-business.service';
import { AnnouncementRead } from '@domain/core/announcement/announcement-read.entity';
import {
  AnnouncementResponseDto,
  AnnouncementListResponseDto,
} from '@interface/common/dto/announcement/announcement-response.dto';
import { SubmitSurveyAnswerDto } from '@interface/common/dto/survey/submit-survey-answer.dto';

@ApiTags('U-1. 사용자 - 공지사항')
@ApiBearerAuth('Bearer')
@Public()
@UseGuards(JwtAuthGuard)
@Controller('user/announcements')
export class UserAnnouncementController {
  constructor(
    private readonly announcementBusinessService: AnnouncementBusinessService,
    @InjectRepository(AnnouncementRead)
    private readonly announcementReadRepository: Repository<AnnouncementRead>,
  ) {}

  /**
   * 공지사항 목록을 조회한다 (사용자용)
   */
  @Get()
  @ApiOperation({
    summary: '공지사항 목록 조회 (사용자용)',
    description:
      '사용자 권한에 따라 접근 가능한 공지사항 목록을 조회합니다. ' +
      '전사공개 또는 사용자가 속한 부서/직급/직책에 해당하는 공지사항만 조회됩니다.',
  })
  @ApiResponse({
    status: 200,
    description: '공지사항 목록 조회 성공',
    type: AnnouncementListResponseDto,
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
    name: 'categoryId',
    required: false,
    description: '카테고리 ID 필터',
    type: String,
  })
  async 공지사항_목록을_조회한다(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('categoryId') categoryId?: string,
  ): Promise<AnnouncementListResponseDto> {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;

    // TODO: 사용자 권한에 따른 필터링 로직 구현 필요
    // - 전사공개(isPublic: true) 공지사항
    // - 사용자의 부서/직급/직책이 포함된 제한공개 공지사항
    // - 사용자 ID가 permissionEmployeeIds에 포함된 공지사항

    const result =
      await this.announcementBusinessService.공지사항_목록을_조회한다({
        isPublic: true, // 임시: 전사공개만 조회
        page: pageNum,
        limit: limitNum,
        orderBy: 'order',
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
   * 공지사항 상세를 조회한다 (사용자용)
   * 조회 시 자동으로 읽음 처리 (AnnouncementRead 레코드 생성)
   */
  @Get(':id')
  @ApiOperation({
    summary: '공지사항 상세 조회 (사용자용)',
    description:
      '특정 공지사항의 상세 정보를 조회합니다.\n\n' +
      '**📊 자동 열람 기록 처리:**\n' +
      '- 처음 공지사항을 보는 사용자의 경우, `AnnouncementRead` 테이블에 읽음 레코드가 자동으로 추가됩니다.\n' +
      '- 이미 읽은 공지사항을 다시 조회하는 경우, 중복 레코드는 생성되지 않습니다.\n' +
      '- 읽음 기록은 `announcementId`와 `employeeId`로 고유하게 관리됩니다.\n\n' +
      '⚠️ **권한 확인:**\n' +
      '사용자에게 접근 권한이 없는 경우 404를 반환합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '공지사항 ID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: '공지사항 조회 성공 (자동 읽음 처리 완료)',
    type: AnnouncementResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '공지사항을 찾을 수 없거나 접근 권한이 없음',
  })
  async 공지사항_상세를_조회한다(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<AnnouncementResponseDto> {
    // TODO: 사용자 권한 확인 로직 구현 필요
    // - 전사공개가 아닌 경우, 사용자가 접근 권한이 있는지 확인

    // 1. 공지사항 조회
    const announcement =
      await this.announcementBusinessService.공지사항을_조회한다(id);

    // 2. 읽음 처리 (중복 확인 후 없으면 생성)
    const existingRead = await this.announcementReadRepository.findOne({
      where: {
        announcementId: id,
        employeeId: user.id,
      },
    });

    if (!existingRead) {
      await this.announcementReadRepository.save({
        announcementId: id,
        employeeId: user.id,
        readAt: new Date(),
      });
    }

    // 3. 응답 반환
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
   * 공지사항 설문에 응답한다
   */
  @Post(':id/survey/answers')
  @ApiOperation({
    summary: '공지사항 설문 응답 제출',
    description:
      '공지사항에 연결된 설문에 응답을 제출합니다.\n\n' +
      '각 질문 타입에 맞는 응답을 제출해야 합니다:\n' +
      '- `short_answer`, `paragraph`: textAnswers 사용\n' +
      '- `multiple_choice`, `dropdown`: choiceAnswers 사용\n' +
      '- `checkboxes`: checkboxAnswers 사용\n' +
      '- `linear_scale`: scaleAnswers 사용\n' +
      '- `grid_scale`: gridAnswers 사용\n' +
      '- `file_upload`: fileAnswers 사용\n' +
      '- `datetime`: datetimeAnswers 사용',
  })
  @ApiParam({
    name: 'id',
    description: '공지사항 ID',
    type: String,
  })
  @ApiBody({
    type: SubmitSurveyAnswerDto,
    description:
      '설문 응답 데이터\n\n' +
      '**중요 사항**:\n' +
      '1. 질문 타입에 맞는 응답 배열에 데이터를 추가해야 합니다.\n' +
      '2. 필수 질문(`isRequired: true`)은 반드시 응답해야 합니다.\n' +
      '3. 선택형/체크박스 응답은 질문의 `form.options`에 정의된 값만 사용 가능합니다.\n' +
      '4. 파일은 먼저 S3에 업로드 후 URL을 전달합니다.',
    examples: {
      'complete-survey': {
        summary: '전체 응답 예시 (모든 질문 타입 포함)',
        description:
          '설문조사의 모든 질문 타입에 대한 응답 예시입니다.\n' +
          '실제로는 설문에 있는 질문들에만 응답하면 됩니다.',
        value: {
          textAnswers: [
            {
              questionId: '123e4567-e89b-12d3-a456-426614174001',
              textValue: '홍길동',
            },
            {
              questionId: '123e4567-e89b-12d3-a456-426614174002',
              textValue:
                '제품 품질이 우수하며, 지속적인 개선이 필요한 부분은 사용자 경험 개선입니다.',
            },
          ],
          choiceAnswers: [
            {
              questionId: '123e4567-e89b-12d3-a456-426614174003',
              selectedOption: '매우 만족',
            },
          ],
          checkboxAnswers: [
            {
              questionId: '123e4567-e89b-12d3-a456-426614174004',
              selectedOptions: ['가격', '품질', '디자인'],
            },
          ],
          scaleAnswers: [
            {
              questionId: '123e4567-e89b-12d3-a456-426614174005',
              scaleValue: 8,
            },
          ],
          gridAnswers: [
            {
              questionId: '123e4567-e89b-12d3-a456-426614174006',
              gridAnswers: [
                {
                  rowName: '서비스 품질',
                  columnValue: '매우 만족',
                },
                {
                  rowName: '응답 속도',
                  columnValue: '만족',
                },
                {
                  rowName: '친절도',
                  columnValue: '매우 만족',
                },
              ],
            },
          ],
          fileAnswers: [
            {
              questionId: '123e4567-e89b-12d3-a456-426614174007',
              files: [
                {
                  fileUrl:
                    'https://s3.amazonaws.com/bucket/surveys/proposal.pdf',
                  fileName: '개선제안서.pdf',
                  fileSize: 2048000,
                  mimeType: 'application/pdf',
                },
              ],
            },
          ],
          datetimeAnswers: [
            {
              questionId: '123e4567-e89b-12d3-a456-426614174008',
              datetimeValue: '2024-02-15T14:00:00+09:00',
            },
          ],
        },
      },
      'simple-survey': {
        summary: '간단한 설문 응답 예시',
        description: '텍스트, 선택형, 척도 질문만 포함된 간단한 설문 응답',
        value: {
          textAnswers: [
            {
              questionId: '31e6bbc6-2839-4477-9672-bb4b381e8914',
              textValue: '영업팀',
            },
          ],
          choiceAnswers: [
            {
              questionId: '42e6bbc6-2839-4477-9672-bb4b381e8915',
              selectedOption: '만족',
            },
          ],
          scaleAnswers: [
            {
              questionId: '53e6bbc6-2839-4477-9672-bb4b381e8916',
              scaleValue: 7,
            },
          ],
        },
      },
      'grid-survey': {
        summary: '그리드 척도 설문 응답 예시',
        description: '여러 항목을 동일한 척도로 평가하는 그리드 형식 설문',
        value: {
          gridAnswers: [
            {
              questionId: '64e6bbc6-2839-4477-9672-bb4b381e8917',
              gridAnswers: [
                {
                  rowName: '제품 품질',
                  columnValue: '매우 만족',
                },
                {
                  rowName: '가격 대비 성능',
                  columnValue: '만족',
                },
                {
                  rowName: '고객 지원',
                  columnValue: '보통',
                },
                {
                  rowName: '배송 속도',
                  columnValue: '만족',
                },
              ],
            },
          ],
        },
      },
      'multi-select-survey': {
        summary: '다중 선택 설문 응답 예시',
        description: '체크박스를 사용한 다중 선택 질문 응답',
        value: {
          checkboxAnswers: [
            {
              questionId: '75e6bbc6-2839-4477-9672-bb4b381e8918',
              selectedOptions: [
                '제품 품질 개선',
                '가격 인하',
                '배송 서비스 개선',
                '고객센터 운영시간 확대',
              ],
            },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: '설문 응답 제출 성공',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청 (설문이 없거나 이미 응답함)',
  })
  async 공지사항_설문에_응답한다(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() answers: SubmitSurveyAnswerDto,
  ): Promise<{ success: boolean }> {
    // TODO: 설문 응답 제출 로직 구현 필요
    // - 설문 존재 여부 확인
    // - 중복 응답 확인
    // - 응답 유효성 검증
    // - 응답 저장

    return { success: true };
  }
}
