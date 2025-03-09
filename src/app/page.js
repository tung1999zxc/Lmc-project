'use client'
import React, { useState,useEffect,useMemo  } from 'react';
import dynamic from 'next/dynamic';
import { Select, Row, Col, Table, Button, Input, Tabs ,message} from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import axios from "axios"; 
const { Option } = Select;
import { useRouter } from 'next/navigation';
const Dashboard = () => {

const [employees, setEmployees] = useState([]);
const [orders, setOrders] = useState([]);
const currentTeamId = useSelector((state) => state.user.currentUser.team_id);
const [selectedTeam, setSelectedTeam] = useState(currentTeamId);
const [adsMoneyData, setAdsMoneyData] = useState([]);//mkt
// Component biểu đồ Bar (Recharts) cho biểu đồ đơn (có 1 series)
const router = useRouter(); 
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
   

// Nếu currentUser là team lead, chỉ hiển thị các nhân viên thuộc team của họ.
  // Ví dụ, currentUser có cấu trúc { name: 'Nguyễn Văn A', position: 'lead', team_id: 'SON' }
  const isTeamLead = currentUser.position === 'lead' ;
  const filteredEmployees = isTeamLead
    ? employees.filter(emp => emp.team_id === currentUser.team_id)
    : employees;

  
const BarChartComponent = dynamic(
  () =>
    Promise.resolve(({ data }) => {
      const { BarChart, Bar, XAxis, YAxis,LabelList, CartesianGrid, Tooltip, Legend } = require('recharts');
      return (
        <BarChart width={800} height={400} data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
  dataKey="name" 
  tickFormatter={(fullName) => formatEmployeeName(fullName)} 
/>
<YAxis tickFormatter={formatYAxisTick}  tickCount={6}/>
          <Tooltip formatter={(value) => value.toLocaleString('vi-VN')} />

          <Legend />
          <Bar dataKey="profit" fill="#8884d8" >
          <LabelList
                dataKey="profit"
                formatter={formatYAxisTick }
                
                position="top"
              /></Bar>
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
  }  
  
  else if (parts.length === 2) {
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
    }
     else if (parts.length === 2) {
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
       
        <BarChart width={chartWidth} height={400} data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
  dataKey="name" 
  tickFormatter={(fullName) => formatEmployeeName(fullName)} 
/>
           
            <YAxis tickFormatter={formatYAxisTick}  tickCount={6}/>

            <Tooltip formatter={(value) => value.toLocaleString("vi-VN")} />
            <Legend />
            <Bar dataKey="profit" fill="#8884d8">
              <LabelList
                dataKey="profit"
                formatter={formatYAxisTick }
                
                position="top"
              />
            </Bar>
           
            
          </BarChart>
        
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
        <BarChart width={400} height={400} data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
  dataKey="name" 
  tickFormatter={(fullName) => formatEmployeeName(fullName)} 
/>
           
            <YAxis tickFormatter={formatYAxisTick}  tickCount={6}/>

            <Tooltip formatter={(value) => value.toLocaleString("vi-VN")} />
            <Legend />
            <Bar dataKey="profit" fill="#8884d8">
              <LabelList
                dataKey="profit"
                formatter={formatYAxisTick }
                
                position="top"
              />
            </Bar>
            <Bar dataKey="adsCost" fill="#FF8042">
              <LabelList
                dataKey="adsCost"
                formatter={formatYAxisTick }
                
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
           
            <YAxis tickFormatter={formatYAxisTick}  tickCount={6}/>

            <Tooltip formatter={(value) => value.toLocaleString("vi-VN")} />
            <Legend />
            <Bar dataKey="profit" fill="#8884d8">
              <LabelList
                dataKey="profit"
                formatter={formatYAxisTick }
                
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
<YAxis tickFormatter={formatYAxisTick}  tickCount={6}/>
            <Tooltip formatter={(value) => value.toLocaleString("vi-VN")} />
            <Legend />
            <Bar dataKey="LeadAndMembers" fill="#8884d8">
              <LabelList
                dataKey="LeadAndMembers"
                formatter={formatYAxisTick }
                
                position="top"
              />
            </Bar>
            <Bar dataKey="members" fill="#FF8042">
              <LabelList
                dataKey="members"
                formatter={formatYAxisTick }
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
        window.addEventListener('resize', handleResize);

        return () => {
          window.removeEventListener('resize', handleResize);
        };
      }, []);

const GroupedDoubleBarChartComponent2 = dynamic(
  () =>
    Promise.resolve(({ data }) => {
      const {ResponsiveContainer, BarChart,Cell,LabelList, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } = require('recharts');
      return (
       
        <BarChart width={chartWidth} height={400} data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
  dataKey="name" 
  tickFormatter={(fullName) => formatEmployeeName(fullName)} 
/>
<YAxis tickFormatter={formatYAxisTick} />
          <Tooltip formatter={(value) => value.toLocaleString('vi-VN')} />

          <Legend />
          <Bar dataKey="profit">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
                
              ))}
             <LabelList
                dataKey="profit"
                formatter={formatYAxisTick }
                position="top"
              />
            </Bar>
         
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
        <BarChart width={chartWidth} height={400} data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
  dataKey="team" 
  tickFormatter={(fullName) => formatEmployeeName(fullName)} 
/>
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
      .filter(order => order.mkt.trim().toLowerCase() === emp.name.trim().toLowerCase())
      .reduce((sum, order) => sum + order.profit, 0);
    const adsCost = filteredAds
      .filter(ad => ad.name === emp.name)
      .reduce((sum, ad) => sum + (ad.request1 + ad.request2), 0);
    return { name: emp.name, profit: sales*17000*0.95, adsCost };
  });
 
  const teamEmployees = mktEmployees.filter(emp => emp.team_id === currentUser.team_id);

const employeeChartDataNewTEAM = teamEmployees.map(emp => {
  const sales = filteredOrders
    .filter(order => order.mkt.trim().toLowerCase() === emp.name.trim().toLowerCase())
    .reduce((sum, order) => sum + order.profit, 0);
  const adsCost = filteredAds
    .filter(ad => ad.name === emp.name)
    .reduce((sum, ad) => sum + (ad.request1 + ad.request2), 0);
  return { name: emp.name, profit: sales * 17000*0.95, adsCost };
});
 
 
 
  const saleEmployees = employees.filter(emp => emp.position_team === "sale" );
  const saleEmployeesND = employees.filter(emp => emp.position_team === "sale"&& emp.position === "salenhapdon" );
  const saleEmployeesOL = employees.filter(emp => emp.position_team === "sale"&& emp.position === "salefull" );
  const saleEmployeesXL = employees.filter(emp => emp.position_team === "sale"&& emp.position === "salexuly" );
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
      fillColor = "#AA336A"; // ví dụ: màu vàng
    }
    
    return { name: emp.name, profit: sales * 17000, fill: fillColor };
  });
  

  // // === Biểu đồ doanh số theo team (Grouped Double Bar Chart) ===
  const teamChartDataNew2 = teams.map(team => {
    const teamEmps = employees.filter(emp => emp.position_team === "mkt" && emp.team_id === team.value);
    const sales = teamEmps.reduce((acc, emp) => {
      const empSales = filteredOrders
        .filter(order => order.mkt.trim().toLowerCase() === emp.name.trim().toLowerCase())
        .reduce((sum, order) => sum + order.profit, 0);
      return acc + empSales;
    }, 0);
    const adsCost = teamEmps.reduce((acc, emp) => {
      const empAds = filteredAds
        .filter(ad => ad.name === emp.name)
        .reduce((sum, ad) => sum + (ad.request1 + ad.request2), 0);
      return acc + empAds;
    }, 0);
    return { name: team.label, profit: sales*17000*0.95, adsCost };
  });
  // const teamChartDataNew = teams.map(team => {
  //   const teamEmps = employees.filter(emp => emp.position_team === "mkt" && emp.team_id === team.value);
  //   const sales = teamEmps.reduce((acc, emp) => {
  //     const empSales = filteredOrders
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


  const teamChartDataNew = teams.map(team => {
    const teamEmps = employees.filter(emp => emp.position_team === "mkt" && emp.team_id === team.value);
    const teamEmps2 = employees.filter(emp => emp.position_team === "mkt" && emp.team_id === team.value && emp.position !=="lead" );
    const sales = teamEmps.reduce((acc, emp) => {
      const empSales = filteredOrders
        .filter(order => order.mkt.trim().toLowerCase() === emp.name.trim().toLowerCase())
        .reduce((sum, order) => sum + order.profit, 0);
      return acc + empSales;
    }, 0);
    const members = teamEmps2.reduce((acc, emp) => {
      const empSales = filteredOrders
        .filter(order => order.mkt.trim().toLowerCase() === emp.name.trim().toLowerCase() )
        .reduce((sum, order) => sum + order.profit, 0);
      return acc + empSales;
    }, 0);
    
    return { name: team.label, LeadAndMembers: sales*17000, members:members*17000 };
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
      return { name: date, profit: sales*17000*0.95, adsCost };
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
      return { name: date, profit: sales*17000*0.95, adsCost };
    });
  }

// === Biểu đồ doanh số hàng ngày (Grouped Double Bar Chart) ===

let dailyChartDataNewTEAM;
// Nếu currentUser là team lead, lọc các đơn hàng và ads theo team
if (isTeamLead) {
  // Lấy danh sách tên nhân viên của team
  const teamEmployeeNames = employees
    .filter(emp => emp.team_id === currentUser.team_id && emp.position_team === "mkt")
    .map(emp => emp.name.trim().toLowerCase());
  
  // Lọc đơn hàng và ads chỉ thuộc team đó
  filteredOrders = filteredOrders.filter(order => teamEmployeeNames.includes(order.mkt.trim().toLowerCase()));
  filteredAds = filteredAds.filter(ad => teamEmployeeNames.includes(ad.name.trim().toLowerCase()));
}

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
  
  dailyChartDataNewTEAM = dateArray.map(date => {
    const sales = filteredOrders
      .filter(order => order.orderDate === date)
      .reduce((sum, order) => sum + order.profit, 0);
    const adsCost = filteredAds
      .filter(ad => ad.date === date)
      .reduce((sum, ad) => sum + (ad.request1 + ad.request2), 0);
    return { name: date, profit: sales * 17000*0.95, adsCost };
  });
} else {
  const last30Days = getLast30Days();
  dailyChartDataNewTEAM = last30Days.map(date => {
    const sales = orders
      .filter(order => order.orderDate === date)
      .reduce((sum, order) => sum + order.profit, 0);
    const adsCost = adsMoneyData
      .filter(ad => ad.date === date)
      .reduce((sum, ad) => sum + (ad.request1 + ad.request2), 0);
    return { name: date, profit: sales * 17000*0.95, adsCost };
  });
}

  // === Biểu đồ phần trăm doanh số theo team (PieChart) ===
  const totalCompanyProfit = filteredOrders.reduce((sum, order) => sum + order.profit, 0);
  const tcp=Number(totalCompanyProfit);
  const teamPieData = teamChartDataNew2.map(item => ({
    ...item,
    percent: totalCompanyProfit > 0 ?Number( ((item.profit / tcp)) * 100).toFixed(2) : 0
  }));

  // Tính tổng doanh số của các thành viên trong team
const totalTeamProfit = employeeChartDataNewTEAM.reduce(
  (sum, emp) => sum + emp.profit,
  0
);

// Tạo dữ liệu cho PieChart dựa trên doanh số của từng thành viên
const employeePieDataTEAM = employeeChartDataNewTEAM.map(emp => ({
  ...emp,
  percent: totalTeamProfit > 0
    ? Number((emp.profit / totalTeamProfit) * 100).toFixed(2)
    : 0
}));

  // === Biểu đồ doanh số trung bình của nhân viên trong từng team (BarChart) ===
  const averageTeamChartData = teams.map(team => {
    const teamEmps = employees.filter(emp => emp.position_team === "mkt" && emp.team_id === team.value);
    const teamProfit = teamEmps.reduce((acc, emp) => {
      const empSales = filteredOrders
        .filter(order => order.mkt.trim().toLowerCase() === emp.name.trim().toLowerCase())
        .reduce((sum, order) => sum + order.profit, 0);
      return acc + empSales;
    }, 0);
    const avgProfit = teamEmps.length > 0 ? teamProfit / teamEmps.length : 0;
    return { name: team.label, profit: avgProfit*17000*0.95 };
  });

  // === Biểu đồ so sánh doanh số giữa leader và các nhân viên khác trong team (Grouped Bar Chart) ===
  // Công thức: leaderPercent = (leaderSales / othersSales) * 100
  const leaderComparisonChartData = teams.map(team => {
    const teamEmps = employees.filter(emp => emp.position_team === "mkt" && emp.team_id === team.value);
    const othersEmps = teamEmps.filter(emp => emp.position !== "lead" && emp.position !== "managerMKT");

    const leaderSales0 =   teamEmps.reduce((acc, emp) => {
      const empSales = filteredOrders
        .filter(order => order.mkt.trim().toLowerCase() === emp.name.trim().toLowerCase())
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
        .filter(order => order.mkt.trim().toLowerCase() === emp.name.trim().toLowerCase())
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
      .filter(order => order.mkt.trim().toLowerCase() === emp.name.trim().toLowerCase() && order.paymentStatus === "ĐÃ THANH TOÁN")
      .reduce((sum, order) => sum + order.profit, 0);
    const unpaid = filteredOrders
      .filter(order => order.mkt.trim().toLowerCase() === emp.name.trim().toLowerCase() && (order.paymentStatus === "CHƯA THANH TOÁN"||order.paymentStatus === ""))
      .reduce((sum, order) => sum + order.profit, 0);
    const total = paid + unpaid;
    const tienVND = total * exchangeRate*0.95;
    const totalAds = filteredAds
      .filter(ad => ad.name === emp.name)
      .reduce((sum, ad) => sum + (ad.request1 + ad.request2), 0);
    const adsPercent = tienVND ? ((totalAds / tienVND) * 100).toFixed(2) : "0.00";
    return { key: index, name: emp.name, paid, unpaid, total, tienVND, totalAds, adsPercent };
  });
  // Sắp xếp theo cột "Tiền VNĐ" giảm dần
  marketingReportData.sort((a, b) => b.tienVND - a.tienVND);

// Lọc ra các thành viên mkt thuộc team của currentUser
  const teamMktEmployees = mktEmployees.filter(emp => emp.team_id === currentUser.team_id);

const marketingReportDataTEAM = teamMktEmployees.map((emp, index) => {
  const paid = filteredOrders
  .filter(order => order.mkt.trim().toLowerCase() === emp.name.trim().toLowerCase() && order.paymentStatus === "ĐÃ THANH TOÁN")
  .reduce((sum, order) => sum + order.profit, 0);
const unpaid = filteredOrders
  .filter(order => order.mkt.trim().toLowerCase() === emp.name.trim().toLowerCase() && (order.paymentStatus === "CHƯA THANH TOÁN"||order.paymentStatus === ""))
  .reduce((sum, order) => sum + order.profit, 0);
  const total = paid + unpaid;
  const tienVND = total*0.95 * exchangeRate;
  const totalAds = filteredAds
    .filter(ad => ad.name.trim().toLowerCase() === emp.name.trim().toLowerCase())
    .reduce((sum, ad) => sum + (ad.request1 + ad.request2), 0);
  const adsPercent = tienVND ? ((totalAds / tienVND) * 100).toFixed(2) : "0.00";
  return { key: index, name: emp.name, paid, unpaid, total, tienVND, totalAds, adsPercent };
});

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
          bgColor = "#F999A8";
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
  
  const saleReportDataOL = saleEmployeesOL.map((emp, index) => {
    let paid = 0, unpaid = 0;
    if (emp.position === "salenhapdon" || emp.position === "salefull") {
      paid = filteredOrders
        .filter(order => order.sale === emp.name && order.paymentStatus === "ĐÃ THANH TOÁN")
        .reduce((sum, order) => sum + order.profit, 0);
      unpaid = filteredOrders
        .filter(order => order.sale === emp.name && ( order.paymentStatus === "CHƯA THANH TOÁN" || order.paymentStatus === "" ))
        .reduce((sum, order) => sum + order.profit, 0);
    } else if (emp.position === "salexuly") {
      paid = filteredOrders
        .filter(order => order.salexuly === emp.name && order.paymentStatus === "ĐÃ THANH TOÁN")
        .reduce((sum, order) => sum + order.profit, 0);
      unpaid = filteredOrders
        .filter(order => order.salexuly === emp.name && ( order.paymentStatus === "CHƯA THANH TOÁN" || order.paymentStatus === "" ))
        .reduce((sum, order) => sum + order.profit, 0);
    }
    const total = paid + unpaid;
    const tienVND = total * exchangeRate;
    const percent = total > 0 ? (paid / total) * 100 : 0;
    return { key: index, name: emp.name, paid, unpaid, total, tienVND, percent };
  });
  const saleReportDataND = saleEmployeesND.map((emp, index) => {
    let paid = 0, unpaid = 0;
    if (emp.position === "salenhapdon" || emp.position === "salefull") {
      paid = filteredOrders
        .filter(order => order.sale === emp.name && order.paymentStatus === "ĐÃ THANH TOÁN")
        .reduce((sum, order) => sum + order.profit, 0);
      unpaid = filteredOrders
        .filter(order => order.sale === emp.name && ( order.paymentStatus === "CHƯA THANH TOÁN" || order.paymentStatus === "" ))
        .reduce((sum, order) => sum + order.profit, 0);
    } else if (emp.position === "salexuly") {
      paid = filteredOrders
        .filter(order => order.salexuly === emp.name && order.paymentStatus === "ĐÃ THANH TOÁN")
        .reduce((sum, order) => sum + order.profit, 0);
      unpaid = filteredOrders
        .filter(order => order.salexuly === emp.name && ( order.paymentStatus === "CHƯA THANH TOÁN" || order.paymentStatus === "" ))
        .reduce((sum, order) => sum + order.profit, 0);
    }
    const total = paid + unpaid;
    const tienVND = total * exchangeRate;
    const percent = total > 0 ? (paid / total) * 100 : 0;
    return { key: index, name: emp.name, paid, unpaid, total, tienVND, percent };
  });
  const saleReportDataXL = saleEmployeesXL.map((emp, index) => {
    let paid = 0, unpaid = 0;
    if (emp.position === "salenhapdon" || emp.position === "salefull") {
      paid = filteredOrders
        .filter(order => order.sale === emp.name && order.paymentStatus === "ĐÃ THANH TOÁN")
        .reduce((sum, order) => sum + order.profit, 0);
      unpaid = filteredOrders
        .filter(order => order.sale === emp.name && ( order.paymentStatus === "CHƯA THANH TOÁN" || order.paymentStatus === "" ))
        .reduce((sum, order) => sum + order.profit, 0);
    } else if (emp.position === "salexuly") {
      paid = filteredOrders
        .filter(order => order.salexuly === emp.name && order.paymentStatus === "ĐÃ THANH TOÁN")
        .reduce((sum, order) => sum + order.profit, 0);
      unpaid = filteredOrders
        .filter(order => order.salexuly === emp.name && ( order.paymentStatus === "CHƯA THANH TOÁN" || order.paymentStatus === "" ))
        .reduce((sum, order) => sum + order.profit, 0);
    }
    const total = paid + unpaid;
    const tienVND = total * exchangeRate;
    const percent = total > 0 ? (paid / total) * 100 : 0;
    return { key: index, name: emp.name, paid, unpaid, total, tienVND, percent };
  });
  const saleReportData = saleEmployees.map((emp, index) => {
    let paid = 0, unpaid = 0;
    if (emp.position === "salenhapdon" || emp.position === "salefull") {
      paid = filteredOrders
        .filter(order => order.sale === emp.name && order.paymentStatus === "ĐÃ THANH TOÁN")
        .reduce((sum, order) => sum + order.profit, 0);
      unpaid = filteredOrders
        .filter(order => order.sale === emp.name && ( order.paymentStatus === "CHƯA THANH TOÁN" || order.paymentStatus === "" ))
        .reduce((sum, order) => sum + order.profit, 0);
    } else if (emp.position === "salexuly") {
      paid = filteredOrders
        .filter(order => order.salexuly === emp.name && order.paymentStatus === "ĐÃ THANH TOÁN")
        .reduce((sum, order) => sum + order.profit, 0);
      unpaid = filteredOrders
        .filter(order => order.salexuly === emp.name && ( order.paymentStatus === "CHƯA THANH TOÁN" || order.paymentStatus === "" ))
        .reduce((sum, order) => sum + order.profit, 0);
    }
    const total = paid + unpaid;
    const tienVND = total * exchangeRate;
    const percent = total > 0 ? (paid / total) * 100 : 0;
    return { key: index, name: emp.name, paid, unpaid, total, tienVND, percent };
  });
  saleReportData.sort((a, b) => b.tienVND - a.tienVND);
  saleReportDataXL.sort((a, b) => b.tienVND - a.tienVND);
  saleReportDataOL.sort((a, b) => b.tienVND - a.tienVND);
  saleReportDataND.sort((a, b) => b.tienVND - a.tienVND);
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
        bgColor = "#F999A8"; // nền đỏ nhạt
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
    let sangSom = 0, hanhChinh = 0, toi = 0, sodon = 0;
    filteredOrders.forEach(order => {
      if (order.orderDate === date) {
        let emp = saleEmployees.find(e => e.name === order.sale);
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
    return { key: date, date, sangSom, hanhChinh, toi, total, percentSang, percentHanh, percentToi,sodon };
  });

  const dailySaleColumns = [
    { title: "Ngày", dataIndex: "date", key: "date" },
    { title: "Sáng sớm", dataIndex: "sangSom", key: "sangSom", render: (value) => value.toLocaleString() },
    { title: "Hành chính", dataIndex: "hanhChinh", key: "hanhChinh", render: (value) => value.toLocaleString() },
    { title: "Tối", dataIndex: "toi", key: "toi", render: (value) => value.toLocaleString() },
    { title: "Tổng", dataIndex: "total", key: "total", render: (value) => value.toLocaleString() },
    { title: "VNĐ", dataIndex: "total", key: "total", render: (value) => (value*17000).toLocaleString() },
    { title: "SL Đơn", dataIndex: "sodon", key: "sodon", render: (value) => value.toLocaleString() },
    { title: "% Ds ca Sáng sớm", dataIndex: "percentSang", key: "percentSang",   render: (percent) => {
      let bgColor;
      if (percent >50 ) {
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
        bgColor = "#F999A8"; // nền đỏ nhạt
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
        bgColor = "#F999A8"; // nền đỏ nhạt
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
    .filter(order => ( order.paymentStatus === "CHƯA THANH TOÁN" || order.paymentStatus === "" )&& order.deliveryStatus === "GIAO THÀNH CÔNG" &&order.saleReport === "DONE")
    .reduce((sum, order) => sum + order.revenue, 0);
  const daGuiHangKW = filteredOrders
    .filter(order => ( order.paymentStatus === "CHƯA THANH TOÁN" || order.paymentStatus === "" ) && order.deliveryStatus === "ĐÃ GỬI HÀNG" &&order.saleReport === "DONE")
    .reduce((sum, order) => sum + order.revenue, 0);
  const chuaGuiHangKW = filteredOrders
    .filter(order => ( order.paymentStatus === "CHƯA THANH TOÁN" || order.paymentStatus === "" ) && (order.deliveryStatus === ""||order.deliveryStatus === "BỊ BẮT CHỜ GỬI LẠI") && order.saleReport === "DONE" )
    .reduce((sum, order) => sum + order.revenue, 0);
  const SLgiaoThanhCongKW = filteredOrders
    .filter(order => ( order.paymentStatus === "CHƯA THANH TOÁN" || order.paymentStatus === "" ) && order.deliveryStatus === "GIAO THÀNH CÔNG" &&order.saleReport === "DONE");
    
  const SLdaGuiHangKW = filteredOrders
    .filter(order => ( order.paymentStatus === "CHƯA THANH TOÁN" || order.paymentStatus === "" ) && order.deliveryStatus === "ĐÃ GỬI HÀNG" &&order.saleReport === "DONE");
   
  const SLchuaGuiHangKW = filteredOrders
    .filter(order => ( order.paymentStatus === "CHƯA THANH TOÁN" || order.paymentStatus === "" )&& (order.deliveryStatus === ""||order.deliveryStatus === "BỊ BẮT CHỜ GỬI LẠI") && order.saleReport === "DONE" );
 
  const tong = giaoThanhCongKW+ daGuiHangKW +chuaGuiHangKW;
  

  const transferData = [
    { key: "KW", currency: "KW", giaoThanhCong: giaoThanhCongKW, daGuiHang: daGuiHangKW ,chuaGuiHang:chuaGuiHangKW, tong :tong},
    { key: "VND", currency: "VND", giaoThanhCong: giaoThanhCongKW * exchangeRate, daGuiHang: daGuiHangKW * exchangeRate,chuaGuiHang:chuaGuiHangKW*exchangeRate,tong :tong*exchangeRate },
    { key: "SL", currency: "SL ĐƠN", giaoThanhCong: SLgiaoThanhCongKW.length, daGuiHang: SLdaGuiHangKW.length,chuaGuiHang:SLchuaGuiHangKW.length, tong:(SLgiaoThanhCongKW.length+SLdaGuiHangKW.length+SLchuaGuiHangKW.length) }
  ];

  const transferColumns = [
    { title: "Tiền tệ", dataIndex: "currency", key: "currency" },
    { title: "Giao thành công", dataIndex: "giaoThanhCong", key: "giaoThanhCong", render: (value) => value.toLocaleString() },
    { title: "Đã gửi hàng", dataIndex: "daGuiHang", key: "daGuiHang", render: (value) => value.toLocaleString() },
    { title: "Chưa gửi hàng", dataIndex: "chuaGuiHang", key: "chuaGuiHang", render: (value) => value.toLocaleString() },
    
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
      }
    },
  ];

  // THỰC TẾ ĐÃ TRỪ 5
  const daThanhToanKW3 = filteredOrders
  .filter(order => order.paymentStatus === "ĐÃ THANH TOÁN")
  .reduce((sum, order) => sum + order.profit, 0);
const chuaThanhToanKW3 = filteredOrders
  .filter(order => order.paymentStatus === "CHƯA THANH TOÁN" || order.paymentStatus === "")
  .reduce((sum, order) => sum + order.profit, 0);
const tongKW3 = daThanhToanKW3 + chuaThanhToanKW3;

const totalAdsKW3 = filteredAds.reduce((sum, ad) => sum + (ad.request1 + ad.request2), 0);
const percentAds3 = tongKW3 > 0 ? Number(((totalAdsKW3 / (tongKW3*exchangeRate)) * 100).toFixed(2)) : 0;
  // Bảng Tổng
  const daThanhToanKW = filteredOrders
    .filter(order => order.paymentStatus === "ĐÃ THANH TOÁN")
    .reduce((sum, order) => sum + order.revenue, 0);
  const chuaThanhToanKW = filteredOrders
    .filter(order => order.paymentStatus === "CHƯA THANH TOÁN" || order.paymentStatus === "")
    .reduce((sum, order) => sum + order.revenue, 0);
  const tongKW = daThanhToanKW + chuaThanhToanKW;
  const thanhToanDat = tongKW > 0 ? (daThanhToanKW / tongKW) * 100 : 0;
  const totalAdsKW = filteredAds.reduce((sum, ad) => sum + (ad.request1 + ad.request2), 0);
  const percentAds = tongKW > 0 ? Number(((totalAdsKW / (tongKW*exchangeRate)) * 100).toFixed(2)) : 0;


  if (isTeamLead|| currentUser.position==="admin" || currentUser.position==="managerMKT") {
    const teamEmployeeNames = employees
      .filter(emp => emp.team_id === currentUser.team_id)
      .map(emp => emp.name.trim().toLowerCase());
    
    // Lọc các đơn hàng theo tên nhân viên thuộc team
    filteredOrders = filteredOrders.filter(order =>
      teamEmployeeNames.includes(order.mkt.trim().toLowerCase())
    );
    
    // Lọc chi phí ads theo tên nhân viên thuộc team
    filteredAds = filteredAds.filter(ad =>
      teamEmployeeNames.includes(ad.name.trim().toLowerCase())
    );
  }
  
  // Bảng Tổng chỉ của các thành viên trong team
  const daThanhToanKW2 = filteredOrders
    .filter(order => order.paymentStatus === "ĐÃ THANH TOÁN")
    .reduce((sum, order) => sum + order.profit, 0);
  const chuaThanhToanKW2 = filteredOrders
    .filter(order => (order.paymentStatus === "CHƯA THANH TOÁN" || order.paymentStatus === ""))
    .reduce((sum, order) => sum + order.profit, 0);
  const tongKW2 = daThanhToanKW2 + chuaThanhToanKW2;
  const thanhToanDat2 = tongKW2 > 0 ? (daThanhToanKW2 / tongKW2) * 100 : 0;
  const totalAdsKW2 = filteredAds.reduce((sum, ad) => sum + (ad.request1 + ad.request2), 0);
  const percentAds2 = tongKW2 > 0 ? Number(((totalAdsKW2 / (tongKW2 * exchangeRate)) * 100).toFixed(2)) : 0;
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
      chuaThanhToan: chuaThanhToanKW* exchangeRate,
      tong: tongKW* exchangeRate,
      thanhToanDat: thanhToanDat,
      totalAds: totalAdsKW ,
      percentAds: percentAds
    }
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
      tong: tongKW2*0.95 * exchangeRate,
      // thanhToanDat: thanhToanDat2,
      totalAds: totalAdsKW2 ,
      percentAds: percentAds2
    }
  ];
  const totalData3 = [
    
    {
      key: "VND",
     
      tong: tongKW3 *exchangeRate,
     
      totalAds: totalAdsKW3 ,
      percentAds: percentAds3
    }
  ];

  const totalColumns = [
    { title: "Đã thanh toán", dataIndex: "daThanhToan", key: "daThanhToán", render: (value) => value.toLocaleString() },
    { title: "Chưa thanh toán", dataIndex: "chuaThanhToan", key: "chuaThanhToán", render: (value) => value.toLocaleString() },
    
    { title: "Thanh toán đạt", dataIndex: "thanhToanDat", key: "thanhToanDat",   render: (percent) => {
      let bgColor;
      if (percent >80 ) {
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
            fontWeight: "bold"
          }}
        >
          {percent.toFixed(2)}%
        </div>
      );
    }
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
    }
  },
   
  ];
  const totalColumns3 = [
    
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
        bgColor = "#F999A8"; // nền đỏ nhạt
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
    style={{
      transform: "scale(0.85)",
      transformOrigin: "top left",
      width: "115%" // Để bù lại không gian khi scale
    }}
    >
      {/* Bộ lọc */}
      {( currentUser.position === "lead" || (currentUser.position === "admin" && selectedTeam) ||(currentUser.position === "managerMKT" && selectedTeam ))  && (
      <Row gutter={[16, 16]}  >
      <Col xs={24} md={16}>
      <Row>
      <Col xs={24} md={7}><div style={{ marginBottom: "1rem" }}>
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
          </div>
          </Col>
      <Col xs={24} md={9}><div style={{ marginBottom: "1rem" }}>
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
          </div>
           </Col>
       {(currentUser.position === "admin"  || currentUser.position === "managerMKT") && (    <Col xs={24} sm={12} md={8}>
           <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ marginRight: 8 }}>Chọn team: </span>
                        <Select
                        allowClear
                          value={selectedTeam}
                          style={{ width: '100%' }}
                          onChange={(value) => setSelectedTeam(value)}
                        >
                          
                          {teams.map(team => (
                            <Option key={team.value} value={team.value}>
                              {team.label}
                            </Option>
                          ))}
                        </Select>
                      </div>
                    </Col>)}
       {currentUser.position === "lead"   && (    <Col xs={24} sm={12} md={8}>
           <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ marginRight: 8 }}>Chọn team: </span>
                        <Select
                        disabled={currentUser.employee_code !== 6518}
                        allowClear
                          value={selectedTeam}
                          style={{ width: '100%' }}
                          onChange={(value) => setSelectedTeam(value)}
                        >
                            <Option key={1234} value={"SON"}>
                              TEAM SƠN
                            </Option>
                            <Option key={1235657} value={"QUAN"}>
                              TEAM QUÂN
                            </Option>
                          
                        </Select>
                      </div>
                    </Col>)}
       </Row>
      
        
      </Col>
      <Col xs={24} md={8}>
      
      <Table columns={totalColumns3} dataSource={totalData2} pagination={false} />
      </Col>
     
     
    </Row>)}
      {((currentUser.position === "admin" && !selectedTeam) ||(currentUser.position === "managerMKT" && !selectedTeam )||currentUser.position === "managerSALE" ||currentUser.position === "leadSALE"   ) && (<>
      <Row gutter={[16, 16]}  >
  <Col xs={24} md={16}>
  <Row>
  <Col xs={24} md={7}><div style={{ marginBottom: "1rem" }}>
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
      </div>
      </Col>
  <Col xs={24} md={9}><div style={{ marginBottom: "1rem" }}>
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
      </div>
       </Col>
       <Col xs={24} sm={12} md={8}>
       <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ marginRight: 8 }}>Chọn team: </span>
                    <Select
                    allowClear
                      value={selectedTeam}
                      style={{ width: '100%' }}
                      onChange={(value) => setSelectedTeam(value)}
                    >
                      
                      {teams.map(team => (
                        <Option key={team.value} value={team.value}>
                          {team.label}
                        </Option>
                      ))}
                    </Select>
                  </div>
                </Col>
   </Row>
  
    
  </Col>
 
 
</Row>
<Row>
<Col xs={24} md={12}>
  <h2 style={{ marginTop: "2rem" }}>Tổng khách thanh toán</h2>
  <Table columns={totalColumns} dataSource={totalData} pagination={false} />
  {(currentUser.position === "admin" ||currentUser.position === "managerMKT"  ) && (<>
  <h2 style={{ marginTop: "2rem" }}>Tổng</h2>
  <Table columns={totalColumns3} dataSource={totalData3} pagination={false} /></>)}
  </Col>
  <Col xs={24} md={2}></Col>
  <Col xs={24} md={10}>
  <h2 style={{ marginTop: "2rem" }}>Thống kê để giục chuyển khoản</h2>
<Table columns={transferColumns} dataSource={transferData} pagination={false} /></Col>
  
</Row></>)}
<br></br>
      
{(currentUser.position === "admin" && !selectedTeam) ||(currentUser.position === "managerMKT" && !selectedTeam ) ? (
  <Tabs defaultActiveKey="MKT">
  <Tabs.TabPane tab="MKT" key="MKT">
 
 
    <Row gutter={[16, 16]} style={{ marginTop: "2rem" }}>
<Col xs={24} md={24}>
<h3>Doanh số Nhân viên MKT</h3>
  
  <GroupedDoubleBarChartComponent data={employeeChartDataNew} />

</Col>
{/* <Col xs={24} md={1}></Col> */}
<Col xs={24} md={24}>
<h3 style={{ marginTop: '2rem' }}>
    {isFilterApplied
      ? "Doanh số hàng ngày "
      : "Doanh số hàng ngày "}
  </h3>
  <GroupedDoubleBarChartComponent data={dailyChartDataNew} />

</Col>

</Row>
  
  <Row gutter={[16, 16]}>
      <Col xs={24} md={24}>
      
      </Col>
      <Col xs={24} md={24}>
      
      </Col>
      
    </Row>
  
  <Row gutter={[16, 16]}>
      <Col xs={24} md={24}>
      
      </Col>
      
      
    </Row>
  
 
 
  
    
 

    {/* Báo cáo Marketing và các biểu đồ cũ */}
    <Row gutter={[16, 16]} style={{ marginTop: "2rem" }}>
<Col xs={24} md={14}>
<h3>Doanh số theo Team</h3>
<GroupedDoubleBarChartComponent3 data={teamChartDataNew} />

</Col>
<Col xs={24} md={2}>


</Col>
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
<h3 style={{ marginTop: "2rem" }}>Doanh số trung bình theo Nhân viên theo Team</h3>
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
      <Col xs={24} md={5}>
      
      </Col>
      <Col xs={24} md={14}>
      
      </Col>
      <Col xs={24} md={5}>
      
      </Col>
    </Row>
<Row gutter={[16, 16]}>
      
      <Col xs={24} md={24}>
      <h2>Báo cáo marketing</h2>
<Table columns={marketingColumns} dataSource={marketingReportData} pagination={false} />  
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

  <GroupedDoubleBarChartComponent2 data={employeeChartDataNewsale} />

      </Col>
      
    </Row>
 
    {/* Các bảng báo cáo SALE */}
    <Row gutter={[16, 16]}>
<Col xs={24} md={14}>

<h2 style={{ marginTop: "2rem" }}>Báo cáo doanh số ngày</h2>
<Table 
columns={dailySaleColumns} 
dataSource={[...saleDailyData].sort((a, b) => new Date(b.date) - new Date(a.date))} 
pagination={7} 
/> </Col>
<Col xs={24} md={1}>
  

</Col>


<Col xs={24} md={9}>
<br/>
<br/>
<br/>
<br/>
<br/>
<br/>
<PieChartComponent data={salePieData} /> 
</Col>
</Row>


<Row gutter={[16, 16]}>
<Col xs={24} md={15}>

</Col>
<Col xs={24} md={7}>
        

</Col>
</Row>
<h2 style={{ marginTop: "2rem" }}>Báo cáo Doanh Số Nhân Viên Sale XỬ LÝ</h2>
<Table columns={saleColumns} dataSource={saleReportDataXL} pagination={false} />
<h2 style={{ marginTop: "2rem" }}>Báo cáo Doanh Số Nhân Viên Sale ONLINE</h2>
<Table columns={saleColumns} dataSource={saleReportDataOL} pagination={false} />
<h2 style={{ marginTop: "2rem" }}>Báo cáo Doanh Số Nhân Viên Sale NHẬP ĐƠN</h2>
<Table columns={saleColumns} dataSource={saleReportDataND} pagination={false} />

   

    
  </Tabs.TabPane>
</Tabs>
) : 
(currentUser.position === "leadSALE" || currentUser.position === "managerSALE") ? (
  <Tabs >
        
        <Tabs.TabPane tab="SALE" key="SALE">
       

          {/* Các bảng báo cáo SALE */}
          <Row gutter={[16, 16]}>
  <Col xs={24} md={15}>
  
  
  
  <h2 style={{ marginTop: "2rem" }}>Báo cáo doanh số ngày</h2>
    <Table 
      columns={dailySaleColumns} 
      dataSource={[...saleDailyData].sort((a, b) => new Date(b.date) - new Date(a.date))} 
      pagination={7} 
    /> 
   
   <Row gutter={[16, 16]}>
      
      <Col xs={24} md={10}>
      
      </Col>
      <Col xs={24} md={10}>
     
      <PieChartComponent data={salePieData} />

      </Col>
      
    </Row>
    
  </Col>
  <Col xs={24} md={9}>
  <br/>
  
  <h2 style={{ marginTop: "2rem" }}>Báo cáo Doanh Số Nhân Viên Sale XỬ LÝ</h2>
<Table columns={saleColumns} dataSource={saleReportDataXL} pagination={false} />
<h2 style={{ marginTop: "2rem" }}>Báo cáo Doanh Số Nhân Viên Sale ONLINE</h2>
<Table columns={saleColumns} dataSource={saleReportDataOL} pagination={false} />
<h2 style={{ marginTop: "2rem" }}>Báo cáo Doanh Số Nhân Viên Sale NHẬP ĐƠN</h2>
<Table columns={saleColumns} dataSource={saleReportDataND} pagination={false} />
  </Col>
</Row>
<h3>Doanh số Nhân viên SALE</h3>

<GroupedDoubleBarChartComponent2 data={employeeChartDataNewsale} />
<h3 style={{ marginTop: '2rem' }}>
    {isFilterApplied
      ? "Doanh số hàng ngày "
      : "Doanh số hàng ngày "}
  </h3>
  <GroupedDoubleBarChartComponent data={dailyChartDataNew} />




         

          
        </Tabs.TabPane>
      </Tabs>
): null}
{(currentUser.position === "lead" ||(currentUser.position === "admin" && selectedTeam) ||(currentUser.position === "managerMKT" && selectedTeam ))&& (
  <>
<Row gutter={[16, 16]}>
      <Col xs={24} md={14}>
        
      </Col>
      
      
      
    </Row>
<Row gutter={[16, 16]}>
      <Col xs={24} md={14}>
      <h2>Báo cáo marketing</h2>
  <Table columns={marketingColumns} dataSource={marketingReportDataTEAM} pagination={false} />  
      </Col>
      <Col xs={24} md={10}><br></br>
      
      <h3>Doanh số Nhân viên MKT</h3>
  
  <GroupedDoubleBarChartComponentTEAM data={employeeChartDataNewTEAM} />
      
      
      </Col>
      
      
    </Row>
<Row gutter={[16, 16]}>
      <Col xs={24} md={14}>
      <h3 style={{ marginTop: '2rem' }}>
      {isFilterApplied ? "Doanh số hàng ngày " : "Doanh số hàng ngày "}
    </h3>
    <GroupedDoubleBarChartComponentTEAM data={dailyChartDataNewTEAM} />
      </Col>
      <Col xs={24} md={10}>
    <br></br>  
  <h3>Phần trăm doanh số thành viên</h3>
  <PieChartComponent data={employeePieDataTEAM} />
      </Col>
      
     
    </Row>
    

  
  
    
   
    
  </>
)}
    </div>
  );
};export default Dashboard;
