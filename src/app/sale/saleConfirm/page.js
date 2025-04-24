"use client";
import { Table, message, Select } from "antd";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore"; // Import plugin
import { useSelector } from "react-redux";
import axios from "axios";
import { useRouter } from "next/navigation";

dayjs.extend(isSameOrBefore); // Mở rộng dayjs với plugin

const OrdersTable = () => {
  const [sampleOrders, setSampleOrders] = useState([]);
  const [safeEmployees, setSafeEmployees] = useState([]);
  const [filterType, setFilterType] = useState("week");
  const currentUser = useSelector((state) => state.user.currentUser);
  const router = useRouter();

  useEffect(() => {
    if (!currentUser.name) {
      router.push("/login");
    }
  }, [currentUser.name, router]);

  useEffect(() => {
   
    fetchEmployees();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`/api/orders2?selectedPreset=${filterType}`);
      setSampleOrders(response.data.data);
    } catch (error) {
      console.error(error);
      message.error("Lỗi khi lấy đơn hàng");
    }
  };
  useEffect(() => {
    fetchOrders();
  }, [filterType]);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get("/api/employees");
      setSafeEmployees(response.data.data);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách nhân viên:", error);
      message.error("Lỗi khi lấy danh sách nhân viên");
    }
  };

  // Tạo mảng các ngày dạng "YYYY-MM-DD" từ start đến end (bao gồm cả start và end)
  const getDateRangeArray = (start, end) => {
    let arr = [];
    let current = start.startOf("day");
    while (current.isSameOrBefore(end, "day")) {
      arr.push(current.format("YYYY-MM-DD"));
      current = current.add(1, "day");
    }
    return arr;
  };

  // Trả về khoảng ngày dựa theo bộ lọc
  const getDateRangeFromFilter = () => {
    let start, end;
    if (filterType === "today") {
      start = dayjs().startOf("day");
      end = dayjs().endOf("day");
    } else if (filterType === "week") {
      start = dayjs().startOf("week");
      end = dayjs().endOf("week");
    } else if (filterType === "currentMonth") {
      start = dayjs().startOf("month");
      end = dayjs().endOf("month");
    } else if (filterType === "lastMonth") {
      start = dayjs().subtract(1, "month").startOf("month");
      end = dayjs().subtract(1, "month").endOf("month");
    } else if (filterType === "twoMonthsAgo") {
      start = dayjs().subtract(2, "month").startOf("month");
      end = dayjs().subtract(2, "month").endOf("month");
    }
    return getDateRangeArray(start, end);
  };

  // Mảng các ngày được lọc theo khoảng thời gian đã chọn
  const filteredDates = getDateRangeFromFilter();

  // Xử lý đơn hàng theo ngày cho 3 bảng (lọc theo order.sale)
  // Chỉ trả về những ngày có đơn hàng (totalOrders > 0)
  const processOrders = (orders, filterNames, dateArray) => {
    const filteredOrders = orders.filter((order) =>
      filterNames.includes(order.sale)
    );
    const grouped = filteredOrders.reduce((acc, order) => {
      const orderDateStr = dayjs(order.orderDate).format("YYYY-MM-DD");
      if (!dateArray.includes(orderDateStr)) return acc;
      if (!acc[orderDateStr]) {
        acc[orderDateStr] = { date: orderDateStr, totalOrders: 0, doneOrders: 0 };
      }
      acc[orderDateStr].totalOrders += 1;
      if (order.saleReport === "DONE") {
        acc[orderDateStr].doneOrders += 1;
      }
      return acc;
    }, {});
    const result = dateArray.map((dateStr) => {
      const data = grouped[dateStr] || { totalOrders: 0, doneOrders: 0 };
      const confirmRate =
        data.totalOrders > 0 ? (data.doneOrders / data.totalOrders) * 100 : 0;
      return {
        key: dateStr,
        date: dateStr,
        totalOrders: data.totalOrders,
        doneOrders: data.doneOrders,
        confirmRate,
      };
    });
    // Chỉ giữ lại những ngày có đơn hàng
    const filteredResult = result.filter((item) => item.totalOrders > 0);
    // Sắp xếp từ ngày mới nhất đến ngày cũ nhất
    return filteredResult.sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf());
  };

  // Xử lý đơn hàng theo ngày cho từng nhân viên (bảng thống kê theo nhân viên)
  // - Tổng số đơn: Đếm tất cả các đơn trong ngày đó (không lọc theo nhân viên)
  // - Số đơn đã Done: Đếm các đơn có order.salexacnhan bằng tên nhân viên và saleReport === "DONE"
  // Chỉ trả về những ngày có đơn hàng
  const processEmployeeOrders = (orders, employeeName, dateArray) => {
    const result = dateArray.map((dateStr) => {
      const totalOrders = orders.filter(
        (order) => dayjs(order.orderDate).format("YYYY-MM-DD") === dateStr
      ).length;
      const doneOrders = orders.filter(
        (order) =>
          dayjs(order.orderDate).format("YYYY-MM-DD") === dateStr &&
          order.salexacnhan === employeeName &&
          order.saleReport === "DONE"
      ).length;
      const confirmRate = totalOrders > 0 ? (doneOrders / totalOrders) * 100 : 0;
      return {
        key: dateStr,
        date: dateStr,
        totalOrders,
        doneOrders,
        confirmRate,
      };
    });
    const filteredResult = result.filter((item) => item.totalOrders > 0);
    return filteredResult.sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf());
  };

  // Lấy danh sách tên nhân viên theo nhóm (cho 3 bảng theo ngày)
  const adminEmployeeNames = safeEmployees
    .filter((emp) => emp.position_team2 === "hanhchinh")
    .map((emp) => emp.name);
  const onlineEmployeeNames = safeEmployees
    .filter(
      (emp) =>
        emp.position_team2 === "onlinesang" || emp.position_team2 === "onlinetoi"
    )
    .map((emp) => emp.name);
  const allEmployeeNames = safeEmployees.map((emp) => emp.name);

  // DataSource cho 3 bảng theo ngày dựa trên khoảng thời gian đã chọn
  const dataSource = processOrders(sampleOrders, allEmployeeNames, filteredDates);
  const dataSourceHanhChinh = processOrders(sampleOrders, adminEmployeeNames, filteredDates);
  const dataSourceOnline = processOrders(sampleOrders, onlineEmployeeNames, filteredDates);

  // Lọc danh sách nhân viên có vị trí "salexacnhan" (Sale xác nhận)
  const saleXacNhanEmployees = safeEmployees.filter(
    (emp) => emp.position === "salexacnhan"
  );

  // Định nghĩa các cột cho bảng theo ngày (cho 3 bảng chung)
  const columns = [
    {
      title: "Ngày",
      dataIndex: "date",
      key: "date",
      render: (text) => dayjs(text).format("DD/MM/YYYY"),
    },
    {
      title: "Tổng số đơn",
      dataIndex: "totalOrders",
      key: "totalOrders",
    },
    {
      title: "Số đơn đã Done",
      dataIndex: "doneOrders",
      key: "doneOrders",
    },
    {
      title: "Tỉ lệ xác nhận",
      dataIndex: "confirmRate",
      key: "confirmRate",
      render: (value) => {
        let rate = value;
        let bgColor = rate < 80 ? "#aaa" : rate <= 95 ? "#FF9501" : "#54DA1F";
        return (
          <div
            style={{
              backgroundColor: bgColor,
              padding: "4px 8px",
              borderRadius: "4px",
              textAlign: "center",
              fontWeight: "bold",
              color: "white",
            }}
          >
            {rate.toFixed(2)}%
          </div>
        );
      },
    },
  ];

  return (
    <div>
      {/* Bộ lọc khoảng thời gian */}
      <div style={{ marginBottom: "16px" }}>
        <Select
          value={filterType}
          onChange={(value) => setFilterType(value)}
          style={{ width: 200 }}
        >
          <Select.Option value="today">Hôm nay</Select.Option>
          <Select.Option value="week">Tuần này</Select.Option>
          <Select.Option value="currentMonth">Tháng này</Select.Option>
          <Select.Option value="lastMonth">Tháng trước</Select.Option>
          <Select.Option value="twoMonthsAgo">2 tháng trước</Select.Option>
        </Select>
      </div>

      {/* 3 bảng thống kê theo ngày */}
      <div style={{ display: "flex", gap: "16px", overflowX: "auto" }}>
        <div style={{ flex: 1, minWidth: "350px" }}>
          <h2>Tất cả đơn hàng</h2>
          <Table
            dataSource={dataSource}
            columns={columns}
            bordered
            pagination={{ pageSize: 5 }}
          />
        </div>
        <div style={{ flex: 1, minWidth: "350px" }}>
          <h2>Sale Hành Chính</h2>
          <Table
            dataSource={dataSourceHanhChinh}
            columns={columns}
            bordered
            pagination={{ pageSize: 5 }}
          />
        </div>
        <div style={{ flex: 1, minWidth: "350px" }}>
          <h2>Sale Online</h2>
          <Table
            dataSource={dataSourceOnline}
            columns={columns}
            bordered
            pagination={{ pageSize: 5 }}
          />
        </div>
      </div>

      {/* Render bảng riêng cho từng nhân viên có vị trí "salexacnhan" */}
      {saleXacNhanEmployees.length > 0 && (
        <div style={{ marginTop: "32px" }}>
          <h2>Thống kê theo nhân viên (Sale xác nhận)</h2>
          {saleXacNhanEmployees.map((emp) => (
            <div key={emp.name} style={{ marginTop: "16px" }}>
              <h3>{emp.name}</h3>
              <Table
                dataSource={processEmployeeOrders(sampleOrders, emp.name, filteredDates)}
                columns={columns}
                bordered
                pagination={{ pageSize: 5 }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersTable;
