import { io, Socket } from 'socket.io-client';
import { EventEmitter, Injectable } from '@angular/core';
import { WsEvent } from '../enum/WsEvent.enum';
import { UserstoreService } from '@/app/services/userstore.service';
import { getPBWsConfig } from './ws.config';

export type wsStatus = {
    describe: string;
    using: boolean;
    users?: string[];
    authorName?: string;
};

@Injectable({
    providedIn: 'root'
})
export class PbIndexClientWs {
    isConnect: boolean = false;
    stt?: wsStatus;
    onRefresh: EventEmitter<string> = new EventEmitter<string>();
    onStatus: EventEmitter<{ stt: wsStatus; connection: boolean }> = new EventEmitter<{
        stt: wsStatus;
        connection: boolean;
    }>();
    onOnlineUsers: EventEmitter<string[]> = new EventEmitter<string[]>();
    clientSocket?: Socket;

    constructor(private user: UserstoreService) {}

    connect(): void {
        if (this.clientSocket?.connected) return;

        const userName = this.user.item()?.name;
        if (!userName) {
            console.error('[PbIndexClientWs] Não foi possível conexão: usuário não identificado');
            return;
        }

        const wsConfig = getPBWsConfig();
        console.log('[PbIndexClientWs] Conectando a:', wsConfig.pbIndexUrl, 'como:', userName);

        const socket = io(wsConfig.pbIndexUrl, {
            query: {
                name: userName
            },
            // Removido path: '/ws/pbindex' para usar o default '/socket.io/'
            forceNew: true,
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000
        });

        this.setTriggers(socket);
        this.clientSocket = socket;
    }

    disconnect(): void {
        if (this.clientSocket) {
            console.log('[PbIndexClientWs] Desconectando...');
            this.clientSocket.disconnect();
            this.clientSocket = undefined;
            this.isConnect = false;
        }
    }

    private setTriggers(socket: Socket): void {
        socket.on('connect', () => {
            console.log('[PbIndexClientWs] Conectado com sucesso');
            this.isConnect = true;
            this.onStatus.emit({
                connection: true,
                stt: this.stt || { describe: 'CONNECTED', using: false }
            });
        });

        socket.on('connect_error', (err) => {
            console.error('[PbIndexClientWs] Erro de conexão:', err);
        });

        socket.on('disconnect', (reason) => {
            console.log('[PbIndexClientWs] Desconectado:', reason);
            this.isConnect = false;
            this.onStatus.emit({
                connection: this.isConnect,
                stt: {
                    describe: 'DISCONNECT',
                    using: false
                }
            });
        });

        socket.on(WsEvent.POWERBIREFRESHDONE, (data: wsStatus) => {
            this.onRefresh.emit(data.describe);
        });

        socket.on(WsEvent.POWERBIFEEDBACK, (data: wsStatus) => {
            this.onStatus.emit({
                connection: this.isConnect,
                stt: data
            });
        });
    }

    async requestPowerbiRefresh(payload: { datasetID: number; admin: boolean }): Promise<void> {
        this.clientSocket?.emit(WsEvent.POWERBIREFRESH, payload);
    }

    async getOnlineUsers(): Promise<string[]> {
        return new Promise((resolve) => {
            this.clientSocket?.emit(WsEvent.POWERBIONLINEUSER, (users: string[]) => {
                this.onOnlineUsers.emit(users);
                resolve(users);
            });
        });
    }
}
