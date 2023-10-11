import { async } from 'regenerator-runtime';
import { API_URL } from './config';
import { AJAX } from './helpers';
import { RES_PER_PAGE } from './config';
import { KEY } from './config';

export const state = {
  recipe: {},
  search: {
    query: '',
    results: [],
    resultsPerPage: RES_PER_PAGE,
    page: 1,
  },
  bookmarks: [],
};

const createRecipeObject = function (data) {
  const { recipe } = data.data;

  return {
    id: recipe.id,
    cookingTime: recipe.cooking_time,
    publisher: recipe.publisher,
    servings: recipe.servings,
    title: recipe.title,
    image: recipe.image_url,
    sourceUrl: recipe.source_url,
    ingredients: recipe.ingredients,
    ...(recipe.key && { key: recipe.key }),
  };
};

export const loadRecipe = async function (id) {
  try {
    const data = await AJAX(`${API_URL}/${id}?key=${KEY}`);

    state.recipe = createRecipeObject(data);

    if (state.bookmarks.some(bookmark => bookmark.id === id))
      state.recipe.bookmarked = true;
    else state.recipe.bookmarked = false;

    console.log(state.recipe);
  } catch (error) {
    console.error(`${error} 🔴🔴🔴🔴🔴🔴`);
    throw error;
  }
};

export const loadSearchResults = async function (query) {
  try {
    state.search.query = query;
    const data = await AJAX(`${API_URL}?search=${query}&key=${KEY}`);

    // return new array with new object element
    state.search.results = data.data.recipes.map(rec => {
      return {
        id: rec.id,
        publisher: rec.publisher,
        title: rec.title,
        image: rec.image_url,
      };
    });
    state.search.page = 1;
  } catch (error) {
    console.error(`${error} 🔴🔴🔴🔴🔴🔴`);
    throw error;
  }
};

export const getSearchResultsPage = function (page = state.search.page) {
  state.search.page = page;

  const start = (page - 1) * state.search.resultsPerPage; // 0
  const end = page * state.search.resultsPerPage; // 9

  return state.search.results.slice(start, end); // return a part of state.search.results from 0 to 10 and so far
};

export const updateServings = function (newServings) {
  state.recipe.ingredients.forEach(ing => {
    ing.quantity = (ing.quantity * newServings) / state.recipe.servings;
  });

  state.recipe.servings = newServings;
};

const persistBookmarks = function () {
  localStorage.setItem('bookmarks', JSON.stringify(state.bookmarks));
};

export const addBookmark = function (recipe) {
  // add bookmark
  state.bookmarks.push(recipe);

  // mark current recipe as bookmark
  if (recipe.id === state.recipe.id) state.recipe.bookmarked = true;
  persistBookmarks();
};

export const deleteBookmark = function (id) {
  // delete bookmarked
  const index = state.bookmarks.findIndex(el => el.id === id);
  state.bookmarks.splice(index, 1); // remove one item at index

  // remove bookmark if current recipe is bookmarked
  if (id === state.recipe.id) state.recipe.bookmarked = false;
  persistBookmarks();
};

const init = function () {
  const storage = localStorage.getItem('bookmarks');
  if (storage) state.bookmarks = JSON.parse(storage);
};

init();
// console.log(state.bookmarks);

const clearBookmarks = function () {
  localStorage.clear('bookmarks');
};

// clearBookmarks();

export const uploadRecipe = async function (newRecipe) {
  try {
    // console.log(newRecipe);
    const ingredients = Object.entries(newRecipe)
      .filter(entry => entry[0].startsWith('ingredient') && entry[1] !== '')
      .map(ing => {
        const ingArr = ing[1].replaceAll(' ', '').split(',');
        if (ingArr.length !== 3) throw new Error('Wrong ingredient format!');

        const [quantity, unit, description] = ingArr;
        return { quantity: quantity ? +quantity : null, unit, description };
      });
    const recipe = {
      title: newRecipe.title,
      source_url: newRecipe.sourceUrl,
      image_url: newRecipe.image,
      publisher: newRecipe.publisher,
      cooking_time: +newRecipe.cookingTime,
      servings: +newRecipe.servings,
      ingredients,
    };
    console.log(recipe);

    const data = await AJAX(`${API_URL}?key=${KEY}`, recipe);
    state.recipe = createRecipeObject(data);
    addBookmark(state.recipe);
    console.log(data);
  } catch (error) {
    throw error;
  }
};
