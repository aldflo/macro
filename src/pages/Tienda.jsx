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
} from "firebase/firestore";

import {
  onAuthStateChanged,
} from "firebase/auth";

import {
  auth,
  db,
} from "../firebase.config";

import {
  FaArrowRight,
  FaBoxOpen,
  FaCamera,
  FaChevronLeft,
  FaChevronRight,
  FaImage,
  FaLaptop,
  FaMemory,
  FaMobileAlt,
  FaSearch,
  FaShoppingBag,
  FaTimes,
  FaTools,
  FaWifi,
} from "react-icons/fa";


const PRODUCTOS_POR_FILA = 5;


const formatoMoneda =
  new Intl.NumberFormat(
    "es-MX",
    {
      style: "currency",
      currency: "MXN",
      maximumFractionDigits: 2,
    }
  );


const CATEGORIAS = [
  {
    nombre: "Computación",
    titulo: "Computación",
    icon: <FaLaptop />,
  },
  {
    nombre: "Celulares y accesorios",
    titulo: "Celulares",
    icon: <FaMobileAlt />,
  },
  {
    nombre: "Cámaras y seguridad",
    titulo: "Seguridad",
    icon: <FaCamera />,
  },
  {
    nombre: "Redes y conectividad",
    titulo: "Redes y WiFi",
    icon: <FaWifi />,
  },
  {
    nombre: "Componentes",
    titulo: "Componentes",
    icon: <FaMemory />,
  },
  {
    nombre: "Tecnología",
    titulo: "Tecnología",
    icon: <FaShoppingBag />,
  },
  {
    nombre: "Otros",
    titulo: "Otros",
    icon: <FaBoxOpen />,
  },
];


function slugCategoria(texto = "") {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}


function leerCarrito() {
  try {
    const guardado =
      JSON.parse(
        localStorage.getItem(
          "macro_carrito"
        ) || "[]"
      );

    return Array.isArray(guardado)
      ? guardado
      : [];
  } catch {
    return [];
  }
}


function Tienda() {
  const navigate =
    useNavigate();

  const {
    modoOscuro = false,
  } =
    useOutletContext() || {};


  const [
    usuario,
    setUsuario,
  ] = useState(null);

  const [
    authListo,
    setAuthListo,
  ] = useState(false);


  const [
    productos,
    setProductos,
  ] = useState([]);

  const [
    cargando,
    setCargando,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    busqueda,
    setBusqueda,
  ] = useState("");

  const [
    carrito,
    setCarrito,
  ] = useState(
    () => leerCarrito()
  );


  /* ====================================================
     SABER SI HAY SESIÓN
  ==================================================== */

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        (user) => {
          setUsuario(user);
          setAuthListo(true);

          /*
            Si no hay usuario, no queremos que
            se conserve un carrito de una sesión anterior.
          */
          if (!user) {
            setCarrito([]);
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
    (destino = "/tienda") => {
      if (!authListo) {
        return false;
      }

      if (!usuario) {
        navigate(
          "/login",
          {
            state: {
              from: destino,
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
     ACTUALIZAR CARRITO
  ==================================================== */

  useEffect(() => {
    const actualizarCarrito =
      () => {
        if (!auth.currentUser) {
          setCarrito([]);
          return;
        }

        setCarrito(
          leerCarrito()
        );
      };


    window.addEventListener(
      "storage",
      actualizarCarrito
    );

    window.addEventListener(
      "macro-carrito-actualizado",
      actualizarCarrito
    );


    return () => {
      window.removeEventListener(
        "storage",
        actualizarCarrito
      );

      window.removeEventListener(
        "macro-carrito-actualizado",
        actualizarCarrito
      );
    };

  }, []);


  /* ====================================================
     FIRESTORE
  ==================================================== */

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
                id:
                  documento.id,
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
                a.fechaActualizacion
                  ?.toMillis?.() ||
                a.fechaCreacion
                  ?.toMillis?.() ||
                0;

              const fechaB =
                b.fechaActualizacion
                  ?.toMillis?.() ||
                b.fechaCreacion
                  ?.toMillis?.() ||
                0;

              return fechaB - fechaA;
            }
          );


          setProductos(lista);
          setCargando(false);
        },

        (firebaseError) => {
          console.error(
            firebaseError
          );

          setError(
            "No se pudieron cargar los productos."
          );

          setCargando(false);
        }
      );


    return () =>
      unsubscribe();

  }, []);


  /* ====================================================
     GUARDAR CARRITO
  ==================================================== */

  useEffect(() => {
    if (!usuario) {
      return;
    }

    localStorage.setItem(
      "macro_carrito",
      JSON.stringify(
        carrito
      )
    );

  }, [
    carrito,
    usuario,
  ]);


  const cantidadCarrito =
    useMemo(() => {
      return carrito.reduce(
        (total, item) =>
          total +
          Number(
            item.cantidad || 0
          ),
        0
      );
    }, [
      carrito,
    ]);


  const productosActivos =
    useMemo(() => {
      return productos.filter(
        (producto) =>
          producto.activo !== false
      );
    }, [
      productos,
    ]);


  const obtenerImagenPrincipal =
    (producto) => {
      if (producto?.imagen) {
        return producto.imagen;
      }

      if (
        Array.isArray(
          producto?.imagenes
        ) &&
        producto.imagenes.length > 0
      ) {
        return producto.imagenes[0];
      }

      return "";
    };


  const productosBuscados =
    useMemo(() => {
      const texto =
        busqueda
          .trim()
          .toLowerCase();

      if (!texto) {
        return [];
      }

      return productosActivos.filter(
        (producto) => {
          const contenido =
            [
              producto.nombre,
              producto.marca,
              producto.categoria,
              producto.descripcion,
              producto.sku,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();

          return contenido.includes(
            texto
          );
        }
      );

    }, [
      productosActivos,
      busqueda,
    ]);


  const destacados =
    useMemo(() => {
      const lista =
        productosActivos.filter(
          (producto) =>
            producto.destacado
        );

      return lista.length > 0
        ? lista.slice(0, 12)
        : productosActivos.slice(
            0,
            12
          );

    }, [
      productosActivos,
    ]);


  const obtenerProductosCategoria =
    (categoria) => {
      return productosActivos.filter(
        (producto) =>
          producto.categoria ===
          categoria
      );
    };


  const obtenerImagenCategoria =
    (categoria) => {
      const producto =
        productosActivos.find(
          (item) =>
            item.categoria ===
              categoria &&
            obtenerImagenPrincipal(
              item
            )
        );

      return producto
        ? obtenerImagenPrincipal(
            producto
          )
        : "";
    };


  const irCategoria =
    (categoria) => {
      document
        .getElementById(
          `categoria-${slugCategoria(
            categoria
          )}`
        )
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
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
     AGREGAR AL CARRITO
  ==================================================== */

  const agregarAlCarrito =
    (producto) => {
      /*
        PRIMERO comprobamos la sesión.
      */

      if (
        !requiereLogin(
          `/producto/${producto.id}`
        )
      ) {
        return;
      }


      const stock =
        Number(
          producto.stock || 0
        );

      if (stock <= 0) {
        return;
      }


      /*
        Si ofrece instalación,
        se manda al detalle para elegir.
      */

      if (
        producto.permiteInstalacion ===
        true
      ) {
        navigate(
          `/producto/${producto.id}`
        );

        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });

        return;
      }


      setCarrito(
        (actual) => {
          const existente =
            actual.find(
              (item) =>
                item.id ===
                  producto.id &&
                (
                  item.modalidad ||
                  "producto"
                ) ===
                  "producto"
            );


          if (existente) {
            return actual.map(
              (item) => {
                if (
                  item.id !==
                    producto.id ||
                  (
                    item.modalidad ||
                    "producto"
                  ) !==
                    "producto"
                ) {
                  return item;
                }

                return {
                  ...item,

                  cantidad:
                    Math.min(
                      Number(
                        item.cantidad ||
                          1
                      ) + 1,
                      stock
                    ),
                };
              }
            );
          }


          return [
            ...actual,

            {
              clave:
                `${producto.id}::producto`,

              id:
                producto.id,

              nombre:
                producto.nombre,

              precio:
                Number(
                  producto.precio || 0
                ),

              precioProducto:
                Number(
                  producto.precio || 0
                ),

              precioInstalacion: 0,

              modalidad:
                "producto",

              incluyeInstalacion:
                false,

              imagen:
                obtenerImagenPrincipal(
                  producto
                ),

              cantidad: 1,

              stock,
            },
          ];
        }
      );


      setTimeout(
        () => {
          window.dispatchEvent(
            new Event(
              "macro-carrito-actualizado"
            )
          );
        },
        50
      );
    };


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
        <div className="text-center">
          <div
            className="
              w-14
              h-14
              border-4
              border-sky-100
              border-t-sky-500
              rounded-full
              animate-spin
              mx-auto
            "
          />

          <p className="mt-4 text-slate-500">
            Cargando Macro Store...
          </p>
        </div>
      </div>
    );
  }


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
              bg-[#f4f6f8]
              text-slate-950
            `
        }
      `}
    >

      {/* ================================================= */}
      {/* CABECERA */}
      {/* ================================================= */}

      <section
        className="
          bg-gradient-to-r
          from-[#0878e8]
          via-[#0797f5]
          to-[#19b5ff]
          text-white
        "
      >

        <div
          className="
            max-w-[1450px]
            mx-auto
            px-5
            md:px-8
            py-6
          "
        >

          <div
            className="
              flex
              flex-col
              lg:flex-row
              lg:items-center
              gap-5
            "
          >

            <div
              className="
                flex
                items-center
                gap-3
                shrink-0
              "
            >

              <div
                className="
                  w-12
                  h-12
                  rounded-2xl
                  bg-white
                  text-sky-500
                  flex
                  items-center
                  justify-center
                  shadow-lg
                "
              >
                <FaShoppingBag />
              </div>


              <div>
                <p
                  className="
                    text-2xl
                    font-black
                    tracking-[-0.04em]
                  "
                >
                  Macro Store
                </p>

                <p className="text-xs text-blue-100">
                  Productos + servicios tecnológicos
                </p>
              </div>

            </div>


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
                  text-slate-400
                "
              />


              <input
                type="text"
                value={busqueda}
                onChange={(e) =>
                  setBusqueda(
                    e.target.value
                  )
                }
                placeholder="Buscar cámaras, routers, computación, accesorios..."
                className="
                  w-full
                  bg-white
                  text-slate-900
                  pl-12
                  pr-12
                  py-4
                  rounded-2xl
                  shadow
                  outline-none
                  placeholder:text-slate-400
                "
              />


              {busqueda && (
                <button
                  type="button"
                  onClick={() =>
                    setBusqueda("")
                  }
                  className="
                    absolute
                    right-4
                    top-1/2
                    -translate-y-1/2
                    text-slate-400
                  "
                >
                  <FaTimes />
                </button>
              )}

            </div>


            {/* CARRITO */}

            <button
              type="button"
              onClick={
                abrirCarrito
              }
              className="
                relative
                px-6
                py-4
                rounded-2xl
                bg-white
                text-sky-600
                font-bold
                flex
                items-center
                justify-center
                gap-2
                shadow
                hover:bg-sky-50
                transition
              "
            >

              <FaShoppingBag />

              Carrito


              {usuario &&
                cantidadCarrito > 0 && (

                <span
                  className="
                    absolute
                    -top-2
                    -right-2
                    min-w-[27px]
                    h-[27px]
                    px-2
                    rounded-full
                    bg-red-500
                    text-white
                    text-[11px]
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


          <div
            className="
              flex
              gap-6
              mt-5
              overflow-x-auto
              text-sm
              text-white/90
              font-semibold
              [&::-webkit-scrollbar]:hidden
            "
          >

            <button
              type="button"
              onClick={() =>
                navigate("/")
              }
              className="shrink-0"
            >
              Inicio
            </button>


            {CATEGORIAS.map(
              (item) => (
                <button
                  type="button"
                  key={item.nombre}
                  onClick={() =>
                    irCategoria(
                      item.nombre
                    )
                  }
                  className="shrink-0"
                >
                  {item.titulo}
                </button>
              )
            )}

          </div>

        </div>

      </section>


      {/* ================================================= */}
      {/* BÚSQUEDA */}
      {/* ================================================= */}

      {busqueda.trim() ? (

        <section
          className="
            max-w-[1450px]
            mx-auto
            px-5
            md:px-8
            py-10
          "
        >

          <div
            className="
              flex
              items-end
              justify-between
              gap-4
              mb-6
            "
          >

            <div>
              <p className="text-sm text-sky-500 font-bold">
                Resultados
              </p>

              <h2 className="text-2xl font-black mt-1">
                "{busqueda}"
              </h2>
            </div>


            <button
              type="button"
              onClick={() =>
                setBusqueda("")
              }
              className="text-sky-500 font-bold"
            >
              Limpiar
            </button>

          </div>


          {productosBuscados.length > 0 ? (

            <div
              className="
                grid
                grid-cols-2
                md:grid-cols-3
                lg:grid-cols-4
                xl:grid-cols-5
                gap-4
              "
            >

              {productosBuscados.map(
                (producto) => (
                  <ProductoCard
                    key={producto.id}
                    producto={producto}
                    imagen={
                      obtenerImagenPrincipal(
                        producto
                      )
                    }
                    verProducto={() =>
                      navigate(
                        `/producto/${producto.id}`
                      )
                    }
                    agregar={() =>
                      agregarAlCarrito(
                        producto
                      )
                    }
                    usuario={
                      usuario
                    }
                    modoOscuro={
                      modoOscuro
                    }
                  />
                )
              )}

            </div>

          ) : (

            <SinProductos
              texto="No encontramos productos con esa búsqueda."
              modoOscuro={
                modoOscuro
              }
            />

          )}

        </section>

      ) : (

        <>

          {/* HERO */}

          <section
            className="
              max-w-[1450px]
              mx-auto
              px-5
              md:px-8
              pt-7
            "
          >

            <div
              className="
                grid
                lg:grid-cols-[1.3fr_.7fr]
                gap-4
              "
            >

              <div
                className="
                  relative
                  min-h-[320px]
                  overflow-hidden
                  rounded-[28px]
                  bg-gradient-to-r
                  from-[#071221]
                  via-[#09366b]
                  to-[#0878e8]
                  text-white
                  p-8
                  md:p-11
                "
              >

                <div
                  className="
                    absolute
                    -right-28
                    -top-28
                    w-[420px]
                    h-[420px]
                    rounded-full
                    bg-sky-400/20
                    blur-3xl
                  "
                />


                <div
                  className="
                    relative
                    z-10
                    max-w-xl
                  "
                >

                  <p
                    className="
                      text-xs
                      uppercase
                      tracking-[0.2em]
                      text-sky-300
                      font-bold
                    "
                  >
                    Macro Store
                  </p>


                  <h1
                    className="
                      text-4xl
                      md:text-6xl
                      font-black
                      tracking-[-0.05em]
                      leading-[1]
                      mt-4
                    "
                  >
                    Tecnología

                    <span className="block text-sky-400">
                      + servicio.
                    </span>
                  </h1>


                  <p
                    className="
                      text-slate-300
                      text-lg
                      leading-relaxed
                      mt-5
                    "
                  >
                    Compra equipos tecnológicos y,
                    cuando esté disponible, deja que
                    Macro se encargue también de su
                    instalación y configuración.
                  </p>


                  <button
                    type="button"
                    onClick={() =>
                      document
                        .getElementById(
                          "ofertas"
                        )
                        ?.scrollIntoView({
                          behavior:
                            "smooth",
                        })
                    }
                    className="
                      mt-7
                      bg-white
                      text-sky-600
                      px-6
                      py-4
                      rounded-xl
                      font-bold
                      flex
                      items-center
                      gap-2
                    "
                  >
                    Explorar productos
                    <FaArrowRight />
                  </button>

                </div>

              </div>


              <div className="grid gap-4">

                <Promo
                  titulo="Cámaras + instalación"
                  texto="Compra el equipo y solicita instalación profesional."
                  icon={<FaCamera />}
                  onClick={() =>
                    irCategoria(
                      "Cámaras y seguridad"
                    )
                  }
                  modoOscuro={
                    modoOscuro
                  }
                />


                <Promo
                  titulo="Redes y WiFi"
                  texto="Routers, conectividad, configuración e instalación."
                  icon={<FaWifi />}
                  onClick={() =>
                    irCategoria(
                      "Redes y conectividad"
                    )
                  }
                  modoOscuro={
                    modoOscuro
                  }
                />

              </div>

            </div>

          </section>


          {/* CATEGORÍAS */}

          <section
            className="
              max-w-[1450px]
              mx-auto
              px-5
              md:px-8
              py-12
            "
          >

            <h2
              className="
                text-2xl
                md:text-3xl
                font-black
                mb-6
              "
            >
              Más categorías destacadas
            </h2>


            <div
              className="
                grid
                grid-cols-2
                sm:grid-cols-3
                md:grid-cols-4
                lg:grid-cols-7
                gap-3
              "
            >

              {CATEGORIAS.map(
                (item) => {
                  const imagen =
                    obtenerImagenCategoria(
                      item.nombre
                    );

                  return (
                    <button
                      type="button"
                      key={item.nombre}
                      onClick={() =>
                        irCategoria(
                          item.nombre
                        )
                      }
                      className={`
                        overflow-hidden
                        rounded-2xl
                        border
                        transition-all
                        hover:-translate-y-1
                        hover:shadow-lg

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
                          h-[135px]
                          bg-[#f1f4f7]
                          flex
                          items-center
                          justify-center
                          overflow-hidden
                        "
                      >

                        {imagen ? (
                          <img
                            src={imagen}
                            alt={item.titulo}
                            className="
                              w-full
                              h-full
                              object-contain
                              p-3
                            "
                          />
                        ) : (
                          <span className="text-4xl text-sky-500">
                            {item.icon}
                          </span>
                        )}

                      </div>


                      <div
                        className="
                          min-h-[46px]
                          bg-[#1267e8]
                          text-white
                          px-2
                          py-2
                          text-xs
                          font-black
                          uppercase
                          flex
                          items-center
                          justify-center
                          text-center
                        "
                      >
                        {item.titulo}
                      </div>

                    </button>
                  );
                }
              )}

            </div>

          </section>


          {/* OFERTAS */}

          <section
            id="ofertas"
            className="
              max-w-[1450px]
              mx-auto
              px-5
              md:px-8
              pb-10
            "
          >

            <TituloSeccion
              titulo="Ofertas Macro"
              texto="Productos recomendados y destacados"
            />


            {destacados.length > 0 ? (

              <CarruselProductos
                productos={
                  destacados
                }
                navigate={
                  navigate
                }
                agregarAlCarrito={
                  agregarAlCarrito
                }
                obtenerImagenPrincipal={
                  obtenerImagenPrincipal
                }
                usuario={
                  usuario
                }
                modoOscuro={
                  modoOscuro
                }
              />

            ) : (

              <SinProductos
                texto="Todavía no hay productos publicados."
                modoOscuro={
                  modoOscuro
                }
              />

            )}

          </section>


          {/* POR CATEGORÍA */}

          {CATEGORIAS.map(
            (
              categoria,
              index
            ) => {
              const lista =
                obtenerProductosCategoria(
                  categoria.nombre
                );

              if (
                lista.length === 0
              ) {
                return null;
              }


              return (
                <section
                  id={`categoria-${slugCategoria(
                    categoria.nombre
                  )}`}
                  key={
                    categoria.nombre
                  }
                  className="
                    max-w-[1450px]
                    mx-auto
                    px-5
                    md:px-8
                    py-8
                    scroll-mt-28
                  "
                >

                  <div
                    className={`
                      rounded-[26px]
                      mb-6
                      p-6
                      md:p-8
                      text-white
                      flex
                      items-center
                      justify-between
                      gap-5

                      ${
                        index % 2 === 0
                          ? `
                            bg-gradient-to-r
                            from-[#0959bd]
                            to-[#0ea5e9]
                          `
                          : `
                            bg-gradient-to-r
                            from-[#071221]
                            to-[#0878e8]
                          `
                      }
                    `}
                  >

                    <div>
                      <p
                        className="
                          text-xs
                          uppercase
                          tracking-[0.18em]
                          text-blue-100
                          font-bold
                        "
                      >
                        Categoría Macro
                      </p>


                      <h2
                        className="
                          text-2xl
                          md:text-4xl
                          font-black
                          mt-2
                        "
                      >
                        {categoria.titulo}
                      </h2>


                      <p className="text-blue-100 mt-2">
                        Encuentra productos de{" "}
                        {categoria.titulo.toLowerCase()}.
                      </p>
                    </div>


                    <div
                      className="
                        hidden
                        md:flex
                        w-20
                        h-20
                        rounded-3xl
                        bg-white/10
                        text-3xl
                        items-center
                        justify-center
                      "
                    >
                      {categoria.icon}
                    </div>

                  </div>


                  <CarruselProductos
                    productos={
                      lista
                    }
                    navigate={
                      navigate
                    }
                    agregarAlCarrito={
                      agregarAlCarrito
                    }
                    obtenerImagenPrincipal={
                      obtenerImagenPrincipal
                    }
                    usuario={
                      usuario
                    }
                    modoOscuro={
                      modoOscuro
                    }
                  />

                </section>
              );
            }
          )}


          {/* TODOS */}

          <section
            className="
              max-w-[1450px]
              mx-auto
              px-5
              md:px-8
              pt-12
              pb-24
            "
          >

            <TituloSeccion
              titulo="Todos los productos"
              texto={`${productosActivos.length} productos en Macro Store`}
            />


            <div
              className="
                grid
                grid-cols-2
                md:grid-cols-3
                lg:grid-cols-4
                xl:grid-cols-5
                gap-4
              "
            >

              {productosActivos.map(
                (producto) => (
                  <ProductoCard
                    key={producto.id}
                    producto={producto}
                    imagen={
                      obtenerImagenPrincipal(
                        producto
                      )
                    }
                    verProducto={() =>
                      navigate(
                        `/producto/${producto.id}`
                      )
                    }
                    agregar={() =>
                      agregarAlCarrito(
                        producto
                      )
                    }
                    usuario={
                      usuario
                    }
                    modoOscuro={
                      modoOscuro
                    }
                  />
                )
              )}

            </div>

          </section>

        </>
      )}


      {error && (
        <div
          className="
            fixed
            bottom-5
            left-1/2
            -translate-x-1/2
            z-50
            bg-red-500
            text-white
            px-5
            py-3
            rounded-xl
            shadow-xl
          "
        >
          {error}
        </div>
      )}

    </div>
  );
}


function TituloSeccion({
  titulo,
  texto,
}) {
  return (
    <div
      className="
        flex
        items-end
        justify-between
        gap-5
        mb-5
      "
    >
      <div>
        <h2 className="text-2xl md:text-3xl font-black">
          {titulo}
        </h2>

        <p className="text-sm text-slate-500 mt-1">
          {texto}
        </p>
      </div>
    </div>
  );
}


function Promo({
  titulo,
  texto,
  icon,
  onClick,
  modoOscuro,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        group
        p-6
        rounded-[26px]
        border
        text-left
        flex
        items-center
        justify-between
        gap-4
        transition
        hover:-translate-y-1
        hover:shadow-lg

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

      <div>
        <h3 className="text-xl font-black">
          {titulo}
        </h3>

        <p className="text-sm text-slate-500 mt-2">
          {texto}
        </p>

        <span
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
          Ver productos
          <FaArrowRight />
        </span>
      </div>


      <div
        className="
          w-16
          h-16
          rounded-2xl
          bg-sky-500/10
          text-sky-500
          text-2xl
          shrink-0
          flex
          items-center
          justify-center
        "
      >
        {icon}
      </div>

    </button>
  );
}


function CarruselProductos({
  productos,
  navigate,
  agregarAlCarrito,
  obtenerImagenPrincipal,
  usuario,
  modoOscuro,
}) {
  const [
    inicio,
    setInicio,
  ] = useState(0);


  useEffect(() => {
    setInicio(0);
  }, [
    productos,
  ]);


  const visibles =
    productos.slice(
      inicio,
      inicio +
        PRODUCTOS_POR_FILA
    );


  const puedeAnterior =
    inicio > 0;


  const puedeSiguiente =
    inicio +
      PRODUCTOS_POR_FILA <
    productos.length;


  return (
    <div className="relative">

      <div
        className="
          grid
          grid-cols-2
          md:grid-cols-3
          lg:grid-cols-4
          xl:grid-cols-5
          gap-4
        "
      >

        {visibles.map(
          (producto) => (
            <ProductoCard
              key={producto.id}
              producto={producto}
              imagen={
                obtenerImagenPrincipal(
                  producto
                )
              }
              verProducto={() =>
                navigate(
                  `/producto/${producto.id}`
                )
              }
              agregar={() =>
                agregarAlCarrito(
                  producto
                )
              }
              usuario={
                usuario
              }
              modoOscuro={
                modoOscuro
              }
            />
          )
        )}

      </div>


      {puedeAnterior && (
        <button
          type="button"
          onClick={() =>
            setInicio(
              Math.max(
                0,
                inicio -
                  PRODUCTOS_POR_FILA
              )
            )
          }
          className="
            hidden
            lg:flex
            absolute
            left-[-22px]
            top-1/2
            -translate-y-1/2
            w-12
            h-12
            rounded-full
            bg-white
            border
            border-slate-200
            text-sky-500
            shadow-xl
            items-center
            justify-center
            z-20
          "
        >
          <FaChevronLeft />
        </button>
      )}


      {puedeSiguiente && (
        <button
          type="button"
          onClick={() =>
            setInicio(
              Math.min(
                Math.max(
                  0,
                  productos.length -
                    PRODUCTOS_POR_FILA
                ),
                inicio +
                  PRODUCTOS_POR_FILA
              )
            )
          }
          className="
            hidden
            lg:flex
            absolute
            right-[-22px]
            top-1/2
            -translate-y-1/2
            w-12
            h-12
            rounded-full
            bg-white
            border
            border-slate-200
            text-sky-500
            shadow-xl
            items-center
            justify-center
            z-20
          "
        >
          <FaChevronRight />
        </button>
      )}

    </div>
  );
}


function ProductoCard({
  producto,
  imagen,
  verProducto,
  agregar,
  usuario,
  modoOscuro,
}) {
  const stock =
    Number(
      producto.stock || 0
    );


  const tieneInstalacion =
    producto.permiteInstalacion ===
    true;


  const costoInstalacion =
    Number(
      producto.precioInstalacion ||
        0
    );


  return (
    <article
      className={`
        group
        overflow-hidden
        rounded-2xl
        border
        min-h-[470px]
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
            `
            : `
              bg-white
              border-slate-200
            `
        }
      `}
    >

      <button
        type="button"
        onClick={verProducto}
        className="
          relative
          h-[220px]
          bg-[#f2f4f7]
          overflow-hidden
          flex
          items-center
          justify-center
        "
      >

        {imagen ? (
          <img
            src={imagen}
            alt={
              producto.nombre ||
              "Producto"
            }
            className="
              w-full
              h-full
              object-contain
              p-4
              transition-transform
              duration-500
              group-hover:scale-105
            "
          />
        ) : (
          <FaImage className="text-5xl text-slate-300" />
        )}


        {producto.destacado && (
          <span
            className="
              absolute
              left-3
              top-3
              bg-[#1176ed]
              text-white
              px-3
              py-1.5
              rounded-md
              text-[9px]
              font-black
              uppercase
            "
          >
            Oferta Macro
          </span>
        )}


        {tieneInstalacion && (
          <span
            className="
              absolute
              right-3
              bottom-3
              bg-emerald-500
              text-white
              px-3
              py-1.5
              rounded-full
              text-[9px]
              font-black
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


      <div
        className="
          p-4
          flex
          flex-col
          flex-1
        "
      >

        <p
          className="
            text-[10px]
            uppercase
            tracking-[0.12em]
            text-sky-500
            font-bold
          "
        >
          {producto.categoria ||
            "Tecnología"}
        </p>


        <button
          type="button"
          onClick={verProducto}
          className="text-left"
        >
          <h3
            className="
              text-sm
              md:text-base
              font-medium
              leading-snug
              mt-2
              line-clamp-2
            "
          >
            {producto.nombre}
          </h3>
        </button>


        {producto.marca && (
          <p className="text-xs text-slate-400 mt-1">
            {producto.marca}
          </p>
        )}


        <div className="mt-4">

          <p className="text-2xl font-normal">
            {formatoMoneda.format(
              Number(
                producto.precio || 0
              )
            )}
          </p>


          {tieneInstalacion && (
            <div
              className="
                mt-3
                px-3
                py-2
                rounded-xl
                bg-emerald-50
                border
                border-emerald-100
              "
            >
              <p
                className="
                  text-[11px]
                  text-emerald-700
                  font-bold
                  flex
                  items-center
                  gap-1
                "
              >
                <FaTools />
                Instalación disponible
              </p>

              <p className="text-[10px] text-emerald-600 mt-1">
                +{" "}
                {formatoMoneda.format(
                  costoInstalacion
                )}
              </p>
            </div>
          )}


          <p
            className={`
              text-xs
              mt-2
              font-semibold

              ${
                stock > 0
                  ? "text-emerald-600"
                  : "text-red-500"
              }
            `}
          >
            {stock > 0
              ? `Disponible · ${stock} en stock`
              : "Agotado"
            }
          </p>

        </div>


        <button
          type="button"
          disabled={
            stock <= 0
          }
          onClick={agregar}
          className="
            mt-auto
            pt-4
            text-sky-600
            disabled:text-slate-300
            text-sm
            font-bold
            text-left
          "
        >
          {stock <= 0
            ? "Sin existencia"
            : !usuario
            ? "Inicia sesión para comprar →"
            : tieneInstalacion
            ? "Ver opciones de compra →"
            : "Agregar al carrito"
          }
        </button>

      </div>

    </article>
  );
}


function SinProductos({
  texto,
  modoOscuro,
}) {
  return (
    <div
      className={`
        p-14
        rounded-3xl
        border
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
      <FaShoppingBag
        className="
          mx-auto
          text-5xl
          text-slate-300
        "
      />

      <p className="mt-4 text-slate-500">
        {texto}
      </p>
    </div>
  );
}


export default Tienda;