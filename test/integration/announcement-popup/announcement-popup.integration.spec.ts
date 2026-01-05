import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnnouncementPopupService } from '@business/announcement-popup/announcement-popup.service';
import { AnnouncementPopup } from '@domain/core/announcement-popup/announcement-popup.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import { DataSource } from 'typeorm';
import { ContentStatus } from '@domain/core/common/types/status.types';
import { LanguageCode, LanguageEnum } from '@domain/core/common/types/language.types';

/**
 * 통합 테스트: Business Layer + Domain Layer
 *
 * @description
 * - 실제 데이터베이스 없이 메모리 DB를 사용하여 통합 테스트
 * - Service와 Entity 간의 상호작용 검증
 * - Repository 패턴 검증
 */
describe('AnnouncementPopup Integration Tests', () => {
  let module: TestingModule;
  let service: AnnouncementPopupService;
  let dataSource: DataSource;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [AnnouncementPopup, Employee],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([AnnouncementPopup, Employee]),
      ],
      providers: [AnnouncementPopupService],
    }).compile();

    service = module.get<AnnouncementPopupService>(AnnouncementPopupService);
    dataSource = module.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    await dataSource.destroy();
    await module.close();
  });

  beforeEach(async () => {
    // 각 테스트 전 데이터 정리
    await dataSource.getRepository(AnnouncementPopup).clear();
    await dataSource.getRepository(Employee).clear();
  });

  describe('팝업 생성 및 조회', () => {
    it('팝업을 생성하고 조회할 수 있어야 한다', async () => {
      // Given: 관리자 생성
      const employeeRepo = dataSource.getRepository(Employee);
      const manager = employeeRepo.create({
        employeeNumber: 'EMP001',
        name: '홍길동',
        email: 'hong@example.com',
        externalId: 'external-001',
        status: '재직중',
      });
      await employeeRepo.save(manager);

      // When: 팝업 생성
      const createData = {
        title: '통합 테스트 팝업',
        status: ContentStatus.DRAFT,
        isPublic: false,
        category: { id: 'cat-001', name: '일반', description: '일반 공지' },
        language: {
          code: LanguageCode.KOREAN,
          label: '한국어',
          name: LanguageEnum.KOREAN,
        },
        managerId: manager.id,
        tags: [],
        attachments: [],
      };

      const createResult = await service.팝업을_생성_한다(createData);

      // Then: 생성 검증
      expect(createResult.success).toBe(true);
      expect(createResult.data).toBeDefined();
      expect(createResult.data?.title).toBe(createData.title);

      // When: 생성된 팝업 조회
      const popupId = createResult.data?.id;
      const getResult = await service.팝업을_조회_한다(popupId!);

      // Then: 조회 검증
      expect(getResult.success).toBe(true);
      expect(getResult.data?.id).toBe(popupId);
      expect(getResult.data?.title).toBe(createData.title);
    });
  });

  describe('팝업 수정', () => {
    it('생성된 팝업을 수정할 수 있어야 한다', async () => {
      // Given: 팝업 생성
      const employeeRepo = dataSource.getRepository(Employee);
      const manager = employeeRepo.create({
        employeeNumber: 'EMP002',
        name: '김철수',
        email: 'kim@example.com',
        externalId: 'external-002',
        status: '재직중',
      });
      await employeeRepo.save(manager);

      const createData = {
        title: '원본 제목',
        status: ContentStatus.DRAFT,
        isPublic: false,
        category: { id: 'cat-001', name: '일반', description: '일반 공지' },
        language: {
          code: LanguageCode.KOREAN,
          label: '한국어',
          name: LanguageEnum.KOREAN,
        },
        managerId: manager.id,
        tags: [],
        attachments: [],
      };

      const createResult = await service.팝업을_생성_한다(createData);
      const popupId = createResult.data?.id!;

      // When: 팝업 수정
      const updateData = {
        title: '수정된 제목',
        isPublic: true,
      };

      const updateResult = await service.팝업을_수정_한다(popupId, updateData);

      // Then: 수정 검증
      expect(updateResult.success).toBe(true);
      expect(updateResult.data?.title).toBe(updateData.title);
      expect(updateResult.data?.isPublic).toBe(updateData.isPublic);
    });
  });

  describe('팝업 삭제 (Soft Delete)', () => {
    it('팝업을 소프트 삭제할 수 있어야 한다', async () => {
      // Given: 팝업 생성
      const employeeRepo = dataSource.getRepository(Employee);
      const manager = employeeRepo.create({
        employeeNumber: 'EMP003',
        name: '이영희',
        email: 'lee@example.com',
        externalId: 'external-003',
        status: '재직중',
      });
      await employeeRepo.save(manager);

      const createData = {
        title: '삭제될 팝업',
        status: ContentStatus.DRAFT,
        isPublic: false,
        category: { id: 'cat-001', name: '일반', description: '일반 공지' },
        language: {
          code: LanguageCode.KOREAN,
          label: '한국어',
          name: LanguageEnum.KOREAN,
        },
        managerId: manager.id,
        tags: [],
        attachments: [],
      };

      const createResult = await service.팝업을_생성_한다(createData);
      const popupId = createResult.data?.id!;

      // When: 팝업 삭제
      const deleteResult = await service.팝업을_삭제_한다(popupId);

      // Then: 삭제 검증
      expect(deleteResult.success).toBe(true);

      // 삭제된 팝업은 조회되지 않아야 함
      try {
        await service.팝업을_조회_한다(popupId);
        fail('삭제된 팝업이 조회되어서는 안 됩니다');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('목록 조회', () => {
    it('여러 팝업을 생성하고 목록을 조회할 수 있어야 한다', async () => {
      // Given: 관리자 및 여러 팝업 생성
      const employeeRepo = dataSource.getRepository(Employee);
      const manager = employeeRepo.create({
        employeeNumber: 'EMP004',
        name: '박민수',
        email: 'park@example.com',
        externalId: 'external-004',
        status: '재직중',
      });
      await employeeRepo.save(manager);

      const baseData = {
        status: ContentStatus.DRAFT,
        isPublic: false,
        category: { id: 'cat-001', name: '일반', description: '일반 공지' },
        language: {
          code: LanguageCode.KOREAN,
          label: '한국어',
          name: LanguageEnum.KOREAN,
        },
        managerId: manager.id,
        tags: [],
        attachments: [],
      };

      await service.팝업을_생성_한다({ ...baseData, title: '팝업 1' });
      await service.팝업을_생성_한다({ ...baseData, title: '팝업 2' });
      await service.팝업을_생성_한다({ ...baseData, title: '팝업 3' });

      // When: 목록 조회
      const listResult = await service.팝업_목록을_조회_한다();

      // Then: 목록 검증
      expect(listResult.success).toBe(true);
      expect(listResult.data).toHaveLength(3);
      expect(listResult.data?.map((p) => p.title)).toEqual([
        '팝업 3',
        '팝업 2',
        '팝업 1',
      ]);
    });
  });
});
