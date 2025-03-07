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

  const lastFetchTime = useRef(0);
  const THIRTY_MINUTES = 60 * 60 * 1000;  
  // Các state quản lý đơn hàng, form, filter, …
  const [orders, setOrders] = useState([]);
  const [currentEditId, setCurrentEditId] = useState(null);
  const [formVisible, setFormVisible] = useState(false);
  const [dateRange2, setDateRange2] = useState('today');
  const [dateRange, setDateRange] = useState('undefined');
  const [searchText, setSearchText] = useState("");
  const [searchValue, setSearchValue] = useState(""); // Lưu giá trị nhập vào
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
  const [initialOrders2, setInitialOrders2] = useState([]);
  const [isdemkho, setIsdemkho] = useState(true);
  const [dataPagename, setdataPagename] = useState([]);
  const [loading, setLoading] = useState(false); 
  const [specificDate, setSpecificDate] = useState(null); // Ngày cụ thể
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
    fetchNamePage();
  }, []);
  const fetchNamePage = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/pageName');
      setdataPagename(response.data.data); // Danh sách đơn hàng
    } catch (error) {
      console.error('Lỗi khi lấy đơn hàng:', error);
    }finally {
      setTimeout(() => setLoading(false), 500); // Tắt xoay sau 0.5s
    }
  };
  
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
      setInitialOrders2(response.data.data);
    } catch (error) {
      console.error(error);
      message.error("Lỗi khi lấy đơn hàng");
    }
  };
  
  const handleSearch = (value) => {
    setSearchText(value); // Chỉ cập nhật khi nhấn Search
  };

const resetPagename =()=>{
  fetchNamePage();
};
  // Lưu đơn hàng vào localStorage mỗi khi orders thay đổi
 

  // Tính toán chọn nhân viên salexuly dựa trên số đơn hàng của hôm nay
  useEffect(() => {
    if (currentUser.position === "salefull" ||currentUser.position === "salexuly") {
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


  function getDateRangeByPreset(preset) {
    const now = new Date();
    let start, end;
    switch (preset) {
      case "today":
        // Từ 00:00:00 đến 23:59:59.999 của hôm nay
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        break;
      case "yesterday":
        // Hôm qua: từ 00:00:00 đến 23:59:59.999 của ngày hôm qua
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
        break;
      case "week":
        // 7 ngày gần nhất: từ 7 ngày trước (00:00:00) đến hôm nay (23:59:59.999)
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        break;
      case "currentMonth":
        // Từ ngày 1 của tháng đến cuối ngày hôm nay
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        break;
      case "lastMonth":
        // Tháng trước: từ ngày 1 đến ngày cuối của tháng trước
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case "twoMonthsAgo":
        start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        end = new Date(now.getFullYear(), now.getMonth() - 1, 0);
        break;
      case "threeMonthsAgo":
        start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        end = new Date(now.getFullYear(), now.getMonth() - 2, 0);
        break;
      default:
        return undefined;
    }
    return [start, end];
  }
  const { Option } = Select;
  
  useEffect(() => {
    
      const range = getDateRangeByPreset(dateRange2);
    setDateRange(range);
    
  }, [dateRange2]);
  // Lọc đơn hàng dựa trên vai trò và các filter được chọn
  const filteredOrders = useMemo(() => {
    let roleFilteredOrders = [...orders];

  
    if (
      !selectedFilters.includes("duplicate_name") &&
      !selectedFilters.includes("duplicate_phone") && searchText.trim() === "" 
    ) {
    if (currentUser.position === "mkt") {
      roleFilteredOrders = roleFilteredOrders.filter(
        (order) => order.mkt.trim().toLowerCase() === currentUser.name.trim().toLowerCase()
      );
    } else if (currentUser.position === "salenhapdon") {
      roleFilteredOrders = roleFilteredOrders.filter(
        (order) => order.sale === currentUser.name
      );
    } else if (currentUser.position === "salefull") {
      roleFilteredOrders = roleFilteredOrders.filter(
        (order) => order.sale === currentUser.name
      );
    
    } else if (currentUser.position === "salexuly") {
      roleFilteredOrders = roleFilteredOrders.filter(
        (order) =>
          order.salexuly === currentUser.name && order.saleReport === "DONE"
      );
    } else if (currentUser.position_team === "kho") {
      roleFilteredOrders = roleFilteredOrders.filter(
        (order) => order.saleReport === "DONE"
      );
    } else if (currentUser.position === "lead") {
      roleFilteredOrders = roleFilteredOrders.filter((order) =>
        leadTeamMembers.includes(order.mkt)
      );
    }}

    return roleFilteredOrders
    .filter((order) => {
      // Điều kiện lọc theo ngày
      let dateMatch = true;

    if (specificDate) {
      // Nếu chọn ngày cụ thể, chỉ lọc theo ngày này
      dateMatch = dayjs(order.orderDate).format("YYYY-MM-DD") === dayjs(specificDate).format("YYYY-MM-DD");
    } else if (dateRange && searchText.trim() === "") {
      // Nếu có khoảng thời gian, lọc theo range
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
    } else if (searchText.trim() !== "") {
      dateMatch = true;
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
                  (order.paymentStatus === "CHƯA THANH TOÁN"|| order.paymentStatus === "") &&
                  order.deliveryStatus === "GIAO THÀNH CÔNG"
                );
              case "unpaid":
                return order.paymentStatus === "CHƯA THANH TOÁN"|| order.paymentStatus === "";
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
        ? order.sale.trim().toLowerCase() === selectedSale.trim().toLowerCase() ||
          order.salexuly.trim().toLowerCase() === selectedSale.trim().toLowerCase()
        : true;
      
      const mktMatch = selectedMKT
        ? order.mkt.trim().toLowerCase() === selectedMKT.trim().toLowerCase()
        : true;

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

  const colors = [
    "#FFD700", // vàng
    "#ADD8E6", // xanh nhạt
    "#90EE90", // xanh lá nhạt
    "#FFB6C1", // hồng nhạt
    "#FFA500", // cam
    "#00CED1",
    "#FF5733", // màu đỏ cam
  "#C70039", // đỏ thẫm
  "#900C3F", // đỏ đậm
  "#581845", // tím đậm
  "#1F618D", // xanh đậm
  "#2E86C1", // xanh sáng
  "#28B463", // xanh lá đậm
  "#239B56", // xanh lá đậm hơn
  "#1E8449", // xanh lá rừng
  "#F4D03F", // vàng sáng
  "#F1C40F", // vàng óng ánh
  "#F39C12", // cam sáng
  "#E67E22", // cam đất
  "#D35400", // cam đậm
  "#BA4A00", // cam than
  "#7D6608", // olive
  "#6E2C00", // nâu sẫm
  "#A04000", // nâu đỏ
  "#6C3483", // tím trung
  "#884EA0", // tím nhạt
  "#A569BD", // tím nhẹ
  "#BB8FCE", // tím mờ
  "#7FB3D5", // xanh pastel
  "#5499C7", // xanh trung
  "#2980B9", // xanh dương
  "#2471A3", // xanh dương đậm
  "#1ABC9C", // xanh ngọc
  "#16A085", // xanh lục đậm
  "#117864", // xanh lục tối
  "#2ECC71", // xanh mát
  "#27AE60", // xanh lá sáng
  "#229954", // xanh lá đậm
  "#52BE80", // xanh mát nhẹ
  "#82E0AA", // xanh pastel
  "#ABEBC6", // xanh mờ
  "#F1948A", // hồng đất
  "#EC7063", // hồng đậm
  "#E74C3C", // đỏ sáng
  "#CB4335", // đỏ sẫm
  "#F5B7B1", // hồng nhạt
  "#FAD7A0", // vàng nhạt
  "#F8C471", // cam nhạt
  "#F7DC6F", // vàng nhẹ
  "#F0B27A", // cam đào
  "#D2B4DE", // tím nhạt
  "#A9CCE3", // xanh nhẹ
  "#AED6F1", // xanh pastel
  "#D6EAF8", // xanh mờ
  "#EDBB99", // nâu nhạt
  "#CCD1D1", // xám nhạt // xanh nước biển
  ];
  
  const getColorForCustomer = (customerName) => {
    let hash = 0;
    for (let i = 0; i < customerName.length; i++) {
      hash = customerName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
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

  const handleSaveIstick2 = async () => {
    // Lọc ra các đơn hàng mà giá trị istick đã thay đổi so với ban đầu
    const ordersToUpdate = orders.filter((order) => {
      const originalOrder = initialOrders2.find((o) => o.id === order.id);
      // Nếu đơn hàng mới (không có trong initialOrders) hoặc có sự thay đổi về istick
      return !originalOrder || order.isShipping !== originalOrder.isShipping;
    });
  
    if (ordersToUpdate.length === 0) {
      message.info("Không có đơn hàng nào thay đổi");
      return;
    }
  
    try {
      // Gửi chỉ các trường cần cập nhật (id và istick)
      const response = await axios.post("/api/orders/updateIstick2", {
        orders: ordersToUpdate.map(({ id, isShipping }) => ({ id, isShipping })),
      });
      message.success(response.data.message || "Đã lưu cập nhật các đơn");
      alert("Thao tác thành công!");
      // Cập nhật lại initialOrders sau khi lưu để làm mốc mới
      setInitialOrders2(orders);
      fetchOrders();
    } catch (error) {
      console.error(error);
      message.error("Lỗi khi lưu các đơn");
    }
  };
  const handleSelectAllIstick2 = (value) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        filteredOrders.some((fOrder) => fOrder.id === order.id)
          ? { ...order, isShipping: value }
          : order
      )
    );
  };
const allRowsSelected2 = filteredOrders.length > 0 && filteredOrders.every(order => order.isShipping);
  // Các cột cho bảng (cho các vai trò khác nhau)
  const columns = [
    {
      title: "Thao Tác",
      key: "action",
      render: (_, record) => {        
      //   const disableEdit =
      // currentUser.position === "salenhapdon" && record.saleReport === "DONE";
      return (
        <Space>
          <Button  icon={<EditOutlined />} onClick={() => handleEdit(record)} />
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
      title: (
        <Checkbox
          checked={selectedColumns.includes("orderDate")}
          onChange={(e) => handleColumnSelect("orderDate", e.target.checked)}
        >
          NGÀY ĐẶT
        </Checkbox>
      ),
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
      width: 80, // Tăng width nếu cần để hiển thị đủ thông tin
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
        render: (customerName, record) => {
          // Lọc ra các đơn hàng của khách hàng này
          const customerOrders = orders.filter(
            (order) => order.customerName === record.customerName
          );
          const count = customerOrders.length;
          // Nếu có nhiều đơn, gán màu nền dựa trên tên khách
          const bgColor = count > 1 ? getColorForCustomer(customerName) : "";
          
          return (
            <div style={{ backgroundColor: bgColor, padding: "4px" }}>
              {customerName}
            </div>
          );
        },
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
            title: (<>
             <Checkbox
          checked={allRowsSelected2}
          onChange={(e) => handleSelectAllIstick2(e.target.checked)}
        >
           CTY đóng hàng
        </Checkbox>
              <Button  type="primary" onClick={handleSaveIstick2}>
              Lưu 
            </Button></>
            ),
            
            key: "isShipping",
            dataIndex: "isShipping",
            render: (_, record) => (
              <Checkbox
                checked={record.isShipping || false}
                onChange={(e) => handleIstickChange2(record.id, e.target.checked)}
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
          checked={selectedColumns.includes("salexacnhan")}
          onChange={(e) => handleColumnSelect("salexacnhan", e.target.checked)}
        >
          SALE XÁC NHẬN
        </Checkbox>
      ),
      dataIndex: "salexacnhan",
      key: "salexacnhan",
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
          checked={selectedColumns.includes("fb")}
          onChange={(e) => handleColumnSelect("fb", e.target.checked)}
        >
          Link FB
        </Checkbox>
      ),
      dataIndex: "fb",
      key: "fb",
      render: (text) => <div style={{ width: 200,  }}>{text} </div>,
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
  const handleIstickChange2 = (orderId, value) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.id === orderId ? { ...order, isShipping: value } : order
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
      alert("Thao tác thành công!");
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
      salexacnhan: values.salexacnhan || "",
      salexuly: values.salexuly || "",
      phone: values.phone || "",
      address: values.address || "",
      note: values.fb || "",
      note: values.note || "",
      noteKHO: values.noteKHO || "",
      processStatus: values.processStatus || "",
      saleReport: values.saleReport || "",
      paymentStatus: values.paymentStatus || "",
      deliveryStatus: values.deliveryStatus || "",
      trackingCode: values.trackingCode || "",
      orderDate: values.orderDate || moment().format("YYYY-MM-DD"),
      orderDate4: values.orderDate4 || moment().format("YYYY-MM-DD HH:mm:ss"),
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
      const now = Date.now();
    if (now - lastFetchTime.current >= THIRTY_MINUTES) {
      fetchNamePage();
      lastFetchTime.current = now;}
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
    <div  style={{
      transform: "scale(1)", padding: 24,
     fontSize: "5px"
     
    }}>
      
      <Row>
      <Col span={6}><div style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          onClick={handleAddNew}
          disabled={
            currentUser.position_team === "mkt" ||
            currentUser.position_team === "kho" ||
            // currentUser.position === "salexuly" ||
            currentUser.position === "salexacnhan"
          }
        >
          Thêm đơn hàng mới
        </Button>
        <span style={{  }}> |SL ĐƠN : {filteredOrders.length} </span>
      </div> </Col>
      
      
       
     
      {(currentUser.position_team==="kho" ||currentUser.position ==="admin"||currentUser.position ==="managerSALE"||  currentUser.name ==="Hoàng Lan Phương"  )&& <Col span={5}>
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
        <DatePicker
          style={{ width: "100%" }}
          placeholder="Chọn ngày"
          value={specificDate ? dayjs(specificDate) : null}
          onChange={(date) => setSpecificDate(date)}
        />
        <Select
          allowClear
          id="presetFilter"
          style={{ width: '100%' }}
          placeholder="Chọn khoảng thời gian"
          value={dateRange2 || undefined}
          onChange={(value) => {
            setDateRange2(value);
          }}
        >
          <Option value="today">Hôm Nay</Option>
          <Option value="yesterday">Hôm Qua</Option>
          <Option value="week">1 Tuần gần nhất</Option>
          <Option value="currentMonth">1 Tháng (Từ đầu tháng đến hiện tại)</Option>
          <Option value="lastMonth">Tháng trước</Option>
          <Option value="twoMonthsAgo">2 Tháng trước</Option>
          <Option value="threeMonthsAgo">3 Tháng trước</Option>
        </Select>
        </Col>
        <Col span={4}>
        <Search
      placeholder="Tìm kiếm..."
      allowClear
      value={searchValue} // Hiển thị giá trị nhập vào
      onChange={(e) => setSearchValue(e.target.value)} // Cập nhật nhưng không tìm kiếm ngay
      onSearch={handleSearch} // Chỉ tìm kiếm khi nhấn Enter hoặc nút Search
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
        <Col span={3}>
         
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
          scroll={{ x: 3000 }}
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
        employees={employees}
        dataPagename={dataPagename}
        namesalexuly={namesalexuly}
        resetPagename={resetPagename}
        loading={loading}
      />
    </div>
  );
};

export default OrderList;
