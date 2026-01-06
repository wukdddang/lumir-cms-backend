import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  CreateVideoGalleryDto,
  UpdateVideoGalleryDto,
  CreateVideoGalleryCategoryDto,
  UpdateVideoGalleryCategoryDto,
  CreateVideoGalleryTranslationDto,
  UpdateVideoGalleryTranslationDto,
  CreateVideoGalleryAttachmentDto,
  UpdateVideoGalleryAttachmentDto,
} from './dto/video-gallery.dto';
import * as Decorators from './decorators/video-gallery.decorators';

@ApiTags('비디오 갤러리')
@Controller('video-gallery')
export class VideoGalleryController {
  // ========== 비디오 갤러리 문서 CRUD ==========
  @Get()
  @Decorators.GetAllVideoGalleries()
  async 비디오_갤러리_목록을_조회_한다() {
    return [];
  }

  @Get(':id')
  @Decorators.GetVideoGallery()
  async 비디오_갤러리를_조회_한다(@Param('id') id: string) {
    return {};
  }

  @Post()
  @Decorators.CreateVideoGallery()
  async 비디오_갤러리를_생성_한다(@Body() createDto: CreateVideoGalleryDto) {
    return {};
  }

  @Put(':id')
  @Decorators.UpdateVideoGallery()
  async 비디오_갤러리를_수정_한다(@Param('id') id: string, @Body() updateDto: UpdateVideoGalleryDto) {
    return {};
  }

  @Delete(':id')
  @Decorators.DeleteVideoGallery()
  async 비디오_갤러리를_삭제_한다(@Param('id') id: string) {}

  // ========== 카테고리 CRUD ==========
  @Get('categories')
  @Decorators.GetAllVideoGalleryCategories()
  async 카테고리_목록을_조회_한다() {
    return [];
  }

  @Post('categories')
  @Decorators.CreateVideoGalleryCategory()
  async 카테고리를_생성_한다(@Body() createDto: CreateVideoGalleryCategoryDto) {
    return {};
  }

  @Put('categories/:id')
  @Decorators.UpdateVideoGalleryCategory()
  async 카테고리를_수정_한다(@Param('id') id: string, @Body() updateDto: UpdateVideoGalleryCategoryDto) {
    return {};
  }

  @Delete('categories/:id')
  @Decorators.DeleteVideoGalleryCategory()
  async 카테고리를_삭제_한다(@Param('id') id: string) {}

  // ========== 번역 CRUD ==========
  @Get(':documentId/translations')
  @Decorators.GetVideoGalleryTranslations()
  async 번역_목록을_조회_한다(@Param('documentId') documentId: string) {
    return [];
  }

  @Get(':documentId/translations/:languageId')
  @Decorators.GetVideoGalleryTranslation()
  async 번역을_조회_한다(@Param('documentId') documentId: string, @Param('languageId') languageId: string) {
    return {};
  }

  @Post(':documentId/translations')
  @Decorators.CreateVideoGalleryTranslation()
  async 번역을_생성_한다(@Body() createDto: CreateVideoGalleryTranslationDto) {
    return {};
  }

  @Put(':documentId/translations/:languageId')
  @Decorators.UpdateVideoGalleryTranslation()
  async 번역을_수정_한다(
    @Param('documentId') documentId: string,
    @Param('languageId') languageId: string,
    @Body() updateDto: UpdateVideoGalleryTranslationDto,
  ) {
    return {};
  }

  @Delete(':documentId/translations/:languageId')
  @Decorators.DeleteVideoGalleryTranslation()
  async 번역을_삭제_한다(@Param('documentId') documentId: string, @Param('languageId') languageId: string) {}

  // ========== 첨부파일 CRUD ==========
  @Get(':documentId/translations/:languageId/attachments')
  @Decorators.GetVideoGalleryAttachments()
  async 첨부파일_목록을_조회_한다(@Param('documentId') documentId: string, @Param('languageId') languageId: string) {
    return [];
  }

  @Get(':documentId/translations/:languageId/attachments/:attachmentId')
  @Decorators.GetVideoGalleryAttachment()
  async 첨부파일을_조회_한다(
    @Param('documentId') documentId: string,
    @Param('languageId') languageId: string,
    @Param('attachmentId') attachmentId: string,
  ) {
    return {};
  }

  @Post(':documentId/translations/:languageId/attachments')
  @Decorators.CreateVideoGalleryAttachment()
  async 첨부파일을_생성_한다(@Body() createDto: CreateVideoGalleryAttachmentDto) {
    return {};
  }

  @Put(':documentId/translations/:languageId/attachments/:attachmentId')
  @Decorators.UpdateVideoGalleryAttachment()
  async 첨부파일을_수정_한다(
    @Param('documentId') documentId: string,
    @Param('languageId') languageId: string,
    @Param('attachmentId') attachmentId: string,
    @Body() updateDto: UpdateVideoGalleryAttachmentDto,
  ) {
    return {};
  }

  @Delete(':documentId/translations/:languageId/attachments/:attachmentId')
  @Decorators.DeleteVideoGalleryAttachment()
  async 첨부파일을_삭제_한다(
    @Param('documentId') documentId: string,
    @Param('languageId') languageId: string,
    @Param('attachmentId') attachmentId: string,
  ) {}
}
