import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ShareholdersMeetingBusinessService } from '@business/shareholders-meeting-business/shareholders-meeting-business.service';
import { ShareholdersMeetingContextService } from '@context/shareholders-meeting-context/shareholders-meeting-context.service';
import { CategoryService } from '@domain/common/category/category.service';
import { IStorageService } from '@libs/storage/interfaces/storage.interface';
import { STORAGE_SERVICE } from '@libs/storage/storage.module';
import { ShareholdersMeeting } from '@domain/core/shareholders-meeting/shareholders-meeting.entity';
import { Category } from '@domain/common/category/category.entity';
import { VoteResultType } from '@domain/core/shareholders-meeting/vote-result-type.types';

describe('ShareholdersMeetingBusinessService', () => {
  let service: ShareholdersMeetingBusinessService;
  let shareholdersMeetingContextService: jest.Mocked<ShareholdersMeetingContextService>;
  let categoryService: jest.Mocked<CategoryService>;
  let storageService: jest.Mocked<IStorageService>;

  const mockShareholdersMeetingContextService = {
    주주총회를_생성한다: jest.fn(),
    주주총회를_수정한다: jest.fn(),
    주주총회를_삭제한다: jest.fn(),
    주주총회_상세를_조회한다: jest.fn(),
    주주총회_목록을_조회한다: jest.fn(),
    주주총회_전체_목록을_조회한다: jest.fn(),
    주주총회_공개를_수정한다: jest.fn(),
    주주총회_오더를_일괄_수정한다: jest.fn(),
    주주총회_파일을_수정한다: jest.fn(),
  };

  const mockCategoryService = {
    엔티티_타입별_카테고리를_조회한다: jest.fn(),
    카테고리를_생성한다: jest.fn(),
    카테고리를_업데이트한다: jest.fn(),
    카테고리를_삭제한다: jest.fn(),
  };

  const mockStorageService = {
    uploadFile: jest.fn(),
    uploadFiles: jest.fn(),
    deleteFile: jest.fn(),
    deleteFiles: jest.fn(),
    getFileUrl: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      if (key === 'DEFAULT_LANGUAGE_CODE') return 'en';
      return defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShareholdersMeetingBusinessService,
        {
          provide: ShareholdersMeetingContextService,
          useValue: mockShareholdersMeetingContextService,
        },
        {
          provide: CategoryService,
          useValue: mockCategoryService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: STORAGE_SERVICE,
          useValue: mockStorageService,
        },
      ],
    }).compile();

    service = module.get<ShareholdersMeetingBusinessService>(
      ShareholdersMeetingBusinessService,
    );
    shareholdersMeetingContextService = module.get(ShareholdersMeetingContextService);
    categoryService = module.get(CategoryService);
    storageService = module.get(STORAGE_SERVICE);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('주주총회_전체_목록을_조회한다', () => {
    it('컨텍스트 서비스를 호출하여 전체 목록을 조회해야 한다', async () => {
      // Given
      const mockMeetings = [
        {
          id: 'meeting-1',
          isPublic: true,
          order: 0,
          location: '서울',
          meetingDate: new Date('2024-03-15'),
          translations: [
            {
              title: '제38기 정기 주주총회',
              description: '정기 주주총회 안내',
              language: { code: 'ko' },
            },
          ],
          voteResults: [],
        } as any,
      ];

      mockShareholdersMeetingContextService.주주총회_전체_목록을_조회한다.mockResolvedValue(
        mockMeetings,
      );

      // When
      const result = await service.주주총회_전체_목록을_조회한다();

      // Then
      expect(
        shareholdersMeetingContextService.주주총회_전체_목록을_조회한다,
      ).toHaveBeenCalled();
      expect(result).toEqual(mockMeetings);
      expect(result).toHaveLength(1);
    });
  });

  describe('주주총회_상세를_조회한다', () => {
    it('컨텍스트 서비스를 호출하여 상세 정보를 조회해야 한다', async () => {
      // Given
      const meetingId = 'meeting-1';
      const mockMeeting = {
        id: meetingId,
        isPublic: true,
        location: '서울 강남구',
        meetingDate: new Date('2024-03-15'),
        translations: [],
        voteResults: [],
        categoryId: 'category-1',
        category: {
          name: '정기 주주총회',
        },
      } as any;

      mockShareholdersMeetingContextService.주주총회_상세를_조회한다.mockResolvedValue(
        mockMeeting,
      );

      // When
      const result = await service.주주총회_상세를_조회한다(meetingId);

      // Then
      expect(
        shareholdersMeetingContextService.주주총회_상세를_조회한다,
      ).toHaveBeenCalledWith(meetingId);
      expect(result).toHaveProperty('categoryId', 'category-1');
      expect(result).toHaveProperty('categoryName', '정기 주주총회');
      expect(result).not.toHaveProperty('category');
    });
  });

  describe('주주총회를_삭제한다', () => {
    it('컨텍스트 서비스를 호출하여 주주총회를 삭제해야 한다', async () => {
      // Given
      const meetingId = 'meeting-1';
      mockShareholdersMeetingContextService.주주총회를_삭제한다.mockResolvedValue(true);

      // When
      const result = await service.주주총회를_삭제한다(meetingId);

      // Then
      expect(shareholdersMeetingContextService.주주총회를_삭제한다).toHaveBeenCalledWith(
        meetingId,
      );
      expect(result).toBe(true);
    });
  });

  describe('주주총회_공개를_수정한다', () => {
    it('컨텍스트 서비스를 호출하여 공개 상태를 수정해야 한다', async () => {
      // Given
      const meetingId = 'meeting-1';
      const isPublic = false;
      const updatedBy = 'user-1';

      const mockResult = {
        id: meetingId,
        isPublic: false,
      } as any as ShareholdersMeeting;

      mockShareholdersMeetingContextService.주주총회_공개를_수정한다.mockResolvedValue(
        mockResult,
      );

      // When
      const result = await service.주주총회_공개를_수정한다(
        meetingId,
        isPublic,
        updatedBy,
      );

      // Then
      expect(
        shareholdersMeetingContextService.주주총회_공개를_수정한다,
      ).toHaveBeenCalledWith(meetingId, isPublic, updatedBy);
      expect(result).toEqual(mockResult);
    });
  });

  describe('주주총회를_생성한다', () => {
    it('파일 없이 주주총회를 생성해야 한다', async () => {
      // Given
      const translations = [
        {
          languageId: 'language-1',
          title: '제38기 정기 주주총회',
          description: '정기 주주총회 안내',
        },
      ];
      const meetingData = {
        categoryId: 'category-1',
        location: '서울 강남구 루미르 본사',
        meetingDate: new Date('2024-03-15'),
      };
      const createdBy = 'user-1';

      const mockResult = {
        id: 'meeting-1',
        isPublic: true,
        order: 0,
        location: meetingData.location,
        meetingDate: meetingData.meetingDate,
        createdAt: new Date(),
      };

      mockShareholdersMeetingContextService.주주총회를_생성한다.mockResolvedValue(
        mockResult as any,
      );

      // When
      const result = await service.주주총회를_생성한다(
        translations,
        meetingData,
        undefined,
        createdBy,
        undefined,
      );

      // Then
      expect(shareholdersMeetingContextService.주주총회를_생성한다).toHaveBeenCalledWith(
        translations,
        meetingData,
        undefined,
        createdBy,
        undefined,
      );
      expect(result).toEqual(mockResult);
    });

    it('파일과 의결 결과를 포함하여 주주총회를 생성해야 한다', async () => {
      // Given
      const translations = [
        {
          languageId: 'language-1',
          title: '제38기 정기 주주총회',
          description: '정기 주주총회 안내',
        },
      ];
      const meetingData = {
        categoryId: 'category-1',
        location: '서울 강남구',
        meetingDate: new Date('2024-03-15'),
      };
      const voteResults = [
        {
          agendaNumber: 1,
          totalVote: 1000,
          yesVote: 850,
          noVote: 150,
          approvalRating: 85.0,
          result: VoteResultType.ACCEPTED,
          translations: [
            {
              languageId: 'language-1',
              title: '제1호 안건: 재무제표 승인',
            },
          ],
        },
      ];
      const createdBy = 'user-1';
      const files = [
        {
          originalname: 'minutes.pdf',
          buffer: Buffer.from('test'),
          size: 1024,
          mimetype: 'application/pdf',
        } as Express.Multer.File,
      ];

      const mockUploadedFiles = [
        {
          fileName: 'minutes.pdf',
          url: 'https://s3.aws.com/minutes.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
        },
      ];

      const mockResult = {
        id: 'meeting-1',
        isPublic: true,
        order: 0,
        location: meetingData.location,
        meetingDate: meetingData.meetingDate,
        attachments: mockUploadedFiles,
        voteResults: [
          {
            id: 'vote-1',
            agendaNumber: 1,
            translations: [],
          },
        ],
        createdAt: new Date(),
      };

      mockStorageService.uploadFiles.mockResolvedValue(mockUploadedFiles);
      mockShareholdersMeetingContextService.주주총회를_생성한다.mockResolvedValue(
        mockResult as any,
      );

      // When
      const result = await service.주주총회를_생성한다(
        translations,
        meetingData,
        voteResults,
        createdBy,
        files,
      );

      // Then
      expect(storageService.uploadFiles).toHaveBeenCalledWith(
        files,
        'shareholders-meetings',
      );
      expect(shareholdersMeetingContextService.주주총회를_생성한다).toHaveBeenCalledWith(
        translations,
        meetingData,
        voteResults,
        createdBy,
        expect.arrayContaining([
          expect.objectContaining({
            fileName: 'minutes.pdf',
            fileUrl: 'https://s3.aws.com/minutes.pdf',
          }),
        ]),
      );
      expect(result.attachments).toEqual(mockUploadedFiles);
    });
  });

  describe('주주총회를_수정한다', () => {
    it('파일을 포함하여 주주총회를 수정해야 한다', async () => {
      // Given
      const meetingId = 'meeting-1';
      const translations = [
        {
          languageId: 'language-1',
          title: '수정된 제목',
          description: '수정된 설명',
        },
      ];
      const meetingData = {
        categoryId: 'category-1',
        location: '부산 해운대',
        meetingDate: new Date('2024-06-20'),
      };
      const updatedBy = 'user-1';
      const files = [
        {
          originalname: 'new-minutes.pdf',
          buffer: Buffer.from('test'),
          size: 2048,
          mimetype: 'application/pdf',
        } as Express.Multer.File,
      ];

      const mockExistingMeeting = {
        id: meetingId,
        attachments: [
          {
            fileName: 'old-minutes.pdf',
            fileUrl: 'https://s3.aws.com/old-minutes.pdf',
            fileSize: 1024,
            mimeType: 'application/pdf',
          },
        ],
      } as any;

      const mockUploadedFiles = [
        {
          fileName: 'new-minutes.pdf',
          url: 'https://s3.aws.com/new-minutes.pdf',
          fileSize: 2048,
          mimeType: 'application/pdf',
        },
      ];

      const mockUpdatedMeeting = {
        id: meetingId,
        location: meetingData.location,
        meetingDate: meetingData.meetingDate,
        attachments: mockUploadedFiles,
      } as any;

      mockShareholdersMeetingContextService.주주총회_상세를_조회한다.mockResolvedValue(
        mockExistingMeeting,
      );
      mockStorageService.deleteFiles.mockResolvedValue(undefined);
      mockStorageService.uploadFiles.mockResolvedValue(mockUploadedFiles);
      mockShareholdersMeetingContextService.주주총회_파일을_수정한다.mockResolvedValue(
        {} as any,
      );
      mockShareholdersMeetingContextService.주주총회를_수정한다.mockResolvedValue(
        mockUpdatedMeeting,
      );

      // When
      const result = await service.주주총회를_수정한다(
        meetingId,
        translations,
        updatedBy,
        meetingData.categoryId,
        { location: meetingData.location, meetingDate: meetingData.meetingDate },
        undefined,
        files,
      );

      // Then
      expect(
        shareholdersMeetingContextService.주주총회_상세를_조회한다,
      ).toHaveBeenCalledWith(meetingId);
      expect(storageService.deleteFiles).toHaveBeenCalledWith([
        'https://s3.aws.com/old-minutes.pdf',
      ]);
      expect(storageService.uploadFiles).toHaveBeenCalledWith(
        files,
        'shareholders-meetings',
      );
      expect(
        shareholdersMeetingContextService.주주총회_파일을_수정한다,
      ).toHaveBeenCalledWith(
        meetingId,
        expect.arrayContaining([
          expect.objectContaining({
            fileName: 'new-minutes.pdf',
          }),
        ]),
        updatedBy,
      );
      expect(shareholdersMeetingContextService.주주총회를_수정한다).toHaveBeenCalledWith(
        meetingId,
        {
          categoryId: 'category-1',
          location: '부산 해운대',
          meetingDate: new Date('2024-06-20'),
          translations,
          voteResults: undefined,
          updatedBy,
        },
      );
      expect(result).toEqual(mockUpdatedMeeting);
    });

    it('파일 없이 주주총회를 수정해야 한다', async () => {
      // Given
      const meetingId = 'meeting-1';
      const translations = [
        {
          languageId: 'language-1',
          title: '수정된 제목',
        },
      ];
      const meetingData = {
        categoryId: 'category-1',
      };
      const updatedBy = 'user-1';

      const mockExistingMeeting = {
        id: meetingId,
        attachments: [
          {
            fileName: 'old-minutes.pdf',
            fileUrl: 'https://s3.aws.com/old-minutes.pdf',
            fileSize: 1024,
            mimeType: 'application/pdf',
          },
        ],
      } as any;

      const mockUpdatedMeeting = {
        id: meetingId,
        translations: [],
      } as any;

      mockShareholdersMeetingContextService.주주총회_상세를_조회한다.mockResolvedValue(
        mockExistingMeeting,
      );
      mockStorageService.deleteFiles.mockResolvedValue(undefined);
      mockShareholdersMeetingContextService.주주총회_파일을_수정한다.mockResolvedValue(
        {} as any,
      );
      mockShareholdersMeetingContextService.주주총회를_수정한다.mockResolvedValue(
        mockUpdatedMeeting,
      );

      // When
      const result = await service.주주총회를_수정한다(
        meetingId,
        translations,
        updatedBy,
        meetingData.categoryId,
        undefined,
        undefined,
        undefined,
      );

      // Then
      expect(storageService.deleteFiles).toHaveBeenCalledWith([
        'https://s3.aws.com/old-minutes.pdf',
      ]);
      expect(storageService.uploadFiles).not.toHaveBeenCalled();
      expect(
        shareholdersMeetingContextService.주주총회_파일을_수정한다,
      ).toHaveBeenCalledWith(meetingId, [], updatedBy);
      expect(result).toEqual(mockUpdatedMeeting);
    });
  });

  describe('주주총회_오더를_일괄_수정한다', () => {
    it('컨텍스트 서비스를 호출하여 순서를 일괄 수정해야 한다', async () => {
      // Given
      const shareholdersMeetings = [
        { id: 'meeting-1', order: 0 },
        { id: 'meeting-2', order: 1 },
      ];
      const updatedBy = 'user-1';

      const mockResult = { success: true, updatedCount: 2 };
      mockShareholdersMeetingContextService.주주총회_오더를_일괄_수정한다.mockResolvedValue(
        mockResult,
      );

      // When
      const result = await service.주주총회_오더를_일괄_수정한다(
        shareholdersMeetings,
        updatedBy,
      );

      // Then
      expect(
        shareholdersMeetingContextService.주주총회_오더를_일괄_수정한다,
      ).toHaveBeenCalledWith(shareholdersMeetings, updatedBy);
      expect(result).toEqual(mockResult);
    });
  });

  describe('주주총회_목록을_조회한다', () => {
    it('컨텍스트 서비스를 호출하여 목록을 조회해야 한다', async () => {
      // Given
      const mockResult = {
        items: [
          {
            id: 'meeting-1',
            categoryId: 'category-1',
            category: { name: '정기총회' },
            isPublic: true,
            order: 0,
            location: '서울',
            meetingDate: new Date('2024-03-15'),
            translations: [
              {
                title: '제38기 정기 주주총회',
                description: '정기 주주총회 안내',
                language: { code: 'ko' },
              },
            ],
          } as any,
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      mockShareholdersMeetingContextService.주주총회_목록을_조회한다.mockResolvedValue(
        mockResult,
      );

      // When
      const result = await service.주주총회_목록을_조회한다(true, 'order', 1, 10);

      // Then
      expect(shareholdersMeetingContextService.주주총회_목록을_조회한다).toHaveBeenCalledWith(
        true,
        'order',
        1,
        10,
        undefined,
        undefined,
      );
      expect(result.items).toHaveLength(1);
      expect(result.items[0].title).toBe('제38기 정기 주주총회');
      expect(result.items[0].categoryName).toBe('정기총회');
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
        totalPages: 0,
      };

      mockShareholdersMeetingContextService.주주총회_목록을_조회한다.mockResolvedValue(
        mockResult,
      );

      // When
      const result = await service.주주총회_목록을_조회한다(
        undefined,
        'order',
        1,
        10,
        startDate,
        endDate,
      );

      // Then
      expect(shareholdersMeetingContextService.주주총회_목록을_조회한다).toHaveBeenCalledWith(
        undefined,
        'order',
        1,
        10,
        startDate,
        endDate,
      );
      expect(result.total).toBe(0);
    });

    it('totalPages를 계산해야 한다', async () => {
      // Given
      const mockResult = {
        items: [],
        total: 25,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      mockShareholdersMeetingContextService.주주총회_목록을_조회한다.mockResolvedValue(
        mockResult,
      );

      // When
      const result = await service.주주총회_목록을_조회한다(undefined, 'order', 1, 10);

      // Then
      expect(result.totalPages).toBe(3); // Math.ceil(25 / 10)
    });
  });

  describe('주주총회_카테고리_목록을_조회한다', () => {
    it('카테고리 서비스를 호출하여 목록을 조회해야 한다', async () => {
      // Given
      const mockCategories = [
        { id: 'category-1', name: '정기총회', entityType: 'shareholders_meeting' },
        { id: 'category-2', name: '임시총회', entityType: 'shareholders_meeting' },
      ];

      mockCategoryService.엔티티_타입별_카테고리를_조회한다.mockResolvedValue(
        mockCategories as any,
      );

      // When
      const result = await service.주주총회_카테고리_목록을_조회한다();

      // Then
      expect(categoryService.엔티티_타입별_카테고리를_조회한다).toHaveBeenCalledWith(
        'shareholders_meeting',
        true,
      );
      expect(result).toEqual(mockCategories);
    });
  });

  describe('주주총회_카테고리를_생성한다', () => {
    it('카테고리 서비스를 호출하여 카테고리를 생성해야 한다', async () => {
      // Given
      const createData = {
        name: '특별총회',
        description: '특별 안건 주주총회',
        isActive: true,
        order: 2,
        createdBy: 'user-1',
      };

      const mockCategory = {
        id: 'category-1',
        ...createData,
        entityType: 'shareholders_meeting',
      } as Category;

      mockCategoryService.카테고리를_생성한다.mockResolvedValue(mockCategory);

      // When
      const result = await service.주주총회_카테고리를_생성한다(createData);

      // Then
      expect(categoryService.카테고리를_생성한다).toHaveBeenCalledWith({
        entityType: 'shareholders_meeting',
        name: createData.name,
        description: createData.description,
        isActive: createData.isActive,
        order: createData.order,
        createdBy: createData.createdBy,
      });
      expect(result).toEqual(mockCategory);
    });
  });

  describe('주주총회_카테고리를_수정한다', () => {
    it('카테고리 서비스를 호출하여 카테고리를 수정해야 한다', async () => {
      // Given
      const categoryId = 'category-1';
      const updateData = {
        name: '수정된 카테고리명',
        description: '수정된 설명',
        updatedBy: 'user-1',
      };

      const mockUpdatedCategory = {
        id: categoryId,
        ...updateData,
        entityType: 'shareholders_meeting',
      } as Category;

      mockCategoryService.카테고리를_업데이트한다.mockResolvedValue(mockUpdatedCategory);

      // When
      const result = await service.주주총회_카테고리를_수정한다(categoryId, updateData);

      // Then
      expect(categoryService.카테고리를_업데이트한다).toHaveBeenCalledWith(
        categoryId,
        updateData,
      );
      expect(result).toEqual(mockUpdatedCategory);
    });
  });

  describe('주주총회_카테고리_오더를_변경한다', () => {
    it('카테고리 서비스를 호출하여 순서를 변경해야 한다', async () => {
      // Given
      const categoryId = 'category-1';
      const orderData = {
        order: 5,
        updatedBy: 'user-1',
      };

      const mockResult = {
        id: categoryId,
        order: 5,
        updatedBy: 'user-1',
      } as Category;

      mockCategoryService.카테고리를_업데이트한다.mockResolvedValue(mockResult);

      // When
      const result = await service.주주총회_카테고리_오더를_변경한다(
        categoryId,
        orderData,
      );

      // Then
      expect(categoryService.카테고리를_업데이트한다).toHaveBeenCalledWith(categoryId, {
        order: orderData.order,
        updatedBy: orderData.updatedBy,
      });
      expect(result).toEqual(mockResult);
    });
  });

  describe('주주총회_카테고리를_삭제한다', () => {
    it('카테고리 서비스를 호출하여 카테고리를 삭제해야 한다', async () => {
      // Given
      const categoryId = 'category-1';
      mockCategoryService.카테고리를_삭제한다.mockResolvedValue(true);

      // When
      const result = await service.주주총회_카테고리를_삭제한다(categoryId);

      // Then
      expect(categoryService.카테고리를_삭제한다).toHaveBeenCalledWith(categoryId);
      expect(result).toBe(true);
    });
  });
});
