"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";

type Screen = "title" | "briefing" | "playing" | "paused" | "levelClear" | "gameOver" | "ending";
type Point = { x: number; y: number };
type Rect = Point & { w: number; h: number };
type Target = Point & { label: string };
type Difficulty = "입문" | "보통" | "어려움" | "악몽" | "전설";
type Room = {
  id: string;
  level: string;
  zone: string;
  title: string;
  player: string;
  playerCode: string;
  image: string;
  background: string;
  photoCredit: string;
  photoSource: string;
  accent: string;
  floor: string;
  wall: string;
  description: string;
  objective: string;
  danger: string;
  quote: string;
  skill: string;
  skillDetail: string;
  targets: Target[];
  walls: Rect[];
  start: Point;
  ballStart: Point;
  goal: Rect;
  npc: Point;
  chaserSpeed: number;
  chaserDelay: number;
  maxShadows: number;
  shadowSpawnInterval: number;
  targetRadius: number;
  difficulty: Difficulty;
};

type Particle = Point & { vx: number; vy: number; life: number; color: string };
type ShadowReferee = Point & { id: number };
type WorldState = {
  player: Point & { facingX: number; facingY: number };
  ball: Point & { vx: number; vy: number };
  shadows: ShadowReferee[];
  nextShadowSpawnAt: number;
  shadowSerial: number;
  shadowsDefeated: number;
  targetIndex: number;
  roomSeconds: number;
  lastFrame: number;
  stamina: number;
  invulnerableUntil: number;
  shake: number;
  clearTriggered: boolean;
  particles: Particle[];
};

const WORLD_W = 1000;
const WORLD_H = 600;
const assetPath = (path: string) =>
  `${import.meta.env.BASE_URL}${path.replace(/^\/+/, "")}`;

const ROOMS: Room[] = [
  {
    id: "gohan",
    level: "LEVEL 01",
    zone: "나전역 무한 대합실",
    title: "신호 드리블",
    player: "라민 야말",
    playerCode: "YAMAL · 27",
    image: assetPath("/assets/characters/lamine-yamal.png"),
    background: assetPath("/assets/backgrounds/room-01-najeon.jpg"),
    photoCredit: "나전역카페",
    photoSource: "https://www.jeongseon.go.kr/tour/travelinformation/photo_travel?articleSeq=244692",
    accent: "#b55cff",
    floor: "#15141b",
    wall: "#38333f",
    description: "간이역 시계가 같은 시각만 반복한다. 첫 신호 하나를 공으로 깨우면 닫힌 승강장이 잠깐 열린다.",
    objective: "빛나는 신호 링 1개를 통과한 뒤 EXIT 골대에 골인",
    danger: "연습 구간: 그림자 심판이 등장하지 않습니다.",
    quote: "공은 발보다 먼저 길을 기억해. 시선을 들고, 신호를 이어 줘.",
    skill: "팬텀 터치",
    skillDetail: "볼 컨트롤 반경이 넓어지고 다음 방부터 슛 연결이 쉬워집니다.",
    targets: [{ x: 178, y: 158, label: "01" }],
    walls: [
      { x: 275, y: 45, w: 34, h: 245 }, { x: 275, y: 410, w: 34, h: 145 },
      { x: 535, y: 120, w: 34, h: 315 }, { x: 785, y: 45, w: 34, h: 250 },
    ],
    start: { x: 82, y: 330 }, ballStart: { x: 132, y: 330 }, goal: { x: 946, y: 235, w: 26, h: 130 }, npc: { x: 872, y: 145 },
    chaserSpeed: 0, chaserDelay: 999, maxShadows: 0, shadowSpawnInterval: 999, targetRadius: 52, difficulty: "입문",
  },
  {
    id: "sabuk",
    level: "LEVEL 02",
    zone: "사북 탄광 슛 터널",
    title: "압력 해제",
    player: "엘링 홀란",
    playerCode: "HAALAND · 09",
    image: assetPath("/assets/characters/erling-haaland.png"),
    background: assetPath("/assets/backgrounds/room-02-sabuk-coal.jpg"),
    photoCredit: "사북석탄유물보존관",
    photoSource: "https://www.jeongseon.go.kr/tour/jeongseontour/attractions?contentSeq=161129&mode=read",
    accent: "#58e7ff",
    floor: "#10191a",
    wall: "#2d4244",
    description: "탄차 레일 아래 압력이 차오른다. 공을 강하게 차서 첫 압력계를 깨우면 터널의 환기구가 열린다.",
    objective: "충전 슛으로 압력계 1개를 작동시키고 환기구 골대에 골인",
    danger: "심판은 아직 없습니다. SPACE를 길게 눌렀다 떼어 충전 슛을 익히세요.",
    quote: "겁내지 마. 벽이 단단하면 더 강하게 차면 돼. 단, 방향은 네가 정해.",
    skill: "광맥 스트라이크",
    skillDetail: "최대 슛 파워가 상승해 멀리 있는 장치를 노릴 수 있습니다.",
    targets: [{ x: 220, y: 115, label: "P1" }],
    walls: [
      { x: 175, y: 250, w: 235, h: 32 }, { x: 375, y: 65, w: 32, h: 130 },
      { x: 605, y: 245, w: 32, h: 310 }, { x: 745, y: 165, w: 190, h: 30 },
    ],
    start: { x: 82, y: 480 }, ballStart: { x: 132, y: 480 }, goal: { x: 946, y: 235, w: 26, h: 130 }, npc: { x: 870, y: 142 },
    chaserSpeed: 0, chaserDelay: 999, maxShadows: 0, shadowSpawnInterval: 999, targetRadius: 50, difficulty: "입문",
  },
  {
    id: "var",
    level: "LEVEL 03",
    zone: "정선아리랑열차 VAR 복도",
    title: "멈춘 프리킥",
    player: "크리스티아누 호날두",
    playerCode: "RONALDO · 07",
    image: assetPath("/assets/characters/cristiano-ronaldo.png"),
    background: assetPath("/assets/backgrounds/room-03-arirang-train.jpg"),
    photoCredit: "정선아리랑열차",
    photoSource: "https://www.jeongseon.go.kr/tour/jeongseontour/attractions?contentSeq=161700&mode=read",
    accent: "#ff4a53",
    floor: "#1b1212",
    wall: "#493032",
    description: "판정 화면마다 다른 출구가 재생된다. 빨간 타깃을 정확히 맞혀 거짓 화면을 하나씩 꺼야 한다.",
    objective: "번호 타깃 2개를 정확히 맞히고 판정실 골대에 골인",
    danger: "18초 뒤 첫 그림자 심판 1명이 등장합니다. 강한 슛 한 번으로 퇴장시킬 수 있습니다.",
    quote: "완벽한 각도는 기다리는 게 아니야. 숨을 고르고, 네가 만들어.",
    skill: "데드볼 포커스",
    skillDetail: "타깃 판정 범위가 커져 좁은 복도에서도 정밀 슛이 쉬워집니다.",
    targets: [{ x: 205, y: 445, label: "7A" }, { x: 495, y: 145, label: "7B" }],
    walls: [
      { x: 255, y: 80, w: 34, h: 295 }, { x: 415, y: 310, w: 260, h: 30 },
      { x: 690, y: 65, w: 34, h: 220 }, { x: 825, y: 335, w: 115, h: 30 },
    ],
    start: { x: 84, y: 130 }, ballStart: { x: 134, y: 130 }, goal: { x: 946, y: 235, w: 26, h: 130 }, npc: { x: 860, y: 135 },
    chaserSpeed: 45, chaserDelay: 18, maxShadows: 1, shadowSpawnInterval: 999, targetRadius: 48, difficulty: "보통",
  },
  {
    id: "auraji",
    level: "LEVEL 04",
    zone: "아우라지 양발 교차로",
    title: "두 갈래의 답",
    player: "손흥민",
    playerCode: "SON · 07",
    image: assetPath("/assets/characters/son-heung-min.png"),
    background: assetPath("/assets/backgrounds/room-04-auraji.jpg"),
    photoCredit: "아우라지",
    photoSource: "https://www.jeongseon.go.kr/tour/jeongseontour/attractions?contentSeq=289&mode=read",
    accent: "#ffd858",
    floor: "#151712",
    wall: "#3f4234",
    description: "두 물길처럼 갈라진 복도가 계속 자리를 바꾼다. 왼쪽과 오른쪽을 번갈아 연결해야 길이 하나가 된다.",
    objective: "금빛 방향 표식 2개를 순서대로 깨우고 합류점 골대에 골인",
    danger: "그림자 심판 1명이 16초 뒤 등장하고, 퇴장 후 34초가 지나면 다시 나타납니다.",
    quote: "어느 발이든 괜찮아. 중요한 건 다음 길을 미리 보는 거야. 같이 나가자.",
    skill: "양발 나침반",
    skillDetail: "질주 효율이 올라가고 스태미나 회복이 빨라집니다.",
    targets: [{ x: 190, y: 140, label: "L" }, { x: 495, y: 475, label: "R" }],
    walls: [
      { x: 205, y: 245, w: 195, h: 30 }, { x: 370, y: 65, w: 30, h: 130 },
      { x: 555, y: 240, w: 30, h: 315 }, { x: 725, y: 255, w: 210, h: 30 },
    ],
    start: { x: 84, y: 470 }, ballStart: { x: 134, y: 470 }, goal: { x: 946, y: 235, w: 26, h: 130 }, npc: { x: 865, y: 135 },
    chaserSpeed: 50, chaserDelay: 16, maxShadows: 1, shadowSpawnInterval: 34, targetRadius: 46, difficulty: "보통",
  },
  {
    id: "mindungsan",
    level: "LEVEL 05",
    zone: "여량 천년의숲 페인트 미로",
    title: "깊은 속임수",
    player: "네이마르 주니오르",
    playerCode: "NEYMAR · 10",
    image: assetPath("/assets/characters/neymar-jr.png"),
    background: assetPath("/assets/backgrounds/room-05-cheonnyeon-forest.jpg"),
    photoCredit: "여량면 천년의숲",
    photoSource: "https://www.jeongseon.go.kr/tour/travelinformation/photo_travel?articleSeq=291398",
    accent: "#56f38b",
    floor: "#0f1912",
    wall: "#2f4a38",
    description: "잔디 냄새가 나는 복도 끝에서 가짜 출구들이 웃는다. 초록 잔상을 따라가며 더 깊은 백룸으로 통하는 휘슬을 찾아야 한다.",
    objective: "페인트 표식 2개를 돌파하고 숲길 골대에 골인",
    danger: "그림자 심판 1명이 14초 뒤 등장하며 27초 간격으로 다시 추격합니다.",
    quote: "미로가 널 속이면, 한 번 더 속여 줘. 마지막 움직임까지 즐기는 사람이 이겨.",
    skill: "아리랑 페인트",
    skillDetail: "다섯 번째 축구 기억이 깨어나며 더 깊은 고원의 백룸으로 가는 문이 열립니다.",
    targets: [{ x: 235, y: 465, label: "N1" }, { x: 505, y: 125, label: "N2" }],
    walls: [
      { x: 165, y: 75, w: 30, h: 300 }, { x: 335, y: 315, w: 250, h: 30 },
      { x: 535, y: 65, w: 30, h: 190 }, { x: 705, y: 210, w: 30, h: 345 },
      { x: 845, y: 75, w: 95, h: 30 },
    ],
    start: { x: 82, y: 120 }, ballStart: { x: 132, y: 120 }, goal: { x: 946, y: 235, w: 26, h: 130 }, npc: { x: 855, y: 135 },
    chaserSpeed: 55, chaserDelay: 14, maxShadows: 1, shadowSpawnInterval: 27, targetRadius: 44, difficulty: "보통",
  },
  {
    id: "high1",
    level: "LEVEL 06",
    zone: "눈 쌓인 사북 페널티 리프트",
    title: "빙점 피니시",
    player: "해리 케인",
    playerCode: "KANE · 09",
    image: assetPath("/assets/characters/harry-kane.png"),
    background: assetPath("/assets/backgrounds/room-06-sabuk-snow.jpg"),
    photoCredit: "눈 쌓인 사북읍",
    photoSource: "https://www.jeongseon.go.kr/tour/travelinformation/photo_travel?articleSeq=269371",
    accent: "#ff914d",
    floor: "#17181c",
    wall: "#3b3f49",
    description: "멈춘 리프트 아래 하얀 복도가 기울어진다. 페널티 지점마다 공을 멈춰 세워야 눈보라 속 다음 승강기가 나타난다.",
    objective: "주황 페널티 마크 3개를 맞히고 리프트 골대에 골인",
    danger: "표식이 3개로 늘고 심판 1명이 12초 뒤, 이후 23초 간격으로 등장합니다.",
    quote: "서두르지 마. 마지막 한 걸음에서 균형을 잡으면 가장 차가운 방도 뚫을 수 있어.",
    skill: "설원 피니시",
    skillDetail: "충전 슛의 마지막 순간을 안정시켜 좁은 표식도 침착하게 노릴 수 있습니다.",
    targets: [{ x: 205, y: 125, label: "K1" }, { x: 485, y: 455, label: "K2" }, { x: 785, y: 145, label: "K3" }],
    walls: [
      { x: 255, y: 70, w: 30, h: 250 }, { x: 420, y: 355, w: 230, h: 30 },
      { x: 605, y: 70, w: 30, h: 220 }, { x: 775, y: 250, w: 160, h: 30 },
    ],
    start: { x: 82, y: 470 }, ballStart: { x: 132, y: 470 }, goal: { x: 946, y: 235, w: 26, h: 130 }, npc: { x: 870, y: 140 },
    chaserSpeed: 60, chaserDelay: 12, maxShadows: 1, shadowSpawnInterval: 23, targetRadius: 42, difficulty: "어려움",
  },
  {
    id: "hwanam",
    level: "LEVEL 07",
    zone: "화암동굴 세이브 벙커",
    title: "마지막 선방",
    player: "에밀리아노 마르티네스",
    playerCode: "MARTÍNEZ · 23",
    image: assetPath("/assets/characters/emiliano-martinez.png"),
    background: assetPath("/assets/backgrounds/room-07-hwaam-cave.jpg"),
    photoCredit: "화암동굴",
    photoSource: "https://www.jeongseon.go.kr/tour/jeongseontour/attractions?contentSeq=290&mode=read",
    accent: "#42d9ff",
    floor: "#10191c",
    wall: "#2a444c",
    description: "동굴 벽에 수백 개의 골문이 떠오르고 사라진다. 푸른 세이브 존에 공을 보내 가짜 골문을 하나씩 봉인해야 한다.",
    objective: "세이브 존 3개를 공으로 봉인하고 광맥 골대에 골인",
    danger: "심판 1명이 11초 뒤, 이후 20초 간격으로 등장합니다. 공과 멀어지면 더 빨라집니다.",
    quote: "공포가 슛 방향을 알려 줄 때가 있어. 끝까지 보고, 네 골문을 지켜.",
    skill: "골라인 본능",
    skillDetail: "공과 그림자 심판의 위치를 빠르게 읽어 위기에서 탈출할 여유가 생깁니다.",
    targets: [{ x: 185, y: 145, label: "G1" }, { x: 500, y: 465, label: "G2" }, { x: 775, y: 135, label: "G3" }],
    walls: [
      { x: 250, y: 240, w: 210, h: 30 }, { x: 430, y: 55, w: 30, h: 135 },
      { x: 590, y: 245, w: 30, h: 310 }, { x: 740, y: 200, w: 195, h: 30 },
    ],
    start: { x: 82, y: 470 }, ballStart: { x: 132, y: 470 }, goal: { x: 946, y: 235, w: 26, h: 130 }, npc: { x: 865, y: 135 },
    chaserSpeed: 65, chaserDelay: 11, maxShadows: 1, shadowSpawnInterval: 20, targetRadius: 40, difficulty: "어려움",
  },
  {
    id: "arirang",
    level: "LEVEL 08",
    zone: "아리랑박물관 곡선 복도",
    title: "왼발의 궤적",
    player: "리오넬 메시",
    playerCode: "MESSI · 10",
    image: assetPath("/assets/characters/lionel-messi.png"),
    background: assetPath("/assets/backgrounds/room-08-arirang-museum.jpg"),
    photoCredit: "아리랑박물관",
    photoSource: "https://www.jeongseon.go.kr/tour/jeongseontour/attractions?contentSeq=165197&mode=read",
    accent: "#64a6ff",
    floor: "#111621",
    wall: "#313d55",
    description: "아리랑 선율이 휘어진 터널을 따라 되감긴다. 직선 슛은 사라지고, 짧은 드리블로 곡선의 중심을 찾아야 한다.",
    objective: "푸른 궤적 표식 3개를 잇고 메아리 골대에 골인",
    danger: "여기서부터 그림자 심판이 최대 2명입니다. 10초 뒤 첫 등장, 19초마다 추가됩니다.",
    quote: "큰 공간은 필요 없어. 공과 한 걸음만 있으면 길은 네 쪽으로 휘어져.",
    skill: "아리랑 드리블",
    skillDetail: "좁은 틈에서 공을 가까이 두고 방향을 바꾸는 감각이 완성됩니다.",
    targets: [{ x: 225, y: 445, label: "M1" }, { x: 470, y: 125, label: "M2" }, { x: 785, y: 445, label: "M3" }],
    walls: [
      { x: 170, y: 70, w: 30, h: 310 }, { x: 360, y: 325, w: 250, h: 30 },
      { x: 560, y: 55, w: 30, h: 210 }, { x: 720, y: 255, w: 30, h: 300 },
    ],
    start: { x: 82, y: 120 }, ballStart: { x: 132, y: 120 }, goal: { x: 946, y: 235, w: 26, h: 130 }, npc: { x: 860, y: 135 },
    chaserSpeed: 69, chaserDelay: 10, maxShadows: 2, shadowSpawnInterval: 19, targetRadius: 39, difficulty: "어려움",
  },
  {
    id: "eoksae",
    level: "LEVEL 09",
    zone: "민둥산 억새 윙",
    title: "속도의 잔상",
    player: "비니시우스 주니오르",
    playerCode: "VINI JR · 07",
    image: assetPath("/assets/characters/vinicius-junior.png"),
    background: assetPath("/assets/backgrounds/room-09-mindungsan.jpg"),
    photoCredit: "민둥산등산로",
    photoSource: "https://www.jeongseon.go.kr/tour/jeongseontour/attractions?contentSeq=163361&mode=read",
    accent: "#ff4fd8",
    floor: "#19111a",
    wall: "#4b3047",
    description: "검은 억새가 터치라인처럼 솟아 길을 잘라 낸다. 분홍 잔상이 사라지기 전에 반대편 윙으로 공을 전환해야 한다.",
    objective: "윙 표식 4개를 빠르게 전환하고 억새 골대에 골인",
    danger: "표식 4개, 심판 최대 2명. 9초 뒤 등장하고 17초 간격으로 인원이 보충됩니다.",
    quote: "막힌 쪽만 보지 마. 한 번 웃고 방향을 바꾸면 수비도 미로도 늦어져.",
    skill: "고원 스프린트",
    skillDetail: "후반 방에서도 질주와 방향 전환을 이어 갈 수 있는 속도의 기억이 깨어납니다.",
    targets: [{ x: 205, y: 120, label: "V1" }, { x: 505, y: 470, label: "V2" }, { x: 800, y: 125, label: "V3" }, { x: 790, y: 500, label: "V4" }],
    walls: [
      { x: 260, y: 65, w: 30, h: 305 }, { x: 430, y: 315, w: 270, h: 30 },
      { x: 650, y: 65, w: 30, h: 195 }, { x: 815, y: 250, w: 125, h: 30 },
    ],
    start: { x: 82, y: 470 }, ballStart: { x: 132, y: 470 }, goal: { x: 946, y: 235, w: 26, h: 130 }, npc: { x: 865, y: 135 },
    chaserSpeed: 73, chaserDelay: 9, maxShadows: 2, shadowSpawnInterval: 17, targetRadius: 38, difficulty: "악몽",
  },
  {
    id: "stadium",
    level: "LEVEL 10",
    zone: "아라리촌 90+5",
    title: "이어지는 추가시간",
    player: "주드 벨링엄",
    playerCode: "BELLINGHAM · 05",
    image: assetPath("/assets/characters/jude-bellingham.png"),
    background: assetPath("/assets/backgrounds/room-10-ararichon.jpg"),
    photoCredit: "아라리촌",
    photoSource: "https://www.jeongseon.go.kr/tour/travelinformation/photo_travel?articleSeq=213735",
    accent: "#e7c35a",
    floor: "#15140f",
    wall: "#484131",
    description: "빈 전통마을의 전광판이 90+5에서 멈췄다. 앞선 기억을 연결해 네 번의 패스를 완성해야 더 깊은 출구가 열린다.",
    objective: "추가시간 표식 4개를 깨우고 아라리촌 골대에 골인",
    danger: "심판 최대 2명이 8초 뒤부터 15초 간격으로 등장합니다. 강한 슛으로 공간을 만드세요.",
    quote: "끝났다고 느낀 순간이 우리 시간의 시작이야. 고개를 들고 마지막 패스를 줘.",
    skill: "추가시간의 심장",
    skillDetail: "열 번째 축구 기억이 이어져 병방치 너머의 마지막 네 방으로 가는 문이 열립니다.",
    targets: [{ x: 215, y: 450, label: "J1" }, { x: 500, y: 120, label: "J2" }, { x: 785, y: 430, label: "J3" }, { x: 845, y: 120, label: "J4" }],
    walls: [
      { x: 165, y: 65, w: 30, h: 300 }, { x: 335, y: 315, w: 250, h: 30 },
      { x: 535, y: 65, w: 30, h: 190 }, { x: 705, y: 210, w: 30, h: 345 },
      { x: 845, y: 75, w: 95, h: 30 },
    ],
    start: { x: 82, y: 120 }, ballStart: { x: 132, y: 120 }, goal: { x: 946, y: 235, w: 26, h: 130 }, npc: { x: 855, y: 135 },
    chaserSpeed: 77, chaserDelay: 8, maxShadows: 2, shadowSpawnInterval: 15, targetRadius: 37, difficulty: "악몽",
  },
  {
    id: "byungbang",
    level: "LEVEL 11",
    zone: "병방치 스피드 전망대",
    title: "절벽 끝 가속",
    player: "킬리안 음바페",
    playerCode: "MBAPPÉ · 10",
    image: assetPath("/assets/characters/kylian-mbappe.png"),
    background: assetPath("/assets/backgrounds/room-11-skywalk.jpg"),
    photoCredit: "아리힐스-스카이워크",
    photoSource: "https://www.jeongseon.go.kr/tour/jeongseontour/attractions?contentSeq=314&mode=read",
    accent: "#4b8dff",
    floor: "#101622",
    wall: "#30405a",
    description: "유리 전망대 아래로 동강의 굽이가 끝없이 되감긴다. 사라지는 청색 게이트 네 곳을 속도로 잇고 절벽 반대편으로 탈출해야 한다.",
    objective: "스피드 게이트 4개를 잇고 전망대 EXIT 골대에 골인",
    danger: "심판 최대 2명이 7초 뒤부터 13초 간격으로 등장합니다.",
    quote: "길이 짧아지는 순간을 기다리지 마. 네 속도로 거리를 먼저 지워.",
    skill: "병방치 부스트",
    skillDetail: "순간 가속의 기억이 깨어나 마지막 세 방의 좁은 틈을 빠르게 벗어날 수 있습니다.",
    targets: [{ x: 190, y: 125, label: "B1" }, { x: 420, y: 470, label: "B2" }, { x: 665, y: 125, label: "B3" }, { x: 820, y: 455, label: "B4" }],
    walls: [
      { x: 245, y: 55, w: 30, h: 300 }, { x: 375, y: 300, w: 250, h: 30 },
      { x: 600, y: 55, w: 30, h: 185 }, { x: 760, y: 225, w: 30, h: 330 },
    ],
    start: { x: 82, y: 470 }, ballStart: { x: 132, y: 470 }, goal: { x: 946, y: 235, w: 26, h: 130 }, npc: { x: 865, y: 135 },
    chaserSpeed: 81, chaserDelay: 7, maxShadows: 2, shadowSpawnInterval: 13, targetRadius: 36, difficulty: "악몽",
  },
  {
    id: "donggang",
    level: "LEVEL 12",
    zone: "동강 나리소 세이브 수문",
    title: "세 겹의 수비선",
    player: "알리송 베케르",
    playerCode: "ALISSON · 01",
    image: assetPath("/assets/characters/alisson-becker.png"),
    background: assetPath("/assets/backgrounds/room-12-donggang.jpg"),
    photoCredit: "나리소 전망대",
    photoSource: "https://www.jeongseon.go.kr/tour/jeongseontour/attractions?contentSeq=166989&mode=read",
    accent: "#d8ff47",
    floor: "#111a12",
    wall: "#354b36",
    description: "한반도 모양의 물길이 다섯 갈래 수문으로 갈라진다. 골키퍼처럼 각도를 읽어 공을 보내야만 물길이 다시 하나로 합쳐진다.",
    objective: "세이브 수문 5개를 순서대로 맞히고 동강 골대에 골인",
    danger: "전설 난이도 시작. 심판 최대 3명이 7초 뒤부터 12초 간격으로 등장합니다.",
    quote: "모든 길을 막을 수는 없어도, 다음 길이 열릴 자리는 먼저 볼 수 있어.",
    skill: "동강 스위퍼",
    skillDetail: "위험을 먼저 읽는 골키퍼의 감각이 깨어나 세 명의 심판 사이에서도 탈출 각도를 찾습니다.",
    targets: [{ x: 180, y: 135, label: "A1" }, { x: 350, y: 465, label: "A2" }, { x: 515, y: 135, label: "A3" }, { x: 690, y: 465, label: "A4" }, { x: 835, y: 135, label: "A5" }],
    walls: [
      { x: 225, y: 235, w: 210, h: 30 }, { x: 405, y: 55, w: 30, h: 125 },
      { x: 565, y: 255, w: 30, h: 300 }, { x: 725, y: 205, w: 210, h: 30 },
    ],
    start: { x: 82, y: 470 }, ballStart: { x: 132, y: 470 }, goal: { x: 946, y: 235, w: 26, h: 130 }, npc: { x: 865, y: 135 },
    chaserSpeed: 85, chaserDelay: 7, maxShadows: 3, shadowSpawnInterval: 12, targetRadius: 35, difficulty: "전설",
  },
  {
    id: "arirangmarket",
    level: "LEVEL 13",
    zone: "정선아리랑시장 컷인 골목",
    title: "다섯 번의 컷인",
    player: "부카요 사카",
    playerCode: "SAKA · 07",
    image: assetPath("/assets/characters/bukayo-saka.png"),
    background: assetPath("/assets/backgrounds/room-13-arirang-market.jpg"),
    photoCredit: "정선5일장-정선아리랑시장",
    photoSource: "https://www.jeongseon.go.kr/tour/jeongseontour/attractions?contentSeq=254764&mode=read",
    accent: "#ff5c39",
    floor: "#1b1310",
    wall: "#50372e",
    description: "장터의 천막과 골목이 매 순간 자리를 바꾼다. 안쪽으로 접어 드는 다섯 번의 움직임을 이어야 마지막 산으로 가는 문이 열린다.",
    objective: "컷인 표식 5개를 연결하고 장터 골대에 골인",
    danger: "심판 최대 3명이 6초 뒤부터 10초 간격으로 등장합니다. 한 명씩 슛으로 지우며 전진하세요.",
    quote: "바깥길이 닫히면 안쪽으로 접어 들어. 작은 틈 하나면 충분해.",
    skill: "장터 컷인",
    skillDetail: "짧고 정확한 방향 전환이 완성되어 최종 방의 다섯 표식을 빠르게 연결할 수 있습니다.",
    targets: [{ x: 185, y: 455, label: "S1" }, { x: 355, y: 120, label: "S2" }, { x: 530, y: 465, label: "S3" }, { x: 700, y: 120, label: "S4" }, { x: 845, y: 455, label: "S5" }],
    walls: [
      { x: 165, y: 65, w: 30, h: 295 }, { x: 315, y: 310, w: 245, h: 30 },
      { x: 530, y: 65, w: 30, h: 185 }, { x: 690, y: 220, w: 30, h: 335 },
      { x: 830, y: 75, w: 105, h: 30 },
    ],
    start: { x: 82, y: 120 }, ballStart: { x: 132, y: 120 }, goal: { x: 946, y: 235, w: 26, h: 130 }, npc: { x: 855, y: 135 },
    chaserSpeed: 89, chaserDelay: 6, maxShadows: 3, shadowSpawnInterval: 10, targetRadius: 34, difficulty: "전설",
  },
  {
    id: "gariwang",
    level: "LEVEL 14",
    zone: "가리왕산 전설의 돔",
    title: "마지막 호나우두",
    player: "호나우두 나자리우",
    playerCode: "RONALDO · 09",
    image: assetPath("/assets/characters/ronaldo-nazario.png"),
    background: assetPath("/assets/backgrounds/room-14-gariwang.jpg"),
    photoCredit: "정선 가리왕산 케이블카",
    photoSource: "https://www.jeongseon.go.kr/tour/jeongseontour/attractions?contentSeq=254812&mode=read",
    accent: "#ffd429",
    floor: "#18170f",
    wall: "#504b2e",
    description: "운해 위 마지막 경기장이 열린다. 열세 개의 기억을 품은 공으로 다섯 봉우리의 신호를 잇고 세 명의 심판을 넘어 새벽에 도착해야 한다.",
    objective: "전설 표식 5개를 모두 깨우고 새벽의 EXIT 골대에 마지막 골인",
    danger: "최종 난이도. 5초 뒤부터 심판이 9초 간격으로 나타나 최대 3명이 동시에 추격합니다.",
    quote: "마지막 수비를 넘는 건 힘만이 아니야. 공을 즐기는 마음이 출구를 보여 줘.",
    skill: "가리왕산 엘라스티코",
    skillDetail: "열네 개의 축구 기억이 하나로 이어져 정선의 새벽으로 돌아가는 출구가 열립니다.",
    targets: [{ x: 180, y: 125, label: "R1" }, { x: 350, y: 475, label: "R2" }, { x: 520, y: 125, label: "R3" }, { x: 690, y: 475, label: "R4" }, { x: 845, y: 125, label: "R5" }],
    walls: [
      { x: 245, y: 55, w: 30, h: 310 }, { x: 385, y: 300, w: 270, h: 30 },
      { x: 625, y: 55, w: 30, h: 190 }, { x: 785, y: 235, w: 30, h: 320 },
    ],
    start: { x: 82, y: 470 }, ballStart: { x: 132, y: 470 }, goal: { x: 946, y: 235, w: 26, h: 130 }, npc: { x: 865, y: 135 },
    chaserSpeed: 93, chaserDelay: 5, maxShadows: 3, shadowSpawnInterval: 9, targetRadius: 33, difficulty: "전설",
  },
];

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const nowMs = () => (typeof performance === "undefined" ? 0 : performance.now());
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const levelNumber = (index: number) => String(index + 1).padStart(2, "0");

function makeWorld(room: Room): WorldState {
  return {
    player: { ...room.start, facingX: 1, facingY: 0 },
    ball: { ...room.ballStart, vx: 0, vy: 0 },
    shadows: [],
    nextShadowSpawnAt: room.chaserDelay,
    shadowSerial: 0,
    shadowsDefeated: 0,
    targetIndex: 0,
    roomSeconds: 0,
    lastFrame: nowMs(),
    stamina: 100,
    invulnerableUntil: 0,
    shake: 0,
    clearTriggered: false,
    particles: [],
  };
}

function circleHitsRect(x: number, y: number, radius: number, rect: Rect) {
  const nearX = clamp(x, rect.x, rect.x + rect.w);
  const nearY = clamp(y, rect.y, rect.y + rect.h);
  return (x - nearX) ** 2 + (y - nearY) ** 2 < radius ** 2;
}

function collidesWalls(x: number, y: number, radius: number, walls: Rect[]) {
  return walls.some((wall) => circleHitsRect(x, y, radius, wall));
}

function moveCircle(entity: Point, dx: number, dy: number, radius: number, walls: Rect[]) {
  const nextX = clamp(entity.x + dx, radius + 12, WORLD_W - radius - 12);
  if (!collidesWalls(nextX, entity.y, radius, walls)) entity.x = nextX;
  const nextY = clamp(entity.y + dy, radius + 12, WORLD_H - radius - 12);
  if (!collidesWalls(entity.x, nextY, radius, walls)) entity.y = nextY;
}

function formatTime(seconds: number) {
  const min = Math.floor(seconds / 60).toString().padStart(2, "0");
  const sec = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${min}:${sec}`;
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const heroImageRef = useRef<HTMLImageElement | null>(null);
  const npcImagesRef = useRef<Record<string, HTMLImageElement>>({});
  const backgroundImagesRef = useRef<Record<string, HTMLImageElement>>({});
  const screenRef = useRef<Screen>("title");
  const levelRef = useRef(0);
  const heartsRef = useRef(3);
  const totalTimeRef = useRef(0);
  const audioEnabledRef = useRef(true);
  const audioRef = useRef<{ ctx: AudioContext; hum: OscillatorNode; gain: GainNode } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chargeStartedRef = useRef(0);
  const inputRef = useRef({ up: false, down: false, left: false, right: false, sprint: false, charging: false });
  const worldRef = useRef<WorldState>(makeWorld(ROOMS[0]));

  const [screen, setScreen] = useState<Screen>("title");
  const [level, setLevel] = useState(0);
  const [hearts, setHearts] = useState(3);
  const [targetProgress, setTargetProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [stamina, setStamina] = useState(100);
  const [shadowCount, setShadowCount] = useState(0);
  const [toast, setToast] = useState("");
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [totalSeconds, setTotalSeconds] = useState(0);

  const room = ROOMS[level];

  useEffect(() => { screenRef.current = screen; }, [screen]);
  useEffect(() => { levelRef.current = level; }, [level]);
  useEffect(() => { heartsRef.current = hearts; }, [hearts]);
  useEffect(() => { audioEnabledRef.current = audioEnabled; }, [audioEnabled]);

  const showToast = useCallback((message: string, duration = 2200) => {
    setToast(message);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(""), duration);
  }, []);

  const ensureAudio = useCallback(() => {
    if (audioRef.current || typeof window === "undefined") return;
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const hum = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    hum.type = "sawtooth";
    hum.frequency.value = 54;
    filter.type = "lowpass";
    filter.frequency.value = 180;
    gain.gain.value = 0.012;
    hum.connect(filter).connect(gain).connect(ctx.destination);
    hum.start();
    audioRef.current = { ctx, hum, gain };
  }, []);

  const playTone = useCallback((frequency: number, duration: number, type: OscillatorType = "sine", volume = 0.045) => {
    if (!audioEnabledRef.current) return;
    ensureAudio();
    const engine = audioRef.current;
    if (!engine) return;
    const oscillator = engine.ctx.createOscillator();
    const gain = engine.ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, engine.ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(48, frequency * 0.72), engine.ctx.currentTime + duration);
    gain.gain.setValueAtTime(volume, engine.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, engine.ctx.currentTime + duration);
    oscillator.connect(gain).connect(engine.ctx.destination);
    oscillator.start();
    oscillator.stop(engine.ctx.currentTime + duration);
  }, [ensureAudio]);

  const resetRoom = useCallback((roomIndex: number) => {
    worldRef.current = makeWorld(ROOMS[roomIndex]);
    setTargetProgress(0);
    setElapsed(0);
    setStamina(100);
    setShadowCount(0);
    inputRef.current = { up: false, down: false, left: false, right: false, sprint: false, charging: false };
  }, []);

  const completeLevel = useCallback(() => {
    const world = worldRef.current;
    if (world.clearTriggered) return;
    world.clearTriggered = true;
    totalTimeRef.current += world.roomSeconds;
    setTotalSeconds(Math.floor(totalTimeRef.current));
    screenRef.current = "levelClear";
    setScreen("levelClear");
    playTone(740, 0.18, "triangle", 0.06);
    setTimeout(() => playTone(988, 0.28, "triangle", 0.055), 140);
  }, [playTone]);

  const kickBall = useCallback((charge: number) => {
    if (screenRef.current !== "playing") return;
    const world = worldRef.current;
    const currentLevel = levelRef.current;
    const controlRange = 52 + currentLevel * 4;
    if (distance(world.player, world.ball) > controlRange) {
      showToast("공에 더 가까이 가세요 · R로 공 불러오기");
      playTone(115, 0.15, "square", 0.025);
      return;
    }
    let dirX = world.player.facingX;
    let dirY = world.player.facingY;
    const length = Math.hypot(dirX, dirY) || 1;
    dirX /= length; dirY /= length;
    const power = 290 + charge * (330 + currentLevel * 26);
    world.ball.vx = dirX * power;
    world.ball.vy = dirY * power;
    world.shake = 2 + charge * 3;
    playTone(185 + charge * 90, 0.12, "triangle", 0.045);
  }, [playTone, showToast]);

  const beginKick = useCallback(() => {
    if (screenRef.current !== "playing" || inputRef.current.charging) return;
    inputRef.current.charging = true;
    chargeStartedRef.current = nowMs();
  }, []);

  const releaseKick = useCallback(() => {
    if (!inputRef.current.charging) return;
    inputRef.current.charging = false;
    const charge = clamp((nowMs() - chargeStartedRef.current) / 900, 0, 1);
    kickBall(charge);
  }, [kickBall]);

  const recallBall = useCallback(() => {
    if (screenRef.current !== "playing") return;
    const world = worldRef.current;
    if (distance(world.player, world.ball) < 105) {
      showToast("공이 이미 가까이 있습니다.", 1200);
      return;
    }
    world.ball.x = clamp(world.player.x + world.player.facingX * 38, 30, WORLD_W - 30);
    world.ball.y = clamp(world.player.y + world.player.facingY * 38, 30, WORLD_H - 30);
    world.ball.vx = 0; world.ball.vy = 0;
    world.shake = 2;
    playTone(410, 0.16, "sine", 0.035);
    showToast("공을 되찾았습니다. 그림자가 가까워집니다!", 1600);
    const currentRoom = ROOMS[levelRef.current];
    if (currentRoom.maxShadows > 0) {
      world.nextShadowSpawnAt = Math.min(world.nextShadowSpawnAt, world.roomSeconds + 1.5);
    }
  }, [playTone, showToast]);

  const togglePause = useCallback(() => {
    if (screenRef.current === "playing") setScreen("paused");
    else if (screenRef.current === "paused") {
      worldRef.current.lastFrame = nowMs();
      setScreen("playing");
    }
  }, []);

  useEffect(() => {
    const hero = new Image();
    hero.src = assetPath("/assets/characters/hero-game.png");
    heroImageRef.current = hero;
    for (const item of ROOMS) {
      const image = new Image();
      image.src = item.image;
      npcImagesRef.current[item.id] = image;
      const background = new Image();
      background.src = item.background;
      backgroundImagesRef.current[item.id] = background;
    }
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      audioRef.current?.hum.stop();
      void audioRef.current?.ctx.close();
    };
  }, []);

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) event.preventDefault();
      if (key === "w" || key === "arrowup") inputRef.current.up = true;
      if (key === "s" || key === "arrowdown") inputRef.current.down = true;
      if (key === "a" || key === "arrowleft") inputRef.current.left = true;
      if (key === "d" || key === "arrowright") inputRef.current.right = true;
      if (key === "shift") inputRef.current.sprint = true;
      if (key === " " && !event.repeat) beginKick();
      if (key === "r" && !event.repeat) recallBall();
      if ((key === "escape" || key === "p") && !event.repeat) togglePause();
      if (key === "enter" && screenRef.current === "title") {
        ensureAudio();
        levelRef.current = 0; heartsRef.current = 3; totalTimeRef.current = 0;
        setLevel(0); setHearts(3); setTotalSeconds(0);
        resetRoom(0);
        setScreen("briefing");
      }
    };
    const up = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key === "w" || key === "arrowup") inputRef.current.up = false;
      if (key === "s" || key === "arrowdown") inputRef.current.down = false;
      if (key === "a" || key === "arrowleft") inputRef.current.left = false;
      if (key === "d" || key === "arrowright") inputRef.current.right = false;
      if (key === "shift") inputRef.current.sprint = false;
      if (key === " ") releaseKick();
    };
    window.addEventListener("keydown", down, { passive: false });
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, [beginKick, ensureAudio, recallBall, releaseKick, resetRoom, togglePause]);

  useEffect(() => {
    let frame = 0;
    let lastHud = 0;

    const spawnBurst = (x: number, y: number, color: string) => {
      for (let i = 0; i < 16; i += 1) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 45 + Math.random() * 130;
        worldRef.current.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 0.55 + Math.random() * 0.5, color });
      }
    };

    const drawBall = (ctx: CanvasRenderingContext2D, ball: WorldState["ball"]) => {
      ctx.save();
      ctx.translate(ball.x, ball.y);
      ctx.shadowColor = "rgba(0,0,0,.75)"; ctx.shadowBlur = 12; ctx.shadowOffsetY = 7;
      ctx.fillStyle = "#f4f0df"; ctx.beginPath(); ctx.arc(0, 0, 13, 0, Math.PI * 2); ctx.fill();
      ctx.shadowColor = "transparent";
      ctx.fillStyle = "#171b18";
      for (let i = 0; i < 5; i += 1) {
        const angle = i * Math.PI * 0.4 + (ball.x + ball.y) * 0.01;
        ctx.beginPath(); ctx.arc(Math.cos(angle) * 7, Math.sin(angle) * 7, 2.9, 0, Math.PI * 2); ctx.fill();
      }
      ctx.beginPath(); ctx.arc(0, 0, 3.8, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    };

    const drawSprite = (ctx: CanvasRenderingContext2D, image: HTMLImageElement | undefined | null, x: number, y: number, height: number, alpha = 1, flip = false) => {
      if (!image?.complete || !image.naturalWidth) return;
      const width = height * image.naturalWidth / image.naturalHeight;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(x, y);
      if (flip) ctx.scale(-1, 1);
      ctx.drawImage(image, -width / 2, -height * 0.76, width, height);
      ctx.restore();
    };

    const render = (time: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const cssWidth = canvas.clientWidth || 1000;
      const cssHeight = canvas.clientHeight || 600;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const pixelWidth = Math.round(cssWidth * dpr);
      const pixelHeight = Math.round(cssHeight * dpr);
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth; canvas.height = pixelHeight;
      }
      ctx.setTransform(pixelWidth / WORLD_W, 0, 0, pixelHeight / WORLD_H, 0, 0);
      const currentRoom = ROOMS[levelRef.current];
      const world = worldRef.current;
      const flicker = Math.sin(time * 0.008) > 0.985 ? 0.7 : 1;
      const shakeX = world.shake ? (Math.random() - 0.5) * world.shake : 0;
      const shakeY = world.shake ? (Math.random() - 0.5) * world.shake : 0;
      ctx.save();
      ctx.translate(shakeX, shakeY);

      const background = backgroundImagesRef.current[currentRoom.id];
      if (background?.complete && background.naturalWidth) {
        const scale = Math.max(WORLD_W / background.naturalWidth, WORLD_H / background.naturalHeight);
        const drawWidth = background.naturalWidth * scale;
        const drawHeight = background.naturalHeight * scale;
        ctx.globalAlpha = 0.72;
        ctx.drawImage(background, (WORLD_W - drawWidth) / 2, (WORLD_H - drawHeight) / 2, drawWidth, drawHeight);
        ctx.globalAlpha = 1;
      }
      const floorGradient = ctx.createLinearGradient(0, 0, WORLD_W, WORLD_H);
      floorGradient.addColorStop(0, currentRoom.floor);
      floorGradient.addColorStop(1, "#070908");
      ctx.globalAlpha = background?.complete && background.naturalWidth ? 0.62 : 1;
      ctx.fillStyle = floorGradient; ctx.fillRect(-10, -10, WORLD_W + 20, WORLD_H + 20);
      ctx.globalAlpha = 1;

      ctx.globalAlpha = 0.075 * flicker;
      for (let x = 20; x < WORLD_W; x += 56) {
        for (let y = 20; y < WORLD_H; y += 56) {
          ctx.fillStyle = ((x / 56 + y / 56) % 2) ? "#fff" : currentRoom.accent;
          ctx.fillRect(x, y, 54, 54);
        }
      }
      ctx.globalAlpha = 1;
      ctx.strokeStyle = currentRoom.accent; ctx.globalAlpha = 0.16; ctx.lineWidth = 2; ctx.setLineDash([12, 16]);
      ctx.beginPath(); ctx.moveTo(24, WORLD_H / 2); ctx.lineTo(WORLD_W - 24, WORLD_H / 2); ctx.stroke();
      ctx.setLineDash([]); ctx.globalAlpha = 1;

      ctx.fillStyle = "rgba(255,255,255,.04)";
      roundedRect(ctx, 26, 23, 330, 48, 10); ctx.fill();
      ctx.fillStyle = currentRoom.accent; ctx.font = "900 13px 'Malgun Gothic', sans-serif"; ctx.fillText(`${currentRoom.level} · ${currentRoom.zone}`, 46, 52);

      for (const wall of currentRoom.walls) {
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,.8)"; ctx.shadowBlur = 22; ctx.shadowOffsetX = 10; ctx.shadowOffsetY = 12;
        ctx.fillStyle = currentRoom.wall; roundedRect(ctx, wall.x, wall.y, wall.w, wall.h, 6); ctx.fill();
        ctx.shadowColor = "transparent";
        const wallGradient = ctx.createLinearGradient(wall.x, wall.y, wall.x + wall.w, wall.y + wall.h);
        wallGradient.addColorStop(0, "rgba(255,255,255,.14)"); wallGradient.addColorStop(0.15, "rgba(255,255,255,.02)"); wallGradient.addColorStop(1, "rgba(0,0,0,.28)");
        ctx.fillStyle = wallGradient; roundedRect(ctx, wall.x + 3, wall.y + 3, wall.w - 6, wall.h - 6, 4); ctx.fill();
        ctx.restore();
      }

      currentRoom.targets.forEach((target, index) => {
        const done = index < world.targetIndex;
        const active = index === world.targetIndex;
        ctx.save();
        ctx.globalAlpha = done ? 0.22 : active ? (0.75 + Math.sin(time * 0.006) * 0.22) : 0.18;
        ctx.strokeStyle = currentRoom.accent; ctx.lineWidth = active ? 5 : 2;
        ctx.shadowColor = currentRoom.accent; ctx.shadowBlur = active ? 25 : 6;
        const ringRadius = Math.max(20, currentRoom.targetRadius - 8);
        ctx.beginPath(); ctx.arc(target.x, target.y, ringRadius + Math.sin(time * 0.005 + index) * 3, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(target.x, target.y, ringRadius * 0.54, 0, Math.PI * 2); ctx.stroke();
        ctx.shadowBlur = 0; ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.font = "900 10px ui-monospace, monospace"; ctx.fillText(done ? "✓" : target.label, target.x, target.y);
        ctx.restore();
      });

      const open = world.targetIndex >= currentRoom.targets.length;
      ctx.save();
      ctx.translate(currentRoom.goal.x, currentRoom.goal.y);
      ctx.strokeStyle = open ? currentRoom.accent : "#9b3030"; ctx.lineWidth = 7; ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = open ? 18 : 4;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, currentRoom.goal.h); ctx.lineTo(currentRoom.goal.w + 24, currentRoom.goal.h); ctx.stroke();
      ctx.lineWidth = 1; ctx.globalAlpha = 0.42;
      for (let y = 10; y < currentRoom.goal.h; y += 13) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(currentRoom.goal.w + 24, y); ctx.stroke(); }
      ctx.globalAlpha = 1; ctx.shadowBlur = 0; ctx.fillStyle = open ? currentRoom.accent : "#c25a5a"; ctx.font = "900 9px ui-monospace, monospace"; ctx.fillText(open ? "EXIT" : "LOCK", -11, -10);
      ctx.restore();

      const npcImage = npcImagesRef.current[currentRoom.id];
      ctx.save(); ctx.shadowColor = currentRoom.accent; ctx.shadowBlur = 26;
      drawSprite(ctx, npcImage, currentRoom.npc.x, currentRoom.npc.y, 188, 0.34 + Math.sin(time * 0.003) * 0.08);
      ctx.restore();

      world.shadows.forEach((shadow, index) => {
        ctx.save();
        const pulse = 1 + Math.sin(time * 0.009 + index) * 0.08;
        ctx.translate(shadow.x, shadow.y); ctx.scale(pulse, pulse);
        ctx.shadowColor = "#ff334d"; ctx.shadowBlur = 28;
        ctx.fillStyle = "rgba(0,0,0,.9)"; ctx.beginPath(); ctx.arc(0, -17, 11, 0, Math.PI * 2); ctx.fill();
        roundedRect(ctx, -12, -7, 24, 40, 8); ctx.fill();
        ctx.strokeStyle = "#ff334d"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(10, 2); ctx.lineTo(24, 22); ctx.stroke();
        ctx.fillStyle = "#ff334d"; ctx.beginPath(); ctx.moveTo(24, 22); ctx.lineTo(34, 18); ctx.lineTo(28, 31); ctx.closePath(); ctx.fill();
        ctx.fillStyle = "#f8ffdb"; ctx.shadowBlur = 8; ctx.beginPath(); ctx.arc(-4, -18, 1.8, 0, Math.PI * 2); ctx.arc(4, -18, 1.8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#ff334d"; ctx.shadowBlur = 0; ctx.font = "900 8px ui-monospace, monospace"; ctx.textAlign = "center"; ctx.fillText(String(index + 1), 0, 44);
        ctx.restore();
      });

      drawBall(ctx, world.ball);
      const invulnerable = time < world.invulnerableUntil;
      if (!invulnerable || Math.floor(time / 90) % 2 === 0) {
        ctx.save(); ctx.shadowColor = currentRoom.accent; ctx.shadowBlur = 14;
        drawSprite(ctx, heroImageRef.current, world.player.x, world.player.y, 78, 1, world.player.facingX < -0.1);
        ctx.restore();
      }

      for (const particle of world.particles) {
        ctx.globalAlpha = clamp(particle.life * 1.7, 0, 1); ctx.fillStyle = particle.color;
        ctx.beginPath(); ctx.arc(particle.x, particle.y, 2.4 + particle.life * 2.2, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;

      const light = ctx.createRadialGradient(world.player.x, world.player.y, 65, world.player.x, world.player.y, 365);
      light.addColorStop(0, "rgba(0,0,0,0)"); light.addColorStop(0.48, "rgba(0,0,0,.08)"); light.addColorStop(1, `rgba(0,0,0,${0.76 / flicker})`);
      ctx.fillStyle = light; ctx.fillRect(-10, -10, WORLD_W + 20, WORLD_H + 20);
      ctx.restore();
    };

    const loop = (time: number) => {
      const currentRoom = ROOMS[levelRef.current];
      const world = worldRef.current;
      const delta = Math.min((time - world.lastFrame) / 1000 || 0, 0.034);
      world.lastFrame = time;

      if (screenRef.current === "playing") {
        world.roomSeconds += delta;
        const input = inputRef.current;
        let dx = Number(input.right) - Number(input.left);
        let dy = Number(input.down) - Number(input.up);
        const movementLength = Math.hypot(dx, dy);
        if (movementLength) {
          dx /= movementLength; dy /= movementLength;
          world.player.facingX = dx; world.player.facingY = dy;
        }
        const sprinting = input.sprint && world.stamina > 1 && movementLength > 0;
        const speed = (sprinting ? 224 : 145) * (1 + levelRef.current * 0.025);
        if (sprinting) world.stamina = Math.max(0, world.stamina - (31 - levelRef.current * 1.6) * delta);
        else world.stamina = Math.min(100, world.stamina + (19 + levelRef.current * 1.3) * delta);
        moveCircle(world.player, dx * speed * delta, dy * speed * delta, 17, currentRoom.walls);

        const ballDistance = distance(world.player, world.ball);
        if (movementLength && ballDistance < 35) {
          world.ball.vx += dx * 285 * delta; world.ball.vy += dy * 285 * delta;
        }
        const oldBallX = world.ball.x; const oldBallY = world.ball.y;
        world.ball.x += world.ball.vx * delta;
        if (world.ball.x < 24 || world.ball.x > WORLD_W - 24 || collidesWalls(world.ball.x, world.ball.y, 12, currentRoom.walls)) {
          world.ball.x = oldBallX; world.ball.vx *= -0.66;
        }
        world.ball.y += world.ball.vy * delta;
        if (world.ball.y < 24 || world.ball.y > WORLD_H - 24 || collidesWalls(world.ball.x, world.ball.y, 12, currentRoom.walls)) {
          world.ball.y = oldBallY; world.ball.vy *= -0.66;
        }
        const friction = Math.pow(0.12, delta);
        world.ball.vx *= friction; world.ball.vy *= friction;
        if (Math.abs(world.ball.vx) < 1) world.ball.vx = 0;
        if (Math.abs(world.ball.vy) < 1) world.ball.vy = 0;

        const ballSpeed = Math.hypot(world.ball.vx, world.ball.vy);
        const hitShadowIndex = world.shadows.findIndex((shadow) => distance(shadow, world.ball) < 37 && ballSpeed > 35);
        if (hitShadowIndex >= 0) {
          const [hitShadow] = world.shadows.splice(hitShadowIndex, 1);
          const hitX = hitShadow.x;
          const hitY = hitShadow.y;
          world.shadowsDefeated += 1;
          world.ball.vx *= 0.48;
          world.ball.vy *= 0.48;
          world.shake = 10;
          spawnBurst(hitX, hitY, "#ff4557");
          spawnBurst(hitX, hitY, currentRoom.accent);
          playTone(960, 0.13, "square", 0.06);
          setTimeout(() => playTone(520, 0.28, "sawtooth", 0.045), 100);
          showToast(`레드카드! 그림자 심판 퇴장 · 현재 ${world.shadows.length}/${currentRoom.maxShadows}명`, 2400);
        }

        const currentTarget = currentRoom.targets[world.targetIndex];
        if (currentTarget && distance(currentTarget, world.ball) < currentRoom.targetRadius && Math.hypot(world.ball.vx, world.ball.vy) > 18) {
          world.targetIndex += 1;
          setTargetProgress(world.targetIndex);
          spawnBurst(currentTarget.x, currentTarget.y, currentRoom.accent);
          world.shake = 4;
          playTone(440 + world.targetIndex * 120, 0.19, "triangle", 0.055);
          if (world.targetIndex === currentRoom.targets.length) showToast(`${currentRoom.targets.length}개 신호 연결 완료 · EXIT 골대 개방!`, 2400);
          else showToast(`신호 ${world.targetIndex}/${currentRoom.targets.length} 연결 · 다음 표식을 찾으세요`, 1500);
        }

        if (world.targetIndex >= currentRoom.targets.length && world.ball.x > currentRoom.goal.x - 2 && world.ball.y > currentRoom.goal.y - 8 && world.ball.y < currentRoom.goal.y + currentRoom.goal.h + 8) {
          completeLevel();
        }

        if (currentRoom.maxShadows > 0 && world.roomSeconds >= world.nextShadowSpawnAt) {
          if (world.shadows.length < currentRoom.maxShadows) {
            const spawnPoints: Point[] = [{ x: 925, y: 68 }, { x: 925, y: 532 }, { x: 75, y: 68 }, { x: 75, y: 532 }];
            const available = spawnPoints
              .filter((point) => distance(point, world.player) > 230 && world.shadows.every((shadow) => distance(point, shadow) > 80))
              .sort((a, b) => distance(b, world.player) - distance(a, world.player));
            const spawn = available[world.shadowSerial % Math.max(1, available.length)] ?? spawnPoints[world.shadowSerial % spawnPoints.length];
            world.shadows.push({ ...spawn, id: world.shadowSerial });
            world.shadowSerial += 1;
            showToast(`그림자 심판 등장 · ${world.shadows.length}/${currentRoom.maxShadows}명`, 1500);
          }
          world.nextShadowSpawnAt = world.roomSeconds + currentRoom.shadowSpawnInterval;
        }

        const lostBallMultiplier = ballDistance > 150 ? 1.38 : 1;
        world.shadows.forEach((shadow, index) => {
          const toPlayerX = world.player.x - shadow.x;
          const toPlayerY = world.player.y - shadow.y;
          const length = Math.hypot(toPlayerX, toPlayerY) || 1;
          const speedNow = currentRoom.chaserSpeed * lostBallMultiplier * (1 + index * 0.035);
          shadow.x += toPlayerX / length * speedNow * delta;
          shadow.y += toPlayerY / length * speedNow * delta;
        });

        const caught = world.shadows.some((shadow) => distance(shadow, world.player) < 31);
        if (caught && time > world.invulnerableUntil) {
          const nextHearts = heartsRef.current - 1;
          heartsRef.current = nextHearts; setHearts(nextHearts);
          world.shake = 14; playTone(74, 0.45, "sawtooth", 0.07);
          if (nextHearts <= 0) {
            screenRef.current = "gameOver";
            setScreen("gameOver");
          } else {
            world.player.x = currentRoom.start.x; world.player.y = currentRoom.start.y;
            world.ball.x = currentRoom.ballStart.x; world.ball.y = currentRoom.ballStart.y; world.ball.vx = 0; world.ball.vy = 0;
            world.shadows = [];
            world.nextShadowSpawnAt = world.roomSeconds + Math.max(3, currentRoom.chaserDelay * 0.35);
            world.invulnerableUntil = time + 2100;
            showToast("경고! 출발 지점으로 되돌아왔습니다.", 2200);
          }
        }

        world.particles = world.particles.filter((particle) => {
          particle.x += particle.vx * delta; particle.y += particle.vy * delta; particle.vx *= 0.96; particle.vy *= 0.96; particle.life -= delta;
          return particle.life > 0;
        });
        world.shake *= Math.pow(0.025, delta);

        if (time - lastHud > 100) {
          lastHud = time;
          setElapsed(Math.floor(world.roomSeconds));
          setStamina(Math.round(world.stamina));
          setShadowCount(world.shadows.length);
        }
      }

      render(time);
      frame = requestAnimationFrame(loop);
    };

    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [completeLevel, playTone, showToast]);

  const startNewGame = () => {
    ensureAudio();
    if (audioRef.current?.ctx.state === "suspended") void audioRef.current.ctx.resume();
    levelRef.current = 0; heartsRef.current = 3; totalTimeRef.current = 0;
    setLevel(0); setHearts(3); setTotalSeconds(0); resetRoom(0); setScreen("briefing");
  };

  const enterRoom = () => {
    resetRoom(levelRef.current);
    setScreen("playing");
    const currentRoom = ROOMS[levelRef.current];
    if (currentRoom.maxShadows === 0) showToast(`연습방 · 심판 없음 · 표식 ${currentRoom.targets.length}개`, 3000);
    else showToast(`TIP · 강한 슛으로 심판 퇴장 · 이 방 최대 ${currentRoom.maxShadows}명`, 3200);
  };

  const nextRoom = () => {
    if (levelRef.current >= ROOMS.length - 1) {
      setScreen("ending");
      return;
    }
    const next = levelRef.current + 1;
    levelRef.current = next; setLevel(next);
    const healed = Math.min(3, heartsRef.current + 1);
    heartsRef.current = healed; setHearts(healed);
    resetRoom(next); setScreen("briefing");
  };

  const retryRoom = () => {
    heartsRef.current = 3; setHearts(3); resetRoom(levelRef.current); setScreen("briefing");
  };

  const returnTitle = () => {
    setScreen("title"); levelRef.current = 0; setLevel(0); setToast("");
  };

  const toggleAudio = () => {
    const next = !audioEnabledRef.current;
    audioEnabledRef.current = next; setAudioEnabled(next);
    if (next) {
      ensureAudio();
      if (audioRef.current) {
        void audioRef.current.ctx.resume();
        audioRef.current.gain.gain.setTargetAtTime(0.012, audioRef.current.ctx.currentTime, 0.05);
      }
      playTone(520, 0.12, "sine", 0.035);
    } else if (audioRef.current) {
      audioRef.current.gain.gain.setTargetAtTime(0.0001, audioRef.current.ctx.currentTime, 0.05);
    }
  };

  const setDirection = (key: "up" | "down" | "left" | "right", active: boolean) => {
    inputRef.current[key] = active;
  };

  if (screen === "title") {
    return (
      <main className="title-screen">
        <div className="title-backdrop" aria-hidden="true" />
        <div className="scanlines" aria-hidden="true" />
        <nav className="title-nav" aria-label="게임 정보">
          <div className="brand"><span className="brand-mark">JFC</span><span>JEONGSEON FOOTBALL CLUB</span></div>
          <button className="sound-button" type="button" onClick={toggleAudio} aria-label={audioEnabled ? "소리 끄기" : "소리 켜기"}>{audioEnabled ? "SOUND ON" : "SOUND OFF"}</button>
        </nav>
        <section className="title-content">
          <div className="title-copy">
            <p className="title-kicker"><span>CASE JFC-090</span> 마지막 열차 이후</p>
            <h1><span>정선 FC</span><strong>90분의 백룸</strong></h1>
            <p className="title-lede">축구공을 놓치지 마세요.<br />열네 개의 기억이 당신의 출구입니다.</p>
            <div className="title-actions">
              <button className="primary-button" type="button" onClick={startNewGame}><span>▶</span> 게임 시작</button>
              <span className="enter-hint">ENTER로도 시작</span>
            </div>
            <div className="control-ribbon" aria-label="조작 방법">
              <span><kbd>WASD</kbd> 이동</span><span><kbd>SPACE</kbd> 슛 충전</span><span><kbd>SHIFT</kbd> 질주</span><span><kbd>R</kbd> 공 회수</span>
            </div>
          </div>
          <div className="hero-stage">
            <div className="hero-halo" aria-hidden="true" />
            <img className="hero-character" src={assetPath("/assets/characters/hero.png")} alt="파란 줄무늬 유니폼과 탐험 가방을 착용한 주인공 소년" />
            <div className="live-chip"><i /> EXIT SIGNAL <b>0%</b></div>
            <div className="match-card"><span>00:00</span><b>JSE 0 — ? BKR</b><small>정선선 지하 4층</small></div>
          </div>
        </section>
        <section className="lineup" aria-label="등장 선수">
          <div className="lineup-heading"><span>MEMORY XIV</span><b>출구를 기억하는 14인</b></div>
          <div className="lineup-list">
            {ROOMS.map((item, index) => (
              <article className="lineup-player" key={item.id} style={{ "--accent": item.accent } as CSSProperties}>
                <span className="lineup-index">{levelNumber(index)}</span>
                <img src={item.image} alt="" />
                <div><b>{item.player}</b><small>{item.skill}</small><em>{item.difficulty}</em></div>
              </article>
            ))}
          </div>
        </section>
        <p className="fan-note">팬메이드 게임 콘셉트 · 실제 선수 및 구단과 공식 제휴되지 않았습니다 · 실사 배경은 방별 정선군 관광 출처 표기</p>
      </main>
    );
  }

  return (
    <main className="game-screen" style={{ "--room-accent": room.accent } as CSSProperties}>
      <div className="game-noise" aria-hidden="true" />
      <header className="game-hud">
        <div className="hud-location"><span>{room.level} · 난이도 {room.difficulty}</span><b>{room.zone}</b><small>{room.title}</small></div>
        <div className="hud-center">
          <div className="objective-label"><span>MISSION</span><b>{room.objective}</b></div>
          <div className="target-dots" aria-label={`표식 ${targetProgress}/${room.targets.length}`}>
            {room.targets.map((target, index) => <i key={target.label} className={index < targetProgress ? "done" : index === targetProgress ? "active" : ""}>{index < targetProgress ? "✓" : index + 1}</i>)}
          </div>
        </div>
        <div className="hud-status">
          <div className="referee-meter" aria-label={`현재 그림자 심판 ${shadowCount}명, 최대 ${room.maxShadows}명`}><span>SHADOW REF</span><b>{shadowCount}/{room.maxShadows}</b></div>
          <div className="match-clock"><span>MATCH TIME</span><b>{formatTime(elapsed)}</b></div>
          <div className="hearts" aria-label={`남은 경고 ${hearts}개`}>{[0, 1, 2].map((value) => <i key={value} className={value < hearts ? "alive" : ""}>◆</i>)}</div>
          <button className="hud-icon" type="button" onClick={toggleAudio} aria-label={audioEnabled ? "소리 끄기" : "소리 켜기"}>{audioEnabled ? "◖))" : "◖×"}</button>
          <button className="hud-icon" type="button" onClick={togglePause} aria-label="일시정지">Ⅱ</button>
        </div>
      </header>

      <section className="game-frame" aria-label={`${room.zone} 플레이 화면`}>
        <canvas ref={canvasRef} className="game-canvas" aria-label="주인공과 축구공을 움직여 표식을 통과하고 출구 골대에 골을 넣는 게임" />
        <div className="canvas-vignette" aria-hidden="true" />
        <a className="photo-credit" href={room.photoSource} target="_blank" rel="noreferrer">실사 배경 · 정선군 관광 공식사진: {room.photoCredit} ↗</a>
        <div className="room-code" aria-hidden="true">JFC / {room.id.toUpperCase()} / NO SIGNAL</div>
        {toast && <div className="toast" role="status"><i />{toast}</div>}
        <div className="stamina-meter"><span>SPRINT</span><div><i style={{ width: `${stamina}%` }} /></div><b>{stamina}</b></div>
        <div className="desktop-hint"><span><kbd>SPACE</kbd> 길게 눌러 슛</span><span><kbd>R</kbd> 공 회수</span><span><kbd>P</kbd> 일시정지</span></div>

        <div className="mobile-controls" aria-label="모바일 조작 버튼">
          <div className="dpad">
            <button type="button" className="up" aria-label="위로 이동" onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); setDirection("up", true); }} onPointerUp={() => setDirection("up", false)}>▲</button>
            <button type="button" className="left" aria-label="왼쪽 이동" onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); setDirection("left", true); }} onPointerUp={() => setDirection("left", false)}>◀</button>
            <button type="button" className="down" aria-label="아래로 이동" onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); setDirection("down", true); }} onPointerUp={() => setDirection("down", false)}>▼</button>
            <button type="button" className="right" aria-label="오른쪽 이동" onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); setDirection("right", true); }} onPointerUp={() => setDirection("right", false)}>▶</button>
          </div>
          <div className="mobile-actions">
            <button type="button" className="recall-button" onClick={recallBall}>R<small>회수</small></button>
            <button type="button" className="sprint-button" onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); inputRef.current.sprint = true; }} onPointerUp={() => { inputRef.current.sprint = false; }}>질주</button>
            <button type="button" className="kick-button" onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); beginKick(); }} onPointerUp={releaseKick}>KICK<small>길게 누르기</small></button>
          </div>
        </div>
      </section>

      <footer className="skill-strip">
        <span>해금 기술</span>
        {ROOMS.map((item, index) => <div key={item.id} className={index < level || (index === level && screen === "levelClear") ? "unlocked" : ""}><i style={{ background: item.accent }} />{item.skill}</div>)}
      </footer>

      {screen === "briefing" && (
        <div className="modal-layer" role="dialog" aria-modal="true" aria-labelledby="briefing-title">
          <section className="player-dialogue">
            <div className="dialogue-art"><span>{room.playerCode}</span><img src={room.image} alt={`${room.player} 캐릭터`} /></div>
            <div className="dialogue-copy">
              <p className="modal-kicker">MEMORY SIGNAL FOUND · {room.level} · 난이도 {room.difficulty}</p>
              <h2 id="briefing-title">{room.title}<small>{room.zone}</small></h2>
              <p className="room-story">{room.description}</p>
              <blockquote>“{room.quote}”<cite>{room.player}</cite></blockquote>
              <div className="mission-box"><span>이번 미션 · 난이도 {room.difficulty}</span><b>{room.objective}</b><small>⚠ {room.danger}</small></div>
              <button className="primary-button compact" type="button" onClick={enterRoom}><span>▶</span> 도전 시작</button>
            </div>
          </section>
        </div>
      )}

      {screen === "paused" && (
        <div className="modal-layer" role="dialog" aria-modal="true" aria-labelledby="pause-title">
          <section className="small-modal"><p className="modal-kicker">MATCH SUSPENDED</p><h2 id="pause-title">시간이 멈췄습니다.</h2><p>백룸의 형광등도 잠시 숨을 고르고 있습니다.</p><button className="primary-button compact" type="button" onClick={togglePause}>계속 플레이</button><button className="text-button" type="button" onClick={returnTitle}>타이틀로 나가기</button></section>
        </div>
      )}

      {screen === "levelClear" && (
        <div className="modal-layer clear-layer" role="dialog" aria-modal="true" aria-labelledby="clear-title">
          <section className="clear-card">
            <div className="clear-number">{levelNumber(level)}</div>
            <img src={room.image} alt="" />
            <div className="clear-copy"><p className="modal-kicker">MEMORY RESTORED</p><h2 id="clear-title">{room.skill}<small>기술 해금</small></h2><p>{room.skillDetail}</p><div className="clear-stats"><span>ROOM TIME<b>{formatTime(elapsed)}</b></span><span>SIGNALS<b>{room.targets.length} / {room.targets.length}</b></span><span>WARNINGS<b>{hearts} / 3</b></span></div><button className="primary-button compact" type="button" onClick={nextRoom}>{level === ROOMS.length - 1 ? "마지막 출구 열기" : "다음 백룸으로"}<span>→</span></button></div>
          </section>
        </div>
      )}

      {screen === "gameOver" && (
        <div className="modal-layer danger-layer" role="dialog" aria-modal="true" aria-labelledby="gameover-title">
          <section className="small-modal"><p className="modal-kicker red">FINAL WHISTLE?</p><h2 id="gameover-title">오프사이드 판정</h2><p>그림자 심판이 기록을 되감았습니다. 하지만 표식의 위치는 기억할 수 있습니다.</p><button className="primary-button compact danger" type="button" onClick={retryRoom}>현재 방 다시 도전</button><button className="text-button" type="button" onClick={returnTitle}>타이틀로 나가기</button></section>
        </div>
      )}

      {screen === "ending" && (
        <div className="modal-layer ending-layer" role="dialog" aria-modal="true" aria-labelledby="ending-title">
          <section className="ending-card">
            <div className="ending-sun" aria-hidden="true" />
            <div className="ending-lineup">{ROOMS.map((item) => <img key={item.id} src={item.image} alt="" />)}</div>
            <p className="modal-kicker">ESCAPE COMPLETE · JEONGSEON 05:42</p>
            <h2 id="ending-title">새벽의 정선으로<br /><strong>돌아왔습니다.</strong></h2>
            <p>열네 개의 축구 기억이 마지막 휘슬을 울렸습니다.<br />소년의 가방에는 이제 출구가 아니라, 다시 돌아올 길이 남았습니다.</p>
            <div className="ending-score"><span>ESCAPE TIME</span><b>{formatTime(totalSeconds)}</b><small>{totalSeconds < ROOMS.length * 48 ? "RANK S · 아리랑 플레이메이커" : totalSeconds < ROOMS.length * 78 ? "RANK A · 정선의 스트라이커" : "RANK B · 끝까지 뛴 생존자"}</small></div>
            <button className="primary-button compact" type="button" onClick={startNewGame}>다시 플레이</button>
            <button className="text-button" type="button" onClick={returnTitle}>타이틀로 돌아가기</button>
          </section>
        </div>
      )}
    </main>
  );
}
