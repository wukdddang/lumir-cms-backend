import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeNewsCategoryIdNullable1769413021546 implements MigrationInterface {
    name = 'MakeNewsCategoryIdNullable1769413021546'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "news" ALTER COLUMN "categoryId" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "news" ALTER COLUMN "categoryId" SET NOT NULL`);
    }

}
