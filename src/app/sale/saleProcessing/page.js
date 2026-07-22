"use client";
import { useState, useEffect } from "react";
import { Table, Select, Switch, Spin, message } from "antd";
import dayjs from "dayjs";
import { useSelector } from "react-redux";
import axios from "axios";
import { useRouter } from "next/navigation";

import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const Dashboard = () => {
  const [filterRange, setFilterRange] = useState("week");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

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
    setLoading(true);
    try {
      const response = await axios.get(
        `/api/orders2?selectedPreset=${filterRange}`
      );
      setOrders(response.data.data);
    } catch (error) {
      console.error(error);
      message.error("Lỗi khi lấy đơn hàng");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchOrders();
    fetchEmployeesStatus();
  }, [filterRange]);

  const fetchEmployeesStatus = async () => {
    try {
      const res = await axios.get("/api/employees");
      const map = {};
      res.data.data.forEach((emp) => {
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
    return orders.filter((order) => {
      // Sử dụng order.orderDate thay vì order.date
      const orderDate = dayjs(order.orderDate);
      switch (filterRange) {
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
          return (
            orderDate.isSameOrAfter(prevMonth.startOf("month")) &&
            orderDate.isSameOrBefore(prevMonth.endOf("month"))
          );
        }
        case "twoMonthsAgo": {
          const twoMonthsAgo = today.subtract(2, "month");
          return (
            orderDate.isSameOrAfter(twoMonthsAgo.startOf("month")) &&
            orderDate.isSameOrBefore(twoMonthsAgo.endOf("month"))
          );
        }
        case "threeMonthsAgo": {
          const threeMonthsAgo = today.subtract(3, "month");
          return (
            orderDate.isSameOrAfter(threeMonthsAgo.startOf("month")) &&
            orderDate.isSameOrBefore(threeMonthsAgo.endOf("month"))
          );
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
      filtered = filtered.filter((order) => order.salexuly === user);
    }
    const uniqueDates = [...new Set(filtered.map((order) => order.orderDate))];
    // Sắp xếp ngày giảm dần (mới nhất ở đầu)
    return uniqueDates.sort((a, b) => dayjs(b).unix() - dayjs(a).unix());
  };

  // Hàm tính các chỉ số cho 1 ngày (có thể lọc theo user)
  const computeMetricsByDate = (date, user = null) => {
    let ordersForDate = orders.filter((order) => order.orderDate === date);
    if (user) {
      ordersForDate = ordersForDate.filter((order) => order.salexuly === user);
    }
    const sharedOrders = ordersForDate.length;
    const completedOrders = ordersForDate.filter(
      (order) => order.paymentStatus === "ĐÃ THANH TOÁN"
    ).length;
    const totalRevenue = ordersForDate.reduce(
      (acc, order) => acc + Number(order.profit || 0),
      0
    );
    const paidRevenue = ordersForDate
      .filter((order) => order.paymentStatus === "ĐÃ THANH TOÁN")
      .reduce((acc, order) => acc + Number(order.profit || 0), 0);
    const unpaidRevenue = ordersForDate
      .filter(
        (order) =>
          order.paymentStatus === "CHƯA THANH TOÁN" ||
          order.paymentStatus === ""
      )
      .reduce((acc, order) => acc + Number(order.profit || 0), 0);
    const paymentRate = totalRevenue ? paidRevenue / totalRevenue : 0;
    return {
      sharedOrders,
      completedOrders,
      totalRevenue,
      paidRevenue,
      unpaidRevenue,
      paymentRate,
    };
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
      },
    },
    {
      title: "Số lượng đơn đòi được",
      key: "completedOrders",
      render: (_, record) => {
        const { completedOrders } = computeMetricsByDate(
          record.orderDate,
          user
        );
        return completedOrders;
      },
    },
    {
      title: "Tổng doanh số",
      key: "totalRevenue",
      render: (_, record) => {
        const { totalRevenue } = computeMetricsByDate(record.orderDate, user);
        return totalRevenue;
      },
    },
    {
      title: "Đã thanh toán",
      key: "paidRevenue",
      render: (_, record) => {
        const { paidRevenue } = computeMetricsByDate(record.orderDate, user);
        return paidRevenue;
      },
    },
    {
      title: "Chưa thanh toán",
      key: "unpaidRevenue",
      render: (_, record) => {
        const { unpaidRevenue } = computeMetricsByDate(record.orderDate, user);
        return unpaidRevenue;
      },
    },
    {
      title: "Tỉ lệ thanh toán",
      key: "paymentRate",
      render: (_, record) => {
        const { paymentRate } = computeMetricsByDate(record.orderDate, user);
        const percent = Number(paymentRate * 100);
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
              fontWeight: "bold",
            }}
          >
            {percent.toFixed(2)}%
          </div>
        );
      },
    },
  ];

  // Hiển thị dòng tổng hợp (header) cho các chỉ số, có thể theo từng nhân viên
  const renderSummary = (user = null) => {
    let filtered = getFilteredOrders();
    if (user) {
      filtered = filtered.filter((order) => order.salexuly === user);
    }
    const totalRevenueSum = filtered.reduce(
      (acc, order) => acc + Number(order.profit || 0),
      0
    );
    const paidRevenueSum = filtered
      .filter((order) => order.paymentStatus === "ĐÃ THANH TOÁN")
      .reduce((acc, order) => acc + Number(order.profit || 0), 0);
    const unpaidRevenueSum = filtered
      .filter(
        (order) =>
          order.paymentStatus === "CHƯA THANH TOÁN" ||
          order.paymentStatus === ""
      )
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
        <h3 style={{ display: "flex", alignItems: "center", gap: 10 }}>
          NV: {user}
          <Switch
            disabled={
              currentUser.position !== "leadSALE" &&
              currentUser.name !== "Tung99"
            }
            checked={employeeStatusMap[user]}
            onChange={async (checked) => {
              try {
                await axios.post("/api/employees/update-status", {
                  name: user,
                  status: checked,
                });
                message.success(
                  `Đã ${checked ? "bật" : "tắt"} trạng thái cho ${user}`
                );
                setEmployeeStatusMap((prev) => ({ ...prev, [user]: checked }));
              } catch (err) {
                message.error("Lỗi khi cập nhật trạng thái");
              }
            }}
            checkedChildren="Bật"
            unCheckedChildren="Tắt"
          />
        </h3>{" "}
        <br />{" "}
        <div
          style={{
            backgroundColor: bgColor,
            padding: "4px 8px",
            borderRadius: "4px",
          }}
        >
          Chưa thanh toán: <strong>{unpaidRevenueSum}</strong> | Đã thanh toán:{" "}
          <strong>{paidRevenueSum}</strong> | TỔNG :
          <strong> {unpaidRevenueSum + paidRevenueSum}</strong> |VNĐ :
          <strong>
            {" "}
            {((unpaidRevenueSum + paidRevenueSum) * 17000).toLocaleString(
              "vi-VN"
            )}
          </strong>
          | % Thanh Toán Đạt: <strong>{ratePercentage.toFixed(2)}%</strong>
        </div>
      </>
    );
  };

  // Xác định user lọc (salexuly lọc theo cá nhân)
  const isSalexulyRole = !["managerMKT", "managerSALE", "admin", "leadSALE"].includes(currentUser.position);
  const filterUser = isSalexulyRole ? currentUser.name : null;

  // Lọc orders theo user nếu cần
  const getFilteredByUser = (ordersList) => {
    if (!filterUser) return ordersList;
    return ordersList.filter((order) => order.salexuly === filterUser);
  };

  // Stats calculations
  const getTotalPaidRevenue = () => {
    const filtered = getFilteredByUser(getFilteredOrders());
    return filtered
      .filter((order) => order.paymentStatus === "ĐÃ THANH TOÁN")
      .reduce((acc, order) => acc + Number(order.profit || 0), 0) * 17000;
  };

  const getAvgPaymentRate = () => {
    const filtered = getFilteredByUser(getFilteredOrders());
    const dates = [...new Set(filtered.map((order) => order.orderDate))];
    if (dates.length === 0) return 0;
    let totalRate = 0;
    let count = 0;
    dates.forEach((date) => {
      const ordersForDate = filtered.filter((order) => order.orderDate === date);
      const totalRevenue = ordersForDate.reduce((acc, order) => acc + Number(order.profit || 0), 0);
      const paidRevenue = ordersForDate
        .filter((order) => order.paymentStatus === "ĐÃ THANH TOÁN")
        .reduce((acc, order) => acc + Number(order.profit || 0), 0);
      if (totalRevenue > 0) {
        totalRate += paidRevenue / totalRevenue;
        count++;
      }
    });
    return count > 0 ? (totalRate / count * 100).toFixed(1) : 0;
  };

  const getSharedVsClaimedOrders = () => {
    const filtered = getFilteredByUser(getFilteredOrders());
    const dates = [...new Set(filtered.map((order) => order.orderDate))];
    let totalShared = 0;
    let totalClaimed = 0;
    dates.forEach((date) => {
      const ordersForDate = filtered.filter((order) => order.orderDate === date);
      totalShared += ordersForDate.length;
      totalClaimed += ordersForDate.filter((order) => order.paymentStatus === "ĐÃ THANH TOÁN").length;
    });
    return { shared: totalShared, claimed: totalClaimed };
  };

  const getTotalSalesThisMonth = () => {
    return getFilteredByUser(getFilteredOrders()).reduce((sum, p) => sum + Number(p.profit || 0), 0) * 17000;
  };

  const getTotalSalesLastMonth = () => {
    const today = dayjs();
    return orders
      .filter((p) => {
        const orderDate = dayjs(p.orderDate);
        const prevMonth = today.subtract(1, "month");
        return orderDate.isSame(prevMonth, "month");
      })
      .reduce((sum, p) => sum + Number(p.profit || 0), 0) * 17000;
  };

  const getSalesChangePercent = () => {
    const thisMonth = getTotalSalesThisMonth();
    const lastMonth = getTotalSalesLastMonth();
    if (lastMonth === 0) return 0;
    return ((thisMonth - lastMonth) / lastMonth * 100).toFixed(1);
  };

  const getDoneOrders = () => {
    return getFilteredByUser(getFilteredOrders()).filter((p) => p.saleReport === "DONE").length;
  };

  const getTotalOrders = () => {
    return getFilteredByUser(getFilteredOrders()).length;
  };

  const getProcessingOrders = () => {
    return getFilteredByUser(getFilteredOrders()).filter((p) => p.saleReport === "Đang xử lý").length;
  };

  const getDeletedOrders = () => {
    return getFilteredByUser(getFilteredOrders()).filter((p) => p.saleReport === "Đã xoá DS").length;
  };

  const getPaidOrders = () => {
    return getFilteredByUser(getFilteredOrders()).filter((p) => p.paymentStatus === "ĐÃ THANH TOÁN").length;
  };

  const getUnpaidOrders = () => {
    return getFilteredByUser(getFilteredOrders()).filter((p) => p.paymentStatus === "CHƯA THANH TOÁN" || p.paymentStatus === "").length;
  };

  const getTotalMess = () => {
    return getFilteredByUser(getFilteredOrders()).reduce((sum, p) => sum + (p.messCount || 0), 0);
  };

  const statsData = {
    totalSales: getTotalSalesThisMonth(),
    salesChange: getSalesChangePercent(),
    doneOrders: getDoneOrders(),
    totalOrders: getTotalOrders(),
    doneRatio: getAvgPaymentRate(),
    undoneOrders: getTotalOrders() - getDoneOrders(),
    totalMess: getTotalMess(),
    processingOrders: getProcessingOrders(),
    doneOrdersCount: getPaidOrders(),
    deletedOrders: getDeletedOrders(),
    paidOrders: getPaidOrders(),
    unpaidOrders: getUnpaidOrders(),
    totalPaidRevenue: getTotalPaidRevenue(),
    sharedVsClaimed: getSharedVsClaimedOrders(),
  };

  return loading ? (
    <Spin size="large" />
  ) : (
    <>
      <div>
        <div style={{ padding: 24 }}>
          {/* 4 Box Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
            <div style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              padding: "20px 24px",
              borderRadius: 12,
              color: "#fff",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div>
                <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 4 }}>Doanh số</div>
                <div style={{ fontSize: 20, fontWeight: "bold" }}>{statsData.totalSales.toLocaleString('vi-VN')} ₫</div>
                <div style={{ fontSize: 12, opacity: 0.9, marginTop: 4 }}>
                  {statsData.salesChange >= 0 ? "▲" : "▼"} {Math.abs(statsData.salesChange)}% so tháng trước
                </div>
              </div>
              <div style={{ fontSize: 36 }}>💰</div>
            </div>

            <div style={{
              background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
              padding: "20px 24px",
              borderRadius: 12,
              color: "#fff",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div>
                <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 4 }}>Đã thanh toán</div>
                <div style={{ fontSize: 20, fontWeight: "bold" }}>{statsData.totalPaidRevenue.toLocaleString('vi-VN')} ₫</div>
                <div style={{ fontSize: 12, opacity: 0.9, marginTop: 4 }}>{statsData.paidOrders} đơn đã TT</div>
              </div>
              <div style={{ fontSize: 36 }}>✅</div>
            </div>

            <div style={{
              background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
              padding: "20px 24px",
              borderRadius: 12,
              color: "#fff",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div>
                <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 4 }}>Tỉ lệ Done</div>
                <div style={{ fontSize: 20, fontWeight: "bold" }}>{statsData.doneRatio}%</div>
                <div style={{ fontSize: 12, opacity: 0.9, marginTop: 4 }}>Trung bình tỉ lệ TT</div>
              </div>
              <div style={{ fontSize: 36 }}>📊</div>
            </div>

            <div style={{
              background: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
              padding: "20px 24px",
              borderRadius: 12,
              color: "#fff",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div>
                <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 4 }}>Đơn được chia/Đơn đòi</div>
                <div style={{ fontSize: 20, fontWeight: "bold" }}>{statsData.sharedVsClaimed.shared}/{statsData.sharedVsClaimed.claimed}</div>
                <div style={{ fontSize: 12, opacity: 0.9, marginTop: 4 }}>Chia / Đòi được</div>
              </div>
              <div style={{ fontSize: 36 }}>💬</div>
            </div>
          </div>

          {/* Header Thống kê đơn hàng tháng */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 20 }}>📦</span>
            <h3 style={{ margin: 0, color: "#333" }}>Thống kê đơn hàng tháng</h3>
          </div>
          
          {/* 2 Box riêng biệt */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
            {/* Trạng thái đơn - bên trái */}
            <div style={{
              background: "#fff",
              padding: "20px 24px",
              borderRadius: 12,
              boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
              border: "1px solid #f0f0f0"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 16 }}>📋</span>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#333" }}>Trạng thái đơn</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                <div style={{ textAlign: "center", padding: 16, background: "#fff7e6", borderRadius: 10, border: "1px solid #ffd591" }}>
                  <div style={{ fontSize: 24, marginBottom: 4 }}>🔄</div>
                  <div style={{ fontSize: 22, fontWeight: "bold", color: "#fa8c16" }}>{statsData.processingOrders}</div>
                  <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>Đang xử lý</div>
                </div>
                <div style={{ textAlign: "center", padding: 16, background: "#f6ffed", borderRadius: 10, border: "1px solid #b7eb8f" }}>
                  <div style={{ fontSize: 24, marginBottom: 4 }}>✅</div>
                  <div style={{ fontSize: 22, fontWeight: "bold", color: "#52c41a" }}>{statsData.doneOrdersCount}</div>
                  <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>Đã done</div>
                </div>
                <div style={{ textAlign: "center", padding: 16, background: "#fff1f0", borderRadius: 10, border: "1px solid #ffccc7" }}>
                  <div style={{ fontSize: 24, marginBottom: 4 }}>🗑️</div>
                  <div style={{ fontSize: 22, fontWeight: "bold", color: "#ff4d4f" }}>{statsData.deletedOrders}</div>
                  <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>Đã xoá DS</div>
                </div>
              </div>
            </div>

            {/* Thanh toán - bên phải */}
            <div style={{
              background: "#fff",
              padding: "20px 24px",
              borderRadius: 12,
              boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
              border: "1px solid #f0f0f0"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 16 }}>💳</span>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#333" }}>Thanh toán</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
                <div style={{ textAlign: "center", padding: 20, background: "#f6ffed", borderRadius: 10, border: "1px solid #b7eb8f" }}>
                  <div style={{ fontSize: 24, marginBottom: 4 }}>✓</div>
                  <div style={{ fontSize: 28, fontWeight: "bold", color: "#52c41a" }}>{statsData.paidOrders}</div>
                  <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>Đã TT</div>
                </div>
                <div style={{ textAlign: "center", padding: 20, background: "#fff7e6", borderRadius: 10, border: "1px solid #ffd591" }}>
                  <div style={{ fontSize: 24, marginBottom: 4 }}>⏳</div>
                  <div style={{ fontSize: 28, fontWeight: "bold", color: "#fa8c16" }}>{statsData.unpaidOrders}</div>
                  <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>Chưa TT</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bộ lọc theo khoảng thời gian */}
          <div style={{ 
            background: "#fff", 
            padding: "16px 24px", 
            borderRadius: 12, 
            boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
            border: "1px solid #f0f0f0",
            marginBottom: 24,
            display: "flex",
            alignItems: "center",
            gap: 16
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 18 }}>🔍</span>
              <span style={{ fontSize: 14, fontWeight: 500, color: "#333" }}>Khoảng thời gian:</span>
            </div>
            <Select
              value={filterRange}
              onChange={setFilterRange}
              style={{ width: 200 }}
              size="large"
            >
            <Select.Option value="today">📅 1 Ngày</Select.Option>
            <Select.Option value="week">📅 1 Tuần</Select.Option>
            <Select.Option value="currentMonth">📅 1 Tháng (từ đầu tháng)</Select.Option>
            <Select.Option value="lastMonth">📅 Tháng trước</Select.Option>
            <Select.Option value="twoMonthsAgo">📅 2 tháng trước</Select.Option>
            <Select.Option value="threeMonthsAgo">📅 3 tháng trước</Select.Option>
          </Select>
        </div>
        
        {/* Chi tiết theo nhân viên */}
        {currentUser.position === "managerMKT" ||
        currentUser.position === "managerSALE" ||
        currentUser.position === "admin" ||
        currentUser.position === "leadSALE" ? (
          // Nếu là quản lý, hiển thị bảng cho từng nhân viên
          [...new Set(getFilteredOrders().map((order) => order.salexuly))].map(
            (user) => (
              <div key={user} style={{ marginBottom: 24 }}>
                <div style={{ 
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  padding: "12px 20px",
                  borderRadius: 10,
                  marginBottom: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 10
                }}>
                  <span style={{ fontSize: 18 }}>👤</span>
                  <span style={{ color: "#fff", fontWeight: 600, fontSize: 15 }}>{user}</span>
                </div>
                {renderSummary(user)}
                <Table
                  dataSource={getUniqueDatesForUser(user).map((orderDate) => ({
                    key: orderDate,
                    orderDate,
                  }))}
                  columns={columns(user)}
                  pagination={{ pageSize: 5 }}
                  bordered
                  style={{ borderRadius: 10, overflow: "hidden" }}
                />
              </div>
            )
          )
        ) : (
          // Nếu không phải quản lý, chỉ hiển thị dữ liệu của người dùng hiện tại
          <>
            <div style={{ 
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              padding: "12px 20px",
              borderRadius: 10,
              marginBottom: 12,
              display: "flex",
              alignItems: "center",
              gap: 10
            }}>
              <span style={{ fontSize: 18 }}>👤</span>
              <span style={{ color: "#fff", fontWeight: 600, fontSize: 15 }}>{currentUser.name}</span>
            </div>
            {renderSummary(currentUser.name)}
            <Table
              dataSource={getUniqueDatesForUser(currentUser.name).map(
                (orderDate) => ({ key: orderDate, orderDate })
              )}
              columns={columns(currentUser.name)}
              pagination={{ pageSize: 30 }}
              bordered
              style={{ borderRadius: 10, overflow: "hidden" }}
            />
          </>
        )}
      </div>
      </div>
    </>
  );
};

export default Dashboard;
