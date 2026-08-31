# Brew 구조 안정화 정비 계획

## 목적

최근 반복된 GitHub Pages 배포 실패는 GitHub Pages 자체의 불안정보다 애플리케이션 내부의 높은 결합도, DOM 후처리, 레시피 메타데이터 중복, main 직접 반영 방식에서 주로 발생했다. 이 문서는 신규 기능 추가보다 우선하여 코드베이스를 안정화하기 위한 실행 계획과 완료 기준을 정의한다.

기본 원칙은 다음과 같다.

- 사용자에게 보이는 기존 레시피, 타이머, 추천, 저장 데이터는 유지한다.
- 기능 변경과 구조 변경을 한 커밋에 섞지 않는다.
- 각 단계는 독립적으로 테스트 가능해야 한다.
- `main`에는 검증된 변경만 병합한다.
- GitHub Pages의 배포 후 live verification은 유지한다.
- 레시피의 공식 데이터와 타이밍은 리팩터링 과정에서 임의 변경하지 않는다.

## 현재 확인된 구조적 문제

### 1. main 직접 반영 후 CI 검사

현재 `main` 브랜치가 보호되지 않아 변경이 먼저 main에 들어간 뒤 CI가 실패를 발견한다. 이 때문에 실패한 코드가 main에 존재하는 동안 Pages 배포가 중단되고, 사용자는 수정이 반영되지 않은 상태를 반복해서 보게 된다.

### 2. React 렌더링 이후 DOM 후처리

`MobileRecipeEnhancer`, `MobileCoffeeNav`, `MobileOverlayCoordinator`, `RecipeOrderDrawer` 일부 로직이 `MutationObserver`, `document.querySelector`, 버튼 텍스트, DOM 자식 순서 등에 의존한다. 새 UI 요소 하나가 삽입돼도 기존 selector가 다른 요소를 기능 대상으로 오인할 수 있다.

특히 `MobileRecipeEnhancer`가 `directDivs[1]`을 레시피 목록으로 간주하는 구조는 DOM 구조 변경에 매우 취약하다.

### 3. 레시피 정보의 중복 선언

레시피 ID, 이름, 순서, 개수 등이 다음 위치에 중복돼 있다.

- `data/defaultRecipes.ts`
- `lib/recipes/defaultRecipeCatalog.ts`
- manifest 관련 테스트
- E2E 예상 목록
- 배포 smoke 검증

새 레시피 추가 시 여러 파일을 동시에 수정해야 하며, 하나라도 누락하면 CI가 실패한다.

### 4. `app/page.tsx`의 과도한 책임

메인 페이지 한 컴포넌트가 레시피 목록, 검색, 필터, 즐겨찾기, 사용자 레시피, 추천 레시피, 타이머, 저장소, 세션 복원, 스마트 알림 등을 동시에 관리한다. 기능 간 영향 범위가 넓다.

### 5. 글로벌 Drawer와 모바일 네비게이션의 분산 상태

각 Drawer가 독립적인 floating button과 open state를 관리하고, 모바일 네비게이션은 DOM을 탐색해 해당 버튼을 클릭하는 방식으로 연결된다. Overlay 숨김도 DOM/CSS selector 기반이다.

### 6. 개발/배포 빌드 체인 차이

로컬 개발은 Vinext, GitHub Pages 배포는 Next.js 빌드를 사용한다. client component, static export, hydration, basePath 문제를 줄이려면 주 운영 환경과 개발 환경을 가능한 한 일치시켜야 한다.

### 7. E2E 시나리오의 과도한 결합

하나의 E2E 파일이 카탈로그, 저장소 복구, migration, 타이머 scaling, 세션 복원 등 다수 기능을 동시에 검증한다. 작은 UI 회귀가 무관한 시나리오 전체를 실패시키며 원인 파악이 느리다.

## 정비 작업 순서

### Phase 0 — 기준선 고정 및 작업 흐름 분리

목표: 리팩터링 중 운영 사이트를 안정 상태로 유지한다.

작업:

1. 안정화 전용 브랜치 `refactor/architecture-stabilization`에서 작업한다.
2. 각 단계마다 lint, typecheck, unit test, static build, E2E를 통과시킨다.
3. 단계별 PR 또는 체크포인트 커밋을 만든다.
4. 구조 변경 중 레시피 콘텐츠와 공식 brew timeline을 변경하지 않는다.
5. 운영 배포는 main 병합 후에만 수행한다.

완료 기준:

- 작업 브랜치가 main과 분리되어 있음.
- 현재 main의 live verification이 green임.
- 리팩터링용 문서와 체크리스트가 저장소에 존재함.

### Phase 1 — main 보호와 CI 흐름 정리

목표: 실패한 코드가 main에 먼저 들어가는 구조를 제거한다.

작업:

1. 가능하면 GitHub branch protection 또는 ruleset에서 main에 PR 필수화를 설정한다.
2. 필수 status check로 최소 다음을 지정한다.
   - lint
   - typecheck
   - unit tests
   - static build
   - browser E2E
3. Pages 배포 workflow와 PR 검증 workflow를 논리적으로 분리한다.
4. PR에서는 deploy하지 않고 검증만 수행한다.
5. main push에서는 검증된 커밋을 Pages에 배포하고 live verification을 수행한다.

완료 기준:

- main 직접 push가 차단되거나 최소한 운영 절차상 사용하지 않음.
- PR CI 실패 시 main과 운영 사이트에는 영향이 없음.

### Phase 2 — 레시피 Registry 단일화

목표: 레시피 추가/삭제 시 수정 지점을 하나로 줄인다.

설계 방향:

`defaultRecipeRegistry`를 단일 source of truth로 만들고 다음 정보를 registry에서 파생한다.

- `defaultRecipes`
- catalog entries
- default order
- recipe count
- manifest recipe IDs
- required deployment recipe names
- alias/migration metadata

예시 형태:

```ts
export const defaultRecipeRegistry = [
  {
    recipe: tetsu46DefaultRecipe,
    requiredForDeploy: true,
    aliases: [],
  },
  // ...
] as const;
```

테스트는 숫자 `11`, 레시피 ID 배열, 이름 배열을 직접 다시 쓰지 않고 registry에서 기대값을 생성한다.

완료 기준:

- 기본 레시피 ID/이름/개수가 여러 테스트에 하드코딩되지 않음.
- 새 기본 레시피 추가 시 카탈로그 관련 수정 파일 수가 최소화됨.
- manifest와 UI 목록이 동일 registry에서 생성됨.

### Phase 3 — RecipeList를 React 단일 상태로 전환

목표: DOM `appendChild`/selector 기반 레시피 정렬을 제거한다.

작업:

1. `useRecipeOrder` 훅을 만든다.
2. 저장된 order는 recipe ID 기준으로 관리한다.
3. `allRecipes` -> filter -> order 순으로 React 배열을 계산한다.
4. `orderedRecipes.map(...)`으로 직접 렌더링한다.
5. `RecipeOrderDrawer`는 DOM 카드를 움직이지 않고 order state만 변경한다.
6. 길게 눌러 드래그하는 UX는 유지하되 React state를 재정렬한다.
7. 신규/삭제 레시피에 대한 order migration을 구현한다.

완료 기준:

- `RecipeOrderDrawer`에 `appendChild`가 없음.
- 레시피 순서가 검색/필터/즐겨찾기/새로고침 후에도 안정적으로 유지됨.
- 드래그 정렬 E2E가 존재함.

### Phase 4 — MobileRecipeEnhancer DOM 후처리 제거

목표: DOM 자식 순서와 텍스트에 의존하지 않는 UI로 전환한다.

작업:

1. `page.tsx`에서 RecipeList, TimerPanel, CustomRecipeEditor에 필요한 `data-*`/ARIA를 직접 렌더링한다.
2. 모바일에서 레시피 선택 후 타이머 패널 이동도 React event handler에서 처리한다.
3. 사용자 레시피 편집기 열기/닫기를 React state로 관리한다.
4. `document.createElement`로 UI를 추가하는 코드를 제거한다.
5. 기능 이전 완료 후 `MobileRecipeEnhancer`를 삭제한다.

완료 기준:

- `MobileRecipeEnhancer.tsx` 삭제.
- `directDivs[1]`, heading text 탐색, DOM 생성 로직 없음.
- 모바일 E2E 통과.

### Phase 5 — Drawer / Tool 상태 중앙화

목표: 독립 floating button과 DOM 기반 launcher 탐색을 제거한다.

설계 방향:

```ts
type CoffeeTool =
  | "recommendation"
  | "beans"
  | "origin-region"
  | "history"
  | "grind"
  | "recipe-order"
  | "evidence"
  | "personal-recipes";
```

`CoffeeToolProvider` 또는 이에 준하는 공통 상태에서 `activeTool`을 관리한다.

```ts
openTool("recipe-order")
closeTool()
```

`MobileCoffeeNav`는 DOM 버튼을 찾거나 클릭하지 않고 provider API를 직접 사용한다.

완료 기준:

- `MobileCoffeeNav`에서 전체 `button` 탐색 제거.
- launcher label text 기반 매칭 제거.
- Drawer open/close가 React state 하나로 관리됨.
- floating button 겹침 및 z-index 보정 감소.

### Phase 6 — Overlay Coordinator 단순화/제거

목표: 모달 상태를 DOM 관찰이 아닌 명시적 상태로 관리한다.

작업:

1. 공통 Drawer 상태에서 overlay open 여부를 파생한다.
2. body scroll lock을 React effect 하나로 관리한다.
3. `body:has(...)`, `body[data-coffee-overlay-open] > button.fixed...` 같은 광범위 CSS selector를 제거한다.
4. 기능 이전 후 `MobileOverlayCoordinator`를 삭제하거나 최소화한다.

완료 기준:

- MutationObserver 없이 overlay 상태 관리.
- modal 간 z-index 충돌 회귀 테스트 통과.

### Phase 7 — `page.tsx` 책임 분리

목표: 한 컴포넌트가 모든 상태와 UI를 관리하는 구조를 줄인다.

권장 분리:

```text
Home
 ├─ RecipeCatalog
 │   ├─ RecipeSearch
 │   ├─ RecipeFilter
 │   └─ RecipeList
 ├─ BrewTimer
 ├─ CustomRecipeEditor
 └─ hooks
     ├─ useRecipeCatalog
     ├─ useRecipeOrder
     ├─ useFavorites
     └─ useBrewTimer
```

초기에는 파일 분리보다 상태 경계와 테스트 가능성을 우선한다.

완료 기준:

- 레시피 목록과 타이머 로직이 독립 컴포넌트/훅으로 분리됨.
- 기존 brew session 복원 동작 유지.
- 공식 레시피 scaling 회귀 없음.

### Phase 8 — E2E 테스트 분리 및 데이터 파생

목표: 실패 원인을 즉시 찾을 수 있게 한다.

권장 E2E 구분:

- `catalog.e2e`
- `storage-migration.e2e`
- `timer-scaling.e2e`
- `timer-reload.e2e`
- `recipe-order.e2e`
- `mobile-navigation.e2e`

작업:

1. expected recipe names를 registry에서 파생한다.
2. recipe count를 숫자로 하드코딩하지 않는다.
3. 각 E2E가 한 주요 책임만 검증하게 한다.
4. 실패 artifact 이름을 시나리오별로 구분한다.

완료 기준:

- 레시피 추가 시 E2E 예상 목록 수동 수정 최소화.
- 순서 드래그/저장/복원 E2E 존재.
- 어느 기능이 실패했는지 job/log에서 바로 식별 가능.

### Phase 9 — 빌드 체인 및 Actions 정리

목표: 개발 환경과 운영 환경 차이 및 CI 변동성을 줄인다.

작업:

1. 주 운영 경로를 Next.js로 정할 경우 `dev`/`build`도 Next.js 중심으로 통일하는 방안을 검증한다.
2. Vinext가 필요한 기능이 있는지 확인 후 제거 여부 결정한다.
3. Playwright를 devDependency에 고정하고 workflow에서 `pnpm add --lockfile=false`를 제거한다.
4. GitHub Actions 경고가 나는 action 버전을 업데이트한다.
5. dependency install/cache 단계를 단순화한다.

완료 기준:

- CI에서 package.json을 런타임 수정하지 않음.
- dev/build/deploy의 프레임워크 차이가 명시적으로 관리됨.
- Actions deprecation warning 최소화.

## 작업 우선순위

실제 구현 순서는 다음을 기본으로 한다.

1. Phase 0 — 기준선/브랜치
2. Phase 1 — PR/CI 안전망
3. Phase 2 — 레시피 Registry 단일화
4. Phase 3 — RecipeOrder React 상태화
5. Phase 4 — MobileRecipeEnhancer 제거
6. Phase 5 — Tool/Drawer 상태 중앙화
7. Phase 6 — Overlay Coordinator 정리
8. Phase 7 — page.tsx 분리
9. Phase 8 — E2E 분리
10. Phase 9 — 빌드/Actions 정리

Phase 2~6이 핵심 안정화 구간이다. 이 구간이 끝나기 전에는 대규모 신규 UI 기능 추가를 피한다.

## 각 단계 공통 검증

각 체크포인트에서 최소 다음을 확인한다.

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
GITHUB_PAGES=true NEXT_PUBLIC_BASE_PATH=/brew pnpm build:github
pnpm run validate:static-export out <SHA>
pnpm run validate:recipe-content out/index.html
pnpm run test:e2e
```

main 병합 이후에는 기존 `validate-live-deployment.mjs`의 안정화 검증을 반드시 유지한다.

## 사용자 기능 회귀 금지 목록

리팩터링 과정에서 다음 기능은 반드시 유지해야 한다.

- 기본 레시피 전체 목록 및 공식 데이터
- 용챔 네오스위치 HOT / ICE
- 테츠 카스야 THE NEO BREW 2026 원두량 scaling
- 정인성 클레버 1:11
- 즐겨찾기
- 사용자 레시피 저장/복구/quarantine
- 추천 레시피 생성 및 타이머 시작
- 타이머 새로고침 복원
- 원두량 변경 유지
- 모바일 하단 네비게이션
- 레시피 순서 사용자 저장
- 삭제된 기본 레시피 ID migration

## 데이터 호환성 원칙

- 기존 localStorage/sessionStorage key는 임의 변경하지 않는다.
- key를 변경해야 할 경우 migration을 먼저 만든다.
- recipe order는 이름이 아니라 안정적인 recipe ID를 저장하는 방향으로 migration한다.
- 삭제/alias recipe ID는 기존 catalog migration 규칙을 재사용한다.

## 커밋 전략

한 커밋에서 한 구조 변경만 수행한다.

예시:

1. `refactor: derive default recipe metadata from registry`
2. `refactor: move recipe ordering into React state`
3. `refactor: render mobile recipe metadata directly`
4. `refactor: centralize coffee tool drawer state`
5. `test: split recipe order browser flow`
6. `ci: separate pull request checks from pages deployment`

각 커밋은 가능한 한 독립적으로 green 상태여야 한다.

## 롤백 전략

- 각 Phase가 독립 커밋이므로 문제 발생 시 Phase 단위 revert가 가능해야 한다.
- 저장 데이터 schema 변경은 migration 완료 후 별도 커밋으로 적용한다.
- live verification 실패 시 main 추가 수정 대신 실패 원인을 작업 브랜치에서 먼저 재현한다.

## 첫 작업

새 채팅에서 가장 먼저 수행할 작업은 **Phase 1과 Phase 2의 세부 코드 영향 범위 확인**이다.

다만 저장소 권한상 branch protection/ruleset을 API로 변경할 수 없는 경우에는 이를 blocker로 두지 않고 다음 운영 규칙을 적용한다.

- 안정화 작업은 `refactor/architecture-stabilization` 브랜치에서만 수행
- 검증 전 main에 직접 커밋하지 않음
- PR에서 검증 후 main 병합

그 다음 `defaultRecipeRegistry` 단일화를 구현한다. 이 작업은 현재 반복 배포 실패의 가장 명확한 원인인 레시피 ID/이름/개수 중복을 먼저 제거한다.

## 완료 정의

구조 안정화 프로젝트는 다음 조건이 모두 만족되면 완료한다.

- 레시피 추가/삭제 시 catalog 숫자와 ID 목록을 여러 테스트에 수동 수정할 필요가 없음.
- 레시피 순서 변경이 React state 기반이며 DOM 이동 코드를 사용하지 않음.
- `MobileRecipeEnhancer` 제거.
- 모바일 도구 메뉴가 DOM 텍스트 검색 없이 직접 상태로 동작.
- overlay 관리가 MutationObserver에 의존하지 않음.
- 주요 E2E가 기능별로 분리됨.
- main에 병합되는 변경은 사전 CI를 통과함.
- GitHub Pages live verification은 계속 green 상태를 보장함.
