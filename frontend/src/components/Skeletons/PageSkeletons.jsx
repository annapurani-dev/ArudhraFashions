import React from 'react'
import '../Loading/loading.css'
import './skeletons.css'

export function HomeSkeleton() {
  return (
    <div className="home-skeleton">
      <div className="skeleton-hero shimmer" />
      <div className="container">
        <div className="skeleton-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton-card shimmer">
              <div className="skeleton-image" />
              <div className="skeleton-lines">
                <div className="skeleton-line short" />
                <div className="skeleton-line medium" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function ProductsSkeleton({ gridCount = 12 }) {
  return (
    <div className="products-skeleton">
      <div className="products-header-skel">
        <div className="skeleton-line long" />
      </div>
      <div className="skeleton-grid">
        {Array.from({ length: gridCount }).map((_, i) => (
          <div key={i} className="skeleton-card shimmer">
            <div className="skeleton-image" />
            <div className="skeleton-lines">
              <div className="skeleton-line medium" />
              <div className="skeleton-line short" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ProductsIndexSkeleton() {
  return (
    <div className="products-index-skeleton">
      <div className="container">
        <div className="skeleton-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton-card shimmer">
              <div className="skeleton-image" />
              <div className="skeleton-lines">
                <div className="skeleton-line medium" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function ProductDetailSkeleton() {
  return (
    <div className="product-detail-skeleton container">
      <div className="product-detail">
        <div className="product-images skeleton-column">
          <div className="skeleton-image large shimmer" />
          <div className="thumbnail-row">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton-image thumb shimmer" />)}
          </div>
        </div>
        <div className="product-info-wrapper">
          <div className="skeleton-lines">
            <div className="skeleton-line long" />
            <div className="skeleton-line medium" />
            <div className="skeleton-line short" />
            <div className="skeleton-line medium" />
          </div>
          <div style={{ height: 24 }} />
          <div className="skeleton-lines">
            <div className="skeleton-line long" />
            <div className="skeleton-line medium" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function CartSkeleton() {
  return (
    <div className="cart-skeleton container">
      <div className="cart-layout">
        <div className="cart-items-wrapper">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton-card shimmer cart-item-skel">
              <div className="skeleton-image" style={{ width: 120, height: 120 }} />
              <div className="skeleton-lines" style={{ flex: 1 }}>
                <div className="skeleton-line medium" />
                <div className="skeleton-line short" />
              </div>
            </div>
          ))}
        </div>
        <div className="cart-summary-card shimmer">
          <div className="skeleton-line medium" />
          <div style={{ height: 16 }} />
          <div className="skeleton-line long" />
          <div className="skeleton-line short" />
        </div>
      </div>
    </div>
  )
}

export function WishlistSkeleton() {
  return (
    <div className="wishlist-skeleton container">
      <div className="skeleton-grid">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="skeleton-card shimmer">
            <div className="skeleton-image" />
            <div className="skeleton-lines">
              <div className="skeleton-line medium" />
              <div className="skeleton-line short" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function CompareSkeleton() {
  return (
    <div className="compare-skeleton container">
      <div className="skeleton-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton-card shimmer">
            <div className="skeleton-image" />
            <div className="skeleton-lines">
              <div className="skeleton-line medium" />
              <div className="skeleton-line short" />
            </div>
          </div>
        ))}
      </div>
      <div style={{ height: 16 }} />
      <div className="skeleton-lines">
        <div className="skeleton-line long" />
        <div className="skeleton-line medium" />
      </div>
    </div>
  )
}

export function CheckoutSkeleton() {
  return (
    <div className="checkout-skeleton container">
      <div className="checkout-layout">
        <div className="skeleton-card shimmer" style={{ flex: 2 }}>
          <div className="skeleton-line long" />
          <div style={{ height: 12 }} />
          <div className="skeleton-line medium" />
          <div style={{ height: 8 }} />
          <div className="skeleton-line short" />
        </div>
        <div className="skeleton-card shimmer" style={{ width: 320 }}>
          <div className="skeleton-line medium" />
          <div style={{ height: 8 }} />
          <div className="skeleton-line long" />
        </div>
      </div>
    </div>
  )
}

export function DashboardOrdersSkeleton() {
  return (
    <div className="dashboard-orders-skeleton">
      <div className="skeleton-lines">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton-card shimmer" style={{ marginBottom: 12 }}>
            <div className="skeleton-line long" />
            <div className="skeleton-line short" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function CoinsSkeleton() {
  return (
    <div className="coins-skeleton container">
      <div className="skeleton-card shimmer">
        <div className="skeleton-line medium" />
        <div style={{ height: 12 }} />
        <div className="skeleton-line long" />
      </div>
    </div>
  )
}

export function PreferencesSkeleton() {
  return (
    <div className="preferences-skeleton">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="skeleton-card shimmer" style={{ marginBottom: 12 }}>
          <div className="skeleton-line medium" />
          <div className="skeleton-line short" />
        </div>
      ))}
    </div>
  )
}

export function CouponsSkeleton({ count = 4 }) {
  return (
    <div className="coupons-skeleton">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-card shimmer" style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 12 }}>
          <div style={{ width: 48, height: 48, borderRadius: 6, background: 'linear-gradient(90deg, rgba(0,0,0,0.03) 25%, rgba(0,0,0,0.06) 50%, rgba(0,0,0,0.03) 75%)' }} />
          <div style={{ flex: 1 }}>
            <div className="skeleton-line medium" />
            <div className="skeleton-line short" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function DiscountsSkeleton({ count = 3 }) {
  return (
    <div className="discounts-skeleton">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-card shimmer" style={{ padding: 12, marginBottom: 12 }}>
          <div className="skeleton-line medium" />
          <div style={{ height: 8 }} />
          <div className="skeleton-line short" />
        </div>
      ))}
    </div>
  )
}

export default {
  HomeSkeleton,
  ProductsSkeleton,
  ProductsIndexSkeleton,
  ProductDetailSkeleton,
  CartSkeleton,
  WishlistSkeleton,
  CompareSkeleton,
  CheckoutSkeleton,
  DashboardOrdersSkeleton,
  CoinsSkeleton
}

