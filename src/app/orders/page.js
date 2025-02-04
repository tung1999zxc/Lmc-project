import OrderForm from '../components/OrderForm';
import OrderList from '../components/OrderList';

export default function OrderPage() {
  return (
    <div style={{  }}>
      <h1>Quản lý đơn hàng</h1>
      <OrderForm />
      <OrderList />
    </div>
  );
}