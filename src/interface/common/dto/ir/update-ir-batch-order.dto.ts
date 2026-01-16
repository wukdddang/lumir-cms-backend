import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, IsNumber, ValidateNested, IsNotEmpty, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * IR 순서 항목 DTO
 */
export class IROrderItemDto {
  @ApiProperty({
    description: 'IR ID',
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
 * IR 일괄 순서 수정 DTO
 */
export class UpdateIRBatchOrderDto {
  @ApiProperty({
    description: 'IR 순서 목록',
    type: [IROrderItemDto],
    example: [
      { id: '550e8400-e29b-41d4-a716-446655440000', order: 1 },
      { id: '550e8400-e29b-41d4-a716-446655440001', order: 2 },
      { id: '550e8400-e29b-41d4-a716-446655440002', order: 3 },
    ],
  })
  @IsArray()
  @ArrayMinSize(1, { message: '최소 1개 이상의 IR이 필요합니다.' })
  @ValidateNested({ each: true })
  @Type(() => IROrderItemDto)
  irs: IROrderItemDto[];
}
