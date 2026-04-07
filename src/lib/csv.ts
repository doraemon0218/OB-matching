export function csvEscape(cell: string): string {
  if (/[",\r\n]/.test(cell)) {
    return `"${cell.replace(/"/g, '""')}"`;
  }
  return cell;
}

export function toCsvRow(cells: string[]): string {
  return cells.map(csvEscape).join(",");
}

/** Excel 向け UTF-8 BOM */
export const CSV_BOM = "\uFEFF";
