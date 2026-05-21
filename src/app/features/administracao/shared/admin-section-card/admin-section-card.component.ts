import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-admin-section-card',
  standalone: true,
  imports: [],
  templateUrl: './admin-section-card.component.html',
  styleUrl: './admin-section-card.component.css'
})
export class AdminSectionCardComponent {
  id = input<string>();
  title = input.required<string>();
  description = input<string>();
}

