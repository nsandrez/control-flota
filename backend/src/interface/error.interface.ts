export class ErrorHttp extends Error {
  constructor(
    public readonly codigoEstado: number,
    mensaje: string,
  ) {
    super(mensaje);
    this.name = "ErrorHttp";
  }
}
