// DOM Elements
const searchInput = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");
const mealsContainer = document.getElementById("meals");
const resultHeading = document.getElementById("result-heading");
const errorContainer = document.getElementById("error-container");
const mealDetails = document.getElementById("meals-details"); // Fixed ID to match HTML
const mealDetailsContent = document.querySelector(".meal-details-content");
const backBtn = document.getElementById("back-btn");

const BASE_URL = "https://www.themealdb.com/api/json/v1/1/";
const SEARCH_URL = `${BASE_URL}search.php?s=`;
const LOOKUP_URL = `${BASE_URL}lookup.php?i=`;

searchBtn.addEventListener("click", searchMeals);

// Fixed: Corrected curly braces and function name capitalization
mealsContainer.addEventListener("click", handleMealClick);

// Fixed: Logic to hide details and show search results again
backBtn.addEventListener("click", () => {
    mealDetails.classList.add("hidden");
    mealsContainer.classList.remove("hidden");
    resultHeading.classList.remove("hidden");
});

searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") searchMeals();
});

async function searchMeals() {
    // Fixed: changed ariaValueMax to value
    const searchTerm = searchInput.value.trim();

    if (!searchTerm) {
        errorContainer.textContent = "Please enter a search term";
        errorContainer.classList.remove("hidden");
        return;
    }

    try {
        resultHeading.textContent = `Searching for "${searchTerm}"...`;
        mealsContainer.innerHTML = "";
        errorContainer.classList.add("hidden");
        mealDetails.classList.add("hidden");

        // Fixed: Await the response and use the correct variable name
        const response = await fetch(`${SEARCH_URL}${searchTerm}`);
        const data = await response.json();

        if (data.meals === null) {
            resultHeading.textContent = "";
            errorContainer.textContent = `No recipes found for "${searchTerm}". Try another!`;
            errorContainer.classList.remove("hidden");
        } else {
            resultHeading.textContent = `Search results for "${searchTerm}":`;
            displayMeal(data.meals); // Fixed: data.meals instead of DataTransfer
            searchInput.value = "";
        }
    } catch (error) {
        errorContainer.textContent = "Something went wrong. Please try again later.";
        errorContainer.classList.remove("hidden");
    }
}

function displayMeal(meals) {
    mealsContainer.innerHTML = "";
    meals.forEach((meal) => {
        mealsContainer.innerHTML += `
            <div class="meal" data-meal-id="${meal.idMeal}">
                <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
                <div class="meal-info">
                    <h3 class="meal-title">${meal.strMeal}</h3>
                    ${meal.strCategory ? `<div class="meal-category">${meal.strCategory}</div>` : ""}
                </div>
            </div>
        `;
    });
}

async function handleMealClick(e) {
    const mealEl = e.target.closest(".meal");
    if (!mealEl) return;

    const mealId = mealEl.getAttribute("data-meal-id");

    try {
        // Fixed: Corrected template literal syntax (${} instead of $())
        const response = await fetch(`${LOOKUP_URL}${mealId}`);
        const data = await response.json();

        if (data.meals && data.meals[0]) {
            const meal = data.meals[0]; // Fixed: data.meals[0] instead of data - meals[0]
            const ingredients = [];

            for (let i = 1; i <= 20; i++) {
                // Fixed: Corrected string interpolation and property names
                if (meal[`strIngredient${i}`] && meal[`strIngredient${i}`].trim() !== "") {
                    ingredients.push({
                        ingredient: meal[`strIngredient${i}`],
                        measure: meal[`strMeasure${i}`]
                    });
                }
            }

            renderMealDetails(meal, ingredients);
        }
    } catch (error) {
        console.error("Error fetching meal details:", error);
    }
}

function renderMealDetails(meal, ingredients) {
    mealDetailsContent.innerHTML = `
        <img src="${meal.strMealThumb}" alt="${meal.strMeal}" class="meal-details-img">
        <h2 class="meal-details-title">${meal.strMeal}</h2>
        <div class="meal-details-category">
            <span>${meal.strCategory || "Uncategorized"}</span>
        </div>
        <div class="meal-details-instructions">
            <h3>Instructions</h3>
            <p>${meal.strInstructions}</p>
        </div>
        <div class="meal-details-ingredients">
            <h3>Ingredients</h3>
            <ul class="ingredients-list">
                ${ingredients.map(item => `
                    <li><i class="fas fa-check-circle"></i> ${item.measure} ${item.ingredient}</li>
                `).join("")}
            </ul>
        </div>
        ${meal.strYoutube ? `
            <a href="${meal.strYoutube}" target="_blank" class="youtube-link">
                <i class="fab fa-youtube"></i> Watch Video
            </a>
        ` : ""}
    `;
    
    // Switch views
    mealDetails.classList.remove("hidden");
    mealsContainer.classList.add("hidden");
    resultHeading.classList.add("hidden");
}
