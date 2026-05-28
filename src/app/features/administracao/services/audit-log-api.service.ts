import {
  AuditLogControllerFindAllQueryParams,
  AuditLogResponseDto,
  PaginatedAuditLogResponseDtoDto,
  auditLogControllerFindAll,
} from '@/api/audit';
import { Injectable } from '@angular/core';
import { Observable, from, map } from 'rxjs';

export type AuditLogListParams = AuditLogControllerFindAllQueryParams;

export type AuditLogListItem = AuditLogResponseDto & {
  userDisplayText: string;
  userNameText: string;
  userLoginText: string;
  statusCodeText: string;
  durationMsText: string;
  errorMessageText: string;
  bodyText: string;
  queryText: string;
  headersText: string;
  timestampDate: Date | null;
};

export type AuditLogListResponse = Omit<PaginatedAuditLogResponseDtoDto, 'data'> & {
  data: AuditLogListItem[];
};

@Injectable({
  providedIn: 'root'
})
export class AuditLogApiService {
  listLogs(params: AuditLogListParams): Observable<AuditLogListResponse> {
    return from(auditLogControllerFindAll(params)).pipe(
      map((response) => ({
        ...response,
        data: Array.isArray(response?.data)
          ? response.data.map((item: any) => this.normalizeLog(item))
          : [],
      }))
    );
  }

  private normalizeLog(item: AuditLogResponseDto): AuditLogListItem {
    return {
      ...item,
      userDisplayText: this.toUserDisplayText(item.userName, item.userLogin),
      userNameText: this.toText(item.userName),
      userLoginText: this.toText(item.userLogin),
      statusCodeText: item.statusCode != null ? String(item.statusCode) : '-',
      durationMsText: item.durationMs != null ? `${item.durationMs} ms` : '-',
      errorMessageText: this.toText(item.errorMessage),
      bodyText: this.toStructuredText(item.body),
      queryText: this.toStructuredText(item.query),
      headersText: this.toStructuredText(item.headers),
      timestampDate: this.toDate(item.timestamp),
    };
  }

  private toText(value: unknown): string {
    if (typeof value === 'string') {
      return value;
    }

    if (value == null) {
      return '';
    }

    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  private toDate(value: unknown): Date | null {
    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : value;
    }

    if (typeof value === 'string' || typeof value === 'number') {
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    return null;
  }

  private toStructuredText(value: unknown): string {
    if (value == null) {
      return '';
    }

    if (typeof value === 'string') {
      return value;
    }

    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }

  private toUserDisplayText(userName: unknown, userLogin: unknown): string {
    const normalizedName = this.toText(userName);
    const normalizedLogin = this.toText(userLogin);

    if (normalizedName && normalizedLogin) {
      return `${normalizedName}\n${normalizedLogin}`;
    }

    return normalizedName || normalizedLogin || '-';
  }
}
