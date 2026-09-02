import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AdminService } from '../../../core/admin.service';

@Component({
  selector: 'app-admin-school-create-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './admin-school-create.page.html',
  styleUrl: '../admin-entity.page.scss',
})
export class AdminSchoolCreatePage {
  private readonly admin = inject(AdminService);
  private readonly router = inject(Router);

  readonly error = signal<string | null>(null);
  readonly saving = signal(false);

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

  async submit(): Promise<void> {
    if (this.saving()) {
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    try {
      const school = await this.admin.createSchool({
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
      await this.router.navigate(['/admin/escuelas', school.id, 'edit']);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No pudimos crear la escuela.');
    } finally {
      this.saving.set(false);
    }
  }
}
