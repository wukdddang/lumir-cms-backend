import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeAllCategoryIdNullable1769413314224 implements MigrationInterface {
    name = 'MakeAllCategoryIdNullable1769413314224'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "video_galleries" DROP CONSTRAINT "FK_331644e38068825b13d0e0d7972"`);
        await queryRunner.query(`ALTER TABLE "video_galleries" ALTER COLUMN "categoryId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "main_popups" ALTER COLUMN "categoryId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "irs" ALTER COLUMN "categoryId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "electronic_disclosures" ALTER COLUMN "categoryId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "video_galleries" ADD CONSTRAINT "FK_331644e38068825b13d0e0d7972" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "video_galleries" DROP CONSTRAINT "FK_331644e38068825b13d0e0d7972"`);
        await queryRunner.query(`ALTER TABLE "electronic_disclosures" ALTER COLUMN "categoryId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "irs" ALTER COLUMN "categoryId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "main_popups" ALTER COLUMN "categoryId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "video_galleries" ALTER COLUMN "categoryId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "video_galleries" ADD CONSTRAINT "FK_331644e38068825b13d0e0d7972" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
