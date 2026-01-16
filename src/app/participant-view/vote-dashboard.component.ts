import { Component, Input, OnInit, OnChanges, SimpleChanges } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Participant, Settings } from "../models/user.model";
import { VoteStats } from "../services/firestore.service";
import confetti from "canvas-confetti";

@Component({
  selector: "app-vote-dashboard",
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- UI State 2: Revealed -->
    <div *ngIf="settings?.isRevealed" class="text-center">
      <!-- Reveal Animation -->
      <div
        class="p-8 bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl max-w-2xl mx-auto border-4"
        [class.border-blue-500]="settings?.winningGender === 'BOY'"
        [class.border-pink-500]="settings?.winningGender === 'GIRL'"
      >
        <div class="py-8">
          <h2 class="text-2xl text-gray-600 mb-4">The moment you've been waiting for...</h2>
          <div class="reveal-text animate-bounce">
            <h1 class="text-6xl md:text-8xl font-black mb-4" [class.text-blue-500]="settings?.winningGender === 'BOY'" [class.text-pink-500]="settings?.winningGender === 'GIRL'">
              IT'S A {{ settings?.winningGender === "BOY" ? "BOY" : "GIRL" }}!
            </h1>
            <div class="text-6xl">
              {{ settings?.winningGender === "BOY" ? "👶💙" : "👶💗" }}
            </div>
          </div>
        </div>
      </div>

      <!-- UI State 3: Scoreboard -->
      <div class="mt-8 grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <!-- Winners -->
        <div class="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-6">
          <h3 class="text-2xl font-bold text-green-600 mb-4">🏆 The Winners</h3>
          <p class="text-gray-500 text-sm mb-4">They guessed correctly!</p>
          <ul class="space-y-2">
            <li *ngFor="let winner of winners" class="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <img [src]="getAvatarUrl(winner.displayName)" class="w-10 h-10 rounded-full" alt="Avatar" />
              <span class="font-medium text-green-800">{{ winner.displayName }}</span>
              <span class="ml-auto text-2xl">🎉</span>
            </li>
            <li *ngIf="winners.length === 0" class="text-gray-400 italic p-3">No one guessed correctly!</li>
          </ul>
        </div>

        <!-- The Others -->
        <div class="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-6">
          <h3 class="text-2xl font-bold text-gray-600 mb-4">😅 The Others</h3>
          <p class="text-gray-500 text-sm mb-4">Better luck next time!</p>
          <ul class="space-y-2">
            <li *ngFor="let other of others" class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <img [src]="getAvatarUrl(other.displayName)" class="w-10 h-10 rounded-full" alt="Avatar" />
              <span class="font-medium text-gray-600">{{ other.displayName }}</span>
              <span class="ml-auto text-2xl">🤷</span>
            </li>
            <li *ngIf="others.length === 0" class="text-gray-400 italic p-3">Everyone guessed correctly!</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- UI State 1: Not Revealed - Voting -->
    <div *ngIf="!settings?.isRevealed" class="text-center">
      <div class="p-8 bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl max-w-2xl mx-auto">
        <h2 class="text-3xl font-bold text-gray-800 mb-2">Cast Your Vote!</h2>
        <p class="text-gray-600 mb-8">What do you think it will be?</p>

        <!-- Voting Buttons -->
        <div class="flex flex-col sm:flex-row gap-6 justify-center mb-8">
          <button
            (click)="onVote('BOY')"
            [disabled]="currentParticipant?.vote !== null && currentParticipant?.vote !== undefined"
            class="group relative px-12 py-8 rounded-2xl text-white font-bold text-2xl transition-all duration-300 transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed shadow-xl"
            [class.bg-blue-500]="true"
            [class.hover:bg-blue-600]="!currentParticipant?.vote"
            [class.ring-4]="currentParticipant?.vote === 'BOY'"
            [class.ring-blue-300]="currentParticipant?.vote === 'BOY'"
            [class.scale-105]="currentParticipant?.vote === 'BOY'"
          >
            <div class="flex flex-col items-center gap-2">
              <span class="text-5xl">👶💙</span>
              <span>TEAM BOY</span>
            </div>
            <div *ngIf="currentParticipant?.vote === 'BOY'" class="absolute -top-3 -right-3 bg-white rounded-full p-2 shadow-lg">
              <span class="text-2xl">✓</span>
            </div>
          </button>

          <button
            (click)="onVote('GIRL')"
            [disabled]="currentParticipant?.vote !== null && currentParticipant?.vote !== undefined"
            class="group relative px-12 py-8 rounded-2xl text-white font-bold text-2xl transition-all duration-300 transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed shadow-xl"
            [class.bg-pink-500]="true"
            [class.hover:bg-pink-600]="!currentParticipant?.vote"
            [class.ring-4]="currentParticipant?.vote === 'GIRL'"
            [class.ring-pink-300]="currentParticipant?.vote === 'GIRL'"
            [class.scale-105]="currentParticipant?.vote === 'GIRL'"
          >
            <div class="flex flex-col items-center gap-2">
              <span class="text-5xl">👶💗</span>
              <span>TEAM GIRL</span>
            </div>
            <div *ngIf="currentParticipant?.vote === 'GIRL'" class="absolute -top-3 -right-3 bg-white rounded-full p-2 shadow-lg">
              <span class="text-2xl">✓</span>
            </div>
          </button>
        </div>

        <!-- Vote Status Message -->
        <div *ngIf="currentParticipant?.vote" class="mb-6 p-4 rounded-lg" [class.bg-blue-50]="currentParticipant?.vote === 'BOY'" [class.bg-pink-50]="currentParticipant?.vote === 'GIRL'">
          <p class="font-medium" [class.text-blue-700]="currentParticipant?.vote === 'BOY'" [class.text-pink-700]="currentParticipant?.vote === 'GIRL'">
            You voted for {{ currentParticipant?.vote === "BOY" ? "Team Boy 💙" : "Team Girl 💗" }}
          </p>
        </div>

        <!-- Progress Bar -->
        <div *ngIf="stats && stats.totalVotes > 0" class="mt-6">
          <h3 class="text-lg font-semibold text-gray-700 mb-3">Family Votes</h3>
          <div class="relative h-8 rounded-full overflow-hidden bg-gray-200">
            <div class="absolute left-0 top-0 h-full bg-blue-500 transition-all duration-500 flex items-center justify-start pl-2" [style.width.%]="stats.boyPercentage">
              <span *ngIf="stats.boyPercentage >= 15" class="text-white text-sm font-bold"> {{ stats.boyPercentage }}% Boy </span>
            </div>
            <div class="absolute right-0 top-0 h-full bg-pink-500 transition-all duration-500 flex items-center justify-end pr-2" [style.width.%]="stats.girlPercentage">
              <span *ngIf="stats.girlPercentage >= 15" class="text-white text-sm font-bold"> {{ stats.girlPercentage }}% Girl </span>
            </div>
          </div>
          <p class="text-gray-500 text-sm mt-2">{{ stats.totalVotes }} vote(s) cast</p>
        </div>

        <!-- Countdown Timer -->
        <div *ngIf="timeRemaining" class="mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <h4 class="text-lg font-semibold text-yellow-800 mb-2">⏰ Reveal Countdown</h4>
          <div class="text-3xl font-bold text-yellow-700">
            {{ timeRemaining.hours.toString().padStart(2, "0") }}:{{ timeRemaining.minutes.toString().padStart(2, "0") }}:{{ timeRemaining.seconds.toString().padStart(2, "0") }}
          </div>
          <p class="text-yellow-600 text-sm mt-1">Until the big reveal!</p>
        </div>
      </div>
    </div>
  `,
})
export class VoteDashboardComponent implements OnInit, OnChanges {
  @Input() settings: Settings | null = null;
  @Input() currentParticipant: Participant | null = null;
  @Input() participants: Participant[] = [];
  @Input() stats: VoteStats | null = null;
  @Input() onCastVote!: (vote: "BOY" | "GIRL") => void;

  timeRemaining: { hours: number; minutes: number; seconds: number } | null = null;
  private countdownInterval: any;

  winners: Participant[] = [];
  others: Participant[] = [];

  ngOnInit() {
    this.startCountdown();
    this.calculateScoreboard();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes["settings"] || changes["participants"]) {
      this.calculateScoreboard();
      if (changes["settings"]?.currentValue?.isRevealed && !changes["settings"]?.previousValue?.isRevealed) {
        this.fireConfetti();
      }
    }
  }

  calculateScoreboard() {
    if (!this.settings?.isRevealed || !this.settings?.winningGender) {
      this.winners = [];
      this.others = [];
      return;
    }

    const winningGender = this.settings.winningGender;
    this.winners = this.participants.filter((p) => p.vote === winningGender);
    this.others = this.participants.filter((p) => p.vote && p.vote !== winningGender);
  }

  startCountdown() {
    const updateCountdown = () => {
      const now = new Date();
      const target = new Date();
      target.setHours(20, 30, 0, 0); // 20:30 today

      // If it's already past 20:30, target tomorrow
      if (now > target) {
        target.setDate(target.getDate() + 1);
      }

      const diff = target.getTime() - now.getTime();

      if (diff <= 0) {
        this.timeRemaining = null;
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      this.timeRemaining = { hours, minutes, seconds };
    };

    updateCountdown();
    this.countdownInterval = setInterval(updateCountdown, 1000);
  }

  onVote(vote: "BOY" | "GIRL") {
    if (this.onCastVote) {
      this.onCastVote(vote);
    }
  }

  getAvatarUrl(name: string | null | undefined): string {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "User")}&background=random`;
  }

  fireConfetti() {
    const duration = 5000;
    const end = Date.now() + duration;

    const colors = this.settings?.winningGender === "BOY" ? ["#3b82f6", "#60a5fa", "#93c5fd", "#ffffff"] : ["#ec4899", "#f472b6", "#f9a8d4", "#ffffff"];

    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }

  ngOnDestroy() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }
}
