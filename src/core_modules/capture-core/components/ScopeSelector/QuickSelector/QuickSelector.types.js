// @flow
import type { Node } from 'react';

export type Props = {
    selectedOrgUnitId: string,
    selectedProgramId: string,
    selectedCategories: Object,
    selectedOrgUnit: Object,
    classes: Object,
    onSetOrgUnit: (orgUnitId: string, orgUnitObject: Object) => void,
    onSetProgramId: (programId: string) => void,
    onSetCategoryOption?: (categoryId: string, categoryOptionId: string) => void,
    onResetOrgUnitId: () => void,
    onResetProgramId: (baseAction: ReduxAction<any, any>) => void,
    onResetCategoryOption?: (categoryId: string) => void,
    onResetAllCategoryOptions?: () => void,
    onStartAgain: () => void,
    onNewClick: () => void,
    onNewClickWithoutProgramId: () => void,
    onFindClick: () => void,
    onFindClickWithoutProgramId: () => void,
    children: Node,
};
