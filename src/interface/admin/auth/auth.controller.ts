import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthContextService } from '@context/auth-context';
import type { AuthenticatedUser } from '@interface/common/decorators/current-user.decorator';
import { CurrentUser } from '@interface/common/decorators/current-user.decorator';
import { Public } from '@interface/common/decorators/public.decorator';
import { JwtAuthGuard } from '@interface/common/guards/jwt-auth.guard';
import {
  LoginResponseDto,
  UserInfoDto,
} from '@interface/common/dto/auth/login-response.dto';
import { LoginDto } from '@interface/common/dto/auth/login.dto';

/**
 * 인증 컨트롤러
 *
 * 로그인, 사용자 정보 조회 등 인증 관련 API를 제공합니다.
 */
@ApiTags('A-0. 인증')
@Controller('admin/auth')
export class AuthController {
  constructor(private readonly authContextService: AuthContextService) {}

  /**
   * 이메일/패스워드로 로그인
   */
  @Public()
  @Post('login')
  @ApiOperation({
    summary: '로그인',
    description: 'SSO 서버를 통해 이메일과 비밀번호로 로그인합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '로그인 성공',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
  })
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    const result = await this.authContextService.로그인한다(
      loginDto.email,
      loginDto.password,
    );

    return {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    };
  }

  /**
   * 현재 로그인한 사용자 정보 조회
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('Bearer')
  @ApiOperation({
    summary: '현재 사용자 정보 조회',
    description: 'JWT 토큰으로 인증된 현재 사용자의 정보를 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '사용자 정보 조회 성공',
    type: UserInfoDto,
  })
  @ApiResponse({
    status: 401,
    description: '인증되지 않음',
  })
  async getMe(@CurrentUser() user: AuthenticatedUser): Promise<UserInfoDto> {
    return user;
  }
}
