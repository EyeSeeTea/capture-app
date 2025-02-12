// @flow
import React, { type ComponentType, useState, useCallback } from 'react';
import { withStyles } from '@material-ui/core';
import i18n from '@dhis2/d2-i18n';
// $FlowFixMe
import { colors,
    spacersNum,
    DataTableBody,
    DataTableHead,
    DataTableFoot,
    DataTable,
    DataTableRow,
    DataTableCell,
    DataTableColumnHeader,
    Button,
    IconAdd24,
    Tooltip,
} from '@dhis2/ui';
import { sortDataFromEvent } from './hooks/sortFuntions';
import { useComputeDataFromEvent, useComputeHeaderColumn, formatRowForView } from './hooks/useEventList';
import { DEFAULT_NUMBER_OF_ROW, SORT_DIRECTION } from './hooks/constants';
import type { Props } from './stageDetail.types';


const styles = {
    row: {
        maxWidth: '100%',
        whiteSpace: 'nowrap',
        cursor: 'pointer',
    },
    rowDisabled: {
        cursor: 'not-allowed',
        opacity: 0.5,
    },
    container: {
        display: 'flex',
        marginRight: spacersNum.dp16,
        marginLeft: spacersNum.dp16,
        marginBottom: spacersNum.dp16,
        backgroundColor: colors.grey200,
        alignItems: 'center',
        overflowX: 'auto',
    },
    button: {
        marginRight: spacersNum.dp8,
    },
    hidenButton: { display: 'none !important' },
    icon: {
        position: 'absolute',
        left: spacersNum.dp8,
        top: '1px',
    },
    label: {
        paddingLeft: spacersNum.dp32,
    },
};

const StageDetailPlain = (props: Props) => {
    const {
        events,
        eventName,
        stageId,
        dataElements,
        hideDueDate = false,
        repeatable = false,
        onEventClick,
        onViewAll,
        onCreateNew,
        classes } = props;
    const defaultSortState = {
        columnName: 'status',
        sortDirection: SORT_DIRECTION.DESC,
    };
    const headerColumns = useComputeHeaderColumn(dataElements, hideDueDate);
    const { loading, value: dataSource, error } = useComputeDataFromEvent(dataElements, events);


    const [{ columnName, sortDirection }, setSortInstructions] = useState(defaultSortState);
    const [displayedRowNumber, setDisplayedRowNumber] = useState(DEFAULT_NUMBER_OF_ROW);

    const getSortDirection = column => (column.id === columnName ? sortDirection : column.sortDirection);
    const onSortIconClick = ({ name, direction }) => {
        if (direction === SORT_DIRECTION.DEFAULT && name !== defaultSortState.columnName) {
            setSortInstructions(defaultSortState);
        } else {
            setSortInstructions({
                columnName: name,
                sortDirection: direction,
            });
        }
    };

    const handleViewAll = useCallback(() => {
        onViewAll(stageId);
    }, [onViewAll, stageId]);

    const handleCreateNew = useCallback(() => {
        onCreateNew(stageId);
    }, [onCreateNew, stageId]);

    function renderHeader() {
        const headerCells = headerColumns
            .map(column => (
                <DataTableColumnHeader
                    key={column.id}
                    name={column.id}
                    sortDirection={getSortDirection(column)}
                    onSortIconClick={column.sortDirection && onSortIconClick}
                >
                    {column.header}
                </DataTableColumnHeader>
            ));
        return (
            <DataTableRow
                className={classes.row}
            >
                {headerCells}
            </DataTableRow>
        );
    }

    function renderRows() {
        if (!dataSource || loading) {
            return null;
        }
        return dataSource
            .sort((dataA, dataB) => {
                const { type } = headerColumns.find(col => col.id === columnName) || {};
                // $FlowFixMe
                return sortDataFromEvent({ dataA, dataB, type, columnName, direction: sortDirection });
            })
            .slice(0, displayedRowNumber)
            .map(row => formatRowForView(row, dataElements))
            .map((row: Object) => {
                const dataTableProgramStage = events[0].programStage;

                const cells = headerColumns.map(({ id }) => (
                    <Tooltip
                        key={`${id}-${row.id}`}
                        content={i18n.t('This event is not yet preserved and cannot be edited')}
                        closeDelay={50}
                    >
                        {({ onMouseOver, onMouseOut, ref }) => (
                            <DataTableCell
                                key={id}
                                onClick={() => !row.pendingApiResponse && onEventClick(row.id, dataTableProgramStage)}
                                ref={(tableCell) => {
                                    if (tableCell && row.pendingApiResponse) {
                                        tableCell.onmouseover = onMouseOver;
                                        tableCell.onmouseout = onMouseOut;
                                        ref.current = tableCell;
                                    }
                                }}
                            >
                                <div>
                                    { // $FlowFixMe
                                        row[id]
                                    }
                                </div>
                            </DataTableCell>
                        )}
                    </Tooltip>
                ));


                return (
                    <DataTableRow
                        className={!row.pendingApiResponse ? classes.row : classes.rowDisabled}
                        key={row.id}
                    >
                        {cells}
                    </DataTableRow>
                );
            });
    }

    function renderFooter() {
        const renderShowMoreButton = () => (events.length > DEFAULT_NUMBER_OF_ROW
            && displayedRowNumber < events.length ? <Button
                small
                secondary
                dataTest="show-more-button"
                className={classes.button}
                onClick={() => {
                    const nextRowIndex = Math.min(events.length, displayedRowNumber + DEFAULT_NUMBER_OF_ROW);
                    setDisplayedRowNumber(nextRowIndex);
                }}
            >
                {i18n.t('Show {{ rest }} more', {
                    rest: Math.min(events.length - displayedRowNumber, DEFAULT_NUMBER_OF_ROW),
                })}
            </Button>
            : null);

        const renderResetButton = () => (displayedRowNumber > DEFAULT_NUMBER_OF_ROW ? <Button
            small
            secondary
            dataTest="reset-button"
            className={classes.button}
            onClick={() => { setDisplayedRowNumber(DEFAULT_NUMBER_OF_ROW); }}
        >{i18n.t('Reset list')}</Button> : null);

        const renderViewAllButton = () => (events.length > 1 ? <Button
            small
            secondary
            dataTest="view-all-button"
            className={classes.hidenButton} // DHIS2-11733: hide the button until the page is fully implemented
            onClick={handleViewAll}
        >{i18n.t('Go to full {{ eventName }}', { eventName, interpolation: { escapeValue: false } })}</Button> : null);

        const renderCreateNewButton = () => {
            const shouldDisableCreateNew = !repeatable && events.length > 0;

            return (<Button
                small
                secondary
                disabled={shouldDisableCreateNew}
                className={classes.button}
                dataTest="create-new-button"
                onClick={handleCreateNew}
            >
                <Tooltip
                    content={i18n.t('This stage can only have one event')}
                    closeDelay={50}
                >
                    {({ onMouseOver, onMouseOut, ref }) => (
                        <div ref={(divRef) => {
                            if (divRef && shouldDisableCreateNew) {
                                divRef.onmouseover = onMouseOver;
                                divRef.onmouseout = onMouseOut;
                                ref.current = divRef;
                            }
                        }}
                        >
                            <div className={classes.icon}><IconAdd24 /></div>
                            <div className={classes.label}>
                                {i18n.t('New {{ eventName }} event', {
                                    eventName, interpolation: { escapeValue: false },
                                })}
                            </div>
                        </div>
                    )}
                </Tooltip>
            </Button>);
        };

        return (
            <DataTableRow>
                <DataTableCell colSpan={`${headerColumns.length}`}>
                    {renderShowMoreButton()}
                    {renderViewAllButton()}
                    {renderCreateNewButton()}
                    {renderResetButton()}
                </DataTableCell>
            </DataTableRow>
        );
    }

    if (error) {
        return (
            <div>
                {i18n.t('Events could not be retrieved. Please try again later.')}
            </div>
        );
    }
    return (
        <div className={classes.container}>
            <DataTable
                className={classes.table}
            >
                <DataTableHead>
                    {renderHeader()}
                </DataTableHead>
                <DataTableBody>
                    {renderRows()}
                </DataTableBody>
                <DataTableFoot>
                    {renderFooter()}
                </DataTableFoot>
            </DataTable>
        </div>
    );
};

export const StageDetail: ComponentType<$Diff<Props, CssClasses>> = withStyles(styles)(StageDetailPlain);
