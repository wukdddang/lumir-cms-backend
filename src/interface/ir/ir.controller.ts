import { Controller, Param, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateIrDto, UpdateIrDto, IrResponseDto, CreateIrCategoryDto, IrCategoryResponseDto, CreateIrLanguageDto, IrLanguageResponseDto, CreateIrTranslationDto, UpdateIrTranslationDto, IrTranslationResponseDto } from './dto/ir.dto';
import { GetAllIrs, GetIr, CreateIr, UpdateIr, DeleteIr, GetAllIrCategories, CreateIrCategory, GetAllIrLanguages, CreateIrLanguage, GetIrTranslations, GetIrTranslation, CreateIrTranslation, UpdateIrTranslation } from './decorators/ir.decorators';

@ApiTags('IR')
@Controller('ir')
export class IrController {
  // ========== IR 문서 CRUD ==========
  @GetAllIrs()
  async getAllIrs(): Promise<IrResponseDto[]> {
    throw new Error('Business Layer 구현 필요');
  }

  @GetIr()
  async getIr(@Param('id') id: string): Promise<IrResponseDto> {
    throw new Error('Business Layer 구현 필요');
  }

  @CreateIr()
  async createIr(@Body() dto: CreateIrDto): Promise<IrResponseDto> {
    throw new Error('Business Layer 구현 필요');
  }

  @UpdateIr()
  async updateIr(@Param('id') id: string, @Body() dto: UpdateIrDto): Promise<IrResponseDto> {
    throw new Error('Business Layer 구현 필요');
  }

  @DeleteIr()
  async deleteIr(@Param('id') id: string): Promise<void> {
    throw new Error('Business Layer 구현 필요');
  }

  // ========== 카테고리 CRUD ==========
  @GetAllIrCategories()
  async getAllCategories(): Promise<IrCategoryResponseDto[]> {
    throw new Error('Business Layer 구현 필요');
  }

  @CreateIrCategory()
  async createCategory(@Body() dto: CreateIrCategoryDto): Promise<IrCategoryResponseDto> {
    throw new Error('Business Layer 구현 필요');
  }

  // ========== 언어 CRUD ==========
  @GetAllIrLanguages()
  async getAllLanguages(): Promise<IrLanguageResponseDto[]> {
    throw new Error('Business Layer 구현 필요');
  }

  @CreateIrLanguage()
  async createLanguage(@Body() dto: CreateIrLanguageDto): Promise<IrLanguageResponseDto> {
    throw new Error('Business Layer 구현 필요');
  }

  // ========== 번역 CRUD ==========
  @GetIrTranslations()
  async getTranslations(@Param('documentId') documentId: string): Promise<IrTranslationResponseDto[]> {
    throw new Error('Business Layer 구현 필요');
  }

  @GetIrTranslation()
  async getTranslation(@Param('documentId') documentId: string, @Param('languageId') languageId: string): Promise<IrTranslationResponseDto> {
    throw new Error('Business Layer 구현 필요');
  }

  @CreateIrTranslation()
  async createTranslation(@Body() dto: CreateIrTranslationDto): Promise<IrTranslationResponseDto> {
    throw new Error('Business Layer 구현 필요');
  }

  @UpdateIrTranslation()
  async updateTranslation(@Param('documentId') documentId: string, @Param('languageId') languageId: string, @Body() dto: UpdateIrTranslationDto): Promise<IrTranslationResponseDto> {
    throw new Error('Business Layer 구현 필요');
  }
}
