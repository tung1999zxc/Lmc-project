// app/products/page.js
"use client";
import { useEffect, useState } from "react";
import { Table, Button, message, Modal } from "antd";
import axios from "axios";
import Link from "next/link";
import ProductForm from "../components/ProductForm";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const res = await axios.get("/api/products");
    setProducts(res.data);
    setLoading(false);
  };

  const deleteProduct = async (id) => {
    await axios.delete("/api/products", { data: { id } });
    message.success("Xóa sản phẩm thành công");
    fetchProducts();
  };

  return (
    <div>
      <h1>Quản lý sản phẩm</h1>
      <Button type="primary" onClick={() => setIsModalOpen(true)}>Thêm sản phẩm</Button>
      <Table 
        dataSource={products} 
        rowKey="id" 
        loading={loading}
        columns={[
          { title: "Tên", dataIndex: "name", key: "name" },
          { title: "Giá", dataIndex: "price", key: "price", render: price => `$${price}` },
          { title: "Kho", dataIndex: "stock", key: "stock" },
          {
            title: "Hành động",
            render: (text, record) => (
              <>
                <Link href={`/products/${record.id}`}>
                  <Button type="link">Xem</Button>
                </Link>
                <Button danger onClick={() => deleteProduct(record.id)}>Xóa</Button>
              </>
            ),
          }
        ]}
      />
      <Modal 
        title="Thêm sản phẩm mới" 
        open={isModalOpen} 
        onCancel={() => setIsModalOpen(false)}
        footer={null}
      >
        <ProductForm onSuccess={fetchProducts} onClose={() => setIsModalOpen(false)} />
      </Modal>
    </div>
  );
}
