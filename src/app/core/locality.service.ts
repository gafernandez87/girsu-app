import { inject, Injectable } from '@angular/core';

import { JujuyLocality } from './app.models';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root',
})
export class LocalityService {
  private readonly supabase = inject(SupabaseService).client;

  async listJujuyLocalities(): Promise<readonly JujuyLocality[]> {
    const { data, error } = await this.supabase
      .from('jujuy_localities')
      .select('id, name')
      .order('name', { ascending: true });

    if (error) {
      throw error;
    }

    return (data ?? []).map((locality) => ({
      id: locality.id,
      name: locality.name,
    }));
  }
}
