"use client";

import { useId, useState } from "react";
import { categories, formatPrice, products, type Category, type Product } from "./content";
import { useShop } from "./shop";
import { Vessel } from "./vessel";

const filters = ["Everything", ...categories] as const;
type Filter = (typeof filters)[number];

const sorts = {
  featured: "Featured",
  "price-asc": "Price, low to high",
  "price-desc": "Price, high to low",
} as const;
type Sort = keyof typeof sorts;

function order(list: Product[], sort: Sort) {
  if (sort === "price-asc") return [...list].sort((a, b) => a.price - b.price);
  if (sort === "price-desc") return [...list].sort((a, b) => b.price - a.price);
  return [...list].sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));
}

/** The small catalogue: filter by kind, sort by price, open any piece. */
export function Catalogue() {
  const [filter, setFilter] = useState<Filter>("Everything");
  const [sort, setSort] = useState<Sort>("featured");
  const sortId = useId();

  const shown = order(
    filter === "Everything" ? products : products.filter((product) => product.category === filter),
    sort,
  );

  return (
    <div>
      <div className="flex flex-col gap-5 border-b border-demo-fg/15 pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div role="group" aria-label="Show" className="-mx-3 flex flex-wrap">
          {filters.map((option) => {
            const active = option === filter;
            const count =
              option === "Everything"
                ? products.length
                : products.filter((product) => product.category === (option as Category)).length;
            return (
              <button
                key={option}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(option)}
                className="group inline-flex h-11 items-center gap-1.5 px-3"
              >
                <span
                  className={`argile-display text-xl transition-colors md:text-2xl ${
                    active
                      ? "underline decoration-demo-accent decoration-1 underline-offset-[0.3em]"
                      : "text-demo-fg/80 group-hover:text-demo-fg"
                  }`}
                >
                  {option}
                </span>
                <span className="self-start pt-2.5 text-[0.6875rem] tabular-nums text-demo-fg/80">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-3 text-sm">
          <p aria-live="polite" className="text-demo-fg/80">
            {shown.length} {shown.length === 1 ? "piece" : "pieces"}
          </p>
          <div className="flex items-center gap-2">
            <label htmlFor={sortId} className="text-demo-fg/80">
              Sort
            </label>
            <select
              id={sortId}
              value={sort}
              onChange={(event) => setSort(event.target.value as Sort)}
              className="h-10 cursor-pointer rounded-full border border-demo-fg/25 bg-transparent pr-8 pl-4 text-demo-fg"
            >
              {Object.entries(sorts).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <ul className="mt-8 grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 md:mt-10 md:grid-cols-3 lg:gap-x-8 lg:gap-y-16">
        {shown.map((product) => (
          <li key={product.slug}>
            <ProductCard product={product} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  const { openProduct } = useShop();
  const [first] = product.finishes;

  return (
    <button
      type="button"
      onClick={() => openProduct(product.slug)}
      className="group block w-full text-left"
    >
      <span className="relative flex aspect-[4/5] items-end justify-center overflow-hidden rounded-[1.5rem] bg-[var(--argile-shell)] px-[16%] pb-[10%] transition-colors duration-500 group-hover:bg-[var(--argile-paper)] md:rounded-[2rem]">
        <Vessel
          shape={product.shape}
          color={first.color}
          className="w-full transition-transform duration-700 ease-out group-hover:-translate-y-2"
        />
        {product.availability.startsWith("Last") ? (
          <span className="absolute top-3 left-3 rounded-full bg-[var(--argile-paper)] px-2.5 py-1 text-[0.6875rem] md:top-4 md:left-4 md:text-xs">
            {product.availability}
          </span>
        ) : null}
        <span className="absolute right-3 bottom-3 hidden rounded-full bg-demo-fg px-3 py-1.5 text-xs text-[var(--argile-paper)] opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100 md:right-4 md:bottom-4 md:inline-block">
          View
        </span>
      </span>
      <span className="mt-3 flex items-baseline justify-between gap-3">
        <span className="argile-display text-lg leading-tight md:text-xl">{product.name}</span>
        <span className="text-sm tabular-nums">{formatPrice(product.price)}</span>
      </span>
      <span className="mt-1 hidden text-sm leading-snug text-demo-fg/80 sm:block">{product.line}</span>
      <span className="mt-2.5 flex items-center gap-1.5">
        {product.finishes.map((finish) => (
          <span
            key={finish.name}
            aria-hidden="true"
            className="size-3 rounded-full ring-1 ring-demo-fg/20"
            style={{ backgroundColor: finish.color }}
          />
        ))}
        <span className="sr-only">
          In {product.finishes.map((finish) => finish.name).join(", ")}
        </span>
      </span>
    </button>
  );
}
