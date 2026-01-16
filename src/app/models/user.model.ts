import { Timestamp } from "@angular/fire/firestore";

export interface Participant {
  uid?: string;
  email: string;
  displayName: string;
  createdAt: Timestamp;
  isActive: boolean;
  vote?: "BOY" | "GIRL" | null;
}

export interface Settings {
  adminEmails: string[];
  isRevealed: boolean;
  winningGender: "BOY" | "GIRL" | null;
}
