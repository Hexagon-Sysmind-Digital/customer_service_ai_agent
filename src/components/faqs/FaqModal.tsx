"use client";

import { useState } from "react";
import { Faq } from "@/types";
import { createFaq, updateFaq } from "@/app/actions/faqs";
import { CloseIcon } from "@/components/icons";

interface FaqModalProps {
  faq?: Faq | null;
  tenantId: string;
  onClose: () => void;
  onSuccess: () => void;
  onError: (msg: string) => void;
}

export default function FaqModal({ faq, tenantId, onClose, onSuccess, onError }: FaqModalProps) {
  const [loading, setLoading] = useState(false);
  const isEditing = !!faq;

  const [formData, setFormData] = useState({
    question: faq?.question || "",
    answer: faq?.answer || "",
    category: faq?.category || "general",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!tenantId) {
      onError("Tenant ID is required to create or update an FAQ.");
      setLoading(false);
      return;
    }

    const payload = {
      question: formData.question,
      answer: formData.answer,
      category: formData.category,
    };

    try {
      let result;
      if (isEditing && faq) {
        result = await updateFaq(tenantId, faq.id, payload);
      } else {
        result = await createFaq(tenantId, payload);
      }

      if (result.success) {
        onSuccess();
      } else {
        onError(result.error || `Failed to ${isEditing ? "update" : "create"} FAQ`);
      }
    } catch {
      onError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        backdropFilter: "blur(4px)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="glass-card"
        style={{
          width: "100%",
          maxWidth: 600,
          display: "flex",
          flexDirection: "column",
          animation: "slideUp 0.3s ease-out",
        }}
      >
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--border-color)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#818cf8",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
              {isEditing ? "Edit FAQ" : "Add FAQ"}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-tertiary)",
              cursor: "pointer",
              padding: 4,
              display: "flex",
              borderRadius: 6,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--foreground)";
              e.currentTarget.style.background = "var(--accent-primary-bg)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--text-tertiary)";
              e.currentTarget.style.background = "none";
            }}
          >
            <CloseIcon />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="form-group">
            <label className="form-label" htmlFor="question">Question</label>
            <input
              id="question"
              type="text"
              className="form-input"
              placeholder="e.g. What are your opening hours?"
              value={formData.question}
              onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="answer">Answer</label>
            <textarea
              id="answer"
              className="form-input"
              placeholder="e.g. We are open Mon-Fri 09:00-20:00 and Sat-Sun 10:00-17:00 🕐"
              value={formData.answer}
              onChange={(e) => setFormData(prev => ({ ...prev, answer: e.target.value }))}
              required
              rows={4}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Category</label>
            <div className="chip-grid">
              {[
                { value: "general", label: "General", active: "active-blue" },
                { value: "billing", label: "Billing", active: "active-green" },
                { value: "support", label: "Support", active: "active-purple" },
              ].map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, category: c.value }))}
                  className={`chip-button ${formData.category === c.value ? c.active : ""}`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div
            style={{
              paddingTop: 20,
              borderTop: "1px solid var(--border-color)",
              display: "flex",
              justifyContent: "flex-end",
              gap: 12,
              marginTop: 4,
            }}
          >
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ minWidth: 100, justifyContent: "center" }}
            >
              {loading ? "Saving..." : "Save FAQ"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
