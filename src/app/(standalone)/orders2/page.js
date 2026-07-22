import OrderForm2 from "../../components/OrderForm2";
import OrderList2 from "../../components/OrderList2";

export default function OrderPage() {
  return (
    <div style={{ height: "100vh", overflow: "auto", padding: "16px" }}>
      <style>{`
        .ant-table-wrapper .ant-table-tbody > tr > td {
          padding: 8px 4px !important;
          font-size: 12px !important;
        }
        .ant-table-wrapper .ant-table-thead > tr > th {
          padding: 8px 4px !important;
          font-size: 12px !important;
        }
      `}</style>
      <OrderForm2 />
      <OrderList2 />
    </div>
  );
}
