import { Component, OnInit } from '@angular/core';
import { LoadingPopupService } from '../../services/LoadingPopup.service';
import { ContagemBufferApiService } from '../../services/ContagemBufferApi.service';
import { SetorStoreService } from '../../services/SetorStore.service';
import { format } from 'date-fns';
import { ResMercadosIntermediarioDoSetorDTO } from '../../../api/buffer';
import { tap } from 'rxjs';
import { BufferTable } from '../../../@core/type/BufferTable';
import { TableDynamicComponent } from '@/app/table-dynamic/table-dynamic.component';
import { TableModel } from '@/app/table-dynamic/@core/table.model';
import { PartcodeImageService } from '@/app/services/PartcodeImage.service';

@Component({
  selector: 'app-setores-tables',
  standalone: true,
  imports: [TableDynamicComponent],
  templateUrl: './setores-tables.component.html',
  styleUrl: './setores-tables.component.css'
})
export class SetoresTablesComponent implements OnInit {

  constructor(
    private popupservice: LoadingPopupService,
    private apiService: ContagemBufferApiService,
    private setorStore: SetorStoreService,
    private partcodeImageService: PartcodeImageService
  ) { }

  tableSchema!: TableModel;
  data2Display: any[] = []
  colunasAdicionais: string[] = [];

  updateRequire(event: any): void {
    if (event.row[event.column] == undefined) {
      return;
    }
    const update$ = this.apiService.saveLog({
      item: event.row.item,
      qtd: event.row[event.column],
      mercadoName: event.column
    })
    this.popupservice.showWhile(update$);
  }

  ngOnInit(): void {
    this.setorStore.currentSetor$.subscribe(
      () => {
        this.refreshTable();
      }
    )
  }

  pegarMercadosDinamicos(res: ResMercadosIntermediarioDoSetorDTO[]) {
    const result: BufferTable[] = [];
    this.colunasAdicionais = res.map(p => p.nome);
    const itensUnicos = Array.from(
      new Map(
        res
          .flatMap(r2 => r2.histBuffer)
          .filter(i => i.item && i.item.Item) // garante que existe i.item e i.item.item
          .map(i => [i.item.Item, i.item]) // usa i.item.item como chave, i.item como valor
      ).values()
    );
    for (const item of itensUnicos) {
      const resultObj: BufferTable = {
        apelido: item.tipo_item,
        image: this.partcodeImageService.pictureRenderLink({ partcode: item.Item }),
        item: item.Item,
        linha: item.linha,
        itemCliente: item.item_cliente
      };
      for (const mercado of res) {
        const bufferObj = mercado.histBuffer.find(p => p.item.Item === item.Item);
        resultObj[mercado.nome] = bufferObj ? bufferObj.buffer : 0;
      }
      result.push(resultObj);
    }
    this.data2Display = result;
  }

  refreshTable(): void {
    if (!this.setorStore.currentSetor) {
      console.error("Setor atual não definid no momento da requisição. Abortando.");
      return;
    }
    console.log(`Iniciando requisição para o setor: ${this.setorStore.currentSetor.idSetor}`);
    const resolution = this.apiService.requestMercadoInfo(this.setorStore.currentSetor.idSetor, format(new Date(), 'dd-MM-yyyy'))
      .pipe(
        tap(
          data => {
            this.pegarMercadosDinamicos(data);
            this.tableRefresh();
          }
        )
      );
    this.popupservice.showWhile(resolution);
  }

  tableRefresh(): void {
    this.tableSchema = {
      title: `${this.setorStore.currentSetor?.setor} no dia ${format(new Date(), 'dd/MM/yyyy')}`,
      totalize: false,
      columns: [
        {
          alias: 'Image',
          field: 'image',
          isImg: true
        },
        {
          alias: 'Item',
          field: 'item',
        },
        {
          alias: 'apelido',
          field: 'apelido'
        },
        {
          alias: 'Item Cliente',
          field: 'itemCliente',
        },
        // {
        //   alias: 'Linha',
        //   field: 'linha',
        // }
      ],
      ghostControll: []
    };
    if(this.data2Display[0].item.includes('-000-')) 
        this.tableSchema.columns.push({alias: 'linha', field: 'linha'})
    this.colunasAdicionais.forEach(c =>
      this.tableSchema.columns.push({
        alias: c,
        field: c,
        isInputText: true
      }));
  }

}
