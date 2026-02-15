// utils/sellerLevel.js
const getSellerLevel = (completedOrders) => {
    if (completedOrders > 100) return 'Top Rated';
    if (completedOrders > 50) return 'Level 2';
    return 'New Seller';
};