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
} from '@nestjs/swagger';
import { Public } from '@interface/common/decorators/public.decorator';
import { BrochureBusinessService } from '@business/brochure-business/brochure-business.service';
import { CreateBrochureDto } from '@interface/common/dto/brochure/create-brochure.dto';
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
@Public() // 테스트를 위해 임시로 Public 설정
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
   * 브로슈어를 생성한다
   */
  @Post()
  @ApiOperation({
    summary: '브로슈어 생성',
    description: '새로운 브로슈어를 생성합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '브로슈어 생성 성공',
    type: BrochureResponseDto,
  })
  async 브로슈어를_생성한다(
    @Body() createDto: CreateBrochureDto,
  ): Promise<BrochureResponseDto> {
    return await this.brochureBusinessService.브로슈어를_생성한다(createDto);
  }

  /**
   * 기본 브로슈어들을 추가한다
   */
  @Post('initialize-default')
  @ApiOperation({
    summary: '기본 브로슈어 초기화',
    description:
      '기본 브로슈어 목 데이터를 추가합니다. (회사 소개, 제품 카탈로그, 기술 백서)',
  })
  @ApiResponse({
    status: 201,
    description: '기본 브로슈어 추가 성공',
    type: [BrochureResponseDto],
  })
  async 기본_브로슈어들을_추가한다(): Promise<BrochureListResponseDto> {
    const items =
      await this.brochureBusinessService.기본_브로슈어들을_추가한다();

    return {
      items,
      total: items.length,
      page: 1,
      limit: items.length,
      totalPages: 1,
    };
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
   * 브로슈어 파일을 수정한다
   */
  @Patch(':id/files')
  @ApiOperation({
    summary: '브로슈어 파일 수정',
    description: '브로슈어의 첨부파일을 수정합니다.',
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
    @Body() updateDto: UpdateBrochureFileDto,
  ): Promise<BrochureResponseDto> {
    return await this.brochureBusinessService.브로슈어_파일을_수정한다(
      id,
      updateDto,
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
  ): Promise<{ success: boolean }> {
    const result =
      await this.brochureBusinessService.브로슈어_카테고리를_수정한다(
        id,
        updateDto,
      );
    return { success: result };
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
  ): Promise<BrochureCategoryResponseDto> {
    return await this.brochureBusinessService.브로슈어_카테고리_오더를_변경한다(
      id,
      updateDto,
    );
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
