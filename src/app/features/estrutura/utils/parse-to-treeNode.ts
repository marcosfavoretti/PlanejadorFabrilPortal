import { TreeNode } from "primeng/api";
import type { ResEstruturaItemTreeDTO } from "@/api/estrutura";

export interface TreeNodeData {
  imagem: string | undefined,
  quantidade: string,
  checkList : boolean,
  paRecorded: boolean,
  tipo: string
  partcode: string,
  pa: string
}

function asRecord(value: unknown): Record<string, any> {
  return value && typeof value === "object" ? value as Record<string, any> : {};
}

function readPartcode(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  const partcode = asRecord(value);
  return partcode["partcode"] ?? partcode["codigo"] ?? partcode["codItem"] ?? partcode["id"] ?? "";
}

function readChildren(itemData: Record<string, any>): ResEstruturaItemTreeDTO[] {
  const possibleChildren = [
    itemData["filhos"],
    itemData["children"],
    itemData["itens"],
    itemData["componentes"],
    itemData["dependencias"],
    itemData["depedencias"],
  ];

  return (possibleChildren.find(Array.isArray) ?? []) as ResEstruturaItemTreeDTO[];
}

function readNodeData(item: ResEstruturaItemTreeDTO): Record<string, any> {
  const itemData = asRecord(item);
  const nestedItem = asRecord(itemData["item"]);
  const nestedTarget = asRecord(itemData["target"]);

  return Object.keys(nestedItem).length
    ? { ...nestedItem, ...itemData }
    : Object.keys(nestedTarget).length
      ? { ...nestedTarget, ...itemData }
      : itemData;
}

function convertToTreeNode(item: ResEstruturaItemTreeDTO, imageProvider?: (partcode: string) => string): TreeNode {
    const itemData = readNodeData(item);
    const filhos = readChildren(itemData);
    const partcode = readPartcode(itemData["partcode"]);
    const quantidade = itemData["quantidade"] ?? itemData["qtd"];
    const medida = itemData["medida"] ?? "";

    const treeNode: TreeNode<TreeNodeData> = {
      label: partcode,
      data: {
        pa: itemData["pa"] ?? itemData["itemCliente"] ?? "",
        paRecorded: itemData["paRecorded"] ?? false,
        partcode,
        tipo : itemData["item_status"] ?? itemData["status"] ?? itemData["tipo"] ?? "",
        checkList : itemData["checkListAvaiable"] ?? itemData["avaiable"] ?? false,
        imagem: itemData["imagem"] || (imageProvider ? imageProvider(partcode) : undefined),
        quantidade: `${quantidade ?? ''}${medida ? String(medida).toLowerCase() : ''}`
      },
      children: filhos?.length ? filhos.map(child => convertToTreeNode(child, imageProvider)) : [],
      expanded: true,
      leaf: !filhos || filhos.length === 0
    };
  
    return treeNode;
}
  
export function parseToTreeNode(item: ResEstruturaItemTreeDTO | ResEstruturaItemTreeDTO[], imageProvider?: (partcode: string) => string): TreeNode[] {
    if (!item) {
      return [];
    }

    if (Array.isArray(item)) {
      return item.map(i => convertToTreeNode(i, imageProvider));
    }

    return [convertToTreeNode(item, imageProvider)];
}
