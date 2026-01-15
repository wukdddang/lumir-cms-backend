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
  ParseUUIDPipe,
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
import { ElectronicDisclosureBusinessService } from '@business/electronic-disclosure-business/electronic-disclosure-business.service';
import { ElectronicDisclosure } from '@domain/core/electronic-disclosure/electronic-disclosure.entity';
import {
  CreateElectronicDisclosureCategoryDto,
  UpdateElectronicDisclosureCategoryEntityDto,
  UpdateElectronicDisclosureCategoryOrderDto,
} from '@interface/common/dto/electronic-disclosure/update-electronic-disclosure.dto';
import { UpdateElectronicDisclosureBatchOrderDto } from '@interface/common/dto/electronic-disclosure/update-electronic-disclosure-batch-order.dto';
import {
  ElectronicDisclosureListResponseDto,
  ElectronicDisclosureResponseDto,
  ElectronicDisclosureCategoryResponseDto,
  ElectronicDisclosureCategoryListResponseDto,
} from '@interface/common/dto/electronic-disclosure/electronic-disclosure-response.dto';

@ApiTags('A-2. 관리자 - 전자공시')
@ApiBearerAuth('Bearer')
@Controller('admin/electronic-disclosures')
export class ElectronicDisclosureController {
  constructor(
    private readonly electronicDisclosureBusinessService: ElectronicDisclosureBusinessService,
  ) {}

  /**
   * 전자공시 목록을 조회한다 (페이징)
   */
  @Get()
  @ApiOperation({
    summary: '전자공시 목록 조회',
    description: '전자공시 목록을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '전자공시 목록 조회 성공',
    type: ElectronicDisclosureListResponseDto,
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
  async 전자공시_목록을_조회한다(
    @Query('isPublic') isPublic?: string,
    @Query('orderBy') orderBy?: 'order' | 'createdAt',
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<ElectronicDisclosureListResponseDto> {
    const isPublicFilter =
      isPublic === 'true' ? true : isPublic === 'false' ? false : undefined;
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;

    const result =
      await this.electronicDisclosureBusinessService.전자공시_목록을_조회한다(
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
   * 전자공시 카테고리 목록을 조회한다
   */
  @Get('categories')
  @ApiOperation({
    summary: '전자공시 카테고리 목록 조회',
    description: '전자공시 카테고리 목록을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '전자공시 카테고리 목록 조회 성공',
    type: ElectronicDisclosureCategoryListResponseDto,
  })
  async 전자공시_카테고리_목록을_조회한다(): Promise<ElectronicDisclosureCategoryListResponseDto> {
    const items =
      await this.electronicDisclosureBusinessService.전자공시_카테고리_목록을_조회한다();

    return {
      items,
      total: items.length,
    };
  }

  /**
   * 전자공시 전체 목록을 조회한다
   */
  @Get('all')
  @ApiOperation({
    summary: '전자공시 전체 목록 조회',
    description: '모든 전자공시를 조회합니다. (페이징 없음)',
  })
  @ApiResponse({
    status: 200,
    description: '전자공시 전체 목록 조회 성공',
    type: [ElectronicDisclosure],
  })
  async 전자공시_전체_목록을_조회한다(): Promise<ElectronicDisclosure[]> {
    return await this.electronicDisclosureBusinessService.전자공시_전체_목록을_조회한다();
  }

  /**
   * 전자공시 상세를 조회한다
   *
   * 주의: 이 라우트는 categories 라우트보다 뒤에 와야 합니다.
   */
  @Get(':id')
  @ApiOperation({
    summary: '전자공시 상세 조회',
    description: '전자공시의 상세 정보를 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '전자공시 상세 조회 성공',
    type: ElectronicDisclosure,
  })
  @ApiResponse({
    status: 404,
    description: '전자공시를 찾을 수 없음',
  })
  async 전자공시_상세를_조회한다(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ElectronicDisclosure> {
    return await this.electronicDisclosureBusinessService.전자공시_상세를_조회한다(
      id,
    );
  }

  /**
   * 전자공시를 생성한다 (파일 업로드 포함)
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
          // BadRequestException을 사용하여 400 에러 처리
          callback(
            new BadRequestException(
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
    summary: '전자공시 생성',
    description:
      '새로운 전자공시를 생성합니다. 제목, 설명과 함께 생성됩니다. 기본값: 비공개, DRAFT 상태',
  })
  @ApiBody({
    description:
      '⚠️ **중요**: translations 필드는 반드시 배열 형태의 JSON 문자열로 입력해야 합니다.\n\n' +
      '**예시 (한 개 언어)**:\n' +
      '```json\n' +
      '[{"languageId":"uuid-ko","title":"2024년 1분기 실적 공시","description":"2024년 1분기 실적 공시 자료입니다."}]\n' +
      '```\n\n' +
      '**예시 (여러 언어)**:\n' +
      '```json\n' +
      '[{"languageId":"uuid-ko","title":"2024년 1분기 실적 공시","description":"2024년 1분기 실적 공시 자료입니다."},{"languageId":"uuid-en","title":"Q1 2024 Earnings Disclosure","description":"Q1 2024 earnings disclosure material."}]\n' +
      '```',
    schema: {
      type: 'object',
      properties: {
        translations: {
          type: 'string',
          description:
            '번역 목록 (JSON 배열 문자열) - 반드시 대괄호 []로 감싸야 합니다!',
          example:
            '[{"languageId":"31e6bbc6-2839-4477-9672-bb4b381e8914","title":"2024년 1분기 실적 공시","description":"2024년 1분기 실적 공시 자료입니다."}]',
        },
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description:
            '첨부파일 목록 (PDF/JPG/PNG/WEBP/XLSX/DOCX만 가능)',
        },
      },
      required: ['translations'],
    },
  })
  @ApiResponse({
    status: 201,
    description: '전자공시 생성 성공 (비공개, DRAFT 상태로 생성됨)',
    type: ElectronicDisclosureResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청 (언어 ID 없음, 제목 없음, 파일 형식 오류)',
  })
  async 전자공시를_생성한다(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<ElectronicDisclosureResponseDto> {
    // body 존재 여부 확인
    if (!body) {
      throw new BadRequestException('요청 본문이 필요합니다.');
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

    // 각 translation 항목의 필수 필드 검증
    for (let i = 0; i < translations.length; i++) {
      const translation = translations[i];
      
      if (!translation.languageId) {
        throw new BadRequestException(
          `translations[${i}]: languageId는 필수입니다.`,
        );
      }
      
      if (!translation.title || translation.title.trim() === '') {
        throw new BadRequestException(
          `translations[${i}]: title은 필수이며 비어있을 수 없습니다.`,
        );
      }
    }

    return await this.electronicDisclosureBusinessService.전자공시를_생성한다(
      translations,
      user.id,
      files,
    );
  }

  /**
   * 전자공시를 수정한다 (번역 및 파일 포함)
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
          // BadRequestException을 사용하여 400 에러 처리
          callback(
            new BadRequestException(
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
    summary: '전자공시 수정',
    description: '전자공시의 번역 정보 및 파일을 수정합니다.',
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
            '[{"languageId":"31e6bbc6-2839-4477-9672-bb4b381e8914","title":"2024년 1분기 실적 공시","description":"2024년 1분기 실적 공시 자료입니다."}]',
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
    description: '전자공시 수정 성공',
    type: ElectronicDisclosureResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '전자공시를 찾을 수 없음',
  })
  async 전자공시를_수정한다(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: any,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<ElectronicDisclosureResponseDto> {
    // body 존재 여부 확인
    if (!body) {
      throw new BadRequestException('요청 본문이 필요합니다.');
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

    // 각 translation 항목의 필수 필드 검증
    for (let i = 0; i < translations.length; i++) {
      const translation = translations[i];
      
      if (!translation.languageId) {
        throw new BadRequestException(
          `translations[${i}]: languageId는 필수입니다.`,
        );
      }
      
      if (!translation.title || translation.title.trim() === '') {
        throw new BadRequestException(
          `translations[${i}]: title은 필수이며 비어있을 수 없습니다.`,
        );
      }
    }

    return await this.electronicDisclosureBusinessService.전자공시를_수정한다(
      id,
      translations,
      user.id,
      files,
    );
  }

  /**
   * 전자공시 오더를 일괄 수정한다
   */
  @Put('batch-order')
  @ApiOperation({
    summary: '전자공시 오더 일괄 수정',
    description:
      '여러 전자공시의 정렬 순서를 한번에 수정합니다. 프론트엔드에서 변경된 순서대로 전자공시 목록을 전달하면 됩니다.',
  })
  @ApiResponse({
    status: 200,
    description: '전자공시 오더 일괄 수정 성공',
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
    description: '잘못된 요청 (수정할 전자공시가 없음)',
  })
  @ApiResponse({
    status: 404,
    description: '일부 전자공시를 찾을 수 없음',
  })
  async 전자공시_오더를_일괄_수정한다(
    @Body() updateDto: UpdateElectronicDisclosureBatchOrderDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ success: boolean; updatedCount: number }> {
    return await this.electronicDisclosureBusinessService.전자공시_오더를_일괄_수정한다(
      updateDto.electronicDisclosures,
      user.id,
    );
  }

  /**
   * 전자공시 공개 여부를 수정한다
   */
  @Patch(':id/public')
  @ApiOperation({
    summary: '전자공시 공개 상태 수정',
    description: '전자공시의 공개 상태를 수정합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '전자공시 공개 상태 수정 성공',
    type: ElectronicDisclosure,
  })
  @ApiResponse({
    status: 404,
    description: '전자공시를 찾을 수 없음',
  })
  async 전자공시_공개를_수정한다(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { isPublic: boolean },
  ): Promise<ElectronicDisclosure> {
    return await this.electronicDisclosureBusinessService.전자공시_공개를_수정한다(
      id,
      body.isPublic,
      user.id,
    );
  }

  /**
   * 전자공시를 삭제한다
   */
  @Delete(':id')
  @ApiOperation({
    summary: '전자공시 삭제',
    description: '전자공시를 삭제합니다 (Soft Delete).',
  })
  @ApiResponse({
    status: 200,
    description: '전자공시 삭제 성공',
  })
  @ApiResponse({
    status: 404,
    description: '전자공시를 찾을 수 없음',
  })
  async 전자공시를_삭제한다(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ success: boolean }> {
    const result =
      await this.electronicDisclosureBusinessService.전자공시를_삭제한다(id);
    return { success: result };
  }

  /**
   * 전자공시 카테고리를 생성한다
   */
  @Post('categories')
  @ApiOperation({
    summary: '전자공시 카테고리 생성',
    description: '새로운 전자공시 카테고리를 생성합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '전자공시 카테고리 생성 성공',
    type: ElectronicDisclosureCategoryResponseDto,
  })
  async 전자공시_카테고리를_생성한다(
    @Body() createDto: CreateElectronicDisclosureCategoryDto,
  ): Promise<ElectronicDisclosureCategoryResponseDto> {
    return await this.electronicDisclosureBusinessService.전자공시_카테고리를_생성한다(
      createDto,
    );
  }

  /**
   * 전자공시 카테고리를 수정한다
   */
  @Patch('categories/:id')
  @ApiOperation({
    summary: '전자공시 카테고리 수정',
    description: '전자공시 카테고리를 수정합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '전자공시 카테고리 수정 성공',
    type: ElectronicDisclosureCategoryResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '카테고리를 찾을 수 없음',
  })
  async 전자공시_카테고리를_수정한다(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateElectronicDisclosureCategoryEntityDto,
  ): Promise<ElectronicDisclosureCategoryResponseDto> {
    return await this.electronicDisclosureBusinessService.전자공시_카테고리를_수정한다(
      id,
      {
        ...updateDto,
        updatedBy: user.id,
      },
    );
  }

  /**
   * 전자공시 카테고리 오더를 변경한다
   */
  @Patch('categories/:id/order')
  @ApiOperation({
    summary: '전자공시 카테고리 오더 변경',
    description: '전자공시 카테고리의 정렬 순서를 변경합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '전자공시 카테고리 오더 변경 성공',
    type: ElectronicDisclosureCategoryResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '카테고리를 찾을 수 없음',
  })
  async 전자공시_카테고리_오더를_변경한다(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateElectronicDisclosureCategoryOrderDto,
  ): Promise<ElectronicDisclosureCategoryResponseDto> {
    const result =
      await this.electronicDisclosureBusinessService.전자공시_카테고리_오더를_변경한다(
        id,
        {
          order: updateDto.order,
          updatedBy: user.id,
        },
      );
    return result;
  }

  /**
   * 전자공시 카테고리를 삭제한다
   */
  @Delete('categories/:id')
  @ApiOperation({
    summary: '전자공시 카테고리 삭제',
    description: '전자공시 카테고리를 삭제합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '전자공시 카테고리 삭제 성공',
  })
  @ApiResponse({
    status: 404,
    description: '카테고리를 찾을 수 없음',
  })
  async 전자공시_카테고리를_삭제한다(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ success: boolean }> {
    const result =
      await this.electronicDisclosureBusinessService.전자공시_카테고리를_삭제한다(
        id,
      );
    return { success: result };
  }
}
