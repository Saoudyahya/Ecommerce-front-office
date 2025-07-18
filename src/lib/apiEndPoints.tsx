
export const BASE_URL = 'http://localhost:8099/api/';

//     User Service 
export const User_Service_URL = BASE_URL +"users";
export const Auth_URL = User_Service_URL + "/auth";

// Product Service URLs - going through Gateway  
export const Product_Service_URL = BASE_URL + "products";
export const Cart_Service_URL = BASE_URL + "carts";
export const IMAGE_GLOBAL_PATH = "C:\\Users\\DELL\\Downloads\\Ecommerce\\Ecommerce-App\\uploads\\images";
export const IMAGE_GLOBAL_PATH1 = "C:/Users/Admin/Desktop/Ecommerce-App/uploads/images"
// Inventory Service URLs - going through Gateway
export const Inventory_Service_URL = BASE_URL + "products/inventory";

export const setCookie = (name: string, value: string, days = 7) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict;Secure`;
};

export const getCookie = (name: string): string | null => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  // eslint-disable-next-line @typescript-eslint/prefer-for-of
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

export const deleteCookie = (name: string) => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;SameSite=Strict;Secure`;
};



