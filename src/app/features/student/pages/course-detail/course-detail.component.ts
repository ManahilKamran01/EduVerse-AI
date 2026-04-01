import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CourseService, BackendCourse } from '../../../../core/services/course.service';
import { AuthService } from '../../../auth/services/auth.service';
import { StudentProgressService } from '../../services/student-progress.service';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { StripeEmbeddedModalComponent } from '../../../../shared/components/stripe-embedded-modal/stripe-embedded-modal.component';
import { ConfirmDialogService } from '../../../../shared/services/confirm-dialog.service';

@Component({
  selector: 'app-course-detail',
  standalone: true,
  imports: [CommonModule, HeaderComponent, ButtonComponent, StripeEmbeddedModalComponent],
  templateUrl: './course-detail.component.html',
  styleUrls: ['./course-detail.component.css']
})
export class CourseDetailComponent implements OnInit {
  courseId: string = '';
  course: BackendCourse | null = null;
  loading: boolean = true;
  error: string | null = null;
  enrolling: boolean = false;
  showSuccessModal: boolean = false;
  showPaymentModal: boolean = false;
  clientSecret: string = '';
  isEnrolled: boolean = false;
  progress: number = 0;
  quizCount: number = 0;
  assignmentCount: number = 0; // Currently mapping 'reading' or custom types to assignments if applicable

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private courseService: CourseService,
    private authService: AuthService,
    private progressService: StudentProgressService,
    private confirmDialogService: ConfirmDialogService
  ) { }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.courseId = params.get('id') || '';
      if (this.courseId) {
        this.loadCourse();
      }
    });
    // Scroll to top when navigation occurs
    window.scrollTo(0, 0);
  }

  loadCourse() {
    const tenantId = this.authService.getTenantId();

    this.courseService.getCourseById(this.courseId, tenantId || '').subscribe({
      next: (course) => {
        console.log('Loaded Course:', course); // DEBUG
        this.course = course;
        this.calculateStats();
        this.checkEnrollment();
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.error = 'Failed to load course details';
        this.loading = false;
      }
    });
  }

  calculateStats() {
    this.quizCount = 0;
    this.assignmentCount = 0;
    if (this.course?.modules) {
      this.course.modules.forEach(module => {
        if (module.lessons) {
          module.lessons.forEach((lesson: any) => {
            const type = (lesson.type || '').toLowerCase();
            if (type === 'quiz') {
              this.quizCount++;
            } else if (type === 'document' || type === 'reading' || type === 'assignment' || type === 'file') {
              this.assignmentCount++;
            }
          });
        }
      });
    }
  }

  checkEnrollment() {
    const user = this.authService.getUser();
    const tenantId = this.authService.getTenantId() || '';
    if (!user) return;

    const studentId = user.studentId || user.id;
    this.courseService.getStudentCourses(studentId, tenantId).subscribe({
      next: (courses) => {
        this.isEnrolled = courses.some(c => c._id === this.courseId || c.id === this.courseId);
        if (this.isEnrolled) {
          this.loadProgress(this.course?.tenantId || tenantId);
        }
      },
      error: (err) => console.error('Error checking enrollment:', err)
    });
  }

  loadProgress(tenantId: string) {
    this.progressService.getCourseProgress(this.courseId, tenantId).subscribe({
      next: (prog) => {
        this.progress = prog.progressPercentage;
      },
      error: (err) => console.error('Error loading progress:', err)
    });
  }

  get learningButtonText(): string {
    if (this.progress === 100) return "Enroll Again";
    if (this.progress > 0) return "Continue Learning";
    return "Start Learning";
  }

  get isCompletedCourse(): boolean {
    return this.isEnrolled && this.progress === 100;
  }

  startLearning() {
    this.router.navigate(['/student/learn', this.courseId]);
  }

  async handleEnrolledAction() {
    if (!this.isCompletedCourse) {
      this.startLearning();
      return;
    }

    const confirmed = await this.confirmDialogService.confirm(
      'Enroll Again',
      'This will reset your progress, quizzes, adaptive lessons, and tutor history for this course. Continue?'
    );

    if (!confirmed) {
      return;
    }

    this.processEnrollment();
  }

  enroll() {
    const user = this.authService.getUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    if (this.isCompletedCourse) {
      this.processEnrollment();
      return;
    }

    // Check if course is paid
    if (this.course && !this.course.isFree && (this.course.price || 0) > 0) {
      this.enrolling = true;
      this.courseService.createCheckoutSession(this.courseId).subscribe({
         next: (res) => {
            if(res.clientSecret) {
               this.clientSecret = res.clientSecret;
               this.showPaymentModal = true;
            }
            this.enrolling = false;
         },
         error: (err) => {
            console.error("Failed to generate stripe checkout", err);
            this.enrolling = false;
         }
      });
    } else {
      this.processEnrollment();
    }
  }

  onPaymentSuccess() {
    this.showPaymentModal = false;
    this.clientSecret = '';
  }

  processEnrollment() {
    const user = this.authService.getUser();
    const userTenantId = this.authService.getTenantId();
    const tenantId = this.course?.tenantId || userTenantId;

    if (!user || !tenantId) return;

    this.enrolling = true;
    const studentId = user.studentId || user.id;

    this.courseService.enrollStudent(this.courseId, studentId, tenantId).subscribe({
      next: () => {
        this.enrolling = false;
        this.isEnrolled = true;
        this.progress = 0;
        this.showSuccessModal = true;
      },
      error: async (err) => {
        this.enrolling = false;
        console.error(err);
        await this.confirmDialogService.alert('Enrollment failed: ' + (err.error?.detail || 'Unknown error'), 'Error', 'danger');
      }
    });
  }

  closeModal() {
    this.showSuccessModal = false;
    this.router.navigate(['/student/learn', this.courseId]);
  }

  goBack() {
    this.router.navigate(['/student/explore-courses']);
  }
}
