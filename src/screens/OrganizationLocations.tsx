import React, { useState } from "react";
import styles from "../css/OrganizationLocations.module.css";
import {
  IoLocation,
  IoAddCircleOutline,
  IoCreateOutline,
  IoTrashOutline,
  IoLink,
} from "react-icons/io5";

interface Location {
  id: string;
  name: string;
  locationId: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  addressLink?: string;
}

interface OrganizationLocationsProps {
  locations: Location[];
  onLocationsChange: (locations: Location[]) => void;
}

const OrganizationLocations: React.FC<OrganizationLocationsProps> = ({
  locations,
  onLocationsChange,
}) => {
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [newLocationName, setNewLocationName] = useState("");
  const [newLocationId, setNewLocationId] = useState("");
  const [newStreet, setNewStreet] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newState, setNewState] = useState("");
  const [newPincode, setNewPincode] = useState("");
  const [newCountry, setNewCountry] = useState("India");
  const [newAddressLink, setNewAddressLink] = useState("");
  const [editingLocationId, setEditingLocationId] = useState<string | null>(
    null
  );

  const validatePincode = (pincode: string) => {
    const indianPincodeRegex = /^[1-9][0-9]{5}$/;
    return indianPincodeRegex.test(pincode);
  };

  const validateURL = (url: string) => {
    if (!url.trim()) return true;
    const urlRegex =
      /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    return urlRegex.test(url.trim());
  };

  const formatAddress = (location: Location) => {
    const addressParts = [
      location.street,
      location.city,
      location.state,
      location.pincode,
      location.country,
    ].filter((part) => part && part.trim());
    return addressParts.join(", ");
  };

  const handleAddLocation = () => {
    const safeTrim = (value: string | undefined) => (value || "").trim();
    const trimmedName = safeTrim(newLocationName);
    const trimmedLocationId = safeTrim(newLocationId);
    const trimmedStreet = safeTrim(newStreet);
    const trimmedCity = safeTrim(newCity);
    const trimmedState = safeTrim(newState);
    const trimmedPincode = safeTrim(newPincode);
    const trimmedCountry = safeTrim(newCountry);
    const trimmedAddressLink = safeTrim(newAddressLink);

    if (
      !trimmedName ||
      !trimmedLocationId ||
      !trimmedStreet ||
      !trimmedCity ||
      !trimmedState ||
      !trimmedPincode ||
      !trimmedCountry
    ) {
      alert(
        "Please fill in all required fields (Name, ID, Street, City, State, Pincode, Country)"
      );
      return;
    }

    if (!validatePincode(trimmedPincode)) {
      alert("Please enter a valid 6-digit pincode (e.g., 413001)");
      return;
    }

    if (trimmedAddressLink && !validateURL(trimmedAddressLink)) {
      alert(
        "Please enter a valid URL (e.g., https://maps.google.com/...) or leave it empty"
      );
      return;
    }

    if (
      !editingLocationId &&
      locations.some((loc) => loc.locationId === trimmedLocationId)
    ) {
      alert("A location with this ID already exists. Please use a unique ID.");
      return;
    }

    if (editingLocationId) {
      const updatedLocations = locations.map((location) =>
        location.id === editingLocationId
          ? {
              ...location,
              name: trimmedName,
              locationId: trimmedLocationId,
              street: trimmedStreet,
              city: trimmedCity,
              state: trimmedState,
              pincode: trimmedPincode,
              country: trimmedCountry,
              addressLink: trimmedAddressLink || undefined,
            }
          : location
      );
      onLocationsChange(updatedLocations);
    } else {
      const newLocation: Location = {
        id: Date.now().toString(),
        name: trimmedName,
        locationId: trimmedLocationId,
        street: trimmedStreet,
        city: trimmedCity,
        state: trimmedState,
        pincode: trimmedPincode,
        country: trimmedCountry,
        ...(trimmedAddressLink && { addressLink: trimmedAddressLink }),
      };
      onLocationsChange([...locations, newLocation]);
    }

    clearInputs();
  };

  const handleEditLocation = (location: Location) => {
    setNewLocationName(location.name || "");
    setNewLocationId(location.locationId || "");
    setNewStreet(location.street || "");
    setNewCity(location.city || "");
    setNewState(location.state || "");
    setNewPincode(location.pincode || "");
    setNewCountry(location.country || "India");
    setNewAddressLink(location.addressLink || "");
    setEditingLocationId(location.id);
    setShowLocationModal(true);
  };

  const handleDeleteLocation = (locationId: string) => {
    if (window.confirm("Are you sure you want to remove this location?")) {
      const updatedLocations = locations.filter(
        (location) => location.id !== locationId
      );
      onLocationsChange(updatedLocations);
    }
  };

  const clearInputs = () => {
    setNewLocationName("");
    setNewLocationId("");
    setNewStreet("");
    setNewCity("");
    setNewState("");
    setNewPincode("");
    setNewCountry("India");
    setNewAddressLink("");
    setEditingLocationId(null);
    setShowLocationModal(false);
  };

  const renderLocationModal = () => {
    if (!showLocationModal) return null;
    return (
      <div className={styles.modalOverlay} onClick={clearInputs}>
        <div
          className={styles.locationModalContent}
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className={styles.locationModalTitle}>
            {editingLocationId ? "Edit Location" : "Add New Location"}
          </h2>
          <div className={styles.sectionContainer}>
            <h3 className={styles.sectionHeaderText}>Basic Information</h3>
            <div className={styles.locationInputGroup}>
              <input
                className={styles.locationInput}
                value={newLocationName}
                onChange={(e) => setNewLocationName(e.target.value)}
                placeholder="Clinic Name"
              />
            </div>
            <div className={styles.locationInputGroup}>
              <input
                className={styles.locationInput}
                value={newLocationId}
                onChange={(e) => setNewLocationId(e.target.value)}
                placeholder="Clinic ID"
                style={{ textTransform: "uppercase" }}
              />
            </div>
          </div>
          <div className={styles.sectionContainer}>
            <h3 className={styles.sectionHeaderText}>Address Details</h3>
            <div className={styles.locationInputGroup}>
              <textarea
                className={`${styles.locationInput} ${styles.multilineInput}`}
                value={newStreet}
                onChange={(e) => setNewStreet(e.target.value)}
                placeholder="Street Address"
                rows={2}
              />
            </div>
            <div className={styles.rowContainer}>
              <div
                className={`${styles.locationInputGroup} ${styles.halfWidth}`}
              >
                <input
                  className={styles.locationInput}
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                  placeholder="City"
                />
              </div>
              <div
                className={`${styles.locationInputGroup} ${styles.halfWidth}`}
              >
                <input
                  className={styles.locationInput}
                  value={newState}
                  onChange={(e) => setNewState(e.target.value)}
                  placeholder="State"
                />
              </div>
            </div>
            <div className={styles.rowContainer}>
              <div
                className={`${styles.locationInputGroup} ${styles.halfWidth}`}
              >
                <input
                  className={styles.locationInput}
                  value={newPincode}
                  onChange={(e) => setNewPincode(e.target.value)}
                  placeholder="Pincode"
                  type="number"
                  maxLength={6}
                />
              </div>
              <div
                className={`${styles.locationInputGroup} ${styles.halfWidth}`}
              >
                <input
                  className={styles.locationInput}
                  value={newCountry}
                  onChange={(e) => setNewCountry(e.target.value)}
                  placeholder="Country"
                />
              </div>
            </div>
            <div className={styles.locationInputGroup}>
              <input
                className={styles.locationInput}
                value={newAddressLink}
                onChange={(e) => setNewAddressLink(e.target.value)}
                placeholder="Address Link"
                type="url"
              />
            </div>
          </div>
          <div className={styles.locationModalButtonsRow}>
            <button
              className={styles.locationModalCancelButton}
              onClick={clearInputs}
            >
              Cancel
            </button>
            <button
              className={styles.locationModalSaveButton}
              onClick={handleAddLocation}
            >
              {editingLocationId ? "Update" : "Add Location"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.sectionHeader}>
        <IoLocation size={22} color="#007B8E" />
        <h2 className={styles.sectionTitle}>Organization Locations</h2>
      </div>
      <div className={styles.card}>
        <p className={styles.locationsDescription}>
          Add multiple locations for your organization. Each location should
          have a unique ID and complete address details for better
          searchability.
        </p>
        {locations.length === 0 ? (
          <div className={styles.noLocationsContainer}>
            <IoLocation size={40} color="#CBD5E0" />
            <p className={styles.noLocationsText}>No locations added yet</p>
            <p className={styles.noLocationsSubText}>
              Add your first location to get started
            </p>
          </div>
        ) : (
          <div>
            {locations.map((item) => (
              <div key={item.id} className={styles.locationItem}>
                <div className={styles.locationInfo}>
                  <IoLocation
                    size={24}
                    color="#007B8E"
                    className={styles.locationIcon}
                  />
                  <div className={styles.locationTextContainer}>
                    <p className={styles.locationName}>{item.name}</p>
                    <p className={styles.locationId}>ID: {item.locationId}</p>
                    <p className={styles.locationAddress}>
                      {formatAddress(item)}
                    </p>
                    {item.addressLink && (
                      <a
                        href={item.addressLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.addressLinkContainer}
                      >
                        <IoLink size={14} color="#007B8E" />
                        <span className={styles.addressLinkText}>
                          View on Map
                        </span>
                      </a>
                    )}
                  </div>
                </div>
                <div className={styles.locationActions}>
                  <button
                    className={styles.locationEditButton}
                    onClick={() => handleEditLocation(item)}
                  >
                    <IoCreateOutline size={20} color="#007B8E" />
                  </button>
                  <button
                    className={styles.locationDeleteButton}
                    onClick={() => handleDeleteLocation(item.id)}
                  >
                    <IoTrashOutline size={20} color="#DC2626" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <button
          className={styles.addLocationButton}
          onClick={() => {
            clearInputs();
            setShowLocationModal(true);
          }}
        >
          <IoAddCircleOutline size={20} color="#FFFFFF" />
          <span className={styles.addLocationButtonText}>Add Location</span>
        </button>
      </div>
      {renderLocationModal()}
    </div>
  );
};

export default OrganizationLocations;
