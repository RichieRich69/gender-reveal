import { Injectable, inject } from "@angular/core";
import { Firestore, collection, collectionData, doc, setDoc, deleteDoc, Timestamp, docSnapshots, getDocs, writeBatch } from "@angular/fire/firestore";
import { Observable, map } from "rxjs";
import { Participant, Settings } from "../models/user.model";

export interface VoteStats {
  boyVotes: number;
  girlVotes: number;
  totalVotes: number;
  boyPercentage: number;
  girlPercentage: number;
}

@Injectable({
  providedIn: "root",
})
export class FirestoreService {
  private firestore = inject(Firestore);

  getParticipants(): Observable<Participant[]> {
    const participantsRef = collection(this.firestore, "participants");
    return collectionData(participantsRef, { idField: "uid" }) as Observable<Participant[]>;
  }

  async addParticipant(email: string, displayName: string) {
    const docRef = doc(this.firestore, "participants", email);
    const participant: Participant = {
      email,
      displayName,
      createdAt: Timestamp.now(),
      isActive: true,
      vote: null,
    };
    return setDoc(docRef, participant);
  }

  async removeParticipant(email: string) {
    return deleteDoc(doc(this.firestore, "participants", email));
  }

  async updateParticipant(email: string, data: Partial<Participant>) {
    return setDoc(doc(this.firestore, "participants", email), data, { merge: true });
  }

  getSettings(): Observable<Settings | null> {
    const ref = doc(this.firestore, "settings/global");
    return docSnapshots(ref).pipe(map((s) => (s.exists() ? (s.data() as Settings) : null)));
  }

  async updateSettings(settings: Partial<Settings>) {
    const ref = doc(this.firestore, "settings/global");
    return setDoc(ref, settings, { merge: true });
  }

  // Cast a vote for a user
  async castVote(userId: string, vote: "BOY" | "GIRL"): Promise<void> {
    const ref = doc(this.firestore, "participants", userId);
    return setDoc(ref, { vote }, { merge: true });
  }

  // Admin triggers the reveal
  async triggerReveal(gender: "BOY" | "GIRL"): Promise<void> {
    const ref = doc(this.firestore, "settings/global");
    return setDoc(ref, { isRevealed: true, winningGender: gender }, { merge: true });
  }

  // Reset the reveal (admin only)
  async resetReveal(): Promise<void> {
    const ref = doc(this.firestore, "settings/global");
    return setDoc(ref, { isRevealed: false, winningGender: null }, { merge: true });
  }

  // Reset all votes (admin only)
  async resetAllVotes(): Promise<void> {
    const batch = writeBatch(this.firestore);
    const participantsRef = collection(this.firestore, "participants");
    const snapshot = await getDocs(participantsRef);

    snapshot.docs.forEach((docSnap) => {
      batch.update(docSnap.ref, { vote: null });
    });

    return batch.commit();
  }

  // Get vote statistics as an observable
  getStats(): Observable<VoteStats> {
    return this.getParticipants().pipe(
      map((participants) => {
        const boyVotes = participants.filter((p) => p.vote === "BOY").length;
        const girlVotes = participants.filter((p) => p.vote === "GIRL").length;
        const totalVotes = boyVotes + girlVotes;

        return {
          boyVotes,
          girlVotes,
          totalVotes,
          boyPercentage: totalVotes > 0 ? Math.round((boyVotes / totalVotes) * 100) : 0,
          girlPercentage: totalVotes > 0 ? Math.round((girlVotes / totalVotes) * 100) : 0,
        };
      })
    );
  }
}
