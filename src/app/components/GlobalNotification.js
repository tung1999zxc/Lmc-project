// src/components/GlobalNotification.js
"use client";
import React, { useState, useEffect } from "react";
import { Modal, Button, message } from "antd";
import axios from "axios";
import { useSelector } from "react-redux";
import { CheckCircleOutlined, UserOutlined, TeamOutlined, BellOutlined, ExpandOutlined } from "@ant-design/icons";

const GlobalNotification = () => {
  const currentUser = useSelector((state) => state.user.currentUser);
  const [activeNotification, setActiveNotification] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const fetchActiveNotification = async () => {
    try {
      const response = await axios.get("/api/notifications");
      const notifications = response.data.data;
      const filtered = notifications.filter((notif) => 
        notif.recipients.some(
          (name) => name.trim() === currentUser.name.trim()
        ) &&
        !notif.confirmed.some(
          (name) => name.trim() === currentUser.name.trim()
        )
      );
      if (filtered.length > 0) {
        setActiveNotification(filtered[0]);
        setExpanded(false);
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
      const intervalId = setInterval(fetchActiveNotification, 60000);
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

  const handleResetPage = () => {
    message.info("Trang sẽ được tải lại...");
    window.location.reload();
  };

  const recipients = activeNotification?.recipients || [];
  const confirmed = activeNotification?.confirmed || [];

  return (
    <Modal
      open={!!activeNotification}
      title={
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 10,
          color: '#fff',
          fontSize: 16,
          fontWeight: 700
        }}>
          <BellOutlined style={{ color: '#ffd700', fontSize: 20 }} />
          <span>Thông báo mới</span>
        </div>
      }
      footer={
        activeNotification ? (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            gap: 12 
          }}>
            {activeNotification.type === "reset" ? (
              <Button 
                danger 
                onClick={handleResetPage}
                className="notif-btn notif-btn-danger"
              >
                Reset trang
              </Button>
            ) : (
              <Button 
                type="primary" 
                onClick={handleConfirm}
                className="notif-btn notif-btn-primary"
              >
                <CheckCircleOutlined /> Xác nhận
              </Button>
            )}
          </div>
        ) : null
      }
      closable={true}
      onCancel={() => setActiveNotification(null)}
      centered
      width={520}
      className="notif-modal"
    >
      {activeNotification && (
        <div className="notif-content">
          {/* Message */}
          <div className="notif-message">
            <div className="notif-message-text">
              {activeNotification.message}
            </div>
          </div>

          {/* Info Section */}
          <div className="notif-info-section">
            {/* Author */}
            <div className="notif-info-item">
              <div className="notif-info-label">
                <UserOutlined /> Người thông báo
              </div>
              <div className="notif-info-value">
                {activeNotification.author}
              </div>
            </div>

            {/* Recipients */}
            <div className="notif-info-item">
              <div className="notif-info-label">
                <TeamOutlined /> Đối tượng
              </div>
              <div className={`notif-info-value ${!expanded ? 'notif-truncate' : ''}`}>
                {recipients.length > 0 ? recipients.join(", ") : "Không có"}
              </div>
            </div>

            {/* Expand button for recipients */}
            {!expanded && recipients.length > 5 && (
              <button 
                className="notif-expand-btn"
                onClick={() => setExpanded(true)}
              >
                <ExpandOutlined /> Xem thêm ({recipients.length} người)
              </button>
            )}

            {/* Confirmed */}
            {confirmed.length > 0 && (
              <div className="notif-info-item">
                <div className="notif-info-label">
                  <CheckCircleOutlined style={{ color: '#52c41a' }} /> Đã xác nhận
                </div>
                <div className={`notif-info-value ${!expanded ? 'notif-truncate' : ''}`}>
                  {confirmed.length > 0 ? confirmed.join(", ") : "Chưa có ai xác nhận"}
                </div>
              </div>
            )}

            {/* Collapse button */}
            {expanded && (
              <button 
                className="notif-expand-btn"
                onClick={() => setExpanded(false)}
              >
                <ExpandOutlined style={{ transform: 'rotate(180deg)' }} /> Thu gọn
              </button>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};

export default GlobalNotification;
