import React, { useMemo } from 'react';
import {
    FilterValuesContext,
    PaginationContext,
} from '../listView.context';
import { ListViewMain } from '../Main';
import type { Props } from './listViewContextBuilder.types';
import type { PaginationContextData } from '../types';

export const ListViewContextBuilder = ({
    filters,
    selectedRows,
    allRowsAreSelected,
    onRowSelect,
    onSelectAll,
    selectionInProgress,
    onChangePage,
    onChangeRowsPerPage,
    rowsPerPage,
    currentPage,
    total,
    pageCount,
    dataSource,
    ...passOnProps
}: Props) => {
    const paginationContextData = useMemo((): PaginationContextData => ({
        onChangePage,
        onChangeRowsPerPage,
        rowsPerPage,
        currentPage,
        rowCountPage: dataSource.length,
        total,
        pageCount,
    }), [
        onChangePage,
        onChangeRowsPerPage,
        rowsPerPage,
        currentPage,
        dataSource.length,
        total,
        pageCount,
    ]);

    return (
        <FilterValuesContext.Provider
            value={filters}
        >
            <PaginationContext.Provider
                value={paginationContextData}
            >
                <ListViewMain
                    {...passOnProps}
                    dataSource={dataSource}
                    selectedRows={selectedRows}
                    allRowsAreSelected={allRowsAreSelected}
                    onRowSelect={onRowSelect}
                    onSelectAll={onSelectAll}
                    isSelectionInProgress={selectionInProgress}
                />
            </PaginationContext.Provider>
        </FilterValuesContext.Provider>
    );
};

