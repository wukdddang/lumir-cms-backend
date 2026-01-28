import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BrochureService } from '@domain/core/brochure/brochure.service';
import { Brochure } from '@domain/core/brochure/brochure.entity';
import { BrochureTranslation } from '@domain/core/brochure/brochure-translation.entity';
import { NotFoundException } from '@nestjs/common';

describe('BrochureService', () => {
  let service: BrochureService;
  let brochureRepository: jest.Mocked<Repository<Brochure>>;
  let translationRepository: jest.Mocked<Repository<BrochureTranslation>>;

  const mockBrochureRepository = {
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
        BrochureService,
        {
          provide: getRepositoryToken(Brochure),
          useValue: mockBrochureRepository,
        },
        {
          provide: getRepositoryToken(BrochureTranslation),
          useValue: mockTranslationRepository,
        },
      ],
    }).compile();

    service = module.get<BrochureService>(BrochureService);
    brochureRepository = module.get(getRepositoryToken(Brochure));
    translationRepository = module.get(getRepositoryToken(BrochureTranslation));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('브로슈어를_생성한다', () => {
    it('브로슈어를 생성해야 한다', async () => {
      // Given
      const createData = {
        isPublic: true,
        order: 0,
        attachments: [],
        createdBy: 'user-1',
      };

      const mockBrochure = {
        id: 'brochure-1',
        ...createData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockBrochureRepository.create.mockReturnValue(mockBrochure as any);
      mockBrochureRepository.save.mockResolvedValue(mockBrochure as any);

      // When
      const result = await service.브로슈어를_생성한다(createData);

      // Then
      expect(brochureRepository.create).toHaveBeenCalledWith(createData);
      expect(brochureRepository.save).toHaveBeenCalledWith(mockBrochure);
      expect(result).toEqual(mockBrochure);
    });

    it('첨부파일이 있는 브로슈어를 생성해야 한다', async () => {
      // Given
      const createData = {
        isPublic: true,
        order: 0,
        attachments: [
          {
            fileName: 'brochure.pdf',
            fileUrl: 'https://s3.aws.com/brochure.pdf',
            fileSize: 1024000,
            mimeType: 'application/pdf',
          },
        ],
        createdBy: 'user-1',
      };

      const mockBrochure = {
        id: 'brochure-1',
        ...createData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockBrochureRepository.create.mockReturnValue(mockBrochure as any);
      mockBrochureRepository.save.mockResolvedValue(mockBrochure as any);

      // When
      const result = await service.브로슈어를_생성한다(createData);

      // Then
      expect(result.attachments).toBeDefined();
      expect(result.attachments).not.toBeNull();
      expect(result.attachments!).toHaveLength(1);
      expect(result.attachments![0]).toMatchObject({
        fileName: 'brochure.pdf',
        fileUrl: 'https://s3.aws.com/brochure.pdf',
      });
    });
  });

  describe('모든_브로슈어를_조회한다', () => {
    it('모든 브로슈어를 조회해야 한다', async () => {
      // Given
      const mockBrochures = [
        {
          id: 'brochure-1',
          isPublic: true,
          order: 0,
        },
        {
          id: 'brochure-2',
          isPublic: true,
          order: 1,
        },
      ];

      const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawAndEntities: jest.fn().mockResolvedValue({
          entities: mockBrochures,
          raw: [
            { brochure_id: 'brochure-1', category_name: '제품 소개' },
            { brochure_id: 'brochure-2', category_name: '제품 소개' },
          ],
        }),
      };

      mockBrochureRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      // When
      const result = await service.모든_브로슈어를_조회한다();

      // Then
      expect(brochureRepository.createQueryBuilder).toHaveBeenCalledWith(
        'brochure',
      );
      expect(mockQueryBuilder.leftJoin).toHaveBeenCalled();
      expect(mockQueryBuilder.addSelect).toHaveBeenCalled();
      expect(result).toEqual(mockBrochures);
    });

    it('공개된 브로슈어만 조회해야 한다', async () => {
      // Given
      const mockBrochures = [
        {
          id: 'brochure-1',
          isPublic: true,
          order: 0,
        },
      ];

      const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawAndEntities: jest.fn().mockResolvedValue({
          entities: mockBrochures,
          raw: [
            { brochure_id: 'brochure-1', category_name: '제품 소개' },
          ],
        }),
      };

      mockBrochureRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      // When
      const result = await service.모든_브로슈어를_조회한다({ isPublic: true });

      // Then
      expect(mockQueryBuilder.leftJoin).toHaveBeenCalled();
      expect(mockQueryBuilder.addSelect).toHaveBeenCalled();
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'brochure.isPublic = :isPublic',
        { isPublic: true },
      );
      expect(result).toEqual(mockBrochures);
    });

    it('생성일 기준으로 정렬해야 한다', async () => {
      // Given
      const mockBrochures = [
        { id: 'brochure-1', createdAt: new Date('2024-01-02') },
        { id: 'brochure-2', createdAt: new Date('2024-01-01') },
      ];

      const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawAndEntities: jest.fn().mockResolvedValue({
          entities: mockBrochures,
          raw: [
            { brochure_id: 'brochure-1', category_name: '제품 소개' },
            { brochure_id: 'brochure-2', category_name: '제품 소개' },
          ],
        }),
      };

      mockBrochureRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      // When
      const result = await service.모든_브로슈어를_조회한다({
        orderBy: 'createdAt',
      });

      // Then
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'brochure.createdAt',
        'DESC',
      );
      expect(result).toEqual(mockBrochures);
    });
  });

  describe('ID로_브로슈어를_조회한다', () => {
    it('ID로 브로슈어를 조회해야 한다', async () => {
      // Given
      const brochureId = 'brochure-1';
      const mockBrochure = {
        id: brochureId,
        isPublic: true,
        order: 0,
        translations: [],
        category: { name: '제품 소개' },
      };

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawAndEntities: jest.fn().mockResolvedValue({
          entities: [mockBrochure],
          raw: [{ category_name: '제품 소개' }],
        }),
      };

      mockBrochureRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      // When
      const result = await service.ID로_브로슈어를_조회한다(brochureId);

      // Then
      expect(brochureRepository.createQueryBuilder).toHaveBeenCalledWith(
        'brochure',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('brochure.id = :id', {
        id: brochureId,
      });
      expect(result).toEqual(mockBrochure);
    });

    it('브로슈어가 존재하지 않으면 NotFoundException을 던져야 한다', async () => {
      // Given
      const brochureId = 'non-existent-id';
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

      mockBrochureRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      // When & Then
      await expect(
        service.ID로_브로슈어를_조회한다(brochureId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('브로슈어를_업데이트한다', () => {
    it('브로슈어를 업데이트해야 한다', async () => {
      // Given
      const brochureId = 'brochure-1';
      const updateData = {
        isPublic: false,
        updatedBy: 'user-1',
      };

      const mockBrochure = {
        id: brochureId,
        isPublic: true,
        order: 0,
        translations: [],
        category: { name: '제품 소개' },
      };

      const mockUpdatedBrochure = {
        ...mockBrochure,
        ...updateData,
      };

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawAndEntities: jest.fn().mockResolvedValue({
          entities: [mockBrochure],
          raw: [{ category_name: '제품 소개' }],
        }),
      };

      mockBrochureRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );
      mockBrochureRepository.save.mockResolvedValue(
        mockUpdatedBrochure as any,
      );

      // When
      const result = await service.브로슈어를_업데이트한다(
        brochureId,
        updateData,
      );

      // Then
      expect(brochureRepository.createQueryBuilder).toHaveBeenCalled();
      expect(brochureRepository.save).toHaveBeenCalled();
      expect(result.isPublic).toBe(false);
    });
  });

  describe('브로슈어를_삭제한다', () => {
    it('브로슈어를 소프트 삭제해야 한다', async () => {
      // Given
      const brochureId = 'brochure-1';
      const mockBrochure = {
        id: brochureId,
        isPublic: true,
        order: 0,
        translations: [],
        category: { name: '제품 소개' },
      };

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawAndEntities: jest.fn().mockResolvedValue({
          entities: [mockBrochure],
          raw: [{ category_name: '제품 소개' }],
        }),
      };

      mockBrochureRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );
      mockBrochureRepository.softRemove.mockResolvedValue(mockBrochure as any);

      // When
      const result = await service.브로슈어를_삭제한다(brochureId);

      // Then
      expect(brochureRepository.createQueryBuilder).toHaveBeenCalled();
      expect(brochureRepository.softRemove).toHaveBeenCalledWith(mockBrochure);
      expect(result).toBe(true);
    });
  });

  describe('브로슈어_공개_여부를_변경한다', () => {
    it('브로슈어 공개 여부를 변경해야 한다', async () => {
      // Given
      const brochureId = 'brochure-1';
      const isPublic = false;
      const updatedBy = 'user-1';

      const mockBrochure = {
        id: brochureId,
        isPublic: true,
        order: 0,
        translations: [],
        category: { name: '제품 소개' },
      };

      const mockUpdatedBrochure = {
        ...mockBrochure,
        isPublic,
        updatedBy,
      };

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawAndEntities: jest.fn().mockResolvedValue({
          entities: [mockBrochure],
          raw: [{ category_name: '제품 소개' }],
        }),
      };

      mockBrochureRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );
      mockBrochureRepository.save.mockResolvedValue(
        mockUpdatedBrochure as any,
      );

      // When
      const result = await service.브로슈어_공개_여부를_변경한다(
        brochureId,
        isPublic,
        updatedBy,
      );

      // Then
      expect(result.isPublic).toBe(false);
      expect(result.updatedBy).toBe(updatedBy);
    });
  });

  describe('다음_순서를_계산한다', () => {
    it('다음 순서 번호를 계산해야 한다', async () => {
      // Given
      const mockBrochures = [{ order: 5 }];
      mockBrochureRepository.find.mockResolvedValue(mockBrochures as any);

      // When
      const result = await service.다음_순서를_계산한다();

      // Then
      expect(brochureRepository.find).toHaveBeenCalledWith({
        order: { order: 'DESC' },
        select: ['order'],
        take: 1,
      });
      expect(result).toBe(6);
    });

    it('브로슈어가 없으면 0을 반환해야 한다', async () => {
      // Given
      mockBrochureRepository.find.mockResolvedValue([]);

      // When
      const result = await service.다음_순서를_계산한다();

      // Then
      expect(result).toBe(0);
    });
  });

  describe('브로슈어_번역을_조회한다', () => {
    it('브로슈어 번역을 조회해야 한다', async () => {
      // Given
      const brochureId = 'brochure-1';
      const mockTranslations = [
        {
          id: 'translation-1',
          brochureId,
          languageId: 'language-1',
          title: '회사 소개',
        },
      ];

      mockTranslationRepository.find.mockResolvedValue(
        mockTranslations as any,
      );

      // When
      const result = await service.브로슈어_번역을_조회한다(brochureId);

      // Then
      expect(translationRepository.find).toHaveBeenCalledWith({
        where: { brochureId },
        relations: ['language'],
      });
      expect(result).toEqual(mockTranslations);
    });
  });

  describe('공개된_브로슈어를_조회한다', () => {
    it('공개된 브로슈어만 조회해야 한다', async () => {
      // Given
      const mockBrochures = [
        {
          id: 'brochure-1',
          isPublic: true,
          order: 0,
          translations: [],
        },
        {
          id: 'brochure-2',
          isPublic: true,
          order: 1,
          translations: [],
        },
      ];

      mockBrochureRepository.find.mockResolvedValue(mockBrochures as any);

      // When
      const result = await service.공개된_브로슈어를_조회한다();

      // Then
      expect(brochureRepository.find).toHaveBeenCalledWith({
        where: { isPublic: true },
        order: { order: 'ASC' },
        relations: ['translations', 'translations.language'],
      });
      expect(result).toEqual(mockBrochures);
    });
  });
});
