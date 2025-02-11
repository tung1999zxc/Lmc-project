// store/counterSlice.js
import { createSlice } from '@reduxjs/toolkit';

const counterSlice = createSlice({
  name: 'counter', // Tên slice
  initialState: {
    value: 0, // Giá trị khởi tạo
  },
  reducers: {
    increment: (state) => {
      state.value += 1; // Tăng giá trị lên 1
    },
    decrement: (state) => {
      state.value -= 1; // Giảm giá trị đi 1
    },
    incrementByAmount: (state, action) => {
      state.value += action.payload; // Tăng giá trị theo số truyền vào
    },
  },
});

// Xuất các actions
export const { increment, decrement, incrementByAmount } = counterSlice.actions;

// Xuất reducer
export default counterSlice.reducer;