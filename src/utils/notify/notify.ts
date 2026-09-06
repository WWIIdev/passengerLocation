import React from "react";
import toast from "react-hot-toast";

export const notify = (
  text: string,
  type: "success" | "error" | "warning" | "info",
) => {
  const normalizedText = text.replace(/\\n/g, "\n");
  const lines = normalizedText.split(/\r?\n/);

  const content = React.createElement(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 4,
        direction: "rtl",
        textAlign: "right",
      },
    },
    lines.map((line, idx) =>
      React.createElement("span", { key: idx }, line),
    ),
  );

  const commonOptions = {
    duration: 5500,
    position: "top-center" as const,
  };

  if (type === "success") {
    toast.success(content, {
      ...commonOptions,
      style: {
        background: "#10b981",
        color: "#ffffff",
        fontFamily: "Vazirmatn",
        borderRadius: "14px",
        padding: "12px 16px",
        fontSize: "0.875rem",
        fontWeight: 600,
      },
      iconTheme: {
        primary: "#ffffff",
        secondary: "#10b981",
      },
    });

    return;
  }

  if (type === "error") {
    toast.error(content, {
      ...commonOptions,
      style: {
        background: "#ef4444",
        color: "#ffffff",
        fontFamily: "Vazirmatn",
        borderRadius: "14px",
        padding: "12px 16px",
        fontSize: "0.875rem",
        fontWeight: 600,
      },
      iconTheme: {
        primary: "#ffffff",
        secondary: "#ef4444",
      },
    });

    return;
  }

  if (type === "warning") {
    toast(content, {
      ...commonOptions,
      icon: "⚠️",
      style: {
        background: "#f59e0b",
        color: "#ffffff",
        fontFamily: "Vazirmatn",
        borderRadius: "14px",
        padding: "12px 16px",
        fontSize: "0.875rem",
        fontWeight: 600,
      },
    });

    return;
  }

  if (type === "info") {
    toast(content, {
      ...commonOptions,
      icon: "ℹ️",
      style: {
        background: "#4494ef",
        color: "#ffffff",
        fontFamily: "Vazirmatn",
        borderRadius: "14px",
        padding: "12px 16px",
        fontSize: "0.875rem",
        fontWeight: 600,
      },
    });
  }
};