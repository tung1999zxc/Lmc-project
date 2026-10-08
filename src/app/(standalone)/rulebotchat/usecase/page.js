import React from "react";

// Trang con của /rulebotchat — Use Case (nộp cho Advanced Access).
// Header, tab điều hướng và style toàn cục đã được khai báo ở
// src/app/(standalone)/rulebotchat/layout.js.
export const metadata = {
  title: "Use Case – Extension Inbox Camp (Advanced Access)",
  description:
    "Use Case nộp cho Meta App Review xin Advanced Access cho pages_messaging và pages_read_engagement của Extension Inbox Camp.",
  robots: { index: true, follow: true },
};

export default function RulebotChatUseCasePage() {
  return (
    <>
      <h2 style={{ marginTop: 0 }}>Use Case — Advanced Access Request</h2>
      <p className="updated">Ngày nộp: 07 tháng 10 năm 2026</p>

      <p>
        We are submitting our browser extension <b>&quot;Inbox Camp&quot;</b>{" "}
        for <b>Advanced Access</b> to{" "}
        <code>pages_messaging</code> and{" "}
        <code>pages_read_engagement</code>.
      </p>

      <h2>1. Use case</h2>
      <p>
        <b>Manage messaging for a Page.</b>
      </p>

      <h2>2. Description</h2>
      <p>
        &quot;Inbox Camp&quot; is a Chrome extension built for social-media
        agencies in Southeast Asia who manage dozens of Facebook Pages for
        e-commerce clients. The extension consolidates Messenger inboxes from
        multiple Pages into a single dashboard, allowing agency staff to:
      </p>
      <ol>
        <li>
          Read incoming messages from customers across all managed Pages.
        </li>
        <li>
          Send replies (manual or AI-assisted via OpenAI/Gemini API based on
          the agency&apos;s configurable system prompt).
        </li>
        <li>
          Auto-detect customer-supplied phone numbers / addresses to disable
          the AI auto-reply.
        </li>
      </ol>

      <h2>3. Permissions requested</h2>
      <p>We request Advanced Access to:</p>
      <ul>
        <li>
          <code>pages_messaging</code> — to send messages on behalf of Pages
          the user has authorized our app with.
        </li>
        <li>
          <code>pages_read_engagement</code> — to display the page
          conversation list in our dashboard.
        </li>
      </ul>

      <h2>4. Data handling</h2>
      <p>
        All data is processed <b>client-side</b>; no message content leaves
        the user&apos;s browser except via Facebook Graph API calls back to
        Meta servers. Tokens are stored in{" "}
        <code>chrome.storage.local</code>. We do <b>not</b> operate any
        backend that stores user Page data.
      </p>

      <h2>5. Verification status</h2>
      <ul>
        <li>
          We have completed <b>Business Verification</b>.
        </li>
        <li>
          Demo video is attached showing the extension loading conversations
          from 3 Pages and replying to one customer.
        </li>
      </ul>

      <hr />
      <p className="footer-note">
        Extension này không phải sản phẩm chính thức của Meta Platforms,
        Inc. Facebook và Messenger là thương hiệu của Meta Platforms, Inc.
      </p>
    </>
  );
}