import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

      const brochureCount = await this.브로셔_시드_데이터를_생성한다(5);
      results.brochures = brochureCount;

      // 추가 다국어 엔티티들
      this.logger.log('추가 다국어 엔티티 데이터 생성 중...');
      
      const electronicDisclosureCount = await this.전자공시_시드_데이터를_생성한다(10);
      results.electronicDisclosures = electronicDisclosureCount;

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
      } else if (i >= 9 && i < 12 && rankCodes.length > 0) {
        // 10~12번: 특정 직급만 (제한 공개)
        isPublic = false;
        const selectedRanks = rankCodes
          .sort(() => 0.5 - Math.random())
          .slice(0, Math.min(2, rankCodes.length));
        permissionRankCodes = selectedRanks;
      } else if (i >= 12 && positionCodes.length > 0) {
        // 13번 이후: 특정 직책만 (제한 공개)
        isPublic = false;
        const selectedPositions = positionCodes
          .sort(() => 0.5 - Math.random())
          .slice(0, Math.min(2, positionCodes.length));
        permissionPositionCodes = selectedPositions;
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

    return created;
  }

  /**
   * 뉴스 시드 데이터를 생성한다
   */
  private async 뉴스_시드_데이터를_생성한다(count: number): Promise<number> {
    this.logger.log(`뉴스 시드 데이터 생성 시작 - 개수: ${count}`);

    let created = 0;

    for (let i = 0; i < count; i++) {
      await this.newsService.뉴스를_생성한다({
        title: `${faker.lorem.sentence()} - 뉴스 ${i + 1}`,
        description: faker.lorem.paragraph(),
        url: faker.internet.url(),
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

    // 한국어 조회 (기준 언어)
    const languages = await this.languageService.모든_언어를_조회한다(false);
    const koreanLang = languages.find((l) => l.code === 'ko');

    if (!koreanLang) {
      this.logger.warn('한국어를 찾을 수 없습니다. 브로셔 생성을 건너뜁니다.');
      return 0;
    }

    let created = 0;

    for (let i = 0; i < count; i++) {
      // 한국어로 기본 번역 생성 (나머지 언어는 자동으로 동기화됨)
      await this.brochureContextService.브로슈어를_생성한다({
        translations: [
          {
            languageId: koreanLang.id,
            title: `${faker.company.catchPhrase()} - 브로셔 ${i + 1}`,
            description: faker.lorem.paragraphs(2),
          },
        ],
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
    const koreanLang = languages.find((l) => l.code === 'ko');

    if (!koreanLang) {
      this.logger.warn('한국어를 찾을 수 없습니다. 전자공시 생성을 건너뜁니다.');
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

      await this.electronicDisclosureContextService.전자공시를_생성한다(
        [
          {
            languageId: koreanLang.id,
            title: `${year}년 ${quarter} ${type}`,
            description: `${year}년 ${quarter} ${type} 공시 내용입니다. 회사의 재무상태, 경영성과 및 주요 사업 현황을 포함하고 있습니다.`,
          },
        ],
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
    const koreanLang = languages.find((l) => l.code === 'ko');

    if (!koreanLang) {
      this.logger.warn('한국어를 찾을 수 없습니다. IR 생성을 건너뜁니다.');
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
      await this.irContextService.IR을_생성한다(
        [
          {
            languageId: koreanLang.id,
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
    const koreanLang = languages.find((l) => l.code === 'ko');

    if (!koreanLang) {
      this.logger.warn('한국어를 찾을 수 없습니다. 주주총회 생성을 건너뜁니다.');
      return 0;
    }

    let created = 0;
    const currentYear = new Date().getFullYear();

    for (let i = 0; i < count; i++) {
      const year = currentYear - i;
      const meetingDate = new Date(`${year}-03-15`);

      await this.shareholdersMeetingContextService.주주총회를_생성한다(
        [
          {
            languageId: koreanLang.id,
            title: `제${60 - i}기 정기 주주총회`,
            description: `${year}년 제${60 - i}기 정기 주주총회를 개최합니다. 재무제표 승인, 이사 선임 등 주요 안건을 결의할 예정입니다.`,
          },
        ],
        {
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
                languageId: koreanLang.id,
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
                languageId: koreanLang.id,
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
    const koreanLang = languages.find((l) => l.code === 'ko');

    if (!koreanLang) {
      this.logger.warn('한국어를 찾을 수 없습니다. 메인 팝업 생성을 건너뜁니다.');
      return 0;
    }

    let created = 0;

    for (let i = 0; i < count; i++) {
      await this.mainPopupContextService.메인_팝업을_생성한다(
        [
          {
            languageId: koreanLang.id,
            title: `${faker.company.catchPhrase()} - 이벤트 ${i + 1}`,
            description: faker.lorem.paragraph(),
          },
        ],
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

    for (let i = 0; i < count; i++) {
      const theme = storyThemes[i % storyThemes.length];
      await this.lumirStoryContextService.루미르스토리를_생성한다({
        title: `루미르의 ${theme} 이야기 - Story ${i + 1}`,
        content: `루미르는 ${theme}을(를) 통해 끊임없이 발전하고 있습니다. ${faker.lorem.paragraphs(3)}`,
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

    let created = 0;
    const videoCategories = [
      '회사 소개',
      '제품 소개',
      '기술 혁신',
      '사회공헌',
      '인터뷰',
      '이벤트',
    ];

    for (let i = 0; i < count; i++) {
      const category = videoCategories[i % videoCategories.length];
      const videoIds = [
        'dQw4w9WgXcQ',
        'jNQXAC9IVRw',
        'L_jWHffIx5E',
        '9bZkp7q19f0',
        'kJQP7kiw5Fk',
      ];
      const videoId = videoIds[i % videoIds.length];

      await this.videoGalleryContextService.비디오갤러리를_생성한다({
        title: `${category} - 영상 ${i + 1}`,
        description: `${category}에 관한 영상입니다. 루미르의 다양한 활동과 성과를 소개합니다.`,
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
      // Survey는 Announcement CASCADE로 자동 삭제되므로 명시적 삭제 불필요
      await this.announcementRepository.createQueryBuilder().delete().execute();
      await this.newsRepository.createQueryBuilder().delete().execute();
      await this.brochureRepository.createQueryBuilder().delete().execute();
      await this.categoryRepository.createQueryBuilder().delete().execute();
      await this.electronicDisclosureRepository.createQueryBuilder().delete().execute();
      await this.irRepository.createQueryBuilder().delete().execute();
      await this.shareholdersMeetingRepository.createQueryBuilder().delete().execute();
      await this.mainPopupRepository.createQueryBuilder().delete().execute();
      await this.lumirStoryRepository.createQueryBuilder().delete().execute();
      await this.videoGalleryRepository.createQueryBuilder().delete().execute();
      await this.wikiFileSystemRepository.createQueryBuilder().delete().execute();
      // Language는 삭제하지 않음 (시스템 기본 데이터)
    } else {
      // Soft Delete - 논리적 삭제 (거의 사용되지 않음)
      this.logger.log('소프트 삭제 실행 - deletedAt만 설정됩니다.');
      
      // QueryBuilder를 사용하여 soft delete
      await this.announcementRepository.createQueryBuilder().softDelete().execute();
      await this.newsRepository.createQueryBuilder().softDelete().execute();
      await this.brochureRepository.createQueryBuilder().softDelete().execute();
      await this.categoryRepository.createQueryBuilder().softDelete().execute();
      await this.electronicDisclosureRepository.createQueryBuilder().softDelete().execute();
      await this.irRepository.createQueryBuilder().softDelete().execute();
      await this.shareholdersMeetingRepository.createQueryBuilder().softDelete().execute();
      await this.mainPopupRepository.createQueryBuilder().softDelete().execute();
      await this.lumirStoryRepository.createQueryBuilder().softDelete().execute();
      await this.videoGalleryRepository.createQueryBuilder().softDelete().execute();
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
