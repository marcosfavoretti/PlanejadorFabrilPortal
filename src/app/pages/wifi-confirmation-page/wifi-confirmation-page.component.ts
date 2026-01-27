import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { WifiAPIService } from '@/app/services/WifiAPI.service';
import { catchError, tap } from 'rxjs';
import { LoadingPopupService } from '@/app/services/LoadingPopup.service';

/**
 * @title Tela de Finalização de Cadastro Wi-Fi
 * @description Esta página é a etapa final do cadastro. O usuário, vindo de um link com um ID,
 * preenche seu nome, empresa e e-mail para concluir o acesso à rede Wi-Fi.
 */
@Component({
  selector: 'app-wifi-confirmation-page',
  templateUrl: './wifi-confirmation-page.component.html',
  styleUrls: ['./wifi-confirmation-page.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule // Importar para usar formulários reativos
  ],
})
export class WifiConfirmationPageComponent implements OnInit {
  // Injeção de dependências do Angular
  private readonly activateRoute = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly fb = inject(FormBuilder);

  /**
   * @description Placeholder para o serviço de API de Wi-Fi.
   * TODO: Substituir pela injeção do serviço real.
   * Ex: private readonly wifiApiService = inject(WifiApiService);
   */
  private readonly wifiApiService = inject(WifiAPIService);

  private readonly popup = inject(LoadingPopupService);
  /**
   * @description Signal para controlar o estado da submissão na UI.
   * Estados: 'form', 'loading', 'success', 'error'.
   */
  public submissionStatus = signal<'form' | 'loading' | 'success' | 'error'>('form');

  /**
   * @description Formulário reativo para coletar os dados do visitante.
   */
  public visitorForm: FormGroup;

  /**
   * @description Armazena o ID de confirmação obtido da URL.
   */
  public confirmationId: string | null = null;
  public errorMessage = signal<string>('');
  public wifiCode = signal<string>('');
  constructor() {
    this.visitorForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      company: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
    });
  }

  ngOnInit(): void {
    this.confirmationId = this.activateRoute.snapshot.paramMap.get('id');
    // Se o ID não existir, podemos redirecionar ou mostrar um erro imediatamente.
    if (!this.confirmationId) {
      this.submissionStatus.set('error');
      this.errorMessage.set('Link de cadastro inválido ou expirado.');
    }
    this.wifiApiService
      .checkMagicLink(this.confirmationId!)
      .pipe(
        catchError(err => {
          this.router.navigate(['/', 'wifi'])
          throw err;
        })
      )
      .subscribe();
  }

  /**
   * @description Envia os dados finais do cadastro para o backend.
   * Valida o formulário e, se válido, simula uma chamada de API para finalizar o registro.
   */
  public finalizeRegistration(): void {
    if (this.visitorForm.invalid) {
      // Marca todos os campos como 'touched' para exibir os erros de validação
      this.visitorForm.markAllAsTouched();
      return;
    }

    this.submissionStatus.set('loading');
    const formData = this.visitorForm.value;

    console.log(`Finalizando cadastro para o ID: ${this.confirmationId}`, formData);

    const criarCodigo$ = this.wifiApiService.criarWifiCode(this.confirmationId!, {
      visitanteNome: formData.name,
      visitanteEmpresa: formData.company,
      visitanteEmail: formData.email
    })
      .pipe(
        tap((code) => {
          this.wifiCode.set(code)
          this.submissionStatus.set('success');
          this.visitorForm.reset();
        }),
        catchError(err => {
          this.submissionStatus.set('error');
          throw err;
        })
      )

    this.popup.showWhile(criarCodigo$);
  }

  /**
   * @description Helper para acessar facilmente os controles do formulário no template.
   */
  get f() {
    return this.visitorForm.controls;
  }
}