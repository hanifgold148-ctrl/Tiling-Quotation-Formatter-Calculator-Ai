import React from 'react';

interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  gradient: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, gradient }) => {
  return (
    <div className={`relative bg-white/80 dark:bg-white/5 backdrop-blur-sm p-6 rounded-3xl shadow-sm border border-white/50 dark:border-white/10 overflow-hidden group transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-md`}>
      {/* Background Gradient Overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-50`}></div>
      
      <div className="relative z-10 flex justify-between items-start">
          <div>
              <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 opacity-80">{title}</p>
              <h3 className="text-3xl font-extrabold text-brand-dark dark:text-white tracking-tight">{value}</h3>
          </div>
          <div className="p-3.5 rounded-2xl bg-white dark:bg-gray-800 shadow-sm text-gray-600 dark:text-gray-300 group-hover:scale-110 transition-transform duration-300">
              {icon}
          </div>
      </div>
      
      {/* Decorative blurred circle */}
      <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-current opacity-5 rounded-full blur-2xl pointer-events-none"></div>
    </div>
  );
};

export default MetricCard;