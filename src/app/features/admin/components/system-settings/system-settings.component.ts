 import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../../../shared/components/button/button.component';

@Component({
  selector: 'app-system-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent],
  templateUrl: './system-settings.component.html',
  styleUrls: ['./system-settings.component.css'],
})
export class SystemSettingsComponent {
  logoPreview: string | ArrayBuffer | null = 'assets/default-logo.png';
  
  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      const reader = new FileReader();
      reader.onload = () => (this.logoPreview = reader.result);
      reader.readAsDataURL(file);
    }
  }

  onAddUser() {}
}