import React, { useState, useEffect, useRef } from "react";
import styles from "../css/PartnerComponents.module.css";
import api from "../utils/central";
import { FiPlus } from "react-icons/fi";
import CreatePartnerModal from "./CreatePartnerModal";

interface Partner {
  _id: string;
  partner_name: string;
  billing_address?: {
    street: string;
    city: string;
    state: string;
  };
  gstin?: string;
}

interface Props {
  value: string; // Current name to display
  onChange: (name: string, partnerData?: Partner | null) => void; // Pass back name + full obj
}

const PartnerSearchDropdown: React.FC<Props> = ({ value, onChange }) => {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<Partner[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);

  // Sync internal state if parent updates value manually
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Handle outside click to close dropdown
  useEffect(() => {
    function handleClickOutside(event: any) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search API Call
  const handleSearch = async (txt: string) => {
    setQuery(txt);
    onChange(txt, null); // Clear selected partner ID in parent, just update text

    if (txt.length > 1) {
      try {
        // Using the search endpoint we created earlier
        const res = await api.get(`/partners/search?search=${txt}&limit=5`);
        setResults(res.data.partners || []);
        setShowDropdown(true);
      } catch (e) {
        console.error("Search failed", e);
      }
    } else {
      setResults([]);
      setShowDropdown(false);
    }
  };

  const selectPartner = (partner: Partner) => {
    setQuery(partner.partner_name);
    setShowDropdown(false);
    onChange(partner.partner_name, partner); // Send full object back to parent
  };

  const handleCreateSuccess = (newPartner: Partner) => {
    selectPartner(newPartner);
  };

  return (
    <div className={styles.dropdownContainer} ref={wrapperRef}>
      <input
        type="text"
        className={styles.searchInput}
        placeholder="Type to search or create..."
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        onFocus={() => query.length > 1 && setShowDropdown(true)}
      />

      {showDropdown && (
        <div className={styles.dropdownMenu}>
          {results.length > 0 ? (
            results.map((p) => (
              <div
                key={p._id}
                className={styles.dropdownItem}
                onClick={() => selectPartner(p)}
              >
                <div>{p.partner_name}</div>
                <div className={styles.dropdownItemMeta}>
                  {p.gstin ? `GST: ${p.gstin} • ` : ""}
                  {p.billing_address?.city || "No City"}
                </div>
              </div>
            ))
          ) : (
            <div
              className={styles.dropdownItem}
              style={{ color: "#999", cursor: "default" }}
            >
              No partners found
            </div>
          )}

          {/* Always show Create Option at bottom */}
          <div
            className={styles.createOption}
            onClick={() => {
              setShowDropdown(false);
              setIsModalOpen(true);
            }}
          >
            <FiPlus /> Create "{query}"
          </div>
        </div>
      )}

      <CreatePartnerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleCreateSuccess}
        initialName={query}
      />
    </div>
  );
};

export default PartnerSearchDropdown;
