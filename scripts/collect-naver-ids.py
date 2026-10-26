#!/usr/bin/env python3
"""climbing-gyms-kakao.csv 기준으로 네이버지도 플레이스 ID를 수집한다.

m.search.naver.com 모바일 검색(where=m_local) 결과에서 후보를 파싱하고,
암장명 유사도 + 주소(시/구) 일치로 최적 후보를 고른다.
결과: docs/data/climbing-gyms-naver.csv (원본 CSV + 네이버ID, 네이버명, 네이버주소, 매칭점수, 매칭상태)
"""
import csv, html, re, sys, time, urllib.parse, urllib.request
from difflib import SequenceMatcher
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "docs" / "data"
SRC = DATA / "climbing-gyms-kakao.csv"
OUT = DATA / "climbing-gyms-naver.csv"
UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148"
STOP = ("클라이밍", "암장", "짐", "센터", "볼더링", "클라임")


def fetch(query):
    url = "https://m.search.naver.com/search.naver?where=m_local&query=" + urllib.parse.quote(query)
    for _ in range(3):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            return urllib.request.urlopen(req, timeout=15).read().decode("utf-8", "ignore")
        except Exception:
            time.sleep(2)
    return ""


def parse(page):
    out = []
    for m in re.finditer(r'<li class="VLTHu"[^>]*data-loc_plc-doc-id="(\d+)">(.*?)</li>', page, re.S):
        text = html.unescape(re.sub(r"<[^>]+>", "|", m.group(2)))
        parts = [p.strip() for p in re.split(r"\|+", text) if p.strip()]
        # 이름은 '네이버페이/톡톡/업종' 등이 나오기 전까지의 조각
        name_parts = []
        for p in parts:
            if p in ("네이버페이", "톡톡", "암벽등반", "스포츠시설") or p.startswith(("영업", "오늘", "매주", "현재 위치")):
                break
            name_parts.append(p)
        name = " ".join(name_parts)
        addr = next((p for p in parts if re.match(r"^(서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주)", p)), "")
        out.append((m.group(1), name, addr))
    return out


def norm(s):
    s = re.sub(r"[\s·\-_()]", "", s)
    return s


def core(s):
    s = norm(s)
    for w in STOP:
        s = s.replace(w, "")
    return s


def score(row, cand):
    _, cname, caddr = cand
    a, b = core(row["암장명"]), core(cname)
    sim = SequenceMatcher(None, a, b).ratio() if a and b else 0
    if a and b and (a in b or b in a):
        sim = max(sim, 0.9)
    # 주소: 시도 + 구/군 일치 여부
    ra = row["주소"].split()
    ca = caddr.split()
    addr_ok = len(ra) >= 2 and len(ca) >= 2 and ra[1] == ca[1]
    return sim + (0.3 if addr_ok else 0), addr_ok


def main():
    rows = list(csv.DictReader(open(SRC, encoding="utf-8-sig")))
    limit = int(sys.argv[1]) if len(sys.argv) > 1 else len(rows)
    result = []
    for i, row in enumerate(rows[:limit], 1):
        gu = row["주소"].split()[1] if len(row["주소"].split()) > 1 else ""
        cands, seen = [], set()
        short = re.sub(r"(클라이밍)?짐$", "", row["암장명"].replace(" ", ""))
        for q in (f"{row['암장명']}", f"{gu} {row['암장명']}", f"{gu} {short} 클라이밍", " ".join(row["주소"].split()[:3]) + " 클라이밍"):
            for c in parse(fetch(q)):
                if c[0] not in seen:
                    seen.add(c[0])
                    cands.append(c)
            if cands and any(score(row, c)[0] >= 1.1 for c in cands):
                break
            time.sleep(0.4)
        best, best_s, best_ok = None, 0, False
        for c in cands:
            s, ok = score(row, c)
            if s > best_s:
                best, best_s, best_ok = c, s, ok
        status = "매칭" if best and best_s >= 1.1 else ("확인필요" if best and best_s >= 0.8 else "미발견")
        pid, nname, naddr = best if best and status != "미발견" else ("", "", "")
        result.append({**row, "네이버ID": pid, "네이버명": nname, "네이버주소": naddr,
                       "매칭점수": f"{best_s:.2f}" if best else "", "매칭상태": status})
        print(f"[{i}/{len(rows)}] {row['암장명']} -> {nname} {pid} ({status} {best_s:.2f})", flush=True)
        time.sleep(0.4)
    with open(OUT, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(result[0].keys()))
        w.writeheader()
        w.writerows(result)
    from collections import Counter
    print(Counter(r["매칭상태"] for r in result))


main()
