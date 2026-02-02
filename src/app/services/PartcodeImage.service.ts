import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";

@Injectable({
    providedIn: 'root'
})
export class PartcodeImageService {

    private readonly structureService = `http://192.168.99.102:4111/files/image`

    constructor(
        private httpClient: HttpClient
    ) { }


    pictureRenderLink(props: {
        partcode: string
    }): string {
        
        const url = new URL(this.structureService)
        url.searchParams.append('partcode', props.partcode);
        console.log(url.toString())
        return url.toString();
    }

    async searchPicture(props: {
        partcode: string
    }): Promise<string> {
        return new Promise((resolve, reject) => {
            this.httpClient.get(this.pictureRenderLink(props), { responseType: 'blob' })
                .subscribe({
                    next: (blob) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result as string);
                        reader.onerror = reject;
                        reader.readAsDataURL(blob);
                    },
                    error: (err) => reject(err)
                });
        });

    }
}