import { Component, Inject, Input, OnChanges, SimpleChanges, WritableSignal } from '@angular/core';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-loading-pop-up',
  imports: [
    ToastModule,
    ProgressSpinnerModule,
  ],
  templateUrl: './loading-pop-up.component.html',
  styleUrls: ['./loading-pop-up.component.css']
})
export class LoadingPopUpComponent {}
