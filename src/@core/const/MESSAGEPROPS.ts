export const MESSAGEPROPS = {
    ERROR: (message: string) => ({
        severity: 'danger',
        summary: 'ERRO',
        detail: message,
        life: 3000
    }),
    SUCCESS: (message: string) => ({
        severity: 'success',
        summary: 'Success',
        detail: message,
        life: 3000
    })
}