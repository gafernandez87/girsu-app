import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { LocalityComboboxComponent } from '../../../components/locality-combobox/locality-combobox.component';
import { SchoolComboboxComponent } from '../../../components/school-combobox/school-combobox.component';
import { AdminService } from '../../../core/admin.service';
import { JujuyLocality, School, UserProfile, UserRole } from '../../../core/app.models';
import { LocalityService } from '../../../core/locality.service';

@Component({
  selector: 'app-admin-user-edit-page',
  imports: [FormsModule, RouterLink, LocalityComboboxComponent, SchoolComboboxComponent],
  templateUrl: './admin-user-edit.page.html',
  styleUrl: '../admin-entity.page.scss',
})
export class AdminUserEditPage {
  private readonly admin = inject(AdminService);
  private readonly localityService = inject(LocalityService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly userId = this.route.snapshot.paramMap.get('id') ?? '';

  readonly deleting = signal(false);
  readonly error = signal<string | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly localities = signal<readonly JujuyLocality[]>([]);
  readonly schools = signal<readonly School[]>([]);
  readonly showPassword = signal(false);
  readonly success = signal<string | null>(null);
  readonly maxBirthDate = this.getTodayAsInputDate();
  readonly formLoading = computed(() => this.loading() || this.saving());

  birthDate = '';
  composting: string[] = [];
  course = '';
  email = '';
  isActive = true;
  localityId = '';
  manualLocality = '';
  name = '';
  password = '';
  province: 'Jujuy' | 'Otra' = 'Jujuy';
  role: UserRole = 'player';
  schoolId = '';
  schoolMembership: 'jujuy_school' | 'no_jujuy_school' = 'jujuy_school';
  schoolRole = '';
  wasteSeparation: string[] = [];

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
      const [user, localities, schools] = await Promise.all([
        this.admin.getUser(this.userId),
        this.localityService.listJujuyLocalities(),
        this.admin.listSchools(),
      ]);
      this.localities.set(localities);
      this.schools.set(schools);
      this.applyUser(user);
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
      if (!this.canSubmit()) {
        this.error.set('Completa los datos obligatorios antes de guardar los cambios.');
        return;
      }

      const user = await this.admin.updateUser(this.userId, {
        birthDate: this.birthDate,
        composting: this.composting,
        course: this.course,
        email: this.email,
        isActive: this.isActive,
        locality: this.province === 'Otra' ? this.manualLocality : '',
        localityId: this.province === 'Jujuy' ? this.localityId : undefined,
        localitySource: this.province === 'Jujuy' ? 'jujuy_catalog' : 'manual',
        name: this.name,
        password: this.password,
        province: this.province,
        role: this.role,
        schoolId: this.schoolMembership === 'jujuy_school' ? this.schoolId : undefined,
        schoolMembership: this.schoolMembership,
        schoolRole: this.schoolRole,
        wasteSeparation: this.wasteSeparation,
      });
      this.applyUser(user);
      this.password = '';
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

  onProvinceChange(value: string): void {
    this.province = value === 'Otra' ? 'Otra' : 'Jujuy';

    if (this.province === 'Jujuy') {
      this.manualLocality = '';
      return;
    }

    this.localityId = '';
  }

  onSchoolMembershipChange(value: string): void {
    this.schoolMembership = value === 'no_jujuy_school' ? 'no_jujuy_school' : 'jujuy_school';

    if (this.schoolMembership === 'no_jujuy_school') {
      this.schoolId = '';
    }
  }

  onSchoolSelected(school: School): void {
    if (this.province !== 'Jujuy' || !school.locality) {
      return;
    }

    const locality = this.localities().find(
      (candidate) => candidate.name.trim().toUpperCase() === school.locality.trim().toUpperCase(),
    );
    this.localityId = locality?.id ?? '';
  }

  toggleComposting(value: string): void {
    this.composting = this.toggleHabitSelection(this.composting, value);
  }

  toggleWasteSeparation(value: string): void {
    this.wasteSeparation = this.toggleHabitSelection(this.wasteSeparation, value);
  }

  canSubmit(): boolean {
    const hasLocality =
      this.province === 'Jujuy'
        ? this.localities().some((locality) => locality.id === this.localityId)
        : Boolean(this.manualLocality.trim());
    const hasSchool = this.schoolMembership !== 'jujuy_school' || Boolean(this.schoolId);

    return (
      Boolean(this.name.trim()) &&
      Boolean(this.birthDate) &&
      Boolean(this.email.trim()) &&
      hasLocality &&
      hasSchool &&
      Boolean(this.schoolRole) &&
      this.wasteSeparation.length > 0 &&
      this.composting.length > 0
    );
  }

  private applyUser(user: UserProfile): void {
    this.birthDate = user.birthDate ?? '';
    this.composting = [...(user.composting ?? [])];
    this.course = user.course;
    this.email = user.email;
    this.isActive = user.isActive;
    this.name = user.name;
    this.province = user.province === 'Otra' ? 'Otra' : 'Jujuy';
    this.role = user.role;
    this.schoolId = user.schoolId ?? '';
    this.schoolMembership =
      user.schoolMembership === 'no_jujuy_school' ? 'no_jujuy_school' : 'jujuy_school';
    this.schoolRole = user.schoolRole ?? '';
    this.wasteSeparation = [...(user.wasteSeparation ?? [])];

    if (this.province === 'Otra') {
      this.localityId = '';
      this.manualLocality = user.locality ?? '';
      return;
    }

    const matchingLocality = this.localities().find(
      (locality) => locality.name.trim().toUpperCase() === (user.locality ?? '').trim().toUpperCase(),
    );
    this.localityId = user.localityId ?? matchingLocality?.id ?? '';
    this.manualLocality = '';
  }

  private toggleHabitSelection(values: readonly string[], value: string): string[] {
    if (value === 'none') {
      return values.includes(value) ? [] : [value];
    }

    const positiveValues = values.filter((currentValue) => currentValue !== 'none');

    if (positiveValues.includes(value)) {
      return positiveValues.filter((currentValue) => currentValue !== value);
    }

    return values.includes(value)
      ? positiveValues
      : [...positiveValues, value];
  }

  private getTodayAsInputDate(): string {
    const now = new Date();
    const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);

    return localDate.toISOString().slice(0, 10);
  }
}
