"use client";
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Table,
  Form,
  Switch ,
  Input,
  Tag ,
  InputNumber,
  Button,
  Modal,
  Space,
  DatePicker,
  Popover,
  Select,
  Popconfirm,
  Upload,
  message,
  Spin,
} from "antd";
import moment from "moment";

import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  UploadOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  AppstoreOutlined,
  ExperimentOutlined,
  HistoryOutlined,
  EditFilled,
} from "@ant-design/icons";

import axios from "axios";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";

const { Search } = Input;
const { Option } = Select;

/** Utility: convert file to base64 */
const getBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

export default function BestSellingProductsPage() {
  const router = useRouter();
  const currentUser = useSelector((state) => state.user.currentUser || {});
  useEffect(() => {
    if (!currentUser?.name) {
      router.push("/login");
    }
  }, [currentUser?.name, router]);

  // Data
  const [orders2, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
const [lastFilterType, setLastFilterType] = useState(null);
  // Forms
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [addImportForm] = Form.useForm();

const [selectedRowKeys, setSelectedRowKeys] = useState([]);
const [bulkMkt, setBulkMkt] = useState(null);
const [bulkDate, setBulkDate] = useState(null);
const [animatedCount, setAnimatedCount] = useState(0);
const [animatedVariants, setAnimatedVariants] = useState(0);
const [animatedRevenue, setAnimatedRevenue] = useState(0);
const prevRevenueRef = useRef(null);
  // UI state
  const [searchText, setSearchText] = useState("");
  const [selectedPreset, setSelectedPreset] = useState("all");
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
const [createdAtRange, setCreatedAtRange] = useState(null);
  const [addImportModalVisible, setAddImportModalVisible] = useState(false);
  const [addingImportProduct, setAddingImportProduct] = useState(null);

  const [loading, setLoading] = useState(false);
const [employees, setEmployees] = useState([]);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const [editFileList, setEditFileList] = useState([]);
const [viewMode, setViewMode] = useState("sp-am");
  // Fetch functions
  const fetchOrders = useCallback(async () => {
    try {
      const response = await axios.get("/api/orderssanpham");
      setOrders(response.data.data || []);
    } catch (error) {
      console.error(error);
      message.error("Lỗi khi lấy đơn hàng");
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/products");
      setProducts(response.data.data || []);
    } catch (error) {
      console.error(error);
      message.error("Lỗi khi lấy danh sách sản phẩm");
    } finally {
      setLoading(false);
    }
  }, []);
const fetchEmployees = async () => {

      try {
        const response = await axios.get('/api/employees');
        setEmployees(response.data.data);
      } catch (error) {
        console.error('Lỗi khi lấy danh sách nhân viên:', error);
      } finally {

      }
    };
  useEffect(() => {
    fetchOrders();
    fetchEmployees(),
    fetchProducts();
  }, [fetchOrders, fetchProducts]);

const mktOptions = [
  "SP CHUNG",
  ...employees
    .filter((emp) => emp.position_team === "mkt")
    .map((emp) => emp.name)
];
  /** Date filter helpers */
  function filterByPreset(dataArray, preset) {
    const now = new Date();
    let start, end;
    switch (preset) {
      case "today":
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        end = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          23,
          59,
          59,
          999
        );
        break;
      case "yesterday":
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        end = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - 1,
          23,
          59,
          59,
          999
        );
        break;
      case "week":
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        end = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          23,
          59,
          59,
          999
        );
        break;
      case "currentMonth":
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          23,
          59,
          59,
          999
        );
        break;
      case "2currentMonth":
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          23,
          59,
          59,
          999
        );
        break;
      case "3currentMonth":
        start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        end = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          23,
          59,
          59,
          999
        );
        break;
      case "lastMonth":
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        break;
      case "twoMonthsAgo":
        start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        end = new Date(
          now.getFullYear(),
          now.getMonth() - 1,
          0,
          23,
          59,
          59,
          999
        );
        break;
      case "threeMonthsAgo":
        start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        end = new Date(
          now.getFullYear(),
          now.getMonth() - 2,
          0,
          23,
          59,
          59,
          999
        );
        break;
      default:
        return dataArray;
    }
    return dataArray.filter((item) => {
      const dateStr = item.orderDate || item.date;
      if (!dateStr) return false;
      const itemDate = new Date(dateStr);
      return itemDate >= start && itemDate <= end;
    });
  }
const rowSelection = {
  selectedRowKeys,
  onChange: (keys) => {
    setSelectedRowKeys(keys);
  },
};
  /** Precompute aggregations from orders */
  const ordersAggMap = useMemo(() => {
    const map = Object.create(null);
    if (!orders2 || orders2.length === 0) return map;

    for (const order of orders2) {
      const profitNum = Number(order.profit || 0);
      const deliveryStatus = order.deliveryStatus || "";
      const saleReport = order.saleReport || "";
      const productsInOrder = Array.isArray(order.products) ? order.products : [];

      for (const item of productsInOrder) {
        const pname = item.product;
        const qty = Number(item.quantity || 0);
        if (!pname) continue;
        if (!map[pname]) {
          map[pname] = {
            ordersDone: 0,
            deliveredQty: 0,
            ordersNotDone: 0,
            totalProfit: 0,
          };
        }

        map[pname].totalProfit += profitNum;

        if (
          deliveryStatus === "ĐÃ GỬI HÀNG" ||
          deliveryStatus === "GIAO THÀNH CÔNG" ||
          deliveryStatus === "BỊ BẮT CHỜ GỬI LẠI"
        ) {
          map[pname].deliveredQty += qty;
        }

        if (saleReport === "DONE" && (!deliveryStatus || deliveryStatus === "")) {
          map[pname].ordersDone += qty;
        }

        if (saleReport !== "DONE") {
          map[pname].ordersNotDone += qty;
        }
      }
    }
    return map;
  }, [orders2]);

  const getAggregatesFor = useCallback(
    (productName) => {
      return ordersAggMap[productName] || {
        ordersDone: 0,
        deliveredQty: 0,
        ordersNotDone: 0,
        totalProfit: 0,
      };
    },
    [ordersAggMap]
  );

  const nameAdjustments = useMemo(
    () => ({
      "KEM NỀN THỎI": { slAmAdd: 2 },
      "MẶT NẠ BONG BÓNG": { slAmAdd: 28 },
      "KÍNH NỮ": { slAmAdd: 1 },
      "TAI NGHE AI - TRẮNG": { slAmAdd: 2 },
      "TAI NGHE AI - TÍM": { slAmAdd: 2 },
      "GÓI NHUỘM TÓC - ĐEN": { slAmAdd: 2 },
      "ĐỒNG HỒ CẢM ỨNG MẶT VUÔNG - ĐEN": { slAmAdd: 2 },
      "ĐỒNG HỒ CẢM ỨNG MẶT VUÔNG - CAM": { slAmAdd: 1 },
      "ĐỒNG HỒ CẢM ỨNG MẶT VUÔNG - VÀNG": { slAmAdd: 1 },
      "VIÊN TINH CHẤT HÀU": { slAmAdd: 6 },
    }),
    []
  );

  /** Tính số lượng "âm" của 1 sản phẩm = sl Nhập - sl Đã giao (ordersDone + deliveredQty) */
  const getSlAmFor = useCallback(
    (productRecord) => {
      const name = productRecord?.name;
      if (!name) return -Infinity;
      const agg = getAggregatesFor(name);
      const totalImported =
        (productRecord.imports || []).reduce((acc, cur) => {
          return (
            acc +
            (Number(cur.importedQty) || 0) +
            (Number(cur.importVN) || 0) +
            (Number(cur.importKR) || 0)
          );
        }, 0) + (Number(productRecord.slvn) || 0) + (Number(productRecord.sltq) || 0);

      const adjust = nameAdjustments[name]?.slAmAdd || 0;
      const slAm = totalImported - (agg.ordersDone || 0) - (agg.deliveredQty || 0);
      return slAm + adjust;
    },
    [getAggregatesFor, nameAdjustments]
  );

const filteredProducts = useMemo(() => {
  let data = products || [];

  // Filter theo chế độ xem: "sp-am" chỉ hiện SP có SL Âm < 0 (sắp xếp số âm tăng dần = âm nhiều nhất trước)
  if (viewMode === "sp-am") {
    const amProducts = data.filter((p) => {
      const slAm = getSlAmFor(p);
      return slAm < 0;
    });
    if (amProducts.length > 0) {
      amProducts.sort((a, b) => getSlAmFor(a) - getSlAmFor(b));
      data = amProducts.slice(0, 30);
    } else {
      // Fallback: nếu chưa tính được SP âm (orders chưa load), vẫn hiển thị 30 SP đầu tiên để trang không trống
      data = data.slice(0, 30);
    }
  }

  // Filter theo search
  const q = (searchText || "").trim().toLowerCase();
  if (q) {
    data = data.filter((p) =>
      String(p.name || "").toLowerCase().includes(q)
    );
  }

if (lastFilterType === "createdAt" && createdAtRange?.length === 2) {
  const start = createdAtRange[0].format("YYYY-MM-DD");
  const end = createdAtRange[1].format("YYYY-MM-DD");

  data = data.filter((p) => {
    if (!p.createdAt) return false;

    const d = new Date(p.createdAt);
    const localDate = new Date(
      d.getTime() - d.getTimezoneOffset() * 60000
    )
      .toISOString()
      .split("T")[0];

    return localDate >= start && localDate <= end;
  });
}

  return data;
}, [products, searchText, lastFilterType,createdAtRange, viewMode, getSlAmFor]);

  /** Compute derived "orders" list filtered by preset */
  const ordersByPreset = useMemo(() => {
    if (selectedPreset === "all") return orders2;
    return filterByPreset(orders2, selectedPreset);
  }, [orders2, selectedPreset]);

  // Animate count from 0 to total
  const prevCountRef = useRef(null);
  const prevVariantsRef = useRef(null);
  const searchInputRef = useRef(null);
  useEffect(() => {
    // Đếm sản phẩm gộp theo tên gốc (bỏ phần biến thể phía sau " - ")
    // VD: "GIÀY CHỮ Y - ĐỎ - 35" và "GIÀY CHỮ Y - TÍM - 38" cùng 1 sản phẩm
    const baseNames = new Set();
    for (const p of filteredProducts) {
      const fullName = String(p?.name || "").trim();
      if (!fullName) continue;
      // Tách theo " - " (ưu tiên), fallback tách theo "-"
      let baseName = fullName;
      if (fullName.includes(" - ")) {
        baseName = fullName.split(" - ")[0].trim();
      } else if (fullName.includes("-")) {
        baseName = fullName.split("-")[0].trim();
      }
      if (baseName) baseNames.add(baseName.toLowerCase());
    }
    const target = baseNames.size;
    const variantsTarget = filteredProducts.length;

    const animate = (prev, currentTarget, setter) => {
      if (prev === null || prev === currentTarget) {
        setter(currentTarget);
        return currentTarget;
      }
      const duration = 800;
      const startTime = performance.now();
      const step = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setter(Math.round(prev + (currentTarget - prev) * eased));
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      return currentTarget;
    };

    prevCountRef.current = animate(prevCountRef.current, target, setAnimatedCount);
    prevVariantsRef.current = animate(prevVariantsRef.current, variantsTarget, setAnimatedVariants);
  }, [filteredProducts]);

  /** totalRevenue logic — chỉ tính cho sản phẩm đang hiển thị trên trang (filter hiện tại), không ảnh hưởng trang khác */
  const totalRevenue = useMemo(() => {
    if (!searchText || searchText.trim() === "") return 0;
    const q = (searchText || "").trim().toLowerCase();
    // Dùng filteredProducts (sản phẩm bị khóa theo bộ lọc hiện tại) thay vì products
    const targetProducts = filteredProducts.filter((p) =>
      String(p.name || "").toLowerCase().includes(q)
    );
    if (targetProducts.length === 0) return 0;

    // Gộp theo tên gốc (bỏ phần biến thể " - ...") để khớp với bộ đếm sản phẩm
    const baseNames = new Set();
    for (const p of targetProducts) {
      const fullName = String(p?.name || "").trim();
      if (!fullName) continue;
      let baseName = fullName;
      if (fullName.includes(" - ")) {
        baseName = fullName.split(" - ")[0].trim();
      } else if (fullName.includes("-")) {
        baseName = fullName.split("-")[0].trim();
      }
      if (baseName) baseNames.add(baseName.toLowerCase());
    }
    if (baseNames.size === 0) return 0;

    // Gom tất cả tên biến thể khớp base name để match với orders
    const targetNames = new Set(targetProducts.map((p) => p.name));

    let total = 0;
    for (const order of orders2) {
      if (!order.products || !Array.isArray(order.products)) continue;
      const includes = order.products.some((it) => {
        if (!it?.product) return false;
        const pn = String(it.product);
        if (targetNames.has(pn)) return true;
        // Fallback: so khớp theo tên gốc
        let base = pn;
        if (pn.includes(" - ")) base = pn.split(" - ")[0].trim();
        else if (pn.includes("-")) base = pn.split("-")[0].trim();
        return baseNames.has(base.toLowerCase());
      });
      if (includes) total += Number(order.profit || 0);
    }
    return total;
  }, [searchText, filteredProducts, orders2]);

  // Animate totalRevenue khi tìm kiếm (chạy từ 0 lên giá trị hiện tại)
  useEffect(() => {
    const isSearching = searchText && searchText.trim() !== "";
    const target = isSearching ? totalRevenue : 0;
    const animate = (prev, currentTarget, setter) => {
      if (prev === null || prev === currentTarget) {
        setter(currentTarget);
        return currentTarget;
      }
      const duration = 900;
      const startTime = performance.now();
      const step = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setter(Math.round((prev + (currentTarget - prev) * eased) * 100) / 100);
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      return currentTarget;
    };
    prevRevenueRef.current = animate(prevRevenueRef.current, target, setAnimatedRevenue);
  }, [searchText, totalRevenue]);

  /** Handlers (memoized) */
  const handleEditProduct = useCallback(
    (record) => {
      setEditingProduct(record);
      editForm.setFieldsValue({
        name: record.name,
        slvn: record.slvn,
        sltq: record.sltq,
        mkttest:record.mkttest,
        description: record.description,
        image: record.image
          ? [
              {
                uid: "-1",
                name: "image.png",
                status: "done",
                url: record.image,
              },
            ]
          : [],
      });
      setEditFileList(
        record.image
          ? [
              {
                uid: "-1",
                name: "image.png",
                status: "done",
                url: record.image,
              },
            ]
          : []
      );
      setEditModalVisible(true);
    },
    [editForm]
  );

  const handleEditProductFinish = useCallback(
    async (values) => {
      setLoading(true);
      setEditModalVisible(false);
      try {
        const file = values.image?.[0];
        let imageValue = null;
        if (file) {
          if (file.originFileObj) {
            imageValue = await getBase64(file.originFileObj);
          } else if (file.url) {
            imageValue = file.url;
          }
        }
        const updatedProduct = {
          key: editingProduct.key,
          name: values.name,
          description: values.description,
          image: imageValue,
          mkttest: values.mkttest,
          testday: values.testday,
          slvn: values.slvn,
          sltq: values.sltq,
        };
        await axios.put(`/api/products/${editingProduct.key}`, updatedProduct);
        message.success("Cập nhật sản phẩm thành công");
        setEditingProduct(null);
        await fetchProducts();
      } catch (error) {
        console.error(error);
        message.error("Lỗi khi cập nhật sản phẩm");
      } finally {
        setLoading(false);
      }
    },
    [editingProduct, fetchProducts]
  );

  const handleAddImport = useCallback((record) => {
    setAddingImportProduct(record);
    addImportForm.resetFields();
    setAddImportModalVisible(true);
  }, []);

  const handleAddImportFinish = useCallback(
    async (values) => {
      if (!addingImportProduct) return;
      const newImport = {
        importedQty: values.importedQty || 0,
        importVN: values.importVN || 0,
        importKR: values.importKR || 0,
        importDate: values.importDate
          ? values.importDate.format("YYYY-MM-DD")
          : moment().format("YYYY-MM-DD"),
      };
      try {
        const productToUpdate = products.find(
          (product) => product.key === addingImportProduct.key
        );
        if (!productToUpdate) {
          message.error("Sản phẩm không tồn tại");
          return;
        }
        const updatedImports = [...(productToUpdate.imports || []), newImport];
        const response = await axios.put(
          `/api/products/${productToUpdate.key}`,
          { imports: updatedImports }
        );
        message.success(response.data.message || "Cập nhật số lượng nhập thành công");
        setAddImportModalVisible(false);
        setAddingImportProduct(null);
        await fetchProducts();
      } catch (error) {
        console.error(error.response?.data?.error || error.message);
        message.error("Lỗi khi cập nhật số lượng nhập hàng");
        setAddImportModalVisible(false);
        setAddingImportProduct(null);
      }
    },
    [addingImportProduct, products, fetchProducts]
  );

  const handleDeleteProduct = useCallback(
    async (productRecord) => {
      try {
        const response = await axios.delete(`/api/products/${productRecord.key}`);
        message.success(response.data.message);
        await fetchProducts();
      } catch (error) {
        console.error(error);
        message.error("Lỗi khi xóa sản phẩm");
      }
    },
    [fetchProducts]
  );

  /** Paste handler to capture pasted images into upload */
  useEffect(() => {
    const handlePaste = (e) => {
      const items = e.clipboardData?.items || [];
      for (let item of items) {
        if (item.type && item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            const newFile = {
              uid: "-1",
              name: file.name,
              status: "done",
              originFileObj: file,
              url: URL.createObjectURL(file),
            };
            setEditFileList([newFile]);
            editForm.setFieldsValue({ image: [newFile] });
            form.setFieldsValue({ image: [newFile] });
            break;
          }
        }
      }
    };
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [editForm, form]);

  /** Columns (memoized) */
  const columns = useMemo(() => {
    const baseCols = [
      {
        title: "STT",
        key: "stt",
        width: 60,
        align: "center",
        render: (_, record) => (
          <span style={{ fontWeight: 600 }}>{record._stt}</span>
        ),
      },
      {
        title: "Tên sản phẩm",
        dataIndex: "name",
        key: "name",
        render: (text, record) => (
          <Popover
            content={record.description || "Chưa có kịch bản sản phẩm"}
            title="Kịch bản sản phẩm"
            trigger="hover"
          >
            <span>{text}</span>
          </Popover>
        ),
      },
      {
        title: "Nhập tổng",
        key: "importedQty",
        render: (_, record) => {
          const totalImported =
            (record.imports || []).reduce((acc, cur) => {
              return (
                acc +
                (Number(cur.importedQty) || 0) +
                (Number(cur.importVN) || 0) +
                (Number(cur.importKR) || 0)
              );
            }, 0) ;

          const historyContent =
            record.imports && record.imports.length > 0 ? (
              <ul style={{ padding: 0, margin: 0, listStyle: "none" }}>
                {record.imports.map((imp, index) => (
                  <li key={index}>
                    <strong>Ngày:</strong> {imp.importDate} - <strong>SL tổng:</strong>{" "}
                    {Number(imp.importedQty || 0) +
                      Number(imp.importVN || 0) +
                      Number(imp.importKR || 0)}{" "}
                    VN: {imp.importVN || 0} | Hàn: {imp.importKR || 0}
                  </li>
                ))}
              </ul>
            ) : (
              "Chưa có lịch sử nhập"
            );

          return (
            <Popover content={historyContent} title="Lịch sử nhập hàng" trigger="hover">
              <span>{totalImported}</span>
            </Popover>
          );
        },
      },
      {
        title: "Nhập VIỆT",
        key: "importedQtyVN",
        render: (_, record) => {
          const totalImported = (record.imports || []).reduce(
            (acc, cur) => acc + (Number(cur.importVN) || 0),
            0
          );
          const historyContent =
            record.imports && record.imports.length > 0 ? (
              <ul style={{ padding: 0, margin: 0, listStyle: "none" }}>
                {record.imports.map((imp, index) => (
                  <li key={index}>
                    <strong>Ngày:</strong> {imp.importDate} - VN: {imp.importVN || 0}
                  </li>
                ))}
              </ul>
            ) : (
              "Chưa có lịch sử nhập"
            );
          return (
            <Popover content={historyContent} title="Lịch sử nhập hàng" trigger="hover">
              <span>{totalImported}</span>
            </Popover>
          );
        },
      },
      {
        title: "Nhập HÀN",
        key: "importedQtyKR",
        render: (_, record) => {
          const totalImported = (record.imports || []).reduce(
            (acc, cur) => acc + (Number(cur.importKR) || 0),
            0
          );
          const historyContent =
            record.imports && record.imports.length > 0 ? (
              <ul style={{ padding: 0, margin: 0, listStyle: "none" }}>
                {record.imports.map((imp, index) => (
                  <li key={index}>
                    <strong>Ngày:</strong> {imp.importDate} - Hàn: {imp.importKR || 0}
                  </li>
                ))}
              </ul>
            ) : (
              "Chưa có lịch sử nhập"
            );
          return (
            <Popover content={historyContent} title="Lịch sử nhập hàng" trigger="hover">
              <span>{totalImported}</span>
            </Popover>
          );
        },
      },
      {
        title: "Done chưa gửi",
        key: "ordersDone",
        sorter: (a, b) => {
          const aAgg = ordersAggMap[a.name] || { ordersDone: 0 };
          const bAgg = ordersAggMap[b.name] || { ordersDone: 0 };
          return aAgg.ordersDone - bAgg.ordersDone;
        },
        render: (_, record) => {
          const agg = getAggregatesFor(record.name);
          let value = agg.ordersDone;
          if (record.name === "KEM NỀN THỎI") value = value - 2;
          if (record.name === "MẶT NẠ BONG BÓNG") value = value - 28;
          if (record.name === "ĐỒNG HỒ CẢM ỨNG MẶT VUÔNG - ĐEN") value = value - 2;
          if (record.name === "ĐỒNG HỒ CẢM ỨNG MẶT VUÔNG - CAM") value = value - 1;
          if (record.name === "ĐỒNG HỒ CẢM ỨNG MẶT VUÔNG - VÀNG") value = value - 1;
          if (record.name === "KÍNH NỮ") value = value - 1;
          if (record.name === "TAI NGHE AI - TRẮNG") value = value - 2;
          if (record.name === "TAI NGHE AI - TÍM") value = value - 2;
          if (record.name === "GÓI NHUỘM TÓC - ĐEN") value = value - 2;
          if (record.name === "VIÊN TINH CHẤT HÀU") value = value - 6;
          return value;
        },
      },
      {
        title: "Đã giao TC",
        key: "Totaldagui",
        render: (_, record) => {
          const agg = getAggregatesFor(record.name);
          return agg.deliveredQty || 0;
        },
      },
      {
        title: "SL Âm",
        key: "SLAMDONE",
        width: 80,
        sorter: (a, b) => {
          const aAgg = getAggregatesFor(a.name);
          const bAgg = getAggregatesFor(b.name);

          const aImported =
            (a.imports || []).reduce((acc, cur) => {
              return (
                acc +
                (Number(cur.importedQty) || 0) +
                (Number(cur.importVN) || 0) +
                (Number(cur.importKR) || 0)
              );
            }, 0) + (Number(a.slvn) || 0) + (Number(a.sltq) || 0);

          const bImported =
            (b.imports || []).reduce((acc, cur) => {
              return (
                acc +
                (Number(cur.importedQty) || 0) +
                (Number(cur.importVN) || 0) +
                (Number(cur.importKR) || 0)
              );
            }, 0) + (Number(b.slvn) || 0) + (Number(b.sltq) || 0);

          const aSlAm = aImported - aAgg.ordersDone - aAgg.deliveredQty;
          const bSlAm = bImported - bAgg.ordersDone - bAgg.deliveredQty;
          return aSlAm - bSlAm;
        },
        render: (_, record) => {
          const agg = getAggregatesFor(record.name);
          const totalImported =
            (record.imports || []).reduce((acc, cur) => {
              return (
                acc +
                (Number(cur.importedQty) || 0) +
                (Number(cur.importVN) || 0) +
                (Number(cur.importKR) || 0)
              );
            }, 0) + (Number(record.slvn) || 0) + (Number(record.sltq) || 0);

          const slAm = totalImported - (agg.ordersDone || 0) - (agg.deliveredQty || 0);

          const adjust = nameAdjustments[record.name]?.slAmAdd || 0;
          const finalSlAm = slAm + adjust;

          let bgColor = "";
          if (finalSlAm <= 0) bgColor = "#F999A8";
          else if (finalSlAm > 0 && finalSlAm < 10) bgColor = "#FF9501";
          else bgColor = "#54DA1F";

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
              {finalSlAm}
            </div>
          );
        },
      },
      ...((currentUser.position_team !== "mkt"  )
      ? [
      {
  title: "Nhập VN",
  dataIndex: "slvn",
  key: "slvn",
  width: 80,
  render: (_, record) => {
    const historyContent =
      record.slvnHistory && record.slvnHistory.length > 0 ? (
        <ul style={{ padding: 0, margin: 0, listStyle: "none" }}>
          {record.slvnHistory.map((item, index) => (
            <li key={index}>
              <strong>Ngày:</strong> {item.date} - <strong>SL:</strong> {item.qty}
            </li>
          ))}
        </ul>
      ) : (
        "Chưa có lịch sử nhập VN"
      );

    const value =
      record.slvn !== undefined && record.slvn !== null ? Number(record.slvn) : 0;

     const style = {
      fontWeight: value !== 0 ? "bold" : "normal",
      color: value !== 0 ? "#000" : "#999",
      backgroundColor: value !== 0 ? "#e6f7ff" : "transparent",
      padding: "2px 6px",
      borderRadius: "4px",
    };

    return (
      <Popover content={historyContent} title="Lịch sử nhập VN" trigger="hover">
        <span style={style}>{value}</span>
      </Popover>
    );
  },
},
   {
  title: "Nhập HQ",
  key: "sltq",
  width: 80,
  render: (_, record) => {
    const historyContent =
      record.sltqHistory && record.sltqHistory.length > 0 ? (
        <ul style={{ padding: 0, margin: 0, listStyle: "none" }}>
          {record.sltqHistory.map((item, index) => (
            <li key={index}>
              <strong>Ngày:</strong> {item.date} - <strong>SL:</strong> {item.qty}
            </li>
          ))}
        </ul>
      ) : (
        "Chưa có lịch sử nhập HQ"
      );

    const value =
      record.sltq !== undefined && record.sltq !== null ? Number(record.sltq) : 0;

    const style = {
      fontWeight: value !== 0 ? "bold" : "normal",
      color: value !== 0 ? "#000" : "#999",
      backgroundColor: value !== 0 ? "#e6f7ff" : "transparent",
      padding: "2px 6px",
      borderRadius: "4px",
    };

    return (
      <Popover content={historyContent} title="Lịch sử nhập HQ" trigger="hover">
        <span style={style}>{value}</span>
      </Popover>
    );
  },
},
        ]
      : []),



...((currentUser.name !== "nhi"  )
      ? [
     {
  title: "NV Phụ trách",
  dataIndex: "mkttest",
  key: "mkttest",
  width: 200,
  render: (text, record, index) => {
    if (!text) return "";

    return (
      <div style={{ width: 200 }}>
        <h3>{text}</h3>
      </div>
    );
  },
},
        ]
      : []),
 ...((currentUser.name !== "nhii"  )
      ? [
      {
  title: "Ngày lên Data",
  dataIndex: "createdAt",
  key: "createdAt",
  width: 150,
  render: (value) => {
    if (!value) return <span style={{ color: "#94a3b8" }}>—</span>;
    const d = new Date(value);
    if (isNaN(d.getTime())) return <span style={{ color: "#94a3b8" }}>—</span>;
    const pad = (n) => String(n).padStart(2, "0");
    const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const timeStr = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    const now = new Date();
    const diffMs = now - d;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    let badgeColor = "#64748b";
    let badgeText = "";
    if (diffDays === 0) { badgeColor = "#10b981"; badgeText = "Hôm nay"; }
    else if (diffDays === 1) { badgeColor = "#3b82f6"; badgeText = "Hôm qua"; }
    else if (diffDays <= 7) { badgeColor = "#f59e0b"; badgeText = `${diffDays} ngày`; }
    else if (diffDays <= 30) { badgeColor = "#ef4444"; badgeText = `${diffDays} ngày`; }
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 6, lineHeight: 1.2 }}>
        <div style={{
          fontWeight: 700,
          color: "#0f172a",
          fontSize: 13,
          fontVariantNumeric: "tabular-nums",
          letterSpacing: "0.3px",
        }}>
          {dateStr}
        </div>
        <div style={{
          color: "#475569",
          fontSize: 11,
          fontVariantNumeric: "tabular-nums",
          background: "#f1f5f9",
          padding: "2px 6px",
          borderRadius: 4,
          border: "1px solid #e2e8f0",
        }}>
          {timeStr}
        </div>
        {badgeText && (
          <span style={{
            fontSize: 10,
            fontWeight: 600,
            color: "white",
            background: badgeColor,
            padding: "2px 6px",
            borderRadius: 10,
          }}>
            {badgeText}
          </span>
        )}
      </div>
    );
  },
},
        ]
      : []),
 ];

    if ((currentUser?.name || "").toLowerCase() !== "nhii") {
      baseCols.push(
        {
        title: "Tổng doanh số",
        key: "totalProfit",
        width:150,
        render: (_, record) => {
          const agg = getAggregatesFor(record.name);
          const totalProfit = agg.totalProfit  || 0;
          let bgColor = "";
          if (totalProfit >= 100000000) bgColor = "blue";
          else if (totalProfit >= 50000000) bgColor = "yellow";
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
              {(totalProfit * 17000).toLocaleString()} VND
            </div>
          );
        },
        sorter: (a, b) => {
          const aAgg = getAggregatesFor(a.name);
          const bAgg = getAggregatesFor(b.name);
          return (aAgg.totalProfit || 0) - (bAgg.totalProfit || 0);
        },
      });
    }

    if (
      currentUser?.position === "managerSALEeeee"
    ) {
      baseCols.push({
        title: "Hình ảnh",
        key: "image",
        render: (_, record) =>
          record.image ? <img src={record.image} alt="product" style={{ width: 80 }} /> : "Không có ảnh",
      });
    }

    return baseCols;
  }, [getAggregatesFor, getSlAmFor, handleAddImport, handleEditProduct, handleDeleteProduct, currentUser, ordersAggMap]);

  /** Form submit: create new product */
  const onFinish = useCallback(
    async (values) => {
      const file = values.image?.[0];
      const base64Image = file ? await getBase64(file.originFileObj) : null;

      const newProduct = {
        key: Date.now(),
        name: values.name,
        image: base64Image,
        description: values.description,
        importedQty: values.importedQty,
        status: true,
        slvn: 0,
        sltq: 0,
        imports: [
          {
            importedQty: values.importedQty || 0,
            importDate: moment().format("YYYY-MM-DD"),
          },
        ],
      };

      try {
        const response = await axios.post("/api/products", newProduct);
        message.success(response.data.message || "Thêm sản phẩm thành công");
        await fetchProducts();
        form.resetFields();
      } catch (error) {
        console.error(error);
        message.error("Lỗi khi thêm sản phẩm");
      }
    },
    [form, fetchProducts]
  );

  const handleBulkUpdate = async () => {
  if (selectedRowKeys.length === 0) {
    message.warning("Chưa chọn sản phẩm");
    return;
  }

  try {
    setLoading(true);

    await axios.put("/api/products/bulk-update", {
      keys: selectedRowKeys,
      mkttest: bulkMkt,
      testday: bulkDate
        ? bulkDate.format("YYYY-MM-DD")
        : null,
    });

    message.success("Cập nhật hàng loạt thành công");

    setSelectedRowKeys([]);
    setBulkMkt(null);
    setBulkDate(null);

    fetchProducts();
  } catch (err) {
    console.error(err);
    message.error("Lỗi cập nhật");
  } finally {
    setLoading(false);
  }
};

  const handleBulkUpdate2 = async () => {
  if (selectedRowKeys.length === 0) {
    message.warning("Chưa chọn sản phẩm");
    return;
  }

  try {
    setLoading(true);

    await axios.put("/api/products/bulk-update2", {
      keys: selectedRowKeys,
      mkttest: bulkMkt,
      testday: bulkDate
        ? bulkDate.format("YYYY-MM-DD")
        : null,
    });

    message.success("Cập nhật hàng loạt thành công");

    setSelectedRowKeys([]);
    setBulkMkt(null);
    setBulkDate(null);

    fetchProducts();
  } catch (err) {
    console.error(err);
    message.error("Lỗi cập nhật");
  } finally {
    setLoading(false);
  }
};

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%)",
        padding: 0,
      }}
    >
    <div style={{ padding: "32px 24px" }}>

      {loading && (
        <div className="lockprod-loader-overlay">
          <div className="lockprod-loader" />
          <div style={{ fontSize: 14, color: "#92400e", fontWeight: 500 }}>Đang tải dữ liệu...</div>
        </div>
      )}

      {/* Header */}
      <div className="lockprod-header">
        <div className="lockprod-title">
          <span className="lockprod-title-icon">🔥</span>
          <div className="lockprod-title-text">
            <h1>Sản phẩm bán chạy</h1>
          </div>
        </div>
        <div className="lockprod-mode-switch">
          <button
            className={`lockprod-mode-btn ${viewMode === "sp-am" ? "active" : ""}`}
            onClick={() => setViewMode("sp-am")}
            type="button"
          >
            🔥 SP bán chạy
          </button>
          <button
            className={`lockprod-mode-btn ${viewMode === "all" ? "active" : ""}`}
            onClick={() => setViewMode("all")}
            type="button"
          >
            <AppstoreOutlined style={{ marginRight: 6 }} />
            Tất cả
          </button>
        </div>
        <div className="lockprod-stat-badge">
          <span className="lockprod-stat-label">Tổng sản phẩm:</span>
          <span className="lockprod-stat-value">{animatedCount}</span>
          <span className="lockprod-stat-label" style={{ marginLeft: 16 }}>Số lượng:</span>
          <span className="lockprod-stat-value">{animatedVariants}</span>
        </div>
      </div>

      <div
        className="prod-filter-bar lockprod-filter"
      >
        <AppstoreOutlined style={{ color: "var(--gold)", fontSize: 20, flexShrink: 0 }} />
        <Input
          ref={searchInputRef}
          placeholder="Tìm tên sản phẩm..."
          onPressEnter={(e) => setSearchText(e.target.value.trim())}
          onChange={(e) => {
            const v = e.target.value;
            // Cập nhật ngay khi giá trị thay đổi (bao gồm cả khi user xóa hết)
            if (v === "") setSearchText("");
          }}
          className="lockprod-search-input"
          style={{ width: 240, flexShrink: 0 }}
          prefix={<SearchOutlined style={{ fontSize: "14px", color: "#fbbf24" }} />}
          allowClear
        />
        <Button
          type="primary"
          icon={<SearchOutlined />}
          className="lockprod-search-btn"
          onClick={() => {
            const value = searchInputRef.current?.input?.value || "";
            setSearchText(value.trim());
          }}
        >
          Tìm kiếm
        </Button>
        <DatePicker.RangePicker
          className="lockprod-date-range"
          style={{ width: 240 }}
          onChange={(dates) => {
            setCreatedAtRange(dates);
            setLastFilterType("createdAt");
          }}
          format="YYYY-MM-DD"
          placeholder={["Từ ngày lên data", "Đến ngày lên data"]}
        />

        {searchText && searchText.trim() !== "" && (
          <div className="lockprod-revenue-badge">
            <span className="lockprod-revenue-label">Tổng:</span>
            <span className="lockprod-revenue-value">{(animatedRevenue * 17000).toLocaleString()} VND</span>
          </div>
        )}
      </div>
      <div className="lockprod-table-wrap">
        <Table
          sticky
          dataSource={filteredProducts.map((p, i) => ({ ...p, _stt: i + 1 }))}
          columns={columns}
          rowKey="key"
          pagination={{
            pageSize: 100,
            showSizeChanger: true,
            pageSizeOptions: ['50', '100', '200'],
            showTotal: (total, range) => (
              <span style={{ color: "var(--sub)", fontWeight: 600 }}>
                {range[0]}-{range[1]} / {total} SP
              </span>
            )
          }}
          scroll={{ x: 1500 }}
          className="lockprod-table"
          style={{ minWidth: 1200 }}
        />
      </div>

      {/* Edit Modal */}
      <Modal
        className="prod-modal"
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <EditOutlined style={{ color: "var(--gold)" }} />
            <span>Chỉnh sửa sản phẩm</span>
          </div>
        }
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
        width={600}
        centered
      >
        <Form form={editForm} onFinish={handleEditProductFinish} layout="vertical" className="prod-form-item">
          <Form.Item name="name" label="Tên sản phẩm" rules={[{ required: true, message: "Vui lòng nhập tên sản phẩm" }]}>
            <Input placeholder="Nhập tên sản phẩm" />
          </Form.Item>
          <Form.Item label="Kịch bản sản phẩm" name="description" hidden>
            <Input.TextArea rows={2} placeholder="Kịch bản sản phẩm" />
          </Form.Item>
          <Form.Item label="NV Phụ trách" name="mkttest" >
             <Select allowClear showSearch placeholder="Chọn NV Phụ trách">
                                {mktOptions.map((report) => (
                                  <Option key={report} value={report}>
                                    {report}
                                  </Option>
                                ))}
                              </Select>
          </Form.Item>
           <Form.Item name="testday" label="Ngày khóa" >
            <DatePicker initialValue={moment()} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item hidden
            name="image"
            valuePropName="fileList"
            getValueFromEvent={(e) => (e?.fileList && e.fileList.length > 0 ? [e.fileList[0]] : [])}
          >
            <Upload
              listType="picture"
              maxCount={1}
              fileList={editFileList}
              onChange={({ fileList }) => {
                setEditFileList(fileList);
                editForm.setFieldsValue({ image: fileList });
              }}
              beforeUpload={() => false}
            >
              <Button icon={<UploadOutlined />}>Chọn ảnh hoặc dán ảnh</Button>
            </Upload>
          </Form.Item>

          <div style={{ display: "flex", gap: 16 }}>
            <Form.Item label="Nhập VN" name="slvn" style={{ flex: 1 }}>
              <InputNumber placeholder="Số lượng" style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item label="Nhập HQ" name="sltq" style={{ flex: 1 }}>
              <InputNumber placeholder="Số lượng" style={{ width: "100%" }} />
            </Form.Item>
          </div>

          <div className="prod-modal-footer">
            <button
              className="btn-prod-ghost"
              onClick={() => setEditModalVisible(false)}
              style={{ padding: "8px 20px" }}
            >
              Hủy
            </button>
            <button
              className="btn-prod-primary"
              type="submit"
              disabled={loading}
              style={{ padding: "8px 24px", display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              {loading ? <Spin size="small" /> : <CheckCircleOutlined />}
              Lưu thay đổi
            </button>
          </div>
        </Form>
      </Modal>

      {/* Add Import Modal */}
      <Modal
        className="prod-modal"
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <HistoryOutlined style={{ color: "var(--blue)" }} />
            <span>Thêm số lượng nhập: {addingImportProduct ? addingImportProduct.name : ""}</span>
          </div>
        }
        open={addImportModalVisible}
        onCancel={() => setAddImportModalVisible(false)}
        footer={null}
        width={500}
        centered
      >
        <Form form={addImportForm} onFinish={handleAddImportFinish} layout="vertical" className="prod-form-item">
          <Form.Item name="importedQty" label="Số lượng nhập tổng" rules={[{ required: true, message: "Vui lòng nhập số lượng" }]}>
            <InputNumber style={{ width: "100%" }} placeholder="Nhập số lượng" />
          </Form.Item>

          <Form.Item name="importVN" label="Nhập về Việt Nam">
            <InputNumber style={{ width: "100%" }} placeholder="Số lượng về VN" />
          </Form.Item>

          <Form.Item name="importKR" label="Nhập về Hàn Quốc">
            <InputNumber style={{ width: "100%" }} placeholder="Số lượng về Hàn" />
          </Form.Item>

          <Form.Item name="importDate" label="Ngày nhập" rules={[{ required: true, message: "Vui lòng chọn ngày nhập" }]}>
            <DatePicker initialValue={moment()} style={{ width: "100%" }} />
          </Form.Item>

          <div className="prod-modal-footer">
            <button
              className="btn-prod-ghost"
              onClick={() => setAddImportModalVisible(false)}
              style={{ padding: "8px 20px" }}
            >
              Hủy
            </button>
            <button
              className="btn-prod-success"
              type="submit"
              style={{ padding: "8px 24px", display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <CheckCircleOutlined />
              Lưu
            </button>
          </div>
        </Form>
      </Modal>

      {/* Preview Modal */}
      <Modal
        className="prod-modal"
        open={previewVisible}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <AppstoreOutlined style={{ color: "var(--gold)" }} />
            <span>Xem ảnh sản phẩm</span>
          </div>
        }
      >
        {Array.isArray(previewImage) ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", justifyContent: "center" }}>
            {previewImage.map((img, idx) => (
              <img key={idx} src={img} alt={`preview-${idx}`} style={{ width: "120px", height: "auto", borderRadius: 8, border: "1px solid var(--border)" }} />
            ))}
          </div>
        ) : (
          <img src={previewImage} alt="Preview" style={{ width: "100%", borderRadius: 8 }} />
        )}
      </Modal>
    </div></div>
  );
}
