"use client";
import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  DatePicker,
  Select,
  Button,
  Row,
  Col,
  Modal,
} from "antd";
import dayjs from "dayjs";
import { useDispatch, useSelector } from 'react-redux';

import moment from 'moment';


const OrderForm = ({ visible, onCancel, onSubmit, initialValues ,namesalexuly }) => {
  const [form] = Form.useForm();
  const { Option } = Select;
  const currentUser = useSelector((state) => state.user.currentUser);
  // Giả sử: nếu mã nhân viên là 1 thì isEmployee1 = true
  const [productOptions, setProductOptions] = useState([]);
  const [dataPagename, setdataPagename] = useState([]);
  const employees = useSelector((state) => state.employees.employees);
  // Danh sách options
  const [pageName, setPageName] = useState("");
  
  const [employeeNamepage, setEmployeeNamepage] = useState("");
  const mktOptions = employees
  .filter(order => order.position_team === 'mkt')
  .map(order => order.name);

  const pageMapping = dataPagename.reduce((acc, item) => {
    const page = item.pageName.trim();
    acc[page] = item.employee;
    return acc;
  }, {});

  const handlePageNameChange = (value) => {
    setPageName(value);
    const mappedEmployee = pageMapping[value] || "";
    setEmployeeNamepage(mappedEmployee);
    form.setFieldsValue({ mkt: mappedEmployee });
  };


    // Nếu có mapping, tự động cập nhật tên nhân viên tương ứng
   
  const handleTTXLOptions = [
    "THIẾU/SAI",
    "TÌM HÀNG",
    "LỖI SP",
    "CHẶN KHÁCH",
    "BOOK ĐƠN",
    "GỬI LẠI",
    "MUA LẠI",
    "HẸN THIẾU/SAI",
    "ĐỢI GỬI LẠI",
    "ĐỔI Đ.CHỈ",
    "HOÀN",
    "S.BAY",
  ];

  const saleOptions = employees
  .filter(order => order.position_team === 'sale')
  .map(order => order.name);
  const pageNameOptions = dataPagename
  .map(order => order.pageName);
  const salexulyOptions = employees
  .filter(order => order.position === 'salexuly')
  .map(order => order.name);

  const saleBaoOptions = [
    "DONE",
    "HỦY",
    "ĐỢI XN",
    "NGUY CƠ",
    "BÙNG",
    "ĐANG UP",
    "CHECK",
  ];
  const massOptions = [
    "Nặng",
    "Nhẹ"];

  const thanhToanOptions = ["ĐÃ THANH TOÁN", "CHƯA THANH TOÁN"];
  const tinhTrangGHOptions = ["ĐÃ GỬI HÀNG", "GIAO THÀNH CÔNG"];
  // Khi có initialValues (dữ liệu cũ) thì chuyển các trường ngày về đối tượng dayjs
  useEffect(() => {
    if (typeof window !== "undefined") {
      
      const productNames = localStorage.getItem("productNames");
      if (productNames) {
        setProductOptions(JSON.parse(productNames));
      }
      const productNames2 = localStorage.getItem("orders3");
      if (productNames2) {
        setdataPagename(JSON.parse(productNames2));
      }
    }
  }, []);
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
    };
    
  }, [initialValues, form]);
  
  // Khi submit form, chuyển các giá trị ngày về chuỗi định dạng 'YYYY-MM-DD'
  const onFinish = (values) => {
    const submitValues = {
      ...values,
      orderDate: values.orderDate ? values.orderDate.format("YYYY-MM-DD") : null,
      shippingDate1: values.shippingDate1 ? values.shippingDate1.format("YYYY-MM-DD") : null,
      shippingDate2: values.shippingDate2 ? values.shippingDate2.format("YYYY-MM-DD") : null,
    };
    onSubmit(submitValues);
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
      {currentUser.position === 'kho1'||currentUser.position === 'kho2' ? (
        <>
          <Form form={form} layout="vertical" onFinish={onFinish}>
            {/* Các trường dành cho nhân viên 1 (luôn hiển thị) */}
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item label="TÌNH TRẠNG GIAO HÀNG" name="deliveryStatus">
                  <Select>
                    {tinhTrangGHOptions.map((status) => (
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
                  <DatePicker style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="NGÀY NHẬN" name="shippingDate2">
                  <DatePicker style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="GHI CHÚ KHO" name="noteKHO">
                  <Input.TextArea rows={3} />
                </Form.Item>
              </Col>
            </Row>

            {/* Các trường còn lại – nếu isEmployee1 là true, ẩn hoàn toàn (không chiếm diện tích) */}
            <Form.Item label="NGÀY ĐẶT" name="orderDate" hidden={currentUser.position === 'kho1'||currentUser.position === 'kho2'}>
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item label="STT" name="stt" hidden={currentUser.position === 'kho1'||currentUser.position === 'kho2'}>
              <Input type="number" />
            </Form.Item>
            <Form.Item label="TÊN KHÁCH" name="customerName" hidden={currentUser.position === 'kho1'||currentUser.position === 'kho2'}>
              <Input />
            </Form.Item>
            <Form.Item label="TÊN PAGE" name="pageName" hidden={currentUser.position === 'kho1'||currentUser.position === 'kho2'}>
              <Input />
            </Form.Item>
            <Form.Item label="SALE Xử lý" name="salexuly" hidden={currentUser.position === 'kho1'||currentUser.position === 'kho2'}>
  <Select>
    {salexulyOptions.map((employee) => (
      <Option key={employee} value={employee}>
        {employee}
      </Option>
    ))}
  </Select>
</Form.Item>  
            <Form.Item label="SẢN PHẨM" name="product" hidden={currentUser.position === 'kho1'||currentUser.position === 'kho2'}>
              <Select>
                {productOptions.map((product) => (
                  <Option key={product} value={product}>
                    {product}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label="DOANH SỐ" name="profit" hidden={currentUser.position === 'kho1'||currentUser.position === 'kho2'}>
              <Input type="number" />
            </Form.Item>
            <Form.Item label="SỐ ĐIỆN THOẠI" name="phone" hidden={currentUser.position === 'kho1'||currentUser.position === 'kho2'}>
              <Input type="tel" />
            </Form.Item>
            <Form.Item label="ĐỊA CHỈ" name="address" hidden={currentUser.position === 'kho1'||currentUser.position === 'kho2'}>
              <Input.TextArea rows={3} />
            </Form.Item>
            <Form.Item label="GHI CHÚ SALE" name="note" hidden={currentUser.position === 'kho1'||currentUser.position === 'kho2'}>
              <Input.TextArea rows={3} />
            </Form.Item>
            <Form.Item label="GHI CHÚ KHO" name="noteKHO" hidden={currentUser.position === 'kho1'||currentUser.position === 'kho2'}>
              <Input.TextArea rows={3} />
            </Form.Item>
            <Form.Item label="Phân loại" name="category" hidden={currentUser.position === 'kho1'||currentUser.position === 'kho2'}>
              <Input />
            </Form.Item>
            <Form.Item label="Hàng nặng/nhẹ" name="mass" hidden={currentUser.position === 'kho1'||currentUser.position === 'kho2'}>
              <Input />
            </Form.Item>
            <Form.Item label="SỐ LƯỢNG SP" name="quantity" hidden={currentUser.position === 'kho1'||currentUser.position === 'kho2'}>
              <Input type="number" />
            </Form.Item>
            <Form.Item label="MKT" name="mkt" hidden={currentUser.position === 'kho1'||currentUser.position === 'kho2'}>
              <Select showSearch>
                {mktOptions.map((mkt) => (
                  <Option key={mkt} value={mkt}>
                    {mkt}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label="SALE" name="sale" hidden={currentUser.position === 'kho1'||currentUser.position === 'kho2'}>
              <Select showSearch>
                {saleOptions.map((sale) => (
                  <Option key={sale} value={sale}>
                    {sale}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label="DOANH SỐ" name="revenue" hidden={currentUser.position === 'kho1'||currentUser.position === 'kho2'}>
              <Input type="number" />
            </Form.Item>
            <Form.Item label="TT SALE XỬ LÍ ĐƠN" name="processStatus" hidden={currentUser.position === 'kho1'||currentUser.position === 'kho2'}>
              <Select>
                {handleTTXLOptions.map((status) => (
                  <Option key={status} value={status}>
                    {status}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label="SALE BÁO" name="saleReport" hidden={currentUser.position === 'kho1'||currentUser.position === 'kho2'}>
              <Select>
                {saleBaoOptions.map((report) => (
                  <Option key={report} value={report}>
                    {report}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label="Chọn SALE Xử lý" name="salexuly" hidden={currentUser.position === 'kho1'||currentUser.position === 'kho2'}>
                  <Select showSearch>
                    {salexulyOptions.map((sale) => (
                      <Option key={sale} value={sale}>
                        {sale}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
            <Form.Item label="THANH TOÁN" name="paymentStatus" hidden={currentUser.position === 'kho1'||currentUser.position === 'kho2'}>
              <Select>
                {thanhToanOptions.map((status) => (
                  <Option key={status} value={status}>
                    {status}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item style={{ marginTop: 24, textAlign: "right" }}>
              <Button style={{ marginRight: 8 }} onClick={onCancel}>
                Hủy
              </Button>
              {(!currentUser.position_team ==='kho' || initialValues) && (
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
                <Form.Item  initialValue={moment()} label="NGÀY ĐẶT" name="orderDate">
                  <DatePicker style={{ width: "100%" }} />
                </Form.Item>
                <Form.Item label="Hàng nặng/nhẹ" name="mass">
                  <Select showSearch>
                    {massOptions.map((mas) => (
                      <Option key={mas} value={mas}>
                        {mas}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item label="TÊN KHÁCH" name="customerName">
                  <Input />
                </Form.Item>
                <Form.Item label="TÊN PAGE" name="pageName">
                <Select disabled={currentUser.position ==='salexuly'} showSearch onChange={handlePageNameChange} >
                    {pageNameOptions.map((pageName) => (
                      <Option key={pageName} value={pageName} >
                        {pageName}
                      </Option >
                    ))}
                  </Select> 
                </Form.Item>
                <Form.Item label="MKT" name="mkt">
                <Input 
          
          value={employeeNamepage} 
          readOnly 
        /> 
                </Form.Item>
               
              </Col>
              <Col span={8}>
              <Form.Item showSearch label="SẢN PHẨM" name="product">
                  <Select showSearch>
                    {productOptions.map((product) => (
                      <Option key={product} value={product}>
                        {product}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item label="SỐ LƯỢNG SP" name="quantity">
                  <Input type="number" />
                </Form.Item>
                <Form.Item label="Phân loại QUÀ/SIZE/MÀU" name="category">
                <Input />
                </Form.Item>
                
                <Form.Item   label="SALE" name="sale">
                  <Select  disabled= {currentUser.position ==='salenhapdon'||currentUser.position ==='salexuly'} showSearch defaultValue={currentUser.name}>
                  
                  {saleOptions.map((employee) => (
      <Option key={employee} value={employee}>
        {employee}
      </Option>
    ))}

                  </Select>
                </Form.Item>
                <Form.Item  label="SALE Xử lý" name="salexuly" initialValue={namesalexuly}>
  <Select disabled={currentUser.position ==='salexuly'}>
    {salexulyOptions.map((employee) => (
      <Option key={employee} value={employee}>
        {employee}
      </Option>
    ))}
  </Select>
</Form.Item>  
               
              </Col>
              <Col span={8}>
              
                <Form.Item label="DOANH SỐ" name="revenue">
                  <Input type="number" />
                </Form.Item>
                <Form.Item label="SỐ ĐIỆN THOẠI" name="phone">
                  <Input type="tel" />
                </Form.Item>
                <Form.Item label="ĐỊA CHỈ" name="address">
                  <Input.TextArea rows={3} />
                </Form.Item>
                <Form.Item label="GHI CHÚ SALE" name="note">
  <Input.TextArea
    rows={3}
    onFocus={(e) => {
      // Nếu ô ghi chú đang trống, thêm prefix là tên người dùng
      if (!e.target.value) {
        const prefix = `${currentUser.name}: `;
        form.setFieldsValue({ note: prefix });
      }
    }}
  />
</Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={8}>
              
                <Form.Item label="TT SALE XỬ LÍ ĐƠN" name="processStatus">
                  <Select>
                    {handleTTXLOptions.map((status) => (
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
                    {saleBaoOptions.map((report) => (
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
                    {thanhToanOptions.map((status) => (
                      <Option key={status} value={status}>
                        {status}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
                
              </Col>
              
            </Row>
            <Form.Item label="TÌNH TRẠNG GIAO HÀNG" name="deliveryStatus" hidden={currentUser.position_team ==='sale'}>
              <Select>
                {tinhTrangGHOptions.map((status) => (
                  <Option key={status} value={status}>
                    {status}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label="MÃ VẬN ĐƠN" name="trackingCode" hidden={currentUser.position_team ==='sale'}>
              <Input />
            </Form.Item>
            <Form.Item label="NGÀY GỬI" name="shippingDate1" hidden={currentUser.position_team ==='sale'}>
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item label="NGÀY NHẬN" name="shippingDate2" hidden={currentUser.position_team ==='sale'}>
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item label="GHI CHÚ KHO" name="noteKHO" hidden={currentUser.position_team ==='sale'}>
              <Input.TextArea rows={3} />
            </Form.Item>
            <Form.Item style={{ marginTop: 24, textAlign: "right" }}>
              <Button style={{ marginRight: 8 }} onClick={onCancel}>
                Hủy
              </Button>
              {(currentUser.position_team ==='sale' || initialValues) && (
                <Button type="primary" htmlType="submit">
                  {initialValues ? "Cập nhật" : "Thêm mới"}
                </Button>
              )}
            </Form.Item>
          </Form>
        </>
      )}
    </Modal>
  );
};

export default OrderForm;
