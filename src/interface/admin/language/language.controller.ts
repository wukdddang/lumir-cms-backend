import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { LanguageBusinessService } from '@business/language-business/language-business.service';
import { CreateLanguageDto } from '@interface/common/dto/language/create-language.dto';
import { UpdateLanguageDto } from '@interface/common/dto/language/update-language.dto';
import {
  LanguageResponseDto,
  LanguageListResponseDto,
} from '@interface/common/dto/language/language-response.dto';

@ApiTags('A-1. 관리자 - 언어')
@ApiBearerAuth('Bearer')
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
   * 언어를 생성한다
   */
  @Post()
  @ApiOperation({
    summary: '언어 생성',
    description: '새로운 언어를 생성합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '언어 생성 성공',
    type: LanguageResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: '이미 존재하는 언어 코드',
  })
  async 언어를_생성한다(
    @Body() createDto: CreateLanguageDto,
  ): Promise<LanguageResponseDto> {
    return await this.languageBusinessService.언어를_생성한다({
      ...createDto,
      isActive: createDto.isActive ?? true, // 기본값 true 설정
    });
  }

  /**
   * 기본 언어들을 추가한다
   */
  @Post('initialize-default')
  @ApiOperation({
    summary: '기본 언어 초기화',
    description:
      '한국어, 영어, 일본어, 중국어를 자동으로 추가합니다. 이미 존재하는 언어는 건너뜁니다.',
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
   * 언어를 수정한다
   */
  @Put(':id')
  @ApiOperation({
    summary: '언어 수정',
    description: '언어 정보를 수정합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '언어 수정 성공',
    type: LanguageResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '언어를 찾을 수 없음',
  })
  async 언어를_수정한다(
    @Param('id') id: string,
    @Body() updateDto: UpdateLanguageDto,
  ): Promise<LanguageResponseDto> {
    return await this.languageBusinessService.언어를_수정한다(id, updateDto);
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

  /**
   * 언어를 부분 수정한다 (PATCH)
   */
  @Patch(':id')
  @ApiOperation({
    summary: '언어 부분 수정',
    description: '언어 정보를 부분 수정합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '언어 수정 성공',
    type: LanguageResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '언어를 찾을 수 없음',
  })
  async 언어를_부분수정한다(
    @Param('id') id: string,
    @Body() updateDto: UpdateLanguageDto,
  ): Promise<LanguageResponseDto> {
    return await this.languageBusinessService.언어를_수정한다(id, updateDto);
  }

  /**
   * 언어를 삭제한다
   */
  @Delete(':id')
  @ApiOperation({
    summary: '언어 삭제',
    description: '언어를 삭제합니다 (Soft Delete).',
  })
  @ApiResponse({
    status: 200,
    description: '언어 삭제 성공',
  })
  @ApiResponse({
    status: 404,
    description: '언어를 찾을 수 없음',
  })
  async 언어를_삭제한다(
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    const result = await this.languageBusinessService.언어를_삭제한다(id);
    return { success: result };
  }
}
