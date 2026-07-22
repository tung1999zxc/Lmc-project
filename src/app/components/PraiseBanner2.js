"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import { useSelector } from "react-redux";

const PraiseBanner2 = () => {
  const [message, setMessage] = useState("");
  const [employees, setEmployees] = useState([]);
  const [orders, setOrders] = useState([]);
  const [adsMoneyData, setAdsMoneyData] = useState([]);
  const exchangeRate = 17000;

  const marqueeRef = useRef(null);

  // Redux
  const reduxCurrentUser = useSelector((state) => state.user.currentUser) || {};
  const currentUser = useMemo(() => reduxCurrentUser, [reduxCurrentUser]);

  // Fetch data
  const fetchOrders = async () => {
    try {
      const url = "/api/orders2?selectedPreset=today";
      const response = await axios.get(url);
      setOrders(response.data.data || []);
    } catch (error) {
      console.error("Lỗi khi lấy orders:", error);
    }
  };

  const fetchRecords = async () => {
    try {
      const response = await axios.get("/api/recordsMKT");
      setAdsMoneyData(response.data.data || []);
    } catch (error) {
      console.error("Lỗi khi lấy records:", error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await axios.get("/api/employees");
      setEmployees(response.data.data || []);
    } catch (error) {
      console.error("Lỗi khi lấy employees:", error);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchEmployees();
    fetchRecords();

    const interval = setInterval(() => {
      fetchOrders();
    }, 300000);

    return () => clearInterval(interval);
  }, []);

  // Tính top employee
  const mktEmployees = employees.filter((emp) => emp.position_team === "mkt");

  const marketingReportData3 = mktEmployees.map((emp, index) => {
    const nameLC = emp.name.trim().toLowerCase();
    const today = new Date();
    const startOfToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const endOfToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + 1
    );

    const totalToday = orders
      .filter((order) => {
        const orderDate = new Date(order.createdAt);
        return (
          order.mkt.trim().toLowerCase() === nameLC &&
          orderDate >= startOfToday &&
          orderDate < endOfToday
        );
      })
      .reduce((sum, order) => sum + order.profit, 0);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );

    const adsThisMonth = adsMoneyData
      .filter((ad) => {
        const adDate = new Date(ad.createdAt);
        return (
          ad.name.trim().toLowerCase() === nameLC &&
          adDate >= startOfMonth &&
          adDate <= endOfMonth
        );
      })
      .reduce((sum, ad) => sum + (ad.request1 + ad.request2), 0);

    return { key: index, name: emp.name, totalToday, adsThisMonth };
  });

  const top5Employees = marketingReportData3
    .filter((emp) => emp.adsThisMonth > 0)
    .sort((a, b) => b.totalToday - a.totalToday)
    .slice(0, 3);

  // ================== Random câu vinh danh ==================
  useEffect(() => {
    if (top5Employees.length === 0) return;

    const phrases = [
      "{{name}} Hãy để doanh số hôm nay trở thành kỷ niệm đáng nhớ của bạn!",
      "Hãy tiếp tục giữ vững phong độ như {{name}} nhé cả nhà!",
      "{{name}} đang viết nên câu chuyện thành công mới cho team!",
      "{{name}}, bạn đã chứng minh đẳng cấp của mình!",
      "Chúng tôi tự hào khi có {{name}} trong đội!",
      "{{name}} đang chứng minh: tốc độ + kiên trì = thành công!",
      "Một ngày đầy năng lượng và doanh số cho {{name}}!",
      "Sáng nay {{name}} đứng giữa bảng xếp hạng, giờ thì top 1 rồi!",
      "Ai có thể ngăn nổi tốc độ của {{name}} hôm nay?",
      "Bước nhảy doanh số của {{name}} khiến BXH nóng rực!",
      "Hãy lấy tinh thần của {{name}} làm động lực để bứt phá!",
      "Ai muốn vào top hôm nay, hãy học cách {{name}} bứt phá!",
      "Team đang nóng lên nhờ cú bứt của {{name}}!",
      "{{name}} đã chứng minh rằng chăm chỉ là vũ khí mạnh nhất!",
      "Một ngày đẹp trời cho {{name}} và toàn bộ team MKT!",
      "Liệu {{name}} có giữ được vị trí đến cuối ngày?",
      "💰 {{name}} hút tiền về công ty như nam châm hút sắt!  ",
      "⚡ {{name}} chốt đơn nhanh hơn cả tia chớp!",
      "🎯 {{name}} bắn phát nào trúng đơn phát đó!",
      "🐉 {{name}} quẩy doanh số như rồng cuộn mây bay!",
      "🍀 {{name}} may mắn và tài năng kết hợp hoàn hảo!",
      "🕹 {{name}} điều khiển doanh số như chơi game!",
      "🍩 {{name}} thêm “đường” vào doanh số cho ngọt!",
      "🥶 {{name}} làm lạnh túi tiền khách nhưng làm nóng doanh số!",

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
      "Không ai ngờ {{name}} lại lật ngược tình thế nhanh đến vậy!",
      "🎤 {{name}} hát bản hit “Doanh số là đam mê”!",
      "🧨 {{name}} bùng nổ doanh số bất ngờ!",
      "🎢 {{name}} lái tàu lượn doanh số lên đỉnh!",
      "🥤 {{name}} uống “nước doanh số” không ngừng!",
      "🥊 {{name}} hạ knock-out mọi đối thủ doanh số!",
      "🧗 {{name}} leo đỉnh doanh số nhanh nhất hôm nay!",
      "🧨 {{name}} kích nổ doanh số bất ngờ!",
      "🏹 {{name}} nhắm đâu trúng đó, toàn đơn ngon!",
      "🌠 {{name}} là ngôi sao băng doanh số hôm nay!",
      "🧲 {{name}} hút khách về như nam châm!",
      "🪵 {{name}} góp từng “củi” vào lửa doanh số!",
      "🥗 {{name}} trộn đều bí quyết thành công và doanh số!",
      "🦦 {{name}} ôm trọn mọi đơn ngon!",
    ];

    let currentIndex = 0;

    function getRandomItem(arr) {
      return arr[Math.floor(Math.random() * arr.length)];
    }

    function replace(template, name, sales) {
      return template.replace(/{{name}}/g, name).replace(/{{sales}}/g, sales);
    }

    function generateMessage() {
      const emp = top5Employees[currentIndex % top5Employees.length];
      const salesDisplay =
        (emp.totalToday * exchangeRate).toLocaleString("vi-VN") + " VNĐ";
      const template = getRandomItem(phrases);
      setMessage(replace(template, emp.name, salesDisplay));
      currentIndex++;
    }

    generateMessage(); // chạy câu đầu tiên

    const el = marqueeRef.current;
    if (!el) return;

    // mỗi lần chạy hết 1 vòng animation thì đổi câu
    const handleAnimationEnd = () => {
      generateMessage();
    };

    el.addEventListener("animationiteration", handleAnimationEnd);

    return () => {
      el.removeEventListener("animationiteration", handleAnimationEnd);
    };
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
          display: none;
        }
        .marquee-text {
          display: none;
        }
        .highlight-name {
          color: #0fff02e1;
          font-weight: 1500;
          text-shadow: 1px 1px 2px rgba(45, 48, 185, 0.15);
        }
      `}</style>
      <div className="marquee-container">
        <div
          ref={marqueeRef}
          className="marquee-text"
          dangerouslySetInnerHTML={{
            __html: message.replace(
              /(\S+)/,
              `<span class="highlight-name">$1</span>`
            ),
          }}
        />
      </div>
    </>
  );
};

export default PraiseBanner2;
