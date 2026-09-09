export type TableActionSeverity =
    'secondary' | 'success' | 'info' | 'warn' | 'help' | 'danger' | 'contrast';

export interface TableAction {
    label?: string;
    icon: string;
    tooltip?: string;
    severity?: TableActionSeverity;
    text?: boolean;
    rounded?: boolean;
    outlined?: boolean;
    visible?: (row: any) => boolean;
    disabled?: (row: any) => boolean;
    command: (row: any, event: Event) => void;
}

export interface tableColumns {
    alias: string;
    field: string;
    isImg?: boolean;
    isTag?: boolean;
    isCodeBlock?: boolean;
    tagSeverityFn?: (value: string) => string;
    tagLabelFn?: (value: any, row: any) => string;
    isCheckBox?: boolean;
    isDate?: boolean,
    dateFormat?: string;
    dateTimezone?: string;
    isInputText?: boolean,
    isNumber?: boolean;
    isCurrency?: boolean;
    valueFormatter?: (value: any, row: any) => string | number | null | undefined;
    toTotalize?: boolean;
    isButton?: boolean;
    isActions?: boolean;
    actions?: TableAction[];
    filterable?: boolean;
    sortable?: boolean;
    button?: {
        label: string | ((row: any) => string),
        icon: string
        command: (row: any, el: any) => void
        disabled?: (row: any) => boolean
    },
    filterActive?: boolean
}
export interface ghostControllColumn {
    field: string;
    desc: string;
    ifValueEqual?: any;
    ifValueGreater?: any;
    ifRowFunction?: (row: any) => boolean;
    color: string;
}
export interface TableModel {
    title: string;
    subtitle?: string;
    paginator?: boolean;
    totalize: boolean;
    columns: Array<tableColumns>;
    ghostControll?: Array<ghostControllColumn>;
    sortField?: string;
    sortOrder?: 1 | -1;
    dataKey?: string;
    expandable?: boolean;
}
