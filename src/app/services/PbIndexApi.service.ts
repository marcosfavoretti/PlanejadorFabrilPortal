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
            pbindexControllerGetDatasets()
                .then(response => response)
        );
    }
    listUsers(): Observable<string[]> {
        return from(
            pbindexControllerGetOnlineUsers()
                .then(response => response)
        );
    }
}