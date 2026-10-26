import { requireViewer } from "@/lib/guard";
import { TYPES, judge, namesByType } from "@/lib/climbmate";
import PageHeader from "@/components/PageHeader";
import ClimbResult from "@/components/ClimbResult";
import ShareResultButton from "@/components/ShareResultButton";

type CrewEntry = { member_id: number; name: string; type_key: string; axes: number[] };

export const metadata = { title: "클메이트 예시 화면" };

const NAMES = ["김하늘", "이준호", "박서연", "최민재", "정유진", "강도윤", "조은서", "윤지후", "장서윤", "임태현", "한소희", "오지민", "서현우", "신예린", "권도현", "황수아", "안재민", "송다은", "류시우", "문채원"];

// 예시용 가짜 데이터(DB 저장 없음): 20명의 응답을 서로 다르게 만든다. 내 응답은 아래 ME
const ME = [0, 1, 0, 1, 0, 1, 0, 1, 1, 0, 0, 1];
function fake(i: number): CrewEntry {
  const answers = ME.map((_, q) => (((i + 3) * 2654435761 >>> (q + i)) & 1 ? 1 : 0));
  const { axes, typeKey } = judge(answers);
  return { member_id: 100 + i, name: NAMES[i], type_key: typeKey, axes };
}

export default async function ClimbDemoPage() {
  await requireViewer("/climbmate/demo", { adminTo: "/admin" });
  const { axes, typeKey } = judge(ME);
  const me: CrewEntry = { member_id: 1, name: "나", type_key: typeKey, axes };
  const crew = [me, ...NAMES.map((_, i) => fake(i))];
  const dist = TYPES.map((t) => ({ t, n: crew.filter((c) => c.type_key === t.key).length })).filter((d) => d.n > 0);

  return (
    <>
      <PageHeader title="예시 화면 (크루원 20명)" admin={false} back="/climbmate" />
      <main className="flex flex-1 flex-col gap-6 px-5 pt-3 pb-7">
        <p className="rounded-[10px] bg-secondary p-3 text-xs leading-relaxed text-muted-foreground">가상의 크루원 20명이 결과를 저장한 상태를 가정한 예시예요. 실제 데이터가 아닙니다.</p>
        <ClimbResult axes={me.axes} crewNames={namesByType(crew, me.member_id)} />
        <section aria-label="예시 크루원 유형 분포" className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-muted-foreground">예시 참여자 유형 분포 (나 포함 {crew.length}명)</h3>
          <ul className="flex flex-wrap gap-1.5">
            {dist.map(({ t, n }) => <li key={t.key} className="rounded-full bg-secondary px-3 py-1.5 text-sm">{t.alias} {n}</li>)}
          </ul>
        </section>
        <ShareResultButton title="내 클메이트 유형" path="/climbmate" />
      </main>
    </>
  );
}
