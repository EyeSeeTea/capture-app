import * as React from 'react';
import i18n from '@dhis2/d2-i18n';
import defaultClasses from './table.module.css';

type Props = {
    currentPage: number;
    rowsCountSelector?: React.ReactNode | null | undefined;
    rowsCountSelectorLabel?: string | null | undefined;
    navigationElements: React.ReactNode;
    total?: number | null;
    pageCount?: number | null;
};

export class Pagination extends React.Component<Props> {
    static getRowsCountElement(
        rowsCountSelectorLabel?: string | null | undefined,
        rowsCountSelector?: React.ReactNode | null | undefined,
    ) {
        if (!rowsCountSelector) {
            return null;
        }

        return rowsCountSelectorLabel ? (
            <div
                className={defaultClasses.paginationRowsPerPageElementContainer}
            >
                {rowsCountSelectorLabel}:
                <span
                    className={defaultClasses.paginationRowsPerPageElement}
                >
                    {rowsCountSelector}
                </span>
            </div>
        ) : rowsCountSelector;
    }


    render() {
        const {
            currentPage,
            rowsCountSelector,
            rowsCountSelectorLabel,
            navigationElements,
            total,
            pageCount,
        } = this.props;

        const rowsCountElement = Pagination.getRowsCountElement(rowsCountSelectorLabel, rowsCountSelector);
        const pageLabel = pageCount != null
            ? i18n.t('Page {{currentPage}} of {{pageCount}}', { currentPage, pageCount })
            : i18n.t('Page {{currentPage}}', { currentPage });
        return (
            <div
                data-test="pagination"
                className={defaultClasses.pagination}
            >
                {rowsCountElement}
                {total != null && (
                    <div className={defaultClasses.paginationDisplayRowsContainer}>
                        {i18n.t('{{count}} result', { count: total }) as React.ReactNode}
                    </div>
                )}
                {
                    currentPage &&
                    <div className={defaultClasses.paginationDisplayRowsContainer}>
                        {pageLabel as React.ReactNode}
                    </div>
                }
                {navigationElements}
            </div>
        );
    }
}
