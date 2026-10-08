import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { findGym } from "@/lib/gyms";

export const alt = "암장 룰렛";
export const size = { width: 1200, height: 630 };
export const contentType = "image/jpeg";

// 배경 크롭(public/og/gym-roulette-og-bg.jpg, 673×630: 원본 y110~1160을 위아래 여백 포함해 축소)과 레버(64×173)의 좌표. 메인 화면의 슬롯머신과 같은 구도다.
const BG = { w: 673, h: 630 };
const WINDOW = { x: 114, y: 352, w: 440, h: 185 }; // 암장명이 들어가는 가운데 창
const LEVER = { x: 602, y: 270, w: 64, h: 173 };

const dataUri = async (file: string, mime: string) => `data:${mime};base64,${(await readFile(join(process.cwd(), "public/og", file))).toString("base64")}`;

// 공유 결과 스냅샷(JPEG): 슬롯머신 이미지 위에 센터명을 얹어 서버에서 생성(한글 표시를 위해 Pretendard 사용)
export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const gym = findGym((await params).id);
  const name = gym?.name ?? "암장 룰렛";
  const [font, bg, lever] = await Promise.all([
    readFile(join(process.cwd(), "node_modules/pretendard/dist/public/static/alternative/Pretendard-Bold.ttf")),
    dataUri("gym-roulette-og-bg.jpg", "image/jpeg"),
    dataUri("gym-roulette-og-lever.png", "image/png"),
  ]);
  const left = (size.width - BG.w) / 2;
  const fontSize = name.length > 16 ? 36 : name.length > 11 ? 45 : 55;
  const png = new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "linear-gradient(to right, #4b0100, #610001)", fontFamily: "Pretendard" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={bg} width={BG.w} height={BG.h} alt="" style={{ position: "absolute", left, top: 0 }} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={lever} width={LEVER.w} height={LEVER.h} alt="" style={{ position: "absolute", left: left + LEVER.x, top: LEVER.y }} />
        <div style={{ position: "absolute", left: left + WINDOW.x, top: WINDOW.y, width: WINDOW.w, height: WINDOW.h, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 24px", color: "#3a2312", fontSize, lineHeight: 1.2, wordBreak: "keep-all" }}>{name}</div>
      </div>
    ),
    { ...size, fonts: [{ name: "Pretendard", data: font, style: "normal", weight: 700 }] },
  );
  // ImageResponse 는 PNG 만 만들 수 있어(약 530KB) JPEG 로 다시 인코딩해 용량을 1/8 수준(약 60KB)으로 줄인다
  const jpeg = await sharp(Buffer.from(await png.arrayBuffer())).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
  return new Response(new Uint8Array(jpeg), { headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=3600, s-maxage=86400" } });
}
