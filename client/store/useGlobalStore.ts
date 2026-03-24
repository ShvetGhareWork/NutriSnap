import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { IMemberProfile, IMealLog } from '@/types';

export interface Recipe {
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

export interface PlannedMeal {
    id: string;
    recipe: Recipe;
    day: string;
    completed?: boolean;
    eatenAt?: string;
    servings?: number;
}

export interface CompletedRecipe {
    id: string;
    recipe: Recipe;
    date: string; // ISO date string or YYYY-MM-DD
    servings: number;
    nutritionSnapshot: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
    }
}

export interface WaterLogEntry {
    date: string;
    amount: number;
}

export interface Reminder {
    id: string;
    time: string; // HH:mm
    message: string;
}

export interface WeeklyHistoryData {
    day: string;
    cal: number;
    pro: number;
}

interface GlobalStoreState {
    user: IMemberProfile | null;
    foodLog: IMealLog[];
    completedRecipes: CompletedRecipe[];
    mealPlan: PlannedMeal[];
    waterLog: WaterLogEntry[];
    reminders: Reminder[];
    recipes: Recipe[];
    favoriteRecipes: Recipe[];
    weeklyHistory: WeeklyHistoryData[];

    // Actions
    setUser: (user: IMemberProfile | null) => void;
    
    // Food Log
    setFoodLog: (logs: IMealLog[]) => void;
    addFoodLog: (log: IMealLog) => void;
    updateFoodLog: (id: string, log: IMealLog) => void;
    deleteFoodLog: (id: string) => void;

    // Completed Recipes
    addCompletedRecipe: (recipe: CompletedRecipe) => void;
    removeCompletedRecipe: (id: string) => void;
    
    // Favorites
    toggleFavoriteRecipe: (recipe: Recipe) => void;

    // Meal Plan
    setMealPlan: (plan: PlannedMeal[]) => void;
    addPlannedMeal: (meal: PlannedMeal) => void;
    removePlannedMeal: (id: string) => void;
    toggleMealPlanEaten: (id: string, servings: number) => void;

    // Water
    addWater: (amount: number) => void;

    // Reminders
    addReminder: (reminder: Reminder) => void;
    removeReminder: (id: string) => void;

    // Daily totals calculated from foodLog and completedRecipes for a given date
    getDailyTotals: (dateStr: string) => { calories: number; protein: number; carbs: number; fat: number };
    
    // Auth
    clearStore: () => void;
}

export const useGlobalStore = create<GlobalStoreState>()(
    persist(
        (set, get) => ({
            user: null,
            foodLog: [],
            completedRecipes: [],
            mealPlan: [],
            waterLog: [],
            reminders: [],
            recipes: [],
            favoriteRecipes: [],
            // Mock weekly history that can be overridden by an action if necessary later
            weeklyHistory: [
                { day: "MON", cal: 1750, pro: 110 }, { day: "TUE", cal: 2100, pro: 128 }, { day: "WED", cal: 1900, pro: 155 },
                { day: "THU", cal: 2300, pro: 168 }, { day: "FRI", cal: 1600, pro: 130 }, { day: "SAT", cal: 2050, pro: 142 }, { day: "SUN", cal: 1840, pro: 145 },
            ],

            setUser: (user) => set({ user }),
            
            clearStore: () => set({
                user: null, foodLog: [], completedRecipes: [],
                mealPlan: [], waterLog: [], reminders: [],
                recipes: [], favoriteRecipes: []
            }),
            
            setFoodLog: (logs) => set({ foodLog: logs }),
            addFoodLog: (log) => set((state) => ({ foodLog: [...state.foodLog, log] })),
            updateFoodLog: (id, updatedLog) => set((state) => ({
                foodLog: state.foodLog.map(log => log._id === id ? updatedLog : log)
            })),
            deleteFoodLog: (id) => set((state) => ({
                foodLog: state.foodLog.filter(log => log._id !== id)
            })),

            addCompletedRecipe: (recipe) => set((state) => ({ completedRecipes: [...state.completedRecipes, recipe] })),
            removeCompletedRecipe: (id) => set((state) => ({ completedRecipes: state.completedRecipes.filter(r => r.id !== id) })),

            toggleFavoriteRecipe: (recipe) => set((state) => {
                const exists = state.favoriteRecipes.find(r => r.id === recipe.id);
                if (exists) {
                    return { favoriteRecipes: state.favoriteRecipes.filter(r => r.id !== recipe.id) };
                }
                return { favoriteRecipes: [...state.favoriteRecipes, recipe] };
            }),

            setMealPlan: (mealPlan) => set({ mealPlan }),
            addPlannedMeal: (meal) => set((state) => ({ mealPlan: [...state.mealPlan, meal] })),
            removePlannedMeal: (id) => set((state) => ({ mealPlan: state.mealPlan.filter(p => p.id !== id) })),
            
            toggleMealPlanEaten: (id, servings) => set((state) => {
                const meal = state.mealPlan.find(p => p.id === id);
                if (!meal) return state;

                const isCurrentlyCompleted = !!meal.completed;

                // Use current date locally formatting as YYYY-MM-DD reliably
                const now = new Date();
                const yyyy = now.getFullYear();
                const mm = String(now.getMonth() + 1).padStart(2, '0');
                const dd = String(now.getDate()).padStart(2, '0');
                const today = `${yyyy}-${mm}-${dd}`;

                const newMealPlan = state.mealPlan.map(p => {
                    if (p.id === id) {
                        return {
                            ...p,
                            completed: !isCurrentlyCompleted,
                            eatenAt: !isCurrentlyCompleted ? new Date().toISOString() : undefined,
                            servings: !isCurrentlyCompleted ? servings : undefined
                        };
                    }
                    return p;
                });

                let newCompletedRecipes = [...state.completedRecipes];

                if (!isCurrentlyCompleted) {
                    // Un-checked -> Checked: Add to completed recipes
                    // Helper to extract numeric value whether it's a number directly, or an object { amount: number }
                    const getMacro = (macroName: 'calories' | 'protein' | 'carbs' | 'fat') => {
                        const direct = meal.recipe[macroName];
                        if (typeof direct === 'number') return direct;
                        
                        const nested = (meal.recipe as any).nutrition?.[macroName];
                        if (typeof nested === 'number') return nested;
                        if (nested && typeof nested.amount === 'number') return nested.amount;
                        
                        return 0;
                    };

                    newCompletedRecipes.push({
                        id: `cr_${meal.id}`,
                        recipe: meal.recipe,
                        date: today,
                        servings: servings,
                        nutritionSnapshot: {
                            calories: getMacro('calories') * servings,
                            protein: getMacro('protein') * servings,
                            carbs: getMacro('carbs') * servings,
                            fat: getMacro('fat') * servings
                        }
                    });
                } else {
                    // Checked -> Un-checked: Remove from completed recipes
                    newCompletedRecipes = newCompletedRecipes.filter(cr => cr.id !== `cr_${meal.id}`);
                }

                // Today's totals automatically update since getDailyTotals computes them on the fly

                return {
                    mealPlan: newMealPlan,
                    completedRecipes: newCompletedRecipes
                };
            }),

            addWater: (amount) => set((state) => {
                const now = new Date();
                const yyyy = now.getFullYear();
                const mm = String(now.getMonth() + 1).padStart(2, '0');
                const dd = String(now.getDate()).padStart(2, '0');
                const today = `${yyyy}-${mm}-${dd}`;
                
                const existingEntry = state.waterLog.find(w => w.date === today);
                let newWaterLog;

                if (existingEntry) {
                    newWaterLog = state.waterLog.map(w => w.date === today ? { ...w, amount: w.amount + amount } : w);
                } else {
                    newWaterLog = [...state.waterLog, { date: today, amount }];
                }
                
                return { waterLog: newWaterLog };
            }),

            addReminder: (reminder) => set((state) => ({ reminders: [...state.reminders, reminder] })),
            removeReminder: (id) => set((state) => ({ reminders: state.reminders.filter(r => r.id !== id) })),

            getDailyTotals: (dateStr) => {
                const state = get();
                
                let calories = 0;
                let protein = 0;
                let carbs = 0;
                let fat = 0;

                // Sum food logs
                // Assuming date is stored as YYYY-MM-DD or ISO string
                state.foodLog.filter(f => {
                    if (!f.date) return false;
                    
                    let createdAtMatches = false;
                    if (f.createdAt) {
                        const dateObj = new Date(f.createdAt);
                        if (!isNaN(dateObj.getTime())) {
                            createdAtMatches = dateObj.toISOString().startsWith(dateStr);
                        }
                    }
                    
                    return f.date.startsWith(dateStr) || createdAtMatches;
                }).forEach(log => {
                    calories += log.total_calories || 0;
                    protein += log.total_protein || 0;
                    carbs += log.total_carbs || 0;
                    fat += log.total_fat || 0;
                });

                // Sum completed recipes
                state.completedRecipes.filter(cr => cr.date === dateStr).forEach(cr => {
                    calories += cr.nutritionSnapshot.calories || 0;
                    protein += cr.nutritionSnapshot.protein || 0;
                    carbs += cr.nutritionSnapshot.carbs || 0;
                    fat += cr.nutritionSnapshot.fat || 0;
                });

                return { calories, protein, carbs, fat };
            }
        }),
        {
            name: 'nutrisnap-global-store', // Key used in localStorage
        }
    )
);
