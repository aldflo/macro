import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
  useOutletContext,
} from "react-router-dom";

import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";

import {
  auth,
  db,
} from "../firebase.config";

import PublicacionesFeed
  from "../components/PublicacionesFeed";

import {
  FaArrowRight,
  FaBars,
  FaCheckCircle,
  FaClipboardList,
  FaClock,
  FaCode,
  FaHeart,
  FaHome,
  FaLaptopCode,
  FaPlusCircle,
  FaRobot,
  FaSearch,
  FaShoppingBag,
  FaStore,
  FaTimes,
  FaUser,
  FaEye,
} from "react-icons/fa";


function MenuCliente() {
  const navigate =
    useNavigate();


  const {
    modoOscuro = false,
  } =
    useOutletContext() || {};


  const [
    open,
    setOpen,
  ] = useState(false);


  const [
    solicitudes,
    setSolicitudes,
  ] = useState([]);


  const [
    proyectosCliente,
    setProyectosCliente,
  ] = useState([]);


  const [
    favoritos,
    setFavoritos,
  ] = useState([]);


  const [
    cargando,
    setCargando,
  ] = useState(true);


  const usuario =
    auth.currentUser;


  const userEmail =
    usuario?.email || "";


  const userUid =
    usuario?.uid || "";


  /* ======================================================
     SOLICITUDES
  ====================================================== */

  useEffect(() => {
    if (
      !userUid &&
      !userEmail
    ) {
      setCargando(
        false
      );

      return;
    }


    const consulta =
      query(
        collection(
          db,
          "cotizaciones"
        ),
        orderBy(
          "fecha",
          "desc"
        )
      );


    const unsub =
      onSnapshot(
        consulta,

        (snapshot) => {
          const data =
            snapshot.docs
              .map(
                (documento) => ({
                  id:
                    documento.id,

                  ...documento.data(),
                })
              )
              .filter(
                (item) =>
                  (
                    item.uid ===
                      userUid ||
                    item.usuario ===
                      userEmail
                  ) &&
                  item.ocultoPorCliente !==
                    true
              );


          setSolicitudes(
            data
          );


          setCargando(
            false
          );
        },

        () =>
          setCargando(
            false
          )
      );


    return () =>
      unsub();

  }, [
    userUid,
    userEmail,
  ]);


  /* ======================================================
     PROYECTOS CLIENTE
  ====================================================== */

  useEffect(() => {
    if (!userUid) {
      return;
    }


    const unsub =
      onSnapshot(
        collection(
          db,
          "proyectosClientes"
        ),

        (snapshot) => {
          const data =
            snapshot.docs
              .map(
                (documento) => ({
                  id:
                    documento.id,

                  ...documento.data(),
                })
              )
              .filter(
                (item) =>
                  item.uid ===
                    userUid ||
                  item.usuario ===
                    userEmail
              );


          setProyectosCliente(
            data
          );
        }
      );


    return () =>
      unsub();

  }, [
    userUid,
    userEmail,
  ]);


  /* ======================================================
     FAVORITOS
  ====================================================== */

  useEffect(() => {
    if (!userUid) {
      return;
    }


    const unsub =
      onSnapshot(
        collection(
          db,
          "favoritos"
        ),

        (snapshot) => {
          const data =
            snapshot.docs
              .map(
                (documento) => ({
                  id:
                    documento.id,

                  ...documento.data(),
                })
              )
              .filter(
                (item) =>
                  item.uid ===
                    userUid ||
                  item.usuario ===
                    userEmail
              );


          setFavoritos(
            data
          );
        }
      );


    return () =>
      unsub();

  }, [
    userUid,
    userEmail,
  ]);


  /* ======================================================
     ESTADÍSTICAS
  ====================================================== */

  const estadisticas =
    useMemo(() => {
      const enProceso =
        solicitudes.filter(
          (item) =>
            [
              "confirmada_admin",
              "anticipo_pendiente",
              "anticipo_pagado",
              "en_proceso",
              "proceso",
              "desarrollo",
              "desarrollo_activo",
              "instalacion",
            ].includes(
              String(
                item.estado ||
                ""
              ).toLowerCase()
            )
        );


      const nuevas =
        solicitudes.filter(
          (item) =>
            item.vistoPorCliente ===
            false
        );


      return {
        total:
          solicitudes.length,

        nuevas:
          nuevas.length,

        enProceso:
          enProceso.length,

        proyectos:
          proyectosCliente.length,

        favoritos:
          favoritos.length,
      };

    }, [
      solicitudes,
      proyectosCliente,
      favoritos,
    ]);


  if (cargando) {
    return (
      <div
        className="
          min-h-screen

          flex
          items-center
          justify-center

          bg-[#f5fbff]
        "
      >

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


          <p className="mt-4 text-slate-500">

            Cargando Macro...

          </p>

        </div>

      </div>
    );
  }


  return (
    <div
      className={`
        min-h-screen

        flex

        ${
          modoOscuro
            ? "bg-slate-950 text-white"
            : "bg-[#f5fbff] text-slate-900"
        }
      `}
    >

      {/* ================================================= */}
      {/* MOBILE */}
      {/* ================================================= */}

      <div
        className="
          lg:hidden

          fixed
          top-20
          left-0
          right-0

          z-40

          h-16

          bg-white

          border-b
          border-sky-100

          flex
          items-center
          justify-between

          px-5
        "
      >

        <div
          className="
            flex
            items-center
            gap-3
          "
        >

          <div
            className="
              w-10
              h-10

              bg-sky-500
              text-white

              rounded-xl

              flex
              items-center
              justify-center
            "
          >

            <FaCode />

          </div>


          <strong>
            Macro
          </strong>

        </div>


        <button
          onClick={() =>
            setOpen(
              true
            )
          }
          className="
            w-10
            h-10

            bg-sky-50
            text-sky-600

            rounded-xl

            flex
            items-center
            justify-center
          "
        >

          <FaBars />

        </button>

      </div>


      {/* ================================================= */}
      {/* SIDEBAR */}
      {/* ================================================= */}

      <aside
        className={`
          hidden
          lg:flex

          w-72

          shrink-0

          min-h-screen

          border-r

          p-6

          flex-col

          ${
            modoOscuro
              ? "bg-slate-950 border-slate-800"
              : "bg-white border-sky-100"
          }
        `}
      >

        <div className="mb-7">

          <div
            className="
              w-12
              h-12

              rounded-2xl

              bg-sky-500
              text-white

              flex
              items-center
              justify-center
            "
          >

            <FaCode />

          </div>


          <p
            className="
              text-xs
              text-sky-500

              uppercase
              tracking-[0.2em]

              font-bold

              mt-5
            "
          >

            Área de clientes

          </p>


          <h2
            className="
              text-2xl
              font-black

              mt-1
            "
          >

            Macro

          </h2>

        </div>


        <nav className="space-y-2">

          <MenuButton
            icon={<FaHome />}
            text="Inicio"
            active
            onClick={() =>
              navigate(
                "/cliente"
              )
            }
          />


          <MenuButton
            icon={<FaSearch />}
            text="Proyectos"
            onClick={() =>
              navigate(
                "/proyectos"
              )
            }
          />


          <MenuButton
            icon={
              <FaPlusCircle />
            }
            text="Solicitar servicio"
            special
            onClick={() =>
              navigate(
                "/crear-cotizacion"
              )
            }
          />


          <MenuButton
            icon={
              <FaClipboardList />
            }
            text="Mis solicitudes"
            badge={
              estadisticas.nuevas
            }
            onClick={() =>
              navigate(
                "/cliente/cotizaciones"
              )
            }
          />


          <MenuButton
            icon={
              <FaLaptopCode />
            }
            text="Mis proyectos"
            onClick={() =>
              navigate(
                "/cliente/mis-proyectos"
              )
            }
          />


          <MenuButton
            icon={
              <FaHeart />
            }
            text="Favoritos"
            onClick={() =>
              navigate(
                "/favoritos"
              )
            }
          />


          <MenuButton
            icon={
              <FaShoppingBag />
            }
            text="Tienda Macro"
            onClick={() =>
              navigate(
                "/tienda"
              )
            }
          />


          <MenuButton
            icon={
              <FaRobot />
            }
            text="Macro IA"
            onClick={() =>
              navigate(
                "/chat-ia"
              )
            }
          />


          <MenuButton
            icon={<FaUser />}
            text="Perfil"
            onClick={() =>
              navigate(
                "/perfil"
              )
            }
          />

        </nav>

      </aside>


      {/* MOBILE DRAWER */}

      {open && (

        <div
          className="
            fixed
            inset-0

            z-[100]

            bg-black/60

            lg:hidden
          "
        >

          <div
            className="
              absolute
              right-0
              top-0
              bottom-0

              w-[85%]
              max-w-sm

              bg-white

              p-6
            "
          >

            <div
              className="
                flex
                justify-between
                items-center

                mb-7
              "
            >

              <strong className="text-xl">

                Macro

              </strong>


              <button
                onClick={() =>
                  setOpen(
                    false
                  )
                }
              >

                <FaTimes />

              </button>

            </div>


            <div className="space-y-2">

              <MenuButton
                icon={<FaHome />}
                text="Inicio"
                onClick={() => {
                  navigate(
                    "/cliente"
                  );

                  setOpen(
                    false
                  );
                }}
              />


              <MenuButton
                icon={
                  <FaPlusCircle />
                }
                text="Solicitar servicio"
                special
                onClick={() => {
                  navigate(
                    "/crear-cotizacion"
                  );

                  setOpen(
                    false
                  );
                }}
              />


              <MenuButton
                icon={
                  <FaClipboardList />
                }
                text="Solicitudes"
                onClick={() => {
                  navigate(
                    "/cliente/cotizaciones"
                  );

                  setOpen(
                    false
                  );
                }}
              />


              <MenuButton
                icon={
                  <FaLaptopCode />
                }
                text="Mis proyectos"
                onClick={() => {
                  navigate(
                    "/cliente/mis-proyectos"
                  );

                  setOpen(
                    false
                  );
                }}
              />


              <MenuButton
                icon={
                  <FaShoppingBag />
                }
                text="Tienda"
                onClick={() => {
                  navigate(
                    "/tienda"
                  );

                  setOpen(
                    false
                  );
                }}
              />


              <MenuButton
                icon={<FaUser />}
                text="Perfil"
                onClick={() => {
                  navigate(
                    "/perfil"
                  );

                  setOpen(
                    false
                  );
                }}
              />

            </div>

          </div>

        </div>

      )}


      {/* ================================================= */}
      {/* MAIN */}
      {/* ================================================= */}

      <main
        className="
          flex-1
          min-w-0

          px-5
          md:px-7
          lg:px-9

          pb-12
          pt-24
          lg:pt-10
        "
      >

        {/* HERO */}

        <section
          className={`
            rounded-[30px]

            border

            p-7

            ${
              modoOscuro
                ? "bg-slate-900 border-slate-800"
                : "bg-white border-sky-100"
            }
          `}
        >

          <p
            className="
              text-xs
              text-sky-500

              uppercase
              tracking-[0.2em]

              font-bold
            "
          >

            Panel del cliente

          </p>


          <h1
            className="
              text-4xl
              md:text-5xl

              font-black

              mt-3
            "
          >

            Bienvenido a

            <span className="text-sky-500">

              {" "}Macro

            </span>

          </h1>


          <p
            className="
              text-slate-500

              text-lg

              mt-4

              max-w-3xl
            "
          >

            Solicita servicios, consulta tus proyectos
            y descubre las últimas novedades de Macro.

          </p>


          <div
            className="
              flex
              flex-wrap
              gap-3

              mt-6
            "
          >

            <button
              onClick={() =>
                navigate(
                  "/crear-cotizacion"
                )
              }
              className="
                bg-sky-500
                text-white

                px-6
                py-3

                rounded-xl

                font-bold

                flex
                items-center
                gap-2
              "
            >

              <FaPlusCircle />

              Solicitar servicio

            </button>


            <button
              onClick={() =>
                navigate(
                  "/cliente/cotizaciones"
                )
              }
              className="
                bg-sky-50

                border
                border-sky-100

                text-sky-600

                px-6
                py-3

                rounded-xl

                font-semibold

                flex
                items-center
                gap-2
              "
            >

              <FaEye />

              Ver solicitudes

            </button>

          </div>

        </section>


        {/* STATS */}

        <section
          className="
            grid
            grid-cols-2
            xl:grid-cols-4

            gap-4

            my-8
          "
        >

          <Stat
            title="Solicitudes"
            value={
              estadisticas.total
            }
            icon={
              <FaClipboardList />
            }
          />


          <Stat
            title="En proceso"
            value={
              estadisticas.enProceso
            }
            icon={<FaClock />}
          />


          <Stat
            title="Proyectos"
            value={
              estadisticas.proyectos
            }
            icon={
              <FaLaptopCode />
            }
          />


          <Stat
            title="Favoritos"
            value={
              estadisticas.favoritos
            }
            icon={<FaHeart />}
          />

        </section>


        {/* PUBLICACIONES */}

        <section className="mb-10">

          <PublicacionesFeed
            modoOscuro={
              modoOscuro
            }
            titulo="Publicaciones de Macro"
            descripcion="Dale Me gusta y participa en las novedades comentando."
          />

        </section>


        {/* TIENDA */}

        <section
          className="
            bg-gradient-to-r
            from-sky-500
            to-blue-600

            rounded-[30px]

            p-7

            text-white
          "
        >

          <FaStore className="text-3xl" />


          <h2
            className="
              text-3xl
              font-black

              mt-4
            "
          >

            Tienda Macro

          </h2>


          <p
            className="
              text-white/80

              mt-2
            "
          >

            Explora productos, tecnología y accesorios.

          </p>


          <button
            onClick={() =>
              navigate(
                "/tienda"
              )
            }
            className="
              mt-5

              bg-white
              text-sky-600

              px-5
              py-3

              rounded-xl

              font-bold

              flex
              items-center
              gap-2
            "
          >

            Explorar tienda

            <FaArrowRight />

          </button>

        </section>

      </main>

    </div>
  );
}


function MenuButton({
  icon,
  text,
  onClick,
  active = false,
  special = false,
  badge = 0,
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={`
        w-full

        px-4
        py-3.5

        rounded-xl

        flex
        items-center
        gap-3

        text-left

        ${
          special
            ? "bg-sky-500 text-white"
            : active
            ? "bg-sky-50 text-sky-600 border border-sky-200"
            : "text-slate-600 hover:bg-sky-50"
        }
      `}
    >

      {icon}


      <span className="font-medium">

        {text}

      </span>


      {badge > 0 && (

        <span
          className="
            ml-auto

            min-w-[22px]
            h-[22px]

            px-1

            bg-red-500
            text-white

            rounded-full

            text-[10px]

            flex
            items-center
            justify-center
          "
        >

          {badge}

        </span>

      )}

    </button>
  );
}


function Stat({
  title,
  value,
  icon,
}) {
  return (
    <div
      className="
        bg-white

        border
        border-sky-100

        rounded-2xl

        p-5
      "
    >

      <div
        className="
          flex
          items-center
          justify-between
        "
      >

        <div>

          <p className="text-sm text-slate-500">

            {title}

          </p>


          <p
            className="
              text-3xl
              font-black

              mt-2
            "
          >

            {value}

          </p>

        </div>


        <div
          className="
            w-12
            h-12

            rounded-xl

            bg-sky-50
            text-sky-500

            flex
            items-center
            justify-center
          "
        >

          {icon}

        </div>

      </div>

    </div>
  );
}


export default MenuCliente;