// pages/dashboard.js
"use client";
import React, { useState, useEffect } from "react";
import {
  Table,
  Form,
  InputNumber,
  DatePicker,
  Popconfirm,
  Button,
  Select,
  message,
  Modal,
  Row,
  notification,
  Col,
} from "antd";
import FullScreenLoading from "../components/FullScreenLoading";

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

  const [period, setPeriod] = useState("month");
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [safeOrders, setSafeOrders] = useState([]);
  const [records, setRecords] = useState([]);
  const [safeEmployees, setSafeEmployees] = useState([]);
  const [editingRecord, setEditingRecord] = useState(null);
  
  // Bộ lọc theo khoảng thời gian (mặc định 7 ngày)
  // const [filterOption, setFilterOption] = useState("7"); // Đã loại bỏ
  // Nếu là manager, có thêm bộ lọc để chọn team (default "all" hiển thị tất cả các team)

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
  const dates = getDateRange();
  const start = dates[0];
  const end = dates[dates.length - 1];
  fetchRecords(start, end);
  fetchOrders(start, end);
}, [period]);

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
      name: `TEAM PHONG `,
      members: safeEmployees
        .filter((employee) => employee.team_id === "PHONG")
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
      id: 8,
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
  ];

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
        .reduce((sum, p) => sum + p.profit, 0) * 17000;
    return totalProfit * 0.95;
  };
  const computeTotalADS = (employeeName) => {
    const totalADS = records
      .filter(
        (p) =>
          p.name.trim().toLowerCase() === employeeName.trim().toLowerCase() &&
          filterRecordsByPeriod(p)
      )
      .reduce((sum, p) => sum + (p.request1 + p.request2), 0);
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
  setLoading(true);
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
    setLoading(false);
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
      totalReceived = 0,
      excessMoney = 0,
      sales = 0,
    } = values;
    const newRecord = {
      id: editingRecord ? editingRecord.id : Date.now(),
      date: date.format("YYYY-MM-DD"),
      oldMoney,
      request1,
      request2,
      excessMoney: oldMoney + request1 + request2 - totalReceived,
      totalReceived,
      tiendu,
      teamnv: currentUser.team_id,
      adsMoney: request1 + request2,
      adsMoney2: oldMoney + request1 + request2 - excessMoney,
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
        message.success(response.data.message || "Cập nhật thành công");

        fetchRecords();
      } else {
        const response = await axios.post("/api/recordsMKT", newRecord);
        message.success(response.data.message || "Thêm mới thành công");
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
      totalReceived: record.totalReceived,
      excessMoney: record.excessMoney,
      adsMoney: record.request1 + record.request2,
      adsMoney2:
        record.oldMoney +
        record.request1 +
        record.request2 -
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
      message.success(response.data.message || "Lưu thành công");
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
            (updated.request2 || 0) -
            (updated.totalReceived || 0);
          return updated;
        }
        return rec;
      })
    );
  };
  //Hàm lấy danh sách ngày dựa theo bộ lọc:
  const getDateRange = (customPeriod = period) => {
  let start, end;
  const now = moment();

  if (customPeriod === "day") {
    start = now.clone().startOf("day");
    end = now.clone().endOf("day");
  } else if (customPeriod === "yesterday") {
    start = now.clone().subtract(1, "days").startOf("day");
    end = now.clone().subtract(1, "days").endOf("day");
  } else if (customPeriod === "week") {
    start = now.clone().subtract(6, "days").startOf("day");
    end = now.clone().endOf("day");
  } else if (customPeriod === "month") {
    start = now.clone().startOf("month");
    end = now.clone().endOf("day");
  } else if (customPeriod === "lastMonth") {
    start = now.clone().subtract(1, "months").startOf("month");
    end = now.clone().subtract(1, "months").endOf("month");
  } else if (customPeriod === "twoMonthsAgo") {
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

    const tongAdsXin = adsSang + adsChieu;

    const tongTienTieu = records
      .filter((r) => r.date === date && isMatchTeam(r.userId))
      .reduce((sum, r) => sum + (r.totalReceived || 0), 0);

    const tienThua = tongAdsXin - tongTienTieu;
    const percentAds =
      dsTong > 0 ? ((tongTienTieu / dsTong) * 100).toFixed(2) : 0;

    return {
      key: date,
      date,
      dsTong,
      adsSang,
      adsChieu,
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
      ? ((totalTongAdsXin / (totalDSTong * 0.95)) * 100).toFixed(2)
      : 0;

  const adminSummaryColumns = [
    {
      title: "Ngày",
      dataIndex: "date",
      key: "date",
      render: (date) => moment(date, "YYYY-MM-DD").format("DD/MM/YYYY"),
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
      title: "TIỀN THỪA",
      dataIndex: "tienThua",
      key: "tienThua",
      render: (value) => value.toLocaleString("vi-VN"),
    },
    {
      title: "%ADS",
      dataIndex: "percentAds",
      key: "percentAds",
      render: (value) => {
        const numValue = typeof value === "number" ? value : parseFloat(value);
        let bgColor = "";
        if (numValue < 30) {
          bgColor = "#54DA1F"; // nền xanh lá (màu xanh nhạt)
        } else if (numValue >= 30 && numValue <= 35) {
          bgColor = "#FF9501"; // nền vàng nhạt
        } else {
          bgColor = "#F999A8"; // nền đỏ nhạt
        }
        return (
          <div
            style={{
              backgroundColor: bgColor,

              borderRadius: "4px",
              textAlign: "center",
              fontWeight: "bold",
            }}
          >
            {numValue.toFixed(2)}%
          </div>
        );
      },
    },
  ];
  // DS TỔNG: {totalDSTong.toLocaleString('vi-VN')} | TỔNG CẤP ADS: {totalTongAdsXin.toLocaleString('vi-VN')} | %ADS:  | TIỀN THỪA TẤT CẢ: {totalTienThua.toLocaleString('vi-VN')}
  //     </div>const
  const data2 = [
    {
      key: "1",
      dsTong: totalDSTong * 0.95,
      tongCapADS: totalTongAdsXin,
      tienThuaTatCa: totalTienThua,
      percentADS: totalPercentAds,
    },
  ];
  const columns2 = [
    {
      title: "DS TỔNG",
      dataIndex: "dsTong",
      key: "dsTong",
      render: (value) => value.toLocaleString("vi-VN"),
    },
    {
      title: "TỔNG CẤP ADS",
      dataIndex: "tongCapADS",
      key: "tongCapADS",
      render: (value) => value.toLocaleString("vi-VN"),
    },
    {
      title: "TIỀN THỪA TẤT CẢ",
      dataIndex: "tienThuaTatCa",
      key: "tienThuaTatCa",
      render: (value) => value.toLocaleString("vi-VN"),
    },
    {
      title: "%ADS",
      dataIndex: "percentADS",
      key: "percentADS",
      render: (value) => {
        const numValue = typeof value === "number" ? value : parseFloat(value);
        let bgColor = "";
        if (numValue < 30) {
          bgColor = "#54DA1F"; // nền xanh lá (màu xanh nhạt)
        } else if (numValue >= 30 && numValue <= 35) {
          bgColor = "#FF9501"; // nền vàng nhạt
        } else {
          bgColor = "#F999A8"; // nền đỏ nhạt
        }
        return (
          <div
            style={{
              backgroundColor: bgColor,

              borderRadius: "4px",
              textAlign: "center",
              fontWeight: "bold",
            }}
          >
            {numValue.toFixed(2)}%
          </div>
        );
      },
    },
  ];

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
     if (currentUser?.name !== "Tung99") {
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
          .reduce((sum, p) => sum + p.profit, 0)
      : 0;
  };

  /*** Định nghĩa các cột cho bảng ***/
  const columns = [
    {
      title: "Ngày",
      dataIndex: "date",
      key: "date",
      render: (date) => moment(date, "YYYY-MM-DD").format("DD/MM/YYYY"),
    },
    {
      title: "Tổng tiền đã tiêu",
      key: "totalReceived",
      render: (_, record) => (
        <InputNumber
          style={{
            width: "100%",
            minWidth: "100px", // Đặt min-width cho input
          }}
          readOnly={
            // Nếu record đã được đánh dấu locked và currentUser không phải là managerMKT hoặc admin
            record.isLocked &&
            currentUser.position !== "managerMKT" &&
            currentUser.position !== "admin"
          }
          value={record.totalReceived}
          onChange={(value) =>
            handleInlineChange(record.id, "totalReceived", value)
          }
          formatter={(value) => value.toLocaleString("vi-VN")}
          parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
        />
      ),
    },
    {
      title: "Xin buổi sáng",
      key: "request1",
      render: (_, record) => (
        <InputNumber
          readOnly={
            // Nếu record đã được đánh dấu locked và currentUser không phải là managerMKT hoặc admin
            record.isLocked &&
            currentUser.position !== "managerMKT" &&
            currentUser.position !== "admin"
          }
          value={record.request1}
          onChange={(value) => handleInlineChange(record.id, "request1", value)}
          style={{
            width: "100%",
            minWidth: "100px", // Đặt min-width cho input
          }}
          formatter={(value) => value.toLocaleString("vi-VN")}
          parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
        />
      ),
    },
    {
      title: "Xin buổi chiều",
      key: "request2",
      render: (_, record) => (
        <InputNumber
          readOnly={
            // Nếu record đã được đánh dấu locked và currentUser không phải là managerMKT hoặc admin
            record.isLocked &&
            currentUser.position !== "managerMKT" &&
            currentUser.position !== "admin"
          }
          value={record.request2}
          onChange={(value) => handleInlineChange(record.id, "request2", value)}
          style={{
            width: "100%",
            minWidth: "100px", // Đặt min-width cho input
          }}
          formatter={(value) => value.toLocaleString("vi-VN")}
          parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
        />
      ),
    },
    {
      title: "Tiền dư",
      key: "excessMoney3",

      render: (_, record) => {
        const total = record.request1 + record.request2;
        return total - record.totalReceived
          ? (total - record.totalReceived).toLocaleString("vi-VN")
          : 0;
      },
    },
    // {
    //   title: "Tiền dư tháng trước",
    //   key: "tiendu",
    //   render: (_, record) => {
    //     const isFirstDayOfMonth = dayjs(record.date).date() === 1; // Kiểm tra ngày đầu tháng

    //     return isFirstDayOfMonth ? (
    //       <InputNumber
    //         readOnly={
    //           record.isLocked &&
    //           currentUser.position !== "managerMKT" &&
    //           currentUser.position !== "admin"
    //         }
    //         value={record.tiendu}
    //         onChange={(value) => handleInlineChange(record.id, "tiendu", value)}
    //         style={{ width: "100%" }}
    //         formatter={(value) => value.toLocaleString("vi-VN")}
    //         parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
    //       />
    //     ) : null; // Không hiển thị gì nếu không phải ngày đầu tháng
    //   },
    // },
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
      title: "%ADS",
      key: "percentAds",
      render: (_, record) => {
        const totalSalesForSelectedDate = computeTotalSalesForDate(
          record.date,
          record.name
        );
        const total = totalSalesForSelectedDate * 17000 * 0.95;
        if (totalSalesForSelectedDate === 0) return 0;
        const percent = Number(
          ((record.request1 + record.request2) / total) * 100
        );

        let bgColor = "";
        if (percent < 30) {
          bgColor = "#54DA1F"; // nền xanh lá (màu xanh nhạt)
        } else if (percent >= 30 && percent <= 35) {
          bgColor = "#FF9501"; // nền vàng nhạt
        } else {
          bgColor = "#F999A8"; // nền đỏ nhạt
        }
        return (
          <div
            style={{
              backgroundColor: bgColor,
              padding: "4px 8px",
              borderRadius: "4px",
              textAlign: "center",
              fontWeight: "bold",
            }}
          >
            {percent.toFixed(2)}%
          </div>
        );
      },
    },

    {
      title: "Hành động",
      key: "action",
      render: (_, record) => {
        const isFirstDayOfMonth = dayjs(record.date).date() === 1; // Kiểm tra ngày đầu tháng
        // Với lead và manager: chỉ cho phép sửa/xóa nếu record thuộc về chính họ, ngược lại chỉ xem
        if (currentUser.position === "lead") {
          // || currentUser.position === 'managerMKT'||currentUser.position === 'admin'
          if (record.userId === currentUser.employee_code) {
            return (
              <>
                <Button type="primary" onClick={() => onSave(record)}>
                  Save
                </Button>
                <Popconfirm
                  title="Xóa bản ghi?"
                  onConfirm={() => onDelete(record)}
                >
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    disabled={
                      // Nếu record đã được đánh dấu locked và currentUser không phải là managerMKT hoặc admin
                      record.isLocked &&
                      currentUser.position !== "managerMKT" &&
                      currentUser.position !== "admin"
                    }
                  />
                </Popconfirm>
              </>
            );
          } else {
            return <span>Chỉ xem</span>;
          }
        }
        // Với employee: hiển thị các thao tác sửa/xóa
        return (
          <>
            <Button
              type="primary"
              onClick={() => onSave(record)}
              disabled={
                // Nếu record đã được đánh dấu locked và currentUser không phải là managerMKT hoặc admin
                record.isLocked &&
                currentUser.position !== "managerMKT" &&
                currentUser.position !== "admin"
              }
            >
              Save
            </Button>
            <Popconfirm title="Xóa bản ghi?" onConfirm={() => onDelete(record)}>
              <Button
                danger
                icon={<DeleteOutlined />}
                disabled={
                  // Nếu record đã được đánh dấu locked và currentUser không phải là managerMKT hoặc admin
                  record.isLocked &&
                  currentUser.position !== "managerMKT" &&
                  currentUser.position !== "admin"
                }
              />
            </Popconfirm>
          </>
        );
      },
    },
  ];
  // Xác định màu nền dựa trên %ADS
  const getBgColor = (employeeName) => {
    const p = parseFloat(computePercentADS(employeeName));
    if (isNaN(p)) return "transparent";
    if (p < 30) return "#54DA1F"; // màu xanh (blue)
    if (p >= 30 && p <= 35) return "#FF9501"; // màu cam (orange)
    if (p > 35) return "#F999A8"; // màu cam (orange)
  };

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
      render: (date) => moment(date, "YYYY-MM-DD").format("DD/MM/YYYY"),
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

  return (
    <div style={{ padding: 24 }}>
      {/* Tiêu đề "Nhập thông tin" */}
      <Row gutter={[16, 16]}>
        <FullScreenLoading loading={loading} tip="Đang tải dữ liệu..." />
      </Row>
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
                  <Button
                    disabled={
                      currentUser.position_team === "sale" ||
                      currentUser.position_team === "kho" ||
                      isDisabled
                    }
                    type="primary"
                    htmlType="submit"
                    style={{ width: "100%" }}
                  >
                    {editingRecord ? "Cập nhật" : "Thêm mới Báo cáo"}
                  </Button>
                </Form.Item>
              </Col>

              <Col xs={24} sm={10} md={6} lg={8}></Col>
              {(currentUser.position === "managerMKT" ||
                currentUser.position === "admin") && (
                <Col xs={24} sm={12} md={3} lg={6}>
                  <Table
                    style={{ width: "33.33%" }}
                    dataSource={data2}
                    columns={columns2}
                    pagination={false}
                    bordered
                  />
                </Col>
              )}
            </Row>
          </Form>
        </Col>
      </Row>

      {/* Tiêu đề "Danh sách giao dịch" */}

      {/* Bộ lọc */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={5}>
          <div style={{ marginBottom: 16 }}>
            <span style={{ marginRight: 8 }}>Chọn thời gian </span>
            <br />
            <Select
              value={period}
              onChange={async (value) => {
  setPeriod(value);
  const dates = getDateRange(value); // truyền period mới vào
  const start = dates[0];
  const end = dates[dates.length - 1];
  await Promise.all([
    fetchRecords(start, end),
    fetchOrders(start, end),
  ]);
}}
              style={{ width: 250 }}
            >
              <Option value="day">Hôm Nay</Option>
              <Option value="yesterday">Hôm Qua</Option>
              <Option value="week">1 Tuần Gần Nhất</Option>
              <Option value="month">Tháng Này</Option>
              <Option value="lastMonth">Tháng Trước</Option>
              <Option value="twoMonthsAgo">2 Tháng Trước</Option>
            </Select>
          </div>
        </Col>
        {(currentUser.position === "managerMKT" ||
          currentUser.position === "admin") && (
          <Col xs={24} sm={12} md={5}>
            <div>
              <span style={{ marginRight: 8 }}>Chọn team: </span>
              <Select
                value={selectedTeam}
                style={{ width: "100%" }}
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
      {(currentUser.position === "managerMKT" ||
        currentUser.position === "admin") && (
        <>
          <Table
            style={{ marginTop: 32, minWidth: "1200px" }}
            dataSource={teamSummaryData}
            columns={teamSummaryColumns}
            pagination={{ pageSize: 10 }}
            bordered
            scroll={{ x: true }}
          />

          <Table
            style={{
              minWidth: "800px", // Đặt min-width theo tổng độ rộng các cột
              whiteSpace: "nowrap",
            }}
            dataSource={adminSummaryData.sort((a, b) => {
              return dayjs(b.date).valueOf() - dayjs(a.date).valueOf();
            })}
            columns={adminSummaryColumns}
            rowKey="date"
            pagination={{ pageSize: 10 }}
            // scroll={{ x: true }}
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
                    minWidth: "800px", // Đặt min-width theo tổng độ rộng các cột
                    whiteSpace: "nowrap",

                    fontWeight: "bold",
                    marginBottom: 8,
                    padding: "4px 8px",
                    borderRadius: "4px",
                    backgroundColor: getBgColor(userRecords[0].name),
                    color: "#111111",
                  }}
                >
                  Tổng doanh số:{" "}
                  {computeTotalSales(userRecords[0].name).toLocaleString(
                    "vi-VN"
                  )}{" "}
                  | Chi phí Ads:{" "}
                  {computeTotalADS(userRecords[0].name).toLocaleString("vi-VN")}{" "}
                  | %ADS: {computePercentADS(userRecords[0].name)}% | Số dư:{" "}
                  {computeTotalExcess(userRecords[0].name).toLocaleString(
                    "vi-VN"
                  )}
                </div>
              </Col>
              <Col xs={24}>
                <Table
                  style={{
                    minWidth: "800px", // Đặt min-width theo tổng độ rộng các cột
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
              padding: "4px 8px",
              borderRadius: "4px",
              backgroundColor: getBgColor(currentUser.name),
              color: "#111111",
            }}
          >
            Tổng doanh số:{" "}
            {computeTotalSales(currentUser.name).toLocaleString("vi-VN")} | Chi
            phí Ads: {computeTotalADS(currentUser.name).toLocaleString("vi-VN")}{" "}
            | %ADS: {computePercentADS(currentUser.name)}% | Số dư:{" "}
            {computeTotalExcess(currentUser.name).toLocaleString("vi-VN")}
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
                  WebkitOverflowScrolling: "touch", // Cho scroll mượt trên mobile
                }}
              >
                <Table
                  columns={columns}
                  dataSource={filteredRecords.sort((a, b) => {
                    return dayjs(b.date).valueOf() - dayjs(a.date).valueOf();
                  })}
                  pagination={{ pageSize: 30 }}
                  // scroll={{ x: true }}
                  rowKey="id"
                  style={{
                    minWidth: "800px", // Đặt min-width theo tổng độ rộng các cột
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
