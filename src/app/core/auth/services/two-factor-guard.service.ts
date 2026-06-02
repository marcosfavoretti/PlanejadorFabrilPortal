import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  TwoFactorGuardPolicyDtoMethodsEnum,
  twoFactorGuardEvaluationControllerEvaluate,
} from '@/api/auth';
import { UserstoreService } from '@/app/core/user/stores/user-store.service';

export interface SharedTwoFactorGuardPolicy {
  action: string;
  maxAgeSeconds?: number;
  methods?: TwoFactorGuardPolicyDtoMethodsEnum[];
  singleUse?: boolean;
  bindUserAgent?: boolean;
  challengeTtlSeconds?: number;
  assertionTtlSeconds?: number;
  maxAttempts?: number;
}

export interface SharedTwoFactorGuardContext {
  resource: unknown;
  routeSignature?: string;
}

@Injectable({ providedIn: 'root' })
export class TwoFactorGuardService {
  private readonly userStore = inject(UserstoreService);
  private readonly router = inject(Router);

  async assertStepUp(
    policy: SharedTwoFactorGuardPolicy,
    context: SharedTwoFactorGuardContext,
  ): Promise<void> {
    const user = this.userStore.getUser();

    await twoFactorGuardEvaluationControllerEvaluate({
      policy: {
        action: policy.action,
        maxAgeSeconds: policy.maxAgeSeconds ?? 300,
        methods: policy.methods,
        singleUse: policy.singleUse ?? false,
        bindUserAgent: policy.bindUserAgent ?? true,
        challengeTtlSeconds: policy.challengeTtlSeconds ?? 300,
        assertionTtlSeconds: policy.assertionTtlSeconds ?? 300,
        maxAttempts: policy.maxAttempts ?? 5,
      },
      context: {
        userId: user.id,
        userEmail: user.email,
        cargosLista: user.cargosLista,
        routeSignature: context.routeSignature ?? this.router.url,
        resourceHash: await this.hashResource(context.resource),
        userAgent: typeof navigator === 'undefined' ? undefined : navigator.userAgent,
      },
    });
  }

  private async hashResource(resource: unknown): Promise<string> {
    const content = this.stableStringify(resource);
    const encoded = new TextEncoder().encode(content);
    const digest = await crypto.subtle.digest('SHA-256', encoded);

    return Array.from(new Uint8Array(digest))
      .map((value) => value.toString(16).padStart(2, '0'))
      .join('');
  }

  private stableStringify(value: unknown): string {
    if (Array.isArray(value)) {
      return `[${value.map((item) => this.stableStringify(item)).join(',')}]`;
    }

    if (value && typeof value === 'object') {
      const entries = Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nestedValue]) => `"${key}":${this.stableStringify(nestedValue)}`);

      return `{${entries.join(',')}}`;
    }

    return JSON.stringify(value) ?? 'null';
  }
}
