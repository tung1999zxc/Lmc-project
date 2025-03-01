'use client'
import React, { useState,useEffect  } from 'react';
import dynamic from 'next/dynamic';
import { Select, Row, Col, Table, Button, Input, Tabs ,message} from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import axios from "axios"; 
const { Option } = Select;
import { useRouter } from 'next/navigation';
const Dashboard = () => {

const [employees, setEmployees] = useState([]);
const [orders, setOrders] = useState([]);
const [adsMoneyData, setAdsMoneyData] = useState([]);//mkt
// Component biểu đồ Bar (Recharts) cho biểu đồ đơn (có 1 series)
const router = useRouter(); 
  const currentUser = useSelector((state) => state.user.currentUser);
  useEffect(() => {
    if (!currentUser.name) {
      router.push("/login");
    }
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get("/api/orders");
      setOrders(response.data.data);
    } catch (error) {
      console.error(error);
      message.error("Lỗi khi lấy đơn hàng");
    }
  };
  const fetchRecords = async () => {
    try {
      const response = await axios.get('/api/recordsMKT');
      setAdsMoneyData(response.data.data);
    } catch (error) {
      console.error(error);
      message.error("Lỗi khi lấy danh sách");
    }
  };
const fetchEmployees = async () => {
      
      try {
        const response = await axios.get('/api/employees');
        // response.data.data chứa danh sách nhân viên theo API đã viết
        setEmployees(response.data.data);
      } catch (error) {
        console.error('Lỗi khi lấy danh sách nhân viên:', error);
        message.error('Lỗi khi lấy danh sách nhân viên');
      } finally {
       
      }
    };
   useEffect(() => {
    fetchOrders();
   fetchRecords();
    fetchEmployees();
  }, []);
const BarChartComponent = dynamic(
  () =>
    Promise.resolve(({ data }) => {
      const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } = require('recharts');
      return (
        <BarChart width={600} height={300} data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
           <YAxis tickFormatter={(value) => value.toLocaleString('vi-VN')} />
          <Tooltip formatter={(value) => value.toLocaleString('vi-VN')} />

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
      const COLORS = ['#AA336A', ' #FFBB28', '#00C49F', '#FF8042', '#0088FA', '#5A2D82','#144523'];
      return (
        <PieChart width={600} height={300}>
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
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => value.toLocaleString('vi-VN')} />

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
      const {ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } = require('recharts');
      return (
        <ResponsiveContainer width="100%" height={400}>
        <BarChart  data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
           <YAxis tickFormatter={(value) => value.toLocaleString('vi-VN')} 
             interval={0}
             tickCount={10} />
             dx={10} 
          <Tooltip formatter={(value) => value.toLocaleString('vi-VN')} />

          <Legend />
          <Bar dataKey="profit" fill="#8884d8" />
          <Bar dataKey="adsCost" fill="#FF8042" />
        </BarChart></ResponsiveContainer>
      );
    }),
  { ssr: false, loading: () => <p>Loading Grouped Chart...</p> }
);
const GroupedDoubleBarChartComponent2 = dynamic(
  () =>
    Promise.resolve(({ data }) => {
      const {ResponsiveContainer, BarChart,Cell,LabelList, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } = require('recharts');
      return (
        <ResponsiveContainer width="100%" height={400}>
        <BarChart  data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
           <YAxis tickFormatter={(value) => value.toLocaleString('vi-VN')} />
          <Tooltip formatter={(value) => value.toLocaleString('vi-VN')} />

          <Legend />
          <Bar dataKey="profit">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
                
              ))}
              <LabelList 
    dataKey="profit" 
    formatter={(value) => value.toLocaleString('vi-VN')} 
    position="top" 
  />
            </Bar>
         
        </BarChart></ResponsiveContainer>
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
           <YAxis tickFormatter={(value) => value.toLocaleString('vi-VN')} />
          <Tooltip formatter={(value) => value.toLocaleString('vi-VN')} />

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
      case "yesterday":
        // Hôm qua: từ 00:00:00 đến 23:59:59 của ngày hôm qua
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
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
  for (let i = 7; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}


  // Ngày hiện tại định dạng YYYY-MM-DD
  const today = new Date().toISOString().split('T')[0];

  // State cho bộ lọc: selectedDate mặc định là ngày hiện tại, và preset
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedPreset, setSelectedPreset] = useState('currentMonth');

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
      .reduce((sum, ad) => sum + (ad.request1 + ad.request2), 0);
    return { name: emp.name, profit: sales*17000, adsCost };
  });
  const saleEmployees = employees.filter(emp => emp.position_team === "sale");
  const employeeChartDataNewsale = saleEmployees.map(emp => {
    const sales = filteredOrders
      .filter(order => order.sale === emp.name || order.salexuly === emp.name)
      .reduce((sum, order) => sum + order.profit, 0);
    
    let fillColor = "#8884d8"; // Màu mặc định
    if (emp.position === "salenhapdon") {
      fillColor = "#8884d8"; // ví dụ: màu xanh tím
    } else if (emp.position === "salexuly") {
      fillColor = "#82ca9d"; // ví dụ: màu xanh lá nhạt
    } else if (emp.position === "salefull") {
      fillColor = "#ffc658"; // ví dụ: màu vàng
    }
    
    return { name: emp.name, profit: sales * 17000, fill: fillColor };
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
        .reduce((sum, ad) => sum + (ad.request1 + ad.request2), 0);
      return acc + empAds;
    }, 0);
    return { name: team.label, profit: sales*17000, adsCost };
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
        .reduce((sum, ad) => sum + (ad.request1 + ad.request2), 0);
      return { name: date, profit: sales*17000, adsCost };
    });
  } else {
    const last30Days = getLast30Days();
    dailyChartDataNew = last30Days.map(date => {
      const sales = orders
        .filter(order => order.orderDate === date)
        .reduce((sum, order) => sum + order.profit, 0);
      const adsCost = adsMoneyData
        .filter(ad => ad.date === date)
        .reduce((sum, ad) => sum + (ad.request1 + ad.request2), 0);
      return { name: date, profit: sales*17000, adsCost };
    });
  }

  // === Biểu đồ phần trăm doanh số theo team (PieChart) ===
  const totalCompanyProfit = filteredOrders.reduce((sum, order) => sum + order.profit, 0);
  const tcp=Number(totalCompanyProfit);
  const teamPieData = teamChartDataNew.map(item => ({
    ...item,
    percent: totalCompanyProfit > 0 ?Number( ((item.profit / tcp)) * 100).toFixed(2) : 0
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
    return { name: team.label, profit: avgProfit*17000 };
  });

  // === Biểu đồ so sánh doanh số giữa leader và các nhân viên khác trong team (Grouped Bar Chart) ===
  // Công thức: leaderPercent = (leaderSales / othersSales) * 100
  const leaderComparisonChartData = teams.map(team => {
    const teamEmps = employees.filter(emp => emp.position_team === "mkt" && emp.team_id === team.value);
    const othersEmps = teamEmps.filter(emp => emp.position !== "lead" && emp.position !== "managerMKT");

    const leaderSales0 =   teamEmps.reduce((acc, emp) => {
      const empSales = filteredOrders
        .filter(order => order.mkt === emp.name)
        .reduce((sum, order) => sum + order.profit, 0);
      return acc + empSales;
    }, 0);
    const adsCost = teamEmps.reduce((acc, emp) => {
      const empAds = filteredAds
        .filter(ad => ad.name === emp.name)
        .reduce((sum, ad) => sum + (ad.request1 + ad.request2), 0);
      return acc + empAds;
    }, 0);
    const adsCost2 = othersEmps.reduce((acc, emp) => {
      const empAds = filteredAds
        .filter(ad => ad.name === emp.name)
        .reduce((sum, ad) => sum + (ad.request1 + ad.request2), 0);
      return acc + empAds;
    }, 0);
    const othersSales0 = othersEmps.reduce((acc, emp) => {
      const empSales = filteredOrders
        .filter(order => order.mkt === emp.name)
        .reduce((sum, order) => sum + order.profit, 0);
      return acc + empSales;
    }, 0);
    const leaderSales = leaderSales0 !== 0 ? ((adsCost / (leaderSales0*17000)) * 100).toFixed(2):0;
    const othersSales = othersSales0 !== 0 ? ((adsCost2 / (othersSales0*17000)) * 100).toFixed(2):0 ;
    return { team: team.label, leader: leaderSales, others: othersSales };
  });

  // === Báo cáo Marketing ===
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
      .reduce((sum, ad) => sum + (ad.request1 + ad.request2), 0);
    const adsPercent = tienVND ? ((totalAds / tienVND) * 100).toFixed(2) : "0.00";
    return { key: index, name: emp.name, paid, unpaid, total, tienVND, totalAds, adsPercent };
  });
  // Sắp xếp theo cột "Tiền VNĐ" giảm dần
  marketingReportData.sort((a, b) => b.tienVND - a.tienVND);

  const marketingColumns = [
    {
      title: "Tên",
      dataIndex: "name",
      key: "name",
      render: (text) => {
        const emp = employees.find((item) => item.name === text);
        const style =
          emp && emp.position === "lead" || emp.position === "managerMKT"
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
          bgColor = "#54DA1F";
        } else if (percent >= 30 && percent <= 35) {
          bgColor = "#FF9501";
        } else {
          bgColor = "#FB686A";
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

  // =================== Các bảng báo cáo SALE ===================

  // Báo cáo sale: lấy các nhân viên có position_team === "sale"
  
  const saleReportData = saleEmployees.map((emp, index) => {
    let paid = 0, unpaid = 0;
    if (emp.position === "salenhapdon" || emp.position === "salefull") {
      paid = filteredOrders
        .filter(order => order.sale === emp.name && order.paymentStatus === "ĐÃ THANH TOÁN")
        .reduce((sum, order) => sum + order.profit, 0);
      unpaid = filteredOrders
        .filter(order => order.sale === emp.name && order.paymentStatus === "CHƯA THANH TOÁN")
        .reduce((sum, order) => sum + order.profit, 0);
    } else if (emp.position === "salexuly") {
      paid = filteredOrders
        .filter(order => order.salexuly === emp.name && order.paymentStatus === "ĐÃ THANH TOÁN")
        .reduce((sum, order) => sum + order.profit, 0);
      unpaid = filteredOrders
        .filter(order => order.salexuly === emp.name && order.paymentStatus === "CHƯA THANH TOÁN")
        .reduce((sum, order) => sum + order.profit, 0);
    }
    const total = paid + unpaid;
    const tienVND = total * exchangeRate;
    const percent = total > 0 ? (paid / total) * 100 : 0;
    return { key: index, name: emp.name, paid, unpaid, total, tienVND, percent };
  });

  const saleColumns = [
    { title: "Tên", dataIndex: "name", key: "name" },
    { title: "Đã thanh toán", dataIndex: "paid", key: "paid", render: (value) => value.toLocaleString() },
    { title: "Chưa thanh toán", dataIndex: "unpaid", key: "unpaid", render: (value) => value.toLocaleString() },
    { title: "Tổng", dataIndex: "total", key: "total", render: (value) => value.toLocaleString() },
    { title: "Tiền VNĐ", dataIndex: "tienVND", key: "tienVND", render: (value) => value.toLocaleString() },
    { title: "% đòi tiền", dataIndex: "percent", key: "percent",   render: (percent) => {
      let bgColor;
      if (percent > 95 ) {
        bgColor = "#54DA1F"; // nền xanh lá (màu xanh nhạt)
      } else if (percent >= 80 && percent <= 95) {
        bgColor = "#FF9501"; // nền vàng nhạt (đã sửa lỗi ## thành #)
      } else {
        bgColor = "#FB686A"; // nền đỏ nhạt
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
  }
  ];

  // Báo cáo doanh số ngày cho SALE
  let saleDailyDates = [];
  if ((selectedPreset || (selectedDate && selectedDate !== today)) && filteredOrders.length > 0) {
    let minDate = new Date(filteredOrders[0].orderDate);
    let maxDate = new Date(filteredOrders[0].orderDate);
    filteredOrders.forEach(order => {
      const d = new Date(order.orderDate);
      if (d < minDate) minDate = d;
      if (d > maxDate) maxDate = d;
    });
    let currentDate = new Date(minDate);
    while (currentDate <= maxDate) {
      saleDailyDates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }
  } else {
    saleDailyDates = getLast30Days();
  }

  const saleDailyData = saleDailyDates.map(date => {
    let sangSom = 0, hanhChinh = 0, toi = 0;
    filteredOrders.forEach(order => {
      if (order.orderDate === date) {
        let emp = saleEmployees.find(e => e.name === order.sale);
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
    return { key: date, date, sangSom, hanhChinh, toi, total, percentSang, percentHanh, percentToi };
  });

  const dailySaleColumns = [
    { title: "Ngày", dataIndex: "date", key: "date" },
    { title: "Sáng sớm", dataIndex: "sangSom", key: "sangSom", render: (value) => value.toLocaleString() },
    { title: "Hành chính", dataIndex: "hanhChinh", key: "hanhChinh", render: (value) => value.toLocaleString() },
    { title: "Tối", dataIndex: "toi", key: "toi", render: (value) => value.toLocaleString() },
    { title: "Tổng", dataIndex: "total", key: "total", render: (value) => value.toLocaleString() },
    { title: "% Ds ca Sáng sớm", dataIndex: "percentSang", key: "percentSang",   render: (percent) => {
      let bgColor;
      if (percent >50 ) {
        bgColor = "#54DA1F"; // nền xanh lá (màu xanh nhạt)
      } else if (percent >= 30 && percent <= 50) {
        bgColor = "#FF9501"; // nền vàng nhạt (đã sửa lỗi ## thành #)
      } else {
        bgColor = "#FB686A"; // nền đỏ nhạt
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
    { title: "% Ds ca Hành chính", dataIndex: "percentHanh", key: "percentHanh",   render: (percent) => {
      let bgColor;
      if (percent >50 ) {
        bgColor = "#54DA1F"; // nền xanh lá (màu xanh nhạt)
      } else if (percent >= 30 && percent <= 50) {
        bgColor = "#FF9501"; // nền vàng nhạt (đã sửa lỗi ## thành #)
      } else {
        bgColor = "#FB686A"; // nền đỏ nhạt
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
    { title: "% Ds ca Tối", dataIndex: "percentToi", key: "percentToi",   render: (percent) => {
      let bgColor;
      if (percent >50 ) {
        bgColor = "#54DA1F"; // nền xanh lá (màu xanh nhạt)
      } else if (percent >= 30 && percent <= 50) {
        bgColor = "#FF9501"; // nền vàng nhạt (đã sửa lỗi ## thành #)
      } else {
        bgColor = "#FB686A"; // nền đỏ nhạt
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
  }
  ];

  // Thống kê để dục chuyển khoản
  const giaoThanhCongKW = filteredOrders
    .filter(order => order.paymentStatus === "CHƯA THANH TOÁN" && order.deliveryStatus === "GIAO THÀNH CÔNG" &&order.saleReport === "DONE")
    .reduce((sum, order) => sum + order.profit, 0);
  const daGuiHangKW = filteredOrders
    .filter(order => order.paymentStatus === "CHƯA THANH TOÁN" && order.deliveryStatus === "ĐÃ GỬI HÀNG" &&order.saleReport === "DONE")
    .reduce((sum, order) => sum + order.profit, 0);
  const chuaGuiHangKW = filteredOrders
    .filter(order => order.paymentStatus === "CHƯA THANH TOÁN" && (order.deliveryStatus === ""||order.deliveryStatus === "BỊ BẮT CHỜ GỬI LẠI") && order.saleReport === "DONE" )
    .reduce((sum, order) => sum + order.profit, 0);

  const transferData = [
    { key: "KW", currency: "KW", giaoThanhCong: giaoThanhCongKW, daGuiHang: daGuiHangKW ,chuaGuiHang:chuaGuiHangKW},
    { key: "VND", currency: "VND", giaoThanhCong: giaoThanhCongKW * exchangeRate, daGuiHang: daGuiHangKW * exchangeRate,chuaGuiHang:chuaGuiHangKW*exchangeRate }
  ];

  const transferColumns = [
    { title: "Tiền tệ", dataIndex: "currency", key: "currency" },
    { title: "Giao thành công", dataIndex: "giaoThanhCong", key: "giaoThanhCong", render: (value) => value.toLocaleString() },
    { title: "Đã gửi hàng", dataIndex: "daGuiHang", key: "daGuiHang", render: (value) => value.toLocaleString() },
    { title: "Chưa gửi hàng", dataIndex: "chuaGuiHang", key: "chuaGuiHang", render: (value) => value.toLocaleString() }
  ];

  // Bảng Tổng
  const daThanhToanKW = filteredOrders
    .filter(order => order.paymentStatus === "ĐÃ THANH TOÁN")
    .reduce((sum, order) => sum + order.profit, 0);
  const chuaThanhToanKW = filteredOrders
    .filter(order => order.paymentStatus === "CHƯA THANH TOÁN")
    .reduce((sum, order) => sum + order.profit, 0);
  const tongKW = daThanhToanKW + chuaThanhToanKW;
  const thanhToanDat = tongKW > 0 ? (daThanhToanKW / tongKW) * 100 : 0;
  const totalAdsKW = filteredAds.reduce((sum, ad) => sum + (ad.request1 + ad.request2), 0);
  const percentAds = tongKW > 0 ? Number(((totalAdsKW / (tongKW*exchangeRate)) * 100).toFixed(2)) : 0;

  const totalData = [
    {
      key: "KW",
      daThanhToan: daThanhToanKW,
      chuaThanhToan: chuaThanhToanKW,
      tong: tongKW,
      thanhToanDat: thanhToanDat,
      totalAds: totalAdsKW,
      percentAds: percentAds
    },
    {
      key: "VND",
      daThanhToan: daThanhToanKW * exchangeRate,
      chuaThanhToan: chuaThanhToanKW * exchangeRate,
      tong: tongKW * exchangeRate,
      thanhToanDat: thanhToanDat,
      totalAds: totalAdsKW ,
      percentAds: percentAds
    }
  ];

  const totalColumns = [
    { title: "Đã thanh toán", dataIndex: "daThanhToan", key: "daThanhToán", render: (value) => value.toLocaleString() },
    { title: "Chưa thanh toán", dataIndex: "chuaThanhToan", key: "chuaThanhToán", render: (value) => value.toLocaleString() },
    { title: "Tổng", dataIndex: "tong", key: "tong", render: (value) => value.toLocaleString() },
    { title: "Thanh toán đạt", dataIndex: "thanhToanDat", key: "thanhToanDat",   render: (percent) => {
      let bgColor;
      if (percent >80 ) {
        bgColor = "#54DA1F"; // nền xanh lá (màu xanh nhạt)
      } else if (percent >= 50 && percent <= 80) {
        bgColor = "#FF9501"; // nền vàng nhạt (đã sửa lỗi ## thành #)
      } else {
        bgColor = "#FB686A"; // nền đỏ nhạt
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
    { title: "Tổng chi phí ads", dataIndex: "totalAds", key: "totalAds", render: (value) => value.toLocaleString() },
    { title: "% chi phí ads", dataIndex: "percentAds", key: "percentAds",   render: (percent) => {
      let bgColor;
      if (percent < 30) {
        bgColor = "#54DA1F"; // nền xanh lá (màu xanh nhạt)
      } else if (percent >= 30 && percent <= 35) {
        bgColor = "#FF9501"; // nền vàng nhạt (đã sửa lỗi ## thành #)
      } else {
        bgColor = "#FB686A"; // nền đỏ nhạt
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
  }   
  ];
  const totalSangSom = saleDailyData.reduce((sum, item) => sum + item.sangSom, 0);
  const totalHanhChinh = saleDailyData.reduce((sum, item) => sum + item.hanhChinh, 0);
  const totalToi = saleDailyData.reduce((sum, item) => sum + item.toi, 0);
  const totalSale = totalSangSom + totalHanhChinh + totalToi;
  
  const salePieData = totalSale > 0 ? [
    { name: "Sáng sớm", profit: Number(((totalSangSom / totalSale) * 100).toFixed(2)) },
    { name: "Hành chính", profit: Number(((totalHanhChinh / totalSale) * 100).toFixed(2)) },
    { name: "Tối", profit: Number(((totalToi / totalSale) * 100).toFixed(2)) }
  ] : [
    { name: "Sáng sớm", profit: 0 },
    { name: "Hành chính", profit: 0 },
    { name: "Tối", profit: 0 }
  ];
  return (
    
    <div  
    // style={{
    //   transform: "scale(0.95)",
    //   transformOrigin: "top left",
    //   width: "105%" // Để bù lại không gian khi scale
    // }}
    >
      {/* Bộ lọc */}
      {(currentUser.position === "admin" || currentUser.position === "managerMKT"||currentUser.position === "leadSALE" || currentUser.position === "managerSALE"  ) && (
      <Row gutter={[16, 16]}  >
  <Col xs={24} md={12}>
  <Row>
  <Col xs={24} md={8}><div style={{ marginBottom: "1rem" }}>
        <label htmlFor="dateFilter" style={{ marginRight: "0.5rem", marginTop: "2rem" }}>Chọn ngày:</label>
        <input
          type="date"
          id="dateFilter"
          value={selectedDate}
          onChange={(e) => {
            setSelectedDate(e.target.value);
            setSelectedPreset('');
          }}
        />
      </div></Col>
  <Col xs={24} md={12}><div style={{ marginBottom: "1rem" }}>
        {/* <label htmlFor="presetFilter" style={{ marginRight: "0.5rem" }}>Chọn khoảng thời gian:</label> */}
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
          <Option value="yesterday">Hôm Qua</Option>
          <Option value="week">1 Tuần gần nhất</Option>
          <Option value="currentMonth">1 Tháng (Từ đầu tháng đến hiện tại)</Option>
          <Option value="lastMonth">Tháng trước</Option>
          <Option value="twoMonthsAgo">2 Tháng trước</Option>
          <Option value="threeMonthsAgo">3 Tháng trước</Option>
        </Select>
      </div></Col>
  </Row>
  
      

      {/* Ô nhập Tỉ giá VNĐ */}
      {/* <div style={{ marginBottom: "1rem" }}>
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
      </div> */}
  </Col>
  
  <Col xs={24} md={10}>
        
  </Col>
</Row>)}
      
{(currentUser.position === "admin" || currentUser.position === "managerMKT") ? (
  <Tabs defaultActiveKey="MKT">
  <Tabs.TabPane tab="MKT" key="MKT">
  <div style={{ paddingLeft: '10px' }}>
  <h3>Doanh số &amp; chi phí Ads theo Nhân viên MKT</h3>
  <div style={{ width: '100%' }}>
    <GroupedDoubleBarChartComponent data={employeeChartDataNew} />
  </div>
  <h3 style={{ marginTop: '2rem' }}>
    {isFilterApplied
      ? "Doanh số & chi phí Ads hàng ngày (theo bộ lọc)"
      : "Doanh số & chi phí Ads hàng ngày (30 ngày gần nhất)"}
  </h3>
  <GroupedDoubleBarChartComponent data={dailyChartDataNew} />
    
  <h3>Doanh số &amp; chi phí Ads theo Team</h3>
  <GroupedDoubleBarChartComponent data={teamChartDataNew} />
</div>
    {/* Báo cáo Marketing và các biểu đồ cũ */}
    <Row gutter={[16, 16]} style={{ marginTop: "2rem" }}>
<Col xs={24} md={12}>
<h2>Báo cáo marketing</h2>
<Table columns={marketingColumns} dataSource={marketingReportData} pagination={false} />
</Col>
{/* <Col xs={24} md={1}></Col> */}
<Col xs={24} md={10}>

<h2 style={{ marginTop: "2rem" }}>Tổng</h2>
  <Table columns={totalColumns} dataSource={totalData} pagination={false} />

        <h3>Phần trăm doanh số theo Team</h3>
        <PieChartComponent data={teamPieData} />
        <h3 style={{ marginTop: "2rem" }}>Doanh số trung bình theo Nhân viên theo Team</h3>
      <BarChartComponent data={averageTeamChartData} />
      <h3 style={{ marginTop: "2rem" }}>
      So sánh %ADS : Gồm Leader vs Các nhân viên khác trong Team
    </h3>
    <GroupedBarChartComponent data={leaderComparisonChartData} />
</Col>
</Row>
    
    <Row gutter={[16, 16]}>
      <Col xs={24} md={12}>
      
      </Col>
      <Col xs={24} md={12}>
      
      </Col>
    </Row>
    
    
    
    
  </Tabs.TabPane>
  <Tabs.TabPane tab="SALE" key="SALE">
  <h3>Doanh số Nhân viên SALE</h3>
<div style={{ width: '100%' }}>
  <GroupedDoubleBarChartComponent2 data={employeeChartDataNewsale} />
</div>
    {/* Các bảng báo cáo SALE */}
    <Row gutter={[16, 16]}>
<Col xs={24} md={14}>
<h2 style={{ marginTop: "2rem" }}>Thống kê để giục chuyển khoản</h2>
<Table columns={transferColumns} dataSource={transferData} pagination={false} />
<h2 style={{ marginTop: "2rem" }}>Báo cáo doanh số ngày</h2>
<Table 
columns={dailySaleColumns} 
dataSource={[...saleDailyData].sort((a, b) => new Date(b.date) - new Date(a.date))} 
pagination={7} 
/> 
<PieChartComponent data={salePieData} />
</Col>
<Col xs={24} md={10}>
<br/>
<h2 style={{ marginTop: "2rem" }}>Báo cáo Doanh Số Nhân Viên</h2>
<Table columns={saleColumns} dataSource={saleReportData} pagination={false} />
</Col>
</Row>


<Row gutter={[16, 16]}>
<Col xs={24} md={15}>

</Col>
<Col xs={24} md={7}>
        

</Col>
</Row>


   

    
  </Tabs.TabPane>
</Tabs>
) : 
(currentUser.position === "leadSALE" || currentUser.position === "managerSALE") ? (
  <Tabs >
        
        <Tabs.TabPane tab="SALE" key="SALE">
          {/* Các bảng báo cáo SALE */}
          <Row gutter={[16, 16]}>
  <Col xs={24} md={14}>
  <h2 style={{ marginTop: "2rem" }}>Thống kê để giục chuyển khoản</h2>
  <Table columns={transferColumns} dataSource={transferData} pagination={false} />
  <h2 style={{ marginTop: "2rem" }}>Báo cáo doanh số ngày</h2>
    <Table 
      columns={dailySaleColumns} 
      dataSource={[...saleDailyData].sort((a, b) => new Date(b.date) - new Date(a.date))} 
      pagination={7} 
    /> 
    <PieChartComponent data={salePieData} />
  </Col>
  <Col xs={24} md={10}>
  <br/>
  <h2 style={{ marginTop: "2rem" }}>Báo cáo Doanh Số Nhân Viên</h2>
  <Table columns={saleColumns} dataSource={saleReportData} pagination={false} />
  </Col>
</Row>




         

          
        </Tabs.TabPane>
      </Tabs>
): null}
    
    </div>
  );
};export default Dashboard;
