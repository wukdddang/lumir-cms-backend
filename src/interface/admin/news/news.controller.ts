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
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '@interface/common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@interface/common/decorators/current-user.decorator';
import { NewsBusinessService } from '@business/news-business/news-business.service';
import { StrictBooleanValidationGuard } from '@interface/common/guards/strict-boolean-validation.guard';
import { StrictBooleanFields } from '@interface/common/decorators/strict-boolean-fields.decorator';
import { JwtAuthGuard, RolesGuard } from '@interface/common/guards';
import { Roles } from '@interface/common/decorators';
import {
  UpdateNewsPublicDto,
  CreateNewsCategoryDto,
  UpdateNewsCategoryDto,
  UpdateNewsCategoryOrderDto,
} from '@interface/common/dto/news/update-news.dto';
import { UpdateNewsBatchOrderDto } from '@interface/common/dto/news/update-news-batch-order.dto';
import {
  NewsResponseDto,
  NewsListResponseDto,
  NewsCategoryListResponseDto,
  NewsCategoryResponseDto,
} from '@interface/common/dto/news/news-response.dto';

@ApiTags('A-8. 관리자 - 뉴스')
@ApiBearerAuth('Bearer')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/news')
export class NewsController {
  constructor(private readonly newsBusinessService: NewsBusinessService) {}

  /**
   * 뉴스 목록을 조회한다
   */
  @Get()
  @ApiOperation({
    summary: '뉴스 목록 조회',
    description: '뉴스 목록을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '뉴스 목록 조회 성공',
    type: NewsListResponseDto,
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
  async 뉴스_목록을_조회한다(
    @Query('isPublic') isPublic?: string,
    @Query('orderBy') orderBy?: 'order' | 'createdAt',
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<NewsListResponseDto> {
    const isPublicFilter =
      isPublic === 'true' ? true : isPublic === 'false' ? false : undefined;
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;

    const result = await this.newsBusinessService.뉴스_목록을_조회한다(
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
   * 뉴스 전체 목록을 조회한다 (페이징 없음)
   */
  @Get('all')
  @ApiOperation({
    summary: '뉴스 전체 목록 조회',
    description: '모든 뉴스를 조회합니다. (페이징 없음)',
  })
  @ApiResponse({
    status: 200,
    description: '뉴스 전체 목록 조회 성공',
    type: [NewsResponseDto],
  })
  async 뉴스_전체_목록을_조회한다(): Promise<NewsResponseDto[]> {
    return await this.newsBusinessService.뉴스_전체_목록을_조회한다();
  }

  /**
   * 뉴스를 생성한다 (파일 업로드 포함)
   */
  @Post()
  @UseInterceptors(
    FilesInterceptor('files', undefined, {
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
    summary: '뉴스 생성',
    description:
      '새로운 뉴스를 생성합니다. 제목, 설명, URL과 함께 생성됩니다. 기본값: 비공개, DRAFT 상태\n\n' +
      '**참고**: `createdBy`는 토큰에서 자동으로 추출됩니다.',
  })
  @ApiBody({
    description:
      '⚠️ **중요**: 제목과 카테고리는 필수입니다.\n\n' +
      '**뉴스 URL**: 외부 링크나 뉴스 기사 원본 URL을 입력할 수 있습니다.\n\n' +
      '**카테고리**: categoryId를 통해 뉴스 카테고리를 지정해야 합니다.\n\n' +
      '**파일 관리 방식**:\n' +
      '- `files`를 전송하면: 첨부파일과 함께 생성\n' +
      '- `files`를 전송하지 않으면: 파일 없이 생성',
    schema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: '제목',
          example: '루미르, 신제품 출시',
        },
        description: {
          type: 'string',
          description: '설명 (선택)',
          example: '루미르가 혁신적인 신제품을 출시했습니다.',
        },
        url: {
          type: 'string',
          description: '외부 링크 또는 뉴스 기사 URL (선택)',
          example: 'https://news.example.com/lumir-new-product',
        },
        categoryId: {
          type: 'string',
          format: 'uuid',
          description: '뉴스 카테고리 ID (필수)',
          example: '123e4567-e89b-12d3-a456-426614174000',
        },
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: '첨부파일 목록 (PDF/JPG/PNG/WEBP만 가능)',
        },
      },
      required: ['title', 'categoryId'],
    },
  })
  @ApiResponse({
    status: 201,
    description: '뉴스 생성 성공 (비공개, DRAFT 상태로 생성됨)',
    type: NewsResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청 (제목 없음, 파일 형식 오류)',
  })
  async 뉴스를_생성한다(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<NewsResponseDto> {
    const { title, description, url, categoryId } = body;

    if (!title) {
      throw new BadRequestException('title 필드는 필수입니다.');
    }

    if (!categoryId) {
      throw new BadRequestException('categoryId 필드는 필수입니다.');
    }

    return await this.newsBusinessService.뉴스를_생성한다(
      title,
      description || null,
      url || null,
      categoryId,
      user.id,
      files,
    );
  }

  /**
   * 뉴스 오더를 일괄 수정한다
   */
  @Put('batch-order')
  @ApiOperation({
    summary: '뉴스 오더 일괄 수정',
    description:
      '여러 뉴스의 정렬 순서를 한번에 수정합니다. 프론트엔드에서 변경된 순서대로 뉴스 목록을 전달하면 됩니다.',
  })
  @ApiResponse({
    status: 200,
    description: '뉴스 오더 일괄 수정 성공',
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
    description: '잘못된 요청 (수정할 뉴스가 없음)',
  })
  @ApiResponse({
    status: 404,
    description: '일부 뉴스를 찾을 수 없음',
  })
  async 뉴스_오더를_일괄_수정한다(
    @Body() updateDto: UpdateNewsBatchOrderDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ success: boolean; updatedCount: number }> {
    return await this.newsBusinessService.뉴스_오더를_일괄_수정한다(
      updateDto.news,
      user.id,
    );
  }

  /**
   * 뉴스를 수정한다 (파일 포함)
   */
  @Put(':id')
  @UseInterceptors(
    FilesInterceptor('files', undefined, {
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
    summary: '뉴스 수정',
    description:
      '뉴스의 정보 및 파일을 수정합니다.\n\n' +
      '**참고**: `updatedBy`는 토큰에서 자동으로 추출됩니다.',
  })
  @ApiBody({
    description:
      '⚠️ **중요**: 제목과 카테고리는 필수입니다.\n\n' +
      '**뉴스 URL**: 외부 링크나 뉴스 기사 원본 URL을 수정할 수 있습니다.\n\n' +
      '**카테고리**: categoryId를 통해 뉴스 카테고리를 변경해야 합니다.\n\n' +
      '**파일 관리 방식**:\n' +
      '- `files`를 전송하면: 기존 파일 전부 삭제 → 새 파일들로 교체\n' +
      '- `files`를 전송하지 않으면: 기존 파일 전부 삭제 (파일 없음)\n' +
      '- 기존 파일을 유지하려면 반드시 해당 파일을 다시 전송해야 합니다',
    schema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: '제목',
          example: '루미르, 신제품 출시',
        },
        description: {
          type: 'string',
          description: '설명 (선택)',
          example: '루미르가 혁신적인 신제품을 출시했습니다.',
        },
        url: {
          type: 'string',
          description: '외부 링크 또는 뉴스 기사 URL (선택)',
          example: 'https://news.example.com/lumir-new-product',
        },
        categoryId: {
          type: 'string',
          format: 'uuid',
          description: '뉴스 카테고리 ID (필수)',
          example: '123e4567-e89b-12d3-a456-426614174000',
        },
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description:
            '첨부파일 목록 (PDF/JPG/PNG/WEBP만 가능) - 전송한 파일들로 완전히 교체됩니다',
        },
      },
      required: ['title', 'categoryId'],
    },
  })
  @ApiResponse({
    status: 200,
    description: '뉴스 수정 성공',
    type: NewsResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '뉴스를 찾을 수 없음',
  })
  async 뉴스를_수정한다(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: any,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<any> {
    // UUID 형식 검증
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new BadRequestException('id는 유효한 UUID 형식이어야 합니다.');
    }

    const { title, description, url, categoryId } = body;

    if (!title) {
      throw new BadRequestException('title 필드는 필수입니다.');
    }

    if (!categoryId) {
      throw new BadRequestException('categoryId 필드는 필수입니다.');
    }

    return await this.newsBusinessService.뉴스를_수정한다(
      id,
      title,
      description || null,
      url || null,
      categoryId,
      user.id,
      files,
    );
  }

  /**
   * 뉴스 카테고리 목록을 조회한다
   */
  @Get('categories')
  @ApiOperation({
    summary: '뉴스 카테고리 목록 조회',
    description: '뉴스 카테고리 목록을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '뉴스 카테고리 목록 조회 성공',
    type: NewsCategoryListResponseDto,
  })
  async 뉴스_카테고리_목록을_조회한다(): Promise<NewsCategoryListResponseDto> {
    const items =
      await this.newsBusinessService.뉴스_카테고리_목록을_조회한다();

    return {
      items,
      total: items.length,
    };
  }

  /**
   * 뉴스 상세 조회한다
   *
   * 주의: 이 라우트는 categories 라우트보다 뒤에 와야 합니다.
   * 그렇지 않으면 /categories가 :id로 매칭됩니다.
   */
  @Get(':id')
  @ApiOperation({
    summary: '뉴스 상세 조회',
    description: '뉴스의 상세 정보를 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '뉴스 상세 조회 성공',
    type: NewsResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '뉴스를 찾을 수 없음',
  })
  async 뉴스_상세_조회한다(@Param('id') id: string): Promise<NewsResponseDto> {
    // UUID 형식 검증
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new BadRequestException('id는 유효한 UUID 형식이어야 합니다.');
    }

    return await this.newsBusinessService.뉴스_상세_조회한다(id);
  }

  /**
   * 뉴스 공개를 수정한다
   */
  @Patch(':id/public')
  @UseGuards(StrictBooleanValidationGuard)
  @StrictBooleanFields('isPublic')
  @ApiOperation({
    summary: '뉴스 공개 상태 수정',
    description:
      '뉴스의 공개 상태를 수정합니다.\n\n' +
      '**참고**: `updatedBy`는 토큰에서 자동으로 추출됩니다.',
  })
  @ApiResponse({
    status: 200,
    description: '뉴스 공개 상태 수정 성공',
    type: NewsResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '뉴스를 찾을 수 없음',
  })
  async 뉴스_공개를_수정한다(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() updateDto: UpdateNewsPublicDto,
  ): Promise<NewsResponseDto> {
    // UUID 형식 검증
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new BadRequestException('id는 유효한 UUID 형식이어야 합니다.');
    }

    return await this.newsBusinessService.뉴스_공개를_수정한다(id, {
      ...updateDto,
      updatedBy: user.id,
    });
  }

  /**
   * 뉴스를 삭제한다
   */
  @Delete(':id')
  @ApiOperation({
    summary: '뉴스 삭제',
    description: '뉴스를 삭제합니다 (Soft Delete).',
  })
  @ApiResponse({
    status: 200,
    description: '뉴스 삭제 성공',
  })
  @ApiResponse({
    status: 404,
    description: '뉴스를 찾을 수 없음',
  })
  async 뉴스를_삭제한다(
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    // UUID 형식 검증
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new BadRequestException('id는 유효한 UUID 형식이어야 합니다.');
    }

    const result = await this.newsBusinessService.뉴스를_삭제한다(id);
    return { success: result };
  }

  /**
   * 뉴스 카테고리를 생성한다
   */
  @Post('categories')
  @ApiOperation({
    summary: '뉴스 카테고리 생성',
    description:
      '새로운 뉴스 카테고리를 생성합니다.\n\n' +
      '**참고**: `createdBy`는 토큰에서 자동으로 추출됩니다.',
  })
  @ApiResponse({
    status: 201,
    description: '뉴스 카테고리 생성 성공',
    type: NewsCategoryResponseDto,
  })
  async 뉴스_카테고리를_생성한다(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createDto: CreateNewsCategoryDto,
  ): Promise<NewsCategoryResponseDto> {
    return await this.newsBusinessService.뉴스_카테고리를_생성한다({
      ...createDto,
      createdBy: user.id,
    });
  }

  /**
   * 뉴스 카테고리를 수정한다
   */
  @Patch('categories/:id')
  @ApiOperation({
    summary: '뉴스 카테고리 수정',
    description:
      '뉴스의 카테고리를 수정합니다.\n\n' +
      '**참고**: `updatedBy`는 토큰에서 자동으로 추출됩니다.',
  })
  @ApiResponse({
    status: 200,
    description: '뉴스 카테고리 수정 성공',
  })
  @ApiResponse({
    status: 404,
    description: '뉴스를 찾을 수 없음',
  })
  async 뉴스_카테고리를_수정한다(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() updateDto: UpdateNewsCategoryDto,
  ): Promise<NewsCategoryResponseDto> {
    // UUID 형식 검증
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new BadRequestException('id는 유효한 UUID 형식이어야 합니다.');
    }

    return await this.newsBusinessService.뉴스_카테고리를_수정한다(
      id,
      {
        ...updateDto,
        updatedBy: user.id,
      },
    );
  }

  /**
   * 뉴스 카테고리 오더를 변경한다
   */
  @Patch('categories/:id/order')
  @ApiOperation({
    summary: '뉴스 카테고리 오더 변경',
    description:
      '뉴스 카테고리의 정렬 순서를 변경합니다.\n\n' +
      '**참고**: `updatedBy`는 토큰에서 자동으로 추출됩니다.',
  })
  @ApiResponse({
    status: 200,
    description: '뉴스 카테고리 오더 변경 성공',
  })
  @ApiResponse({
    status: 404,
    description: '카테고리를 찾을 수 없음',
  })
  async 뉴스_카테고리_오더를_변경한다(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() updateDto: UpdateNewsCategoryOrderDto,
  ): Promise<NewsCategoryResponseDto> {
    // UUID 형식 검증
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new BadRequestException('id는 유효한 UUID 형식이어야 합니다.');
    }

    const result = await this.newsBusinessService.뉴스_카테고리_오더를_변경한다(
      id,
      {
        ...updateDto,
        updatedBy: user.id,
      },
    );
    return result;
  }

  /**
   * 뉴스 카테고리를 삭제한다
   */
  @Delete('categories/:id')
  @ApiOperation({
    summary: '뉴스 카테고리 삭제',
    description: '뉴스 카테고리를 삭제합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '뉴스 카테고리 삭제 성공',
  })
  @ApiResponse({
    status: 404,
    description: '카테고리를 찾을 수 없음',
  })
  async 뉴스_카테고리를_삭제한다(
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    // UUID 형식 검증
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new BadRequestException('id는 유효한 UUID 형식이어야 합니다.');
    }

    const result = await this.newsBusinessService.뉴스_카테고리를_삭제한다(id);
    return { success: result };
  }
}
