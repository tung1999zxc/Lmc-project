const KEY = 'a9d4231e639d7f9bf805ffaa2cdf5d32';

function extractBuildingKeyword(road, jibun) {
  const all = [road, jibun].filter(Boolean).join(" | ");
  if (!all) return "";
  const hangulMatch = all.match(/([가-힣]+(?:빌라|아파트|오피스텔|타워|하우스|빌딩|오피스|맨션|캐슬|팰리스|파크|하이빌|레지던스)[^\s|]*)(\s+\d+(-\d+)?)?/);
  if (hangulMatch) {
    return (hangulMatch[1] + (hangulMatch[2] || "")).trim();
  }
  return "";
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
  // Trường hợp AI đã dịch sang Hangul
  const cases = [
    {
      name: 'buildKeyword from user case (sau dịch)',
      road: '광주광역시 북구 양산동 명폼빌라 823',
      jibun: '',
      keyword: '명폼빌라 823'
    },
    {
      name: 'apt keyword',
      road: '서울 송파구 잠실동 올림픽로 35 잠실엘스 123',
      jibun: '',
      keyword: '잠실엘스 123'
    },
    {
      name: 'tower keyword',
      road: '서울 강남구 테헤란로 152 강남파이낸스센터',
      jibun: '',
      keyword: '강남파이낸스센터'
    },
  ];
  for (const tc of cases) {
    console.log('\n=== ' + tc.name + ' ===');
    const k = extractBuildingKeyword(tc.road, tc.jibun);
    console.log('Extracted keyword:', k);
    if (k) {
      const { docs, meta } = await searchKeyword(k);
      console.log('Total:', meta && meta.total_count);
      docs.slice(0, 3).forEach((d) => {
        console.log('  - ' + d.place_name + ' | ' + (d.road_address_name || '-') + ' | ' + (d.address_name || '-'));
      });
    }
  }
})();
