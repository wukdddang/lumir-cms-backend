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
  UsePipes,
  ValidationPipe,
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
import { VideoGalleryBusinessService } from '@business/video-gallery-business/video-gallery-business.service';
import {
  UpdateVideoGalleryPublicDto,
  CreateVideoGalleryCategoryDto,
  UpdateVideoGalleryCategoryDto,
  UpdateVideoGalleryCategoryOrderDto,
} from '@interface/common/dto/video-gallery/update-video-gallery.dto';
import { UpdateVideoGalleryBatchOrderDto } from '@interface/common/dto/video-gallery/update-video-gallery-batch-order.dto';
import {
  VideoGalleryResponseDto,
  VideoGalleryListResponseDto,
  VideoGalleryCategoryListResponseDto,
  VideoGalleryCategoryResponseDto,
} from '@interface/common/dto/video-gallery/video-gallery-response.dto';

@ApiTags('A-7. 관리자 - 비디오갤러리')
@ApiBearerAuth('Bearer')
@Controller('admin/video-galleries')
export class VideoGalleryController {
  constructor(
    private readonly videoGalleryBusinessService: VideoGalleryBusinessService,
  ) {}

  /**
   * 비디오갤러리 목록을 조회한다
   */
  @Get()
  @ApiOperation({
    summary: '비디오갤러리 목록 조회',
    description: '비디오갤러리 목록을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '비디오갤러리 목록 조회 성공',
    type: VideoGalleryListResponseDto,
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
  async 비디오갤러리_목록을_조회한다(
    @Query('isPublic') isPublic?: string,
    @Query('orderBy') orderBy?: 'order' | 'createdAt',
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('categoryId') categoryId?: string,
  ): Promise<VideoGalleryListResponseDto> {
    const isPublicFilter =
      isPublic === 'true' ? true : isPublic === 'false' ? false : undefined;
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;

    const result =
      await this.videoGalleryBusinessService.비디오갤러리_목록을_조회한다(
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
   * 비디오갤러리 전체 목록을 조회한다 (페이징 없음)
   */
  @Get('all')
  @ApiOperation({
    summary: '비디오갤러리 전체 목록 조회',
    description: '모든 비디오갤러리를 조회합니다. (페이징 없음)',
  })
  @ApiResponse({
    status: 200,
    description: '비디오갤러리 전체 목록 조회 성공',
    type: [VideoGalleryResponseDto],
  })
  async 비디오갤러리_전체_목록을_조회한다(): Promise<
    VideoGalleryResponseDto[]
  > {
    return await this.videoGalleryBusinessService.비디오갤러리_전체_목록을_조회한다();
  }

  /**
   * 비디오갤러리를 생성한다 (파일 업로드 포함)
   */
  @Post()
  @UseInterceptors(
    FilesInterceptor('files', undefined, {
      fileFilter: (req, file, callback) => {
        // 허용된 MIME 타입: 비디오 파일들
        const allowedMimeTypes = [
          'video/mp4',
          'video/mpeg',
          'video/quicktime',
          'video/x-msvideo',
          'video/x-ms-wmv',
          'video/webm',
        ];

        if (allowedMimeTypes.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(
            new Error(
              `지원하지 않는 파일 형식입니다. 허용된 형식: MP4, MPEG, MOV, AVI, WMV, WEBM (현재: ${file.mimetype})`,
            ),
            false,
          );
        }
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: '비디오갤러리 생성',
    description:
      '새로운 비디오갤러리를 생성합니다. 제목과 함께 생성됩니다. 기본값: 비공개, DRAFT 상태\n\n' +
      '**참고**: `createdBy`는 토큰에서 자동으로 추출됩니다.',
  })
  @ApiBody({
    description:
      '⚠️ **중요**: 제목과 카테고리는 필수입니다.\n\n' +
      '**비디오 소스 (여러 개 가능)**:\n' +
      '- `youtubeUrls`: YouTube 비디오 URL 배열 (여러 개 가능)\n' +
      '- `files`: 직접 비디오 파일 업로드 (여러 개 가능)\n' +
      '- 둘 다 입력 가능하며, 모든 URL은 하나의 배열로 통합되어 저장됩니다\n' +
      '- 파일은 S3에 업로드되고 URL로 변환되어 저장됩니다',
    schema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: '제목',
          example: '회사 소개 영상',
        },
        categoryId: {
          type: 'string',
          description: '카테고리 ID (선택)',
          example: '550e8400-e29b-41d4-a716-446655440000',
        },
        description: {
          type: 'string',
          description: '설명 (선택)',
          example: '루미르 회사 소개 동영상입니다.',
        },
        youtubeUrls: {
          type: 'string',
          description: 'YouTube 비디오 URL 배열 (JSON 문자열)',
          example:
            '["https://www.youtube.com/watch?v=abc123", "https://www.youtube.com/watch?v=def456"]',
        },
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: '비디오 파일 목록',
        },
      },
      required: ['title'],
    },
  })
  @ApiResponse({
    status: 201,
    description: '비디오갤러리 생성 성공 (비공개, DRAFT 상태로 생성됨)',
    type: VideoGalleryResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청 (제목 없음, 파일 형식 오류)',
  })
  async 비디오갤러리를_생성한다(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<VideoGalleryResponseDto> {
    const { title, categoryId, description, youtubeUrls } = body;

    if (!title) {
      throw new BadRequestException('title 필드는 필수입니다.');
    }

    // youtubeUrls가 JSON 문자열로 전달될 수 있으므로 파싱
    let parsedYoutubeUrls: string[] = [];
    if (youtubeUrls) {
      if (typeof youtubeUrls === 'string') {
        try {
          parsedYoutubeUrls = JSON.parse(youtubeUrls);
        } catch (error) {
          throw new BadRequestException(
            'youtubeUrls 파싱 실패: 올바른 JSON 배열 형식이 아닙니다.',
          );
        }
      } else if (Array.isArray(youtubeUrls)) {
        parsedYoutubeUrls = youtubeUrls;
      }
    }

    const videoGallery =
      await this.videoGalleryBusinessService.비디오갤러리를_생성한다(
        title,
        categoryId || null,
        description || null,
        parsedYoutubeUrls,
        user.id,
        files,
      );

    const { category, ...result } = videoGallery;
    return {
      ...result,
      categoryName: category?.name,
    };
  }

  /**
   * 비디오갤러리 카테고리 목록을 조회한다
   * 주의: 정적 라우트는 :id 라우트보다 앞에 와야 합니다.
   */
  @Get('categories')
  @ApiOperation({
    summary: '비디오갤러리 카테고리 목록 조회',
    description: '비디오갤러리 카테고리 목록을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '비디오갤러리 카테고리 목록 조회 성공',
    type: VideoGalleryCategoryListResponseDto,
  })
  async 비디오갤러리_카테고리_목록을_조회한다(): Promise<VideoGalleryCategoryListResponseDto> {
    const items =
      await this.videoGalleryBusinessService.비디오갤러리_카테고리_목록을_조회한다();

    return {
      items,
      total: items.length,
    };
  }

  /**
   * 비디오갤러리 오더를 일괄 수정한다
   * 주의: 정적 라우트는 :id 라우트보다 앞에 와야 합니다.
   */
  @Put('batch-order')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({
    summary: '비디오갤러리 오더 일괄 수정',
    description:
      '여러 비디오갤러리의 정렬 순서를 한번에 수정합니다. 프론트엔드에서 변경된 순서대로 비디오갤러리 목록을 전달하면 됩니다.',
  })
  @ApiResponse({
    status: 200,
    description: '비디오갤러리 오더 일괄 수정 성공',
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
    description: '잘못된 요청 (수정할 비디오갤러리가 없음)',
  })
  @ApiResponse({
    status: 404,
    description: '일부 비디오갤러리를 찾을 수 없음',
  })
  async 비디오갤러리_오더를_일괄_수정한다(
    @Body() updateDto: UpdateVideoGalleryBatchOrderDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ success: boolean; updatedCount: number }> {
    return await this.videoGalleryBusinessService.비디오갤러리_오더를_일괄_수정한다(
      updateDto.videoGalleries,
      user.id,
    );
  }

  /**
   * 비디오갤러리를 수정한다 (파일 포함)
   * 주의: 동적 라우트(:id)는 정적 라우트 뒤에 와야 합니다.
   */
  @Put(':id')
  @UseInterceptors(
    FilesInterceptor('files', undefined, {
      fileFilter: (req, file, callback) => {
        // 허용된 MIME 타입: 비디오 파일들
        const allowedMimeTypes = [
          'video/mp4',
          'video/mpeg',
          'video/quicktime',
          'video/x-msvideo',
          'video/x-ms-wmv',
          'video/webm',
        ];

        if (allowedMimeTypes.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(
            new Error(
              `지원하지 않는 파일 형식입니다. 허용된 형식: MP4, MPEG, MOV, AVI, WMV, WEBM (현재: ${file.mimetype})`,
            ),
            false,
          );
        }
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: '비디오갤러리 수정',
    description:
      '비디오갤러리의 정보 및 파일을 수정합니다.\n\n' +
      '**필수 필드:**\n' +
      '- `title`: 제목\n\n' +
      '**선택 필드:**\n' +
      '- `categoryId`: 카테고리 ID (UUID)\n' +
      '- `description`: 설명\n' +
      '- `youtubeUrls`: YouTube URL 목록\n' +
      '- `files`: 첨부파일\n\n' +
      '**참고**: `updatedBy`는 토큰에서 자동으로 추출됩니다.',
  })
  @ApiBody({
    description:
      '⚠️ **중요**: 제목과 카테고리 ID는 필수입니다.\n\n' +
      '**비디오 소스 (여러 개 가능)**:\n' +
      '- `youtubeUrls`: YouTube 비디오 URL 배열 (여러 개 가능)\n' +
      '- `files`: 직접 비디오 파일 업로드 (여러 개 가능)\n' +
      '- 둘 다 입력 가능하며, 모든 URL은 하나의 배열로 통합되어 저장됩니다\n' +
      '- 파일은 S3에 업로드되고 URL로 변환되어 저장됩니다\n\n' +
      '**비디오 관리 방식 (완전 교체)**:\n' +
      '- 수정 시 기존 비디오는 전부 삭제되고 새로 입력한 것으로 교체됩니다\n' +
      '- 기존 비디오를 유지하려면 해당 URL을 다시 전송해야 합니다',
    schema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: '제목',
          example: '회사 소개 영상',
        },
        categoryId: {
          type: 'string',
          description: '카테고리 ID (선택)',
          example: '550e8400-e29b-41d4-a716-446655440000',
        },
        description: {
          type: 'string',
          description: '설명 (선택)',
          example: '루미르 회사 소개 동영상입니다.',
        },
        youtubeUrls: {
          type: 'string',
          description: 'YouTube 비디오 URL 배열 (JSON 문자열)',
          example:
            '["https://www.youtube.com/watch?v=abc123", "https://www.youtube.com/watch?v=def456"]',
        },
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: '비디오 파일 목록 - 전송한 것으로 완전히 교체됩니다',
        },
      },
      required: ['title'],
    },
  })
  @ApiResponse({
    status: 200,
    description: '비디오갤러리 수정 성공',
    type: VideoGalleryResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '비디오갤러리를 찾을 수 없음',
  })
  async 비디오갤러리를_수정한다(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: any,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<any> {
    const { title, categoryId, description, youtubeUrls } = body;

    if (!title) {
      throw new BadRequestException('title 필드는 필수입니다.');
    }

    // youtubeUrls가 JSON 문자열로 전달될 수 있으므로 파싱
    let parsedYoutubeUrls: string[] = [];
    if (youtubeUrls) {
      if (typeof youtubeUrls === 'string') {
        try {
          parsedYoutubeUrls = JSON.parse(youtubeUrls);
        } catch (error) {
          throw new BadRequestException(
            'youtubeUrls 파싱 실패: 올바른 JSON 배열 형식이 아닙니다.',
          );
        }
      } else if (Array.isArray(youtubeUrls)) {
        parsedYoutubeUrls = youtubeUrls;
      }
    }

    return await this.videoGalleryBusinessService.비디오갤러리를_수정한다(
      id,
      title,
      user.id,
      categoryId || null,
      description || null,
      parsedYoutubeUrls,
      files,
    );
  }

  /**
   * 비디오갤러리 상세 조회한다
   *
   * 주의: 이 라우트는 categories, batch-order 라우트보다 뒤에 와야 합니다.
   * 그렇지 않으면 /categories, /batch-order가 :id로 매칭됩니다.
   */
  @Get(':id')
  @ApiOperation({
    summary: '비디오갤러리 상세 조회',
    description: '비디오갤러리의 상세 정보를 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '비디오갤러리 상세 조회 성공',
    type: VideoGalleryResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '비디오갤러리를 찾을 수 없음',
  })
  async 비디오갤러리_상세_조회한다(
    @Param('id') id: string,
  ): Promise<VideoGalleryResponseDto> {
    return await this.videoGalleryBusinessService.비디오갤러리_상세_조회한다(
      id,
    );
  }

  /**
   * 비디오갤러리 공개를 수정한다
   */
  @Patch(':id/public')
  @ApiOperation({
    summary: '비디오갤러리 공개 상태 수정',
    description:
      '비디오갤러리의 공개 상태를 수정합니다.\n\n' +
      '**참고**: `updatedBy`는 토큰에서 자동으로 추출됩니다.',
  })
  @ApiResponse({
    status: 200,
    description: '비디오갤러리 공개 상태 수정 성공',
    type: VideoGalleryResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '비디오갤러리를 찾을 수 없음',
  })
  async 비디오갤러리_공개를_수정한다(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() updateDto: UpdateVideoGalleryPublicDto,
  ): Promise<VideoGalleryResponseDto> {
    const videoGallery =
      await this.videoGalleryBusinessService.비디오갤러리_공개를_수정한다(id, {
        ...updateDto,
        updatedBy: user.id,
      });

    const { category, ...result } = videoGallery;
    return {
      ...result,
      categoryName: category?.name,
    };
  }

  /**
   * 비디오갤러리를 삭제한다
   */
  @Delete(':id')
  @ApiOperation({
    summary: '비디오갤러리 삭제',
    description: '비디오갤러리를 삭제합니다 (Soft Delete).',
  })
  @ApiResponse({
    status: 200,
    description: '비디오갤러리 삭제 성공',
  })
  @ApiResponse({
    status: 404,
    description: '비디오갤러리를 찾을 수 없음',
  })
  async 비디오갤러리를_삭제한다(
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    const result =
      await this.videoGalleryBusinessService.비디오갤러리를_삭제한다(id);
    return { success: result };
  }

  /**
   * 비디오갤러리 카테고리를 생성한다
   */
  @Post('categories')
  @ApiOperation({
    summary: '비디오갤러리 카테고리 생성',
    description:
      '새로운 비디오갤러리 카테고리를 생성합니다.\n\n' +
      '**참고**: `createdBy`는 토큰에서 자동으로 추출됩니다.',
  })
  @ApiResponse({
    status: 201,
    description: '비디오갤러리 카테고리 생성 성공',
    type: VideoGalleryCategoryResponseDto,
  })
  async 비디오갤러리_카테고리를_생성한다(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createDto: CreateVideoGalleryCategoryDto,
  ): Promise<VideoGalleryCategoryResponseDto> {
    return await this.videoGalleryBusinessService.비디오갤러리_카테고리를_생성한다(
      {
        ...createDto,
        createdBy: user.id,
      },
    );
  }

  /**
   * 비디오갤러리 카테고리를 수정한다
   */
  @Patch('categories/:id')
  @ApiOperation({
    summary: '비디오갤러리 카테고리 수정',
    description:
      '비디오갤러리의 카테고리를 수정합니다.\n\n' +
      '**참고**: `updatedBy`는 토큰에서 자동으로 추출됩니다.',
  })
  @ApiResponse({
    status: 200,
    description: '비디오갤러리 카테고리 수정 성공',
  })
  @ApiResponse({
    status: 404,
    description: '비디오갤러리를 찾을 수 없음',
  })
  async 비디오갤러리_카테고리를_수정한다(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() updateDto: UpdateVideoGalleryCategoryDto,
  ): Promise<VideoGalleryCategoryResponseDto> {
    return await this.videoGalleryBusinessService.비디오갤러리_카테고리를_수정한다(
      id,
      {
        ...updateDto,
        updatedBy: user.id,
      },
    );
  }

  /**
   * 비디오갤러리 카테고리 오더를 변경한다
   */
  @Patch('categories/:id/order')
  @ApiOperation({
    summary: '비디오갤러리 카테고리 오더 변경',
    description:
      '비디오갤러리 카테고리의 정렬 순서를 변경합니다.\n\n' +
      '**참고**: `updatedBy`는 토큰에서 자동으로 추출됩니다.',
  })
  @ApiResponse({
    status: 200,
    description: '비디오갤러리 카테고리 오더 변경 성공',
  })
  @ApiResponse({
    status: 404,
    description: '카테고리를 찾을 수 없음',
  })
  async 비디오갤러리_카테고리_오더를_변경한다(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() updateDto: UpdateVideoGalleryCategoryOrderDto,
  ): Promise<VideoGalleryCategoryResponseDto> {
    const result =
      await this.videoGalleryBusinessService.비디오갤러리_카테고리_오더를_변경한다(
        id,
        {
          ...updateDto,
          updatedBy: user.id,
        },
      );
    return result;
  }

  /**
   * 비디오갤러리 카테고리를 삭제한다
   */
  @Delete('categories/:id')
  @ApiOperation({
    summary: '비디오갤러리 카테고리 삭제',
    description: '비디오갤러리 카테고리를 삭제합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '비디오갤러리 카테고리 삭제 성공',
  })
  @ApiResponse({
    status: 404,
    description: '카테고리를 찾을 수 없음',
  })
  async 비디오갤러리_카테고리를_삭제한다(
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    const result =
      await this.videoGalleryBusinessService.비디오갤러리_카테고리를_삭제한다(
        id,
      );
    return { success: result };
  }
}
