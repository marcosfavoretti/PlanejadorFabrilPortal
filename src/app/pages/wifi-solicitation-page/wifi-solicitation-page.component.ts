import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { WifiAPIService } from '@/app/services/WifiAPI.service';
import { Router } from '@angular/router';
import { catchError, of, tap } from 'rxjs';
import { LoadingPopupService } from '@/app/services/LoadingPopup.service';
import { PageLayoutComponent } from "@/app/layouts/page-layout/page-layout.component";

/**
 * @title Tela de Solicitação de Acesso Wi-Fi
 * @description Este componente renderiza uma página para que os usuários possam solicitar acesso à rede Wi-Fi 
 * informando seu e-mail. Atualmente, a integração com o backend é um placeholder e precisa ser implementada.
 * A arquitetura segue as melhores práticas do Angular, utilizando um componente standalone, reatividade com Signals 
 * e formulários reativos para validação.
 */
@Component({
  selector: 'app-wifi-solicitation-page',
  templateUrl: './wifi-solicitation-page.component.html',
  styleUrls: ['./wifi-solicitation-page.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PageLayoutComponent
],
})
export class WifiSolicitationPageComponent {
  /**
   * @description Formulário reativo para controlar o input de e-mail e suas validações.
   * O e-mail é obrigatório e deve seguir o formato padrão de e-mails.
   */
  public wifiAccessForm: FormGroup;

  /**
   * @description Signal para controlar o estado da UI, como o status de submissão 
   * (initial, loading, success, error).
   */
  public submissionStatus = signal<'initial' | 'loading' | 'success' | 'error'>('initial');

  // Injeção de dependências do Angular
  private readonly fb = inject(FormBuilder);

  /**
   * @description Placeholder para o serviço de API de Wi-Fi.
   * TODO: Substituir pela injeção do serviço real quando ele for criado.
   * Ex: private readonly wifiApiService = inject(WifiApiService);
   */
  private readonly wifiApiService = inject(WifiAPIService);
  private readonly popup = inject(LoadingPopupService);
  private readonly router = inject(Router);

  constructor() {
    this.wifiAccessForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  /**
   * @description Envia a solicitação de acesso Wi-Fi.
   * Valida o formulário e, se válido, simula uma chamada de API.
   * O estado da submissão é atualizado para refletir o resultado.
   */
  public requestWifiAccess(): void {
    if (this.wifiAccessForm.invalid) {
      this.submissionStatus.set('error');
      return;
    }

    this.submissionStatus.set('loading');
    const email = this.wifiAccessForm.get('email')?.value;

    console.log(`Solicitando acesso para o e-mail: ${email}`);

    const solicitaWifi$ = this.wifiApiService.solicitarWifiCode({
      email: email
    })
      .pipe(
        tap(
          token => {
            this.submissionStatus.set('success');
            this.wifiAccessForm.reset();
          }
        ),
        catchError(err => { this.submissionStatus.set('error'); throw err })
      );
    this.popup.showWhile(solicitaWifi$)
    // Simulação de sucesso para fins de desenvolvimento

  }
}
