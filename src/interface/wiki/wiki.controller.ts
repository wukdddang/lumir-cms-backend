import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  CreateWikiDto,
  UpdateWikiDto,
  CreateWikiFileSystemDto,
  UpdateWikiFileSystemDto,
} from './dto/wiki.dto';
import * as Decorators from './decorators/wiki.decorators';

@ApiTags('위키')
@Controller('wiki')
export class WikiController {
  // ========== 위키 문서 CRUD ==========
  @Get()
  @Decorators.GetAllWikis()
  async Wiki_목록을_조회_한다() {
    return [];
  }

  @Get('search')
  @Decorators.SearchWikis()
  async Wiki를_검색_한다(@Query('query') query: string) {
    return [];
  }

  @Get(':id')
  @Decorators.GetWiki()
  async Wiki를_조회_한다(@Param('id') id: string) {
    return {};
  }

  @Post()
  @Decorators.CreateWiki()
  async Wiki를_생성_한다(@Body() createDto: CreateWikiDto) {
    return {};
  }

  @Put(':id')
  @Decorators.UpdateWiki()
  async Wiki를_수정_한다(@Param('id') id: string, @Body() updateDto: UpdateWikiDto) {
    return {};
  }

  @Delete(':id')
  @Decorators.DeleteWiki()
  async Wiki를_삭제_한다(@Param('id') id: string) {}

  // ========== 파일 시스템 CRUD ==========
  @Get('file-system')
  @Decorators.GetWikiFileSystem()
  async 파일_시스템을_조회_한다() {
    return {};
  }

  @Post('file-system')
  @Decorators.CreateWikiFileSystemItem()
  async 파일_시스템_항목을_생성_한다(@Body() createDto: CreateWikiFileSystemDto) {
    return {};
  }

  @Put('file-system/:id')
  @Decorators.UpdateWikiFileSystemItem()
  async 파일_시스템_항목을_수정_한다(@Param('id') id: string, @Body() updateDto: UpdateWikiFileSystemDto) {
    return {};
  }

  @Delete('file-system/:id')
  @Decorators.DeleteWikiFileSystemItem()
  async 파일_시스템_항목을_삭제_한다(@Param('id') id: string) {}
}
