import { motion } from "framer-motion";
import { Car, Check, Hotel, Minus, Plus, Plane, ShoppingBag, Trash2, AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMultiServiceCart, type CartPriceStatus, type CartServiceType } from "@/contexts/MultiServiceCartContext";

const serviceMeta: Record<CartServiceType, { label: string; icon: typeof Plane; color: string }> = {
  flight: { label: "Vol", icon: Plane, color: "text-blue-700 bg-blue-50" },
  hotel: { label: "Hôtel", icon: Hotel, color: "text-violet-700 bg-violet-50" },
  vehicle: { label: "Véhicule", icon: Car, color: "text-amber-700 bg-amber-50" },
};

function formatXaf(amount: number) {
  return `${new Intl.NumberFormat("fr-FR").format(amount)} FCFA`;
}

function priceStatusLabel(status: CartPriceStatus) {
  if (status === "live") return { label: "Tarif en direct", className: "text-emerald-700 bg-emerald-50" };
  if (status === "indicative") return { label: "Tarif indicatif à revalider", className: "text-amber-700 bg-amber-50" };
  return { label: "Tarif sur demande", className: "text-slate-700 bg-slate-100" };
}

export default function MultiServiceCart() {
  const { items, totalItems, pricedItemsTotal, hasOnRequestItems, addItem, removeItem, updateQuantity, clearCart } = useMultiServiceCart();

  const addOnRequestItem = (type: "hotel" | "vehicle") => {
    const isHotel = type === "hotel";
    const id = `${type}-request`;
    addItem({
      id,
      serviceType: type,
      title: isHotel ? "Hébergement à confirmer" : "Véhicule à confirmer",
      subtitle: isHotel ? "Destination et dates à préciser avec l’agence" : "Catégorie et lieu de retrait à préciser",
      price: 0,
      currency: "XAF",
      priceStatus: "on_request",
      metadata: { requestOnly: true },
    });
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 md:py-14">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-[0.22em] text-blue-600">Votre voyage, au même endroit</p>
            <h1 className="text-3xl font-black text-slate-900 md:text-4xl">Panier multi-services</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Combinez vos prestations de voyage dans un seul dossier. Les prix en direct restent soumis à une revalidation fournisseur avant émission.</p>
          </div>
          {items.length > 0 && <Button variant="outline" onClick={clearCart} className="rounded-xl border-slate-200 text-slate-600">Vider le panier</Button>}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <section className="space-y-4" aria-label="Prestations sélectionnées">
            {items.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
                <ShoppingBag className="mx-auto mb-4 h-12 w-12 text-blue-300" />
                <h2 className="text-xl font-black text-slate-900">Votre panier est vide</h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Ajoutez un vol depuis la recherche, puis complétez votre voyage avec un hôtel ou un véhicule sur demande.</p>
                <a href="/flights" className="mt-6 inline-flex h-12 items-center justify-center rounded-xl bg-blue-600 px-6 text-sm font-black text-white transition hover:bg-blue-700">Rechercher un vol <ArrowRight className="ml-2 h-4 w-4" /></a>
              </div>
            ) : items.map((item) => {
              const meta = serviceMeta[item.serviceType];
              const Icon = meta.icon;
              const price = priceStatusLabel(item.priceStatus);
              return (
                <motion.article layout key={item.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${meta.color}`}><Icon className="h-5 w-5" /></div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">{meta.label}</p>
                          <h2 className="mt-1 text-lg font-black text-slate-900">{item.title}</h2>
                          <p className="mt-1 text-sm text-slate-500">{item.subtitle}</p>
                        </div>
                        <button type="button" onClick={() => removeItem(item.id)} aria-label={`Supprimer ${item.title}`} className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button>
                      </div>
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${price.className}`}>{price.label}</span>
                        {item.serviceType === "flight" && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">Revalidation avant émission</span>}
                      </div>
                      <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2" aria-label={`Quantité ${item.quantity}`}>
                          <button type="button" onClick={() => updateQuantity(item.id, item.quantity - 1)} aria-label="Diminuer la quantité" className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600"><Minus className="h-3.5 w-3.5" /></button>
                          <span className="w-8 text-center text-sm font-black text-slate-800">{item.quantity}</span>
                          <button type="button" onClick={() => updateQuantity(item.id, item.quantity + 1)} aria-label="Augmenter la quantité" className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600"><Plus className="h-3.5 w-3.5" /></button>
                        </div>
                        <p className="text-lg font-black text-blue-900">{item.priceStatus === "on_request" ? "À confirmer" : formatXaf(item.price * item.quantity)}</p>
                      </div>
                    </div>
                  </div>
                </motion.article>
              );
            })}

            <div className="grid gap-4 pt-2 sm:grid-cols-2">
              <button type="button" onClick={() => addOnRequestItem("hotel")} className="rounded-2xl border border-violet-200 bg-violet-50/70 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md">
                <Hotel className="mb-2 h-5 w-5 text-violet-600" />
                <p className="font-black text-violet-950">Ajouter un hôtel</p>
                <p className="mt-1 text-xs leading-5 text-violet-800/70">Demande de disponibilité et de tarif à l’agence.</p>
              </button>
              <button type="button" onClick={() => addOnRequestItem("vehicle")} className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md">
                <Car className="mb-2 h-5 w-5 text-amber-600" />
                <p className="font-black text-amber-950">Ajouter un véhicule</p>
                <p className="mt-1 text-xs leading-5 text-amber-800/70">Choisissez une catégorie et un lieu de retrait avec l’agence.</p>
              </button>
            </div>
          </section>

          <aside className="h-fit rounded-3xl border border-blue-100 bg-white p-6 shadow-lg lg:sticky lg:top-24">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">Récapitulatif</p>
            <div className="mt-4 flex items-center justify-between text-sm text-slate-600"><span>{totalItems} prestation{totalItems > 1 ? "s" : ""}</span><span>{items.length} service{items.length > 1 ? "s" : ""}</span></div>
            <div className="my-5 border-t border-slate-100" />
            <div className="flex items-end justify-between gap-3"><span className="text-sm font-semibold text-slate-600">Sous-total chiffré</span><span className="text-2xl font-black text-blue-950">{formatXaf(pricedItemsTotal)}</span></div>
            {hasOnRequestItems && <div className="mt-4 flex gap-2 rounded-2xl bg-amber-50 p-3 text-xs leading-5 text-amber-900"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> Certains services seront tarifés et revalidés par l’agence avant confirmation.</div>}
            <Button disabled={!items.length} className="mt-6 h-12 w-full rounded-xl bg-blue-600 font-black hover:bg-blue-700" onClick={() => window.location.assign("/contact?from=panier")}>
              Continuer vers confirmation <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <p className="mt-3 text-center text-[11px] leading-5 text-slate-400">Le paiement et l’émission définitive seront disponibles après confirmation fournisseur et validation du compte client.</p>
            <div className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-800"><Check className="h-4 w-4" /> Dossier unique pour votre voyage</div>
          </aside>
        </div>
      </div>
    </main>
  );
}
