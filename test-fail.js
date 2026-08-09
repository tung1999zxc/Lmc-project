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

function stripPhone(s) {
  return s.replace(/(010|011|016|017|018|019)[-.\s]?\d{3,4}[-.\s]?\d{4}/g, '').trim();
}

function stripParen(s) {
  return s.replace(/\s*\([^)]*\)\s*/g, ' ').trim();
}

function stripRoom(s) {
  return s.replace(/\broom\s*\d+/gi, '').replace(/\s+/g, ' ').trim();
}

(async () => {
  for (const c of cases) {
    console.log('\n========================================');
    console.log('ID:', c.id);
    console.log('RAW:', c.raw);

    // Bước 1: Kakao address search nguyên vẹn
    let r = await search(c.raw);
    console.log('\n[1] Kakao address (raw): total=' + (r.meta && r.meta.total_count));
    r.docs.slice(0, 2).forEach((d) => console.log('  - ' + d.address_name + ' | road=' + ((d.road_address && d.road_address.address_name) || '-')));

    // Bước 2: bỏ phone
    let noPhone = stripPhone(c.raw);
    r = await search(noPhone);
    console.log('\n[2] noPhone:', noPhone);
    console.log('  total=' + (r.meta && r.meta.total_count));
    r.docs.slice(0, 2).forEach((d) => console.log('  - ' + d.address_name));

    // Bước 3: bỏ paren
    let noParen = stripParen(noPhone);
    r = await search(noParen);
    console.log('\n[3] noParen:', noParen);
    console.log('  total=' + (r.meta && r.meta.total_count));
    r.docs.slice(0, 2).forEach((d) => console.log('  - ' + d.address_name));

    // Bước 4: bỏ "room NNN"
    let noRoom = stripRoom(noParen);
    r = await search(noRoom);
    console.log('\n[4] noRoom:', noRoom);
    console.log('  total=' + (r.meta && r.meta.total_count));
    r.docs.slice(0, 2).forEach((d) => console.log('  - ' + d.address_name));

    // Bước 5: chỉ lấy phần đầu (cắt sau "," hoặc số phòng)
    let head = noRoom.split(/[,\n]/)[0].trim();
    r = await search(head);
    console.log('\n[5] head:', head);
    console.log('  total=' + (r.meta && r.meta.total_count));
    r.docs.slice(0, 2).forEach((d) => console.log('  - ' + d.address_name));

    // Bước 6: POI search nếu có keyword tòa nhà
    const aptMatch = noRoom.match(/[\uAC00-\uD7A30-9]+(?:아파트|빌라|타워|하우스|빌딩|오피스텔)[^\s]*/);
    if (aptMatch) {
      r = await searchKeyword(aptMatch[0]);
      console.log('\n[6] POI [' + aptMatch[0] + ']: total=' + (r.meta && r.meta.total_count));
      r.docs.slice(0, 2).forEach((d) => console.log('  - ' + d.place_name + ' | ' + d.road_address_name));
    }

    // Bước 7: riêng tên khách hàng lạ (영문)
    const enWords = noRoom.match(/[A-Z][A-Z]+/g);
    if (enWords) {
      console.log('\n[7] EN words:', enWords.join(', '));
      for (const w of enWords.slice(0, 2)) {
        r = await searchKeyword(w);
        console.log('  POI[' + w + ']: total=' + (r.meta && r.meta.total_count));
      }
    }
  }
})();