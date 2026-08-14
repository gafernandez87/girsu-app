import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './login.page.html',
  styleUrl: './auth.page.scss',
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly showPassword = signal(false);

  email = '';
  password = '';

  togglePasswordVisibility(): void {
    this.showPassword.update((value) => !value);
  }

  async submit(): Promise<void> {
    if (this.loading()) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    try {
      await this.auth.signIn({
        email: this.email,
        password: this.password,
      });
      await this.router.navigate(['/']);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No pudimos iniciar sesion.');
    } finally {
      this.loading.set(false);
    }
  }
}
