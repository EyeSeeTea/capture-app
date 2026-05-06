import React, { useCallback, useMemo, useState } from 'react';
import { v4 as uuid } from 'uuid';
import { useSelector } from 'react-redux';
import { useConfig, useDataEngine } from '@dhis2/app-runtime';
import { buildUrl } from 'capture-core-utils';
import { makeQuerySingleResource } from 'capture-core/utils/api';
import i18n from '@dhis2/d2-i18n';
import { TrackerWorkingListsTopBarActionsSetup } from '../ActionsSetup';
import type { CustomMenuContents } from '../../WorkingListsBase';
import type { Props } from './trackerWorkingListsViewMenuSetup.types';
import { DownloadDialog, useColumns, useSelectedRowsController } from '../../WorkingListsCommon';
import { useDefaultColumnConfig } from '../Setup/hooks';
import { computeDownloadRequest } from './downloadRequest';
import { fetchAllTeisForExport } from './fetchAllTeisForExport';
import { buildColumnsMetaForDataFetching } from './buildColumnsMetaForDataFetching';
import { convertToClientConfig } from '../helpers/TEIFilters';
import { TrackedEntityBulkActions } from '../TrackedEntityBulkActions';
import type { TrackerWorkingListsColumnConfig, TrackerWorkingListsColumnConfigs } from '../types';

type WorkingListsState = {
    workingLists: { [storeId: string]: { currentRequest?: { url: string; queryParams?: any } } };
    workingListsColumnsOrder: { [storeId: string]: Array<{ id: string; visible: boolean }> | undefined };
};

export const TrackerWorkingListsViewMenuSetup = ({
    onLoadView,
    onUpdateList,
    storeId,
    program,
    programStageId,
    orgUnitId,
    recordsOrder,
    records,
    onOpenBulkDataEntryPlugin,
    ...passOnProps
}: Props) => {
    const [customUpdateTrigger, setCustomUpdateTrigger] = useState<string>();
    const {
        selectedRows,
        clearSelection,
        selectAllRows,
        selectionInProgress,
        toggleRowSelected,
        allRowsAreSelected,
        removeRowsFromSelection,
    } = useSelectedRowsController({ recordIds: recordsOrder });
    const downloadRequest = useSelector(
        (state: WorkingListsState) => state.workingLists[storeId]?.currentRequest,
    );
    const customColumnOrder = useSelector(
        (state: WorkingListsState) => state.workingListsColumnsOrder?.[storeId],
    );
    const defaultColumns = useDefaultColumnConfig(program, orgUnitId, programStageId);
    const computedColumns = useColumns<TrackerWorkingListsColumnConfigs>(customColumnOrder, defaultColumns);
    const exportColumns = useMemo(
        () =>
            (computedColumns || []).map((column: TrackerWorkingListsColumnConfig) => ({
                id: column.id,
                header: column.header,
                visible: column.visible,
                type: column.type,
                options: column.options ?? null,
            })),
        [computedColumns],
    );
    const columnsMetaForDataFetching = useMemo(
        () => buildColumnsMetaForDataFetching(defaultColumns),
        [defaultColumns],
    );
    const dataEngine = useDataEngine();
    const { baseUrl, apiVersion } = useConfig();
    const [downloadDialogOpen, setDownloadDialogOpenStatus] = useState(false);
    const customListViewMenuContents: CustomMenuContents = useMemo(() => {
        if (programStageId || !orgUnitId) {
            return [];
        }

        return [
            {
                key: 'downloadData',
                clickHandler: () => setDownloadDialogOpenStatus(true),
                element: i18n.t('Download data...'),
            },
        ];
    }, [setDownloadDialogOpenStatus, programStageId, orgUnitId]);

    const handleCloseDialog = useCallback(() => {
        setDownloadDialogOpenStatus(false);
    }, [setDownloadDialogOpenStatus]);

    const injectDownloadRequestToLoadView = useCallback(
        async (selectedTemplate: any, context: any, meta: any) => {
            const { columnsMetaForDataFetching: injectedMeta, filtersOnlyMetaForDataFetching } = meta;
            const querySingleResource = makeQuerySingleResource(dataEngine.query.bind(dataEngine));
            const clientConfig = await convertToClientConfig(
                selectedTemplate,
                injectedMeta,
                querySingleResource,
            );
            const currentRequest = computeDownloadRequest({
                clientConfig,
                context: {
                    programId: context.programId,
                    orgUnitId: context.orgUnitId,
                    storeId,
                },
                meta: { columnsMetaForDataFetching: injectedMeta },
                filtersOnlyMetaForDataFetching,
            });

            return onLoadView(selectedTemplate, { ...context, currentRequest }, meta);
        },
        [onLoadView, dataEngine, storeId],
    );

    const injectDownloadRequestToUpdateList = useCallback(
        (queryArgs: any, meta: any) => {
            const { lastTransaction, columnsMetaForDataFetching: injectedMeta, filtersOnlyMetaForDataFetching } = meta;
            const currentRequest = computeDownloadRequest({
                clientConfig: queryArgs,
                context: {
                    programId: queryArgs.programId,
                    orgUnitId: queryArgs.orgUnitId,
                    storeId,
                },
                meta: { columnsMetaForDataFetching: injectedMeta },
                filtersOnlyMetaForDataFetching,
            });
            return onUpdateList(queryArgs, { ...meta, currentRequest }, lastTransaction);
        },
        [onUpdateList, storeId],
    );

    const handleFetchAllForView = useCallback(
        async ({ onProgress, isCancelled }: {
            onProgress: (loaded: number, total?: number) => void;
            isCancelled: () => boolean;
        }) => {
            if (!downloadRequest) {
                return { records: [] };
            }
            const querySingleResource = makeQuerySingleResource(dataEngine.query.bind(dataEngine));
            const absoluteApiPath = buildUrl(baseUrl, `api/${apiVersion}`);
            return fetchAllTeisForExport({
                querySingleResource,
                absoluteApiPath,
                baseQueryParams: downloadRequest.queryParams || {},
                programId: program.id,
                columnsMetaForDataFetching,
                onProgress,
                isCancelled,
            });
        },
        [dataEngine, downloadRequest, program.id, baseUrl, apiVersion, columnsMetaForDataFetching],
    );

    const handleCustomUpdateTrigger = useCallback((disableClearSelection?: boolean) => {
        const id = uuid();
        setCustomUpdateTrigger(id);
        if (!disableClearSelection) {
            clearSelection();
        }
    }, [clearSelection]);

    const TrackedEntityBulkActionsComponent = useMemo(() => (
        <TrackedEntityBulkActions
            programId={program.id}
            programDataWriteAccess={program.access.data.write}
            programStageId={programStageId}
            stages={program.stages}
            selectedRows={selectedRows}
            onClearSelection={clearSelection}
            onUpdateList={handleCustomUpdateTrigger}
            removeRowsFromSelection={removeRowsFromSelection}
            onOpenBulkDataEntryPlugin={onOpenBulkDataEntryPlugin}
            recordsOrder={recordsOrder}
        />
    ), [
        program,
        programStageId,
        selectedRows,
        clearSelection,
        handleCustomUpdateTrigger,
        removeRowsFromSelection,
        onOpenBulkDataEntryPlugin,
        recordsOrder,
    ]);

    return (
        <>
            <TrackerWorkingListsTopBarActionsSetup
                {...passOnProps}
                customUpdateTrigger={customUpdateTrigger}
                program={program}
                orgUnitId={orgUnitId}
                recordsOrder={recordsOrder}
                records={records}
                programStageId={programStageId}
                customListViewMenuContents={customListViewMenuContents}
                onLoadView={injectDownloadRequestToLoadView}
                onUpdateList={injectDownloadRequestToUpdateList}
                selectedRows={selectedRows}
                allRowsAreSelected={allRowsAreSelected}
                selectionInProgress={selectionInProgress}
                onSelectAll={selectAllRows}
                onRowSelect={toggleRowSelected}
                bulkActionBarComponent={TrackedEntityBulkActionsComponent}
                onOpenBulkDataEntryPlugin={onOpenBulkDataEntryPlugin}
            />
            <DownloadDialog
                open={downloadDialogOpen}
                onClose={handleCloseDialog}
                request={downloadRequest}
                columns={exportColumns}
                onFetchAllForView={handleFetchAllForView}
                fileNameBase={`${program.shortName || program.name || 'tracked-entities'}-view`}
            />
        </>
    );
};
