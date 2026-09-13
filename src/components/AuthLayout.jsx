import React from "react";

export default function AuthLayout({ title, subtitle, footer, children }) {
  return <div className="min-h-screen bg-[#10375C] px-5 py-10 text-white"><div className="mx-auto w-full max-w-md">
    <div className="mb-8 text-center"><img src="https://media.base44.com/images/public/6a9ef4f4c495bd74d2da8cfb/c2e08e809_nombre.svg" alt="KOMIA" className="mx-auto h-12 w-auto" /><p className="mt-3 text-sm font-semibold">Discover · Save · Share</p></div>
    <h1 className="text-2xl font-extrabold">{title}</h1>{subtitle && <p className="mt-1 text-sm text-white/65">{subtitle}</p>}
    <div className="mt-6 rounded-3xl bg-white p-6 text-[#10375C] shadow-2xl">{children}</div>
    {footer && <p className="mt-6 text-center text-sm text-white/75">{footer}</p>}
  </div></div>;
}