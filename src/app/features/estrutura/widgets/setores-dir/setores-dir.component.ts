import { Component, ElementRef, inject, OnInit } from '@angular/core';
import { ContagemBufferApiService } from '@/app/features/buffer/services/ContagemBufferApi.service';
import { LoadingPopupService } from '@/app/shared/services/loading-popup.service';
import { Observable, shareReplay, tap } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { ResSetorDTO } from '@/api/buffer';
import { AsyncPipe } from '@angular/common';
import { SetorStoreService } from '@/app/features/buffer/services/SetorStore.service';

@Component({
  selector: 'app-setores-dir',
  standalone: true,
  imports: [AsyncPipe],
  templateUrl: './setores-dir.component.html',
  styleUrl: './setores-dir.component.css'
})
export class SetoresDirComponent implements OnInit {
  private api = inject(ContagemBufferApiService);
  private popupService = inject(LoadingPopupService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private host: HTMLElement = inject(ElementRef).nativeElement;
  setorStore = inject(SetorStoreService);
  setores$ !: Observable<ResSetorDTO[]>;

  ngOnInit(): void {
    this.setores$ = this.api.requestSetores().pipe(
      tap(setores => this.selecionarPorQuery(setores)),
      shareReplay(1) // uma requisição só: o objeto no store precisa ser o mesmo do template
    );
    this.popupService.showWhile(this.setores$);
    // mantém a aba ativa visível na lista rolável (ex.: vinda de ?aba=)
    this.setorStore.currentSetor$.subscribe(() => setTimeout(() =>
      this.host.querySelector('.btn.active')?.scrollIntoView({ inline: 'nearest', block: 'nearest' })));
  }


  setSetor(setor: ResSetorDTO):void{
    this.setorStore.currentSetor = setor;
    this.router.navigate([], { relativeTo: this.route, queryParams: { aba: setor.idSetor }, queryParamsHandling: 'merge', replaceUrl: true });
  }

  private selecionarPorQuery(setores: ResSetorDTO[]): void {
    const aba = this.route.snapshot.queryParamMap.get('aba')?.toLowerCase();
    if (!aba || this.setorStore.currentSetor) return;
    const achado = setores.find(s => String(s.idSetor) === aba || s.setor?.toLowerCase() === aba);
    if (achado) this.setorStore.currentSetor = achado;
  }
}
