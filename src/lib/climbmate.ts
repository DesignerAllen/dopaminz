// 클메이트 찾기: 문항·유형·궁합 정적 데이터와 순수 함수 (docs/02-클메이트-찾기.md)
// 축 순서: 0 교류 성향, 1 움직임 방식, 2 세션 운영, 3 문제 접근. 응답·유형 키에서 0 = 왼쪽 성향, 1 = 오른쪽 성향.

export type Side = 0 | 1;

export const AXES = [
  { name: "교류 성향", left: "교류형", right: "독립형", leftDesc: "사람이 있어야 힘이 난다", rightDesc: "내 트라이가 더 중요하다" },
  { name: "움직임 방식", left: "역동형", right: "제어형", leftDesc: "닿을 것 같으면 던진다", rightDesc: "뜯어서 간다" },
  { name: "세션 운영", left: "집중형", right: "탐색형", leftDesc: "될 때까지 그것만", rightDesc: "찍먹부터" },
  { name: "문제 접근", left: "분석형", right: "실행형", leftDesc: "벽이랑 먼저 회의", rightDesc: "일단 붙고 생각" },
] as const;

export type Question = { axis: 0 | 1 | 2 | 3; q: string; a: [string, Side]; b: [string, Side] };

/** 출제 순서대로. 선택지 좌우 순서는 문항마다 섞여 있다. 화면에는 성향(Side)을 표시하지 않는다 */
export const QUESTIONS: Question[] = [
  { axis: 0, q: "암장에 도착했는데 아는 크루원이 한 명도 없다면?", a: ["옆 사람한테 “이거 풀어보셨어요?” 말을 건다", 0], b: ["오히려 좋아, 내 페이스대로 간다", 1] },
  { axis: 1, q: "다음 홀드가 애매하게 멀다.", a: ["발 하나 더 올려서 뜯어서 간다", 1], b: ["닿을 것 같으면 일단 던진다", 0] },
  { axis: 2, q: "오늘 세션이 끝났다. 더 뿌듯한 쪽은?", a: ["2주째 붙잡던 그 문제를 드디어 완등", 0], b: ["새 문제 10개 찍먹, 7개 완등", 1] },
  { axis: 3, q: "처음 보는 문제 앞에서 나는", a: ["일단 붙고 생각한다", 1], b: ["손발 순서를 다 그려보고 붙는다", 0] },
  { axis: 0, q: "누가 내 트라이를 보면서 “가자!!” 외치면?", a: ["고맙지만 살짝 부담된다", 1], b: ["없던 힘이 생긴다", 0] },
  { axis: 1, q: "내가 더 짜릿한 순간은?", a: ["다이노를 한 방에 잡았을 때", 0], b: ["슬랩에서 미끄러질 듯 버텨냈을 때", 1] },
  { axis: 2, q: "세팅이 새로 바뀐 날", a: ["전 구역을 한 바퀴 돌면서 맛보기", 1], b: ["제일 끌리는 하나를 정해서 끝까지", 0] },
  { axis: 3, q: "남이 먼저 푸는 걸 봤다면?", a: ["베타를 참고해서 내 동선을 다시 짠다", 0], b: ["보긴 봤는데 결국 내 방식대로", 1] },
  { axis: 0, q: "쉬는 시간에 나는 주로", a: ["다음 루트를 보면서 혼자 이미지 트레이닝", 1], b: ["매트에 앉아 수다 떨며 남의 트라이 응원", 0] },
  { axis: 1, q: "완등 영상을 다시 본다면 듣고 싶은 말은?", a: ["“되게 깔끔하게 올라가네”", 1], b: ["“와 미쳤다, 저걸 뛰네”", 0] },
  { axis: 2, q: "같은 문제를 5트째 실패했다.", a: ["6트, 7트… 될 때까지", 0], b: ["일단 다른 거 하고 나중에 다시", 1] },
  { axis: 3, q: "막히는 구간이 생기면", a: ["그 구간만 계속 붙어서 몸으로 익힌다", 1], b: ["내려와서 벽 앞에서 손으로 허공 시뮬레이션", 0] },
];

/** 12문항 응답(각 0/1 = 고른 선택지의 성향) → 축별 오른쪽 선택 수(0~3) */
export function axisCounts(answers: number[]): number[] {
  const c = [0, 0, 0, 0];
  QUESTIONS.forEach((q, i) => { if (answers[i] === 1) c[q.axis] += 1; });
  return c;
}

/** 유형 키: 축별로 2개 이상 고른 쪽(0 왼쪽 / 1 오른쪽). 예: '0101' */
export const typeKeyOf = (counts: number[]) => counts.map((n) => (n >= 2 ? "1" : "0")).join("");

/** 2:1 로 갈린 축 = 경계형(1 또는 2). 0, 3 은 확신형 */
export const isBorderline = (n: number) => n === 1 || n === 2;

export function judge(answers: number[]) {
  const axes = axisCounts(answers);
  return { axes, typeKey: typeKeyOf(axes) };
}

/** 결과 주소용 코드: 축별 오른쪽 선택 수 4자리(예: '0121'). 같은 코드면 같은 결과 화면을 재현한다 */
export const codeOf = (axes: number[]) => axes.join("");
export const parseCode = (code: string): number[] | null => (/^[0-3]{4}$/.test(code) ? code.split("").map(Number) : null);

export type ClimbType = { key: string; alias: string; catch: string; desc: string; strengths: string[]; tip: string };

// 조합 순서: 교류→움직임→세션→접근, 왼쪽 성향부터(0000 … 1111)
const T = (alias: string, catchphrase: string, desc: string, strengths: string, tip: string, i: number): ClimbType => ({
  key: i.toString(2).padStart(4, "0"), alias, catch: catchphrase, desc, strengths: strengths.split(", "), tip,
});

export const TYPES: ClimbType[] = [
  T("작전회의 대장", "작전 짜고 다 같이 터뜨리는 리더", "한 문제를 정하면 크루를 모아 베타 회의를 엽니다. 분석은 꼼꼼한데 마지막 한 무브는 과감하게 던지는 반전 매력이 있어요.", "베타 공유, 프로젝트 끈기, 크루 결집", "회의가 길어지면 트라이 수가 줄어요. 3분 보고 일단 붙어보기.", 0),
  T("불꽃 돌격대장", "응원 소리에 불붙는 돌격형", "한 문제에 꽂히면 될 때까지 몸을 던집니다. 주변 응원이 커질수록 더 높이 뛰는 타입이에요.", "폭발력, 회복력, 분위기 점화", "같은 실패가 세 번 반복되면 잠깐 내려와서 베타를 바꿔보기.", 1),
  T("암장 탐험대장", "새 세팅 날 제일 먼저 도착하는 사람", "구역을 넓게 돌며 문제를 읽고, 재밌는 문제를 발견하면 크루를 불러 모읍니다. 다이나믹한 무브를 머리로 먼저 설계하는 타입이에요.", "문제 발굴, 루트 리딩, 크루 가이드", "아쉽게 놓친 문제 하나는 다음 세션 프로젝트로 남겨두기.", 2),
  T("파티 다이노", "암장을 놀이터로 만드는 사람", "이 문제 저 문제 즐겁게 던져보며 크루 분위기를 끌어올립니다. 떨어져도 웃으면서 다음 문제로 넘어가요.", "순발력, 친화력, 다양한 무브 경험", "완등 직전 문제는 한 번만 더 붙어보기. 아쉬운 그 하나가 레벨업 열쇠예요.", 3),
  T("베타 코치", "벽을 읽어주는 크루의 내비게이션", "정확한 발 위치와 무게 중심으로 한 문제를 완성도 있게 풀고, 그 베타를 아낌없이 나눠줍니다.", "정교한 무브, 베타 해석, 친절한 설명", "가끔은 계산 없이 던져보기. 의외의 루트가 열려요.", 4),
  T("끈기 응원단장", "버티는 힘도, 응원하는 힘도 최고", "한 문제를 몸으로 반복하며 조금씩 정교하게 다듬습니다. 옆 사람 트라이도 끝까지 응원하는 크루의 버팀목이에요.", "지구력, 꾸준함, 크루 응원", "막힌 구간은 다른 사람 베타를 한 번 참고해보기.", 5),
  T("친절한 루트 해설가", "구역마다 해설이 붙는 사람", "여러 문제를 섬세하게 읽고 깔끔하게 풀어냅니다. 처음 온 크루원에게 딱 맞는 문제를 추천해 주는 사람이에요.", "넓은 시야, 정확한 풋워크, 신입 케어", "내 한계 근처 문제 하나를 골라 집중 세션을 가져보기.", 6),
  T("분위기 메이커", "있으면 세션이 즐거워지는 사람", "부담 없이 이것저것 붙어보며 부드럽고 안정적인 무브로 하나씩 해치웁니다. 같이 있으면 시간이 빨리 가요.", "안정감, 유연함, 웃음", "다이나믹 무브 문제도 하나씩 섞어보기.", 7),
  T("고독한 저격수", "조용히 조준하고 한 방에 꽂는 사람", "혼자 문제를 오래 관찰하다가, 결정적인 순간 과감한 무브로 끝냅니다.", "집중력, 결단력, 크럭스 돌파", "막힐 땐 크루에게 베타 한마디 물어보기.", 8),
  T("무한 트라이 머신", "될 때까지, 말없이 계속", "이어폰 끼고 한 문제에 붙어 몸으로 해답을 찾습니다. 트라이 수가 곧 실력이 되는 타입이에요.", "체력, 근성, 실전 감각", "휴식 시간 지키기. 쉬어야 다음 트라이가 살아요.", 9),
  T("조용한 사냥꾼", "구역을 돌며 사냥감을 고르는 사람", "혼자 여러 문제를 읽고, 될 만한 걸 골라 다이나믹하게 처리합니다.", "문제 선별, 효율, 리딩", "놓친 문제를 기록해두면 다음 목표가 생겨요.", 10),
  T("자유로운 영혼", "벽 위의 즉흥 연주자", "정해진 계획 없이 끌리는 대로 붙고, 몸이 가는 대로 던집니다.", "창의적 무브, 적응력, 즐거움", "한 달에 한 문제는 끝까지 붙잡아보기.", 11),
  T("벽 위의 체스기사", "다섯 수 앞을 읽는 사람", "한 문제를 혼자 깊게 파고들어 가장 효율적인 수순을 찾아냅니다.", "수읽기, 정밀함, 문제 해결력", "생각이 길어지면 첫 세 무브만 일단 붙어보기.", 12),
  T("묵묵한 장인", "손끝으로 완성도를 다듬는 사람", "같은 문제를 반복하며 무브 하나하나를 몸에 새깁니다. 완등보다 깔끔한 완등이 목표예요.", "꾸준함, 정교함, 몸의 감각", "가끔은 다른 사람과 세션하며 새 베타 흡수하기.", 13),
  T("고요한 관찰자", "보는 것만으로도 배우는 사람", "여러 문제와 다른 사람의 트라이를 관찰하며, 섬세한 풋워크로 하나씩 풀어갑니다.", "관찰력, 밸런스, 차분함", "관찰한 베타를 크루에게 공유하면 대화가 시작돼요.", 14),
  T("마이페이스 산책러", "암장을 산책하듯 즐기는 사람", "내 속도로 이것저것 부드럽게 올라가며 클라이밍 자체를 즐깁니다.", "꾸준한 재미, 안정감, 여유", "가끔 크루 세션에 섞이면 새로운 문제를 만나요.", 15),
];

export const findType = (key: string) => TYPES.find((t) => t.key === key) ?? null;
const byAlias = (alias: string) => TYPES.find((t) => t.alias === alias)!.key;

/** 최고 궁합 8쌍과 문구 (서로를 가리킨다) */
const BEST_PAIRS: [string, string, string][] = [
  ["작전회의 대장", "끈기 응원단장", "한 명은 작전을 짜고 한 명은 끝까지 버팁니다. 둘이면 2주짜리 프로젝트도 끝나요."],
  ["불꽃 돌격대장", "베타 코치", "던지는 사람과 읽는 사람. 코치가 베타를 주면 돌격대장이 바로 증명합니다."],
  ["암장 탐험대장", "분위기 메이커", "새 세팅 날 제일 먼저 도착해서 제일 많이 웃고 가는 조합."],
  ["파티 다이노", "친절한 루트 해설가", "해설가가 길을 보여주면 다이노가 그 길을 날아갑니다."],
  ["고독한 저격수", "묵묵한 장인", "말은 없어도 서로의 트라이를 존중하는, 조용하지만 단단한 조합."],
  ["무한 트라이 머신", "벽 위의 체스기사", "체스기사가 수를 읽고 트라이 머신이 그 수를 몸으로 확인합니다."],
  ["조용한 사냥꾼", "마이페이스 산책러", "각자 돌다가 같은 문제 앞에서 마주치는, 부담 없는 동행."],
  ["자유로운 영혼", "고요한 관찰자", "관찰자는 자유로운 영혼의 움직임에서 영감을 얻고, 그 반대도 마찬가지."],
];
const PAIR_TEXT = new Map<string, string>();
for (const [a, b, text] of BEST_PAIRS) {
  PAIR_TEXT.set(`${byAlias(a)}|${byAlias(b)}`, text);
  PAIR_TEXT.set(`${byAlias(b)}|${byAlias(a)}`, text);
}
export const bestPairText = (a: string, b: string) => PAIR_TEXT.get(`${a}|${b}`) ?? null;

// 궁합 가중치: [같으면 +, 다르면 +] 중 해당하는 쪽. 축 순서: 교류, 움직임, 세션, 접근
const WEIGHT: { w: number; want: "same" | "diff" }[] = [
  { w: 2, want: "same" },
  { w: 1, want: "diff" },
  { w: 3, want: "same" },
  { w: 2, want: "diff" },
];

/** 유형 단위 궁합 점수(0~8). 화면에는 표시하지 않는다 */
export function score(a: string, b: string): number {
  return WEIGHT.reduce((sum, { w, want }, i) => sum + ((a[i] === b[i]) === (want === "same") ? w : 0), 0);
}

/** 사람 단위 궁합 점수: 경계형(2:1) 축은 가중치를 절반만 반영한다 */
export function personScore(a: { key: string; axes: number[] }, b: { key: string; axes: number[] }): number {
  return WEIGHT.reduce((sum, { w, want }, i) => {
    if ((a.key[i] === b.key[i]) !== (want === "same")) return sum;
    return sum + (isBorderline(a.axes[i]) || isBorderline(b.axes[i]) ? w / 2 : w);
  }, 0);
}

export type MateKind = "best" | "good" | "new";
export const MATE_LABEL: Record<MateKind, string> = { best: "최고의 클메이트", good: "잘 맞는 클메이트", new: "같이 가면 새로운 경험" };

/** 나를 뺀 15유형을 점수순으로 정렬해 1위·2위·최하위를 고른다(각각 8점/7점/0점으로 유일) */
export function rankTypes(myKey: string): { kind: MateKind; type: ClimbType }[] {
  const ranked = TYPES.filter((t) => t.key !== myKey).sort((x, y) => score(myKey, y.key) - score(myKey, x.key));
  return [
    { kind: "best", type: ranked[0] },
    { kind: "good", type: ranked[1] },
    { kind: "new", type: ranked[ranked.length - 1] },
  ];
}

/** 유형 단위 관계 라벨(해당 없으면 null) */
export function mateKindOf(myKey: string, otherKey: string): MateKind | null {
  return rankTypes(myKey).find((r) => r.type.key === otherKey)?.kind ?? null;
}

/** 유형 키별 크루원 이름(나 제외, 이름순) */
export function namesByType(crew: { member_id: number; name: string; type_key: string }[], meId: number): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const p of crew) if (p.member_id !== meId) (out[p.type_key] ??= []).push(p.name);
  for (const k in out) out[k].sort((a, b) => a.localeCompare(b, "ko"));
  return out;
}
