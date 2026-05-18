import { Component, EventEmitter, Input, Output, ViewChild, signal} from '@angular/core';
import {ImageModule} from 'primeng/image'
import {TreeModule} from 'primeng/tree'
import { TreeNode } from 'primeng/api';
import { TreeNodeData } from '../../utils/parse-to-treeNode';
import {TreeTable, TreeTableModule} from "primeng/treetable"
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';

interface GraphNode {
  id: string;
  node: TreeNode<TreeNodeData>;
  x: number;
  y: number;
  layer: number;
}

interface GraphEdge {
  from: GraphNode;
  to: GraphNode;
  path: string;
}

@Component({
  selector: 'app-item-hierarchy-lista',
  templateUrl: './item-hierarchy-lista.component.html',
  styleUrls: ['./item-hierarchy-lista.component.css'],
  standalone: true,
  imports : [
    ImageModule,
    TreeModule,
    TreeTableModule,
    TagModule,
    InputTextModule,
    ButtonModule
  ]
})
export class ItemHierarchyListaComponent{

  private readonly graphMargin = 60;
  private readonly nodeWidth = 220;
  private readonly nodeHeight = 80;
  private readonly horizontalGap = 120;
  private readonly verticalGap = 180;

  graphNodes: GraphNode[] = [];
  graphEdges: GraphEdge[] = [];
  graphWidth = 720;
  graphHeight = 320;
  selectedGraphNode?: GraphNode;
  selectedTreeNode?: TreeNode<TreeNodeData>;

  private _item: TreeNode<TreeNodeData>[] = [];

  @Input() set item(value: TreeNode<TreeNodeData>[] | undefined) {
    this._item = value ?? [];
    this.buildGraph();
  }

  get item(): TreeNode<TreeNodeData>[] {
    return this._item;
  }

  @Output() onNodeSelect = new EventEmitter<any>();

  @ViewChild('dt') dt: TreeTable | undefined;

  failedImages = signal<Set<string>>(new Set());

  onImageError(url: string) {
    this.failedImages.update(prev => {
      const next = new Set(prev);
      next.add(url);
      return next;
    });
  }

  public applyFilterGlobal($event: any, stringVal: string) {
    const value = ($event.target as HTMLInputElement).value;
    this.dt?.filterGlobal(value, stringVal);
  }

  getTagSeverity(value: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
    if (!value) return 'secondary';
    const val = value.toLowerCase();
    if (val.includes('produzido') || val === 'pa') return 'success';
    if (val.includes('fantasma') || val === 't') return 'info';
    if (val.includes('comprado') || val === 'c') return 'warn';
    if (val.includes('pendente')) return 'warn';
    if (val.includes('critico')) return 'danger';
    return 'secondary';
  }

  get totalLayers(): number {
    return this.graphNodes.reduce((total, node) => Math.max(total, node.layer + 1), 0);
  }

  selectGraphNode(node: GraphNode) {
    this.selectedGraphNode = node;
    this.selectedTreeNode = node.node;
    this.onNodeSelect.emit({ node: node.node });
    this.scrollToGraphNode(node);
  }

  selectTreeNode(node: TreeNode<TreeNodeData> | undefined | null) {
    if (!node) return;
    this.selectedTreeNode = node;
    const graphNode = this.graphNodes.find(gn => gn.node === node);
    this.selectedGraphNode = graphNode;
    this.onNodeSelect.emit({ node });
    if (graphNode) {
      this.scrollToGraphNode(graphNode);
    }
  }

  private scrollToGraphNode(node: GraphNode) {
    setTimeout(() => {
      const canvas = document.querySelector('.graph-canvas');
      if (!canvas) return;

      // Centralizar o nó no container do grafo
      const scrollX = node.x - (canvas.clientWidth / 2) + (this.nodeWidth / 2);
      const scrollY = node.y - (canvas.clientHeight / 2) + (this.nodeHeight / 2);

      canvas.scrollTo({
        left: Math.max(0, scrollX),
        top: Math.max(0, scrollY),
        behavior: 'smooth'
      });
    }, 100);
  }

  isGraphNodeSelected(node: GraphNode): boolean {
    return this.selectedGraphNode?.id === node.id;
  }

  exportarExcel() {
    const dados: any[] = [];
    const flatten = (nodes: TreeNode[]) => {
      nodes.forEach(node => {
        if (node.data) {
          dados.push({
            'Partcode': node.data.partcode,
            'PA': node.data.pa,
            'Quantidade': node.data.quantidade,
            'Tipo': node.data.tipo
          });
        }
        if (node.children) flatten(node.children);
      });
    };
    flatten(this.item);
    
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(dados);
    const workbook: XLSX.WorkBook = {
      Sheets: { 'Dados': worksheet },
      SheetNames: ['Dados']
    };

    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob: Blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8'
    });
    FileSaver.saveAs(blob, `Estrutura_${new Date().getTime()}.xlsx`);
  }

  exportarCSV() {
    const dados: any[] = [];
    const flatten = (nodes: TreeNode[]) => {
      nodes.forEach(node => {
        if (node.data) {
          dados.push({
            'Partcode': node.data.partcode,
            'PA': node.data.pa,
            'Quantidade': node.data.quantidade,
            'Tipo': node.data.tipo
          });
        }
        if (node.children) flatten(node.children);
      });
    };
    flatten(this.item);

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(dados);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    FileSaver.saveAs(blob, `Estrutura_${new Date().getTime()}.csv`);
  }

  private buildGraph() {
    const layers: GraphNode[][] = [];
    const edges: GraphEdge[] = [];
    const queue = this.item.map((node, index) => ({
      node,
      layer: 0,
      parent: undefined as GraphNode | undefined,
      id: `${index}`,
    }));

    while (queue.length) {
      const current = queue.shift()!;
      const graphNode: GraphNode = {
        id: current.id,
        node: current.node,
        layer: current.layer,
        x: 0,
        y: this.graphMargin + current.layer * (this.nodeHeight + this.verticalGap),
      };

      layers[current.layer] = layers[current.layer] ?? [];
      layers[current.layer].push(graphNode);

      if (current.parent) {
        edges.push({ from: current.parent, to: graphNode, path: '' });
      }

      (current.node.children ?? []).forEach((child, index) => {
        queue.push({
          node: child as TreeNode<TreeNodeData>,
          layer: current.layer + 1,
          parent: graphNode,
          id: `${current.id}-${index}`,
        });
      });
    }

    const widestLayer = Math.max(1, ...layers.map(layer => layer.length));
    this.graphWidth = Math.max(720, this.graphMargin * 2 + widestLayer * this.nodeWidth + Math.max(0, widestLayer - 1) * this.horizontalGap);
    this.graphHeight = Math.max(320, this.graphMargin * 2 + layers.length * this.nodeHeight + Math.max(0, layers.length - 1) * this.verticalGap);

    layers.forEach(layer => {
      const layerWidth = layer.length * this.nodeWidth + Math.max(0, layer.length - 1) * this.horizontalGap;
      const startX = Math.max(this.graphMargin, (this.graphWidth - layerWidth) / 2);

      layer.forEach((node, index) => {
        node.x = startX + index * (this.nodeWidth + this.horizontalGap);
      });
    });

    edges.forEach(edge => {
      const fromX = edge.from.x + this.nodeWidth / 2;
      const fromY = edge.from.y + this.nodeHeight;
      const toX = edge.to.x + this.nodeWidth / 2;
      const toY = edge.to.y;
      const midY = fromY + (toY - fromY) / 2;

      edge.path = `M ${fromX} ${fromY} C ${fromX} ${midY}, ${toX} ${midY}, ${toX} ${toY}`;
    });

    this.graphNodes = layers.flat();
    this.graphEdges = edges;
    this.selectedGraphNode = this.graphNodes[0];
    this.selectedTreeNode = this.selectedGraphNode?.node;
  }
}
