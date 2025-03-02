"use client";
import React, { useState, useEffect } from "react";
import axios from "axios"; 
import {
  Form,
  Input,
  DatePicker,
  Select,
  Button,
  Row,
  Col,
  Modal,
  Space,
} from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import moment from "moment";
import { useDispatch, useSelector } from "react-redux";

const OrderForm = ({ visible, onCancel, onSubmit, initialValues, namesalexuly }) => {
  const [form] = Form.useForm();
  const { Option } = Select;
  const currentUser = useSelector((state) => state.user.currentUser);
  // Giả sử: nếu mã nhân viên là 1 thì isEmployee1 = true
  
  const [dataPagename, setdataPagename] = useState([]);
    const [employees, setEmployees] = useState([]);
  

  // Danh sách options
  const [products, setProducts] = useState([]);
  const [employeeNamepage, setEmployeeNamepage] = useState("");

   const fetchProducts = async () => {
    try {
      const response = await axios.get('/api/products');
      setProducts(response.data.data);
    } catch (error) {
      console.error(error);
      message.error("Lỗi khi lấy danh sách sản phẩm");
    }
  };

  const fetchEmployees = async () => {
      
      try {
        const response = await axios.get('/api/employees');
        // response.data.data chứa danh sách nhân viên theo API đã viết
        setEmployees(response.data.data);
      } catch (error) {
        console.error('Lỗi khi lấy danh sách nhân viên:', error);
        message.error('Lỗi khi lấy danh sách nhân viên');
      } finally {
       
      }
    };
   useEffect(() => {
    fetchProducts();
    fetchNamePage();
    fetchEmployees();
  }, []);
  const mktOptions = employees
    .filter((order) => order.position_team === "mkt")
    .map((order) => order.name);

  // Tạo mapping từ tên page (đã trim) sang nhân viên phụ trách (mkt)
const pageMapping = dataPagename.reduce((acc, item) => {
  const key = item.pageName.trim();
  // Nếu có nhiều mục với cùng pageName, bạn có thể quyết định xem lấy mục nào (ở đây lấy mục cuối cùng)
  acc[key] = item.employee;
  return acc;
}, {});

// Hàm xử lý khi người dùng chọn tên page từ Select
const handlePageNameChange = (value) => {
  // Đảm bảo value được trim để khớp với mapping
  const trimmedValue = value.trim();
  const mappedEmployee = pageMapping[trimmedValue] || "";
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
    .filter((order) => order.position_team === "sale")
    .map((order) => order.name);
  const pageNameOptions = dataPagename.map((order) => order.pageName);
  const salexulyOptions = employees
    .filter((order) => order.position === "salexuly")
    .map((order) => order.name);

  const saleBaoOptions = ["DONE","OK", "HỦY", "ĐỢI XN", "NGUY CƠ", "BÙNG", "ĐANG UP", "CHECK"];
  const massOptions = ["Nặng", "Nhẹ"];
  const thanhToanOptions = ["ĐÃ THANH TOÁN", "CHƯA THANH TOÁN"];
  const tinhTrangGHOptions = ["ĐÃ GỬI HÀNG", "GIAO THÀNH CÔNG","BỊ BẮT CHỜ GỬI LẠI"];
const fetchNamePage = async () => {
    try {
      const response = await axios.get('/api/pageName');
      setdataPagename(response.data.data); // Danh sách đơn hàng
    } catch (error) {
      console.error('Lỗi khi lấy đơn hàng:', error);
    }
  };
  // Khi có initialValues (dữ liệu cũ) thì chuyển các trường ngày về đối tượng dayjs
 
const productOptions = products.map((p) => p.name);
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
      {currentUser.position === "kho1" || currentUser.position === "kho2" ? (
        <>
          <Form form={form} layout="vertical" onFinish={onFinish}>
            {/* Các trường dành cho nhân viên kho */}
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

            {/* Các trường ẩn khi là kho */}
            <Form.Item label="NGÀY ĐẶT" name="orderDate" hidden={true}>
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item label="STT" name="stt" hidden={true}>
              <Input type="number" />
            </Form.Item>
            <Form.Item label="TÊN KHÁCH" name="customerName" hidden={true}>
              <Input />
            </Form.Item>
            <Form.Item label="TÊN PAGE" name="pageName" hidden={true}>
              <Input />
            </Form.Item>
            <Form.Item label="SALE Xử lý" name="salexuly" hidden={true}>
              <Select>
                {salexulyOptions.map((employee) => (
                  <Option key={employee} value={employee}>
                    {employee}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            
           
            <Form.Item label="DOANH SỐ" name="profit" hidden={true}>
              <Input type="number" />
            </Form.Item>
            <Form.Item label="SỐ ĐIỆN THOẠI" name="phone" hidden={true}>
              <Input type="tel" />
            </Form.Item>
            <Form.Item label="ĐỊA CHỈ" name="address" hidden={true}>
              <Input.TextArea rows={3} />
            </Form.Item>
            <Form.Item label="GHI CHÚ SALE" name="note" hidden={true}>
              <Input.TextArea rows={3} />
            </Form.Item>
            <Form.Item label="GHI CHÚ KHO" name="noteKHO" hidden={true}>
              <Input.TextArea rows={3} />
            </Form.Item>
            <Form.Item label="Phân loại" name="category" hidden={true}>
              <Input />
            </Form.Item>
            {/* <Form.Item label="Hàng nặng/nhẹ" name="mass" hidden={true}>
              <Input />
            </Form.Item> */}
            <Form.List name="products" hidden={true}>
                  {(fields, { }) => (
                    <>
                      {fields.map((field) => (
                        <Space key={field.key} align="baseline">
                          <Form.Item hidden={true}
                            {...field}
                            name={[field.name, "product"]}
                            fieldKey={[field.fieldKey, "product"]}
                            rules={[{ required: true, message: "Chọn sản phẩm" }]}
                          >
                            <Select placeholder="Chọn sản phẩm" style={{ width: 200 }} showSearch>
                              {productOptions.map((product) => (
                                <Option key={product} value={product}>
                                  {product}
                                </Option>
                              ))}
                            </Select>
                          </Form.Item>
                          <Form.Item hidden={true}  
                            {...field}
                            name={[field.name, "quantity"]}
                            fieldKey={[field.fieldKey, "quantity"]}
                            rules={[{ required: true, message: "Nhập số lượng" }]}
                          >
                            <Input type="number" placeholder="Số lượng" style={{ width: 100 }} />
                          </Form.Item>
                          
                        </Space>
                      ))}
                     
                    </>
                  )}
                </Form.List>
              
            <Form.Item label="MKT" name="mkt" hidden={true}>
              <Select showSearch>
                {mktOptions.map((mkt) => (
                  <Option key={mkt} value={mkt}>
                    {mkt}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label="SALE" name="sale" hidden={true}>
              <Select showSearch>
                {saleOptions.map((sale) => (
                  <Option key={sale} value={sale}>
                    {sale}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label="DOANH SỐ" name="revenue" hidden={true}>
              <Input type="number" />
            </Form.Item>
            <Form.Item label="TT SALE XỬ LÍ ĐƠN" name="processStatus" hidden={true}>
              <Select>
                {handleTTXLOptions.map((status) => (
                  <Option key={status} value={status}>
                    {status}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label="SALE BÁO" name="saleReport" hidden={true}>
              <Select>
                {saleBaoOptions.map((report) => (
                  <Option key={report} value={report}>
                    {report}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label="Chọn SALE Xử lý" name="salexuly" hidden={true}>
              <Select showSearch>
                {salexulyOptions.map((sale) => (
                  <Option key={sale} value={sale}>
                    {sale}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label="THANH TOÁN" name="paymentStatus" hidden={true}>
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
              {(currentUser.position_team !== "kho" || initialValues) && (
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
                <Form.Item  label="NGÀY ĐẶT" name="orderDate">
                  <DatePicker style={{ width: "100%" }} disabled={true} />
                </Form.Item>
                {/* <Form.Item label="Hàng nặng/nhẹ" name="mass">
                  <Select showSearch>
                    {massOptions.map((mas) => (
                      <Option key={mas} value={mas}>
                        {mas}
                      </Option>
                    ))}
                  </Select>
                </Form.Item> */}
                <Form.Item label="TÊN KHÁCH" name="customerName">
                  <Input />
                </Form.Item>
                <Form.Item label="TÊN PAGE" name="pageName">
  <Select
    disabled={currentUser.position === "salexuly" || currentUser.position === "salexacnhan"}
    showSearch
    onChange={handlePageNameChange}
  >
    {dataPagename.map((item, index) => {
  const trimmedPageName = item.pageName.trim();
  return (
    <Option key={`${trimmedPageName}-${index}`} value={trimmedPageName}>
      {trimmedPageName}
    </Option>
  );
})}
  </Select>
</Form.Item>
                <Form.Item label="SỐ ĐIỆN THOẠI" name="phone">
                  <Input type="tel" />
                </Form.Item>
                <Form.Item label="ĐỊA CHỈ" name="address">
                  <Input.TextArea rows={2} />
                </Form.Item>
              </Col>
              <Col span={9}>
                {/* Thay đổi: dùng Form.List cho SẢN PHẨM và SỐ LƯỢNG SP */}
                <p style={{ marginBottom: 3, marginTop: 5  }}>SẢN PHẨM</p>
                <Form.List name="products">
                  {(fields, { add, remove }) => (
                    <>
                      {fields.map((field,index) => (
                        <Space key={`${field.key}-${index}`} align="baseline">
                          <Form.Item
                            {...field}
                            name={[field.name, "product"]}
                            fieldKey={[field.fieldKey, "product"]}
                            rules={[{ required: true, message: "Chọn sản phẩm" }]}
                          >
                            <Select placeholder="Chọn sản phẩm" style={{ width: 270 }} showSearch>
                              {productOptions.map((product) => (
                                <Option key={product} value={product}>
                                  {product}
                                </Option>
                              ))}
                            </Select>
                          </Form.Item>
                          <Form.Item
                            {...field}
                            name={[field.name, "quantity"]}
                            fieldKey={[field.fieldKey, "quantity"]}
                            rules={[{ required: true, message: "Nhập số lượng" }]}
                          >
                            <Input type="number" placeholder="SL" style={{ width: 60 }} />
                          </Form.Item>
                          <MinusCircleOutlined onClick={() => remove(field.name)} />
                        </Space>
                      ))}
                      <Form.Item>
                        <Button type="" onClick={() => add()} block icon={<PlusOutlined />}>
                          Thêm sản phẩm
                        </Button>
                      </Form.Item>
                    </>
                  )}
                </Form.List>

                <Form.Item label="QUÀ" name="category">
                  <Input />
                </Form.Item>
                <Form.Item label="DOANH SỐ" name="revenue">
                  <Input type="number" />
                </Form.Item>
                <Form.Item label="SALE CHAT" name="sale" initialValue={currentUser.name}>
                  <Select
                    disabled={currentUser.position === "salexuly" || currentUser.position === "salexacnhan"}
                    showSearch
                  >
                    {saleOptions.map((employee) => (
                      <Option key={employee} value={employee}>
                        {employee}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item label="VẬN ĐƠN" name="salexuly" initialValue={namesalexuly}>
                  <Select disabled={currentUser.position === "salexuly" || currentUser.position === "salexacnhan" ||currentUser.position === "salefull" }>
                    {salexulyOptions.map((employee) => (
                      <Option key={employee} value={employee}>
                        {employee}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
               
              </Col>
              <Col span={7}>
                
                
                
                <Form.Item label="GHI CHÚ SALE" name="note">
                  <Input.TextArea
                    rows={3}
                    onFocus={(e) => {
                      if (!e.target.value) {
                        const prefix = `${currentUser.name}: `;
                        form.setFieldsValue({ note: prefix });
                      }
                    }}
                  />
                </Form.Item>
                <Form.Item label="TT SALE XỬ LÍ ĐƠN" name="processStatus">
                  <Select>
                    {handleTTXLOptions.map((status) => (
                      <Option key={status} value={status}>
                        {status}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item label="ĐƠN" name="saleReport">
                  <Select allowClear>
                    {saleBaoOptions.map((report) => (
                      <Option key={report} value={report}>
                        {report}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item label="THANH TOÁN" name="paymentStatus">
                  <Select>
                    {thanhToanOptions.map((status) => (
                      <Option key={status} value={status}>
                        {status}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item label="MKT" name="mkt">
                  <Input value={employeeNamepage} readOnly />
                </Form.Item>  
              </Col>
            </Row>
            
            <Form.Item label="TÌNH TRẠNG GIAO HÀNG" name="deliveryStatus" hidden={currentUser.position_team === "sale"}>
              <Select>
                {tinhTrangGHOptions.map((status) => (
                  <Option key={status} value={status}>
                    {status}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label="MÃ VẬN ĐƠN" name="trackingCode" hidden={currentUser.position_team === "sale"}>
              <Input />
            </Form.Item>
            <Form.Item label="NGÀY GỬI" name="shippingDate1" hidden={currentUser.position_team === "sale"}>
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item label="NGÀY NHẬN" name="shippingDate2" hidden={currentUser.position_team === "sale"}>
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item label="GHI CHÚ KHO" name="noteKHO" hidden={currentUser.position_team === "sale"}>
              <Input.TextArea rows={3} />
            </Form.Item>
            <Form.Item style={{ marginTop: 24, textAlign: "right" }}>
              <Button style={{ marginRight: 8 }} onClick={onCancel}>
                Hủy
              </Button>
              {(currentUser.position_team === "sale" || initialValues) && (
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
