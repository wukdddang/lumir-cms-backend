import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Patch,
  Body,
  Query,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '@interface/common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@interface/common/decorators/current-user.decorator';
import { JwtAuthGuard, RolesGuard } from '@interface/common/guards';
import { Roles } from '@interface/common/decorators';
import { ShareholdersMeetingBusinessService } from '@business/shareholders-meeting-business/shareholders-meeting-business.service';
import { ShareholdersMeeting } from '@domain/core/shareholders-meeting/shareholders-meeting.entity';
import { UpdateShareholdersMeetingCategoryDto, UpdateShareholdersMeetingCategoryOrderDto } from '@interface/common/dto/shareholders-meeting/update-shareholders-meeting.dto';

@ApiTags('A-5. 관리자 - 주주총회')
@ApiBearerAuth('Bearer')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/shareholders-meetings')
export class ShareholdersMeetingController {
  constructor(
    private readonly shareholdersMeetingBusinessService: ShareholdersMeetingBusinessService,
  ) {}

  /**
   * 주주총회 목록을 조회한다 (페이징)
   */
  @Get()
  @ApiOperation({
    summary: '주주총회 목록 조회',
    description: '주주총회 목록을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '주주총회 목록 조회 성공',
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
    description:
      '정렬 기준 (order: 정렬순서, meetingDate: 총회일시, createdAt: 생성일시)',
    enum: ['order', 'meetingDate', 'createdAt'],
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
  async 주주총회_목록을_조회한다(
    @Query('isPublic') isPublic?: string,
    @Query('orderBy') orderBy?: 'order' | 'meetingDate' | 'createdAt',
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<any> {
    const isPublicFilter =
      isPublic === 'true' ? true : isPublic === 'false' ? false : undefined;
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;

    const result =
      await this.shareholdersMeetingBusinessService.주주총회_목록을_조회한다(
        isPublicFilter,
        orderBy || 'order',
        pageNum,
        limitNum,
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined,
      );

    return result;
  }

  /**
   * 주주총회 카테고리 목록을 조회한다
   */
  @Get('categories')
  @ApiOperation({
    summary: '주주총회 카테고리 목록 조회',
    description: '주주총회 카테고리 목록을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '주주총회 카테고리 목록 조회 성공',
  })
  async 주주총회_카테고리_목록을_조회한다(): Promise<any> {
    const items =
      await this.shareholdersMeetingBusinessService.주주총회_카테고리_목록을_조회한다();

    return {
      items,
      total: items.length,
    };
  }

  /**
   * 주주총회 전체 목록을 조회한다
   */
  @Get('all')
  @ApiOperation({
    summary: '주주총회 전체 목록 조회',
    description: '모든 주주총회를 조회합니다. (페이징 없음)',
  })
  @ApiResponse({
    status: 200,
    description: '주주총회 전체 목록 조회 성공',
    type: [ShareholdersMeeting],
  })
  async 주주총회_전체_목록을_조회한다(): Promise<ShareholdersMeeting[]> {
    return await this.shareholdersMeetingBusinessService.주주총회_전체_목록을_조회한다();
  }

  /**
   * 주주총회 상세를 조회한다
   *
   * 주의: 이 라우트는 categories 라우트보다 뒤에 와야 합니다.
   */
  @Get(':id')
  @ApiOperation({
    summary: '주주총회 상세 조회',
    description: '주주총회의 상세 정보를 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '주주총회 상세 조회 성공',
    type: ShareholdersMeeting,
  })
  @ApiResponse({
    status: 404,
    description: '주주총회를 찾을 수 없음',
  })
  async 주주총회_상세를_조회한다(
    @Param('id') id: string,
  ): Promise<ShareholdersMeeting> {
    // UUID 형식 검증
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new BadRequestException('올바른 UUID 형식이 아닙니다.');
    }
    
    return await this.shareholdersMeetingBusinessService.주주총회_상세를_조회한다(
      id,
    );
  }

  /**
   * 주주총회를 생성한다 (파일 업로드 포함)
   */
  @Post()
  @UseInterceptors(
    FilesInterceptor('files', undefined, {
      fileFilter: (req, file, callback) => {
        // 허용된 MIME 타입: PDF, JPG, PNG, WEBP, XLSX, DOCX
        const allowedMimeTypes = [
          'application/pdf',
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/webp',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];

        if (allowedMimeTypes.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(
            new Error(
              `지원하지 않는 파일 형식입니다. 허용된 형식: PDF, JPG, PNG, WEBP, XLSX, DOCX (현재: ${file.mimetype})`,
            ),
            false,
          );
        }
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: '주주총회 생성',
    description:
      '새로운 주주총회를 생성합니다. 제목, 설명, 장소, 일시와 함께 생성됩니다. 기본값: 비공개, DRAFT 상태\n\n' +
      '**참고**: `createdBy`는 토큰에서 자동으로 추출됩니다.',
  })
  @ApiBody({
    description:
      '⚠️ **중요**: multipart/form-data 형식으로 전송해야 합니다.\n\n' +
      '- **categoryId**: 주주총회 카테고리 ID (필수)\n' +
      '- **translations**: JSON 문자열 (CreateShareholdersMeetingTranslationDto[])\n' +
      '- **location**: 주주총회 장소\n' +
      '- **meetingDate**: 주주총회 일시\n' +
      '- **voteResults**: JSON 문자열 (CreateVoteResultDto[], 선택사항)\n' +
      '- **files**: 파일 배열',
    schema: {
      type: 'object',
      properties: {
        categoryId: {
          type: 'string',
          format: 'uuid',
          description: '주주총회 카테고리 ID (필수)',
          example: '31e6bbc6-2839-4477-9672-bb4b381e8914',
        },
        translations: {
          type: 'string',
          description:
            '번역 목록 (JSON 문자열). CreateShareholdersMeetingTranslationDto[]를 JSON.stringify()한 값',
          example: JSON.stringify([
            {
              languageId: '31e6bbc6-2839-4477-9672-bb4b381e8914',
              title: '2024년 정기 주주총회',
              description: '2024년 정기 주주총회입니다.',
            },
          ]),
        },
        location: {
          type: 'string',
          description: '주주총회 장소',
          example: '서울특별시 강남구 테헤란로 123',
        },
        meetingDate: {
          type: 'string',
          format: 'date-time',
          description: '주주총회 일시',
          example: '2024-03-15T10:00:00.000Z',
        },
        voteResults: {
          type: 'string',
          description:
            '의결 결과(안건) 목록 (JSON 문자열, 선택사항). CreateVoteResultDto[]를 JSON.stringify()한 값',
          example: JSON.stringify([
            {
              agendaNumber: 1,
              totalVote: 1000,
              yesVote: 950,
              noVote: 50,
              approvalRating: 95.0,
              result: 'accepted',
              translations: [
                {
                  languageId: '31e6bbc6-2839-4477-9672-bb4b381e8914',
                  title: '제1호 의안: 재무제표 승인',
                },
              ],
            },
          ]),
        },
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description:
            '첨부파일 목록 (PDF/JPG/PNG/WEBP/XLSX/DOCX만 가능)',
        },
      },
      required: ['categoryId', 'translations', 'location', 'meetingDate'],
    },
  })
  @ApiResponse({
    status: 201,
    description: '주주총회 생성 성공 (비공개, DRAFT 상태로 생성됨)',
    type: ShareholdersMeeting,
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청 (언어 ID 없음, 제목 없음, 파일 형식 오류)',
  })
  async 주주총회를_생성한다(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<ShareholdersMeeting> {
    // categoryId 검증
    if (!body.categoryId) {
      throw new BadRequestException('categoryId 필드는 필수입니다.');
    }

    // UUID 형식 검증
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(body.categoryId)) {
      throw new BadRequestException('categoryId는 올바른 UUID 형식이어야 합니다.');
    }

    // translations가 JSON 문자열로 전달될 수 있으므로 파싱
    let translations = body.translations;

    if (!translations) {
      throw new BadRequestException('translations 필드는 필수입니다.');
    }

    if (typeof translations === 'string') {
      try {
        translations = JSON.parse(translations);
      } catch (error) {
        throw new BadRequestException(
          'translations 파싱 실패: 올바른 JSON 형식이 아닙니다.',
        );
      }
    }

    if (!Array.isArray(translations) || translations.length === 0) {
      throw new BadRequestException(
        'translations는 비어있지 않은 배열이어야 합니다.',
      );
    }

    // translations 각 항목의 title 검증
    for (const translation of translations) {
      if (!translation.title || translation.title.trim() === '') {
        throw new BadRequestException(
          'translations의 각 항목은 title 필드가 필수입니다.',
        );
      }
      if (!translation.languageId) {
        throw new BadRequestException(
          'translations의 각 항목은 languageId 필드가 필수입니다.',
        );
      }
    }

    // meetingData 검증
    if (!body.location) {
      throw new BadRequestException('location 필드는 필수입니다.');
    }

    if (!body.meetingDate) {
      throw new BadRequestException('meetingDate 필드는 필수입니다.');
    }

    // 날짜 형식 검증
    const meetingDate = new Date(body.meetingDate);
    if (isNaN(meetingDate.getTime())) {
      throw new BadRequestException(
        'meetingDate 형식이 올바르지 않습니다. ISO 8601 형식을 사용해주세요.',
      );
    }

    const meetingData = {
      categoryId: body.categoryId,
      location: body.location,
      meetingDate,
    };

    // voteResults 파싱 및 검증 (선택사항)
    let voteResults: any[] | undefined = undefined;
    if (body.voteResults) {
      if (typeof body.voteResults === 'string') {
        try {
          voteResults = JSON.parse(body.voteResults);
        } catch (error) {
          throw new BadRequestException(
            'voteResults 파싱 실패: 올바른 JSON 형식이 아닙니다.',
          );
        }
      } else {
        voteResults = body.voteResults;
      }

      // voteResults 각 항목의 필수 필드 검증
      if (Array.isArray(voteResults)) {
        for (const voteResult of voteResults) {
          // 필수 필드 검증
          if (typeof voteResult.agendaNumber !== 'number') {
            throw new BadRequestException(
              'voteResults의 각 항목은 agendaNumber 필드가 필수입니다.',
            );
          }
          if (typeof voteResult.totalVote !== 'number') {
            throw new BadRequestException(
              'voteResults의 각 항목은 totalVote 필드가 필수입니다.',
            );
          }
          if (typeof voteResult.yesVote !== 'number') {
            throw new BadRequestException(
              'voteResults의 각 항목은 yesVote 필드가 필수입니다.',
            );
          }
          if (typeof voteResult.noVote !== 'number') {
            throw new BadRequestException(
              'voteResults의 각 항목은 noVote 필드가 필수입니다.',
            );
          }
          if (typeof voteResult.approvalRating !== 'number') {
            throw new BadRequestException(
              'voteResults의 각 항목은 approvalRating 필드가 필수입니다.',
            );
          }
          if (!voteResult.result) {
            throw new BadRequestException(
              'voteResults의 각 항목은 result 필드가 필수입니다.',
            );
          }

          // enum 값 검증
          const validResults = ['accepted', 'rejected'];
          if (!validResults.includes(voteResult.result)) {
            throw new BadRequestException(
              `voteResults의 result 필드는 'accepted' 또는 'rejected' 중 하나여야 합니다. 현재 값: ${voteResult.result}`,
            );
          }

          // translations 검증
          if (!Array.isArray(voteResult.translations) || voteResult.translations.length === 0) {
            throw new BadRequestException(
              'voteResults의 각 항목은 비어있지 않은 translations 배열이 필수입니다.',
            );
          }

          // voteResult translations 각 항목의 title 검증
          for (const trans of voteResult.translations) {
            if (!trans.title || trans.title.trim() === '') {
              throw new BadRequestException(
                'voteResults translations의 각 항목은 title 필드가 필수입니다.',
              );
            }
            if (!trans.languageId) {
              throw new BadRequestException(
                'voteResults translations의 각 항목은 languageId 필드가 필수입니다.',
              );
            }
          }
        }
      }
    }

    return await this.shareholdersMeetingBusinessService.주주총회를_생성한다(
      translations,
      meetingData,
      voteResults,
      user.id,
      files,
    );
  }

  /**
   * 주주총회 오더를 일괄 수정한다
   */
  @Put('batch-order')
  @ApiOperation({
    summary: '주주총회 오더 일괄 수정',
    description:
      '여러 주주총회의 정렬 순서를 한번에 수정합니다. 프론트엔드에서 변경된 순서대로 주주총회 목록을 전달하면 됩니다.',
  })
  @ApiResponse({
    status: 200,
    description: '주주총회 오더 일괄 수정 성공',
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
    description: '잘못된 요청 (수정할 주주총회가 없음)',
  })
  @ApiResponse({
    status: 404,
    description: '일부 주주총회를 찾을 수 없음',
  })
  async 주주총회_오더를_일괄_수정한다(
    @Body()
    updateDto: { shareholdersMeetings: Array<{ id: string; order: number }> },
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ success: boolean; updatedCount: number }> {
    // updateDto 검증
    if (!updateDto) {
      throw new BadRequestException('요청 본문이 비어있습니다.');
    }
    
    // shareholdersMeetings 필드 검증
    if (!updateDto.shareholdersMeetings) {
      throw new BadRequestException('shareholdersMeetings 필드는 필수입니다.');
    }
    if (!Array.isArray(updateDto.shareholdersMeetings)) {
      throw new BadRequestException('shareholdersMeetings는 배열이어야 합니다.');
    }
    if (updateDto.shareholdersMeetings.length === 0) {
      throw new BadRequestException('shareholdersMeetings는 비어있을 수 없습니다.');
    }
    
    // 각 항목 검증
    for (const item of updateDto.shareholdersMeetings) {
      if (!item || typeof item !== 'object') {
        throw new BadRequestException('shareholdersMeetings의 각 항목은 객체여야 합니다.');
      }
      if (!item.id || typeof item.id !== 'string') {
        throw new BadRequestException('shareholdersMeetings의 각 항목은 id(문자열)가 필수입니다.');
      }
      if (item.order === undefined || item.order === null || typeof item.order !== 'number') {
        throw new BadRequestException(`shareholdersMeetings의 각 항목은 order(숫자)가 필수입니다. 현재 값: ${JSON.stringify(item)}`);
      }
    }
    
    return await this.shareholdersMeetingBusinessService.주주총회_오더를_일괄_수정한다(
      updateDto.shareholdersMeetings,
      user.id,
    );
  }

  /**
   * 주주총회를 수정한다 (번역 및 파일 포함)
   */
  @Put(':id')
  @UseInterceptors(
    FilesInterceptor('files', undefined, {
      fileFilter: (req, file, callback) => {
        // 허용된 MIME 타입: PDF, JPG, PNG, WEBP, XLSX, DOCX
        const allowedMimeTypes = [
          'application/pdf',
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/webp',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];

        if (allowedMimeTypes.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(
            new Error(
              `지원하지 않는 파일 형식입니다. 허용된 형식: PDF, JPG, PNG, WEBP, XLSX, DOCX (현재: ${file.mimetype})`,
            ),
            false,
          );
        }
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: '주주총회 수정',
    description:
      '주주총회의 번역 정보, 의결 결과 및 파일을 수정합니다.\n\n' +
      '**필수 필드:**\n' +
      '- `translations`: JSON 배열 문자열 (다국어 정보)\n' +
      '- `categoryId`: 주주총회 카테고리 ID (UUID)\n\n' +
      '**참고**: `updatedBy`는 토큰에서 자동으로 추출됩니다.',
  })
  @ApiBody({
    description:
      '⚠️ **중요**: multipart/form-data 형식으로 전송해야 합니다.\n\n' +
      '**파일 관리 방식**:\n' +
      '- `files`를 전송하면: 기존 파일 전부 삭제 → 새 파일들로 교체\n' +
      '- `files`를 전송하지 않으면: 기존 파일 전부 삭제 (파일 없음)\n' +
      '- 기존 파일을 유지하려면 반드시 해당 파일을 다시 전송해야 합니다\n\n' +
      '**의결 결과(안건) 관리 방식**:\n' +
      '- `id`가 있는 안건: 기존 안건 업데이트\n' +
      '- `id`가 없는 안건: 새 안건 생성\n' +
      '- voteResults에 포함되지 않은 기존 안건: 삭제됨',
    schema: {
      type: 'object',
      properties: {
        categoryId: {
          type: 'string',
          format: 'uuid',
          description: '주주총회 카테고리 ID (필수)',
          example: '31e6bbc6-2839-4477-9672-bb4b381e8914',
        },
        translations: {
          type: 'string',
          description:
            '번역 목록 (JSON 문자열). CreateShareholdersMeetingTranslationDto[]를 JSON.stringify()한 값',
          example: JSON.stringify([
            {
              languageId: '31e6bbc6-2839-4477-9672-bb4b381e8914',
              title: '2024년 정기 주주총회',
              description: '2024년 정기 주주총회입니다.',
            },
          ]),
        },
        location: {
          type: 'string',
          description: '주주총회 장소 (선택사항)',
          example: '서울특별시 강남구 테헤란로 123',
        },
        meetingDate: {
          type: 'string',
          format: 'date-time',
          description: '주주총회 일시 (선택사항)',
          example: '2024-03-15T10:00:00.000Z',
        },
        voteResults: {
          type: 'string',
          description:
            '의결 결과(안건) 목록 (JSON 문자열, 선택사항). id가 있으면 업데이트, 없으면 새로 생성. CreateVoteResultDto[]를 JSON.stringify()한 값',
          example: JSON.stringify([
            {
              id: 'existing-uuid',
              agendaNumber: 1,
              totalVote: 1000,
              yesVote: 950,
              noVote: 50,
              approvalRating: 95.0,
              result: 'accepted',
              translations: [
                {
                  id: 'translation-uuid',
                  languageId: '31e6bbc6-2839-4477-9672-bb4b381e8914',
                  title: '제1호 의안: 재무제표 승인',
                },
              ],
            },
          ]),
        },
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description:
            '첨부파일 목록 (PDF/JPG/PNG/WEBP/XLSX/DOCX만 가능) - 전송한 파일들로 완전히 교체됩니다',
        },
      },
      required: ['translations', 'categoryId'],
    },
  })
  @ApiResponse({
    status: 200,
    description: '주주총회 수정 성공',
    type: ShareholdersMeeting,
  })
  @ApiResponse({
    status: 404,
    description: '주주총회를 찾을 수 없음',
  })
  async 주주총회를_수정한다(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: any,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<ShareholdersMeeting> {
    // UUID 형식 검증
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new BadRequestException('올바른 UUID 형식이 아닙니다.');
    }
    
    // body 검증
    if (!body) {
      throw new BadRequestException('요청 본문이 비어있습니다.');
    }
    
    // translations 파싱
    let translations = body.translations;
    
    if (!translations) {
      throw new BadRequestException('translations 필드는 필수입니다.');
    }
    
    if (typeof translations === 'string') {
      try {
        translations = JSON.parse(translations);
      } catch (error) {
        throw new BadRequestException(
          'translations 파싱 실패: 올바른 JSON 형식이 아닙니다.',
        );
      }
    }

    // translations 검증
    if (!Array.isArray(translations) || translations.length === 0) {
      throw new BadRequestException(
        'translations는 비어있지 않은 배열이어야 합니다.',
      );
    }
    
    // translations 각 항목의 title 검증
    for (const translation of translations) {
      if (translation.title !== undefined && translation.title !== null) {
        if (typeof translation.title !== 'string' || translation.title.trim() === '') {
          throw new BadRequestException(
            'translations의 title은 비어있지 않은 문자열이어야 합니다.',
          );
        }
      }
      if (translation.languageId && typeof translation.languageId !== 'string') {
        throw new BadRequestException(
          'translations의 languageId는 문자열이어야 합니다.',
        );
      }
    }

    // categoryId 필수 검증
    if (!body.categoryId) {
      throw new BadRequestException('categoryId 필드는 필수입니다.');
    }
    
    // UUID 형식 검증
    const categoryIdUuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!categoryIdUuidRegex.test(body.categoryId)) {
      throw new BadRequestException('categoryId는 올바른 UUID 형식이어야 합니다.');
    }

    // meetingData 준비 및 검증
    const meetingData: any = {
      categoryId: body.categoryId,
    };
    if (body.location) {
      meetingData.location = body.location;
    }
    if (body.meetingDate) {
      const meetingDate = new Date(body.meetingDate);
      if (isNaN(meetingDate.getTime())) {
        throw new BadRequestException(
          'meetingDate 형식이 올바르지 않습니다. ISO 8601 형식을 사용해주세요.',
        );
      }
      meetingData.meetingDate = meetingDate;
    }

    // voteResults 파싱 및 검증 (선택사항)
    let voteResults: any[] | undefined = undefined;
    if (body.voteResults) {
      if (typeof body.voteResults === 'string') {
        try {
          voteResults = JSON.parse(body.voteResults);
        } catch (error) {
          throw new BadRequestException(
            'voteResults 파싱 실패: 올바른 JSON 형식이 아닙니다.',
          );
        }
      } else {
        voteResults = body.voteResults;
      }

      // voteResults 각 항목의 필수 필드 검증
      if (Array.isArray(voteResults)) {
        for (const voteResult of voteResults) {
          // 필수 필드 검증 (id가 없는 새 안건의 경우)
          if (!voteResult.id) {
            if (typeof voteResult.agendaNumber !== 'number') {
              throw new BadRequestException(
                'voteResults의 새 안건은 agendaNumber 필드가 필수입니다.',
              );
            }
            if (typeof voteResult.totalVote !== 'number') {
              throw new BadRequestException(
                'voteResults의 새 안건은 totalVote 필드가 필수입니다.',
              );
            }
            if (typeof voteResult.yesVote !== 'number') {
              throw new BadRequestException(
                'voteResults의 새 안건은 yesVote 필드가 필수입니다.',
              );
            }
            if (typeof voteResult.noVote !== 'number') {
              throw new BadRequestException(
                'voteResults의 새 안건은 noVote 필드가 필수입니다.',
              );
            }
            if (typeof voteResult.approvalRating !== 'number') {
              throw new BadRequestException(
                'voteResults의 새 안건은 approvalRating 필드가 필수입니다.',
              );
            }
            if (!voteResult.result) {
              throw new BadRequestException(
                'voteResults의 새 안건은 result 필드가 필수입니다.',
              );
            }
          }

          // enum 값 검증
          if (voteResult.result) {
            const validResults = ['accepted', 'rejected'];
            if (!validResults.includes(voteResult.result)) {
              throw new BadRequestException(
                `voteResults의 result 필드는 'accepted' 또는 'rejected' 중 하나여야 합니다. 현재 값: ${voteResult.result}`,
              );
            }
          }

          // translations 검증
          if (voteResult.translations) {
            if (!Array.isArray(voteResult.translations)) {
              throw new BadRequestException(
                'voteResults의 translations는 배열이어야 합니다.',
              );
            }

            // voteResult translations 각 항목의 title 검증
            for (const trans of voteResult.translations) {
              if (trans.title !== undefined && trans.title !== null) {
                if (typeof trans.title !== 'string' || trans.title.trim() === '') {
                  throw new BadRequestException(
                    'voteResults translations의 title은 비어있지 않은 문자열이어야 합니다.',
                  );
                }
              }
              if (trans.languageId && typeof trans.languageId !== 'string') {
                throw new BadRequestException(
                  'voteResults translations의 languageId는 문자열이어야 합니다.',
                );
              }
            }
          }
        }
      }
    }

    return await this.shareholdersMeetingBusinessService.주주총회를_수정한다(
      id,
      translations,
      meetingData,
      voteResults,
      user.id,
      files,
    );
  }

  /**
   * 주주총회 공개 여부를 수정한다
   */
  @Patch(':id/public')
  @ApiOperation({
    summary: '주주총회 공개 상태 수정',
    description:
      '주주총회의 공개 상태를 수정합니다.\n\n' +
      '**참고**: `updatedBy`는 토큰에서 자동으로 추출됩니다.',
  })
  @ApiResponse({
    status: 200,
    description: '주주총회 공개 상태 수정 성공',
    type: ShareholdersMeeting,
  })
  @ApiResponse({
    status: 404,
    description: '주주총회를 찾을 수 없음',
  })
  async 주주총회_공개를_수정한다(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: { isPublic: boolean },
  ): Promise<ShareholdersMeeting> {
    // UUID 형식 검증
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new BadRequestException('올바른 UUID 형식이 아닙니다.');
    }
    
    // isPublic 필드 검증
    if (body.isPublic === undefined || body.isPublic === null) {
      throw new BadRequestException('isPublic 필드는 필수입니다.');
    }
    if (typeof body.isPublic !== 'boolean') {
      throw new BadRequestException('isPublic 필드는 boolean 타입이어야 합니다.');
    }
    
    return await this.shareholdersMeetingBusinessService.주주총회_공개를_수정한다(
      id,
      body.isPublic,
      user.id,
    );
  }

  /**
   * 주주총회를 삭제한다
   */
  @Delete(':id')
  @ApiOperation({
    summary: '주주총회 삭제',
    description: '주주총회를 삭제합니다 (Soft Delete).',
  })
  @ApiResponse({
    status: 200,
    description: '주주총회 삭제 성공',
  })
  @ApiResponse({
    status: 404,
    description: '주주총회를 찾을 수 없음',
  })
  async 주주총회를_삭제한다(
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    // UUID 형식 검증
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new BadRequestException('올바른 UUID 형식이 아닙니다.');
    }
    
    const result =
      await this.shareholdersMeetingBusinessService.주주총회를_삭제한다(id);
    return { success: result };
  }

  /**
   * 주주총회 카테고리를 생성한다
   */
  @Post('categories')
  @ApiOperation({
    summary: '주주총회 카테고리 생성',
    description:
      '새로운 주주총회 카테고리를 생성합니다.\n\n' +
      '**참고**: `createdBy`는 토큰에서 자동으로 추출됩니다.',
  })
  @ApiBody({
    description: '주주총회 카테고리 생성 정보',
    schema: {
      type: 'object',
      required: ['name'],
      properties: {
        name: {
          type: 'string',
          description: '카테고리 이름 (필수)',
          example: '정기 주주총회',
        },
        description: {
          type: 'string',
          description: '카테고리 설명 (선택)',
          example: '연례 정기 주주총회 자료',
        },
        isActive: {
          type: 'boolean',
          description: '활성화 여부 (선택, 기본값: true)',
          default: true,
        },
        order: {
          type: 'number',
          description: '정렬 순서 (선택, 기본값: 0)',
          default: 0,
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: '주주총회 카테고리 생성 성공',
  })
  async 주주총회_카테고리를_생성한다(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createDto: { name: string; description?: string; isActive?: boolean; order?: number },
  ): Promise<any> {
    // name 필드 검증
    if (!createDto.name || createDto.name.trim() === '') {
      throw new BadRequestException('name 필드는 필수이며 비어있을 수 없습니다.');
    }
    
    return await this.shareholdersMeetingBusinessService.주주총회_카테고리를_생성한다({
      ...createDto,
      createdBy: user.id,
    });
  }

  /**
   * 주주총회 카테고리를 수정한다
   */
  @Patch('categories/:id')
  @ApiOperation({
    summary: '주주총회 카테고리 수정',
    description:
      '주주총회 카테고리를 수정합니다.\n\n' +
      '**참고**: `updatedBy`는 토큰에서 자동으로 추출됩니다.',
  })
  @ApiResponse({
    status: 200,
    description: '주주총회 카테고리 수정 성공',
  })
  @ApiResponse({
    status: 404,
    description: '카테고리를 찾을 수 없음',
  })
  async 주주총회_카테고리를_수정한다(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() updateDto: UpdateShareholdersMeetingCategoryDto,
  ): Promise<any> {
    // UUID 형식 검증
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new BadRequestException('올바른 UUID 형식이 아닙니다.');
    }
    
    return await this.shareholdersMeetingBusinessService.주주총회_카테고리를_수정한다(
      id,
      {
        ...updateDto,
        updatedBy: user.id,
      },
    );
  }

  /**
   * 주주총회 카테고리 오더를 변경한다
   */
  @Patch('categories/:id/order')
  @ApiOperation({
    summary: '주주총회 카테고리 오더 변경',
    description:
      '주주총회 카테고리의 정렬 순서를 변경합니다.\n\n' +
      '**참고**: `updatedBy`는 토큰에서 자동으로 추출됩니다.',
  })
  @ApiResponse({
    status: 200,
    description: '주주총회 카테고리 오더 변경 성공',
  })
  @ApiResponse({
    status: 404,
    description: '카테고리를 찾을 수 없음',
  })
  async 주주총회_카테고리_오더를_변경한다(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() updateDto: UpdateShareholdersMeetingCategoryOrderDto,
  ): Promise<any> {
    // UUID 형식 검증
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new BadRequestException('올바른 UUID 형식이 아닙니다.');
    }
    
    const result =
      await this.shareholdersMeetingBusinessService.주주총회_카테고리_오더를_변경한다(
        id,
        {
          order: updateDto.order,
          updatedBy: user.id,
        },
      );
    return result;
  }

  /**
   * 주주총회 카테고리를 삭제한다
   */
  @Delete('categories/:id')
  @ApiOperation({
    summary: '주주총회 카테고리 삭제',
    description: '주주총회 카테고리를 삭제합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '주주총회 카테고리 삭제 성공',
  })
  @ApiResponse({
    status: 404,
    description: '카테고리를 찾을 수 없음',
  })
  async 주주총회_카테고리를_삭제한다(
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    // UUID 형식 검증
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new BadRequestException('올바른 UUID 형식이 아닙니다.');
    }
    
    const result =
      await this.shareholdersMeetingBusinessService.주주총회_카테고리를_삭제한다(
        id,
      );
    return { success: result };
  }
}
