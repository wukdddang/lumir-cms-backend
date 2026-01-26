import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IRService } from '@domain/core/ir/ir.service';
import { IR } from '@domain/core/ir/ir.entity';
import { IRTranslation } from '@domain/core/ir/ir-translation.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('IRService', () => {
  let service: IRService;
  let irRepository: jest.Mocked<Repository<IR>>;
  let translationRepository: jest.Mocked<Repository<IRTranslation>>;

  const mockIRRepository = {
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
        IRService,
        {
          provide: getRepositoryToken(IR),
          useValue: mockIRRepository,
        },
        {
          provide: getRepositoryToken(IRTranslation),
          useValue: mockTranslationRepository,
        },
      ],
    }).compile();

    service = module.get<IRService>(IRService);
    irRepository = module.get(getRepositoryToken(IR));
    translationRepository = module.get(getRepositoryToken(IRTranslation));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('IR을_생성한다', () => {
    it('IR을 생성해야 한다', async () => {
      // Given
      const createData = {
        isPublic: true,
        order: 0,
        attachments: null,
        createdBy: 'user-1',
      };

      const mockIR = {
        id: 'ir-1',
        ...createData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockIRRepository.create.mockReturnValue(mockIR as any);
      mockIRRepository.save.mockResolvedValue(mockIR as any);

      // When
      const result = await service.IR을_생성한다(createData);

      // Then
      expect(irRepository.create).toHaveBeenCalledWith(createData);
      expect(irRepository.save).toHaveBeenCalledWith(mockIR);
      expect(result).toEqual(mockIR);
    });

    it('첨부파일이 있는 IR을 생성해야 한다', async () => {
      // Given
      const createData = {
        isPublic: true,
        order: 0,
        attachments: [
          {
            fileName: 'ir.pdf',
            fileUrl: 'https://s3.aws.com/ir.pdf',
            fileSize: 2048000,
            mimeType: 'application/pdf',
          },
        ],
        createdBy: 'user-1',
      };

      const mockIR = {
        id: 'ir-1',
        ...createData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockIRRepository.create.mockReturnValue(mockIR as any);
      mockIRRepository.save.mockResolvedValue(mockIR as any);

      // When
      const result = await service.IR을_생성한다(createData);

      // Then
      expect(result.attachments).toBeDefined();
      expect(result.attachments).not.toBeNull();
      expect(result.attachments!).toHaveLength(1);
      expect(result.attachments![0]).toMatchObject({
        fileName: 'ir.pdf',
        fileUrl: 'https://s3.aws.com/ir.pdf',
      });
    });
  });

  describe('모든_IR을_조회한다', () => {
    it('모든 IR을 조회해야 한다', async () => {
      // Given
      const mockIRs = [
        {
          id: 'ir-1',
          isPublic: true,
          order: 0,
          category: { name: '재무정보' },
        },
        {
          id: 'ir-2',
          isPublic: true,
          order: 1,
          category: { name: '경영정보' },
        },
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawAndEntities: jest.fn().mockResolvedValue({
          entities: mockIRs,
          raw: [
            { category_name: '재무정보' },
            { category_name: '경영정보' },
          ],
        }),
      };

      mockIRRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      // When
      const result = await service.모든_IR을_조회한다();

      // Then
      expect(irRepository.createQueryBuilder).toHaveBeenCalled();
      expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith('categories', 'category', 'ir.categoryId = category.id');
      expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith(['category.name']);
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('ir.order', 'ASC');
      expect(result).toEqual(mockIRs);
    });

    it('공개된 IR만 조회해야 한다', async () => {
      // Given
      const mockIRs = [
        {
          id: 'ir-1',
          isPublic: true,
          order: 0,
          category: { name: '재무정보' },
        },
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawAndEntities: jest.fn().mockResolvedValue({
          entities: mockIRs,
          raw: [{ category_name: '재무정보' }],
        }),
      };

      mockIRRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      // When
      const result = await service.모든_IR을_조회한다({ isPublic: true });

      // Then
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('ir.isPublic = :isPublic', {
        isPublic: true,
      });
      expect(result).toEqual(mockIRs);
    });

    it('생성일 기준으로 정렬해야 한다', async () => {
      // Given
      const mockIRs = [];
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawAndEntities: jest.fn().mockResolvedValue({
          entities: mockIRs,
          raw: [],
        }),
      };

      mockIRRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      // When
      await service.모든_IR을_조회한다({ orderBy: 'createdAt' });

      // Then
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('ir.createdAt', 'DESC');
    });

    it('날짜 필터로 조회해야 한다', async () => {
      // Given
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      const mockIRs = [];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawAndEntities: jest.fn().mockResolvedValue({
          entities: mockIRs,
          raw: [],
        }),
      };

      mockIRRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      // When
      await service.모든_IR을_조회한다({
        startDate,
        endDate,
      });

      // Then
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'ir.createdAt >= :startDate',
        { startDate },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'ir.createdAt <= :endDate',
        { endDate },
      );
    });
  });

  describe('ID로_IR을_조회한다', () => {
    it('IR을 조회해야 한다', async () => {
      // Given
      const irId = 'ir-1';
      const mockIR = {
        id: irId,
        isPublic: true,
        order: 0,
        translations: [],
      };

      mockIRRepository.findOne.mockResolvedValue(mockIR as any);

      // When
      const result = await service.ID로_IR을_조회한다(irId);

      // Then
      expect(irRepository.findOne).toHaveBeenCalledWith({
        where: { id: irId },
        relations: ['translations', 'translations.language'],
      });
      expect(result).toEqual(mockIR);
    });

    it('IR이 없으면 NotFoundException을 던져야 한다', async () => {
      // Given
      const irId = 'non-existent';
      mockIRRepository.findOne.mockResolvedValue(null);

      // When & Then
      await expect(service.ID로_IR을_조회한다(irId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.ID로_IR을_조회한다(irId)).rejects.toThrow(
        `IR을 찾을 수 없습니다. ID: ${irId}`,
      );
    });
  });

  describe('IR을_업데이트한다', () => {
    it('IR을 업데이트해야 한다', async () => {
      // Given
      const irId = 'ir-1';
      const updateData = {
        isPublic: false,
        updatedBy: 'user-1',
      };

      const mockExistingIR = {
        id: irId,
        isPublic: true,
        order: 0,
      };

      const mockUpdatedIR = {
        ...mockExistingIR,
        ...updateData,
      };

      mockIRRepository.findOne.mockResolvedValue(mockExistingIR as any);
      mockIRRepository.save.mockResolvedValue(mockUpdatedIR as any);

      // When
      const result = await service.IR을_업데이트한다(irId, updateData);

      // Then
      expect(irRepository.findOne).toHaveBeenCalled();
      expect(irRepository.save).toHaveBeenCalledWith(
        expect.objectContaining(updateData),
      );
      expect(result).toEqual(mockUpdatedIR);
    });
  });

  describe('IR을_삭제한다', () => {
    it('IR을 소프트 삭제해야 한다', async () => {
      // Given
      const irId = 'ir-1';
      const mockIR = {
        id: irId,
        isPublic: true,
        order: 0,
      };

      mockIRRepository.findOne.mockResolvedValue(mockIR as any);
      mockIRRepository.softRemove.mockResolvedValue(mockIR as any);

      // When
      const result = await service.IR을_삭제한다(irId);

      // Then
      expect(irRepository.findOne).toHaveBeenCalled();
      expect(irRepository.softRemove).toHaveBeenCalledWith(mockIR);
      expect(result).toBe(true);
    });
  });

  describe('IR_공개_여부를_변경한다', () => {
    it('공개 여부를 변경해야 한다', async () => {
      // Given
      const irId = 'ir-1';
      const isPublic = false;
      const updatedBy = 'user-1';

      const mockIR = {
        id: irId,
        isPublic,
        updatedBy,
      };

      mockIRRepository.findOne.mockResolvedValue({
        id: irId,
        isPublic: true,
      } as any);
      mockIRRepository.save.mockResolvedValue(mockIR as any);

      // When
      const result = await service.IR_공개_여부를_변경한다(
        irId,
        isPublic,
        updatedBy,
      );

      // Then
      expect(irRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ isPublic, updatedBy }),
      );
      expect(result).toEqual(mockIR);
    });
  });

  describe('다음_순서를_계산한다', () => {
    it('순서를 계산해야 한다', async () => {
      // Given
      const mockIRs = [
        {
          order: 5,
        },
      ];

      mockIRRepository.find.mockResolvedValue(mockIRs as any);

      // When
      const result = await service.다음_순서를_계산한다();

      // Then
      expect(irRepository.find).toHaveBeenCalledWith({
        order: { order: 'DESC' },
        select: ['order'],
        take: 1,
      });
      expect(result).toBe(6);
    });

    it('IR이 없으면 0을 반환해야 한다', async () => {
      // Given
      mockIRRepository.find.mockResolvedValue([]);

      // When
      const result = await service.다음_순서를_계산한다();

      // Then
      expect(result).toBe(0);
    });
  });

  describe('IR_번역을_조회한다', () => {
    it('IR의 번역을 조회해야 한다', async () => {
      // Given
      const irId = 'ir-1';
      const mockTranslations = [
        {
          id: 'translation-1',
          irId: irId,
          languageId: 'language-1',
          title: 'IR 제목',
        },
      ];

      mockTranslationRepository.find.mockResolvedValue(mockTranslations as any);

      // When
      const result = await service.IR_번역을_조회한다(irId);

      // Then
      expect(translationRepository.find).toHaveBeenCalledWith({
        where: { irId: irId },
        relations: ['language'],
      });
      expect(result).toEqual(mockTranslations);
    });
  });

  describe('공개된_IR을_조회한다', () => {
    it('공개된 IR만 조회해야 한다', async () => {
      // Given
      const mockIRs = [
        {
          id: 'ir-1',
          isPublic: true,
        },
        {
          id: 'ir-2',
          isPublic: true,
        },
      ];

      mockIRRepository.find.mockResolvedValue(mockIRs as any);

      // When
      const result = await service.공개된_IR을_조회한다();

      // Then
      expect(irRepository.find).toHaveBeenCalledWith({
        where: { isPublic: true },
        order: { order: 'ASC' },
        relations: ['translations', 'translations.language'],
      });
      expect(result).toEqual(mockIRs);
    });
  });

  describe('IR_번역을_생성한다', () => {
    it('여러 번역을 생성해야 한다', async () => {
      // Given
      const irId = 'ir-1';
      const translations = [
        {
          languageId: 'language-1',
          title: 'IR 제목',
          description: '설명',
          isSynced: false,
        },
        {
          languageId: 'language-2',
          title: 'IR Title',
          description: 'Description',
          isSynced: true,
        },
      ];
      const createdBy = 'user-1';

      const mockTranslation = {
        id: 'translation-1',
        irId: irId,
      };

      mockTranslationRepository.create.mockReturnValue(mockTranslation as any);
      mockTranslationRepository.save.mockResolvedValue(mockTranslation as any);

      // When
      await service.IR_번역을_생성한다(irId, translations, createdBy);

      // Then
      expect(translationRepository.create).toHaveBeenCalledTimes(2);
      expect(translationRepository.save).toHaveBeenCalledTimes(2);
      expect(translationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          irId: irId,
          languageId: 'language-1',
          title: 'IR 제목',
          isSynced: false,
          createdBy,
        }),
      );
    });
  });

  describe('IR_번역을_업데이트한다', () => {
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
      await service.IR_번역을_업데이트한다(translationId, updateData);

      // Then
      expect(translationRepository.update).toHaveBeenCalledWith(
        translationId,
        updateData,
      );
    });
  });

  describe('IR_오더를_일괄_업데이트한다', () => {
    it('여러 IR의 순서를 업데이트해야 한다', async () => {
      // Given
      const items = [
        { id: 'ir-1', order: 0 },
        { id: 'ir-2', order: 1 },
      ];
      const updatedBy = 'user-1';

      const mockIRs = [
        { id: 'ir-1', order: 2 },
        { id: 'ir-2', order: 3 },
      ];

      mockIRRepository.find.mockResolvedValue(mockIRs as any);
      mockIRRepository.save.mockResolvedValue({} as any);

      // When
      const result = await service.IR_오더를_일괄_업데이트한다(items, updatedBy);

      // Then
      expect(irRepository.find).toHaveBeenCalledWith({
        where: { id: expect.anything() },
      });
      expect(irRepository.save).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        success: true,
        updatedCount: 2,
      });
    });

    it('빈 배열이면 에러를 던져야 한다', async () => {
      // Given
      const items = [];

      // When & Then
      await expect(service.IR_오더를_일괄_업데이트한다(items)).rejects.toThrow(
        '수정할 IR이 없습니다.',
      );
    });

    it('존재하지 않는 ID가 있으면 NotFoundException을 던져야 한다', async () => {
      // Given
      const items = [
        { id: 'ir-1', order: 0 },
        { id: 'non-existent', order: 1 },
      ];

      mockIRRepository.find.mockResolvedValue([
        { id: 'ir-1', order: 0 },
      ] as any);

      // When & Then
      await expect(service.IR_오더를_일괄_업데이트한다(items)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
