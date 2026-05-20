/**
 * Safely escapes a string value for CSV formatting.
 */
function escapeCSVValue(val: any): string {
  if (val === null || val === undefined) return '';
  let strVal = String(val);
  // Replace double quotes with two double quotes
  strVal = strVal.replace(/"/g, '""');
  // If value contains comma, quotes, or newlines, wrap in quotes
  if (strVal.includes(',') || strVal.includes('"') || strVal.includes('\n') || strVal.includes('\r')) {
    return `"${strVal}"`;
  }
  return strVal;
}

/**
 * Converts an array of objects to a CSV string.
 * @param data Array of items
 * @param headers Mapping of object keys to CSV header display names
 */
export function convertToCSV<T extends Record<string, any>>(
  data: T[],
  headers: { key: keyof T; label: string }[]
): string {
  const headerRow = headers.map(h => escapeCSVValue(h.label)).join(',');
  
  const dataRows = data.map(item => {
    return headers.map(h => {
      const val = item[h.key];
      return escapeCSVValue(val);
    }).join(',');
  });
  
  return [headerRow, ...dataRows].join('\n');
}

/**
 * Triggers a browser download of a CSV text content.
 */
export function downloadCSV(csvContent: string, fileName: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
