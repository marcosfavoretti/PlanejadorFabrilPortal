import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { axiosInstance } from '@/client';
import { CategoriaHoraExtraAPIService, mapCategoriaHoraExtraError } from './CategoriaHoraExtraAPI.service';

describe('CategoriaHoraExtraAPIService', () => {
  let service: CategoriaHoraExtraAPIService;
  let request: jasmine.Spy;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CategoriaHoraExtraAPIService);
    request = spyOn(axiosInstance, 'request').and.callFake((async (config: { method?: string }) => ({
      data: config.method === 'GET' ? [{ id: '1', codigo: 'A', nome: 'A', ativo: true }] : { id: '1' },
    })) as never);
  });

  const gets = () => request.calls.allArgs().filter(([config]) => config.method === 'GET').length;

  it('cacheia getTodas e getAtivas ate o catalogo mudar', async () => {
    await firstValueFrom(service.getTodas());
    await firstValueFrom(service.getTodas());
    await firstValueFrom(service.getAtivas());
    await firstValueFrom(service.getAtivas());
    expect(gets()).toBe(2);

    await firstValueFrom(service.atualizar('1', { nome: 'B' }));
    await firstValueFrom(service.getTodas());
    await firstValueFrom(service.getAtivas());
    expect(gets()).toBe(4);
  });

  it('criar invalida o cache e emite catalogoAlterado$', async () => {
    const emissoes: number[] = [];
    service.catalogoAlterado$.subscribe(() => emissoes.push(1));
    await firstValueFrom(service.getTodas());

    await firstValueFrom(service.criar({ codigo: 'NOVA', nome: 'Nova', ordem: 1 } as never));
    expect(emissoes.length).toBe(1);
    await firstValueFrom(service.getTodas());
    expect(gets()).toBe(2);
  });

  it('atualizar emite catalogoAlterado$ e forceReload ignora o cache', async () => {
    let emitiu = false;
    service.catalogoAlterado$.subscribe(() => emitiu = true);
    await firstValueFrom(service.atualizar('1', { ativo: false }));
    expect(emitiu).toBeTrue();

    await firstValueFrom(service.getTodas());
    await firstValueFrom(service.getTodas(true));
    expect(gets()).toBe(2);
  });
});

describe('mapCategoriaHoraExtraError', () => {
  it('traduz 403 sempre para a mensagem de permissao', () => {
    expect(mapCategoriaHoraExtraError({ response: { status: 403, data: { message: 'Forbidden' } } }))
      .toBe('Voce nao tem permissao para gerenciar categorias de hora extra.');
  });

  it('usa a mensagem do backend em 404 e 409, com fallback', () => {
    expect(mapCategoriaHoraExtraError({ response: { status: 404, data: { message: 'Sumiu' } } })).toBe('Sumiu');
    expect(mapCategoriaHoraExtraError({ response: { status: 404 } })).toBe('Categoria de hora extra nao encontrada.');
    expect(mapCategoriaHoraExtraError({ status: 409 })).toBe('Ja existe uma categoria de hora extra com este codigo.');
    expect(mapCategoriaHoraExtraError({ response: { status: 409, data: { message: 'Duplicada' } } })).toBe('Duplicada');
  });

  it('usa mensagem generica no fallback e junta string[]', () => {
    expect(mapCategoriaHoraExtraError({})).toBe('Nao foi possivel concluir a operacao.');
    expect(mapCategoriaHoraExtraError({ response: { status: 400, data: { message: ['a', 'b'] } } })).toBe('a, b');
  });
});
