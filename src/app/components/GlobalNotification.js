// src/components/GlobalNotification.js
"use client";
import React, { useState, useEffect } from "react";
import { Modal, Button, message, Card, Typography, Divider } from "antd";
import axios from "axios";
import { useSelector } from "react-redux";

const { Title, Text } = Typography;

const GlobalNotification = () => {
  const currentUser = useSelector((state) => state.user.currentUser);
  const [activeNotification, setActiveNotification] = useState(null);

  const fetchActiveNotification = async () => {
    try {
      const response = await axios.get("/api/notifications");
      const notifications = response.data.data;
      // Lọc ra các thông báo mà currentUser là đối tượng nhận và chưa xác nhận,
      // sử dụng .trim() để so sánh chính xác hơn
      const filtered = notifications.filter((notif) => 
        notif.recipients.some(
          (name) => name.trim() === currentUser.name.trim()
        ) &&
        !notif.confirmed.some(
          (name) => name.trim() === currentUser.name.trim()
        )
      );
      // Nếu có nhiều thông báo, chọn thông báo đầu tiên
      if (filtered.length > 0) {
        setActiveNotification(filtered[0]);
      } else {
        setActiveNotification(null);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  useEffect(() => {
    if (currentUser && currentUser.name) {
      fetchActiveNotification();
      const intervalId = setInterval(fetchActiveNotification, 60000); // mỗi 60 giây
      return () => clearInterval(intervalId);
    }
  }, [currentUser]);

  const handleConfirm = async () => {
    try {
      await axios.patch(
        `/api/notifications/${activeNotification._id}/confirm`,
        { user: currentUser.name }
      );
      message.success("Bạn đã xác nhận thông báo");
      setActiveNotification(null);
    } catch (error) {
      console.error("Error confirming notification:", error);
      message.error("Lỗi khi xác nhận thông báo");
    }
  };

  return (
    <Modal
      visible={!!activeNotification}
      title="Thông báo mới"
      footer={[
        <Button key="confirm" type="primary" onClick={handleConfirm}>
          Xác nhận
        </Button>,
      ]}
      closable={false}
    >
      {activeNotification && (
        <Card
          style={{
            margin: "20px auto",
            maxWidth: "600px",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}
          bodyStyle={{ padding: "20px" }}
        >
          <Text strong style={{ fontSize: "14px" }}>
            Người thông báo:
          </Text>{" "}
          <Text style={{ fontSize: "14px" }}>
            {activeNotification.author}
          </Text>
          <br />
          <Divider style={{ margin: "12px 0" }} />
          <Title level={3} style={{ color: "#1890ff", textAlign: "center" }}>
            {activeNotification.message}
          </Title>
          <Divider style={{ margin: "12px 0" }} />
          <Text strong style={{ fontSize: "14px" }}>
            Người được thông báo:
          </Text>{" "}
          <Text style={{ fontSize: "14px" }}>
            {activeNotification.recipients.length > 0
              ? activeNotification.recipients.join(", ")
              : "Không có"}
          </Text>
        </Card>
      )}
    </Modal>
  );
};

export default GlobalNotification;
