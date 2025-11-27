"use client";
import React, { useState, useEffect } from "react";
import axios from "axios"; 
import FullScreenLoading from './FullScreenLoading';

import {
  Form,
  Input,
  DatePicker,
  Select,
  Button,
  Row,Popover,Table ,Tag,
  Col,
  Modal,
  Space,
} from "antd";
import { MinusCircleOutlined,ReloadOutlined,PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import moment from "moment";
import { useDispatch, useSelector } from "react-redux";

const OrderFormjp = ({ visible, onCancel,loading, onSubmit, resetPagename,initialValues, namesalexuly, employees=[] ,dataPagename=[]}) => {
  const [form] = Form.useForm();
  const { Option } = Select;
  const currentUser = useSelector((state) => state.user.currentUser);
  // Giả sử: nếu mã nhân viên là 1 thì isEmployee1 = true
  
  const [loading2, setLoading2] = useState(false);
  
   

  // Danh sách options
  const [products, setProducts] = useState([]);
  const [employeeNamepage, setEmployeeNamepage] = useState("");
  const [modalCustomerOrders, setModalCustomerOrders] = useState([]);
const [modalVisible, setModalVisible] = useState(false);
const revenue = Form.useWatch("revenue", form);

  
  useEffect(() => {
  const numericProfit = Number(revenue); // chuyển về số
  if (numericProfit === 0) {
    form.setFieldsValue({
      orderDate5: dayjs(), // ngày giờ hiện tại
    });
  }
}, [revenue]);

const handleSearchCustomerModal = async (name) => {
  try {
    const res = await axios.get(`/api/tw/orders/search-by-customer?name=${encodeURIComponent(name)}`);
    setModalCustomerOrders(res.data.data || []);
    setModalVisible(true);
  } catch (err) {
    console.error(err);
    message.error('Không thể tìm đơn khách hàng');
  }
};

   const fetchProducts = async () => {
    setLoading2(true);
    try {
      const response = await axios.get('/api/tw/products');
      setProducts(response.data.data);
      setLoading2(false);
    } catch (error) {
      console.error(error);
      message.error("Lỗi khi lấy danh sách sản phẩm");
      setLoading2(false);
    }
  };
  
 
 
   useEffect(() => {
    fetchProducts();
    
   
  }, []);
  const mktOptions = employees
    .filter((order) => order.position_team === "mkt")
    .map((order) => order.name);

  // Tạo mapping từ tên page (đã trim) sang nhân viên phụ trách (mkt)
  // const pageMapping = dataPagename.reduce((acc, item) => {
  //   const key = item.pageName.trim();
  //   if (!acc[key]) {
  //     acc[key] = item.employee;
  //   }
  //   return acc;
  // }, {});
  const usedEmployees = new Set();
  const pageMapping = dataPagename.reduce((acc, item) => {
    const key = item.pageName.trim();
    
    if (!acc[key]) {
      acc[key] = [];
    }
  
    // Chỉ thêm employee nếu nó chưa được sử dụng ở bất kỳ pageName nào
    if (!usedEmployees.has(item.employee)) {
      acc[key].push(item.employee);
      usedEmployees.add(item.employee);
    }
  
    return acc;
  }, {});
// Hàm xử lý khi người dùng chọn tên page từ Select
const handlePageNameChange = (value) => {
  // Đảm bảo value được trim để khớp với mapping
  const trimmedValue = value.trim();
  const mappedEmployeeArr = pageMapping[trimmedValue] || [];
  const mappedEmployee =
    mappedEmployeeArr.length > 0 ? mappedEmployeeArr[0] : "";
  setEmployeeNamepage(mappedEmployee);
  form.setFieldsValue({ mkt: mappedEmployee });
};
  // Nếu có mapping, tự động cập nhật tên nhân viên tương ứng
  const handleTTXLOptions = [
    "THIẾU/SAI",
    "KHO SAI",
    "SALE SAI",
    "TÌM HÀNG",
    "LỖI SP",
    "CHẶN KHÁCH",
    "BOOK ĐƠN",
    "GỬI LẠI",
    "MUA LẠI",
    "HẸN",
    "ĐỢI GỬI LẠI",
    "ĐỔI Đ.CHỈ",
    "HOÀN",
    "S.BAY",
  ];

  const saleOptions = employees
    .filter((order) => order.position_team === "sale")
    .map((order) => order.name);
  const salexacnhanOptions = employees
    .filter((order) => order.position === "salexacnhan")
    .map((order) => order.name);


    
    
  const salexulyOptions = employees
    .filter((order) => order.position_team === "sale")
    .map((order) => order.name);

  const saleBaoOptions = ["DONE","OK", "HỦY", "ĐỢI XN","CHUYỂN ĐƠN", "BOOK TB","THIẾU TT","50/50", "NGUY CƠ", "BÙNG", "ĐANG UP", "CHECK"];
  const massOptions = ["Nặng", "Nhẹ"];
  const thanhToanOptions = ["ĐÃ THANH TOÁN", "CHƯA THANH TOÁN"];
  const tinhTrangGHOptions = ["ĐÃ GỬI HÀNG", "GIAO THÀNH CÔNG","BỊ BẮT CHỜ GỬI LẠI","CHECK ĐỊA CHỈ"];

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

  return (<>
    <Modal
  title="Các đơn hàng của khách"
  visible={modalVisible}
  onCancel={() => setModalVisible(false)}
  footer={null}
  width={1300}
>
  <Table
    dataSource={modalCustomerOrders}
    columns={[
      { title: 'Sản phẩm', key: 'products', render: (_, record) => (
        record.products?.map(p => `${p.product} - SL: ${p.quantity}`).join(', ')
      )},
      { title: 'Tên Khách', dataIndex: "customerName",
        key: "customerName"},
        {
          title: 
              'TÊN PAGE'
           ,
          dataIndex: "pageName",
          key: "pageName",
          render: (text) => text ? text.split("||")[0].trim() : "",
        },
        { title: 'SĐT', dataIndex: 'phone', key: 'phone' },
      { title: 'Ngày đặt', dataIndex: 'orderDate', key: 'orderDate',render: (text) => dayjs(text).format("DD/MM"), },
      { title: 'STT', dataIndex: 'stt', key: 'stt' },
      {title: 'GHI CHÚ SALE',
      dataIndex: "note",
      key: "note",
      width: 200,
      render: (text) => <div style={{ width: 200,  }}><h3>{text} </h3></div>,
    },{
      title:
          "TT XỬ LÍ",
       
      dataIndex: "processStatus",
      key: "processStatus",
    },
    {
      title: 
          'ĐƠN'
        
      ,
      dataIndex: "saleReport",
      key: "saleReport",
      render: (text) => (
        <Tag color={text === "DONE" ? "green" : "red"}>{text}</Tag>
      ),
    },
    {
      title:
          'TÌNH TRẠNG GH',
      
      dataIndex: "deliveryStatus",
      width: 90,
      key: "deliveryStatus",
      render: (text) => (
        <Tag color={text === "GIAO THÀNH CÔNG" ? "blue" : "orange"}>{text}</Tag>
      ),
    }, {
      title: "THANH TOÁN",
      dataIndex: "paymentStatus",
      key: "paymentStatus",
      width: 100,
      render: (text) => (
        <Tag color={text === "ĐÃ THANH TOÁN" ? "green" : "red"}>{text}</Tag>
      )
    },
    ]}
    rowKey="id"
/>
</Modal>
    <Modal
      title={initialValues ? "Chỉnh sửa đơn hàng" : "Thêm đơn hàng mới"}
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={1000}
      style={{ top: 20 }}
    >
      <FullScreenLoading loading={loading2||loading} tip="Đang tải dữ liệu..." />

      {currentUser.position === "kho1" || currentUser.position === "kho2" ? (
        <>
          <Form form={form} layout="vertical" onFinish={onFinish}>
            {/* Các trường dành cho nhân viên kho */}
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item label="TÌNH TRẠNG GIAO HÀNG" name="deliveryStatus">
                  <Select allowClear>
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
                  <DatePicker allowClear style={{ width: "100%" }} format="YYYY-MM-DD" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item allowClear label="NGÀY NHẬN" name="shippingDate2">
                  <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
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
              <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD HH:mm:ss" />
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
            
           
           
            <Form.Item label="odate4" name="orderDate4" hidden={true}>
              <Input type="number" />
            </Form.Item>
            <Form.Item label="DOANH SỐ" name="revenue" hidden={true}>
              <Input type="number" />
            </Form.Item>
               <Form.Item label="ngày xóa ds" name="orderDate5" hidden>
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
            <Form.Item label="in đơn" name="istick" hidden={true}>
              <Input />
            </Form.Item>
            <Form.Item label="ĐÃ in đơn" name="istick4" hidden={true}>
              <Input />
            </Form.Item>
            <Form.Item label="cty đóng hàng" name="isShipping" hidden={true}>
              <Input />
            </Form.Item>
            <Form.Item label="xác nhận giao thành công" name="istickDONE" hidden={true}>
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
                            <Input type="number" min={1} placeholder="Số lượng" style={{ width: 100 }} />
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
            <Form.Item label="Ngày xóa ds" name="orderDate5" hidden={true} >
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
            <Form.Item label="SALE XÁC NHẬN" hidden={true} name="salexacnhan"> 
               
                </Form.Item>
                <Form.Item label="Link FB" hidden={true} name="fb">
                <Input />
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
                <Form.Item  label="NGÀY ĐẶT" name="orderDate" >
                  {/* <DatePicker style={{ width: "100%" }} disabled={true} /> */}
                  <DatePicker style={{ width: "100%" }} disabled={true}/>
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
               <Form.Item
  label="TÊN KHÁCH"
  name="customerName"
  rules={[{ required: true, message: 'Vui lòng nhập TÊN KHÁCH' }]}
>
  <Input
    onBlur={(e) => {
      const value = e.target.value.trim();
      if (value) handleSearchCustomerModal(value);
    }}
  />
</Form.Item>

                <div style={{ display: "flex", gap: 8 }}>
                <Form.Item label="TÊN PAGE" name="pageName"
               >
               
  <Select style={{ width: 270 }}
    allowClear
    disabled={ currentUser.position === "salexacnhan"}
    showSearch
    onChange={(value) => {
      // Giá trị nhận được có định dạng "pageName||employee"
      const [pageName, employee] = value.split("||");
      // Ví dụ: gán employee vào field "mkt"
      form.setFieldsValue({ mkt: employee });
    }}
    filterOption={(input, option) =>
      String(option.children)
        .toLowerCase()
        .includes(input.toLowerCase())
    }
  >
    {dataPagename.map((item, index) => {
      const trimmedPageName = item.pageName.trim();
      return (
        <Option
          key={`${trimmedPageName}-${index}`}
          value={`${trimmedPageName}||${item.employee}`}
        >
          {trimmedPageName} 
        </Option>
      );
    })}
  </Select> 
  
</Form.Item>  <ReloadOutlined
        style={{
          fontSize: 24,
          color: "#08c",
          cursor: "pointer",
          transition: "transform 0.5s",
          transform: loading ? "rotate(360deg)" : "none",
        }}
        spin={loading} // Tự động xoay khi loading
        onClick={resetPagename}
      /></div>
                <Form.Item label="SỐ ĐIỆN THOẠI" name="phone">
                  <Input type="tel" />
                </Form.Item>
                <Form.Item label="ĐỊA CHỈ" name="address">
                  <Input.TextArea rows={2} />
                </Form.Item>
                <Form.Item label="MKT" name="mkt" hidden={currentUser.position === "salenhapdon"} >
                  <Input value={employeeNamepage} disable ={currentUser.position !== "salexuly"||currentUser.position !== "managerSALE"||currentUser.position !== "leadSALE"||currentUser.position !== "salefull"}  />
                </Form.Item> 
              </Col>
              <Col span={9}>
                {/* Thay đổi: dùng Form.List cho SẢN PHẨM và SỐ LƯỢNG SP */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
  <p style={{ margin: 0 }}>SẢN PHẨM</p>
  <ReloadOutlined
    style={{
      fontSize: 24,
      color: "#08c",
      cursor: "pointer",
      transition: "transform 0.5s",
      transform: loading ? "rotate(360deg)" : "none",
    }}
    spin={loading}
    onClick={fetchProducts}
  />
</div>
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
    {productOptions.map((product) => {
      // Tìm sản phẩm tương ứng trong mảng products
      const productObj = products.find((p) => p.name === product);
      return (
        <Option key={product} value={product}>
          {/* <Popover
            content={
              productObj && productObj.image ? (
                <img src={productObj.image} alt={product} style={{ width: 150 }} />
              ) : null
            }
            title={product}
            trigger="hover"
          >
            <span>{product}</span>
          </Popover> */}
        </Option>
      );
    })}
  </Select>
</Form.Item>
                          <Form.Item
                            {...field}
                            name={[field.name, "quantity"]}
                            fieldKey={[field.fieldKey, "quantity"]}
                            rules={[{ required: true, message: "Nhập số lượng" }]}
                          >
                            <Input type="number" min={1} placeholder="SL" style={{ width: 60 }} />
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
                <Form.Item label="DOANH SỐ" name="revenue" >
                  <Input
                    type="number"
                    onChange={(e) => {
                      const value = e.target.value ? Number(e.target.value) : 0;
                      form.setFieldsValue({ revenue: value });
                    }}
                  />
                </Form.Item>
                                <Form.Item label="Ngày xóa ds" name="orderDate5" hidden={true}>
                             <Input type="number" />
                            </Form.Item>
                <Form.Item label="SALE CHAT" name="sale" initialValue={currentUser.name}>
               
                  <Select
                    disabled={
      (currentUser.position === "salexuly" ||
      currentUser.position === "salenhapdon" ||
        currentUser.position === "salexacnhan" ||
        currentUser.position === "salefull")
      //    &&
      // currentUser.name !== "Lê Linh Chi" &&
      // currentUser.name !== "Trần Thị Hồng Nhung"
    }
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
  <Select showSearch
    disabled={
      (currentUser.position === "salexuly" ||
      currentUser.position === "salenhapdon" ||
        currentUser.position === "salexacnhan" ||
        currentUser.position === "salefull")
      //    &&
      // currentUser.name !== "Lê Linh Chi" &&
      // currentUser.name !== "Trần Thị Hồng Nhung"
    }
  >
    {salexulyOptions.map((employee) => (
      <Option key={employee} value={employee}>
        {employee}
      </Option>
    ))}
  </Select>
</Form.Item>
                <Form.Item label="SALE XÁC NHẬN" name="salexacnhan" initialValue={currentUser.name}> 
                <Select
                    
                    showSearch
                  >
                    {salexacnhanOptions.map((employee) => (
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
                
                <Form.Item label="Link FB" name="fb">
                <Input />
                </Form.Item>
                <Form.Item label="TT SALE XỬ LÍ ĐƠN" name="processStatus">
                  <Select showSearch>
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
                <Form.Item label="THANH TOÁN" name="paymentStatus"
                rules={[{ required: true, message: 'Vui lòng nhập THANH TOÁN' }]}>
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
            <Form.Item label="in đơn" name="istick" hidden={true}>
              <Input />
            </Form.Item>
            <Form.Item label="ĐÃ in đơn" name="istick4" hidden={true}>
              <Input />
            </Form.Item>
            <Form.Item label="cty đóng hàng" name="isShipping" hidden={true}>
              <Input />
            </Form.Item>
            <Form.Item label="xác nhận giao thành công" name="istickDONE" hidden={true}>
              <Input />
            </Form.Item>
            <Form.Item label="NGÀY GỬI" name="shippingDate1"  hidden={currentUser.position_team === "sale"}>
              <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD"/>
            </Form.Item>
            <Form.Item label="odate4" name="orderDate4" hidden={true}>
              <Input type="number" />
            </Form.Item>
            <Form.Item label="NGÀY NHẬN" name="shippingDate2" hidden={currentUser.position_team === "sale"}>
              <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
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
    </>
  );
};

export default OrderFormjp;
