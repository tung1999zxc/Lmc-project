"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import { CopyOutlined, SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, AppstoreOutlined, FileTextOutlined, TeamOutlined, CalendarOutlined, CheckCircleOutlined, DownOutlined, UndoOutlined, UpOutlined, CloseOutlined, NumberOutlined, UserOutlined, SettingOutlined } from "@ant-design/icons";
import {
  Table,
  Input,
  Select,
  Button,
  Space,
  Popconfirm,
  message,
  Modal,
  Tooltip,
} from "antd";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { DatePicker } from "antd";
import dayjs from "dayjs";
const { Option } = Select;
import { useRouter } from "next/navigation";

// ===== useCountUp — animate a number from 0 → target =====
function useCountUp(target, duration = 600) {
  const [value, setValue] = useState(0);
  const prevTargetRef = useRef(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const start = performance.now();
    const from = prevTargetRef.current;
    const to = Number(target) || 0;
    const delta = to - from;

    const tick = (now) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      // easeOutCubic — nhanh ở đầu, mượt ở cuối
      const eased = 1 - Math.pow(1 - t, 3);
      const current = Math.round(from + delta * eased);
      setValue(current);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        prevTargetRef.current = to;
      }
    };

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return value;
}

const EmployeePageTable = () => {
  const router = useRouter();
  const currentUser = useSelector((state) => state.user.currentUser);
  useEffect(() => {
    // Chỉ redirect khi chưa đăng nhập. Không đẩy user khỏi /pagesName
    // dựa trên position — nếu menu đã cho phép click thì phải cho vào.
    if (!currentUser || !currentUser.name) {
      router.push("/login");
    }
  }, [currentUser, router]);
  const [messageApi, contextHolder] = message.useMessage();
  const [pageName, setPageName] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState(currentUser?.name || null);
  const [data, setData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [editingRecord, setEditingRecord] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [activePreset, setActivePreset] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showCustomDate, setShowCustomDate] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [appliedSearchText, setAppliedSearchText] = useState("");
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [pageListInput, setPageListInput] = useState("");
  const [filteredPages, setFilteredPages] = useState([]);
  const [checkPageName, setCheckPageName] = useState("");
  const [addFormOpen, setAddFormOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editPageName, setEditPageName] = useState("");
  const [editEmployee, setEditEmployee] = useState(null);
  const [showCheckForm, setShowCheckForm] = useState(false);
const [viaData, setViaData] = useState([]);
const [editingViaId, setEditingViaId] = useState(null);
const [tempViaLink, setTempViaLink] = useState("");

const applyDatePreset = (preset) => {
  // Toggle off nếu click lại đúng preset đang chọn
  if (activePreset === preset) {
    setActivePreset(null);
    setStartDate(null);
    setEndDate(null);
    return;
  }

  setActivePreset(preset);
  const today = dayjs().endOf("day");
  switch (preset) {
    case "today":
      setStartDate(today.startOf("day"));
      setEndDate(today);
      break;
    case "yesterday": {
      const y = dayjs().subtract(1, "day");
      setStartDate(y.startOf("day"));
      setEndDate(y.endOf("day"));
      break;
    }
    case "7days":
      setStartDate(today.subtract(6, "day").startOf("day"));
      setEndDate(today);
      break;
    case "lastMonth": {
      const lastMonthStart = dayjs().subtract(1, "month").startOf("month");
      const lastMonthEnd = dayjs().subtract(1, "month").endOf("month");
      setStartDate(lastMonthStart);
      setEndDate(lastMonthEnd);
      break;
    }
    default:
      break;
  }
};
  // Danh sách options
  useEffect(() => {
    fetchNamePage();
    fetchEmployees();
    fetchViaLinks();
  }, []);

  const fetchViaLinks = async () => {
  try {
    const res = await axios.get("/api/viaLinks");
    let list = res.data.data;
    // Đảm bảo luôn có ít nhất 8 hàng (hàng trống nếu chưa đủ)
    const filler = Array.from({ length: Math.max(0, 8 - list.length) }).map((_, i) => ({
      _id: `empty-${i}`,
      link: "",
      isEmpty: true
    }));
    setViaData([...list, ...filler]);
  } catch (err) {
    message.error("Không thể tải danh sách Via");
  }
};

const saveVia = async (record) => {
  if (!tempViaLink) return message.warning("Vui lòng nhập link");
  try {
    if (record.isEmpty) {
      await axios.post("/api/viaLinks", { link: tempViaLink });
    } else {
      await axios.put("/api/viaLinks", { id: record._id, link: tempViaLink });
    }
    message.success("Thành công");
    setEditingViaId(null);
    fetchViaLinks();
  } catch (err) {
    message.error("Có lỗi xảy ra");
  }
};

const deleteVia = async (id) => {
  try {
    await axios.delete(`/api/viaLinks?id=${id}`);
    message.success("Đã xóa");
    fetchViaLinks();
  } catch (err) {
    message.error("Lỗi khi xóa");
  }
};

  const fetchEmployees = async () => {
    try {
      const response = await axios.get("/api/employees");
      // response.data.data chứa danh sách nhân viên theo API đã viết
      setEmployees(response.data.data);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách nhân viên:", error);
      message.error("Lỗi khi lấy danh sách nhân viên");
    } finally {
    }
  };

  // Gọi API khi component được mount
  const teamsList = [
    {
      id: 1,
      name: `TEAM SƠN `,
      members: employees
        .filter((employee) => employee.team_id === "SON")
        .map((employee) => employee.employee_code),
    },
    {
      id: 2,
      name: `TEAM QUÂN `,
      members: employees
        .filter((employee) => employee.team_id === "QUAN")
        .map((employee) => employee.employee_code),
    },
    // {
    //   id: 3,
    //   name: `TEAM CHI `,
    //   members: employees
    //     .filter(employee => employee.team_id === 'CHI')
    //     .map(employee => employee.employee_code)
    // },
    {
      id: 4,
      name: `TEAM LẺ `,
      members: employees
        .filter((employee) => employee.team_id === "LE")
        .map((employee) => employee.employee_code),
    },
    {
      id: 5,
      name: `TEAM TUẤN ANH `,
      members: employees
        .filter((employee) => employee.team_id === "TUANANH")
        .map((employee) => employee.employee_code),
    },
    {
      id: 6,
      name: `TEAM DIỆN `,
      members: employees
        .filter((employee) => employee.team_id === "DIEN")
        .map((employee) => employee.employee_code),
    },

    {
      id: 8,
      name: `TEAM DIỆU`,
      members: employees
        .filter((employee) => employee.team_id === "DIEU")
        .map((employee) => employee.employee_code),
    },
    {
      id: 9,
      name: `TEAM PHI`,
      members: employees
        .filter((employee) => employee.team_id === "PHI")
        .map((employee) => employee.employee_code),
    },
  ];

  const fetchNamePage = async () => {
    try {
      const response = await axios.get("/api/pageName");
      setData(response.data.data); // Danh sách đơn hàng
    } catch (error) {
      console.error("Lỗi khi lấy đơn hàng:", error);
    }
  };
  // Lưu đơn hàng vào localStorage mỗi khi orders thay đổi (chỉ chạy trên client)

  const leadTeamMembers = useMemo(() => {
    return employees
      .filter((employee) => employee.team_id === currentUser.team_id)
      .map((employee) => employee.name);
  }, [employees, currentUser.team_id]);

  const filteredData = useMemo(() => {
    let tempData = [];

    if (
      currentUser.position === "admin" ||
      currentUser.position === "managerMKT" ||
      currentUser.position_team === "sale"
    ) {
      tempData = data;
    } else if (currentUser.position === "lead") {
      tempData = data.filter((record) =>
        leadTeamMembers.includes(record.employee)
      );
    } else {
      tempData = data.filter((record) => record.employee === currentUser.name);
    }

    if (appliedSearchText) {
      tempData = tempData.filter(
        (record) =>
          record.pageName
            .toLowerCase()
            .includes(appliedSearchText.toLowerCase()) ||
          record.employee
            .toLowerCase()
            .includes(appliedSearchText.toLowerCase())
      );
    }

    if (startDate && endDate) {
      tempData = tempData.filter((record) => {
        const recordDate = dayjs(record.createdAt);
        return (
          recordDate.isAfter(startDate.startOf("day")) &&
          recordDate.isBefore(endDate.endOf("day"))
        );
      });
    }

    if (selectedTeam) {
      // lọc theo team_id
      const teamMembers = employees
        .filter((emp) => emp.team_id === selectedTeam)
        .map((emp) => emp.name);
      tempData = tempData.filter((record) =>
        teamMembers.includes(record.employee)
      );
    }

    return tempData;
  }, [
    data,
    currentUser,
    leadTeamMembers,
    appliedSearchText,
    startDate,
    endDate,
    selectedTeam,
    employees,
  ]);

  const mktOptions = employees
    .filter((order) => order.position_team === "mkt")
    .map((order) => order.name);

  const handleAdd = async () => {
    if (!pageName || !selectedEmployee) {
      message.error("Vui lòng nhập đầy đủ thông tin");
      return;
    }
    try {
      const response = await axios.post("/api/pageName", {
        pageName,
        employee: selectedEmployee,
        employee_code: currentUser.employee_code,
      });
      message.success(response.data.message);
      // Làm mới danh sách đơn hàng sau khi thêm
      fetchNamePage();
      // Reset form
      setPageName("");
      setSelectedEmployee(null);
    } catch (error) {
      console.error(error.response?.data?.error || error.message);
      message.error(error.response?.data?.error || "Lỗi khi thêm đơn hàng");
    }
  };
  const handleDelete = async (key) => {
    try {
      const response = await axios.delete(`/api/pageName/${key}`);
      message.success(response.data.message);
      // Làm mới danh sách đơn hàng sau khi xóa
      fetchNamePage();
    } catch (error) {
      console.error(error.response?.data?.error || error.message);
      message.error(error.response?.data?.error || "Lỗi khi xóa đơn hàng");
    }
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setEditPageName(record.pageName);
    setEditEmployee(record.employee);
    setEditModalOpen(true);
  };

  const handleCloseEdit = () => {
    setEditModalOpen(false);
    setEditingRecord(null);
    setEditPageName("");
    setEditEmployee(null);
  };

  const handleSaveEdit = async () => {
    if (!editingRecord) return;
    try {
      const updateData = {
        pageName: editPageName,
        employee: editEmployee,
      };
      await axios.put(
        `/api/pageName/${editingRecord.key}`,
        updateData
      );
      message.success("Đã cập nhật tên page !");
      fetchNamePage();
      handleCloseEdit();
    } catch (error) {
      console.error(error.response?.data?.error || error.message);
      message.error(error.response?.data?.error || "Lỗi khi cập nhật tên page");
    }
  };

  const handleCopy = (text) => {
  navigator.clipboard.writeText(text);
  messageApi.success(`  Đã copy: ${text}`);
};
const viaColumns = [
  {
    title: "STT",
    render: (_, __, index) => index + 1,
    width: 80,
  },
  {
    title: "Link Via",
    dataIndex: "link",
    render: (text, record) => {
      if (editingViaId === record._id) {
        return <Input value={tempViaLink} onChange={(e) => setTempViaLink(e.target.value)} style={{ borderRadius: 8 }} />;
      }
      return (
        <div className="pages-name-cell">
          <span className="pages-name-text" style={{ flex: 1, wordBreak: "break-all" }}>{text || "—"}</span>
          <button
            className="pages-copy-btn"
            onClick={() => handleCopy(text)}
            style={{ flexShrink: 0 }}
          >
            <CopyOutlined style={{ fontSize: 14 }} />
            Copy
          </button>
        </div>
      );
    },
  },
  {
    title: "Hành động",
    width: 160,
    render: (_, record) => (
      <Space>
        {editingViaId === record._id ? (
          <button className="btn-prod-success pages-action-btn" onClick={() => saveVia(record)}>
            Lưu
          </button>
        ) : (
          <button className="btn-prod-info pages-action-btn" onClick={() => { setEditingViaId(record._id); setTempViaLink(record.link); }}>
            Sửa
          </button>
        )}
        {!record.isEmpty && (
          <Popconfirm title="Xóa link này?" onConfirm={() => deleteVia(record._id)}>
            <button className="btn-prod-danger pages-action-btn">Xóa</button>
          </Popconfirm>
        )}
      </Space>
    ),
  },
];
  const columns = [
      {
        title: (
          <span className="pages-table-th">
            <NumberOutlined className="pages-table-th-icon" />
            <span>STT</span>
          </span>
        ),
        key: "stt",
        width: 70,
        align: "center",
        render: (_v, _record, index) => (
          <span className="pages-stt-cell">
            {index + 1}
          </span>
        ),
      },
      {
        title: (
          <span className="pages-table-th">
            <FileTextOutlined className="pages-table-th-icon" />
            <span>Tên Page</span>
          </span>
        ),
        dataIndex: "pageName",
        key: "pageName",
        width: 450,
        render: (text) => (
          <div className="pages-name-cell">
            <span className="pages-name-text" style={{ flex: 1 }}>{text}</span>
            <button
              className="pages-copy-btn"
              onClick={() => handleCopy(text)}
            >
              <CopyOutlined style={{ fontSize: 14 }} />
              Copy
            </button>
          </div>
        ),
      },
      {
        title: (
          <span className="pages-table-th">
            <UserOutlined className="pages-table-th-icon" />
            <span>Nhân Viên</span>
          </span>
        ),
        dataIndex: "employee",
        key: "employee",
        render: (text) => (
          <span className="pages-employee-badge">
            <TeamOutlined style={{ fontSize: 12 }} />
            {text}
          </span>
        )
      },
      {
        title: (
          <span className="pages-table-th">
            <CalendarOutlined className="pages-table-th-icon" />
            <span>Ngày tạo</span>
          </span>
        ),
        dataIndex: "createdAt",
        key: "createdAt",
        render: (value) => {
          const date = new Date(value);
          return (
            <span className="pages-date-badge">
              <CalendarOutlined style={{ fontSize: 12 }} />
              {date.toLocaleDateString("vi-VN")}
            </span>
          );
        },
      },
      {
        title: (
          <span className="pages-table-th">
            <SettingOutlined className="pages-table-th-icon" />
            <span>Thao Tác</span>
          </span>
        ),
        key: "action",
        width: 110,
        align: "center",
        render: (_, record) => {
          if (
            currentUser.position === "admin" ||
            currentUser.position === "managerSALE" ||
            currentUser.position === "managerMKT"
          ) {
            return (
              <div className="pages-action-group">
                <button
                  type="button"
                  className="pages-icon-btn pages-icon-btn-edit"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(record);
                  }}
                  title="Sửa bản ghi"
                  aria-label="Sửa"
                >
                  <EditOutlined />
                </button>
                <Popconfirm
                  title="Xóa bản ghi?"
                  okText="Xóa"
                  cancelText="Hủy"
                  okButtonProps={{ danger: true }}
                  onConfirm={() => handleDelete(record.key)}
                >
                  <button
                    type="button"
                    className="pages-icon-btn pages-icon-btn-delete"
                    title="Xóa bản ghi"
                    aria-label="Xóa"
                  >
                    <DeleteOutlined />
                  </button>
                </Popconfirm>
              </div>
            );
          } else {
            if (record.employee === currentUser.name) {
              return (
                <div className="pages-action-group">
                  <button
                    type="button"
                    className="pages-icon-btn pages-icon-btn-edit"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(record);
                    }}
                    title="Sửa bản ghi"
                    aria-label="Sửa"
                  >
                    <EditOutlined />
                  </button>
                  <Popconfirm
                    title="Xóa bản ghi?"
                    okText="Xóa"
                    cancelText="Hủy"
                    okButtonProps={{ danger: true }}
                    onConfirm={() => handleDelete(record.key)}
                  >
                    <button
                      type="button"
                      className="pages-icon-btn pages-icon-btn-delete"
                      title="Xóa bản ghi"
                      aria-label="Xóa"
                    >
                      <DeleteOutlined />
                    </button>
                  </Popconfirm>
                </div>
              );
            } else {
              return <span style={{ color: "#94a3b8", fontSize: 12 }}>Chỉ xem</span>;
            }
          }
        },
      },
    ];

  const normalizeText = (text) =>
    text.toLowerCase().trim().replace(/\s+/g, " ");

  // Calculate stats
  const totalPages = filteredData.length;
  const uniqueEmployees = [...new Set(filteredData.map(p => p.employee))].length;
  const activePages = filteredData.filter((p) => {
    if (p && typeof p === "object") {
      if (p.archived || p.deleted || p.status === "inactive") return false;
      if (typeof p.active === "boolean") return p.active;
    }
    return true;
  }).length;
  const totalPagesAnim = useCountUp(totalPages, 600);
  const uniqueEmployeesAnim = useCountUp(uniqueEmployees, 600);
  const activePagesAnim = useCountUp(activePages, 600);

  // ===== CHECK PAGE EFFECT =====
  const showCheckEffect = (isDup) => {
    if (typeof document === "undefined") return;
    document.querySelectorAll(".check-overlay").forEach((e) => e.remove());
    const overlay = document.createElement("div");
    overlay.className = "check-overlay";
    overlay.style.background = isDup ? "rgba(255,40,40,0.12)" : "rgba(34,197,94,0.1)";
    const txt = document.createElement("div");
    txt.className = "check-text " + (isDup ? "ne" : "vut");
    txt.textContent = isDup ? "🚫 NÉ RA" : "✅ VỤT ĐI";
    overlay.appendChild(txt);
    const colors = isDup
      ? ["#ff4444", "#ff6b6b", "#fca5a5", "#ef4444"]
      : ["#22c55e", "#4ade80", "#86efac", "#16a34a"];
    for (let i = 0; i < 18; i++) {
      const p = document.createElement("div");
      p.className = "check-particle";
      p.style.width = p.style.height = 6 + Math.random() * 10 + "px";
      p.style.background = colors[Math.floor(Math.random() * colors.length)];
      p.style.left = 50 + Math.random() * 20 - 10 + "%";
      p.style.top = 50 + Math.random() * 20 - 10 + "%";
      p.style.setProperty("--dx", Math.random() * 400 - 200 + "px");
      p.style.setProperty("--dy", Math.random() * 400 - 200 + "px");
      p.style.animationDelay = Math.random() * 0.3 + "s";
      overlay.appendChild(p);
    }
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add("show"));
    setTimeout(() => {
      overlay.classList.remove("show");
      setTimeout(() => overlay.remove(), 400);
    }, 1400);
  };

  const handleCheckDup = () => {
    const v = (checkPageName || "").trim();
    if (!v) {
      message.warning("Vui lòng nhập tên page để check");
      return;
    }
    const vLow = v.toLowerCase();
    const matched = (data || []).find(
      (d) => (d.pageName || "").trim().toLowerCase() === vLow
    );
    const isDup = Boolean(matched);
    showCheckEffect(isDup);
    if (isDup) {
      messageApi.info("Page này đã có trong hệ thống");
    } else {
      messageApi.success("Tên page này có thể dùng");
    }
  };

  return (
    <div className="pages-name-container">
       {contextHolder}

      {/* Page Header */}
      <div className="pages-header">
        <h1>
          <span className="icon">📋</span>
          Quản Lý Tên Page
        </h1>
        <button
          type="button"
          className={`pages-add-btn-header ${addFormOpen ? "is-active" : ""}`}
          onClick={() => {
            if (addFormOpen) {
              setAddFormOpen(false);
            } else {
              setAddFormOpen(true);
              setShowCheckForm(false);
            }
          }}
          title={addFormOpen ? "Đóng form" : "Mở form thêm page mới"}
          aria-expanded={addFormOpen}
        >
          <PlusOutlined />
          Thêm Page Mới
        </button>
        <button
          type="button"
          className={`pages-check-btn-header ${showCheckForm ? "is-active" : ""}`}
          onClick={() => {
            if (showCheckForm) {
              setShowCheckForm(false);
              setCheckPageName("");
            } else {
              setAddFormOpen(false);
              setShowCheckForm(true);
            }
          }}
          title={showCheckForm ? "Đóng check page" : "Mở check page trùng"}
          aria-expanded={showCheckForm}
        >
          <SearchOutlined />
          Check Page Trùng
        </button>
        <div style={{ display: "flex", gap: 12 }}>
          <div className="pages-stat-card" style={{ minWidth: 140 }}>
            <div className="pages-stat-icon gold">
              <FileTextOutlined />
            </div>
            <div>
              <div className="pages-stat-label">Tổng Page</div>
              <div className="pages-stat-value">{totalPagesAnim.toLocaleString("vi-VN")}</div>
            </div>
          </div>
          <div className="pages-stat-card" style={{ minWidth: 140 }}>
            <div className="pages-stat-icon blue">
              <TeamOutlined />
            </div>
            <div>
              <div className="pages-stat-label">Nhân viên</div>
              <div className="pages-stat-value">{uniqueEmployeesAnim.toLocaleString("vi-VN")}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Page Form — accordion, ẩn khi đóng (đã có nút trên header) */}
      {addFormOpen && (
      <div className="pages-add-form pages-add-collapse">
            <div className="pages-add-header">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <DownOutlined style={{ color: "var(--gold)", fontSize: 14 }} />
                <span style={{ fontWeight: 700, fontSize: 15 }}>
                  Thêm Page Mới
                </span>
              </div>
              <button
                type="button"
                className="pages-add-btn-close"
                onClick={() => {
                  setAddFormOpen(false);
                  setPageName("");
                  setSelectedEmployee(currentUser?.name || null);
                }}
                title="Đóng form"
                aria-label="Đóng form"
              >
                <CloseOutlined />
              </button>
            </div>

            <div className="pages-add-body">
              <div className="form-row">
                <Input
                  style={{ flex: 1, minWidth: 200, borderRadius: 12 }}
                  placeholder="Nhập tên page"
                  value={pageName}
                  onChange={(e) => setPageName(e.target.value)}
                  prefix={<AppstoreOutlined style={{ color: "#9ca3af" }} />}
                />
                <Select
                  showSearch
                  placeholder={`👤 ${currentUser?.name || "Chọn nhân viên"}`}
                  value={selectedEmployee}
                  onChange={setSelectedEmployee}
                  style={{ minWidth: 200 }}
                  optionFilterProp="children"
                >
                  {mktOptions.map((emp) => (
                    <Option key={emp} value={emp}>
                      {emp}
                    </Option>
                  ))}
                </Select>
                <button
                  onClick={handleAdd}
                  className="pages-add-btn"
                >
                  <PlusOutlined /> Thêm Page
                </button>
              </div>
            </div>
      </div>
      )}

      {/* Check Page Trùng - accordion, ẩn khi đóng (đã có nút trên header) */}
      {showCheckForm && (
      <div className="pages-add-form pages-check-row">
            <div className="pages-add-header">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <SearchOutlined style={{ color: "var(--blue)", fontSize: 16 }} />
                <span style={{ fontWeight: 700, fontSize: 15 }}>Check Page Trùng</span>
              </div>
              <button
                type="button"
                className="pages-add-btn-close"
                onClick={() => {
                  setShowCheckForm(false);
                  setCheckPageName("");
                }}
                title="Đóng check page"
                aria-label="Đóng"
              >
                <CloseOutlined />
              </button>
            </div>

            <div className="pages-add-body">
              <div className="form-row">
                <div style={{ flex: 1, minWidth: 280 }}>
                  <Input
                    className="pages-check-input"
                    style={{ borderRadius: 12 }}
                    placeholder="Nhập tên page muốn kiểm tra..."
                    value={checkPageName}
                    onChange={(e) => setCheckPageName(e.target.value)}
                    onPressEnter={handleCheckDup}
                    prefix={<SearchOutlined style={{ color: "#9ca3af" }} />}
                  />
                  <div className="pages-check-tip-inline">
                    🔍 Hệ thống sẽ so sánh chính xác tên bạn nhập với các page đã có.
                  </div>
                </div>
                <button
                  onClick={handleCheckDup}
                  className="pages-check-btn"
                  title="Kiểm tra page đã tồn tại"
                >
                  <SearchOutlined /> Check
                </button>
                <button
                  onClick={() => setCheckPageName("")}
                  className="btn-prod-ghost"
                  style={{ padding: "10px 18px", borderRadius: 12 }}
                >
                  Xóa
                </button>
              </div>
            </div>
      </div>
      )}

      {/* Filter Bar */}
      <div className="pages-filter-bar">
        <div className="pages-search-wrapper">
          <Input
            className="pages-search-input"
            placeholder="Tìm kiếm tên page / nhân viên..."
            value={searchText}
            allowClear
            onClear={() => {
              setSearchText("");
              setAppliedSearchText("");
            }}
            onChange={(e) => setSearchText(e.target.value)}
            onPressEnter={() => setAppliedSearchText(searchText)}
            suffix={<SearchOutlined style={{ color: "#92400e" }} />}
          />
          <button
            className="pages-search-btn"
            onClick={() => setAppliedSearchText(searchText)}
          >
            <SearchOutlined /> Tìm
          </button>
        </div>
        <div className="pages-date-presets">
          <button
            type="button"
            className={`pages-date-preset ${activePreset === "today" ? "is-active" : ""}`}
            onClick={() => applyDatePreset("today")}
          >
            <span className="pages-date-preset-label">Hôm nay</span>
          </button>
          <button
            type="button"
            className={`pages-date-preset ${activePreset === "yesterday" ? "is-active" : ""}`}
            onClick={() => applyDatePreset("yesterday")}
          >
            <span className="pages-date-preset-label">Hôm qua</span>
          </button>
          <button
            type="button"
            className={`pages-date-preset ${activePreset === "7days" ? "is-active" : ""}`}
            onClick={() => applyDatePreset("7days")}
          >
            <span className="pages-date-preset-label">7 ngày trước</span>
          </button>
          <button
            type="button"
            className={`pages-date-preset ${activePreset === "lastMonth" ? "is-active" : ""}`}
            onClick={() => applyDatePreset("lastMonth")}
          >
            <span className="pages-date-preset-label">Tháng trước</span>
          </button>

          <button
            type="button"
            className="pages-date-toggle"
            onClick={() => setShowCustomDate((v) => !v)}
            aria-expanded={showCustomDate}
            title={showCustomDate ? "Thu gọn bộ lọc" : "Chọn khoảng ngày tùy ý"}
          >
            {showCustomDate ? <UpOutlined /> : <CalendarOutlined />}
            {showCustomDate ? "Thu gọn" : "Chọn chi tiết"}
          </button>
        </div>

        {showCustomDate && (
          <div className="pages-date-range">
            <span className="pages-date-label">Từ ngày</span>
            <DatePicker
              className="pages-date-input"
              value={startDate}
              format="DD/MM/YYYY"
              placeholder="Chọn ngày"
              allowClear
              disabledDate={(current) => {
                if (!current) return false;
                if (current.isAfter(dayjs().endOf("day"))) return true;
                if (endDate && current.isAfter(endDate.endOf("day"))) return true;
                return false;
              }}
              onChange={(d) => { setStartDate(d); setActivePreset(null); }}
            />
            <span className="pages-date-sep">→</span>
            <span className="pages-date-label">Đến ngày</span>
            <DatePicker
              className="pages-date-input"
              value={endDate}
              format="DD/MM/YYYY"
              placeholder="Chọn ngày"
              allowClear
              disabledDate={(current) => {
                if (!current) return false;
                if (current.isAfter(dayjs().endOf("day"))) return true;
                if (startDate && current.isBefore(startDate.startOf("day"))) return true;
                return false;
              }}
              onChange={(d) => { setEndDate(d); setActivePreset(null); }}
            />
            {(startDate || endDate) && (
              <button
                type="button"
                className="pages-date-reset"
                onClick={() => { setStartDate(null); setEndDate(null); setActivePreset(null); }}
                title="Đặt lại bộ lọc ngày"
              >
                <UndoOutlined /> Chọn lại
              </button>
            )}
          </div>
        )}

        <Select
          style={{ minWidth: 180 }}
          placeholder="Chọn team"
          value={selectedTeam}
          allowClear
          onClear={() => setSelectedTeam(null)}
          onChange={(value) => setSelectedTeam(value)}
        >
          <Option value="SON">TEAM SƠN</Option>
          <Option value="QUAN">TEAM QUÂN</Option>
          <Option value="LE">TEAM LE</Option>
          <Option value="TUANANH">TEAM TUẤN ANH</Option>
          <Option value="DIEN">TEAM DIỆN</Option>
          <Option value="HIEU">TEAM HIẾU</Option>
          <Option value="DIEU">TEAM DIỆU</Option>
        </Select>
      </div>

      {/* Bulk Actions Section (Tung99 only) */}
      {currentUser.name === "Tung99" && (
        <div className="pages-bulk-section">
          <TeamOutlined style={{ fontSize: 20, color: "#d97706" }} />
          <Select
            mode="tags"
            placeholder="Nhập tên hoặc chọn nhân viên MKT"
            value={selectedEmployee ? [selectedEmployee] : []}
            onChange={(values) => setSelectedEmployee(values[0])}
            style={{ minWidth: 280 }}
            tokenSeparators={[","]}
          >
            {mktOptions.map((emp) => (
              <Option key={emp} value={emp}>
                {emp}
              </Option>
            ))}
          </Select>

          <Popconfirm
            title="Bạn có chắc muốn XOÁ TẤT CẢ page của nhân viên này?"
            okText="Xoá hết"
            cancelText="Hủy"
            onConfirm={async () => {
              try {
                const response = await axios.delete(`/api/pageName/deleteByEmployee?employee=${selectedEmployee}`);
                message.success(response.data.message);
                fetchNamePage();
              } catch (error) {
                console.error(error);
                message.error("Lỗi khi xoá toàn bộ page");
              }
            }}
          >
            <button className="btn-prod-danger" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <DeleteOutlined /> Xoá toàn bộ page
            </button>
          </Popconfirm>

          <Popconfirm
            title="Bạn có chắc muốn chuyển toàn bộ page sang Trần Ngọc Diện?"
            okText="Chuyển"
            cancelText="Hủy"
            onConfirm={async () => {
              try {
                const response = await axios.put("/api/pageName/transferPages");
                message.success(response.data.message);
                fetchNamePage();
              } catch (error) {
                console.error(error);
                message.error("Lỗi khi chuyển page");
              }
            }}
          >
            <button className="btn-prod-primary" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              Chuyển page sang Diện
            </button>
          </Popconfirm>
        </div>
      )}

      {/* Search by list for Trần Mỹ Hạnh */}
      {currentUser.name === "Trần Mỹ Hạnh" && (
        <div className="pages-add-form">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <SearchOutlined style={{ color: "var(--gold)", fontSize: 18 }} />
            <span style={{ fontWeight: 700, fontSize: 15 }}>Tìm kiếm danh sách page</span>
          </div>
          <Space style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 12 }}>
            <Input.TextArea
              rows={3}
              placeholder="Dán danh sách tên page, mỗi dòng 1 tên"
              style={{ width: 500, borderRadius: 12 }}
              value={pageListInput}
              onChange={(e) => setPageListInput(e.target.value)}
            />
            <button
              className="btn-prod-primary"
              onClick={() => {
                const searchPages = pageListInput
                  .split(/\r?\n/)
                  .map((name) => normalizeText(name))
                  .filter((name) => name);

                const matchedPages = data.filter((record) =>
                  searchPages.includes(normalizeText(record.pageName))
                );

                setFilteredPages(matchedPages);

                const notFound = searchPages.filter(
                  (p) => !data.find((d) => normalizeText(d.pageName) === p)
                );
                if (notFound.length > 0) {
                  console.log("Không tìm thấy các page sau:", notFound);
                }
              }}
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <SearchOutlined /> Tìm kiếm danh sách page
            </button>
          </Space>
        </div>
      )}

      {/* Filtered Results Table */}
      {filteredPages.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div className="pages-list-title">
            <span className="icon">📋</span>
            Kết quả tìm kiếm ({filteredPages.length} page)
          </div>
          <div className="pages-table-container">
            <Table
              dataSource={filteredPages.map((item, index) => ({
                key: index,
                pageName: item.pageName,
                employee: item.employee,
              }))}
              columns={[
                { 
                  title: "Tên Page", 
                  dataIndex: "pageName", 
                  key: "pageName",
                  render: (text) => (
                    <span className="pages-name-text">{text}</span>
                  )
                },
                { 
                  title: "Nhân Viên", 
                  dataIndex: "employee", 
                  key: "employee",
                  render: (text) => (
                    <span className="pages-employee-badge">
                      <TeamOutlined style={{ fontSize: 12 }} />
                      {text}
                    </span>
                  )
                },
              ]}
              pagination={false}
            />
          </div>
        </div>
      )}

      {/* Main List Title */}
      <div className="pages-list-header">
        <div className="pages-list-header-bg" aria-hidden="true">
          <span className="pages-list-header-blob pages-list-header-blob--1" />
          <span className="pages-list-header-blob pages-list-header-blob--2" />
          <span className="pages-list-header-blob pages-list-header-blob--3" />
        </div>

        <div className="pages-list-header-top">
          <div className="pages-list-header-titles">
            <h2 className="pages-list-header-title">
              <span className="pages-list-header-icon" aria-hidden="true">
                <AppstoreOutlined />
              </span>
              <span className="pages-list-header-title-text">Danh Sách Page</span>
            </h2>
            <p className="pages-list-header-subtitle">
              Quản lý các page của đội nhóm — đồng bộ theo thời gian thực
            </p>
          </div>

          <div className="pages-list-header-stats">
            <div className="pages-stat-chip pages-stat-chip--total">
              <span className="pages-stat-chip-icon">
                <FileTextOutlined />
              </span>
              <span className="pages-stat-chip-body">
                <span className="pages-stat-chip-value">
                  {totalPagesAnim.toLocaleString("vi-VN")}
                </span>
                <span className="pages-stat-chip-label">Tổng page</span>
              </span>
            </div>

            <div className="pages-stat-chip pages-stat-chip--employee">
              <span className="pages-stat-chip-icon">
                <TeamOutlined />
              </span>
              <span className="pages-stat-chip-body">
                <span className="pages-stat-chip-value">
                  {uniqueEmployeesAnim.toLocaleString("vi-VN")}
                </span>
                <span className="pages-stat-chip-label">Nhân viên</span>
              </span>
            </div>

            <div className="pages-stat-chip pages-stat-chip--active">
              <span className="pages-stat-chip-icon">
                <CheckCircleOutlined />
              </span>
              <span className="pages-stat-chip-body">
                <span className="pages-stat-chip-value">
                  {activePagesAnim.toLocaleString("vi-VN")}
                </span>
                <span className="pages-stat-chip-label">Đang hoạt động</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="pages-table-container">
        <Table
          columns={columns}
          dataSource={filteredData.sort(
            (a, b) => a.employee?.localeCompare(b.employee) || 0
          )}
          pagination={{ 
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
            showTotal: (total, range) => (
              <span style={{ color: "var(--sub)", fontWeight: 600 }}>
                {range[0]}-{range[1]} / {total} page
              </span>
            )
          }}
          rowKey="key"
        />
      </div>

      {/* Edit Page Modal — tách riêng khỏi form Thêm */}
      <Modal
        open={editModalOpen}
        onCancel={handleCloseEdit}
        footer={null}
        width={540}
        destroyOnHidden
        maskClosable={false}
        closable={false}
        className="edit-page-modal"
        centered
      >
        {/* Header gradient với icon box */}
        <div className="edit-page-modal-header">
          <div className="edit-page-modal-icon-box">
            <EditOutlined />
          </div>
          <div>
            <div className="edit-page-modal-title">Chỉnh sửa Page</div>
            <div className="edit-page-modal-subtitle">
              Cập nhật tên page hoặc chuyển nhân viên phụ trách
            </div>
          </div>
          <Tooltip title="Đóng" placement="bottom" mouseEnterDelay={0.15}>
            <button
              type="button"
              className="edit-page-modal-close"
              onClick={handleCloseEdit}
              aria-label="Đóng"
            >
              <CloseOutlined />
            </button>
          </Tooltip>
        </div>

        {/* Body */}
        <div className="edit-page-modal-body">
          {/* Field: Tên page */}
          <div className="edit-page-field">
            <label className="edit-page-label">
              <span className="edit-page-dot" />
              Tên page
            </label>
            <Input
              className="edit-page-input"
              placeholder="Nhập tên page"
              value={editPageName}
              onChange={(e) => setEditPageName(e.target.value)}
              prefix={<AppstoreOutlined className="edit-page-input-icon" />}
              autoFocus
            />
          </div>

          {/* Field: Nhân viên */}
          <div className="edit-page-field">
            <label className="edit-page-label">
              <span className="edit-page-dot" />
              Nhân viên phụ trách
            </label>
            <Select
              className="edit-page-select"
              showSearch
              placeholder="Chọn nhân viên"
              value={editEmployee}
              onChange={setEditEmployee}
              optionFilterProp="children"
              suffixIcon={<TeamOutlined />}
            >
              {mktOptions.map((emp) => (
                <Option key={emp} value={emp}>
                  {emp}
                </Option>
              ))}
            </Select>
          </div>
        </div>

        {/* Footer */}
        <div className="edit-page-modal-footer">
          <button
            type="button"
            className="edit-page-btn edit-page-btn-ghost"
            onClick={handleCloseEdit}
          >
            <CloseOutlined />
            Hủy
          </button>
          <button
            type="button"
            className="edit-page-btn edit-page-btn-primary"
            onClick={handleSaveEdit}
          >
            <CheckCircleOutlined />
            Lưu thay đổi
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default EmployeePageTable;
