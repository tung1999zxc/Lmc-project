"use client";
import React, { useEffect, useState } from "react";
import { Table, Spin, Input, Tag } from "antd";
import axios from "axios";
import { useSelector } from "react-redux";
import dayjs from "dayjs";

const OrderHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const currentUser = useSelector((state) => state.user.currentUser);

  // ❌ Không cho hiển thị với MKT & KHO
  if (
    currentUser.position_team === "mkt" ||
    currentUser.position_team === "kho"
  ) {
    return null;
  }

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/orders/history`);
      setHistory(res.data.data || []);
    } catch (error) {
      console.error("Lỗi khi lấy lịch sử đơn hàng:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = history.filter((record) =>
    record.stt?.toString().includes(searchText.trim())
  );

  const columns = [
      { title: "Người sửa", dataIndex: "backupBy", key: "backupBy" },
  {
    title: "Thời gian",
    dataIndex: "timestamp",
    key: "timestamp",
    render: (text) => dayjs(text).format("DD/MM/YYYY HH:mm"),
  },
    {
      title: "STT",
      dataIndex: "stt",
      key: "stt",
      width: 80,
    },
    {
      title: "NGÀY ĐẶT",
      dataIndex: "orderDate4",
      key: "orderDate",
      render: (text, record) =>
        dayjs(text || record.orderDate).isValid()
          ? dayjs(text || record.orderDate).format("DD/MM")
          : "N/A",
      width: 80,
    },
    {
      title: "TÊN KHÁCH",
      dataIndex: "customerName",
      key: "customerName",
    },
    {
      title: "PAGE",
      dataIndex: "pageName",
      key: "pageName",
      render: (text) => (text ? text.split("||")[0].trim() : ""),
    },
    {
      title: "SẢN PHẨM",
      key: "products",
      render: (_, record) =>
        record.products?.map((item, i) => (
          <div key={i}>
            <strong>{item.product}</strong> - SL:{" "}
            <strong>{item.quantity}</strong>
          </div>
        )),
    },
    { title: "QUÀ", dataIndex: "category", key: "category" },
    {
      title: "T/G GH",
      dataIndex: "deliveryStatus",
      key: "deliveryStatus",
      render: (text) => (
        <Tag color={text === "GIAO THÀNH CÔNG" ? "blue" : "orange"}>
          {text}
        </Tag>
      ),
    },
    { title: "DS", dataIndex: "revenue", key: "revenue" },
    { title: "DT", dataIndex: "profit", key: "profit" },
    { title: "SALE", dataIndex: "sale", key: "sale" },
    { title: "VĐ", dataIndex: "salexuly", key: "salexuly" },
    { title: "XN", dataIndex: "salexacnhan", key: "salexacnhan" },
    ...(currentUser.position !== "salenhapdon"
      ? [{ title: "MKT", dataIndex: "mkt", key: "mkt" }]
      : []),
    {
      title: "ĐƠN",
      dataIndex: "saleReport",
      key: "saleReport",
      render: (text) => (
        <Tag color={text === "DONE" ? "green" : "red"}>{text}</Tag>
      ),
    },
    { title: "SĐT", dataIndex: "phone", key: "phone" },
    { title: "ĐỊA CHỈ", dataIndex: "address", key: "address" },
    {
      title: "TT",
      dataIndex: "paymentStatus",
      key: "paymentStatus",
      render: (text) => (
        <Tag color={text === "ĐÃ THANH TOÁN" ? "green" : "red"}>{text}</Tag>
      ),
    },
    { title: "GHI CHÚ", dataIndex: "note", key: "note" },
    { title: "FB", dataIndex: "fb", key: "fb" },
    { title: "MÃ VĐ", dataIndex: "trackingCode", key: "trackingCode" },
    {
      title: "GỬI",
      dataIndex: "shippingDate1",
      key: "shippingDate1",
      render: (text) => text && dayjs(text).format("DD/MM/YYYY"),
    },
    {
      title: "NHẬN",
      dataIndex: "shippingDate2",
      key: "shippingDate2",
      render: (text) => text && dayjs(text).format("DD/MM/YYYY"),
    },
    { title: "GHI CHÚ KHO", dataIndex: "noteKHO", key: "noteKHO" },
    { title: "TTXL", dataIndex: "processStatus", key: "processStatus" },
    { title: "CTY ĐÓNG NAME", dataIndex: "isShippingname", key: "isShippingname" },
  ];

  return loading ? (
    <Spin size="large" />
  ) : (
    <>
      <Input.Search
        placeholder="Tìm theo STT"
        allowClear
        onChange={(e) => setSearchText(e.target.value)}
        style={{ marginBottom: 16, maxWidth: 300 }}
      />
      <Table
        dataSource={filteredHistory}
        columns={columns}
       rowKey="id"
        pagination={{ pageSize: 10 }}
        scroll={{ x: 1200 }}
      />
    </>
  );
};

export default OrderHistory;
