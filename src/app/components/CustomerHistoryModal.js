"use client";
import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Tag, Checkbox, Space, Popconfirm } from "antd";
import { EditOutlined, DeleteOutlined, CloseOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const CustomerHistoryHeader = ({ orders = [], onClose }) => {
  const targetTotal = orders.length;
  const targetDone = orders.filter((o) => o.saleReport === "DONE").length;
  const targetShipped = orders.filter(
    (o) => o.deliveryStatus === "GIAO THÀNH CÔNG"
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
          <div className="customer-history-title">Lịch sử đơn hàng của khách</div>
          <div className="customer-history-subtitle">Khách hàng: {customerName}</div>
        </div>
      </div>
      <div className="customer-history-stats">
        <div className="customer-history-stat">
          <span className="customer-history-stat-label">Tổng đơn</span>
          <span className="customer-history-stat-value">{vals.total}</span>
        </div>
        <div className="customer-history-stat">
          <span className="customer-history-stat-label">Hoàn thành</span>
          <span className="customer-history-stat-value customer-history-stat-done">{vals.done}</span>
        </div>
        <div className="customer-history-stat">
          <span className="customer-history-stat-label">Đã giao</span>
          <span className="customer-history-stat-value customer-history-stat-shipped">{vals.shipped}</span>
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
  const [selectedColumns, setSelectedColumns] = useState([]);

  const handleColumnSelect = (columnKey, checked) => {
    setSelectedColumns((prev) =>
      checked ? [...prev, columnKey] : prev.filter((k) => k !== columnKey)
    );
  };

  const defaultColumns = [
    "action", "products", "customerName", "revenue", "phone", "orderDate",
    "stt", "note", "processStatus", "saleReport", "deliveryStatus", "paymentStatus",
    "backupBy", "backupAt",
  ];
  const visibleCols = selectedColumns.length > 0 ? selectedColumns : defaultColumns;

  const allColumns = [
    {
      title: (
        <Checkbox checked={selectedColumns.includes("action")} onChange={(e) => handleColumnSelect("action", e.target.checked)}>
          THAO TÁC
        </Checkbox>
      ),
      key: "action",
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => onEdit && onEdit(record)} />
          <Popconfirm title="Xóa đơn hàng?" onConfirm={() => onDelete && onDelete(record.id)}>
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
      width: 90,
    },
    {
      title: (
        <Checkbox checked={selectedColumns.includes("products")} onChange={(e) => handleColumnSelect("products", e.target.checked)}>
          SẢN PHẨM
        </Checkbox>
      ),
      key: "products",
      width: 240,
      render: (_, record) => (
        <span className="customer-history-product">
          {record.products?.map((p) => `${p.product} - SL: ${p.quantity}`).join(", ")}
        </span>
      ),
    },
    {
      title: (
        <Checkbox checked={selectedColumns.includes("customerName")} onChange={(e) => handleColumnSelect("customerName", e.target.checked)}>
          TÊN KHÁCH
        </Checkbox>
      ),
      dataIndex: "customerName",
      key: "customerName",
      width: 150,
      render: (text) => <span className="customer-history-customer">{text}</span>,
    },
    ...((currentUser?.position === "leadSALE" || currentUser?.position === "managerSALE")
      ? [{
          title: (
            <Checkbox checked={selectedColumns.includes("pageName")} onChange={(e) => handleColumnSelect("pageName", e.target.checked)}>
              TÊN PAGE
            </Checkbox>
          ),
          dataIndex: "pageName",
          key: "pageName",
          render: (text) => text ? text.split("||")[0].trim() : "",
        }]
      : []),
    {
      title: (
        <Checkbox checked={selectedColumns.includes("revenue")} onChange={(e) => handleColumnSelect("revenue", e.target.checked)}>
          DOANH SỐ
        </Checkbox>
      ),
      dataIndex: "revenue",
      key: "revenue",
      width: 130,
      render: (text) => (
        <span className="customer-history-revenue">{Number(text || 0).toLocaleString()}</span>
      ),
    },
    {
      title: (
        <Checkbox checked={selectedColumns.includes("phone")} onChange={(e) => handleColumnSelect("phone", e.target.checked)}>
          SĐT
        </Checkbox>
      ),
      dataIndex: "phone",
      key: "phone",
      width: 130,
    },
    {
      title: (
        <Checkbox checked={selectedColumns.includes("orderDate")} onChange={(e) => handleColumnSelect("orderDate", e.target.checked)}>
          NGÀY ĐẶT
        </Checkbox>
      ),
      dataIndex: "orderDate4",
      key: "orderDate",
      width: 150,
      render: (text, record) => {
        const dateValue = text || record.orderDate;
        if (!dateValue) return "N/A";
        const date = dayjs(dateValue);
        return (
          <div className="date-cell">
            <span className="date-main">{date.format("DD/MM/YYYY")}</span>
            <span className="date-time">{date.format("HH:mm:ss")}</span>
          </div>
        );
      },
    },
    {
      title: (
        <Checkbox checked={selectedColumns.includes("stt")} onChange={(e) => handleColumnSelect("stt", e.target.checked)}>
          STT
        </Checkbox>
      ),
      dataIndex: "stt",
      key: "stt",
      width: 80,
    },
    ...((currentUser?.position === "leadSALE" || currentUser?.position === "managerSALE")
      ? [
          {
            title: (
              <Checkbox checked={selectedColumns.includes("sale")} onChange={(e) => handleColumnSelect("sale", e.target.checked)}>
                SALE
              </Checkbox>
            ),
            dataIndex: "sale",
            key: "sale",
          },
          {
            title: (
              <Checkbox checked={selectedColumns.includes("mkt")} onChange={(e) => handleColumnSelect("mkt", e.target.checked)}>
                MKT
              </Checkbox>
            ),
            dataIndex: "mkt",
            key: "mkt",
          },
        ]
      : []),
    {
      title: (
        <Checkbox checked={selectedColumns.includes("note")} onChange={(e) => handleColumnSelect("note", e.target.checked)}>
          GHI CHÚ SALE
        </Checkbox>
      ),
      dataIndex: "note",
      key: "note",
      width: 200,
      render: (text) => {
        if (!text) return "";
        const parts = text.split(":");
        return (
          <div className="customer-history-note" style={{ width: 200 }}>
            <h3>{parts.length > 1 ? parts.slice(1).join(":").trim() : text}</h3>
          </div>
        );
      },
    },
    {
      title: (
        <Checkbox checked={selectedColumns.includes("processStatus")} onChange={(e) => handleColumnSelect("processStatus", e.target.checked)}>
          TT XỬ LÍ
        </Checkbox>
      ),
      dataIndex: "processStatus",
      key: "processStatus",
      width: 120,
      render: (text) => <Tag className="customer-history-tag">{text}</Tag>,
    },
    {
      title: (
        <Checkbox checked={selectedColumns.includes("saleReport")} onChange={(e) => handleColumnSelect("saleReport", e.target.checked)}>
          ĐƠN
        </Checkbox>
      ),
      dataIndex: "saleReport",
      key: "saleReport",
      width: 100,
      render: (text) => (
        <Tag color={text === "DONE" ? "green" : "red"} className="customer-history-tag">{text}</Tag>
      ),
    },
    {
      title: (
        <Checkbox checked={selectedColumns.includes("deliveryStatus")} onChange={(e) => handleColumnSelect("deliveryStatus", e.target.checked)}>
          TÌNH TRẠNG GH
        </Checkbox>
      ),
      dataIndex: "deliveryStatus",
      key: "deliveryStatus",
      width: 140,
      render: (text) => (
        <Tag color={text === "GIAO THÀNH CÔNG" ? "blue" : "orange"} className="customer-history-tag">{text}</Tag>
      ),
    },
    {
      title: (
        <Checkbox checked={selectedColumns.includes("paymentStatus")} onChange={(e) => handleColumnSelect("paymentStatus", e.target.checked)}>
          THANH TOÁN
        </Checkbox>
      ),
      dataIndex: "paymentStatus",
      key: "paymentStatus",
      width: 130,
      render: (text) => (
        <Tag color={text === "ĐÃ THANH TOÁN" ? "green" : "red"} className="customer-history-tag">{text}</Tag>
      ),
    },
    ...(currentUser?.position === "leadSALE" ||
      currentUser?.position === "managerSALE" ||
      currentUser?.position === "admin"
      ? [{
          title: (
            <Checkbox checked={selectedColumns.includes("backupBy")} onChange={(e) => handleColumnSelect("backupBy", e.target.checked)}>
              NGƯỜI SỬA
            </Checkbox>
          ),
          dataIndex: "backupBy",
          key: "backupBy",
          width: 100,
          render: (text) => {
            if (!text) return "";
            return <span>{decodeURIComponent(text)}</span>;
          },
        }]
      : []),
    ...(currentUser?.position === "leadSALE" ||
      currentUser?.position === "managerSALE" ||
      currentUser?.position === "admin" ||
      currentUser?.name === "Uyển Nhi"
      ? [{
          title: (
            <Checkbox checked={selectedColumns.includes("backupAt")} onChange={(e) => handleColumnSelect("backupAt", e.target.checked)}>
              TIME
            </Checkbox>
          ),
          dataIndex: "backupAt",
          key: "backupAt",
          width: 130,
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
            return <span>{vnTime}</span>;
          },
        }]
      : []),
  ];

  const columns = allColumns.filter((col) => visibleCols.includes(col.key));

  return (
    <Modal
      title={null}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={1500}
      className="customer-history-modal"
      closable={false}
    >
      <CustomerHistoryHeader orders={orders} onClose={onClose} />
      <Table
        dataSource={orders}
        columns={columns}
        rowKey={(record) => `${record._regionKey || record.region || "unk"}-${record.id}`}
        pagination={{ pageSize: 10, showSizeChanger: true, pageSizeOptions: ["5", "10", "20", "50"], showTotal: (t) => `Tổng ${t} đơn` }}
        scroll={{ x: 1400 }}
      />
    </Modal>
  );
};

export default CustomerHistoryModal;
