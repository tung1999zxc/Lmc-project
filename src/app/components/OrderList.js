"use client";
import React, { useState,useRef, useCallback,useMemo, useEffect } from "react";
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
  Tag,Spin,
  Checkbox
} from "antd";
import { EditOutlined, DeleteOutlined ,SearchOutlined} from "@ant-design/icons";
import FullScreenLoading from './FullScreenLoading';
import dayjs from "dayjs";
import OrderForm from "./OrderForm";
import isBetween from "dayjs/plugin/isBetween";
import { useDispatch, useSelector } from "react-redux";
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

  // const lastFetchTime = useRef(0);
  // const THIRTY_MINUTES = 60 * 60 * 1000;  
  // Các state quản lý đơn hàng, form, filter, …
  const [orders, setOrders] = useState([]);
  const [currentEditId, setCurrentEditId] = useState(null);
  const [formVisible, setFormVisible] = useState(false);
  const [dateRange2, setDateRange2] = useState('today');
  const [dateRange, setDateRange] = useState('undefined');
  const [searchText, setSearchText] = useState("");
  const [searchValue, setSearchValue] = useState(""); // Lưu giá trị nhập vào
  const [searchValue2, setSearchValue2] = useState(""); // Lưu giá trị nhập vào
  const [initialOrders4, setInitialOrders4] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [shiftFilter, setShiftFilter] = useState(null);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [sttInput, setSttInput] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [sttDoneInput, setSttDoneInput] = useState("");
  
  
  const [namesalexuly, setnamesalexuly] = useState("");
  // Cho phép chọn nhiều filter
  const [employees, setEmployees] = useState([]);
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [selectedSale, setSelectedSale] = useState(undefined);
  const [selectedMKT, setSelectedMKT] = useState(undefined);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const bangphu= selectedColumns.length;
  const [totalQuantities, setTotalQuantities] = useState({});
  const [totalQuantitiesINDON, setTotalQuantitiesINDON] = useState({});
  const [totalQuantitiesCTYDONG, setTotalQuantitiesCTYDONG] = useState({});
  const [totalQuantitiesKHODONG, setTotalQuantitiesKHODONG] = useState({});
  const [initialOrders, setInitialOrders] = useState([]);
  const [initialOrders2, setInitialOrders2] = useState([]);
  const [initialOrders3, setInitialOrders3] = useState([]);
  const [isdem, setIsdem] = useState(false);
  const [dataPagename, setdataPagename] = useState([]);
  const [searchCustomerName, setSearchCustomerName] = useState("");
  const [searchCustomerName2, setSearchCustomerName2] = useState("");
  const [specificDate, setSpecificDate] = useState(null); // Ngày cụ thể
  const [sttSearch, setSttSearch] = useState("");
  const [exportDisabled, setExportDisabled] = useState(true);
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
    if (currentUser.position_team === "kho" ) {
      
      fetchOrders();
    }
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
       setLoading(false); // Tắt xoay sau 0.5s
    }
  };
  
  // Danh sách thành viên team (dùng cho vai trò lead)
  const leadTeamMembers = employees
    .filter((employee) => employee.team_id === currentUser.team_id)
    .map((employee) => employee.name.trim().toLowerCase());


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
    setLoading(true);
    try {
      const startDateObj = (Array.isArray(dateRange2) && dateRange2.length === 2) ? dateRange2[0] : (Array.isArray(dateRange) && dateRange.length === 2 ? dateRange[0] : null);
      const endDateObj = (Array.isArray(dateRange2) && dateRange2.length === 2) ? dateRange2[1] : (Array.isArray(dateRange) && dateRange.length === 2 ? dateRange[1] : null);
      
      const params = {};
      if (startDateObj && endDateObj) {
        params.startDate = dayjs(startDateObj).format('YYYY-MM-DD');
        params.endDate = dayjs(endDateObj).format('YYYY-MM-DD');
      }
      // if (searchText) {
      //   params.search = searchText.trim();
      // }
  
      if (currentUser.position_team === "kho" ) {
          const response = await axios.get('/api/orderskho');
          const data = response.data.data || [];
  
          setOrders(data);
          setInitialOrders(data);
          setInitialOrders2(data);
          setInitialOrders3(data);
          setInitialOrders4(data);
        } else{
          const response = await axios.get('/api/orders', { params });
          const data = response.data.data || [];
  
      setOrders(data);
      setInitialOrders(data);
      setInitialOrders2(data);
      setInitialOrders3(data);
      setInitialOrders4(data);
        }
     
    } catch (error) {
      console.error(error);
      message.error("Lỗi khi lấy đơn hàng");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    const range = getDateRangeByPreset(dateRange2);
    if (range) {
      setDateRange(range);
    }
  }, [dateRange2]);
  useEffect(() => {
    if (currentUser.position_team === "kho" ) {
      return
    }
    const isValidRange = (dateRange && dateRange.length === 2) || (dateRange2 && dateRange2.length === 2);
    if (isValidRange) {
      fetchOrders();
    }
  }, [dateRange, dateRange2]);
  
  const handleSearch = (value) => {
    setSearchText(value); // Chỉ cập nhật khi nhấn Search
  };
  const handleSearch2 = (value) => {
    setSttSearch(value); // Chỉ cập nhật khi nhấn Search
  };

const resetPagename =()=>{
  fetchNamePage();
};
  // Lưu đơn hàng vào localStorage mỗi khi orders thay đổi
 

  // Tính toán chọn nhân viên salexuly dựa trên số đơn hàng của hôm nay
  useEffect(() => {
    if (currentUser.position === "salexuly") {
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
      case "all":
        // Lấy toàn bộ thời gian: từ rất sớm đến rất muộn
        start = new Date(2000, 0, 1); // Hoặc chọn một ngày bắt đầu sớm phù hợp với hệ thống
        end = new Date(2100, 11, 31, 23, 59, 59, 999); // Ngày rất xa trong tương lai
        break;
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
      case "2currentMonth":
        // Từ ngày 1 của tháng đến cuối ngày hôm nay
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
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

  const filteredEmpIds = shiftFilter
  ? employees
      .filter(
        (employee) =>
          employee.position_team2 &&
          employee.position_team2.toLowerCase() === shiftFilter.toLowerCase()
      )
      .map((employee) => employee.name)
  : employees.map((employee) => employee.name);  
  // Lọc đơn hàng dựa trên vai trò và các filter được chọn



  const filteredOrders = useMemo(() => {
    let roleFilteredOrders = [...orders];

  
  
    if (currentUser.position === "mkt") {
      roleFilteredOrders = roleFilteredOrders.filter(
        (order) => order.mkt.trim().toLowerCase() === currentUser.name.trim().toLowerCase()
      );
    } 
    // else if (currentUser.position === "salenhapdon") {
    //   roleFilteredOrders = roleFilteredOrders.filter(
    //     (order) => order.sale.trim().toLowerCase() === currentUser.name.trim().toLowerCase()
    //   );
    // } 
    // else if (currentUser.position === "salefull") {
    //   roleFilteredOrders = roleFilteredOrders.filter(
    //     (order) => order.sale === currentUser.name
    //   );
    
    // } 
    // else if (currentUser.position === "salexuly") {
    //   roleFilteredOrders = roleFilteredOrders.filter(
    //     (order) =>
    //        order.saleReport === "DONE"
    //   );
    // }
     else if (currentUser.position_team === "kho") {
      roleFilteredOrders = roleFilteredOrders.filter(
        (order) => order.saleReport === "DONE"
      );
    } else if (currentUser.position === "lead") {
      roleFilteredOrders = roleFilteredOrders.filter((order) =>
        leadTeamMembers.includes(order.mkt.trim().toLowerCase())
      );
    }

    return roleFilteredOrders
    .filter((order) => {
      // Điều kiện lọc theo ngày
      let dateMatch = true;

      if (specificDate) {
        // Kiểm tra ngày phù hợp theo vị trí của user
        dateMatch = dayjs(
          currentUser.position_team === "kho" ? order.shippingDate1 : order.orderDate
        ).format("YYYY-MM-DD") === dayjs(specificDate).format("YYYY-MM-DD");
      } else if (dateRange && (searchText.trim() === "" || sttSearch.trim() === "")) {
      // Nếu có khoảng thời gian, lọc theo range
      const startDate = dayjs(dateRange[0]);
      const endDate = dayjs(dateRange[1]);
      const checkDate = (date) =>
        date &&
        dayjs(date).isValid() &&
        dayjs(date).isBetween(startDate, endDate, "day", "[]");
        if (currentUser.position_team === "kho") {
          dateMatch = checkDate(order.shippingDate1 ? order.shippingDate1 : order.orderDate);
        } else if (currentUser.position === "salexuly") {
          dateMatch = checkDate(order.shippingDate2 ? order.shippingDate2 : order.orderDate);
        } else {
    dateMatch = checkDate(order.orderDate);
  }
      // if (!order.shippingDate1 && !order.shippingDate2) {
      //   dateMatch = checkDate(order.orderDate);
      // } else {
      //   dateMatch =
      //     checkDate(order.orderDate) ||
      //     checkDate(order.shippingDate1) ||
      //     checkDate(order.shippingDate2);
      // }
    } else if (searchText.trim() !== ""|| sttSearch.trim() !== "") {
      dateMatch = true;
    }

 
    if (
      !filteredEmpIds
        .map((name) => name.trim().toLowerCase())
        .includes(order.sale.trim().toLowerCase())
    ) {
      return false;
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
              case "ds0":
                return order.revenue === 0 ;
              case "dskhac0":
                return order.revenue !== 0 ;
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
              case "donechuaguichuagui":
                return order.saleReport === "DONE" && order.deliveryStatus === "";
              case "donechuaguichuagui2":
                return order.saleReport !== "DONE" && order.deliveryStatus === "ĐÃ GỬI HÀNG";
              case "check":
                return order.saleReport === "CHECK";
              case "ok":
                return order.saleReport === "OK";
              case "booktb":
                return order.saleReport === "BOOK TB";
              case "istick":
                return order.istick === true;
                case "notick": {
                  // Tìm đơn hàng gốc từ initialOrders (đã lưu)
                  const originalOrder = initialOrders.find((o) => o.id === order.id);
                  // Nếu không có đơn gốc (đơn hàng mới) hoặc đơn hàng đã thay đổi so với gốc,
                  // thì hiển thị đơn hàng đó (cho dù đã tick hay chưa)
                  if (!originalOrder || order.istick !== originalOrder.istick) {
                    return true;
                  }
                  // Nếu không có thay đổi, chỉ hiển thị khi istick là false
                  return order.istick === false;
                }
              case "ero":
                return order.salexuly === "";
              case "waiting_done":
                return order.saleReport !== "DONE";
              case "khoshiping":
                return order.isShipping === false;
                case "even_stt":
  return order.stt % 2 === 0;
case "odd_stt":
  return order.stt % 2 !== 0;
              case "ctyshiping":
                return order.isShipping !== false;
              case "ctyshiping2":
                return order.isShipping !== false && order.trackingCode ==="";
              
                // case "isShipping": {
                //   // Tìm đơn hàng gốc từ initialOrders (đã lưu)
                //   const originalOrder2 = initialOrders2.find((o) => o.id === order.id);
                //   // Nếu không có đơn gốc (đơn hàng mới) hoặc đơn hàng đã thay đổi so với gốc,
                //   // thì hiển thị đơn hàng đó (cho dù đã tick hay chưa)
                //   if (!originalOrder2 || order.isshiping !== originalOrder2.isshiping) {
                //     return true;
                //   }
                //   // Nếu không có thay đổi, chỉ hiển thị khi istick là false
                //   return order.isshiping === false;
                // };
              case "waitDelivered":
                return order.deliveryStatus === "";
              case "deliveredcomavandon":
                return order.deliveryStatus === "ĐÃ GỬI HÀNG" && order.trackingCode !=="";
              case "deliveredcomavandon2":
                return order.deliveryStatus === "" && order.trackingCode !=="";
              case "deliveredkomavandon":
                return order.deliveryStatus === "ĐÃ GỬI HÀNG" && order.trackingCode ==="";
              case "deliveredchuatick":
                return order.deliveryStatus === "ĐÃ GỬI HÀNG" && order.istick4 === false;
                
              default:
                return true;
            }
          });
        }

        const saleMatch = selectedSale
        ? order.sale.trim().toLowerCase() === selectedSale.trim().toLowerCase() ||
          order.salexuly.trim().toLowerCase() === selectedSale.trim().toLowerCase()
        : true;
      
        const mktMatch = (() => {
          // Nếu có chọn marketing (và selectedMKT là mảng không rỗng) thì dùng nó để so sánh
          if (selectedMKT && Array.isArray(selectedMKT) && selectedMKT.length > 0) {
            return selectedMKT.some(
              (mkt) => order.mkt.trim().toLowerCase() === mkt.trim().toLowerCase()
            );
          }
          // Nếu không có selectedMKT, và nếu currentUser là marketing, thì chỉ lọc theo tên của user đó
          if (currentUser.position === "mkt") {
            return order.mkt.trim().toLowerCase() === currentUser.name.trim().toLowerCase();
          }
          // Nếu không có điều kiện nào, trả về true để không lọc theo marketing
          return true;
        })();

        const sttMatch =
        sttSearch.trim() === ""
          ? true
          : (
              (order.stt != null &&
               String(order.stt).toLowerCase().includes(sttSearch.toLowerCase()))
              ||
              (order.trackingCode != null &&
               String(order.trackingCode).toLowerCase().includes(sttSearch.toLowerCase()))
            );

            const customerNameMatch = searchCustomerName.trim() === "" 
            ? true 
            : order.customerName.toLowerCase().includes(searchCustomerName.toLowerCase());

            const customerNameMatch2 = searchCustomerName2.trim() === ""
            ? true
            : order.products.some((product) =>
                product.product.toLowerCase().trim() === searchCustomerName2.toLowerCase().trim()
              );

        return dateMatch && sttMatch && searchMatch && customerNameMatch && customerNameMatch2 && filterMatch && saleMatch && mktMatch;
      })
      .sort(
        (a, b) =>
          dayjs(b.orderDate).valueOf() - dayjs(a.orderDate).valueOf()
      );
  }, [
    orders,
    sttSearch,
    dateRange,
    searchText,
    selectedFilters,
    selectedSale,
    selectedMKT,
    currentUser,
    leadTeamMembers,
    searchCustomerName,
    searchCustomerName2,
    shiftFilter 
  ]);

  // const handleCalculateTotals = () => {
  //   // Lọc ra các đơn hàng có istick === true
  //   const tickedOrders = filteredOrders.filter(order => order.istick);
  //   // Tính tổng số lượng sản phẩm cho các đơn đã tích
  //   const totals = calculateTotalQuantities(tickedOrders);
  //   setTotalQuantities(totals);
  // };
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
  const newTickedOrders = orders.filter(order => {
    const originalOrder = initialOrders.find(o => o.id === order.id);
    // Điều kiện: đơn hàng đã tồn tại ban đầu, ban đầu chưa tích nhưng hiện tại đã tích
    return originalOrder && !originalOrder.istick && order.istick;
  });

  const handleCalculateTotals = () => {
    const totals = calculateTotalQuantities(filteredOrders);
    setTotalQuantities(totals);
      const tickedOrders = filteredOrders.filter(order => order.istick);
      // Tính tổng số lượng sản phẩm cho các đơn đã tích
      const totals2 = calculateTotalQuantities(tickedOrders);
      setTotalQuantitiesINDON(totals2);

      const CTYDONGOrders = filteredOrders.filter(order => order.isShipping);
      const totals3 = calculateTotalQuantities(CTYDONGOrders);
      setTotalQuantitiesCTYDONG(totals3);
      const KHODONGOrders = filteredOrders.filter(order => order.isShipping=== false);
      const totals4 = calculateTotalQuantities(KHODONGOrders);
      setTotalQuantitiesKHODONG(totals4);
      setIsdem(true);
      const revenueSum = filteredOrders.reduce((acc, order) => {
        // Chuyển revenue về số nếu chưa phải số
        return acc + (Number(order.revenue) || 0);
      }, 0);
      setTotalRevenue(revenueSum);
      // const tickedOrders2 = filteredOrders.filter(order => order.isShipping);
      // // Tính tổng số lượng sản phẩm cho các đơn đã tích
      // const totals2 = calculateTotalQuantities(tickedOrders2);
      // setTotalQuantitiesCTYDONG(totals2);
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
  const dataSource4 = [
    {
      key: '1',
      ...totalQuantitiesINDON,
    },
  ];
  const dataSourceCTYDONG = [
    {
      key: '1',
      ...totalQuantitiesCTYDONG,
    },
  ];
  const dataSourceKHODONG = [
    {
      key: '1',
      ...totalQuantitiesKHODONG,
    },
  ];
  // Hàm cập nhật checkbox "Công ty đóng hàng"
  // const handleShippingChange = async (orderId, checked) => {
  //   try {
  //     const response = await axios.patch(`/api/orders/${orderId}/shipping`, {
  //       isShipping: checked,
  //     });
  //     message.success(response.data.message);
  //     // Sau khi cập nhật thành công, bạn có thể làm mới danh sách đơn hàng từ API
  //     fetchOrders();
  //   } catch (error) {
  //     console.error(error.response?.data?.error || error.message);
  //     message.error("Lỗi khi cập nhật trạng thái đóng hàng");
  //   }
  // };
  const handleColumnSelect = (columnKey, checked) => {
    if (checked) {
      setSelectedColumns((prev) => [...prev, columnKey]);
    } else {
      setSelectedColumns((prev) => prev.filter((key) => key !== columnKey));
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
  // Các cột cho bảng (cho các vai trò khác nhau)
 
 
  
 

  const MemoizedCheckbox = React.memo(({ checked, onChange }) => (
    <Checkbox checked={checked} onChange={onChange} />
  ));

  const useDebouncedUpdate = (updateFn, delay = 2000) => {
    const timeoutRef = useRef(null);
    const draftChanges = useRef({});
  
    const scheduleUpdate = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        updateFn(draftChanges.current);
        draftChanges.current = {};
      }, delay);
    };
  
    const addChange = (id, value) => {
      draftChanges.current[id] = value;
      scheduleUpdate();
    };
  
    return addChange;
  };
  const handleIstickChange = useCallback((orderId, value) => {
    debouncedChange(orderId, value);
  }, []);

  const debouncedChange = useDebouncedUpdate((changes) => {
    setOrders(prev => {
      const copy = [...prev];
      Object.entries(changes).forEach(([id, value]) => {
        const index = copy.findIndex(o => o.id === id);
        if (index !== -1) {
          copy[index] = { ...copy[index], istick: value };
        }
      });
      return copy;
    });
  }, 3000);

  const handleIstickChange2 = useCallback((orderId, value) => {
    debouncedChangeShipping(orderId, value);
  }, []);
  const debouncedChangeShipping = useDebouncedUpdate((changes) => {
    setOrders(prev => {
      const copy = [...prev];
      Object.entries(changes).forEach(([id, value]) => {
        const index = copy.findIndex(o => o.id === id);
        if (index !== -1) {
          copy[index] = { ...copy[index], isShipping: value };
        }
      });
      return copy;
    });
  }, 3000);

  const handleIstickChangeDONE = useCallback((orderId, value) => {
    debouncedChangeDONE(orderId, value);
  }, []);
  const debouncedChangeDONE = useDebouncedUpdate((changes) => {
    setOrders(prev => {
      const copy = [...prev];
      Object.entries(changes).forEach(([id, value]) => {
        const index = copy.findIndex(o => o.id === id);
        if (index !== -1) {
          copy[index] = { ...copy[index], istickDONE: value };
        }
      });
      return copy;
    });
  }, 3000);

  const allRowsSelectedDONE = filteredOrders.length > 0 && filteredOrders.every(order => order.istickDONE);
  
  const handleSaveIstickDONE = async () => {
    // Lọc ra các đơn hàng mà giá trị istick đã thay đổi so với ban đầu
    const ordersToUpdate = orders.filter((order) => {
      const originalOrder = initialOrders3.find((o) => o.id === order.id);
      // Nếu đơn hàng mới (không có trong initialOrders) hoặc có sự thay đổi về istick
      return !originalOrder || order.istickDONE !== originalOrder.istickDONE;
    });
  
    if (ordersToUpdate.length === 0) {
      message.info("Không có đơn hàng nào thay đổi");
      return;
    }
  
    try {
      // Gửi chỉ các trường cần cập nhật (id và istick)
      const response = await axios.post("/api/orders/updateIstickDONE", {
        orders: ordersToUpdate.map(({ id, istickDONE }) => ({ id, istickDONE })),
      });
      message.success(response.data.message || "Đã lưu cập nhật các đơn");
      alert("Thao tác thành công!");
      // Cập nhật lại initialOrders sau khi lưu để làm mốc mới
      setInitialOrders3(orders);
      fetchOrders();
    } catch (error) {
      console.error(error);
      message.error("Lỗi khi lưu các đơn");
    }
  };
  


  const handleSelectAllIstickDONE = (value) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        filteredOrders.some((fOrder) => fOrder.id === order.id)
          ? { ...order, istickDONE: value }
          : order
      )
    );
  };
  const handleSelectAllIstick = (value) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        filteredOrders.some((fOrder) => fOrder.id === order.id)
          ? { ...order, istick: value }
          : order
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
      alert("Không có thay đổi nào!");
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
    }finally {
      // Sau khi gọi API (dù thành công hay lỗi), disable nút ExportExcelButton trong 3 giây
      setExportDisabled(false);
      setTimeout(() => {
        setExportDisabled(true);
      }, 5000);
    }
  };

  const allRowsSelected2 = filteredOrders.length > 0 && filteredOrders.every(order => order.isShipping);

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
      },
      {
        headers: { "x-current-user": encodeURIComponent(currentUser.name) },
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
  const columns = [
    {
      title: (
        <Checkbox
          checked={selectedColumns.includes("action")}
          onChange={(e) => handleColumnSelect("action", e.target.checked)}
        >
          THAO TÁC
        </Checkbox>
      ),
      key: "action",
      render: (_, record) => {        
      //   const disableEdit =
      // currentUser.position === "salenhapdon" && record.saleReport === "DONE";
      return (
        <Space>
          <Button disabled={
                
                currentUser.name === "Hoàng Công Phi"
                
              }  icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm title="Xóa đơn hàng?" onConfirm={() => handleDeleteOrder(record.id)}>
            <Button
              danger
              disabled={
                currentUser.position === "salenhapdon" ||
                currentUser.position === "salexacnhan" ||
                currentUser.position === "salexuly"||
                currentUser.name === "Hoàng Công Phi"||
                currentUser.position === "salefull"
              }
              icon={<DeleteOutlined />}
            />
          </Popconfirm>
        </Space>)
      },
      width: 50,
    },
    ...((currentUser.position_team === "kho")
    ? [
    {
      title: (<>
     
       <Checkbox
checked={selectedColumns.includes("istick")}
onChange={(e) => handleColumnSelect("istick", e.target.checked)}
>

</Checkbox>


        <Checkbox
          checked={allRowsSelected}
          onChange={(e) => handleSelectAllIstick(e.target.checked)}
        >
          In đơn
        </Checkbox>
        <Button type="primary" onClick={handleSaveIstick}>
        Lưu 
      </Button></>
      ),
      key: "istick",
      dataIndex: "istick",
      width: 50,
      render: (_, record) => (
       <MemoizedCheckbox
    checked={record.istick || false}
    onChange={(e) => handleIstickChange(record.id, e.target.checked)}
  />
      ),
    },
  ]
  : []),
    ...((currentUser.position === "salexuly" ||currentUser.position === "salefull")
      ? [
        {
          title: (<>
            <Checkbox
              checked={allRowsSelectedDONE}
              onChange={(e) => handleSelectAllIstickDONE(e.target.checked)}
            >
              Xác nhận Giao thành công
            </Checkbox>
            <Button type="primary" onClick={handleSaveIstickDONE}>
            Lưu 
          </Button></>
          ),
          key: "istickDONE",
          width: 50,
          dataIndex: "istickDONE",
          render: (_, record) => (
            <Checkbox
              checked={record.istickDONE || false}
              onChange={(e) => handleIstickChangeDONE(record.id, e.target.checked)}
            />
          ),
        },
        ]
      : []),
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
        render: (text) => text ? text.split("||")[0].trim() : "",
      },
    ...((currentUser.position === "managerSALE"||currentUser.position === "leadSALE"||currentUser.name === "Hoàng Lan Phương"||currentUser.name === "Đỗ Uyển Nhi"
     ) ? [
          {
            title: (<>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
             <Checkbox
  checked={selectedColumns.includes("isShipping")}
  onChange={(e) => handleColumnSelect("isShipping", e.target.checked)}
>
  
</Checkbox>

<Checkbox.Group
  options={[
    { label: "CTY đóng hàng", value: "istick2" }
  ]}
  value={allRowsSelected2 ? ["istick2"] : []}
  onChange={(checkedValues) => handleSelectAllIstick2(checkedValues.length > 0)}
  style={{
    border: "1px solid #1890ff",
    padding: "5px 10px",
    borderRadius: "5px",
    background: allRowsSelected2 ? "#1890ff" : "#f5f5f5",
    color: allRowsSelected2 ? "white" : "black",
    fontWeight: "bold"
  }}
/></div>
              <Button  type="primary" onClick={handleSaveIstick2}>
              Lưu 
            </Button></>
            ),
            
            key: "isShipping",
            dataIndex: "isShipping",
            render: (_, record) => (
              <MemoizedCheckbox
              checked={record.isShipping}
              onChange={e => handleIstickChange2(record.id, e.target.checked)}
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
    
    ...(currentUser.position !== "salenhapdon"
      ? [
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
        ]
      : []),
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
      render: (text) => (
        <Tag color={text === "DONE" ? "green" : "red"}>{text}</Tag>
      ),
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
    ...((currentUser.name === "Tung99"
    ) ? [
         {
           title: 


             
            " CTY ĐÓNG NAME"
          
           ,
           
           key: "isShippingname",
           dataIndex: "isShippingname",
         
         },
       ]
     : []),
  ];
// Lọc ra các cột đã được tick để hiển thị ở bảng phụ
const selectedTableColumns = columns.filter((col) =>
  selectedColumns.includes(col.key)
);
  const columnsMKT = [
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
      width: 25,
     
    },
    {
      title: "SẢN PHẨM",
      key: "products",
      width: 80,
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
    { title: "DOANH SỐ",width: 100, dataIndex: "revenue", key: "revenue" },

    { title: "DOANH THU", dataIndex: "profit", key: "profit" ,width: 20,},
    { title: "TÊN PAGE", dataIndex: "pageName", key: "pageName",width: 100, },
    { title: "TÊN KHÁCH", width: 100,dataIndex: "customerName", key: "customerName" },
    ...(currentUser.position === "mkt"
      ? [
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
          width: 200,
          render: (text) => {
            if (!text) return ""; // Tránh lỗi nếu note rỗng hoặc null
            const parts = text.split(":");
            return <div style={{ width: 200 }}><h3>{parts.length > 1 ? parts.slice(1).join(":").trim() : text}</h3></div>;
          },
        },
        ]
      : []),
    ...((currentUser.position === "lead" || currentUser.position === "managerMKT" )
      ? [
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
          width: 200,
          render: (text) => <div style={{ width: 200,  }}><h3>{text} </h3></div>,
        },
        ]
      : []),
    
    {
      title: "THANH TOÁN",
      dataIndex: "paymentStatus",
      key: "paymentStatus",
      width: 100,
      render: (text) => (
        <Tag color={text === "ĐÃ THANH TOÁN" ? "green" : "red"}>{text}</Tag>
      )
    },
   
    
    
    ...((currentUser.position === "lead" || currentUser.position === "managerMKT" )
      ? [
        { title: "Sale", dataIndex: "sale", key: "sale",width: 100, },
        ]
      : []),
    { title: "MKT", dataIndex: "mkt", key: "mkt" },
    
    
   
  ];






 


  const allRowsSelected4 = filteredOrders.length > 0 && filteredOrders.every(order => order.istick4); 
  const handleSelectAllIstick4 = (value) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        filteredOrders.some((fOrder) => fOrder.id === order.id)
          ? { ...order, istick4: value }
          : order
      )
    );
  };
 
  const handleIstickChange4 = (orderId, value) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.id === orderId ? { ...order, istick4: value } : order
      )
    );
  };
  
  

  
  const handleSaveIstick4 = async () => {
    // Lọc ra các đơn hàng mà giá trị istick đã thay đổi so với ban đầu
    const ordersToUpdate = orders.filter((order) => {
      const originalOrder = initialOrders4.find((o) => o.id === order.id);
      // Nếu đơn hàng mới (không có trong initialOrders) hoặc có sự thay đổi về istick
      return !originalOrder || order.istick4 !== originalOrder.istick4;
    });
  
    if (ordersToUpdate.length === 0) {
      message.info("Không có đơn hàng nào thay đổi");
      return;
    }
  
    try {
      // Gửi chỉ các trường cần cập nhật (id và istick)
      const response = await axios.post("/api/orders/updateIstick4", {
        orders: ordersToUpdate.map(({ id, istick4 }) => ({ id, istick4 })),
      });
      message.success(response.data.message || "Đã lưu cập nhật các đơn");
      alert("Thao tác thành công!");
      // Cập nhật lại initialOrders sau khi lưu để làm mốc mới
      setInitialOrders4(orders);
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
      width: 30,
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
        </Space>
      ),
    },
    {
      title: (<>
     
       <Checkbox
checked={selectedColumns.includes("istick")}
onChange={(e) => handleColumnSelect("istick", e.target.checked)}
>

</Checkbox>


        <Checkbox
          checked={allRowsSelected}
          onChange={(e) => handleSelectAllIstick(e.target.checked)}
        >
          In đơn
        </Checkbox>
        <Button type="primary" onClick={handleSaveIstick}>
        Lưu 
      </Button></>
      ),
      key: "istick",
      dataIndex: "istick",
      width: 50,
      render: (_, record) => (
       <MemoizedCheckbox
    checked={record.istick || false}
    onChange={(e) => handleIstickChange(record.id, e.target.checked)}
  />
      ),
    },
  
   
    {
      title: (<>
        <Checkbox
          checked={allRowsSelected4}
          onChange={(e) => handleSelectAllIstick4(e.target.checked)}
        >
         ĐÁNH DẤU ĐÃ IN
        </Checkbox>
        <Button type="primary" onClick={handleSaveIstick4}>
        Lưu 
      </Button></>
      ),
      key: "istick4",
      dataIndex: "istick4",
      width: 50,
      render: (_, record) => (
        <Checkbox
          checked={record.istick4 || false}
          onChange={(e) => handleIstickChange4(record.id, e.target.checked)}
        />
      ),
    },
    {
      title: (<>
        <Checkbox
          checked={allRowsSelectedDONE}
          onChange={(e) => handleSelectAllIstickDONE(e.target.checked)}
        >
          Xác nhận Giao thành công
        </Checkbox>
        <Button type="primary" onClick={handleSaveIstickDONE}>
        Lưu 
      </Button></>
      ),
      key: "istickDONE",
      width: 50,
      dataIndex: "istickDONE",
      render: (_, record) => (
        <MemoizedCheckbox
        checked={record.istickDONE}
        onChange={e => handleIstickChangeDONE(record.id, e.target.checked)}
      />
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
      width: 90,
      key: "trackingCode",
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
      width: 90,
      key: "deliveryStatus",
      render: (text) => (
        <Tag color={text === "GIAO THÀNH CÔNG" ? "blue" : "orange"}>{text}</Tag>
      ),
    },
    {
      title: "BÊN ĐÓNG HÀNG",
      key: "isShipping",
      dataIndex: "isShipping",
      width: 90,
      render: (_, record) =>
        record.isShipping ? "Công ty đóng hàng" : "Kho đóng hàng",
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
              checked={selectedColumns.includes("stt")}
              onChange={(e) => handleColumnSelect("stt", e.target.checked)}
            >
              STT
            </Checkbox>
          ),
          dataIndex: "stt",       
          key: "stt",
          width: 30,
        
         
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
      render: (text) => <div style={{ width: 200,  }}><h3>{text} </h3></div>,
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
      fb: values.fb || "",
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
      istick: values.istick||false,
      istick4: values.istick4||false,
      istickDONE: values.istickDONE||false,
      isShipping: values.isShipping||false,
    };
  
    try {
      if (currentEditId) {
        const response = await axios.put(`/api/orders/${currentEditId}`, newOrder,{ headers: { 'x-current-user': encodeURIComponent(currentUser.name) } });
        message.success(response.data.message || "Cập nhật thành công");
        // setOrders((prevOrders) =>
        //   prevOrders.map((order) => order.id === currentEditId ? newOrder : order)
        // );
        if (currentUser.position_team === "kho" ) {
          setOrders((prevOrders) =>
            prevOrders.map((order) => order.id === currentEditId ? newOrder : order)
          );
        } else{
          if (dateRange2 !== "all") {
            // Lọc lại danh sách theo khoảng ngày đã chọn
            fetchOrders();
          } else {
            // Thêm đơn hàng mới vào đầu danh sách cũ
             setOrders((prevOrders) =>
            prevOrders.map((order) => order.id === currentEditId ? newOrder : order)
          );
          }
        }
        

      } else {
        const response = await axios.post("/api/orders", newOrder);
        message.success(response.data.message || "Thêm mới thành công");
        const createdOrder = response.data.data;
      // Thêm đơn hàng mới vào state orders (ví dụ thêm vào đầu mảng)
      // setOrders((prevOrders) => [createdOrder, ...prevOrders]);
      if (dateRange2 !== "all") {
        // Lọc lại danh sách theo khoảng ngày đã chọn
        fetchOrders();
      } else {
        // Thêm đơn hàng mới vào đầu danh sách cũ
        setOrders((prevOrders) => [createdOrder, ...prevOrders]);
      }
      }
      // fetchOrders();
      setFormVisible(false);
    //   const now = Date.now();
    // if (now - lastFetchTime.current >= THIRTY_MINUTES) {
    //   fetchNamePage();
    //   lastFetchTime.current = now;}
    } catch (error) {
      console.error(error);
      message.error("Lỗi khi lưu đơn hàng");
    }
  };

  
  const filteredOrdersForExcel = orders
  .filter(order =>
    order.saleReport === "DONE" &&
    order.istick === true &&
    order.deliveryStatus === "ĐÃ GỬI HÀNG" &&
    order.trackingCode === ""&& order.istick4 === false 
  )
  .map(order => ({
    STT: order.stt,
    NAME: order.customerName,
    Address: order.address,
    Phone: order.phone,
    Products: order.products
      ? order.products
          .map(item => item.product)
          .join("\n")
      : "",
    Quantity: order.products
      ? order.products
          .map(item => item.quantity)
          .join("\n")
      : "",
    category: order.category,
  }));

  const handleBatchUpdateTrackingCodes = async () => {
    const sttList = sttInput.trim().split(/\s+/);
    const codeList = codeInput.trim().split(/\s+/);

    if (sttList.length !== codeList.length) {
      alert("Số lượng STT và Mã đơn không khớp");
      
      return;
    }

    const updates = sttList.map((stt, idx) => ({
      stt: Number(stt),
      trackingCode: codeList[idx],
    }));

    try {
      await axios.post("/api/orders/batch-update-tracking", { updates });
      alert("Cập nhật mã đơn hàng thành công");
      fetchOrders();

    } catch (error) {
      console.error(error);
      alert("Cập nhật thất bại");
    }
  };
  const countNewTickedProductQuantity = () => {
    // Lọc ra những đơn hàng có giá trị istick mới được tích:
    const newTickedOrders = orders.filter(order => {
      const originalOrder = initialOrders.find(o => o.id === order.id);
      // Điều kiện: đơn hàng đã tồn tại ban đầu, ban đầu chưa tích nhưng hiện tại đã tích
      return originalOrder && !originalOrder.istick && order.istick;
    });
  
    // Tính tổng số lượng sản phẩm của các đơn vừa được tích:
    const totalQuantity = newTickedOrders.reduce((acc, order) => {
      if (order.products && Array.isArray(order.products)) {
        order.products.forEach(productItem => {
          // Ép quantity về kiểu số để tính toán
          acc += Number(productItem.quantity);
        });
      }
      return acc;
    }, 0);
  
    return totalQuantity;
  };

 
    
  const sortedOrders = useMemo(() => {
    return [...filteredOrders].sort((a, b) => b.stt - a.stt);
  }, [filteredOrders]);
   
  const handleUpdateDeliveredStatus = async () => {
    const sttList = sttDoneInput.trim().split(/\s+/).map(Number);
    if (!sttList.length) {
      alert("Vui lòng nhập STT đơn hàng");
      return;
    }

    try {
      await axios.post("/api/orders/mark-done", { sttList });
      alert("Cập nhật thành công");
      fetchOrders();
    } catch (error) {
      console.error(error);
      alert("Lỗi khi cập nhật trạng thái");
    }
  };


  return (
    <div  style={{
      transform: "scale(1)", padding: 24,
     fontSize: "5px"
     
    }}>
      <FullScreenLoading loading={loading} tip="Đang tải dữ liệu..." />
      {/* <Button
  type="primary"
  danger
  onClick={async () => {
    const res = await fetch('/api/orders/batchUpdateSalexuly', { method: 'POST' });
    const data = await res.json();
    message.success(data.message || "Cập nhật xong!");
    fetchOrders(); // Gọi lại để load đơn mới
  }}
>
  Cập nhật Salexuly cho Đỗ Uyển Nhi
</Button> */}

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
      
      
       
     
      {(currentUser.position_team==="kho"||currentUser.position_team==="mkt" ||currentUser.position ==="leadSALE"||currentUser.position ==="admin"||currentUser.position ==="managerSALE"||  currentUser.name ==="Hoàng Lan Phương"  )&& <Col span={8}>
     {/* Tổng số lượng sản phẩm (đơn vừa tích): {countNewTickedProductQuantity()} */}
     
    {isdem && <> 
      <Table 
      columns={columns3} 
      dataSource={dataSource3} 
      pagination={false} 
      bordered
    />
    {(currentUser.position_team==="kho" || currentUser.name ==="Hoàng Lan Phương") && (
     <>
      <h4>SL SẢN PHẨM ĐÃ TICK (XUẤT EXCELL)</h4>
     <Table 
      columns={columns3} 
      dataSource={dataSource4} 
      pagination={false}  // Không hiển thị phân trang nếu chỉ có 1 dòng
      bordered
    />
    </>)} 
    {(currentUser.position_team !== "mkt" && currentUser.position_team!=="kho" && currentUser.name !=="Hoàng Lan Phương")&&(<>
     <h4>SL SẢN PHẨM ĐÃ TICK (CTY ĐÓNG) </h4>
    <Table 
      columns={columns3} 
      dataSource={dataSourceCTYDONG} 
      pagination={false}  
      bordered
    /></>)}
    {( currentUser.position_team==="kho" || currentUser.name ==="Hoàng Lan Phương")&&(<>
     <h4>SL SẢN PHẨM KHO ĐÓNG </h4>
    <Table 
      columns={columns3} 
      dataSource={dataSourceKHODONG} 
      pagination={false}  
      bordered
    /></>)}
    
    </>} 
      
    
      <Button
          type="primary"
          onClick={handleCalculateTotals}
          
        >
         Đếm SL 
        </Button> 
      {/* <Button
          type="primary"
          onClick={setIsdem(true)}
          
        >
         Huỷ đếm 
        </Button>  */}

        
        </Col>
        
        }
<Button
  type="primary"
  onClick={fetchOrders} // hoặc onClick={() => fetchOrders()}
  style={{ float: 'right' }}
>
  Tải lại tất cả đơn hàng
</Button>
      </Row>
      
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={4}>
        <RangePicker
  style={{ width: "100%" }}
  placeholder={["Từ ngày", "Đến ngày"]}
  value={
    dateRange && Array.isArray(dateRange) && dateRange.length === 2
      ? [dayjs(dateRange[0]), dayjs(dateRange[1])]
      : []
  }
  onChange={(dates) =>
    setDateRange(dates ? [dates[0].toDate(), dates[1].toDate()] : null)
  }
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
          <Option value="2currentMonth">2 Tháng (Từ tháng trước đến hiện tại)</Option>
          <Option value="lastMonth">Tháng trước</Option>
          <Option value="twoMonthsAgo">2 Tháng trước</Option>
          <Option value="threeMonthsAgo">3 Tháng trước</Option>
          { !(currentUser.position === "salenhapdon" || currentUser.position === "salexacnhan") && (
  <Option value="all">Tất cả (hạn chế dùng)</Option>
)}
        </Select>
        </Col>
        <Col span={6}>
        <Input
      placeholder="Tìm kiếm..."
      allowClear
      // value={searchValue} // Hiển thị giá trị nhập vào
      // onChange={(e) => setSearchValue(e.target.value)} // Cập nhật nhưng không tìm kiếm ngay
      onPressEnter={(e) => handleSearch(e.target.value.trim())} // Chỉ tìm kiếm khi nhấn Enter hoặc nút Search
      onClear={() => {
        setSearchValue("");
        handleSearch(""); // Hiển thị lại danh sách đầy đủ khi nhấn X
      }}
      suffix={
        <SearchOutlined
          style={{  fontSize: "16px", color: "#1890ff" }}
          
        />}
    />
    
 <Input
  placeholder="Tìm kiếm STT"
  allowClear
  onPressEnter={(e) => handleSearch2(e.target.value.trim())}
  
  onClear={() => {
    setSearchValue2("");
    handleSearch2(""); // Hiển thị lại danh sách đầy đủ khi nhấn X
  }}
  // onChange={(e) => setSearchValue2(e.target.value)}
  suffix={
    <SearchOutlined
      style={{  fontSize: "16px", color: "#1890ff" }}
      
    />
  }
/>
{( currentUser.position_team==="kho" ||currentUser.position_team==="sale" )&&(<>
  <Input
    placeholder="Tìm tên khách hàng..."
    allowClear
    onClear={() => {
      setSearchCustomerName("");
      // Hiển thị lại danh sách đầy đủ khi nhấn X
    }}
    onPressEnter={(e) => setSearchCustomerName(e.target.value.trim())}
    suffix={<SearchOutlined style={{ fontSize: "16px", color: "#1890ff" }} />}
  /><Input
  placeholder="Tìm tên Sản Phẩm..."
  allowClear
  onClear={() => {
    setSearchCustomerName2("");
    // Hiển thị lại danh sách đầy đủ khi nhấn X
  }}
  onPressEnter={(e) => setSearchCustomerName2(e.target.value.trim())}
  suffix={<SearchOutlined style={{ fontSize: "16px", color: "#1890ff" }} />}
/></>)}
  {( currentUser.position ==="admin" )&&(
  <Input
    placeholder="Tìm tên Sản Phẩm..."
    allowClear
    onClear={() => {
      setSearchCustomerName2("");
      // Hiển thị lại danh sách đầy đủ khi nhấn X
    }}
    onPressEnter={(e) => setSearchCustomerName2(e.target.value.trim())}
    suffix={<SearchOutlined style={{ fontSize: "16px", color: "#1890ff" }} />}
  />
  )}
    
        
        </Col>
        
        {currentUser.position_team==="kho" ?(<Col span={8}><Select
            mode="multiple"
            style={{ width: "100%" }}
            placeholder="Chọn bộ lọc"
            allowClear
            options={[
              { value: "deliveredchuatick", label: "Đã gửi hàng + CẦN TÍCH ĐÃ IN" },
              { value: "unpaid", label: "Chưa thanh toán" },
              { value: "paid", label: "Đã thanh toán" },
              { value: "deliveredkomavandon", label: "Đã gửi hàng + chưa mã" },
              { value: "deliveredcomavandon", label: "Đã gửi hàng + Có mã" },
              { value: "deliveredcomavandon2", label: "Chưa gửi hàng + Có mã" },
              { value: "waitDelivered", label: "Chưa gửi hàng" },
              { value: "not_delivered", label: "Đã gửi hàng" },
              { value: "khoshiping", label: "Kho đóng hàng" },
              { value: "delivered", label: "Giao thành công" },
              { value: "ctyshiping2", label: "Công Ty đóng hàng + Chưa mã" },
              { value: "ctyshiping", label: "Công Ty đóng hàng" },
             
              
             
              
            ]}
            onChange={(values) => setSelectedFilters(values)}
          />  
          
        </Col>) :(<Col span={5}> <Select
            mode="multiple"
            style={{ width: "100%" }}
            placeholder="Chọn bộ lọc"
            allowClear
            options={[
              
              { value: "unpaid_success", label: "Chưa thanh toán & Giao Thành công" },   
              { value: "donechuaguichuagui", label: "Done + Chưa Gửi Hàng" },   

              { value: "waiting_done", label: "Đơn chưa Done" },
              { value: "ok", label: "Đơn OK" },
              { value: "check", label: "Đơn CHECK" },
              { value: "ds0", label: "Doanh số bằng 0" },
              { value: "dskhac0", label: "Doanh số khác 0" },
              
              { value: "even_stt", label: "Đơn STT CHẴN" },
              { value: "odd_stt", label: "Đơn STT LẺ" },

              { value: "booktb", label: "BOOK TB" },
              { value: "waiting_approval", label: "Đợi xác nhận" },
              { value: "done", label: "Đơn đã Done" },
              { value: "duplicate_name", label: "Trùng tên khách" },
              { value: "duplicate_phone", label: "Trùng số điện thoại" },
              { value: "unpaid", label: "Chưa thanh toán" },
              { value: "paid", label: "Đã thanh toán" },
              { value: "ero", label: "Đơn thiếu sale xử lý" },
              { value: "ctyshiping2", label: "Công Ty đóng hàng + Chưa mã" },
              { value: "ctyshiping", label: "Công Ty đóng hàng" },
              { value: "khoshiping", label: "Kho đóng hàng" },
              { value: "waitDelivered", label: "Chưa gửi hàng" },
              { value: "deliveredkomavandon", label: "Đã gửi hàng + chưa mã" },
              { value: "not_delivered", label: "Đã gửi hàng" },
              { value: "delivered", label: "Giao thành công" },
              { value: "donechuaguichuagui2", label: "Khác Done + Đã Gửi Hàng" },  

              
             
              
          
            ]}
            onChange={(values) => setSelectedFilters(values)}
          />
          <Select
    value={shiftFilter}
    onChange={(value) => setShiftFilter(value)}
    style={{ width: 250, marginRight: 16 }}
    placeholder="Chọn ca làm việc"
    allowClear
  >
    <Option value="hanhchinh">Ca Hành Chính</Option>
    <Option value="onlinetoi">Ca Online Tối</Option>
    <Option value="onlinesang">Ca Online Sáng</Option>
  </Select></Col> ) }
          
        
        {currentUser.position_team!=="kho" &&(<>
        <Col span={4}>
          <Select style={{ width: "100%" }}
         
            disabled={
              currentUser.position === "mkt" 
            }
            placeholder="Chọn Sale"
            options={saleOptions.map((s) => ({ value: s, label: s }))}
            onChange={(value) => setSelectedSale(value)}
            allowClear
            showSearch
          />
        </Col>
        <Col span={4}>
  <Select
    mode="multiple" // Cho phép chọn nhiều giá trị
    style={{ width: "100%" }}
    disabled={currentUser.position === "mkt"|| currentUser.position === "salenhapdon"}
    placeholder="Chọn MKT"
    options={mktOptions.map((m) => ({ value: m, label: m }))}
    onChange={(value) => setSelectedMKT(value)}
    allowClear 
    showSearch
  />
  {currentUser.position !=="salenhapdon" &&
   <span ><strong>
  Tổng Doanh Số: {(filteredOrders.reduce((acc, order) => {
        // Chuyển revenue về số nếu chưa phải số
        return acc + (Number(order.revenue) || 0);
      }, 0)*17000).toLocaleString()}
</strong></span>}
</Col>
        <Col span={3}>
         
        </Col></>)}
       
        {currentUser.position_team==="kho" && exportDisabled && 
        <Col span={2}>
        <ExportExcelButton  orders={filteredOrdersForExcel} />
        
          
        </Col>}
      </Row>
      {( currentUser.position_team==="kho"
 ) && (<>
  <Row gutter={10} style={{ marginBottom: 10 }}>
  <Col span={12}>
    <Input.TextArea
      rows={3}
      placeholder="Nhập STT (cách nhau bằng dấu cách)"
      value={sttInput}
      onChange={(e) => setSttInput(e.target.value)}
    />
  </Col>
  <Col span={12}>
    <Input.TextArea
      rows={3}
      placeholder="Nhập mã đơn hàng (cách nhau bằng dấu cách)"
      value={codeInput}
      onChange={(e) => setCodeInput(e.target.value)}
    />
  </Col>
</Row>
<Button type="dashed" onClick={handleBatchUpdateTrackingCodes}>
  Cập nhật mã đơn hàng hàng loạt
</Button>
<br></br>  <br></br> <br></br> 
<Row gutter={10} style={{ marginBottom: 10 }}>
        <Col span={24}>
          <Input.TextArea
            rows={2}
            placeholder="Nhập STT đơn hàng cần đánh dấu đã giao thành công (cách nhau bằng dấu cách)"
            value={sttDoneInput}
            onChange={(e) => setSttDoneInput(e.target.value)}
          />
        </Col>
      </Row>
      <Button type="primary" danger onClick={handleUpdateDeliveredStatus} style={{ marginBottom: 20 }}>
        Đánh dấu GIAO THÀNH CÔNG 
      </Button></>
)}
   <br></br>   <br></br>   <br></br>  

  
    
<Row gutter={16} wrap={false} style={{ display: "flex", alignItems: "flex-start" }}>
        <Col flex="none">
        {(  selectedColumns.length > 0
 ) && (
  <Table  
  
    columns={selectedTableColumns}
    dataSource={sortedOrders}
    rowKey="id"
    bordered
    pagination={{ pageSize: searchText ? 100 : 20 }}
    // pagination={false}
  />
)}
        </Col>
        <Col flex="auto">
       
        <Table 
  scroll={{ x: 3000}}
  columns={
    currentUser.position_team === "kho"
      ? columnsKHO
      : currentUser.position_team === "mkt"
      ? columnsMKT
      : columns
  }
  dataSource={sortedOrders}
  rowKey="id"
  pagination={{ pageSize: searchText ? 100 : 20 }}
  bordered
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
