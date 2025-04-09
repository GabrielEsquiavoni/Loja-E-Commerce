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

export const deleteProduct = async (req, res) => {
  try{
    const product = await Product.findById(req.params.id);
    if(!product){
      return res.status(404).json({ message: "Product not found" });
    }

    if(product.image){
      const publicId = product.image.split("/").pop().split(".")[0]; // Extract public ID from the URL
      try{
        await cloudinary.uploader.destroy(`products/${publicId}`); // Delete image from Cloudinary
        console.log("deleted image from cloudinary");
      } catch (error) {
        console.log("error deleting image from cloudinary: ", error.message);
      }
    }

    await Product.findByIdAndDelete(req.params.id); // Delete the product from the database

    res.json({ message: "Product deleted successfully" }); // Send success response
  } catch (error) {
    console.log("Error in deleteProduct controller: ", error.message);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const getRecommendedProducts = async (req, res) => {
  try{
    const products = await Product.aggregate([
      { $sample: { size: 3 } }, // Randomly select 3 products
      { $project: { _id: 1, name: 1, description: 1, image: 1, price: 1 } } // Project only the necessary fields
    ]);

    res.json(products); // Send the recommended products as a JSON response
  } catch (error) {
    console.log("Error in getRecommendedProducts controller: ", error.message);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const getProductsByCategory = async (req, res) => {
  const {category} = req.params;
  try{

    const products = await Product.find({category});
    res.json(products);
  } catch (error) {
    console.log("Error in getProductsByCategory controller: ", error.message);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
}

export const toggleFeaturedProduct = async (req, res) => {
  try{
    const product = await Product.findById(req.params.id);
    if(product) {
      product.isFeatured = !product.isFeatured; // Toggle the isFeatured property
      const updatedProduct = await product.save();
      await updateFeaturedProductsCache(); // Update the cache after toggling

      res.json(updatedProduct);
      } else {
        res.status(404).json({ message: "Product not found" });
      }
  } catch (error) {
    console.log("Error in toggleFeaturedProduct controller: ", error.message);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
}

async function updateFeaturedProductsCache() {
  try{  
    const featuredProducts = await Product.find({ isFeatured: true }).lean();
    await redis.set("featured_products", JSON.stringify(featuredProducts)); 
  } catch (error) {
    console.log("Error in updateFeaturedProductsCache: ", error.message);
  }
}