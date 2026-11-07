import ApplyForm from "@/components/ApplyForm";

export const metadata = { title: "도파민즈 크루 가입 신청서" };

// 로그인 없이 접근하는 공개 화면
export default function ApplyPage() {
  return <ApplyForm />;
}
