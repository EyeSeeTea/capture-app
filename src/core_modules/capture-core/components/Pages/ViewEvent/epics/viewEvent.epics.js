// @flow
import log from 'loglevel';
import { ofType } from 'redux-observable';
import { map, switchMap } from 'rxjs/operators';
import i18n from '@dhis2/d2-i18n';
import { errorCreator } from 'capture-core-utils';
import { getRulesEngineOrgUnit } from 'capture-core/rules/getRulesEngineOrgUnit';
import { getAssociatedOrgUnitGroups } from 'capture-core/MetaDataStoreUtils/getAssociatedOrgUnitGroups';
import { getApi } from '../../../../d2';
import { isSelectionsEqual } from '../../../App/isSelectionsEqual';
import { getErrorMessageAndDetails } from '../../../../utils/errors/getErrorMessageAndDetails';

import {
    actionTypes as viewEventActionTypes,
    eventFromUrlCouldNotBeRetrieved,
    eventFromUrlRetrieved,
    orgUnitRetrievedOnUrlUpdate,
    orgUnitCouldNotBeRetrievedOnUrlUpdate,
    startOpenEventForView,
    noWorkingListUpdateNeededOnBackToMainPage,
    updateWorkingListOnBackToMainPage,
    updateWorkingListPendingOnBackToMainPage,
    openViewEventPageFailed,
    initializeWorkingListsOnBackToMainPage,
} from '../ViewEventComponent/viewEvent.actions';
import { getEvent } from '../../../../events/eventRequests';
import {
    initializeNewRelationship,
} from '../../NewRelationship/newRelationship.actions';
import { getCategoriesDataFromEventAsync } from './getCategoriesDataFromEvent';
import { eventWorkingListsActionTypes } from '../../../WorkingLists/EventWorkingLists';
import { resetLocationChange } from '../../../LockedSelector/QuickSelector/actions/QuickSelector.actions';
import { buildUrlQueryString } from '../../../../utils/routing';

export const getEventOpeningFromEventListEpic = (action$: InputObservable) =>
    action$.pipe(
        ofType(eventWorkingListsActionTypes.VIEW_EVENT_PAGE_OPEN),
        switchMap(({ payload: { eventId } }) => getEvent(eventId)
            .then(eventContainer => (eventContainer ? Promise.all([eventContainer, getRulesEngineOrgUnit(eventContainer.event.orgUnitId)]) : []))
            .then(([eventContainer, orgUnit]) => {
                if (!eventContainer) {
                    return openViewEventPageFailed(
                        i18n.t('Event could not be loaded. Are you sure it exists?'));
                }
                return startOpenEventForView(eventContainer, orgUnit);
            })
            .catch((error) => {
                const { message, details } = getErrorMessageAndDetails(error);
                log.error(
                    errorCreator(
                        message ||
                        i18n.t('Event could not be loaded'))(details));
                return openViewEventPageFailed(
                    i18n.t('Event could not be loaded. Are you sure it exists?'));
            }),
        ),
    );

export const getEventFromUrlEpic = (action$: InputObservable, store: ReduxStore) =>
    action$.pipe(
        ofType(viewEventActionTypes.VIEW_EVENT_FROM_URL),
        switchMap((action) => {
            const eventId = action.payload.eventId;
            const prevProgramId = store.value.currentSelections.programId; // used to clear columns and filters in eventlist if program id is changed
            return getEvent(eventId)
                .then((eventContainer) => {
                    if (!eventContainer) {
                        return eventFromUrlCouldNotBeRetrieved(
                            i18n.t('Event could not be loaded. Are you sure it exists?'));
                    }
                    // need to retrieve category names from API (due to 50k category options requirement)
                    return getCategoriesDataFromEventAsync(eventContainer.event)
                        .then(categoriesData => eventFromUrlRetrieved(eventContainer, prevProgramId, categoriesData));
                })
                .catch((error) => {
                    const { message, details } = getErrorMessageAndDetails(error);
                    log.error(
                        errorCreator(
                            message ||
                            i18n.t('Event could not be loaded'))(details));
                    return eventFromUrlCouldNotBeRetrieved(
                        i18n.t('Event could not be loaded. Are you sure it exists?'));
                });
        }));

export const getOrgUnitOnUrlUpdateEpic = (action$: InputObservable) =>
    action$.pipe(
        ofType(viewEventActionTypes.EVENT_FROM_URL_RETRIEVED),
        switchMap((action) => {
            const eventContainer = action.payload.eventContainer;
            // change from organisationUnitGroups -> groups
            return Promise.all(
                [
                    getApi().get(`organisationUnits/${eventContainer.event.orgUnitId}`),
                    getAssociatedOrgUnitGroups(eventContainer.event.orgUnitId),
                ])
                .then(([orgUnit, groups]) => {
                    orgUnit.groups = groups;
                    return orgUnitRetrievedOnUrlUpdate(orgUnit, eventContainer);
                })
                .catch((error) => {
                    const { message, details } = getErrorMessageAndDetails(error);
                    log.error(errorCreator(
                        message ||
                        i18n.t('Organisation unit could not be loaded'))(details));
                    return orgUnitCouldNotBeRetrievedOnUrlUpdate(eventContainer);
                });
        }));

export const openViewPageLocationChangeEpic = (action$: InputObservable, _: ReduxStore, { history }: ApiUtils) =>
    action$.pipe(
        ofType(eventWorkingListsActionTypes.VIEW_EVENT_PAGE_OPEN),
        map(({ payload: { eventId } }) => {
            history.push(`/viewEvent?viewEventId=${eventId}`);
            return resetLocationChange();
        }));

export const backToMainPageEpic = (action$: InputObservable, store: ReduxStore) =>
    action$.pipe(
        ofType(viewEventActionTypes.START_GO_BACK_TO_MAIN_PAGE),
        // eslint-disable-next-line complexity
        map(() => {
            const state = store.value;

            if (!state.offline.online) {
                return noWorkingListUpdateNeededOnBackToMainPage();
            }
            const listId = state.workingListsTemplates.eventList && state.workingListsTemplates.eventList.currentListId;
            const listSelections = listId && state.workingListsContext[listId];
            if (!listSelections) {
                return initializeWorkingListsOnBackToMainPage();
            }
            const currentSelections = state.currentSelections;
            if (currentSelections.complete && !isSelectionsEqual(listSelections, currentSelections)) {
                return initializeWorkingListsOnBackToMainPage();
            }

            if (state.viewEventPage.eventHasChanged) {
                return updateWorkingListOnBackToMainPage();
            }

            if (state.viewEventPage.saveInProgress) {
                return updateWorkingListPendingOnBackToMainPage();
            }

            return noWorkingListUpdateNeededOnBackToMainPage();
        }));

export const backToMainPageLocationChangeEpic = (action$: InputObservable, store: ReduxStore, { history }: ApiUtils) =>
    action$.pipe(
        ofType(viewEventActionTypes.START_GO_BACK_TO_MAIN_PAGE),
        switchMap(() => {
            const state = store.value;
            const programId = state.currentSelections.programId;
            const orgUnitId = state.currentSelections.orgUnitId;
            const showaccessible = state.currentSelections.showaccessible;

            if (showaccessible && !orgUnitId) {
                history.push(`/?programId=${programId}&all`);
                return new Promise((resolve) => {
                    setTimeout(() => resolve(resetLocationChange()), 0);
                });
            }
            history.push(`/?${buildUrlQueryString({ programId, orgUnitId })}`);
            return new Promise((resolve) => {
                setTimeout(() => resolve(resetLocationChange()), 0);
            });
        }));

export const openAddRelationshipForViewEventEpic = (action$: InputObservable) =>
    action$.pipe(
        ofType(viewEventActionTypes.VIEW_EVENT_OPEN_NEW_RELATIONSHIP),
        map(() => initializeNewRelationship()));
