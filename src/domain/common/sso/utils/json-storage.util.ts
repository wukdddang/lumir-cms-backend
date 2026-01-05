import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '@nestjs/common';

/**
 * JSON 파일 저장 유틸리티
 * SSO 응답 데이터를 JSON 파일로 저장하고 읽어오는 기능 제공
 * 서버리스 환경에서는 파일 저장을 건너뜁니다.
 */
export class JsonStorageUtil {
  private static readonly logger = new Logger(JsonStorageUtil.name);
  private static readonly MOCK_DATA_DIR = path.join(
    __dirname,
    '..',
    'mock-data',
  );

  /**
   * 서버리스 환경인지 확인한다
   */
  private static isServerlessEnvironment(): boolean {
    // NODE_ENV가 production이어도 명시적으로 JSON 저장을 활성화한 경우는 허용
    const forceEnable = process.env.SSO_ENABLE_JSON_STORAGE === 'true';

    if (forceEnable) {
      return false; // 강제 활성화 시 서버리스로 간주하지 않음
    }

    return (
      !!process.env.VERCEL || // Vercel
      !!process.env.AWS_LAMBDA_FUNCTION_NAME || // AWS Lambda
      !!process.env.GOOGLE_CLOUD_FUNCTION || // Google Cloud Functions
      !!process.env.AZURE_FUNCTIONS_ENVIRONMENT // Azure Functions
      // NODE_ENV === 'production'은 제거 (로컬에서도 production으로 실행 가능)
    );
  }

  /**
   * 파일 저장이 가능한 환경인지 확인한다
   */
  private static canWriteFiles(): boolean {
    // 서버리스 환경이 아니고, 명시적으로 비활성화되지 않은 경우에만 저장
    if (this.isServerlessEnvironment()) {
      return false;
    }

    // 환경 변수로 명시적으로 제어 가능
    if (process.env.SSO_ENABLE_JSON_STORAGE === 'false') {
      return false;
    }

    return true;
  }

  /**
   * 디렉토리가 없으면 생성한다
   */
  private static ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      this.logger.debug(`디렉토리 생성: ${dirPath}`);
    }
  }

  /**
   * 메서드 이름과 파라미터를 기반으로 파일명을 생성한다
   */
  private static generateFileName(
    methodName: string,
    params?: Record<string, any>,
  ): string {
    const sanitize = (str: string): string => {
      return str.replace(/[^a-zA-Z0-9가-힣]/g, '_');
    };

    let fileName = sanitize(methodName);

    if (params) {
      // 파라미터를 정렬하여 일관된 파일명 생성
      const sortedKeys = Object.keys(params).sort();
      const paramString = sortedKeys
        .map((key) => {
          const value = params[key];
          if (value === undefined || value === null) {
            return '';
          }
          if (typeof value === 'object') {
            return `${key}_${JSON.stringify(value)}`;
          }
          return `${key}_${value}`;
        })
        .filter((s) => s.length > 0)
        .join('_');

      if (paramString) {
        fileName += `_${sanitize(paramString)}`;
      }
    }

    // 파일명이 너무 길면 해시 사용
    if (fileName.length > 200) {
      const crypto = require('crypto');
      const hash = crypto
        .createHash('md5')
        .update(fileName)
        .digest('hex')
        .substring(0, 8);
      fileName = `${sanitize(methodName)}_${hash}`;
    }

    return `${fileName}.json`;
  }

  /**
   * 응답 데이터를 JSON 파일로 저장한다
   * 서버리스 환경에서는 저장하지 않습니다.
   */
  static saveResponse(
    methodName: string,
    params: Record<string, any> | undefined,
    data: any,
  ): void {
    // 서버리스 환경에서는 파일 저장 건너뛰기
    if (!this.canWriteFiles()) {
      this.logger.debug(
        `서버리스 환경이므로 JSON 저장을 건너뜁니다: ${methodName}`,
      );
      return;
    }

    try {
      this.ensureDirectoryExists(this.MOCK_DATA_DIR);

      const fileName = this.generateFileName(methodName, params);
      const filePath = path.join(this.MOCK_DATA_DIR, fileName);

      const jsonData = JSON.stringify(data, null, 2);
      fs.writeFileSync(filePath, jsonData, 'utf-8');

      this.logger.debug(`SSO 응답 데이터 저장: ${methodName} -> ${filePath}`);
    } catch (error) {
      this.logger.warn(
        `SSO 응답 데이터 저장 실패: ${methodName}`,
        error.message,
      );
    }
  }

  /**
   * 저장된 JSON 파일에서 데이터를 읽어온다
   */
  static loadResponse(
    methodName: string,
    params?: Record<string, any>,
  ): any | null {
    try {
      const fileName = this.generateFileName(methodName, params);
      const filePath = path.join(this.MOCK_DATA_DIR, fileName);

      if (!fs.existsSync(filePath)) {
        this.logger.debug(
          `저장된 응답 데이터 없음: ${methodName} -> ${filePath}`,
        );
        return null;
      }

      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(fileContent);

      this.logger.debug(
        `저장된 응답 데이터 로드: ${methodName} -> ${filePath}`,
      );
      return data;
    } catch (error) {
      this.logger.warn(
        `저장된 응답 데이터 로드 실패: ${methodName}`,
        error.message,
      );
      return null;
    }
  }

  /**
   * 모든 저장된 응답 파일 목록을 반환한다
   */
  static listSavedResponses(): string[] {
    try {
      if (!fs.existsSync(this.MOCK_DATA_DIR)) {
        return [];
      }

      return fs
        .readdirSync(this.MOCK_DATA_DIR)
        .filter((file) => file.endsWith('.json'));
    } catch (error) {
      this.logger.warn('저장된 응답 파일 목록 조회 실패', error.message);
      return [];
    }
  }
}
