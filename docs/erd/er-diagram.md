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

    %% ==========================================
    %% Core Domain (핵심 비즈니스 로직)
    %% - ShareholdersMeeting, ElectronicDisclosure, IR
    %% - Brochure, News, Announcement
    %% ==========================================
    
    ShareholdersMeeting {
        uuid id PK "description"
        boolean isPublic
        varchar location
        date meetingDate
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
        int agendaNumber "안건 번호"
        int totalVote
        int yesVote
        int noVote
        float approvalRating "찬성률(%)"
        varchar result "accepted|rejected"
        int order
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
        varchar status "draft|approved|under_review|rejected|opened"
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
        varchar status "draft|approved|under_review|rejected|opened"
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
        text fileUrl "nullable - AWS S3 URL (IR 자료 파일, 언어별)"
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
        varchar status "draft|approved|under_review|rejected|opened"
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
        text fileUrl "nullable - AWS S3 URL (브로슈어 파일, 언어별)"
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
        varchar status "draft|approved|under_review|rejected|opened"
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
        boolean requiresResponse "응답 필요 여부"
        varchar status "draft|approved|under_review|rejected|opened"
        jsonb permissionEmployeeIds "특정 직원 ID 목록"
        jsonb permissionRankCodes "직급 코드 목록"
        jsonb permissionPositionCodes "직책 코드 목록"
        jsonb permissionDepartmentCodes "부서 코드 목록"
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

    AnnouncementResponse {
        uuid id PK "description"
        uuid announcementId UK "FK - 유니크 제약조건: (announcementId, employeeId) - 직원이 응답할 때 생성"
        uuid employeeId UK "외부 시스템 직원 ID (SSO)"
        text responseMessage "응답 메시지"
        timestamp submittedAt "응답 제출 시각"
        timestamp createdAt
        timestamp updatedAt
        timestamp deletedAt "nullable"
        uuid createdBy "nullable - 외부 시스템 직원 ID (SSO)"
        uuid updatedBy "nullable - 외부 시스템 직원 ID (SSO)"
        int version
    }

    %% ==========================================
    %% Sub Domain (부가 지원 기능)
    %% - MainPopup, LumirStory, VideoGallery, Survey
    %% - EducationManagement, WikiFileSystem
    %% ==========================================
    
    MainPopup {
        uuid id PK "description"
        varchar status "draft|approved|under_review|rejected|opened"
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
        text imageUrl "nullable - AWS S3 URL (팝업 이미지, 언어별)"
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
        varchar status "draft|approved|under_review|rejected|opened"
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
        varchar status "draft|approved|under_review|rejected|opened"
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
        varchar title
        text description
        varchar status "draft|approved|under_review|rejected|opened"
        date startDate "nullable"
        date endDate "nullable"
        jsonb permissionEmployeeIds "외부 시스템 직원 IDs (SSO)"
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
        uuid managerId "담당자 ID (외부 시스템 직원 ID - SSO)"
        date deadline
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
        text fileUrl "nullable - AWS S3 URL"
        bigint fileSize "nullable - 파일 크기(bytes)"
        varchar mimeType "nullable - MIME 타입"
        boolean isPublic
        jsonb permissionEmployeeIds "외부 시스템 직원 IDs (SSO)"
        int order
        timestamp createdAt
        timestamp updatedAt
        timestamp deletedAt "nullable"
        uuid createdBy "nullable - 외부 시스템 직원 ID (SSO)"
        uuid updatedBy "nullable - 외부 시스템 직원 ID (SSO)"
        int version
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
    Announcement ||--o{ AnnouncementResponse : "has responses (optional)"
    
    %% ==========================================
    %% Relationships - Sub Domain
    %% ==========================================
    
    MainPopup ||--o{ CategoryMapping : "has"
    MainPopup ||--o{ MainPopupTranslation : "has translations"
    MainPopupTranslation }o--|| Language : "in language"
    
    LumirStory ||--o{ CategoryMapping : "has"
    
    VideoGallery ||--o{ CategoryMapping : "has"
    
    Survey ||--o{ CategoryMapping : "has"
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

### Sub Domain (부가 기능)
핵심 비즈니스를 지원하는 부가 기능

| 엔티티 | 설명 | 다국어 지원 |
|--------|------|-------------|
| **MainPopup** | 메인 페이지 팝업 | ✅ |
| **LumirStory** | 회사 스토리 및 콘텐츠 | ❌ |
| **VideoGallery** | 비디오 콘텐츠 | ❌ |
| **Survey** | 직원 설문조사 및 응답 (타입별 테이블 분리) | ❌ |
| **EducationManagement** | 직원 교육 및 수강 관리 | ❌ |
| **WikiFileSystem** | 문서 및 파일 관리 (계층 구조) | ❌ |

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
  SURVEY = 'survey',
  EDUCATION_MANAGEMENT = 'education_management'
}
```

### ContentStatus
```typescript
enum ContentStatus {
  DRAFT = 'draft',           // 초안
  APPROVED = 'approved',     // 승인됨
  UNDER_REVIEW = 'under_review',  // 검토중
  REJECTED = 'rejected',     // 거부됨
  OPENED = 'opened'          // 공개됨
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

### 6. 공통 기능
- **Soft Delete**: `deletedAt` 필드로 논리 삭제
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

**문서 생성일**: 2026년 1월 6일  
**최종 업데이트**: 2026년 1월 8일  
**버전**: v5.8
