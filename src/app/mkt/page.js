// pages/dashboard.js
"use client"
import React, { useState, useEffect } from 'react';
import {
  Table,
  Form,
  InputNumber,
  DatePicker,
  Popconfirm,
  Button,
  Select,
  message,
  Modal,
  Row,
  Col
} from 'antd';
import moment from 'moment';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';

const { Option } = Select;

const Dashboard = () => {
  const currentUser = useSelector((state) => state.user.currentUser);
  const employees = useSelector((state) => state.employees.employees);

  const [form] = Form.useForm();
  const [sampleOrders, setSampleOrders] = useState([]);
  const [records, setRecords] = useState([]);
  const [editingRecord, setEditingRecord] = useState(null);
  // Bộ lọc theo khoảng thời gian (mặc định 7 ngày)
  const [filterOption, setFilterOption] = useState("7");
  const [selectedDate, setSelectedDate] = useState();
  // Nếu là manager, có thêm bộ lọc để chọn team (default "all" hiển thị tất cả các team)
  const [selectedTeam, setSelectedTeam] = useState("all");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedRecords = localStorage.getItem("records");
      if (savedRecords) {
        setRecords(JSON.parse(savedRecords));
      }
      const savedOrders = localStorage.getItem("orders");
      if (savedOrders) {
        setSampleOrders(JSON.parse(savedOrders));
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("records", JSON.stringify(records));
    }
  }, [records]);

  if (currentUser.position === 'admin'){
    // Nếu admin thì trả về gì đó (theo code ban đầu của bạn)
    return (currentUser.position_team = ['sale', 'mkt']);
  };

  // Với vai trò lead, lấy danh sách mã nhân viên cùng team của lead
  const leadTeamMembers = employees
    .filter(employee => employee.team_id === currentUser.team_id)
    .map(employee => employee.employee_code);

  // Tạo danh sách các team (ví dụ, team_id là chuỗi 'SON', 'QUAN', 'CHI', 'LE')
  const teamsList = [
    {
      id: 1,
      name: `TEAM SƠN `,
      members: employees
        .filter(employee => employee.team_id === 'SON')
        .map(employee => employee.employee_code)
    },
    {
      id: 2,
      name: `TEAM QUÂN `,
      members: employees
        .filter(employee => employee.team_id === 'QUAN')
        .map(employee => employee.employee_code)
    },
    {
      id: 3,
      name: `TEAM CHI `,
      members: employees
        .filter(employee => employee.team_id === 'CHI')
        .map(employee => employee.employee_code)
    },
    {
      id: 4,
      name: `TEAM LẺ `,
      members: employees
        .filter(employee => employee.team_id === 'LE')
        .map(employee => employee.employee_code)
    },
  ];

  /*** Hàm nhóm record theo userId ***/
  const groupRecordsByUser = (records) => {
    return records.reduce((acc, record) => {
      const user = record.userId;
      if (!acc[user]) {
        acc[user] = [];
      }
      acc[user].push(record);
      return acc;
    }, {});
  };

  /*** Hàm nhóm record theo team (nếu cần) ***/
  const groupRecordsByTeam = (records) => {
    const grouped = {};
    teamsList.forEach((team) => {
      grouped[team.id] = records.filter(record =>
        team.members.includes(record.userId)
      );  
    });
    return grouped;
  };

  /*** Xử lý submit form (Thêm mới hoặc cập nhật) ***/
  const onFinish = (values) => {
    const { date, oldMoney = 0, request1 = 0, request2 = 0, excessMoney = 0, sales = 0 } = values;
    const newRecord = {
      id: editingRecord ? editingRecord.id : Date.now(),
      date: date.format('YYYY-MM-DD'),
      oldMoney,
      request1,
      request2,
      excessMoney,
      teamnv: currentUser.team_id,
      adsMoney: oldMoney + request1 + request2 - excessMoney,
      name: currentUser.name,
      userId: currentUser.employee_code // gán mã nhân viên của người nhập
    };

    if (editingRecord) {
      setRecords(prevRecords =>
        prevRecords.map(record => record.id === editingRecord.id ? newRecord : record)
      );
      setEditingRecord(null);
      message.success('Cập nhật thành công');
    } else {
      setRecords(prevRecords => [...prevRecords, newRecord]);
      message.success('Thêm mới thành công');
    }
    form.resetFields();
  };

  /*** Xử lý sửa record ***/
  const onEdit = (record) => {
    setEditingRecord(record);
    form.setFieldsValue({
      date: moment(record.date, 'YYYY-MM-DD'),
      oldMoney: record.oldMoney,
      request1: record.request1,
      request2: record.request2,
      excessMoney: record.excessMoney,
      adsMoney: record.oldMoney + record.request1 + record.request2 - record.excessMoney,
    });
  };

  /*** Xử lý xóa record ***/
  const onDelete = (record) => {
    setRecords(prevRecords => prevRecords.filter(r => r.id !== record.id));
    message.success('Xóa thành công');
  };

  /*** Lọc dữ liệu theo khoảng thời gian và theo quyền ***/
  const getFilteredRecords = () => {
    let filtered = [...records];
    // Lọc theo khoảng thời gian: so sánh với ngày hiện tại
    const days = parseInt(filterOption, 10);
    const now = moment();
    filtered = filtered.filter(record => {
      const diffDays = now.diff(moment(record.date, 'YYYY-MM-DD'), 'days');
      return diffDays < days;
    });

    // Lọc theo quyền:
    if (currentUser.position === 'mkt') {
      filtered = filtered.filter(record => record.userId === currentUser.employee_code);
    } else if (currentUser.position === 'lead') {
      filtered = filtered.filter(record => leadTeamMembers.includes(record.userId));
    } else if (currentUser.position === 'managerMKT') {
      // Nếu manager chọn một team cụ thể thì lọc theo team đó,
      // còn nếu chọn "all" thì không lọc thêm.
      if (selectedTeam && selectedTeam !== 'all') {
        const teamObj = teamsList.find(team => team.id === selectedTeam);
        if (teamObj) {
          filtered = filtered.filter(record =>
            teamObj.members.includes(record.userId)
          );
        }
      }
    } else if (currentUser.position_team === 'sale') {
      filtered = [];
    } else if (currentUser.position_team === 'kho') {
      filtered = [];
    }
    return filtered;
  };

  const filteredRecords = getFilteredRecords();

  const computeTotalSalesForDate = (date, recordname) => {
    return date
      ? sampleOrders
          .filter(p => p.orderDate === date && p.mkt === recordname)
          .reduce((sum, p) => sum + p.profit, 0)
      : 0;
  };

  /*** Định nghĩa các cột cho bảng ***/
  const columns = [
    {
      title: 'Ngày',
      dataIndex: 'date',
      key: 'date',
      render: (date) => moment(date, 'YYYY-MM-DD').format('DD/MM/YYYY'),
    },
    {
      title: 'Tiền ADS',
      key: 'totalReceived',
      render: (_, record) => {
        const total = record.oldMoney + record.request1 + record.request2;
        return total - record.excessMoney;
      }
    },
    {
      title: 'Tiền thừa',
      key: 'excessMoney',
      render: (_, record) => record.excessMoney
    },
    {
      title: 'Doanh số',
      key: 'sales',
      render: (_, record) => {
        const totalSalesForSelectedDate = computeTotalSalesForDate(record.date, record.name);
        return totalSalesForSelectedDate;
      },
    },
    {
      title: '%ADS',
      key: 'percentAds',
      render: (_, record) => {
        const totalSalesForSelectedDate = computeTotalSalesForDate(record.date, record.name);
        const total = record.oldMoney + record.request1 + record.request2;
        if (totalSalesForSelectedDate === 0) return 'N/A';
        const percent = ((total - record.excessMoney) / totalSalesForSelectedDate) * 100;
        return `${percent.toFixed(2)}%`;
      }
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => {
        // Với lead và manager: chỉ cho phép sửa/xóa nếu record thuộc về chính họ, ngược lại chỉ xem
        if (currentUser.position === 'lead' || currentUser.position === 'managerMKT') {
          if (record.userId === currentUser.employee_code) {
            return (
              <>
                <Button icon={<EditOutlined />} onClick={() => onEdit(record)} />
                <Popconfirm title="Xóa bản ghi?" onConfirm={() => onDelete(record)}>
                  <Button danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </>
            );
          } else {
            return <span>Chỉ xem</span>;
          }
        }
        // Với employee: hiển thị các thao tác sửa/xóa
        return (
          <>
            <Button icon={<EditOutlined />} onClick={() => onEdit(record)} />
            <Popconfirm title="Xóa bản ghi?" onConfirm={() => onDelete(record)}>
              <Button danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </>
        );
      }
    }
  ];

  return (
    <div style={{ padding: 24 }}>
      {/* Tiêu đề "Nhập thông tin" */}
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <h2>Nhập thông tin</h2>
        </Col>
      </Row>
      {/* Form nhập liệu */}
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            style={{ marginBottom: 16 }}
          >
            <Row gutter={16}>
              <Col xs={24} sm={12} md={3} lg={6}>
                <Form.Item
                  name="date"
                  rules={[{ required: true, message: 'Vui lòng chọn ngày' }]}
                >
                  <DatePicker
                    placeholder="Ngày"
                    onChange={(date) => setSelectedDate(date)}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={3} lg={6}>
                <Form.Item name="oldMoney">
                  <InputNumber placeholder="Tiền cũ" style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={3} lg={6}>
                <Form.Item name="request1">
                  <InputNumber placeholder="Xin lần 1" style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={3} lg={6}>
                <Form.Item name="request2">
                  <InputNumber placeholder="Xin lần 2" style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={3} lg={6}>
                <Form.Item name="excessMoney">
                  <InputNumber placeholder="Tiền thừa" style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={3} lg={6}>
                <Form.Item>
                  <Button
                    disabled={currentUser.position_team === 'sale' || currentUser.position_team === 'kho'}
                    type="primary"
                    htmlType="submit"
                    style={{ width: '100%' }}
                  >
                    {editingRecord ? 'Cập nhật' : 'Thêm mới'}
                  </Button>
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Col>
      </Row>

      {/* Tiêu đề "Danh sách giao dịch" */}
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <h2>Danh sách giao dịch</h2>
        </Col>
      </Row>

      {/* Bộ lọc */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8}>
          <div>
            <span style={{ marginRight: 8 }}>Bộ lọc theo khoảng thời gian: </span>
            <Select
              defaultValue="7"
              style={{ width: '100%' }}
              onChange={(value) => setFilterOption(value)}
            >
              <Option value="1">1 ngày</Option>
              <Option value="7">1 tuần</Option>
              <Option value="30">1 tháng</Option>
            </Select>
          </div>
        </Col>
        {currentUser.position === 'managerMKT' && (
          <Col xs={24} sm={12} md={8}>
            <div>
              <span style={{ marginRight: 8 }}>Chọn team: </span>
              <Select
                value={selectedTeam}
                style={{ width: '100%' }}
                onChange={(value) => setSelectedTeam(value)}
              >
                <Option value="all">Tất cả</Option>
                {teamsList.map(team => (
                  <Option key={team.id} value={team.id}>
                    {team.name}
                  </Option>
                ))}
              </Select>
            </div>
          </Col>
        )}
      </Row>

      {/* Render bảng dữ liệu */}
      {currentUser.position === 'managerMKT' || currentUser.position === 'lead' ? (
        Object.entries(groupRecordsByUser(filteredRecords))
          .sort(([userIdA], [userIdB]) => {
            const currentUserKey = String(currentUser.employee_code);
            if (userIdA === currentUserKey) return -1;
            if (userIdB === currentUserKey) return 1;
            return 0;
          })
          .map(([userId, userRecords]) => (
            <Row gutter={[16, 16]} key={userId} style={{ marginBottom: 24 }}>
              <Col xs={24}>
                <h4>Nhân viên: {userRecords?.[0]?.name}</h4>
              </Col>
              <Col xs={24}>
                <Table
                  dataSource={userRecords}
                  columns={columns}
                  rowKey="id"
                  pagination={false}
                  scroll={{ x: true }}
                />
              </Col>
            </Row>
          ))
      ) : (
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Table
              dataSource={filteredRecords}
              columns={columns}
              rowKey="id"
              pagination={false}
              scroll={{ x: true }}
            />
          </Col>
        </Row>
      )}
    </div>
  );
};

export default Dashboard;
