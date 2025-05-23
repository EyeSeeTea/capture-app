// @flow
// TODO: rewrite this component!!
import React, { PureComponent, type ComponentType } from 'react';
import i18n from '@dhis2/d2-i18n';
import { withStyles } from '@material-ui/core/styles';
import { Dialog, DialogTitle, DialogContent, DialogActions } from '@material-ui/core';
import { Button } from '@dhis2/ui';
import { getApi } from '../../../../../d2/d2Instance';
import type { Props } from './downloadDialog.types';

const getStyles = () => ({
    downloadLink: {
        textDecoration: 'none',
        outline: 'none',
    },
    downloadLinkContainer: {
        paddingRight: 5,
        paddingBottom: 5,
    },
    downloadContainer: {
        display: 'flex',
        flexWrap: 'wrap',
    },
});

class DownloadDialogPlain extends PureComponent<Props & CssClasses> {
    static getUrlEncodedParamsString(params: Object) {
        const { filter, ...restParams } = params;
        const searchParams = new URLSearchParams(restParams);

        if (filter) {
            filter.forEach((filterItem) => {
                searchParams.append('filter', filterItem);
            });
        }

        return searchParams.toString();
    }

    static getUrl() {
        const baseUrl = getApi().baseUrl;
        return `${baseUrl}/events/query`;
    }

    renderButtons() {
        const { request = {}, classes } = this.props;
        const url = DownloadDialogPlain.getUrl();
        const { pageSize, page, ...paramsFromRequest } = request.queryParams || {};
        const paramsObject = {
            ...paramsFromRequest,
            skipPaging: 'true',
        };
        const searchParamsString = DownloadDialogPlain.getUrlEncodedParamsString(paramsObject);

        return (
            <div
                className={classes.downloadContainer}
            >
                <div
                    className={classes.downloadLinkContainer}
                >
                    <a
                        download="events.json"
                        href={`${url}.json?${searchParamsString}`}
                        className={classes.downloadLink}
                    >
                        <Button>
                            {i18n.t('Download as JSON')}
                        </Button>
                    </a>
                </div>
                <div
                    className={classes.downloadLinkContainer}
                >
                    <a
                        download="events.xml"
                        href={`${url}.xml?${searchParamsString}`}
                        className={classes.downloadLink}
                    >
                        <Button>
                            {i18n.t('Download as XML')}
                        </Button>
                    </a>
                </div>
                <div>
                    <a
                        download="events.csv"
                        href={`${url}.csv?${searchParamsString}`}
                        className={classes.downloadLink}
                    >
                        <Button>
                            {i18n.t('Download as CSV')}
                        </Button>
                    </a>
                </div>
            </div>
        );
    }
    render() {
        const { open, onClose } = this.props;
        return (
            <span>
                <Dialog
                    open={!!open}
                    onClose={onClose}
                    fullWidth
                >
                    <DialogTitle>{i18n.t('Download with current filters')}</DialogTitle>
                    <DialogContent>
                        {this.renderButtons()}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={onClose} color="primary">
                            {i18n.t('Close')}
                        </Button>
                    </DialogActions>
                </Dialog>
            </span>
        );
    }
}

export const DownloadDialog: ComponentType<Props> = withStyles(getStyles)(DownloadDialogPlain);
