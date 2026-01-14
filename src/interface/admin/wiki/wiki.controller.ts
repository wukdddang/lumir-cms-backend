import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '@interface/common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@interface/common/decorators/current-user.decorator';
import { WikiBusinessService } from '@business/wiki-business/wiki-business.service';
import {
  CreateFolderDto,
  CreateEmptyFileDto,
  UpdateFolderDto,
  UpdateFolderNameDto,
  UpdateWikiPublicDto,
  UpdateWikiPathDto,
  WikiResponseDto,
  WikiListResponseDto,
} from '@interface/common/dto/wiki/wiki.dto';

@ApiTags('A-10. 관리자 - Wiki')
@ApiBearerAuth('Bearer')
@Controller('admin/wiki')
export class WikiController {
  constructor(
    private readonly wikiBusinessService: WikiBusinessService,
  ) {}

  /**
   * 폴더를 조회한다
   */
  @Get('folders/:id')
  @ApiOperation({
    summary: '폴더 상세 조회',
    description: '폴더 상세 정보를 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '폴더 조회 성공',
    type: WikiResponseDto,
  })
  @ApiParam({ name: 'id', description: '폴더 ID' })
  async 폴더를_조회한다(
    @Param('id') id: string,
  ): Promise<WikiResponseDto> {
    const folder = await this.wikiBusinessService.폴더를_조회한다(id);
    return WikiResponseDto.from(folder);
  }

  /**
   * 폴더 공개를 수정한다
   */
  @Patch('folders/:id/public')
  @ApiOperation({
    summary: '폴더 공개 수정',
    description: '폴더의 공개 여부 및 권한을 수정합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '폴더 공개 수정 성공',
    type: WikiResponseDto,
  })
  @ApiParam({ name: 'id', description: '폴더 ID' })
  async 폴더_공개를_수정한다(
    @Param('id') id: string,
    @Body() dto: UpdateWikiPublicDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<WikiResponseDto> {
    const folder = await this.wikiBusinessService.폴더_공개를_수정한다(id, {
      isPublic: dto.isPublic,
      permissionRankCodes: dto.permissionRankCodes,
      permissionPositionCodes: dto.permissionPositionCodes,
      permissionDepartmentCodes: dto.permissionDepartmentCodes,
      updatedBy: user.id,
    });
    return WikiResponseDto.from(folder);
  }

  /**
   * 폴더를 생성한다
   */
  @Post('folders')
  @ApiOperation({
    summary: '폴더 생성',
    description: '새로운 폴더를 생성합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '폴더 생성 성공',
    type: WikiResponseDto,
  })
  async 폴더를_생성한다(
    @Body() dto: CreateFolderDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<WikiResponseDto> {
    const folder = await this.wikiBusinessService.폴더를_생성한다({
      name: dto.name,
      parentId: dto.parentId,
      isPublic: dto.isPublic,
      permissionRankCodes: dto.permissionRankCodes,
      permissionPositionCodes: dto.permissionPositionCodes,
      permissionDepartmentCodes: dto.permissionDepartmentCodes,
      order: dto.order,
      createdBy: user.id,
    });
    return WikiResponseDto.from(folder);
  }

  /**
   * 폴더를 삭제한다 (하위 항목 포함)
   */
  @Delete('folders/:id')
  @ApiOperation({
    summary: '폴더 삭제',
    description: '폴더 및 하위 모든 항목을 삭제합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '폴더 삭제 성공',
    schema: { type: 'object', properties: { success: { type: 'boolean' } } },
  })
  @ApiParam({ name: 'id', description: '폴더 ID' })
  async 폴더를_삭제한다(@Param('id') id: string): Promise<{ success: boolean }> {
    const success = await this.wikiBusinessService.폴더를_삭제한다(id);
    return { success };
  }

  /**
   * 폴더만 삭제한다 (하위 항목이 있으면 실패)
   */
  @Delete('folders/:id/only')
  @ApiOperation({
    summary: '폴더만 삭제',
    description: '폴더만 삭제합니다. 하위 항목이 있으면 실패합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '폴더만 삭제 성공',
    schema: { type: 'object', properties: { success: { type: 'boolean' } } },
  })
  @ApiParam({ name: 'id', description: '폴더 ID' })
  async 폴더만_삭제한다(@Param('id') id: string): Promise<{ success: boolean }> {
    const success = await this.wikiBusinessService.폴더만_삭제한다(id);
    return { success };
  }

  /**
   * 폴더를 수정한다
   */
  @Patch('folders/:id')
  @ApiOperation({
    summary: '폴더 수정',
    description: '폴더 정보를 수정합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '폴더 수정 성공',
    type: WikiResponseDto,
  })
  @ApiParam({ name: 'id', description: '폴더 ID' })
  async 폴더를_수정한다(
    @Param('id') id: string,
    @Body() dto: UpdateFolderDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<WikiResponseDto> {
    const folder = await this.wikiBusinessService.폴더를_수정한다(id, {
      name: dto.name,
      order: dto.order,
      updatedBy: user.id,
    });
    return WikiResponseDto.from(folder);
  }

  /**
   * 폴더 경로를 수정한다
   */
  @Patch('folders/:id/path')
  @ApiOperation({
    summary: '폴더 경로 수정',
    description: '폴더의 부모를 변경하여 경로를 수정합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '폴더 경로 수정 성공',
    type: WikiResponseDto,
  })
  @ApiParam({ name: 'id', description: '폴더 ID' })
  async 폴더_경로를_수정한다(
    @Param('id') id: string,
    @Body() dto: UpdateWikiPathDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<WikiResponseDto> {
    const folder = await this.wikiBusinessService.폴더_경로를_수정한다(id, {
      parentId: dto.parentId,
      updatedBy: user.id,
    });
    return WikiResponseDto.from(folder);
  }

  /**
   * 폴더 이름을 수정한다
   */
  @Patch('folders/:id/name')
  @ApiOperation({
    summary: '폴더 이름 수정',
    description: '폴더 이름만 수정합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '폴더 이름 수정 성공',
    type: WikiResponseDto,
  })
  @ApiParam({ name: 'id', description: '폴더 ID' })
  async 폴더_이름을_수정한다(
    @Param('id') id: string,
    @Body() dto: UpdateFolderNameDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<WikiResponseDto> {
    const folder = await this.wikiBusinessService.폴더_이름을_수정한다(id, {
      name: dto.name,
      updatedBy: user.id,
    });
    return WikiResponseDto.from(folder);
  }

  /**
   * 폴더 구조를 가져온다
   */
  @Get('folders/structure')
  @ApiOperation({
    summary: '폴더 구조 조회',
    description: '전체 폴더 구조를 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '폴더 구조 조회 성공',
    type: WikiListResponseDto,
  })
  @ApiQuery({
    name: 'ancestorId',
    required: false,
    description: '조상 폴더 ID (없으면 루트부터)',
  })
  async 폴더_구조를_가져온다(
    @Query('ancestorId') ancestorId?: string,
  ): Promise<WikiListResponseDto> {
    const items = await this.wikiBusinessService.폴더_구조를_가져온다(ancestorId);
    return {
      items: items.map((item) => WikiResponseDto.from(item)),
      total: items.length,
    };
  }

  /**
   * 파일을 삭제한다
   */
  @Delete('files/:id')
  @ApiOperation({
    summary: '파일 삭제',
    description: '파일을 삭제합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '파일 삭제 성공',
    schema: { type: 'object', properties: { success: { type: 'boolean' } } },
  })
  @ApiParam({ name: 'id', description: '파일 ID' })
  async 파일을_삭제한다(@Param('id') id: string): Promise<{ success: boolean }> {
    const success = await this.wikiBusinessService.파일을_삭제한다(id);
    return { success };
  }

  /**
   * 파일 경로를 수정한다
   */
  @Patch('files/:id/path')
  @ApiOperation({
    summary: '파일 경로 수정',
    description:
      '파일의 부모 폴더를 변경합니다.\n\n' +
      '⚠️ **권한 정책**: 새로운 부모 폴더의 권한이 적용됩니다 (cascading).',
  })
  @ApiResponse({
    status: 200,
    description: '파일 경로 수정 성공',
    type: WikiResponseDto,
  })
  @ApiParam({ name: 'id', description: '파일 ID' })
  async 파일_경로를_수정한다(
    @Param('id') id: string,
    @Body() dto: UpdateWikiPathDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<WikiResponseDto> {
    const file = await this.wikiBusinessService.파일_경로를_수정한다(id, {
      parentId: dto.parentId,
      updatedBy: user.id,
    });
    return WikiResponseDto.from(file);
  }


  /**
   * 파일들을 조회한다
   */
  @Get('files')
  @ApiOperation({
    summary: '파일 목록 조회',
    description: '특정 폴더의 파일 목록을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '파일 목록 조회 성공',
    type: WikiListResponseDto,
  })
  @ApiQuery({
    name: 'parentId',
    required: false,
    description: '부모 폴더 ID (없으면 루트)',
  })
  async 파일들을_조회한다(
    @Query('parentId') parentId?: string,
  ): Promise<WikiListResponseDto> {
    const items = await this.wikiBusinessService.파일들을_조회한다(
      parentId || null,
    );
    return {
      items: items.map((item) => WikiResponseDto.from(item)),
      total: items.length,
    };
  }

  /**
   * 파일을 조회한다
   */
  @Get('files/:id')
  @ApiOperation({
    summary: '파일 상세 조회',
    description:
      '파일 상세 정보를 조회합니다.\n\n' +
      '⚠️ **권한 정책**: 상위 폴더들의 권한을 cascading하여 접근 권한이 결정됩니다.',
  })
  @ApiResponse({
    status: 200,
    description: '파일 조회 성공',
    type: WikiResponseDto,
  })
  @ApiParam({ name: 'id', description: '파일 ID' })
  async 파일을_조회한다(
    @Param('id') id: string,
  ): Promise<WikiResponseDto> {
    const file = await this.wikiBusinessService.파일을_조회한다(id);
    return WikiResponseDto.from(file);
  }

  /**
   * 파일을 생성한다
   */
  @Post('files')
  @UseInterceptors(
    FilesInterceptor('files', undefined, {
      fileFilter: (req, file, callback) => {
        // 허용된 MIME 타입: 모든 파일 허용
        callback(null, true);
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: '파일 생성',
    description:
      '새로운 파일을 생성합니다. 첨부파일 업로드 가능.\n\n' +
      '⚠️ **권한 정책**: 파일은 권한 설정이 없으며, 상위 폴더의 권한이 cascading됩니다.',
  })
  @ApiBody({
    description:
      '⚠️ **중요**: name은 필수입니다.\n\n' +
      '**파일 관리 방식**:\n' +
      '- `files`를 전송하면: 첨부파일과 함께 생성\n' +
      '- `files`를 전송하지 않으면: 파일 없이 생성',
    schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: '파일명',
          example: '2024년 회의록',
        },
        parentId: {
          type: 'string',
          description: '부모 폴더 ID (선택, 없으면 루트)',
          example: 'uuid',
        },
        title: {
          type: 'string',
          description: '문서 제목 (선택)',
          example: '2024년 1월 전사 회의록',
        },
        content: {
          type: 'string',
          description: '문서 본문 (선택)',
          example: '## 회의 안건\n\n1. 신제품 출시',
        },
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: '첨부파일 목록 (선택)',
        },
      },
      required: ['name'],
    },
  })
  @ApiResponse({
    status: 201,
    description: '파일 생성 성공',
    type: WikiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청 (name 없음)',
  })
  async 파일을_생성한다(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
    @UploadedFiles() files?: Express.Multer.File[],
  ): Promise<WikiResponseDto> {
    const { name, parentId, title, content } = body;

    if (!name) {
      throw new BadRequestException('name 필드는 필수입니다.');
    }

    const file = await this.wikiBusinessService.파일을_생성한다(
      name,
      parentId || null,
      title || null,
      content || null,
      user.id,
      files,
    );
    return WikiResponseDto.from(file);
  }

  /**
   * 빈 파일을 생성한다
   */
  @Post('files/empty')
  @ApiOperation({
    summary: '빈 파일 생성',
    description: '빈 파일을 생성합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '빈 파일 생성 성공',
    type: WikiResponseDto,
  })
  async 빈_파일을_생성한다(
    @Body() dto: CreateEmptyFileDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<WikiResponseDto> {
    const file = await this.wikiBusinessService.빈_파일을_생성한다(
      dto.name,
      dto.parentId || null,
      user.id,
    );
    return WikiResponseDto.from(file);
  }

  /**
   * 파일을 수정한다
   */
  @Put('files/:id')
  @UseInterceptors(
    FilesInterceptor('files', undefined, {
      fileFilter: (req, file, callback) => {
        // 허용된 MIME 타입: 모든 파일 허용
        callback(null, true);
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: '파일 수정',
    description: '파일 정보를 수정합니다. 첨부파일 업로드 가능.',
  })
  @ApiBody({
    description:
      '⚠️ **중요**: name은 필수입니다.\n\n' +
      '**파일 관리 방식**:\n' +
      '- `files`를 전송하면: 기존 첨부파일 전부 삭제 → 새 파일들로 교체\n' +
      '- `files`를 전송하지 않으면: 기존 첨부파일 전부 삭제 (파일 없음)\n' +
      '- 기존 파일을 유지하려면 반드시 해당 파일을 다시 전송해야 합니다',
    schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: '파일명',
          example: '2024년 회의록',
        },
        title: {
          type: 'string',
          description: '문서 제목 (선택)',
          example: '2024년 1월 전사 회의록',
        },
        content: {
          type: 'string',
          description: '문서 본문 (선택)',
          example: '## 회의 안건\n\n1. 신제품 출시',
        },
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: '첨부파일 목록 (선택) - 전송한 파일들로 완전히 교체됩니다',
        },
      },
      required: ['name'],
    },
  })
  @ApiResponse({
    status: 200,
    description: '파일 수정 성공',
    type: WikiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청 (name 없음)',
  })
  @ApiResponse({
    status: 404,
    description: '파일을 찾을 수 없음',
  })
  @ApiParam({ name: 'id', description: '파일 ID' })
  async 파일을_수정한다(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
    @UploadedFiles() files?: Express.Multer.File[],
  ): Promise<WikiResponseDto> {
    const { name, title, content } = body;

    if (!name) {
      throw new BadRequestException('name 필드는 필수입니다.');
    }

    const file = await this.wikiBusinessService.파일을_수정한다(
      id,
      name,
      title || null,
      content || null,
      user.id,
      files,
    );
    return WikiResponseDto.from(file);
  }
}
