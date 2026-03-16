import { Injectable } from "@angular/core";
import axios from "axios";
import { from, Observable, of } from "rxjs";
import { PowerbiDataset } from "../widgets/powerbi-chart/@core/models/PowerbiDataset";
import { pbindexControllerGetDatasets, pbindexControllerGetOnlineUsers } from "@/api/pbindex";

@Injectable({
    providedIn: 'root'
})
export class PbIndexApiService {
    listDataset(user?: string): Observable<PowerbiDataset[]> {
        return from(
            // axios.get<PowerbiDataset[]>(`http://192.168.99.129:3000/api/pbindex/powerbi/datasets`)
            //     .then(response => response.data)
            pbindexControllerGetDatasets()
                .then(response => response)
        );
    }
    listUsers(): Observable<string[]> {
        return from(
            // axios.get<string[]>(`http://192.168.99.129:3000/api/pbindex/powerbi/online-users`)
            //     .then(response => response.data)
            pbindexControllerGetOnlineUsers()
                .then(response => response)
        );
    }
}