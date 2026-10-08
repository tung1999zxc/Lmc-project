import React, { ReactNode } from "react";

export const metadata = {
  title: "LMC – Trang công khai",
  description: "Các trang không yêu cầu đăng nhập.",
};

// Layout này nằm trong route group "(standalone)" nên KHÔNG bị
// src/app/layout.tsx (có kiểm tra đăng nhập + redirect về /login) áp vào.
// Mọi trang public đặt trong src/app/(standalone)/... sẽ render trực tiếp.
export default function StandaloneLayout({
  children
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}