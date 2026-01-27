import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard } from '@interface/common/guards';
import { Roles, CurrentUser } from '@interface/common/decorators';
import type { AuthenticatedUser } from '@interface/common/decorators/current-user.decorator';
import { LanguageBusinessService } from '@business/language-business/language-business.service';
import { CreateLanguageDto } from '@interface/common/dto/language/create-language.dto';
import {
  UpdateLanguageActiveDto,
  UpdateLanguageOrderDto,
} from '@interface/common/dto/language/update-language.dto';
import {
  LanguageResponseDto,
  LanguageListResponseDto,
} from '@interface/common/dto/language/language-response.dto';
import { LanguageCodeListResponseDto } from '@interface/common/dto/language/language-code-response.dto';

@ApiTags('공통. 관리자 - 언어')
@ApiBearerAuth('Bearer')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/languages')
export class LanguageController {
  constructor(
    private readonly languageBusinessService: LanguageBusinessService,
  ) {}

  /**
   * 언어 목록을 조회한다
   */
  @Get()
  @ApiOperation({
    summary: '언어 목록 조회',
    description: '시스템에 등록된 언어 목록을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '언어 목록 조회 성공',
    type: LanguageListResponseDto,
  })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    description: '비활성 언어 포함 여부',
    type: Boolean,
  })
  async 언어_목록을_조회한다(
    @Query('includeInactive') includeInactive?: string,
  ): Promise<LanguageListResponseDto> {
    const items = await this.languageBusinessService.언어_목록을_조회한다(
      includeInactive === 'true',
    );

    return {
      items,
      total: items.length,
    };
  }

  /**
   * 사용 가능한 언어 코드 목록을 조회한다
   */
  @Get('available-codes')
  @ApiOperation({
    summary: '추가 가능한 언어 코드 목록 조회',
    description:
      'ISO 639-1 표준에 따른 추가 가능한 언어 코드 목록을 조회합니다.\n\n' +
      '활성 상태인 언어만 제외되며, 제외된 언어는 다시 추가할 수 있습니다.\n' +
      '언어 추가 시 참고할 수 있는 표준 언어 코드 목록입니다.',
  })
  @ApiResponse({
    status: 200,
    description: '언어 코드 목록 조회 성공',
    type: LanguageCodeListResponseDto,
  })
  async 사용_가능한_언어_코드_목록을_조회한다(): Promise<LanguageCodeListResponseDto> {
    const codes =
      await this.languageBusinessService.사용_가능한_언어_코드_목록을_조회한다();

    return {
      codes,
      total: codes.length,
    };
  }

  /**
   * 언어를 추가한다
   */
  @Patch(':id/active')
  @ApiOperation({
    summary: '언어 활성 상태 수정',
    description:
      '언어의 활성 상태를 변경합니다.\n\n' +
      '**필수 필드:**\n' +
      '- `isActive`: 활성화 여부 (boolean)\n' +
      '  - `true`: 활성화 (언어 추가)\n' +
      '  - `false`: 비활성화 (언어 제외)\n\n' +
      '**참고**: `updatedBy`는 토큰에서 자동으로 추출됩니다.\n' +
      '**주의**: 기본 언어는 비활성화할 수 없습니다.',
  })
  @ApiResponse({
    status: 200,
    description: '언어 활성 상태 수정 성공',
    type: LanguageResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '언어를 찾을 수 없음',
  })
  @ApiResponse({
    status: 400,
    description: '기본 언어는 비활성화할 수 없음',
  })
  async 언어_활성_상태를_수정한다(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() updateDto: UpdateLanguageActiveDto,
  ): Promise<LanguageResponseDto> {
    return await this.languageBusinessService.언어_활성_상태를_수정한다(id, {
      ...updateDto,
      updatedBy: user.id,
    });
  }

  /**
   * 언어 순서를 변경한다
   */
  @Patch(':id/order')
  @ApiOperation({
    summary: '언어 순서 변경',
    description:
      '언어의 정렬 순서를 변경합니다.\n\n' +
      '**필수 필드:**\n' +
      '- `order`: 정렬 순서 (숫자)\n\n' +
      '**참고**: `updatedBy`는 토큰에서 자동으로 추출됩니다.',
  })
  @ApiResponse({
    status: 200,
    description: '언어 순서 변경 성공',
    type: LanguageResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '언어를 찾을 수 없음',
  })
  async 언어_순서를_변경한다(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() updateDto: UpdateLanguageOrderDto,
  ): Promise<LanguageResponseDto> {
    return await this.languageBusinessService.언어_순서를_변경한다(id, {
      ...updateDto,
      updatedBy: user.id,
    });
  }

  /**
   * 기본 언어들을 추가한다
   */
  @Post('initialize-default')
  @ApiOperation({
    summary: '기본 언어 초기화',
    description:
      '한국어, 영어, 일본어, 중국어를 자동으로 추가합니다. ' +
      '이미 존재하는 언어는 건너뜁니다.\n\n' +
      '**Request Body**: 없음 (자동으로 기본 언어들 생성)',
  })
  @ApiResponse({
    status: 201,
    description: '기본 언어 추가 성공',
    type: [LanguageResponseDto],
  })
  async 기본_언어들을_추가한다(): Promise<LanguageListResponseDto> {
    const items = await this.languageBusinessService.기본_언어들을_추가한다();

    return {
      items,
      total: items.length,
    };
  }

  /**
   * 언어 상세를 조회한다
   */
  @Get(':id')
  @ApiOperation({
    summary: '언어 상세 조회',
    description: 'ID로 언어 상세 정보를 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '언어 상세 조회 성공',
    type: LanguageResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '언어를 찾을 수 없음',
  })
  async 언어_상세를_조회한다(
    @Param('id') id: string,
  ): Promise<LanguageResponseDto> {
    return await this.languageBusinessService.언어_상세를_조회한다(id);
  }
}
