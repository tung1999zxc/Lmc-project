// src/components/NotificationManagement.js
"use client";
import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  Select,
  Button,
  Table,
  Modal,
  Tooltip,
  message,
} from "antd";
import axios from "axios";
import { useSelector } from "react-redux";
import { 
  BellOutlined, 
  SendOutlined, 
  TeamOutlined, 
  CheckCircleOutlined, 
  UserOutlined, 
  ExpandAltOutlined,
  CalendarOutlined,
  PlusCircleOutlined,
  CloseCircleOutlined
} from "@ant-design/icons";

const { Option } = Select;

const NotificationManagement = () => {
  const currentUser = useSelector((state) => state.user.currentUser);
  const [form] = Form.useForm();
  const [employees, setEmployees] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});
  const [confirmExpanded, setConfirmExpanded] = useState({});
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchEmployees();
    fetchNotifications();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get("/api/employees");
      setEmployees(response.data.data);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách nhân viên", error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await axios.get("/api/notifications");
      setNotifications(response.data.data);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách thông báo", error);
    }
  };

  const departmentOptions = [
    { value: "all", label: "TẤT CẢ" },
    { value: "mkt", label: "MKT" },
    { value: "sale", label: "SALE" },
    { value: "salechat", label: "SALE CHAT" },
    { value: "vandon", label: "VẬN ĐƠN" },
    { value: "PHI", label: "TEAM PHI" },
    { value: "DIEU", label: "TEAM DIỆU" },
    { value: "SON", label: "TEAM SƠN" },
    { value: "QUAN", label: "TEAM QUÂN" },
    { value: "PHONG", label: "TEAM LẺ" },
    { value: "TUANANH", label: "TEAM TUẤN ANH" },
    { value: "DIEN", label: "TEAM DIỆN" },
  ];

  const filteredEmployees = employees.filter(
    (emp) => emp.username.toLowerCase() !== "admin"
  );

  const recipientOptions = filteredEmployees.map((emp) => ({
    value: emp.name,
    label: emp.name,
  }));

  const handleFormSubmit = async (values) => {
    if (
      !values.department &&
      (!values.recipients || values.recipients.length === 0)
    ) {
      message.error(
        "Vui lòng chọn ít nhất một đối tượng thông báo hoặc bộ phận thông báo."
      );
      return;
    }
    let recipients = [];
    if (values.department) {
      let deptRecipients = [];

      switch (values.department) {
        case "all":
          deptRecipients = employees.map((emp) => emp.name);
          break;
        case "salechat":
          deptRecipients = employees
            .filter((emp) => emp.position === "salenhapdon"||emp.position === "salefull")
            .map((emp) => emp.name);
          break;
        case "vandon":
          deptRecipients = employees
            .filter((emp) => emp.position === "salexuly")
            .map((emp) => emp.name);
          break;
        case "PHI":
        case "DIEU":
        case "SON":
        case "QUAN":
        case "PHONG":
        case "TUANANH":
        case "DIEN":
          deptRecipients = employees
            .filter((emp) => emp.team_id === values.department)
            .map((emp) => emp.name);
          break;
        default:
          deptRecipients = employees
            .filter(
              (emp) =>
                emp.position_team &&
                emp.position_team.toLowerCase() ===
                  values.department.toLowerCase()
            )
            .map((emp) => emp.name);
          break;
      }

      recipients = recipients.concat(deptRecipients);
    }
    if (values.recipients) {
      recipients = recipients.concat(values.recipients);
    }
    recipients = [...new Set(recipients)];

    try {
      const payload = {
        message: values.message,
        author: currentUser.name,
        department: values.department || null,
        recipients: recipients,
        type: values.type || "normal",
        createdAt: new Date(),
        confirmed: [],
      };
      await axios.post("/api/notifications", payload);
      message.success("Thông báo đã được tạo");
      form.resetFields();
      fetchNotifications();
      setShowForm(false);
    } catch (error) {
      console.error("Lỗi khi tạo thông báo", error);
      message.error("Lỗi khi tạo thông báo");
    }
  };

  const handleConfirmClick = (notification) => {
    setSelectedNotification(notification);
    setConfirmModalVisible(true);
  };

  const handleConfirmNotification = async () => {
    try {
      await axios.patch(
        `/api/notifications/${selectedNotification._id}/confirm`,
        { user: currentUser.name }
      );
      message.success("Bạn đã xác nhận thông báo");
      setConfirmModalVisible(false);
      setSelectedNotification(null);
      fetchNotifications();
    } catch (error) {
      console.error("Lỗi khi xác nhận thông báo", error);
      message.error("Lỗi khi xác nhận thông báo");
    }
  };

  const toggleExpand = (id) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleConfirmExpand = (id) => {
    setConfirmExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const allowedPositions = ["leadSALE", "admin", "managerSALE"];
  const filteredNotifications = allowedPositions.includes(currentUser.position)
    ? notifications
    : notifications.filter(
        (notif) =>
          notif.author === currentUser.name ||
          (notif.recipients && notif.recipients.includes(currentUser.name))
      );

  const columns = [
    {
      title: "Thời gian",
      dataIndex: "createdAt",
      width: 110,
      key: "createdAt",
      render: (value) => (
        <div className="notif-table-date">
          <CalendarOutlined />
          {new Date(value).toLocaleDateString("vi-VN")}
        </div>
      ),
    },
    {
      title: "Thông điệp",
      dataIndex: "message",
      key: "message",
      render: (text) => (
        <Tooltip title={text}>
          <span className="notif-table-message">{text}</span>
        </Tooltip>
      ),
    },
    {
      title: "Người viết",
      dataIndex: "author",
      key: "author",
      width: 130,
      render: (text) => (
        <div className="notif-table-author">
          <UserOutlined /> {text}
        </div>
      ),
    },
    {
      title: "Bộ phận",
      dataIndex: "department",
      key: "department",
      width: 100,
      render: (dep) => (
        <span className="notif-table-dept">
          {dep ? dep.toUpperCase() : "—"}
        </span>
      ),
    },
    {
      title: "Đối tượng",
      dataIndex: "recipients",
      key: "recipients",
      width: 280,
      render: (recipients, record) => {
        const isExpanded = expandedRows[record._id];
        const displayText = `SL: ${recipients.length} - (${recipients.join(", ")})`;
        const isLong = recipients.length > 3;
        
        return (
          <div className="notif-table-list-cell">
            <div className={`notif-list-text ${!isExpanded && isLong ? 'notif-truncate-2' : ''}`}>
              <TeamOutlined /> {displayText}
            </div>
            {isLong && (
              <button 
                className="notif-expand-btn"
                onClick={() => toggleExpand(record._id)}
              >
                <ExpandAltOutlined /> {isExpanded ? 'Thu gọn' : `Xem thêm (${recipients.length})`}
              </button>
            )}
          </div>
        );
      },
    },
    {
      title: "Đã xác nhận",
      dataIndex: "confirmed",
      key: "confirmed",
      width: 280,
      render: (confirmed, record) => {
        const isExpanded = confirmExpanded[record._id];
        const notConfirmed = record.recipients.filter(
          (name) => !confirmed.includes(name)
        );
        const displayText = confirmed.length > 0 
          ? `SL: ${confirmed.length} - (${confirmed.join(", ")})`
          : "Chưa có ai xác nhận";
        const isLong = confirmed.length > 3;
        
        return (
          <div className="notif-table-list-cell">
            <div className={`notif-list-text ${!isExpanded && isLong ? 'notif-truncate-2' : ''}`}>
              <CheckCircleOutlined style={{ color: confirmed.length > 0 ? '#52c41a' : '#999' }} /> {displayText}
            </div>
            {isLong && (
              <button 
                className="notif-expand-btn"
                onClick={() => toggleConfirmExpand(record._id)}
              >
                <ExpandAltOutlined /> {isExpanded ? 'Thu gọn' : `Xem thêm (${confirmed.length})`}
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="notif-mgmt-container">
      {/* Header */}
      <div className="notif-mgmt-header">
        <div className="notif-mgmt-header-left">
          <BellOutlined className="notif-header-icon" />
          <h1>Quản Lý Thông Báo</h1>
        </div>
        <div className="notif-mgmt-header-actions">
          <div className="notif-mgmt-header-stats">
            <div className="notif-stat-card">
              <div className="notif-stat-value">{filteredNotifications.length}</div>
              <div className="notif-stat-label">Tổng thông báo</div>
            </div>
          </div>
          <button 
            className="notif-create-btn"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? (
              <>
                <CloseCircleOutlined /> Đóng
              </>
            ) : (
              <>
                <PlusCircleOutlined /> Tạo thông báo mới
              </>
            )}
          </button>
        </div>
      </div>

      <div className="notif-mgmt-content">
        {/* Form Section - Collapsible */}
        {showForm && (
          <div className="notif-mgmt-form-section">
            <div className="notif-section-header">
              <SendOutlined />
              <h2>Tạo thông báo mới</h2>
            </div>
            
            <Form
              form={form}
              layout="vertical"
              onFinish={handleFormSubmit}
              initialValues={{ author: currentUser.name }}
            >
              <div className="notif-form-item">
                <label>Thông điệp</label>
                <Form.Item
                  name="message"
                  rules={[{ required: true, message: "Vui lòng nhập thông điệp" }]}
                >
                  <Input.TextArea rows={3} placeholder="Nhập nội dung thông báo..." />
                </Form.Item>
              </div>

              <div className="notif-form-row">
                <div className="notif-form-item">
                  <label>Người viết</label>
                  <Form.Item name="author">
                    <Input disabled prefix={<UserOutlined />} />
                  </Form.Item>
                </div>

                <div className="notif-form-item">
                  <label>Bộ phận thông báo</label>
                  <Form.Item name="department">
                    <Select
                      allowClear
                      placeholder="Chọn bộ phận (tùy chọn)"
                      options={departmentOptions}
                    />
                  </Form.Item>
                </div>

                <div className="notif-form-item">
                  <label>Đối tượng thông báo</label>
                  <Form.Item name="recipients">
                    <Select
                      allowClear
                      mode="multiple"
                      placeholder="Chọn đối tượng (tùy chọn)"
                      options={recipientOptions}
                    />
                  </Form.Item>
                </div>

                {currentUser.name === "Tung99" && (
                  <div className="notif-form-item">
                    <label>Loại thông báo</label>
                    <Form.Item name="type">
                      <Select placeholder="Chọn loại">
                        <Option value="normal">Thông báo thường</Option>
                        <Option value="reset">Reset trang</Option>
                      </Select>
                    </Form.Item>
                  </div>
                )}
              </div>

              <button 
                className="notif-submit-btn"
                type="submit"
              >
                <SendOutlined /> Gửi thông báo
              </button>
            </Form>
          </div>
        )}

        {/* Table Section */}
        <div className="notif-mgmt-table-section">
          <div className="notif-section-header">
            <BellOutlined />
            <h2>Danh sách thông báo ({filteredNotifications.length})</h2>
          </div>
          
          <div className="notif-table-container">
            <Table
              dataSource={filteredNotifications}
              columns={columns}
              rowKey="_id"
              pagination={{ 
                pageSize: 10,
                showSizeChanger: true,
                pageSizeOptions: ['10', '20', '50'],
                showTotal: (total, range) => (
                  <span style={{ color: "var(--sub)", fontWeight: 600 }}>
                    {range[0]}-{range[1]} / {total} thông báo
                  </span>
                )
              }}
              scroll={{ x: 1200 }}
            />
          </div>
        </div>
      </div>

      {/* Confirm Modal */}
      <Modal
        title={
          <div className="notif-modal-title">
            <CheckCircleOutlined style={{ color: '#52c41a' }} />
            <span>Xác nhận thông báo</span>
          </div>
        }
        open={confirmModalVisible}
        onOk={handleConfirmNotification}
        onCancel={() => setConfirmModalVisible(false)}
        okText="Xác nhận"
        cancelText="Hủy"
        className="notif-confirm-modal"
      >
        {selectedNotification && (
          <div className="notif-confirm-content">
            <div className="notif-confirm-message">
              <strong>Thông điệp:</strong>
              <p>{selectedNotification.message}</p>
            </div>
            <div className="notif-confirm-info">
              <div>
                <strong>Người viết:</strong> {selectedNotification.author}
              </div>
              <div>
                <strong>Đã xác nhận:</strong>{" "}
                {selectedNotification.confirmed.length > 0
                  ? selectedNotification.confirmed.join(", ")
                  : "Chưa có ai xác nhận"}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default NotificationManagement;
