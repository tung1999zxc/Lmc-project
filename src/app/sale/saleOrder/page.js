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

const { Option } = Select;

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
      render: (date) => moment(date, "YYYY-MM-DD").format("DD/MM/YYYY"),
    },
    {
      title: "Số mess mới được cấp",
      dataIndex: "newMess",
      key: "newMess",
    },
    
    {
      title: "Số đơn chốt được",
      key: "closedOrders",
      render: (_, record) => {
        const totalSalesForSelectedDate = computeTotalSalesNumberForDate(
          record.date,
          record.employeeName
        );
        return totalSalesForSelectedDate;
      },
    },
    {
      title: "Tổng số mess tiếp thị lại",
      dataIndex: "totalRemarketing",
      key: "totalRemarketing",
    },
    {
      title: "Doanh số cá nhân trong ngày",
      key: "Sales",
      render: (_, record) => {
        const totalSalesForSelectedDate = computeTotalSalesForDate(
          record.date,
          record.employeeName
        );
        return (totalSalesForSelectedDate*17000).toLocaleString('vi-VN');
      },
    },
    {
      title: "Tỉ lệ chốt",
      dataIndex: "ratio",
      key: "ratio",
      render: (_, record) => {
        const totalSalesForSelectedDate = computeTotalSalesNumberForDate(
          record.date,
          record.employeeName
        );
        let rate = totalSalesForSelectedDate/record.newMess * 100;
        // Nếu rate là chuỗi (ví dụ "80.00%"), chuyển đổi thành số
        if (typeof rate !== "number") {
          rate = parseFloat(rate);
        }
        let bgColor = "";
        if (rate < 10) {
          bgColor = "#F999A8";
        } else if (rate >= 10 && rate <= 15) {
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
            {rate.toFixed(2)}%
          </div>
        );
      }
    },
    {
      title: "Hành động",
      key: "action",
      render: (_, record) => {
        // Với lead hoặc manager: chỉ cho phép sửa/xóa nếu record thuộc về chính họ
        if (
          currentUser.position === "leadSALE" ||currentUser.position === "admin"||currentUser.position === "managerMKT"||
          currentUser.position === "managerSALE"
        ) {
          if (record.employeeId === currentUser.employee_code) {
            return (
              <>
                <Button
                  icon={<EditOutlined />}
                  onClick={() => handleEdit(record)}
                />
                <Popconfirm
                  title="Xóa bản ghi?"
                  onConfirm={() => handleDelete(record.id)}
                >
                  <Button danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </>
            );
          } else {
            return <span>Chỉ xem</span>;
          }
        }
        // Với employee: hiển thị nút Sửa và Xóa cho record của chính họ
        return (
          <>
            <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
            <Popconfirm
              title="Xóa bản ghi?"
              onConfirm={() => handleDelete(record.id)}
            >
              <Button danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </>
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

  // Tính tổng doanh số tháng này
  const getTotalSalesThisMonth = () => {
    return sampleOrders
      .filter((p) => filterSampleOrdersByPeriod(p))
      .reduce((sum, p) => sum + (p.profit || 0), 0) * 17000;
  };

  // Tính tổng doanh số tháng trước
  const getTotalSalesLastMonth = () => {
    const now = moment();
    const lastMonthStart = now.clone().subtract(1, "months").startOf("month");
    const lastMonthEnd = now.clone().subtract(1, "months").endOf("month");
    return sampleOrders
      .filter((p) => {
        const orderDate = moment(p.orderDate, "YYYY-MM-DD");
        return orderDate.isSame(lastMonthStart, "month");
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

    const statsData = {
    totalSales: getTotalSalesThisMonth(),
    salesChange: getSalesChangePercent(),
    doneOrders: getDoneOrders(),
    totalOrders: getTotalOrders(),
    doneRatio: getTotalOrders() > 0 ? (getDoneOrders() / getTotalOrders() * 100).toFixed(1) : 0,
    undoneOrders: getTotalOrders() - getDoneOrders(),
    totalMess: getTotalMess(),
    // Thống kê trạng thái đơn
    processingOrders: sampleOrders.filter((p) => p.saleReport === "Đang xử lý" && filterSampleOrdersByPeriod(p)).length,
    doneOrdersCount: sampleOrders.filter((p) => p.saleReport === "DONE" && filterSampleOrdersByPeriod(p)).length,
    deletedOrders: sampleOrders.filter((p) => p.saleReport === "Đã xoá DS" && filterSampleOrdersByPeriod(p)).length,
    // Thống kê thanh toán
    paidOrders: sampleOrders.filter((p) => p.paymentStatus === "Đã TT" && filterSampleOrdersByPeriod(p)).length,
    unpaidOrders: sampleOrders.filter((p) => p.paymentStatus === "Chưa TT" && filterSampleOrdersByPeriod(p)).length,
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

      <h1>Nhập dữ liệu</h1>
      <Form
        form={form}
        layout="inline"
        onFinish={onFinish}
        style={{ marginBottom: 16 }}
      >
        <Form.Item
          name="date"
          rules={[{ required: true, message: "Vui lòng chọn ngày" }]}
        >
          <DatePicker placeholder="Chọn ngày" />
        </Form.Item>
        <Form.Item
          name="newMess"
          rules={[{ required: true, message: "Vui lòng nhập số mess mới được cấp" }]}
        >
          <InputNumber style={{ width: "200px" }} placeholder="Số mess mới được cấp" />
        </Form.Item>
        
        <Form.Item
          name="totalRemarketing"
          rules={[{ required: true, message: "Vui lòng nhập tổng số mess tiếp thị lại" }]}
        >
          <InputNumber
            style={{ width: "200px" }}
            placeholder="Tổng số mess tiếp thị lại"
          />
        </Form.Item>
        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            disabled={currentUser.position_team === "mkt" ||currentUser.position_team === "kho" || currentUser.position === "salexuly"}
          >
            {editingKey ? "Cập nhật" : "Thêm"}
          </Button>
        </Form.Item>
      </Form>

      {/* Bộ lọc theo khoảng thời gian sử dụng Select của antd */}
      <div style={{ marginBottom: 16 }}>
        <Select
          value={period}
          onChange={(value) => setPeriod(value)}
          style={{ width: 250 }}
        >
          <Option value="day">Hôm nay</Option>
          <Option value="week">1 Tuần Gần Nhất</Option>
          <Option value="month">Tháng Này</Option>
          <Option value="lastMonth">Tháng Trước</Option>
          <Option value="twoMonthsAgo">2 Tháng Trước</Option>
        </Select>
        <Select
    value={shiftFilter}
    onChange={(value) => setShiftFilter(value)}
    style={{ width: 250, marginRight: 16 }}
    placeholder="Chọn ca làm việc"
    allowClear
  >
    <Option value="hanhchinh">Ca Hành Chính</Option>
    <Option value="onlinetoi">Ca Online Tối</Option>
    <Option value="onlinesang">Ca Online Sáng</Option>
  </Select>
      </div>
      

      {/* Render bảng và hiển thị tổng doanh số theo bộ lọc */}
      {currentUser.position === "managerSALE" ||
currentUser.position === "admin" ||
currentUser.position === "managerMKT" ||
currentUser.position === "leadSALE" ? (
  Object.entries(groupRecordsByUser(filteredRecords)).map(
    ([employeeName, userRecords]) => (
      <div key={employeeName} style={{ marginBottom: 24 }}>
        <h4>NV: {employeeName}</h4>
        <div style={{ fontWeight: "bold", marginBottom: 8 }}>
          Tổng doanh số: {computeTotalSales(employeeName)} | Tỉ lệ chốt TB: {computeAverageClosingRate(employeeName)}
        </div>
        <Table
          dataSource={[...userRecords].sort((a, b) => moment(b.date).valueOf() - moment(a.date).valueOf())}
          columns={columns}
          rowKey={(r) => r._id || r.id || r.key}
          pagination={{ pageSize: 5 }}
        />
      </div>
    )
  )
) : (
  <>
    <div style={{ fontWeight: "bold", marginBottom: 8 }}>
      Tổng doanh số: {computeTotalSales(currentUser.name)} | Tỉ lệ chốt TB: {computeAverageClosingRate(currentUser.name)}
    </div>
    <Table
      dataSource={
        [...filteredRecords.filter(record => record.employeeName === currentUser.name)]
          .sort((a, b) => moment(b.date).valueOf() - moment(a.date).valueOf())
      }
      columns={columns}
      rowKey={(r) => r._id || r.id || r.key}
      pagination={{ pageSize: 5 }}
    />
  </>
)}

    </div>
 </>
  );
};

export default Dashboard;
