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
  Select,Popconfirm
} from 'antd';
import moment from 'moment';
import { EditOutlined, DeleteOutlined,PlusOutlined  } from "@ant-design/icons";
const { Search } = Input;
const { Option } = Select;

const InventoryPage = () => {
  // State lưu danh sách đơn hàng và sản phẩm
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [form] = Form.useForm(); // form thêm sản phẩm mới
  const [searchText, setSearchText] = useState('');

  // State & form cho modal chỉnh sửa thông tin sản phẩm (ví dụ: tên sản phẩm)
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editForm] = Form.useForm();

  // State & form cho modal thêm số lượng nhập (thêm lần nhập mới)
  const [addImportModalVisible, setAddImportModalVisible] = useState(false);
  const [addingImportProduct, setAddingImportProduct] = useState(null);
  const [addImportForm] = Form.useForm();

  // State dùng cho preview hình ảnh khi nhấp vào
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  // Lấy dữ liệu từ localStorage khi component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedOrders = localStorage.getItem('orders');
      if (savedOrders) {
        setOrders(JSON.parse(savedOrders));
      }
      const productsData = localStorage.getItem('products');
      if (productsData) {
        setProducts(JSON.parse(productsData));
      }
    }
  }, []);

  // Lưu lại sản phẩm vào localStorage khi có thay đổi
  useEffect(() => {
    if (typeof window !== 'undefined' && products && products.length > 0) {
      localStorage.setItem('products', JSON.stringify(products));
      const productNames = products.map((p) => p.name);
      localStorage.setItem('productNames', JSON.stringify(productNames));
    }
  }, [products]);

  // Hàm tính tổng số lượng nhập từ mảng imports của sản phẩm
  const getTotalImportedQty = (product) => {
    if (product.imports && product.imports.length > 0) {
      return product.imports.reduce((acc, cur) => acc + cur.importedQty, 0);
    }
    return 0;
  };

  // Khi thêm sản phẩm mới: khởi tạo mảng imports với lần nhập đầu tiên (ngày hiện tại)
  const onFinish = (values) => {
    const newProduct = {
      key: Date.now(), // sử dụng timestamp làm key duy nhất
      name: values.name,
     
      image: values.image, // lưu URL hình ảnh
      description: values.description,
      imports: [
        {
          importedQty: values.importedQty,
          importDate: moment().format('YYYY-MM-DD'),
        },
      ],
    };
    setProducts([...products, newProduct]);
    form.resetFields();
  };

  // Modal Sửa: Chỉnh sửa tên sản phẩm (ví dụ)
  const handleEditProduct = (record) => {
    setEditingProduct(record);
    editForm.setFieldsValue({ name: record.name, description: record.description});
    setEditModalVisible(true);
  };

  const handleEditProductFinish = (values) => {
    setProducts(
      products.map((product) =>
        product.key === editingProduct.key ? { ...product, name: values.name ,description: values.description} : product
      )
    );
    setEditModalVisible(false);
    setEditingProduct(null);
  };

  // Modal Thêm nhập: Thêm 1 lần nhập hàng mới cho sản phẩm
  const handleAddImport = (record) => {
    setAddingImportProduct(record);
    addImportForm.resetFields();
    setAddImportModalVisible(true);
  };

  const handleAddImportFinish = (values) => {
    const newImport = {
      importedQty: values.importedQty,
      importDate: values.importDate.format('YYYY-MM-DD'),
    };
    setProducts(
      products.map((product) =>
        product.key === addingImportProduct.key
          ? { ...product, imports: [...(product.imports || []), newImport] }
          : product
      )
    );
    setAddImportModalVisible(false);
    setAddingImportProduct(null);
  };

  // Hàm xóa sản phẩm
  const handleDeleteProduct = (record) => {
    
      
        setProducts((prevProducts) =>
          prevProducts.filter((product) => product.key !== record.key)
        );
     
  };
  

  // Lọc sản phẩm theo tên dựa trên searchText
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchText.toLowerCase())
  );

  // Các cột của bảng
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
    // {
    //   title: 'Phân loại hàng',
    //   dataIndex: 'category',
    //   key: 'category',
    // },
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
              order.deliveryStatus === 'GIAO THÀNH CÔNG'
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
              order.deliveryStatus === 'GIAO THÀNH CÔNG'
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
    {
      title: 'Tồn kho tổng',
      key: 'inventoryTotal',
      render: (_, record) => {
        const totalImported = getTotalImportedQty(record);
        const deliveredQty = orders
          .filter(
            (order) =>
              order.deliveryStatus === 'ĐÃ GỬI HÀNG' ||
              order.deliveryStatus === 'GIAO THÀNH CÔNG'
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
        return totalImported - deliveredQty;
      },
    },
    {
      title: 'SL Âm',
      key: 'SLAM',
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
              order.deliveryStatus === 'GIAO THÀNH CÔNG'
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
        const inventoryTotal = totalImported - deliveredQty;
        const slAm = inventoryTotal - ordersNotDone - ordersDone + deliveredQty;
        let bgColor = "";
        if (slAm <= 0) {
          bgColor = "#EC2527";
        } else if (slAm >  0 && slAm < 10) {
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
      title: 'Hành động',
      key: 'actions',
      render: (_, record) => (
        <Space>
          {/* Bạn có thể mở modal sửa nếu cần */}
        
           <Button icon={<PlusOutlined  />} onClick={() => handleAddImport(record)} />
           <Button icon={<EditOutlined />} onClick={() => handleEditProduct(record)} />
          <Popconfirm title="Xóa bản ghi?" onConfirm={() => handleDeleteProduct(record)}>
                  <Button danger icon={<DeleteOutlined />} />
                </Popconfirm>
            
          
        </Space>
      ),
    },
    {
      title: 'Hình ảnh',
      key: 'image',
      render: (_, record) => {
        return record.image ? (
          <img
            src={record.image}
            alt={record.name}
            style={{ width: 80, height: 'auto', cursor: 'pointer' }}
            onClick={() => {
              setPreviewImage(record.image);
              setPreviewVisible(true);
            }}
          />
        ) : (
          'Không có hình ảnh'
        );
      },
    },
  ];
  
  return (
    <div style={{ padding: 24 }}>
      <h1>Quản lý sản phẩm</h1>
      {/* Form thêm sản phẩm mới */}
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
          rules={[{ required: true, message: 'Vui lòng nhập số lượng nhập hàng' }]}
        >
          <InputNumber placeholder="SL nhập hàng" min={0} />
        </Form.Item>
        {/* <Form.Item
          name="category"
          rules={[{ required: true, message: 'Vui lòng chọn phân loại hàng' }]}
        >
          <Select placeholder="Phân loại hàng" style={{ width: 150 }}>
            <Option value="electronics">Electronics</Option>
            <Option value="clothing">Clothing</Option>
            <Option value="food">Food</Option>
         
          </Select>
        </Form.Item> */}
        
        <Form.Item
          name="description"
          rules={[{ required: true, message: 'Vui lòng nhập kịch bản sản phẩm' }]}
        >
          <Input.TextArea rows={1} placeholder="Kịch bản sản phẩm" />
        </Form.Item>
        <Form.Item
          name="image"
          valuePropName="fileList"
          getValueFromEvent={(e) => {
            if (e && e.target && e.target.files && e.target.files[0]) {
              return URL.createObjectURL(e.target.files[0]);
            }
            return null;
          }}
          rules={[{ required: true, message: 'Vui lòng tải hình ảnh sản phẩm' }]}
        >
          <Input type="file" accept="image/*" />
        </Form.Item>
        
        <Form.Item>
          <Button type="primary" htmlType="submit">
            Thêm sản phẩm
          </Button>
        </Form.Item>
      </Form>

      {/* Ô Search để tìm kiếm sản phẩm */}
      <Search
        placeholder="Tìm tên sản phẩm"
        onChange={(e) => setSearchText(e.target.value)}
        style={{ width: 300, marginBottom: 16 }}
      />

      {/* Bảng hiển thị sản phẩm dựa trên kết quả tìm kiếm */}
      <Table dataSource={filteredProducts} columns={columns} rowKey="key" />

      {/* Modal chỉnh sửa tên sản phẩm */}
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
          label="Kịch bản sản phẩm  "
          name="description"
          rules={[{ required: true, message: 'Vui lòng nhập kịch bản sản phẩm' }]}
        >
          <Input.TextArea rows={2} placeholder="Kịch bản sản phẩm" />
        </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Lưu
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal thêm số lượng nhập mới */}
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
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="importDate"
            label="Ngày nhập"
            rules={[{ required: true, message: 'Vui lòng chọn ngày nhập' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Lưu
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal phóng to hình ảnh khi nhấp */}
      <Modal
        visible={previewVisible}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
      >
        <img src={previewImage} alt="Preview" style={{ width: '100%' }} />
      </Modal>
    </div>
  );
};

export default InventoryPage;
