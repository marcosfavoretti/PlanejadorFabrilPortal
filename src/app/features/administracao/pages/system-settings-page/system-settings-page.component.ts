import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, DestroyRef, HostListener, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { FloatLabel } from 'primeng/floatlabel';
import { MessageService } from 'primeng/api';
import { PasswordModule } from 'primeng/password';
import {
  AuthControllerGenerateInviteMutationRequest,
  AuthControllerGenerateInviteMutationResponse,
  SetUserCargoDTOCargoEnum,
} from '@/api/auth';
import {
  AtualizaAppRouteReqDTO,
  AtualizaAppRouteReqDTOCargosEnum,
  CriaAppRouteReqDto,
  CriaAppRouteReqDtoCargosEnum,
  ResAppRouteAppDTO,
} from '@/api/routes';
import { ImpressoraBluetoothResponseDto } from '@/api/mobile';
import { UserService } from '@/app/core/auth/services/user.service';
import { RoutePermissionApiService } from '@/app/core/route-permission/services/route-permission-api.service';
import { RoutePermissionStoreService } from '@/app/core/route-permission/stores/route-permission-store.service';
import { LoadingPopupService } from '@/app/shared/services/loading-popup.service';
import { AdminSectionCardComponent } from '../../shared/admin-section-card/admin-section-card.component';
import { RouteConfigFormComponent } from '../../components/route-config-form/route-config-form.component';
import { MobilePrinterApiService } from '../../services/mobile-printer-api.service';

type RouteFormSubmitValue = {
  id?: string;
  name: string;
  route: string;
  desc: string;
  cargos: CriaAppRouteReqDtoCargosEnum[];
  subRoutes: Array<{
    name: string;
    route: string;
    desc: string;
  }>;
};

@Component({
  selector: 'app-system-settings-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    MultiSelectModule,
    SelectModule,
    TableModule,
    TagModule,
    ToastModule,
    FloatLabel,
    PasswordModule,
    AdminSectionCardComponent,
    RouteConfigFormComponent,
  ],
  providers: [MessageService],
  templateUrl: './system-settings-page.component.html',
  styleUrl: './system-settings-page.component.css'
})
export class SystemSettingsPageComponent implements AfterViewInit {
  private readonly sectionIds = ['route-config', 'invites', 'role-management', 'create-user', 'printers'] as const;
  private sectionObserver?: IntersectionObserver;
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly userService = inject(UserService);
  private readonly routePermissionApiService = inject(RoutePermissionApiService);
  private readonly routePermissionStore = inject(RoutePermissionStoreService);
  private readonly mobilePrinterApiService = inject(MobilePrinterApiService);
  private readonly popup = inject(LoadingPopupService);
  private readonly messageService = inject(MessageService);

  protected readonly cargosOptions = Object.values(CriaAppRouteReqDtoCargosEnum).map(value => ({
    label: value,
    value,
  }));

  protected readonly userCargoOptions = Object.values(SetUserCargoDTOCargoEnum).map(value => ({
    label: value,
    value: String(value),
  }));

  protected readonly routes = signal<ResAppRouteAppDTO[]>([]);
  protected readonly printers = signal<ImpressoraBluetoothResponseDto[]>([]);
  protected readonly generatedInvite = signal<AuthControllerGenerateInviteMutationResponse | null>(null);
  protected readonly editingRoute = signal<ResAppRouteAppDTO | null>(null);

  protected readonly routesLoading = signal(false);
  protected readonly routeSaving = signal(false);
  protected readonly inviteSaving = signal(false);
  protected readonly roleSaving = signal(false);
  protected readonly userSaving = signal(false);
  protected readonly printerSaving = signal(false);
  protected readonly printerRemovingId = signal<string | null>(null);
  protected readonly activeSection = signal('route-config');

  protected readonly routeCount = computed(() => this.routes().length);
  protected readonly printerCount = computed(() => this.printers().length);
  protected readonly sections = [
    { id: 'route-config', label: 'Configuração de Rotas' },
    { id: 'invites', label: 'Convites' },
    { id: 'role-management', label: 'Gestão de Cargos' },
    { id: 'create-user', label: 'Criar Usuário' },
    { id: 'printers', label: 'Impressoras' },
  ] as const;
  protected readonly activeSectionLabel = computed(() =>
    this.sections.find(section => section.id === this.activeSection())?.label ?? this.sections[0].label
  );

  protected readonly inviteForm = this.fb.nonNullable.group({
    cargos: this.fb.nonNullable.control<string[]>([], Validators.required),
  });

  protected readonly userCargoForm = this.fb.nonNullable.group({
    userId: ['', Validators.required],
    cargo: this.fb.nonNullable.control<SetUserCargoDTOCargoEnum | null>(null, Validators.required),
  });

  protected readonly createUserForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  protected readonly printerForm = this.fb.nonNullable.group({
    nome: ['', Validators.required],
    macAddress: ['', [Validators.required, Validators.pattern(/^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/)]],
  });

  constructor() {
    this.loadRoutes();
    // this.loadPrinters();
    this.destroyRef.onDestroy(() => this.sectionObserver?.disconnect());
  }

  ngAfterViewInit() {
    queueMicrotask(() => {
      this.setupSectionObserver();
      this.updateActiveSectionFromViewport();
    });
  }

  @HostListener('window:scroll')
  protected onWindowScroll() {
    if (!this.sectionObserver) {
      this.updateActiveSectionFromViewport();
    }
  }

  @HostListener('window:resize')
  protected onWindowResize() {
    this.setupSectionObserver();
    this.updateActiveSectionFromViewport();
  }

  protected scrollTo(event: Event, id: string) {
    event.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
      this.activeSection.set(id);
    }
  }

  protected saveRoute(payload: RouteFormSubmitValue) {
    this.routeSaving.set(true);

    const request$ = payload.id
      ? this.routePermissionApiService.updateRota(payload.id, this.toRouteUpdateRequest(payload))
      : this.routePermissionApiService.createRota(this.toRouteRequest(payload));

    request$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: async () => {
          this.routeSaving.set(false);
          this.editingRoute.set(null);
          await this.refreshRoutesAfterMutation();
          this.showSuccess(payload.id ? 'Rota atualizada com sucesso.' : 'Rota criada com sucesso.');
        },
        error: err => {
          this.routeSaving.set(false);
          this.handleError(err, 'Não foi possível salvar a rota.');
        }
      });
  }

  protected editRoute(route: ResAppRouteAppDTO) {
    this.editingRoute.set(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  protected cancelRouteEdit() {
    this.editingRoute.set(null);
  }

  protected removeRoute(route: ResAppRouteAppDTO) {
    if (!window.confirm(`Excluir a rota "${route.name}"?`)) {
      return;
    }

    this.routeSaving.set(true);
    this.routePermissionApiService.deleteRota(route._id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: async () => {
          this.routeSaving.set(false);
          if (this.editingRoute()?._id === route._id) {
            this.editingRoute.set(null);
          }
          await this.refreshRoutesAfterMutation();
          this.showSuccess('Rota removida com sucesso.');
        },
        error: err => {
          this.routeSaving.set(false);
          this.handleError(err, 'Não foi possível remover a rota.');
        }
      });
  }

  protected generateInvite() {
    if (this.inviteForm.invalid) {
      this.inviteForm.markAllAsTouched();
      return;
    }

    this.inviteSaving.set(true);
    const rawValue = this.inviteForm.getRawValue();
    const payload: AuthControllerGenerateInviteMutationRequest = {
      cargos: rawValue.cargos.filter(Boolean),
    };

    this.userService.generateInvite(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          this.inviteSaving.set(false);
          this.generatedInvite.set(response);
          this.showSuccess('Convite gerado com sucesso.');
        },
        error: err => {
          this.inviteSaving.set(false);
          this.handleError(err, 'Não foi possível gerar o convite.');
        }
      });
  }

  protected copyInviteLink() {
    const invite = this.generatedInvite();
    if (!invite || typeof invite !== 'object' || !('url' in invite) || typeof invite.url !== 'string') {
      return;
    }

    navigator.clipboard.writeText(invite.url)
      .then(() => this.showSuccess('Link copiado para a área de transferência.'))
      .catch(() => this.popup.showErrorMessage('Não foi possível copiar o link.'));
  }

  protected updateUserCargo() {
    if (this.userCargoForm.invalid) {
      this.userCargoForm.markAllAsTouched();
      return;
    }

    this.roleSaving.set(true);
    const rawValue = this.userCargoForm.getRawValue();

    this.userService.setUserCargo({
      userId: rawValue.userId.trim(),
      cargo: rawValue.cargo!,
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.roleSaving.set(false);
          this.userCargoForm.reset({ userId: '', cargo: null });
          this.showSuccess('Cargo atualizado com sucesso.');
        },
        error: err => {
          this.roleSaving.set(false);
          this.handleError(err, 'Não foi possível atualizar o cargo do usuário.');
        }
      });
  }

  protected createUser() {
    if (this.createUserForm.invalid) {
      this.createUserForm.markAllAsTouched();
      return;
    }

    this.userSaving.set(true);
    const rawValue = this.createUserForm.getRawValue();

    this.userService.register({
      name: rawValue.name.trim(),
      email: rawValue.email.trim(),
      password: rawValue.password,
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.userSaving.set(false);
          this.createUserForm.reset({ name: '', email: '', password: '' });
          this.showSuccess('Usuário criado com sucesso.');
        },
        error: err => {
          this.userSaving.set(false);
          this.handleError(err, 'Não foi possível criar o usuário.');
        }
      });
  }

  protected createPrinter() {
    if (this.printerForm.invalid) {
      this.printerForm.markAllAsTouched();
      return;
    }

    this.printerSaving.set(true);
    const rawValue = this.printerForm.getRawValue();

    this.mobilePrinterApiService.createPrinter({
      nome: rawValue.nome.trim(),
      macAddress: rawValue.macAddress.trim(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: printer => {
          this.printerSaving.set(false);
          this.printerForm.reset({ nome: '', macAddress: '' });
          this.printers.update(printers => [printer, ...printers]);
          this.showSuccess('Impressora cadastrada com sucesso.');
        },
        error: err => {
          this.printerSaving.set(false);
          this.handleError(err, 'Não foi possível cadastrar a impressora.');
        }
      });
  }

  protected deletePrinter(printer: ImpressoraBluetoothResponseDto) {
    if (!window.confirm(`Excluir a impressora "${printer.nome}"?`)) {
      return;
    }

    this.printerRemovingId.set(printer.id);
    this.mobilePrinterApiService.deletePrinter(printer.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.printerRemovingId.set(null);
          this.printers.update(printers => printers.filter(item => item.id !== printer.id));
          this.showSuccess('Impressora removida com sucesso.');
        },
        error: err => {
          this.printerRemovingId.set(null);
          this.handleError(err, 'Não foi possível remover a impressora.');
        }
      });
  }

  private loadRoutes() {
    this.routesLoading.set(true);
    this.routePermissionApiService.getRotaByUser()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: routes => {
          this.routes.set(this.normalizeRoutes(routes));
          this.routesLoading.set(false);
        },
        error: err => {
          this.routesLoading.set(false);
          this.handleError(err, 'Não foi possível carregar as rotas do app.');
        }
      });
  }

  private loadPrinters() {
    this.mobilePrinterApiService.listPrinters()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: printers => this.printers.set(Array.isArray(printers) ? printers : []),
        error: err => this.handleError(err, 'Não foi possível carregar as impressoras Bluetooth.')
      });
  }

  private toRouteRequest(payload: RouteFormSubmitValue): CriaAppRouteReqDto {
    return {
      name: payload.name,
      route: payload.route,
      desc: payload.desc,
      cargos: payload.cargos,
      subRoutes: payload.subRoutes,
    };
  }

  private toRouteUpdateRequest(payload: RouteFormSubmitValue): AtualizaAppRouteReqDTO {
    return {
      name: payload.name,
      route: payload.route,
      desc: payload.desc,
      cargos: payload.cargos.map(cargo => cargo as unknown as AtualizaAppRouteReqDTOCargosEnum),
      subRoutes: payload.subRoutes,
    };
  }

  private async refreshRoutesAfterMutation() {
    const routes = await firstValueFrom(this.routePermissionApiService.getRotaByUser());
    this.routes.set(this.normalizeRoutes(routes));

    this.routePermissionStore.refresh()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  private normalizeRoutes(routes: unknown): ResAppRouteAppDTO[] {
    if (!Array.isArray(routes)) {
      return [];
    }

    return routes.map(route => this.normalizeRoute(route));
  }

  private normalizeRoute(route: ResAppRouteAppDTO): ResAppRouteAppDTO {
    return {
      ...route,
      cargos: Array.isArray(route.cargos) ? route.cargos : [],
      subRoutes: Array.isArray(route.subRoutes) ? route.subRoutes : [],
    };
  }

  private showSuccess(detail: string) {
    this.messageService.add({
      severity: 'success',
      summary: 'Administração',
      detail,
    });
  }

  private handleError(err: any, fallbackMessage: string) {
    const backendMessage = err?.response?.data?.message;
    const detail = Array.isArray(backendMessage) ? backendMessage[0] : backendMessage;
    this.popup.showErrorMessage(detail || fallbackMessage, err?.response?.data?.error);
  }

  private updateActiveSectionFromViewport() {
    if (typeof window === 'undefined') {
      return;
    }

    const sections = this.sectionIds
      .map(id => document.getElementById(id))
      .filter((section): section is HTMLElement => !!section);

    if (!sections.length) {
      return;
    }

    const stickyOffset = this.getStickyOffset();
    let currentSection = sections[0];

    for (const section of sections) {
      if (section.getBoundingClientRect().top - stickyOffset <= 0) {
        currentSection = section;
      }
    }

    this.activeSection.set(currentSection.id);
  }

  private setupSectionObserver() {
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
      this.sectionObserver?.disconnect();
      this.sectionObserver = undefined;
      return;
    }

    const sections = this.sectionIds
      .map(id => document.getElementById(id))
      .filter((section): section is HTMLElement => !!section);

    if (!sections.length) {
      return;
    }

    this.sectionObserver?.disconnect();
    const topOffset = this.getStickyOffset();

    this.sectionObserver = new IntersectionObserver(entries => {
      const visibleEntries = entries
        .filter(entry => entry.isIntersecting)
        .sort((entryA, entryB) => {
          if (entryB.intersectionRatio !== entryA.intersectionRatio) {
            return entryB.intersectionRatio - entryA.intersectionRatio;
          }

          return Math.abs(entryA.boundingClientRect.top - topOffset)
            - Math.abs(entryB.boundingClientRect.top - topOffset);
        });

      const nextActive = visibleEntries[0]?.target;
      if (nextActive instanceof HTMLElement) {
        this.activeSection.set(nextActive.id);
      }
    }, {
      root: null,
      rootMargin: `-${topOffset}px 0px -45% 0px`,
      threshold: [0.15, 0.35, 0.6],
    });

    sections.forEach(section => this.sectionObserver?.observe(section));
  }

  private getStickyOffset() {
    const stickyNav = document.querySelector('.system-settings-page__sticky-nav');
    const stickyTop = stickyNav instanceof HTMLElement
      ? Number.parseFloat(window.getComputedStyle(stickyNav).top || '0')
      : 0;

    return stickyTop + 24;
  }
}
