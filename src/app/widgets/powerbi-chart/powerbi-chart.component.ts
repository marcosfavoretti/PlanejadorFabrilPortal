import { SafeUrlMakerService } from '@/app/services/SafeUrlMaker.service';
import { Component, Input, OnInit, OnChanges, SimpleChanges, HostBinding } from '@angular/core';
import { PowerbiDataset } from './@core/models/PowerbiDataset';
import { CommonModule } from '@angular/common';
import { SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-powerbi-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './powerbi-chart.component.html',
  styleUrl: './powerbi-chart.component.css'
})
export class PowerbiChartComponent implements OnInit, OnChanges {
  constructor(private safeUrlService: SafeUrlMakerService) { }

  @Input('powerbichart') powerbiCharturl?: PowerbiDataset;
  @Input() activeId?: string | number;

  visible: boolean = false;

  @HostBinding('style.display') get display() {
    return this.visible ? 'block' : 'none';
  }

  @HostBinding('style.zIndex') get zIndex() {
    return this.visible ? '10' : '1';
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['powerbiCharturl'] && this.powerbiCharturl) {
      this.generateUrl();
    }
    
    if (changes['activeId'] || changes['powerbiCharturl']) {
      this.updateVisibility();
    }
  }

  ngOnInit() {
    this.generateUrl();
    this.updateVisibility();
  }

  private generateUrl() {
    if (this.powerbiCharturl && !this.powerbiCharturl.safeUrl) {
      const generatedSafeUrl: SafeResourceUrl = this.safeUrlService.generateSafeUrl(this.powerbiCharturl.urlView);
      this.powerbiCharturl.safeUrl = generatedSafeUrl;
    }
  }

  private updateVisibility() {
    if (this.powerbiCharturl && this.activeId !== undefined) {
      this.visible = String(this.powerbiCharturl.PowerbiDatasetsID) === String(this.activeId);
    } else {
      this.visible = false;
    }
  }
}
