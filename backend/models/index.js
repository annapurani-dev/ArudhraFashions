// Import all models
import User from './User.js'
import Product from './Product.js'
import Cart from './Cart.js'
import Order from './Order.js'
import Review from './Review.js'
import Admin from './Admin.js'
import Banner from './Banner.js'
import Coupon from './Coupon.js'
import Setting from './Setting.js'
import ContactQuery from './ContactQuery.js'
import Return from './Return.js'
import Category from './Category.js'
import Subcategory from './Subcategory.js'
import Discount from './Discount.js'
import NewsletterSubscriber from './NewsletterSubscriber.js'
import ContentSetting from './ContentSetting.js'
import EmailTemplate from './EmailTemplate.js'
import CouponUsage from './CouponUsage.js'
import InventoryLog from './InventoryLog.js'
import NewArrival from './NewArrival.js'
import Testimonial from './Testimonial.js'
import SaleStrip from './SaleStrip.js'
import CoinTransaction from './CoinTransaction.js'
import Image from './Image.js'
import PushSubscription from './PushSubscription.js'

// Set up associations
User.hasOne(Cart, { foreignKey: 'userId', as: 'cart' })
User.hasMany(Order, { foreignKey: 'userId', as: 'orders' })
User.hasMany(Review, { foreignKey: 'userId', as: 'userReviews' })
User.hasMany(Return, { foreignKey: 'userId', as: 'returns' })
User.hasMany(CouponUsage, { foreignKey: 'userId', as: 'couponUsages' })
User.hasMany(CoinTransaction, { foreignKey: 'userId', as: 'coinTransactions' })

Cart.belongsTo(User, { foreignKey: 'userId', as: 'user' })

Order.belongsTo(User, { foreignKey: 'userId', as: 'user' })

CoinTransaction.belongsTo(User, { foreignKey: 'userId', as: 'user' })

Product.hasMany(Review, { foreignKey: 'productId', as: 'productReviews' })
Product.hasMany(Return, { foreignKey: 'productId', as: 'productReturns' })
Product.hasMany(InventoryLog, { foreignKey: 'productId', as: 'inventoryLogs' })

Review.belongsTo(Product, { foreignKey: 'productId', as: 'product' })
Review.belongsTo(User, { foreignKey: 'userId', as: 'user' })

Return.belongsTo(User, { foreignKey: 'userId', as: 'user' })
Return.belongsTo(Product, { foreignKey: 'productId', as: 'product' })

Category.hasMany(Subcategory, { foreignKey: 'categoryId', as: 'subcategories' })
Subcategory.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' })

Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' })
Product.belongsTo(Subcategory, { foreignKey: 'subcategoryId', as: 'subcategory' })

Category.hasMany(Product, { foreignKey: 'categoryId', as: 'products' })
Subcategory.hasMany(Product, { foreignKey: 'subcategoryId', as: 'products' })

Coupon.hasMany(CouponUsage, { foreignKey: 'couponId', as: 'usages' })
CouponUsage.belongsTo(Coupon, { foreignKey: 'couponId', as: 'coupon' })
CouponUsage.belongsTo(User, { foreignKey: 'userId', as: 'user' })

InventoryLog.belongsTo(Product, { foreignKey: 'productId', as: 'product' })
InventoryLog.belongsTo(Admin, { foreignKey: 'createdBy', as: 'admin' })

Admin.hasMany(InventoryLog, { foreignKey: 'createdBy', as: 'inventoryLogs' })
Admin.hasMany(PushSubscription, { foreignKey: 'adminId', as: 'pushSubscriptions' })
PushSubscription.belongsTo(Admin, { foreignKey: 'adminId', as: 'admin' })

// Export all models
export {
  User,
  Product,
  Cart,
  Order,
  Review,
  Admin,
  Banner,
  Coupon,
  Setting,
  ContactQuery,
  Return,
  Category,
  Subcategory,
  Discount,
  NewsletterSubscriber,
  ContentSetting,
  EmailTemplate,
  CouponUsage,
  InventoryLog,
  NewArrival,
  Testimonial,
  SaleStrip,
  CoinTransaction,
  Image,
  PushSubscription
}
