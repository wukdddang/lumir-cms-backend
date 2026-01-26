import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEntityTypeToCategories1769415500177 implements MigrationInterface {
    name = 'AddEntityTypeToCategories1769415500177'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "wiki_file_systems" ADD "type" "public"."wiki_file_systems_type_enum" NOT NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "wiki_file_systems"."type" IS '타입 (folder|file)'`);
        await queryRunner.query(`ALTER TABLE "wiki_permission_logs" ADD "action" "public"."wiki_permission_logs_action_enum" NOT NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "wiki_permission_logs"."action" IS '처리 상태 (detected|removed|notified|resolved)'`);
        
        // categories 테이블과 관련 데이터 모두 삭제 (CASCADE)
        // MongoDB 마이그레이션으로 새로 생성할 예정
        await queryRunner.query(`TRUNCATE TABLE "categories" CASCADE`);
        
        // entityType 컬럼 추가
        await queryRunner.query(`ALTER TABLE "categories" ADD "entityType" "public"."categories_entitytype_enum" NOT NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "categories"."entityType" IS '엔티티 타입 (announcement|main_popup|shareholders_meeting|...)'`);
        await queryRunner.query(`ALTER TABLE "survey_questions" ADD "type" "public"."survey_questions_type_enum" NOT NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "survey_questions"."type" IS '질문 타입 (short_answer|paragraph|multiple_choice|...)'`);
        await queryRunner.query(`ALTER TABLE "attendees" ADD "status" "public"."attendees_status_enum" NOT NULL DEFAULT 'pending'`);
        await queryRunner.query(`COMMENT ON COLUMN "attendees"."status" IS '수강 상태 (pending|in_progress|completed|overdue)'`);
        await queryRunner.query(`ALTER TABLE "education_managements" ADD "status" "public"."education_managements_status_enum" NOT NULL DEFAULT 'scheduled'`);
        await queryRunner.query(`COMMENT ON COLUMN "education_managements"."status" IS '상태 (scheduled|in_progress|completed|cancelled|postponed)'`);
        await queryRunner.query(`ALTER TABLE "vote_results" ADD "result" "public"."vote_results_result_enum" NOT NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "vote_results"."result" IS '의결 결과 (accepted|rejected)'`);
        await queryRunner.query(`ALTER TABLE "dismissed_permission_logs" ADD "logType" "public"."dismissed_permission_logs_logtype_enum" NOT NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "dismissed_permission_logs"."logType" IS '로그 타입 (announcement | wiki)'`);
        // video_galleries.categoryId는 nullable 유지 (MongoDB에 카테고리 없는 경우 대비)
        // await queryRunner.query(`ALTER TABLE "video_galleries" DROP CONSTRAINT "FK_331644e38068825b13d0e0d7972"`);
        // await queryRunner.query(`ALTER TABLE "video_galleries" ALTER COLUMN "categoryId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "main_popups" ALTER COLUMN "categoryId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "irs" ALTER COLUMN "categoryId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "electronic_disclosures" ALTER COLUMN "categoryId" SET NOT NULL`);
        await queryRunner.query(`CREATE INDEX "idx_wiki_file_system_type" ON "wiki_file_systems" ("type") `);
        await queryRunner.query(`CREATE INDEX "idx_wiki_permission_log_action" ON "wiki_permission_logs" ("action") `);
        await queryRunner.query(`CREATE INDEX "idx_category_entity_type" ON "categories" ("entityType") `);
        await queryRunner.query(`CREATE INDEX "idx_attendee_status" ON "attendees" ("status") `);
        await queryRunner.query(`CREATE INDEX "idx_education_management_status" ON "education_managements" ("status") `);
        await queryRunner.query(`CREATE INDEX "idx_dismissed_permission_log_type_id" ON "dismissed_permission_logs" ("logType", "permissionLogId") `);
        // video_galleries 외래 키는 이미 존재하므로 추가하지 않음
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // video_galleries 외래 키는 down에서 처리하지 않음 (up에서 추가하지 않았으므로)
        await queryRunner.query(`DROP INDEX "public"."idx_dismissed_permission_log_type_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_education_management_status"`);
        await queryRunner.query(`DROP INDEX "public"."idx_attendee_status"`);
        await queryRunner.query(`DROP INDEX "public"."idx_category_entity_type"`);
        await queryRunner.query(`DROP INDEX "public"."idx_wiki_permission_log_action"`);
        await queryRunner.query(`DROP INDEX "public"."idx_wiki_file_system_type"`);
        await queryRunner.query(`ALTER TABLE "electronic_disclosures" ALTER COLUMN "categoryId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "irs" ALTER COLUMN "categoryId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "main_popups" ALTER COLUMN "categoryId" DROP NOT NULL`);
        // video_galleries.categoryId는 nullable 유지했으므로 DROP NOT NULL 불필요
        await queryRunner.query(`COMMENT ON COLUMN "dismissed_permission_logs"."logType" IS '로그 타입 (announcement | wiki)'`);
        await queryRunner.query(`ALTER TABLE "dismissed_permission_logs" DROP COLUMN "logType"`);
        await queryRunner.query(`COMMENT ON COLUMN "vote_results"."result" IS '의결 결과 (accepted|rejected)'`);
        await queryRunner.query(`ALTER TABLE "vote_results" DROP COLUMN "result"`);
        await queryRunner.query(`COMMENT ON COLUMN "education_managements"."status" IS '상태 (scheduled|in_progress|completed|cancelled|postponed)'`);
        await queryRunner.query(`ALTER TABLE "education_managements" DROP COLUMN "status"`);
        await queryRunner.query(`COMMENT ON COLUMN "attendees"."status" IS '수강 상태 (pending|in_progress|completed|overdue)'`);
        await queryRunner.query(`ALTER TABLE "attendees" DROP COLUMN "status"`);
        await queryRunner.query(`COMMENT ON COLUMN "survey_questions"."type" IS '질문 타입 (short_answer|paragraph|multiple_choice|...)'`);
        await queryRunner.query(`ALTER TABLE "survey_questions" DROP COLUMN "type"`);
        await queryRunner.query(`COMMENT ON COLUMN "categories"."entityType" IS '엔티티 타입 (announcement|main_popup|shareholders_meeting|...)'`);
        await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "entityType"`);
        await queryRunner.query(`COMMENT ON COLUMN "wiki_permission_logs"."action" IS '처리 상태 (detected|removed|notified|resolved)'`);
        await queryRunner.query(`ALTER TABLE "wiki_permission_logs" DROP COLUMN "action"`);
        await queryRunner.query(`COMMENT ON COLUMN "wiki_file_systems"."type" IS '타입 (folder|file)'`);
        await queryRunner.query(`ALTER TABLE "wiki_file_systems" DROP COLUMN "type"`);
    }

}
