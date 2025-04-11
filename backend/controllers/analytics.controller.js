import User from '../models/user.model.js';
import Product from '../models/product.model.js';
import Order from '../models/order.model.js';

export const getAnalyticsData = async () => {
    const totalUsers = await User.countDocuments(); 
    const totalProducts = await Product.countDocuments();

    const salesData = await Order.aggregate([
        {
            $group: {
                _id: null, // Grouping by null to get total sales
                totalSales: { $sum: 1 }, // Count total number of orders
                totalRevenue: { $sum: "$totalAmount" }, // Sum of totalPrice field in orders
            }
        }
    ]);

   const {totalSales, totalRevenue} = salesData[0] || { totalSales: 0, totalRevenue: 0 };

   return {
    users:totalUsers,
    products:totalProducts,
    totalSales,
    totalRevenue,
   }
}