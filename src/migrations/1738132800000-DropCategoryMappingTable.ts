import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * CategoryMapping 테이블 제거
 * 
 * 이유:
 * - 모든 엔티티가 categoryId 컬럼으로 Category를 직접 참조 (1:1 관계)
 * - CategoryMapping은 다대다 관계를 위한 중간 테이블이었으나 실제로 사용되지 않음
 * - 코드에서 이미 모든 참조 제거 완료
 */
export class DropCategoryMappingTable1738132800000 implements MigrationInterface {
    name = 'DropCategoryMappingTable1738132800000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // category_mappings 테이블이 존재하는 경우에만 삭제
        await queryRunner.query(`
            DROP TABLE IF EXISTS "category_mappings" CASCADE;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // category_mappings 테이블 복구
        await queryRunner.query(`
            CREATE TABLE "category_mappings" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "entityId" uuid NOT NULL,
                "categoryId" uuid NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "deletedAt" TIMESTAMP,
                "createdBy" uuid,
                "updatedBy" uuid,
                "version" integer NOT NULL DEFAULT 1,
                CONSTRAINT "PK_category_mappings" PRIMARY KEY ("id")
            );
        `);

        // 코멘트 추가
        await queryRunner.query(`
            COMMENT ON COLUMN "category_mappings"."entityId" IS '엔티티 ID';
        `);
        await queryRunner.query(`
            COMMENT ON COLUMN "category_mappings"."categoryId" IS '카테고리 ID';
        `);

        // 인덱스 생성
        await queryRunner.query(`
            CREATE INDEX "idx_category_mapping_entity" ON "category_mappings" ("entityId") 
            WHERE "deletedAt" IS NULL;
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_category_mapping_category" ON "category_mappings" ("categoryId") 
            WHERE "deletedAt" IS NULL;
        `);

        // 유니크 제약조건
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_category_mapping_unique" ON "category_mappings" ("entityId", "categoryId") 
            WHERE "deletedAt" IS NULL;
        `);

        // 외래 키 제약조건
        await queryRunner.query(`
            ALTER TABLE "category_mappings" 
            ADD CONSTRAINT "FK_category_mappings_category" 
            FOREIGN KEY ("categoryId") 
            REFERENCES "categories"("id") 
            ON DELETE CASCADE 
            ON UPDATE NO ACTION;
        `);
    }
}
