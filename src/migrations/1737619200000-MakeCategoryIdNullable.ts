import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * categoryId null 값을 기본 카테고리로 설정하는 마이그레이션
 * 
 * 배경:
 * - 기존 데이터에 categoryId가 null인 데이터가 존재
 * - TypeORM synchronize로 인해 NOT NULL 제약조건 추가 시 에러 발생
 * 
 * 해결 방법:
 * 1. 각 엔티티 타입별로 "미분류" 기본 카테고리 생성
 * 2. null 값을 가진 categoryId를 기본 카테고리로 업데이트
 * 3. NOT NULL 제약조건 유지 (데이터 무결성)
 * 
 * 대상 테이블:
 * - brochures (BROCHURE)
 * - irs (IR)
 * - electronic_disclosures (ELECTRONIC_DISCLOSURE)
 * - shareholders_meetings (SHAREHOLDERS_MEETING)
 * - announcements (ANNOUNCEMENT)
 * - lumir_stories (LUMIR_STORY)
 * - video_galleries (VIDEO_GALLERY)
 * - news (NEWS)
 * - main_popups (MAIN_POPUP)
 */
export class SetDefaultCategoryForNullValues1737619200000 implements MigrationInterface {
  name = 'SetDefaultCategoryForNullValues1737619200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. 각 엔티티 타입별 기본 카테고리 생성 (이미 존재하면 무시)
    const defaultCategories = [
      { entityType: 'brochure', name: '미분류', description: '기본 브로슈어 카테고리' },
      { entityType: 'ir', name: '미분류', description: '기본 IR 카테고리' },
      { entityType: 'electronic_disclosure', name: '미분류', description: '기본 전자공시 카테고리' },
      { entityType: 'shareholders_meeting', name: '미분류', description: '기본 주주총회 카테고리' },
      { entityType: 'announcement', name: '미분류', description: '기본 공지사항 카테고리' },
      { entityType: 'lumir_story', name: '미분류', description: '기본 루미르 스토리 카테고리' },
      { entityType: 'video_gallery', name: '미분류', description: '기본 비디오 갤러리 카테고리' },
      { entityType: 'news', name: '미분류', description: '기본 뉴스 카테고리' },
      { entityType: 'main_popup', name: '미분류', description: '기본 메인 팝업 카테고리' },
    ];

    for (const category of defaultCategories) {
      await queryRunner.query(`
        INSERT INTO "categories" (id, "entity_type", name, description, "is_active", "order", "created_at", "updated_at", version)
        SELECT 
          gen_random_uuid(),
          '${category.entityType}',
          '${category.name}',
          '${category.description}',
          true,
          0,
          NOW(),
          NOW(),
          1
        WHERE NOT EXISTS (
          SELECT 1 FROM "categories" 
          WHERE "entity_type" = '${category.entityType}' 
          AND name = '${category.name}'
        )
      `);
    }

    // 2. 각 테이블의 null categoryId를 기본 카테고리로 업데이트
    
    // 2-1. brochures 테이블
    await queryRunner.query(`
      UPDATE "brochures" 
      SET "category_id" = (
        SELECT id FROM "categories" 
        WHERE "entity_type" = 'brochure' AND name = '미분류'
        LIMIT 1
      )
      WHERE "category_id" IS NULL
    `);

    // 2-2. irs 테이블
    await queryRunner.query(`
      UPDATE "irs" 
      SET "category_id" = (
        SELECT id FROM "categories" 
        WHERE "entity_type" = 'ir' AND name = '미분류'
        LIMIT 1
      )
      WHERE "category_id" IS NULL
    `);

    // 2-3. electronic_disclosures 테이블
    await queryRunner.query(`
      UPDATE "electronic_disclosures" 
      SET "category_id" = (
        SELECT id FROM "categories" 
        WHERE "entity_type" = 'electronic_disclosure' AND name = '미분류'
        LIMIT 1
      )
      WHERE "category_id" IS NULL
    `);

    // 2-4. shareholders_meetings 테이블
    await queryRunner.query(`
      UPDATE "shareholders_meetings" 
      SET "category_id" = (
        SELECT id FROM "categories" 
        WHERE "entity_type" = 'shareholders_meeting' AND name = '미분류'
        LIMIT 1
      )
      WHERE "category_id" IS NULL
    `);

    // 2-5. announcements 테이블
    await queryRunner.query(`
      UPDATE "announcements" 
      SET "category_id" = (
        SELECT id FROM "categories" 
        WHERE "entity_type" = 'announcement' AND name = '미분류'
        LIMIT 1
      )
      WHERE "category_id" IS NULL
    `);

    // 2-6. lumir_stories 테이블
    await queryRunner.query(`
      UPDATE "lumir_stories" 
      SET "category_id" = (
        SELECT id FROM "categories" 
        WHERE "entity_type" = 'lumir_story' AND name = '미분류'
        LIMIT 1
      )
      WHERE "category_id" IS NULL
    `);

    // 2-7. video_galleries 테이블
    await queryRunner.query(`
      UPDATE "video_galleries" 
      SET "category_id" = (
        SELECT id FROM "categories" 
        WHERE "entity_type" = 'video_gallery' AND name = '미분류'
        LIMIT 1
      )
      WHERE "category_id" IS NULL
    `);

    // 2-8. news 테이블
    await queryRunner.query(`
      UPDATE "news" 
      SET "category_id" = (
        SELECT id FROM "categories" 
        WHERE "entity_type" = 'news' AND name = '미분류'
        LIMIT 1
      )
      WHERE "category_id" IS NULL
    `);

    // 2-9. main_popups 테이블
    await queryRunner.query(`
      UPDATE "main_popups" 
      SET "category_id" = (
        SELECT id FROM "categories" 
        WHERE "entity_type" = 'main_popup' AND name = '미분류'
        LIMIT 1
      )
      WHERE "category_id" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 롤백: 기본 카테고리를 사용하는 데이터를 null로 되돌림
    // (주의: 이는 데이터 손실을 방지하기 위한 것이며, 실제로는 롤백하지 않는 것을 권장)

    // 각 테이블의 기본 카테고리를 null로 변경
    const tables = [
      { table: 'brochures', entityType: 'brochure' },
      { table: 'irs', entityType: 'ir' },
      { table: 'electronic_disclosures', entityType: 'electronic_disclosure' },
      { table: 'shareholders_meetings', entityType: 'shareholders_meeting' },
      { table: 'announcements', entityType: 'announcement' },
      { table: 'lumir_stories', entityType: 'lumir_story' },
      { table: 'video_galleries', entityType: 'video_gallery' },
      { table: 'news', entityType: 'news' },
      { table: 'main_popups', entityType: 'main_popup' },
    ];

    for (const { table, entityType } of tables) {
      await queryRunner.query(`
        UPDATE "${table}" 
        SET "category_id" = NULL
        WHERE "category_id" = (
          SELECT id FROM "categories" 
          WHERE "entity_type" = '${entityType}' AND name = '미분류'
          LIMIT 1
        )
      `);
    }

    // 기본 카테고리 삭제 (사용되지 않는 경우에만)
    await queryRunner.query(`
      DELETE FROM "categories" 
      WHERE name = '미분류' 
      AND "entity_type" IN (
        'brochure', 'ir', 'electronic_disclosure', 'shareholders_meeting', 
        'announcement', 'lumir_story', 'video_gallery', 'news', 'main_popup'
      )
    `);
  }
}
