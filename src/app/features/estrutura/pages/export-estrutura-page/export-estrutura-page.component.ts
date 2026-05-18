import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EstruturaApiService } from '@/app/features/estrutura/services/EstruturaApi.service';
import { MessageService } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ActivatedRoute, Router } from '@angular/router';
import { EstruturaContextService } from '@/app/features/estrutura/services/EstruturaContext.service';

@Component({
  selector: 'app-export-estrutura-page',
  standalone: true,
  imports: [CommonModule, FormsModule, InputTextModule, ButtonModule, ToastModule],
  template: `
    <div class="h-100 p-4 bg-light overflow-auto">
      <div class="card border-0 shadow-sm mb-4">
        <div class="card-body d-flex align-items-center justify-content-between p-3">
          <div class="d-flex align-items-center">
            <div class="bg-primary-subtle p-3 rounded-circle me-3">
               <i class="pi pi-sync text-primary" style="font-size: 1.5rem"></i>
            </div>
            <div>
              <h4 class="mb-0 fw-bold">Exportar / Sincronizar Estrutura</h4>
              <p class="text-muted small mb-0">Força a resincronização de um item com o backend.</p>
            </div>
          </div>
        </div>
      </div>

      <div class="row justify-content-center mt-5">
        <div class="col-12 col-md-8 col-lg-5">
          <div class="card border-0 shadow-sm p-4 text-center rounded-4 position-relative overflow-hidden">

            <div class="position-relative">

              <h5 class="fw-bold mb-3">Resincronizar Item</h5>
              <p class="text-muted small mb-4">Insira o partcode do item para atualizar sua estrutura no Neo4J e sistemas dependentes.</p>
              
              <div class="flex flex-column gap-2 text-start mb-4">
                <label for="partcode" class="fw-bold small text-muted ms-1" style="font-size: 0.65rem; letter-spacing: 0.05rem;">PARTCODE</label>
                <input 
                  id="partcode" 
                  type="text" 
                  pInputText 
                  class="w-100 border-0 bg-light rounded-3 p-3 shadow-none transition-all" 
                  [class.border-success]="exported()"
                  [(ngModel)]="partcode" 
                  placeholder="Ex: 1234567"
                  (keyup.enter)="exportar()"
                  (ngModelChange)="onInputChange()"
                />
              </div>

              <button 
                class="btn btn-success w-100 py-3 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2 rounded-3 mb-3" 
                (click)="exportar()"
                [disabled]="!partcode.trim() || loading()"
              >
                @if (loading()) {
                  <i class="pi pi-spin pi-spinner"></i>
                  Sincronizando...
                } @else {
                  <i class="pi pi-sync"></i>
                  Sincronizar Agora
                }
              </button>

              <!-- Redirection Buttons with Animation -->
              @if (exported()) {
                <div class="redirection-container mt-4 pt-3 border-top border-light-subtle d-flex flex-column gap-2">
                  <p class="small fw-bold text-success mb-2 animate-fade-in">
                    <i class="pi pi-check-circle me-1"></i> Item {{ lastExportedPartcode() }} sincronizado!
                  </p>
                  
                  <div class="row g-2">
                    <div class="col-6">
                      <button 
                        class="btn btn-outline-primary w-100 py-2 small fw-bold d-flex align-items-center justify-content-center gap-2 rounded-3 animate-slide-up"
                        (click)="goTo('consultar')"
                      >
                        <i class="pi pi-search" style="font-size: 0.8rem"></i>
                        Ver Estrutura
                      </button>
                    </div>
                    <div class="col-6">
                      <button 
                        class="btn btn-outline-warning w-100 py-2 small fw-bold d-flex align-items-center justify-content-center gap-2 rounded-3 animate-slide-up"
                        style="animation-delay: 100ms"
                        (click)="goTo('analise')"
                      >
                        <i class="pi pi-chart-bar" style="font-size: 0.8rem"></i>
                        Análise
                      </button>
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
    <p-toast></p-toast>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .bg-light { background-color: #f8f9fa !important; }
    .rounded-4 { border-radius: 1.25rem !important; }
    .rounded-3 { border-radius: 0.75rem !important; }
    
    .icon-container {
      width: 80px;
      height: 80px;
      background: #f1f5f9;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #64748b;
      transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .icon-container.success {
      background: #dcfce7;
      color: #16a34a;
      transform: scale(1.1);
    }

    .animate-fade-in {
      animation: fadeIn 0.4s ease-out forwards;
    }

    .animate-slide-up {
      animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      opacity: 0;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideUp {
      from { 
        opacity: 0;
        transform: translateY(15px);
      }
      to { 
        opacity: 1;
        transform: translateY(0);
      }
    }

    .transition-all { transition: all 0.3s ease; }
    .duration-300 { transition-duration: 300ms; }
  `]
})
export class ExportEstruturaPageComponent implements OnInit {
  private itemApi = inject(EstruturaApiService);
  private messageService = inject(MessageService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private estruturaContext = inject(EstruturaContextService);

  partcode = '';
  loading = signal(false);
  exported = signal(false);
  lastExportedPartcode = signal('');

  ngOnInit(): void {
    const partcode = this.route.snapshot.queryParamMap.get('partcode') ?? this.estruturaContext.getPartcode();
    if (partcode) {
      this.partcode = partcode;
    }
  }

  onInputChange() {
    if (this.exported() && this.partcode.trim().toUpperCase() !== this.lastExportedPartcode()) {
      this.exported.set(false);
    }
  }

  exportar() {
    const pc = this.partcode.trim().toUpperCase();
    if (!pc) return;

    this.partcode = pc;
    this.estruturaContext.setPartcode(pc);
    this.loading.set(true);
    this.exported.set(false);

    this.itemApi.exportItem(pc).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: `Item ${pc} enviado para resincronização.`
        });
        this.loading.set(false);
        this.exported.set(true);
        this.lastExportedPartcode.set(pc);
      },
      error: (err) => {
        console.error('Erro ao exportar item:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Não foi possível solicitar a resincronização.'
        });
        this.loading.set(false);
      }
    });
  }

  goTo(page: 'consultar' | 'analise') {
    const pc = this.lastExportedPartcode() || this.partcode.trim().toUpperCase();
    if (pc) {
      this.estruturaContext.setPartcode(pc);
    }
    this.router.navigate([`/estrutura/${page}`], {
      queryParams: { partcode: pc }
    });
  }
}
