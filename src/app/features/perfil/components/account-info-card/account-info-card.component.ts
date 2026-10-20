import { Component, input } from '@angular/core';
import { UserResponseDTO } from '@/api/auth';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-account-info-card',
  standalone: true,
  imports: [TagModule],
  templateUrl: './account-info-card.component.html',
  styleUrl: './account-info-card.component.css',
})
export class AccountInfoCardComponent {
  readonly user = input.required<UserResponseDTO>();
}
