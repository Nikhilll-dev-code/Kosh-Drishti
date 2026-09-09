import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiUrl } from '../config/api';
import { motion, AnimatePresence } from 'framer-motion';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import {
  MapPin,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Search,
  ExternalLink,
  Compass,
  Layers,
  Building
} from 'lucide-react';
import { ALL_INDIAN_STATES } from '../data/realParliamentData';

// Local GeoJSON and TopoJSON Endpoints (Zero latency, reliable offline loading)
const GEO_URL_STATES = '/maps/india-states.json';
const GEO_URL_DISTRICTS = '/maps/india-districts.json';

const STATE_BASE_COLOR = '#1E3A5F';
const DISTRICT_BASE_COLOR = '#152942';
const HOVER_COLOR = '#F59E0B';
const STROKE_COLOR = '#070E1A';

export const IndiaMap = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('states'); // 'states' | 'districts'
  const [hoveredEntity, setHoveredEntity] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState([82, 22]);
  const [geoRiskMap, setGeoRiskMap] = useState({});

  React.useEffect(() => {
    fetch(getApiUrl('/api/risk/geography'))
      .then(res => res.json())
      .then(d => {
        if (d && d.geographic_risk) {
          const mapObj = {};
          d.geographic_risk.forEach(item => {
            mapObj[item.state.toLowerCase().replace(/[^a-z0-9]/g, '')] = item;
          });
          setGeoRiskMap(mapObj);
        }
      })
      .catch(() => {});
  }, []);

  // Robust State Lookup helper
  const getStateMeta = (rawName) => {
    if (!rawName) return null;
    const clean = rawName.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Direct or normalized match
    let found = ALL_INDIAN_STATES.find(s => s.state.toLowerCase().replace(/[^a-z0-9]/g, '') === clean);
    if (found) return found;

    // Handle aliases / merged UTs
    if (clean.includes('dadra') || clean.includes('daman') || clean.includes('diu')) {
      return ALL_INDIAN_STATES.find(s => s.state.toLowerCase().includes('dadra')) || {
        state: rawName,
        capital: 'Daman',
        mps_count: 2
      };
    }
    if (clean.includes('delhi')) {
      return ALL_INDIAN_STATES.find(s => s.state.toLowerCase().includes('delhi'));
    }
    if (clean.includes('andaman')) {
      return ALL_INDIAN_STATES.find(s => s.state.toLowerCase().includes('andaman'));
    }
    if (clean.includes('jammu') || clean.includes('kashmir')) {
      return ALL_INDIAN_STATES.find(s => s.state.toLowerCase().includes('jammu'));
    }
    if (clean.includes('odisha') || clean.includes('orissa')) {
      return ALL_INDIAN_STATES.find(s => s.state.toLowerCase().includes('odisha'));
    }

    return {
      state: rawName,
      capital: 'State HQ',
      mps_count: 1
    };
  };

  const handleZoomIn = () => setZoom((z) => Math.min(z * 1.4, 8));
  const handleZoomOut = () => setZoom((z) => Math.max(z / 1.4, 1));
  const handleReset = () => {
    setZoom(1);
    setCenter([82, 22]);
  };

  const handleStateClick = (stateName) => {
    if (stateName) {
      navigate(`/states/${encodeURIComponent(stateName)}`);
    }
  };

  const quickJumpStates = ['Gujarat', 'Uttar Pradesh', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Bihar', 'West Bengal', 'Kerala'];

  return (
    <div className="relative bg-gradient-to-b from-[#0F1D33] to-[#0A1322] rounded-3xl p-5 sm:p-7 text-white border border-slate-700/80 shadow-2xl overflow-hidden">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]"></div>

      {/* Header bar */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 border-b border-slate-700/70 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-amber-500/20 text-amber-400 rounded-xl">
              <MapPin className="w-4 h-4" />
            </span>
            <h2 className="text-lg sm:text-xl font-serif font-bold text-amber-400 tracking-wide">
              National Geographic Map &mdash; {viewMode === 'states' ? 'State Level' : 'District Level'}
            </h2>
          </div>
          <p className="text-xs text-slate-300 font-sans mt-0.5">
            {viewMode === 'states'
              ? 'Divided by all 28 States & 8 Union Territories. Click any state boundary to view elected MPs.'
              : 'Divided by 700+ Administrative Districts. Hover to view district identity and parent state.'}
          </p>
        </div>

        {/* Territory Status Tag */}
        <div className="flex items-center gap-2 text-xs font-mono bg-slate-900/90 px-3.5 py-1.5 rounded-xl border border-slate-700 text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>{viewMode === 'states' ? '28 States & 8 UTs' : '700+ Districts Active'}</span>
        </div>
      </div>

      {/* Quick State Pills */}
      <div className="relative z-10 flex flex-wrap items-center gap-2 mb-4">
        <span className="text-xs text-slate-400 font-sans flex items-center gap-1 font-semibold">
          <Compass className="w-3.5 h-3.5 text-amber-400" /> Focus State:
        </span>
        {quickJumpStates.map((st) => (
          <motion.button
            key={st}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => handleStateClick(st)}
            className="text-xs px-2.5 py-1 rounded-lg font-sans bg-slate-800 text-slate-200 border border-slate-700 hover:border-amber-400 hover:text-white transition-all shadow-xs"
          >
            {st}
          </motion.button>
        ))}
      </div>

      {/* Map Viewport Area */}
      <div className="relative flex justify-center items-center min-h-[480px]">
        {/* Floating Controls: States/Districts Toggle + Zoom in/out */}
        <div className="absolute top-3 right-3 z-20 flex flex-col items-end gap-2.5">
          {/* States vs Districts View Switcher Button (Requested Feature) */}
          <div className="flex items-center bg-slate-900/95 p-1 rounded-xl border border-slate-700 shadow-xl text-xs font-mono">
            <button
              onClick={() => {
                setViewMode('states');
                setHoveredEntity(null);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'states'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Compass className="w-3.5 h-3.5" /> States
            </button>
            <button
              onClick={() => {
                setViewMode('districts');
                setHoveredEntity(null);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'districts'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Building className="w-3.5 h-3.5" /> Districts
            </button>
          </div>

          {/* Zoom Buttons */}
          <div className="flex flex-col gap-1.5">
            <button
              onClick={handleZoomIn}
              title="Zoom In"
              className="w-8 h-8 rounded-lg bg-slate-800/90 border border-slate-700 text-white flex items-center justify-center hover:bg-slate-700 transition-colors shadow-lg"
              aria-label="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomOut}
              title="Zoom Out"
              className="w-8 h-8 rounded-lg bg-slate-800/90 border border-slate-700 text-white flex items-center justify-center hover:bg-slate-700 transition-colors shadow-lg"
              aria-label="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleReset}
              title="Reset Map View"
              className="w-8 h-8 rounded-lg bg-slate-800/90 border border-slate-700 text-white flex items-center justify-center hover:bg-slate-700 transition-colors shadow-lg"
              aria-label="Reset map"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            </button>
          </div>
        </div>

        {/* The Interactive Map Layer */}
        <div className="w-full max-w-[520px]">
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{ center: [82, 22], scale: 920 }}
            width={520}
            height={540}
            style={{ width: '100%', height: 'auto' }}
          >
            <ZoomableGroup
              center={center}
              zoom={zoom}
              minZoom={1}
              maxZoom={8}
              onMoveEnd={(pos) => {
                setZoom(pos.zoom);
                setCenter(pos.coordinates);
              }}
            >
              {viewMode === 'states' ? (
                /* STATE BOUNDARIES LAYER */
                <Geographies geography={GEO_URL_STATES}>
                  {({ geographies }) =>
                    geographies.map((geo) => {
                      const stName = geo.properties.st_nm || geo.properties.NAME_1 || geo.properties.name;
                      const isHovered = hoveredEntity?.name === stName;
                      const cleanKey = (stName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                      const riskItem = geoRiskMap[cleanKey];
                      const fillColor = riskItem ? riskItem.color : STATE_BASE_COLOR;

                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          onMouseEnter={() => {
                            const meta = getStateMeta(stName);
                            setHoveredEntity({
                              type: 'state',
                              name: meta?.state || stName,
                              capital: meta?.capital || 'State HQ',
                              mps_count: meta?.mps_count || 26,
                              risk_score: riskItem?.risk_score ?? 'N/A',
                              risk_tier: riskItem?.risk_tier ?? 'LOW',
                              high_risk_count: riskItem?.high_risk_count ?? 0
                            });
                          }}
                          onMouseLeave={() => setHoveredEntity(null)}
                          onClick={() => handleStateClick(stName)}
                          style={{
                            default: {
                              fill: fillColor,
                              stroke: STROKE_COLOR,
                              strokeWidth: 0.6,
                              outline: 'none',
                              transition: 'all 200ms ease',
                              cursor: 'pointer'
                            },
                            hover: {
                              fill: HOVER_COLOR,
                              stroke: '#FFFFFF',
                              strokeWidth: 1.5,
                              outline: 'none',
                              filter: 'drop-shadow(0 0 10px rgba(245,158,11,0.5))',
                              cursor: 'pointer'
                            },
                            pressed: {
                              fill: '#D97706',
                              stroke: '#FFFFFF',
                              strokeWidth: 2,
                              outline: 'none'
                            }
                          }}
                        />
                      );
                    })
                  }
                </Geographies>
              ) : (
                /* DISTRICT BOUNDARIES LAYER */
                <Geographies geography={GEO_URL_DISTRICTS}>
                  {({ geographies }) =>
                    geographies.map((geo) => {
                      const distName = geo.properties.district || geo.properties.NAME_2 || geo.properties.dtname || geo.properties.name || 'District';
                      const stName = geo.properties.st_nm || geo.properties.state || geo.properties.NAME_1 || '';

                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          onMouseEnter={() => {
                            setHoveredEntity({
                              type: 'district',
                              name: distName,
                              state: stName
                            });
                          }}
                          onMouseLeave={() => setHoveredEntity(null)}
                          onClick={() => {
                            if (stName) handleStateClick(stName);
                          }}
                          style={{
                            default: {
                              fill: DISTRICT_BASE_COLOR,
                              stroke: '#08121E',
                              strokeWidth: 0.35,
                              outline: 'none',
                              transition: 'all 150ms ease',
                              cursor: 'pointer'
                            },
                            hover: {
                              fill: HOVER_COLOR,
                              stroke: '#FFFFFF',
                              strokeWidth: 1.2,
                              outline: 'none',
                              cursor: 'pointer'
                            },
                            pressed: {
                              fill: '#D97706',
                              stroke: '#FFFFFF',
                              strokeWidth: 1.5,
                              outline: 'none'
                            }
                          }}
                        />
                      );
                    })
                  }
                </Geographies>
              )}
            </ZoomableGroup>
          </ComposableMap>
        </div>

        {/* Hover Tooltip Card */}
        <AnimatePresence>
          {hoveredEntity && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-4 left-4 z-30 bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-2xl border border-amber-500/50 shadow-2xl max-w-xs w-full pointer-events-none"
            >
              <div className="flex items-center justify-between border-b border-slate-700 pb-2 mb-2">
                <div>
                  <div className="text-[10px] font-mono text-amber-400 uppercase font-semibold">
                    {hoveredEntity.type === 'state' ? 'State / Territory' : 'Administrative District'}
                  </div>
                  <div className="font-serif font-bold text-base text-white">
                    {hoveredEntity.name}
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </div>

              {hoveredEntity.type === 'state' ? (
                <div className="space-y-1.5 text-xs font-sans">
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="text-slate-400">Lok Sabha Seats:</span>
                    <span className="font-mono font-bold text-white">{hoveredEntity.mps_count} MPs</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="text-slate-400">Capital:</span>
                    <span className="font-medium text-slate-200">{hoveredEntity.capital}</span>
                  </div>
                  <div className="pt-2 text-[11px] text-amber-400 font-sans italic text-center font-medium">
                    Click state boundary to view all MPs &rarr;
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5 text-xs font-sans">
                  {hoveredEntity.state && (
                    <div className="flex justify-between items-center text-slate-300">
                      <span className="text-slate-400">Parent State:</span>
                      <span className="font-semibold text-amber-300">{hoveredEntity.state}</span>
                    </div>
                  )}
                  <div className="pt-2 text-[11px] text-amber-400 font-sans italic text-center font-medium">
                    Click district to explore state MPs &rarr;
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};