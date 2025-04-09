import { redis } from '../lib/redis.js'; 
import cloudinary from '../lib/cloudinary.js';
import Product from '../models/product.model.js';

export const getAllProducts = async (req, res) => {
    try {
      const products = await Product.find({}); // Fetch all products from the database
      res.status(200).json(products); // Send the products as a JSON response
    } catch (error) {
        console.log("Error in getAllProducts controller: ", error.message);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
}

export const getFeaturedProducts = async (req, res) => {
    try {
      let featuredProducts= await redis.get("featured_products")
      if (featuredProducts) {
        return res.json(JSON.parse(featuredProducts)); // If cached data exists, return it
      }

      // If no cached data, fetch from the database
      featuredProducts = await Product.find({ isFeatured: true }).lean();
      
      if(!featuredProducts) {
        return res.status(404).json({ message: "No featured products found" });
      }

      // store in redis for future quick access

      await redis.set("featured_products", JSON.stringify(featuredProducts));

      res.json(featuredProducts); // Send the featured products as a JSON response
    } catch (error) {
        console.log("Error in getFeaturedProducts controller: ", error.message);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
}

export const createProduct = async (req, res) => {
  try{
    const {name, description, price, image, category, isFeatured} = req.body;

    let cloudinaryResponse = null;

    if(image){
      cloudinaryResponse= await cloudinary.uploader.upload(image, { folder: "products" })
    }

    const product = await Product.create({
      name,
      description,
      price,
      image: cloudinaryResponse?.secure_url ? cloudinaryResponse.secure_url : "",
      category
    });

    res.status(201).json(product); // Send the created product 
  } catch (error) {
    console.log("Error in createProduct controller: ", error.message);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};