'use client';

import { useState, useEffect } from 'react';
import { wgerApi, Workout, WorkoutDay, Setting, Exercise } from '@/lib/wgerApi';
import WorkoutCard from '@/components/workouts/WorkoutCard';
import DaySection, { DaySetting } from '@/components/workouts/DaySection';
import ExerciseBrowser from '@/components/workouts/ExerciseBrowser';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { Plus, ArrowLeft, Loader2, RefreshCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function WorkoutsPage() {
    // --- View State --- //
    const [view, setView] = useState<'list' | 'detail'>('list');
    const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);

    // --- Data State --- //
    const [workouts, setWorkouts] = useState<Workout[]>([]);
    const [days, setDays] = useState<WorkoutDay[]>([]);
    const [settings, setSettings] = useState<Record<number, DaySetting[]>>({}); // dayId -> Settings

    // --- UI State --- //
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDeletingWorkout, setIsDeletingWorkout] = useState<number | null>(null);
    const [isDeletingDay, setIsDeletingDay] = useState<number | null>(null);

    // --- Modal State --- //
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [newWorkoutName, setNewWorkoutName] = useState('');

    const [browserModalOpen, setBrowserModalOpen] = useState(false);
    const [activeDayIdForExercise, setActiveDayIdForExercise] = useState<number | null>(null);

    // Toast equivalent (simplified for this component, ideally use a context)
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    // --- Data Fetching --- //
    const loadWorkouts = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await wgerApi.fetchWorkouts();
            setWorkouts(res.results || []);
        } catch (err) {
            setError('Failed to load workouts. Please check your API key.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (view === 'list') {
            loadWorkouts();
        }
    }, [view]);

    // Load specific workout details (days and their exercises)
    const loadWorkoutDetails = async (workout: Workout) => {
        try {
            setLoading(true);
            setError(null);

            const resDays = await wgerApi.fetchWorkoutDays(workout.id);
            const fetchedDays = resDays.results || [];
            setDays(fetchedDays);

            // Fetch sets (exercises) for each day
            const newSettings: Record<number, DaySetting[]> = {};

            await Promise.all(
                fetchedDays.map(async (day) => {
                    const resSets = await wgerApi.fetchSetsForDay(day.id);
                    const sets = resSets.results || [];

                    // Hydrate sets with Exercise names (wger sets endpoint only gives ids)
                    // For a production app, we might want to batch this or use a local cache
                    const hydratedSets: DaySetting[] = await Promise.all(
                        sets.map(async (s) => {
                            try {
                                // Fetch basic exercise info. Alternatively just show "Loading..." lazily in the card.
                                const exId = Array.isArray(s.exercise) ? s.exercise[0] : s.exercise;
                                const ex = await wgerApi.fetchExerciseById(exId);
                                return {
                                    id: s.id,
                                    exercise: exId,
                                    sets: s.sets || 0, // In wger, sets are nested or separate. Using a generic 'sets' for UI
                                    exerciseName: ex.name,
                                };
                            } catch {
                                const exId = Array.isArray(s.exercise) ? s.exercise[0] : s.exercise;
                                return { id: s.id, exercise: exId, sets: 0, exerciseName: 'Unknown Exercise' };
                            }
                        })
                    );

                    newSettings[day.id] = hydratedSets;
                })
            );

            setSettings(newSettings);
            setSelectedWorkout(workout);
            setView('detail');
        } catch (err) {
            setError('Failed to load workout details.');
            showToast('Error loading details', 'error');
        } finally {
            setLoading(false);
        }
    };

    // --- Handlers --- //
    const handleCreateWorkout = async () => {
        if (!newWorkoutName.trim()) return;
        try {
            await wgerApi.createWorkout({ description: newWorkoutName });
            showToast('Workout created successfully!');
            setCreateModalOpen(false);
            setNewWorkoutName('');
            loadWorkouts();
        } catch (err) {
            showToast('Failed to create workout', 'error');
        }
    };

    const handleDeleteWorkout = async (id: number) => {
        if (!confirm('Are you sure you want to delete this workout?')) return;
        try {
            setIsDeletingWorkout(id);
            await wgerApi.deleteWorkout(id);
            setWorkouts(w => w.filter(wk => wk.id !== id));
            showToast('Workout deleted');
        } catch (err) {
            showToast('Failed to delete workout', 'error');
        } finally {
            setIsDeletingWorkout(null);
        }
    };

    const handleAddDay = async () => {
        if (!selectedWorkout) return;
        try {
            const newDay = await wgerApi.createWorkoutDay({
                training: selectedWorkout.id,
                description: `Day ${days.length + 1}`
            });
            setDays([...days, newDay]);
            setSettings({ ...settings, [newDay.id]: [] });
            showToast('Day added');
        } catch (err) {
            showToast('Failed to add day', 'error');
        }
    };

    const handleDeleteDay = async (dayId: number) => {
        try {
            setIsDeletingDay(dayId);
            await wgerApi.deleteWorkoutDay(dayId);
            setDays(days.filter(d => d.id !== dayId));
            const newSettings = { ...settings };
            delete newSettings[dayId];
            setSettings(newSettings);
            showToast('Day deleted');
        } catch (err) {
            showToast('Failed to delete day', 'error');
        } finally {
            setIsDeletingDay(null);
        }
    };

    const openExerciseBrowser = (dayId: number) => {
        setActiveDayIdForExercise(dayId);
        setBrowserModalOpen(true);
    };

    const handleAddExerciseToDay = async (exerciseId: number) => {
        if (!activeDayIdForExercise) return;
        try {
            const newSet = await wgerApi.createSet({
                day: activeDayIdForExercise,
                exercise: [exerciseId],
                sets: 3 // Default
            });

            const exDetails = await wgerApi.fetchExerciseById(exerciseId);

            const hydratedSet: DaySetting = {
                id: newSet.id,
                exercise: exerciseId,
                sets: 3,
                exerciseName: exDetails.name
            };

            setSettings(prev => ({
                ...prev,
                [activeDayIdForExercise]: [...(prev[activeDayIdForExercise] || []), hydratedSet]
            }));

            setBrowserModalOpen(false);
            showToast('Exercise added');
        } catch (err) {
            showToast('Failed to add exercise', 'error');
        }
    };

    const handleRemoveExercise = async (setId: number, dayId: number) => {
        try {
            await wgerApi.deleteSet(setId);
            setSettings(prev => ({
                ...prev,
                [dayId]: prev[dayId].filter(s => s.id !== setId)
            }));
            showToast('Removed exercise');
        } catch (err) {
            showToast('Failed to remove exercise', 'error');
        }
    };

    // --- Views --- //
    const renderList = () => (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex flex-col gap-6"
        >
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-100 uppercase tracking-wider">Your <span className="text-[#B8FF3C] neon-text">Workouts</span></h1>
                    <p className="text-slate-400 mt-2">Manage your training regimens.</p>
                </div>
                <Button onClick={() => setCreateModalOpen(true)} className="shadow-[0_0_15px_rgba(184,255,60,0.3)]">
                    <Plus size={18} className="mr-2" /> New Workout
                </Button>
            </div>

            {error ? (
                <div className="p-6 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-center">
                    <p>{error}</p>
                    <Button variant="outline" className="mt-4 border-red-500 text-red-400 hover:bg-red-500/10" onClick={loadWorkouts}>
                        <RefreshCcw size={16} className="mr-2" /> Retry
                    </Button>
                </div>
            ) : loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-[180px] rounded-2xl bg-slate-800/50 animate-pulse border border-slate-700/50" />
                    ))}
                </div>
            ) : workouts.length === 0 ? (
                <div className="py-20 text-center flex flex-col items-center justify-center bg-slate-900 border border-slate-800 rounded-3xl">
                    <div className="w-20 h-20 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-6 border border-cyan-500/20">
                        <Plus size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-200">No workouts found</h3>
                    <p className="text-slate-500 max-w-md mt-2">Create your first workout program to start tracking your gains.</p>
                    <Button className="mt-6" onClick={() => setCreateModalOpen(true)}>Create Workout</Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {workouts.map(workout => (
                        <WorkoutCard
                            key={workout.id}
                            id={workout.id}
                            name={workout.description || `Workout ${workout.id}`}
                            date={workout.creation_date}
                            onView={() => loadWorkoutDetails(workout)}
                            onDelete={handleDeleteWorkout}
                            isDeleting={isDeletingWorkout === workout.id}
                        />
                    ))}
                </div>
            )}
        </motion.div>
    );

    const renderDetail = () => (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col gap-6"
        >
            <div className="flex gap-4 items-center">
                <Button variant="ghost" className="px-3" onClick={() => setView('list')}>
                    <ArrowLeft size={20} />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-100">{selectedWorkout?.description || `Workout ${selectedWorkout?.id}`}</h1>
                    <p className="text-slate-400 text-sm">Created {new Date(selectedWorkout?.creation_date || '').toLocaleDateString()}</p>
                </div>
            </div>

            <div className="flex justify-between items-center mt-4">
                <h2 className="text-lg font-semibold text-cyan-400 uppercase tracking-widest text-sm">Training Days</h2>
                <Button variant="outline" size="sm" onClick={handleAddDay}>
                    <Plus size={16} className="mr-2" /> Add Day
                </Button>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <Loader2 size={40} className="text-cyan-500 animate-spin" />
                </div>
            ) : days.length === 0 ? (
                <div className="py-12 text-center text-slate-500 glass-panel rounded-2xl border-dashed border-slate-700">
                    No days configured. Add a day to start inserting exercises.
                </div>
            ) : (
                <div className="flex flex-col gap-6">
                    {days.map(day => (
                        <DaySection
                            key={day.id}
                            id={day.id}
                            description={day.description}
                            settings={settings[day.id] || []}
                            onAddExercise={() => openExerciseBrowser(day.id)}
                            onRemoveExercise={(setId) => handleRemoveExercise(setId, day.id)}
                            onDeleteDay={handleDeleteDay}
                            isDeletingDay={isDeletingDay === day.id}
                        />
                    ))}
                </div>
            )}
        </motion.div>
    );

    return (
        <div className="min-h-screen bg-[#0A0A0F] pt-24 pb-12 px-4 sm:px-6 lg:px-8 custom-scrollbar">
            <div className="max-w-6xl mx-auto">
                <AnimatePresence mode="wait">
                    {view === 'list' ? renderList() : renderDetail()}
                </AnimatePresence>
            </div>

            {/* --- Modals --- */}

            <Modal open={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Create New Workout">
                <div className="flex flex-col gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Workout Name</label>
                        <input
                            type="text"
                            value={newWorkoutName}
                            onChange={e => setNewWorkoutName(e.target.value)}
                            placeholder="e.g. Push Pull Legs"
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-[#B8FF3C] focus:ring-1 focus:ring-[#B8FF3C] transition-colors"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleCreateWorkout()}
                        />
                    </div>
                    <Button fullWidth onClick={handleCreateWorkout} disabled={!newWorkoutName.trim()}>
                        Create
                    </Button>
                </div>
            </Modal>

            <Modal open={browserModalOpen} onClose={() => setBrowserModalOpen(false)} title="Select Exercise" size="lg">
                <ExerciseBrowser onSelect={handleAddExerciseToDay} />
            </Modal>

            {/* --- Toasty --- */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.9 }}
                        className={`fixed bottom-6 right-6 px-6 py-3 rounded-xl shadow-2xl glass-panel text-white font-medium z-50 ${toast.type === 'error' ? 'border-red-500/50 bg-red-500/10' : 'border-[#B8FF3C]/50 bg-[#B8FF3C]/10 text-[#B8FF3C]'
                            }`}
                    >
                        {toast.message}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
