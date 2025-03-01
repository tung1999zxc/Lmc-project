import React from 'react';
import { Button } from 'antd';
import * as XLSX from 'xlsx';

const ExportExcelButton = ({ orders }) => {
  const exportOrdersToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(orders);
     // Duyệt qua các ô trong worksheet để bật wrap text nếu có ký tự xuống dòng
  for (const cell in worksheet) {
    if (cell[0] === '!') continue; // bỏ qua các key đặc biệt
    const cellValue = worksheet[cell].v;
    if (typeof cellValue === 'string' && cellValue.includes('\n')) {
      worksheet[cell].s = {
        alignment: { wrapText: true },
      };
    }
  }
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
