import { extractErrorMessage, extractErrorStatus } from './error-message';

describe('extractErrorMessage', () => {
  it('junta mensagens em array do payload do backend', () => {
    const erro = { response: { data: { message: ['nome must be a string', 'ordem must not be less than 0'] } } };
    expect(extractErrorMessage(erro)).toBe('nome must be a string, ordem must not be less than 0');
  });

  it('prioriza o payload sobre a mensagem generica do Axios', () => {
    const erro = { message: 'Request failed with status code 409', response: { data: { message: 'Codigo duplicado' } } };
    expect(extractErrorMessage(erro)).toBe('Codigo duplicado');
  });

  it('cai no campo error e na mensagem do cliente', () => {
    expect(extractErrorMessage({ response: { data: { error: 'Conflict' } } })).toBe('Conflict');
    expect(extractErrorMessage({ message: 'Network Error' })).toBe('Network Error');
    expect(extractErrorMessage(null)).toBe('');
  });
});

describe('extractErrorStatus', () => {
  it('le response.status ou status', () => {
    expect(extractErrorStatus({ response: { status: 403 } })).toBe(403);
    expect(extractErrorStatus({ status: 404 })).toBe(404);
    expect(extractErrorStatus('x')).toBeUndefined();
  });
});
