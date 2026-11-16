/**
 * src/screens/FoodOrderScreen.jsx — Production Swiggy-style food ordering
 *
 * Layout:
 *   Restaurant List  → full-width card grid
 *   Menu View        → 2-col: menu items (left) + LIVE cart sidebar (right)
 *   Checkout View    → 2-col: address/payment steps (left) + bill summary (right)
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Star, Clock, Bike, MapPin, Plus, Minus, X,
  CheckCircle, Leaf, Package, ChevronLeft, Tag, AlertCircle,
  RefreshCw, MessageSquare, CreditCard, User, ShieldCheck,
  ChevronRight, Home, Briefcase, Navigation,
} from 'lucide-react';
import api from '../api/client';
import { useCity } from '../contexts/CityContext';
import { useAuth } from '../contexts/AuthContext';

/* ────────────────────────────────────────────────────────────────────
   Constants
──────────────────────────────────────────────────────────────────── */
const DELIVERY_FEE = 42;
const GST_RATE     = 0.18;   // 18% GST + other charges (matches Swiggy)

/* ────────────────────────────────────────────────────────────────────
   Distinct, Authentic Food & Restaurant Visuals Engine
──────────────────────────────────────────────────────────────────── */
const DISH_IMG = {
  // AI-generated authentic local specialties + unique high-definition food photography
  'Chicken Biryani':           '/assets/images/food/chicken_biryani.jpg',
  'Veg Biryani':               'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=320&h=240&fit=crop',
  'Paneer Butter Masala':      'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=320&h=240&fit=crop',
  'Dal Makhani':               'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=320&h=240&fit=crop',
  'Garlic Naan':               '/assets/images/food/garlic_naan.jpg',
  'Gulab Jamun':               'https://images.unsplash.com/photo-1666695630945-0dddb75f1a4c?w=320&h=240&fit=crop',
  'Mango Lassi':               'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=320&h=240&fit=crop',
  'Masala Dosa':               'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=320&h=240&fit=crop',
  'Idli Sambar':               'https://images.unsplash.com/photo-1630383249896-424e482df921?w=320&h=240&fit=crop',
  'Chole Bhature':             'https://images.unsplash.com/photo-1626776877900-f7a2d1bd2d6a?w=320&h=240&fit=crop',
  'Rajma Chawal':              'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=320&h=240&fit=crop',
  'Aloo Paratha':              'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d6?w=320&h=240&fit=crop',
  'Butter Chicken':            'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=320&h=240&fit=crop',
  'Mutton Rogan Josh':         'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=320&h=240&fit=crop',
  'Chicken Tikka Masala':      'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=320&h=240&fit=crop',
  'Prawn Koliwada':            'https://images.unsplash.com/photo-1559847844-5315695dadae?w=320&h=240&fit=crop',
  'Fish Curry':                'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=320&h=240&fit=crop',
  'Crab Masala':               'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=320&h=240&fit=crop',
  'Chettinad Chicken Curry':   'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=320&h=240&fit=crop',
  'Margherita Pizza':          'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=320&h=240&fit=crop',
  'Classic Burger':            'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=320&h=240&fit=crop',
  'Pad Thai':                  'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=320&h=240&fit=crop',
  'Chocolate Lava Cake':       'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=320&h=240&fit=crop',
  'Fresh Lime Soda':           'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=320&h=240&fit=crop',
  'Filter Coffee':             'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=320&h=240&fit=crop',
  'Kheer':                     'https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=320&h=240&fit=crop',
  'Payasam':                   'https://images.unsplash.com/photo-1579954115563-e72bf1381629?w=320&h=240&fit=crop',
};

const FALLBACK_DISH = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=320&h=240&fit=crop';

const RESTAURANT_THEMATIC_IMGS = [
  { keyword: 'coastal',   img: 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=800&h=450&fit=crop' },
  { keyword: 'seafood',   img: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&h=450&fit=crop' },
  { keyword: 'north',     img: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&h=450&fit=crop' },
  { keyword: 'mughlai',   img: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=450&fit=crop' },
  { keyword: 'biryani',   img: '/assets/images/food/chicken_biryani.jpg' },
  { keyword: 'south',     img: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800&h=450&fit=crop' },
  { keyword: 'chettinad', img: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=800&h=450&fit=crop' },
  { keyword: 'italian',   img: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=450&fit=crop' },
  { keyword: 'pizza',     img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&h=450&fit=crop' },
  { keyword: 'burger',    img: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&h=450&fit=crop' },
  { keyword: 'cafe',      img: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&h=450&fit=crop' },
  { keyword: 'bakery',    img: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&h=450&fit=crop' },
  { keyword: 'chinese',   img: 'https://images.unsplash.com/photo-1526318896980-cf78c088247c?w=800&h=450&fit=crop' },
  { keyword: 'tea',       img: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800&h=450&fit=crop' },
  { keyword: 'multi',     img: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=450&fit=crop' },
];

const DIVERSE_RESTAURANT_AMPLIFIERS = [
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=450&fit=crop',
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=450&fit=crop',
  'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&h=450&fit=crop',
  'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=800&h=450&fit=crop',
  'https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?w=800&h=450&fit=crop',
  'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&h=450&fit=crop',
  'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=800&h=450&fit=crop',
  'https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?w=800&h=450&fit=crop',
];

function hashFoodString(str = '') {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function dishImg(name = '') {
  const n = name.trim().toLowerCase();
  for (const [k, v] of Object.entries(DISH_IMG)) {
    if (n.includes(k.toLowerCase())) return v;
  }
  return FALLBACK_DISH;
}

function restaurantImg(cuisine = '', name = '') {
  const combined = `${cuisine} ${name}`.toLowerCase();
  for (const item of RESTAURANT_THEMATIC_IMGS) {
    if (combined.includes(item.keyword)) return item.img;
  }
  const idx = hashFoodString(name || cuisine) % DIVERSE_RESTAURANT_AMPLIFIERS.length;
  return DIVERSE_RESTAURANT_AMPLIFIERS[idx];
}

/* ────────────────────────────────────────────────────────────────────
   Menus
──────────────────────────────────────────────────────────────────── */
const MENUS = {
  default: [
    { id: 'm1', name: 'Veg Biryani',         desc: 'Fragrant basmati, saffron, caramelised onions',           price: 249, veg: true,  star: true,  cal: 520, mins: 25 },
    { id: 'm2', name: 'Chicken Tikka Masala',desc: 'Tandoor-marinated chicken in smoky tomato gravy',         price: 329, veg: false, star: true,  cal: 640, mins: 30 },
    { id: 'm3', name: 'Paneer Butter Masala',desc: 'Cottage cheese in rich, velvety butter-tomato sauce',     price: 289, veg: true,  star: false, cal: 490, mins: 20 },
    { id: 'm4', name: 'Dal Makhani',         desc: 'Slow-cooked black lentils, cream and spices',            price: 219, veg: true,  star: false, cal: 380, mins: 15 },
    { id: 'm5', name: 'Chicken Biryani',     desc: 'Dum-cooked layers of rice and spiced chicken',           price: 349, veg: false, star: true,  cal: 720, mins: 35 },
    { id: 'm6', name: 'Garlic Naan',         desc: 'Leavened bread brushed with garlic butter (2 pcs)',      price: 89,  veg: true,  star: false, cal: 260, mins: 10 },
    { id: 'm7', name: 'Gulab Jamun',         desc: 'Soft milk-solid dumplings in rose sugar syrup (4 pcs)', price: 99,  veg: true,  star: false, cal: 360, mins: 5  },
    { id: 'm8', name: 'Mango Lassi',         desc: 'Thick yoghurt blended with Alphonso mango pulp',        price: 129, veg: true,  star: false, cal: 240, mins: 5  },
  ],
  coastal: [
    { id: 'c1', name: 'Prawn Koliwada',  desc: 'Crispy batter-fried prawns, spicy masala',         price: 399, veg: false, star: true,  cal: 580, mins: 20 },
    { id: 'c2', name: 'Fish Curry',      desc: 'Kingfish in tangy coconut-kokum Goan curry',       price: 369, veg: false, star: false, cal: 520, mins: 25 },
    { id: 'c3', name: 'Crab Masala',     desc: 'Mud crab slow-cooked in spicy Malvani gravy',     price: 549, veg: false, star: true,  cal: 480, mins: 40 },
    { id: 'c4', name: 'Mango Lassi',     desc: 'Kokum & coconut milk digestive',                  price: 89,  veg: true,  star: false, cal: 90,  mins: 5  },
    { id: 'c5', name: 'Garlic Naan',     desc: 'Crispy semolina-coated fillets',                  price: 279, veg: false, star: false, cal: 340, mins: 15 },
  ],
  north: [
    { id: 'n1', name: 'Butter Chicken',    desc: 'Tender chicken in velvety tomato-cream sauce',      price: 319, veg: false, star: true,  cal: 650, mins: 25 },
    { id: 'n2', name: 'Rajma Chawal',      desc: 'Kidney bean curry with steamed basmati rice',       price: 199, veg: true,  star: false, cal: 560, mins: 20 },
    { id: 'n3', name: 'Chole Bhature',     desc: 'Spiced chickpeas with puffy deep-fried bread',     price: 179, veg: true,  star: true,  cal: 780, mins: 20 },
    { id: 'n4', name: 'Mutton Rogan Josh', desc: 'Kashmiri braised lamb with whole spices',           price: 449, veg: false, star: false, cal: 590, mins: 40 },
    { id: 'n5', name: 'Aloo Paratha',      desc: 'Stuffed flatbread, served with curd & pickle',     price: 149, veg: true,  star: false, cal: 480, mins: 15 },
    { id: 'n6', name: 'Kheer',             desc: 'Rice pudding with cardamom and saffron',           price: 119, veg: true,  star: false, cal: 310, mins: 5  },
  ],
  south: [
    { id: 's1', name: 'Masala Dosa',           desc: 'Crispy rice crepe with spiced potato filling',    price: 159, veg: true,  star: true,  cal: 460, mins: 20 },
    { id: 's2', name: 'Idli Sambar',           desc: 'Steamed rice cakes with tangy lentil sambar',    price: 129, veg: true,  star: false, cal: 320, mins: 15 },
    { id: 's3', name: 'Chettinad Chicken Curry',desc: 'Fiery Tamil Nadu spiced chicken',              price: 349, veg: false, star: true,  cal: 610, mins: 30 },
    { id: 's4', name: 'Filter Coffee',         desc: 'Strong South Indian decoction with frothy milk', price: 79,  veg: true,  star: false, cal: 120, mins: 5  },
    { id: 's5', name: 'Payasam',               desc: 'Vermicelli in sweetened coconut milk',          price: 109, veg: true,  star: false, cal: 280, mins: 5  },
  ],
  multi: [
    { id: 'mc1', name: 'Margherita Pizza',     desc: 'San Marzano tomato, buffalo mozzarella, basil',  price: 299, veg: true,  star: true,  cal: 580, mins: 25 },
    { id: 'mc2', name: 'Classic Burger',       desc: 'Beef patty, cheddar, caramelised onions',        price: 279, veg: false, star: false, cal: 650, mins: 20 },
    { id: 'mc3', name: 'Pad Thai',             desc: 'Stir-fried rice noodles, peanuts, lime',         price: 319, veg: false, star: false, cal: 540, mins: 25 },
    { id: 'mc4', name: 'Chocolate Lava Cake',  desc: 'Warm chocolate sponge with a molten centre',     price: 199, veg: true,  star: true,  cal: 520, mins: 10 },
    { id: 'mc5', name: 'Fresh Lime Soda',      desc: 'Sparkling water, lime, mint, black salt',        price: 89,  veg: true,  star: false, cal: 40,  mins: 5  },
  ],
};

function menuFor(cuisine = '') {
  const c = cuisine.toLowerCase();
  if (c.includes('coastal') || c.includes('seafood')) return MENUS.coastal;
  if (c.includes('north'))  return MENUS.north;
  if (c.includes('south'))  return MENUS.south;
  if (c.includes('multi') || c.includes('italian') || c.includes('continental')) return MENUS.multi;
  return MENUS.default;
}

/* ────────────────────────────────────────────────────────────────────
   Fallback restaurant data
──────────────────────────────────────────────────────────────────── */
function fallbackRestaurants() {
  return [
    { id: 101, name: 'The Coastal Kitchen', city: 'Mumbai',    cuisine: 'Coastal / Seafood', avg_rating: 4.4, price_for_two: 1800, avg_prep_time_mins: 25 },
    { id: 102, name: 'Spice Route',         city: 'Mumbai',    cuisine: 'North Indian',      avg_rating: 4.2, price_for_two: 1200, avg_prep_time_mins: 30 },
    { id: 103, name: 'The Globe Grille',    city: 'Delhi',     cuisine: 'Multi-cuisine',     avg_rating: 4.5, price_for_two: 2200, avg_prep_time_mins: 35 },
    { id: 104, name: 'Udupi Palace',        city: 'Bangalore', cuisine: 'South Indian',      avg_rating: 4.3, price_for_two: 600,  avg_prep_time_mins: 20 },
    { id: 105, name: 'Haji Ali Biryani',    city: 'Mumbai',    cuisine: 'North Indian',      avg_rating: 4.6, price_for_two: 900,  avg_prep_time_mins: 28 },
    { id: 106, name: 'Dakshin',             city: 'Chennai',   cuisine: 'South Indian',      avg_rating: 4.4, price_for_two: 1400, avg_prep_time_mins: 25 },
  ];
}

/* ────────────────────────────────────────────────────────────────────
   Small helpers
──────────────────────────────────────────────────────────────────── */
function VegDot({ veg, size = 16 }) {
  return (
    <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width: size+2, height: size+2, border:`2px solid ${veg?'#22c55e':'#ef4444'}`, borderRadius:3, flexShrink:0 }}>
      <span style={{ width: size-6, height: size-6, borderRadius:'50%', background: veg?'#22c55e':'#ef4444', display:'block' }} />
    </span>
  );
}

function Stars({ value }) {
  if (!value) return null;
  const c = value >= 4.4 ? '#22c55e' : value >= 4.0 ? '#f59e0b' : '#9ca3af';
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:3, fontSize:'0.8rem', fontWeight:700, color:c }}>
      <Star size={11} fill="currentColor" />{Number(value).toFixed(1)}
    </span>
  );
}

function cartTotal(cart) { return Object.values(cart).reduce((s, {item,qty})=>s+item.price*qty, 0); }
function cartCount(cart)  { return Object.values(cart).reduce((s, {qty})=>s+qty, 0); }

/* ────────────────────────────────────────────────────────────────────
   Cart Sidebar (right column on menu view)
──────────────────────────────────────────────────────────────────── */
function CartSidebar({ cart, restaurantName, onAdd, onRemove, onCheckout }) {
  const sub   = cartTotal(cart);
  const gst   = +(sub * GST_RATE).toFixed(2);
  const total = sub + DELIVERY_FEE + gst;
  const items = Object.values(cart);
  const count = cartCount(cart);

  return (
    <div style={{
      width: 320, flexShrink: 0,
      position: 'sticky', top: 80,
      alignSelf: 'flex-start',
      background: '#ffffff',
      borderRadius: 12,
      boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
      overflow: 'hidden',
      color: '#1c1c1c',
      border: '1px solid #e9e9eb',
      maxHeight: 'calc(100vh - 100px)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Restaurant header */}
      <div style={{ background: '#fc8019', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.2rem', flexShrink:0 }}>🧾</div>
        <div>
          <div style={{ fontWeight: 800, color: '#fff', fontSize: '0.9rem' }}>{restaurantName}</div>
          <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.85)' }}>{count} item{count!==1?'s':''} in cart</div>
        </div>
      </div>

      {/* Item list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
        {items.length === 0 ? (
          <div style={{ textAlign:'center', padding:'40px 0', color:'#9ca3af' }}>
            <div style={{ fontSize:'2rem', marginBottom:8 }}>🛒</div>
            <div style={{ fontWeight:600 }}>Your cart is empty</div>
            <div style={{ fontSize:'0.78rem', marginTop:4 }}>Add items to get started</div>
          </div>
        ) : items.map(({ item, qty }) => (
          <div key={item.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 0', borderBottom:'1px solid #f0f0f0' }}>
            <VegDot veg={item.veg} />
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:'0.85rem', fontWeight:700, color:'#1c1c1c', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.name}</div>
              <div style={{ fontSize:'0.75rem', color:'#686b78' }}>₹{item.price}</div>
            </div>
            {/* Qty controls */}
            <div style={{ display:'flex', alignItems:'center', border:'1.5px solid #fc8019', borderRadius:6, overflow:'hidden', flexShrink:0 }}>
              <button id={`cart-dec-${item.id}`} onClick={()=>onRemove(item)} style={{ background:'none', color:'#fc8019', padding:'4px 9px', cursor:'pointer', fontWeight:800, lineHeight:1 }}><Minus size={12}/></button>
              <span style={{ minWidth:20, textAlign:'center', fontWeight:800, fontSize:'0.85rem', color:'#fc8019' }}>{qty}</span>
              <button id={`cart-inc-${item.id}`} onClick={()=>onAdd(item)} style={{ background:'none', color:'#fc8019', padding:'4px 9px', cursor:'pointer', fontWeight:800, lineHeight:1 }}><Plus size={12}/></button>
            </div>
            <span style={{ fontWeight:800, fontSize:'0.85rem', color:'#1c1c1c', minWidth:44, textAlign:'right' }}>₹{(item.price*qty).toFixed(0)}</span>
          </div>
        ))}

        {items.length > 0 && (
          <div style={{ marginTop:10, background:'#f9f9f9', borderRadius:8, padding:'8px 12px', display:'flex', alignItems:'center', gap:8, cursor:'text' }}>
            <MessageSquare size={14} color="#9ca3af" />
            <span style={{ fontSize:'0.78rem', color:'#9ca3af' }}>Any suggestions? We will pass it on…</span>
          </div>
        )}
      </div>

      {/* Bill details */}
      {items.length > 0 && (
        <div style={{ borderTop:'1px solid #e9e9eb', padding:'14px 16px', background:'#fff' }}>
          {/* Coupon */}
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 0', borderBottom:'1px solid #f0f0f0', marginBottom:10, cursor:'pointer' }}
            onClick={()=>{}}>
            <Tag size={15} color="#fc8019" />
            <span style={{ fontWeight:700, color:'#fc8019', fontSize:'0.82rem' }}>Apply Coupon</span>
            <ChevronRight size={14} color="#9ca3af" style={{ marginLeft:'auto' }} />
          </div>

          {/* Bill breakdown */}
          <div style={{ fontSize:'0.8rem', fontWeight:700, color:'#1c1c1c', marginBottom:10 }}>Bill Details</div>
          {[
            ['Item Total',              `₹${sub.toFixed(0)}`],
            [`Delivery Fee | 2.3 kms ⓘ`, `₹${DELIVERY_FEE}`],
            ['GST & Other Charges ⓘ',  `₹${gst.toFixed(2)}`],
          ].map(([label, val]) => (
            <div key={label} style={{ display:'flex', justifyContent:'space-between', marginBottom:7, fontSize:'0.8rem', color:'#686b78' }}>
              <span>{label}</span><span style={{ fontWeight:600, color:'#1c1c1c' }}>{val}</span>
            </div>
          ))}

          {/* Divider */}
          <div style={{ height:1, background:'#e9e9eb', margin:'10px 0' }} />

          {/* TO PAY */}
          <div style={{ display:'flex', justifyContent:'space-between', fontWeight:800, fontSize:'0.98rem', color:'#1c1c1c', marginBottom:14 }}>
            <span>TO PAY</span>
            <span>₹{total.toFixed(0)}</span>
          </div>

          <button id="proceed-checkout-btn" onClick={onCheckout}
            style={{ width:'100%', padding:'14px', background:'#fc8019', color:'#fff', border:'none', borderRadius:8, fontWeight:800, fontSize:'0.95rem', cursor:'pointer', transition:'background 0.18s' }}
            onMouseOver={e=>e.currentTarget.style.background='#e67312'}
            onMouseOut={e=>e.currentTarget.style.background='#fc8019'}
          >
            Proceed to Checkout →
          </button>
          <div style={{ textAlign:'center', marginTop:8, fontSize:'0.68rem', color:'#9ca3af', display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
            <ShieldCheck size={11} />Review your order before placing
          </div>
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────
   Checkout Page  (mimics swiggy.com/checkout)
──────────────────────────────────────────────────────────────────── */
function CheckoutPage({ cart, restaurant, user, onBack, onClear }) {
  const [step, setStep]       = useState('address');  // address | payment | done
  const [addrType, setAddrType] = useState('home');
  const [addrLine, setAddrLine] = useState('');
  const [placing, setPlacing] = useState(false);

  const sub   = cartTotal(cart);
  const gst   = +(sub * GST_RATE).toFixed(2);
  const total = sub + DELIVERY_FEE + gst;
  const items = Object.values(cart);
  const count = cartCount(cart);

  const placeOrder = () => {
    setPlacing(true);
    setTimeout(() => setStep('done'), 2000);
  };

  if (step === 'done') {
    return (
      <div style={{ minHeight:'60vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div className="card animate-fade-in" style={{ width:420, padding:'52px 36px', textAlign:'center' }}>
          <div style={{ fontSize:'4rem', marginBottom:12 }}>🎉</div>
          <CheckCircle size={52} color="#22c55e" style={{ marginBottom:14 }} />
          <div style={{ fontSize:'1.5rem', fontWeight:800, marginBottom:8 }}>Order Placed!</div>
          <div style={{ color:'var(--text-secondary)', marginBottom:6, fontSize:'0.9rem' }}>
            Your order from <strong>{restaurant.name}</strong> is confirmed.
          </div>
          <div style={{ color:'#fc8019', fontWeight:700, fontSize:'0.9rem', marginBottom:20 }}>
            Estimated delivery: 30 – 45 min
          </div>
          <div style={{ background:'rgba(34,197,94,0.08)', border:'1px solid rgba(34,197,94,0.2)', borderRadius:12, padding:'12px 16px', fontSize:'0.85rem', color:'var(--text-secondary)', marginBottom:24 }}>
            Order total: <strong style={{ color:'var(--text-primary)' }}>₹{total.toFixed(0)}</strong> · {count} item{count!==1?'s':''}
          </div>
          <button id="order-done-btn" className="btn btn-primary" style={{ width:'100%' }}
            onClick={() => { onClear(); onBack(); }}>
            Back to Restaurants
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Top bar */}
      <div style={{ background:'#fff', borderRadius:12, padding:'14px 20px', marginBottom:20, display:'flex', alignItems:'center', gap:14, boxShadow:'0 2px 10px rgba(0,0,0,0.08)' }}>
        <button id="back-to-menu-btn" onClick={onBack} style={{ color:'#686b78', cursor:'pointer', display:'flex', alignItems:'center', gap:6, fontSize:'0.85rem', fontWeight:600, background:'none' }}>
          <ChevronLeft size={16} /> Back to menu
        </button>
        <div style={{ fontWeight:800, fontSize:'1rem', color:'#1c1c1c', display:'flex', alignItems:'center', gap:8 }}>
          <ShieldCheck size={18} color="#fc8019" /> SECURE CHECKOUT
        </div>
      </div>

      <div style={{ display:'flex', gap:24, alignItems:'flex-start', flexWrap:'wrap' }}>
        {/* ── Left: Steps ── */}
        <div style={{ flex:1, minWidth:280, display:'flex', flexDirection:'column', gap:16 }}>

          {/* Step 1: Account */}
          <div style={{ background:'#fff', borderRadius:12, padding:'20px', boxShadow:'0 2px 10px rgba(0,0,0,0.07)', border:'1px solid #e9e9eb' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom: user ? 10 : 0 }}>
              <div style={{ width:34, height:34, borderRadius:'50%', background:'#1c1c1c', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <User size={16} color="#fff" />
              </div>
              <div>
                <div style={{ fontWeight:800, color:'#1c1c1c', fontSize:'0.92rem' }}>
                  Logged in &nbsp;<CheckCircle size={15} color="#22c55e" style={{ verticalAlign:'middle' }} />
                </div>
              </div>
            </div>
            <div style={{ marginLeft:46, fontSize:'0.88rem', color:'#1c1c1c', fontWeight:600 }}>
              {user?.name || 'Guest User'} | {user?.phone || '—'}
            </div>
          </div>

          {/* Step 2: Delivery Address */}
          <div style={{ background:'#fff', borderRadius:12, padding:'20px', boxShadow:'0 2px 10px rgba(0,0,0,0.07)', border:'2px solid #fc8019' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
              <div style={{ width:34, height:34, borderRadius:'50%', background:'#fc8019', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <MapPin size={16} color="#fff" />
              </div>
              <div style={{ fontWeight:800, color:'#1c1c1c', fontSize:'0.92rem' }}>Add a delivery address</div>
            </div>

            {/* Address type tabs */}
            <div style={{ display:'flex', gap:10, marginBottom:14, marginLeft:46 }}>
              {[['home','Home',<Home size={13}/>],['work','Work',<Briefcase size={13}/>],['other','Other',<Navigation size={13}/>]].map(([k,label,icon])=>(
                <button key={k}
                  onClick={()=>setAddrType(k)}
                  style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 14px', borderRadius:20, fontWeight:700, fontSize:'0.78rem', cursor:'pointer', border:`1.5px solid ${addrType===k?'#fc8019':'#e9e9eb'}`, background: addrType===k?'rgba(252,128,25,0.08)':'#fff', color: addrType===k?'#fc8019':'#686b78', transition:'all 0.18s' }}>
                  {icon}{label}
                </button>
              ))}
            </div>

            <div style={{ marginLeft:46 }}>
              <input id="address-input"
                type="text"
                placeholder={`Enter ${addrType} address…`}
                value={addrLine}
                onChange={e=>setAddrLine(e.target.value)}
                style={{ width:'100%', padding:'12px 14px', border:'1.5px solid #e9e9eb', borderRadius:8, fontSize:'0.88rem', color:'#1c1c1c', outline:'none', marginBottom:12 }}
                onFocus={e=>e.target.style.borderColor='#fc8019'}
                onBlur={e=>e.target.style.borderColor='#e9e9eb'}
              />
              <button id="save-address-btn"
                onClick={()=>setStep('payment')}
                disabled={!addrLine.trim()}
                style={{ padding:'10px 22px', background: addrLine.trim()?'#1c1c1c':'#e9e9eb', color: addrLine.trim()?'#fff':'#9ca3af', border:'none', borderRadius:8, fontWeight:800, fontSize:'0.85rem', cursor: addrLine.trim()?'pointer':'not-allowed', transition:'all 0.18s' }}>
                Save & Continue
              </button>
            </div>
          </div>

          {/* Step 3: Payment */}
          <div style={{ background:'#fff', borderRadius:12, padding:'20px', boxShadow:'0 2px 10px rgba(0,0,0,0.07)', border:'1px solid #e9e9eb', opacity: step==='payment'?1:0.5, pointerEvents: step==='payment'?'auto':'none' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom: step==='payment'?16:0 }}>
              <div style={{ width:34, height:34, borderRadius:'50%', background: step==='payment'?'#fc8019':'#e9e9eb', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <CreditCard size={16} color={step==='payment'?'#fff':'#9ca3af'} />
              </div>
              <div style={{ fontWeight:800, color:'#1c1c1c', fontSize:'0.92rem' }}>Payment</div>
            </div>
            {step === 'payment' && (
              <div style={{ marginLeft:46 }}>
                {[['upi','UPI / PhonePe / GPay','₹0 fee'],['card','Credit / Debit Card','₹0 fee'],['cod','Cash on Delivery','Available']].map(([k,label,sub])=>(
                  <label key={k} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 0', borderBottom:'1px solid #f0f0f0', cursor:'pointer' }}>
                    <input type="radio" name="payment" defaultChecked={k==='upi'} style={{ accentColor:'#fc8019', width:16, height:16 }} />
                    <div>
                      <div style={{ fontWeight:700, color:'#1c1c1c', fontSize:'0.85rem' }}>{label}</div>
                      <div style={{ fontSize:'0.72rem', color:'#686b78' }}>{sub}</div>
                    </div>
                  </label>
                ))}
                <button id="place-order-btn"
                  onClick={placeOrder}
                  disabled={placing}
                  style={{ marginTop:16, width:'100%', padding:'14px', background:'#fc8019', color:'#fff', border:'none', borderRadius:8, fontWeight:800, fontSize:'0.95rem', cursor: placing?'wait':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
                  {placing
                    ? <><RefreshCw size={16} style={{ animation:'spin 1s linear infinite' }}/> Placing your order…</>
                    : <><Package size={16}/> Place Order · ₹{total.toFixed(0)}</>}
                </button>
              </div>
            )}
          </div>

        </div>

        {/* ── Right: Order summary (Swiggy-style) ── */}
        <div style={{ width:320, flexShrink:0, position:'sticky', top:80, alignSelf:'flex-start' }}>
          <div style={{ background:'#fff', borderRadius:12, boxShadow:'0 4px 24px rgba(0,0,0,0.12)', overflow:'hidden', color:'#1c1c1c', border:'1px solid #e9e9eb' }}>
            {/* Restaurant row */}
            <div style={{ padding:'14px 16px', borderBottom:'1px solid #f0f0f0', display:'flex', alignItems:'center', gap:12 }}>
              <img src={restaurantImg(restaurant.cuisine, restaurant.name)} alt={restaurant.name} style={{ width:46, height:46, borderRadius:8, objectFit:'cover', flexShrink:0 }} onError={e=>{e.currentTarget.src=FALLBACK_DISH;}} />
              <div>
                <div style={{ fontWeight:800, fontSize:'0.88rem' }}>{restaurant.name}</div>
                <div style={{ fontSize:'0.72rem', color:'#686b78' }}>{restaurant.city}</div>
              </div>
            </div>

            {/* Items */}
            <div style={{ padding:'8px 16px 0' }}>
              {items.map(({ item, qty }) => (
                <div key={item.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 0', borderBottom:'1px solid #f9f9f9' }}>
                  <VegDot veg={item.veg} size={14} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:'0.82rem', fontWeight:700, color:'#1c1c1c', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.name}</div>
                    <div style={{ fontSize:'0.7rem', color:'#9ca3af' }}>Customize &rsaquo;</div>
                  </div>
                  <span style={{ fontSize:'0.78rem', color:'#686b78', fontWeight:600 }}>— {qty} +</span>
                  <span style={{ fontWeight:800, fontSize:'0.82rem', color:'#1c1c1c', minWidth:42, textAlign:'right' }}>₹{(item.price*qty).toFixed(0)}</span>
                </div>
              ))}

              {/* No-contact delivery */}
              <div style={{ margin:'12px 0', padding:'10px', border:'1px solid #e9e9eb', borderRadius:8, display:'flex', gap:10 }}>
                <input type="checkbox" id="nocontact" style={{ accentColor:'#fc8019', marginTop:2, flexShrink:0 }} />
                <label htmlFor="nocontact" style={{ fontSize:'0.75rem', color:'#1c1c1c', cursor:'pointer' }}>
                  <strong>Opt in for No-contact Delivery</strong><br/>
                  Partner will safely place the order outside your door.
                </label>
              </div>
            </div>

            {/* Apply coupon */}
            <div style={{ padding:'10px 16px', borderTop:'1px solid #f0f0f0', borderBottom:'1px solid #f0f0f0', display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
              <Tag size={14} color="#fc8019" />
              <span style={{ fontWeight:700, color:'#fc8019', fontSize:'0.82rem' }}>Apply Coupon</span>
              <ChevronRight size={14} color="#9ca3af" style={{ marginLeft:'auto' }} />
            </div>

            {/* Bill */}
            <div style={{ padding:'14px 16px' }}>
              <div style={{ fontWeight:800, color:'#1c1c1c', marginBottom:10, fontSize:'0.85rem' }}>Bill Details</div>
              {[
                ['Item Total',              `₹${sub.toFixed(0)}`],
                [`Delivery Fee | 2.3 kms ⓘ`, `₹${DELIVERY_FEE}`],
                ['GST & Other Charges ⓘ',  `₹${gst.toFixed(2)}`],
              ].map(([label,val])=>(
                <div key={label} style={{ display:'flex', justifyContent:'space-between', marginBottom:7, fontSize:'0.8rem', color:'#686b78' }}>
                  <span>{label}</span><span style={{ fontWeight:600, color:'#1c1c1c' }}>{val}</span>
                </div>
              ))}
              <div style={{ height:1, background:'#e9e9eb', margin:'10px 0' }} />
              <div style={{ display:'flex', justifyContent:'space-between', fontWeight:900, fontSize:'1rem', color:'#1c1c1c' }}>
                <span>TO PAY</span><span>₹{total.toFixed(0)}</span>
              </div>
            </div>

            <div style={{ padding:'0 16px 14px', fontSize:'0.72rem', color:'#9ca3af', textAlign:'center' }}>
              Review your order and address details to avoid cancellations
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────
   Main Screen
──────────────────────────────────────────────────────────────────── */
export default function FoodOrderScreen() {
  const { selectedCity } = useCity();
  const { user }         = useAuth();

  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [searchQ, setSearchQ]         = useState('');
  const [sortBy, setSortBy]           = useState('rating');
  const [activeR, setActiveR]         = useState(null);
  const [menuSection, setMenuSection] = useState('All');
  const [vegOnly, setVegOnly]         = useState(false);
  const [view, setView]               = useState('list');  // 'list' | 'menu' | 'checkout'

  const [cart, setCart]       = useState({});
  const [cartRestId, setCartRestId] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await api.getRestaurants();
        setRestaurants(data.length ? data : fallbackRestaurants());
      } catch { setRestaurants(fallbackRestaurants()); }
      finally { setLoading(false); }
    })();
  }, []);

  const addItem = useCallback((rId, item) => {
    if (cartRestId && cartRestId !== rId) {
      // Different restaurant — clear and start fresh silently
      setCart({ [item.id]: { item, qty: 1 } });
      setCartRestId(rId);
      return;
    }
    setCartRestId(rId);
    setCart(prev => ({ ...prev, [item.id]: { item, qty: (prev[item.id]?.qty ?? 0) + 1 } }));
  }, [cartRestId]);

  const removeItem = useCallback((item) => {
    setCart(prev => {
      const q = prev[item.id]?.qty ?? 0;
      if (q <= 1) { const next={...prev}; delete next[item.id]; if(!Object.keys(next).length) setCartRestId(null); return next; }
      return { ...prev, [item.id]: { item, qty: q - 1 } };
    });
  }, []);

  const clearCart = () => { setCart({}); setCartRestId(null); };

  /* ── filtered restaurant list ── */
  const filtered = restaurants
    .filter(r => {
      if (selectedCity !== 'all' && r.city?.toLowerCase() !== selectedCity?.toLowerCase()) return false;
      if (searchQ) {
        const q = searchQ.toLowerCase();
        if (!r.name.toLowerCase().includes(q) && !(r.cuisine ?? '').toLowerCase().includes(q)) return false;
      }
      return true;
    })
    .sort((a,b)=>{
      if (sortBy==='rating')   return (b.avg_rating??0)-(a.avg_rating??0);
      if (sortBy==='delivery') return (a.avg_prep_time_mins??30)-(b.avg_prep_time_mins??30);
      if (sortBy==='price')    return (a.price_for_two??1000)-(b.price_for_two??1000);
      return 0;
    });

  const menu        = activeR ? menuFor(activeR.cuisine) : [];
  const visibleMenu = menu.filter(i=>{
    if (vegOnly && !i.veg) return false;
    if (menuSection==='Veg' && !i.veg) return false;
    if (menuSection==='Non-Veg' && i.veg) return false;
    return true;
  });

  /* ── Checkout ── */
  if (view === 'checkout' && activeR) {
    return <CheckoutPage cart={cart} restaurant={activeR} user={user}
      onBack={() => setView('menu')}
      onClear={() => { clearCart(); setView('list'); setActiveR(null); }} />;
  }

  /* ── Menu view ── */
  if (view === 'menu' && activeR) {
    const rId = activeR.id;
    return (
      <div className="animate-fade-in">
        {/* Back row */}
        <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:20 }}>
          <button id="back-to-list-btn" onClick={()=>{setView('list');setActiveR(null);}} className="btn btn-secondary" style={{ padding:'8px 14px', flexShrink:0 }}>
            <ChevronLeft size={15}/> Restaurants
          </button>
          <div>
            <h1 style={{ fontSize:'1.4rem', fontWeight:800, marginBottom:3 }}>{activeR.name}</h1>
            <div style={{ color:'var(--text-muted)', fontSize:'0.8rem', display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
              {activeR.cuisine && <span>{activeR.cuisine}</span>}
              {activeR.city   && <><span>·</span><MapPin size={11}/><span>{activeR.city}</span></>}
              {activeR.avg_rating && <><span>·</span><Stars value={activeR.avg_rating}/></>}
              {activeR.avg_prep_time_mins && <><span>·</span><Clock size={11}/><span>{activeR.avg_prep_time_mins}–{activeR.avg_prep_time_mins+10} min</span></>}
            </div>
          </div>
        </div>

        {/* Main 2-col */}
        <div style={{ display:'flex', gap:24, alignItems:'flex-start' }}>
          {/* Left: menu */}
          <div style={{ flex:1, minWidth:0 }}>
            {/* Offer strip */}
            <div style={{ background:'linear-gradient(135deg,rgba(252,128,25,0.1),rgba(217,35,46,0.07))', border:'1px solid rgba(252,128,25,0.22)', borderRadius:12, padding:'11px 16px', marginBottom:18, display:'flex', alignItems:'center', gap:10 }}>
              <Tag size={16} color="var(--swiggy-orange)"/>
              <span style={{ fontWeight:700, color:'var(--swiggy-orange)' }}>50% OFF</span>
              <span style={{ color:'var(--text-secondary)', fontSize:'0.83rem' }}>up to ₹100 · Use code <strong>SWIGGY50</strong></span>
            </div>

            {/* Filters */}
            <div style={{ display:'flex', gap:10, marginBottom:18, flexWrap:'wrap' }}>
              <button id="veg-toggle" onClick={()=>setVegOnly(v=>!v)}
                style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 13px', borderRadius:20, fontWeight:700, fontSize:'0.8rem', cursor:'pointer', border:`1.5px solid ${vegOnly?'#22c55e':'var(--border-medium)'}`, background: vegOnly?'rgba(34,197,94,0.1)':'transparent', color: vegOnly?'#4ade80':'var(--text-secondary)', transition:'all 0.18s' }}>
                <Leaf size={12}/> Veg Only
              </button>
              {['All','Veg','Non-Veg'].map(s=>(
                <button key={s} onClick={()=>setMenuSection(s)}
                  style={{ padding:'6px 13px', borderRadius:20, fontWeight:700, fontSize:'0.8rem', cursor:'pointer', border:`1.5px solid ${menuSection===s?'var(--swiggy-orange)':'var(--border-subtle)'}`, background: menuSection===s?'rgba(252,128,25,0.1)':'transparent', color: menuSection===s?'var(--swiggy-orange)':'var(--text-secondary)', transition:'all 0.18s' }}>
                  {s}
                </button>
              ))}
            </div>

            {/* Items */}
            <div className="card" style={{ padding:'0 20px' }}>
              {visibleMenu.length === 0
                ? <div style={{ textAlign:'center', padding:'48px 0', color:'var(--text-muted)' }}>No items match the filter.</div>
                : visibleMenu.map(item => {
                  const qty = cart[item.id]?.qty ?? 0;
                  return (
                    <div key={item.id} style={{ display:'flex', gap:18, padding:'20px 0', borderBottom:'1px solid var(--border-subtle)' }}>
                      {/* Info */}
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                          <VegDot veg={item.veg}/>
                          {item.star && <span style={{ fontSize:'0.63rem', fontWeight:800, color:'#f59e0b', background:'rgba(245,158,11,0.12)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:4, padding:'1px 6px', textTransform:'uppercase' }}>🏆 Bestseller</span>}
                        </div>
                        <div style={{ fontSize:'0.96rem', fontWeight:700, marginBottom:5 }}>{item.name}</div>
                        <div style={{ fontSize:'0.78rem', color:'var(--text-muted)', lineHeight:1.45, marginBottom:9 }}>{item.desc}</div>
                        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                          <span style={{ fontSize:'1rem', fontWeight:800 }}>₹{item.price}</span>
                          {item.cal  && <span style={{ fontSize:'0.7rem', color:'var(--text-muted)' }}>{item.cal} cal</span>}
                          {item.mins && <span style={{ fontSize:'0.7rem', color:'var(--text-muted)', display:'flex', alignItems:'center', gap:3 }}><Clock size={10}/>{item.mins} min</span>}
                        </div>
                      </div>
                      {/* Image + controls */}
                      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10, flexShrink:0 }}>
                        <div style={{ width:110, height:88, borderRadius:12, overflow:'hidden', border:'1px solid var(--border-subtle)' }}>
                          <img src={dishImg(item.name)} alt={item.name} loading="lazy"
                            style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}
                            onError={e=>{e.currentTarget.src=FALLBACK_DISH;}}/>
                        </div>
                        {qty === 0
                          ? <button id={`add-${item.id}`} onClick={()=>addItem(rId,item)}
                              style={{ width:110, padding:'8px 0', borderRadius:8, border:'1.5px solid var(--swiggy-orange)', color:'var(--swiggy-orange)', background:'rgba(252,128,25,0.06)', fontWeight:800, fontSize:'0.88rem', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}
                              onMouseOver={e=>e.currentTarget.style.background='rgba(252,128,25,0.16)'}
                              onMouseOut={e=>e.currentTarget.style.background='rgba(252,128,25,0.06)'}>
                              <Plus size={14}/> ADD
                            </button>
                          : <div style={{ width:110, display:'flex', alignItems:'center', justifyContent:'space-between', background:'var(--swiggy-orange)', borderRadius:8, overflow:'hidden' }}>
                              <button id={`dec-${item.id}`} onClick={()=>removeItem(item)} style={{ background:'none', color:'#fff', padding:'8px 12px', cursor:'pointer' }}><Minus size={13}/></button>
                              <span style={{ color:'#fff', fontWeight:800, fontSize:'0.9rem' }}>{qty}</span>
                              <button id={`inc-${item.id}`} onClick={()=>addItem(rId,item)} style={{ background:'none', color:'#fff', padding:'8px 12px', cursor:'pointer' }}><Plus size={13}/></button>
                            </div>
                        }
                      </div>
                    </div>
                  );
                })
              }
            </div>
          </div>

          {/* Right: live cart sidebar */}
          <CartSidebar
            cart={cart}
            restaurantName={activeR.name}
            onAdd={item=>addItem(rId,item)}
            onRemove={removeItem}
            onCheckout={()=>setView('checkout')}
          />
        </div>
      </div>
    );
  }

  /* ── Restaurant list ── */
  return (
    <div className="animate-fade-in" style={{ paddingBottom:60 }}>
      <div className="screen-header">
        <h1 className="screen-title">
          <Bike size={28} color="var(--swiggy-orange)"/>
          Food <span className="gradient-text-orange">Delivery</span>
        </h1>
        <p className="screen-subtitle">
          Order from the best restaurants near your event venue.
          {selectedCity!=='all' && <span style={{ color:'var(--swiggy-orange)', fontWeight:700 }}> Showing {selectedCity}</span>}
        </p>
      </div>

      <div style={{ display:'flex', gap:12, marginBottom:22, flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex:1, minWidth:200 }}>
          <Search size={15} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }}/>
          <input id="food-search" type="text" placeholder="Search restaurants or cuisines…" value={searchQ} onChange={e=>setSearchQ(e.target.value)}
            style={{ width:'100%', padding:'11px 14px 11px 38px', background:'var(--bg-surface)', border:'1px solid var(--border-medium)', borderRadius:12, color:'var(--text-primary)', fontSize:'0.88rem', outline:'none' }}/>
        </div>
        <select id="sort-select" value={sortBy} onChange={e=>setSortBy(e.target.value)}
          style={{ padding:'11px 14px', background:'var(--bg-surface)', border:'1px solid var(--border-medium)', borderRadius:12, color:'var(--text-primary)', fontSize:'0.86rem', cursor:'pointer', outline:'none' }}>
          <option value="rating">⭐ Top Rated</option>
          <option value="delivery">⚡ Fastest</option>
          <option value="price">💰 Price</option>
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:'72px 0', color:'var(--text-muted)' }}>
          <RefreshCw size={34} style={{ marginBottom:12, opacity:0.35, animation:'spin 1.2s linear infinite' }}/>
          <div>Loading restaurants…</div>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:'72px 0', color:'var(--text-muted)' }}>
          <div style={{ fontSize:'2.5rem', marginBottom:12 }}>🍽️</div>
          <div style={{ fontWeight:700, marginBottom:8 }}>No restaurants found</div>
          <div style={{ fontSize:'0.85rem' }}>Try a different city or clear the search.</div>
        </div>
      ) : (
        <>
          <div style={{ fontSize:'0.8rem', color:'var(--text-muted)', fontWeight:600, marginBottom:16 }}>
            {filtered.length} restaurant{filtered.length!==1?'s':''} available
          </div>
          <div className="grid-cards">
            {filtered.map(r => {
              const deliveryMin = r.avg_prep_time_mins ?? 30;
              const img = restaurantImg(r.cuisine, r.name);
              const inCart = cartRestId===r.id ? cartCount(cart) : 0;
              return (
                <div key={r.id} id={`r-${r.id}`} className="card card-hover" onClick={()=>{setActiveR(r);setView('menu');setMenuSection('All');setVegOnly(false);}} style={{ cursor:'pointer', overflow:'hidden' }}>
                  <div style={{ position:'relative', height:162, overflow:'hidden', borderRadius:'var(--radius-lg) var(--radius-lg) 0 0' }}>
                    <img src={img} alt={r.name} loading="lazy"
                      style={{ width:'100%', height:'100%', objectFit:'cover', display:'block', transition:'transform 0.3s ease' }}
                      onMouseOver={e=>e.currentTarget.style.transform='scale(1.05)'}
                      onMouseOut={e=>e.currentTarget.style.transform='scale(1)'}
                      onError={e=>{e.currentTarget.src=FALLBACK_DISH;}}/>
                    {inCart>0 && (
                      <div style={{ position:'absolute', top:10, right:10, background:'#fc8019', color:'#fff', borderRadius:12, padding:'3px 10px', fontSize:'0.7rem', fontWeight:800, boxShadow:'0 2px 8px rgba(252,128,25,0.5)' }}>
                        {inCart} in cart
                      </div>
                    )}
                  </div>
                  <div style={{ padding:'14px 16px 16px' }}>
                    <div style={{ fontSize:'1.02rem', fontWeight:800, marginBottom:3 }}>{r.name}</div>
                    <div style={{ fontSize:'0.78rem', color:'var(--text-muted)', marginBottom:10 }}>
                      {r.cuisine ?? 'Multi-cuisine'} · {r.city}
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
                      {r.avg_rating && <Stars value={r.avg_rating}/>}
                      <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:'0.78rem', color:'var(--text-secondary)' }}>
                        <Clock size={11}/>{deliveryMin}–{deliveryMin+10} min
                      </span>
                      {r.price_for_two && <span style={{ fontSize:'0.78rem', color:'var(--text-secondary)' }}>₹{r.price_for_two} for two</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
