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
import { WikiPermissionScheduler } from '@context/wiki-context/wiki-permission.scheduler';
import { WikiFileSystem } from '@domain/sub/wiki-file-system/wiki-file-system.entity';
import {
  CreateFolderDto,
  CreateEmptyFileDto,
  UpdateFolderDto,
  UpdateFolderNameDto,
  UpdateWikiPublicDto,
  UpdateFilePublicDto,
  UpdateWikiPathDto,
  WikiResponseDto,
  WikiListResponseDto,
  WikiSearchListResponseDto,
  WikiSearchResultDto,
} from '@interface/common/dto/wiki/wiki.dto';
import { ReplaceWikiPermissionsDto } from './dto/replace-wiki-permissions.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { WikiPermissionLog } from '@domain/sub/wiki-file-system/wiki-permission-log.entity';

@ApiTags('A-10. 관리자 - Wiki')
@ApiBearerAuth('Bearer')
@Controller('admin/wiki')
export class WikiController {
  constructor(
    private readonly wikiBusinessService: WikiBusinessService,
    private readonly wikiPermissionScheduler: WikiPermissionScheduler,
    @InjectRepository(WikiPermissionLog)
    private readonly permissionLogRepository: Repository<WikiPermissionLog>,
  ) {}

  /**
   * 폴더 구조를 가져온다 (트리 구조)
   */
  @Get('folders/structure')
  @ApiOperation({
    summary: '폴더 구조 조회',
    description:
      '전체 폴더 구조를 트리 형태로 조회합니다. 각 폴더는 하위 폴더와 파일을 포함합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '폴더 구조 조회 성공 (트리 구조)',
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
    const items =
      await this.wikiBusinessService.폴더_구조를_가져온다(ancestorId);

    // permissionDepartmentIds가 비어있는 항목이 있는지 확인하고 비동기로 권한 검증 배치 실행
    const hasEmptyPermissionDepartmentIds = items.some(
      (item) =>
        !item.permissionDepartmentIds ||
        item.permissionDepartmentIds.length === 0,
    );

    if (hasEmptyPermissionDepartmentIds) {
      // 비동기로 권한 검증 배치 실행 (응답을 기다리지 않음)
      this.wikiPermissionScheduler
        .모든_위키_권한을_검증한다()
        .catch((error) => {
          // 에러 로깅만 하고 응답에는 영향 없음
          console.error('권한 검증 배치 실행 중 오류:', error);
        });
    }

    // 트리 구조로 변환
    const tree = await this.buildTree(items);

    return {
      items: tree,
      total: items.length,
    };
  }

  /**
   * 평탄한 목록을 트리 구조로 변환하는 헬퍼 메서드
   */
  private async buildTree(items: WikiFileSystem[]): Promise<WikiResponseDto[]> {
    // parentId별로 그룹화
    const itemsByParent = new Map<string | null, WikiFileSystem[]>();
    for (const item of items) {
      const parentId = item.parentId || null;
      if (!itemsByParent.has(parentId)) {
        itemsByParent.set(parentId, []);
      }
      itemsByParent.get(parentId)!.push(item);
    }

    // 재귀적으로 트리 구조 생성
    const buildChildren = (parentId: string | null): WikiResponseDto[] => {
      const children = itemsByParent.get(parentId) || [];
      return children.map((child) => {
        const childDto = WikiResponseDto.from(child);
        // 폴더인 경우 하위 항목 재귀적으로 추가
        if (child.type === 'folder') {
          const subChildren = buildChildren(child.id);
          if (subChildren.length > 0) {
            childDto.children = subChildren;
          }
        }
        return childDto;
      });
    };

    // 루트 항목들부터 시작
    const rootParentId = items.length > 0 && items[0].parentId ? items[0].parentId : null;
    return buildChildren(rootParentId);
  }

  /**
   * 폴더를 조회한다 (하위 항목 포함)
   */
  @Get('folders/:id')
  @ApiOperation({
    summary: '폴더 상세 조회',
    description: '폴더 상세 정보와 하위 폴더/파일 목록을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '폴더 조회 성공 (하위 항목 포함)',
    type: WikiResponseDto,
  })
  @ApiParam({ name: 'id', description: '폴더 ID' })
  async 폴더를_조회한다(@Param('id') id: string): Promise<WikiResponseDto> {
    const folder = await this.wikiBusinessService.폴더를_조회한다(id);
    const children = await this.wikiBusinessService.폴더_하위_항목을_조회한다(id);
    return WikiResponseDto.from(folder, children);
  }

  /**
   * 폴더의 하위 항목들을 조회한다
   */
  @Get('folders/:id/children')
  @ApiOperation({
    summary: '폴더 하위 항목 조회',
    description: '폴더의 하위 폴더 및 파일 목록을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '하위 항목 조회 성공',
    type: WikiListResponseDto,
  })
  @ApiParam({ name: 'id', description: '폴더 ID' })
  async 폴더_하위_항목들을_조회한다(
    @Param('id') id: string,
  ): Promise<WikiListResponseDto> {
    const items = await this.wikiBusinessService.폴더_하위_항목을_조회한다(id);
    return {
      items: items.map((item) => WikiResponseDto.from(item)),
      total: items.length,
    };
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
      permissionRankIds: dto.permissionRankIds,
      permissionPositionIds: dto.permissionPositionIds,
      permissionDepartmentIds: dto.permissionDepartmentIds,
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
    description:
      '새로운 폴더를 생성합니다.\n\n' +
      '⚠️ **권한 정책**: 폴더는 기본적으로 전사공개로 생성됩니다.\n' +
      '권한 설정은 폴더 공개 수정(PATCH /admin/wiki/folders/:id/public)을 통해 변경할 수 있습니다.',
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
      isPublic: true, // 기본적으로 전사공개
      permissionRankIds: null,
      permissionPositionIds: null,
      permissionDepartmentIds: null,
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
  async 폴더를_삭제한다(
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
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
  async 폴더만_삭제한다(
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    const success = await this.wikiBusinessService.폴더만_삭제한다(id);
    return { success };
  }

  /**
   * 폴더를 수정한다
   */
  @Patch('folders/:id')
  @ApiOperation({
    summary: '폴더 수정',
    description: '폴더 정보 및 권한을 수정합니다.',
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
      isPublic: dto.isPublic,
      permissionRankIds: dto.permissionRankIds,
      permissionPositionIds: dto.permissionPositionIds,
      permissionDepartmentIds: dto.permissionDepartmentIds,
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
  async 파일을_삭제한다(
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
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
   * 파일 공개를 수정한다
   */
  @Patch('files/:id/public')
  @ApiOperation({
    summary: '파일 공개 수정',
    description:
      '파일의 공개 여부를 수정합니다.\n\n' +
      '⚠️ **권한 정책**:\n' +
      '- `isPublic: true` → 상위 폴더 권한 cascading\n' +
      '- `isPublic: false` → 완전 비공개 (아무도 접근 불가)',
  })
  @ApiResponse({
    status: 200,
    description: '파일 공개 수정 성공',
    type: WikiResponseDto,
  })
  @ApiParam({ name: 'id', description: '파일 ID' })
  async 파일_공개를_수정한다(
    @Param('id') id: string,
    @Body() dto: UpdateFilePublicDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<WikiResponseDto> {
    const file = await this.wikiBusinessService.파일_공개를_수정한다(id, {
      isPublic: dto.isPublic,
      updatedBy: user.id,
    });
    return WikiResponseDto.from(file);
  }

  /**
   * 파일들을 검색한다
   */
  @Get('files/search')
  @ApiOperation({
    summary: '파일 검색',
    description:
      '검색 텍스트로 파일을 검색합니다. 파일명, 제목, 본문을 검색하며 경로 정보를 포함합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '파일 검색 성공',
    type: WikiSearchListResponseDto,
  })
  @ApiQuery({
    name: 'query',
    required: true,
    description: '검색 텍스트',
    example: '회의록',
  })
  async 파일들을_검색한다(
    @Query('query') query: string,
  ): Promise<WikiSearchListResponseDto> {
    if (!query || query.trim().length === 0) {
      return { items: [], total: 0 };
    }

    const results = await this.wikiBusinessService.파일들을_검색한다(
      query.trim(),
    );

    return {
      items: results.map((result) =>
        WikiSearchResultDto.from(result.wiki, result.path),
      ),
      total: results.length,
    };
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
  async 파일을_조회한다(@Param('id') id: string): Promise<WikiResponseDto> {
    const file = await this.wikiBusinessService.파일을_조회한다(id);
    return WikiResponseDto.from(file);
  }

  /**
   * 빈 파일을 생성한다
   */
  @Post('files/empty')
  @ApiOperation({
    summary: '빈 파일 생성',
    description:
      '빈 파일을 생성합니다.\n\n' +
      '⚠️ **권한 정책**:\n' +
      '- `isPublic: true` (기본값) → 상위 폴더 권한 cascading\n' +
      '- `isPublic: false` → 완전 비공개 (아무도 접근 불가)',
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
      dto.isPublic,
    );
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
      '⚠️ **권한 정책**:\n' +
      '- `isPublic: true` (기본값) → 상위 폴더 권한 cascading\n' +
      '- `isPublic: false` → 완전 비공개 (아무도 접근 불가)',
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
        isPublic: {
          type: 'boolean',
          description:
            '공개 여부 (선택, 기본값: true - 상위 폴더 권한 cascading, false - 완전 비공개)',
          example: true,
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
    const { name, parentId, title, content, isPublic } = body;

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
      isPublic !== undefined ? isPublic === 'true' : undefined,
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
          description:
            '첨부파일 목록 (선택) - 전송한 파일들로 완전히 교체됩니다',
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

  /**
   * 모든 위키의 권한 로그 목록을 조회한다
   */
  @Get('permission-logs')
  @ApiOperation({
    summary: '위키 권한 로그 전체 조회',
    description:
      '모든 위키에서 감지된 비활성 부서 목록을 조회합니다. 관리자가 어떤 권한을 교체해야 하는지 확인할 수 있습니다.',
  })
  @ApiQuery({
    name: 'resolved',
    required: false,
    description: '해결 여부 필터 (true: 해결됨, false: 미해결, 미지정: 전체)',
    type: Boolean,
  })
  @ApiResponse({
    status: 200,
    description: '권한 로그 목록 조회 성공',
  })
  async 위키_권한_로그를_조회한다(
    @Query('resolved') resolved?: boolean,
  ) {
    const where: any = {};
    
    if (resolved === true) {
      where.resolvedAt = Not(IsNull());
    } else if (resolved === false) {
      where.resolvedAt = IsNull();
    }

    return await this.permissionLogRepository.find({
      where,
      order: { detectedAt: 'DESC' },
      relations: ['wikiFileSystem'],
    });
  }

  /**
   * 위키의 무효한 권한 ID를 새로운 ID로 교체하고 관련 로그를 자동으로 해결 처리한다
   */
  @Patch(':id/replace-permissions')
  @ApiOperation({
    summary: '위키 권한 ID 교체 및 로그 해결',
    description:
      '비활성화된 부서 ID를 새로운 ID로 교체합니다. 예: 구 마케팅팀(DEPT_001) → 신 마케팅팀(DEPT_002)\n\n' +
      '권한 교체가 완료되면 자동으로 RESOLVED 로그가 생성됩니다.',
  })
  @ApiParam({
    name: 'id',
    description: '위키 ID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: '권한 ID 교체 성공 및 로그 해결 완료',
  })
  @ApiResponse({
    status: 404,
    description: '위키를 찾을 수 없음',
  })
  async 위키_권한을_교체한다(
    @Param('id') id: string,
    @Body() dto: ReplaceWikiPermissionsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return await this.wikiBusinessService.위키_권한을_교체한다(
      id,
      dto,
      user.id,
    );
  }
}
