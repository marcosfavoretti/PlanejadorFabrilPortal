import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { TableDynamicComponent } from "../../table-dynamic/table-dynamic.component";
import { TableModel } from '@/app/table-dynamic/@core/table.model';
import { FabricaService } from '@/app/services/Fabrica.service';
import { map, Observable } from 'rxjs';
import { UserFabricaResponseDto } from '@/api/planejador';
import { AsyncPipe } from '@angular/common';
import { Router } from '@angular/router';
import { Skeleton } from 'primeng/skeleton';

@Component({
  selector: 'app-minhas-fabricas',
  imports: [TableDynamicComponent, AsyncPipe, Skeleton],
  templateUrl: './minhas-fabricas.component.html',
  styleUrl: './minhas-fabricas.component.css'
})
export class MinhasFabricasComponent implements OnInit {
  @Output() fabricaEscolhida: EventEmitter<void> = new EventEmitter();
  public readonly tableShema: TableModel = {
    title: '',
    columns: [
      {
        alias: 'FabricaId',
        field: 'fabrica.fabricaId'
      },
      {
        alias: 'date',
        field: 'fabrica.date',
        isDate: true
      },
      {
        alias: '',
        field: '',
        isButton: true,
        button: {
          command: (row) => this.router.navigate(['app', 'fabrica', `${row.fabrica.fabricaId}`]),
          icon: 'pi pi-arrow-up-right-and-arrow-down-left-from-center',
          label: ''
        }
      }
    ],
    paginator: true,
    totalize: false
  }
  fabricas$!: Observable<UserFabricaResponseDto[]>;
  constructor(private fabricaService: FabricaService, private router: Router) { }
  ngOnInit(): void {
    const fabricas$ = this.fabricaService.consultaMinhasFabricas()
      .pipe(
        map(fabricas => fabricas.filter(f => !f.expirada))
      )
    this.fabricas$ = fabricas$;
  }

  oncheck(): void {
    this.fabricaEscolhida.emit();
  }
}
