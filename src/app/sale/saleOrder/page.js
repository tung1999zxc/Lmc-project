"use client";
import React, { useState ,useEffect} from "react";
import {
  Form,
  InputNumber,
  DatePicker,
  Button,
  Table,
  Popconfirm,
  Radio,
} from "antd";
import moment from "moment";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from 'react-redux';



const Dashboard = () => {
  const currentUser = useSelector((state) => state.user.currentUser);
// Giả sử thông tin người dùng hiện tại được lấy từ hệ thống xác thực
const [sampleOrders, setSampleOrders] = useState([]);
  const [form] = Form.useForm();
  const [records, setRecords] = useState([]);
  // period có thể là 'day', 'week' hoặc 'month'
  const [period, setPeriod] = useState("day");
  // editingKey dùng để xác định record nào đang được chỉnh sửa
  const [editingKey, setEditingKey] = useState(null);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedRecords = localStorage.getItem("records2");
      if (savedRecords) {
        setRecords(JSON.parse(savedRecords));
      }
      const savedOrders = localStorage.getItem("orders");
      if (savedOrders) {
        setSampleOrders(JSON.parse(savedOrders));
      }
    }
  }, []);
  // Lưu đơn hàng vào localStorage mỗi khi orders thay đổi (chỉ chạy trên client)
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("records2", JSON.stringify(records));
    }
  }, [records]);
  
  // Xử lý submit form: Nếu đang chỉnh sửa thì cập nhật record, ngược lại thêm mới
  const onFinish = (values) => {
    const newMess = values.newMess;
    const closedOrders = values.closedOrders;
    const ratio = newMess > 0 ? closedOrders / newMess : 0;
    const formattedDate = values.date.format('YYYY-MM-DD');
    if (editingKey !== null) {
      // Cập nhật record đã có
      const updatedRecords = records.map((record) => {
        if (record.key === editingKey) {
          return {
            ...record,
            date: formattedDate,
            newMess: newMess,
            closedOrders: closedOrders,
            dailySales: values.dailySales,
            totalRemarketing: values.totalRemarketing,
            ratio: ratio,
          };
        }
        return record;
      });
      setRecords(updatedRecords);
      setEditingKey(null);
    } else {
      // Tạo record mới
      const record = {
        key: records.length + 1,
        date: formattedDate,
        newMess: newMess,
        closedOrders: closedOrders,
       
        totalRemarketing: values.totalRemarketing,
        ratio: ratio,
        employeeId: currentUser.employee_code,
        employeeName: currentUser.name,
      };
      setRecords([...records, record]);
    }
    form.resetFields();
  };

  // Hàm xử lý xóa record khỏi danh sách
  const handleDelete = (key) => {
    setRecords(records.filter((record) => record.key !== key));
    if (editingKey === key) {
      setEditingKey(null);
      form.resetFields();
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
    setEditingKey(record.key);
  };

  const computeTotalSalesForDate = (date, employeeName2) => {
    return date
      ? sampleOrders
          .filter(
            (p) =>
              p.orderDate === date &&
              p.sale === employeeName2
          )
          .reduce((sum, p) => sum + p.profit, 0)
      : 0;
  };
  // Định nghĩa các cột cho bảng
  const columns = [
    {
      title: "Ngày",
      dataIndex: "date",
      key: "date",
      render: (date) => moment(date, 'YYYY-MM-DD').format('DD/MM/YYYY'),
    },
    {
      title: "Số mess mới được cấp",
      dataIndex: "newMess",
      key: "newMess",
    },
    {
      title: "Số đơn chốt được",
      dataIndex: "closedOrders",
      key: "closedOrders",
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
        const totalSalesForSelectedDate = computeTotalSalesForDate(record.date, record.employeeName);
        return totalSalesForSelectedDate;
      },
    },
   
    {
      title: "Tỉ lệ chốt",
      dataIndex: "ratio",
      key: "ratio",
      render: (ratio) => `${(ratio * 100).toFixed(2)}%`,
    },
    {
      title: "Hành động",
      key: "action",
      render: (_, record) => {
        // Với lead hoặc manager: chỉ cho phép sửa/xóa nếu record thuộc về chính họ
        if (currentUser.position === "leadSALE" || currentUser.position === "managerSALE") {
          if (record.employeeId === currentUser.employee_code) {
            return (
              <>
                <Button
                  icon={<EditOutlined />}
                  onClick={() => handleEdit(record)}
                />
                <Popconfirm
                  title="Xóa bản ghi?"
                  onConfirm={() => handleDelete(record.key)}
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
              onConfirm={() => handleDelete(record.key)}
            >
              <Button danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </>
        );
      },
    },
  ];

  // Lọc dữ liệu dựa trên vai trò của người dùng và bộ lọc theo thời gian
  const filteredRecords = records.filter((record) => {
    // Nếu người dùng là nhân viên thì chỉ hiển thị dữ liệu của họ
    if (
      currentUser.position === "salenhapdon" 
       &&
      record.employeeId !== currentUser.employee_code
    ) {
      return false;
    }
    if (
      currentUser.position === "salefull" 
       &&
      record.employeeId !== currentUser.employee_code
    ) {
      return false;
    }
  
    if (
     currentUser.position_team !== "sale"
    ) {
      return false;
    }
    const recordDate = moment(record.date);
    const now = moment();
    if (period === "day") {
      return recordDate.isSame(now, "day");
    } else if (period === "week") {
      return now.diff(recordDate, "days") < 7;
    } else if (period === "month") {
      return now.diff(recordDate, "days") < 30;
    }
    return true;
  });

  // Hàm nhóm record theo employeeName (chỉ dùng cho lead và manager)
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
          rules={[
            { required: true, message: "Vui lòng nhập số mess mới được cấp" },
          ]}
        >
          <InputNumber
            style={{ width: "200px" }}
            placeholder="Số mess mới được cấp"
          />
        </Form.Item>
        <Form.Item
          name="closedOrders"
          rules={[
            { required: true, message: "Vui lòng nhập số đơn chốt được" },
          ]}
        >
          <InputNumber
            style={{ width: "150px" }}
            placeholder="Số đơn chốt được"
          />
        </Form.Item>
        <Form.Item
          name="totalRemarketing"
          rules={[
            {
              required: true,
              message: "Vui lòng nhập tổng số mess tiếp thị lại",
            },
          ]}
        >
          <InputNumber
            style={{ width: "200px" }}
            placeholder="Tổng số mess tiếp thị lại"
          />
        </Form.Item>
      
       
        <Form.Item>
          <Button type="primary" htmlType="submit"  disabled ={currentUser.position_team === 'mkt'}>
            {editingKey ? "Cập nhật" : "Thêm"}
          </Button>
        </Form.Item>
      </Form>

      {/* Bộ lọc theo khoảng thời gian */}
      <div style={{ marginBottom: 16 }}>
        <Radio.Group value={period} onChange={(e) => setPeriod(e.target.value)}>
          <Radio.Button value="day">1 Ngày</Radio.Button>
          <Radio.Button value="week">1 Tuần</Radio.Button>
          <Radio.Button value="month">1 Tháng</Radio.Button>
        </Radio.Group>
      </div>

      {/* Render bảng theo vai trò */}
      {currentUser.position === "managerSALE" || currentUser.position === "leadSALE" ? (
        Object.entries(groupRecordsByUser(filteredRecords)).map(
          ([employeeName, userRecords]) => (
            <div key={employeeName} style={{ marginBottom: 24 }}>
              <h4>{employeeName}</h4>
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
        // Với employee: hiển thị bảng của chính họ
        <Table
          columns={columns}
          dataSource={filteredRecords}
          pagination={{ pageSize: 5 }}
        />
      )}
    </div>
  );
};

export default Dashboard;
