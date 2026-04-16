import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PortariaWsService } from './services/PortariaWs.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  private portariaWs = inject(PortariaWsService);
  title = 'App Ethos';
}
