// src/app/api/viaLinks/route.js
import { connectToDatabase } from '../../../app/lib/mongodb.js';
import { ObjectId } from 'mongodb';

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const links = await db.collection('viaLinks').find({}).toArray();
    return new Response(JSON.stringify({ data: links }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Lỗi server' }), { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { link } = await req.json();
    const { db } = await connectToDatabase();
    const newVia = { link, createdAt: new Date() };
    const result = await db.collection('viaLinks').insertOne(newVia);
    return new Response(JSON.stringify({ message: 'Thêm thành công', data: { ...newVia, _id: result.insertedId } }), { status: 201 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Lỗi server' }), { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const { id, link } = await req.json();
    const { db } = await connectToDatabase();
    await db.collection('viaLinks').updateOne({ _id: new ObjectId(id) }, { $set: { link } });
    return new Response(JSON.stringify({ message: 'Cập nhật thành công' }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Lỗi server' }), { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const { db } = await connectToDatabase();
    await db.collection('viaLinks').deleteOne({ _id: new ObjectId(id) });
    return new Response(JSON.stringify({ message: 'Xóa thành công' }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Lỗi server' }), { status: 500 });
  }
}