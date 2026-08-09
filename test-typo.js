const KEY = 'a9d4231e639d7f9bf805ffaa2cdf5d32';

const queries = [
  // 1: 세종 조치원읍
  '\uC138\uC885\uD2B9\uBCC4\uC790\uCE58\uC2DC \uC870\uCE58\uC6D0\uC74D \uADFC\uCCAD\uB85C',
  '\uC870\uCE58\uC6D0\uC74D \uADFC\uCCAD\uB85C',
  '\uADFC\uCCAD\uB85C 23',
  '\uADFC\uCCAD\uB85C',
  // 2: 할글비석로 / 할그비석로 (오타 시도)
  '\uB178\uC6D0\uAD6D \uD560\uADF8\uBE44\uC11D\uB85C',
  '\uD560\uADF8\uBE44\uC11D\uB85C 318',
  '\uD560\uADF8\uBE44\uC11D\uB85C',
  // 3: 서산시 해미면 대권토길
  '\uC11C\uC0B0\uC2DC \uD574\uBBF8\uBA74 \uB300\uAD8C\uD1A0\uAE38',
  '\uB300\uAD8C\uD1A0\uAE38',
  '\uD574\uBBF8\uBA74',
  // 4: 펭타힌즈로 / 펜타힐즈로
  '\uACBD\uBD81\uACBD\uC0B0\uC2DC \uD3AD\uD0C0\uD78C\uC988\uB85C',
  '\uD3ED\uD0C0\uD78C\uC988\uB85C',  // 호타힐즈로
  '\uD3EC\uD0C0\uD78C\uC988\uB85C',  // 포타힐즈로
  '\uD3EC\uC5F0\uD0C0\uD78C\uC988\uB85C', // 포엔타힐즈로
  '\uAC00\uD0C0\uD78C\uC988\uB85C',  // 가타힐즈로
  '\uD38C\uD0C0\uD78C\uC988\uB85C',  // 펜타힐즈로
  // 5: extra: 단지 keyword search for '버남 주공 아파트'
  '\uBC84\uB0A8 \uC8FC\uACF5 \uC544\uD30C\uD2B8',
];

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
    const r = await search(q);
    if (r.meta && r.meta.total_count > 0) {
      console.log('Q [' + q + ']: total=' + r.meta.total_count);
      r.docs.slice(0, 2).forEach((d) => console.log('  - ' + d.address_name));
    }
  }
  // POI for apartments
  console.log('\n=== POI ===');
  for (const q of ['\uBC84\uB0A8\uC8FC\uACF5\uC544\uD30C\uD2B8', '\uC870\uCE58\uC6D0 \uC8FC\uACF5 \uC544\uD30C\uD2B8', '\uADFC\uCCAD\uB85C 23 \uC8FC\uACF5']) {
    const r = await searchKeyword(q);
    console.log('Q [' + q + ']: total=' + (r.meta && r.meta.total_count));
    r.docs.slice(0, 3).forEach((d) => console.log('  - ' + d.place_name + ' | ' + d.road_address_name));
  }
})();