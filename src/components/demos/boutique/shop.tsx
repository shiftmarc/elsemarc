"use client";

import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { formatPrice, getProduct, maison, type Product } from "./content";
import { Vessel } from "./vessel";

/*
 * The demo shop: a bag held in memory, a product sheet and a bag drawer.
 * Nothing leaves the page. There is no checkout, no payment and no stock;
 * the bag forgets everything on reload, and says plainly that it is a demo.
 */

type BagLine = { key: string; slug: string; finish: string; quantity: number };

type Shop = {
  lines: BagLine[];
  count: number;
  openProduct: (slug: string) => void;
  openBag: () => void;
};

const ShopContext = createContext<Shop | null>(null);

export function useShop() {
  const shop = useContext(ShopContext);
  if (!shop) throw new Error("useShop must be used inside <ShopProvider>.");
  return shop;
}

export function ShopProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<BagLine[]>([]);
  const [productSlug, setProductSlug] = useState<string | null>(null);
  const [bagOpen, setBagOpen] = useState(false);

  const count = lines.reduce((total, line) => total + line.quantity, 0);
  const product = productSlug ? getProduct(productSlug) : undefined;

  function add(slug: string, finish: string, quantity: number) {
    const key = `${slug}:${finish}`;
    setLines((current) =>
      current.some((line) => line.key === key)
        ? current.map((line) =>
            line.key === key ? { ...line, quantity: Math.min(9, line.quantity + quantity) } : line,
          )
        : [...current, { key, slug, finish, quantity }],
    );
  }

  function setQuantity(key: string, quantity: number) {
    setLines((current) =>
      quantity < 1
        ? current.filter((line) => line.key !== key)
        : current.map((line) => (line.key === key ? { ...line, quantity: Math.min(9, quantity) } : line)),
    );
  }

  const shop: Shop = {
    lines,
    count,
    openProduct: setProductSlug,
    openBag: () => setBagOpen(true),
  };

  return (
    <ShopContext.Provider value={shop}>
      {children}
      <Sheet
        open={product !== undefined}
        onClose={() => setProductSlug(null)}
        label={product?.name ?? "Product"}
        variant="centre"
      >
        {product ? (
          <ProductSheet
            key={product.slug}
            product={product}
            onAdd={add}
            onViewBag={() => {
              setProductSlug(null);
              setBagOpen(true);
            }}
            onClose={() => setProductSlug(null)}
          />
        ) : null}
      </Sheet>
      <Sheet open={bagOpen} onClose={() => setBagOpen(false)} label="Your bag" variant="side">
        <BagSheet lines={lines} setQuantity={setQuantity} onClose={() => setBagOpen(false)} />
      </Sheet>
    </ShopContext.Provider>
  );
}

/* Triggers ---------------------------------------------------------------- */

/** Any element that opens a product's sheet. */
export function ProductTrigger({
  slug,
  className = "",
  children,
}: {
  slug: string;
  className?: string;
  children: ReactNode;
}) {
  const { openProduct } = useShop();
  return (
    <button type="button" onClick={() => openProduct(slug)} className={className}>
      {children}
    </button>
  );
}

export function BagButton({ className = "" }: { className?: string }) {
  const { count, openBag } = useShop();
  return (
    <button
      type="button"
      onClick={openBag}
      aria-label={`Bag, ${count} ${count === 1 ? "item" : "items"}`}
      className={`inline-flex h-11 items-center gap-2 ${className}`}
    >
      Bag
      <span
        className={`inline-grid h-6 min-w-6 place-items-center rounded-full px-1.5 text-xs tabular-nums transition-colors ${
          count > 0 ? "bg-demo-accent text-[var(--argile-paper)]" : "bg-demo-fg/10"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

/* Sheet: a native modal dialog --------------------------------------------- */

function Sheet({
  open,
  onClose,
  label,
  variant,
  children,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  variant: "centre" | "side";
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    if (!open) return;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  const placement =
    variant === "side"
      ? "my-0 mr-0 ml-auto h-dvh max-h-none w-full max-w-[28rem] translate-x-0 starting:translate-x-full"
      : "m-auto max-h-[calc(100dvh-1.5rem)] w-[calc(100%-1.5rem)] max-w-5xl rounded-[1.75rem] translate-y-0 opacity-100 starting:translate-y-4 starting:opacity-0";

  return (
    <dialog
      ref={ref}
      aria-label={label}
      onClose={onClose}
      onClick={(event) => {
        // A click on the backdrop lands on the dialog itself.
        if (event.target === event.currentTarget) onClose();
      }}
      className={`overflow-y-auto overscroll-contain bg-[var(--argile-paper)] p-0 font-argile-sans text-demo-fg transition-[translate,opacity] duration-500 ease-out backdrop:bg-[rgb(40_24_14/0.4)] backdrop:backdrop-blur-[2px] ${placement}`}
    >
      {open ? children : null}
    </dialog>
  );
}

function CloseButton({ onClose, label }: { onClose: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label={label}
      className="inline-grid size-11 shrink-0 place-items-center rounded-full bg-demo-fg/[0.07] text-lg transition-colors hover:bg-demo-fg hover:text-[var(--argile-paper)]"
    >
      <span aria-hidden="true">×</span>
    </button>
  );
}

/* Product sheet ------------------------------------------------------------ */

function ProductSheet({
  product,
  onAdd,
  onViewBag,
  onClose,
}: {
  product: Product;
  onAdd: (slug: string, finish: string, quantity: number) => void;
  onViewBag: () => void;
  onClose: () => void;
}) {
  const [finish, setFinish] = useState(product.finishes[0]);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState<string | null>(null);
  const titleId = useId();
  const finishLabel = product.shape === "napkins" ? "Colour" : "Glaze";

  return (
    <article aria-labelledby={titleId} className="grid md:grid-cols-[1.1fr_1fr]">
      <figure className="relative flex flex-col justify-end bg-[var(--argile-shell)] px-[12%] pt-16 pb-8 md:min-h-[36rem] md:rounded-l-[1.75rem]">
        <Vessel
          shape={product.shape}
          color={finish.color}
          className="mx-auto w-full max-w-[17rem] transition-[filter] duration-500"
        />
        <figcaption className="mt-6 text-center text-xs text-demo-fg/80">
          {product.name} in {finish.name}. A drawing in place of photography.
        </figcaption>
      </figure>

      <div className="flex flex-col gap-6 p-6 md:p-10">
        <div className="flex items-start justify-between gap-4">
          <p className="pt-3 text-xs tracking-[0.18em] uppercase">{product.category}</p>
          <CloseButton onClose={onClose} label="Close product" />
        </div>

        <div>
          <h2 id={titleId} className="argile-display text-[clamp(2.25rem,1.6rem+2.4vw,3.25rem)] leading-[1.02]">
            {product.name}
          </h2>
          <p className="mt-2 text-lg tabular-nums">{formatPrice(product.price)}</p>
        </div>

        <p className="leading-relaxed">{product.description}</p>

        <fieldset>
          <legend className="text-sm">
            {finishLabel} <span className="text-demo-fg/80">— {finish.name}</span>
          </legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {product.finishes.map((option) => (
              <label
                key={option.name}
                className="group relative grid size-11 cursor-pointer place-items-center rounded-full"
              >
                <input
                  type="radio"
                  name={`${product.slug}-finish`}
                  value={option.name}
                  checked={option.name === finish.name}
                  onChange={() => {
                    setFinish(option);
                    setAdded(null);
                  }}
                  className="peer sr-only"
                />
                <span className="sr-only">{option.name}</span>
                <span
                  aria-hidden="true"
                  className="size-8 rounded-full ring-1 ring-demo-fg/20 ring-offset-2 ring-offset-[var(--argile-paper)] transition-shadow peer-checked:ring-2 peer-checked:ring-demo-fg peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-demo-accent"
                  style={{ backgroundColor: option.color }}
                />
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-wrap items-stretch gap-3">
          <Stepper
            label={`Quantity of ${product.name}`}
            value={quantity}
            onChange={(next) => {
              setQuantity(next);
              setAdded(null);
            }}
            min={1}
          />
          <button
            type="button"
            onClick={() => {
              onAdd(product.slug, finish.name, quantity);
              setAdded(`${quantity} × ${product.name} in ${finish.name}`);
            }}
            className="inline-flex h-12 flex-1 items-center justify-center gap-3 rounded-full bg-demo-accent px-6 whitespace-nowrap font-medium text-[var(--argile-paper)] transition-colors hover:bg-demo-fg"
          >
            Add to bag
            <span aria-hidden="true" className="hidden opacity-80 sm:inline">
              ·
            </span>
            <span className="hidden tabular-nums sm:inline">{formatPrice(product.price * quantity)}</span>
          </button>
        </div>

        <div aria-live="polite" className="-mt-2 min-h-6 text-sm">
          {added ? (
            <p className="flex flex-wrap items-baseline gap-x-3">
              <span>Added to your bag: {added}.</span>
              <button type="button" onClick={onViewBag} className="underline underline-offset-4 hover:text-demo-accent">
                View bag
              </button>
            </p>
          ) : (
            <p className="text-demo-fg/80">{product.availability}</p>
          )}
        </div>

        <div className="border-t border-demo-fg/15">
          {[
            ["Size", product.dimensions],
            ["Care", product.care],
            [
              "Shipping",
              `Free across Canada on orders over ${formatPrice(maison.freeShippingFrom)}. Each piece is wrapped in recycled paper and wool.`,
            ],
          ].map(([title, text]) => (
            <details key={title} className="group border-b border-demo-fg/15">
              <summary className="flex cursor-pointer list-none items-center justify-between py-3.5 text-sm font-medium [&::-webkit-details-marker]:hidden">
                {title}
                <span aria-hidden="true" className="text-lg leading-none transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="pb-4 text-sm leading-relaxed text-demo-fg/85">{text}</p>
            </details>
          ))}
        </div>

        <p className="text-xs leading-relaxed text-demo-fg/80">
          Demonstration shop. {product.name} is a fictional product; nothing here is for sale.
        </p>
      </div>
    </article>
  );
}

function Stepper({
  label,
  value,
  onChange,
  min,
  size = "large",
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  size?: "large" | "small";
}) {
  const box = size === "large" ? "h-12" : "h-9";
  const button = size === "large" ? "w-11" : "w-9";
  return (
    <div role="group" aria-label={label} className={`inline-flex items-center rounded-full border border-demo-fg/25 ${box}`}>
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        aria-label={min === 0 && value === 1 ? "Remove" : "One fewer"}
        className={`h-full rounded-l-full ${button} transition-colors hover:bg-demo-fg/[0.07] disabled:opacity-35`}
      >
        <span aria-hidden="true">−</span>
      </button>
      <output aria-live="polite" className="w-7 text-center tabular-nums">
        {value}
      </output>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={value >= 9}
        aria-label="One more"
        className={`h-full rounded-r-full ${button} transition-colors hover:bg-demo-fg/[0.07] disabled:opacity-35`}
      >
        <span aria-hidden="true">+</span>
      </button>
    </div>
  );
}

/* Bag ---------------------------------------------------------------------- */

function BagSheet({
  lines,
  setQuantity,
  onClose,
}: {
  lines: BagLine[];
  setQuantity: (key: string, quantity: number) => void;
  onClose: () => void;
}) {
  const [checkout, setCheckout] = useState(false);
  const items = lines.flatMap((line) => {
    const product = getProduct(line.slug);
    const finish = product?.finishes.find((option) => option.name === line.finish);
    return product && finish ? [{ ...line, product, finish }] : [];
  });
  const subtotal = items.reduce((total, item) => total + item.product.price * item.quantity, 0);
  const toFree = Math.max(0, maison.freeShippingFrom - subtotal);

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex items-center justify-between gap-4 border-b border-demo-fg/15 px-5 py-3 md:px-7">
        <h2 className="argile-display text-2xl">Your bag</h2>
        <CloseButton onClose={onClose} label="Close bag" />
      </div>

      <p className="mx-5 mt-5 rounded-2xl bg-[var(--argile-shell)] px-4 py-3 text-sm leading-relaxed md:mx-7">
        <strong className="font-semibold">Demonstration shop.</strong> Maison Argile is fictional:
        nothing here is for sale and no payment can be taken.
      </p>

      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 px-8 py-16 text-center">
          <Vessel shape="bowl" color="#e8dac6" className="w-28 opacity-80" />
          <p className="argile-display text-2xl italic">Your bag is empty.</p>
          <a
            href="#shop"
            onClick={onClose}
            className="inline-flex h-11 items-center rounded-full border border-demo-fg/30 px-5 text-sm transition-colors hover:bg-demo-fg hover:text-[var(--argile-paper)]"
          >
            Browse the shop
          </a>
        </div>
      ) : (
        <>
          <ul className="flex-1 px-5 md:px-7">
            {items.map((item) => (
              <li key={item.key} className="flex gap-4 border-b border-demo-fg/15 py-5">
                <div className="grid w-20 shrink-0 place-items-center rounded-2xl bg-[var(--argile-shell)] p-2">
                  <Vessel shape={item.product.shape} color={item.finish.color} className="w-full" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="flex justify-between gap-3">
                    <p className="font-medium">{item.product.name}</p>
                    <p className="tabular-nums">{formatPrice(item.product.price * item.quantity)}</p>
                  </div>
                  <p className="-mt-1 text-sm text-demo-fg/80">{item.finish.name}</p>
                  <div className="mt-auto flex items-center justify-between gap-3">
                    <Stepper
                      label={`Quantity of ${item.product.name} in ${item.finish.name}`}
                      value={item.quantity}
                      onChange={(next) => {
                        setQuantity(item.key, next);
                        setCheckout(false);
                      }}
                      min={0}
                      size="small"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setQuantity(item.key, 0);
                        setCheckout(false);
                      }}
                      className="text-sm underline underline-offset-4 hover:text-demo-accent"
                    >
                      Remove<span className="sr-only"> {item.product.name}</span>
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="sticky bottom-0 space-y-4 border-t border-demo-fg/15 bg-[var(--argile-paper)] px-5 pt-5 pb-6 md:px-7">
            <div>
              <p className="text-sm">
                {toFree > 0
                  ? `${formatPrice(toFree)} away from free shipping.`
                  : "Shipping is on us."}
              </p>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-demo-fg/10">
                <div
                  className="h-full rounded-full bg-demo-accent transition-[width] duration-700"
                  style={{ width: `${Math.min(100, (subtotal / maison.freeShippingFrom) * 100)}%` }}
                />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span>Subtotal</span>
              <span className="argile-display text-2xl tabular-nums">{formatPrice(subtotal)}</span>
            </div>
            <button
              type="button"
              onClick={() => setCheckout(true)}
              className="flex h-12 w-full items-center justify-center rounded-full bg-demo-fg font-medium text-[var(--argile-paper)] transition-colors hover:bg-demo-accent"
            >
              Checkout
            </button>
            <div aria-live="polite">
              {checkout ? (
                <p role="status" className="text-sm leading-relaxed">
                  This is where checkout would begin. Because this is a demonstration, no order was
                  placed, no payment was taken and nothing will ship.
                </p>
              ) : null}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
