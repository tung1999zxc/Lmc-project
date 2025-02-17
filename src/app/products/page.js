'use client'
import React, { useState, useEffect } from 'react';
import { Table, Form, Input, InputNumber, Button, Modal, Space } from 'antd';

const InventoryPage = () => {
  // State lưu danh sách đơn hàng được lấy từ localStorage
  const [orders, setOrders] = useState([]);
  // State lưu danh sách sản phẩm nhập vào
  const [products, setProducts] = useState([]);
  // Form cho việc thêm sản phẩm mới
  const [form] = Form.useForm();
  // State và form cho Modal chỉnh sửa
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editForm] = Form.useForm();

  // Lấy danh sách đơn hàng từ localStorage khi component được mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedOrders = localStorage.getItem('orders');
      if (savedOrders) {
        setOrders(JSON.parse(savedOrders));
      }
      const products2 = localStorage.getItem("products");
      if (products2) {
        setProducts(JSON.parse(products2));
      }
    }
  }, []);
  useEffect(() => {
    if (typeof window !== "undefined" && products && products.length > 0) {
      localStorage.setItem("products", JSON.stringify(products));
      const productNames = products.map(product => product.name);
      localStorage.setItem("productNames", JSON.stringify(productNames));
    }
  }, [products]);
  
  // Hàm xử lý khi submit form thêm sản phẩm mới
  const onFinish = (values) => {
    const newProduct = {
      key: Date.now(), // sử dụng timestamp làm key duy nhất
      name: values.name,
      importedQty: values.importedQty,
    };
    setProducts([...products, newProduct]);
    form.resetFields();
  };

  // Hàm mở Modal chỉnh sửa với dữ liệu của sản phẩm được chọn
  const handleEdit = (record) => {
    setEditingProduct(record);
    editForm.setFieldsValue({
      name: record.name,
      importedQty: record.importedQty,
    });
    setEditModalVisible(true);
  };

  // Hàm xử lý khi submit form chỉnh sửa sản phẩm
  const handleEditFinish = (values) => {
    setProducts(
      products.map((product) =>
        product.key === editingProduct.key ? { ...product, ...values } : product
      )
    );
    setEditModalVisible(false);
    setEditingProduct(null);
  };

  // Định nghĩa các cột cho bảng sản phẩm
  const columns = [
    {
      title: 'Tên sản phẩm',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'SL nhập hàng',
      dataIndex: 'importedQty',
      key: 'importedQty',
    },
    {
      title: 'SL sản phẩm đơn chưa DONE',
      key: 'ordersNotDone',
      render: (_, record) => {
        // Tính tổng số đơn của sản phẩm (theo order.product)
        const totalOrders = orders
          .filter((order) => order.product === record.name)
          .reduce((acc, order) => acc + order.quantity, 0);
        // Tính số đơn đã DONE
        const ordersDone = orders
          .filter(
            (order) =>
              order.product === record.name && order.saleReport === 'DONE'
          )
          .reduce((acc, order) => acc + order.quantity, 0);
        // Số đơn chưa DONE = tổng đơn - đơn DONE
        return totalOrders - ordersDone;
      },
    },
    {
      title: 'Số lượng sản phẩm đơn Done',
      key: 'ordersDone',
      render: (_, record) => {
        const ordersDone = orders
          .filter(
            (order) =>
              order.product === record.name && order.saleReport === 'DONE'
          )
          .reduce((acc, order) => acc + order.quantity, 0);
        return ordersDone;
      },
    },
    {
      title: 'Tồn kho đơn đã Done',
      key: 'inventoryDone',
      render: (_, record) => {
        const ordersDone = orders
          .filter(
            (order) =>
              order.product === record.name && order.saleReport === 'DONE'
          )
          .reduce((acc, order) => acc + order.quantity, 0);
        return record.importedQty - ordersDone;
      },
    },
    {
      title: 'Tồn kho tổng',
      key: 'inventoryTotal',
      render: (_, record) => {
        // Tổng đơn của sản phẩm
        const totalOrders = orders
          .filter((order) => order.product === record.name)
          .reduce((acc, order) => acc + order.quantity, 0);
        return record.importedQty - totalOrders;
      },
    },
    {
      title: 'Hành động',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => handleEdit(record)}>
            Sửa
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h1>Quản lý sản phẩm</h1>
      {/* Form nhập tên sản phẩm và SL nhập hàng */}
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

      {/* Bảng hiển thị danh sách sản phẩm */}
      <Table dataSource={products} columns={columns} rowKey="key" />

      {/* Modal chỉnh sửa sản phẩm */}
      <Modal
        title="Chỉnh sửa sản phẩm"
        visible={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
      >
        <Form form={editForm} onFinish={handleEditFinish} layout="vertical">
          <Form.Item
            name="name"
            label="Tên sản phẩm"
            rules={[{ required: true, message: 'Vui lòng nhập tên sản phẩm' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="importedQty"
            label="SL nhập hàng"
            rules={[
              { required: true, message: 'Vui lòng nhập số lượng nhập hàng' },
            ]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
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
