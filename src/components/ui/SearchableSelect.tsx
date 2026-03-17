"use client";

import { useState, useEffect, useRef } from "react";

interface Option {
  id: string;
  name: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onSelect: (id: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  loading?: boolean;
  label?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
}

export default function SearchableSelect({ 
  options, 
  value, 
  onSelect, 
  placeholder = "Select option", 
  searchPlaceholder = "Search...", 
  loading = false,
  disabled = false,
  label,
  style
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.id === value);

  const filteredOptions = options.filter(o => 
    o.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, ...style }}>
      {label && (
        <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>
          {label}
        </label>
      )}
      
      <div ref={dropdownRef} style={{ position: "relative", width: "100%" }}>
        <div
          onClick={() => !loading && !disabled && setIsOpen(!isOpen)}
          className="form-input"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: (loading || disabled) ? "not-allowed" : "pointer",
            background: "var(--background)",
            borderColor: isOpen ? "var(--accent-primary)" : "var(--card-border)",
            minHeight: "42px",
            paddingRight: "12px",
            opacity: (loading || disabled) ? 0.6 : 1
          }}
        >
          <span style={{ 
            fontSize: 14, 
            color: selectedOption ? "var(--foreground)" : "var(--text-tertiary)",
            fontWeight: 500,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap"
          }}>
            {loading ? "Loading..." : (selectedOption?.name || placeholder)}
          </span>
          <svg 
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            style={{ 
              transition: "transform 0.2s",
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
              color: "var(--text-tertiary)"
            }}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>

        {isOpen && (
          <div style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            right: 0,
            background: "var(--modal-bg)",
            border: "1px solid var(--card-border)",
            borderRadius: "12px",
            zIndex: 100,
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2)",
            backdropFilter: "blur(12px)",
            overflow: "hidden",
            animation: "slideUp 0.15s ease-out"
          }}>
            <div style={{ padding: "8px", borderBottom: "1px solid var(--border-color)" }}>
              <input
                type="text"
                autoFocus
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  background: "rgba(99, 115, 171, 0.04)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "8px",
                  fontSize: 13,
                  color: "var(--foreground)",
                  outline: "none"
                }}
              />
            </div>
            <div style={{ maxHeight: "200px", overflowY: "auto" }}>
              {filteredOptions.length > 0 ? (
                filteredOptions.map(o => (
                  <div
                    key={o.id}
                    onClick={() => {
                      onSelect(o.id);
                      setIsOpen(false);
                      setSearch("");
                    }}
                    style={{
                      padding: "10px 16px",
                      cursor: "pointer",
                      fontSize: 14,
                      transition: "all 0.1s",
                      background: value === o.id ? "var(--accent-primary-bg)" : "transparent",
                      color: value === o.id ? "var(--accent-primary)" : "var(--foreground)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between"
                    }}
                    onMouseEnter={(e) => {
                      if (value !== o.id) e.currentTarget.style.background = "rgba(99, 115, 171, 0.05)";
                    }}
                    onMouseLeave={(e) => {
                      if (value !== o.id) e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <span style={{ fontWeight: value === o.id ? 600 : 400 }}>{o.name}</span>
                    {value === o.id && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    )}
                  </div>
                ))
              ) : (
                <div style={{ padding: "16px", textAlign: "center", color: "var(--text-tertiary)", fontSize: 13 }}>
                  No results found
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
