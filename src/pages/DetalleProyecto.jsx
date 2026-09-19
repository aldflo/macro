import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
  useOutletContext,
  useParams,
} from "react-router-dom";

import {
  auth,
  db,
} from "../firebase.config";

import {
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import {
  onAuthStateChanged,
} from "firebase/auth";

import {
  FaArrowLeft,
  FaArrowRight,
  FaBullhorn,
  FaCamera,
  FaCheckCircle,
  FaCode,
  FaExternalLinkAlt,
  FaGlobe,
  FaHeart,
  FaImages,
  FaLaptopCode,
  FaMobileAlt,
  FaRegHeart,
  FaRocket,
  FaStar,
  FaStore,
  FaTools,
} from "react-icons/fa";


/* ======================================================
   DETALLE PROYECTO - MACRO
====================================================== */

function DetalleProyecto() {
  const {
    modoOscuro = false,
  } =
    useOutletContext() || {};


  const {
    id,
  } =
    useParams();


  const navigate =
    useNavigate();


  /* ======================================================
     ESTADOS
  ====================================================== */

  const [
    proyecto,
    setProyecto,
  ] = useState(null);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    index,
    setIndex,
  ] = useState(0);


  const [
    modalAbierto,
    setModalAbierto,
  ] = useState(false);


  const [
    imagenModal,
    setImagenModal,
  ] = useState("");


  const [
    usuario,
    setUsuario,
  ] = useState(null);


  const [
    esFavorito,
    setEsFavorito,
  ] = useState(false);


  const [
    guardandoFavorito,
    setGuardandoFavorito,
  ] = useState(false);


  const [
    touchStart,
    setTouchStart,
  ] = useState(null);


  const [
    touchEnd,
    setTouchEnd,
  ] = useState(null);


  const minSwipeDistance =
    50;


  /* ======================================================
     CARGAR PROYECTO
  ====================================================== */

  useEffect(() => {
    const cargarProyecto =
      async () => {
        if (!id) {
          setProyecto(
            null
          );

          setLoading(
            false
          );

          return;
        }


        try {
          setLoading(
            true
          );


          const ref =
            doc(
              db,
              "proyectos",
              id
            );


          const snap =
            await getDoc(
              ref
            );


          if (
            snap.exists()
          ) {
            setProyecto({
              id:
                snap.id,

              ...snap.data(),
            });

          } else {
            setProyecto(
              null
            );
          }

        } catch (error) {
          console.error(
            "Error cargando proyecto:",
            error
          );


          setProyecto(
            null
          );

        } finally {
          setLoading(
            false
          );
        }
      };


    cargarProyecto();

  }, [
    id,
  ]);


  /* ======================================================
     SESIÓN
  ====================================================== */

  useEffect(() => {
    const unsub =
      onAuthStateChanged(
        auth,
        (user) => {
          setUsuario(
            user || null
          );


          if (!user) {
            setEsFavorito(
              false
            );
          }
        }
      );


    return () =>
      unsub();

  }, []);


  /* ======================================================
     IMÁGENES
  ====================================================== */

  const imagenes =
    useMemo(() => {
      if (!proyecto) {
        return [];
      }


      return [
        ...new Set(
          [
            proyecto.imagen,

            ...(
              Array.isArray(
                proyecto.imagenes
              )
                ? proyecto.imagenes
                : []
            ),
          ].filter(
            Boolean
          )
        ),
      ];

    }, [
      proyecto,
    ]);


  const galeria =
    useMemo(() => {
      if (!proyecto) {
        return [];
      }


      return [
        ...new Set(
          (
            Array.isArray(
              proyecto.galeria
            )
              ? proyecto.galeria
              : []
          ).filter(
            Boolean
          )
        ),
      ];

    }, [
      proyecto,
    ]);


  const imagenPrincipal =
    imagenes[
      index
    ] || null;


  /* ======================================================
     FAVORITO
  ====================================================== */

  useEffect(() => {
    if (
      !usuario ||
      !id
    ) {
      setEsFavorito(
        false
      );

      return;
    }


    const comprobar =
      async () => {
        try {
          const favoritoRef =
            doc(
              db,
              "favoritos",
              `${usuario.uid}_${id}`
            );


          const snap =
            await getDoc(
              favoritoRef
            );


          setEsFavorito(
            snap.exists()
          );

        } catch (error) {
          console.error(
            "Error comprobando favorito:",
            error
          );
        }
      };


    comprobar();

  }, [
    usuario,
    id,
  ]);


  /* ======================================================
     URL
  ====================================================== */

  const obtenerUrlProyecto =
    () => {
      if (!proyecto) {
        return "";
      }


      return String(
        proyecto.url ||
        proyecto.urlProyecto ||
        proyecto.enlace ||
        proyecto.sitioWeb ||
        proyecto.link ||
        ""
      ).trim();
    };


  const normalizarUrl =
    (url) => {
      if (!url) {
        return "";
      }


      if (
        /^https?:\/\//i.test(
          url
        )
      ) {
        return url;
      }


      return `https://${url}`;
    };


  const visitarProyecto =
    () => {
      const url =
        obtenerUrlProyecto();


      if (!url) {
        return;
      }


      window.open(
        normalizarUrl(
          url
        ),
        "_blank",
        "noopener,noreferrer"
      );
    };


  /* ======================================================
     TIPO DE PROYECTO
  ====================================================== */

  const obtenerTipo =
    () => {
      return String(
        proyecto?.categoria ||
        proyecto?.tipo ||
        "Proyecto tecnológico"
      );
    };


  const iconoTipo =
    () => {
      const tipo =
        obtenerTipo()
          .toLowerCase();


      if (
        tipo.includes(
          "web"
        ) ||
        tipo.includes(
          "página"
        ) ||
        tipo.includes(
          "pagina"
        )
      ) {
        return <FaGlobe />;
      }


      if (
        tipo.includes(
          "app"
        ) ||
        tipo.includes(
          "móvil"
        ) ||
        tipo.includes(
          "movil"
        )
      ) {
        return <FaMobileAlt />;
      }


      if (
        tipo.includes(
          "cámara"
        ) ||
        tipo.includes(
          "camara"
        ) ||
        tipo.includes(
          "seguridad"
        )
      ) {
        return <FaCamera />;
      }


      if (
        tipo.includes(
          "publicidad"
        ) ||
        tipo.includes(
          "marketing"
        )
      ) {
        return <FaBullhorn />;
      }


      if (
        tipo.includes(
          "software"
        ) ||
        tipo.includes(
          "sistema"
        )
      ) {
        return <FaLaptopCode />;
      }


      return <FaTools />;
    };


  /* ======================================================
     GALERÍA
  ====================================================== */

  const siguienteImagen =
    () => {
      if (
        imagenes.length <=
        1
      ) {
        return;
      }


      setIndex(
        (prev) =>
          (
            prev + 1
          ) %
          imagenes.length
      );
    };


  const anteriorImagen =
    () => {
      if (
        imagenes.length <=
        1
      ) {
        return;
      }


      setIndex(
        (prev) =>
          prev === 0
            ? imagenes.length -
              1
            : prev - 1
      );
    };


  /* ======================================================
     SWIPE
  ====================================================== */

  const onTouchStart =
    (e) => {
      setTouchEnd(
        null
      );


      setTouchStart(
        e.targetTouches[0]
          .clientX
      );
    };


  const onTouchMove =
    (e) => {
      setTouchEnd(
        e.targetTouches[0]
          .clientX
      );
    };


  const onTouchEnd =
    () => {
      if (
        touchStart ===
          null ||
        touchEnd ===
          null
      ) {
        return;
      }


      const distance =
        touchStart -
        touchEnd;


      if (
        distance >
        minSwipeDistance
      ) {
        siguienteImagen();
      }


      if (
        distance <
        -minSwipeDistance
      ) {
        anteriorImagen();
      }


      setTouchStart(
        null
      );


      setTouchEnd(
        null
      );
    };


  /* ======================================================
     MODAL
  ====================================================== */

  const abrirImagen =
    (imagen) => {
      if (!imagen) {
        return;
      }


      setImagenModal(
        imagen
      );


      setModalAbierto(
        true
      );
    };


  /* ======================================================
     FAVORITOS
  ====================================================== */

  const toggleFavorito =
    async () => {
      if (!usuario) {
        navigate(
          "/login",
          {
            state: {
              mensaje:
                "Inicia sesión para guardar proyectos en favoritos.",
            },
          }
        );

        return;
      }


      const documentoId =
        `${usuario.uid}_${proyecto.id}`;


      const favoritoRef =
        doc(
          db,
          "favoritos",
          documentoId
        );


      try {
        setGuardandoFavorito(
          true
        );


        if (
          esFavorito
        ) {
          await deleteDoc(
            favoritoRef
          );


          setEsFavorito(
            false
          );


          return;
        }


        await setDoc(
          favoritoRef,
          {
            uid:
              usuario.uid,

            usuario:
              usuario.email ||
              "",

            proyectoId:
              proyecto.id,

            id:
              proyecto.id,

            titulo:
              proyecto.nombre ||
              "",

            nombre:
              proyecto.nombre ||
              "",

            imagen:
              imagenes[0] ||
              "",

            imagenes,

            categoria:
              proyecto.categoria ||
              proyecto.tipo ||
              "",

            descripcion:
              proyecto.descripcion ||
              "",

            url:
              obtenerUrlProyecto(),

            fechaGuardado:
              serverTimestamp(),
          }
        );


        setEsFavorito(
          true
        );

      } catch (error) {
        console.error(
          "Error actualizando favorito:",
          error
        );


        alert(
          "No se pudo actualizar el favorito."
        );

      } finally {
        setGuardandoFavorito(
          false
        );
      }
    };


  /* ======================================================
     SOLICITAR SERVICIO SIMILAR
  ====================================================== */

  const solicitarProyecto =
    () => {
      const proyectoReferencia = {
        ...proyecto,

        id:
          proyecto.id,

        proyectoReferenciaId:
          proyecto.id,

        proyectoReferenciaNombre:
          proyecto.nombre ||
          "",

        proyectoReferenciaCategoria:
          proyecto.categoria ||
          proyecto.tipo ||
          "",
      };


      if (!usuario) {
        navigate(
          "/login",
          {
            state: {
              mensaje:
                "Inicia sesión para solicitar un proyecto similar.",

              proyectoPendiente:
                proyectoReferencia,
            },
          }
        );

        return;
      }


      navigate(
        "/crear-cotizacion",
        {
          state: {
            proyecto:
              proyectoReferencia,
          },
        }
      );
    };


  /* ======================================================
     LOADING
  ====================================================== */

  if (loading) {
    return (
      <div
        className={`
          min-h-[70vh]

          flex
          items-center
          justify-center

          ${
            modoOscuro
              ? "bg-slate-950 text-white"
              : "bg-[#f5fbff] text-slate-900"
          }
        `}
      >

        <div className="text-center">

          <div
            className="
              w-12
              h-12

              border-4
              border-sky-100
              border-t-sky-500

              rounded-full

              animate-spin

              mx-auto
            "
          />


          <p className="text-slate-500 mt-4">

            Cargando proyecto...

          </p>

        </div>

      </div>
    );
  }


  /* ======================================================
     NO ENCONTRADO
  ====================================================== */

  if (!proyecto) {
    return (
      <div
        className={`
          min-h-[70vh]

          flex
          items-center
          justify-center

          px-5

          ${
            modoOscuro
              ? "bg-slate-950 text-white"
              : "bg-[#f5fbff] text-slate-900"
          }
        `}
      >

        <div className="text-center">

          <div
            className="
              w-16
              h-16

              rounded-2xl

              bg-sky-50
              text-sky-500

              flex
              items-center
              justify-center

              mx-auto

              text-2xl
            "
          >

            <FaLaptopCode />

          </div>


          <h1
            className="
              text-3xl
              font-black

              mt-5
            "
          >

            Proyecto no encontrado

          </h1>


          <p className="text-slate-500 mt-2">

            El proyecto que buscas ya no está disponible.

          </p>


          <button
            type="button"
            onClick={() =>
              navigate(
                "/proyectos"
              )
            }
            className="
              mt-6

              bg-sky-500
              hover:bg-sky-600

              text-white

              px-6
              py-3

              rounded-xl

              font-bold
            "
          >

            Volver a proyectos

          </button>

        </div>

      </div>
    );
  }


  /* ======================================================
     RENDER
  ====================================================== */

  const urlProyecto =
    obtenerUrlProyecto();


  return (
    <div
      className={`
        min-h-screen

        ${
          modoOscuro
            ? "bg-slate-950 text-white"
            : "bg-[#f5fbff] text-slate-900"
        }
      `}
    >

      {/* ================================================= */}
      {/* BARRA SUPERIOR */}
      {/* ================================================= */}

      <div
        className={`
          border-b

          ${
            modoOscuro
              ? "bg-slate-950 border-slate-800"
              : "bg-white border-sky-100"
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
            items-center
            justify-between

            gap-4
          "
        >

          <button
            type="button"
            onClick={() =>
              navigate(-1)
            }
            className="
              flex
              items-center
              gap-2

              text-slate-500

              hover:text-sky-500

              transition
            "
          >

            <FaArrowLeft />

            Volver

          </button>


          <div
            className="
              flex
              items-center
              gap-3

              min-w-0
            "
          >

            <div
              className="
                w-9
                h-9

                rounded-xl

                bg-sky-500
                text-white

                flex
                items-center
                justify-center

                shrink-0
              "
            >

              <FaCode />

            </div>


            <p
              className="
                font-bold

                truncate
              "
            >

              {proyecto.nombre}

            </p>

          </div>

        </div>

      </div>


      {/* ================================================= */}
      {/* HERO DETALLE */}
      {/* ================================================= */}

      <section
        className="
          max-w-7xl
          mx-auto

          px-5
          md:px-8

          pt-10
          pb-8
        "
      >

        <div
          className="
            flex
            flex-col

            lg:flex-row
            lg:items-end
            lg:justify-between

            gap-6
          "
        >

          <div>

            <div
              className="
                flex
                flex-wrap
                items-center

                gap-2
              "
            >

              <span
                className="
                  inline-flex
                  items-center
                  gap-2

                  px-4
                  py-2

                  rounded-full

                  bg-sky-50
                  border
                  border-sky-100

                  text-sky-600

                  text-xs
                  font-bold

                  uppercase
                  tracking-[0.18em]
                "
              >

                {iconoTipo()}

                {obtenerTipo()}

              </span>


              {proyecto.destacado && (

                <span
                  className="
                    inline-flex
                    items-center
                    gap-2

                    px-4
                    py-2

                    rounded-full

                    bg-amber-50
                    border
                    border-amber-100

                    text-amber-600

                    text-xs
                    font-bold
                  "
                >

                  <FaStar />

                  Destacado

                </span>

              )}


              {proyecto.estado && (

                <span
                  className="
                    inline-flex
                    items-center
                    gap-2

                    px-4
                    py-2

                    rounded-full

                    bg-emerald-50
                    border
                    border-emerald-100

                    text-emerald-600

                    text-xs
                    font-bold
                  "
                >

                  <FaCheckCircle />

                  {proyecto.estado}

                </span>

              )}

            </div>


            <p
              className="
                text-xs
                uppercase
                tracking-[0.25em]

                text-sky-500

                font-bold

                mt-7
              "
            >

              Portafolio Macro

            </p>


            <h1
              className="
                text-4xl
                md:text-6xl

                font-black

                tracking-tight
                leading-[1.04]

                mt-3

                max-w-4xl
              "
            >

              {proyecto.nombre}

            </h1>


            {proyecto.descripcion && (

              <p
                className="
                  text-slate-500

                  text-base
                  md:text-lg

                  leading-relaxed

                  max-w-3xl

                  mt-5

                  whitespace-pre-line
                "
              >

                {proyecto.descripcion}

              </p>

            )}

          </div>


          {/* FAVORITO */}

          <button
            type="button"
            onClick={
              toggleFavorito
            }
            disabled={
              guardandoFavorito
            }
            className={`
              px-5
              py-3.5

              rounded-xl

              border

              font-semibold

              flex
              items-center
              justify-center
              gap-2

              shrink-0

              transition

              ${
                esFavorito
                  ? `
                    bg-pink-50
                    border-pink-200
                    text-pink-500
                  `
                  : modoOscuro
                  ? `
                    bg-slate-900
                    border-slate-700
                    text-slate-300

                    hover:border-pink-400
                    hover:text-pink-400
                  `
                  : `
                    bg-white
                    border-sky-100
                    text-slate-600

                    hover:border-pink-200
                    hover:text-pink-500
                  `
              }
            `}
          >

            {esFavorito
              ? <FaHeart />
              : <FaRegHeart />
            }


            {esFavorito
              ? "Guardado"
              : "Guardar"
            }

          </button>

        </div>

      </section>


      {/* ================================================= */}
      {/* CONTENIDO */}
      {/* ================================================= */}

      <main
        className="
          max-w-7xl
          mx-auto

          px-5
          md:px-8

          pb-16

          grid
          lg:grid-cols-[1.2fr_0.8fr]

          gap-7
          lg:gap-10
        "
      >

        {/* ================================================= */}
        {/* IMÁGENES */}
        {/* ================================================= */}

        <div className="min-w-0">

          <div
            className={`
              relative

              overflow-hidden

              rounded-[30px]

              border

              min-h-[380px]
              md:min-h-[550px]

              flex
              items-center
              justify-center

              ${
                modoOscuro
                  ? "bg-slate-900 border-slate-800"
                  : "bg-white border-sky-100 shadow-sm"
              }
            `}
            onTouchStart={
              onTouchStart
            }
            onTouchMove={
              onTouchMove
            }
            onTouchEnd={
              onTouchEnd
            }
          >

            {imagenPrincipal ? (

              <img
                src={
                  imagenPrincipal
                }
                alt={
                  proyecto.nombre
                }
                onClick={() =>
                  abrirImagen(
                    imagenPrincipal
                  )
                }
                draggable={
                  false
                }
                className="
                  w-full

                  h-[430px]
                  md:h-[590px]

                  object-contain

                  p-3
                  md:p-5

                  cursor-zoom-in

                  select-none
                "
              />

            ) : (

              <div
                className="
                  flex
                  flex-col
                  items-center

                  gap-3

                  text-slate-400
                "
              >

                <FaImages
                  size={42}
                />


                <p>

                  Sin imágenes

                </p>

              </div>

            )}


            {/* FLECHAS */}

            {imagenes.length >
              1 && (

              <>

                <button
                  type="button"
                  onClick={
                    anteriorImagen
                  }
                  className="
                    hidden
                    md:flex

                    absolute
                    left-5
                    top-1/2

                    -translate-y-1/2

                    w-12
                    h-12

                    rounded-full

                    bg-slate-950/70
                    hover:bg-slate-950

                    text-white

                    items-center
                    justify-center

                    text-xl

                    backdrop-blur-md
                  "
                >

                  ❮

                </button>


                <button
                  type="button"
                  onClick={
                    siguienteImagen
                  }
                  className="
                    hidden
                    md:flex

                    absolute
                    right-5
                    top-1/2

                    -translate-y-1/2

                    w-12
                    h-12

                    rounded-full

                    bg-slate-950/70
                    hover:bg-slate-950

                    text-white

                    items-center
                    justify-center

                    text-xl

                    backdrop-blur-md
                  "
                >

                  ❯

                </button>

              </>

            )}


            {/* CONTADOR */}

            {imagenes.length >
              1 && (

              <span
                className="
                  absolute
                  right-4
                  bottom-4

                  px-3
                  py-1.5

                  rounded-full

                  bg-slate-950/75

                  text-white

                  text-xs

                  backdrop-blur-md
                "
              >

                {index + 1}

                {" / "}

                {imagenes.length}

              </span>

            )}

          </div>


          {/* MINIATURAS */}

          {imagenes.length >
            1 && (

            <div
              className="
                flex
                gap-3

                overflow-x-auto

                py-4
              "
            >

              {imagenes.map(
                (
                  imagen,
                  indice
                ) => (

                  <button
                    type="button"
                    key={`${imagen}-${indice}`}
                    onClick={() =>
                      setIndex(
                        indice
                      )
                    }
                    className={`
                      shrink-0

                      rounded-xl

                      overflow-hidden

                      border-2

                      transition

                      ${
                        indice ===
                        index
                          ? "border-sky-500"
                          : modoOscuro
                          ? "border-slate-800 opacity-60 hover:opacity-100"
                          : "border-sky-100 opacity-60 hover:opacity-100"
                      }
                    `}
                  >

                    <img
                      src={
                        imagen
                      }
                      alt={`${proyecto.nombre} ${indice + 1}`}
                      className="
                        w-24
                        h-20

                        object-cover
                      "
                    />

                  </button>

                )
              )}

            </div>

          )}

        </div>


        {/* ================================================= */}
        {/* PANEL INFORMACIÓN */}
        {/* ================================================= */}

        <aside className="space-y-5">

          {/* ACCIONES */}

          <div
            className={`
              rounded-[28px]

              border

              p-6

              ${
                modoOscuro
                  ? "bg-slate-900 border-slate-800"
                  : "bg-white border-sky-100 shadow-sm"
              }
            `}
          >

            <div
              className="
                w-12
                h-12

                rounded-2xl

                bg-sky-50
                text-sky-500

                flex
                items-center
                justify-center

                text-xl
              "
            >

              <FaRocket />

            </div>


            <h2
              className="
                text-2xl
                font-black

                mt-5
              "
            >

              ¿Te interesa algo similar?

            </h2>


            <p
              className="
                text-sm
                text-slate-500

                leading-relaxed

                mt-2
              "
            >

              Podemos tomar este proyecto como referencia y
              preparar una solución personalizada para ti.

            </p>


            <button
              type="button"
              onClick={
                solicitarProyecto
              }
              className="
                w-full

                mt-6

                px-5
                py-4

                rounded-xl

                bg-sky-500
                hover:bg-sky-600

                text-white

                font-bold

                flex
                items-center
                justify-center
                gap-3

                transition
              "
            >

              <FaRocket />


              {usuario
                ? "Solicitar proyecto similar"
                : "Iniciar sesión para solicitar"
              }


              <FaArrowRight />

            </button>


            {urlProyecto && (

              <button
                type="button"
                onClick={
                  visitarProyecto
                }
                className={`
                  w-full

                  mt-3

                  px-5
                  py-4

                  rounded-xl

                  border

                  font-bold

                  flex
                  items-center
                  justify-center
                  gap-3

                  transition

                  ${
                    modoOscuro
                      ? `
                        bg-slate-950
                        border-slate-700
                        text-sky-400

                        hover:border-sky-500
                      `
                      : `
                        bg-sky-50
                        border-sky-200
                        text-sky-600

                        hover:bg-sky-100
                      `
                  }
                `}
              >

                <FaGlobe />

                Visitar proyecto

                <FaExternalLinkAlt
                  size={12}
                />

              </button>

            )}

          </div>


          {/* DETALLES */}

          <div
            className={`
              rounded-[28px]

              border

              p-6

              ${
                modoOscuro
                  ? "bg-slate-900 border-slate-800"
                  : "bg-white border-sky-100 shadow-sm"
              }
            `}
          >

            <p
              className="
                text-xs
                uppercase
                tracking-[0.2em]

                text-sky-500

                font-bold
              "
            >

              Información

            </p>


            <h3
              className="
                text-xl
                font-black

                mt-2
                mb-5
              "
            >

              Detalles del proyecto

            </h3>


            <div className="space-y-4">

              <DetalleDato
                icon={
                  iconoTipo()
                }
                label="Tipo"
                value={
                  obtenerTipo()
                }
                modoOscuro={
                  modoOscuro
                }
              />


              {proyecto.estado && (

                <DetalleDato
                  icon={
                    <FaCheckCircle />
                  }
                  label="Estado"
                  value={
                    proyecto.estado
                  }
                  modoOscuro={
                    modoOscuro
                  }
                />

              )}


              {proyecto.plataforma && (

                <DetalleDato
                  icon={
                    <FaMobileAlt />
                  }
                  label="Plataforma"
                  value={
                    proyecto.plataforma
                  }
                  modoOscuro={
                    modoOscuro
                  }
                />

              )}


              {proyecto.clienteNombre && (

                <DetalleDato
                  icon={
                    <FaStore />
                  }
                  label="Cliente"
                  value={
                    proyecto.clienteNombre
                  }
                  modoOscuro={
                    modoOscuro
                  }
                />

              )}

            </div>

          </div>


          {/* TECNOLOGÍAS */}

          {Array.isArray(
            proyecto.tecnologias
          ) &&
            proyecto
              .tecnologias
              .length >
              0 && (

            <div
              className={`
                rounded-[28px]

                border

                p-6

                ${
                  modoOscuro
                    ? "bg-slate-900 border-slate-800"
                    : "bg-white border-sky-100 shadow-sm"
                }
              `}
            >

              <p
                className="
                  text-xs
                  uppercase
                  tracking-[0.2em]

                  text-sky-500

                  font-bold
                "
              >

                Tecnología

              </p>


              <h3
                className="
                  text-xl
                  font-black

                  mt-2
                "
              >

                Tecnologías utilizadas

              </h3>


              <div
                className="
                  flex
                  flex-wrap

                  gap-2

                  mt-5
                "
              >

                {proyecto
                  .tecnologias
                  .map(
                    (
                      tecnologia
                    ) => (

                      <span
                        key={
                          tecnologia
                        }
                        className={`
                          px-3
                          py-2

                          rounded-xl

                          border

                          text-sm
                          font-semibold

                          ${
                            modoOscuro
                              ? `
                                bg-slate-950
                                border-slate-700
                                text-sky-400
                              `
                              : `
                                bg-sky-50
                                border-sky-100
                                text-sky-600
                              `
                          }
                        `}
                      >

                        {tecnologia}

                      </span>

                    )
                  )}

              </div>

            </div>

          )}

        </aside>

      </main>


      {/* ================================================= */}
      {/* GALERÍA PROPIA DEL PROYECTO */}
      {/* ================================================= */}

      {galeria.length >
        0 && (

        <section
          className="
            max-w-7xl
            mx-auto

            px-5
            md:px-8

            pb-20
          "
        >

          <div className="mb-7">

            <div
              className="
                flex
                items-center
                gap-2

                text-sky-500
              "
            >

              <FaImages />


              <p
                className="
                  text-xs
                  uppercase
                  tracking-[0.22em]

                  font-bold
                "
              >

                Galería

              </p>

            </div>


            <h2
              className="
                text-3xl
                md:text-4xl

                font-black

                mt-2
              "
            >

              Más imágenes del proyecto

            </h2>


            <p
              className="
                text-slate-500

                mt-2
              "
            >

              Explora capturas, fotografías y referencias
              adicionales de este trabajo.

            </p>

          </div>


          <div
            className="
              grid
              grid-cols-2
              lg:grid-cols-4

              gap-4
            "
          >

            {galeria.map(
              (
                imagen,
                indice
              ) => (

                <button
                  type="button"
                  key={`${imagen}-${indice}`}
                  onClick={() =>
                    abrirImagen(
                      imagen
                    )
                  }
                  className={`
                    group

                    relative

                    overflow-hidden

                    rounded-2xl

                    border

                    aspect-[4/3]

                    ${
                      modoOscuro
                        ? "bg-slate-900 border-slate-800"
                        : "bg-white border-sky-100"
                    }
                  `}
                >

                  <img
                    src={
                      imagen
                    }
                    alt={`Galería ${indice + 1}`}
                    loading="lazy"
                    className="
                      w-full
                      h-full

                      object-cover

                      transition-transform
                      duration-500

                      group-hover:scale-105
                    "
                  />


                  <div
                    className="
                      absolute
                      inset-0

                      bg-gradient-to-t
                      from-slate-950/60
                      to-transparent

                      opacity-0
                      group-hover:opacity-100

                      transition
                    "
                  />


                  <span
                    className="
                      absolute
                      bottom-3
                      right-3

                      w-9
                      h-9

                      rounded-xl

                      bg-white/90

                      text-sky-500

                      flex
                      items-center
                      justify-center

                      opacity-0
                      group-hover:opacity-100

                      transition
                    "
                  >

                    <FaImages />

                  </span>

                </button>

              )
            )}

          </div>

        </section>

      )}


      {/* ================================================= */}
      {/* CTA FINAL */}
      {/* ================================================= */}

      <section
        className="
          max-w-7xl
          mx-auto

          px-5
          md:px-8

          pb-20
        "
      >

        <div
          className="
            relative
            overflow-hidden

            rounded-[34px]

            bg-gradient-to-r
            from-sky-500
            to-blue-600

            text-white

            p-8
            md:p-12
          "
        >

          <div
            className="
              absolute
              -right-20
              -top-20

              w-72
              h-72

              rounded-full

              bg-white/10
            "
          />


          <div className="relative z-10">

            <FaCode className="text-3xl" />


            <h2
              className="
                text-3xl
                md:text-5xl

                font-black

                mt-5
              "
            >

              Convierte tu idea en
              el próximo proyecto Macro.

            </h2>


            <p
              className="
                max-w-2xl

                text-white/85

                text-lg

                mt-4

                leading-relaxed
              "
            >

              Desde una página web hasta una aplicación,
              instalación de cámaras, publicidad o software
              personalizado.

            </p>


            <button
              type="button"
              onClick={
                solicitarProyecto
              }
              className="
                mt-7

                bg-white
                text-sky-600

                hover:bg-sky-50

                px-6
                py-4

                rounded-xl

                font-bold

                flex
                items-center
                gap-3
              "
            >

              Solicitar servicio

              <FaArrowRight />

            </button>

          </div>

        </div>

      </section>


      {/* ================================================= */}
      {/* MODAL IMAGEN */}
      {/* ================================================= */}

      {modalAbierto &&
        imagenModal && (

        <div
          onClick={() =>
            setModalAbierto(
              false
            )
          }
          className="
            fixed
            inset-0

            z-[200]

            bg-slate-950/95
            backdrop-blur-md

            flex
            items-center
            justify-center

            p-4
            md:p-8

            cursor-zoom-out
          "
        >

          <img
            src={
              imagenModal
            }
            alt="Vista ampliada"
            onClick={(e) =>
              e.stopPropagation()
            }
            className="
              max-w-full
              max-h-[90vh]

              object-contain

              rounded-2xl
            "
          />


          <button
            type="button"
            onClick={() =>
              setModalAbierto(
                false
              )
            }
            className="
              absolute
              top-5
              right-5

              w-12
              h-12

              rounded-full

              bg-white/10
              hover:bg-white/20

              border
              border-white/10

              text-white

              text-3xl

              flex
              items-center
              justify-center
            "
          >

            ×

          </button>

        </div>

      )}

    </div>
  );
}


/* ======================================================
   DETALLE DATO
====================================================== */

function DetalleDato({
  icon,
  label,
  value,
  modoOscuro,
}) {
  return (
    <div
      className={`
        rounded-2xl

        border

        p-4

        flex
        items-center
        gap-4

        ${
          modoOscuro
            ? `
              bg-slate-950
              border-slate-700
            `
            : `
              bg-sky-50
              border-sky-100
            `
        }
      `}
    >

      <div
        className="
          w-10
          h-10

          rounded-xl

          bg-white

          text-sky-500

          flex
          items-center
          justify-center

          shrink-0
        "
      >

        {icon}

      </div>


      <div className="min-w-0">

        <p
          className="
            text-[11px]

            uppercase
            tracking-[0.15em]

            text-slate-400

            font-semibold
          "
        >

          {label}

        </p>


        <p
          className="
            font-semibold

            mt-1

            truncate
          "
        >

          {value}

        </p>

      </div>

    </div>
  );
}


export default DetalleProyecto;