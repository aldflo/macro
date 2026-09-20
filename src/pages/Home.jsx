import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Link,
  useNavigate,
  useOutletContext,
} from "react-router-dom";

import {
  collection,
  onSnapshot,
} from "firebase/firestore";

import {
  onAuthStateChanged,
} from "firebase/auth";

import {
  auth,
  db,
} from "../firebase.config";

import PublicacionesFeed
  from "../components/PublicacionesFeed";

import {
  FaArrowRight,
  FaBolt,
  FaBullhorn,
  FaCamera,
  FaExternalLinkAlt,
  FaGlobe,
  FaLaptopCode,
  FaMobileAlt,
  FaPlay,
  FaRocket,
  FaShoppingBag,
  FaStore,
  FaUserPlus,
  FaUsers,
} from "react-icons/fa";
import {
  FaChartBar,
} from "react-icons/fa6";

const HERO_VIDEO_URL =
  "https://res.cloudinary.com/dxj4iczvk/video/upload/v1789864582/hero_10s_web_jg1dm5.mp4";

const FONDO_VIDEO_URL =
  "https://res.cloudinary.com/dxj4iczvk/video/upload/q_auto/v1789862534/fondo_kghe1w.mp4";

const FONDO2_VIDEO_URL =
  "https://res.cloudinary.com/dxj4iczvk/video/upload/q_auto/v1789862495/fondo2_acpcpm.mp4";



function Home() {

  const navigate = useNavigate();

  const {
    modoOscuro = false,
  } = useOutletContext() || {};

  const [
    user,
    setUser,
  ] = useState(null);

  const [
    authReady,
    setAuthReady,
  ] = useState(false);

  const [
    proyectos,
    setProyectos,
  ] = useState([]);

  const [
    productos,
    setProductos,
  ] = useState([]);

  const [
    grupoActivo,
    setGrupoActivo,
  ] = useState(0);


  /* ======================================================
     HERO VIDEO — SCROLL SCRUB + REPRODUCCIÓN NATURAL
  ====================================================== */

  const heroWrapRef = useRef(null);
  const heroVideoRef = useRef(null);
  const macroStoreRef = useRef(null);
  const heroScrollTimerRef = useRef(null);
  const heroWheelLockRef = useRef(false);

  const [
    heroVisible,
    setHeroVisible,
  ] = useState(false);

  const [
    heroProgress,
    setHeroProgress,
  ] = useState(0);

  const [
    heroScrubbing,
    setHeroScrubbing,
  ] = useState(false);

  const [
    proyectoVolteado,
    setProyectoVolteado,
  ] = useState(null);


  useEffect(() => {

    const timer =
      window.setTimeout(
        () => setHeroVisible(true),
        120
      );

    return () =>
      window.clearTimeout(timer);

  }, []);


  useEffect(() => {

    const hero = heroWrapRef.current;
    const video = heroVideoRef.current;

    if (!hero || !video) {
      return;
    }

    const actualizarProgreso = () => {
      if (!Number.isFinite(video.duration) || video.duration <= 0) {
        return;
      }

      setHeroProgress(
        Math.min(1, Math.max(0, video.currentTime / video.duration))
      );
    };

    const reanudarVideo = () => {
      if (heroScrollTimerRef.current) {
        clearTimeout(heroScrollTimerRef.current);
      }

      heroScrollTimerRef.current = window.setTimeout(() => {
        setHeroScrubbing(false);
        video.play().catch(() => {});
      }, 420);
    };

    const onWheel = (event) => {
      const rect = hero.getBoundingClientRect();
      const heroActivo =
        rect.top <= 2 &&
        rect.bottom >= window.innerHeight * 0.65;

      if (!heroActivo || !Number.isFinite(video.duration) || video.duration <= 0) {
        return;
      }

      const delta =
        Math.abs(event.deltaX) > Math.abs(event.deltaY)
          ? event.deltaX
          : event.deltaY;

      if (Math.abs(delta) < 1) {
        return;
      }

      const haciaAdelante = delta > 0;
      const enFinal = video.currentTime >= video.duration - 0.18;
      const enInicio = video.currentTime <= 0.18;

      // En el final soltamos el scroll para entrar a Macro Store.
      if (haciaAdelante && enFinal) {
        return;
      }

      // Si estamos al inicio y el usuario sube, dejamos que el navegador continúe.
      if (!haciaAdelante && enInicio) {
        return;
      }

      event.preventDefault();

      if (heroWheelLockRef.current) {
        return;
      }

      heroWheelLockRef.current = true;
      window.requestAnimationFrame(() => {
        heroWheelLockRef.current = false;
      });

      video.pause();
      setHeroScrubbing(true);

      const sensibilidad = Math.max(0.012, video.duration / 1350);
      const siguiente = Math.min(
        video.duration,
        Math.max(0, video.currentTime + delta * sensibilidad)
      );

      video.currentTime = siguiente;
      setHeroProgress(siguiente / video.duration);
      reanudarVideo();
    };

    video.addEventListener("timeupdate", actualizarProgreso);
    video.addEventListener("loadedmetadata", actualizarProgreso);
    window.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      video.removeEventListener("timeupdate", actualizarProgreso);
      video.removeEventListener("loadedmetadata", actualizarProgreso);
      window.removeEventListener("wheel", onWheel);

      if (heroScrollTimerRef.current) {
        clearTimeout(heroScrollTimerRef.current);
      }
    };

  }, []);


  /* ======================================================
     NAVBAR — DEBAJO DEL HERO + STICKY AL LLEGAR ARRIBA
     El navbar deja de ocupar la parte superior del Hero.
     Se coloca visualmente justo después del Hero y, al
     alcanzar la parte superior de la ventana, queda fijo.
  ====================================================== */

  useEffect(() => {

    const hero = heroWrapRef.current;

    if (!hero) {
      return;
    }

    const encontrarNavbar = () => {
      const directo =
        document.querySelector("[data-macro-navbar]") ||
        document.querySelector(".macro-navbar") ||
        document.querySelector("header nav") ||
        document.querySelector("body > #root nav") ||
        document.querySelector("header");

      if (directo) {
        return directo.closest("header") || directo;
      }

      // Fallback para no obligarte a tocar Navbar.jsx:
      // encuentra el bloque que contiene las opciones principales de Macro.
      const candidatos = Array.from(
        document.querySelectorAll("nav, header, div")
      ).filter((elemento) => {
        const texto = (elemento.textContent || "")
          .replace(/\s+/g, " ")
          .trim();

        return (
          texto.includes("Inicio") &&
          texto.includes("Servicios") &&
          texto.includes("Proyectos") &&
          texto.includes("Tienda") &&
          texto.includes("Contacto")
        );
      });

      if (candidatos.length === 0) {
        return null;
      }

      // Elegimos el contenedor más pequeño que todavía contiene todo el navbar.
      candidatos.sort((a, b) =>
        (a.textContent || "").length - (b.textContent || "").length
      );

      const candidato = candidatos[0];
      return candidato.closest("header") || candidato;
    };

    const navbar = encontrarNavbar();

    if (!navbar) {
      return;
    }

    navbar.classList.add("macro-navbar-after-hero");

    const actualizarPosicionNavbar = () => {
      const alturaNavbar = navbar.getBoundingClientRect().height || 88;
      document.documentElement.style.setProperty(
        "--macro-navbar-height",
        `${alturaNavbar}px`
      );

      // El navbar vive exactamente al terminar el Hero.
      const heroRect = hero.getBoundingClientRect();
      const heroFinDocumento = window.scrollY + heroRect.bottom;

      navbar.style.setProperty(
        "--macro-navbar-document-top",
        `${heroFinDocumento}px`
      );

      const debeFijarse = heroRect.bottom <= 0;
      navbar.classList.toggle(
        "macro-navbar-after-hero-sticky",
        debeFijarse
      );
    };

    actualizarPosicionNavbar();

    window.addEventListener("scroll", actualizarPosicionNavbar, {
      passive: true,
    });
    window.addEventListener("resize", actualizarPosicionNavbar);

    return () => {
      window.removeEventListener("scroll", actualizarPosicionNavbar);
      window.removeEventListener("resize", actualizarPosicionNavbar);

      navbar.classList.remove(
        "macro-navbar-after-hero",
        "macro-navbar-after-hero-sticky"
      );
      navbar.style.removeProperty("--macro-navbar-document-top");
      document.documentElement.style.removeProperty(
        "--macro-navbar-height"
      );
    };

  }, []);



  /* ======================================================
     AUTH
  ====================================================== */

  useEffect(() => {

    const unsubscribe =
      onAuthStateChanged(
        auth,
        (currentUser) => {

          setUser(currentUser);
          setAuthReady(true);

        }
      );

    return () => unsubscribe();

  }, []);


  /* ======================================================
     PROYECTOS
  ====================================================== */

  useEffect(() => {

    const unsubscribe =
      onSnapshot(
        collection(
          db,
          "proyectos"
        ),

        (snapshot) => {

          const lista =
            snapshot.docs.map(
              (documento) => ({
                id: documento.id,
                ...documento.data(),
              })
            );


          lista.sort(
            (a, b) => {

              if (
                Boolean(a.destacado) !==
                Boolean(b.destacado)
              ) {
                return b.destacado
                  ? 1
                  : -1;
              }


              const fechaA =
                a.fechaActualizacion?.toMillis?.() ||
                a.fechaCreacion?.toMillis?.() ||
                a.fecha?.toMillis?.() ||
                0;


              const fechaB =
                b.fechaActualizacion?.toMillis?.() ||
                b.fechaCreacion?.toMillis?.() ||
                b.fecha?.toMillis?.() ||
                0;


              return fechaB - fechaA;

            }
          );


          setProyectos(lista);

        },

        (error) => {

          console.error(
            "Error cargando proyectos:",
            error
          );

        }
      );


    return () => unsubscribe();

  }, []);


  /* ======================================================
     PRODUCTOS TIENDA
  ====================================================== */

  useEffect(() => {

    const unsubscribe =
      onSnapshot(
        collection(
          db,
          "productos"
        ),

        (snapshot) => {

          const lista =
            snapshot.docs.map(
              (documento) => ({
                id: documento.id,
                ...documento.data(),
              })
            );


          lista.sort(
            (a, b) => {

              /* PRIMERO DESTACADOS */

              if (
                Boolean(a.destacado) !==
                Boolean(b.destacado)
              ) {

                return b.destacado
                  ? 1
                  : -1;

              }


              /* LUEGO MÁS VENDIDOS */

              const ventasA =
                Number(a.ventas) ||
                Number(a.pedidos) ||
                Number(a.vendidos) ||
                0;


              const ventasB =
                Number(b.ventas) ||
                Number(b.pedidos) ||
                Number(b.vendidos) ||
                0;


              if (ventasB !== ventasA) {

                return ventasB - ventasA;

              }


              /* LUEGO MÁS RECIENTES */

              const fechaA =
                a.fechaActualizacion?.toMillis?.() ||
                a.fechaCreacion?.toMillis?.() ||
                a.fecha?.toMillis?.() ||
                0;


              const fechaB =
                b.fechaActualizacion?.toMillis?.() ||
                b.fechaCreacion?.toMillis?.() ||
                b.fecha?.toMillis?.() ||
                0;


              return fechaB - fechaA;

            }
          );


          setProductos(lista);

        },

        (error) => {

          console.error(
            "Error cargando productos:",
            error
          );

        }
      );


    return () => unsubscribe();

  }, []);


  /* ======================================================
     LOS 4 PRODUCTOS PRINCIPALES
  ====================================================== */

  const productosDestacados =
    useMemo(() => {

      return productos.slice(0, 4);

    }, [productos]);


  /* ======================================================
     AGRUPAR PROYECTOS DE 4 EN 4
  ====================================================== */

  const gruposProyectos =
    useMemo(() => {

      const grupos = [];


      for (
        let i = 0;
        i < proyectos.length;
        i += 4
      ) {

        grupos.push(
          proyectos.slice(
            i,
            i + 4
          )
        );

      }


      return grupos;

    }, [proyectos]);


  const proyectosHome =
    gruposProyectos[
      grupoActivo
    ] || [];


  /* ======================================================
     ROTACIÓN AUTOMÁTICA PROYECTOS
  ====================================================== */

  useEffect(() => {

    if (
      gruposProyectos.length <= 1
    ) {

      return;

    }


    const intervalo =
      setInterval(
        () => {

          setGrupoActivo(
            (actual) =>
              (
                actual + 1
              ) %
              gruposProyectos.length
          );

        },
        5000
      );


    return () =>
      clearInterval(intervalo);

  }, [
    gruposProyectos.length,
  ]);


  /* ======================================================
     ÍNDICE SEGURO
  ====================================================== */

  useEffect(() => {

    if (
      gruposProyectos.length === 0
    ) {

      if (
        grupoActivo !== 0
      ) {

        setGrupoActivo(0);

      }

      return;

    }


    if (
      grupoActivo >=
      gruposProyectos.length
    ) {

      setGrupoActivo(0);

    }

  }, [
    grupoActivo,
    gruposProyectos.length,
  ]);


  /* ======================================================
     SERVICIOS
  ====================================================== */

  const servicios = [

    {
      icon: <FaGlobe />,
      titulo: "Desarrollo web",
      subtitulo: "Web & plataformas",
      descripcion:
        "Sitios corporativos, tiendas, sistemas web y soluciones digitales adaptadas a cada negocio.",
      tipo: "web",
    },

    {
      icon: <FaMobileAlt />,
      titulo: "Apps móviles",
      subtitulo: "iOS & Android",
      descripcion:
        "Aplicaciones modernas para conectar servicios, clientes y procesos.",
      tipo: "app",
    },

    {
      icon: <FaCamera />,
      titulo: "Seguridad",
      subtitulo: "Cámaras & tecnología",
      descripcion:
        "Videovigilancia, cámaras y soluciones de seguridad tecnológica.",
      tipo: "camaras",
    },

    {
      icon: <FaBullhorn />,
      titulo: "Marketing",
      subtitulo: "Publicidad digital",
      descripcion:
        "Campañas, identidad digital y contenido para hacer crecer marcas.",
      tipo: "publicidad",
    },

  ];


  /* ======================================================
     SOLICITAR SERVICIO
  ====================================================== */

  const solicitarServicio =
    (servicio = null) => {

      if (!authReady) {
        return;
      }


      if (!user) {

        navigate(
          "/login",
          {
            state: {
              mensaje:
                "Inicia sesión para solicitar un servicio.",

              servicioPendiente:
                servicio,
            },
          }
        );

        return;

      }


      navigate(
        "/crear-cotizacion",
        {
          state: {
            servicio,
          },
        }
      );

    };


  /* ======================================================
     URL DEL PROYECTO
  ====================================================== */

  const obtenerUrlProyecto =
    (proyecto) => {

      const url =
        proyecto?.url ||
        proyecto?.urlProyecto ||
        proyecto?.enlace ||
        proyecto?.sitioWeb ||
        proyecto?.link ||
        "";


      return String(url).trim();

    };


  const normalizarUrl =
    (url) => {

      if (!url) {
        return "";
      }


      const limpia =
        String(url).trim();


      if (
        /^https?:\/\//i.test(
          limpia
        )
      ) {

        return limpia;

      }


      return `https://${limpia}`;

    };


  const visitarProyecto =
    (proyecto) => {

      const url =
        obtenerUrlProyecto(
          proyecto
        );


      if (!url) {
        return;
      }


      window.open(
        normalizarUrl(url),
        "_blank",
        "noopener,noreferrer"
      );

    };


  /* ======================================================
     OBTENER IMAGEN PRODUCTO
  ====================================================== */

  const obtenerImagenProducto =
    (producto) => {

      if (!producto) {
        return "";
      }


      if (producto.imagen) {

        return producto.imagen;

      }


      if (producto.imagenPrincipal) {

        return producto.imagenPrincipal;

      }


      if (producto.foto) {

        return producto.foto;

      }


      if (producto.image) {

        return producto.image;

      }


      if (
        Array.isArray(
          producto.imagenes
        ) &&
        producto.imagenes.length > 0
      ) {

        return producto.imagenes[0];

      }


      return "";

    };


  /* ======================================================
     PRECIO PRODUCTO
  ====================================================== */

  const obtenerPrecioProducto =
    (producto) => {

      return (
        producto?.precioOferta ??
        producto?.precio ??
        producto?.price ??
        0
      );

    };


  /* ======================================================
     FORMATEAR PRECIO
  ====================================================== */

  const formatearPrecio =
    (precio) => {

      const numero =
        Number(precio || 0);


      return numero.toLocaleString(
        "es-MX",
        {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        }
      );

    };


  /* ======================================================
     RENDER
  ====================================================== */

  return (

    <div
      className={`
        min-h-screen

        ${
          modoOscuro
            ? "bg-[#050b18] text-white"
            : "bg-[#f6f9fc] text-slate-950"
        }
      `}
    >

      <style>{`
        @keyframes macroFloat {
          0%, 100% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(0, -14px, 0); }
        }

        @keyframes macroFloatSlow {
          0%, 100% { transform: translate3d(0, 0, 0) rotate(0deg); }
          50% { transform: translate3d(0, -10px, 0) rotate(2deg); }
        }

        @keyframes macroOrbit {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes macroOrbitReverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }

        @keyframes macroPulse {
          0%, 100% { opacity: .35; transform: scale(.94); }
          50% { opacity: .9; transform: scale(1.05); }
        }

        @keyframes macroScan {
          0% { transform: translateY(-120%); opacity: 0; }
          18% { opacity: .75; }
          82% { opacity: .3; }
          100% { transform: translateY(650%); opacity: 0; }
        }

        @keyframes macroGradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        @keyframes macroShimmer {
          0% { transform: translateX(-140%) skewX(-18deg); }
          55%, 100% { transform: translateX(240%) skewX(-18deg); }
        }

        @keyframes macroLine {
          0%, 100% { opacity: .2; transform: scaleX(.35); }
          50% { opacity: 1; transform: scaleX(1); }
        }

        .macro-grid-bg {
          background-image:
            linear-gradient(rgba(56,189,248,.055) 1px, transparent 1px),
            linear-gradient(90deg, rgba(56,189,248,.055) 1px, transparent 1px);
          background-size: 46px 46px;
          mask-image: linear-gradient(to bottom, rgba(0,0,0,.9), transparent 90%);
        }

        .macro-animated-gradient {
          background-size: 220% 220%;
          animation: macroGradient 8s ease infinite;
        }

        .macro-float { animation: macroFloat 5s ease-in-out infinite; }
        .macro-float-slow { animation: macroFloatSlow 7s ease-in-out infinite; }
        .macro-orbit { animation: macroOrbit 18s linear infinite; }
        .macro-orbit-reverse { animation: macroOrbitReverse 14s linear infinite; }
        .macro-pulse { animation: macroPulse 3.2s ease-in-out infinite; }
        .macro-scan { animation: macroScan 5.5s linear infinite; }
        .macro-line { animation: macroLine 3s ease-in-out infinite; transform-origin: left; }

        .macro-shimmer::after {
          content: "";
          position: absolute;
          inset: -25%;
          width: 30%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,.28), transparent);
          animation: macroShimmer 4.8s ease-in-out infinite;
          pointer-events: none;
        }

        .macro-service-card {
          transform-style: preserve-3d;
        }

        .macro-service-card:hover .macro-service-icon {
          transform: translateY(-4px) rotate(-5deg) scale(1.08);
        }


        @keyframes macroGlobeSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes macroBeam {
          0%, 100% { opacity: .25; transform: scaleY(.78); }
          50% { opacity: .9; transform: scaleY(1.08); }
        }

        @keyframes macroCardDrift {
          0%, 100% { transform: translate3d(0,0,0) rotate(0deg); }
          50% { transform: translate3d(0,-10px,0) rotate(.8deg); }
        }

        @keyframes macroGlowRing {
          0%,100% { box-shadow: 0 0 35px rgba(56,189,248,.14); }
          50% { box-shadow: 0 0 75px rgba(56,189,248,.34); }
        }


        @keyframes macroCorePulse {
          0%, 100% {
            transform: translate(-50%, -50%) scale(.86);
            opacity: .55;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.08);
            opacity: 1;
          }
        }

        @keyframes macroEnergySweep {
          0% {
            transform: translateX(-130%) skewX(-18deg);
            opacity: 0;
          }
          18% { opacity: .8; }
          55% { opacity: .25; }
          100% {
            transform: translateX(280%) skewX(-18deg);
            opacity: 0;
          }
        }

        @keyframes macroLivePulse {
          0%,100% {
            box-shadow: 0 0 0 0 rgba(52,211,153,.35);
          }
          50% {
            box-shadow: 0 0 0 10px rgba(52,211,153,0);
          }
        }

        @keyframes macroFeedGlow {
          0%,100% {
            opacity: .42;
            transform: translate3d(0,0,0) scale(1);
          }
          50% {
            opacity: .72;
            transform: translate3d(18px,-14px,0) scale(1.08);
          }
        }

        @keyframes macroRadar {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .macro-core-pulse {
          animation: macroCorePulse 2.8s ease-in-out infinite;
        }

        .macro-energy-sweep {
          animation: macroEnergySweep 4.8s ease-in-out infinite;
        }

        .macro-live-pulse {
          animation: macroLivePulse 2s ease-in-out infinite;
        }

        .macro-feed-glow {
          animation: macroFeedGlow 7s ease-in-out infinite;
        }

        .macro-radar {
          animation: macroRadar 18s linear infinite;
          transform-origin: center;
        }

        .macro-feed-shell {
          position: relative;
          isolation: isolate;
        }

        .macro-feed-shell::before {
          content: "";
          position: absolute;
          inset: -1px;
          border-radius: 30px;
          padding: 1px;
          background:
            linear-gradient(
              135deg,
              rgba(34,211,238,.42),
              rgba(59,130,246,.08) 36%,
              rgba(168,85,247,.30) 72%,
              rgba(34,211,238,.15)
            );
          -webkit-mask:
            linear-gradient(#fff 0 0) content-box,
            linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
          z-index: 2;
        }

        .macro-feed-shell > * {
          position: relative;
          z-index: 3;
        }

        .macro-globe-spin { animation: macroGlobeSpin 32s linear infinite; }
        .macro-beam { animation: macroBeam 3.8s ease-in-out infinite; transform-origin: bottom; }
        .macro-card-drift { animation: macroCardDrift 6s ease-in-out infinite; }
        .macro-glow-ring { animation: macroGlowRing 4.5s ease-in-out infinite; }


        @keyframes macroHeroBreath {
          0%, 100% { transform: scale(1) translate3d(0, 0, 0); filter: saturate(1) brightness(1); }
          50% { transform: scale(1.018) translate3d(0, -3px, 0); filter: saturate(1.06) brightness(1.025); }
        }
        @keyframes macroHeroScanX {
          0% { transform: translateX(-140%) skewX(-14deg); opacity: 0; }
          15% { opacity: .45; }
          55% { opacity: .16; }
          100% { transform: translateX(340%) skewX(-14deg); opacity: 0; }
        }
        @keyframes macroHeroRing { from { transform: translate(-50%, -50%) rotate(0deg); } to { transform: translate(-50%, -50%) rotate(360deg); } }
        @keyframes macroHeroRingReverse { from { transform: translate(-50%, -50%) rotate(360deg); } to { transform: translate(-50%, -50%) rotate(0deg); } }
        @keyframes macroHeroCore {
          0%, 100% { transform: translate(-50%, -50%) scale(.92); opacity: .42; }
          50% { transform: translate(-50%, -50%) scale(1.08); opacity: .88; }
        }
        @keyframes macroHeroParticle {
          0%, 100% { transform: translate3d(0,0,0); opacity: .35; }
          50% { transform: translate3d(0,-14px,0); opacity: 1; }
        }
        @keyframes macroHeroBeam {
          0%,100% { opacity: .22; transform: translateX(-50%) scaleY(.84); }
          50% { opacity: .75; transform: translateX(-50%) scaleY(1.08); }
        }
        @keyframes macroHotspotGlow {
          0%,100% { box-shadow: 0 0 0 rgba(56,189,248,0); }
          50% { box-shadow: 0 0 30px rgba(56,189,248,.16); }
        }
        .macro-hero-breathe { animation: macroHeroBreath 10s ease-in-out infinite; transform-origin: 50% 45%; will-change: transform, filter; }
        .macro-hero-scan { animation: macroHeroScanX 7.5s ease-in-out infinite; }
        .macro-hero-ring { animation: macroHeroRing 18s linear infinite; transform-origin: center; }
        .macro-hero-ring-reverse { animation: macroHeroRingReverse 13s linear infinite; transform-origin: center; }
        .macro-hero-core { animation: macroHeroCore 3.3s ease-in-out infinite; }
        .macro-hero-particle { animation: macroHeroParticle 4.8s ease-in-out infinite; }
        .macro-hero-beam { animation: macroHeroBeam 3.8s ease-in-out infinite; transform-origin: bottom; }
        .macro-hotspot { animation: macroHotspotGlow 3.2s ease-in-out infinite; transition: background-color .25s ease, box-shadow .25s ease, transform .25s ease; }
        .macro-hotspot:hover { background: rgba(56,189,248,.045); box-shadow: 0 0 34px rgba(56,189,248,.22); transform: translateY(-2px); }


        @keyframes macroDataTravel {
          0% {
            stroke-dashoffset: 420;
            opacity: 0;
          }
          15% { opacity: .9; }
          85% { opacity: .9; }
          100% {
            stroke-dashoffset: 0;
            opacity: 0;
          }
        }

        @keyframes macroHoloRing {
          from { transform: translate(-50%,-50%) rotateX(68deg) rotateZ(0deg); }
          to { transform: translate(-50%,-50%) rotateX(68deg) rotateZ(360deg); }
        }

        @keyframes macroHoloRingReverse {
          from { transform: translate(-50%,-50%) rotateX(72deg) rotateZ(360deg); }
          to { transform: translate(-50%,-50%) rotateX(72deg) rotateZ(0deg); }
        }

        @keyframes macroTextReveal {
          from {
            opacity: 0;
            transform: translateY(24px);
            filter: blur(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }
        }

        @keyframes macroGlowSweep {
          0% {
            transform: translateX(-150%) rotate(18deg);
            opacity: 0;
          }
          20% { opacity: .6; }
          100% {
            transform: translateX(260%) rotate(18deg);
            opacity: 0;
          }
        }

        @keyframes macroPingSoft {
          0% {
            transform: scale(.85);
            opacity: .7;
          }
          80%,100% {
            transform: scale(1.55);
            opacity: 0;
          }
        }

        @keyframes macroCounterPulse {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }

        .macro-data-path {
          stroke-dasharray: 12 14;
          animation: macroDataTravel 5.8s linear infinite;
        }

        .macro-holo-ring {
          animation: macroHoloRing 9s linear infinite;
          transform-origin: center;
        }

        .macro-holo-ring-reverse {
          animation: macroHoloRingReverse 7s linear infinite;
          transform-origin: center;
        }

        .macro-reveal {
          opacity: 0;
        }

        .macro-reveal.is-visible {
          animation: macroTextReveal .9s cubic-bezier(.2,.8,.2,1) forwards;
        }

        .macro-reveal-delay-1.is-visible { animation-delay: .12s; }
        .macro-reveal-delay-2.is-visible { animation-delay: .24s; }
        .macro-reveal-delay-3.is-visible { animation-delay: .36s; }
        .macro-reveal-delay-4.is-visible { animation-delay: .48s; }

        .macro-panel-glow::after {
          content: "";
          position: absolute;
          top: -30%;
          bottom: -30%;
          width: 18%;
          background: linear-gradient(90deg,transparent,rgba(255,255,255,.16),transparent);
          animation: macroGlowSweep 6.8s ease-in-out infinite;
          pointer-events: none;
        }

        .macro-status-ring::before,
        .macro-status-ring::after {
          content: "";
          position: absolute;
          inset: -4px;
          border-radius: 9999px;
          border: 1px solid rgba(52,211,153,.4);
          animation: macroPingSoft 2.2s ease-out infinite;
        }

        .macro-status-ring::after {
          animation-delay: 1.1s;
        }

        .macro-counter-pulse {
          animation: macroCounterPulse 3.4s ease-in-out infinite;
        }

        .macro-service-card:hover {
          transform: translateY(-8px) perspective(900px) rotateX(2deg) rotateY(-2deg);
        }


        @keyframes macroTunnelSpin {
          from { transform: translate(-50%, -50%) rotate(0deg) scale(1); }
          to { transform: translate(-50%, -50%) rotate(360deg) scale(1); }
        }

        @keyframes macroTunnelSpinReverse {
          from { transform: translate(-50%, -50%) rotate(360deg) scale(1); }
          to { transform: translate(-50%, -50%) rotate(0deg) scale(1); }
        }

        @keyframes macroTunnelPulse {
          0%, 100% {
            transform: translate(-50%, -50%) scale(.88);
            opacity: .45;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.08);
            opacity: .9;
          }
        }

        @keyframes macroTunnelZoom {
          0%,100% {
            transform: translate(-50%, -50%) scale(.96);
            opacity: .68;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.04);
            opacity: .9;
          }
        }

        @keyframes macroTunnelScan {
          0% {
            transform: translateX(-140%) skewX(-16deg);
            opacity: 0;
          }
          20% { opacity: .45; }
          100% {
            transform: translateX(280%) skewX(-16deg);
            opacity: 0;
          }
        }

        @keyframes macroTunnelDots {
          0%,100% {
            transform: translateY(0);
            opacity: .35;
          }
          50% {
            transform: translateY(-12px);
            opacity: 1;
          }
        }

        .macro-tunnel-ring {
          animation: macroTunnelSpin 18s linear infinite;
          transform-origin: center;
        }

        .macro-tunnel-ring-reverse {
          animation: macroTunnelSpinReverse 13s linear infinite;
          transform-origin: center;
        }

        .macro-tunnel-core {
          animation: macroTunnelPulse 3s ease-in-out infinite;
        }

        .macro-tunnel-zoom {
          animation: macroTunnelZoom 4.6s ease-in-out infinite;
        }

        .macro-tunnel-scan {
          animation: macroTunnelScan 5.8s ease-in-out infinite;
        }

        .macro-tunnel-dot {
          animation: macroTunnelDots 4.2s ease-in-out infinite;
        }

        @keyframes macroHeroReveal {
          from { opacity: 0; transform: translateY(34px) scale(.985); filter: blur(12px); }
          to { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }

        @keyframes macroScrollCue {
          0%,100% { transform: translateY(0); opacity: .55; }
          50% { transform: translateY(7px); opacity: 1; }
        }

        .macro-hero-enter {
          opacity: 0;
        }

        .macro-hero-enter.is-visible {
          animation: macroHeroReveal 1s cubic-bezier(.2,.8,.2,1) forwards;
        }

        .macro-scroll-cue {
          animation: macroScrollCue 1.8s ease-in-out infinite;
        }

        .macro-project-perspective {
          perspective: 1800px;
        }

        .macro-project-flip {
          position: relative;
          min-height: 540px;
          transform-style: preserve-3d;
          transition: transform .9s cubic-bezier(.2,.75,.2,1);
          will-change: transform;
        }

        .macro-project-flip.is-flipped {
          transform: rotateY(180deg);
        }

        .macro-project-face {
          position: absolute;
          inset: 0;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          overflow: hidden;
          border-radius: 34px;
        }

        .macro-project-back {
          transform: rotateY(180deg);
        }

        .macro-project-face img {
          transition: transform 1.2s cubic-bezier(.2,.8,.2,1), filter .7s ease;
        }

        .macro-project-perspective:hover .macro-project-front img {
          transform: scale(1.035);
          filter: saturate(1.08);
        }

        .macro-navbar-after-hero {
          position: absolute !important;
          top: var(--macro-navbar-document-top, 100vh) !important;
          left: 0 !important;
          right: 0 !important;
          width: 100% !important;
          z-index: 9999 !important;
          margin: 0 !important;
          transform: translateY(0) !important;
          opacity: 1 !important;
          pointer-events: auto !important;
          box-shadow: 0 12px 34px rgba(15,23,42,.09);
          transition: box-shadow .35s ease, backdrop-filter .35s ease;
        }

        .macro-navbar-after-hero.macro-navbar-after-hero-sticky {
          position: fixed !important;
          top: 0 !important;
          box-shadow: 0 18px 45px rgba(15,23,42,.14);
        }

        .macro-navbar-spacer {
          height: var(--macro-navbar-height, 88px);
        }

        @media (prefers-reduced-motion: reduce) {
          .macro-float,
          .macro-float-slow,
          .macro-orbit,
          .macro-orbit-reverse,
          .macro-pulse,
          .macro-scan,
          .macro-line,
          .macro-animated-gradient,
          .macro-shimmer::after,
          .macro-globe-spin,
          .macro-beam,
          .macro-card-drift,
          .macro-glow-ring,
          .macro-core-pulse,
          .macro-energy-sweep,
          .macro-live-pulse,
          .macro-feed-glow,
          .macro-radar,
          .macro-hero-breathe,
          .macro-hero-scan,
          .macro-hero-ring,
          .macro-hero-ring-reverse,
          .macro-hero-core,
          .macro-hero-particle,
          .macro-hero-beam,
          .macro-hotspot,
          .macro-data-path,
          .macro-holo-ring,
          .macro-holo-ring-reverse,
          .macro-reveal,
          .macro-panel-glow::after,
          .macro-status-ring::before,
          .macro-status-ring::after,
          .macro-counter-pulse,
          .macro-tunnel-ring,
          .macro-tunnel-ring-reverse,
          .macro-tunnel-core,
          .macro-tunnel-zoom,
          .macro-tunnel-scan,
          .macro-tunnel-dot {
            animation: none !important;
          }
        }
      `}</style>

      {/* ================================================= */}
      {/* HERO VIDEO — MACRO */}
      {/* Archivo: public/videos/hero.mp4 */}
      {/* Scroll abajo = avanza / scroll arriba = retrocede */}
      {/* Sin scroll = reproducción normal */}
      {/* ================================================= */}

      <section
        id="inicio"
        ref={heroWrapRef}
        className="
          relative
          isolate
          overflow-hidden
          bg-[#020817]
          text-white
          min-h-screen
          h-screen
        "
      >

        <video
          ref={heroVideoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="
            absolute
            inset-0
            z-0
            w-full
            h-full
            object-cover
            object-center
            brightness-[1.08]
            saturate-[1.10]
            contrast-[1.03]
            scale-[1.015]
            pointer-events-none
            select-none
          "
        >
          <source
            src={HERO_VIDEO_URL}
            type="video/mp4"
          />
          Tu navegador no puede reproducir este video.
        </video>

        {/* CAPAS MUY LIGERAS: EL VIDEO DEBE SER PROTAGONISTA */}
        <div className="absolute inset-0 z-[1] bg-[#020617]/10 pointer-events-none" />
        <div className="absolute inset-0 z-[1] bg-[linear-gradient(90deg,rgba(2,6,23,.70)_0%,rgba(2,6,23,.40)_31%,rgba(2,6,23,.10)_58%,rgba(2,6,23,.06)_100%)] pointer-events-none" />
        <div className="absolute inset-0 z-[1] bg-[linear-gradient(180deg,rgba(2,6,23,.08)_0%,transparent_45%,rgba(2,6,23,.36)_100%)] pointer-events-none" />

        <div className="absolute inset-x-0 top-0 z-[2] h-px bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent pointer-events-none" />

        <span className="absolute z-[2] left-[8%] top-[20%] w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_15px_rgba(103,232,249,.85)] macro-float pointer-events-none" />
        <span className="absolute z-[2] left-[53%] top-[16%] w-1 h-1 rounded-full bg-sky-300 shadow-[0_0_12px_rgba(125,211,252,.80)] macro-float-slow pointer-events-none" />
        <span className="absolute z-[2] right-[7%] top-[25%] w-2 h-2 rounded-full bg-emerald-300 shadow-[0_0_16px_rgba(110,231,183,.75)] macro-pulse pointer-events-none" />

        <div className="relative z-10 max-w-[1560px] mx-auto px-5 md:px-8 h-full min-h-screen flex items-center">

          <div
            className={`
              macro-hero-enter
              ${heroVisible ? "is-visible" : ""}
              w-full
              max-w-[780px]
              py-16
              lg:py-20
            `}
          >

            <div className="inline-flex items-center gap-3 rounded-full border border-cyan-300/25 bg-[#031426]/38 backdrop-blur-xl px-4 py-2.5 text-[10px] sm:text-[11px] font-black uppercase tracking-[.22em] text-cyan-200 shadow-[0_12px_40px_rgba(0,0,0,.18)]">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-300 shadow-[0_0_16px_rgba(103,232,249,.95)] macro-pulse" />
              Tecnología que resuelve
            </div>

            <h1 className="mt-7 text-[48px] sm:text-[58px] lg:text-[72px] xl:text-[84px] font-black tracking-[-0.06em] leading-[.92] drop-shadow-[0_8px_24px_rgba(0,0,0,.42)]">
              Diseñamos el
              <span className="block mt-1 bg-gradient-to-r from-cyan-300 via-sky-400 to-blue-500 bg-clip-text text-transparent macro-animated-gradient">
                siguiente paso
              </span>
              <span className="block mt-1">
                digital de tu negocio.
              </span>
            </h1>

            <p className="max-w-[650px] mt-7 text-[16px] md:text-[18px] leading-[1.75] text-slate-200 drop-shadow-[0_4px_18px_rgba(0,0,0,.50)]">
              Desarrollo web, aplicaciones móviles, seguridad, publicidad digital y
              productos tecnológicos en un ecosistema creado para transformar ideas en
              soluciones reales.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">

              <button
                type="button"
                onClick={() =>
                  document
                    .getElementById("servicios")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="macro-shimmer group relative overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600 px-7 py-4 font-black text-white flex items-center gap-3 shadow-[0_18px_55px_rgba(14,165,233,.34)] hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(14,165,233,.46)] transition-all duration-300"
              >
                Explorar soluciones
                <FaArrowRight className="transition-transform group-hover:translate-x-1" />
              </button>

              <button
                type="button"
                onClick={() =>
                  document
                    .getElementById("proyectos")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="group rounded-2xl border border-white/20 bg-[#061321]/35 backdrop-blur-xl px-7 py-4 font-bold flex items-center gap-3 hover:bg-white/[0.10] hover:border-cyan-300/35 hover:-translate-y-1 transition-all duration-300"
              >
                <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  <FaPlay size={10} />
                </span>
                Ver proyectos
              </button>

            </div>

            <div className="mt-10 flex flex-wrap gap-7">
              <HeroStat icon={<FaBolt />} numero="+50" texto="Proyectos realizados" />
              <HeroStat icon={<FaUsers />} numero="Clientes" texto="satisfechos" />
              <HeroStat icon={<FaChartBar />} numero="Resultados" texto="reales" />
            </div>

          </div>

        </div>

        <button
          type="button"
          onClick={() =>
            macroStoreRef.current?.scrollIntoView({ behavior: "smooth" })
          }
          className="hidden md:flex absolute right-8 bottom-7 z-30 items-center gap-2 text-[9px] uppercase tracking-[.22em] font-black text-white/65 hover:text-cyan-200 transition-colors"
        >
          Continuar
          <span className="macro-scroll-cue">↓</span>
        </button>

      </section>

      {/* Espacio real reservado para el navbar que ahora vive debajo del Hero */}
      <div
        className="macro-navbar-spacer bg-white"
        aria-hidden="true"
      />

      {/* ================================================= */}
      {/* FRANJA */}
      {/* ================================================= */}

      <section
        className={`
          border-b

          ${
            modoOscuro
              ? "bg-[#08101f] border-slate-800"
              : "bg-white border-slate-200"
          }
        `}
      >

        <div
          className="
            max-w-7xl
            mx-auto
            px-5
            md:px-8
            py-5
            flex
            flex-wrap
            items-center
            justify-between
            gap-4
          "
        >

          <p
            className="
              text-sm
              text-slate-500
              font-medium
            "
          >

            Desarrollo · Tecnología · Seguridad · Comercio digital

          </p>


          <button
            type="button"
            onClick={() =>
              solicitarServicio()
            }
            className="
              text-sky-500
              font-bold
              flex
              items-center
              gap-2
            "
          >

            Comenzar un proyecto

            <FaArrowRight />

          </button>

        </div>

      </section>


      {/* ================================================= */}
      {/* LO MÁS PEDIDO MACRO STORE */}
      {/* ================================================= */}

      <section
        ref={macroStoreRef}
        className={`
          border-b

          ${
            modoOscuro
              ? "bg-[#07111f] border-slate-800"
              : "bg-white border-slate-200"
          }
        `}
      >

        <div
          className="
            max-w-7xl
            mx-auto
            px-5
            md:px-8
            py-20
          "
        >

          {/* HEADER */}

          <div
            className="
              flex
              flex-col
              md:flex-row
              md:items-end
              md:justify-between
              gap-6
            "
          >

            <div>

              <div
                className="
                  inline-flex
                  items-center
                  gap-2
                  text-xs
                  text-sky-500
                  uppercase
                  tracking-[0.25em]
                  font-bold
                "
              >

                <FaShoppingBag />

                Macro Store

              </div>


              <h2
                className="
                  text-4xl
                  md:text-5xl
                  lg:text-6xl
                  font-black
                  tracking-[-0.045em]
                  leading-[1]
                  mt-5
                "
              >

                Lo más pedido

                <span className="text-sky-500">

                  {" "}en tecnología.

                </span>

              </h2>


              <p
                className="
                  max-w-2xl
                  text-slate-500
                  text-lg
                  mt-5
                  leading-relaxed
                "
              >

                Una selección de productos destacados,
                novedades y tecnología disponible
                dentro de Macro Store.

              </p>

            </div>


            <button
              type="button"
              onClick={() =>
                navigate("/tienda")
              }
              className="
                group
                flex
                items-center
                gap-3
                text-sky-500
                font-bold
                whitespace-nowrap
              "
            >

              Ver toda la tienda

              <FaArrowRight
                className="
                  transition-transform
                  group-hover:translate-x-1
                "
              />

            </button>

          </div>


          {/* ================================================= */}
          {/* PRODUCTOS */}
          {/* ================================================= */}

          {productosDestacados.length > 0 ? (

            <div
              className="
                grid
                grid-cols-2
                lg:grid-cols-4
                gap-4
                md:gap-5
                mt-11
              "
            >

              {productosDestacados.map(
                (
                  producto,
                  index
                ) => {

                  const imagen =
                    obtenerImagenProducto(
                      producto
                    );


                  const precio =
                    obtenerPrecioProducto(
                      producto
                    );


                  const precioAnterior =
                    producto.precioAnterior ??
                    producto.precioOriginal ??
                    null;


                  return (

                    <article
                      key={producto.id}
                      onClick={() =>
                        navigate(
                          "/tienda"
                        )
                      }
                      className={`
                        group
                        relative
                        overflow-hidden
                        rounded-[28px]
                        border
                        cursor-pointer
                        transition-all
                        duration-300
                        hover:-translate-y-1
                        hover:shadow-xl

                        ${
                          modoOscuro
                            ? `
                              bg-[#0b1424]
                              border-slate-800
                              hover:border-sky-500/40
                            `
                            : `
                              bg-white
                              border-slate-200
                              hover:border-sky-300
                            `
                        }
                      `}
                    >

                      {/* IMAGEN */}

                      <div
                        className={`
                          relative
                          aspect-square
                          overflow-hidden
                          flex
                          items-center
                          justify-center

                          ${
                            modoOscuro
                              ? "bg-[#071221]"
                              : "bg-[#f4f8fc]"
                          }
                        `}
                      >

                        {imagen ? (

                          <img
                            src={imagen}
                            alt={
                              producto.nombre ||
                              "Producto Macro"
                            }
                            loading="lazy"
                            className="
                              w-full
                              h-full
                              object-contain
                              p-4
                              md:p-6
                              transition-transform
                              duration-500
                              group-hover:scale-105
                            "
                          />

                        ) : (

                          <div
                            className="
                              flex
                              flex-col
                              items-center
                              justify-center
                              gap-3
                              text-sky-400
                            "
                          >

                            <FaShoppingBag
                              size={46}
                            />

                            <span
                              className="
                                text-xs
                                text-slate-400
                              "
                            >

                              Macro Store

                            </span>

                          </div>

                        )}


                        {/* BADGES */}

                        <div
                          className="
                            absolute
                            top-3
                            left-3
                            md:top-4
                            md:left-4
                            flex
                            flex-col
                            items-start
                            gap-2
                          "
                        >

                          {index === 0 && (

                            <span
                              className="
                                bg-slate-950
                                text-white
                                text-[9px]
                                md:text-[10px]
                                uppercase
                                tracking-[0.12em]
                                font-black
                                px-3
                                py-2
                                rounded-full
                                shadow-lg
                              "
                            >

                              🔥 Más pedido

                            </span>

                          )}


                          {producto.destacado &&
                            index !== 0 && (

                            <span
                              className="
                                bg-sky-500
                                text-white
                                text-[9px]
                                md:text-[10px]
                                uppercase
                                tracking-[0.12em]
                                font-black
                                px-3
                                py-2
                                rounded-full
                                shadow-lg
                              "
                            >

                              Destacado

                            </span>

                          )}

                        </div>

                      </div>


                      {/* DATOS PRODUCTO */}

                      <div
                        className="
                          p-4
                          md:p-5
                        "
                      >

                        <p
                          className="
                            text-[9px]
                            md:text-[10px]
                            uppercase
                            tracking-[0.2em]
                            text-sky-500
                            font-black
                          "
                        >

                          {
                            producto.categoria ||
                            producto.tipo ||
                            "Tecnología"
                          }

                        </p>


                        <h3
                          className="
                            mt-2
                            text-base
                            md:text-lg
                            font-black
                            leading-tight
                            line-clamp-2
                            min-h-[42px]
                          "
                        >

                          {
                            producto.nombre ||
                            producto.titulo ||
                            "Producto Macro"
                          }

                        </h3>


                        {producto.descripcion && (

                          <p
                            className="
                              hidden
                              md:block
                              text-sm
                              text-slate-500
                              mt-2
                              line-clamp-2
                              leading-relaxed
                            "
                          >

                            {
                              producto.descripcion
                            }

                          </p>

                        )}


                        <div
                          className="
                            mt-5
                            flex
                            items-end
                            justify-between
                            gap-2
                          "
                        >

                          <div>

                            {precioAnterior && (

                              <p
                                className="
                                  text-xs
                                  text-slate-400
                                  line-through
                                "
                              >

                                $
                                {
                                  formatearPrecio(
                                    precioAnterior
                                  )
                                }

                              </p>

                            )}


                            <p
                              className="
                                text-lg
                                md:text-2xl
                                font-black
                              "
                            >

                              $
                              {
                                formatearPrecio(
                                  precio
                                )
                              }

                            </p>

                          </div>


                          <div
                            className="
                              shrink-0
                              w-10
                              h-10
                              md:w-11
                              md:h-11
                              rounded-full
                              bg-sky-500
                              text-white
                              flex
                              items-center
                              justify-center
                              transition-all
                              duration-300
                              group-hover:bg-slate-950
                              group-hover:translate-x-1
                            "
                          >

                            <FaArrowRight />

                          </div>

                        </div>

                      </div>

                    </article>

                  );

                }
              )}

            </div>

          ) : (

            <div
              className={`
                mt-10
                rounded-[30px]
                border
                border-dashed
                p-10
                md:p-12
                text-center

                ${
                  modoOscuro
                    ? `
                      bg-[#0b1424]
                      border-slate-700
                    `
                    : `
                      bg-[#f8fafc]
                      border-slate-300
                    `
                }
              `}
            >

              <FaStore
                className="
                  mx-auto
                  text-5xl
                  text-sky-400
                "
              />


              <h3
                className="
                  text-xl
                  md:text-2xl
                  font-black
                  mt-5
                "
              >

                Muy pronto en Macro Store

              </h3>


              <p
                className="
                  text-slate-500
                  mt-2
                "
              >

                Estamos preparando nuestros
                productos destacados.

              </p>


              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/tienda"
                  )
                }
                className="
                  mt-5
                  inline-flex
                  items-center
                  gap-2
                  text-sky-500
                  font-bold
                "
              >

                Entrar a la tienda

                <FaArrowRight />

              </button>

            </div>

          )}

        </div>

      </section>


      {/* ================================================= */}
      {/* SERVICIOS — INTERFAZ DINÁMICA */}
      {/* ================================================= */}

      <section
        id="servicios"
        className="
          relative
          isolate
          overflow-hidden
          bg-[#050816]
          text-white
          py-24
          md:py-28
        "
      >

        {/* ================================================= */}
        {/* VIDEO LOCAL DE FONDO — SERVICIOS */}
        {/* Archivo: public/videos/fondo.mov */}
        {/* ================================================= */}

        <div
          className="
            absolute
            inset-0
            overflow-hidden
            pointer-events-none
            select-none
          "
        >
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            className="
              absolute
              inset-0
              w-full
              h-full
              object-cover
              object-center
              scale-[1.03]
              brightness-[1.12]
              saturate-[1.14]
              contrast-[1.04]
            "
          >
            <source
              src={FONDO_VIDEO_URL}
              type="video/mp4"
            />

            Tu navegador no puede reproducir este video.
          </video>
        </div>


        {/* ================================================= */}
        {/* CAPAS PARA QUE EL TEXTO Y TARJETAS SE VEAN BIEN */}
        {/* ================================================= */}

        <div
          className="
            absolute
            inset-0
            bg-[#020617]/22
            pointer-events-none
          "
        />

        <div
          className="
            absolute
            inset-0
            bg-[linear-gradient(90deg,rgba(2,6,23,.52)_0%,rgba(2,6,23,.36)_34%,rgba(2,6,23,.16)_68%,rgba(2,6,23,.28)_100%)]
            pointer-events-none
          "
        />

        <div
          className="
            absolute
            inset-0
            bg-[radial-gradient(circle_at_16%_24%,rgba(14,165,233,.10),transparent_28%),radial-gradient(circle_at_86%_30%,rgba(168,85,247,.08),transparent_30%)]
            pointer-events-none
          "
        />

        {/* Brillo sutil para integrar el video con Macro */}
        <div
          className="
            absolute
            inset-x-0
            top-0
            h-px
            bg-gradient-to-r
            from-transparent
            via-cyan-300/70
            to-transparent
            pointer-events-none
          "
        />

        <div className="relative z-10 max-w-[1440px] mx-auto px-5 md:px-8">

          {/* ENCABEZADO */}

          <div
            className="
              grid
              lg:grid-cols-[.72fr_1.28fr]
              gap-10
              lg:gap-14
              items-end
            "
          >

            <div>
              <div
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-full
                  border
                  border-cyan-300/20
                  bg-cyan-300/[0.06]
                  px-4
                  py-2
                  text-[10px]
                  sm:text-xs
                  uppercase
                  tracking-[.24em]
                  text-cyan-300
                  font-black
                "
              >
                <span className="w-2 h-2 rounded-full bg-cyan-300 shadow-[0_0_14px_rgba(103,232,249,.8)]" />
                Servicios Macro
              </div>

              <h2
                className="
                  mt-6
                  text-5xl
                  md:text-6xl
                  lg:text-7xl
                  font-black
                  tracking-[-0.055em]
                  leading-[.94]
                "
              >
                Un equipo.
                <span
                  className="
                    block
                    mt-2
                    bg-gradient-to-r
                    from-cyan-300
                    via-sky-400
                    to-fuchsia-400
                    bg-clip-text
                    text-transparent
                    macro-animated-gradient
                  "
                >
                  Muchas soluciones.
                </span>
              </h2>
            </div>

            <div className="lg:pb-2">
              <p className="max-w-2xl text-base md:text-lg text-slate-300 leading-relaxed">
                Macro une desarrollo web, aplicaciones, seguridad y publicidad
                en una experiencia tecnológica conectada. Cada servicio vive
                dentro del mismo ecosistema y puede crecer junto con tu negocio.
              </p>

              <button
                type="button"
                onClick={() => solicitarServicio()}
                className="
                  group
                  mt-7
                  inline-flex
                  items-center
                  gap-3
                  text-sm
                  font-black
                  text-cyan-300
                  hover:text-white
                  transition
                "
              >
                Cuéntanos tu idea
                <span className="w-10 h-10 rounded-full border border-cyan-300/25 bg-cyan-300/10 flex items-center justify-center transition-all group-hover:bg-cyan-400 group-hover:text-slate-950 group-hover:translate-x-1">
                  <FaArrowRight />
                </span>
              </button>
            </div>

          </div>

          {/* TARJETAS */}

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-5 mt-14">

            {servicios.map((servicio, indexServicio) => {

              const estilos = [
                {
                  gradient: "from-cyan-400/25 via-sky-500/10 to-transparent",
                  icon: "from-cyan-300 to-sky-600",
                  glow: "bg-cyan-400/25",
                  number: "01",
                },
                {
                  gradient: "from-violet-400/25 via-purple-500/10 to-transparent",
                  icon: "from-violet-300 to-purple-600",
                  glow: "bg-violet-400/25",
                  number: "02",
                },
                {
                  gradient: "from-emerald-400/20 via-cyan-500/10 to-transparent",
                  icon: "from-emerald-300 to-cyan-600",
                  glow: "bg-emerald-400/20",
                  number: "03",
                },
                {
                  gradient: "from-fuchsia-400/25 via-pink-500/10 to-transparent",
                  icon: "from-fuchsia-300 to-pink-600",
                  glow: "bg-fuchsia-400/20",
                  number: "04",
                },
              ];

              const estilo = estilos[indexServicio] || estilos[0];

              return (
                <button
                  type="button"
                  key={servicio.titulo}
                  onClick={() => solicitarServicio(servicio)}
                  className="
                    macro-service-card
                    group
                    relative
                    min-h-[390px]
                    overflow-hidden
                    rounded-[30px]
                    border
                    border-white/10
                    bg-white/[0.045]
                    backdrop-blur-xl
                    p-6
                    text-left
                    transition-all
                    duration-500
                    hover:-translate-y-2
                    hover:border-white/20
                    hover:shadow-[0_28px_90px_rgba(0,0,0,.35)]
                  "
                >

                  <div className={`absolute inset-0 bg-gradient-to-br ${estilo.gradient} opacity-70 transition-opacity duration-500 group-hover:opacity-100`} />
                  <div className={`absolute -right-14 -top-14 w-48 h-48 rounded-full ${estilo.glow} blur-[65px] transition-transform duration-700 group-hover:scale-150`} />

                  <div
                    className="
                      absolute
                      inset-x-6
                      top-0
                      h-px
                      bg-gradient-to-r
                      from-transparent
                      via-white/45
                      to-transparent
                      opacity-0
                      group-hover:opacity-100
                      transition-opacity
                    "
                  />

                  <div className="relative z-10 h-full flex flex-col">

                    <div className="flex items-start justify-between gap-4">
                      <div
                        className={`
                          macro-service-icon
                          w-14
                          h-14
                          rounded-2xl
                          bg-gradient-to-br
                          ${estilo.icon}
                          flex
                          items-center
                          justify-center
                          text-xl
                          text-white
                          shadow-lg
                          transition-all
                          duration-500
                        `}
                      >
                        {servicio.icon}
                      </div>

                      <span className="text-5xl font-black tracking-[-.08em] text-white/[0.08] transition-colors group-hover:text-white/[0.13]">
                        {estilo.number}
                      </span>
                    </div>

                    <div className="mt-12">
                      <p className="text-[10px] uppercase tracking-[.24em] font-black text-slate-400 group-hover:text-cyan-200 transition-colors">
                        {servicio.subtitulo}
                      </p>

                      <h3 className="mt-3 text-2xl md:text-3xl font-black tracking-[-.03em]">
                        {servicio.titulo}
                      </h3>

                      <p className="mt-4 text-sm md:text-base text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">
                        {servicio.descripcion}
                      </p>
                    </div>

                    <div className="mt-auto pt-9 flex items-center justify-between gap-4">
                      <span className="text-sm font-black text-white">
                        Explorar servicio
                      </span>

                      <span
                        className="
                          w-11
                          h-11
                          rounded-full
                          border
                          border-white/10
                          bg-white/[0.06]
                          flex
                          items-center
                          justify-center
                          text-cyan-300
                          transition-all
                          duration-300
                          group-hover:bg-white
                          group-hover:text-slate-950
                          group-hover:translate-x-1
                        "
                      >
                        <FaArrowRight />
                      </span>
                    </div>

                    <div className="mt-7 h-1.5 rounded-full bg-white/[0.055] overflow-hidden">
                      <div
                        className={`
                          h-full
                          rounded-full
                          bg-gradient-to-r
                          ${estilo.icon}
                          transition-all
                          duration-700
                          w-[28%]
                          group-hover:w-full
                        `}
                      />
                    </div>

                  </div>

                </button>
              );
            })}

          </div>

          {/* BANDA DE CAPACIDADES */}

          <div
            className="
              mt-7
              rounded-[28px]
              border
              border-white/10
              bg-white/[0.035]
              backdrop-blur-xl
              px-5
              md:px-7
              py-5
              flex
              flex-wrap
              items-center
              justify-between
              gap-5
            "
          >
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-xs md:text-sm text-slate-400 font-semibold">
              <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-cyan-300" /> Desarrollo</span>
              <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-violet-300" /> Automatización</span>
              <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-300" /> Seguridad</span>
              <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-fuchsia-300" /> Crecimiento digital</span>
            </div>

            <div className="flex items-center gap-2 text-xs uppercase tracking-[.2em] text-cyan-300 font-black">
              <span className="relative flex w-2.5 h-2.5">
                <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-300 opacity-70 animate-ping" />
                <span className="relative inline-flex w-2.5 h-2.5 rounded-full bg-emerald-300" />
              </span>
              Macro activo
            </div>
          </div>

        </div>

      </section>

      {/* ================================================= */}
      {/* PROYECTOS */}
      {/* ================================================= */}

      <section
        id="proyectos"
        className={`
          py-24

          ${
            modoOscuro
              ? "bg-[#08101f]"
              : "bg-white"
          }
        `}
      >

        <div
          className="
            max-w-7xl
            mx-auto
            px-5
            md:px-8
          "
        >

          {/* HEADER */}

          <div
            className="
              flex
              flex-col
              md:flex-row
              md:items-end
              md:justify-between
              gap-5
            "
          >

            <div>

              <Etiqueta>
                Portafolio
              </Etiqueta>


              <h2
                className="
                  text-4xl
                  md:text-6xl
                  drop-shadow-[0_2px_18px_rgba(0,0,0,.30)]
                  font-black
                  tracking-[-0.04em]
                  mt-4
                "
              >

                Proyectos que

                <span
                  className="
                    text-sky-500
                  "
                >

                  {" "}hablan por nosotros.

                </span>

              </h2>


              <p
                className="
                  max-w-2xl
                  text-slate-500
                  text-lg
                  leading-relaxed
                  mt-4
                "
              >

                Una selección de nuestros proyectos,
                servicios e implementaciones más recientes.

              </p>

            </div>


            <button
              type="button"
              onClick={() =>
                navigate(
                  "/proyectos"
                )
              }
              className="
                text-sky-500
                font-bold
                flex
                items-center
                gap-2
              "
            >

              Ver todos los proyectos

              <FaArrowRight />

            </button>

          </div>


          {/* ================================================= */}
          {/* PROYECTOS HOME */}
          {/* ================================================= */}

          {proyectosHome.length > 0 ? (

            <div
              className="
                mt-12
                space-y-8
              "
            >

              {proyectosHome.map(
                (
                  proyecto,
                  indice
                ) => {

                  const urlProyecto =
                    obtenerUrlProyecto(
                      proyecto
                    );

                  const volteado =
                    proyectoVolteado ===
                    proyecto.id;

                  const alternarProyecto = () => {
                    setProyectoVolteado(
                      volteado
                        ? null
                        : proyecto.id
                    );
                  };


                  return (

                    <article
                      key={proyecto.id}
                      className="macro-project-perspective"
                    >

                      <div
                        className={`
                          macro-project-flip
                          ${volteado ? "is-flipped" : ""}
                        `}
                      >

                        {/* FRENTE — VISUAL DEL PROYECTO */}
                        <div
                          className={`
                            macro-project-face
                            macro-project-front
                            border
                            cursor-pointer
                            group

                            ${
                              modoOscuro
                                ? "bg-[#0b1424] border-slate-800"
                                : "bg-[#f7fafd] border-slate-200"
                            }
                          `}
                          onClick={alternarProyecto}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(event) => {
                            if (
                              event.key === "Enter" ||
                              event.key === " "
                            ) {
                              event.preventDefault();
                              alternarProyecto();
                            }
                          }}
                        >

                          <div className="absolute inset-0 bg-[#020713] overflow-hidden flex items-center justify-center">

                            {proyecto.imagen ? (
                              <img
                                src={proyecto.imagen}
                                alt={proyecto.nombre || "Proyecto Macro"}
                                loading="lazy"
                                className="absolute inset-0 w-full h-full object-contain"
                              />
                            ) : (
                              <div className="flex flex-col items-center justify-center gap-4 text-sky-400">
                                <FaLaptopCode size={60} />
                                <span className="text-sm text-slate-500">
                                  Proyecto Macro
                                </span>
                              </div>
                            )}

                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/15 pointer-events-none" />
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(56,189,248,.16),transparent_28%)] pointer-events-none" />

                            <div className="absolute top-6 left-6 right-6 flex items-start justify-between gap-4">
                              <span className="bg-black/55 backdrop-blur-md border border-white/15 text-white px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-[0.18em]">
                                {
                                  proyecto.categoria ||
                                  proyecto.tipo ||
                                  "Proyecto"
                                }
                              </span>

                              {proyecto.destacado && (
                                <span className="bg-sky-500 text-white px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-[0.16em] shadow-[0_12px_35px_rgba(14,165,233,.28)]">
                                  Destacado
                                </span>
                              )}
                            </div>

                            <div className="absolute left-6 right-6 bottom-6 flex items-end justify-between gap-6">

                              <div className="max-w-[72%]">
                                <p className="text-[10px] uppercase tracking-[.25em] text-cyan-300 font-black">
                                  Proyecto {grupoActivo * 4 + indice + 1}
                                </p>
                                <h3 className="mt-2 text-3xl md:text-5xl font-black tracking-[-.045em] text-white drop-shadow-[0_10px_30px_rgba(0,0,0,.45)]">
                                  {proyecto.nombre || "Proyecto Macro"}
                                </h3>
                              </div>

                              <button
                                type="button"
                                aria-label={`Ver información de ${proyecto.nombre || "proyecto"}`}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  alternarProyecto();
                                }}
                                className="group/arrow w-14 h-14 md:w-16 md:h-16 shrink-0 rounded-full border border-white/20 bg-black/35 backdrop-blur-xl text-white flex items-center justify-center transition-all duration-500 hover:bg-sky-500 hover:scale-110 hover:rotate-[-8deg] shadow-[0_18px_45px_rgba(0,0,0,.30)]"
                              >
                                <FaArrowRight className="text-lg transition-transform duration-500 group-hover/arrow:translate-x-1" />
                              </button>

                            </div>

                          </div>

                        </div>

                        {/* REVERSO — INFORMACIÓN + ACCIONES */}
                        <div
                          className={`
                            macro-project-face
                            macro-project-back
                            border

                            ${
                              modoOscuro
                                ? "bg-[#07111f] border-slate-800"
                                : "bg-white border-slate-200"
                            }
                          `}
                        >

                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(14,165,233,.14),transparent_30%),radial-gradient(circle_at_90%_75%,rgba(139,92,246,.10),transparent_30%)] pointer-events-none" />

                          <div className="relative h-full p-7 md:p-10 lg:p-12 flex flex-col justify-center">

                            <div className="flex items-start justify-between gap-5">
                              <div>
                                <p className="text-xs uppercase tracking-[0.25em] text-sky-500 font-bold">
                                  Proyecto Macro
                                </p>

                                <h3 className="mt-4 text-3xl md:text-5xl font-black tracking-[-0.04em] leading-tight">
                                  {proyecto.nombre || "Proyecto Macro"}
                                </h3>
                              </div>

                              <button
                                type="button"
                                aria-label="Volver a la vista del proyecto"
                                onClick={alternarProyecto}
                                className={`
                                  w-12 h-12 rounded-full border shrink-0 flex items-center justify-center transition-all duration-300 hover:rotate-180
                                  ${
                                    modoOscuro
                                      ? "border-slate-700 bg-white/[0.05] hover:bg-white/[0.10]"
                                      : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                                  }
                                `}
                              >
                                <FaArrowRight className="rotate-180" />
                              </button>
                            </div>

                            <p className="text-slate-500 text-base md:text-lg leading-relaxed mt-6 max-w-4xl">
                              {
                                proyecto.descripcion ||
                                "Solución tecnológica desarrollada por Macro."
                              }
                            </p>

                            {Array.isArray(proyecto.tecnologias) &&
                              proyecto.tecnologias.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-6">
                                  {proyecto.tecnologias
                                    .slice(0, 6)
                                    .map((tecnologia) => (
                                      <span
                                        key={tecnologia}
                                        className={`
                                          px-3 py-2 rounded-full border text-xs font-semibold
                                          ${
                                            modoOscuro
                                              ? "bg-[#0b1424] border-slate-700 text-slate-300"
                                              : "bg-slate-50 border-slate-200 text-slate-600"
                                          }
                                        `}
                                      >
                                        {tecnologia}
                                      </span>
                                    ))}
                                </div>
                              )}

                            <div className="flex flex-wrap gap-3 mt-8">

                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  navigate(`/proyecto/${proyecto.id}`);
                                }}
                                className="group bg-[#050b18] hover:bg-sky-500 text-white px-6 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(14,165,233,.22)]"
                              >
                                Ver proyecto
                                <FaArrowRight className="transition-transform group-hover:translate-x-1" />
                              </button>

                              {urlProyecto && (
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    visitarProyecto(proyecto);
                                  }}
                                  className={`
                                    border px-6 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all duration-300 hover:-translate-y-1
                                    ${
                                      modoOscuro
                                        ? "border-slate-700 text-sky-400 hover:border-sky-500 hover:bg-sky-500/10"
                                        : "border-sky-200 text-sky-500 hover:bg-sky-50"
                                    }
                                  `}
                                >
                                  <FaExternalLinkAlt size={13} />
                                  Visitar sitio
                                </button>
                              )}

                            </div>

                            <p className="mt-7 text-xs text-slate-400">
                              Pulsa la flecha superior para volver a la vista visual.
                            </p>

                          </div>

                        </div>

                      </div>

                    </article>

                  );

                }
              )}


              {/* CONTROLES */}

              {gruposProyectos.length > 1 && (

                <div
                  className="
                    flex
                    items-center
                    justify-center
                    gap-4
                    pt-4
                  "
                >

                  <button
                    type="button"
                    aria-label="Proyectos anteriores"
                    onClick={() =>
                      setGrupoActivo(
                        (actual) =>
                          actual === 0
                            ? gruposProyectos.length - 1
                            : actual - 1
                      )
                    }
                    className={`
                      w-12
                      h-12
                      rounded-full
                      border
                      flex
                      items-center
                      justify-center
                      transition

                      ${
                        modoOscuro
                          ? `
                            border-slate-700
                            hover:bg-slate-800
                          `
                          : `
                            border-slate-200
                            hover:bg-slate-100
                          `
                      }
                    `}
                  >

                    ←

                  </button>


                  <div
                    className="
                      flex
                      items-center
                      gap-2
                    "
                  >

                    {gruposProyectos.map(
                      (
                        _,
                        indicador
                      ) => (

                        <button
                          type="button"
                          key={
                            indicador
                          }
                          aria-label={
                            `Ver grupo ${indicador + 1}`
                          }
                          onClick={() =>
                            setGrupoActivo(
                              indicador
                            )
                          }
                          className={`
                            h-2.5
                            rounded-full
                            transition-all
                            duration-300

                            ${
                              indicador === grupoActivo
                                ? `
                                  w-12
                                  bg-sky-500
                                `
                                : `
                                  w-3
                                  bg-slate-300
                                `
                            }
                          `}
                        />

                      )
                    )}

                  </div>


                  <button
                    type="button"
                    aria-label="Siguientes proyectos"
                    onClick={() =>
                      setGrupoActivo(
                        (actual) =>
                          (
                            actual + 1
                          ) %
                          gruposProyectos.length
                      )
                    }
                    className="
                      w-12
                      h-12
                      rounded-full
                      bg-sky-500
                      hover:bg-sky-600
                      text-white
                      flex
                      items-center
                      justify-center
                      transition
                    "
                  >

                    →

                  </button>

                </div>

              )}

            </div>

          ) : (

            <div
              className="
                mt-12
                rounded-[30px]
                border
                border-dashed
                border-slate-300
                p-12
                text-center
              "
            >

              <FaLaptopCode
                className="
                  mx-auto
                  text-5xl
                  text-sky-400
                "
              />


              <h3
                className="
                  text-xl
                  font-bold
                  mt-5
                "
              >

                Estamos preparando nuestro portafolio.

              </h3>


              <p
                className="
                  text-slate-500
                  mt-2
                "
              >

                Muy pronto encontrarás nuevos proyectos de Macro.

              </p>

            </div>

          )}

        </div>

      </section>


      {/* ================================================= */}
      {/* PUBLICACIONES — BLANCO PRO */}
      {/* ================================================= */}

      <section
        className="
          relative
          isolate
          overflow-hidden
          bg-white
          text-slate-950
          py-24
          lg:py-28
          border-y
          border-slate-200
        "
      >

        {/* FONDO TECNOLÓGICO SUAVE */}

        <div
          className="
            absolute
            inset-0
            bg-[radial-gradient(circle_at_12%_15%,rgba(14,165,233,.10),transparent_26%),radial-gradient(circle_at_90%_15%,rgba(139,92,246,.08),transparent_24%),linear-gradient(rgba(14,165,233,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(14,165,233,.035)_1px,transparent_1px)]
            bg-[size:auto,auto,48px_48px,48px_48px]
          "
        />

        <div
          className="
            absolute
            -left-[160px]
            top-[8%]
            w-[420px]
            h-[420px]
            rounded-full
            bg-sky-300/15
            blur-[120px]
          "
        />

        <div
          className="
            absolute
            -right-[180px]
            bottom-[-100px]
            w-[460px]
            h-[460px]
            rounded-full
            bg-violet-300/15
            blur-[130px]
          "
        />

        <div
          className="
            relative
            z-10
            max-w-[1450px]
            mx-auto
            px-5
            md:px-8
          "
        >

          <div
            className="
              flex
              flex-col
              lg:flex-row
              lg:items-end
              lg:justify-between
              gap-8
              mb-12
            "
          >

            <div className="max-w-3xl">

              <div
                className="
                  inline-flex
                  items-center
                  gap-3
                  rounded-full
                  border
                  border-sky-200
                  bg-sky-50
                  px-4
                  py-2
                "
              >

                <span className="relative flex w-2.5 h-2.5">
                  <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
                  <span className="relative inline-flex w-2.5 h-2.5 rounded-full bg-emerald-500" />
                </span>

                <span
                  className="
                    text-[10px]
                    sm:text-xs
                    uppercase
                    tracking-[.24em]
                    font-black
                    text-sky-600
                  "
                >
                  Macro Signal · En vivo
                </span>

              </div>

              <h2
                className="
                  mt-6
                  text-4xl
                  md:text-6xl
                  lg:text-7xl
                  font-black
                  tracking-[-0.055em]
                  leading-[.95]
                "
              >
                Lo nuevo de

                <span
                  className="
                    block
                    bg-gradient-to-r
                    from-cyan-500
                    via-sky-600
                    to-violet-600
                    bg-clip-text
                    text-transparent
                    macro-animated-gradient
                  "
                >
                  Macro, en movimiento.
                </span>
              </h2>

              <p
                className="
                  max-w-2xl
                  mt-6
                  text-base
                  md:text-lg
                  text-slate-600
                  leading-relaxed
                "
              >
                Lanzamientos, proyectos, instalaciones,
                promociones y novedades del ecosistema Macro
                dentro de un feed visual más limpio y profesional.
              </p>

            </div>


            {/* RADAR BLANCO */}

            <div
              className="
                relative
                hidden
                md:flex
                w-[220px]
                h-[220px]
                shrink-0
                items-center
                justify-center
              "
            >

              <div className="absolute inset-0 rounded-full border border-sky-100" />
              <div className="absolute inset-[16%] rounded-full border border-dashed border-sky-200" />
              <div className="absolute inset-[32%] rounded-full border border-violet-200" />

              <div className="macro-radar absolute inset-[7%] rounded-full overflow-hidden">
                <div
                  className="
                    absolute
                    left-1/2
                    top-1/2
                    w-1/2
                    h-[2px]
                    origin-left
                    bg-gradient-to-r
                    from-sky-500
                    to-transparent
                  "
                />
              </div>

              <div
                className="
                  relative
                  w-20
                  h-20
                  rounded-3xl
                  bg-gradient-to-br
                  from-cyan-400
                  via-sky-500
                  to-blue-700
                  flex
                  items-center
                  justify-center
                  text-3xl
                  text-white
                  shadow-[0_18px_45px_rgba(14,165,233,.25)]
                  macro-float
                "
              >
                <FaRocket />
              </div>

            </div>

          </div>


          <div
            className="
              grid
              lg:grid-cols-[.55fr_1.45fr]
              gap-7
              lg:gap-10
              items-start
            "
          >

            {/* PANEL LATERAL */}

            <aside
              className="
                lg:sticky
                lg:top-28
                rounded-[30px]
                border
                border-slate-200
                bg-white/90
                backdrop-blur-xl
                p-6
                md:p-7
                shadow-[0_24px_70px_rgba(15,23,42,.08)]
              "
            >

              <div
                className="
                  w-12
                  h-12
                  rounded-2xl
                  bg-sky-50
                  border
                  border-sky-100
                  text-sky-600
                  flex
                  items-center
                  justify-center
                  text-xl
                "
              >
                <FaBullhorn />
              </div>

              <p
                className="
                  mt-6
                  text-[10px]
                  uppercase
                  tracking-[.24em]
                  text-sky-600
                  font-black
                "
              >
                Comunidad Macro
              </p>

              <h3
                className="
                  mt-3
                  text-2xl
                  md:text-3xl
                  font-black
                  tracking-[-.035em]
                "
              >
                Cada actualización

                <span className="block text-sky-500">
                  cuenta una historia.
                </span>
              </h3>

              <p
                className="
                  mt-4
                  text-sm
                  md:text-base
                  text-slate-600
                  leading-relaxed
                "
              >
                Sigue nuestros proyectos, nuevas soluciones,
                productos y avances sin salir del ecosistema Macro.
              </p>

              <div className="mt-7 grid grid-cols-2 gap-3">

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-2xl font-black text-slate-950">
                    LIVE
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Actualizaciones
                  </p>
                </div>

                <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4">
                  <p className="text-2xl font-black text-sky-600">
                    24/7
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Ecosistema digital
                  </p>
                </div>

              </div>

              <button
                type="button"
                onClick={() =>
                  solicitarServicio()
                }
                className="
                  group
                  mt-7
                  w-full
                  rounded-2xl
                  bg-gradient-to-r
                  from-cyan-400
                  via-sky-500
                  to-blue-600
                  px-5
                  py-4
                  text-sm
                  font-black
                  text-white
                  flex
                  items-center
                  justify-center
                  gap-3
                  shadow-[0_16px_45px_rgba(14,165,233,.20)]
                  hover:-translate-y-1
                  transition-all
                  duration-300
                "
              >
                Cuéntanos tu idea

                <FaArrowRight className="transition-transform group-hover:translate-x-1" />
              </button>

            </aside>


            {/* FEED BLANCO */}

            <div
              className="
                relative
                overflow-hidden
                rounded-[31px]
                border
                border-slate-200
                bg-white
                p-3
                md:p-4
                shadow-[0_30px_85px_rgba(15,23,42,.10)]
              "
            >

              <div
                className="
                  mb-3
                  flex
                  flex-wrap
                  items-center
                  justify-between
                  gap-3
                  rounded-[22px]
                  border
                  border-slate-200
                  bg-slate-50
                  px-4
                  py-3
                "
              >

                <div className="flex items-center gap-3">

                  <span className="relative flex w-2.5 h-2.5">
                    <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
                    <span className="relative inline-flex w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  </span>

                  <div>
                    <p className="text-xs font-black text-slate-950">
                      Macro Live Feed
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Últimas publicaciones
                    </p>
                  </div>

                </div>

                <div className="flex items-center gap-2">

                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[9px] uppercase tracking-[.18em] font-black text-slate-500">
                    Proyectos
                  </span>

                  <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-[9px] uppercase tracking-[.18em] font-black text-sky-600">
                    Novedades
                  </span>

                </div>

              </div>


              <div
                className="
                  relative
                  overflow-hidden
                  rounded-[24px]
                  bg-white
                  border
                  border-slate-200
                  p-2
                  md:p-3
                "
              >

                <PublicacionesFeed
                  modoOscuro={false}
                  limite={3}
                  titulo=""
                  descripcion=""
                />

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* ================================================= */}
      {/* FONDO2 — VIDEO DETRÁS DE LAS DOS CARDS */}
      {/* Archivo: public/videos/fondo2.mov */}
      {/* ================================================= */}

      <div
        className="
          relative
          isolate
          overflow-hidden
        "
      >

        <video
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="
            absolute
            inset-0
            z-0
            w-full
            h-full
            object-cover
            object-center
            pointer-events-none
            select-none
            brightness-[1.00]
            saturate-[1.00]
            contrast-[1.00]
          "
        >
          <source
            src={FONDO2_VIDEO_URL}
            type="video/mp4"
          />

          Tu navegador no puede reproducir este video.
        </video>

        {/*
          No ponemos capa negra encima para conservar
          la iluminación y los colores originales del video.
          Solo un degradado muy leve en los bordes para
          integrar las dos tarjetas oscuras.
        */}

        <div
          className="
            absolute
            inset-0
            z-[1]
            pointer-events-none
            bg-[linear-gradient(180deg,rgba(246,249,252,.06)_0%,transparent_14%,transparent_86%,rgba(246,249,252,.05)_100%)]
          "
        />

        <div
          className="
            relative
            z-10
          "
        >

      {/* ================================================= */}
      {/* TIENDA COMPLETA CTA */}
      {/* ================================================= */}

      <section
        id="tienda"
        className="
          max-w-7xl
          mx-auto
          px-5
          md:px-8
          py-14
          md:py-16
        "
      >

        <div
          className="
            relative
            overflow-hidden
            rounded-[38px]
            bg-[#071221]/52
            text-white
            backdrop-blur-[10px]
            p-8
            md:p-12
            lg:p-14
            border
            border-white/20
            shadow-[0_24px_70px_rgba(0,0,0,.24)]
            backdrop-blur-[2px]
          "
        >

          <div
            className="
              absolute
              -right-32
              -top-32
              w-[420px]
              h-[420px]
              rounded-full
              bg-sky-500/20
              blur-3xl
            "
          />


          <div
            className="
              relative
              z-10
              grid
              lg:grid-cols-[1fr_.8fr]
              items-center
              gap-10
            "
          >

            <div>

              <span
                className="
                  text-xs
                  uppercase
                  tracking-[0.25em]
                  text-cyan-300
                  font-bold
                "
              >

                Macro Store

              </span>


              <h2
                className="
                  text-4xl
                  md:text-6xl
                  font-black
                  tracking-[-0.04em]
                  mt-4
                "
              >

                Tecnología que

                <span
                  className="
                    block
                    text-sky-400
                  "
                >

                  puedes llevar contigo.

                </span>

              </h2>


              <p
                className="
                  max-w-xl
                  text-slate-300
                  text-lg
                  leading-relaxed
                  mt-5
                "
              >

                Equipos, accesorios y productos
                tecnológicos seleccionados dentro
                del ecosistema Macro.

              </p>


              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/tienda"
                  )
                }
                className="
                  mt-8
                  bg-white
                  hover:bg-sky-50
                  text-slate-950
                  px-6
                  py-4
                  rounded-2xl
                  font-bold
                  flex
                  items-center
                  gap-3
                "
              >

                <FaShoppingBag />

                Entrar a la tienda

                <FaArrowRight />

              </button>

            </div>


            <div
              className="
                grid
                grid-cols-2
                gap-3
              "
            >

              <StoreBox
                icon={<FaCamera />}
                title="Seguridad"
              />

              <StoreBox
                icon={<FaLaptopCode />}
                title="Tecnología"
              />

              <StoreBox
                icon={<FaMobileAlt />}
                title="Accesorios"
              />

              <StoreBox
                icon={<FaStore />}
                title="Más productos"
              />

            </div>

          </div>

        </div>

      </section>


      {/* ================================================= */}
      {/* CTA FINAL */}
      {/* ================================================= */}

      <section
        className="
          max-w-7xl
          mx-auto
          px-5
          md:px-8
          pb-16
          pt-6
        "
      >

        <div
          className="
            relative
            overflow-hidden
            rounded-[38px]
            min-h-[430px]
            border
            border-white/20
            shadow-[0_26px_80px_rgba(0,0,0,.26)]
            flex
            items-center
            bg-[#020617]
          "
        >


          {/* ================================================= */}
        {/* FONDO TECNOLÓGICO GENERADO CON CÓDIGO */}
        {/* ================================================= */}

        <div
          className="
            absolute
            inset-0
            overflow-hidden
            bg-[#040617]
            pointer-events-none
          "
        >

          <div
            className="
              absolute
              inset-0
              bg-[radial-gradient(circle_at_50%_50%,rgba(14,165,233,.13),transparent_28%),radial-gradient(circle_at_78%_30%,rgba(168,85,247,.14),transparent_30%)]
            "
          />

          {/* CÍRCULOS TIPO TÚNEL */}

          <div className="macro-tunnel-zoom absolute left-1/2 top-1/2 w-[1100px] h-[1100px] rounded-full border border-cyan-300/10" />

          <div className="macro-tunnel-ring absolute left-1/2 top-1/2 w-[900px] h-[900px] rounded-full border-[18px] border-cyan-300/[0.08]">
            <span className="absolute top-[8%] left-[50%] w-3 h-3 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,.8)]" />
            <span className="absolute bottom-[12%] right-[18%] w-2.5 h-2.5 rounded-full bg-violet-300 shadow-[0_0_18px_rgba(196,181,253,.75)]" />
          </div>

          <div className="macro-tunnel-ring-reverse absolute left-1/2 top-1/2 w-[720px] h-[720px] rounded-full border-[16px] border-violet-400/[0.10]">
            <span className="absolute top-[20%] right-[8%] w-2.5 h-2.5 rounded-full bg-sky-300 shadow-[0_0_16px_rgba(125,211,252,.8)]" />
          </div>

          <div className="macro-tunnel-ring absolute left-1/2 top-1/2 w-[560px] h-[560px] rounded-full border-[14px] border-cyan-300/[0.12]" style={{ animationDuration: "11s" }} />

          <div className="macro-tunnel-ring-reverse absolute left-1/2 top-1/2 w-[420px] h-[420px] rounded-full border-[12px] border-fuchsia-400/[0.11]" style={{ animationDuration: "9s" }} />

          <div className="macro-tunnel-ring absolute left-1/2 top-1/2 w-[300px] h-[300px] rounded-full border-[10px] border-cyan-200/[0.14]" style={{ animationDuration: "7s" }} />

          <div className="macro-tunnel-core absolute left-1/2 top-1/2 w-[120px] h-[120px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,.95)_0%,rgba(103,232,249,.9)_14%,rgba(14,165,233,.55)_35%,rgba(59,130,246,.12)_62%,transparent_74%)] shadow-[0_0_70px_rgba(56,189,248,.45)]" />

          {/* LÍNEAS RADIALES */}

          <div className="absolute left-1/2 top-1/2 w-[1200px] h-px -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-transparent via-cyan-300/20 to-transparent" />

          <div className="absolute left-1/2 top-1/2 w-px h-[900px] -translate-x-1/2 -translate-y-1/2 bg-gradient-to-b from-transparent via-sky-300/20 to-transparent" />

          <div className="absolute left-1/2 top-1/2 w-[980px] h-px -translate-x-1/2 -translate-y-1/2 rotate-45 bg-gradient-to-r from-transparent via-violet-300/16 to-transparent" />

          <div className="absolute left-1/2 top-1/2 w-[980px] h-px -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-gradient-to-r from-transparent via-cyan-300/14 to-transparent" />

          {/* BARRIDO DE LUZ */}

          <div
            className="
              macro-tunnel-scan
              absolute
              top-[-20%]
              bottom-[-20%]
              left-0
              w-[16%]
              bg-gradient-to-r
              from-transparent
              via-white/[0.10]
              to-transparent
              blur-xl
            "
          />

          {/* PARTÍCULAS */}

          <span className="macro-tunnel-dot absolute left-[16%] top-[22%] w-2 h-2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,.9)]" />
          <span className="macro-tunnel-dot absolute left-[28%] top-[68%] w-1.5 h-1.5 rounded-full bg-sky-300 shadow-[0_0_16px_rgba(125,211,252,.8)]" style={{ animationDelay: ".7s" }} />
          <span className="macro-tunnel-dot absolute right-[18%] top-[24%] w-2.5 h-2.5 rounded-full bg-violet-300 shadow-[0_0_18px_rgba(196,181,253,.8)]" style={{ animationDelay: "1.2s" }} />
          <span className="macro-tunnel-dot absolute right-[28%] bottom-[20%] w-2 h-2 rounded-full bg-cyan-300 shadow-[0_0_16px_rgba(103,232,249,.8)]" style={{ animationDelay: "1.8s" }} />

        </div>

        {/* CAPAS DE INTEGRACIÓN */}

        <div
          className="
            absolute
            inset-0
            bg-[linear-gradient(90deg,rgba(2,6,23,.92)_0%,rgba(2,6,23,.76)_35%,rgba(15,23,42,.46)_68%,rgba(2,6,23,.68)_100%)]
            pointer-events-none
          "
        />

        <div
          className="
            absolute
            inset-0
            bg-[radial-gradient(circle_at_18%_28%,rgba(14,165,233,.24),transparent_30%),radial-gradient(circle_at_84%_28%,rgba(168,85,247,.18),transparent_30%)]
            pointer-events-none
          "
        />

          {/* SOMBRA / DEGRADADO */}

          <div
            className="
              absolute
              inset-0
              bg-[linear-gradient(90deg,rgba(2,6,23,.95)_0%,rgba(2,6,23,.84)_42%,rgba(2,6,23,.50)_72%,rgba(2,6,23,.68)_100%)]
            "
          />

          <div
            className="
              absolute
              inset-0
              bg-[radial-gradient(circle_at_18%_35%,rgba(14,165,233,.28),transparent_30%),radial-gradient(circle_at_82%_26%,rgba(168,85,247,.18),transparent_28%)]
            "
          />


          {/* PARTÍCULAS */}

          <span
            className="
              macro-float
              absolute
              left-[7%]
              top-[18%]
              w-2
              h-2
              rounded-full
              bg-cyan-300
              shadow-[0_0_18px_rgba(103,232,249,.85)]
            "
          />

          <span
            className="
              macro-float-slow
              absolute
              right-[14%]
              top-[22%]
              w-2.5
              h-2.5
              rounded-full
              bg-violet-300
              shadow-[0_0_18px_rgba(196,181,253,.75)]
            "
          />


          <div
            className="
              relative
              z-10
              w-full
              p-8
              md:p-12
              lg:p-14
              grid
              lg:grid-cols-[1fr_.72fr]
              gap-10
              items-center
              text-white
            "
          >

            <div>

              <div
                className="
                  inline-flex
                  items-center
                  gap-3
                  rounded-full
                  border
                  border-cyan-300/20
                  bg-cyan-400/10
                  px-4
                  py-2
                  backdrop-blur-xl
                "
              >
                <span
                  className="
                    w-2
                    h-2
                    rounded-full
                    bg-cyan-300
                    shadow-[0_0_14px_rgba(103,232,249,.9)]
                  "
                />

                <span
                  className="
                    text-[10px]
                    uppercase
                    tracking-[.24em]
                    font-black
                    text-cyan-200
                  "
                >
                  Tu próximo proyecto
                </span>
              </div>


              <h2
                className="
                  text-4xl
                  md:text-6xl
                  font-black
                  tracking-[-0.05em]
                  leading-[.96]
                  mt-6
                "
              >
                ¿Qué quieres

                <span
                  className="
                    block
                    bg-gradient-to-r
                    from-cyan-300
                    via-sky-400
                    to-violet-400
                    bg-clip-text
                    text-transparent
                    macro-animated-gradient
                  "
                >
                  construir ahora?
                </span>
              </h2>


              <p
                className="
                  text-slate-300
                  mt-5
                  max-w-2xl
                  text-base
                  md:text-lg
                  leading-relaxed
                "
              >
                Cuéntanos tu idea y Macro puede convertirla
                en una solución tecnológica real, desde una
                página web hasta una aplicación, seguridad,
                publicidad o una solución personalizada.
              </p>

            </div>


            <div
              className="
                rounded-[28px]
                border
                border-white/10
                bg-white/[0.07]
                backdrop-blur-2xl
                p-6
                md:p-7
                shadow-[0_22px_70px_rgba(0,0,0,.25)]
              "
            >

              <div
                className="
                  flex
                  items-center
                  gap-4
                "
              >

                <div
                  className="
                    w-12
                    h-12
                    rounded-2xl
                    bg-gradient-to-br
                    from-cyan-300
                    via-sky-500
                    to-blue-700
                    flex
                    items-center
                    justify-center
                    text-xl
                    shadow-[0_0_28px_rgba(14,165,233,.35)]
                  "
                >
                  <FaRocket />
                </div>

                <div>

                  <p
                    className="
                      text-sm
                      font-black
                      text-white
                    "
                  >
                    Macro Project Launch
                  </p>

                  <p
                    className="
                      text-xs
                      text-slate-400
                      mt-1
                    "
                  >
                    Convierte una idea en proyecto
                  </p>

                </div>

              </div>


              <div
                className="
                  grid
                  gap-3
                  mt-6
                "
              >

                <button
                  type="button"
                  onClick={() =>
                    solicitarServicio()
                  }
                  className="
                    group
                    w-full
                    bg-gradient-to-r
                    from-cyan-400
                    via-sky-500
                    to-blue-600
                    hover:from-cyan-300
                    hover:to-blue-500
                    text-white
                    px-6
                    py-4
                    rounded-2xl
                    font-black
                    flex
                    items-center
                    justify-center
                    gap-3
                    transition-all
                    duration-300
                    hover:-translate-y-1
                    shadow-[0_16px_45px_rgba(14,165,233,.24)]
                  "
                >
                  Iniciar proyecto

                  <FaArrowRight
                    className="
                      transition-transform
                      group-hover:translate-x-1
                    "
                  />
                </button>


                {!user && (

                  <Link
                    to="/register"
                    className="
                      w-full
                      border
                      border-white/12
                      bg-white/[0.06]
                      hover:bg-white/[0.10]
                      px-6
                      py-4
                      rounded-2xl
                      font-bold
                      flex
                      items-center
                      justify-center
                      gap-2
                      transition
                    "
                  >
                    <FaUserPlus />

                    Crear cuenta
                  </Link>

                )}

              </div>

            </div>

          </div>

        </div>

      </section>


        </div>

      </div>

    </div>

  );

}



/* ======================================================
   HERO STAT
====================================================== */

function HeroStat({
  icon,
  numero,
  texto,
}) {

  return (

    <div
      className="
        flex
        items-center
        gap-3
      "
    >

      <div
        className="
          w-12
          h-12
          rounded-full
          border
          border-cyan-300/18
          bg-cyan-400/[0.08]
          text-cyan-300
          flex
          items-center
          justify-center
          shrink-0
        "
      >

        {icon}

      </div>

      <div>

        <p
          className="
            text-2xl
            font-black
            leading-none
          "
        >

          {numero}

        </p>

        <p
          className="
            text-sm
            text-slate-400
            mt-1
          "
        >

          {texto}

        </p>

      </div>

    </div>

  );

}


/* ======================================================
   ETIQUETA
====================================================== */

function Etiqueta({
  children,
}) {

  return (

    <span
      className="
        inline-flex
        text-xs
        text-sky-500
        uppercase
        tracking-[0.25em]
        font-bold
      "
    >

      {children}

    </span>

  );

}


/* ======================================================
   HERO METRIC
====================================================== */

function HeroMetric({
  icon,
  numero,
  texto,
}) {

  return (
    <div
      className="
        group
        rounded-2xl
        border
        border-white/[0.08]
        bg-white/[0.035]
        backdrop-blur-xl
        p-3
        sm:p-4
        transition-all
        duration-300
        hover:bg-white/[0.07]
        hover:border-cyan-300/20
        hover:-translate-y-1
      "
    >
      <div className="flex items-center gap-2 text-cyan-300 text-sm">
        {icon}
        <span className="font-black text-white">{numero}</span>
      </div>

      <p className="mt-2 text-[10px] sm:text-xs text-slate-400 leading-tight">
        {texto}
      </p>
    </div>
  );
}


/* ======================================================
   FLOATING TECH CARD
====================================================== */

function FloatingTechCard({
  className = "",
  icon,
  label,
  value,
  accent = "cyan",
  delay = "0s",
}) {

  const accents = {
    cyan: "from-cyan-300 to-sky-500 text-cyan-200 bg-cyan-300/10 border-cyan-300/15",
    sky: "from-sky-300 to-blue-600 text-sky-200 bg-sky-300/10 border-sky-300/15",
    violet: "from-violet-300 to-purple-600 text-violet-200 bg-violet-300/10 border-violet-300/15",
    pink: "from-fuchsia-300 to-pink-600 text-fuchsia-200 bg-fuchsia-300/10 border-fuchsia-300/15",
  };

  const accentClass = accents[accent] || accents.cyan;

  return (
    <div
      className={`
        absolute
        z-20
        w-[172px]
        sm:w-[205px]
        rounded-2xl
        border
        ${accentClass}
        bg-[#07111f]/70
        backdrop-blur-2xl
        p-4
        shadow-[0_18px_55px_rgba(0,0,0,.3)]
        macro-float-slow
        ${className}
      `}
      style={{ animationDelay: delay }}
    >
      <div className="flex items-center gap-3">
        <div
          className={`
            w-10
            h-10
            rounded-xl
            bg-gradient-to-br
            ${accentClass.split(" ").slice(0, 2).join(" ")}
            flex
            items-center
            justify-center
            text-white
            shadow-lg
          `}
        >
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-[9px] uppercase tracking-[.2em] font-black text-slate-400">
            {label}
          </p>
          <p className="mt-1 text-xs sm:text-sm font-bold text-white truncate">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}


/* ======================================================
   MINI DATO
====================================================== */

function MiniDato({
  numero,
  texto,
}) {

  return (

    <div>

      <p
        className="
          text-xl
          md:text-2xl
          font-black
        "
      >

        {numero}

      </p>


      <p
        className="
          text-xs
          text-slate-400
          mt-1
        "
      >

        {texto}

      </p>

    </div>

  );

}


/* ======================================================
   TECH PANEL
====================================================== */

function TechPanel({
  icon,
  titulo,
  texto,
  grande = false,
}) {

  return (

    <div
      className={`
        rounded-2xl
        border
        border-white/10
        bg-white/[0.055]
        p-5

        ${
          grande
            ? "min-h-[155px]"
            : ""
        }
      `}
    >

      <div
        className="
          w-10
          h-10
          rounded-xl
          bg-sky-400/15
          text-sky-300
          flex
          items-center
          justify-center
        "
      >

        {icon}

      </div>


      <h3
        className="
          font-bold
          mt-4
        "
      >

        {titulo}

      </h3>


      <p
        className="
          text-xs
          text-slate-400
          mt-1
        "
      >

        {texto}

      </p>

    </div>

  );

}


/* ======================================================
   STORE BOX
====================================================== */

function StoreBox({
  icon,
  title,
}) {

  return (

    <div
      className="
        min-h-[140px]
        rounded-2xl
        border
        border-white/10
        bg-white/[0.055]
        backdrop-blur-md
        p-5
        flex
        flex-col
        justify-between
      "
    >

      <div
        className="
          w-10
          h-10
          rounded-xl
          bg-sky-400/15
          text-sky-300
          flex
          items-center
          justify-center
        "
      >

        {icon}

      </div>


      <p className="font-bold">

        {title}

      </p>

    </div>

  );

}


export default Home;