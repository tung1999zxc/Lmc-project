"use client";

import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import Link from "next/link";
import axios from "axios";
import { usePathname, useRouter } from "next/navigation";
import { setCurrentUser } from "../store/userSlice";
import { LogoutOutlined } from "@ant-design/icons";
import CustomerHistoryModal from "../components/CustomerHistoryModal";

const getInitials = (name) => {
  if (!name) return "??";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const DynamicTime = () => {
  const [time, setTime] = useState(new Date());
  const [weather, setWeather] = useState({
    temp: 28,
    humidity: 75,
    icon: "☀️",
  });

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=21.04&longitude=105.78&current=temperature_2m,relative_humidity_2m,weather_code&timezone=Asia/Ho_Chi_Minh`,
        );
        if (!response.ok) return;
        const data = await response.json();
        if (!data.current) return;
        const temp = Math.round(data.current.temperature_2m);
        const humidity = data.current.relative_humidity_2m;
        const code = data.current.weather_code;
        const weatherData = getWeatherFromCode(code);
        setWeather({ temp, humidity, ...weatherData });
      } catch (error) {
        console.log("Weather fetch error:", error);
      }
    };

    fetchWeather();
    const weatherTimer = setInterval(fetchWeather, 10 * 60 * 1000);
    return () => clearInterval(weatherTimer);
  }, []);

  const getWeatherFromCode = (code) => {
    if (code === 0) return { condition: "Trời quang", icon: "☀️" };
    if (code === 1) return { condition: "Ít mây", icon: "🌤️" };
    if (code === 2) return { condition: "Nhiều mây", icon: "⛅" };
    if (code === 3) return { condition: "U ám", icon: "☁️" };
    if (code === 45) return { condition: "Sương mù", icon: "🌫️" };
    if (code === 48) return { condition: "Sương mù đóng băng", icon: "🌫️" };
    if (code === 51) return { condition: "Phùn nhẹ", icon: "🌦️" };
    if (code === 53) return { condition: "Phùn", icon: "🌦️" };
    if (code === 55) return { condition: "Phùn đặc", icon: "🌦️" };
    if (code === 56) return { condition: "Mưa đóng băng nhẹ", icon: "🌨️" };
    if (code === 57) return { condition: "Mưa đóng băng", icon: "🌨️" };
    if (code === 61) return { condition: "Mưa nhỏ", icon: "🌧️" };
    if (code === 63) return { condition: "Mưa vừa", icon: "🌧️" };
    if (code === 65) return { condition: "Mưa to", icon: "🌧️" };
    if (code === 66) return { condition: "Mưa đóng băng nhẹ", icon: "🌨️" };
    if (code === 67) return { condition: "Mưa đóng băng nặng", icon: "🌨️" };
    if (code === 71) return { condition: "Tuyết nhẹ", icon: "🌨️" };
    if (code === 73) return { condition: "Tuyết vừa", icon: "🌨️" };
    if (code === 75) return { condition: "Tuyết to", icon: "❄️" };
    if (code === 77) return { condition: "Mưa tuyết", icon: "🌨️" };
    if (code === 80) return { condition: "Mưa rào nhẹ", icon: "🌦️" };
    if (code === 81) return { condition: "Mưa rào vừa", icon: "🌧️" };
    if (code === 82) return { condition: "Mưa rào dữ dội", icon: "⛈️" };
    if (code === 85) return { condition: "Tuyết rào nhẹ", icon: "🌨️" };
    if (code === 86) return { condition: "Tuyết rào nặng", icon: "❄️" };
    if (code === 95) return { condition: "Sấm sét", icon: "⚡" };
    if (code === 96) return { condition: "Giông kèm mưa đá", icon: "⛈️" };
    if (code === 99) return { condition: "Giông bão nặng", icon: "⛈️" };
    return { condition: "Nắng", icon: "☀️" };
  };

  const getTimeBasedStyles = () => {
    if (!time) return { greeting: "Chào buổi", color: "#fff" };
    const hour = time.getHours();
    if (hour >= 6 && hour < 12)
      return { greeting: "Chào buổi sáng", color: "#fbbf24" };
    if (hour >= 12 && hour < 18)
      return { greeting: "Chào buổi chiều", color: "#f97316" };
    return { greeting: "Chào buổi tối", color: "#8b5cf6" };
  };

  const timeStyle = getTimeBasedStyles();

  return (
    <div className="dyn-time-container dyn-time-sidebar">
      <div className="dyn-greeting" style={{ color: timeStyle.color }}>
        <span className="dyn-icon">{weather.icon}</span>
        <span className="dyn-text">{timeStyle.greeting}</span>
      </div>
      <div className="dyn-clock-row">
        <div className="dyn-clock">
          <span className="clock-time" suppressHydrationWarning>
            {time.toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </span>
          <span className="clock-date" suppressHydrationWarning>
            {time.toLocaleDateString("vi-VN", {
              weekday: "long",
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}
          </span>
        </div>
        <div className="dyn-weather-box">
          <div className="weather-row">
            <span className="weather-temp">{weather.temp}°C</span>
            <span className="weather-humidity">💧 {weather.humidity}%</span>
          </div>
          <span className="weather-condition">{weather.condition}</span>
        </div>
      </div>
    </div>
  );
};

const DynamicTimeTopbar = () => {
  const [time, setTime] = useState(new Date());
  const [weather, setWeather] = useState({
    temp: 28,
    humidity: 75,
    icon: "☀️",
  });
  const [showAnalog, setShowAnalog] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=21.04&longitude=105.78&current=temperature_2m,relative_humidity_2m,weather_code&timezone=Asia/Ho_Chi_Minh`,
        );
        if (!response.ok) return;
        const data = await response.json();
        if (!data.current) return;
        const temp = Math.round(data.current.temperature_2m);
        const humidity = data.current.relative_humidity_2m;
        const code = data.current.weather_code;
        const weatherData = getWeatherFromCode(code);
        setWeather({ temp, humidity, ...weatherData });
      } catch (error) {
        console.log("Weather fetch error:", error);
      }
    };

    fetchWeather();
    const weatherTimer = setInterval(fetchWeather, 10 * 60 * 1000);
    return () => clearInterval(weatherTimer);
  }, []);

  const getWeatherFromCode = (code) => {
    if (code === 0) return { condition: "Trời quang", icon: "☀️" };
    if (code === 1) return { condition: "Ít mây", icon: "🌤️" };
    if (code === 2) return { condition: "Nhiều mây", icon: "⛅" };
    if (code === 3) return { condition: "U ám", icon: "☁️" };
    if (code === 45) return { condition: "Sương mù", icon: "🌫️" };
    if (code === 48) return { condition: "Sương mù đóng băng", icon: "🌫️" };
    if (code === 51) return { condition: "Phùn nhẹ", icon: "🌦️" };
    if (code === 53) return { condition: "Phùn", icon: "🌦️" };
    if (code === 55) return { condition: "Phùn đặc", icon: "🌦️" };
    if (code === 56) return { condition: "Mưa đóng băng nhẹ", icon: "🌨️" };
    if (code === 57) return { condition: "Mưa đóng băng", icon: "🌨️" };
    if (code === 61) return { condition: "Mưa nhỏ", icon: "🌧️" };
    if (code === 63) return { condition: "Mưa vừa", icon: "🌧️" };
    if (code === 65) return { condition: "Mưa to", icon: "🌧️" };
    if (code === 66) return { condition: "Mưa đóng băng nhẹ", icon: "🌨️" };
    if (code === 67) return { condition: "Mưa đóng băng nặng", icon: "🌨️" };
    if (code === 71) return { condition: "Tuyết nhẹ", icon: "🌨️" };
    if (code === 73) return { condition: "Tuyết vừa", icon: "🌨️" };
    if (code === 75) return { condition: "Tuyết to", icon: "❄️" };
    if (code === 77) return { condition: "Mưa tuyết", icon: "🌨️" };
    if (code === 80) return { condition: "Mưa rào nhẹ", icon: "🌦️" };
    if (code === 81) return { condition: "Mưa rào vừa", icon: "🌧️" };
    if (code === 82) return { condition: "Mưa rào dữ dội", icon: "⛈️" };
    if (code === 85) return { condition: "Tuyết rào nhẹ", icon: "🌨️" };
    if (code === 86) return { condition: "Tuyết rào nặng", icon: "❄️" };
    if (code === 95) return { condition: "Sấm sét", icon: "⚡" };
    if (code === 96) return { condition: "Giông kèm mưa đá", icon: "⛈️" };
    if (code === 99) return { condition: "Giông bão nặng", icon: "⛈️" };
    return { condition: "Nắng", icon: "☀️" };
  };

  const getTimeBasedStyles = () => {
    const hour = time.getHours();
    if (hour >= 6 && hour < 12)
      return { greeting: "Chào buổi sáng", color: "#fbbf24" };
    if (hour >= 12 && hour < 14)
      return { greeting: "Chào buổi trưa", color: "#f97316" };
    if (hour >= 14 && hour < 18)
      return { greeting: "Chào buổi chiều", color: "#f97316" };
    return { greeting: "Chào buổi tối", color: "#8b5cf6" };
  };

  const timeStyle = getTimeBasedStyles();

  return (
    <div className="dyn-time-container dyn-time-topbar">
      <div className="dyn-greeting" style={{ color: timeStyle.color }}>
        <span className="dyn-icon">{weather.icon}</span>
        <div className="greeting-content">
          <span className="dyn-text">{timeStyle.greeting}</span>
          <div
            className="dyn-clock"
            onMouseEnter={() => setShowAnalog(true)}
            onMouseLeave={() => setShowAnalog(false)}
          >
            <span
              className="clock-time"
              title="Đồng hồ analog"
              suppressHydrationWarning
            >
              {time.toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </span>
            <span className="clock-date" suppressHydrationWarning>
              {time.toLocaleDateString("vi-VN", { weekday: "short" })},{" "}
              {time.toLocaleDateString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>
      <div className="dyn-weather-box">
        <div className="weather-main">
          <span className="weather-icon-sm">{weather.icon}</span>
          <span className="weather-condition">{weather.condition}</span>
        </div>
        <div className="weather-row">
          <span className="weather-temp">{weather.temp}°C</span>
          <span className="weather-humidity">💧 {weather.humidity}%</span>
        </div>
      </div>
      {showAnalog && (
        <div
          className="analog-overlay"
          onMouseEnter={() => setShowAnalog(true)}
          onMouseLeave={() => setShowAnalog(false)}
        >
          <div className="analog-clock">
            <div className="analog-face">
              <div className="analog-num analog-num12">12</div>
              <div className="analog-num analog-num3">3</div>
              <div className="analog-num analog-num6">6</div>
              <div className="analog-num analog-num9">9</div>
              <div
                className="analog-hand analog-hour"
                style={{
                  transform: `rotate(${(time.getHours() % 12) * 30 + time.getMinutes() * 0.5}deg)`,
                }}
              ></div>
              <div
                className="analog-hand analog-min"
                style={{ transform: `rotate(${time.getMinutes() * 6}deg)` }}
              ></div>
              <div
                className="analog-hand analog-sec"
                style={{ transform: `rotate(${time.getSeconds() * 6}deg)` }}
              ></div>
              <div className="analog-center"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const flattenNavItems = (items) =>
  items.flatMap((item) =>
    item.children
      ? item.children.map((child) => ({
          key: child.key,
          icon: child.icon || item.icon || "•",
          label: child.label,
          href: child.href,
        }))
      : [
          {
            key: item.key,
            icon: item.icon || "•",
            label: item.label,
            href: item.href,
          },
        ],
  );

const ORDER_SEARCH_REGIONS = [
  { key: "kr", label: "Hàn Quốc", apiPrefix: "/api/orders" },
  { key: "jp", label: "Malaysia", apiPrefix: "/api/jp/orders" },
  { key: "tw", label: "Đài Loan", apiPrefix: "/api/tw/orders" },
];

const getOrderProductsLabel = (products) => {
  if (!Array.isArray(products) || products.length === 0)
    return "Chưa có sản phẩm";
  return products
    .map((item) => {
      const name = item?.product || item?.name || "Sản phẩm";
      const quantity = Number(item?.quantity) || 0;
      return quantity ? `${name} × ${quantity}` : name;
    })
    .join(", ");
};

const SidebarMenu = ({ isOpen, onToggle }) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const currentUser = useSelector((state) => state.user.currentUser);

  const [showXinPopup, setShowXinPopup] = useState(false);
  const [showCheckPopup, setShowCheckPopup] = useState(false);
  const [checkQuery, setCheckQuery] = useState("");
  const [checkResults, setCheckResults] = useState([]);
  const [checkLoading, setCheckLoading] = useState(false);
  const [checkSearched, setCheckSearched] = useState(false);
  const [checkError, setCheckError] = useState("");
  const [customerHistoryOrders, setCustomerHistoryOrders] = useState([]);
  const [customerHistoryVisible, setCustomerHistoryVisible] = useState(false);
  const [showDonePanel, setShowDonePanel] = useState(false);
  const [doneQuery, setDoneQuery] = useState("");
  const [doneResults, setDoneResults] = useState([]);
  const [doneLoading, setDoneLoading] = useState(false);
  const [doneSearched, setDoneSearched] = useState(false);
  const [doneError, setDoneError] = useState("");
  const [doneDatePreset, setDoneDatePreset] = useState("all");
  const [doneDateFrom, setDoneDateFrom] = useState("");
  const [doneDateTo, setDoneDateTo] = useState("");
  const [doneMktFilter, setDoneMktFilter] = useState("all");
  const [showDoneFilters, setShowDoneFilters] = useState(false);
  const [doneSearchOrders, setDoneSearchOrders] = useState([]);
  const [selectedDoneOrder, setSelectedDoneOrder] = useState(null);
  const [doneForm, setDoneForm] = useState({
    trackingCode: "",
    shippingDate1: "",
    deliveryStatus: "",
    noteKHO: "",
  });
  const [doneSubmitting, setDoneSubmitting] = useState(false);
  const [doneSuccess, setDoneSuccess] = useState("");
  const [xinDate, setXinDate] = useState("");
  const [xinAmount, setXinAmount] = useState("");
  const [xinType, setXinType] = useState("sang");
  const [xinHint, setXinHint] = useState("");
  const [xinResult, setXinResult] = useState("");
  const [xinSubmitting, setXinSubmitting] = useState(false);
  const [xinWarning, setXinWarning] = useState("");

  // Lấy giờ hiện tại UTC+7
  const getUtc7Hour = () => {
    const now = new Date();
    const utc7HourStr = now.toLocaleString("en-US", {
      timeZone: "Asia/Ho_Chi_Minh",
      hour: "numeric",
      hour12: false,
    });
    return parseInt(utc7HourStr, 10);
  };

  // Kiểm tra loại có được phép chọn không
  const isTypeAvailable = (type) => {
    const hour = getUtc7Hour();
    if (type === "sang") return hour < 12;
    if (type === "chieu") return hour >= 12 && hour < 17;
    if (type === "gap") return hour >= 17;
    return false;
  };

  const handleXinTypeChange = (type) => {
    if (isTypeAvailable(type)) {
      setXinType(type);
      setXinWarning("");
    } else {
      const typeNames = { sang: "sáng", chieu: "trưa", gap: "gấp" };
      if (type === "sang" || type === "chieu") {
        setXinWarning(`⏰ Đã quá giờ xin ADS cho ${typeNames[type]}.`);
      } else {
        setXinWarning(`⏰ Chưa đến giờ xin ADS cho ${typeNames[type]}.`);
      }
    }
  };

  useEffect(() => {
    if (showXinPopup) {
      const hour = getUtc7Hour();
      let autoType = "sang";
      if (hour >= 12 && hour < 17) autoType = "chieu";
      else if (hour >= 17) autoType = "gap";
      setXinType(autoType);
      setXinWarning("");
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const dd = String(now.getDate()).padStart(2, "0");
      setXinDate(`${yyyy}-${mm}-${dd}`);
      updateXinHint(`${yyyy}-${mm}-${dd}`);
    }
  }, [showXinPopup]);

  const updateXinHint = (dateStr) => {
    if (!dateStr) {
      setXinHint("");
      return;
    }
    const d = new Date(dateStr);
    const day = d.getDay();
    const dayNames = [
      "Chủ nhật",
      "Thứ 2",
      "Thứ 3",
      "Thứ 4",
      "Thứ 5",
      "Thứ 6",
      "Thứ 7",
    ];
    setXinHint(dayNames[day]);
  };

  const handleXinSubmit = async () => {
    if (!xinAmount) {
      setXinResult("Vui lòng nhập số tiền");
      return;
    }
    if (xinSubmitting) return;
    setXinSubmitting(true);
    setXinResult("⏳ Đang xử lý...");
    try {
      const apiUrl = isJP
        ? "/api/jp/xin-ads"
        : isTW
          ? "/api/tw/xin-ads"
          : "/api/xin-ads";
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: xinDate,
          amount: xinAmount,
          type: xinType,
          user: currentUser?.name || "",
          userId: currentUser?.employee_code || 0,
          teamnv: currentUser?.team_id || "",
          stk: currentUser?.stk || "",
          nh: currentUser?.nh || "",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setXinResult("✓ Đã Xin Ads thành công!");
        setXinAmount("");
        localStorage.setItem("xinAdsSuccess", Date.now());
      } else {
        setXinResult("✗ " + (data.message || "Có lỗi xảy ra"));
      }
    } catch {
      setXinResult("✗ Lỗi kết nối");
    } finally {
      setXinSubmitting(false);
    }
  };

  const closeXinPopup = () => {
    setShowXinPopup(false);
    setXinResult("");
  };

  const isToMyHanh = currentUser?.name === "Tô Mỹ Hạnh";
  const isLeTuyetKha = currentUser?.name === "Lê Tuyết Kha";
  const isNguyenThiHuyen = currentUser?.name === "Nguyễn Thị Huyền";
  const isAdmin =
    currentUser?.position === "admin" || currentUser?.name === "Trần Mỹ Hạnh";
  const khohq1 = currentUser?.position === "kho2";
  const isJP = currentUser?.quocgia === "jp";
  const isTW = currentUser?.quocgia === "tw";
  const isKRTW = currentUser?.name === "Trần Ngọc Diện";
  const isEmployee = !isAdmin && !isJP && !isTW && !isKRTW && !khohq1;

  // Map position (MongoDB) -> tên hiển thị đồng bộ với bảng "📋 Báo cáo marketing"
  const getRoleLabel = (position) => {
    switch ((position || "").toLowerCase()) {
      case "lead":
        return "Leader MKT";
      case "leadsale":
        return "Leader SALE";
      case "managermkt":
        return "Manager MKT";
      case "managersale":
        return "Manager SALE";
      case "admin":
        return "Admin";
      case "kho2":
        return "Kho";
      case "khomalay2":
        return "Kho Malaysia";
      case "salenhapdon":
        return "Sale Nhập đơn";
      case "salefull":
        return "Sale Online";
      case "salexuly":
        return "Sale Xử Lý";
      default:
        return position || "Nhân viên";
    }
  };
  const roleLabel = getRoleLabel(currentUser?.position);

  const countryIcon = (src, alt) => (
    <img src={src} alt={alt} className="country-icon" />
  );

  const overviewItems = {
    all: {
      key: "sub000",
      icon: "📊",
      label: "Tổng Quan",
      href: "/overviewall",
    },
    sale: {
      key: "sub000a",
      icon: "📈",
      label: "Báo cáo team sale",
      href: "/overviewsale",
    },
    kr: {
      key: "sub0",
      icon: "📊",
      label: "Tổng Quan Hàn",
      href: "/",
    },
    jp: {
      key: "sub01",
      icon: "📊",
      label: "Tổng Quan Malaysia",
      href: "/overviewjp",
    },
    tw: {
      key: "sub02",
      icon: "📊",
      label: "Tổng Quan Đài",
      href: "/overviewtw",
    },
  };

  const orderItems = {
    kr: {
      key: "sub11",
      icon: "🛒",
      label: "Quản lý đơn hàng Hàn",
      href: "/orders",
    },
    jp: {
      key: "sub12",
      icon: "🛒",
      label: "Quản lý đơn hàng Malaysia",
      href: "/ordersjp",
    },
    tw: {
      key: "sub13",
      icon: "🛒",
      label: "Quản lý đơn hàng Đài",
      href: "/orderstw",
    },
  };

  const mktChildren = {
    kr: {
      key: "sub2",
      icon: "💰",
      label: "Báo cáo MKT Hàn",
      href: "/mkt",
    },
    jp: {
      key: "sub21",
      icon: "💰",
      label: "Báo cáo MKT Malaysia",
      href: "/mktjp",
    },
    tw: {
      key: "sub22",
      icon: "💰",
      label: "Báo cáo MKT Đài",
      href: "/mkttw",
    },
  };

  const productChildren = {
    kr: {
      key: "sub4",
      icon: "📦",
      label: <span>Tất cả sản phẩm {countryIcon("/kr.png", "KR")}</span>,
      href: "/products",
    },
    jp: {
      key: "sub41",
      icon: "📦",
      label: <span>Tất cả sản phẩm {countryIcon("/malay.svg", "JP")}</span>,
      href: "/productsjp",
    },
    tw: {
      key: "sub42",
      icon: "📦",
      label: <span>Tất cả sản phẩm {countryIcon("/tw.png", "TW")}</span>,
      href: "/productstw",
    },
  };

  const normalizedPosition = (currentUser?.position || "").toLowerCase();
  const normalizedCountry = (currentUser?.quocgia || "kr").toLowerCase();
  const userCountryKey =
    normalizedCountry === "tw"
      ? "tw"
      : normalizedCountry === "jp"
        ? "jp"
        : "kr";
  const isLeadMkt = normalizedPosition === "lead";
  const isMkt = normalizedPosition === "mkt";
  const isMarketing = isLeadMkt || isMkt;
  const isLeadSale = normalizedPosition === "leadsale";
  const isManagerSale = normalizedPosition === "managersale";
  const isSale = ["salenhapdon", "salexuly", "salefull"].includes(
    normalizedPosition,
  );
  const isSales = isLeadSale || isManagerSale || isSale;

  const searchOrders = async (query) => {
    const encodedQuery = encodeURIComponent(query.trim());
    const responses = await Promise.allSettled(
      ORDER_SEARCH_REGIONS.map(async (region) => {
        const response = await axios.get(
          `${region.apiPrefix}/search-by-customer?name=${encodedQuery}`,
        );
        return (response.data?.data || []).map((order) => ({
          ...order,
          _regionKey: region.key,
          _regionLabel: region.label,
          _apiPrefix: region.apiPrefix,
        }));
      }),
    );

    const fulfilled = responses.filter(
      (response) => response.status === "fulfilled",
    );
    if (fulfilled.length === 0)
      throw new Error("Không thể tải dữ liệu đơn hàng");

    return fulfilled
      .flatMap((response) => response.value)
      .sort(
        (a, b) =>
          new Date(b.createdAt || b.orderDate4 || 0) -
          new Date(a.createdAt || a.orderDate4 || 0),
      );
  };

  const handleCheckSearch = async () => {
    const query = checkQuery.trim();
    if (!query || checkLoading) return;

    setCheckLoading(true);
    setCheckError("");
    setCheckSearched(false);
    try {
      const orders = await searchOrders(query);
      setCheckResults(orders);
      setCustomerHistoryOrders(orders);
      setCustomerHistoryVisible(true);
      setCheckSearched(true);
    } catch (error) {
      console.error("Lỗi check khách nhanh", error);
      setCheckResults([]);
      setCheckError("Không thể tải lịch sử khách hàng. Vui lòng thử lại.");
    } finally {
      setCheckLoading(false);
    }
  };

  const closeCustomerHistoryModal = () => {
    setCustomerHistoryVisible(false);
    setCheckQuery("");
    setCheckResults([]);
    setCheckSearched(false);
    setCheckError("");
  };

  const closeCheckPopup = () => {
    setShowCheckPopup(false);
    setCheckError("");
  };

  const getDoneDateRange = () => {
    if (doneDatePreset === "all") return { from: "", to: "" };
    if (doneDatePreset === "custom")
      return { from: doneDateFrom, to: doneDateTo };

    const today = new Date();
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };
    const toDate = new Date(today);
    const fromDate = new Date(today);
    if (doneDatePreset === "yesterday") {
      fromDate.setDate(fromDate.getDate() - 1);
      toDate.setDate(toDate.getDate() - 1);
    } else if (doneDatePreset === "week") {
      fromDate.setDate(fromDate.getDate() - 6);
    } else if (doneDatePreset === "month") {
      fromDate.setDate(1);
    }
    return { from: formatDate(fromDate), to: formatDate(toDate) };
  };

  const getFilteredDoneOrders = () => {
    const { from, to } = getDoneDateRange();
    return doneSearchOrders.filter((order) => {
      const orderDate = String(order.orderDate || "").slice(0, 10);
      const mkt = String(order.mkt || "").trim();
      const dateMatch =
        (!from || orderDate >= from) && (!to || orderDate <= to);
      const mktMatch = doneMktFilter === "all" || mkt === doneMktFilter;
      return dateMatch && mktMatch;
    });
  };

  const getDoneMktOptions = () =>
    Array.from(
      new Set(
        doneSearchOrders
          .map((order) => String(order.mkt || "").trim())
          .filter(Boolean),
      ),
    ).sort((a, b) => a.localeCompare(b, "vi"));

  const handleDoneSearch = async () => {
    const query = doneQuery.trim();
    if (!query || doneLoading) return;

    setDoneLoading(true);
    setDoneError("");
    setDoneSuccess("");
    setDoneSearched(false);
    setSelectedDoneOrder(null);
    try {
      const orders = await searchOrders(query);
      const nonDoneOrders = orders.filter(
        (order) => order.saleReport !== "DONE",
      );
      setDoneSearchOrders(nonDoneOrders);
      setDoneResults(nonDoneOrders);
      setDoneSearched(true);
    } catch (error) {
      console.error("Lỗi tìm đơn để Done", error);
      setDoneResults([]);
      setDoneError("Không thể tìm đơn hàng. Vui lòng thử lại.");
    } finally {
      setDoneLoading(false);
    }
  };

  useEffect(() => {
    if (doneSearched) {
      setDoneResults(getFilteredDoneOrders());
    }
  }, [
    doneDatePreset,
    doneDateFrom,
    doneDateTo,
    doneMktFilter,
    doneSearchOrders,
    doneSearched,
  ]);

  const selectDoneOrder = (order) => {
    setSelectedDoneOrder(order);
    setDoneForm({
      trackingCode: order.trackingCode || "",
      shippingDate1: order.shippingDate1
        ? String(order.shippingDate1).slice(0, 10)
        : "",
      deliveryStatus: order.deliveryStatus || "",
      noteKHO: order.noteKHO || "",
    });
    setDoneResults([]);
    setDoneError("");
    setDoneSuccess("");
  };

  const closeDoneQuickPanel = () => {
    setShowDonePanel(false);
    setDoneQuery("");
    setDoneResults([]);
    setDoneSearchOrders([]);
    setDoneSearched(false);
    setDoneDatePreset("all");
    setDoneDateFrom("");
    setDoneDateTo("");
    setDoneMktFilter("all");
    setShowDoneFilters(false);
    setSelectedDoneOrder(null);
    setDoneError("");
    setDoneSuccess("");
  };

  const handleDoneSubmit = async () => {
    if (!selectedDoneOrder || doneSubmitting) return;

    setDoneSubmitting(true);
    setDoneError("");
    setDoneSuccess("");
    try {
      const response = await axios.post(
        `${selectedDoneOrder._apiPrefix}/quick-done`,
        {
          orderId: selectedDoneOrder.id,
          trackingCode: doneForm.trackingCode,
          shippingDate1: doneForm.shippingDate1,
          deliveryStatus: doneForm.deliveryStatus,
          noteKHO: doneForm.noteKHO,
          updatedBy: currentUser?.name || "Unknown",
          position: currentUser?.position || "",
        },
      );
      setDoneSuccess(response.data?.message || "Đã Done đơn thành công!");
      setSelectedDoneOrder((order) => ({ ...order, saleReport: "DONE" }));
    } catch (error) {
      console.error("Lỗi Done đơn nhanh", error);
      setDoneError(
        error.response?.data?.error || "Không thể Done đơn. Vui lòng thử lại.",
      );
    } finally {
      setDoneSubmitting(false);
    }
  };

  const getOverviewMenu = () => {
    if (isMarketing) return [overviewItems[userCountryKey]];
    if (isLeadSale) {
      // Leader SALE: xem Tổng Quan Hàn
      return [overviewItems.kr];
    }
    if (isManagerSale) {
      // Manager Sale: xem Tổng Quan Hàn + Malaysia, mặc định vào Hàn
      return [overviewItems.kr, overviewItems.jp];
    }
    if (isSales) {
      return [];
    }
    if (isAdmin)
      return [
        overviewItems.all,
        overviewItems.kr,
        overviewItems.jp,
        overviewItems.tw,
      ];
    if (isKRTW) return [overviewItems.kr];
    if (isJP) return [overviewItems.jp, overviewItems.tw];
    if (isTW) return [overviewItems.tw];
    return [overviewItems.kr];
  };

  const getOrderMenu = () => {
    if (isManagerSale) {
      // Manager Sale: xem đơn Hàn + Malaysia
      return [orderItems.kr, orderItems.jp];
    }
    if (isSales) {
      const list = [];
      if (isJP) list.push(orderItems.jp);
      else list.push(orderItems.kr);
      if (isTW || isJP) list.push(orderItems.tw);
      if (!isJP && !isTW) list.push(orderItems.kr);
      return Array.from(new Set(list));
    }
    if (isMarketing) return [orderItems[userCountryKey]];
    if (isAdmin) return [orderItems.kr, orderItems.jp, orderItems.tw];
    if (isKRTW) return [orderItems.kr];
    if (isJP) return [orderItems.jp, orderItems.tw];
    if (isTW) return [orderItems.tw];
    return [orderItems.kr];
  };

  const getMktMenu = () => {
    if (isManagerSale) {
      // Manager Sale: xem Báo cáo MKT Malaysia
      return [mktChildren.jp];
    }
    if (isSales) return [];
    if (isMarketing) return [mktChildren[userCountryKey]];
    if (khohq1) return [];
    if (isAdmin) return [mktChildren.kr, mktChildren.jp, mktChildren.tw];
    if (isKRTW) return [mktChildren.kr];
    if (isJP) return [mktChildren.jp, mktChildren.tw];
    if (isTW) return [mktChildren.tw];
    return [
      {
        key: "sub2",
        icon: "💰",
        label: "Báo cáo MKT Hàn",
        href: "/mkt",
      },
    ];
  };

  const getProductMenu = () => {
    if (isSale) return [];
    if (isSales)
      return [productChildren.kr, productChildren.jp, productChildren.tw];
    if (isMarketing) return [productChildren[userCountryKey]];
    if (isAdmin)
      return [productChildren.kr, productChildren.jp, productChildren.tw];
    if (isKRTW) return [productChildren.kr];
    if (isJP) return [productChildren.jp, productChildren.tw];
    if (isTW) return [productChildren.tw];
    return [
      {
        key: "sub4",
        icon: "📦",
        label: "Tất cả sản Phẩm",
        href: "/products",
      },
    ];
  };

  const navItems = flattenNavItems([
    ...getOverviewMenu(),
    ...getOrderMenu(),
    ...getMktMenu(),
    ...(isMarketing || isKRTW
      ? []
      : [
          {
            key: "sub3",
            icon: "💵",
            label: "Báo cáo Sale",
            children: [
              ...(currentUser?.position !== "salexuly"
                ? [
                    {
                      key: "99",
                      icon: "💬",
                      label: "Sale CHAT",
                      href: "/sale/saleOrder",
                    },
                  ]
                : []),
              ...(currentUser?.position !== "salenhapdon"
                ? [
                    {
                      key: "799",
                      icon: "🚚",
                      label: "Sale VẬN ĐƠN",
                      href: "/sale/saleProcessing",
                    },
                  ]
                : []),
            ],
          },
        ]),
    ...getProductMenu(),
    ...(isSale
      ? []
      : [{ key: "sub7", icon: "📄", label: "Tên page", href: "/pagesName" }]),
    { key: "sub5", icon: "👤", label: "Quản lý tài khoản", href: "/accounts" },
    ...(isAdmin || isToMyHanh || isLeTuyetKha || isNguyenThiHuyen
      ? [
          {
            key: "sub8",
            icon: "📅",
            label: "Chấm công SALE",
            href: "/attendance",
          },
        ]
      : []),
    ...(isMarketing || isSales
      ? []
      : isEmployee
        ? [
            {
              key: "sub6",
              icon: "🕐",
              label: "Lịch sử chỉnh sửa đơn hàng",
              href: "/OrderHistory",
            },
          ]
        : []),
    ...(isMarketing || isSale
      ? []
      : [
          {
            key: "sub9",
            icon: "🔔",
            label: "Quản lý thông báo",
            href: "/NotificationManagement",
          },
        ]),
  ]);

  const handleLogout = () => {
    dispatch(
      setCurrentUser({
        username: "",
        employee_code: 0,
        name: "",
        position: "",
        team_id: "",
        quocgia: "kr",
        khuvuc: "",
        position_team: "",
      }),
    );
    router.push("/login");
  };

  // Listen for toggle event from PraiseBanner or other components
  useEffect(() => {
    const handleToggle = () => onToggle && onToggle(!isOpen);
    window.addEventListener("toggle-sidebar", handleToggle);
    return () => window.removeEventListener("toggle-sidebar", handleToggle);
  }, [isOpen, onToggle]);

  const isNavActive = (href) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <>
      {/* Mobile overlay */}
      <div
        id="sidebar-overlay"
        className={isOpen ? "show" : ""}
        onClick={() => onToggle && onToggle(false)}
      />

      {/* Mobile bottom nav */}
      <nav id="mobile-nav">
        {(isSales
          ? [
              {
                key: "m1",
                icon: "🛒",
                label: "Đơn hàng",
                href: getOrderMenu()[0]?.href || "/orders",
              },
              {
                key: "m2",
                icon: "🔍",
                label: "Check",
                onClick: () => setShowCheckPopup(true),
              },
              {
                key: "m3",
                icon: "✅",
                label: "Done",
                onClick: () => setShowDonePanel(true),
              },
              {
                key: "m4",
                icon: "📊",
                label: "Báo cáo",
                href: getOverviewMenu()[0]?.href || "/",
              },
              {
                key: "m5",
                icon: "☰",
                label: "Menu",
                onClick: () => onToggle && onToggle(!isOpen),
              },
            ]
          : [
              {
                key: "m1",
                icon: "📊",
                label: "Báo cáo",
                href: getOverviewMenu()[0]?.href || "/",
              },
              {
                key: "m2",
                icon: "🛒",
                label: "Đơn hàng",
                href: getOrderMenu()[0]?.href || "/orders",
              },
              {
                key: "m3",
                icon: "💰",
                label: "Xin Ads",
                onClick: () => setShowXinPopup(true),
              },
              {
                key: "m4",
                icon: "📦",
                label: "Sản phẩm",
                href: getProductMenu()[0]?.href || "/products",
              },
              {
                key: "m5",
                icon: "☰",
                label: "Menu",
                onClick: () => onToggle && onToggle(!isOpen),
              },
            ]
        ).map((item) =>
          item.onClick ? (
            <button key={item.key} className="mnav-item" onClick={item.onClick}>
              <span className="mni">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ) : (
            <Link
              key={item.key}
              href={item.href}
              className={`mnav-item${isNavActive(item.href) ? " active" : ""}`}
            >
              <span className="mni">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ),
        )}
      </nav>

      <aside
        id="sidebar"
        className={`sidebar-embed${!isOpen ? " collapsed" : ""}`}
      >
        <div className="sb-logo">
          <div className="sb-gem">
            <img
              src="/favicon.ico"
              alt="LMC Groups"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
          <div>
            <div className="sb-lt">LMC Groups</div>
            <div className="sb-ls" style={{ textTransform: "capitalize" }}>
              {roleLabel + " Portal"}
            </div>
          </div>
          {/* Mobile close button */}
          <button
            onClick={() => onToggle && onToggle(false)}
            style={{
              marginLeft: "auto",
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.6)",
              fontSize: "18px",
              cursor: "pointer",
              display: "none",
            }}
            className="mobile-close-btn"
          >
            ✕
          </button>
        </div>

        <div className="sb-user">
          <div className="sb-av">{getInitials(currentUser?.name)}</div>
          <div className="sb-user-info">
            <div className="sb-un">{currentUser?.name || "—"}</div>
            <div className="sb-ur" style={{ textTransform: "capitalize" }}>
              ⭐ {roleLabel}
            </div>
          </div>
        </div>

        {/* Dynamic Time Section */}
        <div className="sb-dyntime">
          <DynamicTime />
        </div>

        <nav id="sb-nav">
          {navItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={`sb-item${isNavActive(item.href) ? " active" : ""}`}
            >
              <span className="fi">{item.icon}</span>
              <span className="lbl">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="quick-panel">
          <div className="qp-title">⚡ Thao tác nhanh</div>
          {isSales ? (
            <>
              <button
                type="button"
                className="qp-btn"
                onClick={() => setShowCheckPopup(true)}
              >
                🔍 Check khách
              </button>
              <button
                type="button"
                className="qp-btn"
                onClick={() => setShowDonePanel(true)}
              >
                ✅ Done đơn nhanh
              </button>
              <button
                type="button"
                className="qp-btn"
                onClick={() => router.push("/LastDeleteOrder")}
              >
                🗑 Đơn xóa DONE
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="qp-btn"
                onClick={() => setShowXinPopup(true)}
              >
                💰 Xin Ads nhanh
              </button>
              <button
                type="button"
                className="qp-btn"
                onClick={() => router.push("/LockProduct")}
              >
                🔒 SP bị khóa
              </button>
              <button
                type="button"
                className="qp-btn"
                onClick={() => router.push("/Best-sellingProducts")}
              >
                🔥 SP bán chạy
              </button>
              <button
                type="button"
                className="qp-btn"
                onClick={() => router.push("/LastDeleteOrder")}
              >
                🗑 Đơn xóa DONE
              </button>
            </>
          )}
        </div>

        <div className="sb-bot">
          <button type="button" className="sb-out" onClick={handleLogout}>
            <LogoutOutlined /> &nbsp;Đăng Xuất
          </button>
        </div>

        {/* Mobile quick panel - fixed bottom bar above mobile nav */}
        <div id="mobile-quick-panel">
          {isSales ? (
            <>
              <button
                type="button"
                className="mq-btn"
                onClick={() => setShowCheckPopup(true)}
              >
                🔍 Check khách
              </button>
              <button
                type="button"
                className="mq-btn"
                onClick={() => setShowDonePanel(true)}
              >
                ✅ Done đơn nhanh
              </button>
              <button
                type="button"
                className="mq-btn"
                onClick={() => router.push("/LastDeleteOrder")}
              >
                🗑 Đơn xóa
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="mq-btn"
                onClick={() => setShowXinPopup(true)}
              >
                💰 Xin Ads nhanh
              </button>
              <button
                type="button"
                className="mq-btn"
                onClick={() => router.push("/LockProduct")}
              >
                🔒 SP bị khóa
              </button>
              <button
                type="button"
                className="mq-btn"
                onClick={() => router.push("/Best-sellingProducts")}
              >
                🔥 SP bán chạy
              </button>
              <button
                type="button"
                className="mq-btn"
                onClick={() => router.push("/LastDeleteOrder")}
              >
                🗑 Đơn xóa
              </button>
            </>
          )}
        </div>
      </aside>

      {isSales && showCheckPopup && (
        <div
          className="sale-quick-modal-overlay show"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeCheckPopup();
          }}
        >
          <section
            className="sale-quick-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="check-customer-title"
          >
            <div className="sale-quick-modal-title" id="check-customer-title">
              <span>🔍 Check khách</span>
              <button
                type="button"
                className="sale-quick-close"
                onClick={closeCheckPopup}
                aria-label="Đóng popup"
              >
                ×
              </button>
            </div>
            <div className="sale-quick-search-row">
              <input
                type="text"
                className="sale-quick-input"
                placeholder="Nhập tên khách, SĐT, link Facebook hoặc STT..."
                value={checkQuery}
                autoFocus
                onChange={(event) => setCheckQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleCheckSearch();
                }}
              />
              <button
                type="button"
                className="sale-quick-primary"
                onClick={handleCheckSearch}
                disabled={!checkQuery.trim() || checkLoading}
              >
                {checkLoading ? "Đang tìm..." : "Check"}
              </button>
            </div>
            <div className="sale-quick-helper">
              Tìm lịch sử khách trên dữ liệu Hàn Quốc, Malaysia và Đài Loan.
            </div>
            <div className="sale-check-results" aria-live="polite">
              {checkError && (
                <div className="sale-quick-alert error">{checkError}</div>
              )}
              {!checkError && checkSearched && checkResults.length === 0 && (
                <div className="sale-quick-alert success">
                  ✅ Không tìm thấy lịch sử — Khách mới, có thể chốt đơn!
                </div>
              )}
              {!checkError && checkSearched && checkResults.length > 0 && (
                <div className="sale-quick-alert success">
                  ✅ Tìm thấy {checkResults.length} đơn hàng — xem chi tiết
                  trong bảng!
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {customerHistoryVisible && (
        <CustomerHistoryModal
          visible={customerHistoryVisible}
          orders={customerHistoryOrders}
          onClose={closeCustomerHistoryModal}
          onEdit={null}
          onDelete={null}
          currentUser={currentUser}
        />
      )}

      {isSales && (
        <>
          <div
            className={`sale-done-backdrop${showDonePanel ? " show" : ""}`}
            onClick={closeDoneQuickPanel}
          />
          <section
            className={`sale-done-panel${showDonePanel ? " open" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="quick-done-title"
          >
            <div className="sale-done-head">
              <span className="sale-done-title" id="quick-done-title">
                ✅ Done đơn nhanh
              </span>
              <button
                type="button"
                className="sale-quick-close"
                onClick={closeDoneQuickPanel}
                aria-label="Đóng bảng Done đơn"
              >
                ×
              </button>
            </div>
            <div className="sale-done-body">
              <label className="sale-quick-label" htmlFor="done-order-search">
                Tìm đơn (STT hoặc tên khách)
              </label>
              <div className="sale-quick-search-row">
                <input
                  id="done-order-search"
                  type="text"
                  className="sale-quick-input"
                  placeholder="Nhập STT hoặc tên khách..."
                  value={doneQuery}
                  onChange={(event) => setDoneQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") handleDoneSearch();
                  }}
                />
                <button
                  type="button"
                  className="sale-quick-primary"
                  onClick={handleDoneSearch}
                  disabled={!doneQuery.trim() || doneLoading}
                >
                  {doneLoading ? "Tìm..." : "Tìm"}
                </button>
              </div>

              <div
                className={`sale-done-filters${showDoneFilters ? " expanded" : ""}`}
              >
                <button
                  type="button"
                  className="sale-done-filter-toggle"
                  onClick={() => setShowDoneFilters((open) => !open)}
                  aria-expanded={showDoneFilters}
                >
                  <span>
                    <span className="sale-done-filter-icon">⚙</span> Bộ lọc
                  </span>
                  <span className="sale-done-filter-summary">
                    {doneDatePreset === "all"
                      ? "Mọi ngày"
                      : doneDatePreset === "custom"
                        ? `${doneDateFrom || "..."} → ${doneDateTo || "..."}`
                        : {
                            today: "Hôm nay",
                            yesterday: "Hôm qua",
                            week: "7 ngày",
                            month: "1 tháng",
                          }[doneDatePreset]}
                    {doneMktFilter !== "all"
                      ? ` · ${doneMktFilter}`
                      : " · Tất cả MKT"}
                    <span className="sale-done-filter-chevron">⌄</span>
                  </span>
                </button>
                {showDoneFilters && (
                  <div className="sale-done-filter-content">
                    <div className="sale-date-tabs">
                      {[
                        { val: "all", label: "Tất cả" },
                        { val: "today", label: "Hôm nay" },
                        { val: "yesterday", label: "Hôm qua" },
                        { val: "week", label: "7 ngày" },
                        { val: "month", label: "1 tháng" },
                        { val: "custom", label: "Tùy chỉnh" },
                      ].map((option) => (
                        <button
                          key={option.val}
                          type="button"
                          className={`sale-date-tab${doneDatePreset === option.val ? " active" : ""}`}
                          onClick={() => setDoneDatePreset(option.val)}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                    {doneDatePreset === "custom" && (
                      <div className="sale-date-custom">
                        <div className="sale-date-custom-group">
                          <label htmlFor="done-date-from">Từ ngày</label>
                          <input
                            id="done-date-from"
                            type="date"
                            className="sale-quick-input"
                            value={doneDateFrom}
                            onChange={(event) =>
                              setDoneDateFrom(event.target.value)
                            }
                          />
                        </div>
                        <div className="sale-date-custom-group">
                          <label htmlFor="done-date-to">Đến ngày</label>
                          <input
                            id="done-date-to"
                            type="date"
                            className="sale-quick-input"
                            value={doneDateTo}
                            onChange={(event) =>
                              setDoneDateTo(event.target.value)
                            }
                          />
                        </div>
                      </div>
                    )}
                    <div className="sale-date-mkt">
                      <label htmlFor="done-mkt-filter">MKT phụ trách</label>
                      <select
                        id="done-mkt-filter"
                        className="sale-quick-input"
                        value={doneMktFilter}
                        onChange={(event) =>
                          setDoneMktFilter(event.target.value)
                        }
                      >
                        <option value="all">Tất cả MKT</option>
                        {getDoneMktOptions().map((mkt) => (
                          <option key={mkt} value={mkt}>
                            {mkt}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {doneError && (
                <div className="sale-quick-alert error">{doneError}</div>
              )}
              {doneSearched &&
                !doneLoading &&
                doneResults.length === 0 &&
                !selectedDoneOrder &&
                !doneError && (
                  <div className="sale-quick-empty">
                    Không tìm thấy đơn chưa Done phù hợp.
                  </div>
                )}
              {doneSearched && !doneLoading && doneResults.length > 0 && (
                <div className="sale-done-results-head">
                  <span>Đơn phù hợp</span>
                  <strong>{doneResults.length}</strong>
                </div>
              )}
              <div className="sale-done-order-list">
                {doneResults.map((order) => (
                  <button
                    type="button"
                    className="sale-done-order-option"
                    key={`${order._regionKey}-${order.id}-${order.stt}`}
                    onClick={() => selectDoneOrder(order)}
                  >
                    <div className="sale-done-option-head">
                      <strong>
                        #{order.stt || "—"} ·{" "}
                        {order.customerName || "Khách chưa có tên"}
                      </strong>
                      <span className="sale-quick-tag region">
                        {order._regionLabel}
                      </span>
                    </div>
                    <div className="sale-done-option-products">
                      {getOrderProductsLabel(order.products)}
                    </div>
                    <div className="sale-done-option-meta">
                      <span>{order.orderDate || "Chưa có ngày"}</span>
                      <span className="sale-done-option-mkt">
                        MKT: {order.mkt || "Chưa phân công"}
                      </span>
                      <strong>
                        {Number(order.revenue || 0).toLocaleString("vi-VN")}
                      </strong>
                    </div>
                  </button>
                ))}
              </div>

              {selectedDoneOrder && (
                <div className="sale-done-detail">
                  <div className="sale-done-order-title">
                    <span>
                      Đơn #{selectedDoneOrder.stt || "—"} —{" "}
                      {selectedDoneOrder.customerName || "Khách chưa có tên"}
                    </span>
                    <span className="sale-quick-tag region">
                      {selectedDoneOrder._regionLabel}
                    </span>
                  </div>
                  <div className="sale-done-summary">
                    <span>
                      {getOrderProductsLabel(selectedDoneOrder.products)}
                    </span>
                    <strong>
                      {Number(selectedDoneOrder.revenue || 0).toLocaleString(
                        "vi-VN",
                      )}
                    </strong>
                  </div>
                  <label
                    className="sale-quick-label"
                    htmlFor="quick-done-tracking"
                  >
                    Mã vận đơn
                  </label>
                  <input
                    id="quick-done-tracking"
                    type="text"
                    className="sale-quick-input"
                    placeholder="Nhập mã vận đơn..."
                    value={doneForm.trackingCode}
                    onChange={(event) =>
                      setDoneForm((form) => ({
                        ...form,
                        trackingCode: event.target.value,
                      }))
                    }
                    disabled={doneSuccess}
                  />
                  <label
                    className="sale-quick-label"
                    htmlFor="quick-done-shipping-date"
                  >
                    Ngày gửi
                  </label>
                  <input
                    id="quick-done-shipping-date"
                    type="date"
                    className="sale-quick-input"
                    value={doneForm.shippingDate1}
                    onChange={(event) =>
                      setDoneForm((form) => ({
                        ...form,
                        shippingDate1: event.target.value,
                      }))
                    }
                    disabled={doneSuccess}
                  />
                  <label
                    className="sale-quick-label"
                    htmlFor="quick-done-delivery-status"
                  >
                    Tình trạng giao hàng
                  </label>
                  <select
                    id="quick-done-delivery-status"
                    className="sale-quick-input"
                    value={doneForm.deliveryStatus}
                    onChange={(event) =>
                      setDoneForm((form) => ({
                        ...form,
                        deliveryStatus: event.target.value,
                      }))
                    }
                    disabled={doneSuccess}
                  >
                    <option value="">Chưa cập nhật</option>
                    <option value="ĐÃ GỬI HÀNG">Đã gửi hàng</option>
                    <option value="GIAO THÀNH CÔNG">Giao thành công</option>
                    <option value="BỊ BẮT CHỜ GỬI LẠI">
                      Bị bắt chờ gửi lại
                    </option>
                    <option value="CHECK ĐỊA CHỈ">Check địa chỉ</option>
                  </select>
                  <label className="sale-quick-label" htmlFor="quick-done-note">
                    Ghi chú kho
                  </label>
                  <textarea
                    id="quick-done-note"
                    className="sale-quick-input sale-quick-textarea"
                    rows={3}
                    placeholder="Ghi chú thêm..."
                    value={doneForm.noteKHO}
                    onChange={(event) =>
                      setDoneForm((form) => ({
                        ...form,
                        noteKHO: event.target.value,
                      }))
                    }
                    disabled={doneSuccess}
                  />
                </div>
              )}
              {doneSuccess && (
                <div className="sale-quick-alert success">✅ {doneSuccess}</div>
              )}
            </div>
            <div className="sale-done-footer">
              <button
                type="button"
                className="sale-quick-secondary"
                onClick={closeDoneQuickPanel}
              >
                Huỷ
              </button>
              <button
                type="button"
                className="sale-quick-confirm"
                onClick={handleDoneSubmit}
                disabled={
                  !selectedDoneOrder || doneSubmitting || Boolean(doneSuccess)
                }
              >
                {doneSubmitting
                  ? "Đang xử lý..."
                  : doneSuccess
                    ? "Đã Done"
                    : "✅ Xác nhận Done"}
              </button>
            </div>
          </section>
        </>
      )}

      {/* Xin Ads popup */}
      <div
        id="xin-overlay"
        className={showXinPopup ? "show" : ""}
        onClick={closeXinPopup}
      />
      <div id="xin-popup" className={showXinPopup ? "show" : ""}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "var(--gold-light)",
              letterSpacing: 1,
            }}
          >
            ⚡ Xin Ads nhanh
          </div>
          <button
            onClick={closeXinPopup}
            style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              border: "none",
              background: "rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.5)",
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            ×
          </button>
        </div>
        <div style={{ marginBottom: 10 }}>
          <div
            style={{
              fontSize: 10,
              color: "rgba(255,255,255,0.38)",
              letterSpacing: 1.5,
              textTransform: "uppercase",
              marginBottom: 5,
            }}
          >
            Ngày
          </div>
          <input
            id="xin-date"
            type="date"
            value={xinDate}
            onChange={(e) => {
              setXinDate(e.target.value);
              updateXinHint(e.target.value);
            }}
            style={{
              width: "100%",
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 9,
              padding: "10px 12px",
              fontSize: 14,
              color: "#fff",
              outline: "none",
              minHeight: 44,
            }}
          />
        </div>
        <div style={{ marginBottom: 10 }}>
          <div
            style={{
              fontSize: 10,
              color: "rgba(255,255,255,0.38)",
              letterSpacing: 1.5,
              textTransform: "uppercase",
              marginBottom: 5,
            }}
          >
            Số tiền xin
          </div>
          <input
            id="xin-amount"
            type="number"
            placeholder="1.500.000"
            step="500000"
            min="0"
            value={xinAmount}
            onChange={(e) => {
              const v = e.target.value;
              setXinAmount(v === "" ? "" : Number(v));
            }}
            onFocus={(e) => e.target.select()}
            style={{
              width: "100%",
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 9,
              padding: "10px 12px",
              fontSize: 16,
              color: "#fff",
              outline: "none",
              minHeight: 46,
              textAlign: "center",
            }}
          />
        </div>
        <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
          {[
            { val: "sang", icon: "☀️", label: "Sáng" },
            { val: "chieu", icon: "🌤️", label: "Chiều" },
            { val: "gap", icon: "🚨", label: "Gấp" },
          ].map((opt) => {
            const available = isTypeAvailable(opt.val);
            const isSelected = xinType === opt.val;
            return (
              <label
                key={opt.val}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 3,
                  cursor: available || isSelected ? "pointer" : "not-allowed",
                  padding: "9px 4px",
                  border: `1px solid ${isSelected ? "var(--gold)" : available ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)"}`,
                  borderRadius: 9,
                  color: isSelected
                    ? "var(--gold-light)"
                    : available
                      ? "rgba(255,255,255,0.55)"
                      : "rgba(255,255,255,0.2)",
                  fontSize: 12,
                  background: isSelected
                    ? "rgba(201,149,42,0.12)"
                    : "rgba(255,255,255,0.04)",
                  minHeight: 52,
                  justifyContent: "center",
                  opacity: available || isSelected ? 1 : 0.5,
                }}
              >
                <input
                  type="radio"
                  name="xin-type"
                  value={opt.val}
                  checked={isSelected}
                  onChange={() => handleXinTypeChange(opt.val)}
                  style={{ accentColor: "var(--gold)", width: 16, height: 16 }}
                />
                <span>
                  {opt.icon} {opt.label}
                </span>
              </label>
            );
          })}
        </div>
        {xinWarning && (
          <div
            style={{
              fontSize: 11,
              color: "#ff9f43",
              textAlign: "center",
              marginBottom: 8,
              padding: "6px 8px",
              background: "rgba(255,159,67,0.1)",
              borderRadius: 6,
              lineHeight: 1.4,
            }}
          >
            {xinWarning}
          </div>
        )}
        <button
          onClick={handleXinSubmit}
          disabled={xinSubmitting}
          style={{
            width: "100%",
            padding: 12,
            background: xinSubmitting ? "rgba(201,149,42,0.4)" : "var(--gold)",
            color: "#3a2000",
            border: "none",
            borderRadius: 9,
            fontSize: 15,
            fontWeight: 700,
            cursor: xinSubmitting ? "not-allowed" : "pointer",
            minHeight: 46,
          }}
        >
          {xinSubmitting ? "⏳ Đang xử lý..." : "💰 Xin ngay"}
        </button>
        <div
          style={{
            fontSize: 11,
            textAlign: "center",
            marginTop: 8,
            color: "rgba(255,255,255,0.5)",
          }}
        >
          → Sẽ cộng{" "}
          <span style={{ color: "var(--gold-light)", fontWeight: 600 }}>
            {xinAmount ? Number(xinAmount).toLocaleString("vi-VN") : "?"}đ
          </span>{" "}
          vào:{" "}
          <span style={{ color: "var(--gold-light)", fontWeight: 600 }}>
            {xinDate
              ? (() => {
                  const [y, m, d] = xinDate.split("-");
                  return `${d}/${m}/${y}`;
                })()
              : "?"}
          </span>{" "}
          ·{" "}
          {xinType === "sang"
            ? "☀️ Sáng"
            : xinType === "chieu"
              ? "🌤️ Chiều"
              : "🚨 Gấp"}
        </div>
        <div
          id="xin-hint"
          style={{
            fontSize: 10.5,
            textAlign: "center",
            marginTop: 6,
            color: "rgba(255,255,255,0.35)",
            fontStyle: "italic",
          }}
        >
          {xinHint}
        </div>
        <div
          id="xin-result"
          style={{
            fontSize: 12,
            textAlign: "center",
            marginTop: 6,
            minHeight: 20,
            color: "#4ade80",
            fontWeight: 600,
          }}
        >
          {xinResult}
        </div>
      </div>
    </>
  );
};

export { DynamicTime, DynamicTimeTopbar };
export default SidebarMenu;
