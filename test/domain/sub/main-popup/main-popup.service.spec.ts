import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { MainPopupService } from '@domain/sub/main-popup/main-popup.service';
import { MainPopup } from '@domain/sub/main-popup/main-popup.entity';
import { MainPopupTranslation } from '@domain/sub/main-popup/main-popup-translation.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('MainPopupService', () => {
  let service: MainPopupService;
  let mainPopupRepository: jest.Mocked<Repository<MainPopup>>;
  let translationRepository: jest.Mocked<Repository<MainPopupTranslation>>;

  const mockMainPopupRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    softRemove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockTranslationRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MainPopupService,
        {
          provide: getRepositoryToken(MainPopup),
          useValue: mockMainPopupRepository,
        },
        {
          provide: getRepositoryToken(MainPopupTranslation),
          useValue: mockTranslationRepository,
        },
      ],
    }).compile();

    service = module.get<MainPopupService>(MainPopupService);
    mainPopupRepository = module.get(getRepositoryToken(MainPopup));
    translationRepository = module.get(getRepositoryToken(MainPopupTranslation));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('메인_팝업을_생성한다', () => {
    it('메인 팝업을 생성해야 한다', async () => {
      // Given
      const createData = {
        isPublic: true,
        order: 0,
        categoryId: 'category-1',
        attachments: null,
        createdBy: 'user-1',
      };

      const mockPopup = {
        id: 'popup-1',
        ...createData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockMainPopupRepository.create.mockReturnValue(mockPopup as any);
      mockMainPopupRepository.save.mockResolvedValue(mockPopup as any);

      // When
      const result = await service.메인_팝업을_생성한다(createData);

      // Then
      expect(mainPopupRepository.create).toHaveBeenCalledWith(createData);
      expect(mainPopupRepository.save).toHaveBeenCalledWith(mockPopup);
      expect(result).toEqual(mockPopup);
    });

    it('첨부파일이 있는 메인 팝업을 생성해야 한다', async () => {
      // Given
      const createData = {
        isPublic: true,
        order: 0,
        categoryId: 'category-1',
        attachments: [
          {
            fileName: 'popup.jpg',
            fileUrl: 'https://s3.aws.com/popup.jpg',
            fileSize: 1024000,
            mimeType: 'image/jpeg',
          },
        ],
        createdBy: 'user-1',
      };

      const mockPopup = {
        id: 'popup-1',
        ...createData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockMainPopupRepository.create.mockReturnValue(mockPopup as any);
      mockMainPopupRepository.save.mockResolvedValue(mockPopup as any);

      // When
      const result = await service.메인_팝업을_생성한다(createData);

      // Then
      expect(result.attachments).toEqual(createData.attachments);
    });

    it('카테고리 ID와 함께 메인 팝업을 생성해야 한다', async () => {
      // Given
      const createData = {
        isPublic: true,
        order: 0,
        categoryId: 'category-1',
        attachments: null,
        createdBy: 'user-1',
      };

      const mockPopup = {
        id: 'popup-1',
        ...createData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockMainPopupRepository.create.mockReturnValue(mockPopup as any);
      mockMainPopupRepository.save.mockResolvedValue(mockPopup as any);

      // When
      const result = await service.메인_팝업을_생성한다(createData);

      // Then
      expect(mainPopupRepository.create).toHaveBeenCalledWith(createData);
      expect(result.categoryId).toBe('category-1');
    });
  });

  describe('모든_메인_팝업을_조회한다', () => {
    it('모든 메인 팝업을 order 순으로 조회해야 한다', async () => {
      // Given
      const mockPopups = [
        { id: 'popup-1', order: 0, isPublic: true, category: { name: '공지사항' } } as MainPopup,
        { id: 'popup-2', order: 1, isPublic: true, category: { name: '이벤트' } } as MainPopup,
      ];

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawAndEntities: jest.fn().mockResolvedValue({
          entities: mockPopups,
          raw: [
            { category_name: '공지사항' },
            { category_name: '이벤트' },
          ],
        }),
      };

      mockMainPopupRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      // When
      const result = await service.모든_메인_팝업을_조회한다({
        orderBy: 'order',
      });

      // Then
      expect(mainPopupRepository.createQueryBuilder).toHaveBeenCalledWith(
        'popup',
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'popup.translations',
        'translations',
      );
      expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith('categories', 'category', 'popup.categoryId = category.id');
      expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith(['category.name']);
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'popup.order',
        'ASC',
      );
      expect(result).toEqual(mockPopups);
    });

    it('공개된 메인 팝업만 조회해야 한다', async () => {
      // Given
      const mockPopups = [
        { id: 'popup-1', isPublic: true, category: { name: '공지사항' } } as MainPopup,
      ];

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawAndEntities: jest.fn().mockResolvedValue({
          entities: mockPopups,
          raw: [{ category_name: '공지사항' }],
        }),
      };

      mockMainPopupRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      // When
      const result = await service.모든_메인_팝업을_조회한다({
        isPublic: true,
      });

      // Then
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'popup.isPublic = :isPublic',
        { isPublic: true },
      );
      expect(result).toEqual(mockPopups);
    });

    it('날짜 범위로 메인 팝업을 조회해야 한다', async () => {
      // Given
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      const mockPopups = [
        { id: 'popup-1', createdAt: new Date('2024-06-01'), category: { name: '공지사항' } } as MainPopup,
      ];

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawAndEntities: jest.fn().mockResolvedValue({
          entities: mockPopups,
          raw: [{ category_name: '공지사항' }],
        }),
      };

      mockMainPopupRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      // When
      const result = await service.모든_메인_팝업을_조회한다({
        startDate,
        endDate,
      });

      // Then
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'popup.createdAt >= :startDate',
        { startDate },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'popup.createdAt <= :endDate',
        { endDate },
      );
      expect(result).toEqual(mockPopups);
    });
  });

  describe('ID로_메인_팝업을_조회한다', () => {
    it('ID로 메인 팝업을 조회해야 한다', async () => {
      // Given
      const popupId = 'popup-1';
      const mockPopup = {
        id: popupId,
        isPublic: true,
        translations: [],
      } as any as MainPopup;

      mockMainPopupRepository.findOne.mockResolvedValue(mockPopup);

      // When
      const result = await service.ID로_메인_팝업을_조회한다(popupId);

      // Then
      expect(mainPopupRepository.findOne).toHaveBeenCalledWith({
        where: { id: popupId },
        relations: ['translations', 'translations.language'],
      });
      expect(result).toEqual(mockPopup);
    });

    it('존재하지 않는 ID로 조회 시 NotFoundException을 던져야 한다', async () => {
      // Given
      const popupId = 'non-existent';
      mockMainPopupRepository.findOne.mockResolvedValue(null);

      // When & Then
      await expect(
        service.ID로_메인_팝업을_조회한다(popupId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('메인_팝업을_업데이트한다', () => {
    it('메인 팝업을 업데이트해야 한다', async () => {
      // Given
      const popupId = 'popup-1';
      const updateData = {
        isPublic: false,
        order: 5,
      };

      const existingPopup = {
        id: popupId,
        isPublic: true,
        order: 0,
      } as MainPopup;

      const updatedPopup = {
        ...existingPopup,
        ...updateData,
      } as MainPopup;

      mockMainPopupRepository.findOne.mockResolvedValue(existingPopup);
      mockMainPopupRepository.save.mockResolvedValue(updatedPopup);

      // When
      const result = await service.메인_팝업을_업데이트한다(
        popupId,
        updateData,
      );

      // Then
      expect(mainPopupRepository.findOne).toHaveBeenCalled();
      expect(mainPopupRepository.save).toHaveBeenCalledWith(
        expect.objectContaining(updateData),
      );
      expect(result).toEqual(updatedPopup);
    });

    it('카테고리 ID를 업데이트해야 한다', async () => {
      // Given
      const popupId = 'popup-1';
      const updateData = {
        categoryId: 'category-2',
      };

      const existingPopup = {
        id: popupId,
        isPublic: true,
        order: 0,
        categoryId: 'category-1',
      } as MainPopup;

      const updatedPopup = {
        ...existingPopup,
        ...updateData,
      } as MainPopup;

      mockMainPopupRepository.findOne.mockResolvedValue(existingPopup);
      mockMainPopupRepository.save.mockResolvedValue(updatedPopup);

      // When
      const result = await service.메인_팝업을_업데이트한다(
        popupId,
        updateData,
      );

      // Then
      expect(mainPopupRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ categoryId: 'category-2' }),
      );
      expect(result.categoryId).toBe('category-2');
    });
  });

  describe('메인_팝업을_삭제한다', () => {
    it('메인 팝업을 soft delete 해야 한다', async () => {
      // Given
      const popupId = 'popup-1';
      const mockPopup = {
        id: popupId,
        isPublic: true,
      } as MainPopup;

      mockMainPopupRepository.findOne.mockResolvedValue(mockPopup);
      mockMainPopupRepository.softRemove.mockResolvedValue(mockPopup);

      // When
      const result = await service.메인_팝업을_삭제한다(popupId);

      // Then
      expect(mainPopupRepository.findOne).toHaveBeenCalled();
      expect(mainPopupRepository.softRemove).toHaveBeenCalledWith(mockPopup);
      expect(result).toBe(true);
    });
  });

  describe('메인_팝업_공개_여부를_변경한다', () => {
    it('공개 여부를 변경해야 한다', async () => {
      // Given
      const popupId = 'popup-1';
      const isPublic = false;
      const updatedBy = 'user-1';

      const existingPopup = {
        id: popupId,
        isPublic: true,
      } as MainPopup;

      const updatedPopup = {
        ...existingPopup,
        isPublic,
        updatedBy,
      } as MainPopup;

      mockMainPopupRepository.findOne.mockResolvedValue(existingPopup);
      mockMainPopupRepository.save.mockResolvedValue(updatedPopup);

      // When
      const result = await service.메인_팝업_공개_여부를_변경한다(
        popupId,
        isPublic,
        updatedBy,
      );

      // Then
      expect(result.isPublic).toBe(isPublic);
    });
  });

  describe('다음_순서를_계산한다', () => {
    it('기존 팝업이 없을 때 0을 반환해야 한다', async () => {
      // Given
      mockMainPopupRepository.find.mockResolvedValue([]);

      // When
      const result = await service.다음_순서를_계산한다();

      // Then
      expect(result).toBe(0);
    });

    it('기존 팝업이 있을 때 최대값+1을 반환해야 한다', async () => {
      // Given
      const mockPopups = [{ order: 5 } as MainPopup];
      mockMainPopupRepository.find.mockResolvedValue(mockPopups);

      // When
      const result = await service.다음_순서를_계산한다();

      // Then
      expect(result).toBe(6);
    });
  });

  describe('메인_팝업_번역을_조회한다', () => {
    it('메인 팝업의 번역을 조회해야 한다', async () => {
      // Given
      const popupId = 'popup-1';
      const mockTranslations = [
        {
          id: 'trans-1',
          mainPopupId: popupId,
          title: '팝업 제목',
        } as MainPopupTranslation,
      ];

      mockTranslationRepository.find.mockResolvedValue(mockTranslations);

      // When
      const result = await service.메인_팝업_번역을_조회한다(popupId);

      // Then
      expect(translationRepository.find).toHaveBeenCalledWith({
        where: { mainPopupId: popupId },
        relations: ['language'],
      });
      expect(result).toEqual(mockTranslations);
    });
  });

  describe('공개된_메인_팝업을_조회한다', () => {
    it('공개된 메인 팝업만 조회해야 한다', async () => {
      // Given
      const mockPopups = [
        { id: 'popup-1', isPublic: true } as MainPopup,
        { id: 'popup-2', isPublic: true } as MainPopup,
      ];

      mockMainPopupRepository.find.mockResolvedValue(mockPopups);

      // When
      const result = await service.공개된_메인_팝업을_조회한다();

      // Then
      expect(mainPopupRepository.find).toHaveBeenCalledWith({
        where: { isPublic: true },
        order: { order: 'ASC' },
        relations: ['translations', 'translations.language'],
      });
      expect(result).toEqual(mockPopups);
    });
  });

  describe('메인_팝업_번역을_생성한다', () => {
    it('메인 팝업 번역을 생성해야 한다', async () => {
      // Given
      const popupId = 'popup-1';
      const translations = [
        {
          languageId: 'lang-1',
          title: '팝업 제목',
          description: '팝업 설명',
          isSynced: false,
        },
      ];
      const createdBy = 'user-1';

      const mockTranslation = {
        id: 'trans-1',
        mainPopupId: popupId,
        ...translations[0],
      } as MainPopupTranslation;

      mockTranslationRepository.create.mockReturnValue(mockTranslation);
      mockTranslationRepository.save.mockResolvedValue(mockTranslation);

      // When
      await service.메인_팝업_번역을_생성한다(
        popupId,
        translations,
        createdBy,
      );

      // Then
      expect(translationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          mainPopupId: popupId,
          languageId: translations[0].languageId,
          title: translations[0].title,
          description: translations[0].description,
          isSynced: false,
          createdBy,
        }),
      );
      expect(translationRepository.save).toHaveBeenCalled();
    });
  });

  describe('메인_팝업_번역을_업데이트한다', () => {
    it('메인 팝업 번역을 업데이트해야 한다', async () => {
      // Given
      const translationId = 'trans-1';
      const updateData = {
        title: '수정된 제목',
        description: '수정된 설명',
        updatedBy: 'user-1',
      };

      const existingTranslation = {
        id: translationId,
        title: '기존 제목',
        description: '기존 설명',
      } as MainPopupTranslation;

      mockTranslationRepository.findOne.mockResolvedValue(
        existingTranslation,
      );
      mockTranslationRepository.save.mockResolvedValue({
        ...existingTranslation,
        ...updateData,
      } as MainPopupTranslation);

      // When
      await service.메인_팝업_번역을_업데이트한다(translationId, updateData);

      // Then
      expect(translationRepository.findOne).toHaveBeenCalledWith({
        where: { id: translationId },
      });
      expect(translationRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          title: updateData.title,
          description: updateData.description,
          updatedBy: updateData.updatedBy,
        }),
      );
    });

    it('존재하지 않는 번역 업데이트 시 NotFoundException을 던져야 한다', async () => {
      // Given
      const translationId = 'non-existent';
      const updateData = { title: '제목' };

      mockTranslationRepository.findOne.mockResolvedValue(null);

      // When & Then
      await expect(
        service.메인_팝업_번역을_업데이트한다(translationId, updateData),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('메인_팝업_오더를_일괄_업데이트한다', () => {
    it('메인 팝업 오더를 일괄 업데이트해야 한다', async () => {
      // Given
      const items = [
        { id: 'popup-1', order: 2 },
        { id: 'popup-2', order: 1 },
      ];
      const updatedBy = 'user-1';

      const existingPopups = [
        { id: 'popup-1', order: 0 } as MainPopup,
        { id: 'popup-2', order: 1 } as MainPopup,
      ];

      mockMainPopupRepository.find.mockResolvedValue(existingPopups);
      mockMainPopupRepository.save.mockImplementation(
        (popup) => Promise.resolve(popup),
      );

      // When
      const result = await service.메인_팝업_오더를_일괄_업데이트한다(
        items,
        updatedBy,
      );

      // Then
      expect(mainPopupRepository.find).toHaveBeenCalledWith({
        where: { id: In(['popup-1', 'popup-2']) },
      });
      expect(result.success).toBe(true);
      expect(result.updatedCount).toBe(2);
    });

    it('빈 배열로 호출 시 BadRequestException을 던져야 한다', async () => {
      // Given
      const items: Array<{ id: string; order: number }> = [];

      // When & Then
      await expect(
        service.메인_팝업_오더를_일괄_업데이트한다(items),
      ).rejects.toThrow(BadRequestException);
    });

    it('잘못된 order 값으로 호출 시 BadRequestException을 던져야 한다', async () => {
      // Given
      const items = [{ id: 'popup-1', order: -1 }];

      // When & Then
      await expect(
        service.메인_팝업_오더를_일괄_업데이트한다(items),
      ).rejects.toThrow(BadRequestException);
    });

    it('존재하지 않는 ID가 있을 때 NotFoundException을 던져야 한다', async () => {
      // Given
      const items = [
        { id: 'popup-1', order: 0 },
        { id: 'non-existent', order: 1 },
      ];

      const existingPopups = [{ id: 'popup-1', order: 0 } as MainPopup];

      mockMainPopupRepository.find.mockResolvedValue(existingPopups);

      // When & Then
      await expect(
        service.메인_팝업_오더를_일괄_업데이트한다(items),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
