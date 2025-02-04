"use client";
import { Form, Input, DatePicker, Select, Button, Row, Col, Modal } from 'antd';
import React, { useEffect } from 'react';
import dayjs from 'dayjs';

const { Option } = Select;

// Danh sách options
const productOptions = ['Product 1', 'Product 2', 'Product 3'];
const mktOptions = [
  'Phi-HC', 'V.Phi', 'P.Thành', 'Linh', 'Diện', 'Chi', 'Phong', 
  'Tuấn', 'T.Nhung', 'Sơn', 'Tuấn Anh', 'Lâm', 'N.Linh', 'Nhung', 
  'Ly', 'Diệu', 'Quân', 'Thành', 'D.Linh', 'Thìn', 'Hiền', 'Lan', 
  'Anh', 'H.Ly', 'Thụ', 'Sáng', 'Cương', 'Đức'
];
const saleOptions = [
  'Hạnh-TM', 'Diệp', 'Anh', 'Huyền', 'Mai', 'Phương', 'Giang', 
  'Tâm', 'Yến', 'Ngọc', 'Tuyền', 'H.Ngọc', 'Linh', 'Nhi', 
  'Trang', 'U.Nhi', 'Thành', 'T.Phương', 'Kha'
];
const handleTTXLOptions = [
  'THIẾU/SAI', 'TÌM HÀNG', 'LỖI SP', 'CHẶN KHÁCH', 'BOOK ĐƠN', 
  'GỬI LẠI', 'MUA LẠI', 'HẸN THIẾU/SAI', 'ĐỢI GỬI LẠI', 
  'ĐỔI Đ.CHỈ', 'HOÀN', 'S.BAY'
];
const saleBaoOptions = [
  'DONE', 'HỦY', 'ĐỢI XN', 'NGUY CƠ', 'BÙNG', 'ĐANG UP', 'CHECK'
];
const thanhToanOptions = ['ĐÃ THANH TOÁN', 'CHƯA THANH TOÁN'];
const tinhTrangGHOptions = ['ĐÃ GỬI HÀNG', 'GIAO THÀNH CÔNG'];

interface OrderFormProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (values: any) => void;
  initialValues?: any;
}

const OrderForm = ({ 
  visible,
  onCancel,
  onSubmit,
  initialValues
}: OrderFormProps) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        ...initialValues,
        orderDate: initialValues.orderDate ? dayjs(initialValues.orderDate) : null,
        shippingDate: initialValues.shippingDate ? dayjs(initialValues.shippingDate) : null
      });
    } else {
      form.resetFields();
    }
  }, [initialValues, form]);

  const onFinish = (values: any) => {
    onSubmit({
      ...values,
      orderDate: values.orderDate?.format('YYYY-MM-DD'),
      shippingDate: values.shippingDate?.format('YYYY-MM-DD')
    });
    form.resetFields();
  };

  return (
    <Modal
      title={initialValues ? "Chỉnh sửa đơn hàng" : "Thêm đơn hàng mới"}
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={1000}
      style={{ top: 20 }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ remember: true }}
      >
        <Row gutter={16}>
          {/* Cột 1 */}
          <Col span={8}>
            <Form.Item label="NGÀY ĐẶT" name="orderDate">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item label="STT" name="stt">
              <Input type="number" />
            </Form.Item>

            <Form.Item label="TÊN KHÁCH" name="customerName">
              <Input />
            </Form.Item>

            <Form.Item label="TÊN PAGE" name="pageName">
              <Input />
            </Form.Item>

            <Form.Item label="SẢN PHẨM" name="product">
              <Select>
                {productOptions.map(product => (
                  <Option key={product} value={product}>{product}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          {/* Cột 2 */}
          <Col span={8}>
            <Form.Item label="Phân loại" name="category">
              <Input />
            </Form.Item>

            <Form.Item label="SỐ LƯỢNG SP" name="quantity">
              <Input type="number" />
            </Form.Item>

            <Form.Item label="MKT" name="mkt">
              <Select showSearch>
                {mktOptions.map(mkt => (
                  <Option key={mkt} value={mkt}>{mkt}</Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item label="SALE" name="sale">
              <Select showSearch>
                {saleOptions.map(sale => (
                  <Option key={sale} value={sale}>{sale}</Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item label="DOANH SỐ" name="revenue">
              <Input type="number" />
            </Form.Item>
          </Col>

          {/* Cột 3 */}
          <Col span={8}>
            <Form.Item label="DOANH THU" name="profit">
              <Input type="number" />
            </Form.Item>

            <Form.Item label="SỐ ĐIỆN THOẠI" name="phone">
              <Input type="tel" />
            </Form.Item>

            <Form.Item label="ĐỊA CHỈ" name="address">
              <Input.TextArea rows={3} />
            </Form.Item>

            <Form.Item label="GHI CHÚ" name="note">
              <Input.TextArea rows={3} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="TT SALE XỬ LÍ ĐƠN" name="processStatus">
              <Select>
                {handleTTXLOptions.map(status => (
                  <Option key={status} value={status}>{status}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item label="SALE BÁO" name="saleReport">
              <Select>
                {saleBaoOptions.map(report => (
                  <Option key={report} value={report}>{report}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item label="THANH TOÁN" name="paymentStatus">
              <Select>
                {thanhToanOptions.map(status => (
                  <Option key={status} value={status}>{status}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item label="TÌNH TRẠNG GIAO HÀNG" name="deliveryStatus">
              <Select>
                {tinhTrangGHOptions.map(status => (
                  <Option key={status} value={status}>{status}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item label="MÃ VẬN ĐƠN" name="trackingCode">
              <Input />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item label="NGÀY GỬI/NHẬN" name="shippingDate">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item style={{ marginTop: 24, textAlign: 'right' }}>
          <Button style={{ marginRight: 8 }} onClick={onCancel}>
            Hủy
          </Button>
          <Button type="primary" htmlType="submit">
            {initialValues ? 'Cập nhật' : 'Thêm mới'}
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default OrderForm;