"use client";

// ============================================================================
// TRANG TỔNG QUAN CÁ NHÂN - NHÂN VIÊN MKT
// ----------------------------------------------------------------------------
// Dành cho currentUser.position === "mkt" (và "lead" MKT).
//
// Chỉ số hiển thị:
//   1. Doanh số cá nhân (kèm so sánh kỳ trước)
//   2. Số đơn
//   3. Chi phí ADS
//   4. % ADS
//   5. Tiến độ đạt các mốc doanh số: 100tr / 130tr / 180tr / 250tr / 350tr
//
// Công thức lấy từ src/app/mkt/page.js (bảng "Báo cáo MKT"):
//   doanh số = sum(profitmkt ?? profit) * 17000 * 0.95
//   % ADS    = ADS xin / (doanh số / 0.95) * 100
// ============================================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  App,
  Button,
  Card,
  Col,
  Progress,
  Row,
  Segmented,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  CalendarOutlined,
  DollarOutlined,
  MoneyCollectOutlined,
  PercentageOutlined,
  ReloadOutlined,
  ShoppingCartOutlined,
  ThunderboltOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from "recharts";
import axios from "axios";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";

const { Title, Text } = Typography;

const formatVnd = (v) => Math.round(Number(v) || 0).toLocaleString("vi-VN");
const formatVndD = (v) => `${formatVnd(v)} đ`;
const formatCompact = (v) => {
  const n = Math.round(Number(v) || 0);
  if (Math.abs(n) >= 1_000_000_000)
    return `${(n / 1_000_000_000).toFixed(2)} tỷ`;
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} tr`;
  return formatVnd(n);
};

const PERIOD_OPTIONS = [
  { label: "Hôm nay", value: "today" },
  { label: "Tháng này", value: "month" },
  { label: "Tháng trước", value: "lastMonth" },
  { label: "7 ngày", value: "7days" },
  { label: "30 ngày", value: "30days" },
];

/** Màu cảnh báo theo % ADS (giống trang báo cáo ngày). */
function adsPercentColor(percent) {
  const p = Number(percent) || 0;
  if (p <= 0) return "default";
  if (p < 30) return "#52c41a";
  if (p <= 35) return "#fa8c16";
  return "#cf1322";
}

/** Màu của mốc doanh số theo mức độ đạt. */
function milestoneColor(reached) {
  return reached ? "#52c41a" : "#d9d9d9";
}

/** Tính % thay đổi so với kỳ trước. */
function deltaPercent(current, previous) {
  const c = Number(current) || 0;
  const p = Number(previous) || 0;
  if (p === 0) return c === 0 ? 0 : null; // null = không có dữ liệu so sánh
  return ((c - p) / Math.abs(p)) * 100;
}

function DeltaTag({ current, previous, invert = false, suffix = "" }) {
  const pct = deltaPercent(current, previous);
  if (pct === null) {
    return (
      <Tag color="default" style={{ marginInlineEnd: 0 }}>
        Kỳ trước: 0
      </Tag>
    );
  }
  const up = pct >= 0;
  const good = invert ? !up : up;
  return (
    <Tag
      color={up ? (good ? "green" : "red") : good ? "green" : "red"}
      style={{ marginInlineEnd: 0 }}
    >
      {up ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {Math.abs(pct).toFixed(1)}%
      {suffix}
    </Tag>
  );
}

export default function MktOverviewPage() {
  return (
    <App>
      <MktOverviewContent />
    </App>
  );
}

function MktOverviewContent() {
  const router = useRouter();
  const currentUser = useSelector((state) => state.user.currentUser);

  const [period, setPeriod] = useState("month");
  const [data, setData] = useState(null);
  const [previous, setPrevious] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const position = String(currentUser?.position || "").toLowerCase();
  const isAllowed = position === "mkt" || position === "lead";

  useEffect(() => {
    if (!currentUser?.name) {
      router.push("/login");
    }
  }, [currentUser, router]);

  const fetchData = useCallback(async () => {
    if (!currentUser?.name) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        name: currentUser.name,
        period,
      });
      if (currentUser?.employee_code) {
        params.set("employeeCode", String(currentUser.employee_code));
      }
      const res = await axios.get(`/api/report/mkt-overview?${params.toString()}`);
      if (res.data?.ok) {
        setData(res.data.data);
        setPrevious(res.data.previous);
      } else {
        setError(res.data?.error || "Không lấy được dữ liệu");
      }
    } catch (err) {
      setError(err?.response?.data?.error || "Lỗi khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, [currentUser?.name, currentUser?.employee_code, period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const chartData = useMemo(() => {
    if (!data?.daily?.length) return [];
    const today = dayjs().format("YYYY-MM-DD");
    return data.daily
      .filter((d) => String(d.date || "") <= today)
      .map((d) => ({
        date: dayjs(d.date).format("DD/MM"),
        "Doanh số": Math.round((d.revenueVnd || 0) / 1000),
        "Chi phí ADS": Math.round((d.adsCost || 0) / 1000),
      }));
  }, [data]);

  // Bảng chi tiết: ngày gần nhất luôn nằm trên cùng (desc theo ngày)
  // và ẨN các ngày chưa tới (ngày > hôm nay theo giờ VN).
  const dailyRows = useMemo(() => {
    const today = dayjs().format("YYYY-MM-DD");
    const rows = [...(data?.daily || [])].filter(
      (r) => String(r.date || "") <= today,
    );
    return rows.sort((a, b) =>
      String(b.date || "").localeCompare(String(a.date || "")),
    );
  }, [data]);

  const dailyColumns = useMemo(
    () => [
      {
        title: "Ngày",
        dataIndex: "date",
        key: "date",
        width: 110,
        render: (v) => dayjs(v).format("DD/MM/YYYY"),
      },
      {
        title: "Số đơn",
        dataIndex: "orders",
        key: "orders",
        width: 90,
        align: "right",
      },
      {
        title: "Đơn DONE",
        dataIndex: "doneOrders",
        key: "doneOrders",
        width: 100,
        align: "right",
        render: (v) => (
          <Text strong style={{ color: "#52c41a" }}>
            {v ?? 0}
          </Text>
        ),
      },
      {
        title: "Đơn check",
        dataIndex: "checkOrders",
        key: "checkOrders",
        width: 100,
        align: "right",
        render: (v) => (
          <Text style={{ color: "#fa8c16" }}>{v ?? 0}</Text>
        ),
      },
      {
        title: "Doanh số",
        dataIndex: "revenueVnd",
        key: "revenueVnd",
        align: "right",
        render: (v) => (
          <Text strong style={{ color: "#d48806" }}>
            {formatVndD(v)}
          </Text>
        ),
      },
      {
        title: "Chi phí ADS",
        dataIndex: "adsCost",
        key: "adsCost",
        align: "right",
        render: (v) => formatVndD(v ?? 0),
      },
      {
        title: "% ADS",
        dataIndex: "percentAds",
        key: "percentAds",
        width: 100,
        align: "right",
        render: (v) =>
          Number(v) ? (
            <Text strong style={{ color: adsPercentColor(v) }}>
              {Number(v).toFixed(2)}%
            </Text>
          ) : (
            <Text type="secondary">—</Text>
          ),
      },
      {
        title: "Chi phí / đơn",
        dataIndex: "costPerOrder",
        key: "costPerOrder",
        width: 130,
        align: "right",
        render: (v) => (Number(v) ? formatVndD(v) : <Text type="secondary">—</Text>),
      },
    ],
    [],
  );

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <Alert type="error" showIcon message="Lỗi" description={error} />
      </div>
    );
  }

  if (!isAllowed) {
    return (
      <div style={{ padding: 24 }}>
        <Alert
          type="warning"
          showIcon
          message="Không có quyền truy cập"
          description="Trang này chỉ dành cho nhân viên MKT."
        />
      </div>
    );
  }

  const revenue = data?.revenueVnd ?? 0;
  const adsCost = data?.adsCost ?? 0;
  const percentAds = data?.percentAds ?? 0;
  const ordersCount = data?.ordersCount ?? 0;
  const costPerOrder = data?.costPerOrder ?? 0;

  return (
    <div style={{ padding: 20, maxWidth: 1400, margin: "0 auto" }}>
      {/* ===== HEADER ===== */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 18,
        }}
      >
        <div>
          <Title level={3} style={{ margin: 0 }}>
            🚀 Tổng quan cá nhân
          </Title>
        
        </div>

        <Space>
          <Segmented
            options={PERIOD_OPTIONS}
            value={period}
            onChange={(v) => setPeriod(v)}
          />
          <Tooltip title="Tính lại dữ liệu">
            <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>
              Lài mới
            </Button>
          </Tooltip>
        </Space>
      </div>

      <Spin spinning={loading}>
        {data ? (
          <>
            {/* ===== 4 CHỈ SỐ CHÍNH ===== */}
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} xl={6}>
                <Card
                  size="small"
                  style={{ borderTop: "3px solid #d48806" }}
                  title={
                    <Space>
                      <DollarOutlined style={{ color: "#d48806" }} />
                      <Text strong>Doanh số</Text>
                    </Space>
                  }
                >
                  <Statistic
                    value={revenue}
                    formatter={(v) => formatVndD(v)}
                    valueStyle={{ color: "#d48806", fontWeight: 700, fontSize: 22 }}
                  />
                  <div style={{ marginTop: 8 }}>
                    <DeltaTag current={revenue} previous={previous?.revenueVnd} />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {" "}
                      so với kỳ trước (
                      {formatCompact(previous?.revenueVnd ?? 0)})
                    </Text>
                  </div>
                </Card>
              </Col>

              <Col xs={24} sm={12} xl={6}>
                <Card
                  size="small"
                  style={{ borderTop: "3px solid #fa8c16" }}
                  title={
                    <Space>
                      <ShoppingCartOutlined style={{ color: "#fa8c16" }} />
                      <Text strong>Số đơn</Text>
                    </Space>
                  }
                >
                  <Statistic
                    value={ordersCount}
                    suffix="đơn"
                    valueStyle={{ color: "#fa8c16", fontWeight: 700 }}
                  />
                  <div style={{ marginTop: 8 }}>
                    <Space size={4}>
                      <Tag color="success" style={{ marginInlineEnd: 0 }}>
                        DONE: {data?.ordersDoneCount ?? 0}
                      </Tag>
                      <Tag color="warning" style={{ marginInlineEnd: 0 }}>
                        Check: {data?.ordersCheckCount ?? 0}
                      </Tag>
                    </Space>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <DeltaTag current={ordersCount} previous={previous?.ordersCount} />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {" "}
                      so với kỳ trước ({previous?.ordersCount ?? 0} đơn)
                    </Text>
                  </div>
                </Card>
              </Col>

              <Col xs={24} sm={12} xl={6}>
                <Card
                  size="small"
                  style={{ borderTop: "3px solid #1677ff" }}
                  title={
                    <Space>
                      <ThunderboltOutlined style={{ color: "#1677ff" }} />
                      <Text strong>Chi phí ADS</Text>
                    </Space>
                  }
                >
                  <Statistic
                    value={adsCost}
                    formatter={(v) => formatVndD(v)}
                    valueStyle={{ color: "#1677ff", fontWeight: 700 }}
                  />
                  <div style={{ marginTop: 8 }}>
                    <DeltaTag
                      current={adsCost}
                      previous={previous?.adsCost}
                      invert
                    />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {" "}
                      so với kỳ trước ({formatCompact(previous?.adsCost ?? 0)})
                    </Text>
                  </div>
                </Card>
              </Col>

              <Col xs={24} sm={12} xl={6}>
                <Card
                  size="small"
                  style={{ borderTop: "3px solid #13c2c2" }}
                  title={
                    <Space>
                      <PercentageOutlined style={{ color: "#13c2c2" }} />
                      <Text strong>% ADS</Text>
                    </Space>
                  }
                >
                  <Statistic
                    value={percentAds}
                    suffix="%"
                    precision={2}
                    valueStyle={{
                      color: adsPercentColor(percentAds),
                      fontWeight: 700,
                    }}
                  />
                  <div style={{ marginTop: 8 }}>
                    <DeltaTag
                      current={percentAds}
                      previous={previous?.percentAds}
                      invert
                    />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {" "}
                      kỳ trước:{" "}
                      {previous ? `${Number(previous.percentAds).toFixed(2)}%` : "—"}
                    </Text>
                  </div>
                </Card>
              </Col>

              <Col xs={24} sm={12} xl={6}>
                <Card
                  size="small"
                  style={{ borderTop: "3px solid #eb2f96" }}
                  title={
                    <Space>
                      <MoneyCollectOutlined style={{ color: "#eb2f96" }} />
                      <Text strong>Chi phí / 1 đơn</Text>
                    </Space>
                  }
                >
                  <Statistic
                    value={costPerOrder}
                    formatter={(v) => formatVndD(v)}
                    valueStyle={{ color: "#eb2f96", fontWeight: 700 }}
                  />
                  <div style={{ marginTop: 8 }}>
                    <DeltaTag
                      current={costPerOrder}
                      previous={previous?.costPerOrder}
                      invert
                    />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {" "}
                      kỳ trước: {formatCompact(previous?.costPerOrder ?? 0)}/đơn
                    </Text>
                  </div>
                </Card>
              </Col>
            </Row>

            {/* ===== TIẾN ĐỘ MỐC DOANH SỐ ===== */}
            <Title level={4} style={{ marginTop: 24 }}>
              🏁 Tiến độ đạt mốc doanh số
            </Title>
            <Card size="small">
              <Row gutter={[16, 12]}>
                {(data.milestones || []).map((m) => (
                  <Col xs={24} sm={12} lg={8} xl={4} key={m.value}>
                    <div
                      style={{
                        padding: 12,
                        borderRadius: 10,
                        border: `1px solid ${
                          m.reached ? "#b7eb8f" : "#f0f0f0"
                        }`,
                        background: m.reached ? "#f6ffed" : "#fafafa",
                        height: "100%",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 6,
                        }}
                      >
                        <Text strong>{m.label}</Text>
                        {m.reached ? (
                          <Tag color="success" style={{ marginInlineEnd: 0 }}>
                            Đạt
                          </Tag>
                        ) : (
                          <Tag style={{ marginInlineEnd: 0 }}>
                            Còn {formatCompact(m.remaining)}
                          </Tag>
                        )}
                      </div>
                      <Progress
                        percent={m.percent}
                        strokeColor={milestoneColor(m.reached)}
                        format={(p) => `${Number(p).toFixed(0)}%`}
                        size="small"
                      />
                    </div>
                  </Col>
                ))}
              </Row>

              <div style={{ marginTop: 14 }}>
                {data.highestReached ? (
                  <Tag color="success" style={{ fontSize: 13, padding: "4px 10px" }}>
                    <TrophyOutlined /> Đã đạt mốc cao nhất: {data.highestReached.label}
                  </Tag>
                ) : (
                  <Tag style={{ fontSize: 13, padding: "4px 10px" }}>
                    Chưa đạt mốc nào
                  </Tag>
                )}
                {data.nextMilestone && (
                  <Tag color="processing" style={{ fontSize: 13, padding: "4px 10px" }}>
                    Mốc tiếp theo: {data.nextMilestone.label} — cần thêm{" "}
                    {formatCompact(data.nextMilestone.remaining)} (
                    {data.nextMilestone.percent.toFixed(2)}%)
                  </Tag>
                )}
              </div>
            </Card>

            {/* ===== BIỂU ĐỒ THEO NGÀY ===== */}
            {chartData.length > 0 && (
              <>
                <Title level={4} style={{ marginTop: 24 }}>
                  📈 Biểu đồ theo ngày
                </Title>
                <Card size="small">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" fontSize={11} />
                      <YAxis fontSize={11} />
                      <ChartTooltip
                        formatter={(v, name) => [`${formatVndD(v * 1000)}`, name]}
                      />
                      <Legend />
                      <Bar
                        dataKey="Doanh số"
                        fill="#faad14"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="Chi phí ADS"
                        fill="#1677ff"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Đơn vị: nghìn đồng (KRW → VND tỷ giá 17.000, × 0.95)
                  </Text>
                </Card>
              </>
            )}

            {/* ===== BẢNG CHI TIẾT ===== */}
            <Title level={4} style={{ marginTop: 24 }}>
              📋 Chi tiết theo ngày
            </Title>
            <Card size="small">
              <Table
                size="small"
                rowKey="date"
                columns={dailyColumns}
                dataSource={dailyRows}
                pagination={{ pageSize: 40, size: "small" }}
                scroll={{ x: 900 }}
                locale={{ emptyText: "Không có dữ liệu" }}
                summary={(rows) => {
                  const totalRev = rows.reduce((s, r) => s + (r.revenueVnd || 0), 0);
                  const totalAds = rows.reduce((s, r) => s + (r.adsCost || 0), 0);
                  const totalOrd = rows.reduce((s, r) => s + (r.orders || 0), 0);
                  const totalDone = rows.reduce(
                    (s, r) => s + (r.doneOrders || 0),
                    0,
                  );
                  const totalCheck = rows.reduce(
                    (s, r) => s + (r.checkOrders || 0),
                    0,
                  );
                  return (
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0}>
                        <Text strong>Tổng</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="right">
                        <Text strong>{totalOrd}</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={2} align="right">
                        <Text strong style={{ color: "#52c41a" }}>
                          {totalDone}
                        </Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={3} align="right">
                        <Text strong style={{ color: "#fa8c16" }}>
                          {totalCheck}
                        </Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={4} align="right">
                        <Text strong style={{ color: "#d48806" }}>
                          {formatVndD(totalRev)}
                        </Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={5} align="right">
                        <Text strong>{formatVndD(totalAds)}</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={6} align="right">
                        <Text strong style={{ color: adsPercentColor(0) }}>
                          {totalRev > 0
                            ? `${((totalAds / totalRev) * 100).toFixed(2)}%`
                            : "—"}
                        </Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={7} align="right">
                        <Text strong>
                          {totalOrd > 0
                            ? formatVndD(Math.round(totalAds / totalOrd))
                            : "—"}
                        </Text>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  );
                }}
              />
            </Card>

            <Card size="small" style={{ marginTop: 16 }}>
              <Space wrap size="large">
                <Text type="secondary">
                  <CalendarOutlined /> Kỳ: {data.period.label} (
                  {dayjs(data.period.start).format("DD/MM/YYYY")} →{" "}
                  {dayjs(data.period.end).format("DD/MM/YYYY")})
                </Text>
                <Text type="secondary">
                  Doanh số gộp (chưa ×0.95): {formatVndD(data.grossRevenueVnd)}
                </Text>
                <Text type="secondary">
                  Tổng giá trị đơn: {formatVndD(data.orderValueVnd ?? 0)}
                </Text>
                <Text type="secondary">
                  Lợi nhuận sau ADS: {formatVndD(data.profitAfterAds)}
                </Text>
              </Space>
            </Card>
          </>
        ) : (
          <div style={{ height: 300, display: "grid", placeItems: "center" }}>
            <Text type="secondary">Đang tải dữ liệu...</Text>
          </div>
        )}
      </Spin>
    </div>
  );
}
