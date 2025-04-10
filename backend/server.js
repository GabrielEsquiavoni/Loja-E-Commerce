import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';

import authRoutes from './routes/auth.route.js';
import productRoutes from './routes/product.Routes.js';
import cartRoutes from './routes/cart.route.js';

import { connectDB } from './lib/db.js';
dotenv.config();

const app = express ();
const PORT = process.env.PORT || 5000;

app.use(express.json()); // allow parse info
app.use(cookieParser()); // allow parse cookies

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);

app.listen(PORT, () => {
    console.log('Server is running on http://localhost:' + PORT);

    connectDB();
});