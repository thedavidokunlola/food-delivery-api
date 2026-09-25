// Seed script — repeatable, deletes all records before re-seeding with Lagos-specific data

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { CONFIG } from '../src/config';

const prisma = new PrismaClient();

// Lagos restaurant names — authentic Nigerian food brands and fictional local spots
const RESTAURANT_NAMES = [
  'Mama Cass', 'Yellow Chilli', 'Chicken Republic', 'Tastee Fried Chicken',
  'Mr Biggs Revival', 'Suya Spot Lekki', 'Buka by the Beach', 'Jollof Junction',
  'Pepper Soup Palace', 'The Wrap House', 'Naija Plates', 'Lagos Kitchen',
  'Amala Zone', 'Kilimanjaro Express', 'Terra Kulture Café', 'Ofada Boy',
  'Efo Riro Central', 'Bole & Fish Hub', 'Yahuza Suya', 'Ile Iyan',
  'Calabar Kitchen', 'Nkwobi House', 'Ewa Agoyin Republic', 'Asun Paradise',
  'Shawarma Republic', 'Pizza Jungle', 'Chopnownow', 'Sweet Sensation Express',
  'Debonairs Lagos', 'Dominos Lekki', 'Cold Stone Creamery VI', 'Barcelos Ikeja',
  'Ocean Basket Lagos', 'Bukka Hut', 'Jevinik Restaurant', 'Tantalizers Plus',
  'Food Concepts Hub', 'Southern Fried Lagos', 'Olaiya Foods', 'Iya Basira Amala',
  'Pounded Yam Factory', 'The Place Restaurant', 'Café Neo Kitchen',
  'Wok n Koi', 'Sky Lounge Grill', 'Hibachi Lagos', 'La Taverna',
  'Crust & Cream', 'Flame Grills Ajah', 'Pepperoni Central',
];

// Lagos areas for realistic delivery addresses
const LAGOS_AREAS = [
  'Victoria Island', 'Lekki Phase 1', 'Surulere', 'Ikeja', 'Yaba',
  'Ajah', 'Maryland', 'Ikoyi', 'Gbagada', 'Ogba',
];

// Lagos street names for realistic addresses
const LAGOS_STREETS = [
  'Admiralty Way', 'Ozumba Mbadiwe Avenue', 'Adeola Odeku Street',
  'Allen Avenue', 'Bode Thomas Street', 'Herbert Macaulay Way',
  'Awolowo Road', 'Opebi Road', 'Toyin Street', 'Akin Adesola Street',
  'Sanusi Fafunwa Street', 'Adetokunbo Ademola Street', 'Isaac John Street',
  'Adelabu Street', 'Murtala Muhammed Way', 'Western Avenue',
  'Apapa Road', 'Broad Street', 'Marina Road', 'Campbell Street',
];

// Menu items categorized by cuisine — realistic Nigerian food market items
const MENU_ITEMS_BY_CUISINE: Record<string, Array<{ name: string; description: string; category: string }>> = {
  Nigerian: [
    { name: 'Jollof Rice & Chicken', description: 'Smoky party-style jollof rice served with grilled chicken', category: 'Mains' },
    { name: 'Pounded Yam & Egusi', description: 'Smooth pounded yam with melon seed soup and assorted meat', category: 'Mains' },
    { name: 'Amala & Ewedu', description: 'Yam flour meal with jute leaf soup and gbegiri', category: 'Mains' },
    { name: 'Ofada Rice & Sauce', description: 'Local unpolished rice with spicy ofada sauce and assorted proteins', category: 'Mains' },
    { name: 'Suya Platter', description: 'Spiced grilled beef skewers with yaji pepper and onions', category: 'Starters' },
    { name: 'Pepper Soup', description: 'Spicy goat meat pepper soup with utazi leaves', category: 'Starters' },
    { name: 'Fried Plantain', description: 'Golden fried ripe plantain slices', category: 'Sides' },
    { name: 'Chapman Drink', description: 'Nigerian cocktail with Fanta, Sprite, grenadine, and cucumber', category: 'Drinks' },
    { name: 'Zobo Drink', description: 'Chilled hibiscus flower drink with ginger and pineapple', category: 'Drinks' },
    { name: 'Puff Puff', description: 'Deep-fried dough balls dusted with powdered sugar', category: 'Desserts' },
    { name: 'Moi Moi', description: 'Steamed bean pudding with eggs and fish', category: 'Sides' },
    { name: 'Ewa Agoyin', description: 'Mashed beans with spicy palm oil sauce', category: 'Mains' },
  ],
  Shawarma: [
    { name: 'Chicken Shawarma', description: 'Grilled chicken wrap with garlic sauce and veggies', category: 'Mains' },
    { name: 'Beef Shawarma', description: 'Seasoned beef wrap with tahini and pickled vegetables', category: 'Mains' },
    { name: 'Shawarma Platter', description: 'Unwrapped shawarma with rice, salad, and three sauces', category: 'Mains' },
    { name: 'Falafel Wrap', description: 'Crispy chickpea falafel with hummus in pita bread', category: 'Mains' },
    { name: 'Hummus & Pita', description: 'Creamy chickpea hummus with warm pita bread', category: 'Starters' },
    { name: 'Fattoush Salad', description: 'Lebanese salad with crispy pita chips and sumac dressing', category: 'Sides' },
    { name: 'Kofta Skewers', description: 'Spiced minced meat grilled on skewers', category: 'Starters' },
    { name: 'Ayran Drink', description: 'Chilled yoghurt drink with salt and mint', category: 'Drinks' },
    { name: 'Baklava', description: 'Flaky pastry with pistachios and honey syrup', category: 'Desserts' },
    { name: 'Garlic Fries', description: 'Crispy fries tossed in garlic butter and herbs', category: 'Sides' },
  ],
  Pizza: [
    { name: 'Margherita Pizza', description: 'Classic tomato sauce, mozzarella, and fresh basil', category: 'Mains' },
    { name: 'Pepperoni Pizza', description: 'Loaded with spicy pepperoni and melted cheese', category: 'Mains' },
    { name: 'BBQ Chicken Pizza', description: 'Grilled chicken, BBQ sauce, red onions, and mozzarella', category: 'Mains' },
    { name: 'Suya Pizza', description: 'Nigerian fusion pizza with suya spiced chicken and peppers', category: 'Mains' },
    { name: 'Garlic Bread', description: 'Toasted bread with garlic butter and parsley', category: 'Starters' },
    { name: 'Caesar Salad', description: 'Romaine lettuce with croutons, parmesan, and Caesar dressing', category: 'Sides' },
    { name: 'Chicken Wings', description: 'Crispy fried wings with choice of hot or BBQ sauce', category: 'Starters' },
    { name: 'Coca-Cola', description: 'Chilled 50cl bottle of Coca-Cola', category: 'Drinks' },
    { name: 'Tiramisu', description: 'Italian coffee-flavored layered dessert', category: 'Desserts' },
    { name: 'Cheesy Fries', description: 'Crispy fries smothered in melted cheddar', category: 'Sides' },
  ],
  Chinese: [
    { name: 'Sweet & Sour Chicken', description: 'Crispy chicken pieces in tangy sweet and sour sauce', category: 'Mains' },
    { name: 'Fried Rice Special', description: 'Wok-fried rice with shrimp, chicken, and vegetables', category: 'Mains' },
    { name: 'Chow Mein', description: 'Stir-fried noodles with vegetables and soy sauce', category: 'Mains' },
    { name: 'Spring Rolls', description: 'Crispy vegetable spring rolls with dipping sauce', category: 'Starters' },
    { name: 'Dim Sum Platter', description: 'Assorted steamed dumplings with soy dipping sauce', category: 'Starters' },
    { name: 'Wonton Soup', description: 'Clear broth with pork wontons and bok choy', category: 'Starters' },
    { name: 'Egg Fried Rice', description: 'Simple fried rice with scrambled eggs and scallions', category: 'Sides' },
    { name: 'Chinese Green Tea', description: 'Premium loose-leaf green tea', category: 'Drinks' },
    { name: 'Mango Pudding', description: 'Chilled mango-flavored pudding with coconut cream', category: 'Desserts' },
    { name: 'Prawn Crackers', description: 'Light crispy prawn-flavored crackers', category: 'Sides' },
  ],
  Continental: [
    { name: 'Grilled Salmon', description: 'Atlantic salmon fillet with lemon butter sauce and asparagus', category: 'Mains' },
    { name: 'Chicken Alfredo Pasta', description: 'Fettuccine in creamy parmesan sauce with grilled chicken', category: 'Mains' },
    { name: 'Beef Steak', description: '300g ribeye steak with mashed potatoes and gravy', category: 'Mains' },
    { name: 'Bruschetta', description: 'Toasted bread with tomato, basil, and balsamic glaze', category: 'Starters' },
    { name: 'French Onion Soup', description: 'Caramelized onion soup with melted gruyère crouton', category: 'Starters' },
    { name: 'Coleslaw', description: 'Fresh cabbage and carrot slaw with creamy dressing', category: 'Sides' },
    { name: 'Mashed Potatoes', description: 'Buttery whipped potatoes with herbs', category: 'Sides' },
    { name: 'Fresh Orange Juice', description: 'Freshly squeezed orange juice', category: 'Drinks' },
    { name: 'Crème Brûlée', description: 'Classic French custard with caramelized sugar top', category: 'Desserts' },
    { name: 'Red Wine', description: 'Glass of house Cabernet Sauvignon', category: 'Drinks' },
  ],
  'Fast Food': [
    { name: 'Classic Burger', description: 'Beef patty with lettuce, tomato, cheese in sesame bun', category: 'Mains' },
    { name: 'Chicken Burger', description: 'Crispy fried chicken fillet with mayo and pickles', category: 'Mains' },
    { name: 'Hot Dog', description: 'Grilled frankfurter in a soft roll with mustard and ketchup', category: 'Mains' },
    { name: 'Fish & Chips', description: 'Beer-battered fish with thick-cut chips and tartar sauce', category: 'Mains' },
    { name: 'Onion Rings', description: 'Crispy battered onion rings with ranch dip', category: 'Starters' },
    { name: 'Chicken Nuggets', description: '10-piece crispy chicken nuggets with dipping sauces', category: 'Starters' },
    { name: 'French Fries', description: 'Golden crispy french fries with ketchup', category: 'Sides' },
    { name: 'Milkshake', description: 'Thick vanilla milkshake with whipped cream', category: 'Drinks' },
    { name: 'Sundae', description: 'Vanilla ice cream with chocolate sauce and sprinkles', category: 'Desserts' },
    { name: 'Apple Pie', description: 'Warm apple pie with cinnamon and vanilla ice cream', category: 'Desserts' },
  ],
  Seafood: [
    { name: 'Grilled Prawns', description: 'Jumbo prawns grilled with garlic butter and lemon', category: 'Mains' },
    { name: 'Seafood Platter', description: 'Assorted grilled fish, prawns, calamari, and lobster tail', category: 'Mains' },
    { name: 'Fish Pepper Soup', description: 'Spicy catfish pepper soup with Nigerian spices', category: 'Mains' },
    { name: 'Calamari Rings', description: 'Lightly battered squid rings with aioli', category: 'Starters' },
    { name: 'Prawn Cocktail', description: 'Chilled prawns with Marie Rose sauce on lettuce', category: 'Starters' },
    { name: 'Coconut Rice', description: 'Fragrant rice cooked in coconut milk', category: 'Sides' },
    { name: 'Steamed Vegetables', description: 'Seasonal vegetables lightly steamed with butter', category: 'Sides' },
    { name: 'Coconut Water', description: 'Fresh chilled coconut water', category: 'Drinks' },
    { name: 'Banana Fritters', description: 'Ripe banana fritters with honey drizzle', category: 'Desserts' },
    { name: 'Lobster Bisque', description: 'Rich creamy lobster soup with a hint of brandy', category: 'Starters' },
  ],
  Grills: [
    { name: 'Mixed Grill Platter', description: 'Assorted grilled meats — chicken, beef, lamb, and sausage', category: 'Mains' },
    { name: 'Grilled Chicken', description: 'Whole spiced grilled chicken with jollof rice', category: 'Mains' },
    { name: 'Lamb Chops', description: 'Herb-marinated lamb chops grilled to perfection', category: 'Mains' },
    { name: 'Suya Kebab', description: 'Traditional Nigerian suya with extra yaji spice', category: 'Starters' },
    { name: 'Grilled Corn', description: 'Roasted corn on the cob with coconut and ube', category: 'Starters' },
    { name: 'Jollof Rice', description: 'Smoky tomato rice with peppers and onions', category: 'Sides' },
    { name: 'Fried Yam', description: 'Crispy fried yam cubes with pepper sauce', category: 'Sides' },
    { name: 'Palm Wine', description: 'Fresh palm wine served chilled', category: 'Drinks' },
    { name: 'Chin Chin', description: 'Crunchy fried pastry snack', category: 'Desserts' },
    { name: 'Asun', description: 'Spicy grilled goat meat with peppers and onions', category: 'Starters' },
  ],
  Pastries: [
    { name: 'Meat Pie', description: 'Flaky pastry filled with seasoned minced meat and vegetables', category: 'Mains' },
    { name: 'Chicken Pie', description: 'Golden pastry stuffed with creamy chicken filling', category: 'Mains' },
    { name: 'Sausage Roll', description: 'Puff pastry wrapped around seasoned sausage meat', category: 'Starters' },
    { name: 'Egg Roll', description: 'Boiled egg wrapped in dough and deep fried', category: 'Starters' },
    { name: 'Scotch Egg', description: 'Boiled egg wrapped in minced meat and breadcrumbs', category: 'Starters' },
    { name: 'Doughnut', description: 'Soft ring doughnut with sugar glaze', category: 'Desserts' },
    { name: 'Croissant', description: 'Buttery flaky French croissant', category: 'Sides' },
    { name: 'Coffee', description: 'Freshly brewed Arabica coffee', category: 'Drinks' },
    { name: 'Cake Slice', description: 'Rich chocolate cake with ganache', category: 'Desserts' },
    { name: 'Smoothie Bowl', description: 'Blended fruit bowl with granola and honey', category: 'Drinks' },
  ],
  Healthy: [
    { name: 'Grilled Chicken Salad', description: 'Mixed greens with grilled chicken, avocado, and vinaigrette', category: 'Mains' },
    { name: 'Quinoa Bowl', description: 'Quinoa with roasted vegetables, chickpeas, and tahini', category: 'Mains' },
    { name: 'Acai Bowl', description: 'Blended acai with banana, granola, and fresh berries', category: 'Mains' },
    { name: 'Green Smoothie', description: 'Spinach, banana, ginger, and apple blended smooth', category: 'Drinks' },
    { name: 'Fruit Salad', description: 'Fresh seasonal fruits with honey-lime dressing', category: 'Starters' },
    { name: 'Avocado Toast', description: 'Sourdough toast with smashed avocado, seeds, and chili flakes', category: 'Starters' },
    { name: 'Brown Rice', description: 'Steamed whole grain brown rice', category: 'Sides' },
    { name: 'Detox Water', description: 'Cucumber, lemon, and mint infused water', category: 'Drinks' },
    { name: 'Yoghurt Parfait', description: 'Greek yoghurt layered with granola and mixed berries', category: 'Desserts' },
    { name: 'Sweet Potato Fries', description: 'Oven-baked sweet potato fries with herbs', category: 'Sides' },
  ],
};

// Nigerian phone number formats for seeding
function generateNigerianPhone(): string {
  const prefixes = ['0803', '0805', '0806', '0807', '0808', '0809', '0810', '0813', '0814', '0816', '0903', '0906', '0915'];
  const prefix = faker.helpers.arrayElement(prefixes);
  const suffix = faker.string.numeric(7);
  return `${prefix}${suffix}`;
}

// Generate a realistic Lagos address
function generateLagosAddress(): string {
  const area = faker.helpers.arrayElement(LAGOS_AREAS);
  const street = faker.helpers.arrayElement(LAGOS_STREETS);
  const number = faker.number.int({ min: 1, max: 150 });
  return `${number} ${street}, ${area}, Lagos`;
}

// Weighted random status distribution matching realistic order patterns
function getWeightedStatus(): string {
  const rand = Math.random();
  if (rand < 0.40) return 'delivered';
  if (rand < 0.60) return 'pending';
  if (rand < 0.75) return 'preparing';
  if (rand < 0.85) return 'confirmed';
  if (rand < 0.95) return 'out_for_delivery';
  return 'cancelled';
}

async function seed() {
  console.log('🌱 Starting seed...');
  console.log('🗑️  Clearing existing data...');

  // Delete in order to respect foreign key constraints
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.restaurant.deleteMany();

  console.log('✅ Existing data cleared');

  // Seed restaurants
  console.log(`🏪 Creating ${CONFIG.seed.restaurantCount} restaurants...`);
  const restaurants = [];

  for (let i = 0; i < CONFIG.seed.restaurantCount; i++) {
    const name = i < RESTAURANT_NAMES.length
      ? RESTAURANT_NAMES[i]
      : `${faker.helpers.arrayElement(RESTAURANT_NAMES)} ${faker.helpers.arrayElement(LAGOS_AREAS)}`;

    const cuisine = faker.helpers.arrayElement([...CONFIG.cuisineTypes]);
    const restaurant = await prisma.restaurant.create({
      data: {
        name,
        cuisine,
        address: generateLagosAddress(),
        rating: parseFloat((faker.number.float({ min: 1, max: 5, fractionDigits: 1 })).toFixed(1)),
        isOpen: faker.datatype.boolean({ probability: 0.8 }),
        deliveryTime: faker.helpers.arrayElement([15, 20, 25, 30, 35, 40, 45, 60]),
        minimumOrder: faker.helpers.arrayElement([50000, 100000, 150000, 200000, 250000, 300000]), // kobo (500–3000 NGN)
      },
    });
    restaurants.push(restaurant);
  }
  console.log(`✅ ${restaurants.length} restaurants created`);

  // Seed menu items for each restaurant
  console.log(`🍽️  Creating menu items (${CONFIG.seed.menuItemsPerRestaurant} per restaurant)...`);
  const allMenuItems = [];

  for (const restaurant of restaurants) {
    const cuisineMenu = MENU_ITEMS_BY_CUISINE[restaurant.cuisine] || MENU_ITEMS_BY_CUISINE['Nigerian'];
    const selectedItems = faker.helpers.arrayElements(cuisineMenu, Math.min(CONFIG.seed.menuItemsPerRestaurant, cuisineMenu.length));

    // If we need more items than available in this cuisine, pad with additional items
    while (selectedItems.length < CONFIG.seed.menuItemsPerRestaurant) {
      const extraCuisine = faker.helpers.arrayElement(Object.keys(MENU_ITEMS_BY_CUISINE));
      const extraItem = faker.helpers.arrayElement(MENU_ITEMS_BY_CUISINE[extraCuisine]);
      if (!selectedItems.find(item => item.name === extraItem.name)) {
        selectedItems.push(extraItem);
      }
    }

    for (const item of selectedItems) {
      const menuItem = await prisma.menuItem.create({
        data: {
          restaurantId: restaurant.id,
          name: item.name,
          description: item.description,
          price: faker.number.int({ min: 200000, max: 5000000 }), // 2,000–50,000 NGN in kobo
          category: item.category,
          isAvailable: faker.datatype.boolean({ probability: 0.9 }),
        },
      });
      allMenuItems.push(menuItem);
    }
  }
  console.log(`✅ ${allMenuItems.length} menu items created`);

  // Seed orders
  console.log(`📦 Creating ${CONFIG.seed.orderCount} orders...`);
  let totalOrderItems = 0;

  for (let i = 0; i < CONFIG.seed.orderCount; i++) {
    const restaurant = faker.helpers.arrayElement(restaurants);
    const restaurantMenuItems = allMenuItems.filter(mi => mi.restaurantId === restaurant.id);

    if (restaurantMenuItems.length === 0) continue;

    // Generate 1–4 order items
    const itemCount = faker.number.int({ min: 1, max: 4 });
    const selectedMenuItems = faker.helpers.arrayElements(restaurantMenuItems, Math.min(itemCount, restaurantMenuItems.length));

    // Calculate order items and total
    const orderItemsData = selectedMenuItems.map(mi => {
      const quantity = faker.number.int({ min: 1, max: 3 });
      return {
        menuItemId: mi.id,
        quantity,
        unitPrice: mi.price, // kobo
        subtotal: mi.price * quantity, // kobo
      };
    });

    const totalAmount = orderItemsData.reduce((sum, item) => sum + item.subtotal, 0); // kobo

    const order = await prisma.order.create({
      data: {
        restaurantId: restaurant.id,
        customerName: faker.person.fullName(),
        customerPhone: generateNigerianPhone(),
        deliveryAddress: generateLagosAddress(),
        status: getWeightedStatus(),
        totalAmount, // kobo
        orderItems: {
          create: orderItemsData,
        },
      },
    });

    totalOrderItems += orderItemsData.length;
  }
  console.log(`✅ ${CONFIG.seed.orderCount} orders created`);
  console.log(`✅ ${totalOrderItems} order items created`);
  console.log('🎉 Seed complete!');
}

// Run the seed function
seed()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
