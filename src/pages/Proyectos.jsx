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
  auth,
  db,
} from "../firebase.config";

import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";

import {
  onAuthStateChanged,
} from "firebase/auth";

import {
  FaArrowRight,
  FaCamera,
  FaClock,
  FaCode,
  FaExternalLinkAlt,
  FaFileInvoiceDollar,
  FaGlobe,
  FaHeart,
  FaImages,
  FaLayerGroup,
  FaLaptopCode,
  FaRegHeart,
  FaRocket,
  FaSearch,
  FaStar,
  FaTimes,
} from "react-icons/fa";


function Proyectos() {
  const navigate =
    useNavigate();


  const {
    modoOscuro = false,
  } =
    useOutletContext() || {};


  /* ======================================================
     PROYECTOS
  ====================================================== */

  const [
    proyectos,
    setProyectos,
  ] = useState([]);


  const [
    cargando,
    setCargando,
  ] = useState(true);


  /* ======================================================
     FILTROS
  ====================================================== */

  const [
    busqueda,
    setBusqueda,
  ] = useState("");


  const [
    categoria,
    setCategoria,
  ] = useState("Todos");


  /* ======================================================
     USUARIO
  ====================================================== */

  const [
    usuario,
    setUsuario,
  ] = useState(null);


  /* ======================================================
     FAVORITOS
  ====================================================== */

  const [
    favoritos,
    setFavoritos,
  ] = useState([]);


  const [
    guardandoFavorito,
    setGuardandoFavorito,
  ] = useState(null);


  /* ======================================================
     MODAL LOGIN
  ====================================================== */

  const [
    mostrarLoginModal,
    setMostrarLoginModal,
  ] = useState(false);


  /* ======================================================
     NORMALIZAR IMÁGENES
  ====================================================== */

  const obtenerImagenesProyecto =
    (proyecto) => {
      if (!proyecto) {
        return [];
      }


      const lista =
        [];


      if (
        Array.isArray(
          proyecto.imagenes
        )
      ) {
        proyecto.imagenes.forEach(
          (item) => {
            if (
              typeof item ===
                "string" &&
              item.trim()
            ) {
              lista.push(
                item.trim()
              );

              return;
            }


            if (
              item &&
              typeof item ===
                "object"
            ) {
              const url =
                item.url ||
                item.secure_url ||
                item.src ||
                item.imagen;


              if (url) {
                lista.push(
                  url
                );
              }
            }
          }
        );
      }


      if (
        proyecto.imagen &&
        typeof proyecto.imagen ===
          "string"
      ) {
        lista.push(
          proyecto.imagen
        );
      }


      return [
        ...new Set(
          lista.filter(
            Boolean
          )
        ),
      ];
    };


  /* ======================================================
     PORTADA
  ====================================================== */

  const obtenerPortada =
    (proyecto) => {
      const imagenes =
        obtenerImagenesProyecto(
          proyecto
        );


      return (
        imagenes[0] ||
        ""
      );
    };


  /* ======================================================
     URL PROYECTO
  ====================================================== */

  const obtenerUrlProyecto =
    (proyecto) => {
      return String(
        proyecto?.url ||
        proyecto?.urlProyecto ||
        proyecto?.enlace ||
        proyecto?.sitioWeb ||
        proyecto?.link ||
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
    (
      e,
      proyecto
    ) => {
      e.stopPropagation();


      const url =
        obtenerUrlProyecto(
          proyecto
        );


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
     LOGIN
  ====================================================== */

  useEffect(() => {
    const unsub =
      onAuthStateChanged(
        auth,
        (user) => {
          setUsuario(
            user || null
          );
        }
      );


    return () =>
      unsub();

  }, []);


  /* ======================================================
     CARGAR PROYECTOS
  ====================================================== */

  useEffect(() => {
    const q =
      query(
        collection(
          db,
          "proyectos"
        ),

        orderBy(
          "fecha",
          "desc"
        )
      );


    const unsub =
      onSnapshot(
        q,

        (snap) => {
          const data =
            snap.docs.map(
              (documento) => ({
                id:
                  documento.id,

                ...documento.data(),
              })
            );


          setProyectos(
            data
          );


          setCargando(
            false
          );
        },

        (error) => {
          console.error(
            "Error cargando proyectos:",
            error
          );


          setCargando(
            false
          );
        }
      );


    return () =>
      unsub();

  }, []);


  /* ======================================================
     FAVORITOS
  ====================================================== */

  useEffect(() => {
    if (!usuario) {
      setFavoritos(
        []
      );

      return;
    }


    const q =
      query(
        collection(
          db,
          "favoritos"
        ),

        where(
          "uid",
          "==",
          usuario.uid
        )
      );


    const unsub =
      onSnapshot(
        q,

        (snap) => {
          const data =
            snap.docs.map(
              (documento) => ({
                firebaseId:
                  documento.id,

                ...documento.data(),
              })
            );


          setFavoritos(
            data
          );
        },

        (error) => {
          console.error(
            "Error cargando favoritos:",
            error
          );


          setFavoritos(
            []
          );
        }
      );


    return () =>
      unsub();

  }, [
    usuario,
  ]);


  /* ======================================================
     CATEGORÍAS
  ====================================================== */

  const categorias =
    useMemo(() => {
      const encontradas =
        proyectos
          .map(
            (proyecto) =>
              proyecto.categoria ||
              proyecto.tipo
          )
          .filter(
            Boolean
          );


      return [
        "Todos",

        ...Array.from(
          new Set(
            encontradas
          )
        ).sort(
          (a, b) =>
            a.localeCompare(
              b,
              "es"
            )
        ),
      ];

    }, [
      proyectos,
    ]);


  /* ======================================================
     BUSCADOR
  ====================================================== */

  const filtrados =
    useMemo(() => {
      const texto =
        busqueda
          .trim()
          .toLowerCase();


      return proyectos.filter(
        (proyecto) => {
          const contenido =
            [
              proyecto.nombre,
              proyecto.descripcion,
              proyecto.categoria,
              proyecto.tipo,
              proyecto.ubicacion,
              ...(Array.isArray(
                proyecto.tecnologias
              )
                ? proyecto.tecnologias
                : []),
            ]
              .filter(
                Boolean
              )
              .join(" ")
              .toLowerCase();


          const coincideBusqueda =
            !texto ||
            contenido.includes(
              texto
            );


          const categoriaProyecto =
            proyecto.categoria ||
            proyecto.tipo ||
            "";


          const coincideCategoria =
            categoria ===
              "Todos" ||
            categoriaProyecto ===
              categoria;


          return (
            coincideBusqueda &&
            coincideCategoria
          );
        }
      );

    }, [
      proyectos,
      busqueda,
      categoria,
    ]);


  /* ======================================================
     FAVORITO
  ====================================================== */

  const toggleFavorito =
    async (proyecto) => {
      if (!usuario) {
        setMostrarLoginModal(
          true
        );

        return;
      }


      const yaExiste =
        favoritos.some(
          (favorito) =>
            favorito.proyectoId ===
              proyecto.id ||
            favorito.id ===
              proyecto.id
        );


      const documentoId =
        `${usuario.uid}_${proyecto.id}`;


      try {
        setGuardandoFavorito(
          proyecto.id
        );


        if (yaExiste) {
          await deleteDoc(
            doc(
              db,
              "favoritos",
              documentoId
            )
          );


          return;
        }


        const imagenesProyecto =
          obtenerImagenesProyecto(
            proyecto
          );


        await setDoc(
          doc(
            db,
            "favoritos",
            documentoId
          ),
          {
            uid:
              usuario.uid,

            usuario:
              usuario.email ||
              null,

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
              imagenesProyecto[0] ||
              "",

            imagenes:
              imagenesProyecto,

            categoria:
              proyecto.categoria ||
              proyecto.tipo ||
              "",

            descripcion:
              proyecto.descripcion ||
              "",

            url:
              obtenerUrlProyecto(
                proyecto
              ),

            fechaGuardado:
              serverTimestamp(),
          }
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
          null
        );
      }
    };


  /* ======================================================
     VER PROYECTO
  ====================================================== */

  const verProyecto =
    (proyecto) => {
      navigate(
        `/proyecto/${proyecto.id}`
      );
    };


  /* ======================================================
     SOLICITAR SERVICIO
  ====================================================== */

  const solicitarCotizacion =
    (
      e,
      proyecto
    ) => {
      e.stopPropagation();


      if (!usuario) {
        setMostrarLoginModal(
          true
        );

        return;
      }


      const imagenesProyecto =
        obtenerImagenesProyecto(
          proyecto
        );


      navigate(
        "/crear-cotizacion",
        {
          state: {
            proyecto: {
              ...proyecto,

              id:
                proyecto.id,

              nombre:
                proyecto.nombre ||
                "",

              descripcion:
                proyecto.descripcion ||
                "",

              categoria:
                proyecto.categoria ||
                proyecto.tipo ||
                "",

              ubicacion:
                proyecto.ubicacion ||
                "",

              imagen:
                imagenesProyecto[0] ||
                proyecto.imagen ||
                "",

              imagenes:
                imagenesProyecto,
            },
          },
        }
      );
    };


  /* ======================================================
     NUEVO
  ====================================================== */

  const esNuevo =
    (proyecto) => {
      const fechaBase =
        proyecto
          .fechaActualizacion
          ?.toDate
          ? proyecto
              .fechaActualizacion
              .toDate()
          : proyecto
              .fecha
              ?.toDate
          ? proyecto.fecha.toDate()
          : proyecto
              .fechaCreacion
              ?.toDate
          ? proyecto
              .fechaCreacion
              .toDate()
          : null;


      if (!fechaBase) {
        return false;
      }


      const ahora =
        new Date();


      const diferencia =
        ahora.getTime() -
        fechaBase.getTime();


      const horas24 =
        24 *
        60 *
        60 *
        1000;


      return (
        diferencia >=
          0 &&
        diferencia <=
          horas24
      );
    };


  /* ======================================================
     FECHA
  ====================================================== */

  const obtenerFecha =
    (proyecto) => {
      const fecha =
        proyecto.fecha?.toDate
          ? proyecto.fecha.toDate()
          : proyecto
              .fechaActualizacion
              ?.toDate
          ? proyecto
              .fechaActualizacion
              .toDate()
          : proyecto
              .fechaCreacion
              ?.toDate
          ? proyecto
              .fechaCreacion
              .toDate()
          : null;


      if (!fecha) {
        return "";
      }


      return fecha.toLocaleDateString(
        "es-MX",
        {
          month:
            "short",

          year:
            "numeric",
        }
      );
    };


  /* ======================================================
     LIMPIAR
  ====================================================== */

  const limpiarFiltros =
    () => {
      setBusqueda(
        ""
      );


      setCategoria(
        "Todos"
      );
    };


  /* ======================================================
     RENDER
  ====================================================== */

  return (
    <div
      className={`
        min-h-screen

        transition-colors
        duration-300

        ${
          modoOscuro
            ? "bg-[#050b18] text-white"
            : "bg-[#f6f9fc] text-slate-950"
        }
      `}
    >

      {/* ================================================= */}
      {/* HERO */}
      {/* ================================================= */}

      <section
        className="
          relative
          overflow-hidden

          bg-[#071221]

          text-white

          border-b
          border-white/10
        "
      >

        <div
          className="
            absolute
            inset-0

            bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.25),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.16),transparent_40%)]
          "
        />


        <div
          className="
            relative
            z-10

            max-w-7xl
            mx-auto

            px-5
            md:px-8

            py-16
            md:py-20
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
            "
          >

            <div>

              <div
                className="
                  inline-flex
                  items-center
                  gap-2

                  bg-sky-400/10

                  border
                  border-sky-400/20

                  px-4
                  py-2

                  rounded-full

                  text-xs
                  text-sky-300

                  font-bold

                  uppercase
                  tracking-[0.22em]
                "
              >

                <FaCode />

                Portafolio Macro

              </div>


              <h1
                className="
                  text-4xl
                  md:text-6xl

                  font-black

                  tracking-[-0.05em]

                  mt-6
                "
              >

                Proyectos que

                <span
                  className="
                    block

                    bg-gradient-to-r
                    from-cyan-300
                    via-sky-400
                    to-blue-500

                    bg-clip-text
                    text-transparent
                  "
                >

                  convierten ideas en realidad.

                </span>

              </h1>


              <p
                className="
                  max-w-2xl

                  text-slate-300

                  text-lg

                  leading-relaxed

                  mt-5
                "
              >

                Explora páginas web, aplicaciones,
                software, instalaciones, seguridad,
                publicidad y soluciones desarrolladas
                dentro del ecosistema Macro.

              </p>

            </div>


            <div
              className="
                grid
                grid-cols-2

                gap-3

                min-w-[280px]
              "
            >

              <MiniDato
                numero={
                  proyectos.length
                }
                texto="Proyectos"
              />


              <MiniDato
                numero={
                  categorias.length -
                  1
                }
                texto="Categorías"
              />

            </div>

          </div>

        </div>

      </section>


      {/* ================================================= */}
      {/* MAIN */}
      {/* ================================================= */}

      <main
        className="
          max-w-7xl
          mx-auto

          px-5
          md:px-8

          py-12
          md:py-16
        "
      >

        {/* ================================================= */}
        {/* FILTROS */}
        {/* ================================================= */}

        <div
          className={`
            rounded-[26px]

            border

            p-4

            flex
            flex-col

            lg:flex-row

            gap-3

            ${
              modoOscuro
                ? `
                  bg-[#0b1424]
                  border-slate-800
                `
                : `
                  bg-white
                  border-slate-200
                  shadow-sm
                `
            }
          `}
        >

          {/* BUSCADOR */}

          <div
            className="
              relative

              flex-1
            "
          >

            <FaSearch
              className="
                absolute
                left-5
                top-1/2

                -translate-y-1/2

                text-sky-500
              "
            />


            <input
              type="text"
              value={
                busqueda
              }
              onChange={(e) =>
                setBusqueda(
                  e.target.value
                )
              }
              placeholder="Buscar proyecto, tecnología o categoría..."
              className={`
                w-full

                rounded-2xl

                border

                py-4

                pr-12

                outline-none

                transition

                focus:border-sky-400
                focus:ring-4
                focus:ring-sky-500/10

                ${
                  modoOscuro
                    ? `
                      bg-[#071221]
                      border-slate-700
                      text-white
                      placeholder:text-slate-500
                    `
                    : `
                      bg-[#f8fafc]
                      border-slate-200
                      text-slate-900
                      placeholder:text-slate-400
                    `
                }
              `}
              style={{
                paddingLeft:
                  "3.25rem",
              }}
            />


            {busqueda && (

              <button
                type="button"
                onClick={() =>
                  setBusqueda(
                    ""
                  )
                }
                className="
                  absolute
                  right-4
                  top-1/2

                  -translate-y-1/2

                  w-8
                  h-8

                  rounded-full

                  flex
                  items-center
                  justify-center

                  text-slate-400

                  hover:bg-slate-200/40
                "
              >

                <FaTimes />

              </button>

            )}

          </div>


          {/* CATEGORÍA */}

          <select
            value={
              categoria
            }
            onChange={(e) =>
              setCategoria(
                e.target.value
              )
            }
            className={`
              min-w-[230px]

              rounded-2xl

              border

              px-5
              py-4

              outline-none

              focus:border-sky-400

              ${
                modoOscuro
                  ? `
                    bg-[#071221]
                    border-slate-700
                    text-white
                  `
                  : `
                    bg-[#f8fafc]
                    border-slate-200
                    text-slate-900
                  `
              }
            `}
          >

            {categorias.map(
              (cat) => (

                <option
                  key={
                    cat
                  }
                  value={
                    cat
                  }
                >

                  {cat}

                </option>

              )
            )}

          </select>

        </div>


        {/* ================================================= */}
        {/* RESULTADOS */}
        {/* ================================================= */}

        {!cargando &&
          proyectos.length >
            0 && (

          <div
            className="
              flex
              flex-wrap

              items-center
              justify-between

              gap-3

              mt-8
              mb-7
            "
          >

            <p
              className="
                text-sm
                text-slate-500
              "
            >

              Mostrando{" "}

              <strong
                className={
                  modoOscuro
                    ? "text-white"
                    : "text-slate-900"
                }
              >

                {filtrados.length}

              </strong>

              {" "}

              {filtrados.length ===
              1
                ? "proyecto"
                : "proyectos"
              }


              {categoria !==
                "Todos" && (

                <>

                  {" "}en{" "}

                  <span
                    className="
                      text-sky-500
                      font-semibold
                    "
                  >

                    {categoria}

                  </span>

                </>

              )}

            </p>


            {(busqueda ||
              categoria !==
                "Todos") && (

              <button
                type="button"
                onClick={
                  limpiarFiltros
                }
                className="
                  text-sm
                  text-sky-500

                  font-semibold
                "
              >

                Limpiar filtros

              </button>

            )}

          </div>

        )}


        {/* ================================================= */}
        {/* LOADING */}
        {/* ================================================= */}

        {cargando && (

          <div
            className="
              py-24

              text-center
            "
          >

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


            <p
              className="
                text-slate-500

                mt-5
              "
            >

              Cargando proyectos...

            </p>

          </div>

        )}


        {/* ================================================= */}
        {/* SIN PROYECTOS */}
        {/* ================================================= */}

        {!cargando &&
          proyectos.length ===
            0 && (

          <EstadoVacio
            modoOscuro={
              modoOscuro
            }
            icon={
              <FaLayerGroup />
            }
            titulo="Próximamente"
            texto="Estamos preparando el portafolio de proyectos de Macro."
          />

        )}


        {/* ================================================= */}
        {/* SIN RESULTADOS */}
        {/* ================================================= */}

        {!cargando &&
          proyectos.length >
            0 &&
          filtrados.length ===
            0 && (

          <div
            className={`
              rounded-[30px]

              border

              py-20
              px-6

              text-center

              ${
                modoOscuro
                  ? `
                    bg-[#0b1424]
                    border-slate-800
                  `
                  : `
                    bg-white
                    border-slate-200
                  `
              }
            `}
          >

            <div
              className="
                w-16
                h-16

                rounded-2xl

                bg-sky-500/10
                text-sky-500

                flex
                items-center
                justify-center

                mx-auto

                text-2xl
              "
            >

              <FaSearch />

            </div>


            <h2
              className="
                text-2xl
                font-black

                mt-5
              "
            >

              No encontramos proyectos

            </h2>


            <p
              className="
                text-slate-500

                mt-2

                max-w-md
                mx-auto
              "
            >

              Prueba otro término de búsqueda
              o selecciona una categoría diferente.

            </p>


            <button
              type="button"
              onClick={
                limpiarFiltros
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

              Ver todos los proyectos

            </button>

          </div>

        )}


        {/* ================================================= */}
        {/* GRID */}
        {/* ================================================= */}

        {!cargando &&
          filtrados.length >
            0 && (

          <div
            className="
              grid
              grid-cols-1
              md:grid-cols-2
              xl:grid-cols-3

              gap-6

              items-stretch
            "
          >

            {filtrados.map(
              (proyecto) => {
                const isFav =
                  favoritos.some(
                    (favorito) =>
                      favorito.proyectoId ===
                        proyecto.id ||
                      favorito.id ===
                        proyecto.id
                  );


                const nuevo =
                  esNuevo(
                    proyecto
                  );


                const imagenesProyecto =
                  obtenerImagenesProyecto(
                    proyecto
                  );


                const portada =
                  obtenerPortada(
                    proyecto
                  );


                const urlProyecto =
                  obtenerUrlProyecto(
                    proyecto
                  );


                const fecha =
                  obtenerFecha(
                    proyecto
                  );


                return (
                  <article
                    key={
                      proyecto.id
                    }
                    onClick={() =>
                      verProyecto(
                        proyecto
                      )
                    }
                    className={`
                      group

                      h-full

                      flex
                      flex-col

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

                    {/* ================================= */}
                    {/* IMAGEN */}
                    {/* ================================= */}

                    <div
                      className="
                        relative

                        h-[270px]

                        bg-[#071221]

                        overflow-hidden

                        shrink-0
                      "
                    >

                      {portada ? (

                        <img
                          src={
                            portada
                          }
                          alt={
                            proyecto.nombre ||
                            "Proyecto Macro"
                          }
                          loading="lazy"
                          className="
                            w-full
                            h-full

                            object-cover

                            transition-transform
                            duration-700

                            group-hover:scale-[1.04]
                          "
                        />

                      ) : (

                        <div
                          className="
                            w-full
                            h-full

                            flex
                            flex-col
                            items-center
                            justify-center

                            gap-3

                            text-sky-400
                          "
                        >

                          <FaLaptopCode
                            size={45}
                          />


                          <span
                            className="
                              text-sm
                              text-slate-500
                            "
                          >

                            Proyecto Macro

                          </span>

                        </div>

                      )}


                      <div
                        className="
                          absolute
                          inset-0

                          bg-gradient-to-t
                          from-[#071221]/80
                          via-transparent
                          to-black/5

                          pointer-events-none
                        "
                      />


                      {/* ETIQUETAS */}

                      <div
                        className="
                          absolute
                          top-4
                          left-4

                          flex
                          flex-wrap

                          gap-2
                        "
                      >

                        {nuevo && (

                          <span
                            className="
                              bg-sky-500

                              text-white

                              px-3
                              py-1.5

                              rounded-full

                              text-[10px]
                              font-bold

                              uppercase
                              tracking-[0.15em]
                            "
                          >

                            Nuevo

                          </span>

                        )}


                        {proyecto.destacado && (

                          <span
                            className="
                              bg-black/60
                              backdrop-blur-md

                              border
                              border-white/15

                              text-white

                              px-3
                              py-1.5

                              rounded-full

                              text-[10px]
                              font-semibold

                              flex
                              items-center
                              gap-1.5
                            "
                          >

                            <FaStar className="text-sky-400" />

                            Destacado

                          </span>

                        )}

                      </div>


                      {/* FOTOS */}

                      {imagenesProyecto.length >
                        1 && (

                        <div
                          className="
                            absolute
                            bottom-4
                            left-4

                            bg-black/65
                            backdrop-blur-md

                            border
                            border-white/15

                            text-white

                            px-3
                            py-2

                            rounded-xl

                            text-xs
                            font-medium

                            flex
                            items-center
                            gap-2
                          "
                        >

                          <FaImages className="text-sky-400" />

                          {imagenesProyecto.length}

                          {" fotos"}

                        </div>

                      )}


                      {/* FAVORITO */}

                      <button
                        type="button"
                        aria-label={
                          isFav
                            ? "Quitar de favoritos"
                            : "Guardar en favoritos"
                        }
                        onClick={(e) => {
                          e.stopPropagation();


                          toggleFavorito(
                            proyecto
                          );
                        }}
                        disabled={
                          guardandoFavorito ===
                          proyecto.id
                        }
                        className="
                          absolute
                          top-4
                          right-4

                          w-11
                          h-11

                          rounded-full

                          bg-black/60
                          backdrop-blur-md

                          border
                          border-white/15

                          flex
                          items-center
                          justify-center

                          hover:scale-110

                          transition

                          disabled:opacity-50
                        "
                      >

                        {isFav ? (

                          <FaHeart
                            className="
                              text-pink-500
                              text-lg
                            "
                          />

                        ) : (

                          <FaRegHeart
                            className="
                              text-white
                              text-lg
                            "
                          />

                        )}

                      </button>

                    </div>


                    {/* ================================= */}
                    {/* INFORMACIÓN */}
                    {/* ================================= */}

                    <div
                      className="
                        p-6

                        flex
                        flex-col

                        flex-1
                      "
                    >

                      {/* META */}

                      <div
                        className="
                          flex
                          items-center
                          justify-between

                          gap-3

                          min-h-[24px]
                        "
                      >

                        <p
                          className="
                            text-[11px]
                            text-sky-500

                            uppercase
                            tracking-[0.18em]

                            font-bold

                            line-clamp-1
                          "
                        >

                          {
                            proyecto.categoria ||
                            proyecto.tipo ||
                            "Proyecto Macro"
                          }

                        </p>


                        {fecha && (

                          <div
                            className="
                              text-[11px]
                              text-slate-400

                              flex
                              items-center
                              gap-1.5

                              shrink-0
                            "
                          >

                            <FaClock />

                            {fecha}

                          </div>

                        )}

                      </div>


                      {/* TÍTULO */}

                      <h2
                        className="
                          text-2xl

                          font-black

                          mt-3

                          leading-tight

                          tracking-[-0.025em]

                          line-clamp-2

                          min-h-[58px]

                          group-hover:text-sky-500

                          transition
                        "
                      >

                        {
                          proyecto.nombre ||
                          "Proyecto Macro"
                        }

                      </h2>


                      {/* DESCRIPCIÓN */}

                      <p
                        className="
                          mt-3

                          text-sm
                          text-slate-500

                          leading-relaxed

                          line-clamp-3

                          min-h-[63px]
                        "
                      >

                        {
                          proyecto.descripcion ||
                          "Conoce los detalles de esta solución desarrollada por Macro."
                        }

                      </p>


                      {/* TECNOLOGÍAS */}

                      <div
                        className="
                          min-h-[42px]

                          mt-5
                        "
                      >

                        {Array.isArray(
                          proyecto.tecnologias
                        ) &&
                          proyecto
                            .tecnologias
                            .length >
                            0 && (

                          <div
                            className="
                              flex
                              flex-wrap

                              gap-2
                            "
                          >

                            {proyecto
                              .tecnologias
                              .slice(
                                0,
                                3
                              )
                              .map(
                                (
                                  tecnologia
                                ) => (

                                  <span
                                    key={
                                      tecnologia
                                    }
                                    className={`
                                      px-2.5
                                      py-1.5

                                      rounded-full

                                      border

                                      text-[10px]
                                      font-semibold

                                      ${
                                        modoOscuro
                                          ? `
                                            bg-[#071221]
                                            border-slate-700
                                            text-slate-300
                                          `
                                          : `
                                            bg-slate-50
                                            border-slate-200
                                            text-slate-600
                                          `
                                      }
                                    `}
                                  >

                                    {tecnologia}

                                  </span>

                                )
                              )}

                          </div>

                        )}

                      </div>


                      {/* VER */}

                      <div
                        className="
                          mt-5

                          flex
                          items-center
                          gap-2

                          text-sm
                          text-slate-500

                          font-semibold

                          group-hover:text-sky-500

                          transition
                        "
                      >

                        Ver proyecto

                        <FaArrowRight
                          className="
                            text-xs

                            transition-transform

                            group-hover:translate-x-1
                          "
                        />

                      </div>


                      {/* BOTONES */}

                      <div
                        className={`
                          grid

                          ${
                            urlProyecto
                              ? "grid-cols-2"
                              : "grid-cols-1"
                          }

                          gap-2

                          mt-auto
                          pt-6
                        `}
                      >

                        <button
                          type="button"
                          onClick={(e) =>
                            solicitarCotizacion(
                              e,
                              proyecto
                            )
                          }
                          className="
                            bg-sky-500
                            hover:bg-sky-600

                            text-white

                            font-bold

                            px-3
                            py-3.5

                            rounded-xl

                            flex
                            items-center
                            justify-center
                            gap-2

                            transition
                          "
                        >

                          <FaFileInvoiceDollar />

                          <span>
                            Solicitar
                          </span>

                        </button>


                        {urlProyecto && (

                          <button
                            type="button"
                            onClick={(e) =>
                              visitarProyecto(
                                e,
                                proyecto
                              )
                            }
                            className={`
                              border

                              px-3
                              py-3.5

                              rounded-xl

                              font-bold

                              flex
                              items-center
                              justify-center
                              gap-2

                              transition

                              ${
                                modoOscuro
                                  ? `
                                    border-slate-700
                                    text-sky-400

                                    hover:border-sky-500
                                  `
                                  : `
                                    border-sky-200
                                    text-sky-500

                                    hover:bg-sky-50
                                  `
                              }
                            `}
                          >

                            <FaExternalLinkAlt />

                            Visitar

                          </button>

                        )}

                      </div>

                    </div>

                  </article>
                );
              }
            )}

          </div>

        )}

      </main>


      {/* ================================================= */}
      {/* CTA */}
      {/* ================================================= */}

      {!cargando &&
        proyectos.length >
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

          <div
            className="
              relative
              overflow-hidden

              bg-[#071221]

              rounded-[34px]

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

                w-80
                h-80

                rounded-full

                bg-sky-500/20

                blur-3xl
              "
            />


            <div
              className="
                relative
                z-10

                flex
                flex-col

                lg:flex-row
                lg:items-center
                lg:justify-between

                gap-8
              "
            >

              <div>

                <p
                  className="
                    text-sky-300

                    text-xs

                    uppercase
                    tracking-[0.22em]

                    font-bold
                  "
                >

                  ¿Tienes una idea?

                </p>


                <h2
                  className="
                    text-3xl
                    md:text-5xl

                    font-black

                    tracking-[-0.04em]

                    mt-3
                  "
                >

                  Construyamos tu próximo proyecto.

                </h2>


                <p
                  className="
                    text-slate-300

                    mt-4

                    max-w-2xl

                    leading-relaxed
                  "
                >

                  Desarrollo web, apps, sistemas,
                  cámaras, publicidad y soluciones
                  tecnológicas adaptadas a tus necesidades.

                </p>

              </div>


              <button
                type="button"
                onClick={() => {
                  if (!usuario) {
                    setMostrarLoginModal(
                      true
                    );


                    return;
                  }


                  navigate(
                    "/crear-cotizacion"
                  );
                }}
                className="
                  shrink-0

                  bg-sky-500
                  hover:bg-sky-400

                  text-white

                  font-bold

                  px-7
                  py-4

                  rounded-2xl

                  flex
                  items-center
                  justify-center
                  gap-3
                "
              >

                <FaRocket />

                Solicitar proyecto

                <FaArrowRight />

              </button>

            </div>

          </div>

        </section>

      )}


      {/* ================================================= */}
      {/* MODAL LOGIN */}
      {/* ================================================= */}

      {mostrarLoginModal && (

        <div
          className="
            fixed
            inset-0

            z-[200]

            bg-[#050b18]/90
            backdrop-blur-md

            flex
            items-center
            justify-center

            p-4
          "
          onClick={() =>
            setMostrarLoginModal(
              false
            )
          }
        >

          <div
            onClick={(e) =>
              e.stopPropagation()
            }
            className={`
              relative

              w-full
              max-w-md

              rounded-[30px]

              border

              p-8

              shadow-2xl

              ${
                modoOscuro
                  ? `
                    bg-[#0b1424]
                    border-slate-700
                    text-white
                  `
                  : `
                    bg-white
                    border-slate-200
                    text-slate-950
                  `
              }
            `}
          >

            <button
              type="button"
              onClick={() =>
                setMostrarLoginModal(
                  false
                )
              }
              className="
                absolute
                top-5
                right-5

                w-10
                h-10

                rounded-full

                bg-slate-100/10

                text-slate-400

                flex
                items-center
                justify-center

                hover:text-sky-500
              "
            >

              <FaTimes />

            </button>


            <div
              className="
                w-16
                h-16

                rounded-2xl

                bg-gradient-to-br
                from-cyan-400
                to-blue-600

                text-white

                flex
                items-center
                justify-center

                mx-auto

                text-2xl
              "
            >

              <FaCode />

            </div>


            <p
              className="
                text-xs
                text-sky-500

                uppercase
                tracking-[0.22em]

                font-bold

                text-center

                mt-6
              "
            >

              Cuenta Macro

            </p>


            <h2
              className="
                text-3xl
                font-black

                text-center

                mt-2
              "
            >

              Inicia sesión para continuar

            </h2>


            <p
              className="
                text-slate-500

                text-center

                mt-3

                leading-relaxed
              "
            >

              Guarda tus proyectos favoritos,
              solicita servicios y administra tus
              proyectos desde tu cuenta.

            </p>


            <div
              className="
                space-y-3

                mt-8
              "
            >

              <button
                type="button"
                onClick={() => {
                  setMostrarLoginModal(
                    false
                  );


                  navigate(
                    "/login"
                  );
                }}
                className="
                  w-full

                  bg-sky-500
                  hover:bg-sky-600

                  text-white

                  font-bold

                  py-4

                  rounded-2xl
                "
              >

                Iniciar sesión

              </button>


              <button
                type="button"
                onClick={() => {
                  setMostrarLoginModal(
                    false
                  );


                  navigate(
                    "/register"
                  );
                }}
                className={`
                  w-full

                  py-4

                  rounded-2xl

                  font-semibold

                  ${
                    modoOscuro
                      ? `
                        bg-slate-800
                        hover:bg-slate-700

                        text-white
                      `
                      : `
                        bg-slate-100
                        hover:bg-slate-200

                        text-slate-900
                      `
                  }
                `}
              >

                Crear cuenta

              </button>


              <button
                type="button"
                onClick={() =>
                  setMostrarLoginModal(
                    false
                  )
                }
                className="
                  w-full

                  py-3

                  text-slate-500

                  hover:text-sky-500
                "
              >

                Continuar explorando

              </button>

            </div>

          </div>

        </div>

      )}

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
    <div
      className="
        rounded-2xl

        border
        border-white/10

        bg-white/[0.055]

        p-5

        backdrop-blur-md
      "
    >

      <p
        className="
          text-3xl

          font-black

          text-white
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
   ESTADO VACÍO
====================================================== */

function EstadoVacio({
  icon,
  titulo,
  texto,
  modoOscuro,
}) {
  return (
    <div
      className={`
        rounded-[30px]

        border

        py-20
        px-6

        text-center

        ${
          modoOscuro
            ? `
              bg-[#0b1424]
              border-slate-800
            `
            : `
              bg-white
              border-slate-200
            `
        }
      `}
    >

      <div
        className="
          w-16
          h-16

          rounded-2xl

          bg-sky-500/10
          text-sky-500

          flex
          items-center
          justify-center

          mx-auto

          text-3xl
        "
      >

        {icon}

      </div>


      <h2
        className="
          text-2xl
          font-black

          mt-5
        "
      >

        {titulo}

      </h2>


      <p
        className="
          text-slate-500

          mt-2
        "
      >

        {texto}

      </p>

    </div>
  );
}


export default Proyectos;