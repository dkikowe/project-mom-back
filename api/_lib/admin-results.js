import { isLearningComplete, progressView } from './progress.js';

export function buildAdminResults(users, allProgress, graded) {
  const progressByStudent = new Map(allProgress.map(item => [item.studentId.toString(), progressView(item)]));
  const gradeByStudent = new Map();
  for (const submission of graded) {
    const id = submission.studentId.toString();
    if (!gradeByStudent.has(id)) gradeByStudent.set(id, submission.grading);
  }

  const joined = users.map(user => {
    const id = user._id.toString();
    const progress = progressByStudent.get(id) || progressView(null);
    return {
      id,
      name: user.name,
      email: user.email,
      progress,
      grade: gradeByStudent.get(id) || null,
      learningComplete: isLearningComplete(progress),
      excludedAt: user.resultsExcludedAt || null,
    };
  });
  const students = joined.filter(student => !student.excludedAt);
  const excludedStudents = joined.filter(student => student.excludedAt).map(({ id, name, email, excludedAt }) => ({ id, name, email, excludedAt }));
  const gradedStudents = students.filter(student => student.grade);
  const average = key => gradedStudents.length
    ? Math.round(gradedStudents.reduce((sum, student) => sum + student.grade[key], 0) / gradedStudents.length * 10) / 10
    : null;

  return {
    summary: {
      students: students.length,
      registeredStudents: users.length,
      excluded: excludedStudents.length,
      learningComplete: students.filter(student => student.learningComplete).length,
      graded: gradedStudents.length,
      averageA: average('scoreA'),
      averageD: average('scoreD'),
    },
    students: students.map(({ excludedAt, ...student }) => student),
    excludedStudents,
  };
}
