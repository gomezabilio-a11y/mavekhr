# MAVEK HR Portal — Railway 배포 가이드

이 문서는 MAVEK HR Portal을 Railway에 배포하기 위한 완전한 설정 가이드입니다.

---

## 사전 준비

1. [Railway 계정](https://railway.app) 생성 및 로그인
2. GitHub 저장소에 코드 푸시 완료
3. Railway에서 **New Project → Deploy from GitHub repo** 선택

---

## 필수 환경변수 (Railway Variables 탭에서 설정)

### 핵심 필수값 (미설정 시 서버 동작 불가)

| 변수명 | 설명 | 예시 |
|--------|------|------|
| `DATABASE_URL` | MySQL/TiDB 연결 문자열 | `mysql://user:pass@host:3306/dbname` |
| `JWT_SECRET` | 세션 쿠키 서명 비밀키 (32자 이상 랜덤 문자열) | `openssl rand -hex 32` 명령으로 생성 |
| `NODE_ENV` | 실행 환경 | `production` |

### 스토리지 설정 (Persistent Volume 사용 시 필수)

| 변수명 | 설명 | 예시 |
|--------|------|------|
| `STORAGE_DIR` | 업로드 파일 저장 경로 (Persistent Volume 마운트 경로) | `/mnt/volume/storage` |

> **중요:** `STORAGE_DIR`을 설정하지 않으면 컨테이너 재시작 시 업로드된 파일이 모두 삭제됩니다. 반드시 Persistent Volume을 마운트하고 해당 경로를 지정하세요.

### 선택적 Forge API (LLM/이미지/음성 기능 사용 시)

| 변수명 | 설명 |
|--------|------|
| `BUILT_IN_FORGE_API_URL` | Forge API 기본 URL (미설정 시 AI 기능 비활성화, 서버 부팅은 정상) |
| `BUILT_IN_FORGE_API_KEY` | Forge API 인증 키 (미설정 시 AI 기능 비활성화, 서버 부팅은 정상) |

---

## Persistent Volume 설정 (파일 영구 보존 필수)

Railway에서 업로드된 직원 사진 및 문서를 영구 보존하려면 Persistent Volume이 필요합니다.

1. Railway 프로젝트 → **Volumes** 탭 → **Add Volume** 클릭
2. Mount Path: `/mnt/volume/storage` 설정
3. 환경변수 `STORAGE_DIR=/mnt/volume/storage` 추가

---

## 배포 순서

```bash
# 1. 코드를 GitHub에 푸시
git add .
git commit -m "Railway deployment ready"
git push origin main

# 2. Railway에서 자동 빌드 시작 (Dockerfile 사용)
# 빌드 로그: Railway 대시보드 → Deployments → 최신 배포 클릭

# 3. 환경변수 설정 후 재배포 (Variables 탭에서 설정)
```

---

## 빌드 프로세스 (Dockerfile 기준)

Railway는 프로젝트 루트의 `Dockerfile`을 사용하여 이미지를 빌드합니다.

```
1. node:22-slim 베이스 이미지
2. corepack pnpm install (모든 의존성 설치)
3. pnpm run build (Vite 프론트엔드 빌드 → dist/public + esbuild 서버 빌드 → dist/index.js)
4. NODE_ENV=production 설정
5. node dist/index.js 실행
```

빌드 예상 시간: 약 2~3분 (cold build 기준)

---

## 헬스체크

Railway는 배포 후 `GET /` 엔드포인트에 요청을 보내 서비스 상태를 확인합니다 (`healthcheckTimeout: 30초`).

---

## 데이터베이스 마이그레이션

Railway 배포 후 DB 스키마 변경이 있을 경우:

```bash
# 로컬에서 Railway DB에 직접 마이그레이션 실행
DATABASE_URL="<railway-db-url>" pnpm db:push
```

또는 Railway의 **Run Command** 기능을 사용하여 컨테이너 내에서 실행할 수 있습니다.

---

## 트러블슈팅

| 증상 | 원인 | 해결 |
|------|------|------|
| 업로드 파일이 재시작 후 사라짐 | `STORAGE_DIR` 미설정 또는 Persistent Volume 미마운트 | Volume 마운트 및 `STORAGE_DIR` 환경변수 설정 |
| 로그인 불가 | `JWT_SECRET` 미설정 | Railway Variables에서 `JWT_SECRET` 설정 |
| DB 연결 실패 | `DATABASE_URL` 오류 | 연결 문자열 형식 확인 (`mysql://...`) |
| AI 기능 동작 안 함 | Forge API 키 미설정 | `BUILT_IN_FORGE_API_URL`, `BUILT_IN_FORGE_API_KEY` 설정 (선택사항) |
| 빌드 타임아웃 (300초 초과) | 의존성 설치 지연 | `pnpm-lock.yaml` 커밋 여부 확인 (`--frozen-lockfile` 사용) |
