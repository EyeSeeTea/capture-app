import * as React from 'react';
import i18n from '@dhis2/d2-i18n';
import {
    Pagination,
} from 'capture-ui';
import { withNavigation } from '../../Pagination/withDefaultNavigation';
import { withRowsPerPageSelector } from '../../Pagination/withRowsPerPageSelector';
import type { PagingTotals } from '../types';
import type { Props } from './listPaginationMain.types';

type PaginationWrappedProps = PagingTotals & {
    currentPage: number;
    rowsPerPage: number;
    rowsCountSelectorLabel?: string;
    nextPageButtonDisabled: boolean;
    onChangePage: (pageNumber: number) => void;
    onChangeRowsPerPage: (rowsPerPage: number) => void;
    disabled?: boolean;
};

const PaginationWrapped: React.ComponentType<PaginationWrappedProps> =
    withRowsPerPageSelector()(withNavigation()(Pagination)) as any;

export const ListPaginationMain = ({ rowCountPage, rowsPerPage, ...passOnProps }: Props) => (
    <PaginationWrapped
        {...passOnProps}
        rowsPerPage={rowsPerPage}
        rowsCountSelectorLabel={i18n.t('Rows per page')}
        nextPageButtonDisabled={!!(rowsPerPage > rowCountPage)}
    />
);
