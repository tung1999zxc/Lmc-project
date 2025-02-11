// store/employeeSlice.js
"use client"

import { createSlice } from '@reduxjs/toolkit';

// Hàm để lấy dữ liệu từ localStorage

const loadEmployeesFromLocalStorage = () => {
  const savedEmployees = localStorage.getItem('employees');
  return savedEmployees ? JSON.parse(savedEmployees) : [];
};

const initialState = {
  employees: loadEmployeesFromLocalStorage(),
};

const employeeSlice = createSlice({
  name: 'employees',
  initialState,
  reducers: {
    addEmployee: (state, action) => {
      state.employees.push(action.payload);
      // Lưu vào localStorage
      localStorage.setItem('employees', JSON.stringify(state.employees));
    },
    updateEmployee: (state, action) => {
      const index = state.employees.findIndex(
        (emp) => emp.employee_id === action.payload.employee_id
      );
      if (index !== -1) {
        state.employees[index] = action.payload;
        // Cập nhật localStorage
        localStorage.setItem('employees', JSON.stringify(state.employees));
      }
    },
    deleteEmployee: (state, action) => {
      state.employees = state.employees.filter(
        (emp) => emp.employee_id !== action.payload
      );
      // Cập nhật localStorage
      localStorage.setItem('employees', JSON.stringify(state.employees));
    },
  },
});

export const { addEmployee, updateEmployee, deleteEmployee } = employeeSlice.actions;
export default employeeSlice.reducer;