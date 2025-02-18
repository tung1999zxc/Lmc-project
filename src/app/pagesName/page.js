'use client'
import { useState,useEffect } from "react";
import { Table, Input, Select, Button, Space, Popconfirm , message, Modal } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from 'react-redux';

const { Option } = Select;

const EmployeePageTable = () => {
  const [pageName, setPageName] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [data, setData] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  const employees = useSelector((state) => state.employees.employees);
  // Danh sách options
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedOrders = localStorage.getItem("orders3");
      if (savedOrders) {
        setData(JSON.parse(savedOrders));
      }
     
    }
  }, []);

  // Lưu đơn hàng vào localStorage mỗi khi orders thay đổi (chỉ chạy trên client)
  useEffect(() => {
    if (typeof window !== "undefined" && data && data.length > 0) {
      localStorage.setItem("orders3", JSON.stringify(data));
    }
  }, [data]);

  const mktOptions = employees
  .filter(order => order.position_team === 'mkt')
  .map(order => order.name);
  const handleAdd = () => {
    if (!pageName || !selectedEmployee) {
      message.error("Vui lòng nhập đầy đủ thông tin");
      return;
    }
    setData((prevData) => [
      ...prevData,
      { key: Date.now(), pageName, employee: selectedEmployee },
    ]);
    setPageName("");
    setSelectedEmployee(null);
  };

  const handleDelete = (key) => {
    setData((prevData) => prevData.filter((item) => item.key !== key));
  };

  const handleEdit = (record) => {
    setIsEditing(true);
    setEditingRecord(record);
    setPageName(record.pageName);
    setSelectedEmployee(record.employee);
  };

  const handleSaveEdit = () => {
    setData((prevData) =>
      prevData.map((item) =>
        item.key === editingRecord.key
          ? { ...item, pageName, employee: selectedEmployee }
          : item
      )
    );
    setIsEditing(false);
    setEditingRecord(null);
    setPageName("");
    setSelectedEmployee(null);
  };

  const columns = [
    { title: "Tên Page", dataIndex: "pageName", key: "pageName" },
    { title: "Tên Nhân Viên", dataIndex: "employee", key: "employee" },
    {
      title: "Thao Tác",
      key: "action",
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          
           <Popconfirm
                  title="Xóa bản ghi?"
                  onConfirm={() => handleDelete(record.key)}
                >
                  <Button danger icon={<DeleteOutlined />} />
                </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 20 }}>
      <Space style={{ marginBottom: 20 }}>
        <Input
          placeholder="Nhập tên page"
          value={pageName}
          onChange={(e) => setPageName(e.target.value)}
        />
        <Select
          placeholder="Chọn nhân viên"
          value={selectedEmployee}
          onChange={setSelectedEmployee}
          style={{ width: 150 }}
        >
          {mktOptions.map((emp) => (
            <Option key={emp} value={emp}>{emp}</Option>
          ))}
        </Select>
        <Button type="primary" onClick={isEditing ? handleSaveEdit : handleAdd}>
          {isEditing ? "Lưu" : "Thêm"}
        </Button>
      </Space>

      <Table
        columns={columns}
        dataSource={data.sort((a, b) => a.employee.localeCompare(b.employee))}
        pagination={false}
      />
    </div>
  );
};

export default EmployeePageTable;
