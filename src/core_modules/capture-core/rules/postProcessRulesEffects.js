// @flow
import { effectActions } from 'capture-core-utils/rulesEngine';
import type { OutputEffect, HideOutputEffect, AssignOutputEffect, OutputEffects } from 'capture-core-utils/rulesEngine';
import type { RenderFoundation } from '.././metaData';

const getAssignEffectsBasedOnHideField = (hideEffects: Array<HideOutputEffect>) =>
    hideEffects
        .map(({ id }) => ({
            id,
            value: null,
            type: effectActions.ASSIGN_VALUE,
        }));

const deduplicateEffectArray = (effectArray: Array<OutputEffect>) => {
    const dedupedEffectsAsMap = new Map(effectArray.map(effect => [effect.id, effect]));
    return [...dedupedEffectsAsMap.values()];
};

const postProcessAssignEffects = ({
    assignValueEffects,
    hideFieldEffects,
}: {
    assignValueEffects: Array<AssignOutputEffect>,
    hideFieldEffects: Array<HideOutputEffect>,
}) => (
    // assignValueEffects has precedence over "blank a hidden field"-assignments.
    // This requirement is met by destructuring assignValueEffects *last*.
    deduplicateEffectArray([
        ...getAssignEffectsBasedOnHideField(hideFieldEffects),
        ...assignValueEffects,
    ])
);

const postProcessHideSectionEffects = (
    hideSectionEffects: Array<HideOutputEffect>,
    foundation: RenderFoundation,
) => (hideSectionEffects.flatMap(({ id: sectionId }) => {
    const section = foundation.getSection(sectionId);
    if (!section) {
        return [];
    }

    return [...section.elements.values()]
        .map(({ id }) => ({
            id,
            type: effectActions.HIDE_FIELD,
        }));
}));

const filterHideEffects = (
    hideEffects: Array<HideOutputEffect>,
    makeCompulsoryEffects: { [id: string]: Array<OutputEffect> },
    foundation: RenderFoundation,
) => {
    const compulsoryElements = foundation.getElements().filter(({ compulsory }) => compulsory).reduce((acc, { id }) => {
        acc[id] = true;
        return acc;
    }, {});

    const nonCompulsoryHideEffects = hideEffects
        .filter(({ id }) => !(compulsoryElements[id] || makeCompulsoryEffects[id]));

    return deduplicateEffectArray(nonCompulsoryHideEffects);
};

export function postProcessRulesEffects(
    rulesEffects: OutputEffects = [],
    foundation: RenderFoundation,
) {
    const elementsById = foundation.getElementsById();
    const scopeFilteredRulesEffects = rulesEffects.filter(({ targetDataType, id }) =>
        !targetDataType || elementsById[id]);

    const {
        [effectActions.HIDE_FIELD]: hideFieldEffects,
        [effectActions.HIDE_SECTION]: hideSectionEffects,
        [effectActions.ASSIGN_VALUE]: assignValueEffects,
        rest,
    } = scopeFilteredRulesEffects
        .reduce((acc, effect) => {
            const { type } = effect;
            if ([effectActions.HIDE_FIELD, effectActions.HIDE_SECTION, effectActions.ASSIGN_VALUE].includes(type)) {
                // $FlowFixMe
                acc[type].push(effect);
            } else {
                acc.rest.push(effect);
            }
            return acc;
        }, {
            [effectActions.HIDE_FIELD]: [],
            [effectActions.HIDE_SECTION]: [],
            [effectActions.ASSIGN_VALUE]: [],
            rest: [],
        });

    const compulsoryEffectsObject = scopeFilteredRulesEffects
        .reduce((acc, effect) => {
            if (effect.type === effectActions.MAKE_COMPULSORY) {
                acc[effect.id] = effect;
            }
            return acc;
        }, {});

    const hideSectionFieldEffects = postProcessHideSectionEffects(
        hideSectionEffects,
        foundation,
    );

    const filteredHideFieldEffects = filterHideEffects(
        [...hideFieldEffects, ...hideSectionFieldEffects],
        compulsoryEffectsObject,
        foundation,
    );

    const filteredAssignValueEffects = postProcessAssignEffects({
        // $FlowFixMe
        assignValueEffects,
        hideFieldEffects: filteredHideFieldEffects,
    });

    return [
        ...rest,
        ...filteredHideFieldEffects,
        ...filteredAssignValueEffects,
    ];
}
