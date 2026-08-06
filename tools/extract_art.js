// One-time analysis script over before.html/after.html. Those source dumps
// are gitignored (~2.7MB each, not needed to run or test the game) - place
// local copies at the repo root before running this script.
const fs = require('fs');
const path = require('path');

// HTML 파일 읽기
const beforeHtml = fs.readFileSync(path.join(__dirname, '..', 'before.html'), 'utf8');
const afterHtml = fs.readFileSync(path.join(__dirname, '..', 'after.html'), 'utf8');

console.log('before.html 크기:', (beforeHtml.length / 1024).toFixed(1), 'KB');
console.log('after.html 크기:', (afterHtml.length / 1024).toFixed(1), 'KB');

// HTML에서 <pre> 태그 내용 추출
function extractPreContent(html) {
    const preMatch = html.match(/<pre[^>]*>([\s\S]*?)<\/pre>/);
    if (!preMatch) return null;
    const content = preMatch[1];
    // <span style="...">문자</span> 패턴에서 문자만 추출
    return content.replace(/<span[^>]*>/g, '').replace(/<\/span>/g, '').replace(/&nbsp;/g, ' ');
}

const beforeText = extractPreContent(beforeHtml);
const afterText = extractPreContent(afterHtml);

if (!beforeText || !afterText) {
    console.error('Failed to extract pre content');
    process.exit(1);
}

const beforeLines = beforeText.split('\n');
const afterLines = afterText.split('\n');

console.log('Before 라인 수:', beforeLines.length);
console.log('After 라인 수:', afterLines.length);

// Before 첫 줄 길이
console.log('Before 첫 줄 길이:', beforeLines[0]?.length || 0);
console.log('Before 첫 줄(50자):', beforeLines[0]?.substring(0, 50));

// 차이점 찾기 (털 위치 = before에서 색상이 있는 문자)
// before.html의 각 span에서 색상 정보를 함께 추출
function extractSpans(html) {
    const preMatch = html.match(/<pre[^>]*>([\s\S]*?)<\/pre>/);
    if (!preMatch) return [];
    const content = preMatch[1];
    const spanRegex = /<span style="color:rgb\((\d+),(\d+),(\d+)\)">([^<]+)<\/span>/g;
    const spans = [];
    let match;
    let lastIndex = 0;
    let currentLine = 0;
    let currentCol = 0;
    
    // 먼저 줄바꿈 기준으로 라인 배열 만들기
    const lines = content.split('\n');
    
    lines.forEach((line, lineIdx) => {
        const lineSpans = [];
        const localRegex = /<span style="color:rgb\((\d+),(\d+),(\d+)\)">([^<]+)<\/span>/g;
        let m;
        while ((m = localRegex.exec(line)) !== null) {
            const r = parseInt(m[1]), g = parseInt(m[2]), b = parseInt(m[3]);
            lineSpans.push({
                row: lineIdx,
                col: localRegex.lastIndex - m[0].length,
                char: m[4],
                r, g, b,
                brightness: (r + g + b) / 3
            });
        }
        spans.push(lineSpans);
    });
    
    return spans;
}

const beforeSpans = extractSpans(beforeHtml);
const afterSpans = extractSpans(afterHtml);

console.log('\nBefore 스팬 라인 수:', beforeSpans.length);
console.log('첫 번째 라인 스팬 수:', beforeSpans[0]?.length || 0);
console.log('Before 첫 번째 스팬 샘플:', JSON.stringify(beforeSpans[0]?.slice(0, 5)));

// 밝기 기준으로 어두운 문자 = 털로 간주
const hairThreshold = 150;
let hairCount = 0;

// 7~33번째 줄(얼굴 영역)에서 어두운 문자 찾기
const startRow = 7;
const endRow = Math.min(33, beforeSpans.length);

for (let r = startRow; r < endRow; r++) {
    const row = beforeSpans[r];
    if (!row) continue;
    row.forEach(span => {
        if (span.brightness < hairThreshold) {
            hairCount++;
        }
    });
}

console.log('\n털(어두운 문자) 통계:');
console.log('분석 영역: 줄', startRow, '~', endRow);
console.log('어두운 문자(털 후보) 수:', hairCount);

// before와 after 비교: before에는 있고 after에는 없는 색상 영역 찾기
// (털이 제거된 영역)
let diffCount = 0;
const diffPositions = [];

for (let r = 7; r < Math.min(beforeSpans.length, afterSpans.length) && r < 35; r++) {
    const beforeRow = beforeSpans[r];
    const afterRow = afterSpans[r];
    if (!beforeRow || !afterRow) continue;
    
    const minLen = Math.min(beforeRow.length, afterRow.length);
    for (let c = 0; c < minLen; c++) {
        const bs = beforeRow[c];
        const as = afterRow[c];
        if (bs && as && Math.abs(bs.brightness - as.brightness) > 40) {
            diffCount++;
            if (diffPositions.length < 20) {
                diffPositions.push({ row: r, col: c, before: bs.char, after: as.char, bb: bs.brightness.toFixed(0), ab: as.brightness.toFixed(0) });
            }
        }
    }
}

console.log('\nbefore/after 차이점(털 제거 영역) 수:', diffCount);
console.log('차이점 샘플(처음 20개):', JSON.stringify(diffPositions, null, 2));

// JSON 출력
const output = {
    lineCount: beforeLines.length,
    lineLength: beforeLines[0]?.length || 0,
    beforeSamples: beforeSpans.slice(0, 5).map(row => row.slice(0, 10)),
    diffCount,
    diffSamples: diffPositions
};
fs.writeFileSync(path.join(__dirname, 'analysis.json'), JSON.stringify(output, null, 2));
console.log('\n분석 결과가 tools/analysis.json에 저장되었습니다.');