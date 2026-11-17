import React, { useState, useEffect, useRef, useCallback } from "react";
import api from "../../utils/central"; // adjust path as needed
import styles from "../../css/Rehab/TakeAssessment.module.css";

interface SmartTextAreaProps {
  value: string | number;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  /**
   * Short human-readable description of what this field represents
   * (e.g. "General Clinical Notes" or the question title). Sent to the
   * backend alongside the typed text so the AI knows what it's
   * suggesting for instead of guessing from a bare fragment of text.
   */
  context?: string;
}

export default function SmartTextArea({
  value,
  onChange,
  placeholder,
  className,
  id,
  context,
}: SmartTextAreaProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [rewrite, setRewrite] = useState<string>("");
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [isFocused, setIsFocused] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Safely cast to string to prevent crashes on numeric/null values
  const safeValue = typeof value === "string" ? value : String(value ?? "");

  useEffect(() => {
    setSuggestions([]);
    setRewrite("");
    setSelectedIndex(-1);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = safeValue.trim();
    // Skip very short input and sentences that already look finished
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
      textareaRef.current?.focus();
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
    textareaRef.current?.focus();
  }, [rewrite, onChange]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // If we have suggestions, hijack the arrow keys to navigate the bubbles
    if (suggestions.length > 0) {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0,
        );
        return;
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1,
        );
        return;
      } else if (e.key === "Enter" || e.key === "Tab") {
        if (selectedIndex >= 0) {
          e.preventDefault();
          acceptSuggestion(suggestions[selectedIndex]);
          return;
        } else if (e.key === "Tab" && suggestions.length > 0) {
          // Default to the first option if they just hit Tab
          e.preventDefault();
          acceptSuggestion(suggestions[0]);
          return;
        }
      } else if (e.key === "Escape") {
        setSuggestions([]);
        setRewrite("");
        setSelectedIndex(-1);
        return;
      }
    }
  };

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <textarea
        ref={textareaRef}
        id={id}
        value={safeValue}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          // Slight delay so the bubbles don't instantly hide on blur
          setTimeout(() => setIsFocused(false), 200);
        }}
        onKeyDown={handleKeyDown}
        className={className || styles.textareaCompose}
        placeholder={placeholder}
        style={{ width: "100%", minHeight: "120px", resize: "vertical" }}
      />

      {/* REWRITE SUGGESTION (full-text grammar/spelling fix) */}
      {isFocused && showRewrite && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            right: 0,
            zIndex: 51,
          }}
        >
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              acceptRewrite();
            }}
            title={rewrite}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              width: "100%",
              textAlign: "left",
              padding: "8px 14px",
              backgroundColor: "#f5f3ff",
              color: "#5b21b6",
              border: "1px dashed #a78bfa",
              borderRadius: "10px",
              fontSize: "0.85rem",
              cursor: "pointer",
              boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.08)",
            }}
          >
            <span style={{ fontSize: "1rem", flexShrink: 0 }}>✨</span>
            <span style={{ fontWeight: 600, flexShrink: 0 }}>
              Fix grammar &amp; spelling:
            </span>
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontWeight: 400,
                opacity: 0.85,
              }}
            >
              {rewrite}
            </span>
          </button>
        </div>
      )}

      {/* SMART BUBBLES MENU */}
      {isFocused && suggestions.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: showRewrite ? "calc(100% + 48px)" : "calc(100% + 8px)", // Push down below the rewrite pill when present
            left: 0,
            right: 0,
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
            zIndex: 50,
          }}
        >
          {suggestions.map((sug, idx) => {
            const isSelected = selectedIndex === idx;
            return (
              <button
                type="button"
                key={idx}
                // Use onMouseDown + preventDefault so the textarea doesn't lose focus
                onMouseDown={(e) => {
                  e.preventDefault();
                  acceptSuggestion(sug);
                }}
                onMouseEnter={() => setSelectedIndex(idx)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "6px 14px",
                  backgroundColor: isSelected ? "#02525f" : "#ffffff",
                  color: isSelected ? "#ffffff" : "#475569",
                  border: isSelected
                    ? "1px solid #02525f"
                    : "1px solid #cbd5e1",
                  borderRadius: "9999px", // Pill shape
                  fontSize: "0.85rem",
                  fontWeight: 500,
                  cursor: "pointer",
                  boxShadow: isSelected
                    ? "0 4px 6px -1px rgba(2, 82, 95, 0.2)"
                    : "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
                  transition: "all 0.2s ease-in-out",
                  outline: "none",
                }}
              >
                <span
                  style={{
                    opacity: isSelected ? 0.8 : 0.5,
                    fontSize: "1rem",
                    lineHeight: 1,
                  }}
                >
                  +
                </span>
                {needsSpace ? " " : ""}
                {sug}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
