import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { faker } from '@faker-js/faker/locale/ko';

// Domain Entities
import { Language } from '@domain/common/language/language.entity';
import { Category } from '@domain/common/category/category.entity';
import { Announcement } from '@domain/core/announcement/announcement.entity';
import { News } from '@domain/core/news/news.entity';
import { Brochure } from '@domain/core/brochure/brochure.entity';
import { ElectronicDisclosure } from '@domain/core/electronic-disclosure/electronic-disclosure.entity';
import { IR } from '@domain/core/ir/ir.entity';
import { ShareholdersMeeting } from '@domain/core/shareholders-meeting/shareholders-meeting.entity';
import { MainPopup } from '@domain/sub/main-popup/main-popup.entity';
import { LumirStory } from '@domain/sub/lumir-story/lumir-story.entity';
import { VideoGallery } from '@domain/sub/video-gallery/video-gallery.entity';
import { WikiFileSystem } from '@domain/sub/wiki-file-system/wiki-file-system.entity';
import { Survey } from '@domain/sub/survey/survey.entity';
import { SurveyQuestion } from '@domain/sub/survey/survey-question.entity';
import { SurveyCompletion } from '@domain/sub/survey/survey-completion.entity';
import { SurveyResponseChoice } from '@domain/sub/survey/responses/survey-response-choice.entity';
import { SurveyResponseCheckbox } from '@domain/sub/survey/responses/survey-response-checkbox.entity';
import { SurveyResponseScale } from '@domain/sub/survey/responses/survey-response-scale.entity';
import { SurveyResponseText } from '@domain/sub/survey/responses/survey-response-text.entity';

// Domain Services
import { LanguageService } from '@domain/common/language/language.service';
import { CategoryService } from '@domain/common/category/category.service';
import { AnnouncementService } from '@domain/core/announcement/announcement.service';
import { NewsService } from '@domain/core/news/news.service';
import { SurveyService } from '@domain/sub/survey/survey.service';

// Context Services
import { CompanyContextService } from '@context/company-context/company-context.service';
import { BrochureContextService } from '@context/brochure-context/brochure-context.service';
import { ElectronicDisclosureContextService } from '@context/electronic-disclosure-context/electronic-disclosure-context.service';
import { IRContextService } from '@context/ir-context/ir-context.service';
import { ShareholdersMeetingContextService } from '@context/shareholders-meeting-context/shareholders-meeting-context.service';
import { MainPopupContextService } from '@context/main-popup-context/main-popup-context.service';
import { LumirStoryContextService } from '@context/lumir-story-context/lumir-story-context.service';
import { VideoGalleryContextService } from '@context/video-gallery-context/video-gallery-context.service';
import { WikiContextService } from '@context/wiki-context/wiki-context.service';

// Types
import { SeedScenario } from '@interface/common/dto/seed-data/seed-data-config.dto';
import { LanguageCode } from '@domain/common/language/language-code.types';
import { CategoryEntityType } from '@domain/common/category/category-entity-type.types';
import { GetSeedDataStatusDto } from '@interface/common/dto/seed-data';
import { InqueryType } from '@domain/sub/survey/inquery-type.types';

/**
 * 시드 데이터 Context 서비스
 * 개발 및 테스트를 위한 시드 데이터 생성/관리를 담당합니다.
 */
@Injectable()
export class SeedDataContextService {
  private readonly logger = new Logger(SeedDataContextService.name);

  constructor(
    // Repositories
    @InjectRepository(Language)
    private readonly languageRepository: Repository<Language>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Announcement)
    private readonly announcementRepository: Repository<Announcement>,
    @InjectRepository(News)
    private readonly newsRepository: Repository<News>,
    @InjectRepository(Brochure)
    private readonly brochureRepository: Repository<Brochure>,
    @InjectRepository(ElectronicDisclosure)
    private readonly electronicDisclosureRepository: Repository<ElectronicDisclosure>,
    @InjectRepository(IR)
    private readonly irRepository: Repository<IR>,
    @InjectRepository(ShareholdersMeeting)
    private readonly shareholdersMeetingRepository: Repository<ShareholdersMeeting>,
    @InjectRepository(MainPopup)
    private readonly mainPopupRepository: Repository<MainPopup>,
    @InjectRepository(LumirStory)
    private readonly lumirStoryRepository: Repository<LumirStory>,
    @InjectRepository(VideoGallery)
    private readonly videoGalleryRepository: Repository<VideoGallery>,
    @InjectRepository(WikiFileSystem)
    private readonly wikiFileSystemRepository: Repository<WikiFileSystem>,
    @InjectRepository(Survey)
    private readonly surveyRepository: Repository<Survey>,
    @InjectRepository(SurveyQuestion)
    private readonly surveyQuestionRepository: Repository<SurveyQuestion>,
    @InjectRepository(SurveyCompletion)
    private readonly surveyCompletionRepository: Repository<SurveyCompletion>,
    @InjectRepository(SurveyResponseChoice)
    private readonly surveyResponseChoiceRepository: Repository<SurveyResponseChoice>,
    @InjectRepository(SurveyResponseCheckbox)
    private readonly surveyResponseCheckboxRepository: Repository<SurveyResponseCheckbox>,
    @InjectRepository(SurveyResponseScale)
    private readonly surveyResponseScaleRepository: Repository<SurveyResponseScale>,
    @InjectRepository(SurveyResponseText)
    private readonly surveyResponseTextRepository: Repository<SurveyResponseText>,

    // Services
    private readonly languageService: LanguageService,
    private readonly categoryService: CategoryService,
    private readonly announcementService: AnnouncementService,
    private readonly newsService: NewsService,
    private readonly surveyService: SurveyService,
    private readonly companyContextService: CompanyContextService,
    private readonly brochureContextService: BrochureContextService,
    private readonly electronicDisclosureContextService: ElectronicDisclosureContextService,
    private readonly irContextService: IRContextService,
    private readonly shareholdersMeetingContextService: ShareholdersMeetingContextService,
    private readonly mainPopupContextService: MainPopupContextService,
    private readonly lumirStoryContextService: LumirStoryContextService,
    private readonly videoGalleryContextService: VideoGalleryContextService,
    private readonly wikiContextService: WikiContextService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 시드 데이터를 생성한다
   */
  async 시드_데이터를_생성한다(config: {
    scenario: SeedScenario;
  }): Promise<Record<string, number>> {
    this.logger.log(
      `시드 데이터 생성 시작 - 시나리오: ${config.scenario}`,
    );

    const results: Record<string, number> = {};

    // 기존 데이터 삭제 (항상 수행)
    this.logger.log('기존 시드 데이터 삭제 중...');
    await this.시드_데이터를_삭제한다(true);

    // 언어 데이터 생성 (모든 시나리오 공통)
    const languageCount = await this.언어_시드_데이터를_생성한다();
    results.languages = languageCount;

    // BASIC 시나리오
    if (config.scenario === SeedScenario.BASIC) {
      this.logger.log('BASIC 시나리오 데이터 생성 중...');

      // 공지사항 카테고리
      const announcementCategoryCount = await this.공지사항_카테고리_시드_데이터를_생성한다();
      results.announcementCategories = announcementCategoryCount;

      // 공지사항 15개
      const announcementCount = await this.공지사항_시드_데이터를_생성한다(15);
      results.announcements = announcementCount;

      // 뉴스 10개
      const newsCount = await this.뉴스_시드_데이터를_생성한다(10);
      results.news = newsCount;

      // 브로슈어 카테고리
      const brochureCategoryCount = await this.브로슈어_카테고리_시드_데이터를_생성한다();
      results.brochureCategories = brochureCategoryCount;

      // 브로셔 5개
      const brochureCount = await this.브로셔_시드_데이터를_생성한다(5);
      results.brochures = brochureCount;
    }

    // FULL 시나리오
    if (config.scenario === SeedScenario.FULL) {
      this.logger.log('FULL 시나리오 데이터 생성 중...');

      // BASIC 시나리오 데이터 먼저 생성
      const announcementCategoryCount = await this.공지사항_카테고리_시드_데이터를_생성한다();
      results.announcementCategories = announcementCategoryCount;

      const announcementCount = await this.공지사항_시드_데이터를_생성한다(15);
      results.announcements = announcementCount;

      const newsCount = await this.뉴스_시드_데이터를_생성한다(10);
      results.news = newsCount;

      // 브로슈어 카테고리
      const brochureCategoryCount = await this.브로슈어_카테고리_시드_데이터를_생성한다();
      results.brochureCategories = brochureCategoryCount;

      const brochureCount = await this.브로셔_시드_데이터를_생성한다(5);
      results.brochures = brochureCount;

      // 추가 다국어 엔티티들
      this.logger.log('추가 다국어 엔티티 데이터 생성 중...');
      
      // 전자공시 카테고리
      const electronicDisclosureCategoryCount = await this.전자공시_카테고리_시드_데이터를_생성한다();
      results.electronicDisclosureCategories = electronicDisclosureCategoryCount;
      
      const electronicDisclosureCount = await this.전자공시_시드_데이터를_생성한다(10);
      results.electronicDisclosures = electronicDisclosureCount;

      // IR 카테고리
      const irCategoryCount = await this.IR_카테고리_시드_데이터를_생성한다();
      results.irCategories = irCategoryCount;

      const irCount = await this.IR_시드_데이터를_생성한다(10);
      results.irs = irCount;

      const shareholdersMeetingCount = await this.주주총회_시드_데이터를_생성한다(5);
      results.shareholdersMeetings = shareholdersMeetingCount;

      const mainPopupCount = await this.메인_팝업_시드_데이터를_생성한다(3);
      results.mainPopups = mainPopupCount;

      // 추가 일반 엔티티들
      this.logger.log('추가 일반 엔티티 데이터 생성 중...');

      const lumirStoryCount = await this.루미르스토리_시드_데이터를_생성한다(10);
      results.lumirStories = lumirStoryCount;

      const videoGalleryCount = await this.비디오갤러리_시드_데이터를_생성한다(8);
      results.videoGalleries = videoGalleryCount;

      const wikiCount = await this.Wiki_시드_데이터를_생성한다();
      results.wikis = wikiCount;
    }

    this.logger.log(
      `시드 데이터 생성 완료 - 결과: ${JSON.stringify(results)}`,
    );

    return results;
  }

  /**
   * 언어 시드 데이터를 생성한다 (4개 고정)
   */
  private async 언어_시드_데이터를_생성한다(): Promise<number> {
    this.logger.log(`언어 시드 데이터 생성 시작`);

    const languages: Array<{ code: LanguageCode; name: string }> = [
      { code: 'ko' as LanguageCode, name: '한국어' },
      { code: 'en' as LanguageCode, name: 'English' },
      { code: 'ja' as LanguageCode, name: '日本語' },
      { code: 'zh' as LanguageCode, name: '中文' },
    ];

    let created = 0;

    for (const lang of languages) {
      // 이미 존재하는지 확인
      const exists = await this.languageService.언어가_존재하는가(lang.code);

      if (!exists) {
        await this.languageService.언어를_생성한다({
          code: lang.code,
          name: lang.name,
          isActive: true,
          createdBy: 'seed',
        });
        created++;
        this.logger.debug(`언어 생성: ${lang.name} (${lang.code})`);
      } else {
        this.logger.debug(`언어 이미 존재: ${lang.name} (${lang.code})`);
      }
    }

    this.logger.log(`언어 시드 데이터 생성 완료 - 생성된 개수: ${created}`);
    return created;
  }

  /**
   * 공지사항 카테고리 시드 데이터를 생성한다
   */
  private async 공지사항_카테고리_시드_데이터를_생성한다(): Promise<number> {
    this.logger.log(`공지사항 카테고리 시드 데이터 생성 시작`);

    const categories = [
      { name: '일반 공지', description: '일반적인 공지사항' },
      { name: '긴급 공지', description: '긴급하게 전달해야 하는 공지사항' },
      { name: '시스템 공지', description: '시스템 관련 공지사항' },
    ];

    let created = 0;

    for (let i = 0; i < categories.length; i++) {
      await this.categoryService.카테고리를_생성한다({
        entityType: CategoryEntityType.ANNOUNCEMENT,
        name: categories[i].name,
        description: categories[i].description,
        isActive: true,
        order: i,
        createdBy: 'seed',
      });
      created++;
    }

    this.logger.log(
      `공지사항 카테고리 시드 데이터 생성 완료 - 생성된 개수: ${created}`,
    );
    return created;
  }

  /**
   * 브로슈어 카테고리 시드 데이터를 생성한다
   */
  private async 브로슈어_카테고리_시드_데이터를_생성한다(): Promise<number> {
    this.logger.log(`브로슈어 카테고리 시드 데이터 생성 시작`);

    const categories = [
      { name: '회사 소개', description: '회사 소개 관련 브로슈어' },
      { name: '제품 소개', description: '제품 소개 관련 브로슈어' },
      { name: '기술 문서', description: '기술 문서 관련 브로슈어' },
    ];

    let created = 0;

    for (let i = 0; i < categories.length; i++) {
      await this.categoryService.카테고리를_생성한다({
        entityType: CategoryEntityType.BROCHURE,
        name: categories[i].name,
        description: categories[i].description,
        isActive: true,
        order: i,
        createdBy: 'seed',
      });
      created++;
    }

    this.logger.log(
      `브로슈어 카테고리 시드 데이터 생성 완료 - 생성된 개수: ${created}`,
    );
    return created;
  }

  /**
   * 전자공시 카테고리 시드 데이터를 생성한다
   */
  private async 전자공시_카테고리_시드_데이터를_생성한다(): Promise<number> {
    this.logger.log(`전자공시 카테고리 시드 데이터 생성 시작`);

    const categories = [
      { name: '분기보고서', description: '분기별 실적 보고서' },
      { name: '반기보고서', description: '반기별 실적 보고서' },
      { name: '사업보고서', description: '연간 사업 보고서' },
      { name: '주요사항보고서', description: '주요 사항 보고서' },
    ];

    let created = 0;

    for (let i = 0; i < categories.length; i++) {
      await this.categoryService.카테고리를_생성한다({
        entityType: CategoryEntityType.ELECTRONIC_DISCLOSURE,
        name: categories[i].name,
        description: categories[i].description,
        isActive: true,
        order: i,
        createdBy: 'seed',
      });
      created++;
    }

    this.logger.log(
      `전자공시 카테고리 시드 데이터 생성 완료 - 생성된 개수: ${created}`,
    );
    return created;
  }

  /**
   * IR 카테고리 시드 데이터를 생성한다
   */
  private async IR_카테고리_시드_데이터를_생성한다(): Promise<number> {
    this.logger.log(`IR 카테고리 시드 데이터 생성 시작`);

    const categories = [
      { name: '재무제표', description: '재무제표 관련 자료' },
      { name: '사업보고서', description: '사업보고서 관련 자료' },
      { name: '경영설명회', description: '경영설명회 자료' },
      { name: '애널리스트 리포트', description: '애널리스트 리포트' },
    ];

    let created = 0;

    for (let i = 0; i < categories.length; i++) {
      await this.categoryService.카테고리를_생성한다({
        entityType: CategoryEntityType.IR,
        name: categories[i].name,
        description: categories[i].description,
        isActive: true,
        order: i,
        createdBy: 'seed',
      });
      created++;
    }

    this.logger.log(
      `IR 카테고리 시드 데이터 생성 완료 - 생성된 개수: ${created}`,
    );
    return created;
  }

  /**
   * 공지사항 시드 데이터를 생성한다
   */
  private async 공지사항_시드_데이터를_생성한다(
    count: number,
  ): Promise<number> {
    this.logger.log(`공지사항 시드 데이터 생성 시작 - 개수: ${count}`);

    // SSO에서 회사 정보 가져오기 (권한 설정용)
    let departments: string[] = [];
    let rankCodes: string[] = [];
    let positionCodes: string[] = [];
    let employeeIds: string[] = [];

    try {
      // 조직 정보에서 직원 ID 추출
      const orgInfo = await this.companyContextService.조직_정보를_가져온다();
      employeeIds = orgInfo.departments
        .flatMap((dept) => dept.employees || [])
        .map((emp) => emp.id)
        .filter(Boolean);

      const deptResult = await this.companyContextService.부서_정보를_가져온다();
      departments = deptResult.departments
        .map((d) => d.id)
        .filter(Boolean);

      const rankResult = await this.companyContextService.직급_정보를_가져온다();
      rankCodes = rankResult.map((r) => r.id).filter(Boolean);

      const positionResult = await this.companyContextService.직책_정보를_가져온다();
      positionCodes = positionResult
        .map((p) => p.id)
        .filter(Boolean);

      this.logger.debug(
        `회사 정보 조회 완료 - 직원: ${employeeIds.length}명, 부서: ${departments.length}개, 직급: ${rankCodes.length}개, 직책: ${positionCodes.length}개`,
      );
    } catch (error) {
      this.logger.warn(
        `회사 정보 조회 실패: ${error.message}. 권한 설정 없이 진행합니다.`,
      );
    }

    let created = 0;
    const createdAnnouncements: Announcement[] = [];

    for (let i = 0; i < count; i++) {
      const isFixed = i < 3; // 처음 3개는 고정
      const mustRead = i < 3; // 처음 3개는 필독

      // 공지사항 권한 설정 패턴
      let permissionEmployeeIds: string[] | null = null;
      let permissionRankCodes: string[] | null = null;
      let permissionPositionCodes: string[] | null = null;
      let permissionRankIds: string[] | null = null;
      let permissionPositionIds: string[] | null = null;
      let permissionDepartmentIds: string[] | null = null;
      let isPublic = true;

      if (i >= 3 && i < 6 && employeeIds.length > 0) {
        // 4~6번: 특정 직원만 (제한 공개)
        isPublic = false;
        const selectedEmployees = employeeIds
          .sort(() => 0.5 - Math.random())
          .slice(0, Math.min(5, employeeIds.length));
        permissionEmployeeIds = selectedEmployees;
      } else if (i >= 6 && i < 9 && departments.length > 0) {
        // 7~9번: 특정 부서만 (제한 공개)
        isPublic = false;
        const selectedDepts = departments
          .sort(() => 0.5 - Math.random())
          .slice(0, Math.min(3, departments.length));
        permissionDepartmentIds = selectedDepts;
      } else if (i >= 9 && i < 11 && rankCodes.length > 0) {
        // 10~11번: 특정 직급만 (제한 공개)
        isPublic = false;
        const selectedRanks = rankCodes
          .sort(() => 0.5 - Math.random())
          .slice(0, Math.min(2, rankCodes.length));
        permissionRankCodes = selectedRanks;
      } else if (i >= 11 && i < 13 && positionCodes.length > 0) {
        // 12~13번: 특정 직책만 (제한 공개)
        isPublic = false;
        const selectedPositions = positionCodes
          .sort(() => 0.5 - Math.random())
          .slice(0, Math.min(2, positionCodes.length));
        permissionPositionCodes = selectedPositions;
      } else if (i >= 13 && employeeIds.length > 0 && departments.length > 0) {
        // 14번 이후: 여러 권한 조합 (OR 조건 테스트)
        isPublic = false;
        // 직원 ID 일부 + 부서 ID 일부 조합
        const selectedEmployees = employeeIds
          .sort(() => 0.5 - Math.random())
          .slice(0, Math.min(3, employeeIds.length));
        const selectedDepts = departments
          .sort(() => 0.5 - Math.random())
          .slice(0, Math.min(2, departments.length));
        
        permissionEmployeeIds = selectedEmployees;
        permissionDepartmentIds = selectedDepts;
        
        // 일부는 직급도 추가 (OR 조건 3개)
        if (i % 2 === 0 && rankCodes.length > 0) {
          const selectedRanks = rankCodes
            .sort(() => 0.5 - Math.random())
            .slice(0, Math.min(1, rankCodes.length));
          permissionRankCodes = selectedRanks;
        }
      }

      // 첨부파일 더미 데이터 (일부 공지사항에만)
      let attachments: Array<{
        fileName: string;
        fileUrl: string;
        fileSize: number;
        mimeType: string;
      }> | null = null;

      if (i % 4 === 0) {
        // 4개 중 1개는 첨부파일 있음
        attachments = [
          {
            fileName: `공지사항_${i + 1}_첨부파일.pdf`,
            fileUrl: `https://example.com/files/announcement_${i + 1}.pdf`,
            fileSize: Math.floor(Math.random() * 5000000) + 100000, // 100KB ~ 5MB
            mimeType: 'application/pdf',
          },
        ];

        // 일부는 여러 첨부파일
        if (i % 8 === 0 && attachments) {
          attachments.push({
            fileName: `공지사항_${i + 1}_이미지.jpg`,
            fileUrl: `https://example.com/files/announcement_${i + 1}_image.jpg`,
            fileSize: Math.floor(Math.random() * 2000000) + 50000,
            mimeType: 'image/jpeg',
          });
        }
      }

      const announcement = await this.announcementService.공지사항을_생성한다({
        title: `${faker.lorem.sentence()} - 공지사항 ${i + 1}`,
        content: faker.lorem.paragraphs(3),
        isFixed,
        isPublic,
        releasedAt: new Date(),
        expiredAt: null,
        mustRead,
        permissionEmployeeIds,
        permissionRankIds,
        permissionPositionIds,
        permissionDepartmentIds,
        attachments,
        order: count - i,
        createdBy: 'seed',
      });

      createdAnnouncements.push(announcement);
      created++;
    }

    this.logger.log(
      `공지사항 시드 데이터 생성 완료 - 생성된 개수: ${created}`,
    );

    // 일부 공지사항에 설문조사 추가 (3개)
    this.logger.log('공지사항에 설문조사 추가 시작...');
    let surveyCreated = 0;

    // 첫 번째 설문: 만족도 조사 (선형 척도)
    if (createdAnnouncements[0]) {
      await this.surveyService.설문조사를_생성한다({
        announcementId: createdAnnouncements[0].id,
        title: '2024년 직원 만족도 조사',
        description: '우리 회사의 발전을 위한 소중한 의견을 들려주세요.',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30일 후
        order: 0,
        questions: [
          {
            title: '회사에 대한 전반적인 만족도를 평가해주세요',
            type: InqueryType.LINEAR_SCALE,
            form: {
              minScale: 1,
              maxScale: 10,
            },
            isRequired: true,
            order: 0,
          },
          {
            title: '복리후생에 만족하시나요?',
            type: InqueryType.LINEAR_SCALE,
            form: {
              minScale: 1,
              maxScale: 5,
            },
            isRequired: true,
            order: 1,
          },
          {
            title: '개선이 필요한 부분을 선택해주세요 (복수 선택 가능)',
            type: InqueryType.CHECKBOXES,
            form: {
              options: ['업무 환경', '복리후생', '커뮤니케이션', '교육/성장', '워라밸', '기타'],
            },
            isRequired: false,
            order: 2,
          },
          {
            title: '추가 의견이 있으시면 작성해주세요',
            type: InqueryType.PARAGRAPH,
            form: null,
            isRequired: false,
            order: 3,
          },
        ],
      });
      surveyCreated++;
      this.logger.debug(`설문조사 생성 - 공지사항 "${createdAnnouncements[0].title}"`);
    }

    // 두 번째 설문: 교육 프로그램 선호도 (객관식, 체크박스)
    if (createdAnnouncements[3]) {
      await this.surveyService.설문조사를_생성한다({
        announcementId: createdAnnouncements[3].id,
        title: '2024년 교육 프로그램 수요 조사',
        description: '직원 여러분의 성장을 위한 교육 프로그램을 기획하고 있습니다.',
        startDate: new Date(),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14일 후
        order: 0,
        questions: [
          {
            title: '소속 부서를 선택해주세요',
            type: InqueryType.MULTIPLE_CHOICE,
            form: {
              options: ['개발팀', '디자인팀', '마케팅팀', '영업팀', '경영지원팀', '기타'],
            },
            isRequired: true,
            order: 0,
          },
          {
            title: '관심있는 교육 분야를 모두 선택해주세요',
            type: InqueryType.CHECKBOXES,
            form: {
              options: [
                '프로그래밍 언어',
                'AI/머신러닝',
                '클라우드 기술',
                '프로젝트 관리',
                '커뮤니케이션',
                '리더십',
                '외국어',
              ],
            },
            isRequired: true,
            order: 1,
          },
          {
            title: '선호하는 교육 방식을 선택해주세요',
            type: InqueryType.MULTIPLE_CHOICE,
            form: {
              options: ['온라인 강의', '오프라인 워크샵', '사내 멘토링', '외부 교육 과정', '도서 지원'],
            },
            isRequired: true,
            order: 2,
          },
          {
            title: '교육 프로그램에 대한 제안사항이 있으시면 작성해주세요',
            type: InqueryType.PARAGRAPH,
            form: null,
            isRequired: false,
            order: 3,
          },
        ],
      });
      surveyCreated++;
      this.logger.debug(`설문조사 생성 - 공지사항 "${createdAnnouncements[3].title}"`);
    }

    // 세 번째 설문: 간단한 의견 수렴 (단답형, 객관식)
    if (createdAnnouncements[7]) {
      await this.surveyService.설문조사를_생성한다({
        announcementId: createdAnnouncements[7].id,
        title: '사내 식당 메뉴 개선 설문',
        description: '더 나은 식사 환경을 위한 의견을 수렴합니다.',
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7일 후
        order: 0,
        questions: [
          {
            title: '선호하는 메뉴 스타일을 선택해주세요',
            type: InqueryType.MULTIPLE_CHOICE,
            form: {
              options: ['한식', '중식', '일식', '양식', '분식', '샐러드/헬시'],
            },
            isRequired: true,
            order: 0,
          },
          {
            title: '식사 시간에 만족하시나요?',
            type: InqueryType.LINEAR_SCALE,
            form: {
              minScale: 1,
              maxScale: 5,
            },
            isRequired: true,
            order: 1,
          },
          {
            title: '추가하고 싶은 메뉴가 있으시면 작성해주세요',
            type: InqueryType.SHORT_ANSWER,
            form: null,
            isRequired: false,
            order: 2,
          },
        ],
      });
      surveyCreated++;
      this.logger.debug(`설문조사 생성 - 공지사항 "${createdAnnouncements[7].title}"`);
    }

    this.logger.log(
      `설문조사 추가 완료 - 생성된 설문조사: ${surveyCreated}개`,
    );

    // 설문 응답 데이터 생성
    if (surveyCreated > 0 && employeeIds.length > 0) {
      this.logger.log('설문 응답 데이터 생성 시작...');
      await this.설문_응답_데이터를_생성한다(employeeIds);
      this.logger.log('설문 응답 데이터 생성 완료');
    }

    return created;
  }

  /**
   * 설문 응답 데이터를 생성한다
   */
  private async 설문_응답_데이터를_생성한다(
    employeeIds: string[],
  ): Promise<void> {
    // 모든 설문조사 조회
    const surveys = await this.surveyRepository.find({
      relations: ['questions'],
    });

    if (surveys.length === 0) {
      this.logger.debug('생성된 설문조사가 없습니다.');
      return;
    }

    for (const survey of surveys) {
      // 각 설문조사에 대해 30~50%의 직원이 응답하도록 설정
      const responseRate = 0.3 + Math.random() * 0.2; // 30~50%
      const responseCount = Math.max(
        Math.floor(employeeIds.length * responseRate),
        Math.min(10, employeeIds.length), // 최소 10명 또는 전체 직원 수
      );

      // 랜덤으로 응답할 직원 선택
      const respondents = employeeIds
        .sort(() => 0.5 - Math.random())
        .slice(0, responseCount);

      this.logger.debug(
        `설문 "${survey.title}" - ${respondents.length}명 응답 생성 중...`,
      );

      for (const employeeId of respondents) {
        await this.직원의_설문_응답을_생성한다(survey, employeeId);
      }

      this.logger.debug(
        `설문 "${survey.title}" - ${respondents.length}명 응답 생성 완료`,
      );
    }
  }

  /**
   * 특정 직원의 설문 응답을 생성한다
   */
  private async 직원의_설문_응답을_생성한다(
    survey: Survey,
    employeeId: string,
  ): Promise<void> {
    const submittedAt = new Date(
      Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000, // 최근 7일 이내
    );

    let answeredQuestions = 0;

    for (const question of survey.questions) {
      // 필수 질문은 100% 응답, 선택 질문은 80% 응답
      const shouldAnswer = question.isRequired || Math.random() > 0.2;

      if (!shouldAnswer) {
        continue;
      }

      try {
        switch (question.type) {
          case InqueryType.MULTIPLE_CHOICE:
          case InqueryType.DROPDOWN:
            await this.선택형_응답을_생성한다(
              question.id,
              employeeId,
              question.form?.options || [],
              submittedAt,
            );
            answeredQuestions++;
            break;

          case InqueryType.CHECKBOXES:
            await this.체크박스_응답을_생성한다(
              question.id,
              employeeId,
              question.form?.options || [],
              submittedAt,
            );
            answeredQuestions++;
            break;

          case InqueryType.LINEAR_SCALE:
            await this.척도_응답을_생성한다(
              question.id,
              employeeId,
              question.form?.minScale || 1,
              question.form?.maxScale || 10,
              submittedAt,
            );
            answeredQuestions++;
            break;

          case InqueryType.SHORT_ANSWER:
          case InqueryType.PARAGRAPH:
            await this.텍스트_응답을_생성한다(
              question.id,
              employeeId,
              question.type === InqueryType.PARAGRAPH,
              submittedAt,
            );
            answeredQuestions++;
            break;

          default:
            // 기타 타입은 무시
            break;
        }
      } catch (error) {
        this.logger.warn(
          `응답 생성 실패 (질문: ${question.id}, 직원: ${employeeId}): ${error.message}`,
        );
      }
    }

    // 완료 여부 확인 (모든 필수 질문에 답변했는지)
    const requiredQuestions = survey.questions.filter((q) => q.isRequired);
    const isCompleted = answeredQuestions >= requiredQuestions.length;

    // SurveyCompletion 생성
    const completion = this.surveyCompletionRepository.create({
      surveyId: survey.id,
      employeeId,
      totalQuestions: survey.questions.length,
      answeredQuestions,
      isCompleted,
      completedAt: isCompleted ? submittedAt : null,
      createdBy: 'seed',
    });

    await this.surveyCompletionRepository.save(completion);
  }

  /**
   * 선택형 응답을 생성한다 (MULTIPLE_CHOICE, DROPDOWN)
   */
  private async 선택형_응답을_생성한다(
    questionId: string,
    employeeId: string,
    options: string[],
    submittedAt: Date,
  ): Promise<void> {
    if (options.length === 0) {
      return;
    }

    // 랜덤하게 하나의 옵션 선택
    const selectedOption = options[Math.floor(Math.random() * options.length)];

    const response = this.surveyResponseChoiceRepository.create({
      questionId,
      employeeId,
      selectedOption,
      submittedAt,
      createdBy: 'seed',
    });

    await this.surveyResponseChoiceRepository.save(response);
  }

  /**
   * 체크박스 응답을 생성한다 (CHECKBOXES)
   */
  private async 체크박스_응답을_생성한다(
    questionId: string,
    employeeId: string,
    options: string[],
    submittedAt: Date,
  ): Promise<void> {
    if (options.length === 0) {
      return;
    }

    // 1~3개의 옵션을 랜덤하게 선택
    const selectCount = Math.min(
      Math.floor(Math.random() * 3) + 1,
      options.length,
    );
    const selectedOptions = options
      .sort(() => 0.5 - Math.random())
      .slice(0, selectCount);

    // 각 선택된 옵션에 대해 별도의 레코드 생성
    for (const option of selectedOptions) {
      const response = this.surveyResponseCheckboxRepository.create({
        questionId,
        employeeId,
        selectedOption: option,
        submittedAt,
        createdBy: 'seed',
      });

      await this.surveyResponseCheckboxRepository.save(response);
    }
  }

  /**
   * 척도 응답을 생성한다 (LINEAR_SCALE)
   */
  private async 척도_응답을_생성한다(
    questionId: string,
    employeeId: string,
    minScale: number,
    maxScale: number,
    submittedAt: Date,
  ): Promise<void> {
    // 정규분포를 따르는 랜덤값 생성 (중간~높은 값으로 치우치게)
    const range = maxScale - minScale;
    const mean = minScale + range * 0.7; // 평균을 70% 지점에
    const stdDev = range * 0.2; // 표준편차

    // Box-Muller 변환을 사용한 정규분포 랜덤값
    const u1 = Math.random();
    const u2 = Math.random();
    const randStdNormal =
      Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    let scaleValue = Math.round(mean + stdDev * randStdNormal);

    // 범위 내로 제한
    scaleValue = Math.max(minScale, Math.min(maxScale, scaleValue));

    const response = this.surveyResponseScaleRepository.create({
      questionId,
      employeeId,
      scaleValue,
      submittedAt,
      createdBy: 'seed',
    });

    await this.surveyResponseScaleRepository.save(response);
  }

  /**
   * 텍스트 응답을 생성한다 (SHORT_ANSWER, PARAGRAPH)
   */
  private async 텍스트_응답을_생성한다(
    questionId: string,
    employeeId: string,
    isParagraph: boolean,
    submittedAt: Date,
  ): Promise<void> {
    // 텍스트 응답은 70% 확률로만 작성 (빈 응답 가능)
    if (Math.random() > 0.7) {
      return;
    }

    const textValue = isParagraph
      ? faker.lorem.paragraphs(2) // 장문형
      : faker.lorem.sentence(); // 단답형

    const response = this.surveyResponseTextRepository.create({
      questionId,
      employeeId,
      textValue,
      submittedAt,
      createdBy: 'seed',
    });

    await this.surveyResponseTextRepository.save(response);
  }

  /**
   * 뉴스 시드 데이터를 생성한다
   */
  private async 뉴스_시드_데이터를_생성한다(count: number): Promise<number> {
    this.logger.log(`뉴스 시드 데이터 생성 시작 - 개수: ${count}`);

    // 뉴스 카테고리 조회 또는 생성
    let categories = await this.categoryService.엔티티_타입별_카테고리를_조회한다(
      CategoryEntityType.NEWS,
      false,
    );

    if (categories.length === 0) {
      this.logger.log('뉴스 카테고리가 없어 기본 카테고리 생성');
      const newsCategories = [
        { name: '신제품', description: '신제품 관련 뉴스' },
        { name: '수상', description: '수상 관련 뉴스' },
        { name: '사회공헌', description: '사회공헌 활동 뉴스' },
      ];

      for (let i = 0; i < newsCategories.length; i++) {
        const category = await this.categoryService.카테고리를_생성한다({
          entityType: CategoryEntityType.NEWS,
          name: newsCategories[i].name,
          description: newsCategories[i].description,
          isActive: true,
          order: i,
          createdBy: 'seed',
        });
        categories.push(category);
      }
      this.logger.log(`뉴스 카테고리 ${categories.length}개 생성 완료`);
    }

    let created = 0;

    for (let i = 0; i < count; i++) {
      const category = categories[i % categories.length];
      
      await this.newsService.뉴스를_생성한다({
        title: `${faker.lorem.sentence()} - 뉴스 ${i + 1}`,
        description: faker.lorem.paragraph(),
        url: faker.internet.url(),
        categoryId: category.id,
        isPublic: true,
        attachments: null,
        order: count - i,
        createdBy: 'seed',
      });

      created++;
    }

    this.logger.log(`뉴스 시드 데이터 생성 완료 - 생성된 개수: ${created}`);
    return created;
  }

  /**
   * 브로셔 시드 데이터를 생성한다 (다국어 지원)
   */
  private async 브로셔_시드_데이터를_생성한다(
    count: number,
  ): Promise<number> {
    this.logger.log(
      `브로셔 시드 데이터 생성 시작 - 개수: ${count} (다국어 자동 생성)`,
    );

    // 기본 언어 조회 (기준 언어)
    const languages = await this.languageService.모든_언어를_조회한다(false);
    const defaultLanguageCode = this.configService.get<string>('DEFAULT_LANGUAGE_CODE', 'en');
    const defaultLang = languages.find((l) => l.code === defaultLanguageCode);

    if (!defaultLang) {
      this.logger.warn(`기본 언어(${defaultLanguageCode})를 찾을 수 없습니다. 브로셔 생성을 건너뜁니다.`);
      return 0;
    }

    // 브로슈어 카테고리 조회
    const categories = await this.categoryService.엔티티_타입별_카테고리를_조회한다(
      CategoryEntityType.BROCHURE,
      false,
    );

    if (categories.length === 0) {
      this.logger.warn('브로슈어 카테고리가 없습니다. 브로셔 생성을 건너뜁니다.');
      return 0;
    }

    let created = 0;

    for (let i = 0; i < count; i++) {
      // 랜덤 카테고리 선택
      const randomCategory = categories[Math.floor(Math.random() * categories.length)];

      // 기본 언어로 번역 생성 (나머지 언어는 자동으로 동기화됨)
      await this.brochureContextService.브로슈어를_생성한다({
        translations: [
          {
            languageId: defaultLang.id,
            title: `${faker.company.catchPhrase()} - 브로셔 ${i + 1}`,
            description: faker.lorem.paragraphs(2),
          },
        ],
        categoryId: randomCategory.id,
        attachments: [
          {
            fileName: `brochure_${i + 1}.pdf`,
            fileUrl: `https://example.com/files/brochure_${i + 1}.pdf`,
            fileSize: Math.floor(Math.random() * 10000000) + 500000, // 500KB ~ 10MB
            mimeType: 'application/pdf',
          },
        ],
        createdBy: 'seed',
      });

      created++;
    }

    this.logger.log(
      `브로셔 시드 데이터 생성 완료 - 생성된 개수: ${created} (각 브로셔당 ${languages.length}개 언어 번역 생성)`,
    );
    return created;
  }

  /**
   * 전자공시 시드 데이터를 생성한다 (다국어 지원)
   */
  private async 전자공시_시드_데이터를_생성한다(
    count: number,
  ): Promise<number> {
    this.logger.log(
      `전자공시 시드 데이터 생성 시작 - 개수: ${count} (다국어 자동 생성)`,
    );

    const languages = await this.languageService.모든_언어를_조회한다(false);
    const defaultLanguageCode = this.configService.get<string>('DEFAULT_LANGUAGE_CODE', 'en');
    const defaultLang = languages.find((l) => l.code === defaultLanguageCode);

    if (!defaultLang) {
      this.logger.warn(`기본 언어(${defaultLanguageCode})를 찾을 수 없습니다. 전자공시 생성을 건너뜁니다.`);
      return 0;
    }

    // 전자공시 카테고리 조회
    const categories = await this.categoryService.엔티티_타입별_카테고리를_조회한다(
      CategoryEntityType.ELECTRONIC_DISCLOSURE,
      false,
    );

    if (categories.length === 0) {
      this.logger.warn('전자공시 카테고리가 없습니다. 전자공시 생성을 건너뜁니다.');
      return 0;
    }

    let created = 0;

    const currentYear = new Date().getFullYear();
    const quarters = ['1분기', '2분기', '3분기', '4분기'];
    const disclosureTypes = [
      '분기보고서',
      '반기보고서',
      '사업보고서',
      '주요사항보고서',
      '증권신고서',
    ];

    for (let i = 0; i < count; i++) {
      const type = disclosureTypes[i % disclosureTypes.length];
      const quarter = quarters[i % quarters.length];
      const year = currentYear - Math.floor(i / 4);

      // 랜덤 카테고리 선택
      const randomCategory = categories[Math.floor(Math.random() * categories.length)];

      await this.electronicDisclosureContextService.전자공시를_생성한다(
        [
          {
            languageId: defaultLang.id,
            title: `${year}년 ${quarter} ${type}`,
            description: `${year}년 ${quarter} ${type} 공시 내용입니다. 회사의 재무상태, 경영성과 및 주요 사업 현황을 포함하고 있습니다.`,
          },
        ],
        randomCategory.id,
        'seed',
        [
          {
            fileName: `disclosure_${year}_${quarter}_${type}.pdf`,
            fileUrl: `https://example.com/files/disclosure_${i + 1}.pdf`,
            fileSize: Math.floor(Math.random() * 8000000) + 200000,
            mimeType: 'application/pdf',
          },
        ],
      );

      created++;
    }

    this.logger.log(
      `전자공시 시드 데이터 생성 완료 - 생성된 개수: ${created} (각 전자공시당 ${languages.length}개 언어 번역 생성)`,
    );
    return created;
  }

  /**
   * IR 시드 데이터를 생성한다 (다국어 지원)
   */
  private async IR_시드_데이터를_생성한다(count: number): Promise<number> {
    this.logger.log(
      `IR 시드 데이터 생성 시작 - 개수: ${count} (다국어 자동 생성)`,
    );

    const languages = await this.languageService.모든_언어를_조회한다(false);
    const defaultLanguageCode = this.configService.get<string>('DEFAULT_LANGUAGE_CODE', 'en');
    const defaultLang = languages.find((l) => l.code === defaultLanguageCode);

    if (!defaultLang) {
      this.logger.warn(`기본 언어(${defaultLanguageCode})를 찾을 수 없습니다. IR 생성을 건너뜁니다.`);
      return 0;
    }

    // IR 카테고리 조회
    const categories = await this.categoryService.엔티티_타입별_카테고리를_조회한다(
      CategoryEntityType.IR,
    );
    
    if (categories.length === 0) {
      this.logger.warn('IR 카테고리가 없습니다. IR 생성을 건너뜁니다.');
      return 0;
    }

    const irTypes = [
      '사업보고서',
      '분기보고서',
      '반기보고서',
      '경영설명회',
      '애널리스트 리포트',
    ];

    let created = 0;

    for (let i = 0; i < count; i++) {
      const type = irTypes[i % irTypes.length];
      const category = categories[i % categories.length];
      
      await this.irContextService.IR을_생성한다(
        [
          {
            languageId: defaultLang.id,
            title: `${new Date().getFullYear()}년 ${type} - IR ${i + 1}`,
            description: faker.lorem.paragraphs(2),
          },
        ],
        'seed',
        [
          {
            fileName: `ir_${i + 1}.pdf`,
            fileUrl: `https://example.com/files/ir_${i + 1}.pdf`,
            fileSize: Math.floor(Math.random() * 15000000) + 1000000,
            mimeType: 'application/pdf',
          },
        ],
        category.id,
      );

      created++;
    }

    this.logger.log(
      `IR 시드 데이터 생성 완료 - 생성된 개수: ${created} (각 IR당 ${languages.length}개 언어 번역 생성)`,
    );
    return created;
  }

  /**
   * 주주총회 시드 데이터를 생성한다 (다국어 지원)
   */
  private async 주주총회_시드_데이터를_생성한다(
    count: number,
  ): Promise<number> {
    this.logger.log(
      `주주총회 시드 데이터 생성 시작 - 개수: ${count} (다국어 자동 생성)`,
    );

    const languages = await this.languageService.모든_언어를_조회한다(false);
    const defaultLanguageCode = this.configService.get<string>('DEFAULT_LANGUAGE_CODE', 'en');
    const defaultLang = languages.find((l) => l.code === defaultLanguageCode);

    if (!defaultLang) {
      this.logger.warn(`기본 언어(${defaultLanguageCode})를 찾을 수 없습니다. 주주총회 생성을 건너뜁니다.`);
      return 0;
    }

    // 주주총회 카테고리 조회 또는 생성
    const categories = await this.categoryService.엔티티_타입별_카테고리를_조회한다(
      CategoryEntityType.SHAREHOLDERS_MEETING,
      true,
    );

    let defaultCategory = categories.find(c => c.isActive);
    
    if (!defaultCategory) {
      // 기본 카테고리 생성
      defaultCategory = await this.categoryService.카테고리를_생성한다({
        entityType: CategoryEntityType.SHAREHOLDERS_MEETING,
        name: '정기 주주총회',
        description: '연례 정기 주주총회',
        isActive: true,
        order: 0,
        createdBy: 'seed',
      });
      this.logger.log(`주주총회 기본 카테고리 생성됨 - ID: ${defaultCategory.id}`);
    }

    let created = 0;
    const currentYear = new Date().getFullYear();

    for (let i = 0; i < count; i++) {
      const year = currentYear - i;
      const meetingDate = new Date(`${year}-03-15`);

      await this.shareholdersMeetingContextService.주주총회를_생성한다(
        [
          {
            languageId: defaultLang.id,
            title: `제${60 - i}기 정기 주주총회`,
            description: `${year}년 제${60 - i}기 정기 주주총회를 개최합니다. 재무제표 승인, 이사 선임 등 주요 안건을 결의할 예정입니다.`,
          },
        ],
        {
          categoryId: defaultCategory.id,
          location: `서울시 강남구 루미르빌딩 ${i + 1}층 대회의실`,
          meetingDate,
        },
        [
          {
            agendaNumber: 1,
            totalVote: 1000000 + i * 10000,
            yesVote: 950000 + i * 9500,
            noVote: 50000 + i * 500,
            approvalRating: 95.0,
            result: 'accepted' as any,
            translations: [
              {
                languageId: defaultLang.id,
                title: '재무제표 승인의 건',
              },
            ],
          },
          {
            agendaNumber: 2,
            totalVote: 1000000 + i * 10000,
            yesVote: 920000 + i * 9200,
            noVote: 80000 + i * 800,
            approvalRating: 92.0,
            result: 'accepted' as any,
            translations: [
              {
                languageId: defaultLang.id,
                title: '이사 선임의 건',
              },
            ],
          },
        ],
        'seed',
        [
          {
            fileName: `meeting_${i + 1}.pdf`,
            fileUrl: `https://example.com/files/meeting_${i + 1}.pdf`,
            fileSize: Math.floor(Math.random() * 5000000) + 500000,
            mimeType: 'application/pdf',
          },
        ],
      );

      created++;
    }

    this.logger.log(
      `주주총회 시드 데이터 생성 완료 - 생성된 개수: ${created} (각 주주총회당 ${languages.length}개 언어 번역 생성)`,
    );
    return created;
  }

  /**
   * 메인 팝업 시드 데이터를 생성한다 (다국어 지원)
   */
  private async 메인_팝업_시드_데이터를_생성한다(
    count: number,
  ): Promise<number> {
    this.logger.log(
      `메인 팝업 시드 데이터 생성 시작 - 개수: ${count} (다국어 자동 생성)`,
    );

    const languages = await this.languageService.모든_언어를_조회한다(false);
    const defaultLanguageCode = this.configService.get<string>('DEFAULT_LANGUAGE_CODE', 'en');
    const defaultLang = languages.find((l) => l.code === defaultLanguageCode);

    if (!defaultLang) {
      this.logger.warn(`기본 언어(${defaultLanguageCode})를 찾을 수 없습니다. 메인 팝업 생성을 건너뜁니다.`);
      return 0;
    }

    // 메인 팝업 카테고리 생성 (없으면 생성)
    const categories = await this.categoryService.엔티티_타입별_카테고리를_조회한다(
      CategoryEntityType.MAIN_POPUP,
      false,
    );
    
    let defaultCategory;
    if (categories.length === 0) {
      defaultCategory = await this.categoryService.카테고리를_생성한다({
        entityType: CategoryEntityType.MAIN_POPUP,
        name: '이벤트',
        description: '이벤트 및 프로모션',
        isActive: true,
        order: 0,
        createdBy: 'seed',
      });
      this.logger.log(`메인 팝업 카테고리 생성 완료 - ID: ${defaultCategory.id}`);
    } else {
      defaultCategory = categories[0];
      this.logger.log(`기존 메인 팝업 카테고리 사용 - ID: ${defaultCategory.id}`);
    }

    let created = 0;

    for (let i = 0; i < count; i++) {
      await this.mainPopupContextService.메인_팝업을_생성한다(
        [
          {
            languageId: defaultLang.id,
            title: `${faker.company.catchPhrase()} - 이벤트 ${i + 1}`,
            description: faker.lorem.paragraph(),
          },
        ],
        defaultCategory.id,
        'seed',
        [
          {
            fileName: `popup_${i + 1}.jpg`,
            fileUrl: `https://example.com/files/popup_${i + 1}.jpg`,
            fileSize: Math.floor(Math.random() * 3000000) + 100000,
            mimeType: 'image/jpeg',
          },
        ],
      );

      created++;
    }

    this.logger.log(
      `메인 팝업 시드 데이터 생성 완료 - 생성된 개수: ${created} (각 팝업당 ${languages.length}개 언어 번역 생성)`,
    );
    return created;
  }

  /**
   * 루미르스토리 시드 데이터를 생성한다
   */
  private async 루미르스토리_시드_데이터를_생성한다(
    count: number,
  ): Promise<number> {
    this.logger.log(`루미르스토리 시드 데이터 생성 시작 - 개수: ${count}`);

    let created = 0;
    const storyThemes = [
      '혁신',
      '성장',
      '도전',
      '협력',
      '비전',
      '글로벌',
      '지속가능성',
      '기술',
    ];

    // 루미르스토리 카테고리 조회 또는 생성
    let categories = await this.categoryService.엔티티_타입별_카테고리를_조회한다(
      CategoryEntityType.LUMIR_STORY,
      false,
    );

    if (categories.length === 0) {
      this.logger.log('루미르스토리 카테고리가 없어 기본 카테고리 생성');
      const defaultCategory = await this.categoryService.카테고리를_생성한다({
        entityType: CategoryEntityType.LUMIR_STORY,
        name: '일반',
        description: '일반 루미르스토리',
        isActive: true,
        order: 0,
        createdBy: 'seed',
      });
      categories = [defaultCategory];
    }

    for (let i = 0; i < count; i++) {
      const theme = storyThemes[i % storyThemes.length];
      const category = categories[i % categories.length];
      
      await this.lumirStoryContextService.루미르스토리를_생성한다({
        title: `루미르의 ${theme} 이야기 - Story ${i + 1}`,
        content: `루미르는 ${theme}을(를) 통해 끊임없이 발전하고 있습니다. ${faker.lorem.paragraphs(3)}`,
        categoryId: category.id,
        imageUrl: `https://example.com/images/story_${i + 1}.jpg`,
        attachments: [
          {
            fileName: `story_${i + 1}.jpg`,
            fileUrl: `https://example.com/images/story_${i + 1}.jpg`,
            fileSize: Math.floor(Math.random() * 2000000) + 100000,
            mimeType: 'image/jpeg',
          },
        ],
        createdBy: 'seed',
      });

      created++;
    }

    this.logger.log(
      `루미르스토리 시드 데이터 생성 완료 - 생성된 개수: ${created}`,
    );
    return created;
  }

  /**
   * 비디오갤러리 시드 데이터를 생성한다
   */
  private async 비디오갤러리_시드_데이터를_생성한다(
    count: number,
  ): Promise<number> {
    this.logger.log(`비디오갤러리 시드 데이터 생성 시작 - 개수: ${count}`);

    // 먼저 카테고리를 생성
    const videoCategories = [
      '회사 소개',
      '제품 소개',
      '기술 혁신',
      '사회공헌',
      '인터뷰',
      '이벤트',
    ];

    const createdCategories: Category[] = [];
    for (const categoryName of videoCategories) {
      const category = await this.categoryService.카테고리를_생성한다({
        entityType: CategoryEntityType.VIDEO_GALLERY,
        name: categoryName,
        description: `${categoryName} 관련 영상`,
        isActive: true,
        order: createdCategories.length,
        createdBy: 'seed',
      });
      createdCategories.push(category);
    }

    let created = 0;

    for (let i = 0; i < count; i++) {
      const category = createdCategories[i % createdCategories.length];
      const videoIds = [
        'dQw4w9WgXcQ',
        'jNQXAC9IVRw',
        'L_jWHffIx5E',
        '9bZkp7q19f0',
        'kJQP7kiw5Fk',
      ];
      const videoId = videoIds[i % videoIds.length];

      await this.videoGalleryContextService.비디오갤러리를_생성한다({
        title: `${category.name} - 영상 ${i + 1}`,
        description: `${category.name}에 관한 영상입니다. 루미르의 다양한 활동과 성과를 소개합니다.`,
        categoryId: category.id,
        videoSources: [
          {
            type: 'youtube',
            url: `https://www.youtube.com/watch?v=${videoId}`,
            thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
          },
        ],
        createdBy: 'seed',
      });

      created++;
    }

    this.logger.log(
      `비디오갤러리 시드 데이터 생성 완료 - 생성된 개수: ${created}`,
    );
    return created;
  }

  /**
   * Wiki 시드 데이터를 생성한다
   */
  private async Wiki_시드_데이터를_생성한다(): Promise<number> {
    this.logger.log(`Wiki 시드 데이터 생성 시작`);

    // SSO 연동하여 회사 조직 정보 가져오기
    let departments: string[] = [];
    let rankCodes: string[] = [];
    let positionCodes: string[] = [];

    try {
      this.logger.debug('SSO에서 회사 조직 정보 조회 중...');

      const deptResult =
        await this.companyContextService.부서_정보를_가져온다();
      departments = deptResult.departments
        .map((d) => d.id)
        .filter(Boolean);

      const rankResult = await this.companyContextService.직급_정보를_가져온다();
      rankCodes = rankResult.map((r) => r.id).filter(Boolean);

      const positionResult =
        await this.companyContextService.직책_정보를_가져온다();
      positionCodes = positionResult
        .map((p) => p.id)
        .filter(Boolean);

      this.logger.debug(
        `회사 정보 조회 완료 - 부서: ${departments.length}개, 직급: ${rankCodes.length}개, 직책: ${positionCodes.length}개`,
      );
    } catch (error) {
      this.logger.warn(
        `회사 정보 조회 실패: ${error.message}. 권한 설정 없이 진행합니다.`,
      );
    }

    let created = 0;

    // 1. 루트 폴더들 생성
    // "개발 가이드" - 전체 공개 (모든 직원 접근 가능)
    const devFolder = await this.wikiContextService.폴더를_생성한다({
      name: '개발 가이드',
      parentId: null,
      isPublic: true,
      createdBy: 'seed',
    });
    created++;

    // "인사 규정" - 특정 부서만 접근 (인사팀, 경영지원팀 등)
    const hrFolder = await this.wikiContextService.폴더를_생성한다({
      name: '인사 규정',
      parentId: null,
      isPublic: departments.length > 0 ? false : true,
      permissionDepartmentIds:
        departments.length > 0
          ? departments
              .sort(() => 0.5 - Math.random())
              .slice(0, Math.min(2, departments.length))
          : null,
      createdBy: 'seed',
    });
    created++;

    // "프로젝트" - 특정 직급/직책만 접근 (과장급 이상)
    const projectFolder = await this.wikiContextService.폴더를_생성한다({
      name: '프로젝트',
      parentId: null,
      isPublic: rankCodes.length > 0 || positionCodes.length > 0 ? false : true,
      permissionRankIds:
        rankCodes.length > 0
          ? rankCodes
              .sort(() => 0.5 - Math.random())
              .slice(0, Math.min(2, rankCodes.length))
          : null,
      permissionPositionIds:
        positionCodes.length > 0
          ? positionCodes
              .sort(() => 0.5 - Math.random())
              .slice(0, Math.min(2, positionCodes.length))
          : null,
      createdBy: 'seed',
    });
    created++;

    // 2. 개발 가이드 하위 파일들
    await this.wikiContextService.파일을_생성한다({
      name: '코딩 컨벤션',
      parentId: devFolder.id,
      content: `# 코딩 컨벤션\n\n## 1. 네이밍 규칙\n\n- 변수명: camelCase\n- 클래스명: PascalCase\n- 상수: UPPER_SNAKE_CASE\n\n## 2. 코드 스타일\n\n- 들여쓰기: 2 spaces\n- 최대 줄 길이: 100자\n\n${faker.lorem.paragraphs(3)}`,
      isPublic: true,
      createdBy: 'seed',
    });
    created++;

    await this.wikiContextService.파일을_생성한다({
      name: 'Git 브랜치 전략',
      parentId: devFolder.id,
      content: `# Git 브랜치 전략\n\n## Git Flow\n\n- main: 프로덕션 브랜치\n- develop: 개발 브랜치\n- feature/*: 기능 개발\n- hotfix/*: 긴급 수정\n\n${faker.lorem.paragraphs(3)}`,
      isPublic: true,
      createdBy: 'seed',
    });
    created++;

    await this.wikiContextService.파일을_생성한다({
      name: 'API 개발 가이드',
      parentId: devFolder.id,
      content: `# API 개발 가이드\n\n## RESTful API 설계\n\n- GET: 조회\n- POST: 생성\n- PUT/PATCH: 수정\n- DELETE: 삭제\n\n${faker.lorem.paragraphs(3)}`,
      isPublic: true,
      createdBy: 'seed',
    });
    created++;

    // 3. 인사 규정 하위 파일들
    await this.wikiContextService.파일을_생성한다({
      name: '휴가 규정',
      parentId: hrFolder.id,
      content: `# 휴가 규정\n\n## 연차\n\n- 1년 근속: 15일\n- 3년 근속: 16일\n- 5년 근속: 18일\n\n${faker.lorem.paragraphs(2)}`,
      isPublic: true,
      createdBy: 'seed',
    });
    created++;

    await this.wikiContextService.파일을_생성한다({
      name: '복리후생 안내',
      parentId: hrFolder.id,
      content: `# 복리후생 안내\n\n## 제공 항목\n\n- 건강검진\n- 경조사 지원\n- 자기계발비\n- 점심 식대\n\n${faker.lorem.paragraphs(2)}`,
      isPublic: true,
      createdBy: 'seed',
    });
    created++;

    // 4. 프로젝트 하위 파일들
    await this.wikiContextService.파일을_생성한다({
      name: 'CMS 프로젝트',
      parentId: projectFolder.id,
      content: `# CMS 프로젝트\n\n## 프로젝트 개요\n\n루미르 CMS 시스템 개발 프로젝트입니다.\n\n## 기술 스택\n\n- Backend: NestJS\n- Frontend: Next.js\n- Database: PostgreSQL\n\n${faker.lorem.paragraphs(3)}`,
      isPublic: true,
      createdBy: 'seed',
    });
    created++;

    await this.wikiContextService.파일을_생성한다({
      name: 'SSO 연동',
      parentId: projectFolder.id,
      content: `# SSO 연동 프로젝트\n\n## 개요\n\nSSO 시스템과의 연동을 통한 통합 인증 구현\n\n## 인증 플로우\n\n1. 로그인 요청\n2. SSO 서버 인증\n3. JWT 토큰 발급\n\n${faker.lorem.paragraphs(2)}`,
      isPublic: true,
      createdBy: 'seed',
    });
    created++;

    this.logger.log(
      `Wiki 시드 데이터 생성 완료 - 생성된 개수: ${created} (폴더 3개, 파일 7개)`,
    );
    return created;
  }

  /**
   * 시드 데이터를 삭제한다
   */
  async 시드_데이터를_삭제한다(hardDelete = true): Promise<void> {
    this.logger.log(
      `시드 데이터 삭제 시작 - Hard Delete: ${hardDelete}`,
    );

    if (hardDelete) {
      // Hard Delete - 실제 데이터 삭제 (시드 데이터는 완전히 삭제)
      this.logger.log('하드 삭제 실행 - 데이터베이스에서 완전히 제거됩니다.');
      
      // QueryBuilder를 사용하여 모든 데이터 삭제 (빈 criteria 에러 방지)
      // 설문 응답 데이터 먼저 삭제 (FK 제약 조건)
      await this.surveyResponseChoiceRepository.createQueryBuilder().delete().execute();
      await this.surveyResponseCheckboxRepository.createQueryBuilder().delete().execute();
      await this.surveyResponseScaleRepository.createQueryBuilder().delete().execute();
      await this.surveyResponseTextRepository.createQueryBuilder().delete().execute();
      await this.surveyCompletionRepository.createQueryBuilder().delete().execute();
      
      // Survey는 Announcement CASCADE로 자동 삭제되므로 명시적 삭제 불필요
      await this.announcementRepository.createQueryBuilder().delete().execute();
      
      // Category를 참조하는 엔티티들을 먼저 삭제
      await this.newsRepository.createQueryBuilder().delete().execute();
      await this.brochureRepository.createQueryBuilder().delete().execute();
      await this.electronicDisclosureRepository.createQueryBuilder().delete().execute();
      await this.irRepository.createQueryBuilder().delete().execute();
      await this.shareholdersMeetingRepository.createQueryBuilder().delete().execute();
      await this.mainPopupRepository.createQueryBuilder().delete().execute();
      await this.lumirStoryRepository.createQueryBuilder().delete().execute();
      await this.videoGalleryRepository.createQueryBuilder().delete().execute();
      
      // 마지막으로 Category 삭제 (외래키로 참조되므로)
      await this.categoryRepository.createQueryBuilder().delete().execute();
      
      await this.wikiFileSystemRepository.createQueryBuilder().delete().execute();
      // Language는 삭제하지 않음 (시스템 기본 데이터)
    } else {
      // Soft Delete - 논리적 삭제 (거의 사용되지 않음)
      this.logger.log('소프트 삭제 실행 - deletedAt만 설정됩니다.');
      
      // QueryBuilder를 사용하여 soft delete
      await this.announcementRepository.createQueryBuilder().softDelete().execute();
      
      // Category를 참조하는 엔티티들을 먼저 soft delete
      await this.newsRepository.createQueryBuilder().softDelete().execute();
      await this.brochureRepository.createQueryBuilder().softDelete().execute();
      await this.electronicDisclosureRepository.createQueryBuilder().softDelete().execute();
      await this.irRepository.createQueryBuilder().softDelete().execute();
      await this.shareholdersMeetingRepository.createQueryBuilder().softDelete().execute();
      await this.mainPopupRepository.createQueryBuilder().softDelete().execute();
      await this.lumirStoryRepository.createQueryBuilder().softDelete().execute();
      await this.videoGalleryRepository.createQueryBuilder().softDelete().execute();
      
      // 마지막으로 Category soft delete
      await this.categoryRepository.createQueryBuilder().softDelete().execute();
      await this.wikiFileSystemRepository.createQueryBuilder().softDelete().execute();
    }

    this.logger.log('시드 데이터 삭제 완료');
  }

  /**
   * 시드 데이터 상태를 조회한다
   */
  async 시드_데이터_상태를_조회한다(): Promise<GetSeedDataStatusDto> {
    this.logger.log('시드 데이터 상태 조회 시작');

    const status: GetSeedDataStatusDto = {
      languageCount: await this.languageRepository.count(),
      announcementCount: await this.announcementRepository.count(),
      surveyCount: await this.surveyRepository.count(),
      newsCount: await this.newsRepository.count(),
      brochureCount: await this.brochureRepository.count(),
      categoryCount: await this.categoryRepository.count(),
      electronicDisclosureCount:
        await this.electronicDisclosureRepository.count(),
      irCount: await this.irRepository.count(),
      shareholdersMeetingCount:
        await this.shareholdersMeetingRepository.count(),
      mainPopupCount: await this.mainPopupRepository.count(),
      lumirStoryCount: await this.lumirStoryRepository.count(),
      videoGalleryCount: await this.videoGalleryRepository.count(),
      wikiCount: await this.wikiFileSystemRepository.count(),
    };

    this.logger.log(`시드 데이터 상태: ${JSON.stringify(status)}`);

    return status;
  }
}
