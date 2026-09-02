import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule, NgModel } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { SchoolComboboxComponent } from '../../components/school-combobox/school-combobox.component';
import { LocalityComboboxComponent } from '../../components/locality-combobox/locality-combobox.component';
import { JujuyLocality, School } from '../../core/app.models';
import { AuthService } from '../../core/auth.service';
import { LocalityService } from '../../core/locality.service';
import { SchoolService } from '../../core/school.service';

@Component({
  selector: 'app-register-page',
  imports: [FormsModule, RouterLink, LocalityComboboxComponent, SchoolComboboxComponent],
  templateUrl: './register.page.html',
  styleUrl: './auth.page.scss',
})
export class RegisterPage {
  private readonly auth = inject(AuthService);
  private readonly localityService = inject(LocalityService);
  private readonly router = inject(Router);
  private readonly schoolService = inject(SchoolService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);
  readonly localities = signal<readonly JujuyLocality[]>([]);
  readonly localitiesLoading = signal(true);
  readonly schools = signal<readonly School[]>([]);
  readonly schoolsLoading = signal(true);
  readonly showPassword = signal(false);
  readonly submitted = signal(false);
  readonly maxBirthDate = this.getTodayAsInputDate();
  readonly formLoading = computed(() =>
    this.loading() || this.schoolsLoading() || this.localitiesLoading(),
  );

  birthDate = '';
  composting: string[] = [];
  email = '';
  localityId = '';
  manualLocality = '';
  name = '';
  password = '';
  province = 'Jujuy';
  schoolMembership = 'jujuy_school';
  schoolId = '';
  schoolRole = '';
  wasteSeparation: string[] = [];

  constructor() {
    void this.loadRegistrationData();
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((value) => !value);
  }

  async loadRegistrationData(): Promise<void> {
    this.schoolsLoading.set(true);
    this.localitiesLoading.set(true);
    this.error.set(null);

    try {
      const [schools, localities] = await Promise.all([
        this.schoolService.listActiveSchools(),
        this.localityService.listJujuyLocalities(),
      ]);
      this.schools.set(schools);
      this.localities.set(localities);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No pudimos cargar los datos del formulario.');
    } finally {
      this.schoolsLoading.set(false);
      this.localitiesLoading.set(false);
    }
  }

  canSubmit(): boolean {
    return (
      Boolean(this.name.trim()) &&
      this.isBirthDateValid() &&
      this.isEmailValid() &&
      this.hasValidLocality() &&
      Boolean(this.schoolMembership) &&
      (this.schoolMembership !== 'jujuy_school' || Boolean(this.schoolId)) &&
      Boolean(this.schoolRole) &&
      this.password.length >= 6 &&
      this.wasteSeparation.length > 0 &&
      this.composting.length > 0
    );
  }

  isFieldInvalid(control: NgModel): boolean {
    return Boolean(control.invalid) && (control.touched || this.submitted());
  }

  hasRequiredTextError(control: NgModel, value: string): boolean {
    return (control.touched || this.submitted()) && !value.trim();
  }

  hasBirthDateError(control: NgModel): boolean {
    return (control.touched || this.submitted()) && !this.isBirthDateValid();
  }

  hasEmailError(control: NgModel): boolean {
    return (control.touched || this.submitted()) && !this.isEmailValid();
  }

  hasLocalityError(control: NgModel): boolean {
    return (control.touched || this.submitted()) && !this.hasValidLocality();
  }

  hasSchoolError(control: NgModel): boolean {
    return (control.touched || this.submitted()) && (!this.schoolId || Boolean(control.invalid));
  }

  hasChoiceError(values: readonly string[]): boolean {
    return this.submitted() && values.length === 0;
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
    this.schoolMembership = value;

    if (value !== 'jujuy_school') {
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

  async submit(): Promise<void> {
    this.submitted.set(true);

    if (this.formLoading()) {
      return;
    }

    if (!this.canSubmit()) {
      this.error.set('Revisa los campos marcados para continuar.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.notice.set(null);

    try {
      const result = await this.auth.signUp({
        birthDate: this.birthDate,
        composting: this.composting,
        email: this.email,
        locality: this.province === 'Otra' ? this.manualLocality : '',
        localityId: this.province === 'Jujuy' ? this.localityId : undefined,
        localitySource: this.province === 'Jujuy' ? 'jujuy_catalog' : 'manual',
        name: this.name,
        password: this.password,
        province: this.province,
        schoolId: this.schoolMembership === 'jujuy_school' ? this.schoolId : undefined,
        schoolMembership: this.schoolMembership,
        schoolRole: this.schoolRole,
        wasteSeparation: this.wasteSeparation,
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

  private hasValidLocality(): boolean {
    if (this.province === 'Otra') {
      return Boolean(this.manualLocality.trim());
    }

    return this.localities().some((locality) => locality.id === this.localityId);
  }

  private isBirthDateValid(): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(this.birthDate) && this.birthDate <= this.maxBirthDate;
  }

  private isEmailValid(): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email.trim());
  }

  private getTodayAsInputDate(): string {
    const now = new Date();
    const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);

    return localDate.toISOString().slice(0, 10);
  }
}
