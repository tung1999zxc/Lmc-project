import React from 'react';
import { Button } from 'antd';
import * as XLSX from 'xlsx';

const ExportExcelButton = ({ orders }) => {
  const exportOrdersToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(orders);
    const workbook = { Sheets: { 'Orders': worksheet }, SheetNames: ['Orders'] };
    XLSX.writeFile(workbook, 'orders.xlsx');
  };

  return (
    <Button type="primary" onClick={exportOrdersToExcel}>
      Xuất đơn hàng ra Excel
    </Button>
  );
};

export default ExportExcelButton;
