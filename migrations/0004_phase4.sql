-- 4차: 배출일 · 쌍둥이 품목 · 수거함 제보 · 주간 미션 · 퀴즈 · 시드 수거함
ALTER TABLE users ADD COLUMN district_id TEXT;

CREATE TABLE districts (
  id TEXT PRIMARY KEY,
  name_ko TEXT NOT NULL,
  city_ko TEXT NOT NULL DEFAULT '서울',
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE collection_days (
  district_id TEXT NOT NULL REFERENCES districts(id),
  weekday INTEGER NOT NULL,
  category_id TEXT NOT NULL REFERENCES waste_categories(id),
  note TEXT,
  PRIMARY KEY (district_id, weekday, category_id)
);
CREATE INDEX idx_collection_days_district ON collection_days(district_id, weekday);

CREATE TABLE item_twins (
  item_id TEXT NOT NULL REFERENCES waste_items(id),
  twin_id TEXT NOT NULL REFERENCES waste_items(id),
  reason_ko TEXT NOT NULL,
  PRIMARY KEY (item_id, twin_id)
);

CREATE TABLE bin_reports (
  id TEXT PRIMARY KEY,
  bin_id TEXT NOT NULL REFERENCES collection_bins(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  kind TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_bin_reports_bin ON bin_reports(bin_id, created_at);

CREATE TABLE weekly_missions (
  id TEXT PRIMARY KEY,
  title_ko TEXT NOT NULL,
  item_id TEXT,
  category_id TEXT,
  target_count INTEGER NOT NULL DEFAULT 1,
  bonus_points INTEGER NOT NULL DEFAULT 15,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE weekly_mission_claims (
  user_id TEXT NOT NULL REFERENCES users(id),
  mission_id TEXT NOT NULL REFERENCES weekly_missions(id),
  week_start TEXT NOT NULL,
  points INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, mission_id, week_start)
);

CREATE TABLE quiz_questions (
  id TEXT PRIMARY KEY,
  prompt_ko TEXT NOT NULL,
  item_id TEXT NOT NULL REFERENCES waste_items(id),
  choices_json TEXT NOT NULL,
  answer_id TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

INSERT INTO districts (id, name_ko, city_ko, sort_order) VALUES
  ('seoul-jongno', '종로구', '서울', 1),
  ('seoul-jung', '중구', '서울', 2),
  ('seoul-yongsan', '용산구', '서울', 3),
  ('seoul-seongdong', '성동구', '서울', 4),
  ('seoul-gwangjin', '광진구', '서울', 5),
  ('seoul-dongdaemun', '동대문구', '서울', 6),
  ('seoul-jungnang', '중랑구', '서울', 7),
  ('seoul-seongbuk', '성북구', '서울', 8),
  ('seoul-gangbuk', '강북구', '서울', 9),
  ('seoul-dobong', '도봉구', '서울', 10),
  ('seoul-nowon', '노원구', '서울', 11),
  ('seoul-eunpyeong', '은평구', '서울', 12),
  ('seoul-seodaemun', '서대문구', '서울', 13),
  ('seoul-mapo', '마포구', '서울', 14),
  ('seoul-yangcheon', '양천구', '서울', 15),
  ('seoul-gangseo', '강서구', '서울', 16),
  ('seoul-guro', '구로구', '서울', 17),
  ('seoul-geumcheon', '금천구', '서울', 18),
  ('seoul-yeongdeungpo', '영등포구', '서울', 19),
  ('seoul-dongjak', '동작구', '서울', 20),
  ('seoul-gwanak', '관악구', '서울', 21),
  ('seoul-seocho', '서초구', '서울', 22),
  ('seoul-gangnam', '강남구', '서울', 23),
  ('seoul-songpa', '송파구', '서울', 24),
  ('seoul-gangdong', '강동구', '서울', 25);

-- A: 월수금 페트·플라스틱·비닐 / 화목 종이·캔·유리
INSERT INTO collection_days (district_id, weekday, category_id)
SELECT id, 1, 'pet' FROM districts WHERE id IN ('seoul-jongno','seoul-jung','seoul-yongsan','seoul-seongdong','seoul-gwangjin','seoul-dongdaemun','seoul-jungnang','seoul-seongbuk');
INSERT INTO collection_days (district_id, weekday, category_id)
SELECT id, 1, 'plastic' FROM districts WHERE id IN ('seoul-jongno','seoul-jung','seoul-yongsan','seoul-seongdong','seoul-gwangjin','seoul-dongdaemun','seoul-jungnang','seoul-seongbuk');
INSERT INTO collection_days (district_id, weekday, category_id)
SELECT id, 1, 'vinyl' FROM districts WHERE id IN ('seoul-jongno','seoul-jung','seoul-yongsan','seoul-seongdong','seoul-gwangjin','seoul-dongdaemun','seoul-jungnang','seoul-seongbuk');
INSERT INTO collection_days (district_id, weekday, category_id)
SELECT id, 3, 'pet' FROM districts WHERE id IN ('seoul-jongno','seoul-jung','seoul-yongsan','seoul-seongdong','seoul-gwangjin','seoul-dongdaemun','seoul-jungnang','seoul-seongbuk');
INSERT INTO collection_days (district_id, weekday, category_id)
SELECT id, 3, 'plastic' FROM districts WHERE id IN ('seoul-jongno','seoul-jung','seoul-yongsan','seoul-seongdong','seoul-gwangjin','seoul-dongdaemun','seoul-jungnang','seoul-seongbuk');
INSERT INTO collection_days (district_id, weekday, category_id)
SELECT id, 3, 'vinyl' FROM districts WHERE id IN ('seoul-jongno','seoul-jung','seoul-yongsan','seoul-seongdong','seoul-gwangjin','seoul-dongdaemun','seoul-jungnang','seoul-seongbuk');
INSERT INTO collection_days (district_id, weekday, category_id)
SELECT id, 5, 'pet' FROM districts WHERE id IN ('seoul-jongno','seoul-jung','seoul-yongsan','seoul-seongdong','seoul-gwangjin','seoul-dongdaemun','seoul-jungnang','seoul-seongbuk');
INSERT INTO collection_days (district_id, weekday, category_id)
SELECT id, 5, 'plastic' FROM districts WHERE id IN ('seoul-jongno','seoul-jung','seoul-yongsan','seoul-seongdong','seoul-gwangjin','seoul-dongdaemun','seoul-jungnang','seoul-seongbuk');
INSERT INTO collection_days (district_id, weekday, category_id)
SELECT id, 5, 'vinyl' FROM districts WHERE id IN ('seoul-jongno','seoul-jung','seoul-yongsan','seoul-seongdong','seoul-gwangjin','seoul-dongdaemun','seoul-jungnang','seoul-seongbuk');
INSERT INTO collection_days (district_id, weekday, category_id)
SELECT id, 2, 'paper' FROM districts WHERE id IN ('seoul-jongno','seoul-jung','seoul-yongsan','seoul-seongdong','seoul-gwangjin','seoul-dongdaemun','seoul-jungnang','seoul-seongbuk');
INSERT INTO collection_days (district_id, weekday, category_id)
SELECT id, 2, 'can' FROM districts WHERE id IN ('seoul-jongno','seoul-jung','seoul-yongsan','seoul-seongdong','seoul-gwangjin','seoul-dongdaemun','seoul-jungnang','seoul-seongbuk');
INSERT INTO collection_days (district_id, weekday, category_id)
SELECT id, 2, 'glass' FROM districts WHERE id IN ('seoul-jongno','seoul-jung','seoul-yongsan','seoul-seongdong','seoul-gwangjin','seoul-dongdaemun','seoul-jungnang','seoul-seongbuk');
INSERT INTO collection_days (district_id, weekday, category_id)
SELECT id, 4, 'paper' FROM districts WHERE id IN ('seoul-jongno','seoul-jung','seoul-yongsan','seoul-seongdong','seoul-gwangjin','seoul-dongdaemun','seoul-jungnang','seoul-seongbuk');
INSERT INTO collection_days (district_id, weekday, category_id)
SELECT id, 4, 'can' FROM districts WHERE id IN ('seoul-jongno','seoul-jung','seoul-yongsan','seoul-seongdong','seoul-gwangjin','seoul-dongdaemun','seoul-jungnang','seoul-seongbuk');
INSERT INTO collection_days (district_id, weekday, category_id)
SELECT id, 4, 'glass' FROM districts WHERE id IN ('seoul-jongno','seoul-jung','seoul-yongsan','seoul-seongdong','seoul-gwangjin','seoul-dongdaemun','seoul-jungnang','seoul-seongbuk');

-- B: 화목토 페트·플라스틱·비닐 / 월수금 종이·캔·유리
INSERT INTO collection_days (district_id, weekday, category_id)
SELECT id, 2, 'pet' FROM districts WHERE id IN ('seoul-gangnam','seoul-seocho','seoul-songpa','seoul-gangdong','seoul-gangseo','seoul-yangcheon');
INSERT INTO collection_days (district_id, weekday, category_id)
SELECT id, 2, 'plastic' FROM districts WHERE id IN ('seoul-gangnam','seoul-seocho','seoul-songpa','seoul-gangdong','seoul-gangseo','seoul-yangcheon');
INSERT INTO collection_days (district_id, weekday, category_id)
SELECT id, 2, 'vinyl' FROM districts WHERE id IN ('seoul-gangnam','seoul-seocho','seoul-songpa','seoul-gangdong','seoul-gangseo','seoul-yangcheon');
INSERT INTO collection_days (district_id, weekday, category_id)
SELECT id, 4, 'pet' FROM districts WHERE id IN ('seoul-gangnam','seoul-seocho','seoul-songpa','seoul-gangdong','seoul-gangseo','seoul-yangcheon');
INSERT INTO collection_days (district_id, weekday, category_id)
SELECT id, 4, 'plastic' FROM districts WHERE id IN ('seoul-gangnam','seoul-seocho','seoul-songpa','seoul-gangdong','seoul-gangseo','seoul-yangcheon');
INSERT INTO collection_days (district_id, weekday, category_id)
SELECT id, 4, 'vinyl' FROM districts WHERE id IN ('seoul-gangnam','seoul-seocho','seoul-songpa','seoul-gangdong','seoul-gangseo','seoul-yangcheon');
INSERT INTO collection_days (district_id, weekday, category_id)
SELECT id, 6, 'pet' FROM districts WHERE id IN ('seoul-gangnam','seoul-seocho','seoul-songpa','seoul-gangdong','seoul-gangseo','seoul-yangcheon');
INSERT INTO collection_days (district_id, weekday, category_id)
SELECT id, 6, 'plastic' FROM districts WHERE id IN ('seoul-gangnam','seoul-seocho','seoul-songpa','seoul-gangdong','seoul-gangseo','seoul-yangcheon');
INSERT INTO collection_days (district_id, weekday, category_id)
SELECT id, 6, 'vinyl' FROM districts WHERE id IN ('seoul-gangnam','seoul-seocho','seoul-songpa','seoul-gangdong','seoul-gangseo','seoul-yangcheon');
INSERT INTO collection_days (district_id, weekday, category_id)
SELECT id, 1, 'paper' FROM districts WHERE id IN ('seoul-gangnam','seoul-seocho','seoul-songpa','seoul-gangdong','seoul-gangseo','seoul-yangcheon');
INSERT INTO collection_days (district_id, weekday, category_id)
SELECT id, 1, 'can' FROM districts WHERE id IN ('seoul-gangnam','seoul-seocho','seoul-songpa','seoul-gangdong','seoul-gangseo','seoul-yangcheon');
INSERT INTO collection_days (district_id, weekday, category_id)
SELECT id, 1, 'glass' FROM districts WHERE id IN ('seoul-gangnam','seoul-seocho','seoul-songpa','seoul-gangdong','seoul-gangseo','seoul-yangcheon');
INSERT INTO collection_days (district_id, weekday, category_id)
SELECT id, 3, 'paper' FROM districts WHERE id IN ('seoul-gangnam','seoul-seocho','seoul-songpa','seoul-gangdong','seoul-gangseo','seoul-yangcheon');
INSERT INTO collection_days (district_id, weekday, category_id)
SELECT id, 3, 'can' FROM districts WHERE id IN ('seoul-gangnam','seoul-seocho','seoul-songpa','seoul-gangdong','seoul-gangseo','seoul-yangcheon');
INSERT INTO collection_days (district_id, weekday, category_id)
SELECT id, 3, 'glass' FROM districts WHERE id IN ('seoul-gangnam','seoul-seocho','seoul-songpa','seoul-gangdong','seoul-gangseo','seoul-yangcheon');
INSERT INTO collection_days (district_id, weekday, category_id)
SELECT id, 5, 'paper' FROM districts WHERE id IN ('seoul-gangnam','seoul-seocho','seoul-songpa','seoul-gangdong','seoul-gangseo','seoul-yangcheon');
INSERT INTO collection_days (district_id, weekday, category_id)
SELECT id, 5, 'can' FROM districts WHERE id IN ('seoul-gangnam','seoul-seocho','seoul-songpa','seoul-gangdong','seoul-gangseo','seoul-yangcheon');
INSERT INTO collection_days (district_id, weekday, category_id)
SELECT id, 5, 'glass' FROM districts WHERE id IN ('seoul-gangnam','seoul-seocho','seoul-songpa','seoul-gangdong','seoul-gangseo','seoul-yangcheon');

-- C: 수금 페트·플라스틱 / 화목 종이 / 토 캔·유리
INSERT INTO collection_days (district_id, weekday, category_id)
SELECT id, 3, 'pet' FROM districts WHERE id IN ('seoul-gangbuk','seoul-dobong','seoul-nowon','seoul-eunpyeong','seoul-seodaemun','seoul-mapo','seoul-guro','seoul-geumcheon','seoul-yeongdeungpo','seoul-dongjak','seoul-gwanak');
INSERT INTO collection_days (district_id, weekday, category_id)
SELECT id, 3, 'plastic' FROM districts WHERE id IN ('seoul-gangbuk','seoul-dobong','seoul-nowon','seoul-eunpyeong','seoul-seodaemun','seoul-mapo','seoul-guro','seoul-geumcheon','seoul-yeongdeungpo','seoul-dongjak','seoul-gwanak');
INSERT INTO collection_days (district_id, weekday, category_id)
SELECT id, 5, 'pet' FROM districts WHERE id IN ('seoul-gangbuk','seoul-dobong','seoul-nowon','seoul-eunpyeong','seoul-seodaemun','seoul-mapo','seoul-guro','seoul-geumcheon','seoul-yeongdeungpo','seoul-dongjak','seoul-gwanak');
INSERT INTO collection_days (district_id, weekday, category_id)
SELECT id, 5, 'plastic' FROM districts WHERE id IN ('seoul-gangbuk','seoul-dobong','seoul-nowon','seoul-eunpyeong','seoul-seodaemun','seoul-mapo','seoul-guro','seoul-geumcheon','seoul-yeongdeungpo','seoul-dongjak','seoul-gwanak');
INSERT INTO collection_days (district_id, weekday, category_id)
SELECT id, 2, 'paper' FROM districts WHERE id IN ('seoul-gangbuk','seoul-dobong','seoul-nowon','seoul-eunpyeong','seoul-seodaemun','seoul-mapo','seoul-guro','seoul-geumcheon','seoul-yeongdeungpo','seoul-dongjak','seoul-gwanak');
INSERT INTO collection_days (district_id, weekday, category_id)
SELECT id, 4, 'paper' FROM districts WHERE id IN ('seoul-gangbuk','seoul-dobong','seoul-nowon','seoul-eunpyeong','seoul-seodaemun','seoul-mapo','seoul-guro','seoul-geumcheon','seoul-yeongdeungpo','seoul-dongjak','seoul-gwanak');
INSERT INTO collection_days (district_id, weekday, category_id)
SELECT id, 6, 'can' FROM districts WHERE id IN ('seoul-gangbuk','seoul-dobong','seoul-nowon','seoul-eunpyeong','seoul-seodaemun','seoul-mapo','seoul-guro','seoul-geumcheon','seoul-yeongdeungpo','seoul-dongjak','seoul-gwanak');
INSERT INTO collection_days (district_id, weekday, category_id)
SELECT id, 6, 'glass' FROM districts WHERE id IN ('seoul-gangbuk','seoul-dobong','seoul-nowon','seoul-eunpyeong','seoul-seodaemun','seoul-mapo','seoul-guro','seoul-geumcheon','seoul-yeongdeungpo','seoul-dongjak','seoul-gwanak');

INSERT INTO item_twins (item_id, twin_id, reason_ko) VALUES
  ('pet-clear', 'pet-colored', '색이 있으면 투명 페트가 아니라 플라스틱으로 가요.'),
  ('pet-colored', 'pet-clear', '투명하고 라벨을 떼면 투명 페트 전용함으로 가요.'),
  ('coffee-cup-paper', 'coffee-cup-plastic', '플라스틱컵은 종이로 넣지 말고 헹군 뒤 플라스틱으로 가요.'),
  ('coffee-cup-plastic', 'coffee-cup-paper', '종이컵은 물기를 빼고 종이로, 뚜껑만 플라스틱으로 분리하세요.'),
  ('delivery-container', 'plastic-container', '기름기가 없으면 일반 플라스틱 용기와 같이 배출해요.'),
  ('plastic-container', 'delivery-container', '배달 용기는 국물·기름을 헹군 뒤에만 플라스틱으로 가요.'),
  ('alu-can', 'steel-can', '철캔은 눌러도 잘 안 찌그러져요. 둘 다 캔함으로 가요.'),
  ('steel-can', 'alu-can', '가볍게 찌그러지면 알루미늄 캔이에요. 둘 다 캔함으로 가요.');

INSERT INTO weekly_missions (id, title_ko, item_id, category_id, target_count, bonus_points, sort_order) VALUES
  ('mission-pet', '이번 주 페트 2회 인증', NULL, 'pet', 2, 15, 1),
  ('mission-any', '아무 품목 3회 인증', NULL, NULL, 3, 10, 2),
  ('mission-med', '폐의약품 1회 인증', 'medicine', NULL, 1, 20, 3);

INSERT INTO quiz_questions (id, prompt_ko, item_id, choices_json, answer_id, sort_order) VALUES
  ('quiz-pet-label', '투명 페트병의 비닐 라벨은 어떻게 할까요?', 'pet-clear',
   '[{"id":"peel","label":"떼고 버린다"},{"id":"keep","label":"붙여 둔다"},{"id":"burn","label":"태운다"}]',
   'peel', 1),
  ('quiz-med', '먹다 남은 약은 어디에 버릴까요?', 'medicine',
   '[{"id":"sink","label":"싱크대"},{"id":"pharmacy","label":"약국 수거함"},{"id":"food","label":"음식물"}]',
   'pharmacy', 2),
  ('quiz-cup', '일회용 종이컵의 플라스틱 뚜껑은?', 'coffee-cup-paper',
   '[{"id":"together","label":"컵과 같이 종이"},{"id":"split","label":"분리해서 플라스틱"},{"id":"trash","label":"아무 데나"}]',
   'split', 3),
  ('quiz-oil', '기름기 남은 배달 용기는 어디로 갈까요?', 'delivery-container',
   '[{"id":"plastic","label":"그대로 플라스틱"},{"id":"rinse","label":"헹군 뒤 플라스틱"},{"id":"food","label":"음식물"}]',
   'rinse', 4);

INSERT INTO collection_bins (id, type, name, address, lat, lng, phone, hours, source, external_id) VALUES
  ('bin-cl-gn', 'clothing', '강남역 의류 수거함', '서울 강남구 강남대로 396', 37.4979, 127.0276, NULL, NULL, 'seed', NULL),
  ('bin-cl-sp', 'clothing', '잠실 의류함', '서울 송파구 올림픽로 300', 37.5133, 127.1001, NULL, NULL, 'seed', NULL),
  ('bin-cl-ys', 'clothing', '이태원 의류함', '서울 용산구 이태원로 192', 37.5345, 126.9946, NULL, NULL, 'seed', NULL),
  ('bin-cl-nw', 'clothing', '노원역 의류 수거함', '서울 노원구 동일로 1414', 37.6553, 127.0611, NULL, NULL, 'seed', NULL),
  ('bin-bat-mp', 'battery', '홍대 폐건전지함', '서울 마포구 양화로 160', 37.5572, 126.9236, NULL, '10:00–22:00', 'seed', NULL),
  ('bin-bat-sc', 'battery', '신촌 폐건전지함', '서울 서대문구 신촌로 83', 37.5565, 126.9368, NULL, '역 운영시간', 'seed', NULL),
  ('bin-bat-gd', 'battery', '천호 폐건전지함', '서울 강동구 천호대로 1012', 37.5386, 127.1233, NULL, '10:00–22:00', 'seed', NULL),
  ('bin-rs-gn', 'recycle_station', '강남 재활용 정거장', '서울 강남구 테헤란로 152', 37.5000, 127.0365, NULL, '08:00–20:00', 'seed', NULL);
