"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { EXPERIENCES, GENDERS, birthYears } from "@/lib/applications";

type Form = { name: string; birth_year: string; gender: string; instagram_id: string; experience: string; gym_area: string; bouldering_level: string; reason: string };
const EMPTY: Form = { name: "", birth_year: "", gender: "", instagram_id: "", experience: "", gym_area: "", bouldering_level: "", reason: "" };

function Field({ id, label, caption, children }: { id?: string; label: string; caption?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id} className="text-[15px] font-semibold">{label}</Label>
      {caption && <p className="text-[13px] text-muted-foreground">{caption}</p>}
      {children}
    </div>
  );
}

/** 로그인 없이 쓰는 크루 가입 신청서. 모든 항목이 필수이며 하나라도 비어 있으면 제출할 수 없다. */
export default function ApplyForm() {
  const [f, setF] = useState<Form>(EMPTY);
  const [website, setWebsite] = useState(""); // 봇 방지용 숨김 칸
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);
  const years = birthYears();
  const set = (k: keyof Form) => (v: string) => setF((p) => ({ ...p, [k]: v }));
  const complete = Object.values(f).every((v) => v.trim() !== "");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!complete || busy) return;
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/apply", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...f, website }) });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) return setErr(data.error ?? "제출하지 못했어요. 잠시 후 다시 시도해 주세요");
      setDone(true);
      window.scrollTo({ top: 0 });
    } catch {
      setErr("네트워크 오류가 발생했어요");
    } finally {
      setBusy(false);
    }
  }

  const logo = <img src="/logo.svg" alt="도파민즈" className="mx-auto h-9 w-auto" />;

  if (done) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        {logo}
        <h1 className="mt-4 text-[22px] leading-snug font-bold">감사합니다.</h1>
        <p className="text-[15px] leading-relaxed text-muted-foreground">확인 후에 인스타 DM으로 연락드릴게요.</p>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col px-5 pt-8 pb-10">
      {logo}
      <h1 className="mt-5 mb-7 text-center text-[22px] leading-snug font-bold">도파민즈 크루 가입 신청서</h1>

      <form onSubmit={submit} className="grid gap-6" noValidate>
        <Field id="a-name" label="이름">
          <Input id="a-name" required maxLength={50} autoComplete="name" value={f.name} onChange={(e) => set("name")(e.target.value)} className="h-11" />
        </Field>

        <Field id="a-birth" label="나이(생년)">
          <select id="a-birth" required value={f.birth_year} onChange={(e) => set("birth_year")(e.target.value)} className="h-11 w-full rounded-[10px] border border-input bg-white px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 invalid:text-muted-foreground">
            <option value="" disabled>출생년도 선택</option>
            {years.map((y) => <option key={y} value={y}>{y}년</option>)}
          </select>
        </Field>

        <Field label="성별">
          <ToggleGroup type="single" variant="outline" spacing={0} aria-label="성별" className="w-full" value={f.gender} onValueChange={(v) => set("gender")(v)}>
            {GENDERS.map((g) => (
              <ToggleGroupItem key={g} value={g} className="h-11 flex-1 data-[state=on]:bg-primary data-[state=on]:font-semibold data-[state=on]:text-primary-foreground">{g}</ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Field>

        <Field id="a-insta" label="인스타그램 id">
          <div className="flex h-11 items-center rounded-[10px] border border-input bg-white px-3 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
            <span className="text-muted-foreground">@</span>
            <input id="a-insta" required maxLength={30} autoCapitalize="none" autoCorrect="off" spellCheck={false} value={f.instagram_id} onChange={(e) => set("instagram_id")(e.target.value.replace(/^@+/, ""))} className="min-w-0 flex-1 bg-transparent pl-1 text-base outline-none" />
          </div>
        </Field>

        <Field label="클라이밍 경력">
          <div role="radiogroup" aria-label="클라이밍 경력" className="grid gap-2">
            {EXPERIENCES.map((x) => (
              <label key={x} className="flex h-11 cursor-pointer items-center gap-2.5 rounded-[10px] border border-input bg-white px-3 text-[15px] has-checked:border-primary has-checked:bg-accent has-checked:font-semibold">
                <input type="radio" name="experience" value={x} checked={f.experience === x} onChange={() => set("experience")(x)} className="size-4 accent-primary" />
                {x}
              </label>
            ))}
          </div>
        </Field>

        <Field id="a-gym" label="주 암장 및 거주지역" caption="예) 구디, 서울숲 구로">
          <Input id="a-gym" required maxLength={100} value={f.gym_area} onChange={(e) => set("gym_area")(e.target.value)} className="h-11" />
        </Field>

        <Field id="a-level" label="볼더링 난이도" caption="더클라임 기준, 원데이 개수 포함, 예) 핑크 약 10개">
          <Input id="a-level" required maxLength={100} value={f.bouldering_level} onChange={(e) => set("bouldering_level")(e.target.value)} className="h-11" />
        </Field>

        <Field id="a-reason" label="가입 사유" caption="어떤 이유로 도파민즈를 알게되었고 왜 가입하고 싶었나요?">
          <Textarea id="a-reason" required maxLength={2000} rows={5} value={f.reason} onChange={(e) => set("reason")(e.target.value)} />
        </Field>

        {/* 사람에게는 보이지 않는 봇 방지 칸 */}
        <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" value={website} onChange={(e) => setWebsite(e.target.value)} className="absolute -left-[9999px] h-0 w-0 opacity-0" />

        <div className="grid gap-2">
          {err && <p className="text-center text-[13px] text-destructive" role="status">{err}</p>}
          <Button type="submit" disabled={!complete || busy} className="h-12 w-full text-base">제출</Button>
          {!complete && <p className="text-center text-xs text-muted-foreground">모든 항목을 작성해야 제출할 수 있어요</p>}
        </div>
      </form>
    </main>
  );
}
