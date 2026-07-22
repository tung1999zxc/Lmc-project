// pages/dashboard.js
"use client";
import React, { useState, useEffect } from "react";
import {
  Table,
  Form,
  Modal,
  InputNumber,
  DatePicker,
  Popconfirm,
  Button,
  Select,
  message,

  Row,
  notification,
  Col,
} from "antd";

import moment from "moment";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";
const { Option } = Select;
import axios from "axios";
import { useRouter } from "next/navigation";
import { fetchEmployees, fetchOrders } from "../store/dataSlice";
const Dashboard = () => {
  const currentUser = useSelector((state) => state.user.currentUser);
  const router = useRouter();

  useEffect(() => {
    if (!currentUser.name) {
      router.push("/login");
    }
  }, []);

  const [period, setPeriod] = useState("null");
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [safeOrders, setSafeOrders] = useState([]);
  const [records, setRecords] = useState([]);
  const [tienthuaall, settienthuaall] = useState([]);
  const [safeEmployees, setSafeEmployees] = useState([]);
  const [editingRecord, setEditingRecord] = useState(null);
  const [messageApi, contextHolder] = message.useMessage();
  // Bộ lọc theo khoảng thời gian (mặc định 7 ngày)
  // const [filterOption, setFilterOption] = useState("7"); // Đã loại bỏ
  // Nếu là manager, có thêm bộ lọc để chọn team (default "all" hiển thị tất cả các team)
const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [popupData, setPopupData] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState("all");

  const fetchEmployees = async () => {
    
    try {
      const response = await axios.get("/api/employees");
      // response.data.data chứa danh sách nhân viên theo API đã viết
      setSafeEmployees(response.data.data);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách nhân viên:", error);
      message.error("Lỗi khi lấy danh sách nhân viên");
    } finally {
       
    }
  };

  const fetchOrders = async () => {
    try {
      const dates = getDateRange();
    const start = dates[0];
    const end = dates[dates.length - 1];
    const response = await axios.get(`/api/ordersMKT?start=${start}&end=${end}`);
      setSafeOrders(response.data.data);
    } catch (error) {
      console.error(error);
      message.error("Lỗi khi lấy đơn hàng");
    }
  };
useEffect(() => {
  if (!currentUser) return;

  if (currentUser.position === "lead") {
    setPeriod("week");
  } else {
    setPeriod("month");
  }
}, [currentUser]);
  useEffect(() => {
    fetchRecords();
    fetchEmployees();
    fetchOrders();
  }, [period]);

  // Refresh khi có thay đổi từ SidebarMenu (xin ads)
  const [refreshKey, setRefreshKey] = useState(0);
  useEffect(() => {
    const handleStorage = () => setRefreshKey(k => k + 1);
    window.addEventListener("storage", handleStorage);
    const interval = setInterval(() => {
      const lastXin = localStorage.getItem("xinAdsSuccess");
      if (lastXin) {
        localStorage.removeItem("xinAdsSuccess");
        setRefreshKey(k => k + 1);
      }
    }, 500);
    return () => {
      window.removeEventListener("storage", handleStorage);
      clearInterval(interval);
    };
  }, []);
  useEffect(() => {
    fetchRecords();
    fetchEmployees();
    fetchOrders();
  }, [refreshKey]);

  // if (currentUser.position === 'admin'){
  //   // Nếu admin thì trả về gì đó (theo code ban đầu của bạn)
  //   return (currentUser.position_team = ['sale', 'mkt']);
  // };

  // Với vai trò lead, lấy danh sách mã nhân viên cùng team của lead
  const leadTeamMembers = safeEmployees
    .filter((employee) => employee.team_id === currentUser.team_id)
    .map((employee) => employee.employee_code);

  // Tạo danh sách các team (ví dụ, team_id là chuỗi 'SON', 'QUAN', 'CHI', 'LE')
  const teamsList = [
    {
      id: 1,
      name: `TEAM SƠN `,
      members: safeEmployees
        .filter((employee) => employee.team_id === "SON")
        .map((employee) => employee.employee_code),
    },
    {
      id: 2,
      name: `TEAM QUÂN `,
      members: safeEmployees
        .filter((employee) => employee.team_id === "QUAN")
        .map((employee) => employee.employee_code),
    },
    // {
    //   id: 3,
    //   name: `TEAM CHI `,
    //   members: safeEmployees
    //     .filter(employee => employee.team_id === 'CHI')
    //     .map(employee => employee.employee_code)
    // },
    {
      id: 4,
      name: `TEAM LẺ `,
      members: safeEmployees
        .filter((employee) => employee.team_id === "LE")
        .map((employee) => employee.employee_code),
    },
    {
      id: 5,
      name: `TEAM TUẤN ANH `,
      members: safeEmployees
        .filter((employee) => employee.team_id === "TUANANH")
        .map((employee) => employee.employee_code),
    },
    {
      id: 6,
      name: `TEAM DIỆN `,
      members: safeEmployees
        .filter((employee) => employee.team_id === "DIEN")
        .map((employee) => employee.employee_code),
    },

    {
      id: 7,
      name: `TEAM DIỆU`,
      members: safeEmployees
        .filter((employee) => employee.team_id === "DIEU")
        .map((employee) => employee.employee_code),
    },
    {
      id: 8,
      name: `TEAM PHI`,
      members: safeEmployees
        .filter((employee) => employee.team_id === "PHI")
        .map((employee) => employee.employee_code),
    },
    {
      id: 9,
      name: `TEAM PHÚ THÀNH`,
      members: safeEmployees
        .filter((employee) => employee.team_id === "PHUTHANH")
        .map((employee) => employee.employee_code),
    },
    {
      id: 10,
      name: `TEAM ÁNH`,
      members: safeEmployees
        .filter((employee) => employee.team_id === "ANH")
        .map((employee) => employee.employee_code),
    },
    {
      id: 11,
      name: `TEAM TÙNG`,
      members: safeEmployees
        .filter((employee) => employee.team_id === "TUNG")
        .map((employee) => employee.employee_code),
    },
  ];

  // Calculate min width for team select based on longest text
  const maxTeamNameLength = Math.max(
    "Tất cả".length,
    ...teamsList.map(t => t.name.length)
  );
  const teamSelectWidth = Math.max(140, maxTeamNameLength * 10 + 20);

  const filterSampleOrdersByPeriod = (order) => {
    const orderDate = moment(order.orderDate, "YYYY-MM-DD");
    const now = moment();
    if (period === "week") {
      // 1 Tuần Gần Nhất: từ 7 ngày trước đến hiện tại
      return orderDate.isSameOrAfter(now.clone().subtract(7, "days"), "day");
    } else if (period === "day") {
      // Ngày hiện tại: so sánh theo ngày
      return orderDate.isSame(moment(), "day");
    } else if (period === "yesterday") {
      // Ngày hiện tại: so sánh theo ngày
      return orderDate.isSameOrAfter(now.clone().subtract(1, "days"), "day");
    } else if (period === "month") {
      // Tháng Này: từ đầu tháng đến hiện tại
      return (
        orderDate.isSame(now, "month") &&
        orderDate.isSameOrAfter(now.clone().startOf("month"))
      );
    } else if (period === "lastMonth") {
      // Tháng Trước: toàn bộ tháng trước
      const lastMonth = now.clone().subtract(1, "months");
      return orderDate.isSame(lastMonth, "month");
    } else if (period === "twoMonthsAgo") {
      // 2 Tháng Trước: toàn bộ tháng cách đây 2 tháng
      const twoMonthsAgo = now.clone().subtract(2, "months");
      return orderDate.isSame(twoMonthsAgo, "month");
    }
    return true;
  };

  // Hàm lọc records theo khoảng thời gian dựa trên period state
  const filterRecordsByPeriod = (record) => {
    const recordDate = moment(record.date, "YYYY-MM-DD");
    const now = moment();
    if (period === "week") {
      return recordDate.isSameOrAfter(now.clone().subtract(7, "days"), "day");
    } else if (period === "day") {
      // Ngày hiện tại: so sánh theo định dạng "YYYY-MM-DD"
      return recordDate.format("YYYY-MM-DD") === now.format("YYYY-MM-DD");
    } else if (period === "yesterday") {
      // So sánh ngày hôm qua
      const yesterday = now.clone().subtract(1, "days");
      return recordDate.format("YYYY-MM-DD") === yesterday.format("YYYY-MM-DD");
    } else if (period === "month") {
      return (
        recordDate.isSame(now, "month") &&
        recordDate.isSameOrAfter(now.clone().startOf("month"))
      );
    } else if (period === "lastMonth") {
      const lastMonth = now.clone().subtract(1, "months");
      return recordDate.isSame(lastMonth, "month");
    } else if (period === "twoMonthsAgo") {
      const twoMonthsAgo = now.clone().subtract(2, "months");
      return recordDate.isSame(twoMonthsAgo, "month");
    }
    return true;
  };

  // Tính tổng doanh số cho một nhân viên dựa trên sampleOrders đã được lọc theo thời gian
  const computeTotalSales = (employeeName) => {
    const totalProfit =
      safeOrders
        .filter(
          (p) =>
            p.mkt.trim().toLowerCase() === employeeName.trim().toLowerCase() &&
            filterSampleOrdersByPeriod(p)
        )
         .reduce((sum, order) => {
    const value = Number(order.profitmkt ?? order.profit ?? 0);
    return sum + (isNaN(value) ? 0 : value);
  }, 0) * 17000;
    return totalProfit * 0.95;
  };
  // --- CHỨC NĂNG LỌC %ADS > 30% TRONG 3 NGÀY LIÊN TIẾP & GỬI TELEGRAM ---
  // --- CHỨC NĂNG LỌC %ADS > 30% TRONG 3 NGÀY LIÊN TIẾP, HIỂN THỊ POPUP & GỬI TELEGRAM ---
  const handleCheckAndSendTelegram = async () => {
    try {
      setLoading(true);
      
      // 1. Lấy danh sách 3 ngày gần nhất (Hôm nay, Hôm qua, Hôm kia)
      const targetDates = [
       
        dayjs().subtract(1, "day").format("YYYY-MM-DD"),
        dayjs().subtract(2, "day").format("YYYY-MM-DD"),
        dayjs().subtract(3, "day").format("YYYY-MM-DD"),
      ];

      const highAdsEmployees = [];

      // 2. Duyệt qua toàn bộ nhân viên để tính toán dữ liệu 3 ngày
      safeEmployees.forEach((emp) => {
        let continuousDaysCount = 0;
        const details3Days = [];

        targetDates.forEach((date) => {
          const record = records.find(
            (r) => r.userId === emp.employee_code && r.date === date
          );
          
          // Tính doanh số thực tế ngày đó (áp dụng công thức giống trong bảng của bạn)
          const totalSales = computeTotalSalesForDate(date, emp.name) * 17000 * 0.95;
          // Tính số tiền xin ngày đó
          const totalAdsRequest = record ? (record.request1 || 0) + (record.request2 || 0) + (record.request3 || 0) : 0;
          // Tính %ADS
          const percentAds = totalSales > 0 ? (totalAdsRequest / totalSales) * 100 : 0;

          details3Days.push({
            key: date,
            date: moment(date).format("DD/MM/YYYY"),
            sales: totalSales,
            adsRequest: totalAdsRequest,
            percent: parseFloat(percentAds.toFixed(2))
          });

          if (percentAds > 33) {
            continuousDaysCount++;
          }
        });

        // Nếu đủ 3 ngày liên tiếp đều > 30%
        if (continuousDaysCount === 3) {
          highAdsEmployees.push({
            key: emp.employee_code,
            code: emp.employee_code,
            name: emp.name,
            details: details3Days // Mảng chứa dữ liệu chi tiết từng ngày
          });
        }
      });

      if (highAdsEmployees.length === 0) {
        message.info("Không có nhân viên nào vượt quá 33% ADS trong 3 ngày liên tiếp.");
        setLoading(false);
        return;
      }

      // 3. Đổ dữ liệu vào state để hiển thị lên bảng Popup (Modal) trên trang web
      setPopupData(highAdsEmployees);
      setIsPopupOpen(true);

      // 4. Xây dựng nội dung tin nhắn để gửi Telegram cùng lúc
      let telegramMessage = `⚠️ *DANH SÁCH NHÂN VIÊN %ADS trên 33% (3 NGÀY LIÊN TIẾP)*\n\n`;
      highAdsEmployees.forEach((emp) => {
        telegramMessage += `👤 Nhân viên: ${emp.name}\n`;
        // Tạo khung bảng giả lập bằng chữ bằng thẻ <pre>
        telegramMessage += ``;
        telegramMessage += `|   Ngày   | Doanh Số | Tiền ADS | %ADS  |\n`;
        telegramMessage += `|----------|----------|----------|-------|\n`;
        
        emp.details.forEach(day => {
          // Hàm bổ trợ cắt/thêm khoảng trắng giúp các cột luôn thẳng hàng hoàn hảo
          const padCenter = (str, len) => str.padEnd(len - Math.floor((len - str.length)/2)).padStart(len);
          const padLeft = (str, len) => str.padStart(len);
          
          const dateStr = day.date.substring(0, 5); // Lấy dạng DD/MM cho ngắn gọn, vừa khung bảng
          const salesStr = day.sales > 0 ? `${Math.round(day.sales / 1000)}k` : "0";
          const adsStr = day.adsRequest > 0 ? `${Math.round(day.adsRequest / 1000)}k` : "0";
          const percentStr = `${day.percent}%`;

          telegramMessage += `| ${padCenter(dateStr, 8)} | ${padLeft(salesStr, 8)} | ${padLeft(adsStr, 8)} | ${padLeft(percentStr, 5)} |\n`;
        });
        telegramMessage += `\n`;
        telegramMessage += `─────────────────────────\n`;
      });

      // Cấu hình Bot Telegram (Điền Token và Chat ID thực tế của bạn vào đây)
      const TELEGRAM_BOT_TOKEN = "8539446685:AAGPeAgad4e5Uv5WrTqYoahJQmMA98Y6plA"; 
      const TELEGRAM_CHAT_ID = "1696923084"; 
      // const TELEGRAM_CHAT_ID = "6280099511"; 

      if (TELEGRAM_BOT_TOKEN !== "YOUR_BOT_TOKEN_HERE") {
        await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          chat_id: TELEGRAM_CHAT_ID,
          text: telegramMessage,
          parse_mode: "Markdown",
        });
        notification.success({
          message: "Telegram",
          description: "Đã gửi danh sách báo cáo qua Telegram!",
        });
      }

    } catch (error) {
      console.error("Lỗi hệ thống:", error);
      message.error("Có lỗi xảy ra khi tính toán dữ liệu.");
    } finally {
      setLoading(false);
    }
  };

  const computeTotalADS = (employeeName) => {
    const totalADS = records
      .filter(
        (p) =>
          p.name.trim().toLowerCase() === employeeName.trim().toLowerCase() &&
          filterRecordsByPeriod(p)
      )
      .reduce((sum, p) => sum + (p.request1 + p.request2 + (p.request3 || 0)), 0);
    return totalADS;
  };

  const computePercentADS = (employeeName) => {
    const totalSales = computeTotalSales(employeeName);
    const totalADS = computeTotalADS(employeeName);
    return totalSales > 0 ? ((totalADS / totalSales) * 100).toFixed(2) : 0;
  };
  /*** Hàm nhóm record theo userId ***/
  const groupRecordsByUser = (records) => {
    return records.reduce((acc, record) => {
      const user = record.userId;
      if (!acc[user]) {
        acc[user] = [];
      }
      acc[user].push(record);
      return acc;
    }, {});
  };

  /*** Hàm nhóm record theo team (nếu cần) ***/
  const groupRecordsByTeam = (records) => {
    const grouped = {};
    teamsList.forEach((team) => {
      grouped[team.id] = records.filter((record) =>
        team.members.includes(record.userId)
      );
    });
    return grouped;
  };
  const fetchRecords = async () => {
  
  try {
    const dates = getDateRange();
    const start = dates[0];
    const end = dates[dates.length - 1];
    const response = await axios.get(`/api/recordsMKT?start=${start}&end=${end}`);
    setRecords(response.data.data);
  } catch (error) {
    console.error(error);
    message.error("Lỗi khi lấy danh sách");
  } finally {
   
  }
};
  /*** Xử lý submit form (Thêm mới hoặc cập nhật) ***/
  const onFinish = async (values) => {
    const {
      date,
      oldMoney = 0,
      tiendu = 0,
      request1 = 0,
      request2 = 0,
      request3 = 0,
      totalReceived = 0,
      excessMoney = 0,
      sales = 0,
    } = values;
    const newRecord = {
      id: editingRecord ? editingRecord.id : Date.now(),
      date: date.format("YYYY-MM-DD"),
      oldMoney,
      stk: currentUser.stk,
      nh: currentUser.nh,
      request1,
      request2,
      request3,
      excessMoney: oldMoney + request1 + request2 + request3 - totalReceived,
      totalReceived,
      tiendu,
      teamnv: currentUser.team_id,
      adsMoney: request1 + request2 + request3,
      adsMoney2: oldMoney + request1 + request2 + request3 - excessMoney,
      name: currentUser.name,
      userId: currentUser.employee_code, // gán mã nhân viên của người nhập
      isLocked: totalReceived !== 0,
    };

    try {
      if (editingRecord) {
        const response = await axios.put(
          `/api/recordsMKT/${editingRecord.id}`,
          newRecord
        );
        messageApi.success(response.data.message || "Cập nhật thành công");

        fetchRecords();
      } else {
        const response = await axios.post("/api/recordsMKT", newRecord);
        messageApi.success(response.data.message || "Thêm mới thành công");
      }
      fetchRecords();
      setEditingRecord(null);
      form.resetFields();
    } catch (error) {
      console.error(error);
      if (editingRecord) {
        message.error("Lỗi khi cập nhật");
      } else {
        message.error("Lỗi khi thêm mới");
      }
    }
  };
  const computeTotalExcess = (employeeName) => {
    const totalExcess = records
      .filter(
        (p) =>
          p.name.trim().toLowerCase() === employeeName.trim().toLowerCase() &&
          filterRecordsByPeriod(p)
      )
      .reduce(
        (sum, p) =>
          sum +
          ((p.oldMoney || 0) +
            p.request1 +
            p.request2 +
            (p.request3 || 0) +
            (p.tiendu || 0) -
            p.totalReceived),
        0
      );
    return totalExcess;
  };

  /*** Xử lý sửa record ***/
  const onEdit = (record) => {
    setEditingRecord(record);
    form.setFieldsValue({
      date: moment(record.date, "YYYY-MM-DD"),
      oldMoney: record.oldMoney,
      request1: record.request1,
      request2: record.request2,
      request3: record.request3,
      stk: record.stk,
      nh: record.nh,
      totalReceived: record.totalReceived,
      excessMoney: record.excessMoney,
      adsMoney: record.request1 + record.request2 + (record.request3 || 0),
      adsMoney2:
        record.oldMoney +
        record.request1 +
        record.request2 +
        (record.request3 || 0) -
        record.excessMoney,
    });
  };
  const onSave = async (record) => {
    try {
      // Nếu record.totalReceived khác 0, cập nhật isLocked thành true
      if (record.totalReceived !== 0) {
        record.isLocked = true;
      } else record.isLocked = false;
      const response = await axios.put(`/api/recordsMKT/${record.id}`, record);
      messageApi.success(response.data.message || "Lưu thành công");
      alert("Thao tác thành công!");
      fetchRecords();
    } catch (error) {
      console.error(error);
      message.error("Lỗi khi lưu");
    }
  };
  /*** Xử lý xóa record ***/
  const handleInlineChange = (id, field, value) => {
    setRecords((prevRecords) =>
      prevRecords.map((rec) => {
        if (rec.id === id) {
          const updated = { ...rec, [field]: value };
          updated.excessMoney =
            (updated.oldMoney || 0) +
            (updated.request1 || 0) +
            (updated.request2 || 0) +
            (updated.request3 || 0) -
            (updated.totalReceived || 0);
          return updated;
        }
        return rec;
      })
    );
  };
  //Hàm lấy danh sách ngày dựa theo bộ lọc:
  const getDateRange = () => {
    let start, end;
    const now = moment();

    if (period === "day") {
      start = now.clone().startOf("day");
      end = now.clone().endOf("day");
    } else if (period === "yesterday") {
      start = now.clone().subtract(1, "days").startOf("day");
      end = now.clone().subtract(1, "days").endOf("day");
    } else if (period === "week") {
      start = now.clone().subtract(6, "days").startOf("day");
      end = now.clone().endOf("day");
    } else if (period === "month") {
      start = now.clone().startOf("month");
      end = now.clone().endOf("day");
    } else if (period === "lastMonth") {
      start = now.clone().subtract(1, "months").startOf("month");
      end = now.clone().subtract(1, "months").endOf("month");
    } else if (period === "twoMonthsAgo") {
      start = now.clone().subtract(2, "months").startOf("month");
      end = now.clone().subtract(2, "months").endOf("month");
    } else {
      start = now.clone().startOf("month");
      end = now.clone().endOf("day");
    }

    const dates = [];
    let current = start.clone();
    while (current.isSameOrBefore(end, "day")) {
      dates.push(current.format("YYYY-MM-DD"));
      current.add(1, "days");
    }
    return dates;
  };

  //Tạo dữ liệu tổng hợp cho từng ngày và tính các chỉ số tổng:
  const summaryDates = getDateRange();

  const adminSummaryData = summaryDates.map((date) => {
    const selectedTeamMembers =
      selectedTeam !== "all"
        ? teamsList.find((team) => team.id === selectedTeam)?.members || []
        : [];
const isMatchTeam = (userId) =>
  selectedTeam === "all" || selectedTeamMembers.includes(userId);
  // const isMatchTeam = () => true;

    const dsTong =
      safeOrders
        .filter((order) => order.orderDate === date)
        .filter((order) => {
          const matchedEmployee = safeEmployees.find(
            (emp) =>
              emp.name.trim().toLowerCase() === order.mkt.trim().toLowerCase()
          );
          return matchedEmployee && isMatchTeam(matchedEmployee.employee_code);
        })
        .reduce((sum, order) => sum + order.profit, 0) * 17000;

    const adsSang = records
      .filter((r) => r.date === date && isMatchTeam(r.userId))
      .reduce((sum, r) => sum + (r.request1 || 0), 0);

    const adsChieu = records
      .filter((r) => r.date === date && isMatchTeam(r.userId))
      .reduce((sum, r) => sum + (r.request2 || 0), 0);

    const adsGap = records
      .filter((r) => r.date === date && isMatchTeam(r.userId))
      .reduce((sum, r) => sum + (r.request3 || 0), 0);

    const tongAdsXin = adsSang + adsChieu + adsGap;

    const tongTienTieu = records
      .filter((r) => r.date === date && isMatchTeam(r.userId))
      .reduce((sum, r) => sum + (r.totalReceived || 0), 0);

    const tienThua = tongAdsXin - tongTienTieu;
    
    const percentAds =
      dsTong > 0 ? (((tongTienTieu - tienThua)/ dsTong) * 100).toFixed(2) : 0;

    return {
      key: date,
      date,
      dsTong,
      adsSang,
      adsChieu,
      adsGap,
      tongAdsXin,
      tongTienTieu,
      tienThua,
      percentAds,
    };
  });

  const currentMonth = dayjs().month(); // Tháng hiện tại (0-11)
  const currentYear = dayjs().year(); // Năm hiện tại

  // Lọc records có tháng & năm trùng với hiện tại
  const totalTienDuThangNay = records
    .filter((row) => {
      const recordDate = dayjs(row.date);
      return (
        recordDate.month() === currentMonth && recordDate.year() === currentYear
      );
    })
    .reduce((sum, row) => sum + (row.tiendu || 0), 0);

  const totalDSTong = adminSummaryData.reduce(
    (sum, row) => sum + row.dsTong,
    0
  );
  const totalTongAdsXin = adminSummaryData.reduce(
    (sum, row) => sum + row.tongAdsXin,
    0
  );
  const totalTienThua =
    adminSummaryData.reduce((sum, row) => sum + row.tienThua, 0) +
    totalTienDuThangNay;
  const totalPercentAds =
    totalDSTong > 0
      ? ((((totalTongAdsXin - totalTienThua)/ (totalDSTong * 0.95)) * 100)).toFixed(2)
      : 0;

  const adminSummaryColumns = [
    {
      title: "Ngày",
      dataIndex: "date",
      key: "date",
      render: (date) => {
        const formatted = moment(date, "YYYY-MM-DD").format("DD/MM/YYYY");
        const isToday = moment(date, "YYYY-MM-DD").isSame(moment(), "day");
        return (
          <>
            {formatted}
            {isToday && <div style={{ color: "#ff4d4f", fontWeight: "bold", fontSize: 11 }}>Hôm nay</div>}
          </>
        );
      },
    },
    {
      title: "DS TỔNG",
      dataIndex: "dsTong",
      key: "dsTong",
      render: (value) => value.toLocaleString("vi-VN"),
    },
    {
      title: "ADS SÁNG",
      dataIndex: "adsSang",
      key: "adsSang",
      render: (value) => value.toLocaleString("vi-VN"),
    },
    {
      title: "ADS CHIỀU",
      dataIndex: "adsChieu",
      key: "adsChieu",
      render: (value) => value.toLocaleString("vi-VN"),
    },
    {
      title: "TỔNG ADS XIN",
      dataIndex: "tongAdsXin",
      key: "tongAdsXin",
      render: (value) => value.toLocaleString("vi-VN"),
    },
    {
      title: "TỔNG TIỀN TIÊU",
      dataIndex: "tongTienTieu",
      key: "tongTienTieu",
      render: (value) => value.toLocaleString("vi-VN"),
    },
    {
      title: "ADS GẤP",
      dataIndex: "adsGap",
      key: "adsGap",
      render: (value) => value ? value.toLocaleString("vi-VN") : "—",
    },
    {
      title: "TIỀN THỪA",
      dataIndex: "tienThua",
      key: "tienThua",
      render: (value) => value.toLocaleString("vi-VN"),
    },
    {
      title: "%ADS Tiêu",
      dataIndex: "percentAdsTieu",
      key: "percentAdsTieu",
      render: (_, record) => {
        const dsTong = record.dsTong || 0;
        const tongTienTieu = record.tongTienTieu || 0;
        if (dsTong === 0) return <span className="pct em">—</span>;
        const percent = (tongTienTieu / dsTong) * 100;

        let pctClass = "g";
        if (percent >= 30 && percent <= 35) {
          pctClass = "o";
        } else if (percent > 35) {
          pctClass = "r";
        }
        return <span className={`pct ${pctClass}`}>{percent.toFixed(2)}%</span>;
      },
    },
    {
      title: "%ADS Xin",
      dataIndex: "percentAds",
      key: "percentAdsXin",
      render: (value) => {
        const numValue = typeof value === "number" ? value : parseFloat(value);
        if (!numValue || numValue < 5) return <span className="pct em">0%</span>;

        let pctClass = "g";
        if (numValue >= 30 && numValue <= 35) {
          pctClass = "o";
        } else if (numValue > 35) {
          pctClass = "r";
        }
        return <span className={`pct ${pctClass}`}>{(numValue - 1).toFixed(2)}%</span>;
      },
    },
  ];
  // DS TỔNG: {totalDSTong.toLocaleString('vi-VN')} | TỔNG CẤP ADS: {totalTongAdsXin.toLocaleString('vi-VN')} | %ADS:  | TIỀN THỪA TẤT CẢ: {totalTienThua.toLocaleString('vi-VN')}
  //     </div>const
  // --- MKT SUMMARY GRADIENT CARDS ---
  const pctValue = totalPercentAds > 5 ? totalPercentAds - 1 : 0;
  const getPctCardClass = () => {
    if (pctValue < 25) return "mkt-sc-pct-low";
    if (pctValue < 33) return "mkt-sc-pct-mid";
    return "mkt-sc-pct-high";
  };

  const summaryCards = (
    <div className="mkt-summary-cards">
      {/* DS TỔNG */}
      <div className="mkt-summary-card mkt-sc-dst">
        <div className="mkt-sc-icon">💰</div>
        <div className="mkt-sc-content">
          <div className="mkt-sc-label">DS TỔNG</div>
          <div className="mkt-sc-value">{(totalDSTong * 0.95).toLocaleString("vi-VN")}</div>
          <div className="mkt-sc-sub">Doanh số sau 5%</div>
        </div>
      </div>
      {/* TỔNG CẤP ADS */}
      <div className="mkt-summary-card mkt-sc-ads">
        <div className="mkt-sc-icon">📢</div>
        <div className="mkt-sc-content">
          <div className="mkt-sc-label">TỔNG CẤP ADS</div>
          <div className="mkt-sc-value">{totalTongAdsXin.toLocaleString("vi-VN")}</div>
          <div className="mkt-sc-sub">Tiền ADS đã xin</div>
        </div>
      </div>
      {/* TIỀN THỪA TẤT CẢ */}
      <div className="mkt-summary-card mkt-sc-tien">
        <div className="mkt-sc-icon">💚</div>
        <div className="mkt-sc-content">
          <div className="mkt-sc-label">TIỀN THỪA TẤT CẢ</div>
          <div className="mkt-sc-value">{totalTienThua.toLocaleString("vi-VN")}</div>
          <div className="mkt-sc-sub">Tiền còn dư</div>
        </div>
      </div>
      {/* %ADS */}
      <div className={`mkt-summary-card ${getPctCardClass()}`}>
        <div className="mkt-sc-icon">📊</div>
        <div className="mkt-sc-content">
          <div className="mkt-sc-label">%ADS XIN/DS</div>
          <div className="mkt-sc-value">{pctValue.toFixed(2)}%</div>
          <div className="mkt-sc-sub">Tỷ lệ ADS / Doanh số</div>
        </div>
      </div>
    </div>
  );

  const onDelete = async (record) => {
    try {
      const response = await axios.delete(`/api/recordsMKT/${record.id}`);

      let key = "loading";
      message.loading({ content: "Đang xử lý...", key, duration: 2 });
      fetchRecords();
    } catch (error) {
      console.error(error);
      message.error("Lỗi khi xóa");
    }
  };
  /*** Lọc dữ liệu theo khoảng thời gian và theo quyền ***/
  const getFilteredRecords = () => {
    let filtered = [...records];
    // Lọc theo khoảng thời gian dựa trên period đã chọn
    filtered = filtered.filter((record) => filterRecordsByPeriod(record));

    // Lọc theo quyền:
    if (currentUser.position === "mkt") {
      filtered = filtered.filter(
        (record) => record.userId === currentUser.employee_code
      );
    // } else if (currentUser.position === "lead" && period === "month") {
    //  filtered = filtered.filter(
    //     (record) => record.userId === currentUser.employee_code
    //   );
    } else if (currentUser.position === "lead") {
      filtered = filtered.filter((record) =>
        leadTeamMembers.includes(record.userId)
      );
    } else if (
      currentUser.position === "managerMKT" ||
      currentUser.position === "admin"
    ) {
      // Nếu manager chọn một team cụ thể thì lọc theo team đó,
      // còn nếu chọn "all" thì không lọc thêm.
      if (selectedTeam && selectedTeam !== "all") {
        const teamObj = teamsList.find((team) => team.id === selectedTeam);
        if (teamObj) {
          filtered = filtered.filter((record) =>
            teamObj.members.includes(record.userId)
          );
        }
      }
    } else if (currentUser.position_team === "sale") {
      filtered = [];
    } else if (currentUser.position_team === "kho") {
      filtered = [];
    }
     if (currentUser?.name !== "Tung99" ) {
    filtered = filtered.filter(
      (record) => record.name.trim().toLowerCase() !== "tung99"
    );
  }
    return filtered;
  };

  const filteredRecords = getFilteredRecords();

  const computeTotalSalesForDate = (date, recordname) => {
    return date
      ? safeOrders
          .filter(
            (p) =>
              p.orderDate === date &&
              p.mkt.trim().toLowerCase() === recordname.trim().toLowerCase()
          )
          .reduce((sum, order) => {
    const value = Number(order.profitmkt ?? order.profit ?? 0);
    return sum + (isNaN(value) ? 0 : value);
  }, 0)
      : 0;
  };

  /*** Định nghĩa các cột cho bảng ***/
  const columns = [
    {
      title: "Ngày",
      dataIndex: "date",
      key: "date",
      render: (date) => {
        const formatted = moment(date, "YYYY-MM-DD").format("DD/MM/YYYY");
        const isToday = moment(date, "YYYY-MM-DD").isSame(moment(), "day");
        return (
          <>
            {formatted}
            {isToday && <div style={{ color: "#ff4d4f", fontWeight: "bold", fontSize: 11 }}>Hôm nay</div>}
          </>
        );
      },
    },
    {
      title: "Tổng tiền đã tiêu",
      key: "totalReceived",
      render: (_, record) => (
        <input
          className="ei"
          type="number"
          readOnly={
            record.isLocked &&
            currentUser.position !== "managerMKT" &&
            currentUser.position !== "admin"
          }
          value={record.totalReceived ?? ""}
          onChange={(e) =>
            handleInlineChange(record.id, "totalReceived", parseInt(e.target.value) || 0)
          }
          onFocus={(e) => e.target.select()}
          style={{
            width: "100%",
            minWidth: "100px",
            textAlign: "center",
          }}
        />
      ),
    },
    {
      title: "Xin buổi sáng",
      key: "request1",
      render: (_, record) => (
        <input
          className="ei"
          type="number"
          readOnly={
            record.isLocked &&
            currentUser.position !== "managerMKT" &&
            currentUser.position !== "admin"
          }
          value={record.request1 ?? ""}
          onChange={(e) =>
            handleInlineChange(record.id, "request1", parseInt(e.target.value) || 0)
          }
          onFocus={(e) => e.target.select()}
          style={{
            width: "100%",
            minWidth: "100px",
            textAlign: "center",
          }}
        />
      ),
    },
    {
      title: "Xin buổi chiều",
      key: "request2",
      render: (_, record) => (
        <input
          className="ei"
          type="number"
          readOnly={
            record.isLocked &&
            currentUser.position !== "managerMKT" &&
            currentUser.position !== "admin"
          }
          value={record.request2 ?? ""}
          onChange={(e) =>
            handleInlineChange(record.id, "request2", parseInt(e.target.value) || 0)
          }
          onFocus={(e) => e.target.select()}
          style={{
            width: "100%",
            minWidth: "100px",
            textAlign: "center",
          }}
        />
      ),
    },
    {
      title: "Xin gấp",
      key: "request3",
      render: (_, record) => (
        <input
          className="ei"
          type="number"
          placeholder="..."
          value={record.request3 || 0}
          readOnly={
            record.isLocked &&
            currentUser.position !== "managerMKT" &&
            currentUser.position !== "admin"
          }
          onChange={(e) =>
            handleInlineChange(record.id, "request3", parseInt(e.target.value) || 0)
          }
          onFocus={(e) => e.target.select()}
          style={{
            width: "100%",
            minWidth: "100px",
            textAlign: "center",
          }}
        />
      ),
    },
    {
      title: "Tiền dư",
      key: "excessMoney3",

      render: (_, record) => {
        const total = record.request1 + record.request2 + (record.request3 || 0);
        return total - record.totalReceived
          ? (total - record.totalReceived).toLocaleString("vi-VN")
          : 0;
      },
    },
  //   {
  //     title: "Xin đêm",
  //     key: "tiendu",
  //     render: (_, record) => {
  //       const isLastDayOfMonth =
  // dayjs(record.date).date() === dayjs(record.date).daysInMonth(); // Kiểm tra ngày đầu tháng

  //       return isLastDayOfMonth ? (
  //         <InputNumber
  //           readOnly={
  //             record.isLocked &&
  //             currentUser.position !== "managerMKT" &&
  //             currentUser.position !== "admin"
  //           }
  //           value={record.tiendu}
  //           onChange={(value) => handleInlineChange(record.id, "tiendu", value)}
  //           style={{ width: "100%" }}
  //           formatter={(value) => value.toLocaleString("vi-VN")}
  //           parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
  //         />
  //       ) : null; // Không hiển thị gì nếu không phải ngày đầu tháng
  //     },
  //   },
    {
      title: "Doanh số",
      key: "sales",
      render: (_, record) => {
        const totalSalesForSelectedDate = computeTotalSalesForDate(
          record.date,
          record.name
        );
        return (totalSalesForSelectedDate * 0.95 * 17000).toLocaleString(
          "vi-VN"
        );
      },
    },
    {
      title: "%ADS Tiêu",
      key: "percentAdsTieu",
      render: (_, record) => {
        const totalSalesForSelectedDate = computeTotalSalesForDate(
          record.date,
          record.name
        );
        const total = totalSalesForSelectedDate * 17000 * 0.95;
        if (totalSalesForSelectedDate === 0) return <span className="pct em">—</span>;
        const percent = Number(
          (record.totalReceived / total) * 100
        );

        let pctClass = "g";
        if (percent >= 30 && percent <= 35) {
          pctClass = "o";
        } else if (percent > 35) {
          pctClass = "r";
        }
        return <span className={`pct ${pctClass}`}>{percent.toFixed(2)}%</span>;
      },
    },
    {
      title: "%ADS Xin",
      key: "percentAdsXin",
      render: (_, record) => {
        const totalSalesForSelectedDate = computeTotalSalesForDate(
          record.date,
          record.name
        );
        const total = totalSalesForSelectedDate * 17000 * 0.95;
        if (totalSalesForSelectedDate === 0) return <span className="pct em">—</span>;
        const percent = Number(
          ((record.request1 + record.request2) / total) * 100
        );

        let pctClass = "g";
        if (percent >= 30 && percent <= 35) {
          pctClass = "o";
        } else if (percent > 35) {
          pctClass = "r";
        }
        return <span className={`pct ${pctClass}`}>{percent.toFixed(2)}%</span>;
      },
    },

    {
      title: "Hành động",
      key: "action",
      render: (_, record) => {
        const isFirstDayOfMonth = dayjs(record.date).date() === 1; // Kiểm tra ngày đầu tháng
        // Với lead và manager: chỉ cho phép sửa/xóa nếu record thuộc về chính họ, ngược lại chỉ xem
        if (currentUser.position === "lead") {
          if (record.userId === currentUser.employee_code) {
            const isLocked = record.isLocked &&
              currentUser.position !== "managerMKT" &&
              currentUser.position !== "admin";
            if (isLocked) {
              return (
                <div style={{ display: "flex", gap: 6, justifyContent: "center", alignItems: "center" }}>
                  <span style={{ color: "#94a3b8", fontSize: 12 }}>Chỉ xem</span>
                  <span style={{ fontSize: 14 }}>🔒</span>
                </div>
              );
            }
            return (
              <div style={{ display: "flex", gap: 6, justifyContent: "center", alignItems: "center" }}>
                <button
                  className="btn btn-save"
                  onClick={() => onSave(record)}
                  style={{ padding: "4px 12px", fontSize: 12 }}
                >
                  Save
                </button>
                <Popconfirm
                  title="Xóa bản ghi?"
                  onConfirm={() => onDelete(record)}
                >
                  <button
                    className="btn btn-del"
                    style={{ padding: "4px 10px", fontSize: 12 }}
                  >
                    🗑️
                  </button>
                </Popconfirm>
              </div>
            );
          } else {
            return <span style={{ color: "#94a3b8", fontSize: 12 }}>Chỉ xem</span>;
          }
        }
        const isLocked = record.isLocked &&
          currentUser.position !== "managerMKT" &&
          currentUser.position !== "admin";
        if (isLocked) {
          return (
            <div style={{ display: "flex", gap: 6, justifyContent: "center", alignItems: "center" }}>
              <span style={{ color: "#94a3b8", fontSize: 12 }}>Chỉ xem</span>
              <span style={{ fontSize: 14 }}>🔒</span>
            </div>
          );
        }
        return (
          <div style={{ display: "flex", gap: 6, justifyContent: "center", alignItems: "center" }}>
            <button
              className="btn btn-save"
              onClick={() => onSave(record)}
              style={{ padding: "4px 12px", fontSize: 12 }}
            >
              Save
            </button>
            <Popconfirm title="Xóa bản ghi?" onConfirm={() => onDelete(record)}>
              <button
                className="btn btn-del"
                style={{ padding: "4px 10px", fontSize: 12 }}
              >
                🗑️
              </button>
            </Popconfirm>
          </div>
        );
      },
    },
  ];
  const getRecordFromRecentPast = (userId) => {
    // Lặp qua các ngày từ hôm qua trở về quá khứ, giới hạn 30 ngày
    for (let i = 1; i <= 30; i++) {
      const targetDate = dayjs().subtract(i, "day");
      // Lọc các record của user cho ngày targetDate
      const userRecordsForDay = records.filter(
        (record) =>
          record.userId === userId &&
          dayjs(record.date).isSame(targetDate, "day")
      );
      if (userRecordsForDay.length > 0) {
        // Nếu có nhiều record, chọn record mới nhất trong ngày đó (hoặc bạn có thể chọn record đầu tiên)
        return userRecordsForDay.reduce((latest, record) =>
          dayjs(record.date).isAfter(dayjs(latest.date)) ? record : latest
        );
      }
    }
    return null;
  };

  // Kiểm tra bản ghi của user từ quá khứ gần đây
  const pastRecord = getRecordFromRecentPast(currentUser.employee_code);
  const isDisabled = pastRecord ? !pastRecord.isLocked : false;
  const teamSummaryData = summaryDates.map((date) => {
    const row = {
      key: date,
      date,
    };

    teamsList.forEach((team) => {
      const members = team.members;

      const adsSang = records
        .filter((r) => r.date === date && members.includes(r.userId))
        .reduce((sum, r) => sum + (r.request1 || 0), 0);

      const adsChieu = records
        .filter((r) => r.date === date && members.includes(r.userId))
        .reduce((sum, r) => sum + (r.request2 || 0), 0);

      row[`${team.name}_sang`] = adsSang;
      row[`${team.name}_chieu`] = adsChieu;
    });

    return row;
  });

  const teamSummaryColumns = [
    {
      title: "Ngày",
      dataIndex: "date",
      key: "date",
      render: (date) => {
        const formatted = moment(date, "YYYY-MM-DD").format("DD/MM/YYYY");
        const isToday = moment(date, "YYYY-MM-DD").isSame(moment(), "day");
        return (
          <>
            {formatted}
            {isToday && <div style={{ color: "#ff4d4f", fontWeight: "bold", fontSize: 11 }}>Hôm nay</div>}
          </>
        );
      },
      fixed: "left",
    },
    ...teamsList.flatMap((team) => [
      {
        title: team.name,
        children: [
          {
            title: "ADS Sáng",
            dataIndex: `${team.name}_sang`,
            key: `${team.name}_sang`,
            render: (value) => value.toLocaleString("vi-VN"),
          },
          {
            title: "ADS Chiều",
            dataIndex: `${team.name}_chieu`,
            key: `${team.name}_chieu`,
            render: (value) => value.toLocaleString("vi-VN"),
          },
        ],
      },
    ]),
  ];

  // Xác định màu nền và viền dựa trên %ADS
  const getBannerStyle = (employeeName) => {
    const p = parseFloat(computePercentADS(employeeName));
    if (isNaN(p)) return { background: "#f0f0f0", border: "2px solid #8c8c8c", color: "#595959" };
    if (p < 30) return { background: "#54DA1F", border: "2px solid #2e9c0f", color: "#0f3d04" }; // xanh lá
    if (p >= 30 && p < 35) return { background: "#FF9501", border: "2px solid #b35a00", color: "#3d1f00" }; // cam
    if (p >= 35) return { background: "#F999A8", border: "2px solid #c4394f", color: "#5a0d1a" }; // hồng
  };

  return (
    <div style={{ padding: 24 }}>
      {contextHolder}
      {/* POPUP CHI TIẾT NHÂN VIÊN %ADS > 30% TRONG 3 NGÀY */}
      <Modal
        title={<b style={{ color: '#ff4d4f', fontSize: 18 }}>⚠️ NHÂN VIÊN %ADS trên 33% TRONG 3 NGÀY LIÊN TIẾP</b>}
        open={isPopupOpen}
        onCancel={() => setIsPopupOpen(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setIsPopupOpen(false)}>
            Đóng bảng
          </Button>
        ]}
        width={900}
        centered
      >
        <div style={{ marginTop: 16 }}>
          {popupData.map((emp) => (
            <div key={emp.code} style={{ marginBottom: 24, border: '1px solid #f0f0f0', borderRadius: 8, padding: 16, backgroundColor: '#fffbe6' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: 16, color: '#111' }}>
                Nhân viên: <span style={{ color: '#ff4d4f' }}>{emp.name}</span> 
              </h4>
              <Table
                dataSource={emp.details}
                pagination={false}
                bordered
                size="small"
                columns={[
                  {
                    title: "Ngày",
                    dataIndex: "date",
                    key: "date",
                    align: "center",
                  },
                  {
                    title: "Doanh số (đ)",
                    dataIndex: "sales",
                    key: "sales",
                    render: (val) => val.toLocaleString("vi-VN"),
                    align: "right",
                  },
                  {
                    title: "Tiền xin ADS (đ)",
                    dataIndex: "adsRequest",
                    key: "adsRequest",
                    render: (val) => val.toLocaleString("vi-VN"),
                    align: "right",
                  },
                  {
                    title: "% ADS",
                    dataIndex: "percent",
                    key: "percent",
                    align: "center",
                    render: (val) => (
                      <span style={{ color: '#ff4d4f', fontWeight: 'bold', backgroundColor: '#fff1f0', padding: '2px 8px', borderRadius: 4, border: '1px solid #ffa39e' }}>
                        {val}%
                      </span>
                    )
                  },
                ]}
              />
            </div>
          ))}
        </div>
      </Modal>

      {/* Tiêu đề "Nhập thông tin" */}
      {/* Form nhập liệu */}
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            style={{ marginBottom: 16 }}
          >
            <Row gutter={16}>
              <Col xs={24} sm={12} md={3} lg={6}>
                <Form.Item
                  initialValue={moment()}
                  name="date"
                  rules={[{ required: true, message: "Vui lòng chọn ngày" }]}
                >
                  <DatePicker placeholder="Ngày" style={{ width: "100%" }} />
                </Form.Item>

                <Form.Item>
                  <button
                    type="button"
                    disabled={
                      currentUser.position_team === "sale" ||
                      currentUser.position_team === "kho" ||
                      isDisabled
                    }
                    className="btn btn-add"
                    style={{ width: "100%", height: 38, fontSize: 13 }}
                    onClick={() => form.submit()}
                  >
                    {editingRecord ? "Cập nhật" : "Thêm mới Báo cáo"}
                  </button>
                </Form.Item>
              </Col>

              <Col xs={24} sm={10} md={6} lg={8}></Col>
              {(currentUser.position === "managerMKT" ||
                currentUser.position === "admin") && (
                <Col xs={24} sm={12} md={18} lg={16}>
                  {summaryCards}
                </Col>
              )}
            </Row>
          </Form>
        </Col>
      </Row>

      {/* Tiêu đề "Danh sách giao dịch" */}

      {/* Bộ lọc - Chọn thời gian (dạng nút ngang) */}
      <Row gutter={[16, 12]} style={{ marginBottom: 16 }} align="middle" justify="space-between">
        <Col>
          <div className="filter-bar-group">
            <div className="filter-bar-chips">
              <button
                className={`filter-chip ${period === "day" ? "active" : ""}`}
                onClick={() => setPeriod("day")}
              >
                Hôm Nay
              </button>
              <button
                className={`filter-chip ${period === "yesterday" ? "active" : ""}`}
                onClick={() => setPeriod("yesterday")}
              >
                Hôm Qua
              </button>
              <button
                className={`filter-chip ${period === "week" ? "active" : ""}`}
                onClick={() => setPeriod("week")}
              >
                1 Tuần
              </button>
              <button
                className={`filter-chip ${period === "month" ? "active" : ""}`}
                onClick={() => setPeriod("month")}
              >
                Tháng Này
              </button>
              <button
                className={`filter-chip ${period === "lastMonth" ? "active" : ""}`}
                onClick={() => setPeriod("lastMonth")}
              >
                Tháng Trước
              </button>
              <button
                className={`filter-chip ${period === "twoMonthsAgo" ? "active" : ""}`}
                onClick={() => setPeriod("twoMonthsAgo")}
              >
                2 Tháng Trước
              </button>
            </div>
          </div>
        </Col>

        {/* Bộ lọc - Chọn team (Select dropdown) */}
        {(currentUser.position === "managerMKT" ||
          currentUser.position === "admin") && (
          <Col>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#1F2937', fontWeight: 600, whiteSpace: 'nowrap' }}>Chọn team:</span>
              <Select
                value={selectedTeam}
                style={{ width: teamSelectWidth }}
                onChange={(value) => setSelectedTeam(value)}
              >
                <Option value="all">Tất cả</Option>
                {teamsList.map((team) => (
                  <Option key={team.id} value={team.id}>
                    {team.name}
                  </Option>
                ))}
              </Select>
            </div>
          </Col>
        )}
      </Row>
      {(currentUser.position === "managerMKT" || currentUser.position === "admin") && (
  <Col xs={24} sm={12} md={6} style={{ display: 'flex', alignItems: 'flex-end', marginBottom: 16 }}>
    <Button
      type="primary"
      danger
      onClick={handleCheckAndSendTelegram}
    >
      Kiểm tra & Gửi Tele NV %ADS trên 33%
    </Button>
  </Col>
)}
      {/* Summary banner cho admin */}
      {(currentUser.position === "managerMKT" ||
        currentUser.position === "admin") && (
        <div
          style={{
            background: "#fce4ec",
            border: "2px solid #f06292",
            borderRadius: 10,
            padding: "14px 18px",
            marginBottom: 16,
            fontSize: 13,
            fontWeight: 600,
            color: "#c62828",
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <span>
            Tổng doanh số:{" "}
            <strong>{totalDSTong.toLocaleString("vi-VN")}</strong>
          </span>
          <span style={{ color: "#d0a0a8" }}>|</span>
          <span>
            Ads đã xin: <strong>{totalTongAdsXin.toLocaleString("vi-VN")}</strong>
          </span>
          <span style={{ color: "#d0a0a8" }}>|</span>
          <span>
            Tiền thừa:{" "}
            <strong style={{ color: "#16a34a" }}>
              {totalTienThua.toLocaleString("vi-VN")}
            </strong>
          </span>
          <span style={{ color: "#d0a0a8" }}>|</span>
          <span>
            %ADS xin/DS:{" "}
            <strong
              style={{
                background: "#e8f5e9",
                padding: "2px 9px",
                borderRadius: 5,
                color: "#2e7d32",
              }}
            >
              {totalPercentAds > 5 ? (totalPercentAds - 1).toFixed(2) : "0.00"}%
            </strong>
          </span>
          <span style={{ color: "#d0a0a8" }}>|</span>
          <span>
            %ADS tiêu/DS:{" "}
            <strong
              style={{
                background: "#ef9a9a",
                padding: "2px 9px",
                borderRadius: 5,
                color: "#b71c1c",
              }}
            >
              {(() => {
                const totalTienTieu = adminSummaryData.reduce((sum, r) => sum + (r.tongTienTieu || 0), 0);
                const dsTong = totalDSTong;
                return dsTong > 0 ? ((totalTienTieu / dsTong) * 100).toFixed(2) : "0.00";
              })()}%
            </strong>
          </span>
        </div>
      )}
      {(currentUser.position === "managerMKT" ||
        currentUser.position === "admin") && (
        <>
          <Table
            className="mkt-tbl-wrap"
            style={{ marginTop: 32, minWidth: "1200px" }}
            dataSource={teamSummaryData}
            columns={teamSummaryColumns}
            loading={loading}
            pagination={{ pageSize: 10 }}
            scroll={{ x: true }}
          />

          <Table
            className="mkt-tbl-wrap"
            style={{
              minWidth: "900px",
              whiteSpace: "nowrap",
            }}
            dataSource={adminSummaryData.sort((a, b) => {
              return dayjs(b.date).valueOf() - dayjs(a.date).valueOf();
            })}
            columns={adminSummaryColumns}
            rowKey="date"
            pagination={{ pageSize: 10 }}
          />
        </>
      )}
      {/* Render bảng dữ liệu */}
      {currentUser.position === "managerMKT" ||
      currentUser.position === "admin" ||
      currentUser.position === "lead" ? (
        Object.entries(groupRecordsByUser(filteredRecords))
          .sort(([userIdA], [userIdB]) => {
            const currentUserKey = String(currentUser.employee_code);
            if (userIdA === currentUserKey) return -1;
            if (userIdB === currentUserKey) return 1;
            return 0;
          })
          .map(([userId, userRecords]) => (
            <Row gutter={[16, 16]} key={userId} style={{ marginBottom: 24 }}>
              <Col xs={24}>
                <h4>Nhân viên: {userRecords?.[0]?.name}</h4>
                <div
                  style={{
                    minWidth: "800px",
                    whiteSpace: "nowrap",
                    fontWeight: "bold",
                    marginBottom: 8,
                    padding: "12px 16px",
                    borderRadius: "8px",
                    ...getBannerStyle(userRecords[0].name),
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    flexWrap: "wrap",
                    fontSize: 13,
                  }}
                >
                  Nhân viên: {userRecords?.[0]?.name}
                  <span style={{ color: "#d0a0a8" }}>|</span>
                  Tổng doanh số:{" "}
                  <strong>
                    {computeTotalSales(userRecords[0].name).toLocaleString(
                      "vi-VN"
                    )}
                  </strong>
                  <span style={{ color: "#d0a0a8" }}>|</span>
                  Ads đã xin:{" "}
                  <strong>
                    {computeTotalADS(userRecords[0].name).toLocaleString("vi-VN")}
                  </strong>
                  <span style={{ color: "#d0a0a8" }}>|</span>
                  Tiền thừa:{" "}
                  <strong style={{ color: "#16a34a" }}>
                    {computeTotalExcess(userRecords[0].name).toLocaleString(
                      "vi-VN"
                    )}
                  </strong>
                  <span style={{ color: "#d0a0a8" }}>|</span>
                  %ADS xin/DS:{" "}
                  <strong
                    style={{
                      background: "#e8f5e9",
                      padding: "2px 9px",
                      borderRadius: "5px",
                      color: "#2e7d32",
                    }}
                  >
                    {computePercentADS(userRecords[0].name)}%
                  </strong>
                  <span style={{ color: "#d0a0a8" }}>|</span>
                  %ADS tiêu/DS:{" "}
                  <strong
                    style={{
                      background: "#ef9a9a",
                      padding: "2px 9px",
                      borderRadius: "5px",
                      color: "#b71c1c",
                    }}
                  >
                    {/* Tính %ADS tiêu = tổng tiền tiêu / tổng ds */}
                    {(() => {
                      const totalTienTieu = userRecords.reduce((sum, r) => sum + (r.totalReceived || 0), 0);
                      const totalDS = computeTotalSales(userRecords[0].name);
                      const percent = totalDS > 0 ? ((totalTienTieu / totalDS) * 100).toFixed(2) : "0.00";
                      return `${percent}%`;
                    })()}
                  </strong>
                </div>
              </Col>
              <Col xs={24}>
                <Table
                  className="mkt-tbl-wrap"
                  style={{
                    minWidth: "900px",
                    whiteSpace: "nowrap",
                  }}
                  dataSource={userRecords.sort((a, b) => {
                    return dayjs(b.date).valueOf() - dayjs(a.date).valueOf();
                  })}
                  columns={columns}
                  rowKey="id"
                  pagination={{ pageSize: 5 }}
                  scroll={{ x: true }}
                />
              </Col>
            </Row>
          ))
      ) : (
          <>
          <div
                style={{
                  fontWeight: "bold",
                  marginBottom: 8,
                  padding: "12px 16px",
                  borderRadius: "8px",
                  ...getBannerStyle(currentUser.name),
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  flexWrap: "wrap",
                  fontSize: 13,
                }}
              >
                Tổng doanh số:{" "}
            <strong>
              {computeTotalSales(currentUser.name).toLocaleString("vi-VN")}
            </strong>
            <span style={{ color: "#d0a0a8" }}>|</span>
            Ads đã xin:{" "}
            <strong>
              {computeTotalADS(currentUser.name).toLocaleString("vi-VN")}
            </strong>
            <span style={{ color: "#d0a0a8" }}>|</span>
            Tiền thừa:{" "}
            <strong style={{ color: "#16a34a" }}>
              {computeTotalExcess(currentUser.name).toLocaleString("vi-VN")}
            </strong>
            <span style={{ color: "#d0a0a8" }}>|</span>
            %ADS xin/DS:{" "}
            <strong
              style={{
                background: "#e8f5e9",
                padding: "2px 9px",
                borderRadius: "5px",
                color: "#2e7d32",
              }}
            >
              {computePercentADS(currentUser.name)}%
            </strong>
            <span style={{ color: "#d0a0a8" }}>|</span>
            %ADS tiêu/DS:{" "}
            <strong
              style={{
                background: "#ef9a9a",
                padding: "2px 9px",
                borderRadius: "5px",
                color: "#b71c1c",
              }}
            >
              {/* Tính %ADS tiêu = tổng tiền tiêu / tổng ds */}
              {(() => {
                const totalTienTieu = filteredRecords
                  .filter(r => r.name === currentUser.name)
                  .reduce((sum, r) => sum + (r.totalReceived || 0), 0);
                const totalDS = computeTotalSales(currentUser.name);
                const percent = totalDS > 0 ? ((totalTienTieu / totalDS) * 100).toFixed(2) : "0.00";
                return `${percent}%`;
              })()}
            </strong>
          </div>
          <Row gutter={[16, 16]}>
            <Col xs={24}>
              {/* <Table
                dataSource={filteredRecords.sort((a, b) => {
                  return dayjs(b.date).valueOf() - dayjs(a.date).valueOf();
                })}
                columns={columns}
                rowKey="id"
                
                scroll={{ x: true }}
                pagination={{ pageSize: 30 }}
              /> */}
              <div
                style={{
                  width: "100%",
                  overflowX: "auto",
                  WebkitOverflowScrolling: "touch",
                }}
              >
                <Table
                  className="mkt-tbl-wrap"
                  columns={columns}
                  dataSource={filteredRecords.sort((a, b) => {
                    return dayjs(b.date).valueOf() - dayjs(a.date).valueOf();
                  })}
                  pagination={{ pageSize: 30 }}
                  rowKey="id"
                  style={{
                    minWidth: "900px",
                    whiteSpace: "nowrap",
                  }}
                />
              </div>
            </Col>
          </Row>
        </>
      )}
      
    </div>
  
);
  
};

export default Dashboard;
