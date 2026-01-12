import {
  Controller,
  Get,
  Delete,
  Param,
  Patch,
  Body,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '@interface/common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@interface/common/decorators/current-user.decorator';
import { ElectronicDisclosureBusinessService } from '@business/electronic-disclosure-business/electronic-disclosure-business.service';
import { ElectronicDisclosure } from '@domain/core/electronic-disclosure/electronic-disclosure.entity';

@ApiTags('A-3. 관리자 - 전자공시')
@ApiBearerAuth('Bearer')
@Controller('admin/electronic-disclosures')
export class ElectronicDisclosureController {
  constructor(
    private readonly electronicDisclosureBusinessService: ElectronicDisclosureBusinessService,
  ) {}

  /**
   * 전자공시 전체 목록을 조회한다
   */
  @Get('all')
  @ApiOperation({
    summary: '전자공시 전체 목록 조회',
    description: '모든 전자공시를 조회합니다. (페이징 없음)',
  })
  @ApiResponse({
    status: 200,
    description: '전자공시 전체 목록 조회 성공',
    type: [ElectronicDisclosure],
  })
  async 전자공시_전체_목록을_조회한다(): Promise<ElectronicDisclosure[]> {
    return await this.electronicDisclosureBusinessService.전자공시_전체_목록을_조회한다();
  }

  /**
   * 전자공시 상세를 조회한다
   */
  @Get(':id')
  @ApiOperation({
    summary: '전자공시 상세 조회',
    description: '전자공시의 상세 정보를 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '전자공시 상세 조회 성공',
    type: ElectronicDisclosure,
  })
  @ApiResponse({
    status: 404,
    description: '전자공시를 찾을 수 없음',
  })
  async 전자공시_상세를_조회한다(
    @Param('id') id: string,
  ): Promise<ElectronicDisclosure> {
    return await this.electronicDisclosureBusinessService.전자공시_상세를_조회한다(
      id,
    );
  }

  /**
   * 전자공시 공개 여부를 수정한다
   */
  @Patch(':id/public')
  @ApiOperation({
    summary: '전자공시 공개 상태 수정',
    description: '전자공시의 공개 상태를 수정합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '전자공시 공개 상태 수정 성공',
    type: ElectronicDisclosure,
  })
  @ApiResponse({
    status: 404,
    description: '전자공시를 찾을 수 없음',
  })
  async 전자공시_공개를_수정한다(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: { isPublic: boolean },
  ): Promise<ElectronicDisclosure> {
    return await this.electronicDisclosureBusinessService.전자공시_공개를_수정한다(
      id,
      body.isPublic,
      user.id,
    );
  }

  /**
   * 전자공시 파일을 수정한다 (파일 업로드 포함)
   */
  @Patch(':id/files')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      fileFilter: (req, file, callback) => {
        // 허용된 MIME 타입: PDF, JPG, PNG, WEBP, XLSX, DOCX
        const allowedMimeTypes = [
          'application/pdf',
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/webp',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];

        if (allowedMimeTypes.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(
            new Error(
              `지원하지 않는 파일 형식입니다. 허용된 형식: PDF, JPG, PNG, WEBP, XLSX, DOCX (현재: ${file.mimetype})`,
            ),
            false,
          );
        }
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: '전자공시 파일 수정',
    description: '전자공시의 첨부파일을 수정합니다. 파일은 multipart/form-data로 전송합니다.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: '추가할 첨부파일 목록 (최대 10개)',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: '전자공시 파일 수정 성공',
    type: ElectronicDisclosure,
  })
  @ApiResponse({
    status: 404,
    description: '전자공시를 찾을 수 없음',
  })
  async 전자공시_파일을_수정한다(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: any,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<ElectronicDisclosure> {
    return await this.electronicDisclosureBusinessService.전자공시_파일을_수정한다(
      id,
      { updatedBy: user.id },
      files,
    );
  }

  /**
   * 전자공시 파일을 삭제한다
   */
  @Delete(':id/files')
  @ApiOperation({
    summary: '전자공시 파일 삭제',
    description: '전자공시의 첨부파일을 삭제합니다. S3에서도 함께 삭제됩니다.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        fileUrls: {
          type: 'array',
          items: { type: 'string' },
          description: '삭제할 파일 URL 목록',
          example: [
            'https://bucket.s3.amazonaws.com/electronic-disclosures/file1.pdf',
            'https://bucket.s3.amazonaws.com/electronic-disclosures/file2.jpg',
          ],
        },
      },
      required: ['fileUrls'],
    },
  })
  @ApiResponse({
    status: 200,
    description: '전자공시 파일 삭제 성공',
    type: ElectronicDisclosure,
  })
  @ApiResponse({
    status: 404,
    description: '전자공시를 찾을 수 없음',
  })
  async 전자공시_파일을_삭제한다(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: { fileUrls: string[] },
  ): Promise<ElectronicDisclosure> {
    return await this.electronicDisclosureBusinessService.전자공시_파일을_삭제한다(
      id,
      body.fileUrls,
      user.id,
    );
  }

  /**
   * 전자공시를 삭제한다
   */
  @Delete(':id')
  @ApiOperation({
    summary: '전자공시 삭제',
    description: '전자공시를 삭제합니다 (Soft Delete).',
  })
  @ApiResponse({
    status: 200,
    description: '전자공시 삭제 성공',
  })
  @ApiResponse({
    status: 404,
    description: '전자공시를 찾을 수 없음',
  })
  async 전자공시를_삭제한다(
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    const result =
      await this.electronicDisclosureBusinessService.전자공시를_삭제한다(id);
    return { success: result };
  }
}
