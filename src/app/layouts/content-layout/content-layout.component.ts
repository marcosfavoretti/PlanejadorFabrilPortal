import { PageLayoutComponent } from '@/app/layouts/page-layout/page-layout.component';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
@Component({
  selector: 'app-content-layout',
  imports: [
    RouterOutlet,
    PageLayoutComponent
],
  templateUrl: './content-layout.component.html',
  styleUrl: './content-layout.component.css'
})
export class ContentLayoutComponent {
  // popup = inject(LoadingPopupService);
  // router = inject(Router);
  // user = inject(UserstoreService);
  // loadFinish: boolean = true;
  // routerPermissionStore = inject(RoutePermissionStoreService);

}
