import { LoadingPopupService } from '@/app/services/LoadingPopup.service';
import { Component } from '@angular/core';
import {  RouterModule } from '@angular/router';

@Component({
  selector: 'app-home-page-navigator',
  imports: [RouterModule],
  templateUrl: './home-page-navigator.component.html',
  styleUrl: './home-page-navigator.component.css'
})
export class HomePageNavigatorComponent {
  constructor(private popup: LoadingPopupService) {}

}
