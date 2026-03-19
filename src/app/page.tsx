"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/app/actions/auth";
import ThemeToggle from "@/components/layout/ThemeToggle";

import { PremiumBotIcon } from "@/components/icons";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    // Menghapus caching yang mungkin tersisa agar login baru bersih (mencegah bug sidebar salah role)
    sessionStorage.removeItem("user_role");
    sessionStorage.removeItem("tenants_list");
    sessionStorage.removeItem("tenant_id");
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);

    try {
      const result = await login(formData);
      console.log('CLIENT DEBUG [login result]:', result);
      if (result.success) {
        if (result.token) {
          sessionStorage.setItem("token", result.token);
          console.log('CLIENT DEBUG: Stored token');
        }
        if (result.user?.role) {
          sessionStorage.setItem("user_role", result.user.role);
          console.log('CLIENT DEBUG: Stored role:', result.user.role);
        }
        if (result.user?.tenant_id) {
          sessionStorage.setItem("tenant_id", result.user.tenant_id);
          console.log('CLIENT DEBUG: Stored tenant_id:', result.user.tenant_id);
        }
        if (result.api_key) {
          sessionStorage.setItem("api_key", result.api_key);
          console.log('CLIENT DEBUG: Stored api_key');
        }

        // Redirect based on role
        if (result.user?.role === "admin" || result.user?.role === "owner") {
          router.push("/tenants");
        } else {
          router.push("/chat");
        }
        router.refresh(); 
      } else {
        setError(result.error || "Login failed");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      backgroundColor: "var(--background)",
      overflow: "hidden",
      position: "relative"
    }}>
      {/* Dynamic Background Elements */}
      <div style={{
        position: "absolute",
        top: "-20%",
        left: "-10%",
        width: "60vw",
        height: "60vw",
        background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, rgba(0,0,0,0) 70%)",
        filter: "blur(60px)",
        zIndex: 0,
        pointerEvents: "none"
      }} />
      <div style={{
        position: "absolute",
        bottom: "-20%",
        right: "-10%",
        width: "50vw",
        height: "50vw",
        background: "radial-gradient(circle, rgba(139,92,246,0.1) 0%, rgba(0,0,0,0) 70%)",
        filter: "blur(60px)",
        zIndex: 0,
        pointerEvents: "none"
      }} />

      {/* Left Side - Animated Graphic / Presentation (Hidden on mobile) */}
      <div style={{
        flex: 1,
        display: "none",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "40px",
        position: "relative",
        zIndex: 1,
        borderRight: "1px solid var(--card-border)",
        background: "var(--card-bg)",
        backdropFilter: "blur(20px)"
      }} className="lg-flex">
        
        <div style={{ textAlign: "center", maxWidth: 480, animation: "slideRight 0.8s ease-out" }}>
          <div style={{
            display: "inline-flex",
            padding: "16px",
            borderRadius: "24px",
            background: "var(--skeleton-from)",
            border: "1px solid var(--card-border)",
            boxShadow: "var(--shadow-glow)",
            marginBottom: 32
          }}>
             <PremiumBotIcon />
          </div>
          <h1 style={{ 
            fontSize: 48, 
            fontWeight: 800, 
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            marginBottom: 24,
            color: "var(--foreground)"
          }}>
            Next-Gen AI Agent Management
          </h1>
          <p style={{ 
            fontSize: 18, 
            color: "var(--text-secondary)",
            lineHeight: 1.6,
            fontWeight: 400 
          }}>
            Seamlessly control your entire fleet of AI tenants. Monitor performance, fine-tune models, and elevate your customer experience.
          </p>

          {/* Floating abstract decorative elements */}
          <div style={{
            marginTop: 64,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16
          }}>
            <div style={{
              padding: 24,
              borderRadius: 16,
              background: "var(--skeleton-from)",
              border: "1px solid var(--card-border)",
              backdropFilter: "blur(10px)",
              textAlign: "left"
            }}>
               <div style={{ fontSize: 24, fontWeight: 700, color: "#818cf8", marginBottom: 8 }}>99.9%</div>
               <div style={{ fontSize: 13, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Uptime SLA</div>
            </div>
            <div style={{
              padding: 24,
              borderRadius: 16,
              background: "var(--skeleton-from)",
              border: "1px solid var(--card-border)",
              backdropFilter: "blur(10px)",
              textAlign: "left"
            }}>
               <div style={{ fontSize: 24, fontWeight: 700, color: "#c084fc", marginBottom: 8 }}>&lt;50ms</div>
               <div style={{ fontSize: 13, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Avg Latency</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "40px 20px",
        position: "relative",
        zIndex: 1
      }}>
        <div style={{ position: "absolute", top: 32, right: 32 }}>
          <ThemeToggle />
        </div>

        <div style={{
          width: "100%",
          maxWidth: 440,
          animation: "slideUp 0.6s ease-out"
        }}>
          
          <div style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 32, fontWeight: 700, margin: "0 0 12px 0", letterSpacing: "-0.02em" }}>
              Welcome back
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: 15, margin: 0 }}>
              Enter your credentials to access your dashboard.
            </p>
          </div>

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            
            {error && (
              <div style={{
                padding: "14px 18px",
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                borderRadius: 12,
                color: "#f87171",
                fontSize: 14,
                display: "flex",
                alignItems: "center",
                gap: 12,
                animation: "shake 0.4s ease-in-out"
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <label htmlFor="email" style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Email Address
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    id="email"
                    type="email"
                    placeholder=""
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="input-field"
                    style={{
                      padding: "14px 16px 14px 44px",
                      borderRadius: 12,
                      fontSize: 15,
                    }}
                  />
                  <div style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)", pointerEvents: "none" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label htmlFor="password" style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Password
                  </label>
                  <a href="#" style={{ fontSize: 13, color: "var(--accent-primary)", textDecoration: "none", fontWeight: 500 }}>
                    Forgot?
                  </a>
                </div>
                <div style={{ position: "relative" }}>
                  <input
                    id="password"
                    type="password"
                    placeholder=""
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="input-field"
                    style={{
                      padding: "14px 16px 14px 44px",
                      borderRadius: 12,
                      fontSize: 15,
                    }}
                  />
                  <div style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)", pointerEvents: "none" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              style={{ 
                width: "100%",
                padding: "14px 24px",
                background: loading ? "var(--text-secondary)" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                color: "#ffffff",
                border: "none",
                borderRadius: 12,
                fontSize: 16,
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 8,
                transition: "all 0.2s",
                boxShadow: loading ? "none" : "0 4px 14px rgba(99, 102, 241, 0.4)",
                marginTop: 8
              }}
              onMouseEnter={(e) => {
                 if(!loading) {
                   e.currentTarget.style.transform = "translateY(-1px)";
                   e.currentTarget.style.boxShadow = "0 6px 20px rgba(99, 102, 241, 0.5)";
                 }
              }}
              onMouseLeave={(e) => {
                 if(!loading) {
                    e.currentTarget.style.transform = "none";
                    e.currentTarget.style.boxShadow = "0 4px 14px rgba(99, 102, 241, 0.4)";
                 }
              }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg className="spinner" style={{ animation: "spin 1s linear infinite" }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="2" x2="12" y2="6"></line>
                    <line x1="12" y1="18" x2="12" y2="22"></line>
                    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                    <line x1="2" y1="12" x2="6" y2="12"></line>
                    <line x1="18" y1="12" x2="22" y2="12"></line>
                    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                    <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
                  </svg>
                  Authenticating...
                </>
              ) : (
                <>
                  Sign In
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </>
              )}
            </button>
          </form>

        </div>
      </div>
      
      {/* Required CSS Additions for animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideRight {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
        @media (min-width: 1024px) {
          .lg-flex { display: flex !important; }
        }
      `}} />
    </div>
  );
}
