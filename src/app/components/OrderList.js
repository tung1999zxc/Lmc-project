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
  Modal,
  Col,
  Tag,Spin,
  Checkbox
} from "antd";
import { EditOutlined, DeleteOutlined ,SearchOutlined,CloseOutlined} from "@ant-design/icons";
import dayjs from "dayjs";
import OrderForm from "./OrderForm";
import CustomerHistoryModal from "./CustomerHistoryModal";
import isBetween from "dayjs/plugin/isBetween";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import moment from "moment";
import ExportExcelButton from "./exportOrdersToExcel.js";
// Gọi dayjs.extend bên ngoài component để không gọi lại mỗi lần render
dayjs.extend(isBetween);
import { useRouter } from 'next/navigation';

// Address Cell Component with expand/collapse
const AddressCell = ({ text, maxHeight = 60 }) => {
  const [expanded, setExpanded] = useState(false);
  const [needsExpand, setNeedsExpand] = useState(false);
  const textRef = useRef(null);

  useEffect(() => {
    if (textRef.current) {
      const needsMoreLines = textRef.current.scrollHeight > maxHeight;
      setNeedsExpand(needsMoreLines);
    }
  }, [text, maxHeight]);

  if (!text) return <span style={{ color: '#999' }}>-</span>;

  return (
    <div 
      className="address-cell"
      style={{
        position: 'relative',
        maxHeight: expanded ? 'none' : maxHeight,
        overflow: 'hidden',
        transition: 'all 0.2s ease',
        textAlign: 'left',
        wordBreak: 'break-word',
        lineHeight: 1.4,
      }}
    >
      <div ref={textRef} style={{ paddingRight: needsExpand && !expanded ? 24 : 0 }}>
        {text}
      </div>
      {needsExpand && (
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            position: expanded ? 'relative' : 'absolute',
            right: 2,
            bottom: expanded ? 0 : 2,
            background: expanded ? 'var(--gold)' : 'rgba(255,255,255,0.95)',
            color: expanded ? '#fff' : 'var(--gold)',
            border: 'none',
            borderRadius: '4px',
            padding: '2px 6px',
            fontSize: '10px',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
            whiteSpace: 'nowrap',
            marginTop: expanded ? 4 : 0,
          }}
        >
          {expanded ? 'Thu gọn' : 'Mở rộng'}
        </button>
      )}
    </div>
  );
};

const PhoneCell = ({ text }) => {
  const [expanded, setExpanded] = useState(false);
  const [needsExpand, setNeedsExpand] = useState(false);
  const textRef = useRef(null);

  useEffect(() => {
    if (textRef.current) {
      const isLong = textRef.current.scrollWidth > textRef.current.parentElement?.clientWidth;
      setNeedsExpand(isLong);
    }
  }, [text]);

  if (!text) return <span style={{ color: '#999' }}>-</span>;

  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        textAlign: 'left',
        whiteSpace: expanded ? 'normal' : 'nowrap',
        transition: 'all 0.2s ease',
      }}
    >
      <div
        ref={textRef}
        style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          paddingRight: needsExpand && !expanded ? 24 : 0,
        }}
      >
        {text}
      </div>
      {needsExpand && (
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            position: 'absolute',
            right: 2,
            top: '50%',
            transform: 'translateY(-50%)',
            background: expanded ? 'var(--gold)' : 'rgba(255,255,255,0.95)',
            color: expanded ? '#fff' : 'var(--gold)',
            border: 'none',
            borderRadius: '4px',
            padding: '2px 6px',
            fontSize: '10px',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
            whiteSpace: 'nowrap',
          }}
        >
          {expanded ? 'Thu' : '+'}
        </button>
      )}
    </div>
  );
};

/* ══ AnimatedCounter: đếm số từ 0 → target khi mount hoặc đổi giá trị ══ */
const AnimatedCounter = ({ value, duration = 900, className, style }) => {
  const [display, setDisplay] = useState(0);
  const [counting, setCounting] = useState(false);
  const rafRef = useRef(null);
  const startRef = useRef(null);
  const fromRef = useRef(0);

  useEffect(() => {
    const from = fromRef.current;
    const to = Number(value) || 0;
    if (from === to) {
      setDisplay(to);
      setCounting(false);
      return;
    }
    setCounting(true);
    startRef.current = null;
    cancelAnimationFrame(rafRef.current);

    const step = (ts) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(from + (to - from) * eased);
      setDisplay(current);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        fromRef.current = to;
        setCounting(false);
      }
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, duration]);

  return (
    <span
      className={`${className || ''} ${counting ? 'counting' : ''}`.trim()}
      style={style}
    >
      {display.toLocaleString('vi-VN')}
    </span>
  );
};

/* ══ DemSLBlock: bảng đếm sản phẩm sang trọng — dạng cards gradient + animated counter ══ */
const DemSLBlock = ({ totalQuantities, totalQuantitiesINDON, totalQuantitiesCTYDONG, totalQuantitiesKHODONG, totalRevenue, currentUser, visibleSections, onClose }) => {
  const SECTIONS = [
    visibleSections.main && {
      key: 'main',
      title: 'Tổng sản phẩm',
      subtitle: 'Tất cả đơn trong bộ lọc',
      data: totalQuantities,
      accent: '#c9952a',
      accent2: '#f5d680',
      icon: '📦',
    },
    visibleSections.tick && {
      key: 'tick',
      title: 'Đã tick xuất Excel',
      subtitle: 'Các đơn đã được tích chọn',
      data: totalQuantitiesINDON,
      accent: '#0a8a4a',
      accent2: '#7be0a3',
      icon: '✅',
    },
    visibleSections.ctyDong && {
      key: 'ctyDong',
      title: 'Kho HQ đóng',
      subtitle: 'Công ty đóng hàng',
      data: totalQuantitiesCTYDONG,
      accent: '#1f5fa8',
      accent2: '#7fb6ee',
      icon: '🏢',
    },
    visibleSections.khoDong && {
      key: 'khoDong',
      title: 'Kho đóng',
      subtitle: 'Kho chi nhánh đóng',
      data: totalQuantitiesKHODONG,
      accent: '#a8441f',
      accent2: '#f0a87b',
      icon: '🏬',
    },
  ].filter(Boolean);

  const totalQty = Object.values(totalQuantities || {}).reduce((a, b) => a + (Number(b) || 0), 0);
  const productCount = Object.keys(totalQuantities || {}).length;

  return (
    <div className="dem-sl-wrapper">
      {/* Nút đóng X */}
      <button
        type="button"
        className="dem-sl-close"
        onClick={onClose}
        title="Đóng bảng thống kê"
        aria-label="Đóng"
      >
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
          <path d="M6 6 L18 18 M18 6 L6 18" />
        </svg>
      </button>

      {/* Hero header */}
      <div className="dem-sl-hero">
        <div className="dem-sl-hero-left">
          <div className="dem-sl-hero-icon">📊</div>
          <div>
            <div className="dem-sl-hero-title">Thống kê sản phẩm</div>
            <div className="dem-sl-hero-sub">
              Cập nhật theo bộ lọc hiện tại • {productCount} mặt hàng
            </div>
          </div>
        </div>
        <div className="dem-sl-hero-stats">
          <div className="dem-sl-hero-stat">
            <div className="dem-sl-hero-stat-label">Tổng SL</div>
            <AnimatedCounter
              value={totalQty}
              className="dem-sl-hero-stat-value"
              duration={1100}
            />
          </div>
          {typeof totalRevenue === 'number' && (
            <div className="dem-sl-hero-stat">
              <div className="dem-sl-hero-stat-label">Doanh thu</div>
              <span className="dem-sl-hero-stat-value">
                <AnimatedCounter
                  value={Math.round((totalRevenue || 0) * 17 * 1000)}
                  duration={1200}
                />
                <span style={{ fontSize: 12, opacity: 0.8, marginLeft: 4, fontWeight: 700 }}>đ</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Sections */}
      <div className="dem-sl-sections">
        {SECTIONS.map((sec) => {
          const entries = Object.entries(sec.data || {})
            .filter(([, v]) => Number(v) > 0)
            .sort((a, b) => Number(b[1]) - Number(a[1]));
          const secTotal = entries.reduce((acc, [, v]) => acc + (Number(v) || 0), 0);
          return (
            <div
              key={sec.key}
              className="dem-sl-section"
              style={{
                '--accent': sec.accent,
                '--accent2': sec.accent2,
              }}
            >
              <div className="dem-sl-section-head">
                <div className="dem-sl-section-title">
                  <span className="dem-sl-section-icon">{sec.icon}</span>
                  <span>{sec.title}</span>
                </div>
                <div className="dem-sl-section-total">
                  <AnimatedCounter value={secTotal} duration={1000} />
                  <span className="dem-sl-section-total-unit">sp</span>
                </div>
              </div>
              <div className="dem-sl-section-sub">{sec.subtitle}</div>

              {entries.length === 0 ? (
                <div className="dem-sl-empty">Chưa có dữ liệu</div>
              ) : (
                <div className="dem-sl-grid">
                  {entries.map(([name, qty], idx) => (
                    <div
                      key={`${sec.key}-${name}`}
                      className="dem-sl-card"
                      style={{ animationDelay: `${idx * 35}ms` }}
                    >
                      <div className="dem-sl-card-name" title={name}>{name}</div>
                      <div className="dem-sl-card-qty">
                        <AnimatedCounter value={Number(qty)} duration={900} />
                      </div>
                      <div className="dem-sl-card-bar">
                        <div
                          className="dem-sl-card-bar-fill"
                          style={{
                            width: `${Math.min(100, (Number(qty) / Math.max(...entries.map(([, v]) => Number(v)), 1)) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

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
  const [messageApi, contextHolder] = message.useMessage();
  const [editingOrder, setEditingOrder] = useState(null);
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
  const [shiftFilter2, setShiftFilter2] = useState(null);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [sttInput, setSttInput] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [sttDoneInput, setSttDoneInput] = useState("");
  const [showProductColumn, setShowProductColumn] = useState(false);
  
const [products2, setProducts] = useState([]);
  const [namesalexuly, setnamesalexuly] = useState("");
  // Cho phép chọn nhiều filter
  const [weightFilter, setWeightFilter] = useState(null); // 'under1kg', 'over1kg', or null
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
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [dataPagename, setdataPagename] = useState([]);
  const [searchCustomerName, setSearchCustomerName] = useState("");
  const [searchCustomerName2, setSearchCustomerName2] = useState("");
  const [specificDate, setSpecificDate] = useState(null); // Ngày cụ thể
  const [sttSearch, setSttSearch] = useState("");
  const [exportDisabled, setExportDisabled] = useState(true);
  const [filterType, setFilterType] = useState('failed'); // default: chưa thành công
  const [modalCustomerOrders, setModalCustomerOrders] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedKhoDong, setSelectedKhoDong] = useState();
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  const handleSearchCustomerModal = async (name) => {
    try {
      const res = await axios.get(`/api/orders/search-by-customer?name=${encodeURIComponent(name)}`);
      setModalCustomerOrders(res.data.data || []);
      setModalVisible(true);
    } catch (err) {
      console.error(err);
      messageApi.error('Không thể tìm đơn khách hàng');
    }
  };
  const handleFilterChange = (value) => {
    setFilterType(value);
    // Gọi lại API hoặc filter lại danh sách nếu cần
  };
  const fetchProducts = async () => {
    
      try {
        const response = await axios.get('/api/products');
        setProducts(response.data.data);
        
      } catch (error) {
        console.error(error);
        message.error("Lỗi khi lấy danh sách sản phẩm");
      
      }
    };
  const fetchEmployees = async () => {
      
      try {
        const response = await axios.get('/api/employees');
        // response.data.data chứa danh sách nhân viên theo API đã viết
        setEmployees(response.data.data);
      } catch (error) {
        console.error('Lỗi khi lấy danh sách nhân viên:', error);
        messageApi.error('Lỗi khi lấy danh sách nhân viên');
      } finally {
       
      }
    };
   useEffect(() => {
    if (currentUser.position_team === "kho" ) {
      
      fetchOrders();
    }
    fetchProducts();
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
  const mktOptions = [...new Set(employees
    .filter((emp) => emp.position_team === "mkt")
    .map((emp) => emp.name?.trim())
    .filter(Boolean))];
  const saleOptions = [...new Set(employees
    .filter((emp) => emp.position_team === "sale")
    .map((emp) => emp.name?.trim())
    .filter(Boolean))];
const kho2Options = employees
  .filter(emp => emp.position === "kho2")
  .map(emp => ({
    label: emp.name,
    value: emp.name,
  }));
    const salexulyOptions = useMemo(() => {
      return employees
        .filter(emp => emp.position === "salexuly")
        .map(emp => emp.name);
    }, [employees]);
    const salexulyOptions2 = useMemo(() => {
      return employees
        .filter(emp => emp.position === "salexuly" && emp.status === true)
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
      // Xử lý ngày bắt đầu và kết thúc
      const [startDateObj, endDateObj] = (() => {
        if (Array.isArray(dateRange2) && dateRange2.length === 2) {
          return dateRange2;
        } else if (Array.isArray(dateRange) && dateRange.length === 2) {
          return dateRange;
        }
        return [null, null];
      })();
  
      // Khởi tạo params chung
      const params = {};
      if (startDateObj && endDateObj) {
        params.startDate = dayjs(startDateObj).format('YYYY-MM-DD');
        params.endDate = dayjs(endDateObj).format('YYYY-MM-DD');
      }
  
      // Thiết lập URL và params tùy theo vị trí người dùng
      let url = '/api/orders';
      let requestParams = { ...params, filter: filterType };
  
      if (currentUser.position_team === "kho") {
        url = '/api/orderskho';
        requestParams = { filter: filterType }; // không truyền ngày
      } else if (currentUser.position === "salexuly") {
        url = '/api/ordersvandon';
      }
  
      // Gọi API
      const response = await axios.get(url, { params: requestParams });
      const data = response.data.data || [];
  
      // Cập nhật state
      setOrders(data);
      setInitialOrders(data);
      setInitialOrders2(data);
      setInitialOrders3(data);
      setInitialOrders4(data);
  
    } catch (error) {
      console.error("Lỗi khi gọi API:", error);
      messageApi.error("Lỗi khi lấy đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  
  // useEffect(() => {
  //   if (currentUser.position_team === "kho" ) {
  //     return
  //   }
  //   const isValidRange = (dateRange && dateRange.length === 2) || (dateRange2 && dateRange2.length === 2);
  //   if (isValidRange) {
  //     fetchOrders();
  //   }
  // }, [dateRange, dateRange2]);
  // useEffect(() => {
   
  //   fetchOrders();
  // }, [filterType]);
  useEffect(() => {
    const shouldFetch =
      currentUser.position_team === "kho" ||
      (filterType && (
        (dateRange && dateRange.length === 2) ||
        (dateRange2 && dateRange2.length === 2)
      ));
  
    if (shouldFetch) {
      fetchOrders();
    }
  }, [currentUser.position_team, filterType, dateRange, dateRange2]);
  
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
    const employeeOrderCounts = salexulyOptions2.map((employee) => ({
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
  }, [orders, salexulyOptions2, currentUser]);


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
      case "3currentMonth":
        // Từ ngày 1 của tháng đến cuối ngày hôm nay
        start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
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
  const filteredEmpIds2 = shiftFilter2
  ? employees
      .filter(
        (employee) =>
          employee.team_id &&
          employee.team_id.toLowerCase() === shiftFilter2.toLowerCase()
      )
      .map((employee) => employee.name)
  : employees.map((employee) => employee.name);  
  // Lọc đơn hàng dựa trên vai trò và các filter được chọn



  const filteredOrders = useMemo(() => {
    let roleFilteredOrders = [...orders];

  if (currentUser.position === "kho2") {
    roleFilteredOrders = roleFilteredOrders.filter(
      (order) => order.isShippingName === currentUser.name
    );
  }
  
    else if (currentUser.position === "mkt") {
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
      if (currentUser.name === "Phan Phong") {
        roleFilteredOrders = roleFilteredOrders.filter((order) =>
          leadTeamMembers.includes(order.mkt.trim().toLowerCase()) ||
          order.mkt.trim().toLowerCase() === "bùi văn phi".toLowerCase()||
          order.mkt.trim().toLowerCase() === "đỗ ngọc ánh".toLowerCase()
        );
      } else {
        roleFilteredOrders = roleFilteredOrders.filter((order) =>
          leadTeamMembers.includes(order.mkt.trim().toLowerCase())
        );
      }
    }

    // else if (currentUser.position === "lead") {
    //   roleFilteredOrders = roleFilteredOrders.filter((order) => {
    //     const mktName = order.mkt.trim().toLowerCase();
    
    //     const isInTeam = leadTeamMembers.includes(mktName);
    //     const isPhanThePhongExtra =
    //       currentUser.name === "Phan Thế Phong" && mktName === "bùi văn phi";
    //     const isNguyenVietSonExtra =
    //       currentUser.name === "Nguyễn Viết Sơn" &&
    //       ["nguyễn thị xuân diệu", "nguyễn bá quân"].includes(mktName);
    
    //     return isInTeam || isPhanThePhongExtra || isNguyenVietSonExtra;
    //   });
    // }

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

 
    if (shiftFilter) {
  if (
    order.sale &&
    order.sale.trim() !== "" &&
    !filteredEmpIds
      .map((name) => name.trim().toLowerCase())
      .includes(order.sale.trim().toLowerCase())
  ) {
    return false;
  }
}
 if (shiftFilter2) {
  if (
    order.mkt &&
    order.mkt.trim() !== "" &&
    !filteredEmpIds2
      .map((name) => name.trim().toLowerCase())
      .includes(order.mkt.trim().toLowerCase())
  ) {
    return false;
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
              case "chuyendon":
                return order.saleReport === "CHUYỂN ĐƠN";
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
                return order.deliveryStatus === "ĐÃ GỬI HÀNG" && !order.istick4;
              case "slam":
  return Array.isArray(order.products) &&
         order.products.some(p => parseInt(p.quantity) < 0);
                
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

            // Weight filter
            const calcOrderWeight = (order) => (order.products || []).reduce((sum, item) => {
              const productInfo = products2.find(p => p.name === item.product);
              return sum + (item.quantity * (productInfo?.weight || 0));
            }, 0);
            const orderWeight = calcOrderWeight(order);
            const weightMatch = !weightFilter 
              ? true 
              : weightFilter === 'under1kg' 
                ? orderWeight > 0 && orderWeight < 1000 
                : weightFilter === 'over1kg' 
                  ? orderWeight >= 1000 
                  : true;

        return dateMatch && sttMatch && searchMatch && customerNameMatch && customerNameMatch2 && filterMatch && saleMatch && mktMatch && weightMatch;
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
    shiftFilter,
    shiftFilter2,
    weightFilter,
    products2 
  ]);
  const customerNameCountMap = useMemo(() => {
    if (currentUser.name !== 'Tung99' && currentUser.name !== 'test') return [];
  const map = new Map();
  filteredOrders.forEach(order => {
    const name = order.customerName?.trim() || "Không rõ";
    map.set(name, (map.get(name) || 0) + 1);
  });
  return map;
}, [filteredOrders,currentUser.name]);
const pageProductStats = useMemo(() => {
   if (currentUser.name !== 'Tung99'&&currentUser.name !== 'test') return [];
  const stats = {};

  filteredOrders.forEach(order => {
    const page = (order.pageName || "Không rõ").split("||")[0].trim();
    const mkt = order.mkt || "Không rõ";
    const customerName = order.customerName?.trim() || "Không rõ";

    if (!stats[page]) {
      stats[page] = {
        page,
        mkt,
        totalQuantity: 0,
        productDetail: {},
        customerNames: new Set(),
      };
    }

    // Cộng sản phẩm
    order.products?.forEach(product => {
      const name = product.product;
      const qty = Number(product.quantity);
      if (!stats[page].productDetail[name]) stats[page].productDetail[name] = 0;
      stats[page].productDetail[name] += qty;
      stats[page].totalQuantity += qty;
    });

    // Thêm tên khách (dùng Set để loại trùng)
    stats[page].customerNames.add(customerName);
  });

  const rows = Object.values(stats).map(item => ({
    page: item.page,
    mkt: item.mkt,
    totalQuantity: item.totalQuantity,
    productStr: Object.entries(item.productDetail)
      .map(([name, qty]) => `${name} (SL: ${qty})`)
      .join(", "),
    customers: Array.from(item.customerNames).join(", "),
  }));

  return rows.sort((a, b) => b.totalQuantity - a.totalQuantity);
}, [filteredOrders,currentUser.name]);

const colorPalette = [
  "#f28b82", "#fbbc04", "#fff475", "#ccff90", "#a7ffeb",
  "#cbf0f8", "#aecbfa", "#d7aefb", "#fdcfe8", "#e6c9a8",
  "#e8eaed", "#c6dafc", "#ffd6a5", "#fdffb6", "#caffbf",
  "#9bf6ff", "#a0c4ff", "#bdb2ff", "#ffc6ff", "#fffffc",
  "#ffe066", "#fab1a0", "#e17055", "#fd79a8", "#a29bfe",
  "#74b9ff", "#55efc4", "#81ecec", "#ffeaa7", "#dfe6e9",
  "#636e72", "#00cec9", "#6c5ce7", "#e84393", "#2ecc71",
  "#f1c40f", "#d35400", "#7f8c8d", "#e67e22", "#1abc9c",
  "#2980b9", "#3498db", "#9b59b6", "#8e44ad", "#c0392b",
  "#34495e", "#16a085", "#27ae60", "#f39c12", "#bdc3c7"
];
const getCustomerColor = (name) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colorPalette[Math.abs(hash) % colorPalette.length];
};

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

// const ordersDone = filteredOrders
//   .filter(order =>
// order.saleReport === "DONE" &&
// order.deliveryStatus === "" &&
// order.products?.some(item => item.product === "MẶT NẠ BONG BÓNG") // lọc đúng đơn có sp
// ) 
//   .reduce((acc, order) => {
//     if (order.products && order.products.length > 0) {
//       const orderQty = order.products
//         .filter(item => item.product === record.name)
//         .reduce((sum, item) => sum + Number(item.quantity), 0);
//       return acc + orderQty;
//     }
//     return acc;
//   }, 0);

  const handleCalculateTotals = () => {
    if (isdem) {
      setIsdem(false);
      return;
    }
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
  //     messageApi.success(response.data.message);
  //     // Sau khi cập nhật thành công, bạn có thể làm mới danh sách đơn hàng từ API
  //     fetchOrders();
  //   } catch (error) {
  //     console.error(error.response?.data?.error || error.message);
  //     messageApi.error("Lỗi khi cập nhật trạng thái đóng hàng");
  //   }
  // };
  const handleColumnSelect = (columnKey, checked) => {
    if (checked) {
      setSelectedColumns((prev) => [...prev, columnKey]);
    } else {
      setSelectedColumns((prev) => prev.filter((key) => key !== columnKey));
    }
  };
  
const handleSelectAllIstick2 = (checked) => {
  setOrders(prev =>
    prev.map(order =>
      filteredOrders.some(f => f.id === order.id)
        ? {
            ...order,
            isShipping: checked,
            isShippingName: checked ? selectedKhoDong : null,
          }
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
  }, 0);

const handleIstickChange2 = useCallback((orderId, checked) => {
  debouncedChangeShipping(orderId, {
    isShipping: checked,
    isShippingName: checked ? selectedKhoDong : null,
  });
}, [selectedKhoDong]);

 const debouncedChangeShipping = useDebouncedUpdate((changes) => {
  setOrders(prev => {
    const copy = [...prev];

    Object.entries(changes).forEach(([id, value]) => {
      const index = copy.findIndex(o => o.id === id);

      if (index !== -1) {
        copy[index] = {
          ...copy[index],
          isShipping: value.isShipping,
          isShippingName: value.isShipping
            ? value.isShippingName
            : null, // hoặc "" nếu bạn muốn
        };
      }
    });

    return copy;
  });
}, 0);

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
  }, 0);

  const allRowsSelectedDONE = filteredOrders.length > 0 && filteredOrders.every(order => order.istickDONE);
  
  const handleSaveIstickDONE = async () => {
    // Lọc ra các đơn hàng mà giá trị istick đã thay đổi so với ban đầu
    const ordersToUpdate = orders.filter((order) => {
      const originalOrder = initialOrders3.find((o) => o.id === order.id);
      // Nếu đơn hàng mới (không có trong initialOrders) hoặc có sự thay đổi về istick
      return !originalOrder || order.istickDONE !== originalOrder.istickDONE;
    });
  
    if (ordersToUpdate.length === 0) {
      messageApi.info("Không có đơn hàng nào thay đổi");
      return;
    }
  
    try {
      // Gửi chỉ các trường cần cập nhật (id và istick)
      const response = await axios.post("/api/orders/updateIstickDONE", {
        orders: ordersToUpdate.map(({ id, istickDONE }) => ({ id, istickDONE })),
      });
      messageApi.success(response.data.message || "Đã lưu cập nhật các đơn");
      alert("Thao tác thành công!");
      // Cập nhật lại initialOrders sau khi lưu để làm mốc mới
      setInitialOrders3(orders);
      fetchOrders();
    } catch (error) {
      console.error(error);
      messageApi.error("Lỗi khi lưu các đơn");
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
      messageApi.info("Không có đơn hàng nào thay đổi");
      alert("Không có thay đổi nào!");
      return;
    }
  
    try {
      // Gửi chỉ các trường cần cập nhật (id và istick)
      const response = await axios.post("/api/orders/updateIstick", {
        orders: ordersToUpdate.map(({ id, istick }) => ({ id, istick })),
      });
      messageApi.success(response.data.message || "Đã lưu cập nhật các đơn");
      alert("Thao tác thành công!");
      // Cập nhật lại initialOrders sau khi lưu để làm mốc mới
      setInitialOrders(orders);
      fetchOrders();
    } catch (error) {
      console.error(error);
      messageApi.error("Lỗi khi lưu các đơn");
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
      messageApi.info("Không có đơn hàng nào thay đổi");
      return;
    }
  
    try {
      // Gửi chỉ các trường cần cập nhật (id và istick)
      const response = await axios.post("/api/orders/updateIstick2", {
       orders: ordersToUpdate.map(
  ({ id, isShipping, isShippingName }) => ({
    id,
    isShipping,
    isShippingName,
  })
),
      },
      {
        headers: { "x-current-user": encodeURIComponent(currentUser.name) },
      });
  
      messageApi.success(response.data.message || "Đã lưu cập nhật các đơn");
      alert("Thao tác thành công!");
      // Cập nhật lại initialOrders sau khi lưu để làm mốc mới
      setInitialOrders2(orders);
      fetchOrders();
    } catch (error) {
      console.error(error);
      messageApi.error("Lỗi khi lưu các đơn");
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
      return (
        <Space className="action-buttons">
          <Button 
            className="action-btn edit"
            disabled={currentUser.name === "test"} 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)} 
          />
          <Popconfirm title="Xóa đơn hàng?" onConfirm={() => handleDeleteOrder(record.id)}>
            <Button
              className="action-btn delete"
              disabled={
                currentUser.name === "test" ||
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
    // ...((currentUser.position === "salexuly" ||currentUser.position === "salefull")
    //   ? [
    //     {
    //       title: (<>
    //         <Checkbox
    //           checked={allRowsSelectedDONE}
    //           onChange={(e) => handleSelectAllIstickDONE(e.target.checked)}
    //         >
    //           Xác nhận Giao thành công
    //         </Checkbox>
    //         <Button type="primary" onClick={handleSaveIstickDONE}>
    //         Lưu 
    //       </Button></>
    //       ),
    //       key: "istickDONE",
    //       width: 50,
    //       dataIndex: "istickDONE",
    //       render: (_, record) => (
    //         <Checkbox
    //           checked={record.istickDONE || false}
    //           onChange={(e) => handleIstickChangeDONE(record.id, e.target.checked)}
    //         />
    //       ),
    //     },
    //     ]
    //   : []),
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
      sorter: (a, b) => {
        const dateA = a.orderDate4 || a.orderDate;
        const dateB = b.orderDate4 || b.orderDate;
        return dayjs(dateA).valueOf() - dayjs(dateB).valueOf();
      },
      render: (text, record) => {
        const dateValue = text || record.orderDate;
        if (!dateValue) return "N/A";
        const date = dayjs(dateValue);
        return (
          <div className="date-cell">
            <span className="date-main">{date.format("DD/MM/YYYY")}</span>
            <span className="date-time">{date.format("HH:mm:ss")}</span>
          </div>
        );
      },
      width: 90,
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
          sorter: (a, b) => (a.stt || 0) - (b.stt || 0),
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
        sorter: (a, b) => (a.customerName || "").localeCompare(b.customerName || ""),
        render: (customerName, record) => {
          const customerOrders = orders.filter(
            (order) => order.customerName === record.customerName
          );
          const count = customerOrders.length;
          const bgColor = count > 1 ? getColorForCustomer(customerName) : "";
          return (
            <div className="customer-cell" style={{ backgroundColor: bgColor, padding: "4px", borderRadius: "4px" }}>
              <span className="customer-name">{customerName}</span>
              {count > 1 && (
                <span className="customer-badge" style={{ backgroundColor: getColorForCustomer(customerName) }}>
                  {count}
                </span>
              )}
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
        sorter: (a, b) => (a.pageName || "").localeCompare(b.pageName || ""),
        render: (text) => text ? text.split("||")[0].trim() : "",
      },
    ...((currentUser.position === "kho1"
     ) ? [
          {
            title: (<>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            

<div style={{ display: "flex", gap: 10, alignItems: "center" }}>
  <Checkbox.Group
    options={[
      { label: "CHỌN KHO ĐÓNG HÀNG", value: "istick2" }
    ]}
    value={allRowsSelected2 ? ["istick2"] : []}
    onChange={(checkedValues) =>
      handleSelectAllIstick2(checkedValues.length > 0)
    }
  />

  <Select
    placeholder="Chọn kho đóng"
    style={{ width: 180 }}
    value={selectedKhoDong}
    onChange={setSelectedKhoDong}
    options={kho2Options}
  />
</div></div>
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
    ...((currentUser.position === "kho1"
    ) ? [
         {
           title: 


             
            " Kho Đóng Hàng"
          
           ,
           
           key: "isShippingName",
           dataIndex: "isShippingName",
         
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
        <div className="product-cell">
          {record.products &&
            record.products.map((item, index) => {
              const productInfo = products2.find(p => p.name === item.product);
              const weight = productInfo?.weight;
              return (
                <div key={index} className="product-item">
                  <span className="product-name">{item.product}</span>
                  <span className="product-quantity">SL: {item.quantity}{weight ? ` | ${weight}g` : ''}</span>
                </div>
              );
            })}
        </div>
      ),
    },
    {
      title: (
        <Checkbox
          checked={selectedColumns.includes("totalWeight")}
          onChange={(e) => handleColumnSelect("totalWeight", e.target.checked)}
        >
          TỔNG KL
        </Checkbox>
      ),
      key: "totalWeight",
      render: (_, record) => {
        const totalWeight = (record.products || []).reduce((sum, item) => {
          const productInfo = products2.find(p => p.name === item.product);
          const weight = productInfo?.weight || 0;
          return sum + (item.quantity * weight);
        }, 0);
        return totalWeight > 0 ? (
          <span className="weight-cell">{totalWeight}g</span>
        ) : "-";
      },
      sorter: (a, b) => {
        const calcWeight = (products) => (products || []).reduce((sum, item) => {
          const productInfo = products2.find(p => p.name === item.product);
          return sum + (item.quantity * (productInfo?.weight || 0));
        }, 0);
        return calcWeight(a.products) - calcWeight(b.products);
      },
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
      sorter: (a, b) => (a.category || "").localeCompare(b.category || ""),
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
      sorter: (a, b) => (a.deliveryStatus || "").localeCompare(b.deliveryStatus || ""),
      render: (text) => {
        const isSuccess = text === "GIAO THÀNH CÔNG";
        return (
          <span className={`order-status-tag ${isSuccess ? 'success' : 'warning'}`}>
            {text}
          </span>
        );
      },
    },
    {
      title: (
        <Checkbox
          checked={selectedColumns.includes("revenue")}
          onChange={(e) => handleColumnSelect("revenue", e.target.checked)}
        >
          DOANH SỐ SALE
        </Checkbox>
      ),
      dataIndex: "revenue",
      key: "revenue",
      sorter: (a, b) => (parseFloat(a.revenue) || 0) - (parseFloat(b.revenue) || 0),
      render: (value) => (
        <span className="revenue-cell">{value ? Number(value).toLocaleString() : "0"}</span>
      ),
    },
    ...( currentUser.position !== "salexuly" && currentUser.position !== "salenhapdon"&& currentUser.position !== "leadSALE"&& currentUser.position !== "managerSALE"
      ? [
    {
      title: (
        <Checkbox
          checked={selectedColumns.includes("revenuemkt")}
          onChange={(e) => handleColumnSelect("revenuemkt", e.target.checked)}
        >
          DOANH SỐ MKT
        </Checkbox>
      ),
      dataIndex: "revenuemkt",
      key: "revenuemkt",
      sorter: (a, b) => (parseFloat(a.revenuemkt) || 0) - (parseFloat(b.revenuemkt) || 0),
      render: (value) => (
        <span className="revenue-cell">{value ? Number(value).toLocaleString() : "0"}</span>
      ),
    }
     ]
      : []),
  
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
      sorter: (a, b) => (parseFloat(a.profit) || 0) - (parseFloat(b.profit) || 0),
      render: (value) => {
        const numValue = parseFloat(value) || 0;
        return (
          <span className={`revenue-cell ${numValue < 0 ? 'negative' : ''}`}>
            {numValue.toLocaleString()}
          </span>
        );
      },
    },
      {
      title: (
        <Checkbox
          checked={selectedColumns.includes("orderDate5")}
          onChange={(e) => handleColumnSelect("orderDate5", e.target.checked)}
        >
          Ngày xóa DS
        </Checkbox>
      ),
      dataIndex: "orderDate5",
      key: "orderDate5",
      sorter: (a, b) => {
        const dateA = a.orderDate5;
        const dateB = b.orderDate5;
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;
        return dayjs(dateA).valueOf() - dayjs(dateB).valueOf();
      },
      render: (text, record) => {
        const dateValue = text || record.orderDate5;
        if (!dateValue) return "N/A";
        const formattedDate = dayjs(dateValue).isValid()
          ? dayjs(dateValue).format("DD/MM/YYYY")
          : "N/A";
        const formattedTime = dayjs(dateValue).isValid()
          ? dayjs(dateValue).format("HH:mm:ss")
          : "N/A";
        return (
          <div className="date-cell">
            <span className="date-main">{formattedDate}</span>
            <span className="date-time">{formattedTime}</span>
          </div>
        );
      },
      width: 80,
    },
      
      {
      title: (
        <Checkbox
          checked={selectedColumns.includes("orderDate6")}
          onChange={(e) => handleColumnSelect("orderDate6", e.target.checked)}
        >
          Ngày DONE
        </Checkbox>
      ),
      dataIndex: "orderDate6",
      key: "orderDate6",
      sorter: (a, b) => {
        if (!a.orderDate6 && !b.orderDate6) return 0;
        if (!a.orderDate6) return 1;
        if (!b.orderDate6) return -1;
        return dayjs(a.orderDate6).valueOf() - dayjs(b.orderDate6).valueOf();
      },
      render: (text, record) => {
        const dateValue = text || record.orderDate6;
        if (!dateValue) return "N/A";
        const date = dayjs(dateValue);
        return (
          <div className="date-cell">
            <span className="date-main">{date.format("DD/MM/YYYY")}</span>
            <span className="date-time">{date.format("HH:mm:ss")}</span>
          </div>
        );
      },
      width: 90,
    },
    //mở sale
     ...(  currentUser.position !== "salexul"
      ? [
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
    }
     ]
      : []),
     ...( currentUser.name === "Nguyễn Thị Xuân Ánh" 
      ? [
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
      sorter: (a, b) => (a.sale || "").localeCompare(b.sale || ""),
    }
     ]
      : []),
      ...( currentUser.position !== "salenhapdon" &&currentUser.position !== "salefull"
      ? [
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
      sorter: (a, b) => (a.salexuly || "").localeCompare(b.salexuly || ""),
    },
     ]
      : []),
    // {
    //   title: (
    //     <Checkbox
    //       checked={selectedColumns.includes("salexacnhan")}
    //       onChange={(e) => handleColumnSelect("salexacnhan", e.target.checked)}
    //     >
    //       SALE XÁC NHẬN
    //     </Checkbox>
    //   ),
    //   dataIndex: "salexacnhan",
    //   key: "salexacnhan",
    // },
    
    ...(currentUser.position !== "salenhapdon" && currentUser.position !== "salexuly" &&currentUser.position !== "salefull"
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
          sorter: (a, b) => (a.mkt || "").localeCompare(b.mkt || ""),
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
      sorter: (a, b) => (a.saleReport || "").localeCompare(b.saleReport || ""),
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
      sorter: (a, b) => (a.phone || "").localeCompare(b.phone || ""),
      width: 130,
      render: (text) => <PhoneCell text={text} />,
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
      width: 260,
      sorter: (a, b) => (a.address || "").localeCompare(b.address || ""),
      render: (text) => <AddressCell text={text} maxHeight={120} />,
      
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
      sorter: (a, b) => (a.paymentStatus || "").localeCompare(b.paymentStatus || ""),
      render: (text) => (
        <Tag color={text === "ĐÃ THANH TOÁN" ? "green" : "red"}>{text}</Tag>
      ),
    },
    ...(currentUser.position === "salenhapdon" || currentUser.position === "salexuly" ||currentUser.position === "salefull"
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
        ...(currentUser.position !== "salenhapdon" && currentUser.position !== "salexuly" &&currentUser.position !== "salefull"
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
      render: (text) => <div style={{ width: 200,  }}><h3>{text} </h3></div>,
    },
      ]
      : []),
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
      sorter: (a, b) => (a.fb || "").localeCompare(b.fb || ""),
      render: (text) => <div style={{ width: 200 }}>{text} </div>,
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
      sorter: (a, b) => (a.trackingCode || "").localeCompare(b.trackingCode || ""),
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
      sorter: (a, b) => {
        if (!a.shippingDate1 && !b.shippingDate1) return 0;
        if (!a.shippingDate1) return 1;
        if (!b.shippingDate1) return -1;
        return dayjs(a.shippingDate1).valueOf() - dayjs(b.shippingDate1).valueOf();
      },
      render: (text) => {
        if (!text) return "N/A";
        const date = dayjs(text);
        return (
          <div className="date-cell">
            <span className="date-main">{date.format("DD/MM/YYYY")}</span>
            <span className="date-time">{date.format("HH:mm:ss")}</span>
          </div>
        );
      },
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
      sorter: (a, b) => {
        if (!a.shippingDate2 && !b.shippingDate2) return 0;
        if (!a.shippingDate2) return 1;
        if (!b.shippingDate2) return -1;
        return dayjs(a.shippingDate2).valueOf() - dayjs(b.shippingDate2).valueOf();
      },
      render: (text) => {
        if (!text) return "N/A";
        const date = dayjs(text);
        return (
          <div className="date-cell">
            <span className="date-main">{date.format("DD/MM/YYYY")}</span>
            <span className="date-time">{date.format("HH:mm:ss")}</span>
          </div>
        );
      },
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
      sorter: (a, b) => (a.noteKHO || "").localeCompare(b.noteKHO || ""),
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
      sorter: (a, b) => (a.processStatus || "").localeCompare(b.processStatus || ""),
    },
    
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
      sorter: (a, b) => {
        const dateA = a.orderDate4 || a.orderDate;
        const dateB = b.orderDate4 || b.orderDate;
        return dayjs(dateA).valueOf() - dayjs(dateB).valueOf();
      },
      render: (text, record) => {
        const dateValue = text || record.orderDate;
        if (!dateValue) return "N/A";
        const date = dayjs(dateValue);
        return (
          <div className="date-cell">
            <span className="date-main">{date.format("DD/MM/YYYY")}</span>
            <span className="date-time">{date.format("HH:mm:ss")}</span>
          </div>
        );
      },
      width: 90,
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
      sorter: (a, b) => (a.stt || 0) - (b.stt || 0),
    },
    {
      title: "SẢN PHẨM",
      key: "products",
      width: 80,
      render: (_, record) => (
        <div className="product-cell">
          {record.products &&
            record.products.map((item, index) => {
              const productInfo = products2.find(p => p.name === item.product);
              const weight = productInfo?.weight;
              return (
                <div key={index} className="product-item">
                  <span className="product-name">{item.product}</span>
                  <span className="product-quantity">SL: {item.quantity}{weight ? ` | ${weight}g` : ''}</span>
                </div>
              );
            })}
        </div>
      )
    },
    {
      title: "TỔNG KL",
      key: "totalWeight",
      width: 80,
      render: (_, record) => {
        const totalWeight = (record.products || []).reduce((sum, item) => {
          const productInfo = products2.find(p => p.name === item.product);
          const weight = productInfo?.weight || 0;
          return sum + (item.quantity * weight);
        }, 0);
        return totalWeight > 0 ? (
          <span className="weight-cell">{totalWeight}g</span>
        ) : "-";
      },
      sorter: (a, b) => {
        const calcWeight = (products) => (products || []).reduce((sum, item) => {
          const productInfo = products2.find(p => p.name === item.product);
          return sum + (item.quantity * (productInfo?.weight || 0));
        }, 0);
        return calcWeight(a.products) - calcWeight(b.products);
      },
    },
    { title: "DOANH SỐ SALE",width: 100, dataIndex: "revenue", key: "revenue", sorter: (a, b) => (parseFloat(a.revenue) || 0) - (parseFloat(b.revenue) || 0) },
    { title: "DOANH THU SALE", dataIndex: "profit", key: "profit" ,width: 20, sorter: (a, b) => (parseFloat(a.profit) || 0) - (parseFloat(b.profit) || 0) },
    { title: "DOANH SỐ MKT",width: 100, dataIndex: "revenuemkt", key: "revenuemkt", sorter: (a, b) => (parseFloat(a.revenuemkt) || 0) - (parseFloat(b.revenuemkt) || 0) },
    { title: "DOANH THU MKT", dataIndex: "profitmkt", key: "profitmkt" ,width: 20, sorter: (a, b) => (parseFloat(a.profitmkt) || 0) - (parseFloat(b.profitmkt) || 0) },
       {
      title: 'ĐƠN',
      width: 100,
      dataIndex: "saleReport",
      key: "saleReport",
      sorter: (a, b) => (a.saleReport || "").localeCompare(b.saleReport || ""),
      render: (text) => (
        <Tag color={text === "DONE" ? "green" : "red"}>{text}</Tag>
      ),
    },
    {
      title: (
        <Checkbox
          checked={selectedColumns.includes("orderDate5")}
          onChange={(e) => handleColumnSelect("orderDate5", e.target.checked)}
        >
          Ngày xóa DS
        </Checkbox>
      ),
      dataIndex: "orderDate5",
      key: "orderDate5",
      sorter: (a, b) => {
        if (!a.orderDate5 && !b.orderDate5) return 0;
        if (!a.orderDate5) return 1;
        if (!b.orderDate5) return -1;
        return dayjs(a.orderDate5).valueOf() - dayjs(b.orderDate5).valueOf();
      },
      render: (text, record) => {
        const dateValue = text || record.orderDate5;
        if (!dateValue) return "N/A";
        const date = dayjs(dateValue);
        return (
          <div className="date-cell">
            <span className="date-main">{date.format("DD/MM/YYYY")}</span>
            <span className="date-time">{date.format("HH:mm:ss")}</span>
          </div>
        );
      },
      width: 90,
    },
      {
      title: (
        <Checkbox
          checked={selectedColumns.includes("orderDate6")}
          onChange={(e) => handleColumnSelect("orderDate6", e.target.checked)}
        >
          Ngày DONE
        </Checkbox>
      ),
      dataIndex: "orderDate6",
      key: "orderDate6",
      sorter: (a, b) => {
        if (!a.orderDate6 && !b.orderDate6) return 0;
        if (!a.orderDate6) return 1;
        if (!b.orderDate6) return -1;
        return dayjs(a.orderDate6).valueOf() - dayjs(b.orderDate6).valueOf();
      },
      render: (text, record) => {
        const dateValue = text || record.orderDate6;
        if (!dateValue) return "N/A";
        const date = dayjs(dateValue);
        return (
          <div className="date-cell">
            <span className="date-main">{date.format("DD/MM/YYYY")}</span>
            <span className="date-time">{date.format("HH:mm:ss")}</span>
          </div>
        );
      },
      width: 90,
    },

    { title: "TÊN PAGE", dataIndex: "pageName", key: "pageName",width: 100, sorter: (a, b) => (a.pageName || "").localeCompare(b.pageName || "") },
    { title: "TÊN KHÁCH", width: 100,dataIndex: "customerName", key: "customerName", sorter: (a, b) => (a.customerName || "").localeCompare(b.customerName || "") },
    // ...(currentUser.position === "mkt"
    //   ? [
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
      //   ]
      // : []),
    // ...((currentUser.position === "lead" || currentUser.position === "managerMKT" )
    //   ? [
    //     {
    //       title: (
    //         <Checkbox
    //           checked={selectedColumns.includes("note")}
    //           onChange={(e) => handleColumnSelect("note", e.target.checked)}
    //         >
    //           GHI CHÚ SALE
    //         </Checkbox>
    //       ),
    //       dataIndex: "note",
    //       key: "note",
    //       width: 200,
    //       render: (text) => <div style={{ width: 200,  }}><h3>{text} </h3></div>,
    //     },
    //     ]
    //   : []),
    
    {
      title: "THANH TOÁN",
      dataIndex: "paymentStatus",
      key: "paymentStatus",
      width: 130,
      render: (text) => (
        <Tag color={text === "ĐÃ THANH TOÁN" ? "green" : "red"} className="customer-history-tag">{text}</Tag>
      )
    },
   
    
    
    // ...((currentUser.position === "lead" || currentUser.position === "managerMKT" )
    //   ? [
    //     { title: "Sale", dataIndex: "sale", key: "sale",width: 100, },
    //     ]
    //   : []),
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
      messageApi.info("Không có đơn hàng nào thay đổi");
      return;
    }
  
    try {
      // Gửi chỉ các trường cần cập nhật (id và istick)
      const response = await axios.post("/api/orders/updateIstick4", {
        orders: ordersToUpdate.map(({ id, istick4 }) => ({ id, istick4 })),
      });
      messageApi.success(response.data.message || "Đã lưu cập nhật các đơn");
      alert("Thao tác thành công!");
      // Cập nhật lại initialOrders sau khi lưu để làm mốc mới
      setInitialOrders4(orders);
      fetchOrders();
    } catch (error) {
      console.error(error);
      messageApi.error("Lỗi khi lưu các đơn");
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
    ...((currentUser.position === "kho1"
     ) ? [
          {
            title: (<>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
         

<div style={{ display: "flex", gap: 10, alignItems: "center" }}>
  <Checkbox.Group
    options={[
      { label: "CHỌN KHO ĐÓNG HÀNG", value: "istick2" }
    ]}
    value={allRowsSelected2 ? ["istick2"] : []}
    onChange={(checkedValues) =>
      handleSelectAllIstick2(checkedValues.length > 0)
    }
  />

  <Select
    placeholder="Chọn kho đóng"
    style={{ width: 180 }}
    value={selectedKhoDong}
    onChange={setSelectedKhoDong}
    options={kho2Options}
  />
</div></div>
              <Button  type="primary" onClick={handleSaveIstick2}>
              Lưu 
            </Button></>
            ),
            width: 100,
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
      ...((currentUser.position === "kho1"
    ) ? [
         {
           title: 


             
            " Kho Đóng Hàng"
          
           ,
           
           key: "isShippingName",
           dataIndex: "isShippingName",
         
         },
       ]
     : []),
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
      width: 140,
      key: "deliveryStatus",
      render: (text) => (
        <Tag color={text === "GIAO THÀNH CÔNG" ? "blue" : "orange"} className="customer-history-tag">{text}</Tag>
      ),
    },
     {
      title: (
        <Checkbox
          checked={selectedColumns.includes("orderDate6")}
          onChange={(e) => handleColumnSelect("orderDate6", e.target.checked)}
        >
          Ngày DONE
        </Checkbox>
      ),
      dataIndex: "orderDate6",
      key: "orderDate6",
      sorter: (a, b) => {
        if (!a.orderDate6 && !b.orderDate6) return 0;
        if (!a.orderDate6) return 1;
        if (!b.orderDate6) return -1;
        return dayjs(a.orderDate6).valueOf() - dayjs(b.orderDate6).valueOf();
      },
      render: (text, record) => {
        const dateValue = text || record.orderDate6;
        if (!dateValue) return "N/A";
        const date = dayjs(dateValue);
        return (
          <div className="date-cell">
            <span className="date-main">{date.format("DD/MM/YYYY")}</span>
            <span className="date-time">{date.format("HH:mm:ss")}</span>
          </div>
        );
      },
      width: 90,
    },
    // {
    //   title: "BÊN ĐÓNG HÀNG",
    //   key: "isShipping",
    //   dataIndex: "isShipping",
    //   width: 90,
    //   render: (_, record) =>
    //     record.isShipping ? "Công ty đóng hàng" : "Kho đóng hàng",
    // },
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
        <div className="product-cell">
          {record.products &&
            record.products.map((item, index) => {
              const productInfo = products2.find(p => p.name === item.product);
              const weight = productInfo?.weight;
              return (
                <div key={index} className="product-item">
                  <span className="product-name">{item.product}</span>
                  <span className="product-quantity">SL: {item.quantity}{weight ? ` | ${weight}g` : ''}</span>
                </div>
              );
            })}
        </div>
      ),
    },
    {
      title: (
        <Checkbox
          checked={selectedColumns.includes("totalWeight")}
          onChange={(e) => handleColumnSelect("totalWeight", e.target.checked)}
        >
          TỔNG KL
        </Checkbox>
      ),
      key: "totalWeight",
      render: (_, record) => {
        const totalWeight = (record.products || []).reduce((sum, item) => {
          const productInfo = products2.find(p => p.name === item.product);
          const weight = productInfo?.weight || 0;
          return sum + (item.quantity * weight);
        }, 0);
        return totalWeight > 0 ? (
          <span className="weight-cell">{totalWeight}g</span>
        ) : "-";
      },
      sorter: (a, b) => {
        const calcWeight = (products) => (products || []).reduce((sum, item) => {
          const productInfo = products2.find(p => p.name === item.product);
          return sum + (item.quantity * (productInfo?.weight || 0));
        }, 0);
        return calcWeight(a.products) - calcWeight(b.products);
      },
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
      width: 130,
      render: (text) => <PhoneCell text={text} />,
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
      width: 260,
      render: (text) => <AddressCell text={text} maxHeight={120} />,
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
      render: (text) => {
        if (!text) return "N/A";
        const date = dayjs(text);
        return (
          <div className="date-cell">
            <span className="date-main">{date.format("DD/MM/YYYY")}</span>
            <span className="date-time">{date.format("HH:mm:ss")}</span>
          </div>
        );
      },
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
  const columnsKHO2 = [
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
      width: 140,
      key: "deliveryStatus",
      render: (text) => (
        <Tag color={text === "GIAO THÀNH CÔNG" ? "blue" : "orange"} className="customer-history-tag">{text}</Tag>
      ),
    },
     
    // {
    //   title: "BÊN ĐÓNG HÀNG",
    //   key: "isShipping",
    //   dataIndex: "isShipping",
    //   width: 90,
    //   render: (_, record) =>
    //     record.isShipping ? "Công ty đóng hàng" : "Kho đóng hàng",
    // },
    {
      title: (
        <Checkbox
          checked={selectedColumns.includes("products")}
          onChange={(e) => handleColumnSelect("products", e.target.checked)}
        >
          SẢN PHẨM
        </Checkbox>
      ),
       width: 300,
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
      width: 200,
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
      width: 130,
      render: (text) => <PhoneCell text={text} />,
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
      width: 260,
      render: (text) => <AddressCell text={text} maxHeight={120} />,
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
      width: 150,
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
      width: 150,
      dataIndex: "orderDate",
      key: "orderDate",
      render: (text) => {
        if (!text) return "N/A";
        const date = dayjs(text);
        return (
          <div className="date-cell">
            <span className="date-main">{date.format("DD/MM/YYYY")}</span>
            <span className="date-time">{date.format("HH:mm:ss")}</span>
          </div>
        );
      },
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
      width: 150,
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
      width: 150,
      dataIndex: "shippingDate2",
      key: "shippingDate2",
      render: (text) => text && dayjs(text).format("DD/MM/YYYY"),
    },
    // Cột TÊN KHÁCH đã có checkbox, giữ nguyên:
  
    
    // {
    //   title: (
    //     <Checkbox
    //       checked={selectedColumns.includes("note")}
    //       onChange={(e) => handleColumnSelect("note", e.target.checked)}
    //     >
    //       GHI CHÚ SALE
    //     </Checkbox>
    //   ),
    //   dataIndex: "note",
    //   key: "note",
    //   render: (text) => <div style={{ width: 200,  }}><h3>{text} </h3></div>,
    // },
    // {
    //   title: (
    //     <Checkbox
    //       checked={selectedColumns.includes("noteKHO")}
    //       onChange={(e) => handleColumnSelect("noteKHO", e.target.checked)}
    //     >
    //       GHI CHÚ KHO
    //     </Checkbox>
    //   ),
    //   dataIndex: "noteKHO",
    //   key: "noteKHO",
    // },
    
  ];

  // Xử lý mở form thêm mới, sửa và xóa đơn hàng
  const handleAddNew = () => {
    
    setCurrentEditId(null);
    setFormVisible(true);
    setEditingOrder(null);
  };

  const handleEdit = (order) => {
    setCurrentEditId(order.id);
    setEditingOrder(order);
    setFormVisible(true);
  };

  const handleDeleteOrder = async (id) => {
    try {
      const response = await axios.delete(`/api/orders/${id}`);
      messageApi.success(response.data.message || "Xóa đơn hàng thành công");
      fetchOrders();
    } catch (error) {
      console.error(error);
      messageApi.error("Lỗi khi xóa đơn hàng");
    }
  };
  
  const handleSubmit = async (values) => {
    const revenue = Number(values.revenue) || 0;
    const profit = revenue === 0 ? 0 : Math.max(revenue - 5, 0);
    
    const products = values.products || [];
    
    const fullProducts = products.map((item) => {
    return products2.find((p) => p.name === item.product);
  });
  
  const validDates = fullProducts
  .map(p => p?.testday)
  .filter(Boolean)
  .map(date => new Date(date))
  .filter(d => !isNaN(d));

let diffDays;

// 🔥 Nếu không có testday → coi như > 8 ngày
if (validDates.length === 0) {
  diffDays = 999; // giá trị lớn để rơi vào case > 8 ngày
} else {
  const testDay = validDates.sort((a, b) => b - a)[0];

  const today2 = values.orderDate
  ? new Date(values.orderDate)
  : new Date();
  today2.setHours(0, 0, 0, 0);
  testDay.setHours(0, 0, 0, 0);

  diffDays = Math.floor(
    (today2 - testDay) / (1000 * 60 * 60 * 24)
  );
}
     let revenuemkt = revenue;
  let profitmkt = profit;

  if (diffDays <= 4) {
    revenuemkt = revenue * 1;
    profitmkt = revenuemkt === 0 ? 0 : Math.max(revenuemkt - 5, 0);
  } 
  else if (diffDays > 4 && diffDays <= 9) {
    revenuemkt = revenue * 1;
    profitmkt = revenuemkt === 0 ? 0 : Math.max(revenuemkt - 5, 0);
  } 
  else {
    revenuemkt = revenue;
    profitmkt = profit;
  }
const isFullCommission = fullProducts.some(
  (p) => !p?.mkttest || p.mkttest.trim().toLowerCase() === values.mkt.trim().toLowerCase()
);
const isFullCommission2 = fullProducts.some(
  (p) =>( p.mkttest === "SP MỚI" || p.mkttest === "SP CHUNG")
);

if (isFullCommission2) {
  revenuemkt = revenue;
  profitmkt = profit;
}
if (isFullCommission) {
  revenuemkt = revenue;
  profitmkt = profit;
}
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
        messageApi.error("Lỗi khi lấy số thứ tự mới");
        return;
      }
    }
  
    const newOrder = {
      ...values,
      id: currentEditId || Date.now().toString(),
      stt, // Sử dụng stt lấy từ API
      revenue,
      revenuemkt,
      profit,
      profitmkt,
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
      orderDate5: values.orderDate5 ||null,
      orderDate6: values.orderDate6 ||null,
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
        const response = await axios.put(`/api/orders/${currentEditId}`, newOrder,{ headers: { 'x-current-user': encodeURIComponent(currentUser.position_team),
      'x-current-username': encodeURIComponent(currentUser.name) } });
        messageApi.success(response.data.message || "Cập nhật thành công");
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
        messageApi.success(response.data.message || "Thêm mới thành công");
        const createdOrder = response.data.data;
      // Thêm đơn hàng mới vào state orders (ví dụ thêm vào đầu mảng)
      // setOrders((prevOrders) => [createdOrder, ...prevOrders]);
      if (dateRange2 !== "all") {
        // Lọc lại danh sách theo khoảng ngày đã chọn
        fetchOrders();
        fetchEmployees();
      } else {
        // Thêm đơn hàng mới vào đầu danh sách cũ
        setOrders((prevOrders) => [createdOrder, ...prevOrders]);
        fetchEmployees();
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
      messageApi.error("Lỗi khi lưu đơn hàng");
    }
  };

  
  const filteredOrdersForExcel = orders
  .filter(order =>
    order.saleReport === "DONE" &&
    order.istick === true &&
    order.deliveryStatus === "ĐÃ GỬI HÀNG" &&
    order.trackingCode === ""&&
    (order.istick4 ?? false) === false 
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
  return [...filteredOrders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
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

  
  const sanitizeValue = (value) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') return '';
    return String(value)
      .replace(/\n/g, ' ')
      .replace(/\r/g, ' ')
      .replace(/\t/g, ' ')
      .replace(/"/g, '""');
  };
  
  const handleCopy = () => {
    const headers = selectedTableColumns.map(col => {
      if (typeof col.title === 'string') return col.title;
      if (typeof col.title?.props?.children === 'string') return col.title.props.children;
      if (Array.isArray(col.title?.props?.children)) {
        return col.title.props.children.map(child => typeof child === 'string' ? child : '').join(' ');
      }
      return col.key || '';
    }).join('\t');
  
    const rows = sortedOrders.map(order => {
      return selectedTableColumns.map(col => {
        const key = col.dataIndex || col.key;
        if (key === "products" && Array.isArray(order.products)) {
          return sanitizeValue(order.products
            .map(p => `${p.product || ''} (SL: ${p.quantity || ''})`)
            .join(", "));
        }
        const value = order[key];
        return sanitizeValue(value);
      }).join('\t');
    });
  
    const finalText = [headers, ...rows].join('\n');
  
    navigator.clipboard.writeText(finalText)
      .then(() => alert("✅ Đã sao chép toàn bộ dữ liệu!"))
      .catch(() => messageApi.error("❌ Lỗi sao chép."));
  };
  
//   const handleSplitOrders = async () => {
//   try {
//     const res = await axios.post("/api/orders/batchSplitLinhChiJune");
//     const data = res.data;

//     messageApi.success(data.message || "Đã chia đơn thành công");
//     fetchOrders(); // Cập nhật lại danh sách đơn
//   } catch (err) {
//     console.error(err);
//     messageApi.error("Lỗi khi chia đơn");1234
//   }
// };
const handleResetAllSTT = async () => {
  if (!window.confirm("Bạn có chắc chắn muốn đặt toàn bộ STT từ 1–20000 về 0 không?")) return;
  try {
    const res = await axios.put("/api/orders");
    alert(res.data.message || "Đặt lại STT thành công!");
    fetchOrders(); // Gọi lại API để cập nhật danh sách đơn hàng
  } catch (error) {
    console.error(error);
    alert("Lỗi khi đặt lại STT!");
  }
};

  return (
    <div  style={{
      transform: "scale(1)", padding: 24,
     fontSize: "5px"
     
    }}>
      {contextHolder}
      {/* <Button
  type="primary"
  danger
  onClick={async () => {
    const res = await fetch('/api/orders/batchUpdateSalexuly', { method: 'POST' });
    const data = await res.json();
    messageApi.success(data.message || "Cập nhật xong!");
    fetchOrders(); // Gọi lại để load đơn mới
  }}
>
  Cập nhật Salexuly cho Đỗ Uyển Nhi
</Button> */}
{/* <Button type="primary"  danger onClick={handleResetAllSTT}>
  Đặt STT về 0
</Button> */}
      <div className="filter-card" style={{ marginBottom: 12 }}>
        <div className="filter-card-body" style={{ padding: '12px 20px' }}>
          <Row gutter={[12, 12]} align="middle">
            <Col xs={24} md={10}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                {!(
                  currentUser.position_team === "mkt" || (currentUser.position_team === "mkt" && currentUser.name !== "Phi Navy") ||
                  currentUser.position_team === "kho" ||
                  currentUser.position === "salexacnhan"
                ) && (
                  <Button
                    type="primary"
                    onClick={handleAddNew}
                    className="ft-btn-add action-btn-darkgold"
                    icon={<span style={{fontSize:15, fontWeight:800}}>+</span>}
                  >
                    Thêm đơn hàng
                  </Button>
                )}
                <div className="order-summary-pill">
                  <span className="order-summary-icon">📋</span>
                  <span className="order-summary-content">
                    <span className="order-summary-label">SL ĐƠN</span>
                    <AnimatedCounter
                      value={filteredOrders.length}
                      className="order-summary-value"
                    />
                  </span>
                </div>
                {currentUser.position !== "salenhapdon" && (
                  <div className="order-summary-pill order-summary-pill-wide">
                    <span className="order-summary-icon">💰</span>
                    <span className="order-summary-content">
                      <span className="order-summary-label">Tổng DS (Chưa DONE)</span>
                      <span className="order-summary-value">
                        {(filteredOrders.reduce((acc, order) => {
                          return acc + (Number(order.revenuemkt ?? order.revenue ?? 0) || 0);
                        }, 0) * 17000).toLocaleString()}
                      </span>
                    </span>
                  </div>
                )}
              </div>
            </Col>
            <Col xs={24} md={14}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <Button
                  type="primary"
                  onClick={handleCalculateTotals}
                  className={`ft-btn-add action-btn-darkgold ${isdem ? 'is-dem' : ''}`}
                  icon={<span style={{fontSize:14}}>{isdem ? '✕' : '🧮'}</span>}
                >
                  {isdem ? 'Huỷ đếm' : 'Đếm SL'}
                </Button>
                <Button
                  type="primary"
                  onClick={fetchOrders}
                  className="ft-btn-add action-btn-darkgold"
                >
                  🔄 Tải lại tất cả đơn hàng
                </Button>
              </div>
            </Col>
          </Row>
        </div>
      </div>

      {/* Bảng thống kê SL sản phẩm (nếu đang ở chế độ đếm) */}
      {(currentUser.position_team==="kho"||currentUser.position_team==="mkt" ||currentUser.position ==="leadSALE"||currentUser.position ==="admin"||currentUser.position ==="managerSALE"||  currentUser.name ==="Hoàng Lan Phương"  )&& isdem && (
        <DemSLBlock
          totalQuantities={totalQuantities}
          totalQuantitiesINDON={totalQuantitiesINDON}
          totalQuantitiesCTYDONG={totalQuantitiesCTYDONG}
          totalQuantitiesKHODONG={totalQuantitiesKHODONG}
          totalRevenue={totalRevenue}
          currentUser={currentUser}
          onClose={() => setIsdem(false)}
          visibleSections={{
            main: true,
            tick: currentUser.position_team==="kho" || currentUser.name ==="Hoàng Lan Phương",
            ctyDong: currentUser.position_team !== "mkt" && currentUser.position_team!=="kho" && currentUser.name !=="Hoàng Lan Phương",
            khoDong: currentUser.position_team==="kho" || currentUser.name ==="Hoàng Lan Phương",
          }}
        />
      )}
      
      <div className={`filter-card ${isFilterExpanded ? 'is-expanded' : 'is-collapsed'}`}>
        <div className="filter-card-header">
          <span className="filter-card-icon">🔍</span>
          <span className="filter-card-title">Bộ lọc & Tìm kiếm</span>
          <div className="filter-card-actions">
            <button
              type="button"
              className="filter-toggle-btn filter-toggle-expand"
              onClick={() => setIsFilterExpanded(true)}
              aria-label="Mở rộng"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 9 L12 17 L20 9" />
              </svg>
            </button>
            <button
              type="button"
              className="filter-toggle-btn filter-toggle-collapse"
              onClick={() => setIsFilterExpanded(false)}
              aria-label="Thu gọn"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 15 L12 7 L20 15" />
              </svg>
            </button>
          </div>
        </div>
        <div className="filter-card-body">
          <Row gutter={[12, 12]}>
            <Col xs={24} md={8} lg={7}>
              <div className="filter-group">
                <div className="filter-group-label">
                  <span className="filter-group-dot" style={{background:'#3b82f6'}}></span>
                  Thời gian & Trạng thái
                </div>
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
                  onChange={(value) => setDateRange2(value)}
                >
                  <Option value="today">Hôm Nay</Option>
                  <Option value="yesterday">Hôm Qua</Option>
                  <Option value="week">1 Tuần gần nhất</Option>
                  <Option value="currentMonth">1 Tháng (Từ đầu tháng đến hiện tại)</Option>
                  <Option value="2currentMonth">2 Tháng (Từ tháng trước đến hiện tại)</Option>
                  <Option value="3currentMonth">3 Tháng (Từ tháng trước đến hiện tại)</Option>
                  <Option value="lastMonth">Tháng trước</Option>
                  <Option value="twoMonthsAgo">2 Tháng trước</Option>
                  <Option value="threeMonthsAgo">3 Tháng trước</Option>
                  {!(currentUser.position === "salenhapdon" || currentUser.position === "salexacnhan") && (
                    <Option value="all">Tất cả (hạn chế dùng)</Option>
                  )}
                </Select>
                <Select
                  value={filterType}
                  onChange={handleFilterChange}
                  style={{ width: '100%' }}
                  placeholder="Chọn trạng thái đơn hàng"
                >
                  <Option value="failed">Đơn hàng chưa hoàn thành</Option>
                  <Option value="success">Đã thanh toán + GTC</Option>
                  <Option value="all">Tất cả đơn hàng</Option>
                </Select>
                {currentUser.position_team !== "mkt" && currentUser.position !== "lead" && currentUser.position !== "managerMKT" && currentUser.position !== "leadMKT" && (
                  <Select
                  allowClear
                  value={weightFilter}
                  onChange={(value) => setWeightFilter(value)}
                  style={{ width: '100%' }}
                  placeholder="Lọc theo khối lượng"
                >
                  <Option value="under1kg">Dưới 1kg</Option>
                  <Option value="over1kg">Trên 1kg</Option>
                </Select>
                )}
              </div>
            </Col>
            <Col xs={24} md={8} lg={6}>
              <div className="filter-group">
                <div className="filter-group-label">
                  <span className="filter-group-dot" style={{background:'#10b981'}}></span>
                  Tìm kiếm nhanh
                </div>
                <Input
                  placeholder="Tìm kiếm..."
                  allowClear
                  onPressEnter={(e) => handleSearch(e.target.value.trim())}
                  onClear={() => { setSearchValue(""); handleSearch(""); }}
                  prefix={<SearchOutlined style={{ color: "#9ca3af" }} />}
                />
                {currentUser.position !== "kho2" && (
                  <Input
                    placeholder="Tìm kiếm STT"
                    allowClear
                    onPressEnter={(e) => handleSearch2(e.target.value.trim())}
                    onClear={() => { setSearchValue2(""); handleSearch2(""); }}
                    prefix={<SearchOutlined style={{ color: "#9ca3af" }} />}
                  />
                )}
                {(currentUser.position === "kho1" || currentUser.position_team === "sale") && (<>
                  <Input
                    placeholder="Tìm tên khách hàng..."
                    allowClear
                    onClear={() => setSearchCustomerName("")}
                    onPressEnter={(e) => setSearchCustomerName(e.target.value.trim())}
                    prefix={<SearchOutlined style={{ color: "#9ca3af" }} />}
                  />
                  <Input
                    placeholder="Tìm tên Sản Phẩm..."
                    allowClear
                    onClear={() => setSearchCustomerName2("")}
                    onPressEnter={(e) => setSearchCustomerName2(e.target.value.trim())}
                    prefix={<SearchOutlined style={{ color: "#9ca3af" }} />}
                  />
                </>)}
                {currentUser.position === "admin" && (
                  <Input
                    placeholder="Tìm tên Sản Phẩm..."
                    allowClear
                    onClear={() => setSearchCustomerName2("")}
                    onPressEnter={(e) => setSearchCustomerName2(e.target.value.trim())}
                    prefix={<SearchOutlined style={{ color: "#9ca3af" }} />}
                  />
                )}
              </div>
            </Col>
        
            <Col xs={24} md={8} lg={7}>
              <div className="filter-group">
                <div className="filter-group-label">
                  <span className="filter-group-dot" style={{background:'#f59e0b'}}></span>
                  Bộ lọc nâng cao
                </div>
                {currentUser.position_team === "kho" ? (
                  <Select
                    mode="multiple"
                    style={{ width: "100%" }}
                    placeholder="Chọn bộ lọc"
                    allowClear
                    options={[
                      { value: "khoshiping", label: "NHI đóng hàng" },
                      { value: "deliveredchuatick", label: "Đã gửi hàng + CẦN TÍCH ĐÃ IN" },
                      { value: "unpaid", label: "Chưa thanh toán" },
                      { value: "paid", label: "Đã thanh toán" },
                      { value: "deliveredkomavandon", label: "Đã gửi hàng + chưa mã" },
                      { value: "deliveredcomavandon", label: "Đã gửi hàng + Có mã" },
                      { value: "deliveredcomavandon2", label: "Chưa gửi hàng + Có mã" },
                      { value: "waitDelivered", label: "Chưa gửi hàng" },
                      { value: "not_delivered", label: "Đã gửi hàng" },
                      { value: "delivered", label: "Giao thành công" },
                      { value: "ctyshiping2", label: "Công Ty đóng hàng + Chưa mã" },
                      { value: "ctyshiping", label: "Công Ty đóng hàng" },
                    ]}
                    onChange={(values) => setSelectedFilters(values)}
                  />
                ) : (
                  <Select
                    mode="multiple"
                    style={{ width: "100%" }}
                    placeholder="Chọn bộ lọc"
                    allowClear
                    options={[
                      { value: "done", label: "Đơn Done" },
                      { value: "unpaid_success", label: "Chưa thanh toán & Giao Thành công" },
                      { value: "donechuaguichuagui", label: "Done + Chưa Gửi Hàng" },
                      { value: "waiting_done", label: "Đơn chưa Done" },
                      { value: "ok", label: "Đơn OK" },
                      { value: "check", label: "Đơn CHECK" },
                      { value: "ds0", label: "Doanh số bằng 0" },
                      { value: "dskhac0", label: "Doanh số khác 0" },
                      { value: "even_stt", label: "Đơn STT CHẴN" },
                      { value: "odd_stt", label: "Đơn STT LẺ" },
                      { value: "slam", label: "Điền sl âm" },
                      { value: "chuyendon", label: "Đơn CHUYỂN ĐƠN" },
                      { value: "booktb", label: "BOOK TB" },
                      { value: "waiting_approval", label: "Đợi xác nhận" },
                      { value: "duplicate_name", label: "Trùng tên khách" },
                      { value: "duplicate_phone", label: "Trùng số điện thoại" },
                      { value: "unpaid", label: "Chưa thanh toán" },
                      { value: "paid", label: "Đã thanh toán" },
                      { value: "ero", label: "Đơn thiếu sale xử lý" },
                      { value: "ctyshiping2", label: "Công Ty đóng hàng + Chưa mã" },
                      { value: "ctyshiping", label: "Công Ty đóng hàng" },
                      { value: "khoshiping", label: "NHI đóng hàng" },
                      { value: "waitDelivered", label: "Chưa gửi hàng" },
                      { value: "deliveredkomavandon", label: "Đã gửi hàng + chưa mã" },
                      { value: "not_delivered", label: "Đã gửi hàng" },
                      { value: "delivered", label: "Giao thành công" },
                      { value: "donechuaguichuagui2", label: "Khác Done + Đã Gửi Hàng" },
                    ]}
                    onChange={(values) => setSelectedFilters(values)}
                  />
                )}
                <Select
                  value={shiftFilter}
                  onChange={(value) => setShiftFilter(value)}
                  style={{ width: "100%" }}
                  placeholder="Chọn ca làm việc"
                  allowClear
                >
                  <Option value="hanhchinh">Ca Hành Chính</Option>
                  <Option value="onlinetoi">Ca Online Tối</Option>
                  <Option value="onlinesang">Ca Online Sáng</Option>
                </Select>
                {currentUser.position_team !== "mkt" && currentUser.position !== "lead" && currentUser.position !== "managerMKT" && currentUser.position !== "leadMKT" && (
                <Select
                  value={shiftFilter2}
                  onChange={(value) => setShiftFilter2(value)}
                  style={{ width: "100%" }}
                  placeholder="Chọn Team"
                  allowClear
                >
                  <Option value="SON">TEAM SƠN</Option>
                  <Option value="QUAN">TEAM QUÂN</Option>
                  <Option value="LE">TEAM LẺ</Option>
                  <Option value="TUANANH">TEAM TUẤN ANH</Option>
                  <Option value="DIEN">TEAM DIỆN</Option>
                  <Option value="DIEU">TEAM DIỆU</Option>
                  <Option value="PHI">TEAM PHI</Option>
                  <Option value="DIENON">TEAM DIỆN ON</Option>
                  <Option value="ANH">TEAM ÁNH</Option>
                  <Option value="PHUTHANH">TEAM Phú Thành</Option>
                  <Option value="TUNG">TEAM TÙNG</Option>
                </Select>
                )}
                <div className="check-customer-box">
                  <Input
                    placeholder="Nhập tên hoặc SĐT khách..."
                    allowClear
                    onPressEnter={(e) => handleSearchCustomerModal(e.target.value.trim())}
                    id="check-customer-input"
                    className="check-customer-input"
                  />
                  <Button
                    type="primary"
                    onClick={() => {
                      const el = document.getElementById('check-customer-input');
                      const v = el ? el.value.trim() : '';
                      handleSearchCustomerModal(v);
                    }}
                    className="check-customer-btn"
                    icon={<span style={{fontSize:14}}>🔎</span>}
                  >
                    CHECK KHÁCH
                  </Button>
                </div>
              </div>
            </Col>
  
 
        
            {currentUser.position_team !== "kho" && (
              <Col xs={24} md={24} lg={4}>
                <div className="filter-group">
                  <div className="filter-group-label">
                    <span className="filter-group-dot" style={{background:'#8b5cf6'}}></span>
                    Sale / MKT
                  </div>
                  {currentUser.position_team !== "mkt" && currentUser.position !== "lead" && currentUser.position !== "managerMKT" && currentUser.position !== "leadMKT" && (
                  <Select
                    style={{ width: "100%" }}
                    disabled={currentUser.position === "mkt"}
                    placeholder="Chọn Sale"
                    options={saleOptions.map((s) => ({ value: s, label: s }))}
                    onChange={(value) => setSelectedSale(value)}
                    allowClear
                    showSearch
                  />
                  )}
                  <Select
                    mode="multiple"
                    style={{ width: "100%" }}
                    disabled={currentUser.position === "mkt" || currentUser.position === "salenhapdon"}
                    placeholder="Chọn MKT"
                    options={mktOptions.map((m) => ({ value: m, label: m }))}
                    onChange={(value) => setSelectedMKT(value)}
                    allowClear
                    showSearch
                  />
                </div>
              </Col>
            )}
          </Row>
          {currentUser.position_team === "kho" && exportDisabled && (
            <div className="filter-card-footer">
              <ExportExcelButton orders={filteredOrdersForExcel} />
            </div>
          )}
        </div>
      </div>
      {( currentUser.position_team==="kho" &&currentUser.position !=="kho2"
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
 ) && (<><Button onClick={handleCopy} type="primary" style={{ marginBottom: 16 }}>
  Copy toàn bộ dữ liệu
</Button>
  <Table  
  
    columns={selectedTableColumns}
    dataSource={sortedOrders}
    rowKey="id"
    bordered
    pagination={{ pageSize: searchText ? 100 : 20 }}
    // pagination={false}
  /></>
)}
        </Col>
        <Col flex="auto">

    {(  currentUser.name ==='Tung99' || currentUser.name ==='test' 
 ) && (    <>
  <Button onClick={() => setShowProductColumn(prev => !prev)} style={{ marginBottom: 8 }}>
  {showProductColumn ? "Ẩn cột sản phẩm" : "Hiện cột sản phẩm"}
</Button>
       <Table
  dataSource={pageProductStats}
  rowKey="page"
  title={() => "📊 Tổng kết sản phẩm theo Page"}
  columns={[
    {
      title: "Tên Page",
      dataIndex: "page",
      key: "page",
      width: 150,
    },
    {
      title: "MKT",
      dataIndex: "mkt",
      key: "mkt",
      width: 120,
    },
    {
      title: "Tổng SL",
      dataIndex: "totalQuantity",
      key: "totalQuantity",
      sorter: (a, b) => a.totalQuantity - b.totalQuantity,
      defaultSortOrder: "descend",
      width: 100,
    },
    {
      title: "Sản phẩm",
      dataIndex: "productStr",
      key: "productStr",
    },
    ...(showProductColumn
      ? [
          {
  title: "Tên khách",
  dataIndex: "customers",
  key: "customers",
  render: (text) => {
    const names = text.split(",").map(name => name.trim());
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
        {names.map((name, idx) => {
          const isDuplicate = customerNameCountMap.get(name) > 1;
          const bgColor = isDuplicate ? getCustomerColor(name) : "transparent";

          return (
            <div
              key={idx}
              style={{
                backgroundColor: bgColor,
                padding: "2px 6px",
                borderRadius: "4px",
                color: isDuplicate ? "#000" : "#333",
                fontSize: "12px",
                border: isDuplicate ? "1px solid #ccc" : "none",
                whiteSpace: "nowrap"
              }}
            >
              {name}
            </div>
          );
        })}
      </div>
    );
  },
},
        ]
      : []),
    
  ]}
/>
</>)}

        <Table 
  className={`order-table-wrapper ${isMobile ? 'mobile-view' : ''}`}
  scroll={{ x: isMobile ? 800 : 'max-content' }}
  columns={
    currentUser.position === "kho1"
      ? columnsKHO
      : (currentUser.position_team === "mkt" && currentUser.name !== "Phi Navy" )
      ? columnsMKT : currentUser.position === "kho2" ? columnsKHO2
      :currentUser.name === "Phi Navy" ? columns
      : columns
  }
  dataSource={sortedOrders}
  rowKey="id"
  loading={loading}
  pagination={{ pageSize: searchText ? 100 : (isMobile ? 10 : 20) }}
  bordered
  size={isMobile ? "small" : "middle"}
/>
        </Col>
      </Row>
      <OrderForm
        open={formVisible}
        onCancel={() => setFormVisible(false)}
        onSubmit={handleSubmit}
        initialValues={editingOrder || orders.find((order) => order.id === currentEditId)}
        employees={employees}
        dataPagename={dataPagename}
        
        namesalexuly={namesalexuly}
        resetPagename={resetPagename}
        loading={loading}
         onProductsChange={setProducts} 
      />
      <CustomerHistoryModal
        visible={modalVisible}
        orders={modalCustomerOrders}
        onClose={() => setModalVisible(false)}
        onEdit={(record) => {
          setCurrentEditId(record.id);
          setEditingOrder(record);
          setFormVisible(true);
        }}
        onDelete={handleDeleteOrder}
        currentUser={currentUser}
      />

    </div>
  );
};

export default OrderList;
