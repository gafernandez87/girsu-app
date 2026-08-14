import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AdminService } from '../../../core/admin.service';
import { UserRole } from '../../../core/app.models';

@Component({
  selector: 'app-admin-user-create-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './admin-user-create.page.html',
  styleUrl: '../admin-entity.page.scss',
})
export class AdminUserCreatePage {
  private readonly admin = inject(AdminService);
  private readonly router = inject(Router);

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly showPassword = signal(false);

  course = '';
  email = '';
  isActive = true;
  name = '';
  password = '';
  role: UserRole = 'player';
  school = '';

  togglePasswordVisibility(): void {
    this.showPassword.update((value) => !value);
  }

  async submit(): Promise<void> {
    if (this.saving()) {
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    try {
      const user = await this.admin.createUser({
        course: this.course,
        email: this.email,
        isActive: this.isActive,
        name: this.name,
        password: this.password,
        role: this.role,
        school: this.school,
      });
      await this.router.navigate(['/admin/users', user.id, 'edit']);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No pudimos crear el usuario.');
    } finally {
      this.saving.set(false);
    }
  }
}
