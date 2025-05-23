// @flow
import moment from 'moment';
import { convertServerToClient, convertClientToForm } from '../../../converters';
import { dataElementTypes } from '../../../metaData';

const convertDate = (date): any => convertServerToClient(date, dataElementTypes.DATE);

const sortByMostRecentDate = (a, b) => moment.utc(b.eventDate).diff(moment.utc(a.eventDate));

const getSuggestedDateByNextScheduleDate = (id, eventData) => {
    const possibleNextScheduleValues = eventData.reduce((acc, event) => {
        event.dataValues.forEach((item) => {
            if (item.dataElement === id && item.value !== null) {
                acc.push({ ...item, eventDate: convertDate(event.eventDate) });
            }
        });
        return acc;
    }, []).sort(sortByMostRecentDate);
    if (!possibleNextScheduleValues.length) { return undefined; }
    return possibleNextScheduleValues[0].value;
};

const getSuggestedDateByStandardInterval = (standardInterval, eventData) => {
    const events = eventData
        .filter(event => event.eventDate)
        .map(event => ({ eventDate: convertDate(event.eventDate) }))
        .sort(sortByMostRecentDate);
    if (!events.length) { return undefined; }

    return moment(events[0].eventDate).add(standardInterval, 'days').format();
};

/**
 * Based on this docs https://docs.google.com/document/d/1I9-xc1oA95cWb64MHmIJXTHXQnxzi1SJ3RUmiuzSh78/edit#heading=h.6omlcjr0bk5n
 * to determine the suggested schedule date
 */
type Props = {
    programStageScheduleConfig: {
        nextScheduleDate?: {
            id: string
        },
        standardInterval?: ?number,
        generatedByEnrollmentDate?: ?boolean,
        minDaysFromStart: number
    },
    programConfig: {
        displayIncidentDate?: boolean
    },
    enrolledAt: string,
    occurredAt: string,
    eventData: Array<Object>
}
export const useDetermineSuggestedScheduleDate = ({
    programStageScheduleConfig,
    programConfig,
    enrolledAt,
    occurredAt,
    eventData,
}: Props) => {
    if (!programStageScheduleConfig) { return undefined; }

    const {
        nextScheduleDate,
        standardInterval,
        generatedByEnrollmentDate,
        minDaysFromStart,
    } = programStageScheduleConfig;
    const scheduleDateComputeSteps = [
        () => nextScheduleDate?.id && getSuggestedDateByNextScheduleDate(nextScheduleDate.id, eventData),
        () => standardInterval && getSuggestedDateByStandardInterval(standardInterval, eventData),
        () => {
            let suggestedScheduleDate;
            if (generatedByEnrollmentDate || !programConfig.displayIncidentDate) {
                suggestedScheduleDate = moment(enrolledAt).add(minDaysFromStart, 'days').format();
            } else {
                suggestedScheduleDate = moment(occurredAt).add(minDaysFromStart, 'days').format();
            }
            return suggestedScheduleDate;
        },
    ];
    const suggestedDate = scheduleDateComputeSteps.reduce((currentScheduleDate, computeScheduleDate) =>
        (!currentScheduleDate ? computeScheduleDate() : currentScheduleDate)
    , undefined);

    return convertClientToForm(suggestedDate, dataElementTypes.DATE);
};
