export interface tableColumns {
    alias: string;
    field: string;
    isImg?: boolean;
    isCheckBox?: boolean;
    isDate?: boolean,
    isInputText?: boolean,
    toTotalize?: boolean;
    isButton?: boolean;
    button?: {
        label: string,
        icon: string
        command: (row: any) => void
    }
}
export interface ghostControllColumn {
    field: string;
    desc: string;
    ifValueEqual?: any;
    ifValueGreater?: any;
    color: string;
}
export interface TableModel {
    title: string;
    paginator?: boolean;
    totalize: boolean;
    columns: Array<tableColumns>;
    ghostControll?: Array<ghostControllColumn>
}