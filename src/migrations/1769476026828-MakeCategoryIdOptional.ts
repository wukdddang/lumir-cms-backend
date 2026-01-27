import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * CategoryId를 선택사항(nullable)으로 변경하는 마이그레이션
 * 
 * 대상 테이블:
 * - news (이미 nullable)
 * - video_galleries (이미 nullable)
 * - announcements
 * - lumir_stories
 * - shareholders_meetings
 * - main_popups (이미 nullable)
 * - brochures
 * - electronic_disclosures
 * - irs
 */
export class MakeCategoryIdOptional1769476026828 implements MigrationInterface {
    name = 'MakeCategoryIdOptional1769476026828'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. announcements - categoryId를 nullable로 변경
        await queryRunner.query(`ALTER TABLE "announcements" ALTER COLUMN "categoryId" DROP NOT NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "announcements"."categoryId" IS '공지사항 카테고리 ID (선택)'`);

        // 2. lumir_stories - categoryId를 nullable로 변경
        await queryRunner.query(`ALTER TABLE "lumir_stories" ALTER COLUMN "categoryId" DROP NOT NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "lumir_stories"."categoryId" IS '카테고리 ID (선택)'`);

        // 3. shareholders_meetings - categoryId를 nullable로 변경
        await queryRunner.query(`ALTER TABLE "shareholders_meetings" ALTER COLUMN "categoryId" DROP NOT NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "shareholders_meetings"."categoryId" IS '주주총회 카테고리 ID (선택)'`);

        // 4. brochures - categoryId를 nullable로 변경
        await queryRunner.query(`ALTER TABLE "brochures" ALTER COLUMN "categoryId" DROP NOT NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "brochures"."categoryId" IS '브로슈어 카테고리 ID (선택)'`);

        // 5. electronic_disclosures - categoryId를 nullable로 변경
        await queryRunner.query(`ALTER TABLE "electronic_disclosures" ALTER COLUMN "categoryId" DROP NOT NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "electronic_disclosures"."categoryId" IS '전자공시 카테고리 ID (선택)'`);

        // 6. irs - categoryId를 nullable로 변경
        await queryRunner.query(`ALTER TABLE "irs" ALTER COLUMN "categoryId" DROP NOT NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "irs"."categoryId" IS 'IR 카테고리 ID (선택)'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Rollback: categoryId를 다시 NOT NULL로 변경
        await queryRunner.query(`COMMENT ON COLUMN "irs"."categoryId" IS 'IR 카테고리 ID'`);
        await queryRunner.query(`ALTER TABLE "irs" ALTER COLUMN "categoryId" SET NOT NULL`);

        await queryRunner.query(`COMMENT ON COLUMN "electronic_disclosures"."categoryId" IS '전자공시 카테고리 ID'`);
        await queryRunner.query(`ALTER TABLE "electronic_disclosures" ALTER COLUMN "categoryId" SET NOT NULL`);

        await queryRunner.query(`COMMENT ON COLUMN "brochures"."categoryId" IS '브로슈어 카테고리 ID'`);
        await queryRunner.query(`ALTER TABLE "brochures" ALTER COLUMN "categoryId" SET NOT NULL`);

        await queryRunner.query(`COMMENT ON COLUMN "shareholders_meetings"."categoryId" IS '주주총회 카테고리 ID'`);
        await queryRunner.query(`ALTER TABLE "shareholders_meetings" ALTER COLUMN "categoryId" SET NOT NULL`);

        await queryRunner.query(`COMMENT ON COLUMN "lumir_stories"."categoryId" IS '카테고리 ID'`);
        await queryRunner.query(`ALTER TABLE "lumir_stories" ALTER COLUMN "categoryId" SET NOT NULL`);

        await queryRunner.query(`COMMENT ON COLUMN "announcements"."categoryId" IS '공지사항 카테고리 ID'`);
        await queryRunner.query(`ALTER TABLE "announcements" ALTER COLUMN "categoryId" SET NOT NULL`);
    }

}
