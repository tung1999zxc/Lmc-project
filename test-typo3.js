const KEY = 'a9d4231e639d7f9bf805ffaa2cdf5d32';

const queries = [
  // 경산시의 행정동 확인
  '\uACBD\uC0B0\uC2DC \uD3EC\uC5F0\uD0C0\uD78C\uC988',  // 포엔타힐즈
  '\uACBD\uC0B0\uC2DC\uD3ED\uD0C0\uD78C\uC988',  // 붙어쓴
  '\uD3EC\uC5F0\uD0C0\uD78C\uC988',  // 포엔타힐즈
  '\uD3EC\uC5F0\uD0C0',  // 포엔타
  '\uACBD\uC0B0 \uD3EC\uC5F0\uD0C0',  // 경산 포엔타
  // 펭타힐즈 검색
  '\uD3AD\uD0C0\uD78C\uC988',  // 핫타힐즈
  // 매칭 펜타힐즈로
  '\uD38C\uD0C0\uD78C\uC988\uB85C 60',
  // 대구/경산 아파트 단지
  '\uACBD\uBD81 \uACBD\uC0B0\uC2DC',
  // 다른 시도
  '\uAC15\uC6D0\uB3C4 \uD3EC\uC5F0\uD0C0\uD78C\uC988',
  // 도안 지역
  '\uACBD\uC0B0 \uB3C4\uC548',
];

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
  console.log('=== KEYWORD ===');
  for (const q of queries) {
    const r = await searchKeyword(q);
    if (r.meta && r.meta.total_count > 0) {
      console.log('Q [' + q + ']: total=' + r.meta.total_count);
      r.docs.slice(0, 3).forEach((d) => console.log('  - ' + d.place_name + ' | ' + d.road_address_name));
    }
  }

  console.log('\n=== ADDRESS ===');
  // 시도 안되는 부분만 잘라서 시도
  const adds = [
    '\uC11C\uC0B0\uC2DC \uD574\uBBF8\uBA74 \uB300\uAD8C\uD1A0\uAE38 14',  // 본번지 포함
    '\uC11C\uC0B0\uC2DC \uD574\uBBF8\uBA74 \uB300\uAD8C\uD1A0\uAE38 14-4',  // 정확하게
    '\uB300\uAD8C\uD1A0\uAE38 14',  // 거리 + 번지
    '\uD574\uBBF8\uBA74 \uB300\uAD8C\uD1A0\uAE38',  // 면 + 거리
    '\uD1A0\uAE38', // 길 단독
    // 경산 펜타힐즈
    '\uACBD\uC0B0 \uD38C\uD0C0\uD78C\uC988\uB85C',
    '\uACBD\uC0B0 \uD38C\uD0C0\uD78C\uC988',
    '\uD38C\uD0C0\uD78C\uC988\uB85C 60',
    '\uD38C\uD0C0\uD78C\uC988\uB85C',
    // 할글비석로 (타이핑 오류)
    '\uB178\uC6D0\uAD6D',  // 노원국
    '\uD560\uD06C\uBE44\uC11D\uB85C',
    '\uD560\uD06C\uBE44\uC11D',
    '\uD560\uD06C\uBE0C',
  ];
  for (const q of adds) {
    const r = await search(q);
    console.log('Q [' + q + ']: total=' + (r.meta && r.meta.total_count));
    if (r.docs.length) r.docs.slice(0, 2).forEach((d) => console.log('  - ' + d.address_name + ' | road=' + ((d.road_address && d.road_address.address_name) || '-')));
  }
})();