import React from 'react';
import { PieChart, TrendingUp, Activity, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ValuePropositionSection: React.FC = () => {
  const navigate = useNavigate();

  const columns = [
    {
      icon: PieChart,
      title: 'Track Your Money',
      description: 'Know exactly where your money goes with smart categorization and insights.',
      link: '/spending',
      color: 'text-teal-700',
      bg: 'bg-teal-50',
    },
    {
      icon: TrendingUp,
      title: 'Plan Your Future',
      description: 'Set goals, simulate scenarios, and build long-term wealth with confidence.',
      link: '/future-self',
      color: 'text-emerald-700',
      bg: 'bg-emerald-50',
    },
    {
      icon: Activity,
      title: 'Understand Your Finances',
      description: 'Get a clear financial health score and actionable insights.',
      link: '/financial-health',
      color: 'text-cyan-700',
      bg: 'bg-cyan-50',
    },
  ];

  return (
    <section id="features" className="border-t border-slate-200/80 bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {columns.map((col, idx) => {
            const Icon = col.icon;
            return (
              <div
                key={idx}
                onClick={() => navigate(col.link)}
                className="group relative rounded-2xl border border-slate-200/80 bg-[#F8FAFA]/60 p-6 sm:p-7 transition-all duration-300 hover:bg-white hover:border-teal-300 hover:shadow-lg cursor-pointer"
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${col.bg} ${col.color} mb-4 shadow-2xs transition-transform duration-300 group-hover:scale-110`}
                >
                  <Icon className="h-6 w-6 stroke-[2]" />
                </div>

                <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center justify-between">
                  <span>{col.title}</span>
                  <ArrowRight className="h-4 w-4 text-slate-400 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-1 group-hover:text-teal-700" />
                </h3>

                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {col.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
