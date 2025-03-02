"use client";
import React, { useState,useRef, useMemo, useEffect } from "react";
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
import axios from "axios";
import moment from "moment";
import ExportExcelButton from "./exportOrdersToExcel.js";
// Gọi dayjs.extend bên ngoài component để không gọi lại mỗi lần render
dayjs.extend(isBetween);
import { useRouter } from 'next/navigation';

const OrderList = () => {
  // Lấy thông tin người dùng và danh sách nhân viên từ Redux
  const currentUser = useSelector((state) => state.user.currentUser);
  const router = useRouter(); 
  const roundRobinIndex = useRef(0); 
  useEffect(() => {
    if (!currentUser.name) {
      router.push("/login");
    }
  }, []);


  // Các state quản lý đơn hàng, form, filter, …
  const [orders, setOrders] = useState([]);
  const [currentEditId, setCurrentEditId] = useState(null);
  const [formVisible, setFormVisible] = useState(false);
  const [dateRange, setDateRange] = useState(undefined);
  const [searchText, setSearchText] = useState("");
  const [namesalexuly, setnamesalexuly] = useState("");
  // Cho phép chọn nhiều filter
  const [employees, setEmployees] = useState([]);
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [selectedSale, setSelectedSale] = useState(undefined);
  const [selectedMKT, setSelectedMKT] = useState(undefined);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const bangphu= selectedColumns.length;
  const [totalQuantities, setTotalQuantities] = useState({});
  const [initialOrders, setInitialOrders] = useState([]);
  const [isdemkho, setIsdemkho] = useState(true);
  const fetchEmployees = async () => {
      
      try {
        const response = await axios.get('/api/employees');
        // response.data.data chứa danh sách nhân viên theo API đã viết
        setEmployees(response.data.data);
      } catch (error) {
        console.error('Lỗi khi lấy danh sách nhân viên:', error);
        message.error('Lỗi khi lấy danh sách nhân viên');
      } finally {
       
      }
    };
   useEffect(() => {
    fetchOrders();
    fetchEmployees();
    
  }, []);
   
  
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
    const salexulyOptions = useMemo(() => {
      return employees
        .filter(emp => emp.position === "salexuly")
        .map(emp => emp.name);
    }, [employees]);

  // Lấy đơn hàng từ localStorage khi component mount
  // useEffect(() => {
  //   if (typeof window !== "undefined") {
  //     const savedOrders = localStorage.getItem("orders");
  //     if (savedOrders) {
  //       setOrders(JSON.parse(savedOrders));
  //     }
  //   }
  // }, []);
  

  const fetchOrders = async () => {
    try {
      const response = await axios.get("/api/orders");
      setOrders(response.data.data);
      setInitialOrders(response.data.data);
    } catch (error) {
      console.error(error);
      message.error("Lỗi khi lấy đơn hàng");
    }
  };
  

  // Lưu đơn hàng vào localStorage mỗi khi orders thay đổi
 

  // Tính toán chọn nhân viên salexuly dựa trên số đơn hàng của hôm nay
  useEffect(() => {
    if (currentUser.position === "salefull") {
      setnamesalexuly(currentUser.name);
      return;
    }
  
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
  
    // Tính số đơn hàng của từng nhân viên trong salexulyOptions
    const employeeOrderCounts = salexulyOptions.map((employee) => ({
      name: employee,
      count: filteredOrders.filter((order) => order.salexuly === employee).length,
    }));
  
    // Tìm số đơn tối thiểu
    const minCount = Math.min(...employeeOrderCounts.map((emp) => emp.count));
  
    // Lấy danh sách các ứng viên có số đơn bằng số nhỏ nhất
    let candidates = employeeOrderCounts.filter(
      (emp) => emp.count === minCount
    );
  
    // Sắp xếp các ứng viên theo thứ tự tên (để thứ tự luôn cố định)
    candidates.sort((a, b) => a.name.localeCompare(b.name));
  
    if (candidates.length > 0) {
      // Lấy ứng viên theo vòng tròn
      const index = roundRobinIndex.current % candidates.length;
      const selectedEmployee = candidates[index];
      // Tăng chỉ số roundRobin cho lần gọi sau
      roundRobinIndex.current += 1;
      setnamesalexuly(selectedEmployee.name);
    }
  }, [orders, salexulyOptions, currentUser]);

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
              case "ok":
                return order.saleReport === "OK";
              case "istick":
                return order.istick === true;
              case "notick":
                return order.istick === false;
              case "ero":
                return order.salexuly === "";
              case "waiting_done":
                return order.saleReport !== "DONE";
              case "khoshiping":
                return order.isShipping === false;
              case "isshiping":
                return order.isShipping === true;
              case "waitDelivered":
                return order.deliveryStatus === "";
              
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
  const calculateTotalQuantities = (orders) => {
    return orders.reduce((acc, order) => {
      if (order.products && Array.isArray(order.products)) {
        order.products.forEach((productItem) => {
          const { product, quantity } = productItem;
          // Ép quantity về kiểu số để thực hiện phép cộng số học
          const numQuantity = Number(quantity);
          acc[product] = (acc[product] || 0) + numQuantity;
        });
      }
      return acc;
    }, {});
  };
  // Hàm xử lý khi bấm nút tính tổng
  const handleCalculateTotals = () => {
    const totals = calculateTotalQuantities(filteredOrders);
    setTotalQuantities(totals);
  };
      
  const columns3 = Object.keys(totalQuantities).map((product) => ({
    title: product,          // Tiêu đề cột là tên sản phẩm
    dataIndex: product,      // Dữ liệu lấy từ key của đối tượng
    key: product,
  }));
  const dataSource3 = [
    {
      key: '1',
      ...totalQuantities,
    },
  ];
  // Hàm cập nhật checkbox "Công ty đóng hàng"
  const handleShippingChange = async (orderId, checked) => {
    try {
      const response = await axios.patch(`/api/orders/${orderId}/shipping`, {
        isShipping: checked,
      });
      message.success(response.data.message);
      // Sau khi cập nhật thành công, bạn có thể làm mới danh sách đơn hàng từ API
      fetchOrders();
    } catch (error) {
      console.error(error.response?.data?.error || error.message);
      message.error("Lỗi khi cập nhật trạng thái đóng hàng");
    }
  };
  const handleColumnSelect = (columnKey, checked) => {
    if (checked) {
      setSelectedColumns((prev) => [...prev, columnKey]);
    } else {
      setSelectedColumns((prev) => prev.filter((key) => key !== columnKey));
    }
  };
  // Các cột cho bảng (cho các vai trò khác nhau)
  const columns = [
    {
      title: "Thao Tác",
      key: "action",
      render: (_, record) => {        
        const disableEdit =
      currentUser.position === "salenhapdon" && record.saleReport === "DONE";
      return (
        <Space>
          <Button disabled={disableEdit} icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm title="Xóa đơn hàng?" onConfirm={() => handleDeleteOrder(record.id)}>
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
        </Space>)
      },
      width: 50,
    },
    {
      // Ví dụ với cột "NGÀY ĐẶT": thêm checkbox trong tiêu đề
      title: (
        <Checkbox
          checked={selectedColumns.includes("orderDate")}
          onChange={(e) => handleColumnSelect("orderDate", e.target.checked)}
        >
          NGÀY ĐẶT
        </Checkbox>
      ),
      dataIndex: "orderDate",
      key: "orderDate",
      render: (text) => dayjs(text).format("DD/MM"),
      width: 50,
    },
    // Ví dụ cho một cột khác có checkbox trong tiêu đề
        
    ...((currentUser.position === 'leadSALE' || currentUser.position === 'salexuly' || currentUser.position === 'managerSALE' || currentUser.position === 'admin')
      ? [
        {
          title: (
            <Checkbox
              checked={selectedColumns.includes("stt")}
              onChange={(e) => handleColumnSelect("stt", e.target.checked)}
            >
              STT
            </Checkbox>
          ),
          dataIndex: "stt",       
          key: "stt",
         
         
        },
        ]
      : []),
  

    {
      title: (
        <Checkbox
          checked={selectedColumns.includes("customerName")}
          onChange={(e) => handleColumnSelect("customerName", e.target.checked)}
        >
          TÊN KHÁCH
        </Checkbox>
      ),
      dataIndex: "customerName",
      key: "customerName"
    },
    {
      title: (
        <Checkbox
          checked={selectedColumns.includes("pageName")}
          onChange={(e) => handleColumnSelect("pageName", e.target.checked)}
        >
          TÊN PAGE
        </Checkbox>
      ),
      dataIndex: "pageName",
      key: "pageName",
    },
    ...(currentUser.position !== "salexuly"
      ? [
          {
            title:"Công ty đóng hàng", 
            key: "isShipping",
            dataIndex: "isShipping",
            render: (_, record) => (
              <Checkbox
                checked={record.isShipping}
                onChange={(e) =>
                  handleShippingChange(record.id, e.target.checked)
                }
              />
            ),
          },
        ]
      : []),
    {
      title: (
        <Checkbox
          checked={selectedColumns.includes("products")}
          onChange={(e) => handleColumnSelect("products", e.target.checked)}
        >
          SẢN PHẨM
        </Checkbox>
      ),
      key: "products",
      render: (_, record) => (
        <>
          {record.products &&
            record.products.map((item, index) => (
              <div key={index} style={{ whiteSpace: "nowrap" }}>
                <strong>{item.product} </strong> - SL: <strong>{item.quantity}</strong>
              </div>
            ))}
        </>
      ),
    },
    {
      title: (
        <Checkbox
          checked={selectedColumns.includes("category")}
          onChange={(e) => handleColumnSelect("category", e.target.checked)}
        >
          QUÀ
        </Checkbox>
      ),
      dataIndex: "category",
      key: "category",
    },
   
    {
      title: (
        <Checkbox
          checked={selectedColumns.includes("revenue")}
          onChange={(e) => handleColumnSelect("revenue", e.target.checked)}
        >
          DOANH SỐ
        </Checkbox>
      ),
      dataIndex: "revenue",
      key: "revenue",
    },
    {
      title: (
        <Checkbox
          checked={selectedColumns.includes("profit")}
          onChange={(e) => handleColumnSelect("profit", e.target.checked)}
        >
          DOANH THU
        </Checkbox>
      ),
      dataIndex: "profit",
      key: "profit",
    },
    {
      title: (
        <Checkbox
          checked={selectedColumns.includes("sale")}
          onChange={(e) => handleColumnSelect("sale", e.target.checked)}
        >
          SALE
        </Checkbox>
      ),
      dataIndex: "sale",
      key: "sale",
    },
    {
      title: (
        <Checkbox
          checked={selectedColumns.includes("salexuly")}
          onChange={(e) => handleColumnSelect("salexuly", e.target.checked)}
        >
          VẬN ĐƠN
        </Checkbox>
      ),
      dataIndex: "salexuly",
      key: "salexuly",
    },
    {
      title: (
        <Checkbox
          checked={selectedColumns.includes("mkt")}
          onChange={(e) => handleColumnSelect("mkt", e.target.checked)}
        >
          MKT
        </Checkbox>
      ),
      dataIndex: "mkt",
      key: "mkt",
    },
    {
      title: (
        <Checkbox
          checked={selectedColumns.includes("saleReport")}
          onChange={(e) => handleColumnSelect("saleReport", e.target.checked)}
        >
          ĐƠN
        </Checkbox>
      ),
      dataIndex: "saleReport",
      key: "saleReport",
    },
    {
      title: (
        <Checkbox
          checked={selectedColumns.includes("phone")}
          onChange={(e) => handleColumnSelect("phone", e.target.checked)}
        >
          SĐT
        </Checkbox>
      ),
      dataIndex: "phone",
      key: "phone",
    },
    {
      title: (
        <Checkbox
          checked={selectedColumns.includes("address")}
          onChange={(e) => handleColumnSelect("address", e.target.checked)}
        >
          ĐỊA CHỈ
        </Checkbox>
      ),
      dataIndex: "address",
      key: "address",
      render: (text) => <div style={{ width: 200,  }}>{text}</div>,
      
    },
    {
      title: (
        <Checkbox
          checked={selectedColumns.includes("paymentStatus")}
          onChange={(e) => handleColumnSelect("paymentStatus", e.target.checked)}
        >
          THANH TOÁN
        </Checkbox>
      ),
      dataIndex: "paymentStatus",
      key: "paymentStatus",
      render: (text) => (
        <Tag color={text === "ĐÃ THANH TOÁN" ? "green" : "red"}>{text}</Tag>
      ),
    },
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
      render: (text) => <div style={{ width: 200,  }}><h3>{text} </h3></div>,
    },
    {
      title: (
        <Checkbox
          checked={selectedColumns.includes("deliveryStatus")}
          onChange={(e) => handleColumnSelect("deliveryStatus", e.target.checked)}
        >
          TÌNH TRẠNG GH
        </Checkbox>
      ),
      dataIndex: "deliveryStatus",
      key: "deliveryStatus",
      render: (text) => (
        <Tag color={text === "GIAO THÀNH CÔNG" ? "blue" : "orange"}>{text}</Tag>
      ),
    },
    {
      title: (
        <Checkbox
          checked={selectedColumns.includes("trackingCode")}
          onChange={(e) => handleColumnSelect("trackingCode", e.target.checked)}
        >
          MÃ VẬN ĐƠN
        </Checkbox>
      ),
      dataIndex: "trackingCode",
      key: "trackingCode",
    },
    {
      title: (
        <Checkbox
          checked={selectedColumns.includes("shippingDate1")}
          onChange={(e) => handleColumnSelect("shippingDate1", e.target.checked)}
        >
          NGÀY GỬI
        </Checkbox>
      ),
      dataIndex: "shippingDate1",
      key: "shippingDate1",
      render: (text) => text && dayjs(text).format("DD/MM/YYYY"),
    },
    {
      title: (
        <Checkbox
          checked={selectedColumns.includes("shippingDate2")}
          onChange={(e) => handleColumnSelect("shippingDate2", e.target.checked)}
        >
          NGÀY NHẬN
        </Checkbox>
      ),
      dataIndex: "shippingDate2",
      key: "shippingDate2",
      render: (text) => text && dayjs(text).format("DD/MM/YYYY"),
    },
    {
      title: (
        <Checkbox
          checked={selectedColumns.includes("noteKHO")}
          onChange={(e) => handleColumnSelect("noteKHO", e.target.checked)}
        >
          GHI CHÚ KHO
        </Checkbox>
      ),
      dataIndex: "noteKHO",
      key: "noteKHO",
    },
    {
      title: (
        <Checkbox
          checked={selectedColumns.includes("processStatus")}
          onChange={(e) => handleColumnSelect("processStatus", e.target.checked)}
        >
          TT XỬ LÍ
        </Checkbox>
      ),
      dataIndex: "processStatus",
      key: "processStatus",
    },
  ];
// Lọc ra các cột đã được tick để hiển thị ở bảng phụ
const selectedTableColumns = columns.filter((col) =>
  selectedColumns.includes(col.key)
);
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

  const handleSelectAllIstick = (value) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        filteredOrders.some((fOrder) => fOrder.id === order.id)
          ? { ...order, istick: value }
          : order
      )
    );
  };
  const handleIstickChange = (orderId, value) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.id === orderId ? { ...order, istick: value } : order
      )
    );
  };
  
  const allRowsSelected = filteredOrders.length > 0 && filteredOrders.every(order => order.istick);
  
  const handleSaveIstick = async () => {
    // Lọc ra các đơn hàng mà giá trị istick đã thay đổi so với ban đầu
    const ordersToUpdate = orders.filter((order) => {
      const originalOrder = initialOrders.find((o) => o.id === order.id);
      // Nếu đơn hàng mới (không có trong initialOrders) hoặc có sự thay đổi về istick
      return !originalOrder || order.istick !== originalOrder.istick;
    });
  
    if (ordersToUpdate.length === 0) {
      message.info("Không có đơn hàng nào thay đổi");
      return;
    }
  
    try {
      // Gửi chỉ các trường cần cập nhật (id và istick)
      const response = await axios.post("/api/orders/updateIstick", {
        orders: ordersToUpdate.map(({ id, istick }) => ({ id, istick })),
      });
      message.success(response.data.message || "Đã lưu cập nhật các đơn");
      // Cập nhật lại initialOrders sau khi lưu để làm mốc mới
      setInitialOrders(orders);
      fetchOrders();
    } catch (error) {
      console.error(error);
      message.error("Lỗi khi lưu các đơn");
    }
  };

  const columnsKHO = [
    {
      title: "Thao Tác",
      key: "action",
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
        </Space>
      ),
    },
    {
      title: (<>
        <Checkbox
          checked={allRowsSelected}
          onChange={(e) => handleSelectAllIstick(e.target.checked)}
        >
          In đơn
        </Checkbox>
        <Button disabled={!searchText} type="primary" onClick={handleSaveIstick}>
        Lưu 
      </Button></>
      ),
      key: "istick",
      dataIndex: "istick",
      render: (_, record) => (
        <Checkbox
          checked={record.istick || false}
          onChange={(e) => handleIstickChange(record.id, e.target.checked)}
        />
      ),
    },
    {
      title: "BÊN ĐÓNG HÀNG",
      key: "isShipping",
      dataIndex: "isShipping",
      render: (_, record) =>
        record.isShipping ? "Công ty đóng hàng" : "Kho đóng hàng",
    },
    
        {
          title: (
            <Checkbox
              checked={selectedColumns.includes("stt")}
              onChange={(e) => handleColumnSelect("stt", e.target.checked)}
            >
              STT
            </Checkbox>
          ),
          dataIndex: "stt",       
          key: "stt",
        
         
        },
       
    {
      title: (
        <Checkbox
          checked={selectedColumns.includes("customerName")}
          onChange={(e) => handleColumnSelect("customerName", e.target.checked)}
        >
          TÊN KHÁCH
        </Checkbox>
      ),
      dataIndex: "customerName",
      key: "customerName",
    },
    {
      title: (
        <Checkbox
          checked={selectedColumns.includes("phone")}
          onChange={(e) => handleColumnSelect("phone", e.target.checked)}
        >
          SĐT
        </Checkbox>
      ),
      dataIndex: "phone",
      key: "phone",
    },
    {
      title: (
        <Checkbox
          checked={selectedColumns.includes("address")}
          onChange={(e) => handleColumnSelect("address", e.target.checked)}
        >
          ĐỊA CHỈ
        </Checkbox>
      ),
      dataIndex: "address",
      key: "address",
    },
    {
      title: (
        <Checkbox
          checked={selectedColumns.includes("products")}
          onChange={(e) => handleColumnSelect("products", e.target.checked)}
        >
          SẢN PHẨM
        </Checkbox>
      ),
      key: "products",
      render: (_, record) => (
        <>
          {record.products &&
            record.products.map((item, index) => (
              <div key={index} style={{ whiteSpace: "nowrap" }}>
                <strong>{item.product}</strong> - SL: <strong>{item.quantity}</strong>
              </div>
            ))}
        </>
      ),
    },
    {
      title: (
        <Checkbox
          checked={selectedColumns.includes("category")}
          onChange={(e) => handleColumnSelect("category", e.target.checked)}
        >
          QUÀ
        </Checkbox>
      ),
      dataIndex: "category",
      key: "category",
    },
    {
      title: (
        <Checkbox
          checked={selectedColumns.includes("orderDate")}
          onChange={(e) => handleColumnSelect("orderDate", e.target.checked)}
        >
          NGÀY ĐẶT
        </Checkbox>
      ),
      dataIndex: "orderDate",
      key: "orderDate",
      render: (text) => dayjs(text).format("DD/MM"),
    },
    {
      title: (
        <Checkbox
          checked={selectedColumns.includes("deliveryStatus")}
          onChange={(e) => handleColumnSelect("deliveryStatus", e.target.checked)}
        >
          TÌNH TRẠNG GH
        </Checkbox>
      ),
      dataIndex: "deliveryStatus",
      key: "deliveryStatus",
      render: (text) => (
        <Tag color={text === "GIAO THÀNH CÔNG" ? "blue" : "orange"}>{text}</Tag>
      ),
    },
    {
      title: (
        <Checkbox
          checked={selectedColumns.includes("trackingCode")}
          onChange={(e) => handleColumnSelect("trackingCode", e.target.checked)}
        >
          MÃ VẬN ĐƠN
        </Checkbox>
      ),
      dataIndex: "trackingCode",
      key: "trackingCode",
    },
    {
      title: (
        <Checkbox
          checked={selectedColumns.includes("shippingDate1")}
          onChange={(e) => handleColumnSelect("shippingDate1", e.target.checked)}
        >
          NGÀY GỬI
        </Checkbox>
      ),
      dataIndex: "shippingDate1",
      key: "shippingDate1",
      render: (text) => text && dayjs(text).format("DD/MM/YYYY"),
    },
    {
      title: (
        <Checkbox
          checked={selectedColumns.includes("shippingDate2")}
          onChange={(e) => handleColumnSelect("shippingDate2", e.target.checked)}
        >
          NGÀY NHẬN
        </Checkbox>
      ),
      dataIndex: "shippingDate2",
      key: "shippingDate2",
      render: (text) => text && dayjs(text).format("DD/MM/YYYY"),
    },
    // Cột TÊN KHÁCH đã có checkbox, giữ nguyên:
  
    
    
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
    },
    {
      title: (
        <Checkbox
          checked={selectedColumns.includes("noteKHO")}
          onChange={(e) => handleColumnSelect("noteKHO", e.target.checked)}
        >
          GHI CHÚ KHO
        </Checkbox>
      ),
      dataIndex: "noteKHO",
      key: "noteKHO",
    },
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

  const handleDeleteOrder = async (id) => {
    try {
      const response = await axios.delete(`/api/orders/${id}`);
      message.success(response.data.message || "Xóa đơn hàng thành công");
      fetchOrders();
    } catch (error) {
      console.error(error);
      message.error("Lỗi khi xóa đơn hàng");
    }
  };
  
  const handleSubmit = async (values) => {
    const revenue = Number(values.revenue) || 0;
    const profit = revenue === 0 ? 0 : Math.max(revenue - 5, 0);
    const products = values.products || [];
    
    let stt;
    if (currentEditId) {
      // Nếu đang chỉnh sửa, giữ nguyên stt cũ
      stt = orders.find((order) => order.id === currentEditId)?.stt;
    } else {
      try {
        // Lấy số thứ tự mới từ API
        const counterResponse = await axios.post("/api/orders/nextStt");
        stt = counterResponse.data.nextStt;
        console.log(stt);
      } catch (error) {
        console.error("Lỗi khi lấy số thứ tự mới:", error);
        message.error("Lỗi khi lấy số thứ tự mới");
        return;
      }
    }
  
    const newOrder = {
      ...values,
      id: currentEditId || Date.now().toString(),
      stt, // Sử dụng stt lấy từ API
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
      orderDate: currentEditId ? values.orderDate : moment().format("YYYY-MM-DD"),
      shippingDate1: values.shippingDate1 || "",
      shippingDate2: values.shippingDate2 || "",
      employee_code_order: currentUser.employee_code,
      istick: false,
      isShipping: false,
    };
  
    try {
      if (currentEditId) {
        const response = await axios.put(`/api/orders/${currentEditId}`, newOrder);
        message.success(response.data.message || "Cập nhật thành công");
      } else {
        const response = await axios.post("/api/orders", newOrder);
        message.success(response.data.message || "Thêm mới thành công");
      }
      fetchOrders();
      setFormVisible(false);
    } catch (error) {
      console.error(error);
      message.error("Lỗi khi lưu đơn hàng");
    }
  };
  const filteredOrdersForExcel = orders
  .filter(order =>
    order.saleReport === "DONE" &&
    order.istick === true &&
    order.deliveryStatus === ""
  )
  .map(order => ({
    STT: order.stt,
    NAME: order.customerName,
    Address: order.address,
    Phone: order.phone,
     products: order.products
      ? order.products
          .map(item => `${item.product} (${item.quantity})`)
          .join("\n")
      : "",
      // Products: order.products
      // ? order.products
      //     .map(item => `${item.product} (SL: ${item.quantity})`)
      //     .join(", ")
      // : "",
    category: order.category,
  })); 
  return (
    <div style={{ padding: 24 }}>
      
      <Row>
      <Col span={6}><div style={{ marginBottom: 16 }}>
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
       
      </div> </Col>
      {currentUser.position_team==="kho" && <Col span={5}>
      <Table 
      columns={columns3} 
      dataSource={dataSource3} 
      pagination={false}  // Không hiển thị phân trang nếu chỉ có 1 dòng
      bordered
    />
      <Button
          type="primary"
          onClick={handleCalculateTotals}
          
        >
         Đếm SL 
        </Button> </Col>}
      </Row>
      
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={4}>
          <RangePicker
            allowClear
            format="DD/MM/YYYY"
            onChange={(dates) => setDateRange(dates)}
            style={{ width: "100%" }}
          />
        </Col>
        <Col span={4}>
          <Search
            placeholder="Tìm kiếm..."
            allowClear
            onSearch={setSearchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </Col>
        <Col span={5}>
        {currentUser.position_team==="kho" ?(<Select
            mode="multiple"
            style={{ width: "100%" }}
            placeholder="Chọn bộ lọc"
            allowClear
            options={[
              { value: "istick", label: "ĐƠN ĐÃ IN" },
              { value: "notick", label: "ĐƠN CHƯA IN" },
              { value: "today", label: "Đơn mới trong ngày" },
              { value: "khoshiping", label: "Kho đóng hàng" },
              { value: "waitDelivered", label: "Chưa gửi hàng" },
              { value: "not_delivered", label: "Đã gửi hàng" },
              { value: "delivered", label: "Giao thành công" },
              { value: "isshiping", label: "Công Ty đóng hàng" },
              { value: "duplicate_name", label: "Trùng tên khách" },
              
            ]}
            onChange={(values) => setSelectedFilters(values)}
          />) :(<Select
            mode="multiple"
            style={{ width: "100%" }}
            placeholder="Chọn bộ lọc"
            allowClear
            options={[
              { value: "ero", label: "Đơn thiếu sale xử lý" },
              { value: "today", label: "Đơn mới trong ngày" },
              { value: "done", label: "Đơn đã Done" },
              { value: "ok", label: "Đơn OK" },
              { value: "waiting_done", label: "Đơn chưa Done" },
              { value: "isshiping", label: "Công Ty đóng hàng" },
              { value: "khoshiping", label: "Kho đóng hàng" },
              { value: "waitDelivered", label: "Chưa gửi hàng" },
             
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
          />) }
          
        </Col>
        <Col span={4}>
          <Select style={{ width: "100%" }}
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
        <Col span={4}>
          <Select style={{ width: "100%" }}
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
        {currentUser.position_team==="kho" &&
        <Col span={2}>
        <ExportExcelButton orders={filteredOrdersForExcel} />
          
        </Col>}
      </Row>

      
<Row gutter={16} wrap={false} style={{ display: "flex", alignItems: "flex-start" }}>
        <Col flex="none">
        {(  selectedColumns.length > 0
 ) && (
  <Table  
  
    columns={selectedTableColumns}
    dataSource={[...filteredOrders].sort((a, b) => b.stt - a.stt)}
    rowKey="id"
    bordered
    // pagination={{ pageSize: 50 }}
    pagination={false}
  />
)}
        </Col>
        <Col flex="auto">
       
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
        
        bordered
        pagination={false}
      />
        </Col>
      </Row>
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
