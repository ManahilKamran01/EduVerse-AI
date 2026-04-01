export const API_BASE_URL = 'http://localhost:8000';

export const ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/login`,
    STUDENT_LOGIN: `${API_BASE_URL}/students/login`,
  },
  COURSES: {
    BASE: `${API_BASE_URL}/courses`,
    BY_ID: (id: string) => `${API_BASE_URL}/courses/${id}`,
    STUDENT_COURSES: (studentId: string) =>
      `${API_BASE_URL}/courses/student/${studentId}`,
    ENROLL: `${API_BASE_URL}/courses/enroll`,
    UNENROLL: `${API_BASE_URL}/courses/unenroll`,
  },
  STUDENTS: {
    BASE: `${API_BASE_URL}/students`,
  },
  TEACHERS: {
    BASE: `${API_BASE_URL}/teachers`,
  },
  ADMINS: {
    BASE: `${API_BASE_URL}/admin/dashboard`,
  },
  PERFORMANCE: {
    BASE: `${API_BASE_URL}/studentPerformance`,
  },

  ASSIGNMENTS: {
    BASE: `${API_BASE_URL}/assignments`,
    BY_ID: (id: string) => `${API_BASE_URL}/assignments/${id}`,
  },

  ASSIGNMENT_SUBMISSIONS: {
    BASE: `${API_BASE_URL}/assignment-submissions`,
    BY_STUDENT: `${API_BASE_URL}/assignment-submissions/me`,
    BY_ASSIGNMENT: (assignmentId: string) =>
      `${API_BASE_URL}/assignment-submissions/assignment/${assignmentId}`,
    SUBMISSION: (submissionId: string) =>
      `${API_BASE_URL}/assignment-submissions/${submissionId}`,
  },
  ADAPTIVE: {
    BASE: `${API_BASE_URL}/adaptive`,
    GENERATE_LESSON: `${API_BASE_URL}/adaptive/generate-lesson`,
    GENERATE_BASE_LESSON: `${API_BASE_URL}/adaptive/generate-base-lesson`,
    CLASSIFICATION: (studentId: string) => `${API_BASE_URL}/adaptive/student/${studentId}/classification`,
    GENERATED_LESSONS: (studentId: string) => `${API_BASE_URL}/adaptive/student/${studentId}/generated-lessons`,
    GENERATE_QUIZ: `${API_BASE_URL}/adaptive/generate-quiz`,
  },
  AI_TUTOR: {
    BASE: `${API_BASE_URL}/ai-tutor`,
    CHAT: `${API_BASE_URL}/ai-tutor/chat`,
    SESSION: (courseId: string) => `${API_BASE_URL}/ai-tutor/session/${courseId}`,
  },
} as const;
