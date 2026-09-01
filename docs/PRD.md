# Smart Recycle PRD

**프로젝트명:** smart-recycle  
**제품명:** Smart Recycle (스마트 분리수거 및 리사이클링 도우미, 가제 EcoGuide)  
**문서 버전:** 1.0  
**상태:** Draft — MVP 구현 기준  
**작성일:** 2026-09-01  
**대상 독자:** 바이브 코딩으로 프로토타입/아키텍처를 구현하는 개발자 및 AI 에이전트

---

## 1. 문서 목적

이 PRD는 smart-recycle MVP를 **Cloudflare Workers(Static Assets) + D1 + R2 + Workers AI** 스택으로 바로 구현할 수 있도록, 제품 범위·화면·데이터·API·AI 파이프라인·마일스톤을 한 문서로 고정한다.

구현 중 요구사항이 바뀌면 이 문서를 먼저 수정하고, 코드는 문서의 계약을 따른다.

---

## 2. 제품 개요

### 2.1 한 줄 정의

사진을 찍거나 검색하면 **무엇을 어떻게 버릴지**를 알려주고, 특수 수거함 위치와 작은 보상 루틴으로 **올바른 분리배출을 습관화**하는 모바일 웹 서비스.

### 2.2 해결하는 문제

| 문제 | 현재 상태 | Smart Recycle이 바꾸는 점 |
|------|-----------|----------------------|
| 품목별 배출 규칙이 지자체·재질마다 다름 | 검색·게시물·단지 안내문에 의존 | 사진/검색 한 번에 단계형 가이드 제공 |
| 폐의약품·의류·소형가전은 일반 분리수거함이 아님 | 위치를 모름 | GPS 기준 특수 수거함 지도 |
| 올바르게 버려도 피드백이 없음 | 동기 유지가 어려움 | 인증 포인트 + 캐릭터 성장 |

### 2.3 비전 (MVP 이후)

전국 지자체 규정 차이를 반영한 개인화 가이드, 단지/아파트 맞춤 배출일, 업사이클 커뮤니티. **MVP는 “찍고 → 확인하고 → 버리고 → 인증한다” 루프만 완성한다.**

### 2.4 비목표 (Out of Scope, MVP)

- 네이티브 iOS/Android 앱 스토어 배포
- 실시간 다중 객체 세그멘테이션(픽셀 단위 마스크)
- 사용자 간 소셜 피드, 댓글, 팔로우
- 결제, 포인트 현금화, 제휴 쇼핑몰
- 관리자 CMS 풀스택(초기에는 SQL 시드 + Wrangler 마이그레이션)
- 모든 지자체 조례의 완전한 자동 동기화

---

## 3. 목표와 성공 지표

### 3.1 제품 목표

1. 분리배출 고민을 **30초 이내**에 해소한다.
2. 오인식이 나도 **검색으로 반드시 답을 찾게** 한다.
3. 특수 쓰레기 배출 장벽을 **지도 1화면**으로 낮춘다.
4. 매일 한 번 인증하는 **가벼운 루틴**을 만든다.

### 3.2 MVP 성공 지표 (출시 후 2주 기준, 내부 알파)

| 지표 | 목표 | 측정 |
|------|------|------|
| 인식 → 가이드 도달률 | ≥ 80% | `recognize` 성공 / 요청 |
| 미인식 후 검색 전환율 | ≥ 50% | 검색 세션 / 미인식 세션 |
| 가이드 단계 완독(마지막 스텝 노출) | ≥ 60% | 클라이언트 이벤트 |
| 지도에서 수거함 상세 조회 | ≥ 40% (지도 진입 사용자) | `GET /api/bins/:id` |
| 인증 제출 성공 | ≥ 20% (가이드 도달 사용자) | `POST /api/checkins` |
| P95 인식 API 응답 | ≤ 8초 | Workers Observability |

정량 데이터가 없어도 알파 테스트 5명 기준 **“다음에 또 찍어서 버리겠다” 3명 이상**이면 제품 방향은 유효하다.

---

## 4. 사용자

### 4.1 페르소나

**P1. 자취생 민지 (1인 가구, 25세)**  
페트병·배달용기·비닐을 자주 버리지만 라벨·뚜껑·기름기 규칙을 매번 헷갈린다. 휴대폰으로 찍고 바로 확인하고 싶다.

**P2. 일반 시민 현우 (32세)**  
폐건전지, 약, 헌 옷은 “어디에 내는지”를 모른다. 집 근처 수거함만 보여주면 된다.

**P3. 루틴형 사용자 수아 (28세)**  
환경을 챙기고 싶지만 거창한 챌린지는 부담이다. 하루 한 번 인증하고 캐릭터가 자라는 정도가 적당하다.

### 4.2 Jobs To Be Done

- 이 물건은 **어느 통**에 넣나?
- 버리기 **전에 무엇을** 해야 하나? (세척, 라벨, 압착)
- **특수 품목**은 어디에 가져가나?
- 오늘도 제대로 버렸다는 **작은 성취**를 남기고 싶다.

---

## 5. 범위

### 5.1 MVP In

- 카메라 촬영 / 갤러리 업로드 → AI 품목 인식
- 품목별 단계형 배출 가이드 + 업사이클 팁 1~2개
- 텍스트 검색 (오인식·미인식 폴백)
- GPS 기반 특수 수거함 지도 (마커, 거리, 상세)
- 익명 사용자 기준 포인트·스트릭·캐릭터 성장
- 분리수거 인증(사진 선택적) 및 일일 루틴

### 5.2 MVP Out → Phase 2

- 지자체(시/군/구)별 규정 분기
- 로그인(소셜 OAuth), 계정 복원
- 다중 품목 한 장 인식(여러 박스)
- 푸시 알림, 배출일 캘린더
- 관리자 웹콘솔

---

## 6. 정보 구조와 화면

모바일 퍼스트. 하단 탭 4개.

```
[인식]  [검색]  [지도]  [마이]
```

### 6.1 화면 목록

| ID | 화면 | 진입 | 핵심 행동 |
|----|------|------|-----------|
| S1 | 스플래시 / 온보딩 | 최초 1회 | 위치·카메라 권한 안내 |
| S2 | 인식 홈 | 탭 [인식] | 촬영, 업로드 |
| S3 | 인식 중 | S2 이후 | 로딩, 취소 |
| S4 | 가이드 결과 | 인식/검색 성공 | 단계 확인, 인증, 지도 연결 |
| S5 | 미인식/저신뢰 | 인식 실패 | 재촬영, 검색으로 이동 |
| S6 | 검색 | 탭 [검색] 또는 S5 | 키워드, 카테고리 칩 |
| S7 | 지도 | 탭 [지도] 또는 가이드 CTA | 내 위치, 필터, 마커 |
| S8 | 수거함 상세 | 마커 탭 | 거리, 주소, 운영 정보 |
| S9 | 마이/캐릭터 | 탭 [마이] | 포인트, 스트릭, 히스토리 |
| S10 | 인증 완료 | S4 제출 후 | 포인트 지급, 캐릭터 리액션 |
| S11 | 권한/에러 공용 | 어디서나 | 재시도, 설정 안내 |

### 6.2 핵심 사용자 흐름

**Happy path**

1. 앱 열기 → 페트병 촬영  
2. 2~6초 내 “투명 페트병” 인식  
3. 세척 → 라벨 제거 → 압착 → 투명 페트 전용함  
4. “오늘 인증하기” → +10P, 캐릭터 경험치  
5. (특수 품목이면) “근처 수거함 보기” → 지도

**Sad path**

1. 인식 신뢰도 < 임계값 또는 품목 매핑 실패  
2. “잘 모르겠어요” + 재촬영 / 검색 유도  
3. 검색 “배달 용기” → 동일 가이드 화면(S4)

---

## 7. 기능 요구사항

우선순위: **P0** 없으면 MVP 불가, **P1** 가산점(스펙에 포함), **P2** 여유 시.

### 7.1 AI 인식 및 배출 가이드 (P0)

#### FR-1. 이미지 입력

- 카메라 촬영(후면 기본)과 파일 업로드를 지원한다.
- 허용 형식: JPEG, PNG, WebP. 최대 **5MB**.
- 클라이언트에서 긴 변 **1280px**로 리사이즈 후 업로드한다. (Workers AI 비전 입력 한도·비용 절감)
- EXIF 방향은 업로드 전 정규화한다.

#### FR-2. 품목 인식

- 서버는 이미지를 R2에 저장한 뒤 Workers AI로 분류한다.
- MVP 카테고리(필수): `pet`, `plastic`, `can`, `glass`, `paper`, `vinyl`, `food`, `general`, `battery`, `medicine`, `small_electronics`, `clothing`, `unknown`
- 응답에 `label_ko`, `category`, `confidence(0~1)`, `item_id`(카탈로그 매핑)를 포함한다.
- `confidence < 0.55` 이거나 카탈로그 미매핑이면 `unknown` 처리하고 S5로 보낸다.

#### FR-3. 단계형 가이드

카탈로그 항목마다 아래 필드를 가진다.

- 한 줄 요약 (예: “투명 페트 — 내용물 비우고 라벨을 제거하세요”)
- 배출 용기/위치 타입 (`bin_type`)
- 단계 배열: `{ order, title, body, required }`
- 주의사항 (기름기, 깨진 유리 등)
- 특수 수거 여부 → 지도 딥링크 (`/map?type=medicine`)

예시 (투명 PET):

1. 내용물을 비운다  
2. 물로 가볍게 헹군다  
3. 라벨·뚜껑을 분리한다 (뚜껑은 플라스틱)  
4. 압착한다  
5. 투명 페트 전용 수거함에 넣는다  

#### FR-4. 텍스트 검색 (P0)

- 품목명, 별칭, 카테고리명으로 LIKE + 별칭 테이블 검색.
- 자동완성: 2글자 이상, 최대 8건.
- 결과 탭 시 S4와 동일한 가이드 컴포넌트를 재사용한다.
- 검색 로그는 D1에 남겨 이후 카탈로그 보강에 쓴다. (개인 식별 정보 없음)

### 7.2 위치 기반 특수 수거함 지도 (P0)

#### FR-5. 지도

- 웹: Leaflet + OpenStreetMap 타일 (API 키 없이 MVP).
- 브라우저 Geolocation으로 현재 위치. 거부 시 기본 좌표 **서울시청 (37.5665, 126.9780)** + 위치 설정 유도.
- 초기 반경 **3km**, 줌 변경 시 bbox로 재조회.

#### FR-6. 수거함 유형 (필터 칩)

| type | 표시명 | 데이터 소스 (MVP) |
|------|--------|-------------------|
| `medicine` | 폐의약품 | 공공데이터 + 시드 |
| `electronics` | 소형가전 | 공공데이터 + 시드 |
| `clothing` | 의류 | 공공데이터 + 시드 |
| `recycle_station` | 재활용 정거장 | 공공데이터 + 시드 |
| `battery` | 폐건전지 | 시드 (약국/아파트 등) |

#### FR-7. 마커·상세

- 마커에 유형 아이콘, 리스트에 직선거리(Haversine, m/km).
- 상세: 이름, 유형, 주소, 운영시간(있으면), 전화번호(있으면), 거리, 외부 길찾기 링크(카카오맵/구글맵 URL 스킴).
- 데이터 없는 필드는 UI에서 숨긴다. “정보 없음”을 남발하지 않는다.

#### FR-8. 공공데이터 연동

- Worker Cron(매일 03:00 KST)이 공공데이터포털 API를 호출해 D1 `collection_bins`를 upsert한다.
- API 키는 Secrets Store / Wrangler secret `PUBLIC_DATA_API_KEY`.
- 커버리지가 빈 유형은 `seeds/bins.sql`로 서울·주요 도시 샘플을 넣는다.
- 외부 API 실패 시 기존 D1 데이터를 그대로 제공하고, 동기화 상태를 `sync_jobs`에 기록한다.

### 7.3 리사이클링 팁 & 게이미케이션 (P1, MVP 포함)

#### FR-9. 업사이클 팁

- 가이드 하단에 품목당 최대 2개. 예: 페트병 화분, 유리병 화병.
- 안전 경고가 있는 팁은 `caution` 필드를 노출한다. (칼 사용, 아동 감독 등)
- “지금은 버릴게요”가 기본 CTA. 팁은 부가 정보로만 둔다.

#### FR-10. 인증과 포인트

- 가이드에서 “분리수거 인증” → 오늘 날짜 기준 1일 1회 기본 인증(+10P).
- 같은 품목 중복 인증은 당일 1회만 포인트. 히스토리는 남길 수 있다. (남용 방지)
- 사진은 선택. 있으면 R2에 저장하고 `checkins.image_key`에 연결.
- 포인트는 현금화하지 않으며, 캐릭터 성장에만 사용한다.

#### FR-11. 캐릭터와 데일리 루틴

- 캐릭터 이름 기본값: **새싹이**. 사용자 리네임 가능(12자).
- 경험치: 인증 1회 = 10 XP. 레벨 `floor(total_xp / 50) + 1`, 레벨 캡 10.
- 스트릭: 연속 출석(인증) 일수. 자정(KST) 기준. 하루 빠지면 0.
- 마이 화면: 레벨, XP 바, 스트릭, 최근 7일 캘린더, 누적 인증 수.

---

## 8. 기술 아키텍처

### 8.1 플랫폼 결정

Cloudflare는 **신규 풀스택 앱에 Pages 대신 Workers + Static Assets**를 권장한다. Pages는 유지되지만 신규 기능은 Workers에 집중된다.

smart-recycle은 다음으로 구현한다.

| 역할 | 제품 | 이유 |
|------|------|------|
| 프론트(SPA) + API | **Workers + Static Assets** | 한 프로젝트에서 `/api/*`와 UI 배포, Git(Workers Builds) 프리뷰 |
| 관계형 데이터 | **D1** | 카탈로그, 수거함, 사용자, 인증, 검색 로그 |
| 이미지 | **R2** | 인식 원본, 인증샷. 송신료 없음 |
| 추론 | **Workers AI** | 비전+한국어 가이드 보조. 외부 GPU 불필요 |
| 캐시(선택) | **KV** | 공공데이터 원본 스냅샷, 검색 핫키 |
| 남용 방지(선택) | **Turnstile** | 인증·업로드 봇 방지 |

사용자가 “Pages”를 원해도 **제품 경험은 동일**하다. Wrangler만 Workers 방식으로 맞춘다. 기존 Pages 대시보드 습관이 있으면 Workers Builds(Git 연동)로 대체한다.

### 8.2 권장 구성

```
[브라우저 PWA]
  Vite + React + TypeScript + Tailwind
  Leaflet (지도)
        │
        ▼
[Worker]  Hono
  /api/*  → Worker 스크립트 (run_worker_first: ["/api/*"])
  그 외    → 정적 자산 (SPA fallback)
        │
        ├── D1   DB
        ├── R2   IMAGES
        ├── AI   Workers AI
        └── CRON 공공데이터 동기화
```

**프론트:** Vite React SPA. PWA(카메라, 홈 화면 추가)로 앱처럼 사용.  
**백엔드:** Hono + Zod 검증.  
**패키지 매니저:** pnpm 권장.

### 8.3 wrangler 바인딩 (계약)

```jsonc
{
  "name": "smart-recycle",
  "compatibility_date": "2026-09-01",
  "compatibility_flags": ["nodejs_compat"],
  "main": "workers/index.ts",
  "assets": {
    "directory": "./dist",
    "not_found_handling": "single-page-application",
    "run_worker_first": ["/api/*"]
  },
  "d1_databases": [
    { "binding": "DB", "database_name": "smart-recycle-db", "database_id": "<id>" }
  ],
  "r2_buckets": [
    { "binding": "IMAGES", "bucket_name": "smart-recycle-images" }
  ],
  "ai": { "binding": "AI" },
  "triggers": { "crons": ["0 18 * * *"] }
}
```

Cron `0 18 * * *` = UTC 18:00 = KST 03:00.

Secrets: `PUBLIC_DATA_API_KEY` (공공데이터포털).

### 8.4 AI 파이프라인

1. 클라이언트 리사이즈 → `POST /api/recognize` (multipart)
2. Worker: MIME/크기 검사 → R2 `uploads/{user_id}/{yyyy}/{mm}/{uuid}.jpg`
3. **1차 (빠르고 저렴):** `@cf/facebook/detr-resnet-50` 객체 검출. COCO 라벨을 내부 카테고리로 매핑.
4. **2차 (한국어 품목명):** 비전 LLM  
   - 1순위 `@cf/qwen/qwen3.8-27b` (이미지+한국어 지시, function calling)  
   - 대체 `@cf/moondream/moondream3.1-9B-A2B` (detect/query, 경량)
5. 모델이 고른 `canonical_name`을 D1 `waste_items` / `waste_aliases`에 매칭.
6. 매칭 실패 시 LLM이 준 `category`만으로 카테고리 대표 가이드를 보여 주고, 검색을 권한다.
7. `recognition_logs`에 `image_key`, 라벨, confidence, latency_ms 저장. **원본 이미지는 기본 7일 후 삭제**(R2 lifecycle). 인증샷은 사용자가 올린 것만 더 길게 보관.

**프롬프트 제약:** 모델은 카탈로그에 있는 품목명만 고르도록 JSON 스키마/툴콜로 강제한다. 자유 서술은 `reason` 한 줄만 허용.

**로컬 개발:** Workers AI는 `wrangler dev --remote`가 필요하다. D1/R2는 로컬 persist 기본값 사용.

### 8.5 이미지 수명

| 객체 | 키 prefix | TTL |
|------|-----------|-----|
| 인식 업로드 | `uploads/` | 7일 (lifecycle) |
| 인증샷 | `checkins/` | 90일 |
| 시드/정적 아이콘 | Workers Assets | 영구 |

비공개 버킷. 이미지는 Worker가 서명된 단기 GET 또는 `GET /api/images/:key` 프록시로만 제공한다. 공개 R2 도메인은 쓰지 않는다.

---

## 9. 데이터 모델 (D1)

SQLite. 마이그레이션은 `migrations/` Wrangler D1 방식.

### 9.1 ER 개요

```
waste_categories 1──* waste_items 1──* waste_aliases
waste_items 1──* guide_steps
waste_items 1──* upcycle_tips
users 1──* checkins
users 1──* recognition_logs
collection_bins
search_logs
sync_jobs
```

### 9.2 스키마 (초안)

```sql
-- 익명 사용자. 클라이언트 UUID를 쿠키/localStorage에 보관
CREATE TABLE users (
  id TEXT PRIMARY KEY,           -- ulid/uuid
  nickname TEXT NOT NULL DEFAULT '새싹이',
  total_xp INTEGER NOT NULL DEFAULT 0,
  total_points INTEGER NOT NULL DEFAULT 0,
  streak_count INTEGER NOT NULL DEFAULT 0,
  last_checkin_date TEXT,        -- YYYY-MM-DD (KST)
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE waste_categories (
  id TEXT PRIMARY KEY,           -- pet, plastic, ...
  name_ko TEXT NOT NULL,
  bin_type TEXT NOT NULL,        -- 전용함 설명 키
  color TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE waste_items (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES waste_categories(id),
  name_ko TEXT NOT NULL,
  summary_ko TEXT NOT NULL,
  special_bin_type TEXT,         -- medicine 등이면 지도 필터
  is_active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE waste_aliases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id TEXT NOT NULL REFERENCES waste_items(id),
  alias TEXT NOT NULL
);
CREATE INDEX idx_aliases_alias ON waste_aliases(alias);

CREATE TABLE guide_steps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id TEXT NOT NULL REFERENCES waste_items(id),
  step_order INTEGER NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  required INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE upcycle_tips (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id TEXT NOT NULL REFERENCES waste_items(id),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  caution TEXT
);

CREATE TABLE collection_bins (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,            -- medicine, electronics, clothing, recycle_station, battery
  name TEXT NOT NULL,
  address TEXT,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  phone TEXT,
  hours TEXT,
  source TEXT NOT NULL,          -- public_data | seed
  external_id TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_bins_type ON collection_bins(type);
CREATE INDEX idx_bins_geo ON collection_bins(lat, lng);

CREATE TABLE checkins (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  item_id TEXT REFERENCES waste_items(id),
  checkin_date TEXT NOT NULL,    -- KST YYYY-MM-DD
  points INTEGER NOT NULL,
  image_key TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, item_id, checkin_date)
);

CREATE TABLE recognition_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  image_key TEXT NOT NULL,
  raw_label TEXT,
  item_id TEXT,
  category_id TEXT,
  confidence REAL,
  latency_ms INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE search_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  query TEXT NOT NULL,
  result_count INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE sync_jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL,
  status TEXT NOT NULL,          -- success | fail
  row_count INTEGER,
  error TEXT,
  ran_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### 9.3 MVP 시드 품목 (최소 세트)

구현 착수 시 아래는 **반드시** 시드한다. 별칭 포함.

- 투명 페트병, 유색 페트병, 플라스틱 용기, 비닐봉투  
- 알루미늄 캔, 철캔  
- 유리병  
- 종이박스, 신문  
- 음식물 쓰레기, 일반쓰레기  
- 폐건전지, 폐의약품, 소형가전, 헌 옷  
- 배달 플라스틱 용기, 일회용 커피컵(종이/플라스틱 구분)

---

## 10. API 계약

Base: `/api`. JSON, UTF-8. 에러 형식:

```json
{ "error": { "code": "NOT_FOUND", "message": "한국어 메시지" } }
```

인증: `Cookie: eid=<user_uuid>` 또는 없으면 서버가 발급(`Set-Cookie`, HttpOnly, Secure, SameSite=Lax, Max-Age=1년). 익명.

| Method | Path | 설명 |
|--------|------|------|
| POST | `/api/recognize` | multipart `file` → 인식+가이드 |
| GET | `/api/search?q=` | 품목 검색 |
| GET | `/api/items/:id` | 가이드 상세 |
| GET | `/api/bins?lat=&lng=&radius_m=&type=` | 근처 수거함 |
| GET | `/api/bins/:id` | 수거함 상세 |
| GET | `/api/me` | 포인트, 레벨, 스트릭 |
| PATCH | `/api/me` | `{ nickname }` |
| POST | `/api/checkins` | `{ item_id, image? }` |
| GET | `/api/checkins?limit=20` | 내 인증 히스토리 |
| GET | `/api/images/*` | R2 프록시 (본인 객체만) |

### 10.1 POST `/api/recognize` 응답 예시

```json
{
  "recognition": {
    "item_id": "pet-clear",
    "category_id": "pet",
    "label_ko": "투명 페트병",
    "confidence": 0.91,
    "image_key": "uploads/..."
  },
  "guide": {
    "summary_ko": "내용물을 비우고 라벨을 제거한 뒤 압착하세요.",
    "bin_type": "투명 페트 전용함",
    "special_bin_type": null,
    "steps": [{ "order": 1, "title": "내용물 비우기", "body": "...", "required": true }],
    "tips": [{ "title": "페트병 화분", "body": "...", "caution": null }]
  },
  "fallback": false
}
```

`fallback: true`이면 UI는 S5(재촬영/검색)를 연다. `guide`는 카테고리 대표 가이드일 수 있다.

### 10.2 GET `/api/bins`

- `radius_m` 기본 3000, 최대 10000.
- 서버에서 Haversine으로 필터·정렬. D1에 공간 인덱스가 없으므로 **대략 bbox로 SQL 필터 후** 메모리에서 거리 정렬. (MVP 수천 행 가정)
- 응답 최대 100건.

---

## 11. UX / UI 원칙

- 언어: **한국어만**. 버튼은 동사로. (“촬영하기”, “검색하기”, “인증하기”)
- 색:  greenery 포인트 + 중성 배경. 카테고리별  visdiff는 아이콘+라벨로. 색만 의존하지 않음(색각).
- 인식 중 스켈레톤. 실패는 비난하지 않음 (“잘 안 보여요. 가까이 찍거나 검색해 주세요”).
- 카메라 화면은 한 손 엄지 영역 CTA.
- 지도 필터는 가로 스크롤 칩.
- 게이미케이션은 **과하지 않게**. 폭죽·랭킹 없음. 캐릭터는 2~3 성장 단계 일러스트.

접근성: 버튼 44px, 이미지 alt, 포커스 링, `prefers-reduced-motion`.

---

## 12. 비기능 요구사항

| 항목 | 요구 |
|------|------|
| 디바이스 | 모바일 웹 360px 기준. 데스크톱은 가독만 보장 |
| 브라우저 | 최근 Chrome/Safari/Samsung Internet |
| 성능 | 초기로딩 LCP 목표 2.5s(3G 제외, 일반 4G). 번들 코드 스플리팅(지도 라우트) |
| 가용성 | Cloudflare 엣지. 공공 API 장애와 분리 |
| 보안 | 준비된 SQL문, 업로드 MIME 스니핑, 사용자당 인식 분당 10회 |
| 개인정보 | 위치는 브라우저에서만. 서버는 수거함 조회 시의 lat/lng만 일시 사용, 저장하지 않음 |
| 이미지 | 얼굴이 찍혀도 공개되지 않음. 인식 이미지 7일 삭제 |
| 관측 | `wrangler tail` / Workers Logs. `recognition_logs.latency_ms` |

Rate limit (MVP): 메모리/KV 없이 Worker 내 사용자 id + 분 단위 카운트는 D1 `INSERT`로 대략 제한하거나, 단순하게 동일 eid 인식 10/min 쿼리.

---

## 13. 개인정보 · 규정 메모

- 회원가입 없음(익명). 쿠키 UUID는 광고 식별자로 쓰지 않는다.
- 위치 권한 설명문을 온보딩에 명시한다.
- 공공데이터 이용 조건을 푸터/마이에 출처 표기.
- 의료폐기물·대형폐기물은 가이드에서 **지자체 대형폐기물 신고**를 안내하고, 앱이 접수를 대행하지 않는다.

---

## 14. 마일스톤 (바이브 코딩)

각 마일스톤은 **배포 가능한 상태**로 끝낸다.

### M0. 골격 (0.5일)

- `npm create cloudflare` 또는 Vite + Workers 템플릿
- Hono `/api/health`
- D1/R2/AI 바인딩, 로컬 `wrangler dev`
- 하단 탭 빈 화면 4개

**완료 조건:** 로컬에서 SPA + `GET /api/health` 200.

### M1. 카탈로그와 검색 (1일)

- 마이그레이션 + 시드
- `GET /api/search`, `GET /api/items/:id`
- S6, S4(검색 진입) UI

**완료 조건:** “페트병” 검색 시 단계 가이드가 렌더된다.

### M2. 인식 (1.5일)

- 카메라/업로드, 리사이즈, R2
- Workers AI 파이프라인 + 카탈로그 매핑
- S2–S5

**완료 조건:** 페트병 사진 업로드 시 가이드 연결. 실패 시 검색 폴백.

### M3. 지도 (1일)

- Leaflet, Geolocation
- `collection_bins` 시드 + `/api/bins`
- Cron 스텁(공공 API는 키 있으면 연결, 없으면 시드만)

**완료 조건:** 내 위치 기준 3km 마커, 상세·길찾기.

### M4. 게이미케이션 (0.5일)

- 익명 쿠키 사용자
- 인증, 포인트, 스트릭, 새싹이 UI (S9, S10)

**완료 조건:** 같은 품목 당일 두 번째 인증은 포인트 0, 스트릭은 유지.

### M5. 다듬기 (0.5일)

- 온보딩, 에러/권한, PWA 매니페스트, 레이트리밋
- R2 lifecycle, 로그
- Workers Builds 배포

**완료 조건:** 프로덕션 URL에서 촬영→가이드→인증→지도가 한  circul.

---

## 15. 테스트 계획

### 15.1 수동 (필수)

- [ ] JPEG 페트병 촬영 → PET 가이드
- [ ] 어두운 사진 → 미인식 → 검색
- [ ] 5MB 초과 → 클라이언트 또는 413
- [ ] 위치 허용 / 거부 각각 지도
- [ ] 필터 “폐의약품”만 표시
- [ ] 인증 1회 포인트, 동일 품목 재인증 포인트 없음
- [ ] 자정 전후 스트릭 (KST) — 테스트 시 날짜 헬퍼로 확인 가능하면 단위 테스트
- [ ] 쿠키 삭제 후 새 사용자처럼 동작 (데이터 분리)

### 15.2 자동화 (여유 시)

- Hono `app.request`로 search/items/checkin 규칙
- D1 마이그레이션 적용 후 시드 건수 assertion

브라우저 검증: 인식·검색·지도·마이 네 탭을 실제 클릭/촬영 흐름으로 확인한다. 스크린샷만으로 완료하지 않는다.

---

## 16. 리스크와 대응

| 리스크 | 영향 | 대응 |
|--------|------|------|
| Workers AI가 쓰레기 품목에 약함 | 오인식 | 카탈로그 강제 JSON + 검색 폴백을 1등 기능으로 |
| 비전 모델 콜드스타트 | 첫 요청 수 초 | 로딩 카피, 가능하면 가벼운 Moondream 1차 |
| 공공데이터 커버리지 공백 | 빈 지도 | 시드 + “내 지역 데이터가 아직 적어요” |
| D1 bbox 쿼리 성능 | 전국 POI 증가 시 | 그리드/타일 또는 타입별 분할 DB (Phase 2) |
| 익명 쿠키 분실 | 성장 초기화 | MVP 수용. Phase 2 로그인 |
| Pages vs Workers 혼동 | 배포 실수 | 이 문서는 Workers Static Assets만 사용 |

---

## 17. 오픈 이슈

1. 공공데이터포털에서 실제로 쓸 API 목록(지자체별 상이) — 키 발급 후 M3에서 확정.
2. 기본 지도 타일 OSM 사용 여부 vs 카카오맵(키, 로컬 제한).
3. 캐릭터 에셋: 이모지/SVG로 시작 vs 일러스트 3컷.
4. 인식 이미지를 학습에 쓸지. **MVP는 사용하지 않음.** 로그는 라벨·키만.

---

## 18. 구현 시 에이전트 규칙 (바이브 코딩)

1. 새 기능은 이 PRD의 FR/API/스키마를 벗어나지 않는다. 필요하면 PRD를 먼저 고친다.
2. 주석, UI 카피, 커밋 메시지, 로그는 **한국어**.
3. Secrets를 코드·PRD 예시에 실키로 넣지 않는다.
4. `wrangler.jsonc` 바인딩 이름: `DB`, `IMAGES`, `AI` 고정.
5. 가이드 UI는 인식과 검색이 **같은 컴포넌트**를 쓴다.
6. 지도 라이브러리는 초기 번들에서 분리한다.
7. 완료 전 M5 수동 체크리스트를 돈다.

---

## 19. 부록 A. 카테고리 → 검출 라벨 힌트

DETR/COCO 등 일반 객체 라벨을 내부 카테고리로 옮길 때 쓰는 힌트. 확정 매핑은 코드 상수 `CATEGORY_MAP`.

| 모델이 자주 내는 말 | smart-recycle category |
|--------------------|-------------------|
| bottle, plastic bottle | pet / plastic (색·재질은 2차 LLM) |
| cup | plastic 또는 paper (LLM 확인) |
| can, wine glass, vase | can / glass |
| cell phone, laptop, remote, keyboard | small_electronics |
| book, cardboard | paper |
| banana, apple, orange, broccoli, carrot | food |
| backpack, handbag, tie | clothing (주의: 오탐 많음 → 검색 권장) |

---

## 20. 부록 B. 참고 문서

- Workers Static Assets: https://developers.cloudflare.com/workers/static-assets/
- Pages → Workers 이전 가이드: https://developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/
- D1: https://developers.cloudflare.com/d1/
- R2: https://developers.cloudflare.com/r2/
- Workers AI 모델: https://developers.cloudflare.com/workers-ai/models/
- Qwen 3.8 27B (비전): https://developers.cloudflare.com/workers-ai/models/qwen3.8-27b/
- Moondream 3.1: https://developers.cloudflare.com/changelog/post/2026-07-08-moondream3.1-workers-ai/
- DETR: https://developers.cloudflare.com/workers-ai/models/detr-resnet-50/
