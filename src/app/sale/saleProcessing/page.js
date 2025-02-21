'use client'
import { useState, useEffect } from "react";
import { Table, InputNumber, Popconfirm, Button, DatePicker, Select, Space, Form, Modal } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useSelector } from "react-redux";

const Dashboard = () => {
  const currentUser = useSelector((state) => state.user.currentUser);
  // Giả sử thông tin người dùng hiện tại được lấy từ hệ thống xác thực
  const [data, setData] = useState([]);
  
  const [selectedDate, setSelectedDate] = useState(null);
  const [orderCount, setOrderCount] = useState(null);
  const [collectedAmount, setCollectedAmount] = useState(null);
  const [filterRange, setFilterRange] = useState("all");
  const [editingKey, setEditingKey] = useState(null);
  const [form] = Form.useForm();

  // Lấy dữ liệu từ localStorage khi component mount
  useEffect(() => {
    const savedData = localStorage.getItem("orderRecords");
    if (savedData) setData(JSON.parse(savedData));
  }, []);
 const orders = [{
    "orderDate": "2025-02-20",
    
    "salexuly": "salexuly",
   
    "paymentStatus"
: 
"ĐÃ THANH TOÁN",
    
"revenue"
: 
0,
    "profit": 0,
    
  },{
    
    "orderDate": "2025-02-20",
   
    "salexuly": "sale xuly2",
    "profit": 20,
    'revenue'
: 
10,
   
    
    "paymentStatus": "CHƯA THANH TOÁN",
    
  }];
  // Thêm bản ghi mới
  const handleAddRecord = () => {
    if (!selectedDate || !orderCount || !collectedAmount) return;
    const newRecord = {
      key: Date.now(),
      date: selectedDate.format("YYYY-MM-DD"),
      orderCount,
      collectedAmount,
      user: currentUser.name,
    };
    const newData = [...data, newRecord];
    setData(newData);
    localStorage.setItem("orderRecords", JSON.stringify(newData));
    setSelectedDate(null);
    setOrderCount(null);
    setCollectedAmount(null);
  };

  // Xóa bản ghi
  const handleDelete = (key) => {
    const newData = data.filter((item) => item.key !== key);
    setData(newData);
    localStorage.setItem("orderRecords", JSON.stringify(newData));
  };

  // Mở modal chỉnh sửa và điền giá trị hiện tại vào form
  const handleEdit = (record) => {
    form.setFieldsValue({
      date: dayjs(record.date, "YYYY-MM-DD"),
      orderCount: record.orderCount,
      collectedAmount: record.collectedAmount,
    });
    setEditingKey(record.key);
  };

  // Lưu bản ghi sau khi chỉnh sửa
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const newData = data.map((item) =>
        item.key === editingKey
          ? { ...item, ...values, date: values.date.format("YYYY-MM-DD") }
          : item
      );
      setData(newData);
      localStorage.setItem("orderRecords", JSON.stringify(newData));
      setEditingKey(null);
      form.resetFields();
    } catch (error) {
      console.error("Validate Failed:", error);
    }
  };

  const handleCancelEdit = () => {
    setEditingKey(null);
    form.resetFields();
  };

  // Bộ lọc dữ liệu theo user và khoảng thời gian
  const getFilteredData = () => {
    let filteredData = data;
    // Nếu không phải quản lý hoặc lead, chỉ hiển thị dữ liệu của chính người đó
    if (
      currentUser.position !== "managerMKT" &&
      currentUser.position !== "managerSALE" &&
      currentUser.position !== "admin" &&
      currentUser.position !== "leadSALE"
    ) {
      filteredData = filteredData.filter((item) => item.user === currentUser.name);
    }
    if (filterRange !== "all") {
      const today = dayjs();
      filteredData = filteredData.filter((item) => {
        const itemDate = dayjs(item.date);
        if (filterRange === "day") return itemDate.isSame(today, "day");
        if (filterRange === "week") return itemDate.isAfter(today.subtract(7, "day"));
        if (filterRange === "month") return itemDate.isAfter(today.subtract(1, "month"));
        return true;
      });
    }
    return filteredData;
  };

  const columns = [
    { title: "Ngày", dataIndex: "date", key: "date" },
    { title: "Số lượng đơn đòi được", dataIndex: "orderCount", key: "orderCount" },
    { title: "Số tiền đòi về", dataIndex: "collectedAmount", key: "collectedAmount" },
    {
      title: "Thao tác",
      key: "actions",
      render: (_, record) => {
        if (
          currentUser.position === "managerMKT" ||
          currentUser.position === "managerSALE" ||
          currentUser.position === "admin" ||
          currentUser.position === "leadSALE"
        ) {
          if (record.user === currentUser.name) {
            return (
              <>
                <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
                <Popconfirm title="Xóa bản ghi?" onConfirm={() => handleDelete(record.key)}>
                  <Button danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </>
            );
          } else {
            return <span>Chỉ xem</span>;
          }
        }
        return (
          <Space>
            <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
            <Popconfirm title="Xóa bản ghi?" onConfirm={() => handleDelete(record.key)}>
              <Button danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      <h3>Nhập báo cáo</h3>
      <Space style={{ marginBottom: 16 }}>
        <DatePicker value={selectedDate} onChange={setSelectedDate} />
        <InputNumber
          style={{ width: "200px" }}
          value={orderCount}
          onChange={setOrderCount}
          placeholder="Số lượng đơn đòi được"
        />
        <InputNumber
          style={{ width: "200px" }}
          value={collectedAmount}
          onChange={setCollectedAmount}
          placeholder="Số tiền đòi về"
        />
        <Button type="primary" onClick={handleAddRecord}>
          Thêm
        </Button>
      </Space>
      <div style={{ marginBottom: 16 }}>
        <span style={{ marginRight: 8 }}>Bộ lọc theo khoảng thời gian: </span>
        <Select value={filterRange} onChange={setFilterRange} style={{ width: 200 }}>
          <Select.Option value="all">Tất cả</Select.Option>
          <Select.Option value="day">1 Ngày</Select.Option>
          <Select.Option value="week">1 Tuần</Select.Option>
          <Select.Option value="month">1 Tháng</Select.Option>
        </Select>
      </div>
      {currentUser.position === "managerMKT" ||
      currentUser.position === "managerSALE" ||
      currentUser.position === "admin" ||
      currentUser.position === "leadSALE" ? (
        [...new Set(getFilteredData().map((item) => item.user))].map((user) => (
          <div key={user} style={{ marginBottom: 24 }}>
            <h3>Nv: {user}</h3>
            <Table
              dataSource={getFilteredData().filter((item) => item.user === user)}
              columns={columns}
              rowKey="key"
              pagination={{ pageSize: 10 }}
              bordered
            />
          </div>
        ))
      ) : (
        <Table
          dataSource={getFilteredData().filter((item) => item.user === currentUser.name)}
          columns={columns}
          rowKey="key"
          pagination={{ pageSize: 10 }}
          bordered
        />
      )}
      <Modal
        title="Chỉnh sửa báo cáo"
        visible={editingKey !== null}
        onOk={handleSave}
        onCancel={handleCancelEdit}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="date"
            label="Ngày"
            rules={[{ required: true, message: "Vui lòng chọn ngày" }]}
          >
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            name="orderCount"
            label="Số lượng đơn đòi được"
            rules={[{ required: true, message: "Vui lòng nhập số lượng đơn" }]}
          >
            <InputNumber style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            name="collectedAmount"
            label="Số tiền đòi về"
            rules={[{ required: true, message: "Vui lòng nhập số tiền đòi về" }]}
          >
            <InputNumber style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Dashboard;
