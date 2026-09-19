import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useNavigate,
  useOutletContext,
} from "react-router-dom";

import {
  addDoc,
  collection,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";

import {
  auth,
  db,
} from "../firebase.config";

import {
  FaArrowRight,
  FaBell,
  FaBoxOpen,
  FaBriefcase,
  FaCamera,
  FaCheckCircle,
  FaClipboardList,
  FaCode,
  FaCog,
  FaFileAlt,
  FaHome,
  FaImage,
  FaLaptopCode,
  FaPlus,
  FaProjectDiagram,
  FaShoppingBag,
  FaStore,
  FaTimes,
  FaTools,
  FaUser,
  FaUsers,
} from "react-icons/fa";


/* ======================================================
   CLOUDINARY
====================================================== */

const CLOUD_NAME =
  import.meta.env
    .VITE_CLOUDINARY_CLOUD_NAME;

const UPLOAD_PRESET =
  import.meta.env
    .VITE_CLOUDINARY_UPLOAD_PRESET;


/* ======================================================
   MENU ADMIN
====================================================== */

function MenuAdmin() {
  const navigate =
    useNavigate();


  const {
    modoOscuro = false,
  } =
    useOutletContext() || {};


  const fileInputRef =
    useRef(null);


  /* ====================================================
     DATOS
  ==================================================== */

  const [
    usuarios,
    setUsuarios,
  ] = useState([]);


  const [
    solicitudes,
    setSolicitudes,
  ] = useState([]);


  const [
    proyectos,
    setProyectos,
  ] = useState([]);


  const [
    proyectosClientes,
    setProyectosClientes,
  ] = useState([]);


  const [
    publicaciones,
    setPublicaciones,
  ] = useState([]);


  const [
    productos,
    setProductos,
  ] = useState([]);


  const [
    pedidos,
    setPedidos,
  ] = useState([]);


  /* ====================================================
     PUBLICACIÓN
  ==================================================== */

  const [
    textoPublicacion,
    setTextoPublicacion,
  ] = useState("");


  const [
    imagenPublicacion,
    setImagenPublicacion,
  ] = useState(null);


  const [
    previewImagen,
    setPreviewImagen,
  ] = useState("");


  const [
    publicando,
    setPublicando,
  ] = useState(false);


  const [
    mensaje,
    setMensaje,
  ] = useState("");


  const [
    errorPublicacion,
    setErrorPublicacion,
  ] = useState("");


  /* ====================================================
     FIRESTORE - USERS
  ==================================================== */

  useEffect(() => {
    const unsubscribe =
      onSnapshot(
        collection(
          db,
          "users"
        ),

        (snapshot) => {
          setUsuarios(
            snapshot.docs.map(
              (documento) => ({
                id:
                  documento.id,

                ...documento.data(),
              })
            )
          );
        },

        (error) => {
          console.warn(
            "No se pudieron leer users:",
            error
          );
        }
      );


    return () =>
      unsubscribe();

  }, []);


  /* ====================================================
     FIRESTORE - SOLICITUDES / COTIZACIONES
  ==================================================== */

  useEffect(() => {
    const unsubscribe =
      onSnapshot(
        collection(
          db,
          "cotizaciones"
        ),

        (snapshot) => {
          setSolicitudes(
            snapshot.docs.map(
              (documento) => ({
                id:
                  documento.id,

                ...documento.data(),
              })
            )
          );
        },

        (error) => {
          console.warn(
            "No se pudieron leer cotizaciones:",
            error
          );
        }
      );


    return () =>
      unsubscribe();

  }, []);


  /* ====================================================
     FIRESTORE - PROYECTOS
  ==================================================== */

  useEffect(() => {
    const unsubscribe =
      onSnapshot(
        collection(
          db,
          "proyectos"
        ),

        (snapshot) => {
          setProyectos(
            snapshot.docs.map(
              (documento) => ({
                id:
                  documento.id,

                ...documento.data(),
              })
            )
          );
        },

        (error) => {
          console.warn(
            "No se pudieron leer proyectos:",
            error
          );
        }
      );


    return () =>
      unsubscribe();

  }, []);


  /* ====================================================
     FIRESTORE - PROYECTOS CLIENTES
  ==================================================== */

  useEffect(() => {
    const unsubscribe =
      onSnapshot(
        collection(
          db,
          "proyectosClientes"
        ),

        (snapshot) => {
          setProyectosClientes(
            snapshot.docs.map(
              (documento) => ({
                id:
                  documento.id,

                ...documento.data(),
              })
            )
          );
        },

        (error) => {
          console.warn(
            "No se pudieron leer proyectosClientes:",
            error
          );
        }
      );


    return () =>
      unsubscribe();

  }, []);


  /* ====================================================
     FIRESTORE - PUBLICACIONES
  ==================================================== */

  useEffect(() => {
    const unsubscribe =
      onSnapshot(
        collection(
          db,
          "publicaciones"
        ),

        (snapshot) => {
          const lista =
            snapshot.docs.map(
              (documento) => ({
                id:
                  documento.id,

                ...documento.data(),
              })
            );


          lista.sort(
            (a, b) => {
              const fechaA =
                a.fechaCreacion
                  ?.toMillis?.() ||
                0;


              const fechaB =
                b.fechaCreacion
                  ?.toMillis?.() ||
                0;


              return (
                fechaB -
                fechaA
              );
            }
          );


          setPublicaciones(
            lista
          );
        },

        (error) => {
          console.warn(
            "No se pudieron leer publicaciones:",
            error
          );
        }
      );


    return () =>
      unsubscribe();

  }, []);


  /* ====================================================
     FIRESTORE - PRODUCTOS
  ==================================================== */

  useEffect(() => {
    const unsubscribe =
      onSnapshot(
        collection(
          db,
          "productos"
        ),

        (snapshot) => {
          setProductos(
            snapshot.docs.map(
              (documento) => ({
                id:
                  documento.id,

                ...documento.data(),
              })
            )
          );
        },

        (error) => {
          console.warn(
            "No se pudieron leer productos:",
            error
          );
        }
      );


    return () =>
      unsubscribe();

  }, []);


  /* ====================================================
     FIRESTORE - PEDIDOS
  ==================================================== */

  useEffect(() => {
    const unsubscribe =
      onSnapshot(
        collection(
          db,
          "pedidos"
        ),

        (snapshot) => {
          setPedidos(
            snapshot.docs.map(
              (documento) => ({
                id:
                  documento.id,

                ...documento.data(),
              })
            )
          );
        },

        (error) => {
          console.warn(
            "No se pudieron leer pedidos:",
            error
          );
        }
      );


    return () =>
      unsubscribe();

  }, []);


  /* ====================================================
     ESTADÍSTICAS
  ==================================================== */

  const estadisticas =
    useMemo(() => {
      const clientes =
        usuarios.filter(
          (usuario) =>
            usuario.role !==
            "admin"
        ).length;


      const solicitudesNuevas =
        solicitudes.filter(
          (solicitud) =>
            solicitud.vistoPorAdmin ===
            false
        ).length;


      const pedidosPendientes =
        pedidos.filter(
          (pedido) => {
            const estado =
              String(
                pedido.estado ||
                  ""
              ).toLowerCase();


            return (
              estado ===
                "pendiente" ||
              estado ===
                "nuevo"
            );
          }
        ).length;


      return {
        clientes,

        solicitudes:
          solicitudes.length,

        solicitudesNuevas,

        proyectos:
          proyectos.length,

        publicaciones:
          publicaciones.length,

        productos:
          productos.length,

        pedidos:
          pedidos.length,

        pedidosPendientes,

        proyectosClientes:
          proyectosClientes.length,
      };

    }, [
      usuarios,
      solicitudes,
      proyectos,
      publicaciones,
      productos,
      pedidos,
      proyectosClientes,
    ]);


  /* ====================================================
     SELECCIONAR IMAGEN PUBLICACIÓN
  ==================================================== */

  const seleccionarImagen =
    (file) => {
      setErrorPublicacion("");

      setMensaje("");


      if (!file) {
        return;
      }


      if (
        !file.type.startsWith(
          "image/"
        )
      ) {
        setErrorPublicacion(
          "Selecciona una imagen válida."
        );

        return;
      }


      if (
        file.size >
        10 *
          1024 *
          1024
      ) {
        setErrorPublicacion(
          "La imagen no puede superar 10 MB."
        );

        return;
      }


      if (
        previewImagen
      ) {
        URL.revokeObjectURL(
          previewImagen
        );
      }


      setImagenPublicacion(
        file
      );


      setPreviewImagen(
        URL.createObjectURL(
          file
        )
      );
    };


  /* ====================================================
     QUITAR IMAGEN
  ==================================================== */

  const quitarImagen =
    () => {
      if (
        previewImagen
      ) {
        URL.revokeObjectURL(
          previewImagen
        );
      }


      setImagenPublicacion(
        null
      );


      setPreviewImagen("");
    };


  /* ====================================================
     SUBIR CLOUDINARY
  ==================================================== */

  const subirImagenCloudinary =
    async (file) => {
      if (
        !CLOUD_NAME ||
        !UPLOAD_PRESET
      ) {
        throw new Error(
          "Falta configurar Cloudinary en .env."
        );
      }


      const formData =
        new FormData();


      formData.append(
        "file",
        file
      );


      formData.append(
        "upload_preset",
        UPLOAD_PRESET
      );


      formData.append(
        "folder",
        "macro/publicaciones"
      );


      const response =
        await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
          {
            method:
              "POST",

            body:
              formData,
          }
        );


      const data =
        await response.json();


      if (
        !response.ok
      ) {
        throw new Error(
          data?.error?.message ||
            "No se pudo subir la fotografía."
        );
      }


      return (
        data.secure_url ||
        ""
      );
    };


  /* ====================================================
     PUBLICAR
  ==================================================== */

  const crearPublicacion =
    async () => {
      setErrorPublicacion("");

      setMensaje("");


      if (
        !textoPublicacion.trim() &&
        !imagenPublicacion
      ) {
        setErrorPublicacion(
          "Escribe algo o agrega una fotografía."
        );

        return;
      }


      try {
        setPublicando(true);


        let imagenUrl =
          "";


        if (
          imagenPublicacion
        ) {
          imagenUrl =
            await subirImagenCloudinary(
              imagenPublicacion
            );
        }


        await addDoc(
          collection(
            db,
            "publicaciones"
          ),

          {
            texto:
              textoPublicacion.trim(),

            imagen:
              imagenUrl,

            autorId:
              auth.currentUser?.uid ||
              "",

            autorNombre:
              "Macro",

            autorTipo:
              "admin",

            likes:
              [],

            totalLikes:
              0,

            totalComentarios:
              0,

            activo:
              true,

            fechaCreacion:
              serverTimestamp(),

            fechaActualizacion:
              serverTimestamp(),
          }
        );


        setTextoPublicacion(
          ""
        );


        quitarImagen();


        setMensaje(
          "Publicación creada correctamente."
        );

      } catch (
        error
      ) {
        console.error(
          "Error publicando:",
          error
        );


        setErrorPublicacion(
          error.message ||
            "No se pudo crear la publicación."
        );

      } finally {
        setPublicando(false);
      }
    };


  /* ====================================================
     RENDER
  ==================================================== */

  return (
    <div
      className={`
        min-h-screen

        ${
          modoOscuro
            ? `
              bg-[#050b18]
              text-white
            `
            : `
              bg-[#f4f9fd]
              text-slate-950
            `
        }
      `}
    >

      <div
        className="
          max-w-[1600px]
          mx-auto

          grid
          lg:grid-cols-[310px_1fr]
        "
      >

        {/* ================================================= */}
        {/* SIDEBAR */}
        {/* ================================================= */}

        <aside
          className={`
            lg:min-h-[calc(100vh-80px)]

            border-r

            px-5
            py-7

            ${
              modoOscuro
                ? `
                  bg-[#08101f]
                  border-slate-800
                `
                : `
                  bg-white
                  border-sky-100
                `
            }
          `}
        >

          {/* CABECERA */}

          <div
            className="
              mb-8
              px-2
            "
          >

            <p
              className="
                text-xs
                font-bold

                uppercase
                tracking-[0.25em]

                text-sky-500
              "
            >

              Macro Admin

            </p>


            <h2
              className="
                text-2xl

                font-black

                mt-2
              "
            >

              Panel de control

            </h2>


            <p
              className="
                text-sm
                text-slate-500

                mt-2
              "
            >

              Control total de la plataforma.

            </p>

          </div>


          {/* GENERAL */}

          <MenuButton
            icon={
              <FaHome />
            }
            texto="Inicio"
            activo
            modoOscuro={
              modoOscuro
            }
            onClick={() =>
              navigate(
                "/admin"
              )
            }
          />


          <MenuButton
            icon={
              <FaFileAlt />
            }
            texto="Publicaciones"
            badge={
              estadisticas.publicaciones
            }
            modoOscuro={
              modoOscuro
            }
            onClick={() => {
              document
                .getElementById(
                  "crear-publicacion"
                )
                ?.scrollIntoView({
                  behavior:
                    "smooth",
                });
            }}
          />


          <MenuButton
            icon={
              <FaPlus />
            }
            texto="Subir proyecto"
            destacado
            modoOscuro={
              modoOscuro
            }
            onClick={() =>
              navigate(
                "/admin/subir-proyecto"
              )
            }
          />


          <MenuButton
            icon={
              <FaLaptopCode />
            }
            texto="Proyectos"
            badge={
              estadisticas.proyectos
            }
            modoOscuro={
              modoOscuro
            }
            onClick={() =>
              navigate(
                "/proyectos"
              )
            }
          />


          <MenuButton
            icon={
              <FaClipboardList />
            }
            texto="Solicitudes"
            badge={
              estadisticas
                .solicitudesNuevas
            }
            badgeAlerta={
              estadisticas
                .solicitudesNuevas >
              0
            }
            modoOscuro={
              modoOscuro
            }
            onClick={() =>
              navigate(
                "/admin/cotizaciones"
              )
            }
          />


          <MenuButton
            icon={
              <FaTools />
            }
            texto="Proyectos de clientes"
            badge={
              estadisticas
                .proyectosClientes
            }
            modoOscuro={
              modoOscuro
            }
            onClick={() =>
              navigate(
                "/admin/proyectos-terminados"
              )
            }
          />


          {/* COMERCIO */}

          <TituloMenu>
            Comercio
          </TituloMenu>


          <MenuButton
            icon={
              <FaStore />
            }
            texto="Tienda"
            modoOscuro={
              modoOscuro
            }
            onClick={() =>
              navigate(
                "/tienda"
              )
            }
          />


          <MenuButton
            icon={
              <FaShoppingBag />
            }
            texto="Subir productos"
            badge={
              estadisticas.productos
            }
            modoOscuro={
              modoOscuro
            }
            onClick={() =>
              navigate(
                "/admin/subir-producto"
              )
            }
          />


          <MenuButton
            icon={
              <FaBoxOpen />
            }
            texto="Pedidos"
            badge={
              estadisticas
                .pedidosPendientes
            }
            badgeAlerta={
              estadisticas
                .pedidosPendientes >
              0
            }
            modoOscuro={
              modoOscuro
            }
            onClick={() =>
              navigate(
                "/admin/pedidos"
              )
            }
          />


          {/* ADMINISTRACIÓN */}

          <TituloMenu>
            Administración
          </TituloMenu>


          <MenuButton
            icon={
              <FaUsers />
            }
            texto="Clientes"
            badge={
              estadisticas.clientes
            }
            modoOscuro={
              modoOscuro
            }
            onClick={() =>
              navigate(
                "/admin/clientes"
              )
            }
          />


          <MenuButton
            icon={
              <FaUser />
            }
            texto="Perfil"
            modoOscuro={
              modoOscuro
            }
            onClick={() =>
              navigate(
                "/admin/perfil"
              )
            }
          />

        </aside>


        {/* ================================================= */}
        {/* CONTENIDO */}
        {/* ================================================= */}

        <main
          className="
            px-5
            md:px-8

            py-8
            md:py-10
          "
        >

          {/* ================================================= */}
          {/* CABECERA */}
          {/* ================================================= */}

          <div
            className="
              flex
              flex-col

              xl:flex-row
              xl:items-start
              xl:justify-between

              gap-6
            "
          >

            <div>

              <p
                className="
                  text-xs

                  uppercase
                  tracking-[0.25em]

                  text-sky-500

                  font-bold
                "
              >

                Macro Control Center

              </p>


              <h1
                className="
                  text-4xl
                  md:text-5xl

                  font-black

                  tracking-[-0.045em]

                  mt-2
                "
              >

                Panel administrativo

              </h1>


              <p
                className="
                  max-w-3xl

                  text-slate-500

                  text-lg

                  leading-relaxed

                  mt-3
                "
              >

                Administra servicios, proyectos,
                publicaciones, productos, pedidos
                y clientes desde un solo lugar.

              </p>

            </div>


            <div
              className={`
                px-5
                py-4

                rounded-2xl

                border

                flex
                items-center
                gap-3

                ${
                  estadisticas
                    .solicitudesNuevas >
                  0
                    ? `
                      bg-amber-500/5
                      border-amber-400/30
                    `
                    : `
                      bg-emerald-500/5
                      border-emerald-400/30
                    `
                }
              `}
            >

              {estadisticas
                .solicitudesNuevas >
              0 ? (

                <FaBell
                  className="
                    text-amber-500
                  "
                />

              ) : (

                <FaCheckCircle
                  className="
                    text-emerald-500
                  "
                />

              )}


              <div>

                <p
                  className="
                    font-bold
                  "
                >

                  {estadisticas
                    .solicitudesNuevas >
                  0
                    ? `${estadisticas.solicitudesNuevas} solicitudes nuevas`
                    : "Todo actualizado"
                  }

                </p>


                <p
                  className="
                    text-xs
                    text-slate-500

                    mt-1
                  "
                >

                  {estadisticas
                    .solicitudesNuevas >
                  0
                    ? "Hay solicitudes que requieren atención."
                    : "No hay solicitudes nuevas."
                  }

                </p>

              </div>

            </div>

          </div>


          {/* ================================================= */}
          {/* ESTADÍSTICAS */}
          {/* ================================================= */}

          <div
            className="
              grid
              sm:grid-cols-2
              xl:grid-cols-4

              gap-4

              mt-9
            "
          >

            <EstadisticaCard
              titulo="Clientes"
              numero={
                estadisticas.clientes
              }
              icon={
                <FaUsers />
              }
              modoOscuro={
                modoOscuro
              }
            />


            <EstadisticaCard
              titulo="Solicitudes"
              numero={
                estadisticas.solicitudes
              }
              icon={
                <FaClipboardList />
              }
              modoOscuro={
                modoOscuro
              }
            />


            <EstadisticaCard
              titulo="Proyectos"
              numero={
                estadisticas.proyectos
              }
              icon={
                <FaLaptopCode />
              }
              modoOscuro={
                modoOscuro
              }
            />


            <EstadisticaCard
              titulo="Publicaciones"
              numero={
                estadisticas.publicaciones
              }
              icon={
                <FaFileAlt />
              }
              modoOscuro={
                modoOscuro
              }
            />

          </div>


          {/* ================================================= */}
          {/* CREAR PUBLICACIÓN */}
          {/* ================================================= */}

          <section
            id="crear-publicacion"
            className={`
              mt-10

              rounded-[30px]

              border

              overflow-hidden

              ${
                modoOscuro
                  ? `
                    bg-[#0b1424]
                    border-slate-800
                  `
                  : `
                    bg-white
                    border-sky-100

                    shadow-sm
                  `
              }
            `}
          >

            {/* AUTOR */}

            <div
              className="
                p-6

                flex
                items-center
                gap-4
              "
            >

              <div
                className="
                  w-14
                  h-14

                  rounded-full

                  bg-gradient-to-br
                  from-cyan-400
                  to-blue-600

                  text-white

                  flex
                  items-center
                  justify-center

                  shadow-lg
                  shadow-sky-500/20
                "
              >

                <FaCode />

              </div>


              <div>

                <p
                  className="
                    font-black

                    text-lg
                  "
                >

                  Macro

                </p>


                <p
                  className="
                    text-sm
                    text-slate-400
                  "
                >

                  Crear publicación

                </p>

              </div>

            </div>


            {/* TEXTO */}

            <textarea
              value={
                textoPublicacion
              }
              onChange={(e) =>
                setTextoPublicacion(
                  e.target.value
                )
              }
              rows={5}
              placeholder="¿Qué quieres publicar en Macro?"
              className={`
                w-full

                px-6
                pb-6

                resize-none

                outline-none

                text-lg

                ${
                  modoOscuro
                    ? `
                      bg-[#0b1424]
                      text-white

                      placeholder:text-slate-600
                    `
                    : `
                      bg-white
                      text-slate-900

                      placeholder:text-slate-400
                    `
                }
              `}
            />


            {/* PREVIEW */}

            {previewImagen && (

              <div
                className="
                  relative

                  mx-6
                  mb-6

                  rounded-2xl

                  overflow-hidden

                  bg-black
                "
              >

                <img
                  src={
                    previewImagen
                  }
                  alt="Vista previa"
                  className="
                    w-full

                    max-h-[520px]

                    object-contain
                  "
                />


                <button
                  type="button"
                  onClick={
                    quitarImagen
                  }
                  className="
                    absolute

                    top-4
                    right-4

                    w-10
                    h-10

                    rounded-full

                    bg-black/70

                    text-white

                    flex
                    items-center
                    justify-center

                    hover:bg-red-500

                    transition
                  "
                >

                  <FaTimes />

                </button>

              </div>

            )}


            {/* ERROR */}

            {errorPublicacion && (

              <div
                className="
                  mx-6
                  mb-5

                  p-4

                  rounded-xl

                  bg-red-500/5

                  border
                  border-red-400/30

                  text-red-500

                  text-sm
                "
              >

                {errorPublicacion}

              </div>

            )}


            {mensaje && (

              <div
                className="
                  mx-6
                  mb-5

                  p-4

                  rounded-xl

                  bg-emerald-500/5

                  border
                  border-emerald-400/30

                  text-emerald-500

                  text-sm
                "
              >

                {mensaje}

              </div>

            )}


            {/* ACCIONES */}

            <div
              className={`
                border-t

                p-5

                flex
                flex-col

                sm:flex-row
                sm:items-center
                sm:justify-between

                gap-3

                ${
                  modoOscuro
                    ? `
                      border-slate-800
                    `
                    : `
                      border-sky-100
                    `
                }
              `}
            >

              <button
                type="button"
                onClick={() =>
                  fileInputRef.current?.click()
                }
                className="
                  px-5
                  py-3.5

                  rounded-xl

                  bg-emerald-500/10
                  hover:bg-emerald-500/15

                  text-emerald-600

                  font-bold

                  flex
                  items-center
                  justify-center
                  gap-2
                "
              >

                <FaImage />

                Foto

              </button>


              <input
                ref={
                  fileInputRef
                }
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  seleccionarImagen(
                    e.target
                      .files?.[0]
                  );


                  e.target.value =
                    "";
                }}
              />


              <button
                type="button"
                disabled={
                  publicando
                }
                onClick={
                  crearPublicacion
                }
                className="
                  px-7
                  py-3.5

                  rounded-xl

                  bg-sky-500
                  hover:bg-sky-600

                  disabled:opacity-50
                  disabled:cursor-not-allowed

                  text-white

                  font-bold

                  flex
                  items-center
                  justify-center
                  gap-2

                  transition
                "
              >

                <FaPlus />

                {publicando
                  ? "Publicando..."
                  : "Publicar"
                }

              </button>

            </div>

          </section>


          {/* ================================================= */}
          {/* OPERACIONES */}
          {/* ================================================= */}

          <section
            className="
              mt-12
            "
          >

            <div
              className="
                mb-6
              "
            >

              <p
                className="
                  text-xs
                  text-sky-500

                  uppercase
                  tracking-[0.22em]

                  font-bold
                "
              >

                Accesos rápidos

              </p>


              <h2
                className="
                  text-2xl
                  md:text-3xl

                  font-black

                  mt-2
                "
              >

                Operaciones de Macro

              </h2>

            </div>


            <div
              className="
                grid
                sm:grid-cols-2
                xl:grid-cols-3

                gap-5
              "
            >

              <OperacionCard
                icon={
                  <FaPlus />
                }
                titulo="Nuevo proyecto"
                texto="Publicar un nuevo proyecto en el portafolio."
                onClick={() =>
                  navigate(
                    "/admin/subir-proyecto"
                  )
                }
                modoOscuro={
                  modoOscuro
                }
              />


              <OperacionCard
                icon={
                  <FaProjectDiagram />
                }
                titulo="Proyectos"
                texto="Consultar el portafolio público de Macro."
                onClick={() =>
                  navigate(
                    "/proyectos"
                  )
                }
                modoOscuro={
                  modoOscuro
                }
              />


              <OperacionCard
                icon={
                  <FaClipboardList />
                }
                titulo="Solicitudes"
                texto="Revisar las solicitudes enviadas por clientes."
                onClick={() =>
                  navigate(
                    "/admin/cotizaciones"
                  )
                }
                modoOscuro={
                  modoOscuro
                }
              />


              <OperacionCard
                icon={
                  <FaShoppingBag />
                }
                titulo="Subir productos"
                texto="Agregar productos al catálogo de Macro Store."
                onClick={() =>
                  navigate(
                    "/admin/subir-producto"
                  )
                }
                modoOscuro={
                  modoOscuro
                }
              />


              <OperacionCard
                icon={
                  <FaStore />
                }
                titulo="Tienda"
                texto="Abrir y revisar la tienda pública."
                onClick={() =>
                  navigate(
                    "/tienda"
                  )
                }
                modoOscuro={
                  modoOscuro
                }
              />


              <OperacionCard
                icon={
                  <FaUsers />
                }
                titulo="Clientes"
                texto="Administrar usuarios y clientes registrados."
                onClick={() =>
                  navigate(
                    "/admin/clientes"
                  )
                }
                modoOscuro={
                  modoOscuro
                }
              />

            </div>

          </section>


          {/* ================================================= */}
          {/* RESUMEN COMERCIO */}
          {/* ================================================= */}

          <section
            className={`
              mt-12

              rounded-[30px]

              border

              p-6
              md:p-8

              ${
                modoOscuro
                  ? `
                    bg-[#0b1424]
                    border-slate-800
                  `
                  : `
                    bg-white
                    border-sky-100
                  `
              }
            `}
          >

            <div
              className="
                flex
                flex-col

                lg:flex-row
                lg:items-center
                lg:justify-between

                gap-6
              "
            >

              <div>

                <p
                  className="
                    text-xs

                    uppercase
                    tracking-[0.22em]

                    text-sky-500

                    font-bold
                  "
                >

                  Macro Store

                </p>


                <h2
                  className="
                    text-2xl

                    font-black

                    mt-2
                  "
                >

                  Comercio digital

                </h2>


                <p
                  className="
                    text-slate-500

                    mt-2
                  "
                >

                  Productos y pedidos administrados desde Macro.

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
                    estadisticas.productos
                  }
                  texto="Productos"
                />


                <MiniDato
                  numero={
                    estadisticas.pedidos
                  }
                  texto="Pedidos"
                />

              </div>

            </div>

          </section>

        </main>

      </div>

    </div>
  );
}


/* ======================================================
   TÍTULO MENU
====================================================== */

function TituloMenu({
  children,
}) {
  return (
    <p
      className="
        px-3

        mt-8
        mb-3

        text-[10px]

        uppercase
        tracking-[0.25em]

        font-bold

        text-slate-400
      "
    >

      {children}

    </p>
  );
}


/* ======================================================
   BOTÓN MENU
====================================================== */

function MenuButton({
  icon,
  texto,
  badge,
  badgeAlerta = false,
  activo = false,
  destacado = false,
  modoOscuro,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={`
        w-full

        min-h-[58px]

        px-4
        py-3

        rounded-2xl

        flex
        items-center

        gap-3

        text-left

        font-semibold

        transition-all

        mb-2

        ${
          destacado
            ? `
              bg-sky-500
              text-white

              hover:bg-sky-600
            `
            : activo
            ? `
              bg-sky-500/10

              border
              border-sky-300

              text-sky-600
            `
            : modoOscuro
            ? `
              text-slate-300

              hover:bg-slate-800
            `
            : `
              text-slate-600

              hover:bg-sky-50
              hover:text-sky-600
            `
        }
      `}
    >

      <span
        className={`
          text-lg

          ${
            destacado
              ? "text-white"
              : "text-sky-500"
          }
        `}
      >

        {icon}

      </span>


      <span
        className="
          flex-1
        "
      >

        {texto}

      </span>


      {badge !==
        undefined &&
        badge !==
          null &&
        Number(
          badge
        ) >
          0 && (

        <span
          className={`
            min-w-[25px]
            h-[25px]

            px-2

            rounded-full

            text-[11px]
            font-bold

            flex
            items-center
            justify-center

            ${
              badgeAlerta
                ? `
                  bg-red-500
                  text-white
                `
                : destacado
                ? `
                  bg-white
                  text-sky-600
                `
                : `
                  bg-sky-500/10
                  text-sky-600
                `
            }
          `}
        >

          {badge}

        </span>

      )}

    </button>
  );
}


/* ======================================================
   ESTADÍSTICA
====================================================== */

function EstadisticaCard({
  titulo,
  numero,
  icon,
  modoOscuro,
}) {
  return (
    <div
      className={`
        p-6

        rounded-[24px]

        border

        flex
        items-center
        justify-between

        gap-4

        ${
          modoOscuro
            ? `
              bg-[#0b1424]
              border-slate-800
            `
            : `
              bg-white
              border-sky-100

              shadow-sm
            `
        }
      `}
    >

      <div>

        <p
          className="
            text-sm
            text-slate-500
          "
        >

          {titulo}

        </p>


        <p
          className="
            text-3xl

            font-black

            mt-2
          "
        >

          {numero}

        </p>

      </div>


      <div
        className="
          w-14
          h-14

          rounded-2xl

          bg-sky-500/10
          text-sky-500

          flex
          items-center
          justify-center

          text-xl
        "
      >

        {icon}

      </div>

    </div>
  );
}


/* ======================================================
   OPERACIÓN
====================================================== */

function OperacionCard({
  icon,
  titulo,
  texto,
  onClick,
  modoOscuro,
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={`
        group

        p-6

        rounded-[26px]

        border

        text-left

        min-h-[190px]

        flex
        flex-col

        transition-all

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
              border-sky-100

              hover:border-sky-300
            `
        }
      `}
    >

      <div
        className="
          w-12
          h-12

          rounded-2xl

          bg-sky-500/10
          text-sky-500

          flex
          items-center
          justify-center
        "
      >

        {icon}

      </div>


      <h3
        className="
          text-lg

          font-black

          mt-5
        "
      >

        {titulo}

      </h3>


      <p
        className="
          text-sm
          text-slate-500

          leading-relaxed

          mt-2
        "
      >

        {texto}

      </p>


      <span
        className="
          mt-auto
          pt-5

          flex
          items-center
          gap-2

          text-sm
          text-sky-500

          font-bold
        "
      >

        Abrir

        <FaArrowRight
          className="
            transition-transform

            group-hover:translate-x-1
          "
        />

      </span>

    </button>
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
        bg-sky-500/5

        border
        border-sky-500/10

        rounded-2xl

        p-4
      "
    >

      <p
        className="
          text-2xl

          font-black

          text-sky-500
        "
      >

        {numero}

      </p>


      <p
        className="
          text-xs
          text-slate-500

          mt-1
        "
      >

        {texto}

      </p>

    </div>
  );
}


export default MenuAdmin;