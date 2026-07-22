// Mapping pathname → tên hiển thị trên tab trình duyệt.
// Mỗi entry đảm bảo khớp với label trong SidebarMenu (src/app/components/SidebarMenu.js).
// Title đầy đủ sẽ là "LMC - <pageLabel>" theo format yêu cầu.
export const pageTitleMap = {
  "/overviewall": "Tổng Quan",
  "/": "Tổng Quan Hàn",
  "/overviewjp": "Tổng Quan Malaysia",
  "/overviewtw": "Tổng Quan Đài",
  "/overViewSale": "Báo cáo cá nhân",
  "/orders": "Quản lý đơn hàng Hàn",
  "/ordersjp": "Quản lý đơn hàng Malaysia",
  "/orderstw": "Quản lý đơn hàng Đài",
  "/mkt": "Báo cáo MKT Hàn",
  "/mktjp": "Báo cáo MKT Malaysia",
  "/mkttw": "Báo cáo MKT Đài",
  "/sale/saleOrder": "Sale CHAT",
  "/sale/saleProcessing": "Sale VẬN ĐƠN",
  "/products": "Tất cả sản phẩm",
  "/productsjp": "Tất cả sản phẩm",
  "/productstw": "Tất cả sản phẩm",
  "/pagesName": "Tên page",
  "/accounts": "Quản lý tài khoản",
  "/attendance": "Chấm công SALE",
  "/OrderHistory": "Lịch sử chỉnh sửa đơn hàng",
  "/NotificationManagement": "Quản lý thông báo",
  "/LockProduct": "SP bị khóa",
  "/Best-sellingProducts": "SP bán chạy",
  "/LastDeleteOrder": "Đơn xóa DONE",
  "/login": "Đăng nhập",
};

// Format chuẩn LMC - <Tên trang>
export const buildPageTitle = (pathname) => {
  if (!pathname || pathname === "/") {
    return `LMC - ${pageTitleMap["/"] || "Dashboard"}`;
  }
  // exact match first
  if (pageTitleMap[pathname]) {
    return `LMC - ${pageTitleMap[pathname]}`;
  }
  // match theo prefix cho sub-route (ví dụ /orders/123 → Quản lý đơn hàng Hàn)
  const matchedKey = Object.keys(pageTitleMap)
    .filter((k) => k !== "/" && pathname.startsWith(`${k}/`))
    .sort((a, b) => b.length - a.length)[0];
  if (matchedKey) {
    return `LMC - ${pageTitleMap[matchedKey]}`;
  }
  // fallback: lấy path làm tên
  const fallback = pathname.replace(/^\//, "").replace(/[-_]/g, " ");
  return `LMC - ${fallback || "Dashboard"}`;
};