import React from "react";
import ProductCard from "./product/ProductCard";
import { getProductsForSection } from "../data/productStore";
import SectionHeading from "./ui/SectionHeading";
import Reveal from "./ui/Reveal";

export default function NewArrivals({ locale = "ar" }) {
  const isAr = locale === "ar";
  const products = getProductsForSection("new-arrivals").slice(0, 8);

  return (
    <section id="new-arrivals" className="bg-milk py-20 sm:py-28">
      <div className="w-full max-w-none px-4 sm:px-6 lg:px-8 xl:px-10">
        <Reveal>
          <SectionHeading
            eyebrow="New Arrivals"
            tone="aubergine"
            title={isAr ? "وصل حديثاً" : "New arrivals"}
            description={
              isAr
                ? "قطع جديدة مختارة بعناية لصغاركم."
                : "New pieces, carefully chosen for your little ones."
            }
            linkHref="/collections/new-arrivals"
            linkLabel={isAr ? "عرض كل وصل حديثاً" : "View all new arrivals"}
          />
        </Reveal>

        <div className="grid w-full grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-x-5">
          {products.map((product, index) => (
            <Reveal key={product.id} delay={index * 60} className="w-full">
              <ProductCard product={product} locale={locale} />
            </Reveal>
          ))}
        </div>

        <div className="mt-10 text-center sm:hidden">
          <a href="/collections/new-arrivals" className="omb-link">
            {isAr ? "عرض كل وصل حديثاً" : "View all new arrivals"}
          </a>
        </div>
      </div>
    </section>
  );
}
