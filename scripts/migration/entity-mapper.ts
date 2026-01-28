import {
  convertObjectIdsToUuids,
  extractTimestampFromObjectId,
  objectIdToUuid,
} from './bson-parser';

/**
 * 엔티티 매퍼
 * MongoDB 문서를 PostgreSQL 엔티티로 변환합니다.
 */

/**
 * URL에서 파일 크기를 가져옵니다 (HTTP HEAD 요청 사용)
 * 실패 시 최대 3회 재시도합니다.
 */
async function getFileSizeFromUrl(url: string, retries: number = 3): Promise<number> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const https = require('https');
      const http = require('http');
      const urlModule = require('url');
      
      const parsedUrl = urlModule.parse(url);
      const protocol = parsedUrl.protocol === 'https:' ? https : http;
      
      const size = await new Promise<number>((resolve, reject) => {
        const request = protocol.request(
          url,
          { method: 'HEAD' },
          (response: any) => {
            const contentLength = response.headers['content-length'];
            if (contentLength) {
              resolve(parseInt(contentLength, 10));
            } else {
              resolve(0);
            }
          },
        );
        
        request.on('error', (error: any) => {
          reject(error);
        });
        
        // 타임아웃을 15초로 증가
        request.setTimeout(15000, () => {
          request.destroy();
          reject(new Error('Timeout'));
        });
        
        request.end();
      });

      // 성공하면 크기 반환
      if (size > 0) {
        return size;
      }
      
      // 크기가 0이면 다음 시도
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // 재시도 전 대기
      }
    } catch (error) {
      if (attempt === retries) {
        // 마지막 시도에서도 실패하면 경고 메시지 출력
        console.warn(`⚠️  파일 크기 조회 실패 (${attempt}회 시도): ${url}`);
        return 0;
      }
      // 재시도 전 대기
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  
  return 0;
}

/**
 * 언어 코드 매핑 (MongoDB → PostgreSQL)
 */
const LANGUAGE_CODE_MAP: Record<string, string> = {
  ko: 'ko',
  en: 'en',
  kr: 'ko', // 한국어 대체
  korean: 'ko',
  english: 'en',
};

/**
 * 언어 ID 캐시
 * setLanguageIds() 함수를 통해 DB에서 조회한 실제 ID로 설정됩니다.
 */
let LANGUAGE_IDS: Record<string, string> = {
  ko: '',
  en: '',
  ja: '',
  zh: '',
};

/**
 * DB에서 조회한 언어 ID로 캐시를 설정합니다.
 * 마이그레이션 스크립트 시작 시 호출되어야 합니다.
 */
export function setLanguageIds(languageIds: Record<string, string>): void {
  LANGUAGE_IDS = languageIds;
  console.log('✅ 언어 ID 매핑 설정 완료:', LANGUAGE_IDS);
}

/**
 * .env에서 기본 언어 코드 가져오기
 */
function getDefaultLanguageCode(): string {
  const envLanguage = process.env.DEFAULT_LANGUAGE_CODE?.toLowerCase() || 'ko';
  return LANGUAGE_CODE_MAP[envLanguage] || 'ko';
}

/**
 * 기본 언어 ID 가져오기
 */
function getDefaultLanguageId(): string {
  const languageCode = getDefaultLanguageCode();
  return LANGUAGE_IDS[languageCode] || LANGUAGE_IDS.ko;
}

/**
 * MongoDB의 단일 언어 데이터를 PostgreSQL translations 배열로 변환
 * MongoDB에는 translations 배열이 없고 title, content 등이 직접 저장되어 있음
 * .env의 DEFAULT_LANGUAGE_CODE 설정을 기본 언어로 사용하고,
 * 나머지 언어들은 자동 번역 대상으로 표시 (isSynced: true)
 */
function createTranslationsFromSingleLanguage(
  title: string,
  description?: string | null,
  content?: string | null,
): any[] {
  const defaultLanguageCode = getDefaultLanguageCode();
  const allLanguageCodes = ['ko', 'en', 'ja', 'zh']; // 지원하는 모든 언어
  
  return allLanguageCodes.map(langCode => {
    const isDefaultLanguage = langCode === defaultLanguageCode;
    
    return {
      languageId: LANGUAGE_IDS[langCode],
      title: isDefaultLanguage ? (title || '') : (title || ''), // 모든 언어에 동일한 원본 텍스트
      description: isDefaultLanguage ? (description || null) : (description || null),
      content: isDefaultLanguage ? (content || null) : (content || null),
      isSynced: !isDefaultLanguage, // 기본 언어는 false(원본), 나머지는 true(자동 번역 대상)
    };
  });
}

/**
 * MongoDB files 배열을 PostgreSQL attachments 배열로 변환
 * - fileSize가 없는 경우 실제 파일에서 크기를 가져옵니다.
 * - fileUrl을 전체 URL 형식으로 저장합니다 (AWS_ENDPOINT와 결합)
 */
async function mapFiles(mongoFiles: any[]): Promise<any[] | null> {
  if (!mongoFiles || !Array.isArray(mongoFiles) || mongoFiles.length === 0) {
    return null;
  }

  const awsEndpoint = process.env.AWS_ENDPOINT || '';
  
  const mappedFiles = await Promise.all(
    mongoFiles.map(async (file) => {
      const fileUrl = file.filePath || file.url || '';
      let fileSize = file.fileSize || 0;
      
      // fileUrl을 전체 URL로 변환 (상대 경로인 경우 AWS_ENDPOINT와 결합)
      const fullUrl = fileUrl.startsWith('http') 
        ? fileUrl 
        : (awsEndpoint ? `${awsEndpoint}/${fileUrl}` : fileUrl);
      
      // fileSize가 0이고 AWS_ENDPOINT가 설정되어 있으면 실제 파일에서 크기 가져오기
      if (fileSize === 0 && awsEndpoint && fullUrl) {
        fileSize = await getFileSizeFromUrl(fullUrl);
        
        if (fileSize > 0) {
          console.log(`  ✅ 파일 크기 조회 성공: ${fileUrl} (${(fileSize / 1024).toFixed(2)} KB)`);
        }
      }
      
      return {
        fileName: file.fileName || '',
        fileUrl: fullUrl, // 전체 URL 저장
        fileSize: fileSize,
        mimeType: file.mimeType || getMimeTypeFromFileName(file.fileName),
      };
    })
  );

  return mappedFiles;
}

/**
 * 파일명에서 MIME 타입 추정
 */
function getMimeTypeFromFileName(fileName: string): string {
  const ext = fileName?.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    pdf: 'application/pdf',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };
  return mimeTypes[ext || ''] || 'application/octet-stream';
}

/**
 * MongoDB translations를 PostgreSQL translations로 변환
 * (이 함수는 실제로 translations 배열이 있는 경우를 위해 남겨둠)
 */
function mapTranslations(mongoTranslations: any[], parentId: string): any[] {
  if (!mongoTranslations || !Array.isArray(mongoTranslations)) {
    return [];
  }

  return mongoTranslations
    .filter((t) => t && (t.title || t.description || t.content))
    .map((t) => {
      const langCode = LANGUAGE_CODE_MAP[t.lang?.toLowerCase()] || 'ko';
      const languageId = LANGUAGE_IDS[langCode] || LANGUAGE_IDS.ko;

      return {
        languageId,
        title: t.title || '',
        description: t.description || null,
        content: t.content || null,
        isSynced: false,
      };
    });
}

/**
 * BaseEntity 공통 필드를 추가합니다.
 */
function addBaseEntityFields(doc: any, mongoDoc: any): any {
  const createdAt = mongoDoc.createdAt || extractTimestampFromObjectId(mongoDoc._id);

  return {
    ...doc,
    createdAt,
    updatedAt: mongoDoc.updatedAt || createdAt,
    createdBy: null,
    updatedBy: null,
    deletedAt: null,
    version: 1,
  };
}

/**
 * categories 컬렉션 매핑
 */
export function mapCategory(mongoDoc: any): any {
  const doc = convertObjectIdsToUuids(mongoDoc);

  return addBaseEntityFields(
    {
      id: doc.id,
      entityType: doc.type || doc.entityType || 'announcement', // 기본값
      name: doc.name,
      description: doc.description || null,
      isActive: doc.isActive !== false, // 기본값 true
      order: doc.order || 0,
    },
    mongoDoc,
  );
}

/**
 * news 컬렉션을 lumir_stories로 매핑
 */
export function mapLumirStory(
  mongoDoc: any, 
  categoryIdMap: Map<string, string>,
  defaultCategoryId?: string,
): any {
  const doc = convertObjectIdsToUuids(mongoDoc);

  // categoryId 매핑 (MongoDB ObjectId → PostgreSQL UUID)
  // MongoDB에서 category._id 또는 categoryId 필드에서 추출
  let categoryId: string | null = null;
  
  if (mongoDoc.category && mongoDoc.category._id) {
    // category 객체에서 _id 추출
    const mongoCategoryId = objectIdToUuid(mongoDoc.category._id);
    const mappedId = categoryIdMap.get(mongoCategoryId);
    categoryId = mappedId || null;
  } else if (doc.categoryId) {
    // 직접 categoryId가 있는 경우
    const mappedId = categoryIdMap.get(doc.categoryId);
    categoryId = mappedId || null;
  }

  // categoryId가 없으면 기본 카테고리 사용
  if (!categoryId && defaultCategoryId) {
    categoryId = defaultCategoryId;
  }

  return addBaseEntityFields(
    {
      id: doc.id,
      title: doc.title,
      content: doc.content || doc.description || '',
      categoryId: categoryId || defaultCategoryId,
      imageUrl: doc.imageUrl || doc.thumbnailUrl || null,
      isPublic: doc.isPublic !== false,
      attachments: doc.attachments || null,
      order: doc.order || 0,
    },
    mongoDoc,
  );
}

/**
 * pressreleases 컬렉션을 news로 매핑
 */
export function mapPressReleaseToNews(
  mongoDoc: any,
  categoryIdMap: Map<string, string>,
  defaultCategoryId?: string,
): any {
  const doc = convertObjectIdsToUuids(mongoDoc);

  return addBaseEntityFields(
    {
      id: doc.id,
      title: doc.title,
      description: doc.description || doc.content || null,
      url: doc.url || doc.link || null,
      isPublic: doc.isPublic !== false,
      attachments: doc.attachments || null,
      order: doc.order || 0,
      categoryId: defaultCategoryId || null,
    },
    mongoDoc,
  );
}

/**
 * videos 컬렉션을 video_galleries로 매핑
 */
export function mapVideoGallery(
  mongoDoc: any,
  categoryIdMap: Map<string, string>,
  defaultCategoryId?: string,
): any {
  const doc = convertObjectIdsToUuids(mongoDoc);

  // categoryId 매핑 (MongoDB ObjectId → PostgreSQL UUID)
  let categoryId: string | null = null;
  
  // category 객체에서 _id 추출 (news와 동일한 로직)
  if (mongoDoc.category && mongoDoc.category._id) {
    const mongoCategoryId = objectIdToUuid(mongoDoc.category._id);
    const mappedId = categoryIdMap.get(mongoCategoryId);
    categoryId = mappedId || null;
  } else if (doc.categoryId) {
    // 직접 categoryId가 있는 경우
    const mappedId = categoryIdMap.get(doc.categoryId);
    categoryId = mappedId || null;
  }

  // categoryId가 없으면 기본 카테고리 사용
  if (!categoryId && defaultCategoryId) {
    categoryId = defaultCategoryId;
  }

  return addBaseEntityFields(
    {
      id: doc.id,
      title: doc.title,
      description: doc.description || null,
      videoUrl: doc.videoUrl || doc.url || null,
      thumbnailUrl: doc.thumbnailUrl || doc.thumbnail || null,
      isPublic: doc.isPublic !== false,
      order: doc.order || 0,
      categoryId: categoryId || defaultCategoryId,
    },
    mongoDoc,
  );
}

/**
 * irmaterials 컬렉션을 irs로 매핑
 */
export async function mapIR(
  mongoDoc: any, 
  categoryIdMap: Map<string, string>,
  defaultCategoryId?: string,
): Promise<any> {
  const doc = convertObjectIdsToUuids(mongoDoc);

  let categoryId = doc.categoryId;
  if (categoryId && categoryIdMap.has(categoryId)) {
    categoryId = categoryIdMap.get(categoryId);
  }

  // categoryId가 없으면 기본 카테고리 사용
  if (!categoryId && defaultCategoryId) {
    categoryId = defaultCategoryId;
  }

  // files 배열을 attachments로 변환
  const attachments = await mapFiles(mongoDoc.files);

  const baseEntity = addBaseEntityFields(
    {
      id: doc.id,
      isPublic: doc.isPublic !== false,
      attachments: attachments,
      order: doc.order || 0,
      categoryId: categoryId || null,
    },
    mongoDoc,
  );

  // MongoDB의 title, content를 한국어 translation으로 변환
  if (mongoDoc.title) {
    baseEntity.translations = createTranslationsFromSingleLanguage(
      mongoDoc.title,
      mongoDoc.description,
      mongoDoc.content,
    );
  }

  return baseEntity;
}

/**
 * managementdisclosures 컬렉션을 electronic_disclosures로 매핑
 */
export async function mapElectronicDisclosure(
  mongoDoc: any,
  categoryIdMap: Map<string, string>,
  defaultCategoryId?: string,
): Promise<any> {
  const doc = convertObjectIdsToUuids(mongoDoc);

  let categoryId = doc.categoryId;
  if (categoryId && categoryIdMap.has(categoryId)) {
    categoryId = categoryIdMap.get(categoryId);
  }

  // categoryId가 없으면 기본 카테고리 사용
  if (!categoryId && defaultCategoryId) {
    categoryId = defaultCategoryId;
  }

  // files 배열을 attachments로 변환
  const attachments = await mapFiles(mongoDoc.files);

  const baseEntity = addBaseEntityFields(
    {
      id: doc.id,
      isPublic: doc.isPublic !== false,
      attachments: attachments,
      order: doc.order || 0,
      categoryId: categoryId || null,
    },
    mongoDoc,
  );

  // MongoDB의 title, content를 한국어 translation으로 변환
  if (mongoDoc.title) {
    baseEntity.translations = createTranslationsFromSingleLanguage(
      mongoDoc.title,
      mongoDoc.description,
      mongoDoc.content,
    );
  }

  return baseEntity;
}

/**
 * shareholdermeetings 컬렉션을 shareholders_meetings로 매핑
 */
export function mapShareholdersMeeting(
  mongoDoc: any,
  categoryIdMap: Map<string, string>,
  defaultCategoryId?: string,
): any {
  const doc = convertObjectIdsToUuids(mongoDoc);

  let categoryId = doc.categoryId;
  if (categoryId && categoryIdMap.has(categoryId)) {
    categoryId = categoryIdMap.get(categoryId);
  }

  // categoryId가 없으면 기본 카테고리 사용
  if (!categoryId && defaultCategoryId) {
    categoryId = defaultCategoryId;
  }

  const baseEntity = addBaseEntityFields(
    {
      id: doc.id,
      categoryId: categoryId || null,
      meetingDate: mongoDoc.date || mongoDoc.meetingDate || null,
      location: mongoDoc.location || null,
      isPublic: doc.isPublic !== false,
      order: doc.order || 0,
    },
    mongoDoc,
  );

  // MongoDB의 title을 한국어 translation으로 변환
  if (mongoDoc.title) {
    baseEntity.translations = createTranslationsFromSingleLanguage(
      mongoDoc.title,
      mongoDoc.description,
      mongoDoc.content,
    );
  }

  return baseEntity;
}

/**
 * notifications 컬렉션을 main_popups로 매핑
 */
export async function mapNotificationToMainPopup(
  mongoDoc: any,
  categoryIdMap: Map<string, string>,
  defaultCategoryId?: string,
): Promise<any> {
  const doc = convertObjectIdsToUuids(mongoDoc);

  let categoryId = doc.categoryId;
  if (categoryId && categoryIdMap.has(categoryId)) {
    categoryId = categoryIdMap.get(categoryId);
  }

  // categoryId가 없으면 기본 카테고리 사용
  if (!categoryId && defaultCategoryId) {
    categoryId = defaultCategoryId;
  }

  // pcFiles와 mobileFiles를 attachments로 통합
  const allFiles = [
    ...(mongoDoc.pcFiles || []),
    ...(mongoDoc.mobileFiles || []),
  ];
  const attachments = await mapFiles(allFiles);

  const baseEntity = addBaseEntityFields(
    {
      id: doc.id,
      isPublic: doc.isPublic !== false,
      releasedAt: mongoDoc.date || mongoDoc.startDate || mongoDoc.releasedAt || new Date(),
      imageUrl: mongoDoc.imageUrl || mongoDoc.image || null,
      linkUrl: mongoDoc.linkUrl || mongoDoc.link || null,
      order: doc.order || 0,
      categoryId: categoryId || null,
      attachments: attachments,
    },
    mongoDoc,
  );

  // MongoDB의 title을 한국어 translation으로 변환
  if (mongoDoc.title) {
    baseEntity.translations = createTranslationsFromSingleLanguage(
      mongoDoc.title,
      mongoDoc.description,
      mongoDoc.content,
    );
  }

  return baseEntity;
}

/**
 * pageviews 컬렉션을 page_views로 매핑
 */
export function mapPageView(mongoDoc: any): any {
  const doc = convertObjectIdsToUuids(mongoDoc);

  return addBaseEntityFields(
    {
      id: doc.id,
      sessionId: doc.sessionId,
      pageName: doc.pageName,
      title: doc.title || null,
      enterTime: doc.enterTime || extractTimestampFromObjectId(mongoDoc._id),
      exitTime: doc.exitTime || null,
      stayDuration: doc.stayDuration || null,
    },
    mongoDoc,
  );
}

/**
 * users 컬렉션을 migration_users로 매핑
 */
export function mapMigrationUser(mongoDoc: any): any {
  const doc = convertObjectIdsToUuids(mongoDoc);

  return addBaseEntityFields(
    {
      id: doc.id,
      accountId: doc.accountId,
      password: doc.password,
      name: doc.name,
      email: doc.email || null,
    },
    mongoDoc,
  );
}

/**
 * 카테고리 ID 매핑 맵 생성
 * MongoDB ObjectId → PostgreSQL UUID 매핑
 */
export function createCategoryIdMap(categories: any[]): Map<string, string> {
  const map = new Map<string, string>();

  for (const category of categories) {
    if (category._id) {
      const mongoId = category._id;
      const pgId = objectIdToUuid(mongoId);
      map.set(mongoId, pgId);
    }
  }

  return map;
}
