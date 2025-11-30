import { NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterOutlet, Router } from '@angular/router';

@Component({
  selector: 'app-student-signup',
  imports: [NgIf, RouterLink],
  templateUrl: './student-signup.component.html',
  styleUrl: './student-signup.component.css',
})
export class StudentSignupComponent {
  constructor(private router: Router) {}
  password: any;
  email: any;
  fullName: any;
  onSignup() {
    this.router.navigate(['/admin/dashboard']);
  }

}
