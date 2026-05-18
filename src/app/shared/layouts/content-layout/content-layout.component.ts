import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PageLayoutComponent } from '../page-layout/page-layout.component';

@Component({
  selector: 'app-content-layout',
  imports: [
    RouterOutlet,
    PageLayoutComponent
  ],
  templateUrl: './content-layout.component.html',
  styleUrl: './content-layout.component.css'
})
export class ContentLayoutComponent {}
