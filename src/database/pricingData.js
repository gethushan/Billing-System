// src/database/pricingData.js
import data1 from "./extracted_data_1.json";
import data12 from "./extracted_data_12.json";
import data13 from "./extracted_data_13.json";
import data14 from "./extracted_data_14.json";
import data15 from "./extracted_data_15.json";

// Combine all pricing data into a single object
const allPricingData = [...data1, ...data12, ...data13, ...data14, ...data15];

export default allPricingData;
