import { Component, computed, inject } from '@angular/core';

import { accountDeletionConfig } from '../../core/account-deletion.config';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-account-deletion-page',
  templateUrl: './account-deletion.page.html',
  styleUrl: './account-deletion.page.scss',
})
export class AccountDeletionPage {
  private readonly auth = inject(AuthService);

  readonly config = accountDeletionConfig;
  readonly requestUrl = computed(() => {
    const email = this.auth.session()?.user.email ?? '';
    const subject = 'Solicitud de eliminacion de cuenta - El Camino de los Residuos';
    const body = [
      'Solicito eliminar mi cuenta de El Camino de los Residuos y todos sus datos asociados.',
      '',
      `Correo de mi cuenta: ${email || '[escribir el correo registrado]'}`,
      '',
      'Por favor, confirmen la eliminacion por este medio.',
    ].join('\n');

    return `mailto:${this.config.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
}
