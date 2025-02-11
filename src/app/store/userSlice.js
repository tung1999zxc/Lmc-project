// store/userSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentUser: {
    username: '',
    employee_code:  0,
    name: '',
    positions: '',
    team_id: '',
    position_team: ''
  }
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    // Action này sẽ nhận payload là thông tin của 1 nhân viên
    setCurrentUser(state, action) {
      state.currentUser = action.payload;
    }
  },
});

export const { setCurrentUser } = userSlice.actions;
export default userSlice.reducer;
