insert into source_categories (
  source_site_id,
  parent_id,
  source_url,
  source_slug_path,
  name,
  depth,
  source_payload
)
values
  ((select id from source_sites where name = 'Manuall KR'), null, 'https://manuall.kr/diy/', 'diy', 'DIY', 1, jsonb_build_object('seed', true)),
  ((select id from source_sites where name = 'Manuall KR'), null, 'https://manuall.kr/household-appliances/', 'household-appliances', '가전', 1, jsonb_build_object('seed', true)),
  ((select id from source_sites where name = 'Manuall KR'), null, 'https://manuall.kr/personal-care/', 'personal-care', '개인 관리', 1, jsonb_build_object('seed', true)),
  ((select id from source_sites where name = 'Manuall KR'), null, 'https://manuall.kr/healthcare/', 'healthcare', '건강관리', 1, jsonb_build_object('seed', true)),
  ((select id from source_sites where name = 'Manuall KR'), null, 'https://manuall.kr/miscellaneous/', 'miscellaneous', '기타', 1, jsonb_build_object('seed', true)),
  ((select id from source_sites where name = 'Manuall KR'), null, 'https://manuall.kr/animals-pet-supplies/', 'animals-pet-supplies', '동물과 용품', 1, jsonb_build_object('seed', true)),
  ((select id from source_sites where name = 'Manuall KR'), null, 'https://manuall.kr/kitchenware/', 'kitchenware', '부엌용품', 1, jsonb_build_object('seed', true)),
  ((select id from source_sites where name = 'Manuall KR'), null, 'https://manuall.kr/business-equipment/', 'business-equipment', '사업 장비', 1, jsonb_build_object('seed', true)),
  ((select id from source_sites where name = 'Manuall KR'), null, 'https://manuall.kr/water-sports-boats/', 'water-sports-boats', '수상 스포츠 및 보트', 1, jsonb_build_object('seed', true)),
  ((select id from source_sites where name = 'Manuall KR'), null, 'https://manuall.kr/sports-fitness/', 'sports-fitness', '스포츠 및 피트니스', 1, jsonb_build_object('seed', true)),
  ((select id from source_sites where name = 'Manuall KR'), null, 'https://manuall.kr/children-babies/', 'children-babies', '아동 및 유아', 1, jsonb_build_object('seed', true)),
  ((select id from source_sites where name = 'Manuall KR'), null, 'https://manuall.kr/audio-tv-photo/', 'audio-tv-photo', '오디오, TV 및 포토', 1, jsonb_build_object('seed', true)),
  ((select id from source_sites where name = 'Manuall KR'), null, 'https://manuall.kr/music-instruments/', 'music-instruments', '음악 및 악기', 1, jsonb_build_object('seed', true)),
  ((select id from source_sites where name = 'Manuall KR'), null, 'https://manuall.kr/bicycles-mopeds/', 'bicycles-mopeds', '자전거 및 모페드', 1, jsonb_build_object('seed', true)),
  ((select id from source_sites where name = 'Manuall KR'), null, 'https://manuall.kr/toys/', 'toys', '장난감', 1, jsonb_build_object('seed', true)),
  ((select id from source_sites where name = 'Manuall KR'), null, 'https://manuall.kr/garden-terrace/', 'garden-terrace', '정원 및 테라스', 1, jsonb_build_object('seed', true)),
  ((select id from source_sites where name = 'Manuall KR'), null, 'https://manuall.kr/vehicle-accessories/', 'vehicle-accessories', '차량 기타', 1, jsonb_build_object('seed', true)),
  ((select id from source_sites where name = 'Manuall KR'), null, 'https://manuall.kr/vehicles-motorcycles/', 'vehicles-motorcycles', '차량 및 오토바이', 1, jsonb_build_object('seed', true)),
  ((select id from source_sites where name = 'Manuall KR'), null, 'https://manuall.kr/hobby-leisure/', 'hobby-leisure', '취미 및 레저', 1, jsonb_build_object('seed', true)),
  ((select id from source_sites where name = 'Manuall KR'), null, 'https://manuall.kr/camping-outdoor/', 'camping-outdoor', '캠핑 및 아웃도어', 1, jsonb_build_object('seed', true)),
  ((select id from source_sites where name = 'Manuall KR'), null, 'https://manuall.kr/computers-software/', 'computers-software', '컴퓨터 및 소프트웨어', 1, jsonb_build_object('seed', true)),
  ((select id from source_sites where name = 'Manuall KR'), null, 'https://manuall.kr/consoles-games/', 'consoles-games', '콘솔 및 게임', 1, jsonb_build_object('seed', true)),
  ((select id from source_sites where name = 'Manuall KR'), null, 'https://manuall.kr/communication/', 'communication', '통신', 1, jsonb_build_object('seed', true)),
  ((select id from source_sites where name = 'Manuall KR'), null, 'https://manuall.kr/home-decoration/', 'home-decoration', '홈 및 장식', 1, jsonb_build_object('seed', true))
on conflict (source_site_id, source_slug_path) do update set
  source_url = excluded.source_url,
  name = excluded.name,
  source_payload = excluded.source_payload;

insert into source_categories (
  source_site_id,
  parent_id,
  source_url,
  source_slug_path,
  name,
  depth,
  source_payload
)
values
  ((select id from source_sites where name = 'Manuall KR'), (select id from source_categories where source_slug_path = 'household-appliances' and source_site_id = (select id from source_sites where name = 'Manuall KR')), 'https://manuall.kr/household-appliances/dishwashers/', 'household-appliances/dishwashers', '식기 세척기', 2, jsonb_build_object('seed', true)),
  ((select id from source_sites where name = 'Manuall KR'), (select id from source_categories where source_slug_path = 'household-appliances' and source_site_id = (select id from source_sites where name = 'Manuall KR')), 'https://manuall.kr/household-appliances/washing-machines/', 'household-appliances/washing-machines', '세탁기', 2, jsonb_build_object('seed', true)),
  ((select id from source_sites where name = 'Manuall KR'), (select id from source_categories where source_slug_path = 'household-appliances' and source_site_id = (select id from source_sites where name = 'Manuall KR')), 'https://manuall.kr/household-appliances/clothes-dryers/', 'household-appliances/clothes-dryers', '의류 건조기', 2, jsonb_build_object('seed', true)),
  ((select id from source_sites where name = 'Manuall KR'), (select id from source_categories where source_slug_path = 'personal-care' and source_site_id = (select id from source_sites where name = 'Manuall KR')), 'https://manuall.kr/personal-care/electric-shavers/', 'personal-care/electric-shavers', '전기면도기', 2, jsonb_build_object('seed', true)),
  ((select id from source_sites where name = 'Manuall KR'), (select id from source_categories where source_slug_path = 'personal-care' and source_site_id = (select id from source_sites where name = 'Manuall KR')), 'https://manuall.kr/personal-care/hair-dryers/', 'personal-care/hair-dryers', '헤어 드라이어', 2, jsonb_build_object('seed', true)),
  ((select id from source_sites where name = 'Manuall KR'), (select id from source_categories where source_slug_path = 'computers-software' and source_site_id = (select id from source_sites where name = 'Manuall KR')), 'https://manuall.kr/computers-software/routers/', 'computers-software/routers', '라우터', 2, jsonb_build_object('seed', true)),
  ((select id from source_sites where name = 'Manuall KR'), (select id from source_categories where source_slug_path = 'computers-software' and source_site_id = (select id from source_sites where name = 'Manuall KR')), 'https://manuall.kr/computers-software/printers/', 'computers-software/printers', '프린터', 2, jsonb_build_object('seed', true))
on conflict (source_site_id, source_slug_path) do update set
  parent_id = excluded.parent_id,
  source_url = excluded.source_url,
  name = excluded.name,
  source_payload = excluded.source_payload;

insert into category_source_mappings (
  category_id,
  source_category_id,
  confidence,
  mapping_status
)
values
  (
    (select id from categories where slug_path = 'appliances'),
    (select id from source_categories where source_slug_path = 'household-appliances' and source_site_id = (select id from source_sites where name = 'Manuall KR')),
    1.0,
    'confirmed'
  ),
  (
    (select id from categories where slug_path = 'appliances/washer'),
    (select id from source_categories where source_slug_path = 'household-appliances/washing-machines' and source_site_id = (select id from source_sites where name = 'Manuall KR')),
    1.0,
    'confirmed'
  ),
  (
    (select id from categories where slug_path = 'appliances/dryer'),
    (select id from source_categories where source_slug_path = 'household-appliances/clothes-dryers' and source_site_id = (select id from source_sites where name = 'Manuall KR')),
    1.0,
    'confirmed'
  ),
  (
    (select id from categories where slug_path = 'computer'),
    (select id from source_categories where source_slug_path = 'computers-software' and source_site_id = (select id from source_sites where name = 'Manuall KR')),
    0.9,
    'suggested'
  ),
  (
    (select id from categories where slug_path = 'computer/printer'),
    (select id from source_categories where source_slug_path = 'computers-software/printers' and source_site_id = (select id from source_sites where name = 'Manuall KR')),
    1.0,
    'confirmed'
  )
on conflict (category_id, source_category_id) do update set
  confidence = excluded.confidence,
  mapping_status = excluded.mapping_status;
