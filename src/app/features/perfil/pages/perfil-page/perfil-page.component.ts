import { Component, DestroyRef, OnInit, computed, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SetUserCargoDTOCargoEnum } from '@/api/auth';
import { UserstoreService } from '@/app/core/user/stores/user-store.service';
import { AccountInfoCardComponent } from '../../components/account-info-card/account-info-card.component';
import { ApiKeysWidgetComponent } from '../../components/api-keys/api-keys-widget/api-keys-widget.component';
import { TwoFactorSettingsComponent } from '../../components/two-factor/two-factor-settings/two-factor-settings.component';

@Component({
  selector: 'app-perfil-page',
  standalone: true,
  imports: [AccountInfoCardComponent, ApiKeysWidgetComponent, TwoFactorSettingsComponent],
  templateUrl: './perfil-page.component.html',
  styleUrl: './perfil-page.component.css',
})
export class PerfilPageComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly userStore = inject(UserstoreService);

  protected readonly user = this.userStore.item;
  // O controller de API keys no user-authenticator exige o cargo ADMIN.
  protected readonly canManageApiKeys = computed(() =>
    this.user()?.cargosLista?.includes(SetUserCargoDTOCargoEnum.ADMIN) ?? false
  );

  ngOnInit(): void {
    if (!this.user()) {
      this.userStore.refresh()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({ error: () => undefined });
    }
  }
}
