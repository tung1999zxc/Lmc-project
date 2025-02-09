'use client';

import { 
  Form, Input, Button, Select, Table, Card, Row, Col, 
  Modal, Popconfirm, message 
} from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';
import axios from 'axios';

// Tạo một instance của axios, chỉnh sửa baseURL theo dự án của bạn
const api = axios.create({
  baseURL: 'http://localhost:3000/api' // Thay đổi URL cho phù hợp
});

export default function EmployeeManagement() {
  // Khai báo state cho danh sách nhân viên
  const [employees, setEmployees] = useState([]);

  // State cho modal chỉnh sửa, loading và nhân viên được chọn để chỉnh sửa
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Tạo hai instance form: một cho tạo mới và một cho chỉnh sửa
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();

  // Danh sách chức vụ và team
  const positions = [
    {label: 'ADMIN', value: 1 },
    {label: 'Trưởng phòng MKT', value: 2 },
    {label: 'Trưởng phòng Sale', value: 3 },
    {label: 'Lead MKT', value: 4 },
    {label: 'Nhân viên MKT', value: 5 },
    {label: 'Lead Sale', value: 6 },
    {label: 'Nhân viên Sale nhập đơn', value: 7 },
    {label: 'Nhân viên Sale xác nhận đơn', value: 8 },
    {label: 'Nhân viên Sale xử lý đơn', value: 9 },
    {label: 'Nhân viên kho', value: 10 }
  ];
  const position_team = [
    { label: 'SALE', value: 2 },
    { label: 'MKT', value: 1 },
    
  ];
  const teams = Array.from({ length: 10 }, (_, i) => ({
    value: i + 1,
    label: `Team ${i + 1}`
  }));

  // Lấy danh sách nhân viên khi component mount
  useEffect(() => {
    // fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/employees');
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  // Xử lý tạo nhân viên mới
  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      await api.post('/employees', values);
      createForm.resetFields();
      fetchEmployees();
    } catch (error) {
      console.error('Error creating employee:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cấu hình các cột của Table
  const columns = [
    { title: 'Mã NV', dataIndex: 'employee_code' },
    { title: 'Tài khoản', dataIndex: 'username' },
    { title: 'Họ tên', dataIndex: 'name' },
    { title: 'Chức vụ', dataIndex: 'position' },
    { title: 'Team', dataIndex: 'team_name' },
    { title: 'Bộ phận', dataIndex: 'position_name' },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => (
        <div>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Bạn chắc chắn muốn xóa?"
            onConfirm={() => handleDelete(record.employee_id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </div>
      )
    }
  ];

  // Khi bấm nút chỉnh sửa, mở modal và set giá trị cho form chỉnh sửa
  const handleEdit = (employee) => {
    setSelectedEmployee(employee);
    editForm.setFieldsValue({
      ...employee,
      password: '' // Xoá trường mật khẩu để người dùng nhập mới nếu cần
    });
    setEditModalVisible(true);
  };

  // Xử lý cập nhật nhân viên
  const handleUpdate = async (values) => {
    try {
      // Nếu không nhập mật khẩu mới, loại bỏ trường này khỏi payload
      const payload = values.password 
        ? values 
        : { ...values, password: undefined };

      await api.put(`/employees/${selectedEmployee.employee_id}`, payload);
      message.success('Cập nhật thành công');
      setEditModalVisible(false);
      fetchEmployees();
    } catch (error) {
      message.error('Cập nhật thất bại');
    }
  };

  // Xử lý xóa nhân viên
  const handleDelete = async (id) => {
    try {
      await api.delete(`/employees/${id}`);
      message.success('Xóa thành công');
      fetchEmployees();
    } catch (error) {
      message.error('Xóa thất bại');
    }
  };

  // Modal chỉnh sửa nhân viên
  const EditModal = () => (
    <Modal
      title="Chỉnh sửa nhân viên"
      visible={editModalVisible}
      onCancel={() => setEditModalVisible(false)}
      footer={null}
    >
      <Form
        form={editForm}
        layout="vertical"
        onFinish={handleUpdate}
      >
        <Form.Item label="Mã NV">
          <Input disabled value={selectedEmployee?.employee_code} />
        </Form.Item>

        <Form.Item
          label="Tài khoản"
          name="username"
          rules={[{ required: true, message: 'Vui lòng nhập tài khoản' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Mật khẩu mới"
          name="password"
        >
          <Input.Password placeholder="Để trống nếu không đổi" />
        </Form.Item>

        <Form.Item
          label="Họ tên"
          name="name"
          rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Chức vụ"
          name="position"
          rules={[{ required: true, message: 'Vui lòng chọn chức vụ' }]}
        >
          <Select options={positions.map(p => ({ label: p.label, value: p.value }))} />
        </Form.Item>

        <Form.Item
          label="Team"
          name="team_id"
         
        >
          <Select options={teams} />
        </Form.Item>
        <Form.Item
          label="Bộ phận"
          name="position_team"
          rules={[{ required: true, message: 'Vui lòng chọn' }]}
        >
          <Select options={teams} />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit">
            Cập nhật
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );

  return (
    <div style={{ padding: 24 }}>
      <Row gutter={[16, 16]}>
        <Col span={8}>
          <Card title="Tạo tài khoản nhân viên">
            <Form 
              form={createForm} 
              layout="vertical" 
              onFinish={handleSubmit}
            >
              <Form.Item
                label="Tài khoản"
                name="username"
                rules={[{ required: true, message: 'Vui lòng nhập tài khoản' }]}
              >
                <Input />
              </Form.Item>

              <Form.Item
                label="Mật khẩu"
                name="password"
                rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
              >
                <Input.Password />
              </Form.Item>

              <Form.Item
                label="Họ tên"
                name="name"
                rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
              >
                <Input />
              </Form.Item>

              <Form.Item
                label="Chức vụ"
                name="position"
                rules={[{ required: true, message: 'Vui lòng chọn chức vụ' }]}
              >
                <Select options={positions.map(p => ({ label: p.label, value: p.value }))} />
              </Form.Item>

              <Form.Item
                label="Team"
                name="team_id"
                rules={[{ required: true, message: 'Vui lòng chọn team' }]}
              >
                <Select options={teams} />
              </Form.Item>
              <Form.Item
                label="Bộ Phận"
                name="position_team"
                rules={[{ required: true, message: 'Vui lòng chọn team' }]}
              >
                <Select options={position_team} />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading}>
                  Tạo tài khoản
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col span={16}>
          <Card title="Danh sách nhân viên">
            <Table 
              columns={columns}
              dataSource={employees}
              rowKey="employee_id"
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </Col>
      </Row>
      {editModalVisible && <EditModal />}
    </div>
  );
}
