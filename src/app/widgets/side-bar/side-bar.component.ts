import { SidebarItem } from '@/@core/type/SidebarItem';
import { CommonModule } from '@angular/common';
import { Component, input, signal } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-side-bar',
  imports: [CommonModule, RouterModule],
  templateUrl: './side-bar.component.html',
  styleUrl: './side-bar.component.css'
})
export class SideBarComponent {
  items = input<SidebarItem[]>();

  // Opcional: track do item ativo
  activeIndex = signal<number | null>(null);

  onClick(item: SidebarItem, index: number) {
    if (item.disabled || !item.action) return;
    this.activeIndex.set(index);
    item.action();
  }
}
