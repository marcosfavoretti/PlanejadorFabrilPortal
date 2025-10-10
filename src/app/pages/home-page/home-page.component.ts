import { Component, inject } from '@angular/core';
import { GlobalHeaderComponent } from "../../widgets/global-header/global-header.component";
import { SplitterModule } from 'primeng/splitter';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SideBarComponent } from "@/app/widgets/side-bar/side-bar.component";
import { SidebarItem } from '@/@core/type/SidebarItem';
import { LoadingPopupService } from '@/app/services/LoadingPopup.service';
import { MinhasFabricasPopUpComponent } from '@/app/widgets/minhas-fabricas-pop-up/minhas-fabricas-pop-up.component';
import { Router, RouterOutlet } from '@angular/router';
import { computed } from '@angular/core';
import { UserstoreService } from '@/app/services/userstore.service';
import { CargoEnum } from '@/@core/enum/CARGO.enum';
@Component({
  selector: 'app-home-page',
  imports: [
    RouterOutlet,
    SplitterModule,
    GlobalHeaderComponent,
    FormsModule,
    CommonModule,
    SideBarComponent,
    RouterOutlet
  ],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.css'
})
export class HomePageComponent {

  popup = inject(LoadingPopupService);
  router = inject(Router);
  user = inject(UserstoreService);
  loadFinish: boolean = true;

  menuItems: SidebarItem[] = [

  ];

  cargoXmenu: Record<CargoEnum, SidebarItem[]> = {
    ADMIN: [
      { label: 'Fábrica Principal', icon: 'pi pi-star', route: '/app/fabricaPrincipal' },
      { label: 'Minhas Fábrica', action: () => this.openMinhasFabricas(), icon: 'pi pi-warehouse', route: 'app/fabrica' },
      { label: 'Fábricas para Avaliação', action: () => console.log('Fábricas clicked'), icon: 'pi pi-hourglass', route: '/app/fabricaAvaliacao' },
      // { label: 'Relatórios', action: () => console.log('Relatórios clicked'), icon: 'pi pi-wave-pulse', disabled: true },
      { label: 'Pedidos', action: () => console.log('Relatórios clicked'), icon: 'pi pi-receipt', disabled: true, route: '/app/pedidos' },
    ],
    PCP: [
      { label: 'Fábrica Principal', icon: 'pi pi-star', route: '/app/fabricaPrincipal' },
      { label: 'Minhas Fábrica', action: () => this.openMinhasFabricas(), icon: 'pi pi-warehouse', route: 'app/fabrica' },
      { label: 'Pedidos', action: () => console.log('Relatórios clicked'), icon: 'pi pi-receipt', disabled: true, route: '/app/pedidos' },
      // { label: 'Relatórios', action: () => console.log('Relatórios clicked'), icon: 'pi pi-wave-pulse', disabled: true },
    ],
    USER: [
      { label: 'Fábrica Principal', icon: 'pi pi-star', route: '/app/fabricaPrincipal' },
      { label: 'Minhas Fábrica', action: () => this.openMinhasFabricas(), icon: 'pi pi-warehouse', route: 'app/fabrica' },
      // { label: 'Relatórios', action: () => console.log('Relatórios clicked'), icon: 'pi pi-wave-pulse', disabled: true },
    ]
  }

  menu = computed<SidebarItem[]>(() => {
    const cargo = this.user.item()?.cargosList;
    const links: SidebarItem[] = [];
    ((cargo ?? []) as CargoEnum[]).forEach((cargo: CargoEnum) => {
      links.push(...this.cargoXmenu[cargo])
    });
    return Array.from(new Set(links));
  })

  openMinhasFabricas(): void {
    this.popup.showPopUpComponent(MinhasFabricasPopUpComponent);
  }

}
