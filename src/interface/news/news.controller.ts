import { Controller, Param, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  CreateNewsDto,
  UpdateNewsDto,
  NewsResponseDto,
  CreateNewsCategoryDto,
  NewsCategoryResponseDto,
  CreateNewsLanguageDto,
  NewsLanguageResponseDto,
  CreateNewsTranslationDto,
  UpdateNewsTranslationDto,
  NewsTranslationResponseDto,
  CreateNewsUrlDto,
  UpdateNewsUrlDto,
  NewsUrlResponseDto,
} from './dto/news.dto';
import {
  GetAllNews,
  GetNews,
  CreateNews,
  UpdateNews,
  DeleteNews,
  GetAllNewsCategories,
  CreateNewsCategory,
  GetAllNewsLanguages,
  CreateNewsLanguage,
  GetNewsTranslations,
  GetNewsTranslation,
  CreateNewsTranslation,
  UpdateNewsTranslation,
  GetNewsUrl,
  CreateNewsUrl,
  UpdateNewsUrl,
} from './decorators/news.decorators';

@ApiTags('뉴스')
@Controller('news')
export class NewsController {
  // ========== 뉴스 문서 CRUD ==========
  @GetAllNews()
  async getAllNews(): Promise<NewsResponseDto[]> {
    throw new Error('Business Layer 구현 필요');
  }

  @GetNews()
  async getNews(@Param('id') id: string): Promise<NewsResponseDto> {
    throw new Error('Business Layer 구현 필요');
  }

  @CreateNews()
  async createNews(@Body() dto: CreateNewsDto): Promise<NewsResponseDto> {
    throw new Error('Business Layer 구현 필요');
  }

  @UpdateNews()
  async updateNews(
    @Param('id') id: string,
    @Body() dto: UpdateNewsDto,
  ): Promise<NewsResponseDto> {
    throw new Error('Business Layer 구현 필요');
  }

  @DeleteNews()
  async deleteNews(@Param('id') id: string): Promise<void> {
    throw new Error('Business Layer 구현 필요');
  }

  // ========== 카테고리 CRUD ==========
  @GetAllNewsCategories()
  async getAllCategories(): Promise<NewsCategoryResponseDto[]> {
    throw new Error('Business Layer 구현 필요');
  }

  @CreateNewsCategory()
  async createCategory(
    @Body() dto: CreateNewsCategoryDto,
  ): Promise<NewsCategoryResponseDto> {
    throw new Error('Business Layer 구현 필요');
  }

  // ========== 언어 CRUD ==========
  @GetAllNewsLanguages()
  async getAllLanguages(): Promise<NewsLanguageResponseDto[]> {
    throw new Error('Business Layer 구현 필요');
  }

  @CreateNewsLanguage()
  async createLanguage(
    @Body() dto: CreateNewsLanguageDto,
  ): Promise<NewsLanguageResponseDto> {
    throw new Error('Business Layer 구현 필요');
  }

  // ========== 번역 CRUD ==========
  @GetNewsTranslations()
  async getTranslations(
    @Param('documentId') documentId: string,
  ): Promise<NewsTranslationResponseDto[]> {
    throw new Error('Business Layer 구현 필요');
  }

  @GetNewsTranslation()
  async getTranslation(
    @Param('documentId') documentId: string,
    @Param('languageId') languageId: string,
  ): Promise<NewsTranslationResponseDto> {
    throw new Error('Business Layer 구현 필요');
  }

  @CreateNewsTranslation()
  async createTranslation(
    @Body() dto: CreateNewsTranslationDto,
  ): Promise<NewsTranslationResponseDto> {
    throw new Error('Business Layer 구현 필요');
  }

  @UpdateNewsTranslation()
  async updateTranslation(
    @Param('documentId') documentId: string,
    @Param('languageId') languageId: string,
    @Body() dto: UpdateNewsTranslationDto,
  ): Promise<NewsTranslationResponseDto> {
    throw new Error('Business Layer 구현 필요');
  }

  // ========== URL CRUD ==========
  @GetNewsUrl()
  async getUrl(@Param('documentId') documentId: string): Promise<NewsUrlResponseDto> {
    throw new Error('Business Layer 구현 필요');
  }

  @CreateNewsUrl()
  async createUrl(@Body() dto: CreateNewsUrlDto): Promise<NewsUrlResponseDto> {
    throw new Error('Business Layer 구현 필요');
  }

  @UpdateNewsUrl()
  async updateUrl(
    @Param('documentId') documentId: string,
    @Body() dto: UpdateNewsUrlDto,
  ): Promise<NewsUrlResponseDto> {
    throw new Error('Business Layer 구현 필요');
  }
}
