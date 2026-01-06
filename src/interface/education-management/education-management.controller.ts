import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  CreateEducationManagementDto,
  UpdateEducationManagementDto,
  UpdateAttendeeStatusDto,
  CreateEducationManagementAttachmentDto,
  UpdateEducationManagementAttachmentDto,
} from './dto/education-management.dto';
import * as Decorators from './decorators/education-management.decorators';

@ApiTags('교육 관리')
@Controller('education-management')
export class EducationManagementController {
  // ========== 교육 관리 CRUD ==========
  @Get()
  @Decorators.GetAllEducationManagements()
  async 교육_관리_목록을_조회_한다() {
    return [];
  }

  @Get(':id')
  @Decorators.GetEducationManagement()
  async 교육_관리를_조회_한다(@Param('id') id: string) {
    return {};
  }

  @Post()
  @Decorators.CreateEducationManagement()
  async 교육_관리를_생성_한다(@Body() createDto: CreateEducationManagementDto) {
    return {};
  }

  @Put(':id')
  @Decorators.UpdateEducationManagement()
  async 교육_관리를_수정_한다(@Param('id') id: string, @Body() updateDto: UpdateEducationManagementDto) {
    return {};
  }

  @Delete(':id')
  @Decorators.DeleteEducationManagement()
  async 교육_관리를_삭제_한다(@Param('id') id: string) {}

  // ========== 수강자 관리 ==========
  @Get(':id/attendees')
  @Decorators.GetAttendees()
  async 수강자_목록을_조회_한다(@Param('id') id: string) {
    return [];
  }

  @Put(':id/attendees/:attendeeId/status')
  @Decorators.UpdateAttendeeStatus()
  async 수강자_상태를_업데이트_한다(
    @Param('id') id: string,
    @Param('attendeeId') attendeeId: string,
    @Body() updateDto: UpdateAttendeeStatusDto,
  ) {
    return {};
  }

  // ========== 첨부파일 CRUD ==========
  @Get(':id/attachments')
  @Decorators.GetEducationManagementAttachments()
  async 첨부파일_목록을_조회_한다(@Param('id') id: string) {
    return [];
  }

  @Get(':id/attachments/:attachmentId')
  @Decorators.GetEducationManagementAttachment()
  async 첨부파일을_조회_한다(@Param('id') id: string, @Param('attachmentId') attachmentId: string) {
    return {};
  }

  @Post(':id/attachments')
  @Decorators.CreateEducationManagementAttachment()
  async 첨부파일을_생성_한다(@Body() createDto: CreateEducationManagementAttachmentDto) {
    return {};
  }

  @Put(':id/attachments/:attachmentId')
  @Decorators.UpdateEducationManagementAttachment()
  async 첨부파일을_수정_한다(
    @Param('id') id: string,
    @Param('attachmentId') attachmentId: string,
    @Body() updateDto: UpdateEducationManagementAttachmentDto,
  ) {
    return {};
  }

  @Delete(':id/attachments/:attachmentId')
  @Decorators.DeleteEducationManagementAttachment()
  async 첨부파일을_삭제_한다(@Param('id') id: string, @Param('attachmentId') attachmentId: string) {}
}
