with source_site as (
  select id
  from source_sites
  where name = 'Manuall KR'
),
household_parent as (
  select source_categories.id
  from source_categories
  join source_site on source_site.id = source_categories.source_site_id
  where source_categories.source_slug_path = 'household-appliances'
),
household_source_categories(source_slug_path, source_url, name) as (
  values
    ('household-appliances/humidifiers', 'https://manuall.kr/household-appliances/humidifiers/', '가습기'),
    ('household-appliances/disinfection-cabinets', 'https://manuall.kr/household-appliances/disinfection-cabinets/', '감염 제거 캐비닛'),
    ('household-appliances/air-purifiers', 'https://manuall.kr/household-appliances/air-purifiers/', '공기 청정기'),
    ('household-appliances/kimchi-refrigerators', 'https://manuall.kr/household-appliances/kimchi-refrigerators/', '김치냉장고'),
    ('household-appliances/freezers', 'https://manuall.kr/household-appliances/freezers/', '냉동고'),
    ('household-appliances/refrigerators', 'https://manuall.kr/household-appliances/refrigerators/', '냉장고'),
    ('household-appliances/irons', 'https://manuall.kr/household-appliances/irons/', '다리미'),
    ('household-appliances/ironing-systems', 'https://manuall.kr/household-appliances/ironing-systems/', '다림질 시스템'),
    ('household-appliances/hobs', 'https://manuall.kr/household-appliances/hobs/', '레인지'),
    ('household-appliances/fan', 'https://manuall.kr/household-appliances/fan/', '선풍기'),
    ('household-appliances/fans', 'https://manuall.kr/household-appliances/fans/', '선풍기'),
    ('household-appliances/washing-machines', 'https://manuall.kr/household-appliances/washing-machines/', '세탁기'),
    ('household-appliances/washer-dryers', 'https://manuall.kr/household-appliances/washer-dryers/', '세탁기 겸 건조기'),
    ('household-appliances/soda-makers', 'https://manuall.kr/household-appliances/soda-makers/', '소다 제조기'),
    ('household-appliances/stacking-kits', 'https://manuall.kr/household-appliances/stacking-kits/', '스태킹 키트'),
    ('household-appliances/ranges', 'https://manuall.kr/household-appliances/ranges/', '스탠딩오븐'),
    ('household-appliances/steam-cleaners', 'https://manuall.kr/household-appliances/steam-cleaners/', '스팀 청소기'),
    ('household-appliances/dish-dryers', 'https://manuall.kr/household-appliances/dish-dryers/', '식기 건조기'),
    ('household-appliances/dishwashers', 'https://manuall.kr/household-appliances/dishwashers/', '식기 세척기'),
    ('household-appliances/fridge-freezers', 'https://manuall.kr/household-appliances/fridge-freezers/', '양문형 냉장고'),
    ('household-appliances/espresso-machines', 'https://manuall.kr/household-appliances/espresso-machines/', '에스프레소 머신'),
    ('household-appliances/air-conditioners', 'https://manuall.kr/household-appliances/air-conditioners/', '에어컨'),
    ('household-appliances/ovens', 'https://manuall.kr/household-appliances/ovens/', '오븐'),
    ('household-appliances/wine-cabinets', 'https://manuall.kr/household-appliances/wine-cabinets/', '와인 캐비닛'),
    ('household-appliances/warming-drawers', 'https://manuall.kr/household-appliances/warming-drawers/', '워밍 드로워'),
    ('household-appliances/water-dispensers', 'https://manuall.kr/household-appliances/water-dispensers/', '워터 디스펜서'),
    ('household-appliances/garment-steamers', 'https://manuall.kr/household-appliances/garment-steamers/', '의료용 스팀기'),
    ('household-appliances/dryers', 'https://manuall.kr/household-appliances/dryers/', '의류 건조기'),
    ('household-appliances/microwaves', 'https://manuall.kr/household-appliances/microwaves/', '전자렌지'),
    ('household-appliances/water-purifiers', 'https://manuall.kr/household-appliances/water-purifiers/', '정수기'),
    ('household-appliances/bread-makers', 'https://manuall.kr/household-appliances/bread-makers/', '제빵기'),
    ('household-appliances/dehumidifiers', 'https://manuall.kr/household-appliances/dehumidifiers/', '제습기'),
    ('household-appliances/kettles', 'https://manuall.kr/household-appliances/kettles/', '주전자'),
    ('household-appliances/vacuum-cleaners', 'https://manuall.kr/household-appliances/vacuum-cleaners/', '진공 청소기'),
    ('household-appliances/window-cleaners', 'https://manuall.kr/household-appliances/window-cleaners/', '창 클리너'),
    ('household-appliances/coffee-machines', 'https://manuall.kr/household-appliances/coffee-machines/', '커피 머신'),
    ('household-appliances/cooker-hoods', 'https://manuall.kr/household-appliances/cooker-hoods/', '쿠커 후드'),
    ('household-appliances/toasters', 'https://manuall.kr/household-appliances/toasters/', '토스터'),
    ('household-appliances/deep-fryers', 'https://manuall.kr/household-appliances/deep-fryers/', '튀김기'),
    ('household-appliances/tea-machines', 'https://manuall.kr/household-appliances/tea-machines/', '티 머신'),
    ('household-appliances/handheld-vacuums', 'https://manuall.kr/household-appliances/handheld-vacuums/', '휴대용 진공청소기'),
    ('household-appliances/heaters', 'https://manuall.kr/household-appliances/heaters/', '히터')
)
insert into source_categories (
  source_site_id,
  parent_id,
  source_url,
  source_slug_path,
  name,
  depth,
  category_kind,
  source_payload
)
select
  source_site.id,
  household_parent.id,
  household_source_categories.source_url,
  household_source_categories.source_slug_path,
  household_source_categories.name,
  2,
  'product_type',
  jsonb_build_object(
    'seed', true,
    'sourcePage', 'https://manuall.kr/household-appliances/'
  )
from source_site
cross join household_parent
join household_source_categories on true
on conflict (source_site_id, source_slug_path) do update set
  parent_id = excluded.parent_id,
  source_url = excluded.source_url,
  name = excluded.name,
  depth = excluded.depth,
  category_kind = excluded.category_kind,
  source_payload = source_categories.source_payload || excluded.source_payload;

with source_site as (
  select id
  from source_sites
  where name = 'Manuall KR'
),
mapping_rows(internal_slug_path, source_slug_path, confidence, mapping_status) as (
  values
    ('appliances/humidifier', 'household-appliances/humidifiers', 1.0, 'confirmed'),
    ('appliances/disinfection-cabinet', 'household-appliances/disinfection-cabinets', 1.0, 'confirmed'),
    ('appliances/air-purifier', 'household-appliances/air-purifiers', 1.0, 'confirmed'),
    ('appliances/kimchi-fridge', 'household-appliances/kimchi-refrigerators', 1.0, 'confirmed'),
    ('appliances/freezer', 'household-appliances/freezers', 1.0, 'confirmed'),
    ('appliances/refrigerator', 'household-appliances/refrigerators', 1.0, 'confirmed'),
    ('appliances/iron', 'household-appliances/irons', 1.0, 'confirmed'),
    ('appliances/ironing-system', 'household-appliances/ironing-systems', 1.0, 'confirmed'),
    ('appliances/range', 'household-appliances/hobs', 1.0, 'confirmed'),
    ('appliances/fan', 'household-appliances/fan', 1.0, 'confirmed'),
    ('appliances/fan', 'household-appliances/fans', 0.8, 'suggested'),
    ('appliances/washer', 'household-appliances/washing-machines', 1.0, 'confirmed'),
    ('appliances/washer-dryer', 'household-appliances/washer-dryers', 1.0, 'confirmed'),
    ('appliances/soda-maker', 'household-appliances/soda-makers', 1.0, 'confirmed'),
    ('appliances/stacking-kit', 'household-appliances/stacking-kits', 1.0, 'confirmed'),
    ('appliances/freestanding-oven', 'household-appliances/ranges', 1.0, 'confirmed'),
    ('appliances/steam-cleaner', 'household-appliances/steam-cleaners', 1.0, 'confirmed'),
    ('appliances/dish-dryer', 'household-appliances/dish-dryers', 1.0, 'confirmed'),
    ('appliances/dishwasher', 'household-appliances/dishwashers', 1.0, 'confirmed'),
    ('appliances/side-by-side-refrigerator', 'household-appliances/fridge-freezers', 1.0, 'confirmed'),
    ('appliances/espresso-machine', 'household-appliances/espresso-machines', 1.0, 'confirmed'),
    ('appliances/air-conditioner', 'household-appliances/air-conditioners', 1.0, 'confirmed'),
    ('appliances/oven', 'household-appliances/ovens', 1.0, 'confirmed'),
    ('appliances/wine-cabinet', 'household-appliances/wine-cabinets', 1.0, 'confirmed'),
    ('appliances/warming-drawer', 'household-appliances/warming-drawers', 1.0, 'confirmed'),
    ('appliances/water-dispenser', 'household-appliances/water-dispensers', 1.0, 'confirmed'),
    ('appliances/medical-steamer', 'household-appliances/garment-steamers', 0.8, 'suggested'),
    ('appliances/dryer', 'household-appliances/dryers', 1.0, 'confirmed'),
    ('appliances/dryer', 'household-appliances/clothes-dryers', 0.8, 'suggested'),
    ('appliances/microwave', 'household-appliances/microwaves', 1.0, 'confirmed'),
    ('appliances/water-purifier', 'household-appliances/water-purifiers', 1.0, 'confirmed'),
    ('appliances/bread-maker', 'household-appliances/bread-makers', 1.0, 'confirmed'),
    ('appliances/dehumidifier', 'household-appliances/dehumidifiers', 1.0, 'confirmed'),
    ('appliances/kettle', 'household-appliances/kettles', 1.0, 'confirmed'),
    ('appliances/vacuum', 'household-appliances/vacuum-cleaners', 1.0, 'confirmed'),
    ('appliances/window-cleaner', 'household-appliances/window-cleaners', 1.0, 'confirmed'),
    ('appliances/coffee-machine', 'household-appliances/coffee-machines', 1.0, 'confirmed'),
    ('appliances/cooker-hood', 'household-appliances/cooker-hoods', 1.0, 'confirmed'),
    ('appliances/toaster', 'household-appliances/toasters', 1.0, 'confirmed'),
    ('appliances/deep-fryer', 'household-appliances/deep-fryers', 1.0, 'confirmed'),
    ('appliances/tea-machine', 'household-appliances/tea-machines', 1.0, 'confirmed'),
    ('appliances/handheld-vacuum', 'household-appliances/handheld-vacuums', 1.0, 'confirmed'),
    ('appliances/heater', 'household-appliances/heaters', 1.0, 'confirmed')
)
insert into category_source_mappings (
  category_id,
  source_category_id,
  confidence,
  mapping_status
)
select
  categories.id,
  source_categories.id,
  mapping_rows.confidence,
  mapping_rows.mapping_status
from mapping_rows
join categories on categories.slug_path = mapping_rows.internal_slug_path
join source_site on true
join source_categories
  on source_categories.source_site_id = source_site.id
  and source_categories.source_slug_path = mapping_rows.source_slug_path
on conflict (category_id, source_category_id) do update set
  confidence = excluded.confidence,
  mapping_status = excluded.mapping_status;
