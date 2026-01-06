import React, { useState, useEffect } from "react";
import "./App.css";

import { db } from "./firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";

/* =========================
   CONFIGURAÇÃO PIX
========================= */
const PIX_KEY = "557a2d16-c830-4777-884a-834943c1b05e";
const FEATURED_PRICE = "R$ 5,00";

/* =========================
   CONSTANTES
========================= */
const CATEGORIES = [
  "Todas",
  "Veículos",
  "Ferramentas",
  "Livros",
  "Eletrodomésticos e Utilidades Domésticas",
  "Eletrônicos",
  "Móveis",
  "Esporte & Lazer",
  "Infantil & Brinquedos",
  "Outros",
];

const TYPES = ["Vender", "Trocar", "Alugar", "Emprestar"];

function App() {
  const [user, setUser] = useState(null);
  const [objects, setObjects] = useState([]);

  /* Cadastro */
  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [category, setCategory] = useState(CATEGORIES[1]);
  const [types, setTypes] = useState([]);
  const [requestFeatured, setRequestFeatured] = useState(false);

  /* Busca */
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("Todas");
  const [filterType, setFilterType] = useState("");

  /* =========================
     LOGIN SIMPLES
  ========================= */
  const login = () => {
    const u = { name: "Usuário", city: "Minha cidade" };
    setUser(u);
  };

  /* =========================
     FIRESTORE - LEITURA GLOBAL
  ========================= */
  useEffect(() => {
    const q = query(
      collection(db, "objects"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setObjects(list);
    });

    return () => unsubscribe();
  }, []);

  /* =========================
     FUNÇÕES
  ========================= */
  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setImage(reader.result);
    reader.readAsDataURL(file);
  };

  const toggleType = (t) => {
    setTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  const addObject = async () => {
    if (!text || !image || types.length === 0) {
      alert("Preencha descrição, imagem e ao menos um tipo.");
      return;
    }

    try {
      await addDoc(collection(db, "objects"), {
        text,
        image,
        category,
        types,
        city: user.city,
        featured: false,
        requestedFeatured: requestFeatured,
        createdAt: serverTimestamp(),
      });

      setText("");
      setImage(null);
      setTypes([]);
      setRequestFeatured(false);
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar no Firestore");
    }
  };

  /* =========================
     FILTRO
  ========================= */
  const filteredObjects = objects
    .filter((o) => {
      const matchText = o.text
        ?.toLowerCase()
        .includes(search.toLowerCase());

      const matchCategory =
        filterCategory === "Todas" || o.category === filterCategory;

      const matchType =
        !filterType || o.types?.includes(filterType);

      return matchText && matchCategory && matchType;
    })
    .sort((a, b) => (b.featured === true) - (a.featured === true));

  /* =========================
     UI
  ========================= */
  if (!user) {
    return (
      <div style={styles.center}>
        <h1 style={styles.logo}>SwapBook</h1>
        <p style={styles.subtitle}>Marketplace de objetos</p>
        <button style={styles.primaryButton} onClick={login}>
          Entrar
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2>SwapBook</h2>

      {/* BUSCA */}
      <div style={styles.searchBox}>
        <input
          style={styles.input}
          placeholder="Buscar objeto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          style={styles.input}
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>

        <select
          style={styles.input}
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="">Todos os tipos</option>
          {TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* CADASTRO */}
      <div style={styles.newItem}>
        <input
          style={styles.input}
          placeholder="Descrição do objeto"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <select
          style={styles.input}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {CATEGORIES.slice(1).map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>

        <div>
          {TYPES.map((t) => (
            <label key={t} style={{ marginRight: 10 }}>
              <input
                type="checkbox"
                checked={types.includes(t)}
                onChange={() => toggleType(t)}
              />{" "}
              {t}
            </label>
          ))}
        </div>

        <label>
          <input
            type="checkbox"
            checked={requestFeatured}
            onChange={() => setRequestFeatured(!requestFeatured)}
          />{" "}
          ⭐ Solicitar destaque ({FEATURED_PRICE})
        </label>

        {requestFeatured && (
          <div style={styles.pixBox}>
            <p>
              Pix de <b>{FEATURED_PRICE}</b>
            </p>
            <p>
              <b>Chave:</b>
              <br />
              {PIX_KEY}
            </p>
          </div>
        )}

        <input type="file" accept="image/*" onChange={handleImage} />
        {image && <img src={image} alt="" style={styles.preview} />}

        <button style={styles.primaryButton} onClick={addObject}>
          Publicar
        </button>
      </div>

      {/* LISTA */}
      <div style={styles.list}>
        {filteredObjects.map((o) => (
          <div key={o.id} style={styles.card}>
            <img src={o.image} alt="" style={styles.cardImage} />
            <div style={styles.cardTitle}>
              {o.featured && "⭐ "} {o.text}
            </div>
            <div style={styles.cardMeta}>
              {o.category} • {o.types.join(" / ")} • {o.city}
              {o.requestedFeatured && !o.featured && (
                <div style={{ fontSize: 12, color: "#b36b00" }}>
                  ⏳ Destaque solicitado
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================
   STYLES
========================= */
const styles = {
  center: { textAlign: "center", marginTop: 100 },
  logo: { fontSize: 42 },
  subtitle: { color: "#666" },
  container: { maxWidth: 600, margin: "auto", padding: 20 },
  searchBox: { display: "flex", gap: 10, marginBottom: 20 },
  newItem: { display: "flex", flexDirection: "column", gap: 10 },
  input: { padding: 10 },
  primaryButton: {
    padding: 12,
    background: "#1877f2",
    color: "#fff",
    border: "none",
    fontWeight: "bold",
    cursor: "pointer",
  },
  pixBox: {
    background: "#fff3cd",
    padding: 10,
    borderRadius: 6,
    border: "1px solid #ffeeba",
  },
  list: { marginTop: 30, display: "flex", flexDirection: "column", gap: 16 },
  card: { border: "1px solid #ddd", borderRadius: 8 },
  cardImage: {
    width: "100%",
    height: 180,
    objectFit: "contain",
    background: "#f0f0f0",
  },
  cardTitle: { padding: 10, fontWeight: "bold" },
  cardMeta: { padding: "0 10px 10px", fontSize: 13, color: "#666" },
  preview: {
    width: "100%",
    maxHeight: 150,
    objectFit: "contain",
    background: "#f0f0f0",
  },
};

export default App;


