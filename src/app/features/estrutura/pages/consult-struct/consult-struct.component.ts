import { Component } from '@angular/core';
import { ModernBomComponent } from '@/app/features/estrutura/widgets/modern-bom/modern-bom.component';

@Component({
  selector: 'app-consult-struct',
  standalone: true,
  imports: [ModernBomComponent],
  templateUrl: './consult-struct.component.html',
  styleUrl: './consult-struct.component.css'
})
export class ConsultStructComponent {
  constructor() {}
}
