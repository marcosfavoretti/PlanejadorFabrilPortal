import { CommonModule } from '@angular/common';
import { Component, effect, inject, input, output } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { TextareaModule } from 'primeng/textarea';
import { FloatLabel } from 'primeng/floatlabel';
import {
  CriaAppRouteReqDtoCargosEnum,
  ResAppRouteAppDTO,
} from '@/api/routes';

type RouteFormValue = {
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

type SubRouteFormGroup = FormGroup<{
  name: FormControl<string>;
  route: FormControl<string>;
  desc: FormControl<string>;
}>;

@Component({
  selector: 'app-route-config-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    MultiSelectModule,
    TextareaModule,
    FloatLabel,
  ],
  templateUrl: './route-config-form.component.html',
  styleUrl: './route-config-form.component.css'
})
export class RouteConfigFormComponent {
  private readonly fb = inject(FormBuilder);

  readonly routeModel = input<ResAppRouteAppDTO | null>(null);
  readonly cargosOptions = input.required<Array<{ label: string; value: CriaAppRouteReqDtoCargosEnum }>>();
  readonly busy = input(false);

  readonly save = output<RouteFormValue>();
  readonly cancelEdit = output<void>();

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    route: ['', Validators.required],
    desc: ['', Validators.required],
    cargos: this.fb.nonNullable.control<CriaAppRouteReqDtoCargosEnum[]>([], Validators.required),
    subRoutes: this.fb.array<SubRouteFormGroup>([]),
  });

  constructor() {
    effect(() => {
      this.syncForm(this.routeModel());
    });
  }

  get subRoutes(): FormArray<SubRouteFormGroup> {
    return this.form.controls.subRoutes;
  }

  addSubRoute() {
    this.subRoutes.push(this.createSubRouteGroup());
  }

  removeSubRoute(index: number) {
    this.subRoutes.removeAt(index);
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const routeModel = this.routeModel();
    const rawValue = this.form.getRawValue();

    this.save.emit({
      id: routeModel?._id,
      name: rawValue.name.trim(),
      route: rawValue.route.trim(),
      desc: rawValue.desc.trim(),
      cargos: rawValue.cargos,
      subRoutes: rawValue.subRoutes.map((subRoute: { name: string; route: string; desc: string }) => ({
        name: subRoute.name.trim(),
        route: subRoute.route.trim(),
        desc: subRoute.desc.trim(),
      })),
    });
  }

  resetToCreateMode() {
    this.syncForm(null);
    this.cancelEdit.emit();
  }

  private syncForm(routeModel: ResAppRouteAppDTO | null) {
    this.subRoutes.clear();

    if (!routeModel) {
      this.form.reset({
        name: '',
        route: '',
        desc: '',
        cargos: [],
      });
      return;
    }

    this.form.reset({
      name: routeModel.name,
      route: routeModel.route,
      desc: routeModel.desc,
      cargos: routeModel.cargos.map(cargo => cargo as unknown as CriaAppRouteReqDtoCargosEnum),
    });

    (routeModel.subRoutes ?? []).forEach(subRoute => {
      this.subRoutes.push(this.createSubRouteGroup(subRoute));
    });
  }

  private createSubRouteGroup(subRoute?: { name: string; route: string; desc: string }) {
    return this.fb.nonNullable.group({
      name: [subRoute?.name ?? '', Validators.required],
      route: [subRoute?.route ?? '', Validators.required],
      desc: [subRoute?.desc ?? '', Validators.required],
    }) as SubRouteFormGroup;
  }
}
