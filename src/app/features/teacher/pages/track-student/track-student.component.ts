import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { FiltersComponent } from '../../../../shared/components/filters/filters.component';
import {
  DataTableComponent,
  TableColumn,
} from '../../../../shared/components/data-table/data-table.component';

@Component({
  selector: 'app-track-student',
  standalone: true,
  imports: [HeaderComponent, CommonModule, FiltersComponent, DataTableComponent],
  templateUrl: './track-student.component.html',
  styleUrls: ['./track-student.component.css'],
})
export class TrackStudentComponent {
  constructor(private router: Router) {}

  dropdowns = [
    {
      key: 'course',
      label: 'Courses',
      options: ['Introduction to Algebra', 'World History', 'Physics 101'],
    },
    {
      key: 'status',
      label: 'Grade',
      options: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F'],
    },
  ];

  filters: any = { search: '', course: '', status: '' };

  columns: TableColumn[] = [
    { key: 'name', label: 'Student Name', type: 'text' },
    { key: 'email', label: 'Email', type: 'text' },
    { key: 'course', label: 'Course Enrolled', type: 'text' },
    { key: 'progress', label: 'Progress', type: 'progress' },
    { key: 'grade', label: 'Grades', type: 'text' },
    { key: 'action', label: 'Action', type: 'link', link: '/teacher/student-details' },
  ];

  students = [
    {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@example.com',
      course: 'Introduction to Algebra',
      progress: 85,
      grade: 'A',
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      course: 'World History',
      progress: 45,
      grade: 'C+',
    },
    {
      id: 3,
      name: 'Mike Johnson',
      email: 'mike.johnson@example.com',
      course: 'Physics 101',
      progress: 100,
      grade: 'A-',
    },
    {
      id: 4,
      name: 'Emily Davis',
      email: 'emily.davis@example.com',
      course: 'Introduction to Algebra',
      progress: 20,
      grade: 'F',
    },
  ];


  currentPage = 1;
  pageSize = 5;
  totalItems = this.students.length;

  onFiltersChange(updatedFilters: any) {
    this.filters = updatedFilters;
    this.applyFilters();
  }

  applyFilters() {
    this.students = this.getAllStudents().filter((student) => {
      const matchesSearch = this.filters.search
        ? student.name.toLowerCase().includes(this.filters.search.toLowerCase())
        : true;

      const matchesCourse = this.filters.course
        ? student.course === this.filters.course
        : true;

      const matchesGrade = this.filters.status
        ? student.grade === this.filters.status
        : true;

      return matchesSearch && matchesCourse && matchesGrade;
    });

    this.totalItems = this.students.length;
  }

  getAllStudents() {
    return [
      {
        id: 1,
        name: 'John Doe',
        email: 'john.doe@example.com',
        course: 'Introduction to Algebra',
        progress: 85,
        grade: 'A',
      },
      {
        id: 2,
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        course: 'World History',
        progress: 45,
        grade: 'C+',
      },
      {
        id: 3,
        name: 'Mike Johnson',
        email: 'mike.johnson@example.com',
        course: 'Physics 101',
        progress: 100,
        grade: 'A-',
      },
      {
        id: 4,
        name: 'Emily Davis',
        email: 'emily.davis@example.com',
        course: 'Introduction to Algebra',
        progress: 20,
        grade: 'F',
      },
    ];
  }

  getProgressColor(progress: number): string {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-yellow-400';
    return 'bg-red-500';
  }
  onActionClick(student: any) {
    this.router.navigate(['/teacher/student-details', student.id]);
  }
}
