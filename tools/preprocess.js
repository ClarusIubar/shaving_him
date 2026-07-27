const fs = require('fs');
const path = require('path');

console.log('=== 데이터 전처리 시작 ===');

// HTML 파싱
function parseArt(html) {
    const m = html.match(/<pre[^>]*>([\s\S]*?)<\/pre>/);
    if (!m) return null;
    const lines = m[1].split('\n');
    
    const result = [];
    for (let r = 0; r < lines.length; r++) {
        const line = lines[r];
        const row = [];
        const re = /<span style="color:rgb\((\d+),(\d+),(\d+)\)">([^<]+)<\/span>/g;
        let match;
        while ((match = re.exec(line)) !== null) {
            let ch = match[4];
            if (ch === '&nbsp;') ch = ' ';
            row.push({
                c: ch,
                r: +match[1], g: +match[2], b: +match[3],
                l: (+match[1] + +match[2] + +match[3]) / 3
            });
        }
        if (row.length > 0) result.push(row);
    }
    return result;
}

// before / after 로드
const beforeHtml = fs.readFileSync(path.join(__dirname, '..', 'before.html'), 'utf8');
const afterHtml = fs.readFileSync(path.join(__dirname, '..', 'after.html'), 'utf8');

const before = parseArt(beforeHtml);
const after = parseArt(afterHtml);

console.log(`Before: ${before.length}행`);
console.log(`After: ${after.length}행`);

// 털 감지 알고리즘 (색상 패턴 기반)
const hairPositions = [];
const candidates = [];

for (let r = 0; r < Math.min(before.length, after.length); r++) {
    const br = before[r], ar = after[r];
    const minC = Math.min(br.length, ar.length);
    for (let c = 0; c < minC; c++) {
        const b = br[c], a = ar[c];
        const diff = Math.abs(b.l - a.l);
        
        // 털 패턴:
        // 1. before가 어둡고 (l < 80)
        // 2. after가 밝아짐 (diff >= 25)
        // 3. before와 after의 색상이 유사하지 않음 (털은 실제로 제거됨)
        if (b.l < 80 && diff >= 25) {
            candidates.push({ r, c, beforeL: b.l, afterL: a.l, diff });
        }
    }
}

console.log(`후보: ${candidates.length}개`);

// 연결성 필터링 (주변에 털이 있으면 유지)
const candidateSet = new Set(candidates.map(h => h.r + ',' + h.c));
const filtered = [];

candidates.forEach(h => {
    const key = h.r + ',' + h.c;
    let neighbors = 0;
    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            if (candidateSet.has((h.r + dr) + ',' + (h.c + dc))) {
                neighbors++;
            }
        }
    }
    // 주변에 최소 1개 이상의 후보가 있으면 유지 (노이즈 제거)
    if (neighbors >= 1) {
        filtered.push({ r: h.r, c: h.c });
    }
});

filtered.forEach(h => hairPositions.push(h));

console.log(`최종 털 위치: ${hairPositions.length}개`);

// after 텍스트 데이터
const afterData = after.map(row => row.map(s => ({
    c: s.c, r: s.r, g: s.g, b: s.b
})));

// before 색상
const colorData = before.map(row => row.map(s => [s.r, s.g, s.b]));

// JSON 출력
const output = {
    rows: before.length,
    cols: Math.max(...before.map(r => r.length)),
    hairCount: hairPositions.length,
    hair: hairPositions,
    text: afterData.map(row => row.map(s => s.c).join('')),
    colors: afterData.map(row => row.map(s => [s.r, s.g, s.b])),
    beforeColors: colorData.map(row => row.map(s => s))
};

const jsonPath = path.join(__dirname, '..', 'game_data.json');
fs.writeFileSync(jsonPath, JSON.stringify(output));
const stats = fs.statSync(jsonPath);
console.log(`\ngame_data.json 생성 완료: ${(stats.size / 1024).toFixed(1)}KB`);
console.log(`압축률: ${((1 - stats.size / (beforeHtml.length + afterHtml.length)) * 100).toFixed(1)}%`);