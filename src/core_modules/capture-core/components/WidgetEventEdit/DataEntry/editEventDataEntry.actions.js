// @flow
import i18n from '@dhis2/d2-i18n';
import type { OrgUnit } from 'capture-core-utils/rulesEngine';
import { actionCreator, actionPayloadAppender } from '../../../actions/actions.utils';
import { getDataEntryKey } from '../../DataEntry/common/getDataEntryKey';
import {
    getApplicableRuleEffectsForEventProgram,
    getApplicableRuleEffectsForTrackerProgram,
    updateRulesEffects,
} from '../../../rules';
import type { RenderFoundation, Program } from '../../../metaData';
import { effectMethods } from '../../../trackerOffline';
import { getEventDateValidatorContainers } from './fieldValidators/eventDate.validatorContainersGetter';
import {
    getConvertGeometryIn,
    convertGeometryOut,
    convertStatusIn,
    convertStatusOut,
} from '../../DataEntries';
import {
    getDataEntryMeta, validateDataEntryValues, getDataEntryNotes,
} from '../../DataEntry/actions/dataEntryLoad.utils';
import { loadEditDataEntry } from '../../DataEntry/actions/dataEntry.actions';
import { addFormData } from '../../D2Form/actions/form.actions';
import { EventProgram, TrackerProgram } from '../../../metaData/Program';
import { getStageFromEvent } from '../../../metaData/helpers/getStageFromEvent';
import { getEnrollmentForRulesEngine, getAttributeValuesForRulesEngine } from '../helpers';
import type { EnrollmentData, AttributeValue } from '../../Pages/common/EnrollmentOverviewDomain/useCommonEnrollmentDomainData';
import { prepareEnrollmentEventsForRulesEngine } from '../../../events/getEnrollmentEvents';

export const batchActionTypes = {
    UPDATE_DATA_ENTRY_FIELD_EDIT_SINGLE_EVENT_ACTION_BATCH: 'UpdateDataEntryFieldForEditSingleEventActionsBatch',
    UPDATE_FIELD_EDIT_SINGLE_EVENT_ACTION_BATCH: 'UpdateFieldForEditSingleEventActionsBatch',
    RULES_EFFECTS_ACTIONS_BATCH: 'RulesEffectsForEditSingleEventActionsBatch',
};

export const actionTypes = {
    OPEN_EVENT_FOR_EDIT_IN_DATA_ENTRY: 'OpenSingleEventForEditInDataEntry',
    PREREQUISITES_ERROR_OPENING_EVENT_FOR_EDIT_IN_DATA_ENTRY: 'PrerequisitesErrorOpeningSingleEventForEditInDataEntry',
    START_RUN_RULES_ON_UPDATE: 'StartRunRulesOnUpdateForEditSingleEvent',
    REQUEST_SAVE_RETURN_TO_MAIN_PAGE: 'RequestSaveReturnToMainPageForEditSingleEvent',
    START_SAVE_AFTER_RETURNED_TO_MAIN_PAGE: 'StartSaveAfterReturnedToMainPageForEditEvent',
    EVENT_UPDATED_AFTER_RETURN_TO_MAIN_PAGE: 'SingleEventUpdatedAfterReturnToMainPage',
    EVENT_UPDATE_FAILED_AFTER_RETURN_TO_MAIN_PAGE: 'SingleEventUpdateFailedAfterReturnToMainPage',
    START_CANCEL_SAVE_RETURN_TO_MAIN_PAGE: 'CancelUpdateForSingleEventReturnToMainPage',
    NO_WORKING_LIST_UPDATE_NEEDED_AFTER_CANCEL_UPDATE: 'NoWorkingListUpdateNeededAfterEventUpdateCancelled',
    UPDATE_WORKING_LIST_AFTER_CANCEL_UPDATE: 'UpdateWorkingListAfterEventUpdateCancelled',
};

export const editEventIds = {
    dataEntryId: 'singleEvent',
    itemId: 'editEvent',
};

function getLoadActions(
    dataEntryId: string,
    itemId: string,
    dataEntryValues: Object,
    formValues: Object,
    dataEntryPropsToInclude: Array<Object>,
    clientValuesForDataEntry: Object,
    extraProps: { [key: string]: any },
) {
    const dataEntryNotes = getDataEntryNotes(clientValuesForDataEntry);
    const key = getDataEntryKey(dataEntryId, itemId);
    const dataEntryMeta = getDataEntryMeta(dataEntryPropsToInclude);
    const dataEntryUI = validateDataEntryValues(dataEntryValues, dataEntryPropsToInclude);

    return [
        loadEditDataEntry({
            key,
            itemId,
            dataEntryId,
            dataEntryMeta,
            dataEntryValues,
            extraProps,
            dataEntryUI,
            dataEntryNotes,
        }),
        addFormData(key, formValues),
    ];
}

export const openEventForEditInDataEntry = ({
    loadedValues: {
        eventContainer,
        dataEntryValues,
        formValues,
    },
    orgUnit,
    foundation,
    program,
    enrollment,
    attributeValues,
}: {
    loadedValues: {
        eventContainer: Object,
        dataEntryValues: Object,
        formValues: Object,
    },
    orgUnit: OrgUnit,
    foundation: RenderFoundation,
    program: Program | EventProgram | TrackerProgram,
    enrollment?: EnrollmentData,
    attributeValues?: Array<AttributeValue>,
}) => {
    const dataEntryId = editEventIds.dataEntryId;
    const itemId = editEventIds.itemId;
    const dataEntryPropsToInclude = [
        {
            id: 'occurredAt',
            type: 'DATE',
            validatorContainers: getEventDateValidatorContainers(),
        },
        {
            clientId: 'geometry',
            dataEntryId: 'geometry',
            onConvertIn: getConvertGeometryIn(foundation),
            onConvertOut: convertGeometryOut,
        },
        {
            clientId: 'status',
            dataEntryId: 'complete',
            onConvertIn: convertStatusIn,
            onConvertOut: convertStatusOut,
        },
    ];
    const formId = getDataEntryKey(dataEntryId, itemId);
    const dataEntryActions =
        getLoadActions(
            dataEntryId,
            itemId,
            dataEntryValues,
            formValues,
            dataEntryPropsToInclude,
            eventContainer.event,
            {
                eventId: eventContainer.event.eventId,
            },
        );
    const currentEvent = { ...eventContainer.event, ...eventContainer.values };

    let effects;
    if (program instanceof TrackerProgram) {
        const stage = getStageFromEvent(eventContainer.event)?.stage;
        if (!stage) {
            throw Error(i18n.t('stage not found in rules execution'));
        }
        // TODO: Add attributeValues & enrollmentData
        effects = getApplicableRuleEffectsForTrackerProgram({
            program,
            stage,
            orgUnit,
            currentEvent,
            otherEvents: prepareEnrollmentEventsForRulesEngine(
                enrollment?.events.filter(event => event.event !== currentEvent.eventId),
            ),
            enrollmentData: getEnrollmentForRulesEngine(enrollment),
            attributeValues: getAttributeValuesForRulesEngine(attributeValues, program.attributes),
        });
    } else if (program instanceof EventProgram) {
        effects = getApplicableRuleEffectsForEventProgram({
            program,
            orgUnit,
            currentEvent,
        });
    }

    return [
        ...dataEntryActions,
        updateRulesEffects(effects, formId),
        actionCreator(actionTypes.OPEN_EVENT_FOR_EDIT_IN_DATA_ENTRY)(),
    ];
};

export const prerequisitesErrorOpeningEventForEditInDataEntry = (message: string) =>
    actionCreator(actionTypes.PREREQUISITES_ERROR_OPENING_EVENT_FOR_EDIT_IN_DATA_ENTRY)(message);

export const startRunRulesOnUpdateForEditSingleEvent = (actionData: { payload: Object}) =>
    actionCreator(actionTypes.START_RUN_RULES_ON_UPDATE)(actionData);

export const requestSaveReturnToMainPage = (itemId: string, dataEntryId: string, formFoundation: Object) =>
    actionCreator(actionTypes.REQUEST_SAVE_RETURN_TO_MAIN_PAGE)({ itemId, dataEntryId, formFoundation }, { skipLogging: ['formFoundation'] });

export const startSaveEditEventAfterReturnedToMainPage = (serverData: Object, selections: Object) =>
    actionCreator(actionTypes.START_SAVE_AFTER_RETURNED_TO_MAIN_PAGE)({ selections }, {
        offline: {
            effect: {
                url: 'tracker?async=false&importStrategy=UPDATE',
                method: effectMethods.POST,
                data: serverData,
            },
            commit: { type: actionTypes.EVENT_UPDATED_AFTER_RETURN_TO_MAIN_PAGE, meta: { selections } },
            rollback: { type: actionTypes.EVENT_UPDATE_FAILED_AFTER_RETURN_TO_MAIN_PAGE, meta: { selections } },
        },
    });

export const startCancelSaveReturnToMainPage = () =>
    actionCreator(actionTypes.START_CANCEL_SAVE_RETURN_TO_MAIN_PAGE)();

export const noWorkingListUpdateNeededAfterUpdateCancelled = () =>
    actionCreator(actionTypes.NO_WORKING_LIST_UPDATE_NEEDED_AFTER_CANCEL_UPDATE)();

export const updateWorkingListAfterUpdateCancelled = () =>
    actionCreator(actionTypes.UPDATE_WORKING_LIST_AFTER_CANCEL_UPDATE)();

export const startAsyncUpdateFieldForEditEvent = (
    innerAction: ReduxAction<any, any>,
    onSuccess: Function,
    onError: Function,
) =>
    actionPayloadAppender(innerAction)({ onSuccess, onError });

