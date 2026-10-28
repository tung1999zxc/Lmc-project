"use client";

// ============================================================================
// TRANG BÁO CÁO NGÀY
// ----------------------------------------------------------------------------
// Hiển thị 6 chỉ số:
//   1. Tổng doanh số team DIEN / PHI (MKT)
//   2. MKT cao nhất (2 người mỗi team)
//   3. MKT thấp nhất (2 người mỗi team)
//   4. Số page mới đổ lên hôm nay
//   5. Tổng mess mới hôm nay (tổng newMess của tất cả nhân viên sale)
//   6. Doanh số sale nhập đơn cao nhất / thấp nhất
//
// Dữ liệu lấy từ GET /api/report/daily (đã cache server-side).
// Nút "Gửi Telegram" gọi lại API với ?send=1.
// ============================================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  App,
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Empty,
  Row,
  Space,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
  Spin,
} from "antd";
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  FileTextOutlined,
  MessageOutlined,
  PercentageOutlined,
  ReloadOutlined,
  SendOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  TrophyOutlined,
  TruckOutlined,
} from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";

const { Title, Text } = Typography;

const TEAMS = [
  { key: "DIEN", label: "TEAM DIỆN", color: "#1677ff" },
  { key: "PHI", label: "TEAM PHI", color: "#52c41a" },
];

const formatVnd = (v) => Math.round(Number(v) || 0).toLocaleString("vi-VN");
const formatVndD = (v) => `${formatVnd(v)} đ`;

function RankList({ rows, emptyText = "Không có dữ liệu" }) {
  if (!rows || rows.length === 0) {
    return (
      <Text type="secondary" style={{ fontSize: 13 }}>
        {emptyText}
      </Text>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {rows.map((r, i) => (
        <div
          key={`${r.name}-${i}`}
          style={{
            padding: "6px 10px",
            borderRadius: 8,
            background: i === 0 ? "rgba(22,119,255,0.08)" : "rgba(0,0,0,0.03)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                minWidth: 0,
              }}
            >
              <Tag
                color={i === 0 ? "blue" : "default"}
                style={{ marginInlineEnd: 0, fontWeight: 700 }}
              >
                {i + 1}
              </Tag>
              <Text strong ellipsis style={{ maxWidth: 220 }}>
                {r.name}
              </Text>
              <Text type="secondary" style={{ fontSize: 12, flexShrink: 0 }}>
                {r.orders} đơn
              </Text>
            </div>
            <Text strong style={{ color: "#d48806", flexShrink: 0 }}>
              {formatVndD(r.revenueVnd)}
            </Text>
          </div>
          <AdsInfo adsCost={r.adsCost} percentAds={r.percentAds} />
        </div>
      ))}
    </div>
  );
}

/** Màu cảnh báo theo % ADS (giống quy tắc đang dùng ở trang mkt). */
function adsPercentColor(percent) {
  const p = Number(percent) || 0;
  if (p <= 0) return "default";
  if (p < 30) return "#52c41a";
  if (p <= 35) return "#fa8c16";
  return "#cf1322";
}

/** Hiển thị 1 dòng: chi phí ADS + % ADS. */
function AdsInfo({ adsCost, percentAds }) {
  const hasAds = Number(adsCost) > 0;
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        marginTop: 6,
      }}
    >
      <Text type="secondary" style={{ fontSize: 12 }}>
        Chi phí ADS
      </Text>
      <span>
        <Text strong style={{ fontSize: 12, flexShrink: 0 }}>
          {formatVndD(adsCost ?? 0)}
        </Text>
        <Text
          strong
          style={{ fontSize: 12, marginLeft: 8, color: adsPercentColor(percentAds) }}
        >
          {hasAds ? `${(Number(percentAds) || 0).toFixed(2)}%` : "—"}
        </Text>
      </span>
    </div>
  );
}

export default function DailyReportPage() {
  return (
    // Bọc trong <App> để App.useApp() (message/notification) hoạt động đúng
    // với antd v5 + React 19.
    <App>
      <DailyReportContent />
    </App>
  );
}

function DailyReportContent() {
  const router = useRouter();
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.user.currentUser);
  // Hook của antd App -> message/notification gắn đúng context, hiển thị chắc chắn
  const { message, notification } = App.useApp();

  const [date, setDate] = useState(dayjs());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [telegramInfo, setTelegramInfo] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentUser?.name) {
      router.push("/login");
    }
  }, [currentUser, router]);

  const fetchReport = useCallback(
    async (force = false) => {
      setLoading(true);
      setError(null);
      try {
        const dateStr = date.format("YYYY-MM-DD");
        const res = await axios.get(
          `/api/report/daily?date=${dateStr}${force ? "&force=1" : ""}`,
        );
        if (res.data?.ok) {
          setData(res.data.data);
          // API không trả telegram khi không có send=1 -> luôn reset để không
          // hiển thị thông báo của ngày trước.
          setTelegramInfo(res.data.telegram || null);
        } else {
          setError(res.data?.error || "Không lấy được dữ liệu");
        }
      } catch (err) {
        setError(err?.response?.data?.error || "Lỗi khi tải báo cáo");
      } finally {
        setLoading(false);
      }
    },
    [date],
  );

  useEffect(() => {
    fetchReport(false);
  }, [fetchReport]);

  const handleSendTelegram = useCallback(async () => {
    setSending(true);
    try {
      const dateStr = date.format("YYYY-MM-DD");
      const res = await axios.get(`/api/report/daily?date=${dateStr}&send=1`);
      if (!res.data?.ok) {
        message.error(res.data?.error || "Gửi Telegram thất bại");
        return;
      }

      const tg = res.data.telegram;
      setTelegramInfo(tg);

      if (tg?.sent) {
        const chatCount = tg.chatCount ?? 0;
        const failedCount = tg.failedCount ?? 0;
        if (failedCount > 0) {
          // Một phần gửi thành công -> cảnh báo kèm chi tiết lỗi
          notification.warning({
            message: "Đã gửi Telegram (một phần)",
            description:
              `Gửi thành công tới ${chatCount} chat. ` +
              `Không gửi được ${failedCount} chat: ` +
              (tg.errors || [])
                .map((e) => `${e.chatId} (${e.error})`)
                .join(", "),
            duration: 8,
          });
        } else {
          notification.success({
            message: "Đã gửi báo cáo Telegram",
            description:
              `Báo cáo ngày ${date.format("DD/MM/YYYY")}` +
              (chatCount > 1
                ? ` đã gửi tới ${chatCount} chat.`
                : " đã được gửi."),
            duration: 5,
          });
        }
      } else if (tg?.error) {
        message.error(`Gửi Telegram thất bại: ${tg.error}`);
      }
    } catch (err) {
      const detail =
        err?.response?.data?.error ||
        err?.response?.data?.detail ||
        err?.message;
      message.error(`Gửi Telegram thất bại: ${detail}`);
    } finally {
      setSending(false);
    }
  }, [date, message, notification]);

  const mktColumns = useMemo(
    () => [
      {
        title: "Nhân viên MKT",
        dataIndex: "name",
        key: "name",
        render: (v, r) => (
          <Space size={6}>
            <Text strong>{v}</Text>
            <Tag
              color={
                r.team_tp === "DIEN"
                  ? "blue"
                  : r.team_tp === "PHI"
                    ? "green"
                    : "default"
              }
            >
              {r.team_tp}
            </Tag>
            {r.position === "lead" && <Tag color="gold">Lead</Tag>}
            {r.position === "managerMKT" && <Tag color="purple">Manager</Tag>}
            {r.position === "admin" && <Tag color="magenta">Admin</Tag>}
          </Space>
        ),
      },
      {
        title: "Số đơn",
        dataIndex: "orders",
        key: "orders",
        width: 90,
        align: "right",
      },
      {
        title: "Doanh số",
        dataIndex: "revenueVnd",
        key: "revenueVnd",
        width: 170,
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
        width: 140,
        align: "right",
        render: (v) => formatVndD(v ?? 0),
      },
      {
        title: "% ADS",
        dataIndex: "percentAds",
        key: "percentAds",
        width: 100,
        align: "right",
        render: (v) => {
          if (!v) return <Text type="secondary">—</Text>;
          return (
            <Text strong style={{ color: adsPercentColor(v) }}>
              {Number(v).toFixed(2)}%
            </Text>
          );
        },
      },
    ],
    [],
  );

  const saleColumns = useMemo(
    () => [
      { title: "Nhân viên sale", dataIndex: "name", key: "name" },
      {
        title: "Số đơn",
        dataIndex: "orders",
        key: "orders",
        width: 90,
        align: "right",
      },
      {
        title: "Doanh số",
        dataIndex: "revenueVnd",
        key: "revenueVnd",
        width: 170,
        align: "right",
        render: (v) => (
          <Text strong style={{ color: "#d48806" }}>
            {formatVndD(v)}
          </Text>
        ),
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

  return (
    <div style={{ padding: 20, maxWidth: 1400, margin: "0 auto" }}>
      {/* Header */}
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
            📊 Báo cáo ngày
          </Title>
          <Text type="secondary">
            {data
              ? `Ngày ${data.dateLabel} · Tỷ giá ${formatVnd(
                  data.exchangeRate,
                )} · tính trong ${data.elapsedMs}ms`
              : "Đang tải dữ liệu..."}
          </Text>
        </div>

        <Space wrap>
          <DatePicker
            value={date}
            onChange={(d) => d && setDate(d)}
            allowClear={false}
            format="DD/MM/YYYY"
            disabledDate={(d) => d && d.isAfter(dayjs(), "day")}
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={() => fetchReport(true)}
            loading={loading}
          >
            Tính lại
          </Button>
          <Tooltip
            title={`Gửi báo cáo ngày ${date.format("DD/MM/YYYY")} ngay lập tức`}
          >
            <Button
              type="primary"
              icon={<SendOutlined />}
              loading={sending}
              onClick={() => handleSendTelegram()}
            >
              Gửi Telegram
            </Button>
          </Tooltip>
        </Space>
      </div>

      {telegramInfo?.sent && (
        <Alert
          type={telegramInfo.failedCount > 0 ? "warning" : "success"}
          showIcon
          style={{ marginBottom: 14 }}
          message={`Đã gửi Telegram lúc ${new Date(
            telegramInfo.sentAt,
          ).toLocaleString("vi-VN")}${
            telegramInfo.chatCount ? ` · ${telegramInfo.chatCount} chat` : ""
          }`}
          description={
            telegramInfo.failedCount > 0
              ? `Không gửi được tới ${telegramInfo.failedCount} chat: ${(
                  telegramInfo.errors || []
                )
                  .map((e) => `${e.chatId} (${e.error})`)
                  .join(", ")}`
              : undefined
          }
        />
      )}
      {telegramInfo?.error && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 14 }}
          message="Không gửi được Telegram"
          description={telegramInfo.error}
        />
      )}

      <Spin spinning={loading}>
        {data ? (
          <>
            {/* ==== 1. TỔNG DOANH SỐ TEAM ==== */}
            <Title level={4} style={{ marginTop: 4 }}>
              💰 Tổng doanh số MKT
            </Title>
            <Row gutter={[16, 16]}>
              {TEAMS.map((t) => (
                <Col xs={24} sm={12} lg={8} key={t.key}>
                  <Card
                    size="small"
                    style={{ borderTop: `3px solid ${t.color}` }}
                    title={
                      <Space>
                        <TeamOutlined style={{ color: t.color }} />
                        <Text strong>{t.label}</Text>
                      </Space>
                    }
                  >
                    <Statistic
                      value={data.mktTeams[t.key].revenueVnd}
                      formatter={(v) => formatVndD(v)}
                      valueStyle={{ color: "#d48806", fontWeight: 700 }}
                    />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {data.mktRankInfo[t.key]} nhân viên có phát sinh đơn
                    </Text>
                    <AdsInfo
                      adsCost={data.mktTeams[t.key].adsCost}
                      percentAds={data.mktTeams[t.key].percentAds}
                    />
                  </Card>
                </Col>
              ))}
            </Row>

            {/* ==== 2 & 3. XẾP HẠNG MKT ==== */}
            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
              {TEAMS.map((t) => (
                <Col xs={24} lg={12} key={t.key}>
                  <Card
                    size="small"
                    title={
                      <Space>
                        <TrophyOutlined style={{ color: "#faad14" }} />
                        <Text strong>{t.label} - Cao nhất</Text>
                      </Space>
                    }
                  >
                    <RankList rows={data.mktTop[t.key]} />
                  </Card>
                </Col>
              ))}
              {TEAMS.map((t) => (
                <Col xs={24} lg={12} key={`${t.key}-bottom`}>
                  <Card
                    size="small"
                    title={
                      <Space>
                        <ArrowDownOutlined style={{ color: "#cf1322" }} />
                        <Text strong>{t.label} - Thấp nhất</Text>
                      </Space>
                    }
                  >
                    <RankList rows={data.mktBottom[t.key]} />
                  </Card>
                </Col>
              ))}
            </Row>

            {/* ==== 4 & 5. PAGE + MESS ==== */}
            <Title level={4} style={{ marginTop: 24 }}>
              📄 Page &amp; Tin nhắn
            </Title>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} lg={8}>
                <Card
                  size="small"
                  title={
                    <Space>
                      <FileTextOutlined />
                      <Text strong>Page mới hôm nay</Text>
                    </Space>
                  }
                >
                  <Statistic
                    value={data.pageNewCount}
                    suffix="page"
                    valueStyle={{ color: "#1677ff", fontWeight: 700 }}
                  />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Trong đó {data.pageNewActiveCount} page đang active
                  </Text>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={8}>
                <Card
                  size="small"
                  title={
                    <Space>
                      <PercentageOutlined />
                      <Text strong>Tỉ lệ chốt</Text>
                    </Space>
                  }
                >
                  <Statistic
                    value={
                      data.newMessTotal > 0
                        ? Number(
                            (
                              ((data.newOrdersCount ?? 0) /
                                data.newMessTotal) *
                              100
                            ).toFixed(2),
                          )
                        : 0
                    }
                    suffix="%"
                    precision={2}
                    valueStyle={{ color: "#eb2f96", fontWeight: 700 }}
                  />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {data.newOrdersCount ?? 0} đơn / {data.newMessTotal ?? 0} mess
                  </Text>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={8}>
                <Card
                  size="small"
                  title={
                    <Space>
                      <ShoppingCartOutlined />
                      <Text strong>Đơn mới hôm nay</Text>
                    </Space>
                  }
                >
                  <Statistic
                    value={data.newOrdersCount ?? 0}
                    suffix="đơn"
                    valueStyle={{ color: "#fa8c16", fontWeight: 700 }}
                  />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Được tạo trong ngày {data.dateLabel}
                  </Text>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={8}>
                <Card
                  size="small"
                  title={
                    <Space>
                      <MessageOutlined />
                      <Text strong>Tổng mess mới</Text>
                    </Space>
                  }
                >
                  <Statistic
                    value={data.newMessTotal}
                    suffix="tin nhắn"
                    valueStyle={{ color: "#13c2c2", fontWeight: 700 }}
                  />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Từ {data.newMessRecords} bản ghi của nhân viên sale
                  </Text>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={8}>
                <Card
                  size="small"
                  title={
                    <Space>
                      <TruckOutlined />
                      <Text strong>Đơn đã gửi hàng hôm nay</Text>
                    </Space>
                  }
                >
                  <Statistic
                    value={data.shippedOrdersCount ?? 0}
                    suffix="đơn"
                    valueStyle={{ color: "#722ed1", fontWeight: 700 }}
                  />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Theo ngày gửi hàng (shippingDate1) {data.dateLabel}
                  </Text>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={8}>
                <Card
                  size="small"
                  title={
                    <Space>
                      <ArrowUpOutlined />
                      <Text strong>Sale nhập đơn cao nhất</Text>
                    </Space>
                  }
                >
                  {data.saleTop[0] ? (
                    <Statistic
                      value={data.saleTop[0].revenueVnd}
                      formatter={(v) => formatVndD(v)}
                      valueStyle={{ color: "#d48806", fontWeight: 700 }}
                    />
                  ) : (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="Không có dữ liệu"
                    />
                  )}
                  {data.saleTop[0] && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {data.saleTop[0].name} · {data.saleTop[0].orders} đơn
                    </Text>
                  )}
                </Card>
              </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
              <Col xs={24} lg={12}>
                <Card
                  size="small"
                  title={
                    <Space>
                      <ArrowUpOutlined />
                      <Text strong>Sale nhập đơn - Cao nhất</Text>
                    </Space>
                  }
                >
                  <RankList rows={data.saleTop} />
                </Card>
              </Col>
              <Col xs={24} lg={12}>
                <Card
                  size="small"
                  title={
                    <Space>
                      <ArrowDownOutlined />
                      <Text strong>Sale nhập đơn - Thấp nhất</Text>
                    </Space>
                  }
                >
                  <RankList rows={data.saleBottom} />
                </Card>
              </Col>
            </Row>

            {/* ==== BẢNG CHI TIẾT ==== */}
            <Title level={4} style={{ marginTop: 24 }}>
              📋 Chi tiết
            </Title>
            <Row gutter={[16, 16]}>
              <Col xs={24} xl={12}>
                <Card
                  size="small"
                  title={<Text strong>Doanh số MKT theo nhân viên</Text>}
                >
                  <Table
                    size="small"
                    rowKey={(r) => r.name}
                    columns={mktColumns}
                    dataSource={data.mktList}
                    pagination={false}
                    scroll={{ y: 320 }}
                    locale={{ emptyText: "Không có dữ liệu" }}
                  />
                </Card>
              </Col>
              <Col xs={24} xl={12}>
                <Card
                  size="small"
                  title={<Text strong>Doanh số sale nhập đơn</Text>}
                >
                  <Table
                    size="small"
                    rowKey={(r) => r.name}
                    columns={saleColumns}
                    dataSource={data.saleList}
                    pagination={false}
                    scroll={{ y: 320 }}
                    locale={{ emptyText: "Không có dữ liệu" }}
                  />
                </Card>
              </Col>
            </Row>

            <Card size="small" style={{ marginTop: 16 }}>
              <Descriptions size="small" column={4} bordered>
                <Descriptions.Item label="Tổng đơn trong ngày">
                  {data.meta.orderCount}
                </Descriptions.Item>
                <Descriptions.Item label="Đơn mới tạo hôm nay">
                  {data.newOrdersCount ?? 0}
                </Descriptions.Item>
                <Descriptions.Item label="NV trong hệ thống">
                  {data.meta.employeeCount}
                </Descriptions.Item>
                <Descriptions.Item label="Đơn MKT không khớp NV">
                  {data.meta.unmatchedMktOrders}
                </Descriptions.Item>
                <Descriptions.Item label="Đơn sale không khớp NV">
                  {data.meta.unmatchedSaleOrders}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </>
        ) : (
          <div style={{ height: 300, display: "grid", placeItems: "center" }}>
            <Empty description="Chưa có dữ liệu" />
          </div>
        )}
      </Spin>
    </div>
  );
}
