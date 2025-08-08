"use client";
import { useState, useEffect } from "react";

const PraiseBanner = ({ top5Employees }) => {
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (top5Employees.length === 0) return;

  const phrasesTop1 = [
      "{{name}} Hãy để doanh số hôm nay trở thành kỷ niệm đáng nhớ của bạn!",
      "Hãy tiếp tục giữ vững phong độ như {{name}} nhé cả nhà!",
      "Bản lĩnh MKT là đây – và {{name}} chính là hình mẫu!",
      "Từ một người ít nói, {{name}} đã vươn mình mạnh mẽ qua từng ngày!",
      "{{name}} không chỉ đang tăng doanh số – bạn đang tạo dấu ấn cá nhân.",
      "Ai sẽ vượt qua {{name}}? Thử thách đã được đặt ra!",
      "Chính nỗ lực thầm lặng của {{name}} đang tạo nên sự khác biệt lớn!",
      "Khi người khác nghỉ ngơi, {{name}} vẫn không ngừng tiến lên!",
      "Trưa rồi nhưng {{name}} vẫn chưa có dấu hiệu chậm lại!",
      "{{name}} đang dẫn đầu doanh số hôm nay với {{sales}}! Quá xuất sắc!",
      "Mỗi đơn hàng của {{name}} là một bước tiến cho công ty.",
      "Từng con số của bạn là từng viên gạch xây dựng thành công.",
      "Đừng dừng lại nhé {{name}}, bạn đang đi đúng hướng!",
      "Xin chúc mừng {{name}}, top 1 doanh số tính đến thời điểm này!",
      "Doanh số hôm nay đang gọi tên {{name}} – đỉnh cao MKT!",
      "Tập thể chúng ta đang lớn mạnh nhờ những ngôi sao như {{name}}!",
      "{{name}} không chỉ bán tốt, còn truyền cảm hứng cho cả team!",
      "Tinh thần và kết quả của {{name}} là động lực cho cả bộ phận MKT!",
      "Không ai ngờ {{name}} lại lật ngược tình thế nhanh đến vậy!"
    ];

    const phrases15tr = [
      "Ai sẽ là người tiếp theo vượt mốc 15 triệu cùng {{name}}?",
      "Nếu hôm nay bạn mệt, hãy nhìn doanh số của {{name}} – cảm hứng là đây!",
      "Ai đang cần cảm hứng? Hãy nhìn vào doanh số của {{name}}!",
      "{{name}} là minh chứng cho việc: nỗ lực không bao giờ phản bội!",
      "{{name}} vừa vượt mốc 15 triệu đồng! Chúng tôi tự hào về bạn!",
      "Cột mốc 15 triệu đã được {{name}} chinh phục!",
      "Với {{sales}}, {{name}} đang làm bùng nổ bảng xếp hạng!",
      "{{name}} đã cán mốc {{sales}}, tiếp tục giữ vững phong độ nhé!",
      "Tăng trưởng liên tục! {{name}} đang trở thành hình mẫu lý tưởng!"
    ];

    const phrases20tr = [
      "Chỉ trong hôm nay, {{name}} đã bán hơn 20tr – không thể tin nổi!",
      "20 triệu doanh số? Đúng là {{name}} không có giới hạn!",
      "{{name}} là minh chứng cho việc: nỗ lực không bao giờ phản bội!"
    ];

    const phrasesTop2 = [
      "Đừng dừng lại nhé {{name}}, bạn đang đi đúng hướng!",
      "Khi người khác nghỉ ngơi, {{name}} vẫn không ngừng tiến lên!",
      "Chính nỗ lực thầm lặng của {{name}} đang tạo nên sự khác biệt lớn!",
      "Mỗi phút trôi qua, {{name}} lại tiến gần hơn đến vị trí số 1!",
      "Còn thời gian – đừng bỏ lỡ cơ hội ghi danh hôm nay!",
      "{{name}} đang bám rất sát Top 1 Server , cuộc đua doanh số cực kỳ gay cấn!",
      "{{name}} không chỉ đang tăng doanh số – bạn đang tạo dấu ấn cá nhân.",
      "Mỗi người một bước – cả đội cùng lên như {{name}} đang làm!"
    ];

    const phrasesTop3 = [
      "Đừng dừng lại nhé {{name}}, bạn đang đi đúng hướng!",
      "Khi người khác nghỉ ngơi, {{name}} vẫn không ngừng tiến lên!",
      "Chính nỗ lực thầm lặng của {{name}} đang tạo nên sự khác biệt lớn!",
      "{{name}} không chỉ đang tăng doanh số – bạn đang tạo dấu ấn cá nhân.",
      "Mỗi người một bước – cả đội cùng lên như {{name}} đang làm!"
    ];

    function getPraiseText(rank, name, sales) {
      const salesDisplay = sales.toLocaleString("vi-VN") + " VNĐ";
      if (rank === 0) {
        if (sales > 30000000 || sales > 20000000) {
          return replace(getRandomItem(phrases20tr), name, salesDisplay);
        } else if (sales > 15000000) {
          return replace(getRandomItem(phrases15tr), name, salesDisplay);
        } else {
          return replace(getRandomItem(phrasesTop1), name, salesDisplay);
        }
      } else if (rank === 1) {
        return replace(getRandomItem(phrasesTop2), name, salesDisplay);
      } else if (rank === 2) {
        return replace(getRandomItem(phrasesTop3), name, salesDisplay);
      }
      return "";
    }

    function getRandomItem(arr) {
      return arr[Math.floor(Math.random() * arr.length)];
    }

    function replace(template, name, sales) {
      return template.replace(/{{name}}/g, name).replace(/{{sales}}/g, sales);
    }

    function generateMessage() {
      const index = Math.floor(Math.random() * Math.min(top5Employees.length, 3));
      const emp = top5Employees[index];
      return getPraiseText(index, emp.name, emp.totalToday * 17000);
    }

    // Gọi lần đầu
    setMessage(generateMessage());

    // Đổi câu mỗi 20 giây
    const interval = setInterval(() => {
      setMessage(generateMessage());
    }, 30000);

    return () => clearInterval(interval);
  }, [top5Employees]);

  if (top5Employees.length === 0 || !message) return null;

 return (
  <>
    <style jsx>{`
      @keyframes slide-left {
        -20% {
          transform: translateX(80%);
        }
        100% {
          transform: translateX(-80%);
        }
      }
      .marquee-container {
        width: 100%;
        overflow: hidden;
        height: 80px;
        background: linear-gradient(90deg, #bfda5eff, #ace237ff);
        border: 1px solid #73e312ff;
        border-radius: 10px;
        padding: 10px 0;
        margin-bottom: 12px;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
      }
      .marquee-text {
        display: inline-block;
        white-space: nowrap;
        animation: slide-left 30s linear infinite;
        font-weight: 700;
        font-size: 32px;
        color: #f60112ff;
        padding-left: 100%;
      }
      .highlight-name {
        color: #0fff02e1;
        font-weight: 1500;
        text-shadow: 1px 1px 2px rgba(45, 48, 185, 0.15);
      }
    `}</style>
    <div className="marquee-container">
      <div
        className="marquee-text"
        dangerouslySetInnerHTML={{
          __html: message.replace(
            /(\S+)/, // tạm thời chỉ highlight từ đầu tiên nếu là tên
            `<span class="highlight-name">$1</span>`
          ),
        }}
      />
    </div>
  </>
);
};

export default PraiseBanner;
