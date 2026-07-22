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

  // Stats calculations
  const getTotalSalesThisMonth = () => {
    return getFilteredOrders().reduce((sum, p) => sum + Number(p.profit || 0), 0) * 17000;
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
    return getFilteredOrders().filter((p) => p.saleReport === "DONE").length;
  };

  const getTotalOrders = () => {
    return getFilteredOrders().length;
  };

  const getProcessingOrders = () => {
    return getFilteredOrders().filter((p) => p.saleReport === "Đang xử lý").length;
  };

  const getDeletedOrders = () => {
    return getFilteredOrders().filter((p) => p.saleReport === "Đã xoá DS").length;
  };

  const getPaidOrders = () => {
    return getFilteredOrders().filter((p) => p.paymentStatus === "ĐÃ THANH TOÁN").length;
  };

  const getUnpaidOrders = () => {
    return getFilteredOrders().filter((p) => p.paymentStatus === "CHƯA THANH TOÁN" || p.paymentStatus === "").length;
  };

  const getTotalMess = () => {
    return getFilteredOrders().reduce((sum, p) => sum + (p.messCount || 0), 0);
  };

  const statsData = {
    totalSales: getTotalSalesThisMonth(),
    salesChange: getSalesChangePercent(),
    doneOrders: getDoneOrders(),
    totalOrders: getTotalOrders(),
    doneRatio: getTotalOrders() > 0 ? (getDoneOrders() / getTotalOrders() * 100).toFixed(1) : 0,
    undoneOrders: getTotalOrders() - getDoneOrders(),
    totalMess: getTotalMess(),
    processingOrders: getProcessingOrders(),
    doneOrdersCount: getDoneOrders(),
    deletedOrders: getDeletedOrders(),
    paidOrders: getPaidOrders(),
    unpaidOrders: getUnpaidOrders(),
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
                <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 4 }}>Doanh số tháng</div>
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
                <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 4 }}>Đơn đã Done</div>
                <div style={{ fontSize: 20, fontWeight: "bold" }}>{statsData.doneOrders}</div>
                <div style={{ fontSize: 12, opacity: 0.9, marginTop: 4 }}>Tổng {statsData.totalOrders} đơn tháng này</div>
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
                <div style={{ fontSize: 12, opacity: 0.9, marginTop: 4 }}>{statsData.undoneOrders} đơn còn chưa done</div>
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
                <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 4 }}>Mess / DS</div>
                <div style={{ fontSize: 20, fontWeight: "bold" }}>{statsData.totalMess.toLocaleString('vi-VN')}</div>
                <div style={{ fontSize: 12, opacity: 0.9, marginTop: 4 }}>Tin nhắn xử lý tháng này</div>
              </div>
              <div style={{ fontSize: 36 }}>💬</div>
            </div>
          </div>

          {/* Header Thống kê đơn hàng tháng */}
          <h3 style={{ marginBottom: 12, color: "#333" }}>📦 Thống kê đơn hàng tháng</h3>
          
          {/* 2 Box riêng biệt */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
            {/* Trạng thái đơn - bên trái */}
            <div style={{
              background: "#fff",
              padding: "20px 24px",
              borderRadius: 12,
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#333", marginBottom: 10 }}>Trạng thái đơn:</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                <div style={{ textAlign: "center", padding: 12, background: "#fff7e6", borderRadius: 8 }}>
                  <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>Đang xử lý</div>
                  <div style={{ fontSize: 20, fontWeight: "bold", color: "#fa8c16" }}>{statsData.processingOrders} đơn</div>
                </div>
                <div style={{ textAlign: "center", padding: 12, background: "#f6ffed", borderRadius: 8 }}>
                  <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>Đã done</div>
                  <div style={{ fontSize: 20, fontWeight: "bold", color: "#52c41a" }}>{statsData.doneOrdersCount} đơn</div>
                </div>
                <div style={{ textAlign: "center", padding: 12, background: "#fff1f0", borderRadius: 8 }}>
                  <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>Đã xoá DS</div>
                  <div style={{ fontSize: 20, fontWeight: "bold", color: "#ff4d4f" }}>{statsData.deletedOrders} đơn</div>
                </div>
              </div>
            </div>

            {/* Thanh toán - bên phải */}
            <div style={{
              background: "#fff",
              padding: "20px 24px",
              borderRadius: 12,
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#333", marginBottom: 10 }}>Thanh toán:</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
                <div style={{ textAlign: "center", padding: 16, background: "#f6ffed", borderRadius: 8 }}>
                  <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>Đã TT</div>
                  <div style={{ fontSize: 24, fontWeight: "bold", color: "#52c41a" }}>{statsData.paidOrders} đơn</div>
                </div>
                <div style={{ textAlign: "center", padding: 16, background: "#fff7e6", borderRadius: 8 }}>
                  <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>Chưa TT</div>
                  <div style={{ fontSize: 24, fontWeight: "bold", color: "#fa8c16" }}>{statsData.unpaidOrders} đơn</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bộ lọc theo khoảng thời gian */}
          <div style={{ marginBottom: 16 }}>
            <span style={{ marginRight: 8 }}>Bộ lọc theo khoảng thời gian: </span>
            <Select
              value={filterRange}
              onChange={setFilterRange}
              style={{ width: 250 }}
            >
            {/* <Select.Option value="all">Tất cả</Select.Option> */}
            <Select.Option value="today">1 Ngày</Select.Option>
            <Select.Option value="week">1 Tuần</Select.Option>
            <Select.Option value="currentMonth">
              1 Tháng (từ đầu tháng)
            </Select.Option>
            <Select.Option value="lastMonth">Tháng trước</Select.Option>
            <Select.Option value="twoMonthsAgo">2 tháng trước</Select.Option>
            <Select.Option value="threeMonthsAgo">3 tháng trước</Select.Option>
          </Select>
        </div>
        {currentUser.position === "managerMKT" ||
        currentUser.position === "managerSALE" ||
        currentUser.position === "admin" ||
        currentUser.position === "leadSALE" ? (
          // Nếu là quản lý, hiển thị bảng cho từng nhân viên
          [...new Set(getFilteredOrders().map((order) => order.salexuly))].map(
            (user) => (
              <div key={user} style={{ marginBottom: 10 }}>
                {renderSummary(user)}
                <Table
                  dataSource={getUniqueDatesForUser(user).map((orderDate) => ({
                    key: orderDate,
                    orderDate,
                  }))}
                  columns={columns(user)}
                  pagination={{ pageSize: 5 }}
                  bordered
                />
              </div>
            )
          )
        ) : (
          // Nếu không phải quản lý, chỉ hiển thị dữ liệu của người dùng hiện tại
          <>
            {renderSummary(currentUser.name)}
            <Table
              dataSource={getUniqueDatesForUser(currentUser.name).map(
                (orderDate) => ({ key: orderDate, orderDate })
              )}
              columns={columns(currentUser.name)}
              pagination={{ pageSize: 30 }}
              bordered
            />
          </>
        )}
      </div>
      </div>
    </>
  );
};

export default Dashboard;
