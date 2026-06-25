import { Component, EventEmitter, Input, Output } from '@angular/core';
import type { ResEstruturaItemTreeDTO } from '@/api/estrutura';
import { CheckBoxResponseEvent, ItemResultListRegisterChecklistComponent } from '../item-result-list-register-checklist/item-result-list-register-checklist.component';

@Component({
  selector: 'app-checklist-cadastro-result',
  standalone: true,
  imports: [ItemResultListRegisterChecklistComponent],
  templateUrl: './checklist-cadastro-result.component.html',
})
export class ChecklistCadastroResultComponent {
  @Input() itens: ResEstruturaItemTreeDTO[] = [];
  @Input() targetItem?: ResEstruturaItemTreeDTO;
  @Input() checklistTag: string = '';
  @Input() paginator: boolean = true;
  @Input() exportable: boolean = true;
  @Input() quickSearchCode: string = '';

  @Output() onSubmitResponse = new EventEmitter<CheckBoxResponseEvent[]>();
}
