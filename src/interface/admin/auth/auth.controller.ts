import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import type { Request } from 'express';
import { Public } from '@interface/common/decorators/public.decorator';
import { LoginDto } from '@interface/common/dto/auth/login.dto';

/**
 * 인증 컨트롤러
 *
 * SSO 서버와 직접 통신하여 로그인 및 사용자 정보를 제공합니다.
 */
@ApiTags('공통. 인증')
@Controller('admin/auth')
export class AuthController {
  private readonly ssoBaseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    const baseUrl = this.configService.get<string>('SSO_BASE_URL') || '';
    this.ssoBaseUrl = baseUrl.replace(/\/$/, '');
  }

  /**
   * SSO 로그인
   */
  @Public()
  @Post('login')
  @ApiOperation({
    summary: '로그인',
    description: 'SSO 서버로 직접 로그인 요청을 보냅니다.',
  })
  @ApiResponse({
    status: 201,
    description: '로그인 성공 - SSO 응답을 그대로 반환',
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
  })
  async login(@Body() loginDto: LoginDto): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.ssoBaseUrl}/api/auth/login`, {
          grant_type: 'password',
          email: loginDto.email,
          password: loginDto.password,
        }),
      );

      // SSO 응답을 그대로 반환
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        throw new UnauthorizedException(
          '이메일 또는 비밀번호가 올바르지 않습니다.',
        );
      }
      throw new UnauthorizedException('로그인에 실패했습니다.');
    }
  }

  /**
   * 현재 사용자 정보 조회 (SSO verify)
   *
   * @remarks
   * Swagger 테스트용으로 AdminGuard를 우회합니다.
   * SSO /api/auth/verify로 직접 토큰 검증 후 사용자 정보를 반환합니다.
   */
  @Public()
  @Get('me')
  @ApiBearerAuth('Bearer')
  @ApiOperation({
    summary: '현재 사용자 정보 조회',
    description:
      'SSO /api/auth/verify로 토큰을 검증하고 사용자 정보를 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '사용자 정보 조회 성공 - SSO verify 응답을 그대로 반환',
  })
  @ApiResponse({
    status: 401,
    description: '인증되지 않음',
  })
  async getMe(@Req() request: Request): Promise<any> {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('인증 토큰이 필요합니다.');
    }

    const token = authHeader.substring(7); // "Bearer " 제거

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.ssoBaseUrl}/api/auth/verify`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        ),
      );

      // SSO verify 응답을 그대로 반환
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        throw new UnauthorizedException('유효하지 않은 토큰입니다.');
      }
      throw new UnauthorizedException('토큰 검증에 실패했습니다.');
    }
  }
}
