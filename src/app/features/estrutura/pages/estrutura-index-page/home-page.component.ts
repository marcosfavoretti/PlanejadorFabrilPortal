import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { PageLayoutComponent } from '@/app/shared/layouts/page-layout/page-layout.component';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    PageLayoutComponent,
    RouterOutlet
  ]
})
export class HomePageComponent {
  constructor() { }
}
