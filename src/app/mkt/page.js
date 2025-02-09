// pages/dashboard.js
"use client"
import React, { useState ,useEffect} from 'react';
import {
  Table,
  Form,
  InputNumber,
  DatePicker,
  Popconfirm,
  Button,
  Select,
  message,
  Modal
} from 'antd';
import moment from 'moment';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';

const { Option } = Select;

const Dashboard = () => {
  const [form] = Form.useForm();
  const [records, setRecords] =useState([]);
  const [editingRecord, setEditingRecord] = useState(null);
  // Bộ lọc theo khoảng thời gian (mặc định 7 ngày)
  const [filterOption, setFilterOption] = useState("7");
  const [selectedDate, setSelectedDate] = useState();
  // Nếu là manager, ta có thêm bộ lọc để chọn team
  const [selectedTeam, setSelectedTeam] = useState("all"); // "all" hiển thị tất cả các team

  /*** Giả lập thông tin người dùng ***/
  // Ví dụ: userId của người đang đăng nhập
  const currentUserId = 5;
  // currentUserRole có thể là: 'employee', 'lead', hoặc 'manager'
  // Bạn có thể thay đổi giá trị này để test
  const currentUserRole = 'manager'; // thay manager đổi thành 'employee' hoặc 'lead' để kiểm tra
  // Với vai trò lead, giả sử team của lead (những record mà lead có quyền xem) là:
  const leadTeamMembers = [1, 2, 3];

  // Với vai trò manager, định nghĩa danh sách các team.
  // Mỗi team có id, name và danh sách thành viên (userId).
  const teamsList = [
    { id: 'team1', name: 'Team 1', members: [1, 2, 3] },
    { id: 'team2', name: 'Team 2', members: [4, 5, 6] }
    // Có thể bổ sung thêm team khác
  ];
  // Mảng đơn hàng mẫu
const sampleOrders = [
  {
    id: 1,
    date: '2025-02-07',
    employeeName: 'Nguyễn Văn A',
    sales: 200, 
  },
  {
    id: 5,
    date: '2025-02-07',
    employeeName: 'Nguyễn Văn A',
    sales: 200, 
  },
  {
    id: 6,
    date: '2025-02-06',
    employeeName: 'Nguyễn Văn A',
    sales: 250, 
  },
  {
    id: 6,
    date: '2025-02-06',
    employeeName: 'Nguyễn Văn A',
    sales: 250, 
  },
  {
    id: 7,
    date: '2025-02-06',
    employeeName: 'Nguyễn Văn A',
    sales: 250, 
  },
  {
    id: 2,
    date: '2025-02-07',
    employeeName: 'Trần Thị B',
    sales: 800,
  },
  {
    id: 8,
    date: '2025-02-07',
    employeeName: 'Trần Thị B',
   
    sales: 800,
  },
  {
    id: 9,
    date: '2025-02-06',
    employeeName: 'Trần Thị B',
   
    sales: 1000,
  },
  {
    id: 10,
    date: '2025-02-06',
    employeeName: 'Trần Thị B',
   
    sales: 1000,
  },
];
useEffect(() => {
  if (typeof window !== "undefined") {
    const savedRecords = localStorage.getItem("records");
    if (savedRecords) {
      setRecords(JSON.parse(savedRecords));
    }
  }
}, []);

// Lưu đơn hàng vào localStorage mỗi khi orders thay đổi (chỉ chạy trên client)
useEffect(() => {
  if (typeof window !== "undefined") {
    localStorage.setItem("records", JSON.stringify(records));
  }
}, [records]);
 useEffect(() => {
    
    localStorage.setItem("records", JSON.stringify(records));
  }, [records]);
  /*** Hàm nhóm record theo userId (dành cho lead) ***/
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

  /*** Hàm nhóm record theo team (dành cho manager khi hiển thị "all") ***/
  const groupRecordsByTeam = (records) => {
    const grouped = {};
    teamsList.forEach((team) => {
      grouped[team.id] = records.filter(record =>
        team.members.includes(record.userId)
      );
    });
    return grouped;
  };
  const getTeamColor = (teamId) => {
    // Danh sách các màu bạn muốn dùng (có thể tùy chỉnh)
    const colors = ['#f0f8ff', '#faebd7', '#e6e6fa', '#ffe4e1', '#fafad2', '#e0ffff', '#f5f5dc'];
    // Nếu teamId là số, có thể chuyển sang số và tính mod theo độ dài của mảng màu
    const index = parseInt(teamId, 10) % colors.length;
    return colors[index];
  };
  /*** Xử lý submit form (Thêm mới hoặc cập nhật) ***/
  const onFinish = (values) => {
    // Nếu không nhập gì thì các trường số mặc định là 0
    const {
      date,
      oldMoney = 0,
      request1 = 0,
      request2 = 0,
      excessMoney = 0,
      sales = 0,
    } = values;

    // Tạo record mới với id duy nhất (ở đây dùng timestamp)
    const newRecord = {
      id: editingRecord ? editingRecord.id : Date.now(),
      date: date.format('YYYY-MM-DD'),
      oldMoney,
      request1,
      request2,
      excessMoney,
      sales,
      userId: currentUserId // gán người nhập
    };

    if (editingRecord) {
      setRecords(prevRecords =>
        prevRecords.map(record =>
          record.id === editingRecord.id ? newRecord : record
        )
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
    // Với lead, chỉ được sửa record của chính mình
    // (Với manager, ví dụ này ta cho xem nên không cho thao tác sửa/xóa)
    
    setEditingRecord(record);
    form.setFieldsValue({
      date: moment(record.date, 'YYYY-MM-DD'),
      oldMoney: record.oldMoney,
      request1: record.request1,
      request2: record.request2,
      excessMoney: record.excessMoney,
      sales: record.sales,
    });
  };

  /*** Xử lý xóa record ***/
  const onDelete = (record) => {
    // Với lead: chỉ xóa được record của chính mình
   
   
        setRecords(prevRecords => prevRecords.filter(r => r.id !== record.id));
        message.success('Xóa thành công');
      }
    
  ;

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
    if (currentUserRole === 'employee') {
      filtered = filtered.filter(record => record.userId === currentUserId);
    } else if (currentUserRole === 'lead') {
      filtered = filtered.filter(record => leadTeamMembers.includes(record.userId));
    } else if (currentUserRole === 'manager') {
      // Manager xem tất cả các team, nhưng nếu chọn một team cụ thể thì lọc theo team đó.
      if (selectedTeam && selectedTeam !== 'all') {
        const teamObj = teamsList.find(team => team.id === selectedTeam);
        if (teamObj) {
          filtered = filtered.filter(record =>
            teamObj.members.includes(record.userId)
          );
        }
      }
      // Nếu selectedTeam === "all", không lọc thêm.
    }
    return filtered;
  };

  const filteredRecords = getFilteredRecords();

  const computeTotalSalesForDate = (date) => {
    return date
      ? sampleOrders
          .filter(
            (p) =>
              p.date === date && p.employeeName === "Nguyễn Văn A"
          )
          .reduce((sum, p) => sum + p.sales, 0)
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
   { title: 'Doanh số',
      key: 'sales',
      render: (_, record) => {
        const totalSalesForSelectedDate2 = computeTotalSalesForDate(record.date);
        return totalSalesForSelectedDate2;
      },
    },
    {
      title: '%ADS',
      key: 'percentAds',
      render: (_, record) => {
        const totalSalesForSelectedDate2 = computeTotalSalesForDate(record.date);
        const total = record.oldMoney + record.request1 + record.request2;
        if (totalSalesForSelectedDate2 === 0) return 'N/A';
        const percent = ((total - record.excessMoney) / totalSalesForSelectedDate2) * 100;
        return `${percent.toFixed(2)}%`;
      }
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => {
       
        
        // Với lead,manager: chỉ cho phép sửa/xóa nếu record thuộc về chính mình, ngược lại chỉ xem
        if (currentUserRole === 'lead'||currentUserRole === 'manager') {
          if (record.userId === currentUserId) {
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
        // Với employee (chỉ có record của chính họ)
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
      <h2>Nhập thông tin</h2>
      {/* Hiển thị form nhập liệu cho employee và lead (manager chỉ được xem) */}
      
        <Form
          form={form}
          layout="inline"
          onFinish={onFinish}
          style={{ marginBottom: 16 }}
        >
          <Form.Item
            name="date"
            rules={[{ required: true, message: 'Vui lòng chọn ngày' }]}
          >
            <DatePicker placeholder="Ngày" onChange={(date) => setSelectedDate(date)}/>
          </Form.Item>
          <Form.Item name="oldMoney">
            <InputNumber placeholder="Tiền cũ" />
          </Form.Item>
          <Form.Item name="request1">
            <InputNumber placeholder="Xin lần 1" />
          </Form.Item>
          <Form.Item name="request2">
            <InputNumber placeholder="Xin lần 2" />
          </Form.Item>
          <Form.Item name="excessMoney">
            <InputNumber placeholder="Tiền thừa" />
          </Form.Item>
          
           
           
          
          <Form.Item>
            <Button type="primary" htmlType="submit">
              {editingRecord ? 'Cập nhật' : 'Thêm mới'}
            </Button>
          </Form.Item>
        </Form>
   

      <h2>Danh sách giao dịch</h2>
      
      {/* Bộ lọc khoảng thời gian chung */}
      <div style={{ marginBottom: 16 }}>
        <span style={{ marginRight: 8 }}>Bộ lọc theo khoảng thời gian: </span>
        <Select
          defaultValue="7"
          style={{ width: 120 }}
          onChange={(value) => setFilterOption(value)}
        >
          <Option value="1">1 ngày</Option>
          <Option value="7">1 tuần</Option>
          <Option value="30">1 tháng</Option>
        </Select>
      </div>

      {/* Nếu là manager, hiển thị bộ lọc chọn team */}
      {currentUserRole === 'manager' && (
        <div style={{ marginBottom: 16 }}>
          <span style={{ marginRight: 8 }}>Chọn team: </span>
          <Select
            value={selectedTeam}
            style={{ width: 150 }}
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
      )}

      {/* Render bảng theo vai trò */}
      {currentUserRole === 'manager' ? (
        selectedTeam === 'all' ? (
          // Nhóm record theo team nếu manager chọn "Tất cả"
          Object.entries(groupRecordsByTeam(filteredRecords)).map(
            ([teamId, teamRecords]) =>
              teamRecords.length > 0 && (
                <div
                  key={teamId}
                  style={{
                    backgroundColor: "#cee5eb", // Gán nền theo team
                    marginBottom: 24,
                    padding: 16, // Thêm padding để nội dung không sát cạnh
                    borderRadius: 4,
                  }}
                >
                  <h3
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      height: "100%",
                    }}
                  >
                    {teamsList.find((t) => t.id === teamId)?.name}
                  </h3>
                  {Object.entries(groupRecordsByUser(teamRecords)).map(
                    ([userId, userRecords]) => (
                      <div key={userId}>
                        <h4>User: {userId}</h4>
                        <Table
                          dataSource={userRecords}
                          columns={columns}
                          rowKey="id"
                          pagination={false}
                        />
                      </div>
                    )
                  )}
                </div>
              )
          )
        ) : (
          // Nếu manager không chọn "Tất cả" team
          Object.entries(groupRecordsByUser(filteredRecords)).map(
            ([userId, userRecords]) => (
              <div
                key={userId}
                style={{
                  backgroundColor: "#f555", // Gán nền theo team
                  marginBottom: 24,
                  padding: 16, // Thêm padding để nội dung không sát cạnh
                  borderRadius: 4,
                }}
              >
                <h4>User: {userId}</h4>
                <Table
                  dataSource={userRecords}
                  columns={columns}
                  rowKey="id"
                  pagination={false}
                />
              </div>
            )
          )
        )
      ) : currentUserRole === 'lead' ? (
        // Với lead: nhóm record theo userId (những record của team lead)
        Object.entries(groupRecordsByUser(filteredRecords)).map(
          ([userId, userRecords]) => (
            <div key={userId} style={{ marginBottom: 24 }}>
              <h4>User: {userId}</h4>
              <Table
                dataSource={userRecords}
                columns={columns}
                rowKey="id"
                pagination={false}
              />
            </div>
          )
        )
      ) : (
        // Với employee: hiển thị bảng của chính họ
        <Table
          dataSource={filteredRecords}
          columns={columns}
          rowKey="id"
          pagination={false}
        />
      )}
    </div>
  );
};

export default Dashboard;