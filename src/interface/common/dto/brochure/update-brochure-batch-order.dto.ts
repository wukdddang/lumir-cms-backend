import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, IsNumber, ValidateNested, IsNotEmpty, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 브로슈어 순서 항목 DTO
 */
export class BrochureOrderItemDto {
  @ApiProperty({
    description: '브로슈어 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({
    description: '새로운 순서',
    example: 1,
  })
  @IsNumber({}, { message: 'order는 숫자여야 합니다.' })
  @Type(() => Number)
  order: number;
}

/**
 * 브로슈어 일괄 순서 수정 DTO
 */
export class UpdateBrochureBatchOrderDto {
  @ApiProperty({
    description: '브로슈어 순서 목록',
    type: [BrochureOrderItemDto],
    example: [
      { id: '550e8400-e29b-41d4-a716-446655440000', order: 1 },
      { id: '550e8400-e29b-41d4-a716-446655440001', order: 2 },
      { id: '550e8400-e29b-41d4-a716-446655440002', order: 3 },
    ],
  })
  @IsArray()
  @ArrayMinSize(1, { message: '최소 1개 이상의 브로슈어가 필요합니다.' })
  @ValidateNested({ each: true })
  @Type(() => BrochureOrderItemDto)
  brochures: BrochureOrderItemDto[];
}
