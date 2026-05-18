import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FabricaPageComponent } from '@/app/features/planejamento/pages/fabrica-page/fabrica-page.component';

@Component({
  selector: 'app-fabrica-page-read-only',
  standalone: true,
  imports: [FabricaPageComponent],
  templateUrl: './fabrica-page-read-only.component.html',
  styleUrl: './fabrica-page-read-only.component.css'
})
export class FabricaPageReadOnlyComponent {
  private readonly router = inject(Router);

  goBack(): void {
    this.router.navigate(['planejamentos', 'fabricaAvaliacao']);
  }
}
