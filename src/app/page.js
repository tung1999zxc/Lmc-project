// pages/index.js
'use client'
import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Select, Row, Col, Table, Button, Input } from 'antd';
const { Option } = Select;

// Component biểu đồ Bar (Recharts) cho biểu đồ đơn (có 1 series)
const BarChartComponent = dynamic(
  () =>
    Promise.resolve(({ data }) => {
      const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } = require('recharts');
      return (
        <BarChart width={600} height={300} data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="profit" fill="#8884d8" />
        </BarChart>
      );
    }),
  { ssr: false, loading: () => <p>Loading Chart...</p> }
);

// Component biểu đồ Pie (Recharts)
const PieChartComponent = dynamic(
  () =>
    Promise.resolve(({ data }) => {
      const { PieChart, Pie, Cell, Tooltip, Legend } = require('recharts');
      const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AA336A', '#5A2D82','#144523'];
      return (
        <PieChart width={600} height={300}>
          <Pie
            data={data}
            dataKey="profit"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            label={({ name, percent }) => `${name}: ${percent}%`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      );
    }),
  { ssr: false, loading: () => <p>Loading Pie Chart...</p> }
);

// Component biểu đồ nhóm (grouped double bar chart) hiển thị 2 series: profit và adsCost
const GroupedDoubleBarChartComponent = dynamic(
  () =>
    Promise.resolve(({ data }) => {
      const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } = require('recharts');
      return (
        <BarChart width={600} height={300} data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="profit" fill="#8884d8" />
          <Bar dataKey="adsCost" fill="#FF8042" />
        </BarChart>
      );
    }),
  { ssr: false, loading: () => <p>Loading Grouped Chart...</p> }
);

// Component biểu đồ nhóm so sánh Leader vs Others (như đã có)
const GroupedBarChartComponent = dynamic(
  () =>
    Promise.resolve(({ data }) => {
      const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } = require('recharts');
      return (
        <BarChart width={600} height={300} data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="team" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar 
            dataKey="leader" 
            fill="#82ca9d"
            label={({ payload, x, y, width }) =>
              payload && payload.leaderPercent !== undefined ? (
                <text x={x + width / 2} y={y - 10} fill="#000" textAnchor="middle">
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
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      break;
    case "week":
      // 7 ngày gần nhất: từ ngày 7 ngày trước (00:00:00) đến hôm nay (23:59:59)
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      break;
    case "currentMonth":
      // Từ ngày 1 của tháng đến cuối ngày hôm nay
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      break;
    case "lastMonth":
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0);
      break;
    case "twoMonthsAgo":
      start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      end = new Date(now.getFullYear(), now.getMonth() - 1, 0);
      break;
    case "threeMonthsAgo":
      start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      end = new Date(now.getFullYear(), now.getMonth() - 2, 0);
      break;
    default:
      return dataArray;
  }
  return dataArray.filter(item => {
    // Dùng field 'orderDate' nếu có, nếu không, dùng 'date'
    const dateStr = item.orderDate || item.date;
    const itemDate = new Date(dateStr);
    return itemDate >= start && itemDate <= end;
  });
}

// Hàm trả về mảng 30 ngày gần nhất (YYYY-MM-DD)
function getLast30Days() {
  const days = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

export default function HomePage() {
  // Ngày hiện tại định dạng YYYY-MM-DD
  const today = new Date().toISOString().split('T')[0];

  // State cho bộ lọc: selectedDate mặc định là ngày hiện tại, và preset
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedPreset, setSelectedPreset] = useState('');

  // State cho tỉ giá VNĐ và ô nhập giá trị
  const [exchangeRate, setExchangeRate] = useState(17000);
  const [exchangeRateInput, setExchangeRateInput] = useState(17000);

  // Dữ liệu teams
  const teams = [
    { label: 'TEAM SƠN', value: 'SON' },
    { label: 'TEAM QUÂN', value: 'QUAN' },
    { label: 'TEAM CHI', value: 'CHI' },
    { label: 'TEAM PHONG', value: 'PHONG' },   
    { label: 'TEAM TUẤN ANH', value: 'TUANANH' }, 
    { label: 'TEAM DIỆN', value: 'DIEN' }, 
    { label: 'TEAM LẺ', value: 'LE' }, 
  ];

  // Dữ liệu nhân viên (mẫu)
  const employees = [
    {
      employee_id: 1739255931642,
      employee_code: 3037,
      username: "1",
      name: "tùngmkt",
      position: "mkt",
      team_id: "SON",
      position_team: "mkt"
    },
    {
      employee_id: 1739255931642,
      employee_code: 3037,
      username: "1",
      name: "10",
      position: "lead",
      team_id: "SON",
      position_team: "mkt"
    },
    {
      employee_id: 1739263402531,
      employee_code: 8193,
      username: "3",
      name: "3",
      position: "lead",
      team_id: "LE",
      position_team: "mkt"
    },
    {
      employee_id: 1739263446863,
      employee_code: 7112,
      username: "4",
      name: "4",
      position: "lead",
      team_id: "LE",
      position_team: "mkt"
    },
    {
      employee_id: 1739263478258,
      employee_code: 7476,
      username: "5",
      name: "5",
      position: "managerMKT",
      team_id: "QUAN",
      position_team: "mkt"
    },
    {
      employee_id: 1739266882157,
      employee_code: 5922,
      username: "1",
      name: "1",
      position: "mkt",
      team_id: "QUAN",
      position_team: "mkt"
    },
    {
      employee_id: 1739266895672,
      employee_code: 1130,
      username: "2",
      name: "2",
      position: "mkt",
      team_id: "CHI",
      position_team: "mkt"
    },
    {
      employee_id: 1739267146254,
      employee_code: 9839,
      username: "1",
      name: "6",
      position: "managerMKT",
      team_id: "CHI",
      position_team: "mkt"
    },
    {
      employee_id: 1739299175410,
      employee_code: 7932,
      username: "1",
      name: "1",
      position: "mkt",
      team_id: "LE",
      position_team: "mkt"
    },
    {
      employee_id: 1739299366892,
      employee_code: 4191,
      username: "1",
      name: "1",
      position: "mkt",
      team_id: "SON",
      position_team: "mkt"
    },
  ];

  // Dữ liệu đơn hàng mẫu
  const orders = [
    { orderDate: "2025-01-01", mkt: "tùngmkt", profit: 100, paymentStatus: "CHƯA THANH TOÁN" },
    { orderDate: "2025-01-01", mkt: "10", profit: 100, paymentStatus: "ĐÃ THANH TOÁN" },
    { orderDate: "2025-01-02", mkt: "3", profit: 150, paymentStatus: "CHƯA THANH TOÁN" },
    { orderDate: "2025-01-03", mkt: "4", profit: 200, paymentStatus: "ĐÃ THANH TOÁN" },
    { orderDate: "2025-01-04", mkt: "5", profit: 250, paymentStatus: "ĐÃ THANH TOÁN" },
    { orderDate: "2025-01-05", mkt: "1", profit: 300, paymentStatus: "CHƯA THANH TOÁN" },
    { orderDate: "2025-01-06", mkt: "2", profit: 350, paymentStatus: "ĐÃ THANH TOÁN" },
    { orderDate: "2025-01-07", mkt: "6", profit: 400, paymentStatus: "CHƯA THANH TOÁN" },
    { orderDate: "2025-02-17", mkt: "1", profit: 900, paymentStatus: "ĐÃ THANH TOÁN" },
    { orderDate: "2025-02-17", mkt: "2", profit: 1000, paymentStatus: "ĐÃ THANH TOÁN" },
    { orderDate: "2025-02-17", mkt: "3", profit: 800, paymentStatus: "CHƯA THANH TOÁN" },
    { orderDate: "2025-02-17", mkt: "4", profit: 400, paymentStatus: "ĐÃ THANH TOÁN" },
    { orderDate: "2024-12-17", mkt: "4", profit: 400, paymentStatus: "ĐÃ THANH TOÁN" },
  ];

  // Dữ liệu chi phí ads (adsMoney)
  const adsMoneyData = [
    { date: "2025-02-17", excessMoney: 100, teamnv: "LE", adsMoney: 5000000, name: "1" },
    { date: "2025-02-17", excessMoney: 200, teamnv: "QUAN", adsMoney: 200000, name: "2" },
    { date: "2025-02-17", excessMoney: 250, teamnv: "SON", adsMoney: 400000, name: "3" },
    { date: "2025-02-17", excessMoney: 100, teamnv: "CHI", adsMoney: 3000000, name: "4" },
    { date: "2024-12-17", excessMoney: 100, teamnv: "CHI", adsMoney: 300000, name: "4" },
    { date: "2025-02-17", excessMoney: 100, teamnv: "LE", adsMoney: 100000, name: "4" },
    { date: "2025-01-02", excessMoney: 100, teamnv: "LE", adsMoney: 2000000, name: "3" },
    { date: "2025-01-05", excessMoney: 100, teamnv: "QUAN", adsMoney: 300000, name: "1" },
    { date: "2025-01-01", excessMoney: 100, teamnv: "SON", adsMoney: 400000, name: "10" },
    { date: "2025-01-06", excessMoney: 100, teamnv: "CHI", adsMoney: 200000, name: "2" },
  ];

  // Lọc đơn hàng theo preset hoặc theo ngày được chọn
  let filteredOrders = orders;
  if (selectedPreset) {
    filteredOrders = filterByPreset(orders, selectedPreset);
  } else if (selectedDate) {
    filteredOrders = orders.filter(order => order.orderDate === selectedDate);
  }

  // Lọc chi phí ads theo cùng bộ lọc (dùng field 'date')
  let filteredAds = adsMoneyData;
  if (selectedPreset) {
    filteredAds = filterByPreset(adsMoneyData.map(ad => ({ ...ad, orderDate: ad.date })), selectedPreset)
      .map(ad => ({ ...ad, date: ad.orderDate }));
  } else if (selectedDate) {
    filteredAds = adsMoneyData.filter(ad => ad.date === selectedDate);
  }

  // === Biểu đồ doanh số theo nhân viên (Grouped Double Bar Chart) ===
  const mktEmployees = employees.filter(emp => emp.position_team === "mkt");
  const employeeChartDataNew = mktEmployees.map(emp => {
    const sales = filteredOrders
      .filter(order => order.mkt === emp.name)
      .reduce((sum, order) => sum + order.profit, 0);
    const adsCost = filteredAds
      .filter(ad => ad.name === emp.name)
      .reduce((sum, ad) => sum + ad.adsMoney, 0);
    return { name: emp.name, profit: sales, adsCost };
  });

  // === Biểu đồ doanh số theo team (Grouped Double Bar Chart) ===
  const teamChartDataNew = teams.map(team => {
    const teamEmps = employees.filter(emp => emp.position_team === "mkt" && emp.team_id === team.value);
    const sales = teamEmps.reduce((acc, emp) => {
      const empSales = filteredOrders
        .filter(order => order.mkt === emp.name)
        .reduce((sum, order) => sum + order.profit, 0);
      return acc + empSales;
    }, 0);
    const adsCost = teamEmps.reduce((acc, emp) => {
      const empAds = filteredAds
        .filter(ad => ad.name === emp.name)
        .reduce((sum, ad) => sum + ad.adsMoney, 0);
      return acc + empAds;
    }, 0);
    return { name: team.label, profit: sales, adsCost };
  });

  // === Biểu đồ doanh số hàng ngày (Grouped Double Bar Chart) ===
  let dailyChartDataNew;
  const isFilterApplied = selectedPreset || (selectedDate && selectedDate !== today);
  if (isFilterApplied && filteredOrders.length > 0) {
    let minDate = new Date(filteredOrders[0].orderDate);
    let maxDate = new Date(filteredOrders[0].orderDate);
    filteredOrders.forEach(order => {
      const d = new Date(order.orderDate);
      if (d < minDate) minDate = d;
      if (d > maxDate) maxDate = d;
    });
    const dateArray = [];
    let currentDate = new Date(minDate);
    while (currentDate <= maxDate) {
      dateArray.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    dailyChartDataNew = dateArray.map(date => {
      const sales = filteredOrders
        .filter(order => order.orderDate === date)
        .reduce((sum, order) => sum + order.profit, 0);
      const adsCost = filteredAds
        .filter(ad => ad.date === date)
        .reduce((sum, ad) => sum + ad.adsMoney, 0);
      return { name: date, profit: sales, adsCost };
    });
  } else {
    const last30Days = getLast30Days();
    dailyChartDataNew = last30Days.map(date => {
      const sales = orders
        .filter(order => order.orderDate === date)
        .reduce((sum, order) => sum + order.profit, 0);
      const adsCost = adsMoneyData
        .filter(ad => ad.date === date)
        .reduce((sum, ad) => sum + ad.adsMoney, 0);
      return { name: date, profit: sales, adsCost };
    });
  }

  // === Biểu đồ phần trăm doanh số theo team (PieChart) ===
  const totalCompanyProfit = filteredOrders.reduce((sum, order) => sum + order.profit, 0);
  const teamPieData = teamChartDataNew.map(item => ({
    ...item,
    percent: totalCompanyProfit > 0 ? ((item.profit / totalCompanyProfit) * 100).toFixed(2) : 0
  }));

  // === Biểu đồ doanh số trung bình của nhân viên trong từng team (BarChart) ===
  const averageTeamChartData = teams.map(team => {
    const teamEmps = employees.filter(emp => emp.position_team === "mkt" && emp.team_id === team.value);
    const teamProfit = teamEmps.reduce((acc, emp) => {
      const empSales = filteredOrders
        .filter(order => order.mkt === emp.name)
        .reduce((sum, order) => sum + order.profit, 0);
      return acc + empSales;
    }, 0);
    const avgProfit = teamEmps.length > 0 ? teamProfit / teamEmps.length : 0;
    return { name: team.label, profit: avgProfit };
  });

  // === Biểu đồ so sánh doanh số giữa leader và các nhân viên khác trong team (Grouped Bar Chart) ===
  // Công thức: leaderPercent = (leaderSales / othersSales) * 100
  const leaderComparisonChartData = teams.map(team => {
    const teamEmps = employees.filter(emp => emp.position_team === "mkt" && emp.team_id === team.value);
    const leaderEmps = teamEmps.filter(emp => emp.position === "lead");
    const othersEmps = teamEmps.filter(emp => emp.position !== "lead");
    const leaderSales = leaderEmps.reduce((acc, emp) => {
      const empSales = filteredOrders
        .filter(order => order.mkt === emp.name)
        .reduce((sum, order) => sum + order.profit, 0);
      return acc + empSales;
    }, 0);
    const othersSales = othersEmps.reduce((acc, emp) => {
      const empSales = filteredOrders
        .filter(order => order.mkt === emp.name)
        .reduce((sum, order) => sum + order.profit, 0);
      return acc + empSales;
    }, 0);
    const leaderPercent = othersSales !== 0 ? ((leaderSales / othersSales) * 100).toFixed(2) : (leaderSales > 0 ? 100 : 0);
    return { team: team.label, leader: leaderSales, others: othersSales, leaderPercent };
  });

  // === Tính dữ liệu cho Báo cáo marketing ===
  // Lấy tất cả nhân viên có position_team = "mkt" (đã có biến mktEmployees)
  const marketingReportData = mktEmployees.map((emp, index) => {
    const paid = filteredOrders
      .filter(order => order.mkt === emp.name && order.paymentStatus === "ĐÃ THANH TOÁN")
      .reduce((sum, order) => sum + order.profit, 0);
    const unpaid = filteredOrders
      .filter(order => order.mkt === emp.name && order.paymentStatus === "CHƯA THANH TOÁN")
      .reduce((sum, order) => sum + order.profit, 0);
    const total = paid + unpaid;
    const tienVND = total * exchangeRate;
    const totalAds = filteredAds
      .filter(ad => ad.name === emp.name)
      .reduce((sum, ad) => sum + ad.adsMoney, 0);
    const adsPercent = tienVND ? ((totalAds / tienVND) * 100).toFixed(2) : "0.00";
    return { key: index, name: emp.name, paid, unpaid, total, tienVND, totalAds, adsPercent };
  });
  // Sắp xếp theo cột "Tiền VNĐ" giảm dần
  marketingReportData.sort((a, b) => b.tienVND - a.tienVND);

  // Định nghĩa các cột cho bảng báo cáo marketing
  const marketingColumns = [
    {
      title: "Tên",
      dataIndex: "name",
      key: "name",
      render: (text) => {
        // Tìm nhân viên có name trùng với text
        const emp = employees.find((item) => item.name === text);
        // Nếu nhân viên có position là "lead" thì áp dụng nền màu vàng (hoặc màu vàng nhạt)
        const style =
          emp && emp.position === "lead"
            ? { backgroundColor: "#2A8B9A", padding: "4px 8px", borderRadius: "4px" }
            : {};
        return <div style={style}>{text}</div>;
      },
    },
    {
      title: "Đã thanh toán",
      dataIndex: "paid",
      key: "paid",
      render: (value) => value.toLocaleString()
    },
    {
      title: "Chưa thanh toán",
      dataIndex: "unpaid",
      key: "unpaid",
      render: (value) => value.toLocaleString()
    },
    {
      title: "Tổng",
      dataIndex: "total",
      key: "total",
      render: (value) => value.toLocaleString()
    },
    {
      title: "Tiền VNĐ",
      dataIndex: "tienVND",
      key: "tienVND",
      render: (value) => value.toLocaleString()
    },
    {
      title: "Tổng chi phí ads",
      dataIndex: "totalAds",
      key: "totalAds",
      render: (value) => value.toLocaleString()
    },
    {
      title: "% chi phí ads",
      dataIndex: "adsPercent",
      key: "adsPercent",
      render: (value) => {
        const percent = Number(value);
        let bgColor = "";
        if (percent < 30) {
          bgColor = "#54DA1F"; // nền xanh lá (màu xanh nhạt)
        } else if (percent >= 30 && percent <= 35) {
          bgColor = "#FF9501"; // nền vàng nhạt
        } else {
          bgColor = "#EC2527"; // nền đỏ nhạt
        }
        return (
          <div
            style={{
              backgroundColor: bgColor,
              padding: "4px 8px",
              borderRadius: "4px",
              textAlign: "center",
              fontWeight: "bold"
            }}
          >
            {percent.toFixed(2)}%
          </div>
        );
      }
    },
  ];  

  // Component hiển thị Grouped Double Bar Chart cho các biểu đồ có 2 series: profit và adsCost
  const GroupedDoubleBarChartComponentLocal = dynamic(
    () =>
      Promise.resolve(({ data }) => {
        const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } = require('recharts');
        return (
          <BarChart width={600} height={300} data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="profit" fill="#8884d8" />
            <Bar dataKey="adsCost" fill="#FF8042" />
          </BarChart>
        );
      }),
    { ssr: false, loading: () => <p>Loading Grouped Chart...</p> }
  );

  return (
    <div style={{ padding: "2rem" }}>
      {/* Bộ lọc */}
      <div style={{ marginBottom: "1rem" }}>
        <label htmlFor="dateFilter" style={{ marginRight: "0.5rem" }}>Chọn ngày:</label>
        <input
          type="date"
          id="dateFilter"
          value={selectedDate}
          onChange={(e) => {
            setSelectedDate(e.target.value);
            setSelectedPreset('');
          }}
        />
      </div>
      <div style={{ marginBottom: "1rem" }}>
        <label htmlFor="presetFilter" style={{ marginRight: "0.5rem" }}>Chọn khoảng thời gian:</label>
        <Select
          allowClear
          id="presetFilter"
          style={{ width: 300 }}
          placeholder="Chọn khoảng thời gian"
          value={selectedPreset || undefined}
          onChange={(value) => {
            setSelectedPreset(value);
            setSelectedDate('');
          }}
        >
          <Option value="today">Hôm Nay</Option>
          <Option value="week">1 Tuần gần nhất</Option>
          <Option value="currentMonth">1 Tháng (Từ đầu tháng đến hiện tại)</Option>
          <Option value="lastMonth">Tháng trước</Option>
          <Option value="twoMonthsAgo">2 Tháng trước</Option>
          <Option value="threeMonthsAgo">3 Tháng trước</Option>
        </Select>
      </div>

      {/* Ô nhập Tỉ giá VNĐ và nút Sửa giá trị */}
      <div style={{ marginBottom: "1rem" }}>
        <label htmlFor="exchangeRate" style={{ marginRight: "0.5rem" }}>Tỉ giá VNĐ:</label>
        <Input
          type="number"
          id="exchangeRate"
          value={exchangeRateInput}
          onChange={(e) => setExchangeRateInput(Number(e.target.value))}
          style={{ width: "200px", marginRight: "1rem" }}
        />
        <Button type="primary" onClick={() => setExchangeRate(exchangeRateInput)}>
          Sửa giá trị
        </Button>
      </div>
{/* Báo cáo Marketing */}
<h2 style={{ marginTop: "2rem" }}>Báo cáo marketing</h2>
      <Table borderedcolumns={marketingColumns} dataSource={marketingReportData} pagination={false} />
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <h2>Doanh số &amp; chi phí Ads theo Team</h2>
          <GroupedDoubleBarChartComponent data={teamChartDataNew} />
        </Col>
        <Col xs={24} md={12}>
          <h2>Phần trăm doanh số theo Team</h2>
          <PieChartComponent data={teamPieData} />
        </Col>
      </Row>

      <Row style={{ marginTop: "2rem" }}>
        <Col span={24}>
          <h2>Doanh số &amp; chi phí Ads theo Nhân viên</h2>
          <GroupedDoubleBarChartComponent data={employeeChartDataNew} />
        </Col>
      </Row>

      <h2 style={{ marginTop: "2rem" }}>
        {isFilterApplied
          ? "Doanh số & chi phí Ads hàng ngày (theo bộ lọc)"
          : "Doanh số & chi phí Ads hàng ngày (30 ngày gần nhất)"}
      </h2>
      <GroupedDoubleBarChartComponentLocal data={dailyChartDataNew} />

      <h2 style={{ marginTop: "2rem" }}>Doanh số trung bình theo Nhân viên theo Team</h2>
      <BarChartComponent data={averageTeamChartData} />

      <h2 style={{ marginTop: "2rem" }}>
        So sánh doanh số: Leader vs Các nhân viên khác trong Team
      </h2>
      <GroupedBarChartComponent data={leaderComparisonChartData} />

      
    </div>
  );
}
