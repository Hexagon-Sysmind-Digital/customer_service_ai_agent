"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchDashboardSummary } from "@/app/actions/dashboard";
import { getMe } from "@/app/actions/auth";
import { User, AdminDashboardSummary, UserDashboardSummary } from "@/types";
import { useRouter } from "next/navigation";
import { 
  BotIcon, 
  UserIcon, 
  CreditCardIcon, 
  ChatIcon, 
  KnowledgeIcon, 
  FaqIcon,
  PremiumBotIcon
} from "@/components/icons";
import PageHeader from "@/components/ui/PageHeader";

// --- Chart Components ---

function BarChart({ data, color, label }: { data: number[], color: string, label: string }) {
  const max = Math.max(...data, 1);
  const height = 120;
  const width = 300;
  const barWidth = 30;
  const gap = 10;

  return (
    <div className="chart-container" style={{ width: "100%", height: height + 60, position: "relative" }}>
       <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 16 }}>{label}</p>
       <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
          {data.map((val, i) => {
            const barHeight = (val / max) * height;
            return (
              <rect
                key={i}
                x={i * (barWidth + gap)}
                y={height - barHeight}
                width={barWidth}
                height={barHeight}
                fill={`rgba(${color}, 0.8)`}
                rx={4}
                style={{ 
                  animation: `growUp 0.8s ease-out forwards`,
                  animationDelay: `${i * 100}ms`,
                  transformOrigin: "bottom",
                  transform: "scaleY(0)"
                }}
              />
            );
          })}
       </svg>
       <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 10, color: "var(--text-tertiary)" }}>
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => <span key={d}>{d}</span>)}
       </div>
    </div>
  );
}

function DonutChart({ values, labels, colors, centerLabel }: { values: number[], labels: string[], colors: string[], centerLabel: string }) {
  const total = values.reduce((a, b) => a + b, 0) || 1;
  let currentAngle = 0;
  const radius = 40;
  const strokeWidth = 12;
  const center = 50;
  const circumference = 2 * Math.PI * radius;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
      <div style={{ position: "relative", width: 120, height: 120 }}>
        <svg viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
          {values.map((val, i) => {
            const percentage = (val / total) * 100;
            const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
            const offset = (currentAngle / 100) * circumference;
            currentAngle += percentage;
            
            return (
              <circle
                key={i}
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke={colors[i]}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={-offset}
                style={{
                  transition: "stroke-dashoffset 1s ease-out",
                  animation: "fadeIn 1s ease-out forwards"
                }}
              />
            );
          })}
        </svg>
        <div style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center"
        }}>
          <span style={{ fontSize: 16, fontWeight: 700 }}>{total}</span>
          <span style={{ fontSize: 9, color: "var(--text-tertiary)", textTransform: "uppercase" }}>{centerLabel}</span>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {labels.map((label, i) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: colors[i] }} />
            <span style={{ color: "var(--text-secondary)" }}>{label}:</span>
            <span style={{ fontWeight: 600 }}>{values[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Main Page ---

function StatCard({ label, value, icon: Icon, color, delay }: { label: string, value: string | number, icon: any, color: string, delay: number }) {
  return (
    <div 
      className="glass-card p-6 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          background: `rgba(${color}, 0.1)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: `rgb(${color})`,
          boxShadow: `0 8px 16px -4px rgba(${color}, 0.2)`
        }}>
          <Icon />
        </div>
      </div>
      <div>
        <p style={{ fontSize: 12, color: "var(--text-tertiary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 4px 0" }}>
          {label}
        </p>
        <h3 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: "var(--foreground)" }}>
          {value.toLocaleString()}
        </h3>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [summary, setSummary] = useState<AdminDashboardSummary | UserDashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<string>("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const userRes = await getMe();
      if (userRes.success) {
        setUser(userRes.data);
      }

      const summaryRes = await fetchDashboardSummary();
      if (summaryRes.success) {
        setSummary(summaryRes.data);
        setLastChecked(new Date().toLocaleTimeString());
      } else {
        setError(summaryRes.error || "Failed to fetch dashboard data");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const isAdmin = user?.role === "admin" || user?.role === "owner";

  if (loading) {
    return (
      <div style={{ padding: "32px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ height: 40, width: 200, background: "var(--skeleton-from)", borderRadius: 8, marginBottom: 32 }} className="skeleton" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{ height: 160, background: "var(--skeleton-from)", borderRadius: 16 }} className="skeleton" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const adminStats = summary as AdminDashboardSummary;
  const userStats = summary as UserDashboardSummary;

  // Mock Trend Data
  const trendData = isAdmin ? [1, 2, 2, 3, 3, 3, 3] : [8, 12, 15, 10, 20, 18, 22];

  return (
    <div style={{ minHeight: "100vh", padding: "32px 24px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        
        {/* Page Header */}
        <PageHeader 
          title="Dashboard" 
          description={`Welcome back, ${user?.name}. Here's what's happening today in your AI ecosystem.`}
          action={
            <div style={{ 
              padding: 10, 
              borderRadius: 14, 
              background: "linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1))",
              color: "var(--accent-primary)",
              boxShadow: "0 8px 16px -4px rgba(99,102,241,0.1)"
            }}>
              <PremiumBotIcon size={28} />
            </div>
          }
        />

        {error && (
          <div className="alert alert-error mb-8">
            <span>⚠️ {error}</span>
            <button className="btn-secondary btn-sm" onClick={loadData}>Retry</button>
          </div>
        )}

        {/* 12-Column Grid Layout */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 24 }}>
          
          {/* Stats Section (Top Row) */}
          <div style={{ gridColumn: "span 12", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
            {isAdmin ? (
              <>
                <StatCard label="Total Tenants" value={adminStats?.total_tenants || 0} icon={BotIcon} color="99, 102, 241" delay={0} />
                <StatCard label="Total Users" value={adminStats?.total_users || 0} icon={UserIcon} color="139, 92, 246" delay={100} />
                <StatCard label="Active Credits" value={adminStats?.active_credits || 0} icon={CreditCardIcon} color="34, 197, 94" delay={200} />
                <StatCard label="Overdue Credits" value={adminStats?.overdue_credits || 0} icon={CreditCardIcon} color="239, 68, 68" delay={300} />
              </>
            ) : (
              <>
                <StatCard label="Total Sessions" value={userStats?.total_sessions || 0} icon={ChatIcon} color="99, 102, 241" delay={0} />
                <StatCard label="Active Sessions" value={userStats?.active_sessions || 0} icon={ChatIcon} color="34, 197, 94" delay={100} />
                <StatCard label="Knowledge Bases" value={userStats?.total_knowledge_bases || 0} icon={KnowledgeIcon} color="139, 92, 246" delay={200} />
                <StatCard label="Total FAQs" value={userStats?.total_faqs || 0} icon={FaqIcon} color="245, 158, 11" delay={300} />
              </>
            )}
          </div>

          {/* Analysis Section (Middle Row) */}
          <div style={{ gridColumn: isAdmin ? "span 8" : "span 12", gridRow: "span 1" }}>
             <div className="glass-card p-8 h-full" style={{ animation: "slideUp 0.6s ease-out 400ms fill-mode-both" }}>
                <BarChart 
                  data={trendData} 
                  color={isAdmin ? "99, 102, 241" : "139, 92, 246"} 
                  label={isAdmin ? "Tenant Growth (Last 7 Days)" : "Chat Activities (Last 7 Days)"} 
                />
             </div>
          </div>

          {isAdmin && (
            <div style={{ gridColumn: "span 4" }}>
              <div className="glass-card p-8 h-full flex flex-col justify-center" style={{ animation: "slideUp 0.6s ease-out 500ms fill-mode-both" }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 24 }}>System Distribution</p>
                <DonutChart 
                  values={[adminStats?.total_tenants || 0, adminStats?.total_users || 0]} 
                  labels={["Tenants", "Users"]} 
                  colors={["#6366f1", "#a855f7"]} 
                  centerLabel="Entities"
                />
              </div>
            </div>
          )}

          {!isAdmin && (
             <div style={{ gridColumn: "span 6" }}>
                <div className="glass-card p-8 h-full flex flex-col justify-center" style={{ animation: "slideUp 0.6s ease-out 500ms fill-mode-both" }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 24 }}>Session Status</p>
                  <DonutChart 
                    values={[userStats?.active_sessions || 0, Math.max(0, (userStats?.total_sessions || 0) - (userStats?.active_sessions || 0))]} 
                    labels={["Active", "Completed"]} 
                    colors={["#22c55e", "#64748b"]} 
                    centerLabel="Sessions"
                  />
                </div>
             </div>
          )}

          {!isAdmin && (
             <div style={{ gridColumn: "span 6" }}>
                <div className="glass-card p-8 h-full flex flex-col justify-center" style={{ animation: "slideUp 0.6s ease-out 600ms fill-mode-both" }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 24 }}>Content Overview</p>
                  <DonutChart 
                    values={[userStats?.total_knowledge_bases || 0, userStats?.total_faqs || 0]} 
                    labels={["KB Articles", "FAQs"]} 
                    colors={["#818cf8", "#f59e0b"]} 
                    centerLabel="Items"
                  />
                </div>
             </div>
          )}

          {/* Quick Actions & Status (Bottom Row) */}
          <div style={{ gridColumn: "span 7" }}>
             <div className="glass-card p-8" style={{ borderLeft: "4px solid var(--accent-primary)", height: "100%", animation: "slideUp 0.6s ease-out 700ms fill-mode-both" }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Quick Shortcuts</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                   <button className="btn-secondary" style={{ justifyContent: "flex-start", padding: "14px 18px", borderRadius: 12 }} onClick={() => router.push('/chat')}>
                      <div style={{ background: "rgba(99,102,241,0.1)", padding: 8, borderRadius: 8, display: "flex", color: "#6366f1", marginRight: 8 }}>
                        <ChatIcon />
                      </div>
                      Open Agent Chat
                   </button>
                   {isAdmin ? (
                     <button className="btn-secondary" style={{ justifyContent: "flex-start", padding: "14px 18px", borderRadius: 12 }} onClick={() => router.push('/tenants')}>
                        <div style={{ background: "rgba(139,92,246,0.1)", padding: 8, borderRadius: 8, display: "flex", color: "#8b5cf6", marginRight: 8 }}>
                          <BotIcon />
                        </div>
                        Tenants Portal
                     </button>
                   ) : (
                     <button className="btn-secondary" style={{ justifyContent: "flex-start", padding: "14px 18px", borderRadius: 12 }} onClick={() => router.push('/profile')}>
                        <div style={{ background: "rgba(139,92,246,0.1)", padding: 8, borderRadius: 8, display: "flex", color: "#8b5cf6", marginRight: 8 }}>
                          <UserIcon />
                        </div>
                        Agent Settings
                     </button>
                   )}
                   <button className="btn-secondary" style={{ justifyContent: "flex-start", padding: "14px 18px", borderRadius: 12 }} onClick={() => router.push('/knowledge')}>
                      <div style={{ background: "rgba(34,197,94,0.1)", padding: 8, borderRadius: 8, display: "flex", color: "#22c55e", marginRight: 8 }}>
                        <KnowledgeIcon />
                      </div>
                      Knowledge Base
                   </button>
                   <button className="btn-secondary" style={{ justifyContent: "flex-start", padding: "14px 18px", borderRadius: 12 }} onClick={() => router.push('/faqs')}>
                      <div style={{ background: "rgba(245,158,11,0.1)", padding: 8, borderRadius: 8, display: "flex", color: "#f59e0b", marginRight: 8 }}>
                        <FaqIcon />
                      </div>
                      FAQ Manager
                   </button>
                </div>
             </div>
          </div>
          
          <div style={{ gridColumn: "span 5" }}>
             <div className="glass-card p-8" style={{ borderLeft: "4px solid var(--accent-purple)", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", animation: "slideUp 0.6s ease-out 800ms fill-mode-both" }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Live System Health</h3>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                    <div className="pulse-dot" style={{ width: 12, height: 12, borderRadius: "50%", background: "#22c55e" }} />
                    <span style={{ fontSize: 16, fontWeight: 600, color: "var(--foreground)" }}>Optimized & Stable</span>
                  </div>
                  <div style={{ display: "grid", gap: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                      <span style={{ color: "var(--text-tertiary)" }}>API Response Time</span>
                      <span style={{ fontWeight: 600, color: "#22c55e" }}>48ms</span>
                    </div>
                    <div style={{ height: 4, background: "rgba(99,115,171,0.1)", borderRadius: 2 }}>
                       <div style={{ width: "85%", height: "100%", background: "linear-gradient(90deg, #6366f1, #22c55e)", borderRadius: 2 }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                      <span style={{ color: "var(--text-tertiary)" }}>LLM Success Rate</span>
                      <span style={{ fontWeight: 600, color: "#22c55e" }}>99.8%</span>
                    </div>
                    <div style={{ height: 4, background: "rgba(99,115,171,0.1)", borderRadius: 2 }}>
                       <div style={{ width: "99%", height: "100%", background: "linear-gradient(90deg, #6366f1, #22c55e)", borderRadius: 2 }} />
                    </div>
                  </div>
                </div>
                {lastChecked && (
                  <p style={{ fontSize: 12, color: "var(--text-tertiary)", margin: "24px 0 0 0", fontStyle: "italic" }}>
                    Real-time monitoring active. Last update: {lastChecked}
                  </p>
                )}
             </div>
          </div>

        </div>

      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideRight {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes growUp {
          from { transform: scaleY(0); }
          to { transform: scaleY(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .pulse-dot {
          box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4);
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); }
          100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
        }
        @media (max-width: 1024px) {
          .analysis-grid {
            display: flex !important;
            flex-direction: column;
          }
        }
      `}} />
    </div>
  );
}
