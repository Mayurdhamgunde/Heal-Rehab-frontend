import React, { useMemo } from "react";
import styles from "../css/InvoiceTemplate.module.css"; // Ensure this path matches your project structure

interface InvoiceTemplateProps {
  data: any;
  componentRef: React.RefObject<HTMLDivElement | null>;
}

const InvoiceTemplate: React.FC<InvoiceTemplateProps> = ({
  data,
  componentRef,
}) => {
  if (!data) return null;

  const { invoice, organization } = data;
  const recipient = invoice.recipient_snapshot;

  // --- CONFIGURATION ---
  // Page 1 has fewer items because of the big address block.
  // Subsequent pages can hold more, but we leave space for the footer on the last page.
  const ITEMS_PER_FIRST_PAGE = 10;
  const ITEMS_PER_OTHER_PAGE = 14;

  // --- HELPER FUNCTIONS ---
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const numberToWords = (num: number) => {
    const ones = [
      "",
      "One",
      "Two",
      "Three",
      "Four",
      "Five",
      "Six",
      "Seven",
      "Eight",
      "Nine",
    ];
    const tens = [
      "",
      "",
      "Twenty",
      "Thirty",
      "Forty",
      "Fifty",
      "Sixty",
      "Seventy",
      "Eighty",
      "Ninety",
    ];
    const teens = [
      "Ten",
      "Eleven",
      "Twelve",
      "Thirteen",
      "Fourteen",
      "Fifteen",
      "Sixteen",
      "Seventeen",
      "Eighteen",
      "Nineteen",
    ];

    if (num === 0) return "Zero Rupees only";

    const convertBelow1000 = (n: number): string => {
      if (n === 0) return "";
      if (n < 10) return ones[n];
      if (n < 20) return teens[n - 10];
      if (n < 100)
        return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
      return (
        ones[Math.floor(n / 100)] +
        " Hundred" +
        (n % 100 ? " " + convertBelow1000(n % 100) : "")
      );
    };

    const crore = Math.floor(num / 10000000);
    const lakh = Math.floor((num % 10000000) / 100000);
    const thousand = Math.floor((num % 100000) / 1000);
    const remainder = num % 1000;

    let result = "";
    if (crore) result += convertBelow1000(crore) + " Crore ";
    if (lakh) result += convertBelow1000(lakh) + " Lakh ";
    if (thousand) result += convertBelow1000(thousand) + " Thousand ";
    if (remainder) result += convertBelow1000(remainder);

    return result.trim() + " Rupees only";
  };

  // --- PAGINATION LOGIC ---
  const pages = useMemo(() => {
    const itemsCopy = [...(invoice.items || [])];
    const chunks = [];

    // First page chunk
    if (itemsCopy.length > 0) {
      chunks.push(itemsCopy.splice(0, ITEMS_PER_FIRST_PAGE));
    }

    // Subsequent page chunks
    while (itemsCopy.length > 0) {
      chunks.push(itemsCopy.splice(0, ITEMS_PER_OTHER_PAGE));
    }

    // Handle empty state
    if (chunks.length === 0) chunks.push([]);

    return chunks;
  }, [invoice.items]);

  // --- TAX LOGIC ---
  const isIntraState =
    organization.address?.state?.toLowerCase() ===
    recipient.place_of_supply?.toLowerCase();
  const cgst = isIntraState ? invoice.total_tax / 2 : 0;
  const sgst = isIntraState ? invoice.total_tax / 2 : 0;
  const igst = !isIntraState ? invoice.total_tax : 0;

  return (
    <div ref={componentRef} className={styles.printContainer}>
      {pages.map((pageItems, pageIndex) => {
        const isFirstPage = pageIndex === 0;
        const isLastPage = pageIndex === pages.length - 1;

        // Calculate starting index for row #
        const itemStartIndex =
          pageIndex === 0
            ? 0
            : ITEMS_PER_FIRST_PAGE + (pageIndex - 1) * ITEMS_PER_OTHER_PAGE;

        return (
          <div key={pageIndex} className={styles.page}>
            {/* HEADER SECTION (Repeated on every page) */}
            <div className={styles.header}>
              <div className={styles.headerText}>
                <h1 className={styles.orgName}>{organization.name}</h1>
                <div className={styles.orgAddress}>
                  {organization.address?.street}, {organization.address?.city}
                  <br />
                  {organization.address?.state}, {organization.address?.zip}
                </div>
                <div className={styles.orgContact}>
                  Phone no.: {organization.phone}
                </div>
                {organization.gstin && (
                  <div className={styles.orgGstin}>
                    GSTIN : {organization.gstin}
                  </div>
                )}
                <div className={styles.orgState}>
                  State: {organization.address?.state}
                </div>
              </div>
              {organization.logo && (
                <img
                  src={organization.logo}
                  alt="Logo"
                  className={styles.logo}
                />
              )}
            </div>

            <div className={styles.headerDivider}></div>

            <div className={styles.invoiceTitle}>
              {isFirstPage ? "TAX Invoice" : "TAX Invoice (Continued)"}
            </div>

            {/* PAGE 1: FULL BILLING DETAILS */}
            {isFirstPage ? (
              <div className={styles.billingRow}>
                <div className={styles.billingTo}>
                  <strong className={styles.sectionLabel}>
                    Tax Invoice For
                  </strong>
                  <div className={styles.recipientName}>{recipient.name}</div>
                  <div className={styles.recipientAddress}>
                    {recipient.address?.street}
                    <br />
                    {recipient.address?.city}, {recipient.address?.state}-
                    {recipient.address?.zip}
                    <br />
                    India
                  </div>
                  {recipient.gstin && (
                    <div className={styles.recipientGstin}>
                      GSTIN : {recipient.gstin}
                    </div>
                  )}
                  <div className={styles.recipientState}>
                    State: {recipient.place_of_supply}
                  </div>
                </div>

                <div className={styles.invoiceDetails}>
                  <strong className={styles.sectionLabel}>
                    Tax Invoice Details
                  </strong>
                  <div className={styles.detailRow}>
                    Proforma Invoice No.: {invoice.invoice_number}
                  </div>
                  <div className={styles.detailRow}>
                    Date: {formatDate(invoice.invoice_date)}
                  </div>
                  <div className={styles.detailRow}>
                    Place of supply: {recipient.place_of_supply || "Karnataka"}
                  </div>
                  <div className={styles.detailRow}>
                    Page: {pageIndex + 1} of {pages.length}
                  </div>
                </div>
              </div>
            ) : (
              /* PAGE 2+: MINI HEADER */
              <div className={styles.miniHeader}>
                <span>
                  <strong>Bill To:</strong> {recipient.name}
                </span>
                <span>
                  <strong>Invoice No:</strong> {invoice.invoice_number} |{" "}
                  <strong>Page:</strong> {pageIndex + 1} of {pages.length}
                </span>
              </div>
            )}

            {/* ITEMS TABLE */}
            <table className={styles.itemsTable}>
              <thead>
                <tr>
                  <th className={styles.colHash}>#</th>
                  <th className={styles.colItem}>Item name</th>
                  <th className={styles.colHsn}>HSN/SAC</th>
                  <th className={styles.colQty}>Qty</th>
                  <th className={styles.colPrice}>Price/Unit</th>
                  <th className={styles.colGst}>GST</th>
                  <th className={styles.colAmount}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((item: any, index: number) => (
                  <tr key={index}>
                    <td className={styles.tdHash}>
                      {itemStartIndex + index + 1}
                    </td>
                    <td className={styles.tdItem}>
                      <div style={{ fontWeight: 600 }}>{item.item_name}</div>
                      {item.description && (
                        <div className={styles.itemDesc}>
                          ({item.description})
                        </div>
                      )}
                    </td>
                    <td className={styles.tdHsn}>{item.hsn_sac || "-"}</td>
                    <td className={styles.tdQty}>{item.quantity}</td>
                    <td className={styles.tdPrice}>
                      {formatCurrency(item.price_per_unit)}
                    </td>
                    <td className={styles.tdGst}>
                      {item.tax_amount > 0 ? (
                        <>
                          {formatCurrency(item.tax_amount)}
                          <br />
                          <span style={{ fontSize: "9px" }}>
                            ({item.tax_rate}%)
                          </span>
                        </>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className={styles.tdAmount}>
                      {formatCurrency(item.line_total)}
                    </td>
                  </tr>
                ))}

                {/* TABLE TOTAL (Only on Last Page) */}
                {isLastPage && (
                  <tr className={styles.totalRow}>
                    <td colSpan={3} className={styles.totalLabel}>
                      Total
                    </td>
                    <td className={styles.tdQty}>
                      {invoice.items.reduce(
                        (sum: number, item: any) => sum + item.quantity,
                        0,
                      )}
                    </td>
                    <td></td>
                    <td className={styles.tdGst}>
                      {formatCurrency(invoice.total_tax)}
                    </td>
                    <td className={styles.tdAmount}>
                      {formatCurrency(invoice.sub_total + invoice.total_tax)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* FOOTER (Only on Last Page) */}
            {isLastPage && (
              <div className={styles.footer}>
                <div className={styles.footerLeft}>
                  <strong className={styles.amountWordsLabel}>
                    Proforma Invoice Amount In Words
                  </strong>
                  <div className={styles.amountWords}>
                    {numberToWords(Math.round(invoice.final_amount))}
                  </div>

                  <strong className={styles.termsLabel}>
                    Terms and Conditions
                  </strong>
                  <div className={styles.termsText}>
                    {invoice.terms_and_conditions ||
                      "Thanks for doing business with us!"}
                  </div>

                  <div className={styles.signatureSection}>
                    <div className={styles.payTo}>Pay To:</div>
                    <div className={styles.authorizedSignatory}>
                      Authorized Signatory
                    </div>
                  </div>
                </div>

                <div className={styles.footerRight}>
                  <div className={styles.summaryLine}>
                    <span>Sub Total</span>
                    <span>{formatCurrency(invoice.sub_total)}</span>
                  </div>
                  {sgst > 0 && (
                    <div className={styles.summaryLine}>
                      <span>SGST@9%</span>
                      <span>{formatCurrency(sgst)}</span>
                    </div>
                  )}
                  {cgst > 0 && (
                    <div className={styles.summaryLine}>
                      <span>CGST@9%</span>
                      <span>{formatCurrency(cgst)}</span>
                    </div>
                  )}
                  {igst > 0 && (
                    <div className={styles.summaryLine}>
                      <span>IGST@{invoice.items[0]?.tax_rate || 18}%</span>
                      <span>{formatCurrency(igst)}</span>
                    </div>
                  )}
                  {invoice.round_off_amount !== 0 && (
                    <div className={styles.summaryLine}>
                      <span>Round off</span>
                      <span>{formatCurrency(invoice.round_off_amount)}</span>
                    </div>
                  )}

                  <div className={styles.grandTotal}>
                    <span>Total</span>
                    <span>{formatCurrency(invoice.final_amount)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default InvoiceTemplate;
