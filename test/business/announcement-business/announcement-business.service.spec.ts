import { Test, TestingModule } from '@nestjs/testing';
import { AnnouncementBusinessService } from '@business/announcement-business/announcement-business.service';
import { AnnouncementContextService } from '@context/announcement-context/announcement-context.service';
import { SurveyContextService } from '@context/survey-context/survey-context.service';
import { CompanyContextService } from '@context/company-context/company-context.service';
import { CategoryService } from '@domain/common/category/category.service';
import { SsoService } from '@domain/common/sso/sso.service';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AnnouncementRead } from '@domain/core/announcement/announcement-read.entity';
import { AnnouncementPermissionLog } from '@domain/core/announcement/announcement-permission-log.entity';
import { Survey } from '@domain/sub/survey/survey.entity';
import { SurveyCompletion } from '@domain/sub/survey/survey-completion.entity';
import { Announcement } from '@domain/core/announcement/announcement.entity';

describe('AnnouncementBusinessService', () => {
  let service: AnnouncementBusinessService;
  let announcementContextService: jest.Mocked<AnnouncementContextService>;
  let surveyContextService: jest.Mocked<SurveyContextService>;
  let companyContextService: jest.Mocked<CompanyContextService>;
  let categoryService: jest.Mocked<CategoryService>;

  const mockAnnouncementContextService = {
    공지사항을_생성한다: jest.fn(),
    공지사항을_수정한다: jest.fn(),
    공지사항을_삭제한다: jest.fn(),
    공지사항을_조회한다: jest.fn(),
    공지사항_목록을_조회한다: jest.fn(),
    공지사항_공개를_수정한다: jest.fn(),
    공지사항_고정을_수정한다: jest.fn(),
    공지사항_오더를_일괄_수정한다: jest.fn(),
  };

  const mockSurveyContextService = {
    설문조사를_생성한다: jest.fn(),
    설문조사를_수정한다: jest.fn(),
    설문조사를_삭제한다: jest.fn(),
    공지사항의_설문조사를_조회한다: jest.fn(),
  };

  const mockCompanyContextService = {
    조직_정보를_가져온다: jest.fn(),
    부서_정보를_가져온다: jest.fn(),
    직급_정보를_가져온다: jest.fn(),
    직책_정보를_가져온다: jest.fn(),
  };

  const mockCategoryService = {
    카테고리_목록을_조회한다: jest.fn(),
    엔티티_타입별_카테고리를_조회한다: jest.fn(),
    카테고리를_생성한다: jest.fn(),
    카테고리를_업데이트한다: jest.fn(),
    카테고리를_수정한다: jest.fn(),
    카테고리를_삭제한다: jest.fn(),
    카테고리_오더를_변경한다: jest.fn(),
  };

  const mockSsoService = {
    FCM_토큰을_조회한다: jest.fn(),
  };

  const mockAnnouncementReadRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  };

  const mockAnnouncementPermissionLogRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  };

  const mockSurveyRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockSurveyCompletionRepository = {
    find: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'SSO_BASE_URL') return 'http://test-sso.com';
      if (key === 'NOTIFICATION_API_URL') return 'http://test-notification.com';
      return null;
    }),
  };

  const mockDataSource = {
    createQueryRunner: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnnouncementBusinessService,
        {
          provide: AnnouncementContextService,
          useValue: mockAnnouncementContextService,
        },
        {
          provide: SurveyContextService,
          useValue: mockSurveyContextService,
        },
        {
          provide: CompanyContextService,
          useValue: mockCompanyContextService,
        },
        {
          provide: CategoryService,
          useValue: mockCategoryService,
        },
        {
          provide: SsoService,
          useValue: mockSsoService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: getRepositoryToken(AnnouncementRead),
          useValue: mockAnnouncementReadRepository,
        },
        {
          provide: getRepositoryToken(AnnouncementPermissionLog),
          useValue: mockAnnouncementPermissionLogRepository,
        },
        {
          provide: getRepositoryToken(Survey),
          useValue: mockSurveyRepository,
        },
        {
          provide: getRepositoryToken(SurveyCompletion),
          useValue: mockSurveyCompletionRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<AnnouncementBusinessService>(
      AnnouncementBusinessService,
    );
    announcementContextService = module.get(AnnouncementContextService);
    surveyContextService = module.get(SurveyContextService);
    companyContextService = module.get(CompanyContextService);
    categoryService = module.get(CategoryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('공지사항_목록을_조회한다', () => {
    it('컨텍스트 서비스를 호출하여 목록을 조회해야 한다', async () => {
      // Given
      const params = {
        isPublic: true,
        isFixed: false,
        orderBy: 'order' as const,
        page: 1,
        limit: 10,
      };

      const mockResult = {
        items: [
          {
            id: 'announcement-1',
            categoryId: 'cat-1',
            category: { name: '일반 공지' },
            title: '테스트 공지',
            content: '테스트 내용',
            isFixed: false,
            isPublic: true,
            mustRead: false,
            order: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
            survey: null,
          } as Announcement,
        ],
        total: 1,
        page: 1,
        limit: 10,
      };

      mockAnnouncementContextService.공지사항_목록을_조회한다.mockResolvedValue(
        mockResult,
      );

      // When
      const result = await service.공지사항_목록을_조회한다(params);

      // Then
      expect(
        announcementContextService.공지사항_목록을_조회한다,
      ).toHaveBeenCalledWith(params);
      expect(result.items[0].categoryName).toBe('일반 공지');
      expect(result.total).toBe(1);
    });
  });

  describe('공지사항_전체_목록을_조회한다', () => {
    it('limit을 10000으로 설정하여 전체 목록을 조회해야 한다', async () => {
      // Given
      const mockResult = {
        items: [
          { 
            id: 'announcement-1',
            categoryId: 'cat-1',
            category: { name: '일반 공지' },
            title: '공지1',
            isFixed: false,
            isPublic: true,
            mustRead: false,
            order: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
            survey: null,
          } as Announcement,
          { 
            id: 'announcement-2',
            categoryId: 'cat-2',
            category: { name: '긴급 공지' },
            title: '공지2',
            isFixed: false,
            isPublic: true,
            mustRead: false,
            order: 2,
            createdAt: new Date(),
            updatedAt: new Date(),
            survey: null,
          } as Announcement,
        ],
        total: 2,
        page: 1,
        limit: 10000,
      };

      mockAnnouncementContextService.공지사항_목록을_조회한다.mockResolvedValue(
        mockResult,
      );

      // When
      const result = await service.공지사항_전체_목록을_조회한다();

      // Then
      expect(
        announcementContextService.공지사항_목록을_조회한다,
      ).toHaveBeenCalledWith({
        limit: 10000,
      });
      expect(result.length).toBe(2);
      expect(result[0].categoryName).toBe('일반 공지');
      expect(result[1].categoryName).toBe('긴급 공지');
    });
  });

  describe('공지사항을_조회한다', () => {
    it('컨텍스트 서비스를 호출하여 공지사항을 조회해야 한다', async () => {
      // Given
      const announcementId = 'announcement-1';
      const mockAnnouncement = {
        id: announcementId,
        title: '테스트 공지',
        content: '테스트 내용',
        categoryId: 'category-1',
        category: {
          name: '일반 공지',
        },
      } as Announcement;

      mockAnnouncementContextService.공지사항을_조회한다.mockResolvedValue(
        mockAnnouncement,
      );

      // When
      const result = await service.공지사항을_조회한다(announcementId);

      // Then
      expect(
        announcementContextService.공지사항을_조회한다,
      ).toHaveBeenCalledWith(announcementId);
      expect(result).toHaveProperty('categoryId', 'category-1');
      expect(result).toHaveProperty('categoryName', '일반 공지');
      expect(result).not.toHaveProperty('category');
    });
  });

  describe('공지사항을_생성한다', () => {
    it('컨텍스트 서비스를 호출하여 공지사항을 생성해야 한다', async () => {
      // Given
      const createDto = {
        title: '새 공지사항',
        content: '새 내용',
        isPublic: true,
        isFixed: false,
        mustRead: false,
        createdBy: 'user-1',
      };

      const mockCreateResult = {
        id: 'new-announcement-1',
      };

      const mockDetailAnnouncement = {
        id: 'new-announcement-1',
        ...createDto,
      } as any;

      mockAnnouncementContextService.공지사항을_생성한다.mockResolvedValue(
        mockCreateResult as any,
      );
      mockAnnouncementContextService.공지사항을_조회한다.mockResolvedValue(
        mockDetailAnnouncement,
      );

      // When
      const result = await service.공지사항을_생성한다(createDto);

      // Then
      expect(
        announcementContextService.공지사항을_생성한다,
      ).toHaveBeenCalledWith(createDto);
      expect(
        announcementContextService.공지사항을_조회한다,
      ).toHaveBeenCalledWith('new-announcement-1');
      expect(result).toEqual(mockDetailAnnouncement);
    });
  });

  describe('공지사항을_수정한다', () => {
    it('컨텍스트 서비스를 호출하여 공지사항을 수정해야 한다', async () => {
      // Given
      const announcementId = 'announcement-1';
      const updateDto = {
        categoryId: 'category-1',
        title: '수정된 제목',
        updatedBy: 'user-1',
      };

      const mockUpdatedAnnouncement = {
        id: announcementId,
        ...updateDto,
      } as Announcement;

      mockAnnouncementContextService.공지사항을_수정한다.mockResolvedValue(
        mockUpdatedAnnouncement,
      );

      // When
      const result = await service.공지사항을_수정한다(
        announcementId,
        updateDto,
      );

      // Then
      expect(
        announcementContextService.공지사항을_수정한다,
      ).toHaveBeenCalledWith(announcementId, updateDto);
      expect(result).toEqual(mockUpdatedAnnouncement);
    });
  });

  describe('공지사항_공개를_수정한다', () => {
    it('컨텍스트 서비스를 호출하여 공개 상태를 수정해야 한다', async () => {
      // Given
      const announcementId = 'announcement-1';
      const isPublic = true;
      const updatedBy = 'user-1';

      const mockUpdatedAnnouncement = {
        id: announcementId,
        isPublic,
      } as Announcement;

      mockAnnouncementContextService.공지사항_공개를_수정한다.mockResolvedValue(
        mockUpdatedAnnouncement,
      );

      // When
      const result = await service.공지사항_공개를_수정한다(
        announcementId,
        isPublic,
        updatedBy,
      );

      // Then
      expect(
        announcementContextService.공지사항_공개를_수정한다,
      ).toHaveBeenCalledWith(announcementId, { isPublic, updatedBy });
      expect(result).toEqual(mockUpdatedAnnouncement);
    });
  });

  describe('공지사항_고정을_수정한다', () => {
    it('컨텍스트 서비스를 호출하여 고정 상태를 수정해야 한다', async () => {
      // Given
      const announcementId = 'announcement-1';
      const isFixed = true;
      const updatedBy = 'user-1';

      const mockUpdatedAnnouncement = {
        id: announcementId,
        isFixed,
      } as Announcement;

      mockAnnouncementContextService.공지사항_고정을_수정한다.mockResolvedValue(
        mockUpdatedAnnouncement,
      );

      // When
      const result = await service.공지사항_고정을_수정한다(
        announcementId,
        isFixed,
        updatedBy,
      );

      // Then
      expect(
        announcementContextService.공지사항_고정을_수정한다,
      ).toHaveBeenCalledWith(announcementId, { isFixed, updatedBy });
      expect(result).toEqual(mockUpdatedAnnouncement);
    });
  });

  describe('공지사항을_삭제한다', () => {
    it('컨텍스트 서비스를 호출하여 공지사항을 삭제해야 한다', async () => {
      // Given
      const announcementId = 'announcement-1';
      mockAnnouncementContextService.공지사항을_삭제한다.mockResolvedValue(
        true,
      );

      // When
      const result = await service.공지사항을_삭제한다(announcementId);

      // Then
      expect(
        announcementContextService.공지사항을_삭제한다,
      ).toHaveBeenCalledWith(announcementId);
      expect(result).toBe(true);
    });
  });

  describe('공지사항_오더를_일괄_수정한다', () => {
    it('컨텍스트 서비스를 호출하여 순서를 일괄 수정해야 한다', async () => {
      // Given
      const announcements = [
        { id: 'announcement-1', order: 0 },
        { id: 'announcement-2', order: 1 },
      ];
      const updatedBy = 'user-1';

      const mockResult = { success: true, updatedCount: 2 };
      mockAnnouncementContextService.공지사항_오더를_일괄_수정한다.mockResolvedValue(
        mockResult,
      );

      // When
      const result = await service.공지사항_오더를_일괄_수정한다(
        announcements,
        updatedBy,
      );

      // Then
      expect(
        announcementContextService.공지사항_오더를_일괄_수정한다,
      ).toHaveBeenCalledWith({
        announcements,
        updatedBy,
      });
      expect(result).toEqual(mockResult);
    });
  });

  describe('공지사항_카테고리_목록을_조회한다', () => {
    it('카테고리 서비스를 호출하여 목록을 조회해야 한다', async () => {
      // Given
      const mockCategories = [
        { id: 'category-1', name: '인사', entityType: 'announcement' },
        { id: 'category-2', name: '총무', entityType: 'announcement' },
      ];

      mockCategoryService.엔티티_타입별_카테고리를_조회한다.mockResolvedValue(
        mockCategories as any,
      );

      // When
      const result = await service.공지사항_카테고리_목록을_조회한다();

      // Then
      expect(
        categoryService.엔티티_타입별_카테고리를_조회한다,
      ).toHaveBeenCalledWith('announcement', false);
      expect(result).toEqual(mockCategories);
    });
  });

  describe('공지사항_카테고리를_생성한다', () => {
    it('카테고리 서비스를 호출하여 카테고리를 생성해야 한다', async () => {
      // Given
      const createDto = {
        name: '새 카테고리',
        description: '카테고리 설명',
        isActive: true,
        order: 5,
        createdBy: 'user-1',
      };

      const mockCreatedCategory = {
        id: 'new-category-1',
        ...createDto,
        entityType: 'announcement',
      };

      mockCategoryService.카테고리를_생성한다.mockResolvedValue(
        mockCreatedCategory as any,
      );

      // When
      const result = await service.공지사항_카테고리를_생성한다(createDto);

      // Then
      expect(categoryService.카테고리를_생성한다).toHaveBeenCalledWith({
        entityType: 'announcement',
        name: createDto.name,
        description: createDto.description,
        isActive: createDto.isActive,
        order: createDto.order,
        createdBy: createDto.createdBy,
      });
      expect(result).toEqual(mockCreatedCategory);
    });
  });
});
