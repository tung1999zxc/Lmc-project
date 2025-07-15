'use client'
import { useState,useEffect,useMemo } from "react";
import { Table, Input, Select, Button, Space, Popconfirm , message, Modal } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from 'react-redux';
import axios from "axios";
import { DatePicker } from "antd";
import dayjs from "dayjs"; // Cài thêm dayjs để so sánh ngày
const { Option } = Select;
import { useRouter } from 'next/navigation';

const EmployeePageTable = () => {
  const router = useRouter(); 
  const currentUser = useSelector((state) => state.user.currentUser);
  useEffect(() => {
    if (!currentUser.name) {
      router.push("/login");
    } if (currentUser.position==="kho1") {
      router.push("/orders");
    }
  }, []);

  const [pageName, setPageName] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [data, setData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [dateRange, setDateRange] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [appliedSearchText, setAppliedSearchText] = useState("");
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [pageListInput, setPageListInput] = useState("");
const [filteredPages, setFilteredPages] = useState([]);

 
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
      // {
      //   id: 3,
      //   name: `TEAM CHI `,
      //   members: employees
      //     .filter(employee => employee.team_id === 'CHI')
      //     .map(employee => employee.employee_code)
      // },
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
      {
        id: 8,
        name: `TEAM DIỆU`,
        members: employees
          .filter(employee => employee.team_id === 'DIEU')
          .map(employee => employee.employee_code)
      },
      {
        id: 8,
        name: `TEAM PHI`,
        members: employees
          .filter(employee => employee.team_id === 'PHI')
          .map(employee => employee.employee_code)
      },
    ];

  const fetchNamePage = async () => {
    try {
      const response = await axios.get('/api/pageName');
      setData(response.data.data); // Danh sách đơn hàng
    } catch (error) {
      console.error('Lỗi khi lấy đơn hàng:', error);
    }
  };
  // Lưu đơn hàng vào localStorage mỗi khi orders thay đổi (chỉ chạy trên client)
 
  const leadTeamMembers = useMemo(() => {
    return employees
      .filter((employee) => employee.team_id === currentUser.team_id)
      .map((employee) => employee.name);
  }, [employees, currentUser.team_id]); 

  const filteredData = useMemo(() => {
    let tempData = []; 
    
    if (
      currentUser.position === "admin" ||
      currentUser.position === "managerMKT" ||
      currentUser.position_team === "sale"
    ) {
      tempData = data;
    } else if (currentUser.position === "lead") {
      tempData = data.filter((record) =>
        leadTeamMembers.includes(record.employee)
      );
    } else {
      tempData = data.filter((record) => record.employee === currentUser.name);
    }
  
    if (appliedSearchText) {
      tempData = tempData.filter((record) =>
        record.pageName.toLowerCase().includes(appliedSearchText.toLowerCase()) ||
        record.employee.toLowerCase().includes(appliedSearchText.toLowerCase())
      );
    }
  
    if (dateRange && dateRange.length === 2) {
      const [startDate, endDate] = dateRange;
      tempData = tempData.filter((record) => {
        const recordDate = dayjs(record.createdAt);
        return recordDate.isAfter(startDate.startOf('day')) && recordDate.isBefore(endDate.endOf('day'));
      });
    }
  
    if (selectedTeam) {
      // lọc theo team_id
      const teamMembers = employees
        .filter(emp => emp.team_id === selectedTeam)
        .map(emp => emp.name);
      tempData = tempData.filter(record => teamMembers.includes(record.employee));
    }
  
    return tempData;
  }, [data, currentUser, leadTeamMembers, appliedSearchText, dateRange, selectedTeam, employees]);
  

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
          employee_code:currentUser.employee_code,
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
      title: "Thời gian",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (value) => {
        const date = new Date(value);
        return date.toLocaleDateString('vi-VN'); 
      }
    },
    
    {
      title: "Thao Tác",
      key: "action",
      render: (_, record) =>{
                // Nếu currentUser có vai trò admin, managerMKT, managerSALE → hiển thị đầy đủ nút chỉnh sửa và xóa
                if (
                  currentUser.position === 'admin' ||  currentUser.position === 'managerSALE' ||  currentUser.position === 'managerMKT'
                  
                  
                ) {
                  return (
                    <div>
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
                    </div>
                  );
                } else {
                  // Nếu không phải các vị trí đặc quyền, chỉ cho phép chỉnh sửa nếu tài khoản trùng với currentUser
                  if (record.employee === currentUser.name) {
                    return (
                      <div>
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
                      </div>
                    );
                  } else {
                    return <span>Chỉ xem</span>;
                  }
                }
              } 
    },
  ];
  
  const normalizeText = (text) =>
  text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " "); // Giữ lại khoảng trắng giữa từ, nhưng loại bỏ thừa
  return (
    <div style={{ padding: 20 }}>
      <Space style={{ marginBottom: 20 }}>
        <Input style={{ width: 300 }}
          placeholder="Nhập tên page"
          value={pageName}
          onChange={(e) => setPageName(e.target.value)}
        />
        <Select showSearch
          placeholder="Chọn nhân viên"
          value={selectedEmployee}
          onChange={setSelectedEmployee}
          style={{ width: 300 }}
        >
          {mktOptions.map((emp) => (
            <Option key={emp} value={emp}>{emp}</Option>
          ))}
        </Select>
        <Button style={{ width: 200 }} type="primary" onClick={isEditing ? handleSaveEdit : handleAdd}>
          {isEditing ? "Lưu" : "Thêm"}
        </Button>
        
      </Space><br></br>
      <Input.Search
  style={{ width: 300 }}
  placeholder="Tìm kiếm tên page / tên nhân viên"
  value={searchText}
  allowClear
  onClear={() => {
    setSearchText("");
    setAppliedSearchText("");
    // Hiển thị lại danh sách đầy đủ khi nhấn X
  }}
  onChange={(e) => setSearchText(e.target.value)}
  onSearch={() => setAppliedSearchText(searchText)}
  onPressEnter={() => setAppliedSearchText(searchText)}
   />
 <DatePicker.RangePicker
    onChange={(dates) => setDateRange(dates)}
    style={{ width: 300 }}
    format="DD/MM/YYYY"
  />
  <Select
  style={{ width: 300 }}
  placeholder="Chọn team"
  value={selectedTeam}
  allowClear
  onClear={() => setSelectedTeam(null)}
  onChange={(value) => setSelectedTeam(value)}
>
  <Option value="SON">TEAM SƠN</Option>
  <Option value="QUAN">TEAM QUÂN</Option>
  {/* <Option value="CHI">TEAM CHI</Option> */}
  <Option value="PHONG">TEAM PHONG</Option>
  <Option value="TUANANH">TEAM TUẤN ANH</Option>
  <Option value="DIEN">TEAM DIỆN</Option>
  <Option value="LE">TEAM LẺ</Option>
  <Option value="DIEU">TEAM DIỆU</Option>
</Select>
<br></br>
{currentUser.name==='Trần Mỹ Hạnh' && (
<Space style={{ marginTop: 20, flexDirection: 'column' }}>
  <h3>Trần Mỹ Hạnh search đi cho nhanh !</h3>
  <Input.TextArea
    rows={3}
    placeholder="Dán danh sách tên page, mỗi dòng 1 tên"
    style={{ width: 400 }}
    value={pageListInput}
    onChange={(e) => setPageListInput(e.target.value)}
  />
  <Button
    type="primary"
    style={{ marginTop: 10, width: 200 }}
    onClick={() => {
      const searchPages = pageListInput
        .split(/\r?\n/)                         // tách từng dòng
        .map(name => normalizeText(name))       // chuẩn hóa từng dòng
        .filter(name => name);                  // loại bỏ dòng trống

      const matchedPages = data.filter(record =>
        searchPages.includes(normalizeText(record.pageName))
      );

      setFilteredPages(matchedPages);

      // Gợi ý log các tên không tìm thấy (gỡ lỗi)
      const notFound = searchPages.filter(p =>
        !data.find(d => normalizeText(d.pageName) === p)
      );
      if (notFound.length > 0) {
        console.log("❌ Không tìm thấy các page sau:", notFound);
      }
    }}
  >
    Tìm kiếm danh sách page
  </Button>
</Space>)}
{filteredPages.length > 0 && (
  <div style={{ marginTop: 40 }}>
    <h3>Kết quả tìm kiếm:</h3>
    <Table
      dataSource={filteredPages.map((item, index) => ({
        key: index,
        pageName: item.pageName,
        employee: item.employee
      }))}
      columns={[
        { title: "Tên Page", dataIndex: "pageName", key: "pageName" },
        { title: "Tên Nhân Viên", dataIndex: "employee", key: "employee" }
      ]}
      pagination={false}
    />
  </div>
)}


<h2>List Page</h2>
      <Table
        columns={columns}
        dataSource={filteredData .sort((a, b) => (a.employee?.localeCompare(b.employee) || 0))}
        pagination={{ pageSize: 10 }}

      />
    </div>  
  );
};

export default EmployeePageTable;
