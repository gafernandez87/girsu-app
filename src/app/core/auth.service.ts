import { computed, inject, Injectable, signal } from '@angular/core';
import { type AuthError, type Session, type User } from '@supabase/supabase-js';

import { LocalitySource, UserProfile } from './app.models';
import { SupabaseService } from './supabase.service';
import { ProfileRow } from './supabase.types';

export interface SignUpInput {
  readonly birthDate: string;
  readonly composting: readonly string[];
  readonly email: string;
  readonly locality: string;
  readonly localityId?: string;
  readonly localitySource: Exclude<LocalitySource, 'legacy'>;
  readonly name: string;
  readonly password: string;
  readonly province: string;
  readonly schoolId?: string;
  readonly schoolMembership: string;
  readonly schoolRole: string;
  readonly wasteSeparation: readonly string[];
}

export interface SignInInput {
  readonly email: string;
  readonly password: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly supabase = inject(SupabaseService).client;
  private readonly sessionState = signal<Session | null>(null);
  private readonly profileState = signal<UserProfile | null>(null);
  private readonly loadingState = signal(true);
  private readonly initialized: Promise<void>;

  readonly session = this.sessionState.asReadonly();
  readonly profile = this.profileState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly isAuthenticated = computed(() => Boolean(this.sessionState()));
  readonly isAdmin = computed(() => this.profileState()?.role === 'admin');

  constructor() {
    this.initialized = this.initialize();

    this.supabase.auth.onAuthStateChange((_event, session) => {
      this.sessionState.set(session);
      void this.loadProfile(session?.user ?? null);
    });
  }

  ready(): Promise<void> {
    return this.initialized;
  }

  async signUp(input: SignUpInput): Promise<{ readonly needsEmailConfirmation: boolean }> {
    const email = this.normalizeEmail(input.email);

    const { data, error } = await this.supabase.auth.signUp({
      email,
      password: input.password,
      options: {
        data: {
          birth_date: input.birthDate,
          composting: input.composting,
          course: input.schoolRole.trim(),
          locality: input.locality.trim(),
          locality_id: input.localityId ?? '',
          locality_source: input.localitySource,
          name: input.name.trim(),
          province: input.province,
          registration_flow: 'self_signup',
          school_id: input.schoolId ?? '',
          school_membership: input.schoolMembership,
          school_role: input.schoolRole,
          waste_separation: input.wasteSeparation,
        },
      },
    });

    if (error) {
      throw this.toReadableAuthError(error);
    }

    this.sessionState.set(data.session);
    await this.loadProfile(data.user);

    return { needsEmailConfirmation: Boolean(data.user && !data.session) };
  }

  async signIn(input: SignInInput): Promise<void> {
    const email = this.normalizeEmail(input.email);

    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password: input.password,
    });

    if (error) {
      throw this.toReadableAuthError(error);
    }

    this.sessionState.set(data.session);
    await this.loadProfile(data.user);

    if (this.profileState() && !this.profileState()?.isActive) {
      await this.signOut();
      throw new Error('Este usuario esta desactivado.');
    }
  }

  async signOut(): Promise<void> {
    await this.supabase.auth.signOut();
    this.sessionState.set(null);
    this.profileState.set(null);
  }

  async refreshProfile(): Promise<void> {
    await this.loadProfile(this.sessionState()?.user ?? null);
  }

  private async initialize(): Promise<void> {
    const { data, error } = await this.supabase.auth.getSession();

    if (error) {
      console.error(error.message);
    }

    this.sessionState.set(data.session);
    await this.loadProfile(data.session?.user ?? null);

    if (this.profileState() && !this.profileState()?.isActive) {
      await this.signOut();
    }

    this.loadingState.set(false);
  }

  private async loadProfile(user: User | null): Promise<void> {
    if (!user) {
      this.profileState.set(null);
      return;
    }

    const { data, error } = await this.supabase
      .from('profiles')
      .select(
        'id, email, name, role, birth_date, province, locality, locality_id, locality_source, school_id, school_membership, school_role, school, course, waste_separation, composting, is_active, created_at, updated_at',
      )
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error(error.message);
      this.profileState.set(null);
      return;
    }

    this.profileState.set(data ? this.mapProfile(data) : null);
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private toReadableAuthError(error: AuthError): Error {
    return new Error(this.getReadableAuthErrorMessage(error));
  }

  private getReadableAuthErrorMessage(error: AuthError): string {
    switch (error.code) {
      case 'email_address_invalid':
        return 'Ese email fue rechazado por Supabase. Proba con una casilla personal real, evitando direcciones genericas como admin@, test@ o dominios de ejemplo.';
      case 'email_address_not_authorized':
        return 'Supabase no puede enviar emails a esa direccion con la configuracion actual. Para usarla hay que configurar SMTP propio en Auth.';
      case 'email_exists':
      case 'user_already_exists':
        return 'Ya existe una cuenta con ese email.';
      case 'email_not_confirmed':
        return 'Todavia falta confirmar el email antes de iniciar sesion.';
      case 'invalid_credentials':
        return 'El email o la contrasena no son correctos.';
      case 'over_email_send_rate_limit':
        return 'Supabase alcanzo el limite de emails para esa direccion. Espera unos minutos antes de volver a intentarlo.';
      case 'over_request_rate_limit':
        return 'Se hicieron demasiados intentos desde esta conexion. Espera unos minutos y volve a probar.';
      case 'weak_password':
        return 'La contrasena no cumple los requisitos minimos.';
      default:
        return error.message || 'No pudimos completar la operacion.';
    }
  }

  private mapProfile(row: ProfileRow): UserProfile {
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role,
      birthDate: row.birth_date,
      province: row.province,
      locality: row.locality,
      localityId: row.locality_id,
      localitySource: row.locality_source,
      schoolId: row.school_id,
      schoolMembership: row.school_membership,
      schoolRole: row.school_role,
      school: row.school,
      course: row.course,
      wasteSeparation: row.waste_separation,
      composting: row.composting,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
