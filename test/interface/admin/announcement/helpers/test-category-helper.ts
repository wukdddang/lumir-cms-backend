import { BaseE2ETest } from '../../../../base-e2e.spec';

/**
 * 테스트용 카테고리 생성 헬퍼
 */
export class TestCategoryHelper {
  private testSuite: BaseE2ETest;
  private categoryId: string | null = null;

  constructor(testSuite: BaseE2ETest) {
    this.testSuite = testSuite;
  }

  /**
   * 테스트용 카테고리 생성
   */
  async createCategory(): Promise<string> {
    const response = await this.testSuite
      .request()
      .post('/api/admin/announcements/categories')
      .send({
        name: '테스트 카테고리',
        description: '테스트용 공지사항 카테고리',
      })
      .expect(201);

    this.categoryId = response.body.id as string;
    return this.categoryId;
  }

  /**
   * 생성된 카테고리 ID 반환
   */
  getCategoryId(): string {
    if (!this.categoryId) {
      throw new Error('Category not created. Call createCategory() first.');
    }
    return this.categoryId;
  }

  /**
   * categoryId를 포함한 공지사항 생성 데이터 반환
   */
  withCategory(data: Record<string, any>): Record<string, any> {
    return {
      categoryId: this.getCategoryId(),
      ...data,
    };
  }
}
