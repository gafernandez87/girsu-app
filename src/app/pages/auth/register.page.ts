import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-register-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './register.page.html',
  styleUrl: './auth.page.scss',
})
export class RegisterPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);
  readonly showPassword = signal(false);

  course = '';
  email = '';
  name = '';
  password = '';
  school = '';

  togglePasswordVisibility(): void {
    this.showPassword.update((value) => !value);
  }

  async submit(): Promise<void> {
    if (this.loading()) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.notice.set(null);

    try {
      const result = await this.auth.signUp({
        course: this.course,
        email: this.email,
        name: this.name,
        password: this.password,
        school: this.school,
      });

      if (result.needsEmailConfirmation) {
        this.notice.set('Te enviamos un email para confirmar la cuenta.');
        return;
      }

      await this.router.navigate(['/']);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No pudimos crear la cuenta.');
    } finally {
      this.loading.set(false);
    }
  }
}
