"use client";
import React, { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import {
  Select,
  Row,
  Col,
  Table,
  Tag,
  Card,
  Button,
  Input,
  Tabs,
  message,
} from "antd";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import {
  BarChart3,
  CalendarDays,
  Clock3,
  Headphones,
  PackageCheck,
  ShoppingBag,
  UsersRound,
} from "lucide-react";
import PraiseBanner from "../components/PraiseBanner";
// import PraiseBanner2 from "./components/PraiseBanner2";
import { useRouter } from "next/navigation";
const Dashboard = () => {
  const [employees, setEmployees] = useState([]);
  const [orders, setOrders] = useState([]);
  const [adsMoneyData, setAdsMoneyData] = useState([]); //mkt
  // Component biểu đồ Bar (Recharts) cho biểu đồ đơn (có 1 series)
  const router = useRouter();
  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedPreset, setSelectedPreset] = useState("currentMonth");
  const [selectedArea, setSelectedArea] = useState("all");
  const [selectedTeamTong, setSelectedTeamTong] = useState("all");
  // Ngày hiện tại định dạng YYYY-MM-DD
  const [ordersKR, setOrdersKR] = useState([]);
  const [ordersJP, setOrdersJP] = useState([]);
  const [ordersTW, setOrdersTW] = useState([]);

  const [adsKR, setAdsKR] = useState([]);
  const [adsJP, setAdsJP] = useState([]);
  const [adsTW, setAdsTW] = useState([]);
  // State cho bộ lọc: selectedDate mặc định là ngày hiện tại, và preset
  const [selectedMKT, setSelectedMKT] = useState(null);

  // State cho tỉ giá VNĐ và ô nhập giá trị
  const [exchangeRate, setExchangeRate] = useState(1);
  const [exchangeRateInput, setExchangeRateInput] = useState(1);
  const reduxCurrentUser = useSelector((state) => state.user.currentUser) || {};
  // Admin luôn mặc định chế độ "Tất cả" (selectedTeam = "")
  const isAdminUser = reduxCurrentUser.position === "admin";
  const [selectedTeam, setSelectedTeam] = useState(
    isAdminUser ? "" : reduxCurrentUser.team_id,
  );

  const currentUser = useMemo(() => {
    return {
      ...reduxCurrentUser,
      team_id: selectedTeam,
    };
  }, [reduxCurrentUser, selectedTeam]);
  useEffect(() => {
    if (!currentUser.name) {
      router.push("/login");
    }
  }, []);

  const convertOrdersWithRate = (orders, rate) => {
    return orders.map((o) => ({
      ...o,
      revenue: (o.revenue || 0) * rate,
      profit: (o.profit || 0) * rate,
      totalAmount: o.totalAmount ? o.totalAmount * rate : 0,
    }));
  };
  // Cache cho orders & ads để tránh re-fetch khi filter chưa đổi thật sự
  const lastOrdersKeyRef = React.useRef(null);
  const lastRecordsKeyRef = React.useRef(null);
  const ordersCacheRef = React.useRef(null);
  const recordsCacheRef = React.useRef(null);

  const fetchOrders = async () => {
    try {
      let path = "";
      if (selectedPreset && selectedPreset !== "all") {
        path = `?selectedPreset=${selectedPreset}`;
      } else if (selectedDate) {
        path = `?selectedDate=${selectedDate}`;
      }

      const cacheKey = path;
      if (lastOrdersKeyRef.current === cacheKey && ordersCacheRef.current) {
        const { KR_raw, JP_raw, TW_raw } = ordersCacheRef.current;
        setOrdersKR(KR_raw);
        setOrdersJP(JP_raw);
        setOrdersTW(TW_raw);
        const KR = convertOrdersWithRate(KR_raw, 17000);
        const JP = convertOrdersWithRate(JP_raw, 6000);
        const TW = convertOrdersWithRate(TW_raw, 750);
        setOrders([...KR, ...JP, ...TW]);
        return;
      }

      const [krRes, jpRes, twRes] = await Promise.all([
        axios.get(`/api/orders2${path}`),
        axios.get(`/api/jp/orders2${path}`),
        axios.get(`/api/tw/orders2${path}`),
      ]);

      const KR_raw = krRes.data.data;
      const JP_raw = jpRes.data.data;
      const TW_raw = twRes.data.data;

      lastOrdersKeyRef.current = cacheKey;
      ordersCacheRef.current = { KR_raw, JP_raw, TW_raw };

      setOrdersKR(KR_raw);
      setOrdersJP(JP_raw);
      setOrdersTW(TW_raw);

      const KR = convertOrdersWithRate(KR_raw, 17000);
      const JP = convertOrdersWithRate(JP_raw, 6000);
      const TW = convertOrdersWithRate(TW_raw, 750);
      setOrders([...KR, ...JP, ...TW]);
    } catch (error) {
      console.error(error);
      message.error("Lỗi khi lấy đơn hàng");
    }
  };
  //   const fetchOrders = async () => {
  //     try {
  //       let url = "/api/orders2";

  //       if (selectedPreset && selectedPreset !== "all") {
  //         url += `?selectedPreset=${selectedPreset}`;
  //       } else if (selectedDate) {
  //         url += `?selectedDate=${selectedDate}`;
  //       }

  //       const response = await axios.get(url);
  //       setOrders(response.data.data);
  //     } catch (error) {
  //       console.error(error);
  //       message.error("Lỗi khi lấy đơn hàng");
  //     }
  //   };
  const fetchRecords = async () => {
    try {
      const path =
        selectedPreset && selectedPreset !== "all"
          ? `?selectedPreset=${selectedPreset}`
          : selectedDate
            ? `?selectedDate=${selectedDate}`
            : "";

      const cacheKey = path;
      if (lastRecordsKeyRef.current === cacheKey && recordsCacheRef.current) {
        const { krData, jpData, twData } = recordsCacheRef.current;
        setAdsKR(krData);
        setAdsJP(jpData);
        setAdsTW(twData);
        setAdsMoneyData([...krData, ...jpData, ...twData]);
        return;
      }

      const [kr, jp, tw] = await Promise.all([
        axios.get(`/api/recordsMKT${path}`),
        axios.get(`/api/jp/recordsMKT${path}`),
        axios.get(`/api/tw/recordsMKT${path}`),
      ]);

      const krData = kr.data.data;
      const jpData = jp.data.data;
      const twData = tw.data.data;

      lastRecordsKeyRef.current = cacheKey;
      recordsCacheRef.current = { krData, jpData, twData };

      setAdsKR(krData);
      setAdsJP(jpData);
      setAdsTW(twData);
      setAdsMoneyData([...krData, ...jpData, ...twData]);
    } catch (error) {
      console.error(error);
      message.error("Lỗi khi lấy danh sách ADS");
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await axios.get("/api/employees");
      // response.data.data chứa danh sách nhân viên theo API đã viết
      setEmployees(response.data.data);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách nhân viên:", error);
      message.error("Lỗi khi lấy danh sách nhân viên");
    } finally {
    }
  };
  useEffect(() => {
    // Defer fetch để không block lần render đầu tiên
    const runIdle = (cb) => {
      if (typeof window !== "undefined" && window.requestIdleCallback) {
        window.requestIdleCallback(cb, { timeout: 800 });
      } else {
        setTimeout(cb, 0);
      }
    };

    runIdle(() => {
      fetchRecords();
      fetchEmployees();
    });

    const intervalId = setInterval(() => {
      fetchRecords();
      fetchEmployees();
    }, 300000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [selectedDate, selectedPreset]);

  // Nếu currentUser là team lead, chỉ hiển thị các nhân viên thuộc team của họ.
  // Ví dụ, currentUser có cấu trúc { name: 'Nguyễn Văn A', position: 'lead', team_id: 'SON' }
  const isTeamLead = currentUser.position === "lead";
  const filteredEmployees = isTeamLead
    ? employees.filter((emp) => emp.team_id === currentUser.team_id)
    : employees;

  const filteredEmployeesByArea = useMemo(() => {
    let result = employees;
    if (selectedArea === "da") {
      result = employees.filter((emp) => emp.khuvuc === "da");
    } else if (selectedArea === "pvd") {
      // Phạm Văn Đồng: gồm cả nhân viên không có trường khuvuc
      result = employees.filter(
        (emp) => emp.khuvuc === "pvd" && emp.position_team === "mkt",
      );
    }
    if (selectedTeamTong !== "all") {
      result = result.filter((emp) => (emp.team_tp || "") === selectedTeamTong);
    }
    return result;
  }, [employees, selectedArea, selectedTeamTong]);

  const calcRevenue = (orders, rate) => {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    const todayRevenue =
      orders
        .filter((o) => o.orderDate === todayStr)
        .reduce((a, b) => a + b.profit, 0) * rate;

    const yesterdayRevenue =
      orders
        .filter((o) => o.orderDate === yesterdayStr)
        .reduce((a, b) => a + b.profit, 0) * rate;

    const percent =
      yesterdayRevenue > 0
        ? ((todayRevenue / yesterdayRevenue) * 100).toFixed(2)
        : 0;

    return { todayRevenue, yesterdayRevenue, percent };
  };

  const kr = calcRevenue(ordersKR, 17000);
  const jp = calcRevenue(ordersJP, 6000);
  const tw = calcRevenue(ordersTW, 750);

  const BarChartComponent = dynamic(
    () =>
      Promise.resolve(({ data }) => {
        const {
          BarChart,
          Bar,
          XAxis,
          YAxis,
          LabelList,
          CartesianGrid,
          Tooltip,
          Legend,
        } = require("recharts");
        return (
          <BarChart width={800} height={400} data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              tickFormatter={(fullName) => formatEmployeeName(fullName)}
            />
            <YAxis tickFormatter={formatYAxisTick} tickCount={6} />
            <Tooltip formatter={(value) => value.toLocaleString("vi-VN")} />

            <Legend />
            <Bar dataKey="profit" fill="#8884d8">
              <LabelList
                dataKey="profit"
                formatter={formatYAxisTick}
                position="top"
              />
            </Bar>
          </BarChart>
        );
      }),
    { ssr: false, loading: () => <p>Đang tải biểu đồ...</p> },
  );

  // Component biểu đồ Pie (Recharts)
  const PieChartComponent = dynamic(
    () =>
      Promise.resolve(({ data, variant = "default" }) => {
        const {
          PieChart,
          Pie,
          Cell,
          Tooltip,
          Legend,
          ResponsiveContainer,
        } = require("recharts");
        const isSaleShift = variant === "saleShift";
        const defaultColors = [
          "#AA336A",
          "#FFBB28",
          "#00C49F",
          "#FF8042",
          "#0088FA",
          "#5A2D82",
          "#144523",
          "#c51e1e",
          "#43e474",
          "#20aeeb",
        ];
        const colors = isSaleShift
          ? ["#38bdf8", "#10b981", "#8b5cf6"]
          : defaultColors;
        const total = data.reduce(
          (sum, item) => sum + (Number(item.profit) || 0),
          0,
        );

        if (isSaleShift && total === 0) {
          return (
            <div className="sale-chart-empty">
              <span>Chưa có dữ liệu doanh số theo ca</span>
            </div>
          );
        }

        return (
          <ResponsiveContainer width="100%" height={isSaleShift ? 340 : 520}>
            <PieChart>
              <Pie
                data={data}
                dataKey="profit"
                nameKey="name"
                cx="50%"
                cy={isSaleShift ? "43%" : "45%"}
                outerRadius={isSaleShift ? 116 : 160}
                innerRadius={isSaleShift ? 72 : 70}
                cornerRadius={isSaleShift ? 7 : 0}
                paddingAngle={isSaleShift ? 4 : 2}
                label={
                  isSaleShift
                    ? ({ percent }) => `${(Number(percent) * 100).toFixed(1)}%`
                    : ({ name, percent }) =>
                        `${name}: ${(Number(percent) * 100).toFixed(1)}%`
                }
                labelLine={{ stroke: "#94a3b8", strokeWidth: 1.5 }}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={colors[index % colors.length]}
                    stroke="#ffffff"
                    strokeWidth={isSaleShift ? 4 : 2}
                  />
                ))}
              </Pie>
              {isSaleShift && (
                <>
                  <text
                    x="50%"
                    y="39%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="sale-pie-total"
                  >
                    100%
                  </text>
                  <text
                    x="50%"
                    y="47%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="sale-pie-caption"
                  >
                    doanh số
                  </text>
                </>
              )}
              <Tooltip
                formatter={(value) =>
                  isSaleShift
                    ? [`${Number(value).toFixed(2)}%`, "Tỷ lệ"]
                    : value.toLocaleString("vi-VN")
                }
                contentStyle={
                  isSaleShift
                    ? {
                        border: "1px solid #e2e8f0",
                        borderRadius: 12,
                        boxShadow: "0 12px 30px rgba(15, 23, 42, 0.12)",
                      }
                    : undefined
                }
              />
              <Legend
                verticalAlign="bottom"
                height={isSaleShift ? 42 : 50}
                iconType={isSaleShift ? "circle" : "square"}
                iconSize={isSaleShift ? 10 : 18}
                wrapperStyle={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#334155",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        );
      }),
    { ssr: false, loading: () => <p>Đang tải biểu đồ tròn...</p> },
  );
  const formatEmployeeName2 = (fullName) => {
    const parts = fullName.trim().split(/\s+/);

    // Trường hợp đặc biệt: "Hoàng Công Phi"
    if (fullName.trim().toLowerCase() === "hoàng công phi") {
      return "PhiHc";
    }
    if (fullName.trim().toLowerCase() === "team tuấn anh") {
      return "Tuấn Anh";
    }
    if (fullName.trim().toLowerCase() === "hạnh tm") {
      return "Hạnh TM";
    }
    if (fullName.trim().toLowerCase() === "bùi yến nhi") {
      return "Bùi Nhi";
    }

    if (fullName.trim().toLowerCase() === "nguyễn diệp anh") {
      return "Diệp Anh";
    }

    if (parts.length === 4) {
      // Nếu có 4 chữ:
      // Nếu chữ cuối là "Anh", lấy cả chữ thứ 3 và chữ thứ 4
      if (parts[3].toLowerCase() === "anh") {
        return parts[2] + parts[3];
      } else {
        // Ngược lại, chỉ lấy chữ cuối
        return parts[3];
      }
    } else if (parts.length === 3) {
      // Nếu có 4 chữ:
      // Nếu chữ cuối là "Anh", lấy cả chữ thứ 3 và chữ thứ 4
      if (parts[2].toLowerCase() === "anh") {
        return parts[1] + parts[2];
      } else {
        // Ngược lại, chỉ lấy chữ cuối
        return parts[2];
      }
    } else if (parts.length === 2) {
      // Nếu có 3 chữ, chỉ lấy chữ cuối
      return parts[1];
    }
    // Trường hợp khác, trả về tên đầy đủ ban đầu
    return fullName;
  };
  const formatEmployeeName = (fullName, existingFormatted = new Set()) => {
    const parts = fullName.trim().split(/\s+/);

    // Trường hợp đặc biệt
    if (fullName.trim().toLowerCase() === "hoàng công phi") {
      // Không cần kiểm tra trùng, trả luôn "PhiHc"
      existingFormatted.add("PhiHc");
      return "PhiHc";
    }
    if (fullName.trim().toLowerCase() === "team tuấn anh") {
      return "Tuấn Anh";
    }
    if (fullName.trim().toLowerCase() === "hạnh tm") {
      return "Hạnh TM";
    }
    if (fullName.trim().toLowerCase() === "bùi yến nhi") {
      return "Bùi Nhi";
    }
    if (fullName.trim().toLowerCase() === "đỗ uyển nhi") {
      return "Uyển Nhi";
    }
    if (fullName.trim().toLowerCase() === "phan thị bích ngọc") {
      return "Bích Ngọc";
    }

    if (fullName.trim().toLowerCase() === "diệp anh") {
      return "Diệp Anh";
    }
    let formatted;
    if (parts.length === 4) {
      // Nếu có 4 chữ
      if (parts[3].toLowerCase() === "anh") {
        formatted = parts[2] + parts[3]; // ví dụ: "MinhAnh"
      } else {
        formatted = parts[3]; // ban đầu chỉ lấy chữ cuối
      }
    } else if (parts.length === 3) {
      if (parts[2].toLowerCase() === "anh") {
        formatted = parts[1] + parts[2]; // ví dụ: "MinhAnh"
      } else {
        formatted = parts[2]; // ban đầu chỉ lấy chữ cuối
      } // chỉ lấy chữ cuối
    } else if (parts.length === 2) {
      formatted = parts[1]; // chỉ lấy chữ cuối
    } else {
      formatted = fullName; // nếu không đủ 3 hoặc 4 chữ, trả về tên đầy đủ
    }

    // Nếu tên đã bị trùng (đã có trong set), ta sẽ kết hợp thêm chữ trước đó
    if (existingFormatted.has(formatted) && parts.length >= 2) {
      if (parts.length === 4) {
        // Với 4 chữ, nếu chữ cuối không phải "Anh" (nếu chữ cuối là "Anh" thì đã được kết hợp)
        formatted = parts[2] + parts[3];
      } else if (parts.length === 3) {
        formatted = parts[1] + parts[2];
      } else if (parts.length === 2) {
        formatted = parts[1] + parts[2];
      }
    }
    existingFormatted.add(formatted);
    return formatted;
  };

  const formatYAxisTick = (value) => {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
    } else if (value >= 1000) {
      return (value / 1000).toFixed(1).replace(/\.0$/, "") + "K";
    }
    return value;
  };
  // Component biểu đồ nhóm (grouped double bar chart) hiển thị 2 series: profit và adsCost
  // const GroupedDoubleBarChartComponent = dynamic(
  //   () =>
  //     Promise.resolve(({ data }) => {
  //       const {
  //         ResponsiveContainer,
  //         BarChart,
  //         Bar,
  //         LabelList,
  //         XAxis,
  //         YAxis,
  //         CartesianGrid,
  //         Tooltip,
  //         Legend,
  //       } = require("recharts");

  //       return (
  //         <ResponsiveContainer width="100%" height={400}>
  //           <BarChart data={data}>
  //             <CartesianGrid strokeDasharray="3 3" />
  //             <XAxis
  //   dataKey="name"
  //   tickFormatter={(fullName) => formatEmployeeName(fullName)}
  // />
  //             <YAxis
  //               tickFormatter={(value) => value.toLocaleString("vi-VN")}
  //               // interval={0}
  //               tickCount={12}
  //               dx={11} // Dịch chuyển nhãn trục Y sang bên phải
  //             />
  //             <Tooltip formatter={(value) => value.toLocaleString("vi-VN")} />
  //             <Legend />
  //             <Bar dataKey="profit" fill="#8884d8">
  //               <LabelList
  //                 dataKey="profit"
  //                 formatter={(value) => value.toLocaleString("vi-VN")}
  //                 position="top"
  //               />
  //             </Bar>
  //             <Bar dataKey="adsCost" fill="#FF8042">
  //               {/* <LabelList
  //                 dataKey="adsCost"
  //                 formatter={(value) => value.toLocaleString("vi-VN")}
  //                 position="top"
  //               /> */}
  //             </Bar>

  //           </BarChart>
  //         </ResponsiveContainer>
  //       );
  //     }),
  //   { ssr: false, loading: () => <p>Đang tải biểu đồ nhóm...</p> }
  // );
  const GroupedDoubleBarChartComponent = dynamic(
    () =>
      Promise.resolve(({ data }) => {
        const {
          ResponsiveContainer,
          BarChart,
          Bar,
          LabelList,
          XAxis,
          YAxis,
          CartesianGrid,
          Tooltip,
          Legend,
        } = require("recharts");

        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                tickFormatter={(fullName) => formatEmployeeName(fullName)}
              />

              <YAxis tickFormatter={formatYAxisTick} tickCount={6} />

              <Tooltip formatter={(value) => value.toLocaleString("vi-VN")} />
              <Legend />
              <Bar dataKey="profit" fill="#8884d8" radius={[8, 8, 0, 0]}>
                <LabelList
                  dataKey="profit"
                  formatter={formatYAxisTick}
                  position="top"
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      }),
    { ssr: false, loading: () => <p>Đang tải biểu đồ nhóm...</p> },
  );
  const GroupedDoubleBarChartComponentTEAM = dynamic(
    () =>
      Promise.resolve(({ data }) => {
        const {
          ResponsiveContainer,
          BarChart,
          Bar,
          LabelList,
          XAxis,
          YAxis,
          CartesianGrid,
          Tooltip,
          Legend,
        } = require("recharts");

        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                tickFormatter={(fullName) => formatEmployeeName(fullName)}
              />

              <YAxis tickFormatter={formatYAxisTick} tickCount={6} />

              <Tooltip formatter={(value) => value.toLocaleString("vi-VN")} />
              <Legend />
              <Bar dataKey="profit" fill="#8884d8" radius={[8, 8, 0, 0]}>
                <LabelList
                  dataKey="profit"
                  formatter={formatYAxisTick}
                  position="top"
                />
              </Bar>
              <Bar dataKey="adsCost" fill="#FF8042" radius={[8, 8, 0, 0]}>
                <LabelList
                  dataKey="adsCost"
                  formatter={formatYAxisTick}
                  position="top"
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      }),
    { ssr: false, loading: () => <p>Đang tải biểu đồ nhóm...</p> },
  );
  const GroupedDoubleBarChartComponent4 = dynamic(
    () =>
      Promise.resolve(({ data }) => {
        const {
          ResponsiveContainer,
          BarChart,
          Bar,
          LabelList,
          XAxis,
          YAxis,
          CartesianGrid,
          Tooltip,
          Legend,
        } = require("recharts");

        return (
          <BarChart width={600} height={400} data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              tickFormatter={(fullName) => formatEmployeeName(fullName)}
            />

            <YAxis tickFormatter={formatYAxisTick} tickCount={6} />

            <Tooltip formatter={(value) => value.toLocaleString("vi-VN")} />
            <Legend />
            <Bar dataKey="profit" fill="#8884d8">
              <LabelList
                dataKey="profit"
                formatter={formatYAxisTick}
                position="top"
              />
            </Bar>
          </BarChart>
        );
      }),
    { ssr: false, loading: () => <p>Đang tải biểu đồ nhóm...</p> },
  );
  const GroupedDoubleBarChartComponent3 = dynamic(
    () =>
      Promise.resolve(({ data }) => {
        const {
          ResponsiveContainer,
          BarChart,
          Bar,
          LabelList,
          XAxis,
          YAxis,
          CartesianGrid,
          Tooltip,
          Legend,
        } = require("recharts");

        return (
          <BarChart width={700} height={400} data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              tickFormatter={(fullName) => formatEmployeeName(fullName)}
            />
            <YAxis tickFormatter={formatYAxisTick} tickCount={6} />
            <Tooltip formatter={(value) => value.toLocaleString("vi-VN")} />
            <Legend />
            <Bar dataKey="LeadAndMembers" fill="#8884d8">
              <LabelList
                dataKey="LeadAndMembers"
                formatter={formatYAxisTick}
                position="top"
              />
            </Bar>
            <Bar dataKey="members" fill="#FF8042">
              <LabelList
                dataKey="members"
                formatter={formatYAxisTick}
                position="top"
              />
            </Bar>
          </BarChart>
        );
      }),
    { ssr: false, loading: () => <p>Đang tải biểu đồ nhóm...</p> },
  );

  const [chartWidth, setChartWidth] = useState(800); // giá trị mặc định

  useEffect(() => {
    const handleResize = () => {
      setChartWidth(window.innerWidth);
    };

    // Cập nhật ngay khi component mount
    handleResize();

    // Lắng nghe sự kiện resize
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const GroupedDoubleBarChartComponent2 = dynamic(
    () =>
      Promise.resolve(({ data }) => {
        const {
          ResponsiveContainer,
          BarChart,
          Cell,
          LabelList,
          Bar,
          XAxis,
          YAxis,
          CartesianGrid,
          Tooltip,
          Legend,
        } = require("recharts");
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                tickFormatter={(fullName) => formatEmployeeName(fullName)}
              />
              <YAxis tickFormatter={formatYAxisTick} />
              <Tooltip formatter={(value) => value.toLocaleString("vi-VN")} />

              <Legend />
              <Bar dataKey="profit" radius={[8, 8, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
                <LabelList
                  dataKey="profit"
                  formatter={formatYAxisTick}
                  position="top"
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      }),
    { ssr: false, loading: () => <p>Đang tải biểu đồ nhóm...</p> },
  );

  // Component biểu đồ nhóm so sánh Leader vs Others (như đã có)
  const GroupedBarChartComponent = dynamic(
    () =>
      Promise.resolve(({ data }) => {
        const {
          BarChart,
          Bar,
          XAxis,
          YAxis,
          CartesianGrid,
          Tooltip,
          Legend,
        } = require("recharts");
        return (
          <BarChart width={chartWidth} height={400} data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="team"
              tickFormatter={(fullName) => formatEmployeeName(fullName)}
            />
            <YAxis tickFormatter={(value) => value.toLocaleString("vi-VN")} />
            <Tooltip formatter={(value) => value.toLocaleString("vi-VN")} />

            <Legend />
            <Bar
              dataKey="leader"
              fill="#82ca9d"
              label={({ payload, x, y, width }) =>
                payload && payload.leaderPercent !== undefined ? (
                  <text
                    x={x + width / 2}
                    y={y - 10}
                    fill="#000"
                    textAnchor="middle"
                  >
                    {payload.leaderPercent}%
                  </text>
                ) : null
              }
            />
            <Bar dataKey="others" fill="#8884d8" />
          </BarChart>
        );
      }),
    { ssr: false, loading: () => <p>Đang tải biểu đồ nhóm...</p> },
  );

  // Hàm lọc đơn hàng theo preset (áp dụng cho orders và adsMoney)
  function filterByPreset(dataArray, preset) {
    const now = new Date();
    let start, end;
    switch (preset) {
      case "today":
        // Bắt đầu từ 00:00:00 đến 23:59:59 của hôm nay
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        end = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          23,
          59,
          59,
          999,
        );
        break;
      case "yesterday":
        // Hôm qua: từ 00:00:00 đến 23:59:59 của ngày hôm qua
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        end = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - 1,
          23,
          59,
          59,
          999,
        );
        break;
      case "week":
        // 7 ngày gần nhất: từ ngày 7 ngày trước (00:00:00) đến hôm nay (23:59:59)
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        end = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          23,
          59,
          59,
          999,
        );
        break;
      case "currentMonth":
        // Từ ngày 1 của tháng đến cuối ngày hôm nay
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          23,
          59,
          59,
          999,
        );
        break;
      case "lastMonth":
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        break;
      case "twoMonthsAgo":
        start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        end = new Date(
          now.getFullYear(),
          now.getMonth() - 1,
          0,
          23,
          59,
          59,
          999,
        );
        break;
      case "threeMonthsAgo":
        start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        end = new Date(
          now.getFullYear(),
          now.getMonth() - 2,
          0,
          23,
          59,
          59,
          999,
        );
        break;
      default:
        return dataArray;
    }
    return dataArray.filter((item) => {
      // Dùng field 'orderDate' nếu có, nếu không, dùng 'date'
      const dateStr = item.orderDate || item.date;
      const itemDate = new Date(dateStr);
      return itemDate >= start && itemDate <= end;
    });
  }

  // Hàm trả về mảng 30 ngày gần nhất (YYYY-MM-DD)
  function getLast30Days() {
    const days = [];
    for (let i = 7; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split("T")[0]);
    }
    return days;
  }

  // Dữ liệu teams
  const teamsByArea = {
    da: [
      { label: "TEAM PHI", value: "PHI" },
      { label: "TEAM TUẤN ANH", value: "TUANANH" },
    ],
    pvd: [
      { label: "TEAM DIỆU", value: "DIEU" },
      { label: "TEAM SƠN", value: "SON" },
      { label: "TEAM QUÂN", value: "QUAN" },
      { label: "TEAM LẺ", value: "LE" },
      { label: "TEAM DIỆN ONLINE", value: "DIENON" },
      { label: "TEAM DIỆN", value: "DIEN" },
      { label: "TEAM PHÚ THÀNH", value: "PHUTHANH" },
      { label: "TEAM ÁNH ", value: "ANH" },
      { label: "TEAM TÙNG ", value: "TUNG" },
    ],
    all: [
      { label: "TEAM PHI", value: "PHI" },
      { label: "TEAM DIỆU", value: "DIEU" },
      { label: "TEAM SƠN", value: "SON" },
      { label: "TEAM QUÂN", value: "QUAN" },
      { label: "TEAM LẺ", value: "LE" },
      { label: "TEAM TUẤN ANH", value: "TUANANH" },
      { label: "TEAM DIỆN ONLINE", value: "DIENON" },
      { label: "TEAM DIỆN", value: "DIEN" },
      { label: "TEAM PHÚ THÀNH", value: "PHUTHANH" },
      { label: "TEAM ÁNH ", value: "ANH" },
      { label: "TEAM TÙNG ", value: "TUNG" },
      //  { label: "TEAM NHẬT", value: "JP" },
      // { label: "TEAM ĐÀI", value: "TW" },
    ],
  };

  const teams = teamsByArea[selectedArea] || [];
  const teamsByArea2 = {
    da: [
      { label: "TEAM PHI", value: "PHI" },
      { label: "TEAM TUẤN ANH", value: "TUANANH" },
    ],
    pvd: [
      { label: "TEAM DIỆU", value: "DIEU" },
      { label: "TEAM SƠN", value: "SON" },
      { label: "TEAM QUÂN", value: "QUAN" },
      { label: "TEAM LẺ", value: "LE" },
      { label: "TEAM DIỆN ONLINE", value: "DIENON" },
      { label: "TEAM DIỆN", value: "DIEN" },
      { label: "TEAM PHÚ THÀNH", value: "PHUTHANH" },
      { label: "TEAM ÁNH ", value: "ANH" },
      { label: "TEAM TÙNG ", value: "TUNG" },
    ],
    all: [
      { label: "TEAM PHI", value: "PHI" },
      { label: "TEAM DIỆU", value: "DIEU" },
      { label: "TEAM SƠN", value: "SON" },
      { label: "TEAM QUÂN", value: "QUAN" },
      { label: "TEAM LẺ", value: "LE" },
      { label: "TEAM TUẤN ANH", value: "TUANANH" },
      { label: "TEAM DIỆN ONLINE", value: "DIENON" },
      { label: "TEAM DIỆN", value: "DIEN" },
      { label: "TEAM PHÚ THÀNH", value: "PHUTHANH" },
      { label: "TEAM ÁNH ", value: "ANH" },
      { label: "TEAM TÙNG ", value: "TUNG" },
      //  { label: "TEAM NHẬT", value: "JP" },
      // { label: "TEAM ĐÀI", value: "TW" },
    ],
  };

  const teams2 = teamsByArea2[selectedArea] || [];

  // Dữ liệu nhân viên (mẫu)

  // Lọc đơn hàng theo preset hoặc theo ngày được chọn
  let filteredOrders = orders;
  if (selectedPreset) {
    filteredOrders = filterByPreset(orders, selectedPreset);
  } else if (selectedDate) {
    filteredOrders = orders.filter((order) => order.orderDate === selectedDate);
  }
  const areaEmployeeNames = filteredEmployeesByArea.map((e) =>
    e.name.trim().toLowerCase(),
  );

  const filteredOrdersByArea0mkt = filteredOrders.filter((order) => {
    const mkt = order.mkt?.trim().toLowerCase();
    return (
      // areaEmployeeNames.includes(saleName) ||
      areaEmployeeNames.includes(mkt)
      // areaEmployeeNames.includes(salexulyName)
    );
  });

  const filteredOrdersByArea = selectedMKT
    ? filteredOrdersByArea0mkt.filter(
        (order) =>
          order.mkt &&
          order.mkt.trim().toLowerCase() === selectedMKT.trim().toLowerCase(),
      )
    : filteredOrdersByArea0mkt;

  // Lọc chi phí ads theo cùng bộ lọc (dùng field 'date')
  let filteredAds2 = adsMoneyData;
  let filteredAds = selectedMKT
    ? filteredAds2.filter((ad) => {
        const adName = (ad.name || "").trim().toLowerCase();
        const mktName = selectedMKT.trim().toLowerCase();
        return adName === mktName;
      })
    : filteredAds2;

  if (selectedPreset) {
    filteredAds = filterByPreset(
      adsMoneyData.map((ad) => ({ ...ad, orderDate: ad.date })),
      selectedPreset,
    ).map((ad) => ({ ...ad, date: ad.orderDate }));
  } else if (selectedDate) {
    filteredAds = adsMoneyData.filter((ad) => ad.date === selectedDate);
  }

  const filteredAdsByArea2 = filteredAds.filter((ad) => {
    const name = ad.name?.trim().toLowerCase();
    return areaEmployeeNames.includes(name);
  });
  const filteredAdsByArea = selectedMKT
    ? filteredAdsByArea2.filter((ad) => {
        const adName = (ad.name || "").trim().toLowerCase();
        const mktName = selectedMKT.trim().toLowerCase();
        return adName === mktName;
      })
    : filteredAdsByArea2;
  // === Biểu đồ doanh số theo nhân viên (Grouped Double Bar Chart) ===
  const mktEmployees = useMemo(
    () => filteredEmployeesByArea.filter((emp) => emp.position_team === "mkt"),
    [filteredEmployeesByArea],
  );

  const employeeChartDataNew = useMemo(() => {
    // Dựng map profit theo tên MKT (lowercase) trên filteredOrdersByArea để tra cứu O(1)
    const profitByName = new Map();
    for (let i = 0; i < filteredOrdersByArea.length; i++) {
      const o = filteredOrdersByArea[i];
      const key = (o.mkt || "").trim().toLowerCase();
      if (!key) continue;
      profitByName.set(key, (profitByName.get(key) || 0) + (o.profit || 0));
    }
    // Dựng map adsCost theo tên
    const adsByName = new Map();
    for (let i = 0; i < filteredAdsByArea.length; i++) {
      const a = filteredAdsByArea[i];
      const key = (a.name || "").trim().toLowerCase();
      if (!key) continue;
      adsByName.set(
        key,
        (adsByName.get(key) || 0) + ((a.request1 || 0) + (a.request2 || 0)),
      );
    }
    return mktEmployees.map((emp) => {
      const key = (emp.name || "").trim().toLowerCase();
      return {
        name: emp.name,
        profit: (profitByName.get(key) || 0) * 0.95,
        adsCost: adsByName.get(key) || 0,
      };
    });
  }, [mktEmployees, filteredOrdersByArea, filteredAdsByArea]);

  const teamEmployees = mktEmployees.filter(
    (emp) =>
      emp.team_id === currentUser.team_id ||
      (currentUser.team_id === "SON" &&
        (emp.name.trim() === "Nguyễn Thị Xuân Diệu" ||
          emp.name.trim() === "Nguyễn Bá Quân")),
  );

  const employeeChartDataNewTEAM = useMemo(() => {
    const profitByName = new Map();
    for (let i = 0; i < filteredOrdersByArea.length; i++) {
      const o = filteredOrdersByArea[i];
      const key = (o.mkt || "").trim().toLowerCase();
      if (!key) continue;
      profitByName.set(key, (profitByName.get(key) || 0) + (o.profit || 0));
    }
    const adsByName = new Map();
    for (let i = 0; i < filteredAdsByArea2.length; i++) {
      const a = filteredAdsByArea2[i];
      const key = (a.name || "").trim().toLowerCase();
      if (!key) continue;
      adsByName.set(
        key,
        (adsByName.get(key) || 0) + ((a.request1 || 0) + (a.request2 || 0)),
      );
    }
    return teamEmployees.map((emp) => {
      const key = (emp.name || "").trim().toLowerCase();
      return {
        name: emp.name,
        profit: (profitByName.get(key) || 0) * 0.95,
        adsCost: adsByName.get(key) || 0,
      };
    });
  }, [teamEmployees, filteredOrdersByArea, filteredAdsByArea2]);

  const saleEmployees = filteredEmployeesByArea.filter(
    (emp) => emp.position_team === "sale" && emp.quocgia === "kr",
  );
  const saleEmployees2 = filteredEmployeesByArea.filter(
    (emp) =>
      emp.quocgia === "kr" &&
      (emp.position === "salenhapdon" ||
        emp.position === "salexuly" ||
        emp.position === "salefull"),
  );
  const saleEmployeesND = filteredEmployeesByArea.filter(
    (emp) =>
      emp.position_team === "sale" &&
      emp.position === "salenhapdon" &&
      emp.quocgia === "kr",
  );
  const saleEmployeesOL = filteredEmployeesByArea.filter(
    (emp) =>
      emp.position_team === "sale" &&
      emp.position === "salefull" &&
      emp.quocgia === "kr",
  );
  const saleEmployeesXL = filteredEmployeesByArea.filter(
    (emp) =>
      emp.position_team === "sale" &&
      emp.position === "salexuly" &&
      emp.quocgia === "kr",
  );
  const employeeChartDataNewsale = useMemo(() => {
    const profitByName = new Map();
    for (let i = 0; i < filteredOrdersByArea.length; i++) {
      const o = filteredOrdersByArea[i];
      const k1 = (o.sale || "").trim().toLowerCase();
      const k2 = (o.salexuly || "").trim().toLowerCase();
      const p = o.profit || 0;
      if (k1) profitByName.set(k1, (profitByName.get(k1) || 0) + p);
      if (k2 && k2 !== k1)
        profitByName.set(k2, (profitByName.get(k2) || 0) + p);
    }
    return saleEmployees2.map((emp) => {
      const key = (emp.name || "").trim().toLowerCase();
      const sales = profitByName.get(key) || 0;
      let fillColor = "#8884d8";
      if (emp.position === "salenhapdon") fillColor = "#8884d8";
      else if (emp.position === "salexuly") fillColor = "#82ca9d";
      else if (emp.position === "salefull") fillColor = "#AA336A";
      return { name: emp.name, profit: sales, fill: fillColor };
    });
  }, [saleEmployees2, filteredOrdersByArea]);

  const teamChartDataNew = useMemo(() => {
    const profitByName = new Map();
    for (let i = 0; i < filteredOrdersByArea.length; i++) {
      const o = filteredOrdersByArea[i];
      const key = (o.mkt || "").trim().toLowerCase();
      if (!key) continue;
      profitByName.set(key, (profitByName.get(key) || 0) + (o.profit || 0));
    }
    const lookup = (name) => profitByName.get(name.trim().toLowerCase()) || 0;

    return teams2.map((team) => {
      const teamEmps = filteredEmployeesByArea.filter(
        (emp) => emp.position_team === "mkt" && emp.team_id === team.value,
      );
      const teamEmps2 = filteredEmployeesByArea.filter(
        (emp) =>
          emp.position_team === "mkt" &&
          emp.team_id === team.value &&
          emp.position !== "lead" &&
          emp.position !== "managerMKT",
      );

      let sales = 0;
      for (let i = 0; i < teamEmps.length; i++)
        sales += lookup(teamEmps[i].name);
      let members = 0;
      for (let i = 0; i < teamEmps2.length; i++)
        members += lookup(teamEmps2[i].name);

      if (team.value === "JP") {
        const extra = lookup("Phi Navy");
        sales += extra;
        members += extra;
      }
      if (team.value === "TW") {
        const extra = lookup("Trần Ngọc Diện");
        sales += extra;
        members += extra;
      }

      return {
        name: team.label,
        LeadAndMembers: sales,
        members,
      };
    });
  }, [teams2, filteredEmployeesByArea, filteredOrdersByArea]);
  // // === Biểu đồ doanh số theo team (Grouped Double Bar Chart) ===
  const teamChartDataNew2 = useMemo(() => {
    const profitByName = new Map();
    for (let i = 0; i < filteredOrdersByArea.length; i++) {
      const o = filteredOrdersByArea[i];
      const key = (o.mkt || "").trim().toLowerCase();
      if (!key) continue;
      profitByName.set(key, (profitByName.get(key) || 0) + (o.profit || 0));
    }
    const adsByName = new Map();
    for (let i = 0; i < filteredAdsByArea2.length; i++) {
      const a = filteredAdsByArea2[i];
      const key = (a.name || "").trim().toLowerCase();
      if (!key) continue;
      adsByName.set(
        key,
        (adsByName.get(key) || 0) + ((a.request1 || 0) + (a.request2 || 0)),
      );
    }
    const lookupProfit = (name) =>
      profitByName.get(name.trim().toLowerCase()) || 0;
    const lookupAds = (name) => adsByName.get(name.trim().toLowerCase()) || 0;

    return teams.map((team) => {
      const teamEmps = filteredEmployeesByArea.filter(
        (emp) => emp.position_team === "mkt" && emp.team_id === team.value,
      );

      let sales = 0;
      let adsCost = 0;
      for (let i = 0; i < teamEmps.length; i++) {
        sales += lookupProfit(teamEmps[i].name);
        adsCost += lookupAds(teamEmps[i].name);
      }

      if (team.value === "JP") {
        sales += lookupProfit("Phi Navy");
        adsCost += lookupAds("Phi Navy");
      }
      if (team.value === "TW") {
        const extraTW = [
          "Nguyễn Quốc Hiếu",
          "Nguyễn Thị Nga",
          "Phạm Hương Giang",
          "Hà Minh Sang",
          "Trần Ngọc Diện",
        ];
        for (let i = 0; i < extraTW.length; i++) {
          sales += lookupProfit(extraTW[i]);
          adsCost += lookupAds(extraTW[i]);
        }
      }

      return { name: team.label, profit: sales * 0.95, adsCost };
    });
  }, [
    teams,
    filteredEmployeesByArea,
    filteredOrdersByArea,
    filteredAdsByArea2,
  ]);

  // const teamChartDataNew = teams.map(team => {
  //   const teamEmps = filteredEmployeesByArea.filter(emp => emp.position_team === "mkt" && emp.team_id === team.value);
  //   const sales = teamEmps.reduce((acc, emp) => {
  //     const empSales = filteredOrdersByArea
  //       .filter(order => order.mkt === emp.name)
  //       .reduce((sum, order) => sum + order.profit, 0);
  //     return acc + empSales;
  //   }, 0);
  //   const adsCost = teamEmps.reduce((acc, emp) => {
  //     const empAds = filteredAds
  //       .filter(ad => ad.name === emp.name)
  //       .reduce((sum, ad) => sum + (ad.request1 + ad.request2), 0);
  //     return acc + empAds;
  //   }, 0);
  //   return { name: team.label, profit: sales*1, adsCost };
  // });

  // === Biểu đồ doanh số hàng ngày (Grouped Double Bar Chart) ===
  const isFilterApplied =
    selectedPreset || (selectedDate && selectedDate !== today);

  const dailyChartDataNew = useMemo(() => {
    const profitByDate = new Map();
    const salesSource = isFilterApplied ? filteredOrdersByArea : orders;
    for (let i = 0; i < salesSource.length; i++) {
      const d = salesSource[i].orderDate;
      if (!d) continue;
      profitByDate.set(
        d,
        (profitByDate.get(d) || 0) + (salesSource[i].profit || 0),
      );
    }
    const adsByDate = new Map();
    const adsSource = isFilterApplied ? filteredAdsByArea2 : adsMoneyData;
    for (let i = 0; i < adsSource.length; i++) {
      const d = adsSource[i].date;
      if (!d) continue;
      adsByDate.set(
        d,
        (adsByDate.get(d) || 0) +
          ((adsSource[i].request1 || 0) + (adsSource[i].request2 || 0)),
      );
    }

    let dateArray;
    if (isFilterApplied && filteredOrders.length > 0) {
      let minDate = new Date(filteredOrders[0].orderDate);
      let maxDate = new Date(filteredOrders[0].orderDate);
      for (let i = 1; i < filteredOrders.length; i++) {
        const d = new Date(filteredOrders[i].orderDate);
        if (d < minDate) minDate = d;
        if (d > maxDate) maxDate = d;
      }
      dateArray = [];
      const cur = new Date(minDate);
      while (cur <= maxDate) {
        dateArray.push(cur.toISOString().split("T")[0]);
        cur.setDate(cur.getDate() + 1);
      }
    } else {
      dateArray = getLast30Days();
    }

    const result = new Array(dateArray.length);
    for (let i = 0; i < dateArray.length; i++) {
      const date = dateArray[i];
      result[i] = {
        name: date,
        profit: (profitByDate.get(date) || 0) * 0.95,
        adsCost: adsByDate.get(date) || 0,
      };
    }
    return result;
  }, [
    isFilterApplied,
    filteredOrders,
    filteredOrdersByArea,
    orders,
    filteredAdsByArea2,
    adsMoneyData,
  ]);

  // === Biểu đồ doanh số hàng ngày TEAM ===
  // Nếu currentUser là team lead, lọc các đơn hàng và ads theo team
  if (
    isTeamLead ||
    currentUser.position === "mkt" ||
    (currentUser.position === "admin" && selectedTeam) ||
    (currentUser.position === "managerMKT" && selectedTeam)
  ) {
    // Lấy danh sách tên nhân viên của team
    const teamEmployeeNames = filteredEmployeesByArea
      .filter(
        (emp) =>
          (emp.team_id === currentUser.team_id &&
            emp.position_team === "mkt") ||
          (currentUser.team_id === "SON" &&
            ["Nguyễn Thị Xuân Diệu", "Nguyễn Bá Quân"].includes(
              (emp.name || "").trim(),
            )),
        //   ||
        // (currentUser.team_id === "LE" &&
        //   ["Bùi Văn Phi"].includes((emp.name || "").trim()))
      )
      .map((emp) => (emp.name || "").trim().toLowerCase());

    // Lọc đơn hàng và ads chỉ thuộc team đó
    filteredOrders = filteredOrdersByArea.filter((order) =>
      teamEmployeeNames.includes(order.mkt.trim().toLowerCase()),
    );
    filteredAds = filteredAds.filter((ad) =>
      teamEmployeeNames.includes(ad.name.trim().toLowerCase()),
    );
  }

  const dailyChartDataNewTEAM = useMemo(() => {
    const profitByDate = new Map();
    const salesSource = isFilterApplied ? filteredOrdersByArea : orders;
    for (let i = 0; i < salesSource.length; i++) {
      const d = salesSource[i].orderDate;
      if (!d) continue;
      profitByDate.set(
        d,
        (profitByDate.get(d) || 0) + (salesSource[i].profit || 0),
      );
    }
    const adsByDate = new Map();
    const adsSource = isFilterApplied ? filteredAdsByArea2 : adsMoneyData;
    for (let i = 0; i < adsSource.length; i++) {
      const d = adsSource[i].date;
      if (!d) continue;
      adsByDate.set(
        d,
        (adsByDate.get(d) || 0) +
          ((adsSource[i].request1 || 0) + (adsSource[i].request2 || 0)),
      );
    }

    let dateArray;
    if (isFilterApplied && filteredOrders.length > 0) {
      let minDate = new Date(filteredOrders[0].orderDate);
      let maxDate = new Date(filteredOrders[0].orderDate);
      for (let i = 1; i < filteredOrders.length; i++) {
        const d = new Date(filteredOrders[i].orderDate);
        if (d < minDate) minDate = d;
        if (d > maxDate) maxDate = d;
      }
      dateArray = [];
      const cur = new Date(minDate);
      while (cur <= maxDate) {
        dateArray.push(cur.toISOString().split("T")[0]);
        cur.setDate(cur.getDate() + 1);
      }
    } else {
      dateArray = getLast30Days();
    }

    const result = new Array(dateArray.length);
    for (let i = 0; i < dateArray.length; i++) {
      const date = dateArray[i];
      result[i] = {
        name: date,
        profit: (profitByDate.get(date) || 0) * 0.95,
        adsCost: adsByDate.get(date) || 0,
      };
    }
    return result;
  }, [
    isFilterApplied,
    filteredOrders,
    filteredOrdersByArea,
    orders,
    filteredAdsByArea2,
    adsMoneyData,
  ]);

  // === Biểu đồ phần trăm doanh số theo team (PieChart) ===
  const totalCompanyProfit = filteredOrdersByArea.reduce(
    (sum, order) => sum + order.profit,
    0,
  );
  const tcp = Number(totalCompanyProfit);
  const teamPieData = teamChartDataNew2.map((item) => ({
    ...item,
    percent:
      totalCompanyProfit > 0 ? Number((item.profit / tcp) * 100).toFixed(2) : 0,
  }));

  // Tính tổng doanh số của các thành viên trong team
  const totalTeamProfit = employeeChartDataNewTEAM.reduce(
    (sum, emp) => sum + emp.profit,
    0,
  );

  // Tạo dữ liệu cho PieChart dựa trên doanh số của từng thành viên
  const employeePieDataTEAM = employeeChartDataNewTEAM.map((emp) => ({
    ...emp,
    percent:
      totalTeamProfit > 0
        ? Number((emp.profit / totalTeamProfit) * 100).toFixed(2)
        : 0,
  }));

  // Tổng profit cho employeeChartDataNew (PieChart % doanh số thành viên — tất cả MKT)
  const totalProfitAll = employeeChartDataNew.reduce(
    (sum, emp) => sum + emp.profit,
    0,
  );
  const employeePieData = employeeChartDataNew.map((emp) => ({
    ...emp,
    percent:
      totalProfitAll > 0
        ? Number((emp.profit / totalProfitAll) * 100).toFixed(2)
        : 0,
  }));

  // === Biểu đồ doanh số trung bình của nhân viên trong từng team (BarChart) ===
  const averageTeamChartData = useMemo(() => {
    const profitByName = new Map();
    for (let i = 0; i < filteredOrdersByArea.length; i++) {
      const o = filteredOrdersByArea[i];
      const key = (o.mkt || "").trim().toLowerCase();
      if (!key) continue;
      profitByName.set(key, (profitByName.get(key) || 0) + (o.profit || 0));
    }
    const lookup = (name) => profitByName.get(name.trim().toLowerCase()) || 0;

    return teams2.map((team) => {
      const teamEmps = filteredEmployeesByArea.filter(
        (emp) =>
          emp.position_team === "mkt" &&
          emp.team_id === team.value &&
          emp.position !== "lead",
      );
      let teamProfit = 0;
      for (let i = 0; i < teamEmps.length; i++)
        teamProfit += lookup(teamEmps[i].name);
      const avgProfit = teamEmps.length > 0 ? teamProfit / teamEmps.length : 0;
      return { name: team.label, profit: avgProfit * 0.95 };
    });
  }, [teams2, filteredEmployeesByArea, filteredOrdersByArea]);

  // === Biểu đồ so sánh doanh số giữa leader và các nhân viên khác trong team (Grouped Bar Chart) ===
  const leaderComparisonChartData = useMemo(() => {
    const profitByName = new Map();
    for (let i = 0; i < filteredOrdersByArea.length; i++) {
      const o = filteredOrdersByArea[i];
      const key = (o.mkt || "").trim().toLowerCase();
      if (!key) continue;
      profitByName.set(key, (profitByName.get(key) || 0) + (o.profit || 0));
    }
    const adsByName = new Map();
    for (let i = 0; i < filteredAdsByArea2.length; i++) {
      const a = filteredAdsByArea2[i];
      const key = (a.name || "").trim().toLowerCase();
      if (!key) continue;
      adsByName.set(
        key,
        (adsByName.get(key) || 0) + ((a.request1 || 0) + (a.request2 || 0)),
      );
    }
    const lookupProfit = (name) =>
      profitByName.get(name.trim().toLowerCase()) || 0;
    const lookupAds = (name) => adsByName.get(name.trim().toLowerCase()) || 0;

    return teams.map((team) => {
      const teamEmps = filteredEmployeesByArea.filter(
        (emp) => emp.position_team === "mkt" && emp.team_id === team.value,
      );
      const othersEmps = teamEmps.filter(
        (emp) => emp.position !== "lead" && emp.position !== "managerMKT",
      );

      let leaderSales0 = 0;
      let adsCost = 0;
      for (let i = 0; i < teamEmps.length; i++) {
        leaderSales0 += lookupProfit(teamEmps[i].name);
        adsCost += lookupAds(teamEmps[i].name);
      }
      let adsCost2 = 0;
      let othersSales0 = 0;
      for (let i = 0; i < othersEmps.length; i++) {
        adsCost2 += lookupAds(othersEmps[i].name);
        othersSales0 += lookupProfit(othersEmps[i].name);
      }

      const leaderSales =
        leaderSales0 !== 0
          ? ((adsCost / (leaderSales0 * 1)) * 100).toFixed(2)
          : 0;
      const othersSales =
        othersSales0 !== 0
          ? ((adsCost2 / (othersSales0 * 1)) * 100).toFixed(2)
          : 0;
      return { team: team.label, leader: leaderSales, others: othersSales };
    });
  }, [
    teams,
    filteredEmployeesByArea,
    filteredOrdersByArea,
    filteredAdsByArea2,
  ]);

  // === Báo cáo Marketing ===
  const marketingReportData = useMemo(() => {
    const paidByName = new Map();
    const unpaidByName = new Map();
    for (let i = 0; i < filteredOrdersByArea.length; i++) {
      const o = filteredOrdersByArea[i];
      const key = (o.mkt || "").trim().toLowerCase();
      if (!key) continue;
      const p = o.profit || 0;
      const status = o.paymentStatus;
      if (status === "ĐÃ THANH TOÁN") {
        paidByName.set(key, (paidByName.get(key) || 0) + p);
      } else if (status === "CHƯA THANH TOÁN" || status === "") {
        unpaidByName.set(key, (unpaidByName.get(key) || 0) + p);
      }
    }
    const adsByName = new Map();
    for (let i = 0; i < filteredAdsByArea2.length; i++) {
      const a = filteredAdsByArea2[i];
      const key = (a.name || "").trim().toLowerCase();
      if (!key) continue;
      adsByName.set(
        key,
        (adsByName.get(key) || 0) + ((a.request1 || 0) + (a.request2 || 0)),
      );
    }

    const data = mktEmployees.map((emp, index) => {
      const key = (emp.name || "").trim().toLowerCase();
      const paid = paidByName.get(key) || 0;
      const unpaid = unpaidByName.get(key) || 0;
      const total = paid + unpaid;
      const tienVND = total * exchangeRate * 0.95;
      const totalAds = adsByName.get(key) || 0;
      const adsPercent = tienVND
        ? ((totalAds / tienVND) * 100).toFixed(2)
        : "0.00";
      const pos = (emp.position || "").toLowerCase();
      return {
        key: index,
        name: emp.name,
        paid,
        unpaid,
        total,
        tienVND,
        totalAds,
        adsPercent,
        isLeader: pos === "lead" || pos === "managermkt",
      };
    });
    data.sort((a, b) => b.tienVND - a.tienVND);
    return data;
  }, [mktEmployees, filteredOrdersByArea, filteredAdsByArea2, exchangeRate]);

  const today2 = new Date();
  const startOfToday = new Date(
    today2.getFullYear(),
    today2.getMonth(),
    today2.getDate(),
  );
  const endOfToday = new Date(
    today2.getFullYear(),
    today2.getMonth(),
    today2.getDate() + 1,
  );
  const today3 = new Date();
  const startOfToday3 = new Date(
    today3.getFullYear(),
    today3.getMonth(),
    today3.getDate() - 3,
  );
  const endOfToday3 = new Date(
    today3.getFullYear(),
    today3.getMonth(),
    today3.getDate() - 2,
  );

  const marketingReportData1 = mktEmployees.map((emp, index) => {
    const total1 = orders
      .filter((order) => {
        // Giả sử order.createdAt chứa thời gian tạo đơn hàng
        const orderDate = new Date(order.createdAt);
        return (
          order.mkt.trim().toLowerCase() === emp.name.trim().toLowerCase() &&
          orderDate >= startOfToday &&
          orderDate < endOfToday
        );
      })
      .reduce((sum, order) => sum + order.profit, 0);

    // Tính tổng quảng cáo (tổng request1 + request2) trong ngày hôm nay
    const totalAds1 = adsMoneyData
      .filter((ad) => {
        // Giả sử ad.createdAt chứa thời gian tạo quảng cáo
        const adDate = new Date(ad.createdAt);
        return (
          ad.name.trim().toLowerCase() === emp.name.trim().toLowerCase() &&
          adDate >= startOfToday3 &&
          adDate < endOfToday3
        );
      })
      .reduce((sum, ad) => sum + (ad.request1 + ad.request2), 0);

    return { key: index, name: emp.name, total1, totalAds1 };
  });
  // Sắp xếp theo cột "Tiền VNĐ" giảm dần

  // Xác định thời gian bắt đầu và kết thúc của hôm nay

  const marketingReportData2 = mktEmployees.map((emp, index) => {
    // Tính tổng tiền từ các đơn hàng đã thanh toán trong ngày hôm nay
    const total2 = orders
      .filter((order) => {
        // Giả sử order.createdAt chứa thời gian tạo đơn hàng
        const orderDate = new Date(order.createdAt);
        return (
          order.mkt.trim().toLowerCase() === emp.name.trim().toLowerCase() &&
          orderDate >= startOfToday &&
          orderDate < endOfToday
        );
      })
      .reduce((sum, order) => sum + order.profit, 0);

    // Tính tổng quảng cáo (tổng request1 + request2) trong ngày hôm nay
    const totalAds2 = adsMoneyData
      .filter((ad) => {
        // Giả sử ad.createdAt chứa thời gian tạo quảng cáo
        const adDate = new Date(ad.createdAt);
        return (
          ad.name.trim().toLowerCase() === emp.name.trim().toLowerCase() &&
          adDate >= startOfToday &&
          adDate < endOfToday
        );
      })
      .reduce((sum, ad) => sum + (ad.request1 + ad.request2), 0);

    return { key: index, name: emp.name, total2, totalAds2 };
  });

  // Lọc ra 5 nhân viên có totalAds khác 0 và có total thấp nhất (sắp xếp theo total tăng dần)
  const sortedEmployees = [...marketingReportData2]
    .filter((emp) => emp.totalAds2 !== 0)
    .sort((a, b) => a.total2 - b.total2);

  let top5CriticismEmployees = [];
  if (sortedEmployees.length <= 5) {
    top5CriticismEmployees = sortedEmployees;
  } else {
    // Lấy doanh số của nhân viên thứ 5 làm mức cắt
    const cutoffValue = sortedEmployees[4].total2;
    top5CriticismEmployees = sortedEmployees.filter(
      (emp) => emp.total2 <= cutoffValue,
    );
  }

  // 🧩 Chọn người có doanh số thấp nhất từ đầu tháng
  const excludedNames = [
    "đỗ ngọc ánh",
    "trần ngọc diện",
    "nguyễn bảo ngọc",
    "hồ ngọc lan",
    "ngô anh đào",
    "Phan Thế Phong",
  ];

  // Cache tạm cho marketingReportData3 để tránh tính lại nhiều lần
  const _mktReportCache = React.useRef({ key: null, data: null });

  const marketingReportData3 = React.useMemo(() => {
    const cacheKey = `${mktEmployees.length}-${filteredOrdersByArea.length}-${adsMoneyData.length}`;
    if (
      _mktReportCache.current.key === cacheKey &&
      _mktReportCache.current.data
    ) {
      return _mktReportCache.current.data;
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const twoDaysAgo = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 2,
    );
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const endOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
    );

    // Single pass: build maps for all calculations
    const todayByName = new Map();
    const monthByName = new Map();
    const adsByName = new Map();
    const orderCountByName = new Map();

    for (let i = 0; i < orders.length; i++) {
      const o = orders[i];
      const nameLC = (o.mkt || "").trim().toLowerCase();
      if (!nameLC) continue;
      const orderDate = new Date(o.createdAt);
      const profit = o.profit || 0;

      if (orderDate >= startOfToday && orderDate < endOfToday) {
        todayByName.set(nameLC, (todayByName.get(nameLC) || 0) + profit);
        orderCountByName.set(nameLC, (orderCountByName.get(nameLC) || 0) + 1);
      }
      if (orderDate >= startOfMonth && orderDate <= endOfMonth) {
        monthByName.set(nameLC, (monthByName.get(nameLC) || 0) + profit);
      }
    }

    for (let i = 0; i < adsMoneyData.length; i++) {
      const a = adsMoneyData[i];
      const nameLC = (a.name || "").trim().toLowerCase();
      if (!nameLC) continue;
      const adDate = new Date(a.createdAt);
      if (adDate >= twoDaysAgo && adDate <= endOfMonth) {
        adsByName.set(
          nameLC,
          (adsByName.get(nameLC) || 0) + (a.request1 || 0) + (a.request2 || 0),
        );
      }
    }

    const result = mktEmployees.map((emp, index) => {
      const nameLC = emp.name.trim().toLowerCase();
      return {
        key: index,
        name: emp.name,
        totalToday: todayByName.get(nameLC) || 0,
        totalMonth: monthByName.get(nameLC) || 0,
        adsThisMonth: adsByName.get(nameLC) || 0,
        orderCountToday: orderCountByName.get(nameLC) || 0,
      };
    });

    _mktReportCache.current = { key: cacheKey, data: result };
    return result;
  }, [mktEmployees, orders, adsMoneyData]);

  const warningEmployeesList = React.useMemo(() => {
    return marketingReportData3.filter((emp) => {
      const name = emp.name.trim().toLowerCase();
      return emp.adsThisMonth > 0 && !excludedNames.includes(name);
    });
  }, [marketingReportData3]);

  const minMonthSales = React.useMemo(() => {
    if (warningEmployeesList.length === 0) return 0;
    let min = warningEmployeesList[0].totalMonth;
    for (let i = 1; i < warningEmployeesList.length; i++) {
      if (warningEmployeesList[i].totalMonth < min)
        min = warningEmployeesList[i].totalMonth;
    }
    return min;
  }, [warningEmployeesList]);

  const lowestMonthEmployees = React.useMemo(() => {
    return warningEmployeesList.filter((e) => e.totalMonth === minMonthSales);
  }, [warningEmployeesList, minMonthSales]);

  // Nếu nhiều người cùng doanh số thấp nhất → chọn ngẫu nhiên 1 người
  const randomEmployee = React.useMemo(() => {
    if (lowestMonthEmployees.length === 0) return null;
    return lowestMonthEmployees[
      Math.floor(Math.random() * lowestMonthEmployees.length)
    ];
  }, [lowestMonthEmployees]);

  const top5Employees2 = React.useMemo(() => {
    return randomEmployee ? [randomEmployee] : [];
  }, [randomEmployee]);

  // Lọc chỉ những người có ads tháng này > 0
  const excludedNames2 = ["quách phú"];

  const top5Employees = React.useMemo(() => {
    return marketingReportData3
      .filter((emp) => {
        const name = emp.name.trim().toLowerCase();
        return emp.adsThisMonth > 0 && !excludedNames2.includes(name);
      })
      .sort((a, b) => b.totalToday - a.totalToday)
      .slice(0, 3);
  }, [marketingReportData3]);

  // Top 10 theo doanh thu hôm nay
  const top10RevenueEmployees = React.useMemo(() => {
    return marketingReportData3
      .filter((emp) => {
        const name = emp.name.trim().toLowerCase();
        return emp.adsThisMonth > 0 && !excludedNames2.includes(name);
      })
      .sort((a, b) => b.totalToday - a.totalToday)
      .slice(0, 10);
  }, [marketingReportData3]);

  const top1Employees = React.useMemo(() => {
    return marketingReportData3
      .filter((emp) => emp.adsThisMonth > 0)
      .sort((a, b) => b.totalToday - a.totalToday)
      .slice(0, 1);
  }, [marketingReportData3]);

  // Lọc ra các thành viên mkt thuộc team của currentUser
  // Lọc nhân viên MKT thuộc team
  const teamMktEmployees = mktEmployees.filter(
    (emp) =>
      emp.team_id === currentUser.team_id ||
      (currentUser.team_id === "SON" &&
        ["Nguyễn Thị Xuân Diệu", "Nguyễn Bá Quân"].includes(emp.name.trim())),
    //    ||
    // (currentUser.team_id === "LE" && emp.name.trim() === "Bùi Văn Phi")
  );

  // Lọc riêng dữ liệu đơn hàng và ads của team (KHÔNG ghi đè biến gốc)
  const teamEmployeeNames = teamMktEmployees.map((e) =>
    e.name.trim().toLowerCase(),
  );

  const teamFilteredOrders = filteredOrdersByArea.filter((order) =>
    teamEmployeeNames.includes(order.mkt.trim().toLowerCase()),
  );

  const teamFilteredAds = filteredAdsByArea2.filter((ad) =>
    teamEmployeeNames.includes(ad.name.trim().toLowerCase()),
  );

  const marketingReportDataTEAM = teamMktEmployees.map((emp, index) => {
    const paid = teamFilteredOrders
      .filter(
        (order) =>
          order.mkt.trim().toLowerCase() === emp.name.trim().toLowerCase() &&
          order.paymentStatus === "ĐÃ THANH TOÁN",
      )
      .reduce((sum, order) => sum + order.profit, 0);

    const unpaid = teamFilteredOrders
      .filter(
        (order) =>
          order.mkt.trim().toLowerCase() === emp.name.trim().toLowerCase() &&
          (order.paymentStatus === "CHƯA THANH TOÁN" ||
            order.paymentStatus === ""),
      )
      .reduce((sum, order) => sum + order.profit, 0);

    const total = paid + unpaid;
    const tienVND = total * 0.95 * exchangeRate;

    const totalAds = teamFilteredAds
      .filter(
        (ad) => ad.name.trim().toLowerCase() === emp.name.trim().toLowerCase(),
      )
      .reduce((sum, ad) => sum + (ad.request1 + ad.request2), 0);

    const adsPercent = tienVND
      ? ((totalAds / tienVND) * 100).toFixed(2)
      : "0.00";

    return {
      key: index,
      name: emp.name,
      paid,
      unpaid,
      total,
      tienVND,
      totalAds,
      adsPercent,
      isLeader:
        (emp.position || "").toLowerCase() === "lead" ||
        (emp.position || "").toLowerCase() === "managermkt",
    };
  });

  // Sắp xếp theo tiền VNĐ giảm dần

  // Sắp xếp theo cột "Tiền VNĐ" giảm dần
  marketingReportDataTEAM.sort((a, b) => b.tienVND - a.tienVND);

  const marketingColumns = [
    {
      title: "Tên",
      dataIndex: "name",
      key: "name",
      width: 140,
      fixed: "left",
      render: (text, record) => {
        const style =
          record && record.isLeader
            ? {
                background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                color: "#ffffff",
                padding: "4px 12px",
                borderRadius: "20px",
                display: "inline-block",
                fontWeight: 700,
                fontSize: "12.5px",
                boxShadow: "0 2px 6px rgba(217, 119, 6, 0.35)",
              }
            : {};
        return <span style={style}>{text}</span>;
      },
    },
    {
      title: "Đã thanh toán",
      dataIndex: "paid",
      key: "paid",
      width: 130,
      align: "right",
      render: (value) => value.toLocaleString(),
    },
    {
      title: "Chưa thanh toán",
      dataIndex: "unpaid",
      key: "unpaid",
      width: 130,
      align: "right",
      render: (value) => value.toLocaleString(),
    },
    // {
    //   title: "Tổng",
    //   dataIndex: "total",
    //   key: "total",
    //   render: (value) => value.toLocaleString(),
    // },
    {
      title: "Tiền VNĐ",
      dataIndex: "tienVND",
      key: "tienVND",
      width: 150,
      align: "right",
      render: (value) => value.toLocaleString(),
    },
    {
      title: "Tổng chi phí ads",
      dataIndex: "totalAds",
      key: "totalAds",
      width: 140,
      align: "right",
      render: (value) => value.toLocaleString(),
    },
    {
      title: "% chi phí ads",
      dataIndex: "adsPercent",
      key: "adsPercent",
      width: 110,
      align: "center",
      render: (value) => {
        const percent = Number(value);
        let bgColor = "";
        let shadow = "";
        if (percent < 30) {
          bgColor = "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)";
          shadow = "rgba(34, 197, 94, 0.35)";
        } else if (percent >= 30 && percent <= 35) {
          bgColor = "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)";
          shadow = "rgba(245, 158, 11, 0.35)";
        } else {
          bgColor = "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)";
          shadow = "rgba(239, 68, 68, 0.35)";
        }
        return (
          <div
            className="mkt-ads-badge"
            style={{
              background: bgColor,
              boxShadow: `0 2px 6px ${shadow}`,
            }}
          >
            {percent.toFixed(2)}%
          </div>
        );
      },
    },
  ];

  // =================== Các bảng báo cáo SALE ===================

  // Báo cáo sale: lấy các nhân viên có position_team === "sale"

  // Helper: dựng map paid/unpaid theo (saleNameLower, roleField) để tra cứu O(1)
  // roleField xác định cột nào trong order dùng để so khớp ('sale' hoặc 'salexuly')
  const buildSaleReportData = (employeesList) => {
    // Khởi tạo map paid/unpaid theo tên+role
    const paidSale = new Map();
    const unpaidSale = new Map();
    const paidXL = new Map();
    const unpaidXL = new Map();

    for (let i = 0; i < filteredOrdersByArea.length; i++) {
      const o = filteredOrdersByArea[i];
      const saleKey = (o.sale || "").trim().toLowerCase();
      const xlKey = (o.salexuly || "").trim().toLowerCase();
      const p = o.profit || 0;
      const status = o.paymentStatus;
      if (status === "ĐÃ THANH TOÁN") {
        if (saleKey) paidSale.set(saleKey, (paidSale.get(saleKey) || 0) + p);
        if (xlKey) paidXL.set(xlKey, (paidXL.get(xlKey) || 0) + p);
      } else if (status === "CHƯA THANH TOÁN" || status === "") {
        if (saleKey)
          unpaidSale.set(saleKey, (unpaidSale.get(saleKey) || 0) + p);
        if (xlKey) unpaidXL.set(xlKey, (unpaidXL.get(xlKey) || 0) + p);
      }
    }

    const lookup = (name, paidMap, unpaidMap) => {
      const k = (name || "").trim().toLowerCase();
      return {
        paid: paidMap.get(k) || 0,
        unpaid: unpaidMap.get(k) || 0,
      };
    };

    const result = employeesList.map((emp, index) => {
      let paid = 0,
        unpaid = 0;
      if (emp.position === "salenhapdon" || emp.position === "salefull") {
        const r = lookup(emp.name, paidSale, unpaidSale);
        paid = r.paid;
        unpaid = r.unpaid;
      } else if (emp.position === "salexuly") {
        const r = lookup(emp.name, paidXL, unpaidXL);
        paid = r.paid;
        unpaid = r.unpaid;
      }
      const total = paid + unpaid;
      const tienVND = total * exchangeRate;
      const percent = total > 0 ? (paid / total) * 100 : 0;
      return {
        key: index,
        name: emp.name,
        paid,
        unpaid,
        total,
        tienVND,
        percent,
      };
    });
    result.sort((a, b) => b.tienVND - a.tienVND);
    return result;
  };

  const saleReportDataOL = useMemo(
    () => buildSaleReportData(saleEmployeesOL),
    [saleEmployeesOL, filteredOrdersByArea, exchangeRate],
  );
  const saleReportDataND = useMemo(
    () => buildSaleReportData(saleEmployeesND),
    [saleEmployeesND, filteredOrdersByArea, exchangeRate],
  );
  const saleReportDataXL = useMemo(
    () => buildSaleReportData(saleEmployeesXL),
    [saleEmployeesXL, filteredOrdersByArea, exchangeRate],
  );
  const saleReportData = useMemo(
    () => buildSaleReportData(saleEmployees),
    [saleEmployees, filteredOrdersByArea, exchangeRate],
  );
  saleReportData.sort((a, b) => b.tienVND - a.tienVND);
  saleReportDataXL.sort((a, b) => b.tienVND - a.tienVND);
  saleReportDataOL.sort((a, b) => b.tienVND - a.tienVND);
  saleReportDataND.sort((a, b) => b.tienVND - a.tienVND);
  const saleColumns = [
    {
      title: "STT",
      key: "stt",
      width: 52,
      align: "center",
      render: (_, __, index) => {
        if (index < 3) {
          const colors = [
            {
              color: "#92400e",
              bg: "linear-gradient(145deg, #fef3c7, #fde68a)",
              border: "#fcd34d",
            },
            {
              color: "#475569",
              bg: "linear-gradient(145deg, #f8fafc, #e2e8f0)",
              border: "#cbd5e1",
            },
            {
              color: "#9a3412",
              bg: "linear-gradient(145deg, #ffedd5, #fed7aa)",
              border: "#fdba74",
            },
          ];
          const c = colors[index];
          return (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 24,
                height: 24,
                borderRadius: 8,
                fontSize: 10,
                fontWeight: 900,
                color: c.color,
                background: c.bg,
                border: `1px solid ${c.border}`,
              }}
            >
              {index + 1}
            </span>
          );
        }
        return (
          <span style={{ color: "#94a3b8", fontSize: 12 }}>{index + 1}</span>
        );
      },
    },
    {
      title: "Tên",
      dataIndex: "name",
      key: "name",
      width: 180,
      render: (name) => (
        <span style={{ fontWeight: 700, color: "#0f172a" }}>{name}</span>
      ),
    },
    {
      title: "Đã thanh toán",
      dataIndex: "paid",
      key: "paid",
      align: "right",
      sorter: (a, b) => (a.paid || 0) - (b.paid || 0),
      render: (value) => (
        <span style={{ color: "#15803d", fontWeight: 600 }}>
          {value.toLocaleString()}
        </span>
      ),
    },
    {
      title: "Chưa thanh toán",
      dataIndex: "unpaid",
      key: "unpaid",
      align: "right",
      sorter: (a, b) => (a.unpaid || 0) - (b.unpaid || 0),
      render: (value) => (
        <span style={{ color: "#b91c1c", fontWeight: 600 }}>
          {value.toLocaleString()}
        </span>
      ),
    },
    {
      title: "Tổng",
      dataIndex: "total",
      key: "total",
      align: "right",
      sorter: (a, b) => (a.total || 0) - (b.total || 0),
      render: (value) => (
        <span style={{ color: "#2563eb", fontWeight: 700 }}>
          {value.toLocaleString()}
        </span>
      ),
    },
    {
      title: "Tiền VNĐ",
      dataIndex: "tienVND",
      key: "tienVND",
      align: "right",
      sorter: (a, b) => (a.tienVND || 0) - (b.tienVND || 0),
      render: (value) => (
        <span style={{ color: "#7c3aed", fontWeight: 700 }}>
          {value.toLocaleString()}
        </span>
      ),
    },
    {
      title: "% đòi tiền",
      dataIndex: "percent",
      key: "percent",
      align: "center",
      sorter: (a, b) => (a.percent || 0) - (b.percent || 0),
      render: (percent) => {
        let bgColor, fgColor, label;
        if (percent > 95) {
          bgColor = "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)";
          fgColor = "#15803d";
          label = "Xuất sắc";
        } else if (percent >= 80 && percent <= 95) {
          bgColor = "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)";
          fgColor = "#b45309";
          label = "Tốt";
        } else {
          bgColor = "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)";
          fgColor = "#b91c1c";
          label = "Cần cải thiện";
        }
        return (
          <div
            style={{
              background: bgColor,
              padding: "6px 12px",
              borderRadius: 999,
              textAlign: "center",
              fontWeight: 700,
              color: fgColor,
              fontSize: 12,
              minWidth: 86,
              display: "inline-block",
              border: `1px solid ${fgColor}33`,
            }}
            title={`${label} · ${percent.toFixed(2)}%`}
          >
            {percent.toFixed(2)}%
          </div>
        );
      },
    },
  ];
  const saleColumnsOLND = [
    {
      title: "STT",
      key: "stt",
      width: 52,
      align: "center",
      render: (_, __, index) => {
        const colors = [
          {
            color: "#92400e",
            bg: "linear-gradient(145deg, #fef3c7, #fde68a)",
            border: "#fcd34d",
          },
          {
            color: "#475569",
            bg: "linear-gradient(145deg, #f8fafc, #e2e8f0)",
            border: "#cbd5e1",
          },
          {
            color: "#9a3412",
            bg: "linear-gradient(145deg, #ffedd5, #fed7aa)",
            border: "#fdba74",
          },
        ];
        if (index < 3) {
          const c = colors[index];
          return (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 24,
                height: 24,
                borderRadius: 8,
                fontSize: 10,
                fontWeight: 900,
                color: c.color,
                background: c.bg,
                border: `1px solid ${c.border}`,
              }}
            >
              {index + 1}
            </span>
          );
        }
        return (
          <span style={{ color: "#94a3b8", fontSize: 12 }}>{index + 1}</span>
        );
      },
    },
    {
      title: "Tên",
      dataIndex: "name",
      key: "name",
      align: "left",
      render: (name) => (
        <span style={{ fontWeight: 700, color: "#0f172a" }}>{name}</span>
      ),
    },

    {
      title: "Tổng",
      dataIndex: "total",
      key: "total",
      align: "right",
      sorter: (a, b) => (a.total || 0) - (b.total || 0),
      render: (value) => (
        <span style={{ color: "#2563eb", fontWeight: 700 }}>
          {value.toLocaleString()}
        </span>
      ),
    },
    {
      title: "Tiền VNĐ",
      dataIndex: "tienVND",
      key: "tienVND",
      align: "right",
      sorter: (a, b) => (a.tienVND || 0) - (b.tienVND || 0),
      render: (value) => (
        <span style={{ color: "#7c3aed", fontWeight: 700 }}>
          {value.toLocaleString()}
        </span>
      ),
    },
  ];

  const saleDailyData = useMemo(() => {
    let dateArray;
    if (
      (selectedPreset || (selectedDate && selectedDate !== today)) &&
      filteredOrders.length > 0
    ) {
      let minDate = new Date(filteredOrders[0].orderDate);
      let maxDate = new Date(filteredOrders[0].orderDate);
      for (let i = 1; i < filteredOrders.length; i++) {
        const d = new Date(filteredOrders[i].orderDate);
        if (d < minDate) minDate = d;
        if (d > maxDate) maxDate = d;
      }
      dateArray = [];
      const cur = new Date(minDate);
      while (cur <= maxDate) {
        dateArray.push(cur.toISOString().split("T")[0]);
        cur.setDate(cur.getDate() + 1);
      }
    } else {
      dateArray = getLast30Days();
    }

    const empMap = new Map();
    for (let i = 0; i < saleEmployees.length; i++) {
      empMap.set(saleEmployees[i].name, saleEmployees[i]);
    }

    const agg = new Map();
    for (let i = 0; i < filteredOrders.length; i++) {
      const o = filteredOrders[i];
      const d = o.orderDate;
      if (!d) continue;
      let entry = agg.get(d);
      if (!entry) {
        entry = { sangSom: 0, hanhChinh: 0, toi: 0, sodon: 0 };
        agg.set(d, entry);
      }
      entry.sodon += 1;
      const emp = empMap.get(o.sale);
      if (emp) {
        if (emp.position_team2 === "onlinesang") entry.sangSom += o.profit || 0;
        else if (emp.position_team2 === "hanhchinh")
          entry.hanhChinh += o.profit || 0;
        else if (emp.position_team2 === "onlinetoi") entry.toi += o.profit || 0;
      }
    }

    return dateArray.map((date) => {
      const e = agg.get(date) || { sangSom: 0, hanhChinh: 0, toi: 0, sodon: 0 };
      const total = e.sangSom + e.hanhChinh + e.toi;
      return {
        key: date,
        date,
        sangSom: e.sangSom,
        hanhChinh: e.hanhChinh,
        toi: e.toi,
        total,
        percentSang: total > 0 ? (e.sangSom / total) * 100 : 0,
        percentHanh: total > 0 ? (e.hanhChinh / total) * 100 : 0,
        percentToi: total > 0 ? (e.toi / total) * 100 : 0,
        sodon: e.sodon,
      };
    });
  }, [selectedPreset, selectedDate, today, filteredOrders, saleEmployees]);

  const dailySaleColumns = [
    {
      title: "Ngày",
      dataIndex: "date",
      key: "date",
      width: 120,
      align: "center",
      render: (date) => (
        <span style={{ fontWeight: 700, color: "#0f172a" }}>{date}</span>
      ),
    },
    {
      title: "Sáng sớm",
      dataIndex: "sangSom",
      key: "sangSom",
      align: "right",
      sorter: (a, b) => (a.sangSom || 0) - (b.sangSom || 0),
      render: (value) => (
        <span style={{ color: "#0ea5e9", fontWeight: 600 }}>
          {value.toLocaleString()}
        </span>
      ),
    },
    {
      title: "Hành chính",
      dataIndex: "hanhChinh",
      key: "hanhChinh",
      align: "right",
      sorter: (a, b) => (a.hanhChinh || 0) - (b.hanhChinh || 0),
      render: (value) => (
        <span style={{ color: "#14b8a6", fontWeight: 600 }}>
          {value.toLocaleString()}
        </span>
      ),
    },
    {
      title: "Tối",
      dataIndex: "toi",
      key: "toi",
      align: "right",
      sorter: (a, b) => (a.toi || 0) - (b.toi || 0),
      render: (value) => (
        <span style={{ color: "#a855f7", fontWeight: 600 }}>
          {value.toLocaleString()}
        </span>
      ),
    },
    {
      title: "Tổng",
      dataIndex: "total",
      key: "total",
      align: "right",
      sorter: (a, b) => (a.total || 0) - (b.total || 0),
      render: (value) => (
        <span style={{ color: "#2563eb", fontWeight: 700 }}>
          {value.toLocaleString()}
        </span>
      ),
    },
    {
      title: "VNĐ",
      dataIndex: "total",
      key: "total",
      align: "right",
      render: (value) => (
        <span style={{ color: "#dc2626", fontWeight: 700 }}>
          {(value * 1).toLocaleString()}
        </span>
      ),
    },
    {
      title: "SL Đơn",
      dataIndex: "sodon",
      key: "sodon",
      align: "right",
      sorter: (a, b) => (a.sodon || 0) - (b.sodon || 0),
      render: (value) => (
        <span
          style={{
            display: "inline-block",
            minWidth: 50,
            padding: "2px 10px",
            borderRadius: 999,
            background: "#eef2ff",
            color: "#4338ca",
            fontWeight: 700,
            fontSize: 12,
          }}
        >
          {value.toLocaleString()}
        </span>
      ),
    },
    {
      title: "% Ds ca Sáng sớm",
      dataIndex: "percentSang",
      key: "percentSang",
      render: (percent) => {
        let bgColor, fgColor, label;
        if (percent > 50) {
          bgColor = "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)";
          fgColor = "#15803d";
          label = "Tốt";
        } else if (percent >= 30 && percent <= 50) {
          bgColor = "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)";
          fgColor = "#b45309";
          label = "TB";
        } else {
          bgColor = "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)";
          fgColor = "#b91c1c";
          label = "Thấp";
        }
        return (
          <div
            style={{
              background: bgColor,
              padding: "6px 10px",
              borderRadius: 999,
              textAlign: "center",
              fontWeight: 700,
              color: fgColor,
              fontSize: 12,
              minWidth: 78,
              display: "inline-block",
              border: `1px solid ${fgColor}33`,
            }}
            title={`${label} · ${percent.toFixed(2)}%`}
          >
            {percent.toFixed(2)}%
          </div>
        );
      },
    },
    {
      title: "% Ds ca Hành chính",
      dataIndex: "percentHanh",
      key: "percentHanh",
      align: "center",
      sorter: (a, b) => (a.percentHanh || 0) - (b.percentHanh || 0),
      render: (percent) => {
        let bgColor, fgColor, label;
        if (percent > 50) {
          bgColor = "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)";
          fgColor = "#15803d";
          label = "Tốt";
        } else if (percent >= 30 && percent <= 50) {
          bgColor = "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)";
          fgColor = "#b45309";
          label = "TB";
        } else {
          bgColor = "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)";
          fgColor = "#b91c1c";
          label = "Thấp";
        }
        return (
          <div
            style={{
              background: bgColor,
              padding: "6px 10px",
              borderRadius: 999,
              textAlign: "center",
              fontWeight: 700,
              color: fgColor,
              fontSize: 12,
              minWidth: 78,
              display: "inline-block",
              border: `1px solid ${fgColor}33`,
            }}
            title={`${label} · ${percent.toFixed(2)}%`}
          >
            {percent.toFixed(2)}%
          </div>
        );
      },
    },
    {
      title: "% Ds ca Tối",
      dataIndex: "percentToi",
      key: "percentToi",
      align: "center",
      sorter: (a, b) => (a.percentToi || 0) - (b.percentToi || 0),
      render: (percent) => {
        let bgColor, fgColor, label;
        if (percent > 50) {
          bgColor = "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)";
          fgColor = "#15803d";
          label = "Tốt";
        } else if (percent >= 30 && percent <= 50) {
          bgColor = "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)";
          fgColor = "#b45309";
          label = "TB";
        } else {
          bgColor = "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)";
          fgColor = "#b91c1c";
          label = "Thấp";
        }
        return (
          <div
            style={{
              background: bgColor,
              padding: "6px 10px",
              borderRadius: 999,
              textAlign: "center",
              fontWeight: 700,
              color: fgColor,
              fontSize: 12,
              minWidth: 78,
              display: "inline-block",
              border: `1px solid ${fgColor}33`,
            }}
            title={`${label} · ${percent.toFixed(2)}%`}
          >
            {percent.toFixed(2)}%
          </div>
        );
      },
    },
  ];

  // Thống kê để dục chuyển khoản - optimized with single pass
  const transferStats = {
    giaoThanhCong: 0,
    daGuiHang: 0,
    chuaGuiHang: 0,
    slGiao: 0,
    slDaGui: 0,
    slChuaGui: 0,
  };
  for (let i = 0; i < filteredOrdersByArea.length; i++) {
    const o = filteredOrdersByArea[i];
    if (
      (o.paymentStatus === "CHƯA THANH TOÁN" || o.paymentStatus === "") &&
      o.saleReport === "DONE"
    ) {
      const revenue = o.revenue || 0;
      if (o.deliveryStatus === "GIAO THÀNH CÔNG") {
        transferStats.giaoThanhCong += revenue;
        transferStats.slGiao++;
      } else if (o.deliveryStatus === "ĐÃ GỬI HÀNG") {
        transferStats.daGuiHang += revenue;
        transferStats.slDaGui++;
      } else if (
        o.deliveryStatus === "" ||
        o.deliveryStatus === "BỊ BẮT CHỜ GỬI LẠI"
      ) {
        transferStats.chuaGuiHang += revenue;
        transferStats.slChuaGui++;
      }
    }
  }

  const tong =
    transferStats.giaoThanhCong +
    transferStats.daGuiHang +
    transferStats.chuaGuiHang;

  const transferData = [
    {
      key: "KW",
      currency: "KW",
      giaoThanhCong: transferStats.giaoThanhCong,
      daGuiHang: transferStats.daGuiHang,
      chuaGuiHang: transferStats.chuaGuiHang,
      tong: tong,
    },
    {
      key: "VND",
      currency: "VND",
      giaoThanhCong: transferStats.giaoThanhCong * exchangeRate,
      daGuiHang: transferStats.daGuiHang * exchangeRate,
      chuaGuiHang: transferStats.chuaGuiHang * exchangeRate,
      tong: tong * exchangeRate,
    },
    {
      key: "SL",
      currency: "SL ĐƠN",
      giaoThanhCong: transferStats.slGiao,
      daGuiHang: transferStats.slDaGui,
      chuaGuiHang: transferStats.slChuaGui,
      tong:
        transferStats.slGiao + transferStats.slDaGui + transferStats.slChuaGui,
    },
  ];

  const transferColumns = [
    { title: "Tiền tệ", dataIndex: "currency", key: "currency" },
    {
      title: "Giao thành công",
      dataIndex: "giaoThanhCong",
      key: "giaoThanhCong",
      render: (value) => value.toLocaleString(),
    },
    {
      title: "Đã gửi hàng",
      dataIndex: "daGuiHang",
      key: "daGuiHang",
      render: (value) => value.toLocaleString(),
    },
    {
      title: "Chưa gửi hàng",
      dataIndex: "chuaGuiHang",
      key: "chuaGuiHang",
      render: (value) => value.toLocaleString(),
    },

    {
      title: "Tổng",
      dataIndex: "tong",
      key: "tong",
      render: (value) => {
        return (
          <div>
            <strong>{value.toLocaleString()}</strong>
          </div>
        );
      },
    },
  ];

  // THỰC TẾ ĐÃ TRỪ 5 - optimized single pass
  let daThanhToanKW3 = 0,
    chuaThanhToanKW3 = 0;
  for (let i = 0; i < filteredOrdersByArea0mkt.length; i++) {
    const o = filteredOrdersByArea0mkt[i];
    const profit = o.profit || 0;
    if (o.paymentStatus === "ĐÃ THANH TOÁN") daThanhToanKW3 += profit;
    else if (o.paymentStatus === "CHƯA THANH TOÁN" || o.paymentStatus === "")
      chuaThanhToanKW3 += profit;
  }
  const tongKW3 = (daThanhToanKW3 + chuaThanhToanKW3) * 0.95;

  let totalAdsKW3 = 0;
  for (let i = 0; i < filteredAdsByArea2.length; i++) {
    const a = filteredAdsByArea2[i];
    totalAdsKW3 += (a.request1 || 0) + (a.request2 || 0);
  }
  const percentAds3 =
    tongKW3 > 0
      ? Number(((totalAdsKW3 / (tongKW3 * exchangeRate)) * 100).toFixed(2))
      : 0;

  //bang trong team - optimized single pass
  let daThanhToanKW4 = 0,
    chuaThanhToanKW4 = 0;
  for (let i = 0; i < filteredOrdersByArea.length; i++) {
    const o = filteredOrdersByArea[i];
    const profit = o.profit || 0;
    if (o.paymentStatus === "ĐÃ THANH TOÁN") daThanhToanKW4 += profit;
    else if (o.paymentStatus === "CHƯA THANH TOÁN" || o.paymentStatus === "")
      chuaThanhToanKW4 += profit;
  }
  const tongKW4 = (daThanhToanKW4 + chuaThanhToanKW4) * 0.95;

  let totalAdsKW4 = 0;
  for (let i = 0; i < filteredAds.length; i++) {
    const a = filteredAds[i];
    totalAdsKW4 += (a.request1 || 0) + (a.request2 || 0);
  }
  const percentAds4 =
    tongKW4 > 0
      ? Number(((totalAdsKW4 / (tongKW4 * exchangeRate)) * 100).toFixed(2))
      : 0;

  // Bảng Tổng - optimized single pass
  let daThanhToanKW = 0,
    chuaThanhToanKW = 0;
  for (let i = 0; i < filteredOrdersByArea.length; i++) {
    const o = filteredOrdersByArea[i];
    const revenue = o.revenue || 0;
    if (o.paymentStatus === "ĐÃ THANH TOÁN") daThanhToanKW += revenue;
    else if (o.paymentStatus === "CHƯA THANH TOÁN" || o.paymentStatus === "")
      chuaThanhToanKW += revenue;
  }
  const tongKW = daThanhToanKW + chuaThanhToanKW;
  const thanhToanDat = tongKW > 0 ? (daThanhToanKW / tongKW) * 100 : 0;
  let totalAdsKW = 0;
  for (let i = 0; i < filteredAdsByArea2.length; i++) {
    const a = filteredAdsByArea2[i];
    totalAdsKW += (a.request1 || 0) + (a.request2 || 0);
  }
  const percentAds =
    tongKW > 0
      ? Number(((totalAdsKW / (tongKW * exchangeRate)) * 100).toFixed(2))
      : 0;

  let daThanhToanKWSALE = 0,
    chuaThanhToanKWSALE = 0;
  for (let i = 0; i < filteredOrdersByArea.length; i++) {
    const o = filteredOrdersByArea[i];
    const profit = o.profit || 0;
    if (o.paymentStatus === "ĐÃ THANH TOÁN") daThanhToanKWSALE += profit;
    else if (o.paymentStatus === "CHƯA THANH TOÁN" || o.paymentStatus === "")
      chuaThanhToanKWSALE += profit;
  }
  const tongKWSALE = daThanhToanKWSALE + chuaThanhToanKWSALE;
  const thanhToanDatSALE =
    tongKWSALE > 0 ? (daThanhToanKWSALE / tongKWSALE) * 100 : 0;
  let totalAdsKWSALE = 0;
  for (let i = 0; i < filteredAdsByArea2.length; i++) {
    const a = filteredAdsByArea2[i];
    totalAdsKWSALE += (a.request1 || 0) + (a.request2 || 0);
  }
  const percentAdsSALE =
    tongKWSALE > 0
      ? Number(
          ((totalAdsKWSALE / (tongKWSALE * exchangeRate)) * 100).toFixed(2),
        )
      : 0;

  if (
    isTeamLead ||
    (currentUser.position === "admin" && selectedTeam) ||
    (currentUser.position === "managerMKT" && selectedTeam)
  ) {
    const teamEmployeeNames = mktEmployees
      .filter(
        (emp) =>
          emp.team_id === currentUser.team_id ||
          (currentUser.team_id === "SON" &&
            ((emp.name || "").trim() === "Nguyễn Thị Xuân Diệu" ||
              (emp.name || "").trim() === "Nguyễn Bá Quân")),
        //      ||
        // (currentUser.team_id === "LE" &&
        //   (emp.name || "").trim() === "Bùi Văn Phi")
      )
      .map((emp) => (emp.name || "").trim().toLowerCase());

    // Lọc các đơn hàng theo tên nhân viên thuộc team
    filteredOrders = filteredOrdersByArea.filter(
      (order) =>
        (order.mkt || "").trim().toLowerCase() &&
        teamEmployeeNames.includes((order.mkt || "").trim().toLowerCase()),
    );

    // Lọc chi phí ads theo tên nhân viên thuộc team
    filteredAds = filteredAds.filter(
      (ad) =>
        (ad.name || "").trim().toLowerCase() &&
        teamEmployeeNames.includes((ad.name || "").trim().toLowerCase()),
    );
  }

  // Bảng Tổng chỉ của các thành viên trong team - optimized
  let daThanhToanKW2 = 0,
    chuaThanhToanKW2 = 0;
  for (let i = 0; i < filteredOrdersByArea.length; i++) {
    const o = filteredOrdersByArea[i];
    const profit = o.profit || 0;
    if (o.paymentStatus === "ĐÃ THANH TOÁN") daThanhToanKW2 += profit;
    else if (o.paymentStatus === "CHƯA THANH TOÁN" || o.paymentStatus === "")
      chuaThanhToanKW2 += profit;
  }
  const tongKW2 = daThanhToanKW2 + chuaThanhToanKW2;
  const thanhToanDat2 = tongKW2 > 0 ? (daThanhToanKW2 / tongKW2) * 100 : 0;
  let totalAdsKW2 = 0;
  for (let i = 0; i < filteredAds.length; i++) {
    const a = filteredAds[i];
    totalAdsKW2 += (a.request1 || 0) + (a.request2 || 0);
  }
  const percentAds2 =
    tongKW2 > 0
      ? Number(((totalAdsKW2 / (tongKW2 * exchangeRate)) * 100).toFixed(2))
      : 0;
  const totalData = [
    {
      key: "VND",
      daThanhToan: daThanhToanKW * exchangeRate,
      chuaThanhToan: chuaThanhToanKW * exchangeRate,
      tong: tongKW * exchangeRate,
      thanhToanDat: thanhToanDat,
      totalAds: totalAdsKW,
      percentAds: percentAds,
    },
  ];
  const totalDataSALE = [
    {
      key: "VND",
      daThanhToan: daThanhToanKWSALE * exchangeRate,
      chuaThanhToan: chuaThanhToanKWSALE * exchangeRate,
      tong: tongKWSALE * exchangeRate,
      thanhToanDat: thanhToanDatSALE,
      totalAds: totalAdsKWSALE,
      percentAds: percentAdsSALE,
    },
  ];
  const totalData2 = [
    // {
    //   key: "KW",
    //   // daThanhToan: daThanhToanKW2*0.95,
    //   // chuaThanhToan: chuaThanhToanKW2*0.95,
    //   tong: tongKW2*0.95,
    //   // thanhToanDat: thanhToanDat2,
    //   totalAds: totalAdsKW2,
    //   percentAds: percentAds2
    // },
    {
      key: "VND",
      // daThanhToan: daThanhToanKW2*0.95 * exchangeRate,
      // chuaThanhToan: chuaThanhToanKW2*0.95 * exchangeRate,
      tong: tongKW2 * 0.95 * exchangeRate,
      // thanhToanDat: thanhToanDat2,
      totalAds: totalAdsKW2,
      percentAds: percentAds2,
    },
  ];
  const totalData3 = [
    {
      key: "VND",

      tong: tongKW3 * exchangeRate,

      totalAds: totalAdsKW3,
      percentAds: percentAds3,
    },
  ];
  const totalData4 = [
    {
      key: "VND",

      tong: tongKW4 * exchangeRate,

      totalAds: totalAdsKW4,
      percentAds: percentAds4,
    },
  ];

  const totalColumns = [
    {
      title: "Đã thanh toán",
      dataIndex: "daThanhToan",
      key: "daThanhToán",
      render: (value) => value.toLocaleString(),
    },
    {
      title: "Chưa thanh toán",
      dataIndex: "chuaThanhToan",
      key: "chuaThanhToán",
      render: (value) => value.toLocaleString(),
    },
    {
      title: "Tổng",
      dataIndex: "tong",
      key: "tong",
      render: (value) => {
        return (
          <div>
            <strong>{value.toLocaleString()}</strong>
          </div>
        );
      },
    },
    {
      title: "Thanh toán đạt",
      dataIndex: "thanhToanDat",
      key: "thanhToanDat",
      render: (percent) => {
        let bgColor;
        if (percent > 80) {
          bgColor = "#54DA1F"; // nền xanh lá (màu xanh nhạt)
        } else if (percent >= 50 && percent <= 80) {
          bgColor = "#FF9501"; // nền vàng nhạt (đã sửa lỗi ## thành #)
        } else {
          bgColor = "#F999A8"; // nền đỏ nhạt
        }
        return (
          <div
            style={{
              backgroundColor: bgColor,
              padding: "4px 8px",
              borderRadius: "4px",
              textAlign: "center",
              fontWeight: "bold",
            }}
          >
            {percent.toFixed(2)}%
          </div>
        );
      },
    },
  ];
  const totalColumns3 = [
    {
      title: "Tổng chi phí ads",
      dataIndex: "totalAds",
      key: "totalAds",
      render: (value) => value.toLocaleString(),
    },
    {
      title: "Tổng",
      dataIndex: "tong",
      key: "tong",
      render: (value) => {
        return (
          <div>
            <strong>{value.toLocaleString()}</strong>
          </div>
        );
      },
    },
    {
      title: "% chi phí ads",
      dataIndex: "percentAds",
      key: "percentAds",
      render: (percent) => {
        let bgColor;
        if (percent < 30) {
          bgColor = "#54DA1F"; // nền xanh lá (màu xanh nhạt)
        } else if (percent >= 30 && percent <= 35) {
          bgColor = "#FF9501"; // nền vàng nhạt (đã sửa lỗi ## thành #)
        } else {
          bgColor = "#F999A8"; // nền đỏ nhạt
        }
        return (
          <div
            style={{
              backgroundColor: bgColor,
              padding: "4px 8px",
              borderRadius: "4px",
              textAlign: "center",
              fontWeight: "bold",
            }}
          >
            {percent.toFixed(2)}%
          </div>
        );
      },
    },
  ];
  const totalSangSom = saleDailyData.reduce(
    (sum, item) => sum + item.sangSom,
    0,
  );
  const totalHanhChinh = saleDailyData.reduce(
    (sum, item) => sum + item.hanhChinh,
    0,
  );
  const totalToi = saleDailyData.reduce((sum, item) => sum + item.toi, 0);
  const totalSale = totalSangSom + totalHanhChinh + totalToi;

  const salePieData =
    totalSale > 0
      ? [
          {
            name: "Sáng sớm",
            profit: Number(((totalSangSom / totalSale) * 100).toFixed(2)),
          },
          {
            name: "Hành chính",
            profit: Number(((totalHanhChinh / totalSale) * 100).toFixed(2)),
          },
          {
            name: "Tối",
            profit: Number(((totalToi / totalSale) * 100).toFixed(2)),
          },
        ]
      : [
          { name: "Sáng sớm", profit: 0 },
          { name: "Hành chính", profit: 0 },
          { name: "Tối", profit: 0 },
        ];

  const renderSaleDashboard = ({
    operationTitle = "Báo cáo Doanh Số Nhân Viên Sale Vận Đơn",
    showDailyTrend = false,
  } = {}) => {
    const shiftSummary = [
      {
        label: "Sáng sớm",
        value: totalSangSom,
        percent: totalSale > 0 ? (totalSangSom / totalSale) * 100 : 0,
        tone: "morning",
      },
      {
        label: "Hành chính",
        value: totalHanhChinh,
        percent: totalSale > 0 ? (totalHanhChinh / totalSale) * 100 : 0,
        tone: "office",
      },
      {
        label: "Tối",
        value: totalToi,
        percent: totalSale > 0 ? (totalToi / totalSale) * 100 : 0,
        tone: "evening",
      },
    ];
    const emptyText = "Chưa có dữ liệu trong khoảng thời gian này";
    const rankRowClassName = (_, index) =>
      index < 3 ? `sale-rank-row sale-rank-row-${index + 1}` : "";

    return (
      <div className="sale-dashboard">
        <section className="sale-panel sale-panel--chart">
          <div className="sale-panel-heading">
            <span className="sale-panel-icon sale-panel-icon--blue">
              <BarChart3 size={20} />
            </span>
            <div className="sale-panel-heading-copy">
              <span className="sale-panel-kicker">TỔNG QUAN SALE</span>
              <h3>Doanh số Nhân viên SALE</h3>
              <p>So sánh hiệu suất doanh số giữa các thành viên</p>
            </div>
          </div>
          <div className="sale-employee-chart">
            <GroupedDoubleBarChartComponent2 data={employeeChartDataNewsale} />
          </div>
        </section>

        <div className="sale-report-grid">
          <section className="sale-panel sale-panel--daily card-sale-daily">
            <div className="sale-panel-heading">
              <span className="sale-panel-icon sale-panel-icon--blue">
                <CalendarDays size={20} />
              </span>
              <div className="sale-panel-heading-copy">
                <span className="sale-panel-kicker">HIỆU SUẤT THEO NGÀY</span>
                <h3>Báo cáo doanh số ngày</h3>
                <p>Chi tiết doanh số và tỷ trọng của từng ca làm việc</p>
              </div>
              <span className="sale-panel-count">
                {saleDailyData.length} ngày
              </span>
            </div>
            <Table
              className="sale-report-table sale-report-table--daily"
              columns={dailySaleColumns}
              dataSource={[...saleDailyData].sort(
                (a, b) => new Date(b.date) - new Date(a.date),
              )}
              pagination={{
                pageSize: 7,
                showSizeChanger: false,
                hideOnSinglePage: true,
              }}
              locale={{ emptyText }}
              scroll={{ x: 1180 }}
              size="middle"
            />
          </section>

          <section className="sale-panel sale-panel--shift card-sale-shift">
            <div className="sale-panel-heading">
              <span className="sale-panel-icon sale-panel-icon--violet">
                <Clock3 size={20} />
              </span>
              <div className="sale-panel-heading-copy">
                <span className="sale-panel-kicker">CƠ CẤU CA LÀM VIỆC</span>
                <h3>Tỷ lệ doanh số theo ca</h3>
                <p>Phân bổ doanh số trong khoảng thời gian đã chọn</p>
              </div>
            </div>
            <div className="sale-shift-chart">
              <PieChartComponent data={salePieData} variant="saleShift" />
            </div>
            <div className="sale-shift-summary">
              {shiftSummary.map((shift) => (
                <div
                  className={`sale-shift-item sale-shift-item--${shift.tone}`}
                  key={shift.label}
                >
                  <span className="sale-shift-dot" />
                  <div>
                    <span>{shift.label}</span>
                    <strong>{shift.value.toLocaleString("vi-VN")}</strong>
                  </div>
                  <b>{shift.percent.toFixed(1)}%</b>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="sale-employee-grid">
          <section className="sale-panel sale-panel--employee card-sale-employee">
            <div className="sale-panel-heading">
              <span className="sale-panel-icon sale-panel-icon--teal">
                <PackageCheck size={20} />
              </span>
              <div className="sale-panel-heading-copy">
                <span className="sale-panel-kicker">VẬN HÀNH ĐƠN HÀNG</span>
                <h3>{operationTitle}</h3>
                <p>Doanh số, thanh toán và tỷ lệ thu tiền của từng nhân viên</p>
              </div>
              <span className="sale-panel-count">
                {saleReportDataXL.length} nhân viên
              </span>
            </div>
            <Table
              className="sale-report-table sale-report-table--operation"
              columns={saleColumns}
              dataSource={saleReportDataXL}
              pagination={false}
              locale={{ emptyText }}
              scroll={{ x: 832 }}
              rowClassName={rankRowClassName}
              size="middle"
            />
          </section>

          <section className="sale-panel sale-panel--employee card-sale-employee-ol">
            <div className="sale-panel-heading">
              <span className="sale-panel-icon sale-panel-icon--violet">
                <Headphones size={20} />
              </span>
              <div className="sale-panel-heading-copy">
                <span className="sale-panel-kicker">KÊNH TRỰC TUYẾN</span>
                <h3>Báo cáo Doanh Số Nhân Viên Sale ONLINE</h3>
                <p>Tổng doanh số quy đổi theo từng nhân viên trực tuyến</p>
              </div>
              <span className="sale-panel-count">
                {saleReportDataOL.length} nhân viên
              </span>
            </div>
            <Table
              className="sale-report-table sale-report-table--compact"
              columns={saleColumnsOLND}
              dataSource={saleReportDataOL}
              pagination={false}
              locale={{ emptyText }}
              scroll={{ x: 452 }}
              rowClassName={rankRowClassName}
              size="middle"
            />
          </section>

          <section className="sale-panel sale-panel--employee card-sale-employee-nd">
            <div className="sale-panel-heading">
              <span className="sale-panel-icon sale-panel-icon--amber">
                <ShoppingBag size={20} />
              </span>
              <div className="sale-panel-heading-copy">
                <span className="sale-panel-kicker">NHẬP ĐƠN</span>
                <h3>Báo cáo Doanh Số Nhân Viên Sale NHẬP ĐƠN</h3>
                <p>Theo dõi tổng doanh số của đội ngũ nhập đơn</p>
              </div>
              <span className="sale-panel-count">
                {saleReportDataND.length} nhân viên
              </span>
            </div>
            <Table
              className="sale-report-table sale-report-table--compact"
              columns={saleColumnsOLND}
              dataSource={saleReportDataND}
              pagination={false}
              locale={{ emptyText }}
              scroll={{ x: 452 }}
              rowClassName={rankRowClassName}
              size="middle"
            />
          </section>
        </div>

        {showDailyTrend && (
          <section className="sale-panel sale-panel--chart">
            <div className="sale-panel-heading">
              <span className="sale-panel-icon sale-panel-icon--teal">
                <UsersRound size={20} />
              </span>
              <div className="sale-panel-heading-copy">
                <span className="sale-panel-kicker">XU HƯỚNG DOANH SỐ</span>
                <h3>Doanh số hàng ngày</h3>
              </div>
            </div>
            <GroupedDoubleBarChartComponent data={dailyChartDataNew} />
          </section>
        )}
      </div>
    );
  };

  // Tạo ngày hôm nay
  const todayDate = new Date().toISOString().split("T")[0];

  // Lọc các nhân viên có position là salenhapdon
  const salenhapdonEmployees = filteredEmployeesByArea.filter(
    (emp) => emp.position === "salenhapdon" && emp.quocgia === "kr",
  );

  // Tính tổng số đơn hôm nay của từng salenhapdon
  const salenhapdonOrderCounts = salenhapdonEmployees.map((emp) => {
    const count = orders.filter(
      (order) =>
        order.sale?.trim().toLowerCase() === emp.name.trim().toLowerCase() &&
        order.orderDate === todayDate,
    ).length;
    return {
      name: emp.name,
      orderCount: count,
    };
  });

  // Sắp xếp giảm dần và lấy top 3
  const top3SalenhapdonToday = salenhapdonOrderCounts
    .sort((a, b) => b.orderCount - a.orderCount)
    .slice(0, 3);

  const calcMarketSummary = (ordersMarket, rate) => {
    const now = new Date();

    // Hôm nay: từ 00:00 đến thời điểm hiện tại
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const todayNow = now;

    const totalToday = ordersMarket
      .filter((order) => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= todayStart && orderDate <= todayNow;
      })
      .reduce((sum, order) => sum + (order.revenue || 0) * rate, 0);

    // Hôm qua: từ 00:00 hôm qua → đến đúng giờ hiện tại hôm nay
    const yesterdayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 1,
    );

    const yesterdaySameTime = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 1,
      now.getHours(),
      now.getMinutes(),
      now.getSeconds(),
    );

    const totalYesterday = ordersMarket
      .filter((order) => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= yesterdayStart && orderDate <= yesterdaySameTime;
      })
      .reduce((sum, order) => sum + (order.revenue || 0) * rate, 0);

    const percent =
      totalYesterday > 0 ? ((totalToday / totalYesterday) * 100).toFixed(2) : 0;

    return { totalToday, totalYesterday, percent };
  };

  const KR = calcMarketSummary(ordersKR, 17000);
  const JP = calcMarketSummary(ordersJP, 6000);
  const TW = calcMarketSummary(ordersTW, 750);
  const summaryKR = [
    {
      key: "1",
      today: KR.totalToday.toLocaleString("vi-VN") + " VNĐ",
      yesterday: KR.totalYesterday.toLocaleString("vi-VN") + " VNĐ",
      percent: KR.percent + "%",
    },
  ];

  const summaryJP = [
    {
      key: "1",
      today: JP.totalToday.toLocaleString("vi-VN") + " VNĐ",
      yesterday: JP.totalYesterday.toLocaleString("vi-VN") + " VNĐ",
      percent: JP.percent + "%",
    },
  ];

  const summaryTW = [
    {
      key: "1",
      today: TW.totalToday.toLocaleString("vi-VN") + " VNĐ",
      yesterday: TW.totalYesterday.toLocaleString("vi-VN") + " VNĐ",
      percent: TW.percent + "%",
    },
  ];
  const now = new Date();

  // ===== Hôm nay =====
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayNow = now;

  const totalTodayMKT = filteredOrdersByArea
    .filter((order) => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= todayStart && orderDate <= todayNow;
    })
    .reduce((sum, order) => sum + (order.revenue || 0), 0);

  // ===== Hôm qua =====
  const yesterdayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - 1,
  );

  const yesterdaySameTime = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - 1,
    now.getHours(),
    now.getMinutes(),
    now.getSeconds(),
  );

  const totalYesterdayMKT = filteredOrdersByArea
    .filter((order) => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= yesterdayStart && orderDate <= yesterdaySameTime;
    })
    .reduce((sum, order) => sum + (order.revenue || 0), 0);

  // ===== % hôm nay vs hôm qua =====
  const percentMKT =
    totalYesterdayMKT > 0
      ? ((totalTodayMKT / totalYesterdayMKT) * 100).toFixed(2)
      : 0;

  // ===== Summary cho bảng =====

  // ===== Summary cho bảng =====
  const summaryMKT = [
    {
      key: "1",
      today: totalTodayMKT.toLocaleString("vi-VN") + " VNĐ",
      yesterday: totalYesterdayMKT.toLocaleString("vi-VN") + " VNĐ",
      percent: percentMKT + "%",
    },
  ];

  const summaryColumns = [
    {
      title: "Doanh số hôm nay",
      dataIndex: "today",
      key: "today",
      align: "center",
      render: (text) => (
        <span style={{ fontWeight: "bold", color: "#1890ff" }}>{text}</span>
      ),
    },
    {
      title: "Doanh số hôm qua",
      dataIndex: "yesterday",
      key: "yesterday",
      align: "center",
      render: (text) => (
        <span style={{ fontWeight: "bold", color: "#52c41a" }}>{text}</span>
      ),
    },
    {
      title: "Hôm nay đạt (%)",
      dataIndex: "percent",
      key: "percent",
      align: "center",
      render: (value) => {
        const percent = parseFloat(value);

        // Tính chênh lệch so với 100%
        const diff = percent - 100;
        const sign = diff >= 0 ? "+" : ""; // hiển thị dấu + nếu >=0
        const displayText = `${sign}${diff.toFixed(2)}%`;

        let bgColor;
        if (percent > 100) {
          bgColor = "#54DA1F"; // xanh lá khi vượt hôm qua
        } else if (percent >= 80 && percent <= 100) {
          bgColor = "#FF9501"; // vàng khi gần bằng hôm qua
        } else {
          bgColor = "#F999A8"; // đỏ khi thấp hơn nhiều
        }

        return (
          <div
            style={{
              backgroundColor: bgColor,
              padding: "10px 14px",
              borderRadius: "6px",
              textAlign: "center",
              fontWeight: "bold",
              fontSize: "20px",
              color: "#0e0c0cff",
              minWidth: "120px",
            }}
          >
            {displayText}
          </div>
        );
      },
    },
  ];
  const DONE_REPORTS = ["DONE", "BOOK TB"];
  const DONE_REPORTS2 = ["BOOK TB"];
  const SENT_DELIVERY_STATUS = ["GIAO THÀNH CÔNG", "ĐÃ GỬI HÀNG"];

  const shippingReport = useMemo(() => {
    if (!filteredOrdersByArea0mkt?.length) return null;

    let A = 0;
    let B = 0;
    let E = 0;

    for (const o of filteredOrdersByArea0mkt) {
      const isDone = DONE_REPORTS.includes(o.saleReport);
      const isSent = isDone && SENT_DELIVERY_STATUS.includes(o.deliveryStatus);
      const isSent2 = DONE_REPORTS2.includes(o.saleReport);

      if (isDone) A++;
      if (isSent) B++;
      if (isSent2) E++;
    }

    const C = filteredOrdersByArea0mkt.length;
    const notSent = A - B - E;

    return {
      key: 1,
      C,
      A,
      B,
      notSent,
      percentDoneText: C ? ((A / C) * 100).toFixed(2) + "%" : "0%",
      percentSentText: A ? (((B + E) / A) * 100).toFixed(2) + "%" : "0%",
      percentNotSentText: A ? ((notSent / A) * 100).toFixed(2) + "%" : "0%",
    };
  }, [filteredOrdersByArea0mkt]);

  const columns = useMemo(
    () => [
      { title: "Tổng đơn (C)", dataIndex: "C" },
      { title: "Đơn DONE (A)", dataIndex: "A" },
      { title: "Đã gửi (B)", dataIndex: "B" },
      { title: "Chưa gửi (A-B)", dataIndex: "notSent" },
      {
        title: "% DONE",
        dataIndex: "percentDoneText",
        render: (t) => <Tag color="green">{t}</Tag>,
      },
      {
        title: "% ĐÃ GỬI",
        dataIndex: "percentSentText",
        render: (t) => <Tag color="blue">{t}</Tag>,
      },
      {
        title: "% CHƯA GỬI",
        dataIndex: "percentNotSentText",
        render: (t) => <Tag color="red">{t}</Tag>,
      },
    ],
    [],
  );
  return (
    <div
      style={{
        transform: "scale(0.85)",
        transformOrigin: "top left",
        width: "115%", // Để bù lại không gian khi scale
      }}
    >
      {/* <PraiseBanner top5Employees={top1Employees} /> */}

      {/* TOP ROW: Vinh danh (thu nhỏ + bình thường) + 3 bảng tổng hợp KR/MY/TW (chỉ khi Team = Tất cả) */}
      <div className={selectedTeam === "" ? "top-row" : ""}>
        {/* Luôn hiển thị phần Vinh danh, hiện "Đang tải..." khi chưa có dữ liệu */}
        <div
          className={`lb-wrap ${selectedTeam === "" ? "lb-wrap-all" : "lb-wrap-sm"}`}
        >
          <div className="lb-sub">
            🏆 Vinh danh hôm nay ·{" "}
            <span id="lb-date">
              {new Date().getDate().toString().padStart(2, "0")}/
              {new Date().getMonth() + 1}/{new Date().getFullYear()}
            </span>
          </div>
          {top5Employees.length > 0 && selectedTeam !== "" && (
            <div className="lb-hl">
              {top5Employees[0].totalToday * 1 * 0.95 >= 15000000 ? (
                <span>
                  Đội ngũ bùng nổ — <span>{top5Employees[0].name}!</span>
                </span>
              ) : (
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>
                  Hãy cố lên — chưa ai đạt 15 triệu hôm nay!
                </span>
              )}
            </div>
          )}
          {top5Employees.length === 0 ? (
            // === Loading state ===
            <div
              className="lb-list"
              style={{
                justifyContent: "center",
                alignItems: "center",
                minHeight: 120,
              }}
            >
              <div
                style={{
                  color: "rgba(255,255,255,0.7)",
                  fontSize: 14,
                  textAlign: "center",
                }}
              >
                Đang tải dữ liệu...
              </div>
            </div>
          ) : selectedTeam === "" ? (
            // === Layout Tất cả: cup trái · avatar · tên+vị trí giữa · số đơn phải ===
            <div className="lb-list">
              {top5Employees.slice(0, 3).map((emp, index) => {
                const ranks = ["r1", "r2", "r3"];
                const tops = ["TOP 1", "TOP 2", "TOP 3"];
                const cups = ["🥇", "🥈", "🥉"];
                return (
                  <div key={index} className={`lb-row ${ranks[index]}`}>
                    <div className={`lb-row-rank ${ranks[index]}`}>
                      <span className="lb-row-cup">{cups[index]}</span>
                    </div>
                    <img
                      src={`/${emp.name.trim()}.jpg`}
                      alt={emp.name.trim()}
                      className={`lb-row-av ${ranks[index]}`}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "/ngockem.jpg";
                      }}
                    />
                    <div className="lb-row-info">
                      <div className="lb-row-name">{emp.name}</div>
                      <div className={`lb-row-tag ${ranks[index]}`}>
                        {tops[index]}
                      </div>
                    </div>
                    <div className="lb-row-count">
                      <div className={`lb-row-count-num ${ranks[index]}`}>
                        {emp.orderCountToday || 0}
                      </div>
                      <div className="lb-row-count-lbl">Số đơn</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="lb-grid">
              {top5Employees.slice(0, 3).map((emp, index) => {
                const medals = ["🥇", "🥈", "🥉"];
                const ranks = ["r1", "r2", ""];
                const badges = ["bg-gold", "bg-silver", "bg-bronze"];
                const tops = ["TOP 1", "TOP 2", "TOP 3"];
                const showDs = emp.totalToday * 1 * 0.95 >= 15000000;
                return (
                  <div key={index} className={`lb-card ${ranks[index] || ""}`}>
                    <div className="lb-rank">{medals[index]}</div>
                    <img
                      src={`/${emp.name.trim()}.jpg`}
                      alt={emp.name.trim()}
                      className={`lb-av ${ranks[index] || ""}`}
                      style={{
                        width: 54,
                        height: 54,
                        borderRadius: "50%",
                        objectFit: "cover",
                      }}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "/ngockem.jpg";
                      }}
                    />
                    <div className="lb-name">{emp.name}</div>
                    <div className={`lb-badge ${badges[index]}`}>
                      {tops[index]}
                    </div>
                    {showDs && (
                      <div className="lb-stat">
                        <strong>
                          {(emp.totalToday * 1 * 0.95).toLocaleString("vi-VN")}{" "}
                          VNĐ
                        </strong>
                        DS hôm nay
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bảng Top 10 doanh thu hôm nay */}
        <div className="lb-top10-card">
          <div className="lb-top10-header">📊 Top 10 doanh thu hôm nay</div>
          <div className="lb-top10-body">
            <div className="lb-top10-row lb-top10-row-head">
              <div className="lb-top10-rank">#</div>
              <div className="lb-top10-name">Nhân viên</div>
              <div className="lb-top10-team">Team</div>
              <div className="lb-top10-ds">Doanh thu</div>
              <div className="lb-top10-count">Đơn</div>
            </div>
            {top10RevenueEmployees.length === 0 ? (
              <div className="lb-top10-empty">Chưa có dữ liệu</div>
            ) : (
              top10RevenueEmployees.map((emp, idx) => {
                const ds = Math.round((emp.totalToday || 0) * 1 * 0.95);
                const orderCount = emp.orderCountToday || 0;
                const medal =
                  idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : "";
                return (
                  <div
                    key={emp.name}
                    className={`lb-top10-row ${idx < 3 ? "lb-top10-row-podium" : ""}`}
                  >
                    <div className="lb-top10-rank">{medal || `${idx + 1}`}</div>
                    <div className="lb-top10-name">{emp.name}</div>
                    <div className="lb-top10-team">
                      {emp.team_name || emp.position_team || ""}
                    </div>
                    <div className="lb-top10-ds">
                      {ds.toLocaleString("vi-VN")} đ
                    </div>
                    <div className="lb-top10-count">{orderCount}</div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 3 bảng tổng hợp KR / MY / TW bên phải Vinh danh - chỉ hiện khi Team = Tất cả */}
        {selectedTeam === "" && (
          <div className="team-stats">
            <div className="team-stat-card">
              <div className="team-stat-left">
                <img
                  src="https://flagcdn.com/w80/kr.png"
                  alt="KR"
                  className="team-stat-flag"
                />
                <span className="team-stat-title">HÀN QUỐC</span>
              </div>
              <div className="team-stat-divider"></div>
              <div className="team-stat-cells">
                <div className="ts-cell">
                  <div className="ts-label">HÔM NAY</div>
                  <div className="ts-value ts-blue">
                    {summaryKR[0].today.replace(" VNĐ", "")}{" "}
                    <span className="ts-cur">VNĐ</span>
                  </div>
                </div>
                <div className="ts-divider-v"></div>
                <div className="ts-cell">
                  <div className="ts-label">HÔM QUA</div>
                  <div className="ts-value ts-green">
                    {summaryKR[0].yesterday.replace(" VNĐ", "")}{" "}
                    <span className="ts-cur">VNĐ</span>
                  </div>
                </div>
                <div className="ts-divider-v"></div>
                <div className="ts-cell ts-cell-pct">
                  {(() => {
                    const v = parseFloat(summaryKR[0].percent);
                    const diff = v - 100;
                    const sign = diff >= 0 ? "+" : "";
                    const txt = `${sign}${diff.toFixed(2)} %`;
                    let cls = "ts-badge-red";
                    if (v > 100) cls = "ts-badge-green";
                    else if (v >= 80) cls = "ts-badge-orange";
                    return <div className={`ts-badge ${cls}`}>{txt}</div>;
                  })()}
                </div>
              </div>
            </div>

            <div className="team-stat-card">
              <div className="team-stat-left">
                <img
                  src="https://flagcdn.com/w80/my.png"
                  alt="MY"
                  className="team-stat-flag"
                />
                <span className="team-stat-title">MALAYSIA</span>
              </div>
              <div className="team-stat-divider"></div>
              <div className="team-stat-cells">
                <div className="ts-cell">
                  <div className="ts-label">HÔM NAY</div>
                  <div className="ts-value ts-blue">
                    {summaryJP[0].today.replace(" VNĐ", "")}{" "}
                    <span className="ts-cur">VNĐ</span>
                  </div>
                </div>
                <div className="ts-divider-v"></div>
                <div className="ts-cell">
                  <div className="ts-label">HÔM QUA</div>
                  <div className="ts-value ts-green">
                    {summaryJP[0].yesterday.replace(" VNĐ", "")}{" "}
                    <span className="ts-cur">VNĐ</span>
                  </div>
                </div>
                <div className="ts-divider-v"></div>
                <div className="ts-cell ts-cell-pct">
                  {(() => {
                    const v = parseFloat(summaryJP[0].percent);
                    const diff = v - 100;
                    const sign = diff >= 0 ? "+" : "";
                    const txt = `${sign}${diff.toFixed(2)} %`;
                    let cls = "ts-badge-red";
                    if (v > 100) cls = "ts-badge-green";
                    else if (v >= 80) cls = "ts-badge-orange";
                    return <div className={`ts-badge ${cls}`}>{txt}</div>;
                  })()}
                </div>
              </div>
            </div>

            <div className="team-stat-card">
              <div className="team-stat-left">
                <img
                  src="https://flagcdn.com/w80/tw.png"
                  alt="TW"
                  className="team-stat-flag"
                />
                <span className="team-stat-title">ĐÀI LOAN</span>
              </div>
              <div className="team-stat-divider"></div>
              <div className="team-stat-cells">
                <div className="ts-cell">
                  <div className="ts-label">HÔM NAY</div>
                  <div className="ts-value ts-blue">
                    {summaryTW[0].today.replace(" VNĐ", "")}{" "}
                    <span className="ts-cur">VNĐ</span>
                  </div>
                </div>
                <div className="ts-divider-v"></div>
                <div className="ts-cell">
                  <div className="ts-label">HÔM QUA</div>
                  <div className="ts-value ts-green">
                    {summaryTW[0].yesterday.replace(" VNĐ", "")}{" "}
                    <span className="ts-cur">VNĐ</span>
                  </div>
                </div>
                <div className="ts-divider-v"></div>
                <div className="ts-cell ts-cell-pct">
                  {(() => {
                    const v = parseFloat(summaryTW[0].percent);
                    const diff = v - 100;
                    const sign = diff >= 0 ? "+" : "";
                    const txt = `${sign}${diff.toFixed(2)} %`;
                    let cls = "ts-badge-red";
                    if (v > 100) cls = "ts-badge-green";
                    else if (v >= 80) cls = "ts-badge-orange";
                    return <div className={`ts-badge ${cls}`}>{txt}</div>;
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* BỘ LỌC */}
      {(currentUser.position === "lead" ||
        (currentUser.position === "admin" && selectedTeam) ||
        (currentUser.position === "managerMKT" && selectedTeam)) && (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <div className="filter-bar-container">
                <div
                  className="lfbar"
                  style={{
                    flexWrap: "wrap",
                    justifyContent: "space-between",
                    rowGap: 12,
                  }}
                >
                  {/* Khu vực */}
                  <div className="ltab-g">
                    <div
                      className={`ltab ${selectedArea === "all" ? "on" : ""}`}
                      onClick={() => setSelectedArea("all")}
                    >
                      Tất cả
                    </div>
                    <div
                      className={`ltab ${selectedArea === "da" ? "on" : ""}`}
                      onClick={() => setSelectedArea("da")}
                    >
                      Đông Anh
                    </div>
                    <div
                      className={`ltab ${selectedArea === "pvd" ? "on" : ""}`}
                      onClick={() => setSelectedArea("pvd")}
                    >
                      Phạm Văn Đồng
                    </div>
                  </div>

                  {/* Ngày */}
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 500,
                        color: "var(--sub)",
                      }}
                    >
                      Ngày:
                    </span>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => {
                        setSelectedDate(e.target.value);
                        setSelectedPreset("");
                      }}
                    />
                  </div>

                  {/* Khoảng */}
                  <div className="ltab-g">
                    <div
                      className={`ltab ${selectedPreset === "today" ? "on" : ""}`}
                      onClick={() => {
                        setSelectedPreset("today");
                        setSelectedDate("");
                      }}
                    >
                      Hôm nay
                    </div>
                    <div
                      className={`ltab ${selectedPreset === "yesterday" ? "on" : ""}`}
                      onClick={() => {
                        setSelectedPreset("yesterday");
                        setSelectedDate("");
                      }}
                    >
                      Hôm qua
                    </div>
                    <div
                      className={`ltab ${selectedPreset === "week" ? "on" : ""}`}
                      onClick={() => {
                        setSelectedPreset("week");
                        setSelectedDate("");
                      }}
                    >
                      7 Ngày
                    </div>
                    <div
                      className={`ltab ${selectedPreset === "currentMonth" ? "on" : ""}`}
                      onClick={() => {
                        setSelectedPreset("currentMonth");
                        setSelectedDate("");
                      }}
                    >
                      Từ đầu tháng
                    </div>
                    <div
                      className={`ltab ${selectedPreset === "lastMonth" ? "on" : ""}`}
                      onClick={() => {
                        setSelectedPreset("lastMonth");
                        setSelectedDate("");
                      }}
                    >
                      Tháng trước
                    </div>
                    <div
                      className={`ltab ${selectedPreset === "twoMonthsAgo" ? "on" : ""}`}
                      onClick={() => {
                        setSelectedPreset("twoMonthsAgo");
                        setSelectedDate("");
                      }}
                    >
                      2 Tháng trước
                    </div>
                    <div
                      className={`ltab ${selectedPreset === "threeMonthsAgo" ? "on" : ""}`}
                      onClick={() => {
                        setSelectedPreset("threeMonthsAgo");
                        setSelectedDate("");
                      }}
                    >
                      3 Tháng trước
                    </div>
                  </div>

                  {/* Team - chỉ hiện khi cần */}
                  {(currentUser.position === "admin" ||
                    currentUser.position === "managerMKT" ||
                    (currentUser.position === "lead" &&
                      [6518, 4365].includes(currentUser.employee_code))) && (
                    <div className="filter-team-select">
                      <span className="filter-label">Team:</span>
                      <select
                        className="team-native-select"
                        value={selectedTeam || ""}
                        onChange={(e) => setSelectedTeam(e.target.value)}
                      >
                        <option value="">Tất cả</option>
                        {currentUser.position === "lead" ? (
                          <>
                            {currentUser.employee_code === 6518 && (
                              <>
                                <option value="SON">TEAM SƠN</option>
                                <option value="QUAN">TEAM QUÂN</option>
                                <option value="DIEU">TEAM DIỆU</option>
                              </>
                            )}
                            {currentUser.employee_code === 4365 && (
                              <>
                                <option value="LE">TEAM LẺ</option>
                                <option value="PHI">TEAM PHI</option>
                              </>
                            )}
                          </>
                        ) : (
                          teams.map((team) => (
                            <option key={team.value} value={team.value}>
                              {team.label}
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </Col>
          </Row>
          <Row>
            <Col xs={24}>
              <div
                className="kpi-strip"
                style={{
                  gridTemplateColumns: "repeat(3, 1fr)",
                  marginBottom: 16,
                }}
              >
                <div className="kpi-card-grad grad-gold">
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div className="kpi-lbl" style={{ marginBottom: 0 }}>
                      <span>💰</span> Tổng chi phí ads
                    </div>
                    <div className="kpi-icon-box">💰</div>
                  </div>
                  <div className="kpi-val">
                    {Math.round(Number(totalAdsKW3 || 0)).toLocaleString(
                      "vi-VN",
                    )}
                    <span className="kpi-unit">đ</span>
                  </div>
                  <div className="kpi-sub">
                    Marketing — {selectedTeam || "Tất cả"}
                  </div>
                </div>
                <div className="kpi-card-grad grad-green">
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div className="kpi-lbl" style={{ marginBottom: 0 }}>
                      <span>📊</span> Tổng
                    </div>
                    <div className="kpi-icon-box">📊</div>
                  </div>
                  <div className="kpi-val">
                    {Math.round(Number(tongKW3 || 0)).toLocaleString("vi-VN")}
                    <span className="kpi-unit">đ</span>
                  </div>
                  <div className="kpi-sub">
                    <span className="up">▲</span> Doanh số —{" "}
                    {selectedTeam || "Tất cả"}
                  </div>
                  <div className="kpi-progress">
                    <div
                      className="kpi-progress-fill"
                      style={{ width: "100%" }}
                    />
                  </div>
                </div>
                <div className="kpi-card-grad grad-blue">
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div className="kpi-lbl" style={{ marginBottom: 0 }}>
                      <span>📈</span> % chi phí ads
                    </div>
                    <div
                      style={{
                        position: "relative",
                        width: 52,
                        height: 52,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: `conic-gradient(rgba(255,255,255,0.95) ${Math.min(Number(percentAds3 || 0) * 3.6, 360)}deg, rgba(255,255,255,0.2) 0deg)`,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                        border: "2px solid rgba(255,255,255,0.3)",
                      }}
                    >
                      <span
                        style={{
                          position: "relative",
                          zIndex: 1,
                          fontSize: 11,
                          fontWeight: 900,
                          color: "#1e40af",
                          textShadow: "none",
                        }}
                      >
                        {Number(percentAds3 || 0).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="kpi-val" style={{ marginTop: 4 }}>
                    {Number(percentAds3 || 0).toFixed(1)}%
                  </div>
                  <div className="kpi-sub">
                    <span className="kpi-badge">
                      {Number(percentAds3 || 0) > 45
                        ? "CẢNH BÁO"
                        : Number(percentAds3 || 0) > 30
                          ? "TRUNG BÌNH"
                          : "TỐT"}
                    </span>
                    Trên doanh số
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </>
      )}
      {((currentUser.position === "admin" && !selectedTeam) ||
        (currentUser.position === "managerMKT" && !selectedTeam) ||
        currentUser.position === "managerSALE" ||
        currentUser.position === "leadSALE") && (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <div className="filter-bar-container">
                <div
                  className="lfbar"
                  style={{
                    flexWrap: "wrap",
                    justifyContent: "space-between",
                    rowGap: 12,
                  }}
                >
                  {/* Ngày */}
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 500,
                        color: "var(--sub)",
                      }}
                    >
                      Ngày:
                    </span>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => {
                        setSelectedDate(e.target.value);
                        setSelectedPreset("");
                      }}
                    />
                  </div>

                  {/* Khoảng */}
                  <div className="ltab-g">
                    <div
                      className={`ltab ${selectedPreset === "today" ? "on" : ""}`}
                      onClick={() => {
                        setSelectedPreset("today");
                        setSelectedDate("");
                      }}
                    >
                      Hôm nay
                    </div>
                    <div
                      className={`ltab ${selectedPreset === "yesterday" ? "on" : ""}`}
                      onClick={() => {
                        setSelectedPreset("yesterday");
                        setSelectedDate("");
                      }}
                    >
                      Hôm qua
                    </div>
                    <div
                      className={`ltab ${selectedPreset === "week" ? "on" : ""}`}
                      onClick={() => {
                        setSelectedPreset("week");
                        setSelectedDate("");
                      }}
                    >
                      7 Ngày
                    </div>
                    <div
                      className={`ltab ${selectedPreset === "currentMonth" ? "on" : ""}`}
                      onClick={() => {
                        setSelectedPreset("currentMonth");
                        setSelectedDate("");
                      }}
                    >
                      Từ đầu tháng
                    </div>
                    <div
                      className={`ltab ${selectedPreset === "lastMonth" ? "on" : ""}`}
                      onClick={() => {
                        setSelectedPreset("lastMonth");
                        setSelectedDate("");
                      }}
                    >
                      Tháng trước
                    </div>
                    <div
                      className={`ltab ${selectedPreset === "twoMonthsAgo" ? "on" : ""}`}
                      onClick={() => {
                        setSelectedPreset("twoMonthsAgo");
                        setSelectedDate("");
                      }}
                    >
                      2 Tháng trước
                    </div>
                    <div
                      className={`ltab ${selectedPreset === "threeMonthsAgo" ? "on" : ""}`}
                      onClick={() => {
                        setSelectedPreset("threeMonthsAgo");
                        setSelectedDate("");
                      }}
                    >
                      3 Tháng trước
                    </div>
                  </div>

                  {/* Team tổng */}
                  <div className="filter-team-select">
                    <span className="filter-label">Team tổng:</span>
                    <select
                      className="team-native-select"
                      value={selectedTeamTong}
                      onChange={(e) => setSelectedTeamTong(e.target.value)}
                    >
                      <option value="all">Tất cả</option>
                      <option value="PHI">Team Phi</option>
                      <option value="DIEN">Team Diện</option>
                    </select>
                  </div>

                  {/* Team */}
                  <div className="filter-team-select">
                    <span className="filter-label">Team:</span>
                    <select
                      className="team-native-select"
                      value={selectedTeam || ""}
                      onChange={(e) => setSelectedTeam(e.target.value)}
                    >
                      <option value="">Tất cả</option>
                      {teams.map((team) => (
                        <option key={team.value} value={team.value}>
                          {team.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* MKT - giữ AntD Select vì có search */}
                  <div className="filter-team-select">
                    <span className="filter-label">MKT:</span>
                    <Select
                      showSearch
                      allowClear
                      placeholder="Chọn nhân viên MKT"
                      style={{ width: 250 }}
                      value={selectedMKT}
                      onChange={(value) => setSelectedMKT(value)}
                      options={filteredEmployeesByArea
                        .filter((emp) => emp.position_team === "mkt")
                        .map((emp) => ({
                          label: emp.name,
                          value: emp.name,
                        }))}
                    />
                  </div>
                </div>
              </div>
            </Col>
          </Row>
          <Row>
            <Col xs={24} md={24}>
              {/* <Card
                bordered={true}
                // style={{
                //   width: "50%", // nửa màn hình
                //   margin: "20px auto",
                //   borderRadius: "12px",
                //   boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                // }}
              >
                <Table
                  columns={summaryColumns}
                  dataSource={summaryData}
                  pagination={false}
                  bordered
                  size="middle"
                  style={{ borderRadius: "8px" }}
                />
              </Card> */}
              {selectedMKT ? (
                <>
                  <h3
                    style={{
                      marginBottom: 16,
                      fontSize: 18,
                      fontWeight: 700,
                      color: "#1e293b",
                    }}
                  >
                    📊 {selectedMKT}
                  </h3>
                  <style>{`
      .mkt-stat-card {
        border-radius: 16px;
        padding: 24px 20px;
        text-align: center;
        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        transition: all 0.3s ease;
        cursor: pointer;
        position: relative;
        overflow: hidden;
      }
      .mkt-stat-card::before {
        content: '';
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%);
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      .mkt-stat-card:hover::before {
        opacity: 1;
      }
      .mkt-stat-card:hover {
        transform: translateY(-6px) scale(1.02);
        box-shadow: 0 12px 30px rgba(0,0,0,0.18);
      }
      .mkt-stat-card-blue {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }
      .mkt-stat-card-blue .mkt-label { color: rgba(255,255,255,0.85); }
      .mkt-stat-card-blue .mkt-value { color: #ffffff; }
      .mkt-stat-card-green {
        background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
      }
      .mkt-stat-card-green .mkt-label { color: rgba(255,255,255,0.85); }
      .mkt-stat-card-green .mkt-value { color: #ffffff; }
      .mkt-stat-card-orange {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      }
      .mkt-stat-card-orange .mkt-label { color: rgba(255,255,255,0.85); }
      .mkt-stat-card-orange .mkt-value { color: #ffffff; }
      .mkt-stat-card-yellow {
        background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
      }
      .mkt-stat-card-yellow .mkt-label { color: rgba(255,255,255,0.85); }
      .mkt-stat-card-yellow .mkt-value { color: #ffffff; }
      .mkt-stat-card-cyan {
        background: linear-gradient(135deg, #0ba360 0%, #3cba92 100%);
      }
      .mkt-stat-card-cyan .mkt-label { color: rgba(255,255,255,0.85); }
      .mkt-stat-card-cyan .mkt-value { color: #ffffff; }
      .mkt-stat-card-red {
        background: linear-gradient(135deg, #eb3349 0%, #f45c43 100%);
      }
      .mkt-stat-card-red .mkt-label { color: rgba(255,255,255,0.85); }
      .mkt-stat-card-red .mkt-value { color: #ffffff; }
      .mkt-stat-card-purple {
        background: linear-gradient(135deg, #7f00ff 0%, #e100ff 100%);
      }
      .mkt-stat-card-purple .mkt-label { color: rgba(255,255,255,0.85); }
      .mkt-stat-card-purple .mkt-value { color: #ffffff; }
      .mkt-stat-card-teal {
        background: linear-gradient(135deg, #00c6ff 0%, #0072ff 100%);
      }
      .mkt-stat-card-teal .mkt-label { color: rgba(255,255,255,0.85); }
      .mkt-stat-card-teal .mkt-value { color: #ffffff; }
    `}</style>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(260px, 1fr))",
                      gap: 20,
                      marginBottom: 24,
                    }}
                  >
                    {/* Doanh số hôm nay */}
                    <div className="mkt-stat-card mkt-stat-card-blue">
                      <div
                        style={{
                          fontSize: 14,
                          marginBottom: 10,
                          fontWeight: 600,
                        }}
                        className="mkt-label"
                      >
                        📅 Doanh số hôm nay
                      </div>
                      <div
                        style={{ fontSize: 26, fontWeight: 800 }}
                        className="mkt-value"
                      >
                        {totalTodayMKT.toLocaleString("vi-VN")}{" "}
                        <span style={{ fontSize: 14 }}>VNĐ</span>
                      </div>
                    </div>

                    {/* Doanh số hôm qua */}
                    <div className="mkt-stat-card mkt-stat-card-green">
                      <div
                        style={{
                          fontSize: 14,
                          marginBottom: 10,
                          fontWeight: 600,
                        }}
                        className="mkt-label"
                      >
                        📆 Doanh số hôm qua
                      </div>
                      <div
                        style={{ fontSize: 26, fontWeight: 800 }}
                        className="mkt-value"
                      >
                        {totalYesterdayMKT.toLocaleString("vi-VN")}{" "}
                        <span style={{ fontSize: 14 }}>VNĐ</span>
                      </div>
                    </div>

                    {/* Hôm nay đạt (%) */}
                    <div
                      className={`mkt-stat-card ${Number(percentMKT) > 100 ? "mkt-stat-card-teal" : Number(percentMKT) >= 80 ? "mkt-stat-card-yellow" : "mkt-stat-card-red"}`}
                    >
                      <div
                        style={{
                          fontSize: 14,
                          marginBottom: 10,
                          fontWeight: 600,
                        }}
                        className="mkt-label"
                      >
                        🎯 Hôm nay đạt (%)
                      </div>
                      <div
                        style={{ fontSize: 32, fontWeight: 800 }}
                        className="mkt-value"
                      >
                        {(() => {
                          const pct = Number(percentMKT);
                          const diff = pct - 100;
                          const sign = diff >= 0 ? "+" : "";
                          return `${sign}${pct.toFixed(1)}%`;
                        })()}
                      </div>
                    </div>
                  </div>
                </>
              ) : selectedTeam !== "" ? (
                <>
                  <div className="team-stats" style={{ gap: 14 }}>
                    <div className="team-stat-card">
                      <div className="team-stat-left">
                        <img
                          src="https://flagcdn.com/w80/kr.png"
                          alt="KR"
                          className="team-stat-flag"
                        />
                        <span className="team-stat-title">HÀN QUỐC</span>
                      </div>
                      <div className="team-stat-divider"></div>
                      <div className="team-stat-cells">
                        <div className="ts-cell">
                          <div className="ts-label">HÔM NAY</div>
                          <div className="ts-value ts-blue">
                            {summaryKR[0].today.replace(" VNĐ", "")}{" "}
                            <span className="ts-cur">VNĐ</span>
                          </div>
                        </div>
                        <div className="ts-divider-v"></div>
                        <div className="ts-cell">
                          <div className="ts-label">HÔM QUA</div>
                          <div className="ts-value ts-green">
                            {summaryKR[0].yesterday.replace(" VNĐ", "")}{" "}
                            <span className="ts-cur">VNĐ</span>
                          </div>
                        </div>
                        <div className="ts-divider-v"></div>
                        <div className="ts-cell ts-cell-pct">
                          {(() => {
                            const v = parseFloat(summaryKR[0].percent);
                            const diff = v - 100;
                            const sign = diff >= 0 ? "+" : "";
                            const txt = `${sign}${diff.toFixed(2)} %`;
                            let cls = "ts-badge-red";
                            if (v > 100) cls = "ts-badge-green";
                            else if (v >= 80) cls = "ts-badge-orange";
                            return (
                              <div className={`ts-badge ${cls}`}>{txt}</div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>

                    <div className="team-stat-card">
                      <div className="team-stat-left">
                        <img
                          src="https://flagcdn.com/w80/my.png"
                          alt="MY"
                          className="team-stat-flag"
                        />
                        <span className="team-stat-title">MALAYSIA</span>
                      </div>
                      <div className="team-stat-divider"></div>
                      <div className="team-stat-cells">
                        <div className="ts-cell">
                          <div className="ts-label">HÔM NAY</div>
                          <div className="ts-value ts-blue">
                            {summaryJP[0].today.replace(" VNĐ", "")}{" "}
                            <span className="ts-cur">VNĐ</span>
                          </div>
                        </div>
                        <div className="ts-divider-v"></div>
                        <div className="ts-cell">
                          <div className="ts-label">HÔM QUA</div>
                          <div className="ts-value ts-green">
                            {summaryJP[0].yesterday.replace(" VNĐ", "")}{" "}
                            <span className="ts-cur">VNĐ</span>
                          </div>
                        </div>
                        <div className="ts-divider-v"></div>
                        <div className="ts-cell ts-cell-pct">
                          {(() => {
                            const v = parseFloat(summaryJP[0].percent);
                            const diff = v - 100;
                            const sign = diff >= 0 ? "+" : "";
                            const txt = `${sign}${diff.toFixed(2)} %`;
                            let cls = "ts-badge-red";
                            if (v > 100) cls = "ts-badge-green";
                            else if (v >= 80) cls = "ts-badge-orange";
                            return (
                              <div className={`ts-badge ${cls}`}>{txt}</div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>

                    <div className="team-stat-card">
                      <div className="team-stat-left">
                        <img
                          src="https://flagcdn.com/w80/tw.png"
                          alt="TW"
                          className="team-stat-flag"
                        />
                        <span className="team-stat-title">ĐÀI LOAN</span>
                      </div>
                      <div className="team-stat-divider"></div>
                      <div className="team-stat-cells">
                        <div className="ts-cell">
                          <div className="ts-label">HÔM NAY</div>
                          <div className="ts-value ts-blue">
                            {summaryTW[0].today.replace(" VNĐ", "")}{" "}
                            <span className="ts-cur">VNĐ</span>
                          </div>
                        </div>
                        <div className="ts-divider-v"></div>
                        <div className="ts-cell">
                          <div className="ts-label">HÔM QUA</div>
                          <div className="ts-value ts-green">
                            {summaryTW[0].yesterday.replace(" VNĐ", "")}{" "}
                            <span className="ts-cur">VNĐ</span>
                          </div>
                        </div>
                        <div className="ts-divider-v"></div>
                        <div className="ts-cell ts-cell-pct">
                          {(() => {
                            const v = parseFloat(summaryTW[0].percent);
                            const diff = v - 100;
                            const sign = diff >= 0 ? "+" : "";
                            const txt = `${sign}${diff.toFixed(2)} %`;
                            let cls = "ts-badge-red";
                            if (v > 100) cls = "ts-badge-green";
                            else if (v >= 80) cls = "ts-badge-orange";
                            return (
                              <div className={`ts-badge ${cls}`}>{txt}</div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : null}

              {/* === 5 bảng tổng hợp tài chính theo style card === */}
              <h2
                style={{
                  marginTop: "2rem",
                  marginBottom: 14,
                  fontSize: 18,
                  fontWeight: 800,
                  color: "#0f172a",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background:
                      "linear-gradient(135deg,#fef3c7 0%,#fde68a 100%)",
                    fontSize: 16,
                  }}
                >
                  💰
                </span>
                Tổng hợp tài chính
              </h2>
              <div className="fin-stats">
                {/* 1. Tổng khách thanh toán */}
                <div className="fin-stat-card">
                  <div className="fin-stat-head">
                    <div
                      className="fin-stat-icon"
                      style={{
                        background:
                          "linear-gradient(135deg,#f0fdf4 0%,#dcfce7 100%)",
                      }}
                    >
                      💳
                    </div>
                    <div>
                      <div className="fin-stat-title">
                        Tổng khách thanh toán
                      </div>
                      <div className="fin-stat-sub">
                        Doanh thu · {selectedArea || "Tất cả"}
                      </div>
                    </div>
                  </div>
                  <div className="fin-stat-rows">
                    <div className="fin-row">
                      <span className="fin-row-label">Đã thanh toán</span>
                      <span className="fin-row-value blue">
                        {Math.round(totalData[0].daThanhToan).toLocaleString()}{" "}
                        <span className="fin-row-cur">VNĐ</span>
                      </span>
                    </div>
                    <div className="fin-row">
                      <span className="fin-row-label">Chưa thanh toán</span>
                      <span className="fin-row-value red">
                        {Math.round(
                          totalData[0].chuaThanhToan,
                        ).toLocaleString()}{" "}
                        <span className="fin-row-cur">VNĐ</span>
                      </span>
                    </div>
                    <div className="fin-row">
                      <span className="fin-row-label">Tổng</span>
                      <span className="fin-row-value">
                        {Math.round(totalData[0].tong).toLocaleString()}{" "}
                        <span className="fin-row-cur">VNĐ</span>
                      </span>
                    </div>
                  </div>
                  <div className="fin-stat-foot">
                    <span className="fin-stat-foot-label">Thanh toán đạt</span>
                    <span
                      className={`fin-stat-pill ${totalData[0].thanhToanDat > 80 ? "good" : totalData[0].thanhToanDat >= 50 ? "warn" : "bad"}`}
                    >
                      {totalData[0].thanhToanDat.toFixed(2)}%
                    </span>
                  </div>
                </div>

                {/* 2. Doanh số SALE */}
                <div className="fin-stat-card">
                  <div className="fin-stat-head">
                    <div
                      className="fin-stat-icon"
                      style={{
                        background:
                          "linear-gradient(135deg,#eff6ff 0%,#dbeafe 100%)",
                      }}
                    >
                      🛒
                    </div>
                    <div>
                      <div className="fin-stat-title">Doanh số (SALE)</div>
                      <div className="fin-stat-sub">
                        Lợi nhuận · {selectedArea || "Tất cả"}
                      </div>
                    </div>
                  </div>
                  <div className="fin-stat-rows">
                    <div className="fin-row">
                      <span className="fin-row-label">Đã thanh toán</span>
                      <span className="fin-row-value blue">
                        {Math.round(
                          totalDataSALE[0].daThanhToan,
                        ).toLocaleString()}{" "}
                        <span className="fin-row-cur">VNĐ</span>
                      </span>
                    </div>
                    <div className="fin-row">
                      <span className="fin-row-label">Chưa thanh toán</span>
                      <span className="fin-row-value red">
                        {Math.round(
                          totalDataSALE[0].chuaThanhToan,
                        ).toLocaleString()}{" "}
                        <span className="fin-row-cur">VNĐ</span>
                      </span>
                    </div>
                    <div className="fin-row">
                      <span className="fin-row-label">Tổng</span>
                      <span className="fin-row-value">
                        {Math.round(totalDataSALE[0].tong).toLocaleString()}{" "}
                        <span className="fin-row-cur">VNĐ</span>
                      </span>
                    </div>
                  </div>
                  <div className="fin-stat-foot">
                    <span className="fin-stat-foot-label">Thanh toán đạt</span>
                    <span
                      className={`fin-stat-pill ${totalDataSALE[0].thanhToanDat > 80 ? "good" : totalDataSALE[0].thanhToanDat >= 50 ? "warn" : "bad"}`}
                    >
                      {totalDataSALE[0].thanhToanDat.toFixed(2)}%
                    </span>
                  </div>
                </div>

                {/* 3. Doanh Số MKT — chỉ admin / managerMKT */}
                {(currentUser.position === "admin" ||
                  currentUser.position === "managerMKT") && (
                  <div className="fin-stat-card">
                    <div className="fin-stat-head">
                      <div
                        className="fin-stat-icon"
                        style={{
                          background:
                            "linear-gradient(135deg,#fef3c7 0%,#fde68a 100%)",
                        }}
                      >
                        📣
                      </div>
                      <div>
                        <div className="fin-stat-title">Doanh số (MKT)</div>
                        <div className="fin-stat-sub">
                          Marketing · {selectedArea || "Tất cả"}
                        </div>
                      </div>
                    </div>
                    <div className="fin-stat-rows">
                      <div className="fin-row">
                        <span className="fin-row-label">Tổng doanh số</span>
                        <span className="fin-row-value blue">
                          {Math.round(totalData4[0].tong).toLocaleString()}{" "}
                          <span className="fin-row-cur">VNĐ</span>
                        </span>
                      </div>
                      <div className="fin-row">
                        <span className="fin-row-label">Tổng chi phí Ads</span>
                        <span className="fin-row-value">
                          {Math.round(totalData4[0].totalAds).toLocaleString()}{" "}
                          <span className="fin-row-cur">KRW</span>
                        </span>
                      </div>
                    </div>
                    <div className="fin-stat-foot">
                      <span className="fin-stat-foot-label">% Chi phí Ads</span>
                      <span
                        className={`fin-stat-pill ${totalData4[0].percentAds < 30 ? "good" : totalData4[0].percentAds <= 35 ? "warn" : "bad"}`}
                      >
                        {totalData4[0].percentAds.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                )}

                {/* 4. Thống kê đơn hàng — chỉ admin / managerMKT / managerSALE / leadSALE */}
                {(currentUser.position === "admin" ||
                  currentUser.position === "managerMKT" ||
                  currentUser.position === "managerSALE" ||
                  currentUser.position === "leadSALE") && (
                  <div className="fin-stat-card">
                    <div className="fin-stat-head">
                      <div
                        className="fin-stat-icon"
                        style={{
                          background:
                            "linear-gradient(135deg,#f3e8ff 0%,#e9d5ff 100%)",
                        }}
                      >
                        📦
                      </div>
                      <div>
                        <div className="fin-stat-title">Thống kê đơn hàng</div>
                        <div className="fin-stat-sub">
                          Vận đơn · {selectedArea || "Tất cả"}
                        </div>
                      </div>
                    </div>
                    {shippingReport ? (
                      <>
                        <div className="fin-stat-rows">
                          <div className="fin-row">
                            <span className="fin-row-label">Tổng đơn (C)</span>
                            <span className="fin-row-value">
                              {shippingReport.C.toLocaleString()}
                            </span>
                          </div>
                          <div className="fin-row">
                            <span className="fin-row-label">Đơn DONE (A)</span>
                            <span className="fin-row-value blue">
                              {shippingReport.A.toLocaleString()}
                            </span>
                          </div>
                          <div className="fin-row">
                            <span className="fin-row-label">Đã gửi (B)</span>
                            <span className="fin-row-value green">
                              {shippingReport.B.toLocaleString()}
                            </span>
                          </div>
                          <div className="fin-row">
                            <span className="fin-row-label">
                              Chưa gửi (A-B)
                            </span>
                            <span className="fin-row-value red">
                              {shippingReport.notSent.toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <div className="fin-stat-foot">
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 8,
                              width: "100%",
                            }}
                          >
                            <div
                              style={{ display: "flex", gap: 8, width: "100%" }}
                            >
                              <div
                                style={{
                                  flex: 1,
                                  background: "#dcfce7",
                                  borderRadius: 8,
                                  padding: "8px 12px",
                                  textAlign: "center",
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: 11,
                                    color: "#166534",
                                    marginBottom: 2,
                                  }}
                                >
                                  % DONE
                                </div>
                                <div
                                  style={{
                                    fontSize: 16,
                                    fontWeight: 700,
                                    color: "#166534",
                                  }}
                                >
                                  {shippingReport.percentDoneText}
                                </div>
                              </div>
                              <div
                                style={{
                                  flex: 1,
                                  background: "#dbeafe",
                                  borderRadius: 8,
                                  padding: "8px 12px",
                                  textAlign: "center",
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: 11,
                                    color: "#1e40af",
                                    marginBottom: 2,
                                  }}
                                >
                                  % ĐÃ GỬI
                                </div>
                                <div
                                  style={{
                                    fontSize: 16,
                                    fontWeight: 700,
                                    color: "#1e40af",
                                  }}
                                >
                                  {shippingReport.percentSentText}
                                </div>
                              </div>
                              <div
                                style={{
                                  flex: 1,
                                  background: "#fee2e2",
                                  borderRadius: 8,
                                  padding: "8px 12px",
                                  textAlign: "center",
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: 11,
                                    color: "#991b1b",
                                    marginBottom: 2,
                                  }}
                                >
                                  % CHƯA GỬI
                                </div>
                                <div
                                  style={{
                                    fontSize: 16,
                                    fontWeight: 700,
                                    color: "#991b1b",
                                  }}
                                >
                                  {shippingReport.percentNotSentText}
                                </div>
                              </div>
                            </div>
                            <div style={{ display: "flex", gap: 8 }}>
                              <div
                                style={{
                                  flex:
                                    Number(shippingReport.percentDoneText) || 0,
                                  height: 8,
                                  background: "#22c55e",
                                  borderRadius: 4,
                                  minWidth: 4,
                                }}
                              />
                              <div
                                style={{
                                  flex:
                                    Number(shippingReport.percentSentText) || 0,
                                  height: 8,
                                  background: "#3b82f6",
                                  borderRadius: 4,
                                  minWidth: 4,
                                }}
                              />
                              <div
                                style={{
                                  flex:
                                    Number(shippingReport.percentNotSentText) ||
                                    0,
                                  height: 8,
                                  background: "#ef4444",
                                  borderRadius: 4,
                                  minWidth: 4,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="fin-stat-empty">
                        Chưa có dữ liệu đơn hàng
                      </div>
                    )}
                  </div>
                )}

                {/* 5. Thống kê giục chuyển khoản */}
                <div className="fin-stat-card">
                  <div className="fin-stat-head">
                    <div
                      className="fin-stat-icon"
                      style={{
                        background:
                          "linear-gradient(135deg,#ffe4e6 0%,#fecaca 100%)",
                      }}
                    >
                      ⏰
                    </div>
                    <div>
                      <div className="fin-stat-title">Thống kê giục CK</div>
                      <div className="fin-stat-sub">
                        Đang chờ thanh toán · {selectedArea || "Tất cả"}
                      </div>
                    </div>
                  </div>
                  <div className="fin-stat-rows">
                    {transferData.map((r, idx) => (
                      <div className="fin-row" key={idx}>
                        <span className="fin-row-label">
                          <span className="fin-row-sub">{r.currency}</span>
                          Đã gửi
                        </span>
                        <span className="fin-row-value green">
                          {Number(r.daGuiHang).toLocaleString()}
                        </span>
                      </div>
                    ))}
                    {transferData.map((r, idx) => (
                      <div className="fin-row" key={"c-" + idx}>
                        <span className="fin-row-label">
                          <span className="fin-row-sub">{r.currency}</span>
                          Chưa gửi
                        </span>
                        <span className="fin-row-value red">
                          {Number(r.chuaGuiHang).toLocaleString()}
                        </span>
                      </div>
                    ))}
                    {transferData.map((r, idx) => (
                      <div className="fin-row" key={"t-" + idx}>
                        <span className="fin-row-label">
                          <span className="fin-row-sub">{r.currency}</span>
                          Tổng
                        </span>
                        <span className="fin-row-value">
                          {Number(r.tong).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </>
      )}
      <br></br>

      {(currentUser.position === "admin" && !selectedTeam) ||
      (currentUser.position === "managerMKT" && !selectedTeam) ||
      (currentUser.position === "managerSALE" && !selectedTeam)
        ? (() => {
            const mktTabContent = (
              <>
                {/* Bảng Tổng chi phí ads */}
                <div
                  className="kpi-strip"
                  style={{
                    gridTemplateColumns: "repeat(4, 1fr)",
                    marginBottom: 16,
                  }}
                >
                  <div className="kpi-card-grad grad-green">
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <div className="kpi-lbl" style={{ marginBottom: 0 }}>
                        <span>📊</span> Doanh số
                      </div>
                      <div className="kpi-icon-box">📊</div>
                    </div>
                    <div className="kpi-val">
                      {Math.round(Number(tongKW3 || 0)).toLocaleString("vi-VN")}
                      <span className="kpi-unit">đ</span>
                    </div>
                    <div className="kpi-sub">
                      <span className="up">▲</span> MKT —{" "}
                      {selectedTeam || "Tất cả"}
                    </div>
                    <div className="kpi-progress">
                      <div
                        className="kpi-progress-fill"
                        style={{ width: "100%" }}
                      />
                    </div>
                  </div>
                  <div className="kpi-card-grad grad-gold">
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <div className="kpi-lbl" style={{ marginBottom: 0 }}>
                        <span>💰</span> Chi phí Ads
                      </div>
                      <div className="kpi-icon-box">💰</div>
                    </div>
                    <div className="kpi-val">
                      {Math.round(Number(totalAdsKW3 || 0)).toLocaleString(
                        "vi-VN",
                      )}
                      <span className="kpi-unit">đ</span>
                    </div>
                    <div className="kpi-sub">
                      Marketing — {selectedTeam || "Tất cả"}
                    </div>
                  </div>
                  <div className="kpi-card-grad grad-blue">
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <div className="kpi-lbl" style={{ marginBottom: 0 }}>
                        <span>📈</span> % Chi phí Ads
                      </div>
                      <div
                        style={{
                          position: "relative",
                          width: 52,
                          height: 52,
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: `conic-gradient(rgba(255,255,255,0.95) ${Math.min(Number(percentAds3 || 0) * 3.6, 360)}deg, rgba(255,255,255,0.2) 0deg)`,
                          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                          border: "2px solid rgba(255,255,255,0.3)",
                        }}
                      >
                        <span
                          style={{
                            position: "relative",
                            zIndex: 1,
                            fontSize: 11,
                            fontWeight: 900,
                            color: "#1e40af",
                            textShadow: "none",
                          }}
                        >
                          {Number(percentAds3 || 0).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <div className="kpi-val" style={{ marginTop: 4 }}>
                      {Number(percentAds3 || 0).toFixed(1)}%
                    </div>
                    <div className="kpi-sub">
                      <span className="kpi-badge">
                        {Number(percentAds3 || 0) > 45
                          ? "CẢNH BÁO"
                          : Number(percentAds3 || 0) > 30
                            ? "TRUNG BÌNH"
                            : "TỐT"}
                      </span>
                      Trên doanh số
                    </div>
                  </div>
                  <div className="kpi-card-grad grad-purple">
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <div className="kpi-lbl" style={{ marginBottom: 0 }}>
                        <span>👥</span> DS / Ads NV
                      </div>
                      <div className="kpi-icon-box">👥</div>
                    </div>
                    <div className="kpi-val" style={{ color: "#fff" }}>
                      {(() => {
                        const nvData = marketingReportData.filter(
                          (r) => !r.isLeader,
                        );
                        const dsNV = nvData.reduce(
                          (sum, r) => sum + Number(r.tienVND || 0),
                          0,
                        );
                        const adsNV = nvData.reduce(
                          (sum, r) => sum + Number(r.totalAds || 0),
                          0,
                        );
                        return (
                          <div>
                            <div
                              style={{
                                fontSize: "22px",
                                fontWeight: 800,
                                color: "#fff",
                                lineHeight: 1.15,
                              }}
                            >
                              {Math.round(dsNV).toLocaleString("vi-VN")}
                              <span
                                style={{
                                  fontSize: "12px",
                                  fontWeight: 700,
                                  opacity: 0.75,
                                  marginLeft: 2,
                                }}
                              >
                                đ
                              </span>
                            </div>
                            <div className="kpi-sub">
                              <span>Ads:</span>{" "}
                              {Math.round(adsNV).toLocaleString("vi-VN")}
                              <span
                                style={{
                                  fontSize: "10px",
                                  fontWeight: 700,
                                  opacity: 0.75,
                                  marginLeft: 1,
                                }}
                              >
                                đ
                              </span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                    <div className="kpi-sub">
                      {marketingReportData.filter((r) => !r.isLeader).length}{" "}
                      nhân viên
                    </div>
                  </div>
                </div>

                <Row gutter={[16, 16]} style={{ marginTop: "2rem" }}>
                  <Col xs={24} md={12}>
                    <div
                      className="card-mkt-chart"
                      style={{ padding: "16px", marginBottom: 16 }}
                    >
                      <h3>👥 Doanh số Nhân viên MKT</h3>
                      <GroupedDoubleBarChartComponent
                        data={employeeChartDataNew}
                      />
                    </div>
                  </Col>
                  <Col xs={24} md={12}>
                    <div
                      className="card-mkt-daily"
                      style={{ padding: "16px", marginBottom: 16 }}
                    >
                      <h3>📅 Doanh số hàng ngày</h3>
                      <GroupedDoubleBarChartComponent
                        data={dailyChartDataNew}
                      />
                    </div>
                  </Col>
                </Row>
                <Row gutter={[16, 16]}>
                  <Col xs={24} md={24}>
                    <div
                      className="card-mkt-pie"
                      style={{ padding: "16px", marginBottom: 16 }}
                    >
                      <h3>📊 Phần trăm doanh số theo Team</h3>
                      <PieChartComponent data={teamPieData} />
                    </div>
                  </Col>
                </Row>
                <Row gutter={[16, 16]}>
                  <Col xs={24} md={24}>
                    <div
                      className="card-mkt-table"
                      style={{ padding: "16px", marginBottom: 16 }}
                    >
                      <h3>📋 Báo cáo Marketing</h3>
                      <Table
                        columns={marketingColumns}
                        dataSource={marketingReportData}
                        pagination={false}
                        scroll={{ x: "max-content" }}
                        rowClassName={(record) =>
                          record.isLeader ? "leader-row" : ""
                        }
                      />
                    </div>
                  </Col>
                </Row>
              </>
            );

            const adminSaleTabContent = renderSaleDashboard({
              operationTitle: "Báo cáo Doanh Số Nhân Viên Sale Vận Đơn",
            });

            const items = [
              {
                key: "MKT",
                label: "MKT",
                children: mktTabContent,
              },
              {
                key: "SALE",
                label: "SALE",
                children: adminSaleTabContent,
              },
            ];

            return <Tabs defaultActiveKey="MKT" items={items} />;
          })()
        : currentUser.position === "leadSALE" ||
            currentUser.position === "managerSALE"
          ? (() => {
              const saleOnlyContent = renderSaleDashboard({
                operationTitle: "Báo cáo Doanh Số Nhân Viên Sale Vận Đơn",
                showDailyTrend: true,
              });
              const items = [
                { key: "SALE", label: "SALE", children: saleOnlyContent },
              ];
              return <Tabs items={items} />;
            })()
          : null}
      {(currentUser.position === "lead" ||
        (currentUser.position === "admin" && selectedTeam) ||
        (currentUser.position === "managerMKT" && selectedTeam)) && (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <div
                className="card-mkt-table"
                style={{ padding: "16px", marginBottom: 16 }}
              >
                <h3>📋 Báo cáo Marketing</h3>
                <Table
                  columns={marketingColumns}
                  dataSource={marketingReportDataTEAM}
                  pagination={false}
                  scroll={{ x: "max-content" }}
                  rowClassName={(record) =>
                    record.isLeader ? "leader-row" : ""
                  }
                />
              </div>
            </Col>
            <Col xs={24} md={12}>
              <div
                className="card-mkt-chart"
                style={{ padding: "16px", marginBottom: 16 }}
              >
                <h3>👥 Doanh số Nhân viên MKT</h3>
                <GroupedDoubleBarChartComponentTEAM
                  data={employeeChartDataNewTEAM}
                />
              </div>
            </Col>
          </Row>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <div
                className="card-mkt-daily"
                style={{ padding: "16px", marginBottom: 16 }}
              >
                <h3>📅 Doanh số hàng ngày</h3>
                <GroupedDoubleBarChartComponentTEAM
                  data={dailyChartDataNewTEAM}
                />
              </div>
            </Col>
            <Col xs={24} md={12}>
              <div
                className="card-mkt-pie"
                style={{ padding: "16px", marginBottom: 16 }}
              >
                <h3>📊 Phần trăm doanh số thành viên</h3>
                <PieChartComponent data={employeePieDataTEAM} />
              </div>
            </Col>
          </Row>
        </>
      )}
      {currentUser.position === "mkt" && (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <div
                className="card-mkt-daily"
                style={{ padding: "16px", marginBottom: 16 }}
              >
                <h3>📅 Doanh số hàng ngày</h3>
                <GroupedDoubleBarChartComponentTEAM
                  data={dailyChartDataNewTEAM}
                />
              </div>
            </Col>
            <Col xs={24} md={12}>
              <div
                className="card-mkt-pie"
                style={{ padding: "16px", marginBottom: 16 }}
              >
                <h3>📊 Phần trăm doanh số thành viên</h3>
                <PieChartComponent data={employeePieDataTEAM} />
              </div>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};
export default Dashboard;
