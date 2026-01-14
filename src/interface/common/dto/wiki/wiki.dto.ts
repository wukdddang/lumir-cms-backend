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
    description: '부서 코드 목록',
    example: ['dev', 'hr'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissionDepartmentCodes?: string[];

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
    description: '부서 코드 목록',
    example: ['dev', 'hr'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissionDepartmentCodes?: string[];

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
}

/**
 * 폴더 수정 DTO
 */
export class UpdateFolderDto {
  @ApiPropertyOptional({ description: '폴더명', example: '회의록' })
  @IsOptional()
  @IsString()
  name?: string;

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
 * Wiki 공개 수정 DTO
 */
export class UpdateWikiPublicDto {
  @ApiProperty({ description: '공개 여부', example: true })
  @IsBoolean()
  isPublic: boolean;

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
    description: '부서 코드 목록',
    example: ['dev', 'hr'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissionDepartmentCodes?: string[];
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
    description: '직급 코드 목록',
    example: ['manager'],
  })
  permissionRankCodes: string[] | null;

  @ApiPropertyOptional({
    description: '직책 코드 목록',
    example: ['team_leader'],
  })
  permissionPositionCodes: string[] | null;

  @ApiPropertyOptional({
    description: '부서 코드 목록',
    example: ['dev'],
  })
  permissionDepartmentCodes: string[] | null;

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

  static from(wiki: WikiFileSystem): WikiResponseDto {
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
    dto.permissionRankCodes = wiki.permissionRankCodes;
    dto.permissionPositionCodes = wiki.permissionPositionCodes;
    dto.permissionDepartmentCodes = wiki.permissionDepartmentCodes;
    dto.order = wiki.order;
    dto.createdAt = wiki.createdAt;
    dto.updatedAt = wiki.updatedAt;
    dto.createdBy = wiki.createdBy;
    dto.updatedBy = wiki.updatedBy;
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
