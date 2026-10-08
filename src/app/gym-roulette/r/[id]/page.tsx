import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Dices, MapPin } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { SlotResultView } from "@/components/SlotMachine";
import { Button } from "@/components/ui/button";
import { findGym } from "@/lib/gyms";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const gym = findGym((await params).id);
  if (!gym) return { title: "암장 룰렛" };
  const title = `암장 룰렛: ${gym.name}`;
  const description = `${gym.area} · 도파민즈 크루 암장 룰렛`;
  // 이미지는 같은 폴더의 opengraph-image 가 자동으로 연결된다
  return { title, description, openGraph: { title, description }, twitter: { card: "summary_large_image", title, description } };
}

// 공유용 결과 페이지(읽기 전용, 로그인 불필요)
export default async function SharedResultPage({ params }: Props) {
  const gym = findGym((await params).id);
  if (!gym) notFound();

  return (
    <>
      <PageHeader title="암장 룰렛" admin={false} back="/gym-roulette" />
      <main className="flex flex-1 flex-col gap-4 pb-4">
        <SlotResultView name={gym.name} />
        <section className="grid grid-cols-2 gap-2 px-4" aria-label="지도 보기">
          <Button asChild variant="outline">
            <a href={`https://map.naver.com/p/search/${encodeURIComponent(gym.name)}`} target="_blank" rel="noopener noreferrer"><MapPin data-icon="inline-start" />네이버지도</a>
          </Button>
          <Button asChild variant="outline">
            <a href={`https://map.kakao.com/link/search/${encodeURIComponent(gym.name)}`} target="_blank" rel="noopener noreferrer"><MapPin data-icon="inline-start" />카카오지도</a>
          </Button>
          <Button asChild className="col-span-2">
            <Link href="/gym-roulette"><Dices data-icon="inline-start" />나도 돌리기</Link>
          </Button>
        </section>
      </main>
    </>
  );
}
