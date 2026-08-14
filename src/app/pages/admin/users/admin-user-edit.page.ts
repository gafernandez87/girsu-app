import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AdminService } from '../../../core/admin.service';
import { UserRole } from '../../../core/app.models';

@Component({
  selector: 'app-admin-user-edit-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './admin-user-edit.page.html',
  styleUrl: '../admin-entity.page.scss',
})
export class AdminUserEditPage {
  private readonly admin = inject(AdminService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly userId = this.route.snapshot.paramMap.get('id') ?? '';

  readonly deleting = signal(false);
  readonly error = signal<string | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly showPassword = signal(false);
  readonly success = signal<string | null>(null);

  course = '';
  email = '';
  isActive = true;
  name = '';
  password = '';
  role: UserRole = 'player';
  school = '';
  private originalEmail = '';

  togglePasswordVisibility(): void {
    this.showPassword.update((value) => !value);
  }

  constructor() {
    void this.loadUser();
  }

  async loadUser(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const user = await this.admin.getUser(this.userId);
      this.course = user.course;
      this.email = user.email;
      this.originalEmail = user.email;
      this.isActive = user.isActive;
      this.name = user.name;
      this.role = user.role;
      this.school = user.school;
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No pudimos cargar el usuario.');
    } finally {
      this.loading.set(false);
    }
  }

  async submit(): Promise<void> {
    if (this.saving()) {
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    this.success.set(null);

    try {
      const normalizedEmail = this.email.trim().toLowerCase();
      const user =
        normalizedEmail === this.originalEmail && !this.password.trim()
          ? await this.admin.updateUser(this.userId, {
              course: this.course,
              isActive: this.isActive,
              name: this.name,
              role: this.role,
              school: this.school,
            })
          : await this.admin.updateUserFull(this.userId, {
              course: this.course,
              email: this.email,
              isActive: this.isActive,
              name: this.name,
              password: this.password,
              role: this.role,
              school: this.school,
            });
      this.course = user.course;
      this.email = user.email;
      this.originalEmail = user.email;
      this.isActive = user.isActive;
      this.name = user.name;
      this.password = '';
      this.role = user.role;
      this.school = user.school;
      this.success.set('Usuario actualizado.');
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No pudimos guardar el usuario.');
    } finally {
      this.saving.set(false);
    }
  }

  async deleteUser(): Promise<void> {
    if (this.deleting() || !confirm('Seguro que queres eliminar este usuario?')) {
      return;
    }

    this.deleting.set(true);
    this.error.set(null);

    try {
      await this.admin.deleteUser(this.userId);
      await this.router.navigate(['/admin/users']);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No pudimos eliminar el usuario.');
    } finally {
      this.deleting.set(false);
    }
  }
}
