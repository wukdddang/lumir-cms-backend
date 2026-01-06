import {
  Controller,
  Param,
  Body,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AnnouncementService } from '@business/announcement/announcement.service';
import {
  CreateAnnouncementDto,
  UpdateAnnouncementDto,
  AnnouncementResponseDto,
  CreateAnnouncementCategoryDto,
  UpdateAnnouncementCategoryDto,
  AnnouncementCategoryResponseDto,
  AnnouncementAttachmentResponseDto,
  AnnouncementTargetResponseDto,
  AnnouncementRespondedResponseDto,
} from './dto/announcement.dto';
import {
  GetAllAnnouncements,
  GetAnnouncement,
  CreateAnnouncement,
  UpdateAnnouncement,
  DeleteAnnouncement,
  GetAllCategories,
  CreateCategory,
  UpdateCategory,
  DeleteCategory,
  GetAnnouncementAttachments,
  GetAnnouncementTargets,
  GetAnnouncementResponses,
} from './decorators/announcement.decorators';
import { AnnouncementDto } from '@domain/core/announcement/announcement.types';

/**
 * AnnouncementDto를 AnnouncementResponseDto로 변환하는 헬퍼 함수
 */
function toAnnouncementResponseDto(
  dto: AnnouncementDto,
): AnnouncementResponseDto {
  return {
    id: dto.id!,
    title: dto.title,
    content: dto.content,
    isFixed: dto.isFixed,
    category: dto.category,
    releasedAt: dto.releasedAt,
    expiredAt: dto.expiredAt,
    mustRead: dto.mustRead,
    manager: {
      id: dto.manager.id!,
      name: dto.manager.name,
      email: dto.manager.email,
    },
    status: dto.status,
    hits: dto.hits,
    attachments: dto.attachments,
    employeeCount: dto.employees.length,
    readCount: dto.employees.filter((emp) => emp.isRead).length,
    submittedCount: dto.employees.filter((emp) => emp.isSubmitted).length,
    createdAt: dto.createdAt!,
    updatedAt: dto.updatedAt!,
  };
}

/**
 * 공지사항 컨트롤러
 *
 * 공지사항 관련 API 엔드포인트를 제공합니다.
 */
@ApiTags('공지사항')
@Controller('announcements')
export class AnnouncementController {
  constructor(private readonly announcementService: AnnouncementService) {}

  // ========== 공지사항 CRUD ==========

  /**
   * 모든 공지사항을 조회한다
   */
  @GetAllAnnouncements()
  async getAllAnnouncements(): Promise<AnnouncementResponseDto[]> {
    const result = await this.announcementService.공지사항_목록을_조회_한다();
    return result.data.map(toAnnouncementResponseDto);
  }

  /**
   * 특정 공지사항을 조회한다
   */
  @GetAnnouncement()
  async getAnnouncement(
    @Param('id') id: string,
  ): Promise<AnnouncementResponseDto> {
    try {
      const result = await this.announcementService.공지사항을_조회_한다(id);
      return toAnnouncementResponseDto(result.data);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('찾을 수 없습니다')
      ) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  /**
   * 공지사항의 첨부파일 목록을 조회한다
   */
  @GetAnnouncementAttachments()
  async getAnnouncementAttachments(
    @Param('id') id: string,
  ): Promise<AnnouncementAttachmentResponseDto[]> {
    // Business Layer 구현 필요
    throw new Error('Business Layer 구현 필요');
  }

  /**
   * 공지사항의 대상자 목록을 조회한다
   */
  @GetAnnouncementTargets()
  async getAnnouncementTargets(
    @Param('id') id: string,
  ): Promise<AnnouncementTargetResponseDto[]> {
    // Business Layer 구현 필요
    throw new Error('Business Layer 구현 필요');
  }

  /**
   * 공지사항의 응답 상태 목록을 조회한다
   */
  @GetAnnouncementResponses()
  async getAnnouncementResponses(
    @Param('id') id: string,
  ): Promise<AnnouncementRespondedResponseDto[]> {
    // Business Layer 구현 필요
    throw new Error('Business Layer 구현 필요');
  }

  /**
   * 공지사항을 생성한다
   */
  @CreateAnnouncement()
  async createAnnouncement(
    @Body() dto: CreateAnnouncementDto,
  ): Promise<AnnouncementResponseDto> {
    const result = await this.announcementService.공지사항을_생성_한다(
      dto as any,
    );
    return toAnnouncementResponseDto(result.data);
  }

  /**
   * 공지사항을 수정한다
   */
  @UpdateAnnouncement()
  async updateAnnouncement(
    @Param('id') id: string,
    @Body() dto: UpdateAnnouncementDto,
  ): Promise<AnnouncementResponseDto> {
    try {
      const result = await this.announcementService.공지사항을_수정_한다(
        id,
        dto as any,
      );
      return toAnnouncementResponseDto(result.data);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('찾을 수 없습니다')) {
          throw new NotFoundException(error.message);
        }
        if (error.message.includes('invalid input value for enum')) {
          throw new BadRequestException('유효하지 않은 상태 값입니다.');
        }
        if (error.message.includes('value too long for type')) {
          throw new BadRequestException('입력 값이 최대 길이를 초과했습니다.');
        }
      }
      throw error;
    }
  }

  /**
   * 공지사항을 삭제한다
   */
  @DeleteAnnouncement()
  async deleteAnnouncement(@Param('id') id: string): Promise<void> {
    try {
      await this.announcementService.공지사항을_삭제_한다(id);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('찾을 수 없습니다')
      ) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  // ========== 카테고리 CRUD ==========

  /**
   * 모든 카테고리를 조회한다
   */
  @GetAllCategories()
  async getAllCategories(): Promise<AnnouncementCategoryResponseDto[]> {
    // Business Layer 구현 필요
    throw new Error('Business Layer 구현 필요');
  }

  /**
   * 카테고리를 생성한다
   */
  @CreateCategory()
  async createCategory(
    @Body() dto: CreateAnnouncementCategoryDto,
  ): Promise<AnnouncementCategoryResponseDto> {
    // Business Layer 구현 필요
    throw new Error('Business Layer 구현 필요');
  }

  /**
   * 카테고리를 수정한다
   */
  @UpdateCategory()
  async updateCategory(
    @Param('id') id: string,
    @Body() dto: UpdateAnnouncementCategoryDto,
  ): Promise<AnnouncementCategoryResponseDto> {
    // Business Layer 구현 필요
    throw new Error('Business Layer 구현 필요');
  }

  /**
   * 카테고리를 삭제한다
   */
  @DeleteCategory()
  async deleteCategory(@Param('id') id: string): Promise<void> {
    // Business Layer 구현 필요
    throw new Error('Business Layer 구현 필요');
  }
}
