import { Component } from '@angular/core';
import { SetoresDirComponent } from '../../widgets/setores-dir/setores-dir.component';
import { SetoresTablesComponent } from '../../widgets/setores-tables/setores-tables.component';
import { ToolBarComponent } from '../../widgets/tool-bar/tool-bar.component';
import { PageLayoutComponent } from "@/app/layouts/page-layout/page-layout.component";

@Component({
  selector: 'app-contagem-buffer-page',
  standalone: true,
  imports: [SetoresDirComponent, SetoresTablesComponent, ToolBarComponent, PageLayoutComponent],
  templateUrl: './contagem-buffer-page.component.html',
  styleUrl: './contagem-buffer-page.component.css'
})
export class ContagemBufferPageComponent {}
