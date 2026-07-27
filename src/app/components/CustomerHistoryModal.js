"use client";
import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Tag, Checkbox, Space, Popconfirm } from "antd";
import { EditOutlined, DeleteOutlined, CloseOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const CustomerHistoryHeader = ({ orders = [], onClose }) => {
  const targetTotal = orders.length;
  const targetDone = orders.filter((o) => o.saleReport === "DONE").length;
  const targetShipped = orders.filter(
    (o) => o.deliveryStatus === "GIAO THÀNH CÔNG",
  ).length;
  const targetRev =
    orders.reduce((acc, o) => acc + (Number(o.revenue) || 0), 0) * 1000 * 17;

  const [vals, setVals] = useState({ total: 0, done: 0, shipped: 0, rev: 0 });

  useEffect(() => {
    let raf;
    const duration = 1100;
    const start = performance.now();
    const animate = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const ease = 1 - Math.pow(1 - t, 3);
      setVals({
        total: Math.round(targetTotal * ease),
        done: Math.round(targetDone * ease),
        shipped: Math.round(targetShipped * ease),
        rev: Math.round(targetRev * ease),
      });
      if (t < 1) raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [targetTotal, targetDone, targetShipped, targetRev]);

  const customerName =
    orders.length > 0 ? orders[0]?.customerName || "—" : "Tra cứu đơn hàng";

  return (
    <div className="customer-history-header">
      <div className="customer-history-header-left">
        <div className="customer-history-icon">📋</div>
        <div>
          <div className="customer-history-title">
            Lịch sử đơn hàng của khách
          </div>
          <div className="customer-history-subtitle">
            Khách hàng: {customerName}
          </div>
        </div>
      </div>
      <div className="customer-history-stats">
        <div className="customer-history-stat">
          <span className="customer-history-stat-label">Tổng đơn</span>
          <span className="customer-history-stat-value">{vals.total}</span>
        </div>
        <div className="customer-history-stat">
          <span className="customer-history-stat-label">Hoàn thành</span>
          <span className="customer-history-stat-value customer-history-stat-done">
            {vals.done}
          </span>
        </div>
        <div className="customer-history-stat">
          <span className="customer-history-stat-label">Đã giao</span>
          <span className="customer-history-stat-value customer-history-stat-shipped">
            {vals.shipped}
          </span>
        </div>
        <div className="customer-history-stat">
          <span className="customer-history-stat-label">Tổng DS</span>
          <span className="customer-history-stat-value customer-history-stat-rev">
            {vals.rev.toLocaleString()}
            <span className="customer-history-stat-unit">đ</span>
          </span>
        </div>
      </div>
      <Button
        type="text"
        icon={<CloseOutlined style={{ fontSize: 18, color: "#fde68a" }} />}
        onClick={onClose}
        className="customer-history-close"
      />
    </div>
  );
};

const CustomerHistoryModal = ({
  visible,
  orders = [],
  onClose,
  onEdit,
  onDelete,
  currentUser,
}) => {
  const [selectedColumns, setSelectedColumns] = useState([
    "action",
    "products",
    "customerName",
    "pageName",
    "revenue",
    "phone",
    "orderDate",
    "stt",
    "sale",
    "mkt",
    "salexuly",
    "note",
    "processStatus",
    "saleReport",
    "deliveryStatus",
    "paymentStatus",
    "fb",
    "backupBy",
    "backupAt",
  ]);

  const handleColumnSelect = (columnKey, checked) => {
    setSelectedColumns((prev) =>
      checked ? [...prev, columnKey] : prev.filter((k) => k !== columnKey),
    );
  };

  const defaultColumns = [
    "action",
    "products",
    "customerName",
    "pageName",
    "phone",
    "revenue",
    "phone",
    "orderDate",
    "stt",
    "sale",
    "mkt",
    "salexuly",
    "note",
    "processStatus",
    "saleReport",
    "deliveryStatus",
    "paymentStatus",
    "fb",
    "backupBy",
    "backupAt",
  ];
  const visibleCols = defaultColumns;

  // Build dynamic allColumns first so we can use them
  const rawColumns = [
    {
      title: (
        <Checkbox
          checked={selectedColumns.includes("action")}
          onChange={(e) => handleColumnSelect("action", e.target.checked)}
        >
          THAO TÁC
        </Checkbox>
      ),
      key: "action",
      render: (_, record) => {
        //   const disableEdit =
        // currentUser.position === "salenhapdon" && record.saleReport === "DONE";
        return (
          <Space>
            <Button
              disabled={
                currentUser.name === "Hoàng Công Phi" ||
                currentUser.position_team === "mkt"
              }
              icon={<EditOutlined />}
              onClick={() => onEdit && onEdit(record)}
            />
            <Popconfirm
              title="Xóa đơn hàng?"
              onConfirm={() => onDelete && onDelete(record.id)}
            >
              <Button
                danger
                disabled={
                  currentUser.position === "salenhapdon" ||
                  currentUser.position === "salexacnhan" ||
                  currentUser.position === "salexuly" ||
                  currentUser.name === "Hoàng Công Phi" ||
                  currentUser.position_team === "mkt" ||
                  currentUser.position === "salefull"
                }
                icon={<DeleteOutlined />}
              />
            </Popconfirm>
          </Space>
        );
      },
      width: 50,
    },
    {
      title: "Sản phẩm",
      key: "products",
      render: (_, record) =>
        record.products
          ?.map((p) => `${p.product} - SL: ${p.quantity}`)
          .join(", "),
    },
    {
      title: "Tên Khách",
      dataIndex: "customerName",
      key: "customerName",
    },
    {
      title: "SĐT",
      dataIndex: "phone",
      key: "phone",
    },
    ...(currentUser.position_team !== "mkt"
      ? [
          {
            title: "TÊN PAGE",
            dataIndex: "pageName",
            key: "pageName",
            render: (text) => (text ? text.split("||")[0].trim() : ""),
          },
        ]
      : []),
    {
      title: "Ngày đặt",
      dataIndex: "orderDate4",
      key: "orderDate",
      render: (text, record) => {
        // Kiểm tra nếu orderDate4 không hợp lệ thì lấy orderDate
        const dateValue = text || record.orderDate;

        if (!dateValue) return "N/A"; // Nếu không có cả hai giá trị, hiển thị "N/A"

        const formattedDate = dayjs(dateValue).isValid()
          ? dayjs(dateValue).format("DD/MM")
          : "N/A";
        const formattedTime = dayjs(dateValue).isValid()
          ? dayjs(dateValue).format("HH:mm:ss")
          : "N/A";

        return (
          <div>
            {formattedDate}
            <br />
            {formattedTime}
          </div>
        );
      },
    },
    { title: "STT", dataIndex: "stt", key: "stt" },
    ...(currentUser.position === "leadSALE" ||
    currentUser.position === "managerSALE" ||
    currentUser.position === "admin"
      ? [
          { title: "SALE", dataIndex: "sale", key: "sale" },
          { title: "MKT", dataIndex: "mkt", key: "mkt" },
          { title: "VĐ", dataIndex: "salexuly", key: "salexuly" },
        ]
      : []),

    {
      title: (
        <Checkbox
          checked={selectedColumns.includes("note")}
          onChange={(e) => handleColumnSelect("note", e.target.checked)}
        >
          GHI CHÚ SALE
        </Checkbox>
      ),
      dataIndex: "note",
      key: "note",
      width: 200,
      render: (text) => {
        if (!text) return ""; // Tránh lỗi nếu note rỗng hoặc null
        const parts = text.split(":");
        return (
          <div style={{ width: 200 }}>
            <h3>{parts.length > 1 ? parts.slice(1).join(":").trim() : text}</h3>
          </div>
        );
      },
    },

    {
      title: "TT XỬ LÍ",

      dataIndex: "processStatus",
      key: "processStatus",
    },
    {
      title: "ĐƠN",

      dataIndex: "saleReport",
      key: "saleReport",
      render: (text) => (
        <Tag color={text === "DONE" ? "green" : "red"}>{text}</Tag>
      ),
    },
    {
      title: "TÌNH TRẠNG GH",

      dataIndex: "deliveryStatus",
      width: 90,
      key: "deliveryStatus",
      render: (text) => (
        <Tag color={text === "GIAO THÀNH CÔNG" ? "blue" : "orange"}>{text}</Tag>
      ),
    },
    {
      title: "THANH TOÁN",
      dataIndex: "paymentStatus",
      key: "paymentStatus",
      width: 100,
      render: (text) => (
        <Tag color={text === "ĐÃ THANH TOÁN" ? "green" : "red"}>{text}</Tag>
      ),
    },

    ...(currentUser.position === "salenhapdon" ||
    currentUser.position === "salefull" ||
    currentUser.position === "salexuly"
      ? [
          {
            title: (
              <Checkbox
                checked={selectedColumns.includes("note")}
                onChange={(e) => handleColumnSelect("note", e.target.checked)}
              >
                FB
              </Checkbox>
            ),

            dataIndex: "fb",
            key: "fb",
            width: 100,
            render: (text) => {
              if (!text) return ""; // Tránh lỗi nếu note rỗng hoặc null

              return (
                <div>
                  <h4>{text}</h4>
                </div>
              );
            },
          },
        ]
      : []),
    ...(currentUser.position === "leadSALE" ||
    currentUser.position === "managerSALE" ||
    currentUser.position === "admin"
      ? [
          {
            title: (
              <Checkbox
                checked={selectedColumns.includes("backupBy")}
                onChange={(e) =>
                  handleColumnSelect("backupBy", e.target.checked)
                }
              >
                NGƯỜI SỬA
              </Checkbox>
            ),

            dataIndex: "backupBy",
            key: "backupBy",
            width: 100,
            render: (text) => {
              if (!text) return ""; // Tránh lỗi nếu note rỗng hoặc null

              return (
                <div>
                  <h4>{text ? decodeURIComponent(text) : ""}</h4>
                </div>
              );
            },
          },
        ]
      : []),
    ...(currentUser.position === "leadSALE" ||
    currentUser.position === "managerSALE" ||
    currentUser.position === "admin" ||
    currentUser.name === "Uyển Nhi"
      ? [
          {
            title: (
              <Checkbox
                checked={selectedColumns.includes("backupAt")}
                onChange={(e) =>
                  handleColumnSelect("backupAt", e.target.checked)
                }
              >
                TIME
              </Checkbox>
            ),

            dataIndex: "backupAt",
            key: "backupAt",
            width: 100,
            render: (text) => {
              if (!text) return "";

              const vnTime = new Date(text).toLocaleString("vi-VN", {
                timeZone: "Asia/Ho_Chi_Minh",
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              });

              return <h4>{vnTime}</h4>;
            },
          },
        ]
      : []),
  ];

  // All columns are always visible — no column selection filter needed
  const columns = rawColumns;

  return (
    <Modal
      title={null}
      open={visible}
      onCancel={onClose}
      footer={null}
      width="95vw"
      style={{ maxWidth: "95vw" }}
      className="customer-history-modal"
      closable={false}
    >
      <CustomerHistoryHeader orders={orders} onClose={onClose} />
      <Table
        dataSource={orders}
        columns={columns}
        rowKey={(record) =>
          `${record._regionKey || record.region || "unk"}-${record.id}`
        }
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          pageSizeOptions: ["5", "10", "20", "50"],
          showTotal: (t) => `Tổng ${t} đơn`,
        }}
        scroll={{ x: 1800 }}
      />
    </Modal>
  );
};

export default CustomerHistoryModal;
