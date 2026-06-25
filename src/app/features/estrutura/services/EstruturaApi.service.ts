import { Injectable } from "@angular/core";
import { from, Observable, forkJoin, of } from "rxjs";
import { switchMap, map, catchError } from 'rxjs/operators';
import { client } from '@/client';
import { readDevAuthToken } from '@/app/core/auth/utils/auth-token';
import { estruturaApiEndpoints } from '../config/estrutura-api-endpoints';
import {
    chatbotEstruturaControllerForkSharedConversation,
    checkListControllerGetChecklist,
    checkListControllerGetChecklistAvaiable,
    checkListControllerDeleteItemInCheckList,
    checkListControllerInsertItemCheckList,
    checkListControllerSubmitChecklist,
    chatbotEstruturaControllerGetHistory,
    chatbotEstruturaControllerListConversations,
    chatbotEstruturaControllerCreateConversation,
    chatbotEstruturaControllerDeleteConversation,
    chatbotEstruturaControllerSendMessage,
    chatbotEstruturaControllerShareConversation,
    chatbotEstruturaControllerUpdateConversation,
    estruturaControllerAnaliseEstruturaMethod,
    estruturaControllerGetEstruturasDedendentesMethod,
    estruturaControllerEstrturaAsListMethod,
    estruturaControllerEstrturaAsTreeMethod,
    estruturaExportControllerExportToNeo4J,
    checkListControllerGetChecklistTags,
} from "@/api/estrutura";
import type { ChatbotEstruturaControllerListConversationsQueryParams } from "@/api/estrutura";
import type {
    ChatConversationForkDto,
    ChatConversationShareDto,
    CheckListControllerDeleteItemInCheckListMutationRequest,
    CheckListControllerInsertItemCheckListMutationRequest,
    GetAnaliseResDTO,
    ResEstruturaDependentesDTO,
    ResEstruturaItemTreeDTO,
} from "@/api/estrutura";
import type { SubmitChecklistDTO } from "@/api/estrutura";

interface AssignItemPayload {
    itens: Array<{ partcode: string; pa: string }>;
}

interface UnAssignItemPayload {
    partcodes: string[];
}

interface ChatbotSendMessageProps {
    sessionId: string;
    message: string;
    contextType?: string;
    title?: string;
    stream?: boolean;
}

interface ChatbotCancelMessageProps {
    sessionId: string;
}


@Injectable({
    providedIn: 'root'
})
export class EstruturaApiService {
    private normalizePartcode(value?: string | null): string {
        return value?.trim().toUpperCase() || '';
    }

    private extractReadableText(value: unknown, fallback = ''): string {
        if (typeof value === 'string') {
            return value;
        }

        if (typeof value === 'number') {
            return String(value);
        }

        if (!value || typeof value !== 'object') {
            return fallback;
        }

        const record = value as Record<string, unknown>;
        const candidateKeys = ['itemCliente', 'pa', 'descricao', 'description', 'nome', 'name', 'codigo', 'partcode'];

        for (const key of candidateKeys) {
            const candidate = record[key];
            if (typeof candidate === 'string' && candidate.trim()) {
                return candidate;
            }
            if (typeof candidate === 'number') {
                return String(candidate);
            }
        }

        return fallback;
    }

    private normalizeWhereUsedResponse(data: unknown, fallbackPartcode: string): ResEstruturaDependentesDTO {
        const emptyResponse: ResEstruturaDependentesDTO = {
            target: {
                partcode: fallbackPartcode,
                itemCliente: '',
                status: '',
                qtd: 0,
                ehControle: false,
            },
            depedencias: [],
        };

        if (!data || typeof data !== 'object') {
            return emptyResponse;
        }

        const response = data as Record<string, unknown>;
        const nestedResponse = Array.isArray(response['data'])
            ? response['data'][0]
            : response['data'];
        const candidate = (nestedResponse && typeof nestedResponse === 'object'
            ? nestedResponse
            : data) as Record<string, unknown>;

        const target = candidate['target'] as Record<string, unknown> | undefined;
        const dependencies = candidate['depedencias'] ?? candidate['dependencias'] ?? candidate['dependencies'];

        return {
            target: {
                partcode: String(target?.['partcode'] ?? fallbackPartcode),
                itemCliente: this.extractReadableText(target?.['itemCliente'] ?? target?.['pa'], ''),
                status: String(target?.['status'] ?? target?.['item_status'] ?? ''),
                qtd: Number(target?.['qtd'] ?? 0),
                ehControle: Boolean(target?.['ehControle'] ?? false),
            },
            depedencias: Array.isArray(dependencies)
                ? dependencies.map((item) => {
                    const dependency = item as Record<string, unknown>;
                    return {
                        partcode: String(dependency['partcode'] ?? ''),
                        itemCliente: this.extractReadableText(dependency['itemCliente'] ?? dependency['pa'], ''),
                        status: String(dependency['status'] ?? dependency['item_status'] ?? ''),
                        qtd: Number(dependency['qtd'] ?? 0),
                        ehControle: Boolean(dependency['ehControle'] ?? false),
                    };
                })
                : [],
        };
    }

    private normalizeTreeNode(data: ResEstruturaItemTreeDTO): ResEstruturaItemTreeDTO {
        const item = data as any;
        const children = Array.isArray(item.children)
            ? item.children.map((child: any) => this.normalizeTreeNode(child))
            : Array.isArray(item.filhos)
                ? item.filhos.map((child: any) => this.normalizeTreeNode(child))
                : [];

        return {
            ...item,
            pa: item.pa ?? item.itemCliente,
            item_status: item.item_status ?? item.status,
            filhos: children,
            children,
        } as any;
    }

    private normalizeAnalyticsResponse(data: unknown): GetAnaliseResDTO[] {
        if (Array.isArray(data)) {
            return data as GetAnaliseResDTO[];
        }

        if (!data || typeof data !== 'object') {
            return [];
        }

        const response = data as Record<string, unknown>;
        const arrayKeys = ['data', 'response', 'result', 'results', 'analises', 'analytics', 'items', 'analise'];

        for (const key of arrayKeys) {
            const value = response[key];
            if (Array.isArray(value)) {
                return value as GetAnaliseResDTO[];
            }
        }

        if (response['setor'] && response['analise']) {
            return [response as GetAnaliseResDTO];
        }

        return [];
    }

    getItemHierarchy(partcode: string, tag?: string): Observable<ResEstruturaItemTreeDTO> {
        const trimmedPartcode = partcode.trim().toUpperCase();
        const trimmedTag = tag ? tag.trim().toLowerCase() : '';
        return from(
            estruturaControllerEstrturaAsTreeMethod({
                partcode: trimmedPartcode
            })
        ).pipe(
            switchMap(data => {
                const response = Array.isArray(data) && (data[0] as any)?.estrutura ? data[0] : data;
                const estrutura = (response as any)?.estrutura || response;
                const normalizedTree = this.normalizeTreeNode(estrutura as ResEstruturaItemTreeDTO);

                if (!trimmedTag) {
                    return of(normalizedTree);
                }

                return from(checkListControllerGetChecklistAvaiable({ partcode: trimmedPartcode, tag: trimmedTag })).pipe(
                    map(checklist => {
                        const checklistMap = new Map<string, boolean>();
                        if (checklist && Array.isArray(checklist.itens)) {
                            checklist.itens.forEach((item: any) => {
                                const normalizedPartcode = this.normalizePartcode(item.partcode);
                                if (!normalizedPartcode) return;
                                checklistMap.set(normalizedPartcode, Boolean(item.avaiable));
                            });
                        }
                        return this.mergeChecklistStatus(normalizedTree, checklistMap);
                    }),
                    catchError(() => of(normalizedTree))
                );
            })
        )
    }

    getChecklistHierarchy(partcode: string, tag: string): Observable<ResEstruturaItemTreeDTO> {
        const trimmedPartcode = partcode.trim().toUpperCase();
        const trimmedTag = tag.trim().toLowerCase();

        return from(
            checkListControllerGetChecklist({
                partcode: trimmedPartcode,
                tag: trimmedTag
            }).then(data => {
                const response = Array.isArray(data) ? data[0] : data;
                const items = Array.isArray((response as any)?.itens) ? (response as any).itens : [];
                const checklistItems = items.map((item: any) => this.normalizeChecklistItem(item));

                return {
                    partcode: (response as any)?.estrutura || trimmedPartcode,
                    pa: (response as any)?.estrutura || trimmedPartcode,
                    itemCliente: (response as any)?.estrutura || trimmedPartcode,
                    item_status: '',
                    qtd: 1,
                    filhos: checklistItems,
                    children: checklistItems,
                } as any;
            })
        );
    }

    private normalizeChecklistItem(item: any): ResEstruturaItemTreeDTO {
        const partcode = this.normalizePartcode(item?.partcode);

        return {
            ...item,
            partcode,
            pa: item?.pa ?? item?.itemCliente,
            itemCliente: item?.itemCliente ?? item?.pa,
            item_status: item?.item_status ?? item?.tipo,
            status: item?.status ?? item?.tipo,
            qtd: item?.qtd ?? item?.quantidade ?? 0,
            filhos: [],
            children: [],
            checkListAvaiable: true,
            collected: false,
        } as any;
    }

    private mergeChecklistStatus(node: any, checklistMap: Map<string, boolean>): any {
        const pc = this.normalizePartcode(node.partcode);
        if (pc) {
            node.checkListAvaiable = checklistMap.get(pc) ?? false;
        }

        const children = node.children || node.filhos;
        if (children && Array.isArray(children)) {
            children.forEach((child: any) => this.mergeChecklistStatus(child, checklistMap));
        }

        return node;
    }

    getItemList(partcode: string): Observable<any[]> {
        const trimmedPartcode = partcode.trim().toUpperCase();
        return from(
            estruturaControllerEstrturaAsListMethod({
                partcode: trimmedPartcode
            }).then(data => {
                const response = Array.isArray(data) && (data[0] as any)?.estrutura ? data[0] : data;

                if (Array.isArray((response as any)?.estrutura)) {
                    return (response as any).estrutura.map((item: ResEstruturaItemTreeDTO) => this.normalizeTreeNode(item));
                }

                if (Array.isArray(response)) {
                    return response.map(item => this.normalizeTreeNode(item as ResEstruturaItemTreeDTO));
                }

                return [];
            })
        )
    }

    getItemAnalytics(partcode: string): Observable<GetAnaliseResDTO[]> {
        const trimmedPartcode = partcode.trim().toUpperCase();
        return from(
            estruturaControllerAnaliseEstruturaMethod({
                partcode: trimmedPartcode
            }).then(data => this.normalizeAnalyticsResponse(data))
        )
    }

    getWhereItemIsUsed(partcode: string): Observable<ResEstruturaDependentesDTO> {
        const trimmedPartcode = partcode.trim().toUpperCase();
        return from(
            estruturaControllerGetEstruturasDedendentesMethod({
                partcode: trimmedPartcode
            }).then(data => this.normalizeWhereUsedResponse(data, trimmedPartcode))
        )
    }

    removeCheckList(partcode: string, tag: string, payload: Omit<CheckListControllerDeleteItemInCheckListMutationRequest, 'partcodePai' | 'tag'>) {
        const trimmedPartcode = partcode.trim();
        const trimmedTag = tag.trim().toLowerCase();
        const data: CheckListControllerDeleteItemInCheckListMutationRequest = {
            ...payload,
            partcodePai: trimmedPartcode,
            tag: trimmedTag,
            partcodes: payload.partcodes.map(p => p.trim())
        };
        return from(
            checkListControllerDeleteItemInCheckList(data)
        )
    }

    createCheckList(partcode: string, tag: string, payload: Omit<CheckListControllerInsertItemCheckListMutationRequest, 'partcodePai' | 'tag'>) {
        const trimmedPartcode = partcode.trim();
        const trimmedTag = tag.trim().toLowerCase();
        const data: CheckListControllerInsertItemCheckListMutationRequest = {
            ...payload,
            partcodePai: trimmedPartcode,
            tag: trimmedTag,
            partcodes: payload.partcodes.map(p => p.trim())
        };
        return from(
            checkListControllerInsertItemCheckList(data)
        )
    }

    assignItem(param: string, payload: AssignItemPayload) {
        const trimmedParam = param.trim();
        const trimmedPayload = {
            ...payload,
            itens: payload.itens.map(item => ({
                partcode: item.partcode.trim(),
                pa: item.pa.trim()
            }))
        };
        return from(
            client({
                method: 'POST',
                url: `pa/${trimmedParam}`,
                data: trimmedPayload,
            }).then(response => response.data)
        )
    }

    unAssignItem(param: string, payload: UnAssignItemPayload) {
        const trimmedParam = param.trim();
        const trimmedPayload = {
            ...payload,
            partcodes: payload.partcodes.map(p => p.trim())
        };
        return from(
            client({
                method: 'DELETE',
                url: `pa/${trimmedParam}`,
                data: trimmedPayload,
            }).then(response => response.data)
        )
    }

    newChecklistLog(payload: SubmitChecklistDTO) {
        return from(
            checkListControllerSubmitChecklist(payload)
        );
    }

    getChecklistTags(partcode: string): Observable<any> {
        const trimmedPartcode = partcode.trim().toUpperCase();
        return from(
            checkListControllerGetChecklistTags({ partcode: trimmedPartcode })
        );
    }

    exportItem(partcode: string) {
        const trimmedPartcode = partcode.trim().toUpperCase();
        return from(
            estruturaExportControllerExportToNeo4J({
                partcode: trimmedPartcode
            })
        )
    }

    getHistory(sessionId: string): Observable<any[]> {
        return from(
            chatbotEstruturaControllerGetHistory(sessionId.trim())
                .then((data: any) => Array.isArray(data) ? data : data?.data ?? [])
        );
    }

    listConversations(params?: ChatbotEstruturaControllerListConversationsQueryParams): Observable<any> {
        return from(
            chatbotEstruturaControllerListConversations(params)
        );
    }

    deleteConversation(conversationId: string): Observable<any> {
        return from(
            chatbotEstruturaControllerDeleteConversation(conversationId.trim())
        );
    }

    createConversation(contextType: string, title?: string): Observable<{ sessionId: string; conversationId: string;[key: string]: any }> {
        return from(
            chatbotEstruturaControllerCreateConversation({
                contextType,
                ...(title ? { title } : {}),
            }).then((data: any) => data as { sessionId: string; conversationId: string })
        );
    }

    updateConversation(conversationId: string, title: string): Observable<any> {
        return from(
            chatbotEstruturaControllerUpdateConversation(conversationId.trim(), {
                title: title.trim(),
            })
        );
    }

    shareConversation(conversationId: string): Observable<ChatConversationShareDto> {
        return from(
            chatbotEstruturaControllerShareConversation(conversationId.trim())
        );
    }

    forkSharedConversation(shareId: string): Observable<ChatConversationForkDto> {
        return from(
            chatbotEstruturaControllerForkSharedConversation(shareId.trim())
        );
    }


    sendMessage(props: ChatbotSendMessageProps) {
        const { sessionId, message, contextType, title, stream } = props;
        const trimmedSessionId = sessionId.trim();
        const trimmedMessage = message.trim();
        return from(
            chatbotEstruturaControllerSendMessage({
                stream: Boolean(stream),
                sessionId: trimmedSessionId,
                message: trimmedMessage,
                contextType: contextType ?? 'default',
                ...(title ? { title } : {}),
            })
        );
    }

    cancelMessage(props: ChatbotCancelMessageProps) {
        const token = readDevAuthToken();
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        return from(
            fetch(estruturaApiEndpoints.chatbotCancel(), {
                method: 'POST',
                headers,
                credentials: 'include',
                body: JSON.stringify({
                    sessionId: props.sessionId.trim(),
                }),
            }).then(async (response) => {
                if (!response.ok) {
                    throw new Error('Falha ao cancelar mensagem (' + response.status + ')');
                }

                return response.json();
            })
        );
    }

    sendMessageStream(props: ChatbotSendMessageProps): Observable<{ content: string; type: 'chunk' | 'reset' | 'done'; attachments?: any[] }> {
        return new Observable<{ content: string; type: 'chunk' | 'reset' | 'done'; attachments?: any[] }>((subscriber) => {
            const controller = new AbortController();
            const { sessionId, message, contextType, title } = props;
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                Accept: 'text/event-stream, application/json',
            };

            const token = readDevAuthToken();
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            fetch(estruturaApiEndpoints.chatbotMessage(), {
                method: 'POST',
                headers,
                credentials: 'include',
                body: JSON.stringify({
                    sessionId: sessionId.trim(),
                    message: message.trim(),
                    contextType: contextType ?? 'default',
                    ...(title ? { title } : {}),
                    stream: true,
                }),
                signal: controller.signal,
            })
                .then(async (response) => {
                    if (!response.ok) {
                        throw new Error(`Falha ao enviar mensagem (${response.status})`);
                    }

                    const contentType = response.headers.get('content-type') ?? '';
                    if (contentType.includes('application/json')) {
                        const json = await response.json();
                        subscriber.next({
                            content: this.extractChatResponseText(json),
                            type: 'done',
                            attachments: json.completion?.message?.attachments || json.message?.attachments
                        });
                        subscriber.complete();
                        return;
                    }

                    if (!response.body) {
                        subscriber.complete();
                        return;
                    }

                    const reader = response.body.getReader();
                    const decoder = new TextDecoder();
                    let buffer = '';
                    let pendingEventName: string | undefined;

                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        buffer += decoder.decode(value, { stream: true });
                        const lines = buffer.split('\n');
                        buffer = lines.pop() ?? '';

                        for (const line of lines) {
                            const trimmedLine = line.trim();

                            if (!trimmedLine) {
                                pendingEventName = undefined;
                                continue;
                            }

                            if (trimmedLine.startsWith('event:')) {
                                pendingEventName = trimmedLine.slice(6).trim().toLowerCase();
                                continue;
                            }

                            if (!trimmedLine.startsWith('data:')) continue;

                            const data = trimmedLine.slice(5).trim();
                            if (data === '[DONE]') {
                                subscriber.next({ content: '', type: 'done' });
                                subscriber.complete();
                                controller.abort();
                                return;
                            }

                            try {
                                const parsed = JSON.parse(data);
                                const eventType = this.mapStreamEventType(parsed, pendingEventName);

                                // Extrai o conteúdo baseado no tipo de evento
                                // Se for 'done', tentamos pegar o conteúdo consolidado (completion.message.content)
                                // Se for 'chunk', pegamos o delta/fragmento
                                const content = this.extractStreamContent(parsed);

                                if (eventType === 'done') {
                                    const attachments = parsed.completion?.message?.attachments || parsed.message?.attachments;
                                    subscriber.next({ content, type: 'done', attachments });
                                    subscriber.complete();
                                    controller.abort();
                                    return;
                                }

                                if (content || eventType === 'reset') {
                                    subscriber.next({ content, type: eventType });
                                }
                            } catch {
                                // Se falhar o parse, envia como chunk bruto se não for apenas o prefixo data:
                                if (data) {
                                    const eventType = this.mapStreamEventType(undefined, pendingEventName);
                                    subscriber.next({ content: data, type: eventType === 'reset' ? 'reset' : 'chunk' });
                                }
                            } finally {
                                pendingEventName = undefined;
                            }
                        }
                    }

                    subscriber.complete();
                })
                .catch((error) => {
                    if (!controller.signal.aborted) {
                        subscriber.error(error);
                    }
                });

            return () => controller.abort();
        });
    }

    private mapStreamEventType(
        parsed: any,
        fallbackEventName?: string,
    ): 'chunk' | 'reset' | 'done' {
        const type = String(parsed?.type || parsed?.event || fallbackEventName || '').toLowerCase();
        if (['done', 'complete', 'completed', 'finished'].includes(type)) return 'done';
        if (['reset', 'clear'].includes(type)) return 'reset';

        if (parsed?.done === true || parsed?.finished === true) return 'done';

        return 'chunk';
    }

    private extractStreamContent(payload: unknown): string {
        if (typeof payload === 'string') return payload;
        if (typeof payload === 'number') return String(payload);
        if (!payload || typeof payload !== 'object') return '';

        const record = payload as Record<string, any>;

        // Prioridade para o formato data.completion.message.content
        if (record['completion']?.['message']?.['content']) {
            return String(record['completion']['message']['content']);
        }

        const directKeys = ['delta', 'content', 'text', 'token', 'response', 'message'];
        for (const key of directKeys) {
            const value = record[key];
            if (value === undefined || value === null) continue;

            if (typeof value === 'string') return value;
            if (typeof value === 'number') return String(value);
            if (typeof value === 'object') {
                const nested = this.extractStreamContent(value);
                if (nested) return nested;
            }
        }

        return '';
    }

    private extractChatResponseText(payload: unknown): string {
        if (typeof payload === 'string') {
            return payload;
        }

        const content = (payload as Record<string, unknown> | undefined)?.['message'];
        if (content && typeof content === 'object') {
            const nestedContent = (content as Record<string, unknown>)['content'];
            if (typeof nestedContent === 'string') {
                return nestedContent;
            }
        }

        return JSON.stringify(payload);
    }
}
