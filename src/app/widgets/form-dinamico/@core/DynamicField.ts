import { NgForm } from "@angular/forms";

export type DynamicField = {
  name: string;
  label: string;
  defaultValue?: any,
  type: 'text' | 'number' | 'date' | 'select';
  data?: {k: string, v: string}[];
  required?: boolean;
  disable: boolean;
  simpleValidation?: ((formSnapshot: NgForm) => boolean)[]
};