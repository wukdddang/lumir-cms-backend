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
import { ShareholdersMeetingBusinessService } from '@business/shareholders-meeting-business/shareholders-meeting-business.service';
import { ShareholdersMeeting } from '@domain/core/shareholders-meeting/shareholders-meeting.entity';
import { UpdateCategoryEntityDto, UpdateCategoryOrderDto } from '@interface/common/dto/shareholders-meeting/update-shareholders-meeting.dto';

@ApiTags('A-6. 관리자 - 주주총회')
@ApiBearerAuth('Bearer')
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
  async 주주총회_목록을_조회한다(
    @Query('isPublic') isPublic?: string,
    @Query('orderBy') orderBy?: 'order' | 'meetingDate' | 'createdAt',
    @Query('page') page?: string,
    @Query('limit') limit?: string,
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
    return await this.shareholdersMeetingBusinessService.주주총회_상세를_조회한다(
      id,
    );
  }

  /**
   * 주주총회를 생성한다 (파일 업로드 포함)
   */
  @Post()
  @UseInterceptors(
    FilesInterceptor('files', 10, {
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
      '새로운 주주총회를 생성합니다. 제목, 설명, 장소, 일시와 함께 생성됩니다. 기본값: 비공개, DRAFT 상태',
  })
  @ApiBody({
    description:
      '⚠️ **중요**: multipart/form-data 형식으로 전송해야 합니다.\n\n' +
      '- **translations**: JSON 문자열 (CreateShareholdersMeetingTranslationDto[])\n' +
      '- **location**: 주주총회 장소\n' +
      '- **meetingDate**: 주주총회 일시\n' +
      '- **voteResults**: JSON 문자열 (CreateVoteResultDto[], 선택사항)\n' +
      '- **files**: 파일 배열 (최대 10개)',
    schema: {
      type: 'object',
      properties: {
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
            '첨부파일 목록 (최대 10개, PDF/JPG/PNG/WEBP/XLSX/DOCX만 가능)',
        },
      },
      required: ['translations', 'location', 'meetingDate'],
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

    // meetingData 검증
    if (!body.location) {
      throw new BadRequestException('location 필드는 필수입니다.');
    }

    if (!body.meetingDate) {
      throw new BadRequestException('meetingDate 필드는 필수입니다.');
    }

    const meetingData = {
      location: body.location,
      meetingDate: new Date(body.meetingDate),
    };

    // voteResults 파싱 (선택사항)
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
   * 주주총회를 수정한다 (번역 및 파일 포함)
   */
  @Put(':id')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
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
    description: '주주총회의 번역 정보, 의결 결과 및 파일을 수정합니다.',
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
            '첨부파일 목록 (최대 10개, PDF/JPG/PNG/WEBP/XLSX/DOCX만 가능) - 전송한 파일들로 완전히 교체됩니다',
        },
      },
      required: ['translations'],
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
    // translations 파싱
    let translations = body.translations;
    if (typeof translations === 'string') {
      try {
        translations = JSON.parse(translations);
      } catch (error) {
        throw new BadRequestException(
          'translations 파싱 실패: 올바른 JSON 형식이 아닙니다.',
        );
      }
    }

    // meetingData 준비
    const meetingData: any = {};
    if (body.location) {
      meetingData.location = body.location;
    }
    if (body.meetingDate) {
      meetingData.meetingDate = new Date(body.meetingDate);
    }

    // voteResults 파싱 (선택사항)
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
    return await this.shareholdersMeetingBusinessService.주주총회_오더를_일괄_수정한다(
      updateDto.shareholdersMeetings,
      user.id,
    );
  }

  /**
   * 주주총회 공개 여부를 수정한다
   */
  @Patch(':id/public')
  @ApiOperation({
    summary: '주주총회 공개 상태 수정',
    description: '주주총회의 공개 상태를 수정합니다.',
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
    description: '새로운 주주총회 카테고리를 생성합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '주주총회 카테고리 생성 성공',
  })
  async 주주총회_카테고리를_생성한다(
    @Body() createDto: { name: string; description?: string },
  ): Promise<any> {
    return await this.shareholdersMeetingBusinessService.주주총회_카테고리를_생성한다(
      createDto,
    );
  }

  /**
   * 주주총회 카테고리를 수정한다
   */
  @Patch('categories/:id')
  @ApiOperation({
    summary: '주주총회 카테고리 수정',
    description: '주주총회 카테고리를 수정합니다.',
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
    @Body() updateDto: UpdateCategoryEntityDto,
  ): Promise<any> {
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
    description: '주주총회 카테고리의 정렬 순서를 변경합니다.',
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
    @Body() updateDto: UpdateCategoryOrderDto,
  ): Promise<any> {
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
    const result =
      await this.shareholdersMeetingBusinessService.주주총회_카테고리를_삭제한다(
        id,
      );
    return { success: result };
  }
}
