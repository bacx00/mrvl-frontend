// src/app/components/RichTextEditor.tsx
"use client";

import React from "react";

export default function RichTextEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  return (
    <textarea
      className="form-control"
      rows={5}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Write your reply here..."
    />
  );
}
