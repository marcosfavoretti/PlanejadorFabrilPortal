import { Component, inject } from '@angular/core';
import { FabricaPageComponent } from "@/app/pages/fabrica-page/fabrica-page.component";
import { Router } from '@angular/router';

@Component({
  selector: 'app-fabrica-page-read-only',
  imports: [FabricaPageComponent],
  templateUrl: './fabrica-page-read-only.component.html',
  styleUrl: './fabrica-page-read-only.component.css'
})
export class FabricaPageReadOnlyComponent {
  private readonly router = inject(Router);
  //dequeue rota duas menos
  goBack() {
    this.router.navigate(['planejamentos', 'fabricaAvaliacao']);
  }
}
