import React, { useState, useEffect, useCallback, useRef } from "react";
import SearchIcon from "@mui/icons-material/Search";
import api from "../utils/central";
import styles from "../css/DrugSearchComponent.module.css";

export interface DrugItem {
  _id?: string;
  drug_name: string;
  generic_name: string;
  drug_type: string;
  strength?: string;
  meal_timing?: string;
}

interface DrugSearchComponentProps {
  selectedName: string;
  onSelectDrug: (drug: DrugItem) => void;
}

const DrugSearchComponent: React.FC<DrugSearchComponentProps> = ({
  selectedName,
  onSelectDrug,
}) => {
  const [searchText, setSearchText] = useState(selectedName);
  const [drugs, setDrugs] = useState<DrugItem[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      )
        setShowDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchDrugs = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setDrugs([]);
      return;
    }
    try {
      setIsLoading(true);
      const response = await api.get(`/search/drug`, {
        params: { search: query, limit: 10 },
      });
      setDrugs(response.data.drugs || []);
    } catch (error) {
      console.error("Error searching drugs:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchText !== selectedName) fetchDrugs(searchText);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchText, fetchDrugs, selectedName]);

  return (
    <div className={styles.searchWrapper} ref={dropdownRef}>
      <div className={styles.inputContainer}>
        {/* Adjusted icon size to match the new thin aesthetic */}
        <SearchIcon fontSize="small" className={styles.searchIcon} />
        <input
          type="text"
          className={styles.searchInput}
          value={searchText}
          onChange={(e) => {
            setSearchText(e.target.value);
            setShowDropdown(true);
          }}
          placeholder="Search master database (e.g. Paracetamol)..."
        />
      </div>

      {showDropdown && searchText.length > 1 && (
        <div className={styles.dropdown}>
          {isLoading ? (
            <div className={styles.loader}>Finding medicines...</div>
          ) : drugs.length > 0 ? (
            drugs.map((item) => (
              <div
                key={item._id}
                className={styles.dropdownItem}
                onClick={() => {
                  onSelectDrug(item);
                  setSearchText(item.drug_name);
                  setShowDropdown(false);
                }}
              >
                <div className={styles.drugMain}>
                  {item.drug_name}{" "}
                  {item.strength && <span className={styles.drugStrength}>{item.strength}</span>}
                </div>
                <div className={styles.drugSub}>
                  {item.generic_name} • {item.drug_type} {item.meal_timing ? `• ${item.meal_timing}` : ""}
                </div>
              </div>
            ))
          ) : (
            <div className={styles.loader}>No medicines found in database.</div>
          )}
        </div>
      )}
    </div>
  );
};

export default DrugSearchComponent;