import { ViewTransition } from "react";

/** 화면 전환 애니메이션(React ViewTransition). 템플릿은 이동할 때마다 새로 만들어져서 enter/exit 가 동작한다.
 *  앞으로 가는 이동(transitionTypes=["nav-forward"])은 왼쪽으로, 뒤로 가는 이동("nav-back")은 오른쪽으로 슬라이드한다.
 *  타입이 없는 이동(브라우저 뒤로가기, 새로고침 등)은 애니메이션 없이 바로 바뀐다. */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition
      enter={{ "nav-forward": "nav-forward", "nav-back": "nav-back", default: "none" }}
      exit={{ "nav-forward": "nav-forward", "nav-back": "nav-back", default: "none" }}
      default="none"
    >
      <div className="flex flex-1 flex-col">{children}</div>
    </ViewTransition>
  );
}
