import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
  useOutletContext,
  useParams,
} from "react-router-dom";

import {
  collection,
  doc,
  onSnapshot,
} from "firebase/firestore";

import {
  onAuthStateChanged,
} from "firebase/auth";

import {
  auth,
  db,
} from "../firebase.config";

import {
  FaArrowDown,
  FaArrowLeft,
  FaArrowRight,
  FaArrowUp,
  FaCheck,
  FaCheckCircle,
  FaChevronLeft,
  FaChevronRight,
  FaHeart,
  FaImage,
  FaLock,
  FaMinus,
  FaPlus,
  FaShieldAlt,
  FaShoppingCart,
  FaStar,
  FaStore,
  FaTag,
  FaTools,
  FaTruck,
  FaUndo,
  FaUser,
} from "react-icons/fa";


/* ======================================================
   MONEDA
====================================================== */

const formatoMoneda =
  new Intl.NumberFormat(
    "es-MX",
    {
      style: "currency",
      currency: "MXN",
    }
  );


/* ======================================================
   LEER CARRITO
====================================================== */

function leerCarrito() {
  try {
    const guardado =
      JSON.parse(
        localStorage.getItem(
          "macro_carrito"
        ) ||
          "[]"
      );


    return Array.isArray(
      guardado
    )
      ? guardado
      : [];

  } catch {
    return [];
  }
}


/* ======================================================
   DETALLE PRODUCTO
====================================================== */

function DetalleProducto() {
  const {
    id,
  } = useParams();


  const navigate =
    useNavigate();


  const location =
    useLocation();


  const {
    modoOscuro = false,
  } =
    useOutletContext() || {};


  /* ====================================================
     AUTENTICACIÓN
  ==================================================== */

  const [
    usuario,
    setUsuario,
  ] = useState(null);


  const [
    authListo,
    setAuthListo,
  ] = useState(false);


  /* ====================================================
     PRODUCTO
  ==================================================== */

  const [
    producto,
    setProducto,
  ] = useState(null);


  const [
    todosProductos,
    setTodosProductos,
  ] = useState([]);


  /* ====================================================
     ESTADOS
  ==================================================== */

  const [
    cargando,
    setCargando,
  ] = useState(true);


  const [
    error,
    setError,
  ] = useState("");


  const [
    indiceImagen,
    setIndiceImagen,
  ] = useState(0);


  const [
    cantidad,
    setCantidad,
  ] = useState(1);


  const [
    favorito,
    setFavorito,
  ] = useState(false);


  const [
    mensaje,
    setMensaje,
  ] = useState("");


  const [
    descripcionExpandida,
    setDescripcionExpandida,
  ] = useState(false);


  const [
    modalidadCompra,
    setModalidadCompra,
  ] = useState(
    "producto"
  );


  /* ====================================================
     CARRITO
  ==================================================== */

  const [
    carrito,
    setCarrito,
  ] = useState(
    () =>
      leerCarrito()
  );


  /* ====================================================
     ESCUCHAR AUTENTICACIÓN
  ==================================================== */

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        (user) => {
          setUsuario(
            user
          );


          setAuthListo(
            true
          );


          /*
            Si no existe sesión,
            no mostramos productos de una sesión anterior.
          */

          if (!user) {
            setCarrito(
              []
            );

            localStorage.removeItem(
              "macro_carrito"
            );
          }
        }
      );


    return () =>
      unsubscribe();

  }, []);


  /* ====================================================
     EXIGIR LOGIN
  ==================================================== */

  const requiereLogin =
    (
      destino =
        `/producto/${id}`
    ) => {
      /*
        Si Firebase todavía está comprobando
        la sesión, simplemente esperamos.
      */

      if (!authListo) {
        return false;
      }


      /*
        NO HAY USUARIO:
        mandamos al login.
      */

      if (!usuario) {
        navigate(
          "/login",
          {
            state: {
              from:
                destino,

              paginaAnterior:
                location.pathname,

              mensaje:
                "Inicia sesión para comprar productos en Macro Store.",
            },
          }
        );


        return false;
      }


      return true;
    };


  /* ====================================================
     CONTADOR CARRITO
  ==================================================== */

  useEffect(() => {
    const actualizar =
      () => {
        if (
          !auth.currentUser
        ) {
          setCarrito(
            []
          );

          return;
        }


        setCarrito(
          leerCarrito()
        );
      };


    window.addEventListener(
      "storage",
      actualizar
    );


    window.addEventListener(
      "macro-carrito-actualizado",
      actualizar
    );


    return () => {
      window.removeEventListener(
        "storage",
        actualizar
      );


      window.removeEventListener(
        "macro-carrito-actualizado",
        actualizar
      );
    };

  }, []);


  const cantidadCarrito =
    useMemo(() => {
      return carrito.reduce(
        (
          total,
          item
        ) =>
          total +
          Number(
            item.cantidad ||
            0
          ),

        0
      );

    }, [
      carrito,
    ]);


  /* ====================================================
     PRODUCTO ACTUAL
  ==================================================== */

  useEffect(() => {
    if (!id) {
      setError(
        "Producto no válido."
      );


      setCargando(
        false
      );


      return;
    }


    const unsubscribe =
      onSnapshot(
        doc(
          db,
          "productos",
          id
        ),

        (snapshot) => {
          if (
            !snapshot.exists()
          ) {
            setError(
              "Este producto ya no se encuentra disponible."
            );


            setProducto(
              null
            );


            setCargando(
              false
            );


            return;
          }


          setProducto({
            id:
              snapshot.id,

            ...snapshot.data(),
          });


          setIndiceImagen(
            0
          );


          setCantidad(
            1
          );


          setModalidadCompra(
            "producto"
          );


          setDescripcionExpandida(
            false
          );


          setCargando(
            false
          );
        },

        (firebaseError) => {
          console.error(
            firebaseError
          );


          setError(
            "No se pudo cargar el producto."
          );


          setCargando(
            false
          );
        }
      );


    return () =>
      unsubscribe();

  }, [
    id,
  ]);


  /* ====================================================
     TODOS LOS PRODUCTOS
  ==================================================== */

  useEffect(() => {
    const unsubscribe =
      onSnapshot(
        collection(
          db,
          "productos"
        ),

        (snapshot) => {
          setTodosProductos(
            snapshot.docs.map(
              (documento) => ({
                id:
                  documento.id,

                ...documento.data(),
              })
            )
          );
        },

        (firebaseError) => {
          console.warn(
            "Productos relacionados:",
            firebaseError
          );
        }
      );


    return () =>
      unsubscribe();

  }, []);


  /* ====================================================
     IMÁGENES
  ==================================================== */

  const imagenes =
    useMemo(() => {
      if (
        Array.isArray(
          producto?.imagenes
        ) &&
        producto.imagenes.length
      ) {
        return producto.imagenes;
      }


      if (
        producto?.imagen
      ) {
        return [
          producto.imagen,
        ];
      }


      return [];

    }, [
      producto,
    ]);


  const imagenActual =
    imagenes[
      indiceImagen
    ] ||
    "";


  /* ====================================================
     DESCRIPCIÓN
  ==================================================== */

  const descripcionCompleta =
    producto?.descripcionDetallada ||
    producto?.descripcion ||
    "No hay una descripción disponible para este producto.";


  const descripcionEsLarga =
    descripcionCompleta.length >
    420;


  /* ====================================================
     RELACIONADOS
  ==================================================== */

  const productosRelacionados =
    useMemo(() => {
      if (
        !producto?.categoria
      ) {
        return [];
      }


      return todosProductos
        .filter(
          (item) =>
            item.id !==
              producto.id &&
            item.activo !==
              false &&
            item.categoria ===
              producto.categoria
        )
        .slice(
          0,
          4
        );

    }, [
      todosProductos,
      producto,
    ]);


  /* ====================================================
     PRECIOS
  ==================================================== */

  const precio =
    Number(
      producto?.precio ||
      0
    );


  const precioAnterior =
    Number(
      producto?.precioAnterior ||
      0
    );


  const descuento =
    precioAnterior >
      precio &&
    precio >
      0
      ? Math.round(
          (
            (
              precioAnterior -
              precio
            ) /
            precioAnterior
          ) *
            100
        )
      : 0;


  /* ====================================================
     INSTALACIÓN
  ==================================================== */

  const permiteInstalacion =
    producto?.permiteInstalacion ===
    true;


  const precioInstalacion =
    permiteInstalacion
      ? Number(
          producto?.precioInstalacion ||
            0
        )
      : 0;


  const incluyeInstalacion =
    permiteInstalacion &&
    modalidadCompra ===
      "instalacion";


  const precioUnitario =
    incluyeInstalacion
      ? precio +
        precioInstalacion
      : precio;


  /* ====================================================
     STOCK
  ==================================================== */

  const stock =
    Number(
      producto?.stock ||
      0
    );


  /* ====================================================
     TOTAL
  ==================================================== */

  const totalCompra =
    precioUnitario *
    cantidad;


  /* ====================================================
     GALERÍA
  ==================================================== */

  const anterior =
    () => {
      if (
        imagenes.length <=
        1
      ) {
        return;
      }


      setIndiceImagen(
        (actual) =>
          (
            actual -
            1 +
            imagenes.length
          ) %
          imagenes.length
      );
    };


  const siguiente =
    () => {
      if (
        imagenes.length <=
        1
      ) {
        return;
      }


      setIndiceImagen(
        (actual) =>
          (
            actual +
            1
          ) %
          imagenes.length
      );
    };


  /* ====================================================
     CANTIDAD
  ==================================================== */

  const aumentar =
    () => {
      if (
        stock <=
        0
      ) {
        return;
      }


      setCantidad(
        (actual) =>
          Math.min(
            actual + 1,
            stock
          )
      );
    };


  const disminuir =
    () => {
      setCantidad(
        (actual) =>
          Math.max(
            1,
            actual - 1
          )
      );
    };


  /* ====================================================
     ABRIR CARRITO
  ==================================================== */

  const abrirCarrito =
    () => {
      if (
        !requiereLogin(
          "/carrito"
        )
      ) {
        return;
      }


      navigate(
        "/carrito"
      );
    };


  /* ====================================================
     FAVORITOS
     TAMBIÉN REQUIERE LOGIN
  ==================================================== */

  const cambiarFavorito =
    () => {
      if (
        !requiereLogin(
          `/producto/${id}`
        )
      ) {
        return;
      }


      setFavorito(
        (actual) =>
          !actual
      );
    };


  /* ====================================================
     AGREGAR CARRITO
  ==================================================== */

  const agregarCarrito =
    () => {
      /*
        PRIMERA VALIDACIÓN:
        el usuario debe haber iniciado sesión.
      */

      if (
        !requiereLogin(
          `/producto/${id}`
        )
      ) {
        return;
      }


      if (
        !producto ||
        stock <=
          0
      ) {
        return;
      }


      let carritoActual =
        leerCarrito();


      const modalidad =
        incluyeInstalacion
          ? "instalacion"
          : "producto";


      const clave =
        `${producto.id}::${modalidad}`;


      const existe =
        carritoActual.find(
          (item) =>
            item.clave ===
              clave ||
            (
              item.id ===
                producto.id &&
              (
                item.modalidad ||
                "producto"
              ) ===
                modalidad
            )
        );


      if (existe) {
        carritoActual =
          carritoActual.map(
            (item) => {
              const coincide =
                item.clave ===
                  clave ||
                (
                  item.id ===
                    producto.id &&
                  (
                    item.modalidad ||
                    "producto"
                  ) ===
                    modalidad
                );


              if (!coincide) {
                return item;
              }


              return {
                ...item,

                clave,

                modalidad,

                incluyeInstalacion,

                precio:
                  precioUnitario,

                precioProducto:
                  precio,

                precioInstalacion:
                  incluyeInstalacion
                    ? precioInstalacion
                    : 0,

                descripcionInstalacion:
                  incluyeInstalacion
                    ? producto.descripcionInstalacion ||
                      ""
                    : "",

                cantidad:
                  Math.min(
                    Number(
                      item.cantidad ||
                        1
                    ) +
                      cantidad,

                    stock
                  ),
              };
            }
          );

      } else {
        carritoActual.push({
          clave,

          id:
            producto.id,

          nombre:
            producto.nombre,

          precio:
            precioUnitario,

          precioProducto:
            precio,

          precioInstalacion:
            incluyeInstalacion
              ? precioInstalacion
              : 0,

          modalidad,

          incluyeInstalacion,

          descripcionInstalacion:
            incluyeInstalacion
              ? producto.descripcionInstalacion ||
                ""
              : "",

          imagen:
            imagenes[0] ||
            "",

          cantidad,

          stock,
        });
      }


      localStorage.setItem(
        "macro_carrito",
        JSON.stringify(
          carritoActual
        )
      );


      setCarrito(
        carritoActual
      );


      window.dispatchEvent(
        new Event(
          "macro-carrito-actualizado"
        )
      );


      setMensaje(
        incluyeInstalacion
          ? "Producto + instalación agregados al carrito."
          : cantidad === 1
          ? "Producto agregado al carrito."
          : `${cantidad} productos agregados al carrito.`
      );


      setTimeout(
        () =>
          setMensaje(""),
        3000
      );
    };


  /* ====================================================
     COMPRAR AHORA
  ==================================================== */

  const comprarAhora =
    () => {
      if (
        !requiereLogin(
          `/producto/${id}`
        )
      ) {
        return;
      }


      if (
        !producto ||
        stock <=
          0
      ) {
        return;
      }


      agregarCarrito();


      setTimeout(
        () => {
          navigate(
            "/carrito"
          );
        },
        100
      );
    };


  /* ====================================================
     LOADING
  ==================================================== */

  if (cargando) {
    return (
      <div
        className="
          min-h-screen
          bg-[#f4f6f8]
          flex
          items-center
          justify-center
        "
      >

        <div
          className="
            w-14
            h-14
            border-4
            border-sky-100
            border-t-sky-500
            rounded-full
            animate-spin
          "
        />

      </div>
    );
  }


  /* ====================================================
     ERROR
  ==================================================== */

  if (
    error ||
    !producto
  ) {
    return (
      <div
        className="
          min-h-screen
          bg-[#f4f6f8]
          flex
          items-center
          justify-center
          px-5
        "
      >

        <div
          className="
            max-w-md
            bg-white
            rounded-3xl
            border
            border-slate-200
            p-10
            text-center
          "
        >

          <FaImage
            className="
              text-5xl
              text-slate-300
              mx-auto
            "
          />


          <h1
            className="
              text-2xl
              font-black
              mt-5
            "
          >
            Producto no disponible
          </h1>


          <p
            className="
              text-slate-500
              mt-3
            "
          >
            {error}
          </p>


          <button
            type="button"
            onClick={() =>
              navigate(
                "/tienda"
              )
            }
            className="
              mt-6
              bg-sky-500
              text-white
              px-6
              py-4
              rounded-xl
              font-bold
            "
          >
            Volver a Macro Store
          </button>

        </div>

      </div>
    );
  }


  /* ====================================================
     RENDER
  ==================================================== */

  return (
    <div
      className={`
        min-h-screen

        py-7

        ${
          modoOscuro
            ? `
              bg-[#050b18]
              text-white
            `
            : `
              bg-[#f4f6f8]
              text-slate-950
            `
        }
      `}
    >

      <div
        className="
          max-w-[1450px]

          mx-auto

          px-5
          md:px-8
        "
      >

        {/* ================================================= */}
        {/* BARRA SUPERIOR */}
        {/* ================================================= */}

        <div
          className="
            flex
            items-center
            justify-between

            gap-4

            mb-5
          "
        >

          <button
            type="button"
            onClick={() =>
              navigate(
                "/tienda"
              )
            }
            className="
              flex
              items-center
              gap-2

              text-sky-600

              font-semibold
            "
          >

            <FaArrowLeft />

            Volver a Macro Store

          </button>


          {/* CARRITO */}

          <button
            type="button"
            onClick={
              abrirCarrito
            }
            className="
              relative

              bg-white

              border
              border-sky-200

              text-sky-600

              px-5
              py-3

              rounded-xl

              font-bold

              shadow-sm

              flex
              items-center
              gap-2

              hover:bg-sky-50

              transition
            "
          >

            {usuario ? (
              <FaShoppingCart />
            ) : (
              <FaLock />
            )}


            <span
              className="
                hidden
                sm:inline
              "
            >
              {usuario
                ? "Carrito"
                : "Iniciar sesión"
              }
            </span>


            {usuario &&
              cantidadCarrito >
                0 && (

              <span
                className="
                  absolute

                  -top-2
                  -right-2

                  min-w-[25px]
                  h-[25px]

                  px-1.5

                  rounded-full

                  bg-red-500

                  text-white

                  text-[10px]
                  font-bold

                  flex
                  items-center
                  justify-center
                "
              >
                {cantidadCarrito}
              </span>

            )}

          </button>

        </div>


        {/* ================================================= */}
        {/* PRODUCTO PRINCIPAL */}
        {/* ================================================= */}

        <section
          className={`
            rounded-[28px]

            border

            overflow-hidden

            grid

            xl:grid-cols-[1.1fr_.9fr_.68fr]

            items-start

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

          {/* ================================================= */}
          {/* GALERÍA */}
          {/* ================================================= */}

          <div
            className="
              p-5
              md:p-7

              grid
              md:grid-cols-[82px_1fr]

              items-start

              gap-5
            "
          >

            {/* MINIATURAS */}

            <div
              className="
                order-2
                md:order-1

                flex
                md:flex-col

                gap-3

                overflow-auto

                md:pt-1

                [&::-webkit-scrollbar]:hidden
              "
            >

              {imagenes.map(
                (
                  imagen,
                  index
                ) => (

                  <button
                    type="button"
                    key={`${imagen}-${index}`}
                    onClick={() =>
                      setIndiceImagen(
                        index
                      )
                    }
                    className={`
                      w-[72px]
                      h-[72px]

                      shrink-0

                      bg-white

                      rounded-xl

                      border-2

                      overflow-hidden

                      ${
                        indiceImagen ===
                        index
                          ? `
                            border-sky-500
                          `
                          : `
                            border-slate-200
                          `
                      }
                    `}
                  >

                    <img
                      src={imagen}
                      alt=""
                      className="
                        w-full
                        h-full

                        object-contain

                        p-1
                      "
                    />

                  </button>

                )
              )}

            </div>


            {/* FOTO PRINCIPAL */}

            <div
              className="
                order-1
                md:order-2

                relative

                min-h-[470px]

                bg-white

                rounded-2xl

                flex
                items-start
                justify-center

                overflow-hidden

                pt-4
              "
            >

              {imagenActual ? (

                <img
                  src={
                    imagenActual
                  }
                  alt={
                    producto.nombre
                  }
                  className="
                    w-full
                    h-[470px]

                    object-contain
                    object-top

                    px-5
                    pt-2
                    pb-4
                  "
                />

              ) : (

                <div
                  className="
                    w-full
                    h-[470px]

                    flex
                    items-center
                    justify-center
                  "
                >

                  <FaImage
                    className="
                      text-7xl
                      text-slate-300
                    "
                  />

                </div>

              )}


              {imagenes.length >
                1 && (
                <>

                  <button
                    type="button"
                    onClick={
                      anterior
                    }
                    className="
                      absolute

                      left-3
                      top-[45%]

                      -translate-y-1/2

                      w-11
                      h-11

                      rounded-full

                      bg-white

                      border
                      border-slate-200

                      shadow

                      text-sky-500

                      flex
                      items-center
                      justify-center

                      hover:bg-sky-50

                      transition
                    "
                  >

                    <FaChevronLeft />

                  </button>


                  <button
                    type="button"
                    onClick={
                      siguiente
                    }
                    className="
                      absolute

                      right-3
                      top-[45%]

                      -translate-y-1/2

                      w-11
                      h-11

                      rounded-full

                      bg-white

                      border
                      border-slate-200

                      shadow

                      text-sky-500

                      flex
                      items-center
                      justify-center

                      hover:bg-sky-50

                      transition
                    "
                  >

                    <FaChevronRight />

                  </button>

                </>
              )}

            </div>

          </div>


          {/* ================================================= */}
          {/* INFORMACIÓN */}
          {/* ================================================= */}

          <div
            className="
              p-7
              md:p-8

              border-t
              xl:border-t-0

              xl:border-l

              border-slate-200

              self-start
            "
          >

            <div
              className="
                flex
                items-start
                justify-between

                gap-4
              "
            >

              <div>

                <p
                  className="
                    text-sm
                    text-slate-400
                  "
                >
                  Nuevo
                  {producto.marca
                    ? ` · ${producto.marca}`
                    : ""
                  }
                </p>


                {producto.destacado && (

                  <span
                    className="
                      inline-flex
                      items-center
                      gap-1.5

                      mt-3

                      bg-sky-500

                      text-white

                      px-3
                      py-1.5

                      rounded-md

                      text-xs
                      font-bold
                    "
                  >

                    <FaStar />

                    OFERTA MACRO

                  </span>

                )}

              </div>


              {/* FAVORITO */}

              <button
                type="button"
                onClick={
                  cambiarFavorito
                }
                title={
                  usuario
                    ? "Agregar a favoritos"
                    : "Inicia sesión para usar favoritos"
                }
                className={`
                  w-11
                  h-11

                  rounded-full

                  border

                  flex
                  items-center
                  justify-center

                  ${
                    favorito
                      ? `
                        bg-sky-500
                        border-sky-500
                        text-white
                      `
                      : `
                        border-slate-200
                        text-sky-500
                      `
                  }
                `}
              >

                <FaHeart />

              </button>

            </div>


            <h1
              className="
                text-3xl
                md:text-4xl

                font-black

                tracking-[-0.035em]

                leading-tight

                mt-5
              "
            >
              {producto.nombre}
            </h1>


            <div
              className="
                flex
                flex-wrap

                gap-2

                mt-4
              "
            >

              <span
                className="
                  bg-sky-500/10

                  text-sky-600

                  px-3
                  py-1.5

                  rounded-full

                  text-xs
                  font-semibold
                "
              >

                <FaTag
                  className="
                    inline
                    mr-1
                  "
                />

                {producto.categoria}

              </span>


              {permiteInstalacion && (

                <span
                  className="
                    bg-emerald-50

                    text-emerald-700

                    px-3
                    py-1.5

                    rounded-full

                    text-xs
                    font-semibold

                    flex
                    items-center
                    gap-1
                  "
                >

                  <FaTools />

                  Instalación disponible

                </span>

              )}


              {producto.sku && (

                <span
                  className="
                    bg-slate-100

                    text-slate-500

                    px-3
                    py-1.5

                    rounded-full

                    text-xs
                  "
                >
                  SKU: {producto.sku}
                </span>

              )}

            </div>


            {/* PRECIO */}

            <div
              className="
                mt-8

                pb-7

                border-b
                border-slate-200
              "
            >

              {precioAnterior >
                precio && (

                <p
                  className="
                    text-slate-400

                    line-through

                    text-sm
                  "
                >
                  {formatoMoneda.format(
                    precioAnterior
                  )}
                </p>

              )}


              <div
                className="
                  flex
                  items-end
                  flex-wrap

                  gap-3

                  mt-1
                "
              >

                <p
                  className="
                    text-4xl
                    md:text-5xl
                  "
                >
                  {formatoMoneda.format(
                    precio
                  )}
                </p>


                {descuento >
                  0 && (

                  <span
                    className="
                      text-emerald-600

                      font-bold

                      mb-1
                    "
                  >
                    {descuento}% OFF
                  </span>

                )}

              </div>


              {permiteInstalacion && (

                <p
                  className="
                    text-sm
                    text-slate-500

                    mt-3
                  "
                >
                  También puedes contratar la instalación profesional de Macro.
                </p>

              )}

            </div>


            {/* CARACTERÍSTICAS */}

            <div className="mt-8">

              <h2
                className="
                  text-xl
                  font-black
                "
              >
                Lo que tienes que saber de este producto
              </h2>


              {Array.isArray(
                producto.caracteristicas
              ) &&
              producto.caracteristicas.length >
                0 ? (

                <ul
                  className="
                    mt-5

                    space-y-3

                    text-slate-600

                    leading-relaxed
                  "
                >

                  {producto.caracteristicas.map(
                    (
                      item,
                      index
                    ) => (

                      <li
                        key={
                          index
                        }
                        className="
                          flex
                          gap-3
                        "
                      >

                        <span
                          className="
                            text-sky-500
                            font-black
                          "
                        >
                          •
                        </span>

                        <span>
                          {item}
                        </span>

                      </li>

                    )
                  )}

                </ul>

              ) : (

                <p
                  className="
                    text-slate-500

                    mt-4

                    leading-relaxed
                  "
                >
                  {producto.descripcion}
                </p>

              )}

            </div>

          </div>


          {/* ================================================= */}
          {/* COMPRA */}
          {/* ================================================= */}

          <aside
            className="
              p-6
              md:p-7

              bg-[#fbfdff]

              border-t
              xl:border-t-0

              xl:border-l

              border-slate-200

              self-start
            "
          >

            <div
              className="
                xl:sticky
                xl:top-28
              "
            >

              <InfoCompra
                icon={
                  <FaTruck />
                }
                titulo={
                  producto.entrega ||
                  "Entrega disponible"
                }
                texto="Consulta las opciones de entrega disponibles."
              />


              {/* STOCK */}

              <div className="mt-7">

                <p
                  className="
                    text-lg
                    font-black
                  "
                >
                  {stock >
                  0
                    ? "Stock disponible"
                    : "Producto agotado"
                  }
                </p>


                {stock >
                  0 && (

                  <p
                    className="
                      text-sm
                      text-slate-500

                      mt-1
                    "
                  >
                    {stock} unidades disponibles
                  </p>

                )}

              </div>


              {/* ================================================= */}
              {/* AVISO SI NO ESTÁ LOGUEADO */}
              {/* ================================================= */}

              {!usuario &&
                authListo &&
                stock >
                  0 && (

                <div
                  className="
                    mt-6

                    p-4

                    rounded-2xl

                    bg-sky-50

                    border
                    border-sky-200
                  "
                >

                  <div
                    className="
                      flex
                      items-start
                      gap-3
                    "
                  >

                    <div
                      className="
                        w-10
                        h-10

                        rounded-xl

                        bg-sky-500

                        text-white

                        flex
                        items-center
                        justify-center

                        shrink-0
                      "
                    >

                      <FaUser />

                    </div>


                    <div>

                      <p
                        className="
                          font-black

                          text-slate-900
                        "
                      >
                        Inicia sesión para comprar
                      </p>


                      <p
                        className="
                          text-xs
                          text-slate-500

                          mt-1

                          leading-relaxed
                        "
                      >
                        Puedes consultar toda la información del producto,
                        pero necesitas una cuenta Macro para agregarlo al
                        carrito o realizar una compra.
                      </p>


                      <button
                        type="button"
                        onClick={() =>
                          requiereLogin(
                            `/producto/${id}`
                          )
                        }
                        className="
                          mt-3

                          text-sky-600

                          text-sm
                          font-bold

                          flex
                          items-center
                          gap-2
                        "
                      >

                        Iniciar sesión

                        <FaArrowRight />

                      </button>

                    </div>

                  </div>

                </div>

              )}


              {/* ================================================= */}
              {/* MODALIDAD */}
              {/* ================================================= */}

              {stock >
                0 && (

                <div className="mt-7">

                  <p
                    className="
                      font-black
                      text-lg
                    "
                  >
                    ¿Cómo quieres comprarlo?
                  </p>


                  <p
                    className="
                      text-xs
                      text-slate-500

                      mt-1
                    "
                  >
                    Selecciona una opción.
                  </p>


                  <div
                    className="
                      space-y-3

                      mt-4
                    "
                  >

                    {/* SOLO PRODUCTO */}

                    <button
                      type="button"
                      onClick={() =>
                        setModalidadCompra(
                          "producto"
                        )
                      }
                      className={`
                        w-full

                        p-4

                        rounded-2xl

                        border-2

                        text-left

                        transition

                        ${
                          modalidadCompra ===
                          "producto"
                            ? `
                              border-sky-500
                              bg-sky-50
                            `
                            : `
                              border-slate-200
                              bg-white
                            `
                        }
                      `}
                    >

                      <div
                        className="
                          flex
                          items-start
                          justify-between

                          gap-3
                        "
                      >

                        <div>

                          <p
                            className="
                              font-black
                              text-slate-900
                            "
                          >
                            Solo producto
                          </p>


                          <p
                            className="
                              text-xs
                              text-slate-500

                              mt-1
                            "
                          >
                            Recibes únicamente el equipo.
                          </p>


                          <p
                            className="
                              text-lg
                              font-black

                              text-sky-600

                              mt-2
                            "
                          >
                            {formatoMoneda.format(
                              precio
                            )}
                          </p>

                        </div>


                        <SelectorActivo
                          activo={
                            modalidadCompra ===
                            "producto"
                          }
                        />

                      </div>

                    </button>


                    {/* PRODUCTO + INSTALACIÓN */}

                    {permiteInstalacion && (

                      <button
                        type="button"
                        onClick={() =>
                          setModalidadCompra(
                            "instalacion"
                          )
                        }
                        className={`
                          w-full

                          p-4

                          rounded-2xl

                          border-2

                          text-left

                          transition

                          ${
                            modalidadCompra ===
                            "instalacion"
                              ? `
                                border-emerald-500
                                bg-emerald-50
                              `
                              : `
                                border-slate-200
                                bg-white
                              `
                          }
                        `}
                      >

                        <div
                          className="
                            flex
                            items-start
                            justify-between

                            gap-3
                          "
                        >

                          <div
                            className="
                              flex
                              gap-3
                            "
                          >

                            <div
                              className="
                                w-10
                                h-10

                                rounded-xl

                                bg-emerald-500

                                text-white

                                flex
                                items-center
                                justify-center

                                shrink-0
                              "
                            >

                              <FaTools />

                            </div>


                            <div>

                              <p
                                className="
                                  font-black
                                  text-slate-900
                                "
                              >
                                Producto + instalación
                              </p>


                              <p
                                className="
                                  text-xs
                                  text-slate-500

                                  mt-1
                                "
                              >
                                Macro instala y configura el equipo.
                              </p>


                              <p
                                className="
                                  text-lg
                                  font-black

                                  text-emerald-600

                                  mt-2
                                "
                              >
                                {formatoMoneda.format(
                                  precio +
                                    precioInstalacion
                                )}
                              </p>


                              <p
                                className="
                                  text-[11px]
                                  text-slate-500

                                  mt-1
                                "
                              >
                                Producto{" "}
                                {formatoMoneda.format(
                                  precio
                                )}
                                {" + "}
                                instalación{" "}
                                {formatoMoneda.format(
                                  precioInstalacion
                                )}
                              </p>

                            </div>

                          </div>


                          <SelectorActivo
                            activo={
                              modalidadCompra ===
                              "instalacion"
                            }
                            verde
                          />

                        </div>

                      </button>

                    )}

                  </div>


                  {/* DESCRIPCIÓN INSTALACIÓN */}

                  {incluyeInstalacion && (

                    <div
                      className="
                        mt-4

                        p-4

                        rounded-2xl

                        bg-emerald-50

                        border
                        border-emerald-100
                      "
                    >

                      <div
                        className="
                          flex
                          items-center
                          gap-2
                        "
                      >

                        <FaTools
                          className="
                            text-emerald-600
                          "
                        />


                        <p
                          className="
                            font-bold
                            text-emerald-800
                          "
                        >
                          Servicio de instalación Macro
                        </p>

                      </div>


                      <p
                        className="
                          text-xs
                          text-emerald-700

                          mt-3

                          leading-relaxed

                          whitespace-pre-line
                        "
                      >
                        {producto.descripcionInstalacion ||
                          "Incluye instalación y configuración básica del producto. Macro confirmará contigo los detalles antes de realizar el servicio."
                        }
                      </p>

                    </div>

                  )}

                </div>

              )}


              {/* CANTIDAD */}

              {stock >
                0 && (

                <div className="mt-6">

                  <p
                    className="
                      text-sm
                      font-semibold

                      mb-3
                    "
                  >
                    Cantidad
                  </p>


                  <div
                    className="
                      p-2

                      rounded-xl

                      bg-white

                      border
                      border-slate-200

                      flex
                      items-center
                      justify-between
                    "
                  >

                    <button
                      type="button"
                      onClick={
                        disminuir
                      }
                      disabled={
                        cantidad <=
                        1
                      }
                      className="
                        w-10
                        h-10

                        rounded-lg

                        bg-sky-50

                        text-sky-600

                        disabled:opacity-30
                      "
                    >

                      <FaMinus
                        className="
                          mx-auto
                        "
                      />

                    </button>


                    <span
                      className="
                        text-lg
                        font-black

                        text-slate-900
                      "
                    >
                      {cantidad}
                    </span>


                    <button
                      type="button"
                      onClick={
                        aumentar
                      }
                      disabled={
                        cantidad >=
                        stock
                      }
                      className="
                        w-10
                        h-10

                        rounded-lg

                        bg-sky-50

                        text-sky-600

                        disabled:opacity-30
                      "
                    >

                      <FaPlus
                        className="
                          mx-auto
                        "
                      />

                    </button>

                  </div>

                </div>

              )}


              {/* TOTAL */}

              {stock >
                0 && (

                <div
                  className="
                    mt-5

                    p-4

                    rounded-2xl

                    bg-white

                    border
                    border-slate-200
                  "
                >

                  <div
                    className="
                      flex
                      justify-between
                      items-center

                      gap-4
                    "
                  >

                    <div>

                      <p
                        className="
                          text-xs
                          text-slate-500
                        "
                      >
                        Total
                      </p>


                      <p
                        className="
                          text-xs
                          text-slate-400

                          mt-1
                        "
                      >
                        {cantidad} ×{" "}
                        {formatoMoneda.format(
                          precioUnitario
                        )}
                      </p>

                    </div>


                    <p
                      className="
                        text-2xl
                        font-black

                        text-slate-900
                      "
                    >
                      {formatoMoneda.format(
                        totalCompra
                      )}
                    </p>

                  </div>

                </div>

              )}


              {/* ================================================= */}
              {/* COMPRAR AHORA */}
              {/* ================================================= */}

              <button
                type="button"
                disabled={
                  stock <=
                  0
                }
                onClick={
                  comprarAhora
                }
                className="
                  w-full

                  mt-6

                  bg-[#3483fa]
                  hover:bg-[#236fd8]

                  disabled:bg-slate-300

                  text-white

                  py-4

                  rounded-xl

                  font-bold

                  flex
                  items-center
                  justify-center
                  gap-2
                "
              >

                {!usuario ? (
                  <>
                    <FaLock />

                    Inicia sesión para comprar
                  </>
                ) : incluyeInstalacion ? (
                  <>
                    <FaTools />

                    Comprar con instalación
                  </>
                ) : (
                  <>
                    Comprar ahora
                  </>
                )}

              </button>


              {/* ================================================= */}
              {/* AGREGAR CARRITO */}
              {/* ================================================= */}

              <button
                type="button"
                disabled={
                  stock <=
                  0
                }
                onClick={
                  agregarCarrito
                }
                className="
                  w-full

                  mt-3

                  bg-[#e8f1ff]
                  hover:bg-[#d9e9ff]

                  disabled:bg-slate-100

                  text-[#3483fa]

                  py-4

                  rounded-xl

                  font-bold

                  flex
                  items-center
                  justify-center
                  gap-2
                "
              >

                {usuario ? (
                  <>
                    <FaShoppingCart />

                    {incluyeInstalacion
                      ? "Agregar producto + instalación"
                      : "Agregar al carrito"
                    }
                  </>
                ) : (
                  <>
                    <FaLock />

                    Inicia sesión para agregar
                  </>
                )}

              </button>


              {/* ================================================= */}
              {/* VER CARRITO */}
              {/* ================================================= */}

              <button
                type="button"
                onClick={
                  abrirCarrito
                }
                className="
                  w-full

                  mt-3

                  bg-white

                  border
                  border-sky-200

                  hover:bg-sky-50

                  text-[#3483fa]

                  py-4

                  rounded-xl

                  font-bold

                  flex
                  items-center
                  justify-center
                  gap-2
                "
              >

                {usuario ? (
                  <>
                    <FaShoppingCart />

                    Ver carrito

                    {cantidadCarrito >
                      0 && (

                      <span
                        className="
                          bg-[#3483fa]

                          text-white

                          px-2
                          py-0.5

                          rounded-full

                          text-xs
                        "
                      >
                        {cantidadCarrito}
                      </span>

                    )}
                  </>
                ) : (
                  <>
                    <FaLock />

                    Acceder al carrito
                  </>
                )}

              </button>


              {/* MENSAJE */}

              {mensaje && (

                <div
                  className="
                    mt-4

                    p-4

                    rounded-xl

                    bg-emerald-50

                    text-emerald-600

                    text-sm

                    flex
                    items-start
                    gap-2
                  "
                >

                  <FaCheckCircle
                    className="
                      shrink-0
                      mt-0.5
                    "
                  />

                  {mensaje}

                </div>

              )}


              {/* VENDEDOR */}

              <div
                className="
                  mt-7

                  p-5

                  rounded-2xl

                  border
                  border-slate-200

                  bg-white
                "
              >

                <p
                  className="
                    text-xs
                    text-slate-400

                    uppercase
                    tracking-[0.15em]

                    font-bold
                  "
                >
                  Vendido por
                </p>


                <div
                  className="
                    flex
                    items-center
                    gap-3

                    mt-4
                  "
                >

                  <div
                    className="
                      w-12
                      h-12

                      rounded-full

                      bg-sky-500

                      text-white

                      flex
                      items-center
                      justify-center
                    "
                  >

                    <FaStore />

                  </div>


                  <div>

                    <p
                      className="
                        font-black
                        text-slate-900
                      "
                    >
                      Macro
                    </p>


                    <p
                      className="
                        text-xs
                        text-slate-500
                      "
                    >
                      Tecnología & Servicios
                    </p>

                  </div>

                </div>


                <div
                  className="
                    mt-5

                    space-y-4
                  "
                >

                  {permiteInstalacion && (

                    <InfoCompra
                      icon={
                        <FaTools />
                      }
                      titulo="Instalación profesional"
                      texto="Disponible con este producto."
                    />

                  )}


                  <InfoCompra
                    icon={
                      <FaUndo />
                    }
                    titulo={
                      producto.devolucion ||
                      "Política de devolución"
                    }
                    texto="Aplican términos y condiciones."
                  />


                  <InfoCompra
                    icon={
                      <FaShieldAlt />
                    }
                    titulo={
                      producto.garantia
                        ? `Garantía: ${producto.garantia}`
                        : "Garantía disponible"
                    }
                    texto="Consulta las condiciones de garantía."
                  />

                </div>

              </div>

            </div>

          </aside>

        </section>


        {/* ================================================= */}
        {/* PRODUCTOS RELACIONADOS */}
        {/* ================================================= */}

        {productosRelacionados.length >
          0 && (

          <section
            className={`
              mt-7

              p-6
              md:p-8

              rounded-[28px]

              border

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

            <p
              className="
                text-xs

                uppercase
                tracking-[0.18em]

                text-sky-500

                font-bold
              "
            >
              También podría interesarte
            </p>


            <h2
              className="
                text-2xl
                md:text-3xl

                font-black

                mt-2
              "
            >
              Productos relacionados
            </h2>


            <p
              className="
                text-sm
                text-slate-500

                mt-1
                mb-6
              "
            >
              Más productos de {producto.categoria}.
            </p>


            <div
              className="
                grid
                sm:grid-cols-2
                lg:grid-cols-4

                gap-4
              "
            >

              {productosRelacionados.map(
                (relacionado) => (

                  <ProductoRelacionado
                    key={
                      relacionado.id
                    }
                    producto={
                      relacionado
                    }
                    onClick={() => {
                      navigate(
                        `/producto/${relacionado.id}`
                      );


                      window.scrollTo({
                        top: 0,
                        behavior:
                          "smooth",
                      });
                    }}
                  />

                )
              )}

            </div>

          </section>

        )}


        {/* ================================================= */}
        {/* DESCRIPCIÓN */}
        {/* ================================================= */}

        <section
          className={`
            mt-7

            rounded-[28px]

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
                  border-slate-200
                `
            }
          `}
        >

          <div
            className="
              p-7
              md:p-10
            "
          >

            <h2
              className="
                text-3xl
                font-black
              "
            >
              Descripción
            </h2>


            <div
              className="
                relative

                max-w-5xl

                mt-6
              "
            >

              <div
                className={`
                  text-lg

                  ${
                    modoOscuro
                      ? "text-slate-400"
                      : "text-slate-500"
                  }

                  leading-[1.85]

                  whitespace-pre-line

                  transition-all
                  duration-300

                  ${
                    descripcionExpandida
                      ? `
                        max-h-none
                      `
                      : `
                        max-h-[245px]
                        overflow-hidden
                      `
                  }
                `}
              >

                {descripcionCompleta}

              </div>


              {!descripcionExpandida &&
                descripcionEsLarga && (

                <div
                  className={`
                    pointer-events-none

                    absolute

                    left-0
                    right-0
                    bottom-0

                    h-24

                    bg-gradient-to-t

                    ${
                      modoOscuro
                        ? `
                          from-[#0b1424]
                          via-[#0b1424]/95
                        `
                        : `
                          from-white
                          via-white/90
                        `
                    }

                    to-transparent
                  `}
                />

              )}

            </div>


            {descripcionEsLarga && (

              <button
                type="button"
                onClick={() =>
                  setDescripcionExpandida(
                    (actual) =>
                      !actual
                  )
                }
                className="
                  mt-5

                  inline-flex
                  items-center
                  gap-2

                  text-sky-500

                  font-bold

                  hover:text-sky-600

                  transition
                "
              >

                {descripcionExpandida
                  ? (
                    <>
                      Ver menos

                      <FaArrowUp />
                    </>
                  )
                  : (
                    <>
                      Ver más

                      <FaArrowDown />
                    </>
                  )
                }

              </button>

            )}

          </div>


          {/* GALERÍA GRANDE */}

          {imagenes.length >
            1 && (

            <div
              className="
                border-t
                border-slate-200

                bg-white
              "
            >

              {imagenes
                .slice(1)
                .map(
                  (
                    imagen,
                    index
                  ) => (

                    <div
                      key={`${imagen}-${index}`}
                      className="
                        max-w-5xl

                        mx-auto

                        border-b
                        border-slate-100

                        last:border-b-0
                      "
                    >

                      <img
                        src={imagen}
                        alt={`${producto.nombre} ${index + 2}`}
                        className="
                          w-full

                          max-h-[850px]

                          object-contain
                        "
                      />

                    </div>

                  )
                )}

            </div>

          )}

        </section>


        {/* ================================================= */}
        {/* CARACTERÍSTICAS */}
        {/* ================================================= */}

        <section
          className={`
            mt-7

            p-7
            md:p-10

            rounded-[28px]

            border

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

          <h2
            className="
              text-3xl
              font-black
            "
          >
            Características del producto
          </h2>


          <div
            className="
              grid
              sm:grid-cols-2
              lg:grid-cols-3

              gap-4

              mt-7
            "
          >

            <Caracteristica
              titulo="Marca"
              valor={
                producto.marca ||
                "Macro"
              }
            />


            <Caracteristica
              titulo="Categoría"
              valor={
                producto.categoria ||
                "Tecnología"
              }
            />


            <Caracteristica
              titulo="SKU"
              valor={
                producto.sku ||
                "No especificado"
              }
            />


            <Caracteristica
              titulo="Garantía"
              valor={
                producto.garantia ||
                "Consultar"
              }
            />


            <Caracteristica
              titulo="Entrega"
              valor={
                producto.entrega ||
                "Consultar"
              }
            />


            <Caracteristica
              titulo="Stock"
              valor={
                stock >
                0
                  ? `${stock} unidades`
                  : "Agotado"
              }
            />


            {permiteInstalacion && (

              <Caracteristica
                titulo="Instalación Macro"
                valor={`Disponible · ${formatoMoneda.format(
                  precioInstalacion
                )}`}
              />

            )}

          </div>

        </section>


        {/* ================================================= */}
        {/* OPINIONES */}
        {/* ================================================= */}

        <section
          className={`
            mt-7

            mb-16

            p-7
            md:p-10

            rounded-[28px]

            border

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

          <h2
            className="
              text-3xl
              font-black
            "
          >
            Opiniones del producto
          </h2>


          <div
            className="
              mt-8

              grid
              md:grid-cols-[240px_1fr]

              gap-10
            "
          >

            <div>

              <div
                className="
                  flex
                  items-center
                  gap-3
                "
              >

                <span
                  className="
                    text-5xl
                    font-black

                    text-sky-500
                  "
                >
                  —
                </span>


                <div
                  className="
                    flex
                    gap-1

                    text-slate-200
                  "
                >

                  {[1, 2, 3, 4, 5].map(
                    (
                      estrella
                    ) => (

                      <FaStar
                        key={
                          estrella
                        }
                      />

                    )
                  )}

                </div>

              </div>


              <p
                className="
                  text-sm
                  text-slate-500

                  mt-3
                "
              >
                Todavía no hay calificaciones.
              </p>

            </div>


            <div
              className="
                p-7

                rounded-2xl

                bg-sky-50

                border
                border-sky-100
              "
            >

              <h3
                className="
                  text-xl
                  font-black

                  text-slate-900
                "
              >
                Sé de los primeros en comprarlo
              </h3>


              <p
                className="
                  text-slate-500

                  mt-2
                "
              >
                Los clientes de Macro podrán compartir aquí su
                experiencia con el producto y, cuando corresponda,
                con el servicio de instalación.
              </p>

            </div>

          </div>

        </section>

      </div>

    </div>
  );
}


/* ======================================================
   SELECTOR
====================================================== */

function SelectorActivo({
  activo,
  verde = false,
}) {
  return (
    <div
      className={`
        w-7
        h-7

        rounded-full

        border-2

        flex
        items-center
        justify-center

        shrink-0

        ${
          activo
            ? verde
              ? `
                bg-emerald-500
                border-emerald-500
                text-white
              `
              : `
                bg-sky-500
                border-sky-500
                text-white
              `
            : `
              bg-white
              border-slate-300
              text-transparent
            `
        }
      `}
    >

      <FaCheck
        className="
          text-xs
        "
      />

    </div>
  );
}


/* ======================================================
   PRODUCTO RELACIONADO
====================================================== */

function ProductoRelacionado({
  producto,
  onClick,
}) {
  const imagen =
    producto.imagen ||
    producto.imagenes?.[0] ||
    "";


  const precio =
    Number(
      producto.precio ||
      0
    );


  const precioAnterior =
    Number(
      producto.precioAnterior ||
      0
    );


  const descuento =
    precioAnterior >
      precio &&
    precio >
      0
      ? Math.round(
          (
            (
              precioAnterior -
              precio
            ) /
            precioAnterior
          ) *
            100
        )
      : 0;


  return (
    <article
      className="
        group

        rounded-2xl

        border
        border-slate-200

        overflow-hidden

        bg-white

        hover:shadow-xl
        hover:-translate-y-1

        transition
      "
    >

      <button
        type="button"
        onClick={
          onClick
        }
        className="
          relative

          w-full

          h-[230px]

          bg-[#f4f6f8]

          overflow-hidden
        "
      >

        {imagen ? (

          <img
            src={imagen}
            alt={
              producto.nombre
            }
            className="
              w-full
              h-full

              object-contain

              p-4

              group-hover:scale-105

              transition-transform
            "
          />

        ) : (

          <div
            className="
              w-full
              h-full

              flex
              items-center
              justify-center
            "
          >

            <FaImage
              className="
                text-4xl
                text-slate-300
              "
            />

          </div>

        )}


        {producto.permiteInstalacion && (

          <span
            className="
              absolute

              right-3
              bottom-3

              bg-emerald-500

              text-white

              px-2.5
              py-1.5

              rounded-full

              text-[9px]
              font-bold

              flex
              items-center
              gap-1
            "
          >

            <FaTools />

            Instalación

          </span>

        )}

      </button>


      <div className="p-4">

        <p
          className="
            text-xs
            text-sky-500

            font-bold
          "
        >
          {producto.categoria}
        </p>


        <button
          type="button"
          onClick={
            onClick
          }
          className="
            text-left
            w-full
          "
        >

          <h3
            className="
              mt-2

              min-h-[48px]

              line-clamp-2

              font-medium

              text-slate-800
            "
          >
            {producto.nombre}
          </h3>

        </button>


        {precioAnterior >
          precio && (

          <p
            className="
              text-xs
              text-slate-400

              line-through

              mt-4
            "
          >
            {formatoMoneda.format(
              precioAnterior
            )}
          </p>

        )}


        <div
          className="
            flex
            items-center
            flex-wrap

            gap-2

            mt-1
          "
        >

          <p
            className="
              text-2xl

              text-slate-900
            "
          >
            {formatoMoneda.format(
              precio
            )}
          </p>


          {descuento >
            0 && (

            <span
              className="
                bg-emerald-500

                text-white

                text-xs
                font-bold

                px-2
                py-1

                rounded
              "
            >
              {descuento}% OFF
            </span>

          )}

        </div>


        {producto.permiteInstalacion && (

          <p
            className="
              text-xs
              text-emerald-600

              font-semibold

              mt-3
            "
          >
            Instalación disponible
          </p>

        )}


        <button
          type="button"
          onClick={
            onClick
          }
          className="
            mt-4

            text-sm
            text-sky-500

            font-bold

            flex
            items-center
            gap-2
          "
        >

          Ver producto

          <FaArrowRight />

        </button>

      </div>

    </article>
  );
}


/* ======================================================
   INFO COMPRA
====================================================== */

function InfoCompra({
  icon,
  titulo,
  texto,
}) {
  return (
    <div
      className="
        flex
        gap-3
      "
    >

      <span
        className="
          text-emerald-500

          mt-1
        "
      >
        {icon}
      </span>


      <div>

        <p
          className="
            font-semibold

            text-sm

            text-slate-900
          "
        >
          {titulo}
        </p>


        <p
          className="
            text-xs
            text-slate-500

            mt-1

            leading-relaxed
          "
        >
          {texto}
        </p>

      </div>

    </div>
  );
}


/* ======================================================
   CARACTERÍSTICA
====================================================== */

function Caracteristica({
  titulo,
  valor,
}) {
  return (
    <div
      className="
        p-5

        rounded-2xl

        bg-sky-50/70

        border
        border-sky-100
      "
    >

      <p
        className="
          text-xs
          text-slate-400
        "
      >
        {titulo}
      </p>


      <p
        className="
          font-bold

          mt-2

          text-slate-800
        "
      >
        {valor}
      </p>

    </div>
  );
}


export default DetalleProducto;