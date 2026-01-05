import {
  Controller,
  Body,
  Param,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AnnouncementPopupService } from '@business/announcement-popup/announcement-popup.service';
import {
  CreateAnnouncementPopupDto,
  UpdateAnnouncementPopupDto,
  AnnouncementPopupResponseDto,
} from './dto/announcement-popup.dto';
import {
  GetAllAnnouncementPopups,
  GetAnnouncementPopup,
  CreateAnnouncementPopup,
  UpdateAnnouncementPopup,
  DeleteAnnouncementPopup,
} from './decorators/announcement-popup.decorators';

/**
 * 공지사항 팝업 컨트롤러
 *
 * 공지사항 팝업 관련 API 엔드포인트를 제공합니다.
 */
@ApiTags('공지사항 팝업')
@Controller('announcement-popups')
export class AnnouncementPopupController {
  constructor(
    private readonly announcementPopupService: AnnouncementPopupService,
  ) {}

  /**
   * 모든 공지사항 팝업을 조회한다
   */
  @GetAllAnnouncementPopups()
  async getAllAnnouncementPopups(): Promise<AnnouncementPopupResponseDto[]> {
    const result = await this.announcementPopupService.팝업_목록을_조회_한다();
    return result.data as unknown as AnnouncementPopupResponseDto[];
  }

  /**
   * ID로 공지사항 팝업을 조회한다
   */
  @GetAnnouncementPopup()
  async getAnnouncementPopup(
    @Param('id') id: string,
  ): Promise<AnnouncementPopupResponseDto> {
    try {
      const result = await this.announcementPopupService.팝업을_조회_한다(id);
      return result.data as unknown as AnnouncementPopupResponseDto;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('찾을 수 없습니다')) {
          throw new NotFoundException(error.message);
        }
        if (error.message.includes('invalid input syntax for type uuid')) {
          throw new BadRequestException('잘못된 UUID 형식입니다.');
        }
      }
      throw error;
    }
  }

  /**
   * 공지사항 팝업을 생성한다
   */
  @CreateAnnouncementPopup()
  async createAnnouncementPopup(
    @Body() createDto: CreateAnnouncementPopupDto,
  ): Promise<AnnouncementPopupResponseDto> {
    const result = await this.announcementPopupService.팝업을_생성_한다(
      createDto as any,
    );
    return result.data as unknown as AnnouncementPopupResponseDto;
  }

  /**
   * 공지사항 팝업을 수정한다
   */
  @UpdateAnnouncementPopup()
  async updateAnnouncementPopup(
    @Param('id') id: string,
    @Body() updateDto: UpdateAnnouncementPopupDto,
  ): Promise<AnnouncementPopupResponseDto> {
    try {
      const result = await this.announcementPopupService.팝업을_수정_한다(
        id,
        updateDto as any,
      );
      return result.data as unknown as AnnouncementPopupResponseDto;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('찾을 수 없습니다')) {
          throw new NotFoundException(error.message);
        }
        if (error.message.includes('invalid input syntax for type uuid')) {
          throw new BadRequestException('잘못된 UUID 형식입니다.');
        }
      }
      throw error;
    }
  }

  /**
   * 공지사항 팝업을 삭제한다
   */
  @DeleteAnnouncementPopup()
  async deleteAnnouncementPopup(@Param('id') id: string): Promise<void> {
    try {
      await this.announcementPopupService.팝업을_삭제_한다(id);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('찾을 수 없습니다')) {
          throw new NotFoundException(error.message);
        }
        if (error.message.includes('invalid input syntax for type uuid')) {
          throw new BadRequestException('잘못된 UUID 형식입니다.');
        }
      }
      throw error;
    }
  }
}
