export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isUrl(value = "") {
  return /^https?:\/\//i.test(String(value).trim());
}

function cleanPhone(phone = "") {
  const numbers = String(phone).replace(/\D/g, "");

  if (!numbers) return "";

  if (numbers.startsWith("010") && numbers.length === 11) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
  }

  return numbers;
}

function removeCodeFence(text = "") {
  return String(text)
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function getOpenAIOutputText(data) {
  if (data?.output_text) return data.output_text;

  for (const item of data?.output || []) {
    for (const content of item?.content || []) {
      if (content?.type === "output_text" && content?.text) {
        return content.text;
      }
    }
  }

  return "";
}

async function callOpenAIResponses({ system, user, images = [] }) {
  const content = [{ type: "input_text", text: system }];
  if (user) content.push({ type: "input_text", text: user });
  for (const img of images) {
    content.push({ type: "input_image", image_url: img, detail: "high" });
  }

  const body = JSON.stringify({
    model: process.env.OPENAI_ADDRESS_MODEL || "gpt-4o-mini",
    input: [{ role: "user", content }],
  });

  const MAX_RETRIES = 4;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    let response;
    try {
      response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body,
      });
    } catch (err) {
      // Network blip — retry
      if (attempt < MAX_RETRIES - 1) {
        await sleep(500 * Math.pow(2, attempt));
        continue;
      }
      throw new Error(`OpenAI network error: ${err.message}`);
    }

    if (response.ok) {
      const data = await response.json();
      const text = getOpenAIOutputText(data);
      if (!text) throw new Error("OpenAI không trả về nội dung.");
      return text;
    }

    // 429 (rate limit) hoặc 5xx → backoff + retry
    if (response.status === 429 || response.status >= 500) {
      const errText = await response.text().catch(() => "");
      const waitMs = parseRetryAfter(errText) ?? 500 * Math.pow(2, attempt);
      console.warn(
        `[OpenAI] ${response.status} → retry ${attempt + 1}/${MAX_RETRIES} sau ${waitMs}ms`,
      );
      if (attempt < MAX_RETRIES - 1) {
        await sleep(waitMs);
        continue;
      }
      throw new Error(`OpenAI API error ${response.status}: ${errText}`);
    }

    // 4xx khác (400, 401, ...) → không retry, fail ngay
    const errText = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${errText}`);
  }

  throw new Error("OpenAI: vượt số lần retry");
}

/** Parse "try again in 118ms" hoặc "try again in 2s" từ error message OpenAI. */
function parseRetryAfter(errText = "") {
  const m = String(errText).match(/try again in\s+([\d.]+)\s*(ms|s)/i);
  if (!m) return null;
  const n = parseFloat(m[1]);
  const ms = m[2].toLowerCase() === "s" ? n * 1000 : n;
  return Math.min(Math.max(ms, 100), 30_000); // clamp 100ms..30s
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Phát hiện địa chỉ có vẻ là tiếng Anh (chứa nhiều chữ Latin ASCII).
 */
function looksEnglish(text = "") {
  if (!text) return false;
  const asciiLetters = (text.match(/[A-Za-z]/g) || []).length;
  const hangul = (text.match(/[가-힣]/g) || []).length;
  return asciiLetters >= 4 && asciiLetters > hangul * 2;
}

const TRANSLATE_PROMPT = `Bạn là máy dịch cơ học từ romaji-tiếng-Anh sang tiếng-Hàn (Hangul) của địa chỉ Hàn Quốc.

QUY TẮC BẮT BUỘC (sai 1 ký tự số = sai hoàn toàn):
1. PHẢI giữ NGUYÊN VẸN 100% tất cả chữ số trong input: số nhà (33), số lane (9), số building, mã bưu điện (14511), số tầng, số phòng, số hẻm (beon). TUYỆT ĐỐI KHÔNG bỏ số, KHÔNG đổi số, KHÔNG dịch số.
2. CHỈ thay thế các đuôi romaji phổ biến:
   - ro / -ro → 로
   - daero / -daero → 대로
   - gil / -gil → 길
   - beon-gil / -beongil → 번길
   - dong / -dong → 동
   - gu / -gu → 구
   - si / -si → 시
   - do / -do → 도
   - gun / -gun → 군
   - eup / -eup → 읍
   - myeon / -myeon → 면
   - ri / -ri → 리
3. Tên tỉnh/thành phố/địa danh phổ biến dịch đầy đủ:
   - Gyeonggi-do → 경기도
   - Bucheon-si → 부천시
   - Sosa-gu → 소사구
   - Simgok-ro → 심곡로
4. Tên tòa nhà/khách sạn: phiên âm trực tiếp từng âm tiết theo Revised Romanization. Ví dụ:
   - Green Fine Building → 그린파인빌딩
5. Thứ tự chuẩn khi viết tiếng Hàn: [số nhà — tên đường], [시/도] [구/군] [동/읍/면/리], [tên tòa nhà] [số phòng/số tầng chi tiết].
6. Nếu input đã chứa Hangul, KHÔNG dịch phần Hangul — chỉ dịch phần còn lại.
7. Trả về MỘT dòng duy nhất, KHÔNG markdown, KHÔNG giải thích, KHÔNG thêm bớt chữ ngoài input.

HỖ TRỢ THÊM CÁC DẠNG VIẾT CŨ/KHÔNG DẤU:
8. Nếu input viết HOA LIỀN (postal romanization cũ kiểu "KWANGJU POGKO YANGSANDONG MYONG FOAM VELLA 823"):
   - Tự CHÈN dấu gạch ngang "-" giữa các đuôi đã biết (dong, si, do, gu, gun, eup, myeon, ri, ro, gil) trước khi dịch
   - VD: "YANGSANDONG" → "Yangsan-dong"
   - VD: "KWANGJU" / "KWANGSAN" → 광주시/광산구 (thành phố Kwangju, quận Gwangsan)
   - VD: "POGKO" → 보고 (보=POGKO, 고=KO; phiên âm thông dụng)
9. Nếu input có chuỗi như "VELLA" / "VELA" / "VILLA" / "BLD" / "BLDG" / "APT" / "OFFICE" → dịch là:
   - VELLA / VELA / VILLA → 빌라
   - BLDG / BLD → 빌딩
   - APT → 아파트
   - OFFICE → 오피스
   - HOUSE → 하우스
10. Nếu input có "room" / "Rm" / "#" / "호" → phần phía sau là số phòng, đặt cuối sau tên tòa nhà (giữ nguyên số)
    - VD: "MYONG FOAM VELLA 823 room 209" → "명폼빌라 823호 209호" (chỉ giữ 1 số phòng cuối: 209)
11. Nếu input có postal code 5 số đứng đầu (14511, 06158, …) → giữ nguyên, đặt đầu output, cách bằng dấu phẩy

Ví dụ mẫu:
Input: "Green Fine Building, 33 Simgok-ro 9beon-gil, Sosa-gu, Bucheon-si, Gyeonggi-do"
Output: "경기도 부천시 소사구 심곡로9번길 33, 그린파인빌딩"

Input: "14511, 33 Simgok-ro 9beon-gil, Sosa-gu, Bucheon-si, Gyeonggi-do"
Output: "14511, 경기도 부천시 소사구 심곡로9번길 33"

Input: "KWANGJU POGKO YANGSANDONG MYONG FOAM VELLA 823 room 209"
Output: "광주광역시 보고동 양산동 명폼빌라 209호"  (giữ 823 chỉ khi phù hợp hoặc bỏ nếu POI name)

Input: "06158, SEOCHO-GU BANGBAE-DONG 123-4"
Output: "06158, 서울 서초구 방배동 123-4"`;

/**
 * Trích các số "quan trọng" trong địa chỉ (số nhà, số lane, postal code).
 * Dùng để verify bản dịch không làm mất số.
 */
function extractNumbers(text = "") {
  return Array.from(String(text).matchAll(/\d+/g)).map((m) => m[0]);
}

function numbersMissing(input, translated) {
  const inputNumbers = extractNumbers(input);
  const translatedNumbers = extractNumbers(translated);
  if (inputNumbers.length === 0) return false;
  return inputNumbers.some((n) => !translatedNumbers.includes(n));
}

async function translateAddressToKorean(input) {
  if (!input) return input;
  if (!looksEnglish(input)) return input;

  const inputNumbers = extractNumbers(input);
  let translated = "";
  // Thử tối đa 2 lần — lần 1 lỗi thì nhấn mạnh số vào prompt
  for (let attempt = 1; attempt <= 2; attempt++) {
    const user =
      attempt === 1
        ? `Dịch địa chỉ sau sang tiếng Hàn (giữ nguyên TẤT CẢ số: ${inputNumbers.join(", ")}):\n\n${input}`
        : `LẦN TRƯỚC BẠN BỎ MẤT SỐ. Dịch lại và PHẢI giữ nguyên TẤT CẢ số: ${inputNumbers.join(", ")}.\n\nĐịa chỉ: ${input}`;

    translated = (
      await callOpenAIResponses({ system: TRANSLATE_PROMPT, user })
    ).trim();
    if (!numbersMissing(input, translated)) break; // ✅ giữ đủ số
    console.warn(`[translateAddressToKorean] Lần ${attempt} thiếu số:`, translated);
  }

  // Nếu vẫn thiếu số dù đã thử 2 lần → fallback thủ công: ghép số gốc vào
  if (numbersMissing(input, translated)) {
    console.warn(
      "[translateAddressToKorean] Fallback: giữ nguyên input (không dịch vì dịch lỗi)",
    );
    return input;
  }
  return translated;
}

const ADDRESS_PROMPT = `
Bạn là hệ thống xử lý địa chỉ giao hàng Hàn Quốc.

Nhiệm vụ:
Đọc thông tin khách hàng và tách địa chỉ.

Trả về DUY NHẤT JSON hợp lệ, không markdown, không giải thích.

Format bắt buộc:
{
  "name": "",
  "phone": "",
  "roadAddressCandidate": "",
  "jibunAddressCandidate": "",
  "building": "",
  "detailAddress": ""
}

QUY TẮC:
1. name: Tên khách nếu có. Không nhầm tên tòa nhà thành tên khách.
2. phone: Số điện thoại Hàn Quốc nếu có.
3. roadAddressCandidate: Chỉ lấy địa chỉ 도로명주소 để tìm trên Kakao. Chuẩn hóa khoảng trắng trong số đường, ví dụ "남산로 25번길" thành "남산로25번길". Không đưa tên khách, số điện thoại, tên tòa nhà, A동, 401호 hoặc tầng vào trường này.
4. jibunAddressCandidate: Nếu có địa chỉ 지번 như "신장동 627@13" thì chuyển thành "경기도 평택시 신장동 627-13" khi biết tỉnh/thành. Nếu không có thì trả "".
5. building: Tên tòa nhà/chung cư. Không đưa A동 hoặc 401호 vào đây nếu có thể tách riêng.
6. detailAddress: Chi tiết giao hàng như A동 401호, 101동 502호, 2층. Giữ nguyên tiếng Hàn.
7. Không dịch địa chỉ Hàn Quốc sang tiếng Việt.
8. Không tự bịa dữ liệu.
`;

/**
 * Tách URL ảnh ra khỏi phần text.
 * Trả về { text, imageUrls }.
 * Ví dụ: "PHÒNG 204 https://x.jpg" -> { text: "PHÒNG 204", imageUrls: ["https://x.jpg"] }
 */
function splitTextAndUrls(input = "") {
  const urlRegex = /https?:\/\/[^\s,]+/gi;
  const urls = String(input).match(urlRegex) || [];
  const text = String(input)
    .replace(urlRegex, " ")
    .replace(/\s+/g, " ")
    .trim();
  return { text, imageUrls: urls };
}

/**
 * Tải ảnh từ URL và chuyển thành data URI.
 * Tránh lỗi OpenAI: "Upstream status code: 403" khi server gốc chặn OpenAI fetch trực tiếp.
 */
async function fetchImageAsDataUri(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      Accept: "image/avif,image/webp,image/png,image/jpeg,image/*;q=0.8,*/*;q=0.5",
      Referer: "https://pancake.vn/",
    },
  });
  if (!res.ok) {
    throw new Error(`Download ảnh thất bại (${res.status})`);
  }
  const contentType =
    res.headers.get("content-type") || "image/jpeg";
  const buffer = Buffer.from(await res.arrayBuffer());
  // OpenAI giới hạn kích thước ảnh ~20MB; kiểm tra nhẹ để tránh gửi quá lớn
  if (buffer.length > 20 * 1024 * 1024) {
    throw new Error("Ảnh quá lớn (>20MB), vui lòng nén trước");
  }
  return `data:${contentType};base64,${buffer.toString("base64")}`;
}

async function extractAddressInformation(input, images = []) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Thiếu OPENAI_API_KEY");
  }

  // Dùng callOpenAIResponses để có retry/backoff cho 429/5xx
  const outputText = await callOpenAIResponses({
    system: ADDRESS_PROMPT,
    user: input ? `DỮ LIỆU KHÁCH HÀNG (text):\n\n${input}` : null,
    images: Array.isArray(images) ? images : [],
  });

  if (!outputText) throw new Error("OpenAI không trả về nội dung.");

  try {
    return JSON.parse(removeCodeFence(outputText));
  } catch {
    console.error("OPENAI RAW:", outputText);
    throw new Error("Không parse được JSON từ OpenAI.");
  }
}

async function searchKakaoAddress(query) {
  if (!query) return null;

  if (!process.env.KAKAO_REST_API_KEY) {
    throw new Error("Thiếu KAKAO_REST_API_KEY");
  }

  const url =
    "https://dapi.kakao.com/v2/local/search/address.json" +
    `?query=${encodeURIComponent(query)}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `KakaoAK ${process.env.KAKAO_REST_API_KEY}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Kakao API error ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  return data.documents?.[0] || null;
}

async function findKakaoAddress({ roadAddressCandidate, jibunAddressCandidate }) {
  // 0) CẮT NOISE trước khi search: bỏ phone, tên khách ALL-CAPS, chuỗi trong ngoặc
  //    VD: "노원국 할글비석로318 01026098776 SRIPRATHAN SITTHICHOED"
  //        → "노원국 할글비석로318"
  const cleanRoad = cleanAddressNoise(roadAddressCandidate);
  const cleanJibun = cleanAddressNoise(jibunAddressCandidate);

  // 1) Thử road nguyên vẹn (đã clean)
  if (cleanRoad) {
    const result = await searchKakaoAddress(cleanRoad);
    if (result) {
      return {
        result,
        matchedBy: "road",
        searchedAddress: cleanRoad,
      };
    }
  }

  // 2) Thử jibun nguyên vẹn (đã clean)
  if (cleanJibun) {
    const result = await searchKakaoAddress(cleanJibun);
    if (result) {
      return {
        result,
        matchedBy: "jibun",
        searchedAddress: cleanJibun,
      };
    }
  }

  // 3) FALLBACK: thử bỏ dần 번지 (số nhà) rồi 번길 (đường) để tìm level thấp hơn
  // Ví dụ: "전라남도 고흥군 도양읍 시산방학길 6-1" không có trong Kakao
  //         → "전라남도 고흥군 도양읍 시산방학길" (bỏ 6-1)
  //         → "전라남도 고흥군 도양읍 시산리"  (bỏ đường)
  //         → "전라남도 고흥군 도양읍"        (bỏ 리)
  const candidates = generateFallbackCandidates(cleanRoad, cleanJibun);
  for (const cand of candidates) {
    const result = await searchKakaoAddress(cand);
    if (result) {
      return {
        result,
        matchedBy: "fallback",
        searchedAddress: cand,
      };
    }
  }

  // 4) FALLBACK CUỐI: thử keyword search (POI) cho tên tòa nhà + số nhà
  // VD: "MYONG FOAM VELLA 823 room 209" → tách "명폼빌라 823" và tìm POI
  const keywordQuery = extractBuildingKeyword(cleanRoad, cleanJibun);
  if (keywordQuery) {
    const poiResult = await searchKakaoKeyword(keywordQuery);
    if (poiResult) {
      return {
        result: poiResult,
        matchedBy: "poi",
        searchedAddress: keywordQuery,
      };
    }
  }

  // 5) FALLBACK CUỐI CÙNG: nếu address có tên 시/구/군 + keyword tòa nhà (아파트/...)
  //    thử POI search với admin + keyword. VD: "조치원읍 주공 아파트" → 번암주공아파트
  const adminKeywordQuery = buildAdminPoiQuery(cleanRoad, cleanJibun);
  if (adminKeywordQuery && adminKeywordQuery !== keywordQuery) {
    const poiResult = await searchKakaoKeyword(adminKeywordQuery);
    if (poiResult) {
      return {
        result: poiResult,
        matchedBy: "poi_admin",
        searchedAddress: adminKeywordQuery,
      };
    }
  }

  return null;
}

/**
 * Cắt noise khỏi address: phone, tên khách ALL-CAPS.
 * KHÔNG bỏ ngoặc "()" vì có thể chứa tên tòa nhà cần thiết cho POI search.
 */
function cleanAddressNoise(input) {
  if (!input) return input;
  let s = String(input);

  // Bỏ phone (010/011/016/017/018/019...)
  s = s.replace(/(010|011|016|017|018|019)[-.\s]?\d{3,4}[-.\s]?\d{4}/g, "");

  // Bỏ tên khách ALL-CAPS (>=2 từ liên tiếp toàn chữ cái viết hoa, dài >=3 mỗi từ)
  // VD: "SRIPRATHAN SITTHICHOED", "NGUYEN VAN A"
  s = s.replace(/\b[A-Z]{3,}(?:\s+[A-Z]{3,}){1,}\b/g, "");

  // Bỏ "room 207", "Rm 207", "#207", "호 207"
  s = s.replace(/\b(?:room|rm)\s*\d+/gi, "");
  s = s.replace(/\s+\d+(?:[\uD638]\d+|\b)\s*$/g, ""); // bỏ "1302호" cuối

  // Rút gọn khoảng trắng + xóa dấu cây thừa
  s = s.replace(/\s+/g, " ").replace(/^[,\s.\-]+|[,\s.\-]+$/g, "").trim();

  return s || input;
}

/**
 * Tạo POI query dạng: "<admin> <keyword tòa nhà>"
 * VD: "세종 조치원읍 ... (버남 주공 아파트)" → "조치원읍 주공 아파트"
 *     "경북 경산시 펭타힌즈로 60 105 1302호" → "경산 펜타힐즈"
 *
 * Ưu tiên admin cấp nhỏ (읍/면/동/리) vì matching POI cần locality
 * Nếu có keyword tòa nhà → ghép; nếu không → lấy Hangul block cuối
 */
function buildAdminPoiQuery(road, jibun) {
  const primary = [jibun, road].find((p) => p && /[\uAC00-\uD7A3]/.test(p)) || road || jibun || "";
  if (!primary) return "";

  // Regex admin các cấp (ưu tiên: 동 > 읍/면 > 구/군 > 시)
  const dongMatch = primary.match(/[\uAC00-\uD7A3]{2,}\uB3D9/g);
  const eupMyeonMatch = primary.match(/[\uAC00-\uD7A3]{2,}(?:\uC74D|\uBA74)/g);
  const guGunMatch = primary.match(/[\uAC00-\uD7A3]{2,}(?:\uAD6C|\uAD70)/g);
  // Tách 시: ưu tiên cụm có prefix là 도/광역시 đã biết (경북경산시 → 경산시)
  const DOS = [
    "\uACBD\uBD81", "\uACBD\uB0A8", "\uCDA9\uBD81", "\uCDA9\uB0A8",
    "\uC804\uBD81", "\uC804\uB0A8", "\uAC15\uC6D0", "\uC81C\uC8FC",
    "\uC138\uC885",
  ];
  const siMatches = primary.match(/[\uAC00-\uD7A3]{2,}\uC2DC/g) || [];
  let admin = "";
  if (dongMatch) admin = dongMatch[0];
  else if (eupMyeonMatch) admin = eupMyeonMatch[0];
  else if (guGunMatch) admin = guGunMatch[0];
  else if (siMatches.length > 0) {
    // Tìm cụm "도 + 시" → tách thành "시"
    // VD: "경북경산시" → check prefix "경북" trong DOS → admin = "경산시"
    for (const m of siMatches) {
      let candidate = m;
      for (const doPrefix of DOS) {
        if (candidate.startsWith(doPrefix)) {
          candidate = candidate.slice(doPrefix.length);
          break;
        }
      }
      // Nếu còn lại là "XX시" (>=2 Hangul + 시) thì OK
      if (/^[\uAC00-\uD7A3]{2,}\uC2DC$/.test(candidate)) {
        admin = candidate;
        break;
      }
    }
    if (!admin && siMatches.length > 0) admin = siMatches[siMatches.length - 1];
  }

  // Lấy keyword tòa nhà (bao gồm cả "힐즈", "푸르지오"...)
  const buildingMatch = primary.match(/[\uAC00-\uD7A3]{2,}(?:\uC544\uD30C\uD2B8|\uBE4C\uB77C|\uC624\uD53C\uC2A4\uD154|\uD0C0\uC6CC|\uD558\uC6B0\uC2A4|\uBE4C\uB529|\uC624\uD53C\uC2A4|\uB9E8\uC158|\uCE90\uC2A4|\uD329\uB9AC\uC2A4|\uD31C\uD06C|\uD558\uC774\uBE4C|\uB808\uC9C0\uB358\uC2A4|\uD78C\uC988|\uD478\uB974\uC9C0\uC624|\uB798\uBBF8\uC548|\uC790\uC774|\uB86F\uB370\uCE90\uC2A4|\uB354\uC0D8|\uC13C\uD2B8\uB808\uBE4C|\uC2A4\uCE74\uC774|\uC232|\uD55C\uC6D0)/g);
  let bld = "";
  if (buildingMatch) {
    bld = buildingMatch.slice(0, 2).join(" ");
  } else {
    // Fallback: lấy 1-2 Hangul block đầu tiên sau admin (thường là tên tòa)
    const afterAdmin = primary.split(admin)[1] || primary;
    const lastHangul = afterAdmin.match(/[\uAC00-\uD7A3][\uAC00-\uD7A30-9]+/g);
    if (lastHangul && lastHangul.length > 0) {
      bld = lastHangul.slice(0, 2).join(" ");
    }
  }

  if (!admin && !bld) return "";

  // Sửa chữ cái Hàn dễ OCR nhầm: ㅐ↔ㅔ, ㅙ↔ㅚ, ㄱ↔ㅋ, ㅂ↔ㅍ...
  // Đặc biệt: 펭타 ↔ 펜타 (ㅐ/ㅔ), 힌즈 ↔ 힐즈 (ㅔ/ㅐ)
  const VOWEL_FIXES = [
    [/\uD3AD/g, "\uD38C"], // 핫 → 팸 (không liên quan, để test)
    [/\uD3EC/g, "\uD3ED"], // 포 → 호 (thử)
  ];
  // Map cụ thể cho token phổ biến (buildings)
  const TYPO_FIXES = [
    // ㅐ ↔ ㅔ (phet ↔ pat) - 핫타/포타/포엔타 → 펜타
    [/\uD3AD\uD0C0/g, "\uD38C\uD0C0"],  // 핫타 → 펜타
    [/\uD3ED\uD0C0/g, "\uD38C\uD0C0"],  // 호타 → 펜타
    [/\uD3EC\uD0C0/g, "\uD38C\uD0C0"],  // 포타 → 펜타
    [/\uD3EC\uC5F0\uD0C0/g, "\uD38C\uD0C0"],  // 포엔타 → 펜타
    // 힌즈 ↔ 힐즈 (hin ↔ hil)
    [/\uD55C\uC988/g, "\uD78C\uC988"],  // 한즈 → 힐즈
    [/\uD3AD\uC988/g, "\uD78C\uC988"],  // 핫즈 → 힐즈
    [/\uD3AD\uD78C/g, "\uD38C\uD78C"],  // 핫힐 → 펜힐
    // 버남 → 번암
    [/\uBC84\uB0A8/g, "\uBC88\uC554"],
    // 근청로 → 군청로
    [/\uADFC\uCCAD\uB85C/g, "\uAD70\uCCAD\uB85C"],
  ];
  let finalAdmin = admin;
  for (const [rx, rep] of TYPO_FIXES) finalAdmin = finalAdmin.replace(rx, rep);
  let finalBld = bld;
  for (const [rx, rep] of TYPO_FIXES) finalBld = finalBld.replace(rx, rep);

  // Nếu primary có chứa ngoặc (...) kèm keyword tòa nhà → chỉ giữ các token
  // có keyword chuẩn (주공/아파트/...) và token HÀNG XÓM (liền kề keyword)
  // VD: "(버남 주공 아파트)" → "주공 아파트" (bỏ 버남 - OCR sai)
  //     "([리더스호텔])" → "리더스호텔"
  // Tránh query tên đường sai (근청로 không có trong Kakao)
  const aptInParen = primary.match(/[\(\[]([^\)\]]+)[\)\]]/);
  if (aptInParen && /주공|아파트|빌라|맨션|타워|힐즈|호텔|오피스텔|캐슬/.test(aptInParen[1])) {
    const tokens = aptInParen[1].split(/\s+/).filter((t) => t.length >= 2);
    // Tìm index của token có keyword (주공/아파트/...)
    const keywordIdx = tokens.findIndex((t) =>
      /주공|아파트|빌라|맨션|타워|힐즈|호텔|오피스텔|캐슬/.test(t),
    );
    if (keywordIdx >= 0) {
      // Lấy từ token keyword trở đi (bỏ token trước — thường là OCR sai)
      // VD: ["버남","주공","아파트"] → ["주공","아파트"]
      // VD: ["신라","주공","아파트"] → ["주공","아파트"]  (mất "신라" nhưng POI vẫn match)
      finalBld = tokens.slice(keywordIdx).join(" ");
    } else {
      finalBld = tokens.slice(-3).join(" ");
    }
    for (const [rx, rep] of TYPO_FIXES) finalBld = finalBld.replace(rx, rep);
  }

  return [finalAdmin, finalBld].filter(Boolean).join(" ").trim();
}

/**
 * Tách phần "tên tòa nhà + số nhà chính" từ road/jibun address để search POI.
 * Chỉ dùng khi address search đã fail hết.
 *
 * Logic:
 *  - Ưu tiên phần có keyword Hangul đặc trưng (빌라/아파트/오피스텔/타워/...)
 *  - Nếu không có → lấy Hangul block cuối cùng (thường là tên tòa nhà)
 *  - Nếu tất cả là romaji → trả "" (không search POI vì Kakao POI là Hangul)
 */
function extractBuildingKeyword(road, jibun) {
  // Ưu tiên phần có Hangul (vì POI Kakao phần lớn là Hangul)
  const hangulPart = [jibun, road].find((p) => p && /[가-힣]/.test(p));
  const primary = hangulPart || road || jibun || "";

  // 1) Ưu tiên block có keyword tòa nhà
  const taggedMatch = primary.match(/([가-힣0-9]+(?:빌라|아파트|오피스텔|타워|하우스|빌딩|오피스|맨션|캐슬|팰리스|파크|하이빌|레지던스)[^\s|]*)(\s+\d+(-\d+)?)?/);
  if (taggedMatch) {
    return (taggedMatch[1] + (taggedMatch[2] || "")).trim();
  }

  // 2) Nếu có Hangul → lấy block Hangul cuối + số nhà kèm theo
  const hangulBlocks = primary.match(/[가-힣][가-힣0-9]+/g);
  if (hangulBlocks && hangulBlocks.length > 0) {
    const lastHangul = hangulBlocks[hangulBlocks.length - 1];
    const withBunji = primary.match(new RegExp(lastHangul + '\\s*\\d+(-\\d+)?'));
    return withBunji ? withBunji[0] : lastHangul;
  }

  // 3) Romaji only → lấy 3 token cuối (loại postal) + số nhà
  const cleaned = primary
    .replace(/\broom\b\s*\d+/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  const tokens = cleaned.split(/\s+/).filter((t) => !/^\d{5}$/.test(t)); // bỏ postal code 5 số
  const lastTokens = tokens.slice(-3).filter((t) => !/^\d+$/.test(t));
  if (lastTokens.length === 0) return "";
  const bunjiMatch = cleaned.match(/\b\d+(-\d+)?\s*$/);
  let query = bunjiMatch ? lastTokens.join(" ") + " " + bunjiMatch[0] : lastTokens.join(" ");

  // Áp dụng bảng ánh xạ typo phổ biến → romaji đúng (giúp Kakao POI match dễ hơn)
  const typoMap = [
    [/\bVELLA\b/gi, "VILLA"],
    [/\bVELA\b/gi, "VILLA"],
    [/\bFOAM\b/gi, "FORUM"],
    [/\bPHAM\b/gi, "FORUM"],
    [/\bPOGKO\b/gi, "BOGO"],
    [/\bPOKO\b/gi, "BOGO"],
    [/\bBLDG\b/gi, "BUILDING"],
    [/\bBLD\b/gi, "BUILDING"],
    [/\bAPT\b/gi, "APARTMENT"],
  ];
  for (const [rx, rep] of typoMap) query = query.replace(rx, rep);
  return query;
}

async function searchKakaoKeyword(query) {
  if (!query) return null;
  if (!process.env.KAKAO_REST_API_KEY) {
    throw new Error("Thiếu KAKAO_REST_API_KEY");
  }

  const url =
    "https://dapi.kakao.com/v2/local/search/keyword.json" +
    `?query=${encodeURIComponent(query)}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `KakaoAK ${process.env.KAKAO_REST_API_KEY}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Kakao Keyword API error ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  return data.documents?.[0] || null;
}

/**
 * Sinh các query fallback từ road/jibun address bằng cách cắt dần:
 *   1) bỏ 번지 (số nhà "N-N", "N", "N번지")
 *   2) bỏ 번/로/길 (giữ lại đến 리/동)
 *   3) bỏ 동/리 (giữ lại đến 읍/면/동)
 */
function generateFallbackCandidates(road, jibun) {
  const out = [];
  const seen = new Set();

  function push(q) {
    if (!q) return;
    const norm = q.trim().replace(/\s+/g, " ");
    if (!norm || norm.length < 3) return;
    if (seen.has(norm)) return;
    seen.add(norm);
    out.push(norm);
  }

  // Chuẩn hóa: bỏ 괄호 "(...)" thường gặp kiểu "(마송리)"
  const stripParen = (s) => s.replace(/\s*\([^)]*\)\s*/g, " ").trim();

  // Lấy danh sách các base (jibun ưu tiên trước vì chính xác hơn)
  const bases = [];
  if (jibun) bases.push(stripParen(jibun));
  if (road) bases.push(stripParen(road));

  // Regex tiện ích
  const RX_BUNJI = /\s+\d+(-\d+)?(번지)?\s*$/; // số nhà "6-1", "12번지"
  const RX_GIL = /\s+[^\s]*(번길|로|가)\s*$/; // tên đường "...로/번길/가"
  const RX_RI = /\s+[^\s]*(리|동)\s*$/; // "...리/동"

  for (const base of bases) {
    let s = base;
    push(s); // gốc

    // 1) cắt 번지
    const noBunji = s.replace(RX_BUNJI, "").trim();
    push(noBunji);

    // 2) cắt thêm đường (giữ lại 리)
    if (noBunji && noBunji !== s) {
      const noGil = noBunji.replace(RX_GIL, "").trim();
      push(noGil);

      // 3) cắt tiếp 리
      if (noGil && noGil !== noBunji) {
        const noRi = noGil.replace(RX_RI, "").trim();
        push(noRi);
      }
    }
  }

  return out;
}

function cleanBuildingName(building = "", detailAddress = "") {
  let result = String(building).trim();
  if (!result) return "";

  const dongMatch = String(detailAddress).match(/([A-Za-z0-9가-힣]+동)/);
  if (dongMatch && result.endsWith(dongMatch[1])) {
    result = result.slice(0, -dongMatch[1].length);
  }

  return result.trim();
}

/**
 * Tách nhanh name/phone/detailAddress từ text gốc bằng regex (không qua AI).
 * Dùng khi text đã là tiếng Hàn và Kakao match được luôn.
 */
function extractQuickFields(text = "") {
  const s = String(text);
  const phoneMatch = s.match(/(010|011|016|017|018|019)[-.\s]?\d{3,4}[-.\s]?\d{4}/);
  const phone = phoneMatch ? phoneMatch[0] : "";

  // Tách name: thường là token đầu tiên có người (chỉ áp dụng cho VN: "Nguyễn Văn A")
  // Trong hệ thống X2, name thường đi kèm phone và nằm ở dòng đầu/"Tên: ..." hoặc pattern khác
  // → bỏ trống, không đoán mò
  const name = "";

  // detailAddress: phần cuối sau địa chỉ chính, ví dụ "1동 205호" hoặc "(마송리) 1동 205호"
  const detailMatch = s.match(/(\d+동|\d+호|층|호수)/g);
  const detailAddress = detailMatch ? detailMatch.join(" ") : "";

  return { name, phone, detailAddress };
}

export async function POST(req) {
  try {
    const body = await req.json();
    const input = String(body?.input || "").trim();

    if (!input) {
      return Response.json(
        { success: false, exists: false, message: "Thiếu input" },
        { status: 400 },
      );
    }

    const { text, imageUrls } = splitTextAndUrls(input);

    // Tải ảnh trước (nếu có) — không để bước sau mới làm
    const imageDataUris = [];
    for (const url of imageUrls) {
      try {
        imageDataUris.push(await fetchImageAsDataUri(url));
      } catch (err) {
        console.warn(`Bỏ qua ảnh ${url}:`, err.message);
      }
    }

    // Bước 0: Nếu input text là tiếng Anh → dịch sang tiếng Hàn TRƯỚC
    // rồi mới đưa cho AI extract (tiết kiệm 1 call, tăng độ chính xác).
    // Nếu đã là tiếng Hàn → không tốn call dịch.
    const textForAi = text ? await translateAddressToKorean(text) : "";

    // Bước 0.5: Nếu text đã là tiếng Hàn và không có ảnh → thử Kakao trước
    // để tránh tốn OpenAI cho địa chỉ đã chuẩn. Nếu match → bỏ qua AI extract.
    let extracted = null;
    if (textForAi && !looksEnglish(textForAi) && imageDataUris.length === 0) {
      const quickKakao = await searchKakaoAddress(textForAi);
      if (quickKakao) {
        // Tách tên, phone, detailAddress bằng regex đơn giản (không cần AI)
        const { name, phone, detailAddress } = extractQuickFields(text);
        const zip = quickKakao.road_address?.zone_no || quickKakao.address?.zone_no || "";
        extracted = {
          name: name || "",
          phone: phone || "",
          roadAddressCandidate: textForAi,
          jibunAddressCandidate: "",
          building: "",
          detailAddress: detailAddress || "",
        };
        console.log(`[quick-kakao] Match: "${textForAi}" → zone_no=${zip}`);
      }
    }

    // Bước 1: Gọi AI trích xuất (nếu chưa có kết quả từ quick-kakao)
    if (!extracted) {
      extracted = await extractAddressInformation(textForAi, imageDataUris);
    }
    let {
      name = "",
      phone = "",
      roadAddressCandidate = "",
      jibunAddressCandidate = "",
      building = "",
      detailAddress = "",
    } = extracted || {};

    // Bước 2: Chỉ dịch nếu AI vẫn trả về tiếng Anh (phòng trường hợp)
    if (looksEnglish(roadAddressCandidate) || looksEnglish(jibunAddressCandidate)) {
      const [r, j] = await Promise.all([
        translateAddressToKorean(roadAddressCandidate),
        translateAddressToKorean(jibunAddressCandidate),
      ]);
      roadAddressCandidate = r;
      jibunAddressCandidate = j;
    }

    const kakao = await findKakaoAddress({
      roadAddressCandidate,
      jibunAddressCandidate,
    });

    const baseResponse = {
      success: true,
      inputType:
        imageUrls.length && text
          ? "mixed"
          : imageUrls.length
          ? "image"
          : "text",
      input,
      name,
      phone: cleanPhone(phone),
      extracted: {
        roadAddressCandidate,
        jibunAddressCandidate,
        building,
        detailAddress,
      },
      wasTranslated: looksEnglish(
        extracted?.roadAddressCandidate || "",
      ),
    };

    if (!kakao) {
      return Response.json({
        ...baseResponse,
        exists: false,
        roadAddress: null,
        jibunAddress: null,
        building,
        detailAddress,
        normalizedAddress: null,
        message: "Kakao không tìm thấy địa chỉ chính.",
      });
    }

    const item = kakao.result;
    const roadAddress = item?.road_address?.address_name || "";
    const jibunAddress = item?.address?.address_name || "";
    const kakaoBuilding = item?.road_address?.building_name || "";
    const finalBuilding = cleanBuildingName(
      building || kakaoBuilding,
      detailAddress,
    );
    const baseAddress =
      roadAddress ||
      jibunAddress ||
      roadAddressCandidate ||
      jibunAddressCandidate;
    const normalizedAddress = [baseAddress, finalBuilding, detailAddress]
      .filter(Boolean)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    return Response.json({
      ...baseResponse,
      exists: true,
      roadAddress,
      jibunAddress,
      building: finalBuilding,
      detailAddress,
      normalizedAddress,
      postalCode: item?.road_address?.zone_no || "",
      longitude: item?.x || "",
      latitude: item?.y || "",
      kakao: {
        matchedBy: kakao.matchedBy,
        searchedAddress: kakao.searchedAddress,
      },
    });
  } catch (error) {
    console.error("KOREAN ADDRESS ERROR:", error);
    return Response.json(
      {
        success: false,
        exists: false,
        message: error?.message || "Lỗi server",
      },
      { status: 500 },
    );
  }
}
