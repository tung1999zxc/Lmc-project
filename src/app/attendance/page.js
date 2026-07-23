'use client';
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Table, Button, Checkbox, Input, Card, Radio, message } from 'antd';
import axios from 'axios';
import { useSelector } from "react-redux";

const formatLocalDate = (date) => {
  const year = date.getFullYear();
  const month = ('0' + (date.getMonth() + 1)).slice(-2);
  const day = ('0' + date.getDate()).slice(-2);
  return `${year}-${month}-${day}`;
};

const getDaysInMonth = (year, month) => {
  const days = [];
  const daysInMonth = new Date(year, month, 0).getDate();
  for (let day = 1; day <= daysInMonth; day++) {
    const dayStr = `${year}-${('0' + month).slice(-2)}-${('0' + day).slice(-2)}`;
    days.push(dayStr);
  }
  return days;
};

// Time fields that need checkbox
const TIME_FIELDS = ['timeIn', 'timeOut', 'timeIn2', 'timeOut2', 'timeIn3', 'timeOut3'];

export default function AttendanceManagement() {
  const [employees2, setEmployees] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('this');
  const [loading, setLoading] = useState(false);
  const [cellInputs, setCellInputs] = useState({});
  const [updatingCell, setUpdatingCell] = useState(null);
  const currentUser = useSelector((state) => state.user.currentUser);
  const isMountedRef = useRef(true);
  const pendingFetchRef = useRef(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const isPrivileged = useMemo(() =>
    currentUser.position === "leadSALE" || currentUser.position === "managerSALE" || currentUser.position === "admin",
    [currentUser.position]
  );

  const yearMonth = useMemo(() => {
    const now = new Date();
    let y = now.getFullYear();
    let m = now.getMonth() + 1;
    if (selectedMonth === 'prev') {
      m = m - 1;
      if (m < 1) { m = 12; y = y - 1; }
    } else if (selectedMonth === 'prev2') {
      m = m - 2;
      if (m < 1) { m += 12; y = y - 1; }
    }
    return { year: y, month: m };
  }, [selectedMonth]);

  // Get employees who have attendance records in the selected month
  const employeesWithAttendance = useMemo(() => {
    const monthStart = `${yearMonth.year}-${String(yearMonth.month).padStart(2, '0')}-01`;
    const monthEnd = `${yearMonth.year}-${String(yearMonth.month).padStart(2, '0')}-${getDaysInMonth(yearMonth.year, yearMonth.month).length}`;
    return attendanceData
      .filter(rec => rec.date >= monthStart && rec.date <= monthEnd)
      .map(rec => rec.employeeId);
  }, [attendanceData, yearMonth]);

  // Memoized filtered and sorted employees
  const sortedEmployees = useMemo(() => {
    const employees = employees2.filter((emp) => emp.position_team === "sale");

    // Non-privileged users only see their own column
    if (!isPrivileged) {
      const currentUserEmp = employees.find((emp) => emp.name === currentUser.name);
      return currentUserEmp ? [currentUserEmp] : [];
    }

    // Privileged users only see employees who have attendance records
    const filteredEmployees = employees.filter(emp =>
      employeesWithAttendance.includes(emp.employee_id)
    );

    return [...filteredEmployees].sort((a, b) => {
      if (currentUser.name === a.name) return -1;
      if (currentUser.name === b.name) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [employees2, currentUser.name, isPrivileged, employeesWithAttendance]);

  // Build attendance lookup map for O(1) access - Map<day, Map<employeeId, record>>
  const attendanceMap = useMemo(() => {
    const map = new Map();
    attendanceData.forEach((rec) => {
      const day = formatLocalDate(new Date(rec.date));
      if (!map.has(day)) map.set(day, new Map());
      map.get(day).set(rec.employeeId, rec);
    });
    return map;
  }, [attendanceData]);

  // Memoized table data
  const tableData = useMemo(() => {
    const days = getDaysInMonth(yearMonth.year, yearMonth.month);
    const rows = days.map((day) => {
      const row = { date: day };
      const dayRecords = attendanceMap.get(day);
      if (dayRecords) {
        dayRecords.forEach((rec, empId) => {
          row[empId] = rec;
        });
      }
      return row;
    });

    // Calculate total absences per employee
    const totalRow = { date: 'Tổng nghỉ' };
    sortedEmployees.forEach(emp => {
      let total = 0;
      days.forEach(day => {
        const rec = attendanceMap.get(day)?.get(emp.employee_id);
        if (rec?.absence) {
          const val = parseFloat(rec.absence);
          if (!isNaN(val)) total += val;
        }
      });
      totalRow[emp.employee_id] = { absence: total };
    });
    rows.push(totalRow);
    return rows;
  }, [yearMonth, attendanceMap, sortedEmployees]);

  // Debounced fetch for attendance
  const fetchAttendance = useCallback(async () => {
    try {
      const response = await axios.get('/api/attendance');
      if (isMountedRef.current) {
        setAttendanceData(response.data.data);
      }
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu chấm công:', error);
    }
  }, []);

  const debouncedFetch = useCallback(() => {
    if (pendingFetchRef.current) clearTimeout(pendingFetchRef.current);
    pendingFetchRef.current = setTimeout(fetchAttendance, 300);
  }, [fetchAttendance]);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [empRes, attRes] = await Promise.all([
          axios.get('/api/employees'),
          axios.get('/api/attendance'),
        ]);
        if (isMountedRef.current) {
          setEmployees(empRes.data.data);
          setAttendanceData(attRes.data.data);
        }
      } catch (error) {
        console.error('Lỗi khi lấy dữ liệu:', error);
        message.error('Lỗi khi lấy dữ liệu');
      } finally {
        if (isMountedRef.current) setLoading(false);
      }
    };
    fetchData();
  }, [selectedMonth]);

  // Optimized update handler
  const handleUpdate = useCallback(async (date, employeeId, field, value) => {
    const cellKey = `${date}-${employeeId}-${field}`;
    setUpdatingCell(cellKey);
    try {
      await axios.post('/api/attendance', { date, employeeId, type: field, value });
      debouncedFetch();
    } catch (error) {
      console.error('Lỗi cập nhật:', error);
      message.error('Lỗi cập nhật');
    } finally {
      setUpdatingCell(null);
    }
  }, [debouncedFetch]);

  // Stable callback refs for render
  const callbacksRef = useRef({
    handleCheckboxChange: null,
    handleInputChange: null,
    handleInputSave: null,
  });

  // Memoized column render function factory
  const createRenderCell = useCallback((attendanceMap, isPrivileged, currentUserName, cellInputs, updatingCell) => {
    const today = formatLocalDate(new Date());

    return function renderCell(record, employeeId, field, editable) {
      const dayMap = attendanceMap.get(record.date);
      const cellData = dayMap?.get(employeeId) || {};
      const key = `${record.date}-${employeeId}-${field}`;
      const isUpdating = updatingCell === key;

      if (TIME_FIELDS.includes(field)) {
        if (isPrivileged) {
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Checkbox
                checked={!!cellData[field]}
                disabled={isUpdating}
                onChange={(e) => callbacksRef.current.handleCheckboxChange(e, record.date, employeeId, field)}
              />
              {cellData[field] && <span style={{ fontSize: 11 }}>{cellData[field]}</span>}
            </div>
          );
        }
        const disableCheckbox = !editable || record.date !== today || !!cellData[field];
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Checkbox
              checked={!!cellData[field]}
              disabled={disableCheckbox}
              onChange={(e) => callbacksRef.current.handleCheckboxChange(e, record.date, employeeId, field)}
            />
            {cellData[field] && <span style={{ fontSize: 11 }}>{cellData[field]}</span>}
          </div>
        );
      }

      if (field === 'absence' || field === 'reason') {
        if (record.date === 'Tổng nghỉ' && field === 'absence') {
          return <div>{cellData.absence ?? 0}</div>;
        }
        return (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Input
              placeholder={field === 'absence' ? 'Số giờ nghỉ' : 'Lý do'}
              defaultValue={cellData[field]}
              disabled={!editable || isUpdating}
              onChange={(e) => callbacksRef.current.handleInputChange(key, e.target.value)}
              style={{ marginRight: 8, width: field === 'absence' ? 80 : 150 }}
            />
            <Button
              size="small"
              disabled={!editable || isUpdating}
              loading={isUpdating}
              onClick={() => callbacksRef.current.handleInputSave(record.date, employeeId, field)}
            >
              Lưu
            </Button>
          </div>
        );
      }
      return null;
    };
  }, []);

  // Create stable callbacks
  const handleCheckboxChange = useCallback((e, date, employeeId, field) => {
    if (e.target.checked) {
      const time = new Date().toLocaleTimeString();
      handleUpdate(date, employeeId, field, time);
    } else if (isPrivileged) {
      handleUpdate(date, employeeId, field, '');
    }
  }, [handleUpdate, isPrivileged]);

  const handleInputChange = useCallback((key, value) => {
    setCellInputs(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleInputSave = useCallback((date, employeeId, field) => {
    const key = `${date}-${employeeId}-${field}`;
    const value = cellInputs[key];
    if (value !== undefined) {
      handleUpdate(date, employeeId, field, value);
    }
  }, [handleUpdate, cellInputs]);

  // Keep refs in sync
  useEffect(() => {
    callbacksRef.current = {
      handleCheckboxChange,
      handleInputChange,
      handleInputSave,
    };
  }, [handleCheckboxChange, handleInputChange, handleInputSave]);

  // Create stable render function
  const renderCell = useMemo(() => {
    return createRenderCell(attendanceMap, isPrivileged, currentUser.name, cellInputs, updatingCell);
  }, [createRenderCell, attendanceMap, isPrivileged, currentUser.name, cellInputs, updatingCell]);

  // Memoized columns
  const columns = useMemo(() => {
    const employeeColumns = sortedEmployees.map((emp) => {
      const editable = isPrivileged || (currentUser.name === emp.name);
      const subFields = ['timeIn', 'timeOut', 'timeIn2', 'timeOut2', 'timeIn3', 'timeOut3', 'absence', 'reason'];
      const subTitles = ['Giờ vào', 'Giờ ra', 'Giờ vào 2', 'Giờ ra 2', 'Giờ vào 3', 'Giờ ra 3', 'Nghỉ', 'Lý do'];
      const widths = [100, 100, 100, 100, 100, 100, 120, 200];

      return {
        title: emp.name,
        key: `employee-${emp.employee_id}`,
        children: subFields.map((field, idx) => ({
          title: subTitles[idx],
          key: `${field}-${emp.employee_id}`,
          width: widths[idx],
          render: (record) => renderCell(record, emp.employee_id, field, editable),
        })),
      };
    });
    return [
      { title: 'Ngày', dataIndex: 'date', key: 'date', fixed: 'left', width: 120 },
      ...employeeColumns,
    ];
  }, [sortedEmployees, isPrivileged, currentUser.name, renderCell]);

  const handleFilterChange = useCallback((e) => {
    setSelectedMonth(e.target.value);
  }, []);

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
          dataSource={tableData}
          columns={columns}
          rowKey="date"
          scroll={{ x: 'max-content' }}
          pagination={{ pageSize: 35 }}
          rowClassName={(record) => record.date === today ? 'today-row' : ''}
        />
      </Card>
      <style jsx>{`
        .today-row {
          background-color: rgb(42, 165, 221);
        }
      `}</style>
    </div>
  );
}
