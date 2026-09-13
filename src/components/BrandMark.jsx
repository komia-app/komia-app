import React from "react";

const LOGO_URL = "https://media.base44.com/images/public/6a9ef4f4c495bd74d2da8cfb/c2e08e809_nombre.svg";

export default function BrandMark({ compact = false, className = "" }) {
  return (
    <img
      src={LOGO_URL}
      alt="KOMIA"
      className={`${compact ? "h-6" : "h-8"} w-auto ${className}`}
    />
  );
}