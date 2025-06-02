export interface tableColumns{
    alias: string;
    field: string;
    isImg?: boolean;
    isCheckBox?: boolean;
    isInputText?: boolean,
    toTotalize?: boolean;
}
export interface ghostControllColumn{
    field: string;
    desc: string;
    ifValueEqual?: any;
    ifValueGreater?: any;
    color: string;
}
export interface TableModel{
    title: string;
    paginator?: boolean;
    totalize: boolean;
    columns: Array<tableColumns>;
    ghostControll?: Array<ghostControllColumn>
}