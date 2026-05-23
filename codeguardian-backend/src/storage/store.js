const reviewStore = [];

function addReview(review) {
  reviewStore.push(review);
  return review;
}

function getAllReviews() {
  return reviewStore;
}

function getReviewById(id) {
  return reviewStore.find((review) => review.id === id);
}

module.exports = {
  reviewStore,
  addReview,
  getAllReviews,
  getReviewById,
};
