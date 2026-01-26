import * as bson from 'bson';
import * as fs from 'fs';
import * as path from 'path';
import { v5 as uuidv5 } from 'uuid';

/**
 * BSON 파서 유틸리티
 * MongoDB BSON 덤프 파일을 읽고 파싱합니다.
 */

// UUID 변환을 위한 고정 네임스페이스
const UUID_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

/**
 * ObjectId를 결정론적 UUID로 변환
 * 동일한 ObjectId는 항상 동일한 UUID를 생성합니다.
 */
export function objectIdToUuid(objectId: any): string {
  // ObjectId를 문자열로 변환
  let objectIdStr: string;

  if (typeof objectId === 'string') {
    objectIdStr = objectId;
  } else if (objectId && objectId.$oid) {
    // BSON Extended JSON 형식: { $oid: '...' }
    objectIdStr = objectId.$oid;
  } else if (objectId && objectId.toHexString && typeof objectId.toHexString === 'function') {
    // BSON ObjectId 객체 (toHexString 메서드 사용)
    objectIdStr = objectId.toHexString();
  } else if (objectId && typeof objectId.toString === 'function') {
    // ObjectId 객체 (toString 메서드)
    objectIdStr = objectId.toString();
  } else {
    throw new Error(`Invalid ObjectId format: ${JSON.stringify(objectId)}`);
  }

  // 24자 16진수 문자열인지 확인
  if (!/^[0-9a-fA-F]{24}$/.test(objectIdStr)) {
    throw new Error(`Invalid ObjectId string: ${objectIdStr}`);
  }

  return uuidv5(objectIdStr, UUID_NAMESPACE);
}

/**
 * BSON 파일에서 모든 문서를 읽어옵니다.
 */
export function parseBsonFile(filePath: string): any[] {
  if (!fs.existsSync(filePath)) {
    throw new Error(`BSON 파일을 찾을 수 없습니다: ${filePath}`);
  }

  const buffer = fs.readFileSync(filePath);
  const documents: any[] = [];
  let offset = 0;

  while (offset < buffer.length) {
    try {
      // 각 BSON 문서의 크기는 첫 4바이트에 저장됨
      const size = buffer.readInt32LE(offset);

      if (offset + size > buffer.length) {
        console.warn(`BSON 파일 끝에 불완전한 문서 발견: ${filePath}`);
        break;
      }

      const docBuffer = buffer.slice(offset, offset + size);
      const doc = bson.deserialize(docBuffer);
      documents.push(doc);

      offset += size;
    } catch (err) {
      console.error(`BSON 파싱 오류 (offset ${offset}):`, err.message);
      break;
    }
  }

  return documents;
}

/**
 * 여러 BSON 파일을 읽어서 컬렉션별로 반환합니다.
 */
export function parseMultipleBsonFiles(
  directory: string,
  collections: string[],
): Record<string, any[]> {
  const result: Record<string, any[]> = {};

  for (const collection of collections) {
    const filePath = path.join(directory, `${collection}.bson`);

    try {
      const docs = parseBsonFile(filePath);
      result[collection] = docs;
      console.log(`✅ ${collection}: ${docs.length}개 문서 로드됨`);
    } catch (err) {
      console.warn(`⚠️  ${collection}: ${err.message}`);
      result[collection] = [];
    }
  }

  return result;
}

/**
 * ObjectId 형식인지 확인
 */
function isObjectId(value: any): boolean {
  if (typeof value === 'string' && /^[0-9a-fA-F]{24}$/.test(value)) {
    return true;
  }
  if (value && value.$oid) {
    return true;
  }
  // BSON ObjectId 객체 (대소문자 주의: 'ObjectId' 또는 'ObjectID')
  if (value && (value._bsontype === 'ObjectId' || value._bsontype === 'ObjectID')) {
    return true;
  }
  return false;
}

/**
 * BSON Date 형식인지 확인
 */
function isBsonDate(value: any): value is { $date: string | number } {
  return value && typeof value === 'object' && '$date' in value;
}

/**
 * MongoDB 문서에서 ObjectId를 UUID로 변환합니다.
 */
export function convertObjectIdsToUuids(doc: any): any {
  if (!doc) return doc;

  const converted: any = {};

  for (const [key, value] of Object.entries(doc)) {
    // _id는 항상 변환
    if (key === '_id' && isObjectId(value)) {
      converted['id'] = objectIdToUuid(value);
      continue;
    }

    // categoryId, announcementId 등 ID 필드 변환
    if (key.endsWith('Id') && isObjectId(value)) {
      converted[key] = objectIdToUuid(value);
      continue;
    }

    // Date 객체 변환
    if (value instanceof Date) {
      converted[key] = value;
      continue;
    }

    // BSON Date 객체 변환
    if (isBsonDate(value)) {
      converted[key] = new Date(value.$date);
      continue;
    }

    // 중첩된 객체 재귀 처리 (ObjectId나 Date가 아닌 경우)
    if (
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value) &&
      !isObjectId(value) &&
      !isBsonDate(value)
    ) {
      converted[key] = convertObjectIdsToUuids(value);
      continue;
    }

    // 배열 처리
    if (Array.isArray(value)) {
      converted[key] = value.map((item) =>
        typeof item === 'object' && !isObjectId(item)
          ? convertObjectIdsToUuids(item)
          : item,
      );
      continue;
    }

    // 그 외는 그대로 복사
    converted[key] = value;
  }

  return converted;
}

/**
 * ObjectId에서 타임스탬프를 추출합니다.
 */
export function extractTimestampFromObjectId(objectId: any): Date {
  // ObjectId를 문자열로 변환
  let objectIdStr: string;

  if (typeof objectId === 'string') {
    objectIdStr = objectId;
  } else if (objectId && objectId.$oid) {
    objectIdStr = objectId.$oid;
  } else if (objectId && objectId.toHexString && typeof objectId.toHexString === 'function') {
    objectIdStr = objectId.toHexString();
  } else if (objectId && typeof objectId.toString === 'function') {
    objectIdStr = objectId.toString();
  } else {
    // 변환 불가능하면 현재 시간 반환
    return new Date();
  }

  // ObjectId의 첫 8자는 Unix timestamp (초 단위)
  const timestamp = parseInt(objectIdStr.substring(0, 8), 16);
  return new Date(timestamp * 1000);
}

/**
 * BSON 파일의 통계 정보를 반환합니다.
 */
export function getBsonFileStats(filePath: string): {
  exists: boolean;
  size: number;
  documentCount: number;
} {
  if (!fs.existsSync(filePath)) {
    return { exists: false, size: 0, documentCount: 0 };
  }

  const stats = fs.statSync(filePath);
  const buffer = fs.readFileSync(filePath);

  let count = 0;
  let offset = 0;

  while (offset < buffer.length) {
    try {
      const size = buffer.readInt32LE(offset);
      if (offset + size > buffer.length) break;
      offset += size;
      count++;
    } catch {
      break;
    }
  }

  return {
    exists: true,
    size: stats.size,
    documentCount: count,
  };
}
