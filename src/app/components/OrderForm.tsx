"use client";
import React, { useEffect } from 'react';
import {
  Form,
  Input,
  DatePicker,
  Select,
  Button,
  Row,
  Col,
  Modal
} from 'antd';
import dayjs from 'dayjs';

const { Option } = Select;

// Giả sử: nếu mã nhân viên là 1 thì isEmployee1 = true
const isEmployee1 = true
;

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

const OrderForm = ({ visible, onCancel, onSubmit, initialValues }: OrderFormProps) => {
  const [form] = Form.useForm();

  // Khi có initialValues (dữ liệu cũ) thì chuyển các trường ngày về đối tượng dayjs
  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        ...initialValues,
        orderDate: initialValues.orderDate ? dayjs(initialValues.orderDate) : null,
        shippingDate1: initialValues.shippingDate1 ? dayjs(initialValues.shippingDate1) : null,
        shippingDate2: initialValues.shippingDate2 ? dayjs(initialValues.shippingDate2) : null,
      });
    } else {
      form.resetFields();
    }
  }, [initialValues, form]);

  // Khi submit form, chuyển các giá trị ngày về chuỗi định dạng 'YYYY-MM-DD'
  const onFinish = (values: any) => {
    onSubmit({
      ...values,
      orderDate: values.orderDate ? values.orderDate.format('YYYY-MM-DD') : null,
      shippingDate1: values.shippingDate1 ? values.shippingDate1.format('YYYY-MM-DD') : null,
      shippingDate2: values.shippingDate2 ? values.shippingDate2.format('YYYY-MM-DD') : null,
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
      {isEmployee1 ? (
          <><Form form={form} layout="vertical" onFinish={onFinish}>
        {/* Các trường dành cho nhân viên 1 (luôn hiển thị) */}
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="TÌNH TRẠNG GIAO HÀNG" name="deliveryStatus">
              <Select>
                {tinhTrangGHOptions.map((status: string) => (
                  <Option key={status} value={status}>
                    {status}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            {/* Trường "MÃ VẬN ĐƠN" nếu cần ẩn hoàn toàn, bạn có thể sử dụng hidden */}
            <Form.Item label="MÃ VẬN ĐƠN" name="trackingCode" hidden={false}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="NGÀY GỬI" name="shippingDate1">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="NGÀY NHẬN" name="shippingDate2">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="GHI CHÚ KHO" name="noteKHO">
              <Input.TextArea rows={3} />
            </Form.Item>
          </Col>
        </Row>

        {/* Các trường còn lại – nếu isEmployee1 là true, ẩn hoàn toàn (không chiếm diện tích) */}
        <Form.Item label="NGÀY ĐẶT" name="orderDate" hidden={isEmployee1}>
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item label="STT" name="stt" hidden={isEmployee1}>
          <Input type="number" />
        </Form.Item>
        <Form.Item label="TÊN KHÁCH" name="customerName" hidden={isEmployee1}>
          <Input />
        </Form.Item>
        <Form.Item label="TÊN PAGE" name="pageName" hidden={isEmployee1}>
          <Input />
        </Form.Item>
        <Form.Item label="SẢN PHẨM" name="product" hidden={isEmployee1}>
          <Select>
            {productOptions.map((product: string) => (
              <Option key={product} value={product}>
                {product}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item label="DOANH THU" name="profit" hidden={isEmployee1}>
          <Input type="number" />
        </Form.Item>
        <Form.Item label="SỐ ĐIỆN THOẠI" name="phone" hidden={isEmployee1}>
          <Input type="tel" />
        </Form.Item>
        <Form.Item label="ĐỊA CHỈ" name="address" hidden={isEmployee1}>
          <Input.TextArea rows={3} />
        </Form.Item>
        <Form.Item label="GHI CHÚ SALE" name="note" hidden={isEmployee1}>
          <Input.TextArea rows={3} />
        </Form.Item>
        <Form.Item label="GHI CHÚ KHO" name="noteKHO" hidden={isEmployee1}>
          <Input.TextArea rows={3} />
        </Form.Item>
        <Form.Item label="Phân loại" name="category" hidden={isEmployee1}>
          <Input />
        </Form.Item>
        <Form.Item label="SỐ LƯỢNG SP" name="quantity" hidden={isEmployee1}>
          <Input type="number" />
        </Form.Item>
        <Form.Item label="MKT" name="mkt" hidden={isEmployee1}>
          <Select showSearch>
            {mktOptions.map((mkt: string) => (
              <Option key={mkt} value={mkt}>
                {mkt}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item label="SALE" name="sale" hidden={isEmployee1}>
          <Select showSearch>
            {saleOptions.map((sale: string) => (
              <Option key={sale} value={sale}>
                {sale}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item label="DOANH SỐ" name="revenue" hidden={isEmployee1}>
          <Input type="number" />
        </Form.Item>
        <Form.Item label="TT SALE XỬ LÍ ĐƠN" name="processStatus" hidden={isEmployee1}>
          <Select>
            {handleTTXLOptions.map((status: string) => (
              <Option key={status} value={status}>
                {status}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item label="SALE BÁO" name="saleReport" hidden={isEmployee1}>
          <Select>
            {saleBaoOptions.map((report: string) => (
              <Option key={report} value={report}>
                {report}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item label="THANH TOÁN" name="paymentStatus" hidden={isEmployee1}>
          <Select>
            {thanhToanOptions.map((status: string) => (
              <Option key={status} value={status}>
                {status}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item style={{ marginTop: 24, textAlign: 'right' }}>
          <Button style={{ marginRight: 8 }} onClick={onCancel}>
            Hủy
          </Button>
          {(!isEmployee1 || initialValues) && (
            <Button type="primary" htmlType="submit">
              {initialValues ? 'Cập nhật' : 'Thêm mới'}
            </Button>
          )}
        </Form.Item>
      </Form></>):
      
      (<><Form form={form} layout="vertical" onFinish={onFinish}><Row gutter={16}>
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
              {productOptions.map((product: string) => (
                <Option key={product} value={product}>
                  {product}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item label="Phân loại" name="category">
            <Input />
          </Form.Item>
          <Form.Item label="SỐ LƯỢNG SP" name="quantity">
            <Input type="number" />
          </Form.Item>
          <Form.Item label="MKT" name="mkt">
            <Select showSearch>
              {mktOptions.map((mkt: string) => (
                <Option key={mkt} value={mkt}>
                  {mkt}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="SALE" name="sale">
            <Select showSearch>
              {saleOptions.map((sale: string) => (
                <Option key={sale} value={sale}>
                  {sale}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="DOANH SỐ" name="revenue">
            <Input type="number" />
          </Form.Item>
        </Col>
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
          <Form.Item label="GHI CHÚ SALE" name="note">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Col>
        </Row>
        <Row gutter={16}>
        <Col span={8}>
          <Form.Item label="TT SALE XỬ LÍ ĐƠN" name="processStatus">
            <Select>
              {handleTTXLOptions.map((status: string) => (
                <Option key={status} value={status}>
                  {status}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item label="SALE BÁO" name="saleReport">
            <Select>
              {saleBaoOptions.map((report: string) => (
                <Option key={report} value={report}>
                  {report}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item label="THANH TOÁN" name="paymentStatus">
            <Select>
              {thanhToanOptions.map((status: string) => (
                <Option key={status} value={status}>
                  {status}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        </Row>
        <Form.Item label="TÌNH TRẠNG GIAO HÀNG" name="deliveryStatus" hidden={!isEmployee1}>
              <Select>
                {tinhTrangGHOptions.map((status: string) => (
                  <Option key={status} value={status}>
                    {status}
                  </Option>
                ))}
              </Select>
            </Form.Item>
       
            {/* Trường "MÃ VẬN ĐƠN" nếu cần ẩn hoàn toàn, bạn có thể sử dụng hidden */}
            <Form.Item label="MÃ VẬN ĐƠN" name="trackingCode" hidden={!isEmployee1}>
              <Input />
            </Form.Item>
          
            <Form.Item label="NGÀY GỬI" name="shippingDate1" hidden={!isEmployee1}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
        
            <Form.Item label="NGÀY NHẬN" name="shippingDate2" hidden={!isEmployee1}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
         
            <Form.Item label="GHI CHÚ KHO" name="noteKHO" hidden={!isEmployee1}>
              <Input.TextArea rows={3} />
            </Form.Item>
        
        <Form.Item style={{ marginTop: 24, textAlign: 'right' }}>
        <Button style={{ marginRight: 8 }} onClick={onCancel}>
        Hủy
        </Button>
        {(!isEmployee1 || initialValues) && (
        <Button type="primary" htmlType="submit">
        {initialValues ? 'Cập nhật' : 'Thêm mới'}
        </Button>
        )}
        </Form.Item>
        </Form></>)
}</Modal>
  );
};

export default OrderForm;
