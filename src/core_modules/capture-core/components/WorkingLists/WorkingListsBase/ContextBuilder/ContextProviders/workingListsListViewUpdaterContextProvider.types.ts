import type { ReactNode } from 'react';
import type { PagingTotals } from '../../../../ListView';
import type {
    CancelUpdateList,
} from '../../workingListsBase.types';

export type Props = Readonly<PagingTotals & {
    rowsPerPage?: number,
    currentPage?: number,
    onCancelUpdateList?: CancelUpdateList,
    customUpdateTrigger?: any,
    forceUpdateOnMount?: boolean,
    dirtyList: boolean,
    children: ReactNode,
    loadedOrgUnitId?: string,
}>;
