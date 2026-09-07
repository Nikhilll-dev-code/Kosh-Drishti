import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export const Breadcrumb = ({ items = [] }) => {
  return (
    <nav className="flex items-center text-sm font-sans text-slate-600 mb-5 bg-white px-4 py-2.5 rounded border border-ledger-line shadow-xs">
      <Link to="/" className="flex items-center gap-1 hover:text-ledger-navy transition-colors font-medium">
        <Home className="w-4 h-4 text-slate-500" />
        <span>Home</span>
      </Link>
      {items.map((item, idx) => (
        <React.Fragment key={idx}>
          <ChevronRight className="w-4 h-4 text-slate-400 mx-1.5 shrink-0" />
          {item.link ? (
            <Link to={item.link} className="hover:text-ledger-navy font-medium transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="font-semibold text-ledger-navy">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};
