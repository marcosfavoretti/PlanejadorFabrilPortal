import { Injectable, input } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { ErroPopupComponent } from '../widgets/erro-popup/erro-popup.component';
import { LoadingPopUpComponent } from '../widgets/loading-pop-up/loading-pop-up.component';

@Injectable({ providedIn: 'root' })
export class LoadingPopupService {
  private modalRef?: NgbModalRef;

  constructor(private modalService: NgbModal) { }

  showErrorMessage(message: string): void {
    const errorRef = this.modalService.open(ErroPopupComponent, {
      backdrop: 'static',
      centered: true,
      keyboard: true,
    });
  
    errorRef.result.catch(() => {
      console.log('ErroPopupComponent foi fechado.');
    });
  
    errorRef.componentInstance.erroMessage = message;
    errorRef.componentInstance.closeButtonFn = () => errorRef.close();
  }

showPopUpComponent<T>(component: any, inputs?: Partial<T>): NgbModalRef {
  this.modalRef = this.modalService.open(component, {
    backdrop: 'static',
    centered: true,
    keyboard: true,
  });

  if (inputs) {
    Object.assign(this.modalRef.componentInstance,);
  }
  return this.modalRef

}
  showWhile(...observables: Observable<any>[]): Observable<any> {
    this.modalRef = this.modalService.open(LoadingPopUpComponent, {
      backdrop: 'static',
      centered: true,
      keyboard: false
    });
    const safeObservables = observables.map(obs =>
      obs.pipe(
        catchError(err => {
          console.error('Erro durante execução:', err);
          const errorRef = this.modalService.open(
            ErroPopupComponent,
            {
              backdrop: 'static',
              centered: true,
              keyboard: true,
            }
          );
          errorRef.result.catch(() => {
            console.log('ErroPopupComponent foi fechado.');
          });
          console.log(err);
          errorRef.componentInstance.erroMessage = err.response?.data?.message ;
          errorRef.componentInstance.erroMessageErr = err.response?.data?.error ;
          errorRef.componentInstance.closeButtonFn = () => errorRef.close(); // Passa a função de fechar para o input closeButtonFn
          return of(null);
        })
      )
    );

    const resultObservable = forkJoin(safeObservables).pipe(
      finalize(() => this.modalRef?.close())
    );

    resultObservable.subscribe(results => {
      console.log('Todas as requisições terminaram:', results);
      // Emit an event or handle the resolution logic here
      const event = new CustomEvent('loadingPopupResolved', { detail: results });
      window.dispatchEvent(event);
    });

    return resultObservable;
  }
}

