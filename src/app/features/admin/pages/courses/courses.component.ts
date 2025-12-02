import { Component, OnInit } from '@angular/core';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { DataTableComponent, TableColumn } from '../../../../shared/components/data-table/data-table.component';
import { FiltersComponent } from '../../../../shared/components/filters/filters.component';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-courses',
  standalone: true,
  imports: [HeaderComponent, DataTableComponent, FiltersComponent, HttpClientModule],
  templateUrl: './courses.component.html',
  styleUrls: ['./courses.component.css'],
})
export class CoursesComponent implements OnInit {
  currentPage = 1;
  courses: any[] = [];
  filteredCourses: any[] = [];
  backendUrl = 'http://127.0.0.1:8000/admin/courses'; // Only defined once

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchCourses();
  }

  // Fetch courses from backend
  fetchCourses(): void {
    this.http.get<any>(this.backendUrl)
      .pipe(catchError(err => {
        console.error(err);
        return of({ courses: [] });
      }))
      .subscribe(res => {
        this.courses = res.courses.map((c: any) => ({
          ...c,
          instructor: c.instructor || 'N/A',
          status: c.status || 'Active',
        }));
        this.filteredCourses = [...this.courses];
      });
  }

  // Table columns
  courseColumns: TableColumn[] = [
    { key: 'title', label: 'Course Title', type: 'text' },
    { key: 'code', label: 'Code', type: 'text' },
    { key: 'instructor', label: 'Instructor', type: 'text' },
    {
      key: 'status',
      label: 'Status',
      type: 'badge',
      badgeColors: {
        Active: 'bg-green-100 text-green-800',
        Inactive: 'bg-red-100 text-red-800',
      },
    },
  ];

  // Pagination
  onPageChange(page: number): void {
    this.currentPage = page;
  }

  // Edit course
  onEditCourse(course: any): void {
    const updatedTitle = prompt('Update course title', course.title);
    if (!updatedTitle) return;

    const updatedCourse = { title: updatedTitle };

    this.http.patch(`${this.backendUrl}/${course.id}`, updatedCourse)
      .pipe(catchError(err => {
        console.error(err);
        alert('Failed to update course');
        return of(null);
      }))
      .subscribe((res: any) => {
        if (res) {
          // Update the course locally instead of fetching again
          const index = this.courses.findIndex(c => c.id === res.id);
          if (index !== -1) {
            this.courses[index] = { ...this.courses[index], ...res };
          }

          const fIndex = this.filteredCourses.findIndex(c => c.id === res.id);
          if (fIndex !== -1) {
            this.filteredCourses[fIndex] = { ...this.filteredCourses[fIndex], ...res };
          }
        }
      });
  }

  // Delete course
  onDeleteCourse(course: any): void {
    if (!confirm(`Are you sure you want to delete "${course.title}"?`)) return;

    this.http.delete(`${this.backendUrl}/${course.id}`)
      .pipe(catchError(err => {
        console.error(err);
        alert('Failed to delete course');
        return of(null);
      }))
      .subscribe(() => {
        this.courses = this.courses.filter(c => c.id !== course.id);
        this.filteredCourses = this.filteredCourses.filter(c => c.id !== course.id);
      });
  }

  // Filtering
  onFiltersChange(filters: { [key: string]: string } | undefined): void {
    this.currentPage = 1;
    const search = filters?.['search']?.toLowerCase() || '';
    const statusFilter = filters?.['status']?.toLowerCase() || '';

    this.filteredCourses = this.courses.filter(c => {
      const matchesSearch =
        !search ||
        c.title.toLowerCase().includes(search) ||
        c.code.toLowerCase().includes(search) ||
        c.instructor.toLowerCase().includes(search);

      const matchesStatus =
        !statusFilter || c.status.toLowerCase() === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }
}
