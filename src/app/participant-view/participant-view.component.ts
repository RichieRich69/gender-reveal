import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AuthService } from "../services/auth.service";
import { FirestoreService } from "../services/firestore.service";
import { switchMap, map, tap, startWith } from "rxjs/operators";
import { combineLatest, of } from "rxjs";
import { User } from "@angular/fire/auth";
import { VoteDashboardComponent } from "./vote-dashboard.component";
import { RouterModule, Router } from "@angular/router";
import { Participant } from "../models/user.model";

@Component({
  selector: "app-participant-view",
  standalone: true,
  imports: [CommonModule, VoteDashboardComponent, RouterModule],
  template: `
    <div class="min-h-screen p-4">
      <div class="max-w-6xl mx-auto">
        <header class="flex justify-between items-center mb-8 bg-white/80 backdrop-blur-sm p-4 rounded-lg shadow-sm" *ngIf="user$ | async as user">
          <div class="flex items-center gap-4">
            <img [src]="user.photoURL || getAvatarUrl(user.displayName)" (error)="handleImageError($event, user.displayName)" class="w-10 h-10 rounded-full bg-gray-300" alt="User Avatar" />
            <span class="font-bold text-gray-700">{{ user.displayName }}</span>
          </div>
          <button (click)="logout()" class="text-sm text-gray-500 hover:text-red-600">Sign Out</button>
        </header>

        <div *ngIf="vm$ | async as vm">
          <!-- Admin Link -->
          <div *ngIf="vm.isAdmin" class="mb-6 text-right">
            <a routerLink="/admin" class="inline-block bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700 transition"> Go to Admin Dashboard 🛠️ </a>
          </div>

          <!-- Page Title -->
          <div class="text-center mb-8">
            <h1 class="text-4xl md:text-5xl font-black text-gray-800 bg-white/90 backdrop-blur-sm inline-block px-8 py-4 rounded-xl shadow-lg">👶 Gender Reveal 👶</h1>
            <p class="text-gray-600 mt-4 text-lg">The family has voted the Gender for Baby Diergaardt... what will it be?</p>
          </div>

          <!-- Vote Dashboard Component -->
          <app-vote-dashboard [settings]="vm.settings" [currentParticipant]="vm.currentParticipant" [participants]="vm.participants" [stats]="vm.stats" [onCastVote]="castVoteFn" [onReveal]="revealFn">
          </app-vote-dashboard>
        </div>
      </div>
    </div>
  `,
})
export class ParticipantViewComponent {
  private auth = inject(AuthService);
  private firestore = inject(FirestoreService);
  private router = inject(Router);

  user$ = this.auth.user$;

  // Bind the castVote function to be passed to child component
  castVoteFn = this.castVote.bind(this);
  revealFn = this.triggerReveal.bind(this);

  // View Model
  vm$ = this.user$.pipe(
    tap((user: User | null) => console.log("User:", user)),
    switchMap((user: User | null) => {
      if (!user?.email) return of({ user: null, settings: null, participants: [], stats: null, isAdmin: false });

      return combineLatest({
        user: of(user),
        settings: this.firestore.getSettings().pipe(
          tap((s: any) => console.log("Settings:", s)),
          startWith(null),
        ),
        participants: this.firestore.getParticipants().pipe(
          tap((p: any) => console.log("Participants:", p?.length)),
          startWith([]),
        ),
        stats: this.firestore.getStats().pipe(startWith(null)),
        isAdmin: this.auth.isAdmin(user.email).pipe(startWith(false)),
      }).pipe(
        map((data: any) => {
          const currentParticipant = data.participants?.find((p: Participant) => p.email === data.user.email);

          return {
            ...data,
            currentParticipant,
          };
        }),
        tap((vm: any) => console.log("VM:", vm)),
      );
    }),
  );

  getAvatarUrl(name: string | null | undefined): string {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "User")}&background=random`;
  }

  logout() {
    this.auth.logout().subscribe(() => {
      this.router.navigate(["/"]);
    });
  }

  handleImageError(event: any, name?: string | null) {
    event.target.src = this.getAvatarUrl(name);
  }

  async castVote(vote: "BOY" | "GIRL") {
    try {
      const user = await this.auth.getCurrentUser();
      if (!user?.email) {
        alert("You must be logged in to vote.");
        return;
      }
      await this.firestore.castVote(user.email, vote);
    } catch (error: any) {
      console.error("Error casting vote:", error);
      alert("Something went wrong: " + error.message);
    }
  }

  async triggerReveal() {
    try {
      await this.firestore.reveal();
    } catch (error: any) {
      console.error("Error triggering reveal:", error);
    }
  }
}
