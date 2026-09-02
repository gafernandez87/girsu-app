import { Component, forwardRef, Input, OnChanges } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { JujuyLocality } from '../../core/app.models';

@Component({
  selector: 'app-locality-combobox',
  template: `
    <span class="locality-combobox" [class.locality-combobox--invalid]="invalid">
      <input
        type="search"
        autocomplete="address-level2"
        aria-label="Buscar localidad"
        [attr.aria-expanded]="showResults"
        [disabled]="isDisabled"
        [placeholder]="placeholder"
        [value]="search"
        (blur)="hideResults()"
        (focus)="focused = true"
        (input)="onSearchInput($event)"
      />

      @if (showResults) {
        <span class="locality-results" role="listbox">
          @for (locality of filteredLocalities; track locality.id) {
            <button
              type="button"
              class="locality-result"
              role="option"
              (mousedown)="selectLocality(locality)"
            >
              {{ locality.name }}
            </button>
          } @empty {
            <span class="locality-empty">No encontramos localidades con ese nombre.</span>
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

      .locality-combobox {
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

      .locality-combobox--invalid input {
        border-color: #b24130;
        box-shadow: 0 0 0 2px rgba(178, 65, 48, 0.12);
      }

      .locality-results {
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

      .locality-result,
      .locality-empty {
        width: 100%;
        padding: 0.62rem 0.72rem;
        border: 0;
        border-bottom: 1px solid rgba(61, 43, 29, 0.1);
        border-radius: 0;
        background: transparent;
        color: #19231d;
        font: inherit;
        font-size: 0.88rem;
        font-weight: 680;
        text-align: left;
      }

      .locality-result:last-child {
        border-bottom: 0;
      }

      .locality-result:hover,
      .locality-result:focus-visible {
        background: rgba(47, 125, 87, 0.1);
        outline: none;
      }

      .locality-empty {
        color: #66736b;
        font-size: 0.8rem;
        font-weight: 560;
      }
    `,
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => LocalityComboboxComponent),
      multi: true,
    },
  ],
})
export class LocalityComboboxComponent implements ControlValueAccessor, OnChanges {
  @Input() invalid = false;
  @Input() loading = false;
  @Input() localities: readonly JujuyLocality[] = [];
  @Input() placeholder = 'Buscar localidad';

  disabled = false;
  focused = false;
  search = '';
  value = '';

  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  get filteredLocalities(): readonly JujuyLocality[] {
    const search = this.search.trim().toLocaleLowerCase('es-AR');

    return this.localities
      .filter((locality) => locality.name.toLocaleLowerCase('es-AR').includes(search))
      .slice(0, 50);
  }

  get isDisabled(): boolean {
    return this.disabled || this.loading;
  }

  get showResults(): boolean {
    return this.focused && !this.isDisabled;
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

    if (this.selectedLocalityName() !== input.value) {
      this.value = '';
      this.onChange('');
    }
  }

  selectLocality(locality: JujuyLocality): void {
    this.value = locality.id;
    this.search = locality.name;
    this.focused = false;
    this.onChange(this.value);
    this.onTouched();
  }

  private selectedLocalityName(): string {
    return this.localities.find((locality) => locality.id === this.value)?.name ?? '';
  }

  private syncSearchWithValue(): void {
    if (!this.value) {
      this.search = '';
      return;
    }

    this.search = this.selectedLocalityName() || this.search;
  }
}
