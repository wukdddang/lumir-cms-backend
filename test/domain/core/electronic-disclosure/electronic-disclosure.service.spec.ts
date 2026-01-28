import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ElectronicDisclosureService } from '@domain/core/electronic-disclosure/electronic-disclosure.service';
import { ElectronicDisclosure } from '@domain/core/electronic-disclosure/electronic-disclosure.entity';
import { ElectronicDisclosureTranslation } from '@domain/core/electronic-disclosure/electronic-disclosure-translation.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('ElectronicDisclosureService', () => {
  let service: ElectronicDisclosureService;
  let electronicDisclosureRepository: jest.Mocked<Repository<ElectronicDisclosure>>;
  let translationRepository: jest.Mocked<Repository<ElectronicDisclosureTranslation>>;

  const mockElectronicDisclosureRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    softRemove: jest.fn(),
    createQueryBuilder: jest.fn(),
    update: jest.fn(),
  };

  const mockTranslationRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ElectronicDisclosureService,
        {
          provide: getRepositoryToken(ElectronicDisclosure),
          useValue: mockElectronicDisclosureRepository,
        },
        {
          provide: getRepositoryToken(ElectronicDisclosureTranslation),
          useValue: mockTranslationRepository,
        },
      ],
    }).compile();

    service = module.get<ElectronicDisclosureService>(ElectronicDisclosureService);
    electronicDisclosureRepository = module.get(getRepositoryToken(ElectronicDisclosure));
    translationRepository = module.get(getRepositoryToken(ElectronicDisclosureTranslation));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('전자공시를_생성한다', () => {
    it('전자공시를 생성해야 한다', async () => {
      // Given
      const createData = {
        isPublic: true,
        order: 0,
        attachments: null,
        createdBy: 'user-1',
      };

      const mockElectronicDisclosure = {
        id: 'disclosure-1',
        ...createData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockElectronicDisclosureRepository.create.mockReturnValue(mockElectronicDisclosure as any);
      mockElectronicDisclosureRepository.save.mockResolvedValue(mockElectronicDisclosure as any);

      // When
      const result = await service.전자공시를_생성한다(createData);

      // Then
      expect(electronicDisclosureRepository.create).toHaveBeenCalledWith(createData);
      expect(electronicDisclosureRepository.save).toHaveBeenCalledWith(mockElectronicDisclosure);
      expect(result).toEqual(mockElectronicDisclosure);
    });

    it('첨부파일이 있는 전자공시를 생성해야 한다', async () => {
      // Given
      const createData = {
        isPublic: true,
        order: 0,
        attachments: [
          {
            fileName: 'disclosure.pdf',
            fileUrl: 'https://s3.aws.com/disclosure.pdf',
            fileSize: 2048000,
            mimeType: 'application/pdf',
          },
        ],
        createdBy: 'user-1',
      };

      const mockElectronicDisclosure = {
        id: 'disclosure-1',
        ...createData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockElectronicDisclosureRepository.create.mockReturnValue(mockElectronicDisclosure as any);
      mockElectronicDisclosureRepository.save.mockResolvedValue(mockElectronicDisclosure as any);

      // When
      const result = await service.전자공시를_생성한다(createData);

      // Then
      expect(result.attachments).toBeDefined();
      expect(result.attachments).not.toBeNull();
      expect(result.attachments!).toHaveLength(1);
      expect(result.attachments![0]).toMatchObject({
        fileName: 'disclosure.pdf',
        fileUrl: 'https://s3.aws.com/disclosure.pdf',
      });
    });
  });

  describe('모든_전자공시를_조회한다', () => {
    it('모든 전자공시를 조회해야 한다', async () => {
      // Given
      const mockDisclosures = [
        {
          id: 'disclosure-1',
          isPublic: true,
          order: 0,
          category: { name: '실적 공시' },
        },
        {
          id: 'disclosure-2',
          isPublic: true,
          order: 1,
          category: { name: '재무제표' },
        },
      ];

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawAndEntities: jest.fn().mockResolvedValue({
          entities: mockDisclosures,
          raw: [
            { disclosure_id: 'disclosure-1', category_name: '실적 공시' },
            { disclosure_id: 'disclosure-2', category_name: '재무제표' },
          ],
        }),
      };

      mockElectronicDisclosureRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      // When
      const result = await service.모든_전자공시를_조회한다();

      // Then
      expect(electronicDisclosureRepository.createQueryBuilder).toHaveBeenCalled();
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('disclosure.translations', 'translations');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('translations.language', 'language');
      expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith('categories', 'category', 'disclosure.categoryId = category.id');
      expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith(['category.name']);
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('disclosure.order', 'ASC');
      expect(result).toEqual(mockDisclosures);
    });

    it('공개된 전자공시만 조회해야 한다', async () => {
      // Given
      const mockDisclosures = [
        {
          id: 'disclosure-1',
          isPublic: true,
          order: 0,
          category: { name: '실적 공시' },
        },
      ];

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawAndEntities: jest.fn().mockResolvedValue({
          entities: mockDisclosures,
          raw: [{ disclosure_id: 'disclosure-1', category_name: '실적 공시' }],
        }),
      };

      mockElectronicDisclosureRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      // When
      const result = await service.모든_전자공시를_조회한다({ isPublic: true });

      // Then
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('disclosure.translations', 'translations');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('translations.language', 'language');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('disclosure.isPublic = :isPublic', {
        isPublic: true,
      });
      expect(result).toEqual(mockDisclosures);
    });

    it('생성일 기준으로 정렬해야 한다', async () => {
      // Given
      const mockDisclosures = [];
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawAndEntities: jest.fn().mockResolvedValue({
          entities: mockDisclosures,
          raw: [],
        }),
      };

      mockElectronicDisclosureRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      // When
      await service.모든_전자공시를_조회한다({ orderBy: 'createdAt' });

      // Then
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('disclosure.translations', 'translations');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('translations.language', 'language');
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('disclosure.createdAt', 'DESC');
    });

    it('날짜 필터로 조회해야 한다', async () => {
      // Given
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      const mockDisclosures = [];

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawAndEntities: jest.fn().mockResolvedValue({
          entities: mockDisclosures,
          raw: [],
        }),
      };

      mockElectronicDisclosureRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      // When
      await service.모든_전자공시를_조회한다({
        startDate,
        endDate,
      });

      // Then
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('disclosure.translations', 'translations');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('translations.language', 'language');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'disclosure.createdAt >= :startDate',
        { startDate },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'disclosure.createdAt <= :endDate',
        { endDate },
      );
    });
  });

  describe('ID로_전자공시를_조회한다', () => {
    it('전자공시를 조회해야 한다', async () => {
      // Given
      const disclosureId = 'disclosure-1';
      const mockDisclosure = {
        id: disclosureId,
        isPublic: true,
        order: 0,
        translations: [],
        category: { name: '사업보고서' },
      };

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawAndEntities: jest.fn().mockResolvedValue({
          entities: [mockDisclosure],
          raw: [{ disclosure_id: mockDisclosure.id, category_name: '사업보고서' }],
        }),
      };

      mockElectronicDisclosureRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      // When
      const result = await service.ID로_전자공시를_조회한다(disclosureId);

      // Then
      expect(electronicDisclosureRepository.createQueryBuilder).toHaveBeenCalledWith('disclosure');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('disclosure.id = :id', {
        id: disclosureId,
      });
      expect(result).toEqual(mockDisclosure);
    });

    it('전자공시가 없으면 NotFoundException을 던져야 한다', async () => {
      // Given
      const disclosureId = 'non-existent';
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawAndEntities: jest.fn().mockResolvedValue({
          entities: [],
          raw: [],
        }),
      };

      mockElectronicDisclosureRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      // When & Then
      await expect(service.ID로_전자공시를_조회한다(disclosureId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.ID로_전자공시를_조회한다(disclosureId)).rejects.toThrow(
        `전자공시를 찾을 수 없습니다. ID: ${disclosureId}`,
      );
    });
  });

  describe('전자공시를_업데이트한다', () => {
    it('전자공시를 업데이트해야 한다', async () => {
      // Given
      const disclosureId = 'disclosure-1';
      const updateData = {
        isPublic: false,
        updatedBy: 'user-1',
      };

      const mockExistingDisclosure = {
        id: disclosureId,
        isPublic: true,
        order: 0,
        category: { name: '사업보고서' },
      };

      const mockUpdatedDisclosure = {
        ...mockExistingDisclosure,
        ...updateData,
      };

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawAndEntities: jest.fn().mockResolvedValue({
          entities: [mockExistingDisclosure],
          raw: [{ disclosure_id: disclosureId, category_name: '사업보고서' }],
        }),
      };

      mockElectronicDisclosureRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );
      mockElectronicDisclosureRepository.save.mockResolvedValue(
        mockUpdatedDisclosure as any,
      );

      // When
      const result = await service.전자공시를_업데이트한다(disclosureId, updateData);

      // Then
      expect(electronicDisclosureRepository.createQueryBuilder).toHaveBeenCalled();
      expect(electronicDisclosureRepository.save).toHaveBeenCalledWith(
        expect.objectContaining(updateData),
      );
      expect(result).toEqual(mockUpdatedDisclosure);
    });

    it('전자공시의 카테고리를 개별적으로 업데이트해야 한다', async () => {
      // Given
      const disclosureId = 'disclosure-1';
      const newCategoryId = 'category-2';
      const updateData = {
        categoryId: newCategoryId,
        updatedBy: 'user-1',
      };

      const mockExistingDisclosure = {
        id: disclosureId,
        isPublic: true,
        order: 0,
        categoryId: 'category-1',
        category: { name: '기존 카테고리' },
      };

      const mockUpdatedDisclosure = {
        ...mockExistingDisclosure,
        categoryId: newCategoryId,
        category: { name: '새 카테고리' },
      };

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawAndEntities: jest.fn().mockResolvedValue({
          entities: [mockExistingDisclosure],
          raw: [{ disclosure_id: disclosureId, category_name: '기존 카테고리' }],
        }),
      };

      mockElectronicDisclosureRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );
      mockElectronicDisclosureRepository.save.mockResolvedValue(
        mockUpdatedDisclosure as any,
      );

      // When
      const result = await service.전자공시를_업데이트한다(disclosureId, updateData);

      // Then
      expect(electronicDisclosureRepository.createQueryBuilder).toHaveBeenCalled();
      expect(electronicDisclosureRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: disclosureId,
          categoryId: newCategoryId,
          updatedBy: 'user-1',
        }),
      );
      expect(result.categoryId).toBe(newCategoryId);
    });
  });

  describe('전자공시를_삭제한다', () => {
    it('전자공시를 소프트 삭제해야 한다', async () => {
      // Given
      const disclosureId = 'disclosure-1';
      const mockDisclosure = {
        id: disclosureId,
        isPublic: true,
        order: 0,
        category: { name: '사업보고서' },
      };

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawAndEntities: jest.fn().mockResolvedValue({
          entities: [mockDisclosure],
          raw: [{ disclosure_id: mockDisclosure.id, category_name: '사업보고서' }],
        }),
      };

      mockElectronicDisclosureRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );
      mockElectronicDisclosureRepository.softRemove.mockResolvedValue(mockDisclosure as any);

      // When
      const result = await service.전자공시를_삭제한다(disclosureId);

      // Then
      expect(electronicDisclosureRepository.createQueryBuilder).toHaveBeenCalled();
      expect(electronicDisclosureRepository.softRemove).toHaveBeenCalledWith(mockDisclosure);
      expect(result).toBe(true);
    });
  });

  describe('전자공시_공개_여부를_변경한다', () => {
    it('공개 여부를 변경해야 한다', async () => {
      // Given
      const disclosureId = 'disclosure-1';
      const isPublic = false;
      const updatedBy = 'user-1';

      const mockDisclosure = {
        id: disclosureId,
        isPublic,
        updatedBy,
        category: { name: '사업보고서' },
      };

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawAndEntities: jest.fn().mockResolvedValue({
          entities: [{
            id: disclosureId,
            isPublic: true,
          }],
          raw: [{ category_name: '사업보고서' }],
        }),
      };

      mockElectronicDisclosureRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );
      mockElectronicDisclosureRepository.save.mockResolvedValue(mockDisclosure as any);

      // When
      const result = await service.전자공시_공개_여부를_변경한다(
        disclosureId,
        isPublic,
        updatedBy,
      );

      // Then
      expect(electronicDisclosureRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ isPublic, updatedBy }),
      );
      expect(result).toEqual(mockDisclosure);
    });
  });

  describe('다음_순서를_계산한다', () => {
    it('순서를 계산해야 한다', async () => {
      // Given
      const mockDisclosures = [
        {
          order: 5,
        },
      ];

      mockElectronicDisclosureRepository.find.mockResolvedValue(mockDisclosures as any);

      // When
      const result = await service.다음_순서를_계산한다();

      // Then
      expect(electronicDisclosureRepository.find).toHaveBeenCalledWith({
        order: { order: 'DESC' },
        select: ['order'],
        take: 1,
      });
      expect(result).toBe(6);
    });

    it('전자공시가 없으면 0을 반환해야 한다', async () => {
      // Given
      mockElectronicDisclosureRepository.find.mockResolvedValue([]);

      // When
      const result = await service.다음_순서를_계산한다();

      // Then
      expect(result).toBe(0);
    });
  });

  describe('전자공시_번역을_조회한다', () => {
    it('전자공시의 번역을 조회해야 한다', async () => {
      // Given
      const disclosureId = 'disclosure-1';
      const mockTranslations = [
        {
          id: 'translation-1',
          electronicDisclosureId: disclosureId,
          languageId: 'language-1',
          title: '전자공시 제목',
        },
      ];

      mockTranslationRepository.find.mockResolvedValue(mockTranslations as any);

      // When
      const result = await service.전자공시_번역을_조회한다(disclosureId);

      // Then
      expect(translationRepository.find).toHaveBeenCalledWith({
        where: { electronicDisclosureId: disclosureId },
        relations: ['language'],
      });
      expect(result).toEqual(mockTranslations);
    });
  });

  describe('공개된_전자공시를_조회한다', () => {
    it('공개된 전자공시만 조회해야 한다', async () => {
      // Given
      const mockDisclosures = [
        {
          id: 'disclosure-1',
          isPublic: true,
        },
        {
          id: 'disclosure-2',
          isPublic: true,
        },
      ];

      mockElectronicDisclosureRepository.find.mockResolvedValue(mockDisclosures as any);

      // When
      const result = await service.공개된_전자공시를_조회한다();

      // Then
      expect(electronicDisclosureRepository.find).toHaveBeenCalledWith({
        where: { isPublic: true },
        order: { order: 'ASC' },
        relations: ['translations', 'translations.language'],
      });
      expect(result).toEqual(mockDisclosures);
    });
  });

  describe('전자공시_번역을_생성한다', () => {
    it('여러 번역을 생성해야 한다', async () => {
      // Given
      const disclosureId = 'disclosure-1';
      const translations = [
        {
          languageId: 'language-1',
          title: '전자공시 제목',
          description: '설명',
          isSynced: false,
        },
        {
          languageId: 'language-2',
          title: 'Electronic Disclosure Title',
          description: 'Description',
          isSynced: true,
        },
      ];
      const createdBy = 'user-1';

      const mockTranslation = {
        id: 'translation-1',
        electronicDisclosureId: disclosureId,
      };

      mockTranslationRepository.create.mockReturnValue(mockTranslation as any);
      mockTranslationRepository.save.mockResolvedValue(mockTranslation as any);

      // When
      await service.전자공시_번역을_생성한다(disclosureId, translations, createdBy);

      // Then
      expect(translationRepository.create).toHaveBeenCalledTimes(2);
      expect(translationRepository.save).toHaveBeenCalledTimes(2);
      expect(translationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          electronicDisclosureId: disclosureId,
          languageId: 'language-1',
          title: '전자공시 제목',
          isSynced: false,
          createdBy,
        }),
      );
    });
  });

  describe('전자공시_번역을_업데이트한다', () => {
    it('번역을 업데이트해야 한다', async () => {
      // Given
      const translationId = 'translation-1';
      const updateData = {
        title: '수정된 제목',
        description: '수정된 설명',
        updatedBy: 'user-1',
      };

      mockTranslationRepository.update.mockResolvedValue({ affected: 1 } as any);

      // When
      await service.전자공시_번역을_업데이트한다(translationId, updateData);

      // Then
      expect(translationRepository.update).toHaveBeenCalledWith(
        translationId,
        updateData,
      );
    });
  });

  describe('전자공시_오더를_일괄_업데이트한다', () => {
    it('여러 전자공시의 순서를 업데이트해야 한다', async () => {
      // Given
      const items = [
        { id: 'disclosure-1', order: 0 },
        { id: 'disclosure-2', order: 1 },
      ];
      const updatedBy = 'user-1';

      const mockDisclosures = [
        { id: 'disclosure-1', order: 2 },
        { id: 'disclosure-2', order: 3 },
      ];

      mockElectronicDisclosureRepository.find.mockResolvedValue(mockDisclosures as any);
      mockElectronicDisclosureRepository.save.mockResolvedValue({} as any);

      // When
      const result = await service.전자공시_오더를_일괄_업데이트한다(items, updatedBy);

      // Then
      expect(electronicDisclosureRepository.find).toHaveBeenCalledWith({
        where: { id: expect.anything() },
      });
      expect(electronicDisclosureRepository.save).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        success: true,
        updatedCount: 2,
      });
    });

    it('빈 배열이면 BadRequestException을 던져야 한다', async () => {
      // Given
      const items = [];

      // When & Then
      await expect(
        service.전자공시_오더를_일괄_업데이트한다(items),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.전자공시_오더를_일괄_업데이트한다(items),
      ).rejects.toThrow('수정할 전자공시가 없습니다.');
    });

    it('존재하지 않는 ID가 있으면 NotFoundException을 던져야 한다', async () => {
      // Given
      const items = [
        { id: 'disclosure-1', order: 0 },
        { id: 'non-existent', order: 1 },
      ];

      mockElectronicDisclosureRepository.find.mockResolvedValue([
        { id: 'disclosure-1', order: 0 },
      ] as any);

      // When & Then
      await expect(
        service.전자공시_오더를_일괄_업데이트한다(items),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
