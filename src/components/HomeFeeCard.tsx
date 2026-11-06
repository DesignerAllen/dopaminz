import CopyAccount from "./CopyAccount";
import { tdsButton } from "./tds";

/** 홈 콜아웃(컴팩트): 미납 개월 수 + 미납 월 배지 + [계좌 복사]. 미납이 없으면 한 줄 완납 문구 */
export default function HomeFeeCard({ months, account }: { months: string[]; account: string }) {
  if (months.length === 0) {
    return (
      <section className="rounded-2xl bg-[#f2f4f6] px-4 py-3">
        <p className="text-[15px] leading-[22.5px] font-semibold text-[#191f28]">이번달까지 모두 납부했어요</p>
      </section>
    );
  }
  return (
    <section className="flex items-center gap-3 rounded-2xl bg-[#f2f4f6] px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-[15px] leading-[22.5px] font-semibold text-[#191f28]">
          회비 <span className="text-[#f04452]">{months.length}개월</span> 미납
        </p>
        <p className="mt-0.5 text-[13px] leading-[19.5px] text-[#6b7684]">{months.map((ym) => `${+ym.slice(5, 7)}월`).join(", ")}</p>
      </div>
      {account && <CopyAccount account={account} label="계좌 복사" className={`${tdsButton("fill")} h-8 flex-none px-3 text-[13px]`} />}
    </section>
  );
}
