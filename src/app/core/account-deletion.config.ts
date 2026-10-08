export const accountDeletionConfig: {
  readonly email: string;
  readonly retentionNotice: string;
} = {
  // email is an optional fallback privacy contact, never a prerequisite for deletion.
  // Confirm additional retention of backups, logs and prior correspondence before release.
  email: '',
  retentionNotice: '',
};
