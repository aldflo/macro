import {
  useEffect,
  useState,
} from "react";

import Navbar from "./Navbar";

import {
  Outlet,
  useLocation,
} from "react-router-dom";

import {
  onAuthStateChanged,
} from "firebase/auth";

import {
  doc,
  getDoc,
} from "firebase/firestore";

import {
  auth,
  db,
} from "../firebase.config";


function Layout() {
  const location = useLocation();

  const [
    modoOscuro,
    setModoOscuro,
  ] = useState(false);

  const [
    temaListo,
    setTemaListo,
  ] = useState(false);


  /* =========================================
     CARGAR TEMA
  ========================================= */

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (user) => {
          setTemaListo(false);

          if (!user) {
            setModoOscuro(false);

            document.documentElement.setAttribute(
              "data-theme",
              "claro"
            );

            document.documentElement.style.colorScheme =
              "light";

            setTemaListo(true);

            return;
          }

          const claveTema =
            `tema_${user.uid}`;

          const temaLocal =
            localStorage.getItem(
              claveTema
            );

          if (
            temaLocal === "oscuro" ||
            temaLocal === "claro"
          ) {
            const oscuro =
              temaLocal === "oscuro";

            setModoOscuro(oscuro);

            document.documentElement.setAttribute(
              "data-theme",
              temaLocal
            );

            document.documentElement.style.colorScheme =
              oscuro
                ? "dark"
                : "light";

            setTemaListo(true);

            return;
          }

          try {
            const usuarioRef =
              doc(
                db,
                "users",
                user.uid
              );

            const snapshot =
              await getDoc(
                usuarioRef
              );

            const temaFirestore =
              snapshot.exists()
                ? snapshot.data()
                    ?.temaPreferido
                : null;

            const temaInicial =
              temaFirestore === "oscuro"
                ? "oscuro"
                : "claro";

            const oscuro =
              temaInicial === "oscuro";

            localStorage.setItem(
              claveTema,
              temaInicial
            );

            setModoOscuro(oscuro);

            document.documentElement.setAttribute(
              "data-theme",
              temaInicial
            );

            document.documentElement.style.colorScheme =
              oscuro
                ? "dark"
                : "light";

          } catch (error) {
            console.error(
              "Error cargando tema:",
              error
            );

            localStorage.setItem(
              claveTema,
              "claro"
            );

            setModoOscuro(false);

            document.documentElement.setAttribute(
              "data-theme",
              "claro"
            );

            document.documentElement.style.colorScheme =
              "light";

          } finally {
            setTemaListo(true);
          }
        }
      );

    return () =>
      unsubscribe();

  }, []);


  /* =========================================
     ACTUALIZAR TEMA
  ========================================= */

  const actualizarTema =
    (nuevoTema) => {
      const user =
        auth.currentUser;

      const tema =
        nuevoTema === "oscuro"
          ? "oscuro"
          : "claro";

      const oscuro =
        tema === "oscuro";

      if (user) {
        localStorage.setItem(
          `tema_${user.uid}`,
          tema
        );
      }

      setModoOscuro(oscuro);

      document.documentElement.setAttribute(
        "data-theme",
        tema
      );

      document.documentElement.style.colorScheme =
        oscuro
          ? "dark"
          : "light";
    };


  /* =========================================
     LOADING
  ========================================= */

  if (!temaListo) {
    return (
      <div className="min-h-screen bg-sky-50 flex items-center justify-center">

        <div className="text-center">

          <div
            className="
              w-11
              h-11
              border-4
              border-sky-100
              border-t-sky-500
              rounded-full
              animate-spin
              mx-auto
            "
          />

          <p className="text-slate-500 mt-4">
            Cargando Macro...
          </p>

        </div>

      </div>
    );
  }


  /* =========================================
     HOME DEBAJO DEL NAVBAR
     En "/" dejamos que el hero pase por debajo
     del navbar transparente.
  ========================================= */

  const esHome =
    location.pathname === "/";


  return (
    <div
      className={`
        min-h-screen
        transition-colors
        duration-300

        ${
          modoOscuro
            ? "bg-slate-950 text-white"
            : "bg-[#f7fcff] text-slate-900"
        }
      `}
    >

      <Navbar
        modoOscuro={modoOscuro}
      />


      <main
        className={`
          min-h-screen
          transition-colors
          duration-300

          ${
            esHome
              ? "pt-0"
              : "pt-20"
          }

          ${
            modoOscuro
              ? "bg-slate-950"
              : "bg-[#f7fcff]"
          }
        `}
      >

        <Outlet
          context={{
            modoOscuro,
            actualizarTema,
          }}
        />

      </main>

    </div>
  );
}


export default Layout;
