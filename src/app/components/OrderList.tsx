"use client";
import { Table, Space, Button, Popconfirm, message, DatePicker, Input, Select, Row, Col, Tag } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useState, useMemo,useEffect } from 'react';
import dayjs from 'dayjs';
import OrderForm from './OrderForm';
import isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(isBetween);

const { RangePicker } = DatePicker;
const { Search } = Input;

// Danh sách options

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



interface Order {
  id: string;
  orderDate: string;
  stt: number;
  customerName: string;
  pageName: string;
  product: string;
  category: string;
  quantity: number;
  mkt: string;
  sale: string;
  revenue: number;
  profit: number;
  phone: string;
  address: string;
  note: string;
  noteKHO: string;
  processStatus: string;
  saleReport: string;
  paymentStatus: string;
  deliveryStatus: string;
  trackingCode: string;
  shippingDate1: string;
  shippingDate2: string;
}

const OrderList = () => {
//   const [orders, setOrders] = useState<Order[]>([]);
  const [orders, setOrders] = useState(() => {
    const savedOrders = localStorage.getItem("orders");
    return savedOrders ? JSON.parse(savedOrders) : [];
  });
  const [currentEditId, setCurrentEditId] = useState<string | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>();
  const [searchText, setSearchText] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('');
  const [selectedSale, setSelectedSale] = useState<string>();
  const [selectedMKT, setSelectedMKT] = useState<string>();
  const NVKHO = false;
  const NVMKT = true;
//   useEffect(() => { // Đánh dấu component đã mount trên client
//     const savedOrders = localStorage.getItem("orders");
//     if (savedOrders) {
//       setOrders(JSON.parse(savedOrders));
//     }
//   }, []);
  useEffect(() => {
    
    localStorage.setItem("orders", JSON.stringify(orders));
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const dateMatch = dateRange 
        ? dayjs(order.orderDate).isBetween(dateRange[0], dateRange[1], 'day', '[]')
        : true;
      
      const searchMatch = searchText.toLowerCase().split(' ').every(term =>
        Object.values(order).some(value => 
          String(value).toLowerCase().includes(term)
        )
      );

      let filterMatch = true;
      switch(selectedFilter) {
        case 'today': filterMatch = dayjs(order.orderDate).isSame(dayjs(), 'day'); break;
        case 'not_delivered': filterMatch = order.deliveryStatus === 'ĐÃ GỬI HÀNG'; break;
        case 'delivered': filterMatch = order.deliveryStatus === 'GIAO THÀNH CÔNG'; break;
        case 'unpaid_success': filterMatch = order.paymentStatus === 'CHƯA THANH TOÁN' && order.deliveryStatus === 'GIAO THÀNH CÔNG'; break;
        case 'unpaid': filterMatch = order.paymentStatus === 'CHƯA THANH TOÁN'; break;
        case 'paid': filterMatch = order.paymentStatus === 'ĐÃ THANH TOÁN'; break;
        case 'duplicate_name': filterMatch = orders.filter(o => o.customerName === order.customerName).length > 1; break;
        case 'duplicate_phone': filterMatch = orders.filter(o => o.phone === order.phone).length > 1; break;
        case 'waiting_approval': filterMatch = order.saleReport === 'ĐỢI XN'; break;
        case 'same_sale': filterMatch = selectedSale ? order.sale === selectedSale : true; break;   
        case 'same_mkt': filterMatch = selectedMKT ? order.mkt === selectedMKT : true; break;
      }

      return dateMatch && searchMatch && filterMatch;
    });
  }, [orders, dateRange, searchText, selectedFilter, selectedSale, selectedMKT]);

  const columns = [
    {
        title: 'Thao Tác',
        key: 'action',
        render: (_: any, record: Order) => (
          <Space>
            <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
            <Popconfirm title="Xóa đơn hàng?" onConfirm={() => handleDelete(record.id)}>
              <Button danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        )
      },
    { title: 'NGÀY ĐẶT', dataIndex: 'orderDate', key: 'orderDate', render: (text: string) => dayjs(text).format('DD/MM/YYYY') },
    { title: 'THANH TOÁN', dataIndex: 'paymentStatus', key: 'paymentStatus', render: (text: string) => <Tag color={text === 'ĐÃ THANH TOÁN' ? 'green' : 'red'}>{text}</Tag> },
    { title: 'TÌNH TRẠNG GH', dataIndex: 'deliveryStatus', key: 'deliveryStatus', render: (text: string) => <Tag color={text === 'GIAO THÀNH CÔNG' ? 'blue' : 'orange'}>{text}</Tag> },
    { title: 'SALE BÁO', dataIndex: 'saleReport', key: 'saleReport' },
    { title: 'MÃ VẬN ĐƠN', dataIndex: 'trackingCode', key: 'trackingCode' },
    { title: 'TÊN KHÁCH', dataIndex: 'customerName', key: 'customerName' },
    { title: 'TÊN PAGE', dataIndex: 'pageName', key: 'pageName' },
    { title: 'SẢN PHẨM', dataIndex: 'product', key: 'product' },
    { title: 'Phân loại', dataIndex: 'category', key: 'category' },
    { title: 'SL SP', dataIndex: 'quantity', key: 'quantity' },
    { title: 'MKT', dataIndex: 'mkt', key: 'mkt' },
    { title: 'SALE', dataIndex: 'sale', key: 'sale' },
    { title: 'DOANH SỐ', dataIndex: 'revenue', key: 'revenue' },
    { title: 'DOANH THU', dataIndex: 'profit', key: 'profit' },
    { title: 'SĐT', dataIndex: 'phone', key: 'phone' },
    { title: 'ĐỊA CHỈ', dataIndex: 'address', key: 'address' },
    { title: 'GHI CHÚ SALE', dataIndex: 'note', key: 'note' },
    { title: 'GHI CHÚ KHO', dataIndex: 'noteKHO', key: 'noteKHO' },
    { title: 'TT XỬ LÍ', dataIndex: 'processStatus', key: 'processStatus' },
    { title: 'NGÀY GỬI', dataIndex: 'shippingDate1', key: 'shippingDate1', render: (text: string) => text && dayjs(text).format('DD/MM/YYYY') },
    { title: 'NGÀY NHẬN', dataIndex: 'shippingDate2', key: 'shippingDate2', render: (text: string) => text && dayjs(text).format('DD/MM/YYYY') }
    
  ];
  const columnsMKT = [

    { title: 'NGÀY ĐẶT', dataIndex: 'orderDate', key: 'orderDate', render: (text: string) => dayjs(text).format('DD/MM/YYYY') },
    { title: 'THANH TOÁN', dataIndex: 'paymentStatus', key: 'paymentStatus', render: (text: string) => <Tag color={text === 'ĐÃ THANH TOÁN' ? 'green' : 'red'}>{text}</Tag> },
    { title: 'TÊN KHÁCH', dataIndex: 'customerName', key: 'customerName' },
    { title: 'TÊN PAGE', dataIndex: 'pageName', key: 'pageName' },
    { title: 'SẢN PHẨM', dataIndex: 'product', key: 'product' },
    { title: 'SL SP', dataIndex: 'quantity', key: 'quantity' },
    { title: 'MKT', dataIndex: 'mkt', key: 'mkt' },
    { title: 'DOANH SỐ', dataIndex: 'revenue', key: 'revenue' },
    { title: 'DOANH THU', dataIndex: 'profit', key: 'profit' },
    { title: 'GHI CHÚ SALE', dataIndex: 'note', key: 'note' },
    
  ];
  const columnsKHO = [
    {
        title: 'Thao Tác',
        key: 'action',
        render: (_: any, record: Order) => (
          <Space>
            <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
            
          </Space>
        )
      },
    { title: 'NGÀY ĐẶT', dataIndex: 'orderDate', key: 'orderDate', render: (text: string) => dayjs(text).format('DD/MM/YYYY') },
    { title: 'TÌNH TRẠNG GH', dataIndex: 'deliveryStatus', key: 'deliveryStatus', render: (text: string) => <Tag color={text === 'GIAO THÀNH CÔNG' ? 'blue' : 'orange'}>{text}</Tag> },
    { title: 'MÃ VẬN ĐƠN', dataIndex: 'trackingCode', key: 'trackingCode' },
    { title: 'TÊN KHÁCH', dataIndex: 'customerName', key: 'customerName' },
    { title: 'SẢN PHẨM', dataIndex: 'product', key: 'product' },
    { title: 'Phân loại', dataIndex: 'category', key: 'category' },
    { title: 'SL SP', dataIndex: 'quantity', key: 'quantity' },
    { title: 'SĐT', dataIndex: 'phone', key: 'phone' },
    { title: 'ĐỊA CHỈ', dataIndex: 'address', key: 'address' },
    { title: 'GHI CHÚ SALE', dataIndex: 'note', key: 'note' },
    { title: 'GHI CHÚ KHO', dataIndex: 'noteKHO', key: 'noteKHO' },
    { title: 'NGÀY GỬI', dataIndex: 'shippingDate1', key: 'shippingDate1', render: (text: string) => text && dayjs(text).format('DD/MM/YYYY') },
    { title: 'NGÀY NHẬN', dataIndex: 'shippingDate2', key: 'shippingDate2', render: (text: string) => text && dayjs(text).format('DD/MM/YYYY') }
    
  ];
  const handleAddNew = () => {
    setCurrentEditId(null);
    setFormVisible(true);
  };

  const handleEdit = (order: Order) => {
    setCurrentEditId(order.id);
    setFormVisible(true);
  };

  const handleDelete = (id: string) => {
    setOrders(prev => prev.filter(order => order.id !== id));
    message.success('Xóa đơn hàng thành công');
   
  };

  const handleSubmit = (values: any) => {
    const newOrder = {
      ...values,
      id: currentEditId || Date.now().toString(),
      
    };

    setOrders(prev => {const updatedOrders = currentEditId 
      ? prev.map(order => order.id === currentEditId ? newOrder : order) 
      : [...prev, newOrder];
    //   localStorage.setItem("orders", JSON.stringify(orders));
      return updatedOrders;
  });
    setFormVisible(false);
    message.success(currentEditId ? 'Cập nhật thành công' : 'Thêm mới thành công');
    
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={handleAddNew}>Thêm đơn hàng mới</Button>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <RangePicker 
            format="DD/MM/YYYY" 
            onChange={dates => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])} 
            style={{ width: '100%' }} 
          />
        </Col>
        <Col span={6}>
          <Search
            placeholder="Tìm kiếm..."
            allowClear
            onSearch={setSearchText}
            onChange={e => setSearchText(e.target.value)}
          />
        </Col>
        <Col span={6}>
          <Select
            style={{ width: '100%' }}
            placeholder="Chọn bộ lọc"
            options={[
              { value: 'today', label: 'Đơn mới trong ngày' },
              { value: 'not_delivered', label: 'Đã gửi hàng' },
              { value: 'delivered', label: 'Giao thành công' },
              { value: 'unpaid_success', label: 'Chưa thanh toán & Giao Thành công' },
              { value: 'unpaid', label: 'Chưa thanh toán' },
              { value: 'paid', label: 'Đã thanh toán' },
              { value: 'duplicate_name', label: 'Trùng tên khách' },
              { value: 'duplicate_phone', label: 'Trùng số điện thoại' },
              { value: 'waiting_approval', label: 'Đợi xác nhận' },
              { value: 'same_sale', label: 'Cùng Sale' },
              { value: 'same_mkt', label: 'Cùng MKT' },
            ]}
            onChange={setSelectedFilter}
          />
        </Col>
        <Col span={3}>
          <Select
            placeholder="Chọn Sale"
            options={saleOptions.map(s => ({ value: s, label: s }))}
            onChange={setSelectedSale}
            allowClear
            showSearch
          />
        </Col>
        <Col span={3}>
          <Select
            placeholder="Chọn MKT"
            options={mktOptions.map(m => ({ value: m, label: m }))}
            onChange={setSelectedMKT}
            allowClear
            showSearch
          />
        </Col>
      </Row>

      <Table
        columns={ NVKHO? columnsKHO: NVMKT?columnsMKT : columns}
        dataSource={filteredOrders}
        rowKey="id"
        scroll={{ x: 2500 }}
        bordered
        pagination={{ pageSize: 10 }}
      />

      <OrderForm
        visible={formVisible}
        onCancel={() => setFormVisible(false)}
        onSubmit={handleSubmit}
        initialValues={orders.find(order => order.id === currentEditId)}
      />
    </div>
  );
};

export default OrderList;