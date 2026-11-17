import React, { useState } from "react";
import styles from "../css/PartnerComponents.module.css";
import api from "../utils/central"; // Your API utility
import { FiX } from "react-icons/fi";

interface CreatePartnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newPartner: any) => void;
  initialName?: string; // Pre-fill name if user typed it
}

const CreatePartnerModal: React.FC<CreatePartnerModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialName = "",
}) => {
  const [formData, setFormData] = useState({
    partner_name: initialName,
    phone_number: "",
    email: "",
    gstin: "",
    gst_type: "Unregistered/Consumer",
    billing_street: "",
    billing_city: "",
    billing_state: "Maharashtra",
    billing_zip: "",
    is_shipping_same: true,
    shipping_street: "",
    shipping_city: "",
    shipping_state: "",
    shipping_zip: "",
  });

  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!formData.partner_name) {
      alert("Partner Name is required");
      return;
    }

    setLoading(true);
    try {
      // Construct payload matching your Schema
      const payload = {
        partner_name: formData.partner_name,
        phone_number: formData.phone_number,
        email: formData.email,
        gstin: formData.gstin,
        gst_type: formData.gst_type,
        billing_address: {
          street: formData.billing_street,
          city: formData.billing_city,
          state: formData.billing_state,
          zip: formData.billing_zip,
        },
        is_shipping_same_as_billing: formData.is_shipping_same,
        shipping_address: formData.is_shipping_same
          ? null
          : {
              street: formData.shipping_street,
              city: formData.shipping_city,
              state: formData.shipping_state,
              zip: formData.shipping_zip,
            },
      };

      const res = await api.post("/create/partner", payload);
      alert("Partner Created Successfully!");
      onSuccess(res.data.partner);
      onClose();
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.msg || "Failed to create partner");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h3>Create New Partner</h3>
          <button className={styles.closeBtn} onClick={onClose}>
            <FiX />
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.formGrid}>
            {/* Basic Info */}
            <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
              <label>Partner/Company Name *</label>
              <input
                name="partner_name"
                className={styles.input}
                value={formData.partner_name}
                onChange={handleChange}
                placeholder="e.g. Acme Corp Pvt Ltd"
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Phone Number</label>
              <input
                name="phone_number"
                className={styles.input}
                value={formData.phone_number}
                onChange={handleChange}
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Email</label>
              <input
                name="email"
                className={styles.input}
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            {/* GST Info */}
            <div className={styles.inputGroup}>
              <label>GSTIN</label>
              <input
                name="gstin"
                className={styles.input}
                value={formData.gstin}
                onChange={handleChange}
                placeholder="27ABCDE1234F1Z5"
              />
            </div>

            <div className={styles.inputGroup}>
              <label>GST Type</label>
              <select
                name="gst_type"
                className={styles.select}
                value={formData.gst_type}
                onChange={handleChange}
              >
                <option>Unregistered/Consumer</option>
                <option>Registered Business - Regular</option>
                <option>Registered Business - Composition</option>
                <option>Overseas</option>
                <option>SEZ</option>
              </select>
            </div>

            {/* Billing Address */}
            <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
              <label>Billing Address (Street)</label>
              <textarea
                name="billing_street"
                className={styles.textarea}
                rows={2}
                value={formData.billing_street}
                onChange={handleChange}
              />
            </div>

            <div className={styles.inputGroup}>
              <label>City</label>
              <input
                name="billing_city"
                className={styles.input}
                value={formData.billing_city}
                onChange={handleChange}
              />
            </div>

            <div className={styles.inputGroup}>
              <label>State</label>
              <select
                name="billing_state"
                className={styles.select}
                value={formData.billing_state}
                onChange={handleChange}
              >
                <option>Maharashtra</option>
                <option>Delhi</option>
                <option>Karnataka</option>
                <option>Gujarat</option>
                {/* Add more states as needed */}
              </select>
            </div>

            {/* Shipping Checkbox */}
            <div className={`${styles.fullWidth} ${styles.checkboxGroup}`}>
              <input
                type="checkbox"
                checked={formData.is_shipping_same}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    is_shipping_same: e.target.checked,
                  }))
                }
              />
              <label>Shipping address is same as billing address</label>
            </div>

            {/* Conditional Shipping Fields */}
            {!formData.is_shipping_same && (
              <>
                <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                  <label>Shipping Address</label>
                  <textarea
                    name="shipping_street"
                    className={styles.textarea}
                    rows={2}
                    value={formData.shipping_street}
                    onChange={handleChange}
                  />
                </div>
                {/* You can add City/State for shipping here too if needed */}
              </>
            )}
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button
            className={styles.saveBtn}
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Partner"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreatePartnerModal;
