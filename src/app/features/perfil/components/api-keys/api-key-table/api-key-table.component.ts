import { DatePipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { API_KEY_STATUS_LABEL, API_KEY_STATUS_SEVERITY, ApiKeyRow, ApiKeyStatus } from '../../../models/api-key.model';

@Component({
  selector: 'app-api-key-table',
  standalone: true,
  imports: [DatePipe, ButtonModule, TableModule, TagModule],
  templateUrl: './api-key-table.component.html',
  styleUrl: './api-key-table.component.css',
})
export class ApiKeyTableComponent {
  readonly apiKeys = input.required<ApiKeyRow[]>();
  readonly total = input(0);
  readonly loading = input(false);
  readonly busyId = input<string | null>(null);

  readonly refresh = output<void>();
  readonly rotate = output<ApiKeyRow>();
  readonly revoke = output<ApiKeyRow>();

  protected statusLabel(status: ApiKeyStatus): string {
    return API_KEY_STATUS_LABEL[status];
  }

  protected statusSeverity(status: ApiKeyStatus): 'success' | 'warn' | 'danger' {
    return API_KEY_STATUS_SEVERITY[status];
  }
}
