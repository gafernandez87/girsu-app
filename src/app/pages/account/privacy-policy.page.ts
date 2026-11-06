import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { accountDeletionConfig } from '../../core/account-deletion.config';
import { privacyPolicyConfig } from '../../core/privacy-policy.config';

@Component({
  selector: 'app-privacy-policy-page',
  imports: [RouterLink],
  templateUrl: './privacy-policy.page.html',
  styleUrl: './privacy-policy.page.scss',
})
export class PrivacyPolicyPage {
  readonly config = privacyPolicyConfig;
  readonly supportEmail = 'educacion@ambientejujuy.gob.ar';
  readonly supportUrl = `mailto:${this.supportEmail}?subject=${encodeURIComponent(
    'Consulta de soporte - El Camino de los Residuos',
  )}`;
  readonly deletionConfig = accountDeletionConfig;
  readonly contactEmail = this.config.contactEmail || this.deletionConfig.email;
  readonly contactUrl = this.contactEmail
    ? `mailto:${this.contactEmail}?subject=${encodeURIComponent('Consulta de privacidad - El Camino de los Residuos')}`
    : null;
}
