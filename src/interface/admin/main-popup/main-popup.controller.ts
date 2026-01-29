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
import { MainPopupBusinessService } from '@business/main-popup-business/main-popup-business.service';
import { MainPopup } from '@domain/sub/main-popup/main-popup.entity';
import {
  MainPopupListResponseDto,
  MainPopupResponseDto,
  MainPopupCategoryResponseDto,
  MainPopupCategoryListResponseDto,
} from '@interface/common/dto/main-popup/main-popup-response.dto';
import { UpdateMainPopupBatchOrderDto } from '@interface/common/dto/main-popup/update-main-popup-batch-order.dto';
import {
  CreateMainPopupDto,
  CreateMainPopupCategoryDto,
} from '@interface/common/dto/main-popup/create-main-popup.dto';
import {
  UpdateMainPopupCategoryDto,
  UpdateMainPopupCategoryOrderDto,
  UpdateMainPopupPublicDto,
  UpdateMainPopupDto,
  UpdateMainPopupTranslationDto,
} from '@interface/common/dto/main-popup/update-main-popup.dto';

@ApiTags('A-4. 관리자 - 메인 팝업')
@ApiBearerAuth('Bearer')
@Controller('admin/main-popups')
export class MainPopupController {
  constructor(
    private readonly mainPopupBusinessService: MainPopupBusinessService,
  ) {}

  /**
   * 메인 팝업 목록을 조회한다 (페이징)
   */
  @Get()
  @ApiOperation({
    summary: '메인 팝업 목록 조회',
    description: '메인 팝업 목록을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '메인 팝업 목록 조회 성공',
    type: MainPopupListResponseDto,
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
  @ApiQuery({
    name: 'categoryId',
    required: false,
    description: '카테고리 ID (UUID)',
    type: String,
  })
  async 메인_팝업_목록을_조회한다(
    @Query('isPublic') isPublic?: string,
    @Query('orderBy') orderBy?: 'order' | 'createdAt',
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('categoryId') categoryId?: string,
  ): Promise<MainPopupListResponseDto> {
    const isPublicFilter =
      isPublic === 'true' ? true : isPublic === 'false' ? false : undefined;
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;

    const result =
      await this.mainPopupBusinessService.메인_팝업_목록을_조회한다(
        isPublicFilter,
        orderBy || 'order',
        pageNum,
        limitNum,
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined,
        categoryId || undefined,
      );

    return result;
  }

  /**
   * 메인 팝업 카테고리 목록을 조회한다
   */
  @Get('categories')
  @ApiOperation({
    summary: '메인 팝업 카테고리 목록 조회',
    description: '메인 팝업 카테고리 목록을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '메인 팝업 카테고리 목록 조회 성공',
    type: MainPopupCategoryListResponseDto,
  })
  async 메인_팝업_카테고리_목록을_조회한다(): Promise<MainPopupCategoryListResponseDto> {
    const items =
      await this.mainPopupBusinessService.메인_팝업_카테고리_목록을_조회한다();

    return {
      items,
      total: items.length,
    };
  }

  /**
   * 메인 팝업 전체 목록을 조회한다
   */
  @Get('all')
  @ApiOperation({
    summary: '메인 팝업 전체 목록 조회',
    description: '모든 메인 팝업을 조회합니다. (페이징 없음)',
  })
  @ApiResponse({
    status: 200,
    description: '메인 팝업 전체 목록 조회 성공',
    type: [MainPopup],
  })
  async 메인_팝업_전체_목록을_조회한다(): Promise<MainPopup[]> {
    return await this.mainPopupBusinessService.메인_팝업_전체_목록을_조회한다();
  }

  /**
   * 메인 팝업 상세를 조회한다
   *
   * 주의: 이 라우트는 categories 라우트보다 뒤에 와야 합니다.
   */
  @Get(':id')
  @ApiOperation({
    summary: '메인 팝업 상세 조회',
    description: '메인 팝업의 상세 정보를 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '메인 팝업 상세 조회 성공',
    type: MainPopupResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '메인 팝업을 찾을 수 없음',
  })
  async 메인_팝업_상세를_조회한다(
    @Param('id') id: string,
  ): Promise<MainPopupResponseDto> {
    // UUID 형식 검증
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new BadRequestException('id는 유효한 UUID 형식이어야 합니다.');
    }

    return await this.mainPopupBusinessService.메인_팝업_상세를_조회한다(id);
  }

  /**
   * 메인 팝업을 생성한다 (파일 업로드 포함)
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
    summary: '메인 팝업 생성',
    description:
      '새로운 메인 팝업을 생성합니다. 제목, 설명과 함께 생성됩니다. 기본값: 비공개, DRAFT 상태\n\n' +
      '**참고**: `createdBy`는 토큰에서 자동으로 추출됩니다.',
  })
  @ApiBody({
    description:
      '⚠️ **중요**: multipart/form-data 형식으로 전송해야 합니다.\n\n' +
      '- **translations**: JSON 문자열로 전송 (아래 스키마 참고)\n' +
      '- **files**: 파일 배열 (PDF/JPG/PNG/WEBP/XLSX/DOCX)',
    schema: {
      type: 'object',
      properties: {
        translations: {
          type: 'string',
          description:
            '번역 목록 (JSON 문자열). CreateMainPopupTranslationDto 배열을 JSON.stringify()한 값',
          example: JSON.stringify([
            {
              languageId: '31e6bbc6-2839-4477-9672-bb4b381e8914',
              title: '메인 팝업',
              description: '메인 팝업 설명입니다.',
            },
          ]),
        },
        categoryId: {
          type: 'string',
          description: '메인 팝업 카테고리 ID (선택사항)',
          example: '31e6bbc6-2839-4477-9672-bb4b381e8914',
        },
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: '첨부파일 목록 (PDF/JPG/PNG/WEBP/XLSX/DOCX만 가능)',
        },
      },
      required: ['translations'],
    },
  })
  @ApiResponse({
    status: 201,
    description: '메인 팝업 생성 성공 (비공개, DRAFT 상태로 생성됨)',
    type: MainPopupResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청 (언어 ID 없음, 제목 없음, 파일 형식 오류)',
  })
  async 메인_팝업을_생성한다(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<MainPopupResponseDto> {
    // translations가 JSON 문자열로 전달될 수 있으므로 파싱
    let translations = body?.translations;

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

    // 각 translation 항목의 필수 필드 검증
    for (let i = 0; i < translations.length; i++) {
      const translation = translations[i];

      if (!translation.languageId) {
        throw new BadRequestException(
          `translations[${i}].languageId는 필수 필드입니다.`,
        );
      }

      // languageId가 문자열인지 확인
      if (typeof translation.languageId !== 'string') {
        throw new BadRequestException(
          `translations[${i}].languageId는 문자열이어야 합니다.`,
        );
      }

      // UUID 형식 검증 (간단한 정규식)
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(translation.languageId)) {
        throw new BadRequestException(
          `translations[${i}].languageId는 유효한 UUID 형식이어야 합니다.`,
        );
      }

      // title이 존재하고 문자열인지 확인
      if (!translation.title) {
        throw new BadRequestException(
          `translations[${i}].title는 필수 필드입니다.`,
        );
      }

      if (typeof translation.title !== 'string') {
        throw new BadRequestException(
          `translations[${i}].title는 문자열이어야 합니다.`,
        );
      }

      if (translation.title.trim() === '') {
        throw new BadRequestException(
          `translations[${i}].title는 빈 문자열일 수 없습니다.`,
        );
      }

      // description이 있다면 문자열인지 확인
      if (
        translation.description !== undefined &&
        typeof translation.description !== 'string'
      ) {
        throw new BadRequestException(
          `translations[${i}].description은 문자열이어야 합니다.`,
        );
      }
    }

    // categoryId 검증 (선택적)
    const categoryId = body?.categoryId;

    if (categoryId) {
      if (typeof categoryId !== 'string') {
        throw new BadRequestException('categoryId는 문자열이어야 합니다.');
      }

      // UUID 형식 검증
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(categoryId)) {
        throw new BadRequestException(
          'categoryId는 유효한 UUID 형식이어야 합니다.',
        );
      }
    }

    const mainPopup = await this.mainPopupBusinessService.메인_팝업을_생성한다(
      translations,
      categoryId || null,
      user.id,
      files,
    );

    return {
      ...mainPopup,
      categoryName: mainPopup.category?.name,
    };
  }

  /**
   * 메인 팝업 오더를 일괄 수정한다
   *
   * 주의: 이 라우트는 :id 라우트보다 앞에 와야 합니다.
   */
  @Put('batch-order')
  @ApiOperation({
    summary: '메인 팝업 오더 일괄 수정',
    description:
      '여러 메인 팝업의 정렬 순서를 한번에 수정합니다. 프론트엔드에서 변경된 순서대로 메인 팝업 목록을 전달하면 됩니다.',
  })
  @ApiResponse({
    status: 200,
    description: '메인 팝업 오더 일괄 수정 성공',
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
    description: '잘못된 요청 (수정할 메인 팝업이 없음)',
  })
  @ApiResponse({
    status: 404,
    description: '일부 메인 팝업을 찾을 수 없음',
  })
  async 메인_팝업_오더를_일괄_수정한다(
    @Body() updateDto: UpdateMainPopupBatchOrderDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ success: boolean; updatedCount: number }> {
    return await this.mainPopupBusinessService.메인_팝업_오더를_일괄_수정한다(
      updateDto.mainPopups,
      user.id,
    );
  }

  /**
   * 메인 팝업을 수정한다 (번역 및 파일 포함)
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
    summary: '메인 팝업 수정',
    description:
      '메인 팝업의 번역 정보 및 파일을 수정합니다.\n\n' +
      '**참고**: `updatedBy`는 토큰에서 자동으로 추출됩니다.',
  })
  @ApiBody({
    description:
      '⚠️ **중요**: multipart/form-data 형식으로 전송해야 합니다.\n\n' +
      '**파일 관리 방식**:\n' +
      '- `files`를 전송하면: 기존 파일 전부 삭제 → 새 파일들로 교체\n' +
      '- `files`를 전송하지 않으면: 기존 파일 전부 삭제 (파일 없음)\n' +
      '- 기존 파일을 유지하려면 반드시 해당 파일을 다시 전송해야 합니다',
    schema: {
      type: 'object',
      properties: {
        translations: {
          type: 'string',
          description:
            '번역 목록 (JSON 문자열). CreateMainPopupTranslationDto 배열을 JSON.stringify()한 값',
          example: JSON.stringify([
            {
              languageId: '31e6bbc6-2839-4477-9672-bb4b381e8914',
              title: '메인 팝업',
              description: '메인 팝업 설명입니다.',
            },
          ]),
        },
        categoryId: {
          type: 'string',
          description: '메인 팝업 카테고리 ID (선택사항)',
          example: '31e6bbc6-2839-4477-9672-bb4b381e8914',
        },
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description:
            '첨부파일 목록 (PDF/JPG/PNG/WEBP/XLSX/DOCX만 가능) - 전송한 파일들로 완전히 교체됩니다',
        },
      },
      required: ['translations'],
    },
  })
  @ApiResponse({
    status: 200,
    description: '메인 팝업 수정 성공',
    type: MainPopupResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '메인 팝업을 찾을 수 없음',
  })
  async 메인_팝업을_수정한다(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: any,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<MainPopupResponseDto> {
    // UUID 형식 검증
    const idUuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!idUuidRegex.test(id)) {
      throw new BadRequestException('id는 유효한 UUID 형식이어야 합니다.');
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

    if (!Array.isArray(translations) || translations.length === 0) {
      throw new BadRequestException(
        'translations는 비어있지 않은 배열이어야 합니다.',
      );
    }

    // 각 번역 검증
    for (const translation of translations) {
      if (!translation.languageId) {
        throw new BadRequestException('languageId는 필수입니다.');
      }
      if (typeof translation.languageId !== 'string') {
        throw new BadRequestException('languageId는 문자열이어야 합니다.');
      }
      // UUID 형식 검증
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(translation.languageId)) {
        throw new BadRequestException(
          'languageId는 유효한 UUID 형식이어야 합니다.',
        );
      }
      if (!translation.title) {
        throw new BadRequestException('title은 필수입니다.');
      }
      if (typeof translation.title !== 'string') {
        throw new BadRequestException('title은 문자열이어야 합니다.');
      }
      if (translation.title.trim() === '') {
        throw new BadRequestException('title은 빈 문자열일 수 없습니다.');
      }
      if (
        translation.description !== undefined &&
        typeof translation.description !== 'string'
      ) {
        throw new BadRequestException('description은 문자열이어야 합니다.');
      }
    }

    // categoryId 검증 (선택적)
    const categoryId = body?.categoryId;

    if (categoryId !== undefined && categoryId !== null) {
      if (typeof categoryId !== 'string') {
        throw new BadRequestException('categoryId는 문자열이어야 합니다.');
      }

      // UUID 형식 검증
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(categoryId)) {
        throw new BadRequestException(
          'categoryId는 유효한 UUID 형식이어야 합니다.',
        );
      }
    }

    return await this.mainPopupBusinessService.메인_팝업을_수정한다(
      id,
      translations,
      categoryId !== undefined ? categoryId : null,
      user.id,
      files,
    );
  }

  /**
   * 메인 팝업 공개 여부를 수정한다
   */
  @Patch(':id/public')
  @ApiOperation({
    summary: '메인 팝업 공개 상태 수정',
    description:
      '메인 팝업의 공개 상태를 수정합니다.\n\n' +
      '**참고**: `updatedBy`는 토큰에서 자동으로 추출됩니다.',
  })
  @ApiResponse({
    status: 200,
    description: '메인 팝업 공개 상태 수정 성공',
    type: MainPopupResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '메인 팝업을 찾을 수 없음',
  })
  async 메인_팝업_공개를_수정한다(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: UpdateMainPopupPublicDto,
  ): Promise<MainPopupResponseDto> {
    // UUID 형식 검증
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new BadRequestException('id는 유효한 UUID 형식이어야 합니다.');
    }

    if (body.isPublic === undefined || body.isPublic === null) {
      throw new BadRequestException('isPublic 필드는 필수입니다.');
    }
    if (typeof body.isPublic !== 'boolean') {
      throw new BadRequestException('isPublic은 boolean이어야 합니다.');
    }

    const mainPopup =
      await this.mainPopupBusinessService.메인_팝업_공개를_수정한다(
        id,
        body.isPublic,
        user.id,
      );

    return {
      ...mainPopup,
      categoryName: mainPopup.category?.name,
    };
  }

  /**
   * 메인 팝업을 삭제한다
   */
  @Delete(':id')
  @ApiOperation({
    summary: '메인 팝업 삭제',
    description: '메인 팝업을 삭제합니다 (Soft Delete).',
  })
  @ApiResponse({
    status: 200,
    description: '메인 팝업 삭제 성공',
  })
  @ApiResponse({
    status: 404,
    description: '메인 팝업을 찾을 수 없음',
  })
  async 메인_팝업을_삭제한다(
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    // UUID 형식 검증
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new BadRequestException('id는 유효한 UUID 형식이어야 합니다.');
    }

    const result = await this.mainPopupBusinessService.메인_팝업을_삭제한다(id);
    return { success: result };
  }

  /**
   * 메인 팝업 카테고리를 생성한다
   */
  @Post('categories')
  @ApiOperation({
    summary: '메인 팝업 카테고리 생성',
    description:
      '새로운 메인 팝업 카테고리를 생성합니다.\n\n' +
      '**참고**: `createdBy`는 토큰에서 자동으로 추출됩니다.',
  })
  @ApiResponse({
    status: 201,
    description: '메인 팝업 카테고리 생성 성공',
    type: MainPopupCategoryResponseDto,
  })
  async 메인_팝업_카테고리를_생성한다(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createDto: CreateMainPopupCategoryDto,
  ): Promise<MainPopupCategoryResponseDto> {
    if (!createDto.name) {
      throw new BadRequestException('name 필드는 필수입니다.');
    }
    if (typeof createDto.name !== 'string') {
      throw new BadRequestException('name은 문자열이어야 합니다.');
    }
    if (createDto.name.trim() === '') {
      throw new BadRequestException('name은 빈 문자열일 수 없습니다.');
    }
    if (
      createDto.description !== undefined &&
      typeof createDto.description !== 'string'
    ) {
      throw new BadRequestException('description은 문자열이어야 합니다.');
    }
    if (createDto.order !== undefined && typeof createDto.order !== 'number') {
      throw new BadRequestException('order는 숫자여야 합니다.');
    }

    return await this.mainPopupBusinessService.메인_팝업_카테고리를_생성한다({
      ...createDto,
      createdBy: user.id,
    });
  }

  /**
   * 메인 팝업 카테고리를 수정한다
   */
  @Patch('categories/:id')
  @ApiOperation({
    summary: '메인 팝업 카테고리 수정',
    description:
      '메인 팝업 카테고리를 수정합니다.\n\n' +
      '**참고**: `updatedBy`는 토큰에서 자동으로 추출됩니다.',
  })
  @ApiResponse({
    status: 200,
    description: '메인 팝업 카테고리 수정 성공',
    type: MainPopupCategoryResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '카테고리를 찾을 수 없음',
  })
  async 메인_팝업_카테고리를_수정한다(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() updateDto: UpdateMainPopupCategoryDto,
  ): Promise<MainPopupCategoryResponseDto> {
    return await this.mainPopupBusinessService.메인_팝업_카테고리를_수정한다(
      id,
      {
        ...updateDto,
        updatedBy: user.id,
      },
    );
  }

  /**
   * 메인 팝업 카테고리 오더를 변경한다
   */
  @Patch('categories/:id/order')
  @ApiOperation({
    summary: '메인 팝업 카테고리 오더 변경',
    description:
      '메인 팝업 카테고리의 정렬 순서를 변경합니다.\n\n' +
      '**참고**: `updatedBy`는 토큰에서 자동으로 추출됩니다.',
  })
  @ApiResponse({
    status: 200,
    description: '메인 팝업 카테고리 오더 변경 성공',
    type: MainPopupCategoryResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '카테고리를 찾을 수 없음',
  })
  async 메인_팝업_카테고리_오더를_변경한다(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() updateDto: UpdateMainPopupCategoryOrderDto,
  ): Promise<MainPopupCategoryResponseDto> {
    if (updateDto.order === undefined || updateDto.order === null) {
      throw new BadRequestException('order 필드는 필수입니다.');
    }
    if (typeof updateDto.order !== 'number') {
      throw new BadRequestException('order는 숫자여야 합니다.');
    }

    const result =
      await this.mainPopupBusinessService.메인_팝업_카테고리_오더를_변경한다(
        id,
        {
          order: updateDto.order,
          updatedBy: user.id,
        },
      );
    return result;
  }

  /**
   * 메인 팝업 카테고리를 삭제한다
   */
  @Delete('categories/:id')
  @ApiOperation({
    summary: '메인 팝업 카테고리 삭제',
    description: '메인 팝업 카테고리를 삭제합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '메인 팝업 카테고리 삭제 성공',
  })
  @ApiResponse({
    status: 404,
    description: '카테고리를 찾을 수 없음',
  })
  async 메인_팝업_카테고리를_삭제한다(
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    // UUID 형식 검증
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new BadRequestException('id는 유효한 UUID 형식이어야 합니다.');
    }

    const result =
      await this.mainPopupBusinessService.메인_팝업_카테고리를_삭제한다(id);
    return { success: result };
  }
}
