import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  MapPin,
  PhoneCall,
  ShieldAlert,
  BadgeCheck,
  Clock,
  Star,
} from 'lucide-react';
import { SERVICE_CENTERS } from '../data/mockData';

export default function CentersScreen({ lang, t }) {
  const isAr = lang === 'ar';
  const [query, setQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('ALL');
  const [brandFilter, setBrandFilter] = useState('ALL');

  const cities = [
    { key: 'ALL', label: t.centers.allCities },
    { key: 'Cairo', label: isAr ? 'القاهرة' : 'Cairo' },
    { key: 'Giza', label: isAr ? 'الجيزة' : 'Giza' },
    { key: 'Alexandria', label: isAr ? 'الإسكندرية' : 'Alexandria' },
  ];

  const brands = [
    { key: 'ALL', label: t.centers.allBrands },
    { key: 'El Araby', label: isAr ? 'العربي / تورنيدو / شارب' : 'El Araby' },
    { key: 'LG', label: 'LG' },
    { key: 'Samsung', label: 'Samsung' },
  ];

  const filtered = SERVICE_CENTERS.filter((c) => {
    const matchCity = cityFilter === 'ALL' || c.cityKey === cityFilter;
    const matchBrand = brandFilter === 'ALL' || c.brandKey === brandFilter;
    const text = `${c.nameEn} ${c.nameAr} ${c.addressEn} ${c.addressAr} ${c.hotline}`.toLowerCase();
    const matchQuery = !query.trim() || text.includes(query.trim().toLowerCase());
    return matchCity && matchBrand && matchQuery;
  });

  return (
    <div className="space-y-4 pb-28">
      <div>
        <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
          {t.centers.title}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {t.centers.subtitle}
        </p>
      </div>

      {/* Anti-Scam Warning Banner */}
      <div className="rounded-2xl border border-rose-500/35 bg-rose-500/10 p-3.5 flex items-start gap-3">
        <ShieldAlert className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
        <div>
          <h3 className="text-xs font-extrabold text-rose-600 dark:text-rose-300">
            {t.centers.scamBannerTitle}
          </h3>
          <p className="text-[11px] text-slate-700 dark:text-slate-300 mt-0.5">
            {t.centers.scamBannerDesc}
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute top-3 start-3.5 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.centers.searchPlaceholder}
          className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/75 ps-10 pe-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
        />
      </div>

      {/* City & Brand Filters */}
      <div className="space-y-2">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {cities.map((c) => (
            <button
              key={c.key}
              onClick={() => setCityFilter(c.key)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold transition-all ${
                cityFilter === c.key
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {brands.map((b) => (
            <button
              key={b.key}
              onClick={() => setBrandFilter(b.key)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold transition-all ${
                brandFilter === b.key
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950'
                  : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {/* Service Center Cards */}
      <div className="space-y-3">
        {filtered.map((center) => (
          <motion.div
            key={center.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/75 backdrop-blur-xl p-4 space-y-2.5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-300">
                    <BadgeCheck className="h-3 w-3" />
                    {t.centers.verifiedBadge}
                  </span>
                  <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-amber-500">
                    <Star className="h-3 w-3 fill-amber-500" />
                    {center.rating}
                  </span>
                </div>
                <h3 className="mt-1.5 text-sm font-extrabold text-slate-900 dark:text-white">
                  {isAr ? center.nameAr : center.nameEn}
                </h3>
                <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  {center.brand}
                </p>
              </div>

              <motion.a
                whileTap={{ scale: 0.95 }}
                href={`tel:${center.hotline}`}
                className="shrink-0 flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-extrabold text-slate-950 shadow-md shadow-emerald-500/20"
              >
                <PhoneCall className="h-3.5 w-3.5" />
                <span className="font-mono">{center.hotline}</span>
              </motion.a>
            </div>

            <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>{isAr ? center.addressAr : center.addressEn}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>{isAr ? center.hoursAr : center.hoursEn}</span>
              </div>
            </div>

            <div className="rounded-xl bg-amber-500/10 border border-amber-500/25 px-3 py-2 text-[10px] font-medium text-amber-700 dark:text-amber-300">
              {isAr ? center.fakeAdWarningAr : center.fakeAdWarningEn}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
