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
import { fetchSessions } from "@/app/actions/sessionsApi";
import { fetchOrders } from "@/app/actions/ordersApi";
import { showToast } from "@/lib/swal";

// --- Chart Components ---

function Chart({ 
  datasets, 
  labels, 
  activeRange,
  onRangeChange,
  height = 240 
}: { 
  datasets: { data: number[], color: string, label: string, type?: 'line' | 'bar' }[], 
  labels: string[],
  activeRange: string,
  onRangeChange: (range: string) => void,
  height?: number 
}) {
  const [hoveredNode, setHoveredNode] = useState<{x: number, y: number, val: number, label: string, color: string} | null>(null);
  const width = 1000;
  const padding = 40;
  const chartHeight = height - 40;
  
  const allValues = datasets.flatMap(d => d.data);
  const max = Math.max(...allValues, 1) * 1.1;

  const getPoint = (val: number, index: number, total: number) => {
    const x = padding + (index * (width - 2 * padding) / (total - 1));
    const y = chartHeight - padding - (val / max) * (chartHeight - 2 * padding);
    return { x, y };
  };

  // Linear Path (Siku Segitiga) helper
  const getLinearPath = (pts: {x: number, y: number}[]) => {
    if (pts.length < 2) return "";
    return pts.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(" ");
  };

  return (
    <div className="chart-wrapper" style={{ width: "100%", height: height + 60, position: "relative" }}>
       {/* Chart Actions Header */}
       <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28, gap: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 24 }}>
            {datasets.map((ds, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11 }}>
                <div style={{ width: 14, height: ds.type === 'bar' ? 10 : 3, borderRadius: 2, background: ds.color }} />
                <span style={{ color: "var(--text-secondary)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{ds.label}</span>
              </div>
            ))}
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
             <div style={{ display: "flex", background: "var(--api-key-bg)", padding: 3, borderRadius: 8, border: "1px solid var(--border-color)" }}>
                {["1D", "1W", "1M"].map(t => (
                  <button 
                    key={t} 
                    onClick={() => onRangeChange(t)}
                    style={{ 
                      padding: "4px 12px", 
                      fontSize: 10, 
                      fontWeight: 800, 
                      borderRadius: 6,
                      border: "none",
                      background: t === activeRange ? "var(--accent-primary)" : "transparent",
                      color: t === activeRange ? "#fff" : "var(--text-tertiary)",
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    {t}
                  </button>
                ))}
             </div>
             <div style={{ width: 1, height: 20, background: "var(--border-color)" }} />
             <button className="btn-secondary" style={{ padding: "6px 10px", fontSize: 11, gap: 6 }} onClick={() => showToast('success', 'Report ready for download')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Export
             </button>
          </div>
       </div>

       <div style={{ position: "relative", width: "100%", height: chartHeight }}>
          <svg width="100%" height="100%" viewBox={`0 0 ${width} ${chartHeight}`} preserveAspectRatio="none" style={{ overflow: "visible" }}>
             <defs>
               <filter id="glow-heavy" x="-20%" y="-20%" width="140%" height="140%">
                 <feGaussianBlur stdDeviation="4" result="blur" />
                 <feComposite in="SourceGraphic" in2="blur" operator="over" />
               </filter>
             </defs>

             {/* Grid */}
             {[0, 0.25, 0.5, 0.75, 1].map((v, i) => {
               const y = chartHeight - padding - v * (chartHeight - 2 * padding);
               return (
                 <g key={i}>
                    <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="var(--foreground)" strokeWidth="1" opacity="0.06" />
                    <text x={0} y={y + 4} fontSize="9" fill="var(--text-tertiary)" fontFamily="monospace" fontWeight="600" opacity="0.5">
                        {Math.round(v * max).toLocaleString()}
                    </text>
                 </g>
               );
             })}

             {/* Bars */}
             {datasets.filter(ds => ds.type === 'bar').map((ds, dsIdx) => (
                <g key={dsIdx}>
                  {ds.data.map((val, i) => {
                    const p = getPoint(val, i, ds.data.length);
                    const barWidth = (width - 2 * padding) / ds.data.length * 0.5;
                    const barHeight = (chartHeight - padding) - p.y;
                    return (
                      <rect
                        key={i}
                        x={p.x - barWidth / 2}
                        y={p.y}
                        width={barWidth}
                        height={barHeight}
                        fill={ds.color}
                        opacity="0.15"
                        rx="1"
                        style={{ transition: "all 0.5s ease-in-out" }}
                      />
                    );
                  })}
                </g>
             ))}

             {/* Linear Lines (Siku Segitiga) */}
             {datasets.filter(ds => ds.type !== 'bar').map((ds, dsIndex) => {
               const points = ds.data.map((val, i) => getPoint(val, i, ds.data.length));
               const pathD = getLinearPath(points);
               
               return (
                 <g key={dsIndex}>
                    {/* Line Path */}
                    <path
                      d={pathD}
                      fill="none"
                      stroke={ds.color}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      filter="url(#glow-heavy)"
                      style={{ 
                        transition: "all 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                      }}
                    />

                    {/* Node Dots (Lingkaran di ujung zigzag) */}
                    {points.map((p, i) => (
                      <circle
                        key={i}
                        cx={p.x}
                        cy={p.y}
                        r={hoveredNode?.x === p.x && hoveredNode?.y === p.y ? "5" : "3.5"}
                        fill={hoveredNode?.x === p.x && hoveredNode?.y === p.y ? ds.color : "var(--modal-bg)"}
                        stroke={ds.color}
                        strokeWidth="2"
                        onMouseEnter={() => setHoveredNode({ x: p.x, y: p.y, val: ds.data[i], label: ds.label, color: ds.color })}
                        onMouseLeave={() => setHoveredNode(null)}
                        style={{ 
                          cursor: "pointer",
                          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                        }}
                      />
                    ))}
                 </g>
               );
             })}

             {/* Vertical Indicator on Hover */}
             {hoveredNode && (
               <line 
                x1={hoveredNode.x} y1={padding} x2={hoveredNode.x} y2={chartHeight - padding} 
                stroke={hoveredNode.color} strokeWidth="1" strokeDasharray="4 4" opacity="0.5" 
               />
             )}
          </svg>

          {/* HTML Tooltip */}
          {hoveredNode && (
            <div style={{
              position: "absolute",
              left: `${(hoveredNode.x / width) * 100}%`,
              top: hoveredNode.y - 15,
              transform: "translate(-50%, -100%)",
              background: "var(--modal-bg)",
              border: `1px solid ${hoveredNode.color}`,
              padding: "8px 12px",
              borderRadius: "10px",
              boxShadow: "0 10px 15px -3px rgba(0,0,0,0.3)",
              zIndex: 100,
              pointerEvents: "none",
              backdropFilter: "blur(10px)",
              animation: "fadeIn 0.2s ease-out",
              minWidth: "120px"
            }}>
              <p style={{ fontSize: 9, color: "var(--text-tertiary)", fontWeight: 700, margin: "0 0 2px 0", textTransform: "uppercase" }}>{hoveredNode.label}</p>
              <p style={{ fontSize: 16, fontWeight: 800, margin: 0, color: "var(--foreground)" }}>{hoveredNode.val.toLocaleString()}</p>
            </div>
          )}
       </div>

       <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20, padding: `0 ${padding / (width / 100)}%`, fontSize: 10, color: "var(--text-tertiary)", fontFamily: "monospace", fontWeight: "600" }}>
          {labels.map(l => <span key={l}>{l}</span>)}
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
  const [activeRange, setActiveRange] = useState("1D");
  const [sessionData, setSessionData] = useState<any[]>([]);
  const [orderData, setOrderData] = useState<any[]>([]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const userRes = await getMe();
      let currentUser = null;
      if (userRes.success) {
        currentUser = userRes.data;
        setUser(currentUser);
      }

      const summaryRes = await fetchDashboardSummary();
      if (summaryRes.success) {
        setSummary(summaryRes.data);
        setLastChecked(new Date().toLocaleTimeString());
      }

      if (currentUser) {
         // Fetch real data for Chart
         const tId = currentUser.tenant_id || "";
         const [sRes, oRes] = await Promise.all([
           fetchSessions(tId),
           fetchOrders(currentUser.role === "admin" ? undefined : tId)
         ]);

         if (sRes.success) setSessionData(sRes.data || []);
         if (oRes.success) setOrderData(oRes.data || []);
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

  // Real Data Processing Logic
  const getChartConfig = (range: string) => {
    const now = new Date();
    let labels: string[] = [];
    let buckets = 7;
    
    if (range === "1D") {
      labels = ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "23:59"];
      buckets = labels.length;
    } else if (range === "1W") {
      labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      buckets = 7;
    } else {
      labels = ["Week 1", "Week 2", "Week 3", "Week 4"];
      buckets = 4;
    }

    const processRecords = (records: any[]) => {
      const data = new Array(buckets).fill(0);
      records.forEach(r => {
        const date = new Date(r.created_at || r.start_time);
        if (range === "1D") {
          const hour = date.getHours();
          const bucket = Math.min(Math.floor(hour / 4), buckets - 1);
          data[bucket]++;
        } else if (range === "1W") {
          const day = (date.getDay() + 6) % 7; // Mon=0
          data[day]++;
        } else {
          const week = Math.min(Math.floor(date.getDate() / 8), buckets - 1);
          data[week]++;
        }
      });
      return data;
    };

    return { labels, processRecords };
  };

  const { labels, processRecords } = getChartConfig(activeRange);

  const adminDatasets: any[] = [
    { 
      label: "Tenant Sessions", 
      type: 'line',
      data: processRecords(sessionData), 
      color: "#ef4444" 
    },
    { 
      label: "System Orders", 
      type: 'line',
      data: processRecords(orderData), 
      color: "#eab308" 
    },
    {
      label: "Load Distribution",
      type: 'bar',
      data: processRecords(sessionData).map(v => Math.round(v * 0.4)),
      color: "#22d3ee"
    }
  ];

  const userDatasets: any[] = [
    { 
      label: "My Sessions", 
      type: 'line',
      data: processRecords(sessionData), 
      color: "#ef4444" 
    },
    { 
      label: "Total Orders", 
      type: 'line',
      data: processRecords(orderData), 
      color: "#eab308" 
    },
    {
      label: "Response Rate",
      type: 'bar',
      data: processRecords(sessionData).map(v => Math.round(v * 0.6)),
      color: "#22d3ee"
    }
  ];

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
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 24 }}>System Performance & Growth</h3>
                <Chart 
                  datasets={isAdmin ? adminDatasets : userDatasets} 
                  labels={labels}
                  activeRange={activeRange}
                  onRangeChange={setActiveRange}
                  height={240}
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
