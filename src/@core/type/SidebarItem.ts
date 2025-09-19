export interface SidebarItem {
  label: string;               // Texto exibido
  action?: () => void;          // Função chamada ao clicar
  icon?: string;               // Ícone opcional (classe CSS ou caminho)
  disabled?: boolean;          // Item desativado
  route?: string;
}