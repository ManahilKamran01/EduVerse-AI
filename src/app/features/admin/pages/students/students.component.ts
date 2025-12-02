import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { DataTableComponent, TableColumn } from '../../../../shared/components/data-table/data-table.component';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { FiltersComponent } from '../../../../shared/components/filters/filters.component';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-students',
  standalone: true,
  imports: [
    HeaderComponent,
    DataTableComponent,
    CommonModule,
    FiltersComponent,
    HttpClientModule
  ],
  templateUrl: './students.component.html',
  styleUrls: ['./students.component.css']
})
export class StudentsComponent implements OnInit {

  currentPage = 1;
  students: any[] = [];
  filteredStudents: any[] = [];
  backendUrl = 'http://127.0.0.1:8000/admin/students';

  studentColumns: TableColumn[] = [
    { key: 'avatar', label: 'Student', type: 'avatar' },
    { key: 'class', label: 'Class', type: 'text' },
    { key: 'rollNo', label: 'Roll No', type: 'text' },
    {
      key: 'status',
      label: 'Status',
      type: 'badge',
      badgeColors: {
        Enrolled: 'bg-green-100 text-green-800',
        Graduated: 'bg-blue-100 text-blue-800',
        Dropped: 'bg-red-100 text-red-800',
        Suspended: 'bg-yellow-100 text-yellow-800'
      },
    },
  ];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchStudents();
  }

  // Fetch students from backend
  fetchStudents(): void {
    this.http.get<any>(this.backendUrl)
      .pipe(catchError(err => { 
        console.error(err); 
        alert('Failed to fetch students'); 
        return of({ students: [] }); 
      }))
      .subscribe((response) => {
        const data = response.students || [];
        this.students = data.map((s: any) => ({
          ...s,
          name: s.name || '',
          avatar: s.name ? s.name.split(' ').map((n: string) => n[0]).join('') : '',
          class: s.class || 'N/A',
          rollNo: s.rollNo || 'N/A',
          status: s.status || 'Enrolled'
        }));
        this.filteredStudents = [...this.students];
      });
  }

  // Edit student
  onEditStudent(student: any) {
  const updatedName = prompt('Update student name', student.name);
  if (!updatedName) return;

  const updatedStudent = { fullName: updatedName }; // backend expects fullName

  this.http.patch(`${this.backendUrl}/${student.id}`, updatedStudent)
    .pipe(catchError(err => { 
      console.error(err); 
      alert('Failed to update student'); 
      return of(null); 
    }))
    .subscribe((res: any) => {
      if (res) {
        // Update both arrays immediately
        const index = this.students.findIndex(s => s.id === res.id);
        if (index !== -1) this.students[index] = { ...this.students[index], ...res };

        const fIndex = this.filteredStudents.findIndex(s => s.id === res.id);
        if (fIndex !== -1) this.filteredStudents[fIndex] = { ...this.filteredStudents[fIndex], ...res };
      }
    });
}

  // Delete student
  onDeleteStudent(student: any) {
    if (!confirm(`Are you sure you want to delete "${student.name}"?`)) return;

    this.http.delete(`${this.backendUrl}/${student.id}`)
      .pipe(catchError(err => { 
        console.error(err); 
        alert('Failed to delete student'); 
        return of(null); 
      }))
      .subscribe(res => this.fetchStudents());
  }

  // Filtering
  onFiltersChange(filters: any) {
    this.currentPage = 1;
    const search = filters.search?.toLowerCase() || '';
    this.filteredStudents = this.students.filter(s => {
      const matchesSearch =
        !search ||
        s.name.toLowerCase().includes(search) ||
        s.email?.toLowerCase().includes(search);

      const matchesStatus =
        !filters.status || s.status === filters.status;

      return matchesSearch && matchesStatus;
    });
  }

  // Pagination
  onPageChange(page: number) {
    this.currentPage = page;
  }
}
