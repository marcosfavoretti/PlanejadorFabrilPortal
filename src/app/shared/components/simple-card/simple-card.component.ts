import { Component, input } from '@angular/core';
import {  SkeletonModule } from 'primeng/skeleton';

@Component({
  selector: 'app-simple-card',
  standalone: true,
  imports: [
    SkeletonModule
  ],
  templateUrl: './simple-card.component.html',
  styleUrl: './simple-card.component.css'
})
export class SimpleCardComponent {
  title = input<string>();
  text = input<string|undefined>();
}
