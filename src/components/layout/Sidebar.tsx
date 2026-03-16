"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logout } from "@/app/actions/auth";
import ThemeToggle from "@/components/layout/ThemeToggle";
import { useState, useEffect } from "react";
import { 
  BotIcon, 
  UserIcon, 
  FaqIcon, 
  KnowledgeIcon, 
  ActionIcon,
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MenuIcon,
  CreditCardIcon,
  ChatIcon
} from "@/components/icons";

export default function Sidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved) setIsCollapsed(saved === "true");
    
    // Set mounted last to trigger hydration transition
    setIsMounted(true);
  }, []);

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("sidebar-collapsed", String(newState));
  };

  // Don't show sidebar on login page
  if (pathname === "/" || pathname === "/login") {
    return <>{children}</>;
  }

  // Prevent hydration mismatch for classes/styles that depend on localStorage
  if (!isMounted) return <div style={{ display: "flex", minHeight: "100vh" }}>{children}</div>;

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Failed to logout", error);
      setIsLoggingOut(false);
    }
  };

  const navItems = [
    { label: "Tenants", path: "/tenants", icon: BotIcon },
    { label: "Users", path: "/users", icon: UserIcon },
    { label: "FAQs", path: "/faqs", icon: FaqIcon },
    { label: "Knowledge", path: "/knowledge", icon: KnowledgeIcon },
    { label: "Actions", path: "/ai-actions", icon: ActionIcon },
    { label: "Templates", path: "/reservation-templates", icon: CalendarIcon },
    { label: "Reservations", path: "/reservations", icon: CalendarIcon },
    { label: "Chat", path: "/chat", icon: ChatIcon },
    { label: "Credits", path: "/credits", icon: CreditCardIcon },
  ];

  const sidebarWidth = isCollapsed ? 80 : 260;

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar Aside */}
      <aside
        style={{
          width: sidebarWidth,
          flexShrink: 0,
          background: "var(--card-bg)",
          borderRight: "1px solid var(--border-color)",
          display: "flex",
          flexDirection: "column",
          position: "sticky",
          top: 0,
          height: "100vh",
          padding: isCollapsed ? "24px 14px" : "24px 16px",
          transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1), padding 0.3s ease",
          zIndex: 100,
          overflowX: "hidden"
        }}
      >
        {/* Toggle Button Container - Refined Placement */}
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: isCollapsed ? "center" : "space-between", 
          paddingBottom: 32,
          borderBottom: isCollapsed ? "none" : "1px solid var(--border-color)",
          marginBottom: 24,
          minHeight: 48
        }}>
          {!isCollapsed && (
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
                <BotIcon />
              </div>
              <span style={{ fontWeight: 600, fontSize: 16, letterSpacing: "-0.01em" }}>
                AI Dashboard
              </span>
            </div>
          )}
          
          <button
            onClick={toggleSidebar}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            style={{
              background: "rgba(99, 115, 171, 0.04)",
              border: "1px solid var(--border-color)",
              color: "var(--text-tertiary)",
              padding: 6,
              borderRadius: 6,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--foreground)";
              e.currentTarget.style.background = "rgba(99, 115, 171, 0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--text-tertiary)";
              e.currentTarget.style.background = "rgba(99, 115, 171, 0.04)";
            }}
          >
            {isCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </button>
        </div>

        {/* Links */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
          {!isCollapsed && (
            <span style={{ padding: "0 8px", fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
              Main Menu
            </span>
          )}
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                href={item.path}
                title={isCollapsed ? item.label : ""}
                style={{
                  padding: "10px 12px",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 500,
                  color: isActive ? "var(--foreground)" : "var(--text-secondary)",
                  background: isActive ? "rgba(99, 115, 171, 0.08)" : "transparent",
                  transition: "all 0.2s",
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: isCollapsed ? "center" : "flex-start",
                  gap: 12,
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "rgba(99, 115, 171, 0.04)";
                    e.currentTarget.style.color = "var(--foreground)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--text-secondary)";
                  }
                }}
              >
                <div style={{ 
                  color: isActive ? "var(--accent-primary)" : "inherit",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <Icon />
                </div>
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </div>

        {/* Footer (Theme, Logout) */}
        <div style={{ 
          display: "flex", 
          flexDirection: "column", 
          gap: 16, 
          marginTop: "auto", 
          borderTop: "1px solid var(--border-color)", 
          paddingTop: 24, 
          paddingLeft: isCollapsed ? 0 : 8, 
          paddingRight: isCollapsed ? 0 : 8,
          alignItems: isCollapsed ? "center" : "stretch"
        }}>
          {!isCollapsed ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 14, color: "var(--text-secondary)", fontWeight: 500 }}>Theme</span>
              <ThemeToggle />
            </div>
          ) : (
            <div style={{ transform: "scale(0.8)" }}>
              <ThemeToggle />
            </div>
          )}

          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            title={isCollapsed ? "Logout" : ""}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: isCollapsed ? "10px" : "10px 16px",
              borderRadius: 8,
              border: "1px solid var(--border-color)",
              background: "transparent",
              color: "var(--text-secondary)",
              fontSize: 14,
              fontWeight: 500,
              cursor: isLoggingOut ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              opacity: isLoggingOut ? 0.7 : 1,
              width: "100%",
            }}
            onMouseEnter={(e) => {
              if (!isLoggingOut) {
                e.currentTarget.style.color = "var(--accent-red)";
                e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.2)";
                e.currentTarget.style.background = "var(--accent-red-bg)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoggingOut) {
                e.currentTarget.style.color = "var(--text-secondary)";
                e.currentTarget.style.borderColor = "var(--border-color)";
                e.currentTarget.style.background = "transparent";
              }
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            {!isCollapsed && (isLoggingOut ? "Logging out..." : "Logout")}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ 
        flex: 1, 
        minWidth: 0, 
        display: "flex", 
        flexDirection: "column",
        transition: "margin 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      }}>
        {children}
      </main>
    </div>
  );
}

