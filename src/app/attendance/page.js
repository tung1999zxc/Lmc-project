'use client';
import React, { useState, useEffect } from 'react';
import { Table, Button, Checkbox, Input, Card, Radio, message } from 'antd';
import axios from 'axios';
import { useSelector } from "react-redux";

// Hàm định dạng ngày theo dạng YYYY-MM-DD theo múi giờ địa phương
const formatLocalDate = (date) => {
  const year = date.getFullYear();
  const month = ('0' + (date.getMonth() + 1)).slice(-2);
  const day = ('0' + date.getDate()).slice(-2);
  return `${year}-${month}-${day}`;
};

// Hàm tính tất cả các ngày trong tháng (đầu vào: year, month (1-12))
const getDaysInMonth = (year, month) => {
  const days = [];
  const daysInMonth = new Date(year, month, 0).getDate(); // Số ngày trong tháng
  for (let day = 1; day <= daysInMonth; day++) {
    // Định dạng YYYY-MM-DD theo múi giờ địa phương
    const dayStr = `${year}-${('0' + month).slice(-2)}-${('0' + day).slice(-2)}`;
    days.push(dayStr);
  }
  return days;
};

export default function AttendanceManagement() {
  const [employees2, setEmployees] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('this'); // options: 'this', 'prev', 'prev2'
  const [loading, setLoading] = useState(false);
  // State để lưu trữ giá trị tạm của input (cho cột "Nghỉ" và "Lý do")
  const [cellInputs, setCellInputs] = useState({});
  const currentUser = useSelector((state) => state.user.currentUser);
  // Lọc danh sách nhân viên theo team "sale"
  const employees = employees2.filter((emp) => emp.position_team === "sale");

  // Kiểm tra quyền: nếu là leadSALE hoặc managerSALE thì có quyền chỉnh sửa tất cả
  const isPrivileged = currentUser.position === "leadSALE" || currentUser.position === "managerSALE";

  // Sắp xếp nhân viên sao cho cột của currentUser được đưa lên đầu tiên (nếu có)
  const sortedEmployees = [...employees].sort((a, b) => {
    if (currentUser.name === a.name) return -1;
    if (currentUser.name === b.name) return 1;
    return a.name.localeCompare(b.name);
  });

  // Tính tháng dựa vào bộ lọc
  const getYearMonth = () => {
    const now = new Date();
    let year = now.getFullYear();
    let month = now.getMonth() + 1; // 1-12
    if (selectedMonth === 'prev') {
      month = month - 1;
      if (month < 1) {
        month = 12;
        year = year - 1;
      }
    } else if (selectedMonth === 'prev2') {
      month = month - 2;
      if (month < 1) {
        month += 12;
        year = year - 1;
      }
    }
    return { year, month };
  };

  // Fetch danh sách nhân viên từ API
  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/employees');
      setEmployees(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách nhân viên:', error);
      message.error('Lỗi khi lấy danh sách nhân viên');
      setLoading(false);
    }
  };

  // Fetch dữ liệu chấm công của tháng đã chọn
  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/attendance');
      setAttendanceData(response.data.data);
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu chấm công:', error);
      message.error('Lỗi khi lấy dữ liệu chấm công');
    } finally {
      setLoading(false);
    }
  };
  
  // Load dữ liệu khi component mount hoặc khi bộ lọc thay đổi
  useEffect(() => {
    fetchEmployees();
    fetchAttendance();
  }, [selectedMonth]);

  // Xây dựng dataSource cho bảng: mỗi dòng là 1 ngày trong tháng, cộng thêm dòng tổng cuối cùng
  const buildTableData = () => {
    const { year, month } = getYearMonth();
    const days = getDaysInMonth(year, month);
    const rows = days.map((day) => {
      const row = { date: day };
      attendanceData.forEach((rec) => {
        // Sử dụng định dạng ngày theo local để so sánh
        const recDay = formatLocalDate(new Date(rec.date));
        if (recDay === day) {
          row[rec.employeeId] = rec;
        }
      });
      return row;
    });

    // Tính tổng cột "Nghỉ" cho mỗi nhân viên
    const totalRow = { date: 'Tổng nghỉ' };
    sortedEmployees.forEach(emp => {
      let total = 0;
      rows.forEach(row => {
        const rec = row[emp.employee_id];
        if (rec && rec.absence) {
          const val = parseFloat(rec.absence);
          if (!isNaN(val)) total += val;
        }
      });
      totalRow[emp.employee_id] = { absence: total };
    });
    rows.push(totalRow);
    return rows;
  };

  // Hàm cập nhật dữ liệu qua API cho từng ô trong bảng
  const handleUpdate = async (date, employeeId, field, value) => {
    setLoading(true);
    try {
      await axios.post('/api/attendance', { date, employeeId, type: field, value });
      message.success('Cập nhật thành công');
      fetchAttendance();
      setLoading(false);
    } catch (error) {
      console.error('Lỗi cập nhật:', error);
      message.error('Lỗi cập nhật');
      setLoading(false);
    }
  };

  // Xử lý cho checkbox "Giờ vào" và "Giờ ra"
  const handleCheckboxChange = (e, date, employeeId, field) => {
    if (e.target.checked) {
      // Khi tích, lấy thời gian hiện tại (định dạng HH:mm:ss)
      const time = new Date().toLocaleTimeString();
      handleUpdate(date, employeeId, field, time);
    } else {
      // Nếu người dùng bỏ tích (uncheck)
      if (isPrivileged) {
        // Với privileged, cho phép bỏ tích => cập nhật giá trị rỗng
        handleUpdate(date, employeeId, field, '');
      }
      // Với non-privileged, checkbox sẽ bị disable nên trường hợp này không xảy ra.
    }
  };

  // Xử lý lưu cho input "Nghỉ" và "Lý do"
  const handleInputSave = (date, employeeId, field) => {
    const key = `${date}-${employeeId}-${field}`;
    const value = cellInputs[key];
    if (value !== undefined) {
      handleUpdate(date, employeeId, field, value);
    }
  };

  // Render mỗi ô trong bảng, nhận thêm biến editable xác định có cho chỉnh sửa hay không
  const renderCell = (record, employeeId, field, editable) => {
    const cellData = record[employeeId] || {};
  
    if (field === 'timeIn' || field === 'timeOut') {
      // Nếu là privileged, không disable bất kỳ trường hợp nào
      if (isPrivileged) {
        return (
          <div>
            <Checkbox
              checked={!!cellData[field]}
              disabled={false}
              onChange={(e) => handleCheckboxChange(e, record.date, employeeId, field)}
            />
            {cellData[field] && (
              <div style={{ fontSize: '0.8em', marginTop: 4 }}>{cellData[field]}</div>
            )}
          </div>
        );
      }
  
      // Với non-privileged
      const today = formatLocalDate(new Date());
      let disableCheckbox = false;
      if (!editable) {
        disableCheckbox = true;
      } else if (record.date !== today) {
        disableCheckbox = true;
      } else if (cellData[field]) {
        // Nếu đã được tích rồi thì không cho phép bỏ tích
        disableCheckbox = true;
      }
      return (
        <div>
          <Checkbox
            checked={!!cellData[field]}
            disabled={disableCheckbox}
            onChange={(e) => handleCheckboxChange(e, record.date, employeeId, field)}
          />
          {cellData[field] && (
            <div style={{ fontSize: '0.8em', marginTop: 4 }}>{cellData[field]}</div>
          )}
        </div>
      );
    } else if (field === 'absence' || field === 'reason') {
      const key = `${record.date}-${employeeId}-${field}`;
      if (record.date === 'Tổng nghỉ' && field === 'absence') {
        return <div>{cellData.absence !== undefined ? cellData.absence : 0}</div>;
      }
      return (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Input
            placeholder={field === 'absence' ? 'Số giờ nghỉ' : 'Nhập lý do'}
            defaultValue={cellData[field]}
            disabled={!editable}
            onChange={(e) => setCellInputs({ ...cellInputs, [key]: e.target.value })}
            style={{ marginRight: 8 }}
          />
          <Button size="small" disabled={!editable} onClick={() => handleInputSave(record.date, employeeId, field)}>
            Lưu
          </Button>
        </div>
      );
    }
    return null;
  };
  

  // Xây dựng các cột cho bảng dựa trên danh sách nhân viên đã sắp xếp
  const columns = [
    {
      title: 'Ngày',
      dataIndex: 'date',
      key: 'date',
      width: 120,
    },
    ...sortedEmployees.map((emp) => {
      const editable = isPrivileged || (currentUser.name === emp.name);
      return {
        title: emp.name,
        key: `employee-${emp.employee_id}`,
        children: [
          {
            title: 'Giờ vào',
            key: `timeIn-${emp.employee_id}`,
            render: (record) => renderCell(record, emp.employee_id, 'timeIn', editable),
            width: 100,
          },
          {
            title: 'Giờ ra',
            key: `timeOut-${emp.employee_id}`,
            render: (record) => renderCell(record, emp.employee_id, 'timeOut', editable),
            width: 100,
          },
          {
            title: 'Nghỉ',
            key: `absence-${emp.employee_id}`,
            render: (record) => renderCell(record, emp.employee_id, 'absence', editable),
            width: 120,
          },
          {
            title: 'Lý do',
            key: `reason-${emp.employee_id}`,
            render: (record) => renderCell(record, emp.employee_id, 'reason', editable),
            width: 300,
          },
        ],
      };
    }),
  ];

  // Xử lý bộ lọc: Tháng này, Tháng trước, 2 tháng trước
  const handleFilterChange = (e) => {
    setSelectedMonth(e.target.value);
  };

  // Lấy ngày hiện tại theo local để so sánh với record.date
  const today = formatLocalDate(new Date());

  return (
    <div style={{ padding: 24 }}>
      <Card title="Bảng chấm công nhân viên">
        <div style={{ marginBottom: 16 }}>
          <Radio.Group onChange={handleFilterChange} value={selectedMonth}>
            <Radio.Button value="this">Tháng này</Radio.Button>
            <Radio.Button value="prev">Tháng trước</Radio.Button>
            <Radio.Button value="prev2">2 tháng trước</Radio.Button>
          </Radio.Group>
        </div>
        <Table
        sticky
          bordered
          loading={loading}
          dataSource={buildTableData()}
          columns={columns}
          rowKey="date"
          scroll={{ x: 'max-content' }}
          pagination={{ pageSize: 35 }}
          rowClassName={(record) => record.date === today ? 'today-row' : ''}
        />
      </Card>
      {/* CSS inline để tô màu nền cho dòng hôm nay */}
      <style jsx>{`
        .today-row {
          background-color:rgb(42, 165, 221);
        }
      `}</style>
    </div>
  );
}
