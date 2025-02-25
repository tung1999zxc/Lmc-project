'use client'
import { useState,useEffect } from "react";
import { Table, Input, Select, Button, Space, Popconfirm , message, Modal } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from 'react-redux';
import axios from "axios";

const { Option } = Select;

const EmployeePageTable = () => {
  const [pageName, setPageName] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [data, setData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
 
 
  // Danh sách options
  useEffect(() => {
    fetchNamePage();
   fetchEmployees();
  }, []);
   const fetchEmployees = async () => {
      
      try {
        const response = await axios.get('/api/employees');
        // response.data.data chứa danh sách nhân viên theo API đã viết
        setEmployees(response.data.data);
      } catch (error) {
        console.error('Lỗi khi lấy danh sách nhân viên:', error);
        message.error('Lỗi khi lấy danh sách nhân viên');
      } finally {
       
      }
    };

    // Gọi API khi component được mount

  const fetchNamePage = async () => {
    try {
      const response = await axios.get('/api/pageName');
      setData(response.data.data); // Danh sách đơn hàng
    } catch (error) {
      console.error('Lỗi khi lấy đơn hàng:', error);
    }
  };
  // Lưu đơn hàng vào localStorage mỗi khi orders thay đổi (chỉ chạy trên client)
 

  const mktOptions = employees
  .filter(order => order.position_team === 'mkt')
  .map(order => order.name);
  
    const handleAdd = async () => {
      if (!pageName || !selectedEmployee) {
        message.error("Vui lòng nhập đầy đủ thông tin");
        return;
      }
      try {
        const response = await axios.post('/api/pageName', {
          pageName,
          employee: selectedEmployee,
        });
        message.success(response.data.message);
        // Làm mới danh sách đơn hàng sau khi thêm
        fetchNamePage();
        // Reset form
        setPageName("");
        setSelectedEmployee(null);
      } catch (error) {
        console.error(error.response?.data?.error || error.message);
        message.error(error.response?.data?.error || "Lỗi khi thêm đơn hàng");
      }
    };
  const handleDelete = async (key) => {
    try {
      const response = await axios.delete(`/api/pageName/${key}`);
      message.success(response.data.message);
      // Làm mới danh sách đơn hàng sau khi xóa
      fetchNamePage();
    } catch (error) {
      console.error(error.response?.data?.error || error.message);
      message.error(error.response?.data?.error || "Lỗi khi xóa đơn hàng");
    }
  };

  const handleEdit = (record) => {
    setIsEditing(true);
    setEditingRecord(record);
    setPageName(record.pageName);
    setSelectedEmployee(record.employee);
  };

  
  const handleSaveEdit = async () => {
    try {
      const updateData = {
        pageName,
        employee: selectedEmployee,
      };
      const response = await axios.put(`/api/pageName/${editingRecord.key}`, updateData);
      message.success(response.data.message);
      // Làm mới danh sách đơn hàng sau khi cập nhật
      fetchNamePage();
      // Reset trạng thái edit
      setIsEditing(false);
      setEditingRecord(null);
      setPageName("");
      setSelectedEmployee(null);
    } catch (error) {
      console.error(error.response?.data?.error || error.message);
      message.error(error.response?.data?.error || "Lỗi khi cập nhật đơn hàng");
    }
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
        dataSource={data.sort((a, b) => (a.employee?.localeCompare(b.employee) || 0))}
        pagination={false}
      />
    </div>  
  );
};

export default EmployeePageTable;
