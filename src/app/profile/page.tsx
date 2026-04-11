"use client";

import { useState, useEffect, FormEvent } from "react";
import { getMe, updateProfile } from "@/app/actions/auth";
import { User } from "@/types";
import { formatDate } from "@/lib/utils";
import { UserIcon, CalendarIcon, ShieldIcon, MailIcon, BadgeIcon, EditIcon, GlobeIcon, CheckIcon, ChatIcon, ActionIcon } from "@/components/icons";
import { showToast } from "@/lib/swal";
import { getActivePersonality, applyPresetPersonality } from "@/app/actions/personalitiesApi";
import PageHeader from "@/components/ui/PageHeader";

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activePersonality, setActivePersonality] = useState<any>(null);
  const [isSavingPersonality, setIsSavingPersonality] = useState(false);

  useEffect(() => {
    fetchUser();
    fetchActivePersonality();
  }, []);

  const fetchActivePersonality = async () => {
    const res = await getActivePersonality();
    if (res.success) {
      setActivePersonality(res.data);
    }
  };

  const handleApplyPreset = async (presetName: string) => {
    setIsSavingPersonality(true);
    try {
      const res = await applyPresetPersonality(presetName);
      if (res.success) {
        showToast("success", `AI Personality updated to ${res.data.name}`);
        setActivePersonality(res.data);
      } else {
        showToast("error", res.error || "Failed to update personality");
      }
    } catch (err) {
      showToast("error", "An unexpected error occurred");
    } finally {
      setIsSavingPersonality(false);
    }
  };

  const fetchUser = async () => {
    try {
      setLoading(true);
      const res = await getMe();
      if (res.success) {
        setUser(res.data);
      } else {
        setError(res.error || "Failed to fetch profile");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !user) {
    return (
      <div style={{ minHeight: "100vh", padding: "40px 24px", display: "flex", justifyContent: "center" }}>
        <div style={{ maxWidth: 800, width: "100%" }}>
          <div className="skeleton" style={{ height: 200, borderRadius: 24, marginBottom: 24 }} />
          <div className="skeleton" style={{ height: 400, borderRadius: 24 }} />
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div style={{ minHeight: "100vh", padding: "40px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 400, margin: "0 auto", padding: 40 }} className="glass-card">
          <p style={{ color: "var(--accent-red)", marginBottom: 20 }}>⚠️ {error || "Profile not found"}</p>
          <button className="btn-primary" onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", padding: "40px 24px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {/* Header Section */}
        <PageHeader 
          title="My Profile" 
          description="Manage and view your account information and AI agent preferences."
          action={
            <button 
              className="btn-secondary" 
              onClick={() => setIsEditModalOpen(true)}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px" }}
            >
              <EditIcon />
              Edit Profile
            </button>
          }
        />

        {/* Profile Card */}
        <div className="group" style={{ position: "relative" }}>
          {/* Background Decorative Element */}
          <div style={{
            position: "absolute",
            top: -20,
            right: -20,
            width: 200,
            height: 200,
            background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)",
            filter: "blur(80px)",
            opacity: 0.1,
            zIndex: -1
          }} />

          <div className="glass-card" style={{ padding: 0, overflow: "hidden", border: "1px solid var(--border-color)" }}>
            {/* Cover image area */}
            <div style={{
              height: 160,
              background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
              position: "relative"
            }}>
               <div style={{
                 position: "absolute",
                 bottom: -50,
                 left: 40,
                 width: 120,
                 height: 120,
                 borderRadius: 32,
                 background: "var(--card-bg)",
                 border: "6px solid var(--card-bg)",
                 display: "flex",
                 alignItems: "center",
                 justifyContent: "center",
                 boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)",
                 overflow: "hidden"
               }}>
                 <div style={{
                   width: "100%",
                   height: "100%",
                   background: "linear-gradient(135deg, rgba(99,102,241,0.1), rgba(168,85,247,0.1))",
                   display: "flex",
                   alignItems: "center",
                   justifyContent: "center",
                   fontSize: 48,
                   fontWeight: 700,
                   color: "var(--accent-primary)"
                 }}>
                   {user.name?.charAt(0) || "U"}
                 </div>
               </div>
            </div>

            <div style={{ padding: "70px 40px 40px 40px" }}>
               <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 20 }}>
                  <div>
                    <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>{user.name}</h2>
                    <p style={{ fontSize: 16, color: "var(--text-secondary)", margin: "4px 0 0 0", display: "flex", alignItems: "center", gap: 8 }}>
                      <MailIcon /> {user.email}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: 12 }}>
                    <span className="badge badge-active" style={{ fontSize: 14, padding: "6px 16px" }}>
                      {user.role}
                    </span>
                    <span className="badge" style={{ 
                      fontSize: 14, 
                      padding: "6px 16px",
                      background: user.is_active ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)",
                      color: user.is_active ? "#22c55e" : "#ef4444" 
                    }}>
                      {user.is_active ? "Active Account" : "Inactive Account"}
                    </span>
                  </div>
               </div>

               <div style={{ 
                 marginTop: 40, 
                 display: "grid", 
                 gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", 
                 gap: 24,
                 paddingTop: 32,
                 borderTop: "1px solid var(--border-color)"
               }}>
                  <InfoItem 
                    icon={<BadgeIcon />} 
                    label="User ID" 
                    value={user.id} 
                  />
                  <InfoItem 
                    icon={<CalendarIcon />} 
                    label="Member Since" 
                    value={user.created_at ? formatDate(user.created_at) : "-"} 
                  />
                  <InfoItem 
                    icon={<ShieldIcon />} 
                    label="Account Access" 
                    value={user.role === "admin" ? "Full Administrative Access" : "Standard User Access"} 
                  />
               </div>
            </div>
          </div>
        </div>

        {/* AI Personality Section */}
        <div style={{ marginTop: 48 }}>
          <div style={{ marginBottom: 24, display: "flex", alignItems: "baseline", gap: 12 }}>
            <h2 style={{ fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: "-0.03em" }}>AI Personality</h2>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent-primary)" }} />
          </div>
          <p style={{ fontSize: 16, color: "var(--text-secondary)", marginTop: -16, marginBottom: 32 }}>Choose a preset to define how your AI agent should converse with customers.</p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
            <PersonalityCard 
              name="Profesional" 
              presetId="profesional"
              description="Formal, sopan (Saya/Anda), dan sangat efisien dalam memberikan informasi." 
              icon={<BadgeIcon size={24} />}
              isActive={activePersonality?.name?.toLowerCase() === "profesional"}
              loading={isSavingPersonality}
              onSelect={handleApplyPreset}
            />
            <PersonalityCard 
              name="Friendly" 
              presetId="friendly"
              description="Ramah, ceria, menggunakan emoji yang pas, dan bahasa yang santai tapi tetap sopan." 
              icon={<ChatIcon size={24} />}
              isActive={activePersonality?.name?.toLowerCase() === "friendly"}
              loading={isSavingPersonality}
              onSelect={handleApplyPreset}
            />
            <PersonalityCard 
              name="Concise" 
              presetId="concise"
              description="To the point, sangat singkat, dan hanya memberikan fakta yang diperlukan." 
              icon={<ActionIcon size={24} />}
              isActive={activePersonality?.name?.toLowerCase() === "concise"}
              loading={isSavingPersonality}
              onSelect={handleApplyPreset}
            />
          </div>

          {activePersonality && (
            <div className="glass-card" style={{ marginTop: 32, padding: "24px", background: "rgba(99, 102, 241, 0.03)", border: "1px solid rgba(99, 102, 241, 0.1)", borderRadius: 20 }}>
              <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
                <div style={{ 
                  width: 40, height: 40, borderRadius: 12, background: "var(--accent-primary)", 
                  display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0,
                  boxShadow: "0 10px 20px -5px rgba(99, 102, 241, 0.3)"
                }}>
                  <GlobeIcon size={20} />
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Active Instructions</h4>
                    <span style={{ fontSize: 11, fontWeight: 800, color: "var(--accent-primary)", background: "rgba(99, 102, 241, 0.1)", padding: "2px 8px", borderRadius: 6 }}>LIVE</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>{activePersonality.instructions}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {isEditModalOpen && (
        <EditProfileModal 
          user={user} 
          onClose={() => setIsEditModalOpen(false)} 
          onSuccess={() => {
            setIsEditModalOpen(false);
            fetchUser();
          }} 
        />
      )}
    </div>
  );
}

function EditProfileModal({ user, onClose, onSuccess }: { user: User, onClose: () => void, onSuccess: () => void }) {
  const [name, setName] = useState(user.name || "");
  const [email, setEmail] = useState(user.email || "");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload: any = { name, email };
      if (password) payload.password = password;

      const res = await updateProfile(payload);
      if (res.success) {
        showToast("success", "Profile updated successfully");
        onSuccess();
      } else {
        showToast("error", res.error || "Failed to update profile");
      }
    } catch (err) {
      showToast("error", "An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content glass-card" style={{ maxWidth: 450, padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "24px 32px", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Edit Profile</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-tertiary)", cursor: "pointer", fontSize: 20 }}>✕</button>
        </div>
        
        <form onSubmit={handleSubmit} style={{ padding: "32px", display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Full Name</label>
            <input 
              className="input-field" 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="John Doe"
              required 
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Email Address</label>
            <input 
              className="input-field" 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="john@example.com"
              required 
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Password</label>
            <input 
              className="input-field" 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="Leave blank to keep current" 
            />
            <p style={{ fontSize: 12, color: "var(--text-tertiary)", margin: 0 }}>Only fill this if you want to change your password.</p>
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
            <button type="button" className="btn-secondary" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={submitting} style={{ flex: 1 }}>
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
      <div style={{ 
        width: 40, 
        height: 40, 
        borderRadius: 12, 
        background: "rgba(99, 115, 171, 0.05)", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        color: "var(--accent-primary)",
        flexShrink: 0
      }}>
        {icon}
      </div>
      <div>
        <p style={{ 
          fontSize: 12, 
          color: "var(--text-tertiary)", 
          textTransform: "uppercase", 
          letterSpacing: "0.05em", 
          fontWeight: 600,
          margin: "0 0 4px 0"
        }}>
          {label}
        </p>
        <p style={{ 
          fontSize: 15, 
          color: "var(--foreground)", 
          fontWeight: 500,
          margin: 0
        }}>
          {value}
        </p>
      </div>
    </div>
  );
}

function PersonalityCard({ name, presetId, description, icon, isActive, loading, onSelect }: { 
  name: string, 
  presetId: string,
  description: string, 
  icon: React.ReactNode, 
  isActive: boolean,
  loading: boolean,
  onSelect: (id: string) => void 
}) {
  return (
    <div 
      onClick={() => !isActive && !loading && onSelect(presetId)}
      className="glass-card"
      style={{
        padding: 24,
        cursor: isActive || loading ? "default" : "pointer",
        border: isActive ? "2px solid var(--accent-primary)" : "1px solid var(--border-color)",
        background: isActive ? "rgba(99, 102, 241, 0.04)" : "var(--card-bg)",
        transition: "all 0.2s ease",
        opacity: loading && !isActive ? 0.6 : 1,
        position: "relative",
        overflow: "hidden"
      }}
    >
      {isActive && (
        <div style={{
          position: "absolute",
          top: 12,
          right: 12,
          background: "var(--accent-primary)",
          color: "#fff",
          width: 24,
          height: 24,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 10px rgba(99, 102, 241, 0.3)"
        }}>
          <CheckIcon size={14} />
        </div>
      )}

      <div style={{ 
        width: 48, 
        height: 48, 
        borderRadius: 14, 
        background: isActive ? "var(--accent-primary)" : "rgba(99, 115, 171, 0.06)",
        color: isActive ? "#fff" : "var(--accent-primary)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20,
        transition: "all 0.3s ease"
      }}>
        {icon}
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 8px 0" }}>{name}</h3>
      <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>{description}</p>
      
      {!isActive && (
        <div style={{ marginTop: 20, fontSize: 12, fontWeight: 700, color: "var(--accent-primary)", opacity: 0, transition: "opacity 0.2s" }} className="card-apply-label">
          CLICK TO APPLY →
        </div>
      )}

      <style jsx>{`
        div:hover .card-apply-label {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
}
