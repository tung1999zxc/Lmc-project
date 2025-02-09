"use client";
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
  Tag
} from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { useState, useMemo, useEffect } from "react";
import dayjs, { Dayjs } from "dayjs";
import OrderForm from "./OrderForm";
import isBetween from "dayjs/plugin/isBetween";

dayjs.extend(isBetween);

const { RangePicker } = DatePicker;
const { Search } = Input;

// Danh sách options
const mktOptions: string[] = [
  "Phi-HC",
  "V.Phi",
  "P.Thành",
  "Linh",
  "Diện",
  "Chi",
  "Phong",
  "Tuấn",
  "T.Nhung",
  "Sơn",
  "Tuấn Anh",
  "Lâm",
  "N.Linh",
  "Nhung",
  "Ly",
  "Diệu",
  "Quân",
  "Thành",
  "D.Linh",
  "Thìn",
  "Hiền",
  "Lan",
  "Anh",
  "H.Ly",
  "Thụ",
  "Sáng",
  "Cương",
  "Đức"
];
const saleOptions: string[] = [
  "Hạnh-TM",
  "Diệp",
  "Anh",
  "Huyền",
  "Mai",
  "Phương",
  "Giang",
  "Tâm",
  "Yến",
  "Ngọc",
  "Tuyền",
  "H.Ngọc",
  "Linh",
  "Nhi",
  "Trang",
  "U.Nhi",
  "Thành",
  "T.Phương",
  "Kha"
];

// Định nghĩa kiểu cho đơn hàng
export interface Order {
  id: string;
  orderDate: string;
  stt: number;
  customerName: string;
  pageName: string;
  product: string;
  category: string;
  quantity: number;
  mkt: string;
  sale: string;
  revenue: number;
  profit: number;
  phone: string;
  address: string;
  note: string;
  noteKHO: string;
  processStatus: string;
  saleReport: string;
  paymentStatus: string;
  deliveryStatus: string;
  trackingCode: string;
  shippingDate1: string;
  shippingDate2: string;
}

// Định nghĩa kiểu cho dữ liệu submit của OrderForm (các ngày chuyển về chuỗi)
export interface OrderFormSubmitValues {
  orderDate?: string | null;
  shippingDate1?: string | null;
  shippingDate2?: string | null;
  deliveryStatus?: string;
  trackingCode?: string;
  noteKHO?: string;
  stt?: number;
  customerName?: string;
  pageName?: string;
  product?: string;
  profit?: number;
  phone?: string;
  address?: string;
  note?: string;
  category?: string;
  quantity?: number;
  mkt?: string;
  sale?: string;
  revenue?: number;
  processStatus?: string;
  saleReport?: string;
  paymentStatus?: string;
}

// OrderList Component
const OrderList = () => {
  // Khởi tạo state cho đơn hàng, đọc từ localStorage nếu có
  const [orders, setOrders] = useState<Order[]>(() => {
    const savedOrders = localStorage.getItem("orders");
    return savedOrders ? (JSON.parse(savedOrders) as Order[]) : [];
  });
  const [currentEditId, setCurrentEditId] = useState<string | null>(null);
  const [formVisible, setFormVisible] = useState<boolean>(false);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | undefined>(undefined);
  const [searchText, setSearchText] = useState<string>("");
  const [selectedFilter, setSelectedFilter] = useState<string>("");
  const [selectedSale, setSelectedSale] = useState<string | undefined>(undefined);
  const [selectedMKT, setSelectedMKT] = useState<string | undefined>(undefined);

  // Giả lập quyền của người dùng: NVKHO = true nếu người dùng là kho, NVMKT = true nếu là MKT
  const NVKHO = false;
  const NVMKT = false;

  // Lưu đơn hàng vào localStorage mỗi khi orders thay đổi
  useEffect(() => {
    localStorage.setItem("orders", JSON.stringify(orders));
  }, [orders]);

  // Lọc đơn hàng theo ngày, từ khóa tìm kiếm và các bộ lọc khác
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const dateMatch = dateRange
        ? dayjs(order.orderDate).isBetween(dateRange[0], dateRange[1], "day", "[]")
        : true;

      const searchMatch = searchText
        .toLowerCase()
        .split(" ")
        .every((term) =>
          Object.values(order).some((value) =>
            String(value).toLowerCase().includes(term)
          )
        );

      let filterMatch = true;
      switch (selectedFilter) {
        case "today":
          filterMatch = dayjs(order.orderDate).isSame(dayjs(), "day");
          break;
        case "not_delivered":
          filterMatch = order.deliveryStatus === "ĐÃ GỬI HÀNG";
          break;
        case "delivered":
          filterMatch = order.deliveryStatus === "GIAO THÀNH CÔNG";
          break;
        case "unpaid_success":
          filterMatch =
            order.paymentStatus === "CHƯA THANH TOÁN" &&
            order.deliveryStatus === "GIAO THÀNH CÔNG";
          break;
        case "unpaid":
          filterMatch = order.paymentStatus === "CHƯA THANH TOÁN";
          break;
        case "paid":
          filterMatch = order.paymentStatus === "ĐÃ THANH TOÁN";
          break;
        case "duplicate_name":
          filterMatch =
            orders.filter((o) => o.customerName === order.customerName).length > 1;
          break;
        case "duplicate_phone":
          filterMatch =
            orders.filter((o) => o.phone === order.phone).length > 1;
          break;
        case "waiting_approval":
          filterMatch = order.saleReport === "ĐỢI XN";
          break;
        case "same_sale":
          filterMatch = selectedSale ? order.sale === selectedSale : true;
          break;
        case "same_mkt":
          filterMatch = selectedMKT ? order.mkt === selectedMKT : true;
          break;
        default:
          break;
      }

      return dateMatch && searchMatch && filterMatch;
    });
  }, [orders, dateRange, searchText, selectedFilter, selectedSale, selectedMKT]);

  // Hàm nhóm đơn hàng theo tên khách (hoặc bất kỳ trường nào bạn muốn nhóm)
  // const groupOrdersByCustomer = (ordersList: Order[]): Record<string, Order[]> => {
  //   return ordersList.reduce<Record<string, Order[]>>((acc, order) => {
  //     const key = order.customerName;
  //     if (!acc[key]) {
  //       acc[key] = [];
  //     }
  //     acc[key].push(order);
  //     return acc;
  //   }, {});
  // };

  // Các cột cho bảng (cho tất cả các user)
  const columns = [
    {
      title: "Thao Tác",
      key: "action",
      render: (_: unknown, record: Order) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm title="Xóa đơn hàng?" onConfirm={() => handleDelete(record.id)}>
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    },
    {
      title: "NGÀY ĐẶT",
      dataIndex: "orderDate",
      key: "orderDate",
      render: (text: string) => dayjs(text).format("DD/MM/YYYY")
    },
    {
      title: "THANH TOÁN",
      dataIndex: "paymentStatus",
      key: "paymentStatus",
      render: (text: string) => (
        <Tag color={text === "ĐÃ THANH TOÁN" ? "green" : "red"}>{text}</Tag>
      )
    },
    {
      title: "TÌNH TRẠNG GH",
      dataIndex: "deliveryStatus",
      key: "deliveryStatus",
      render: (text: string) => (
        <Tag color={text === "GIAO THÀNH CÔNG" ? "blue" : "orange"}>{text}</Tag>
      )
    },
    { title: "SALE BÁO", dataIndex: "saleReport", key: "saleReport" },
    { title: "MÃ VẬN ĐƠN", dataIndex: "trackingCode", key: "trackingCode" },
    { title: "TÊN KHÁCH", dataIndex: "customerName", key: "customerName" },
    { title: "TÊN PAGE", dataIndex: "pageName", key: "pageName" },
    { title: "SẢN PHẨM", dataIndex: "product", key: "product" },
    { title: "Phân loại", dataIndex: "category", key: "category" },
    { title: "SL SP", dataIndex: "quantity", key: "quantity" },
    { title: "MKT", dataIndex: "mkt", key: "mkt" },
    { title: "SALE", dataIndex: "sale", key: "sale" },
    { title: "DOANH SỐ", dataIndex: "revenue", key: "revenue" },
    { title: "DOANH THU", dataIndex: "profit", key: "profit" },
    { title: "SĐT", dataIndex: "phone", key: "phone" },
    { title: "ĐỊA CHỈ", dataIndex: "address", key: "address" },
    { title: "GHI CHÚ SALE", dataIndex: "note", key: "note" },
    { title: "GHI CHÚ KHO", dataIndex: "noteKHO", key: "noteKHO" },
    { title: "TT XỬ LÍ", dataIndex: "processStatus", key: "processStatus" },
    {
      title: "NGÀY GỬI",
      dataIndex: "shippingDate1",
      key: "shippingDate1",
      render: (text: string) => text && dayjs(text).format("DD/MM/YYYY")
    },
    {
      title: "NGÀY NHẬN",
      dataIndex: "shippingDate2",
      key: "shippingDate2",
      render: (text: string) => text && dayjs(text).format("DD/MM/YYYY")
    }
  ];

  // Các cột cho MKT (ví dụ)
  const columnsMKT = [
    {
      title: "NGÀY ĐẶT",
      dataIndex: "orderDate",
      key: "orderDate",
      render: (text: string) => dayjs(text).format("DD/MM/YYYY")
    },
    {
      title: "THANH TOÁN",
      dataIndex: "paymentStatus",
      key: "paymentStatus",
      render: (text: string) => (
        <Tag color={text === "ĐÃ THANH TOÁN" ? "green" : "red"}>{text}</Tag>
      )
    },
    { title: "TÊN KHÁCH", dataIndex: "customerName", key: "customerName" },
    { title: "TÊN PAGE", dataIndex: "pageName", key: "pageName" },
    { title: "SẢN PHẨM", dataIndex: "product", key: "product" },
    { title: "SL SP", dataIndex: "quantity", key: "quantity" },
    { title: "MKT", dataIndex: "mkt", key: "mkt" },
    { title: "DOANH SỐ", dataIndex: "revenue", key: "revenue" },
    { title: "DOANH THU", dataIndex: "profit", key: "profit" },
    { title: "GHI CHÚ SALE", dataIndex: "note", key: "note" }
  ];

  // Các cột cho KHO (ví dụ)
  const columnsKHO = [
    {
      title: "Thao Tác",
      key: "action",
      render: (_: unknown, record: Order) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
        </Space>
      )
    },
    {
      title: "NGÀY ĐẶT",
      dataIndex: "orderDate",
      key: "orderDate",
      render: (text: string) => dayjs(text).format("DD/MM/YYYY")
    },
    {
      title: "TÌNH TRẠNG GH",
      dataIndex: "deliveryStatus",
      key: "deliveryStatus",
      render: (text: string) => (
        <Tag color={text === "GIAO THÀNH CÔNG" ? "blue" : "orange"}>{text}</Tag>
      )
    },
    { title: "MÃ VẬN ĐƠN", dataIndex: "trackingCode", key: "trackingCode" },
    { title: "TÊN KHÁCH", dataIndex: "customerName", key: "customerName" },
    { title: "SẢN PHẨM", dataIndex: "product", key: "product" },
    { title: "Phân loại", dataIndex: "category", key: "category" },
    { title: "SL SP", dataIndex: "quantity", key: "quantity" },
    { title: "SĐT", dataIndex: "phone", key: "phone" },
    { title: "ĐỊA CHỈ", dataIndex: "address", key: "address" },
    { title: "GHI CHÚ SALE", dataIndex: "note", key: "note" },
    { title: "GHI CHÚ KHO", dataIndex: "noteKHO", key: "noteKHO" },
    {
      title: "NGÀY GỬI",
      dataIndex: "shippingDate1",
      key: "shippingDate1",
      render: (text: string) => text && dayjs(text).format("DD/MM/YYYY")
    },
    {
      title: "NGÀY NHẬN",
      dataIndex: "shippingDate2",
      key: "shippingDate2",
      render: (text: string) => text && dayjs(text).format("DD/MM/YYYY")
    }
  ];

  // Xử lý mở form thêm mới
  const handleAddNew = (): void => {
    setCurrentEditId(null);
    setFormVisible(true);
  };

  // Xử lý sửa đơn hàng: mở form và lưu id cần sửa
  const handleEdit = (order: Order): void => {
    setCurrentEditId(order.id);
    setFormVisible(true);
  };

  // Xử lý xóa đơn hàng
  const handleDelete = (id: string): void => {
    setOrders((prev) => prev.filter((order) => order.id !== id));
    message.success("Xóa đơn hàng thành công");
  };

  // Định nghĩa kiểu cho dữ liệu submit từ OrderForm
  const handleSubmit = (values: OrderFormSubmitValues): void => {
    const newOrder: Order = {
      ...values,
      id: currentEditId || Date.now().toString(),
      // Ép kiểu các trường số nếu cần (nếu values chứa undefined, bạn có thể xử lý thêm)
      stt: values.stt || 0,
      quantity: values.quantity || 0,
      revenue: values.revenue || 0,
      profit: values.profit || 0,
      // Các trường khác nếu undefined thì chuyển thành chuỗi rỗng (tùy theo yêu cầu)
      customerName: values.customerName || "",
      pageName: values.pageName || "",
      product: values.product || "",
      category: values.category || "",
      mkt: values.mkt || "",
      sale: values.sale || "",
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
      shippingDate2: values.shippingDate2 || ""
    };

    setOrders((prev) => {
      const updatedOrders = currentEditId
        ? prev.map((order) => (order.id === currentEditId ? newOrder : order))
        : [...prev, newOrder];
      return updatedOrders;
    });
    setFormVisible(false);
    message.success(currentEditId ? "Cập nhật thành công" : "Thêm mới thành công");
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={handleAddNew}>
          Thêm đơn hàng mới
        </Button>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <RangePicker
            format="DD/MM/YYYY"
            onChange={(dates) =>
              setDateRange(dates as [Dayjs, Dayjs])
            }
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
            style={{ width: "100%" }}
            placeholder="Chọn bộ lọc"
            options={[
              { value: "today", label: "Đơn mới trong ngày" },
              { value: "not_delivered", label: "Đã gửi hàng" },
              { value: "delivered", label: "Giao thành công" },
              {
                value: "unpaid_success",
                label: "Chưa thanh toán & Giao Thành công"
              },
              { value: "unpaid", label: "Chưa thanh toán" },
              { value: "paid", label: "Đã thanh toán" },
              { value: "duplicate_name", label: "Trùng tên khách" },
              { value: "duplicate_phone", label: "Trùng số điện thoại" },
              { value: "waiting_approval", label: "Đợi xác nhận" },
              { value: "same_sale", label: "Cùng Sale" },
              { value: "same_mkt", label: "Cùng MKT" }
            ]}
            onChange={(value) => setSelectedFilter(value)}
          />
        </Col>
        <Col span={3}>
          <Select
            placeholder="Chọn Sale"
            options={saleOptions.map((s) => ({ value: s, label: s }))}
            onChange={(value) => setSelectedSale(value)}
            allowClear
            showSearch
          />
        </Col>
        <Col span={3}>
          <Select
            placeholder="Chọn MKT"
            options={mktOptions.map((m) => ({ value: m, label: m }))}
            onChange={(value) => setSelectedMKT(value)}
            allowClear
            showSearch
          />
        </Col>
      </Row>

      <Table
        columns={NVKHO ? columnsKHO : NVMKT ? columnsMKT : columns}
        dataSource={filteredOrders}
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
      />
    </div>
  );
};

export default OrderList;
