'use client'
import { useState } from "react";
import { Table, Select, Space } from "antd";
import dayjs from "dayjs";
import { useSelector } from "react-redux";

const Dashboard = () => {
  const currentUser = useSelector((state) => state.user.currentUser);

  // Dữ liệu orders mẫu; bạn có thể thay thế bằng dữ liệu thật từ API hay nguồn khác.
  const [orders, setOrders] = useState([
    { id: 1, salexuly: "salexuly1", date: "2025-02-20", paymentStatus: "ĐÃ THANH TOÁN", revenue: 100 },
    { id: 2, salexuly: "salexuly2", date: "2025-02-20", paymentStatus: "CHƯA THANH TOÁN", revenue: 50 },
    { id: 3, salexuly: "salexuly", date: "2025-02-19", paymentStatus: "ĐÃ THANH TOÁN", revenue: 200 },
    // ... thêm dữ liệu nếu cần
  ]);

  // Bộ lọc thời gian: all, day, week, month, previousMonth, twoMonthsAgo, threeMonthsAgo
  const [filterRange, setFilterRange] = useState("all");

  // Lọc orders theo bộ lọc thời gian được chọn
  const getFilteredOrders = () => {
    const today = dayjs();
    return orders.filter(order => {
      const orderDate = dayjs(order.date);
      switch(filterRange) {
        case "all":
          return true;
        case "day":
          return orderDate.isSame(today, "day");
        case "week":
          return orderDate.isAfter(today.subtract(7, "day"));
        case "month":
          return orderDate.isAfter(today.startOf("month"));
        case "previousMonth": {
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
    const uniqueDates = [...new Set(filtered.map(order => order.date))];
    // Sắp xếp ngày giảm dần (mới nhất ở đầu)
    return uniqueDates.sort((a, b) => dayjs(b).unix() - dayjs(a).unix());
  };

  // Hàm tính các chỉ số cho 1 ngày (có thể lọc theo user)
  const computeMetricsByDate = (date, user = null) => {
    let ordersForDate = orders.filter(order => order.date === date);
    if (user) {
      ordersForDate = ordersForDate.filter(order => order.salexuly === user);
    }
    const sharedOrders = ordersForDate.length;
    const completedOrders = ordersForDate.filter(order => order.paymentStatus === "ĐÃ THANH TOÁN").length;
    const totalRevenue = ordersForDate.reduce((acc, order) => acc + Number(order.revenue || 0), 0);
    const paidRevenue = ordersForDate
      .filter(order => order.paymentStatus === "ĐÃ THANH TOÁN")
      .reduce((acc, order) => acc + Number(order.revenue || 0), 0);
    const unpaidRevenue = ordersForDate
      .filter(order => order.paymentStatus === "CHƯA THANH TOÁN")
      .reduce((acc, order) => acc + Number(order.revenue || 0), 0);
    const paymentRate = totalRevenue ? (paidRevenue / totalRevenue) : 0;
    return { sharedOrders, completedOrders, totalRevenue, paidRevenue, unpaidRevenue, paymentRate };
  };

  // Cấu hình các cột cho bảng
  const columns = (user) => [
    { title: "Ngày", dataIndex: "date", key: "date" },
    { 
      title: "Số đơn được chia", 
      key: "sharedOrders",
      render: (_, record) => {
        const { sharedOrders } = computeMetricsByDate(record.date, user);
        return sharedOrders;
      }
    },
    { 
      title: "Số lượng đơn đòi được", 
      key: "completedOrders",
      render: (_, record) => {
        const { completedOrders } = computeMetricsByDate(record.date, user);
        return completedOrders;
      }
    },
    { 
      title: "Tổng doanh số", 
      key: "totalRevenue",
      render: (_, record) => {
        const { totalRevenue } = computeMetricsByDate(record.date, user);
        return totalRevenue;
      }
    },
    { 
      title: "Đã thanh toán", 
      key: "paidRevenue",
      render: (_, record) => {
        const { paidRevenue } = computeMetricsByDate(record.date, user);
        return paidRevenue;
      }
    },
    { 
      title: "Chưa thanh toán", 
      key: "unpaidRevenue",
      render: (_, record) => {
        const { unpaidRevenue } = computeMetricsByDate(record.date, user);
        return unpaidRevenue;
      }
    },
    { 
      title: "Tỉ lệ thanh toán", 
      key: "paymentRate",
      render: (_, record) => {
        const { paymentRate } = computeMetricsByDate(record.date, user);
        const percent = Number((paymentRate * 100));
        let bgColor = "";
        if (percent < 80) {
          bgColor = "#EC2527"; // nền xanh lá (màu xanh nhạt)
        } else if (percent >= 80 && percent <= 95) {
          bgColor = "##FF9501"; // nền vàng nhạt
        } else {
          bgColor = " #54DA1F"; // nền đỏ nhạt
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
 // Xác định màu nền dựa trên %ADS
 
  // Hiển thị dòng tổng hợp (header) cho các chỉ số, có thể theo từng nhân viên
  const renderSummary = (user = null) => {
    let filtered = getFilteredOrders();
    if (user) {
      filtered = filtered.filter(order => order.salexuly === user);
    }
    const totalRevenueSum = filtered.reduce(
      (acc, order) => acc + Number(order.revenue || 0),
      0
    );
    const paidRevenueSum = filtered
      .filter(order => order.paymentStatus === "ĐÃ THANH TOÁN")
      .reduce((acc, order) => acc + Number(order.revenue || 0), 0);
    const unpaidRevenueSum = filtered
      .filter(order => order.paymentStatus === "CHƯA THANH TOÁN")
      .reduce((acc, order) => acc + Number(order.revenue || 0), 0);
    const summaryRate = totalRevenueSum ? paidRevenueSum / totalRevenueSum : 0;
    
    // Chuyển sang % để so sánh
    const ratePercentage = summaryRate * 100;
    
    let bgColor = "";
    if (ratePercentage < 80) {
      bgColor = "#EC2527"; // nếu <80%
    } else if (ratePercentage >= 80 && ratePercentage <= 95) {
      bgColor = "#FF9501"; // nếu từ 80% đến 95%
    } else {
      bgColor = "#54DA1F"; // nếu >95%
    }
    
    return (
      <div
        style={{
          backgroundColor: bgColor,
          padding: "4px 8px",
          borderRadius: "4px"
        }}
      >
        {user ? `NV: ${user}` : ""} <br />
        Chưa thanh toán: <strong>{unpaidRevenueSum}</strong> - Đã thanh toán: <strong>{paidRevenueSum}</strong> - % Thanh Toán Đạt: <strong>{ratePercentage.toFixed(2)}%</strong>
      </div>
    );
  };
  

  return (
    <div>
      {/* Bộ lọc theo khoảng thời gian */}
      <div style={{ marginBottom: 16 }}>
        <span style={{ marginRight: 8 }}>Bộ lọc theo khoảng thời gian: </span>
        <Select value={filterRange} onChange={setFilterRange} style={{ width: 250 }}>
          <Select.Option value="all">Tất cả</Select.Option>
          <Select.Option value="day">1 Ngày</Select.Option>
          <Select.Option value="week">1 Tuần</Select.Option>
          <Select.Option value="month">1 Tháng (từ đầu tháng)</Select.Option>
          <Select.Option value="previousMonth">Tháng trước</Select.Option>
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
          <div key={user} style={{ marginBottom: 24 }}>
            {renderSummary(user)}
            
            <Table
              dataSource={getUniqueDatesForUser(user).map(date => ({ key: date, date }))}
              columns={columns(user)}
              pagination={{ pageSize: 10 }}
              bordered
            />
          </div>
        ))
      ) : (
        // Nếu không phải quản lý, chỉ hiển thị dữ liệu của người dùng hiện tại
        <>
          {renderSummary(currentUser.name)}
          <Table
            dataSource={getUniqueDatesForUser(currentUser.name).map(date => ({ key: date, date }))}
            columns={columns(currentUser.name)}
            pagination={{ pageSize: 10 }}
            bordered
          />
        </>
      )}
    </div>
  );
};

export default Dashboard;
