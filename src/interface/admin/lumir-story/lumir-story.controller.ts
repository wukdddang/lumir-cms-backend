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
import { LumirStoryBusinessService } from '@business/lumir-story-business/lumir-story-business.service';
import {
  UpdateLumirStoryPublicDto,
  CreateLumirStoryCategoryDto,
  UpdateLumirStoryCategoryDto,
  UpdateLumirStoryCategoryOrderDto,
} from '@interface/common/dto/lumir-story/update-lumir-story.dto';
import { UpdateLumirStoryBatchOrderDto } from '@interface/common/dto/lumir-story/update-lumir-story-batch-order.dto';
import {
  LumirStoryResponseDto,
  LumirStoryListResponseDto,
  LumirStoryCategoryListResponseDto,
  LumirStoryCategoryResponseDto,
} from '@interface/common/dto/lumir-story/lumir-story-response.dto';

@ApiTags('A-6. 관리자 - 루미르스토리')
@ApiBearerAuth('Bearer')
@Controller('admin/lumir-stories')
export class LumirStoryController {
  constructor(
    private readonly lumirStoryBusinessService: LumirStoryBusinessService,
  ) {}

  /**
   * 루미르스토리 목록을 조회한다
   */
  @Get()
  @ApiOperation({
    summary: '루미르스토리 목록 조회',
    description: '루미르스토리 목록을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '루미르스토리 목록 조회 성공',
    type: LumirStoryListResponseDto,
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
  async 루미르스토리_목록을_조회한다(
    @Query('isPublic') isPublic?: string,
    @Query('orderBy') orderBy?: 'order' | 'createdAt',
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('categoryId') categoryId?: string,
  ): Promise<LumirStoryListResponseDto> {
    const isPublicFilter =
      isPublic === 'true' ? true : isPublic === 'false' ? false : undefined;
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;

    const result =
      await this.lumirStoryBusinessService.루미르스토리_목록을_조회한다(
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
   * 루미르스토리 전체 목록을 조회한다 (페이징 없음)
   */
  @Get('all')
  @ApiOperation({
    summary: '루미르스토리 전체 목록 조회',
    description: '모든 루미르스토리를 조회합니다. (페이징 없음)',
  })
  @ApiResponse({
    status: 200,
    description: '루미르스토리 전체 목록 조회 성공',
    type: [LumirStoryResponseDto],
  })
  async 루미르스토리_전체_목록을_조회한다(): Promise<LumirStoryResponseDto[]> {
    return await this.lumirStoryBusinessService.루미르스토리_전체_목록을_조회한다();
  }

  /**
   * 루미르스토리를 생성한다 (파일 업로드 포함)
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
    summary: '루미르스토리 생성',
    description:
      '새로운 루미르스토리를 생성합니다. 제목, 내용과 함께 생성됩니다. 기본값: 비공개, DRAFT 상태\n\n' +
      '**참고**: `createdBy`는 토큰에서 자동으로 추출됩니다.',
  })
  @ApiBody({
    description:
      '⚠️ **중요**: 제목, 내용, 카테고리 ID는 필수입니다.\n\n' +
      '**파일 관리 방식**:\n' +
      '- `files`를 전송하면: 첨부파일과 함께 생성\n' +
      '- `files`를 전송하지 않으면: 파일 없이 생성',
    schema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: '제목',
          example: '루미르의 혁신 이야기',
        },
        content: {
          type: 'string',
          description: '내용',
          example: '루미르는 끊임없이 혁신하고 있습니다...',
        },
        categoryId: {
          type: 'string',
          description: '카테고리 ID (UUID) - 선택사항',
          example: '123e4567-e89b-12d3-a456-426614174000',
        },
        imageUrl: {
          type: 'string',
          description: '썸네일/대표 이미지 URL (선택)',
          example: 'https://s3.amazonaws.com/thumbnail.jpg',
        },
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: '첨부파일 목록 (PDF/JPG/PNG/WEBP만 가능)',
        },
      },
      required: ['title', 'content'],
    },
  })
  @ApiResponse({
    status: 201,
    description: '루미르스토리 생성 성공 (비공개, DRAFT 상태로 생성됨)',
    type: LumirStoryResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청 (제목 없음, 내용 없음, 파일 형식 오류)',
  })
  async 루미르스토리를_생성한다(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<LumirStoryResponseDto> {
    const { title, content, categoryId, imageUrl } = body;

    if (!title) {
      throw new BadRequestException('title 필드는 필수입니다.');
    }

    if (!content) {
      throw new BadRequestException('content 필드는 필수입니다.');
    }

    const lumirStory =
      await this.lumirStoryBusinessService.루미르스토리를_생성한다(
        title,
        content,
        categoryId || null,
        imageUrl || null,
        user.id,
        files,
      );

    return {
      ...lumirStory,
      categoryName: lumirStory.category?.name,
    };
  }

  /**
   * 루미르스토리 오더를 일괄 수정한다
   *
   * 주의: 이 라우트는 :id 라우트보다 앞에 와야 합니다.
   * 그렇지 않으면 /batch-order가 :id로 매칭됩니다.
   */
  @Put('batch-order')
  @ApiOperation({
    summary: '루미르스토리 오더 일괄 수정',
    description:
      '여러 루미르스토리의 정렬 순서를 한번에 수정합니다. 프론트엔드에서 변경된 순서대로 루미르스토리 목록을 전달하면 됩니다.',
  })
  @ApiResponse({
    status: 200,
    description: '루미르스토리 오더 일괄 수정 성공',
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
    description: '잘못된 요청 (수정할 루미르스토리가 없음)',
  })
  @ApiResponse({
    status: 404,
    description: '일부 루미르스토리를 찾을 수 없음',
  })
  async 루미르스토리_오더를_일괄_수정한다(
    @Body() updateDto: UpdateLumirStoryBatchOrderDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ success: boolean; updatedCount: number }> {
    return await this.lumirStoryBusinessService.루미르스토리_오더를_일괄_수정한다(
      updateDto.lumirStories,
      user.id,
    );
  }

  /**
   * 루미르스토리를 수정한다 (파일 포함)
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
    summary: '루미르스토리 수정',
    description:
      '루미르스토리의 정보 및 파일을 수정합니다.\n\n' +
      '**필수 필드:**\n' +
      '- `title`: 제목\n' +
      '- `content`: 내용\n\n' +
      '**참고**: `updatedBy`는 토큰에서 자동으로 추출됩니다.',
  })
  @ApiBody({
    description:
      '⚠️ **중요**: 제목과 내용은 필수입니다.\n\n' +
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
          example: '루미르의 혁신 이야기',
        },
        content: {
          type: 'string',
          description: '내용',
          example: '루미르는 끊임없이 혁신하고 있습니다...',
        },
        categoryId: {
          type: 'string',
          description: '카테고리 ID (UUID) - 선택사항',
          example: '123e4567-e89b-12d3-a456-426614174000',
        },
        imageUrl: {
          type: 'string',
          description: '썸네일/대표 이미지 URL (선택)',
          example: 'https://s3.amazonaws.com/thumbnail.jpg',
        },
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description:
            '첨부파일 목록 (PDF/JPG/PNG/WEBP만 가능) - 전송한 파일들로 완전히 교체됩니다',
        },
      },
      required: ['title', 'content'],
    },
  })
  @ApiResponse({
    status: 200,
    description: '루미르스토리 수정 성공',
    type: LumirStoryResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '루미르스토리를 찾을 수 없음',
  })
  async 루미르스토리를_수정한다(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: any,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<any> {
    const { title, content, categoryId, imageUrl } = body;

    if (!title) {
      throw new BadRequestException('title 필드는 필수입니다.');
    }

    if (!content) {
      throw new BadRequestException('content 필드는 필수입니다.');
    }

    return await this.lumirStoryBusinessService.루미르스토리를_수정한다(
      id,
      title,
      content,
      user.id,
      categoryId || null,
      imageUrl || null,
      files,
    );
  }

  /**
   * 루미르스토리 카테고리 목록을 조회한다
   */
  @Get('categories')
  @ApiOperation({
    summary: '루미르스토리 카테고리 목록 조회',
    description: '루미르스토리 카테고리 목록을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '루미르스토리 카테고리 목록 조회 성공',
    type: LumirStoryCategoryListResponseDto,
  })
  async 루미르스토리_카테고리_목록을_조회한다(): Promise<LumirStoryCategoryListResponseDto> {
    const items =
      await this.lumirStoryBusinessService.루미르스토리_카테고리_목록을_조회한다();

    return {
      items,
      total: items.length,
    };
  }

  /**
   * 루미르스토리 상세 조회한다
   *
   * 주의: 이 라우트는 categories 라우트보다 뒤에 와야 합니다.
   * 그렇지 않으면 /categories가 :id로 매칭됩니다.
   */
  @Get(':id')
  @ApiOperation({
    summary: '루미르스토리 상세 조회',
    description: '루미르스토리의 상세 정보를 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '루미르스토리 상세 조회 성공',
    type: LumirStoryResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '루미르스토리를 찾을 수 없음',
  })
  async 루미르스토리_상세_조회한다(
    @Param('id') id: string,
  ): Promise<LumirStoryResponseDto> {
    return await this.lumirStoryBusinessService.루미르스토리_상세_조회한다(id);
  }

  /**
   * 루미르스토리 공개를 수정한다
   */
  @Patch(':id/public')
  @ApiOperation({
    summary: '루미르스토리 공개 상태 수정',
    description:
      '루미르스토리의 공개 상태를 수정합니다.\n\n' +
      '**참고**: `updatedBy`는 토큰에서 자동으로 추출됩니다.',
  })
  @ApiResponse({
    status: 200,
    description: '루미르스토리 공개 상태 수정 성공',
    type: LumirStoryResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '루미르스토리를 찾을 수 없음',
  })
  async 루미르스토리_공개를_수정한다(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() updateDto: UpdateLumirStoryPublicDto,
  ): Promise<LumirStoryResponseDto> {
    const lumirStory =
      await this.lumirStoryBusinessService.루미르스토리_공개를_수정한다(id, {
        ...updateDto,
        updatedBy: user.id,
      });

    return {
      ...lumirStory,
      categoryName: lumirStory.category?.name,
    };
  }

  /**
   * 루미르스토리를 삭제한다
   */
  @Delete(':id')
  @ApiOperation({
    summary: '루미르스토리 삭제',
    description: '루미르스토리를 삭제합니다 (Soft Delete).',
  })
  @ApiResponse({
    status: 200,
    description: '루미르스토리 삭제 성공',
  })
  @ApiResponse({
    status: 404,
    description: '루미르스토리를 찾을 수 없음',
  })
  async 루미르스토리를_삭제한다(
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    const result =
      await this.lumirStoryBusinessService.루미르스토리를_삭제한다(id);
    return { success: result };
  }

  /**
   * 루미르스토리 카테고리를 생성한다
   */
  @Post('categories')
  @ApiOperation({
    summary: '루미르스토리 카테고리 생성',
    description:
      '새로운 루미르스토리 카테고리를 생성합니다.\n\n' +
      '**참고**: `createdBy`는 토큰에서 자동으로 추출됩니다.',
  })
  @ApiResponse({
    status: 201,
    description: '루미르스토리 카테고리 생성 성공',
    type: LumirStoryCategoryResponseDto,
  })
  async 루미르스토리_카테고리를_생성한다(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createDto: CreateLumirStoryCategoryDto,
  ): Promise<LumirStoryCategoryResponseDto> {
    return await this.lumirStoryBusinessService.루미르스토리_카테고리를_생성한다(
      {
        ...createDto,
        createdBy: user.id,
      },
    );
  }

  /**
   * 루미르스토리 카테고리를 수정한다
   */
  @Patch('categories/:id')
  @ApiOperation({
    summary: '루미르스토리 카테고리 수정',
    description:
      '루미르스토리의 카테고리를 수정합니다.\n\n' +
      '**참고**: `updatedBy`는 토큰에서 자동으로 추출됩니다.',
  })
  @ApiResponse({
    status: 200,
    description: '루미르스토리 카테고리 수정 성공',
  })
  @ApiResponse({
    status: 404,
    description: '루미르스토리를 찾을 수 없음',
  })
  async 루미르스토리_카테고리를_수정한다(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() updateDto: UpdateLumirStoryCategoryDto,
  ): Promise<LumirStoryCategoryResponseDto> {
    return await this.lumirStoryBusinessService.루미르스토리_카테고리를_수정한다(
      id,
      {
        ...updateDto,
        updatedBy: user.id,
      },
    );
  }

  /**
   * 루미르스토리 카테고리 오더를 변경한다
   */
  @Patch('categories/:id/order')
  @ApiOperation({
    summary: '루미르스토리 카테고리 오더 변경',
    description:
      '루미르스토리 카테고리의 정렬 순서를 변경합니다.\n\n' +
      '**참고**: `updatedBy`는 토큰에서 자동으로 추출됩니다.',
  })
  @ApiResponse({
    status: 200,
    description: '루미르스토리 카테고리 오더 변경 성공',
  })
  @ApiResponse({
    status: 404,
    description: '카테고리를 찾을 수 없음',
  })
  async 루미르스토리_카테고리_오더를_변경한다(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() updateDto: UpdateLumirStoryCategoryOrderDto,
  ): Promise<LumirStoryCategoryResponseDto> {
    const result =
      await this.lumirStoryBusinessService.루미르스토리_카테고리_오더를_변경한다(
        id,
        {
          ...updateDto,
          updatedBy: user.id,
        },
      );
    return result;
  }

  /**
   * 루미르스토리 카테고리를 삭제한다
   */
  @Delete('categories/:id')
  @ApiOperation({
    summary: '루미르스토리 카테고리 삭제',
    description: '루미르스토리 카테고리를 삭제합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '루미르스토리 카테고리 삭제 성공',
  })
  @ApiResponse({
    status: 404,
    description: '카테고리를 찾을 수 없음',
  })
  async 루미르스토리_카테고리를_삭제한다(
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    const result =
      await this.lumirStoryBusinessService.루미르스토리_카테고리를_삭제한다(id);
    return { success: result };
  }
}
