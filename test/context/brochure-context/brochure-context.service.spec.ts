import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { BrochureContextService } from '@context/brochure-context/brochure-context.service';
import { Brochure } from '@domain/core/brochure/brochure.entity';
import { BrochureTranslation } from '@domain/core/brochure/brochure-translation.entity';

describe('BrochureContextService', () => {
  let service: BrochureContextService;
  let commandBus: jest.Mocked<CommandBus>;
  let queryBus: jest.Mocked<QueryBus>;

  const mockCommandBus = {
    execute: jest.fn(),
  };

  const mockQueryBus = {
    execute: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BrochureContextService,
        {
          provide: CommandBus,
          useValue: mockCommandBus,
        },
        {
          provide: QueryBus,
          useValue: mockQueryBus,
        },
      ],
    }).compile();

    service = module.get<BrochureContextService>(BrochureContextService);
    commandBus = module.get(CommandBus);
    queryBus = module.get(QueryBus);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('브로슈어를_생성한다', () => {
    it('CreateBrochureCommand를 실행해야 한다', async () => {
      // Given
      const createDto = {
        translations: [
          {
            languageId: 'language-1',
            title: '회사 소개 브로슈어',
            description: '루미르 회사 소개서',
          },
        ],
        categoryId: 'category-1',
        createdBy: 'user-1',
      };

      const mockResult = {
        id: 'new-brochure-1',
        isPublic: true,
        order: 0,
        createdAt: new Date(),
      };

      mockCommandBus.execute.mockResolvedValue(mockResult);

      // When
      const result = await service.브로슈어를_생성한다(createDto);

      // Then
      expect(commandBus.execute).toHaveBeenCalledTimes(1);
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          data: createDto,
        }),
      );
      expect(result).toEqual(mockResult);
    });

    it('첨부파일이 있는 브로슈어를 생성해야 한다', async () => {
      // Given
      const createDto = {
        translations: [
          {
            languageId: 'language-1',
            title: '회사 소개 브로슈어',
          },
        ],
        categoryId: 'category-1',
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

      const mockResult = {
        id: 'new-brochure-1',
        isPublic: true,
        order: 0,
        createdAt: new Date(),
      };

      mockCommandBus.execute.mockResolvedValue(mockResult);

      // When
      const result = await service.브로슈어를_생성한다(createDto);

      // Then
      expect(commandBus.execute).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResult);
    });
  });

  describe('브로슈어를_수정한다', () => {
    it('UpdateBrochureCommand를 실행해야 한다', async () => {
      // Given
      const brochureId = 'brochure-1';
      const updateDto = {
        categoryId: 'category-1',
        isPublic: false,
        updatedBy: 'user-1',
      };

      const mockResult = {
        id: brochureId,
        ...updateDto,
      } as any as Brochure;

      mockCommandBus.execute.mockResolvedValue(mockResult);

      // When
      const result = await service.브로슈어를_수정한다(brochureId, updateDto);

      // Then
      expect(commandBus.execute).toHaveBeenCalledTimes(1);
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          id: brochureId,
          data: updateDto,
        }),
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('브로슈어를_삭제한다', () => {
    it('DeleteBrochureCommand를 실행해야 한다', async () => {
      // Given
      const brochureId = 'brochure-1';
      mockCommandBus.execute.mockResolvedValue(true);

      // When
      const result = await service.브로슈어를_삭제한다(brochureId);

      // Then
      expect(commandBus.execute).toHaveBeenCalledTimes(1);
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          id: brochureId,
        }),
      );
      expect(result).toBe(true);
    });
  });

  describe('브로슈어_공개를_수정한다', () => {
    it('UpdateBrochurePublicCommand를 실행해야 한다', async () => {
      // Given
      const brochureId = 'brochure-1';
      const updateDto = {
        isPublic: true,
        updatedBy: 'user-1',
      };

      const mockResult = {
        id: brochureId,
        isPublic: true,
      } as any as Brochure;

      mockCommandBus.execute.mockResolvedValue(mockResult);

      // When
      const result = await service.브로슈어_공개를_수정한다(
        brochureId,
        updateDto,
      );

      // Then
      expect(commandBus.execute).toHaveBeenCalledTimes(1);
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          id: brochureId,
          data: updateDto,
        }),
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('브로슈어_오더를_일괄_수정한다', () => {
    it('UpdateBrochureBatchOrderCommand를 실행해야 한다', async () => {
      // Given
      const batchOrderDto = {
        brochures: [
          { id: 'brochure-1', order: 0 },
          { id: 'brochure-2', order: 1 },
        ],
        updatedBy: 'user-1',
      };

      const mockResult = {
        success: true,
        updatedCount: 2,
      };

      mockCommandBus.execute.mockResolvedValue(mockResult);

      // When
      const result = await service.브로슈어_오더를_일괄_수정한다(batchOrderDto);

      // Then
      expect(commandBus.execute).toHaveBeenCalledTimes(1);
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          data: batchOrderDto,
        }),
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('브로슈어_파일을_수정한다', () => {
    it('UpdateBrochureFileCommand를 실행해야 한다', async () => {
      // Given
      const brochureId = 'brochure-1';
      const fileDto = {
        attachments: [
          {
            fileName: 'new-brochure.pdf',
            fileUrl: 'https://s3.aws.com/new-brochure.pdf',
            fileSize: 2048000,
            mimeType: 'application/pdf',
          },
        ],
        updatedBy: 'user-1',
      };

      const mockResult = {
        id: brochureId,
        attachments: fileDto.attachments,
      } as any as Brochure;

      mockCommandBus.execute.mockResolvedValue(mockResult);

      // When
      const result = await service.브로슈어_파일을_수정한다(brochureId, fileDto);

      // Then
      expect(commandBus.execute).toHaveBeenCalledTimes(1);
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          id: brochureId,
          data: fileDto,
        }),
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('브로슈어_목록을_조회한다', () => {
    it('GetBrochureListQuery를 실행해야 한다', async () => {
      // Given
      const isPublic = true;
      const orderBy = 'order' as const;
      const page = 1;
      const limit = 10;

      const mockResult = {
        items: [
          {
            id: 'brochure-1',
            isPublic: true,
            order: 0,
            category: {
              name: '회사 소개',
            },
          } as Brochure,
        ],
        total: 1,
        page: 1,
        limit: 10,
      };

      mockQueryBus.execute.mockResolvedValue(mockResult);

      // When
      const result = await service.브로슈어_목록을_조회한다(
        isPublic,
        orderBy,
        page,
        limit,
      );

      // Then
      expect(queryBus.execute).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResult);
    });

    it('날짜 필터를 포함하여 조회해야 한다', async () => {
      // Given
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      const mockResult = {
        items: [],
        total: 0,
        page: 1,
        limit: 10,
      };

      mockQueryBus.execute.mockResolvedValue(mockResult);

      // When
      const result = await service.브로슈어_목록을_조회한다(
        undefined,
        'order',
        1,
        10,
        startDate,
        endDate,
      );

      // Then
      expect(queryBus.execute).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResult);
    });
  });

  describe('브로슈어_상세_조회한다', () => {
    it('GetBrochureDetailQuery를 실행해야 한다', async () => {
      // Given
      const brochureId = 'brochure-1';
      const mockBrochure = {
        id: brochureId,
        isPublic: true,
        order: 0,
        translations: [],
        attachments: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any as Brochure;

      mockQueryBus.execute.mockResolvedValue(mockBrochure);

      // When
      const result = await service.브로슈어_상세_조회한다(brochureId);

      // Then
      expect(queryBus.execute).toHaveBeenCalledTimes(1);
      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          id: brochureId,
        }),
      );
      expect(result).toEqual(mockBrochure);
    });
  });

  describe('기본_브로슈어들을_생성한다', () => {
    it('InitializeDefaultBrochuresCommand를 실행해야 한다', async () => {
      // Given
      const createdBy = 'system';
      const mockBrochures = [
        { id: 'brochure-1', isPublic: true, order: 0 } as Brochure,
        { id: 'brochure-2', isPublic: true, order: 1 } as Brochure,
      ];

      mockCommandBus.execute.mockResolvedValue(mockBrochures);

      // When
      const result = await service.기본_브로슈어들을_생성한다(createdBy);

      // Then
      expect(commandBus.execute).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockBrochures);
    });
  });

  describe('기본_브로슈어들을_초기화한다', () => {
    it('system 사용자가 생성한 브로슈어를 모두 삭제해야 한다', async () => {
      // Given
      const mockBrochures = [
        { id: 'brochure-1', createdBy: 'system' } as Brochure,
        { id: 'brochure-2', createdBy: 'system' } as Brochure,
        { id: 'brochure-3', createdBy: 'user-1' } as Brochure,
      ];

      mockQueryBus.execute.mockResolvedValue({
        items: mockBrochures,
        total: 3,
        page: 1,
        limit: 1000,
      });

      mockCommandBus.execute
        .mockResolvedValueOnce(true) // brochure-1 삭제
        .mockResolvedValueOnce(true); // brochure-2 삭제

      // When
      const result = await service.기본_브로슈어들을_초기화한다();

      // Then
      expect(queryBus.execute).toHaveBeenCalledTimes(1);
      expect(commandBus.execute).toHaveBeenCalledTimes(2); // system 생성 2개만 삭제
      expect(result).toBe(2);
    });
  });

  describe('브로슈어_번역들을_수정한다', () => {
    it('UpdateBrochureTranslationsCommand를 실행해야 한다', async () => {
      // Given
      const brochureId = 'brochure-1';
      const translationsDto = {
        translations: [
          {
            languageId: 'language-1',
            title: '수정된 제목',
            description: '수정된 설명',
          },
        ],
        updatedBy: 'user-1',
      };

      const mockTranslations = [
        {
          id: 'translation-1',
          brochureId,
          languageId: 'language-1',
          title: '수정된 제목',
          description: '수정된 설명',
        } as BrochureTranslation,
      ];

      mockCommandBus.execute.mockResolvedValue(mockTranslations);

      // When
      const result = await service.브로슈어_번역들을_수정한다(
        brochureId,
        translationsDto,
      );

      // Then
      expect(commandBus.execute).toHaveBeenCalledTimes(1);
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          brochureId,
          data: translationsDto,
        }),
      );
      expect(result).toEqual(mockTranslations);
    });
  });
});
