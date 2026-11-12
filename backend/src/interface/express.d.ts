import type { PayloadAuth } from "./auth.interface";

declare global {
  namespace Express {
    interface Request {
      usuarioAuth?: PayloadAuth;
    }
  }
}

export {};
