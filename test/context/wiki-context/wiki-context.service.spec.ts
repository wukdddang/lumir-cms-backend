import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { WikiContextService } from '@context/wiki-context/wiki-context.service';
import { WikiFileSystem } from '@domain/sub/wiki-file-system/wiki-file-system.entity';
import { WikiFileSystemService } from '@domain/sub/wiki-file-system/wiki-file-system.service';

describe('WikiContextService', () => {
  let service: WikiContextService;
  let commandBus: jest.Mocked<CommandBus>;
  let queryBus: jest.Mocked<QueryBus>;
  let wikiFileSystemService: jest.Mocked<WikiFileSystemService>;

  const mockCommandBus = {
    execute: jest.fn(),
  };

  const mockQueryBus = {
    execute: jest.fn(),
  };

  const mockWikiFileSystemService = {
    모든_위키를_조회한다: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WikiContextService,
        {
          provide: CommandBus,
          useValue: mockCommandBus,
        },
        {
          provide: QueryBus,
          useValue: mockQueryBus,
        },
        {
          provide: WikiFileSystemService,
          useValue: mockWikiFileSystemService,
        },
      ],
    }).compile();

    service = module.get<WikiContextService>(WikiContextService);
    commandBus = module.get(CommandBus);
    queryBus = module.get(QueryBus);
    wikiFileSystemService = module.get(WikiFileSystemService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('폴더를_생성한다', () => {
    it('CreateFolderCommand를 실행해야 한다', async () => {
      // Given
      const createDto = {
        name: '새 폴더',
        parentId: null,
        isPublic: true,
        permissionRankIds: null,
        permissionPositionIds: null,
        permissionDepartmentIds: null,
        order: 0,
        createdBy: 'user-1',
      };

      const mockResult = {
        id: 'new-folder-1',
        name: '새 폴더',
        type: 'folder',
      };

      mockCommandBus.execute.mockResolvedValue(mockResult);

      // When
      const result = await service.폴더를_생성한다(createDto);

      // Then
      expect(commandBus.execute).toHaveBeenCalledTimes(1);
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          data: createDto,
        }),
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('파일을_생성한다', () => {
    it('CreateFileCommand를 실행해야 한다', async () => {
      // Given
      const createDto = {
        name: '새 파일',
        parentId: null,
        title: '파일 제목',
        content: '파일 내용',
        isPublic: true,
        createdBy: 'user-1',
      };

      const mockResult = {
        id: 'new-file-1',
        name: '새 파일',
        type: 'file',
      };

      mockCommandBus.execute.mockResolvedValue(mockResult);

      // When
      const result = await service.파일을_생성한다(createDto);

      // Then
      expect(commandBus.execute).toHaveBeenCalledTimes(1);
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          data: createDto,
        }),
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('위키를_수정한다', () => {
    it('UpdateWikiCommand를 실행해야 한다', async () => {
      // Given
      const wikiId = 'wiki-1';
      const updateDto = {
        name: '수정된 이름',
        title: '수정된 제목',
        content: '수정된 내용',
        updatedBy: 'user-1',
      };

      const mockResult = {
        id: wikiId,
        ...updateDto,
      } as WikiFileSystem;

      mockCommandBus.execute.mockResolvedValue(mockResult);

      // When
      const result = await service.위키를_수정한다(wikiId, updateDto);

      // Then
      expect(commandBus.execute).toHaveBeenCalledTimes(1);
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          id: wikiId,
          data: updateDto,
        }),
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('위키_파일을_수정한다', () => {
    it('UpdateWikiFileCommand를 실행해야 한다', async () => {
      // Given
      const wikiId = 'wiki-1';
      const updateDto = {
        attachments: [
          {
            fileName: 'test.pdf',
            fileUrl: 's3://bucket/test.pdf',
            fileSize: 1024,
            mimeType: 'application/pdf',
          },
        ],
        updatedBy: 'user-1',
      };

      const mockResult = {
        id: wikiId,
        attachments: updateDto.attachments,
      } as WikiFileSystem;

      mockCommandBus.execute.mockResolvedValue(mockResult);

      // When
      const result = await service.위키_파일을_수정한다(wikiId, updateDto);

      // Then
      expect(commandBus.execute).toHaveBeenCalledTimes(1);
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          id: wikiId,
          data: updateDto,
        }),
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('위키_공개를_수정한다', () => {
    it('UpdateWikiPublicCommand를 실행해야 한다', async () => {
      // Given
      const wikiId = 'wiki-1';
      const updateDto = {
        isPublic: false,
        permissionRankIds: ['rank-1'],
        permissionPositionIds: ['pos-1'],
        permissionDepartmentIds: ['dept-1'],
        updatedBy: 'user-1',
      };

      const mockResult = {
        id: wikiId,
        isPublic: false,
      } as WikiFileSystem;

      mockCommandBus.execute.mockResolvedValue(mockResult);

      // When
      const result = await service.위키_공개를_수정한다(wikiId, updateDto);

      // Then
      expect(commandBus.execute).toHaveBeenCalledTimes(1);
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          id: wikiId,
          data: updateDto,
        }),
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('위키_경로를_수정한다', () => {
    it('UpdateWikiPathCommand를 실행해야 한다', async () => {
      // Given
      const wikiId = 'wiki-1';
      const updateDto = {
        parentId: 'new-parent-1',
        updatedBy: 'user-1',
      };

      const mockResult = {
        id: wikiId,
        parentId: 'new-parent-1',
      } as WikiFileSystem;

      mockCommandBus.execute.mockResolvedValue(mockResult);

      // When
      const result = await service.위키_경로를_수정한다(wikiId, updateDto);

      // Then
      expect(commandBus.execute).toHaveBeenCalledTimes(1);
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          id: wikiId,
          data: updateDto,
        }),
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('위키를_삭제한다', () => {
    it('DeleteWikiCommand를 실행해야 한다', async () => {
      // Given
      const wikiId = 'wiki-1';
      mockCommandBus.execute.mockResolvedValue(true);

      // When
      const result = await service.위키를_삭제한다(wikiId);

      // Then
      expect(commandBus.execute).toHaveBeenCalledTimes(1);
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          id: wikiId,
        }),
      );
      expect(result).toBe(true);
    });
  });

  describe('폴더만_삭제한다', () => {
    it('DeleteFolderOnlyCommand를 실행해야 한다', async () => {
      // Given
      const folderId = 'folder-1';
      mockCommandBus.execute.mockResolvedValue(true);

      // When
      const result = await service.폴더만_삭제한다(folderId);

      // Then
      expect(commandBus.execute).toHaveBeenCalledTimes(1);
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          id: folderId,
        }),
      );
      expect(result).toBe(true);
    });
  });

  describe('위키_상세를_조회한다', () => {
    it('GetWikiDetailQuery를 실행해야 한다', async () => {
      // Given
      const wikiId = 'wiki-1';
      const mockWiki = {
        id: wikiId,
        name: '테스트 위키',
        type: 'file',
      } as WikiFileSystem;

      mockQueryBus.execute.mockResolvedValue(mockWiki);

      // When
      const result = await service.위키_상세를_조회한다(wikiId);

      // Then
      expect(queryBus.execute).toHaveBeenCalledTimes(1);
      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          id: wikiId,
        }),
      );
      expect(result).toEqual(mockWiki);
    });
  });

  describe('폴더_자식들을_조회한다', () => {
    it('GetFolderChildrenQuery를 실행해야 한다', async () => {
      // Given
      const parentId = 'folder-1';
      const mockChildren = [
        { id: 'child-1', name: '하위 폴더', type: 'folder' },
        { id: 'child-2', name: '하위 파일', type: 'file' },
      ] as WikiFileSystem[];

      mockQueryBus.execute.mockResolvedValue(mockChildren);

      // When
      const result = await service.폴더_자식들을_조회한다(parentId);

      // Then
      expect(queryBus.execute).toHaveBeenCalledTimes(1);
      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          parentId,
        }),
      );
      expect(result).toEqual(mockChildren);
    });

    it('parentId가 null이면 루트 자식들을 조회해야 한다', async () => {
      // Given
      const mockChildren = [
        { id: 'root-1', name: '루트 폴더', type: 'folder' },
      ] as WikiFileSystem[];

      mockQueryBus.execute.mockResolvedValue(mockChildren);

      // When
      const result = await service.폴더_자식들을_조회한다(null);

      // Then
      expect(queryBus.execute).toHaveBeenCalledTimes(1);
      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          parentId: null,
        }),
      );
      expect(result).toEqual(mockChildren);
    });
  });

  describe('폴더_구조를_조회한다', () => {
    it('GetFolderStructureQuery를 실행해야 한다', async () => {
      // Given
      const ancestorId = 'folder-1';
      const mockStructure = [
        {
          wiki: { id: 'child-1', name: '하위 폴더', type: 'folder' },
          depth: 1,
        },
      ];

      mockQueryBus.execute.mockResolvedValue(mockStructure);

      // When
      const result = await service.폴더_구조를_조회한다(ancestorId);

      // Then
      expect(queryBus.execute).toHaveBeenCalledTimes(1);
      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          ancestorId,
        }),
      );
      expect(result).toEqual(mockStructure);
    });
  });

  describe('위키_경로를_조회한다', () => {
    it('GetWikiBreadcrumbQuery를 실행해야 한다', async () => {
      // Given
      const descendantId = 'file-1';
      const mockPath = [
        { id: 'root', name: '루트', type: 'folder' },
        { id: 'folder-1', name: '폴더 1', type: 'folder' },
        { id: 'file-1', name: '파일 1', type: 'file' },
      ] as WikiFileSystem[];

      mockQueryBus.execute.mockResolvedValue(mockPath);

      // When
      const result = await service.위키_경로를_조회한다(descendantId);

      // Then
      expect(queryBus.execute).toHaveBeenCalledTimes(1);
      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          descendantId,
        }),
      );
      expect(result).toEqual(mockPath);
    });
  });

  describe('위키를_검색한다', () => {
    it('SearchWikiQuery를 실행해야 한다', async () => {
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

      mockQueryBus.execute.mockResolvedValue(mockResults);

      // When
      const result = await service.위키를_검색한다(query);

      // Then
      expect(queryBus.execute).toHaveBeenCalledTimes(1);
      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          query,
        }),
      );
      expect(result).toEqual(mockResults);
    });
  });

  describe('모든_위키를_조회한다', () => {
    it('WikiFileSystemService를 호출하여 모든 위키를 조회해야 한다', async () => {
      // Given
      const mockWikis = [
        { id: 'wiki-1', name: '위키 1', type: 'folder' },
        { id: 'wiki-2', name: '위키 2', type: 'file' },
      ] as WikiFileSystem[];

      mockWikiFileSystemService.모든_위키를_조회한다.mockResolvedValue(
        mockWikis,
      );

      // When
      const result = await service.모든_위키를_조회한다();

      // Then
      expect(wikiFileSystemService.모든_위키를_조회한다).toHaveBeenCalledTimes(
        1,
      );
      expect(result).toEqual(mockWikis);
    });
  });
});
