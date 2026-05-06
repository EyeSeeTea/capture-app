import type { PagingTotals } from '../types';

export type Props = PagingTotals & {
    rowCountPage: number;
    rowsPerPage: number;
    currentPage: number;
    onChangePage: (pageNumber: number) => void;
    onChangeRowsPerPage: (rowsPerPage: number) => void;
};
