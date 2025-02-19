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
} from 'antd';
import moment from 'moment';

const { Search } = Input;

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
    editForm.setFieldsValue({ name: record.name });
    setEditModalVisible(true);
  };

  const handleEditProductFinish = (values) => {
    setProducts(
      products.map((product) =>
        product.key === editingProduct.key ? { ...product, name: values.name } : product
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
        // Lấy tổng số lượng của các đơn hàng chưa DONE có chứa sản phẩm này
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
      title: 'SL sản phẩm đơn Done',
      key: 'ordersDone',
      render: (_, record) => {
        // Lấy tổng số lượng của các đơn hàng DONE có chứa sản phẩm này
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
        return ordersDone;
      },
    },
    {
      title: 'Tồn kho đơn đã Done',
      key: 'inventoryDone',
      render: (_, record) => {
        const ordersDoneQty = orders
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
        return getTotalImportedQty(record) - ordersDoneQty;
      },
    },
    {
      title: 'Tồn kho tổng',
      key: 'inventoryTotal',
      render: (_, record) => {
        // Lấy tổng số lượng các đơn hàng có trạng thái 'ĐÃ GỬI HÀNG' hoặc 'GIAO THÀNH CÔNG'
        const ordersDoneQty = orders
        .filter((order) => order.deliveryStatus === 'ĐÃ GỬI HÀNG'||order.deliveryStatus === 'GIAO THÀNH CÔNG')
        .reduce((acc, order) => {
          if (order.products && order.products.length > 0) {
            const orderQty = order.products
              .filter((item) => item.product === record.name)
              .reduce((sum, item) => sum + Number(item.quantity), 0);
            return acc + orderQty;
          }
          return acc;
        }, 0);
      return getTotalImportedQty(record) - ordersDoneQty;
      },
    },
    {
      title: 'Hành động',
      key: 'actions',
      render: (_, record) => (
        <Space>
          {/* Bạn có thể bật thêm nút Sửa nếu cần */}
          {/* <Button type="link" onClick={() => handleEditProduct(record)}>
            Sửa
          </Button> */}
          <Button type="link" onClick={() => handleAddImport(record)}>
            Nhập thêm Sl
          </Button>
        </Space>
      ),
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
          rules={[
            { required: true, message: 'Vui lòng nhập số lượng nhập hàng' },
          ]}
        >
          <InputNumber placeholder="SL nhập hàng" min={0} />
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
    </div>
  );
};

export default InventoryPage;
