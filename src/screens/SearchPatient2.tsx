import React, { useState, useEffect, useRef, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import api from "../utils/central";
import styles from "../css/SearchPatients2.module.css";

interface Patient {
  _id: string;
  patient_first_name: string;
  patient_last_name: string;
  patient_phone: string;
  patient_email: string;
  patient_registration_date: string;
}

const handleError = (error: unknown) => {
  console.error("Error:", error);
};

interface SearchPatientsProps {
  onSearchResults: (
    results: Patient[],
    query: string,
    hasSearched: boolean,
  ) => void;
}

const SearchPatients2: React.FC<SearchPatientsProps> = ({
  onSearchResults,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [, setIsLoading] = useState(false);
  const [, setHasSearched] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const focusTimeout = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
    return () => clearTimeout(focusTimeout);
  }, []);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim() === "") {
      onSearchResults([], "", false);
      setHasSearched(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
      handleSearch();
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, onSearchResults]);

  const handleSearch = useCallback(async () => {
    setIsLoading(true);
    setHasSearched(true);
    try {
      const response = await api.get(
        `/search/patient?query=${encodeURIComponent(searchQuery)}`,
      );
      onSearchResults(response.data.patients || [], searchQuery, true);
    } catch (error) {
      handleError(error);
      onSearchResults([], searchQuery, true);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, onSearchResults]);

  return (
    <div className={styles.safeArea}>
      <div className={styles.container}>
        <div className={styles.searchContainer}>
          <input
            ref={searchInputRef}
            className={styles.searchBar}
            placeholder="Search by Name, Phone number, Email"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
          <button onClick={handleSearch} className={styles.searchButton}>
            <FontAwesomeIcon icon={faSearch} className={styles.searchIcon} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchPatients2;
