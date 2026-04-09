"use client";

import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { WhatsAppIcon, TelegramIcon, GlobeIcon, ChevronRightIcon, CheckIcon } from "@/components/icons";

// Mock: Nanti dari BE, backend akan kirim kode string yang di-convert jadi QR
const generateMockWACode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  for (let i = 0; i < 20; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return `2@${code},${Date.now()},${Math.floor(Math.random() * 999)},0`;
};

const INTEGRATION_STEPS = {
  whatsapp: [
    "Open WhatsApp on your phone.",
    "Tap Menu or Settings and select Linked Devices.",
    "Tap on 'Link a Device'.",
    "Point your phone to this screen to capture the code."
  ],
  telegram: [
    "Contact @BotFather on Telegram.",
    "Use the /newbot command to create a new bot.",
    "Follow the instructions to get your API Token.",
    "Paste the API Token into the field on the left and click 'Connect'."
  ]
};

export default function IntegrationsPage() {
  const [showQR, setShowQR] = useState(false);
  const [qrValue, setQrValue] = useState("");
  const [qrExpiry, setQrExpiry] = useState(120);
  const [tgToken, setTgToken] = useState("");
  const [isConnectingTg, setIsConnectingTg] = useState(false);

  // Generate QR code value & start countdown when shown
  useEffect(() => {
    if (!showQR) return;
    setQrValue(generateMockWACode());
    setQrExpiry(120);

    const timer = setInterval(() => {
      setQrExpiry((prev) => {
        if (prev <= 1) {
          // Regenerate code setiap 2 menit
          setQrValue(generateMockWACode());
          return 120;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showQR]);

  const handleConnectTelegram = () => {
    if (!tgToken) return;
    setIsConnectingTg(true);
    // Mocking connection
    setTimeout(() => {
        setIsConnectingTg(false);
        alert("Telegram Bot connected successfully!");
        setTgToken("");
    }, 1500);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div style={{ minHeight: "100vh", padding: "40px 24px", color: "var(--foreground)" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 8 }}>
            <div style={{ 
                width: 48, height: 48, borderRadius: 14, 
                background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.15))",
                display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent-primary)"
            }}>
                <GlobeIcon />
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>
              Integrations
            </h1>
          </div>
          <p style={{ fontSize: 16, color: "var(--text-secondary)", margin: 0 }}>
            Connect your AI agent to world-class messaging platforms.
          </p>
        </div>

        <div style={{ display: "grid", gap: 32 }}>

          {/* WhatsApp Section */}
          <section style={{ 
            background: "var(--card-bg)", 
            border: "1px solid var(--card-border)", 
            borderRadius: 24, 
            overflow: "hidden",
            boxShadow: "0 10px 30px -10px rgba(0,0,0,0.1)"
          }}>
            <div style={{ padding: 40 }}>
                <div style={{ display: "flex", gap: 40, flexWrap: "wrap" }}>
                    {/* Left: Interactive Section */}
                    <div style={{ flex: "1 1 300px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
                            <div style={{ color: "#25D366" }}>
                                <WhatsAppIcon size={32} />
                            </div>
                            <h2 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>WhatsApp Integration</h2>
                        </div>
                        
                        <div style={{ 
                            height: 300, 
                            background: showQR ? "#ffffff" : "rgba(99, 115, 171, 0.04)", 
                            borderRadius: 16, 
                            border: showQR ? "1px solid #e5e7eb" : "2px dashed var(--border-color)",
                            display: "flex", 
                            flexDirection: "column",
                            alignItems: "center", 
                            justifyContent: "center",
                            cursor: showQR ? "default" : "pointer",
                            transition: "all 0.3s ease",
                            position: "relative",
                            overflow: "hidden"
                        }}
                        onClick={() => !showQR && setShowQR(true)}
                        onMouseEnter={(e) => { if (!showQR) { e.currentTarget.style.borderColor = "#25D366"; e.currentTarget.style.background = "rgba(37, 211, 102, 0.04)"; } }}
                        onMouseLeave={(e) => { if (!showQR) { e.currentTarget.style.borderColor = "var(--border-color)"; e.currentTarget.style.background = "rgba(99, 115, 171, 0.04)"; } }}
                        >
                            {!showQR ? (
                                <>
                                    <div style={{ fontSize: 40, marginBottom: 12 }}>📱</div>
                                    <span style={{ fontWeight: 600, color: "#25D366" }}>Click to generate QR Code</span>
                                    <span style={{ fontSize: 13, color: "var(--text-tertiary)", marginTop: 4 }}>Scan with your WhatsApp mobile app</span>
                                </>
                            ) : (
                                <div style={{ 
                                    display: "flex", flexDirection: "column", alignItems: "center", gap: 12
                                }}>
                                    {/* WhatsApp logo di atas QR */}
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                        <div style={{ color: "#25D366" }}><WhatsAppIcon size={20} /></div>
                                        <span style={{ fontSize: 13, fontWeight: 600, color: "#25D366" }}>WhatsApp Web</span>
                                    </div>
                                    
                                    {/* QR Code dari library */}
                                    <div style={{ 
                                        padding: 12, 
                                        background: "#fff", 
                                        borderRadius: 12, 
                                        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                                        border: "1px solid #f0f0f0",
                                        position: "relative"
                                    }}>
                                        <QRCodeSVG 
                                            value={qrValue}
                                            size={160}
                                            level="M"
                                            bgColor="#ffffff"
                                            fgColor="#111827"
                                            imageSettings={{
                                                src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2325D366'%3E%3Cpath d='M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2z'/%3E%3C/svg%3E",
                                                height: 24,
                                                width: 24,
                                                excavate: true,
                                            }}
                                        />
                                    </div>

                                    {/* Countdown timer */}
                                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                        <div style={{ 
                                            width: 8, height: 8, borderRadius: "50%", 
                                            background: qrExpiry > 30 ? "#22c55e" : qrExpiry > 10 ? "#eab308" : "#ef4444",
                                            animation: qrExpiry <= 10 ? "pulse 1s infinite" : "none"
                                        }} />
                                        <span style={{ 
                                            fontSize: 12, 
                                            fontWeight: 600, 
                                            color: qrExpiry > 30 ? "#22c55e" : qrExpiry > 10 ? "#eab308" : "#ef4444" 
                                        }}>
                                            Expires in {formatTime(qrExpiry)}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Tutorial */}
                    <div style={{ flex: "1 1 300px", padding: "0 20px" }}>
                        <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 20 }}>
                            How to connect
                        </h3>
                        <div style={{ display: "grid", gap: 16 }}>
                            {INTEGRATION_STEPS.whatsapp.map((step, idx) => (
                                <div key={idx} style={{ display: "flex", gap: 16 }}>
                                    <div style={{ 
                                        width: 24, height: 24, borderRadius: "50%", 
                                        background: "var(--accent-primary)", color: "#fff", 
                                        display: "flex", alignItems: "center", justifyContent: "center", 
                                        fontSize: 12, fontWeight: 700, flexShrink: 0 
                                    }}>
                                        {idx + 1}
                                    </div>
                                    <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: "var(--text-secondary)" }}>{step}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
          </section>

          {/* Telegram Section */}
          <section style={{ 
            background: "var(--card-bg)", 
            border: "1px solid var(--card-border)", 
            borderRadius: 24, 
            overflow: "hidden",
            boxShadow: "0 10px 30px -10px rgba(0,0,0,0.1)"
          }}>
            <div style={{ padding: 40 }}>
                <div style={{ display: "flex", gap: 40, flexWrap: "wrap" }}>
                    {/* Left: Input Form */}
                    <div style={{ flex: "1 1 300px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
                            <div style={{ color: "#0088cc" }}>
                                <TelegramIcon size={32} />
                            </div>
                            <h2 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Telegram Integration</h2>
                        </div>
                        
                        <div style={{ 
                            padding: 32, 
                            background: "rgba(99, 115, 171, 0.04)", 
                            borderRadius: 16, 
                            border: "1px solid var(--border-color)" 
                        }}>
                             <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: 12, color: "var(--text-secondary)" }}>
                                Bot API Token
                             </label>
                             <div style={{ position: "relative" }}>
                                <input 
                                    type="password" 
                                    placeholder="" 
                                    value={tgToken}
                                    onChange={(e) => setTgToken(e.target.value)}
                                    style={{
                                        width: "100%",
                                        padding: "14px 16px",
                                        borderRadius: 12,
                                        background: "var(--input-bg)",
                                        border: "1.5px solid var(--input-border)",
                                        color: "var(--foreground)",
                                        fontSize: 14,
                                        fontFamily: "monospace",
                                        marginBottom: 20,
                                        outline: "none",
                                        transition: "all 0.2s"
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = "var(--accent-primary)"}
                                    onBlur={(e) => e.target.style.borderColor = "var(--input-border)"}
                                />
                             </div>
                             <button 
                                className="btn-primary" 
                                onClick={handleConnectTelegram}
                                disabled={!tgToken || isConnectingTg}
                                style={{ 
                                    width: "100%", 
                                    justifyContent: "center",
                                    padding: "14px",
                                    borderRadius: 12,
                                    background: (!tgToken || isConnectingTg) ? "var(--text-tertiary)" : "var(--accent-primary)"
                                }}
                             >
                                {isConnectingTg ? "Connecting..." : "Connect Telegram Bot"}
                                {!isConnectingTg && <ChevronRightIcon />}
                             </button>
                             
                             <div style={{ marginTop: 20, padding: "12px 14px", background: "rgba(34, 197, 94, 0.08)", borderRadius: 10, display: "flex", alignItems: "center", gap: 10 }}>
                                <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#22c55e", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <CheckIcon />
                                </div>
                                <span style={{ fontSize: 13, color: "#22c55e", fontWeight: 600 }}>Webhooks are active</span>
                             </div>
                        </div>
                    </div>

                    {/* Right: Tutorial */}
                    <div style={{ flex: "1 1 300px", padding: "0 20px" }}>
                        <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 20 }}>
                            How to connect
                        </h3>
                        <div style={{ display: "grid", gap: 16 }}>
                            {INTEGRATION_STEPS.telegram.map((step, idx) => (
                                <div key={idx} style={{ display: "flex", gap: 16 }}>
                                    <div style={{ 
                                        width: 24, height: 24, borderRadius: "50%", 
                                        background: "var(--accent-primary)", color: "#fff", 
                                        display: "flex", alignItems: "center", justifyContent: "center", 
                                        fontSize: 12, fontWeight: 700, flexShrink: 0 
                                    }}>
                                        {idx + 1}
                                    </div>
                                    <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: "var(--text-secondary)" }}>{step}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
