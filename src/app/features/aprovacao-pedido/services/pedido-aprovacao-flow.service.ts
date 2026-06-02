import { Injectable, inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { firstValueFrom, from } from 'rxjs';
import { TwoFactorGuardPolicyDtoMethodsEnum } from '@/api/auth';
import { TwoFactorGuardService } from '@/app/core/auth/services/two-factor-guard.service';
import { LogixAceiteCompraApiService } from '@/app/features/aprovacao-pedido/services/logix-aceite-compra-api.service';
import { PedidoAprovacaoStoreService } from '@/app/features/aprovacao-pedido/services/pedido-aprovacao.store.service';
import { LoadingPopupService } from '@/app/shared/services/loading-popup.service';

@Injectable({ providedIn: 'root' })
export class PedidoAprovacaoFlowService {
  private readonly twoFactorGuard = inject(TwoFactorGuardService);
  private readonly logixApi = inject(LogixAceiteCompraApiService);
  private readonly approvalStore = inject(PedidoAprovacaoStoreService);
  private readonly popup = inject(LoadingPopupService);
  private readonly messageService = inject(MessageService);

  approveOne(rowId: string): void {
    const row = this.approvalStore.rows().find((item) => item.id === rowId);

    if (!row) {
      this.popup.showErrorMessage('Pedido não encontrado para aprovação.');
      return;
    }

    this.popup.showWhile(this.createApprovalFlow([
      { pedido: row.numeroPedido, codEmpresa: row.codEmpresa, id: row.id },
    ]));
  }

  private createApprovalFlow(pedidos: Array<{ pedido: string; codEmpresa: string; id: string }>) {
    return from(this.runApprovalFlow(pedidos));
  }

  private async runApprovalFlow(
    pedidos: Array<{ pedido: string; codEmpresa: string; id: string }>,
  ): Promise<void> {
    const rowIds = pedidos.map(({ id }) => id);
    this.approvalStore.markProcessing(rowIds);

    try {
      await this.twoFactorGuard.assertStepUp(
        {
          action: 'logix-plugin.aprovar-pedidos-aceite-compra',
          maxAgeSeconds: 300,
          singleUse: false,
          methods: [
            TwoFactorGuardPolicyDtoMethodsEnum.email,
            TwoFactorGuardPolicyDtoMethodsEnum.recovery_code,
          ],
        },
        {
          routeSignature: '/aprovacao-pedido',
          resource: {
            feature: 'logix-plugin-aprovacao-pedido',
          },
        },
      );

      await Promise.all(
        pedidos.map(({ pedido, codEmpresa }) =>
          firstValueFrom(this.logixApi.processarAceiteCompra({ pedido, codEmpresa })),
        ),
      );

      this.approvalStore.removePedidos(rowIds);
      this.messageService.add({
        severity: 'success',
        summary: 'Pedidos aprovados',
        detail: `${pedidos.length} pedido(s) aprovados no Logix com confirmação 2FA.`,
      });
    } finally {
      this.approvalStore.unmarkProcessing(rowIds);
    }
  }
}
