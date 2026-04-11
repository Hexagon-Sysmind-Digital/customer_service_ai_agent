"use client";

import React from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
}

export default function PageHeader({ title, description, badge, action }: PageHeaderProps) {
  return (
    <div style={{ marginBottom: 60, textAlign: "left" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 20, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
          <h1 style={{ 
            fontSize: 48, 
            fontWeight: 900, 
            margin: 0, 
            letterSpacing: "-0.04em", 
            background: "linear-gradient(to right, var(--foreground), var(--text-tertiary))", 
            WebkitBackgroundClip: "text", 
            WebkitTextFillColor: "transparent" 
          }}>
            {title}
          </h1>
          <div style={{ 
            width: 12, 
            height: 12, 
            borderRadius: "50%", 
            background: "var(--accent-primary)", 
            boxShadow: "0 0 15px var(--accent-primary)" 
          }} />
          {badge && <div style={{ marginLeft: 8 }}>{badge}</div>}
        </div>
        
        {action && (
          <div style={{ display: "flex", alignItems: "center" }}>
            {action}
          </div>
        )}
      </div>
      
      {description && (
        <p style={{ 
          fontSize: 18, 
          color: "var(--text-secondary)", 
          maxWidth: 700, 
          lineHeight: 1.6, 
          margin: 0 
        }}>
          {description}
        </p>
      )}
    </div>
  );
}
