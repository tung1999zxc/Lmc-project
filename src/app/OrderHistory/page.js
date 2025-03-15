// src/components/OrderHistory.js
"use client";
import React, { useEffect, useState } from "react";
import { Table, Spin, Input } from "antd";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";

// Mapping chuyển tên field trong DB thành label dễ đọc
const fieldLabelMapping = {
  orderDate: "NGÀY ĐẶT",
  customerName: "TÊN KHÁCH",
  pageName: "TÊN PAGE",
  phone: "SỐ ĐIỆN THOẠI",
  address: "ĐỊA CHỈ",
  mkt: "MKT",
  sale: "SALE CHAT",
  salexuly: "VẬN ĐƠN",
  salexacnhan: "SALE XÁC NHẬN",
  revenue: "DOANH SỐ",
  profit: "DOANH THU",
  category: "QUÀ",
  products: "SẢN PHẨM",
  note: "GHI CHÚ SALE",
  fb: "Link FB",
  processStatus: "TT SALE XỬ LÍ ĐƠN",
  saleReport: "ĐƠN",
  paymentStatus: "THANH TOÁN",
  deliveryStatus: "TÌNH TRẠNG GIAO HÀNG",
  trackingCode: "MÃ VẬN ĐƠN",
  istick: "in đơn",
  istick4: "ĐÃ in đơn",
  isShipping: "cty đóng hàng",
  istickDONE: "xác nhận giao thành công",
  shippingDate1: "NGÀY GỬI",
  orderDate4: "odate4",
  shippingDate2: "NGÀY NHẬN",
  noteKHO: "GHI CHÚ KHO",
};

const OrderHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
 const currentUser = useSelector((state) => state.user.currentUser);
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/orders/history`);
      setHistory(response.data.data);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách history", error);
    } finally {
      setLoading(false);
    }
  };

  // Mỗi record history được lưu dưới dạng đối tượng toàn bộ, dùng để render trong bảng
  const dataSource = history.map((record, index) => ({
    key: index,
    record, // lưu toàn bộ record
  }));

  // Lọc theo STT nếu có nhập search
  const filteredDataSource = dataSource.filter(({ record }) =>
    record.stt !== undefined &&
    record.stt.toString().toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
  
    {
      title: "STT",
      dataIndex: "record",
      key: "stt",
      render: (record) => record.stt,
    },
    {
      title: "Người sửa",
      dataIndex: "record",
      key: "editedBy",
      render: (record) => record.editedBy,
    },
    {
      title: "Thời gian",
      dataIndex: "record",
      key: "timestamp",
      render: (record) => new Date(record.timestamp).toLocaleString(),
    },
    {
        title: "Thay đổi",
        dataIndex: "record",
        key: "changes",
        render: (record) => {
          console.log("Record changes:", record.changes);
          const { changes } = record;
          if (Array.isArray(changes) && changes.length > 0) {
            return (
              <div>
                {changes.map((change, idx) => {
                  const label = fieldLabelMapping[change.field] || change.field;
                  // Kiểm tra nếu oldValue hoặc newValue là object hoặc array
                  let oldVal = change.oldValue;
                  let newVal = change.newValue;
                  if (typeof oldVal === "object") {
                    oldVal = JSON.stringify(oldVal);
                  }
                  if (typeof newVal === "object") {
                    newVal = JSON.stringify(newVal);
                  }
                  return (
                    <div key={idx}>
                      <strong>{label}</strong>: {oldVal} → {newVal}
                    </div>
                  );
                })}
              </div>
            );
          }
          return <span>Không có thay đổi</span>;
        },
      },
  ];

  if (currentUser.position_team === "mkt" || currentUser.position_team === "kho") {
    return null;
  }
  
  return loading ? (
    <Spin size="large" />
  ) : (
    <>
      <Input.Search
        placeholder="Tìm kiếm theo STT"
        allowClear
        onChange={(e) => setSearchText(e.target.value)}
        style={{ marginBottom: 16, maxWidth: 300 }}
      />
      <Table
        dataSource={filteredDataSource}
        columns={columns}
        pagination={{ pageSize: 10 }}
      />
    </>
  );
};

export default OrderHistory;
