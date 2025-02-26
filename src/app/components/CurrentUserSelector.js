// components/CurrentUserSelector.js
'use client'

import React from 'react';
import { Select } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { setCurrentUser } from '../store/userSlice';
import { useState,useEffect } from "react";
import axios from "axios";

const { Option } = Select;

const CurrentUserSelector = () => {
  const [employees, setEmployees] = useState([]);
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
useEffect(() => {
    
   fetchEmployees();
  }, []);
  const dispatch = useDispatch();
  // Lấy danh sách nhân viên từ store (giả sử slice employee lưu vào state.employees.employees)

  
  // Hàm xử lý khi chọn nhân viên trong Select
  const handleChange = (selectedEmployeeCode) => {
    // Tìm nhân viên theo employee_code (có thể dùng employee_code hoặc một key khác phù hợp)
    const selectedEmployee = employees.find(
      (emp) => emp.employee_code === selectedEmployeeCode
    );
    if (selectedEmployee) {
      // Cập nhật thông tin người dùng hiện tại vào store
      dispatch(setCurrentUser({
        username: selectedEmployee.username,
        employee_code: selectedEmployee.employee_code,
        name: selectedEmployee.name,
        position: selectedEmployee.position,
        team_id: selectedEmployee.team_id,
        position_team: selectedEmployee.position_team,
      }));
    }
  };

  return (
    <div>
      <Select
        placeholder="Chọn nhân viên"
        style={{ width: 500 }}
        onChange={handleChange}
        optionFilterProp="children"
      >
        {employees.map((emp) => (
          // Mỗi Option hiển thị tên và vị trí của nhân viên
          <Option key={emp.employee_code} value={emp.employee_code}>
            Tên nv: {emp.name} ---Chức vụ: {emp.position}--- Team: {emp.team_id} 
          </Option>
        ))}
      </Select>
    </div>
  );
};

export default CurrentUserSelector;
