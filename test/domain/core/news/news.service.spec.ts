import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NewsService } from '@domain/core/news/news.service';
import { News } from '@domain/core/news/news.entity';
import { NotFoundException } from '@nestjs/common';

describe('NewsService', () => {
  let service: NewsService;
  let repository: jest.Mocked<Repository<News>>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    softRemove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NewsService,
        {
          provide: getRepositoryToken(News),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<NewsService>(NewsService);
    repository = module.get(getRepositoryToken(News));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('뉴스를_생성한다', () => {
    it('뉴스를 생성해야 한다', async () => {
      // Given
      const createData = {
        title: '루미르 신제품 출시',
        description: '혁신적인 신제품이 출시되었습니다',
        url: 'https://news.example.com/lumir',
        isPublic: true,
        order: 0,
        createdBy: 'user-1',
      };

      const mockNews = {
        id: 'news-1',
        ...createData,
        attachments: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.create.mockReturnValue(mockNews as any);
      mockRepository.save.mockResolvedValue(mockNews as any);

      // When
      const result = await service.뉴스를_생성한다(createData);

      // Then
      expect(repository.create).toHaveBeenCalledWith(createData);
      expect(repository.save).toHaveBeenCalledWith(mockNews);
      expect(result).toEqual(mockNews);
    });

    it('첨부파일이 있는 뉴스를 생성해야 한다', async () => {
      // Given
      const createData = {
        title: '뉴스 제목',
        description: '뉴스 설명',
        attachments: [
          {
            fileName: 'news.pdf',
            fileUrl: 'https://s3.aws.com/news.pdf',
            fileSize: 2048000,
            mimeType: 'application/pdf',
          },
        ],
      };

      const mockNews = {
        id: 'news-1',
        ...createData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.create.mockReturnValue(mockNews as any);
      mockRepository.save.mockResolvedValue(mockNews as any);

      // When
      const result = await service.뉴스를_생성한다(createData);

      // Then
      expect(result.attachments).toEqual(createData.attachments);
    });
  });

  describe('모든_뉴스를_조회한다', () => {
    it('모든 뉴스를 order 순으로 조회해야 한다', async () => {
      // Given
      const mockNews = [
        {
          id: 'news-1',
          title: '뉴스 1',
          order: 0,
          isPublic: true,
        } as News,
        {
          id: 'news-2',
          title: '뉴스 2',
          order: 1,
          isPublic: true,
        } as News,
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockNews),
      };

      mockRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      // When
      const result = await service.모든_뉴스를_조회한다();

      // Then
      expect(repository.createQueryBuilder).toHaveBeenCalledWith('news');
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'news.order',
        'ASC',
      );
      expect(mockQueryBuilder.addOrderBy).toHaveBeenCalledWith(
        'news.createdAt',
        'DESC',
      );
      expect(result).toEqual(mockNews);
    });

    it('공개된 뉴스만 조회해야 한다', async () => {
      // Given
      const mockNews = [
        {
          id: 'news-1',
          title: '뉴스 1',
          isPublic: true,
        } as News,
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockNews),
      };

      mockRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      // When
      const result = await service.모든_뉴스를_조회한다({
        isPublic: true,
      });

      // Then
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'news.isPublic = :isPublic',
        { isPublic: true },
      );
      expect(result).toEqual(mockNews);
    });
  });

  describe('ID로_뉴스를_조회한다', () => {
    it('ID로 뉴스를 조회해야 한다', async () => {
      // Given
      const newsId = 'news-1';
      const mockNews = {
        id: newsId,
        title: '뉴스 1',
        isPublic: true,
      } as News;

      mockRepository.findOne.mockResolvedValue(mockNews);

      // When
      const result = await service.ID로_뉴스를_조회한다(newsId);

      // Then
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: newsId },
      });
      expect(result).toEqual(mockNews);
    });

    it('존재하지 않는 ID로 조회 시 NotFoundException을 던져야 한다', async () => {
      // Given
      const newsId = 'non-existent';
      mockRepository.findOne.mockResolvedValue(null);

      // When & Then
      await expect(service.ID로_뉴스를_조회한다(newsId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('뉴스를_업데이트한다', () => {
    it('뉴스를 업데이트해야 한다', async () => {
      // Given
      const newsId = 'news-1';
      const updateData = {
        title: '수정된 제목',
        description: '수정된 설명',
        isPublic: false,
      };

      const existingNews = {
        id: newsId,
        title: '기존 제목',
        description: '기존 설명',
        isPublic: true,
      } as News;

      const updatedNews = {
        ...existingNews,
        ...updateData,
      } as News;

      mockRepository.findOne.mockResolvedValue(existingNews);
      mockRepository.save.mockResolvedValue(updatedNews);

      // When
      const result = await service.뉴스를_업데이트한다(newsId, updateData);

      // Then
      expect(repository.findOne).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining(updateData),
      );
      expect(result).toEqual(updatedNews);
    });
  });

  describe('뉴스를_삭제한다', () => {
    it('뉴스를 soft delete 해야 한다', async () => {
      // Given
      const newsId = 'news-1';
      const mockNews = {
        id: newsId,
        title: '뉴스 1',
        isPublic: true,
      } as News;

      mockRepository.findOne.mockResolvedValue(mockNews);
      mockRepository.softRemove.mockResolvedValue(mockNews);

      // When
      const result = await service.뉴스를_삭제한다(newsId);

      // Then
      expect(repository.findOne).toHaveBeenCalled();
      expect(repository.softRemove).toHaveBeenCalledWith(mockNews);
      expect(result).toBe(true);
    });
  });

  describe('뉴스_공개_여부를_변경한다', () => {
    it('공개 여부를 변경해야 한다', async () => {
      // Given
      const newsId = 'news-1';
      const isPublic = false;
      const updatedBy = 'user-1';

      const existingNews = {
        id: newsId,
        title: '뉴스 1',
        isPublic: true,
      } as News;

      const updatedNews = {
        ...existingNews,
        isPublic,
        updatedBy,
      } as News;

      mockRepository.findOne.mockResolvedValue(existingNews);
      mockRepository.save.mockResolvedValue(updatedNews);

      // When
      const result = await service.뉴스_공개_여부를_변경한다(
        newsId,
        isPublic,
        updatedBy,
      );

      // Then
      expect(result.isPublic).toBe(isPublic);
    });
  });

  describe('다음_순서를_계산한다', () => {
    it('기존 뉴스가 없을 때 0을 반환해야 한다', async () => {
      // Given
      mockRepository.find.mockResolvedValue([]);

      // When
      const result = await service.다음_순서를_계산한다();

      // Then
      expect(result).toBe(0);
    });

    it('기존 뉴스가 있을 때 최대값+1을 반환해야 한다', async () => {
      // Given
      const mockNews = [{ order: 5 } as News];
      mockRepository.find.mockResolvedValue(mockNews);

      // When
      const result = await service.다음_순서를_계산한다();

      // Then
      expect(result).toBe(6);
    });
  });

  describe('뉴스_오더를_일괄_업데이트한다', () => {
    it('뉴스 오더를 일괄 업데이트해야 한다', async () => {
      // Given
      const items = [
        { id: 'news-1', order: 2 },
        { id: 'news-2', order: 1 },
        { id: 'news-3', order: 0 },
      ];
      const updatedBy = 'user-1';

      const mockNewsItems = [
        { id: 'news-1', order: 0 } as News,
        { id: 'news-2', order: 1 } as News,
        { id: 'news-3', order: 2 } as News,
      ];

      mockRepository.findOne.mockImplementation((options: any) => {
        const news = mockNewsItems.find((n) => n.id === options.where.id);
        return Promise.resolve(news || null);
      });

      mockRepository.save.mockImplementation((news) => Promise.resolve(news));

      // When
      const result = await service.뉴스_오더를_일괄_업데이트한다(
        items,
        updatedBy,
      );

      // Then
      expect(result.success).toBe(true);
      expect(result.updatedCount).toBe(3);
    });

    it('일부 뉴스 업데이트 실패 시 실패 카운트를 반환해야 한다', async () => {
      // Given
      const items = [
        { id: 'news-1', order: 0 },
        { id: 'non-existent', order: 1 },
      ];

      const mockNews = { id: 'news-1', order: 0 } as News;

      mockRepository.findOne.mockImplementation((options: any) => {
        if (options.where.id === 'news-1') {
          return Promise.resolve(mockNews);
        }
        return Promise.resolve(null);
      });

      mockRepository.save.mockResolvedValue(mockNews);

      // When
      const result = await service.뉴스_오더를_일괄_업데이트한다(items);

      // Then
      expect(result.success).toBe(false);
      expect(result.updatedCount).toBe(1);
    });
  });

  describe('공개된_뉴스를_조회한다', () => {
    it('공개된 뉴스만 조회해야 한다', async () => {
      // Given
      const mockNews = [
        {
          id: 'news-1',
          title: '뉴스 1',
          isPublic: true,
        } as News,
        {
          id: 'news-2',
          title: '뉴스 2',
          isPublic: true,
        } as News,
      ];

      mockRepository.find.mockResolvedValue(mockNews);

      // When
      const result = await service.공개된_뉴스를_조회한다();

      // Then
      expect(repository.find).toHaveBeenCalledWith({
        where: { isPublic: true },
        order: { order: 'ASC', createdAt: 'DESC' },
      });
      expect(result).toEqual(mockNews);
    });
  });
});
