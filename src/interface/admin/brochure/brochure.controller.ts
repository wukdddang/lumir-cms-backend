import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Patch,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiConsumes,
  ApiBody,
  ApiExcludeEndpoint,
} from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Public } from '@interface/common/decorators/public.decorator';
import { CurrentUser } from '@interface/common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@interface/common/decorators/current-user.decorator';
import { BrochureBusinessService } from '@business/brochure-business/brochure-business.service';
import { CreateBrochureDto } from '@interface/common/dto/brochure/create-brochure.dto';
import { UpdateBrochureTranslationsDto } from '@interface/common/dto/brochure/update-brochure-translations.dto';
import {
  UpdateBrochureDto,
  UpdateBrochurePublicDto,
  UpdateBrochureOrderDto,
  UpdateBrochureFileDto,
  CreateBrochureCategoryDto,
  UpdateBrochureCategoryDto,
  UpdateBrochureCategoryOrderDto,
} from '@interface/common/dto/brochure/update-brochure.dto';
import {
  BrochureResponseDto,
  BrochureListResponseDto,
  BrochureCategoryListResponseDto,
  BrochureCategoryResponseDto,
} from '@interface/common/dto/brochure/brochure-response.dto';

@ApiTags('A-2. 관리자 - 브로슈어')
@ApiBearerAuth('Bearer')
@Controller('admin/brochures')
export class BrochureController {
  constructor(
    private readonly brochureBusinessService: BrochureBusinessService,
  ) {}

  /**
   * 브로슈어 목록을 조회한다
   */
  @Get()
  @ApiOperation({
    summary: '브로슈어 목록 조회',
    description: '브로슈어 목록을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '브로슈어 목록 조회 성공',
    type: BrochureListResponseDto,
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
  async 브로슈어_목록을_조회한다(
    @Query('isPublic') isPublic?: string,
    @Query('orderBy') orderBy?: 'order' | 'createdAt',
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<BrochureListResponseDto> {
    const isPublicFilter =
      isPublic === 'true' ? true : isPublic === 'false' ? false : undefined;
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;

    const result = await this.brochureBusinessService.브로슈어_목록을_조회한다(
      isPublicFilter,
      orderBy || 'order',
      pageNum,
      limitNum,
    );

    return result;
  }

  /**
   * 브로슈어를 생성한다 (파일 업로드 포함)
   */
  @Post()
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      fileFilter: (req, file, callback) => {
        // 허용된 MIME 타입: PDF, JPG, PNG, WEBP
        const allowedMimeTypes = [
          'application/pdf',
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/webp',
        ];

        if (allowedMimeTypes.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(
            new Error(
              `지원하지 않는 파일 형식입니다. 허용된 형식: PDF, JPG, PNG, WEBP (현재: ${file.mimetype})`,
            ),
            false,
          );
        }
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: '브로슈어 생성',
    description:
      '새로운 브로슈어를 생성합니다. 제목, 설명과 함께 생성됩니다. 기본값: 비공개, DRAFT 상태',
  })
  @ApiBody({
    description:
      '⚠️ **중요**: translations 필드는 반드시 배열 형태의 JSON 문자열로 입력해야 합니다.\n\n' +
      '**예시 (한 개 언어)**:\n' +
      '```json\n' +
      '[{"languageId":"uuid-ko","title":"회사 소개 브로슈어","description":"루미르 회사 소개 자료입니다."}]\n' +
      '```\n\n' +
      '**예시 (여러 언어)**:\n' +
      '```json\n' +
      '[{"languageId":"uuid-ko","title":"회사 소개 브로슈어","description":"루미르 회사 소개 자료입니다."},{"languageId":"uuid-en","title":"Company Introduction Brochure","description":"Lumir company introduction material."}]\n' +
      '```',
    schema: {
      type: 'object',
      properties: {
        translations: {
          type: 'string',
          description:
            '번역 목록 (JSON 배열 문자열) - 반드시 대괄호 []로 감싸야 합니다!',
          example:
            '[{"languageId":"31e6bbc6-2839-4477-9672-bb4b381e8914","title":"회사 소개 브로슈어","description":"루미르 회사 소개 자료입니다."}]',
        },
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: '첨부파일 목록 (최대 10개, PDF/JPG/PNG/WEBP만 가능)',
        },
      },
      required: ['translations'],
    },
  })
  @ApiResponse({
    status: 201,
    description: '브로슈어 생성 성공 (비공개, DRAFT 상태로 생성됨)',
    type: BrochureResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청 (언어 ID 없음, 제목 없음, 파일 형식 오류)',
  })
  async 브로슈어를_생성한다(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<BrochureResponseDto> {
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

    return await this.brochureBusinessService.브로슈어를_생성한다(
      translations,
      user.id,
      files,
    );
  }

  /**
   * 브로슈어 번역들을 수정한다
   */
  @Put(':id/translations')
  @ApiOperation({
    summary: '브로슈어 번역 수정',
    description:
      '브로슈어의 여러 언어 번역을 수정합니다. 수정된 번역은 자동 동기화에서 제외됩니다 (isSynced: false).',
  })
  @ApiResponse({
    status: 200,
    description: '브로슈어 번역 수정 성공',
  })
  @ApiResponse({
    status: 404,
    description: '브로슈어를 찾을 수 없음',
  })
  async 브로슈어_번역들을_수정한다(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: UpdateBrochureTranslationsDto,
  ): Promise<any> {
    return await this.brochureBusinessService.브로슈어_번역들을_수정한다(
      id,
      body.translations,
      user.id,
    );
  }

  /**
   * 기본 브로슈어들을 생성한다
   */
  @Post('create-default')
  @ApiExcludeEndpoint()
  async 기본_브로슈어들을_생성한다(): Promise<BrochureResponseDto[]> {
    return await this.brochureBusinessService.기본_브로슈어들을_생성한다(
      'system',
    );
  }

  /**
   * 기본 브로슈어들을 초기화한다 (일괄 제거)
   */
  @Delete('initialize-default')
  @ApiExcludeEndpoint()
  async 기본_브로슈어들을_초기화한다(): Promise<{
    success: boolean;
    deletedCount: number;
  }> {
    return await this.brochureBusinessService.기본_브로슈어들을_초기화한다();
  }

  /**
   * 브로슈어 카테고리 목록을 조회한다
   */
  @Get('categories')
  @ApiOperation({
    summary: '브로슈어 카테고리 목록 조회',
    description: '브로슈어 카테고리 목록을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '브로슈어 카테고리 목록 조회 성공',
    type: BrochureCategoryListResponseDto,
  })
  async 브로슈어_카테고리_목록을_조회한다(): Promise<BrochureCategoryListResponseDto> {
    const items =
      await this.brochureBusinessService.브로슈어_카테고리_목록을_조회한다();

    return {
      items,
      total: items.length,
    };
  }

  /**
   * 브로슈어 상세 조회한다
   *
   * 주의: 이 라우트는 categories 라우트보다 뒤에 와야 합니다.
   * 그렇지 않으면 /categories가 :id로 매칭됩니다.
   */
  @Get(':id')
  @ApiOperation({
    summary: '브로슈어 상세 조회',
    description: '브로슈어의 상세 정보를 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '브로슈어 상세 조회 성공',
    type: BrochureResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '브로슈어를 찾을 수 없음',
  })
  async 브로슈어_상세_조회한다(
    @Param('id') id: string,
  ): Promise<BrochureResponseDto> {
    return await this.brochureBusinessService.브로슈어_상세_조회한다(id);
  }

  /**
   * 브로슈어 공개를 수정한다
   */
  @Patch(':id/public')
  @ApiOperation({
    summary: '브로슈어 공개 상태 수정',
    description: '브로슈어의 공개 상태를 수정합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '브로슈어 공개 상태 수정 성공',
    type: BrochureResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '브로슈어를 찾을 수 없음',
  })
  async 브로슈어_공개를_수정한다(
    @Param('id') id: string,
    @Body() updateDto: UpdateBrochurePublicDto,
  ): Promise<BrochureResponseDto> {
    return await this.brochureBusinessService.브로슈어_공개를_수정한다(
      id,
      updateDto,
    );
  }

  /**
   * 브로슈어 오더를 수정한다
   */
  @Patch(':id/order')
  @ApiOperation({
    summary: '브로슈어 오더 수정',
    description: '브로슈어의 정렬 순서를 수정합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '브로슈어 오더 수정 성공',
    type: BrochureResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '브로슈어를 찾을 수 없음',
  })
  async 브로슈어_오더를_수정한다(
    @Param('id') id: string,
    @Body() updateDto: UpdateBrochureOrderDto,
  ): Promise<BrochureResponseDto> {
    return await this.brochureBusinessService.브로슈어_오더를_수정한다(
      id,
      updateDto,
    );
  }

  /**
   * 브로슈어 파일을 수정한다 (파일 업로드 포함)
   */
  @Patch(':id/files')
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: '브로슈어 파일 수정',
    description:
      '브로슈어의 첨부파일을 수정합니다. 파일은 multipart/form-data로 전송합니다.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: '추가할 첨부파일 목록 (최대 10개)',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: '브로슈어 파일 수정 성공',
    type: BrochureResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '브로슈어를 찾을 수 없음',
  })
  async 브로슈어_파일을_수정한다(
    @Param('id') id: string,
    @Body() body: any,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<BrochureResponseDto> {
    return await this.brochureBusinessService.브로슈어_파일을_수정한다(
      id,
      {},
      files,
    );
  }

  /**
   * 브로슈어 파일을 삭제한다
   */
  @Delete(':id/files')
  @ApiOperation({
    summary: '브로슈어 파일 삭제',
    description: '브로슈어의 첨부파일을 삭제합니다. S3에서도 함께 삭제됩니다.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        fileUrls: {
          type: 'array',
          items: { type: 'string' },
          description: '삭제할 파일 URL 목록',
          example: [
            'https://bucket.s3.amazonaws.com/brochures/file1.pdf',
            'https://bucket.s3.amazonaws.com/brochures/file2.jpg',
          ],
        },
      },
      required: ['fileUrls'],
    },
  })
  @ApiResponse({
    status: 200,
    description: '브로슈어 파일 삭제 성공',
    type: BrochureResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '브로슈어를 찾을 수 없음',
  })
  async 브로슈어_파일을_삭제한다(
    @Param('id') id: string,
    @Body() body: { fileUrls: string[] },
  ): Promise<BrochureResponseDto> {
    return await this.brochureBusinessService.브로슈어_파일을_삭제한다(
      id,
      body.fileUrls,
    );
  }

  /**
   * 브로슈어를 삭제한다
   */
  @Delete(':id')
  @ApiOperation({
    summary: '브로슈어 삭제',
    description: '브로슈어를 삭제합니다 (Soft Delete).',
  })
  @ApiResponse({
    status: 200,
    description: '브로슈어 삭제 성공',
  })
  @ApiResponse({
    status: 404,
    description: '브로슈어를 찾을 수 없음',
  })
  async 브로슈어를_삭제한다(
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    const result = await this.brochureBusinessService.브로슈어를_삭제한다(id);
    return { success: result };
  }

  /**
   * 브로슈어 카테고리를 수정한다
   */
  @Patch(':id/categories')
  @ApiOperation({
    summary: '브로슈어 카테고리 수정',
    description: '브로슈어의 카테고리를 수정합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '브로슈어 카테고리 수정 성공',
  })
  @ApiResponse({
    status: 404,
    description: '브로슈어를 찾을 수 없음',
  })
  async 브로슈어_카테고리를_수정한다(
    @Param('id') id: string,
    @Body() updateDto: UpdateBrochureCategoryDto,
  ): Promise<BrochureCategoryResponseDto> {
    return await this.brochureBusinessService.브로슈어_카테고리를_수정한다(
      id,
      updateDto,
    );
  }

  /**
   * 브로슈어 카테고리를 생성한다
   */
  @Post('categories')
  @ApiOperation({
    summary: '브로슈어 카테고리 생성',
    description: '새로운 브로슈어 카테고리를 생성합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '브로슈어 카테고리 생성 성공',
    type: BrochureCategoryResponseDto,
  })
  async 브로슈어_카테고리를_생성한다(
    @Body() createDto: CreateBrochureCategoryDto,
  ): Promise<BrochureCategoryResponseDto> {
    return await this.brochureBusinessService.브로슈어_카테고리를_생성한다(
      createDto,
    );
  }

  /**
   * 브로슈어 카테고리 오더를 변경한다
   */
  @Patch('categories/:id/order')
  @ApiOperation({
    summary: '브로슈어 카테고리 오더 변경',
    description: '브로슈어 카테고리의 정렬 순서를 변경합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '브로슈어 카테고리 오더 변경 성공',
  })
  @ApiResponse({
    status: 404,
    description: '카테고리를 찾을 수 없음',
  })
  async 브로슈어_카테고리_오더를_변경한다(
    @Param('id') id: string,
    @Body() updateDto: UpdateBrochureCategoryOrderDto,
  ): Promise<{ success: boolean }> {
    await this.brochureBusinessService.브로슈어_카테고리_오더를_변경한다(
      id,
      updateDto,
    );
    return { success: true };
  }

  /**
   * 브로슈어 카테고리를 삭제한다
   */
  @Delete('categories/:id')
  @ApiOperation({
    summary: '브로슈어 카테고리 삭제',
    description: '브로슈어 카테고리를 삭제합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '브로슈어 카테고리 삭제 성공',
  })
  @ApiResponse({
    status: 404,
    description: '카테고리를 찾을 수 없음',
  })
  async 브로슈어_카테고리를_삭제한다(
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    const result =
      await this.brochureBusinessService.브로슈어_카테고리를_삭제한다(id);
    return { success: result };
  }
}
