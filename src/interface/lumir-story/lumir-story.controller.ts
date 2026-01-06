import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  CreateLumirStoryDto,
  UpdateLumirStoryDto,
  CreateLumirStoryCategoryDto,
  UpdateLumirStoryCategoryDto,
  CreateLumirStoryTranslationDto,
  UpdateLumirStoryTranslationDto,
  CreateLumirStoryAttachmentDto,
  UpdateLumirStoryAttachmentDto,
} from './dto/lumir-story.dto';
import * as Decorators from './decorators/lumir-story.decorators';

@ApiTags('루미르 스토리')
@Controller('lumir-story')
export class LumirStoryController {
  // ========== 스토리 문서 CRUD ==========
  @Get()
  @Decorators.GetAllLumirStories()
  async 스토리_목록을_조회_한다() {
    return [];
  }

  @Get(':id')
  @Decorators.GetLumirStory()
  async 스토리를_조회_한다(@Param('id') id: string) {
    return {};
  }

  @Post()
  @Decorators.CreateLumirStory()
  async 스토리를_생성_한다(@Body() createDto: CreateLumirStoryDto) {
    return {};
  }

  @Put(':id')
  @Decorators.UpdateLumirStory()
  async 스토리를_수정_한다(@Param('id') id: string, @Body() updateDto: UpdateLumirStoryDto) {
    return {};
  }

  @Delete(':id')
  @Decorators.DeleteLumirStory()
  async 스토리를_삭제_한다(@Param('id') id: string) {}

  // ========== 카테고리 CRUD ==========
  @Get('categories')
  @Decorators.GetAllLumirStoryCategories()
  async 카테고리_목록을_조회_한다() {
    return [];
  }

  @Post('categories')
  @Decorators.CreateLumirStoryCategory()
  async 카테고리를_생성_한다(@Body() createDto: CreateLumirStoryCategoryDto) {
    return {};
  }

  @Put('categories/:id')
  @Decorators.UpdateLumirStoryCategory()
  async 카테고리를_수정_한다(@Param('id') id: string, @Body() updateDto: UpdateLumirStoryCategoryDto) {
    return {};
  }

  @Delete('categories/:id')
  @Decorators.DeleteLumirStoryCategory()
  async 카테고리를_삭제_한다(@Param('id') id: string) {}

  // ========== 번역 CRUD ==========
  @Get(':documentId/translations')
  @Decorators.GetLumirStoryTranslations()
  async 번역_목록을_조회_한다(@Param('documentId') documentId: string) {
    return [];
  }

  @Get(':documentId/translations/:languageId')
  @Decorators.GetLumirStoryTranslation()
  async 번역을_조회_한다(@Param('documentId') documentId: string, @Param('languageId') languageId: string) {
    return {};
  }

  @Post(':documentId/translations')
  @Decorators.CreateLumirStoryTranslation()
  async 번역을_생성_한다(@Body() createDto: CreateLumirStoryTranslationDto) {
    return {};
  }

  @Put(':documentId/translations/:languageId')
  @Decorators.UpdateLumirStoryTranslation()
  async 번역을_수정_한다(
    @Param('documentId') documentId: string,
    @Param('languageId') languageId: string,
    @Body() updateDto: UpdateLumirStoryTranslationDto,
  ) {
    return {};
  }

  @Delete(':documentId/translations/:languageId')
  @Decorators.DeleteLumirStoryTranslation()
  async 번역을_삭제_한다(@Param('documentId') documentId: string, @Param('languageId') languageId: string) {}

  // ========== 첨부파일 CRUD ==========
  @Get(':documentId/translations/:languageId/attachments')
  @Decorators.GetLumirStoryAttachments()
  async 첨부파일_목록을_조회_한다(@Param('documentId') documentId: string, @Param('languageId') languageId: string) {
    return [];
  }

  @Get(':documentId/translations/:languageId/attachments/:attachmentId')
  @Decorators.GetLumirStoryAttachment()
  async 첨부파일을_조회_한다(
    @Param('documentId') documentId: string,
    @Param('languageId') languageId: string,
    @Param('attachmentId') attachmentId: string,
  ) {
    return {};
  }

  @Post(':documentId/translations/:languageId/attachments')
  @Decorators.CreateLumirStoryAttachment()
  async 첨부파일을_생성_한다(@Body() createDto: CreateLumirStoryAttachmentDto) {
    return {};
  }

  @Put(':documentId/translations/:languageId/attachments/:attachmentId')
  @Decorators.UpdateLumirStoryAttachment()
  async 첨부파일을_수정_한다(
    @Param('documentId') documentId: string,
    @Param('languageId') languageId: string,
    @Param('attachmentId') attachmentId: string,
    @Body() updateDto: UpdateLumirStoryAttachmentDto,
  ) {
    return {};
  }

  @Delete(':documentId/translations/:languageId/attachments/:attachmentId')
  @Decorators.DeleteLumirStoryAttachment()
  async 첨부파일을_삭제_한다(
    @Param('documentId') documentId: string,
    @Param('languageId') languageId: string,
    @Param('attachmentId') attachmentId: string,
  ) {}
}
