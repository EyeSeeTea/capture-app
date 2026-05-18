import i18n from '@dhis2/d2-i18n';
import { dataElementTypes } from '../../../../../metaData';

export type CsvColumnOption = { text: string; value: any };

export type CsvColumn = {
    id: string;
    header: string;
    visible: boolean;
    type?: string;
    options?: Array<CsvColumnOption> | null;
};

export type CsvRecord = { [id: string]: any };

const escapeCell = (raw: string) => `"${raw.replace(/"/g, '""')}"`;

const stringifyCoordinate = (value: any): string => {
    if (Array.isArray(value) && value.length >= 2) {
        const [lng, lat] = value;
        return `${lat}, ${lng}`;
    }
    if (value && typeof value === 'object') {
        if (value.latitude != null && value.longitude != null) {
            return `${value.latitude}, ${value.longitude}`;
        }
        if (value.coordinates && Array.isArray(value.coordinates)) {
            return stringifyCoordinate(value.coordinates);
        }
    }
    return String(value);
};

const extractFileName = (value: any): string => {
    if (value == null) return '';
    if (typeof value === 'object') {
        if (value.name) return String(value.name);
        if (value.url) return String(value.url);
        if (value.value !== undefined) return String(value.value);
    }
    return String(value);
};

const extractOrgUnit = (value: any): string => {
    if (value == null) return '';
    if (typeof value === 'object') {
        if (value.name) return String(value.name);
        if (value.displayName) return String(value.displayName);
        if (value.id) return String(value.id);
    }
    return String(value);
};

// Handles heterogeneous tracker values for CSV export in one place to preserve output compatibility.
// eslint-disable-next-line complexity
const formatPrimitive = (value: any, type?: string): string => {
    if (value == null) return '';
    if (typeof value === 'boolean') return value ? i18n.t('Yes') : i18n.t('No');

    switch (type) {
    case dataElementTypes.BOOLEAN:
        return value ? i18n.t('Yes') : i18n.t('No');
    case dataElementTypes.TRUE_ONLY:
        return i18n.t('Yes');
    case dataElementTypes.FILE_RESOURCE:
        return extractFileName(value);
    case dataElementTypes.IMAGE:
        if (value && typeof value === 'object') {
            return String(value.url || value.value || value.name || '');
        }
        return String(value);
    case dataElementTypes.ORGANISATION_UNIT:
        return extractOrgUnit(value);
    case dataElementTypes.COORDINATE:
    case dataElementTypes.POLYGON:
        return stringifyCoordinate(value);
    case dataElementTypes.ASSIGNEE:
        if (value && typeof value === 'object') {
            const name = value.name || value.displayName || '';
            const username = value.username ? ` (${value.username})` : '';
            return `${name}${username}`.trim();
        }
        return String(value);
    case dataElementTypes.STATUS:
        if (value && typeof value === 'object' && value.text) {
            return String(value.text);
        }
        return String(value);
    default:
        break;
    }

    if (Array.isArray(value)) return value.map(v => formatPrimitive(v, type)).join('; ');
    if (typeof value === 'object') {
        if (value.name) return String(value.name);
        if (value.displayName) return String(value.displayName);
        if (value.url) return String(value.url);
        if (value.value !== undefined) return String(value.value);
        if (value.id) return String(value.id);
        return JSON.stringify(value);
    }
    return String(value);
};

const lookupOption = (rawValue: any, options: Array<CsvColumnOption>): string => {
    const match = options.find(o => o.value === rawValue || String(o.value) === String(rawValue));
    return match ? String(match.text) : String(rawValue);
};

const formatWithOptions = (
    value: any,
    options: Array<CsvColumnOption>,
    type?: string,
): string => {
    if (value == null) return '';
    if (Array.isArray(value)) {
        return value.map(v => lookupOption(v, options)).join('; ');
    }
    if (type === dataElementTypes.MULTI_TEXT && typeof value === 'string') {
        return value
            .split(',')
            .map(part => part.trim())
            .filter(part => part.length > 0)
            .map(part => lookupOption(part, options))
            .join('; ');
    }
    return lookupOption(value, options);
};

const formatCell = (value: any, column: CsvColumn): string => {
    if (column.options && column.options.length > 0) {
        return formatWithOptions(value, column.options, column.type);
    }
    return formatPrimitive(value, column.type);
};

export const buildCsvRows = (
    records: Array<{ id: string; record: CsvRecord }>,
    columns: Array<CsvColumn>,
): Array<string> => {
    const visibleColumns = columns.filter(c => c.visible);
    const rows: Array<string> = [];
    rows.push(visibleColumns.map(c => escapeCell(c.header || c.id)).join(','));
    for (const { record } of records) {
        rows.push(visibleColumns.map(column => escapeCell(formatCell(record[column.id], column))).join(','));
    }
    return rows;
};

export const buildCsv = (
    records: Array<{ id: string; record: CsvRecord }>,
    columns: Array<CsvColumn>,
): string => buildCsvRows(records, columns).join('\r\n');
