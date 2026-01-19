import { Test, TestingModule } from '@nestjs/testing';
import { WikiBusinessService } from '@business/wiki-business/wiki-business.service';
import { WikiContextService } from '@context/wiki-context/wiki-context.service';
import { STORAGE_SERVICE } from '@libs/storage/storage.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { WikiPermissionLog } from '@domain/sub/wiki-file-system/wiki-permission-log.entity';
import { WikiFileSystem } from '@domain/sub/wiki-file-system/wiki-file-system.entity';
import { NotFoundException } from '@nestjs/common';

describe('WikiBusinessService', () => {
  let service: WikiBusinessService;
  let wikiContextService: jest.Mocked<WikiContextService>;
  let storageService: jest.Mocked<any>;
  let permissionLogRepository: jest.Mocked<any>;

  const mockWikiContextService = {
    위키_상세를_조회한다: jest.fn(),
    폴더_자식들을_조회한다: jest.fn(),
    폴더_구조를_조회한다: jest.fn(),
    모든_위키를_조회한다: jest.fn(),
    위키를_검색한다: jest.fn(),
    폴더를_생성한다: jest.fn(),
    위키를_수정한다: jest.fn(),
    위키_공개를_수정한다: jest.fn(),
    위키_경로를_수정한다: jest.fn(),
    위키를_삭제한다: jest.fn(),
    폴더만_삭제한다: jest.fn(),
    파일을_생성한다: jest.fn(),
    위키_파일을_수정한다: jest.fn(),
  };

  const mockStorageService = {
    uploadFiles: jest.fn(),
    deleteFiles: jest.fn(),
  };

  const mockPermissionLogRepository = {
    save: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WikiBusinessService,
        {
          provide: WikiContextService,
          useValue: mockWikiContextService,
        },
        {
          provide: STORAGE_SERVICE,
          useValue: mockStorageService,
        },
        {
          provide: getRepositoryToken(WikiPermissionLog),
          useValue: mockPermissionLogRepository,
        },
      ],
    }).compile();

    service = module.get<WikiBusinessService>(WikiBusinessService);
    wikiContextService = module.get(WikiContextService);
    storageService = module.get(STORAGE_SERVICE);
    permissionLogRepository = module.get(getRepositoryToken(WikiPermissionLog));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('폴더를_조회한다', () => {
    it('컨텍스트 서비스를 호출하여 폴더를 조회해야 한다', async () => {
      // Given
      const folderId = 'folder-1';
      const mockFolder = {
        id: folderId,
        name: '테스트 폴더',
        type: 'folder',
      } as WikiFileSystem;

      mockWikiContextService.위키_상세를_조회한다.mockResolvedValue(
        mockFolder,
      );

      // When
      const result = await service.폴더를_조회한다(folderId);

      // Then
      expect(wikiContextService.위키_상세를_조회한다).toHaveBeenCalledWith(
        folderId,
      );
      expect(result).toEqual(mockFolder);
    });
  });

  describe('폴더_하위_항목을_조회한다', () => {
    it('컨텍스트 서비스를 호출하여 하위 항목을 조회해야 한다', async () => {
      // Given
      const folderId = 'folder-1';
      const mockChildren = [
        { id: 'child-1', name: '하위 폴더', type: 'folder' },
        { id: 'child-2', name: '하위 파일', type: 'file' },
      ] as WikiFileSystem[];

      mockWikiContextService.폴더_자식들을_조회한다.mockResolvedValue(
        mockChildren,
      );

      // When
      const result = await service.폴더_하위_항목을_조회한다(folderId);

      // Then
      expect(wikiContextService.폴더_자식들을_조회한다).toHaveBeenCalledWith(
        folderId,
      );
      expect(result).toEqual(mockChildren);
    });
  });

  describe('폴더_공개를_수정한다', () => {
    it('컨텍스트 서비스를 호출하여 공개 상태를 수정해야 한다', async () => {
      // Given
      const folderId = 'folder-1';
      const updateData = {
        isPublic: false,
        permissionRankIds: ['rank-1'],
        permissionPositionIds: ['pos-1'],
        permissionDepartmentIds: ['dept-1'],
        updatedBy: 'user-1',
      };

      const mockUpdatedFolder = {
        id: folderId,
        ...updateData,
      } as WikiFileSystem;

      mockWikiContextService.위키_공개를_수정한다.mockResolvedValue(
        mockUpdatedFolder,
      );

      // When
      const result = await service.폴더_공개를_수정한다(folderId, updateData);

      // Then
      expect(wikiContextService.위키_공개를_수정한다).toHaveBeenCalledWith(
        folderId,
        updateData,
      );
      expect(result).toEqual(mockUpdatedFolder);
    });
  });

  describe('폴더를_생성한다', () => {
    it('컨텍스트 서비스를 호출하여 폴더를 생성해야 한다', async () => {
      // Given
      const createData = {
        name: '새 폴더',
        parentId: null,
        isPublic: true,
        permissionRankIds: null,
        permissionPositionIds: null,
        permissionDepartmentIds: null,
        order: 0,
        createdBy: 'user-1',
      };

      const mockCreateResult = {
        id: 'new-folder-1',
        name: '새 폴더',
        type: 'folder',
      };

      const mockDetailFolder = {
        id: 'new-folder-1',
        ...createData,
        type: 'folder',
      } as WikiFileSystem;

      mockWikiContextService.폴더를_생성한다.mockResolvedValue(
        mockCreateResult as any,
      );
      mockWikiContextService.위키_상세를_조회한다.mockResolvedValue(
        mockDetailFolder,
      );

      // When
      const result = await service.폴더를_생성한다(createData);

      // Then
      expect(wikiContextService.폴더를_생성한다).toHaveBeenCalledWith(
        createData,
      );
      expect(wikiContextService.위키_상세를_조회한다).toHaveBeenCalledWith(
        'new-folder-1',
      );
      expect(result).toEqual(mockDetailFolder);
    });
  });

  describe('폴더를_삭제한다', () => {
    it('컨텍스트 서비스를 호출하여 폴더를 삭제해야 한다', async () => {
      // Given
      const folderId = 'folder-1';
      mockWikiContextService.위키를_삭제한다.mockResolvedValue(true);

      // When
      const result = await service.폴더를_삭제한다(folderId);

      // Then
      expect(wikiContextService.위키를_삭제한다).toHaveBeenCalledWith(
        folderId,
      );
      expect(result).toBe(true);
    });
  });

  describe('폴더만_삭제한다', () => {
    it('컨텍스트 서비스를 호출하여 폴더만 삭제해야 한다', async () => {
      // Given
      const folderId = 'folder-1';
      mockWikiContextService.폴더만_삭제한다.mockResolvedValue(true);

      // When
      const result = await service.폴더만_삭제한다(folderId);

      // Then
      expect(wikiContextService.폴더만_삭제한다).toHaveBeenCalledWith(
        folderId,
      );
      expect(result).toBe(true);
    });
  });

  describe('폴더를_수정한다', () => {
    it('컨텍스트 서비스를 호출하여 폴더를 수정해야 한다', async () => {
      // Given
      const folderId = 'folder-1';
      const updateData = {
        name: '수정된 폴더명',
        order: 5,
        updatedBy: 'user-1',
      };

      const mockUpdatedFolder = {
        id: folderId,
        ...updateData,
      } as WikiFileSystem;

      mockWikiContextService.위키를_수정한다.mockResolvedValue(
        mockUpdatedFolder,
      );

      // When
      const result = await service.폴더를_수정한다(folderId, updateData);

      // Then
      expect(wikiContextService.위키를_수정한다).toHaveBeenCalledWith(
        folderId,
        updateData,
      );
      expect(result).toEqual(mockUpdatedFolder);
    });
  });

  describe('폴더_경로를_수정한다', () => {
    it('컨텍스트 서비스를 호출하여 경로를 수정해야 한다', async () => {
      // Given
      const folderId = 'folder-1';
      const updateData = {
        parentId: 'new-parent-1',
        updatedBy: 'user-1',
      };

      const mockUpdatedFolder = {
        id: folderId,
        parentId: 'new-parent-1',
      } as WikiFileSystem;

      mockWikiContextService.위키_경로를_수정한다.mockResolvedValue(
        mockUpdatedFolder,
      );

      // When
      const result = await service.폴더_경로를_수정한다(folderId, updateData);

      // Then
      expect(wikiContextService.위키_경로를_수정한다).toHaveBeenCalledWith(
        folderId,
        updateData,
      );
      expect(result).toEqual(mockUpdatedFolder);
    });
  });

  describe('폴더_이름을_수정한다', () => {
    it('컨텍스트 서비스를 호출하여 이름을 수정해야 한다', async () => {
      // Given
      const folderId = 'folder-1';
      const updateData = {
        name: '새 이름',
        updatedBy: 'user-1',
      };

      const mockUpdatedFolder = {
        id: folderId,
        name: '새 이름',
      } as WikiFileSystem;

      mockWikiContextService.위키를_수정한다.mockResolvedValue(
        mockUpdatedFolder,
      );

      // When
      const result = await service.폴더_이름을_수정한다(folderId, updateData);

      // Then
      expect(wikiContextService.위키를_수정한다).toHaveBeenCalledWith(
        folderId,
        updateData,
      );
      expect(result).toEqual(mockUpdatedFolder);
    });
  });

  describe('폴더_구조를_가져온다', () => {
    it('ancestorId가 있으면 특정 폴더의 하위 구조를 조회해야 한다', async () => {
      // Given
      const ancestorId = 'folder-1';
      const mockStructure = [
        {
          wiki: { id: 'child-1', name: '하위 폴더', type: 'folder' },
          depth: 1,
        },
      ];

      const mockResult = [
        { id: 'child-1', name: '하위 폴더', type: 'folder' },
      ] as WikiFileSystem[];

      mockWikiContextService.폴더_구조를_조회한다.mockResolvedValue(
        mockStructure as any,
      );

      // When
      const result = await service.폴더_구조를_가져온다(ancestorId);

      // Then
      expect(wikiContextService.폴더_구조를_조회한다).toHaveBeenCalledWith(
        ancestorId,
      );
      expect(result).toEqual(mockResult);
    });

    it('ancestorId가 없으면 모든 위키를 조회해야 한다', async () => {
      // Given
      const mockAllWikis = [
        { id: 'wiki-1', name: '위키 1', type: 'folder' },
        { id: 'wiki-2', name: '위키 2', type: 'file' },
      ] as WikiFileSystem[];

      mockWikiContextService.모든_위키를_조회한다.mockResolvedValue(
        mockAllWikis,
      );

      // When
      const result = await service.폴더_구조를_가져온다();

      // Then
      expect(wikiContextService.모든_위키를_조회한다).toHaveBeenCalled();
      expect(result).toEqual(mockAllWikis);
    });
  });

  describe('파일을_삭제한다', () => {
    it('파일과 첨부파일을 S3에서 삭제하고 DB에서도 삭제해야 한다', async () => {
      // Given
      const fileId = 'file-1';
      const mockFile = {
        id: fileId,
        name: '테스트 파일',
        fileUrl: 's3://bucket/file.pdf',
        attachments: [
          {
            fileName: 'attachment.pdf',
            fileUrl: 's3://bucket/attachment.pdf',
          },
        ],
      } as WikiFileSystem;

      mockWikiContextService.위키_상세를_조회한다.mockResolvedValue(mockFile);
      mockStorageService.deleteFiles.mockResolvedValue(undefined);
      mockWikiContextService.위키를_삭제한다.mockResolvedValue(true);

      // When
      const result = await service.파일을_삭제한다(fileId);

      // Then
      expect(wikiContextService.위키_상세를_조회한다).toHaveBeenCalledWith(
        fileId,
      );
      expect(storageService.deleteFiles).toHaveBeenCalledWith([
        's3://bucket/file.pdf',
        's3://bucket/attachment.pdf',
      ]);
      expect(wikiContextService.위키를_삭제한다).toHaveBeenCalledWith(fileId);
      expect(result).toBe(true);
    });

    it('파일 URL이 없어도 삭제가 정상적으로 동작해야 한다', async () => {
      // Given
      const fileId = 'file-1';
      const mockFile = {
        id: fileId,
        name: '테스트 파일',
        fileUrl: null,
        attachments: [],
      } as WikiFileSystem;

      mockWikiContextService.위키_상세를_조회한다.mockResolvedValue(mockFile);
      mockWikiContextService.위키를_삭제한다.mockResolvedValue(true);

      // When
      const result = await service.파일을_삭제한다(fileId);

      // Then
      expect(storageService.deleteFiles).not.toHaveBeenCalled();
      expect(wikiContextService.위키를_삭제한다).toHaveBeenCalledWith(fileId);
      expect(result).toBe(true);
    });
  });

  describe('파일_경로를_수정한다', () => {
    it('컨텍스트 서비스를 호출하여 경로를 수정해야 한다', async () => {
      // Given
      const fileId = 'file-1';
      const updateData = {
        parentId: 'new-parent-1',
        updatedBy: 'user-1',
      };

      const mockUpdatedFile = {
        id: fileId,
        parentId: 'new-parent-1',
      } as WikiFileSystem;

      mockWikiContextService.위키_경로를_수정한다.mockResolvedValue(
        mockUpdatedFile,
      );

      // When
      const result = await service.파일_경로를_수정한다(fileId, updateData);

      // Then
      expect(wikiContextService.위키_경로를_수정한다).toHaveBeenCalledWith(
        fileId,
        updateData,
      );
      expect(result).toEqual(mockUpdatedFile);
    });
  });

  describe('파일_공개를_수정한다', () => {
    it('컨텍스트 서비스를 호출하여 공개 상태를 수정해야 한다', async () => {
      // Given
      const fileId = 'file-1';
      const updateData = {
        isPublic: false,
        updatedBy: 'user-1',
      };

      const mockUpdatedFile = {
        id: fileId,
        isPublic: false,
      } as WikiFileSystem;

      mockWikiContextService.위키를_수정한다.mockResolvedValue(
        mockUpdatedFile,
      );

      // When
      const result = await service.파일_공개를_수정한다(fileId, updateData);

      // Then
      expect(wikiContextService.위키를_수정한다).toHaveBeenCalledWith(fileId, {
        isPublic: updateData.isPublic,
        updatedBy: updateData.updatedBy,
      });
      expect(result).toEqual(mockUpdatedFile);
    });
  });

  describe('파일들을_조회한다', () => {
    it('컨텍스트 서비스를 호출하여 파일 목록을 조회해야 한다', async () => {
      // Given
      const parentId = 'folder-1';
      const mockFiles = [
        { id: 'file-1', name: '파일 1', type: 'file' },
        { id: 'file-2', name: '파일 2', type: 'file' },
      ] as WikiFileSystem[];

      mockWikiContextService.폴더_자식들을_조회한다.mockResolvedValue(
        mockFiles,
      );

      // When
      const result = await service.파일들을_조회한다(parentId);

      // Then
      expect(wikiContextService.폴더_자식들을_조회한다).toHaveBeenCalledWith(
        parentId,
      );
      expect(result).toEqual(mockFiles);
    });

    it('parentId가 null이면 루트 파일을 조회해야 한다', async () => {
      // Given
      const mockFiles = [
        { id: 'file-1', name: '루트 파일', type: 'file' },
      ] as WikiFileSystem[];

      mockWikiContextService.폴더_자식들을_조회한다.mockResolvedValue(
        mockFiles,
      );

      // When
      const result = await service.파일들을_조회한다(null);

      // Then
      expect(wikiContextService.폴더_자식들을_조회한다).toHaveBeenCalledWith(
        null,
      );
      expect(result).toEqual(mockFiles);
    });
  });

  describe('파일들을_검색한다', () => {
    it('컨텍스트 서비스를 호출하여 파일을 검색해야 한다', async () => {
      // Given
      const query = '회의록';
      const mockResults = [
        {
          wiki: { id: 'file-1', name: '회의록', type: 'file' },
          path: [
            { wiki: { id: 'folder-1', name: '폴더' }, depth: 0 },
          ],
        },
      ];

      mockWikiContextService.위키를_검색한다.mockResolvedValue(
        mockResults as any,
      );

      // When
      const result = await service.파일들을_검색한다(query);

      // Then
      expect(wikiContextService.위키를_검색한다).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockResults);
    });
  });

  describe('파일을_조회한다', () => {
    it('컨텍스트 서비스를 호출하여 파일을 조회해야 한다', async () => {
      // Given
      const fileId = 'file-1';
      const mockFile = {
        id: fileId,
        name: '테스트 파일',
        type: 'file',
      } as WikiFileSystem;

      mockWikiContextService.위키_상세를_조회한다.mockResolvedValue(mockFile);

      // When
      const result = await service.파일을_조회한다(fileId);

      // Then
      expect(wikiContextService.위키_상세를_조회한다).toHaveBeenCalledWith(
        fileId,
      );
      expect(result).toEqual(mockFile);
    });
  });

  describe('파일을_생성한다', () => {
    it('파일 업로드 없이 파일을 생성해야 한다', async () => {
      // Given
      const name = '새 파일';
      const parentId = 'folder-1';
      const title = '파일 제목';
      const content = '파일 내용';
      const createdBy = 'user-1';

      const mockCreateResult = {
        id: 'new-file-1',
        name,
        type: 'file',
      };

      const mockDetailFile = {
        id: 'new-file-1',
        name,
        title,
        content,
        type: 'file',
      } as WikiFileSystem;

      mockWikiContextService.파일을_생성한다.mockResolvedValue(
        mockCreateResult as any,
      );
      mockWikiContextService.위키_상세를_조회한다.mockResolvedValue(
        mockDetailFile,
      );

      // When
      const result = await service.파일을_생성한다(
        name,
        parentId,
        title,
        content,
        createdBy,
      );

      // Then
      expect(wikiContextService.파일을_생성한다).toHaveBeenCalledWith({
        name,
        parentId,
        title,
        content,
        attachments: undefined,
        isPublic: undefined,
        createdBy,
      });
      expect(result).toEqual(mockDetailFile);
    });

    it('파일 업로드와 함께 파일을 생성해야 한다', async () => {
      // Given
      const name = '새 파일';
      const parentId = 'folder-1';
      const title = '파일 제목';
      const content = '파일 내용';
      const createdBy = 'user-1';
      const files = [
        {
          originalname: 'test.pdf',
          buffer: Buffer.from('test'),
          mimetype: 'application/pdf',
          size: 1024,
        } as Express.Multer.File,
      ];

      const mockUploadedFiles = [
        {
          fileName: 'test.pdf',
          url: 's3://bucket/test.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
        },
      ];

      const mockCreateResult = {
        id: 'new-file-1',
        name,
        type: 'file',
      };

      const mockDetailFile = {
        id: 'new-file-1',
        name,
        title,
        content,
        attachments: [
          {
            fileName: 'test.pdf',
            fileUrl: 's3://bucket/test.pdf',
            fileSize: 1024,
            mimeType: 'application/pdf',
          },
        ],
        type: 'file',
      } as WikiFileSystem;

      mockStorageService.uploadFiles.mockResolvedValue(mockUploadedFiles);
      mockWikiContextService.파일을_생성한다.mockResolvedValue(
        mockCreateResult as any,
      );
      mockWikiContextService.위키_상세를_조회한다.mockResolvedValue(
        mockDetailFile,
      );

      // When
      const result = await service.파일을_생성한다(
        name,
        parentId,
        title,
        content,
        createdBy,
        files,
      );

      // Then
      expect(storageService.uploadFiles).toHaveBeenCalledWith(files, 'wiki');
      expect(wikiContextService.파일을_생성한다).toHaveBeenCalledWith({
        name,
        parentId,
        title,
        content,
        attachments: [
          {
            fileName: 'test.pdf',
            fileUrl: 's3://bucket/test.pdf',
            fileSize: 1024,
            mimeType: 'application/pdf',
          },
        ],
        isPublic: undefined,
        createdBy,
      });
      expect(result).toEqual(mockDetailFile);
    });
  });

  describe('빈_파일을_생성한다', () => {
    it('컨텍스트 서비스를 호출하여 빈 파일을 생성해야 한다', async () => {
      // Given
      const name = '빈 파일';
      const parentId = 'folder-1';
      const createdBy = 'user-1';
      const isPublic = true;

      const mockCreateResult = {
        id: 'new-file-1',
        name,
        type: 'file',
      };

      const mockDetailFile = {
        id: 'new-file-1',
        name,
        type: 'file',
        isPublic,
      } as WikiFileSystem;

      mockWikiContextService.파일을_생성한다.mockResolvedValue(
        mockCreateResult as any,
      );
      mockWikiContextService.위키_상세를_조회한다.mockResolvedValue(
        mockDetailFile,
      );

      // When
      const result = await service.빈_파일을_생성한다(
        name,
        parentId,
        createdBy,
        isPublic,
      );

      // Then
      expect(wikiContextService.파일을_생성한다).toHaveBeenCalledWith({
        name,
        parentId,
        isPublic,
        createdBy,
      });
      expect(result).toEqual(mockDetailFile);
    });
  });

  describe('파일을_수정한다', () => {
    it('기존 첨부파일을 삭제하고 새 파일을 업로드해야 한다', async () => {
      // Given
      const fileId = 'file-1';
      const name = '수정된 파일';
      const title = '수정된 제목';
      const content = '수정된 내용';
      const updatedBy = 'user-1';

      const existingFile = {
        id: fileId,
        name: '기존 파일',
        attachments: [
          {
            fileName: 'old.pdf',
            fileUrl: 's3://bucket/old.pdf',
          },
        ],
      } as WikiFileSystem;

      const files = [
        {
          originalname: 'new.pdf',
          buffer: Buffer.from('new'),
          mimetype: 'application/pdf',
          size: 2048,
        } as Express.Multer.File,
      ];

      const mockUploadedFiles = [
        {
          fileName: 'new.pdf',
          url: 's3://bucket/new.pdf',
          fileSize: 2048,
          mimeType: 'application/pdf',
        },
      ];

      const mockUpdatedFile = {
        id: fileId,
        name,
        title,
        content,
      } as WikiFileSystem;

      mockWikiContextService.위키_상세를_조회한다.mockResolvedValue(
        existingFile,
      );
      mockStorageService.deleteFiles.mockResolvedValue(undefined);
      mockStorageService.uploadFiles.mockResolvedValue(mockUploadedFiles);
      mockWikiContextService.위키_파일을_수정한다.mockResolvedValue(
        existingFile,
      );
      mockWikiContextService.위키를_수정한다.mockResolvedValue(mockUpdatedFile);

      // When
      const result = await service.파일을_수정한다(
        fileId,
        name,
        title,
        content,
        updatedBy,
        files,
      );

      // Then
      expect(storageService.deleteFiles).toHaveBeenCalledWith([
        's3://bucket/old.pdf',
      ]);
      expect(storageService.uploadFiles).toHaveBeenCalledWith(files, 'wiki');
      expect(wikiContextService.위키_파일을_수정한다).toHaveBeenCalledWith(
        fileId,
        {
          attachments: [
            {
              fileName: 'new.pdf',
              fileUrl: 's3://bucket/new.pdf',
              fileSize: 2048,
              mimeType: 'application/pdf',
            },
          ],
          updatedBy,
        },
      );
      expect(wikiContextService.위키를_수정한다).toHaveBeenCalledWith(fileId, {
        name,
        title,
        content,
        updatedBy,
      });
      expect(result).toEqual(mockUpdatedFile);
    });

    it('파일 없이 수정하면 기존 첨부파일만 삭제해야 한다', async () => {
      // Given
      const fileId = 'file-1';
      const name = '수정된 파일';
      const title = null;
      const content = null;
      const updatedBy = 'user-1';

      const existingFile = {
        id: fileId,
        name: '기존 파일',
        attachments: [
          {
            fileName: 'old.pdf',
            fileUrl: 's3://bucket/old.pdf',
          },
        ],
      } as WikiFileSystem;

      const mockUpdatedFile = {
        id: fileId,
        name,
      } as WikiFileSystem;

      mockWikiContextService.위키_상세를_조회한다.mockResolvedValue(
        existingFile,
      );
      mockStorageService.deleteFiles.mockResolvedValue(undefined);
      mockWikiContextService.위키_파일을_수정한다.mockResolvedValue(
        existingFile,
      );
      mockWikiContextService.위키를_수정한다.mockResolvedValue(mockUpdatedFile);

      // When
      const result = await service.파일을_수정한다(
        fileId,
        name,
        title,
        content,
        updatedBy,
      );

      // Then
      expect(storageService.deleteFiles).toHaveBeenCalledWith([
        's3://bucket/old.pdf',
      ]);
      expect(storageService.uploadFiles).not.toHaveBeenCalled();
      expect(wikiContextService.위키_파일을_수정한다).toHaveBeenCalledWith(
        fileId,
        {
          attachments: [],
          updatedBy,
        },
      );
    });
  });

  describe('위키_권한을_교체한다', () => {
    it('비활성 부서 ID를 새로운 ID로 교체해야 한다', async () => {
      // Given
      const wikiId = 'wiki-1';
      const userId = 'user-1';
      const dto = {
        departments: [
          { oldId: 'dept-old-1', newId: 'dept-new-1' },
          { oldId: 'dept-old-2', newId: 'dept-new-2' },
        ],
        note: '부서 변경',
      };

      const existingWiki = {
        id: wikiId,
        permissionDepartmentIds: ['dept-old-1', 'dept-old-2', 'dept-other'],
      } as WikiFileSystem;

      const updatedWiki = {
        id: wikiId,
        permissionDepartmentIds: ['dept-new-1', 'dept-new-2', 'dept-other'],
        permissionRankIds: null,
        permissionPositionIds: null,
      } as WikiFileSystem;

      mockWikiContextService.위키_상세를_조회한다.mockResolvedValue(
        existingWiki,
      );
      mockWikiContextService.위키를_수정한다.mockResolvedValue(updatedWiki);
      mockPermissionLogRepository.save.mockResolvedValue({});

      // When
      const result = await service.위키_권한을_교체한다(wikiId, dto, userId);

      // Then
      expect(wikiContextService.위키_상세를_조회한다).toHaveBeenCalledWith(
        wikiId,
      );
      expect(wikiContextService.위키를_수정한다).toHaveBeenCalledWith(wikiId, {
        permissionDepartmentIds: ['dept-new-1', 'dept-new-2', 'dept-other'],
      });
      expect(permissionLogRepository.save).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.replacedDepartments).toBe(2);
    });

    it('존재하지 않는 위키에 대해 NotFoundException을 발생시켜야 한다', async () => {
      // Given
      const wikiId = 'non-existent';
      const userId = 'user-1';
      const dto = {
        departments: [{ oldId: 'dept-old-1', newId: 'dept-new-1' }],
      };

      mockWikiContextService.위키_상세를_조회한다.mockResolvedValue(null);

      // When & Then
      await expect(
        service.위키_권한을_교체한다(wikiId, dto, userId),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
