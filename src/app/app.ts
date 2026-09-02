import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from './core/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  readonly auth = inject(AuthService);
  readonly mobileMenuOpen = signal(false);
  readonly router = inject(Router);

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((isOpen) => !isOpen);
  }

  async signOut(): Promise<void> {
    this.closeMobileMenu();
    await this.auth.signOut();
    await this.router.navigate(['/login']);
  }
}
