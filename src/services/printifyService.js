// services/printifyService.js

// Function to fetch merch options (size, color) from the Printify API
export const fetchPrintifyProductOptions = async (productId) => {
    try {
      const response = await fetch(`/api/printify/products/${productId}`);
  
      // Check if the response is successful
      if (!response.ok) {
        throw new Error('Failed to fetch data from Printify API');
      }
  
      // Parse the JSON response
      const data = await response.json();
  
      // Validate the structure of the response (ensure that colors and sizes are present)
      if (!data.colors || !data.sizes) {
        throw new Error('Invalid response structure from Printify API');
      }
  
      // Prepare the options to return
      const options = {
        colors: data.colors,  // array of available colors
        sizes: data.sizes,    // array of available sizes
      };
  
      return options;  // Return the available options
  
    } catch (error) {
      console.error("Error fetching merch options:", error.message);
      // Return error details for further handling in the calling component
      return { error: error.message };
    }
  };