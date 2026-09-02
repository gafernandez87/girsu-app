import { Component, EventEmitter, forwardRef, Input, OnChanges, Output } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { School } from '../../core/app.models';

@Component({
  selector: 'app-school-combobox',
  template: `
    <span class="school-combobox" [class.school-combobox--invalid]="invalid">
      <input
        type="search"
        autocomplete="organization"
        [disabled]="isDisabled"
        [placeholder]="placeholder"
        [value]="search"
        (blur)="hideResults()"
        (focus)="focused = true"
        (input)="onSearchInput($event)"
      />

      @if (showResults) {
        <span class="school-results" role="listbox">
          @for (school of filteredSchools; track school.id) {
            <button
              type="button"
              class="school-result"
              role="option"
              (mousedown)="selectSchool(school)"
            >
              <strong>{{ school.name }}</strong>
              <small>{{ school.locality || 'Sin localidad' }} · CUEANEXO {{ school.sourceCode }}</small>
            </button>
          }
        </span>
      }
    </span>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .school-combobox {
        position: relative;
        display: block;
      }

      input {
        width: 100%;
        min-height: 2.42rem;
        padding: 0.52rem 0.68rem;
        border: 1px solid rgba(61, 43, 29, 0.16);
        border-radius: 8px;
        background: #fffdf7;
        color: #19231d;
        font: inherit;
        font-size: 0.92rem;
      }

      input:disabled {
        cursor: not-allowed;
        opacity: 0.58;
      }

      .school-combobox--invalid input {
        border-color: #b24130;
        box-shadow: 0 0 0 2px rgba(178, 65, 48, 0.12);
      }

      .school-results {
        position: absolute;
        z-index: 20;
        top: calc(100% + 0.35rem);
        right: 0;
        left: 0;
        display: grid;
        max-height: 16rem;
        overflow-y: auto;
        border: 1px solid rgba(61, 43, 29, 0.14);
        border-radius: 8px;
        background: #fffdf7;
        box-shadow: 0 0.9rem 2rem rgba(45, 28, 18, 0.14);
      }

      .school-result {
        display: grid;
        gap: 0.18rem;
        width: 100%;
        min-height: auto;
        padding: 0.68rem 0.75rem;
        border: 0;
        border-bottom: 1px solid rgba(61, 43, 29, 0.1);
        border-radius: 0;
        background: transparent;
        color: #19231d;
        font: inherit;
        text-align: left;
      }

      .school-result:last-child {
        border-bottom: 0;
      }

      .school-result:hover,
      .school-result:focus-visible {
        background: rgba(47, 125, 87, 0.1);
        outline: none;
      }

      .school-result strong {
        font-size: 0.9rem;
        font-weight: 760;
        line-height: 1.2;
      }

      .school-result small {
        color: #66736b;
        font-size: 0.78rem;
        font-weight: 560;
      }
    `,
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SchoolComboboxComponent),
      multi: true,
    },
  ],
})
export class SchoolComboboxComponent implements ControlValueAccessor, OnChanges {
  @Input() invalid = false;
  @Input() loading = false;
  @Input() placeholder = 'Buscar escuela';
  @Input() schools: readonly School[] = [];
  @Output() readonly schoolSelect = new EventEmitter<School>();

  disabled = false;
  focused = false;
  search = '';
  value = '';

  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  get filteredSchools(): readonly School[] {
    const search = this.search.trim().toLowerCase();

    if (!search) {
      return this.schools;
    }

    return this.schools
      .filter((school) =>
        [school.name, school.locality, school.department, school.sourceCode]
          .join(' ')
          .toLowerCase()
          .includes(search)
      )
  }

  get isDisabled(): boolean {
    return this.disabled || this.loading;
  }

  get showResults(): boolean {
    return this.focused && !this.isDisabled && this.filteredSchools.length > 0;
  }

  ngOnChanges(): void {
    this.syncSearchWithValue();
  }

  writeValue(value: string | null): void {
    this.value = value ?? '';
    this.syncSearchWithValue();
  }

  registerOnChange(onChange: (value: string) => void): void {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: () => void): void {
    this.onTouched = onTouched;
  }

  setDisabledState(disabled: boolean): void {
    this.disabled = disabled;
  }

  hideResults(): void {
    window.setTimeout(() => {
      this.focused = false;
      this.onTouched();
    }, 120);
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.search = input.value;
    this.focused = true;

    if (this.selectedSchoolLabel() !== input.value) {
      this.value = '';
      this.onChange('');
    }
  }

  selectSchool(school: School): void {
    this.value = school.id;
    this.search = this.formatSchoolOption(school);
    this.focused = false;
    this.onChange(this.value);
    this.onTouched();
    this.schoolSelect.emit(school);
  }

  private formatSchoolOption(school: School): string {
    const locality = school.locality ? ` - ${school.locality}` : '';
    const status = school.isActive ? '' : ' (inactiva)';
    return `${school.name}${locality}${status}`;
  }

  private selectedSchoolLabel(): string {
    const selectedSchool = this.schools.find((school) => school.id === this.value);
    return selectedSchool ? this.formatSchoolOption(selectedSchool) : '';
  }

  private syncSearchWithValue(): void {
    if (!this.value) {
      this.search = '';
      return;
    }

    this.search = this.selectedSchoolLabel() || this.search;
  }
}
