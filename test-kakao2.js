const https = require('https');

const KEY = 'a9d4231e639d7f9bf805ffaa2cdf5d32';
const queries = [
  '\uC804\uB77C\uB0A8\uB3C4 \uACE0\uD765\uAD70 \uB3C4\uC591\uC74D \uC2DC\uC0B0\uBC29\uD559\uAE38 6-1',
  '\uC804\uB77C\uB0A8\uB3C4 \uACE0\uD765\uAD70 \uB3C4\uC591\uC74D \uC2DC\uC0B0\uBC29\uD559\uAE38 6-1',
  '\uC2DC\uC0B0\uBC29\uD559\uAE38 6-1',
  '\uC804\uB77C\uB0A8\uB3C4 \uACE0\uD765\uAD70 \uB3C4\uC591\uC74D',
];

function search(q) {
  return new Promise((resolve, reject) => {
    const url = 'https://dapi.kakao.com/v2/local/search/address.json?query=' +
      encodeURIComponent(q);
    https.get(url, { headers: { Authorization: 'KakaoAK ' + KEY } }, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          resolve({ q, docs: data.documents || [], meta: data.meta });
        } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

(async () => {
  for (const q of queries) {
    try {
      const { q: query, docs, meta } = await search(q);
      console.log('=== Query: ' + query + ' ===');
      console.log('  total_count:', meta && meta.total_count);
      docs.forEach((d) => {
        const ra = d.road_address || {};
        const a = d.address || {};
        console.log('  - ' + d.address_name + ' | road_building=' + (ra.building_name || '-') + ' | zone_no=' + (ra.zone_no || '-') + ' | jibun=' + (a.address_name || '-'));
      });
      if (!docs.length) console.log('  (no result)');
    } catch (e) {
      console.log('ERROR:', e.message);
    }
    console.log('');
  }
})();
