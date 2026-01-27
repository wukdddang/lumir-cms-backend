import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOrderToLanguage1769491846835 implements MigrationInterface {
    name = 'AddOrderToLanguage1769491846835'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "languages" ADD "order" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`COMMENT ON COLUMN "languages"."order" IS '정렬 순서'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`COMMENT ON COLUMN "languages"."order" IS '정렬 순서'`);
        await queryRunner.query(`ALTER TABLE "languages" DROP COLUMN "order"`);
    }

}
