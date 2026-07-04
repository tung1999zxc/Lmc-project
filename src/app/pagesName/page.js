"use client";
import { useState, useEffect, useMemo } from "react";
import { CopyOutlined } from "@ant-design/icons"; // ⚡ thêm dòng này ở đầu file
import {
  Table,
  Input,
  Select,
  Button,
  Space,
  Popconfirm,
  message,
  Modal,
} from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { DatePicker } from "antd";
import dayjs from "dayjs"; // Cài thêm dayjs để so sánh ngày
const { Option } = Select;
import { useRouter } from "next/navigation";

const EmployeePageTable = () => {
  const router = useRouter();
  const currentUser = useSelector((state) => state.user.currentUser);
  useEffect(() => {
    if (!currentUser.name) {
      router.push("/login");
    }
    if (currentUser.position === "kho1") {
      router.push("/orders");
    }
  }, []);
  const [messageApi, contextHolder] = message.useMessage();
  const [pageName, setPageName] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [data, setData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [dateRange, setDateRange] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [appliedSearchText, setAppliedSearchText] = useState("");
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [pageListInput, setPageListInput] = useState("");
  const [filteredPages, setFilteredPages] = useState([]);
  const [viaData, setViaData] = useState([]);
  const [editingViaId, setEditingViaId] = useState(null);
  const [tempViaLink, setTempViaLink] = useState("");
  const [checkPageName, setCheckPageName] = useState("");
  const [checkingPage, setCheckingPage] = useState(false);
  const [checkResult, setCheckResult] = useState(null);
  const [checkEffect, setCheckEffect] = useState(null);

  const showCheckEffect = (isDuplicate) => {
    setCheckEffect(isDuplicate ? "dup" : "ok");

    setTimeout(() => {
      setCheckEffect(null);
    }, 1400);
  };

  const handleCheckPageCompany = async () => {
    const name = checkPageName.trim();

    if (!name) {
      message.warning("Vui lòng nhập tên page cần check");
      return;
    }

    try {
      setCheckingPage(true);

      const res = await axios.get("/api/pageName/check", {
        params: { pageName: name },
      });

      setCheckResult(res.data);
      showCheckEffect(res.data.isDuplicate);

      if (res.data.isDuplicate) {
        message.error(res.data.message);
      } else {
        message.success(res.data.message);
      }
    } catch (error) {
      console.error(error);
      message.error(error.response?.data?.error || "Lỗi khi check page");
    } finally {
      setCheckingPage(false);
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
      const filler = Array.from({ length: Math.max(0, 8 - list.length) }).map(
        (_, i) => ({
          _id: `empty-${i}`,
          link: "",
          isEmpty: true,
        }),
      );
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
        leadTeamMembers.includes(record.employee),
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
            .includes(appliedSearchText.toLowerCase()),
      );
    }

    if (dateRange && dateRange.length === 2) {
      const [startDate, endDate] = dateRange;
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
        teamMembers.includes(record.employee),
      );
    }

    return tempData;
  }, [
    data,
    currentUser,
    leadTeamMembers,
    appliedSearchText,
    dateRange,
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
    setIsEditing(true);
    setEditingRecord(record);
    setPageName(record.pageName);
    setSelectedEmployee(record.employee);
  };

  const handleSaveEdit = async () => {
    try {
      const updateData = {
        pageName,
        employee: selectedEmployee,
      };
      const response = await axios.put(
        `/api/pageName/${editingRecord.key}`,
        updateData,
      );
      message.success(response.data.message);
      // Làm mới danh sách đơn hàng sau khi cập nhật
      fetchNamePage();
      // Reset trạng thái edit
      setIsEditing(false);
      setEditingRecord(null);
      setPageName("");
      setSelectedEmployee(null);
    } catch (error) {
      console.error(error.response?.data?.error || error.message);
      message.error(error.response?.data?.error || "Lỗi khi cập nhật đơn hàng");
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
          return (
            <Input
              value={tempViaLink}
              onChange={(e) => setTempViaLink(e.target.value)}
            />
          );
        }
        return (
          <Space>
            <strong>{text}</strong>
            <Button
              type="primary"
              size="middle"
              icon={<CopyOutlined style={{ fontSize: 18 }} />}
              onClick={() => handleCopy(text)}
              style={{
                borderRadius: 8,
                fontSize: 16,
                padding: "4px 12px",
                background: "#1677ff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              Copy
            </Button>
          </Space>
        );
      },
    },
    {
      title: "Hành động",
      render: (_, record) => (
        <Space>
          {editingViaId === record._id ? (
            <Button
              disabled={
                currentUser.position !== "leadSALE" &&
                currentUser.position !== "managerSALE" &&
                currentUser.name !== "Tung99"
              }
              type="link"
              onClick={() => saveVia(record)}
            >
              Lưu
            </Button>
          ) : (
            <Button
              disabled={
                currentUser.position !== "leadSALE" &&
                currentUser.position !== "managerSALE" &&
                currentUser.name !== "Tung99"
              }
              type="link"
              onClick={() => {
                setEditingViaId(record._id);
                setTempViaLink(record.link);
              }}
            >
              Sửa
            </Button>
          )}
          {!record.isEmpty && (
            <Popconfirm
              title="Xóa link này?"
              onConfirm={() => deleteVia(record._id)}
            >
              <Button
                disabled={
                  currentUser.position !== "leadSALE" &&
                  currentUser.position !== "managerSALE" &&
                  currentUser.name !== "Tung99"
                }
                type="link"
                danger
              >
                Xóa
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];
  const columns = [
    {
      title: "Tên Page",
      dataIndex: "pageName",
      key: "pageName",
      render: (text) => (
        <Space>
          <span style={{ fontWeight: 500 }}>{text}</span>
          <Button
            type="primary"
            size="middle"
            icon={<CopyOutlined style={{ fontSize: 18 }} />}
            onClick={() => handleCopy(text)}
            style={{
              borderRadius: 8,
              fontSize: 16,
              padding: "4px 12px",
              background: "#1677ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            Copy
          </Button>
        </Space>
      ),
    },

    { title: "Tên Nhân Viên", dataIndex: "employee", key: "employee" },
    {
      title: "Thời gian",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (value) => {
        const date = new Date(value);
        return date.toLocaleDateString("vi-VN");
      },
    },

    {
      title: "Thao Tác",
      key: "action",
      render: (_, record) => {
        // Nếu currentUser có vai trò admin, managerMKT, managerSALE → hiển thị đầy đủ nút chỉnh sửa và xóa
        if (
          currentUser.position === "admin" ||
          currentUser.position === "managerSALE" ||
          currentUser.position === "managerMKT"
        ) {
          return (
            <div>
              <Space>
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={() => handleEdit(record)}
                />

                <Popconfirm
                  title="Xóa bản ghi?"
                  onConfirm={() => handleDelete(record.key)}
                >
                  <Button danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </Space>
            </div>
          );
        } else {
          // Nếu không phải các vị trí đặc quyền, chỉ cho phép chỉnh sửa nếu tài khoản trùng với currentUser
          if (record.employee === currentUser.name) {
            return (
              <div>
                <Space>
                  <Button
                    type="primary"
                    icon={<EditOutlined />}
                    onClick={() => handleEdit(record)}
                  />

                  <Popconfirm
                    title="Xóa bản ghi?"
                    onConfirm={() => handleDelete(record.key)}
                  >
                    <Button danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                </Space>
              </div>
            );
          } else {
            return <span>Chỉ xem</span>;
          }
        }
      },
    },
  ];

  const normalizeText = (text) =>
    text.toLowerCase().trim().replace(/\s+/g, " ");

  const checkPageStyle = `
.check-page-box{
  margin:24px 0;
  padding:22px;
  background:#fff;
  border-radius:14px;
  box-shadow:0 4px 24px rgba(0,0,0,0.08);
  border:1px solid #eef1f5;
}

.check-page-box h2{
  font-size:18px;
  margin-bottom:14px;
  color:#1a1e2e;
}

.check-page-result{
  margin-top:14px;
  padding:12px 14px;
  border-radius:10px;
  font-size:15px;
  font-weight:600;
}

.check-page-result.danger{
  background:#fff1f0;
  color:#cf1322;
  border:1px solid #ffa39e;
}

.check-page-result.success{
  background:#f6ffed;
  color:#389e0d;
  border:1px solid #b7eb8f;
}

.check-overlay{
  position:fixed;
  inset:0;
  z-index:9999;
  display:flex;
  align-items:center;
  justify-content:center;
  pointer-events:none;
  opacity:0;
  transition:opacity .3s;
}

.check-overlay.show{
  opacity:1;
}

.danger-bg{
  background:rgba(255,40,40,.12);
}

.success-bg{
  background:rgba(34,197,94,.1);
}

.check-text{
  font-size:72px;
  font-weight:900;
  letter-spacing:6px;
  text-shadow:0 4px 30px rgba(0,0,0,.5);
  animation-duration:1.2s;
  animation-fill-mode:forwards;
}

.check-text.ne{
  color:#ff4444;
  animation-name:neRa;
}

.check-text.vut{
  color:#22c55e;
  animation-name:vutDi;
}

@keyframes neRa{
  0%{transform:scale(.3) rotate(-10deg);opacity:0}
  20%{transform:scale(1.3) rotate(5deg);opacity:1}
  30%{transform:scale(1) rotate(-3deg)}
  40%{transform:scale(1.05) rotate(2deg)}
  50%{transform:scale(1) rotate(0)}
  70%{transform:scale(1);opacity:1}
  100%{transform:scale(1.5) rotate(-5deg);opacity:0}
}

@keyframes vutDi{
  0%{transform:scale(.3) translateY(60px);opacity:0}
  25%{transform:scale(1.2) translateY(0);opacity:1}
  50%{transform:scale(1) translateY(0);opacity:1}
  100%{transform:scale(.5) translateY(-300px) translateX(200px) rotate(25deg);opacity:0}
}

.check-particle{
  position:absolute;
  width:10px;
  height:10px;
  border-radius:50%;
  animation:particleFly 1s ease-out forwards;
}

.particle-danger{
  background:#ff4444;
}

.particle-success{
  background:#22c55e;
}

@keyframes particleFly{
  0%{opacity:1;transform:translate(0,0) scale(1)}
  100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(0)}
}
`;
  // Giữ lại khoảng trắng giữa từ, nhưng loại bỏ thừa
  return (
    <div style={{ padding: 20 }}>
      {contextHolder}
      <style>{checkPageStyle}</style>
      {/* <div style={{ marginTop: 40, marginBottom: 40 }}>
      <h2>Bảng Quản Lí  Via Share Page</h2>
      <Table 
        dataSource={viaData} 
        columns={viaColumns} 
        pagination={false} 
        bordered 
        rowKey="_id"
      />
    </div> */}
      <Space style={{ marginBottom: 20 }}>
        <Input
          style={{ width: 300 }}
          placeholder="Nhập tên page"
          value={pageName}
          onChange={(e) => setPageName(e.target.value)}
        />
        <Select
          showSearch
          placeholder="Chọn nhân viên"
          value={selectedEmployee}
          onChange={setSelectedEmployee}
          style={{ width: 300 }}
        >
          {mktOptions.map((emp) => (
            <Option key={emp} value={emp}>
              {emp}
            </Option>
          ))}
        </Select>
        <Button
          style={{ width: 200 }}
          type="primary"
          onClick={isEditing ? handleSaveEdit : handleAdd}
        >
          {isEditing ? "Lưu" : "Thêm"}
        </Button>
      </Space>
      {currentUser.name === "Tung99" && (
        <Space style={{ marginTop: 20 }}>
          <Select
            mode="tags"
            placeholder="Nhập tên hoặc chọn nhân viên MKT"
            value={selectedEmployee ? [selectedEmployee] : []}
            onChange={(values) => setSelectedEmployee(values[0])}
            style={{ width: 350 }}
            tokenSeparators={[","]} // cho phép nhập nhanh
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
                const response = await axios.delete(
                  `/api/pageName/deleteByEmployee?employee=${selectedEmployee}`,
                );
                message.success(response.data.message);
                fetchNamePage(); // load lại danh sách
              } catch (error) {
                console.error(error);
                message.error("Lỗi khi xoá toàn bộ page");
              }
            }}
          >
            <Button danger type="primary" style={{ width: 200 }}>
              Xoá toàn bộ page
            </Button>
          </Popconfirm>
          <Space style={{ marginTop: 20 }}>
            {/* ================== NÚT CHUYỂN PAGE SANG DIỆN ================== */}
            <Popconfirm
              title="Bạn có chắc muốn chuyển toàn bộ page sang Trần Ngọc Diện?"
              okText="Chuyển"
              cancelText="Hủy"
              onConfirm={async () => {
                try {
                  const response = await axios.put(
                    "/api/pageName/transferPages",
                  );
                  message.success(response.data.message);
                  fetchNamePage(); // load lại danh sách
                } catch (error) {
                  console.error(error);
                  message.error("Lỗi khi chuyển page");
                }
              }}
            >
              <Button
                type="primary"
                style={{ background: "#722ed1", width: 250 }}
              >
                Chuyển page sang Diện
              </Button>
            </Popconfirm>
          </Space>
        </Space>
      )}
      <br></br>
      <Input.Search
        style={{ width: 300 }}
        placeholder="Tìm kiếm tên page / tên nhân viên"
        value={searchText}
        allowClear
        onClear={() => {
          setSearchText("");
          setAppliedSearchText("");
          // Hiển thị lại danh sách đầy đủ khi nhấn X
        }}
        onChange={(e) => setSearchText(e.target.value)}
        onSearch={() => setAppliedSearchText(searchText)}
        onPressEnter={() => setAppliedSearchText(searchText)}
      />
      <DatePicker.RangePicker
        onChange={(dates) => setDateRange(dates)}
        style={{ width: 300 }}
        format="DD/MM/YYYY"
      />
      <Select
        style={{ width: 300 }}
        placeholder="Chọn team"
        value={selectedTeam}
        allowClear
        onClear={() => setSelectedTeam(null)}
        onChange={(value) => setSelectedTeam(value)}
      >
        <Option value="SON">TEAM SƠN</Option>
        <Option value="QUAN">TEAM QUÂN</Option>
        {/* <Option value="CHI">TEAM CHI</Option> */}
        <Option value="LE">TEAM LE</Option>
        <Option value="TUANANH">TEAM TUẤN ANH</Option>
        <Option value="DIEN">TEAM DIỆN</Option>

        <Option value="HIEU">TEAM HIẾU</Option>
        <Option value="DIEU">TEAM DIỆU</Option>
      </Select>
      <div className="check-page-box">
        <h2>🔍 Check Page trùng trong công ty</h2>

        <Space>
          <Input
            style={{ width: 360 }}
            placeholder="Nhập tên page để check..."
            value={checkPageName}
            onChange={(e) => setCheckPageName(e.target.value)}
            onPressEnter={handleCheckPageCompany}
          />

          <Button
            type="primary"
            loading={checkingPage}
            onClick={handleCheckPageCompany}
          >
            🔍 Check
          </Button>
        </Space>

        {checkResult && (
          <div
            className={
              checkResult.isDuplicate
                ? "check-page-result danger"
                : "check-page-result success"
            }
          >
            {checkResult.isDuplicate ? (
              <>
                🚫 Page đã có: <b>{checkResult.data?.pageName}</b>
                <br />
                {/* Người đang giữ: <b>{checkResult.data?.employee}</b> */}
              </>
            ) : (
              <>✅ Page chưa trùng, có thể chạy</>
            )}
          </div>
        )}
      </div>

      {checkEffect && (
        <div
          className={`check-overlay show ${
            checkEffect === "dup" ? "danger-bg" : "success-bg"
          }`}
        >
          <div className={`check-text ${checkEffect === "dup" ? "ne" : "vut"}`}>
            {checkEffect === "dup" ? "🚫 NÉ RA" : "✅ VỤT ĐI"}
          </div>

          {Array.from({ length: 18 }).map((_, i) => (
            <span
              key={i}
              className={`check-particle ${
                checkEffect === "dup" ? "particle-danger" : "particle-success"
              }`}
              style={{
                left: `${45 + Math.random() * 20}%`,
                top: `${45 + Math.random() * 20}%`,
                "--dx": `${Math.random() * 400 - 200}px`,
                "--dy": `${Math.random() * 400 - 200}px`,
                animationDelay: `${Math.random() * 0.3}s`,
              }}
            />
          ))}
        </div>
      )}
      <br></br>
      {(currentUser.name === "Trần Mỹ Hạnh" ||
        currentUser.name === "Tung99") && (
        <Space style={{ marginTop: 20, flexDirection: "column" }}>
          <h3>Trần Mỹ Hạnh search đi cho nhanh !</h3>
          <Input.TextArea
            rows={3}
            placeholder="Dán danh sách tên page, mỗi dòng 1 tên"
            style={{ width: 400 }}
            value={pageListInput}
            onChange={(e) => setPageListInput(e.target.value)}
          />
          <Button
            type="primary"
            style={{ marginTop: 10, width: 200 }}
            onClick={() => {
              const searchPages = pageListInput
                .split(/\r?\n/) // tách từng dòng
                .map((name) => normalizeText(name)) // chuẩn hóa từng dòng
                .filter((name) => name); // loại bỏ dòng trống

              const matchedPages = data.filter((record) =>
                searchPages.includes(normalizeText(record.pageName)),
              );

              setFilteredPages(matchedPages);

              // Gợi ý log các tên không tìm thấy (gỡ lỗi)
              const notFound = searchPages.filter(
                (p) => !data.find((d) => normalizeText(d.pageName) === p),
              );
              if (notFound.length > 0) {
                console.log("❌ Không tìm thấy các page sau:", notFound);
              }
            }}
          >
            Tìm kiếm danh sách page
          </Button>
        </Space>
      )}
      {filteredPages.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <h3>Kết quả tìm kiếm:</h3>
          <Table
            dataSource={filteredPages.map((item, index) => ({
              key: index,
              pageName: item.pageName,
              employee: item.employee,
            }))}
            columns={[
              { title: "Tên Page", dataIndex: "pageName", key: "pageName" },
              {
                title: "Tên Nhân Viên",
                dataIndex: "employee",
                key: "employee",
              },
            ]}
            pagination={false}
          />
        </div>
      )}

      <h2>List Page</h2>
      <Table
        columns={columns}
        dataSource={filteredData.sort(
          (a, b) => a.employee?.localeCompare(b.employee) || 0,
        )}
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
};

export default EmployeePageTable;
