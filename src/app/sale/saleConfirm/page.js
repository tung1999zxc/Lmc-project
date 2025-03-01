"use client";
import { Table } from "antd";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { useSelector } from "react-redux"; 
import axios from "axios"; 
import { useRouter } from 'next/navigation';
const OrdersTable = () => {
  const [sampleOrders, setSampleOrders] = useState([]);
  const currentUser = useSelector((state) => state.user.currentUser);
  // Khi component mount, đọc dữ liệu đơn từ localStorage (chỉ chạy trên client)
  const router = useRouter(); 
  
  useEffect(() => {
    if (!currentUser.name) {
      router.push("/login");
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get("/api/orders");
      setSampleOrders(response.data.data);
    } catch (error) {
      console.error(error);
      message.error("Lỗi khi lấy đơn hàng");
    }
  };

  // Lấy ngày hiện tại và xác định cutoff (30 ngày gần nhất)
  const today = dayjs();
  // Giả sử bao gồm cả ngày hôm nay, ta cần 30 ngày (từ hôm nay trở về quá khứ)
  const cutoffDate = today.subtract(29, "day");

  // Tạo danh sách 30 ngày gần nhất theo định dạng "YYYY-MM-DD"
  const last30Days = [];
  for (let i = 0; i < 30; i++) {
    const dateStr = today.subtract(i, "day").format("YYYY-MM-DD");
    last30Days.push(dateStr);
  }

  // Nhóm các đơn theo ngày (dựa trên order.orderDate)
  // Lưu ý: Giả sử order.orderDate có định dạng có thể parse được bằng dayjs
  const grouped = sampleOrders.reduce((acc, order) => {
    // Chuyển order.orderDate về định dạng "YYYY-MM-DD"
    const orderDateStr = dayjs(order.orderDate).format("YYYY-MM-DD");

    // Nếu ngày của đơn không nằm trong 30 ngày gần nhất, bỏ qua
    if (dayjs(orderDateStr).isBefore(cutoffDate)) return acc;

    if (!acc[orderDateStr]) {
      acc[orderDateStr] = { date: orderDateStr, totalOrders: 0, doneOrders: 0 };
    }
    acc[orderDateStr].totalOrders += 1;
    if (order.saleReport === "DONE") {
      acc[orderDateStr].doneOrders += 1;
    }
    return acc;
  }, {});

  // Tạo dataSource: mỗi ngày là một dòng trong bảng
  const dataSource = last30Days.map((dateStr) => {
    const data = grouped[dateStr] || { totalOrders: 0, doneOrders: 0 };
    const confirmRate =
      data.totalOrders > 0
        ? ((data.doneOrders / data.totalOrders) * 100).toFixed(2) + "%"
        : "0%";
    return {
      key: Math.floor(10000 + Math.random() * 90000),
      date: dateStr,
      totalOrders: data.totalOrders,
      doneOrders: data.doneOrders,
      confirmRate,
    };
  });

  // Sắp xếp sao cho ngày mới nhất hiển thị trên đầu
  const sortedDataSource = dataSource.sort((a, b) => {
    return dayjs(b.date).valueOf() - dayjs(a.date).valueOf();
  });

  // Định nghĩa các cột của bảng
  const columns = [
    {
      title: "Ngày",
      dataIndex: "date",
      key: "date",
      render: (text) => dayjs(text, "YYYY-MM-DD").format("DD/MM/YYYY"),
    },
    {
      title: "Tổng số đơn trong ngày",
      dataIndex: "totalOrders",
      key: "totalOrders",
    },
    {
      title: "Tổng số đơn đã Done",
      dataIndex: "doneOrders",
      key: "doneOrders",
    },
    {
      title: "Tỉ lệ xác nhận đơn",
      dataIndex: "confirmRate",
      key: "confirmRate",
      
        render: (_, record) => {
          let rate = record.confirmRate;
          // Nếu rate là chuỗi (ví dụ "80.00%"), chuyển đổi thành số
          if (typeof rate !== "number") {
            rate = parseFloat(rate);
          }
          let bgColor = "";
          if (rate < 80) {
            bgColor = "#aaa";
          } else if (rate >= 80 && rate <= 95) {
            bgColor = "#FF9501";
          } else {
            bgColor = "#54DA1F";
          }
          return (  
            <div
              style={{
                backgroundColor: bgColor,
                padding: "4px 8px",
                borderRadius: "4px",
                textAlign: "center",
                fontWeight: "bold"
              }}
            >
              {rate.toFixed(2)}%
            </div>
          );
        }
      },
  ];

  return (
    <>
      {(currentUser.position === "admin" ||
        currentUser.position === "managerMKT" ||
        currentUser.position === "leadSALE" ||
        currentUser.position === "managerSALE" ||
        currentUser.position === "salexacnhan") && (
        <Table dataSource={sortedDataSource} columns={columns} bordered />
      )}
    </>
  );
};

export default OrdersTable;
