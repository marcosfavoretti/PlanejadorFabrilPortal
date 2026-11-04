import { AfterViewInit, Component, DestroyRef, ElementRef, ViewChild, inject } from '@angular/core';
import { SetoresDirComponent } from '@/app/features/estrutura/widgets/setores-dir/setores-dir.component';
import { SetoresTablesComponent } from '@/app/features/estrutura/widgets/setores-tables/setores-tables.component';
import { ToolBarComponent } from '@/app/shared/components/tool-bar/tool-bar.component';
import { PageLayoutComponent } from "@/app/shared/layouts/page-layout/page-layout.component";

@Component({
  selector: 'app-contagem-buffer-page',
  standalone: true,
  imports: [SetoresDirComponent, SetoresTablesComponent, ToolBarComponent, PageLayoutComponent],
  templateUrl: './contagem-buffer-page.component.html',
  styleUrl: './contagem-buffer-page.component.css'
})
export class ContagemBufferPageComponent implements AfterViewInit {
  @ViewChild('navbar') private navbar!: ElementRef<HTMLElement>;
  private host: HTMLElement = inject(ElementRef).nativeElement;
  private destroyRef = inject(DestroyRef);

  // expõe a altura da navbar sticky para os cabeçalhos sticky da tabela
  ngAfterViewInit(): void {
    const ro = new ResizeObserver(() =>
      this.host.style.setProperty('--app-navbar-h', `${this.navbar.nativeElement.offsetHeight}px`));
    ro.observe(this.navbar.nativeElement);
    this.destroyRef.onDestroy(() => ro.disconnect());
  }
}
