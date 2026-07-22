"use client";

export default function TeleChatPage() {
  return (
    <iframe
      src={`https://t.me/tung99bot?start=webapp`}
      style={{
        width: "100%",
        height: "100vh",
        border: "none",
      }}
    ></iframe>
  );
}
