export const carsData = [
  {
    id: 1,
    name: "Toyota Camry",
    description: "Comfortable and reliable sedan for daily commute",
    price: 80,
    pricePerDay: 80,
    location: "Lekki",
    category: "Sedan",
    seats: 5,
    transmission: "Automatic",
    fuelType: "Petrol",
    image:
      "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=600&h=400&fit=crop",
    rating: 4.5,
    reviews: 128,
  },
  {
    id: 2,
    name: "Mercedes Benz C-Class",
    description: "Luxury sedan with premium features",
    price: 150,
    pricePerDay: 150,
    location: "Victoria Island",
    category: "Luxury",
    seats: 5,
    transmission: "Automatic",
    fuelType: "Petrol",
    image:
      "https://images.unsplash.com/photo-1552820728-8ac41f1ce891?w=600&h=400&fit=crop",
    rating: 4.8,
    reviews: 95,
  },
  {
    id: 3,
    name: "Honda Civic",
    description: "Sporty and fuel-efficient compact car",
    price: 70,
    pricePerDay: 70,
    location: "Ikeja",
    category: "Compact",
    seats: 5,
    transmission: "Manual",
    fuelType: "Petrol",
    image:
      "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=600&h=400&fit=crop",
    rating: 4.3,
    reviews: 156,
  },
  {
    id: 4,
    name: "Toyota Hiace",
    description: "Spacious van for group travel",
    price: 120,
    pricePerDay: 120,
    location: "Lekki",
    category: "Van",
    seats: 12,
    transmission: "Automatic",
    fuelType: "Diesel",
    image:
      "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=600&h=400&fit=crop",
    rating: 4.6,
    reviews: 84,
  },
  {
    id: 5,
    name: "BMW X5",
    description: "Premium SUV with excellent performance",
    price: 200,
    pricePerDay: 200,
    location: "Ikoyi",
    category: "SUV",
    seats: 7,
    transmission: "Automatic",
    fuelType: "Petrol",
    image:
      "https://images.unsplash.com/photo-1606611013016-969c19d8f15f?w=600&h=400&fit=crop",
    rating: 4.9,
    reviews: 67,
  },
  {
    id: 6,
    name: "Kia Sportage",
    description: "Reliable SUV with modern features",
    price: 110,
    pricePerDay: 110,
    location: "VI",
    category: "SUV",
    seats: 5,
    transmission: "Automatic",
    fuelType: "Petrol",
    image:
      "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=600&h=400&fit=crop",
    rating: 4.4,
    reviews: 102,
  },
  {
    id: 7,
    name: "Nissan Altima",
    description: "Elegant mid-size sedan",
    price: 85,
    pricePerDay: 85,
    location: "Lekki",
    category: "Sedan",
    seats: 5,
    transmission: "Automatic",
    fuelType: "Petrol",
    image:
      "https://images.unsplash.com/photo-1552820728-8ac41f1ce891?w=600&h=400&fit=crop",
    rating: 4.2,
    reviews: 89,
  },
  {
    id: 8,
    name: "Hyundai Tucson",
    description: "Affordable and practical family SUV",
    price: 90,
    pricePerDay: 90,
    location: "Ajah",
    category: "SUV",
    seats: 5,
    transmission: "Automatic",
    fuelType: "Petrol",
    image:
      "https://images.unsplash.com/photo-1606611013016-969c19d8f15f?w=600&h=400&fit=crop",
    rating: 4.3,
    reviews: 73,
  },
];

export const carCategories = [
  "All",
  "Sedan",
  "SUV",
  "Compact",
  "Luxury",
  "Van",
];

export const getCarById = (id) =>
  carsData.find((car) => car.id === parseInt(id));

export const filterCars = (category) => {
  if (category === "All") return carsData;
  return carsData.filter((car) => car.category === category);
};
