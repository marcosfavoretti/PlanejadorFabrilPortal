import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { estruturaApiEndpoints } from "@/app/features/estrutura/config/estrutura-api-endpoints";

@Injectable({
    providedIn: 'root'
})
export class PartcodeImageService {

    private normalizePartcode(value: string): string {
        return value
            .trim()
            .replace(/\s+/g, '')
            .toUpperCase();
    }

    constructor(
        private httpClient: HttpClient
    ) { }


    pictureRenderLink(props: {
        partcode: string
    }): string {
        const partcode = this.normalizePartcode(props.partcode);
        const baseUrl = estruturaApiEndpoints.image();
        const separator = baseUrl.includes('?') ? '&' : '?';
        return `${baseUrl}${separator}partcode=${encodeURIComponent(partcode)}`;
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
