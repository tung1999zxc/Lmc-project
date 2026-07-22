"use client"
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

// Hàm chuyển tọa độ cực sang Cartesian
function polarToCartesian(cx, cy, r, angle) {
  const rad = (angle - 90) * (Math.PI / 180);
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

// Hàm tạo đường path cho cung tròn của từng lát
function createArcPath(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;

  return [
    `M ${cx} ${cy}`, // Move đến tâm
    `L ${start.x} ${start.y}`, // Vẽ đường thẳng đến đầu cung
    `A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`, // Vẽ cung tròn
    'Z', // Đóng path
  ].join(' ');
}

// Danh sách các lát trên vòng quay
const slices = [
  { label: '1 chỉ vàng', color: '#f44336' },
  { label: '200.000đ', color: '#ffeb3b' },
  { label: '100.000đ', color: '#4caf50' },
  { label: '0.5 chỉ vàng', color: '#ff9800' },
  { label: '50.000đ', color: '#2196f3' },
  { label: '10.000đ', color: '#9c27b0' },
  { label: '0.000đ', color: '#00bcd4' },
  { label: 'Chúc may mắn lần sau', color: '#795548' },
];

const sliceAngle = 360 / slices.length; // Góc mỗi lát
const LOCAL_STORAGE_KEY = 'lastSpinTime';

export default function LuckyWheel() {
  const [rotateAngle, setRotateAngle] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [prize, setPrize] = useState(null);
  const [canSpin, setCanSpin] = useState(true);
  const [message, setMessage] = useState('');

  // Kiểm tra lần quay cuối cùng khi component mount
  useEffect(() => {
    const lastSpin = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (lastSpin) {
      const diff = Date.now() - parseInt(lastSpin, 10);
      const hours = diff / (1000 * 60 * 60);
      if (hours < 24) {
        setCanSpin(false);
        setMessage(
          `Bạn đã quay rồi. Vui lòng quay lại sau ${Math.ceil(24 - hours)} giờ.`
        );
      }
    }
  }, []);

  const handleSpin = () => {
    // Nếu đang quay hoặc không được quay nữa, không làm gì
    if (isSpinning || !canSpin) return;

    setIsSpinning(true);
    setPrize('');
    setMessage('');

    // Chọn ngẫu nhiên 1 lát (index từ 0 đến slices.length - 1)
    const randomIndex = Math.floor(Math.random() * slices.length);

    /* 
      Để căn giữa lát trúng với con trỏ tại vị trí top, ta cần tính:
      - Trung tâm của lát trúng (winningCenter): randomIndex * sliceAngle + sliceAngle/2.
      - Nếu không quay, lát trúng sẽ nằm ở góc winningCenter.
      - Để đưa trung tâm đó lên vị trí top (0° theo hệ thống của vòng quay), ta cần quay thêm:
            extraRotation = 360 - winningCenter.
      - Sau đó cộng thêm số vòng quay (ở đây mình dùng 5 vòng) để tạo hiệu ứng.
    */
    const winningCenter = randomIndex * sliceAngle + sliceAngle / 2;
    const extraRotation = 360 - winningCenter;
    const spins = 360 * 5;
    const finalAngle = spins + extraRotation;

    setRotateAngle((prev) => prev + finalAngle);

    // Lưu thời gian quay hiện tại vào localStorage
    localStorage.setItem(LOCAL_STORAGE_KEY, Date.now().toString());

    // Sau 4 giây, dừng quay và hiển thị giải thưởng
    setTimeout(() => {
      setPrize(slices[randomIndex].label);
      setIsSpinning(false);
      setCanSpin(false);
      setMessage('Bạn đã quay xong. Vui lòng quay lại sau 24 tiếng.');
    }, 4000);
  };

  return (
    <div style={styles.container}>
      <div style={styles.title}>
        VÒNG QUAY MAY MẮN <br />
        VNPT - VINAPHONE AN GIANG
      </div>

      <div style={styles.wheelContainer}>
        <motion.svg
          width={400}
          height={400}
          viewBox="0 0 400 400"
          style={{ originX: '50%', originY: '50%' }}
          animate={{ rotate: rotateAngle }}
          transition={{ duration: 4, ease: 'easeOut' }}
        >
          {slices.map((slice, index) => {
            const startAngle = index * sliceAngle;
            const endAngle = (index + 1) * sliceAngle;
            const path = createArcPath(200, 200, 180, startAngle, endAngle);

            // Tính vị trí text ở giữa mỗi lát
            const midAngle = startAngle + sliceAngle / 2;
            const textPos = polarToCartesian(200, 200, 100, midAngle);

            return (
              <g key={index}>
                <path d={path} fill={slice.color} />
                <text
                  x={textPos.x}
                  y={textPos.y}
                  fill="#fff"
                  fontSize="14"
                  textAnchor="middle"
                  alignmentBaseline="middle"
                  style={{ fontWeight: 'bold' }}
                  transform={`rotate(${midAngle}, ${textPos.x}, ${textPos.y})`}
                >
                  {slice.label}
                </text>
              </g>
            );
          })}
          {/* Vẽ nút trung tâm */}
          <circle cx={200} cy={200} r={40} fill="#FFD700" stroke="#000" />
          <text
            x={200}
            y={205}
            fill="#000"
            fontSize="16"
            textAnchor="middle"
            alignmentBaseline="middle"
            style={{ fontWeight: 'bold' }}
          >
            QUAY
          </text>
        </motion.svg>

        {/* Con trỏ chỉ vị trí trúng – cố định ở phía trên */}
        <div style={styles.pointer}>▼</div>
      </div>

      <button onClick={handleSpin} style={styles.button} disabled={isSpinning || !canSpin}>
        {isSpinning ? 'Đang quay...' : 'QUAY NGAY'}
      </button>

      {prize && (
        <div style={styles.result}>
          <strong>Kết quả:</strong> {prize}
        </div>
      )}
      {message && <div style={styles.message}>{message}</div>}
    </div>
  );
}

// Inline styles (có thể chuyển sang file CSS nếu cần)
const styles = {
  container: {
    background: '#000',
    color: '#fff',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '20px',
    lineHeight: '1.4',
  },
  wheelContainer: {
    position: 'relative',
    width: '400px',
    height: '400px',
  },
  pointer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translateX(-50%) translateY(-200px)',
    fontSize: '2rem',
    color: 'yellow',
    textShadow: '1px 1px 2px #000',
    zIndex: 10,
  },
  button: {
    marginTop: '20px',
    padding: '10px 20px',
    fontSize: '18px',
    background: '#ff9800',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  result: {
    marginTop: '20px',
    fontSize: '18px',
    color: '#ffeb3b',
  },
  message: {
    marginTop: '10px',
    fontSize: '16px',
    color: '#ccc',
  },
};
