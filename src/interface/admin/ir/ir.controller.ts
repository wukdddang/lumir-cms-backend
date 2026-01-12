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
import { IRBusinessService } from '@business/ir-business/ir-business.service';
import { IR } from '@domain/core/ir/ir.entity';
import {
  IRListResponseDto,
  IRResponseDto,
  IRCategoryResponseDto,
  IRCategoryListResponseDto,
} from '@interface/common/dto/ir/ir-response.dto';
import { UpdateIRBatchOrderDto } from '@interface/common/dto/ir/update-ir-batch-order.dto';

@ApiTags('A-4. 관리자 - IR')
@ApiBearerAuth('Bearer')
@Controller('admin/irs')
export class IRController {
  constructor(private readonly irBusinessService: IRBusinessService) {}

  /**
   * IR 목록을 조회한다 (페이징)
   */
  @Get()
  @ApiOperation({
    summary: 'IR 목록 조회',
    description: 'IR 목록을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: 'IR 목록 조회 성공',
    type: IRListResponseDto,
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
  async IR_목록을_조회한다(
    @Query('isPublic') isPublic?: string,
    @Query('orderBy') orderBy?: 'order' | 'createdAt',
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<IRListResponseDto> {
    const isPublicFilter =
      isPublic === 'true' ? true : isPublic === 'false' ? false : undefined;
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;

    const result = await this.irBusinessService.IR_목록을_조회한다(
      isPublicFilter,
      orderBy || 'order',
      pageNum,
      limitNum,
    );

    return result;
  }

  /**
   * IR 카테고리 목록을 조회한다
   */
  @Get('categories')
  @ApiOperation({
    summary: 'IR 카테고리 목록 조회',
    description: 'IR 카테고리 목록을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: 'IR 카테고리 목록 조회 성공',
    type: IRCategoryListResponseDto,
  })
  async IR_카테고리_목록을_조회한다(): Promise<IRCategoryListResponseDto> {
    const items = await this.irBusinessService.IR_카테고리_목록을_조회한다();

    return {
      items,
      total: items.length,
    };
  }

  /**
   * IR 전체 목록을 조회한다
   */
  @Get('all')
  @ApiOperation({
    summary: 'IR 전체 목록 조회',
    description: '모든 IR을 조회합니다. (페이징 없음)',
  })
  @ApiResponse({
    status: 200,
    description: 'IR 전체 목록 조회 성공',
    type: [IR],
  })
  async IR_전체_목록을_조회한다(): Promise<IR[]> {
    return await this.irBusinessService.IR_전체_목록을_조회한다();
  }

  /**
   * IR 상세를 조회한다
   *
   * 주의: 이 라우트는 categories 라우트보다 뒤에 와야 합니다.
   */
  @Get(':id')
  @ApiOperation({
    summary: 'IR 상세 조회',
    description: 'IR의 상세 정보를 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: 'IR 상세 조회 성공',
    type: IR,
  })
  @ApiResponse({
    status: 404,
    description: 'IR을 찾을 수 없음',
  })
  async IR_상세를_조회한다(@Param('id') id: string): Promise<IR> {
    return await this.irBusinessService.IR_상세를_조회한다(id);
  }

  /**
   * IR을 생성한다 (파일 업로드 포함)
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
    summary: 'IR 생성',
    description:
      '새로운 IR을 생성합니다. 제목, 설명과 함께 생성됩니다. 기본값: 비공개, DRAFT 상태',
  })
  @ApiBody({
    description:
      '⚠️ **중요**: translations 필드는 반드시 배열 형태의 JSON 문자열로 입력해야 합니다.\n\n' +
      '**예시 (한 개 언어)**:\n' +
      '```json\n' +
      '[{"languageId":"uuid-ko","title":"IR 자료","description":"투자자 정보 자료입니다."}]\n' +
      '```\n\n' +
      '**예시 (여러 언어)**:\n' +
      '```json\n' +
      '[{"languageId":"uuid-ko","title":"IR 자료","description":"투자자 정보 자료입니다."},{"languageId":"uuid-en","title":"IR Material","description":"Investor relations material."}]\n' +
      '```',
    schema: {
      type: 'object',
      properties: {
        translations: {
          type: 'string',
          description:
            '번역 목록 (JSON 배열 문자열) - 반드시 대괄호 []로 감싸야 합니다!',
          example:
            '[{"languageId":"31e6bbc6-2839-4477-9672-bb4b381e8914","title":"IR 자료","description":"투자자 정보 자료입니다."}]',
        },
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description:
            '첨부파일 목록 (최대 10개, PDF/JPG/PNG/WEBP/XLSX/DOCX만 가능)',
        },
      },
      required: ['translations'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'IR 생성 성공 (비공개, DRAFT 상태로 생성됨)',
    type: IRResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청 (언어 ID 없음, 제목 없음, 파일 형식 오류)',
  })
  async IR을_생성한다(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<IRResponseDto> {
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

    return await this.irBusinessService.IR을_생성한다(
      translations,
      user.id,
      files,
    );
  }

  /**
   * IR을 수정한다 (번역 및 파일 포함)
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
    summary: 'IR 수정',
    description: 'IR의 번역 정보 및 파일을 수정합니다.',
  })
  @ApiBody({
    description:
      '⚠️ **중요**: translations 필드는 반드시 배열 형태의 JSON 문자열로 입력해야 합니다.\n\n' +
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
            '번역 목록 (JSON 배열 문자열) - 반드시 대괄호 []로 감싸야 합니다!',
          example:
            '[{"languageId":"31e6bbc6-2839-4477-9672-bb4b381e8914","title":"IR 자료","description":"투자자 정보 자료입니다."}]',
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
    description: 'IR 수정 성공',
    type: IRResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'IR을 찾을 수 없음',
  })
  async IR을_수정한다(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: any,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<IRResponseDto> {
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

    return await this.irBusinessService.IR을_수정한다(
      id,
      translations,
      user.id,
      files,
    );
  }

  /**
   * IR 오더를 일괄 수정한다
   */
  @Put('batch-order')
  @ApiOperation({
    summary: 'IR 오더 일괄 수정',
    description:
      '여러 IR의 정렬 순서를 한번에 수정합니다. 프론트엔드에서 변경된 순서대로 IR 목록을 전달하면 됩니다.',
  })
  @ApiResponse({
    status: 200,
    description: 'IR 오더 일괄 수정 성공',
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
    description: '잘못된 요청 (수정할 IR이 없음)',
  })
  @ApiResponse({
    status: 404,
    description: '일부 IR을 찾을 수 없음',
  })
  async IR_오더를_일괄_수정한다(
    @Body() updateDto: UpdateIRBatchOrderDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ success: boolean; updatedCount: number }> {
    return await this.irBusinessService.IR_오더를_일괄_수정한다(
      updateDto.irs,
      user.id,
    );
  }

  /**
   * IR 공개 여부를 수정한다
   */
  @Patch(':id/public')
  @ApiOperation({
    summary: 'IR 공개 상태 수정',
    description: 'IR의 공개 상태를 수정합니다.',
  })
  @ApiResponse({
    status: 200,
    description: 'IR 공개 상태 수정 성공',
    type: IR,
  })
  @ApiResponse({
    status: 404,
    description: 'IR을 찾을 수 없음',
  })
  async IR_공개를_수정한다(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: { isPublic: boolean },
  ): Promise<IR> {
    return await this.irBusinessService.IR_공개를_수정한다(
      id,
      body.isPublic,
      user.id,
    );
  }

  /**
   * IR을 삭제한다
   */
  @Delete(':id')
  @ApiOperation({
    summary: 'IR 삭제',
    description: 'IR을 삭제합니다 (Soft Delete).',
  })
  @ApiResponse({
    status: 200,
    description: 'IR 삭제 성공',
  })
  @ApiResponse({
    status: 404,
    description: 'IR을 찾을 수 없음',
  })
  async IR을_삭제한다(@Param('id') id: string): Promise<{ success: boolean }> {
    const result = await this.irBusinessService.IR을_삭제한다(id);
    return { success: result };
  }

  /**
   * IR 카테고리를 생성한다
   */
  @Post('categories')
  @ApiOperation({
    summary: 'IR 카테고리 생성',
    description: '새로운 IR 카테고리를 생성합니다.',
  })
  @ApiResponse({
    status: 201,
    description: 'IR 카테고리 생성 성공',
    type: IRCategoryResponseDto,
  })
  async IR_카테고리를_생성한다(
    @Body() createDto: { name: string; description?: string },
  ): Promise<IRCategoryResponseDto> {
    return await this.irBusinessService.IR_카테고리를_생성한다(createDto);
  }

  /**
   * IR 카테고리를 수정한다
   */
  @Patch('categories/:id')
  @ApiOperation({
    summary: 'IR 카테고리 수정',
    description: 'IR 카테고리를 수정합니다.',
  })
  @ApiResponse({
    status: 200,
    description: 'IR 카테고리 수정 성공',
    type: IRCategoryResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '카테고리를 찾을 수 없음',
  })
  async IR_카테고리를_수정한다(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body()
    updateDto: { name?: string; description?: string; isActive?: boolean },
  ): Promise<IRCategoryResponseDto> {
    return await this.irBusinessService.IR_카테고리를_수정한다(id, {
      ...updateDto,
      updatedBy: user.id,
    });
  }

  /**
   * IR 카테고리 오더를 변경한다
   */
  @Patch('categories/:id/order')
  @ApiOperation({
    summary: 'IR 카테고리 오더 변경',
    description: 'IR 카테고리의 정렬 순서를 변경합니다.',
  })
  @ApiResponse({
    status: 200,
    description: 'IR 카테고리 오더 변경 성공',
    type: IRCategoryResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '카테고리를 찾을 수 없음',
  })
  async IR_카테고리_오더를_변경한다(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() updateDto: { order: number },
  ): Promise<IRCategoryResponseDto> {
    const result = await this.irBusinessService.IR_카테고리_오더를_변경한다(id, {
      order: updateDto.order,
      updatedBy: user.id,
    });
    return result;
  }

  /**
   * IR 카테고리를 삭제한다
   */
  @Delete('categories/:id')
  @ApiOperation({
    summary: 'IR 카테고리 삭제',
    description: 'IR 카테고리를 삭제합니다.',
  })
  @ApiResponse({
    status: 200,
    description: 'IR 카테고리 삭제 성공',
  })
  @ApiResponse({
    status: 404,
    description: '카테고리를 찾을 수 없음',
  })
  async IR_카테고리를_삭제한다(
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    const result = await this.irBusinessService.IR_카테고리를_삭제한다(id);
    return { success: result };
  }
}
