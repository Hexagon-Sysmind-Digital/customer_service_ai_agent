"use client";

import Link from "next/link";
import { BotIcon, ChevronLeftIcon } from "@/components/icons";

export default function NotFound() {
  return (
    <div style={{
      minHeight: "calc(100vh - 64px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      background: "transparent",
      position: "relative",
      pointerEvents: "none"
    }}>
      <div className="glass-card" style={{
        position: "relative",
        zIndex: 10,
        pointerEvents: "auto",
        maxWidth: "480px",
        width: "100%",
        padding: "48px 32px",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "24px",
        border: "1px solid var(--border-color)",
        boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
      }}>
        {/* Animated Icon Container */}
        <div style={{
          width: "80px",
          height: "80px",
          borderRadius: "24px",
          background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#818cf8",
          fontSize: "32px",
          marginBottom: "8px",
          animation: "float 6s ease-in-out infinite",
        }}>
          <BotIcon />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <h1 style={{ 
            fontSize: "64px", 
            fontWeight: 800, 
            margin: 0, 
            lineHeight: 1,
            background: "linear-gradient(to right, #818cf8, #c084fc)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: "-0.04em"
          }}>
            404
          </h1>
          <h2 style={{ 
            fontSize: "24px", 
            fontWeight: 600, 
            margin: 0, 
            color: "var(--foreground)",
            letterSpacing: "-0.02em"
          }}>
            Access Restricted
          </h2>
          <p style={{ 
            fontSize: "16px", 
            color: "var(--text-secondary)", 
            margin: 0,
            lineHeight: 1.6
          }}>
            This page is not available to your current user role or does not exist. 
            Please use the sidebar to navigate back to an authorized section.
          </p>
        </div>

        <div style={{ 
          width: "100%", 
          height: "1px", 
          background: "linear-gradient(to right, transparent, var(--border-color), transparent)",
          margin: "8px 0"
        }} />

        <div style={{ display: "flex", gap: "12px", width: "100%" }}>
          <Link 
            href="/chat" 
            className="btn-primary" 
            style={{ 
              flex: 1,
              textDecoration: "none",
              padding: "12px 16px",
              fontSize: "14px",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px"
            }}
          >
            Chat Dashboard
          </Link>
          <Link 
            href="/faqs" 
            className="btn-secondary" 
            style={{ 
              flex: 1,
              textDecoration: "none",
              padding: "12px 16px",
              fontSize: "14px",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px"
            }}
          >
            Check FAQs
          </Link>
        </div>

        {/* Floating background elements decor */}
        <style jsx>{`
          @keyframes float {
            0% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-10px) rotate(5deg); }
            100% { transform: translateY(0px) rotate(0deg); }
          }
        `}</style>
      </div>
    </div>
  );
}
