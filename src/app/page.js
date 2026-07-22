"use client";
import React, { useState, useEffect, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import {
  Select,Radio ,
  Row,
  Tag,
  Col,
  Table,
  Card,
  Button,
  Input,
  Tabs,
  message,
  DatePicker,
  Divider,
} from "antd";
import moment from "moment";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import PraiseBanner2 from "./components/PraiseBanner2";
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
  const [selectedPreset, setSelectedPreset] = useState("null");
  const [selectedArea, setSelectedArea] = useState("all");
  
  // Ngày hiện tại định dạng YYYY-MM-DD

  // State cho bộ lọc: selectedDate mặc định là ngày hiện tại, và preset

  // State cho tỉ giá VNĐ và ô nhập giá trị
  const [exchangeRate, setExchangeRate] = useState(17000);
  const [exchangeRateInput, setExchangeRateInput] = useState(17000);
  const reduxCurrentUser = useSelector((state) => state.user.currentUser) || {};

  const currentUser = useMemo(() => {
    return {
      ...reduxCurrentUser,
      team_id: selectedTeam,
    };
  }, [reduxCurrentUser, selectedTeam]);
  
  // Track initial load to prevent duplicate calls
  const isInitialLoadRef = useRef(false);
  
  useEffect(() => {
    if (!currentUser.name) {
      router.push("/login");
    }
  }, []);

  // Only set selectedPreset once on mount based on user position
  useEffect(() => {
    if (isInitialLoadRef.current) return;
    isInitialLoadRef.current = true;
    
    if (currentUser.position === "lead") {
      setSelectedPreset("week");
    } else {
      setSelectedPreset("currentMonth");
    }
  }, [currentUser]);
  const fetchOrders = async () => {
    try {
      let url = "/api/orders2";

      if (selectedPreset && selectedPreset !== "all") {
        url += `?selectedPreset=${selectedPreset}`;
      } else if (selectedDate) {
        url += `?selectedDate=${selectedDate}`;
      }

      const response = await axios.get(url);
      setOrders(response.data.data);
    } catch (error) {
      console.error(error);
      message.error("Lỗi khi lấy đơn hàng");
    }
  };
  const fetchRecords = async () => {
    try {
      const response = await axios.get("/api/recordsMKT");
      setAdsMoneyData(response.data.data);
    } catch (error) {
      console.error(error);
      message.error("Lỗi khi lấy danh sách");
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
    // Skip if selectedPreset is null/undefined
    if (!selectedPreset || selectedPreset === 'null') {
      return;
    }
    
    // Prevent multiple rapid calls
    if (isInitialLoadRef.current === 'fetching') {
      return;
    }
    isInitialLoadRef.current = 'fetching';
    
    fetchOrders();
    
    // Reset flag after delay
    const timeoutId = setTimeout(() => {
      if (isInitialLoadRef.current === 'fetching') {
        isInitialLoadRef.current = true;
      }
    }, 2000);
    
    return () => clearTimeout(timeoutId);
  }, [selectedPreset]);

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

            <Legend wrapperStyle={{ border: "2px solid #1677ff", borderRadius: 8, padding: "8px 12px" }} formatter={(value) => value === "profit" ? "Doanh thu" : value} />
            <Bar dataKey="profit" fill="#8884d8" radius={[6, 6, 0, 0]}>
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
        const { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } = require("recharts");
        const COLORS = [
          "#AA336A",
          " #FFBB28",
          "#00C49F",
          "#FF8042",
          "#0088FA",
          "#5A2D82",
          "#144523",
        ];
        return (
          <ResponsiveContainer width="100%" height={520}>
            <PieChart>
              <Pie
                data={data}
                dataKey="profit"
                nameKey="name"
                cx="50%"
                cy="55%"
                innerRadius={0}
                outerRadius={140}
                label={({ name, percent }) => `${name}`}
                labelLine={false}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value) => value.toLocaleString("vi-VN")} />

              <Legend
                layout="horizontal"
                verticalAlign="bottom"
                align="center"
                wrapperStyle={{
                  paddingTop: "16px",
                  border: "2px solid #1677ff",
                  borderRadius: 8,
                  padding: "12px 16px",
                  marginTop: "10px",
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "6px 14px",
                  fontWeight: 600,
                }}
                formatter={(value) => value === "profit" ? "Doanh thu" : value}
              />
            </PieChart>
          </ResponsiveContainer>
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

  // Helper function để lấy màu avatar theo tên
  const getAvatarColor = (name) => {
    const colors = ["#00b894", "#e17055", "#0984e3", "#fdcb6e", "#6c5ce7", "#fd79a8", "#00cec9", "#d63031"];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // Styles cho custom table
  const thStyle = {
    padding: "12px 14px",
    textAlign: "left",
    borderTop: "1px solid #e0e0e0",
    borderBottom: "2px solid #E9DABC",
    borderLeft: "1px solid #e0e0e0",
    borderRight: "1px solid #e0e0e0",
    fontWeight: "bold",
    fontSize: "12px",
    textTransform: "uppercase",
    color: "#595959",
    backgroundColor: "#fafafa"
  };

  const tdStyle = {
    padding: "10px 14px",
    textAlign: "left",
    borderBottom: "1px solid #f0f0f0",
    borderLeft: "1px solid #f0f0f0",
    borderRight: "1px solid #f0f0f0",
    fontWeight: "500",
    color: "#000",
    verticalAlign: "middle"
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
  //             <Legend wrapperStyle={{ border: "2px solid #1677ff", borderRadius: 8, padding: "8px 12px" }} formatter={(value) => value === "profit" ? "Doanh thu" : value} />
  //             <Bar dataKey="profit" fill="#8884d8" radius={[6, 6, 0, 0]}>
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
              <defs>
                <linearGradient id="roundedBarProfitGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a78bfa" stopOpacity={1} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0.85} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="name"
                tickFormatter={(fullName) => formatEmployeeName(fullName)}
                stroke="#64748b"
              />

              <YAxis tickFormatter={formatYAxisTick} tickCount={6} stroke="#64748b" />

              <Tooltip
                cursor={{ fill: "rgba(99,102,241,0.08)" }}
                formatter={(value) => value.toLocaleString("vi-VN")}
                contentStyle={{
                  background: "rgba(15, 23, 42, 0.95)",
                  border: "none",
                  borderRadius: 10,
                  color: "#fff",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
                  padding: "10px 14px",
                  fontSize: 13,
                }}
                itemStyle={{ color: "#fff" }}
                labelStyle={{ color: "#a5b4fc", fontWeight: 600 }}
              />
              <Legend wrapperStyle={{ border: "2px solid #1677ff", borderRadius: 8, padding: "8px 12px" }} formatter={(value) => value === "profit" ? "Doanh thu" : value} />
              <Bar
                dataKey="profit"
                fill="url(#roundedBarProfitGrad)"
                radius={[12, 12, 0, 0]}
                maxBarSize={48}
              >
                <LabelList
                  dataKey="profit"
                  formatter={formatYAxisTick}
                  position="top"
                  style={{ fill: "#475569", fontSize: 11, fontWeight: 600 }}
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
              <Legend wrapperStyle={{ border: "2px solid #1677ff", borderRadius: 8, padding: "8px 12px" }} formatter={(value) => value === "profit" ? "Doanh thu" : value} />
              <Bar dataKey="profit" fill="#8884d8" radius={[6, 6, 0, 0]}>
                <LabelList
                  dataKey="profit"
                  formatter={formatYAxisTick}
                  position="top"
                />
              </Bar>
              <Bar dataKey="adsCost" fill="#FF8042" radius={[6, 6, 0, 0]}>
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
            <Legend wrapperStyle={{ border: "2px solid #1677ff", borderRadius: 8, padding: "8px 12px" }} formatter={(value) => value === "profit" ? "Doanh thu" : value} />
            <Bar dataKey="profit" fill="#8884d8" radius={[6, 6, 0, 0]}>
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
            <Legend wrapperStyle={{ border: "2px solid #1677ff", borderRadius: 8, padding: "8px 12px" }} formatter={(value) => value === "profit" ? "Doanh thu" : value} />
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
              <defs>
                {[
                  { id: "rbSaleGrad1", from: "#f59e0b", to: "#fb923c" },
                  { id: "rbSaleGrad2", from: "#3b82f6", to: "#6366f1" },
                  { id: "rbSaleGrad3", from: "#10b981", to: "#22c55e" },
                  { id: "rbSaleGrad4", from: "#8b5cf6", to: "#a855f7" },
                  { id: "rbSaleGrad5", from: "#ec4899", to: "#db2777" },
                  { id: "rbSaleGrad6", from: "#06b6d4", to: "#0ea5e9" },
                  { id: "rbSaleGrad7", from: "#f43f5e", to: "#ef4444" },
                  { id: "rbSaleGrad8", from: "#84cc16", to: "#65a30d" },
                ].map((g) => (
                  <linearGradient
                    key={g.id}
                    id={g.id}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor={g.from} stopOpacity={1} />
                    <stop offset="100%" stopColor={g.to} stopOpacity={0.85} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="name"
                tickFormatter={(fullName) => formatEmployeeName(fullName)}
                stroke="#64748b"
              />
              <YAxis tickFormatter={formatYAxisTick} stroke="#64748b" />
              <Tooltip
                cursor={{ fill: "rgba(99,102,241,0.08)" }}
                formatter={(value) => value.toLocaleString("vi-VN")}
                contentStyle={{
                  background: "rgba(15, 23, 42, 0.95)",
                  border: "none",
                  borderRadius: 10,
                  color: "#fff",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
                  padding: "10px 14px",
                  fontSize: 13,
                }}
                itemStyle={{ color: "#fff" }}
                labelStyle={{ color: "#a5b4fc", fontWeight: 600 }}
              />

              <Legend wrapperStyle={{ border: "2px solid #1677ff", borderRadius: 8, padding: "8px 12px" }} formatter={(value) => value === "profit" ? "Doanh thu" : value} />
              <Bar
                dataKey="profit"
                radius={[12, 12, 0, 0]}
                maxBarSize={48}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={`url(#rbSaleGrad${(index % 8) + 1})`}
                  />
                ))}
                <LabelList
                  dataKey="profit"
                  formatter={formatYAxisTick}
                  position="top"
                  style={{ fill: "#475569", fontSize: 11, fontWeight: 600 }}
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

            <Legend wrapperStyle={{ border: "2px solid #1677ff", borderRadius: 8, padding: "8px 12px" }} formatter={(value) => value === "profit" ? "Doanh thu" : value} />
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

  // Biểu đồ tròn Sáng sớm / Hành chính / Tối cho SALE
  const SalePieChartOuter = dynamic(
    () =>
      Promise.resolve(({ data, total }) => {
        const { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } = require("recharts");
        const COLOR_LIST = ["#f59e0b", "#3b82f6", "#8b5cf6"];
        const ICONS = {
          "Sáng sớm": "🌅",
          "Hành chính": "🕘",
          "Tối": "🌙",
        };
        return (
          <div className="sale-pie-wrap">
            <div className="sale-pie-total">
              <span className="sale-pie-total-label">Tổng doanh số</span>
              <span className="sale-pie-total-value">
                {(total || 0).toLocaleString("en-US")}
              </span>
              <span className="sale-pie-total-unit">KRW</span>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <defs>
                  {COLOR_LIST.map((c, i) => (
                    <linearGradient
                      key={c}
                      id={`sale-pie-grad-${i}`}
                      x1="0"
                      y1="0"
                      x2="1"
                      y2="1"
                    >
                      <stop offset="0%" stopColor={c} stopOpacity={0.95} />
                      <stop offset="100%" stopColor={c} stopOpacity={0.65} />
                    </linearGradient>
                  ))}
                </defs>
                <Tooltip
                  contentStyle={{
                    background: "rgba(15, 23, 42, 0.95)",
                    border: "none",
                    borderRadius: 10,
                    color: "#fff",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
                    padding: "10px 14px",
                    fontSize: 13,
                  }}
                  itemStyle={{ color: "#fff" }}
                  formatter={(value, name) => [`${value}%`, name]}
                />
                <Pie
                  data={data}
                  dataKey="profit"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={120}
                  paddingAngle={3}
                  stroke="none"
                  label={({ name, percent }) =>
                    `${ICONS[name] || ""} ${(percent * 100).toFixed(1)}%`
                  }
                  labelLine={false}
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={`url(#sale-pie-grad-${index})`}
                      style={{ filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.15))" }}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="sale-pie-legend">
              {data.map((d, i) => (
                <div className="sale-pie-legend-item" key={d.name}>
                  <span
                    className="sale-pie-legend-dot"
                    style={{ background: COLOR_LIST[i] }}
                  />
                  <span className="sale-pie-legend-label">
                    {ICONS[d.name] || ""} {d.name}
                  </span>
                  <span className="sale-pie-legend-value">{d.profit}%</span>
                </div>
              ))}
            </div>
          </div>
        );
      }),
    { ssr: false }
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

const filteredOrdersByArea =
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
const filteredOrdersByArea2 =
  selectedArea === "all"
    ? filteredOrders
    : filteredOrders.filter((order) => {
        const mkt = order.mkt?.trim().toLowerCase();
      
        return (
         
          areaEmployeeNames.includes(mkt) 
      
        );
      });



  // Lọc chi phí ads theo cùng bộ lọc (dùng field 'date')
  let filteredAds = adsMoneyData;
  let filteredOrdersOriginal = filteredOrders;
  let filteredAdsOriginal = filteredAds;
  if (selectedPreset) {
    filteredAds = filterByPreset(
      adsMoneyData.map((ad) => ({ ...ad, orderDate: ad.date })),
      selectedPreset
    ).map((ad) => ({ ...ad, date: ad.orderDate }));
  } else if (selectedDate) {
    filteredAds = adsMoneyData.filter((ad) => ad.date === selectedDate);
  }
const filteredAdsByArea =
  selectedArea === "all"
    ? filteredAds
    : filteredAds.filter((ad) => {
        const name = ad.name?.trim().toLowerCase();
        return areaEmployeeNames.includes(name);
      });
  // === Biểu đồ doanh số theo nhân viên (Grouped Double Bar Chart) ===
  const mktEmployees = filteredEmployeesByArea.filter((emp) => emp.position_team === "mkt" && emp.quocgia === "kr");
  const mktEmployeesPVD = filteredEmployeesByArea.filter((emp) => emp.position_team === "mkt" && emp.quocgia === "kr"&&emp.khuvuc === "pvd");

  const employeeChartDataNew = mktEmployees.map((emp) => {
    const sales = filteredOrdersByArea
    .filter(
        (order) =>
          order.mkt.trim().toLowerCase() === emp.name.trim().toLowerCase()
      )
      .reduce((sum, order) => {
    const value = Number(order.profitmkt ?? order.profit ?? 0);
    return sum + (isNaN(value) ? 0 : value);
  }, 0);
    const adsCost = filteredAdsByArea
      .filter(
        (ad) => ad.name.trim().toLowerCase() === emp.name.trim().toLowerCase()
      )
      .reduce((sum, ad) => sum + (ad.request1 + ad.request2), 0);
    return { name: emp.name, profit: sales * 17000 * 0.95, adsCost };
  });

  // Tạo dữ liệu cho PieChart dựa trên doanh số của từng thành viên (MKT)
  const totalProfit = employeeChartDataNew.reduce((sum, emp) => sum + (emp.profit || 0), 0);
  const employeePieData = employeeChartDataNew.map((emp) => ({
    ...emp,
    percent: totalProfit > 0 ? Number((emp.profit / totalProfit) * 100).toFixed(2) : 0,
  }));

  const teamEmployees = mktEmployees.filter(
    (emp) =>
      emp.team_id === currentUser.team_id ||
      (currentUser.team_id === "SON" &&
        (emp.name.trim() === "Nguyễn Thị Xuân Diệu" ||
          emp.name.trim() === "Nguyễn Bá Quân")) 
      //     ||
      // (currentUser.team_id === "PHONG" && emp.name.trim() === "Bùi Văn Phi")
  );

  const employeeChartDataNewTEAM = teamEmployees.map((emp) => {
    
    const sales = filteredOrdersByArea
    .filter(
        (order) =>
          order.mkt.trim().toLowerCase() === emp.name.trim().toLowerCase()
      )
      .reduce((sum, order) => {
    const value = Number(order.profitmkt ?? order.profit ?? 0);
    return sum + (isNaN(value) ? 0 : value);
  }, 0);
    const adsCost = filteredAds
      .filter(
        (ad) => ad.name.trim().toLowerCase() === emp.name.trim().toLowerCase()
      )
      .reduce((sum, ad) => sum + (ad.request1 + ad.request2), 0);
    return { name: emp.name, profit: sales * 17000 * 0.95, adsCost };
  });

  const saleEmployees = filteredEmployeesByArea.filter((emp) => emp.position_team === "sale" && emp.quocgia === "kr" );
  const saleEmployees2 = filteredEmployeesByArea.filter(
    (emp) =>
      emp.quocgia === "kr" &&
      (emp.position === "salenhapdon" ||
        emp.position === "salexuly" ||
        emp.position === "salefull")
  );
  const saleEmployeesND = filteredEmployeesByArea.filter(
    (emp) => emp.position_team === "sale" && emp.position === "salenhapdon" && emp.quocgia === "kr"
  );
  const saleEmployeesOL = filteredEmployeesByArea.filter(
    (emp) => emp.position_team === "sale" && emp.position === "salefull" && emp.quocgia === "kr"
  );
  const saleEmployeesXL = filteredEmployeesByArea.filter(
    (emp) => emp.position_team === "sale" && emp.position === "salexuly" && emp.quocgia === "kr"
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

    return { name: emp.name, profit: sales * 17000, fill: fillColor };
  });

  // // === Biểu đồ doanh số theo team (Grouped Double Bar Chart) ===
  const teamChartDataNew2 = teams.map((team) => {
    const teamEmps = filteredEmployeesByArea.filter(
      (emp) => emp.position_team === "mkt" && emp.team_id === team.value
    );
    const sales = teamEmps.reduce((acc, emp) => {
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
    return { name: team.label, profit: sales * 17000 * 0.95, adsCost };
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
  //   return { name: team.label, profit: sales*17000, adsCost };
  // });

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
    const sales = teamEmps.reduce((acc, emp) => {
      const empSales = filteredOrdersByArea
        .filter(
          (order) =>
            order.mkt.trim().toLowerCase() === emp.name.trim().toLowerCase()
        )
       .reduce((sum, order) => {
    const value = Number(order.profitmkt ?? order.profit ?? 0);
    return sum + (isNaN(value) ? 0 : value);
  }, 0);
      return acc + empSales;
    }, 0);
    const members = teamEmps2.reduce((acc, emp) => {
      const empSales = filteredOrdersByArea
        .filter(
          (order) =>
            order.mkt.trim().toLowerCase() === emp.name.trim().toLowerCase()
        )
      .reduce((sum, order) => {
    const value = Number(order.profitmkt ?? order.profit ?? 0);
    return sum + (isNaN(value) ? 0 : value);
  }, 0);
      return acc + empSales;
    }, 0);

    return {
      name: team.label,
      LeadAndMembers: sales * 17000,
      members: members * 17000,
    };
  });

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
         .reduce((sum, order) => {
    const value = Number(order.profitmkt ?? order.profit ?? 0);
    return sum + (isNaN(value) ? 0 : value);
  }, 0);
      const adsCost = filteredAds
        .filter((ad) => ad.date === date)
        .reduce((sum, ad) => sum + (ad.request1 + ad.request2), 0);
      return { name: date, profit: sales * 17000 * 0.95, adsCost };
    });
  } else {
    const last30Days = getLast30Days();
    dailyChartDataNew = last30Days.map((date) => {
      const sales = orders
        .filter((order) => order.orderDate === date)
       .reduce((sum, order) => {
    const value = Number(order.profitmkt ?? order.profit ?? 0);
    return sum + (isNaN(value) ? 0 : value);
  }, 0);
      const adsCost = adsMoneyData
        .filter((ad) => ad.date === date)
        .reduce((sum, ad) => sum + (ad.request1 + ad.request2), 0);
      return { name: date, profit: sales * 17000 * 0.95, adsCost };
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
          // (currentUser.team_id === "PHONG" &&
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
      const sales = filteredOrders
        .filter((order) => order.orderDate === date)
        .reduce((sum, order) => {
    const value = Number(order.profitmkt ?? order.profit ?? 0);
    return sum + (isNaN(value) ? 0 : value);
  }, 0);
      const adsCost = filteredAds
        .filter((ad) => ad.date === date)
        .reduce((sum, ad) => sum + (ad.request1 + ad.request2), 0);
      return { name: date, profit: sales * 17000 * 0.95, adsCost };
    });
  } else {
    const last30Days = getLast30Days();
    dailyChartDataNewTEAM = last30Days.map((date) => {
      const sales = filteredOrders
        .filter((order) => order.orderDate === date)
          .reduce((sum, order) => {
    const value = Number(order.profitmkt ?? order.profit ?? 0);
    return sum + (isNaN(value) ? 0 : value);
  }, 0);
      const adsCost = adsMoneyData
        .filter((ad) => ad.date === date)
        .reduce((sum, ad) => sum + (ad.request1 + ad.request2), 0);
      return { name: date, profit: sales * 17000 * 0.95, adsCost };
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
    return { name: team.label, profit: avgProfit * 17000 * 0.95 };
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
        ? ((adsCost / (leaderSales0 * 17000)) * 100).toFixed(2)
        : 0;
    const othersSales =
      othersSales0 !== 0
        ? ((adsCost2 / (othersSales0 * 17000)) * 100).toFixed(2)
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
      .reduce((sum, order) => {
    const value = Number(order.profitmkt ?? order.profit ?? 0);
    return sum + (isNaN(value) ? 0 : value);
  }, 0);
    const unpaid = filteredOrdersByArea
    .filter(
        (order) =>
          order.mkt.trim().toLowerCase() === emp.name.trim().toLowerCase() &&
          (order.paymentStatus === "CHƯA THANH TOÁN" ||
            order.paymentStatus === "")
      )
      .reduce((sum, order) => {
    const value = Number(order.profitmkt ?? order.profit ?? 0);
    return sum + (isNaN(value) ? 0 : value);
  }, 0);
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
 const marketingReportData3 = mktEmployees.map((emp, index) => {
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
  "Phan Thế Phong"
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
  .slice(0, 3);
  // Lọc ra nhân viên có chi phí ads tháng này > 0


  const top1Employees = marketingReportData3
    .filter((emp) => emp.adsThisMonth > 0 &&
    (emp.name.trim().toLowerCase() !== "Quách Phú Thành"))
    .sort((a, b) => b.totalToday - a.totalToday)
    .slice(0, 1);

  // Lọc ra các thành viên mkt thuộc team của currentUser
  // Lọc nhân viên MKT thuộc team
  const teamMktEmployees = mktEmployees.filter(
    (emp) =>
      emp.team_id === currentUser.team_id ||
      (currentUser.team_id === "SON" &&
        ["Nguyễn Thị Xuân Diệu", "Nguyễn Bá Quân"].includes(emp.name.trim()))
        //  ||
      // (currentUser.team_id === "PHONG" && emp.name.trim() === "Bùi Văn Phi")
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

  // Xác định Leader trong team
  const teamLeader = teamEmployees.find((emp) => emp.position === "lead" || emp.name === currentUser.name);
  const leaderNames = teamLeader ? [teamLeader.name.toLowerCase()] : [];

  // Tạo map chức vụ
  const positionMap = {};
  teamMktEmployees.forEach((emp) => {
    const nameLower = emp.name.trim().toLowerCase();
    if (emp.position === "lead") {
      positionMap[nameLower] = "Leader MKT";
    } else {
      positionMap[nameLower] = "Nhân viên";
    }
  });

  const marketingReportDataTEAM = teamMktEmployees.map((emp, index) => {
    const empNameLower = emp.name.trim().toLowerCase();
    const isLeader = leaderNames.includes(empNameLower);
    const position = positionMap[empNameLower] || "Nhân viên";
    
    const paid = teamFilteredOrders
      .filter(
        (order) =>
          order.mkt.trim().toLowerCase() === empNameLower &&
          order.paymentStatus === "ĐÃ THANH TOÁN"
      )
     .reduce((sum, order) => {
    const value = Number(order.profitmkt ?? order.profit ?? 0);
    return sum + (isNaN(value) ? 0 : value);
  }, 0);

    const unpaid = teamFilteredOrders
      .filter(
        (order) =>
          order.mkt.trim().toLowerCase() === empNameLower &&
          (order.paymentStatus === "CHƯA THANH TOÁN" ||
            order.paymentStatus === "")
      )
     .reduce((sum, order) => {
    const value = Number(order.profitmkt ?? order.profit ?? 0);
    return sum + (isNaN(value) ? 0 : value);
  }, 0);

    const total = paid + unpaid;
    const tienVND = total * 0.95 * exchangeRate;

    const totalAds = teamFilteredAds
      .filter(
        (ad) => ad.name.trim().toLowerCase() === empNameLower
      )
      .reduce((sum, ad) => sum + (ad.request1 + ad.request2), 0);

    const adsPercent = tienVND
      ? ((totalAds / tienVND) * 100).toFixed(2)
      : "0.00";

    return {
      key: index,
      name: emp.name,
      position,
      isLeader,
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
  const fmtNum = (v) =>
    typeof v === "number"
      ? v.toLocaleString("en-US")
      : v;
  // Gradient pill cho chỉ số phần trăm theo ngưỡng (cao / trung bình / thấp)
  const renderPill = (percent, kind = "percent") => {
    const v = Number(percent) || 0;
    let level = "low";
    if (kind === "doiTien") {
      if (v > 95) level = "high";
      else if (v >= 80 && v <= 95) level = "mid";
    } else if (kind === "ads") {
      if (v < 30) level = "high";
      else if (v >= 30 && v <= 35) level = "mid";
    } else if (kind === "today") {
      if (v > 100) level = "high";
      else if (v >= 80 && v <= 100) level = "mid";
    } else {
      if (v > 50) level = "high";
      else if (v >= 30 && v <= 50) level = "mid";
    }
    return (
      <div className={`sale-pill sale-pill-${level}`}>
        {v.toFixed(2)}%
      </div>
    );
  };

  const saleColumns = [
    {
      title: "Tên nhân viên",
      dataIndex: "name",
      key: "name",
      fixed: "left",
      width: 160,
      render: (text) => <span className="sale-name">{text}</span>,
    },
    {
      title: "Đã thanh toán",
      dataIndex: "paid",
      key: "paid",
      align: "right",
      render: (value) => <span className="sale-num sale-num-paid">{fmtNum(value)}</span>,
    },
    {
      title: "Chưa thanh toán",
      dataIndex: "unpaid",
      key: "unpaid",
      align: "right",
      render: (value) => <span className="sale-num sale-num-unpaid">{fmtNum(value)}</span>,
    },
    {
      title: "Tổng",
      dataIndex: "total",
      key: "total",
      align: "right",
      render: (value) => <strong className="sale-num sale-num-total">{fmtNum(value)}</strong>,
    },
    {
      title: "Tiền VNĐ",
      dataIndex: "tienVND",
      key: "tienVND",
      align: "right",
      render: (value) => <span className="sale-num sale-num-vnd">{fmtNum(value)}</span>,
    },
    {
      title: "% đòi tiền",
      dataIndex: "percent",
      key: "percent",
      align: "center",
      width: 130,
      render: (percent) => renderPill(percent, "doiTien"),
    },
  ];
  const saleColumnsOLND = [
    {
      title: "Tên nhân viên",
      dataIndex: "name",
      key: "name",
      fixed: "left",
      width: 180,
      render: (text) => <span className="sale-name">{text}</span>,
    },
    {
      title: "Tổng",
      dataIndex: "total",
      key: "total",
      align: "right",
      render: (value) => <strong className="sale-num sale-num-total">{fmtNum(value)}</strong>,
    },
    {
      title: "Tiền VNĐ",
      dataIndex: "tienVND",
      key: "tienVND",
      align: "right",
      render: (value) => <span className="sale-num sale-num-vnd">{fmtNum(value)}</span>,
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
    {
      title: "Ngày",
      dataIndex: "date",
      key: "date",
      fixed: "left",
      width: 120,
      render: (val) => <span className="sale-date">{val}</span>,
    },
    {
      title: "Sáng sớm",
      dataIndex: "sangSom",
      key: "sangSom",
      align: "right",
      render: (value) => (
        <span className="sale-num sale-shift sale-shift-sang">
          <span className="sale-shift-dot" style={{ background: "#f59e0b" }} />
          {fmtNum(value)}
        </span>
      ),
    },
    {
      title: "Hành chính",
      dataIndex: "hanhChinh",
      key: "hanhChinh",
      align: "right",
      render: (value) => (
        <span className="sale-num sale-shift sale-shift-hanh">
          <span className="sale-shift-dot" style={{ background: "#3b82f6" }} />
          {fmtNum(value)}
        </span>
      ),
    },
    {
      title: "Tối",
      dataIndex: "toi",
      key: "toi",
      align: "right",
      render: (value) => (
        <span className="sale-num sale-shift sale-shift-toi">
          <span className="sale-shift-dot" style={{ background: "#8b5cf6" }} />
          {fmtNum(value)}
        </span>
      ),
    },
    {
      title: "Tổng",
      dataIndex: "total",
      key: "total",
      align: "right",
      render: (value) => (
        <strong className="sale-num sale-num-total">{fmtNum(value)}</strong>
      ),
    },
    {
      title: "VNĐ",
      dataIndex: "total",
      key: "total",
      align: "right",
      render: (value) => (
        <span className="sale-num sale-num-vnd">{fmtNum(value * 17000)}</span>
      ),
    },
    {
      title: "SL Đơn",
      dataIndex: "sodon",
      key: "sodon",
      align: "center",
      render: (value) => (
        <span className="sale-order-count">{fmtNum(value)}</span>
      ),
    },
    {
      title: "% Ca Sáng",
      dataIndex: "percentSang",
      key: "percentSang",
      align: "center",
      width: 120,
      render: (percent) => renderPill(percent, "shift"),
    },
    {
      title: "% Ca Hành Chính",
      dataIndex: "percentHanh",
      key: "percentHanh",
      align: "center",
      width: 130,
      render: (percent) => renderPill(percent, "shift"),
    },
    {
      title: "% Ca Tối",
      dataIndex: "percentToi",
      key: "percentToi",
      align: "center",
      width: 110,
      render: (percent) => renderPill(percent, "shift"),
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
    .reduce((sum, order) => {
    const value = Number(order.profitmkt ?? order.profit ?? 0);
    return sum + (isNaN(value) ? 0 : value);
  }, 0);
  const chuaThanhToanKW3 = filteredOrders
    .filter(
      (order) =>
        order.paymentStatus === "CHƯA THANH TOÁN" || order.paymentStatus === ""
    )
   .reduce((sum, order) => {
    const value = Number(order.profitmkt ?? order.profit ?? 0);
    return sum + (isNaN(value) ? 0 : value);
  }, 0);
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
          //     ||
          // (currentUser.team_id === "PHONG" &&
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
      key: "KW",
      daThanhToan: daThanhToanKW,
      chuaThanhToan: chuaThanhToanKW,
      tong: tongKW,
      thanhToanDat: thanhToanDat,
      totalAds: totalAdsKW,
      percentAds: percentAds,
    },
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
    (emp) => emp.position === "salenhapdon" && emp.quocgia === "kr"
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

 const now = new Date();

// Hôm nay: từ 00:00 đến thời điểm hiện tại
const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
const todayNow = now;
const totalTodayProfit = orders
  .filter((order) => {
    const orderDate = new Date(order.createdAt);
    return orderDate >= todayStart && orderDate <= todayNow;
  })
  .reduce((sum, order) => sum + order.revenue, 0);

// Hôm qua: từ 00:00 đến cùng giờ như hiện tại hôm nay
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
const totalYesterdayProfit = orders
  .filter((order) => {
    const orderDate = new Date(order.createdAt);
    return orderDate >= yesterdayStart && orderDate <= yesterdaySameTime;
  })
  .reduce((sum, order) => sum + order.revenue, 0);

// % hôm nay vs hôm qua
const percentTodayVsYesterday =
  totalYesterdayProfit > 0
    ? ((totalTodayProfit / totalYesterdayProfit) * 100).toFixed(2)
    : 0;

// ===== Data cho bảng =====
const summaryData = [
  {
    key: "1",
    today: (totalTodayProfit * 17000).toLocaleString("vi-VN") + " VNĐ",
    yesterday: (totalYesterdayProfit * 17000).toLocaleString("vi-VN") + " VNĐ",
    percent: percentTodayVsYesterday + "%",
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
    

      {/* VINH DANH TOP 3 - LEADERBOARD */}
      {top5Employees.length > 0 && (
      <div className="lb-wrap">
        <div className="lb-sub">🏆 Vinh danh hôm nay · <span id="lb-date">{new Date().getDate().toString().padStart(2, '0')}/{new Date().getMonth() + 1}/{new Date().getFullYear()}</span></div>
        <div className="lb-hl">
          {top5Employees[0].totalToday * 17000 >= 15000000 ? (
            <span>Đội ngũ bùng nổ — <span>{top5Employees[0].name}!</span></span>
          ) : (
            <span style={{color: 'rgba(255,255,255,0.5)', fontSize: 14}}>Hãy cố lên — chưa ai đạt 15 triệu hôm nay!</span>
          )}
        </div>
        <div className="lb-grid">
          {top5Employees.slice(0, 3).map((emp, index) => {
            const medals = ['🥇', '🥈', '🥉'];
            const ranks = ['r1', 'r2', ''];
            const badges = ['bg-gold', 'bg-silver', 'bg-bronze'];
            const tops = ['TOP 1', 'TOP 2', 'TOP 3'];
            const showDs = emp.totalToday * 17000 >= 15000000;
            return (
              <div key={index} className={`lb-card ${ranks[index] || ''}`}>
                <div className="lb-rank">{medals[index]}</div>
                <img
                  src={`/${emp.name.trim()}.jpg`}
                  alt={emp.name.trim()}
                  className={`lb-av ${ranks[index] || ''}`}
                  style={{ width: 54, height: 54, borderRadius: '50%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "/ngockem.jpg";
                  }}
                />
                <div className="lb-name">{emp.name}</div>
                <div className={`lb-badge ${badges[index]}`}>{tops[index]}</div>
                {showDs && (
                  <div className="lb-stat">
                    <strong>{(emp.totalToday * 17000).toLocaleString('vi-VN')} VNĐ</strong>
                    DS hôm nay
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      )}

      {/* BỘ LỌC */}
      <div className="filter-bar-container">
      <div className="lfbar">
        {/* Khu vực */}
        <div className="ltab-g">
          <div
            className={`ltab ${selectedArea === 'all' ? 'on' : ''}`}
            onClick={() => setSelectedArea('all')}
          >
            Tất cả
          </div>
          <div
            className={`ltab ${selectedArea === 'da' ? 'on' : ''}`}
            onClick={() => setSelectedArea('da')}
          >
            Đông Anh
          </div>
          <div
            className={`ltab ${selectedArea === 'pvd' ? 'on' : ''}`}
            onClick={() => setSelectedArea('pvd')}
          >
            Phạm Văn Đồng
          </div>
        </div>

        {/* Ngày */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--sub)' }}>Ngày:</span>
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
            className={`ltab ${selectedPreset === 'today' ? 'on' : ''}`}
            onClick={() => {
              setSelectedPreset('today');
              setSelectedDate("");
            }}
          >
            Hôm nay
          </div>
          <div
            className={`ltab ${selectedPreset === 'yesterday' ? 'on' : ''}`}
            onClick={() => {
              setSelectedPreset('yesterday');
              setSelectedDate("");
            }}
          >
            Hôm qua
          </div>
          <div
            className={`ltab ${selectedPreset === 'week' ? 'on' : ''}`}
            onClick={() => {
              setSelectedPreset('week');
              setSelectedDate("");
            }}
          >
            7 Ngày
          </div>
          <div
            className={`ltab ${selectedPreset === 'currentMonth' ? 'on' : ''}`}
            onClick={() => {
              setSelectedPreset('currentMonth');
              setSelectedDate("");
            }}
          >
            Từ đầu tháng
          </div>
          <div
            className={`ltab ${selectedPreset === 'lastMonth' ? 'on' : ''}`}
            onClick={() => {
              setSelectedPreset('lastMonth');
              setSelectedDate("");
            }}
          >
            Tháng trước
          </div>
        </div>

        {/* Team - chỉ hiện khi cần */}
        {(currentUser.position === "admin" ||
          currentUser.position === "managerMKT" ||
          (currentUser.position === "lead" && [6518, 4365].includes(currentUser.employee_code))) && (
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
                      <option value="PHONG">TEAM LẺ</option>
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
      {/* Bảng Tổng chi phí ads */}
      <div className="kpi-strip" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 16 }}>
        <div className="kpi-card green">
          <div className="kpi-lbl"><span>📊</span> Doanh số — {selectedTeam || 'Tất cả'}</div>
          <div className="kpi-val">{(tongKW3 * exchangeRate).toLocaleString()} đ</div>
          <div className="kpi-sub"><span className="up">▲ +12.4%</span> so với trước</div>
        </div>
        <div className="kpi-card gold">
          <div className="kpi-lbl"><span>💰</span> Chi phí Ads — {selectedTeam || 'Tất cả'}</div>
          <div className="kpi-val gold">{totalAdsKW3.toLocaleString()} đ</div>
          <div className="kpi-sub"><span className="dn">▼ Cá nhân</span>: {selectedTeam}</div>
        </div>
        <div className="kpi-card blue">
          <div className="kpi-lbl"><span>📈</span> % Chi phí Ads</div>
          <div className="kpi-val">{percentAds3}%</div>
          <div className="kpi-sub"><span className="dn">▼ Trên doanh số</span>: {selectedTeam}</div>
        </div>
        <div className="kpi-card purple">
          <div className="kpi-lbl"><span>👥</span> DS / Ads toàn Nhân viên</div>
          <div className="kpi-val" style={{ color: '#722ed1' }}>
            {(() => {
              const nvData = marketingReportDataTEAM.filter(r => !r.isLeader);
              const dsNV = nvData.reduce((sum, r) => sum + Number(r.tienVND || 0), 0);
              const adsNV = nvData.reduce((sum, r) => sum + Number(r.totalAds || 0), 0);
              return (
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{dsNV.toLocaleString()} đ</div>
                  <div className="kpi-sub"><span className="dn">Ads NV:</span> {adsNV.toLocaleString()} đ</div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
      {((currentUser.position === "admin" && !selectedTeam) ||
        (currentUser.position === "managerMKT" && !selectedTeam) ||
        currentUser.position === "managerSALE" ||
        currentUser.position === "leadSALE") && (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={16}>
              <Row>
                {selectedTeam && (
                  <>
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
                    <Col xs={24} sm={12} md={8}>
                      <div className="filter-team-select">
                        <span className="filter-label">Chọn team:</span>
                        <Select
                          value={selectedTeam ?? ""}
                          style={{ width: "100%", maxWidth: "200px" }}
                          onChange={(value) => setSelectedTeam(value || null)}
                          className="team-dropdown"
                        >
                          <Option key="all" value="">
                            <span className="team-option-all">🌐 Tất cả</span>
                          </Option>
                          {teams.map((team) => (
                            <Option key={team.value} value={team.value}>
                              {team.label}
                            </Option>
                          ))}
                        </Select>
                      </div>
                    </Col>
                  </>
                )}
              </Row>
            </Col>
          </Row>
          <div className="all-team-section">
            {/* Row 1: Doanh số hôm nay + Thống kê đơn hàng trên cùng 1 hàng */}
            {!selectedTeam && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 20 }}>
              <div className="all-team-card">
                <div className="all-team-card-header purple">
                  <div className="card-icon">📊</div>
                  <h3>Doanh số hôm nay / hôm qua / %</h3>
                </div>
                <div className="all-team-card-body">
                  <Table
                    className="all-team-summary-table"
                    columns={summaryColumns}
                    dataSource={summaryData}
                    pagination={false}
                    bordered
                    size="middle"
                  />
                </div>
              </div>

              <div className="all-team-card">
                <div className="all-team-card-header orange">
                  <div className="card-icon">📦</div>
                  <h3>Thống kê đơn hàng (Tổng đơn / DONE / Đã gửi / Chưa gửi)</h3>
                </div>
                <div className="all-team-card-body">
                  {(currentUser.position === "admin" ||
                    currentUser.position === "managerMKT" ||
                    currentUser.position === "managerSALE" ||
                    currentUser.position === "leadSALE") && (
                    <Table
                      className="all-team-orders-table"
                      pagination={false}
                      dataSource={shippingReport ? [shippingReport] : []}
                      columns={columns}
                      bordered
                      size="middle"
                    />
                  )}
                </div>
              </div>
            </div>
            )}

            {/* Row 3: Tổng khách thanh toán + Thống kê giục chuyển khoản */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 20 }}>
              <div className="all-team-card">
                <div className="all-team-card-header blue">
                  <div className="card-icon">💳</div>
                  <h3>Tổng khách thanh toán</h3>
                </div>
                <div className="all-team-card-body">
                  <Table
                    className="all-team-payment-table"
                    columns={totalColumns}
                    dataSource={totalData}
                    pagination={false}
                    bordered
                    size="middle"
                  />
                </div>
              </div>

              <div className="all-team-card">
                <div className="all-team-card-header gold">
                  <div className="card-icon">💰</div>
                  <h3>Thống kê để giục chuyển khoản</h3>
                </div>
                <div className="all-team-card-body">
                  <Table
                    className="all-team-transfer-table"
                    columns={transferColumns}
                    dataSource={transferData}
                    pagination={false}
                    bordered
                    size="middle"
                  />
                </div>
              </div>
            </div>

            {/* Row 4: Doanh số SALE + Doanh số MKT */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 20 }}>
              <div className="all-team-card">
                <div className="all-team-card-header green">
                  <div className="card-icon">📈</div>
                  <h3>Doanh số (SALE)</h3>
                </div>
                <div className="all-team-card-body">
                  <Table
                    className="all-team-sales-table"
                    columns={totalColumns}
                    dataSource={totalDataSALE}
                    pagination={false}
                    bordered
                    size="middle"
                  />
                </div>
              </div>

              {(currentUser.position === "admin" ||
                currentUser.position === "managerMKT") && (
                <div className="all-team-card">
                  <div className="all-team-card-header pink">
                    <div className="card-icon">🎯</div>
                    <h3>Doanh số (MKT)</h3>
                  </div>
                  <div className="all-team-card-body">
                    <Table
                      className="all-team-mkt-table"
                      columns={totalColumns3}
                      dataSource={totalData4}
                      pagination={false}
                      bordered
                      size="middle"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
      
      <br></br>

      {(currentUser.position === "admin" && !selectedTeam) ||
      (currentUser.position === "managerMKT" && !selectedTeam) ||
      (currentUser.position === "managerSALE" && !selectedTeam) ? (
        (() => {
          const mktTabContent = (
            <>
            <Row gutter={[16, 16]} style={{ marginTop: "2rem" }}>
              <Col xs={24} md={12}>
                <div className="card-mkt-chart" style={{ padding: "16px", marginBottom: 16 }}>
                  <h3>👥 Doanh số Nhân viên MKT</h3>
                  <GroupedDoubleBarChartComponent data={employeeChartDataNew} />
                </div>
              </Col>
              <Col xs={24} md={12}>
                <div className="card-mkt-daily" style={{ padding: "16px", marginBottom: 16 }}>
                  <h3>{isFilterApplied ? "📅 Doanh số hàng ngày" : "📅 Doanh số hàng ngày"}</h3>
                  <GroupedDoubleBarChartComponent data={dailyChartDataNew} />
                </div>
              </Col>
            </Row>
            <Row gutter={[16, 16]} style={{ marginTop: "2rem" }}>
              <Col xs={24} md={12}>
                <div className="card-mkt-chart" style={{ padding: "16px", marginBottom: 16 }}>
                  <h3>👥 Doanh số Nhân viên MKT</h3>
                  <GroupedDoubleBarChartComponent data={employeeChartDataNew} />
                </div>
              </Col>
              <Col xs={24} md={12}>
                <div className="card-mkt-daily" style={{ padding: "16px", marginBottom: 16 }}>
                  <h3>{isFilterApplied ? "📅 Doanh số hàng ngày" : "📅 Doanh số hàng ngày"}</h3>
                  <GroupedDoubleBarChartComponent data={dailyChartDataNew} />
                </div>
              </Col>
            </Row>
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <div className="card-mkt-pie" style={{ padding: "16px", marginBottom: 16 }}>
                  <h3>📊 Phần trăm doanh số thành viên</h3>
                  <PieChartComponent data={employeePieData} />
                </div>
              </Col>
              <Col xs={24} md={12}>
                <div className="card-mkt-table" style={{ padding: "16px", marginBottom: 16 }}>
                  {/* Bảng tổng hợp */}
                  <div style={{
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    borderRadius: "12px",
                    padding: "20px",
                    marginBottom: "16px",
                    color: "#fff"
                  }}>
                    <h3 style={{ margin: "0 0 16px 0", fontSize: "14px", textTransform: "uppercase", opacity: 0.9 }}>📊 Tổng quan Marketing</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
                      <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: "8px", padding: "12px", textAlign: "center" }}>
                        <div style={{ fontSize: "11px", opacity: 0.8, marginBottom: "4px" }}>TỔNG ĐƠN</div>
                        <div style={{ fontSize: "20px", fontWeight: "bold" }}>
                          {marketingReportData.reduce((sum, r) => sum + Number(r.total), 0).toLocaleString()}
                        </div>
                      </div>
                      <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: "8px", padding: "12px", textAlign: "center" }}>
                        <div style={{ fontSize: "11px", opacity: 0.8, marginBottom: "4px" }}>DOANH SỐ</div>
                        <div style={{ fontSize: "20px", fontWeight: "bold" }}>
                          {Math.round(marketingReportData.reduce((sum, r) => sum + Number(r.tienVND || 0), 0) / 1000000)}M
                        </div>
                      </div>
                      <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: "8px", padding: "12px", textAlign: "center" }}>
                        <div style={{ fontSize: "11px", opacity: 0.8, marginBottom: "4px" }}>CHI PHÍ ADS</div>
                        <div style={{ fontSize: "20px", fontWeight: "bold" }}>
                          {Math.round(marketingReportData.reduce((sum, r) => sum + Number(r.totalAds || 0), 0) / 1000000)}M
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <h2>📋 Báo cáo chi tiết</h2>
                  <div style={{ border: "1px solid #e8e8e8", borderRadius: "6px", overflow: "hidden", backgroundColor: "#fff" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                      <thead>
                        <tr style={{ backgroundColor: "#fff" }}>
                          <th style={thStyle}>TÊN (VAI TRÒ)</th>
                          <th style={{ ...thStyle, color: "#52c41a" }}>ĐÃ TT</th>
                          <th style={{ ...thStyle, color: "#f5222d" }}>CHƯA TT</th>
                          <th style={{ ...thStyle, color: "#722ed1" }}>TỔNG ĐƠN</th>
                          <th style={thStyle}>TIỀN VNĐ</th>
                          <th style={{ ...thStyle, color: "#722ed1" }}>CHI PHÍ ADS</th>
                          <th style={{ ...thStyle, color: "#f5222d" }}>% CHI PHÍ ADS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {marketingReportData.map((row, idx) => {
                          const bgColor = idx % 2 === 0 ? "#fff" : "#fafafa";
                          return (
                            <tr key={row.key} style={{ backgroundColor: bgColor }}>
                              <td style={tdStyle}>
                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                  <div style={{
                                    width: "32px", height: "32px", borderRadius: "50%",
                                    backgroundColor: getAvatarColor(row.name),
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    color: "#fff", fontSize: "12px", fontWeight: "bold",
                                    flexShrink: 0
                                  }}>
                                    {row.name.charAt(0)}
                                  </div>
                                  <div>
                                    <div style={{ fontWeight: "700", color: "#000", lineHeight: "1.2" }}>{row.name}</div>
                                    <div style={{ fontSize: "11px", color: "#999", fontWeight: "400" }}>Nhân viên</div>
                                  </div>
                                </div>
                              </td>
                              <td style={tdStyle}>
                                <span style={{ color: "#52c41a", fontWeight: "700" }}>
                                  {Number(row.paid).toLocaleString()} <span style={{ fontWeight: "400" }}>đ</span>
                                </span>
                              </td>
                              <td style={tdStyle}>
                                <span style={{ color: "#f5222d", fontWeight: "700" }}>
                                  {Number(row.unpaid).toLocaleString()} <span style={{ fontWeight: "400" }}>đ</span>
                                </span>
                              </td>
                              <td style={tdStyle}>
                                <span style={{
                                  color: "#722ed1", fontWeight: "700", fontSize: "14px",
                                  padding: "4px 12px",
                                  backgroundColor: "#f9f0ff",
                                  borderRadius: "4px",
                                  display: "inline-block"
                                }}>
                                  {Number(row.total).toLocaleString()}
                                </span>
                              </td>
                              <td style={tdStyle}>
                                <span style={{ color: "#000", fontWeight: "600" }}>
                                  {Number(row.tienVND).toLocaleString()} <span style={{ fontWeight: "400" }}>đ</span>
                                </span>
                              </td>
                              <td style={tdStyle}>
                                <span style={{ color: "#722ed1", fontWeight: "700" }}>
                                  {Number(row.totalAds).toLocaleString()} <span style={{ fontWeight: "400" }}>đ</span>
                                </span>
                              </td>
                              <td style={{ ...tdStyle, textAlign: "right" }}>
                                <span style={{
                                  padding: "4px 10px", borderRadius: "4px",
                                  backgroundColor: row.adsPercent < 30 ? "#f6ffed" : row.adsPercent <= 45 ? "#fffbe6" : "#fff1f0",
                                  color: row.adsPercent < 30 ? "#52c41a" : row.adsPercent <= 45 ? "#fa8c16" : "#f5222d",
                                  fontWeight: "700"
                                }}>
                                  {Number(row.adsPercent).toFixed(2)}%
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </Col>
            </Row>
            {/* <h3 style={{ marginTop: "2rem" }}>
      So sánh %ADS : Gồm Leader vs Các nhân viên khác trong Team
    </h3>
    <GroupedBarChartComponent data={leaderComparisonChartData} /> */}
          </>
          );

          const saleTabContent = (
            <>
            <Row gutter={[16, 16]}>
              <Col xs={24} md={24}>
                <h3>Doanh số Nhân viên SALE</h3>

                <GroupedDoubleBarChartComponent2
                  data={employeeChartDataNewsale}
                />
              </Col>
            </Row>

            {/* Các bảng báo cáo SALE */}
            <Row gutter={[20, 20]}>
              <Col xs={24} md={14}>
                <div className="sale-table-card sale-table-card-daily">
                  <div className="sale-table-header">
                    <div className="sale-table-header-icon" style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                      <span>📅</span>
                    </div>
                    <div className="sale-table-header-text">
                      <h2 className="sale-table-title">Báo cáo doanh số ngày</h2>
                      <p className="sale-table-subtitle">
                        Phân tích doanh số theo từng ngày & các ca làm việc
                      </p>
                    </div>
                  </div>
                  <Table
                    className="sale-table sale-table-daily"
                    columns={dailySaleColumns}
                    dataSource={[...saleDailyData].sort(
                      (a, b) => new Date(b.date) - new Date(a.date)
                    )}
                    pagination={{ pageSize: 7, showSizeChanger: false }}
                    scroll={{ x: 900 }}
                  />
                </div>
              </Col>
              <Col xs={24} md={10}>
                <div className="sale-table-card">
                  <div className="sale-table-header">
                    <div
                      className="sale-table-header-icon"
                      style={{
                        background:
                          "linear-gradient(135deg,#0ea5e9,#2563eb)",
                      }}
                    >
                      <span>🚚</span>
                    </div>
                    <div className="sale-table-header-text">
                      <h2 className="sale-table-title">
                        Báo cáo Doanh Số Nhân Viên Sale Vận Đơn
                      </h2>
                      <p className="sale-table-subtitle">
                        Doanh số và tỷ lệ đòi tiền nhân viên Xử lý vận đơn
                      </p>
                    </div>
                  </div>
                  <Table
                    className="sale-table sale-table-xl"
                    columns={saleColumns}
                    dataSource={saleReportDataXL}
                    pagination={false}
                    scroll={{ x: 720 }}
                  />
                </div>
              </Col>
            </Row>

            <Row gutter={[20, 20]}>
              <Col xs={24} md={24}>
                <div className="sale-pie-card">
                  <div className="sale-table-header">
                    <div
                      className="sale-table-header-icon"
                      style={{
                        background:
                          "linear-gradient(135deg,#f59e0b,#f97316)",
                      }}
                    >
                      <span>🥧</span>
                    </div>
                    <div className="sale-table-header-text">
                      <h3 className="sale-table-title">Phần trăm doanh số Sale</h3>
                      <p className="sale-table-subtitle">
                        Tỷ trọng doanh số theo các ca
                      </p>
                    </div>
                  </div>
                  <SalePieChartOuter data={salePieData} total={totalSale} />
                </div>
              </Col>
            </Row>
            <Row gutter={[20, 20]}>
              <Col xs={24} md={24}>
                <div className="sale-table-card">
                  <div className="sale-table-header">
                    <div
                      className="sale-table-header-icon"
                      style={{
                        background:
                          "linear-gradient(135deg,#10b981,#22c55e)",
                      }}
                    >
                      <span>💻</span>
                    </div>
                    <div className="sale-table-header-text">
                      <h2 className="sale-table-title">
                        Báo cáo Doanh Số Nhân Viên Sale ONLINE
                      </h2>
                      <p className="sale-table-subtitle">
                        Doanh số nhân viên chăm sóc khách hàng online
                      </p>
                    </div>
                  </div>
                  <Table
                    className="sale-table sale-table-online"
                    columns={saleColumnsOLND}
                    dataSource={saleReportDataOL}
                    pagination={false}
                    scroll={{ x: 520 }}
                  />
                </div>
              </Col>
            </Row>
            <Row gutter={[20, 20]}>
              <Col xs={24} md={24}>
                <div className="sale-table-card">
                  <div className="sale-table-header">
                    <div
                      className="sale-table-header-icon"
                      style={{
                        background:
                          "linear-gradient(135deg,#ec4899,#db2777)",
                      }}
                    >
                      <span>📝</span>
                    </div>
                    <div className="sale-table-header-text">
                      <h2 className="sale-table-title">
                        Báo cáo Doanh Số Nhân Viên Sale NHẬP ĐƠN
                      </h2>
                      <p className="sale-table-subtitle">
                        Doanh số nhân viên phụ trách nhập đơn hàng
                      </p>
                    </div>
                  </div>
                  <Table
                    className="sale-table sale-table-nhapdon"
                    columns={saleColumnsOLND}
                    dataSource={saleReportDataND}
                    pagination={false}
                    scroll={{ x: 520 }}
                  />
                </div>
              </Col>
            </Row>
            </>
          );

          const items = [
            { key: "MKT", label: "MKT", children: mktTabContent },
            { key: "SALE", label: "SALE", children: saleTabContent },
          ];

          return <Tabs defaultActiveKey="MKT" items={items} />;
        })()
      ) : currentUser.position === "leadSALE" ||
        currentUser.position === "managerSALE" ? (
        <div className="table-card">
          {(() => {
            const saleOnlyContent = (
              <>
              {/* Các bảng báo cáo SALE */}
              <Row gutter={[20, 20]}>
                <Col xs={24} md={15}>
                  <div className="sale-table-card sale-table-card-daily">
                    <div className="sale-table-header">
                      <div
                        className="sale-table-header-icon"
                        style={{
                          background:
                            "linear-gradient(135deg,#6366f1,#8b5cf6)",
                        }}
                      >
                        <span>📅</span>
                      </div>
                      <div className="sale-table-header-text">
                        <h2 className="sale-table-title">
                          Báo cáo doanh số ngày
                        </h2>
                        <p className="sale-table-subtitle">
                          Phân tích doanh số theo từng ngày & các ca làm việc
                        </p>
                      </div>
                    </div>
                    <Table
                      className="sale-table sale-table-daily"
                      columns={dailySaleColumns}
                      dataSource={[...saleDailyData].sort(
                        (a, b) => new Date(b.date) - new Date(a.date)
                      )}
                      pagination={{ pageSize: 7, showSizeChanger: false }}
                      scroll={{ x: 900 }}
                    />
                  </div>

                  <Row gutter={[20, 20]} style={{ marginTop: 20 }}>
                    <Col xs={24} md={24}>
                      <div className="sale-table-card">
                        <div className="sale-table-header">
                          <div
                            className="sale-table-header-icon"
                            style={{
                              background:
                                "linear-gradient(135deg,#0ea5e9,#2563eb)",
                            }}
                          >
                            <span>🚚</span>
                          </div>
                          <div className="sale-table-header-text">
                            <h2 className="sale-table-title">
                              Báo cáo Doanh Số Nhân Viên Sale Vận Đơn
                            </h2>
                            <p className="sale-table-subtitle">
                              Doanh số và tỷ lệ đòi tiền nhân viên Xử lý vận đơn
                            </p>
                          </div>
                        </div>
                        <Table
                          className="sale-table sale-table-xl"
                          columns={saleColumns}
                          dataSource={saleReportDataXL}
                          pagination={false}
                          scroll={{ x: 720 }}
                        />
                      </div>
                    </Col>
                  </Row>
                </Col>
                <Col xs={24} md={9}>
                  <div className="sale-pie-card">
                    <div className="sale-table-header">
                      <div
                        className="sale-table-header-icon"
                        style={{
                          background:
                            "linear-gradient(135deg,#f59e0b,#f97316)",
                        }}
                      >
                        <span>🥧</span>
                      </div>
                      <div className="sale-table-header-text">
                        <h3 className="sale-table-title">
                          Phần trăm doanh số Sale
                        </h3>
                        <p className="sale-table-subtitle">
                          Tỷ trọng doanh số theo các ca
                        </p>
                      </div>
                    </div>
                    <SalePieChartOuter data={salePieData} total={totalSale} />
                  </div>

                  <div
                    className="sale-table-card"
                    style={{ marginTop: 20 }}
                  >
                    <div className="sale-table-header">
                      <div
                        className="sale-table-header-icon"
                        style={{
                          background:
                            "linear-gradient(135deg,#10b981,#22c55e)",
                        }}
                      >
                        <span>💻</span>
                      </div>
                      <div className="sale-table-header-text">
                        <h2 className="sale-table-title">
                          Báo cáo Doanh Số Nhân Viên Sale ONLINE
                        </h2>
                        <p className="sale-table-subtitle">
                          Doanh số nhân viên chăm sóc khách hàng online
                        </p>
                      </div>
                    </div>
                    <Table
                      className="sale-table sale-table-online"
                      columns={saleColumnsOLND}
                      dataSource={saleReportDataOL}
                      pagination={false}
                      scroll={{ x: 520 }}
                    />
                  </div>

                  <div
                    className="sale-table-card"
                    style={{ marginTop: 20 }}
                  >
                    <div className="sale-table-header">
                      <div
                        className="sale-table-header-icon"
                        style={{
                          background:
                            "linear-gradient(135deg,#ec4899,#db2777)",
                        }}
                      >
                        <span>📝</span>
                      </div>
                      <div className="sale-table-header-text">
                        <h2 className="sale-table-title">
                          Báo cáo Doanh Số Nhân Viên Sale NHẬP ĐƠN
                        </h2>
                        <p className="sale-table-subtitle">
                          Doanh số nhân viên phụ trách nhập đơn hàng
                        </p>
                      </div>
                    </div>
                    <Table
                      className="sale-table sale-table-nhapdon"
                      columns={saleColumnsOLND}
                      dataSource={saleReportDataND}
                      pagination={false}
                      scroll={{ x: 520 }}
                    />
                  </div>
                </Col>
              </Row>
              <h3>Doanh số Nhân viên SALE</h3>
              <GroupedDoubleBarChartComponent2 data={employeeChartDataNewsale} />
              <h3 style={{ marginTop: "2rem" }}>
                {isFilterApplied ? "📅 Doanh số hàng ngày " : "📅 Doanh số hàng ngày "}
              </h3>
              <GroupedDoubleBarChartComponent data={dailyChartDataNew} />
              </>
            );
            const items = [
              { key: "SALE", label: "SALE", children: saleOnlyContent },
            ];
            return <Tabs items={items} />;
          })()}
        </div>
      ) : null}
      {(currentUser.position === "lead" ||
        (currentUser.position === "admin" && selectedTeam) ||
        (currentUser.position === "managerMKT" && selectedTeam)) && (
        <div className="table-card">
          <Row gutter={[16, 16]} align="stretch" style={{ marginBottom: "24px" }}>
            <Col xs={24} md={14} style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ flex: 1, padding: "16px", background: "#fff", borderRadius: "8px", border: "1px solid #e8e8e8", display: "flex", flexDirection: "column" }}>
                <h2 style={{ color: "#722ed1", fontSize: "16px", marginBottom: "16px", flexShrink: 0 }}>📋 Báo cáo marketing</h2>
                <div style={{ flex: 1, border: "2px solid #F0F1F2", borderRadius: "8px", overflow: "auto", background: "#fff", minHeight: "300px" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                      <tr>
                        <th style={{ ...thStyle, backgroundColor: "#FFD700", color: "#7a5900" }}>TÊN</th>
                        <th style={{ ...thStyle, backgroundColor: "#FFD54F", color: "#7a5900" }}>ĐÃ TT</th>
                        <th style={{ ...thStyle, backgroundColor: "#FFE082", color: "#7a5900" }}>CHƯA TT</th>
                        <th style={{ ...thStyle, backgroundColor: "#FFE7A0", color: "#7a5900" }}>TỔNG ĐƠN</th>
                        <th style={{ ...thStyle, backgroundColor: "#FFEFB8", color: "#7a5900" }}>TIỀN VNĐ</th>
                        <th style={{ ...thStyle, backgroundColor: "#FFF5D1", color: "#7a5900" }}>CHI PHÍ ADS</th>
                        <th style={{ ...thStyle, backgroundColor: "#FFFBE6", color: "#7a5900" }}>% ADS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {marketingReportDataTEAM.map((row, idx) => {
                        const isLeader = row.isLeader;
                        const rowBgColor = isLeader ? "#fffbe6" : (idx % 2 === 0 ? "#fff" : "#fafafa");
                        const avatarColors = ["#1890ff", "#52c41a", "#722ed1", "#f5222d", "#fa8c16", "#13c2c2", "#eb2f96"];
                        const avatarColor = isLeader ? "#faad14" : avatarColors[idx % avatarColors.length];
                        return (
                          <tr 
                            key={row.key}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#fff3a3"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = rowBgColor; }}
                            style={{ backgroundColor: rowBgColor, transition: "background-color 0.2s", cursor: "pointer" }}
                          >
                            <td style={{ position: "relative", ...tdStyle }}>
                              {isLeader && (
                                <div style={{
                                  position: "absolute",
                                  left: "-1px",
                                  top: 0,
                                  bottom: 0,
                                  width: "4px",
                                  backgroundColor: "#faad14",
                                  zIndex: 1
                                }} />
                              )}
                              <div style={{ display: "flex", alignItems: "center", gap: "12px", position: "relative", zIndex: 2 }}>
                                <div style={{
                                  width: "36px", 
                                  height: "36px",
                                  borderRadius: "50%",
                                  backgroundColor: avatarColor,
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  color: "#fff", fontSize: "13px", fontWeight: "600",
                                  flexShrink: 0,
                                  letterSpacing: "0.5px"
                                }}>
                                  {row.name ? row.name.split(" ").slice(-1)[0].charAt(0).toUpperCase() : "?"}
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                  <span style={{ fontWeight: "700", color: isLeader ? "#d48806" : "#000", fontSize: "13px", lineHeight: "1.2" }}>
                                    {row.name}
                                  </span>
                                  <span style={{ 
                                    fontSize: "11px", 
                                    color: isLeader ? "#faad14" : "#999"
                                  }}>
                                    {isLeader ? "⭐ Leader MKT" : "Nhân viên"}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td style={tdStyle}>
                              <span style={{ color: "#52c41a", fontWeight: "700" }}>
                                {Number(row.paid || 0).toLocaleString()}
                              </span>
                            </td>
                            <td style={tdStyle}>
                              <span style={{ color: "#f5222d", fontWeight: "700" }}>
                                {Number(row.unpaid || 0).toLocaleString()}
                              </span>
                            </td>
                            <td style={tdStyle}>
                              <span style={{ color: "#722ed1", fontWeight: "700", fontSize: "14px" }}>
                                {Number(row.total || 0).toLocaleString()}
                              </span>
                            </td>
                            <td style={tdStyle}>
                              {Number(row.tienVND || 0).toLocaleString()} đ
                            </td>
                            <td style={tdStyle}>
                              <span style={{ color: "#722ed1", fontWeight: "700" }}>
                                {Number(row.totalAds || 0).toLocaleString()} đ
                              </span>
                            </td>
                            <td style={{ ...tdStyle, textAlign: "center" }}>
                              <span style={{
                                padding: "4px 10px", borderRadius: "4px",
                                border: "1px solid",
                                borderColor: (row.adsPercent || 0) < 30 ? "#b7eb8f" : (row.adsPercent || 0) <= 45 ? "#ffe58f" : "#ffa39e",
                                backgroundColor: (row.adsPercent || 0) < 30 ? "#f6ffed" : (row.adsPercent || 0) <= 45 ? "#fffbe6" : "#fff1f0",
                                color: (row.adsPercent || 0) < 30 ? "#52c41a" : (row.adsPercent || 0) <= 45 ? "#fa8c16" : "#f5222d",
                                fontWeight: "700",
                                display: "inline-block",
                                width: "80px",
                                boxSizing: "border-box"
                              }}>
                                {Number(row.adsPercent || 0).toFixed(2)}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </Col>
            <Col xs={24} md={10} style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ flex: 1, padding: "16px", background: "#fff", borderRadius: "8px", border: "1px solid #e8e8e8", display: "flex", flexDirection: "column" }}>
                <h3 style={{ color: "#722ed1", fontSize: "16px", marginBottom: "16px", flexShrink: 0 }}>👥 Doanh số Nhân viên MKT</h3>
                <div style={{ flex: 1, border: "2px solid #F0F1F2", borderRadius: "8px", overflow: "hidden", padding: "12px", background: "#fff", display: "flex", alignItems: "stretch", minHeight: "300px" }}>
                  <div style={{ flex: 1, minHeight: "280px" }}>
                    <GroupedDoubleBarChartComponentTEAM
                      data={employeeChartDataNewTEAM}
                    />
                  </div>
                </div>
              </div>
            </Col>
          </Row>
          <Row gutter={[16, 16]} align="stretch">
            <Col xs={24} md={14} style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ flex: 1, padding: "16px", background: "#fff", borderRadius: "8px", border: "1px solid #e8e8e8", display: "flex", flexDirection: "column" }}>
                <h3 style={{ color: "#722ed1", fontSize: "16px", marginBottom: "16px", flexShrink: 0 }}>📅 Doanh số hàng ngày</h3>
                <div style={{ flex: 1, border: "2px solid #F0F1F2", borderRadius: "8px", overflow: "hidden", padding: "12px", background: "#fff", display: "flex", alignItems: "stretch" }}>
                  <div style={{ flex: 1, minHeight: "280px" }}>
                    <GroupedDoubleBarChartComponentTEAM
                      data={dailyChartDataNewTEAM}
                    />
                  </div>
                </div>
              </div>
            </Col>
            <Col xs={24} md={10} style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ flex: 1, padding: "16px", background: "#fff", borderRadius: "8px", border: "1px solid #e8e8e8", display: "flex", flexDirection: "column" }}>
                <h3 style={{ color: "#722ed1", fontSize: "16px", marginBottom: "16px", flexShrink: 0 }}>📊 Phần trăm doanh số thành viên</h3>
                <div style={{ flex: 1, border: "2px solid #F0F1F2", borderRadius: "8px", overflow: "hidden", padding: "12px", background: "#fff", display: "flex", alignItems: "stretch" }}>
                  <div style={{ flex: 1, minHeight: "280px" }}>
                    <PieChartComponent data={employeePieDataTEAM} />
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </div>
      )}
      {currentUser.position === "mkt" && (
        <div className="table-card">
          <Row gutter={[16, 16]} align="stretch">
            <Col xs={24} md={14} style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ flex: 1, padding: "16px", background: "#fff", borderRadius: "8px", border: "1px solid #e8e8e8", display: "flex", flexDirection: "column" }}>
                <h3 style={{ color: "#722ed1", fontSize: "16px", marginBottom: "16px", flexShrink: 0 }}>📅 Doanh số hàng ngày</h3>
                <div style={{ flex: 1, border: "2px solid #F0F1F2", borderRadius: "8px", overflow: "hidden", padding: "12px", background: "#fff", display: "flex", alignItems: "stretch" }}>
                  <div style={{ flex: 1, minHeight: "280px" }}>
                    <GroupedDoubleBarChartComponentTEAM
                      data={dailyChartDataNewTEAM}
                    />
                  </div>
                </div>
              </div>
            </Col>
            <Col xs={24} md={10} style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ flex: 1, padding: "16px", background: "#fff", borderRadius: "8px", border: "1px solid #e8e8e8", display: "flex", flexDirection: "column" }}>
                <h3 style={{ color: "#722ed1", fontSize: "16px", marginBottom: "16px", flexShrink: 0 }}>📊 Phần trăm doanh số thành viên</h3>
                <div style={{ flex: 1, border: "2px solid #F0F1F2", borderRadius: "8px", overflow: "hidden", padding: "12px", background: "#fff", display: "flex", alignItems: "stretch" }}>
                  <div style={{ flex: 1, minHeight: "280px" }}>
                    <PieChartComponent data={employeePieDataTEAM} />
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </div>
      )}
      
    </div>
    
  );
};
export default Dashboard;


