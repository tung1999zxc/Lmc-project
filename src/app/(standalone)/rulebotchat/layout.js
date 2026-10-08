"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function RulebotChatLayout({ children }) {
  const pathname = usePathname();

  // Xác định tab đang active dựa trên URL hiện tại.
  const tabs = [
    { href: "/rulebotchat", label: "Privacy Policy", match: (p) => p === "/rulebotchat" },
    {
      href: "/rulebotchat/usecase",
      label: "Use Case",
      match: (p) => p === "/rulebotchat/usecase" || p?.startsWith?.("/rulebotchat/usecase/"),
    },
  ];

  return (
    <div
      style={{
        fontFamily:
          'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        maxWidth: 820,
        margin: "32px auto",
        padding: "0 20px 48px",
        lineHeight: 1.6,
        color: "#222",
      }}
    >
      <style>{`
        .rbchat-wrap h1 { font-size: 1.6rem; margin-bottom: 0.2em; }
        .rbchat-wrap h2 { font-size: 1.2rem; margin-top: 1.6em; }
        .rbchat-wrap h3 { font-size: 1.05rem; margin-top: 1.4em; }
        .rbchat-wrap code {
          background: #f3f4f6;
          padding: 1px 6px;
          border-radius: 4px;
          font-size: 0.92em;
        }
        .rbchat-wrap a { color: #1d4ed8; }
        .rbchat-wrap a:hover { text-decoration: underline; }
        .rbchat-wrap hr { border: 0; border-top: 1px solid #e5e7eb; margin: 32px 0; }
        .rbchat-wrap ul, .rbchat-wrap ol { padding-left: 1.4em; }
        .rbchat-wrap li { margin: 4px 0; }
        .rbchat-wrap .updated { color: #666; font-size: 0.9rem; }
        .rbchat-wrap .footer-note { font-size: 0.85rem; color: #666; }
        .rbchat-wrap .lead { color: #333; }
        .rbchat-wrap pre {
          background: #0f172a;
          color: #e2e8f0;
          padding: 16px 18px;
          border-radius: 8px;
          overflow-x: auto;
          font-size: 0.9rem;
          line-height: 1.55;
          margin: 12px 0 24px;
        }
        .rbchat-wrap pre b { color: #fde68a; font-weight: 600; }
        .rbchat-wrap .badge {
          display: inline-block;
          background: #1d4ed8;
          color: #fff;
          font-size: 0.75rem;
          padding: 2px 8px;
          border-radius: 999px;
          margin-left: 8px;
          vertical-align: middle;
        }

        .rbchat-tabs {
          display: flex;
          gap: 6px;
          border-bottom: 1px solid #e5e7eb;
          margin-bottom: 24px;
        }
        .rbchat-tabs a {
          padding: 10px 16px;
          text-decoration: none;
          color: #555;
          font-size: 0.95rem;
          border-bottom: 2px solid transparent;
          transition: color 0.15s, border-color 0.15s;
        }
        .rbchat-tabs a:hover { color: #111; }
        .rbchat-tabs a.active {
          color: #1d4ed8;
          border-bottom-color: #1d4ed8;
          font-weight: 600;
        }
      `}</style>

      <div className="rbchat-wrap">
        <h1>
          Extension &quot;Inbox Camp&quot;
          <span className="badge">Meta App Docs</span>
        </h1>
        <p className="updated">
          Tài liệu nộp cho Meta App Review — cập nhật ngày 07 tháng 10 năm
          2026
        </p>

        <nav className="rbchat-tabs" aria-label="Tài liệu Inbox Camp">
          {tabs.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className={t.match(pathname) ? "active" : ""}
            >
              {t.label}
            </Link>
          ))}
        </nav>

        {children}
      </div>
    </div>
  );
}