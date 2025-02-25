'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Home() {
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [users, setUsers] = useState([]);
  const [editing, setEditing] = useState(false);
  const [editingUsername, setEditingUsername] = useState('');

  // Hàm lấy danh sách người dùng từ API GET /api/register
  async function fetchUsers() {
    try {
      const res = await axios.get('/api/register');
      // Giả sử API trả về { message: '...', data: [...] }
      setUsers(res.data.data);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách người dùng:', error);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  // Xử lý đăng ký hoặc cập nhật khi submit form
  async function handleSubmit(e) {
    e.preventDefault();

    if (editing) {
      // Cập nhật người dùng: API PUT /api/register/[username]
      try {
        const res = await axios.put(`/api/register/${editingUsername}`, {
          username,
          password,
          name,
        });
        setMessage(res.data.message);
        // Reset trạng thái cập nhật
        setEditing(false);
        setEditingUsername('');
        setUsername('');
        setPassword('');
        setName('');
        fetchUsers();
      } catch (error) {
        console.error(error.response?.data?.error || error.message);
        setMessage(error.response?.data?.error || 'Lỗi khi cập nhật người dùng');
      }
    } else {
      // Đăng ký người dùng mới: API POST /api/register
      try {
        const res = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password, name }),
        });
        const data = await res.json();
        if (res.ok) {
          setMessage(data.message);
        } else {
          setMessage(data.error || 'Có lỗi xảy ra');
        }
        setUsername('');
        setPassword('');
        setName('');
        fetchUsers();
      } catch (error) {
        console.error(error);
        setMessage('Lỗi kết nối tới server');
      }
    }
  }

  // Khi nhấn nút "Sửa", chuyển form sang chế độ cập nhật và điền dữ liệu hiện có
  function handleEdit(user) {
    setEditing(true);
    setEditingUsername(user.username);
    setUsername(user.username);
    setName(user.name);
    // Để trống trường mật khẩu nếu không muốn cập nhật
    setPassword('');
  }

  // Xử lý xóa người dùng
  async function handleDelete(userUsername) {
    try {
      const res = await axios.delete(`/api/register/${userUsername}`);
      setMessage(res.data.message);
      fetchUsers();
    } catch (error) {
      console.error(error.response?.data?.error || error.message);
      setMessage(error.response?.data?.error || 'Lỗi khi xóa người dùng');
    }
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>{editing ? 'Cập nhật người dùng' : 'Đăng ký người dùng'}</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ padding: '0.5rem', margin: '0.5rem 0' }}
            disabled={editing} // Không cho sửa username khi cập nhật
          />
        </div>
        <div>
          <input
            placeholder="Họ tên"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ padding: '0.5rem', margin: '0.5rem 0' }}
          />
        </div>
        <div>
          <input
            placeholder={editing ? 'Nhập mật khẩu mới (nếu muốn)' : 'Password'}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ padding: '0.5rem', margin: '0.5rem 0' }}
          />
        </div>
        <button type="submit" style={{ padding: '0.5rem 1rem' }}>
          {editing ? 'Cập nhật' : 'Đăng ký'}
        </button>
      </form>
      {message && <p>{message}</p>}

      <hr />

      <h2>Danh sách người dùng</h2>
      {users.length === 0 ? (
        <p>Chưa có người dùng nào</p>
      ) : (
        <ul>
          {users.map((user) => (
            <li key={user.username}>
              <strong>{user.username}</strong> - {user.name}{' '}
              <button onClick={() => handleEdit(user)} style={{ marginLeft: '1rem' }}>
                Sửa
              </button>
              <button onClick={() => handleDelete(user.username)} style={{ marginLeft: '1rem' }}>
                Xóa
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
