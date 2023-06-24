import axios from 'axios';
import Notiflix from 'notiflix';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';

const KEY_API = '37677565-5d16b12621b5c2bbae0a75dd4';

const refs = {
  form: document.querySelector('.search-form'),
  gallery: document.querySelector('.gallery'),
};

let currentPage = 1;
let currentSearchQuery = '';
let lightbox = null;

refs.form.addEventListener('submit', handleFormSubmit);

async function handleFormSubmit(event) {
  event.preventDefault();
  const searchQuery = event.target.elements.searchQuery.value;
  if (searchQuery.trim() === '') {
    return;
  }
  currentSearchQuery = searchQuery;
  currentPage = 1;
  try {
    const { images, totalHits } = await searchImages(currentSearchQuery, currentPage);
    if (images.length === 0) {
      showNoImagesMessage();
    } else {
      displayImages(images);
      showTotalHitsMessage(totalHits);
      setupInfiniteScroll();
    }
  } catch (error) {
    console.error('Error searching images:', error);
    showError();
  }
}

async function searchImages(query, page) {
  const perPage = 40;
  const url = `https://pixabay.com/api/?key=${KEY_API}&q=${encodeURIComponent(
    query
  )}&image_type=photo&orientation=horizontal&safesearch=true&page=${page}&per_page=${perPage}`;
  const response = await axios.get(url);
  if (response.status === 200) {
    return {
      images: response.data.hits.map((image) => ({
        webformatURL: image.webformatURL,
        largeImageURL: image.largeImageURL,
        tags: image.tags,
        likes: image.likes,
        views: image.views,
        comments: image.comments,
        downloads: image.downloads,
      })),
      totalHits: response.data.totalHits,
    };
  }
  throw new Error('Failed to search images');
}

function displayImages(images) {
  const cardsHTML = images
    .map(
      (image) => `
        <a href="${image.largeImageURL}" class="photo-card">
          <img src="${image.webformatURL}" alt="${image.tags}" loading="lazy" />
          <div class="info">
            <p class="info-item">
              <b>Likes:</b> ${image.likes}
            </p>
            <p class="info-item">
              <b>Views:</b> ${image.views}
            </p>
            <p class="info-item">
              <b>Comments:</b> ${image.comments}
            </p>
            <p class="info-item">
              <b>Downloads:</b> ${image.downloads}
            </p>
          </div>
        </a>
      `
    )
    .join('');
  refs.gallery.innerHTML = cardsHTML;

  if (lightbox === null) {
    lightbox = new SimpleLightbox('.gallery a', {
      captionsData: 'alt',
      captionDelay: 250,
    });
  } else {
    lightbox.refresh();
  }
}

function showTotalHitsMessage(totalHits) {
  Notiflix.Notify.success(`Hooray! We found ${totalHits} images.`);
}

function showNoImagesMessage() {
  Notiflix.Notify.failure(
    "Sorry, there are no images matching your search query. Please try again."
  );
}

function showError() {
  Notiflix.Notify.failure(
    'An error occurred while loading images. Please try again later.'
  );
}

function setupInfiniteScroll() {
  window.addEventListener('scroll', handleScroll);
}

async function handleScroll() {
  const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
  if (scrollTop + clientHeight >= scrollHeight - 10) {
    window.removeEventListener('scroll', handleScroll);
    try {
      currentPage++;
      const { images, totalHits } = await searchImages(currentSearchQuery, currentPage);
      if (images.length === 0) {
        showEndOfResultsMessage();
      } else {
        displayImages(images);
        showTotalHitsMessage(totalHits);
        setupInfiniteScroll();
      }
    } catch (error) {
      console.error('Error loading more images:', error);
      showError();
    }
  }
}

function showEndOfResultsMessage() {
  Notiflix.Notify.info("End of search results.");
  }