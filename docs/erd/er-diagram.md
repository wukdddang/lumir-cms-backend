# 루미르 CMS ER 다이어그램

> 📚 **상세 문서**: 이 문서는 전체 시스템 개요입니다. 상세 정보는 아래 링크를 참조하세요.
> - **[엔티티 상세 보기](er-diagram-entities.md)** - 모든 엔티티의 구조와 다이어그램
> - **[데이터베이스 구현 가이드](er-diagram-database.md)** - JSONB 구조, 인덱스, CHECK 제약조건

---

## 목차

- [전체 시스템 ERD](#전체-시스템-erd)
- [도메인 구성](#도메인-구성)
- [Enum 타입](#enum-타입)
- [외부 시스템 참조](#외부-시스템-참조)
- [데이터베이스 주요 특징](#데이터베이스-주요-특징)

---

## 전체 시스템 ERD

```mermaid
erDiagram
    %% ==========================================
    %% 공통 엔티티 (Common Entities)
    %% ==========================================
    
    Language {
        uuid id PK "description"
        varchar code "ko|en|ja|zh"
        varchar name "예: 한국어, English"
        boolean isActive
        timestamp createdAt
        timestamp updatedAt
        timestamp deletedAt "nullable"
        uuid createdBy "nullable - 외부 시스템 직원 ID (SSO)"
        uuid updatedBy "nullable - 외부 시스템 직원 ID (SSO)"
        int version
    }

    Category {
        uuid id PK "description"
        varchar entityType "announcement|main_popup|shareholders_meeting|electronic_disclosure|ir|brochure|lumir_story|video_gallery|news|survey|education_management"
        varchar name
        text description "설명"
        boolean isActive
        int order
        timestamp createdAt
        timestamp updatedAt
        timestamp deletedAt "nullable"
        uuid createdBy "nullable - 외부 시스템 직원 ID (SSO)"
        uuid updatedBy "nullable - 외부 시스템 직원 ID (SSO)"
        int version
    }

    CategoryMapping {
        uuid id PK "description"
        uuid entityId "엔티티 ID - UK composite: (entityId, categoryId)"
        uuid categoryId FK "UK composite: (entityId, categoryId)"
        timestamp createdAt
        timestamp updatedAt
        timestamp deletedAt "nullable"
        uuid createdBy "nullable - 외부 시스템 직원 ID (SSO)"
        uuid updatedBy "nullable - 외부 시스템 직원 ID (SSO)"
        int version
    }

    DismissedPermissionLog {
        uuid id PK "description"
        varchar logType "announcement|wiki"
        uuid permissionLogId "AnnouncementPermissionLog.id 또는 WikiPermissionLog.id"
        uuid dismissedBy "무시한 관리자 ID (SSO)"
        timestamp dismissedAt "무시한 일시"
    }

    %% ==========================================
    %% Core Domain (핵심 비즈니스 로직)
    %% - ShareholdersMeeting, ElectronicDisclosure, IR
    %% - Brochure, News, Announcement
    %% ==========================================
    
    ShareholdersMeeting {
        uuid id PK "description"
        boolean isPublic
        varchar location
        timestamp meetingDate "주주총회 일시"
        timestamp releasedAt "nullable"
        text imageUrl "nullable - AWS S3 URL (대표 이미지)"
        jsonb attachments "nullable - 첨부파일 목록 (AWS S3 URLs)"
        int order
        timestamp createdAt
        timestamp updatedAt
        timestamp deletedAt "nullable"
        uuid createdBy "nullable - 외부 시스템 직원 ID (SSO)"
        uuid updatedBy "nullable - 외부 시스템 직원 ID (SSO)"
        int version
    }

    VoteResult {
        uuid id PK "description"
        uuid shareholdersMeetingId FK
        int agendaNumber "안건 번호 (정렬 순서로도 사용)"
        int totalVote
        int yesVote
        int noVote
        float approvalRating "찬성률(%)"
        varchar result "accepted|rejected"
        timestamp createdAt
        timestamp updatedAt
        timestamp deletedAt "nullable"
        uuid createdBy "nullable - 외부 시스템 직원 ID (SSO)"
        uuid updatedBy "nullable - 외부 시스템 직원 ID (SSO)"
        int version
    }

    VoteResultTranslation {
        uuid id PK "description"
        uuid voteResultId UK "FK - 유니크 제약조건: (voteResultId, languageId)"
        uuid languageId UK "FK"
        varchar title "안건 제목"
        timestamp createdAt
        timestamp updatedAt
        timestamp deletedAt "nullable"
        uuid createdBy "nullable - 외부 시스템 직원 ID (SSO)"
        uuid updatedBy "nullable - 외부 시스템 직원 ID (SSO)"
        int version
    }

    ShareholdersMeetingTranslation {
        uuid id PK "description"
        uuid shareholdersMeetingId UK "FK - 유니크 제약조건: (shareholdersMeetingId, languageId)"
        uuid languageId UK "FK"
        varchar title
        text description "간단한 설명"
        text content "상세 내용"
        text resultText "의결 결과 텍스트"
        text summary "요약"
        timestamp createdAt
        timestamp updatedAt
        timestamp deletedAt "nullable"
        uuid createdBy "nullable - 외부 시스템 직원 ID (SSO)"
        uuid updatedBy "nullable - 외부 시스템 직원 ID (SSO)"
        int version
    }

    ElectronicDisclosure {
        uuid id PK "description"
        boolean isPublic
        jsonb attachments "nullable - 첨부파일 목록 (AWS S3 URLs)"
        int order
        timestamp createdAt
        timestamp updatedAt
        timestamp deletedAt "nullable"
        uuid createdBy "nullable - 외부 시스템 직원 ID (SSO)"
        uuid updatedBy "nullable - 외부 시스템 직원 ID (SSO)"
        int version
    }

    ElectronicDisclosureTranslation {
        uuid id PK "description"
        uuid electronicDisclosureId UK "FK - 유니크 제약조건: (electronicDisclosureId, languageId)"
        uuid languageId UK "FK"
        varchar title
        text description "간단한 설명"
        timestamp createdAt
        timestamp updatedAt
        timestamp deletedAt "nullable"
        uuid createdBy "nullable - 외부 시스템 직원 ID (SSO)"
        uuid updatedBy "nullable - 외부 시스템 직원 ID (SSO)"
        int version
    }

    IR {
        uuid id PK "description"
        boolean isPublic
        jsonb attachments "nullable - 첨부파일 목록 (AWS S3 URLs)"
        int order
        timestamp createdAt
        timestamp updatedAt
        timestamp deletedAt "nullable"
        uuid createdBy "nullable - 외부 시스템 직원 ID (SSO)"
        uuid updatedBy "nullable - 외부 시스템 직원 ID (SSO)"
        int version
    }

    IRTranslation {
        uuid id PK "description"
        uuid irId UK "FK - 유니크 제약조건: (irId, languageId)"
        uuid languageId UK "FK"
        varchar title
        text description "간단한 설명"
        timestamp createdAt
        timestamp updatedAt
        timestamp deletedAt "nullable"
        uuid createdBy "nullable - 외부 시스템 직원 ID (SSO)"
        uuid updatedBy "nullable - 외부 시스템 직원 ID (SSO)"
        int version
    }

    Brochure {
        uuid id PK "description"
        boolean isPublic
        jsonb attachments "nullable - 첨부파일 목록 (AWS S3 URLs)"
        int order
        timestamp createdAt
        timestamp updatedAt
        timestamp deletedAt "nullable"
        uuid createdBy "nullable - 외부 시스템 직원 ID (SSO)"
        uuid updatedBy "nullable - 외부 시스템 직원 ID (SSO)"
        int version
    }

    BrochureTranslation {
        uuid id PK "description"
        uuid brochureId UK "FK - 유니크 제약조건: (brochureId, languageId)"
        uuid languageId UK "FK"
        varchar title
        text description "간단한 설명"
        boolean isSynced "동기화 여부 (기본값: true) - 한국어 원본과 자동 동기화 여부"
        timestamp createdAt
        timestamp updatedAt
        timestamp deletedAt "nullable"
        uuid createdBy "nullable - 외부 시스템 직원 ID (SSO)"
        uuid updatedBy "nullable - 외부 시스템 직원 ID (SSO)"
        int version
    }

    News {
        uuid id PK "description"
        varchar title
        text description "설명"
        text url "외부 링크 또는 상세 페이지 URL"
        boolean isPublic
        jsonb attachments "nullable - 첨부파일 목록 (AWS S3 URLs)"
        int order
        timestamp createdAt
        timestamp updatedAt
        timestamp deletedAt "nullable"
        uuid createdBy "nullable - 외부 시스템 직원 ID (SSO)"
        uuid updatedBy "nullable - 외부 시스템 직원 ID (SSO)"
        int version
    }

    Announcement {
        uuid id PK "description"
        varchar title
        text content
        boolean isFixed "상단 고정 여부"
        boolean isPublic "true=전사공개, false=제한공개"
        timestamp releasedAt "nullable"
        timestamp expiredAt "nullable"
        boolean mustRead "필독 여부"
        jsonb permissionEmployeeIds "특정 직원 ID 목록"
        jsonb permissionRankIds "직급 ID 목록 (UUID)"
        jsonb permissionPositionIds "직책 ID 목록 (UUID)"
        jsonb permissionDepartmentIds "부서 ID 목록 (UUID)"
        jsonb attachments "nullable - 첨부파일 목록 (AWS S3 URLs)"
        int order "정렬 순서"
        timestamp createdAt
        timestamp updatedAt
        timestamp deletedAt "nullable"
        uuid createdBy "nullable - 외부 시스템 직원 ID (SSO)"
        uuid updatedBy "nullable - 외부 시스템 직원 ID (SSO)"
        int version
    }

    AnnouncementRead {
        uuid id PK "description"
        uuid announcementId UK "FK - 유니크 제약조건: (announcementId, employeeId) - 직원이 읽을 때 생성"
        uuid employeeId UK "외부 시스템 직원 ID (SSO)"
        timestamp readAt "읽은 시각"
        timestamp createdAt
        timestamp updatedAt
        timestamp deletedAt "nullable"
        uuid createdBy "nullable - 외부 시스템 직원 ID (SSO)"
        uuid updatedBy "nullable - 외부 시스템 직원 ID (SSO)"
        int version
    }

    AnnouncementPermissionLog {
        uuid id PK "description"
        uuid announcementId FK "announcement ID"
        jsonb invalidDepartments "nullable - 무효화된 부서 정보 (ID와 이름)"
        jsonb invalidRankIds "nullable - 무효화된 직급 ID 목록 (UUID)"
        jsonb invalidPositionIds "nullable - 무효화된 직책 ID 목록 (UUID)"
        jsonb invalidEmployees "nullable - 무효화된 직원 정보 (ID와 이름)"
        jsonb snapshotPermissions "권한 설정 스냅샷 (변경 전 - 부서/직원은 ID와 이름 포함)"
        varchar action "detected|removed|notified|resolved"
        text note "nullable - 추가 메모"
        timestamp detectedAt "감지 시각"
        timestamp resolvedAt "nullable - 해결 시각"
        uuid resolvedBy "nullable - 해결한 관리자 ID (외부 시스템 직원 ID - SSO)"
        timestamp createdAt
    }

    %% ==========================================
    %% Sub Domain (부가 지원 기능)
    %% - MainPopup, LumirStory, VideoGallery, Survey
    %% - EducationManagement, WikiFileSystem
    %% ==========================================
    
    MainPopup {
        uuid id PK "description"
        boolean isPublic
        timestamp releasedAt "nullable"
        jsonb attachments "nullable - 첨부파일 목록 (AWS S3 URLs)"
        int order
        timestamp createdAt
        timestamp updatedAt
        timestamp deletedAt "nullable"
        uuid createdBy "nullable - 외부 시스템 직원 ID (SSO)"
        uuid updatedBy "nullable - 외부 시스템 직원 ID (SSO)"
        int version
    }

    MainPopupTranslation {
        uuid id PK "description"
        uuid mainPopupId UK "FK - 유니크 제약조건: (mainPopupId, languageId)"
        uuid languageId UK "FK"
        varchar title
        text description "설명"
        timestamp createdAt
        timestamp updatedAt
        timestamp deletedAt "nullable"
        uuid createdBy "nullable - 외부 시스템 직원 ID (SSO)"
        uuid updatedBy "nullable - 외부 시스템 직원 ID (SSO)"
        int version
    }

    LumirStory {
        uuid id PK "description"
        varchar title
        text content
        text imageUrl "nullable - AWS S3 URL (썸네일/대표 이미지)"
        boolean isPublic
        jsonb attachments "nullable - 첨부파일 목록 (AWS S3 URLs)"
        int order
        timestamp createdAt
        timestamp updatedAt
        timestamp deletedAt "nullable"
        uuid createdBy "nullable - 외부 시스템 직원 ID (SSO)"
        uuid updatedBy "nullable - 외부 시스템 직원 ID (SSO)"
        int version
    }

    VideoGallery {
        uuid id PK "description"
        varchar title
        text description
        boolean isPublic
        jsonb attachments "nullable - 첨부파일 목록 (AWS S3 URLs)"
        int order
        timestamp createdAt
        timestamp updatedAt
        timestamp deletedAt "nullable"
        uuid createdBy "nullable - 외부 시스템 직원 ID (SSO)"
        uuid updatedBy "nullable - 외부 시스템 직원 ID (SSO)"
        int version
    }

    Survey {
        uuid id PK "description"
        uuid announcementId UK "FK - 공지사항 ID (유니크 제약조건: 공지사항당 설문 1개)"
        varchar title
        text description
        timestamp startDate "nullable - 설문 시작일시"
        timestamp endDate "nullable - 설문 마감일시"
        int order
        timestamp createdAt
        timestamp updatedAt
        timestamp deletedAt "nullable"
        uuid createdBy "nullable - 외부 시스템 직원 ID (SSO)"
        uuid updatedBy "nullable - 외부 시스템 직원 ID (SSO)"
        int version
    }

    SurveyQuestion {
        uuid id PK "description"
        uuid surveyId FK
        varchar title
        varchar type "short_answer|paragraph|multiple_choice|dropdown|checkboxes|file_upload|datetime|linear_scale|grid_scale"
        jsonb form "InqueryFormData"
        boolean isRequired
        int order
        timestamp createdAt
        timestamp updatedAt
        timestamp deletedAt "nullable"
        uuid createdBy "nullable - 외부 시스템 직원 ID (SSO)"
        uuid updatedBy "nullable - 외부 시스템 직원 ID (SSO)"
        int version
    }

    SurveyResponseText {
        uuid id PK "description"
        uuid questionId UK "FK - 유니크 제약조건: (questionId, employeeId)"
        uuid employeeId UK "외부 시스템 직원 ID (SSO)"
        text textValue "텍스트 응답"
        timestamp submittedAt
        timestamp createdAt
        timestamp updatedAt
        timestamp deletedAt "nullable"
        uuid createdBy "nullable - 외부 시스템 직원 ID (SSO)"
        uuid updatedBy "nullable - 외부 시스템 직원 ID (SSO)"
        int version
    }

    SurveyResponseChoice {
        uuid id PK "description"
        uuid questionId UK "FK - 유니크 제약조건: (questionId, employeeId)"
        uuid employeeId UK "외부 시스템 직원 ID (SSO)"
        varchar selectedOption "선택한 옵션"
        timestamp submittedAt
        timestamp createdAt
        timestamp updatedAt
        timestamp deletedAt "nullable"
        uuid createdBy "nullable - 외부 시스템 직원 ID (SSO)"
        uuid updatedBy "nullable - 외부 시스템 직원 ID (SSO)"
        int version
    }

    SurveyResponseCheckbox {
        uuid id PK "description"
        uuid questionId UK "FK - 유니크 제약조건: (questionId, employeeId, selectedOption)"
        uuid employeeId UK "외부 시스템 직원 ID (SSO)"
        varchar selectedOption UK "선택한 옵션 (다중 선택 가능)"
        timestamp submittedAt
        timestamp createdAt
        timestamp updatedAt
        timestamp deletedAt "nullable"
        uuid createdBy "nullable - 외부 시스템 직원 ID (SSO)"
        uuid updatedBy "nullable - 외부 시스템 직원 ID (SSO)"
        int version
    }

    SurveyResponseScale {
        uuid id PK "description"
        uuid questionId UK "FK - 유니크 제약조건: (questionId, employeeId)"
        uuid employeeId UK "외부 시스템 직원 ID (SSO)"
        int scaleValue "척도 값 (1-10)"
        timestamp submittedAt
        timestamp createdAt
        timestamp updatedAt
        timestamp deletedAt "nullable"
        uuid createdBy "nullable - 외부 시스템 직원 ID (SSO)"
        uuid updatedBy "nullable - 외부 시스템 직원 ID (SSO)"
        int version
    }

    SurveyResponseGrid {
        uuid id PK "description"
        uuid questionId UK "FK - 유니크 제약조건: (questionId, employeeId, rowName)"
        uuid employeeId UK "외부 시스템 직원 ID (SSO)"
        varchar rowName UK "행 이름"
        varchar columnValue "열 값"
        timestamp submittedAt
        timestamp createdAt
        timestamp updatedAt
        timestamp deletedAt "nullable"
        uuid createdBy "nullable - 외부 시스템 직원 ID (SSO)"
        uuid updatedBy "nullable - 외부 시스템 직원 ID (SSO)"
        int version
    }

    SurveyResponseFile {
        uuid id PK "description"
        uuid questionId UK "FK - 유니크 제약조건: (questionId, employeeId, fileUrl)"
        uuid employeeId UK "외부 시스템 직원 ID (SSO)"
        text fileUrl UK "AWS S3 URL"
        varchar fileName "원본 파일명"
        bigint fileSize "파일 크기(bytes)"
        varchar mimeType "MIME 타입"
        timestamp submittedAt
        timestamp createdAt
        timestamp updatedAt
        timestamp deletedAt "nullable"
        uuid createdBy "nullable - 외부 시스템 직원 ID (SSO)"
        uuid updatedBy "nullable - 외부 시스템 직원 ID (SSO)"
        int version
    }

    SurveyResponseDatetime {
        uuid id PK "description"
        uuid questionId UK "FK - 유니크 제약조건: (questionId, employeeId)"
        uuid employeeId UK "외부 시스템 직원 ID (SSO)"
        timestamp datetimeValue "날짜/시간 값"
        timestamp submittedAt
        timestamp createdAt
        timestamp updatedAt
        timestamp deletedAt "nullable"
        uuid createdBy "nullable - 외부 시스템 직원 ID (SSO)"
        uuid updatedBy "nullable - 외부 시스템 직원 ID (SSO)"
        int version
    }

    SurveyCompletion {
        uuid id PK "description"
        uuid surveyId UK "FK - 유니크 제약조건: (surveyId, employeeId)"
        uuid employeeId UK "외부 시스템 직원 ID (SSO)"
        int totalQuestions "전체 질문 수"
        int answeredQuestions "응답한 질문 수"
        boolean isCompleted "완료 여부 (generated: totalQuestions === answeredQuestions)"
        timestamp completedAt "nullable - 완료 일시"
        timestamp createdAt
        timestamp updatedAt
        timestamp deletedAt "nullable"
        uuid createdBy "nullable - 외부 시스템 직원 ID (SSO)"
        uuid updatedBy "nullable - 외부 시스템 직원 ID (SSO)"
        int version
    }

    EducationManagement {
        uuid id PK "description"
        varchar title
        text content
        boolean isPublic
        varchar status "scheduled|in_progress|completed|cancelled|postponed"
        uuid managerId "담당자 ID (외부 시스템 직원 ID - SSO)"
        timestamp deadline "교육 마감일시"
        jsonb attachments "nullable - 첨부파일 목록 (AWS S3 URLs)"
        int order
        timestamp createdAt
        timestamp updatedAt
        timestamp deletedAt "nullable"
        uuid createdBy "nullable - 외부 시스템 직원 ID (SSO)"
        uuid updatedBy "nullable - 외부 시스템 직원 ID (SSO)"
        int version
    }

    Attendee {
        uuid id PK "description"
        uuid educationManagementId UK "FK - 유니크 제약조건: (educationManagementId, employeeId)"
        uuid employeeId UK "외부 시스템 직원 ID (SSO) - 같은 직원이 같은 교육에 중복 등록 불가"
        varchar status "pending|in_progress|completed|overdue"
        timestamp completedAt "nullable"
        timestamp createdAt
        timestamp updatedAt
        timestamp deletedAt "nullable"
        uuid createdBy "nullable - 외부 시스템 직원 ID (SSO)"
        uuid updatedBy "nullable - 외부 시스템 직원 ID (SSO)"
        int version
    }

    WikiFileSystem {
        uuid id PK "description"
        varchar name
        varchar type "folder|file"
        uuid parentId "nullable, self-reference"
        int depth "계층 깊이 (0=루트)"
        varchar title "nullable - 문서 제목 (file일 때만 사용)"
        text content "nullable - 문서 본문 (file일 때만 사용)"
        text fileUrl "nullable - 단일 파일 URL (file일 때만 사용)"
        bigint fileSize "nullable - 파일 크기(bytes)"
        varchar mimeType "nullable - MIME 타입"
        jsonb attachments "nullable - 첨부파일 목록 (file일 때만 사용)"
        boolean isPublic "folder일 때만 사용 - 권한은 상위 폴더에서 cascading"
        jsonb permissionRankIds "nullable - 직급 ID 목록 (UUID, folder일 때만 사용)"
        jsonb permissionPositionIds "nullable - 직책 ID 목록 (UUID, folder일 때만 사용)"
        jsonb permissionDepartmentIds "nullable - 부서 ID 목록 (UUID, folder일 때만 사용)"
        int order
        timestamp createdAt
        timestamp updatedAt
        timestamp deletedAt "nullable"
        uuid createdBy "nullable - 외부 시스템 직원 ID (SSO)"
        uuid updatedBy "nullable - 외부 시스템 직원 ID (SSO)"
        int version
    }

    WikiFileSystemClosure {
        uuid ancestor PK "FK - 조상 노드 ID"
        uuid descendant PK "FK - 자손 노드 ID"
        int depth "거리 (0=자기자신, 1=직접자식)"
        timestamp createdAt
    }

    WikiPermissionLog {
        uuid id PK "description"
        uuid wikiFileSystemId FK "wiki_file_system ID"
        jsonb invalidDepartments "nullable - 무효화된 부서 정보 (ID와 이름)"
        jsonb invalidRankIds "nullable - 무효화된 직급 ID 목록 (UUID)"
        jsonb invalidPositionIds "nullable - 무효화된 직책 ID 목록 (UUID)"
        jsonb snapshotPermissions "권한 설정 스냅샷 (변경 전 - 부서는 ID와 이름 포함)"
        varchar action "detected|removed|notified|resolved"
        text note "nullable - 추가 메모"
        timestamp detectedAt "감지 시각"
        timestamp resolvedAt "nullable - 해결 시각"
        uuid resolvedBy "nullable - 해결한 관리자 ID (외부 시스템 직원 ID - SSO)"
        timestamp createdAt
    }

    %% ==========================================
    %% Relationships - Core Domain
    %% ==========================================
    
    ShareholdersMeeting ||--o{ CategoryMapping : "has"
    CategoryMapping }o--|| Category : "references"
    ShareholdersMeeting ||--o{ VoteResult : "has vote results"
    VoteResult ||--o{ VoteResultTranslation : "has translations"
    VoteResultTranslation }o--|| Language : "in language"
    ShareholdersMeeting ||--o{ ShareholdersMeetingTranslation : "has translations"
    ShareholdersMeetingTranslation }o--|| Language : "in language"
    
    ElectronicDisclosure ||--o{ CategoryMapping : "has"
    ElectronicDisclosure ||--o{ ElectronicDisclosureTranslation : "has translations"
    ElectronicDisclosureTranslation }o--|| Language : "in language"
    
    IR ||--o{ CategoryMapping : "has"
    IR ||--o{ IRTranslation : "has translations"
    IRTranslation }o--|| Language : "in language"
    
    Brochure ||--o{ CategoryMapping : "has"
    Brochure ||--o{ BrochureTranslation : "has translations"
    BrochureTranslation }o--|| Language : "in language"
    
    News ||--o{ CategoryMapping : "has"
    
    Announcement ||--o{ CategoryMapping : "has"
    Announcement ||--o{ AnnouncementRead : "has reads (lazy)"
    Announcement ||--o{ AnnouncementPermissionLog : "has permission logs"
    Announcement ||--o| Survey : "has survey (optional)"
    AnnouncementPermissionLog ||--o{ DismissedPermissionLog : "can be dismissed"
    
    %% ==========================================
    %% Relationships - Sub Domain
    %% ==========================================
    
    MainPopup ||--o{ CategoryMapping : "has"
    MainPopup ||--o{ MainPopupTranslation : "has translations"
    MainPopupTranslation }o--|| Language : "in language"
    
    LumirStory ||--o{ CategoryMapping : "has"
    
    VideoGallery ||--o{ CategoryMapping : "has"

    Survey ||--o{ SurveyQuestion : "has many"
    Survey ||--o{ SurveyCompletion : "has completions"
    
    SurveyQuestion ||--o{ SurveyResponseText : "has text responses"
    SurveyQuestion ||--o{ SurveyResponseChoice : "has choice responses"
    SurveyQuestion ||--o{ SurveyResponseCheckbox : "has checkbox responses"
    SurveyQuestion ||--o{ SurveyResponseScale : "has scale responses"
    SurveyQuestion ||--o{ SurveyResponseGrid : "has grid responses"
    SurveyQuestion ||--o{ SurveyResponseFile : "has file responses"
    SurveyQuestion ||--o{ SurveyResponseDatetime : "has datetime responses"
    
    EducationManagement ||--o{ CategoryMapping : "has"
    EducationManagement ||--o{ Attendee : "has many"
    
    WikiFileSystem }o--o| WikiFileSystem : "parentId (self-reference)"
    WikiFileSystem ||--o{ WikiFileSystemClosure : "ancestor"
    WikiFileSystem ||--o{ WikiFileSystemClosure : "descendant"
    WikiFileSystem ||--o{ WikiPermissionLog : "has permission logs"
    WikiPermissionLog ||--o{ DismissedPermissionLog : "can be dismissed"
```

---

## 도메인 구성

### Common Domain (공통 도메인)
시스템 전반에서 공유되는 공통 엔티티

| 엔티티 | 설명 |
|--------|------|
| **Language** | 다국어 지원을 위한 언어 관리 |
| **Category** | 통합 카테고리 관리 (모든 도메인 공유) |
| **CategoryMapping** | 엔티티-카테고리 간 다대다 관계 |
| **DismissedPermissionLog** | 권한 로그 "다시 보지 않기" 관리 (공지사항/위키) |

### Core Domain (핵심 비즈니스)
회사의 핵심 비즈니스 기능

| 엔티티 | 설명 | 다국어 지원 |
|--------|------|-------------|
| **ShareholdersMeeting** | 주주총회 정보 및 의결 결과 | ✅ |
| **VoteResult** | 주주총회 안건별 의결 결과 | ✅ |
| **ElectronicDisclosure** | 전자공시 문서 | ✅ |
| **IR** | IR 자료 및 투자자 정보 | ✅ |
| **Brochure** | 회사 소개 및 제품 브로슈어 | ✅ |
| **News** | 언론 보도 및 뉴스 | ❌ |
| **Announcement** | 내부 공지사항 및 직원 응답 | ❌ |
| **AnnouncementPermissionLog** | Announcement 권한 무효화 이력 추적 | ❌ |

### Sub Domain (부가 기능)
핵심 비즈니스를 지원하는 부가 기능

| 엔티티 | 설명 | 다국어 지원 |
|--------|------|-------------|
| **MainPopup** | 메인 페이지 팝업 | ✅ |
| **LumirStory** | 회사 스토리 및 콘텐츠 | ❌ |
| **VideoGallery** | 비디오 콘텐츠 | ❌ |
| **Survey** | 공지사항 연동 설문조사 (타입별 응답 테이블 분리) | ❌ |
| **EducationManagement** | 직원 교육 및 수강 관리 | ❌ |
| **WikiFileSystem** | 문서 및 파일 관리 (계층 구조) | ❌ |
| **WikiPermissionLog** | WikiFileSystem 권한 무효화 이력 추적 | ❌ |

---

## Enum 타입

### LanguageCode
```typescript
enum LanguageCode {
  KOREAN = 'ko',    // 한국어
  ENGLISH = 'en',   // 영어
  JAPANESE = 'ja',  // 일본어
  CHINESE = 'zh'    // 중국어
}
```

### CategoryEntityType
```typescript
enum CategoryEntityType {
  ANNOUNCEMENT = 'announcement',
  MAIN_POPUP = 'main_popup',
  SHAREHOLDERS_MEETING = 'shareholders_meeting',
  ELECTRONIC_DISCLOSURE = 'electronic_disclosure',
  IR = 'ir',
  BROCHURE = 'brochure',
  LUMIR_STORY = 'lumir_story',
  VIDEO_GALLERY = 'video_gallery',
  NEWS = 'news',
  EDUCATION_MANAGEMENT = 'education_management'
  // SURVEY 제거: Survey는 Announcement에 종속되어 카테고리 불필요
}
```

### EducationStatus (교육 상태)
```typescript
enum EducationStatus {
  SCHEDULED = 'scheduled',       // 예정됨 (시작 전)
  IN_PROGRESS = 'in_progress',   // 진행 중
  COMPLETED = 'completed',       // 완료됨
  CANCELLED = 'cancelled',       // 취소됨
  POSTPONED = 'postponed'        // 연기됨
}
```

### InqueryType (설문 질문 타입)
```typescript
enum InqueryType {
  SHORT_ANSWER = 'short_answer',    // 단답형
  PARAGRAPH = 'paragraph',          // 장문형
  MULTIPLE_CHOICE = 'multiple_choice',  // 객관식
  DROPDOWN = 'dropdown',            // 드롭다운
  CHECKBOXES = 'checkboxes',        // 체크박스
  FILE_UPLOAD = 'file_upload',      // 파일 업로드
  DATETIME = 'datetime',            // 날짜/시간
  LINEAR_SCALE = 'linear_scale',    // 선형 척도
  GRID_SCALE = 'grid_scale'         // 그리드 척도
}
```

### AttendeeStatus (수강 상태)
```typescript
enum AttendeeStatus {
  PENDING = 'pending',         // 대기중
  IN_PROGRESS = 'in_progress', // 진행중
  COMPLETED = 'completed',     // 완료
  OVERDUE = 'overdue'          // 기한 초과
}
```

### WikiFileSystemType
```typescript
enum WikiFileSystemType {
  FOLDER = 'folder',  // 폴더
  FILE = 'file'       // 파일
}
```

### WikiPermissionAction (Wiki 권한 무효화 처리 상태)
```typescript
enum WikiPermissionAction {
  DETECTED = 'detected',   // 감지됨 (무효한 코드 발견)
  REMOVED = 'removed',     // 무효한 코드 자동 제거됨
  NOTIFIED = 'notified',   // 관리자에게 통보됨
  RESOLVED = 'resolved'    // 관리자가 수동으로 해결함
}
```

### AnnouncementPermissionAction (공지사항 권한 무효화 처리 상태)
```typescript
enum AnnouncementPermissionAction {
  DETECTED = 'detected',   // 감지됨 (무효한 코드 발견)
  REMOVED = 'removed',     // 무효한 코드 자동 제거됨
  NOTIFIED = 'notified',   // 관리자에게 통보됨
  RESOLVED = 'resolved'    // 관리자가 수동으로 해결함
}
```

### DismissedPermissionLogType (권한 로그 타입)
```typescript
enum DismissedPermissionLogType {
  ANNOUNCEMENT = 'announcement',  // 공지사항 권한 로그
  WIKI = 'wiki'                  // 위키 권한 로그
}
```

---

## 외부 시스템 참조

다음 필드들은 **외부 직원 관리 시스템(SSO)**의 ID를 참조합니다:

| 필드 | 설명 | 적용 엔티티 |
|------|------|-------------|
| `employeeId` | 공지사항/설문/교육 대상 직원 ID | AnnouncementRead, AnnouncementResponse, Survey, Attendee |
| `permissionEmployeeIds` | 엔티티 접근 권한이 있는 직원 ID 목록 (JSONB 배열) | Announcement, Survey, WikiFileSystem |
| `createdBy` | 생성자 ID (uuid 타입) | 모든 엔티티 (BaseEntity) |
| `updatedBy` | 수정자 ID (uuid 타입) | 모든 엔티티 (BaseEntity) |
| `managerId` | 교육 담당자 ID | EducationManagement |

**참고**: 외부 시스템과 연동하므로 FK 제약조건은 없으며, 애플리케이션 레벨에서 검증합니다.

---

## 데이터베이스 주요 특징

### 1. 통합 카테고리 관리
- **단일 Category 테이블**: 모든 도메인의 카테고리를 하나의 테이블로 관리
- **entityType 필드**: 도메인 구분 (announcement, news, survey 등)
- **CategoryMapping**: 엔티티와 카테고리 간 다대다 관계 (정규화)

### 2. 다국어 지원
- **번역 테이블**: 언어별 콘텐츠를 별도 테이블로 관리
- **지원 엔티티**: MainPopup, ShareholdersMeeting, VoteResult, ElectronicDisclosure, IR, Brochure
- **Fallback 전략**: 요청 언어 → 한국어(기본) → 영어 → 첫 번째 사용 가능한 번역

### 3. 타입별 설문 응답 테이블
- **7개 응답 테이블**: 질문 타입별로 최적화된 응답 관리
- **장점**: 통계 쿼리 성능 10배 이상 향상, 타입 안전성 보장
- **SurveyCompletion**: 설문 완료 여부 추적

### 4. Lazy Creation 패턴 (공지사항)
- **AnnouncementRead**: 직원이 읽을 때만 레코드 생성
- **AnnouncementResponse**: 직원이 응답할 때만 레코드 생성
- **장점**: 확장성 대폭 향상, 배치 처리 불필요

### 5. 계층 구조 (WikiFileSystem)
- **자기 참조**: parentId를 통한 트리 구조
- **파일 저장**: AWS S3에 업로드 후 URL 참조

### 6. WikiFileSystem 권한 무효화 추적
- **WikiPermissionLog**: 외부 시스템(SSO)의 부서/직급/직책 ID 제거/변경 시 이력 추적
- **용도**: WikiFileSystem 권한 변경 감사 로그, 문제 해결 추적
- **특징**: 무효화된 부서 정보(ID와 이름), 권한 설정 스냅샷 보관, 해결 여부 관리
- **스케줄러**: 매일 새벽 2시 자동 검증 및 무효한 권한 제거 (중복 로그 방지 기능 포함)
- **수동 실행**: `POST /admin/permission-validation/wiki` API로 즉시 실행 가능

### 7. Announcement 권한 무효화 추적
- **AnnouncementPermissionLog**: 외부 시스템(SSO)의 부서/직급/직책/직원 정보 제거/변경 시 이력 추적
- **용도**: Announcement 권한 변경 감사 로그, 문제 해결 추적
- **특징**: 무효화된 부서/직원 정보(ID와 이름), 권한 설정 스냅샷 보관, 해결 여부 관리
- **스케줄러**: 매일 새벽 3시 자동 검증 및 무효한 권한 제거 (중복 로그 방지 기능 포함)
- **수동 실행**: `POST /admin/permission-validation/announcement` API로 즉시 실행 가능

### 8. 공통 기능
- **Soft Delete**: `deletedAt` 필드로 논리 삭제 (단, SurveyResponseCheckbox는 hard delete 사용)
- **Optimistic Locking**: `version` 필드로 동시성 제어
- **Audit Fields**: `createdAt`, `updatedAt`, `createdBy`, `updatedBy`
- **Order Field**: 모든 콘텐츠 엔티티에서 정렬 순서 관리

---

## 상세 문서 링크

- **[엔티티 상세 보기](er-diagram-entities.md)**
  - Common Domain 상세 (Language, Category, CategoryMapping)
  - Core Domain 상세 (ShareholdersMeeting, ElectronicDisclosure, IR, Brochure, News, Announcement)
  - Sub Domain 상세 (MainPopup, LumirStory, VideoGallery, Survey, EducationManagement, WikiFileSystem)
  - 각 엔티티별 Mermaid 다이어그램 및 설명

- **[데이터베이스 구현 가이드](er-diagram-database.md)**
  - JSONB 필드 구조 (attachments, InqueryFormData, InqueryResponseData)
  - Announcement 권한 필드 상세
  - 데이터베이스 특징 상세 설명
  - 인덱스 권장사항 (모든 테이블)
  - CHECK 제약조건 (모든 제약조건)
  - 변경 이력

---

## 변경 이력

### v5.21 (2026-01-20)
- ✅ **권한 로그 "다시 보지 않기" 기능 추가**
  - `DismissedPermissionLog` 엔티티 추가 (Common Domain)
  - 관리자별로 권한 로그 모달 표시 설정 관리
  - 공지사항/위키 권한 로그 배치 무시 처리 API 구현
  - `DismissedPermissionLogType` enum 추가 (announcement|wiki)
  - **API 개선**:
    - `PATCH /admin/announcements/permission-logs/dismiss` - 공지사항 권한 로그 일괄 무시
    - `PATCH /admin/wiki/permission-logs/dismiss` - 위키 권한 로그 일괄 무시
    - `GET /admin/announcements/permission-logs/unread` - 미열람 로그 조회 (모달용)
    - `GET /admin/wiki/permission-logs/unread` - 미열람 로그 조회 (모달용)
  - **권한 로그 조회 필터링 버그 수정**:
    - `resolved` 쿼리 파라미터가 문자열로 전달되는 문제 해결
    - `resolved=true/false` 필터링 정상 작동 확인
  - 다중 관리자 지원 (각 관리자가 독립적으로 무시 설정 가능)
  - 관리 페이지에서는 모든 로그 조회 가능 (무시 설정과 무관)

### v5.20 (2026-01-15)
- ✅ **Announcement 권한 무효화 추적 추가**
  - `AnnouncementPermissionLog` 엔티티 추가
  - 외부 시스템(SSO) 부서/직급/직책/직원 정보 제거 시 이력 추적
  - 무효화된 부서/직원 정보를 ID와 이름 함께 저장 (프론트엔드 UI용)
  - `AnnouncementPermissionAction` enum 추가 (detected|removed|notified|resolved)
  - **매일 새벽 3시 자동 검증 스케줄러 구현** (Cron: `0 3 * * *`)
  - 중복 로그 방지: 미해결 로그가 있으면 새 로그 생성 안 함
  - **수동 실행 API 추가**: `POST /admin/permission-validation/announcement`
  - WikiPermissionLog와 동일한 패턴 적용
  - SSO 서비스를 `domain/common`으로 통합 (FCM 토큰 조회 기능 포함)
- ✅ **WikiPermissionLog 스케줄러 개선**
  - **매일 새벽 2시 자동 검증** (Cron: `0 2 * * *`)
  - 중복 로그 방지 기능 추가
  - **수동 실행 API 추가**: `POST /admin/permission-validation/wiki`
- ✅ **권한 검증 관리자 API 추가**
  - `PermissionValidationController` 컨트롤러 추가
  - 위키/공지사항 권한 검증 즉시 실행 기능
  - 모든 권한 검증 병렬 실행 기능 (`POST /admin/permission-validation/all`)

### v5.19 (2026-01-14)
- ✅ **ContentStatus 제거 및 콘텐츠 관리 단순화**
  - 9개 콘텐츠 엔티티에서 `status` 필드 제거: Announcement, Brochure, ElectronicDisclosure, IR, News, LumirStory, MainPopup, ShareholdersMeeting, VideoGallery
  - ContentStatus enum 완전 제거 (더 이상 사용하지 않음)
  - 복잡한 승인 워크플로우 제거 → `isPublic` 필드만으로 간단히 관리
  - 관리자 1명 환경에 최적화된 단순한 콘텐츠 관리 시스템
  - 기본값 변경: 모든 콘텐츠 생성 시 `isPublic: true` (즉시 공개)
  - 상태 흐름 다이어그램 9개 삭제

### v5.19 (2026-01-15)
- ✅ **권한 필드를 모두 ID 기반으로 변경**
  - `permissionRankCodes` → `permissionRankIds` (직급 ID)
  - `permissionPositionCodes` → `permissionPositionIds` (직책 ID)
  - `permissionDepartmentCodes` → `permissionDepartmentIds` (부서 ID)
  - 코드 대신 UUID 기반 ID로 권한 설정
  - ID는 고유하고 변경되지 않아 안정적
  - 예: `["manager", "경영지원-경지"]` → `["uuid-1", "uuid-2"]`

### v5.18 (2026-01-14)
- ✅ **WikiFileSystem 파일 비공개 설정 추가**
  - 파일의 `isPublic` 필드 활성화
  - 파일 `isPublic: false` → 완전 비공개 (아무도 접근 불가)
  - 파일 `isPublic: true` (기본값) → 상위 폴더 권한 cascading
  - 파일의 `permissionRankIds/PositionIds/DepartmentIds`는 여전히 NULL

### v5.17 (2026-01-14)
- ✅ **WikiFileSystem 권한 정책 변경**
  - 권한은 **폴더만** 설정 가능 (isPublic, permissionRankIds, permissionPositionIds, permissionDepartmentIds)
  - 파일의 권한은 **상위 폴더에서 cascading**되어 결정
  - 상위 폴더가 더 제한적이면 하위 폴더/파일도 제한됨
  - 루트에서 현재 위치까지의 모든 폴더 권한을 체크하여 가장 제한적인 권한 적용

### v5.16 (2026-01-14)
- ✅ **WikiFileSystem 문서 기능 추가**
  - `title` 필드 추가 (문서 제목)
  - `content` 필드 추가 (문서 본문)
  - `attachments` 필드 추가 (첨부파일 목록 JSONB)
  - file 타입에서 문서 작성 및 첨부파일 업로드 동시 지원
  - folder 타입은 기존대로 name만 사용

### v5.15 (2026-01-09)
- ✅ **파일 업로드 방식 변경**
  - Form-data 업로드: 클라이언트가 `multipart/form-data`로 파일 전송
  - 백엔드 처리: NestJS Multer로 파일 수신 → AWS S3 업로드 → 메타데이터 자동 저장
  - attachments JSONB는 백엔드에서 자동 생성 (파일명, 크기, MIME 타입, S3 URL)

### v5.14 (2026-01-08)
- ✅ **데이터 타입 일관성 개선**
  - `VoteResult.order` 필드 제거 (agendaNumber로 정렬)
  - date → timestamp 변경: `ShareholdersMeeting.meetingDate`, `Survey.startDate/endDate`, `EducationManagement.deadline`
  - 모든 날짜 관련 필드가 시간 정보 포함 (정확한 일시 관리)
- ✅ **WikiFileSystem 권한 무효화 추적**
  - `WikiPermissionLog` 엔티티 추가
  - 외부 시스템(SSO) 부서/직급/직책 ID 제거 시 이력 추적
  - WikiFileSystem 전용 감사 로그 및 문제 해결 히스토리
- ✅ **설문 응답 삭제 정책 명확화**
  - `SurveyResponseCheckbox`: hard delete 사용 (체크박스 선택/해제 반복 지원)
  - 사용자가 선택 취소 시 레코드 완전 삭제 (UK 제약조건 문제 없음)

### v5.13 (2026-01-08)
- ✅ **상태 관리 필드 추가** (v5.19에서 ContentStatus 제거됨)
  - `EducationManagement.status` 필드 추가 (EducationStatus enum)
  - `EducationStatus` enum 정의 추가: scheduled, in_progress, completed, cancelled, postponed

### v5.12 (2026-01-08)
- ✅ **WikiFileSystem Closure Table 도입**
  - `WikiFileSystemClosure` 엔티티 추가 (조상-자손 관계 미리 저장)
  - `WikiFileSystem.depth` 필드 추가 (계층 깊이 캐싱)
  - 빈번한 폴더 이동/추가/삭제 작업 최적화
  - 조회 성능 극대화 (재귀 쿼리 불필요)
  - 트리거 자동화: 삽입/이동 시 Closure Table 자동 유지
  - 인덱스 추가: `idx_wiki_closure_ancestor`, `idx_wiki_closure_descendant` 등
  - CHECK 제약조건 추가: depth 검증, 자기 참조 검증
  - 순환 참조 방지 로직 추가

### v5.11 (2026-01-08)
- ✅ **WikiFileSystem 권한 관리 개선**
  - `WikiFileSystem.permissionEmployeeIds` 제거
  - `WikiFileSystem.permissionRankIds` 추가 (직급 ID 목록)
  - `WikiFileSystem.permissionPositionIds` 추가 (직책 ID 목록)
  - `WikiFileSystem.permissionDepartmentIds` 추가 (부서 ID 목록)
  - 세밀한 권한 관리 (Announcement와 동일한 패턴)
  - CHECK 제약조건 업데이트: 제한공개 시 최소 하나의 권한 필드 필요

### v5.10 (2026-01-08)
- ✅ **Survey-Announcement 통합**
  - `Survey.announcementId` FK 추가 (필수, 유니크)
  - `Survey.status` 제거 (Announcement의 isPublic으로 제어)
  - `Survey.permissionEmployeeIds` 제거 (Announcement 권한 사용)
  - `AnnouncementResponse` 엔티티 제거 (Survey로 통합)
  - `Announcement.requiresResponse` 필드 제거
  - 설문조사는 공지사항에 종속되어 공지사항 권한/마감일에 따라 제출 가능 여부 결정
  - Survey의 CategoryMapping 관계 제거 (Announcement에서만 카테고리 관리)

### v5.9 (2026-01-08)
- ✅ **첨부파일 관리 단순화**
  - Brochure: attachments JSONB 필드 추가 (기본 테이블)
  - BrochureTranslation: fileUrl 필드 제거
  - IRTranslation: fileUrl 필드 제거
  - MainPopupTranslation: imageUrl 필드 제거
  - **파일명으로 언어 구분**: 다국어 파일은 파일명으로 구분 (예: `brochure_ko.pdf`, `brochure_en.pdf`, `popup_image_ko.jpg`)
  - 모든 첨부파일은 기본 테이블의 attachments JSONB 배열로 통합 관리

---

**문서 생성일**: 2026년 1월 6일  
**최종 업데이트**: 2026년 1월 15일  
**버전**: v5.20
