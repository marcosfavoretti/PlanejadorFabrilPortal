import { NgClass } from '@angular/common';
import { Component, EventEmitter, Input, Output, ViewChild, signal } from '@angular/core';
import {ImageModule} from 'primeng/image'
import {TreeModule} from 'primeng/tree'
import { TreeNode } from 'primeng/api';
import { TreeNodeData } from '../../utils/parse-to-treeNode';
import {TreeTable, TreeTableModule} from "primeng/treetable"
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { exportRowsToCsv, exportRowsToXlsx } from '../../../../shared/utils/spreadsheet-export';

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

interface LayerGuide {
  layer: number;
  y: number;
  labelY: number;
}

interface LayoutTreeNode {
  id: string;
  source: TreeNode<TreeNodeData>;
  layer: number;
  width: number;
  children: LayoutTreeNode[];
}

@Component({
  selector: 'app-item-hierarchy-lista',
  templateUrl: './item-hierarchy-lista.component.html',
  styleUrls: ['./item-hierarchy-lista.component.css'],
  standalone: true,
  imports : [
    NgClass,
    ImageModule,
    TreeModule,
    TreeTableModule,
    TagModule,
    InputTextModule,
    ButtonModule
  ]
})
export class ItemHierarchyListaComponent{

  private readonly graphMargin = 72;
  private readonly nodeWidth = 240;
  private readonly nodeHeight = 92;
  private readonly siblingGap = 32;
  private readonly verticalGap = 96;
  private readonly edgeBendOffset = 36;

  graphNodes: GraphNode[] = [];
  graphEdges: GraphEdge[] = [];
  layerGuides: LayerGuide[] = [];
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
    return this.layerGuides.length;
  }

  get selectedNodeChildrenCount(): number {
    return this.selectedGraphNode?.node.children?.length ?? 0;
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

  getNodePartcode(node: TreeNode<TreeNodeData> | undefined): string {
    return this.ellipsis(node?.data?.partcode, 24);
  }

  getNodeDescription(node: TreeNode<TreeNodeData> | undefined): string {
    return this.ellipsis(node?.data?.pa, 28);
  }

  async exportarExcel() {
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

    await exportRowsToXlsx(dados, `Estrutura_${new Date().getTime()}.xlsx`);
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

    exportRowsToCsv(dados, `Estrutura_${new Date().getTime()}.csv`);
  }

  private buildGraph() {
    const previousSelectionId = this.selectedGraphNode?.id;
    const roots = this.item.map((node, index) => this.createLayoutNode(node, 0, `${index}`));
    const totalWidth = this.computeForestWidth(roots);
    const layers = new Map<number, GraphNode[]>();
    const graphNodes: GraphNode[] = [];
    const graphEdges: GraphEdge[] = [];
    const layerCount = this.computeLayerCount(roots);

    this.graphWidth = Math.max(720, Math.ceil(totalWidth + this.graphMargin * 2));
    this.graphHeight = Math.max(
      320,
      this.graphMargin * 2 + layerCount * this.nodeHeight + Math.max(0, layerCount - 1) * this.verticalGap,
    );

    let startX = this.graphMargin;
    roots.forEach((root, index) => {
      this.placeLayoutNode(root, startX, graphNodes, graphEdges, layers, undefined);
      startX += root.width + (index < roots.length - 1 ? this.siblingGap : 0);
    });

    graphEdges.forEach((edge) => {
      edge.path = this.buildEdgePath(edge.from, edge.to);
    });

    this.layerGuides = Array.from({ length: layerCount }, (_, layer) => {
      const y = this.graphMargin + layer * (this.nodeHeight + this.verticalGap) - this.verticalGap / 2;
      return {
        layer,
        y: Math.max(this.graphMargin / 2, y),
        labelY: this.graphMargin + layer * (this.nodeHeight + this.verticalGap) - 14,
      };
    });

    this.graphNodes = graphNodes;
    this.graphEdges = graphEdges;
    this.selectedGraphNode =
      this.graphNodes.find((node) => node.id === previousSelectionId)
      ?? this.graphNodes[0];
    this.selectedTreeNode = this.selectedGraphNode?.node;
  }

  private createLayoutNode(node: TreeNode<TreeNodeData>, layer: number, id: string): LayoutTreeNode {
    const children = (node.children ?? []).map((child, index) =>
      this.createLayoutNode(child as TreeNode<TreeNodeData>, layer + 1, `${id}-${index}`),
    );

    return {
      id,
      source: node,
      layer,
      width: this.computeSubtreeWidth(children),
      children,
    };
  }

  private computeSubtreeWidth(children: LayoutTreeNode[]): number {
    if (!children.length) {
      return this.nodeWidth;
    }

    const childrenWidth = children.reduce((total, child) => total + child.width, 0);
    const gapsWidth = this.siblingGap * Math.max(0, children.length - 1);
    return Math.max(this.nodeWidth, childrenWidth + gapsWidth);
  }

  private computeForestWidth(roots: LayoutTreeNode[]): number {
    if (!roots.length) {
      return this.nodeWidth;
    }

    return roots.reduce((total, root) => total + root.width, 0) + this.siblingGap * Math.max(0, roots.length - 1);
  }

  private computeLayerCount(roots: LayoutTreeNode[]): number {
    return roots.reduce((max, root) => Math.max(max, this.getMaxLayer(root)), 0) + (roots.length ? 1 : 0);
  }

  private getMaxLayer(node: LayoutTreeNode): number {
    if (!node.children.length) {
      return node.layer;
    }

    return node.children.reduce((max, child) => Math.max(max, this.getMaxLayer(child)), node.layer);
  }

  private placeLayoutNode(
    layoutNode: LayoutTreeNode,
    startX: number,
    graphNodes: GraphNode[],
    graphEdges: GraphEdge[],
    layers: Map<number, GraphNode[]>,
    parent?: GraphNode,
  ) {
    const x = startX + (layoutNode.width - this.nodeWidth) / 2;
    const y = this.graphMargin + layoutNode.layer * (this.nodeHeight + this.verticalGap);
    const graphNode: GraphNode = {
      id: layoutNode.id,
      node: layoutNode.source,
      x,
      y,
      layer: layoutNode.layer,
    };

    graphNodes.push(graphNode);
    const layerNodes = layers.get(layoutNode.layer) ?? [];
    layerNodes.push(graphNode);
    layers.set(layoutNode.layer, layerNodes);

    if (parent) {
      graphEdges.push({ from: parent, to: graphNode, path: '' });
    }

    let childStartX = startX;
    layoutNode.children.forEach((child) => {
      this.placeLayoutNode(child, childStartX, graphNodes, graphEdges, layers, graphNode);
      childStartX += child.width + this.siblingGap;
    });
  }

  private buildEdgePath(from: GraphNode, to: GraphNode): string {
    const fromX = from.x + this.nodeWidth / 2;
    const fromY = from.y + this.nodeHeight;
    const toX = to.x + this.nodeWidth / 2;
    const toY = to.y;
    const bendY = Math.min(toY - 20, fromY + this.edgeBendOffset);

    return `M ${fromX} ${fromY} V ${bendY} H ${toX} V ${toY}`;
  }

  private ellipsis(value: string | undefined, maxLength: number): string {
    if (!value) {
      return '---';
    }

    return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
  }
}
