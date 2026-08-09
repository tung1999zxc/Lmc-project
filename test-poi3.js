const KEY = 'a9d4231e639d7f9bf805ffaa2cdf5d32';

function extractBuildingKeyword(road, jibun) {
  const hangulPart = [jibun, road].find((p) => p && /[\uAC00-\uD7A3]/.test(p));
  const primary = hangulPart || road || jibun || "";
  const taggedMatch = primary.match(/([\uAC00-\uD7A30-9]+(?:\uBE4C\uB77C|\uC544\uD30C\uD2B8|\uC624\uD53C\uC2A4\uD154|\uD0C0\uC6CC|\uD558\uC6B0\uC2A4|\uBE4C\uB529|\uC624\uD53C\uC2A4|\uB9E8\uC158|\uCE90\uC2A4|\uD329\uB9AC\uC2A4|\uD31C\uD06C|\uD558\uC774\uBE4C|\uB808\uC9C0\uB358\uC2A4)[^\s|]*)(\s+\d+(-\d+)?)?/);
  if (taggedMatch) {
    return (taggedMatch[1] + (taggedMatch[2] || "")).trim();
  }
  const hangulBlocks = primary.match(/[\uAC00-\uD7A3][\uAC00-\uD7A30-9]+/g);
  if (hangulBlocks && hangulBlocks.length > 0) {
    const lastHangul = hangulBlocks[hangulBlocks.length - 1];
    const withBunji = primary.match(new RegExp(lastHangul + '\\s*\\d+(-\\d+)?'));
    return withBunji ? withBunji[0] : lastHangul;
  }
  const cleaned = primary.replace(/\broom\b\s*\d+/gi, "").replace(/\s+/g, " ").trim();
  const tokens = cleaned.split(/\s+/).filter((t) => !/^\d{5}$/.test(t));
  const lastTokens = tokens.slice(-3).filter((t) => !/^\d+$/.test(t));
  if (lastTokens.length === 0) return "";
  const bunjiMatch = cleaned.match(/\b\d+(-\d+)?\s*$/);
  return bunjiMatch ? lastTokens.join(" ") + " " + bunjiMatch[0] : lastTokens.join(" ");
}

function searchKeyword(q) {
  return new Promise((resolve, reject) => {
    const url = 'https://dapi.kakao.com/v2/local/search/keyword.json?query=' +
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
    {
      name: 'user case (romaji)',
      road: 'KWANGJU POGKO YANGSANDONG MYONG FOAM VELLA 823',
      jibun: ''
    },
    {
      name: 'romaji with room',
      road: 'KWANGJU POGKO YANGSANDONG MYONG FOAM VELLA 823 room 209',
      jibun: ''
    },
    {
      name: '한글 빌라',
      road: '광주광역시 북구 양산동 명폼빌라 823',
      jibun: ''
    },
    {
      name: '한글 일반',
      road: '서울 강남구 테헤란로 152 강남파이낸스센터',
      jibun: ''
    }
  ];
  for (const tc of cases) {
    console.log('\n=== ' + tc.name + ' ===');
    const k = extractBuildingKeyword(tc.road, tc.jibun);
    console.log('  Extracted: [' + k + ']');
    if (k) {
      const { docs, meta } = await searchKeyword(k);
      console.log('  Total: ' + (meta && meta.total_count));
      docs.slice(0, 3).forEach((d) => {
        console.log('    - ' + d.place_name + ' | ' + (d.road_address_name || '-'));
      });
    }
  }
})();
