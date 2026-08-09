const KEY = 'a9d4231e639d7f9bf805ffaa2cdf5d32';

const cases = [
  {
    id: '1783157405216',
    raw: '\uC138\uC885 \uD2B9\uBCC4\uC790\uCE58\uC2DC \uC870\uCE58\uC6D0\uC74D \uADFC\uCCAD\uB85C 23, 106 \uB3D9 105 \uD638 ( \uBC84\uB0A8 \uC8FC\uACF5 \uC544\uD30C\uD2B8)',
  },
  {
    id: '1783145871151',
    raw: '\uB178\uC6D0\uAD6D \uD560\uADF8\uBE44\uC11D\uB85C318 01026098776 SRIPRATHAN SITTHICHOED',
  },
  {
    id: '1783131164905',
    raw: '\uC11C\uC0B0\uC2DC \uD574\uBBF8\uBA74 \uB300\uAD8C\uD1A0\uAE38 14-4. Room 207',
  },
  {
    id: '1783237694022',
    raw: '\uACBD\uBD81\uACBD\uC0B0\uC2DC\uD3AD\uD0C0\uD78C\uC988\uB85C 60 105 1302\uD638',
  },
];

function cleanAddressNoise(input) {
  if (!input) return input;
  let s = String(input);
  s = s.replace(/(010|011|016|017|018|019)[-.\s]?\d{3,4}[-.\s]?\d{4}/g, '');
  s = s.replace(/\b[A-Z]{3,}(?:\s+[A-Z]{3,}){1,}\b/g, '');
  s = s.replace(/\b(?:room|rm)\s*\d+/gi, '');
  s = s.replace(/\s+\d+\uD638\b/g, '');
  s = s.replace(/\s+/g, ' ').replace(/^[,\s.\-]+|[,\s.\-]+$/g, '').trim();
  return s || input;
}

function buildAdminPoiQuery(road, jibun) {
  const primary = [jibun, road].find((p) => p && /[\uAC00-\uD7A3]/.test(p)) || road || jibun || '';
  if (!primary) return '';
  const dongMatch = primary.match(/[\uAC00-\uD7A3]{2,}\uB3D9/g);
  const eupMyeonMatch = primary.match(/[\uAC00-\uD7A3]{2,}(?:\uC74D|\uBA74)/g);
  const guGunMatch = primary.match(/[\uAC00-\uD7A3]{2,}(?:\uAD6C|\uAD70)/g);
  const DOS = ['\uACBD\uBD81', '\uACBD\uB0A8', '\uCDA9\uBD81', '\uCDA9\uB0A8', '\uC804\uBD81', '\uC804\uB0A8', '\uAC15\uC6D0', '\uC81C\uC8FC', '\uC138\uC885'];
  const siMatches = primary.match(/[\uAC00-\uD7A3]{2,}\uC2DC/g) || [];
  let admin = '';
  if (dongMatch) admin = dongMatch[0];
  else if (eupMyeonMatch) admin = eupMyeonMatch[0];
  else if (guGunMatch) admin = guGunMatch[0];
  else if (siMatches.length > 0) {
    for (const m of siMatches) {
      let candidate = m;
      for (const doPrefix of DOS) {
        if (candidate.startsWith(doPrefix)) {
          candidate = candidate.slice(doPrefix.length);
          break;
        }
      }
      if (/^[\uAC00-\uD7A3]{2,}\uC2DC$/.test(candidate)) {
        admin = candidate;
        break;
      }
    }
    if (!admin && siMatches.length > 0) admin = siMatches[siMatches.length - 1];
  }
  const buildingMatch = primary.match(/[\uAC00-\uD7A3]{2,}(?:\uC544\uD30C\uD2B8|\uBE4C\uB77C|\uC624\uD53C\uC2A4\uD154|\uD0C0\uC6CC|\uD558\uC6B0\uC2A4|\uBE4C\uB529|\uC624\uD53C\uC2A4|\uB9E8\uC158|\uCE90\uC2A4|\uD329\uB9AC\uC2A4|\uD31C\uD06C|\uD558\uC774\uBE4C|\uB808\uC9C0\uB358\uC2A4|\uD78C\uC988|\uD478\uB974\uC9C0\uC624|\uB798\uBBF8\uC548|\uC790\uC774|\uB86F\uB370\uCE90\uC2A4|\uB354\uC0D8|\uC13C\uD2B8\uB808\uBE4C|\uC2A4\uCE74\uC774|\uC232|\uD55C\uC6D0)/g);
  let bld = '';
  if (buildingMatch) {
    bld = buildingMatch.slice(0, 2).join(' ');
  } else {
    const afterAdmin = primary.split(admin)[1] || primary;
    const lastHangul = afterAdmin.match(/[\uAC00-\uD7A3][\uAC00-\uD7A30-9]+/g);
    if (lastHangul && lastHangul.length > 0) {
      bld = lastHangul.slice(0, 2).join(' ');
    }
  }
  if (!admin && !bld) return '';
  const TYPO_FIXES = [
    [/\uD3AD\uD0C0/g, '\uD38C\uD0C0'],
    [/\uD3AD\uD78C/g, '\uD38C\uD78C'],
    [/\uD3ED\uD0C0/g, '\uD38C\uD0C0'],
    [/\uD3EC\uD0C0/g, '\uD38C\uD0C0'],
    [/\uD55C\uC988/g, '\uD78C\uC988'],
    [/\uD78C\uC988/g, '\uD55C\uC988'],
    [/\uD3AD\uC988/g, '\uD78C\uC988'],
  ];
  let finalAdmin = admin;
  for (const [rx, rep] of TYPO_FIXES) finalAdmin = finalAdmin.replace(rx, rep);
  let finalBld = bld;
  for (const [rx, rep] of TYPO_FIXES) finalBld = finalBld.replace(rx, rep);
  const aptInParen = primary.match(/[\(\[]([^\)\]]+)[\)\]]/);
  if (aptInParen && /\uC8FC\uACF5|\uC544\uD30C\uD2B8|\uBE4C\uB77C|\uB9E8\uC158|\uD0C0\uC6CC|\uD78C\uC988|\uD638\uD154|\uC624\uD53C\uC2A4\uD154|\uCE90\uC2A4/.test(aptInParen[1])) {
    const tokens = aptInParen[1].split(/\s+/).filter((t) => t.length >= 2);
    const keywordIdx = tokens.findIndex((t) => /\uC8FC\uACF5|\uC544\uD30C\uD2B8|\uBE4C\uB77C|\uB9E8\uC158|\uD0C0\uC6CC|\uD78C\uC988|\uD638\uD154|\uC624\uD53C\uC2A4\uD154|\uCE90\uC2A4/.test(t));
    if (keywordIdx >= 0) {
      finalBld = tokens.slice(keywordIdx).join(' ');
    } else {
      finalBld = tokens.slice(-3).join(' ');
    }
    for (const [rx, rep] of TYPO_FIXES) finalBld = finalBld.replace(rx, rep);
  }
  return [finalAdmin, finalBld].filter(Boolean).join(' ').trim();
}

function searchKeyword(q) {
  return new Promise((resolve, reject) => {
    const url = 'https://dapi.kakao.com/v2/local/search/keyword.json?query=' + encodeURIComponent(q);
    const req = require('https').get(url, { headers: { Authorization: 'KakaoAK ' + KEY } }, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => {
        try { resolve({ q, docs: JSON.parse(body).documents || [], meta: JSON.parse(body).meta }); } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
  });
}

(async () => {
  for (const c of cases) {
    console.log('\n========================================');
    console.log('ID:', c.id);
    console.log('RAW:', c.raw);
    const cleaned = cleanAddressNoise(c.raw);
    console.log('CLEANED:', cleaned);
    const adminQ = buildAdminPoiQuery(cleaned, '');
    console.log('ADMIN POI QUERY:', adminQ);
    if (adminQ) {
      const r = await searchKeyword(adminQ);
      console.log('  → total=' + (r.meta && r.meta.total_count));
      r.docs.slice(0, 5).forEach((d) => console.log('    - ' + d.place_name + ' | ' + d.road_address_name));
    }
  }
})();