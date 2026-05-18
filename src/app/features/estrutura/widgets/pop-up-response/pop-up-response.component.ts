import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-pop-up-response',
  templateUrl: './pop-up-response.component.html',
  styleUrls: ['./pop-up-response.component.css'],
  standalone: true,
  imports: []
})
export class PopUpResponseComponent implements OnInit {
  constructor(public dialogRef: DynamicDialogRef, public config: DynamicDialogConfig) { 
    this.msg = this.config.data;
  }
  public msg: {msg:string, stt: "error"|"confirm"};

  ngOnInit() {
  }

}
