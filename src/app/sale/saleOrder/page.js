"use client";
import React, { useState, useEffect } from "react";
import {
  Form,
  InputNumber,
  DatePicker,
  Button,
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
    useEffect(() => {
      if (!currentUser.name) {
        router.push("/login");
      }
    }, []);
  const currentUser = useSelector((state) => state.user.currentUser);
  // Giả sử thông tin người dùng hiện tại được lấy từ hệ thống xác thực
  const [sampleOrders, setSampleOrders] = useState([]);
  const [form] = Form.useForm();
  const [records, setRecords] = useState([]);
  // period có thể là: "week", "month", "lastMonth", "twoMonthsAgo"
  const [period, setPeriod] = useState("month");
  // editingKey dùng để xác định record nào đang được chỉnh sửa
  const [editingKey, setEditingKey] = useState(null);



  const fetchOrders = async () => {
    try {
      const response = await axios.get("/api/orders");
      setSampleOrders(response.data.data);
    } catch (error) {
      console.error(error);
      message.error("Lỗi khi lấy đơn hàng");
    }
  };
  useEffect(() => {
    fetchRecords();
    fetchOrders();
  }, []);

 

  const fetchRecords = async () => {
    try {
      const response = await axios.get('/api/recordsSale');
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
        return totalSalesForSelectedDate;
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
          bgColor = "#EC2527";
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

  return (
    <div style={{ padding: 24 }}>
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
      </div>

      {/* Render bảng và hiển thị tổng doanh số theo bộ lọc */}
      {currentUser.position === "managerSALE" ||currentUser.position === "admin"||currentUser.position === "managerMKT"||
      currentUser.position === "leadSALE" ? (
        Object.entries(groupRecordsByUser(filteredRecords)).map(
          ([employeeName, userRecords]) => (
            <div key={employeeName} style={{ marginBottom: 24 }}>
              <h4>NV: {employeeName}</h4>
              <div style={{ fontWeight: "bold", marginBottom: 8 }}>
                Tổng doanh số: {computeTotalSales(employeeName)}
              </div>
              <Table
                dataSource={userRecords}
                columns={columns}
                rowKey="key"
                pagination={{ pageSize: 5 }}
              />
            </div>
          )
        )
      ) : (
        <>
          <div style={{ fontWeight: "bold", marginBottom: 8 }}>
            Tổng doanh số: {computeTotalSales(currentUser.name)}
          </div>
          <Table
            columns={columns}
            dataSource={filteredRecords}
            pagination={{ pageSize: 30 }}
          />  
        </>   
      )}
    </div>
  );
};

export default Dashboard;
