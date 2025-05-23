// @flow
import type { Program, ProgramStage } from '../../../../metaData';
import type {
    CancelLoadTemplates,
    CancelLoadView,
    CancelUpdateList,
    Categories,
    ChangePage,
    ChangeRowsPerPage,
    ClearFilter,
    CustomMenuContents,
    CustomRowMenuContents,
    FiltersData,
    LoadedContext,
    LoadTemplates,
    LoadView,
    SelectRestMenuItem,
    SelectRow,
    SelectTemplate,
    SetColumnOrder,
    SetTemplateSharingSettings,
    Sort,
    StickyFilters,
    UnloadingContext,
    UpdateFilter,
    WorkingListTemplate,
} from '../../WorkingListsBase';
import type {
    AddTemplate,
    DeleteTemplate,
    UpdateTemplate,
    UpdateList,
    RecordsOrder,
    CustomColumnOrder,
    InitialViewConfig,
} from '../../WorkingListsCommon';
import type { EventRecords } from '../../EventWorkingListsCommon';
import type {
    EventWorkingListsTemplates,
} from '../types';

export type Props = $ReadOnly<{|
    storeId: string,
    program: Program,
    programStage: ProgramStage,
    orgUnitId: string
|}>;

export type EventWorkingListsReduxOutputProps = {|
    categories?: Categories,
    currentPage?: number,
    currentTemplate?: WorkingListTemplate,
    currentViewHasTemplateChanges?: boolean,
    customColumnOrder?: CustomColumnOrder,
    customListViewMenuContents?: CustomMenuContents,
    customRowMenuContents?: CustomRowMenuContents,
    downloadRequest: Object,
    records?: EventRecords,
    filters?: FiltersData,
    initialViewConfig?: InitialViewConfig,
    lastIdDeleted?: string,
    lastTransaction: number,
    lastTransactionOnListDataRefresh?: number,
    listDataRefreshTimestamp?: number,
    loadedContext?: LoadedContext,
    loading: boolean,
    loadViewError?: string,
    loadTemplatesError?: string, // TODO: Check
    onAddTemplate: AddTemplate,
    onCancelLoadView: CancelLoadView,
    onCancelLoadTemplates: CancelLoadTemplates,
    onCancelUpdateList: CancelUpdateList,
    onChangePage: ChangePage,
    onChangeRowsPerPage: ChangeRowsPerPage,
    onClearFilter: ClearFilter,
    onDeleteEvent: Function,
    onDeleteTemplate: DeleteTemplate,
    onLoadView: LoadView,
    onLoadTemplates: LoadTemplates,
    onSelectListRow: SelectRow,
    onSelectRestMenuItem: SelectRestMenuItem,
    onSelectTemplate: SelectTemplate,
    onSetListColumnOrder: SetColumnOrder,
    onSetTemplateSharingSettings: SetTemplateSharingSettings,
    onSortList: Sort,
    onUnloadingContext?: UnloadingContext,
    onUpdateFilter: UpdateFilter,
    onUpdateList: UpdateList,
    onUpdateTemplate: UpdateTemplate,
    orgUnitId: string,
    program: Program,
    programStage: ProgramStage,
    recordsOrder?: RecordsOrder,
    rowsPerPage?: number,
    sortByDirection?: string,
    sortById?: string,
    stickyFilters?: StickyFilters,
    templates?: EventWorkingListsTemplates,
    templatesLoading: boolean,
    updating: boolean,
    updatingWithDialog: boolean,
    viewPreloaded?: boolean,
    templateSharingType: string,
|};
