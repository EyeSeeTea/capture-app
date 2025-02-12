// @flow
import { ofType } from 'redux-observable';
import uuid from 'uuid/v4';
import { pipe } from 'capture-core-utils';
import { map } from 'rxjs/operators';
import { batchActions } from 'redux-batched-actions';
import { convertFormToClient, convertClientToServer } from '../../../converters';
import { dataEntryActionTypes, updateTei, setTeiModalError, setTeiAttributeValues } from './dataEntry.actions';

const convertFn = pipe(convertFormToClient, convertClientToServer);
const geometryType = (key) => {
    const types = ['Point', 'None', 'Polygon'];
    return types.find(type => key.toLowerCase().includes(type.toLowerCase()));
};

const standardGeoJson = (geometry) => {
    if (!geometry) {
        return undefined;
    }
    if (Array.isArray(geometry)) {
        return {
            type: 'Polygon',
            coordinates: geometry,
        };
    } else if (geometry.longitude && geometry.latitude) {
        return {
            type: 'Point',
            coordinates: [geometry.longitude, geometry.latitude],
        };
    }
    return undefined;
};

const deriveAttributesFromFormValues = (formValues = {}) =>
    Object.keys(formValues)
        .filter(key => !geometryType(key))
        .map(key => ({ attribute: key, value: formValues[key] }));

const deriveGeometryFromFormValues = (formValues = {}) =>
    Object.keys(formValues)
        .filter(key => geometryType(key))
        .reduce((acc, currentKey) => standardGeoJson(formValues[currentKey]), undefined);

export const updateTeiEpic = (action$: InputObservable, store: ReduxStore) =>
    action$.pipe(
        ofType(dataEntryActionTypes.TEI_UPDATE_REQUEST),
        map((action) => {
            const uid = uuid();
            const { formsValues } = store.value;
            const {
                dataEntryId,
                itemId,
                orgUnitId,
                trackedEntityTypeId,
                trackedEntityInstanceId,
                formFoundation,
                onSaveExternal,
                onSaveSuccessActionType,
                onSaveErrorActionType,
            } = action.payload;
            const values = formsValues[`${dataEntryId}-${itemId}`];
            const formServerValues = formFoundation?.convertValues(values, convertFn);

            const serverData = {
                trackedEntities: [
                    {
                        attributes: deriveAttributesFromFormValues(formServerValues),
                        geometry: deriveGeometryFromFormValues(formServerValues),
                        trackedEntity: trackedEntityInstanceId,
                        trackedEntityType: trackedEntityTypeId,
                        orgUnit: orgUnitId,
                    },
                ],
            };

            onSaveExternal && onSaveExternal(serverData, uid);
            return updateTei({
                serverData,
                onSaveSuccessActionType,
                onSaveErrorActionType,
                uid,
            });
        }),
    );

export const updateTeiSucceededEpic = (action$: InputObservable) =>
    action$.pipe(
        ofType(dataEntryActionTypes.TEI_UPDATE_SUCCESS),
        map((action) => {
            const attributeValues = action.meta?.serverData?.trackedEntities[0]?.attributes || [];
            return batchActions([setTeiAttributeValues(attributeValues)]);
        }),
    );

export const updateTeiFailedEpic = (action$: InputObservable) =>
    action$.pipe(
        ofType(dataEntryActionTypes.TEI_UPDATE_ERROR),
        map(() => setTeiModalError(true)),
    );
