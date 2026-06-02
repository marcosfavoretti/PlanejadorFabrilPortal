import { Injectable, inject } from '@angular/core';
import type { AxiosError, AxiosResponse } from 'axios';
import { TwoFactorRequestConfig, axiosInstance } from '@/client';
import { LoadingPopupService } from '@/app/shared/services/loading-popup.service';
import {
  twoFactorControllerSendEmailCode,
  twoFactorControllerVerifyChallenge,
  VerifyTwoFactorDtoMethodEnum,
} from '@/api/auth';
import {
  TwoFactorEmailSendResponse,
  TwoFactorFlowOutcome,
  TwoFactorRequiredPayload,
  TwoFactorVerifyRequest,
  TwoFactorVerifyResponse,
} from '../two-factor/two-factor.types';
import { TwoFactorStepUpComponent } from '../two-factor/two-factor-step-up.component';

export class TwoFactorCancelledError extends Error {
  constructor() {
    super('A confirmação de identidade foi cancelada pelo usuário.');
    this.name = 'TwoFactorCancelledError';
  }
}

export class TwoFactorChallengeAbortedError extends Error {
  constructor(status: Exclude<TwoFactorFlowOutcome['status'], 'verified'>) {
    super(`O desafio de confirmação de identidade foi encerrado com status "${status}".`);
    this.name = 'TwoFactorChallengeAbortedError';
  }
}

export interface TwoFactorAxiosRequestConfig {
  skipTwoFactorHandler?: boolean;
  twoFactorRetryCount?: number;
}

@Injectable({ providedIn: 'root' })
export class TwoFactorStepUpService {
  private readonly popup = inject(LoadingPopupService);
  private activeFlow: Promise<TwoFactorFlowOutcome> | null = null;

  async handleAxiosChallenge(
    error: AxiosError,
    initialChallenge: TwoFactorRequiredPayload,
  ): Promise<AxiosResponse<unknown>> {
    const originalConfig = error.config as (typeof error.config & TwoFactorAxiosRequestConfig) | undefined;

    if (!originalConfig) {
      throw error;
    }

    let challenge = initialChallenge;
    let retryCount = originalConfig.twoFactorRetryCount ?? 0;

    while (retryCount < 3) {
      const outcome = await this.openChallengeModal(challenge);

      if (outcome.status !== 'verified') {
        if (outcome.status === 'cancelled') {
          throw new TwoFactorCancelledError();
        }

        throw new TwoFactorChallengeAbortedError(outcome.status);
      }

      try {
        const retryConfig: TwoFactorRequestConfig = {
          ...originalConfig,
          headers: originalConfig.headers ? { ...originalConfig.headers } : undefined,
          twoFactorRetryCount: retryCount + 1,
        };

        return await axiosInstance.request(retryConfig);
      } catch (retryError) {
        if (this.isTwoFactorRequiredError(retryError)) {
          challenge = retryError.response!.data;
          retryCount += 1;
          continue;
        }

        throw retryError;
      }
    }

    throw error;
  }

  async sendEmailCode(challengeId: string, reason?: string): Promise<TwoFactorEmailSendResponse> {
    return twoFactorControllerSendEmailCode(challengeId, reason ? { reason } : {});
  }

  async verifyChallenge(
    challengeId: string,
    payload: TwoFactorVerifyRequest,
  ): Promise<TwoFactorVerifyResponse> {
    return twoFactorControllerVerifyChallenge(challengeId, {
      code: payload.code,
      method: payload.method === 'email'
        ? VerifyTwoFactorDtoMethodEnum.email
        : VerifyTwoFactorDtoMethodEnum.recovery_code,
    });
  }

  private openChallengeModal(challenge: TwoFactorRequiredPayload): Promise<TwoFactorFlowOutcome> {
    if (this.activeFlow) {
      return this.activeFlow;
    }

    const modalRef = this.popup.showPopUpComponent<TwoFactorStepUpComponent>(
      TwoFactorStepUpComponent,
      { challenge },
      {
        size: 'md',
        keyboard: true,
      },
    );

    this.activeFlow = modalRef.result
      .then((result) => this.normalizeModalResult(result))
      .finally(() => {
        this.activeFlow = null;
      });

    return this.activeFlow;
  }

  private normalizeModalResult(result: unknown): TwoFactorFlowOutcome {
    if (result && typeof result === 'object' && 'status' in result) {
      const status = (result as TwoFactorFlowOutcome).status;
      if (status === 'verified' || status === 'expired' || status === 'cancelled') {
        return { status };
      }
    }

    throw new Error('Fluxo de verificação em duas etapas foi interrompido.');
  }

  private isTwoFactorRequiredError(error: unknown): error is AxiosError<TwoFactorRequiredPayload> {
    if (!error || typeof error !== 'object') {
      return false;
    }

    const axiosError = error as AxiosError<TwoFactorRequiredPayload>;
    return axiosError.response?.status === 403 && axiosError.response?.data?.code === 'TWO_FACTOR_REQUIRED';
  }
}
