import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { FirestoreService, VoteStats } from "../services/firestore.service";
import { Participant } from "../models/user.model";
import { Observable, combineLatest, map } from "rxjs";

@Component({
  selector: "app-admin-dashboard",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen p-4 md:p-8" *ngIf="vm$ | async as vm">
      <div class="max-w-4xl mx-auto">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">
          <h1 class="bg-white/80 hover:bg-white/90 text-2xl md:text-3xl font-bold text-gray-800 drop-shadow-md rounded backdrop-blur-sm transition-colors px-4 py-2">👶 Admin Dashboard</h1>
          <button (click)="goBack()" class="bg-white/80 hover:bg-white/90 text-gray-700 px-4 py-2 rounded backdrop-blur-sm transition-colors text-sm font-medium">← Back to Participant View</button>
        </div>

        <!-- Reveal Controls -->
        <div class="bg-white/95 backdrop-blur-sm p-6 md:p-8 rounded-xl shadow-lg mb-8">
          <h2 class="text-2xl font-bold text-gray-800 mb-6 text-center">🎉 Gender Reveal Controls</h2>

          <div *ngIf="!vm.settings?.isRevealed" class="space-y-6">
            <p class="text-gray-600 text-center">Click a button below to reveal the gender to all participants!</p>

            <div class="flex flex-col sm:flex-row gap-6 justify-center">
              <button
                (click)="revealGender('BOY')"
                class="px-12 py-8 rounded-2xl text-white font-bold text-2xl bg-blue-500 hover:bg-blue-600 transition-all duration-300 transform hover:scale-105 shadow-xl"
              >
                <div class="flex flex-col items-center gap-2">
                  <span class="text-5xl">👶💙</span>
                  <span>REVEAL BOY</span>
                </div>
              </button>

              <button
                (click)="revealGender('GIRL')"
                class="px-12 py-8 rounded-2xl text-white font-bold text-2xl bg-pink-500 hover:bg-pink-600 transition-all duration-300 transform hover:scale-105 shadow-xl"
              >
                <div class="flex flex-col items-center gap-2">
                  <span class="text-5xl">👶💗</span>
                  <span>REVEAL GIRL</span>
                </div>
              </button>
            </div>
          </div>

          <div *ngIf="vm.settings?.isRevealed" class="text-center space-y-6">
            <div class="p-6 rounded-xl" [class.bg-blue-50]="vm.settings?.winningGender === 'BOY'" [class.bg-pink-50]="vm.settings?.winningGender === 'GIRL'">
              <p class="text-xl font-bold" [class.text-blue-700]="vm.settings?.winningGender === 'BOY'" [class.text-pink-700]="vm.settings?.winningGender === 'GIRL'">
                🎉 Gender has been revealed: IT'S A {{ vm.settings?.winningGender }}!
                {{ vm.settings?.winningGender === "BOY" ? "💙" : "💗" }}
              </p>
            </div>
            <button (click)="resetReveal()" class="px-6 py-3 rounded-lg text-white font-medium bg-gray-600 hover:bg-gray-700 transition-colors">Reset Reveal 🔄</button>
          </div>

          <!-- Reset Votes - Always visible -->
          <div class="mt-6 pt-6 border-t border-gray-200 text-center">
            <button (click)="resetAllVotes()" class="px-6 py-3 rounded-lg text-white font-medium bg-orange-600 hover:bg-orange-700 transition-colors">Reset All Votes 🗳️</button>
          </div>
        </div>

        <!-- Vote Statistics -->
        <div class="bg-white/95 backdrop-blur-sm p-6 rounded-xl shadow-lg mb-8">
          <h2 class="text-xl font-semibold mb-4">📊 Vote Statistics</h2>
          <div class="grid grid-cols-3 gap-4 text-center mb-4">
            <div class="p-4 bg-blue-50 rounded-lg">
              <div class="text-3xl font-bold text-blue-600">{{ vm.stats.boyVotes || 0 }}</div>
              <div class="text-sm text-blue-700">Team Boy 💙</div>
            </div>
            <div class="p-4 bg-gray-50 rounded-lg">
              <div class="text-3xl font-bold text-gray-600">{{ vm.stats.totalVotes || 0 }}</div>
              <div class="text-sm text-gray-700">Total Votes</div>
            </div>
            <div class="p-4 bg-pink-50 rounded-lg">
              <div class="text-3xl font-bold text-pink-600">{{ vm.stats.girlVotes || 0 }}</div>
              <div class="text-sm text-pink-700">Team Girl 💗</div>
            </div>
          </div>

          <!-- Progress Bar -->
          <div *ngIf="vm.stats && vm.stats.totalVotes > 0" class="relative h-8 rounded-full overflow-hidden bg-gray-200">
            <div class="absolute left-0 top-0 h-full bg-blue-500 transition-all duration-500 flex items-center justify-center" [style.width.%]="vm.stats.boyPercentage">
              <span *ngIf="vm.stats.boyPercentage >= 20" class="text-white text-sm font-bold">{{ vm.stats.boyPercentage }}%</span>
            </div>
            <div class="absolute right-0 top-0 h-full bg-pink-500 transition-all duration-500 flex items-center justify-center" [style.width.%]="vm.stats.girlPercentage">
              <span *ngIf="vm.stats.girlPercentage >= 20" class="text-white text-sm font-bold">{{ vm.stats.girlPercentage }}%</span>
            </div>
          </div>
        </div>

        <!-- Add Participant -->
        <div class="bg-white/95 backdrop-blur-sm p-4 md:p-6 rounded-lg shadow mb-6 md:mb-8">
          <h2 class="text-xl font-semibold mb-4">Add Participant</h2>
          <div class="flex flex-col md:flex-row gap-4">
            <input [(ngModel)]="newEmail" placeholder="Gmail Address" class="flex-1 border p-2 rounded w-full" />
            <input [(ngModel)]="newName" placeholder="Display Name" class="flex-1 border p-2 rounded w-full" />
            <button (click)="add()" class="bg-gray-700 text-white px-6 py-2 rounded hover:bg-gray-800 w-full md:w-auto">Add</button>
          </div>
        </div>

        <!-- Participants List -->
        <div class="bg-white rounded-lg shadow overflow-hidden">
          <h2 class="text-xl font-semibold p-6 border-b">Participants & Votes</h2>

          <!-- Desktop Table -->
          <table class="w-full hidden md:table">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vote</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr *ngFor="let p of vm.participants">
                <td class="px-6 py-4 whitespace-nowrap">{{ p.displayName }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-gray-500">{{ p.email }}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span *ngIf="p.vote === 'BOY'" class="px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">Boy 💙</span>
                  <span *ngIf="p.vote === 'GIRL'" class="px-3 py-1 rounded-full bg-pink-100 text-pink-700 font-medium">Girl 💗</span>
                  <span *ngIf="!p.vote" class="text-gray-400 italic">Not voted</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right">
                  <button (click)="remove(p.email)" class="text-red-600 hover:text-red-900">Remove</button>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Mobile Cards -->
          <div class="md:hidden divide-y divide-gray-200">
            <div *ngFor="let p of vm.participants" class="p-4 space-y-2">
              <div class="flex justify-between items-start">
                <div>
                  <div class="font-medium text-gray-900">{{ p.displayName }}</div>
                  <div class="text-sm text-gray-500">{{ p.email }}</div>
                </div>
                <button (click)="remove(p.email)" class="text-red-600 p-1" aria-label="Remove">
                  <span class="text-xl">🗑️</span>
                </button>
              </div>
              <div class="text-sm">
                <span class="text-gray-500">Vote: </span>
                <span *ngIf="p.vote === 'BOY'" class="px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-medium text-xs">Boy 💙</span>
                <span *ngIf="p.vote === 'GIRL'" class="px-2 py-1 rounded-full bg-pink-100 text-pink-700 font-medium text-xs">Girl 💗</span>
                <span *ngIf="!p.vote" class="text-gray-400 italic">Not voted</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AdminDashboardComponent {
  private firestore = inject(FirestoreService);
  private router = inject(Router);

  participants$: Observable<Participant[]> = this.firestore.getParticipants();
  stats$: Observable<VoteStats> = this.firestore.getStats();

  vm$ = combineLatest([this.participants$, this.stats$, this.firestore.getSettings()]).pipe(
    map(([participants, stats, settings]) => ({
      participants,
      stats,
      settings,
    }))
  );

  newEmail = "";
  newName = "";

  async add() {
    if (!this.newEmail || !this.newName) return;
    try {
      await this.firestore.addParticipant(this.newEmail, this.newName);
      this.newEmail = "";
      this.newName = "";
    } catch (error: any) {
      console.error("Error adding participant:", error);
      alert(`Failed to add participant: ${error.message}\n\nMake sure you are an admin (your email is in settings/global).`);
    }
  }

  async remove(email: string) {
    if (confirm("Are you sure you want to remove this participant?")) {
      try {
        await this.firestore.removeParticipant(email);
      } catch (error: any) {
        console.error("Error removing participant:", error);
        alert(`Failed to remove participant: ${error.message}`);
      }
    }
  }

  async revealGender(gender: "BOY" | "GIRL") {
    const genderText = gender === "BOY" ? "Boy 💙" : "Girl 💗";
    if (confirm(`Are you sure you want to reveal the gender as "${genderText}"? This will be visible to all participants!`)) {
      try {
        await this.firestore.triggerReveal(gender);
        alert(`🎉 The reveal has been triggered! It's a ${genderText}!`);
      } catch (error: any) {
        console.error("Error triggering reveal:", error);
        alert(`Failed to trigger reveal: ${error.message}`);
      }
    }
  }

  async resetReveal() {
    if (confirm("Are you sure you want to reset the reveal? The gender will be hidden again.")) {
      try {
        await this.firestore.resetReveal();
        alert("Reveal has been reset.");
      } catch (error: any) {
        console.error("Error resetting reveal:", error);
        alert(`Failed to reset reveal: ${error.message}`);
      }
    }
  }

  async resetAllVotes() {
    if (confirm("Are you sure you want to reset ALL votes? This cannot be undone!")) {
      try {
        await this.firestore.resetAllVotes();
        alert("All votes have been reset.");
      } catch (error: any) {
        console.error("Error resetting votes:", error);
        alert(`Failed to reset votes: ${error.message}`);
      }
    }
  }

  goBack() {
    this.router.navigate(["/participant"]);
  }
}
