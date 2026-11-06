import Link from "next/link";
import { Settings, Settings2 } from "lucide-react";
import { requireViewer } from "@/lib/guard";
import { loadProfile } from "@/lib/climb-data";
import { findType, TYPES } from "@/lib/climbmate";
import { loadMemberName } from "@/lib/member-auth";
import { loadActiveMembers, loadMemberPayments, loadNotice } from "@/lib/status-data";
import { loadCatalog, loadRequests } from "@/lib/tickets";
import { kindOf, miToYm, todayKst, ymToMi } from "@/lib/payment-rules";
import { readDevCase } from "@/lib/dev-case";
import { LogoutIconButton } from "@/components/LogoutButton";
import HomeLoginCallout from "@/components/HomeLoginCallout";
import HomeFeeCard from "@/components/HomeFeeCard";
import HomeTicketCard, { type HomeTicket } from "@/components/HomeTicketCard";
import { AssetText, Badge, ListRow, press } from "@/components/tds";

export default async function HomePage() {
  const real = await requireViewer("/", { adminTo: "/admin" });
  const dev = await readDevCase(); // 로컬 개발 전용 케이스(운영에서는 null)
  // 로컬 [케이스] "공통 로그인": 개인 로그인 정보를 무시하고 공통 로그인 화면으로 본다(세션·DB 변경 없음)
  const session = dev?.login === "common" ? { ...real, mid: undefined } : real;
  // 개인 로그인(mid)이면 내 클메이트 결과 카드를 맨 위에 보여 준다. 공통 로그인은 기존 홈 그대로
  const [members, name, profile] = await Promise.all([
    loadActiveMembers(),
    session.mid ? loadMemberName(session.mid) : null,
    session.mid ? loadProfile(session.mid) : null,
  ]);
  const realType = profile ? findType(profile.type_key) : null;
  // 로컬 [케이스]: 등록(실제 유형이 있으면 그것, 없으면 첫 유형)/미등록으로 화면만 바꾼다
  const type = dev?.climb === "none" ? null : dev?.climb === "done" ? (realType ?? TYPES[0]) : realType;

  // 개인 로그인: 내 회비 미납 개월 수 + 사용일이 오늘 이후인 내 크루권(사용일 당일까지, 다음 날부터 숨김)
  const today = todayKst();
  let unpaidMonths: string[] = [];
  let centers: Awaited<ReturnType<typeof loadCatalog>>["centers"] = [];
  let account = "";
  let tickets: HomeTicket[] = [];
  if (session.mid) {
    const me = members.find((m) => m.id === session.mid);
    const [pays, notice, { requests }, catalog] = await Promise.all([loadMemberPayments(session.mid), loadNotice(), loadRequests(), loadCatalog()]);
    centers = catalog.centers;
    account = notice.notice_account;
    if (me) {
      const paid = new Map(pays.map((p) => [p.year_month, p]));
      const curYm = today.slice(0, 7);
      for (let mi = ymToMi(me.joined_at.slice(0, 7)); mi <= ymToMi(curYm); mi++) {
        const ym = miToYm(mi);
        if (kindOf(me.joined_at, ym, paid.get(ym), curYm) === "unpaid") unpaidMonths.push(ym);
      }
    }
    const dayMs = 86400000;
    tickets = requests
      .filter((r) => r.status === "active" && r.used_on.slice(0, 10) >= today && r.people.some((p) => p.member_id === session.mid && !p.canceled_at))
      .sort((a, b) => a.used_on.localeCompare(b.used_on))
      .map((r) => ({
        id: r.id,
        usedOn: r.used_on,
        center: r.center_name,
        branch: r.branch_name,
        code: centers.find((c) => c.id === r.center_id)?.entry_code ?? null,
        dday: Math.round((Date.parse(r.used_on.slice(0, 10)) - Date.parse(today)) / dayMs),
      }));
  }

  // 로컬 [케이스] 모드: 화면에 보이는 값만 바꾼다(DB 변경 없음). 계좌·센터·지점 등은 실제 DB 값을 그대로 쓴다
  if (dev?.fee) {
    const n = dev.fee === "unpaid1" ? 1 : dev.fee === "unpaid3" ? 3 : 0;
    const cur = ymToMi(today.slice(0, 7));
    unpaidMonths = Array.from({ length: n }, (_, i) => miToYm(cur - n + 1 + i));
  }
  if (dev?.ticket === "none") tickets = [];
  else if (dev?.ticket) {
    const d = dev.ticket === "d3" ? 3 : 0;
    const on = new Date(Date.parse(today) + d * 86400000).toISOString().slice(0, 10);
    const c = centers.find((x) => x.branches.length > 0) ?? centers[0];
    tickets = c ? [{ id: -1, usedOn: on, center: c.name, branch: c.branches[0]?.name ?? null, code: c.entry_code ?? null, dday: d }] : [];
  }

  return (
    <>
      <header className="sticky top-0 z-(--z-page-head) flex h-14 items-center bg-white pr-6 pl-6">
        <h1 className="flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="도파민즈 크루" width={820} height={216} className="h-7 w-auto" />
        </h1>
      </header>
      <main className="flex flex-col bg-white pb-2">
        {/* Top: 인사말(t3 22/31 bold) + 보조 문구(t6 15/22.5 grey700) */}
        <div className="flex items-start justify-between gap-3 pt-3 pr-3 pb-4 pl-6">
          <div className="min-w-0">
            <h2 className="text-[22px] leading-[31px] font-bold text-[#191f28]">{name ? `${name}님, 안녕하세요` : "도파민즈 크루에 오신 걸 환영해요"}</h2>
            <p className="mt-1 text-[15px] leading-[22.5px] text-[#4e5968]">오늘도 즐겁게 운동해요</p>
          </div>
          {session.mid ? (
          <Link href="/settings" aria-label="설정" className={`flex size-10 flex-none items-center justify-center rounded-full text-[#6b7684] ${press} active:bg-[#f2f4f6]`}>
            <Settings className="size-[22px]" strokeWidth={1.8} />
          </Link>
          ) : (
            <LogoutIconButton />
          )}
        </div>
        {session.mid && (
          <div className="flex flex-col gap-3 px-4 pb-4">
            <HomeFeeCard months={unpaidMonths} account={account} />
            {tickets.length > 0 && <HomeTicketCard tickets={tickets} />}
          </div>
        )}
        {!session.mid && <HomeLoginCallout />}
        <ListRow href="/notices" left={<AssetText>📢</AssetText>} top="크루 규정 및 공지사항" bottom="공지사항" withArrow />
        {session.mid ? (
          <ListRow
            href={type ? "/climbmate/me" : "/climbmate/test"}
            left={<AssetText>🧗</AssetText>}
            top={type ? "내 클라이밍 유형" : "내 유형을 알아볼까요?"}
            bottom={type ? type.alias : "12문항, 약 2분이면 끝나요"}
            right={type ? undefined : <Badge size="small" color="red" variant="fill">내 유형은?</Badge>}
            withArrow
          />
        ) : (
          <ListRow href="/climbmate" left={<AssetText>🧗</AssetText>} top="내 유형을 알아볼까요?" bottom="12문항, 약 2분이면 끝나요" right={<Badge size="small" color="red" variant="fill">내 유형은?</Badge>} withArrow />
        )}
        <ListRow href="/members" left={<AssetText>👥</AssetText>} top="우리 크루원을 확인해보세요" bottom={`${members.length}명의 크루원`} withArrow />
        <ListRow href="/status" left={<AssetText>💰</AssetText>} top="매달 납부 현황 확인" bottom="회비 납부 현황" withArrow />
        <ListRow href="/tickets" left={<AssetText>🎟️</AssetText>} top="서울숲, 손상원에서 사용할 수 있어요" bottom="크루권 신청" withArrow />
        <ListRow href="/gym-roulette" left={<AssetText>🎲</AssetText>} top="오늘 어디 갈지 고민될 때" bottom="암장 룰렛" withArrow />
      </main>
      <footer className="mt-auto flex items-center justify-start bg-white p-4">
        <Link href="/admin/login" aria-label="관리자 모드" className={`flex size-10 items-center justify-center rounded-full text-[#8b95a1] ${press} active:bg-[#f2f4f6]`}>
          <Settings2 className="size-[22px]" strokeWidth={1.8} />
        </Link>
      </footer>
    </>
  );
}
