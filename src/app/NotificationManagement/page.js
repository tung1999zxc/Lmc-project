// src/components/NotificationManagement.js
"use client";
import React, { useState, useEffect } from "react";
import {
  Form,
  Row,
  Col,
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

const { Option } = Select;

const NotificationManagement = () => {
  const currentUser = useSelector((state) => state.user.currentUser);
  const [form] = Form.useForm();
  const [employees, setEmployees] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);

  // Fetch employees và notifications khi component mount
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

  // Tùy chọn cho bộ phận thông báo: chỉ 2 lựa chọn
  const departmentOptions = [
    // { value: "all", label: "TẤT CẢ" },
    { value: "mkt", label: "MKT" },
    { value: "sale", label: "SALE" },
  ];
  const filteredEmployees = employees.filter(
    (emp) => emp.username.toLowerCase() !== "admin"
  );
  // Tùy chọn cho đối tượng thông báo: hiển thị toàn bộ nhân viên
  const recipientOptions = filteredEmployees.map((emp) => ({
    value: emp.name,
    label: emp.name,
  }));

  // Xử lý lưu thông báo
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
      const deptRecipients = employees
        .filter(
          (emp) =>
            emp.position_team &&
            emp.position_team.toLowerCase() === values.department.toLowerCase()
        )
        .map((emp) => emp.name);
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
        createdAt: new Date(),
        confirmed: [],
      };
      await axios.post("/api/notifications", payload);
      message.success("Thông báo đã được tạo");
      form.resetFields();
      fetchNotifications();
    } catch (error) {
      console.error("Lỗi khi tạo thông báo", error);
      message.error("Lỗi khi tạo thông báo");
    }
  };

  // Popup xác nhận thông báo
  const handleConfirmClick = (notification) => {
    setSelectedNotification(notification);
    setConfirmModalVisible(true);
  };

  const handleConfirmNotification = async () => {
    try {
      await axios.patch(`/api/notifications/${selectedNotification._id}/confirm`, {
        user: currentUser.name,
      });
      message.success("Bạn đã xác nhận thông báo");
      setConfirmModalVisible(false);
      setSelectedNotification(null);
      fetchNotifications();
    } catch (error) {
      console.error("Lỗi khi xác nhận thông báo", error);
      message.error("Lỗi khi xác nhận thông báo");
    }
  };

  // Lọc danh sách thông báo
  const allowedPositions = ["leadSALE", "admin", "managerSALE"];
  const filteredNotifications =
    allowedPositions.includes(currentUser.position)
      ? notifications
      : notifications.filter(
          (notif) =>
            notif.author === currentUser.name ||
            (notif.recipients && notif.recipients.includes(currentUser.name))
        );

  // Định nghĩa các cột cho bảng thông báo
  const columns = [
    {
      title: "Thông điệp",
      dataIndex: "message",
      key: "message",
      render: (text) => (
        <Tooltip title={text}>
          <span
            style={{
              display: "block",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            TEXT
          </span>
        </Tooltip>
      ),
    },
    {
      title: "Người viết",
      dataIndex: "author",
      key: "author",
    },
    {
      title: "Bộ phận",
      dataIndex: "department",
      key: "department",
      render: (dep) => (dep ? dep.toUpperCase() : "N/A"),
    },
    {
      title: "Đối tượng",
      dataIndex: "recipients",
      key: "recipients",
      width: 250,
      render: (recipients) =>
        `SL: ${recipients.length} - (${recipients.join(", ")})`,
    },
    {
      title: "Đã xác nhận",
      dataIndex: "confirmed",
      key: "confirmed",
      width: 250,
      render: (confirmed, record) => {
        const notConfirmed = record.recipients.filter(
          (name) => !confirmed.includes(name)
        );
        const tooltipText =
          notConfirmed.length > 0
            ? "CHƯA XÁC NHẬN: " + notConfirmed.join(", ")
            : "Tất cả đã xác nhận";
        return (
          <Tooltip title={tooltipText}>
            <span>
              SL: {confirmed.length} - ({confirmed.join(", ")})
            </span>
          </Tooltip>
        );
      },
    },
    // {
    //   title: "Hành động",
    //   key: "action",
    //   render: (_, record) => {
    //     if (
    //       record.recipients.includes(currentUser.name) &&
    //       !record.confirmed.includes(currentUser.name)
    //     ) {
    //       return (
    //         <Button type="primary" onClick={() => handleConfirmClick(record)}>
    //           Xác nhận
    //         </Button>
    //       );
    //     }
    //     return null;
    //   },
    // },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFormSubmit}
        initialValues={{ author: currentUser.name }}
      >
        <Form.Item
          label="Thông điệp"
          name="message"
          rules={[{ required: true, message: "Vui lòng nhập thông điệp" }]}
        >
          <Input.TextArea rows={3} />
        </Form.Item>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="Người viết" name="author">
              <Input disabled />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="Bộ phận thông báo (Tùy chọn)"
              name="department"
            >
              <Select allowClear placeholder="Chọn bộ phận thông báo (nếu muốn)">
                {departmentOptions.map((dep) => (
                  <Option key={dep.value} value={dep.value}>
                    {dep.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="Đối tượng thông báo (Tùy chọn)"
              name="recipients"
            >
              <Select allowClear
                mode="multiple"
                placeholder="Chọn đối tượng thông báo (nếu muốn)"
                options={recipientOptions}
              />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            Lưu thông báo
          </Button>
        </Form.Item>
      </Form>

      <h3>Danh sách thông báo</h3>
      <Table dataSource={filteredNotifications} columns={columns} rowKey="_id" />

      <Modal
        title="Xác nhận thông báo"
        visible={confirmModalVisible}
        onOk={handleConfirmNotification}
        onCancel={() => setConfirmModalVisible(false)}
      >
        <p>Bạn có chắc chắn xác nhận thông báo này không?</p>
        <p>
          <strong>Thông điệp:</strong>{" "}
          {selectedNotification && selectedNotification.message}
        </p>
        <Tooltip
          title={
            selectedNotification &&
            selectedNotification.confirmed.length > 0 &&
            selectedNotification.confirmed.join(", ")
          }
        >
          <p>
            <strong>Đã xác nhận:</strong>{" "}
            {selectedNotification &&
              (selectedNotification.confirmed.length > 0
                ? selectedNotification.confirmed.join(", ")
                : "Chưa có ai xác nhận")}
          </p>
        </Tooltip>
      </Modal>
    </div>
  );
};

export default NotificationManagement;
