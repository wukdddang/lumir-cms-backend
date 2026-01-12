import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 비디오갤러리 순서 항목 DTO
 */
export class VideoGalleryOrderItemDto {
  @ApiProperty({
    description: '비디오갤러리 ID',
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
 * 비디오갤러리 일괄 순서 수정 DTO
 */
export class UpdateVideoGalleryBatchOrderDto {
  @ApiProperty({
    description: '비디오갤러리 순서 목록',
    type: [VideoGalleryOrderItemDto],
    example: [
      { id: '550e8400-e29b-41d4-a716-446655440000', order: 1 },
      { id: '550e8400-e29b-41d4-a716-446655440001', order: 2 },
      { id: '550e8400-e29b-41d4-a716-446655440002', order: 3 },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VideoGalleryOrderItemDto)
  videoGalleries: VideoGalleryOrderItemDto[];
}
