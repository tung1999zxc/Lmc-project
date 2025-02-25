  'use client';
  import React, { useState ,useEffect} from 'react';
  import { 
    Form, Input, Button, Select, Table, Card, Row, Col, 
    Modal, Popconfirm, message 
  } from 'antd';
  import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
  import { useSelector, useDispatch } from 'react-redux';
  import { addEmployee, updateEmployee, deleteEmployee } from '../store/employeeSlice';
  import axios from 'axios';
  export default function EmployeeManagement() {
    const dispatch = useDispatch();
    // const employees = useSelector((state) => state.employees.employees);

    const [editModalVisible, setEditModalVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [employees, setEmployees] = useState([]);
    const [createForm] = Form.useForm();
    const [editForm] = Form.useForm();

    const positions = [
      { label: 'ADMIN', value: 'admin' },
      { label: 'Trưởng phòng MKT', value: 'managerMKT' },
      { label: 'Trưởng phòng Sale', value: 'managerSALE' },
      { label: 'Lead Maketing', value: 'lead' }, 
      { label: 'Lead Sale', value: 'leadSALE' }, 
      { label: 'Nhân viên MKT', value: 'mkt' },
      { label: 'Nhân viên Sale nhập đơn', value: 'salenhapdon' },
      { label: 'Nhân viên Sale xác nhận đơn', value: 'salexacnhan' },
      { label: 'Nhân viên Sale xử lý đơn', value: 'salexuly' },
      { label: 'Nhân viên Sale Online', value: 'salefull' },
      { label: 'Nhân viên kho', value: 'kho1' },
      { label: 'Nhân viên kho2', value: 'kho2' }
    ];
    const position_team = [
      { label: 'ADMIN', value: 'admin' }, 
      { label: 'SALE', value: 'sale' }, 
      { label: 'MKT', value: 'mkt' },
      { label: 'Kho', value: 'kho' }
    ];
    const position_team2 = [
      { label: 'Online Sáng', value: 'onlinesang' }, 
      { label: 'Online Tối', value: 'onlinetoi' }, 
      { label: 'Hành chính', value: 'hanhchinh' },
      
    ];
    const teams = [
      { label: 'TEAM SƠN', value: 'SON' }, 
      { label: 'TEAM QUÂN', value: 'QUAN' }, 
      { label: 'TEAM CHI', value: 'CHI' }, 
      { label: 'TEAM PHONG', value: 'PHONG' },   
      { label: 'TEAM TUẤN ANH', value: 'TUANANH' }, 
      { label: 'TEAM DIỆN', value: 'DIEN' }, 
      { label: 'TEAM LẺ', value: 'LE' }, 
      
    ];

    const fetchEmployees = async () => {
      setLoading(true);
      try {
        const response = await axios.get('/api/employees');
        // response.data.data chứa danh sách nhân viên theo API đã viết
        setEmployees(response.data.data);
      } catch (error) {
        console.error('Lỗi khi lấy danh sách nhân viên:', error);
        message.error('Lỗi khi lấy danh sách nhân viên');
      } finally {
        setLoading(false);
      }
    };

    // Gọi API khi component được mount
    useEffect(() => {
      fetchEmployees();
    }, []);

    const getPositionLabel = (value) => {
      const pos = positions.find(p => p.value === value);
      return pos ? pos.label : value;
    };

    const getTeamName = (team_id) => {
      const team = teams.find(t => t.value === team_id);
      return team ? team.label : '';
    };

    const getPositionTeamLabel = (ptValue) => {
      const pt = position_team.find(pt => pt.value === ptValue);
      return pt ? pt.label : ptValue;
    };
    const getPositionTeamLabel2 = (ptValue) => {
      const pt = position_team2.find(pt => pt.value === ptValue);
      return pt ? pt.label : ptValue;
    };

    const columns = [
      { title: 'Mã NV', dataIndex: 'employee_code' },
      { title: 'Tài khoản', dataIndex: 'username' },
      { title: 'Họ tên', dataIndex: 'name' },
      { 
        title: 'Chức vụ', 
        dataIndex: 'position', 
        render: (value) => getPositionLabel(value)
      },
      { 
        title: 'Team', 
        dataIndex: 'team_id', 
        render: (value) => getTeamName(value)
      },
      { 
        title: 'Bộ phận', 
        dataIndex: 'position_team', 
        render: (value) => getPositionTeamLabel(value)
      },
      { 
        title: 'Ca làm việc', 
        dataIndex: 'position_team2', 
        render: (value) => getPositionTeamLabel2(value)
      },
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

    const handleSubmit = async (formData) => {
      setLoading(true);
      console.log(formData);
      try {
        const response = await axios.post('/api/employees', formData);
        console.log(response.data.message);
        message.success('Tạo tài khoản thành công');
        createForm.resetFields();
        setLoading(false);
        fetchEmployees();
        // Xử lý thành công (ví dụ: chuyển hướng, thông báo, ...)
      } catch (error) {
        console.error(error.response.data.error);
        setLoading(false); // Xử lý lỗi (ví dụ: thông báo lỗi cho người dùng)
      }
    };
      
      
    

    const handleEdit = (employee) => {
      setSelectedEmployee(employee);
      setEditModalVisible(true);
      editForm.setFieldsValue({
        username: employee.username,
        name: employee.name,
        position: employee.position,
        team_id: employee.team_id,
        position_team: employee.position_team,
        position_team2: employee.position_team2
      });
    };

    const handleUpdate = async (values) => {
      setLoading(true);
    
      // Tạo object chứa dữ liệu cập nhật, kết hợp với thông tin cũ của selectedEmployee
      const updatedEmployee = {
        ...selectedEmployee,
        username: values.username,
        name: values.name,
        position: values.position,
        team_id: values.team_id,
        position_team: values.position_team,
        position_team2: values.position_team2,
      };
    
      try {
        // Gọi API PUT với employee_id chuyển đổi thành Number (vì employee_id được tạo bằng Date.now())
        const response = await axios.put(
          `/api/employees/${Number(selectedEmployee.employee_id)}`,
          updatedEmployee
        );
        console.log('Update response:', response.data.message);
        message.success('Cập nhật nhân viên thành công');
        // Làm mới danh sách nhân viên sau khi cập nhật
        await fetchEmployees();
      } catch (error) {
        console.error('Lỗi khi cập nhật nhân viên:', error.response?.data?.error || error.message);
        message.error('Cập nhật nhân viên thất bại');
      } finally {
        // Đóng modal, reset form và cập nhật trạng thái loading
        setEditModalVisible(false);
        setSelectedEmployee(null);
        editForm.resetFields();
        setLoading(false);
      }
    };
    
    // Hàm xóa nhân viên qua API
    const handleDelete = async (employee_id) => {
      try {
        // Gọi API DELETE với employee_id chuyển đổi thành Number
        const response = await axios.delete(`/api/employees/${Number(employee_id)}`);
        console.log('Delete response:', response.data.message);
        message.success('Xóa nhân viên thành công');
        // Làm mới danh sách nhân viên sau khi xóa
        await fetchEmployees();
      } catch (error) {
        console.error('Lỗi khi xóa nhân viên:', error.response?.data?.error || error.message);
        message.error('Xóa nhân viên thất bại');
      }
    };

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
            <Select options={position_team.map(p => ({ label: p.label, value: p.value }))} />
          </Form.Item>
          <Form.Item
            label="Ca làm việc"
            name="position_team2"
          
          >
            <Select options={position_team2.map(p => ({ label: p.label, value: p.value }))} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
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
                  label="Team (chỉ dành cho MKT)"
                  name="team_id"
                
                >
                  <Select options={teams} />
                </Form.Item>
                <Form.Item
                  label="Bộ Phận"
                  name="position_team"
                  rules={[{ required: true, message: 'Vui lòng chọn bộ phận' }]}
                >
                  <Select options={position_team.map(p => ({ label: p.label, value: p.value }))} />
                </Form.Item>
                <Form.Item
                  label="Ca Làm Việc (chỉ dành cho Sale Nhập đơn và sale Online)"
                  name="position_team2"
                
                >
                  <Select options={position_team2.map(p => ({ label: p.label, value: p.value }))} />
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