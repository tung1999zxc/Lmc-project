const KEY = 'a9d4231e639d7f9bf805ffaa2cdf5d32';

// POI queries for fail cases
const queries = [
  // Case 2: 노원국 할글비석로 318 → không có POI rõ
  '\uD560\uADF8\uBE44\uC11D\uB85C 318',
  '\uD560\uD06C\uBE44\uC11D\uB85C',  // 할크비석로
  '\uB178\uC6D0 \uD560\uADF8\uBE44\uC11D\uB85C',
  // Case 3: 대권토길
  '\uB300\uAD8C\uD1A0\uAE38',
  '\uB300\uAD8C\uB85C',  // 오타: 토→로
  '\uB300\uAD8C\uD1A0',  // 호+토만
  // Case 4: 펜타힐즈로
  '\uD3EC\uC5F0\uD0C0\uD78C\uC988\uB85C',
  '\uD38C\uD0C0\uD78C\uC988\uB85C',
  '\uD3AD\uD0C0\uD78C\uC988\uB85C',
  // Case 4 by removing typo: 펭타힌즈로 → 펜타힐즈로 (천안/경산 둘 다)
  '\uACBD\uC0B0 \uD38C\uD0C0\uD78C\uC988\uB85C',
  '\uACBD\uBD81 \uD38C\uD0C0\uD78C\uC988\uB85C',
  '\uACBD\uC0B0\uC2DC \uD38C\uD0C0\uD78C\uC988',
  // Bonus: 경산 펜타힐즈
  '\uACBD\uC0B0\uC2DC \uD398\uB274\uD0C0\uD78C\uC988',
  '\uACBD\uC0B0 \uD398\uB274\uD0C0\uD78C\uC988',
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

(async () => {
  for (const q of queries) {
    const r = await searchKeyword(q);
    if (r.meta && r.meta.total_count > 0) {
      console.log('Q [' + q + ']: total=' + r.meta.total_count);
      r.docs.slice(0, 3).forEach((d) => console.log('  - ' + d.place_name + ' | ' + d.road_address_name + ' | ' + d.address_name));
    }
  }
})();