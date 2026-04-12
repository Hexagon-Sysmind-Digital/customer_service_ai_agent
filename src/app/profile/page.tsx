"use client";

import { useState, useEffect, FormEvent } from "react";
import { getMe, updateProfile } from "@/app/actions/auth";
import { User } from "@/types";
import { formatDate } from "@/lib/utils";
import { UserIcon, CalendarIcon, ShieldIcon, MailIcon, BadgeIcon, EditIcon, GlobeIcon, CheckIcon, ChatIcon, ActionIcon } from "@/components/icons";
import { showToast } from "@/lib/swal";
import { createPersonality, getPersonalities, activatePersonality, updatePersonality, deletePersonality } from "@/app/actions/personalitiesApi";
import PageHeader from "@/components/ui/PageHeader";

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Personality CRUD States
  const [personalities, setPersonalities] = useState<any[]>([]);
  const [activePersonality, setActivePersonality] = useState<any>(null);
  const [isSavingPersonality, setIsSavingPersonality] = useState(false);
  const [isPersonalityModalOpen, setIsPersonalityModalOpen] = useState(false);
  const [editingPersonality, setEditingPersonality] = useState<any>(null);

  useEffect(() => {
    fetchUser();
    fetchPersonalities();
  }, []);

  const fetchPersonalities = async () => {
    const res = await getPersonalities();
    if (res.success && res.data) {
      const pData = Array.isArray(res.data) ? res.data : [res.data];
      setPersonalities(pData);
      const active = pData.find((p: any) => p && p.is_active);
      if (active) {
        setActivePersonality(active);
      } else {
        setActivePersonality(null);
      }
    }
  };

  const handleActivate = async (id: string) => {
    setIsSavingPersonality(true);
    try {
      const actRes = await activatePersonality(id);
      if (actRes.success) {
        showToast("success", "AI Personality activated!");
        fetchPersonalities();
      } else {
        showToast("error", actRes.error || "Failed to activate personality");
      }
    } catch (err) {
      showToast("error", "An unexpected error occurred");
    } finally {
      setIsSavingPersonality(false);
    }
  };

  const handleDeletePersonality = async (id: string) => {
    if (!confirm("Are you sure you want to delete this personality?")) return;
    setIsSavingPersonality(true);
    try {
      const delRes = await deletePersonality(id);
      if (delRes.success) {
        showToast("success", "AI Personality deleted!");
        fetchPersonalities();
      } else {
        showToast("error", delRes.error || "Failed to delete personality");
      }
    } catch (err) {
      showToast("error", "An unexpected error occurred");
    } finally {
      setIsSavingPersonality(false);
    }
  };

  const handleOpenPersonalityModal = (personality?: any) => {
    setEditingPersonality(personality || null);
    setIsPersonalityModalOpen(true);
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
              <h2 style={{ fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: "-0.03em" }}>AI Personality</h2>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent-primary)" }} />
            </div>
            <button 
              className="btn-primary" 
              onClick={() => handleOpenPersonalityModal()}
              style={{ padding: "10px 18px", fontSize: 14 }}
            >
              + Custom Personality
            </button>
          </div>
          <p style={{ fontSize: 16, color: "var(--text-secondary)", marginTop: -16, marginBottom: 32 }}>Create and manage custom personas to define how your AI agent converses with customers.</p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
            {personalities.length === 0 ? (
               <div style={{ padding: 40, textAlign: "center", background: "var(--card-bg)", borderRadius: 20, border: "1px dashed var(--border-color)", gridColumn: "1 / -1" }}>
                  <p style={{ color: "var(--text-tertiary)", margin: 0 }}>No personalities found. Create one to get started.</p>
               </div>
            ) : (
              personalities.map((p) => (
                <div key={p.id} className="glass-card" style={{ padding: 24, position: "relative", border: p.is_active ? "2px solid var(--accent-primary)" : "1px solid var(--border-color)" }}>
                  {p.is_active && (
                    <div style={{ position: "absolute", top: -12, right: 20, background: "var(--accent-primary)", color: "#fff", padding: "4px 12px", borderRadius: 12, fontSize: 11, fontWeight: 800, textTransform: "uppercase", boxShadow: "0 4px 10px rgba(99,102,241,0.4)" }}>
                      Live Active
                    </div>
                  )}
                  <h3 style={{ margin: "0 0 12px", fontSize: 18, color: "var(--foreground)" }}>{p.name}</h3>
                  <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                     <span className="badge" style={{ fontSize: 11, background: "rgba(99,102,241,0.1)", color: "#818cf8" }}>{p.tone}</span>
                     <span className="badge" style={{ fontSize: 11, background: "rgba(34,197,94,0.1)", color: "#22c55e" }}>{p.language}</span>
                  </div>
                  <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, minHeight: 60, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden", margin: 0 }}>{p.instructions}</p>
                  
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--border-color)" }}>
                    <div style={{ display: "flex", gap: 12 }}>
                      <button onClick={() => handleOpenPersonalityModal(p)} style={{ background: "none", border: "none", color: "var(--text-tertiary)", cursor: "pointer", display: "flex", alignItems: "center" }}><EditIcon size={18} /></button>
                      <button onClick={() => handleDeletePersonality(p.id)} style={{ background: "none", border: "none", color: "var(--accent-red)", cursor: "pointer", display: "flex", alignItems: "center" }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      </button>
                    </div>
                    {!p.is_active && (
                       <button 
                         onClick={() => handleActivate(p.id)} 
                         disabled={isSavingPersonality}
                         style={{ background: "var(--input-bg)", border: "1px solid var(--border-color)", padding: "8px 16px", borderRadius: 8, color: "var(--foreground)", fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "0.2s" }}
                         onMouseEnter={(e) => { e.currentTarget.style.background = "var(--background)" }}
                         onMouseLeave={(e) => { e.currentTarget.style.background = "var(--input-bg)" }}
                       >
                         {isSavingPersonality ? "..." : "Activate Now"}
                       </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
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

      {isPersonalityModalOpen && (
        <PersonalityModal 
          personality={editingPersonality}
          onClose={() => setIsPersonalityModalOpen(false)}
          onSuccess={() => {
            setIsPersonalityModalOpen(false);
            fetchPersonalities();
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

function PersonalityModal({ personality, onClose, onSuccess }: { personality?: any, onClose: () => void, onSuccess: () => void }) {
  const [name, setName] = useState(personality?.name || "");
  const [tone, setTone] = useState(personality?.tone || "");
  const [language, setLanguage] = useState(personality?.language || "");
  const [instructions, setInstructions] = useState(personality?.instructions || "");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { name, tone, language, instructions };
      
      let res;
      if (personality?.id) {
        res = await updatePersonality(personality.id, payload);
      } else {
        res = await createPersonality(payload);
      }

      if (res.success) {
        showToast("success", `Personality ${personality?.id ? 'updated' : 'created'} successfully`);
        onSuccess();
      } else {
        showToast("error", res.error || "Failed to save personality");
      }
    } catch (err) {
      showToast("error", "An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content glass-card" style={{ maxWidth: 550, padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "24px 32px", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{personality?.id ? "Edit Personality" : "Create New Personality"}</h2>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-tertiary)", cursor: "pointer", fontSize: 20 }}>✕</button>
        </div>
        
        <form onSubmit={handleSubmit} style={{ padding: "32px", display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Profile Name</label>
              <input 
                className="input-field" 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="e.g. Gen-Z Vibes"
                required 
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Tone</label>
              <input 
                className="input-field" 
                type="text" 
                value={tone} 
                onChange={(e) => setTone(e.target.value)} 
                placeholder="e.g. Playful, Warm"
                required 
              />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Language</label>
            <input 
              className="input-field" 
              type="text" 
              value={language} 
              onChange={(e) => setLanguage(e.target.value)} 
              placeholder="e.g. Bahasa gaul, English"
              required 
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Core Instructions</label>
            <textarea 
              className="input-field" 
              value={instructions} 
              onChange={(e) => setInstructions(e.target.value)} 
              placeholder="Explain how the AI should behave..."
              rows={4}
              required 
            />
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
            <button type="button" className="btn-secondary" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={submitting} style={{ flex: 1 }}>
              {submitting ? "Saving..." : "Save Personality"}
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
