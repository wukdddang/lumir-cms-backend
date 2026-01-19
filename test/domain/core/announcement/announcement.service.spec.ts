import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnnouncementService } from '@domain/core/announcement/announcement.service';
import { Announcement } from '@domain/core/announcement/announcement.entity';
import { AnnouncementRead } from '@domain/core/announcement/announcement-read.entity';
import { AnnouncementPermissionLog } from '@domain/core/announcement/announcement-permission-log.entity';
import { NotFoundException } from '@nestjs/common';

describe('AnnouncementService - 읽음 표시 (Lazy Creation)', () => {
  let service: AnnouncementService;
  let announcementRepository: jest.Mocked<Repository<Announcement>>;
  let readRepository: jest.Mocked<Repository<AnnouncementRead>>;

  const mockAnnouncementRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
    remove: jest.fn(),
  };

  const mockReadRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
    remove: jest.fn(),
  };

  const mockPermissionLogRepository = {
    find: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnnouncementService,
        {
          provide: getRepositoryToken(Announcement),
          useValue: mockAnnouncementRepository,
        },
        {
          provide: getRepositoryToken(AnnouncementRead),
          useValue: mockReadRepository,
        },
        {
          provide: getRepositoryToken(AnnouncementPermissionLog),
          useValue: mockPermissionLogRepository,
        },
      ],
    }).compile();

    service = module.get<AnnouncementService>(AnnouncementService);
    announcementRepository = module.get(getRepositoryToken(Announcement));
    readRepository = module.get(getRepositoryToken(AnnouncementRead));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('공지사항_읽음_표시를_한다 (Lazy Creation)', () => {
    const announcementId = 'announcement-uuid-1';
    const employeeId = 'employee-uuid-1';

    const mockAnnouncement: Announcement = {
      id: announcementId,
      title: '테스트 공지사항',
      content: '테스트 내용',
      isPublic: true,
      isFixed: false,
      mustRead: false,
      order: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Announcement;

    it('직원이 처음 공지사항을 읽을 때 AnnouncementRead 레코드를 생성해야 한다 (Lazy Creation)', async () => {
      // Given - 공지사항이 존재하고, 아직 읽지 않은 상태
      mockAnnouncementRepository.findOne.mockResolvedValue(mockAnnouncement);
      mockReadRepository.findOne.mockResolvedValue(null); // 읽음 레코드 없음

      const newRead: AnnouncementRead = {
        id: 'read-uuid-1',
        announcementId,
        employeeId,
        readAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as AnnouncementRead;

      mockReadRepository.create.mockReturnValue(newRead);
      mockReadRepository.save.mockResolvedValue(newRead);

      // When
      const result = await service.공지사항_읽음_표시를_한다(
        announcementId,
        employeeId,
      );

      // Then
      expect(mockAnnouncementRepository.findOne).toHaveBeenCalledWith({
        where: { id: announcementId },
        relations: ['survey', 'survey.questions'],
      });
      expect(mockReadRepository.findOne).toHaveBeenCalledWith({
        where: { announcementId, employeeId },
      });
      expect(mockReadRepository.create).toHaveBeenCalledWith({
        announcementId,
        employeeId,
        readAt: expect.any(Date),
      });
      expect(mockReadRepository.save).toHaveBeenCalledWith(newRead);
      expect(result).toEqual(newRead);
      expect(result.announcementId).toBe(announcementId);
      expect(result.employeeId).toBe(employeeId);
    });

    it('이미 읽은 공지사항은 중복 레코드를 생성하지 않고 기존 레코드를 반환해야 한다', async () => {
      // Given - 공지사항이 존재하고, 이미 읽음 레코드가 있음
      mockAnnouncementRepository.findOne.mockResolvedValue(mockAnnouncement);

      const existingRead: AnnouncementRead = {
        id: 'read-uuid-1',
        announcementId,
        employeeId,
        readAt: new Date('2024-01-01'),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      } as AnnouncementRead;

      mockReadRepository.findOne.mockResolvedValue(existingRead);

      // When
      const result = await service.공지사항_읽음_표시를_한다(
        announcementId,
        employeeId,
      );

      // Then
      expect(mockAnnouncementRepository.findOne).toHaveBeenCalledWith({
        where: { id: announcementId },
        relations: ['survey', 'survey.questions'],
      });
      expect(mockReadRepository.findOne).toHaveBeenCalledWith({
        where: { announcementId, employeeId },
      });
      expect(mockReadRepository.create).not.toHaveBeenCalled(); // 새 레코드 생성 안 함
      expect(mockReadRepository.save).not.toHaveBeenCalled(); // 저장 안 함
      expect(result).toEqual(existingRead);
    });

    it('존재하지 않는 공지사항에 대해 읽음 표시 시 NotFoundException이 발생해야 한다', async () => {
      // Given - 공지사항이 존재하지 않음
      mockAnnouncementRepository.findOne.mockResolvedValue(null);

      // When & Then
      await expect(
        service.공지사항_읽음_표시를_한다(announcementId, employeeId),
      ).rejects.toThrow(NotFoundException);

      expect(mockAnnouncementRepository.findOne).toHaveBeenCalledWith({
        where: { id: announcementId },
        relations: ['survey', 'survey.questions'],
      });
      expect(mockReadRepository.findOne).not.toHaveBeenCalled();
      expect(mockReadRepository.create).not.toHaveBeenCalled();
      expect(mockReadRepository.save).not.toHaveBeenCalled();
    });

    it('여러 직원이 같은 공지사항을 읽을 때 각각의 AnnouncementRead 레코드가 생성되어야 한다', async () => {
      // Given
      const employee1Id = 'employee-uuid-1';
      const employee2Id = 'employee-uuid-2';

      mockAnnouncementRepository.findOne.mockResolvedValue(mockAnnouncement);

      // 직원 1 - 읽음 레코드 없음
      mockReadRepository.findOne.mockResolvedValueOnce(null);
      const read1: AnnouncementRead = {
        id: 'read-uuid-1',
        announcementId,
        employeeId: employee1Id,
        readAt: new Date(),
      } as AnnouncementRead;
      mockReadRepository.create.mockReturnValueOnce(read1);
      mockReadRepository.save.mockResolvedValueOnce(read1);

      // 직원 2 - 읽음 레코드 없음
      mockReadRepository.findOne.mockResolvedValueOnce(null);
      const read2: AnnouncementRead = {
        id: 'read-uuid-2',
        announcementId,
        employeeId: employee2Id,
        readAt: new Date(),
      } as AnnouncementRead;
      mockReadRepository.create.mockReturnValueOnce(read2);
      mockReadRepository.save.mockResolvedValueOnce(read2);

      // When
      const result1 = await service.공지사항_읽음_표시를_한다(
        announcementId,
        employee1Id,
      );
      const result2 = await service.공지사항_읽음_표시를_한다(
        announcementId,
        employee2Id,
      );

      // Then
      expect(mockReadRepository.create).toHaveBeenCalledTimes(2);
      expect(mockReadRepository.save).toHaveBeenCalledTimes(2);
      expect(result1.employeeId).toBe(employee1Id);
      expect(result2.employeeId).toBe(employee2Id);
    });
  });

  describe('읽음_여부를_확인한다', () => {
    const announcementId = 'announcement-uuid-1';
    const employeeId = 'employee-uuid-1';

    it('읽음 레코드가 있으면 true를 반환해야 한다', async () => {
      // Given
      mockReadRepository.count.mockResolvedValue(1);

      // When
      const result = await service.읽음_여부를_확인한다(
        announcementId,
        employeeId,
      );

      // Then
      expect(mockReadRepository.count).toHaveBeenCalledWith({
        where: { announcementId, employeeId },
      });
      expect(result).toBe(true);
    });

    it('읽음 레코드가 없으면 false를 반환해야 한다 (Lazy Creation - 레코드 없음)', async () => {
      // Given
      mockReadRepository.count.mockResolvedValue(0);

      // When
      const result = await service.읽음_여부를_확인한다(
        announcementId,
        employeeId,
      );

      // Then
      expect(mockReadRepository.count).toHaveBeenCalledWith({
        where: { announcementId, employeeId },
      });
      expect(result).toBe(false);
    });
  });

  describe('읽은_사람_수를_조회한다', () => {
    const announcementId = 'announcement-uuid-1';

    it('공지사항을 읽은 사람 수를 반환해야 한다', async () => {
      // Given
      mockReadRepository.count.mockResolvedValue(5);

      // When
      const result = await service.읽은_사람_수를_조회한다(announcementId);

      // Then
      expect(mockReadRepository.count).toHaveBeenCalledWith({
        where: { announcementId },
      });
      expect(result).toBe(5);
    });

    it('아무도 읽지 않은 공지사항은 0을 반환해야 한다', async () => {
      // Given
      mockReadRepository.count.mockResolvedValue(0);

      // When
      const result = await service.읽은_사람_수를_조회한다(announcementId);

      // Then
      expect(mockReadRepository.count).toHaveBeenCalledWith({
        where: { announcementId },
      });
      expect(result).toBe(0);
    });
  });
});
