import { Controller, Param, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateSurveyDto, UpdateSurveyDto, SurveyResponseDto, CreateSurveyCategoryDto, SurveyCategoryResponseDto, SubmitSurveyResponseDto, SurveySubmissionResponseDto } from './dto/survey.dto';
import { GetAllSurveys, GetSurvey, CreateSurvey, UpdateSurvey, DeleteSurvey, GetAllSurveyCategories, CreateSurveyCategory, SubmitSurveyResponse, GetSurveyResults } from './decorators/survey.decorators';

@ApiTags('설문조사')
@Controller('surveys')
export class SurveyController {
  // ========== 설문조사 CRUD ==========
  @GetAllSurveys()
  async getAllSurveys(): Promise<SurveyResponseDto[]> {
    throw new Error('Business Layer 구현 필요');
  }

  @GetSurvey()
  async getSurvey(@Param('id') id: string): Promise<SurveyResponseDto> {
    throw new Error('Business Layer 구현 필요');
  }

  @GetSurveyResults()
  async getResults(@Param('id') id: string): Promise<SurveySubmissionResponseDto[]> {
    throw new Error('Business Layer 구현 필요');
  }

  @CreateSurvey()
  async createSurvey(@Body() dto: CreateSurveyDto): Promise<SurveyResponseDto> {
    throw new Error('Business Layer 구현 필요');
  }

  @UpdateSurvey()
  async updateSurvey(@Param('id') id: string, @Body() dto: UpdateSurveyDto): Promise<SurveyResponseDto> {
    throw new Error('Business Layer 구현 필요');
  }

  @DeleteSurvey()
  async deleteSurvey(@Param('id') id: string): Promise<void> {
    throw new Error('Business Layer 구현 필요');
  }

  // ========== 카테고리 CRUD ==========
  @GetAllSurveyCategories()
  async getAllCategories(): Promise<SurveyCategoryResponseDto[]> {
    throw new Error('Business Layer 구현 필요');
  }

  @CreateSurveyCategory()
  async createCategory(@Body() dto: CreateSurveyCategoryDto): Promise<SurveyCategoryResponseDto> {
    throw new Error('Business Layer 구현 필요');
  }

  // ========== 응답 제출 ==========
  @SubmitSurveyResponse()
  async submitResponse(@Param('id') id: string, @Body() dto: SubmitSurveyResponseDto): Promise<SurveySubmissionResponseDto> {
    throw new Error('Business Layer 구현 필요');
  }
}
