import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-erro-popup',
  imports: [CommonModule],
  templateUrl: './erro-popup.component.html',
  styleUrl: './erro-popup.component.css'
})
export class ErroPopupComponent {
  @Input() erroMessage?: string;
  @Input() closeButtonFn!: ()=>void;
  @Input() erroMessageErr?: string;

}
