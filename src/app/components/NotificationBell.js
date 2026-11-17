// src/app/components/NotificationBell.js
"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Badge, Popover, Button, Empty, Spin, Tooltip } from "antd";
import axios from "axios";
import { useSelector } from "react-redux";
import {
  BellOutlined,
  CheckCircleOutlined,
  UserOutlined,
  CalendarOutlined,
  ReloadOutlined,
  EyeOutlined,
} from "@ant-design/icons";

const norm = (v) => (v || "").trim().toLowerCase();

// Chỉ tải thông báo của 1 tháng gần nhất để giảm tải
const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;
const getSinceParam = () => new Date(Date.now() - ONE_MONTH_MS).toISOString();

// Giới hạn số thông báo tải về
const FETCH_LIMIT = 200;

// Thông báo liên quan xóa đơn -> dùng "Đánh dấu đã đọc" thay cho "Xác nhận"
const isXoaDonNotification = (notif) =>
  Boolean(notif?.xoaDon) || String(notif?.message || "").startsWith("[XÓA ĐƠN]");

const NotificationBell = () => {
  const currentUser = useSelector((state) => state.user.currentUser);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const userName = currentUser?.name || "";

  const fetchNotifications = useCallback(async () => {
    if (!userName) return;
    try {
      setLoading(true);
      // Chỉ lấy thông báo trong 1 tháng gần nhất
      const response = await axios.get("/api/notifications", {
        params: { since: getSinceParam(), limit: FETCH_LIMIT },
      });
      const all = response.data?.data || [];
      const allowedPositions = ["leadSALE", "admin", "managerSALE"];
      const filtered = allowedPositions.includes(currentUser?.position)
        ? all
        : all.filter(
            (notif) =>
              notif.author === currentUser.name ||
              (notif.recipients &&
                notif.recipients.some((name) => norm(name) === norm(userName)))
          );
      setNotifications(filtered);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách thông báo:", error);
    } finally {
      setLoading(false);
    }
  }, [userName, currentUser?.position, currentUser?.name]);

  useEffect(() => {
    if (!userName) return;
    fetchNotifications();
    const intervalId = setInterval(fetchNotifications, 60000);
    return () => clearInterval(intervalId);
  }, [userName, fetchNotifications]);

  const isConfirmed = (notif) =>
    (notif.confirmed || []).some((name) => norm(name) === norm(userName));

  const isRead = (notif) =>
    (notif.readBy || []).some((name) => norm(name) === norm(userName));

  // Thông báo xóa đơn coi là đã xử lý khi đã đánh dấu đọc (hoặc đã xác nhận)
  const isDone = (notif) =>
    isXoaDonNotification(notif) ? isRead(notif) || isConfirmed(notif) : isConfirmed(notif);

  const unreadCount = notifications.filter((n) => !isDone(n)).length;

  const handleConfirm = async (notif, event) => {
    event?.stopPropagation?.();
    try {
      await axios.patch(`/api/notifications/${notif._id}/confirm`, {
        user: currentUser.name,
      });
      fetchNotifications();
    } catch (error) {
      console.error("Lỗi khi xác nhận thông báo:", error);
    }
  };

  // Đánh dấu đã đọc (dùng cho thông báo liên quan xóa đơn)
  const handleMarkRead = async (notif, event) => {
    event?.stopPropagation?.();
    try {
      await axios.patch(`/api/notifications/${notif._id}/read`, {
        user: currentUser.name,
      });
      fetchNotifications();
    } catch (error) {
      console.error("Lỗi khi đánh dấu đã đọc thông báo:", error);
    }
  };

  const content = (
    <div className="nbell-panel">
      <div className="nbell-head">
        <span>
          <BellOutlined /> Thông báo
        </span>
        <Tooltip title="Tải lại">
          <button className="nbell-refresh" onClick={fetchNotifications}>
            <ReloadOutlined />
          </button>
        </Tooltip>
      </div>
      <div className="nbell-list">
        {loading && notifications.length === 0 ? (
          <div className="nbell-loading">
            <Spin size="small" />
          </div>
        ) : notifications.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Bạn chưa có thông báo nào"
          />
        ) : (
          notifications.map((notif) => {
            const done = isDone(notif);
            const isXoaDon = isXoaDonNotification(notif);
            return (
              <div
                key={notif._id}
                className={`nbell-item ${done ? "nbell-item-read" : ""}`}
              >
                <div className="nbell-item-msg">{notif.message}</div>
                <div className="nbell-item-meta">
                  <span>
                    <UserOutlined /> {notif.author}
                  </span>
                  <span>
                    <CalendarOutlined />{" "}
                    {new Date(notif.createdAt).toLocaleDateString("vi-VN")}
                  </span>
                </div>
                <div className="nbell-item-actions">
                  {done ? (
                    <span className="nbell-item-done">
                      <CheckCircleOutlined style={{ color: "#52c41a" }} />
                      {isXoaDon ? "Đã đọc" : "Đã xác nhận"}
                    </span>
                  ) : isXoaDon ? (
                    <Button
                      size="small"
                      icon={<EyeOutlined />}
                      onClick={(e) => handleMarkRead(notif, e)}
                    >
                      Đánh dấu đã đọc
                    </Button>
                  ) : (
                    <Button
                      size="small"
                      type="primary"
                      onClick={(e) => handleConfirm(notif, e)}
                    >
                      Xác nhận
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <Popover
      content={content}
      trigger="click"
      placement="bottomRight"
      open={open}
      onOpenChange={setOpen}
      overlayClassName="nbell-popover"
    >
      <Badge
        count={unreadCount}
        size="small"
        offset={[-2, 4]}
        overflowCount={99}
      >
        <button className="nbell-btn" aria-label="Thông báo">
          <BellOutlined />
        </button>
      </Badge>
    </Popover>
  );
};

export default NotificationBell;
