import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  Trophy, 
  ArrowUpRight,
  TrendingUp
} from 'lucide-react';
import { useCollectionQuery } from '../hooks/useFirestore';
import type { Student, Teacher, Course, Achievement } from '../types';
import { StatsSkeleton, TableSkeleton } from '../components/ui/Skeleton';
import { getGoogleDriveImageUrl } from '../services/googleDrive';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export const Dashboard: React.FC = () => {
  // Query collections
  const { data: students = [], isLoading: loadingStudents } = useCollectionQuery<Student>('students');
  const { data: teachers = [], isLoading: loadingTeachers } = useCollectionQuery<Teacher>('teachers');
  const { data: courses = [], isLoading: loadingCourses } = useCollectionQuery<Course>('courses');
  const { data: achievements = [], isLoading: loadingAchievements } = useCollectionQuery<Achievement>('achievements');

  const isLoading = loadingStudents || loadingTeachers || loadingCourses || loadingAchievements;

  // Filter totals
  const totalStudents = students.length;
  const totalTeachers = teachers.length;
  const totalCourses = courses.length;
  const totalAchievements = achievements.length;

  // Sort and filter recent registrations
  const recentStudents = [...students]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const recentTeachers = [...teachers]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8">
        <StatsSkeleton />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <TableSkeleton rows={4} cols={3} />
          <TableSkeleton rows={4} cols={3} />
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: 'Total Students',
      value: totalStudents,
      link: '/students',
      icon: <Users className="w-6 h-6 text-green-600 dark:text-green-400" />,
      bg: 'bg-green-500/10 dark:bg-green-500/5 border-green-200/20 dark:border-green-950/20',
      description: 'Active, pending & rejected profiles'
    },
    {
      title: 'Total Teachers',
      value: totalTeachers,
      link: '/teachers',
      icon: <GraduationCap className="w-6 h-6 text-blue-600 dark:text-blue-400" />,
      bg: 'bg-blue-500/10 dark:bg-blue-500/5 border-blue-200/20 dark:border-blue-950/20',
      description: 'Tutors profiles & documentation'
    },
    {
      title: 'Total Courses',
      value: totalCourses,
      link: '/courses',
      icon: <BookOpen className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />,
      bg: 'bg-indigo-500/10 dark:bg-indigo-500/5 border-indigo-200/20 dark:border-indigo-950/20',
      description: 'Listed programs in the academy'
    },
    {
      title: 'Total Achievements',
      value: totalAchievements,
      link: '/achievements',
      icon: <Trophy className="w-6 h-6 text-amber-600 dark:text-amber-400" />,
      bg: 'bg-amber-500/10 dark:bg-amber-500/5 border-amber-200/20 dark:border-amber-950/20',
      description: 'Awards, certifications & achievements'
    }
  ];

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'danger';
      default: return 'warning';
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Welcome header banner */}
      <div className="rounded-2xl border border-green-200/30 dark:border-green-950/25 bg-gradient-to-r from-green-600 to-emerald-700 text-white p-6 md:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-2xl font-bold md:text-3xl leading-snug">Welcome to Zubair Online Academy</h2>
          <p className="text-sm text-green-100 leading-relaxed font-medium">
            Monitor and manage student registers, tutor certificates, course configurations, and databases.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 bg-white/10 backdrop-blur-xs px-4 py-2.5 rounded-xl border border-white/10 text-sm font-semibold">
          <TrendingUp className="w-4 h-4 text-green-300" />
          <span>System running optimal</span>
        </div>
      </div>

      {/* Grid Stats Summary Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <Link to={stat.link} key={i} className="group focus:outline-none">
            <Card className={`hover:shadow-md cursor-pointer border transition-all duration-300 relative overflow-hidden ${stat.bg}`}>
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-550 dark:text-slate-400 uppercase tracking-wider">{stat.title}</span>
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">{stat.value}</span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-950 flex items-center justify-center border border-slate-100 dark:border-slate-850 group-hover:scale-110 transition-transform shadow-2xs">
                  {stat.icon}
                </div>
              </div>
              <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-4 flex items-center gap-1">
                <span>{stat.description}</span>
                <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
              </p>
            </Card>
          </Link>
        ))}
      </div>

      {/* Grid Recent Activity Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Recent Students Registrations */}
        <Card 
          title="Recent Students" 
          subtitle="Latest enrollments requiring verification"
          headerAction={
            <Link to="/students" className="text-xs font-bold text-green-600 hover:text-green-700 hover:underline">
              View All
            </Link>
          }
        >
          {recentStudents.length === 0 ? (
            <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">
              No registered students found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-850/60 pb-3 text-xs font-semibold text-slate-400 dark:text-slate-500">
                    <th className="pb-3 pr-4 font-semibold">Student</th>
                    <th className="pb-3 pr-4 font-semibold">Course</th>
                    <th className="pb-3 text-right font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-850/30">
                  {recentStudents.map((stud) => (
                    <tr key={stud.id} className="text-sm text-slate-600 dark:text-slate-350 hover:bg-slate-50/30 dark:hover:bg-slate-900/10">
                      <td className="py-3.5 pr-4 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-850 border border-slate-200/50 dark:border-slate-800 overflow-hidden shrink-0">
                          {stud.photoUrl ? (
                            <img src={getGoogleDriveImageUrl(stud.photoUrl)} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-bold text-slate-400 text-xs">
                              {stud.fullName[0].toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-slate-900 dark:text-slate-100 truncate">{stud.fullName}</span>
                          <span className="text-[11px] text-slate-400 truncate">{stud.country}</span>
                        </div>
                      </td>
                      <td className="py-3.5 pr-4 font-medium text-slate-500 dark:text-slate-400 max-w-[150px] truncate">
                        {stud.course}
                      </td>
                      <td className="py-3.5 text-right">
                        <Badge variant={getStatusVariant(stud.status)}>
                          {stud.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Recent Teachers Registrations */}
        <Card 
          title="Recent Tutors" 
          subtitle="New applications for review"
          headerAction={
            <Link to="/teachers" className="text-xs font-bold text-green-600 hover:text-green-700 hover:underline">
              View All
            </Link>
          }
        >
          {recentTeachers.length === 0 ? (
            <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">
              No registered teachers found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-850/60 pb-3 text-xs font-semibold text-slate-400 dark:text-slate-500">
                    <th className="pb-3 pr-4 font-semibold">Tutor</th>
                    <th className="pb-3 pr-4 font-semibold">Qualification</th>
                    <th className="pb-3 text-right font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-850/30">
                  {recentTeachers.map((teach) => (
                    <tr key={teach.id} className="text-sm text-slate-600 dark:text-slate-350 hover:bg-slate-50/30 dark:hover:bg-slate-900/10">
                      <td className="py-3.5 pr-4 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-850 border border-slate-200/50 dark:border-slate-800 overflow-hidden shrink-0">
                          {teach.photoUrl ? (
                            <img src={getGoogleDriveImageUrl(teach.photoUrl)} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-bold text-slate-400 text-xs">
                              {teach.fullName[0].toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-slate-900 dark:text-slate-100 truncate">{teach.fullName}</span>
                          <span className="text-[11px] text-slate-400 truncate">{teach.country}</span>
                        </div>
                      </td>
                      <td className="py-3.5 pr-4 font-medium text-slate-500 dark:text-slate-400 max-w-[150px] truncate">
                        {teach.qualification}
                      </td>
                      <td className="py-3.5 text-right">
                        <Badge variant={getStatusVariant(teach.status)}>
                          {teach.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

      </div>
    </div>
  );
};
export default Dashboard;
