// @flow

import * as React from 'react';
import i18n from '@dhis2/d2-i18n';
import { Paper } from '@material-ui/core';
import withStyles from '@material-ui/core/styles/withStyles';
import { Button } from '@dhis2/ui';
import { DataEntry } from './DataEntry/DataEntry.container';
import { EventsList } from './RecentlyAddedEventsList/RecentlyAddedEventsList.container';
import { useScopeTitleText } from '../../../../hooks/useScopeTitleText';
import { useCurrentProgramInfo } from '../../../../hooks/useCurrentProgramInfo';
import { useRulesEngineOrgUnit } from '../../../../hooks/useRulesEngineOrgUnit';
import { useLocationQuery } from '../../../../utils/routing';
import { useRulesEngine } from './useRulesEngine';
import type { PlainProps } from './NewEventDataEntryWrapper.types';

const getStyles = ({ typography }) => ({
    flexContainer: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    flexEnd: {
        justifyContent: 'flex-end',
        marginLeft: 'auto',
    },
    paper: {
        marginBottom: typography.pxToRem(10),
        padding: typography.pxToRem(10),
    },
    title: {
        padding: '8px 0 0px 8px',
        fontWeight: 500,
    },
    marginLeft: {
        marginLeft: 8,
    },
});

const NewEventDataEntryWrapperPlain = ({
    classes,
    formFoundation,
    formHorizontal,
    stage,
    onFormLayoutDirectionChange,
}: PlainProps) => {
    const { id: programId } = useCurrentProgramInfo();
    const orgUnitId = useLocationQuery().orgUnitId;
    const { orgUnit, error } = useRulesEngineOrgUnit(orgUnitId);
    const rulesReady = useRulesEngine({ programId, orgUnit, formFoundation });
    const titleText = useScopeTitleText(programId);

    if (error) {
        return error.errorComponent;
    }

    const checkIfCustomForm = () => {
        let isCustom = false;
        if (!formFoundation?.sections) { return isCustom; }
        formFoundation.sections.forEach((section) => {
            section.customForm ? isCustom = true : null;
        });
        return isCustom;
    };
    const isCustomForm = checkIfCustomForm();

    return rulesReady && (
        <Paper className={classes.paper}>
            <div className={classes.title} >
                {i18n.t('New {{titleText}}', {
                    titleText,
                    interpolation: { escapeValue: false },
                })}
            </div>

            <div className={classes.flexContainer}>
                <div className={classes.flexEnd}>
                    {
                        isCustomForm ?
                            null
                            :
                            <Button
                                onClick={() => onFormLayoutDirectionChange(!formHorizontal)}
                                small
                            >
                                {
                                    formHorizontal
                                        ?
                                        i18n.t('Switch to form view')
                                        :
                                        i18n.t('Switch to row view')
                                }
                            </Button>

                    }
                </div>
            </div>
            <div className={classes.marginLeft}>
                <DataEntry
                    stage={stage}
                    orgUnit={orgUnit}
                    formFoundation={formFoundation}
                    formHorizontal={formHorizontal}
                />
                <EventsList />
            </div>
        </Paper>
    );
};

export const NewEventDataEntryWrapperComponent = withStyles(getStyles)(NewEventDataEntryWrapperPlain);
