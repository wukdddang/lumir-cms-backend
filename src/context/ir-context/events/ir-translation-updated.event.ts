/**
 * IR 번역 업데이트 이벤트
 *
 * 기본 언어 번역이 업데이트되었을 때 발생합니다.
 * 이 이벤트를 통해 isSynced가 true인 다른 언어 번역들을 자동으로 동기화합니다.
 */
export class IRTranslationUpdatedEvent {
  constructor(
    /**
     * IR ID
     */
    public readonly irId: string,
    /**
     * 업데이트된 언어 ID
     */
    public readonly languageId: string,
    /**
     * 업데이트된 제목
     */
    public readonly title: string,
    /**
     * 업데이트된 설명
     */
    public readonly description: string | null | undefined,
    /**
     * 업데이트한 사용자
     */
    public readonly updatedBy?: string,
  ) {}
}
