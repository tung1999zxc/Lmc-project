"use client";
import React, { useState, useMemo, useCallback, memo, forwardRef, useImperativeHandle } from "react";
import { Form, Input, InputNumber, Upload, Button } from "antd";
import { PlusOutlined, EyeOutlined } from "@ant-design/icons";

function splitCsv(input) {
  if (!input) return [];
  return String(input).split(",").map((s) => s.trim()).filter(Boolean);
}

// Giữ nguyên chuỗi người dùng nhập, chỉ trim khoảng trắng thừa
function normalizeField(str) {
  return String(str || "")
    .trim()
    .replace(/\s+/g, " ");
}

function buildCombos({ name, mau, size }) {
  const base = normalizeField(name);
  const maus = splitCsv(mau);
  const sizes = splitCsv(size);
  if (maus.length === 0 && sizes.length === 0) return base ? [base] : [];
  const mauList = maus.length ? maus : [""];
  const sizeList = sizes.length ? sizes : [""];
  const out = [];
  for (const m of mauList) {
    for (const s of sizeList) {
      const parts = [base, normalizeField(m), normalizeField(s)].filter(
        (p) => p && p.length > 0,
      );
      out.push(parts.join(" - "));
    }
  }
  return out;
}

async function getBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

// Tách riêng để parent không re-render khi gõ
const ProductAddForm = forwardRef(function ProductAddForm(
  { onSubmit, disabled = false },
  ref,
) {
  const [form] = Form.useForm();

  // LOCAL state để hiển thị preview — KHÔNG liên quan đến antd form state
  const [preview, setPreview] = useState({ name: "", mau: "", size: "" });
  const [fileList, setFileList] = useState([]);
  // Raw state lưu mỗi ký tự gõ vào (chỉ khi click ra ngoài mới build preview)
  const [raw, setRaw] = useState({ name: "", mau: "", size: "" });

  useImperativeHandle(ref, () => ({
    reset: () => {
      form.resetFields();
      setPreview({ name: "", mau: "", size: "" });
      setRaw({ name: "", mau: "", size: "" });
      setFileList([]);
    },
  }));

  // Mỗi lần gõ chỉ ghi raw (cha không bị động)
  const handleValuesChange = useCallback((_, all) => {
    setRaw({
      name: all?.name || "",
      mau: all?.mau || "",
      size: all?.size || "",
    });
  }, []);

  // Click ra ngoài 3 ô name/mau/size → build preview
  const handleBlur = useCallback(() => {
    setPreview({
      name: raw.name,
      mau: raw.mau,
      size: raw.size,
    });
  }, [raw]);

  // Submit
  const onFinish = useCallback(
    async (values) => {
      const file = values.image?.[0];
      const base64Image = file ? await getBase64(file.originFileObj) : null;
      const combos = buildCombos({
        name: values.name,
        mau: values.mau,
        size: values.size,
      });
      if (combos.length === 0) {
        message.error("Vui lòng nhập tên sản phẩm");
        return;
      }
      const importDate = new Date().toISOString().split("T")[0];
      const ts = Date.now();
      const docs = combos.map((fullName, i) => ({
        key: `${ts}-${i}-${Math.random().toString(36).slice(2, 6)}`,
        name: fullName,
        image: base64Image,
        description: values.description || "",
        weight: Number(values.weight) || 0,
        slvn: 0,
        sltq: 0,
        status: true,
        imports: [
          {
            importedQty: Number(values.importedQty) || 0,
            importVN: Number(values.importVN) || 0,
            importKR: Number(values.importKR) || 0,
            importDate,
          },
        ],
        createdAt: new Date(),
      }));
      await onSubmit(docs);
    },
    [onSubmit, form], // eslint-disable-line
  );

  // Preview: render chỉ khi blur
  const previewNames = useMemo(() => {
    return buildCombos(preview);
  }, [preview]);

  return (
    <>
      <Form
        form={form}
        layout="inline"
        onFinish={onFinish}
        onValuesChange={handleValuesChange}
        style={{ flexWrap: "wrap", rowGap: 12 }}
      >
        <Form.Item
          name="name"
          rules={[
            { required: true, message: "Vui lòng nhập tên sản phẩm" },
            { whitespace: true, message: "Tên sản phẩm không được chỉ có khoảng trắng" },
          ]}
          style={{ flex: 1, minWidth: 200 }}
          hasFeedback
        >
          <Input
            placeholder="Tên sản phẩm (bắt buộc), vd: Áo khoác"
            style={{ borderRadius: 10 }}
            onBlur={handleBlur}
          />
        </Form.Item>

        <Form.Item name="mau" style={{ flex: 1, minWidth: 200 }}>
          <Input
            placeholder="Màu (không bắt buộc), vd: Trắng, Đen, Be"
            style={{ borderRadius: 10 }}
            onBlur={handleBlur}
          />
        </Form.Item>

        <Form.Item name="size" style={{ flex: 1, minWidth: 200 }}>
          <Input
            placeholder="Size (không bắt buộc), vd: 36, 38, 40"
            style={{ borderRadius: 10 }}
            onBlur={handleBlur}
          />
        </Form.Item>

        <Form.Item name="weight" style={{ width: 120 }}>
          <InputNumber
            placeholder="Khối lượng (g)"
            min={0}
            style={{ width: "100%", borderRadius: 10 }}
          />
        </Form.Item>

        <Form.Item name="importedQty" hidden>
          <InputNumber placeholder="SL nhập hàng" min={0} />
        </Form.Item>
        <Form.Item name="description" hidden>
          <Input.TextArea rows={1} placeholder="Kịch bản sản phẩm" />
        </Form.Item>

        <Form.Item
          name="image"
          valuePropName="fileList"
          getValueFromEvent={(e) =>
            e?.fileList && e.fileList.length > 0 ? [e.fileList[0]] : []
          }
        >
          <Upload
            listType="picture"
            maxCount={1}
            fileList={fileList}
            onChange={({ fileList: fl }) => {
              setFileList(fl);
              form.setFieldsValue({ image: fl });
            }}
            beforeUpload={() => false}
          />
        </Form.Item>

        <Form.Item>
          <button
            className="btn-prod-primary"
            type="submit"
            disabled={disabled}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              height: 38,
            }}
          >
            <PlusOutlined />
            Thêm sản phẩm
          </button>
        </Form.Item>
      </Form>

      {/* Preview thuần local, chỉ render sau blur */}
      <PreviewBlock names={previewNames} />
    </>
  );
});

// Istick5Cell-style: component riêng với local state, re-render cô lập
const PreviewBlock = memo(function PreviewBlock({ names }) {
  const [showAll, setShowAll] = useState(false);
  const PREVIEW_LIMIT = 6;
  const visible = showAll ? names : names.slice(0, PREVIEW_LIMIT);
  const hiddenCount = Math.max(0, names.length - PREVIEW_LIMIT);

  if (!names || names.length === 0) return null;

  return (
    <div
      style={{
        marginTop: 12,
        padding: "12px 14px",
        background: "linear-gradient(135deg, #fff7ed 0%, #fef3c7 100%)",
        border: "1px dashed #f59e0b",
        borderRadius: 10,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span role="img" aria-label="eye" style={{ color: "#f59e0b", fontSize: 16 }}>
            <EyeOutlined />
          </span>
          <span style={{ fontWeight: 700, color: "#92400e" }}>
            Xem trước tên SP
          </span>
          <span
            style={{
              fontSize: 12,
              padding: "2px 8px",
              background: "#f59e0b",
              color: "#fff",
              borderRadius: 999,
              fontWeight: 600,
            }}
          >
            {names.length} sản phẩm sẽ được tạo
          </span>
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {visible.map((n, idx) => (
          <div
            key={idx}
            style={{
              padding: "6px 12px",
              background: "#fff",
              border: "1px solid #fde68a",
              borderRadius: 8,
              fontSize: 13,
              color: "#78350f",
              fontWeight: 500,
              boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
            }}
          >
            {n}
          </div>
        ))}
        {!showAll && hiddenCount > 0 && (
          <div
            style={{
              padding: "6px 12px",
              background: "#fef3c7",
              border: "1px dashed #f59e0b",
              borderRadius: 8,
              fontSize: 13,
              color: "#92400e",
              fontStyle: "italic",
            }}
          >
            ... và {hiddenCount} sản phẩm khác
          </div>
        )}
      </div>
      {names.length > PREVIEW_LIMIT && (
        <Button
          type="link"
          size="small"
          onClick={() => setShowAll((v) => !v)}
          style={{ padding: "4px 0", marginTop: 4 }}
        >
          {showAll
            ? "Thu gọn"
            : `Xem thêm tất cả (${names.length})`}
        </Button>
      )}
    </div>
  );
});

export default ProductAddForm;
export { buildCombos }; // để parent có thể dùng lại
