import { Component, Input } from '@angular/core';
import { MinhasFabricasComponent } from "../minhas-fabricas/minhas-fabricas.component";

@Component({
  selector: 'app-minhas-fabricas-pop-up',
  imports: [MinhasFabricasComponent],
  templateUrl: './minhas-fabricas-pop-up.component.html',
  styleUrl: './minhas-fabricas-pop-up.component.css'
})
export class MinhasFabricasPopUpComponent {
  @Input() closeButtonFn !: () => void;
}
