import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/central';
import defaultProfile from '../assets/profile.png';
import styles from '../css/DoctorLocationAssignment.module.css';

interface Doctor {
  _id: string;
  doctor_first_name: string;
  doctor_last_name: string;
  doctor_phone: string;
  doctor_email: string;
  is_admin: boolean;
  organization_name: string;
  doctors_photo?: string;
  assigned_locations?: AssignedLocation[];
}

interface Location {
  locationId: string;
  name: string;
  address?: string;
}

interface AssignedLocation {
  location_id: string;
  location_name: string;
  is_active: boolean;
  assigned_at: Date;
}

const showSuccessToast = (message: string): void => {
  alert(message);
};

const handleError = (error: any): void => {
  console.error('Error:', error);
  alert(error.response?.data?.error || 'An error occurred. Please try again.');
};

const DoctorLocationAssignment: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedDoctors, setSelectedDoctors] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([fetchDoctors(), fetchLocations()]);
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await api.get('/getalldoctor');
      setDoctors(response.data.doctors);
    } catch (error) {
      handleError(error);
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await api.get('/get/orgLocations');
      setLocations(response.data.locations);
    } catch (error) {
      handleError(error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchData();
    } catch (error) {
      handleError(error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const toggleDoctorSelection = (doctorId: string) => {
    setSelectedDoctors(prev => {
      const newSet = new Set(prev);
      if (newSet.has(doctorId)) {
        newSet.delete(doctorId);
      } else {
        newSet.add(doctorId);
      }
      return newSet;
    });
  };

  const selectAllDoctors = () => {
    if (selectedDoctors.size === doctors.length) {
      setSelectedDoctors(new Set());
    } else {
      setSelectedDoctors(new Set(doctors.map(d => d._id)));
    }
  };

  const openLocationModal = () => {
    if (selectedDoctors.size === 0) {
      alert('Please select at least one doctor');
      return;
    }
    setModalVisible(true);
  };

  const assignLocationToDoctors = async () => {
    if (!selectedLocation) {
      alert('Please select a location');
      return;
    }

    setIsAssigning(true);
    try {
      const assignmentPromises = Array.from(selectedDoctors).map(doctorId =>
        api.post(`/assign/location/${doctorId}`, {
          location_id: selectedLocation.locationId,
          location_name: selectedLocation.name,
          has_fixed_schedule: true,
        })
      );

      await Promise.all(assignmentPromises);

      showSuccessToast(
        `Successfully assigned ${selectedDoctors.size} doctor(s) to ${selectedLocation.name}`
      );
      setModalVisible(false);
      setSelectedDoctors(new Set());
      setSelectedLocation(null);
      await fetchDoctors();
    } catch (error) {
      handleError(error);
    } finally {
      setIsAssigning(false);
    }
  };

  const isLocationAssigned = (doctor: Doctor, locationId: string): boolean => {
    return (
      doctor.assigned_locations?.some(
        loc => loc.location_id === locationId && loc.is_active
      ) || false
    );
  };

  const DoctorCardSkeleton = () => (
    <div className={styles.doctorCard}>
      <div className={styles.doctorCardContent}>
        <div className={`${styles.doctorImage} ${styles.skeletonBox}`} />
        <div className={styles.doctorDetails}>
          <div className={`${styles.skeletonLine} ${styles.skeletonLineLarge}`} />
          <div className={`${styles.skeletonLine} ${styles.skeletonLineMedium}`} />
          <div className={`${styles.skeletonLine} ${styles.skeletonLineSmall}`} />
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.wrapper}>
          <div className={styles.header}>
            <div className={styles.headerIcon}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <h1 className={styles.title}>Assign Locations</h1>
            <p className={styles.subtitle}>Loading doctors and locations...</p>
          </div>
          <div className={styles.skeletonContainer}>
            {[...Array(6)].map((_, index) => (
              <DoctorCardSkeleton key={index} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerIcon}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <h1 className={styles.title}>Assign Locations to Doctors</h1>
          <p className={styles.subtitle}>Select doctors and assign them to locations</p>
        </div>

        {/* Selection Controls */}
        <div className={styles.headerContainer}>
          <div className={styles.selectionInfo}>
            <span className={styles.selectionText}>
              {selectedDoctors.size} of {doctors.length} selected
            </span>
          </div>
          <div className={styles.headerButtons}>
            <button onClick={selectAllDoctors} className={styles.selectAllButton}>
              {selectedDoctors.size === doctors.length ? 'Deselect All' : 'Select All'}
            </button>
            <button
              onClick={openLocationModal}
              className={`${styles.assignButton} ${
                selectedDoctors.size === 0 ? styles.assignButtonDisabled : ''
              }`}
              disabled={selectedDoctors.size === 0}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20M2 12h20"/>
              </svg>
              Assign Location
            </button>
          </div>
        </div>

        {/* Doctors List */}
        <div className={styles.doctorsList}>
          {doctors.length === 0 ? (
            <div className={styles.emptyContainer}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <line x1="23" y1="11" x2="17" y2="17"/>
                <line x1="17" y1="11" x2="23" y2="17"/>
              </svg>
              <p className={styles.emptyText}>No doctors found</p>
            </div>
          ) : (
            doctors.map(doctor => {
              const isSelected = selectedDoctors.has(doctor._id);
              return (
                <div
                  key={doctor._id}
                  onClick={() => toggleDoctorSelection(doctor._id)}
                  className={`${styles.doctorCard} ${isSelected ? styles.doctorCardSelected : ''}`}
                >
                  <div className={styles.doctorCardContent}>
                    <div className={styles.checkboxContainer}>
                      <div className={`${styles.checkbox} ${isSelected ? styles.checkboxSelected : ''}`}>
                        {isSelected && (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        )}
                      </div>
                    </div>
                      <img
                      src={doctor.doctors_photo || defaultProfile}
                      alt={`${doctor.doctor_first_name} ${doctor.doctor_last_name}`}
                      className={styles.doctorImage}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = defaultProfile;
                      }}
                    />
                    <div className={styles.doctorDetails}>
                      <h3 className={styles.doctorName}>
                        {doctor.doctor_first_name} {doctor.doctor_last_name}
                      </h3>
                      <div className={styles.doctorInfo}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                          <polyline points="22,6 12,13 2,6"/>
                        </svg>
                        <span>{doctor.doctor_email}</span>
                      </div>
                      {doctor.assigned_locations && doctor.assigned_locations.length > 0 && (
                        <div className={styles.locationBadgeContainer}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                            <circle cx="12" cy="10" r="3"/>
                          </svg>
                          <span className={styles.locationCount}>
                            {doctor.assigned_locations.filter(loc => loc.is_active).length} location(s)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  {doctor.is_admin && (
                    <div className={styles.adminBadge}>
                      <span className={styles.adminBadgeText}>Admin</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Refresh Button */}
        <div className={styles.refreshContainer}>
          <button
            onClick={onRefresh}
            className={styles.refreshButton}
            disabled={refreshing}
          >
            {refreshing ? (
              <>
                <svg className={styles.spinner} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 11-6.22-8.56"/>
                </svg>
                Refreshing...
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                </svg>
                Refresh
              </>
            )}
          </button>
        </div>
      </div>

      {/* Location Selection Modal */}
      {modalVisible && (
        <div className={styles.modalOverlay} onClick={() => setModalVisible(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Select Location</h2>
              <button onClick={() => setModalVisible(false)} className={styles.closeButton}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <p className={styles.modalSubtitle}>
              Assigning to {selectedDoctors.size} doctor(s)
            </p>

            <div className={styles.locationsList}>
              {locations.map(location => {
                const isSelected = selectedLocation?.locationId === location.locationId;
                const assignedDoctorsCount = Array.from(selectedDoctors).filter(doctorId => {
                  const doctor = doctors.find(d => d._id === doctorId);
                  return doctor && isLocationAssigned(doctor, location.locationId);
                }).length;

                return (
                  <div
                    key={location.locationId}
                    onClick={() => setSelectedLocation(location)}
                    className={`${styles.locationItem} ${isSelected ? styles.locationItemSelected : ''}`}
                  >
                    <div className={styles.locationItemContent}>
                      <div className={styles.locationIconContainer}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                          <polyline points="9 22 9 12 15 12 15 22"/>
                        </svg>
                      </div>
                      <div className={styles.locationInfo}>
                        <h4 className={styles.locationName}>{location.name}</h4>
                        {location.address && (
                          <p className={styles.locationAddress}>{location.address}</p>
                        )}
                        {assignedDoctorsCount > 0 && (
                          <p className={styles.alreadyAssignedText}>
                            {assignedDoctorsCount} already assigned
                          </p>
                        )}
                      </div>
                      <div className={`${styles.radioButton} ${isSelected ? styles.radioButtonSelected : ''}`}>
                        {isSelected && <div className={styles.radioButtonInner} />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.cancelButton}
                onClick={() => setModalVisible(false)}
              >
                Cancel
              </button>
              <button
                className={`${styles.confirmButton} ${
                  (!selectedLocation || isAssigning) ? styles.confirmButtonDisabled : ''
                }`}
                onClick={assignLocationToDoctors}
                disabled={!selectedLocation || isAssigning}
              >
                {isAssigning ? (
                  <>
                    <svg className={styles.spinner} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 12a9 9 0 11-6.22-8.56"/>
                    </svg>
                    Assigning...
                  </>
                ) : (
                  'Assign'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorLocationAssignment;