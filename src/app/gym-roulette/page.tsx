import PageHeader from "@/components/PageHeader";
import GymRoulette from "@/components/GymRoulette";
import { GYMS } from "@/lib/gyms";

export const metadata = { title: "암장 룰렛" };

// 로그인 없이 접근 가능(공유 링크로 들어온 사람도 바로 돌릴 수 있게)
export default function GymRoulettePage() {
  return (
    <>
      <PageHeader title="암장 룰렛" admin={false} back="/" />
      <GymRoulette gyms={GYMS} />
    </>
  );
}
