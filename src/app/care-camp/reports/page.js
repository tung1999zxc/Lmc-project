"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Table,
  Button,
  Input,
  Tag,
  Space,
  message,
  Alert,
  Segmented,
  DatePicker,
  Descriptions,
  Collapse,
  Select,
  Tooltip,
} from "antd";
import {
  ReloadOutlined,
  SearchOutlined,
  TeamOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";

const money = (n) => Number(n || 0).toLocaleString("vi-VN");

const API_REPORTS = "/api/care-camp/reports";

/* --------------------------------------------------------------------------
 * Helpers
 * -------------------------------------------------------------------------- */
const fmtTime = (v) => (v ? new Date(v).toLocaleString("vi-VN") : "-");
const fmtTimeOnly = (v) => (v ? new Date(v).toLocaleTimeString("vi-VN") : "-");

/** "2g 15p" */
function fmtDuration(ms) {
  const totalMin = Math.max(0, Math.round((Number(ms) || 0) / 60000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h <= 0) return `${m} phút`;
  return `${h}g ${String(m).padStart(2, "0")}p`;
}

/* --------------------------------------------------------------------------
 * Component — TRANG CHỈ ĐỌC cho admin
 * -------------------------------------------------------------------------- */
export default function CareCampReportsPage() {
  const router = useRouter();
  const currentUser = useSelector((state) => state.user.currentUser || {});

  const [tab, setTab] = useState("reports");

  // bộ lọc
  const [date, setDate] = useState(dayjs());
  const [dateStr, setDateStr] = useState(dayjs().format("YYYY-MM-DD"));
  const [allDates, setAllDates] = useState(false);
  const [employeeName, setEmployeeName] = useState("");
  const [searchEmp, setSearchEmp] = useState("");

  const [reports, setReports] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [availableDates, setAvailableDates] = useState([]);
  const [loadingRep, setLoadingRep] = useState(false);
  const [loadingEmp, setLoadingEmp] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);

  useEffect(() => {
    if (!currentUser?.name) router.push("/login");
  }, [currentUser?.name, router]);

  /* ---------------- Load báo cáo ---------------- */
  const loadReports = useCallback(async () => {
    setLoadingRep(true);
    try {
      const params = { name: employeeName || undefined };
      if (allDates) params.all = "1";
      else params.date = dateStr;

      const res = await axios.get(API_REPORTS, { params });
      setReports(res.data?.reports || []);
    } catch (e) {
      console.error(e);
      message.error("Lỗi tải báo cáo.");
    } finally {
      setLoadingRep(false);
    }
  }, [dateStr, allDates, employeeName]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  /* ---------------- Load danh sách nhân viên + các ngày có báo cáo ------ */
  const loadMeta = useCallback(async () => {
    setLoadingEmp(true);
    try {
      const [empRes, dateRes] = await Promise.all([
        axios.get(API_REPORTS, { params: { employees: "1" } }),
        axios.get(API_REPORTS, { params: { dates: "1" } }),
      ]);
      setEmployees(empRes.data?.employees || []);
      setAvailableDates(dateRes.data?.dates || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingEmp(false);
    }
  }, []);

  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  /* ---------------- Cột bảng nhân viên (chỉ đọc) ---------------- */
  const empColumns = [
    {
      title: "Nhân viên",
      dataIndex: "employeeName",
      key: "employeeName",
      render: (v, r) => (
        <div>
          <b style={{ fontSize: 13 }}>{v}</b>
          <div style={{ fontSize: 11, color: "#64748b" }}>
            {r.position || "—"}
            {r.employeeCode ? ` · Mã ${r.employeeCode}` : ""}
            {r.teamTp ? ` · ${r.teamTp}` : ""}
          </div>
        </div>
      ),
    },
    {
      title: "Tài khoản QC",
      dataIndex: "accountsCount",
      width: 110,
      align: "center",
      render: (v) => (
        <Tag color={v ? "blue" : "default"}>{v || 0} TK</Tag>
      ),
    },
    {
      title: "Nhóm giám sát",
      dataIndex: "monitoredCount",
      width: 120,
      align: "center",
      render: (v) => <Tag color={v ? "purple" : "default"}>{v || 0} nhóm</Tag>,
    },
    {
      title: "Trạng thái",
      key: "running",
      width: 110,
      align: "center",
      render: (_, r) =>
        r.running ? (
          <Tag color="green">Đang giám sát</Tag>
        ) : (
          <Tag color="default">Không giám sát</Tag>
        ),
    },
    {
      title: "Cập nhật cuối",
      dataIndex: "updatedAt",
      width: 150,
      render: (v) => (
        <span style={{ fontSize: 11, color: "#64748b" }}>{fmtTime(v)}</span>
      ),
    },
    {
      title: "",
      key: "act",
      width: 120,
      render: (_, r) => (
        <Button
          size="small"
          type="link"
          onClick={() => {
            setEmployeeName(r.employeeName);
            setTab("reports");
          }}
        >
          Xem báo cáo
        </Button>
      ),
    },
  ];

  /* ---------------- Cột bảng báo cáo ---------------- */
  const reportColumns = [
    {
      title: "Ngày",
      dataIndex: "date",
      key: "date",
      width: 100,
      render: (v) => (
        <span style={{ fontFamily: "monospace", fontSize: 12 }}>{v}</span>
      ),
    },
    {
      title: "Nhân viên",
      dataIndex: "employeeName",
      key: "employeeName",
      render: (v) => <b style={{ fontSize: 13 }}>{v}</b>,
    },
    {
      title: "Số nhóm",
      key: "totalAdsets",
      width: 100,
      align: "right",
      render: (_, r) => {
        const s = r.payload?.summary || {};
        return (
          <span style={{ fontFamily: "monospace", fontWeight: 700 }}>
            {s.totalAdsets || 0}
            <span style={{ color: "#16a34a", fontSize: 11 }}>
              {" "}
              ({s.activeAdsets || 0} chạy)
            </span>
          </span>
        );
      },
    },
    {
      title: "Tổng chi tiêu",
      key: "totalSpend",
      width: 130,
      align: "right",
      render: (_, r) => (
        <span
          style={{ fontFamily: "monospace", fontWeight: 700, color: "#b45309" }}
        >
          {money(r.payload?.summary?.totalSpend)} đ
        </span>
      ),
    },
    {
      title: "Tổng KQ",
      key: "totalResults",
      width: 100,
      align: "right",
      render: (_, r) => (
        <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#16a34a" }}>
          {money(r.payload?.summary?.totalResults)}
        </span>
      ),
    },
    {
      title: "Chi phí / KQ",
      key: "avgCost",
      width: 120,
      align: "right",
      render: (_, r) => (
        <span style={{ fontFamily: "monospace", color: "#dc2626" }}>
          {money(r.payload?.summary?.avgCostPerResult)} đ
        </span>
      ),
    },
    {
      title: "Thời gian chạy",
      key: "activeDuration",
      width: 120,
      align: "right",
      render: (_, r) => (
        <span style={{ fontFamily: "monospace", color: "#0e7490" }}>
          {r.payload?.summary?.activeDuration || "0 phút"}
        </span>
      ),
    },
    {
      title: "Tài khoản QC",
      key: "accounts",
      width: 100,
      align: "center",
      render: (_, r) => (
        <Tag color="blue">{r.payload?.summary?.accountsCount || 0} TK</Tag>
      ),
    },
    {
      title: "",
      key: "act",
      width: 90,
      render: (_, r) => (
        <Button
          size="small"
          type="link"
          onClick={() => setSelectedReport(r.payload)}
        >
          Chi tiết
        </Button>
      ),
    },
  ];

  /* ---------------- Cột bảng chi tiết nhóm ---------------- */
  const adsetColumns = [
    {
      title: "Nhóm quảng cáo",
      dataIndex: "adsetName",
      key: "adsetName",
      render: (v, r) => (
        <div>
          <b style={{ fontSize: 12 }}>{v}</b>
          <div style={{ fontSize: 10, color: "#94a3b8", fontFamily: "monospace" }}>
            {r.adsetId}
          </div>
        </div>
      ),
    },
    {
      title: "Chiến dịch",
      dataIndex: "campaignName",
      key: "campaignName",
      width: 160,
      render: (v) => (
        <span style={{ fontSize: 11, color: "#2563eb" }}>{v || "-"}</span>
      ),
    },
    {
      title: "Tài khoản",
      dataIndex: "accountName",
      key: "accountName",
      width: 130,
      render: (v) => (
        <span style={{ fontSize: 11, color: "#475569" }}>{v || "-"}</span>
      ),
    },
    {
      title: "Trạng thái",
      key: "status",
      width: 90,
      align: "center",
      render: (_, r) =>
        r.status === "ACTIVE" ? (
          <Tag color="green">Đang chạy</Tag>
        ) : (
          <Tag color="red">Đã tắt</Tag>
        ),
    },
    {
      title: "Tiêu",
      key: "spend",
      width: 100,
      align: "right",
      render: (_, r) => (
        <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#b45309" }}>
          {money(r.spend)} đ
        </span>
      ),
    },
    {
      title: "Kết quả",
      key: "results",
      width: 100,
      align: "right",
      render: (_, r) => (
        <div>
          <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#16a34a" }}>
            {money(r.results)}
          </span>
          <div style={{ fontSize: 10, color: "#94a3b8" }}>{r.resultLabel}</div>
        </div>
      ),
    },
    {
      title: "Chi phí / KQ",
      key: "costPerResult",
      width: 110,
      align: "right",
      render: (_, r) => (
        <span style={{ fontFamily: "monospace", color: "#dc2626" }}>
          {money(r.costPerResult)} đ
        </span>
      ),
    },
    {
      title: "CPM",
      key: "cpm",
      width: 90,
      align: "right",
      render: (_, r) => (
        <span style={{ fontFamily: "monospace", color: "#0e7490" }}>
          {money(r.cpm)} đ
        </span>
      ),
    },
    {
      title: "Thời gian hoạt động",
      key: "activeDuration",
      width: 190,
      render: (_, r) => (
        <div style={{ fontSize: 11 }}>
          <div style={{ fontWeight: 700, fontFamily: "monospace", color: "#0e7490" }}>
            {r.activeDuration}
          </div>
          <div style={{ color: "#94a3b8" }}>
            {r.firstActiveAt ? fmtTimeOnly(r.firstActiveAt) : "-"} →{" "}
            {r.lastActiveAt ? fmtTimeOnly(r.lastActiveAt) : "-"}
          </div>
          {r.firstSeenAt && (
            <div style={{ color: "#cbd5e1" }}>
              Thấy lần đầu: {fmtTime(r.firstSeenAt)}
            </div>
          )}
        </div>
      ),
    },
  ];

  /* ---------------- Tổng quan tất cả nhân viên ---------------- */
  const overall = useMemo(() => {
    const sum = (k) =>
      reports.reduce((s, r) => s + (Number(r.payload?.summary?.[k]) || 0), 0);
    return {
      employees: new Set(reports.map((r) => r.employeeName)).size,
      reports: reports.length,
      adsets: sum("totalAdsets"),
      activeAdsets: sum("activeAdsets"),
      spend: sum("totalSpend"),
      results: sum("totalResults"),
      activeMinutes: sum("activeMinutes"),
    };
  }, [reports]);

  /* ---------------- Render ---------------- */
  return (
    <div style={{ padding: "16px 18px", background: "#f8fafc", minHeight: "100%" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 14,
        }}
      >
        <div>
          <h2 style={{ margin: 0, color: "#0f172a", fontSize: 20, fontWeight: 800 }}>
            📅 Care Camp — Báo Cáo Nhân Viên
          </h2>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
            Chỉ đọc — dữ liệu do nhân viên tự lưu khi dùng web Care Camp.
          </div>
        </div>
        <Space wrap>
          <DatePicker
            value={date}
            onChange={(d) => {
              if (!d) return;
              setDate(d);
              setDateStr(d.format("YYYY-MM-DD"));
              setAllDates(false);
            }}
            format="DD/MM/YYYY"
            allowClear={false}
            disabled={allDates}
          />
          <Tooltip title="Xem tất cả các ngày đã có báo cáo">
            <Button
              type={allDates ? "primary" : "default"}
              onClick={() => setAllDates((v) => !v)}
            >
              Tất cả ngày
            </Button>
          </Tooltip>
          <Select
            allowClear
            showSearch
            placeholder="Tất cả nhân viên"
            style={{ width: 210 }}
            optionFilterProp="label"
            value={employeeName || undefined}
            onChange={(v) => setEmployeeName(v || "")}
            options={employees.map((e) => ({
              label: e.employeeName,
              value: e.employeeName,
            }))}
          />
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            loading={loadingRep}
            onClick={loadReports}
          >
            Làm mới
          </Button>
          <Segmented
            value={tab}
            onChange={setTab}
            options={[
              { label: "📄 Báo cáo", value: "reports" },
              { label: "👥 Nhân viên", value: "employees" },
            ]}
          />
        </Space>
      </div>

      {/* Tổng quan */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: 10,
          marginBottom: 14,
        }}
      >
        {[
          {
            label: "Nhân viên có báo cáo",
            value: overall.employees,
            color: "#2563eb",
          },
          { label: "Tổng nhóm", value: overall.adsets, color: "#7c3aed" },
          {
            label: "Nhóm đang chạy",
            value: overall.activeAdsets,
            color: "#16a34a",
          },
          {
            label: "Tổng chi tiêu",
            value: `${money(overall.spend)} đ`,
            color: "#b45309",
          },
          {
            label: "Tổng kết quả",
            value: money(overall.results),
            color: "#16a34a",
          },
          {
            label: "Tổng giờ chạy",
            value: fmtDuration(overall.activeMinutes * 60000),
            color: "#0e7490",
          },
        ].map((c) => (
          <div
            key={c.label}
            style={{
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              padding: "12px 14px",
            }}
          >
            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>
              {c.label}
            </div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: c.color,
                fontFamily: "monospace",
                marginTop: 4,
              }}
            >
              {c.value}
            </div>
          </div>
        ))}
      </div>

      {/* ================= TAB BÁO CÁO ================= */}
      {tab === "reports" && (
        <div
          style={{
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            padding: 14,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 12,
              flexWrap: "wrap",
            }}
          >
            <h3 style={{ margin: 0, fontSize: 15, color: "#0f172a" }}>
              <FileTextOutlined />{" "}
              {allDates
                ? "Tất cả báo cáo đã lưu"
                : `Báo cáo ngày ${dateStr}`}
            </h3>
            <Tag color="blue">{reports.length} báo cáo</Tag>
            {availableDates.length > 0 && (
              <Select
                size="small"
                placeholder="Chọn ngày có báo cáo"
                style={{ width: 190 }}
                allowClear
                value={dateStr}
                onChange={(v) => {
                  if (!v) return;
                  setDate(dayjs(v));
                  setDateStr(v);
                  setAllDates(false);
                }}
                options={availableDates.map((d) => ({
                  label: `${d.date} (${d.count})`,
                  value: d.date,
                }))}
              />
            )}
            <div style={{ flex: 1 }} />
            <Button size="small" icon={<ReloadOutlined />} onClick={loadReports}>
              Làm mới
            </Button>
          </div>

          {reports.length === 0 ? (
            <Alert
              type="info"
              showIcon
              message="Chưa có báo cáo nào."
              description={
                <span>
                  Báo cáo được tạo tự động khi nhân viên mở trang Care Camp hoặc
                  bấm “Tải nhóm quảng cáo”. Nhân viên cần nhập Access Token +
                  ID tài khoản QC của họ ở trang <b>/care-camp</b>.
                </span>
              }
            />
          ) : (
            <Table
              size="small"
              rowKey="id"
              loading={loadingRep}
              columns={reportColumns}
              dataSource={reports}
              pagination={{ pageSize: 15 }}
              expandable={{
                expandedRowKeys: expandedRow ? [expandedRow] : [],
                onExpand: (expanded, record) =>
                  setExpandedRow(expanded ? record.id : null),
                expandedRowRender: (record) => (
                  <Table
                    size="small"
                    rowKey="adsetId"
                    columns={adsetColumns}
                    dataSource={record.payload?.adsets || []}
                    pagination={{ pageSize: 20 }}
                    scroll={{ x: 1100 }}
                  />
                ),
              }}
            />
          )}
        </div>
      )}

      {/* ================= TAB NHÂN VIÊN (chỉ đọc) ================= */}
      {tab === "employees" && (
        <div
          style={{
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            padding: 14,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              marginBottom: 12,
              flexWrap: "wrap",
            }}
          >
            <h3 style={{ margin: 0, fontSize: 15, color: "#0f172a" }}>
              <TeamOutlined /> Nhân viên đã dùng Care Camp ({employees.length})
            </h3>
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="Tìm nhân viên..."
              style={{ width: 240 }}
              value={searchEmp}
              onChange={(e) => setSearchEmp(e.target.value)}
            />
            <div style={{ flex: 1 }} />
            <Button size="small" icon={<ReloadOutlined />} onClick={loadMeta}>
              Làm mới
            </Button>
          </div>

          <Table
            size="small"
            rowKey={(r) => r.employeeName}
            loading={loadingEmp}
            columns={empColumns}
            dataSource={employees.filter((e) =>
              searchEmp.trim()
                ? String(e.employeeName)
                    .toLowerCase()
                    .includes(searchEmp.trim().toLowerCase())
                : true,
            )}
            pagination={{ pageSize: 10 }}
          />
        </div>
      )}

      {/* Modal chi tiết báo cáo */}
      {selectedReport && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,.55)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
          onClick={() => setSelectedReport(null)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 14,
              maxWidth: 1180,
              width: "100%",
              maxHeight: "88vh",
              overflow: "auto",
              padding: 18,
              boxShadow: "0 20px 60px rgba(0,0,0,.3)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <h3 style={{ margin: 0, color: "#0f172a" }}>
                📄 {selectedReport.employeeName} — {selectedReport.dateLabel}
              </h3>
              <Button onClick={() => setSelectedReport(null)}>Đóng</Button>
            </div>

            <Descriptions
              size="small"
              bordered
              column={4}
              style={{ marginBottom: 12 }}
              items={[
                {
                  key: "a",
                  label: "Tổng nhóm",
                  children: `${selectedReport.summary?.totalAdsets || 0} (${
                    selectedReport.summary?.activeAdsets || 0
                  } chạy)`,
                },
                {
                  key: "b",
                  label: "Tổng chi tiêu",
                  children: `${money(selectedReport.summary?.totalSpend)} đ`,
                },
                {
                  key: "c",
                  label: "Tổng kết quả",
                  children: money(selectedReport.summary?.totalResults),
                },
                {
                  key: "d",
                  label: "Chi phí / KQ",
                  children: `${money(selectedReport.summary?.avgCostPerResult)} đ`,
                },
                {
                  key: "e",
                  label: "Tổng giờ chạy",
                  children: selectedReport.summary?.activeDuration || "0 phút",
                },
                {
                  key: "f",
                  label: "CPM TB",
                  children: `${money(selectedReport.summary?.cpmAvg)} đ`,
                },
                {
                  key: "g",
                  label: "Impressions",
                  children: money(selectedReport.summary?.totalImpressions),
                },
                {
                  key: "h",
                  label: "Chế độ",
                  children: selectedReport.mode?.label || "-",
                },
              ]}
            />

            <h4 style={{ margin: "14px 0 8px", fontSize: 14 }}>Tài khoản QC</h4>
            <Table
              size="small"
              rowKey="accountId"
              pagination={false}
              dataSource={selectedReport.accounts || []}
              columns={[
                {
                  title: "Tài khoản",
                  dataIndex: "accountName",
                  render: (v, r) => (
                    <span>
                      <b>{v}</b>{" "}
                      <span style={{ color: "#94a3b8", fontSize: 11 }}>
                        {r.accountId}
                      </span>
                    </span>
                  ),
                },
                {
                  title: "Số nhóm",
                  dataIndex: "adsetCount",
                  width: 90,
                  align: "right",
                },
                {
                  title: "Đang chạy",
                  dataIndex: "activeAdsetCount",
                  width: 100,
                  align: "right",
                },
                {
                  title: "Kết quả",
                  dataIndex: "results",
                  width: 90,
                  align: "right",
                },
                {
                  title: "Chi tiêu",
                  dataIndex: "spend",
                  width: 130,
                  align: "right",
                  render: (v) => (
                    <span style={{ fontFamily: "monospace", fontWeight: 700 }}>
                      {money(v)} đ
                    </span>
                  ),
                },
              ]}
            />

            <h4 style={{ margin: "14px 0 8px", fontSize: 14 }}>
              Chi tiết từng nhóm quảng cáo
            </h4>
            <Table
              size="small"
              rowKey="adsetId"
              columns={adsetColumns}
              dataSource={selectedReport.adsets || []}
              pagination={{ pageSize: 20 }}
              scroll={{ x: 1200 }}
            />

            <Collapse
              style={{ marginTop: 12 }}
              items={[
                {
                  key: "names",
                  label: `🏷️ Danh sách tên nhóm đang chạy (${
                    (selectedReport.summary?.adsetNames || []).length
                  })`,
                  children: (
                    <div style={{ fontSize: 12, lineHeight: 1.8 }}>
                      {(selectedReport.summary?.adsetNames || []).length ? (
                        (selectedReport.summary?.adsetNames || []).map((n, i) => (
                          <span key={`${n}-${i}`} style={{ marginRight: 10 }}>
                            • {n}
                          </span>
                        ))
                      ) : (
                        <span style={{ color: "#94a3b8" }}>
                          Không có nhóm nào đang chạy.
                        </span>
                      )}
                    </div>
                  ),
                },
              ]}
            />
          </div>
        </div>
      )}
    </div>
  );
}
