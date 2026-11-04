import { ChangeDetectionStrategy, Component, OnInit, computed, signal } from '@angular/core';
import { LoadingPopupService } from '@/app/shared/services/loading-popup.service';
import { ContagemBufferApiService } from '@/app/features/buffer/services/ContagemBufferApi.service';
import { SetorStoreService } from '@/app/features/buffer/services/SetorStore.service';
import { format } from 'date-fns';
import { ResMercadosIntermediarioDoSetorDTO, SaveBufferLogDto } from '@/api/buffer';
import { tap } from 'rxjs';
import { BufferItemCellComponent } from './buffer-item-cell/buffer-item-cell.component';
import { BufferQtyInputComponent, QtyState } from './buffer-qty-input/buffer-qty-input.component';
import { PartcodeImageService } from '@/app/shared/services/partcode-image.service';

// tipos que contêm "porta" no nome mas não são porta de produto
const NAO_PORTA = ['exportacao', 'transportador', 'portaria', 'portal'];

interface BufferRow {
  lado: 'E' | 'D' | null;
  nomeLado: string;
  qtd: Record<string, number>; // por mercado
}

interface BufferGrupo {
  item: string;
  apelido: string;
  image: string;
  itemCliente: string;
  linha: string;
  rows: BufferRow[];
}

@Component({
  selector: 'app-setores-tables',
  standalone: true,
  imports: [BufferQtyInputComponent, BufferItemCellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
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

  readonly grupos = signal<BufferGrupo[]>([]);
  readonly busca = signal('');
  readonly gruposFiltrados = computed(() => {
    const q = this.busca().trim().toLowerCase();
    return q ? this.grupos().filter(g => [g.item, g.apelido, g.itemCliente, g.linha].some(v => v?.toLowerCase().includes(q))) : this.grupos();
  });
  readonly mercados = signal<string[]>([]);
  readonly titulo = signal('');
  readonly showLinha = signal(false);
  private readonly estados = signal<Record<string, QtyState>>({});

  estado(item: string, lado: string | null, mercado: string): QtyState {
    return this.estados()[`${item}|${lado ?? ''}|${mercado}`] ?? 'idle';
  }

  salvar(item: string, row: BufferRow, mercado: string, qtd: number): void {
    row.qtd[mercado] = qtd;
    this.updateRequire({ item, row, column: mercado });
    this.setEstado(`${item}|${row.lado ?? ''}|${mercado}`, 'saving');
  }

  private setEstado(key: string, s: QtyState): void {
    this.estados.update(e => ({ ...e, [key]: s }));
  }

  updateRequire(event: { item: string; row: BufferRow; column: string }): void {
    const { item, row, column } = event;
    if (row.qtd[column] == undefined) {
      return;
    }
    const key = `${item}|${row.lado ?? ''}|${column}`;
    const update$ = this.apiService.saveLog({
      item,
      qtd: row.qtd[column],
      mercadoName: column,
      // lado só para porta; backend rejeita lado em item normal
      ...(row.lado ? { lado: row.lado as SaveBufferLogDto['lado'] } : {})
    }).pipe(tap({
      next: () => { this.setEstado(key, 'saved'); setTimeout(() => this.setEstado(key, 'idle'), 1500); },
      error: () => this.setEstado(key, 'error')
    }));
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
    const result: BufferGrupo[] = [];
    this.mercados.set(res.map(p => p.nome));
    const hist = res.flatMap(r2 => r2.histBuffer).filter(i => i.item && i.item.Item);
    const itensUnicos = Array.from(new Map(hist.map(i => [i.item.Item, i.item])).values());

    for (const item of itensUnicos) {
      // porta = o backend marcou lado (E/D) no histórico; a blacklist descarta falsos positivos pelo tipo
      const tipo = (item.tipo_item ?? '').toLowerCase();
      const isPorta = hist.some(h => h.item.Item === item.Item && h.lado) && !NAO_PORTA.some(n => tipo.includes(n));
      // porta: uma linha por lado (E/D); demais: lado null, sem lado
      const lados: BufferRow['lado'][] = isPorta ? ['E', 'D'] : [null];
      const grupo: BufferGrupo = {
        item: item.Item, apelido: item.tipo_item,
        image: this.partcodeImageService.pictureRenderLink({ partcode: item.Item }),
        itemCliente: item.item_cliente, linha: item.linha, rows: []
      };
      for (const lado of lados) {
        const resultObj: BufferRow = {
          lado,
          nomeLado: lado === 'E' ? 'Porta esquerda' : lado === 'D' ? 'Porta direita' : '',
          qtd: {}
        };
        for (const mercado of res) {
          const bufferObj = mercado.histBuffer.find(p => p.item.Item === item.Item && (p.lado ?? null) === lado);
          resultObj.qtd[mercado.nome] = bufferObj ? bufferObj.buffer : 0;
        }
        grupo.rows.push(resultObj);
      }
      result.push(grupo);
    }
    this.grupos.set(result);
    this.showLinha.set(!!result[0]?.item.includes('-000-'));
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
    this.titulo.set(`${this.setorStore.currentSetor?.setor} no dia ${format(new Date(), 'dd/MM/yyyy')}`);
  }

}
