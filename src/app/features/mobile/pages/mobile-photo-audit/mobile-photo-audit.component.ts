import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { PaginatorModule, type PaginatorState } from 'primeng/paginator';
import {
  mobileGaleriaControllerListReportFotos,
  mobileGaleriaControllerListReportFotosAppNames,
} from '@/api/mobile';
import type {
  MobileGaleriaControllerListReportFotosQueryParams,
  ReportFotosRes,
} from '@/api/mobile';
import type { MediaAsset } from '@/app/features/mobile/models/production-history.models';
import { ProductionHistoryApiService } from '@/app/features/mobile/services/production-history-api.service';
import { PageLayoutComponent } from '@/app/shared/layouts/page-layout/page-layout.component';

type AuditMedia = MediaAsset & {
  storageStatus?: string;
  uploadedAt?: string;
  size?: number;
  checksum?: string;
};

type AuditReport = Omit<ReportFotosRes, 'media'> & { media: AuditMedia[] };

@Component({
  selector: 'app-mobile-photo-audit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PageLayoutComponent, ButtonModule, DialogModule, InputTextModule, PaginatorModule],
  templateUrl: './mobile-photo-audit.component.html',
  styleUrl: './mobile-photo-audit.component.css',
})
export class MobilePhotoAuditComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly historyApi = inject(ProductionHistoryApiService);
  private requestSequence = 0;

  protected readonly filterForm = this.formBuilder.nonNullable.group({
    appName: '', mediaType: '', mediaStorageStatus: '',
    createdFrom: '', createdTo: '', uploadedFrom: '', uploadedTo: '', updatedFrom: '', updatedTo: '',
    serialNumber: '', codItem: '', pn: '', componSN: '', componPN: '',
    productionId: '', gate: '', correlationId: '', userId: '', appVersion: '',
    reportId: '', technicalError: '', mediaPhysicalName: '', mediaPath: '', mediaMimeType: '',
    propertyKey: '', propertyValue: '',
  });

  protected readonly appNames = signal<string[]>([]);
  protected readonly reports = signal<AuditReport[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly page = signal(0);
  protected readonly pageSize = signal(10);
  protected readonly total = signal(0);
  protected readonly selectedMedia = signal<AuditMedia | null>(null);

  ngOnInit(): void {
    void this.loadAppNames();
    void this.loadReports();
  }

  protected applyFilters(): void {
    this.page.set(0);
    void this.loadReports();
  }

  protected clearFilters(): void {
    this.filterForm.reset();
    this.applyFilters();
  }

  protected refresh(): void {
    void this.loadReports();
  }

  protected onPageChange(event: PaginatorState): void {
    const size = event.rows || this.pageSize();
    this.pageSize.set(size);
    this.page.set(Math.floor((event.first || 0) / size));
    void this.loadReports();
  }

  protected mediaUrl(media: AuditMedia): string {
    return this.historyApi.mediaUrl(media);
  }

  protected showMedia(media: AuditMedia): void {
    this.selectedMedia.set(media);
    this.historyApi.requestMedia(media);
  }

  protected closeMedia(): void {
    this.selectedMedia.set(null);
  }

  protected openHistory(report: AuditReport): void {
    const properties = report.properties ?? {};
    const partCode = this.asText(properties['codItem'] ?? properties['pn']);
    const serialNumber = this.asText(properties['serialNumber'] ?? properties['SerialNumber']);
    if (!partCode || !serialNumber) return;
    void this.router.navigate(['/qualidade/historico'], { queryParams: { partCode, serialNumber } });
  }

  protected canOpenHistory(report: AuditReport): boolean {
    const properties = report.properties ?? {};
    return Boolean(
      this.asText(properties['codItem'] ?? properties['pn']) &&
      this.asText(properties['serialNumber'] ?? properties['SerialNumber']),
    );
  }

  protected propertyValue(value: unknown): string {
    if (value === null || value === undefined || value === '') return '—';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }

  protected mediaCount(): number {
    return this.reports().reduce((count, report) => count + report.media.length, 0);
  }

  private async loadAppNames(): Promise<void> {
    try {
      const albums = await mobileGaleriaControllerListReportFotosAppNames();
      this.appNames.set(albums.map((album) => album.nome).filter(Boolean).sort());
    } catch {
      // O campo também aceita qualquer nome digitado quando a lista não estiver disponível.
    }
  }

  private async loadReports(): Promise<void> {
    const sequence = ++this.requestSequence;
    const values = this.filterForm.getRawValue();
    if (
      (values.createdFrom && values.createdTo && values.createdFrom > values.createdTo) ||
      (values.uploadedFrom && values.uploadedTo && values.uploadedFrom > values.uploadedTo) ||
      (values.updatedFrom && values.updatedTo && values.updatedFrom > values.updatedTo)
    ) {
      this.loading.set(false);
      this.error.set('A data inicial deve ser anterior à data final.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    try {
      const params = this.buildQuery();
      const response = await mobileGaleriaControllerListReportFotos({
        ...params,
        page: this.page(),
        limit: this.pageSize(),
      });
      if (sequence !== this.requestSequence) return;
      const reports = response.data.map((report) => this.toAuditReport(report));
      this.reports.set(reports);
      this.total.set(response.total);
      for (const report of reports) {
        for (const media of report.media) {
          if (media.storageStatus === 'UPLOADED' || !media.storageStatus) {
            this.historyApi.requestMedia(media);
          }
        }
      }
    } catch {
      if (sequence !== this.requestSequence) return;
      this.reports.set([]);
      this.total.set(0);
      this.error.set('Não foi possível carregar os reportes de fotos.');
    } finally {
      if (sequence === this.requestSequence) this.loading.set(false);
    }
  }

  private buildQuery(): MobileGaleriaControllerListReportFotosQueryParams {
    const values = this.filterForm.getRawValue();
    const params: MobileGaleriaControllerListReportFotosQueryParams = {};
    const simpleFields = [
      'appName', 'mediaType', 'mediaStorageStatus',
      'serialNumber', 'codItem', 'productionId', 'gate', 'correlationId',
      'userId', 'appVersion', 'technicalError', 'mediaPhysicalName', 'mediaPath', 'mediaMimeType',
    ] as const;
    for (const field of simpleFields) {
      const value = values[field].trim();
      if (value) params[field] = value;
    }
    if (values.reportId.trim()) params._id = values.reportId.trim();

    const dateFields = ['createdFrom', 'createdTo', 'uploadedFrom', 'uploadedTo', 'updatedFrom', 'updatedTo'] as const;
    for (const field of dateFields) {
      const value = values[field];
      if (value) params[field] = this.dateBoundary(value, field.endsWith('To'));
    }

    const properties: Record<string, string> = {};
    for (const field of ['pn', 'componPN', 'componSN'] as const) {
      const value = values[field].trim();
      if (value) properties[field] = value;
    }
    const propertyKey = values.propertyKey.trim();
    const propertyValue = values.propertyValue.trim();
    if (propertyKey && propertyValue) properties[propertyKey] = propertyValue;
    if (Object.keys(properties).length) params.properties = properties;
    return params;
  }

  private dateBoundary(date: string, endOfDay: boolean): string {
    return new Date(`${date}T${endOfDay ? '23:59:59.999' : '00:00:00'}`).toISOString();
  }

  private toAuditReport(report: ReportFotosRes): AuditReport {
    const media = (report.media ?? []).flatMap((entry) => {
      const value = entry as Record<string, unknown>;
      if (typeof value['path'] !== 'string' || typeof value['physicalName'] !== 'string') return [];
      return [{
        path: value['path'],
        physicalName: value['physicalName'],
        originalName: this.asText(value['originalName']),
        type: value['type'] === 'VIDEO' ? 'VIDEO' as const : 'IMAGE' as const,
        mimeType: this.asText(value['mimeType']),
        storageStatus: this.asText(value['storageStatus']),
        uploadedAt: this.asText(value['uploadedAt']),
        size: typeof value['size'] === 'number' ? value['size'] : undefined,
        checksum: this.asText(value['checksum']),
      }];
    });
    return { ...report, media };
  }

  private asText(value: unknown): string {
    return typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';
  }
}
