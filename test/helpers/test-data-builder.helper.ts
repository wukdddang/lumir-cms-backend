import { DataSource } from 'typeorm';
import { Employee } from '@domain/common/employee/employee.entity';
import { AnnouncementPopup } from '@domain/core/announcement-popup/announcement-popup.entity';
import { Announcement } from '@domain/core/announcement/announcement.entity';
import {
  EmployeeFixture,
  AnnouncementPopupFixture,
  announcementFixture,
} from '../fixtures';

/**
 * 테스트 데이터를 데이터베이스에 직접 생성하는 헬퍼
 */
export class TestDataBuilder {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * 테스트용 직원을 데이터베이스에 생성한다
   */
  async 직원을_생성한다(partial?: Partial<Employee>): Promise<Employee> {
    const employee = partial
      ? EmployeeFixture.커스텀_직원을_생성한다(partial)
      : EmployeeFixture.기본_직원을_생성한다();

    const repository = this.dataSource.getRepository(Employee);
    return await repository.save(employee);
  }

  /**
   * 테스트용 공지사항 팝업을 데이터베이스에 생성한다
   */
  async 공지사항_팝업을_생성한다(
    partial?: Partial<AnnouncementPopup>,
  ): Promise<AnnouncementPopup> {
    // manager가 제공되지 않으면 새로 생성
    const manager = partial?.manager || (await this.직원을_생성한다());

    const popup = partial
      ? AnnouncementPopupFixture.커스텀_팝업을_생성한다({
          ...partial,
          manager,
        })
      : AnnouncementPopupFixture.초안_팝업을_생성한다();

    popup.manager = manager;

    // ID를 제거하여 데이터베이스가 자동 생성하도록 함
    delete (popup as any).id;

    const repository = this.dataSource.getRepository(AnnouncementPopup);
    return await repository.save(popup);
  }

  /**
   * 여러 공지사항 팝업을 데이터베이스에 생성한다
   */
  async 여러_공지사항_팝업을_생성한다(
    count: number,
  ): Promise<AnnouncementPopup[]> {
    const popups: AnnouncementPopup[] = [];

    // 공통 manager를 한 번만 생성
    const manager = await this.직원을_생성한다();

    for (let i = 0; i < count; i++) {
      const popup = AnnouncementPopupFixture.커스텀_팝업을_생성한다({
        title: `테스트 팝업 ${i + 1}`,
        manager,
      });

      // ID를 고유하게 설정
      popup.id = `550e8400-e29b-41d4-a716-44665544${String(i).padStart(4, '0')}`;

      const repository = this.dataSource.getRepository(AnnouncementPopup);
      const savedPopup = await repository.save(popup);
      popups.push(savedPopup);
    }

    return popups;
  }

  /**
   * 테스트용 공지사항을 데이터베이스에 생성한다
   */
  async createAnnouncement(
    partial?: Partial<Announcement>,
  ): Promise<Announcement> {
    // manager가 제공되지 않으면 새로 생성
    const manager = partial?.manager || (await this.직원을_생성한다());

    const announcement = new Announcement(
      partial?.title || announcementFixture.title,
      partial?.content || announcementFixture.content,
      partial?.isFixed ?? announcementFixture.isFixed,
      partial?.category || announcementFixture.category,
      partial?.releasedAt,
      partial?.expiredAt,
      partial?.mustRead ?? announcementFixture.mustRead,
      manager,
      partial?.status || announcementFixture.status,
      partial?.hits,
      partial?.attachments || announcementFixture.attachments,
      partial?.employees || announcementFixture.employees,
    );

    // ID를 제거하여 데이터베이스가 자동 생성하도록 함
    delete (announcement as any).id;

    const repository = this.dataSource.getRepository(Announcement);
    return await repository.save(announcement);
  }
}

/**
 * TestDataBuilder 팩토리 함수
 */
export function testDataBuilder(dataSource: DataSource): TestDataBuilder {
  return new TestDataBuilder(dataSource);
}
