"use client";
import React, { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import {
  Select,Radio ,
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
import PraiseBanner from "../components/PraiseBanner";
// import PraiseBanner2 from "./components/PraiseBanner2";
const { Option } = Select;
import { useRouter } from "next/navigation";
const Dashboard = () => {
  const [employees, setEmployees] = useState([]);
  const [orders, setOrders] = useState([]);
  const currentTeamId = useSelector((state) => state.user.currentUser.team_id);
  const [selectedTeam, setSelectedTeam] = useState(currentTeamId);
  const [adsMoneyData, setAdsMoneyData] = useState([]); //mkt
  // Component biểu đồ Bar (Recharts) cho biểu đồ đơn (có 1 series)
  const router = useRouter();
  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedPreset, setSelectedPreset] = useState("currentMonth");
  const [selectedArea, setSelectedArea] = useState("all");
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
  return orders.map(o => ({
    ...o,
    revenue: (o.revenue || 0) * rate,
    profit: (o.profit || 0) * rate,
    totalAmount: o.totalAmount ? o.totalAmount * rate : 0
  }));
};
 const fetchOrders = async () => {
  try {
    let path = "";
    if (selectedPreset && selectedPreset !== "all") {
      path = `?selectedPreset=${selectedPreset}`;
    } else if (selectedDate) {
      path = `?selectedDate=${selectedDate}`;
    }

    const [krRes, jpRes, twRes] = await Promise.all([
      axios.get(`/api/orders2${path}`),
      axios.get(`/api/jp/orders2${path}`),
      axios.get(`/api/tw/orders2${path}`)
    ]);

    const KR_raw = krRes.data.data;
    const JP_raw = jpRes.data.data;
    const TW_raw = twRes.data.data;

    // lưu raw để tính riêng
    setOrdersKR(KR_raw);
    setOrdersJP(JP_raw);
    setOrdersTW(TW_raw);

    // convert theo tỷ giá
    const KR = convertOrdersWithRate(KR_raw, 17000);
    const JP = convertOrdersWithRate(JP_raw, 150);
    const TW = convertOrdersWithRate(TW_raw, 750);

    // tổng 3 thị trường → đã nhân tỉ giá
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

    const [kr, jp, tw] = await Promise.all([
      axios.get(`/api/recordsMKT${path}`),     // Hàn
      axios.get(`/api/jp/recordsMKT${path}`),  // Nhật
      axios.get(`/api/tw/recordsMKT${path}`),  // Đài
    ]);

    // từng thị trường
    setAdsKR(kr.data.data);
    setAdsJP(jp.data.data);
    setAdsTW(tw.data.data);

    // tổng 3 thị trường
    setAdsMoneyData([...kr.data.data, ...jp.data.data, ...tw.data.data]);
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
    // Định nghĩa hàm gọi dữ liệu
    const fetchData = () => {
      fetchRecords();
      fetchEmployees();
    };

    // Gọi ngay lần đầu tiên
    fetchData();

    // Thiết lập interval để gọi lại sau mỗi 1 giờ (3600000 ms)
    const intervalId = setInterval(() => {
      fetchData();
    }, 300000);

    // Hủy interval khi unmount component
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
  if (selectedArea === "da") {
    return employees.filter((emp) => emp.khuvuc === "da");
  } else if (selectedArea === "pvd") {
    // Phạm Văn Đồng: gồm cả nhân viên không có trường khuvuc
    return employees.filter(
      (emp) => emp.khuvuc === "pvd" && emp.position_team ==='mkt'
    );
  } else {
    // all: giữ nguyên
    return employees;
  }
}, [employees, selectedArea]);

const calcRevenue = (orders, rate) => {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  const todayRevenue = orders
    .filter(o => o.orderDate === todayStr)
    .reduce((a, b) => a + b.profit, 0) * rate;

  const yesterdayRevenue = orders
    .filter(o => o.orderDate === yesterdayStr)
    .reduce((a, b) => a + b.profit, 0) * rate;

  const percent = yesterdayRevenue > 0
    ? ((todayRevenue / yesterdayRevenue) * 100).toFixed(2)
    : 0;

  return { todayRevenue, yesterdayRevenue, percent };
};

const kr = calcRevenue(ordersKR, 17000);
const jp = calcRevenue(ordersJP, 150);
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
    { ssr: false, loading: () => <p>Loading Chart...</p> }
  );

  // Component biểu đồ Pie (Recharts)
  const PieChartComponent = dynamic(
    () =>
      Promise.resolve(({ data }) => {
        const { PieChart, Pie, Cell, Tooltip, Legend } = require("recharts");
        const COLORS = [
          "#AA336A",
          " #FFBB28",
          "#00C49F",
          "#FF8042",
          "#0088FA",
          "#5A2D82",
          "#144523",
          "#c51e1eff",
          "#43e474ff",
          "#20aeebff",
        ];
        return (
          <PieChart width={450} height={300}>
            <Pie
              data={data}
              dataKey="profit"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={({ name, percent }) => `${name}`}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip formatter={(value) => value.toLocaleString("vi-VN")} />

            <Legend />
          </PieChart>
        );
      }),
    { ssr: false, loading: () => <p>Loading Pie Chart...</p> }
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
  //   { ssr: false, loading: () => <p>Loading Grouped Chart...</p> }
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
              <Bar dataKey="profit" fill="#8884d8">
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
    { ssr: false, loading: () => <p>Loading Grouped Chart...</p> }
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
              <Bar dataKey="profit" fill="#8884d8">
                <LabelList
                  dataKey="profit"
                  formatter={formatYAxisTick}
                  position="top"
                />
              </Bar>
              <Bar dataKey="adsCost" fill="#FF8042">
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
    { ssr: false, loading: () => <p>Loading Grouped Chart...</p> }
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
    { ssr: false, loading: () => <p>Loading Grouped Chart...</p> }
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
    { ssr: false, loading: () => <p>Loading Grouped Chart...</p> }
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
              <Bar dataKey="profit">
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
    { ssr: false, loading: () => <p>Loading Grouped Chart...</p> }
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
    { ssr: false, loading: () => <p>Loading Grouped Chart...</p> }
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
          999
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
          999
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
          999
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
          999
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
          999
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
          999
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
  e.name.trim().toLowerCase()
);

const filteredOrdersByArea0mkt =
  selectedArea === "all"
    ? filteredOrders
    : filteredOrders.filter((order) => {
        const mkt = order.mkt?.trim().toLowerCase();
      
        return (
          // areaEmployeeNames.includes(saleName) ||
          areaEmployeeNames.includes(mkt) 
          // areaEmployeeNames.includes(salexulyName)
        );
      });

      const filteredOrdersByArea =
  selectedMKT
    ? filteredOrdersByArea0mkt.filter(
        (order) =>
          order.mkt &&
          order.mkt.trim().toLowerCase() === selectedMKT.trim().toLowerCase()
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
      selectedPreset
    ).map((ad) => ({ ...ad, date: ad.orderDate }));
  } else if (selectedDate) {
    filteredAds = adsMoneyData.filter((ad) => ad.date === selectedDate);
  }
  
const filteredAdsByArea2 =
  selectedArea === "all"
    ? filteredAds
    : filteredAds.filter((ad) => {
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
  const mktEmployees = filteredEmployeesByArea.filter((emp) => emp.position_team === "mkt" );
  const mktEmployeesPVD = filteredEmployeesByArea.filter((emp) => emp.position_team === "mkt" && emp.quocgia !== "jp"&&emp.khuvuc === "pvd");

  const employeeChartDataNew = mktEmployees.map((emp) => {
    const sales = filteredOrdersByArea
    .filter(
        (order) =>
          order.mkt.trim().toLowerCase() === emp.name.trim().toLowerCase()
      )
      .reduce((sum, order) => sum + order.profit, 0);
    const adsCost = filteredAdsByArea
      .filter(
        (ad) => ad.name.trim().toLowerCase() === emp.name.trim().toLowerCase()
      )
      .reduce((sum, ad) => sum + (ad.request1 + ad.request2), 0);
    return { name: emp.name, profit: sales * 1 * 0.95, adsCost };
  });

  const teamEmployees = mktEmployees.filter(
    (emp) =>
      emp.team_id === currentUser.team_id ||
      (currentUser.team_id === "SON" &&
        (emp.name.trim() === "Nguyễn Thị Xuân Diệu" ||
          emp.name.trim() === "Nguyễn Bá Quân")) 
      //     ||
      // (currentUser.team_id === "LE" && emp.name.trim() === "Bùi Văn Phi")
  );

  const employeeChartDataNewTEAM = teamEmployees.map((emp) => {
    const sales = filteredOrdersByArea
    .filter(
        (order) =>
          order.mkt.trim().toLowerCase() === emp.name.trim().toLowerCase()
      )
      .reduce((sum, order) => sum + order.profit, 0);
    const adsCost = filteredAds
      .filter(
        (ad) => ad.name.trim().toLowerCase() === emp.name.trim().toLowerCase()
      )
      .reduce((sum, ad) => sum + (ad.request1 + ad.request2), 0);
    return { name: emp.name, profit: sales * 1 * 0.95, adsCost };
  });

  const saleEmployees = filteredEmployeesByArea.filter((emp) => emp.position_team === "sale" && emp.quocgia !== "jp" );
  const saleEmployees2 = filteredEmployeesByArea.filter(
    (emp) =>
      emp.position === "salenhapdon" ||
      emp.position === "salexuly" ||
      emp.position === "salefull" 
  );
  const saleEmployeesND = filteredEmployeesByArea.filter(
    (emp) => emp.position_team === "sale" && emp.position === "salenhapdon" && emp.quocgia !== "jp"
  );
  const saleEmployeesOL = filteredEmployeesByArea.filter(
    (emp) => emp.position_team === "sale" && emp.position === "salefull" && emp.quocgia !== "jp"
  );
  const saleEmployeesXL = filteredEmployeesByArea.filter(
    (emp) => emp.position_team === "sale" && emp.position === "salexuly" && emp.quocgia !== "jp"
  );
  const employeeChartDataNewsale = saleEmployees2.map((emp) => {
    const sales = filteredOrdersByArea
    .filter(
        (order) =>
          order.sale.trim().toLowerCase() === emp.name.trim().toLowerCase() ||
          order.salexuly.trim().toLowerCase() === emp.name.trim().toLowerCase()
      )
      .reduce((sum, order) => sum + order.profit, 0);

    let fillColor = "#8884d8"; // Màu mặc định
    if (emp.position === "salenhapdon") {
      fillColor = "#8884d8"; // ví dụ: màu xanh tím
    } else if (emp.position === "salexuly") {
      fillColor = "#82ca9d"; // ví dụ: màu xanh lá nhạt
    } else if (emp.position === "salefull") {
      fillColor = "#AA336A"; // ví dụ: màu vàng
    }

    return { name: emp.name, profit: sales * 1, fill: fillColor };
  });

  const teamChartDataNew = teams2.map((team) => {
  const teamEmps = filteredEmployeesByArea.filter(
    (emp) => emp.position_team === "mkt" && emp.team_id === team.value
  );

  const teamEmps2 = filteredEmployeesByArea.filter(
    (emp) =>
      emp.position_team === "mkt" &&
      emp.team_id === team.value &&
      emp.position !== "lead" &&
      emp.position !== "managerMKT"
  );

  const calcSaleByName = (name) => {
    return filteredOrdersByArea
      .filter(
        (order) =>
          (order.mkt || "").trim().toLowerCase() === name.trim().toLowerCase()
      )
      .reduce((sum, order) => sum + (order.profit || 0), 0);
  };

  // SỬA: dùng let để có thể += sau này
  let sales = teamEmps.reduce((acc, emp) => {
    return acc + calcSaleByName(emp.name);
  }, 0);

  let members = teamEmps2.reduce((acc, emp) => {
    return acc + calcSaleByName(emp.name);
  }, 0);

  // Nếu team JP: thêm Phi Navy
  if (team.value === "JP") {
    const extra = calcSaleByName("Phi Navy");
    sales += extra;
    members += extra;
  }

  // Nếu team TW: thêm 3 người
  if (team.value === "TW") {
    const extraTW = [ "Trần Ngọc Diện"];
    extraTW.forEach((name) => {
      const extraSale = calcSaleByName(name);
      sales += extraSale;
      members += extraSale;
    });
  }

  return {
    name: team.label,
    LeadAndMembers: sales * 1,
    members: members * 1,
  };
});
  // // === Biểu đồ doanh số theo team (Grouped Double Bar Chart) ===
const teamChartDataNew2 = teams.map((team) => {
  const teamEmps = filteredEmployeesByArea.filter(
    (emp) => emp.position_team === "mkt" && emp.team_id === team.value
  );

  const calcProfitByName = (name) => {
    return filteredOrdersByArea
      .filter(
        (order) =>
          (order.mkt || "").trim().toLowerCase() === name.trim().toLowerCase()
      )
      .reduce((sum, order) => sum + (order.profit || 0), 0);
  };

  const calcAdsByName = (name) => {
    return filteredAds
      .filter(
        (ad) => (ad.name || "").trim().toLowerCase() === name.trim().toLowerCase()
      )
      .reduce((sum, ad) => sum + ((ad.request1 || 0) + (ad.request2 || 0)), 0);
  };

  // SỬA: let để có thể cộng thêm
  let sales = teamEmps.reduce((acc, emp) => {
    return acc + calcProfitByName(emp.name);
  }, 0);

  let adsCost = teamEmps.reduce((acc, emp) => {
    return acc + calcAdsByName(emp.name);
  }, 0);

  // Thêm theo yêu cầu
  if (team.value === "JP") {
    sales += calcProfitByName("Phi Navy");
    adsCost += calcAdsByName("Phi Navy");
  }

  if (team.value === "TW") {
    const extraTW = ["Nguyễn Quốc Hiếu", "Hà Minh Sang", "Trần Ngọc Diện"];
    extraTW.forEach((name) => {
      sales += calcProfitByName(name);
      adsCost += calcAdsByName(name);
    });
  }

  return { name: team.label, profit: sales * 0.95, adsCost };
});

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
  let dailyChartDataNew;
  const isFilterApplied =
    selectedPreset || (selectedDate && selectedDate !== today);
  if (isFilterApplied && filteredOrders.length > 0) {
    let minDate = new Date(filteredOrders[0].orderDate);
    let maxDate = new Date(filteredOrders[0].orderDate);
    filteredOrders.forEach((order) => {
      const d = new Date(order.orderDate);
      if (d < minDate) minDate = d;
      if (d > maxDate) maxDate = d;
    });
    const dateArray = [];
    let currentDate = new Date(minDate);
    while (currentDate <= maxDate) {
      dateArray.push(currentDate.toISOString().split("T")[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    dailyChartDataNew = dateArray.map((date) => {
      const sales = filteredOrdersByArea
        .filter((order) => order.orderDate === date)
        .reduce((sum, order) => sum + order.profit, 0);
      const adsCost = filteredAds
        .filter((ad) => ad.date === date)
        .reduce((sum, ad) => sum + (ad.request1 + ad.request2), 0);
      return { name: date, profit: sales * 1 * 0.95, adsCost };
    });
  } else {
    const last30Days = getLast30Days();
    dailyChartDataNew = last30Days.map((date) => {
      const sales = orders
        .filter((order) => order.orderDate === date)
        .reduce((sum, order) => sum + order.profit, 0);
      const adsCost = adsMoneyData
        .filter((ad) => ad.date === date)
        .reduce((sum, ad) => sum + (ad.request1 + ad.request2), 0);
      return { name: date, profit: sales * 1 * 0.95, adsCost };
    });
  }

  // === Biểu đồ doanh số hàng ngày (Grouped Double Bar Chart) ===

  let dailyChartDataNewTEAM;
  // Nếu currentUser là team lead, lọc các đơn hàng và ads theo team
  if (
    isTeamLead ||
    currentUser.position === "mkt" ||
    (currentUser.position === "admin" && selectedTeam) ||
    (currentUser.position === "managerMKT" && selectedTeam)
  ) {
    // Lấy danh sách tên nhân viên của team
    const teamEmployeeNames = employees
      .filter(
        (emp) =>
          (emp.team_id === currentUser.team_id &&
            emp.position_team === "mkt") ||
          (currentUser.team_id === "SON" &&
            ["Nguyễn Thị Xuân Diệu", "Nguyễn Bá Quân"].includes(
              (emp.name || "").trim()
            )) 
          //   ||
          // (currentUser.team_id === "LE" &&
          //   ["Bùi Văn Phi"].includes((emp.name || "").trim()))
      )
      .map((emp) => (emp.name || "").trim().toLowerCase());

    // Lọc đơn hàng và ads chỉ thuộc team đó
    filteredOrders = filteredOrdersByArea.filter((order) =>
      teamEmployeeNames.includes(order.mkt.trim().toLowerCase())
    );
    filteredAds = filteredAds.filter((ad) =>
      teamEmployeeNames.includes(ad.name.trim().toLowerCase())
    );
  }

  if (isFilterApplied && filteredOrders.length > 0) {
    let minDate = new Date(filteredOrders[0].orderDate);
    let maxDate = new Date(filteredOrders[0].orderDate);

    filteredOrders.forEach((order) => {
      const d = new Date(order.orderDate);
      if (d < minDate) minDate = d;
      if (d > maxDate) maxDate = d;
    });

    const dateArray = [];
    let currentDate = new Date(minDate);
    while (currentDate <= maxDate) {
      dateArray.push(currentDate.toISOString().split("T")[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    dailyChartDataNewTEAM = dateArray.map((date) => {
      const sales = filteredOrdersByArea
        .filter((order) => order.orderDate === date)
        .reduce((sum, order) => sum + order.profit, 0);
      const adsCost = filteredAds
        .filter((ad) => ad.date === date)
        .reduce((sum, ad) => sum + (ad.request1 + ad.request2), 0);
      return { name: date, profit: sales * 1 * 0.95, adsCost };
    });
  } else {
    const last30Days = getLast30Days();
    dailyChartDataNewTEAM = last30Days.map((date) => {
      const sales = orders
        .filter((order) => order.orderDate === date)
        .reduce((sum, order) => sum + order.profit, 0);
      const adsCost = adsMoneyData
        .filter((ad) => ad.date === date)
        .reduce((sum, ad) => sum + (ad.request1 + ad.request2), 0);
      return { name: date, profit: sales * 1 * 0.95, adsCost };
    });
  }

  // === Biểu đồ phần trăm doanh số theo team (PieChart) ===
  const totalCompanyProfit = filteredOrdersByArea.reduce(
    (sum, order) => sum + order.profit,
    0
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
    0
  );

  // Tạo dữ liệu cho PieChart dựa trên doanh số của từng thành viên
  const employeePieDataTEAM = employeeChartDataNewTEAM.map((emp) => ({
    ...emp,
    percent:
      totalTeamProfit > 0
        ? Number((emp.profit / totalTeamProfit) * 100).toFixed(2)
        : 0,
  }));

  // === Biểu đồ doanh số trung bình của nhân viên trong từng team (BarChart) ===
  const averageTeamChartData = teams2.map((team) => {
    const teamEmps = filteredEmployeesByArea.filter(
      (emp) =>
        emp.position_team === "mkt" &&
        emp.team_id === team.value &&
        emp.position !== "lead"
    );
    const teamProfit = teamEmps.reduce((acc, emp) => {
      const empSales = filteredOrdersByArea
        .filter(
          (order) =>
            order.mkt.trim().toLowerCase() === emp.name.trim().toLowerCase()
        )
        .reduce((sum, order) => sum + order.profit, 0);
      return acc + empSales;
    }, 0);
    const avgProfit = teamEmps.length > 0 ? teamProfit / teamEmps.length : 0;
    return { name: team.label, profit: avgProfit * 1 * 0.95 };
  });

  // === Biểu đồ so sánh doanh số giữa leader và các nhân viên khác trong team (Grouped Bar Chart) ===
  // Công thức: leaderPercent = (leaderSales / othersSales) * 100
  const leaderComparisonChartData = teams.map((team) => {
    const teamEmps = filteredEmployeesByArea.filter(
      (emp) => emp.position_team === "mkt" && emp.team_id === team.value
    );
    const othersEmps = teamEmps.filter(
      (emp) => emp.position !== "lead" && emp.position !== "managerMKT"
    );

    const leaderSales0 = teamEmps.reduce((acc, emp) => {
      const empSales = filteredOrdersByArea
        .filter(
          (order) =>
            order.mkt.trim().toLowerCase() === emp.name.trim().toLowerCase()
        )
        .reduce((sum, order) => sum + order.profit, 0);
      return acc + empSales;
    }, 0);
    const adsCost = teamEmps.reduce((acc, emp) => {
      const empAds = filteredAds
        .filter(
          (ad) => ad.name.trim().toLowerCase() === emp.name.trim().toLowerCase()
        )
        .reduce((sum, ad) => sum + (ad.request1 + ad.request2), 0);
      return acc + empAds;
    }, 0);
    const adsCost2 = othersEmps.reduce((acc, emp) => {
      const empAds = filteredAds
        .filter(
          (ad) => ad.name.trim().toLowerCase() === emp.name.trim().toLowerCase()
        )
        .reduce((sum, ad) => sum + (ad.request1 + ad.request2), 0);
      return acc + empAds;
    }, 0);
    const othersSales0 = othersEmps.reduce((acc, emp) => {
      const empSales = filteredOrdersByArea
        .filter(
          (order) =>
            order.mkt.trim().toLowerCase() === emp.name.trim().toLowerCase()
        )
        .reduce((sum, order) => sum + order.profit, 0);
      return acc + empSales;
    }, 0);
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

  // === Báo cáo Marketing ===
  const marketingReportData = mktEmployees.map((emp, index) => {
    const paid = filteredOrdersByArea
    .filter(
        (order) =>
          order.mkt.trim().toLowerCase() === emp.name.trim().toLowerCase() &&
          order.paymentStatus === "ĐÃ THANH TOÁN"
      )
      .reduce((sum, order) => sum + order.profit, 0);
    const unpaid = filteredOrdersByArea
    .filter(
        (order) =>
          order.mkt.trim().toLowerCase() === emp.name.trim().toLowerCase() &&
          (order.paymentStatus === "CHƯA THANH TOÁN" ||
            order.paymentStatus === "")
      )
      .reduce((sum, order) => sum + order.profit, 0);
    const total = paid + unpaid;
    const tienVND = total * exchangeRate * 0.95;
    const totalAds = filteredAds
      .filter(
        (ad) => ad.name.trim().toLowerCase() === emp.name.trim().toLowerCase()
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
    };
  });

  marketingReportData.sort((a, b) => b.tienVND - a.tienVND);

  const today2 = new Date();
  const startOfToday = new Date(
    today2.getFullYear(),
    today2.getMonth(),
    today2.getDate()
  );
  const endOfToday = new Date(
    today2.getFullYear(),
    today2.getMonth(),
    today2.getDate() + 1
  );
  const today3 = new Date();
  const startOfToday3 = new Date(
    today3.getFullYear(),
    today3.getMonth(),
    today3.getDate() - 3
  );
  const endOfToday3 = new Date(
    today3.getFullYear(),
    today3.getMonth(),
    today3.getDate() - 2
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
      (emp) => emp.total2 <= cutoffValue
    );
  }

  // Tạo marketingReportData1 mới đúng điều kiện
 const marketingReportData3 = mktEmployeesPVD.map((emp, index) => {
  const nameLC = emp.name.trim().toLowerCase();

  // 1️⃣ Doanh số hôm nay
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

  // 2️⃣ Doanh số từ đầu tháng đến nay
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const twoDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2);

  const endOfMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
    999
  );

  const totalMonth = orders
    .filter((order) => {
      const orderDate = new Date(order.createdAt);
      return (
        order.mkt.trim().toLowerCase() === nameLC &&
        orderDate >= startOfMonth &&
        orderDate <= endOfMonth
      );
    })
    .reduce((sum, order) => sum + order.profit, 0);

  // 3️⃣ Chi phí ads trong tháng hiện tại (giữ nguyên)
  const adsThisMonth = adsMoneyData
    .filter((ad) => {
      const adDate = new Date(ad.createdAt);
      return (
        ad.name.trim().toLowerCase() === nameLC &&
        adDate >= twoDaysAgo &&
        adDate <= endOfMonth
      );
    })
    .reduce((sum, ad) => sum + (ad.request1 + ad.request2), 0);

  return { key: index, name: emp.name, totalToday, totalMonth, adsThisMonth };
});

// 🧩 Chọn người có doanh số thấp nhất từ đầu tháng
const excludedNames = [
  "đỗ ngọc ánh",
  "trần ngọc diện",
  "nguyễn bảo ngọc",
  "hồ ngọc lan",
  "ngô anh đào",
];

const warningEmployeesList = marketingReportData3.filter((emp) => {
  const name = emp.name.trim().toLowerCase();

  return (
    emp.adsThisMonth > 0 &&
    !excludedNames.includes(name)
  );
});

const minMonthSales = Math.min(...warningEmployeesList.map(e => e.totalMonth));
const lowestMonthEmployees = warningEmployeesList.filter(
  e => e.totalMonth === minMonthSales
);

// Nếu nhiều người cùng doanh số thấp nhất → chọn ngẫu nhiên 1 người
const randomEmployee =
  lowestMonthEmployees.length > 0
    ? lowestMonthEmployees[Math.floor(Math.random() * lowestMonthEmployees.length)]
    : null;

const top5Employees2 = randomEmployee ? [randomEmployee] : [];

  // Lọc chỉ những người có ads tháng này > 0
  const excludedNames2 = ["quách phú"];

const top5Employees = marketingReportData3
  .filter((emp) => {
    const name = emp.name.trim().toLowerCase();
    return emp.adsThisMonth > 0 && !excludedNames2.includes(name);
  })
  .sort((a, b) => b.totalToday - a.totalToday)
  .slice(0, 2);
  // Lọc ra nhân viên có chi phí ads tháng này > 0


  const top1Employees = marketingReportData3
    .filter((emp) => emp.adsThisMonth > 0)
    .sort((a, b) => b.totalToday - a.totalToday)
    .slice(0, 1);

  // Lọc ra các thành viên mkt thuộc team của currentUser
  // Lọc nhân viên MKT thuộc team
  const teamMktEmployees = mktEmployees.filter(
    (emp) =>
      emp.team_id === currentUser.team_id ||
      (currentUser.team_id === "SON" &&
        ["Nguyễn Thị Xuân Diệu", "Nguyễn Bá Quân"].includes(emp.name.trim()))
      //    ||
      // (currentUser.team_id === "LE" && emp.name.trim() === "Bùi Văn Phi")
  );

  // Lọc riêng dữ liệu đơn hàng và ads của team (KHÔNG ghi đè biến gốc)
  const teamEmployeeNames = teamMktEmployees.map((e) =>
    e.name.trim().toLowerCase()
  );

  const teamFilteredOrders = filteredOrdersByArea.filter((order) =>
    teamEmployeeNames.includes(order.mkt.trim().toLowerCase())
  );

  const teamFilteredAds = filteredAds.filter((ad) =>
    teamEmployeeNames.includes(ad.name.trim().toLowerCase())
  );

  const marketingReportDataTEAM = teamMktEmployees.map((emp, index) => {
    const paid = teamFilteredOrders
      .filter(
        (order) =>
          order.mkt.trim().toLowerCase() === emp.name.trim().toLowerCase() &&
          order.paymentStatus === "ĐÃ THANH TOÁN"
      )
      .reduce((sum, order) => sum + order.profit, 0);

    const unpaid = teamFilteredOrders
      .filter(
        (order) =>
          order.mkt.trim().toLowerCase() === emp.name.trim().toLowerCase() &&
          (order.paymentStatus === "CHƯA THANH TOÁN" ||
            order.paymentStatus === "")
      )
      .reduce((sum, order) => sum + order.profit, 0);

    const total = paid + unpaid;
    const tienVND = total * 0.95 * exchangeRate;

    const totalAds = teamFilteredAds
      .filter(
        (ad) => ad.name.trim().toLowerCase() === emp.name.trim().toLowerCase()
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
      render: (text) => {
        const emp = employees.find((item) => item.name === text);
        const style =
          (emp && emp.position === "lead") || emp.position === "managerMKT"
            ? {
                backgroundColor: "#2A8B9A",
                padding: "4px 8px",
                borderRadius: "4px",
              }
            : {};
        return <div style={style}>{text}</div>;
      },
    },
    {
      title: "Đã thanh toán",
      dataIndex: "paid",
      key: "paid",
      render: (value) => value.toLocaleString(),
    },
    {
      title: "Chưa thanh toán",
      dataIndex: "unpaid",
      key: "unpaid",
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
      render: (value) => value.toLocaleString(),
    },
    {
      title: "Tổng chi phí ads",
      dataIndex: "totalAds",
      key: "totalAds",
      render: (value) => value.toLocaleString(),
    },
    {
      title: "% chi phí ads",
      dataIndex: "adsPercent",
      key: "adsPercent",
      render: (value) => {
        const percent = Number(value);
        let bgColor = "";
        if (percent < 30) {
          bgColor = "#54DA1F";
        } else if (percent >= 30 && percent <= 35) {
          bgColor = "#FF9501";
        } else {
          bgColor = "#F999A8";
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

  // =================== Các bảng báo cáo SALE ===================

  // Báo cáo sale: lấy các nhân viên có position_team === "sale"

  const saleReportDataOL = saleEmployeesOL.map((emp, index) => {
    let paid = 0,
      unpaid = 0;
    if (emp.position === "salenhapdon" || emp.position === "salefull") {
      paid = filteredOrdersByArea
        .filter(
          (order) =>
            order.sale.trim().toLowerCase() === emp.name.trim().toLowerCase() &&
            order.paymentStatus === "ĐÃ THANH TOÁN"
        )
        .reduce((sum, order) => sum + order.profit, 0);
      unpaid = filteredOrdersByArea
        .filter(
          (order) =>
            order.sale.trim().toLowerCase() === emp.name.trim().toLowerCase() &&
            (order.paymentStatus === "CHƯA THANH TOÁN" ||
              order.paymentStatus === "")
        )
        .reduce((sum, order) => sum + order.profit, 0);
    } else if (emp.position === "salexuly") {
      paid = filteredOrdersByArea
        .filter(
          (order) =>
            order.salexuly.trim().toLowerCase() ===
              emp.name.trim().toLowerCase() &&
            order.paymentStatus === "ĐÃ THANH TOÁN"
        )
        .reduce((sum, order) => sum + order.profit, 0);
      unpaid = filteredOrdersByArea
        .filter(
          (order) =>
            order.salexuly.trim().toLowerCase() ===
              emp.name.trim().toLowerCase() &&
            (order.paymentStatus === "CHƯA THANH TOÁN" ||
              order.paymentStatus === "")
        )
        .reduce((sum, order) => sum + order.profit, 0);
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
  const saleReportDataND = saleEmployeesND.map((emp, index) => {
    let paid = 0,
      unpaid = 0;
    if (emp.position === "salenhapdon" || emp.position === "salefull") {
      paid = filteredOrdersByArea
        .filter(
          (order) =>
            order.sale.trim().toLowerCase() === emp.name.trim().toLowerCase() &&
            order.paymentStatus === "ĐÃ THANH TOÁN"
        )
        .reduce((sum, order) => sum + order.profit, 0);
      unpaid = filteredOrdersByArea
        .filter(
          (order) =>
            order.sale.trim().toLowerCase() === emp.name.trim().toLowerCase() &&
            (order.paymentStatus === "CHƯA THANH TOÁN" ||
              order.paymentStatus === "")
        )
        .reduce((sum, order) => sum + order.profit, 0);
    } else if (emp.position === "salexuly") {
      paid = filteredOrdersByArea
        .filter(
          (order) =>
            order.salexuly.trim().toLowerCase() ===
              emp.name.trim().toLowerCase() &&
            order.paymentStatus === "ĐÃ THANH TOÁN"
        )
        .reduce((sum, order) => sum + order.profit, 0);
      unpaid = filteredOrdersByArea
        .filter(
          (order) =>
            order.salexuly.trim().toLowerCase() ===
              emp.name.trim().toLowerCase() &&
            (order.paymentStatus === "CHƯA THANH TOÁN" ||
              order.paymentStatus === "")
        )
        .reduce((sum, order) => sum + order.profit, 0);
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
  const saleReportDataXL = saleEmployeesXL.map((emp, index) => {
    let paid = 0,
      unpaid = 0;
    if (emp.position === "salenhapdon" || emp.position === "salefull") {
      paid = filteredOrdersByArea
        .filter(
          (order) =>
            order.sale.trim().toLowerCase() === emp.name.trim().toLowerCase() &&
            order.paymentStatus === "ĐÃ THANH TOÁN"
        )
        .reduce((sum, order) => sum + order.profit, 0);
      unpaid = filteredOrdersByArea
        .filter(
          (order) =>
            order.sale.trim().toLowerCase() === emp.name.trim().toLowerCase() &&
            (order.paymentStatus === "CHƯA THANH TOÁN" ||
              order.paymentStatus === "")
        )
        .reduce((sum, order) => sum + order.profit, 0);
    } else if (emp.position === "salexuly") {
      paid = filteredOrdersByArea
        .filter(
          (order) =>
            order.salexuly.trim().toLowerCase() ===
              emp.name.trim().toLowerCase() &&
            order.paymentStatus === "ĐÃ THANH TOÁN"
        )
        .reduce((sum, order) => sum + order.profit, 0);
      unpaid = filteredOrdersByArea
        .filter(
          (order) =>
            order.salexuly.trim().toLowerCase() ===
              emp.name.trim().toLowerCase() &&
            (order.paymentStatus === "CHƯA THANH TOÁN" ||
              order.paymentStatus === "")
        )
        .reduce((sum, order) => sum + order.profit, 0);
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
  const saleReportData = saleEmployees.map((emp, index) => {
    let paid = 0,
      unpaid = 0;
    if (emp.position === "salenhapdon" || emp.position === "salefull") {
      paid = filteredOrdersByArea
        .filter(
          (order) =>
            order.sale.trim().toLowerCase() === emp.name.trim().toLowerCase() &&
            order.paymentStatus === "ĐÃ THANH TOÁN"
        )
        .reduce((sum, order) => sum + order.profit, 0);
      unpaid = filteredOrdersByArea
        .filter(
          (order) =>
            order.sale.trim().toLowerCase() === emp.name.trim().toLowerCase() &&
            (order.paymentStatus === "CHƯA THANH TOÁN" ||
              order.paymentStatus === "")
        )
        .reduce((sum, order) => sum + order.profit, 0);
    } else if (emp.position === "salexuly") {
      paid = filteredOrdersByArea
        .filter(
          (order) =>
            order.salexuly.trim().toLowerCase() ===
              emp.name.trim().toLowerCase() &&
            order.paymentStatus === "ĐÃ THANH TOÁN"
        )
        .reduce((sum, order) => sum + order.profit, 0);
      unpaid = filteredOrdersByArea
        .filter(
          (order) =>
            order.salexuly.trim().toLowerCase() ===
              emp.name.trim().toLowerCase() &&
            (order.paymentStatus === "CHƯA THANH TOÁN" ||
              order.paymentStatus === "")
        )
        .reduce((sum, order) => sum + order.profit, 0);
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
  saleReportData.sort((a, b) => b.tienVND - a.tienVND);
  saleReportDataXL.sort((a, b) => b.tienVND - a.tienVND);
  saleReportDataOL.sort((a, b) => b.tienVND - a.tienVND);
  saleReportDataND.sort((a, b) => b.tienVND - a.tienVND);
  const saleColumns = [
    { title: "Tên", dataIndex: "name", key: "name" },
    {
      title: "Đã thanh toán",
      dataIndex: "paid",
      key: "paid",
      render: (value) => value.toLocaleString(),
    },
    {
      title: "Chưa thanh toán",
      dataIndex: "unpaid",
      key: "unpaid",
      render: (value) => value.toLocaleString(),
    },
    {
      title: "Tổng",
      dataIndex: "total",
      key: "total",
      render: (value) => value.toLocaleString(),
    },
    {
      title: "Tiền VNĐ",
      dataIndex: "tienVND",
      key: "tienVND",
      render: (value) => value.toLocaleString(),
    },
    {
      title: "% đòi tiền",
      dataIndex: "percent",
      key: "percent",
      render: (percent) => {
        let bgColor;
        if (percent > 95) {
          bgColor = "#54DA1F"; // nền xanh lá (màu xanh nhạt)
        } else if (percent >= 80 && percent <= 95) {
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
  const saleColumnsOLND = [
    { title: "Tên", dataIndex: "name", key: "name" },

    {
      title: "Tổng",
      dataIndex: "total",
      key: "total",
      render: (value) => value.toLocaleString(),
    },
    {
      title: "Tiền VNĐ",
      dataIndex: "tienVND",
      key: "tienVND",
      render: (value) => value.toLocaleString(),
    },
  ];

  // Báo cáo doanh số ngày cho SALE
  let saleDailyDates = [];
  if (
    (selectedPreset || (selectedDate && selectedDate !== today)) &&
    filteredOrders.length > 0
  ) {
    let minDate = new Date(filteredOrders[0].orderDate);
    let maxDate = new Date(filteredOrders[0].orderDate);
    filteredOrders.forEach((order) => {
      const d = new Date(order.orderDate);
      if (d < minDate) minDate = d;
      if (d > maxDate) maxDate = d;
    });
    let currentDate = new Date(minDate);
    while (currentDate <= maxDate) {
      saleDailyDates.push(currentDate.toISOString().split("T")[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }
  } else {
    saleDailyDates = getLast30Days();
  }

  const saleDailyData = saleDailyDates.map((date) => {
    let sangSom = 0,
      hanhChinh = 0,
      toi = 0,
      sodon = 0;
    filteredOrders.forEach((order) => {
      if (order.orderDate === date) {
        let emp = saleEmployees.find((e) => e.name === order.sale);
        sodon += 1;
        if (emp) {
          if (emp.position_team2 === "onlinesang") {
            sangSom += order.profit;
          }
          if (emp.position_team2 === "hanhchinh") {
            hanhChinh += order.profit;
          }
          if (emp.position_team2 === "onlinetoi") {
            toi += order.profit;
          }
        }
      }
    });
    const total = sangSom + hanhChinh + toi;
    const percentSang = total > 0 ? (sangSom / total) * 100 : 0;
    const percentHanh = total > 0 ? (hanhChinh / total) * 100 : 0;
    const percentToi = total > 0 ? (toi / total) * 100 : 0;
    return {
      key: date,
      date,
      sangSom,
      hanhChinh,
      toi,
      total,
      percentSang,
      percentHanh,
      percentToi,
      sodon,
    };
  });

  const dailySaleColumns = [
    { title: "Ngày", dataIndex: "date", key: "date" },
    {
      title: "Sáng sớm",
      dataIndex: "sangSom",
      key: "sangSom",
      render: (value) => value.toLocaleString(),
    },
    {
      title: "Hành chính",
      dataIndex: "hanhChinh",
      key: "hanhChinh",
      render: (value) => value.toLocaleString(),
    },
    {
      title: "Tối",
      dataIndex: "toi",
      key: "toi",
      render: (value) => value.toLocaleString(),
    },
    {
      title: "Tổng",
      dataIndex: "total",
      key: "total",
      render: (value) => value.toLocaleString(),
    },
    {
      title: "VNĐ",
      dataIndex: "total",
      key: "total",
      render: (value) => (value * 1).toLocaleString(),
    },
    {
      title: "SL Đơn",
      dataIndex: "sodon",
      key: "sodon",
      render: (value) => value.toLocaleString(),
    },
    {
      title: "% Ds ca Sáng sớm",
      dataIndex: "percentSang",
      key: "percentSang",
      render: (percent) => {
        let bgColor;
        if (percent > 50) {
          bgColor = "#54DA1F"; // nền xanh lá (màu xanh nhạt)
        } else if (percent >= 30 && percent <= 50) {
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
    {
      title: "% Ds ca Hành chính",
      dataIndex: "percentHanh",
      key: "percentHanh",
      render: (percent) => {
        let bgColor;
        if (percent > 50) {
          bgColor = "#54DA1F"; // nền xanh lá (màu xanh nhạt)
        } else if (percent >= 30 && percent <= 50) {
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
    {
      title: "% Ds ca Tối",
      dataIndex: "percentToi",
      key: "percentToi",
      render: (percent) => {
        let bgColor;
        if (percent > 50) {
          bgColor = "#54DA1F"; // nền xanh lá (màu xanh nhạt)
        } else if (percent >= 30 && percent <= 50) {
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

  // Thống kê để dục chuyển khoản
  const giaoThanhCongKW = filteredOrdersByArea
    .filter(
      (order) =>
        (order.paymentStatus === "CHƯA THANH TOÁN" ||
          order.paymentStatus === "") &&
        order.deliveryStatus === "GIAO THÀNH CÔNG" &&
        order.saleReport === "DONE"
    )
    .reduce((sum, order) => sum + order.revenue, 0);
  const daGuiHangKW = filteredOrdersByArea
    .filter(
      (order) =>
        (order.paymentStatus === "CHƯA THANH TOÁN" ||
          order.paymentStatus === "") &&
        order.deliveryStatus === "ĐÃ GỬI HÀNG" &&
        order.saleReport === "DONE"
    )
    .reduce((sum, order) => sum + order.revenue, 0);
  const chuaGuiHangKW = filteredOrdersByArea
    .filter(
      (order) =>
        (order.paymentStatus === "CHƯA THANH TOÁN" ||
          order.paymentStatus === "") &&
        (order.deliveryStatus === "" ||
          order.deliveryStatus === "BỊ BẮT CHỜ GỬI LẠI") &&
        order.saleReport === "DONE"
    )
    .reduce((sum, order) => sum + order.revenue, 0);
  const SLgiaoThanhCongKW = filteredOrdersByArea.filter(
    (order) =>
      (order.paymentStatus === "CHƯA THANH TOÁN" ||
        order.paymentStatus === "") &&
      order.deliveryStatus === "GIAO THÀNH CÔNG" &&
      order.saleReport === "DONE"
  );

  const SLdaGuiHangKW = filteredOrdersByArea.filter(
    (order) =>
      (order.paymentStatus === "CHƯA THANH TOÁN" ||
        order.paymentStatus === "") &&
      order.deliveryStatus === "ĐÃ GỬI HÀNG" &&
      order.saleReport === "DONE"
  );

  const SLchuaGuiHangKW = filteredOrdersByArea.filter(
    (order) =>
      (order.paymentStatus === "CHƯA THANH TOÁN" ||
        order.paymentStatus === "") &&
      (order.deliveryStatus === "" ||
        order.deliveryStatus === "BỊ BẮT CHỜ GỬI LẠI") &&
      order.saleReport === "DONE"
  );

  const tong = giaoThanhCongKW + daGuiHangKW + chuaGuiHangKW;

  const transferData = [
    {
      key: "KW",
      currency: "KW",
      giaoThanhCong: giaoThanhCongKW,
      daGuiHang: daGuiHangKW,
      chuaGuiHang: chuaGuiHangKW,
      tong: tong,
    },
    {
      key: "VND",
      currency: "VND",
      giaoThanhCong: giaoThanhCongKW * exchangeRate,
      daGuiHang: daGuiHangKW * exchangeRate,
      chuaGuiHang: chuaGuiHangKW * exchangeRate,
      tong: tong * exchangeRate,
    },
    {
      key: "SL",
      currency: "SL ĐƠN",
      giaoThanhCong: SLgiaoThanhCongKW.length,
      daGuiHang: SLdaGuiHangKW.length,
      chuaGuiHang: SLchuaGuiHangKW.length,
      tong:
        SLgiaoThanhCongKW.length +
        SLdaGuiHangKW.length +
        SLchuaGuiHangKW.length,
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

  // THỰC TẾ ĐÃ TRỪ 5
  const daThanhToanKW3 = filteredOrders
    .filter((order) => order.paymentStatus === "ĐÃ THANH TOÁN")
    .reduce((sum, order) => sum + order.profit, 0);
  const chuaThanhToanKW3 = filteredOrders
    .filter(
      (order) =>
        order.paymentStatus === "CHƯA THANH TOÁN" || order.paymentStatus === ""
    )
    .reduce((sum, order) => sum + order.profit, 0);
  const tongKW3 = (daThanhToanKW3 + chuaThanhToanKW3) * 0.95;

  const totalAdsKW3 = filteredAds.reduce(
    (sum, ad) => sum + (ad.request1 + ad.request2),
    0
  );
  const percentAds3 =
    tongKW3 > 0
      ? Number(((totalAdsKW3 / (tongKW3 * exchangeRate)) * 100).toFixed(2))
      : 0;

  //bang trong team    
  const daThanhToanKW4 = filteredOrdersByArea
    .filter((order) => order.paymentStatus === "ĐÃ THANH TOÁN")
    .reduce((sum, order) => sum + order.profit, 0);
  const chuaThanhToanKW4 = filteredOrdersByArea
    .filter(
      (order) =>
        order.paymentStatus === "CHƯA THANH TOÁN" || order.paymentStatus === ""
    )
    .reduce((sum, order) => sum + order.profit, 0);
  const tongKW4 = (daThanhToanKW4 + chuaThanhToanKW4) * 0.95;

  const totalAdsKW4 = filteredAdsByArea.reduce(
    (sum, ad) => sum + (ad.request1 + ad.request2),
    0
  );
  const percentAds4 =
    tongKW4 > 0
      ? Number(((totalAdsKW4 / (tongKW4 * exchangeRate)) * 100).toFixed(2))
      : 0;
  // Bảng Tổng
  const daThanhToanKW = filteredOrdersByArea
    .filter((order) => order.paymentStatus === "ĐÃ THANH TOÁN")
    .reduce((sum, order) => sum + order.revenue, 0);
  const chuaThanhToanKW = filteredOrdersByArea
    .filter(
      (order) =>
        order.paymentStatus === "CHƯA THANH TOÁN" || order.paymentStatus === ""
    )
    .reduce((sum, order) => sum + order.revenue, 0);
  const tongKW = daThanhToanKW + chuaThanhToanKW;
  const thanhToanDat = tongKW > 0 ? (daThanhToanKW / tongKW) * 100 : 0;
  const totalAdsKW = filteredAds.reduce(
    (sum, ad) => sum + (ad.request1 + ad.request2),
    0
  );
  const percentAds =
    tongKW > 0
      ? Number(((totalAdsKW / (tongKW * exchangeRate)) * 100).toFixed(2))
      : 0;

  const daThanhToanKWSALE = filteredOrdersByArea
    .filter((order) => order.paymentStatus === "ĐÃ THANH TOÁN")
    .reduce((sum, order) => sum + order.profit, 0);
  const chuaThanhToanKWSALE = filteredOrdersByArea
    .filter(
      (order) =>
        order.paymentStatus === "CHƯA THANH TOÁN" || order.paymentStatus === ""
    )
    .reduce((sum, order) => sum + order.profit, 0);
  const tongKWSALE = daThanhToanKWSALE + chuaThanhToanKWSALE;
  const thanhToanDatSALE =
    tongKWSALE > 0 ? (daThanhToanKWSALE / tongKWSALE) * 100 : 0;
  const totalAdsKWSALE = filteredAds.reduce(
    (sum, ad) => sum + (ad.request1 + ad.request2),
    0
  );
  const percentAdsSALE =
    tongKWSALE > 0
      ? Number(
          ((totalAdsKWSALE / (tongKWSALE * exchangeRate)) * 100).toFixed(2)
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
              (emp.name || "").trim() === "Nguyễn Bá Quân"))
          //      ||
          // (currentUser.team_id === "LE" &&
          //   (emp.name || "").trim() === "Bùi Văn Phi")
      )
      .map((emp) => (emp.name || "").trim().toLowerCase());

    // Lọc các đơn hàng theo tên nhân viên thuộc team
    filteredOrders = filteredOrdersByArea.filter(
      (order) =>
        (order.mkt || "").trim().toLowerCase() &&
        teamEmployeeNames.includes((order.mkt || "").trim().toLowerCase())
    );

    // Lọc chi phí ads theo tên nhân viên thuộc team
    filteredAds = filteredAds.filter(
      (ad) =>
        (ad.name || "").trim().toLowerCase() &&
        teamEmployeeNames.includes((ad.name || "").trim().toLowerCase())
    );
  }

  // Bảng Tổng chỉ của các thành viên trong team
  const daThanhToanKW2 = filteredOrdersByArea
    .filter((order) => order.paymentStatus === "ĐÃ THANH TOÁN")
    .reduce((sum, order) => sum + order.profit, 0);
  const chuaThanhToanKW2 = filteredOrdersByArea
    .filter(
      (order) =>
        order.paymentStatus === "CHƯA THANH TOÁN" || order.paymentStatus === ""
    )
    .reduce((sum, order) => sum + order.profit, 0);
  const tongKW2 = daThanhToanKW2 + chuaThanhToanKW2;
  const thanhToanDat2 = tongKW2 > 0 ? (daThanhToanKW2 / tongKW2) * 100 : 0;
  const totalAdsKW2 = filteredAds.reduce(
    (sum, ad) => sum + (ad.request1 + ad.request2),
    0
  );
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
    0
  );
  const totalHanhChinh = saleDailyData.reduce(
    (sum, item) => sum + item.hanhChinh,
    0
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

  // Tạo ngày hôm nay
  const todayDate = new Date().toISOString().split("T")[0];

  // Lọc các nhân viên có position là salenhapdon
  const salenhapdonEmployees = filteredEmployeesByArea.filter(
    (emp) => emp.position === "salenhapdon" && emp.quocgia !== "jp"
  );

  // Tính tổng số đơn hôm nay của từng salenhapdon
  const salenhapdonOrderCounts = salenhapdonEmployees.map((emp) => {
    const count = orders.filter(
      (order) =>
        order.sale?.trim().toLowerCase() === emp.name.trim().toLowerCase() &&
        order.orderDate === todayDate
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
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
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
    now.getDate() - 1
  );

  const yesterdaySameTime = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - 1,
    now.getHours(),
    now.getMinutes(),
    now.getSeconds()
  );

  const totalYesterday = ordersMarket
    .filter((order) => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= yesterdayStart && orderDate <= yesterdaySameTime;
    })
    .reduce((sum, order) => sum + (order.revenue || 0) * rate, 0);

  const percent =
    totalYesterday > 0
      ? ((totalToday / totalYesterday) * 100).toFixed(2)
      : 0;

  return { totalToday, totalYesterday, percent };
};

const KR = calcMarketSummary(ordersKR, 17000);
const JP = calcMarketSummary(ordersJP, 150);
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
  now.getDate() - 1
);

const yesterdaySameTime = new Date(
  now.getFullYear(),
  now.getMonth(),
  now.getDate() - 1,
  now.getHours(),
  now.getMinutes(),
  now.getSeconds()
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
}
  ];
  const DONE_REPORTS = ["DONE", "BOOK TB"];
  const DONE_REPORTS2 = [ "BOOK TB"];
const SENT_DELIVERY_STATUS = ["GIAO THÀNH CÔNG", "ĐÃ GỬI HÀNG"];


const shippingReport = useMemo(() => {
  if (!filteredOrders?.length) return null;

  let A = 0;
  let B = 0;
  let E = 0;

  for (const o of filteredOrders) {
    const isDone = DONE_REPORTS.includes(o.saleReport);
    const isSent =
      isDone && SENT_DELIVERY_STATUS.includes(o.deliveryStatus);
    const isSent2 =
       DONE_REPORTS2.includes(o.saleReport);

    if (isDone) A++;
    if (isSent) B++;
    if (isSent2) E++;
  }

  const C = filteredOrders.length;
  const notSent = A - B-E;

  return {
    key: 1,
    C,
    A,
    B,
    notSent,
    percentDoneText: C ? ((A / C) * 100).toFixed(2) + "%" : "0%",
    percentSentText: A ? (((B+E) / A) * 100).toFixed(2) + "%" : "0%",
    percentNotSentText: A ? ((notSent / A) * 100).toFixed(2) + "%" : "0%",
  };
}, [filteredOrders]);

const columns = useMemo(() => [
  { title: "Tổng đơn (C)", dataIndex: "C" },
  { title: "Đơn DONE (A)", dataIndex: "A" },
  { title: "Đã gửi (B)", dataIndex: "B" },
  { title: "Chưa gửi (A-B)", dataIndex: "notSent" },
  {
    title: "% DONE",
    dataIndex: "percentDoneText",
    render: t => <Tag color="green">{t}</Tag>,
  },
  {
    title: "% ĐÃ GỬI",
    dataIndex: "percentSentText",
    render: t => <Tag color="blue">{t}</Tag>,
  },
  {
    title: "% CHƯA GỬI",
    dataIndex: "percentNotSentText",
    render: t => <Tag color="red">{t}</Tag>,
  },
], []);
  return (
    <div
      style={{
        transform: "scale(0.85)",
        transformOrigin: "top left",
        width: "115%", // Để bù lại không gian khi scale
      }}
    >
      <PraiseBanner top5Employees={top1Employees} />
      {/* <PraiseBanner2 /> */}

      <div className="criticism-container">
        <div className="marquee">
          {top5Employees.map((emp, index) => (
            <div
              key={index}
              className={`employee-item ${
                index % top5Employees.length === 0
                  ? "top1"
                  : index % top5Employees.length === 1
                  ? "top2"
                  : index % top5Employees.length === 2
                  ? "top3"
                  : ""
              }`}
            >
              <img
                src={`/${emp.name.trim()}.jpg`}
                alt={emp.name.trim()}
                className="employee-image"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "/ngockem.jpg";
                }}
              />
              <span className="employee-name">{emp.name}</span>
              <br />
              {index % top5Employees.length === 0 && (
                <span className="top-badge">🏆 TOP 1 SERVER</span>
              )}
              <br />
              {emp.totalToday * 1 * 0.95 > 15000000 && (
                <span className="employee-name2">
                  {(emp.totalToday * 1 * 0.95).toLocaleString()} VNĐ
                </span>
              )}
            </div>
          ))}
        
        {/* Vinh danh TOP 3 SALE NHẬP ĐƠN */}
      
        {currentUser.name !== "Trần" &&
          (
            <div className="marquee">
              {top5Employees2.map((emp, index) => (
                <div
                  key={index}
                  className={`employee-item ${
                    index === 0
                      ? "top1bet"
                      : index === 1
                      ? "top2"
                      : index === 2
                      ? "top3"
                      : ""
                  }`}
                >
                  <img
                    src={`/${emp.name.trim()}.jpg`}
                    alt={emp.name.trim()}
                    className="employee-image"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "/ngockem.jpg";
                    }}
                  />
                  <span className="employee-name">{emp.name}</span>
                  <br />
                  {index === 0 && (
                    <span className="top-badge">Cảnh báo doanh số thấp</span>
                  )}
                  <br />
                 
                </div>
              ))}
            </div>
          )}
          </div>
        {/* {currentUser.name !== "Trần Ngọc Lâm" &&
          currentUser.name !== "Diệp Anh" &&
          currentUser.name !== "Hoàng Thị Trà My" && (
            <div className="marquee">
              {top3SalenhapdonToday.map((emp, index) => (
                <div
                  key={index}
                  className={`employee-item ${
                    index === 0
                      ? "top1"
                      : index === 1
                      ? "top2"
                      : index === 2
                      ? "top3"
                      : ""
                  }`}
                >
                  <img
                    src={`/${emp.name.trim()}.jpg`}
                    alt={emp.name.trim()}
                    className="employee-image"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "/ngockem.jpg";
                    }}
                  />
                  <span className="employee-name">{emp.name}</span>
                  <br />
                  {index === 0 && (
                    <span className="top-badge">🏆 Best Seller</span>
                  )}
                  <br />
                  {emp.orderCount > 20 && (
                    <span className="employee-name2">
                      {emp.orderCount} đơn hàng
                    </span>
                  )}
                </div>
              ))}
            </div>
          )} */}

        <style jsx>{`
          .criticism-container {
            padding: 45px 225px;
            background: linear-gradient(135deg, #f5f7fa, #c3ecb2);
            border: 5px solid #f1c40f;
            border-radius: 15px;
            margin: 20px auto;
            max-width: 100%;
            overflow: hidden;
            position: relative;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
            text-align: center;
          }

          .criticism-container h2 {
            font-size: 2rem;
            font-weight: 700;
            margin-bottom: 40px;
            color: #2c3e50;
            text-align: center;
          }

          .marquee {
            display: flex;
            flex-wrap: nowrap;
            justify-content: center; /* Căn giữa 3 khối */
            gap: 40px; /* Khoảng cách giữa các khối */
            width: 100%;
          }

          @keyframes marquee {
            0% {
              transform: translateX(100%);
            }
            100% {
              transform: translateX(100%);
            }
          }

          .employee-item {
            flex-shrink: 0;
            width: 300px;
            margin-right: 100px;
            text-align: center;
            margin-bottom: 40px;
            padding: 10px;
            border-radius: 10px;
            background: #ffffff80;
            transition: transform 0.3s ease;
          }

          .employee-image {
            width: 220px;
            height: 200px;
            object-fit: cover;
            border-radius: 50%;
            border: 3px solid #6ab04c;
            box-shadow: 0 0 8px rgba(0, 0, 0, 0.15);
            margin-bottom: 10px;
          }

          .employee-name {
            font-size: 1.2em;
            font-weight: bold;
            color: #2c3e50;
            display: block;
            white-space: normal; /* Cho phép xuống dòng */
            word-break: break-word; /* Nếu cần tách từ */
            text-align: center;
          }

          .employee-name2 {
            font-size: 1.1em;
            font-weight: bold;
            color: #2980b9;
          }

          .top-badge {
            background-color: #e74c3c;
            color: white;
            padding: 4px 8px;
            border-radius: 20px;
            font-size: 0.9em;
            font-weight: bold;
            animation: pulse 1.5s infinite;
            display: inline-block;
            margin-top: 4px;
          }

          /* TOP 1 – Viền vàng, hiệu ứng nổi bật */
          .employee-item.top1 {
            border: 3px solid #f1c40f;
            box-shadow: 0 0 20px 5px rgba(26, 241, 15, 0.6);
            transform: scale(1.1);
          }

          .employee-item.top1bet {
  position: relative;
  border: 3px solid #f12d0f;
  box-shadow: 0 0 20px 5px rgba(241, 15, 15, 0.6);
  transform: scale(1.15);
  overflow: hidden; /* để không bị tràn đường chéo */
}

/* thêm gạch chéo đỏ */
.employee-item.top1bet::before {
  content: "";
  position: absolute;
  top: 50%;
  left: -10%;
  width: 120%;
  height: 6px;
  background: #f12d0f;
  transform: rotate(-25deg);
  transform-origin: center;
  box-shadow: 0 0 5px rgba(241, 15, 15, 0.8);
}
  .employee-item.top1bet::after {
  content: "";
  position: absolute;
  top: 50%;
  left: -10%;
  width: 120%;
  height: 6px;
  background: #f12d0f;
  transform: rotate(25deg);
  transform-origin: center;
  box-shadow: 0 0 5px rgba(241, 15, 15, 0.8);
}

          /* TOP 2 – Viền bạc */
          .employee-item.top2 {
            border: 3px solid #1a6191ff;
            box-shadow: 0 0 30px 5px rgba(185, 221, 26, 0.4);
            transform: scale(1.1);
          }

          /* TOP 3 – Viền đồng */
          .employee-item.top3 {
            border: 3px solid #d2a06eff;
            box-shadow: 0 0 5px 1px rgba(205, 127, 50, 0.3);
          }

          @keyframes pulse {
            0% {
              box-shadow: 0 0 0 0 rgba(231, 76, 60, 0.7);
            }
            70% {
              box-shadow: 0 0 0 10px rgba(231, 76, 60, 0);
            }
            100% {
              box-shadow: 0 0 0 0 rgba(231, 76, 60, 0);
            }
          }

          @media (max-width: 768px) {
            .employee-item {
              width: 140px;
              margin-right: 40px;
            }
            .employee-image {
              width: 80px;
              height: 80px;
            }
          }
        `}</style>
      </div>
<Row gutter={8} style={{ marginBottom: 16 }}>
  <Col>
    <Radio.Group
  value={selectedArea}
  onChange={(e) => setSelectedArea(e.target.value)}
  style={{ display: "flex", gap: 12 }}
>
  <Radio.Button value="all">Tất cả</Radio.Button>
  <Radio.Button value="da">Đông Anh</Radio.Button>
  <Radio.Button value="pvd">Phạm Văn Đồng</Radio.Button>
</Radio.Group>
  </Col>
</Row>
      {/* Bộ lọc */}
      {(currentUser.position === "lead" ||
        (currentUser.position === "admin" && selectedTeam) ||
        (currentUser.position === "managerMKT" && selectedTeam)) && (
        <Row gutter={[16, 16]}>
          
          <Col xs={24} md={16}>
            <Row>
              <Col xs={24} md={7}>
                <div style={{ marginBottom: "1rem" }}>
                  <label
                    htmlFor="dateFilter"
                    style={{ marginRight: "0.5rem", marginTop: "2rem" }}
                  >
                    Chọn ngày:
                  </label>
                  <input
                    type="date"
                    id="dateFilter"
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setSelectedPreset("");
                    }}
                  />
                </div>
              </Col>
              <Col xs={24} md={9}>
                <div style={{ marginBottom: "1rem" }}>
                  {/* <label htmlFor="presetFilter" style={{ marginRight: "0.5rem" }}>Chọn khoảng thời gian:</label> */}

                  <Select
                    allowClear
                    id="presetFilter"
                    style={{ width: 300 }}
                    placeholder="Chọn khoảng thời gian"
                    value={selectedPreset || undefined}
                    onChange={(value) => {
                      setSelectedPreset(value);
                      setSelectedDate("");
                    }}
                  >
                    <Option value="today">Hôm Nay</Option>
                    <Option value="yesterday">Hôm Qua</Option>
                    <Option value="week">1 Tuần gần nhất</Option>
                    <Option value="currentMonth">
                      1 Tháng (Từ đầu tháng đến hiện tại)
                    </Option>
                    <Option value="lastMonth">Tháng trước</Option>
                    <Option value="twoMonthsAgo">2 Tháng trước</Option>
                    <Option value="threeMonthsAgo">3 Tháng trước</Option>
                  </Select>
                </div>
              </Col>
              {(currentUser.position === "admin" ||
                currentUser.position === "managerMKT") && (
                <Col xs={24} sm={12} md={8}>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <span style={{ marginRight: 8 }}>Chọn team: </span>
                    <Select
                      allowClear
                      value={selectedTeam}
                      style={{ width: "100%", maxWidth: "200px" }}
                      onChange={(value) => setSelectedTeam(value)}
                    >
                      {teams.map((team) => (
                        <Option key={team.value} value={team.value}>
                          {team.label}
                        </Option>
                      ))}
                    </Select>
                    
                  </div>
                </Col>
              )}
              {currentUser.position === "lead" && (
                <Col xs={24} sm={12} md={8}>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <span style={{ marginRight: 8 }}>Chọn team: </span>
                    <Select
                      disabled={
                        ![6518, 4365].includes(currentUser.employee_code)
                      }
                      allowClear
                      value={selectedTeam}
                      style={{ width: "100%", maxWidth: "200px" }}
                      onChange={(value) => setSelectedTeam(value)}
                    >
                      {currentUser.employee_code === 6518 && (
                        <>
                          <Option key={1234} value="SON">
                            TEAM SƠN
                          </Option>
                          <Option key={1235657} value="QUAN">
                            TEAM QUÂN
                          </Option>
                          <Option key={123565788} value="DIEU">
                            TEAM DIỆU
                          </Option>
                        </>
                      )}

                      {currentUser.employee_code === 4365 && (
                        <>
                          <Option key={1234435} value="LE">
                            TEAM LẺ
                          </Option>
                          <Option key={1235657434} value="PHI">
                            TEAM PHI
                          </Option>
                        </>
                      )}
                    </Select>
                  </div>
                </Col>
              )}
            </Row>
          </Col>
          <Col xs={24} md={8}>
            <Table
              columns={totalColumns3}
              dataSource={totalData3}
              pagination={false}
            />
          </Col>
        </Row>
      )}
      {((currentUser.position === "admin" && !selectedTeam) ||
        (currentUser.position === "managerMKT" && !selectedTeam) ||
        currentUser.position === "managerSALE" ||
        currentUser.position === "leadSALE") && (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={16}>
              <Row>
                <Col xs={24} md={5}>
                  <div style={{ marginBottom: "1rem" }}>
                    <label
                      htmlFor="dateFilter"
                      style={{ marginRight: "0.5rem", marginTop: "2rem" }}
                    >
                      Chọn ngày:
                    </label>
                    <input
                      type="date"
                      id="dateFilter"
                      value={selectedDate}
                      onChange={(e) => {
                        setSelectedDate(e.target.value);
                        setSelectedPreset("");
                      }}
                    />
                  </div>
                </Col>
                <Col xs={24} md={7}>
                  <div style={{ marginBottom: "1rem" }}>
                    {/* <label htmlFor="presetFilter" style={{ marginRight: "0.5rem" }}>Chọn khoảng thời gian:</label> */}

                    <Select
                      allowClear
                      id="presetFilter"
                      style={{ width: 300 }}
                      placeholder="Chọn khoảng thời gian"
                      value={selectedPreset || undefined}
                      onChange={(value) => {
                        setSelectedPreset(value);
                        setSelectedDate("");
                      }}
                    >
                      <Option value="today">Hôm Nay</Option>
                      <Option value="yesterday">Hôm Qua</Option>
                      <Option value="week">1 Tuần gần nhất</Option>
                      <Option value="currentMonth">
                        1 Tháng (Từ đầu tháng đến hiện tại)
                      </Option>
                      <Option value="lastMonth">Tháng trước</Option>
                      <Option value="twoMonthsAgo">2 Tháng trước</Option>
                      <Option value="threeMonthsAgo">3 Tháng trước</Option>
                    </Select>
                  </div>
                </Col>
               
                <Col xs={24}  md={7}>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <span style={{ marginRight: 8 }}>Chọn team: </span>
                    <Select
                      allowClear
                      value={selectedTeam}
                      style={{ width: "100%", maxWidth: "200px" }}
                      onChange={(value) => setSelectedTeam(value)}
                    >
                      {teams.map((team) => (
                        <Option key={team.value} value={team.value}>
                          {team.label}
                        </Option>
                      ))}
                    </Select>
                  </div>
                </Col>
                 <Col xs={24} md={7}>
                  <div style={{ marginBottom: "1rem" }}>
                    {/* <label htmlFor="presetFilter" style={{ marginRight: "0.5rem" }}>Chọn khoảng thời gian:</label> */}

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
    }))
  }
/>

                  </div>
                </Col>
              </Row>
            </Col>
          </Row>
          <Row>
            <Col xs={24} md={12}>
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
    <h3>MKT</h3>
    <Table
      columns={summaryColumns}
      dataSource={summaryMKT}
      pagination={false}
      bordered
      size="middle"
      style={{ marginBottom: 20 }}
    />
  </>
) : (
  <>
    <h3>HÀN QUỐC</h3>
    <Table
      columns={summaryColumns}
      dataSource={summaryKR}
      pagination={false}
      bordered
      size="middle"
      style={{ marginBottom: 20 }}
    />

    <h3>NHẬT BẢN</h3>
    <Table
      columns={summaryColumns}
      dataSource={summaryJP}
      pagination={false}
      bordered
      size="middle"
      style={{ marginBottom: 20 }}
    />

    <h3>ĐÀI LOAN</h3>
    <Table
      columns={summaryColumns}
      dataSource={summaryTW}
      pagination={false}
      bordered
      size="middle"
    />
  </>
)}

              



            
              <h2 style={{ marginTop: "2rem" }}>Tổng khách thanh toán</h2>
              <Table
                columns={totalColumns}
                dataSource={totalData}
                pagination={false}
              />
              <h2 style={{ marginTop: "2rem" }}>Doanh số (SALE)</h2>
              <Table
                columns={totalColumns}
                dataSource={totalDataSALE}
                pagination={false}
              />
            </Col>
            <Col xs={24} md={2}></Col>
            <Col xs={24} md={10}>
            {(currentUser.position === "admin" ||
                            currentUser.position === "managerMKT"||currentUser.position === "managerSALE"||currentUser.position === "leadSALE" ) && (
                            <>
                              <h2 style={{  }}>Thống kê đơn hàng</h2>
                              <Table
              pagination={false}
              dataSource={shippingReport ? [shippingReport] : []}
              columns={columns}
            />
                            </>
                          )}
              <h2 style={{ marginTop: "2rem" }}>
                Thống kê để giục chuyển khoản
              </h2>
              <Table
                columns={transferColumns}
                dataSource={transferData}
                pagination={false}
              />
              
              {(currentUser.position === "admin" ||
                currentUser.position === "managerMKT") && (
                <>
                  <h2 style={{ marginTop: "2rem" }}>Doanh Số (MKT)</h2>
                  <Table
                    columns={totalColumns3}
                    dataSource={totalData4}
                    pagination={false}
                  />
                </>
              )}
            </Col>
          </Row>
        </>
      )}
      <br></br>

      {(currentUser.position === "admin" && !selectedTeam) ||
      (currentUser.position === "managerMKT" && !selectedTeam) ||
      (currentUser.position === "managerSALE" && !selectedTeam) ? (
        <Tabs defaultActiveKey="MKT">
          <Tabs.TabPane tab="MKT" key="MKT">
            <Row gutter={[16, 16]} style={{ marginTop: "2rem" }}>
              <Col xs={24} md={24}>
              
                <h3>Doanh số Nhân viên MKT</h3>

                <GroupedDoubleBarChartComponent data={employeeChartDataNew} />
              </Col>
              {/* <Col xs={24} md={1}></Col> */}
              <Col xs={24} md={24}>
                <h3 style={{ marginTop: "2rem" }}>
                  {isFilterApplied
                    ? "Doanh số hàng ngày "
                    : "Doanh số hàng ngày "}
                </h3>
                <GroupedDoubleBarChartComponent data={dailyChartDataNew} />
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              <Col xs={24} md={24}></Col>
              <Col xs={24} md={24}></Col>
            </Row>

            <Row gutter={[16, 16]}>
              <Col xs={24} md={24}></Col>
            </Row>

            {/* Báo cáo Marketing và các biểu đồ cũ */}
            <Row gutter={[16, 16]} style={{ marginTop: "2rem" }}>
              <Col xs={24} md={14}>
                <h3>Doanh số theo Team</h3>
                <GroupedDoubleBarChartComponent3 data={teamChartDataNew} />
              </Col>
              <Col xs={24} md={2}></Col>
              {/* <Col xs={24} md={1}></Col> */}
              <Col xs={24} md={8}>
                <br></br>
                <br></br>
                <h3>Phần trăm doanh số theo Team</h3>
                <PieChartComponent data={teamPieData} />
              </Col>
            </Row>
            <Row gutter={[16, 16]} style={{ marginTop: "2rem" }}>
              <Col xs={24} md={15}>
                <h3 style={{ marginTop: "2rem" }}>
                  Doanh số trung bình theo Nhân viên theo Team
                </h3>
                <BarChartComponent data={averageTeamChartData} />
              </Col>
              {/* <Col xs={24} md={1}></Col> */}
              <Col xs={24} md={18}>
                <br></br>

                {/* <h3 style={{ marginTop: "2rem" }}>
      So sánh %ADS : Gồm Leader vs Các nhân viên khác trong Team
    </h3>
    <GroupedBarChartComponent data={leaderComparisonChartData} /> */}
              </Col>
            </Row>
            <Row gutter={[16, 16]}>
              <Col xs={24} md={5}></Col>
              <Col xs={24} md={14}></Col>
              <Col xs={24} md={5}></Col>
            </Row>
            <Row gutter={[16, 16]}>
              <Col xs={24} md={24}>
                <h2>Báo cáo marketing</h2>
                <Table
                  columns={marketingColumns}
                  dataSource={marketingReportData}
                  pagination={false}
                />
              </Col>
            </Row>
            {/* <h3 style={{ marginTop: "2rem" }}>
      So sánh %ADS : Gồm Leader vs Các nhân viên khác trong Team
    </h3>
    <GroupedBarChartComponent data={leaderComparisonChartData} /> */}
          </Tabs.TabPane>
          <Tabs.TabPane tab="SALE" key="SALE">
            <Row gutter={[16, 16]}>
              <Col xs={24} md={24}>
                <h3>Doanh số Nhân viên SALE</h3>

                <GroupedDoubleBarChartComponent2
                  data={employeeChartDataNewsale}
                />
              </Col>
            </Row>

            {/* Các bảng báo cáo SALE */}
            <Row gutter={[16, 16]}>
              <Col xs={24} md={14}>
                <h2 style={{ marginTop: "2rem" }}>Báo cáo doanh số ngày</h2>
                <Table
                  columns={dailySaleColumns}
                  dataSource={[...saleDailyData].sort(
                    (a, b) => new Date(b.date) - new Date(a.date)
                  )}
                  pagination={7}
                />{" "}
              </Col>
              <Col xs={24} md={1}></Col>

              <Col xs={24} md={9}>
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <PieChartComponent data={salePieData} />
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              <Col xs={24} md={15}></Col>
              <Col xs={24} md={7}></Col>
            </Row>
            <h2 style={{ marginTop: "2rem" }}>
              Báo cáo Doanh Số Nhân Viên Sale XỬ LÝ
            </h2>
            <Table
              columns={saleColumns}
              dataSource={saleReportDataXL}
              pagination={false}
            />
            <h2 style={{ marginTop: "2rem" }}>
              Báo cáo Doanh Số Nhân Viên Sale ONLINE
            </h2>
            <Table
              columns={saleColumnsOLND}
              dataSource={saleReportDataOL}
              pagination={false}
            />
            <h2 style={{ marginTop: "2rem" }}>
              Báo cáo Doanh Số Nhân Viên Sale NHẬP ĐƠN
            </h2>
            <Table
              columns={saleColumnsOLND}
              dataSource={saleReportDataND}
              pagination={false}
            />
          </Tabs.TabPane>
        </Tabs>
      ) : currentUser.position === "leadSALE" ||
        currentUser.position === "managerSALE" ? (
        <Tabs>
          <Tabs.TabPane tab="SALE" key="SALE">
            {/* Các bảng báo cáo SALE */}
            <Row gutter={[16, 16]}>
              <Col xs={24} md={15}>
                <h2 style={{ marginTop: "2rem" }}>Báo cáo doanh số ngày</h2>
                <Table
                  columns={dailySaleColumns}
                  dataSource={[...saleDailyData].sort(
                    (a, b) => new Date(b.date) - new Date(a.date)
                  )}
                  pagination={7}
                />

                <Row gutter={[16, 16]}>
                  <Col xs={24} md={10}></Col>
                  <Col xs={24} md={10}>
                    <PieChartComponent data={salePieData} />
                  </Col>
                </Row>
              </Col>
              <Col xs={24} md={9}>
                <br />

                <h2 style={{ marginTop: "2rem" }}>
                  Báo cáo Doanh Số Nhân Viên Sale Vận Đơn
                </h2>
                <Table
                  columns={saleColumns}
                  dataSource={saleReportDataXL}
                  pagination={false}
                />
                <h2 style={{ marginTop: "2rem" }}>
                  Báo cáo Doanh Số Nhân Viên Sale ONLINE
                </h2>
                <Table
                  columns={saleColumnsOLND}
                  dataSource={saleReportDataOL}
                  pagination={false}
                />
                <h2 style={{ marginTop: "2rem" }}>
                  Báo cáo Doanh Số Nhân Viên Sale NHẬP ĐƠN
                </h2>
                <Table
                  columns={saleColumnsOLND}
                  dataSource={saleReportDataND}
                  pagination={false}
                />
              </Col>
            </Row>
            <h3>Doanh số Nhân viên SALE</h3>

            <GroupedDoubleBarChartComponent2 data={employeeChartDataNewsale} />
            <h3 style={{ marginTop: "2rem" }}>
              {isFilterApplied ? "Doanh số hàng ngày " : "Doanh số hàng ngày "}
            </h3>
            <GroupedDoubleBarChartComponent data={dailyChartDataNew} />
          </Tabs.TabPane>
        </Tabs>
      ) : null}
      {(currentUser.position === "lead" ||
        (currentUser.position === "admin" && selectedTeam) ||
        (currentUser.position === "managerMKT" && selectedTeam)) && (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={14}></Col>
          </Row>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={14}>
              <h2>Báo cáo marketing</h2>
              <Table
                columns={marketingColumns}
                dataSource={marketingReportDataTEAM}
                pagination={false}
              />
            </Col>
            <Col xs={24} md={10}>
              <br></br>

              <h3>Doanh số Nhân viên MKT</h3>

              <GroupedDoubleBarChartComponentTEAM
                data={employeeChartDataNewTEAM}
              />
            </Col>
          </Row>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={14}>
              <h3 style={{ marginTop: "2rem" }}>
                {isFilterApplied
                  ? "Doanh số hàng ngày "
                  : "Doanh số hàng ngày "}
              </h3>
              <GroupedDoubleBarChartComponentTEAM
                data={dailyChartDataNewTEAM}
              />
            </Col>
            <Col xs={24} md={10}>
              <br></br>
              <h3>Phần trăm doanh số thành viên</h3>
              <PieChartComponent data={employeePieDataTEAM} />
            </Col>
          </Row>
        </>
      )}
      {currentUser.position === "mkt" && (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={14}>
              <h3 style={{ marginTop: "2rem" }}>
                {isFilterApplied
                  ? "Doanh số hàng ngày "
                  : "Doanh số hàng ngày "}
              </h3>
              <GroupedDoubleBarChartComponentTEAM
                data={dailyChartDataNewTEAM}
              />
            </Col>
            <Col xs={24} md={10}>
              <br></br> <br></br> <br></br>
              <h3>Phần trăm doanh số thành viên</h3>
              <PieChartComponent data={employeePieDataTEAM} />
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};
export default Dashboard;
