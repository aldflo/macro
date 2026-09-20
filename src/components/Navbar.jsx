import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaBars,
  FaChevronRight,
  FaCode,
  FaHome,
  FaLayerGroup,
  FaShoppingBag,
  FaSignInAlt,
  FaSignOutAlt,
  FaTimes,
  FaUser,
  FaUserPlus,
  FaUserShield,
} from "react-icons/fa";

import { auth, db } from "../firebase.config";

const spring = {
  type: "spring",
  stiffness: 420,
  damping: 34,
  mass: 0.7,
};

const navItems = [
  { id: "inicio", texto: "Inicio", icono: FaHome },
  { id: "servicios", texto: "Servicios", icono: FaLayerGroup },
  { id: "proyectos", texto: "Proyectos", icono: FaCode },
  { id: "tienda", texto: "Tienda", icono: FaShoppingBag },
  { id: "contacto", texto: "Contacto", icono: null },
];

function Navbar({ modoOscuro = false }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [cargandoUsuario, setCargandoUsuario] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [seccionActiva, setSeccionActiva] = useState("inicio");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      try {
        setCargandoUsuario(true);

        if (!currentUser) {
          setUser(null);
          setRole(null);
          return;
        }

        setUser(currentUser);

        const snap = await getDoc(doc(db, "users", currentUser.uid));
        setRole(snap.exists() ? snap.data()?.role || "cliente" : "cliente");
      } catch (error) {
        console.error("Error obteniendo usuario:", error);
        setRole("cliente");
      } finally {
        setCargandoUsuario(false);
      }
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    const manejarScroll = () => setScrolled(window.scrollY > 20);
    manejarScroll();
    window.addEventListener("scroll", manejarScroll, { passive: true });
    return () => window.removeEventListener("scroll", manejarScroll);
  }, []);

  useEffect(() => {
    const cerrarDesktop = () => {
      if (window.innerWidth >= 1024) setOpen(false);
    };

    window.addEventListener("resize", cerrarDesktop);
    return () => window.removeEventListener("resize", cerrarDesktop);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Detecta automáticamente la sección visible en Home
  useEffect(() => {
    if (location.pathname !== "/") return;

    const ids = navItems.map((item) => item.id);
    const elementos = ids
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    if (!elementos.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibles = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visibles[0]?.target?.id) {
          setSeccionActiva(visibles[0].target.id);
        }
      },
      {
        root: null,
        rootMargin: "-18% 0px -62% 0px",
        threshold: [0.05, 0.12, 0.2, 0.35, 0.5],
      }
    );

    elementos.forEach((elemento) => observer.observe(elemento));
    return () => observer.disconnect();
  }, [location.pathname]);

  useEffect(() => {
    if (location.pathname !== "/") {
      setSeccionActiva("");
    }
  }, [location.pathname]);

  const irASeccion = (id) => {
    setOpen(false);
    setSeccionActiva(id);

    if (location.pathname !== "/") {
      navigate("/", { state: { scrollTo: id } });
      return;
    }

    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setOpen(false);
      navigate("/");
    } catch (error) {
      console.error("Error cerrando sesión:", error);
    }
  };

  const rutaPanel = role === "admin" ? "/admin" : "/cliente";
  const textoPanel = role === "admin" ? "Panel Admin" : "Mi cuenta";

  const glass = useMemo(() => {
    if (modoOscuro) {
      return scrolled
        ? "bg-slate-950/72 border-white/10 text-white shadow-[0_18px_60px_rgba(0,0,0,.24)]"
        : "bg-slate-950/46 border-white/10 text-white";
    }

    return scrolled
      ? "bg-white/76 border-white/55 text-slate-800 shadow-[0_18px_55px_rgba(15,23,42,.12)]"
      : "bg-white/52 border-white/45 text-slate-800";
  }, [modoOscuro, scrolled]);

  return (
    <>
      <motion.nav
        initial={{ y: -90, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        className={`
          fixed inset-x-0 top-0 z-[90] h-20 border-b
          backdrop-blur-2xl supports-[backdrop-filter]:backdrop-blur-2xl
          transition-[background-color,border-color,box-shadow] duration-500
          ${glass}
        `}
      >
        <motion.div
          className="absolute inset-x-0 top-0 h-px pointer-events-none"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(103,232,249,.78), rgba(59,130,246,.62), transparent)",
          }}
          animate={{ opacity: scrolled ? [0.45, 0.95, 0.45] : 0.55 }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="max-w-[1500px] mx-auto h-full px-5 md:px-7 xl:px-8 flex items-center">
          <Link
            to="/"
            onClick={() => {
              setOpen(false);
              setSeccionActiva("inicio");
            }}
            className="flex items-center gap-3 shrink-0 group"
          >
            <motion.div
              whileHover={{ scale: 1.08, rotate: -5 }}
              whileTap={{ scale: 0.94 }}
              transition={spring}
              className="
                w-11 h-11 rounded-2xl
                bg-gradient-to-br from-cyan-400 via-sky-500 to-blue-600
                text-white flex items-center justify-center
                shadow-[0_10px_28px_rgba(14,165,233,.28)]
                border border-white/25
              "
            >
              <FaCode />
            </motion.div>

            <motion.div
              whileHover={{ x: 2 }}
              transition={spring}
            >
              <h1 className="text-xl xl:text-2xl font-black tracking-[0.08em] leading-none">
                MACRO
              </h1>
              <span className="text-[9px] xl:text-[10px] uppercase tracking-[0.24em] text-sky-500 font-bold">
                Tecnología & Servicios
              </span>
            </motion.div>
          </Link>

          <div className="hidden lg:flex flex-1 justify-center items-center gap-3 xl:gap-5 px-4">
            {navItems.map((item) => {
              const Icon = item.icono;
              const activo = seccionActiva === item.id;

              return (
                <motion.button
                  key={item.id}
                  type="button"
                  onClick={() => irASeccion(item.id)}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  transition={spring}
                  className={`
                    relative h-20 px-3 flex items-center gap-2
                    text-sm xl:text-[15px] font-semibold whitespace-nowrap
                    transition-colors duration-300
                    ${activo
                      ? "text-sky-500"
                      : modoOscuro
                        ? "text-slate-200 hover:text-sky-300"
                        : "text-slate-700 hover:text-sky-500"}
                  `}
                >
                  {Icon && (
                    <motion.span
                      animate={
                        activo
                          ? { scale: [1, 1.18, 1], rotate: [0, -8, 7, 0] }
                          : { scale: 1, rotate: 0 }
                      }
                      transition={{ duration: 0.48, ease: "easeOut" }}
                      className="relative z-10"
                    >
                      <Icon />
                    </motion.span>
                  )}

                  <span className="relative z-10">{item.texto}</span>

                  {activo && (
                    <>
                      <motion.span
                        layoutId="macro-nav-active-pill"
                        transition={spring}
                        className="
                          absolute inset-x-1 bottom-[14px] h-8 rounded-xl
                          bg-sky-400/[0.075] border border-sky-300/10
                          -z-0
                        "
                      />
                      <motion.span
                        layoutId="macro-nav-active-line"
                        transition={spring}
                        className="
                          absolute left-3 right-3 bottom-[8px] h-[3px] rounded-full
                          bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600
                          shadow-[0_0_16px_rgba(14,165,233,.60)]
                        "
                      />
                    </>
                  )}
                </motion.button>
              );
            })}
          </div>

          <div className="hidden lg:flex items-center gap-2 shrink-0">
            <AnimatePresence mode="wait">
              {!cargandoUsuario && user && (
                <motion.div
                  key="panel"
                  initial={{ opacity: 0, x: 14, scale: 0.96 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 10, scale: 0.96 }}
                  transition={{ duration: 0.28 }}
                >
                  <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}>
                    <Link
                      to={rutaPanel}
                      className="
                        h-11 px-4 rounded-xl bg-white/28 backdrop-blur-xl
                        border border-sky-300/30 text-sky-600
                        hover:bg-white/48 hover:border-sky-300/50
                        font-semibold text-sm flex items-center gap-2
                        shadow-[0_8px_24px_rgba(14,165,233,.08)]
                        transition-all duration-300
                      "
                    >
                      {role === "admin" ? <FaUserShield /> : <FaUser />}
                      {textoPanel}
                    </Link>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {!cargandoUsuario &&
              (user ? (
                <motion.button
                  type="button"
                  onClick={handleLogout}
                  whileHover={{ y: -2, scale: 1.015 }}
                  whileTap={{ scale: 0.96 }}
                  className="
                    h-11 px-4 rounded-xl bg-white/15 backdrop-blur-xl
                    border border-white/20 text-slate-500
                    hover:text-red-500 hover:bg-red-50/50 hover:border-red-200/50
                    text-sm font-medium flex items-center gap-2
                    transition-all duration-300
                  "
                >
                  <FaSignOutAlt />
                  Salir
                </motion.button>
              ) : (
                <>
                  <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}>
                    <Link
                      to="/login"
                      className="
                        h-11 px-4 rounded-xl bg-white/22 backdrop-blur-xl
                        border border-white/35 text-slate-700
                        hover:bg-white/45 hover:border-sky-300/50 hover:text-sky-600
                        flex items-center gap-2 text-sm font-semibold
                        shadow-[0_8px_24px_rgba(15,23,42,.06)]
                        transition-all duration-300
                      "
                    >
                      <FaSignInAlt />
                      Iniciar sesión
                    </Link>
                  </motion.div>

                  <motion.div whileHover={{ y: -2, scale: 1.015 }} whileTap={{ scale: 0.97 }}>
                    <Link
                      to="/register"
                      className="
                        h-11 px-5 rounded-xl
                        bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600
                        border border-sky-300/35 text-white
                        flex items-center gap-2 text-sm font-bold
                        shadow-[0_10px_30px_rgba(14,165,233,.28)]
                        hover:shadow-[0_16px_42px_rgba(14,165,233,.40)]
                        transition-all duration-300
                      "
                    >
                      <FaUserPlus />
                      Crear cuenta
                    </Link>
                  </motion.div>
                </>
              ))}
          </div>

          <motion.button
            type="button"
            onClick={() => setOpen((actual) => !actual)}
            whileTap={{ scale: 0.9 }}
            className={`
              lg:hidden ml-auto w-11 h-11 rounded-xl border
              flex items-center justify-center text-xl backdrop-blur-xl
              ${modoOscuro
                ? "bg-slate-900/55 border-white/10 text-white"
                : "bg-white/35 border-white/40 text-slate-700"}
            `}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={open ? "cerrar" : "abrir"}
                initial={{ opacity: 0, rotate: -90, scale: 0.7 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: 90, scale: 0.7 }}
                transition={{ duration: 0.18 }}
              >
                {open ? <FaTimes /> : <FaBars />}
              </motion.span>
            </AnimatePresence>
          </motion.button>
        </div>
      </motion.nav>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="overlay"
              onClick={() => setOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="lg:hidden fixed inset-0 z-[91] bg-slate-950/45 backdrop-blur-sm"
            />

            <motion.aside
              key="sidebar"
              initial={{ x: "100%", opacity: 0.65 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0.65 }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className={`
                lg:hidden fixed top-0 right-0 z-[92]
                w-[88%] max-w-[390px] h-dvh
                backdrop-blur-2xl border-l shadow-[-20px_0_60px_rgba(15,23,42,.16)]
                ${modoOscuro
                  ? "bg-slate-950/88 border-white/10 text-white"
                  : "bg-white/88 border-white/40 text-slate-900"}
              `}
            >
              <div className="h-20 px-5 border-b border-white/25 flex items-center justify-between">
                <Link
                  to="/"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 text-white flex items-center justify-center shadow-lg">
                    <FaCode />
                  </div>
                  <div>
                    <p className="font-black tracking-widest">MACRO</p>
                    <p className="text-[9px] text-sky-500 uppercase tracking-[0.2em]">
                      Tecnología & Servicios
                    </p>
                  </div>
                </Link>

                <motion.button
                  type="button"
                  onClick={() => setOpen(false)}
                  whileHover={{ rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-10 h-10 rounded-xl bg-white/20 border border-white/20 flex items-center justify-center text-slate-500"
                >
                  <FaTimes />
                </motion.button>
              </div>

              <div className="p-5 overflow-y-auto h-[calc(100dvh-80px)]">
                {!cargandoUsuario && user && (
                  <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 }}
                  >
                    <Link
                      to={rutaPanel}
                      onClick={() => setOpen(false)}
                      className="
                        mb-6 p-4 rounded-2xl bg-white/35 backdrop-blur-xl
                        border border-sky-200/40 flex items-center justify-between
                        shadow-[0_10px_30px_rgba(15,23,42,.08)]
                      "
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-sky-500 text-white flex items-center justify-center">
                          {role === "admin" ? <FaUserShield /> : <FaUser />}
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Cuenta Macro</p>
                          <p className="font-bold">{textoPanel}</p>
                        </div>
                      </div>
                      <FaChevronRight className="text-sky-400" />
                    </Link>
                  </motion.div>
                )}

                <div className="space-y-2">
                  {navItems.map((item, index) => (
                    <MobileButton
                      key={item.id}
                      icon={item.icono ? (() => {
                        const I = item.icono;
                        return <I />;
                      })() : null}
                      texto={item.texto}
                      activo={seccionActiva === item.id}
                      delay={0.03 * index}
                      accion={() => irASeccion(item.id)}
                    />
                  ))}
                </div>

                <div className="mt-7 pt-6 border-t border-white/25">
                  {!cargandoUsuario &&
                    (user ? (
                      <motion.button
                        type="button"
                        onClick={handleLogout}
                        whileTap={{ scale: 0.97 }}
                        className="
                          w-full py-3.5 rounded-xl bg-red-50/55 backdrop-blur-xl
                          border border-red-200/35 text-red-500 font-bold
                          flex items-center justify-center gap-2
                        "
                      >
                        <FaSignOutAlt />
                        Cerrar sesión
                      </motion.button>
                    ) : (
                      <div className="space-y-3">
                        <motion.div whileTap={{ scale: 0.97 }}>
                          <Link
                            to="/login"
                            onClick={() => setOpen(false)}
                            className="
                              w-full py-3.5 rounded-xl bg-white/28 backdrop-blur-xl
                              border border-white/35 flex items-center justify-center gap-2 font-semibold
                            "
                          >
                            <FaSignInAlt />
                            Iniciar sesión
                          </Link>
                        </motion.div>

                        <motion.div whileTap={{ scale: 0.97 }}>
                          <Link
                            to="/register"
                            onClick={() => setOpen(false)}
                            className="
                              w-full py-3.5 rounded-xl
                              bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600
                              border border-sky-300/30 text-white
                              flex items-center justify-center gap-2 font-bold
                              shadow-[0_12px_34px_rgba(14,165,233,.25)]
                            "
                          >
                            <FaUserPlus />
                            Crear cuenta
                          </Link>
                        </motion.div>
                      </div>
                    ))}
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function MobileButton({
  icon,
  texto,
  accion,
  activo = false,
  delay = 0,
}) {
  return (
    <motion.button
      type="button"
      onClick={accion}
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.28 }}
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.98 }}
      className={`
        relative w-full px-4 py-3.5 rounded-xl border
        flex items-center justify-between overflow-hidden
        transition-colors duration-300
        ${activo
          ? "bg-sky-500/10 border-sky-300/35 text-sky-600"
          : "bg-white/16 border-transparent hover:bg-white/35 hover:border-white/30 text-slate-600 hover:text-sky-600"}
      `}
    >
      {activo && (
        <motion.span
          layoutId="macro-mobile-active"
          className="absolute left-0 top-2 bottom-2 w-1 rounded-full bg-sky-500"
          transition={spring}
        />
      )}

      <div className="flex items-center gap-3">
        <motion.span
          animate={activo ? { scale: [1, 1.2, 1] } : {}}
          className="text-sky-500"
        >
          {icon}
        </motion.span>
        <span className="font-medium">{texto}</span>
      </div>

      <motion.span animate={activo ? { x: [0, 3, 0] } : { x: 0 }}>
        <FaChevronRight size={11} className="opacity-40" />
      </motion.span>
    </motion.button>
  );
}

export default Navbar;
