import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 뉴스 순서 항목 DTO
 */
export class NewsOrderItemDto {
  @ApiProperty({
    description: '뉴스 ID',
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
 * 뉴스 일괄 순서 수정 DTO
 */
export class UpdateNewsBatchOrderDto {
  @ApiProperty({
    description: '뉴스 순서 목록',
    type: [NewsOrderItemDto],
    example: [
      { id: '550e8400-e29b-41d4-a716-446655440000', order: 1 },
      { id: '550e8400-e29b-41d4-a716-446655440001', order: 2 },
      { id: '550e8400-e29b-41d4-a716-446655440002', order: 3 },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NewsOrderItemDto)
  news: NewsOrderItemDto[];
}
