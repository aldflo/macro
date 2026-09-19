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
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import {
  db,
} from "../firebase.config";

import {
  FaArrowRight,
  FaCheckCircle,
  FaCloudUploadAlt,
  FaEdit,
  FaExclamationTriangle,
  FaImage,
  FaPlus,
  FaSearch,
  FaShoppingBag,
  FaTimes,
  FaTools,
  FaTrash,
} from "react-icons/fa";


/* ======================================================
   CONFIGURACIÓN
====================================================== */

const MAX_IMAGENES = 10;
const MAX_MB = 10;

const CLOUD_NAME =
  import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

const UPLOAD_PRESET =
  import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;


/* ======================================================
   CATEGORÍAS
====================================================== */

const CATEGORIAS = [
  "Computación",
  "Celulares y accesorios",
  "Cámaras y seguridad",
  "Redes y conectividad",
  "Componentes",
  "Tecnología",
  "Otros",
];


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
   COMPONENTE
====================================================== */

function SubirProducto() {
  const navigate =
    useNavigate();

  const {
    modoOscuro = false,
  } =
    useOutletContext() || {};


  /* ====================================================
     INFORMACIÓN PRINCIPAL
  ==================================================== */

  const [
    nombre,
    setNombre,
  ] = useState("");

  const [
    categoria,
    setCategoria,
  ] = useState(
    "Tecnología"
  );

  const [
    marca,
    setMarca,
  ] = useState("");

  const [
    sku,
    setSku,
  ] = useState("");

  const [
    descripcion,
    setDescripcion,
  ] = useState("");

  const [
    descripcionDetallada,
    setDescripcionDetallada,
  ] = useState("");


  /* ====================================================
     PRECIO
  ==================================================== */

  const [
    precio,
    setPrecio,
  ] = useState("");

  const [
    precioAnterior,
    setPrecioAnterior,
  ] = useState("");

  const [
    stock,
    setStock,
  ] = useState("");


  /* ====================================================
     INSTALACIÓN
  ==================================================== */

  const [
    permiteInstalacion,
    setPermiteInstalacion,
  ] = useState(false);

  const [
    precioInstalacion,
    setPrecioInstalacion,
  ] = useState("");

  const [
    descripcionInstalacion,
    setDescripcionInstalacion,
  ] = useState("");


  /* ====================================================
     CARACTERÍSTICAS
  ==================================================== */

  const [
    caracteristicasTexto,
    setCaracteristicasTexto,
  ] = useState("");

  const [
    garantia,
    setGarantia,
  ] = useState("");

  const [
    entrega,
    setEntrega,
  ] = useState("");

  const [
    devolucion,
    setDevolucion,
  ] = useState("");


  /* ====================================================
     PUBLICACIÓN
  ==================================================== */

  const [
    destacado,
    setDestacado,
  ] = useState(false);

  const [
    activo,
    setActivo,
  ] = useState(true);


  /* ====================================================
     IMÁGENES
  ==================================================== */

  const [
    imagenes,
    setImagenes,
  ] = useState([]);

  const [
    previews,
    setPreviews,
  ] = useState([]);

  const [
    imagenesExistentes,
    setImagenesExistentes,
  ] = useState([]);


  /* ====================================================
     PRODUCTOS
  ==================================================== */

  const [
    productos,
    setProductos,
  ] = useState([]);

  const [
    editId,
    setEditId,
  ] = useState(null);


  /* ====================================================
     INTERFAZ
  ==================================================== */

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    mensaje,
    setMensaje,
  ] = useState("");

  const [
    busqueda,
    setBusqueda,
  ] = useState("");

  const [
    filtroCategoria,
    setFiltroCategoria,
  ] = useState("Todos");


  /* ====================================================
     LEER PRODUCTOS
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

          setProductos(
            lista
          );
        },

        (firebaseError) => {
          console.error(
            "Error productos:",
            firebaseError
          );

          setError(
            "No se pudieron cargar los productos."
          );
        }
      );

    return () =>
      unsubscribe();

  }, []);


  /* ====================================================
     VALIDAR FOTO
  ==================================================== */

  const validarArchivo =
    (file) => {
      if (
        !file.type.startsWith(
          "image/"
        )
      ) {
        return `"${file.name}" no es una imagen válida.`;
      }

      if (
        file.size >
        MAX_MB *
          1024 *
          1024
      ) {
        return `"${file.name}" supera ${MAX_MB} MB.`;
      }

      return null;
    };


  /* ====================================================
     SELECCIONAR FOTOS
  ==================================================== */

  const seleccionarImagenes =
    (files) => {
      setError("");

      const nuevas =
        Array.from(
          files || []
        );

      if (!nuevas.length) {
        return;
      }

      const total =
        imagenesExistentes.length +
        imagenes.length +
        nuevas.length;

      if (
        total >
        MAX_IMAGENES
      ) {
        setError(
          `Máximo ${MAX_IMAGENES} fotografías por producto.`
        );

        return;
      }

      for (
        const file of
        nuevas
      ) {
        const problema =
          validarArchivo(
            file
          );

        if (problema) {
          setError(
            problema
          );

          return;
        }
      }

      const nuevosPreviews =
        nuevas.map(
          (file) => ({
            file,

            url:
              URL.createObjectURL(
                file
              ),
          })
        );

      setImagenes(
        (anteriores) => [
          ...anteriores,
          ...nuevas,
        ]
      );

      setPreviews(
        (anteriores) => [
          ...anteriores,
          ...nuevosPreviews,
        ]
      );
    };


  /* ====================================================
     QUITAR FOTO NUEVA
  ==================================================== */

  const eliminarNuevaImagen =
    (index) => {
      const preview =
        previews[index];

      if (
        preview?.url
      ) {
        URL.revokeObjectURL(
          preview.url
        );
      }

      setImagenes(
        (actuales) =>
          actuales.filter(
            (_, i) =>
              i !== index
          )
      );

      setPreviews(
        (actuales) =>
          actuales.filter(
            (_, i) =>
              i !== index
          )
      );
    };


  /* ====================================================
     QUITAR FOTO EXISTENTE
  ==================================================== */

  const eliminarImagenExistente =
    (index) => {
      setImagenesExistentes(
        (actuales) =>
          actuales.filter(
            (_, i) =>
              i !== index
          )
      );
    };


  /* ====================================================
     CLOUDINARY
  ==================================================== */

  const subirImagenCloudinary =
    async (file) => {
      if (
        !CLOUD_NAME ||
        !UPLOAD_PRESET
      ) {
        throw new Error(
          "Falta configurar Cloudinary en .env"
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
        "macro/productos"
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
            "No se pudo subir la imagen."
        );
      }

      return data.secure_url;
    };


  /* ====================================================
     LIMPIAR
  ==================================================== */

  const limpiarFormulario =
    () => {
      previews.forEach(
        (preview) => {
          if (
            preview?.url
          ) {
            URL.revokeObjectURL(
              preview.url
            );
          }
        }
      );

      setNombre("");
      setCategoria(
        "Tecnología"
      );
      setMarca("");
      setSku("");

      setDescripcion("");
      setDescripcionDetallada("");

      setPrecio("");
      setPrecioAnterior("");
      setStock("");

      setPermiteInstalacion(false);
      setPrecioInstalacion("");
      setDescripcionInstalacion("");

      setCaracteristicasTexto("");
      setGarantia("");
      setEntrega("");
      setDevolucion("");

      setDestacado(false);
      setActivo(true);

      setImagenes([]);
      setPreviews([]);
      setImagenesExistentes([]);

      setEditId(null);
      setError("");
    };


  /* ====================================================
     VALIDACIÓN
  ==================================================== */

  const validarFormulario =
    () => {
      setError("");

      if (
        !nombre.trim()
      ) {
        setError(
          "Escribe el nombre del producto."
        );

        return false;
      }

      if (
        !descripcion.trim()
      ) {
        setError(
          "Escribe una descripción."
        );

        return false;
      }

      const precioNumero =
        Number(
          precio
        );

      if (
        !Number.isFinite(
          precioNumero
        ) ||
        precioNumero <=
          0
      ) {
        setError(
          "Ingresa un precio válido."
        );

        return false;
      }

      const stockNumero =
        Number(
          stock
        );

      if (
        !Number.isInteger(
          stockNumero
        ) ||
        stockNumero <
          0
      ) {
        setError(
          "Ingresa un stock válido."
        );

        return false;
      }

      if (
        permiteInstalacion
      ) {
        const costoInstalacion =
          Number(
            precioInstalacion
          );

        if (
          !Number.isFinite(
            costoInstalacion
          ) ||
          costoInstalacion <
            0
        ) {
          setError(
            "Ingresa un costo de instalación válido."
          );

          return false;
        }
      }

      if (
        imagenes.length +
          imagenesExistentes.length ===
        0
      ) {
        setError(
          "Agrega al menos una fotografía."
        );

        return false;
      }

      return true;
    };


  /* ====================================================
     GUARDAR
  ==================================================== */

  const guardarProducto =
    async (e) => {
      e.preventDefault();

      setMensaje("");

      if (
        !validarFormulario()
      ) {
        return;
      }

      try {
        setLoading(true);

        const nuevasUrls =
          imagenes.length
            ? await Promise.all(
                imagenes.map(
                  subirImagenCloudinary
                )
              )
            : [];

        const imagenesFinales = [
          ...imagenesExistentes,
          ...nuevasUrls,
        ];

        const caracteristicas =
          caracteristicasTexto
            .split("\n")
            .map(
              (item) =>
                item.trim()
            )
            .filter(Boolean);

        const datos = {
          nombre:
            nombre.trim(),

          categoria,

          marca:
            marca.trim(),

          sku:
            sku.trim(),

          descripcion:
            descripcion.trim(),

          descripcionDetallada:
            descripcionDetallada.trim(),

          precio:
            Number(
              precio
            ),

          precioAnterior:
            precioAnterior
              ? Number(
                  precioAnterior
                )
              : 0,

          stock:
            Number(
              stock
            ),

          /* INSTALACIÓN */

          permiteInstalacion:
            Boolean(
              permiteInstalacion
            ),

          precioInstalacion:
            permiteInstalacion
              ? Number(
                  precioInstalacion ||
                    0
                )
              : 0,

          descripcionInstalacion:
            permiteInstalacion
              ? descripcionInstalacion.trim()
              : "",

          caracteristicas,

          garantia:
            garantia.trim(),

          entrega:
            entrega.trim(),

          devolucion:
            devolucion.trim(),

          imagen:
            imagenesFinales[0] ||
            "",

          imagenes:
            imagenesFinales,

          destacado,

          activo,

          fechaActualizacion:
            serverTimestamp(),
        };


        if (editId) {
          await updateDoc(
            doc(
              db,
              "productos",
              editId
            ),

            datos
          );

          setMensaje(
            "✅ Producto actualizado correctamente."
          );
        } else {
          await addDoc(
            collection(
              db,
              "productos"
            ),

            {
              ...datos,

              fechaCreacion:
                serverTimestamp(),
            }
          );

          setMensaje(
            "✅ Producto publicado correctamente."
          );
        }

        limpiarFormulario();

        window.scrollTo({
          top: 0,

          behavior:
            "smooth",
        });

      } catch (
        guardarError
      ) {
        console.error(
          guardarError
        );

        setError(
          guardarError.message ||
            "No se pudo guardar el producto."
        );

      } finally {
        setLoading(false);
      }
    };


  /* ====================================================
     EDITAR
  ==================================================== */

  const editarProducto =
    (producto) => {
      setEditId(
        producto.id
      );

      setNombre(
        producto.nombre ||
          ""
      );

      setCategoria(
        producto.categoria ||
          "Tecnología"
      );

      setMarca(
        producto.marca ||
          ""
      );

      setSku(
        producto.sku ||
          ""
      );

      setDescripcion(
        producto.descripcion ||
          ""
      );

      setDescripcionDetallada(
        producto.descripcionDetallada ||
          ""
      );

      setPrecio(
        producto.precio ??
          ""
      );

      setPrecioAnterior(
        producto.precioAnterior ??
          ""
      );

      setStock(
        producto.stock ??
          ""
      );

      setPermiteInstalacion(
        Boolean(
          producto.permiteInstalacion
        )
      );

      setPrecioInstalacion(
        producto.precioInstalacion ??
          ""
      );

      setDescripcionInstalacion(
        producto.descripcionInstalacion ||
          ""
      );

      setCaracteristicasTexto(
        Array.isArray(
          producto.caracteristicas
        )
          ? producto.caracteristicas.join(
              "\n"
            )
          : ""
      );

      setGarantia(
        producto.garantia ||
          ""
      );

      setEntrega(
        producto.entrega ||
          ""
      );

      setDevolucion(
        producto.devolucion ||
          ""
      );

      setDestacado(
        Boolean(
          producto.destacado
        )
      );

      setActivo(
        producto.activo !==
          false
      );

      if (
        Array.isArray(
          producto.imagenes
        ) &&
        producto.imagenes.length
      ) {
        setImagenesExistentes(
          producto.imagenes
        );
      } else if (
        producto.imagen
      ) {
        setImagenesExistentes([
          producto.imagen,
        ]);
      } else {
        setImagenesExistentes([]);
      }

      setImagenes([]);
      setPreviews([]);

      setError("");
      setMensaje("");

      window.scrollTo({
        top: 0,

        behavior:
          "smooth",
      });
    };


  /* ====================================================
     ELIMINAR
  ==================================================== */

  const eliminarProducto =
    async (producto) => {
      const confirmar =
        window.confirm(
          `¿Eliminar "${producto.nombre}"?`
        );

      if (!confirmar) {
        return;
      }

      try {
        await deleteDoc(
          doc(
            db,
            "productos",
            producto.id
          )
        );

        if (
          editId ===
          producto.id
        ) {
          limpiarFormulario();
        }

        setMensaje(
          "Producto eliminado."
        );

      } catch (err) {
        console.error(err);

        setError(
          "No se pudo eliminar el producto."
        );
      }
    };


  /* ====================================================
     FILTRO
  ==================================================== */

  const productosFiltrados =
    useMemo(() => {
      const texto =
        busqueda
          .toLowerCase()
          .trim();

      return productos.filter(
        (producto) => {
          const contenido =
            [
              producto.nombre,
              producto.marca,
              producto.categoria,
              producto.sku,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();

          const coincideBusqueda =
            !texto ||
            contenido.includes(
              texto
            );

          const coincideCategoria =
            filtroCategoria ===
              "Todos" ||
            producto.categoria ===
              filtroCategoria;

          return (
            coincideBusqueda &&
            coincideCategoria
          );
        }
      );

    }, [
      productos,
      busqueda,
      filtroCategoria,
    ]);


  const totalImagenes =
    imagenes.length +
    imagenesExistentes.length;


  const precioProductoNumero =
    Number(
      precio ||
      0
    );

  const precioInstalacionNumero =
    Number(
      precioInstalacion ||
      0
    );

  const precioProductoInstalado =
    precioProductoNumero +
    precioInstalacionNumero;


  /* ====================================================
     RENDER
  ==================================================== */

  return (
    <div
      className={`
        min-h-screen
        px-4
        sm:px-6
        py-8

        ${
          modoOscuro
            ? `
              bg-[#050b18]
              text-white
            `
            : `
              bg-[#f5f8fb]
              text-slate-950
            `
        }
      `}
    >

      <div className="max-w-7xl mx-auto">

        {/* HEADER */}

        <header
          className="
            flex
            flex-col
            lg:flex-row
            lg:items-center
            lg:justify-between
            gap-5
            mb-8
          "
        >

          <div>

            <p
              className="
                text-xs
                uppercase
                tracking-[0.22em]
                font-bold
                text-sky-500
              "
            >
              Macro Admin
            </p>

            <h1
              className="
                text-4xl
                md:text-5xl
                font-black
                tracking-[-0.04em]
                mt-2
              "
            >
              Productos
            </h1>

            <p className="text-slate-500 mt-2">
              Publica productos y, cuando aplique,
              ofrece también el servicio profesional de instalación.
            </p>

          </div>


          <button
            type="button"
            onClick={() =>
              navigate(
                "/tienda"
              )
            }
            className="
              bg-sky-500
              hover:bg-sky-600
              text-white
              px-6
              py-4
              rounded-2xl
              font-bold
              flex
              items-center
              justify-center
              gap-2
            "
          >

            <FaShoppingBag />

            Ver tienda

            <FaArrowRight />

          </button>

        </header>


        {/* MENSAJES */}

        {error && (
          <div
            className="
              mb-6
              p-4
              rounded-2xl
              border
              border-red-200
              bg-red-50
              text-red-600
              flex
              items-center
              gap-3
            "
          >

            <FaExclamationTriangle />

            {error}

          </div>
        )}


        {mensaje && (
          <div
            className="
              mb-6
              p-4
              rounded-2xl
              border
              border-emerald-200
              bg-emerald-50
              text-emerald-600
              flex
              items-center
              gap-3
            "
          >

            <FaCheckCircle />

            {mensaje}

          </div>
        )}


        {/* FORMULARIO */}

        <form
          onSubmit={
            guardarProducto
          }
          className={`
            rounded-[32px]
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

          <div
            className="
              p-7
              md:p-9
              border-b
              border-sky-100
              bg-sky-50/60
            "
          >

            <h2 className="text-2xl font-black">
              {editId
                ? "Editar producto"
                : "Nuevo producto"
              }
            </h2>

            <p className="text-slate-500 mt-1">
              Completa la ficha que aparecerá en Macro Store.
            </p>

          </div>


          <div
            className="
              p-6
              md:p-9
              space-y-11
            "
          >

            {/* ================================================= */}
            {/* 01 INFORMACIÓN */}
            {/* ================================================= */}

            <section>

              <Titulo
                numero="01"
                titulo="Información del producto"
                texto="Nombre, marca, categoría y descripción."
              />


              <div
                className="
                  grid
                  md:grid-cols-2
                  gap-5
                  mt-7
                "
              >

                <Campo label="Nombre">

                  <input
                    value={
                      nombre
                    }
                    onChange={(e) =>
                      setNombre(
                        e.target.value
                      )
                    }
                    placeholder="Ej. Cámara WiFi TP-Link"
                    className={
                      inputClass(
                        modoOscuro
                      )
                    }
                  />

                </Campo>


                <Campo label="Categoría">

                  <select
                    value={
                      categoria
                    }
                    onChange={(e) =>
                      setCategoria(
                        e.target.value
                      )
                    }
                    className={
                      inputClass(
                        modoOscuro
                      )
                    }
                  >

                    {CATEGORIAS.map(
                      (item) => (
                        <option
                          key={item}
                          value={item}
                        >
                          {item}
                        </option>
                      )
                    )}

                  </select>

                </Campo>


                <Campo label="Marca">

                  <input
                    value={
                      marca
                    }
                    onChange={(e) =>
                      setMarca(
                        e.target.value
                      )
                    }
                    placeholder="Ej. TP-Link"
                    className={
                      inputClass(
                        modoOscuro
                      )
                    }
                  />

                </Campo>


                <Campo label="SKU / código">

                  <input
                    value={
                      sku
                    }
                    onChange={(e) =>
                      setSku(
                        e.target.value
                      )
                    }
                    placeholder="Ej. MAC-CAM-001"
                    className={
                      inputClass(
                        modoOscuro
                      )
                    }
                  />

                </Campo>

              </div>


              <div className="mt-5">

                <Campo label="Descripción corta">

                  <textarea
                    value={
                      descripcion
                    }
                    onChange={(e) =>
                      setDescripcion(
                        e.target.value
                      )
                    }
                    rows={4}
                    placeholder="Descripción que aparecerá en las tarjetas..."
                    className={`
                      ${inputClass(
                        modoOscuro
                      )}

                      resize-none
                    `}
                  />

                </Campo>

              </div>


              <div className="mt-5">

                <Campo label="Descripción completa">

                  <textarea
                    value={
                      descripcionDetallada
                    }
                    onChange={(e) =>
                      setDescripcionDetallada(
                        e.target.value
                      )
                    }
                    rows={8}
                    placeholder="Información completa, especificaciones, beneficios y detalles..."
                    className={`
                      ${inputClass(
                        modoOscuro
                      )}

                      resize-none
                    `}
                  />

                </Campo>

              </div>

            </section>


            {/* ================================================= */}
            {/* 02 PRECIO */}
            {/* ================================================= */}

            <section
              className="
                pt-10
                border-t
                border-sky-100
              "
            >

              <Titulo
                numero="02"
                titulo="Precio e inventario"
                texto="Configura precio, oferta y unidades disponibles."
              />


              <div
                className="
                  grid
                  md:grid-cols-3
                  gap-5
                  mt-7
                "
              >

                <Campo label="Precio del producto">

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      precio
                    }
                    onChange={(e) =>
                      setPrecio(
                        e.target.value
                      )
                    }
                    placeholder="0.00"
                    className={
                      inputClass(
                        modoOscuro
                      )
                    }
                  />

                </Campo>


                <Campo label="Precio anterior (opcional)">

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      precioAnterior
                    }
                    onChange={(e) =>
                      setPrecioAnterior(
                        e.target.value
                      )
                    }
                    placeholder="Ej. 2500"
                    className={
                      inputClass(
                        modoOscuro
                      )
                    }
                  />

                </Campo>


                <Campo label="Stock">

                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={
                      stock
                    }
                    onChange={(e) =>
                      setStock(
                        e.target.value
                      )
                    }
                    placeholder="0"
                    className={
                      inputClass(
                        modoOscuro
                      )
                    }
                  />

                </Campo>

              </div>

            </section>


            {/* ================================================= */}
            {/* 03 INSTALACIÓN */}
            {/* ================================================= */}

            <section
              className="
                pt-10
                border-t
                border-sky-100
              "
            >

              <Titulo
                numero="03"
                titulo="Servicio de instalación"
                texto="Permite vender el equipo solo o acompañado por el servicio técnico de Macro."
              />


              <div className="mt-7">

                <ToggleCard
                  titulo="Ofrecer instalación con este producto"
                  texto={
                    permiteInstalacion
                      ? "El cliente podrá elegir entre comprar únicamente el producto o contratar producto + instalación."
                      : "Actívalo para cámaras, routers, redes, equipos u otros productos que Macro pueda instalar."
                  }
                  activo={
                    permiteInstalacion
                  }
                  onClick={() =>
                    setPermiteInstalacion(
                      !permiteInstalacion
                    )
                  }
                  modoOscuro={
                    modoOscuro
                  }
                  icon={
                    <FaTools />
                  }
                />

              </div>


              {permiteInstalacion && (

                <div
                  className={`
                    mt-5

                    rounded-[26px]

                    border
                    border-sky-200

                    p-6

                    ${
                      modoOscuro
                        ? `
                          bg-sky-500/5
                        `
                        : `
                          bg-sky-50/60
                        `
                    }
                  `}
                >

                  <div
                    className="
                      flex
                      items-start
                      gap-4
                      mb-6
                    "
                  >

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
                        shrink-0
                      "
                    >

                      <FaTools />

                    </div>


                    <div>

                      <h3 className="font-black text-lg">
                        Producto + instalación Macro
                      </h3>

                      <p className="text-sm text-slate-500 mt-1">
                        Este costo se sumará al precio del producto cuando el cliente seleccione la instalación.
                      </p>

                    </div>

                  </div>


                  <div
                    className="
                      grid
                      md:grid-cols-2
                      gap-5
                    "
                  >

                    <Campo label="Costo de instalación">

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={
                          precioInstalacion
                        }
                        onChange={(e) =>
                          setPrecioInstalacion(
                            e.target.value
                          )
                        }
                        placeholder="Ej. 700"
                        className={
                          inputClass(
                            modoOscuro
                          )
                        }
                      />

                    </Campo>


                    <div
                      className={`
                        rounded-2xl
                        border
                        p-4

                        ${
                          modoOscuro
                            ? `
                              border-slate-700
                              bg-[#071221]
                            `
                            : `
                              border-sky-100
                              bg-white
                            `
                        }
                      `}
                    >

                      <p className="text-xs text-slate-500">
                        Precio producto + instalación
                      </p>

                      <p className="text-2xl font-black text-sky-500 mt-2">
                        {formatoMoneda.format(
                          precioProductoInstalado
                        )}
                      </p>

                    </div>

                  </div>


                  <div className="mt-5">

                    <Campo label="¿Qué incluye la instalación?">

                      <textarea
                        value={
                          descripcionInstalacion
                        }
                        onChange={(e) =>
                          setDescripcionInstalacion(
                            e.target.value
                          )
                        }
                        rows={5}
                        placeholder={`Ejemplo:

Instalación y montaje del equipo.
Configuración inicial.
Prueba de funcionamiento.
Orientación básica al cliente.

No incluye materiales adicionales que no estén indicados.`}
                        className={`
                          ${inputClass(
                            modoOscuro
                          )}

                          resize-none
                        `}
                      />

                    </Campo>

                  </div>


                  <div
                    className="
                      mt-5
                      p-4
                      rounded-2xl
                      bg-amber-50
                      border
                      border-amber-200
                      text-amber-800
                      text-sm
                    "
                  >
                    💡 Para trabajos que dependan de distancia,
                    cableado o condiciones especiales, puedes
                    indicarlo aquí. Macro puede confirmar los detalles
                    antes de realizar la instalación.
                  </div>

                </div>

              )}

            </section>


            {/* ================================================= */}
            {/* 04 CARACTERÍSTICAS */}
            {/* ================================================= */}

            <section
              className="
                pt-10
                border-t
                border-sky-100
              "
            >

              <Titulo
                numero="04"
                titulo="Características"
                texto="Información importante que verá el comprador."
              />


              <div className="mt-7">

                <Campo label="Lo que tienes que saber">

                  <textarea
                    value={
                      caracteristicasTexto
                    }
                    onChange={(e) =>
                      setCaracteristicasTexto(
                        e.target.value
                      )
                    }
                    rows={8}
                    placeholder={`Una característica por línea:

Resolución Full HD
Visión nocturna
Detección de movimiento
Conexión WiFi
Control desde aplicación móvil`}
                    className={`
                      ${inputClass(
                        modoOscuro
                      )}

                      resize-none
                    `}
                  />

                </Campo>


                <p className="text-xs text-slate-400 mt-2">
                  Cada línea se convertirá automáticamente en una viñeta.
                </p>

              </div>


              <div
                className="
                  grid
                  md:grid-cols-3
                  gap-5
                  mt-6
                "
              >

                <Campo label="Garantía">

                  <input
                    value={
                      garantia
                    }
                    onChange={(e) =>
                      setGarantia(
                        e.target.value
                      )
                    }
                    placeholder="Ej. 12 meses"
                    className={
                      inputClass(
                        modoOscuro
                      )
                    }
                  />

                </Campo>


                <Campo label="Entrega">

                  <input
                    value={
                      entrega
                    }
                    onChange={(e) =>
                      setEntrega(
                        e.target.value
                      )
                    }
                    placeholder="Ej. Envío dependiendo del domicilio"
                    className={
                      inputClass(
                        modoOscuro
                      )
                    }
                  />

                </Campo>


                <Campo label="Devolución">

                  <input
                    value={
                      devolucion
                    }
                    onChange={(e) =>
                      setDevolucion(
                        e.target.value
                      )
                    }
                    placeholder="Ej. 7 días"
                    className={
                      inputClass(
                        modoOscuro
                      )
                    }
                  />

                </Campo>

              </div>

            </section>


            {/* ================================================= */}
            {/* 05 IMÁGENES */}
            {/* ================================================= */}

            <section
              className="
                pt-10
                border-t
                border-sky-100
              "
            >

              <Titulo
                numero="05"
                titulo="Fotografías"
                texto="La primera foto será la portada. Las demás formarán la galería."
              />


              <div
                className="
                  flex
                  items-center
                  justify-between
                  mt-7
                  mb-4
                "
              >

                <span className="text-sm text-slate-500">
                  Imágenes del producto
                </span>

                <span
                  className="
                    px-3
                    py-1.5
                    rounded-full
                    bg-sky-500/10
                    text-sky-500
                    text-xs
                    font-bold
                  "
                >
                  {totalImagenes}/{MAX_IMAGENES}
                </span>

              </div>


              <label
                className="
                  block
                  p-12
                  rounded-[26px]
                  border-2
                  border-dashed
                  border-sky-300
                  bg-sky-50/50
                  text-center
                  cursor-pointer
                  hover:border-sky-500
                  transition
                "
              >

                <FaCloudUploadAlt
                  className="
                    text-4xl
                    text-sky-500
                    mx-auto
                  "
                />

                <p className="font-bold mt-4">
                  Seleccionar fotografías
                </p>

                <p className="text-sm text-slate-500 mt-1">
                  JPG, PNG o WEBP · máximo {MAX_MB} MB
                </p>


                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    seleccionarImagenes(
                      e.target.files
                    );

                    e.target.value =
                      "";
                  }}
                />

              </label>


              {(imagenesExistentes.length >
                0 ||
                previews.length >
                0) && (

                <div
                  className="
                    grid
                    grid-cols-2
                    sm:grid-cols-3
                    md:grid-cols-5
                    gap-3
                    mt-6
                  "
                >

                  {imagenesExistentes.map(
                    (
                      imagen,
                      index
                    ) => (

                      <Preview
                        key={`${imagen}-${index}`}
                        src={imagen}
                        portada={
                          index === 0
                        }
                        eliminar={() =>
                          eliminarImagenExistente(
                            index
                          )
                        }
                      />

                    )
                  )}


                  {previews.map(
                    (
                      preview,
                      index
                    ) => (

                      <Preview
                        key={`${preview.file.name}-${index}`}
                        src={
                          preview.url
                        }
                        portada={
                          !imagenesExistentes.length &&
                          index === 0
                        }
                        eliminar={() =>
                          eliminarNuevaImagen(
                            index
                          )
                        }
                      />

                    )
                  )}

                </div>

              )}

            </section>


            {/* ================================================= */}
            {/* 06 PUBLICACIÓN */}
            {/* ================================================= */}

            <section
              className="
                pt-10
                border-t
                border-sky-100
              "
            >

              <Titulo
                numero="06"
                titulo="Publicación"
                texto="Controla la visibilidad del producto."
              />


              <div
                className="
                  grid
                  md:grid-cols-2
                  gap-4
                  mt-7
                "
              >

                <ToggleCard
                  titulo="Producto destacado"
                  texto="Aparecerá en la sección Ofertas Macro."
                  activo={
                    destacado
                  }
                  onClick={() =>
                    setDestacado(
                      !destacado
                    )
                  }
                  modoOscuro={
                    modoOscuro
                  }
                />


                <ToggleCard
                  titulo="Disponible"
                  texto="Mostrar producto públicamente en la tienda."
                  activo={
                    activo
                  }
                  onClick={() =>
                    setActivo(
                      !activo
                    )
                  }
                  modoOscuro={
                    modoOscuro
                  }
                />

              </div>


              <div
                className="
                  flex
                  flex-col
                  sm:flex-row
                  gap-3
                  mt-8
                "
              >

                {editId && (

                  <button
                    type="button"
                    onClick={
                      limpiarFormulario
                    }
                    className="
                      px-6
                      py-4
                      rounded-xl
                      border
                      border-slate-200
                      font-bold
                    "
                  >

                    <FaTimes className="inline mr-2" />

                    Cancelar

                  </button>

                )}


                <button
                  type="submit"
                  disabled={
                    loading
                  }
                  className="
                    flex-1
                    bg-sky-500
                    hover:bg-sky-600
                    disabled:opacity-50
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

                  {editId
                    ? <FaEdit />
                    : <FaPlus />
                  }

                  {loading
                    ? "Guardando..."
                    : editId
                    ? "Guardar cambios"
                    : "Publicar producto"
                  }

                </button>

              </div>

            </section>

          </div>

        </form>


        {/* ================================================= */}
        {/* PRODUCTOS PUBLICADOS */}
        {/* ================================================= */}

        <section className="mt-16">

          <h2 className="text-3xl font-black">
            Productos publicados
          </h2>

          <p className="text-slate-500 mt-1">
            {productos.length} productos registrados.
          </p>


          <div
            className="
              flex
              flex-col
              md:flex-row
              gap-3
              mt-6
            "
          >

            <div className="relative flex-1">

              <FaSearch
                className="
                  absolute
                  left-4
                  top-1/2
                  -translate-y-1/2
                  text-slate-400
                "
              />

              <input
                value={
                  busqueda
                }
                onChange={(e) =>
                  setBusqueda(
                    e.target.value
                  )
                }
                placeholder="Buscar producto..."
                className={`
                  ${inputClass(
                    modoOscuro
                  )}

                  pl-11
                `}
              />

            </div>


            <select
              value={
                filtroCategoria
              }
              onChange={(e) =>
                setFiltroCategoria(
                  e.target.value
                )
              }
              className={`
                ${inputClass(
                  modoOscuro
                )}

                md:w-[280px]
              `}
            >

              <option value="Todos">
                Todas las categorías
              </option>

              {CATEGORIAS.map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                )
              )}

            </select>

          </div>


          <div
            className="
              grid
              md:grid-cols-2
              xl:grid-cols-3
              gap-5
              mt-6
            "
          >

            {productosFiltrados.map(
              (producto) => (

                <ProductoAdminCard
                  key={
                    producto.id
                  }
                  producto={
                    producto
                  }
                  editar={() =>
                    editarProducto(
                      producto
                    )
                  }
                  eliminar={() =>
                    eliminarProducto(
                      producto
                    )
                  }
                  navigate={
                    navigate
                  }
                />

              )
            )}

          </div>

        </section>

      </div>

    </div>
  );
}


/* ======================================================
   INPUT
====================================================== */

const inputClass =
  (modoOscuro) => `
    w-full
    p-4
    rounded-xl
    border
    outline-none
    focus:border-sky-400
    focus:ring-4
    focus:ring-sky-500/10

    ${
      modoOscuro
        ? `
          bg-[#071221]
          border-slate-700
          text-white
        `
        : `
          bg-[#f8fbff]
          border-sky-100
          text-slate-900
        `
    }
  `;


/* ======================================================
   TITULO
====================================================== */

function Titulo({
  numero,
  titulo,
  texto,
}) {
  return (
    <div className="flex gap-4">

      <div
        className="
          w-11
          h-11
          shrink-0
          rounded-xl
          bg-sky-500/10
          text-sky-500
          font-bold
          flex
          items-center
          justify-center
        "
      >
        {numero}
      </div>


      <div>

        <h3 className="text-xl font-black">
          {titulo}
        </h3>

        <p className="text-sm text-slate-500 mt-1">
          {texto}
        </p>

      </div>

    </div>
  );
}


/* ======================================================
   CAMPO
====================================================== */

function Campo({
  label,
  children,
}) {
  return (
    <div>

      <label
        className="
          block
          text-sm
          text-slate-500
          mb-2
        "
      >
        {label}
      </label>

      {children}

    </div>
  );
}


/* ======================================================
   PREVIEW
====================================================== */

function Preview({
  src,
  portada,
  eliminar,
}) {
  return (
    <div
      className="
        relative
        aspect-square
        rounded-xl
        overflow-hidden
        bg-black
      "
    >

      <img
        src={src}
        alt=""
        className="
          w-full
          h-full
          object-cover
        "
      />

      {portada && (

        <span
          className="
            absolute
            left-2
            bottom-2
            bg-sky-500
            text-white
            px-2
            py-1
            rounded
            text-[9px]
            font-bold
          "
        >
          PORTADA
        </span>

      )}


      <button
        type="button"
        onClick={
          eliminar
        }
        className="
          absolute
          top-2
          right-2
          w-9
          h-9
          rounded-full
          bg-black/70
          text-red-400
          flex
          items-center
          justify-center
        "
      >

        <FaTrash />

      </button>

    </div>
  );
}


/* ======================================================
   TOGGLE
====================================================== */

function ToggleCard({
  titulo,
  texto,
  activo,
  onClick,
  modoOscuro,
  icon = null,
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={`
        w-full

        p-5

        rounded-2xl

        border

        flex
        items-center
        justify-between

        gap-4

        text-left

        transition

        ${
          activo
            ? `
              border-sky-400
              bg-sky-50
              text-slate-900
            `
            : modoOscuro
            ? `
              bg-[#071221]
              border-slate-700
              text-white
            `
            : `
              bg-white
              border-slate-200
              text-slate-900
            `
        }
      `}
    >

      <div
        className="
          flex
          items-center
          gap-4
        "
      >

        {icon && (

          <div
            className={`
              w-11
              h-11

              shrink-0

              rounded-xl

              flex
              items-center
              justify-center

              ${
                activo
                  ? `
                    bg-sky-500
                    text-white
                  `
                  : `
                    bg-sky-500/10
                    text-sky-500
                  `
              }
            `}
          >
            {icon}
          </div>

        )}


        <div>

          <p className="font-bold">
            {titulo}
          </p>

          <p className="text-xs text-slate-500 mt-1">
            {texto}
          </p>

        </div>

      </div>


      <div
        className={`
          w-12
          h-7

          shrink-0

          rounded-full

          p-1

          ${
            activo
              ? "bg-sky-500"
              : "bg-slate-300"
          }
        `}
      >

        <div
          className={`
            w-5
            h-5

            rounded-full

            bg-white

            transition

            ${
              activo
                ? "translate-x-5"
                : ""
            }
          `}
        />

      </div>

    </button>
  );
}


/* ======================================================
   CARD ADMIN
====================================================== */

function ProductoAdminCard({
  producto,
  editar,
  eliminar,
  navigate,
}) {
  const imagen =
    producto.imagen ||
    producto.imagenes?.[0] ||
    "";

  return (
    <article
      className="
        bg-white
        rounded-2xl
        border
        border-slate-200
        overflow-hidden
      "
    >

      <button
        type="button"
        onClick={() =>
          navigate(
            `/producto/${producto.id}`
          )
        }
        className="
          relative
          w-full
          h-[230px]
          bg-slate-100
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
              left-3
              bottom-3
              px-3
              py-1.5
              rounded-full
              bg-sky-500
              text-white
              text-[10px]
              font-bold
              flex
              items-center
              gap-1
            "
          >

            <FaTools />

            Instalación disponible

          </span>

        )}

      </button>


      <div className="p-5">

        <p className="text-xs text-sky-500 font-bold">
          {producto.categoria}
        </p>

        <h3 className="text-xl font-black mt-2">
          {producto.nombre}
        </h3>

        <p
          className="
            text-2xl
            text-sky-500
            font-black
            mt-4
          "
        >
          {formatoMoneda.format(
            producto.precio ||
              0
          )}
        </p>


        {producto.permiteInstalacion && (

          <p
            className="
              text-xs
              text-slate-500
              mt-2
            "
          >
            Instalación desde{" "}
            <strong>
              {formatoMoneda.format(
                Number(
                  producto.precioInstalacion ||
                    0
                )
              )}
            </strong>
          </p>

        )}


        <div
          className="
            grid
            grid-cols-2
            gap-3
            mt-5
          "
        >

          <button
            type="button"
            onClick={
              editar
            }
            className="
              py-3
              rounded-xl
              border
              border-sky-300
              text-sky-500
              font-bold
            "
          >

            <FaEdit className="inline mr-2" />

            Editar

          </button>


          <button
            type="button"
            onClick={
              eliminar
            }
            className="
              py-3
              rounded-xl
              border
              border-red-300
              text-red-500
              font-bold
            "
          >

            <FaTrash className="inline mr-2" />

            Eliminar

          </button>

        </div>

      </div>

    </article>
  );
}


export default SubirProducto;