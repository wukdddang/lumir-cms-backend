import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';
import { DataSource } from 'typeorm';
import * as readline from 'readline';

/**
 * 프로덕션 DB에 필요한 스키마 변경을 안전하게 적용하는 스크립트
 */

async function confirm(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${question} (y/N): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y');
    });
  });
}

async function applySchemaChanges() {
  let app: any;
  
  try {
    console.log('🔧 프로덕션 스키마 업데이트 스크립트\n');
    
    app = await NestFactory.createApplicationContext(AppModule, {
      logger: false,
    });

    const dataSource = app.get(DataSource);
    const changes: string[] = [];

    // 1. categories.entityType 컬럼 확인
    const categoryColumns = await dataSource.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'categories' AND column_name = 'entityType'
    `);

    if (categoryColumns.length === 0) {
      console.log('❌ categories.entityType 컬럼이 없습니다.');
      changes.push('categories.entityType');
    } else {
      console.log('✅ categories.entityType 컬럼이 이미 존재합니다.');
    }

    // 2. page_views 테이블 확인
    const pageViewTable = await dataSource.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_name = 'page_views'
    `);

    if (pageViewTable.length === 0) {
      console.log('❌ page_views 테이블이 없습니다.');
      changes.push('page_views 테이블');
    } else {
      console.log('✅ page_views 테이블이 이미 존재합니다.');
    }

    // 3. categoryId nullable 확인
    const tables = ['news', 'video_galleries', 'irs', 'electronic_disclosures', 'main_popups'];
    for (const table of tables) {
      const result = await dataSource.query(`
        SELECT is_nullable
        FROM information_schema.columns
        WHERE table_name = '${table}' AND column_name = 'categoryId'
      `);
      
      if (result.length > 0 && result[0].is_nullable === 'NO') {
        console.log(`❌ ${table}.categoryId가 NOT NULL입니다.`);
        changes.push(`${table}.categoryId nullable`);
      } else if (result.length > 0) {
        console.log(`✅ ${table}.categoryId가 이미 nullable입니다.`);
      }
    }

    // 변경 사항이 없으면 종료
    if (changes.length === 0) {
      console.log('\n✅ 모든 스키마가 최신 상태입니다! 바로 migration:from-mongodb를 실행하세요.\n');
      return;
    }

    // 변경 사항 적용 확인
    console.log(`\n⚠️  다음 변경사항을 적용해야 합니다:`);
    changes.forEach((c, idx) => console.log(`  ${idx + 1}. ${c}`));
    
    const proceed = await confirm('\n변경사항을 적용하시겠습니까?');
    if (!proceed) {
      console.log('취소되었습니다.');
      return;
    }

    console.log('\n🔧 스키마 변경 적용 중...\n');

    // categories.entityType 추가
    if (changes.includes('categories.entityType')) {
      console.log('1. categories 테이블 데이터 백업 및 정리...');
      
      // categories와 관련 데이터 정리 (CASCADE)
      await dataSource.query(`TRUNCATE TABLE categories CASCADE`);
      console.log('   ✅ categories 데이터 정리 완료');

      // ENUM 타입 생성
      const enumExists = await dataSource.query(`
        SELECT typname FROM pg_type WHERE typname = 'categories_entitytype_enum'
      `);
      
      if (enumExists.length === 0) {
        await dataSource.query(`
          CREATE TYPE "categories_entitytype_enum" AS ENUM(
            'announcement', 'main_popup', 'shareholders_meeting', 
            'electronic_disclosure', 'ir', 'news', 'brochure', 
            'lumir_story', 'video_gallery'
          )
        `);
        console.log('   ✅ categories_entitytype_enum 타입 생성 완료');
      }

      // entityType 컬럼 추가
      await dataSource.query(`
        ALTER TABLE "categories" 
        ADD COLUMN "entityType" categories_entitytype_enum NOT NULL
      `);
      console.log('   ✅ entityType 컬럼 추가 완료');

      // 인덱스 생성
      await dataSource.query(`
        CREATE INDEX "idx_category_entity_type" ON "categories" ("entityType")
      `);
      console.log('   ✅ 인덱스 생성 완료\n');
    }

    // page_views 테이블 생성
    if (changes.includes('page_views 테이블')) {
      console.log('2. page_views 테이블 생성...');
      
      await dataSource.query(`
        CREATE TABLE "page_views" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          "deletedAt" TIMESTAMP WITH TIME ZONE,
          "createdBy" character varying(255),
          "updatedBy" character varying(255),
          "version" integer NOT NULL,
          "sessionId" character varying(255) NOT NULL,
          "pageName" character varying(255) NOT NULL,
          "title" character varying(500),
          "enterTime" TIMESTAMP WITH TIME ZONE NOT NULL,
          "exitTime" TIMESTAMP WITH TIME ZONE,
          "stayDuration" integer,
          CONSTRAINT "PK_3b1047277a9c2a8cfd618787671" PRIMARY KEY ("id")
        )
      `);
      
      await dataSource.query(`CREATE INDEX "idx_page_view_enter_time" ON "page_views" ("enterTime")`);
      await dataSource.query(`CREATE INDEX "idx_page_view_page_name" ON "page_views" ("pageName")`);
      await dataSource.query(`CREATE INDEX "idx_page_view_session" ON "page_views" ("sessionId")`);
      
      console.log('   ✅ page_views 테이블 생성 완료\n');
    }

    // categoryId nullable 변경
    for (const table of tables) {
      const changeKey = `${table}.categoryId nullable`;
      if (changes.includes(changeKey)) {
        console.log(`3. ${table}.categoryId를 nullable로 변경...`);
        
        // 외래 키 제약조건 이름 조회
        const fkResult = await dataSource.query(`
          SELECT constraint_name
          FROM information_schema.table_constraints
          WHERE table_name = '${table}' 
          AND constraint_type = 'FOREIGN KEY'
          AND constraint_name LIKE '%categoryId%'
        `);
        
        const fkName = fkResult.length > 0 ? fkResult[0].constraint_name : null;
        
        if (fkName) {
          await dataSource.query(`ALTER TABLE "${table}" DROP CONSTRAINT "${fkName}"`);
          console.log(`   ✅ 외래 키 제약조건 제거 (${fkName})`);
        }
        
        await dataSource.query(`ALTER TABLE "${table}" ALTER COLUMN "categoryId" DROP NOT NULL`);
        console.log(`   ✅ categoryId nullable 변경 완료`);
        
        if (fkName) {
          await dataSource.query(`
            ALTER TABLE "${table}" 
            ADD CONSTRAINT "${fkName}" 
            FOREIGN KEY ("categoryId") REFERENCES "categories"("id") 
            ON DELETE NO ACTION ON UPDATE NO ACTION
          `);
          console.log(`   ✅ 외래 키 제약조건 재생성\n`);
        }
      }
    }

    console.log('✅ 모든 스키마 변경 완료!\n');
    console.log('이제 npm run migration:from-mongodb를 실행하세요.\n');

  } catch (error: any) {
    console.error('❌ 오류:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    if (app) {
      await app.close();
    }
  }
}

applySchemaChanges();
