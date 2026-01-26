/**
 * 데이터 검증 유틸리티
 * 마이그레이션할 데이터의 유효성을 검증합니다.
 */

/**
 * 검증 결과
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * UUID 형식 검증
 */
export function isValidUuid(uuid: string): boolean {
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidPattern.test(uuid);
}

/**
 * 필수 필드 검증
 */
export function validateRequiredFields(
  entity: any,
  requiredFields: string[],
  entityName: string,
): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };

  for (const field of requiredFields) {
    if (entity[field] === undefined || entity[field] === null) {
      result.valid = false;
      result.errors.push(
        `${entityName}: 필수 필드 '${field}'가 없습니다. ID: ${entity.id}`,
      );
    }
  }

  return result;
}

/**
 * UUID 필드 검증
 */
export function validateUuidFields(
  entity: any,
  uuidFields: string[],
  entityName: string,
): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };

  for (const field of uuidFields) {
    const value = entity[field];

    if (value && !isValidUuid(value)) {
      result.valid = false;
      result.errors.push(
        `${entityName}: '${field}' 필드가 유효한 UUID가 아닙니다. 값: ${value}, ID: ${entity.id}`,
      );
    }
  }

  return result;
}

/**
 * 외래키 관계 검증
 */
export function validateForeignKeys(
  entities: any[],
  referenceEntities: any[],
  foreignKeyField: string,
  entityName: string,
): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };

  const referenceIds = new Set(referenceEntities.map((e) => e.id));

  for (const entity of entities) {
    const foreignKey = entity[foreignKeyField];

    if (foreignKey && !referenceIds.has(foreignKey)) {
      result.valid = false;
      result.errors.push(
        `${entityName}: '${foreignKeyField}'가 참조하는 ID가 존재하지 않습니다. ` +
          `값: ${foreignKey}, ID: ${entity.id}`,
      );
    }
  }

  return result;
}

/**
 * 중복 ID 검증
 */
export function validateUniqueIds(
  entities: any[],
  entityName: string,
): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };

  const ids = new Set<string>();

  for (const entity of entities) {
    if (ids.has(entity.id)) {
      result.valid = false;
      result.errors.push(`${entityName}: 중복된 ID 발견: ${entity.id}`);
    }
    ids.add(entity.id);
  }

  return result;
}

/**
 * 카테고리 엔티티 검증
 */
export function validateCategory(category: any): ValidationResult {
  const results: ValidationResult[] = [];

  results.push(
    validateRequiredFields(
      category,
      ['id', 'entityType', 'name', 'isActive', 'order'],
      'Category',
    ),
  );

  results.push(validateUuidFields(category, ['id'], 'Category'));

  return mergeValidationResults(results);
}

/**
 * 뉴스 엔티티 검증
 */
export function validateNews(news: any, categories: any[]): ValidationResult {
  const results: ValidationResult[] = [];

  results.push(
    validateRequiredFields(
      news,
      ['id', 'title', 'isPublic', 'order'],
      'News',
    ),
  );

  results.push(validateUuidFields(news, ['id', 'categoryId'], 'News'));

  // categoryId가 있으면 외래키 검증
  if (news.categoryId) {
    results.push(
      validateForeignKeys([news], categories, 'categoryId', 'News'),
    );
  }

  return mergeValidationResults(results);
}

/**
 * 페이지뷰 엔티티 검증
 */
export function validatePageView(pageView: any): ValidationResult {
  const results: ValidationResult[] = [];

  results.push(
    validateRequiredFields(
      pageView,
      ['id', 'sessionId', 'pageName', 'enterTime'],
      'PageView',
    ),
  );

  results.push(validateUuidFields(pageView, ['id'], 'PageView'));

  return mergeValidationResults(results);
}

/**
 * 비디오 갤러리 엔티티 검증
 */
export function validateVideoGallery(
  videoGallery: any,
  categories: any[],
): ValidationResult {
  const results: ValidationResult[] = [];

  results.push(
    validateRequiredFields(
      videoGallery,
      ['id', 'title', 'isPublic', 'order'],
      'VideoGallery',
    ),
  );

  results.push(
    validateUuidFields(videoGallery, ['id', 'categoryId'], 'VideoGallery'),
  );

  if (videoGallery.categoryId) {
    results.push(
      validateForeignKeys(
        [videoGallery],
        categories,
        'categoryId',
        'VideoGallery',
      ),
    );
  }

  return mergeValidationResults(results);
}

/**
 * 메인 팝업 엔티티 검증
 */
export function validateMainPopup(
  mainPopup: any,
  categories: any[],
): ValidationResult {
  const results: ValidationResult[] = [];

  results.push(
    validateRequiredFields(
      mainPopup,
      ['id', 'isPublic', 'displayStartDate', 'order'],
      'MainPopup',
    ),
  );

  results.push(
    validateUuidFields(mainPopup, ['id', 'categoryId'], 'MainPopup'),
  );

  if (mainPopup.categoryId) {
    results.push(
      validateForeignKeys([mainPopup], categories, 'categoryId', 'MainPopup'),
    );
  }

  return mergeValidationResults(results);
}

/**
 * 여러 검증 결과를 병합
 */
export function mergeValidationResults(
  results: ValidationResult[],
): ValidationResult {
  const merged: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };

  for (const result of results) {
    if (!result.valid) {
      merged.valid = false;
    }
    merged.errors.push(...result.errors);
    merged.warnings.push(...result.warnings);
  }

  return merged;
}

/**
 * 검증 결과 출력
 */
export function printValidationResult(
  result: ValidationResult,
  entityName: string,
): void {
  if (result.valid) {
    console.log(`✅ ${entityName} 검증 통과`);
  } else {
    console.error(`❌ ${entityName} 검증 실패:`);
    result.errors.forEach((error) => console.error(`  - ${error}`));
  }

  if (result.warnings.length > 0) {
    console.warn(`⚠️  ${entityName} 경고:`);
    result.warnings.forEach((warning) => console.warn(`  - ${warning}`));
  }
}
