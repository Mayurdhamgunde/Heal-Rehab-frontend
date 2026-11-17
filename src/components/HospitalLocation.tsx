import React, { useState, useEffect } from 'react';
import styles from '../css/HospitalLocation.module.css';
import api from '../utils/central';

interface Location {
  _id: string;
  id: string;
  name: string;
  locationId: string;
  addressLink: string;
  createdAt: string;
  updatedAt: string;
}

interface LocationPickerProps {
  selectedLocation: Location | null;
  onLocationSelect: (location: Location) => void;
  disabled?: boolean;
  showSetAsDefault?: boolean;
  autoSelectPreferred?: boolean;
}

interface NoLocationsPopupProps {
  visible: boolean;
  onClose: () => void;
  onNavigateToOrganization: () => void;
}

// No Locations Popup Component
const NoLocationsPopup: React.FC<NoLocationsPopupProps> = ({
  visible,
  onClose,
  onNavigateToOrganization,
}) => {
  if (!visible) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.popupContainer}>
        <div className={styles.iconContainer}>
          <span className={styles.noLocationIcon}>📍</span>
        </div>
        
        <h3 className={styles.popupTitle}>No Locations Available</h3>
        
        <p className={styles.popupMessage}>
          No locations have been configured for your organization yet. 
          Please contact your administrator or add locations through the Organization settings.
        </p>
        
        <div className={styles.popupButtonContainer}>
          <button
            className={`${styles.popupButton} ${styles.secondaryButton}`}
            onClick={onClose}
          >
            Close
          </button>
          
          <button
            className={`${styles.popupButton} ${styles.primaryButton}`}
            onClick={onNavigateToOrganization}
          >
            <span className={styles.buttonIcon}>🏢</span>
            Organization Settings
          </button>
        </div>
      </div>
    </div>
  );
};

const LocationPicker: React.FC<LocationPickerProps> = ({
  selectedLocation,
  onLocationSelect,
  disabled = false,
  showSetAsDefault = true,
  autoSelectPreferred = true,
}) => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showLocationModal, setShowLocationModal] = useState<boolean>(false);
  const [isSettingPreferred, setIsSettingPreferred] = useState<boolean>(false);
  const [showNoLocationsPopup, setShowNoLocationsPopup] = useState<boolean>(false);
  const [preferredLocationId, setPreferredLocationId] = useState<string | null>(null);

  useEffect(() => {
    fetchLocations();
    loadPreferredLocation();
  }, []);

  // Auto-select preferred location when locations are loaded
  useEffect(() => {
    if (
      autoSelectPreferred &&
      locations.length > 0 &&
      preferredLocationId &&
      !selectedLocation
    ) {
      const preferredLocation = locations.find(
        loc => loc._id === preferredLocationId,
      );
      if (preferredLocation) {
        onLocationSelect(preferredLocation);
      }
    }
  }, [locations, preferredLocationId, selectedLocation, autoSelectPreferred]);

  const loadPreferredLocation = () => {
    const stored = localStorage.getItem('preferred_location');
    if (stored) {
      setPreferredLocationId(stored);
    }
  };

  const fetchLocations = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/get/orgLocations');

      if (response.status === 200 && response.data?.locations) {
        setLocations(response.data.locations);
        
        if (response.data.locations.length === 0) {
          setShowNoLocationsPopup(true);
        }
      } else {
        setLocations([]);
        setShowNoLocationsPopup(true);
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
      setLocations([]);
      setShowNoLocationsPopup(true);
    } finally {
      setIsLoading(false);
    }
  };

  const setAsPreferredLocation = async (location: Location) => {
    try {
      setIsSettingPreferred(true);
      localStorage.setItem('preferred_location', location._id);
      setPreferredLocationId(location._id);
      console.log(`${location.name} set as default location`);
    } catch (error) {
      console.error('Failed to set default location:', error);
    } finally {
      setIsSettingPreferred(false);
    }
  };

  const handleSetAsDefault = (location: Location) => {
    if (window.confirm(`Set "${location.name}" as your default location for future appointments?`)) {
      setAsPreferredLocation(location);
    }
  };

  const openLocationInMaps = (addressLink: string) => {
    if (addressLink) {
      window.open(addressLink, '_blank');
    }
  };

  const isPreferredLocation = (locationId: string) => {
    return preferredLocationId === locationId;
  };

  const handleNavigateToOrganization = () => {
    setShowNoLocationsPopup(false);
    console.log('Navigate to Organization Settings');
  };

  const openLocationModal = () => {
    if (!disabled) {
      if (locations.length === 0) {
        setShowNoLocationsPopup(true);
        return;
      }
      setShowLocationModal(true);
    }
  };

  const handleLocationSelect = (location: Location) => {
    onLocationSelect(location);
    setShowLocationModal(false);
  };

  const renderLocationField = () => {
    const locationName = selectedLocation ? selectedLocation.name : undefined;
    const isPreferred = selectedLocation && isPreferredLocation(selectedLocation._id);

    return (
      <div 
        className={`${styles.locationField} ${disabled ? styles.disabled : ''}`}
        onClick={openLocationModal}
      >
        <div className={styles.locationFieldContent}>
          <div className={styles.locationNameContainer}>
            <span className={`${styles.locationFieldText} ${!locationName ? styles.placeholder : ''}`}>
              {locationName || 'Select a facility location...'}
            </span>
            {isPreferred && (
              <div className={styles.preferredBadge}>
                <span className={styles.starIcon}>⭐</span>
                <span className={styles.preferredText}>Default</span>
              </div>
            )}
          </div>
          {selectedLocation && (
            <button
              className={styles.mapButton}
              onClick={(e) => {
                e.stopPropagation();
                openLocationInMaps(selectedLocation.addressLink);
              }}
              type="button"
              title="Open in Maps"
            >
              🗺️
            </button>
          )}
        </div>
        <span className={styles.dropdownIcon}>▼</span>
      </div>
    );
  };

  const renderLocationModal = () => {
    if (!showLocationModal) return null;

    return (
      <div className={styles.modalOverlay} onClick={() => setShowLocationModal(false)}>
        <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
          <div className={styles.modalHeader}>
            <h3 className={styles.modalTitle}>Select Facility</h3>
            <button
              className={styles.closeButton}
              onClick={() => setShowLocationModal(false)}
              type="button"
            >
              ✕
            </button>
          </div>

          {isLoading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.spinner}></div>
              <p>Loading locations...</p>
            </div>
          ) : (
            <div className={styles.locationsContainer}>
              {locations.length === 0 ? (
                <div className={styles.emptyContainer}>
                  <p className={styles.emptyText}>No locations available</p>
                  <button
                    className={styles.addLocationButton}
                    onClick={handleNavigateToOrganization}
                    type="button"
                  >
                    <span className={styles.buttonIcon}>➕</span>
                    Add Locations
                  </button>
                </div>
              ) : (
                locations.map(location => (
                  <div key={location._id} className={styles.locationItemWrapper}>
                    <div
                      className={`${styles.locationItem} ${
                        selectedLocation?._id === location._id ? styles.selected : ''
                      }`}
                      onClick={() => handleLocationSelect(location)}
                    >
                      <div className={styles.locationItemContent}>
                        <div className={styles.locationInfo}>
                          <div className={styles.locationNameRow}>
                            <span className={styles.locationItemText}>
                              {location.name}
                            </span>
                            {isPreferredLocation(location._id) && (
                              <span className={styles.preferredBadgeSmall}>⭐ Default</span>
                            )}
                          </div>
                          <span className={styles.locationIdText}>
                            ID: {location.locationId}
                          </span>
                        </div>
                        <div className={styles.locationActions}>
                          <button
                            className={styles.mapIconButton}
                            onClick={(e) => {
                              e.stopPropagation();
                              openLocationInMaps(location.addressLink);
                            }}
                            type="button"
                            title="View on Map"
                          >
                            🗺️
                          </button>
                          {showSetAsDefault && !isPreferredLocation(location._id) && (
                            <button
                              className={styles.setDefaultButton}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSetAsDefault(location);
                              }}
                              disabled={isSettingPreferred}
                              type="button"
                              title="Set as Default"
                            >
                              {isSettingPreferred ? (
                                <div className={styles.smallSpinner}></div>
                              ) : (
                                '☆'
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.locationPicker}>
      {renderLocationField()}
      {renderLocationModal()}
      <NoLocationsPopup
        visible={showNoLocationsPopup}
        onClose={() => setShowNoLocationsPopup(false)}
        onNavigateToOrganization={handleNavigateToOrganization}
      />
    </div>
  );
};

export default LocationPicker;