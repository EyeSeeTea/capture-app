import React, { useMemo } from 'react';
import {
    ListViewUpdaterContext,
} from '../../workingListsBase.context';
import type { Props } from './workingListsListViewUpdaterContextProvider.types';

export const WorkingListsListViewUpdaterContextProvider = ({
    rowsPerPage,
    currentPage,
    total,
    pageCount,
    onCancelUpdateList,
    customUpdateTrigger,
    forceUpdateOnMount,
    dirtyList,
    loadedOrgUnitId,
    children,
}: Props) => {
    const listViewUpdaterContextData = useMemo(() => ({
        rowsPerPage,
        currentPage,
        total,
        pageCount,
        onCancelUpdateList,
        customUpdateTrigger,
        forceUpdateOnMount,
        dirtyList,
        loadedOrgUnitId,
    }), [
        rowsPerPage,
        currentPage,
        total,
        pageCount,
        onCancelUpdateList,
        customUpdateTrigger,
        forceUpdateOnMount,
        dirtyList,
        loadedOrgUnitId,
    ]);

    return (
        <ListViewUpdaterContext.Provider
            value={listViewUpdaterContextData}
        >
            {children}
        </ListViewUpdaterContext.Provider>
    );
};
