// --- DOM Elements ---
// We select these elements once at the start so we can easily update the UI later.
const searchInput = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");
const mealsContainer = document.getElementById("meals");
const resultHeading = document.getElementById("result-heading");
const errorContainer = document.getElementById("error-container");
const mealDetails = document.getElementById("meals-details");
const mealDetailsContent = document.querySelector(".meal-details-content");
const backBtn = document.getElementById("back-btn");

// --- API Configuration ---
// The base endpoint for TheMealDB. Using constants makes the code easier to maintain.
const BASE_URL = "https://www.themealdb.com/api/json/v1/1/";
const SEARCH_URL = `${BASE_URL}search.php?s=`; // Endpoint for searching by name
const LOOKUP_URL = `${BASE_URL}lookup.php?i=`; // Endpoint for looking up a specific ID

// --- Event Listeners ---
// These "listen" for user actions (clicks/keypresses) and trigger the appropriate function.
searchBtn.addEventListener("click", searchMeals);

// We use "Event Delegation" here: we listen for clicks on the container, 
// then check if a specific meal card was clicked.
mealsContainer.addEventListener("click", handleMealClick);

// This listener resets the view back to the search results when "Back" is clicked.
backBtn.addEventListener("click", () => {
    mealDetails.classList.add("hidden");        // Hide the single recipe view
    mealsContainer.classList.remove("hidden");  // Show the search results grid
    resultHeading.classList.remove("hidden");   // Show the search heading
});

// Allows the user to simply press "Enter" in the input field to search.
searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") searchMeals();
});

// --- Core Functions ---

/**
 * searchMeals:
 * Gets the user input, fetches data from the API, and handles error states.
 */
async function searchMeals() {
    // .value gets the text the user typed; .trim() removes accidental white space.
    const searchTerm = searchInput.value.trim();

    // Check if the input is empty. If so, show a warning and stop the function.
    if (!searchTerm) {
        errorContainer.textContent = "Please enter a search term";
        errorContainer.classList.remove("hidden");
        return;
    }

    try {
        // UI Reset: Show a loading message and hide any previous errors or recipe details.
        resultHeading.textContent = `Searching for "${searchTerm}"...`;
        mealsContainer.innerHTML = "";
        errorContainer.classList.add("hidden");
        mealDetails.classList.add("hidden");

        // Use 'fetch' to call the API. 'await' ensures we wait for the network response.
        const response = await fetch(`${SEARCH_URL}${searchTerm}`);
        // Convert the raw response into a usable JavaScript object (JSON).
        const data = await response.json();

        // TheMealDB returns null if no match is found.
        if (data.meals === null) {
            resultHeading.textContent = "";
            errorContainer.textContent = `No recipes found for "${searchTerm}". Try another!`;
            errorContainer.classList.remove("hidden");
        } else {
            // If we found recipes, display the heading and pass the data to the display function.
            resultHeading.textContent = `Search results for "${searchTerm}":`;
            displayMeal(data.meals); 
            searchInput.value = ""; // Clear the input field for the next search
        }
    } catch (error) {
        // This catches network issues or server crashes.
        errorContainer.textContent = "Something went wrong. Please try again later.";
        errorContainer.classList.remove("hidden");
    }
}

/**
 * displayMeal:
 * Takes an array of meal objects and builds the HTML grid.
 */
function displayMeal(meals) {
    mealsContainer.innerHTML = ""; // Clear the grid before adding new cards

    meals.forEach((meal) => {
        // We use backticks (``) for Template Literals to inject variables directly into HTML.
        // The 'data-meal-id' attribute is vital; it stores the ID we need to fetch details later.
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

/**
 * handleMealClick:
 * Identifies which meal was clicked and fetches that specific recipe's data.
 */
async function handleMealClick(e) {
    // .closest finds the nearest parent with the 'meal' class, even if the user clicked the image inside it.
    const mealEl = e.target.closest(".meal");
    if (!mealEl) return; // Exit if the user clicked the background, not a card.

    const mealId = mealEl.getAttribute("data-meal-id");

    try {
        // Fetch the full details for the specific ID.
        const response = await fetch(`${LOOKUP_URL}${mealId}`);
        const data = await response.json();

        if (data.meals && data.meals[0]) {
            const meal = data.meals[0]; 
            const ingredients = [];

            // The API returns ingredients as individual keys (strIngredient1, strIngredient2, etc.).
            // We loop through all 20 possible slots to collect the ones that aren't empty.
            for (let i = 1; i <= 20; i++) {
                if (meal[`strIngredient${i}`] && meal[`strIngredient${i}`].trim() !== "") {
                    ingredients.push({
                        ingredient: meal[`strIngredient${i}`],
                        measure: meal[`strMeasure${i}`]
                    });
                }
            }

            // Once the data is processed, we call the render function to update the UI.
            renderMealDetails(meal, ingredients);
        }
    } catch (error) {
        console.error("Error fetching meal details:", error);
    }
}

/**
 * renderMealDetails:
 * Injects the full recipe data into the details section and swaps the view.
 */
function renderMealDetails(meal, ingredients) {
    // Build the recipe page HTML.
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
    
    // View Switcher: Hide the search results and show the recipe page.
    mealDetails.classList.remove("hidden");
    mealsContainer.classList.add("hidden");
    resultHeading.classList.add("hidden");
}
