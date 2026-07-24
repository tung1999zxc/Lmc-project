"use client";
import React, { useState, useEffect } from "react";
import {
  Form,
  InputNumber,
  DatePicker,
  Button,Spin,
  Table,
  Popconfirm,
  Select,
  message
} from "antd";
import moment from "moment";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";

import { useRouter } from 'next/navigation';

const Dashboard = () => {
    const router = useRouter();
    const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.user.currentUser);
    useEffect(() => {
      if (!currentUser.name) {
        router.push("/login");
      }
    }, []);
  // Giả sử thông tin người dùng hiện tại được lấy từ hệ thống xác thực
  const [sampleOrders, setSampleOrders] = useState([]);
  const [form] = Form.useForm();
  const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
  
  // period có thể là: "week", "month", "lastMonth", "twoMonthsAgo"
  const [period, setPeriod] = useState("month");
  // editingKey dùng để xác định record nào đang được chỉnh sửa
  const [editingKey, setEditingKey] = useState(null);
  const [shiftFilter, setShiftFilter] = useState(null);
const [safeEmployees, setSafeEmployees] = useState([]);

const fetchEmployees = async () => {
   setLoading(true);   
  try {
    const response = await axios.get('/api/employees');
    // response.data.data chứa danh sách nhân viên theo API đã viết
    setSafeEmployees(response.data.data);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách nhân viên:', error);
    message.error('Lỗi khi lấy danh sách nhân viên');
  } finally {
      setLoading(false);
    }
};
const fetchOrders = async () => {
  try {
    const response = await axios.get(`/api/orderssale?selectedPreset=${period}`);
    setSampleOrders(response.data.data);
  } catch (error) {
    console.error(error);
    message.error("Lỗi khi lấy đơn hàng");
  }
};
useEffect(() => {
  fetchOrders();
}, [period]);

  useEffect(() => {
    fetchRecords();

    fetchEmployees();
  }, []);

 

  const fetchRecords = async () => {
    try {
      const response = await axios.get(`/api/recordsSale?period=${period}`);
      setRecords(response.data.data);
    } catch (error) {
      console.error(error);
      message.error("Lỗi khi lấy danh sách");
    }
  };
  
  // Xử lý submit form: Nếu đang chỉnh sửa thì cập nhật record, ngược lại thêm mới
  const onFinish = async (values) => {
    const newMess = values.newMess;
    const closedOrders = 0;
    const ratio = 0;
    const formattedDate = values.date.format("YYYY-MM-DD");
    const recordData = {
      id: editingKey !== null ? editingKey : Date.now(),
      date: formattedDate,
      newMess,
      closedOrders,
      dailySales: values.dailySales,
      totalRemarketing: values.totalRemarketing,
      ratio,
      employeeId: currentUser.employee_code,
      employeeName: currentUser.name,
    };
  
    try {
      if (editingKey !== null) {
        // Cập nhật record
        const response = await axios.put(`/api/recordsSale/${editingKey}`, recordData);
        message.success(response.data.message || "Cập nhật thành công");
        setEditingKey(null);
        fetchRecords();
        form.resetFields();


      } else {
        // Thêm mới record
        const response = await axios.post('/api/recordsSale', recordData);
        message.success(response.data.message || "Thêm mới thành công");
        form.resetFields();
        fetchRecords();
      }
      
    } catch (error) {
      console.error(error);
      message.error("Lỗi khi lưu dữ liệu");
      setEditingKey(null);
    }
  };
  // Hàm xử lý xóa record khỏi danh sách
const handleDelete = async (key) => {
  try {
    const response = await axios.delete(`/api/recordsSale/${key}`);
    message.success(response.data.message || "Xóa thành công");
    fetchRecords();
  } catch (error) {
    console.error(error);
    message.error("Lỗi khi xóa record");
  }
};

const computeAverageClosingRate = (employeeName) => {
  const employeeRecords = filteredRecords.filter(
    (record) => record.employeeName === employeeName
  );
  if (employeeRecords.length === 0) return "0%";
  let totalNewMess = 0;
  let totalClosedOrders = 0;
  employeeRecords.forEach((record) => {
    totalNewMess += record.newMess;
    totalClosedOrders += computeTotalSalesNumberForDate(record.date, employeeName);
  });
  const avgRate = totalNewMess === 0 ? 0 : (totalClosedOrders / totalNewMess) * 100;
  return avgRate.toFixed(2) + "%";
};

  // Hàm xử lý sửa: nạp dữ liệu record vào form và thiết lập editingKey
  const handleEdit = (record) => {
    form.setFieldsValue({
      date: moment(record.date),
      newMess: record.newMess,
      closedOrders: record.closedOrders,
      dailySales: record.dailySales,
      totalRemarketing: record.totalRemarketing,
    });
    setEditingKey(record.id);
  };

  // Hàm lọc các đơn hàng dựa theo bộ lọc thời gian đã chọn
  const filterSampleOrdersByPeriod = (order) => {
    const orderDate = moment(order.orderDate, "YYYY-MM-DD");
    const now = moment();
    if (period === "week") {
      // 1 Tuần Gần Nhất: từ 7 ngày trước đến hiện tại
      return orderDate.isSameOrAfter(now.clone().subtract(7, "days"), "day");
    } else if (period === "day") {
          // Ngày hiện tại: so sánh theo ngày
          return orderDate.isSame(moment(), "day");
        } else if (period === "month") {
      // Tháng Này: từ đầu tháng đến hiện tại
      return orderDate.isSame(now, "month") && orderDate.isSameOrAfter(now.clone().startOf("month"));
    } else if (period === "lastMonth") {
      // Tháng Trước: toàn bộ tháng trước
      const lastMonth = now.clone().subtract(1, "months");
      return orderDate.isSame(lastMonth, "month");
    } else if (period === "twoMonthsAgo") {
      // 2 Tháng Trước: toàn bộ tháng cách đây 2 tháng
      const twoMonthsAgo = now.clone().subtract(2, "months");
      return orderDate.isSame(twoMonthsAgo, "month");
    }
    return true;
  };

  // Tính tổng doanh số cho một nhân viên dựa trên sampleOrders đã được lọc theo thời gian
  const computeTotalSales = (employeeName) => {
    const totalProfit = sampleOrders
      .filter((p) => p.sale === employeeName && filterSampleOrdersByPeriod(p))
      .reduce((sum, p) => sum + p.profit, 0)*17000;
      return totalProfit.toLocaleString('vi-VN');
  };
  // const computeTotalNumberSales = (employeeName) => {
  //   const totalProfit = sampleOrders
  //     .filter((p) => p.sale === employeeName && filterSampleOrdersByPeriod(p))
  //     ;
  //     return totalProfit.length;
  // };


  // Hàm tính doanh số cá nhân theo ngày của một record
  const computeTotalSalesForDate = (date, employeeName) => {
    return date
      ? sampleOrders
          .filter(
            (p) =>
              p.orderDate === date &&
              p.sale === employeeName &&
              filterSampleOrdersByPeriod(p)
          )
          .reduce((sum, p) => sum + p.profit, 0)
      : 0;
  };
  const computeTotalSalesNumberForDate = (date, employeeName) => {
    return date
      ? sampleOrders.filter(
          (p) =>
            p.orderDate === date &&
            p.saleReport === "DONE" &&
            p.sale === employeeName &&
            filterSampleOrdersByPeriod(p)
        ).length
      : 0;
  };

  // Định nghĩa các cột cho bảng
  const columns = [
    {
      title: "Ngày",
      dataIndex: "date",
      key: "date",
      width: 120,
      render: (date) => (
        <div style={{
          background: "#f0f5ff",
          padding: "4px 12px",
          borderRadius: 6,
          textAlign: "center",
          fontWeight: 600,
          color: "#333"
        }}>
          {moment(date, "YYYY-MM-DD").format("DD/MM/YYYY")}
        </div>
      ),
    },
    {
      title: "Mess mới cấp",
      dataIndex: "newMess",
      key: "newMess",
      width: 130,
      align: "center",
      render: (val) => (
        <div style={{
          background: "#e6f7ff",
          padding: "4px 12px",
          borderRadius: 6,
          textAlign: "center",
          fontWeight: 600,
          color: "#1890ff"
        }}>
          {val}
        </div>
      ),
    },
    {
      title: "Đơn chốt được",
      dataIndex: "closedOrders",
      key: "closedOrders",
      width: 130,
      align: "center",
      render: (val) => (
        <div style={{
          background: "#f6ffed",
          padding: "4px 12px",
          borderRadius: 6,
          textAlign: "center",
          fontWeight: 600,
          color: "#52c41a"
        }}>
          {val}
        </div>
      ),
    },
    {
      title: "Mess tiếp thị lại",
      dataIndex: "totalRemarketing",
      key: "totalRemarketing",
      width: 140,
      align: "center",
      render: (val) => (
        <div style={{
          background: "#fff7e6",
          padding: "4px 12px",
          borderRadius: 6,
          textAlign: "center",
          fontWeight: 600,
          color: "#fa8c16"
        }}>
          {val}
        </div>
      ),
    },
    {
      title: "Doanh số trong ngày",
      key: "Sales",
      width: 160,
      align: "right",
      render: (_, record) => {
        const totalSalesForSelectedDate = computeTotalSalesForDate(
          record.date,
          record.employeeName
        );
        return (
          <span style={{ fontWeight: 700, color: "#d48806", fontSize: 14 }}>
            {(totalSalesForSelectedDate * 17000).toLocaleString('vi-VN')} đ
          </span>
        );
      },
    },
    {
      title: "Tỉ lệ chốt",
      key: "ratio",
      width: 120,
      align: "center",
      render: (_, record) => {
        const totalSalesForSelectedDate = computeTotalSalesNumberForDate(
          record.date,
          record.employeeName
        );
        let rate = totalSalesForSelectedDate / record.newMess * 100;
        if (typeof rate !== "number") {
          rate = parseFloat(rate);
        }
        let bgColor = "";
        let textColor = "#fff";
        if (rate < 10) {
          bgColor = "#F999A8";
          textColor = "#a8071a";
        } else if (rate >= 10 && rate <= 15) {
          bgColor = "#FF9501";
          textColor = "#fff";
        } else {
          bgColor = "#54DA1F";
          textColor = "#fff";
        }
        return (
          <div
            style={{
              backgroundColor: bgColor,
              color: textColor,
              padding: "4px 12px",
              borderRadius: 20,
              textAlign: "center",
              fontWeight: "bold",
              fontSize: 13,
              display: "inline-block",
              minWidth: 70
            }}
          >
            {rate.toFixed(1)}%
          </div>
        );
      }
    },
    {
      title: "Hành động",
      key: "action",
      width: 140,
      align: "center",
      render: (_, record) => {
        if (
          currentUser.position === "leadSALE" ||
          currentUser.position === "admin" ||
          currentUser.position === "managerMKT" ||
          currentUser.position === "managerSALE"
        ) {
          if (record.employeeId === currentUser.employee_code) {
            return (
              <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                <Button
                  icon={<EditOutlined />}
                  onClick={() => handleEdit(record)}
                  size="small"
                  style={{ borderRadius: 8 }}
                />
                <Popconfirm
                  title="Xóa bản ghi?"
                  onConfirm={() => handleDelete(record.id)}
                >
                  <Button danger icon={<DeleteOutlined />} size="small" style={{ borderRadius: 8 }} />
                </Popconfirm>
              </div>
            );
          } else {
            return (
              <div style={{
                background: "#f5f5f5",
                padding: "4px 12px",
                borderRadius: 6,
                color: "#999",
                fontSize: 12
              }}>
                Chỉ xem
              </div>
            );
          }
        }
        return (
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} size="small" style={{ borderRadius: 8 }} />
            <Popconfirm
              title="Xóa bản ghi?"
              onConfirm={() => handleDelete(record.id)}
            >
              <Button danger icon={<DeleteOutlined />} size="small" style={{ borderRadius: 8 }} />
            </Popconfirm>
          </div>
        );
      },
    },
  ];
  const filteredEmpIds = shiftFilter
  ? safeEmployees
      .filter(
        (employee) =>
          employee.position_team2 &&
          employee.position_team2.toLowerCase() === shiftFilter.toLowerCase()
      )
      .map((employee) => employee.employee_code)
  : safeEmployees.map((employee) => employee.employee_code);

  // Lọc dữ liệu record dựa trên vai trò của người dùng và bộ lọc thời gian
  const filteredRecords = records.filter((record) => {
    // Nếu người dùng là nhân viên thì chỉ hiển thị dữ liệu của họ
    if (currentUser.position === "salexacnhan"||currentUser.position === "salexuly"||currentUser.position === "mkt"||currentUser.position === "kho1") {
      return false;
    }
    if (
      (currentUser.position === "salenhapdon" ||
        currentUser.position === "salefull") &&
      record.employeeId !== currentUser.employee_code
    ) {
      return false;
    }
    if (!filteredEmpIds.includes(record.employeeId)) return false;
    const recordDate = moment(record.date);
    const now = moment();
    if (period === "week") {
      // 1 Tuần Gần Nhất: từ 7 ngày trước đến hiện tại
      return recordDate.isSameOrAfter(now.clone().subtract(7, "days"), "day");
    }
    else if (period === "day") {
      // Ngày hiện tại: so sánh theo định dạng "YYYY-MM-DD"
      return recordDate.format("YYYY-MM-DD") === now.format("YYYY-MM-DD");} else if (period === "month") {
      // Tháng Này: từ đầu tháng đến hiện tại
      return (
        recordDate.isSame(now, "month") &&
        recordDate.isSameOrAfter(now.clone().startOf("month"))
      );
    } else if (period === "lastMonth") {
      // Tháng Trước: toàn bộ tháng trước
      const lastMonth = now.clone().subtract(1, "months");
      return recordDate.isSame(lastMonth, "month");
    } else if (period === "twoMonthsAgo") {
      // 2 Tháng Trước: toàn bộ tháng cách đây 2 tháng
      const twoMonthsAgo = now.clone().subtract(2, "months");
      return recordDate.isSame(twoMonthsAgo, "month");
    }
    return true;
  });

  // Hàm nhóm record theo employeeName (dành cho lead và manager)
  const groupRecordsByUser = (records) => {
    return records.reduce((acc, record) => {
      const user = record.employeeName;
      if (!acc[user]) {
        acc[user] = [];
      }
      acc[user].push(record);
      return acc;
    }, {});
  };

  // Tính tổng doanh số tháng này - chỉ lấy đơn có sale = tên nhân viên đó
  const getTotalSalesThisMonth = () => {
    const isManager = currentUser.position === "managerSALE" || 
                      currentUser.position === "admin" || 
                      currentUser.position === "managerMKT" || 
                      currentUser.position === "leadSALE";
    return sampleOrders
      .filter((p) => {
        if (!filterSampleOrdersByPeriod(p)) return false;
        if (!isManager && p.sale !== currentUser.name) return false;
        return true;
      })
      .reduce((sum, p) => sum + (p.profit || 0), 0) * 17000;
  };

  // Tính tổng doanh số tháng trước - chỉ lấy đơn có sale = tên nhân viên đó
  const getTotalSalesLastMonth = () => {
    const now = moment();
    const lastMonthStart = now.clone().subtract(1, "months").startOf("month");
    const lastMonthEnd = now.clone().subtract(1, "months").endOf("month");
    const isManager = currentUser.position === "managerSALE" || 
                      currentUser.position === "admin" || 
                      currentUser.position === "managerMKT" || 
                      currentUser.position === "leadSALE";
    return sampleOrders
      .filter((p) => {
        const orderDate = moment(p.orderDate, "YYYY-MM-DD");
        if (!orderDate.isSame(lastMonthStart, "month")) return false;
        if (!isManager && p.sale !== currentUser.name) return false;
        return true;
      })
      .reduce((sum, p) => sum + (p.profit || 0), 0) * 17000;
  };

  // Tính % thay đổi so với tháng trước
  const getSalesChangePercent = () => {
    const thisMonth = getTotalSalesThisMonth();
    const lastMonth = getTotalSalesLastMonth();
    if (lastMonth === 0) return 0;
    return ((thisMonth - lastMonth) / lastMonth * 100).toFixed(1);
  };

  // Đơn hàng Done
  const getDoneOrders = () => {
    return sampleOrders.filter((p) => p.saleReport === "DONE" && filterSampleOrdersByPeriod(p)).length;
  };

  // Tổng đơn hàng
  const getTotalOrders = () => {
    return sampleOrders.filter((p) => filterSampleOrdersByPeriod(p)).length;
  };

  // Tổng mess tháng này
  const getTotalMess = () => {
    return filteredRecords.reduce((sum, r) => sum + (r.newMess || 0), 0);
  };

    const getTotalClosedOrders = () => {
    return filteredRecords.reduce((sum, r) => sum + (r.closedOrders || 0), 0);
  };

  const getAverageRatio = () => {
    if (filteredRecords.length === 0) return 0;
    let totalNewMess = 0;
    let totalClosedOrders = 0;
    filteredRecords.forEach((record) => {
      totalNewMess += record.newMess || 0;
      totalClosedOrders += computeTotalSalesNumberForDate(record.date, record.employeeName);
    });
    if (totalNewMess === 0) return 0;
    return (totalClosedOrders / totalNewMess * 100).toFixed(1);
  };

  const getTotalRemarketing = () => {
    return filteredRecords.reduce((sum, r) => sum + (r.totalRemarketing || 0), 0);
  };

  const statsData = {
    totalSales: getTotalSalesThisMonth(),
    salesChange: getSalesChangePercent(),
    closedOrders: getTotalClosedOrders(),
    totalOrders: (() => {
      const isManager = currentUser.position === "managerSALE" || 
                        currentUser.position === "admin" || 
                        currentUser.position === "managerMKT" || 
                        currentUser.position === "leadSALE";
      return sampleOrders.filter((p) => {
        if (!filterSampleOrdersByPeriod(p)) return false;
        if (!isManager && p.sale !== currentUser.name) return false;
        return true;
      }).length;
    })(),
    avgChotRatio: getAverageRatio(),
    totalNewMess: getTotalMess(),
    totalRemarketing: getTotalRemarketing(),
    // Thống kê trạng thái đơn - chỉ lấy đơn có sale = nhân viên đó
    processingOrders: (() => {
      const isManager = currentUser.position === "managerSALE" || 
                        currentUser.position === "admin" || 
                        currentUser.position === "managerMKT" || 
                        currentUser.position === "leadSALE";
      return sampleOrders.filter((p) => {
        if (p.saleReport !== "Đang xử lý") return false;
        if (!filterSampleOrdersByPeriod(p)) return false;
        if (!isManager && p.sale !== currentUser.name) return false;
        return true;
      }).length;
    })(),
    doneOrdersCount: (() => {
      const isManager = currentUser.position === "managerSALE" || 
                        currentUser.position === "admin" || 
                        currentUser.position === "managerMKT" || 
                        currentUser.position === "leadSALE";
      return sampleOrders.filter((p) => {
        if (p.saleReport !== "DONE") return false;
        if (!filterSampleOrdersByPeriod(p)) return false;
        if (!isManager && p.sale !== currentUser.name) return false;
        return true;
      }).length;
    })(),
    deletedOrders: (() => {
      const isManager = currentUser.position === "managerSALE" || 
                        currentUser.position === "admin" || 
                        currentUser.position === "managerMKT" || 
                        currentUser.position === "leadSALE";
      return sampleOrders.filter((p) => {
        if (p.saleReport !== "Đã xoá DS") return false;
        if (!filterSampleOrdersByPeriod(p)) return false;
        if (!isManager && p.sale !== currentUser.name) return false;
        return true;
      }).length;
    })(),
    // Thống kê thanh toán - chỉ lấy đơn có sale = nhân viên đó
    paidOrders: (() => {
      const isManager = currentUser.position === "managerSALE" || 
                        currentUser.position === "admin" || 
                        currentUser.position === "managerMKT" || 
                        currentUser.position === "leadSALE";
      return sampleOrders.filter((p) => {
        if (p.paymentStatus !== "Đã TT") return false;
        if (!filterSampleOrdersByPeriod(p)) return false;
        if (!isManager && p.sale !== currentUser.name) return false;
        return true;
      }).length;
    })(),
    unpaidOrders: (() => {
      const isManager = currentUser.position === "managerSALE" || 
                        currentUser.position === "admin" || 
                        currentUser.position === "managerMKT" || 
                        currentUser.position === "leadSALE";
      return sampleOrders.filter((p) => {
        if (p.paymentStatus !== "Chưa TT") return false;
        if (!filterSampleOrdersByPeriod(p)) return false;
        if (!isManager && p.sale !== currentUser.name) return false;
        return true;
      }).length;
    })(),
  };

  return loading ? (
    <Spin size="large" />
  ) : (
    <>
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
            <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 4 }}>Số đơn chốt được</div>
            <div style={{ fontSize: 20, fontWeight: "bold" }}>{statsData.closedOrders}</div>
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
            <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 4 }}>TB tỉ lệ chốt</div>
            <div style={{ fontSize: 20, fontWeight: "bold" }}>{statsData.avgChotRatio}%</div>
            <div style={{ fontSize: 12, opacity: 0.9, marginTop: 4 }}>Trung bình tỉ lệ chốt</div>
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
            <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 4 }}>Mess mới/Mess tiếp thị</div>
            <div style={{ fontSize: 20, fontWeight: "bold" }}>{statsData.totalNewMess}/{statsData.totalRemarketing}</div>
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

      {/* Nhập dữ liệu */}
      <div style={{
        background: "#fff",
        padding: "20px 24px",
        borderRadius: 12,
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        marginBottom: 24
      }}>
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: 12,
          marginBottom: 16
        }}>
          <span style={{ fontSize: 20 }}>📝</span>
          <h3 style={{ margin: 0, color: "#333" }}>Nhập dữ liệu</h3>
        </div>
        <Form
          form={form}
          layout="horizontal"
          onFinish={onFinish}
        >
          <div style={{ 
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 16,
            alignItems: "flex-end"
          }}>
            <Form.Item
              name="date"
              label="Ngày"
              rules={[{ required: true, message: "Vui lòng chọn ngày" }]}
              style={{ marginBottom: 0 }}
            >
              <DatePicker style={{ width: "100%" }} placeholder="Chọn ngày" />
            </Form.Item>
            <Form.Item
              name="newMess"
              label="Mess mới được cấp"
              rules={[{ required: true, message: "Vui lòng nhập số mess" }]}
              style={{ marginBottom: 0 }}
            >
              <InputNumber style={{ width: "100%" }} placeholder="Số mess mới" />
            </Form.Item>
            <Form.Item
              name="totalRemarketing"
              label="Mess tiếp thị lại"
              rules={[{ required: true, message: "Vui lòng nhập số mess tiếp thị lại" }]}
              style={{ marginBottom: 0 }}
            >
              <InputNumber style={{ width: "100%" }} placeholder="Tổng mess tiếp thị lại" />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                disabled={currentUser.position_team === "mkt" ||currentUser.position_team === "kho" || currentUser.position === "salexuly"}
                style={{ minWidth: 120 }}
              >
                {editingKey ? "Cập nhật" : "Thêm"}
              </Button>
            </Form.Item>
          </div>
        </Form>
      </div>

      {/* Bộ lọc theo khoảng thời gian */}
      <div style={{
        background: "#fff",
        padding: "20px 24px",
        borderRadius: 12,
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        marginBottom: 24
      }}>
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: 24,
          flexWrap: "wrap"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>📅</span>
            <span style={{ fontWeight: 600, color: "#333", minWidth: 120 }}>Khoảng thời gian:</span>
          </div>
          <Select
            value={period}
            onChange={(value) => setPeriod(value)}
            style={{ width: 200 }}
            options={[
              { value: "day", label: "Hôm nay" },
              { value: "week", label: "1 Tuần Gần Nhất" },
              { value: "month", label: "Tháng Này" },
              { value: "lastMonth", label: "Tháng Trước" },
              { value: "twoMonthsAgo", label: "2 Tháng Trước" },
            ]}
          />
          <div style={{ 
            width: 1, 
            height: 32, 
            background: "#e8e8e8" 
          }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>👥</span>
            <span style={{ fontWeight: 600, color: "#333", minWidth: 100 }}>Ca làm việc:</span>
          </div>
          <Select
            value={shiftFilter}
            onChange={(value) => setShiftFilter(value)}
            style={{ width: 180 }}
            placeholder="Tất cả ca"
            allowClear
            options={[
              { value: "hanhchinh", label: "Ca Hành Chính" },
              { value: "onlinetoi", label: "Ca Online Tối" },
              { value: "onlinesang", label: "Ca Online Sáng" },
            ]}
          />
        </div>
      </div>
      

      {/* Render bảng và hiển thị tổng doanh số theo bộ lọc */}
      <div style={{
        background: "#fff",
        borderRadius: 12,
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        overflow: "hidden"
      }}>
        {currentUser.position === "managerSALE" ||
        currentUser.position === "admin" ||
        currentUser.position === "managerMKT" ||
        currentUser.position === "leadSALE" ? (
          Object.entries(groupRecordsByUser(filteredRecords)).map(
            ([employeeName, userRecords]) => {
              const sortedRecords = [...userRecords].sort(
                (a, b) => moment(b.date).valueOf() - moment(a.date).valueOf()
              );
              return (
                <div key={employeeName} style={{ marginBottom: 0 }}>
                  {/* Header nhân viên */}
                  <div style={{
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    padding: "16px 24px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 12
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        background: "rgba(255,255,255,0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontSize: 16,
                        fontWeight: "bold"
                      }}>
                        {employeeName.charAt(0)}
                      </div>
                      <div>
                        <div style={{ color: "#fff", fontSize: 16, fontWeight: 700 }}>{employeeName}</div>
                        <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>{sortedRecords.length} bản ghi</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 11 }}>Doanh số</div>
                        <div style={{ color: "#fff", fontSize: 15, fontWeight: 700 }}>{computeTotalSales(employeeName)} đ</div>
                      </div>
                      <div style={{ width: 1, background: "rgba(255,255,255,0.3)" }} />
                      <div style={{ textAlign: "center" }}>
                        <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 11 }}>Tỉ lệ chốt TB</div>
                        <div style={{ color: "#fff", fontSize: 15, fontWeight: 700 }}>{computeAverageClosingRate(employeeName)}</div>
                      </div>
                    </div>
                  </div>
          <Table
            dataSource={sortedRecords}
            columns={columns}
            rowKey={(r) => r._id || r.id || r.key}
            pagination={{ pageSize: 5, showSizeChanger: false, showTotal: (total) => `${total} bản ghi` }}
            style={{ borderRadius: 0 }}
            scroll={{ x: 800 }}
            rowClassName={() => "table-row-striped"}
            components={{
              header: {
                cell: ({ children, ...rest }) => (
                  <th {...rest} style={{
                    ...rest.style,
                    background: "#f8f9fa",
                    color: "#333",
                    fontWeight: 700,
                    fontSize: 13,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    padding: "12px 16px"
                  }}>
                    {children}
                  </th>
                )
              }
            }}
          />
                </div>
              );
            }
          )
        ) : (
          <div>
            {/* Header cá nhân */}
            <div style={{
              background: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
              padding: "16px 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: 16,
                  fontWeight: "bold"
                }}>
                  {currentUser.name ? currentUser.name.charAt(0) : "U"}
                </div>
                <div>
                  <div style={{ color: "#fff", fontSize: 16, fontWeight: 700 }}>{currentUser.name}</div>
                  <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>
                    {filteredRecords.filter(r => r.employeeName === currentUser.name).length} bản ghi
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 11 }}>Doanh số</div>
                  <div style={{ color: "#fff", fontSize: 15, fontWeight: 700 }}>{computeTotalSales(currentUser.name)} đ</div>
                </div>
                <div style={{ width: 1, background: "rgba(255,255,255,0.3)" }} />
                <div style={{ textAlign: "center" }}>
                  <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 11 }}>Tỉ lệ chốt TB</div>
                  <div style={{ color: "#fff", fontSize: 15, fontWeight: 700 }}>{computeAverageClosingRate(currentUser.name)}</div>
                </div>
              </div>
            </div>
            <Table
              dataSource={
                [...filteredRecords.filter(record => record.employeeName === currentUser.name)]
                  .sort((a, b) => moment(b.date).valueOf() - moment(a.date).valueOf())
              }
              columns={columns}
              rowKey={(r) => r._id || r.id || r.key}
              pagination={{ pageSize: 5, showSizeChanger: false, showTotal: (total) => `${total} bản ghi` }}
              style={{ borderRadius: 0 }}
              scroll={{ x: 800 }}
              rowClassName={() => "table-row-striped"}
              components={{
                header: {
                  cell: ({ children, ...rest }) => (
                    <th {...rest} style={{
                      ...rest.style,
                      background: "#f8f9fa",
                      color: "#333",
                      fontWeight: 700,
                      fontSize: 13,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      padding: "12px 16px"
                    }}>
                      {children}
                    </th>
                  )
                }
              }}
            />
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default Dashboard;
