# Brew Desk

스페셜티 커피 브루잉 레시피를 탐색하고, 원두·장비·맛 목표에 맞는 레시피를 추천받아 타이머로 실행하고 결과를 기록하는 정적 웹 애플리케이션입니다.

- 운영 사이트: `https://ahrong0820.github.io/brew/`
- 저장소: `ahrong0820/brew`
- 배포 방식: Next.js static export → GitHub Pages
- 사용자 데이터: 브라우저 Local Storage / Session Storage

## 주요 기능

- 검증 상태가 표시된 기본·바리스타 레시피 카탈로그
- 원두, 드리퍼, 그라인더, 배전도, 맛 목표 기반 추천
- 추천 근거와 적용 규칙 추적
- 단계별 브루잉 타이머, 일시정지·재개·새로고침 복원
- 추출 속도와 관능 결과 기록
- 원두별 현재 베스트 및 다음 추출 조정
- 나만의 레시피 생성·저장·격리 복구
- 모바일 전용 내비게이션과 도구 패널

## 기술 스택

- Next.js 16.2
- React 19.2
- TypeScript 5.9
- pnpm 11.7
- Tailwind CSS 4
- Node.js 22.13 이상
- Playwright 기반 정적 배포 E2E

`vinext` 설정도 유지하지만, GitHub Pages 운영 배포는 `next build`의 static export를 사용합니다.

## 로컬 실행

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

기본 개발 서버는 vinext를 사용합니다. GitHub Pages와 같은 정적 산출물을 확인하려면 다음 명령을 사용합니다.

```bash
GITHUB_PAGES=true \
NEXT_PUBLIC_BASE_PATH=/brew \
NEXT_PUBLIC_DEPLOYMENT_SHA=0000000000000000000000000000000000000000 \
pnpm build:github
```

정적 검증에는 40자리 SHA와 배포 메타데이터가 필요합니다. CI에서는 워크플로가 `public/deployment.json`, immutable deployment marker, `public/recipe-manifest.json`을 먼저 생성합니다.

## 품질 검증

```bash
pnpm lint
pnpm typecheck
pnpm test
```

PR CI와 운영 배포 CI는 다음 순서로 실행됩니다.

1. 의존성 고정 설치
2. ESLint
3. TypeScript typecheck
4. Node 테스트 전체 실행
5. 배포 메타데이터와 레시피 manifest 생성
6. GitHub Pages static export
7. static export 구조·SHA·카탈로그 검증
8. Playwright Chromium E2E
9. 운영 배포 후 다중 응답 안정성 검증

Playwright는 CI에서 고정 버전으로 임시 설치됩니다. 로컬 E2E를 실행하려면 다음과 같이 설치합니다.

```bash
pnpm add --save-dev --lockfile=false playwright@1.55.0
pnpm exec playwright install chromium
pnpm test:e2e
```

## 디렉터리 구조

```text
app/                    React UI와 클라이언트 상호작용
data/                   기본 레시피, 바리스타 레시피, 출처 레지스트리
lib/recommendation/     추천·랭킹·조정 규칙
lib/recipes/            카탈로그, 저장소 마이그레이션, 런타임 검증
lib/storage/            버전 저장소와 데이터 무결성 복구
lib/timer/              탭 단위 타이머 상태
lib/types/              공용 도메인 타입
scripts/                빌드·배포·manifest 검증
e2e/                    Playwright 브라우저 시나리오
 test/                   Node 테스트
 docs/                   설계와 출처 감사 문서
```

기본 UI 레시피의 단일 진입점은 `data/defaultRecipes.ts`입니다. `app/page.tsx` 안에 별도 레시피 카탈로그를 두지 않습니다.

## 레시피 데이터 정책

- 공식 출처로 확인된 값과 앱 시작값을 구분합니다.
- 출처에서 확인하지 못한 실행 변수는 단순히 “미확인”으로 끝내지 않습니다.
- 실행 가능한 앱 시작값을 제공할 경우 `temperature.status = "app-default"`와 설명을 함께 저장합니다.
- 삭제·대체된 기본 레시피 ID는 `lib/recipes/defaultRecipeCatalog.ts`에서 관리합니다.
- 운영 배포의 정확한 레시피 ID, 이름, 개수는 `recipe-manifest.json`으로 검증합니다.

출처 감사 문서는 `docs/source-audits/`에 있습니다.

## 브라우저 저장소

### Local Storage

| 키 | 용도 |
|---|---|
| `coffee-recipe-favorites` | 즐겨찾기 레시피 ID |
| `coffee-custom-recipes` | 나만의 레시피 |
| `coffee-custom-recipes-quarantine.v1` | 검증 실패 사용자 레시피 격리 |
| `brew.beans.v1` | 원두 목록 |
| `brew.grinderProfiles.v1` | 그라인더 프로필 |
| `brew.beanBrewProfiles.v1` | 원두별 추출 프로필 |
| `brew.brewSessions.v1` | 추출 기록 |
| `brew.userPreferences.v1` | 사용자 설정 |

### Session Storage

| 키 | 용도 |
|---|---|
| `brew.activeRecommendationSession.v1` | 현재 탭의 진행 중인 타이머 |

저장된 기본 레시피 ID는 앱 시작 시 마이그레이션됩니다. 한 키의 JSON이 손상되어도 다른 키의 마이그레이션은 계속 진행됩니다. 사용자 레시피는 공용 런타임 스키마를 통과한 항목만 로드되며, 거부된 값은 최대 50개까지 격리됩니다.

## GitHub Pages 배포

`main` push 시 `.github/workflows/deploy-pages.yml`이 실행됩니다.

배포 검증은 다음 응답이 동일한 커밋을 가리키는지 확인합니다.

- 기본 운영 URL
- cache-busting query URL
- `index.html` URL
- `deployment.json`
- `deployments/<SHA>.json`
- `recipe-manifest.json`
- HTML이 참조하는 JavaScript·CSS asset

모든 조건이 두 번 연속 일치해야 `github-pages/live-verification` 상태가 성공합니다.

## 개발 규칙

- 기능별 브랜치를 사용합니다.
- `main`에 직접 작업하지 않습니다.
- UI 레시피를 추가하거나 변경할 때는 `data/defaultRecipes.ts`, 카탈로그 manifest, 출처 레지스트리, 관련 테스트를 함께 갱신합니다.
- Local Storage 형식을 변경하면 마이그레이션과 손상 데이터 테스트를 추가합니다.
- 타이머·추천·모바일 UI 변경은 Playwright 시나리오를 통과해야 합니다.
- 공개 레시피의 확인되지 않은 수치를 공식값처럼 표시하지 않습니다.

## 자주 쓰는 명령

```bash
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm build:github
pnpm test:e2e
pnpm db:generate
```
