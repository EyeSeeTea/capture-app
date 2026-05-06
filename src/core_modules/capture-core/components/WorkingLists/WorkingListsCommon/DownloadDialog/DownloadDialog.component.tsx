import React, { useCallback, useRef, useState } from 'react';
import i18n from '@dhis2/d2-i18n';
import { withStyles, type WithStyles } from 'capture-core-utils/styles';
import { featureAvailable, FEATURES } from 'capture-core-utils';
import { Button, CircularLoader, colors, Modal, ModalTitle, ModalContent, ModalActions } from '@dhis2/ui';
import type { PlainProps } from './DownloadDialog.types';
import { buildCsvRows } from './csvExport/buildCsv';
import { downloadCsvRows } from './csvExport/downloadBlob';
import { HARD_ROW_CAP } from './csvExport/constants';

const VIEW_EXPORT_HELP_TEXT = i18n.t(
    // eslint-disable-next-line max-len
    '"Download current view as CSV" exports the list with the same columns and filters shown on screen, across all pages.',
);

const getStyles = {
    downloadLink: {
        textDecoration: 'none',
        outline: 'none',
    },
    downloadLinkContainer: {
        paddingInlineEnd: 5,
        paddingBottom: 5,
    },
    downloadContainer: {
        display: 'flex',
        flexWrap: 'wrap',
    },
    progress: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        paddingTop: 8,
    },
    error: {
        color: colors.red700,
        paddingTop: 8,
    },
    note: {
        paddingTop: 8,
        fontSize: 12,
        color: colors.grey700,
    },
};

type Props = PlainProps & WithStyles<typeof getStyles>;

const getUrlEncodedParamsString = (params: any) => {
    const { filter, ...restParams } = params;
    const searchParams = new URLSearchParams(restParams);

    if (filter) {
        filter.forEach((filterItem: string) => {
            searchParams.append('filter', filterItem);
        });
    }

    return searchParams.toString();
};

const DownloadDialogPlain = ({
    open,
    onClose,
    request,
    absoluteApiPath,
    columns,
    onFetchAllForView,
    fileNameBase,
    classes,
}: Props) => {
    const [exporting, setExporting] = useState(false);
    const [progress, setProgress] = useState<{ loaded: number; total?: number }>({ loaded: 0 });
    const [message, setMessage] = useState<string | null>(null);
    const cancelledRef = useRef(false);

    const viewExportReady = Boolean(
        onFetchAllForView && columns && columns.some(c => c.visible) && request?.url,
    );

    const handleDownloadCurrentView = useCallback(async () => {
        if (!onFetchAllForView || !columns) return;
        setMessage(null);
        setExporting(true);
        setProgress({ loaded: 0 });
        cancelledRef.current = false;
        try {
            const result = await onFetchAllForView({
                onProgress: (loaded, total) => setProgress({ loaded, total }),
                isCancelled: () => cancelledRef.current,
            });
            if (cancelledRef.current) {
                setExporting(false);
                return;
            }
            const rows = buildCsvRows(result.records, columns);
            const base = fileNameBase || 'tracked-entities';
            downloadCsvRows(rows, `${base}.csv`);
            const notices: Array<string> = [];
            if (result.truncated) {
                notices.push(
                    i18n.t('Export was truncated (maximum {{limit}} rows).', { limit: HARD_ROW_CAP }),
                );
            }
            if (result.error) {
                notices.push(i18n.t('Some rows may be missing: {{reason}}', { reason: result.error }));
            }
            if (notices.length > 0) setMessage(notices.join(' '));
        } catch (e: any) {
            setMessage(e?.message || i18n.t('Failed to export CSV'));
        } finally {
            setExporting(false);
        }
    }, [onFetchAllForView, columns, fileNameBase]);

    const handleCancelExport = useCallback(() => {
        cancelledRef.current = true;
        setExporting(false);
    }, []);

    const handleCloseDialog = useCallback(() => {
        if (exporting) return;
        setMessage(null);
        onClose();
    }, [exporting, onClose]);

    const renderButtons = () => {
        if (!request?.url) return null;
        const url = `${absoluteApiPath}/${request.url}`;
        const { pageSize, page, ...paramsFromRequest } = request.queryParams || {};
        const paramsObject = {
            ...paramsFromRequest,
            ...(featureAvailable(FEATURES.newPagingQueryParam)
                ? { paging: false }
                : { skipPaging: true }),
        };
        const searchParamsString = getUrlEncodedParamsString(paramsObject);

        return (
            <div className={classes.downloadContainer}>
                <div className={classes.downloadLinkContainer}>
                    <a
                        download={`${request.url}.json`}
                        href={`${url}.json?${searchParamsString}`}
                        className={classes.downloadLink}
                    >
                        <Button disabled={exporting}>{i18n.t('Download as JSON')}</Button>
                    </a>
                </div>
                <div className={classes.downloadLinkContainer}>
                    <a
                        download={`${request.url}.csv`}
                        href={`${url}.csv?${searchParamsString}`}
                        className={classes.downloadLink}
                    >
                        <Button disabled={exporting}>{i18n.t('Download as CSV')}</Button>
                    </a>
                </div>
                {onFetchAllForView && (
                    <div className={classes.downloadLinkContainer}>
                        <Button
                            onClick={handleDownloadCurrentView}
                            disabled={exporting || !viewExportReady}
                            dataTest="working-lists-download-current-view-csv"
                        >
                            {i18n.t('Download current view as CSV')}
                        </Button>
                    </div>
                )}
            </div>
        );
    };

    if (!open) {
        return null;
    }

    return (
        <Modal hide={!open} onClose={handleCloseDialog} position="middle" dataTest="working-lists-download-dialog">
            <ModalTitle>{i18n.t('Download with current filters')}</ModalTitle>
            <ModalContent>
                {renderButtons()}
                {onFetchAllForView && <div className={classes.note}>{VIEW_EXPORT_HELP_TEXT}</div>}
                {exporting && (
                    <div className={classes.progress}>
                        <CircularLoader small />
                        <span>
                            {progress.total
                                ? i18n.t('Downloading ({{loaded}} of ~{{total}})', {
                                    loaded: progress.loaded,
                                    total: progress.total,
                                })
                                : i18n.t('Downloading ({{loaded}})', { loaded: progress.loaded })}
                        </span>
                        <Button small secondary onClick={handleCancelExport}>
                            {i18n.t('Cancel')}
                        </Button>
                    </div>
                )}
                {message && <div className={classes.error}>{message}</div>}
            </ModalContent>
            <ModalActions>
                <Button onClick={handleCloseDialog} color="primary" disabled={exporting}>
                    {i18n.t('Close')}
                </Button>
            </ModalActions>
        </Modal>
    );
};

export const DownloadDialogComponent = withStyles(getStyles)(DownloadDialogPlain);
