import type { CsvColumn } from './csvExport/buildCsv';

export type ViewExportFetchResult = {
    records: Array<{ id: string; record: { [key: string]: any } }>;
    truncated?: boolean;
    error?: string;
};

export type ViewExportFetcher = (args: {
    onProgress: (loaded: number, total?: number) => void;
    isCancelled: () => boolean;
}) => Promise<ViewExportFetchResult>;

export type Props = {
    request?: { url: string; queryParams?: any };
    open: boolean;
    onClose: () => void;
    columns?: Array<CsvColumn>;
    onFetchAllForView?: ViewExportFetcher;
    fileNameBase?: string;
};

export type PlainProps = {
    open: boolean;
    onClose: () => void;
    absoluteApiPath: string;
    request?: { url: string; queryParams?: any };
    columns?: Array<CsvColumn>;
    onFetchAllForView?: ViewExportFetcher;
    fileNameBase?: string;
};
