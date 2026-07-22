"use client";
import Script from "next/script";

export default function TelegramWidget() {
  return (
    <>
      <Script
        src="https://telegram.org/js/telegram-widget.js?22"
        data-telegram-login="tung99bot"
        data-size="large"
        data-auth-url="/api/tele-auth"
        data-request-access="write"
        strategy="afterInteractive"
      />
    </>
  );
}
