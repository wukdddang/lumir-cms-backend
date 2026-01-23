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
    // 1. 각 테이블에 category_id 컬럼 추가 (없는 경우에만)
    const tables = [
      'brochures',
      'irs',
      'electronic_disclosures',
      'shareholders_meetings',
      'announcements',
      'lumir_stories',
      'video_galleries',
      'news',
      'main_popups',
    ];

    for (const table of tables) {
      // 컬럼이 존재하는지 확인
      const columnExists = await queryRunner.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = '${table}' 
        AND column_name = 'category_id'
      `);

      // 컬럼이 없으면 추가
      if (columnExists.length === 0) {
        await queryRunner.query(`
          ALTER TABLE "${table}" 
          ADD COLUMN "category_id" uuid
        `);
      }
    }

    // 2. 각 엔티티 타입별 기본 카테고리 생성 (이미 존재하면 무시)
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

    // 3. 모든 category_id를 NOT NULL로 변경 (기본 카테고리가 할당되었으므로)
    for (const table of tables) {
      await queryRunner.query(`
        ALTER TABLE "${table}" 
        ALTER COLUMN "category_id" SET NOT NULL
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 롤백: NOT NULL 제약조건 제거 및 컬럼 삭제
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

    // 1. NOT NULL 제약조건 제거
    for (const { table } of tables) {
      const columnExists = await queryRunner.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = '${table}' 
        AND column_name = 'category_id'
      `);

      if (columnExists.length > 0) {
        await queryRunner.query(`
          ALTER TABLE "${table}" 
          ALTER COLUMN "category_id" DROP NOT NULL
        `);
      }
    }

    // 2. 각 테이블의 기본 카테고리를 null로 변경
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

    // 3. category_id 컬럼 삭제
    for (const { table } of tables) {
      await queryRunner.query(`
        ALTER TABLE "${table}" 
        DROP COLUMN IF EXISTS "category_id"
      `);
    }

    // 4. 기본 카테고리 삭제
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
