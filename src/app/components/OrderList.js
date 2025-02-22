"use client";
import React, { useState, useMemo, useEffect } from "react";
import {
  Table,
  Space,
  Button,
  Popconfirm,
  message,
  DatePicker,
  Input,
  Select,
  Row,
  Col,
  Tag,
  Checkbox
} from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import OrderForm from "./OrderForm";
import isBetween from "dayjs/plugin/isBetween";
import { useSelector } from "react-redux";

// Gọi dayjs.extend bên ngoài component để không gọi lại mỗi lần render
dayjs.extend(isBetween);

const OrderList = () => {
  // Lấy thông tin người dùng và danh sách nhân viên từ Redux
  const currentUser = useSelector((state) => state.user.currentUser);
  const employees = useSelector((state) => state.employees.employees);

  // Các state quản lý đơn hàng, form, filter, …
  const [orders, setOrders] = useState([]);
  const [currentEditId, setCurrentEditId] = useState(null);
  const [formVisible, setFormVisible] = useState(false);
  const [dateRange, setDateRange] = useState(undefined);
  const [searchText, setSearchText] = useState("");
  const [namesalexuly, setnamesalexuly] = useState("");
  // Cho phép chọn nhiều filter
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [selectedSale, setSelectedSale] = useState(undefined);
  const [selectedMKT, setSelectedMKT] = useState(undefined);

  // Danh sách thành viên team (dùng cho vai trò lead)
  const leadTeamMembers = employees
    .filter((employee) => employee.team_id === currentUser.team_id)
    .map((employee) => employee.name);

  const { RangePicker } = DatePicker;
  const { Search } = Input;

  // Options cho Select
  const mktOptions = employees
    .filter((emp) => emp.position_team === "mkt")
    .map((emp) => emp.name);
  const saleOptions = employees
    .filter((emp) => emp.position_team === "sale")
    .map((emp) => emp.name);
  const salexulyOptions = employees
    .filter((emp) => emp.position === "salexuly")
    .map((emp) => emp.name);

  // Lấy đơn hàng từ localStorage khi component mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedOrders = localStorage.getItem("orders");
      if (savedOrders) {
        setOrders(JSON.parse(savedOrders));
      }
    }
  }, []);

  // Lưu đơn hàng vào localStorage mỗi khi orders thay đổi
  useEffect(() => {
    if (typeof window !== "undefined" && orders && orders.length > 0) {
      localStorage.setItem("orders", JSON.stringify(orders));
    }
  }, [orders]);

  // Tính toán chọn nhân viên salexuly dựa trên số đơn hàng của hôm nay
  useEffect(() => {
    const getLocalDateString = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const todayStr = getLocalDateString(new Date());
    const filteredOrders = orders.filter(
      (order) => order.orderDate === todayStr
    );
    const employeeOrderCounts = salexulyOptions.map((employee) => ({
      name: employee,
      count: filteredOrders.filter(
        (order) => order.salexuly === employee
      ).length,
    }));
    const minCount = Math.min(...employeeOrderCounts.map((emp) => emp.count));
    const selectedEmployee = employeeOrderCounts.find(
      (emp) => emp.count === minCount
    );
    if (selectedEmployee) {
      setnamesalexuly(selectedEmployee.name);
    }
  }, [orders, salexulyOptions]);

  // Lọc đơn hàng dựa trên vai trò và các filter được chọn
  const filteredOrders = useMemo(() => {
    let roleFilteredOrders = [...orders];

    if (currentUser.position === "mkt") {
      roleFilteredOrders = roleFilteredOrders.filter(
        (order) => order.mkt === currentUser.name
      );
    } else if (currentUser.position === "salenhapdon") {
      roleFilteredOrders = roleFilteredOrders.filter(
        (order) => order.sale === currentUser.name
      );
    } else if (currentUser.position === "salexuly") {
      roleFilteredOrders = roleFilteredOrders.filter(
        (order) =>
          order.salexuly === currentUser.name 
      );
    } else if (currentUser.position_team === "kho") {
      roleFilteredOrders = roleFilteredOrders.filter(
        (order) => order.saleReport === "DONE"
      );
    } else if (currentUser.position === "lead") {
      roleFilteredOrders = roleFilteredOrders.filter((order) =>
        leadTeamMembers.includes(order.mkt)
      );
    }

    return roleFilteredOrders
      .filter((order) => {
        // Điều kiện lọc theo ngày
        let dateMatch = true;
        if (dateRange) {
          const startDate = dayjs(dateRange[0]);
          const endDate = dayjs(dateRange[1]);
          const checkDate = (date) =>
            date &&
            dayjs(date).isValid() &&
            dayjs(date).isBetween(startDate, endDate, "day", "[]");
          if (!order.shippingDate1 && !order.shippingDate2) {
            dateMatch = checkDate(order.orderDate);
          } else {
            dateMatch =
              checkDate(order.orderDate) ||
              checkDate(order.shippingDate1) ||
              checkDate(order.shippingDate2);
          }
        }

        // Điều kiện lọc theo từ khóa tìm kiếm
        const searchMatch = (() => {
          let searchString = "";
          for (const key in order) {
            if (key === "products") continue;
            searchString += " " + String(order[key]);
          }
          if (order.products && Array.isArray(order.products)) {
            const productString = order.products
              .map((item) => `${item.product} ${item.quantity}`)
              .join(" ");
            searchString += " " + productString;
          }
          return searchText
            .toLowerCase()
            .split(" ")
            .every((term) =>
              searchString.toLowerCase().includes(term)
            );
        })();

        // Điều kiện lọc theo các filter được chọn
        let filterMatch = true;
        if (selectedFilters && selectedFilters.length > 0) {
          filterMatch = selectedFilters.every((filter) => {
            switch (filter) {
              case "today":
                return dayjs(order.orderDate).isSame(dayjs(), "day");
              case "not_delivered":
                return (
                  order.deliveryStatus === "ĐÃ GỬI HÀNG" &&
                  order.deliveryStatus !== "ĐÃ THANH TOÁN"
                );
              case "delivered":
                return order.deliveryStatus === "GIAO THÀNH CÔNG";
              case "unpaid_success":
                return (
                  order.paymentStatus === "CHƯA THANH TOÁN" &&
                  order.deliveryStatus === "GIAO THÀNH CÔNG"
                );
              case "unpaid":
                return order.paymentStatus === "CHƯA THANH TOÁN";
              case "paid":
                return order.paymentStatus === "ĐÃ THANH TOÁN";
              case "duplicate_name":
                return (
                  orders.filter(
                    (o) => o.customerName === order.customerName
                  ).length > 1
                );
              case "duplicate_phone":
                return (
                  orders.filter((o) => o.phone === order.phone)
                    .length > 1
                );
              case "waiting_approval":
                return order.saleReport === "ĐỢI XN";
              case "done":
                return order.saleReport === "DONE";
              case "waiting_done":
                return order.saleReport !== "DONE";
              case "isshiping":
                return order.isShipping === true;
              
              default:
                return true;
            }
          });
        }

        const saleMatch = selectedSale
          ? order.sale === selectedSale ||
            order.salexuly === selectedSale
          : true;
        const mktMatch = selectedMKT ? order.mkt === selectedMKT : true;

        return dateMatch && searchMatch && filterMatch && saleMatch && mktMatch;
      })
      .sort(
        (a, b) =>
          dayjs(b.orderDate).valueOf() - dayjs(a.orderDate).valueOf()
      );
  }, [
    orders,
    dateRange,
    searchText,
    selectedFilters,
    selectedSale,
    selectedMKT,
    currentUser,
    leadTeamMembers
  ]);

  // Hàm cập nhật checkbox "Công ty đóng hàng"
  const handleShippingChange = (orderId, checked) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.id === orderId ? { ...order, isShipping: checked } : order
      )
    );
    message.success("Cập nhật trạng thái đóng hàng thành công");
  };

  // Các cột cho bảng (cho các vai trò khác nhau)
  const columns = [
    {
      title: "Thao Tác",
      key: "action",
      render: (_, record) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Xóa đơn hàng?"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button
              danger
              disabled={
                currentUser.position === "salenhapdon" ||
                currentUser.position === "salexacnhan" ||
                currentUser.position === "salexuly"
              }
              icon={<DeleteOutlined />}
            />
          </Popconfirm>
        </Space>
      )
    },
    {
      title: "NGÀY ĐẶT",
      dataIndex: "orderDate",
      key: "orderDate",
      render: (text) => dayjs(text).format("DD/MM/YYYY")
    },
    
    ...((currentUser.position === 'leadSALE' || currentUser.position == 'salexuly' || currentUser.position == 'managerSALE' || currentUser.position == 'admin')
      ? [
        {
          title: "STT",
          dataIndex: "stt",
          key: "STT"
        },
        ]
      : []),
    { title: "TÊN KHÁCH", dataIndex: "customerName", key: "customerName" },
    { title: "TÊN PAGE", dataIndex: "pageName", key: "pageName" },
    {
      title: "SẢN PHẨM",
      key: "products",
      render: (_, record) => (
        <>
          {record.products &&
            record.products.map((item, index) => (
              <div key={index} style={{ whiteSpace: "nowrap" }}>
                <strong>{item.product} </strong> - SL :{" "}
                <strong>{item.quantity}</strong>
              </div>
            ))}
        </>
      )
    },
    { title: "Phân loại QUÀ/SIZE/MÀU", dataIndex: "category", key: "category" },
    

    ...(currentUser.position !== 'salexuly'
      ? [
        {
          title: "Công ty đóng hàng",
          key: "isShipping",
          dataIndex: "isShipping",
          render: (_, record) => (
            <Checkbox
              checked={record.isShipping}
              onChange={(e) =>
                handleShippingChange(record.id, e.target.checked)
              }
            />
          )
        },
        ]
      : []),
    { title: "DOANH SỐ", dataIndex: "revenue", key: "revenue" },
    { title: "SALE", dataIndex: "sale", key: "sale" },
    { title: "VẬN ĐƠN", dataIndex: "salexuly", key: "salexuly" },
    { title: "MKT", dataIndex: "mkt", key: "mkt" },
    { title: "ĐƠN", dataIndex: "saleReport", key: "saleReport" },
    {
      title: "THANH TOÁN",
      dataIndex: "paymentStatus",
      key: "paymentStatus",
      render: (text) => (
        <Tag color={text === "ĐÃ THANH TOÁN" ? "green" : "red"}>{text}</Tag>
      )
    },
    { title: "GHI CHÚ SALE", dataIndex: "note", key: "note" },
    {
      title: "TÌNH TRẠNG GH",
      dataIndex: "deliveryStatus",
      key: "deliveryStatus",
      render: (text) => (
        <Tag color={text === "GIAO THÀNH CÔNG" ? "blue" : "orange"}>{text}</Tag>
      )
    },
    { title: "MÃ VẬN ĐƠN", dataIndex: "trackingCode", key: "trackingCode" },
    {
      title: "NGÀY GỬI",
      dataIndex: "shippingDate1",
      key: "shippingDate1",
      render: (text) => text && dayjs(text).format("DD/MM/YYYY")
    },
    {
      title: "NGÀY NHẬN",
      dataIndex: "shippingDate2",
      key: "shippingDate2",
      render: (text) => text && dayjs(text).format("DD/MM/YYYY")
    },
    { title: "GHI CHÚ KHO", dataIndex: "noteKHO", key: "noteKHO" },
    { title: "TT XỬ LÍ", dataIndex: "processStatus", key: "processStatus" },
    // Thêm cột "Công ty đóng hàng" với Checkbox
    
    { title: "DOANH THU", dataIndex: "profit", key: "profit" }
  ];

  const columnsMKT = [
    {
      title: "NGÀY ĐẶT",
      dataIndex: "orderDate",
      key: "orderDate",
      render: (text) => dayjs(text).format("DD/MM/YYYY")
    },
    {
      title: "THANH TOÁN",
      dataIndex: "paymentStatus",
      key: "paymentStatus",
      render: (text) => (
        <Tag color={text === "ĐÃ THANH TOÁN" ? "green" : "red"}>{text}</Tag>
      )
    },
    { title: "TÊN KHÁCH", dataIndex: "customerName", key: "customerName" },
    { title: "TÊN PAGE", dataIndex: "pageName", key: "pageName" },
    {
      title: "SẢN PHẨM",
      key: "products",
      render: (_, record) => (
        <>
          {record.products &&
            record.products.map((item, index) => (
              <div key={index} style={{ whiteSpace: "nowrap" }}>
                <strong>{item.product} </strong> - SL :{" "}
                <strong>{item.quantity}</strong>
              </div>
            ))}
        </>
      )
    },
    { title: "MKT", dataIndex: "mkt", key: "mkt" },
    { title: "DOANH SỐ", dataIndex: "revenue", key: "revenue" },
    { title: "DOANH THU", dataIndex: "profit", key: "profit" },
    { title: "GHI CHÚ SALE", dataIndex: "note", key: "note" }
  ];

  const columnsKHO = [
    {
      title: "Thao Tác",
      key: "action",
      render: (_, record) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
        </Space>
      )
    },
    {
      title: "BÊN ĐÓNG HÀNG",
      key: "isShipping",
      dataIndex: "isShipping",
      render: (_, record) =>
        record.isShipping ? "Công ty đóng hàng" : "Kho đóng hàng"
    },
    { title: "STT", dataIndex: "stt", key: "stt" },
    {
      title: "NGÀY ĐẶT",
      dataIndex: "orderDate",
      key: "orderDate",
      render: (text) => dayjs(text).format("DD/MM/YYYY")
    },
    {
      title: "TÌNH TRẠNG GH",
      dataIndex: "deliveryStatus",
      key: "deliveryStatus",
      render: (text) => (
        <Tag color={text === "GIAO THÀNH CÔNG" ? "blue" : "orange"}>
          {text}
        </Tag>
      )
    },
    { title: "MÃ VẬN ĐƠN", dataIndex: "trackingCode", key: "trackingCode" },
    { title: "TÊN KHÁCH", dataIndex: "customerName", key: "customerName" },
    {
      title: "SẢN PHẨM",
      key: "products",
      render: (_, record) => (
        <>
          {record.products &&
            record.products.map((item, index) => (
              <div key={index} style={{ whiteSpace: "nowrap" }}>
                <strong>{item.product} </strong> - SL :{" "}
                <strong>{item.quantity}</strong>
              </div>
            ))}
        </>
      )
    },
    { title: "Phân loại QUÀ/SIZE/MÀU", dataIndex: "category", key: "category" },
    { title: "SĐT", dataIndex: "phone", key: "phone" },
    { title: "ĐỊA CHỈ", dataIndex: "address", key: "address" },
    { title: "GHI CHÚ SALE", dataIndex: "note", key: "note" },
    { title: "GHI CHÚ KHO", dataIndex: "noteKHO", key: "noteKHO" },
    {
      title: "NGÀY GỬI",
      dataIndex: "shippingDate1",
      key: "shippingDate1",
      render: (text) => text && dayjs(text).format("DD/MM/YYYY")
    },
    {
      title: "NGÀY NHẬN",
      dataIndex: "shippingDate2",
      key: "shippingDate2",
      render: (text) => text && dayjs(text).format("DD/MM/YYYY")
    }
  ];

  // Xử lý mở form thêm mới, sửa và xóa đơn hàng
  const handleAddNew = () => {
    setCurrentEditId(null);
    setFormVisible(true);
  };

  const handleEdit = (order) => {
    setCurrentEditId(order.id);
    setFormVisible(true);
  };

  const handleDelete = (id) => {
    setOrders((prev) => prev.filter((order) => order.id !== id));
    message.success("Xóa đơn hàng thành công");
  };

  const handleSubmit = (values) => {
    const revenue = Number(values.revenue) || 0;
    const profit = revenue === 0 ? 0 : Math.max(revenue - 5, 0);
    const products = values.products || [];
    const newOrder = {
      ...values,
      id: currentEditId || Date.now().toString(),
      stt: currentEditId
        ? orders.find((order) => order.id === currentEditId)?.stt
        : orders.filter(
            (order) =>
              dayjs(order.orderDate).format("YYYY-MM") ===
              dayjs(values.orderDate).format("YYYY-MM")
          ).length + 1,
      revenue,
      profit,
      products,
      customerName: values.customerName || "",
      pageName: values.pageName || "",
      category: values.category || "",
      mass: values.mass || "",
      mkt: values.mkt || "",
      sale: values.sale || "",
      salexuly: values.salexuly || "",
      phone: values.phone || "",
      address: values.address || "",
      note: values.note || "",
      noteKHO: values.noteKHO || "",
      processStatus: values.processStatus || "",
      saleReport: values.saleReport || "",
      paymentStatus: values.paymentStatus || "",
      deliveryStatus: values.deliveryStatus || "",
      trackingCode: values.trackingCode || "",
      orderDate: values.orderDate || "",
      shippingDate1: values.shippingDate1 || "",
      shippingDate2: values.shippingDate2 || "",
      employee_code_order: currentUser.employee_code,
    };

    setOrders((prev) =>
      currentEditId
        ? prev.map((order) => (order.id === currentEditId ? newOrder : order))
        : [...prev, newOrder]
    );
    setFormVisible(false);
    message.success(
      currentEditId ? "Cập nhật thành công" : "Thêm mới thành công"
    );
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          onClick={handleAddNew}
          disabled={
            currentUser.position_team === "mkt" ||
            currentUser.position_team === "kho" ||
            currentUser.position === "salexuly" ||
            currentUser.position === "salexacnhan"
          }
        >
          Thêm đơn hàng mới
        </Button>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <RangePicker
            allowClear
            format="DD/MM/YYYY"
            onChange={(dates) => setDateRange(dates)}
            style={{ width: "100%" }}
          />
        </Col>
        <Col span={6}>
          <Search
            placeholder="Tìm kiếm..."
            allowClear
            onSearch={setSearchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </Col>
        <Col span={6}>
          <Select
            mode="multiple"
            style={{ width: "100%" }}
            placeholder="Chọn bộ lọc"
            allowClear
            options={[
              { value: "today", label: "Đơn mới trong ngày" },
              { value: "done", label: "Đơn đã Done" },
              { value: "waiting_done", label: "Đơn chưa Done" },
              { value: "isshiping", label: "Công Ty đóng hàng" },
             
              { value: "not_delivered", label: "Đã gửi hàng" },
              { value: "delivered", label: "Giao thành công" },
              { value: "unpaid_success", label: "Chưa thanh toán & Giao Thành công" },
              { value: "unpaid", label: "Chưa thanh toán" },
              { value: "paid", label: "Đã thanh toán" },
              { value: "duplicate_name", label: "Trùng tên khách" },
              { value: "duplicate_phone", label: "Trùng số điện thoại" },
              { value: "waiting_approval", label: "Đợi xác nhận" }
            ]}
            onChange={(values) => setSelectedFilters(values)}
          />
        </Col>
        <Col span={3}>
          <Select
            disabled={
              currentUser.position === "mkt" ||
              currentUser.position === "salenhapdon" ||
              currentUser.position === "salexuly"
            }
            placeholder="Chọn Sale"
            options={saleOptions.map((s) => ({ value: s, label: s }))}
            onChange={(value) => setSelectedSale(value)}
            allowClear
            showSearch
          />
        </Col>
        <Col span={3}>
          <Select
            disabled={
              currentUser.position === "mkt" ||
              currentUser.position === "salenhapdon" ||
              currentUser.position === "salexuly"
            }
            placeholder="Chọn MKT"
            options={mktOptions.map((m) => ({ value: m, label: m }))}
            onChange={(value) => setSelectedMKT(value)}
            allowClear
            showSearch
          />
        </Col>
      </Row>

      <Table
        columns={
          currentUser.position_team === "kho"
            ? columnsKHO
            : currentUser.position_team === "mkt"
            ? columnsMKT
            : columns
        }
        dataSource={[...filteredOrders].sort((a, b) => b.stt - a.stt)}
        rowKey="id"
        scroll={{ x: 2500 }}
        bordered
        pagination={{ pageSize: 10 }}
      />

      <OrderForm
        visible={formVisible}
        onCancel={() => setFormVisible(false)}
        onSubmit={handleSubmit}
        initialValues={orders.find((order) => order.id === currentEditId)}
        namesalexuly={namesalexuly}
      />
    </div>
  );
};

export default OrderList;
