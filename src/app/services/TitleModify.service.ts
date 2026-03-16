import { Injectable } from "@angular/core";
import { Title } from "@angular/platform-browser";

@Injectable({
    providedIn: 'root'
})
export class TitleModifyService {
    constructor(private title: Title) { }

    setTitle(newname: string) {
        this.title.setTitle(newname)
    }
}