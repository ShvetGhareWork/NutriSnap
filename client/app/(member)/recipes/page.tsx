"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
    Search, SlidersHorizontal, ChevronRight, ChevronLeft,
    FlaskConical, CalendarDays, BarChart3, Shuffle, Zap,
    Flame, Clock, Star, BookOpen, Filter, X, RefreshCw, AlertCircle,
    Heart, Trash2, CalendarPlus, PieChart, Check, Minus, Plus
} from "lucide-react";
import { useGlobalStore } from "@/store/useGlobalStore";

type Mode = "bulk" | "cut";
type FilterTag = "High Protein" | "Under 30 mins" | "Low Carb" | "Vegan" | "High Calorie" | "Indian";

interface Recipe {
    id: number;
    title: string;
    image: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    readyInMinutes: number;
    rating: number;
    diets: string[];
}

interface PlannedMeal {
    id: string;
    recipe: Recipe;
    day: string;
}

const FILTER_TAGS: FilterTag[] = ["High Protein", "Under 30 mins", "Low Carb", "Vegan", "High Calorie", "Indian"];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const PAGE_SIZE_DEFAULT = 4;

const TOOLS = [
    { id: 'lookup', icon: FlaskConical, label: "Ingredient Lookup" },
    { id: 'planner', icon: CalendarDays, label: "Meal Planner" },
    { id: 'analysis', icon: BarChart3, label: "Diet Analysis" },
    { id: 'random', icon: Shuffle, label: "Meal Randomizer" },
];

const MODE_META = {
    bulk: { label: "Bulk Mode", accentBg: "bg-orange-500", accentText: "text-orange-400", shadow: "shadow-orange-500/20", desc: "High-calorie meals to fuel muscle growth" },
    cut: { label: "Cut Mode", accentBg: "bg-[#B8FF3C]", accentText: "text-[#B8FF3C]", shadow: "shadow-[#B8FF3C]/20", desc: "Lean, high-protein meals for fat loss" },
};

// ── Skeleton Loader ──────────────────────────────────────────────────────────
function SkeletonCard() {
    return (
        <div className="bg-[#13131A] border border-white/8 rounded-2xl overflow-hidden animate-pulse">
            <div className="aspect-[4/3] bg-white/5" />
            <div className="p-3.5 space-y-3">
                <div className="h-4 bg-white/10 rounded w-3/4" />
                <div className="grid grid-cols-3 gap-1.5 pt-2">
                    <div className="h-8 bg-white/5 rounded-xl border border-white/5" />
                    <div className="h-8 bg-white/5 rounded-xl border border-white/5" />
                    <div className="h-8 bg-white/5 rounded-xl border border-white/5" />
                </div>
            </div>
        </div>
    );
}

// ── Recipe card ───────────────────────────────────────────────────────────────
function RecipeCard({ recipe, onClick, isFavorite, onToggleFavorite }: {
    recipe: Recipe,
    onClick: () => void,
    isFavorite?: boolean,
    onToggleFavorite?: (e: React.MouseEvent) => void
}) {
    return (
        <div
            onClick={onClick}
            className="bg-[#13131A] border border-white/6 rounded-2xl overflow-hidden hover:border-[#B8FF3C]/30 hover:shadow-xl hover:shadow-black/40 transition-all group cursor-pointer relative"
        >
            <div className="relative overflow-hidden aspect-[4/3]">
                <img src={recipe.image} alt={recipe.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-black/65 backdrop-blur-sm text-white text-xs font-black px-2.5 py-1 rounded-full">
                    <Flame size={10} className="text-[#B8FF3C]" /> {Math.round(recipe.calories)} kcal
                </div>
                <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-black/65 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-1 rounded-full">
                    <Clock size={9} className="text-slate-400" /> {recipe.readyInMinutes}m
                </div>

                {/* Favorite Button */}
                <button
                    onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(e); }}
                    className={`absolute bottom-2.5 right-2.5 p-2 rounded-xl backdrop-blur-md border transition-all ${isFavorite
                        ? 'bg-red-500/20 border-red-500/40 text-red-500'
                        : 'bg-black/40 border-white/10 text-white/60 hover:text-white hover:bg-black/60'
                        }`}
                >
                    <Heart size={14} fill={isFavorite ? "currentColor" : "none"} />
                </button>
            </div>
            <div className="p-3.5">
                <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="text-sm font-bold text-white leading-snug line-clamp-2 group-hover:text-[#B8FF3C] transition-colors">{recipe.title}</h3>
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                        <Star size={10} className="text-yellow-400 fill-yellow-400" />
                        <span className="text-[10px] text-slate-400 font-medium">{(recipe.rating || 4.5).toFixed(1)}</span>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                    {[
                        { val: `${Math.round(recipe.protein)}G`, label: "PROTEIN", color: "text-[#B8FF3C]" },
                        { val: `${Math.round(recipe.carbs)}G`, label: "CARBS", color: "text-orange-400" },
                        { val: `${Math.round(recipe.fat)}G`, label: "FATS", color: "text-yellow-400" },
                    ].map(({ val, label, color }) => (
                        <div key={label} className="bg-[#0A0A0F] rounded-xl py-2 text-center border border-white/5">
                            <div className={`text-xs font-black ${color}`}>{val}</div>
                            <div className="text-[9px] text-slate-600 uppercase tracking-wider font-bold mt-0.5">{label}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

import Modal from "@/components/ui/Modal";

// ── Main ──────────────────────────────────────────────────────────────────────
export default function RecipesPage() {
    const [mode, setMode] = useState<Mode>("bulk");
    const [search, setSearch] = useState("");
    const [activeFilters, setActiveFilters] = useState<FilterTag[]>([]);
    const [showFilters, setShowFilters] = useState(false);
    const [viewAll, setViewAll] = useState(false);

    // --- Data fetching state ---
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [totalResults, setTotalResults] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // --- Persistence States via Global Store ---
    const { 
        favoriteRecipes: globalFavorites, 
        toggleFavoriteRecipe, 
        mealPlan, 
        addPlannedMeal, 
        removePlannedMeal,
        toggleMealPlanEaten 
    } = useGlobalStore();

    // --- Tool States ---
    const [isRandomizing, setIsRandomizing] = useState(false);
    const [ingredientSearchOpen, setIngredientSearchOpen] = useState(false);
    const [mealPlannerOpen, setMealPlannerOpen] = useState(false);
    const [dietAnalysisOpen, setDietAnalysisOpen] = useState(false);

    // --- Detail state ---
    const [selectedRecipe, setSelectedRecipe] = useState<any | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [addingToDay, setAddingToDay] = useState<Recipe | null>(null);

    // --- Servings Prompt State ---
    const [servingsPrompt, setServingsPrompt] = useState<{ id: string, name: string } | null>(null);
    const [servingsInput, setServingsInput] = useState(1);

    const meta = MODE_META[mode];

    // --- Business Logic ---
    const toggleFavorite = (recipe: Recipe) => {
        toggleFavoriteRecipe(recipe);
    };

    const addToPlan = (recipe: Recipe, day: string) => {
        const newEntry: PlannedMeal = {
            id: Math.random().toString(36).substr(2, 9),
            recipe,
            day
        };
        addPlannedMeal(newEntry);
        setAddingToDay(null);
    };

    const removeFromPlan = (entryId: string) => {
        removePlannedMeal(entryId);
    };

    const toggleFilter = (tag: FilterTag) =>
        setActiveFilters(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

    const handleToggleEaten = (planId: string, currentCompleted: boolean, recipeName: string) => {
        if (!currentCompleted) {
            // Prompt for servings
            setServingsPrompt({ id: planId, name: recipeName });
            setServingsInput(1);
        } else {
            // Un-check immediately
            toggleMealPlanEaten(planId, 1);
        }
    };

    const confirmServings = () => {
        if (servingsPrompt) {
            toggleMealPlanEaten(servingsPrompt.id, servingsInput);
            setServingsPrompt(null);
        }
    };

    const handleToolClick = (toolId: string) => {
        switch (toolId) {
            case 'random': fetchRandomRecipe(); break;
            case 'lookup': setIngredientSearchOpen(true); break;
            case 'planner': setMealPlannerOpen(true); break;
            case 'analysis': setDietAnalysisOpen(true); break;
        }
    };

    const fetchRandomRecipe = async () => {
        setIsRandomizing(true);
        try {
            const params = new URLSearchParams({
                mode,
                filters: activeFilters.join(","),
                random: "true"
            });
            const res = await fetch(`/api/recipes?${params.toString()}`);
            const data = await res.json();
            if (res.ok) {
                setSelectedRecipe(data);
                setIsModalOpen(true);
            }
        } catch (err) {
            console.error("Random fetch failed", err);
        } finally {
            setIsRandomizing(false);
        }
    };

    const fetchRecipes = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                mode,
                filters: activeFilters.join(","),
                query: search,
            });
            const res = await fetch(`/api/recipes?${params.toString()}`);
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to load recipes");
            }

            setTotalResults(data.totalResults || 0);

            // Map API response to Recipe interface
            const mappedRecipes: Recipe[] = data.results.map((r: any) => ({
                id: r.id,
                title: r.title,
                image: r.image,
                calories: r.calories,
                protein: r.protein,
                carbs: r.carbs,
                fat: r.fat,
                readyInMinutes: r.readyInMinutes,
                rating: 4.5 + (Math.random() * 0.4),
                diets: r.diets || [],
            }));
            setRecipes(mappedRecipes);
        } catch (err: any) {
            setError(err.message || "Something went wrong");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [mode, activeFilters, search]);

    const fetchRecipeDetail = async (id: number) => {
        setDetailLoading(true);
        setIsModalOpen(true);
        try {
            const res = await fetch(`/api/recipes?id=${id}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to load recipe details");
            setSelectedRecipe(data);
        } catch (err: any) {
            console.error("Detail error:", err);
            setSelectedRecipe({ error: err.message });
        } finally {
            setDetailLoading(false);
        }
    };

    useEffect(() => {
        fetchRecipes();
    }, [fetchRecipes]);

    const displayed = viewAll ? recipes : recipes.slice(0, PAGE_SIZE_DEFAULT);

    const handleModeChange = (m: Mode) => { setMode(m); setViewAll(false); setActiveFilters([]); };
    const handleToggleFilter = (t: FilterTag) => { toggleFilter(t); setViewAll(false); };

    return (
        <div className="space-y-5 sm:space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                    <h1 className="text-xl sm:text-2xl font-black text-white">Recipes &amp; Nutrition Tools</h1>
                    <p className={`text-xs mt-0.5 font-medium ${meta.accentText}`}>{meta.desc}</p>
                </div>
                {/* Desktop search */}
                <div className="hidden sm:flex items-center gap-2 bg-[#13131A] border border-white/8 rounded-xl px-3 py-2 w-56">
                    <Search size={14} className="text-slate-500 flex-shrink-0" />
                    <input value={search} onChange={e => { setSearch(e.target.value); setViewAll(true); }}
                        placeholder="Don't search API limit exceeds.."
                        className="bg-transparent text-white text-xs placeholder-slate-600 outline-none flex-1 min-w-0" />
                    {search && <button onClick={() => setSearch("")}><X size={12} className="text-slate-500 hover:text-white" /></button>}
                </div>
            </div>

            {/* Mobile search */}
            <div className="flex sm:hidden items-center gap-2 bg-[#13131A] border border-white/8 rounded-xl px-3 py-2.5">
                <Search size={14} className="text-slate-500 flex-shrink-0" />
                <input value={search} onChange={e => { setSearch(e.target.value); setViewAll(true); }}
                    placeholder="Don't search API limit exceeds.."
                    className="bg-transparent text-white text-sm placeholder-slate-600 outline-none flex-1" />
                {search && <button onClick={() => setSearch("")}><X size={14} className="text-slate-500" /></button>}
            </div>

            {/* Mode toggle */}
            <div className="flex justify-center">
                <div className="inline-flex bg-[#13131A] border border-white/8 rounded-2xl p-1 gap-1">
                    {(["bulk", "cut"] as Mode[]).map(m => {
                        const active = mode === m;
                        const mm = MODE_META[m];
                        return (
                            <button key={m} onClick={() => handleModeChange(m)}
                                className={`px-7 sm:px-12 py-2.5 rounded-xl text-sm font-black transition-all ${active ? `${mm.accentBg} ${m === "cut" ? "text-[#0A0A0F]" : "text-white"} shadow-lg ${mm.shadow}` : "text-slate-400 hover:text-white"
                                    }`}>
                                {mm.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Mode badge */}
            <div className={`flex items-center justify-center gap-2 text-xs font-bold ${meta.accentText}`}>
                <span className={`w-2 h-2 rounded-full ${meta.accentBg} animate-pulse`} />
                {mode === "bulk" ? `Showing high-calorie bulk meals · ${recipes.length} recipes` : `Showing lean cut meals · ${recipes.length} recipes`}
            </div>

            {/* Tool shortcuts */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {TOOLS.map(tool => (
                    <button
                        key={tool.id}
                        onClick={() => handleToolClick(tool.id)}
                        className="bg-[#13131A] border border-white/6 p-4 rounded-2xl hover:border-[#B8FF3C]/30 transition-all group flex flex-col items-center gap-3 text-center"
                    >
                        <div className="p-3 bg-white/5 rounded-xl group-hover:bg-[#B8FF3C]/10 transition-colors">
                            <tool.icon size={20} className="text-slate-400 group-hover:text-[#B8FF3C] transition-colors" />
                        </div>
                        <span className="text-xs font-bold text-slate-400 group-hover:text-white transition-colors">{tool.label}</span>
                    </button>
                ))}
            </div>

            {/* Favorites Section (if any) */}
            {
                globalFavorites.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-base font-black text-white flex items-center gap-2">
                                <Heart size={18} className="text-red-500 fill-red-500" /> Favorites
                                <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full text-slate-500">{globalFavorites.length}</span>
                            </h2>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                            {globalFavorites.map(r => (
                                <RecipeCard
                                    key={r.id}
                                    recipe={r}
                                    onClick={() => fetchRecipeDetail(r.id)}
                                    isFavorite={true}
                                    onToggleFavorite={() => toggleFavorite(r)}
                                />
                            ))}
                        </div>
                    </div>
                )
            }

            {/* Weekly Plan Section (if any) */}
            {
                mealPlan.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-base font-black text-white flex items-center gap-2">
                                <CalendarDays size={18} className="text-[#B8FF3C]" /> Weekly Meal Plan
                                <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full text-slate-500">{mealPlan.length} Planned</span>
                            </h2>
                            <button onClick={() => setMealPlannerOpen(true)} className="text-[10px] text-[#B8FF3C] font-bold uppercase tracking-wider hover:underline">View Full Schedule</button>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                            {mealPlan.slice(0, 4).map((p: PlannedMeal) => (
                                <div key={p.id} className="relative group">
                                    <RecipeCard
                                        recipe={p.recipe}
                                        onClick={() => fetchRecipeDetail(p.recipe.id)}
                                        isFavorite={!!globalFavorites.find((f: Recipe) => f.id === p.recipe.id)}
                                        onToggleFavorite={() => toggleFavorite(p.recipe)}
                                    />
                                    <div className="absolute top-2 left-2 bg-[#B8FF3C] text-[#0A0A0F] text-[9px] font-black px-2 py-1 rounded-lg shadow-lg">
                                        {p.day.toUpperCase()}
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); removeFromPlan(p.id); }}
                                        className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )
            }

            {/* Recommended section */}
            <div>
                {/* Section header */}
                <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                    <h2 className="text-base font-black text-white">Recommended for your Goal</h2>
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Desktop filter chips */}
                        <div className="hidden sm:flex items-center gap-2 flex-wrap">
                            {FILTER_TAGS.map(tag => (
                                <button key={tag} onClick={() => handleToggleFilter(tag)}
                                    className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${activeFilters.includes(tag)
                                        ? "border-[#B8FF3C] bg-[#B8FF3C]/15 text-[#B8FF3C]"
                                        : "border-white/10 text-slate-400 hover:border-white/25 hover:text-white"
                                        }`}>{tag}</button>
                            ))}
                        </div>
                        {/* Mobile filter toggle */}
                        <button onClick={() => setShowFilters(v => !v)}
                            className={`sm:hidden flex items-center gap-1.5 text-xs font-bold border px-3 py-1.5 rounded-full transition-colors ${activeFilters.length > 0 ? "border-[#B8FF3C] text-[#B8FF3C] bg-[#B8FF3C]/10" : "border-white/10 text-slate-400"
                                }`}>
                            <Filter size={12} /> Filters {activeFilters.length > 0 && `(${activeFilters.length})`}
                        </button>
                        {/* View All / Show Less */}
                        {!loading && !error && recipes.length > PAGE_SIZE_DEFAULT && (
                            <button onClick={() => setViewAll(v => !v)}
                                className="text-xs text-[#B8FF3C] font-bold flex items-center gap-1 hover:text-[#d4ff6e] transition-colors">
                                {viewAll ? (
                                    <><ChevronLeft size={13} /> Show Less</>
                                ) : (
                                    <>View All ({recipes.length}) <ChevronRight size={13} /></>
                                )}
                            </button>
                        )}
                    </div>
                </div>

                {/* Mobile filter chips dropdown */}
                {showFilters && (
                    <div className="sm:hidden flex flex-wrap gap-2 mb-3 p-3 bg-[#13131A] border border-white/6 rounded-xl">
                        {FILTER_TAGS.map(tag => (
                            <button key={tag} onClick={() => handleToggleFilter(tag)}
                                className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${activeFilters.includes(tag)
                                    ? "border-[#B8FF3C] bg-[#B8FF3C]/15 text-[#B8FF3C]"
                                    : "border-white/10 text-slate-400"
                                    }`}>{tag}</button>
                        ))}
                        {activeFilters.length > 0 && (
                            <button onClick={() => setActiveFilters([])} className="text-xs text-red-400 font-bold px-3 py-1.5">Clear all</button>
                        )}
                    </div>
                )}

                {/* Active filters summary */}
                {activeFilters.length > 0 && (
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Active:</span>
                        {activeFilters.map(f => (
                            <span key={f} onClick={() => handleToggleFilter(f)}
                                className="flex items-center gap-1 text-[10px] text-[#B8FF3C] bg-[#B8FF3C]/10 border border-[#B8FF3C]/25 px-2 py-1 rounded-full cursor-pointer hover:bg-[#B8FF3C]/20 transition-colors font-bold">
                                {f} <X size={9} />
                            </span>
                        ))}
                        <button onClick={() => setActiveFilters([])} className="text-[10px] text-slate-500 hover:text-red-400 transition-colors font-bold">
                            Clear all
                        </button>
                    </div>
                )}

                {/* Recipe grid / States */}
                {error ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center bg-[#13131A] border border-red-500/10 rounded-2xl">
                        <AlertCircle size={32} className="text-red-500 mb-3" />
                        <p className="text-white font-bold mb-1">Could not load recipes</p>
                        <p className="text-slate-500 text-sm max-w-xs">{error}</p>
                        <button onClick={fetchRecipes}
                            className="flex items-center gap-2 mt-5 text-xs text-white font-bold border border-white/10 px-6 py-2.5 rounded-xl hover:bg-white/5 transition-colors">
                            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Retry
                        </button>
                    </div>
                ) : loading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        {Array.from({ length: viewAll ? 12 : 4 }).map((_, i) => <SkeletonCard key={i} />)}
                    </div>
                ) : displayed.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        {displayed.map(r => (
                            <RecipeCard key={r.id} recipe={r} onClick={() => fetchRecipeDetail(r.id)} />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center bg-[#13131A] border border-white/6 rounded-2xl">
                        <BookOpen size={32} className="text-slate-600 mb-3" />
                        <p className="text-white font-bold mb-1">No recipes match your filters</p>
                        <p className="text-slate-500 text-sm">Try removing some filters or switching modes.</p>
                        <div className="flex gap-2 mt-4">
                            {activeFilters.length > 0 && (
                                <button onClick={() => setActiveFilters([])}
                                    className="text-xs text-[#B8FF3C] font-bold border border-[#B8FF3C]/30 px-4 py-2 rounded-xl hover:bg-[#B8FF3C]/10 transition-colors">
                                    Clear filters
                                </button>
                            )}
                            <button onClick={() => handleModeChange(mode === "bulk" ? "cut" : "bulk")}
                                className="text-xs text-slate-400 font-bold border border-white/10 px-4 py-2 rounded-xl hover:bg-white/5 transition-colors">
                                Switch to {mode === "bulk" ? "Cut" : "Bulk"} Mode
                            </button>
                        </div>
                    </div>
                )}

                {/* View all / show less — bottom button */}
                {!loading && !error && recipes.length > PAGE_SIZE_DEFAULT && (
                    <button onClick={() => setViewAll(v => !v)}
                        className="w-full mt-4 flex items-center justify-center gap-2 bg-[#13131A] border border-white/8 text-slate-400 text-sm font-bold py-3 rounded-xl hover:text-white hover:border-white/15 transition-all">
                        {viewAll ? <><ChevronLeft size={15} /> Show Less</> : <>View All {recipes.length} Recipes <ChevronRight size={15} /></>}
                    </button>
                )}
            </div>

            {/* Bottom stats bar */}
            <div className="bg-[#13131A] border border-white/6 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex gap-6 sm:gap-10 flex-wrap">
                    <div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-0.5">Recipes Available</div>
                        <div className="text-2xl font-black text-white">{totalResults.toLocaleString()}</div>
                    </div>
                    <div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-0.5">Weekly Plan Progress</div>
                        <div className="text-2xl font-black text-[#B8FF3C]">
                            {mealPlan.length > 0 ? Math.min(Math.round((mealPlan.length / 21) * 100), 100) : 0}%
                        </div>
                    </div>
                    <div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-0.5">Current Mode</div>
                        <div className={`text-2xl font-black capitalize ${meta.accentText}`}>{mode}</div>
                    </div>
                </div>
                <button className="flex items-center gap-2 bg-[#0A0A0F] border border-white/10 text-white text-sm font-bold px-5 py-3 rounded-xl hover:bg-white/5 transition-colors self-stretch sm:self-auto justify-center">
                    <SlidersHorizontal size={15} /> Advanced Filter
                </button>
            </div>

            {/* Detail Modal */}
            <Modal
                open={isModalOpen}
                onClose={() => { setIsModalOpen(false); setSelectedRecipe(null); }}
                size="xl"
                title={selectedRecipe?.title || "Recipe Details"}
                className="max-h-[90vh] sm:max-h-[85vh] flex flex-col"
            >
                {detailLoading ? (
                    <div className="py-24 flex flex-col items-center justify-center gap-5">
                        <RefreshCw className="text-[#B8FF3C] animate-spin" size={40} />
                        <div className="text-center">
                            <p className="text-white font-black text-lg">Optimizing Macros...</p>
                            <p className="text-slate-500 text-sm mt-1">Fetching ingredients and instructions</p>
                        </div>
                    </div>
                ) : selectedRecipe?.error ? (
                    <div className="py-12 text-center bg-red-500/5 rounded-3xl border border-red-500/10 m-4">
                        <AlertCircle className="text-red-500 mx-auto mb-4" size={48} />
                        <h3 className="text-white font-black text-xl mb-2">Recipe sync failed</h3>
                        <p className="text-slate-400 text-sm mb-8 px-6">{selectedRecipe.error}</p>
                        <div className="flex justify-center gap-3 px-6">
                            <button onClick={() => fetchRecipeDetail(selectedRecipe.id)} className="flex-1 bg-white/10 text-white px-6 py-3 rounded-2xl text-sm font-black hover:bg-white/15 transition-all">Retry Sync</button>
                            <button onClick={() => setIsModalOpen(false)} className="flex-1 bg-white/5 text-slate-400 px-6 py-3 rounded-2xl text-sm font-black hover:text-white transition-all">Close</button>
                        </div>
                    </div>
                ) : selectedRecipe ? (
                    <div className="-m-6 p-6">
                        {/* Hero */}
                        <div className="relative h-60 sm:h-80 rounded-[2rem] overflow-hidden mb-8 border border-white/5">
                            <img
                                src={selectedRecipe.image}
                                alt={selectedRecipe.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80";
                                }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0F] via-transparent to-transparent" />
                            <div className="absolute bottom-6 left-6 right-6">
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {selectedRecipe.diets?.slice(0, 3).map((d: string) => (
                                        <span key={d} className="bg-[#B8FF3C] text-[#0A0A0F] text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg shadow-[#B8FF3C]/20">
                                            {d}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Quick Info */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
                            {[
                                { icon: Clock, val: `${selectedRecipe.readyInMinutes}m`, label: "PREP TIME" },
                                { icon: Flame, val: `${Math.round(selectedRecipe.nutrition.calories.amount)}`, label: "CALORIES" },
                                { icon: BarChart3, val: `${selectedRecipe.servings}`, label: "SERVINGS" },
                                { icon: Star, val: "4.8", label: "RATING" },
                            ].map(({ icon: Icon, val, label }) => (
                                <div key={label} className="bg-[#13131A] border border-white/5 rounded-3xl p-5 flex flex-col items-center text-center group hover:border-[#B8FF3C]/20 transition-all">
                                    <div className="w-10 h-10 bg-[#B8FF3C]/10 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                        <Icon size={20} className="text-[#B8FF3C]" />
                                    </div>
                                    <div className="text-xl font-black text-white">{val}</div>
                                    <div className="text-[9px] text-slate-500 font-bold tracking-widest uppercase mt-0.5">{label}</div>
                                </div>
                            ))}
                        </div>



                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                            {/* Left: Ingredients */}
                            <div className="lg:col-span-5 space-y-8">
                                <div>
                                    <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                                        <div className="w-2 h-5 bg-[#B8FF3C] rounded-full" />
                                        Ingredients
                                        <span className="text-[10px] text-slate-600 font-bold ml-auto">{selectedRecipe.extendedIngredients?.length || 0} ITEMS</span>
                                    </h3>
                                    <ul className="space-y-3">
                                        {selectedRecipe.extendedIngredients?.map((ing: any, idx: number) => (
                                            <li key={idx} className="flex items-start gap-4 bg-[#13131A] border border-white/5 p-4 rounded-2xl group hover:bg-white/[0.03] transition-colors">
                                                <div className="w-1.5 h-1.5 rounded-full bg-[#B8FF3C]/40 mt-2 flex-shrink-0 group-hover:bg-[#B8FF3C] transition-colors" />
                                                <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
                                                    <span className="text-white font-black mr-1">{Math.round(ing.amount)} {ing.unit}</span> {ing.name}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* Right: Instructions & Macros */}
                            <div className="lg:col-span-7 space-y-10">
                                {/* Macros Card */}
                                <div className="bg-gradient-to-br from-[#B8FF3C] to-[#d4ff6e] rounded-[2rem] p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl shadow-[#B8FF3C]/10 border border-white/20">
                                    <div className="flex gap-8 sm:gap-12 flex-1 justify-around sm:justify-start">
                                        {[
                                            { val: `${Math.round(selectedRecipe.nutrition.protein.amount)}g`, label: "Protein" },
                                            { val: `${Math.round(selectedRecipe.nutrition.carbs.amount)}g`, label: "Carbs" },
                                            { val: `${Math.round(selectedRecipe.nutrition.fat.amount)}g`, label: "Fats" },
                                        ].map(({ val, label }) => (
                                            <div key={label} className="text-center sm:text-left">
                                                <div className="text-2xl sm:text-3xl font-black text-[#0A0A0F]">{val}</div>
                                                <div className="text-[10px] font-black text-[#0A0A0F]/50 uppercase tracking-widest mt-1">{label}</div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="h-12 w-px bg-[#0A0A0F]/10 hidden lg:block" />
                                    <div className="text-center sm:text-right">
                                        <div className="text-xs font-black text-[#0A0A0F] mb-1">GOAL TARGET</div>
                                        <div className="bg-[#0A0A0F] text-[#B8FF3C] text-[9px] font-black px-3 py-1.5 rounded-full tracking-widest inline-block">
                                            {mode.toUpperCase()} MODE
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                                        <div className="w-2 h-5 bg-[#B8FF3C] rounded-full" />
                                        Instructions
                                    </h3>
                                    {selectedRecipe.analyzedInstructions?.[0]?.steps ? (
                                        <div className="space-y-6">
                                            {selectedRecipe.analyzedInstructions[0].steps.map((step: any) => (
                                                <div key={step.number} className="flex gap-5 group">
                                                    <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-[#13131A] border border-white/10 flex items-center justify-center text-xs font-black text-[#B8FF3C] group-hover:bg-[#B8FF3C] group-hover:text-[#0A0A0F] transition-all">
                                                        {step.number}
                                                    </div>
                                                    <p className="text-sm text-slate-400 leading-relaxed pt-2 group-hover:text-slate-300 transition-colors">{step.step}</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div
                                            className="text-sm text-slate-400 leading-relaxed prose prose-invert max-w-none bg-[#13131A] p-6 rounded-3xl border border-white/5"
                                            dangerouslySetInnerHTML={{ __html: selectedRecipe.instructions || selectedRecipe.summary }}
                                        />
                                    )}
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4 pt-6">
                                    {addingToDay === selectedRecipe ? (
                                        <div className="bg-[#13131A] border border-[#B8FF3C]/30 rounded-2xl p-4 mt-2 mb-2 animate-in fade-in slide-in-from-bottom-2">
                                            <div className="flex justify-between items-center mb-3">
                                                <span className="text-xs font-bold text-slate-300">Select Day</span>
                                                <button onClick={() => setAddingToDay(null)} className="text-slate-500 hover:text-white"><X size={14} /></button>
                                            </div>
                                            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                                                {DAYS.map(day => (
                                                    <button key={day} onClick={() => addToPlan(selectedRecipe, day)}
                                                        className="text-[10px] font-black py-2 rounded-xl border border-white/10 hover:border-[#B8FF3C]/50 hover:bg-[#B8FF3C]/10 transition-all">
                                                        {day.slice(0, 3)}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <button onClick={() => setAddingToDay(selectedRecipe)}
                                            className="flex-1 flex items-center justify-center gap-2 bg-[#B8FF3C] text-[#0A0A0F] px-4 py-3 rounded-2xl text-sm font-black hover:bg-[#d4ff6e] transition-all shadow-lg shadow-[#B8FF3C]/20 border border-[#B8FF3C]">
                                            <CalendarPlus size={16} /> Add to Plan
                                        </button>
                                    )}
                                    <button onClick={() => toggleFavorite({
                                        id: selectedRecipe.id,
                                        title: selectedRecipe.title,
                                        image: selectedRecipe.image,
                                        calories: Math.round(selectedRecipe.nutrition.calories.amount),
                                        protein: Math.round(selectedRecipe.nutrition.protein.amount),
                                        carbs: Math.round(selectedRecipe.nutrition.carbs.amount),
                                        fat: Math.round(selectedRecipe.nutrition.fat.amount),
                                        readyInMinutes: selectedRecipe.readyInMinutes,
                                        rating: 4.8,
                                        diets: selectedRecipe.diets || []
                                    })}
                                        className={`w-12 h-[46px] rounded-2xl flex items-center justify-center border transition-all ${!!globalFavorites.find((f: Recipe) => f.id === selectedRecipe.id)
                                            ? 'bg-red-500/10 border-red-500/30 text-red-500 tooltip-trigger relative'
                                            : 'bg-[#13131A] border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                                            }`}>
                                        <Heart size={16} fill={!!globalFavorites.find((f: Recipe) => f.id === selectedRecipe.id) ? "currentColor" : "none"} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}
            </Modal>

            {/* Day Selection Modal */}
            {addingToDay && (
                <Modal
                    open={!!addingToDay}
                    onClose={() => setAddingToDay(null)}
                    title="Plan this Meal"
                    size="md"
                    className="max-h-[80vh]"
                >
                    <div className="p-6 space-y-6">
                        <div className="flex gap-4 items-center bg-[#13131A] p-4 rounded-2xl border border-white/5">
                            <img src={addingToDay.image} className="w-16 h-16 rounded-xl object-cover" alt="" />
                            <div>
                                <div className="text-white font-bold text-sm line-clamp-1">{addingToDay.title}</div>
                                <div className="text-[#B8FF3C] text-[10px] font-black uppercase mt-1">Select Day</div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {DAYS.map(day => (
                                <button
                                    key={day}
                                    onClick={() => {
                                        if (addingToDay) {
                                            addToPlan(addingToDay, day);
                                        }
                                    }}
                                    className="bg-white/5 border border-white/10 text-white text-xs font-bold py-3 rounded-xl hover:bg-[#B8FF3C] hover:text-[#0A0A0F] hover:border-[#B8FF3C] transition-all"
                                >
                                    {day}
                                </button>
                            ))}
                        </div>
                    </div>
                </Modal>
            )}

            {/* Ingredient Lookup Modal */}
            <Modal
                open={ingredientSearchOpen}
                onClose={() => setIngredientSearchOpen(false)}
                title="Ingredient Lookup"
                size="md"
            >
                <IngredientLookupTool />
            </Modal>

            {/* Weekly Planner Modal */}
            <Modal
                open={mealPlannerOpen}
                onClose={() => setMealPlannerOpen(false)}
                title="Weekly Meal Planner"
                size="xl"
                className="max-h-[90vh]"
            >
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                        {DAYS.map(day => (
                            <div key={day} className="space-y-3">
                                <h4 className="text-[10px] font-black text-[#B8FF3C] uppercase tracking-widest text-center py-2 bg-[#B8FF3C]/5 rounded-lg border border-[#B8FF3C]/10">{day}</h4>
                                <div className="space-y-2">
                                        {mealPlan.filter(p => p.day === day).map(p => (
                                            <div key={p.id} className={`bg-[#13131A] p-2 rounded-xl border group relative transition-all ${p.completed ? 'border-emerald-500/50 opacity-70' : 'border-white/5'}`}>
                                                <img src={p.recipe.image} className="w-full h-20 object-cover rounded-lg mb-2" alt="" />
                                                <div className="text-[10px] text-white font-bold line-clamp-1 flex items-center gap-1">
                                                    {p.completed && <Check size={10} className="text-emerald-500 flex-shrink-0" />}
                                                    <span className={p.completed ? "line-through text-slate-400" : ""}>{p.recipe.title}</span>
                                                </div>
                                                <div className="mt-2 flex items-center justify-between">
                                                    <button 
                                                        onClick={() => handleToggleEaten(p.id, !!p.completed, p.recipe.title)}
                                                        className={`text-[9px] font-black px-2 py-1 rounded-md transition-all ${
                                                            p.completed 
                                                            ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' 
                                                            : 'bg-[#B8FF3C] text-[#0A0A0F] hover:bg-[#d4ff6e]'
                                                        }`}
                                                    >
                                                        {p.completed ? 'Undo' : 'Log Eaten'}
                                                    </button>
                                                </div>

                                                <button
                                                    onClick={() => removeFromPlan(p.id)}
                                                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                                >
                                                    <X size={10} />
                                                </button>
                                            </div>
                                        ))}
                                    {mealPlan.filter(p => p.day === day).length === 0 && (
                                        <div className="h-20 border-2 border-dashed border-white/5 rounded-xl flex items-center justify-center">
                                            <span className="text-[9px] text-slate-700 font-bold">EMPTY</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Servings Prompt Sub-Modal */}
                {servingsPrompt && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm rounded-3xl p-4">
                        <div className="bg-[#13131A] border border-[#B8FF3C]/20 p-6 rounded-2xl w-full max-w-sm space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
                            <h3 className="text-white font-black text-lg">Log as Eaten</h3>
                            <p className="text-slate-400 text-sm">How many servings of <strong className="text-white">{servingsPrompt.name}</strong> did you eat?</p>
                            
                            <div className="flex items-center justify-center gap-4 py-4">
                                <button onClick={() => setServingsInput(s => Math.max(0.5, s - 0.5))}
                                    className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                                    <Minus size={16} className="text-slate-300" />
                                </button>
                                <div className="text-3xl font-black text-[#B8FF3C] w-16 text-center">{servingsInput}</div>
                                <button onClick={() => setServingsInput(s => s + 0.5)}
                                    className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                                    <Plus size={16} className="text-slate-300" />
                                </button>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button onClick={() => setServingsPrompt(null)}
                                    className="flex-1 py-3 text-sm font-bold text-slate-400 border border-white/10 rounded-xl hover:bg-white/5 transition-all">Cancel</button>
                                <button onClick={confirmServings}
                                    className="flex-1 py-3 text-sm font-black text-[#0A0A0F] bg-[#B8FF3C] rounded-xl hover:bg-[#d4ff6e] transition-all shadow-lg shadow-[#B8FF3C]/20">Confirm</button>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}

function IngredientLookupTool() {
    const [q, setQ] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const search = async () => {
        if (!q) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/recipes?ingredient=${q}`);
            const data = await res.json();
            setResults(data.results || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex gap-2">
                <input
                    value={q}
                    onChange={e => setQ(e.target.value)}
                    placeholder="Search ingredient (e.g. apple)"
                    className="flex-1 bg-[#0A0A0F] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-[#B8FF3C]/30 transition-all font-medium"
                />
                <button onClick={search} className="bg-[#B8FF3C] text-[#0A0A0F] px-5 py-2.5 rounded-xl font-black text-sm hover:scale-105 transition-all active:scale-95 shadow-lg shadow-[#B8FF3C]/10">Search</button>
            </div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-3">
                        <RefreshCw className="text-[#B8FF3C] animate-spin" size={24} />
                        <span className="text-slate-500 text-xs font-bold">Scanning nutrients...</span>
                    </div>
                ) : results.length > 0 ? (
                    results.map((r: any) => (
                        <div key={r.id} className="flex items-center justify-between bg-[#13131A] p-3 rounded-xl border border-white/5 hover:border-white/10 transition-colors group">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg overflow-hidden bg-white/5">
                                    <img src={`https://spoonacular.com/cdn/ingredients_100x100/${r.image}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                </div>
                                <span className="text-white text-sm font-bold capitalize">{r.name}</span>
                            </div>
                            <button className="text-[10px] text-[#B8FF3C] font-black uppercase tracking-wider bg-[#B8FF3C]/10 px-3 py-1.5 rounded-lg border border-[#B8FF3C]/20 hover:bg-[#B8FF3C]/20 transition-all">Details</button>
                        </div>
                    ))
                ) : q && !loading ? (
                    <div className="text-center py-10 text-slate-600 text-xs font-medium">No ingredients found.</div>
                ) : (
                    <div className="text-center py-10 text-slate-600 text-xs font-medium">Search for an ingredient to view nutrition.</div>
                )}
            </div>
        </div>
    );
}
