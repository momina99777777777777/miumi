import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, Heart, Sparkles, ShoppingBag } from "lucide-react";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Miumi Picks — Lovely finds for everyday life" },
      {
        name: "description",
        content:
          "A curated corner for useful, lovely finds. Miumi may earn a commission from qualifying purchases.",
      },
    ],
  }),
  component: AffiliateShopPage,
});

// Add only genuine, approved affiliate URLs here. Never replace these with ordinary
// product URLs and describe them as affiliate links.
const affiliateProducts: Array<{
  name: string;
  description: string;
  category: string;
  image?: string;
  affiliateUrl: string;
}> = [];

function AffiliateShopPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "32px 20px 64px",
        background:
          "radial-gradient(circle at 10% 5%, #ffe8ef 0, transparent 32%), linear-gradient(145deg, #fff9fb 0%, #fff 55%, #f8f1ff 100%)",
        color: "#493640",
        fontFamily: "Nunito, sans-serif",
      }}
    >
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <a
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            color: "#8c6375",
            textDecoration: "none",
            fontWeight: 800,
            marginBottom: 32,
          }}
        >
          <ArrowLeft size={17} /> Back to Miumi
        </a>

        <section
          style={{
            textAlign: "center",
            padding: "42px 20px",
            border: "1px solid #f2dce5",
            borderRadius: 28,
            background: "rgba(255,255,255,.78)",
            boxShadow: "0 18px 50px rgba(126,75,99,.08)",
          }}
        >
          <div style={{ color: "#d98aa8", display: "flex", justifyContent: "center", gap: 10 }}>
            <Sparkles size={20} />
            <Heart size={20} />
            <Sparkles size={20} />
          </div>
          <p
            style={{
              color: "#b47c94",
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: 3,
              margin: "18px 0 8px",
            }}
          >
            THE MIUMI EDIT
          </p>
          <h1
            style={{
              fontFamily: "Georgia, serif",
              fontSize: "clamp(38px, 7vw, 66px)",
              fontWeight: 500,
              lineHeight: 1.08,
              margin: "0 auto 14px",
              color: "#684957",
            }}
          >
            Little finds, lots of lovely
          </h1>
          <p style={{ maxWidth: 590, margin: "0 auto", color: "#8b707b", lineHeight: 1.8 }}>
            A thoughtful collection of useful things for creative days, study
            sessions, and everyday moments.
          </p>
        </section>

        <section style={{ padding: "38px 4px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
            <ShoppingBag size={21} color="#c47e9b" />
            <h2 style={{ margin: 0, fontFamily: "Georgia, serif", fontSize: 27, fontWeight: 500 }}>
              Miumi recommends
            </h2>
          </div>

          {affiliateProducts.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "42px 22px",
                borderRadius: 22,
                border: "1px dashed #e8c8d6",
                background: "rgba(255,255,255,.72)",
              }}
            >
              <div style={{ fontSize: 34, marginBottom: 10 }}>🎀</div>
              <h3 style={{ margin: "0 0 8px", color: "#795969", fontSize: 20 }}>
                Our first lovely finds are being curated
              </h3>
              <p style={{ maxWidth: 520, margin: "0 auto", color: "#927d86", lineHeight: 1.7 }}>
                We're preparing useful recommendations. Products and shop links
                will appear here after the relevant affiliate programmes approve
                the account and issue genuine tracking links.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 18,
              }}
            >
              {affiliateProducts.map((product) => (
                <article
                  key={product.affiliateUrl}
                  style={{
                    overflow: "hidden",
                    borderRadius: 20,
                    background: "#fff",
                    border: "1px solid #f1e1e8",
                    padding: 16,
                  }}
                >
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      style={{ width: "100%", aspectRatio: "4 / 3", objectFit: "cover", borderRadius: 14 }}
                    />
                  ) : null}
                  <p style={{ color: "#bd829a", fontSize: 11, fontWeight: 900, letterSpacing: 1.5 }}>
                    {product.category.toUpperCase()}
                  </p>
                  <h3 style={{ color: "#684957" }}>{product.name}</h3>
                  <p style={{ color: "#8b707b", lineHeight: 1.6 }}>{product.description}</p>
                  <a
                    href={product.affiliateUrl}
                    target="_blank"
                    rel="sponsored nofollow noopener noreferrer"
                    style={{
                      display: "inline-flex",
                      padding: "11px 17px",
                      borderRadius: 999,
                      background: "#f7e4ec",
                      color: "#754d60",
                      fontWeight: 900,
                      textDecoration: "none",
                    }}
                  >
                    View find ↗
                  </a>
                </article>
              ))}
            </div>
          )}
        </section>

        <p
          style={{
            maxWidth: 760,
            margin: "34px auto 0",
            textAlign: "center",
            color: "#9b8790",
            fontSize: 12,
            lineHeight: 1.7,
          }}
        >
          Affiliate disclosure: If you follow an affiliate link and make a
          qualifying purchase, Miumi may receive a commission at no extra cost
          to you. Recommendations will be clearly identified.
        </p>
      </div>
    </main>
  );
}
