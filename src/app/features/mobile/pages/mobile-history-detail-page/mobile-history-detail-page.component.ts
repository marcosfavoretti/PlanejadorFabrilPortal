import { CommonModule, Location } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { PageLayoutComponent } from '@/app/shared/layouts/page-layout/page-layout.component';
import { ProductionHistoryApiService } from '@/app/features/mobile/services/production-history-api.service';
import { InspectionFailure } from '@/app/features/mobile/models/production-history.models';

@Component({
  selector: 'app-mobile-history-detail-page',
  standalone: true,
  imports: [CommonModule, PageLayoutComponent],
  templateUrl: './mobile-history-detail-page.component.html',
  styleUrl: './mobile-history-detail-page.component.css',
})
export class MobileHistoryDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly historyApi = inject(ProductionHistoryApiService);
  private readonly inspectionId = this.route.snapshot.paramMap.get('id') ?? '';
  private readonly navigationState = history.state as { failure?: unknown };

  private readonly stateFailure: InspectionFailure | null =
    this.isInspectionFailure(this.navigationState.failure)
      ? this.navigationState.failure
      : null;
  private readonly failureResource = rxResource({
    request: () => ({
      partCode: this.route.snapshot.queryParamMap.get('partCode')?.trim() ?? '',
      serialNumber:
        this.route.snapshot.queryParamMap.get('serialNumber')?.trim() ?? '',
    }),
    loader: ({ request }) =>
      request.partCode && request.serialNumber
        ? this.historyApi.loadInspectionFailures(request)
        : of([]),
  });
  protected readonly failure = computed<InspectionFailure | null>(
    () =>
      this.stateFailure ??
      this.failureResource
        .value()
        ?.find(
          (failure) =>
            String(failure['Book'] ?? '').trim() === this.inspectionId
            || String(failure['EventID'] ?? '').trim() === this.inspectionId,
        ) ??
      null,
  );
  private readonly bookCode = computed(() =>
    String(this.failure()?.['Book'] ?? '').trim(),
  );
  protected readonly entries = computed(() =>
    Object.entries(this.failure() ?? {}).filter(
      ([, value]) => value !== null && value !== undefined && value !== '',
    ),
  );
  protected readonly bookResource = rxResource({
    request: () => this.bookCode(),
    loader: ({ request }) =>
      request ? this.historyApi.loadPackHtml(request) : of(null),
  });
  protected readonly bookHtml = computed<SafeHtml | null>(() => {
    const html = this.bookResource.value();
    return html ? this.sanitizer.bypassSecurityTrustHtml(html) : null;
  });

  protected labelFor(key: string): string {
    return (
      (
        {
          ResourceName: 'Recurso',
          OperatorName: 'Operador',
          PartCode: 'Part number',
          NSerie: 'Número de série',
          Detalhamento: 'Detalhamento',
          ServerTimestamp: 'Data/hora',
          OrderNum: 'Ordem',
          Operation: 'Operação',
          Sequence: 'Sequência',
          Book: 'Book',
        } as Record<string, string>
      )[key] ?? key
    );
  }

  protected backToHistory(): void {
    this.location.back();
  }

  private isInspectionFailure(value: unknown): value is InspectionFailure {
    return !!value && typeof value === 'object' && !Array.isArray(value);
  }
}
