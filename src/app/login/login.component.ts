import { Component, inject, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AuthService } from "../services/auth.service";
import { Router } from "@angular/router";

@Component({
  selector: "app-login",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen flex items-center justify-center">
      <div class="bg-white/90 backdrop-blur-sm p-8 rounded-xl shadow-xl text-center max-w-md w-full">
        <h1 class="text-4xl font-bold text-gray-800 mb-2">👶 Gender Reveal</h1>
        <p class="text-gray-600 mb-8">Sign in to cast your vote!</p>

        <div *ngIf="errorMessage" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6 text-sm text-left">
          <strong class="font-bold">Error: </strong>
          <span class="block sm:inline">{{ errorMessage }}</span>
        </div>

        <button
          (click)="login()"
          [disabled]="isLoading"
          [class.opacity-50]="isLoading"
          class="w-full bg-gray-800 hover:bg-gray-900 text-white font-bold py-3 px-4 rounded-lg transition duration-300 flex items-center justify-center gap-2"
        >
          <span *ngIf="isLoading">Signing in...</span>
          <span *ngIf="!isLoading">Sign in with Google</span>
        </button>

        <div class="mt-8 flex justify-center gap-4 text-4xl">
          <span>💙</span>
          <span>or</span>
          <span>💗</span>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);

  errorMessage: string | null = null;
  isLoading = false;

  ngOnInit() {
    this.auth.user$.subscribe((user) => {
      if (user) {
        this.router.navigate(["/participant"]);
      }
    });
  }

  login() {
    this.errorMessage = null;
    this.isLoading = true;
    this.auth.login().subscribe({
      next: (user) => {
        this.isLoading = false;
        // Navigation logic will be handled by the guard or app component usually,
        // but for now let's just redirect to participant view.
        // Ideally we check if admin here too.
        this.router.navigate(["/participant"]);
      },
      error: (err) => {
        this.isLoading = false;
        console.error("Login error:", err);
        const message = err.message || JSON.stringify(err);
        if (message.includes("CONFIGURATION_NOT_FOUND") || err.code === "auth/configuration-not-found") {
          this.errorMessage = "Google Sign-In is not enabled in the Firebase Console. Please enable it in Authentication > Sign-in method.";
        } else if (err.code === "auth/popup-closed-by-user") {
          this.errorMessage = "Sign-in popup was closed before completion.";
        } else if (err.code === "auth/unauthorized-domain") {
          this.errorMessage = "This domain (likely localhost) is not authorized. Go to Firebase Console > Authentication > Settings > Authorized Domains and add 'localhost'.";
        } else {
          this.errorMessage = `An error occurred: ${message}`;
        }
      },
    });
  }
}
