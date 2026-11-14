import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, Heart, Sparkles, ShoppingBag, Crown, HandHeart, Store } from "lucide-react";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Miumi World — Premium, Picks, Support & Marketplace" },
      { name: "description", content: "Explore Miumi Premium, affiliate picks, donations, and the community marketplace." },
    ],
  }),
  component: AffiliateShopPage,
});

type TabId = "premium" | "affiliate" | "donations" | "marketplace";

const tabs: Array<{ id: TabId; label: string; icon: typeof Crown; emoji: string }> = [
  { id: "premium", label: "Premium", icon: Crown, emoji: "✨" },
  { id: "affiliate", label: "Affiliate Picks", icon: ShoppingBag, emoji: "🎀" },
  { id: "donations", label: "Donations", icon: HandHeart, emoji: "💗" },
  { id: "marketplace", label: "Marketplace", icon: Store, emoji: "🛍️" },
];

// Add only genuine, approved affiliate URLs here.
const affiliateProducts: Array<{
  name: string;
  description: string;
  category: string;
  image?: string;
  affiliateUrl: string;
}> = [];

function ComingSoon({ emoji, title, description, note }: { emoji: string; title: string; description: string; note: string }) {
  return (
    <div style={{ textAlign: "center", padding: "46px 24px", borderRadius: 24, border: "1px dashed #e8c8d6", background: "rgba(255,255,255,.78)" }}>
      <div style={{ fontSize: 42, marginBottom: 12 }}>{emoji}</div>
      <h2 style={{ margin: "0 0 10px", color: "#795969", fontFamily: "Georgia, serif", fontSize: 29, fontWeight: 500 }}>{title}</h2>
      <p style={{ maxWidth: 570, margin: "0 auto 12px", color: "#927d86", lineHeight: 1.8 }}>{description}</p>
      <p style={{ maxWidth: 570, margin: "0 auto", color: "#b18498", fontSize: 13, lineHeight: 1.7 }}>{note}</p>
    </div>
  );
}

function AffiliateShopPage() {
  const [activeTab, setActiveTab] = useState<TabId>("premium");

  return (
    <main style={{ minHeight: "100vh", padding: "32px 20px 64px", background: "radial-gradient(circle at 10% 5%, #ffe8ef 0, transparent 32%), linear-gradient(145deg, #fff9fb 0%, #fff 55%, #f8f1ff 100%)", color: "#493640", fontFamily: "Nunito, sans-serif" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <a href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#8c6375", textDecoration: "none", fontWeight: 800, marginBottom: 32 }}>
          <ArrowLeft size={17} /> Back to Miumi
        </a>

        <section style={{ textAlign: "center", padding: "42px 20px", border: "1px solid #f2dce5", borderRadius: 28, background: "rgba(255,255,255,.8)", boxShadow: "0 18px 50px rgba(126,75,99,.08)" }}>
          <div style={{ color: "#d98aa8", display: "flex", justifyContent: "center", gap: 10 }}><Sparkles size={20} /><Heart size={20} /><Sparkles size={20} /></div>
          <p style={{ color: "#b47c94", fontSize: 12, fontWeight: 900, letterSpacing: 3, margin: "18px 0 8px" }}>THE MIUMI WORLD</p>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: "clamp(38px, 7vw, 66px)", fontWeight: 500, lineHeight: 1.08, margin: "0 auto 14px", color: "#684957" }}>A little world of lovely</h1>
          <p style={{ maxWidth: 590, margin: "0 auto", color: "#8b707b", lineHeight: 1.8 }}>Discover special perks, thoughtful finds, ways to support Miumi, and a place for lovely creations.</p>
        </section>

        <nav aria-label="Miumi sections" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))", gap: 10, margin: "28px 0 22px" }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const selected = activeTab === tab.id;
            return (
              <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} aria-pressed={selected}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 52, padding: "12px 14px", borderRadius: 16, border: selected ? "1px solid #d99ab2" : "1px solid #f0dce5", background: selected ? "linear-gradient(135deg, #f9e4ed, #f1e9fb)" : "rgba(255,255,255,.82)", color: "#795969", fontWeight: 900, cursor: "pointer", boxShadow: selected ? "0 7px 20px rgba(183,126,153,.12)" : "none" }}>
                <Icon size={17} /> {tab.label}
              </button>
            );
          })}
        </nav>

        <section style={{ padding: "8px 4px 0" }} aria-live="polite">
          {activeTab === "premium" && <ComingSoon emoji="👑" title="Miumi Premium" description="A future membership space for extra themes, special creative tools, exclusive experiences, and lovely little perks." note="Premium plans and pricing will be introduced only after the benefits and a secure, age-compliant payment option are ready. Nothing is being charged right now." />}

          {activeTab === "affiliate" && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}><ShoppingBag size={21} color="#c47e9b" /><h2 style={{ margin: 0, fontFamily: "Georgia, serif", fontSize: 27, fontWeight: 500 }}>Miumi recommends</h2></div>
              {affiliateProducts.length === 0 ? <ComingSoon emoji="🎀" title="Our first lovely finds are being curated" description="Useful recommendations will appear here once the relevant affiliate programmes approve the account and issue genuine tracking links." note="If you buy through a qualifying affiliate link later, Miumi may earn a commission at no extra cost to you. Recommendations will be clearly disclosed." /> : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 18 }}>
                  {affiliateProducts.map((product) => <article key={product.affiliateUrl} style={{ overflow: "hidden", borderRadius: 20, background: "#fff", border: "1px solid #f1e1e8", padding: 16 }}>
                    {product.image ? <img src={product.image} alt={product.name} style={{ width: "100%", aspectRatio: "4 / 3", objectFit: "cover", borderRadius: 14 }} /> : null}
                    <p style={{ color: "#bd829a", fontSize: 11, fontWeight: 900, letterSpacing: 1.5 }}>{product.category.toUpperCase()}</p>
                    <h3 style={{ color: "#684957" }}>{product.name}</h3><p style={{ color: "#8b707b", lineHeight: 1.6 }}>{product.description}</p>
                    <a href={product.affiliateUrl} target="_blank" rel="sponsored nofollow noopener noreferrer" style={{ display: "inline-flex", padding: "11px 17px", borderRadius: 999, background: "#f7e4ec", color: "#754d60", fontWeight: 900, textDecoration: "none" }}>View find ↗</a>
                  </article>)}
                </div>
              )}
            </>
          )}

          {activeTab === "donations" && <ComingSoon emoji="💗" title="Support Miumi" description="If you enjoy Miumi, you will be able to support its development and help us keep creating new experiences." note="Donation options will be added only after a legitimate payment provider and an appropriate account arrangement are confirmed. No payment link is active yet." />}

          {activeTab === "marketplace" && <ComingSoon emoji="🛍️" title="The Miumi Marketplace" description="A future space to discover digital creations, art, templates, handmade finds, and other products from independent creators." note="Listings, seller rules, safe checkout, and any fees will be set up before the marketplace opens. No buying or selling is active yet." />}
        </section>

        <p style={{ maxWidth: 760, margin: "34px auto 0", textAlign: "center", color: "#9b8790", fontSize: 12, lineHeight: 1.7 }}>Miumi is building these sections gradually. Payment, donation, membership, and marketplace features will remain inactive until their providers, terms, and safety checks are in place.</p>
      </div>
    </main>
  );
}
