'use client'
import React, { useState, useEffect } from 'react';
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
  Upload,message
} from 'antd';
import moment from 'moment';
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  UploadOutlined
} from '@ant-design/icons';
import axios from "axios";
import { useDispatch, useSelector } from 'react-redux';

const { Search } = Input;
const { Option } = Select;

// Hàm chuyển file sang base64
const getBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
};
import { useRouter } from 'next/navigation';

const InventoryPage = () => {
  const router = useRouter(); 
  const currentUser = useSelector((state) => state.user.currentUser);
  useEffect(() => {
    if (!currentUser.name) {
      router.push("/login");
    }if (currentUser.position==="kho1"||currentUser.position_team ==="mkt") {
      router.push("/orders");}
  }, []);

  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editForm] = Form.useForm();

  const [addImportModalVisible, setAddImportModalVisible] = useState(false);
  const [addingImportProduct, setAddingImportProduct] = useState(null);
  const [addImportForm] = Form.useForm();

  const [previewVisible, setPreviewVisible] = useState(false);
  // previewImage có thể là mảng ảnh (base64 strings)
  const [previewImage, setPreviewImage] = useState(null);


  const fetchOrders = async () => {
    try {
      const response = await axios.get("/api/orders");
      setOrders(response.data.data);
     
    } catch (error) {
      console.error(error);
      message.error("Lỗi khi lấy đơn hàng");
    }
  };
  
  useEffect(() => {
    fetchOrders();
    fetchProducts();
  }, []);
  
  const getTotalImportedQty = (product) => {
    if (product.imports && product.imports.length > 0) {
      return (product.imports.reduce((acc, cur) => acc + cur.importedQty, 0)+(product.slvn||0)+(product.sltq||0));
    }
    return 0;
  };
  const fetchProducts = async () => {
    try {
      const response = await axios.get('/api/products');
      setProducts(response.data.data);
    } catch (error) {
      console.error(error);
      message.error("Lỗi khi lấy danh sách sản phẩm");
    }
  };
  
  // Khi thêm sản phẩm mới, chuyển các file ảnh sang base64 trước lưu
  const onFinish = async (values) => {
    const fileList = values.images || []; // Sửa ở đây
    const base64Images = await Promise.all(
      fileList.map((file) => getBase64(file.originFileObj))
    );

    const newProduct = {
      key: Date.now(),
      name: values.name,
      images: base64Images,
      description: values.description,
      importedQty: values.importedQty,
      slvn: 0,
      sltq: 0,
      imports: [
        {
          importedQty: values.importedQty,
          importDate: moment().format('YYYY-MM-DD'),
        },
      ],
    };

    // Gọi API để lưu vào MongoDB nếu cần (API backend cần được xây dựng riêng)
    try {
      const response = await axios.post('/api/products', newProduct);
      message.success(response.data.message);
      fetchProducts();
      form.resetFields();
    } catch (error) {
      console.error(error);
      message.error("Lỗi khi thêm sản phẩm");
    }

  
  };

  const handleEditProduct = (record) => {
    setEditingProduct(record);
    editForm.setFieldsValue({ name: record.name,slvn:record.slvn,sltq:record.sltq, description: record.description ,images : record.images});
    setEditModalVisible(true);
  };

  const handleEditProductFinish = async (values) => {
    try {
      // Đảm bảo values.images là một mảng
     
  
      const updatedProduct = {
        name: values.name,
        description: values.description,
        slvn:values.slvn,
        sltq:values.sltq
      };
  
      const response = await axios.put(`/api/products/${editingProduct.key}`, updatedProduct);
      message.success(response.data.message || "Cập nhật sản phẩm thành công");
      fetchProducts();
      setEditModalVisible(false);
      setEditingProduct(null);
    } catch (error) {
      console.error(error.response?.data?.error || error.message);
      message.error("Lỗi khi cập nhật sản phẩm");
    }
  };
  
  const handleAddImport = (record) => {
    // Lưu sản phẩm cần cập nhật vào state
    setAddingImportProduct(record);
    // Reset form nhập hàng (nếu bạn muốn đảm bảo form trống khi mở modal)
    addImportForm.resetFields();
    // Hiển thị modal thêm nhập
    setAddImportModalVisible(true);
  };
  const handleAddImportFinish = async (values) => {
    const newImport = {
      importedQty: values.importedQty,
      importDate: values.importDate.format('YYYY-MM-DD'),
    };
  
    try {
      // Tìm sản phẩm cần cập nhật
      const productToUpdate = products.find(
        (product) => product.key === addingImportProduct.key
      );
      if (!productToUpdate) {
        message.error("Sản phẩm không tồn tại");
        return;
      }
  
      // Tạo mảng imports mới
      const updatedImports = [...(productToUpdate.imports || []), newImport];
  
      // Gọi API PUT để cập nhật trường imports của sản phẩm
      const response = await axios.put(
        `/api/products/${productToUpdate.key}`,
        { imports: updatedImports }
      );
  
      message.success(response.data.message || "Cập nhật số lượng nhập thành công");
      // Làm mới danh sách sản phẩm từ API
      fetchProducts();
    } catch (error) {
      console.error(error.response?.data?.error || error.message);
      message.error("Lỗi khi cập nhật số lượng nhập hàng");
    } finally {
      setAddImportModalVisible(false);
      setAddingImportProduct(null);
    }
  };

  const handleDeleteProduct = async (key) => {
    try {
      const response = await axios.delete(`/api/products/${key.key}`);
      message.success(response.data.message);
      fetchProducts();
    } catch (error) {
      console.error(error);
      message.error("Lỗi khi xóa sản phẩm");
    }
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: 'Tên sản phẩm',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Popover content={record.description || "Chưa có kịch bản sản phẩm"} title="Kịch bản sản phẩm" trigger="hover">
          <span>{text}</span>
        </Popover>
      ),
    },
    {
      title: 'SL nhập hàng',
      key: 'importedQty',
      render: (_, record) => {
        const totalImported = getTotalImportedQty(record);
        const historyContent =
          record.imports && record.imports.length > 0 ? (
            <ul style={{ padding: 0, margin: 0, listStyle: 'none' }}>
              {record.imports.map((imp, index) => (
                <li key={index}>
                  <strong>Ngày:</strong> {imp.importDate} - <strong>SL:</strong> {imp.importedQty}
                </li>
              ))}
            </ul>
          ) : (
            'Chưa có lịch sử nhập'
          );
        return (
          <Popover content={historyContent} title="Lịch sử nhập hàng" trigger="hover">
            <span>{totalImported}</span>
          </Popover>
        );
      },
    },
    {
      title: 'SL sản phẩm đơn chưa DONE',
      key: 'ordersNotDone',
      render: (_, record) => {
        const ordersNotDone = orders
          .filter((order) => order.saleReport !== 'DONE')
          .reduce((acc, order) => {
            if (order.products && order.products.length > 0) {
              const orderQty = order.products
                .filter((item) => item.product === record.name)
                .reduce((sum, item) => sum + Number(item.quantity), 0);
              return acc + orderQty;
            }
            return acc;
          }, 0);
        return ordersNotDone;
      },
    },
    {
      title: 'SL sản phẩm đơn Done /nhưng chưa gửi ',
      key: 'ordersDone',
      render: (_, record) => {
        const ordersDone = orders
          .filter((order) => order.saleReport === 'DONE')
          .reduce((acc, order) => {
            if (order.products && order.products.length > 0) {
              const orderQty = order.products
                .filter((item) => item.product === record.name)
                .reduce((sum, item) => sum + Number(item.quantity), 0);
              return acc + orderQty;
            }
            return acc;
          }, 0);
        const deliveredQty = orders
          .filter(
            (order) =>
              order.deliveryStatus === 'ĐÃ GỬI HÀNG' ||
              order.deliveryStatus === 'GIAO THÀNH CÔNG'||
              order.deliveryStatus === 'BỊ BẮT CHỜ GỬI LẠI'
          )
          .reduce((acc, order) => {
            if (order.products && order.products.length > 0) {
              const orderQty = order.products
                .filter((item) => item.product === record.name)
                .reduce((sum, item) => sum + Number(item.quantity), 0);
              return acc + orderQty;
            }
            return acc;
          }, 0);
        return ordersDone - deliveredQty;
      },
    },
    {
      title: 'SL đã gửi hàng/ Giao thành công',
      key: 'Totaldagui',
      render: (_, record) => {
        const deliveredQty = orders
          .filter(
            (order) =>
              order.deliveryStatus === 'ĐÃ GỬI HÀNG' ||
              order.deliveryStatus === 'GIAO THÀNH CÔNG'||
              order.deliveryStatus === 'BỊ BẮT CHỜ GỬI LẠI'
          )
          .reduce((acc, order) => {
            if (order.products && order.products.length > 0) {
              const orderQty = order.products
                .filter((item) => item.product === record.name)
                .reduce((sum, item) => sum + Number(item.quantity), 0);
              return acc + orderQty;
            }
            return acc;
          }, 0);
        return deliveredQty;
      },
    },
    // {
    //   title: 'Tồn kho tổng',
    //   key: 'inventoryTotal',
    //   render: (_, record) => {
    //     const totalImported = getTotalImportedQty(record);
    //     const deliveredQty = orders
    //       .filter(
    //         (order) =>
    //           order.deliveryStatus === 'ĐÃ GỬI HÀNG' ||
    //           order.deliveryStatus === 'GIAO THÀNH CÔNG'||
    //           order.deliveryStatus === 'BỊ BẮT CHỜ GỬI LẠI'
    //       )
    //       .reduce((acc, order) => {
    //         if (order.products && order.products.length > 0) {
    //           const orderQty = order.products
    //             .filter((item) => item.product === record.name)
    //             .reduce((sum, item) => sum + Number(item.quantity), 0);
    //           return acc + orderQty;
    //         }
    //         return acc;
    //       }, 0);
    //     return totalImported - deliveredQty;
    //   },
    // },
    {
      title: 'SL Âm',
      width: 80,
      key: 'SLAM',
  //     sorter: (a, b) => a.slAm - b.slAm,
  // sortDirections: ['descend', 'ascend'],
      render: (_, record) => {
        const totalImported = getTotalImportedQty(record);
        const ordersNotDone = orders
          .filter((order) => order.saleReport !== 'DONE')
          .reduce((acc, order) => {
            if (order.products && order.products.length > 0) {
              const orderQty = order.products
                .filter((item) => item.product === record.name)
                .reduce((sum, item) => sum + Number(item.quantity), 0);
              return acc + orderQty;
            }
            return acc;
          }, 0);
        const ordersDone = orders
          .filter((order) => order.saleReport === 'DONE' && order.deliveryStatus === '')
          .reduce((acc, order) => {
            if (order.products && order.products.length > 0) {
              const orderQty = order.products
                .filter((item) => item.product === record.name)
                .reduce((sum, item) => sum + Number(item.quantity), 0);
              return acc + orderQty;
            }
            return acc;
          }, 0);
        const deliveredQty = orders
          .filter(
            (order) =>
              order.deliveryStatus === 'ĐÃ GỬI HÀNG' ||
              order.deliveryStatus === 'GIAO THÀNH CÔNG'||
              order.deliveryStatus === 'BỊ BẮT CHỜ GỬI LẠI'
          )
          .reduce((acc, order) => {
            if (order.products && order.products.length > 0) {
              const orderQty = order.products
                .filter((item) => item.product === record.name)
                .reduce((sum, item) => sum + Number(item.quantity), 0);
              return acc + orderQty;
            }
            return acc;
          }, 0);
        
        const slAm = totalImported - ordersNotDone - ordersDone - deliveredQty;
        let bgColor = "";
        if (slAm <= 0) {
          bgColor = "#F999A8";
        } else if (slAm > 0 && slAm < 10) {
          bgColor = "#FF9501";
        } else {
          bgColor = "#54DA1F";
        }
        return (
          <div
            style={{
              backgroundColor: bgColor,
              padding: "4px 8px",
              borderRadius: "4px",
              textAlign: "center",
              fontWeight: "bold"
            }}
          >
            {slAm}
          </div>
        );
      },
    },
    {
      title: 'SL Âm Đơn Done',
      key: 'SLAMDONE',
      width: 80,
      // Hàm sorter để sắp xếp theo slAm (tính lại từ record)
      sorter: (a, b) => {
        // Tính totalImported cho từng record (giả sử getTotalImportedQty là hàm tính)
        const aTotalImported = getTotalImportedQty(a);
        const bTotalImported = getTotalImportedQty(b);
        
        // Tính ordersDone cho record a
        const aOrdersDone = orders
          .filter(
            order =>
              order.saleReport === 'DONE' &&
              order.deliveryStatus === '' &&
              order.products &&
              order.products.length > 0 &&
              order.products.some(item => item.product === a.name)
          )
          .reduce((acc, order) => {
            const orderQty = order.products
              .filter(item => item.product === a.name)
              .reduce((sum, item) => sum + Number(item.quantity), 0);
            return acc + orderQty;
          }, 0);
        
        // Tính ordersDone cho record b
        const bOrdersDone = orders
          .filter(
            order =>
              order.saleReport === 'DONE' &&
              order.deliveryStatus === '' &&
              order.products &&
              order.products.length > 0 &&
              order.products.some(item => item.product === b.name)
          )
          .reduce((acc, order) => {
            const orderQty = order.products
              .filter(item => item.product === b.name)
              .reduce((sum, item) => sum + Number(item.quantity), 0);
            return acc + orderQty;
          }, 0);
        
        // Tính deliveredQty cho record a
        const aDeliveredQty = orders
          .filter(
            order =>
              (order.deliveryStatus === 'ĐÃ GỬI HÀNG' ||
               order.deliveryStatus === 'GIAO THÀNH CÔNG' ||
               order.deliveryStatus === 'BỊ BẮT CHỜ GỬI LẠI') &&
              order.products &&
              order.products.length > 0 &&
              order.products.some(item => item.product === a.name)
          )
          .reduce((acc, order) => {
            const orderQty = order.products
              .filter(item => item.product === a.name)
              .reduce((sum, item) => sum + Number(item.quantity), 0);
            return acc + orderQty;
          }, 0);
        
        // Tính deliveredQty cho record b
        const bDeliveredQty = orders
          .filter(
            order =>
              (order.deliveryStatus === 'ĐÃ GỬI HÀNG' ||
               order.deliveryStatus === 'GIAO THÀNH CÔNG' ||
               order.deliveryStatus === 'BỊ BẮT CHỜ GỬI LẠI') &&
              order.products &&
              order.products.length > 0 &&
              order.products.some(item => item.product === b.name)
          )
          .reduce((acc, order) => {
            const orderQty = order.products
              .filter(item => item.product === b.name)
              .reduce((sum, item) => sum + Number(item.quantity), 0);
            return acc + orderQty;
          }, 0);
        
        // Tính giá trị slAm cho a và b
        const aSlAm = aTotalImported - aOrdersDone - aDeliveredQty;
        const bSlAm = bTotalImported - bOrdersDone - bDeliveredQty;
        
        // Sắp xếp từ âm nhiều (giá trị thấp hơn) đến âm ít (giá trị cao hơn)
        return aSlAm - bSlAm;
      },
      render: (_, record) => {
        const totalImported = getTotalImportedQty(record);
        const ordersDone = orders
          .filter(order => order.saleReport === 'DONE' && order.deliveryStatus === '')
          .reduce((acc, order) => {
            if (order.products && order.products.length > 0) {
              const orderQty = order.products
                .filter(item => item.product === record.name)
                .reduce((sum, item) => sum + Number(item.quantity), 0);
              return acc + orderQty;
            }
            return acc;
          }, 0);
        const deliveredQty = orders
          .filter(
            order =>
              order.deliveryStatus === 'ĐÃ GỬI HÀNG' ||
              order.deliveryStatus === 'GIAO THÀNH CÔNG' ||
              order.deliveryStatus === 'BỊ BẮT CHỜ GỬI LẠI'
          )
          .reduce((acc, order) => {
            if (order.products && order.products.length > 0) {
              const orderQty = order.products
                .filter(item => item.product === record.name)
                .reduce((sum, item) => sum + Number(item.quantity), 0);
              return acc + orderQty;
            }
            return acc;
          }, 0);
        
        const slAm = totalImported - ordersDone - deliveredQty;
        let bgColor = "";
        if (slAm <= 0) {
          bgColor = "#F999A8";
        } else if (slAm > 0 && slAm < 10) {
          bgColor = "#FF9501";
        } else {
          bgColor = "#54DA1F";
        }
        return (
          <div
            style={{
              backgroundColor: bgColor,
              padding: "4px 8px",
              borderRadius: "4px",
              textAlign: "center",
              fontWeight: "bold"
            }}
          >
            {slAm}
          </div>
        );
      },
    },
    {
      title: 'Nhập VN',
      dataIndex: 'slvn',
      key: 'slvn',
      width: 80,
      
      
    },
    {
      title: 'Nhập TQ',
      dataIndex: 'sltq',
      key: 'sltq',
      width: 80,
     
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 120, // Đảm bảo có width
    fixed: "left",
      render: (_, record) =>{
        if (
          currentUser.position === 'admin' ||
          currentUser.position === 'leadSALE' ||
          currentUser.position === 'managerSALE'
        ) {
          return ( <Space>
            <Button icon={<PlusOutlined />} onClick={() => handleAddImport(record)} />
            <Button icon={<EditOutlined />} onClick={() => handleEditProduct(record)} />
            <Popconfirm title="Xóa bản ghi?" onConfirm={() => handleDeleteProduct(record)}>
              <Button danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>);
        } else return <span>Chỉ xem</span>;
        
      }
      
    },
    {
      title: 'Tổng doanh số',
      key: 'totalProfit',
      
      render: (_, record) => {
        // Tính tổng doanh số cho sản phẩm với tên record.name
        const totalProfit = orders.reduce((acc, order) => {
          if (order.products && Array.isArray(order.products)) {
            if (order.products.some(item => item.product === record.name)) {
              return acc + Number(order.profit || 0);
            }
          }
          return acc;
        }, 0);
    
        // Xác định màu nền dựa trên tổng doanh số
        let bgColor = "";
        if (totalProfit >= 100000000) {
          bgColor = "blue"; // Trên 100 triệu: nền xanh
        } else if (totalProfit >= 50000000) {
          bgColor = "yellow"; // Trên 50 triệu: nền vàng
        }
    
        return (
          <div
            style={{
              backgroundColor: bgColor,
              padding: "4px 8px",
              borderRadius: "4px",
              textAlign: "center",
              fontWeight: "bold"
            }}
          >
            {(totalProfit*17000).toLocaleString()} VND
          </div>
        );
      }
    }
    // {
    //   title: 'Hình ảnh',
    //   key: 'images',
    //   render: (_, record) => {
    //     return record.images && record.images.length > 0 ? (
    //       <div
    //         style={{ cursor: 'pointer' }}
    //         onClick={() => {
    //           setPreviewImage(record.images);
    //           setPreviewVisible(true);
    //         }}
    //       >
    //         <img
    //           src={record.images[0]}
    //           alt={record.name}
    //           style={{ width: 80, height: 'auto' }}
    //         />
    //       </div>
    //     ) : (
    //       'Không có hình ảnh'
    //     );
    //   },
    // },
  ];

  return (
    <div style={{ padding: 24 }}>
    
      <Form
        form={form}
        layout="inline"
        onFinish={onFinish}
        style={{ marginBottom: 16 }}
      >
        <Form.Item
          name="name"
          rules={[{ required: true, message: 'Vui lòng nhập tên sản phẩm' }]}
        >
          <Input placeholder="Tên sản phẩm" />
        </Form.Item>
        <Form.Item
          name="importedQty"
          // rules={[{ required: true, message: 'Vui lòng nhập số lượng nhập hàng' }]}
        >
          <InputNumber placeholder="SL nhập hàng" min={0} />
        </Form.Item>
        <Form.Item
          name="description"
          // rules={[{ required: true, message: 'Vui lòng nhập kịch bản sản phẩm' }]}
        >
          <Input.TextArea rows={1} placeholder="Kịch bản sản phẩm" />
        </Form.Item>
        <Form.Item
          name="images"
          valuePropName="fileList"
          getValueFromEvent={e => e && e.fileList}
          // rules={[{ required: true, message: 'Vui lòng tải hình ảnh sản phẩm' }]}
        >
          <Upload
            listType="picture"
            multiple
            beforeUpload={() => false}
          >
            <Button icon={<UploadOutlined />}>Chọn hình ảnh</Button>
          </Upload>
        </Form.Item>
        <Form.Item>
          <Button disabled={currentUser.position !== 'admin' &&
          currentUser.position !== 'leadSALE' &&
          currentUser.position !== 'managerSALE'} type="primary" htmlType="submit">
            Thêm sản phẩm
          </Button>
        </Form.Item>
      </Form>

      <Search
        placeholder="Tìm tên sản phẩm"
        onChange={(e) => setSearchText(e.target.value)}
        style={{ width: 300, marginBottom: 16 }}
      />

      <Table 
      sticky
      dataSource={filteredProducts}
      // dataSource={[...filteredProducts].sort((a, b) => b.SLAMDONE - a.SLAMDON)}
      columns={columns} rowKey="key" pagination={{ pageSize: 100 }}
     />  

      <Modal
        title="Chỉnh sửa sản phẩm"
        visible={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
      >
        <Form form={editForm} onFinish={handleEditProductFinish} layout="vertical">
          <Form.Item
            name="name"
            label="Tên sản phẩm"
            rules={[{ required: true, message: 'Vui lòng nhập tên sản phẩm' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Kịch bản sản phẩm"
            name="description"
           
          >
            <Input.TextArea rows={2} placeholder="Kịch bản sản phẩm" />
          </Form.Item>
          <Form.Item
            label="Nhập VN"
            name="slvn"
            
          >
            <InputNumber   placeholder="nhập sl" />
          </Form.Item>
          <Form.Item
            label="Nhập TQ"
            name="sltq"
           
          >
            <InputNumber   placeholder="nhập sl" />
          </Form.Item>
          
    
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Lưu
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`Thêm số lượng nhập cho: ${
          addingImportProduct ? addingImportProduct.name : ''
        }`}
        visible={addImportModalVisible}
        onCancel={() => setAddImportModalVisible(false)}
        footer={null}
      >
        <Form form={addImportForm} onFinish={handleAddImportFinish} layout="vertical">
          <Form.Item
            name="importedQty"
            label="Số lượng nhập"
            rules={[{ required: true, message: 'Vui lòng nhập số lượng nhập' }]}
          >
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="importDate"
            label="Ngày nhập"
            rules={[{ required: true, message: 'Vui lòng chọn ngày nhập' }]}
          >
            <DatePicker initialValue={moment()} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Lưu
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        visible={previewVisible}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
      >
        {Array.isArray(previewImage) ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {previewImage.map((img, idx) => (
              <img key={idx} src={img} alt={`preview-${idx}`} style={{ width: '100px', height: 'auto' }} />
            ))}
          </div>
        ) : (
          <img src={previewImage} alt="Preview" style={{ width: '100%' }} />
        )}
      </Modal>
    </div>
  );
};

export default InventoryPage;
