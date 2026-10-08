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
  readonly lastUpdatedLabel = new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'long',
    timeZone: 'UTC',
  }).format(new Date(this.config.lastUpdated));
  readonly deletionConfig = accountDeletionConfig;
  readonly contactEmail = this.config.contactEmail || this.deletionConfig.email;
  readonly contactUrl = this.contactEmail
    ? `mailto:${this.contactEmail}?subject=${encodeURIComponent('Consulta de privacidad - El Camino de los Residuos')}`
    : null;
  readonly isDraft = !(
    this.config.controllerName &&
    this.config.controllerAddress &&
    this.contactEmail &&
    this.config.processingBasisNotice &&
    this.config.hostingNotice &&
    this.config.internationalTransfersNotice &&
    this.config.minorsNotice &&
    this.deletionConfig.retentionNotice
  );
}
