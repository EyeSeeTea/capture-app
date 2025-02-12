// @flow

export type PlainProps = {|
    dataEntryId: string,
    itemId: string,
    trackedEntityName: string,
    saveAttempted: boolean,
    formFoundation: any,
    onCancel: () => void,
    onSave: () => void,
    onUpdateFormField: () => void,
    onUpdateFormFieldAsync: (innerAction: ReduxAction<any, any>) => void,
    onGetValidationContext: () => Object,
    modalState: string,
    errorsMessages: Array<{ id: string, message: string }>,
    warningsMessages: Array<{ id: string, message: string }>,
|};

export type Props = {|
    programAPI: any,
    orgUnitId: string,
    onCancel: () => void,
    onDisable: () => void,
    clientAttributesWithSubvalues: Array<any>,
    trackedEntityInstanceId: string,
    onSaveSuccessActionType?: string,
    onSaveErrorActionType?: string,
    modalState: string,
    onSaveExternal?: (eventServerValues: any, uid: string) => void,
    userRoles: Array<string>,
|};
