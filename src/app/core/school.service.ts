import { inject, Injectable } from '@angular/core';

import { School } from './app.models';
import { SupabaseService } from './supabase.service';
import { SchoolRow } from './supabase.types';

@Injectable({
  providedIn: 'root',
})
export class SchoolService {
  private readonly pageSize = 1000;
  private readonly supabase = inject(SupabaseService).client;
  private readonly schoolSelect =
    'id, source_code, name, street, street_number, neighborhood, locality, department, phone, region, sector, scope, category, permanence, operating_period, email, is_active, created_at, updated_at';

  async listActiveSchools(): Promise<readonly School[]> {
    const schools: School[] = [];
    let total = Number.POSITIVE_INFINITY;

    while (schools.length < total) {
      const from = schools.length;
      const to = from + this.pageSize - 1;
      const { count, data, error } = await this.supabase
        .from('schools')
        .select(this.schoolSelect, { count: 'exact' })
        .eq('is_active', true)
        .order('name', { ascending: true })
        .range(from, to);

      if (error) {
        throw error;
      }

      const page = (data ?? []).map((row) => this.mapSchool(row));
      schools.push(...page);
      total = count ?? schools.length;

      if (page.length === 0) {
        break;
      }
    }

    return schools;
  }

  async countActiveSchools(): Promise<number> {
    const { count, error } = await this.supabase
      .from('schools')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true);

    if (error) {
      throw error;
    }

    return count ?? 0;
  }

  private mapSchool(row: SchoolRow): School {
    return {
      id: row.id,
      sourceCode: row.source_code,
      name: row.name,
      street: row.street,
      streetNumber: row.street_number,
      neighborhood: row.neighborhood,
      locality: row.locality,
      department: row.department,
      phone: row.phone,
      region: row.region,
      sector: row.sector,
      scope: row.scope,
      category: row.category,
      permanence: row.permanence,
      operatingPeriod: row.operating_period,
      email: row.email,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
