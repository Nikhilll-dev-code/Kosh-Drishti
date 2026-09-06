import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Interactive SVG India State Map
 * State risk levels drive choropleth fill colors per UI/UX Section 5.1
 */
const STATE_PATHS = [
  { id: 'Gujarat', name: 'Gujarat', path: 'M 100,240 L 140,210 L 180,220 L 190,260 L 160,285 L 110,285 Z' },
  { id: 'Andhra Pradesh', name: 'Andhra Pradesh', path: 'M 250,330 L 290,320 L 310,370 L 280,410 L 240,370 Z' },
  { id: 'Maharashtra', name: 'Maharashtra', path: 'M 160,285 L 240,270 L 260,330 L 190,340 L 150,310 Z' },
  { id: 'Uttar Pradesh', name: 'Uttar Pradesh', path: 'M 220,160 L 300,160 L 310,210 L 230,220 Z' },
  { id: 'Tamil Nadu', name: 'Tamil Nadu', path: 'M 250,420 L 280,410 L 270,470 L 230,460 Z' },
  { id: 'Rajasthan', name: 'Rajasthan', path: 'M 140,160 L 210,150 L 220,220 L 140,210 Z' },
  { id: 'West Bengal', name: 'West Bengal', path: 'M 350,230 L 380,220 L 370,270 L 340,280 Z' },
  { id: 'Madhya Pradesh', name: 'Madhya Pradesh', path: 'M 190,220 L 280,210 L 270,270 L 190,260 Z' },
  { id: 'Karnataka', name: 'Karnataka', path: 'M 190,340 L 240,340 L 250,410 L 200,420 Z' },
  { id: 'Bihar', name: 'Bihar', path: 'M 310,190 L 360,190 L 350,230 L 300,220 Z' },
  { id: 'Odisha', name: 'Odisha', path: 'M 280,270 L 340,260 L 330,310 L 270,300 Z' },
  { id: 'Kerala', name: 'Kerala', path: 'M 220,440 L 240,430 L 230,480 L 210,470 Z' },
  { id: 'Punjab', name: 'Punjab', path: 'M 160,110 L 200,105 L 190,140 L 150,140 Z' },
  { id: 'Haryana', name: 'Haryana', path: 'M 180,135 L 210,130 L 210,165 L 180,160 Z' }
];

export const IndiaMap = ({ stateAggregates = [] }) => {
  const [hoveredState, setHoveredState] = useState(null);
  const navigate = useNavigate();

  const getAggregate = (stateName) => {
    return stateAggregates.find(s => s.state.toLowerCase() === stateName.toLowerCase()) || {
      avg_risk: 25,
      work_count: 0,
      flagged_count: 0,
      risk_level: 'Low'
    };
  };

  const getColor = (avgRisk) => {
    if (avgRisk >= 65) return '#8C2F2F'; // Alert Rust
    if (avgRisk >= 40) return '#C46210'; // Signal Saffron
    return '#2E6F40'; // Verified Green
  };

  return (
    <div className="relative bg-slate-900 rounded-lg p-6 text-white border border-slate-800 shadow-lg overflow-hidden">
      <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-lg font-serif font-semibold text-amber-400">National MPLADS Risk Heat-Map</h2>
          <p className="text-xs text-slate-400 font-sans">States shaded by aggregate composite risk score. Click a state to drill down.</p>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-xs bg-[#2E6F40]"></span> Low Risk</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-xs bg-[#C46210]"></span> Medium</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-xs bg-[#8C2F2F]"></span> High Risk</span>
        </div>
      </div>

      <div className="relative flex justify-center items-center py-2">
        <svg viewBox="0 0 500 520" className="w-full max-w-lg h-auto drop-shadow-md">
          {/* Base map outline */}
          <path
            d="M 120,80 L 220,60 L 320,100 L 420,180 L 380,320 L 300,500 L 210,490 L 120,320 Z"
            fill="#1E293B"
            stroke="#334155"
            strokeWidth="2"
          />

          {STATE_PATHS.map(st => {
            const agg = getAggregate(st.name);
            const fill = getColor(agg.avg_risk);
            const isHovered = hoveredState?.name === st.name;

            return (
              <g key={st.id} className="cursor-pointer transition-transform duration-200">
                <path
                  d={st.path}
                  fill={fill}
                  stroke="#0F172A"
                  strokeWidth={isHovered ? "2.5" : "1.5"}
                  className="transition-all duration-300 hover:opacity-90"
                  onMouseEnter={() => setHoveredState({ ...st, ...agg })}
                  onMouseLeave={() => setHoveredState(null)}
                  onClick={() => navigate(`/states/${encodeURIComponent(st.name)}`)}
                />
                <text
                  x={getCenter(st.path).x}
                  y={getCenter(st.path).y}
                  fill="#FFFFFF"
                  fontSize="10"
                  fontFamily="IBM Plex Mono"
                  fontWeight="600"
                  textAnchor="middle"
                  pointerEvents="none"
                  className="drop-shadow-xs"
                >
                  {st.name.substring(0, 3).toUpperCase()}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredState && (
          <div className="absolute top-4 right-4 bg-slate-800/95 backdrop-blur-sm text-white p-3.5 rounded-md border border-slate-700 shadow-xl max-w-xs text-xs font-sans pointer-events-none">
            <div className="font-serif font-bold text-amber-400 text-sm mb-1">{hoveredState.name}</div>
            <div className="space-y-1 font-mono text-slate-300">
              <div className="flex justify-between">
                <span>Avg Composite Risk:</span>
                <span className="font-bold text-white">{hoveredState.avg_risk}/100</span>
              </div>
              <div className="flex justify-between">
                <span>Sanctioned Works:</span>
                <span className="text-white">{hoveredState.work_count}</span>
              </div>
              <div className="flex justify-between">
                <span>High Risk Flags:</span>
                <span className="text-rose-400 font-bold">{hoveredState.flagged_count}</span>
              </div>
            </div>
            <div className="mt-2 text-[10px] text-amber-300 font-sans italic border-t border-slate-700 pt-1.5">
              Click to view MP breakdown →
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function getCenter(pathStr) {
  const coords = pathStr.match(/\d+,\d+/g) || [];
  let sumX = 0, sumY = 0;
  coords.forEach(c => {
    const [x, y] = c.split(',').map(Number);
    sumX += x;
    sumY += y;
  });
  return {
    x: coords.length ? sumX / coords.length : 250,
    y: coords.length ? sumY / coords.length : 250
  };
}
