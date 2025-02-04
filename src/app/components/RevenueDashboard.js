"use client"
import { Card, Select, DatePicker, Row, Col, Statistic } from 'antd';
import { useState } from 'react';
import dynamic from 'next/dynamic';

const { Option } = Select;
const { RangePicker } = DatePicker;
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

const RevenueDashboard = () => {
  const [dateRange, setDateRange] = useState(null);
  const [channel, setChannel] = useState('Tất cả kênh bán hàng');

  const chartOptions = {
    chart: { type: 'line' },
    xaxis: { categories: ['01/02/2025', '31/01/2025'] },
  };

  const chartSeries = [{ name: 'Doanh thu', data: [0, 0] }];

  return (
    <Card title="Doanh Thu Thuần - Tất cả kênh bán hàng">
      <Row gutter={[16, 16]} align="middle">
        <Col span={12}>
          <RangePicker onChange={(dates) => setDateRange(dates)} />
        </Col>
        <Col span={12}>
          <Select value={channel} onChange={setChannel} style={{ width: '100%' }}>
            <Option value="Tất cả kênh bán hàng">Tất cả kênh bán hàng</Option>
            <Option value="Shopee">Shopee</Option>
            <Option value="Lazada">Lazada</Option>
          </Select>
        </Col>
      </Row>
      <Chart options={chartOptions} series={chartSeries} type="line" height={300} />
      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={6}><Statistic title="Tổng đơn hàng" value={0} /></Col>
        <Col span={7}><Statistic title="Lượng hàng đã bán" value={0} /></Col>
        <Col span={5}><Statistic title="Giá vốn" value={0} /></Col>
        <Col span={6}><Statistic title="Lợi nhuận" value={0} /></Col>
      </Row>
    </Card>
  );
};

export default RevenueDashboard;
