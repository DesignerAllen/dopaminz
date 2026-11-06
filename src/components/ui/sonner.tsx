"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"
import { Check, Info, TriangleAlert, X, Loader2Icon } from "lucide-react"

/** TDS Toast 스타일: 상단(position top) · 3초 자동 닫힘(duration 3000) · 왼쪽에 24×24 아이콘(leftAddon) + 텍스트.
 *  앱 기본 위치는 화면 위에서 26px(Android) 이므로 offset 26 으로 맞춘다. 배경은 TDS greyOpacity800 계열의 어두운 반투명, 글자는 t6(15/22.5) Medium.
 *  문서에 색·모서리·그림자 값은 없어 어두운 배경 + 흰 글자 + 16px 모서리로 정했다. */
const Icon = ({ bg, children }: { bg: string; children: React.ReactNode }) => (
  <span className="flex size-6 flex-none items-center justify-center rounded-full text-white" style={{ background: bg }}>{children}</span>
)

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      position="top-center"
      duration={3000}
      offset={26}
      mobileOffset={26}
      gap={8}
      className="toaster group"
      icons={{
        success: <Icon bg="#03b26c"><Check className="size-3.5" strokeWidth={3} /></Icon>,
        info: <Icon bg="#6b7684"><Info className="size-3.5" strokeWidth={2.5} /></Icon>,
        warning: <Icon bg="#ffa927"><TriangleAlert className="size-3.5" strokeWidth={2.5} /></Icon>,
        error: <Icon bg="#f04452"><X className="size-3.5" strokeWidth={3} /></Icon>,
        loading: <Loader2Icon className="size-6 animate-spin text-white" />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: "flex w-[calc(100vw-32px)] max-w-[448px] items-center gap-3 rounded-2xl bg-[#191f28]/90 px-4 py-3.5 text-[15px] leading-[22.5px] font-medium text-white shadow-lg backdrop-blur-sm",
          icon: "flex-none",
          content: "min-w-0 flex-1",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
