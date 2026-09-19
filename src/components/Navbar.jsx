import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  doc,
  getDoc,
} from "firebase/firestore";

import {
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

import {
  auth,
  db,
} from "../firebase.config";

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


function Navbar({
  modoOscuro = false,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [cargandoUsuario, setCargandoUsuario] = useState(true);
  const [scrolled, setScrolled] = useState(false);


  /* ======================================================
     SESIÓN
  ====================================================== */

  useEffect(() => {
    const unsub = onAuthStateChanged(
      auth,
      async (currentUser) => {
        try {
          setCargandoUsuario(true);

          if (!currentUser) {
            setUser(null);
            setRole(null);
            return;
          }

          setUser(currentUser);

          const userRef = doc(
            db,
            "users",
            currentUser.uid
          );

          const snap = await getDoc(userRef);

          if (snap.exists()) {
            setRole(
              snap.data()?.role || "cliente"
            );
          } else {
            setRole("cliente");
          }

        } catch (error) {
          console.error(
            "Error obteniendo usuario:",
            error
          );

          setRole("cliente");

        } finally {
          setCargandoUsuario(false);
        }
      }
    );

    return () => unsub();

  }, []);


  /* ======================================================
     NAVBAR AL HACER SCROLL
  ====================================================== */

  useEffect(() => {
    const manejarScroll = () => {
      setScrolled(
        window.scrollY > 20
      );
    };

    manejarScroll();

    window.addEventListener(
      "scroll",
      manejarScroll,
      { passive: true }
    );

    return () =>
      window.removeEventListener(
        "scroll",
        manejarScroll
      );

  }, []);


  /* ======================================================
     CERRAR MOBILE EN DESKTOP
  ====================================================== */

  useEffect(() => {
    const cerrarDesktop = () => {
      if (
        window.innerWidth >= 1024
      ) {
        setOpen(false);
      }
    };

    window.addEventListener(
      "resize",
      cerrarDesktop
    );

    return () =>
      window.removeEventListener(
        "resize",
        cerrarDesktop
      );

  }, []);


  /* ======================================================
     BLOQUEAR SCROLL MOBILE
  ====================================================== */

  useEffect(() => {
    document.body.style.overflow =
      open ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };

  }, [open]);


  /* ======================================================
     SCROLL A SECCIÓN
  ====================================================== */

  const irASeccion = (id) => {
    setOpen(false);

    if (
      location.pathname !== "/"
    ) {
      navigate("/");

      setTimeout(() => {
        document
          .getElementById(id)
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
      }, 180);

      return;
    }

    document
      .getElementById(id)
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  };


  /* ======================================================
     LOGOUT
  ====================================================== */

  const handleLogout = async () => {
    try {
      await signOut(auth);

      setOpen(false);
      navigate("/");

    } catch (error) {
      console.error(
        "Error cerrando sesión:",
        error
      );
    }
  };


  /* ======================================================
     PANEL
  ====================================================== */

  const rutaPanel =
    role === "admin"
      ? "/admin"
      : "/cliente";

  const textoPanel =
    role === "admin"
      ? "Panel Admin"
      : "Mi cuenta";


  /* ======================================================
     ESTILOS
  ====================================================== */

  const navButton = `
    h-20
    px-2
    flex
    items-center
    gap-2
    text-sm
    xl:text-[15px]
    font-semibold
    whitespace-nowrap
    transition-all
    duration-300
    hover:text-sky-400
    hover:-translate-y-[1px]
  `;


  return (
    <>
      {/* ================================================= */}
      {/* NAVBAR GLASS */}
      {/* ================================================= */}

      <nav
        className={`
          fixed
          top-0
          left-0
          right-0
          z-[90]

          h-20

          border-b

          backdrop-blur-2xl
          supports-[backdrop-filter]:backdrop-blur-2xl

          transition-all
          duration-500

          ${
            modoOscuro
              ? `
                bg-slate-950/38
                border-white/10
                text-white
              `
              : `
                bg-white/42
                border-white/35
                text-slate-800
              `
          }

          ${
            scrolled
              ? `
                shadow-[0_12px_40px_rgba(15,23,42,.12)]
                ${modoOscuro
                  ? "bg-slate-950/58"
                  : "bg-white/58"
                }
              `
              : `
                shadow-none
              `
          }
        `}
      >

        {/* brillo superior */}
        <div
          className="
            absolute
            inset-x-0
            top-0
            h-px
            bg-gradient-to-r
            from-transparent
            via-cyan-300/55
            to-transparent
            pointer-events-none
          "
        />

        <div
          className="
            max-w-[1500px]
            mx-auto
            h-full
            px-5
            md:px-7
            xl:px-8
            flex
            items-center
          "
        >

          {/* LOGO */}

          <Link
            to="/"
            onClick={() =>
              setOpen(false)
            }
            className="
              flex
              items-center
              gap-3
              shrink-0
              group
            "
          >

            <div
              className="
                w-11
                h-11
                rounded-2xl
                bg-gradient-to-br
                from-cyan-400
                via-sky-500
                to-blue-600
                text-white
                flex
                items-center
                justify-center
                shadow-[0_10px_28px_rgba(14,165,233,.28)]
                border
                border-white/25
                transition-all
                duration-300
                group-hover:scale-105
                group-hover:shadow-[0_14px_35px_rgba(14,165,233,.38)]
              "
            >
              <FaCode />
            </div>

            <div>

              <h1
                className="
                  text-xl
                  xl:text-2xl
                  font-black
                  tracking-[0.08em]
                  leading-none
                "
              >
                MACRO
              </h1>

              <span
                className="
                  text-[9px]
                  xl:text-[10px]
                  uppercase
                  tracking-[0.24em]
                  text-sky-500
                  font-bold
                "
              >
                Tecnología & Servicios
              </span>

            </div>

          </Link>


          {/* ================================================= */}
          {/* DESKTOP CENTER */}
          {/* ================================================= */}

          <div
            className="
              hidden
              lg:flex
              flex-1
              justify-center
              items-center
              gap-5
              xl:gap-7
              px-4
            "
          >

            <button
              type="button"
              onClick={() =>
                irASeccion("inicio")
              }
              className={navButton}
            >
              <FaHome />
              Inicio
            </button>

            <button
              type="button"
              onClick={() =>
                irASeccion("servicios")
              }
              className={navButton}
            >
              <FaLayerGroup />
              Servicios
            </button>

            <button
              type="button"
              onClick={() =>
                irASeccion("proyectos")
              }
              className={navButton}
            >
              <FaCode />
              Proyectos
            </button>

            <button
              type="button"
              onClick={() =>
                irASeccion("tienda")
              }
              className={navButton}
            >
              <FaShoppingBag />
              Tienda
            </button>

            <button
              type="button"
              onClick={() =>
                irASeccion("contacto")
              }
              className={navButton}
            >
              Contacto
            </button>

          </div>


          {/* ================================================= */}
          {/* DESKTOP RIGHT */}
          {/* ================================================= */}

          <div
            className="
              hidden
              lg:flex
              items-center
              gap-2
              shrink-0
            "
          >

            {!cargandoUsuario &&
              user && (

                <Link
                  to={rutaPanel}
                  className="
                    h-11
                    px-4
                    rounded-xl

                    bg-white/28
                    backdrop-blur-xl

                    border
                    border-sky-300/30

                    text-sky-600

                    hover:bg-white/48
                    hover:border-sky-300/50

                    font-semibold
                    text-sm

                    flex
                    items-center
                    gap-2

                    shadow-[0_8px_24px_rgba(14,165,233,.08)]

                    transition-all
                    duration-300
                  "
                >

                  {role === "admin"
                    ? <FaUserShield />
                    : <FaUser />
                  }

                  {textoPanel}

                </Link>

              )}


            {!cargandoUsuario &&
              (
                user
                  ? (

                    <button
                      type="button"
                      onClick={
                        handleLogout
                      }
                      className="
                        h-11
                        px-4
                        rounded-xl

                        bg-white/15
                        backdrop-blur-xl

                        border
                        border-white/20

                        text-slate-500

                        hover:text-red-500
                        hover:bg-red-50/50
                        hover:border-red-200/50

                        text-sm
                        font-medium

                        flex
                        items-center
                        gap-2

                        transition-all
                        duration-300
                      "
                    >
                      <FaSignOutAlt />
                      Salir
                    </button>

                  )
                  : (

                    <>

                      <Link
                        to="/login"
                        className="
                          h-11
                          px-4
                          rounded-xl

                          bg-white/22
                          backdrop-blur-xl

                          border
                          border-white/35

                          text-slate-700

                          hover:bg-white/45
                          hover:border-sky-300/50
                          hover:text-sky-600

                          flex
                          items-center
                          gap-2

                          text-sm
                          font-semibold

                          shadow-[0_8px_24px_rgba(15,23,42,.06)]

                          transition-all
                          duration-300
                        "
                      >
                        <FaSignInAlt />
                        Iniciar sesión
                      </Link>

                      <Link
                        to="/register"
                        className="
                          h-11
                          px-5
                          rounded-xl

                          bg-sky-500/82
                          backdrop-blur-xl

                          border
                          border-sky-300/35

                          hover:bg-sky-500

                          text-white

                          flex
                          items-center
                          gap-2

                          text-sm
                          font-bold

                          shadow-[0_10px_30px_rgba(14,165,233,.28)]

                          transition-all
                          duration-300

                          hover:-translate-y-[1px]
                          hover:shadow-[0_14px_36px_rgba(14,165,233,.36)]
                        "
                      >
                        <FaUserPlus />
                        Crear cuenta
                      </Link>

                    </>

                  )
              )}

          </div>


          {/* ================================================= */}
          {/* MOBILE */}
          {/* ================================================= */}

          <button
            type="button"
            onClick={() =>
              setOpen(
                (actual) =>
                  !actual
              )
            }
            className={`
              lg:hidden
              ml-auto
              w-11
              h-11
              rounded-xl
              border
              flex
              items-center
              justify-center
              text-xl
              backdrop-blur-xl
              transition-all

              ${
                modoOscuro
                  ? `
                    bg-slate-900/55
                    border-white/10
                    text-white
                  `
                  : `
                    bg-white/35
                    border-white/40
                    text-slate-700
                  `
              }
            `}
          >

            {open
              ? <FaTimes />
              : <FaBars />
            }

          </button>

        </div>

      </nav>


      {/* OVERLAY */}

      <div
        onClick={() =>
          setOpen(false)
        }
        className={`
          lg:hidden
          fixed
          inset-0
          z-[91]
          bg-slate-950/35
          backdrop-blur-sm
          transition

          ${
            open
              ? "opacity-100 visible"
              : "opacity-0 invisible"
          }
        `}
      />


      {/* ================================================= */}
      {/* SIDEBAR MOBILE GLASS */}
      {/* ================================================= */}

      <aside
        className={`
          lg:hidden
          fixed
          top-0
          right-0
          z-[92]

          w-[88%]
          max-w-[390px]
          h-dvh

          backdrop-blur-2xl
          border-l

          shadow-[-20px_0_60px_rgba(15,23,42,.16)]

          transition-transform
          duration-300

          ${
            modoOscuro
              ? `
                bg-slate-950/80
                border-white/10
                text-white
              `
              : `
                bg-white/78
                border-white/40
                text-slate-900
              `
          }

          ${
            open
              ? "translate-x-0"
              : "translate-x-full"
          }
        `}
      >

        <div
          className="
            h-20
            px-5
            border-b
            border-white/25
            flex
            items-center
            justify-between
          "
        >

          <Link
            to="/"
            onClick={() =>
              setOpen(false)
            }
            className="flex items-center gap-3"
          >

            <div
              className="
                w-10
                h-10
                rounded-xl
                bg-gradient-to-br
                from-cyan-400
                to-blue-600
                text-white
                flex
                items-center
                justify-center
                shadow-lg
              "
            >
              <FaCode />
            </div>

            <div>

              <p className="font-black tracking-widest">
                MACRO
              </p>

              <p className="text-[9px] text-sky-500 uppercase tracking-[0.2em]">
                Tecnología & Servicios
              </p>

            </div>

          </Link>

          <button
            type="button"
            onClick={() =>
              setOpen(false)
            }
            className="
              w-10
              h-10
              rounded-xl
              bg-white/20
              border
              border-white/20
              flex
              items-center
              justify-center
              text-slate-500
            "
          >
            <FaTimes />
          </button>

        </div>


        <div
          className="
            p-5
            overflow-y-auto
            h-[calc(100dvh-80px)]
          "
        >

          {/* CUENTA */}

          {!cargandoUsuario &&
            user && (

              <Link
                to={rutaPanel}
                onClick={() =>
                  setOpen(false)
                }
                className="
                  mb-6
                  p-4
                  rounded-2xl

                  bg-white/35
                  backdrop-blur-xl

                  border
                  border-sky-200/40

                  flex
                  items-center
                  justify-between

                  shadow-[0_10px_30px_rgba(15,23,42,.08)]
                "
              >

                <div className="flex items-center gap-3">

                  <div
                    className="
                      w-11
                      h-11
                      rounded-xl
                      bg-sky-500
                      text-white
                      flex
                      items-center
                      justify-center
                    "
                  >
                    {role === "admin"
                      ? <FaUserShield />
                      : <FaUser />
                    }
                  </div>

                  <div>

                    <p className="text-xs text-slate-500">
                      Cuenta Macro
                    </p>

                    <p className="font-bold">
                      {textoPanel}
                    </p>

                  </div>

                </div>

                <FaChevronRight className="text-sky-400" />

              </Link>

            )}


          {/* LINKS */}

          <div className="space-y-2">

            <MobileButton
              icon={<FaHome />}
              texto="Inicio"
              accion={() =>
                irASeccion("inicio")
              }
            />

            <MobileButton
              icon={<FaLayerGroup />}
              texto="Servicios"
              accion={() =>
                irASeccion("servicios")
              }
            />

            <MobileButton
              icon={<FaCode />}
              texto="Proyectos"
              accion={() =>
                irASeccion("proyectos")
              }
            />

            <MobileButton
              icon={<FaShoppingBag />}
              texto="Tienda"
              accion={() =>
                irASeccion("tienda")
              }
            />

            <MobileButton
              texto="Contacto"
              accion={() =>
                irASeccion("contacto")
              }
            />

          </div>


          {/* LOGIN */}

          <div
            className="
              mt-7
              pt-6
              border-t
              border-white/25
            "
          >

            {!cargandoUsuario &&
              (
                user
                  ? (

                    <button
                      type="button"
                      onClick={
                        handleLogout
                      }
                      className="
                        w-full
                        py-3.5
                        rounded-xl

                        bg-red-50/55
                        backdrop-blur-xl

                        border
                        border-red-200/35

                        text-red-500
                        font-bold

                        flex
                        items-center
                        justify-center
                        gap-2
                      "
                    >
                      <FaSignOutAlt />
                      Cerrar sesión
                    </button>

                  )
                  : (

                    <div className="space-y-3">

                      <Link
                        to="/login"
                        onClick={() =>
                          setOpen(false)
                        }
                        className="
                          w-full
                          py-3.5
                          rounded-xl

                          bg-white/28
                          backdrop-blur-xl

                          border
                          border-white/35

                          flex
                          items-center
                          justify-center
                          gap-2

                          font-semibold
                        "
                      >
                        <FaSignInAlt />
                        Iniciar sesión
                      </Link>

                      <Link
                        to="/register"
                        onClick={() =>
                          setOpen(false)
                        }
                        className="
                          w-full
                          py-3.5
                          rounded-xl

                          bg-sky-500/85
                          backdrop-blur-xl

                          border
                          border-sky-300/30

                          text-white

                          flex
                          items-center
                          justify-center
                          gap-2

                          font-bold
                        "
                      >
                        <FaUserPlus />
                        Crear cuenta
                      </Link>

                    </div>

                  )
              )}

          </div>

        </div>

      </aside>
    </>
  );
}


/* ======================================================
   BOTÓN MOBILE
====================================================== */

function MobileButton({
  icon,
  texto,
  accion,
}) {
  return (
    <button
      type="button"
      onClick={accion}
      className="
        w-full
        px-4
        py-3.5
        rounded-xl

        bg-white/16
        hover:bg-white/35

        border
        border-transparent
        hover:border-white/30

        text-slate-600
        hover:text-sky-600

        flex
        items-center
        justify-between

        transition-all
        duration-300
      "
    >

      <div className="flex items-center gap-3">

        <span className="text-sky-500">
          {icon}
        </span>

        <span className="font-medium">
          {texto}
        </span>

      </div>

      <FaChevronRight
        size={11}
        className="opacity-40"
      />

    </button>
  );
}


export default Navbar;
