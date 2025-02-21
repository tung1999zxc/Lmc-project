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
import dayjs from "dayjs";
const { Option } = Select;

const Dashboard = () => {
  const currentUser = useSelector((state) => state.user.currentUser);
  const employees = useSelector((state) => state.employees.employees);
  const [period, setPeriod] = useState("month");
  const [form] = Form.useForm();
  const [sampleOrders, setSampleOrders] = useState([]);
  const [records, setRecords] = useState([]);
  const [editingRecord, setEditingRecord] = useState(null);
  // Bộ lọc theo khoảng thời gian (mặc định 7 ngày)
  // const [filterOption, setFilterOption] = useState("7"); // Đã loại bỏ
  // Nếu là manager, có thêm bộ lọc để chọn team (default "all" hiển thị tất cả các team)
  const [selectedDate, setSelectedDate] = useState();
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
    if (typeof window !== "undefined" && records && records.length > 0) {
      localStorage.setItem("records", JSON.stringify(records));
    }
  }, [records]);

  // if (currentUser.position === 'admin'){
  //   // Nếu admin thì trả về gì đó (theo code ban đầu của bạn)
  //   return (currentUser.position_team = ['sale', 'mkt']);
  // };

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
      name: `TEAM PHONG `,
      members: employees
        .filter(employee => employee.team_id === 'PHONG')
        .map(employee => employee.employee_code)
    },
    {
      id: 5,
      name: `TEAM TUẤN ANH `,
      members: employees
        .filter(employee => employee.team_id === 'TUANANH')
        .map(employee => employee.employee_code)
    },
    {
      id: 6,
      name: `TEAM DIỆN `,
      members: employees
        .filter(employee => employee.team_id === 'DIEN')
        .map(employee => employee.employee_code)
    },
    {
      id: 7,
      name: `TEAM LẺ `,
      members: employees
        .filter(employee => employee.team_id === 'LE')
        .map(employee => employee.employee_code)
    },
  ];
  
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

  // Hàm lọc records theo khoảng thời gian dựa trên period state
  const filterRecordsByPeriod = (record) => {
    const recordDate = moment(record.date, "YYYY-MM-DD");
    const now = moment();
    if (period === "week") {
      return recordDate.isSameOrAfter(now.clone().subtract(7, "days"), "day");
    }else if (period === "day") {
      // Ngày hiện tại: so sánh theo định dạng "YYYY-MM-DD"
      return recordDate.format("YYYY-MM-DD") === now.format("YYYY-MM-DD");}
     else if (period === "month") {
      return recordDate.isSame(now, "month") && recordDate.isSameOrAfter(now.clone().startOf("month"));
    } else if (period === "lastMonth") {
      const lastMonth = now.clone().subtract(1, "months");
      return recordDate.isSame(lastMonth, "month");
    } else if (period === "twoMonthsAgo") {
      const twoMonthsAgo = now.clone().subtract(2, "months");
      return recordDate.isSame(twoMonthsAgo, "month");
    }
    return true;
  };

  // Tính tổng doanh số cho một nhân viên dựa trên sampleOrders đã được lọc theo thời gian
  const computeTotalSales = (employeeName) => {
    const totalProfit = sampleOrders
      .filter((p) => p.mkt === employeeName && filterSampleOrdersByPeriod(p))
      .reduce((sum, p) => sum + p.profit, 0) * 17000;
    return totalProfit;
  };
  const computeTotalADS = (employeeName) => {
    const totalADS = records
      .filter((p) => p.name === employeeName && filterRecordsByPeriod(p))
      .reduce((sum, p) => sum + p.adsMoney, 0);
    return totalADS;
  };
  
  const computePercentADS = (employeeName) => {
    const totalSales = computeTotalSales(employeeName);
    const totalADS = computeTotalADS(employeeName);
    return totalSales > 0 ? ((totalADS / totalSales) * 100).toFixed(2) : "N/A";
  };
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
    // Lọc theo khoảng thời gian dựa trên period đã chọn
    filtered = filtered.filter(record => filterRecordsByPeriod(record));

    // Lọc theo quyền:
    if (currentUser.position === 'mkt') {
      filtered = filtered.filter(record => record.userId === currentUser.employee_code);
    } else if (currentUser.position === 'lead') {
      filtered = filtered.filter(record => leadTeamMembers.includes(record.userId));
    } else if (currentUser.position === 'managerMKT' ||currentUser.position === 'admin') {
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
          .reduce((sum, p) => (sum + p.profit)*17000, 0)
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
        return (total - record.excessMoney).toLocaleString('vi-VN');
      }
    },
    {
      title: 'Tiền thừa',
      key: 'excessMoney',
      render: (_, record) => record.excessMoney.toLocaleString('vi-VN')
    },
    {
      title: 'Doanh số',
      key: 'sales',
      render: (_, record) => {
        const totalSalesForSelectedDate = computeTotalSalesForDate(record.date, record.name);
        return totalSalesForSelectedDate.toLocaleString('vi-VN');
      },
    },
    {
      title: '%ADS',
      key: 'percentAds',
      render: (_, record) => {
        const totalSalesForSelectedDate = computeTotalSalesForDate(record.date, record.name);
        const total = record.oldMoney + record.request1 + record.request2;
        if (totalSalesForSelectedDate === 0) return 'N/A';
        const percent = Number(((total - record.excessMoney) / totalSalesForSelectedDate) * 100);
        
        let bgColor = "";
        if (percent < 30) {
          bgColor = "#54DA1F"; // nền xanh lá (màu xanh nhạt)
        } else if (percent >= 30 && percent <= 35) {
          bgColor = "##FF9501"; // nền vàng nhạt
        } else {
          bgColor = "#EC2527"; // nền đỏ nhạt
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
            {percent.toFixed(2)}%
          </div>
        );
      }
    },

    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => {
        // Với lead và manager: chỉ cho phép sửa/xóa nếu record thuộc về chính họ, ngược lại chỉ xem
        if (currentUser.position === 'lead' || currentUser.position === 'managerMKT'||currentUser.position === 'admin ') {
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
 // Xác định màu nền dựa trên %ADS
 const getBgColor = (employeeName) => {
  const p = parseFloat(computePercentADS(employeeName));
  if (isNaN(p)) return "transparent";
  if (p < 30) return "#54DA1F"; // màu xanh (blue)
  if (p >= 30 && p <= 35) return "##FF9501"; // màu cam (orange)
  return "#FF0000"; // màu đỏ (red)
};
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
              <h4>NGÀY</h4>
                <Form.Item initialValue={moment()}
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
              <h4 hidden={editingRecord}>Tiền thừa hôm qua</h4>
                <Form.Item name="oldMoney" hidden={editingRecord}>
                  <InputNumber placeholder="Tiền cũ" style={{ width: '100%' }} />
                </Form.Item>
                <h4 hidden={!editingRecord}>Tiền thừa </h4>
              <Form.Item name="excessMoney" hidden={!editingRecord}>
          <InputNumber placeholder="Tiền thừa" style={{ width: '100%' }} />
        </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={3} lg={6}>
              <h4 hidden={editingRecord}>Xin buổi sáng</h4>
                <Form.Item name="request1" hidden={editingRecord} >
                  <InputNumber placeholder="Xin lần 1" style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={3} lg={6}>
              <h4 hidden={editingRecord} >Xin buổi chiều</h4>
                <Form.Item name="request2" hidden={editingRecord}>
                  <InputNumber placeholder="Xin lần 2" style={{ width: '100%' }} />
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
          <h2>Bảng thông tin Nhân viên </h2>
        </Col>
      </Row>

      {/* Bộ lọc */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8}>
          <div style={{ marginBottom: 16 }}>
          <span style={{ marginRight: 8 }}>Chọn thời gian </span><br/>
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
        </Col>
        {(currentUser.position === 'managerMKT'|| currentUser.position === 'admin' )&& (
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
      {currentUser.position === 'managerMKT'||currentUser.position === 'admin' || currentUser.position === 'lead' ? (
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
                <div
        style={{
          fontWeight: "bold",
          marginBottom: 8,
          padding: "4px 8px",
          borderRadius: "4px",
          backgroundColor: getBgColor(userRecords[0].name),
          color: "#111111",
        }}
      >
        Tổng doanh số: {computeTotalSales(userRecords[0].name).toLocaleString("vi-VN")} | Chi phí Ads:{" "}
        {computeTotalADS(userRecords[0].name).toLocaleString("vi-VN")} | %ADS: {computePercentADS(userRecords[0].name)}%
      </div>
                
                
              </Col>
              <Col xs={24}>
                <Table
                 dataSource={userRecords.sort((a, b) => {
                    return dayjs(b.date).valueOf() - dayjs(a.date).valueOf();
                  })}
                  columns={columns}
                  rowKey="id"
                  pagination={{ pageSize: 5 }}
                  scroll={{ x: true }}
                />
              </Col>
            </Row>
          ))
      ) : (
        <>
          
            <div
        style={{
          fontWeight: "bold",
          marginBottom: 8,
          padding: "4px 8px",
          borderRadius: "4px",
          backgroundColor: getBgColor(currentUser.name),
          color: "#111111",
        }}
      >
        Tổng doanh số: {computeTotalSales(currentUser.name).toLocaleString("vi-VN")} | Chi phí Ads:{" "}
        {computeTotalADS(currentUser.name).toLocaleString("vi-VN")} | %ADS: {computePercentADS(currentUser.name)}%
      </div>
          
          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <Table
                dataSource={filteredRecords.sort((a, b) => {
                  return dayjs(b.date).valueOf() - dayjs(a.date).valueOf();
                })}
                columns={columns}
                rowKey="id"
                
                scroll={{ x: true }}
                pagination={{ pageSize: 30 }}
              />
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};

export default Dashboard;
