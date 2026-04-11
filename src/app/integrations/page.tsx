"use client";

import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { WhatsAppIcon, TelegramIcon, GlobeIcon, ChevronRightIcon, CheckIcon } from "@/components/icons";
import PageHeader from "@/components/ui/PageHeader";

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
    <div style={{ minHeight: "100vh", padding: "60px 40px", color: "var(--foreground)", position: "relative", overflow: "hidden" }}>
      {/* Background Ornaments */}
      <div style={{ position: "absolute", top: -150, right: -150, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)", filter: "blur(80px)", zIndex: 0 }} />
      <div style={{ position: "absolute", bottom: -100, left: -100, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(37,211,102,0.08) 0%, transparent 70%)", filter: "blur(70px)", zIndex: 0 }} />

      <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 1 }}>
        
        {/* Page Header */}
        <PageHeader 
          title="Integrations" 
          description="Synchronize your AI brain with the world's most popular messaging platforms. Experience seamless omnichannel communication."
        />

        <div style={{ display: "flex", flexDirection: "column", gap: 48 }}>

          {/* WhatsApp Premium Card */}
          <section className="integration-card" style={{ 
            background: "linear-gradient(145deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.08)", 
            borderRadius: 40, 
            padding: "48px",
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 40px 80px -20px rgba(0,0,0,0.3)",
            transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 40 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                    <div style={{ 
                        width: 72, height: 72, borderRadius: 24, background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
                        display: "flex", alignItems: "center", justifyContent: "center", color: "#fff",
                        boxShadow: "0 15px 30px -5px rgba(37, 211, 102, 0.4)"
                    }}>
                        <WhatsAppIcon size={40} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>WhatsApp</h2>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                            <span style={{ fontSize: 14, color: "#25D366", fontWeight: 700 }}>Official API</span>
                            <div style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--text-tertiary)" }} />
                            <span style={{ fontSize: 14, color: "var(--text-tertiary)", fontWeight: 500 }}>High Priority</span>
                        </div>
                    </div>
                </div>
                {waStatus === "connected" && (
                  <div className="status-badge" style={{ padding: "8px 16px", borderRadius: 100, background: "rgba(34, 197, 94, 0.12)", color: "#22c55e", fontSize: 13, fontWeight: 800, border: "1px solid rgba(34, 197, 94, 0.2)", letterSpacing: "0.05em" }}>
                    ONLINE
                  </div>
                )}
            </div>

            <div style={{ display: "flex", gap: 48, flexWrap: "wrap" }}>
                {/* Left: Interactive Section */}
                <div style={{ flex: "1 1 340px", display: "flex", flexDirection: "column", gap: 24 }}>
                    <div style={{ 
                        height: 380, 
                        background: waStatus === "connected" ? "radial-gradient(circle at center, rgba(37, 211, 102, 0.08) 0%, transparent 70%)" : "rgba(0,0,0,0.15)", 
                        borderRadius: 32, 
                        border: "1px solid rgba(255,255,255,0.05)",
                        display: "flex", 
                        flexDirection: "column",
                        alignItems: "center", 
                        justifyContent: "center",
                        position: "relative",
                        transition: "all 0.5s ease"
                    }}>
                        {isLoading ? (
                            <div style={{ textAlign: "center" }}>
                                <div className="premium-loader" />
                                <p style={{ marginTop: 24, fontSize: 13, color: "var(--text-secondary)", fontWeight: 600 }}>Provisioning Instance...</p>
                            </div>
                        ) : waStatus === "connected" ? (
                            <div style={{ textAlign: "center", padding: "0 24px" }}>
                                <div className="success-glow" style={{ 
                                    width: 80, height: 80, borderRadius: "50%", background: "rgba(34, 197, 94, 0.15)",
                                    display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px"
                                }}>
                                    <CheckIcon size={36} color="#22c55e" />
                                </div>
                                <h3 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 10px" }}>System Linked</h3>
                                <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 24, lineHeight: 1.6 }}>Your agent is actively processing conversations on WhatsApp.</p>
                                <button 
                                    onClick={handleDisconnect}
                                    className="disconnect-btn"
                                >
                                    Terminate Session
                                </button>
                            </div>
                        ) : !showQR ? (
                            <div 
                                style={{ textAlign: "center", cursor: "pointer", width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}
                                onClick={handleStartConnect}
                            >
                                <div className="qr-placeholder-icon" style={{ fontSize: 64 }}>📱</div>
                                <h3 style={{ fontSize: 20, fontWeight: 800, margin: "16px 0 6px", color: "#25D366" }}>Initialize Pairing</h3>
                                <p style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 500 }}>Secured multi-device connection</p>
                            </div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
                                <div className="qr-frame" style={{ padding: 16, borderRadius: 24 }}>
                                    <QRCodeSVG value={qrValue} size={160} level="M" bgColor="#fff" fgColor="#000" />
                                    <div className="qr-overlay" style={{ borderRadius: 24 }} />
                                </div>

                                <div style={{ textAlign: "center" }}>
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 8 }}>
                                        <div className="timer-dot" style={{ background: qrExpiry > 30 ? "#22c55e" : "#ef4444" }} />
                                        <span style={{ fontSize: 14, fontWeight: 800, color: qrExpiry > 30 ? "#22c55e" : "#ef4444", fontVariantNumeric: "tabular-nums" }}>
                                            {formatTime(qrExpiry)} remaining
                                        </span>
                                    </div>
                                    <div style={{ padding: "4px 12px", borderRadius: 100, background: "rgba(255,255,255,0.05)", display: "inline-block" }}>
                                      <span style={{ fontSize: 10, fontWeight: 800, color: "var(--text-tertiary)", letterSpacing: "0.1em" }}>
                                        STATUS: <span style={{ color: "var(--accent-primary)" }}>{waStatus.toUpperCase()}</span>
                                      </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Tutorial Section */}
                <div style={{ flex: "1 1 200px", padding: "10px 0" }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 4, height: 16, background: "#25D366", borderRadius: 4 }} />
                        Pairing Instructions
                    </div>
                    <div style={{ display: "grid", gap: 20 }}>
                        {INTEGRATION_STEPS.whatsapp.map((step, idx) => (
                            <div key={idx} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                                <div style={{ width: 26, height: 26, borderRadius: 8, background: "rgba(255,255,255,0.05)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, flexShrink: 0, border: "1px solid rgba(255,255,255,0.1)" }}>{idx + 1}</div>
                                <div style={{ margin: 0, fontSize: 13, color: "var(--text-tertiary)", lineHeight: 1.6, fontWeight: 500 }}>{step}</div>
                            </div>
                        ))}
                    </div>

                    <div style={{ marginTop: 32, padding: "16px", borderRadius: 16, background: "rgba(37, 211, 102, 0.05)", border: "1px solid rgba(37, 211, 102, 0.1)" }}>
                        <p style={{ margin: 0, fontSize: 12, color: "#25D366", fontWeight: 600, lineHeight: 1.5 }}>
                            💡 Pro Tip: Keeping your browser window open ensures a faster initial synchronization.
                        </p>
                    </div>
                </div>
            </div>
          </section>

          {/* Telegram Premium Card */}
          <section className="integration-card" style={{ 
            background: "linear-gradient(145deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.08)", 
            borderRadius: 40, 
            padding: "48px",
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 40px 80px -20px rgba(0,0,0,0.3)",
            transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 40 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                    <div style={{ 
                        width: 72, height: 72, borderRadius: 24, background: "linear-gradient(135deg, #0088cc 0%, #00a8ff 100%)",
                        display: "flex", alignItems: "center", justifyContent: "center", color: "#fff",
                        boxShadow: "0 15px 30px -5px rgba(0, 136, 204, 0.4)"
                    }}>
                        <TelegramIcon size={40} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>Telegram</h2>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                            <span style={{ fontSize: 14, color: "#0088cc", fontWeight: 700 }}>Bot Infrastructure</span>
                            <div style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--text-tertiary)" }} />
                            <span style={{ fontSize: 14, color: "var(--text-tertiary)", fontWeight: 500 }}>Real-time Polling</span>
                        </div>
                    </div>
                </div>
                {tgStatus === "connected" && (
                  <div className="status-badge-blue" style={{ padding: "8px 16px", borderRadius: 100, background: "rgba(0, 136, 204, 0.12)", color: "#0088cc", fontSize: 13, fontWeight: 800, border: "1px solid rgba(0, 136, 204, 0.2)", letterSpacing: "0.05em" }}>
                    POLLING
                  </div>
                )}
            </div>

            <div style={{ display: "flex", gap: 48, flexWrap: "wrap" }}>
                {/* Left: Interactive Section */}
                <div style={{ flex: "1 1 340px", display: "flex", flexDirection: "column", gap: 24 }}>
                    <div style={{ 
                        height: 380, 
                        background: tgStatus === "connected" ? "radial-gradient(circle at center, rgba(0, 136, 204, 0.08) 0%, transparent 70%)" : "rgba(0,0,0,0.15)", 
                        borderRadius: 32, 
                        border: "1px solid rgba(255,255,255,0.05)",
                        padding: "0 32px",
                        display: "flex", 
                        flexDirection: "column",
                        alignItems: "center", 
                        justifyContent: "center",
                        position: "relative"
                    }}>
                        {tgStatus === "connected" ? (
                          <div style={{ textAlign: "center", width: "100%" }}>
                            <div className="success-glow" style={{ 
                                width: 80, height: 80, borderRadius: "50%", background: "rgba(0, 136, 204, 0.15)",
                                display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px"
                            }}>
                                <CheckIcon size={36} color="#0088cc" />
                            </div>
                            <h3 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 10px" }}>Engine Active</h3>
                            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 24, lineHeight: 1.6 }}>The bot is successfully harvesting messages from Telegram.</p>
                            <button
                              onClick={handleDisconnectTelegram}
                              disabled={isConnectingTg}
                              className="disconnect-btn-tg"
                            >
                              {isConnectingTg ? "Disconnecting..." : "Stop Engine"}
                            </button>
                          </div>
                        ) : (
                          <div style={{ width: "100%" }}>
                            <div style={{ marginBottom: 28 }}>
                              <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 12, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                                Access Token
                              </label>
                              <div className="input-glow-container">
                                <input 
                                    type="password" 
                                    placeholder="7123456789:AAH-xXyYzZ..." 
                                    value={tgToken}
                                    onChange={(e) => setTgToken(e.target.value)}
                                    className="premium-input"
                                />
                                <div style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)" }}>
                                    <GlobeIcon size={18} />
                                </div>
                              </div>
                            </div>
                            <button 
                              onClick={handleConnectTelegram}
                              disabled={!tgToken || isConnectingTg}
                              className="connect-btn-tg"
                              style={{ padding: "16px", borderRadius: "16px", fontSize: "15px" }}
                            >
                              {isConnectingTg ? "Syncing..." : "Initialize Engine"}
                              {!isConnectingTg && <ChevronRightIcon size={18} />}
                            </button>
                            {tgError && (
                              <div className="error-badge" style={{ padding: "12px 16px", borderRadius: "12px", fontSize: "12px" }}>
                                ⚠️ {tgError}
                              </div>
                            )}
                          </div>
                        )}
                    </div>
                </div>

                {/* Right: Tutorial Section */}
                <div style={{ flex: "1 1 200px", padding: "10px 0" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 24, display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 4, height: 16, background: "#0088cc", borderRadius: 4 }} />
                    Bot Configuration
                </div>
                    <div style={{ display: "grid", gap: 20 }}>
                        {INTEGRATION_STEPS.telegram.map((step, idx) => (
                            <div key={idx} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                                <div style={{ width: 26, height: 26, borderRadius: 8, background: "rgba(255,255,255,0.05)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, flexShrink: 0, border: "1px solid rgba(255,255,255,0.1)" }}>{idx + 1}</div>
                                <p style={{ margin: 0, fontSize: 13, color: "var(--text-tertiary)", lineHeight: 1.6, fontWeight: 500 }}>{step}</p>
                            </div>
                        ))}
                    </div>

                    <div style={{ marginTop: 32, padding: "16px", borderRadius: 16, background: "rgba(0, 136, 204, 0.05)", border: "1px solid rgba(0, 136, 204, 0.1)" }}>
                        <p style={{ margin: 0, fontSize: 12, color: "#0088cc", fontWeight: 600, lineHeight: 1.5 }}>
                            🔒 Security: We never store your bot tokens in plain text. All connections are encrypted.
                        </p>
                    </div>
                </div>
            </div>
          </section>

        </div>

        {/* Support Section */}
        <div style={{ marginTop: 80, padding: "40px", background: "rgba(255,255,255,0.02)", borderRadius: 40, border: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 24 }}>
            <div>
              <h4 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 6px" }}>Need specialized integration?</h4>
              <p style={{ fontSize: 14, color: "var(--text-tertiary)", margin: 0 }}>Discover our Enterprise API and Custom Webhook solutions.</p>
            </div>
            <div style={{ display: "flex", gap: 16 }}>
              <button style={{ padding: "12px 24px", borderRadius: 14, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontWeight: 700, cursor: "pointer" }}>Documentation</button>
              <button style={{ padding: "12px 24px", borderRadius: 14, background: "var(--accent-primary)", border: "none", color: "#fff", fontWeight: 700, cursor: "pointer", boxShadow: "0 10px 20px -5px rgba(99,102,241,0.4)" }}>Special Request</button>
            </div>
        </div>

      </div>

      <style jsx global>{`
        .integration-card:hover {
          transform: translateY(-8px) scale(1.002);
          border-color: rgba(255, 255, 255, 0.15) !important;
          box-shadow: 0 50px 100px -20px rgba(0,0,0,0.4) !important;
        }
        
        .qr-frame {
          padding: 16px;
          background: #fff;
          border-radius: 24px;
          box-shadow: 0 30px 60px rgba(0,0,0,0.3);
          position: relative;
        }
        
        .qr-overlay {
          position: absolute;
          inset: 0;
          border-radius: 24px;
          box-shadow: inset 0 0 30px rgba(37, 211, 102, 0.1);
          pointer-events: none;
        }

        .premium-loader {
          width: 44px;
          height: 44px;
          border: 3px solid rgba(37, 211, 102, 0.1);
          border-top: 3px solid #25D366;
          border-radius: 50%;
          animation: spin 1s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }

        .qr-placeholder-icon {
          animation: bounce 2s infinite ease-in-out;
        }

        .input-glow-container {
          position: relative;
        }

        .premium-input {
          width: 100%;
          padding: 18px 20px;
          background: rgba(0,0,0,0.2) !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          border-radius: 16px !important;
          color: #fff !important;
          font-family: inherit !important;
          font-size: 14px !important;
          outline: none;
          transition: all 0.3s ease;
        }

        .premium-input:focus {
          border-color: #0088cc !important;
          box-shadow: 0 0 20px rgba(0, 136, 204, 0.15);
        }

        .connect-btn-tg {
          width: 100%;
          background: linear-gradient(135deg, #0088cc 0%, #00a8ff 100%);
          border: none;
          color: #fff;
          font-weight: 800;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          box-shadow: 0 15px 30px -5px rgba(0, 136, 204, 0.5);
          transition: all 0.3s ease;
        }

        .connect-btn-tg:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 20px 40px -5px rgba(0, 136, 204, 0.6);
        }

        .disconnect-btn, .disconnect-btn-tg {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #ef4444;
          padding: 12px 28px;
          border-radius: 14px;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .disconnect-btn:hover, .disconnect-btn-tg:hover {
          background: #ef4444;
          color: #fff;
        }

        .error-badge {
          margin-top: 16px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #ef4444;
          font-weight: 600;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .timer-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          animation: pulse-ring 1.5s infinite;
        }

        @keyframes pulse-ring {
          0% { transform: scale(0.8); box-shadow: 0 0 0 0 rgba(255,255,255,0.4); }
          70% { transform: scale(1.1); box-shadow: 0 0 0 10px rgba(255,255,255,0); }
          100% { transform: scale(0.8); box-shadow: 0 0 0 0 rgba(255,255,255,0); }
        }

        .success-glow {
          box-shadow: 0 0 40px rgba(34, 197, 94, 0.2);
          animation: float 4s infinite ease-in-out;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }

        .status-badge, .status-badge-blue {
          box-shadow: 0 0 15px currentColor;
        }
      `}</style>
    </div>
  );
}
