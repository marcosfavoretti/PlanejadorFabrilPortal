export type TwoFactorMethod = 'email' | 'recovery_code';

export interface TwoFactorRequiredPayload {
  code: 'TWO_FACTOR_REQUIRED';
  challengeId: string;
  action: string;
  allowedMethods: TwoFactorMethod[];
  expiresAt: string;
}

export interface TwoFactorEmailSendResponse {
  sent: boolean;
  maskedEmail: string;
}

export interface TwoFactorVerifyRequest {
  code: string;
  method: TwoFactorMethod;
}

export interface TwoFactorVerifyResponse {
  verified: boolean;
  action: string;
  expiresAt: string;
}

export type TwoFactorFlowOutcome =
  | { status: 'verified' }
  | { status: 'expired' }
  | { status: 'cancelled' };
