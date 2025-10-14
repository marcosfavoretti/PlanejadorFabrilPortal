import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { GlobalHeaderComponent } from './widgets/global-header/global-header.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, GlobalHeaderComponent
    
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'PlanejamentoEthosPortal';
}
