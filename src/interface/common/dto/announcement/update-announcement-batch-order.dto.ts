import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 공지사항 순서 항목 DTO
 */
export class AnnouncementOrderItemDto {
  @ApiProperty({
    description: '공지사항 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: '새로운 순서',
    example: 1,
  })
  @IsNumber()
  order: number;
}

/**
 * 공지사항 일괄 순서 수정 DTO
 */
export class UpdateAnnouncementBatchOrderDto {
  @ApiProperty({
    description: '공지사항 순서 목록',
    type: [AnnouncementOrderItemDto],
    example: [
      { id: '550e8400-e29b-41d4-a716-446655440000', order: 1 },
      { id: '550e8400-e29b-41d4-a716-446655440001', order: 2 },
      { id: '550e8400-e29b-41d4-a716-446655440002', order: 3 },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnnouncementOrderItemDto)
  announcements: AnnouncementOrderItemDto[];
}
