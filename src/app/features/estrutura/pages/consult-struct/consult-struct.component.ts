import { Component } from '@angular/core';
import { ModernBomComponent } from '@/app/features/estrutura/widgets/modern-bom/modern-bom.component';
import { ScrollTopModule } from 'primeng/scrolltop';

@Component({
  selector: 'app-consult-struct',
  standalone: true,
  imports: [ModernBomComponent, ScrollTopModule],
  templateUrl: './consult-struct.component.html',
  styleUrl: './consult-struct.component.css'
})
export class ConsultStructComponent {
  constructor() {}
}
