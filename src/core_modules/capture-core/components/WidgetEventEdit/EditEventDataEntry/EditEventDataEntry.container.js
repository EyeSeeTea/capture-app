// @flow
import uuid from 'uuid/v4';
import { connect } from 'react-redux';
import { batchActions } from 'redux-batched-actions';
import type { OrgUnit } from 'capture-core-utils/rulesEngine';
import { EditEventDataEntryComponent } from './EditEventDataEntry.component';
import { withLoadingIndicator } from '../../../HOC/withLoadingIndicator';
import {
    startAsyncUpdateFieldForEditEvent,
    startRunRulesOnUpdateForEditSingleEvent,
    batchActionTypes,
} from '../DataEntry/editEventDataEntry.actions';
import { type RenderFoundation } from '../../../metaData';

import {
    setCurrentDataEntry, startRunRulesPostUpdateField,
} from '../../DataEntry/actions/dataEntry.actions';

import {
    requestSaveEditEventDataEntry,
    cancelEditEventDataEntry,
    requestDeleteEventDataEntry,
} from './editEventDataEntry.actions';

import {
    viewEventIds,
} from '../../Pages/ViewEvent/EventDetailsSection/eventDetails.actions';

import { deriveURLParamsFromLocation } from '../../../utils/routing/deriveURLParamsFromLocation';


const mapStateToProps = (state: ReduxState) => {
    const eventDetailsSection = state.viewEventPage.eventDetailsSection || {};
    return {
        ready: !state.activePage.isDataEntryLoading && !eventDetailsSection.loading,
    };
};

const mapDispatchToProps = (dispatch: ReduxDispatch): any => ({
    onUpdateDataEntryField: (orgUnit: OrgUnit) => (innerAction: ReduxAction<any, any>) => {
        const { dataEntryId, itemId } = innerAction.payload;
        const uid = uuid();
        dispatch(batchActions([
            innerAction,
            startRunRulesPostUpdateField(dataEntryId, itemId, uid),
            startRunRulesOnUpdateForEditSingleEvent({ ...innerAction.payload, uid, orgUnit }),
        ], batchActionTypes.UPDATE_DATA_ENTRY_FIELD_EDIT_SINGLE_EVENT_ACTION_BATCH));
    },
    onUpdateField: (orgUnit: OrgUnit) => (innerAction: ReduxAction<any, any>) => {
        const { dataEntryId, itemId } = innerAction.payload;
        const uid = uuid();

        dispatch(batchActions([
            innerAction,
            startRunRulesPostUpdateField(dataEntryId, itemId, uid),
            startRunRulesOnUpdateForEditSingleEvent({ ...innerAction.payload, uid, orgUnit }),
        ], batchActionTypes.UPDATE_FIELD_EDIT_SINGLE_EVENT_ACTION_BATCH));
    },
    onStartAsyncUpdateField: (orgUnit: OrgUnit) => (
        innerAction: ReduxAction<any, any>,
        dataEntryId: string,
        itemId: string,
    ) => {
        const onAsyncUpdateSuccess = (successInnerAction: ReduxAction<any, any>) => {
            const uid = uuid();
            return batchActions([
                successInnerAction,
                startRunRulesPostUpdateField(dataEntryId, itemId, uid),
                startRunRulesOnUpdateForEditSingleEvent({ ...successInnerAction.payload, dataEntryId, itemId, uid, orgUnit }),
            ], batchActionTypes.UPDATE_FIELD_EDIT_SINGLE_EVENT_ACTION_BATCH);
        };
        const onAsyncUpdateError = (errorInnerAction: ReduxAction<any, any>) => errorInnerAction;

        dispatch(startAsyncUpdateFieldForEditEvent(innerAction, onAsyncUpdateSuccess, onAsyncUpdateError));
    },
    onSave: (orgUnit: OrgUnit) => (eventId: string, dataEntryId: string, formFoundation: RenderFoundation) => {
        window.scrollTo(0, 0);
        dispatch(requestSaveEditEventDataEntry(eventId, dataEntryId, formFoundation, orgUnit));
    },
    onCancel: () => {
        window.scrollTo(0, 0);
        dispatch(batchActions([
            cancelEditEventDataEntry(),
            setCurrentDataEntry(viewEventIds.dataEntryId, viewEventIds.itemId),
        ]));
    },
    onDelete: () => {
        const { eventId, programId, orgUnitId, teiId, enrollmentId } = deriveURLParamsFromLocation();
        dispatch(requestDeleteEventDataEntry({ eventId, programId, orgUnitId, teiId, enrollmentId }));
    },
});

// $FlowFixMe[missing-annot] automated comment
export const EditEventDataEntry = connect(mapStateToProps, mapDispatchToProps)(
    withLoadingIndicator()(EditEventDataEntryComponent),
);
