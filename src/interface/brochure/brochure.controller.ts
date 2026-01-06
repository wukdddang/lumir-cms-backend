import { Controller, Param, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  CreateBrochureDto,
  UpdateBrochureDto,
  BrochureResponseDto,
  CreateBrochureCategoryDto,
  BrochureCategoryResponseDto,
  CreateBrochureLanguageDto,
  BrochureLanguageResponseDto,
  CreateBrochureTranslationDto,
  UpdateBrochureTranslationDto,
  BrochureTranslationResponseDto,
} from './dto/brochure.dto';
import {
  GetAllBrochures,
  GetBrochure,
  CreateBrochure,
  UpdateBrochure,
  DeleteBrochure,
  GetAllBrochureCategories,
  CreateBrochureCategory,
  GetAllBrochureLanguages,
  CreateBrochureLanguage,
  GetBrochureTranslations,
  GetBrochureTranslation,
  CreateBrochureTranslation,
  UpdateBrochureTranslation,
} from './decorators/brochure.decorators';

@ApiTags('브로슈어')
@Controller('brochures')
export class BrochureController {
  // ========== 브로슈어 문서 CRUD ==========
  @GetAllBrochures()
  async getAllBrochures(): Promise<BrochureResponseDto[]> {
    throw new Error('Business Layer 구현 필요');
  }

  @GetBrochure()
  async getBrochure(@Param('id') id: string): Promise<BrochureResponseDto> {
    throw new Error('Business Layer 구현 필요');
  }

  @CreateBrochure()
  async createBrochure(
    @Body() dto: CreateBrochureDto,
  ): Promise<BrochureResponseDto> {
    throw new Error('Business Layer 구현 필요');
  }

  @UpdateBrochure()
  async updateBrochure(
    @Param('id') id: string,
    @Body() dto: UpdateBrochureDto,
  ): Promise<BrochureResponseDto> {
    throw new Error('Business Layer 구현 필요');
  }

  @DeleteBrochure()
  async deleteBrochure(@Param('id') id: string): Promise<void> {
    throw new Error('Business Layer 구현 필요');
  }

  // ========== 카테고리 CRUD ==========
  @GetAllBrochureCategories()
  async getAllCategories(): Promise<BrochureCategoryResponseDto[]> {
    throw new Error('Business Layer 구현 필요');
  }

  @CreateBrochureCategory()
  async createCategory(
    @Body() dto: CreateBrochureCategoryDto,
  ): Promise<BrochureCategoryResponseDto> {
    throw new Error('Business Layer 구현 필요');
  }

  // ========== 언어 CRUD ==========
  @GetAllBrochureLanguages()
  async getAllLanguages(): Promise<BrochureLanguageResponseDto[]> {
    throw new Error('Business Layer 구현 필요');
  }

  @CreateBrochureLanguage()
  async createLanguage(
    @Body() dto: CreateBrochureLanguageDto,
  ): Promise<BrochureLanguageResponseDto> {
    throw new Error('Business Layer 구현 필요');
  }

  // ========== 번역 CRUD ==========
  @GetBrochureTranslations()
  async getTranslations(
    @Param('documentId') documentId: string,
  ): Promise<BrochureTranslationResponseDto[]> {
    throw new Error('Business Layer 구현 필요');
  }

  @GetBrochureTranslation()
  async getTranslation(
    @Param('documentId') documentId: string,
    @Param('languageId') languageId: string,
  ): Promise<BrochureTranslationResponseDto> {
    throw new Error('Business Layer 구현 필요');
  }

  @CreateBrochureTranslation()
  async createTranslation(
    @Body() dto: CreateBrochureTranslationDto,
  ): Promise<BrochureTranslationResponseDto> {
    throw new Error('Business Layer 구현 필요');
  }

  @UpdateBrochureTranslation()
  async updateTranslation(
    @Param('documentId') documentId: string,
    @Param('languageId') languageId: string,
    @Body() dto: UpdateBrochureTranslationDto,
  ): Promise<BrochureTranslationResponseDto> {
    throw new Error('Business Layer 구현 필요');
  }
}
