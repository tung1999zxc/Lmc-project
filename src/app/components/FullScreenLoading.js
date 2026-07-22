"use client";

import React from 'react';
import { Spin } from 'antd';

const FullScreenLoading = ({ loading, tip = 'Đang tải dữ liệu...' }) => {
  if (!loading) return null;
  return (
    <div className="loading-overlay">
      <Spin size="large">
        <div className="loading-tip">{tip}</div>
      </Spin>
      <style jsx>{`
        .loading-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(255, 255, 255, 0.8);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          z-index: 9999;
          backdrop-filter: blur(5px);
        }
        .loading-tip {
          color: #1890ff;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
};

export default FullScreenLoading;
