export type Role = "traveller" | "arranger" | "administrator";

export type Member = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
};
