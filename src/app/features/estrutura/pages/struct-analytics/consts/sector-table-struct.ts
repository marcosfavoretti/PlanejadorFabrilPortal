import { Sectors } from "@/@core/enums/sectors";
import { TableModel } from "@/app/shared/components/table-dynamic/table.model";

export const sectorTables: TableModel[] = [
    {
        title: Sectors.LASER,
        paginator: true,
        totalize: false,
        sortField: 'sector.metrics.Total Time',
        sortOrder: -1,
        columns: [
            {
                field: 'partcode',
                alias: 'partcode',
                isImg: false
            },
            {
                field: 'item_status',
                alias: 'Status',
                isImg: false,
                toTotalize: false
            },
            {
                field: 'sector.metrics.Total Time',
                alias: 'Tempo total (min)',
                isImg: false,
                isNumber: true,
                toTotalize: true
            },
            {
                field: 'imagem',
                alias: 'imagem',
                isImg: true
            },

        ]
    },
    {
        title: Sectors.TIPAGEM,
        paginator: true,
        totalize: false,
        sortField: 'sector.metrics.Total Time',
        sortOrder: -1,
        columns: [
            {
                field: 'partcode',
                alias: 'partcode',
                isImg: false
            },
            {
                field: 'item_status',
                alias: 'Status',
                isImg: false,
                toTotalize: false
            },
            {
                field: 'sector.metrics.Total Time',
                alias: 'Tempo total (min)',
                isImg: false,
                isNumber: true,
                toTotalize: true
            },
            {
                field: 'imagem',
                alias: 'imagem',
                isImg: true
            },
        ]
    },
    {
        title: Sectors.PONTEADEIRA,
        paginator: true,
        totalize: false,
        sortField: 'sector.metrics.Total Time',
        sortOrder: -1,
        columns: [
            {
                field: 'partcode',
                alias: 'partcode',
                isImg: false
            },
            {
                field: 'item_status',
                alias: 'Status',
                isImg: false,
                toTotalize: false
            },
            {
                field: 'sector.metrics.Total Time',
                alias: 'Tempo total (min)',
                isImg: false,
                isNumber: true,
                toTotalize: true
            },
            {
                field: 'imagem',
                alias: 'imagem',
                isImg: true
            },
        ]
    },
    {
        title: Sectors.LIXA,
        paginator: true,
        totalize: false,
        sortField: 'sector.metrics.Total Time',
        sortOrder: -1,
        ghostControll: [
            {
                field: 'isControllItem',
                ifValueEqual: 'true',
                color: 'lightyellow',
                desc: 'Item de controle'
            }
        ],
        columns: [
            {
                field: 'partcode',
                alias: 'partcode',
                isImg: false
            },
            {
                field: 'item_status',
                alias: 'Status',
                isImg: false,
                toTotalize: false
            },
            {
                field: 'sector.metrics.Total Time',
                alias: 'Tempo total (min)',
                isImg: false,
                isNumber: true
            },
            {
                field: 'imagem',
                alias: 'imagem',
                isImg: true
            },
        ]
    },
    {
        title: Sectors.DOBRA,
        paginator: true,
        totalize: false,
        sortField: 'sector.metrics.Total Time',
        sortOrder: -1,
        columns: [
            {
                field: 'partcode',
                alias: 'partcode',
                isImg: false
            },
            {
                field: 'item_status',
                alias: 'Status',
                isImg: false,
                toTotalize: false
            },
            {
                field: 'sector.metrics.Total Time',
                alias: 'Tempo total (min)',
                isImg: false,
                isNumber: true,
                toTotalize: true
            },
            {
                field: 'imagem',
                alias: 'imagem',
                isImg: true
            },
        ]
    },
    {
        title: Sectors.SOLDA,
        paginator: true,
        totalize: false,
        sortField: 'sector.metrics.Total Time',
        sortOrder: -1,
        ghostControll: [
            {
                field: 'isControllItem',
                ifValueEqual: 'true',
                color: 'lightyellow',
                desc: 'Item de controle'
            }
        ],
        columns: [
            {
                alias: 'Codigo Cliente',
                field: 'pa',
                isImg: false

            },
            {
                alias: 'Partcode',
                field: 'partcode',
                isImg: false

            },
            {
                field: 'item_status',
                alias: 'Status',
                isImg: false,
                toTotalize: false
            },
            {
                field: 'sector.metrics.Total Time',
                alias: 'Tempo total (min)',
                isImg: false,
                isNumber: true
            },
            {
                field: 'imagem',
                alias: 'imagem',
                isImg: true
            },
        ]
    },
    {
        title: Sectors.SOLDAROBO,
        paginator: true,
        totalize: false,
        sortField: 'sector.metrics.Total Time',
        sortOrder: -1,
        ghostControll: [
            {
                field: 'isControllItem',
                ifValueEqual: 'true',
                color: 'lightyellow',
                desc: 'Item de controle'
            }
        ],
        columns: [
            {
                alias: 'Codigo Cliente',
                field: 'pa',
                isImg: false

            },
            {
                alias: 'Partcode',
                field: 'partcode',
                isImg: false

            },
            {
                field: 'item_status',
                alias: 'Status',
                isImg: false,
                toTotalize: false
            },
            {
                field: 'sector.metrics.Total Time',
                alias: 'Tempo total (min)',
                isImg: false,
                isNumber: true
            },
            {
                field: 'imagem',
                alias: 'imagem',
                isImg: true
            },
        ]
    },
    {
        title: Sectors.BANHO,
        paginator: true,
        totalize: false,
        sortField: 'sector.metrics.Total Time',
        sortOrder: -1,
        ghostControll: [
            {
                field: 'isControllItem',
                ifValueEqual: 'true',
                color: 'lightyellow',
                desc: 'Item de controle'
            }
        ],
        columns: [
            {
                alias: 'Partcode',
                field: 'partcode',
                isImg: false

            },
            {
                field: 'item_status',
                alias: 'Status',
                isImg: false,
                toTotalize: false
            },
            {
                field: 'sector.metrics.Total Time',
                alias: 'Tempo total (min)',
                isImg: false,
                isNumber: true
            },
            {
                field: 'sector.metrics.M^2',
                alias: 'm^2',
                isImg: false

            },
            {
                field: 'sector.metrics.Tem Quimico',
                alias: 'Tem químico',
                isImg: false

            }
            ,
            {
                field: 'imagem',
                alias: 'imagem',
                isImg: true
            },
        ]
    },
    {
        title: Sectors.PINTURA,
        paginator: true,
        totalize: false,
        sortField: 'sector.metrics.Total Time',
        sortOrder: -1,
        ghostControll: [
            {
                field: 'isControllItem',
                ifValueEqual: 'true',
                color: 'lightyellow',
                desc: 'Item de controle'
            }
        ],
        columns: [
            {
                alias: 'Partcode',
                field: 'partcode',
                isImg: false

            },
            {
                field: 'item_status',
                alias: 'Status',
                isImg: false,
                toTotalize: false
            },
            {
                field: 'sector.metrics.Total Time',
                alias: 'Tempo total (min)',
                isImg: false,
                isNumber: true
            },
            {
                field: 'sector.metrics.M^2',
                alias: 'm^2',
                isImg: false,
                toTotalize: true

            },
            {
                field: 'sector.metrics.Tem Tinta',
                alias: 'Tem químico',
                isImg: false

            }
            ,
            {
                field: 'imagem',
                alias: 'imagem',
                isImg: true
            },
        ]
    },
    {
        title: Sectors.PINTURAPO,
        paginator: true,
        totalize: false,
        sortField: 'sector.metrics.Total Time',
        sortOrder: -1,
        ghostControll: [
            {
                field: 'isControllItem',
                ifValueEqual: 'true',
                color: 'lightyellow',
                desc: 'Item de controle'
            }
        ],
        columns: [
            {
                alias: 'Partcode',
                field: 'partcode',
                isImg: false

            },
            {
                field: 'item_status',
                alias: 'Status',
                isImg: false,
            },
            {
                field: 'sector.metrics.Total Time',
                alias: 'Tempo total (min)',
                isImg: false,

            },
            {
                field: 'sector.metrics.M^2',
                alias: 'm^2',
                isImg: false,
                toTotalize: true

            },
            {
                field: 'sector.metrics.Tem Tinta',
                alias: 'Tem tinta',
                isImg: false

            }
            ,
            {
                field: 'imagem',
                alias: 'imagem',
                isImg: true
            },
        ]
    },
    {
        title: Sectors.MONTAGEM,
        paginator: true,
        totalize: false,
        sortField: 'sector.metrics.Total Time',
        sortOrder: -1,
        ghostControll: [
            {
                field: 'isControllItem',
                ifValueEqual: 'true',
                color: 'lightyellow',
                desc: 'Item de controle'
            }
        ],
        columns: [
            {
                alias: 'Partcode',
                field: 'partcode',
                isImg: false

            },
            {
                field: 'item_status',
                alias: 'Status',
                isImg: false,
                toTotalize: false
            },
            {
                field: 'sector.metrics.Total Time',
                alias: 'Tempo total (min)',
                isImg: false,
                isNumber: true
            },
            {
                field: 'imagem',
                alias: 'imagem',
                isImg: true
            },
        ]
    }
]
