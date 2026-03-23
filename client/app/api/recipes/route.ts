import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode") || "bulk";
    const filters = searchParams.get("filters")?.split(",") || [];
    const page = parseInt(searchParams.get("page") || "0");
    const query = searchParams.get("query") || "";

    const apiKey = process.env.SPOONACULAR_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: "SPOONACULAR_API_KEY missing" }, { status: 500 });
    }

    const id = searchParams.get("id");
    const isRandom = searchParams.get("random") === "true";

    if (isRandom) {
        try {
            // Map mode/filters to tags for random endpoint
            const tags = [];
            if (mode === "cut") tags.push("healthy");
            if (mode === "bulk") tags.push("main course");
            if (filters.includes("Vegan")) tags.push("vegan");
            if (filters.includes("Indian")) tags.push("indian");

            const randomRes = await fetch(
                `https://api.spoonacular.com/recipes/random?apiKey=${apiKey}&number=1&tags=${tags.join(",")}`,
                { cache: "no-store" }
            );
            if (!randomRes.ok) throw new Error(`Spoonacular Random error: ${randomRes.status}`);
            const randomData = await randomRes.json();
            const r = randomData.recipes[0];
            
            // Shape just like the detail response for the modal
            return NextResponse.json({
                id: r.id,
                title: r.title,
                image: r.image || "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80",
                summary: r.summary,
                instructions: r.instructions,
                analyzedInstructions: r.analyzedInstructions,
                extendedIngredients: r.extendedIngredients || [],
                readyInMinutes: r.readyInMinutes || 0,
                servings: r.servings || 1,
                nutrition: {
                    calories: { amount: 0, unit: "kcal" }, // Random endpoint doesn't return full nutrition by default
                    protein: { amount: 0, unit: "g" },
                    fat: { amount: 0, unit: "g" },
                    carbs: { amount: 0, unit: "g" },
                },
                diets: r.diets || [],
            });
        } catch (error: any) {
            console.error("Random API error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
    }

    const ingredientQuery = searchParams.get("ingredient");
    const ingredientId = searchParams.get("ingredientId");

    if (ingredientId) {
        try {
            const res = await fetch(
                `https://api.spoonacular.com/food/ingredients/${ingredientId}/information?amount=100&unit=g&apiKey=${apiKey}`,
                { cache: "no-store" }
            );
            if (!res.ok) throw new Error(`Spoonacular Ingredient Detail error: ${res.status}`);
            const data = await res.json();
            return NextResponse.json(data);
        } catch (error: any) {
            console.error("Ingredient Detail API error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
    }

    if (ingredientQuery) {
        try {
            const res = await fetch(
                `https://api.spoonacular.com/food/ingredients/search?apiKey=${apiKey}&query=${ingredientQuery}&number=8`,
                { cache: "no-store" }
            );
            if (!res.ok) throw new Error(`Spoonacular Ingredient error: ${res.status}`);
            const data = await res.json();
            return NextResponse.json(data);
        } catch (error: any) {
            console.error("Ingredient API error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
    }

    if (id) {
        // --- Detail view for a specific recipe ---
        try {
            const detailRes = await fetch(
                `https://api.spoonacular.com/recipes/${id}/information?apiKey=${apiKey}&includeNutrition=true`,
                { cache: "no-store" }
            );

            if (!detailRes.ok) throw new Error(`Spoonacular Detail error: ${detailRes.status}`);
            const data = await detailRes.json();

            const nutrition = data.nutrition?.nutrients || [];
            const getNutrient = (name: string) => {
                const n = nutrition.find((n: any) => n.name === name);
                return n ? { amount: Math.round(n.amount), unit: n.unit } : { amount: 0, unit: "g" };
            };

            return NextResponse.json({
                id: data.id,
                title: data.title,
                image: data.image || "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80",
                summary: data.summary,
                instructions: data.instructions,
                analyzedInstructions: data.analyzedInstructions,
                extendedIngredients: data.extendedIngredients || [],
                readyInMinutes: data.readyInMinutes || 0,
                servings: data.servings || 1,
                nutrition: {
                    calories: getNutrient("Calories"),
                    protein: getNutrient("Protein"),
                    fat: getNutrient("Fat"),
                    carbs: getNutrient("Carbohydrates"),
                },
                diets: data.diets || [],
            });
        } catch (error: any) {
            console.error("Detail API error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
    }

    // ── Mapping mode ──
    // cut  → maxCalories: 500, minProtein: 25
    // bulk → minCalories: 600, minProtein: 35
    let minCalories, maxCalories, minProtein;
    if (mode === "cut") {
        maxCalories = 500;
        minProtein = 25;
    } else {
        minCalories = 600;
        minProtein = 35;
    }

    // ── Mapping filters ──
    // highProtein → minProtein: 30
    // under30     → maxReadyTime: 30
    // lowCarb     → maxCarbs: 20
    // vegan       → diet: vegan
    // highCalorie → minCalories: 600
    // Indian      → cuisine: indian
    let maxReadyTime, maxCarbs, diet, cuisine;
    if (filters.includes("High Protein")) minProtein = Math.max(minProtein || 0, 30);
    if (filters.includes("Under 30 mins")) maxReadyTime = 30;
    if (filters.includes("Low Carb")) maxCarbs = 20;
    if (filters.includes("Vegan")) diet = "vegan";
    if (filters.includes("High Calorie")) minCalories = Math.max(minCalories || 0, 600);
    if (filters.includes("Indian")) cuisine = "indian";

    const params = new URLSearchParams({
        apiKey,
        query,
        addRecipeNutrition: "true",
        number: "40",
        offset: (page * 40).toString(),
        fillIngredients: "false",
    });

    if (minCalories) params.append("minCalories", minCalories.toString());
    if (maxCalories) params.append("maxCalories", maxCalories.toString());
    if (minProtein) params.append("minProtein", minProtein.toString());
    if (maxReadyTime) params.append("maxReadyTime", maxReadyTime.toString());
    if (maxCarbs) params.append("maxCarbs", maxCarbs.toString());
    if (diet) params.append("diet", diet);
    if (cuisine) params.append("cuisine", cuisine);

    try {
        const response = await fetch(
            `https://api.spoonacular.com/recipes/complexSearch?${params.toString()}`,
            { cache: "no-store" }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Spoonacular API error (${response.status}):`, errorText);
            throw new Error(`Spoonacular API error: ${response.status}`);
        }

        const data = await response.json();

        // ── Shape the data ──
        const shapedRecipes = data.results.map((r: any) => {
            const nutrients = r.nutrition?.nutrients || [];
            const getNutrient = (name: string) => Math.round(nutrients.find((n: any) => n.name === name)?.amount || 0);

            return {
                id: r.id,
                title: r.title,
                image: r.image,
                readyInMinutes: r.readyInMinutes,
                calories: getNutrient("Calories"),
                protein: getNutrient("Protein"),
                carbs: getNutrient("Carbohydrates"),
                fat: getNutrient("Fat"),
                diets: r.diets || [],
                tags: [...(r.diets || []), ...(r.dishTypes || [])],
            };
        });

        return NextResponse.json({ 
            results: shapedRecipes,
            totalResults: data.totalResults 
        }, { status: 200 });
    } catch (error: any) {
        console.error("Recipe API error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
