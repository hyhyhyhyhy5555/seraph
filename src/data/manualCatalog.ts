export type Manual = {
  id: string;
  title: string;
  manufacturer: string;
  model: string;
  categoryPath: string[];
  summary: string;
  sourceUrl: string;
  pdfUrl: string;
};

export type DetailCategory = {
  id: string;
  name: string;
  manualIds: string[];
};

export type SubCategory = {
  id: string;
  name: string;
  details: DetailCategory[];
};

export type MajorCategory = {
  id: string;
  name: string;
  description: string;
  subcategories: SubCategory[];
};

export const manuals: Manual[] = [
  {
    id: "boneco-u350",
    title: "Boneco U350 가습기 사용 설명서",
    manufacturer: "Boneco",
    model: "U350",
    categoryPath: ["가전", "가습기", "Boneco"],
    summary: "물통 세척, 습도 조절, 필터 교체 주기, 에러 표시를 확인할 수 있는 설명서입니다.",
    sourceUrl: "https://example.com/manuals/boneco-u350",
    pdfUrl: "https://example.com/manuals/boneco-u350.pdf"
  },
  {
    id: "lg-whisen-ac",
    title: "LG 휘센 에어컨 기본 사용 설명서",
    manufacturer: "LG",
    model: "WHISEN",
    categoryPath: ["가전", "에어컨", "LG"],
    summary: "냉방, 제습, 자동 청소, 필터 관리, 리모컨 설정을 다룹니다.",
    sourceUrl: "https://example.com/manuals/lg-whisen",
    pdfUrl: "https://example.com/manuals/lg-whisen.pdf"
  },
  {
    id: "samsung-bespoke-washer",
    title: "삼성 Bespoke 세탁기 사용자 매뉴얼",
    manufacturer: "삼성",
    model: "Bespoke Washer",
    categoryPath: ["가전", "세탁기", "삼성"],
    summary: "표준 세탁, AI 맞춤 코스, 세제함 관리, 통세척, 오류 코드 안내를 포함합니다.",
    sourceUrl: "https://example.com/manuals/samsung-bespoke-washer",
    pdfUrl: "https://example.com/manuals/samsung-bespoke-washer.pdf"
  },
  {
    id: "cuckoo-water-purifier",
    title: "쿠쿠 정수기 설치 및 사용 설명서",
    manufacturer: "쿠쿠",
    model: "CP Series",
    categoryPath: ["가전", "정수기", "쿠쿠"],
    summary: "필터 교체, 온수 잠금, 출수량 설정, 살균 모드 사용법을 정리한 설명서입니다.",
    sourceUrl: "https://example.com/manuals/cuckoo-water-purifier",
    pdfUrl: "https://example.com/manuals/cuckoo-water-purifier.pdf"
  },
  {
    id: "dyson-vacuum",
    title: "다이슨 무선 진공 청소기 사용 설명서",
    manufacturer: "다이슨",
    model: "V Series",
    categoryPath: ["가전", "진공 청소기", "다이슨"],
    summary: "충전, 먼지통 비우기, 필터 세척, 흡입 모드와 브러시 관리 방법을 제공합니다.",
    sourceUrl: "https://example.com/manuals/dyson-vacuum",
    pdfUrl: "https://example.com/manuals/dyson-vacuum.pdf"
  },
  {
    id: "samsung-galaxy",
    title: "삼성 Galaxy 스마트폰 빠른 시작 설명서",
    manufacturer: "삼성",
    model: "Galaxy",
    categoryPath: ["디지털/모바일", "스마트폰", "삼성"],
    summary: "초기 설정, 계정 이전, 보안 잠금, 배터리 관리, 백업 방법을 다룹니다.",
    sourceUrl: "https://example.com/manuals/samsung-galaxy",
    pdfUrl: "https://example.com/manuals/samsung-galaxy.pdf"
  }
];

function emptySubcategory(id: string, name: string): SubCategory {
  return {
    id,
    name,
    details: []
  };
}

export const catalog: MajorCategory[] = [
  {
    id: "appliances",
    name: "가전",
    description: "생활 가전, 주방 가전, 청소기, 냉난방 기기 설명서",
    subcategories: [
      {
        id: "humidifier",
        name: "가습기",
        details: [
          { id: "air-venti", name: "Air Venti", manualIds: [] },
          { id: "boneco", name: "Boneco", manualIds: ["boneco-u350"] },
          { id: "eclear", name: "Eclear", manualIds: [] },
          { id: "muji", name: "무인양품", manualIds: [] },
          { id: "winix", name: "위닉스", manualIds: [] },
          { id: "cuckoo", name: "쿠쿠", manualIds: [] },
          { id: "lg", name: "LG", manualIds: [] },
          { id: "samsung", name: "삼성", manualIds: [] }
        ]
      },
      emptySubcategory("disinfection-cabinet", "감염 제거 캐비닛"),
      {
        id: "air-purifier",
        name: "공기 청정기",
        details: [
          { id: "coway", name: "코웨이", manualIds: [] },
          { id: "winix", name: "위닉스", manualIds: [] },
          { id: "lg", name: "LG", manualIds: [] },
          { id: "samsung", name: "삼성", manualIds: [] }
        ]
      },
      {
        id: "kimchi-fridge",
        name: "김치냉장고",
        details: [
          { id: "dimchae", name: "딤채", manualIds: [] },
          { id: "lg", name: "LG", manualIds: [] },
          { id: "samsung", name: "삼성", manualIds: [] }
        ]
      },
      {
        id: "freezer",
        name: "냉동고",
        details: [
          { id: "lg", name: "LG", manualIds: [] },
          { id: "samsung", name: "삼성", manualIds: [] },
          { id: "carrier", name: "캐리어", manualIds: [] }
        ]
      },
      {
        id: "refrigerator",
        name: "냉장고",
        details: [
          { id: "lg", name: "LG", manualIds: [] },
          { id: "samsung", name: "삼성", manualIds: [] },
          { id: "winia", name: "위니아", manualIds: [] }
        ]
      },
      {
        id: "iron",
        name: "다리미",
        details: [
          { id: "philips", name: "필립스", manualIds: [] },
          { id: "tefal", name: "테팔", manualIds: [] },
          { id: "hanil", name: "한일전기", manualIds: [] }
        ]
      },
      emptySubcategory("ironing-system", "다림질 시스템"),
      {
        id: "range",
        name: "레인지",
        details: [
          { id: "sk-magic", name: "SK매직", manualIds: [] },
          { id: "cuckoo", name: "쿠쿠", manualIds: [] },
          { id: "samsung", name: "삼성", manualIds: [] }
        ]
      },
      {
        id: "fan",
        name: "선풍기",
        details: [
          { id: "shinil", name: "신일", manualIds: [] },
          { id: "hanil", name: "한일전기", manualIds: [] },
          { id: "emk", name: "EMK", manualIds: [] }
        ]
      },
      {
        id: "washer",
        name: "세탁기",
        details: [
          { id: "samsung", name: "삼성", manualIds: ["samsung-bespoke-washer"] },
          { id: "lg", name: "LG", manualIds: [] },
          { id: "winia", name: "위니아", manualIds: [] },
          { id: "midea", name: "미디어", manualIds: [] }
        ]
      },
      emptySubcategory("washer-dryer", "세탁기 겸 건조기"),
      emptySubcategory("soda-maker", "소다 제조기"),
      emptySubcategory("stacking-kit", "스태킹 키트"),
      emptySubcategory("freestanding-oven", "스탠딩오븐"),
      emptySubcategory("steam-cleaner", "스팀 청소기"),
      emptySubcategory("dish-dryer", "식기 건조기"),
      emptySubcategory("dishwasher", "식기 세척기"),
      emptySubcategory("side-by-side-refrigerator", "양문형 냉장고"),
      emptySubcategory("espresso-machine", "에스프레소 머신"),
      {
        id: "dryer",
        name: "의류 건조기",
        details: [
          { id: "lg", name: "LG", manualIds: [] },
          { id: "samsung", name: "삼성", manualIds: [] },
          { id: "electrolux", name: "일렉트로룩스", manualIds: [] }
        ]
      },
      emptySubcategory("oven", "오븐"),
      emptySubcategory("wine-cabinet", "와인 캐비닛"),
      emptySubcategory("warming-drawer", "워밍 드로워"),
      emptySubcategory("water-dispenser", "워터 디스펜서"),
      emptySubcategory("medical-steamer", "의료용 스팀기"),
      {
        id: "microwave",
        name: "전자렌지",
        details: [
          { id: "samsung", name: "삼성", manualIds: [] },
          { id: "lg", name: "LG", manualIds: [] },
          { id: "cuchen", name: "쿠첸", manualIds: [] },
          { id: "sk-magic", name: "SK매직", manualIds: [] }
        ]
      },
      {
        id: "water-purifier",
        name: "정수기",
        details: [
          { id: "cuckoo", name: "쿠쿠", manualIds: ["cuckoo-water-purifier"] },
          { id: "coway", name: "코웨이", manualIds: [] },
          { id: "chungho", name: "청호나이스", manualIds: [] }
        ]
      },
      emptySubcategory("bread-maker", "제빵기"),
      {
        id: "dehumidifier",
        name: "제습기",
        details: [
          { id: "winix", name: "위닉스", manualIds: [] },
          { id: "lg", name: "LG", manualIds: [] },
          { id: "carrier", name: "캐리어", manualIds: [] }
        ]
      },
      emptySubcategory("kettle", "주전자"),
      {
        id: "vacuum",
        name: "진공 청소기",
        details: [
          { id: "dyson", name: "다이슨", manualIds: ["dyson-vacuum"] },
          { id: "lg", name: "LG", manualIds: [] },
          { id: "samsung", name: "삼성", manualIds: [] }
        ]
      },
      emptySubcategory("window-cleaner", "창 클리너"),
      {
        id: "coffee-machine",
        name: "커피 머신",
        details: [
          { id: "delonghi", name: "드롱기", manualIds: [] },
          { id: "nespresso", name: "네스프레소", manualIds: [] },
          { id: "philips", name: "필립스", manualIds: [] }
        ]
      },
      emptySubcategory("cooker-hood", "쿠커 후드"),
      emptySubcategory("toaster", "토스터"),
      emptySubcategory("deep-fryer", "튀김기"),
      emptySubcategory("tea-machine", "티 머신"),
      emptySubcategory("handheld-vacuum", "휴대용 진공청소기"),
      {
        id: "air-conditioner",
        name: "에어컨",
        details: [
          { id: "lg", name: "LG", manualIds: ["lg-whisen-ac"] },
          { id: "samsung", name: "삼성", manualIds: [] },
          { id: "carrier", name: "캐리어", manualIds: [] },
          { id: "winia", name: "위니아", manualIds: [] }
        ]
      },
      emptySubcategory("heater", "히터")
    ]
  },
  {
    id: "digital",
    name: "디지털/모바일",
    description: "스마트폰, 태블릿, 웨어러블, 카메라 설명서",
    subcategories: [
      {
        id: "smartphone",
        name: "스마트폰",
        details: [
          { id: "samsung", name: "삼성", manualIds: ["samsung-galaxy"] },
          { id: "apple", name: "Apple", manualIds: [] },
          { id: "xiaomi", name: "샤오미", manualIds: [] }
        ]
      },
      {
        id: "tablet",
        name: "태블릿",
        details: [
          { id: "apple", name: "Apple", manualIds: [] },
          { id: "samsung", name: "삼성", manualIds: [] },
          { id: "lenovo", name: "Lenovo", manualIds: [] }
        ]
      },
      {
        id: "camera",
        name: "카메라",
        details: [
          { id: "canon", name: "Canon", manualIds: [] },
          { id: "sony", name: "Sony", manualIds: [] },
          { id: "nikon", name: "Nikon", manualIds: [] }
        ]
      }
    ]
  },
  {
    id: "tv-audio",
    name: "TV/음향",
    description: "TV, 사운드바, 스피커, 이어폰 설명서",
    subcategories: [
      {
        id: "tv",
        name: "TV",
        details: [
          { id: "lg", name: "LG", manualIds: [] },
          { id: "samsung", name: "삼성", manualIds: [] },
          { id: "sony", name: "Sony", manualIds: [] }
        ]
      },
      {
        id: "soundbar",
        name: "사운드바",
        details: [
          { id: "jbl", name: "JBL", manualIds: [] },
          { id: "lg", name: "LG", manualIds: [] },
          { id: "samsung", name: "삼성", manualIds: [] }
        ]
      }
    ]
  },
  {
    id: "computer",
    name: "컴퓨터/주변기기",
    description: "노트북, 모니터, 프린터, 공유기 설명서",
    subcategories: [
      {
        id: "laptop",
        name: "노트북",
        details: [
          { id: "lg", name: "LG", manualIds: [] },
          { id: "samsung", name: "삼성", manualIds: [] },
          { id: "lenovo", name: "Lenovo", manualIds: [] }
        ]
      },
      {
        id: "printer",
        name: "프린터",
        details: [
          { id: "hp", name: "HP", manualIds: [] },
          { id: "canon", name: "Canon", manualIds: [] },
          { id: "epson", name: "Epson", manualIds: [] }
        ]
      }
    ]
  }
];

export function findManualById(id: string) {
  return manuals.find((manual) => manual.id === id);
}

export function searchManuals(query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return [];
  }

  return manuals.filter((manual) => {
    const haystack = [
      manual.title,
      manual.manufacturer,
      manual.model,
      manual.summary,
      ...manual.categoryPath
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}
