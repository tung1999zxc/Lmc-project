"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import FullScreenLoading from "./FullScreenLoading";

import {
  Form,
  Input,
  DatePicker,
  Select,
  Button,
  Row,
  Popover,
  Checkbox,
  Table,
  Tag,
  Col,
  Modal,
  Space,
  Upload,
  Image,
  message,
} from "antd";
import {
  MinusCircleOutlined,
  ReloadOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import moment from "moment";
import { useDispatch, useSelector } from "react-redux";

const OrderForm = ({
  open,
  onCancel,
  loading,
  onSubmit,
  resetPagename,
  initialValues,
  namesalexuly,
  employees = [],
  dataPagename = [],
  onProductsChange,
  scoreOrderExternal,
  onCancelScore,
}) => {
  const [form] = Form.useForm();
  const { Option } = Select;
  const currentUser = useSelector((state) => state.user.currentUser);
  // Giả sử: nếu mã nhân viên là 1 thì isEmployee1 = true

  const SCORE_ITEMS = [
    { key: "ckt50", label: "CKT 50% doanh số", points: 40 },
    { key: "ckt10", label: "CKT 10 -> 35k doanh số", points: 30 },
    { key: "addFb", label: "ADD FB", points: 20 },
    { key: "dataImgFb", label: "Dữ liệu ảnh + link FB bạn bè", points: 10 },
    { key: "nhanSim", label: "Nhắn sim khách có xác nhận", points: 20 },
    { key: "nhietTinh", label: "Nhiệt tình, rep nhanh, hợp tác", points: 10 },
  ];

  const [scoreModalVisible, setScoreModalVisible] = useState(false);
  const [scoreOrder, setScoreOrder] = useState(null);
  const [scoreChecked, setScoreChecked] = useState({});
  // Mỗi item là { kind: "cloudinary", url } hoặc { kind: "new", file, preview }
  const [scoreImageList, setScoreImageList] = useState([]);
  const [scoreUploading, setScoreUploading] = useState(false);
  const [scoreSaving, setScoreSaving] = useState(false);
  // "view": chỉ xem (từ OrderList), "edit": chỉnh sửa (từ modal khách)
  const [scoreMode, setScoreMode] = useState("edit");

  // Auto-open modal khi có order được truyền từ ngoài (OrderList)
  useEffect(() => {
    if (scoreOrderExternal) {
      setScoreOrder(scoreOrderExternal);
      setScoreMode("view");
      const initial = {};
      SCORE_ITEMS.forEach((item) => {
        initial[item.key] = false;
      });
      const savedItems = Array.isArray(scoreOrderExternal?.scoreItems)
        ? scoreOrderExternal.scoreItems
        : [];
      savedItems.forEach((key) => {
        if (initial.hasOwnProperty(key)) initial[key] = true;
      });
      setScoreChecked(initial);
      const savedUrls = Array.isArray(scoreOrderExternal?.scoreImages)
        ? scoreOrderExternal.scoreImages
        : [];
      setScoreImageList(
        savedUrls.map((url) => ({
          kind: "cloudinary",
          url,
          uid: url,
        })),
      );
      setScoreModalVisible(true);
    }
  }, [scoreOrderExternal]);

  const handleScoreModalClose = () => {
    setScoreModalVisible(false);
    setScoreOrder(null);
    setScoreChecked({});
    setScoreImageList([]);
    setScoreMode("edit");
    if (onCancelScore) onCancelScore();
  };

  const computeScore = (checked) => {
    const total = SCORE_ITEMS.reduce((sum, item) => {
      return sum + (checked?.[item.key] ? item.points : 0);
    }, 0);
    if (total < 50) return 50;
    return 70;
  };

  const scoreTotalRaw = SCORE_ITEMS.reduce((sum, item) => {
    return sum + (scoreChecked[item.key] ? item.points : 0);
  }, 0);
  const scoreFinal = computeScore(scoreChecked);

  const openScoreModal = (record) => {
    let orderRecord = record;
    if (!orderRecord && initialValues?.id) {
      const liveValues = form.getFieldsValue(true);
      orderRecord = {
        ...initialValues,
        ...liveValues,
      };
    }
    setScoreOrder(orderRecord);
    const initial = {};
    SCORE_ITEMS.forEach((item) => {
      initial[item.key] = false;
    });
    const savedItems = Array.isArray(orderRecord?.scoreItems)
      ? orderRecord.scoreItems
      : [];
    savedItems.forEach((key) => {
      if (initial.hasOwnProperty(key)) initial[key] = true;
    });
    setScoreChecked(initial);
    const savedUrls = Array.isArray(orderRecord?.scoreImages)
      ? orderRecord.scoreImages
      : [];
    setScoreImageList(
      savedUrls.map((url) => ({ kind: "cloudinary", url, uid: url })),
    );
    setScoreModalVisible(true);
  };

  const handleSaveScore = async () => {
    if (!scoreOrder?.id) {
      message.error("Không tìm thấy đơn hàng để lưu điểm");
      return;
    }
    setScoreSaving(true);
    try {
      const newItems = scoreImageList.filter((i) => i.kind === "new");
      const cloudinaryItems = scoreImageList.filter(
        (i) => i.kind === "cloudinary",
      );
      const cloudinaryUrls = cloudinaryItems.map((i) => i.url);

      let uploadedUrls = [];
      if (newItems.length > 0) {
        setScoreUploading(true);
        const uploadPromises = newItems.map(async (item) => {
          const formData = new FormData();
          formData.append("files", item.file);
          const res = await axios.post("/api/upload/cloudinary", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          return res.data.urls[0]?.url;
        });
        const results = await Promise.all(uploadPromises);
        uploadedUrls = results.filter(Boolean);
        setScoreUploading(false);
      }

      const finalUrls = [...cloudinaryUrls, ...uploadedUrls];
      const checkedKeys = Object.keys(scoreChecked).filter(
        (k) => scoreChecked[k],
      );
      await axios.put(`/api/orders/${scoreOrder.id}`, {
        scorePoints: scoreFinal,
        scoreItems: checkedKeys,
        scoreImages: finalUrls,
      });

      // cập nhật lại danh sách đơn trong modal khách
      setModalCustomerOrders((prev) =>
        prev.map((o) =>
          o.id === scoreOrder.id
            ? {
                ...o,
                scorePoints: scoreFinal,
                scoreItems: checkedKeys,
                scoreImages: finalUrls,
              }
            : o,
        ),
      );

      message.success("Đã lưu điểm đơn hàng");
      setScoreModalVisible(false);
      setScoreOrder(null);
      setScoreChecked({});
      setScoreImageList([]);
    } catch (err) {
      console.error(err);
      message.error(
        err?.response?.data?.error || "Lỗi khi lưu điểm đơn hàng",
      );
    } finally {
      setScoreSaving(false);
      setScoreUploading(false);
    }
  };

  const [loading2, setLoading2] = useState(false);
  const [checkingAddress, setCheckingAddress] = useState(false);
  const [addressCheck, setAddressCheck] = useState(null);

  const revenue = Form.useWatch("revenue", form);
  const saleReport = Form.useWatch("saleReport", form);

  const orderDate6 = Form.useWatch("orderDate6", form);
  const orderDate5 = Form.useWatch("orderDate5", form);

  useEffect(() => {
    const numericProfit = Number(revenue); // chuyển về số
    if (numericProfit === 0) {
      if (!orderDate5) {
        form.setFieldsValue({
          orderDate5: dayjs(),
        });
      }
    } else {
      form.setFieldsValue({
        orderDate5: null,
      });
    }
  }, [revenue]);

  useEffect(() => {
    if (saleReport === "DONE") {
      // ✅ Chỉ set ngày DONE nếu CHƯA có
      if (!orderDate6) {
        form.setFieldsValue({
          orderDate6: dayjs(),
        });
      }
    } else {
      form.setFieldsValue({
        orderDate6: null,
      });
    }
  }, [saleReport]);

  // Danh sách options
  const [products2, setProducts] = useState([]);
  useEffect(() => {
    if (onProductsChange) {
      onProductsChange(products2);
    }
  }, [products2]);
  const [employeeNamepage, setEmployeeNamepage] = useState("");
  const [modalCustomerOrders, setModalCustomerOrders] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState([]);

  const handleColumnSelect = (key, checked) => {
    setSelectedColumns((prev) =>
      checked ? [...new Set([...prev, key])] : prev.filter((k) => k !== key),
    );
  };

  const products = products2.filter((p) => p.status === true);
  const handleSearchCustomerModal = async (name) => {
    try {
      const res = await axios.get(
        `/api/orders/search-by-customer?name=${encodeURIComponent(name)}`,
      );
      setModalCustomerOrders(res.data.data || []);
      setModalVisible(true);
    } catch (err) {
      console.error(err);
      message.error("Không thể tìm đơn khách hàng");
    }
  };

  const fetchProducts = async () => {
    setLoading2(true);
    try {
      const response = await axios.get("/api/products");
      setProducts(response.data.data);
      setLoading2(false);
    } catch (error) {
      console.error(error);
      message.error("Lỗi khi lấy danh sách sản phẩm");
      setLoading2(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);
  const mktOptions = employees
    .filter((order) => order.position_team === "mkt")
    .map((order) => order.name);

  // Tạo mapping từ tên page (đã trim) sang nhân viên phụ trách (mkt)
  // const pageMapping = dataPagename.reduce((acc, item) => {
  //   const key = item.pageName.trim();
  //   if (!acc[key]) {
  //     acc[key] = item.employee;
  //   }
  //   return acc;
  // }, {});
  const usedEmployees = new Set();
  const pageMapping = dataPagename.reduce((acc, item) => {
    const key = item.pageName.trim();

    if (!acc[key]) {
      acc[key] = [];
    }

    // Chỉ thêm employee nếu nó chưa được sử dụng ở bất kỳ pageName nào
    if (!usedEmployees.has(item.employee)) {
      acc[key].push(item.employee);
      usedEmployees.add(item.employee);
    }

    return acc;
  }, {});
  // Hàm xử lý khi người dùng chọn tên page từ Select
  const handlePageNameChange = (value) => {
    // Đảm bảo value được trim để khớp với mapping
    const trimmedValue = value.trim();
    const mappedEmployeeArr = pageMapping[trimmedValue] || [];
    const mappedEmployee =
      mappedEmployeeArr.length > 0 ? mappedEmployeeArr[0] : "";
    setEmployeeNamepage(mappedEmployee);
    form.setFieldsValue({ mkt: mappedEmployee });
  };
  // Nếu có mapping, tự động cập nhật tên nhân viên tương ứng
  const handleTTXLOptions = [
    "THIẾU/SAI",
    "KHO SAI",
    "SALE SAI",
    "TÌM HÀNG",
    "LỖI SP",
    "CHẶN KHÁCH",
    "BOOK ĐƠN",
    "GỬI LẠI",
    "MUA LẠI",
    "HẸN",
    "ĐỢI GỬI LẠI",
    "ĐỔI Đ.CHỈ",
    "HOÀN",
    "S.BAY",
  ];

  const saleOptions = employees
    .filter((order) => order.position_team === "sale")
    .map((order) => order.name);
  const salexacnhanOptions = employees
    .filter((order) => order.position === "salexacnhan")
    .map((order) => order.name);

  const salexulyOptions = employees
    .filter((order) => order.position_team === "sale")
    .map((order) => order.name);

  const saleBaoOptions = [
    "DONE",
    "OK",
    "HỦY",
    "ĐỢI XN",
    "CHUYỂN ĐƠN",
    "BOOK TB",
    "THIẾU TT",
    "50/50",
    "NGUY CƠ",
    "BÙNG",
    "ĐANG UP",
    "CHECK",
  ];
  const massOptions = ["Nặng", "Nhẹ"];
  const thanhToanOptions = ["ĐÃ THANH TOÁN", "CHƯA THANH TOÁN"];
  const tinhTrangGHOptions = [
    "ĐÃ GỬI HÀNG",
    "GIAO THÀNH CÔNG",
    "BỊ BẮT CHỜ GỬI LẠI",
    "CHECK ĐỊA CHỈ",
  ];

  // Khi có initialValues (dữ liệu cũ) thì chuyển các trường ngày về đối tượng dayjs

  const productOptions = products.map((p) => p.name);
  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        ...initialValues,
        orderDate: initialValues.orderDate
          ? dayjs(initialValues.orderDate)
          : null,
        shippingDate1: initialValues.shippingDate1
          ? dayjs(initialValues.shippingDate1)
          : null,
        shippingDate2: initialValues.shippingDate2
          ? dayjs(initialValues.shippingDate2)
          : null,
        normalizedAddress: initialValues.normalizedAddress || "",
      });
      setAddressCheck(
        initialValues.address && initialValues.normalizedAddress
          ? {
              input: String(initialValues.address).trim(),
              normalizedAddress: initialValues.normalizedAddress,
            }
          : null,
      );
    } else {
      form.resetFields();
      setAddressCheck(null);
    }
  }, [initialValues, form]);

  const handleCheckAddress = async () => {
    const address = String(form.getFieldValue("address") || "").trim();

    if (!address) {
      setAddressCheck(null);
      form.setFieldsValue({ normalizedAddress: "" });
      message.warning("Vui lòng nhập địa chỉ trước khi kiểm tra");
      return;
    }

    setCheckingAddress(true);
    try {
      const { data } = await axios.post("/api/address", { input: address });

      if (data.exists === true && data.normalizedAddress) {
        const normalizedAddress = String(data.normalizedAddress).trim();
        // Không tự ghi đè field "address" — giữ nguyên text user nhập
        form.setFieldsValue({ normalizedAddress });
        setAddressCheck({ input: normalizedAddress, normalizedAddress });
        message.success("Địa chỉ hợp lệ");
      } else {
        form.setFieldsValue({ normalizedAddress: "" });
        setAddressCheck(null);
        message.error("Địa chỉ không đúng, cần check lại địa chỉ");
      }
    } catch (error) {
      console.error("Lỗi kiểm tra địa chỉ:", error);
      form.setFieldsValue({ normalizedAddress: "" });
      setAddressCheck(null);
      message.error(
        error?.response?.data?.message ||
          "Không thể kiểm tra địa chỉ. Vui lòng thử lại",
      );
    } finally {
      setCheckingAddress(false);
    }
  };

  // Khi submit form, chuyển các giá trị ngày về chuỗi định dạng 'YYYY-MM-DD'
  const onFinish = (values) => {
    const address = String(values.address || "").trim();
    const isOrderEntryForm =
      currentUser.position !== "kho1" && currentUser.position !== "kho2";

    if (isOrderEntryForm) {
      if (!address) {
        message.error("Vui lòng nhập địa chỉ");
        return;
      }
      // Không bắt buộc check địa chỉ trước khi submit — user có thể tự lưu thẳng
      // (giữ logic check ở nút "Check địa chỉ" như tự gợi ý)
    }

    const submitValues = {
      ...values,
      address,
      // Chỉ gửi normalizedAddress khi đã check (tránh lưu "" thừa vào DB)
      ...(addressCheck?.normalizedAddress
        ? { normalizedAddress: addressCheck.normalizedAddress }
        : isOrderEntryForm
          ? {}
          : { normalizedAddress: values.normalizedAddress || "" }),
      orderDate: values.orderDate
        ? values.orderDate.format("YYYY-MM-DD")
        : null,
      shippingDate1: values.shippingDate1
        ? values.shippingDate1.format("YYYY-MM-DD")
        : null,
      shippingDate2: values.shippingDate2
        ? values.shippingDate2.format("YYYY-MM-DD")
        : null,
      // orderDate5: values.orderDate5 ? values.orderDate5.format("YYYY-MM-DD") : null,
    };
    onSubmit(submitValues);
    form.resetFields();
    setAddressCheck(null);
  };

  return (
    <>
      <Modal
        title="Các đơn hàng của khách"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width="90%"
  centered
      >
        <Table
          dataSource={modalCustomerOrders}
          scroll={{ x: "max-content" }}
          width={3000}
          columns={[
            {
              title: "Sản phẩm",
              key: "products",
              render: (_, record) =>
                record.products
                  ?.map((p) => `${p.product} - SL: ${p.quantity}`)
                  .join(", "),
            },
            {
              title: "Tên Khách",
              dataIndex: "customerName",
              key: "customerName",
            },
            ...(true
              ? [
                  {
                    title: "TÊN PAGE",
                    dataIndex: "pageName",
                    key: "pageName",
                    render: (text) => (text ? text.split("||")[0].trim() : ""),
                  },
                ]
              : []),

            { title: "Doanh số", dataIndex: "revenue", key: "revenue" },
            { title: "SĐT", dataIndex: "phone", key: "phone" },
            {
              title: "Ngày đặt",
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
            },
            { title: "STT", dataIndex: "stt", key: "stt" },
            ...(currentUser.position === "leadSALE" ||
            currentUser.position === "managerSALE" ||
            currentUser.position === "admin"
              ? [
                  { title: "SALE", dataIndex: "sale", key: "sale" },
                  { title: "MKT", dataIndex: "mkt", key: "mkt" },
                  { title: "VĐ", dataIndex: "salexuly", key: "salexuly" },
                ]
              : []),

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
                return (
                  <div style={{ width: 200 }}>
                    <h3>
                      {parts.length > 1
                        ? parts.slice(1).join(":").trim()
                        : text}
                    </h3>
                  </div>
                );
              },
            },

            {
              title: "TT XỬ LÍ",

              dataIndex: "processStatus",
              key: "processStatus",
            },
            {
              title: "ĐƠN",
              dataIndex: "saleReport",
              key: "saleReport",
              render: (text, record) => (
                <div>
                  <Tag color={text === "DONE" ? "green" : "red"}>{text}</Tag>
                  <div
                    style={{ marginTop: 4, cursor: "pointer" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      openScoreModal(record);
                    }}
                  >
                    <Tag
                      color={
                        record.scorePoints >= 70
                          ? "green"
                          : record.scorePoints >= 50
                            ? "blue"
                            : "default"
                      }
                    >
                      {record.scorePoints
                        ? `Điểm: ${record.scorePoints}`
                        : "Chấm điểm"}
                    </Tag>
                  </div>
                </div>
              ),
            },
            {
              title: "TÌNH TRẠNG GH",

              dataIndex: "deliveryStatus",
              width: 90,
              key: "deliveryStatus",
              render: (text) => (
                <Tag color={text === "GIAO THÀNH CÔNG" ? "blue" : "orange"}>
                  {text}
                </Tag>
              ),
            },
            {
              title: "THANH TOÁN",
              dataIndex: "paymentStatus",
              key: "paymentStatus",
              width: 100,
              render: (text) => (
                <Tag color={text === "ĐÃ THANH TOÁN" ? "green" : "red"}>
                  {text}
                </Tag>
              ),
            },

            ...(currentUser.position === "salenhapdon" ||
            currentUser.position === "salefull" ||
            currentUser.position === "salexuly"
              ? [
                  {
                    title: (
                      <Checkbox
                        checked={selectedColumns.includes("note")}
                        onChange={(e) =>
                          handleColumnSelect("note", e.target.checked)
                        }
                      >
                        FB
                      </Checkbox>
                    ),

                    dataIndex: "fb",
                    key: "fb",
                    width: 100,
                    render: (text) => {
                      if (!text) return ""; // Tránh lỗi nếu note rỗng hoặc null

                      return (
                        <div>
                          <h4>{text}</h4>
                        </div>
                      );
                    },
                  },
                ]
              : []),
            ...(currentUser.position === "leadSALE" ||
            currentUser.position === "managerSALE" ||
            currentUser.position === "admin"
              ? [
                  {
                    title: (
                      <Checkbox
                        checked={selectedColumns.includes("backupBy")}
                        onChange={(e) =>
                          handleColumnSelect("backupBy", e.target.checked)
                        }
                      >
                        NGƯỜI SỬA
                      </Checkbox>
                    ),

                    dataIndex: "backupBy",
                    key: "backupBy",
                    width: 100,
                    render: (text) => {
                      if (!text) return ""; // Tránh lỗi nếu note rỗng hoặc null

                      return (
                        <div>
                          <h4>{text ? decodeURIComponent(text) : ""}</h4>
                        </div>
                      );
                    },
                  },
                ]
              : []),
            ...(currentUser.position === "leadSALE" ||
            currentUser.position === "managerSALE" ||
            currentUser.position === "admin" ||
            currentUser.name === "Uyển Nhi"
              ? [
                  {
                    title: (
                      <Checkbox
                        checked={selectedColumns.includes("backupAt")}
                        onChange={(e) =>
                          handleColumnSelect("backupAt", e.target.checked)
                        }
                      >
                        TIME
                      </Checkbox>
                    ),

                    dataIndex: "backupAt",
                    key: "backupAt",
                    width: 100,
                    render: (text) => {
                      if (!text) return "";

                      const vnTime = new Date(text).toLocaleString("vi-VN", {
                        timeZone: "Asia/Ho_Chi_Minh",
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      });

                      return <h4>{vnTime}</h4>;
                    },
                  },
                ]
              : []),
          ]}
          rowKey="id"
          bordered
          size="small"
          pagination={false}
        />
      </Modal>
      <Modal
        title={
          scoreMode === "view"
            ? `Xem điểm đơn hàng - STT ${scoreOrder?.stt || ""}`
            : `Chấm điểm đơn hàng - STT ${scoreOrder?.stt || ""}`
        }
        open={scoreModalVisible}
        onCancel={handleScoreModalClose}
        footer={
          scoreMode === "edit" ? (
            <Button
              type="primary"
              onClick={handleSaveScore}
              loading={scoreSaving || scoreUploading}
            >
              {scoreUploading ? "Đang tải ảnh..." : "Lưu điểm"}
            </Button>
          ) : (
            <Button onClick={handleScoreModalClose}>Đóng</Button>
          )
        }
        width={600}
        centered
      >
        <div style={{ padding: "8px 0" }}>
          <div style={{ marginBottom: 8, fontWeight: 600 }}>
            Tổng điểm thô: {scoreTotalRaw} điểm
          </div>
          <div
            style={{
              marginBottom: 16,
              padding: 12,
              backgroundColor: "#f5f5f5",
              borderRadius: 6,
              fontSize: 16,
              fontWeight: 600,
              color: scoreFinal >= 70 ? "#52c41a" : "#1890ff",
            }}
          >
            Điểm sau chốt: {scoreFinal} điểm
          </div>

          <div style={{ marginBottom: 16 }}>
            {SCORE_ITEMS.map((item) => (
              <div
                key={item.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "6px 0",
                  borderBottom: "1px dashed #eee",
                }}
              >
                {scoreMode === "edit" ? (
                  <Checkbox
                    checked={!!scoreChecked[item.key]}
                    onChange={(e) =>
                      setScoreChecked((prev) => ({
                        ...prev,
                        [item.key]: e.target.checked,
                      }))
                    }
                  >
                    <span style={{ marginLeft: 4 }}>{item.label}</span>
                  </Checkbox>
                ) : (
                  <span style={{ color: "#333" }}>{item.label}</span>
                )}
                <span
                  style={{
                    marginLeft: "auto",
                    color: scoreChecked[item.key] ? "#52c41a" : "#999",
                    fontWeight: scoreChecked[item.key] ? 600 : 400,
                  }}
                >
                  {scoreChecked[item.key] ? `+${item.points}đ ✓` : `${item.points}đ`}
                </span>
              </div>
            ))}
          </div>

          <div>
            <label
              style={{ fontWeight: 600, display: "block", marginBottom: 8 }}
            >
              Ảnh chứng minh ({scoreImageList.length} ảnh)
            </label>
            {scoreImageList.length > 0 ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {scoreImageList.map((item, idx) => (
                  <Image
                    key={item.uid}
                    src={item.kind === "cloudinary" ? item.url : item.preview}
                    alt={`Ảnh ${idx + 1}`}
                    width={100}
                    height={100}
                    style={{
                      objectFit: "cover",
                      borderRadius: 8,
                      border: "1px solid #eee",
                    }}
                    preview={{
                      maskClassName: "custom-preview-mask",
                    }}
                  />
                ))}
              </div>
            ) : (
              <div style={{ color: "#999", fontStyle: "italic" }}>
                Không có ảnh
              </div>
            )}
          </div>
        </div>
      </Modal>
      <Modal
        title={initialValues ? "Chỉnh sửa đơn hàng" : "Thêm đơn hàng mới"}
        open={open}
        onCancel={onCancel}
        footer={null}
        width={1000}
        style={{ top: 20 }}
      >
        <FullScreenLoading
          loading={loading2 || loading}
          tip="Đang tải dữ liệu..."
        />

        {currentUser.position === "kho1" || currentUser.position === "kho2" ? (
          <>
            <Form form={form} layout="vertical" onFinish={onFinish}>
              {/* Các trường dành cho nhân viên kho */}
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    label="TÌNH TRẠNG GIAO HÀNG"
                    name="deliveryStatus"
                    hidden={!initialValues}
                  >
                    <Select allowClear>
                      {tinhTrangGHOptions.map((status) => (
                        <Option key={status} value={status}>
                          {status}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="MÃ VẬN ĐƠN"
                    name="trackingCode"
                    hidden={!initialValues}
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="NGÀY GỬI"
                    name="shippingDate1"
                    hidden={!initialValues}
                  >
                    <DatePicker
                      allowClear
                      style={{ width: "100%" }}
                      format="YYYY-MM-DD"
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    allowClear
                    label="NGÀY NHẬN"
                    name="shippingDate2"
                    hidden={!initialValues}
                  >
                    <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="GHI CHÚ KHO"
                    name="noteKHO"
                    hidden={!initialValues}
                  >
                    <Input.TextArea rows={3} />
                  </Form.Item>
                </Col>
              </Row>

              {/* Các trường ẩn khi là kho */}
              <Form.Item label="NGÀY ĐẶT" name="orderDate" hidden={true}>
                <DatePicker
                  style={{ width: "100%" }}
                  format="YYYY-MM-DD HH:mm:ss"
                />
              </Form.Item>
              <Form.Item label="STT" name="stt" hidden={true}>
                <Input type="number" />
              </Form.Item>
              <Form.Item label="TÊN KHÁCH" name="customerName" hidden={true}>
                <Input />
              </Form.Item>
              <Form.Item label="TÊN PAGE" name="pageName" hidden={true}>
                <Input />
              </Form.Item>
              <Form.Item label="SALE Xử lý" name="salexuly" hidden={true}>
                <Select>
                  {salexulyOptions.map((employee) => (
                    <Option key={employee} value={employee}>
                      {employee}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item label="odate4" name="orderDate4" hidden={true}>
                <Input type="number" />
              </Form.Item>

              <Form.Item label="DOANH SỐ" name="revenue" hidden={true}>
                <Input type="number" />
              </Form.Item>
              <Form.Item label="Ngày xóa ds" name="orderDate5" hidden={true}>
                <Input type="number" />
              </Form.Item>
              <Form.Item label="Ngày done" name="orderDate6" hidden={true}>
                <Input type="number" />
              </Form.Item>
              <Form.Item label="SỐ ĐIỆN THOẠI" name="phone" hidden={true}>
                <Input type="tel" />
              </Form.Item>
              <Form.Item label="ĐỊA CHỈ" name="address" hidden={true}>
                <Input.TextArea rows={3} />
              </Form.Item>
              <Form.Item label="GHI CHÚ SALE" name="note" hidden={true}>
                <Input.TextArea rows={3} />
              </Form.Item>
              <Form.Item label="GHI CHÚ KHO" name="noteKHO" hidden={true}>
                <Input.TextArea rows={3} />
              </Form.Item>
              <Form.Item label="Phân loại" name="category" hidden={true}>
                <Input />
              </Form.Item>
              <Form.Item label="in đơn" name="istick" hidden={true}>
                <Input />
              </Form.Item>
              <Form.Item label="ĐÃ in đơn" name="istick4" hidden={true}>
                <Input />
              </Form.Item>
              <Form.Item label="Đơn cần xử lý" name="istick5" hidden={true}>
                <Input />
              </Form.Item>
              <Form.Item label="cty đóng hàng" name="isShipping" hidden={true}>
                <Input />
              </Form.Item>
              <Form.Item
                label="xác nhận giao thành công"
                name="istickDONE"
                hidden={true}
              >
                <Input />
              </Form.Item>
              {/* <Form.Item label="Hàng nặng/nhẹ" name="mass" hidden={true}>
              <Input />
            </Form.Item> */}
              <Form.List name="products" hidden={true}>
                {(fields, {}) => (
                  <>
                    {fields.map((field) => (
                      <Space key={field.key} align="baseline">
                        <Form.Item
                          hidden={true}
                          {...field}
                          name={[field.name, "product"]}
                          fieldKey={[field.fieldKey, "product"]}
                          rules={[{ required: true, message: "Chọn sản phẩm" }]}
                        >
                          <Select
                            placeholder="Chọn sản phẩm"
                            style={{ width: 200 }}
                            showSearch
                          >
                            {productOptions.map((product) => (
                              <Option key={product} value={product}>
                                {product}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                        <Form.Item
                          hidden={true}
                          {...field}
                          name={[field.name, "quantity"]}
                          fieldKey={[field.fieldKey, "quantity"]}
                          rules={[{ required: true, message: "Nhập số lượng" }]}
                        >
                          <Input
                            type="number"
                            min={1}
                            placeholder="Số lượng"
                            style={{ width: 100 }}
                          />
                        </Form.Item>
                      </Space>
                    ))}
                  </>
                )}
              </Form.List>

              <Form.Item label="MKT" name="mkt" hidden={true}>
                <Select showSearch>
                  {mktOptions.map((mkt) => (
                    <Option key={mkt} value={mkt}>
                      {mkt}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item label="SALE" name="sale" hidden={true}>
                <Select showSearch>
                  {saleOptions.map((sale) => (
                    <Option key={sale} value={sale}>
                      {sale}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item label="DOANH SỐ" name="revenue" hidden={true}>
                <Input type="number" />
              </Form.Item>
              <Form.Item label="Ngày xóa ds" name="orderDate5" hidden={true}>
                <Input type="number" />
              </Form.Item>
              <Form.Item label="Ngày done" name="orderDate6" hidden={true}>
                <Input type="number" />
              </Form.Item>
              <Form.Item
                label="TT SALE XỬ LÍ ĐƠN"
                name="processStatus"
                hidden={true}
              >
                <Select>
                  {handleTTXLOptions.map((status) => (
                    <Option key={status} value={status}>
                      {status}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item label="SALE BÁO" name="saleReport" hidden={true}>
                <Select>
                  {saleBaoOptions.map((report) => (
                    <Option key={report} value={report}>
                      {report}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item label="Chọn SALE Xử lý" name="salexuly" hidden={true}>
                <Select showSearch>
                  {salexulyOptions.map((sale) => (
                    <Option key={sale} value={sale}>
                      {sale}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item label="THANH TOÁN" name="paymentStatus" hidden={true}>
                <Select>
                  {thanhToanOptions.map((status) => (
                    <Option key={status} value={status}>
                      {status}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item
                label="SALE XÁC NHẬN"
                hidden={true}
                name="salexacnhan"
              ></Form.Item>
              <Form.Item label="Link FB" hidden={true} name="fb">
                <Input />
              </Form.Item>
              <Form.Item style={{ marginTop: 24, textAlign: "right" }}>
                <Button style={{ marginRight: 8 }} onClick={onCancel}>
                  Hủy
                </Button>
                {(currentUser.position_team !== "kho" || initialValues) && (
                  <Button type="primary" htmlType="submit">
                    {initialValues ? "Cập nhật" : "Thêm mới"}
                  </Button>
                )}
              </Form.Item>
            </Form>
          </>
        ) : (
          <>
            <Form form={form} layout="vertical" onFinish={onFinish}>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item label="NGÀY ĐẶT" name="orderDate">
                    {/* <DatePicker style={{ width: "100%" }} disabled={true} /> */}
                    <DatePicker style={{ width: "100%" }} disabled={true} />
                  </Form.Item>
                  {/* <Form.Item label="Hàng nặng/nhẹ" name="mass">
                  <Select showSearch>
                    {massOptions.map((mas) => (
                      <Option key={mas} value={mas}>
                        {mas}
                      </Option>
                    ))}
                  </Select>
                </Form.Item> */}
                  <Form.Item
                    label="TÊN KHÁCH"
                    name="customerName"
                    rules={[
                      { required: true, message: "Vui lòng nhập TÊN KHÁCH" },
                    ]}
                  >
                    <Input
                      onBlur={(e) => {
                        const value = e.target.value.trim();
                        if (value) handleSearchCustomerModal(value);
                      }}
                    />
                  </Form.Item>

                  <div style={{ display: "flex", gap: 8 }}>
                    <Form.Item label="TÊN PAGE" name="pageName">
                      <Select
                        style={{ width: 270 }}
                        allowClear
                        disabled={currentUser.position === "salexacnhan"}
                        showSearch
                        onChange={(value) => {
                          // Giá trị nhận được có định dạng "pageName||employee"
                          const [pageName, employee] = value.split("||");
                          // Ví dụ: gán employee vào field "mkt"
                          form.setFieldsValue({ mkt: employee });
                        }}
                        filterOption={(input, option) =>
                          String(option.children)
                            .toLowerCase()
                            .includes(input.toLowerCase())
                        }
                      >
                        {dataPagename.map((item, index) => {
                          const trimmedPageName = item.pageName.trim();
                          return (
                            <Option
                              key={`${trimmedPageName}-${index}`}
                              value={`${trimmedPageName}||${item.employee}`}
                            >
                              {trimmedPageName}
                            </Option>
                          );
                        })}
                      </Select>
                    </Form.Item>{" "}
                    <ReloadOutlined
                      style={{
                        fontSize: 24,
                        color: "#08c",
                        cursor: "pointer",
                        transition: "transform 0.5s",
                        transform: loading ? "rotate(360deg)" : "none",
                      }}
                      spin={loading} // Tự động xoay khi loading
                      onClick={resetPagename}
                    />
                  </div>
                  <Form.Item label="SỐ ĐIỆN THOẠI" name="phone">
                    <Input type="tel" />
                  </Form.Item>
                  <Form.Item label="ĐỊA CHỈ">
                    <Form.Item name="address" noStyle>
                      <Input.TextArea
                        rows={2}
                        onChange={() => {
                          setAddressCheck(null);
                          form.setFieldsValue({ normalizedAddress: "" });
                        }}
                      />
                    </Form.Item>
                    <Button
                      type="default"
                      loading={checkingAddress}
                      onClick={handleCheckAddress}
                      style={{ marginTop: 8 }}
                    >
                      Check địa chỉ
                    </Button>
                    {addressCheck?.normalizedAddress && (
                      <div
                        style={{
                          color: "#389e0d",
                          marginTop: 6,
                          fontSize: 12,
                        }}
                      >
                        Địa chỉ hợp lệ: {addressCheck.normalizedAddress}
                      </div>
                    )}
                  </Form.Item>
                  <Form.Item name="normalizedAddress" hidden>
                    <Input />
                  </Form.Item>
                  <Form.Item
                    label="MKT"
                    name="mkt"
                    hidden={
                      currentUser.position === "salenhapdon" ||
                      currentUser.position === "salexuly"
                    }
                  >
                    <Input
                      value={employeeNamepage}
                      disable={
                        currentUser.position !== "salexuly" ||
                        currentUser.position !== "managerSALE" ||
                        currentUser.position !== "leadSALE" ||
                        currentUser.position !== "salefull"
                      }
                    />
                  </Form.Item>
                </Col>
                <Col span={9}>
                  {/* Thay đổi: dùng Form.List cho SẢN PHẨM và SỐ LƯỢNG SP */}
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <p style={{ margin: 0 }}>SẢN PHẨM</p>
                    <ReloadOutlined
                      style={{
                        fontSize: 24,
                        color: "#08c",
                        cursor: "pointer",
                        transition: "transform 0.5s",
                        transform: loading ? "rotate(360deg)" : "none",
                      }}
                      spin={loading}
                      onClick={fetchProducts}
                    />
                  </div>
                  <Form.List name="products">
                    {(fields, { add, remove }) => (
                      <>
                        {fields.map((field, index) => (
                          <Space key={`${field.key}-${index}`} align="baseline">
                            <Form.Item
                              {...field}
                              name={[field.name, "product"]}
                              fieldKey={[field.fieldKey, "product"]}
                              rules={[
                                { required: true, message: "Chọn sản phẩm" },
                              ]}
                            >
                              <Select
                                placeholder="Chọn sản phẩm"
                                style={{ width: 270 }}
                                showSearch
                              >
                                {productOptions.map((product) => {
                                  // Tìm sản phẩm tương ứng trong mảng products
                                  const productObj = products.find(
                                    (p) => p.name === product,
                                  );
                                  return (
                                    <Option key={product} value={product}>
                                      {/* <Popover
            content={
              productObj && productObj.image ? (
                <img src={productObj.image} alt={product} style={{ width: 150 }} />
              ) : null
            }
            title={product}
            trigger="hover"
          >
            <span>{product}</span>
          </Popover> */}
                                    </Option>
                                  );
                                })}
                              </Select>
                            </Form.Item>
                            <Form.Item
                              {...field}
                              name={[field.name, "quantity"]}
                              fieldKey={[field.fieldKey, "quantity"]}
                              rules={[
                                { required: true, message: "Nhập số lượng" },
                              ]}
                            >
                              <Input
                                type="number"
                                min={1}
                                placeholder="SL"
                                style={{ width: 60 }}
                              />
                            </Form.Item>
                            <MinusCircleOutlined
                              onClick={() => remove(field.name)}
                            />
                          </Space>
                        ))}
                        <Form.Item>
                          <Button
                            type=""
                            onClick={() => add()}
                            block
                            icon={<PlusOutlined />}
                          >
                            Thêm sản phẩm
                          </Button>
                        </Form.Item>
                      </>
                    )}
                  </Form.List>

                  <Form.Item label="QUÀ" name="category">
                    <Input />
                  </Form.Item>

                  <Form.Item label="DOANH SỐ" name="revenue">
                    <Input
                      type="number"
                      onChange={(e) => {
                        const value = e.target.value
                          ? Number(e.target.value)
                          : 0;
                        form.setFieldsValue({ revenue: value });
                      }}
                    />
                  </Form.Item>
                  <Form.Item
                    label="Ngày xóa ds"
                    name="orderDate5"
                    hidden={true}
                  >
                    <Input type="number" />
                  </Form.Item>
                  <Form.Item label="Ngày done" name="orderDate6" hidden={true}>
                    <Input type="number" />
                  </Form.Item>

                  <Form.Item
                    label="SALE CHAT"
                    name="sale"
                    initialValue={currentUser.name}
                    hidden={
                      currentUser.position === "salenhapdon" ||
                      currentUser.position === "salexuly"
                    }
                  >
                    <Select
                      disabled={
                        currentUser.position === "salexuly" ||
                        currentUser.position === "salenhapdon" ||
                        currentUser.position === "salexacnhan" ||
                        currentUser.position === "salefull"
                        //    &&
                        // currentUser.name !== "Lê Linh Chi" &&
                        // currentUser.name !== "Trần Thị Hồng Nhung"
                      }
                      showSearch
                    >
                      {saleOptions.map((employee) => (
                        <Option key={employee} value={employee}>
                          {employee}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>

                  <Form.Item
                    label="VẬN ĐƠN"
                    name="salexuly"
                    initialValue={namesalexuly}
                    hidden={
                      currentUser.position === "salenhapdon" ||
                      currentUser.position === "salexuly"
                    }
                  >
                    <Select
                      showSearch
                      disabled={
                        currentUser.position === "salexuly" ||
                        currentUser.position === "salenhapdon" ||
                        currentUser.position === "salexacnhan" ||
                        currentUser.position === "salefull"
                        //    &&
                        // currentUser.name !== "Lê Linh Chi" &&
                        // currentUser.name !== "Trần Thị Hồng Nhung"
                      }
                    >
                      {salexulyOptions.map((employee) => (
                        <Option key={employee} value={employee}>
                          {employee}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                  <Form.Item label="SALE XÁC NHẬN" name="salexacnhan">
                    <Select showSearch>
                      {salexacnhanOptions.map((employee) => (
                        <Option key={employee} value={employee}>
                          {employee}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={7}>
                  <Form.Item label="GHI CHÚ SALE" name="note">
                    <Input.TextArea
                      rows={3}
                      onFocus={(e) => {
                        if (!e.target.value) {
                          const prefix = `${currentUser.name}: `;
                          form.setFieldsValue({ note: prefix });
                        }
                      }}
                    />
                  </Form.Item>

                  <Form.Item label="Link FB" name="fb">
                    <Input />
                  </Form.Item>
                  <Form.Item label="TT SALE XỬ LÍ ĐƠN" name="processStatus">
                    <Select showSearch>
                      {handleTTXLOptions.map((status) => (
                        <Option key={status} value={status}>
                          {status}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                  <Form.Item label="ĐƠN" name="saleReport">
                    <Select allowClear>
                      {saleBaoOptions.map((report) => (
                        <Option key={report} value={report}>
                          {report}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                  <Form.Item>
                    <Button
                      block
                      onClick={() => openScoreModal(null)}
                      disabled={!initialValues?.id}
                    >
                      Thả đơn
                    </Button>
                  </Form.Item>
                  <Form.Item
                    label="THANH TOÁN"
                    name="paymentStatus"
                    rules={[
                      { required: true, message: "Vui lòng nhập THANH TOÁN" },
                    ]}
                  >
                    <Select>
                      {thanhToanOptions.map((status) => (
                        <Option key={status} value={status}>
                          {status}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label="TÌNH TRẠNG GIAO HÀNG"
                name="deliveryStatus"
                hidden={!initialValues || currentUser.position_team === "sale"}
              >
                <Select>
                  {tinhTrangGHOptions.map((status) => (
                    <Option key={status} value={status}>
                      {status}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item
                label="MÃ VẬN ĐƠN"
                name="trackingCode"
                hidden={!initialValues || currentUser.position_team === "sale"}
              >
                <Input />
              </Form.Item>
              <Form.Item label="in đơn" name="istick" hidden={true}>
                <Input />
              </Form.Item>
              <Form.Item label="ĐÃ in đơn" name="istick4" hidden={true}>
                <Input />
              </Form.Item>
              <Form.Item label="Đơn cần xử lý" name="istick5" hidden={true}>
                <Input />
              </Form.Item>
              <Form.Item label="cty đóng hàng" name="isShipping" hidden={true}>
                <Input />
              </Form.Item>
              <Form.Item
                label="xác nhận giao thành công"
                name="istickDONE"
                hidden={true}
              >
                <Input />
              </Form.Item>
              <Form.Item
                label="NGÀY GỬI"
                name="shippingDate1"
                hidden={!initialValues || currentUser.position_team === "sale"}
              >
                <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
              </Form.Item>
              <Form.Item label="odate4" name="orderDate4" hidden={true}>
                <Input type="number" />
              </Form.Item>
              <Form.Item
                label="NGÀY NHẬN"
                name="shippingDate2"
                hidden={!initialValues || currentUser.position_team === "sale"}
              >
                <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
              </Form.Item>
              <Form.Item
                label="GHI CHÚ KHO"
                name="noteKHO"
                hidden={!initialValues || currentUser.position_team === "sale"}
              >
                <Input.TextArea rows={3} />
              </Form.Item>
              <Form.Item style={{ marginTop: 24, textAlign: "right" }}>
                <Button style={{ marginRight: 8 }} onClick={onCancel}>
                  Hủy
                </Button>
                {(currentUser.position_team === "sale" ||
                  initialValues ||
                  currentUser.position_team === "admin") && (
                  <Button type="primary" htmlType="submit">
                    {initialValues ? "Cập nhật" : "Thêm mới"}
                  </Button>
                )}
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>
    </>
  );
};

export default OrderForm;
