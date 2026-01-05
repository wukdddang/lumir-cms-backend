/**
 * 도메인 이벤트 인터페이스
 */
export interface IDomainEvent {
  /**
   * 이벤트 ID
   */
  eventId: string;

  /**
   * 이벤트 타입
   */
  eventType: string;

  /**
   * 이벤트 발생 시간
   */
  occurredAt: Date;

  /**
   * Aggregate ID
   */
  aggregateId: string | number;

  /**
   * 이벤트 데이터
   */
  eventData: Record<string, any>;
}

/**
 * 도메인 이벤트를 가지는 Aggregate 인터페이스
 */
export interface IAggregateRoot {
  /**
   * 도메인 이벤트 목록 조회
   */
  getDomainEvents(): IDomainEvent[];

  /**
   * 도메인 이벤트 추가
   */
  addDomainEvent(event: IDomainEvent): void;

  /**
   * 도메인 이벤트 목록 초기화
   */
  clearDomainEvents(): void;
}
