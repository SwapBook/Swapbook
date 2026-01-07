import React, { useEffect, useState } from "react";
import "./App.css";

import { auth, db } from "./firebase";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

import {
  collection,
  addDoc,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";

/* =========================
   CONFIGURAÇÕES
========================= */
const PIX_KEY = "557a2d16-c830-4777-884a-834943c1b05e";
const FEATURED_PRICE = "R$ 5,00";

const TYPES = ["Vender", "Trocar", "Alugar", "Emprestar", "Doar"];

const CATEGORIES = [
  "Veículos",
  "Ferramentas",
  "Livros",
  "Eletrodomésticos e Utilidades Domésticas",
  "Eletrônicos",
  "Móveis",
  "Esporte & Lazer",
  "Infantil & Brinquedos",
  "Roupas",
  "Calçados",
  "Outros",
];

export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [city, setCity] = useState(localStorage.getItem("swapbook_city") || "");
  const [objects, setObjects] = useState([]);

  /* cadastro */
  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [types, setTypes] = useState([]);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [requestFeatured, setRequestFeatured] = useState(false);

  /* chat */
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");

  /* =========================
     AUTH + PERFIL
  ========================= */
  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setUser(null);
        setProfile(null);
        return;
      }

      setUser(u);
      const ref = doc(db, "users", u.uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        setProfile(snap.data());
        if (snap.data().city) {
          setCity(snap.data().city);
          localStorage.setItem("swapbook_city", snap.data().city);
        }
      } else {
        const newProfile = {
          uid: u.uid,
          name: u.displayName,
          photo: u.photoURL,
          email: u.email,
          city: city || "",
          rating: 5,
          ratingsCount: 0,
          createdAt: serverTimestamp(),
        };
        await setDoc(ref, newProfile);
        setProfile(newProfile);
      }
    });
  }, []);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const changeCity = async () => {
    const c = prompt("Informe sua cidade:");
    if (!c || !profile) return;

    setCity(c);
    localStorage.setItem("swapbook_city", c);

    await setDoc(
      doc(db, "users", profile.uid),
      { city: c },
      { merge: true }
    );
  };

  /* =========================
     OBJETOS
  ========================= */
  useEffect(() => {
    const q = query(collection(db, "objects"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => {
      setObjects(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, []);

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = () => setImage(r.result);
    r.readAsDataURL(file);
  };

  const toggleType = (t) =>
    setTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );

  const addObject = async () => {
    if (!text || !image || !city || types.length === 0) {
      alert("Preencha tudo.");
      return;
    }

    await addDoc(collection(db, "objects"), {
      text,
      image,
      category,
      types,
      city,
      ownerId: profile.uid,
      ownerName: profile.name,
      ownerPhoto: profile.photo,
      featured: false,
      requestedFeatured: requestFeatured,
      createdAt: serverTimestamp(),
    });

    setText("");
    setImage(null);
    setTypes([]);
    setRequestFeatured(false);
  };

  /* =========================
     CHAT
  ========================= */
  const openChat = async (obj) => {
    const chatId = [user.uid, obj.ownerId, obj.id].sort().join("_");
    setActiveChat({ id: chatId, object: obj });

    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt")
    );

    onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => d.data()));
    });
  };

  const sendMessage = async () => {
    if (!messageText || !activeChat) return;

    await addDoc(
      collection(db, "chats", activeChat.id, "messages"),
      {
        text: messageText,
        from: user.uid,
        fromName: profile.name,
        createdAt: serverTimestamp(),
      }
    );

    setMessageText("");
  };

  /* =========================
     UI
  ========================= */
  if (!user) {
    return (
      <div style={{ textAlign: "center", marginTop: 100 }}>
        <h1>SwapBook</h1>
        <p>
          Troque, doe, empreste ou venda itens da sua cidade com transparência e
          segurança.
        </p>
        <button onClick={login}>Entrar com Google</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 600, margin: "auto", padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <img src={profile?.photo} alt="" width={40} />
        <b>{profile?.name}</b>
        <button onClick={logout}>Sair</button>
      </div>

      <p>
        📍 {city} <button onClick={changeCity}>Alterar</button>
      </p>

      <h3>Novo objeto</h3>
      <input
        placeholder="Descrição"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <select onChange={(e) => setCategory(e.target.value)}>
        {CATEGORIES.map((c) => (
          <option key={c}>{c}</option>
        ))}
      </select>

      <div>
        {TYPES.map((t) => (
          <label key={t}>
            <input
              type="checkbox"
              checked={types.includes(t)}
              onChange={() => toggleType(t)}
            />{" "}
            {t}
          </label>
        ))}
      </div>

      <input type="file" onChange={handleImage} />
      <button onClick={addObject}>Publicar</button>

      <h3>Objetos em {city}</h3>
      {objects
        .filter((o) => o.city === city)
        .map((o) => (
          <div key={o.id} style={{ border: "1px solid #ccc", margin: 10 }}>
            <img src={o.image} alt="" width="100%" />
            <b>{o.text}</b>
            <p>{o.types.join(" / ")}</p>
            <button onClick={() => openChat(o)}>Conversar</button>
          </div>
        ))}

      {activeChat && (
        <div style={{ borderTop: "2px solid #000", marginTop: 20 }}>
          <h3>Chat</h3>
          {messages.map((m, i) => (
            <div key={i}>
              <b>{m.fromName}:</b> {m.text}
            </div>
          ))}
          <input
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
          />
          <button onClick={sendMessage}>Enviar</button>
        </div>
      )}
    </div>
  );
}
