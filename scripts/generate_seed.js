// Scratch generator for seed.js
import fs from 'fs';
import path from 'path';

const suppliers = [
  {
    id: 'hf',
    name: 'Heritage Foods',
    category: 'Dairy & Bakery',
    initials: 'HF',
    badge: 'Preferred',
    badge_type: 'preferred',
    target_moq: 10000,
    unit_threshold: 50,
    lead_time: '2d',
    color: '#059669',
    all_healthy: 0,
    contact_rep: 'Rajesh Kumar (Key Account Manager)',
    contact_email: 'supply@heritagefoods.in',
    contact_phone: '+91 40 2339 1221',
    contact_address: 'Heritage Valley, Road No. 12, Banjara Hills, Hyderabad, Telangana 500034',
  },
  {
    id: 'bi',
    name: 'Britannia Industries',
    category: 'Snacks & Biscuits',
    initials: 'BI',
    badge: null,
    badge_type: null,
    target_moq: 8000,
    unit_threshold: 40,
    lead_time: '4d',
    color: '#dc2626',
    all_healthy: 0,
    contact_rep: 'Ananya Sharma (Regional Distribution Lead)',
    contact_email: 'orders.south@britannia.co.in',
    contact_phone: '+91 80 3768 7000',
    contact_address: 'Britannia Towers, 5/1A Hungerford Street, Bangalore Hub 560047',
  },
  {
    id: 'nf',
    name: "Nature's Farm",
    category: 'Fruits & Vegetables',
    initials: 'NF',
    badge: 'Fresh Daily',
    badge_type: 'healthy',
    target_moq: 5000,
    unit_threshold: 30,
    lead_time: '1d',
    color: '#16a34a',
    all_healthy: 0,
    contact_rep: 'Siddharth Patel (Fresh Produce Coordinator)',
    contact_email: 'dispatch@naturesfarm.org',
    contact_phone: '+91 22 2789 4410',
    contact_address: 'APMC Market Sector 19, Vashi, Navi Mumbai, Maharashtra 400703',
  },
  {
    id: 'amul',
    name: 'Amul Dairy Products',
    category: 'Dairy & Beverages',
    initials: 'AM',
    badge: 'High Demand',
    badge_type: 'preferred',
    target_moq: 7500,
    unit_threshold: 45,
    lead_time: '2d',
    color: '#2563eb',
    all_healthy: 0,
    contact_rep: 'Vikram Mehta (Zonal Supply Head)',
    contact_email: 'retail.support@amul.coop',
    contact_phone: '+91 26 9225 8506',
    contact_address: 'Amul Dairy Road, Anand, Gujarat 388001',
  },
  {
    id: 'tc',
    name: 'Tata Consumer Products',
    category: 'Beverages & Staples',
    initials: 'TC',
    badge: 'Preferred',
    badge_type: 'preferred',
    target_moq: 12000,
    unit_threshold: 60,
    lead_time: '3d',
    color: '#0284c7',
    all_healthy: 0,
    contact_rep: 'Pooja Iyer (Commercial Sales Manager)',
    contact_email: 'orders@tataconsumer.com',
    contact_phone: '+91 22 6777 5100',
    contact_address: 'Kirloskar Business Park, Hebbal, Bengaluru, Karnataka 560024',
  },
  {
    id: 'itc',
    name: 'ITC Foods Division',
    category: 'Packaged Foods & Staples',
    initials: 'IT',
    badge: null,
    badge_type: null,
    target_moq: 10000,
    unit_threshold: 50,
    lead_time: '3d',
    color: '#ea580c',
    all_healthy: 0,
    contact_rep: 'Arunav Sengupta (FMCG Logistics Rep)',
    contact_email: 'supplychain.foods@itc.in',
    contact_phone: '+91 33 2288 9371',
    contact_address: 'Virginia House, 37 J.L. Nehru Road, Kolkata, West Bengal 700071',
  },
  {
    id: 'hul',
    name: 'Hindustan Unilever',
    category: 'Home & Personal Care',
    initials: 'HU',
    badge: 'Fast Moving',
    badge_type: 'healthy',
    target_moq: 15000,
    unit_threshold: 70,
    lead_time: '4d',
    color: '#4f46e5',
    all_healthy: 0,
    contact_rep: 'Kavita Nair (Distribution Executive)',
    contact_email: 'retailhub@unilever.com',
    contact_phone: '+91 22 5043 0000',
    contact_address: 'Unilever House, B.D. Sawant Marg, Chakala, Andheri East, Mumbai 400099',
  },
  {
    id: 'nes',
    name: 'Nestlé India',
    category: 'Nutrition & Cereals',
    initials: 'NE',
    badge: null,
    badge_type: null,
    target_moq: 11000,
    unit_threshold: 45,
    lead_time: '3d',
    color: '#b45309',
    all_healthy: 0,
    contact_rep: 'Rohit Verma (Key Distributor)',
    contact_email: 'orders@in.nestle.com',
    contact_phone: '+91 12 4332 1275',
    contact_address: 'Nestlé House, Jacaranda Marg, M Block, DLF City Phase II, Gurgaon 122002',
  },
  {
    id: 'parle',
    name: 'Parle Products',
    category: 'Biscuits & Confectionery',
    initials: 'PP',
    badge: 'Popular',
    badge_type: 'preferred',
    target_moq: 6000,
    unit_threshold: 35,
    lead_time: '2d',
    color: '#e11d48',
    all_healthy: 0,
    contact_rep: 'Sanjay Chauhan (Area Supply Officer)',
    contact_email: 'orders@parle.biz',
    contact_phone: '+91 22 6691 6611',
    contact_address: 'North Level Crossing, Vile Parle East, Mumbai 400057',
  },
  {
    id: 'mrf',
    name: 'Marico Consumer Goods',
    category: 'Edible Oils & Foods',
    initials: 'MA',
    badge: null,
    badge_type: null,
    target_moq: 9000,
    unit_threshold: 40,
    lead_time: '3d',
    color: '#0d9488',
    all_healthy: 0,
    contact_rep: 'Deepak Joshi (Regional Accounts)',
    contact_email: 'sales@marico.com',
    contact_phone: '+91 22 6648 0480',
    contact_address: 'Grande Palladium, 175 CST Road, Kalina, Santacruz East, Mumbai 400098',
  },
];

// Product name catalogs per supplier (100 distinct items per supplier = 1,000 products)
const catalogMap = {
  hf: {
    category: 'Dairy & Bakery',
    templates: [
      'Fresh Cow Milk 1L', 'Full Cream Milk 500ml', 'Toned Milk 1L', 'Double Toned Milk 500ml', 'Curd Pouch 500g',
      'Curd Tub 1kg', 'Paneer Fresh 200g', 'Paneer Block 500g', 'Butter Salted 100g', 'Butter Salted 500g',
      'White Butter Unsalted 200g', 'Cheese Block 1kg', 'Cheese Slices 200g', 'Cheese Cubes 200g', 'Mozzarella Diced 200g',
      'Whole Wheat Bread 400g', 'White Sandwich Bread 400g', 'Multigrain Bread 400g', 'Garlic Bread Loaf 250g', 'Burger Buns 4pk',
      'Pav Buns 6pk', 'Fruit Bun 2pk', 'Farm Fresh Eggs 6pk', 'Farm Fresh Eggs 12pk', 'Organic Brown Eggs 6pk',
      'Cow Ghee Jar 500ml', 'Buffalo Ghee Jar 500ml', 'Sweet Lassi 250ml', 'Mango Lassi 250ml', 'Spiced Buttermilk 200ml',
      'Flavoured Milk Cocoa 200ml', 'Flavoured Milk Badam 200ml', 'Flavoured Milk Pista 200ml', 'Greek Yogurt Plain 100g', 'Greek Yogurt Blueberry 100g',
      'Greek Yogurt Strawberry 100g', 'Fresh Cream 250ml', 'Condensed Milk Tin 400g', 'Milk Cake Sweet 250g', 'Gulab Jamun Tin 500g',
      'Rasgulla Tin 500g', 'Probiotic Curd 400g', 'Mishti Doi Cup 100g', 'Kulfi Ice Cream Stick 70ml', 'Vanilla Ice Cream Tub 1L',
      'Chocolate Ice Cream Tub 1L', 'Butterscotch Ice Cream Tub 1L', 'Skimmed Milk Powder 500g', 'Dairy Whitener 200g', 'Whey Protein Drink 200ml',
      'Paneer Spiced Cubes 200g', 'Cheddar Block 200g', 'Processed Cheese Spread 200g', 'Cheese Spread Garlic 180g', 'Pizza Cheese Blend 200g',
      'Brown Sandwich Bread 400g', 'Rusk Toast Crunchy 300g', 'Milk Rusk Cardamom 300g', 'Eggless Fruit Cake 250g', 'Chocolate Muffin 2pk',
      'Vanilla Cupcakes 4pk', 'Sponge Cake Slice 150g', 'Milk Peda 200g', 'Kaju Katli Sweet 250g', 'Motichoor Ladoo 250g',
      'Doodh Peda 250g', 'Malai Paneer Cubes 250g', 'Cultured Butter Tub 200g', 'A2 Desi Cow Milk 1L', 'A2 Cow Ghee Jar 500ml',
      'Strawberry Milkshake 200ml', 'Vanilla Milkshake 200ml', 'Banana Milkshake 200ml', 'Cold Coffee Can 250ml', 'Mango Yogurt Smoothie 200ml',
      'Berry Blast Smoothie 200ml', 'Salted Buttermilk Pet 500ml', 'Masala Chaas Tetra 200ml', 'Table Butter Chiplets 100g', 'Low Fat Paneer 200g',
      'Organic Toned Milk 1L', 'Fresh Paneer Organic 200g', 'Bakers Yeast Fresh 50g', 'Bakers Yeast Dry 100g', 'Baguette French Loaf 200g',
      'Croissant Butter 2pk', 'Doughnut Glazed 2pk', 'Cinnamon Roll 2pk', 'Cheese Garlic Toasties 200g', 'Atta Kulcha 5pk',
      'Amritsari Kulcha 4pk', 'Whole Wheat Pita Bread 4pk', 'Tortilla Wraps 6pk', 'Plain Bagels 3pk', 'Multiseed Sourdough Loaf 400g',
      'Rustic Country Sourdough 450g', 'Masala Toast Bread 350g', 'Fruit & Nut Loaf 350g', 'Sweet Cream Butter 100g', 'Organic Cow Milk Pouch 500ml'
    ],
  },
  bi: {
    category: 'Snacks & Biscuits',
    templates: [
      'Good Day Butter Cookies 100g', 'Good Day Cashew Cookies 100g', 'Good Day Pista Badam 100g', 'Good Day Chocochip 120g', 'Good Day Harmony 150g',
      'Bourbon Chocolate Cream 150g', 'Bourbon Classic Pack 300g', 'NutriChoice Digestive 200g', 'NutriChoice 5 Grain 150g', 'NutriChoice Oats Cookies 150g',
      'NutriChoice Sugarfree Cracker 300g', 'Marie Gold Tea Biscuits 120g', 'Marie Gold Super Pack 300g', 'Marie Gold Oats & Fiber 200g', '50-50 Maska Chaska 120g',
      '50-50 Sweet & Salty 120g', '50-50 Potazos Crispy 100g', 'Milk Bikis Milk Biscuits 100g', 'Milk Bikis Classic 300g', 'Little Hearts Classic 75g',
      'Little Hearts Strawberry 75g', 'Nice Time Coconut Biscuits 150g', 'Treat Jim Jam Cream Biscuits 150g', 'Treat Chocolate Cream 100g', 'Treat Vanilla Cream 100g',
      'Treat Strawberry Cream 100g', 'Treat Pineapple Cream 100g', 'Tiger Krunch Glucose 100g', 'Tiger Glucose Family Pack 500g', 'Tiger Choco Krunch 100g',
      'Toastea Premium Rusk 300g', 'Toastea Wheat Rusk 300g', 'Toastea Milk & Cashew Rusk 250g', 'Winkin Cow Chocolate Shake 180ml', 'Winkin Cow Vanilla Shake 180ml',
      'Winkin Cow Strawberry Shake 180ml', 'Winkin Cow Mango Shake 180ml', 'Winkin Cow Badam Shake 180ml', 'Winkin Cow Cold Coffee 180ml', 'Pure Magic Deuce Dark 100g',
      'Pure Magic Deuce Milk 100g', 'Pure Magic Choco Lush 150g', 'Treat Croissant Cocoa 45g', 'Treat Croissant Vanilla 45g', 'Treat Croissant Mixed Fruit 45g',
      'Britannia Fruity Cake 150g', 'Britannia Chocolate Cake 150g', 'Britannia Butter Sponge Cake 150g', 'Britannia Pineapple Cake 150g', 'Britannia Marble Cake 150g',
      'Britannia Nut & Raisin Cake 150g', 'Britannia Choco Muffin 40g', 'Britannia Vanilla Muffin 40g', 'Britannia Cheese Cubes 200g', 'Britannia Cheese Slices 200g',
      'Britannia Cheese Block 200g', 'Britannia Cheese Spread Plain 180g', 'Britannia Cheese Spread Pepper 180g', 'Britannia Mozzarella Block 200g', 'Britannia Cow Ghee 500ml',
      'Britannia Butter 100g', 'Britannia Butter 500g', 'NutriChoice Diabetic Friendly 200g', 'NutriChoice Seeds & Almonds 150g', 'NutriChoice Multigrain Thins 100g',
      'Good Day Chunkies Dark 120g', 'Good Day Chunkies Milk 120g', 'Bourbon Choco Pocket Pack 60g', '50-50 Golmaal Savory 100g', 'Milk Bikis Cream Biscuits 100g',
      'Treat Wafers Chocolate 75g', 'Treat Wafers Vanilla 75g', 'Treat Wafers Strawberry 75g', 'Treat Wafers Orange 75g', 'Treat Choco Rolls 50g',
      'NutriChoice Ragi & Oats 150g', 'NutriChoice Quinoa Cookies 150g', 'Marie Gold Elaichi 120g', 'Good Day Rich Cashew 250g', 'Good Day Pista Delight 200g',
      'Toastea Garlic Herbed Rusk 200g', 'Toastea Multi Seed Rusk 250g', 'Tiger Butter Krunch 100g', 'Tiger Glucose Value Pack 1kg', 'Britannia Layer Cake Choco 120g',
      'Britannia Layer Cake Berry 120g', 'Britannia Brownie Bites 100g', 'Britannia Chocolate Swiss Roll 150g', 'Britannia Strawberry Swiss Roll 150g', 'Britannia Fruit Roly Poly 150g',
      'Britannia Pizza Cheese Shredded 200g', 'Britannia Masala Cheese Slices 200g', 'Britannia Cheezza Cheese Block 400g', 'Treat Crème Duo Choco 100g', 'Treat Crème Duo Berry 100g',
      'Little Hearts Jumbo Pack 150g', 'Good Day Hazelnut Cookies 120g', 'NutriChoice Sugarfree Digestive 350g', 'Britannia Tea Rusk Classic 500g', 'Britannia Milk Bikis Duo 150g'
    ],
  },
  nf: {
    category: 'Fruits & Vegetables',
    templates: [
      'Organic Cavendish Bananas 1kg', 'Robusta Bananas 1kg', 'Yellaki Small Bananas 500g', 'Red Delicious Apples 1kg', 'Fuji Sweet Apples 1kg',
      'Royal Gala Apples 1kg', 'Kinnow Mandarin Oranges 1kg', 'Nagpur Sweet Oranges 1kg', 'Valencia Juicing Oranges 1kg', 'Seedless Green Grapes 500g',
      'Black Seedless Grapes 500g', 'Red Globe Grapes 500g', 'Alphonso Mango Box 6pk', 'Kesar Sweet Mango Box 6pk', 'Banganapalli Mangoes 1kg',
      'Pomegranate Ruby Grains 250g', 'Fresh Whole Pomegranate 1kg', 'Papaya Semi Ripe 1pc', 'Golden Sweet Pineapple 1pc', 'Watermelon Striped 1pc',
      'Kiran Small Watermelon 1pc', 'Muskmelon Honey Sweet 1pc', 'Imported Green Kiwi 3pk', 'Golden Kiwi Imported 3pk', 'Hass Ripe Avocados 2pk',
      'Guava White Crunchy 1kg', 'Guava Pink Sweet 1kg', 'Dragon Fruit Red 1pc', 'Dragon Fruit White 1pc', 'Imported Blueberries Box 125g',
      'Fresh Strawberries Box 200g', 'Sweet Green Pears 1kg', 'Baby Kiwi Pack 250g', 'Plums Red Sweet 500g', 'Peaches Juicy Imported 500g',
      'Fresh Custard Apple 1kg', 'Chikoo Sapota 1kg', 'Green Fresh Coconuts 1pc', 'Tender Coconut Water 1pc', 'Sweet Tamarind Box 250g',
      'Hybrid Red Tomatoes 1kg', 'Desi Country Tomatoes 1kg', 'Cherry Tomatoes Box 250g', 'Red Onions Nasik 1kg', 'Sambhar Small Shallots 500g',
      'White Sweet Onions 1kg', 'Jyoti Grade Potatoes 1kg', 'Baby Potatoes Fresh 500g', 'Sweet Potatoes 500g', 'Ooty Clean Carrots 500g',
      'Red Winter Carrots 1kg', 'Crisp English Cucumbers 500g', 'Country Kheera 500g', 'Green Capsicum Bell Pepper 500g', 'Red Bell Pepper 2pk',
      'Yellow Bell Pepper 2pk', 'Tender Lady Finger Bhindi 500g', 'Green Beans French 500g', 'Broad Beans Flat 500g', 'Fresh Green Peas 500g',
      'Cauliflower Whole 1pc', 'Green Cabbage Head 1pc', 'Purple Red Cabbage 1pc', 'Broccoli Florets 1pc', 'Zucchini Green 2pk',
      'Zucchini Yellow 2pk', 'Mushroom Button Pack 200g', 'Portobello Mushroom Pack 150g', 'Palak Spinach Fresh 250g', 'Methi Fenugreek Leaves 250g',
      'Coriander Kothmir Bunch 100g', 'Pudina Mint Leaves Bunch 100g', 'Curry Leaves Fresh 100g', 'Green Chillies Spicy 250g', 'Garlic Whole Cloves 250g',
      'Ginger Fresh Root 250g', 'Lemon Yellow Juicy 6pk', 'Bitter Gourd Karela 500g', 'Bottle Gourd Lauki 1pc', 'Ridge Gourd Turai 500g',
      'Snake Gourd Chichinda 500g', 'Ash Gourd Petha 1pc', 'Raw Banana Green 3pk', 'Raw Mango Green 500g', 'Sweet Corn Cobs 2pk',
      'Baby Corn Peeled 200g', 'Fresh Drumsticks 250g', 'Beetroot Sweet 500g', 'Radish Mooli White 500g', 'Yam Suran Cleaned 500g',
      'Colocasia Arbi 500g', 'Spring Onion Green 1bunch', 'Iceberg Lettuce Head 1pc', 'Romaine Lettuce 1pc', 'Celery Sticks 250g',
      'Leek Fresh 250g', 'Parsley Italian 100g', 'Bok Choy Chinese Greens 250g', 'Basil Leaves Italian 50g', 'Fresh Asparagus Bunch 250g'
    ],
  },
  amul: {
    category: 'Dairy & Beverages',
    templates: [
      'Amul Taaza Toned Milk 1L', 'Amul Gold Full Cream Milk 1L', 'Amul Cow Milk 1L', 'Amul Diamond Milk 1L', "Amul Slim 'n' Trim 1L",
      'Amul Masti Dahi Tub 1kg', 'Amul Masti Dahi Pouch 400g', 'Amul Prolife Probiotic Dahi 400g', 'Amul Fresh Malai Paneer 200g', 'Amul Malai Paneer Block 1kg',
      'Amul Butter Pasteurized 100g', 'Amul Butter Salted 500g', 'Amul Unsalted Butter 500g', 'Amul Garlic & Herbs Butter 100g', 'Amul Processed Cheese Block 1kg',
      'Amul Cheese Slices 200g', 'Amul Cheese Slices 400g', 'Amul Cheese Cubes 200g', 'Amul Cheese Chiplets 200g', 'Amul Diced Mozzarella Blend 1kg',
      'Amul Pizza Cheese Shredded 200g', 'Amul Gouda Cheese 250g', 'Amul Pure Ghee Tin 1L', 'Amul Cow Ghee Jar 500ml', 'Amul High Aroma Cow Ghee 1L',
      'Amul Mithai Mate Condensed Milk 400g', 'Amul Kool Cafe Can 250ml', 'Amul Kool Koko Milkshake 200ml', 'Amul Kool Badam Milkshake 200ml', 'Amul Kool Kesar Milkshake 200ml',
      'Amul Kool Strawberry Milkshake 200ml', 'Amul Kool Mango Milkshake 200ml', 'Amul Masti Spiced Buttermilk 200ml', 'Amul Probiotic Buttermilk 200ml', 'Amul Lassi Rose Flavour 250ml',
      'Amul Lassi Mango Flavour 250ml', 'Amul Whipping Cream 1L', 'Amul Fresh Cream 250ml', 'Amul Shrikhand Kesar 500g', 'Amul Shrikhand Mango 500g',
      'Amul Gulab Jamun Tin 1kg', 'Amul Rasgulla Tin 1kg', 'Amul Dark Chocolate Bar 150g', 'Amul Milk Chocolate Bar 150g', "Amul Fruit 'n' Nut Bar 150g",
      'Amul Bitter 90% Dark Chocolate 150g', 'Amul Sugarfree Dark Chocolate 150g', 'Amul Frostik Ice Cream Bar 70ml', 'Amul Tricone Butterscotch 120ml', 'Amul Tricone Chocolate 120ml',
      'Amul Vanilla Magic Tub 1L', 'Amul Alphonso Gold Ice Cream 1L', 'Amul Chocolate Brownie Tub 1L', 'Amul Rajbhog Ice Cream 1L', 'Amul Kaju Draksh Ice Cream 1L',
      'Amul Sugar Free Ice Cream 500ml', 'Amul Dairy Whitener 1kg', 'Amul Sagar Skimmed Milk Powder 1kg', 'Amul Cheese Spread Plain 200g', 'Amul Cheese Spread Jalapeno 200g',
      'Amul Cheese Spread Oregano 200g', 'Amul Emmental Cheese 250g', 'Amul Pizza Topping 200g', 'Amul Malai Kulfi 60ml', 'Amul Cassata Slice 150ml',
      'Amul Choco Cracker Cone 100ml', 'Amul Ice Cream Sandwich 100ml', 'Amul Chocolish Drink 200ml', 'Amul Memory Milk Drink 200ml', 'Amul Stamina Herbal Drink 200ml',
      'Amul Camel Milk 500ml', 'Amul Camel Milk Chocolate 150g', 'Amul Goat Milk Pouch 500ml', 'Amul Organic Whole Wheat Atta 5kg', 'Amul Organic Arhar Dal 1kg',
      'Amul Organic Chana Dal 1kg', 'Amul Organic Moong Dal 1kg', 'Amul Organic Basmati Rice 5kg', 'Amul Brown Sugar 500g', 'Amul Organic Mustard Oil 1L',
      'Amul Frozen French Fries 400g', 'Amul Frozen Hash Browns 400g', 'Amul Frozen Aloo Tikki 400g', 'Amul Frozen Burger Patties 400g', 'Amul Frozen Cheese Poppers 300g',
      'Amul Butter Cookies Box 200g', 'Amul Cashew Cookies Box 200g', 'Amul Chocolate Chip Cookies 200g', 'Amul Bakery Toast 300g', 'Amul Pav Bhaji Butter 100g',
      'Amul White Dahi Pouch 500g', 'Amul Buffalo Milk 1L', 'Amul Buffalo Ghee Tin 1L', 'Amul Masti Spiced Chaas Tetra 1L', 'Amul Tru Orange Juice 200ml',
      'Amul Tru Mango Juice 200ml', 'Amul Tru Apple Juice 200ml', 'Amul Tru Guava Juice 200ml', 'Amul Fruit Cream 250ml', 'Amul Milk Peda Box 250g'
    ],
  },
  tc: {
    category: 'Beverages & Staples',
    templates: [
      'Tata Tea Premium 1kg', 'Tata Tea Gold 500g', 'Tata Tea Gold Leaf 250g', 'Tata Tea Agni 1kg', 'Tata Tea Elaichi Chai 250g',
      'Tata Tea Chakra Gold 500g', 'Tata Tea Kanan Devan 500g', 'Tata Tea Teaveda Herbal 250g', 'Tetley Green Tea Pure 25 Bags', 'Tetley Green Tea Lemon & Honey 25 Bags',
      'Tetley Green Tea Ginger & Mint 25 Bags', 'Tetley Green Tea Immunity 25 Bags', 'Tata Coffee Grand Classic 100g', 'Tata Coffee Gold Premium 100g', 'Tata Coffee Quick Filter 200g',
      'Tata Coffee Cafe Special 50g', 'Tata Salt Iodized 1kg', 'Tata Salt Lite Low Sodium 1kg', 'Tata Salt SuperLite 1kg', 'Tata Salt Crystal Rock Salt 1kg',
      'Tata Salt Black Salt Powder 500g', 'Tata Sampann Unpolished Toor Dal 1kg', 'Tata Sampann Chana Dal 1kg', 'Tata Sampann Moong Dal Split 1kg', 'Tata Sampann Moong Dal Whole 1kg',
      'Tata Sampann Urad Dal Split 1kg', 'Tata Sampann Urad Whole Black 1kg', 'Tata Sampann Masoor Malka Dal 1kg', 'Tata Sampann Kabuli Chana 1kg', 'Tata Sampann Kala Chana 1kg',
      'Tata Sampann Rajma Red 1kg', 'Tata Sampann Rajma Chitra 1kg', 'Tata Sampann Besan Gram Flour 500g', 'Tata Sampann Sattu Flour 500g', 'Tata Sampann Poha Thick 500g',
      'Tata Sampann Red Rice Poha 500g', 'Tata Sampann Turmeric Powder 200g', 'Tata Sampann Red Chilli Powder 200g', 'Tata Sampann Coriander Powder 200g', 'Tata Sampann Garam Masala 100g',
      'Tata Sampann Chicken Masala 100g', 'Tata Sampann Meat Masala 100g', 'Tata Sampann Sambhar Masala 100g', 'Tata Sampann Kitchen King Masala 100g', 'Tata Sampann Paneer Masala 100g',
      'Tata Sampann Pav Bhaji Masala 100g', 'Tata Sampann Chaat Masala 100g', 'Tata Sampann Chhole Masala 100g', 'Tata Sampann Biryani Masala 100g', 'Tata Sampann Kasuri Methi 50g',
      'Tata Sampann Hing Powder 50g', 'Tata Sampann Jeera Cumin Seeds 100g', 'Tata Sampann Mustard Seeds Rai 100g', 'Tata Sampann Black Pepper Whole 100g', 'Tata Sampann Clove Laung 50g',
      'Tata Sampann Green Cardamom 50g', 'Tata Sampann Dalchini Cinnamon 50g', 'Tata Sampann 100% Pure Kachi Ghani Mustard Oil 1L', 'Tata Simply Better Plant Based Nuggets 250g', 'Tata Simply Better Plant Based Burger Patty 250g',
      'Tata Soulfull Ragi Bites Choco 375g', 'Tata Soulfull Ragi Bites Vanilla 375g', 'Tata Soulfull Millet Muesli 400g', 'Tata Soulfull Crunchy Muesli Fruit & Nut 400g', 'Tata Soulfull Oats 1kg',
      'Tata Soulfull Masala Oats Peppy Tomato 40g', 'Tata Soulfull Masala Oats Mast Masala 40g', 'Tata Soulfull Ragi Flakes 400g', 'Tata Gluco Plus Orange Drink 200ml', 'Tata Gluco Plus Lemon Drink 200ml',
      'Tata Gluco Plus Apple Drink 200ml', 'Tata Copper Plus Water 1L', 'Himalayan Natural Mineral Water 1L', 'Himalayan Sparkling Water 300ml', 'Tata Q Ready Meal Chicken Biryani 330g',
      'Tata Q Ready Meal Veg Biryani 330g', 'Tata Q Ready Meal Rajma Rice 330g', 'Tata Q Ready Meal Cheesy Pasta 290g', 'Tata Tea Premium Care 500g', 'Tata Tea Fusion Red 250g',
      'Tata Salt Immuno Zinc 1kg', 'Tata Sampann Brown Rice 1kg', 'Tata Sampann Organic Moong Dal 500g', 'Tata Sampann Organic Turmeric 100g', 'Tata Sampann Kashmiri Mirch 100g',
      'Tata Sampann Shahi Paneer Masala 100g', 'Tata Sampann Dal Makhani Masala 100g', 'Tata Soulfull No Maida Choco Fills 250g', 'Tata Soulfull Strawberry Fills 250g', 'Tetley Cold Infusions Lemon 10 Bags',
      'Tetley Cold Infusions Berry 10 Bags', 'Tata Coffee Cold Brew Concentrate 200ml', 'Himalayan Honey Raw Organic 250g', 'Tata Sampann Roasted Foxnuts Makhana 100g', 'Tata Sampann Salted Makhana 100g',
      'Tata Sampann Peri Peri Makhana 100g', 'Tata Tea Elaichi Tea Bags 25pk', 'Tata Salt Pink Salt Grinder 100g', 'Tata Sampann Organic Ghee 500ml', 'Tata Soulfull Almond Crunchy Granola 350g'
    ],
  },
  itc: {
    category: 'Packaged Foods & Staples',
    templates: [
      'Aashirvaad Shudh Chakki Atta 5kg', 'Aashirvaad Select Sharbati Atta 5kg', 'Aashirvaad Multigrain Atta 5kg', 'Aashirvaad Sugar Release Atta 5kg', 'Aashirvaad Fortified Atta 5kg',
      'Aashirvaad Organic Whole Wheat Atta 5kg', 'Aashirvaad Svasti Pure Cow Ghee 1L', 'Aashirvaad Svasti Pure Ghee Jar 500ml', 'Aashirvaad Salt Iodized 1kg', 'Aashirvaad Instant Poha 80g',
      'Aashirvaad Instant Upma 80g', 'Aashirvaad Instant Suji Halwa 80g', 'Aashirvaad Turmeric Powder 200g', 'Aashirvaad Chilli Powder 200g', 'Aashirvaad Coriander Powder 200g',
      'Sunfeast Dark Fantasy Choco Fills 300g', 'Sunfeast Dark Fantasy Coffee Fills 75g', 'Sunfeast Dark Fantasy Bourbon 150g', 'Sunfeast Dark Fantasy Vanilla Fills 75g', "Sunfeast Mom's Magic Cashew & Almond 200g",
      "Sunfeast Mom's Magic Butter 200g", "Sunfeast Mom's Magic Rich Butter 300g", 'Sunfeast Bounce Choco Cream 100g', 'Sunfeast Bounce Orange Cream 100g', 'Sunfeast Bounce Elaichi Cream 100g',
      'Sunfeast Marie Light Active 250g', 'Sunfeast Marie Light Oats 200g', 'Sunfeast Glucose Biscuits 150g', 'Sunfeast Farmlite Digestive High Fiber 250g', 'Sunfeast Farmlite Oats & Almonds 150g',
      'Bingo! Mad Angles Achaari Masti 130g', 'Bingo! Mad Angles Chaat Masti 130g', 'Bingo! Mad Angles Tomato Madness 130g', 'Bingo! Tedhe Medhe Masala Tadka 90g', 'Bingo! Tedhe Medhe Achaari Masala 90g',
      'Bingo! Potato Chips Salt Sprinkled 100g', 'Bingo! Potato Chips Tomato 100g', 'Bingo! Potato Chips Masala 100g', 'Bingo! Hashtags Spicy Masala 85g', 'Bingo! No Rulz Cheese Curls 50g',
      'Yippee! Magic Masala Noodles 280g', 'Yippee! Power Up Masala Noodles 280g', 'Yippee! Mood Masala Noodles 280g', 'Yippee! Saucy Masala Noodles 260g', 'Yippee! Tricolor Pasta Treat Masala 70g',
      'Yippee! Tricolor Pasta Treat Tomato 70g', 'Yippee! Tricolor Pasta Treat Cheese 70g', 'B Natural Mixed Fruit Juice 1L', 'B Natural Mango Juice 1L', 'B Natural Guava Juice 1L',
      'B Natural Apple Juice 1L', 'B Natural Orange Juice 1L', 'B Natural Litchi Juice 1L', 'B Natural Pomegranate Juice 1L', 'B Natural Cranberry Juice 1L',
      'Fabelle Exquisite Dark Chocolate Mousse 100g', 'Fabelle Choco Deck Milk 100g', 'Fabelle Gianduja Box 150g', 'Fabelle Strawberry Cheesecake Bar 125g', 'Candyman Fantastik Choco Sticks 150g',
      'Candyman Toffichoo Strawberry 200g', 'Candyman Choco Double Eclairs 200g', 'Mint-o Fresh Chews Mint 100g', 'GumOn Mint Chewing Gum 50g', 'Kitchens of India Dal Bukhara 285g',
      'Kitchens of India Paneer Butter Masala 285g', 'Kitchens of India Mirch Ka Salan 285g', 'Kitchens of India Rajma Masala 285g', 'Kitchens of India Chicken Chettinad 285g', 'ITC Master Chef Crispy French Fries 420g',
      'ITC Master Chef Chilli Garlic Potato Shots 400g', 'ITC Master Chef Cheesy Corn Triangles 320g', 'ITC Master Chef Falafel Kebabs 320g', 'ITC Master Chef Chicken Nuggets 400g', 'ITC Master Chef Chicken Galouti Kebab 300g',
      'Aashirvaad Rava Suji 500g', 'Aashirvaad Maida Fine Flour 500g', 'Aashirvaad Besan 500g', 'Sunfeast Caker Swiss Roll Choco 40g', 'Sunfeast Caker Layer Cake 50g',
      'Sunfeast Caker Trinity Cake 50g', 'Sunfeast Farmlite Veda Digestive 250g', 'Bingo! Tedhe Medhe Cream & Onion 90g', 'Bingo! Mad Angles Pizza Twist 130g', 'Yippee! Korean Spicy Kimchi Noodles 120g',
      'Yippee! Cheese Burst Noodles 140g', 'B Natural Tender Coconut Water 200ml', 'B Natural Himalayan Mixed Fruit 1L', 'Fabelle Dark Choco Bar 80g', 'Candyman Fruity Fun Jar 500g',
      'ITC Master Chef Vegetable Spring Rolls 350g', 'ITC Master Chef Veg Burger Patty 360g', 'ITC Master Chef Chicken Seekh Kebab 320g', 'Aashirvaad Vermicelli Roasted 400g', 'Aashirvaad Svasti Paneer 200g',
      'Aashirvaad Svasti Curd Tub 400g', 'Aashirvaad Instant Sambar Mix 100g', 'Aashirvaad Instant Rasam Mix 100g', 'Sunfeast Dark Fantasy Yumfills Cake 150g', 'B Natural Pineapple Juice 1L'
    ],
  },
  hul: {
    category: 'Home & Personal Care',
    templates: [
      'Surf Excel Easy Wash Detergent Powder 1kg', 'Surf Excel Matic Front Load Powder 1kg', 'Surf Excel Matic Top Load Powder 1kg', 'Surf Excel Quick Wash Powder 1kg', 'Surf Excel Stain Eraser Bar 200g',
      'Surf Excel Matic Front Load Liquid 1L', 'Surf Excel Matic Top Load Liquid 1L', 'Rin Detergent Bar 250g', 'Rin Detergent Powder 1kg', 'Rin Refresh Lemon Powder 1kg',
      'Wheel 2 in 1 Detergent Powder 1kg', 'Wheel Green Lemon Detergent Bar 200g', 'Vim Dishwash Bar 300g', 'Vim Dishwash Gel Lemon 750ml', 'Vim Anti Smell Dishwash Gel 500ml',
      'Vim Scrubber Sponge 2pk', 'Domex Disinfectant Floor Cleaner 1L', 'Domex Fresh Guard Toilet Cleaner 750ml', 'Domex Bleach Liquid 500ml', 'Comfort After Wash Fabric Conditioner Lily 860ml',
      'Comfort Fabric Conditioner Morning Fresh 860ml', 'Dove Cream Beauty Bathing Bar 100g', 'Dove Pink Bathing Bar 100g', 'Dove Daily Shine Shampoo 650ml', 'Dove Hair Fall Rescue Shampoo 650ml',
      'Dove Intense Repair Conditioner 175ml', 'Dove Nourishing Body Wash 800ml', 'Dove Deeply Nourishing Body Lotion 400ml', 'Lifebuoy Total Soap Bar 125g', 'Lifebuoy Lemon Fresh Soap 125g',
      'Lifebuoy Handwash Refill Care 750ml', 'Lifebuoy Immunity Sanitizer 500ml', 'Lux Soft Touch Rose Bathing Bar 100g', 'Lux Velvet Glow Jasmine Soap 100g', 'Lux Magical Spell Body Wash 250ml',
      'Pears Pure & Gentle Soap Bar 125g', 'Pears Oil Clear Glycerine Soap 125g', 'Pears Soft Body Wash 250ml', 'Rexona Aloe Fresh Soap 100g', 'Rexona Men Deodorant Roll On 50ml',
      'Tresemme Keratin Smooth Shampoo 580ml', 'Tresemme Keratin Smooth Conditioner 190ml', 'Tresemme Hair Fall Defense Shampoo 580ml', 'Clinic Plus Strong & Long Shampoo 650ml', 'Clinic Plus Egg Protein Shampoo 340ml',
      'Sunsilk Black Shine Shampoo 650ml', 'Sunsilk Thick & Long Shampoo 650ml', 'Sunsilk Soft & Smooth Conditioner 180ml', 'Glow & Lovely Advanced Multivitamin Cream 50g', 'Glow & Handsome Instant Brightness Cream 50g',
      'Ponds White Beauty Daily Face Cream 50g', 'Ponds Pure White Mineral Clay Foam 100g', 'Ponds Super Light Gel Moisturizer 100g', 'Ponds Light Moisturiser 150ml', 'Ponds Cold Cream Gentle 100ml',
      'Ponds Magic Talc Fragrant 300g', 'Ponds Sandalwood Talcum Powder 300g', 'Vaseline Total Moisture Body Lotion 400ml', 'Vaseline Aloe Fresh Body Gel 250ml', 'Vaseline Intensive Care Cocoa Glow 400ml',
      'Vaseline Pure Skin Jelly 100g', 'Vaseline Lip Therapy Rosy Lips 10g', 'Axe Dark Temptation Deodorant Bodyspray 150ml', 'Axe Signature Gold Perfume 100ml', 'Axe Black Deodorant Spray 150ml',
      'Close Up Everfresh Red Hot Gel Toothpaste 150g', 'Close Up Diamond Attraction Toothpaste 100g', 'Pepsodent Expert Protection Toothpaste 140g', 'Pepsodent Germi Check Toothpaste 150g', 'Pepsodent Super Action Soft Toothbrush 4pk',
      'Simple Kind to Skin Refreshing Facial Wash 150ml', 'Simple Hydrating Light Moisturiser 125ml', 'Simple Micellar Cleansing Water 200ml', 'Love Beauty & Planet Murumuru Butter Shampoo 400ml', 'Love Beauty & Planet Argan Oil Hair Mask 200ml',
      'Horlicks Classic Malt Jar 500g', 'Horlicks Chocolate Delight 500g', 'Horlicks Health & Nutrition Drink 1kg', 'Boost Energy Drink Jar 500g', 'Boost Sports Drink Pouch 1kg',
      'Knorr Classic Mixed Vegetable Soup 40g', 'Knorr Sweet Corn Chicken Soup 42g', 'Knorr Tomato Chatpata Soup 45g', 'Kissan Fresh Tomato Ketchup 1kg', 'Kissan No Onion No Garlic Ketchup 1kg',
      'Kissan Mixed Fruit Jam Jar 500g', 'Kissan Pineapple Jam 500g', 'Taj Mahal Pure Indian Tea 500g', 'Red Label Natural Care Tea 500g', 'Red Label Strong Tea 1kg',
      'Bru Instant Coffee Powder Jar 100g', 'Bru Gold 100% Pure Coffee 100g', 'Bru Green Label Filter Coffee 500g', 'Surf Excel Matic Detergent Pods 15pk', 'Comfort Fabric Conditioner Delicate 860ml',
      'Dove Anti Dandruff Shampoo 340ml', 'Lifebuoy Alcohol Hand Rub 200ml', 'Ponds Charcoal Peel Off Mask 80g', 'Vaseline Healthy Bright Sunscreen SPF50 100ml', "Horlicks Mother's Plus Protein 500g"
    ],
  },
  nes: {
    category: 'Nutrition & Cereals',
    templates: [
      'Maggi 2-Minute Masala Instant Noodles 70g', 'Maggi 2-Minute Noodles 4pk 280g', 'Maggi Masala Noodles Super Pack 560g', 'Maggi Special Masala Noodles 280g', 'Maggi Atta Masala Noodles 290g',
      'Maggi Oats Masala Noodles 290g', 'Maggi Cuppa Masala Noodles 70g', 'Maggi Cuppa Chilly Chow Noodles 70g', 'Maggi Pazzta Masala Penne 65g', 'Maggi Pazzta Cheese Macaroni 70g',
      'Maggi Pazzta Tomato Twist 65g', 'Maggi Pazzta Mushroom Penne 65g', 'Maggi Magic Cubes Vegetarian 10pk', 'Maggi Magic Cubes Chicken 10pk', 'Maggi Masala-ae-Magic Seasoning 12pk',
      'Maggi Rich Tomato Ketchup Bottle 1kg', 'Maggi Hot & Sweet Chilli Sauce 1kg', 'Maggi No Onion No Garlic Tomato Sauce 1kg', 'Maggi Imli Pichkoo Sauce 90g', 'Maggi Sweet Chilli Sauce 200g',
      'Nescafe Classic Instant Coffee Jar 100g', 'Nescafe Classic Coffee Value Pack 200g', 'Nescafe Gold Premium Blend 100g', 'Nescafe Gold Dark Roast 100g', 'Nescafe Sunrise Instant Chicory Coffee 200g',
      'Nescafe Sunrise Filter Coffee 500g', 'Nescafe Ready to Drink Chilled Latte Can 180ml', 'Nescafe Intense Cold Coffee Can 180ml', 'Nescafe Hazelnut Cold Coffee Can 180ml', 'Nescafe 3 in 1 Coffee Sachets 10pk',
      'EveryDay Dairy Whitener Pouch 1kg', 'EveryDay Dairy Whitener Jar 400g', 'EveryDay Shahi Ghee Jar 500ml', 'KitKat 4 Finger Chocolate Bar 38g', 'KitKat 2 Finger Chocolate Bar 18g',
      'KitKat Chunky Chocolate Bar 40g', 'KitKat Dessert Delight Truffle 50g', 'KitKat Dessert Delight Brownie 50g', 'KitKat Rich Dark Chocolate 50g', 'KitKat Mini Moments 120g',
      'Munch Crunch Crisp Wafer Bar 10g', 'Munch Chocolate Mega Pack 180g', 'Munch Nuts Peanut Chocolate 32g', 'Munch Trio Crisp Wafer 45g', 'BarOne Chocolate Caramel Nougat 40g',
      'Milkybar White Chocolate Bar 25g', 'Milkybar Creamy White Slab 80g', 'Milkybar Moosha Caramel 40g', 'Milkybar Eclairs Pouch 200g', 'Polo The Mint with the Hole 15g',
      'Nestea Instant Iced Tea Lemon 400g', 'Nestea Peach Iced Tea Powder 400g', 'Nestlé Koko Krunch Chocolate Cereal 350g', 'Nestlé Koko Krunch Duo Wheat Cereal 350g', 'Nestlé Nesquik Chocolate Cereal 300g',
      'Nestlé Honey Gold Corn Flakes 300g', 'Nestlé Classic Corn Flakes 475g', 'Nestlé Cerelac Stage 1 Wheat Baby Cereal 300g', 'Nestlé Cerelac Stage 2 Rice Baby Cereal 300g', 'Nestlé Cerelac Stage 3 Fruits Baby Cereal 300g',
      'Nestlé Cerelac Stage 4 Multigrain Dal 300g', 'Nestlé Nan Pro 1 Infant Formula 400g', 'Nestlé Nan Pro 2 Follow-Up Formula 400g', 'Nestlé Nan Pro 3 Toddler Formula 400g', 'Nestlé Lactogen 1 Infant Milk 400g',
      'Nestlé Lactogen 2 Milk 400g', 'Nestlé Milkmaid Sweetened Condensed Milk 400g', 'Nestlé Slim UHT Skimmed Milk 1L', 'Nestlé A+ Toned UHT Milk 1L', 'Nestlé A+ Nourish Full Cream Milk 1L',
      'Nestlé A+ Probiotic Dahi Tub 400g', 'Nestlé Greek Yogurt Blueberry 100g', 'Nestlé Greek Yogurt Strawberry 100g', 'Nestlé Resource High Protein Powder 400g', 'Nestlé Peptamen GI Tube Feed 400g',
      'Maggi Fusilli Durum Wheat Pasta 500g', 'Maggi Penne Rigate Pasta 500g', 'Maggi Macaroni Elbow Pasta 500g', 'Maggi Sweet Corn Veg Soup 48g', 'Maggi Hot & Sour Veg Soup 44g',
      'Nescafe Cappuccino Premix 125g', 'Nescafe Choco Mocha Premix 125g', 'KitKat Green Tea Matcha Bar 35g', 'Munch Max Crunch Bar 30g', 'Milkybar Choo Chew Treats 100g',
      'Nestea Green Tea Lemon Powder 300g', 'Nestlé Neslac Growing Up Milk 400g', 'Nestlé Optifast Weight Loss Meal 400g', 'Nestlé Shredded Wheat Bites 375g', 'Maggi Fusilli White Sauce Mix 75g',
      'Maggi Penne Red Sauce Mix 75g', 'Maggi Peri Peri Seasoning Mix 60g', 'Maggi Pizza Seasoning Oregano 60g', 'Maggi Masala Chilli Garlic 100g', 'Nescafe Decaf Instant Coffee 100g',
      'EveryDay Ghee Pouch 1L', 'Nestlé A+ Masala Buttermilk 200ml', 'KitKat Caramel Crisp Bar 40g', 'Nestlé Milo Chocolate Malt Drink 200ml', 'Nestlé Milo Malt Powder Jar 400g'
    ],
  },
  parle: {
    category: 'Biscuits & Confectionery',
    templates: [
      'Parle-G Original Glucose Biscuits 100g', 'Parle-G Gold Premium Glucose 100g', 'Parle-G Super Value Pack 800g', 'Parle-G Oats & Berries 150g', 'Parle-G Chhota Bheem Pack 250g',
      'Monaco Salted Crackers 120g', 'Monaco Pizza Masala Crackers 120g', 'Monaco Piri Piri Crackers 120g', 'Monaco Classic Family Pack 400g', 'Krackjack Sweet & Salty Biscuits 120g',
      'Krackjack Butter Masala 120g', 'Krackjack Crunchy Cracker 300g', 'Hide & Seek Chocolate Chip Cookies 120g', 'Hide & Seek Choco Fills 100g', 'Hide & Seek Cafe Mocha 100g',
      'Hide & Seek Black Bourbon 150g', 'Hide & Seek Crème Sandwich 120g', 'Milano Choco Delight Cookies 75g', 'Milano Centre Filled Hazelnut 75g', 'Milano Mixed Berry Cookies 75g',
      'Top Butter Biscuits 150g', 'Top Gold Butter Cracker 200g', '20-20 Cashew Cookies 100g', '20-20 Butter Cookies 100g', '20-20 Pista Almond Cookies 100g',
      '20-20 Nice Coconut Biscuits 150g', 'Magix Chocolate Cream Biscuits 100g', 'Magix Orange Cream Biscuits 100g', 'Magix Elaichi Cream Biscuits 100g', 'Fab Chocolate Cream Biscuits 120g',
      'Fab Bourbon Cream Biscuits 150g', 'Fab Orange Burst Cream 120g', 'Parle Marie Choice Tea Biscuits 150g', 'Parle Marie Choice Oats 250g', 'Parle Rusk Real Elaichi 300g',
      'Parle Rusk Premium Butter 300g', 'Nutricrunch Digestive High Fibre 250g', 'Nutricrunch 7 Grain Digestive 200g', 'Nutricrunch Oats & Almonds 150g', 'Nutricrunch Sugar Free Cracker 300g',
      'Frooti Fresh Mango Drink 160ml', 'Frooti Fresh Mango Drink Tetra 1L', 'Frooti Pet Bottle 600ml', 'Appy Fizz Sparkling Apple Juice 160ml', 'Appy Fizz Sparkling Apple Juice Can 250ml',
      'Appy Fizz Pet Bottle 600ml', 'Appy Classic Apple Drink 200ml', 'B-Fizz Malt Flavoured Drink 160ml', 'B-Fizz Sparkling Drink Can 250ml', 'B-Fizz Pet Bottle 600ml',
      'Smoodh Chocolate Milkshake 85ml', 'Smoodh Toffee Caramel Milkshake 85ml', 'Smoodh Butterscotch Milkshake 85ml', 'Smoodh Hazelnut Chocolate 85ml', 'Bailey Packaged Drinking Water 1L',
      'Bailey Natural Mineral Water 500ml', 'Melody Chocolaty Caramel Candy 200g', 'Melody Chocolaty Jumbo Pack 400g', 'Mango Bite Juicy Hard Candy 200g', 'Kaccha Mango Bite Candy 200g',
      'Poppins Fruity Candy Roll 10pk', 'Kismi Toffee Classic Elaichi 200g', 'Kismi Toffee Kulfi Flavour 200g', 'Kismi Toffee Rose Flavour 200g', 'Kismi Assorted Bar 100g',
      'Londonderry Milk Caramel Candy 200g', 'Rola Cola Vintage Cola Candies 150g', 'Mazelo Fruit Candies Pouch 200g', 'Fruitmans Orange Chews 150g', 'Chox Full Cream Toffee 200g',
      'Parle Wafers Simply Salted 75g', 'Parle Wafers Masala Masti 75g', 'Parle Wafers Cream & Onion 75g', 'Parle Wafers Tangy Tomato 75g', 'Parle Fulltoss Tomato Pinch 80g',
      'Parle Fulltoss Masala Mania 80g', 'Parle Namkeen Bhujia Sev 200g', 'Parle Namkeen Aloo Bhujia 200g', 'Parle Namkeen Moong Dal Salted 200g', 'Parle Namkeen Khatta Meetha 200g',
      'Parle Namkeen Mixture Spicy 200g', 'Parle Namkeen Ratlami Sev 200g', 'Parle Namkeen Salted Peanuts 150g', 'Parle Namkeen Masala Peanuts 150g', 'Hide & Seek Choco Rolls 60g',
      'Milano Cranberry Cookies 100g', '20-20 Choco Chip Cookies 150g', 'Parle-G Royale Butter Rich 150g', 'Frooti Mango Fizzy Can 250ml', 'Appy Sparkling Berry Drink 250ml',
      'Smoodh Cold Coffee Shake 150ml', 'Kismi Chocolate Bar 50g', 'Melody Dark Cocoa Toffee 250g', 'Mango Bite Jelly Pops 150g', 'Parle Rusk Multigrain 300g',
      'Monaco Cheeseling Salted 150g', 'Monaco Cheeseling Herb 150g', 'Parle Namkeen Tasty Nuts 150g', 'Parle Namkeen Chana Jor Garam 150g', 'Hide & Seek Vanilla Rolls 60g'
    ],
  },
  mrf: {
    category: 'Edible Oils & Foods',
    templates: [
      'Saffola Gold Pro Healthy Lifestyle Oil 1L', 'Saffola Gold Pro Healthy Lifestyle Oil 5L', 'Saffola Total Pro Heart Care Oil 1L', 'Saffola Total Pro Heart Care Oil 5L', 'Saffola Active Pro Weight Watchers Oil 1L',
      'Saffola Active Pro Weight Watchers Oil 5L', 'Saffola Tasty Edible Blend Oil 1L', 'Saffola Tasty Edible Blend Oil 5L', 'Saffola Aura Extra Virgin Olive Oil 500ml', 'Saffola Aura Refined Olive Oil 1L',
      'Saffola Masala Oats Classic Masala 500g', 'Saffola Masala Oats Peppy Tomato 500g', 'Saffola Masala Oats Veggie Twist 500g', 'Saffola Masala Oats Curry & Pepper 500g', 'Saffola Masala Oats Masala & Coriander 500g',
      'Saffola Masala Oats Karari Tadka 500g', 'Saffola Plain Rolled Oats 1kg', 'Saffola Rolled Oats High Fiber 500g', 'Saffola Honey 100% Pure NMR Tested 500g', 'Saffola Honey Active Squeezy 250g',
      'Saffola FITTIFY Peanut Butter Crunchy 400g', 'Saffola FITTIFY Peanut Butter Creamy 400g', 'Saffola FITTIFY Dark Chocolate Peanut Butter 375g', 'Saffola FITTIFY Green Coffee Lemon Mint 15pk', 'Saffola FITTIFY Hi Protein Shake Mango 400g',
      'Saffola FITTIFY Hi Protein Shake Swiss Choco 400g', 'Saffola Immuniveda Chyawanprash 500g', 'Saffola Immuniveda Kadha Mix 80g', 'Saffola Immuniveda Golden Turmeric Milk Mix 400g', 'Saffola Mealmaker Soya Chunks 200g',
      'Saffola Mealmaker Soya Mini Chunks 200g', 'Saffola Mealmaker Soya Granules 200g', 'Saffola Oodles Ring Noodles Masala 184g', 'Saffola Oodles Ring Noodles Tomato 184g', 'Saffola Mayonnaise Classic Eggless 350g',
      'Parachute 100% Pure Coconut Oil Bottle 500ml', 'Parachute Coconut Oil Blue Bottle 250ml', 'Parachute Coconut Oil Easy Jar 1L', 'Parachute Advansed Aloe Vera Hair Oil 250ml', 'Parachute Advansed Jasmine Coconut Hair Oil 300ml',
      'Parachute Advansed Ayurvedic Hair Oil 300ml', 'Parachute Advansed Onion Hair Oil 200ml', 'Parachute Advansed Gold Coconut Oil 400ml', 'Parachute Advansed Baby Nourishing Oil 200ml', 'Parachute Advansed Baby Massage Oil 100ml',
      'Parachute Advansed Body Lotion Deep Nourish 400ml', 'Parachute Advansed Soft Touch Lotion 400ml', 'Parachute Advansed Refreshing Body Gel 250ml', 'Nihar Naturals Shanti Amla Badam Hair Oil 300ml', 'Nihar Naturals Sarson Kesh Tel Mustard 500ml',
      'Nihar Naturals Coconut & Methi Hair Oil 400ml', 'Nihar Naturals Jasmine Fragrance Hair Oil 300ml', 'Mediker Anti Lice Treatment Oil 125ml', 'Mediker Anti Lice Shampoo 100ml', 'Livon Hair Serum with Vitamin E 100ml',
      'Livon Anti Frizz Hair Serum 50ml', 'Livon Shake & Spray Hair Serum 100ml', 'Set Wet Hair Gel Cool Hold 150ml', 'Set Wet Hair Gel Vertical Hold 150ml', 'Set Wet Hair Gel Wet Look 150ml',
      'Set Wet Deodorant Spray Cool Avatar 150ml', 'Set Wet Deodorant Spray Mischief 150ml', 'Set Wet Deodorant Spray Charm Avatar 150ml', 'Set Wet Studio X Charcoal Face Wash 100ml', 'Set Wet Matte Hair Wax 60g',
      'Coco Soul Cold Pressed Virgin Coconut Oil 500ml', 'Coco Soul Organic Extra Virgin Coconut Oil 250ml', 'Coco Soul Coconut Milk Powder 300g', 'Coco Soul Coconut Sugar 250g', 'Coco Soul Coconut Butter Spread 200g',
      'Beardo Godfather Beard Oil 30ml', 'Beardo Dark Fantasy Beard Wash 100ml', 'Beardo Hair Growth Oil 50ml', 'Beardo Charcoal Peel Off Mask 100g', 'Beardo De-Tan Body Wash 200ml',
      'Just Herbs Silksplash Neem Face Wash 100ml', 'Just Herbs Ayurvedic Lip Tint 8g', 'Just Herbs Kimsukadi Glow Taila 15ml', 'Saffola Crunchiek Masala Multigrain Snacks 60g', 'Saffola Masala Oats Chinese 40g',
      'Saffola Masala Oats Italian 40g', 'Saffola Gold Blended Oil Can 15L', 'Saffola Total Blended Oil Pouch 1L', 'Saffola Active Blended Oil Pouch 1L', 'Parachute Hot Deep Conditioning Oil 200ml',
      'Parachute Scalp Therapy Anti Dandruff Oil 100ml', 'Parachute Advansed Men After Shower Hair Cream 100g', 'Livon Crème Hair Color Natural Black 60ml', 'Set Wet Glaze Hair Clay 60g', 'Saffola Honey Organic Forest Honey 250g',
      'Saffola Roasted Makhana Cheesy 100g', 'Saffola Roasted Makhana Pudina 100g', 'Saffola Roasted Makhana Salted 100g', 'Saffola Soya Bhurji Instant Mix 120g', 'Coco Soul Coconut Water Drink 200ml',
      'Parachute Advansed Soft Hands Cream 50g', 'Parachute Advansed Coconut Foot Cream 50g', 'Set Wet Cool Blue Pocket Perfume 18ml', 'Set Wet Citrus Rush Pocket Perfume 18ml', 'Saffola Sesame Gingelly Cooking Oil 1L'
    ],
  },
};

// Generate exactly 100 products per supplier (1,000 products total)
const allProducts = [];
let totalCount = 0;

for (const sup of suppliers) {
  const catData = catalogMap[sup.id];
  const templates = catData.templates;
  for (let i = 0; i < 100; i++) {
    totalCount++;
    const numStr = String(i + 1).padStart(3, '0');
    const id = `${sup.id}-${numStr}`;
    const sku = `${sup.id.toUpperCase()}-${numStr}`;
    const name = templates[i] || `${sup.name} Retail Item ${i + 1}`;
    
    // Determine category
    let category = sup.category;
    if (category.includes('&')) {
      const parts = category.split('&').map(s => s.trim());
      category = parts[i % parts.length];
    }

    // Realistic stock, target, cost distribution
    // ~25% critical (stock <= 50% target)
    // ~35% low (stock < target && stock > 50% target)
    // ~40% healthy (stock >= target)
    let target = 20 + ((i * 7) % 65); // 20 to 85
    let currentStock;
    let selected = 0;
    
    if (i < 25) {
      // Critical
      currentStock = Math.max(1, Math.floor(target * (0.1 + ((i % 4) * 0.1))));
      // First 3 items selected for initial state
      if (sup.id === 'hf' && i < 3) selected = 1;
      if (sup.id === 'bi' && i < 3) selected = 1;
    } else if (i < 60) {
      // Low stock
      currentStock = Math.floor(target * (0.55 + ((i % 5) * 0.08)));
    } else {
      // Healthy
      currentStock = target + ((i * 3) % 25);
    }
    
    let orderQty = Math.max(0, target - currentStock);
    if (orderQty === 0 && i < 25) orderQty = 15;
    
    // Realistic retail cost in INR (20 to 650)
    let unitCost = 25 + ((i * 19 + sup.name.length * 13) % 480);
    if (unitCost % 5 !== 0) unitCost = Math.round(unitCost / 5) * 5;

    allProducts.push({
      id,
      sku,
      name,
      category,
      supplier_id: sup.id,
      current_stock: currentStock,
      safety_target: target,
      order_qty: orderQty,
      unit_cost: unitCost,
      selected,
    });
  }
}

console.log(`Generated ${suppliers.length} suppliers and ${allProducts.length} products.`);

// Build seed.js file content
const fileContent = `// src/db/seed.js
// High-volume retail seed data: 10 Indian FMCG/Produce suppliers & 1,000 catalog products (100 per supplier)

export const SEED_SUPPLIERS = ${JSON.stringify(suppliers, null, 2)};

export const SEED_PRODUCTS = ${JSON.stringify(allProducts, null, 2)};

export const SEED_PURCHASE_ORDERS = [
  {
    id: 'po-bi-hist-1',
    po_number: 'PO-2026-042',
    supplier_id: 'bi',
    status: 'submitted',
    subtotal: 8450,
    tax: 0,
    total_amount: 8450,
    notes: 'Bi-weekly biscuits restocking batch',
    created_at: '2026-10-12T10:30:00Z',
    updated_at: '2026-10-12T10:30:00Z',
    items: [
      {
        id: 'poi-bi-1',
        product_id: 'bi-001',
        sku: 'BI-001',
        name: 'Good Day Butter Cookies 100g',
        quantity: 100,
        unit_price: 30,
        subtotal: 3000,
      },
      {
        id: 'poi-bi-2',
        product_id: 'bi-003',
        sku: 'BI-003',
        name: 'Bourbon Chocolate Cream 150g',
        quantity: 70,
        unit_price: 35,
        subtotal: 2450,
      },
      {
        id: 'poi-bi-3',
        product_id: 'bi-004',
        sku: 'BI-004',
        name: 'NutriChoice Digestive 200g',
        quantity: 60,
        unit_price: 50,
        subtotal: 3000,
      },
    ],
  },
  {
    id: 'po-nf-hist-1',
    po_number: 'PO-2026-078',
    supplier_id: 'nf',
    status: 'submitted',
    subtotal: 6240,
    tax: 0,
    total_amount: 6240,
    notes: 'Daily fresh produce dispatch',
    created_at: '2026-10-08T07:45:00Z',
    updated_at: '2026-10-08T07:45:00Z',
    items: [
      {
        id: 'poi-nf-1',
        product_id: 'nf-001',
        sku: 'NF-001',
        name: 'Organic Cavendish Bananas 1kg',
        quantity: 40,
        unit_price: 60,
        subtotal: 2400,
      },
      {
        id: 'poi-nf-2',
        product_id: 'nf-004',
        sku: 'NF-004',
        name: 'Hybrid Red Tomatoes 1kg',
        quantity: 50,
        unit_price: 45,
        subtotal: 2250,
      },
      {
        id: 'poi-nf-3',
        product_id: 'nf-005',
        sku: 'NF-005',
        name: 'Red Onions Nasik 1kg',
        quantity: 42,
        unit_price: 38,
        subtotal: 1590,
      },
    ],
  },
];
`;

fs.writeFileSync('src/db/seed.js', fileContent, 'utf8');
console.log('Successfully wrote src/db/seed.js with 1,000 products!');
