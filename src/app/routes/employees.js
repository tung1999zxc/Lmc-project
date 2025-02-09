// routes/employees.js

// Sửa nhân viên

// routes/employees.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');

// Tạo nhân viên mới
router.post('/', async (req, res) => {
  try {
    const { username, password, name, position, team_id } = req.body;
    
    // Generate random 5-digit code
    const employee_code = Math.floor(10000 + Math.random() * 90000).toString();
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
      'INSERT INTO Employees (username, password, name, position, team_id, employee_code) VALUES (?, ?, ?, ?, ?, ?)',
      [username, hashedPassword, name, position, team_id, employee_code]
    );

    res.status(201).json({ message: 'Employee created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Lấy danh sách nhân viên
router.get('/', async (req, res) => {
  try {
    const [employees] = await db.query(`
      SELECT 
        e.employee_id,
        e.employee_code,
        e.username,
        e.name,
        e.position,
        t.name AS team_name
      FROM Employees e
      LEFT JOIN Teams t ON e.team_id = t.team_id
    `);
    
    res.json(employees);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { username, password, name, position, team_id } = req.body;
      
      const updateData = { username, name, position, team_id };
      
      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      }
  
      await db.query(
        'UPDATE Employees SET ? WHERE employee_id = ?',
        [updateData, id]
      );
  
      res.json({ message: 'Cập nhật thành công' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
  // Xóa nhân viên
  router.delete('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await db.query('DELETE FROM Employees WHERE employee_id = ?', [id]);
      res.json({ message: 'Xóa nhân viên thành công' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });