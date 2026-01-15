/**
 * AnnouncementPermission 액션 Enum
 * 
 * AnnouncementPermissionLog의 처리 상태
 */
export enum AnnouncementPermissionAction {
  /** 감지됨 (무효한 코드 발견) */
  DETECTED = 'detected',

  /** 무효한 코드 자동 제거됨 */
  REMOVED = 'removed',

  /** 관리자에게 통보됨 */
  NOTIFIED = 'notified',

  /** 관리자가 수동으로 해결함 */
  RESOLVED = 'resolved',
}
