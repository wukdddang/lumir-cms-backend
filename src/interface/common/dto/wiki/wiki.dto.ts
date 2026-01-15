import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  IsNumber,
  IsUUID,
  IsEnum,
} from 'class-validator';
import { WikiFileSystem } from '@domain/sub/wiki-file-system/wiki-file-system.entity';
import { WikiFileSystemType } from '@domain/sub/wiki-file-system/wiki-file-system-type.types';

/**
 * 폴더 생성 DTO
 * 
 * ⚠️ 권한 정책: 폴더 생성 시 기본적으로 전사공개로 생성됩니다.
 * 권한 설정은 폴더 수정(PATCH /admin/wiki/folders/:id/public)을 통해 변경할 수 있습니다.
 */
export class CreateFolderDto {
  @ApiProperty({ description: '폴더명', example: '회의록' })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: '부모 폴더 ID (없으면 루트)',
    example: null,
  })
  @IsOptional()
  @IsUUID()
  parentId?: string | null;

  @ApiPropertyOptional({ description: '정렬 순서', example: 0, default: 0 })
  @IsOptional()
  @IsNumber()
  order?: number;
}

/**
 * 파일 생성 DTO
 */
export class CreateFileDto {
  @ApiProperty({ description: '파일명', example: '2024년 전사 회의록' })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: '부모 폴더 ID (없으면 루트)',
    example: null,
  })
  @IsOptional()
  @IsUUID()
  parentId?: string | null;

  @ApiPropertyOptional({
    description: '문서 제목',
    example: '2024년 1월 전사 회의록',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    description: '문서 본문',
    example: '## 회의 안건\n\n1. 신제품 출시\n2. 예산 검토',
  })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({
    description: '공개 여부',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({
    description: '직급 코드 목록',
    example: ['manager', 'general_manager'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissionRankCodes?: string[];

  @ApiPropertyOptional({
    description: '직책 코드 목록',
    example: ['team_leader'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissionPositionCodes?: string[];

  @ApiPropertyOptional({
    description: '부서 ID 목록 (UUID)',
    example: ['e2b3b884-833c-4fdb-ba00-ede1a45b8160', 'c11023a2-fb66-4e3f-bfcf-0666fb19f6bf'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissionDepartmentIds?: string[];

  @ApiPropertyOptional({ description: '정렬 순서', example: 0, default: 0 })
  @IsOptional()
  @IsNumber()
  order?: number;
}

/**
 * 빈 파일 생성 DTO
 */
export class CreateEmptyFileDto {
  @ApiProperty({ description: '파일명', example: '새 문서' })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: '부모 폴더 ID (없으면 루트)',
    example: null,
  })
  @IsOptional()
  @IsUUID()
  parentId?: string | null;

  @ApiPropertyOptional({
    description: '공개 여부 (기본값: true - 상위 폴더 권한 cascading, false - 완전 비공개)',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

/**
 * 폴더 수정 DTO
 */
export class UpdateFolderDto {
  @ApiPropertyOptional({ description: '폴더명', example: '회의록' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: '공개 여부',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({
    description: '직급 ID 목록 (UUID)',
    example: ['a1b2c3d4-e5f6-7890-abcd-ef1234567890'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissionRankIds?: string[];

  @ApiPropertyOptional({
    description: '직책 ID 목록 (UUID)',
    example: ['c3d4e5f6-a7b8-9012-cdef-123456789012'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissionPositionIds?: string[];

  @ApiPropertyOptional({
    description: '부서 ID 목록 (UUID)',
    example: ['e2b3b884-833c-4fdb-ba00-ede1a45b8160', 'c11023a2-fb66-4e3f-bfcf-0666fb19f6bf'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissionDepartmentIds?: string[];

  @ApiPropertyOptional({ description: '정렬 순서', example: 0 })
  @IsOptional()
  @IsNumber()
  order?: number;
}

/**
 * 폴더 이름 수정 DTO
 */
export class UpdateFolderNameDto {
  @ApiProperty({ description: '폴더명', example: '회의록' })
  @IsString()
  name: string;
}

/**
 * 파일 수정 DTO
 */
export class UpdateFileDto {
  @ApiProperty({ description: '파일명', example: '2024년 전사 회의록' })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: '문서 제목',
    example: '2024년 1월 전사 회의록',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    description: '문서 본문',
    example: '## 회의 안건\n\n1. 신제품 출시\n2. 예산 검토',
  })
  @IsOptional()
  @IsString()
  content?: string;
}

/**
 * Wiki 공개 수정 DTO (폴더 전용)
 */
export class UpdateWikiPublicDto {
  @ApiProperty({ description: '공개 여부', example: true })
  @IsBoolean()
  isPublic: boolean;

  @ApiPropertyOptional({
    description: '직급 ID 목록 (UUID)',
    example: ['a1b2c3d4-e5f6-7890-abcd-ef1234567890'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissionRankIds?: string[];

  @ApiPropertyOptional({
    description: '직책 ID 목록 (UUID)',
    example: ['c3d4e5f6-a7b8-9012-cdef-123456789012'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissionPositionIds?: string[];

  @ApiPropertyOptional({
    description: '부서 ID 목록 (UUID)',
    example: ['e2b3b884-833c-4fdb-ba00-ede1a45b8160', 'c11023a2-fb66-4e3f-bfcf-0666fb19f6bf'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissionDepartmentIds?: string[];
}

/**
 * 파일 공개 수정 DTO
 */
export class UpdateFilePublicDto {
  @ApiProperty({ 
    description: '공개 여부 (true: 상위 폴더 권한 cascading, false: 완전 비공개)', 
    example: true 
  })
  @IsBoolean()
  isPublic: boolean;
}

/**
 * Wiki 경로 수정 DTO
 */
export class UpdateWikiPathDto {
  @ApiProperty({
    description: '부모 폴더 ID (null이면 루트로 이동)',
    example: 'uuid-or-null',
  })
  @IsOptional()
  @IsUUID()
  parentId: string | null;
}

/**
 * Wiki 경로 정보 DTO (Breadcrumb)
 */
export class WikiPathDto {
  @ApiProperty({ description: 'ID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: '이름', example: '회의록' })
  name: string;

  @ApiProperty({ description: '깊이', example: 0 })
  depth: number;
}

/**
 * Wiki 검색 결과 DTO
 */
export class WikiSearchResultDto {
  @ApiProperty({ description: 'ID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: '파일명', example: '2024년 회의록.pdf' })
  name: string;

  @ApiProperty({ description: '타입', enum: ['folder', 'file'], example: 'file' })
  type: string;

  @ApiPropertyOptional({ description: '문서 제목', example: '2024년 1월 전사 회의록' })
  title?: string;

  @ApiPropertyOptional({ description: '문서 본문 미리보기', example: '## 회의 안건\n\n1. 신제품...' })
  contentPreview?: string;

  @ApiProperty({ description: '경로 정보 (루트부터 순서대로)', type: [WikiPathDto] })
  path: WikiPathDto[];

  @ApiProperty({ description: '생성일', example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: '수정일', example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;

  static from(wiki: WikiFileSystem, ancestors: Array<{ wiki: WikiFileSystem; depth: number }>): WikiSearchResultDto {
    const dto = new WikiSearchResultDto();
    dto.id = wiki.id;
    dto.name = wiki.name;
    dto.type = wiki.type;
    dto.title = wiki.title || undefined;
    dto.contentPreview = wiki.content ? wiki.content.substring(0, 200) : undefined;
    dto.path = ancestors.map(a => ({
      id: a.wiki.id,
      name: a.wiki.name,
      depth: a.depth,
    }));
    dto.createdAt = wiki.createdAt;
    dto.updatedAt = wiki.updatedAt;
    return dto;
  }
}

/**
 * Wiki 검색 목록 응답 DTO
 */
export class WikiSearchListResponseDto {
  @ApiProperty({ description: '검색 결과 목록', type: [WikiSearchResultDto] })
  items: WikiSearchResultDto[];

  @ApiProperty({ description: '전체 개수', example: 10 })
  total: number;
}

/**
 * Wiki 응답 DTO
 */
export class WikiResponseDto {
  @ApiProperty({ description: 'ID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: '이름', example: '회의록' })
  name: string;

  @ApiProperty({
    description: '타입',
    enum: WikiFileSystemType,
    example: WikiFileSystemType.FOLDER,
  })
  type: WikiFileSystemType;

  @ApiPropertyOptional({ description: '부모 ID', example: 'uuid' })
  parentId: string | null;

  @ApiProperty({ description: '계층 깊이', example: 0 })
  depth: number;

  @ApiPropertyOptional({ description: '문서 제목', example: '회의록' })
  title: string | null;

  @ApiPropertyOptional({
    description: '문서 본문',
    example: '## 회의 내용\n\n...',
  })
  content: string | null;

  @ApiPropertyOptional({ description: '파일 URL', example: 'https://...' })
  fileUrl: string | null;

  @ApiPropertyOptional({ description: '파일 크기', example: 1024000 })
  fileSize: number | null;

  @ApiPropertyOptional({ description: 'MIME 타입', example: 'application/pdf' })
  mimeType: string | null;

  @ApiPropertyOptional({
    description: '첨부파일 목록',
    example: [
      {
        fileName: 'file.pdf',
        fileUrl: 'https://...',
        fileSize: 1024000,
        mimeType: 'application/pdf',
      },
    ],
  })
  attachments: Array<{
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
  }> | null;

  @ApiProperty({ description: '공개 여부', example: true })
  isPublic: boolean;

  @ApiPropertyOptional({
    description: '직급 ID 목록 (UUID)',
    example: ['a1b2c3d4-e5f6-7890-abcd-ef1234567890'],
  })
  permissionRankIds: string[] | null;

  @ApiPropertyOptional({
    description: '직책 ID 목록 (UUID)',
    example: ['c3d4e5f6-a7b8-9012-cdef-123456789012'],
  })
  permissionPositionIds: string[] | null;

  @ApiPropertyOptional({
    description: '부서 ID 목록 (UUID)',
    example: ['e2b3b884-833c-4fdb-ba00-ede1a45b8160'],
  })
  permissionDepartmentIds: string[] | null;

  @ApiProperty({ description: '정렬 순서', example: 0 })
  order: number;

  @ApiProperty({ description: '생성 일시' })
  createdAt: Date;

  @ApiProperty({ description: '수정 일시' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: '생성자 ID' })
  createdBy: string | null;

  @ApiPropertyOptional({ description: '수정자 ID' })
  updatedBy: string | null;

  @ApiPropertyOptional({
    description: '하위 폴더 및 파일 목록 (폴더인 경우에만)',
    type: [WikiResponseDto],
  })
  children?: WikiResponseDto[];

  static from(wiki: WikiFileSystem, children?: WikiFileSystem[]): WikiResponseDto {
    const dto = new WikiResponseDto();
    dto.id = wiki.id;
    dto.name = wiki.name;
    dto.type = wiki.type;
    dto.parentId = wiki.parentId;
    dto.depth = wiki.depth;
    dto.title = wiki.title;
    dto.content = wiki.content;
    dto.fileUrl = wiki.fileUrl;
    dto.fileSize = wiki.fileSize;
    dto.mimeType = wiki.mimeType;
    dto.attachments = wiki.attachments;
    dto.isPublic = wiki.isPublic;
    dto.permissionRankIds = wiki.permissionRankIds;
    dto.permissionPositionIds = wiki.permissionPositionIds;
    dto.permissionDepartmentIds = wiki.permissionDepartmentIds;
    dto.order = wiki.order;
    dto.createdAt = wiki.createdAt;
    dto.updatedAt = wiki.updatedAt;
    dto.createdBy = wiki.createdBy;
    dto.updatedBy = wiki.updatedBy;
    
    // 하위 항목이 있으면 추가
    if (children && children.length > 0) {
      dto.children = children.map((child) => WikiResponseDto.from(child));
    }
    
    return dto;
  }
}

/**
 * Wiki 목록 응답 DTO
 */
export class WikiListResponseDto {
  @ApiProperty({ description: 'Wiki 항목 목록', type: [WikiResponseDto] })
  items: WikiResponseDto[];

  @ApiProperty({ description: '전체 개수', example: 10 })
  total: number;
}
