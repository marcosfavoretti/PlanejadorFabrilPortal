import { Component, inject, OnInit } from '@angular/core';
import { ContagemBufferApiService } from '../../services/ContagemBufferApi.service';
import { LoadingPopupService } from '../../services/LoadingPopup.service';
import { Observable } from 'rxjs';
import { ResSetorDTO } from '../../../api/buffer';
import { AsyncPipe } from '@angular/common';
import { SetorStoreService } from '../../services/SetorStore.service';

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
  setorStore = inject(SetorStoreService);
  setores$ !: Observable<ResSetorDTO[]>;

  ngOnInit(): void {
    this.setores$ = this.api.requestSetores();
    this.popupService.showWhile(this.setores$);
  }


  setSetor(setor: ResSetorDTO):void{
    this.setorStore.currentSetor = setor;
  }
}
