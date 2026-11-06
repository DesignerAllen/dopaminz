import Link from "next/link";
import { tdsButton } from "./tds";

/** 홈(공통 로그인): 개인 로그인 안내 콜아웃. [로그인하기] → 이름 선택 + 비밀번호 설정 → 설정하면 그 크루원으로 로그인되어 홈으로 돌아온다 */
export default function HomeLoginCallout() {
  return (
    <section className="mx-4 mb-3 rounded-2xl bg-[#f2f4f6] px-4 py-3">
      <p className="text-[15px] leading-[22.5px] font-semibold break-keep text-[#191f28]">개인 로그인 기능이 생겼어요.<br />비밀번호를 설정하고 로그인해주세요</p>
      <Link href="/climbmate/start?next=/" className={`${tdsButton("fill")} mt-3 h-9 px-4`}>로그인하기</Link>
    </section>
  );
}
