import { Language } from '@domain/common/language/language.entity';
import { LanguageCode } from '@domain/common/language/language-code.types';

/**
 * 언어 생성 DTO
 */
export interface CreateLanguageDto {
  code: LanguageCode;
  name: string;
  isActive: boolean;
  createdBy?: string;
}

/**
 * 언어 수정 DTO
 */
export interface UpdateLanguageDto {
  name?: string;
  isActive?: boolean;
  updatedBy?: string;
}

/**
 * 언어 생성 결과
 */
export interface CreateLanguageResult {
  id: string;
  code: LanguageCode;
  name: string;
  isActive: boolean;
  createdAt: Date;
}

/**
 * 언어 목록 조회 결과
 */
export interface LanguageListResult {
  items: Language[];
  total: number;
}
