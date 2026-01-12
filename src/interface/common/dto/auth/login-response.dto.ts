import { ApiProperty } from '@nestjs/swagger';

/**
 * 사용자 정보 DTO
 */
export class UserInfoDto {
  @ApiProperty({
    description: '사용자 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: '외부 SSO ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  externalId: string;

  @ApiProperty({ description: '이메일', example: 'admin@lumir.space' })
  email: string;

  @ApiProperty({ description: '이름', example: '홍길동' })
  name: string;

  @ApiProperty({ description: '사번', example: '23047' })
  employeeNumber: string;

  @ApiProperty({
    description: 'CMS 시스템 역할',
    example: ['admin', 'user'],
    type: [String],
  })
  roles: string[];

  @ApiProperty({ description: '재직 상태', example: '재직중' })
  status: string;
}

/**
 * 로그인 응답 DTO
 */
export class LoginResponseDto {
  @ApiProperty({ type: UserInfoDto })
  user: UserInfoDto;

  @ApiProperty({
    description: '액세스 토큰',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: '리프레시 토큰',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;
}
