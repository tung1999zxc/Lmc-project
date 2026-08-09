const KEY = 'a9d4231e639d7f9bf805ffaa2cdf5d32';

function generateFallbackCandidates(road, jibun) {
  const out = [];
  const BASE = jibun || road || "";
  if (!BASE) return out;
  let s = BASE.trim().replace(/\s+/g, " ");
  const noBunji = s.replace(/\s+\d+(-\d+)?(\uBC88\uC9C0)?\s*$/, "").trim();
  if (noBunji && noBunji !== s) {
    out.push(noBunji);
    const noGil = noBunji.replace(/\s+[^\s]*(\uBC88\uAE38|\uB85C|\uA38C)\s*$/, "").trim();
    if (noGil && noGil !== noBunji) {
      out.push(noGil);
      const noRi = noGil.replace(/\s+[^\s]*(리|동)\s*$/, "").trim();
      if (noRi && noRi !== noGil) out.push(noRi);
    }
  }
  if (jibun && jibun !== road) {
    const jNoBunji = jibun.replace(/\s+\d+(-\d+)?(\uBC88\uC9C0)?\s*$/, "").trim();
    if (jNoBunji && !out.includes(jNoBunji)) out.push(jNoBunji);
    const jNoRi = jNoBunji.replace(/\s+[^\s]*(리|동)\s*$/, "").trim();
    if (jNoRi && !out.includes(jNoRi)) out.push(jNoRi);
  }
  if (road) {
    const rNoGil = road.replace(/\s+[^\s]*(\uBC88\uAE38|\uB85C|\uA38C)\s*$/, "").trim();
    if (rNoGil && !out.includes(rNoGil)) out.push(rNoGil);
  }
  return out.filter((q) => q && q.length >= 3);
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
  const road = '\uC804\uB77C\uB0A8\uB3C4 \uACE0\uD765\uAD70 \uB3C4\uC591\uC74D \uC2DC\uC0B0\uBC29\uD559\uAE38 6-1';
  const jibun = '\uC804\uB77C\uB0A8\uB3C4 \uACE0\uD765\uAD70 \uB3C4\uC591\uC74D \uC2DC\uC0B0\uB9AC 6-1';
  const cands = generateFallbackCandidates(road, jibun);
  console.log('Fallback candidates:');
  cands.forEach((c, i) => console.log('  ' + (i + 1) + '. ' + c));
  for (const c of cands) {
    const { docs, meta } = await search(c);
    console.log('  → ' + c + ' | total=' + (meta && meta.total_count));
    if (docs.length) {
      const d = docs[0];
      const ra = d.road_address || {};
      console.log('    MATCH: ' + d.address_name + ' | road=' + (ra.address_name || '-'));
    }
  }
})();
