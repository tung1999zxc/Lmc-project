// store/store.js
import { configureStore } from '@reduxjs/toolkit';
import counterReducer from './counterSlice';
import employeeReducer from './employeeSlice';
import userReducer from './userSlice';
import dataReducer from './dataSlice';

export const store = configureStore({
  reducer: {
    counter: counterReducer, // Kết hợp reducer vào store
   // Kết hợp reducer vào store
    employees: employeeReducer,
    user: userReducer, 
    data: dataReducer, 
  },
}); 