import { Component, OnInit } from '@angular/core';
import { TableDynamicComponent } from '@/app/table-dynamic/table-dynamic.component';
import { TableModel } from '@/app/table-dynamic/@core/table.model';
import { FabricaService } from '@/app/services/Fabrica.service';
import { map, Observable } from 'rxjs';
import { UserFabricaResponseDto } from '@/api/planejador';
import { AsyncPipe, CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SkeletonModule } from 'primeng/skeleton';
import { PageLayoutComponent } from '@/app/layouts/page-layout/page-layout.component';

@Component({
  selector: 'app-minhas-fabricas-page',
  standalone: true,
  imports: [
    CommonModule,
    TableDynamicComponent,
    AsyncPipe,
    SkeletonModule,
    PageLayoutComponent,
  ],
  templateUrl: './minhas-fabricas-page.component.html',
  styleUrls: ['./minhas-fabricas-page.component.css'],
})
export class MinhasFabricasPageComponent implements OnInit {
  public readonly tableShema: TableModel = {
    title: 'Minhas Fábricas',
    columns: [
      {
        alias: 'FabricaId',
        field: 'fabrica.fabricaId',
      },
      {
        alias: 'Data Criação',
        field: 'fabrica.date',
        isDate: true,
      },
      {
        alias: 'Acessar',
        field: '',
        isButton: true,
        button: {
          command: (row) =>
            this.router.navigate(['/', 'planejamentos', 'fabrica', `${row.fabrica.fabricaId}`]),
          icon: 'pi pi-arrow-right',
          label: 'Acessar',
        },
      },
    ],
    paginator: true,
    totalize: false,
  };
  fabricas$!: Observable<UserFabricaResponseDto[]>;

  constructor(private fabricaService: FabricaService, private router: Router) {}

  ngOnInit(): void {
    this.fabricas$ = this.fabricaService
      .consultaMinhasFabricas()
      .pipe(map((fabricas) => fabricas.filter((f) => !f.expirada)));
  }
}
