import { useState } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, Star, Zap, Wrench } from "lucide-react";
import { type Product } from "../api/client";
import { colors } from "../theme/colors";

interface Props {
  product: Product;
  onAddToCart?: (product: Product) => void;
}

export default function ProductCard({ product, onAddToCart }: Props) {
  const [isHovered, setIsHovered] = useState(false);
  const [imgError, setImgError] = useState(false);

  const images: string[] = Array.isArray(product.images) ? product.images : [];
  const displayImage = !imgError && images.length > 0 ? images[0] : null;
  const hasDiscount = product.sale_price && product.sale_price < product.price;
  const displayPrice = hasDiscount ? product.sale_price! : product.price;
  const discountPct = hasDiscount
    ? Math.round((1 - product.sale_price! / product.price) * 100)
    : 0;

  return (
    <motion.div
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      dir="rtl"
      style={{
        background: isHovered ? colors.background.tertiary : colors.background.secondary,
        border: `1px solid ${isHovered ? colors.blue[700] : colors.carbon[600]}`,
        borderRadius: "18px",
        overflow: "hidden",
        cursor: "pointer",
        position: "relative",
        transition: "background 0.3s ease, border-color 0.3s ease",
        boxShadow: isHovered ? colors.blue.glow : "none",
      }}
    >
      {/* Badges */}
      <div style={{ position: "absolute", top: "12px", right: "12px", zIndex: 2, display: "flex", gap: "6px" }}>
        {product.is_tuning && (
          <span style={{
            background: `linear-gradient(135deg, ${colors.orange[600]}, ${colors.orange[500]})`,
            color: "#fff", borderRadius: "8px", padding: "3px 8px",
            fontSize: "0.7rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "3px",
          }}>
            <Zap size={10} /> فتك
          </span>
        )}
        {product.is_performance && !product.is_tuning && (
          <span style={{
            background: `linear-gradient(135deg, ${colors.blue[600]}, ${colors.blue[500]})`,
            color: "#fff", borderRadius: "8px", padding: "3px 8px",
            fontSize: "0.7rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "3px",
          }}>
            <Wrench size={10} /> أداء
          </span>
        )}
        {hasDiscount && (
          <span style={{
            background: "#FF3B3B", color: "#fff", borderRadius: "8px",
            padding: "3px 8px", fontSize: "0.7rem", fontWeight: 700,
          }}>
            -{discountPct}%
          </span>
        )}
      </div>

      {/* Product image */}
      <div style={{
        height: "180px",
        background: colors.background.primary,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        {displayImage ? (
          <motion.img
            src={displayImage}
            alt={product.name_ar}
            onError={() => setImgError(true)}
            animate={{ scale: isHovered ? 1.08 : 1 }}
            transition={{ duration: 0.4 }}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div style={{
            width: "80px", height: "80px",
            background: colors.carbon[700],
            borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "2rem",
          }}>
            {product.is_tuning ? "⚡" : product.is_performance ? "🔧" : "🔩"}
          </div>
        )}
        {/* Gradient overlay on hover */}
        <motion.div
          animate={{ opacity: isHovered ? 1 : 0 }}
          style={{
            position: "absolute", inset: 0,
            background: `linear-gradient(to top, ${colors.background.primary} 0%, transparent 50%)`,
          }}
        />
      </div>

      {/* Content */}
      <div style={{ padding: "16px" }}>
        {/* Brand */}
        <div style={{
          fontSize: "0.7rem", color: colors.blue[400], fontWeight: 700,
          textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px",
        }}>
          {product.brand}
          {product.car_brand && (
            <span style={{ color: colors.text.muted, fontWeight: 400 }}>
              {" · "}
              {product.car_brand === "nissan" ? "نيسان" :
               product.car_brand === "toyota" ? "تويوتا" :
               product.car_brand === "lexus" ? "لكزس" : product.car_brand}
            </span>
          )}
        </div>

        {/* Name */}
        <h3 style={{
          color: colors.text.primary,
          fontSize: "0.9rem",
          fontWeight: 700,
          marginBottom: "8px",
          lineHeight: 1.4,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}>
          {product.name_ar}
        </h3>

        {/* Rating */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "12px" }}>
          <Star size={12} fill={colors.orange[500]} color={colors.orange[500]} />
          <span style={{ color: colors.text.secondary, fontSize: "0.78rem" }}>
            {product.rating.toFixed(1)}
          </span>
          <span style={{ color: colors.text.muted, fontSize: "0.72rem" }}>
            ({product.review_count})
          </span>
          {product.sold_count > 0 && (
            <span style={{ color: colors.text.muted, fontSize: "0.72rem", marginRight: "auto" }}>
              {product.sold_count}+ مبيعة
            </span>
          )}
        </div>

        {/* Price & CTA */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{
              color: isHovered ? colors.orange[400] : colors.text.primary,
              fontSize: "1.15rem",
              fontWeight: 900,
              transition: "color 0.3s ease",
            }}>
              {displayPrice.toLocaleString("ar-SA")} ر.س
            </div>
            {hasDiscount && (
              <div style={{
                color: colors.text.muted,
                fontSize: "0.75rem",
                textDecoration: "line-through",
              }}>
                {product.price.toLocaleString("ar-SA")} ر.س
              </div>
            )}
          </div>

          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.93 }}
            onClick={(e) => { e.stopPropagation(); onAddToCart?.(product); }}
            style={{
              background: isHovered
                ? `linear-gradient(135deg, ${colors.orange[600]}, ${colors.orange[500]})`
                : colors.background.tertiary,
              border: `1px solid ${isHovered ? colors.orange[500] : colors.carbon[500]}`,
              color: isHovered ? "#fff" : colors.text.muted,
              borderRadius: "12px",
              padding: "10px 14px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "0.8rem",
              fontFamily: "'Tajawal', sans-serif",
              transition: "all 0.3s ease",
            }}
          >
            <ShoppingCart size={15} />
            أضف
          </motion.button>
        </div>

        {/* Stock warning */}
        {product.stock > 0 && product.stock <= 5 && (
          <div style={{
            marginTop: "8px",
            background: "rgba(255, 184, 0, 0.1)",
            border: "1px solid rgba(255, 184, 0, 0.3)",
            borderRadius: "8px",
            padding: "4px 10px",
            fontSize: "0.72rem",
            color: colors.warning,
          }}>
            ⚠️ متبقي {product.stock} فقط
          </div>
        )}
      </div>
    </motion.div>
  );
}
