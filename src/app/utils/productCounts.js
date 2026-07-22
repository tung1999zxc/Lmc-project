export const getLockedProductCounts = (products = []) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const locked = products.filter((p) => {
    if (!p?.testday) return false;
    if ((p.mkttest || "").trim() === "SP MỚI") return false;

    const testDate = new Date(p.testday);
    if (isNaN(testDate.getTime())) return false;
    testDate.setHours(0, 0, 0, 0);

    const diffDays = Math.floor((today - testDate) / (1000 * 60 * 60 * 24));
    return diffDays <= 4 && diffDays >= 0;
  });

  const baseNames = new Set();
  for (const p of locked) {
    const fullName = String(p?.name || "").trim();
    if (!fullName) continue;
    let baseName = fullName;
    if (fullName.includes(" - ")) {
      baseName = fullName.split(" - ")[0].trim();
    } else if (fullName.includes("-")) {
      baseName = fullName.split("-")[0].trim();
    }
    if (baseName) baseNames.add(baseName.toLowerCase());
  }

  return {
    productCount: baseNames.size,
    variantsCount: locked.length,
  };
};

export const getLockedProductCount = (products = []) => getLockedProductCounts(products).productCount;

export const getLockedProductVariantsCount = (products = []) => getLockedProductCounts(products).variantsCount;

/** Helper: compute SL Âm for a single product */
const nameAdjustments = {
  "KEM NỀN THỎI": { slAmAdd: 2 },
  "MẶT NẠ BONG BÓNG": { slAmAdd: 28 },
  "KÍNH NỮ": { slAmAdd: 1 },
  "TAI NGHE AI - TRẮNG": { slAmAdd: 2 },
  "TAI NGHE AI - TÍM": { slAmAdd: 2 },
  "GÓI NHUỘM TÓC - ĐEN": { slAmAdd: 2 },
  "ĐỒNG HỒ CẢM ỨNG MẶT VUÔNG - ĐEN": { slAmAdd: 2 },
  "ĐỒNG HỒ CẢM ỨNG MẶT VUÔNG - CAM": { slAmAdd: 1 },
  "ĐỒNG HỒ CẢM ỨNG MẶT VUÔNG - VÀNG": { slAmAdd: 1 },
  "VIÊN TINH CHẤT HÀU": { slAmAdd: 6 },
};

const buildOrdersAggMap = (orders) => {
  const map = {};
  for (const order of orders) {
    const profitNum = Number(order.profit || 0);
    const deliveryStatus = order.deliveryStatus || "";
    const saleReport = order.saleReport || "";
    const productsInOrder = Array.isArray(order.products) ? order.products : [];

    for (const item of productsInOrder) {
      const pname = item.product;
      const qty = Number(item.quantity || 0);
      if (!pname) continue;
      if (!map[pname]) {
        map[pname] = { ordersDone: 0, deliveredQty: 0, ordersNotDone: 0, totalProfit: 0 };
      }
      map[pname].totalProfit += profitNum;
      if (
        deliveryStatus === "ĐÃ GỬI HÀNG" ||
        deliveryStatus === "GIAO THÀNH CÔNG" ||
        deliveryStatus === "BỊ BẮT CHỜ GỬI LẠI"
      ) {
        map[pname].deliveredQty += qty;
      }
      if (saleReport === "DONE" && (!deliveryStatus || deliveryStatus === "")) {
        map[pname].ordersDone += qty;
      }
      if (saleReport !== "DONE") {
        map[pname].ordersNotDone += qty;
      }
    }
  }
  return map;
};

const getSlAmForProduct = (p, ordersAggMap) => {
  const totalImported =
    ((p.imports || []).reduce((acc, cur) => {
      return (
        acc +
        (Number(cur.importedQty) || 0) +
        (Number(cur.importVN) || 0) +
        (Number(cur.importKR) || 0)
      );
    }, 0)) +
    (Number(p.slvn) || 0) +
    (Number(p.sltq) || 0);

  const agg = ordersAggMap[p.name] || { ordersDone: 0, deliveredQty: 0 };
  const slAm = totalImported - (agg.ordersDone || 0) - (agg.deliveredQty || 0);
  const adjust = nameAdjustments[p.name]?.slAmAdd || 0;
  return slAm + adjust;
};

/**
 * Count products with negative stock (SL Âm < 0) — "SP bán chạy" badge
 * Mirrors logic in Best-sellingProducts page: top 30 variants sorted by SL Âm ascending,
 * then count unique base names. Requires both products and orders data.
 */
export const getBestSellingProductCount = (products = [], orders = []) => {
  const ordersAggMap = buildOrdersAggMap(orders);
  const baseNames = new Set();

  const amProducts = [];
  const fallback = [];
  for (const p of products) {
    fallback.push(p);
    const slAm = getSlAmForProduct(p, ordersAggMap);
    if (slAm < 0) amProducts.push({ p, slAm });
  }

  let data;
  if (amProducts.length > 0) {
    amProducts.sort((a, b) => a.slAm - b.slAm);
    data = amProducts.slice(0, 30).map((x) => x.p);
  } else {
    data = fallback.slice(0, 30);
  }

  for (const p of data) {
    const fullName = String(p?.name || "").trim();
    if (!fullName) continue;
    let baseName = fullName;
    if (fullName.includes(" - ")) {
      baseName = fullName.split(" - ")[0].trim();
    } else if (fullName.includes("-")) {
      baseName = fullName.split("-")[0].trim();
    }
    if (baseName) baseNames.add(baseName.toLowerCase());
  }
  return baseNames.size;
};
