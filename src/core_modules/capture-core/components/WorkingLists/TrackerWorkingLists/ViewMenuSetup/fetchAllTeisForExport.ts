import { handleAPIResponse, REQUESTED_ENTITIES } from 'capture-core/utils/api';
import type { QuerySingleResource } from 'capture-core/utils/api';
import { convertToClientTeis } from '../epics/teiViewEpics/helpers/getTeiListData/convertToClientTeis';
import { getSubvalues } from '../epics/teiViewEpics/helpers/getListDataCommon';
import { EXPORT_PAGE_SIZE, HARD_ROW_CAP } from '../../WorkingListsCommon/DownloadDialog/csvExport/constants';
import type { TeiColumnsMetaForDataFetching } from '../types';

const MAX_RETRIES_PER_PAGE = 2;
const RETRY_BACKOFF_MS = 800;

type ProgressCallback = (loaded: number, total?: number) => void;
type FetchAllArgs = {
    querySingleResource: QuerySingleResource;
    absoluteApiPath: string;
    baseQueryParams: { [key: string]: any };
    programId: string;
    columnsMetaForDataFetching: TeiColumnsMetaForDataFetching;
    onProgress?: ProgressCallback;
    isCancelled?: () => boolean;
};

export type FetchAllForExportResult = {
    records: Array<{ id: string; record: { [k: string]: any } }>;
    truncated?: boolean;
    error?: string;
};

const sleep = (ms: number) => new Promise<void>((resolve) => { setTimeout(resolve, ms); });

const fetchPageWithRetry = async (
    querySingleResource: QuerySingleResource,
    params: { [key: string]: any },
) => {
    let lastError: unknown;
    for (let attempt = 0; attempt <= MAX_RETRIES_PER_PAGE; attempt += 1) {
        try {
            // eslint-disable-next-line no-await-in-loop
            return await querySingleResource({ resource: 'tracker/trackedEntities', params });
        } catch (error) {
            lastError = error;
            if (attempt < MAX_RETRIES_PER_PAGE) {
                // eslint-disable-next-line no-await-in-loop
                await sleep(RETRY_BACKOFF_MS * (attempt + 1));
            }
        }
    }
    throw lastError;
};

// Intentionally imperative: paginated fetching with retries, cancellation and progress reporting.
// eslint-disable-next-line complexity
export const fetchAllTeisForExport = async ({
    querySingleResource,
    absoluteApiPath,
    baseQueryParams,
    programId,
    columnsMetaForDataFetching,
    onProgress,
    isCancelled,
}: FetchAllArgs): Promise<FetchAllForExportResult> => {
    const { page: _ignoredPage, pageSize: _ignoredSize, ...rest } = baseQueryParams || {};
    const columnsArray = [...columnsMetaForDataFetching.values()];
    const collected: Array<{ id: string; record: { [k: string]: any } }> = [];
    const addSubvalues = getSubvalues(querySingleResource, absoluteApiPath);

    let page = 1;
    let totalRows: number | undefined;
    let truncated = false;
    let errorMessage: string | undefined;

    const emitProgress = () => {
        if (!onProgress) return;
        const total = totalRows != null ? Math.min(totalRows, HARD_ROW_CAP) : undefined;
        onProgress(collected.length, total);
    };

    while (!(isCancelled && isCancelled())) {
        const params: { [key: string]: any } = { ...rest, page, pageSize: EXPORT_PAGE_SIZE };
        if (page === 1) {
            params.totalPages = true;
        }

        let response: any;
        try {
            // eslint-disable-next-line no-await-in-loop
            response = await fetchPageWithRetry(querySingleResource, params);
        } catch (error: any) {
            errorMessage = error?.message || 'Failed to fetch a page of tracked entities.';
            truncated = true;
            break;
        }

        const apiTeis = handleAPIResponse(REQUESTED_ENTITIES.trackedEntities, response);

        if (page === 1 && response?.pager) {
            if (typeof response.pager.total === 'number') {
                totalRows = response.pager.total;
            } else if (typeof response.pager.pageCount === 'number') {
                totalRows = response.pager.pageCount * EXPORT_PAGE_SIZE;
            }
        }

        const clientTeis = convertToClientTeis(apiTeis, columnsArray, programId);
        let clientTeisWithSubvalues: typeof clientTeis = clientTeis;
        try {
            // eslint-disable-next-line no-await-in-loop
            clientTeisWithSubvalues = await addSubvalues(clientTeis, columnsArray);
        } catch (error: any) {
            // Subvalue resolution is best-effort; fall back to the raw client TEIs.
            errorMessage = errorMessage
                || error?.message
                || 'Failed to resolve file/image subvalues on one or more rows.';
        }

        collected.push(...clientTeisWithSubvalues);
        emitProgress();

        if (collected.length >= HARD_ROW_CAP) {
            truncated = true;
            break;
        }
        if (apiTeis.length < EXPORT_PAGE_SIZE) break;
        page += 1;
    }

    return { records: collected, truncated, error: errorMessage };
};
