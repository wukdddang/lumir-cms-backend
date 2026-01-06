import {
  applyDecorators,
  HttpStatus,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  HttpCode,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import {
  CreateAnnouncementPopupDto,
  UpdateAnnouncementPopupDto,
  AnnouncementPopupResponseDto,
} from '../dto/announcement-popup.dto';

/**
 * 모든 공지사항 팝업 조회 데코레이터
 */
export function GetAllAnnouncementPopups() {
  return applyDecorators(
    Get(),
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: '모든 공지사항 팝업 조회',
      description: `시스템에 등록된 모든 공지사항 팝업을 조회합니다.

**동작:**
- 모든 공지사항 팝업 목록을 반환
- 관리자 정보를 포함하여 조회
- 삭제되지 않은 항목만 반환

**테스트 케이스:**
- 기본 조회: 모든 공지사항 팝업 목록 조회 성공
- 빈 목록: 등록된 팝업이 없을 경우 빈 배열 반환`,
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: '공지사항 팝업 목록 조회 성공',
      type: [AnnouncementPopupResponseDto],
    }),
  );
}

/**
 * 공지사항 팝업 단건 조회 데코레이터
 */
export function GetAnnouncementPopup() {
  return applyDecorators(
    Get(':id'),
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: '공지사항 팝업 단건 조회',
      description: `ID로 특정 공지사항 팝업을 조회합니다.

**동작:**
- 주어진 ID의 공지사항 팝업 정보를 반환
- 관리자 정보를 포함하여 조회

**테스트 케이스:**
- 정상 조회: 유효한 ID로 조회 시 팝업 정보 반환
- 존재하지 않는 ID: 404 에러 반환
- 잘못된 ID 형식: 400 에러 반환`,
    }),
    ApiParam({ name: 'id', description: '공지사항 팝업 ID (UUID)' }),
    ApiResponse({
      status: HttpStatus.OK,
      description: '공지사항 팝업 조회 성공',
      type: AnnouncementPopupResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: '공지사항 팝업을 찾을 수 없습니다',
    }),
  );
}

/**
 * 공지사항 팝업 생성 데코레이터
 */
export function CreateAnnouncementPopup() {
  return applyDecorators(
    Post(),
    HttpCode(HttpStatus.CREATED),
    ApiOperation({
      summary: '공지사항 팝업 생성',
      description: `새로운 공지사항 팝업을 생성합니다.

**동작:**
- 제공된 정보로 새 공지사항 팝업 생성
- 초기 상태는 DRAFT로 설정
- 관리자 정보 연결

**테스트 케이스:**
- 정상 생성: 필수 정보 입력 시 팝업 생성 성공
- 필수 필드 누락: title, managerId 등 누락 시 400 에러
- 잘못된 데이터 형식: 유효성 검증 실패 시 400 에러`,
    }),
    ApiBody({ type: CreateAnnouncementPopupDto }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: '공지사항 팝업이 성공적으로 생성되었습니다',
      type: AnnouncementPopupResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: '잘못된 요청 데이터입니다',
    }),
  );
}

/**
 * 공지사항 팝업 수정 데코레이터
 */
export function UpdateAnnouncementPopup() {
  return applyDecorators(
    Patch(':id'),
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: '공지사항 팝업 수정',
      description: `기존 공지사항 팝업 정보를 수정합니다.

**동작:**
- 주어진 ID의 팝업 정보 업데이트
- 제공된 필드만 수정 (부분 업데이트)

**테스트 케이스:**
- 정상 수정: 유효한 데이터로 수정 성공
- 존재하지 않는 ID: 404 에러 반환
- 잘못된 데이터 형식: 400 에러 반환`,
    }),
    ApiParam({ name: 'id', description: '공지사항 팝업 ID (UUID)' }),
    ApiBody({ type: UpdateAnnouncementPopupDto }),
    ApiResponse({
      status: HttpStatus.OK,
      description: '공지사항 팝업이 성공적으로 수정되었습니다',
      type: AnnouncementPopupResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: '공지사항 팝업을 찾을 수 없습니다',
    }),
  );
}

/**
 * 공지사항 팝업 삭제 데코레이터
 */
export function DeleteAnnouncementPopup() {
  return applyDecorators(
    Delete(':id'),
    HttpCode(HttpStatus.NO_CONTENT),
    ApiOperation({
      summary: '공지사항 팝업 삭제',
      description: `공지사항 팝업을 삭제합니다 (Soft Delete).

**동작:**
- 주어진 ID의 팝업을 소프트 삭제
- 실제 데이터는 유지되며 deletedAt 필드 설정

**테스트 케이스:**
- 정상 삭제: 유효한 ID로 삭제 성공
- 존재하지 않는 ID: 404 에러 반환
- 이미 삭제된 항목: 404 에러 반환`,
    }),
    ApiParam({ name: 'id', description: '공지사항 팝업 ID (UUID)' }),
    ApiResponse({
      status: HttpStatus.NO_CONTENT,
      description: '공지사항 팝업이 성공적으로 삭제되었습니다',
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: '공지사항 팝업을 찾을 수 없습니다',
    }),
  );
}
