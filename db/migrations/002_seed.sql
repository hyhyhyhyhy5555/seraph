insert into categories (slug, slug_path, name, description, depth, sort_order)
values
  ('appliances', 'appliances', '가전', '생활 가전, 주방 가전, 청소기, 냉난방 기기 설명서', 1, 10),
  ('digital-mobile', 'digital-mobile', '디지털/모바일', '스마트폰, 태블릿, 웨어러블, 카메라 설명서', 1, 20),
  ('tv-audio', 'tv-audio', 'TV/음향', 'TV, 사운드바, 스피커, 이어폰 설명서', 1, 30),
  ('computer', 'computer', '컴퓨터/주변기기', '노트북, 모니터, 프린터, 공유기 설명서', 1, 40)
on conflict (slug_path) do update set
  name = excluded.name,
  description = excluded.description,
  sort_order = excluded.sort_order;

insert into categories (parent_id, slug, slug_path, name, depth, sort_order)
values
  ((select id from categories where slug_path = 'appliances'), 'humidifier', 'appliances/humidifier', '가습기', 2, 10),
  ((select id from categories where slug_path = 'appliances'), 'air-purifier', 'appliances/air-purifier', '공기 청정기', 2, 20),
  ((select id from categories where slug_path = 'appliances'), 'kimchi-fridge', 'appliances/kimchi-fridge', '김치냉장고', 2, 30),
  ((select id from categories where slug_path = 'appliances'), 'freezer', 'appliances/freezer', '냉동고', 2, 40),
  ((select id from categories where slug_path = 'appliances'), 'refrigerator', 'appliances/refrigerator', '냉장고', 2, 50),
  ((select id from categories where slug_path = 'appliances'), 'iron', 'appliances/iron', '다리미', 2, 60),
  ((select id from categories where slug_path = 'appliances'), 'range', 'appliances/range', '레인지', 2, 70),
  ((select id from categories where slug_path = 'appliances'), 'fan', 'appliances/fan', '선풍기', 2, 80),
  ((select id from categories where slug_path = 'appliances'), 'washer', 'appliances/washer', '세탁기', 2, 90),
  ((select id from categories where slug_path = 'appliances'), 'dryer', 'appliances/dryer', '의류 건조기', 2, 100),
  ((select id from categories where slug_path = 'appliances'), 'microwave', 'appliances/microwave', '전자렌지', 2, 110),
  ((select id from categories where slug_path = 'appliances'), 'water-purifier', 'appliances/water-purifier', '정수기', 2, 120),
  ((select id from categories where slug_path = 'appliances'), 'dehumidifier', 'appliances/dehumidifier', '제습기', 2, 130),
  ((select id from categories where slug_path = 'appliances'), 'vacuum', 'appliances/vacuum', '진공 청소기', 2, 140),
  ((select id from categories where slug_path = 'appliances'), 'coffee-machine', 'appliances/coffee-machine', '커피 머신', 2, 150),
  ((select id from categories where slug_path = 'appliances'), 'air-conditioner', 'appliances/air-conditioner', '에어컨', 2, 160),
  ((select id from categories where slug_path = 'digital-mobile'), 'smartphone', 'digital-mobile/smartphone', '스마트폰', 2, 10),
  ((select id from categories where slug_path = 'digital-mobile'), 'tablet', 'digital-mobile/tablet', '태블릿', 2, 20),
  ((select id from categories where slug_path = 'tv-audio'), 'tv', 'tv-audio/tv', 'TV', 2, 10),
  ((select id from categories where slug_path = 'computer'), 'laptop', 'computer/laptop', '노트북', 2, 10),
  ((select id from categories where slug_path = 'computer'), 'printer', 'computer/printer', '프린터', 2, 20)
on conflict (slug_path) do update set
  name = excluded.name,
  parent_id = excluded.parent_id,
  sort_order = excluded.sort_order;

insert into manufacturers (name, slug, country_code, website_url)
values
  ('삼성', 'samsung', 'KR', 'https://www.samsung.com/sec/support/'),
  ('LG', 'lg', 'KR', 'https://www.lge.co.kr/support'),
  ('쿠쿠', 'cuckoo', 'KR', 'https://www.cuckoo.co.kr/customer'),
  ('쿠첸', 'cuchen', 'KR', 'https://www.cuchenmall.co.kr/customer'),
  ('위닉스', 'winix', 'KR', 'https://www.winix.com/kr/support'),
  ('코웨이', 'coway', 'KR', 'https://www.coway.com'),
  ('다이슨', 'dyson', 'GB', 'https://www.dyson.co.kr/support'),
  ('Boneco', 'boneco', 'CH', 'https://www.boneco.com'),
  ('신일', 'shinil', 'KR', null),
  ('한일전기', 'hanil', 'KR', null),
  ('드롱기', 'delonghi', 'IT', 'https://www.delonghi.com'),
  ('Apple', 'apple', 'US', 'https://support.apple.com/ko-kr'),
  ('Canon', 'canon', 'JP', 'https://kr.canon'),
  ('HP', 'hp', 'US', 'https://support.hp.com/kr-ko')
on conflict (slug) do update set
  name = excluded.name,
  country_code = excluded.country_code,
  website_url = excluded.website_url;

insert into manuals (
  category_id,
  manufacturer_id,
  title,
  model_name,
  normalized_model,
  source_url,
  pdf_url,
  source_type,
  ingestion_status,
  rights_status,
  summary
)
values
  (
    (select id from categories where slug_path = 'appliances/humidifier'),
    (select id from manufacturers where slug = 'boneco'),
    'Boneco U350 가습기 사용 설명서',
    'U350',
    'u350',
    'https://example.com/manuals/boneco-u350',
    'https://example.com/manuals/boneco-u350.pdf',
    'sample',
    'ready',
    'unknown',
    '물통 세척, 습도 조절, 필터 교체 주기, 에러 표시를 확인할 수 있는 설명서입니다.'
  ),
  (
    (select id from categories where slug_path = 'appliances/air-conditioner'),
    (select id from manufacturers where slug = 'lg'),
    'LG 휘센 에어컨 기본 사용 설명서',
    'WHISEN',
    'whisen',
    'https://example.com/manuals/lg-whisen',
    'https://example.com/manuals/lg-whisen.pdf',
    'sample',
    'ready',
    'unknown',
    '냉방, 제습, 자동 청소, 필터 관리, 리모컨 설정을 다룹니다.'
  ),
  (
    (select id from categories where slug_path = 'appliances/washer'),
    (select id from manufacturers where slug = 'samsung'),
    '삼성 Bespoke 세탁기 사용자 매뉴얼',
    'Bespoke Washer',
    'bespoke-washer',
    'https://example.com/manuals/samsung-bespoke-washer',
    'https://example.com/manuals/samsung-bespoke-washer.pdf',
    'sample',
    'ready',
    'unknown',
    '표준 세탁, AI 맞춤 코스, 세제함 관리, 통세척, 오류 코드 안내를 포함합니다.'
  ),
  (
    (select id from categories where slug_path = 'appliances/water-purifier'),
    (select id from manufacturers where slug = 'cuckoo'),
    '쿠쿠 정수기 설치 및 사용 설명서',
    'CP Series',
    'cp-series',
    'https://example.com/manuals/cuckoo-water-purifier',
    'https://example.com/manuals/cuckoo-water-purifier.pdf',
    'sample',
    'ready',
    'unknown',
    '필터 교체, 온수 잠금, 출수량 설정, 살균 모드 사용법을 정리한 설명서입니다.'
  ),
  (
    (select id from categories where slug_path = 'appliances/vacuum'),
    (select id from manufacturers where slug = 'dyson'),
    '다이슨 무선 진공 청소기 사용 설명서',
    'V Series',
    'v-series',
    'https://example.com/manuals/dyson-vacuum',
    'https://example.com/manuals/dyson-vacuum.pdf',
    'sample',
    'ready',
    'unknown',
    '충전, 먼지통 비우기, 필터 세척, 흡입 모드와 브러시 관리 방법을 제공합니다.'
  ),
  (
    (select id from categories where slug_path = 'digital-mobile/smartphone'),
    (select id from manufacturers where slug = 'samsung'),
    '삼성 Galaxy 스마트폰 빠른 시작 설명서',
    'Galaxy',
    'galaxy',
    'https://example.com/manuals/samsung-galaxy',
    'https://example.com/manuals/samsung-galaxy.pdf',
    'sample',
    'ready',
    'unknown',
    '초기 설정, 계정 이전, 보안 잠금, 배터리 관리, 백업 방법을 다룹니다.'
  )
on conflict do nothing;

insert into manual_chunks (
  manual_id,
  page_start,
  page_end,
  chunk_index,
  content,
  token_count,
  metadata
)
values
  (
    (select id from manuals where source_url = 'https://example.com/manuals/boneco-u350'),
    1,
    1,
    0,
    'Boneco U350 가습기는 물통을 분리해 세척할 수 있습니다. 물때나 냄새가 나면 물통과 본체 수조를 깨끗한 물로 헹구고 완전히 건조한 뒤 다시 조립하세요. 습도 조절은 목표 습도를 설정한 뒤 자동 운전으로 맞출 수 있습니다.',
    91,
    jsonb_build_object('seed', true, 'topic', 'cleaning-humidity')
  ),
  (
    (select id from manuals where source_url = 'https://example.com/manuals/boneco-u350'),
    2,
    2,
    1,
    '필터 교체 알림이나 에러 표시가 나오면 필터 장착 상태와 물 부족 상태를 먼저 확인하세요. 장시간 사용하지 않을 때는 남은 물을 비우고 내부를 건조해야 합니다.',
    72,
    jsonb_build_object('seed', true, 'topic', 'filter-error')
  ),
  (
    (select id from manuals where source_url = 'https://example.com/manuals/lg-whisen'),
    1,
    1,
    0,
    'LG 휘센 에어컨은 냉방, 제습, 자동 운전 모드를 제공합니다. 리모컨에서 운전 모드를 선택하고 희망 온도를 설정하면 됩니다. 제습 운전은 실내 습도가 높을 때 사용합니다.',
    88,
    jsonb_build_object('seed', true, 'topic', 'cooling-dehumidify')
  ),
  (
    (select id from manuals where source_url = 'https://example.com/manuals/lg-whisen'),
    2,
    2,
    1,
    '필터 청소 알림이 표시되면 전원을 끄고 전면 패널을 연 뒤 필터를 분리하세요. 먼지를 제거하고 그늘에서 완전히 말린 뒤 다시 장착합니다. 자동 청소 기능은 냉방 후 내부 습기를 줄이는 데 사용합니다.',
    105,
    jsonb_build_object('seed', true, 'topic', 'filter-auto-clean')
  ),
  (
    (select id from manuals where source_url = 'https://example.com/manuals/samsung-bespoke-washer'),
    1,
    1,
    0,
    '삼성 Bespoke 세탁기는 표준 세탁, AI 맞춤 코스, 헹굼 추가, 탈수 강도 설정을 제공합니다. 세탁물 종류와 오염도에 맞게 코스를 선택하고 필요하면 세제함에 권장량만 넣으세요.',
    96,
    jsonb_build_object('seed', true, 'topic', 'washing-course')
  ),
  (
    (select id from manuals where source_url = 'https://example.com/manuals/samsung-bespoke-washer'),
    2,
    2,
    1,
    '4C 오류는 급수가 원활하지 않을 때 표시될 수 있습니다. 수도꼭지가 열려 있는지, 급수 호스가 꺾이지 않았는지, 급수 필터가 막히지 않았는지 확인하세요. 문제가 계속되면 전원을 껐다가 다시 켭니다.',
    102,
    jsonb_build_object('seed', true, 'topic', 'error-4c-water-supply')
  ),
  (
    (select id from manuals where source_url = 'https://example.com/manuals/samsung-bespoke-washer'),
    3,
    3,
    2,
    '통세척은 세탁조 내부의 냄새와 찌꺼기를 줄이기 위한 관리 기능입니다. 세탁물이 없는 상태에서 통세척 코스를 선택하고, 세탁조 전용 세정제를 사용할 때는 제품 안내에 따르세요.',
    90,
    jsonb_build_object('seed', true, 'topic', 'drum-clean')
  ),
  (
    (select id from manuals where source_url = 'https://example.com/manuals/cuckoo-water-purifier'),
    1,
    1,
    0,
    '쿠쿠 정수기는 필터 교체 주기에 맞춰 필터를 교체해야 합니다. 필터 교체 후에는 초기 물을 충분히 배출하고, 표시등이나 앱에서 필터 상태를 확인하세요.',
    82,
    jsonb_build_object('seed', true, 'topic', 'filter-replacement')
  ),
  (
    (select id from manuals where source_url = 'https://example.com/manuals/cuckoo-water-purifier'),
    2,
    2,
    1,
    '온수 잠금 기능은 어린이나 사용자가 실수로 뜨거운 물을 출수하지 않도록 막습니다. 온수 사용 전 잠금을 해제하고, 사용 후에는 다시 잠금 상태를 확인하세요. 출수량 설정은 컵 크기에 맞춰 조절할 수 있습니다.',
    109,
    jsonb_build_object('seed', true, 'topic', 'hot-water-lock')
  ),
  (
    (select id from manuals where source_url = 'https://example.com/manuals/dyson-vacuum'),
    1,
    1,
    0,
    '다이슨 무선 진공 청소기는 사용 후 충전 거치대에 연결해 배터리를 충전합니다. 흡입력이 약해졌다면 먼지통을 비우고 브러시에 머리카락이나 이물질이 감겨 있는지 확인하세요.',
    91,
    jsonb_build_object('seed', true, 'topic', 'charging-suction')
  ),
  (
    (select id from manuals where source_url = 'https://example.com/manuals/dyson-vacuum'),
    2,
    2,
    1,
    '필터는 물로 세척한 뒤 완전히 마를 때까지 최소 하루 이상 건조해야 합니다. 젖은 필터를 장착하면 흡입 성능 저하나 냄새가 발생할 수 있습니다.',
    73,
    jsonb_build_object('seed', true, 'topic', 'filter-cleaning')
  ),
  (
    (select id from manuals where source_url = 'https://example.com/manuals/samsung-galaxy'),
    1,
    1,
    0,
    '삼성 Galaxy 스마트폰은 처음 켤 때 언어, Wi-Fi, 삼성 계정 또는 Google 계정을 설정합니다. 이전 휴대폰의 데이터는 계정 동기화나 스마트 스위치 기능으로 옮길 수 있습니다.',
    88,
    jsonb_build_object('seed', true, 'topic', 'initial-setup-transfer')
  ),
  (
    (select id from manuals where source_url = 'https://example.com/manuals/samsung-galaxy'),
    2,
    2,
    1,
    '배터리 사용 시간이 짧다면 화면 밝기, 백그라운드 앱, 위치 사용 권한을 확인하세요. 보안 잠금은 PIN, 패턴, 지문, 얼굴 인식 중 하나를 선택해 설정할 수 있습니다.',
    92,
    jsonb_build_object('seed', true, 'topic', 'battery-security')
  )
on conflict (manual_id, chunk_index) do update set
  page_start = excluded.page_start,
  page_end = excluded.page_end,
  content = excluded.content,
  token_count = excluded.token_count,
  metadata = excluded.metadata;
