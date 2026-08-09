const https = require('https');

const KEY = process.env.KAKAO_KEY || 'a9d4231e639d7f9bf805ffaa2cdf5d32';
const queries = [
  '\uACBD\uAE30\uB3C4 \uAE40\uD3EC\uC2DC \uD1B5\uC9C4\uC74D \uC728\uB9C8\uB85C438\uBC88\uAE38 34-24',
  '\uACBD\uAE30 \uAE40\uD3EC\uC2DC \uD1B5\uC9C4\uC74D \uC728\uB9C8\uB85C438\uBC88\uAE38 34-24',
  '\uACBD\uAE30\uB3C4 \uAE40\uD3EC\uC2DC \uD1B5\uC9C4\uC74D \uB9C8\uC1A1\uB9AC 34-24',
  '\uAE40\uD3EC\uC2DC \uD1B5\uC9C4\uC74D \uC728\uB9C8\uB85C438\uBC88\uAE38 34-24',
  '\uC728\uB9C8\uB85C438\uBC88\uAE38 34-24',
  '\uAE40\uD3EC\uC2DC \uD1B5\uC9C4\uC74D \uB9C8\uC1A1\uB9AC',
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
        console.log('  - ' + d.address_name + ' | road=' + (ra.building_name || '-') + ' | jibun=' + (a.address_name || '-'));
      });
      if (!docs.length) console.log('  (no result)');
    } catch (e) {
      console.log('ERROR:', e.message);
    }
    console.log('');
  }
})();
