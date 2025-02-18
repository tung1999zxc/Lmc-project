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
import dayjs from "dayjs";
import OrderForm from "./OrderForm";
import isBetween from "dayjs/plugin/isBetween";
import { useDispatch, useSelector } from "react-redux";




// OrderList Component
const OrderList = () => {
  const currentUser = useSelector((state) => state.user.currentUser);
  const employees = useSelector((state) => state.employees.employees);
  // Khởi tạo state cho đơn hàng, đọc từ localStorage nếu có
  const [orders, setOrders] = useState([]);
  const [currentEditId, setCurrentEditId] = useState(null);
  const [formVisible, setFormVisible] = useState(false);
  const [dateRange, setDateRange] = useState(undefined);
  const [searchText, setSearchText] = useState("");
  const [namesalexuly, setnamesalexuly] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("");
  const [selectedSale, setSelectedSale] = useState(undefined);
  const [selectedMKT, setSelectedMKT] = useState(undefined);
 

  const leadTeamMembers = employees
  .filter(employee => employee.team_id === currentUser.team_id)
  .map(employee => employee.name);

  const { RangePicker } = DatePicker;
  const { Search } = Input;
  dayjs.extend(isBetween);
  // Danh sách options
  const mktOptions = employees
  .filter(order => order.position_team === 'mkt')
  .map(order => order.name);
 
 
  const saleOptions = employees
  .filter(order => order.position_team === 'sale')
  .map(order => order.name);
  const salexulyOptions = employees
  .filter(order => order.position === 'salexuly')
  .map(order => order.name);
  // Giả lập quyền của người dùng: NVKHO = true nếu người dùng là kho, NVMKT = true nếu là MKT
 

  // Lấy đơn hàng từ localStorage khi component mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedOrders = localStorage.getItem("orders");
      if (savedOrders) {
        setOrders(JSON.parse(savedOrders));
      }
     
    }
  }, []);

  // Lưu đơn hàng vào localStorage mỗi khi orders thay đổi (chỉ chạy trên client)
  useEffect(() => {
    if (typeof window !== "undefined" && orders && orders.length > 0) {
      localStorage.setItem("orders", JSON.stringify(orders));
    }
  }, [orders]);
  useEffect(() => {
    // Hàm chuyển đổi ngày theo giờ địa phương sang chuỗi "YYYY-MM-DD"
    const getLocalDateString = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };
  
    // Lấy ngày hôm nay theo giờ địa phương (để khớp với order.orderDate)
    const todayStr = getLocalDateString(new Date());
    console.log("Today String:", todayStr);
  
    // Lọc các đơn hàng có orderDate là todayStr và saleReport === "DONE"
    const filteredOrders = orders.filter(
      (order) => order.orderDate === todayStr 
    );
    console.log("Filtered Orders:", filteredOrders);
  
    // Nếu không có đơn hàng nào trong ngày, reset state và thoát
    if (filteredOrders.length === 0) {
      setnamesalexuly("");
      return;
    }
  
    // Tính số đơn hàng đã xử lý theo từng nhân viên (salexulyOptions là mảng tên nhân viên)
    const employeeOrderCounts = salexulyOptions.map((employee) => ({
      name: employee,
      count: filteredOrders.filter((order) => order.salexuly === employee).length,
    }));
    console.log("Employee Order Counts:", employeeOrderCounts);
  
    // Tìm số đơn hàng ít nhất
    const minCount = Math.min(...employeeOrderCounts.map((emp) => emp.count));
    console.log("Min Count:", minCount);
  
    // Tìm nhân viên đầu tiên có số đơn bằng minCount
    const selectedEmployee = employeeOrderCounts.find(
      (emp) => emp.count === minCount
    );
    console.log("Selected Employee:", selectedEmployee);
  
    // Nếu tìm được, cập nhật state namesalexuly
    if (selectedEmployee) {
      setnamesalexuly(selectedEmployee.name);
    }
  }, [orders, salexulyOptions]);

  // Lọc đơn hàng theo ngày, từ khóa tìm kiếm và các bộ lọc khác
  const filteredOrders = useMemo(() => {
    // Bước 1: Lọc theo vai trò của người dùng
    let roleFilteredOrders = [...orders];
    
    if (currentUser.position === "mkt") {
      roleFilteredOrders = roleFilteredOrders.filter(
        (order) => order.mkt === currentUser.name
      );
    } else if (currentUser.position === "salenhapdon") {
      roleFilteredOrders = roleFilteredOrders.filter(
        (order) => order.employee_code_order === currentUser.employee_code
      );
    } else if (currentUser.position === "salexuly") {
     
      roleFilteredOrders = roleFilteredOrders.filter(
        (order) =>( order.salexuly === currentUser.name && order.saleReport  === 'DONE')
      );
    } else if (currentUser.position_team === "kho") {
      roleFilteredOrders = roleFilteredOrders.filter(
        (order) => order.saleReport  === 'DONE'
      );
    } else if (currentUser.position === "lead") {
      // lead chỉ thấy đơn hàng mà trường mkt nằm trong danh sách thành viên của team
      roleFilteredOrders = roleFilteredOrders.filter((order) =>
        leadTeamMembers.includes(order.mkt)
      );
    } else if (
      currentUser.position === "managerMKT" ||
      currentUser.position === "managerSALE"
    ) {
      // Với manager, có thể thêm logic lọc theo team nếu manager chọn team cụ thể,
      // hoặc nếu chọn "all" thì không cần lọc thêm.
      // Ví dụ: nếu có biến selectedTeam, ta có thể viết:
      // roleFilteredOrders = selectedTeam
      //   ? roleFilteredOrders.filter(order => order.team === selectedTeam)
      //   : roleFilteredOrders;
      // Hiện tại ta trả về tất cả đơn hàng cho manager.
    }
  
    // Bước 2: Áp dụng các bộ lọc chung (ngày, tìm kiếm, và các filter khác)
    return roleFilteredOrders.filter((order) => {
      // Kiểm tra lọc theo ngày
      const dateMatch = dateRange
        ? dayjs(order.orderDate).isBetween(dateRange[0], dateRange[1], "day", "[]")
        : true;
  
      // Kiểm tra tìm kiếm theo từ khoá
      const searchMatch = searchText
        .toLowerCase()
        .split(" ")
        .every((term) =>
          Object.values(order).some((value) =>
            String(value).toLowerCase().includes(term)
          )
        );
  
      // Kiểm tra các filter được chọn
      let filterMatch = true;
      switch (selectedFilter) {
        case "today":
          filterMatch = dayjs(order.orderDate).isSame(dayjs(), "day");
          break;
        case "not_delivered":
          // Nếu đơn đã thanh toán thì không tính là "not_delivered"
          filterMatch =
            order.deliveryStatus === "ĐÃ GỬI HÀNG" &&
            order.deliveryStatus !== "ĐÃ THANH TOÁN";
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
        case "done":
          filterMatch = order.saleReport === "DONE";
          break;
        case "waiting_done":
          filterMatch = order.saleReport !== "DONE";
          break;
        case "same_sale":
          filterMatch = selectedSale ? order.sale === selectedSale : true;
          break;
        case "same_mkt":
          filterMatch = selectedMKT ? order.mkt === selectedMKT : true;
          break;
        default:
          filterMatch = true;
      }
  
      return dateMatch && searchMatch && filterMatch;
    });
    return roleFilteredOrders.sort((a, b) => {
      return dayjs(b.orderDate).valueOf() - dayjs(a.orderDate).valueOf();
    });
  }, [
    orders,
    dateRange,
    searchText,
    selectedFilter,
    selectedSale,
    selectedMKT,
    currentUser,
    leadTeamMembers
  ]);
  // Các cột cho bảng (cho tất cả các user)
  const columns = [
    {
      title: "Thao Tác",
      key: "action",
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm  title="Xóa đơn hàng?" onConfirm={() => handleDelete(record.id)}>
            <Button danger disabled={currentUser.position=== 'salenhapdon'||currentUser.position=== 'salexacnhan'||currentUser.position=== 'salexuly'} icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>    
      )
    },
    // {
    //   title: "STT",
    //   dataIndex: "stt",
    //   key: "orderDate1",
      
    // },
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
    {
      title: "TÌNH TRẠNG GH",
      dataIndex: "deliveryStatus",
      key: "deliveryStatus",
      render: (text) => (
        <Tag color={text === "GIAO THÀNH CÔNG" ? "blue" : "orange"}>{text}</Tag>
      )
    },
    { title: "SALE BÁO", dataIndex: "saleReport", key: "saleReport" },
    { title: "MÃ VẬN ĐƠN", dataIndex: "trackingCode", key: "trackingCode" },
    { title: "TÊN KHÁCH", dataIndex: "customerName", key: "customerName" },
    { title: "TÊN PAGE", dataIndex: "pageName", key: "pageName" },
    { title: "SẢN PHẨM", dataIndex: "product", key: "product" },
    { title: "Phân loại QUÀ/SIZE/MÀU", dataIndex: "category", key: "category" },
    { title: "SL SP", dataIndex: "quantity", key: "quantity" },
    { title: "Hàng nặng/nhẹ", dataIndex: "mass", key: "quantity" },
    { title: "MKT", dataIndex: "mkt", key: "mkt" },
    { title: "SALE", dataIndex: "sale", key: "sale" },
    { title: "SALE xử lý", dataIndex: "salexuly", key: "salexuly" },
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
      render: (text) => text && dayjs(text).format("DD/MM/YYYY")
    },
    {
      title: "NGÀY NHẬN",
      dataIndex: "shippingDate2",
      key: "shippingDate2",
      render: (text) => text && dayjs(text).format("DD/MM/YYYY")
    }
  ];

  // Các cột cho MKT (ví dụ)
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
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
        </Space>
      )
    },
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
        <Tag color={text === "GIAO THÀNH CÔNG" ? "blue" : "orange"}>{text}</Tag>
      )
    },
    { title: "MÃ VẬN ĐƠN", dataIndex: "trackingCode", key: "trackingCode" },
    { title: "TÊN KHÁCH", dataIndex: "customerName", key: "customerName" },
    { title: "SẢN PHẨM", dataIndex: "product", key: "product" },
    { title: "Phân loại QUÀ/SIZE/MÀU", dataIndex: "category", key: "category" },
    { title: "SL SP", dataIndex: "quantity", key: "quantity" },
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

  // Xử lý mở form thêm mới
  const handleAddNew = () => {
    setCurrentEditId(null);
    setFormVisible(true);
  };

  // Xử lý sửa đơn hàng: mở form và lưu id cần sửa
  const handleEdit = (order) => {
    setCurrentEditId(order.id);
    setFormVisible(true);
  };

  // Xử lý xóa đơn hàng
  const handleDelete = (id) => {
    setOrders((prev) => prev.filter((order) => order.id !== id));
    message.success("Xóa đơn hàng thành công");
  };

  // Xử lý submit từ OrderForm
  const handleSubmit = (values) => {
    const revenue = Number(values.revenue) || 0;
    const profit = revenue === 0 ? 0 : Math.max(revenue - 5, 0);
        const newOrder = {
          ...values,
          id: currentEditId || Date.now().toString(),
          stt: currentEditId 
    ? orders.find(order => order.id === currentEditId)?.stt 
    : orders.length + 1,
          quantity: values.quantity || 0, 
          revenue: revenue,
          profit: profit,
      customerName: values. customerName || "",
      pageName: values.pageName || "",
      product: values.product || "",
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
      employee_code_order: currentUser.employee_code
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
 
 // lọc theo quyền
  
  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={handleAddNew} disabled= {currentUser.position_team ==='mkt'||currentUser.position_team ==='kho'||currentUser.position ==='salexuly'||currentUser.position ==='salexacnhan'}>
          Thêm đơn hàng mới
        </Button>
      </div>

 

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <RangePicker allowClear
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
            style={{ width: "100%" }}
            placeholder="Chọn bộ lọc"
            allowClear
            options={[
              
              { value: "today", label: "Đơn mới trong ngày" },
              { value: "done", label: "Đơn đã Done" },
              { value: "waiting_done", label: "Đơn chưa Done" },
              { value: "not_delivered", label: "Đã gửi hàng" },
              { value: "delivered", label: "Giao thành công" },
              { value: "unpaid_success", label: "Chưa thanh toán & Giao Thành công" },
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
        columns={currentUser.position_team ==='kho' ? columnsKHO : currentUser.position_team ==='mkt' ? columnsMKT : columns}
        dataSource={filteredOrders.sort((a, b) => {
          return dayjs(b.orderDate).valueOf() - dayjs(a.orderDate).valueOf();
        })}
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
