const UTF8_BOM = '﻿';
const ROW_SEPARATOR = '\r\n';

const sanitizeFileName = (name: string): string =>
    name.replace(/[^\w.\-]+/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '') || 'download';

export const downloadCsvRows = (rows: Array<string>, fileName: string) => {
    const parts: Array<string> = [UTF8_BOM];
    rows.forEach((row, index) => {
        parts.push(row);
        if (index < rows.length - 1) parts.push(ROW_SEPARATOR);
    });
    const blob = new Blob(parts, { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = sanitizeFileName(fileName);
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
};
