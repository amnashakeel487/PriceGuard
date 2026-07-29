/**
 * Formats a numeric value into a currency string.
 * @param {number} value
 * @param {string} currencySymbol
 * @returns {string}
 */
export const formatCurrency = (value, currencySymbol = "$") => {
  if (value === null || value === undefined) return "";
  return `${currencySymbol}${value.toFixed(2)}`;
};

/**
 * Formats a Date object or ISO string into a local readable string.
 * @param {Date|string} date
 * @returns {string}
 */
export const formatDate = (date) => {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
};
