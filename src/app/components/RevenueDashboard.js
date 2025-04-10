// pages/index.js
'use client'
import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Select, Row, Col } from 'antd';
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
      const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AA336A', '#5A2D82'];
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
      start = new Date();
      end = new Date();
      break;
    case "week":
      start = new Date();
      start.setDate(now.getDate() - 7);
      end = now;
      break;
    case "currentMonth":
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = now;
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

  // Dữ liệu teams
  const teams = [
    { label: 'TEAM SƠN', value: 'SON' },
    { label: 'TEAM QUÂN', value: 'QUAN' },
    { label: 'TEAM CHI', value: 'CHI' },
    { label: 'TEAM LẺ', value: 'LE' },
  ];

  // Dữ liệu nhân viên (mẫu)
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
    { orderDate: "2025-01-01", mkt: "tùngmkt", profit: 100 },
    { orderDate: "2025-01-01", mkt: "10", profit: 100 },
    { orderDate: "2025-01-02", mkt: "3", profit: 150 },
    { orderDate: "2025-01-03", mkt: "4", profit: 200 },
    { orderDate: "2025-01-04", mkt: "5", profit: 250 },
    { orderDate: "2025-01-05", mkt: "1", profit: 300 },
    { orderDate: "2025-01-06", mkt: "2", profit: 350 },
    { orderDate: "2025-01-07", mkt: "6", profit: 400 },
    { orderDate: "2025-02-17", mkt: "1", profit: 900 },
    { orderDate: "2025-02-17", mkt: "2", profit: 1000 },
    { orderDate: "2025-02-17", mkt: "3", profit: 800 },
    { orderDate: "2025-02-17", mkt: "4", profit: 400 },
    { orderDate: "2024-12-17", mkt: "4", profit: 400 },
  ];

  // Dữ liệu chi phí ads (adsMoney)
  const adsMoneyData = [
    { date: "2025-02-17", excessMoney: 100, teamnv: "LE", adsMoney: 100, name: "1" },
    { date: "2025-02-17", excessMoney: 200, teamnv: "QUAN", adsMoney: 200, name: "2" },
    { date: "2025-02-17", excessMoney: 250, teamnv: "SON", adsMoney: 400, name: "3" },
    { date: "2025-02-17", excessMoney: 100, teamnv: "CHI", adsMoney: 300, name: "4" },
    { date: "2024-12-17", excessMoney: 100, teamnv: "CHI", adsMoney: 300, name: "4" },
    { date: "2025-02-17", excessMoney: 100, teamnv: "LE", adsMoney: 100, name: "4" },
    { date: "2025-01-02", excessMoney: 100, teamnv: "LE", adsMoney: 200, name: "3" },
    { date: "2025-01-05", excessMoney: 100, teamnv: "QUAN", adsMoney: 300, name: "1" },
    { date: "2025-01-01", excessMoney: 100, teamnv: "SON", adsMoney: 400, name: "10" },
    { date: "2025-01-06", excessMoney: 100, teamnv: "CHI", adsMoney: 200, name: "2" },
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
    const sales = filteredOrders.filter(order => order.mkt === emp.name).reduce((sum, order) => sum + order.profit, 0);
    const adsCost = filteredAds.filter(ad => ad.name === emp.name).reduce((sum, ad) => sum + ad.adsMoney, 0);
    return { name: emp.name, profit: sales, adsCost };
  });

  // === Biểu đồ doanh số theo team (Grouped Double Bar Chart) ===
  const teamChartDataNew = teams.map(team => {
    const teamEmps = employees.filter(emp => emp.position_team === "mkt" && emp.team_id === team.value);
    const sales = teamEmps.reduce((acc, emp) => {
      const empSales = filteredOrders.filter(order => order.mkt === emp.name).reduce((sum, order) => sum + order.profit, 0);
      return acc + empSales;
    }, 0);
    const adsCost = teamEmps.reduce((acc, emp) => {
      const empAds = filteredAds.filter(ad => ad.name === emp.name).reduce((sum, ad) => sum + ad.adsMoney, 0);
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
      const sales = filteredOrders.filter(order => order.orderDate === date).reduce((sum, order) => sum + order.profit, 0);
      const adsCost = filteredAds.filter(ad => ad.date === date).reduce((sum, ad) => sum + ad.adsMoney, 0);
      return { name: date, profit: sales, adsCost };
    });
  } else {
    const last30Days = getLast30Days();
    dailyChartDataNew = last30Days.map(date => {
      const sales = orders.filter(order => order.orderDate === date).reduce((sum, order) => sum + order.profit, 0);
      const adsCost = adsMoneyData.filter(ad => ad.date === date).reduce((sum, ad) => sum + ad.adsMoney, 0);
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
      const empSales = filteredOrders.filter(order => order.mkt === emp.name).reduce((sum, order) => sum + order.profit, 0);
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
      const empSales = filteredOrders.filter(order => order.mkt === emp.name).reduce((sum, order) => sum + order.profit, 0);
      return acc + empSales;
    }, 0);
    const othersSales = othersEmps.reduce((acc, emp) => {
      const empSales = filteredOrders.filter(order => order.mkt === emp.name).reduce((sum, order) => sum + order.profit, 0);
      return acc + empSales;
    }, 0);
    const leaderPercent = othersSales !== 0 ? ((leaderSales / othersSales) * 100).toFixed(2) : (leaderSales > 0 ? 100 : 0);
    return { team: team.label, leader: leaderSales, others: othersSales, leaderPercent };
  });

  // Component cho biểu đồ nhóm so sánh Leader vs Others (đã được định nghĩa ở trên: GroupedBarChartComponent)

  // Component hiển thị Grouped Double Bar Chart cho các biểu đồ có 2 series: profit và adsCost
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
      
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <h2>Doanh số &amp; chi phí  Ads theo Team</h2>
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
      <div className="criticism-container">
      <h2>PHÊ BÌNH NHÂN VIÊN DOANH SỐ THẤP NHẤT</h2>
      <div className="marquee">
        {top5CriticismEmployees.map((emp, index) => (
          <div key={index} className="employee-item">
            <img
  src={`/${emp.name.trim()}.jpg`}
  alt={emp.name.trim()}
  className="employee-image"
  onError={(e) => {
    e.currentTarget.onerror = null; // Ngăn lặp lại nếu ảnh mặc định không tồn tại
    e.currentTarget.src = "/vrut.jpg";
  }}
/>
            <span className="employee-name">{emp.name}</span>
          </div>
        ))}
      </div>
      <style jsx>{`
        .criticism-container {
          padding: 20px;
          background: #fce4ec;
          text-align: center;
          border: 2px solid #f06292;
          border-radius: 10px;
          margin: 20px;
          overflow: hidden; /* Giới hạn marquee chỉ chạy trong khung */
          position: relative;
        }
        .marquee {
          display: inline-block;
          white-space: nowrap;
          animation: marquee 35s linear infinite;
        }
        .employee-item {
          display: inline-block;
          margin-right: 50px;
          text-align: center;
        }
        .employee-image {
          width: 120px;
          height: 120px;
          object-fit: cover;
          border-radius: 20%;
          margin-bottom: 10px;
        }
        .employee-name {
          font-size: 1.5em;
          font-weight: bold;
          color: #51521c;
        }
        @keyframes marquee {
          0% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
      `}</style>
    </div>
      <h2 style={{ marginTop: "2rem" }}>
        {isFilterApplied ? "Doanh số &amp; Ads hàng ngày (theo bộ lọc)" : "Doanh số &amp; Ads hàng ngày (30 ngày gần nhất)"}
      </h2>
      <GroupedDoubleBarChartComponent data={dailyChartDataNew} />
      
      <h2 style={{ marginTop: "2rem" }}>Doanh số trung bình theo Nhân viên theo Team</h2>
      <BarChartComponent data={averageTeamChartData} />
      
      <h2 style={{ marginTop: "2rem" }}>
        So sánh doanh số: Leader vs Các nhân viên khác trong Team
      </h2>
      <GroupedBarChartComponent data={leaderComparisonChartData} />
    </div>
  );
}
