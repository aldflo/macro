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
  FaArrowLeft,
  FaArrowRight,
  FaBox,
  FaCheck,
  FaMinus,
  FaPlus,
  FaShieldAlt,
  FaShoppingBag,
  FaShoppingCart,
  FaStore,
  FaTools,
  FaTrash,
  FaTruck,
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

function obtenerCarritoGuardado() {
  try {
    const guardado =
      JSON.parse(
        localStorage.getItem(
          "macro_carrito"
        ) || "[]"
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
   NORMALIZAR PRODUCTO
====================================================== */

function normalizarProducto(
  producto
) {
  const modalidad =
    producto.modalidad ||
    (
      producto.incluyeInstalacion
        ? "instalacion"
        : "producto"
    );


  const incluyeInstalacion =
    modalidad ===
    "instalacion";


  const precioProducto =
    Number(
      producto.precioProducto ??
      producto.precio ??
      0
    );


  const precioInstalacion =
    incluyeInstalacion
      ? Number(
          producto.precioInstalacion ||
          0
        )
      : 0;


  const precioFinal =
    Number(
      producto.precio ??
      (
        precioProducto +
        precioInstalacion
      )
    );


  return {
    ...producto,

    modalidad,

    incluyeInstalacion,

    precioProducto,

    precioInstalacion,

    precio:
      precioFinal,

    cantidad:
      Math.max(
        1,
        Number(
          producto.cantidad ||
          1
        )
      ),

    stock:
      Math.max(
        0,
        Number(
          producto.stock ||
          0
        )
      ),

    clave:
      producto.clave ||
      `${producto.id}::${modalidad}`,
  };
}


/* ======================================================
   CARRITO
====================================================== */

function Carrito() {
  const navigate =
    useNavigate();


  const {
    modoOscuro = false,
  } =
    useOutletContext() || {};


  const [
    carrito,
    setCarrito,
  ] = useState(
    () =>
      obtenerCarritoGuardado()
        .map(
          normalizarProducto
        )
  );


  const [
    mensaje,
    setMensaje,
  ] = useState("");


  /* ====================================================
     GUARDAR LOCALSTORAGE
  ==================================================== */

  useEffect(() => {
    localStorage.setItem(
      "macro_carrito",
      JSON.stringify(
        carrito
      )
    );


    /*
      Esto nos servirá después para actualizar
      el contador del Navbar automáticamente.
    */

    window.dispatchEvent(
      new Event(
        "macro-carrito-actualizado"
      )
    );

  }, [
    carrito,
  ]);


  /* ====================================================
     CANTIDAD TOTAL
  ==================================================== */

  const totalProductos =
    useMemo(() => {
      return carrito.reduce(
        (
          total,
          producto
        ) =>
          total +
          Number(
            producto.cantidad ||
            0
          ),

        0
      );

    }, [
      carrito,
    ]);


  /* ====================================================
     SUBTOTAL DE EQUIPOS
  ==================================================== */

  const subtotalProductos =
    useMemo(() => {
      return carrito.reduce(
        (
          total,
          producto
        ) => {
          const cantidad =
            Number(
              producto.cantidad ||
              1
            );

          const precioProducto =
            Number(
              producto.precioProducto ??
              producto.precio ??
              0
            );

          return (
            total +
            precioProducto *
              cantidad
          );
        },

        0
      );

    }, [
      carrito,
    ]);


  /* ====================================================
     SUBTOTAL INSTALACIONES
  ==================================================== */

  const subtotalInstalacion =
    useMemo(() => {
      return carrito.reduce(
        (
          total,
          producto
        ) => {
          if (
            !producto.incluyeInstalacion
          ) {
            return total;
          }


          const cantidad =
            Number(
              producto.cantidad ||
              1
            );


          const precioInstalacion =
            Number(
              producto.precioInstalacion ||
              0
            );


          return (
            total +
            precioInstalacion *
              cantidad
          );
        },

        0
      );

    }, [
      carrito,
    ]);


  /* ====================================================
     TOTAL
  ==================================================== */

  const total =
    subtotalProductos +
    subtotalInstalacion;


  /* ====================================================
     AUMENTAR CANTIDAD
  ==================================================== */

  const aumentarCantidad =
    (clave) => {
      setCarrito(
        (actual) =>
          actual.map(
            (producto) => {
              if (
                producto.clave !==
                clave
              ) {
                return producto;
              }


              const stock =
                Number(
                  producto.stock ||
                  0
                );


              const cantidadActual =
                Number(
                  producto.cantidad ||
                  1
                );


              if (
                stock > 0 &&
                cantidadActual >=
                  stock
              ) {
                return producto;
              }


              return {
                ...producto,

                cantidad:
                  cantidadActual +
                  1,
              };
            }
          )
      );
    };


  /* ====================================================
     DISMINUIR
  ==================================================== */

  const disminuirCantidad =
    (clave) => {
      setCarrito(
        (actual) =>
          actual.map(
            (producto) => {
              if (
                producto.clave !==
                clave
              ) {
                return producto;
              }


              return {
                ...producto,

                cantidad:
                  Math.max(
                    1,

                    Number(
                      producto.cantidad ||
                      1
                    ) -
                      1
                  ),
              };
            }
          )
      );
    };


  /* ====================================================
     ELIMINAR
  ==================================================== */

  const eliminarProducto =
    (clave) => {
      setCarrito(
        (actual) =>
          actual.filter(
            (producto) =>
              producto.clave !==
              clave
          )
      );
    };


  /* ====================================================
     VACIAR
  ==================================================== */

  const vaciarCarrito =
    () => {
      if (
        carrito.length ===
        0
      ) {
        return;
      }


      const confirmar =
        window.confirm(
          "¿Quieres eliminar todos los productos del carrito?"
        );


      if (!confirmar) {
        return;
      }


      setCarrito([]);

      setMensaje(
        "Carrito vaciado."
      );


      setTimeout(
        () =>
          setMensaje(""),
        2500
      );
    };


  /* ====================================================
     IR AL PRODUCTO
  ==================================================== */

  const verProducto =
    (producto) => {
      if (
        !producto.id
      ) {
        return;
      }


      navigate(
        `/producto/${producto.id}`
      );


      window.scrollTo({
        top: 0,

        behavior:
          "smooth",
      });
    };


  /* ====================================================
     CONTINUAR COMPRA

     Todavía no tenemos Checkout.
     Por ahora dejamos el carrito preparado.
  ==================================================== */

  const continuarCompra =
    () => {
      if (
        carrito.length ===
        0
      ) {
        return;
      }


      setMensaje(
        "Tu carrito está listo. El siguiente paso será crear el proceso de pedido y pago."
      );


      setTimeout(
        () =>
          setMensaje(""),
        4500
      );
    };


  /* ====================================================
     CARRITO VACÍO
  ==================================================== */

  if (
    carrito.length ===
    0
  ) {
    return (
      <div
        className={`
          min-h-screen

          px-5
          py-12

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
            max-w-3xl

            mx-auto
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

              font-bold

              mb-7
            "
          >

            <FaArrowLeft />

            Volver a Macro Store

          </button>


          <div
            className={`
              rounded-[32px]

              border

              p-10
              md:p-16

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
                w-24
                h-24

                mx-auto

                rounded-full

                bg-sky-50

                flex
                items-center
                justify-center
              "
            >

              <FaShoppingCart
                className="
                  text-4xl
                  text-sky-500
                "
              />

            </div>


            <h1
              className="
                text-3xl
                md:text-4xl

                font-black

                tracking-[-0.04em]

                mt-7
              "
            >
              Tu carrito está vacío
            </h1>


            <p
              className="
                text-slate-500

                mt-3

                max-w-lg

                mx-auto

                leading-relaxed
              "
            >
              Explora Macro Store y agrega productos,
              equipos o soluciones con instalación profesional.
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

                bg-sky-500
                hover:bg-sky-600

                text-white

                px-8
                py-4

                rounded-xl

                font-bold

                inline-flex
                items-center
                gap-2
              "
            >

              Ir a la tienda

              <FaArrowRight />

            </button>

          </div>

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

        py-8

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
          max-w-[1400px]

          mx-auto

          px-5
          md:px-8
        "
      >

        {/* ================================================= */}
        {/* VOLVER */}
        {/* ================================================= */}

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

            font-bold

            mb-6
          "
        >

          <FaArrowLeft />

          Seguir comprando

        </button>


        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <div
          className="
            flex
            flex-col
            md:flex-row
            md:items-end
            md:justify-between

            gap-5

            mb-7
          "
        >

          <div>

            <p
              className="
                text-xs

                uppercase

                tracking-[0.2em]

                text-sky-500

                font-bold
              "
            >
              Macro Store
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
              Tu carrito
            </h1>


            <p
              className="
                text-slate-500

                mt-2
              "
            >
              {totalProductos}{" "}
              {totalProductos ===
              1
                ? "artículo"
                : "artículos"}
            </p>

          </div>


          <button
            type="button"
            onClick={
              vaciarCarrito
            }
            className="
              text-red-500

              text-sm
              font-semibold

              flex
              items-center
              gap-2
            "
          >

            <FaTrash />

            Vaciar carrito

          </button>

        </div>


        {/* ================================================= */}
        {/* MENSAJE */}
        {/* ================================================= */}

        {mensaje && (

          <div
            className="
              mb-6

              p-4

              bg-emerald-50

              border
              border-emerald-200

              rounded-2xl

              text-emerald-700

              flex
              items-start
              gap-3
            "
          >

            <FaCheck
              className="
                mt-1
                shrink-0
              "
            />

            <span>
              {mensaje}
            </span>

          </div>

        )}


        {/* ================================================= */}
        {/* LAYOUT */}
        {/* ================================================= */}

        <div
          className="
            grid

            lg:grid-cols-[1fr_390px]

            gap-6

            items-start
          "
        >

          {/* ================================================= */}
          {/* PRODUCTOS */}
          {/* ================================================= */}

          <section
            className="
              space-y-4
            "
          >

            {carrito.map(
              (producto) => (

                <ProductoCarrito
                  key={
                    producto.clave
                  }
                  producto={
                    producto
                  }
                  aumentar={() =>
                    aumentarCantidad(
                      producto.clave
                    )
                  }
                  disminuir={() =>
                    disminuirCantidad(
                      producto.clave
                    )
                  }
                  eliminar={() =>
                    eliminarProducto(
                      producto.clave
                    )
                  }
                  ver={() =>
                    verProducto(
                      producto
                    )
                  }
                  modoOscuro={
                    modoOscuro
                  }
                />

              )
            )}

          </section>


          {/* ================================================= */}
          {/* RESUMEN */}
          {/* ================================================= */}

          <aside
            className={`
              rounded-[28px]

              border

              overflow-hidden

              lg:sticky
              lg:top-28

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
                p-6

                border-b
                border-slate-200
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
                    w-11
                    h-11

                    rounded-xl

                    bg-sky-500/10

                    text-sky-500

                    flex
                    items-center
                    justify-center
                  "
                >

                  <FaShoppingBag />

                </div>


                <div>

                  <p
                    className="
                      text-lg
                      font-black
                    "
                  >
                    Resumen de compra
                  </p>

                  <p
                    className="
                      text-xs
                      text-slate-500
                    "
                  >
                    Macro Tecnología & Servicios
                  </p>

                </div>

              </div>

            </div>


            <div className="p-6">

              {/* EQUIPOS */}

              <FilaResumen
                titulo="Productos"
                valor={
                  formatoMoneda.format(
                    subtotalProductos
                  )
                }
              />


              {/* INSTALACIÓN */}

              {subtotalInstalacion >
                0 && (

                <FilaResumen
                  titulo="Servicios de instalación"
                  valor={
                    formatoMoneda.format(
                      subtotalInstalacion
                    )
                  }
                  destacado
                />

              )}


              <div
                className="
                  my-5

                  border-t
                  border-slate-200
                "
              />


              {/* TOTAL */}

              <div
                className="
                  flex
                  items-end
                  justify-between

                  gap-4
                "
              >

                <div>

                  <p
                    className="
                      font-black
                      text-lg
                    "
                  >
                    Total
                  </p>

                  <p
                    className="
                      text-xs
                      text-slate-500

                      mt-1
                    "
                  >
                    Antes de envío
                  </p>

                </div>


                <p
                  className="
                    text-3xl

                    font-black

                    text-slate-900
                  "
                >
                  {formatoMoneda.format(
                    total
                  )}
                </p>

              </div>


              {/* BOTÓN */}

              <button
                type="button"
                onClick={
                  continuarCompra
                }
                className="
                  w-full

                  mt-7

                  bg-[#3483fa]
                  hover:bg-[#236fd8]

                  text-white

                  py-4

                  rounded-xl

                  font-bold

                  flex
                  items-center
                  justify-center
                  gap-2

                  transition
                "
              >

                Continuar compra

                <FaArrowRight />

              </button>


              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/tienda"
                  )
                }
                className="
                  w-full

                  mt-3

                  bg-sky-50

                  text-sky-600

                  py-4

                  rounded-xl

                  font-bold
                "
              >
                Agregar más productos
              </button>


              {/* BENEFICIOS */}

              <div
                className="
                  mt-7
                  pt-6

                  border-t
                  border-slate-200

                  space-y-5
                "
              >

                <Beneficio
                  icon={
                    <FaShieldAlt />
                  }
                  titulo="Compra segura"
                  texto="Tu pedido se confirma antes de procesarse."
                />


                <Beneficio
                  icon={
                    <FaTruck />
                  }
                  titulo="Entrega coordinada"
                  texto="Las condiciones de envío se confirman según tu ubicación."
                />


                {subtotalInstalacion >
                  0 && (

                  <Beneficio
                    icon={
                      <FaTools />
                    }
                    titulo="Instalación Macro"
                    texto="El servicio técnico se coordina contigo después de confirmar el pedido."
                  />

                )}

              </div>


              {/* VENDEDOR */}

              <div
                className="
                  mt-7

                  p-4

                  rounded-2xl

                  bg-sky-50

                  border
                  border-sky-100
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
                      w-11
                      h-11

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

              </div>

            </div>

          </aside>

        </div>

      </div>

    </div>
  );
}


/* ======================================================
   PRODUCTO DEL CARRITO
====================================================== */

function ProductoCarrito({
  producto,
  aumentar,
  disminuir,
  eliminar,
  ver,
  modoOscuro,
}) {
  const cantidad =
    Number(
      producto.cantidad ||
      1
    );


  const stock =
    Number(
      producto.stock ||
      0
    );


  const precioProducto =
    Number(
      producto.precioProducto ??
      producto.precio ??
      0
    );


  const precioInstalacion =
    producto.incluyeInstalacion
      ? Number(
          producto.precioInstalacion ||
          0
        )
      : 0;


  const precioUnitario =
    precioProducto +
    precioInstalacion;


  const subtotal =
    precioUnitario *
    cantidad;


  return (
    <article
      className={`
        rounded-[26px]

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
          grid

          sm:grid-cols-[180px_1fr]

          gap-5

          p-5
          md:p-6
        "
      >

        {/* FOTO */}

        <button
          type="button"
          onClick={
            ver
          }
          className="
            relative

            w-full
            h-[180px]

            rounded-2xl

            bg-[#f5f7fa]

            overflow-hidden

            flex
            items-center
            justify-center
          "
        >

          {producto.imagen ? (

            <img
              src={
                producto.imagen
              }
              alt={
                producto.nombre
              }
              className="
                w-full
                h-full

                object-contain

                p-3
              "
            />

          ) : (

            <FaBox
              className="
                text-5xl
                text-slate-300
              "
            />

          )}


          {producto.incluyeInstalacion && (

            <span
              className="
                absolute

                left-3
                bottom-3

                px-3
                py-1.5

                rounded-full

                bg-emerald-500

                text-white

                text-[10px]
                font-bold

                flex
                items-center
                gap-1
              "
            >

              <FaTools />

              Con instalación

            </span>

          )}

        </button>


        {/* INFO */}

        <div
          className="
            flex
            flex-col
          "
        >

          <div
            className="
              flex
              items-start
              justify-between

              gap-5
            "
          >

            <div>

              <button
                type="button"
                onClick={
                  ver
                }
                className="
                  text-left
                "
              >

                <h2
                  className="
                    text-xl
                    md:text-2xl

                    font-black

                    leading-tight
                  "
                >
                  {producto.nombre}
                </h2>

              </button>


              <p
                className="
                  text-xs

                  text-slate-500

                  mt-2
                "
              >

                {producto.incluyeInstalacion
                  ? "Producto + instalación Macro"
                  : "Solo producto"
                }

              </p>

            </div>


            <button
              type="button"
              onClick={
                eliminar
              }
              className="
                w-10
                h-10

                rounded-full

                bg-red-50

                text-red-500

                flex
                items-center
                justify-center

                hover:bg-red-100

                shrink-0
              "
            >

              <FaTrash />

            </button>

          </div>


          {/* DESGLOSE */}

          <div
            className="
              mt-5

              grid
              sm:grid-cols-2

              gap-3
            "
          >

            <DatoPrecio
              titulo="Producto"
              valor={
                formatoMoneda.format(
                  precioProducto
                )
              }
            />


            {producto.incluyeInstalacion && (

              <DatoPrecio
                titulo="Instalación Macro"
                valor={
                  formatoMoneda.format(
                    precioInstalacion
                  )
                }
                instalacion
              />

            )}

          </div>


          {/* DESCRIPCIÓN INSTALACIÓN */}

          {producto.incluyeInstalacion &&
            producto.descripcionInstalacion && (

            <div
              className="
                mt-4

                p-4

                rounded-xl

                bg-emerald-50

                border
                border-emerald-100
              "
            >

              <p
                className="
                  text-xs

                  text-emerald-800

                  font-bold

                  flex
                  items-center
                  gap-2
                "
              >

                <FaTools />

                Servicio seleccionado

              </p>


              <p
                className="
                  text-xs
                  text-emerald-700

                  leading-relaxed

                  whitespace-pre-line

                  mt-2

                  line-clamp-3
                "
              >
                {producto.descripcionInstalacion}
              </p>

            </div>

          )}


          {/* PARTE INFERIOR */}

          <div
            className="
              mt-auto
              pt-6

              flex
              flex-col
              md:flex-row

              md:items-end
              md:justify-between

              gap-5
            "
          >

            {/* CANTIDAD */}

            <div>

              <p
                className="
                  text-xs
                  text-slate-500

                  mb-2
                "
              >
                Cantidad
              </p>


              <div
                className="
                  inline-flex
                  items-center

                  border
                  border-slate-200

                  rounded-xl

                  p-1

                  bg-white
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

                    flex
                    items-center
                    justify-center
                  "
                >

                  <FaMinus />

                </button>


                <span
                  className="
                    min-w-[52px]

                    text-center

                    text-slate-900

                    font-black
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
                    stock >
                      0 &&
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

                    flex
                    items-center
                    justify-center
                  "
                >

                  <FaPlus />

                </button>

              </div>


              {stock >
                0 && (

                <p
                  className="
                    text-[11px]
                    text-slate-400

                    mt-2
                  "
                >
                  {stock} disponibles
                </p>

              )}

            </div>


            {/* SUBTOTAL */}

            <div
              className="
                md:text-right
              "
            >

              <p
                className="
                  text-xs
                  text-slate-500
                "
              >
                Subtotal
              </p>


              <p
                className="
                  text-3xl

                  font-black

                  text-slate-900

                  mt-1
                "
              >
                {formatoMoneda.format(
                  subtotal
                )}
              </p>


              {producto.incluyeInstalacion && (

                <p
                  className="
                    text-[11px]
                    text-emerald-600

                    font-semibold

                    mt-1
                  "
                >
                  Incluye instalación
                </p>

              )}

            </div>

          </div>

        </div>

      </div>

    </article>
  );
}


/* ======================================================
   DATO PRECIO
====================================================== */

function DatoPrecio({
  titulo,
  valor,
  instalacion = false,
}) {
  return (
    <div
      className={`
        p-3

        rounded-xl

        border

        ${
          instalacion
            ? `
              bg-emerald-50
              border-emerald-100
            `
            : `
              bg-slate-50
              border-slate-100
            `
        }
      `}
    >

      <p
        className={`
          text-[11px]

          ${
            instalacion
              ? `
                text-emerald-600
              `
              : `
                text-slate-500
              `
          }
        `}
      >
        {titulo}
      </p>


      <p
        className={`
          font-black

          mt-1

          ${
            instalacion
              ? `
                text-emerald-700
              `
              : `
                text-slate-800
              `
          }
        `}
      >
        {valor}
      </p>

    </div>
  );
}


/* ======================================================
   FILA RESUMEN
====================================================== */

function FilaResumen({
  titulo,
  valor,
  destacado = false,
}) {
  return (
    <div
      className="
        flex
        items-center
        justify-between

        gap-4

        py-2
      "
    >

      <span
        className={`
          text-sm

          ${
            destacado
              ? `
                text-emerald-600
                font-semibold
              `
              : `
                text-slate-500
              `
          }
        `}
      >
        {titulo}
      </span>


      <span
        className={`
          font-bold

          ${
            destacado
              ? `
                text-emerald-600
              `
              : `
                text-slate-800
              `
          }
        `}
      >
        {valor}
      </span>

    </div>
  );
}


/* ======================================================
   BENEFICIO
====================================================== */

function Beneficio({
  icon,
  titulo,
  texto,
}) {
  return (
    <div
      className="
        flex
        items-start
        gap-3
      "
    >

      <div
        className="
          w-9
          h-9

          rounded-xl

          bg-emerald-50

          text-emerald-600

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
            text-sm

            font-bold

            text-slate-800
          "
        >
          {titulo}
        </p>


        <p
          className="
            text-xs
            text-slate-500

            leading-relaxed

            mt-1
          "
        >
          {texto}
        </p>

      </div>

    </div>
  );
}


export default Carrito;