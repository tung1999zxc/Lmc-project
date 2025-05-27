'use client'
import { useState, useEffect } from "react";
import { Table, Select,Switch, message } from "antd";
import dayjs from "dayjs";
import { useSelector } from "react-redux";
import axios from "axios"; 
import { useRouter } from 'next/navigation';

import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
dayjs.extend(isSameOrAfter);

const Dashboard = () => {
  const [filterRange, setFilterRange] = useState("week");
  const [orders, setOrders] = useState([]);
  const [employeeStatusMap, setEmployeeStatusMap] = useState({});
  const router = useRouter(); 
  
  const currentUser = useSelector((state) => state.user.currentUser);
  useEffect(() => {
    if (!currentUser.name) {
      router.push("/login");
    }
  }, []);
  // Dữ liệu orders mẫu; bạn có thể thay thế bằng dữ liệu thật từ API hay nguồn khác.
  const fetchOrders = async () => {
    try {
      const response = await axios.get(`/api/orders2?selectedPreset=${filterRange}`);
      setOrders(response.data.data);
    } catch (error) {
      console.error(error);
      message.error("Lỗi khi lấy đơn hàng");
    }
  };
  useEffect(() => {
    fetchOrders();
    fetchEmployeesStatus();
  }, [filterRange]);



  const fetchEmployeesStatus = async () => {
    try {
      const res = await axios.get('/api/employees');
      const map = {};
      res.data.data.forEach(emp => {
        if (emp.name) {
          map[emp.name] = emp.status || false;
        }
      });
      setEmployeeStatusMap(map);
    } catch (error) {
      console.error("Lỗi tải trạng thái:", error);
    }
  }; 


  // Lọc orders theo bộ lọc thời gian được chọn
  const getFilteredOrders = () => {
    const today = dayjs();
    return orders.filter(order => {
      // Sử dụng order.orderDate thay vì order.date
      const orderDate = dayjs(order.orderDate);
      switch(filterRange) {
        case "all":
          return true;
        case "today":
          return orderDate.isSame(today, "day");
        case "week":
          return orderDate.isAfter(today.subtract(7, "day"));
        case "currentMonth":
          return orderDate.isSameOrAfter(today.startOf("month"));
        case "lastMonth": {
          const prevMonth = today.subtract(1, "month");
          return orderDate.isAfter(prevMonth.startOf("month")) && orderDate.isBefore(prevMonth.endOf("month"));
        }
        case "twoMonthsAgo": {
          const twoMonthsAgo = today.subtract(2, "month");
          return orderDate.isAfter(twoMonthsAgo.startOf("month")) && orderDate.isBefore(twoMonthsAgo.endOf("month"));
        }
        case "threeMonthsAgo": {
          const threeMonthsAgo = today.subtract(3, "month");
          return orderDate.isAfter(threeMonthsAgo.startOf("month")) && orderDate.isBefore(threeMonthsAgo.endOf("month"));
        }
        default:
          return true;
      }
    });
  };

  // Lấy danh sách ngày (unique date) từ orders đã lọc, có thể theo từng nhân viên nếu cần
  const getUniqueDatesForUser = (user) => {
    let filtered = getFilteredOrders();
    if (user) {
      filtered = filtered.filter(order => order.salexuly === user);
    }
    const uniqueDates = [...new Set(filtered.map(order => order.orderDate))];
    // Sắp xếp ngày giảm dần (mới nhất ở đầu)
    return uniqueDates.sort((a, b) => dayjs(b).unix() - dayjs(a).unix());
  };

  // Hàm tính các chỉ số cho 1 ngày (có thể lọc theo user)
  const computeMetricsByDate = (date, user = null) => {
    let ordersForDate = orders.filter(order => order.orderDate === date);
    if (user) {
      ordersForDate = ordersForDate.filter(order => order.salexuly === user);
    }
    const sharedOrders = ordersForDate.length;
    const completedOrders = ordersForDate.filter(order => order.paymentStatus === "ĐÃ THANH TOÁN").length;
    const totalRevenue = ordersForDate.reduce((acc, order) => acc + Number(order.profit || 0), 0);
    const paidRevenue = ordersForDate
      .filter(order => order.paymentStatus === "ĐÃ THANH TOÁN")
      .reduce((acc, order) => acc + Number(order.profit || 0), 0);
    const unpaidRevenue = ordersForDate
      .filter(order => (order.paymentStatus === "CHƯA THANH TOÁN"|| order.paymentStatus === ""))
      .reduce((acc, order) => acc + Number(order.profit || 0), 0);
    const paymentRate = totalRevenue ? (paidRevenue / totalRevenue) : 0;
    return { sharedOrders, completedOrders, totalRevenue, paidRevenue, unpaidRevenue, paymentRate };
  };

  // Cấu hình các cột cho bảng
  const columns = (user) => [
    { title: "Ngày", dataIndex: "orderDate", key: "orderDate" },
    { 
      title: "Số đơn được chia", 
      key: "sharedOrders",
      render: (_, record) => {
        const { sharedOrders } = computeMetricsByDate(record.orderDate, user);
        return sharedOrders;
      }
    },
    { 
      title: "Số lượng đơn đòi được", 
      key: "completedOrders",
      render: (_, record) => {
        const { completedOrders } = computeMetricsByDate(record.orderDate, user);
        return completedOrders;
      }
    },
    { 
      title: "Tổng doanh số", 
      key: "totalRevenue",
      render: (_, record) => {
        const { totalRevenue } = computeMetricsByDate(record.orderDate, user);
        return totalRevenue;
      }
    },
    { 
      title: "Đã thanh toán", 
      key: "paidRevenue",
      render: (_, record) => {
        const { paidRevenue } = computeMetricsByDate(record.orderDate, user);
        return paidRevenue;
      }
    },
    { 
      title: "Chưa thanh toán", 
      key: "unpaidRevenue",
      render: (_, record) => {
        const { unpaidRevenue } = computeMetricsByDate(record.orderDate, user);
        return unpaidRevenue;
      }
    },
    { 
      title: "Tỉ lệ thanh toán", 
      key: "paymentRate",
      render: (_, record) => {
        const { paymentRate } = computeMetricsByDate(record.orderDate, user);
        const percent = Number((paymentRate * 100));
        let bgColor = "";
        if (percent < 80) {
          bgColor = "#FB686A";
        } else if (percent >= 80 && percent <= 95) {
          bgColor = "#FF9501";
        } else {
          bgColor = "#54DA1F";
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

  // Hiển thị dòng tổng hợp (header) cho các chỉ số, có thể theo từng nhân viên
  const renderSummary = (user = null) => {
    let filtered = getFilteredOrders();
    if (user) {
      filtered = filtered.filter(order => order.salexuly === user);
    }
    const totalRevenueSum = filtered.reduce(
      (acc, order) => acc + Number(order.profit || 0),
      0
    );
    const paidRevenueSum = filtered
      .filter(order => order.paymentStatus === "ĐÃ THANH TOÁN")
      .reduce((acc, order) => acc + Number(order.profit || 0), 0);
    const unpaidRevenueSum = filtered
      .filter(order => (order.paymentStatus === "CHƯA THANH TOÁN"|| order.paymentStatus === ""))
      .reduce((acc, order) => acc + Number(order.profit || 0), 0);
    const summaryRate = totalRevenueSum ? paidRevenueSum / totalRevenueSum : 0;
    const ratePercentage = summaryRate * 100;
    
    let bgColor = "";
    if (ratePercentage < 80) {
      bgColor = "#FB686A";
    } else if (ratePercentage >= 80 && ratePercentage <= 95) {
      bgColor = "#FF9501";
    } else {
      bgColor = "#54DA1F";
    }
    
    return (
     <>
     <h3 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
  NV: {user}
  <Switch
    checked={employeeStatusMap[user]}
    onChange={async (checked) => {
      try {
        await axios.post('/api/employees/update-status', {
          name: user,
          status: checked
        });
        message.success(`Đã ${checked ? 'bật' : 'tắt'} trạng thái cho ${user}`);
        setEmployeeStatusMap(prev => ({ ...prev, [user]: checked }));
      } catch (err) {
        message.error("Lỗi khi cập nhật trạng thái");
      }
    }}
    checkedChildren="Bật"
    unCheckedChildren="Tắt"
  />
</h3> <br /> <div
        style={{
          backgroundColor: bgColor,
          padding: "4px 8px",
          borderRadius: "4px"
        }}
      >
       
        Chưa thanh toán: <strong>{unpaidRevenueSum}</strong> | Đã thanh toán: <strong>{paidRevenueSum}</strong> | TỔNG :<strong> {unpaidRevenueSum+ paidRevenueSum}</strong> |VNĐ :<strong> {((unpaidRevenueSum+ paidRevenueSum)*17000).toLocaleString('vi-VN')}</strong>| % Thanh Toán Đạt: <strong>{ratePercentage.toFixed(2)}%</strong>
      </div></>
    );
  };

  return (
    <div>
      {/* Bộ lọc theo khoảng thời gian */}
      <div style={{ marginBottom: 16 }}>
        <span style={{ marginRight: 8 }}>Bộ lọc theo khoảng thời gian: </span>
        <Select value={filterRange} onChange={setFilterRange} style={{ width: 250 }}>
          {/* <Select.Option value="all">Tất cả</Select.Option> */}
          <Select.Option value="today">1 Ngày</Select.Option>
          <Select.Option value="week">1 Tuần</Select.Option>
          <Select.Option value="currentMonth">1 Tháng (từ đầu tháng)</Select.Option>
          <Select.Option value="lastMonth">Tháng trước</Select.Option>
          <Select.Option value="twoMonthsAgo">2 tháng trước</Select.Option>
          <Select.Option value="threeMonthsAgo">3 tháng trước</Select.Option>
        </Select>
      </div>
      {(currentUser.position === "managerMKT" ||
        currentUser.position === "managerSALE" ||
        currentUser.position === "admin" ||
        currentUser.position === "leadSALE") ? (
        // Nếu là quản lý, hiển thị bảng cho từng nhân viên
        [...new Set(getFilteredOrders().map(order => order.salexuly))].map(user => (
          <div key={user} style={{ marginBottom: 10 }}>
            {renderSummary(user)}
            <Table
              dataSource={getUniqueDatesForUser(user).map(orderDate => ({ key: orderDate, orderDate }))}
              columns={columns(user)}
              pagination={{ pageSize: 5 }}
              bordered
            />
          </div>
        ))
      ) : (
        // Nếu không phải quản lý, chỉ hiển thị dữ liệu của người dùng hiện tại
        <>
          {renderSummary(currentUser.name)}
          <Table
            dataSource={getUniqueDatesForUser(currentUser.name).map(orderDate => ({ key: orderDate, orderDate }))}
            columns={columns(currentUser.name)}
            pagination={{ pageSize: 30 }}
            bordered
          />
        </>
      )}
    </div>
  );
};

export default Dashboard;
