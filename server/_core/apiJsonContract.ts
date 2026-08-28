export type ApiErrorPayload = {
  error: {
    message: string;
    code: "NOT_FOUND";
    path: string;
  };
};

export function buildApiNotFoundPayload(path: string): ApiErrorPayload {
  return {
    error: {
      message: "Procédure API introuvable",
      code: "NOT_FOUND",
      path,
    },
  };
}
