import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EstruturaApiService } from '@/app/features/estrutura/services/EstruturaApi.service';
import { PartcodeImageService } from '@/app/shared/services/partcode-image.service';
import { EstruturaContextService } from '@/app/features/estrutura/services/EstruturaContext.service';
import { parseToTreeNode } from '../../utils/parse-to-treeNode';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ImageModule } from 'primeng/image';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { TreeNode } from 'primeng/api';
import { ItemHierarchyListaComponent } from '../item-hierarchy-lista/item-hierarchy-lista.component';
import { from } from 'rxjs';
import { estruturaControllerGetItemDeControle, estruturaControllerDetalharItens } from '@/api/estrutura';
import { TableDynamicComponent } from '@/app/shared/components/table-dynamic/table-dynamic.component';
import { TableModel } from '@/app/shared/components/table-dynamic/table.model';

@Component({
  selector: 'app-modern-bom',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InputTextModule,
    ButtonModule,
    ImageModule,
    ProgressSpinnerModule,
    TooltipModule,
    TableDynamicComponent,
    ItemHierarchyListaComponent
  ],
  templateUrl: './modern-bom.component.html',
  styleUrl: './modern-bom.component.css'
})
export class ModernBomComponent implements OnInit {
  private itemApi = inject(EstruturaApiService);
  private imageService = inject(PartcodeImageService);
  private estruturaContext = inject(EstruturaContextService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  viewMode = signal<'tree' | 'list'>('list');
  activeDetailTab = signal<'specs' | 'control' | 'visual'>('specs');
  searchQuery = '';
  loading = signal(false);

  rootItem: any = null;
  treeData: TreeNode[] = [];
  listData: any[] = [];
  controlItems = signal<any[]>([]);
  selectedItem = signal<any>(null);
  selectedItemDetails = signal<any>(null);
  tableModel: TableModel = {
    title: 'Itens da Estrutura',
    totalize: false,
    columns: [
      { alias: 'ID DO ITEM', field: 'partcode', isImg: false },
      { alias: 'NOME DO COMPONENTE', field: 'pa', isImg: false },
      { alias: 'QTD', field: 'qtd_display', isImg: false },
      { alias: 'STATUS', field: 'item_status', isImg: false, isTag: true, tagSeverityFn: (v) => this.getSeverity(v) },
      { alias: 'IMAGEM', field: 'imagem', isImg: true }
    ]
  };


  ngOnInit() {
    const mode = this.route.snapshot.queryParamMap.get('view');
    const partcode = this.route.snapshot.queryParamMap.get('partcode') ?? this.estruturaContext.getPartcode();

    if (mode === 'tree' || mode === 'list') {
      this.viewMode.set(mode as 'tree' | 'list');
    }

    if (partcode) {
      this.searchQuery = partcode;
      this.search(false);
    }
  }

  setViewMode(mode: 'tree' | 'list') {
    this.viewMode.set(mode);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        view: mode,
        partcode: this.searchQuery?.trim() || null
      },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });

    if (this.searchQuery?.trim()) {
      this.search(false);
    }
  }

  setActiveDetailTab(tab: 'specs' | 'control' | 'visual') {
    this.activeDetailTab.set(tab);
  }

  get layerLegend(): number[] {
    return Array.from({ length: this.getTreeLayerCount(this.treeData) }, (_, index) => index);
  }

  search(updateUrl = true) {
    const partcode = this.searchQuery.trim().toUpperCase();
    if (!partcode || partcode.length < 5) return;

    this.searchQuery = partcode;
    this.estruturaContext.setPartcode(partcode);
    this.loading.set(true);
    this.rootItem = null;
    this.treeData = [];
    this.listData = [];
    this.selectedItem.set(null);
    this.selectedItemDetails.set(null);

    if (updateUrl) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {
          view: this.viewMode(),
          partcode
        },
        queryParamsHandling: 'merge',
        replaceUrl: true
      });
    }

    // Fetch control items
    from(estruturaControllerGetItemDeControle({ partcode })).subscribe({
      next: (data) => {
        if (Array.isArray(data)) {
          this.controlItems.set(data);
        }
      },
      error: (err) => console.error('[ModernBOM] Error fetching control items:', err)
    });

    if (this.viewMode() === 'tree') {
      this.itemApi.getItemHierarchy(partcode).subscribe({
        next: (data) => {
          this.rootItem = data;
          try {
            this.treeData = parseToTreeNode(data, (p) => this.getItemImage(p));
            // Automatically select the root item for the InfoCard
            if (this.treeData.length > 0) {
              const rootData = this.treeData[0].data;
              if (rootData) {
                this.selectedItem.set(rootData);
                this.fetchDetails(rootData.partcode);
              }
            }
          } catch (e) {
            console.error('[ModernBOM] parseToTreeNode error:', e);
          }
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
    } else {
      this.itemApi.getItemList(partcode).subscribe({
        next: (data) => {
          this.listData = data.map(item => ({
            ...item,
            partcode: (item.partcode as any)?.partcode || item.partcode,
            pa: item.itemCliente,
            item_status: item.item_status ?? item.status ?? item.tipo ?? '',
            qtd_display: `${item.qtd} ${item.medida || ''}`,
            imagem: this.getItemImage((item.partcode as any)?.partcode || item.partcode)
          }));
          this.loading.set(false);
          // Automatically select the first item (usually the main item) for the InfoCard
          if (this.listData.length > 0) {
            const mainItem = this.listData[0];
            this.selectedItem.set(mainItem);
            this.fetchDetails(mainItem.partcode);
          }
        },
        error: () => this.loading.set(false)
      });
    }
  }

  onSelect(event: any) {
    // InfoCard update on click disabled as requested
    // The InfoCard remains locked to the main item loaded during search()
  }

  fetchDetails(partcode: string) {
    this.selectedItemDetails.set(null);
    from(estruturaControllerDetalharItens({ partcodes: [partcode] }))
      .subscribe(details => {
        if (details && details.length > 0) {
          this.selectedItemDetails.set(details[0]);
        }
      });
  }

  getSeverity(status: string) {
    if (!status) return 'secondary';
    const val = status.toLowerCase();
    if (val.includes('produzido') || val === 'pa') return 'success';
    if (val.includes('fantasma') || val === 't') return 'info';
    if (val.includes('comprado') || val === 'c') return 'warn';
    if (val.includes('pendente')) return 'warn';
    if (val.includes('critico')) return 'danger';
    if (val.includes('estoque')) return 'success';
    return 'info';
  }

  getItemImage(partcode: string) {
    return this.imageService.pictureRenderLink({ partcode });
  }

  goToAnalytics() {
    const partcode = this.selectedItem()?.partcode ?? this.searchQuery.trim().toUpperCase();
    if (partcode) {
      this.estruturaContext.setPartcode(partcode);
      this.router.navigate(['/estrutura/analise'], {
        queryParams: { partcode }
      });
    }
  }

  goToWhereUsed() {
    const partcode = this.selectedItem()?.partcode ?? this.searchQuery.trim().toUpperCase();
    if (partcode) {
      this.estruturaContext.setPartcode(partcode);
      this.router.navigate(['/estrutura/onde-usado'], {
        queryParams: { partcode }
      });
    }
  }

  private getTreeLayerCount(nodes: TreeNode[], layer = 1): number {
    if (!nodes.length) {
      return 0;
    }

    return nodes.reduce((maxLayer, node) => {
      const childLayerCount = this.getTreeLayerCount((node.children as TreeNode[] | undefined) ?? [], layer + 1);
      return Math.max(maxLayer, childLayerCount || layer);
    }, layer);
  }

}
