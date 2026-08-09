const KEY = 'a9d4231e639d7f9bf805ffaa2cdf5d32';

function generateFallbackCandidates(road, jibun) {
  const out = [];
  const seen = new Set();
  function push(q) {
    if (!q) return;
    const norm = q.trim().replace(/\s+/g, " ");
    if (!norm || norm.length < 3) return;
    if (seen.has(norm)) return;
    seen.add(norm);
    out.push(norm);
  }
  const stripParen = (s) => s.replace(/\s*\([^)]*\)\s*/g, " ").trim();
  const bases = [];
  if (jibun) bases.push(stripParen(jibun));
  if (road) bases.push(stripParen(road));
  const RX_BUNJI = /\s+\d+(-\d+)?(번지)?\s*$/;
  const RX_GIL = /\s+[^\s]*(번길|로|가)\s*$/;
  const RX_RI = /\s+[^\s]*(리|동)\s*$/;
  for (const base of bases) {
    let s = base;
    push(s);
    const noBunji = s.replace(RX_BUNJI, "").trim();
    push(noBunji);
    if (noBunji && noBunji !== s) {
      const noGil = noBunji.replace(RX_GIL, "").trim();
      push(noGil);
      if (noGil && noGil !== noBunji) {
        const noRi = noGil.replace(RX_RI, "").trim();
        push(noRi);
      }
    }
  }
  return out;
}

function search(q) {
  return new Promise((resolve, reject) => {
    const url = 'https://dapi.kakao.com/v2/local/search/address.json?query=' +
      encodeURIComponent(q);
    const req = require('https').get(url, { headers: { Authorization: 'KakaoAK ' + KEY } }, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          resolve({ q, docs: data.documents || [], meta: data.meta });
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
  });
}

(async () => {
  const cases = [
    { name: '시산방학길', road: '전라남도 고흥군 도양읍 시산방학길 6-1', jibun: '전라남도 고흥군 도양읍 시산리 6-1' },
    { name: '마송리 (kia)', road: '경기도 김포시 통진읍 율마로438번길 34-24', jibun: '경기도 김포시 통진읍 마송리 34-24' },
    { name: '면지역', road: '경상남도 창원시 의창구 대산면 우학리 143', jibun: '' },
    { name: '번지 chỉ', road: '서울특별시 송파구 올림픽로 123', jibun: '서울특별시 송파구 잠실동 123' },
  ];
  for (const tc of cases) {
    console.log('\n================');
    console.log('Case: ' + tc.name);
    console.log('  road:', tc.road);
    console.log('  jibun:', tc.jibun);
    const cands = generateFallbackCandidates(tc.road, tc.jibun);
    console.log('Fallback candidates:');
    cands.forEach((c, i) => console.log('  ' + (i + 1) + '. ' + c));
    for (const c of cands) {
      const { docs, meta } = await search(c);
      const mark = docs.length ? '✅' : '✗';
      console.log('  ' + mark + ' ' + c + ' | total=' + (meta && meta.total_count));
      if (docs.length) {
        const d = docs[0];
        const ra = d.road_address || {};
        console.log('    MATCH: ' + d.address_name + ' | road=' + (ra.address_name || '-'));
      }
    }
  }
})();
