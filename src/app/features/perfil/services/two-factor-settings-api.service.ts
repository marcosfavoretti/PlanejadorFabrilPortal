import {
  twoFactorSelfServiceControllerCompleteEnrollment,
  twoFactorSelfServiceControllerDisable,
  twoFactorSelfServiceControllerGetStatus,
  twoFactorSelfServiceControllerRotateRecoveryCodes,
  twoFactorSelfServiceControllerStartEnrollment,
} from '@/api/auth';
import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import {
  RecoveryCodesResult,
  TotpEnrollment,
  TotpEnrollmentResult,
  TwoFactorUserStatus,
} from '../models/two-factor-settings.model';

@Injectable({
  providedIn: 'root'
})
export class TwoFactorSettingsApiService {
  getStatus(): Observable<TwoFactorUserStatus> {
    return from(twoFactorSelfServiceControllerGetStatus());
  }

  startEnrollment(): Observable<TotpEnrollment> {
    return from(twoFactorSelfServiceControllerStartEnrollment({}));
  }

  completeEnrollment(enrollmentId: string, code: string): Observable<TotpEnrollmentResult> {
    return from(twoFactorSelfServiceControllerCompleteEnrollment({ enrollmentId, code }));
  }

  rotateRecoveryCodes(code: string): Observable<RecoveryCodesResult> {
    return from(twoFactorSelfServiceControllerRotateRecoveryCodes({ code }));
  }

  // Aceita código TOTP ou um código de recuperação.
  disable(code: string): Observable<void> {
    return from(twoFactorSelfServiceControllerDisable({ code }));
  }
}

export function mapTwoFactorError(err: any, fallbackMessage: string): string {
  if (err?.response?.status === 429) {
    return 'Muitas tentativas em sequência. Aguarde alguns instantes e tente novamente.';
  }

  const backendMessage = err?.response?.data?.message;
  const detail = Array.isArray(backendMessage) ? backendMessage[0] : backendMessage;
  return detail || fallbackMessage;
}
