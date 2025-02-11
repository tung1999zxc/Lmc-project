// store/store.js
import { configureStore } from '@reduxjs/toolkit';
import counterReducer from './counterSlice';
import employeeReducer from './employeeSlice';
import userReducer from './userSlice';

export const store = configureStore({
  reducer: {
    counter: counterReducer, // Kết hợp reducer vào store
   // Kết hợp reducer vào store
    employees: employeeReducer,
    user: userReducer, 
  },
}); 