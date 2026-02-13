import { ItemCapabilidadeTabelaComponent } from '@/app/widgets/item-capabilidade-tabela/item-capabilidade-tabela.component';
import { Component } from '@angular/core';
import { GlobalHeaderComponent } from "@/app/widgets/global-header/global-header.component";

@Component({
  selector: 'app-item-pagina',
  imports: [
    ItemCapabilidadeTabelaComponent,
],
  templateUrl: './item-pagina.component.html',
  styleUrl: './item-pagina.component.css'
})
export class ItemPaginaComponent {

}
