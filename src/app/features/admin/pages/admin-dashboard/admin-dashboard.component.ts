import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatCardComponent } from '../../../../shared/components/stat-card/stat-card.component';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { DataTableComponent, TableColumn } from '../../../../shared/components/data-table/data-table.component';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    StatCardComponent,
    DataTableComponent,
    HttpClientModule,
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css'],
})
export class AdminDashboardComponent implements OnInit {
  constructor(private http: HttpClient) {}

  // Stats cards
  statsCards: StatCard[] = [
    { title: 'Total Users', value: '0', icon: 'fas fa-users', iconBgClass: 'bg-blue-100', iconColorClass: 'text-blue-600' },
    { title: 'Active Courses', value: '0', icon: 'fas fa-graduation-cap', iconBgClass: 'bg-green-100', iconColorClass: 'text-green-600' },
    { title: 'Registered Courses', value: '0', icon: 'fas fa-book-open', iconBgClass: 'bg-purple-100', iconColorClass: 'text-purple-600' },
    { title: 'Total Teachers', value: '0', icon: 'fas fa-chalkboard-teacher', iconBgClass: 'bg-orange-100', iconColorClass: 'text-orange-600' },
  ];

  // Table columns
  teacherColumns: TableColumn[] = [
    { key: 'avatar', label: 'Teacher', type: 'avatar' },
    { key: 'courses', label: 'Courses', type: 'text' },
    { key: 'students', label: 'Students', type: 'text' },
    { key: 'role', label: 'Role', type: 'text' },
    {
      key: 'status',
      label: 'Status',
      type: 'badge',
      badgeColors: { Active: 'bg-green-100 text-green-800', Inactive: 'bg-red-100 text-red-800' },
    },
  ];

  studentColumns: TableColumn[] = [
    { key: 'avatar', label: 'Student', type: 'avatar' },
    { key: 'class', label: 'Class', type: 'text' },
    { key: 'rollNo', label: 'Roll No', type: 'text' },
    {
      key: 'status',
      label: 'Status',
      type: 'badge',
      badgeColors: { Enrolled: 'bg-green-100 text-green-800', Graduated: 'bg-blue-100 text-blue-800', Dropped: 'bg-red-100 text-red-800' },
    },
  ];

  courseColumns: TableColumn[] = [
    { key: 'title', label: 'Course Title', type: 'text' },
    { key: 'courseCode', label: 'Code', type: 'text' },
    { key: 'teacher', label: 'Instructor', type: 'text' },
    {
      key: 'status',
      label: 'Status',
      type: 'badge',
      badgeColors: { Active: 'bg-green-100 text-green-800', Inactive: 'bg-red-100 text-red-800' },
    },
  ];

  // Data arrays
  teachers: any[] = [];
  students: any[] = [];
  courses: any[] = [];

  ngOnInit(): void {
    this.fetchTeachers();
    this.fetchStudents();
    this.fetchCourses();
  }

  fetchTeachers(): void {
  this.http.get<{ total: number; teachers: any[] }>('http://127.0.0.1:8000/admin/teachers')
    .subscribe((res) => {
      
      const mappedTeachers = res.teachers.map((t) => ({
        ...t,
        avatar: t.name.split(' ').map((n: string) => n[0]).join(''),
      }));

      this.teachers = mappedTeachers.slice(0, 3);

      this.statsCards[3].value = res.total.toString();
    });
}

fetchStudents(): void {
  this.http.get<{ total: number; students: any[] }>('http://127.0.0.1:8000/admin/students')
    .subscribe((res) => {
      const mappedStudents = res.students.map((s) => ({
        ...s,
        avatar: s.name.split(' ').map((n: string) => n[0]).join(''),
      }));

      this.students = mappedStudents.slice(0, 3);

      // Convert string to number before adding
      this.statsCards[0].value = (res.total + Number(this.statsCards[3].value)).toString();
    });
}


fetchCourses(): void {
  this.http.get<{ total: number; courses: any[] }>('http://127.0.0.1:8000/admin/courses')
    .subscribe((res) => {
      const mappedCourses = res.courses.map((c) => ({
        id: c.id,
        title: c.title,
        courseCode: c.code,      
        teacher: c.instructor,   
        status: c.status,
      }));

      this.courses = mappedCourses.slice(0, 3);

      this.statsCards[1].value = mappedCourses.filter(c => c.status.toLowerCase() === 'active').length.toString();
      this.statsCards[2].value = res.total.toString();
    });
}

}

interface StatCard {
  title: string;
  value: string;
  icon: string;
  iconBgClass: string;
  iconColorClass: string;
}
