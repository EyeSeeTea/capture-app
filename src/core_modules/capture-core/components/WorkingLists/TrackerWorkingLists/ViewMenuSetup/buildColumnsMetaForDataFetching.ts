import type {
    TeiColumnsMetaForDataFetching,
    TrackerWorkingListsColumnConfig,
    TrackerWorkingListsColumnConfigs,
} from '../types';

export const buildColumnsMetaForDataFetching = (
    defaultColumns: TrackerWorkingListsColumnConfigs,
): TeiColumnsMetaForDataFetching =>
    new Map(
        defaultColumns.map((defaultColumn: TrackerWorkingListsColumnConfig) => {
            const { id, type, visible, apiViewName, searchOperator, minCharactersToSearch } = defaultColumn;
            const mainProperty = 'mainProperty' in defaultColumn &&
                defaultColumn.mainProperty &&
                typeof (defaultColumn as any).mainProperty === 'boolean'
                ? defaultColumn.mainProperty
                : undefined;
            const additionalColumn = defaultColumn.additionalColumn ? defaultColumn.additionalColumn : undefined;

            return [
                id,
                {
                    id,
                    type,
                    visible,
                    mainProperty,
                    additionalColumn,
                    apiViewName,
                    searchOperator,
                    minCharactersToSearch,
                },
            ];
        }),
    );
