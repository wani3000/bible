export type Verse = { verse: number; text: string };
export type Chapter = { chapter: number; verses: Verse[] };
export type Book = {
  id: string;
  testament: "OT" | "NT";
  name: string;
  chapters: Chapter[];
};

export const KORRV_BOOKS: Book[] = [
  {
    id: "genesis",
    testament: "OT",
    name: "창세기",
    chapters: [
      {
        chapter: 1,
        verses: [
          { verse: 1, text: "태초에 하나님이 천지를 창조하시니라." },
          { verse: 2, text: "땅이 혼돈하고 공허하며 흑암이 깊음 위에 있고 하나님의 신은 수면 위에 운행하시니라." },
          { verse: 3, text: "하나님이 가라사대 빛이 있으라 하시매 빛이 있었고." },
          { verse: 4, text: "빛이 하나님 보시기에 좋았더라 하나님이 빛과 어둠을 나누사." },
          { verse: 5, text: "하나님이 빛을 낮이라 칭하시고 어둠을 밤이라 칭하시니라 저녁이 되며 아침이 되니 이는 첫째 날이니라." },
        ],
      },
      {
        chapter: 2,
        verses: [
          { verse: 1, text: "천지와 만물이 다 이루니라." },
          { verse: 2, text: "하나님이 지으시던 일이 일곱째 날이 이를 때에 마치니 그 지으시던 일이 다하므로 일곱째 날에 안식하시니라." },
          { verse: 3, text: "하나님이 일곱째 날을 복 주사 거룩하게 하셨으니." },
          { verse: 4, text: "여호와 하나님이 땅과 하늘을 만드시던 날에 천지의 창조된 대략이 이러하니라." },
        ],
      },
      {
        chapter: 3,
        verses: [
          { verse: 1, text: "뱀은 여호와 하나님이 지으신 들짐승 중에 가장 간교하니라." },
          { verse: 2, text: "여자가 뱀에게 말하되 동산 나무의 실과를 우리가 먹을 수 있으나." },
          { verse: 3, text: "동산 중앙에 있는 나무의 실과는 하나님의 말씀에 너희는 먹지도 말고 만지지도 말라 하셨느니라." },
          { verse: 4, text: "뱀이 여자에게 이르되 너희가 결코 죽지 아니하리라." },
        ],
      },
    ],
  },
  {
    id: "psalms",
    testament: "OT",
    name: "시편",
    chapters: [
      {
        chapter: 1,
        verses: [
          { verse: 1, text: "복 있는 사람은 악인의 꾀를 좇지 아니하며 죄인의 길에 서지 아니하며 오만한 자의 자리에 앉지 아니하고." },
          { verse: 2, text: "오직 여호와의 율법을 즐거워하여 그 율법을 주야로 묵상하는 자로다." },
          { verse: 3, text: "저는 시냇가에 심은 나무가 시절을 좇아 과실을 맺으며 그 잎사귀가 마르지 아니함 같으니." },
          { verse: 4, text: "악인은 그렇지 않음이여 오직 바람에 나는 겨와 같도다." },
        ],
      },
      {
        chapter: 23,
        verses: [
          { verse: 1, text: "여호와는 나의 목자시니 내게 부족함이 없으리로다." },
          { verse: 2, text: "그가 나를 푸른 초장에 누이시며 쉴 만한 물가으로 인도하시는도다." },
          { verse: 3, text: "내 영혼을 소생시키시고 자기 이름을 위하여 의의 길로 인도하시는도다." },
          { verse: 4, text: "내가 사망의 음침한 골짜기로 다닐찌라도 해를 두려워하지 않을 것은 주께서 나와 함께 하심이라." },
        ],
      },
    ],
  },
  {
    id: "matthew",
    testament: "NT",
    name: "마태복음",
    chapters: [
      {
        chapter: 5,
        verses: [
          { verse: 1, text: "예수께서 무리를 보시고 산에 올라가 앉으시니 제자들이 나아온지라." },
          { verse: 2, text: "입을 열어 가르쳐 가라사대." },
          { verse: 3, text: "심령이 가난한 자는 복이 있나니 천국이 저희 것임이요." },
          { verse: 4, text: "애통하는 자는 복이 있나니 저희가 위로를 받을 것임이요." },
          { verse: 5, text: "온유한 자는 복이 있나니 저희가 땅을 기업으로 받을 것임이요." },
        ],
      },
      {
        chapter: 6,
        verses: [
          { verse: 1, text: "사람에게 보이려고 그들 앞에서 너희 의를 행치 않도록 주의하라." },
          { verse: 2, text: "그러므로 구제할 때에 외식하는 자가 하는 것 같이 하지 말라." },
          { verse: 3, text: "너는 구제할 때에 오른손의 하는 것을 왼손이 모르게 하여." },
          { verse: 4, text: "은밀한 중에 보시는 너의 아버지가 갚으시리라." },
        ],
      },
    ],
  },
  {
    id: "mark",
    testament: "NT",
    name: "마가복음",
    chapters: [
      {
        chapter: 1,
        verses: [
          { verse: 1, text: "하나님의 아들 예수 그리스도 복음의 시작이라." },
          { verse: 2, text: "선지자 이사야의 글에 보라 내가 내 사자를 네 앞에 보내노니." },
          { verse: 3, text: "광야에 외치는 자의 소리가 있어 가로되 너희는 주의 길을 예비하라." },
          { verse: 4, text: "세례 요한이 이르러 광야에서 죄 사함을 받게 하는 회개의 세례를 전파하니." },
          { verse: 5, text: "온 유대 지방과 예루살렘 사람이 다 나아가 자기 죄를 자복하고." },
        ],
      },
      {
        chapter: 2,
        verses: [
          { verse: 1, text: "수일 후에 예수께서 다시 가버나움에 들어가시니 집에 계신 소문이 들린지라." },
          { verse: 2, text: "많은 사람이 모여서 문 앞에라도 용신할 수 없게 되었는데." },
          { verse: 3, text: "사람들이 한 중풍병자를 네 사람에게 메워 가지고 예수께로 올새." },
          { verse: 4, text: "무리 때문에 데리고 갈 수 없으므로 지붕을 뜯어 내고." },
        ],
      },
    ],
  },
  {
    id: "luke",
    testament: "NT",
    name: "누가복음",
    chapters: [
      {
        chapter: 1,
        verses: [
          { verse: 1, text: "우리 중에 이루어진 사실에 대하여." },
          { verse: 2, text: "처음부터 목격자와 말씀의 일꾼 된 자들의 전하여 준 그대로 내력을 저술하려고 붓을 든 사람이 많은지라." },
          { verse: 3, text: "그 모든 일을 근원부터 자세히 미루어 살핀 나도 데오빌로 각하에게 차례대로 써 보내는 것이 좋은 줄 알았노니." },
          { verse: 4, text: "이는 각하로 그 배운 바의 확실함을 알게 하려 함이로라." },
        ],
      },
      {
        chapter: 2,
        verses: [
          { verse: 1, text: "그 때에 가이사 아구스도가 영을 내려 천하로 다 호적하라 하였으니." },
          { verse: 2, text: "이 호적은 구레뇨가 수리아 총독 되었을 때에 첫번 한 것이라." },
          { verse: 3, text: "모든 사람이 호적하러 각각 고향으로 돌아가매." },
          { verse: 4, text: "요셉도 다윗의 집 족속인고로 갈릴리 나사렛 동네에서 유대를 향하여 베들레헴이라 하는 다윗의 동네로." },
          { verse: 5, text: "그 정혼한 마리아와 함께 호적하러 올라가니 마리아가 이미 잉태되었더라." },
        ],
      },
      {
        chapter: 3,
        verses: [
          { verse: 1, text: "디베료 가이사가 위에 있은지 열 다섯 해 곧 본디오 빌라도가 유대 총독으로." },
          { verse: 2, text: "안나스와 가야바가 대제사장으로 있을 때에 하나님의 말씀이 빈 들에서 사가랴의 아들 요한에게 임한지라." },
          { verse: 3, text: "요한이 요단강 부근 각처에 와서 죄 사함을 얻게 하는 회개의 세례를 전파하니." },
          { verse: 4, text: "선지자 이사야의 책에 쓴 바 광야에 외치는 자의 소리가 있어 가로되." },
        ],
      },
    ],
  },
];

export const KORRV_COPYRIGHT_NOTICE =
  "Public Domain 한국어 성경(USFM 소스) 기반 데이터입니다. 본문 라이선스 및 출처 고지는 배포 전 확정이 필요합니다.";
