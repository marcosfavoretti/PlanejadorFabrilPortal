import { Injectable, input } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { ErroPopupComponent } from '../widgets/erro-popup/erro-popup.component';
import { LoadingPopUpComponent } from '../widgets/loading-pop-up/loading-pop-up.component';

@Injectable({ providedIn: 'root' })
export class LoadingPopupService {
  private activeModals = new Map<any, NgbModalRef>();

  constructor(private modalService: NgbModal) { }

  showErrorMessage(message: string): void {
    const existingModal = this.activeModals.get(ErroPopupComponent);
    if (existingModal) {
      existingModal.componentInstance.erroMessage = message;
      return;
    }

    const errorRef = this.modalService.open(ErroPopupComponent, {
      backdrop: 'static',
      centered: true,
      keyboard: true,
    });

    this.activeModals.set(ErroPopupComponent, errorRef);
    errorRef.result.finally(() => {
      this.activeModals.delete(ErroPopupComponent);
    });

    errorRef.componentInstance.erroMessage = message;
    errorRef.componentInstance.closeButtonFn = () => errorRef.close();
  }

  showPopUpComponent<T>(component: any, inputs?: Partial<T>): NgbModalRef {
    const existingModal = this.activeModals.get(component);
    if (existingModal) {
      if (inputs) {
        for (const [key, value] of Object.entries(inputs)) {
          existingModal.componentInstance[key] = value;
        }
      }
      return existingModal;
    }

    const modalRef = this.modalService.open(component, {
      backdrop: 'static',
      centered: true,
      keyboard: true,
    });

    this.activeModals.set(component, modalRef);
    modalRef.result.finally(() => {
      this.activeModals.delete(component);
    });

    if (inputs) {
      for (const [key, value] of Object.entries(inputs)) {
        modalRef.componentInstance[key] = value;
      }
    }
    modalRef.componentInstance.closeButtonFn = () => modalRef.close();
    return modalRef
  }
  showWhile(...observables: Observable<any>[]): Observable<any> {
    const modalRef = this.modalService.open(LoadingPopUpComponent, {
      backdrop: 'static',
      centered: true,
      keyboard: false
    });
    console.log(observables.length)
    const safeObservables = observables.map(obs =>
      obs.pipe(
        catchError(err => {
          console.error(`>>>>>>>>>> ${observables.length} Erro durante execução:`, err);
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
          errorRef.componentInstance.erroMessage = err.response?.data?.message || `${err.code} ${err.message}`;
          errorRef.componentInstance.erroMessageErr = err.response?.data?.error;
          errorRef.componentInstance.closeButtonFn = () => errorRef.close(); // Passa a função de fechar para o input closeButtonFn
          return of(null);
        })
      )
    );
    console.log(`*********${safeObservables.length}`)
    
    const resultObservable = forkJoin(safeObservables).pipe(
      finalize(() => modalRef?.close())
    );

    resultObservable.subscribe(results => {
      console.log('Todas as requisições terminaram:', results);
      const event = new CustomEvent('loadingPopupResolved', { detail: results });
      window.dispatchEvent(event);
    });

    return resultObservable;
  }
}

