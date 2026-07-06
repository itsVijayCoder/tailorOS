export type AuthActionState = {
  devResetLink?: string | null;
  fields?: Record<string, string[]>;
  message: string;
  status: "idle" | "success" | "error";
};

export const initialAuthActionState: AuthActionState = {
  message: "",
  status: "idle",
};
