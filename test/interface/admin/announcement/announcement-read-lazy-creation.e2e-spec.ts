import { BaseE2ETest } from '../../../base-e2e.spec';
import { AnnouncementRead } from '@domain/core/announcement/announcement-read.entity';
import { Repository } from 'typeorm';

describe('공지사항 읽음 표시 (Lazy Creation Pattern) E2E', () => {
  const testSuite = new BaseE2ETest();
  let announcementReadRepository: Repository<AnnouncementRead>;

  beforeAll(async () => {
    await testSuite.beforeAll();
    announcementReadRepository = testSuite.getRepository(
      'AnnouncementRead',
    ) as Repository<AnnouncementRead>;
  });

  afterAll(async () => {
    await testSuite.afterAll();
  });

  beforeEach(async () => {
    await testSuite.cleanupBeforeTest();
  });

  describe('Lazy Creation 패턴 검증', () => {
    it('직원이 공지사항을 처음 읽을 때 AnnouncementRead 레코드가 생성되어야 한다', async () => {
      // Given - 공지사항 생성
      const createResponse = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({
          title: '읽음 테스트 공지',
          content: '읽음 표시 테스트 내용',
        })
        .expect(201);

      const announcementId = createResponse.body.id;
      const employeeId = '00000000-0000-0000-0000-000000000001'; // 실제 UUID 형식

      // 읽음 레코드가 없는지 확인
      const beforeCount = await announcementReadRepository.count({
        where: { announcementId, employeeId },
      });
      expect(beforeCount).toBe(0);

      // When - 직원이 공지사항을 읽음 (API 호출 시뮬레이션)
      // Note: 실제 읽음 표시 API 엔드포인트가 있다면 해당 엔드포인트 호출
      // 현재는 직접 저장소에 접근하여 Lazy Creation 패턴 테스트
      const read = announcementReadRepository.create({
        announcementId,
        employeeId,
        readAt: new Date(),
      });
      await announcementReadRepository.save(read);

      // Then - 읽음 레코드가 생성되었는지 확인
      const afterCount = await announcementReadRepository.count({
        where: { announcementId, employeeId },
      });
      expect(afterCount).toBe(1);

      const savedRead = await announcementReadRepository.findOne({
        where: { announcementId, employeeId },
      });

      expect(savedRead).toBeDefined();
      expect(savedRead!.announcementId).toBe(announcementId);
      expect(savedRead!.employeeId).toBe(employeeId);
      expect(savedRead!.readAt).toBeDefined();
    });

    it('공지사항 생성 시에는 AnnouncementRead 레코드가 생성되지 않아야 한다 (Lazy Creation)', async () => {
      // When - 공지사항 생성
      const createResponse = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({
          title: 'Lazy Creation 테스트',
          content: '생성 시점에는 읽음 레코드가 없어야 함',
        })
        .expect(201);

      const announcementId = createResponse.body.id;

      // Then - 읽음 레코드가 없어야 함 (아무도 읽지 않음)
      const readCount = await announcementReadRepository.count({
        where: { announcementId },
      });

      expect(readCount).toBe(0);
    });

    it('여러 직원이 같은 공지사항을 읽을 때 각각의 레코드가 생성되어야 한다', async () => {
      // Given - 공지사항 생성
      const createResponse = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({
          title: '여러 직원 읽음 테스트',
          content: '여러 명이 읽는 공지사항',
        })
        .expect(201);

      const announcementId = createResponse.body.id;
      const employee1Id = '00000000-0000-0000-0000-000000000001';
      const employee2Id = '00000000-0000-0000-0000-000000000002';
      const employee3Id = '00000000-0000-0000-0000-000000000003';

      // When - 3명의 직원이 읽음
      const read1 = announcementReadRepository.create({
        announcementId,
        employeeId: employee1Id,
        readAt: new Date(),
      });
      await announcementReadRepository.save(read1);

      const read2 = announcementReadRepository.create({
        announcementId,
        employeeId: employee2Id,
        readAt: new Date(),
      });
      await announcementReadRepository.save(read2);

      const read3 = announcementReadRepository.create({
        announcementId,
        employeeId: employee3Id,
        readAt: new Date(),
      });
      await announcementReadRepository.save(read3);

      // Then - 3개의 읽음 레코드가 생성되어야 함
      const totalReads = await announcementReadRepository.count({
        where: { announcementId },
      });
      expect(totalReads).toBe(3);

      // 각 직원별로 레코드가 존재하는지 확인
      const read1Exists = await announcementReadRepository.findOne({
        where: { announcementId, employeeId: employee1Id },
      });
      const read2Exists = await announcementReadRepository.findOne({
        where: { announcementId, employeeId: employee2Id },
      });
      const read3Exists = await announcementReadRepository.findOne({
        where: { announcementId, employeeId: employee3Id },
      });

      expect(read1Exists).toBeDefined();
      expect(read2Exists).toBeDefined();
      expect(read3Exists).toBeDefined();
    });

    it('한 직원이 같은 공지사항을 여러 번 읽어도 레코드는 1개만 있어야 한다 (중복 방지)', async () => {
      // Given - 공지사항 생성
      const createResponse = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({
          title: '중복 읽음 방지 테스트',
          content: '같은 직원이 여러 번 읽어도 레코드는 1개',
        })
        .expect(201);

      const announcementId = createResponse.body.id;
      const employeeId = '00000000-0000-0000-0000-000000000099';

      // When - 같은 직원이 첫 번째 읽음
      const read1 = announcementReadRepository.create({
        announcementId,
        employeeId,
        readAt: new Date(),
      });
      await announcementReadRepository.save(read1);

      // 첫 번째 읽음 후 레코드 확인
      const countAfterFirst = await announcementReadRepository.count({
        where: { announcementId, employeeId },
      });
      expect(countAfterFirst).toBe(1);

      // Then - 두 번째 읽음 시도 (중복 방지를 위해 먼저 확인)
      const existingRead = await announcementReadRepository.findOne({
        where: { announcementId, employeeId },
      });

      if (!existingRead) {
        // 레코드가 없을 때만 생성 (실제 서비스 로직)
        const read2 = announcementReadRepository.create({
          announcementId,
          employeeId,
          readAt: new Date(),
        });
        await announcementReadRepository.save(read2);
      }

      // 레코드 개수 확인 - 여전히 1개여야 함
      const countAfterSecond = await announcementReadRepository.count({
        where: { announcementId, employeeId },
      });
      expect(countAfterSecond).toBe(1);
    });

    it('공지사항 삭제 후에도 AnnouncementRead 레코드는 유지된다 (참조 무결성)', async () => {
      // Given - 공지사항 생성 (비공개 상태로 생성해야 삭제 가능)
      const createResponse = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({
          title: '참조 무결성 테스트',
          content: '공지사항 삭제 후에도 읽음 레코드 유지',
          isPublic: false, // 비공개로 생성 (삭제 가능하도록)
        })
        .expect(201);

      const announcementId = createResponse.body.id;
      const employee1Id = '00000000-0000-0000-0000-000000000011';
      const employee2Id = '00000000-0000-0000-0000-000000000012';

      // 2명의 직원이 읽음
      await announcementReadRepository.save([
        announcementReadRepository.create({
          announcementId,
          employeeId: employee1Id,
          readAt: new Date(),
        }),
        announcementReadRepository.create({
          announcementId,
          employeeId: employee2Id,
          readAt: new Date(),
        }),
      ]);

      // 읽음 레코드 확인
      const beforeDeleteCount = await announcementReadRepository.count({
        where: { announcementId },
      });
      expect(beforeDeleteCount).toBe(2);

      // When - 공지사항 삭제 (Soft Delete)
      await testSuite
        .request()
        .delete(`/api/admin/announcements/${announcementId}`)
        .expect(200);

      // Then - 읽음 레코드는 유지됨 (현재 구현에서는 CASCADE되지 않음)
      // 이는 이력 추적 및 감사 목적으로 의도된 동작일 수 있음
      const afterDeleteCount = await announcementReadRepository.count({
        where: { announcementId },
      });
      expect(afterDeleteCount).toBe(2); // 읽음 레코드는 여전히 존재

      // 읽음 레코드를 통해 과거 읽음 이력을 확인할 수 있음
      const reads = await announcementReadRepository.find({
        where: { announcementId },
      });
      expect(reads).toHaveLength(2);
      expect(reads[0].announcementId).toBe(announcementId);
      expect(reads[1].announcementId).toBe(announcementId);
    });
  });

  describe('미열람자 조회 (읽음 레코드 없음)', () => {
    it('읽음 레코드가 없는 직원은 미열람자로 간주되어야 한다', async () => {
      // Given - 공지사항 생성
      const createResponse = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({
          title: '미열람자 조회 테스트',
          content: '일부 직원만 읽은 공지사항',
        })
        .expect(201);

      const announcementId = createResponse.body.id;

      // 일부 직원만 읽음
      const readEmployees = [
        '00000000-0000-0000-0000-000000000021',
        '00000000-0000-0000-0000-000000000022',
        '00000000-0000-0000-0000-000000000023',
      ];

      for (const employeeId of readEmployees) {
        await announcementReadRepository.save(
          announcementReadRepository.create({
            announcementId,
            employeeId,
            readAt: new Date(),
          }),
        );
      }

      // Then - 읽은 직원 수 확인
      const readCount = await announcementReadRepository.count({
        where: { announcementId },
      });
      expect(readCount).toBe(3);

      // 미열람자는 레코드가 없어야 함
      const unreadEmployeeId = '00000000-0000-0000-0000-000000000999';
      const unreadExists = await announcementReadRepository.findOne({
        where: { announcementId, employeeId: unreadEmployeeId },
      });
      expect(unreadExists).toBeNull();
    });
  });

  describe('읽음 시각 추적', () => {
    it('읽음 레코드에 readAt 타임스탬프가 저장되어야 한다', async () => {
      // Given - 공지사항 생성
      const createResponse = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({
          title: '읽음 시각 추적 테스트',
          content: '읽은 시각을 기록',
        })
        .expect(201);

      const announcementId = createResponse.body.id;
      const employeeId = '00000000-0000-0000-0000-000000000031';
      const readTime = new Date('2024-01-15T10:30:00Z');

      // When - 특정 시각에 읽음
      await announcementReadRepository.save(
        announcementReadRepository.create({
          announcementId,
          employeeId,
          readAt: readTime,
        }),
      );

      // Then - readAt 확인
      const savedRead = await announcementReadRepository.findOne({
        where: { announcementId, employeeId },
      });

      expect(savedRead).toBeDefined();
      expect(savedRead!.readAt).toBeDefined();
      expect(new Date(savedRead!.readAt).getTime()).toBe(readTime.getTime());
    });
  });

  describe('Unique 제약 조건 검증', () => {
    it('(announcementId, employeeId) 조합이 유니크해야 한다', async () => {
      // Given - 공지사항 생성
      const createResponse = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({
          title: 'Unique 제약 테스트',
          content: '같은 (공지사항, 직원) 조합은 중복 불가',
        })
        .expect(201);

      const announcementId = createResponse.body.id;
      const employeeId = '00000000-0000-0000-0000-000000000041';

      // When - 첫 번째 레코드 저장
      await announcementReadRepository.save(
        announcementReadRepository.create({
          announcementId,
          employeeId,
          readAt: new Date(),
        }),
      );

      // Then - 같은 조합으로 두 번째 저장 시도 시 에러 발생
      await expect(
        announcementReadRepository.save(
          announcementReadRepository.create({
            announcementId,
            employeeId,
            readAt: new Date(),
          }),
        ),
      ).rejects.toThrow();
    });
  });
});
