// app/api/products/route.js
import { NextResponse } from 'next/server';

let products = [
  { id: 1, name: "Laptop", price: 1200, stock: 5 },
  { id: 2, name: "Phone", price: 800, stock: 10 },
  { id: 3, name: "Tablet", price: 500, stock: 8 }
];

// GET: Lấy danh sách sản phẩm
export async function GET() {
  return NextResponse.json(products);
}

// POST: Thêm sản phẩm mới
export async function POST(req) {
  const newProduct = await req.json();
  newProduct.id = products.length + 1;
  products.push(newProduct);
  return NextResponse.json(newProduct);
}

// DELETE: Xóa sản phẩm
export async function DELETE(req) {
  const { id } = await req.json();
  products = products.filter(p => p.id !== id);
  return NextResponse.json({ message: "Deleted successfully" });
}
