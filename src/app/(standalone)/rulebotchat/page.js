import React from "react";

// Trang con của /rulebotchat — Privacy Policy.
// Header, tab điều hướng và style toàn cục đã được khai báo ở
// src/app/(standalone)/rulebotchat/layout.js.
export const metadata = {
  title: "Privacy Policy – Extension Inbox Camp",
  description:
    "Chính sách bảo mật của tiện ích mở rộng trình duyệt Inbox Camp – công cụ hỗ trợ quản lý nhiều trang Facebook.",
  robots: { index: true, follow: true },
};

export default function RulebotChatPrivacyPage() {
  return (
    <>
      <h2 style={{ marginTop: 0 }}>Privacy Policy</h2>
      <p className="updated">Cập nhật lần cuối: ngày 07 tháng 10 năm 2026</p>

      <p>
        Tiện ích mở rộng trình duyệt <b>&quot;Inbox Camp&quot;</b> (gọi tắt
        là <b>&quot;Extension&quot;</b>) là công cụ hỗ trợ quản lý nhiều
        trang Facebook (Facebook Pages) từ một giao diện duy nhất. Tài liệu
        này mô tả cách Extension xử lý dữ liệu người dùng.
      </p>

      <h2>1. Dữ liệu chúng tôi thu thập</h2>
      <p>
        Extension chỉ truy cập các dữ liệu mà bạn chủ động cấp quyền cho
        Extension thông qua Facebook Login (OAuth):
      </p>
      <ul>
        <li>
          <b>Access Token</b> do Facebook cấp — chỉ dùng để gọi Facebook
          Graph API phục vụ các tính năng bạn đã bật.
        </li>
        <li>
          <b>Danh sách Page</b> bạn quản lý — hiển thị trong dashboard, không
          gửi đi đâu ngoài Facebook.
        </li>
        <li>
          <b>Hội thoại Messenger</b> giữa bạn và khách hàng của Page — hiển
          thị trong dashboard, có thể được Extension phản hồi tự động khi bạn
          bật tính năng &quot;Trả lời tự động bằng AI&quot;.
        </li>
        <li>
          <b>Cài đặt cá nhân</b> (câu hệ thống cho AI, danh sách từ khoá,
          cấu hình thông báo) — lưu cục bộ trong{" "}
          <code>chrome.storage.local</code> của trình duyệt.
        </li>
      </ul>

      <h2>2. Dữ liệu chúng tôi KHÔNG thu thập</h2>
      <ul>
        <li>
          Không thu thập tên, email, số điện thoại, địa chỉ IP của người
          dùng Extension.
        </li>
        <li>Không dùng cookie theo dõi, không đặt quảng cáo.</li>
        <li>Không bán dữ liệu cho bên thứ ba.</li>
        <li>Không ghi log ra máy chủ riêng của Extension.</li>
      </ul>

      <h2>3. Cách dữ liệu được sử dụng</h2>
      <p>Mọi dữ liệu chỉ được dùng cho mục đích:</p>
      <ul>
        <li>Hiển thị hội thoại Messenger của Page trong dashboard.</li>
        <li>
          Gửi trả lời tự động (nếu bạn bật và chỉ khi khách hàng gửi tin
          nhắn mới).
        </li>
        <li>Lưu cài đặt Extension vào bộ nhớ cục bộ của trình duyệt.</li>
      </ul>
      <p>
        Extension <b>không</b> gửi hội thoại, token, hay cài đặt của bạn
        lên máy chủ của bên thứ ba. Mọi yêu cầu đi qua Facebook Graph API
        đều được gửi trực tiếp từ trình duyệt của bạn tới máy chủ Meta.
      </p>

      <h2>4. Lưu trữ và bảo mật</h2>
      <ul>
        <li>
          Token và dữ liệu hội thoại được lưu trong{" "}
          <code>chrome.storage.local</code> của trình duyệt — chỉ truy cập
          được từ máy tính của bạn.
        </li>
        <li>
          Bạn có thể xoá toàn bộ dữ liệu Extension bằng cách gỡ tiện ích
          khỏi trình duyệt.
        </li>
      </ul>

      <h2>5. Quyền của bạn</h2>
      <ul>
        <li>
          Bạn có thể thu hồi quyền của Extension bất kỳ lúc nào tại{" "}
          <a
            href="https://www.facebook.com/settings/tab/applications/"
            target="_blank"
            rel="noopener noreferrer"
          >
            facebook.com/settings/tab/applications
          </a>
          .
        </li>
        <li>
          Bạn có thể xoá toàn bộ dữ liệu Extension bằng cách gỡ cài đặt
          tiện ích.
        </li>
        <li>Mọi yêu cầu về dữ liệu, vui lòng liên hệ email bên dưới.</li>
      </ul>

      <h2>6. Liên hệ</h2>
      <p>
        Mọi thắc mắc về quyền riêng tư, vui lòng gửi về:{" "}
        <a href="mailto:contact@example.com">contact@example.com</a>.
      </p>

      <hr />
      <p className="footer-note">
        Extension này không phải sản phẩm chính thức của Meta Platforms, Inc.
        Facebook và Messenger là thương hiệu của Meta Platforms, Inc.
      </p>
    </>
  );
}