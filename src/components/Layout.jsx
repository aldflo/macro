import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Outlet, useLocation } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import Navbar from "./Navbar";
import PageTransition from "./PageTransition";
import { auth, db } from "../firebase.config";

function Layout() {
  const location = useLocation();

  const [modoOscuro, setModoOscuro] = useState(false);
  const [temaListo, setTemaListo] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setTemaListo(false);

      if (!user) {
        setModoOscuro(false);
        document.documentElement.setAttribute("data-theme", "claro");
        document.documentElement.style.colorScheme = "light";
        setTemaListo(true);
        return;
      }

      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        const oscuro = snap.exists() && snap.data()?.modoOscuro === true;

        setModoOscuro(oscuro);

        document.documentElement.setAttribute(
          "data-theme",
          oscuro ? "oscuro" : "claro"
        );

        document.documentElement.style.colorScheme =
          oscuro ? "dark" : "light";
      } catch (error) {
        console.error("Error cargando tema:", error);
        setModoOscuro(false);
      } finally {
        setTemaListo(true);
      }
    });

    return () => unsubscribe();
  }, []);

  // Si vienes desde otra página pulsando Servicios / Proyectos / Tienda...
  useEffect(() => {
    const id = location.state?.scrollTo;
    if (!id || location.pathname !== "/") return;

    const timer = window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

      window.history.replaceState({}, document.title);
    }, 260);

    return () => window.clearTimeout(timer);
  }, [location.pathname, location.state]);

  if (!temaListo) {
    return null;
  }

  return (
    <>
      <Navbar modoOscuro={modoOscuro} />

      <AnimatePresence mode="wait" initial={false}>
        <PageTransition key={location.pathname}>
          <Outlet context={{ modoOscuro, setModoOscuro }} />
        </PageTransition>
      </AnimatePresence>
    </>
  );
}

export default Layout;
