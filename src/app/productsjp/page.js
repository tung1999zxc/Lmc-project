"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Table,
  Form,
  Input,
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
import FullScreenLoading from "../components/FullScreenLoading";

import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  UploadOutlined,
  SearchOutlined,
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

// const dapviet = Form.useWatch("importVN", editForm);

  
//   useEffect(() => {
//   const numericProfit = Number(dapviet); // chuyển về số
//   if (numericProfit !== 0) {
//     editForm.setFieldsValue({
//       importKR: 0 - numericProfit, // ngày giờ hiện tại
//     });
//   }
//   if (numericProfit === 0) {
//     editForm.setFieldsValue({
//       importKR: 0, // ngày giờ hiện tại
//     });
//   }
// }, [dapviet]);
// const revenue = Form.useWatch("revenue", form);

  
//   useEffect(() => {
//   const numericProfit = Number(revenue); // chuyển về số
//   if (numericProfit === 0) {
//     form.setFieldsValue({
//       orderDate5: dayjs(), // ngày giờ hiện tại
//     });
//   }
//   if (numericProfit !== 0) {
//     form.setFieldsValue({
//       orderDate5: null, // ngày giờ hiện tại
//     });
//   }
// }, [revenue]);
/**
 * InventoryPage (Optimized)
 * - Pre-aggregates orders per product to avoid per-row heavy computations
 * - Memoizes columns and derived lists
 * - Uses callbacks for handlers
 */
const InventoryPage = () => {
  const router = useRouter();
  const currentUser = useSelector((state) => state.user.currentUser || {});
  useEffect(() => {
    // redirect if not logged in or restrictions
    if (!currentUser?.name) {
      router.push("/login");
    } else if (currentUser.position_team === "mkt"&& currentUser.name !== "Đỗ Ngọc Ánh") {
      router.push("/orders");
    } else if (currentUser.name === "Đỗ Ngọc Ánh") {
       router.push("/products");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.name]);

  // Data
  const [orders2, setOrders] = useState([]);
  const [products, setProducts] = useState([]);

  // Forms
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [addImportForm] = Form.useForm();

  // UI state
  const [searchText, setSearchText] = useState("");
  const [selectedPreset, setSelectedPreset] = useState("all");

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [addImportModalVisible, setAddImportModalVisible] = useState(false);
  const [addingImportProduct, setAddingImportProduct] = useState(null);

  const [loading, setLoading] = useState(false);

  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const [editFileList, setEditFileList] = useState([]);

  // Fetch functions
  const fetchOrders = useCallback(async () => {
    try {
      const response = await axios.get("/api/jp/orderssanpham");
      setOrders(response.data.data || []);
    } catch (error) {
      console.error(error);
      message.error("Lỗi khi lấy đơn hàng");
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/jp/products");
      setProducts(response.data.data || []);
    } catch (error) {
      console.error(error);
      message.error("Lỗi khi lấy danh sách sản phẩm");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchProducts();
  }, [fetchOrders, fetchProducts]);

  /** ===========
   * Date filter helpers (same behavior as original)
   * =========== */
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

  /** ===========
   * Precompute aggregations from orders to avoid per-row heavy computations
   * - ordersAggMap: {
   *     [productName]: {
   *       ordersDone: number,
   *       deliveredQty: number,
   *       ordersNotDone: number,
   *       totalProfit: number
   *     }
   *   }
   * This map is recalculated only when orders2 changes.
   * =========== */
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
            ordersHOAN: 0,
            deliveredQty: 0,
            ordersNotDone: 0,
            totalProfit: 0,
          };
        }

        // Count order-level profit into product (approx same as original logic)
        // Original added whole order.profit if product exists in order.
        map[pname].totalProfit += profitNum;

        // Count delivered
        if (
          deliveryStatus === "ĐÃ GỬI HÀNG" ||
          deliveryStatus === "GIAO THÀNH CÔNG" ||
          deliveryStatus === "VẮNG MẶT" ||
          deliveryStatus === "HẸN GIAO LẠI" ||
          deliveryStatus === "CUỘC ĐIỀU TRA"
        ) {
          map[pname].deliveredQty += qty;
        }

        // Count ordersDone where saleReport === DONE && deliveryStatus === ""
        if (saleReport === "DONE" && (!deliveryStatus || deliveryStatus === "")) {
          map[pname].ordersDone += qty;
        }
        if (saleReport === "DONE" &&  deliveryStatus === "HOÀN") {
          map[pname].ordersHOAN += qty;
        }

        // Count ordersNotDone
        if (saleReport !== "DONE") {
          map[pname].ordersNotDone += qty;
        }
      }
    }
    return map;
  }, [orders2]);

  /** ===========
   * filteredProducts: search by name.
   * This is memoized so Table sees stable reference when inputs unchanged.
   * =========== */
  const filteredProducts = useMemo(() => {
    const q = (searchText || "").trim().toLowerCase();
    if (!q) return products || [];
    return (products || []).filter((p) =>
      String(p.name || "").toLowerCase().includes(q)
    );
  }, [products, searchText]);

  /** Compute derived "orders" list filtered by preset to match original behavior */
  const ordersByPreset = useMemo(() => {
    if (selectedPreset === "all") return orders2;
    return filterByPreset(orders2, selectedPreset);
  }, [orders2, selectedPreset]);

  /** totalRevenue logic (keeps original behavior: calculate only when searchText not empty) */
  const totalRevenue = useMemo(() => {
    if (!searchText || searchText.trim() === "") return 0;
    const q = (searchText || "").trim().toLowerCase();
    const targetProducts = (products || []).filter((p) =>
      String(p.name || "").toLowerCase().includes(q)
    );
    if (targetProducts.length === 0) return 0;

    // For efficiency, use ordersAggMap? Original sums order.profit for orders that include product.
    // We'll compute by iterating orders2 once and checking inclusion with a Set per product name.
    let total = 0;
    const productNames = new Set(targetProducts.map((p) => p.name));
    for (const order of orders2) {
      if (!order.products || !Array.isArray(order.products)) continue;
      const includes = order.products.some((it) => productNames.has(it.product));
      if (includes) total += Number(order.profit || 0);
    }
    return total;
  }, [searchText, products, orders2]);

  /** ===========
   * Helpers for product-level values (useAggMap for O(1) access)
   * ===========
   */
  const getAggregatesFor = useCallback(
    (productName) => {
      return ordersAggMap[productName] || {
        ordersDone: 0,
        ordersHOAN: 0,
        deliveredQty: 0,
        ordersNotDone: 0,
        totalProfit: 0,
      };
    },
    [ordersAggMap]
  );

  // Name-specific manual adjustments from original file
  const nameAdjustments = useMemo(
    () => ({
      "KEM NỀN THỎIii": { slAmAdd: 2 },
     
    }),
    []
  );

  /** ===========
   * Handlers (memoized)
   * =========== */
  const handleEditProduct = useCallback(
    (record) => {
      setEditingProduct(record);
      editForm.setFieldsValue({
        name: record.name,
        slvn: record.slvn,
        sltq: record.sltq,
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
          slvn: values.slvn,
          sltq: values.sltq,
        };
        await axios.put(`/api/jp/products/${editingProduct.key}`, updatedProduct);
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
        // find product
        const productToUpdate = products.find(
          (product) => product.key === addingImportProduct.key
        );
        if (!productToUpdate) {
          message.error("Sản phẩm không tồn tại");
          return;
        }
        const updatedImports = [...(productToUpdate.imports || []), newImport];
        const response = await axios.put(
          `/api/jp/products/${productToUpdate.key}`,
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
        const response = await axios.delete(`/api/jp/products/${productRecord.key}`);
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

  /** ===========
   * Columns (memoized) — light-weight render functions that use precomputed maps
   * ===========
   */
  const columns = useMemo(() => {
    const baseCols = [
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
        title: "Đáp Nhật",
        key: "importedQty",
        render: (_, record) => {
          const agg = getAggregatesFor(record.name);
          const totalImported =
            (record.imports || []).reduce((acc, cur) => {
              return (
                acc +
                (Number(cur.importedQty) || 0) 
              );
            }, 0) ;

          const historyContent =
            record.imports && record.imports.length > 0 ? (
              <ul style={{ padding: 0, margin: 0, listStyle: "none" }}>
                {record.imports.map((imp, index) => (
                  <li key={index}>
                    <strong>Ngày:</strong> {imp.importDate} - <strong>SL tổng:</strong>{" "}
                    {Number(imp.importedQty || 0)}
                    
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
        title: "Đáp Việt",
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
        title: "Báo Nhập",
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
                    <strong>Ngày:</strong> {imp.importDate} - SL: {imp.importKR || 0}
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
        title: "DONE + Chưa đóng",
        key: "ordersDone",
        sorter: (a, b) => {
          // Use precomputed map for sorting
          const aAgg = ordersAggMap[a.name] || { ordersDone: 0 };
          const bAgg = ordersAggMap[b.name] || { ordersDone: 0 };
          return aAgg.ordersDone - bAgg.ordersDone;
        },
        render: (_, record) => {
          const agg = getAggregatesFor(record.name);
          // original had special-case subtractions for a few product names
          let value = agg.ordersDone;
         
          return value;
        },
      },
      {
        title: "DONE + Đã đóng",
        key: "Totaldagui",
        render: (_, record) => {
          const agg = getAggregatesFor(record.name);
          return agg.deliveredQty || 0;
        },
      },
      {
        title: "Hoàn",
        key: "Totalhoan",
        render: (_, record) => {
          const agg = getAggregatesFor(record.name);
          return agg.ordersHOAN || 0;
        },
      },
      {
        title: "SL Âm (DONE - Đã nhập)",
        key: "SLAMDONE",
        width: 120,
        sorter: (a, b) => {
          const aAgg = getAggregatesFor(a.name);
          const bAgg = getAggregatesFor(b.name);

          // totalImported: compute from product record (cheap)
          const aImported =
            (a.imports || []).reduce((acc, cur) => {
              return (
                acc +
                (Number(cur.importedQty) || 0) 
              
              );
            }, 0) + (Number(a.slvn) || 0) + (Number(a.sltq) || 0);

          const bImported =
            (b.imports || []).reduce((acc, cur) => {
              return (
                acc +
                (Number(cur.importedQty) || 0) 
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
                (Number(cur.importedQty) || 0) 
                +
                (Number(cur.importVN) || 0) +
                (Number(cur.importKR) || 0) 
              );
            }, 0) + (Number(record.slvn) || 0) + (Number(record.sltq) || 0) + agg.ordersHOAN;

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
//       {
//   title: "Nhập VN",
//   dataIndex: "slvn",
//   key: "slvn",
//   width: 80,
//   render: (_, record) => {
//     const historyContent =
//       record.slvnHistory && record.slvnHistory.length > 0 ? (
//         <ul style={{ padding: 0, margin: 0, listStyle: "none" }}>
//           {record.slvnHistory.map((item, index) => (
//             <li key={index}>
//               <strong>Ngày:</strong> {item.date} - <strong>SL:</strong> {item.qty}
//             </li>
//           ))}
//         </ul>
//       ) : (
//         "Chưa có lịch sử nhập VN"
//       );

//     const value =
//       record.slvn !== undefined && record.slvn !== null ? Number(record.slvn) : 0;

//     // ✅ Nếu có giá trị khác 0 thì bôi đậm
//      const style = {
//       fontWeight: value !== 0 ? "bold" : "normal",
//       color: value !== 0 ? "#000" : "#999",
//       backgroundColor: value !== 0 ? "#e6f7ff" : "transparent",
//       padding: "2px 6px",
//       borderRadius: "4px",
//     };

//     return (
//       <Popover content={historyContent} title="Lịch sử nhập VN" trigger="hover">
//         <span style={style}>{value}</span>
//       </Popover>
//     );
//   },
// },
//    {
//   title: "Báo nhập",
//   key: "sltq",
//   width: 80,
//   render: (_, record) => {
//     const historyContent =
//       record.sltqHistory && record.sltqHistory.length > 0 ? (
//         <ul style={{ padding: 0, margin: 0, listStyle: "none" }}>
//           {record.sltqHistory.map((item, index) => (
//             <li key={index}>
//               <strong>Ngày:</strong> {item.date} - <strong>SL:</strong> {item.qty}
//             </li>
//           ))}
//         </ul>
//       ) : (
//         "Chưa có lịch sử nhập JP"
//       );

//     const value =
//       record.sltq !== undefined && record.sltq !== null ? Number(record.sltq) : 0;

//     const style = {
//       fontWeight: value !== 0 ? "bold" : "normal",
//       color: value !== 0 ? "#000" : "#999",
//       backgroundColor: value !== 0 ? "#e6f7ff" : "transparent",
//       padding: "2px 6px",
//       borderRadius: "4px",
//     };

//     return (
//       <Popover content={historyContent} title="Lịch sử nhập JP" trigger="hover">
//         <span style={style}>{value}</span>
//       </Popover>
//     );
//   },
// },
      {
        title: "Hành động",
        key: "actions",
        width: 120,
        fixed: "left",
        render: (_, record) => {
          if (
            currentUser?.position === "admin" ||
            currentUser?.position === "managerSALE" ||
            currentUser?.name === "Đỗ Uyển Nhi" || currentUser?.name === "Diệp Anh"
          ) {
            return (
              <Space>
                <Button disabled={currentUser?.name === "Diệp Anh"} icon={<PlusOutlined />} onClick={() => handleAddImport(record)} />
                {/* <Button icon={<EditOutlined />} onClick={() => handleEditProduct(record)} /> */}
                <Popconfirm title="Xóa bản ghi?" onConfirm={() => handleDeleteProduct(record)}>
                  <Button danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </Space>
            );
          } else return <span>Chỉ xem</span>;
        },
      },
    ];

    // Conditionally add "Tổng doanh số" column if currentUser.name !== "nhii"
    if ((currentUser?.name || "").toLowerCase() !== "nhii") {
      baseCols.push({
        title: "Tổng doanh số",
        key: "totalProfit",
        render: (_, record) => {
          const agg = getAggregatesFor(record.name);
          const totalProfit = agg.totalProfit || 0;
          let bgColor = "";
          if (totalProfit >= 666666) bgColor = "#acdb77ff";
          else if (totalProfit >= 333333) bgColor = "#3de6d0ff";
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
              {(totalProfit * 150).toLocaleString()} VND
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

    // Conditionally add image column for some user positions
    // if (
    //   currentUser?.position === "managerSALE" ||
    //   currentUser?.position === "leadSALE" ||
    //   currentUser?.name === "Tung99" ||
    //   currentUser?.name === "Hoàng Thị Trà My"
    // ) {
    //   baseCols.push({
    //     title: "Hình ảnh",
    //     key: "image",
    //     render: (_, record) =>
    //       record.image ? <img src={record.image} alt="product" style={{ width: 80 }} /> : "Không có ảnh",
    //   });
    // }

    return baseCols;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getAggregatesFor, handleAddImport, handleEditProduct, handleDeleteProduct, currentUser, ordersAggMap]);

  /** ===========
   * Form submit: create new product (preserve original behavior)
   * =========== */
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
        const response = await axios.post("/api/jp/products", newProduct);
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

  /** ===========
   * UI render
   * =========== */
  return (
    <div style={{ padding: 24 }}>
      <FullScreenLoading loading={loading} tip="Đang tải dữ liệu..." />
      <Form form={form} layout="inline" onFinish={onFinish} style={{ marginBottom: 16 }}>
        <Form.Item name="name" rules={[{ required: true, message: "Vui lòng nhập tên sản phẩm" }]}>
          <Input placeholder="Tên sản phẩm" />
        </Form.Item>
        <Form.Item name="importedQty">
          <InputNumber placeholder="SL nhập hàng" min={0} />
        </Form.Item>
        <Form.Item name="description">
          <Input.TextArea rows={1} placeholder="Kịch bản sản phẩm" />
        </Form.Item>
        <Form.Item
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
            {/* intentionally empty button previously commented */}
          </Upload>
        </Form.Item>
        <Form.Item>
          <Button
            disabled={
              currentUser?.position !== "admin" &&
              currentUser?.position !== "leadSALE" &&
              currentUser?.position !== "managerSALE" && currentUser?.position  !== "salenhapdon"
            }
            type="primary"
            htmlType="submit"
          >
            Thêm sản phẩm
          </Button>
        </Form.Item>
      </Form>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <Input
          placeholder="Tìm tên sản phẩm"
          onPressEnter={(e) => setSearchText(e.target.value.trim())}
          style={{ width: 300 }}
          suffix={<SearchOutlined style={{ fontSize: "16px", color: "#1890ff" }} />}
        />

        <Select value={selectedPreset} onChange={(value) => setSelectedPreset(value)} style={{ width: 200 }}>
          <Option value="all">Tất cả</Option>
          <Option value="today">Hôm Nay</Option>
          <Option value="yesterday">Hôm Qua</Option>
          <Option value="week">1 Tuần gần nhất</Option>
          <Option value="currentMonth">1 Tháng (Từ đầu tháng đến hiện tại)</Option>
          <Option value="2currentMonth">2 Tháng (Từ đầu tháng đến hiện tại)</Option>
          <Option value="3currentMonth">3 Tháng (Từ đầu tháng đến hiện tại)</Option>
          <Option value="lastMonth">Tháng trước</Option>
          <Option value="twoMonthsAgo">2 Tháng trước</Option>
          <Option value="threeMonthsAgo">3 Tháng trước</Option>
        </Select>

        <div style={{ fontWeight: "bold", fontSize: "16px" }}>
          Tổng:{" "}
          <span style={{ color: "blue" }}>{(totalRevenue * 150).toLocaleString()} VND</span>
        </div>
      </div>

      <Table
        sticky
        dataSource={filteredProducts}
        columns={columns}
        rowKey="key"
        pagination={{ pageSize: 100 }}
      />

      {/* Edit Modal */}
      <Modal title="Chỉnh sửa sản phẩm" visible={editModalVisible} onCancel={() => setEditModalVisible(false)} footer={null}>
        <Form form={editForm} onFinish={handleEditProductFinish} layout="vertical">
          <Form.Item name="name" label="Tên sản phẩm" rules={[{ required: true, message: "Vui lòng nhập tên sản phẩm" }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Kịch bản sản phẩm" name="description">
            <Input.TextArea rows={2} placeholder="Kịch bản sản phẩm" />
          </Form.Item>
          <Form.Item
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

          {/* <Form.Item label="Nhập VN" name="slvn">
            <InputNumber placeholder="nhập sl" />
          </Form.Item> */}
          <Form.Item label="Báo nhập" name="sltq">
            <InputNumber placeholder="nhập sl" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit">
              {loading ? <Spin /> : "Lưu"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Add Import Modal */}
      <Modal
        title={`Thêm số lượng nhập cho: ${addingImportProduct ? addingImportProduct.name : ""}`}
        visible={addImportModalVisible}
        onCancel={() => setAddImportModalVisible(false)}
        footer={null}
      >
        <Form form={addImportForm} onFinish={handleAddImportFinish} layout="vertical">
          <Form.Item name="importedQty" label="Đáp Nhật">
            <InputNumber style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item name="importVN" label="Đáp Việt">
            <InputNumber style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item name="importKR" label="Báo Nhập">
            <InputNumber style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item name="importDate" label="Ngày nhập" rules={[{ required: true, message: "Vui lòng chọn ngày nhập" }]}>
            <DatePicker initialValue={moment()} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit">
              Lưu
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Preview Modal */}
      <Modal visible={previewVisible} footer={null} onCancel={() => setPreviewVisible(false)}>
        {Array.isArray(previewImage) ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            {previewImage.map((img, idx) => (
              <img key={idx} src={img} alt={`preview-${idx}`} style={{ width: "100px", height: "auto" }} />
            ))}
          </div>
        ) : (
          <img src={previewImage} alt="Preview" style={{ width: "100%" }} />
        )}
      </Modal>
    </div>
  );
};

export default InventoryPage;
