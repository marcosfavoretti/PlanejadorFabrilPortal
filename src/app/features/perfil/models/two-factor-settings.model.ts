// O Swagger do user-authenticator tipa essas respostas como `any`;
// os formatos abaixo espelham os usecases do módulo 2fa no backend.

export type TwoFactorUserStatus = {
  enabled: boolean;
  hasTotpSecret: boolean;
  recoveryCodesRemaining: number;
  lastEnrolledAt: string | null;
  lastVerifiedAt: string | null;
  serviceAccountBypass: boolean;
};

export type TotpEnrollment = {
  enrollmentId: string;
  secret: string;
  otpauthUrl: string;
  qrCodeDataUrl: string;
  expiresAt: string;
};

export type TotpEnrollmentResult = {
  enabled: boolean;
  recoveryCodes: string[];
};

export type RecoveryCodesResult = {
  recoveryCodes: string[];
};
