import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-admin-signup',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './admin-signup.component.html',
  styleUrl: './admin-signup.component.css',
})
export class AdminSignupComponent {
  signupForm: FormGroup;

  constructor(private fb: FormBuilder, private router: Router) {
    this.signupForm = this.fb.group(
      {
        firstName: ['', Validators.required],
        lastName: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required],
        country: ['', Validators.required],
        phone: ['', Validators.required],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  passwordMatchValidator(group: FormGroup) {
    const pass = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;
    return pass === confirm ? null : { passwordMismatch: true };
  }

  onSubmit() {
    if (this.signupForm.valid) {
      console.log('Signup Successful:', this.signupForm.value);
      this.router.navigate(['/admin/dashboard']);
    } else {
      console.log('Invalid Form');
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched() {
    Object.keys(this.signupForm.controls).forEach((key) => {
      this.signupForm.get(key)?.markAsTouched();
    });
  }
  get firstName() {
    return this.signupForm.get('firstName');
  }
  get lastName() {
    return this.signupForm.get('lastName');
  }
  get email() {
    return this.signupForm.get('email');
  }
  get password() {
    return this.signupForm.get('password');
  }
  get confirmPassword() {
    return this.signupForm.get('confirmPassword');
  }
  get country() {
    return this.signupForm.get('country');
  }
  get phone() {
    return this.signupForm.get('phone');
  }
}
