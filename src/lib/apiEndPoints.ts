
const BASE_URL = 'http://localhost:8099/api/';

//     User Service 
export const User_Service_URL = BASE_URL +"users";
export const Auth_URL = User_Service_URL + "/auth";

// Product Service URLs - going through Gateway  
export const Product_Service_URL = BASE_URL + "products";
export const IMAGE_GLOBAL_PATH = "C:\\Users\\DELL\\Downloads\\Ecommerce\\Ecommerce-App\\uploads\\images";
export const IMAGE_GLOBAL_PATH1 = "C:/Users/Admin/Desktop/Ecommerce-App/uploads/images"
// Inventory Service URLs - going through Gateway
export const Inventory_Service_URL = BASE_URL + "products/inventory";




