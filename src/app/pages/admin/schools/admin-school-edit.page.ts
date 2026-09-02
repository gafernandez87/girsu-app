import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AdminService } from '../../../core/admin.service';

@Component({
  selector: 'app-admin-school-edit-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './admin-school-edit.page.html',
  styleUrl: '../admin-entity.page.scss',
})
export class AdminSchoolEditPage {
  private readonly admin = inject(AdminService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly schoolId = this.route.snapshot.paramMap.get('id') ?? '';

  readonly deleting = signal(false);
  readonly error = signal<string | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly success = signal<string | null>(null);

  category = '';
  department = '';
  email = '';
  isActive = true;
  locality = '';
  name = '';
  neighborhood = '';
  operatingPeriod = '';
  permanence = '';
  phone = '';
  region = '';
  scope = '';
  sector = '';
  sourceCode = '';
  street = '';
  streetNumber = '';

  constructor() {
    void this.loadSchool();
  }

  async loadSchool(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const school = await this.admin.getSchool(this.schoolId);
      this.category = school.category;
      this.department = school.department;
      this.email = school.email;
      this.isActive = school.isActive;
      this.locality = school.locality;
      this.name = school.name;
      this.neighborhood = school.neighborhood;
      this.operatingPeriod = school.operatingPeriod;
      this.permanence = school.permanence;
      this.phone = school.phone;
      this.region = school.region;
      this.scope = school.scope;
      this.sector = school.sector;
      this.sourceCode = school.sourceCode;
      this.street = school.street;
      this.streetNumber = school.streetNumber;
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No pudimos cargar la escuela.');
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
      const school = await this.admin.updateSchool(this.schoolId, {
        category: this.category,
        department: this.department,
        email: this.email,
        isActive: this.isActive,
        locality: this.locality,
        name: this.name,
        neighborhood: this.neighborhood,
        operatingPeriod: this.operatingPeriod,
        permanence: this.permanence,
        phone: this.phone,
        region: this.region,
        scope: this.scope,
        sector: this.sector,
        sourceCode: this.sourceCode,
        street: this.street,
        streetNumber: this.streetNumber,
      });
      this.category = school.category;
      this.department = school.department;
      this.email = school.email;
      this.isActive = school.isActive;
      this.locality = school.locality;
      this.name = school.name;
      this.neighborhood = school.neighborhood;
      this.operatingPeriod = school.operatingPeriod;
      this.permanence = school.permanence;
      this.phone = school.phone;
      this.region = school.region;
      this.scope = school.scope;
      this.sector = school.sector;
      this.sourceCode = school.sourceCode;
      this.street = school.street;
      this.streetNumber = school.streetNumber;
      this.success.set('Escuela actualizada.');
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No pudimos guardar la escuela.');
    } finally {
      this.saving.set(false);
    }
  }

  async deleteSchool(): Promise<void> {
    if (this.deleting() || !confirm('Seguro que queres eliminar esta escuela?')) {
      return;
    }

    this.deleting.set(true);
    this.error.set(null);

    try {
      await this.admin.deleteSchool(this.schoolId);
      await this.router.navigate(['/admin/escuelas']);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No pudimos eliminar la escuela.');
    } finally {
      this.deleting.set(false);
    }
  }
}
