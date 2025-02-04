// app/components/ProductForm.js
"use client";
import { Form, Input, InputNumber, Button, message } from "antd";
import axios from "axios";

export default function ProductForm({ onSuccess, onClose }) {
  const [form] = Form.useForm();

  const handleSubmit = async (values) => {
    await axios.post("/api/products", values);
    message.success("Thêm sản phẩm thành công!");
    form.resetFields();
    onSuccess();
    onClose();
  };

  return (
    <Form form={form} layout="vertical" onFinish={handleSubmit}>
      <Form.Item name="name" label="Tên sản phẩm" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item name="price" label="Giá" rules={[{ required: true }]}>
        <InputNumber min={1} style={{ width: "100%" }} />
      </Form.Item>
      <Form.Item name="stock" label="Kho hàng" rules={[{ required: true }]}>
        <InputNumber min={0} style={{ width: "100%" }} />
      </Form.Item>
      <Button type="primary" htmlType="submit">Lưu</Button>
    </Form>
  );
}
