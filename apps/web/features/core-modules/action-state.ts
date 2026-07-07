export type CoreFormActionState = {
  message: string;
  status: "idle" | "success" | "error";
};

export const initialCoreFormActionState: CoreFormActionState = {
  message: "",
  status: "idle",
};
