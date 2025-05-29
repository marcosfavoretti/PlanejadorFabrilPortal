export type GetTabelaProducaoDiarioDTO = {
  /**
   * @type number
   */
  id: number
  /**
   * @type string
   */
  codigo_pedido: string
  /**
   * @type string, date-time
   */
  dia: string
  /**
   * @type string
   */
  item: string
  /**
   * @type string
   */
  operation: string
  /**
   * @type number
   */
  planejado: number
  /**
   * @type number
   */
  produzido: number
}