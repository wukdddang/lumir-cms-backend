# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:20-alpine AS dependencies

# 작업 디렉토리 설정
WORKDIR /app

# 패키지 파일 복사 (의존성 설치 최적화)
COPY package*.json ./

# 프로덕션 의존성만 설치
RUN npm ci --only=production && npm cache clean --force

# ============================================
# Stage 2: Build
# ============================================
FROM node:20-alpine AS builder

# 작업 디렉토리 설정
WORKDIR /app

# 패키지 파일 복사
COPY package*.json ./

# 의존성 설치 (개발 의존성 포함)
RUN npm ci

# 소스 코드 복사
COPY . .

# TypeScript 빌드
RUN npm run build

# ============================================
# Stage 3: Production
# ============================================
FROM node:20-alpine AS production

# 보안을 위한 non-root 사용자 생성
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# 작업 디렉토리 설정
WORKDIR /app

# dependencies 스테이지에서 프로덕션 의존성 복사
COPY --from=dependencies --chown=nestjs:nodejs /app/node_modules ./node_modules

# builder 스테이지에서 빌드된 파일 복사
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/package*.json ./

# 환경 변수 설정
ENV NODE_ENV=production
ENV PORT=4001

# 포트 노출
EXPOSE 4001

# non-root 사용자로 전환
USER nestjs

# 헬스체크 설정 (PORT 환경 변수 사용)
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:${PORT:-4001}/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# 애플리케이션 실행
CMD ["node", "dist/src/main.js"]
