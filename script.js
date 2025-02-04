const inputEl = document.getElementById("userInput");
const searchButton = document.getElementById("searchButton");
const recipeList = document.getElementById("recipeResults");
const myRecipesButton = document.getElementById("myRecipesButton");
const cuisineBtn = document.getElementById("cuisineBtn");

const options = {
    method: 'GET',
    headers: {
        'X-RapidAPI-Key': '25c699ff54msh434da319c653bbdp1fc1d3jsnf90a41af76ed',
        'X-RapidAPI-Host': 'spoonacular-recipe-food-nutrition-v1.p.rapidapi.com'
    }
};

inputEl.addEventListener('keydown', function(e){
    if (e.key === 'Enter') {
        e.preventDefault();
        searchButton.click();
    }
});

searchButton.addEventListener('click', searchRecipes);

function searchRecipes() {
    const userInput = encodeURIComponent(inputEl.value.trim());
    const recipeListUrl = `https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/complexSearch?query=${userInput}&instructionsRequired=true&number=25`;

    fetch(recipeListUrl, options)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(result => {
            console.log(result);
            displayResults(result.results);
        })
        .catch(error => {
            console.error(error);
        });
}

function displayResults(results) {
    // Clearing Old search results
    recipeList.innerHTML = '';

    results.forEach(recipe => {
        // console.log(recipe); 

        if (recipe && recipe.title && recipe.image) {
            const recipeDiv = document.createElement('div');
            recipeDiv.innerHTML = `
                <div class="card p-3">
                    <header class="card-header has-background-link has-text-white">
                        <p class="card-header-title has-text-white">${recipe.title}</p>
                    </header>
                    <div class="card-image">
                        <img class="recipeImage" src="${recipe.image}" alt="${recipe.title}" data-id="${recipe.id}">
                    </div>
                    <footer class="card-footer">
                        <button class="saveButton card-footer-item button is-info" value="${recipe.id}">Save</button>
                    </footer>
                </div>
            `;
            recipeList.appendChild(recipeDiv);

            const saveButton = recipeDiv.querySelector('.saveButton');
            const newImage = recipeDiv.querySelector('.recipeImage');

            saveButton.addEventListener('click', function(e) {
                console.log("Save button clicked");
                addRecipeToLocalStorage(recipe);
            });

            newImage.addEventListener('click', function(e) {
                const recipeID = e.target.dataset.id;
                fetchRecipeDetails(recipeID);
            });
        }
    });
}


function addRecipeToLocalStorage(recipe) {
    let allRecipes = JSON.parse(localStorage.getItem("savedRecipes")) || {};
    allRecipes[recipe.id] = recipe;
    localStorage.setItem("savedRecipes", JSON.stringify(allRecipes));
}

// function removeRecipeFromStorage(recipes, id) {
//     console.log(recipes[id])
// }

function loadRecipesFromLocal() {
    let allRecipes = JSON.parse(localStorage.getItem("savedRecipes")) || [];
    allRecipes.forEach(recipe => displayRecipe(recipe));
}

function fetchRecipeDetails(recipeID) {
    const recipeInfoUrl = `https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/${recipeID}/analyzedInstructions?stepBreakdown=true'`;
    const recipeDetailUrl = `https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/${recipeID}/information`;

    fetch(recipeInfoUrl, options)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(result => {
            // Clearing Old details
            document.getElementById("ingredientsList").innerHTML = '';
            document.getElementById("stepsList").innerHTML = '';

            // Retrieve the saved recipe from localStorage
            let allRecipes = JSON.parse(localStorage.getItem("savedRecipes")) || {};
            let recipe = allRecipes[recipeID];

            if (!recipe) {
                fetch(recipeDetailUrl, options)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }
                        return response.json();
                    })
                    .then(recipeDetail => {
                        document.getElementById("recipeTitle").innerText = recipeDetail.title;
                        document.getElementById("recipeImage").src = recipeDetail.image;
                    })
                    .catch(error => {
                        console.error(error);
                    });
            } else {
                document.getElementById("recipeTitle").innerText = recipe.title;
                document.getElementById("recipeImage").src = recipe.image;
            }

            let allIngredients = []

            result.forEach(item => {
                item.steps.forEach(step => {
                    // Adding steps to modal
                    let liStep = document.createElement("li");
                    liStep.innerText = step.step;
                    liStep.classList.add("p-1", "m-2")
                    document.getElementById("stepsList").appendChild(liStep);

                    step.ingredients.forEach(item => {

                        let ingredientNames = item.name
                        allIngredients.push(ingredientNames)
                        let recipeName = document.getElementById("recipeTitle").innerText
                        getRecipeCuisine(recipeName, allIngredients)

                        // Adding ingredients to modal
                        let liIngredient = document.createElement("li");
                        liIngredient.innerText = item.name;
                        liIngredient.classList.add("tag", "is-medium", "is-info", "p-2", "m-2")
                        document.getElementById("ingredientsList").appendChild(liIngredient);
                    })
                })
            })
            document.getElementById('recipeDetailsModal').classList.add('is-active');
        })
        .catch(error => {
            console.error(error);
        });
}

function getRecipeCuisine(name, ingredients) {
    const url = 'https://api.spoonacular.com/recipes/cuisine?apiKey=a83b5f63fa1d4c37a1ee15e60b50204f'
    const options = {
        method: 'POST',
        headers: {
            'content-type': 'application/x-www-form-urlencoded', 
        },
        body: new URLSearchParams({
		    ingredientList: ingredients,
		    title: name
	    })
        
    }
    fetch(url, options)
    .then(function (response) {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(function (data) {
        let recipeCuisines = data.cuisines
        cuisineBtn.addEventListener('click', function () {
            localStorage.setItem("savedCuisines", JSON.stringify(recipeCuisines));

            window.location.replace('./map.html');
        })
    })
}

document.getElementById('closeButton').addEventListener('click', function() {
    document.getElementById('recipeDetailsModal').classList.remove('is-active');
});


myRecipesButton.addEventListener('click', function() {
    recipeList.innerHTML = '';

    // Load all saved recipes from local storage
    let allRecipes = JSON.parse(localStorage.getItem("savedRecipes")) || {};
    
    // Convert object to array to use with displayResults function
    let recipeArray = Object.values(allRecipes);

    displayResults(recipeArray);
});

findRestaurantsBtn.addEventListener('click', function() {
    document.location.replace('./map.html')
})