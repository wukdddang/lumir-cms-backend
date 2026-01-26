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
 * news 컬렉션 매핑
 */
export function mapNews(
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
    // 매핑이 있으면 사용, 없으면 undefined (나중에 기본 카테고리 사용)
    categoryId = mappedId || null;
  } else if (doc.categoryId) {
    // 직접 categoryId가 있는 경우
    const mappedId = categoryIdMap.get(doc.categoryId);
    // 매핑이 있으면 사용, 없으면 undefined (나중에 기본 카테고리 사용)
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
      url: doc.url || null,
      isPublic: doc.isPublic !== false,
      attachments: doc.attachments || null,
      order: doc.order || 0,
      categoryId: categoryId || null,
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
  if (doc.categoryId) {
    const mappedId = categoryIdMap.get(doc.categoryId);
    // 매핑이 있으면 사용, 없으면 null (나중에 기본 카테고리 사용)
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
      categoryId: categoryId || null,
    },
    mongoDoc,
  );
}

/**
 * irmaterials 컬렉션을 irs로 매핑
 */
export function mapIR(
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

  return addBaseEntityFields(
    {
      id: doc.id,
      isPublic: doc.isPublic !== false,
      attachments: doc.attachments || null,
      order: doc.order || 0,
      categoryId: categoryId || null,
    },
    mongoDoc,
  );
}

/**
 * managementdisclosures 컬렉션을 electronic_disclosures로 매핑
 */
export function mapElectronicDisclosure(
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

  return addBaseEntityFields(
    {
      id: doc.id,
      isPublic: doc.isPublic !== false,
      attachments: doc.attachments || null,
      order: doc.order || 0,
      categoryId: categoryId || null,
    },
    mongoDoc,
  );
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

  return addBaseEntityFields(
    {
      id: doc.id,
      categoryId: categoryId || null,
      meetingDate: doc.meetingDate || null,
      isPublic: doc.isPublic !== false,
      order: doc.order || 0,
    },
    mongoDoc,
  );
}

/**
 * notifications 컬렉션을 main_popups로 매핑
 */
export function mapNotificationToMainPopup(
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

  return addBaseEntityFields(
    {
      id: doc.id,
      isPublic: doc.isPublic !== false,
      displayStartDate: doc.startDate || doc.displayStartDate || new Date(),
      displayEndDate: doc.endDate || doc.displayEndDate || null,
      imageUrl: doc.imageUrl || doc.image || null,
      linkUrl: doc.linkUrl || doc.link || null,
      order: doc.order || 0,
      categoryId: categoryId || null,
    },
    mongoDoc,
  );
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
