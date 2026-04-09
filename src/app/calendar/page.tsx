"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import { fetchReservations } from "@/app/actions/reservationsApi";
import { fetchTenants, fetchTenantById } from "@/app/actions/tenants";
import { getMe } from "@/app/actions/auth";
import { Reservation, Tenant, User } from "@/types";

// ===== Color Map untuk reservation status =====
const STATUS_COLORS: Record<string, { dot: string; bg: string; text: string }> = {
  pending:   { dot: "#eab308", bg: "rgba(234, 179, 8, 0.1)",  text: "#eab308" },
  confirmed: { dot: "#22c55e", bg: "rgba(34, 197, 94, 0.1)",  text: "#22c55e" },
  completed: { dot: "#6366f1", bg: "rgba(99, 102, 241, 0.1)", text: "#818cf8" },
  cancelled: { dot: "#ef4444", bg: "rgba(239, 68, 68, 0.1)",  text: "#ef4444" },
  no_show:   { dot: "#f97316", bg: "rgba(249, 115, 22, 0.1)", text: "#f97316" },
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No Show",
};

function getStatusColor(status: string) {
  return STATUS_COLORS[status] || STATUS_COLORS.pending;
}

// ===== Helpers =====
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Monday = 0
}

function toDateKey(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function makeDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function formatFullDate(dateKey: string) {
  const d = new Date(dateKey + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

const MAX_VISIBLE = 3;

export default function CalendarPage() {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Data state
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState<string>("");

  // Load tenant & reservations
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Get user
      const userRes = await getMe();
      if (!userRes.success) {
        setError("Failed to fetch user profile");
        return;
      }
      const user: User = userRes.data;

      // 2. Get tenant ID
      let tid = "";
      if (user.tenant_id) {
        tid = user.tenant_id;
      } else {
        const tenantsRes = await fetchTenants(user.id);
        if (tenantsRes.success && tenantsRes.data?.length > 0) {
          tid = tenantsRes.data[0].id;
        }
      }

      if (!tid) {
        setError("No tenant found for your account");
        return;
      }
      setTenantId(tid);

      // 3. Fetch reservations
      const res = await fetchReservations(tid);
      if (res.success && Array.isArray(res.data)) {
        setReservations(res.data);
      } else {
        // 403 or empty is fine — just show empty calendar
        setReservations([]);
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

  // Group reservations by date key
  const reservationsByDate = useMemo(() => {
    const map: Record<string, Reservation[]> = {};
    for (const r of reservations) {
      if (!r.start_time) continue;
      const key = toDateKey(r.start_time);
      if (!map[key]) map[key] = [];
      map[key].push(r);
    }
    // Sort each day's reservations by time
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
    }
    return map;
  }, [reservations]);

  // Calendar grid calculations
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
    setSelectedDate(null);
  };

  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
    setSelectedDate(null);
  };

  const goToToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDate(null);
  };

  const handleDayClick = (day: number) => {
    const key = makeDateKey(currentYear, currentMonth, day);
    setSelectedDate(key);
  };

  const isToday = (day: number) => {
    return day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
  };

  // Build calendar grid
  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);
  while (calendarCells.length % 7 !== 0) calendarCells.push(null);

  const weeks: (number | null)[][] = [];
  for (let i = 0; i < calendarCells.length; i += 7) {
    weeks.push(calendarCells.slice(i, i + 7));
  }

  // Count total reservations this month
  const totalThisMonth = useMemo(() => {
    let count = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const key = makeDateKey(currentYear, currentMonth, d);
      count += (reservationsByDate[key] || []).length;
    }
    return count;
  }, [currentYear, currentMonth, daysInMonth, reservationsByDate]);

  // Selected date's reservations
  const selectedReservations = selectedDate ? (reservationsByDate[selectedDate] || []) : [];

  return (
    <div style={{ minHeight: "100vh", padding: "32px 24px", color: "var(--foreground)" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
              <div style={{
                width: 42, height: 42, borderRadius: 12,
                background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.15))",
                display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent-primary)"
              }}>
                <CalendarIcon />
              </div>
              <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>Calendar</h1>
              {!loading && (
                <span className="badge badge-count" style={{ fontSize: 13 }}>
                  {totalThisMonth} reservation{totalThisMonth !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            <p style={{ fontSize: 15, color: "var(--text-secondary)", margin: 0 }}>
              View your reservations in calendar view
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-secondary" onClick={goToToday} style={{ padding: "8px 18px", borderRadius: 10, fontSize: 13, fontWeight: 600 }}>
              Today
            </button>
            <button className="btn-secondary" onClick={loadData} style={{ padding: "8px 18px", borderRadius: 10, fontSize: 13, fontWeight: 600 }}>
              ↻ Refresh
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ padding: "16px 20px", background: "var(--accent-red-bg)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: 12, color: "var(--accent-red)", marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 14 }}>
            <span>⚠️ {error}</span>
            <button className="btn-secondary" style={{ padding: "6px 14px", fontSize: 13 }} onClick={loadData}>Retry</button>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="glass-card" style={{ borderRadius: 20, overflow: "hidden" }}>
            <div className="skeleton" style={{ height: 60 }} />
            <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 80, borderRadius: 10 }} />
              ))}
            </div>
          </div>
        )}

        {/* Calendar */}
        {!loading && (
          <div style={{ display: "grid", gridTemplateColumns: selectedDate ? "1fr 360px" : "1fr", gap: 24, alignItems: "start" }}>

            {/* Calendar Grid */}
            <div className="glass-card" style={{ overflow: "hidden", borderRadius: 20 }}>

              {/* Month Navigation */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "20px 24px",
                borderBottom: "1px solid var(--card-border)",
                background: "rgba(99, 115, 171, 0.03)"
              }}>
                <button onClick={prevMonth} style={{
                  background: "rgba(99,115,171,0.06)", border: "1px solid var(--card-border)",
                  borderRadius: 8, padding: "6px 10px", cursor: "pointer", color: "var(--text-secondary)",
                  display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 500,
                  transition: "all 0.2s"
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent-primary)"; e.currentTarget.style.color = "var(--accent-primary)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--card-border)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
                >
                  <ChevronLeftIcon /> {MONTH_NAMES[currentMonth === 0 ? 11 : currentMonth - 1]}
                </button>

                <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, letterSpacing: "-0.01em" }}>
                  {MONTH_NAMES[currentMonth]} {currentYear}
                </h2>

                <button onClick={nextMonth} style={{
                  background: "rgba(99,115,171,0.06)", border: "1px solid var(--card-border)",
                  borderRadius: 8, padding: "6px 10px", cursor: "pointer", color: "var(--text-secondary)",
                  display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 500,
                  transition: "all 0.2s"
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent-primary)"; e.currentTarget.style.color = "var(--accent-primary)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--card-border)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
                >
                  {MONTH_NAMES[currentMonth === 11 ? 0 : currentMonth + 1]} <ChevronRightIcon />
                </button>
              </div>

              {/* Day Headers */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: "1px solid var(--card-border)" }}>
                {DAY_NAMES.map((name, i) => (
                  <div key={name} style={{
                    padding: "12px 8px", textAlign: "center",
                    fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em",
                    color: i >= 5 ? "var(--accent-primary)" : "var(--text-tertiary)"
                  }}>
                    {name}
                  </div>
                ))}
              </div>

              {/* Calendar Grid Body */}
              {weeks.map((week, wi) => (
                <div key={wi} style={{
                  display: "grid", gridTemplateColumns: "repeat(7, 1fr)",
                  borderBottom: wi < weeks.length - 1 ? "1px solid var(--card-border)" : "none",
                  minHeight: 110
                }}>
                  {week.map((day, di) => {
                    if (day === null) {
                      return <div key={`empty-${di}`} style={{
                        borderRight: di < 6 ? "1px solid var(--card-border)" : "none",
                        background: "rgba(99, 115, 171, 0.015)"
                      }} />;
                    }

                    const key = makeDateKey(currentYear, currentMonth, day);
                    const dayReservations = reservationsByDate[key] || [];
                    const todayFlag = isToday(day);
                    const isSelected = selectedDate === key;
                    const hasItems = dayReservations.length > 0;

                    return (
                      <div
                        key={day}
                        onClick={() => handleDayClick(day)}
                        style={{
                          padding: "8px 10px",
                          borderRight: di < 6 ? "1px solid var(--card-border)" : "none",
                          cursor: "pointer",
                          transition: "background 0.15s",
                          background: isSelected ? "rgba(99, 102, 241, 0.06)" : "transparent",
                          position: "relative",
                        }}
                        onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "rgba(99, 115, 171, 0.04)"; }}
                        onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
                      >
                        {/* Day number */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{
                            display: "inline-flex", alignItems: "center", justifyContent: "center",
                            width: todayFlag ? 28 : "auto", height: todayFlag ? 28 : "auto",
                            borderRadius: todayFlag ? "50%" : 0,
                            background: todayFlag ? "var(--accent-primary)" : "transparent",
                            color: todayFlag ? "#fff" : (di >= 5 ? "var(--accent-primary)" : "var(--foreground)"),
                            fontSize: 13, fontWeight: todayFlag ? 700 : 500,
                          }}>
                            {day}
                          </span>
                          {hasItems && !todayFlag && (
                            <span style={{
                              width: 6, height: 6, borderRadius: "50%",
                              background: "var(--accent-primary)", opacity: 0.6, flexShrink: 0
                            }} />
                          )}
                        </div>

                        {/* Reservation previews */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          {dayReservations.slice(0, MAX_VISIBLE).map((r) => {
                            const colors = getStatusColor(r.status);
                            return (
                              <div key={r.id} style={{
                                display: "flex", alignItems: "center", gap: 4,
                                padding: "2px 6px", borderRadius: 4,
                                background: colors.bg, overflow: "hidden",
                              }}>
                                <span style={{
                                  width: 5, height: 5, borderRadius: "50%",
                                  background: colors.dot, flexShrink: 0
                                }} />
                                <span style={{
                                  fontSize: 10, fontWeight: 500, color: colors.text,
                                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                                  maxWidth: "100%"
                                }}>
                                  {r.customer_name}
                                </span>
                              </div>
                            );
                          })}
                          {dayReservations.length > MAX_VISIBLE && (
                            <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-tertiary)", paddingLeft: 6 }}>
                              +{dayReservations.length - MAX_VISIBLE} more
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}

              {/* Legend */}
              <div style={{
                padding: "14px 24px", borderTop: "1px solid var(--card-border)",
                display: "flex", gap: 20, flexWrap: "wrap",
                background: "rgba(99, 115, 171, 0.02)"
              }}>
                {Object.entries(STATUS_COLORS).map(([status, colors]) => (
                  <div key={status} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: colors.dot }} />
                    <span style={{ fontSize: 11, color: "var(--text-tertiary)", fontWeight: 500 }}>
                      {STATUS_LABELS[status] || status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Detail Panel */}
            {selectedDate && (
              <div className="glass-card" style={{
                borderRadius: 20, overflow: "hidden",
                position: "sticky", top: 32,
                animation: "slideUp 0.25s ease"
              }}>
                {/* Panel Header */}
                <div style={{
                  padding: "18px 20px", borderBottom: "1px solid var(--card-border)",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  background: "rgba(99, 115, 171, 0.03)"
                }}>
                  <div>
                    <p style={{ fontSize: 12, color: "var(--text-tertiary)", margin: 0, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Reservations
                    </p>
                    <p style={{ fontSize: 15, fontWeight: 700, margin: "2px 0 0 0" }}>
                      {formatFullDate(selectedDate)}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedDate(null)}
                    style={{
                      background: "rgba(99,115,171,0.08)", border: "none", borderRadius: 6,
                      width: 28, height: 28, cursor: "pointer", color: "var(--text-tertiary)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 16, transition: "all 0.2s"
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = "var(--foreground)"; e.currentTarget.style.background = "rgba(99,115,171,0.15)"; }}
                    onMouseLeave={e => { e.currentTarget.style.color = "var(--text-tertiary)"; e.currentTarget.style.background = "rgba(99,115,171,0.08)"; }}
                  >
                    ✕
                  </button>
                </div>

                {/* Reservations List */}
                <div style={{ padding: "12px 16px" }}>
                  {selectedReservations.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px 16px" }}>
                      <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
                      <p style={{ fontSize: 14, color: "var(--text-tertiary)", margin: 0, fontWeight: 500 }}>
                        No reservations on this date
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {selectedReservations.map((r) => {
                        const colors = getStatusColor(r.status);
                        return (
                          <div key={r.id} style={{
                            padding: "14px 16px", borderRadius: 12,
                            border: "1px solid var(--card-border)",
                            background: "rgba(99, 115, 171, 0.02)",
                            transition: "all 0.2s"
                          }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = colors.dot; e.currentTarget.style.background = colors.bg; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--card-border)"; e.currentTarget.style.background = "rgba(99, 115, 171, 0.02)"; }}
                          >
                            {/* Status badge + Time */}
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                              <span style={{
                                display: "inline-flex", alignItems: "center", gap: 5,
                                padding: "3px 8px", borderRadius: 6,
                                background: colors.bg, fontSize: 10, fontWeight: 600,
                                color: colors.text, textTransform: "uppercase", letterSpacing: "0.03em"
                              }}>
                                <span style={{ width: 6, height: 6, borderRadius: "50%", background: colors.dot }} />
                                {STATUS_LABELS[r.status] || r.status}
                              </span>
                              <span style={{ fontSize: 12, color: "var(--text-tertiary)", fontWeight: 600 }}>
                                {formatTime(r.start_time)}
                              </span>
                            </div>

                            {/* Customer Name */}
                            <h4 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 6px 0", color: "var(--foreground)" }}>
                              {r.customer_name}
                            </h4>

                            {/* Details grid */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, fontSize: 12 }}>
                              {r.customer_contact && (
                                <div>
                                  <span style={{ color: "var(--text-tertiary)" }}>Contact: </span>
                                  <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>{r.customer_contact}</span>
                                </div>
                              )}
                              {r.service_name && (
                                <div>
                                  <span style={{ color: "var(--text-tertiary)" }}>Service: </span>
                                  <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>{r.service_name}</span>
                                </div>
                              )}
                              {r.resource_name && (
                                <div>
                                  <span style={{ color: "var(--text-tertiary)" }}>Resource: </span>
                                  <span style={{ color: "var(--accent-primary)", fontWeight: 500 }}>{r.resource_name}</span>
                                </div>
                              )}
                            </div>

                            {/* Notes */}
                            {r.notes && (
                              <p style={{
                                margin: "8px 0 0 0", padding: "6px 10px",
                                background: "rgba(99,115,171,0.04)", borderRadius: 6,
                                fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.5,
                                fontStyle: "italic"
                              }}>
                                {r.notes}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
