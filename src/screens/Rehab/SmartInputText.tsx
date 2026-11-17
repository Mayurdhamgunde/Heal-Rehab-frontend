import React, { useState, useEffect, useRef, useCallback } from "react";
import api from "../../utils/central"; // adjust path as needed

interface SmartTextInputProps {
  value: string | number;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  /**
   * Short human-readable description of what this field represents
   * (e.g. the question title, or "Table: ROM Assessment | Row: Left Knee
   * | Column: Flexion (deg)"). Sent to the backend alongside the typed
   * text so the AI knows what it's suggesting for instead of guessing
   * from a bare fragment of text.
   */
  context?: string;
  /**
   * Use this for inputs that sit inline inside running text (e.g. a
   * fill-in-the-blank sentence) instead of standalone form fields. Keeps
   * the wrapper as an inline-block sized to its className/content rather
   * than forcing block layout + 100% width.
   */
  inline?: boolean;
}

export default function SmartTextInput({
  value,
  onChange,
  placeholder,
  className,
  context,
  inline = false,
}: SmartTextInputProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [rewrite, setRewrite] = useState<string>("");
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [isFocused, setIsFocused] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Safely cast to string to prevent crashes on numeric/null values
  const safeValue = typeof value === "string" ? value : String(value ?? "");

  useEffect(() => {
    setSuggestions([]);
    setRewrite("");
    setSelectedIndex(-1);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = safeValue.trim();
    if (trimmed.length < 4 || /[.!?]\s*$/.test(safeValue)) return;

    debounceRef.current = setTimeout(async () => {
      const requestId = ++requestIdRef.current;
      try {
        const res = await api.post("/auto/complete", {
          text: safeValue,
          context, // e.g. question title, or table row/column context
        });
        if (requestId === requestIdRef.current) {
          // Expecting { suggestions: string[], rewrite: string }
          setSuggestions(res.data?.suggestions || []);
          setRewrite(res.data?.rewrite || "");
        }
      } catch (err) {
        if (requestId === requestIdRef.current) {
          setSuggestions([]);
          setRewrite("");
        }
      }
    }, 750); // Kept at 750ms to respect rate limits

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [safeValue, context]);

  const needsSpace = safeValue.length > 0 && !/\s$/.test(safeValue);

  const acceptSuggestion = useCallback(
    (suggestionToAccept: string) => {
      if (!suggestionToAccept) return;
      onChange(safeValue + (needsSpace ? " " : "") + suggestionToAccept);
      setSuggestions([]);
      setRewrite("");
      setSelectedIndex(-1);
      inputRef.current?.focus();
    },
    [needsSpace, safeValue, onChange],
  );

  // Only worth showing if it's non-empty and actually differs from the current text
  const showRewrite =
    !!rewrite.trim() &&
    rewrite.trim().toLowerCase() !== safeValue.trim().toLowerCase();

  const acceptRewrite = useCallback(() => {
    if (!rewrite.trim()) return;
    onChange(rewrite); // Full replace, not an append
    setSuggestions([]);
    setRewrite("");
    setSelectedIndex(-1);
    inputRef.current?.focus();
  }, [rewrite, onChange]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : 0,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev > 0 ? prev - 1 : suggestions.length - 1,
      );
    } else if (e.key === "Enter" || e.key === "Tab") {
      if (selectedIndex >= 0) {
        e.preventDefault();
        acceptSuggestion(suggestions[selectedIndex]);
      } else if (e.key === "Tab" && suggestions.length > 0) {
        // Default to the first option if they just hit Tab
        e.preventDefault();
        acceptSuggestion(suggestions[0]);
      }
    } else if (e.key === "Escape") {
      setSuggestions([]);
      setRewrite("");
      setSelectedIndex(-1);
    }
  };

  return (
    <div
      style={{
        position: "relative",
        display: inline ? "inline-block" : "block",
        width: inline ? "auto" : "100%",
        verticalAlign: inline ? "middle" : undefined,
      }}
    >
      <input
        ref={inputRef}
        type="text"
        value={safeValue}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          // Slight delay so clicking a suggestion doesn't instantly hide it
          setTimeout(() => setIsFocused(false), 150);
        }}
        onKeyDown={handleKeyDown}
        className={className}
        placeholder={placeholder}
        style={inline ? undefined : { width: "100%" }}
      />

      {/* DROPDOWN MENU */}
      {isFocused && (showRewrite || suggestions.length > 0) && (
        <ul
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: inline ? undefined : 0,
            minWidth: inline ? "220px" : undefined,
            background: "white",
            border: "1px solid #cbd5e1",
            borderRadius: "0.5rem",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            margin: "4px 0 0 0",
            padding: "0.25rem",
            listStyle: "none",
            zIndex: 50,
          }}
        >
          {showRewrite && (
            <li
              onMouseDown={(e) => {
                e.preventDefault();
                acceptRewrite();
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 12px",
                cursor: "pointer",
                borderRadius: "0.25rem",
                fontSize: "0.85rem",
                color: "#5b21b6",
                backgroundColor: "#f5f3ff",
                border: "1px dashed #a78bfa",
                marginBottom: "4px",
              }}
              title={rewrite}
            >
              <span>✨</span>
              <span style={{ fontWeight: 600, flexShrink: 0 }}>
                Fix grammar &amp; spelling:
              </span>
              <span
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  opacity: 0.85,
                }}
              >
                {rewrite}
              </span>
            </li>
          )}
          {suggestions.map((sug, idx) => (
            <li
              key={idx}
              onMouseDown={(e) => {
                e.preventDefault();
                acceptSuggestion(sug);
              }}
              onMouseEnter={() => setSelectedIndex(idx)}
              style={{
                padding: "8px 12px",
                cursor: "pointer",
                borderRadius: "0.25rem",
                fontSize: "0.85rem",
                color: "#334155",
                backgroundColor:
                  selectedIndex === idx ? "#e2e8f0" : "transparent",
              }}
            >
              <span style={{ opacity: 0.5 }}>{safeValue}</span>
              <span style={{ fontWeight: 600, color: "#02525f" }}>
                {needsSpace ? " " : ""}
                {sug}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
