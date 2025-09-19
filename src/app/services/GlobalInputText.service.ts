import { Injectable, signal, Signal } from "@angular/core";

@Injectable(
    { providedIn: 'root' }
)
export class GlobalFilterInputText {
    private text = signal<string | undefined>(undefined);

    getTextSignal(){
        return this.text;
    }

    setText(text: string) {
        console.log('new filter applied', text)
        this.text.set(text);
    }

    resetText() {
        this.text.set(undefined);
    }
}