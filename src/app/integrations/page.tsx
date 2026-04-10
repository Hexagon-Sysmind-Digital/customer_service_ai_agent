"use client";

import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { WhatsAppIcon, TelegramIcon, GlobeIcon, ChevronRightIcon, CheckIcon } from "@/components/icons";

import { connectWhatsApp, statusWhatsApp, disconnectWhatsApp } from "@/app/actions/whatsappApi";
import { updateTelegramConfig, connectTelegram, statusTelegram, disconnectTelegram } from "@/app/actions/telegramApi";

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
  const [waStatus, setWaStatus] = useState("disconnected");
  const [isLoading, setIsLoading] = useState(false);
  const [tgToken, setTgToken] = useState("");
  const [isConnectingTg, setIsConnectingTg] = useState(false);
  const [tgStatus, setTgStatus] = useState("disconnected");
  const [tgError, setTgError] = useState("");

  // Fetch real QR code from API
  const fetchQRCode = async () => {
    setIsLoading(true);
    const res = await connectWhatsApp();
    setIsLoading(false);
    
    if (res.success && res.data?.qr_code) {
      setQrValue(res.data.qr_code);
      setQrExpiry(120);
      setWaStatus(res.data.status || "waiting_for_scan");
    }
  };

  // Initial status check (WhatsApp + Telegram)
  useEffect(() => {
    const checkStatus = async () => {
      const waRes = await statusWhatsApp();
      if (waRes.success && waRes.data?.status) {
        setWaStatus(waRes.data.status);
      }
      const tgRes = await statusTelegram();
      console.log("Telegram Initial Status:", tgRes);
      if (tgRes.success && tgRes.data?.status) {
        setTgStatus(tgRes.data.status);
      }
    };
    checkStatus();
  }, []);

  // Poll status when QR is showing
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showQR && waStatus !== "connected") {
      interval = setInterval(async () => {
        const res = await statusWhatsApp();
        console.log("Polling WhatsApp Status:", res.data?.status);
        if (res.success && res.data?.status) {
          setWaStatus(res.data.status);
          if (res.data.status === "connected") {
            setShowQR(false);
            alert("WhatsApp connected successfully!");
          }
        }
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [showQR, waStatus]);

  // QR Expiry and refresh
  useEffect(() => {
    if (!showQR || waStatus === "connected") return;
    const timer = setInterval(() => {
      setQrExpiry((prev) => {
        if (prev <= 1) {
          return 0; // Signal expiry, handled below
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [showQR, waStatus]);

  // Auto-refresh QR when expired
  useEffect(() => {
    if (qrExpiry === 0 && showQR && waStatus !== "connected") {
      setQrExpiry(120);
      fetchQRCode();
    }
  }, [qrExpiry, showQR, waStatus]);

  const handleStartConnect = () => {
    setShowQR(true);
    fetchQRCode();
  };

  const handleDisconnect = async () => {
    if (!confirm("Disconnect WhatsApp Account?")) return;
    setIsLoading(true);
    const res = await disconnectWhatsApp();
    console.log("Disconnect Response:", res);
    setIsLoading(false);
    
    // Set status to disconnected locally to allow UI to show QR button again
    setWaStatus("disconnected");
    setQrValue("");
    setShowQR(false);
    
    if (!res.success && res.error !== "no WhatsApp connection for this tenant") {
      alert("Note: Connection reset locally. You can now try to reconnect.");
    }
  };


  const handleConnectTelegram = async () => {
    if (!tgToken) return;
    setIsConnectingTg(true);
    setTgError("");

    // Step 1: Save config with token
    const configRes = await updateTelegramConfig(tgToken, true);
    console.log("Telegram Config Response:", configRes);
    if (!configRes.success) {
      setTgError(configRes.error || "Failed to save config");
      setIsConnectingTg(false);
      return;
    }

    // Step 2: Connect the bot
    const connectRes = await connectTelegram();
    console.log("Telegram Connect Response:", connectRes);
    setIsConnectingTg(false);

    if (connectRes.success) {
      setTgStatus(connectRes.data?.status || "connected");
      setTgToken("");
    } else {
      setTgError(connectRes.error || "Failed to connect bot");
    }
  };

  const handleDisconnectTelegram = async () => {
    if (!confirm("Disconnect Telegram Bot?")) return;
    setIsConnectingTg(true);
    const res = await disconnectTelegram();
    console.log("Telegram Disconnect Response:", res);
    setIsConnectingTg(false);

    if (res.success) {
      setTgStatus("disconnected");
    } else {
      // Reset locally anyway
      setTgStatus("disconnected");
    }
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
                            background: waStatus === "connected" ? "rgba(37, 211, 102, 0.04)" : showQR ? "#ffffff" : "rgba(99, 115, 171, 0.04)", 
                            borderRadius: 16, 
                            border: waStatus === "connected" ? "1px solid #25D366" : showQR ? "1px solid #e5e7eb" : "2px dashed var(--border-color)",
                            display: "flex", 
                            flexDirection: "column",
                            alignItems: "center", 
                            justifyContent: "center",
                            cursor: (showQR || waStatus === "connected") ? "default" : "pointer",
                            transition: "all 0.3s ease",
                            position: "relative",
                            overflow: "hidden"
                        }}
                        onClick={() => !showQR && waStatus !== "connected" && handleStartConnect()}
                        >
                            {isLoading ? (
                                <div style={{ fontSize: 14, color: "var(--text-secondary)" }}>Loading...</div>
                            ) : waStatus === "connected" ? (
                                <>
                                    <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                                    <span style={{ fontWeight: 600, color: "#25D366" }}>WhatsApp Connected</span>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleDisconnect(); }}
                                        style={{ marginTop: 16, fontSize: 13, color: "#ef4444", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
                                    >
                                        Disconnect Account
                                    </button>
                                </>
                            ) : !showQR ? (
                                <>
                                    <div style={{ fontSize: 40, marginBottom: 12 }}>📱</div>
                                    <span style={{ fontWeight: 600, color: "#25D366" }}>Click to generate QR Code</span>
                                    <span style={{ fontSize: 13, color: "var(--text-tertiary)", marginTop: 4 }}>Scan with your WhatsApp mobile app</span>
                                </>
                            ) : (
                                <div style={{ 
                                    display: "flex", flexDirection: "column", alignItems: "center", gap: 12
                                }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                        <div style={{ color: "#25D366" }}><WhatsAppIcon size={20} /></div>
                                        <span style={{ fontSize: 13, fontWeight: 600, color: "#25D366" }}>WhatsApp Web</span>
                                    </div>
                                    
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
                                        />
                                    </div>

                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                            <div style={{ 
                                                width: 8, height: 8, borderRadius: "50%", 
                                                background: qrExpiry > 30 ? "#22c55e" : qrExpiry > 10 ? "#eab308" : "#ef4444"
                                            }} />
                                            <span style={{ 
                                                fontSize: 12, 
                                                fontWeight: 600, 
                                                color: qrExpiry > 30 ? "#22c55e" : qrExpiry > 10 ? "#eab308" : "#ef4444" 
                                            }}>
                                                Expires in {formatTime(qrExpiry)}
                                            </span>
                                        </div>
                                        {/* Status debugger */}
                                        <span style={{ fontSize: 10, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                            Current Status: <span style={{ color: "var(--accent-primary)" }}>{waStatus}</span>
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
                            background: tgStatus === "connected" ? "rgba(0, 136, 204, 0.04)" : "rgba(99, 115, 171, 0.04)", 
                            borderRadius: 16, 
                            border: tgStatus === "connected" ? "1px solid #0088cc" : "1px solid var(--border-color)" 
                        }}>
                            {tgStatus === "connected" ? (
                              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 180, gap: 12 }}>
                                <div style={{ fontSize: 48 }}>✅</div>
                                <span style={{ fontWeight: 600, color: "#0088cc" }}>Telegram Bot Connected</span>
                                <div style={{ marginTop: 8, padding: "10px 14px", background: "rgba(0, 136, 204, 0.08)", borderRadius: 10, display: "flex", alignItems: "center", gap: 10 }}>
                                  <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#22c55e", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <CheckIcon />
                                  </div>
                                  <span style={{ fontSize: 13, color: "#22c55e", fontWeight: 600 }}>Polling is active</span>
                                </div>
                                <button
                                  onClick={handleDisconnectTelegram}
                                  disabled={isConnectingTg}
                                  style={{ marginTop: 8, fontSize: 13, color: "#ef4444", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
                                >
                                  {isConnectingTg ? "Disconnecting..." : "Disconnect Bot"}
                                </button>
                              </div>
                            ) : (
                              <>
                                <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: 12, color: "var(--text-secondary)" }}>
                                  Bot API Token
                                </label>
                                <div style={{ position: "relative" }}>
                                  <input 
                                      type="password" 
                                      placeholder="Paste token from @BotFather" 
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
                                {tgError && (
                                  <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(239, 68, 68, 0.08)", borderRadius: 10, fontSize: 13, color: "#ef4444" }}>
                                    {tgError}
                                  </div>
                                )}
                              </>
                            )}
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
