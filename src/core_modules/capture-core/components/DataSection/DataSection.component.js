// @flow
import React, { type ComponentType } from 'react';
import { colors, spacersNum } from '@dhis2/ui';
import { withStyles } from '@material-ui/core';
import type { Props } from './dataSection.type';


const styles = {
    sectionWrapper: {
        border: `1px solid ${colors.grey300}`,
        borderRadius: '3px',
        marginBottom: spacersNum.dp16,
    },
    sectionHeader: {
        backgroundColor: colors.grey300,
        color: '#404B5A',
        fontSize: 12,
        width: 'fit-content',
        padding: 4,
    },

};

const DataSectionPlain = ({ sectionName, children, classes, dataTest }: Props) => (
    <div
        data-test={dataTest}
        className={classes.sectionWrapper}
    >
        <div className={classes.sectionHeader}>{sectionName}</div>
        {children}
    </div>
);


export const DataSection: ComponentType<$Diff<Props, CssClasses>> = withStyles(styles)(DataSectionPlain);
