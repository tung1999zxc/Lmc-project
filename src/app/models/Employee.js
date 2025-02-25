// models/Employee.js
import mongoose from 'mongoose';

const EmployeeSchema = new mongoose.Schema(
  {
    employee_id: { type: Number, required: true, unique: true },
    employee_code: { type: Number, required: true },
    username: { type: String, required: true },
    password: { type: String, required: true }, // Có thể lưu dưới dạng hash nếu cần
    name: { type: String, required: true },
    position: { type: String, required: true },
    team_id: { type: String },         // Có thể không bắt buộc
    position_team: { type: String, required: true },
    position_team2: { type: String }     // Có thể không bắt buộc
  },
  { timestamps: true }
);

export default mongoose.models.Employee || mongoose.model('Employee', EmployeeSchema);
