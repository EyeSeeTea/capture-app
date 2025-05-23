// @flow
import type { ComponentType } from 'react';
import type { CardDataElementsInformation } from '../../../Pages/Search/SearchResults/SearchResults.types';

type AttributeValues = {[id: string]: any};

export type ExistingUniqueValueDialogActionsComponent = ComponentType<{ attributeValues: AttributeValues, teiId: string }>;

export type Props = {
    attributeValues: AttributeValues,
    teiId: string,
    dataElements: CardDataElementsInformation,
    onCancel: () => void,
    programId?: string,
    ExistingUniqueValueDialogActions?: ExistingUniqueValueDialogActionsComponent,
    ...CssClasses,
};
