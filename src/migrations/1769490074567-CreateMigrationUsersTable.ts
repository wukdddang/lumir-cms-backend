import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateMigrationUsersTable1769490074567 implements MigrationInterface {
    name = 'CreateMigrationUsersTable1769490074567'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "migration_users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "createdBy" character varying(255), "updatedBy" character varying(255), "version" integer NOT NULL, "accountId" character varying(100) NOT NULL, "password" character varying(255) NOT NULL, "name" character varying(100) NOT NULL, "email" character varying(255), CONSTRAINT "UQ_2644804b76f41ed4cd995d1a4ad" UNIQUE ("accountId"), CONSTRAINT "PK_068a459211e24640e4b555cdda5" PRIMARY KEY ("id")); COMMENT ON COLUMN "migration_users"."createdAt" IS '생성 일시'; COMMENT ON COLUMN "migration_users"."updatedAt" IS '수정 일시'; COMMENT ON COLUMN "migration_users"."deletedAt" IS '삭제 일시 (소프트 삭제)'; COMMENT ON COLUMN "migration_users"."createdBy" IS '생성자 ID'; COMMENT ON COLUMN "migration_users"."updatedBy" IS '수정자 ID'; COMMENT ON COLUMN "migration_users"."version" IS '버전 (낙관적 잠금용)'; COMMENT ON COLUMN "migration_users"."accountId" IS '계정 ID'; COMMENT ON COLUMN "migration_users"."password" IS '암호화된 비밀번호'; COMMENT ON COLUMN "migration_users"."name" IS '사용자 이름'; COMMENT ON COLUMN "migration_users"."email" IS '이메일 주소'`);
        await queryRunner.query(`COMMENT ON COLUMN "languages"."code" IS '언어 코드 (ISO 639-1 표준: ko, en, ja, zh 등)'`);
        await queryRunner.query(`ALTER TABLE "main_popups" ALTER COLUMN "categoryId" DROP NOT NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "main_popups"."categoryId" IS '메인 팝업 카테고리 ID (선택)'`);
        await queryRunner.query(`COMMENT ON COLUMN "news"."categoryId" IS '뉴스 카테고리 ID (선택)'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`COMMENT ON COLUMN "news"."categoryId" IS '뉴스 카테고리 ID'`);
        await queryRunner.query(`COMMENT ON COLUMN "main_popups"."categoryId" IS '메인 팝업 카테고리 ID'`);
        await queryRunner.query(`ALTER TABLE "main_popups" ALTER COLUMN "categoryId" SET NOT NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "languages"."code" IS '언어 코드 (ko|en|ja|zh)'`);
        await queryRunner.query(`DROP TABLE "migration_users"`);
    }

}
