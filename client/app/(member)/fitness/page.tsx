'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  Heart, 
  Moon, 
  Flame, 
  Footprints, 
  Zap, 
  Route, 
  RefreshCw, 
  ExternalLink,
  Droplets,
  AlertCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { getGoogleAuthUrl } from '@/lib/googleFit';
import axios from 'axios';

interface FitnessData {
  steps: number;
  calories: number;
  heartRate: number;
  spo2: number;
  activeMinutes: number;
  distance: number;
  sleep: number;
}

const FitnessStatCard = ({ title, value, unit, icon: Icon, color, index, trend }: any) => {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor = trend === "up" ? "text-[#B8FF3C]" : trend === "down" ? "text-red-400" : "text-slate-400";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.02 }}
      className="group relative bg-[#13131A] border border-white/10 rounded-2xl p-6 overflow-hidden flex flex-col justify-between min-h-[160px] transition-all duration-300 hover:border-[#B8FF3C]/30 hover:shadow-[0_0_30px_rgba(184,255,60,0.1)]"
    >
      <div className={`absolute -right-8 -bottom-8 w-24 h-24 blur-[50px] opacity-10 pointer-events-none transition-colors duration-500`} style={{ backgroundColor: color }} />
      
      <div className="absolute right-6 top-6 opacity-20 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
        <Icon size={40} strokeWidth={1} style={{ color }} />
      </div>

      <div>
        <div className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-4 relative z-10">{title}</div>
        <div className="flex items-end gap-2 relative z-10">
          <span className="text-4xl font-black text-white leading-none">
            {value === 0 && unit !== "hrs" && unit !== "%" ? "---" : value}
          </span>
          {unit && <span className="text-sm text-slate-500 mb-1 font-bold lowercase">{unit}</span>}
        </div>
      </div>

      <div className={`flex items-center gap-1.5 mt-4 text-[11px] font-black uppercase tracking-wider ${trendColor} relative z-10`}>
          <div className={`p-1 rounded-full ${trend === "up" ? "bg-[#B8FF3C]/10" : trend === "down" ? "bg-red-500/10" : "bg-slate-500/10"}`}>
              <TrendIcon size={12} />
          </div>
          <span>Synchronized</span>
      </div>
    </motion.div>
  );
};

const LoadingSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    {[...Array(7)].map((_, i) => (
      <div key={i} className="bg-[#13131A]/50 animate-pulse border border-white/5 rounded-2xl p-6 h-40" />
    ))}
  </div>
);

export default function FitnessPage() {
  const [data, setData] = useState<FitnessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/fitness');
      setData(response.data);
      setLastSynced(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('not_connected');
      } else {
        setError('Failed to fetch fitness data');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleConnect = () => {
    window.location.href = getGoogleAuthUrl();
  };

  if (error === 'not_connected') {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[#0A0A0F] to-[#13131A] rounded-3xl border border-white/5 shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#B8FF3C] to-transparent opacity-50" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="z-10 text-center max-w-sm"
        >
          <div className="mb-10 flex justify-center">
            <div className="w-24 h-24 bg-[#B8FF3C]/10 rounded-full flex items-center justify-center border border-[#B8FF3C]/20 shadow-[0_0_50px_rgba(184,255,60,0.1)] relative">
              <Activity size={40} className="text-[#B8FF3C]" />
              <motion.div 
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.2, 0.5] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute inset-0 bg-[#B8FF3C] rounded-full blur-xl" 
              />
            </div>
          </div>
          <h1 className="text-4xl font-black mb-4 tracking-tighter text-white">
            BIOMETRIC <span className="text-[#B8FF3C]">SYNC</span>
          </h1>
          <p className="text-slate-400 mb-10 text-sm font-medium leading-relaxed">
            Authorize Google Fit to bridge the gap between your Noise smartwatch and AI coaching.
          </p>
          <button
            onClick={handleConnect}
            className="group relative w-full px-8 py-4 bg-[#B8FF3C] text-[#0A0A0F] font-black uppercase tracking-widest rounded-xl overflow-hidden transition-all hover:shadow-[0_0_20px_rgba(184,255,60,0.4)] hover:-translate-y-0.5 active:translate-y-0"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              Connect Google Fit <ExternalLink size={18} />
            </span>
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-[#B8FF3C] shadow-[0_0_10px_#B8FF3C]" />
            <span className="text-slate-500 font-black uppercase text-[10px] tracking-[0.3em]">Health Intelligence</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white mb-1">
            Fitness <span className="text-[#B8FF3C]">Log</span>
          </h1>
          <p className="text-sm text-slate-500">Live health telemetry from your Google Fit account.</p>
        </div>

        <div className="flex items-center gap-4">
          {lastSynced && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-slate-500 font-bold uppercase text-[9px] tracking-widest">
              <Clock size={12} className="text-[#B8FF3C]" /> Synced at {lastSynced}
            </div>
          )}
          <button 
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 hover:border-[#B8FF3C]/30 hover:text-[#B8FF3C] transition-all rounded-xl text-xs font-black uppercase tracking-widest disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Refreshing' : 'Sync Data'}
          </button>
        </div>
      </header>

      {error && (
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-red-500/10 border border-red-500/20 p-4 flex items-center gap-3 rounded-2xl"
        >
          <AlertCircle size={18} className="text-red-400" />
          <p className="text-xs font-black uppercase tracking-wider text-red-200">{error}</p>
        </motion.div>
      )}

      {loading ? (
        <LoadingSkeleton />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <FitnessStatCard 
            index={0}
            title="Total Steps" 
            value={data?.steps.toLocaleString()} 
            unit="steps" 
            icon={Footprints} 
            color="#B8FF3C" 
            trend="up"
          />
          <FitnessStatCard 
            index={1}
            title="Burned" 
            value={data?.calories} 
            unit="kcal" 
            icon={Flame} 
            color="#ff5555" 
            trend="up"
          />
          <FitnessStatCard 
            index={2}
            title="Heart Rate" 
            value={data?.heartRate} 
            unit="bpm" 
            icon={Heart} 
            color="#ff3e8d" 
            trend="up"
          />
          <FitnessStatCard 
            index={3}
            title="SPO2" 
            value={data?.spo2} 
            unit="%" 
            icon={Droplets} 
            color="#3db9ff" 
            trend="flat"
          />
          <FitnessStatCard 
            index={4}
            title="Active State" 
            value={data?.activeMinutes} 
            unit="mins" 
            icon={Zap} 
            color="#fbbf24" 
            trend="up"
          />
          <FitnessStatCard 
            index={5}
            title="Distance" 
            value={data?.distance} 
            unit="km" 
            icon={Route} 
            color="#10b981" 
            trend="up"
          />
          <FitnessStatCard 
            index={6}
            title="Rest Cycle" 
            value={data?.sleep} 
            unit="hrs" 
            icon={Moon} 
            color="#818cf8" 
            trend="up"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[#13131A] border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
             <Activity size={180} />
          </div>
          <h3 className="text-lg font-black text-white mb-2 flex items-center gap-2">
            <TrendingUp size={20} className="text-[#B8FF3C]" />
            Health Intelligence
          </h3>
          <p className="text-sm text-slate-400 leading-relaxed max-w-md">
            Your biometrics are being optimized. NutriSnap's AI is analyzing your heart rate variability and active cycles to refine your macro targets.
          </p>
        </div>
        
        <div className="bg-gradient-to-br from-[#13131A] to-[#0A0A0F] border border-white/5 rounded-2xl p-6 flex items-center justify-between">
            <div className="space-y-1">
                <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Device Status</div>
                <div className="text-white font-black">Google Fit Active Sync</div>
                <div className="flex items-center gap-2 text-[10px] text-[#B8FF3C] font-bold">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#B8FF3C] animate-ping" />
                    LIVE TELEMETRY
                </div>
            </div>
            <div className="w-12 h-12 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center opacity-50">
               <RefreshCw size={20} />
            </div>
        </div>
      </div>
    </div>
  );
}
