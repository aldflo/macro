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
  FaAndroid,
  FaApple,
  FaArrowRight,
  FaBullhorn,
  FaCamera,
  FaCheckCircle,
  FaCloudUploadAlt,
  FaCode,
  FaEdit,
  FaExclamationTriangle,
  FaExternalLinkAlt,
  FaGlobe,
  FaImage,
  FaImages,
  FaLaptopCode,
  FaLayerGroup,
  FaLink,
  FaMobileAlt,
  FaPlus,
  FaRegStar,
  FaSave,
  FaSearch,
  FaShieldAlt,
  FaStar,
  FaTag,
  FaTimes,
  FaTools,
  FaTrash,
} from "react-icons/fa";


/* ======================================================
   CONFIGURACIÓN CLOUDINARY

   RECOMENDADO:
   crear en .env:

   VITE_CLOUDINARY_CLOUD_NAME=tu_cloud_name
   VITE_CLOUDINARY_UPLOAD_PRESET=macro
====================================================== */

const CLOUDINARY_CLOUD_NAME =
  import.meta.env.VITE_CLOUDINARY_CLOUD_NAME ||
  "dxj4iczvk";

const CLOUDINARY_UPLOAD_PRESET =
  import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET ||
  "macro";


/* ======================================================
   CONFIGURACIÓN GENERAL
====================================================== */

const MAX_IMAGENES = 8;
const MAX_GALERIA = 12;

const LIMITE_CLOUDINARY_BYTES =
  9 * 1024 * 1024;

const MAX_DIMENSION_OPTIMIZADA =
  3000;

const CALIDAD_INICIAL =
  0.88;

const CALIDAD_MINIMA =
  0.58;


/* ======================================================
   TIPOS DE PROYECTO
====================================================== */

const tiposProyecto = [
  {
    value: "web",
    label: "Página web",
    icon: <FaGlobe />,
  },

  {
    value: "app",
    label: "Aplicación móvil",
    icon: <FaMobileAlt />,
  },

  {
    value: "publicidad",
    label: "Publicidad / Marketing",
    icon: <FaBullhorn />,
  },

  {
    value: "camaras",
    label: "Cámaras y Seguridad",
    icon: <FaCamera />,
  },

  {
    value: "software",
    label: "Software / Sistema",
    icon: <FaLaptopCode />,
  },

  {
    value: "otro",
    label: "Otro",
    icon: <FaTools />,
  },
];


/* ======================================================
   ESTADOS
====================================================== */

const estadosProyecto = [
  "En desarrollo",
  "Finalizado",
  "Activo",
  "En mantenimiento",
];


/* ======================================================
   COMPONENTE
====================================================== */

function SubirProyecto() {
  const navigate =
    useNavigate();

  const {
    modoOscuro = false,
  } = useOutletContext() || {};


  /* ======================================================
     FORMULARIO GENERAL
  ====================================================== */

  const [
    nombre,
    setNombre,
  ] = useState("");

  const [
    descripcion,
    setDescripcion,
  ] = useState("");

  const [
    tipo,
    setTipo,
  ] = useState("web");

  const [
    cliente,
    setCliente,
  ] = useState("");

  const [
    estado,
    setEstado,
  ] = useState(
    "Finalizado"
  );

  const [
    tecnologiasTexto,
    setTecnologiasTexto,
  ] = useState("");

  const [
    urlProyecto,
    setUrlProyecto,
  ] = useState("");

  const [
    destacado,
    setDestacado,
  ] = useState(false);


  /* ======================================================
     APP
  ====================================================== */

  const [
    plataformaApp,
    setPlataformaApp,
  ] = useState("Ambas");

  const [
    appStoreUrl,
    setAppStoreUrl,
  ] = useState("");

  const [
    playStoreUrl,
    setPlayStoreUrl,
  ] = useState("");


  /* ======================================================
     CÁMARAS
  ====================================================== */

  const [
    cantidadCamaras,
    setCantidadCamaras,
  ] = useState("");

  const [
    tipoInstalacion,
    setTipoInstalacion,
  ] = useState("");


  /* ======================================================
     PUBLICIDAD
  ====================================================== */

  const [
    tipoCampana,
    setTipoCampana,
  ] = useState("");

  const [
    plataformasPublicidad,
    setPlataformasPublicidad,
  ] = useState("");


  /* ======================================================
     IMÁGENES
  ====================================================== */

  const [
    imagenes,
    setImagenes,
  ] = useState([]);

  const [
    galeria,
    setGaleria,
  ] = useState([]);

  const [
    previewImagenes,
    setPreviewImagenes,
  ] = useState([]);

  const [
    previewGaleria,
    setPreviewGaleria,
  ] = useState([]);

  const [
    imagenesExistentes,
    setImagenesExistentes,
  ] = useState([]);

  const [
    galeriaExistente,
    setGaleriaExistente,
  ] = useState([]);


  /* ======================================================
     PROYECTOS
  ====================================================== */

  const [
    proyectos,
    setProyectos,
  ] = useState([]);

  const [
    editId,
    setEditId,
  ] = useState(null);


  /* ======================================================
     ESTADOS UI
  ====================================================== */

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
    filtro,
    setFiltro,
  ] = useState("todos");


  /* ======================================================
     LISTAR PROYECTOS
  ====================================================== */

  useEffect(() => {
    const unsub =
      onSnapshot(
        collection(
          db,
          "proyectos"
        ),

        (snapshot) => {
          const data =
            snapshot.docs.map(
              (documento) => ({
                id:
                  documento.id,

                ...documento.data(),
              })
            );


          data.sort(
            (a, b) => {
              const fechaA =
                a.fechaActualizacion
                  ?.toMillis?.() ||
                a.fechaCreacion
                  ?.toMillis?.() ||
                a.fecha
                  ?.toMillis?.() ||
                0;


              const fechaB =
                b.fechaActualizacion
                  ?.toMillis?.() ||
                b.fechaCreacion
                  ?.toMillis?.() ||
                b.fecha
                  ?.toMillis?.() ||
                0;


              return (
                fechaB -
                fechaA
              );
            }
          );


          setProyectos(
            data
          );
        },

        (firebaseError) => {
          console.error(
            "Error cargando proyectos Macro:",
            firebaseError
          );
        }
      );


    return () =>
      unsub();

  }, []);


  /* ======================================================
     LIMPIAR OBJECT URL
  ====================================================== */

  useEffect(() => {
    return () => {
      previewImagenes.forEach(
        (item) => {
          URL.revokeObjectURL(
            item.url
          );
        }
      );


      previewGaleria.forEach(
        (item) => {
          URL.revokeObjectURL(
            item.url
          );
        }
      );
    };

  }, []);


  /* ======================================================
     FORMATOS RAW NO COMPATIBLES
  ====================================================== */

  const esFormatoRawNoCompatible =
    (file) => {
      const nombreArchivo =
        String(
          file?.name || ""
        ).toLowerCase();


      return (
        nombreArchivo.endsWith(".dng") ||
        nombreArchivo.endsWith(".raw") ||
        nombreArchivo.endsWith(".cr2") ||
        nombreArchivo.endsWith(".cr3") ||
        nombreArchivo.endsWith(".nef") ||
        nombreArchivo.endsWith(".arw")
      );
    };


  /* ======================================================
     CARGAR IMAGEN
  ====================================================== */

  const cargarImagenEnNavegador =
    (file) =>
      new Promise(
        (
          resolve,
          reject
        ) => {
          const url =
            URL.createObjectURL(
              file
            );

          const img =
            new Image();


          img.onload =
            () => {
              URL.revokeObjectURL(
                url
              );

              resolve(
                img
              );
            };


          img.onerror =
            () => {
              URL.revokeObjectURL(
                url
              );

              reject(
                new Error(
                  `El navegador no puede procesar "${file.name}".`
                )
              );
            };


          img.src =
            url;
        }
      );


  /* ======================================================
     CANVAS A BLOB
  ====================================================== */

  const canvasABlob =
    (
      canvas,
      tipoImagen,
      calidad
    ) =>
      new Promise(
        (
          resolve,
          reject
        ) => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(
                  new Error(
                    "No se pudo optimizar la imagen."
                  )
                );

                return;
              }

              resolve(
                blob
              );
            },

            tipoImagen,
            calidad
          );
        }
      );


  /* ======================================================
     OPTIMIZAR IMAGEN
  ====================================================== */

  const optimizarImagen =
    async (file) => {
      if (
        file.size <=
        LIMITE_CLOUDINARY_BYTES
      ) {
        return file;
      }


      if (
        esFormatoRawNoCompatible(
          file
        )
      ) {
        throw new Error(
          `"${file.name}" es una fotografía RAW/DNG de ${(
            file.size /
            1024 /
            1024
          ).toFixed(
            1
          )} MB. Exporta la imagen como JPG, PNG o HEIC antes de subirla.`
        );
      }


      let imagen;


      try {
        imagen =
          await cargarImagenEnNavegador(
            file
          );

      } catch {
        throw new Error(
          `"${file.name}" no puede optimizarse automáticamente en este navegador.`
        );
      }


      const anchoOriginal =
        imagen.naturalWidth ||
        imagen.width;

      const altoOriginal =
        imagen.naturalHeight ||
        imagen.height;


      const escala =
        Math.min(
          1,

          MAX_DIMENSION_OPTIMIZADA /
            Math.max(
              anchoOriginal,
              altoOriginal
            )
        );


      const ancho =
        Math.max(
          1,

          Math.round(
            anchoOriginal *
              escala
          )
        );


      const alto =
        Math.max(
          1,

          Math.round(
            altoOriginal *
              escala
          )
        );


      const canvas =
        document.createElement(
          "canvas"
        );

      canvas.width =
        ancho;

      canvas.height =
        alto;


      const ctx =
        canvas.getContext(
          "2d"
        );


      if (!ctx) {
        throw new Error(
          `No se pudo preparar "${file.name}".`
        );
      }


      ctx.imageSmoothingEnabled =
        true;

      ctx.imageSmoothingQuality =
        "high";

      ctx.fillStyle =
        "#ffffff";

      ctx.fillRect(
        0,
        0,
        ancho,
        alto
      );

      ctx.drawImage(
        imagen,
        0,
        0,
        ancho,
        alto
      );


      let calidad =
        CALIDAD_INICIAL;


      let blob =
        await canvasABlob(
          canvas,
          "image/jpeg",
          calidad
        );


      while (
        blob.size >
          LIMITE_CLOUDINARY_BYTES &&
        calidad >
          CALIDAD_MINIMA
      ) {
        calidad =
          Math.max(
            CALIDAD_MINIMA,

            calidad -
              0.08
          );


        blob =
          await canvasABlob(
            canvas,
            "image/jpeg",
            calidad
          );
      }


      if (
        blob.size >
        LIMITE_CLOUDINARY_BYTES
      ) {
        throw new Error(
          `"${file.name}" continúa siendo demasiado pesada después de optimizarla.`
        );
      }


      const nombreSinExtension =
        file.name.replace(
          /\.[^/.]+$/,
          ""
        );


      return new File(
        [
          blob,
        ],

        `${nombreSinExtension}-optimizada.jpg`,

        {
          type:
            "image/jpeg",

          lastModified:
            Date.now(),
        }
      );
    };


  /* ======================================================
     OPTIMIZAR VARIAS
  ====================================================== */

  const optimizarArchivos =
    async (files) => {
      const lista =
        Array.from(
          files || []
        );

      const resultado =
        [];


      for (
        const file of lista
      ) {
        const optimizado =
          await optimizarImagen(
            file
          );

        resultado.push(
          optimizado
        );
      }


      return resultado;
    };


  /* ======================================================
     VALIDAR ARCHIVO
  ====================================================== */

  const validarArchivo =
    (file) => {
      if (
        !file.type.startsWith(
          "image/"
        )
      ) {
        return `"${file.name}" no es una imagen válida.`;
      }

      return null;
    };


  /* ======================================================
     PRINCIPALES
  ====================================================== */

  const handlePreviewImagenes =
    async (files) => {
      setError("");
      setMensaje("");


      const originales =
        Array.from(
          files || []
        );


      if (
        originales.length ===
        0
      ) {
        return;
      }


      let nuevos;


      try {
        setLoading(true);

        nuevos =
          await optimizarArchivos(
            originales
          );

      } catch (uploadError) {
        setError(
          uploadError.message ||
          "No se pudieron preparar las imágenes."
        );

        return;

      } finally {
        setLoading(false);
      }


      const total =
        imagenesExistentes.length +
        imagenes.length +
        nuevos.length;


      if (
        total >
        MAX_IMAGENES
      ) {
        setError(
          `Puedes tener un máximo de ${MAX_IMAGENES} imágenes principales.`
        );

        return;
      }


      for (
        const file of nuevos
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


      const previews =
        nuevos.map(
          (file) => ({
            file,

            url:
              URL.createObjectURL(
                file
              ),
          })
        );


      setImagenes(
        (prev) => [
          ...prev,
          ...nuevos,
        ]
      );


      setPreviewImagenes(
        (prev) => [
          ...prev,
          ...previews,
        ]
      );
    };


  /* ======================================================
     GALERÍA
  ====================================================== */

  const handlePreviewGaleria =
    async (files) => {
      setError("");
      setMensaje("");


      const originales =
        Array.from(
          files || []
        );


      if (
        originales.length ===
        0
      ) {
        return;
      }


      let nuevos;


      try {
        setLoading(true);

        nuevos =
          await optimizarArchivos(
            originales
          );

      } catch (uploadError) {
        setError(
          uploadError.message ||
          "No se pudieron preparar las capturas."
        );

        return;

      } finally {
        setLoading(false);
      }


      const total =
        galeriaExistente.length +
        galeria.length +
        nuevos.length;


      if (
        total >
        MAX_GALERIA
      ) {
        setError(
          `Puedes tener un máximo de ${MAX_GALERIA} imágenes adicionales.`
        );

        return;
      }


      for (
        const file of nuevos
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


      const previews =
        nuevos.map(
          (file) => ({
            file,

            url:
              URL.createObjectURL(
                file
              ),
          })
        );


      setGaleria(
        (prev) => [
          ...prev,
          ...nuevos,
        ]
      );


      setPreviewGaleria(
        (prev) => [
          ...prev,
          ...previews,
        ]
      );
    };


  /* ======================================================
     ELIMINAR NUEVAS
  ====================================================== */

  const eliminarNuevaImagen =
    (index) => {
      const preview =
        previewImagenes[
          index
        ];


      if (
        preview?.url
      ) {
        URL.revokeObjectURL(
          preview.url
        );
      }


      setImagenes(
        (prev) =>
          prev.filter(
            (_, i) =>
              i !== index
          )
      );


      setPreviewImagenes(
        (prev) =>
          prev.filter(
            (_, i) =>
              i !== index
          )
      );
    };


  const eliminarNuevaGaleria =
    (index) => {
      const preview =
        previewGaleria[
          index
        ];


      if (
        preview?.url
      ) {
        URL.revokeObjectURL(
          preview.url
        );
      }


      setGaleria(
        (prev) =>
          prev.filter(
            (_, i) =>
              i !== index
          )
      );


      setPreviewGaleria(
        (prev) =>
          prev.filter(
            (_, i) =>
              i !== index
          )
      );
    };


  /* ======================================================
     ELIMINAR EXISTENTE
  ====================================================== */

  const eliminarImg =
    (
      url,
      tipoImagen
    ) => {
      if (
        tipoImagen ===
        "main"
      ) {
        setImagenesExistentes(
          (prev) =>
            prev.filter(
              (imagen) =>
                imagen !== url
            )
        );

        return;
      }


      setGaleriaExistente(
        (prev) =>
          prev.filter(
            (imagen) =>
              imagen !== url
          )
      );
    };


  /* ======================================================
     CLOUDINARY
  ====================================================== */

  const subirImagen =
    async (file) => {
      const formData =
        new FormData();


      formData.append(
        "file",
        file
      );


      formData.append(
        "upload_preset",
        CLOUDINARY_UPLOAD_PRESET
      );


      const res =
        await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,

          {
            method:
              "POST",

            body:
              formData,
          }
        );


      if (!res.ok) {
        let detalle =
          "";


        try {
          const errorData =
            await res.json();

          detalle =
            errorData
              ?.error
              ?.message ||
            "";

        } catch {
          // ignorar
        }


        throw new Error(
          detalle
            ? `No se pudo subir "${file.name}": ${detalle}`
            : `No se pudo subir "${file.name}".`
        );
      }


      const data =
        await res.json();


      if (
        !data.secure_url
      ) {
        throw new Error(
          "Cloudinary no devolvió la URL de la imagen."
        );
      }


      return data.secure_url;
    };


  /* ======================================================
     LIMPIAR FORMULARIO
  ====================================================== */

  const limpiarFormulario =
    () => {
      previewImagenes.forEach(
        (item) => {
          URL.revokeObjectURL(
            item.url
          );
        }
      );


      previewGaleria.forEach(
        (item) => {
          URL.revokeObjectURL(
            item.url
          );
        }
      );


      setNombre("");
      setDescripcion("");

      setTipo("web");

      setCliente("");

      setEstado(
        "Finalizado"
      );

      setTecnologiasTexto("");

      setUrlProyecto("");

      setDestacado(false);


      setPlataformaApp(
        "Ambas"
      );

      setAppStoreUrl("");

      setPlayStoreUrl("");


      setCantidadCamaras("");

      setTipoInstalacion("");


      setTipoCampana("");

      setPlataformasPublicidad("");


      setImagenes([]);

      setGaleria([]);

      setPreviewImagenes([]);

      setPreviewGaleria([]);

      setImagenesExistentes([]);

      setGaleriaExistente([]);

      setEditId(null);

      setError("");
    };


  /* ======================================================
     CANCELAR EDICIÓN
  ====================================================== */

  const cancelarEdicion =
    () => {
      limpiarFormulario();

      setMensaje(
        "Edición cancelada."
      );
    };


  /* ======================================================
     VALIDAR
  ====================================================== */

  const validarFormulario =
    () => {
      setError("");


      if (
        nombre.trim().length <
        3
      ) {
        setError(
          "Escribe un nombre válido para el proyecto."
        );

        return false;
      }


      if (
        descripcion
          .trim()
          .length <
        10
      ) {
        setError(
          "La descripción debe tener al menos 10 caracteres."
        );

        return false;
      }


      const totalImagenes =
        imagenesExistentes.length +
        imagenes.length;


      if (
        totalImagenes ===
        0
      ) {
        setError(
          "Agrega al menos una imagen principal del proyecto."
        );

        return false;
      }


      return true;
    };


  /* ======================================================
     TECNOLOGÍAS ARRAY
  ====================================================== */

  const obtenerTecnologias =
    () => {
      return tecnologiasTexto
        .split(",")
        .map(
          (item) =>
            item.trim()
        )
        .filter(Boolean);
    };


  /* ======================================================
     NOMBRE CATEGORÍA
  ====================================================== */

  const obtenerNombreTipo =
    (tipoProyecto) => {
      return (
        tiposProyecto.find(
          (item) =>
            item.value ===
            tipoProyecto
        )?.label ||
        "Otro"
      );
    };


  /* ======================================================
     CREATE / UPDATE
  ====================================================== */

  const handleSubmit =
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

        setError("");


        /* =====================================
           SUBIR IMÁGENES
        ===================================== */

        const urls =
          imagenes.length >
          0
            ? await Promise.all(
                imagenes.map(
                  subirImagen
                )
              )
            : [];


        const galeriaUrls =
          galeria.length >
          0
            ? await Promise.all(
                galeria.map(
                  subirImagen
                )
              )
            : [];


        const imagenesFinales = [
          ...imagenesExistentes,
          ...urls,
        ];


        const galeriaFinal = [
          ...galeriaExistente,
          ...galeriaUrls,
        ];


        /* =====================================
           BASE
        ===================================== */

        const datos = {
          nombre:
            nombre.trim(),

          descripcion:
            descripcion.trim(),

          tipo,

          categoria:
            obtenerNombreTipo(
              tipo
            ),

          cliente:
            cliente.trim(),

          estado,

          tecnologias:
            obtenerTecnologias(),

          urlProyecto:
            urlProyecto.trim(),

          destacado,

          imagenes:
            imagenesFinales,

          imagen:
            imagenesFinales[0] ||
            "",

          galeria:
            galeriaFinal,

          fechaActualizacion:
            serverTimestamp(),
        };


        /* =====================================
           DATOS APP
        ===================================== */

        if (
          tipo ===
          "app"
        ) {
          datos.plataforma =
            plataformaApp;

          datos.appStoreUrl =
            appStoreUrl.trim();

          datos.playStoreUrl =
            playStoreUrl.trim();
        }


        /* =====================================
           CÁMARAS
        ===================================== */

        if (
          tipo ===
          "camaras"
        ) {
          datos.cantidadCamaras =
            cantidadCamaras
              ? Number(
                  cantidadCamaras
                )
              : 0;

          datos.tipoInstalacion =
            tipoInstalacion.trim();
        }


        /* =====================================
           PUBLICIDAD
        ===================================== */

        if (
          tipo ===
          "publicidad"
        ) {
          datos.tipoCampana =
            tipoCampana.trim();

          datos.plataformasPublicidad =
            plataformasPublicidad.trim();
        }


        /* =====================================
           EDITAR
        ===================================== */

        if (editId) {
          await updateDoc(
            doc(
              db,
              "proyectos",
              editId
            ),

            datos
          );


          setMensaje(
            "Proyecto actualizado correctamente."
          );
        }


        /* =====================================
           NUEVO
        ===================================== */

        else {
          await addDoc(
            collection(
              db,
              "proyectos"
            ),

            {
              ...datos,

              fechaCreacion:
                serverTimestamp(),

              fecha:
                serverTimestamp(),
            }
          );


          setMensaje(
            "Proyecto publicado correctamente en Macro."
          );
        }


        limpiarFormulario();


        window.scrollTo({
          top: 0,

          behavior:
            "smooth",
        });

      } catch (firebaseError) {
        console.error(
          "Error guardando proyecto:",
          firebaseError
        );


        setError(
          firebaseError.message ||
          "No se pudo guardar el proyecto."
        );

      } finally {
        setLoading(false);
      }
    };


  /* ======================================================
     EDITAR
  ====================================================== */

  const handleEdit =
    (proyecto) => {
      setMensaje("");
      setError("");


      setEditId(
        proyecto.id
      );


      setNombre(
        proyecto.nombre ||
        ""
      );


      setDescripcion(
        proyecto.descripcion ||
        ""
      );


      setTipo(
        proyecto.tipo ||
        "web"
      );


      setCliente(
        proyecto.cliente ||
        ""
      );


      setEstado(
        proyecto.estado ||
        "Finalizado"
      );


      setTecnologiasTexto(
        Array.isArray(
          proyecto.tecnologias
        )
          ? proyecto.tecnologias.join(
              ", "
            )
          : proyecto.tecnologias ||
            ""
      );


      setUrlProyecto(
        proyecto.urlProyecto ||
        proyecto.url ||
        ""
      );


      setDestacado(
        Boolean(
          proyecto.destacado
        )
      );


      setPlataformaApp(
        proyecto.plataforma ||
        "Ambas"
      );


      setAppStoreUrl(
        proyecto.appStoreUrl ||
        ""
      );


      setPlayStoreUrl(
        proyecto.playStoreUrl ||
        ""
      );


      setCantidadCamaras(
        proyecto.cantidadCamaras ||
        ""
      );


      setTipoInstalacion(
        proyecto.tipoInstalacion ||
        ""
      );


      setTipoCampana(
        proyecto.tipoCampana ||
        ""
      );


      setPlataformasPublicidad(
        proyecto.plataformasPublicidad ||
        ""
      );


      setImagenesExistentes(
        Array.isArray(
          proyecto.imagenes
        )
          ? proyecto.imagenes
          : proyecto.imagen
          ? [
              proyecto.imagen,
            ]
          : []
      );


      setGaleriaExistente(
        Array.isArray(
          proyecto.galeria
        )
          ? proyecto.galeria
          : []
      );


      setImagenes([]);
      setGaleria([]);

      setPreviewImagenes([]);
      setPreviewGaleria([]);


      window.scrollTo({
        top: 0,

        behavior:
          "smooth",
      });
    };


  /* ======================================================
     ELIMINAR
  ====================================================== */

  const handleDelete =
    async (id) => {
      const proyecto =
        proyectos.find(
          (item) =>
            item.id === id
        );


      const ok =
        window.confirm(
          `¿Eliminar "${
            proyecto?.nombre ||
            "este proyecto"
          }" definitivamente?`
        );


      if (!ok) {
        return;
      }


      try {
        await deleteDoc(
          doc(
            db,
            "proyectos",
            id
          )
        );


        if (
          editId === id
        ) {
          limpiarFormulario();
        }

      } catch (firebaseError) {
        console.error(
          "Error eliminando proyecto:",
          firebaseError
        );


        setError(
          "No se pudo eliminar el proyecto."
        );
      }
    };


  /* ======================================================
     FILTRADOS
  ====================================================== */

  const proyectosFiltrados =
    useMemo(() => {
      const texto =
        busqueda
          .trim()
          .toLowerCase();


      return proyectos.filter(
        (proyecto) => {
          const contenido = [
            proyecto.nombre,
            proyecto.descripcion,
            proyecto.categoria,
            proyecto.tipo,
            proyecto.cliente,
            proyecto.estado,

            ...(Array.isArray(
              proyecto.tecnologias
            )
              ? proyecto.tecnologias
              : []),
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();


          const coincideBusqueda =
            !texto ||
            contenido.includes(
              texto
            );


          const coincideTipo =
            filtro === "todos" ||
            proyecto.tipo ===
              filtro;


          return (
            coincideBusqueda &&
            coincideTipo
          );
        }
      );

    }, [
      proyectos,
      busqueda,
      filtro,
    ]);


  /* ======================================================
     CONTADORES
  ====================================================== */

  const totalPrincipales =
    imagenesExistentes.length +
    imagenes.length;


  const totalGaleria =
    galeriaExistente.length +
    galeria.length;


  /* ======================================================
     RENDER
  ====================================================== */

  return (
    <div
      className={`
        min-h-screen

        px-4
        sm:px-6

        py-8
        md:py-12

        transition-colors

        ${
          modoOscuro
            ? `
              bg-slate-950
              text-white
            `
            : `
              bg-[#f7fcff]
              text-slate-900
            `
        }
      `}
    >

      <div
        className="
          max-w-7xl
          mx-auto
        "
      >

        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <div
          className="
            flex
            flex-col

            lg:flex-row
            lg:items-center
            lg:justify-between

            gap-5

            mb-9
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
                w-14
                h-14

                rounded-2xl

                bg-gradient-to-br
                from-sky-400
                to-blue-500

                text-white

                flex
                items-center
                justify-center

                shrink-0

                shadow-lg
                shadow-sky-200/30
              "
            >

              <FaLaptopCode
                size={23}
              />

            </div>


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

                Macro Admin

              </p>


              <h1
                className="
                  text-3xl
                  md:text-4xl

                  font-black

                  mt-1
                "
              >

                Proyectos

              </h1>


              <p
                className="
                  text-slate-500

                  mt-1
                "
              >

                Crea y administra el portafolio tecnológico de Macro.

              </p>

            </div>

          </div>


          <button
            type="button"
            onClick={() =>
              navigate("/")
            }
            className={botonSecundario(
              modoOscuro
            )}
          >

            <FaGlobe />

            Ver página pública

            <FaArrowRight />

          </button>

        </div>


        {/* ================================================= */}
        {/* ALERTAS */}
        {/* ================================================= */}

        {error && (

          <div
            className="
              mb-6

              bg-red-50
              border
              border-red-200

              text-red-600

              px-5
              py-4

              rounded-2xl

              flex
              items-start
              gap-3
            "
          >

            <FaExclamationTriangle className="mt-0.5 shrink-0" />

            <span>
              {error}
            </span>

          </div>

        )}


        {mensaje && (

          <div
            className="
              mb-6

              bg-emerald-50
              border
              border-emerald-200

              text-emerald-600

              px-5
              py-4

              rounded-2xl

              flex
              items-start
              gap-3
            "
          >

            <FaCheckCircle className="mt-0.5 shrink-0" />

            <span>
              {mensaje}
            </span>

          </div>

        )}


        {/* ================================================= */}
        {/* EDITANDO */}
        {/* ================================================= */}

        {editId && (

          <div
            className="
              mb-6

              bg-blue-50
              border
              border-blue-200

              rounded-2xl

              p-5

              flex
              flex-col
              sm:flex-row

              sm:items-center
              justify-between

              gap-4
            "
          >

            <div
              className="
                flex
                items-center
                gap-3
              "
            >

              <FaEdit
                className="
                  text-blue-500
                "
              />


              <div>

                <p
                  className="
                    font-bold
                    text-slate-900
                  "
                >

                  Editando proyecto

                </p>


                <p
                  className="
                    text-sm
                    text-slate-500
                  "
                >

                  {nombre}

                </p>

              </div>

            </div>


            <button
              type="button"
              onClick={
                cancelarEdicion
              }
              className="
                px-4
                py-2.5

                rounded-xl

                bg-white

                border
                border-red-200

                text-red-500

                font-semibold

                flex
                items-center
                justify-center
                gap-2
              "
            >

              <FaTimes />

              Cancelar edición

            </button>

          </div>

        )}


        {/* ================================================= */}
        {/* FORM */}
        {/* ================================================= */}

        <div
          className={`
            rounded-[30px]

            overflow-hidden

            border

            shadow-xl

            ${
              modoOscuro
                ? `
                  bg-slate-900
                  border-slate-800
                `
                : `
                  bg-white
                  border-sky-100
                  shadow-sky-100/50
                `
            }
          `}
        >

          {/* HEADER FORM */}

          <div
            className={`
              p-6
              md:p-8

              border-b

              ${
                modoOscuro
                  ? "border-slate-800"
                  : "border-sky-100"
              }
            `}
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

                  bg-sky-50
                  border
                  border-sky-100

                  text-sky-500

                  flex
                  items-center
                  justify-center
                "
              >

                {editId
                  ? <FaEdit />
                  : <FaPlus />
                }

              </div>


              <div>

                <h2
                  className="
                    text-xl
                    md:text-2xl

                    font-bold
                  "
                >

                  {editId
                    ? "Editar proyecto"
                    : "Nuevo proyecto"
                  }

                </h2>


                <p
                  className="
                    text-sm
                    text-slate-500

                    mt-1
                  "
                >

                  La información aparecerá en el portafolio público de Macro.

                </p>

              </div>

            </div>

          </div>


          <form
            onSubmit={
              handleSubmit
            }
            className="
              p-6
              md:p-8
              lg:p-10

              space-y-10
            "
          >

            {/* ================================================= */}
            {/* 01 TIPO */}
            {/* ================================================= */}

            <section>

              <TituloSeccion
                numero="01"
                titulo="Tipo de proyecto"
                descripcion="Selecciona qué clase de solución tecnológica estás publicando."
              />


              <div
                className="
                  grid
                  sm:grid-cols-2
                  lg:grid-cols-3

                  gap-3

                  mt-6
                "
              >

                {tiposProyecto.map(
                  (item) => (

                    <button
                      key={
                        item.value
                      }
                      type="button"
                      onClick={() =>
                        setTipo(
                          item.value
                        )
                      }
                      className={`
                        p-4

                        rounded-2xl

                        border

                        text-left

                        flex
                        items-center
                        gap-3

                        transition-all

                        ${
                          tipo ===
                          item.value
                            ? `
                              bg-sky-50
                              border-sky-400
                              text-sky-700
                              shadow-sm
                            `
                            : modoOscuro
                            ? `
                              bg-slate-950
                              border-slate-700
                              text-slate-300

                              hover:border-sky-500/40
                            `
                            : `
                              bg-white
                              border-slate-200
                              text-slate-600

                              hover:border-sky-300
                            `
                        }
                      `}
                    >

                      <div
                        className={`
                          w-10
                          h-10

                          rounded-xl

                          flex
                          items-center
                          justify-center

                          ${
                            tipo ===
                            item.value
                              ? `
                                bg-sky-400
                                text-white
                              `
                              : `
                                bg-sky-50
                                text-sky-500
                              `
                          }
                        `}
                      >

                        {item.icon}

                      </div>


                      <span
                        className="
                          font-semibold
                          text-sm
                        "
                      >

                        {item.label}

                      </span>

                    </button>

                  )
                )}

              </div>

            </section>


            {/* ================================================= */}
            {/* 02 INFORMACIÓN */}
            {/* ================================================= */}

            <section
              className={`
                border-t
                pt-9

                ${
                  modoOscuro
                    ? "border-slate-800"
                    : "border-sky-100"
                }
              `}
            >

              <TituloSeccion
                numero="02"
                titulo="Información del proyecto"
                descripcion="Datos principales que verá el público."
              />


              <div
                className="
                  space-y-5

                  mt-6
                "
              >

                <Campo
                  titulo="Nombre del proyecto"
                  icon={<FaLaptopCode />}
                >

                  <input
                    type="text"
                    value={
                      nombre
                    }
                    onChange={(e) =>
                      setNombre(
                        e.target.value
                      )
                    }
                    maxLength={120}
                    placeholder={
                      tipo === "web"
                        ? "Ej. Página web para Restaurante Riviera"
                        : tipo === "app"
                        ? "Ej. Aplicación móvil de reservaciones"
                        : tipo === "camaras"
                        ? "Ej. Sistema de videovigilancia para oficina"
                        : "Nombre del proyecto"
                    }
                    className={
                      inputClass(
                        modoOscuro
                      )
                    }
                  />

                  <ContadorTexto
                    actual={
                      nombre.length
                    }
                    max={120}
                  />

                </Campo>


                <div
                  className="
                    grid
                    md:grid-cols-2

                    gap-5
                  "
                >

                  <Campo
                    titulo="Cliente"
                    icon={<FaTag />}
                    opcional
                  >

                    <input
                      type="text"
                      value={
                        cliente
                      }
                      onChange={(e) =>
                        setCliente(
                          e.target.value
                        )
                      }
                      placeholder="Empresa o cliente"
                      className={
                        inputClass(
                          modoOscuro
                        )
                      }
                    />

                  </Campo>


                  <Campo
                    titulo="Estado"
                    icon={<FaCheckCircle />}
                  >

                    <select
                      value={
                        estado
                      }
                      onChange={(e) =>
                        setEstado(
                          e.target.value
                        )
                      }
                      className={
                        inputClass(
                          modoOscuro
                        )
                      }
                    >

                      {estadosProyecto.map(
                        (item) => (

                          <option
                            key={
                              item
                            }
                            value={
                              item
                            }
                          >

                            {item}

                          </option>

                        )
                      )}

                    </select>

                  </Campo>

                </div>


                <Campo
                  titulo="Descripción"
                  icon={<FaLayerGroup />}
                >

                  <textarea
                    rows={6}
                    value={
                      descripcion
                    }
                    onChange={(e) =>
                      setDescripcion(
                        e.target.value
                      )
                    }
                    maxLength={1500}
                    placeholder="Describe el proyecto, objetivo, características principales y solución desarrollada..."
                    className={
                      inputClass(
                        modoOscuro
                      )
                    }
                  />

                  <ContadorTexto
                    actual={
                      descripcion.length
                    }
                    max={1500}
                  />

                </Campo>


                <Campo
                  titulo="Tecnologías utilizadas"
                  icon={<FaCode />}
                  opcional
                >

                  <input
                    type="text"
                    value={
                      tecnologiasTexto
                    }
                    onChange={(e) =>
                      setTecnologiasTexto(
                        e.target.value
                      )
                    }
                    placeholder="React, Firebase, Node.js, Flutter..."
                    className={
                      inputClass(
                        modoOscuro
                      )
                    }
                  />

                  <p
                    className="
                      text-xs
                      text-slate-400

                      mt-2
                    "
                  >

                    Separa cada tecnología con una coma.

                  </p>

                </Campo>

              </div>

            </section>


            {/* ================================================= */}
            {/* 03 DATOS SEGÚN TIPO */}
            {/* ================================================= */}

            <section
              className={`
                border-t
                pt-9

                ${
                  modoOscuro
                    ? "border-slate-800"
                    : "border-sky-100"
                }
              `}
            >

              <TituloSeccion
                numero="03"
                titulo="Detalles específicos"
                descripcion={`Información adicional para ${obtenerNombreTipo(
                  tipo
                )}.`}
              />


              <div
                className="
                  mt-6
                  space-y-5
                "
              >

                {/* WEB / SOFTWARE */}

                {[
                  "web",
                  "software",
                ].includes(
                  tipo
                ) && (

                  <Campo
                    titulo="URL del proyecto"
                    icon={<FaLink />}
                    opcional
                  >

                    <input
                      type="url"
                      value={
                        urlProyecto
                      }
                      onChange={(e) =>
                        setUrlProyecto(
                          e.target.value
                        )
                      }
                      placeholder="https://www.ejemplo.com"
                      className={
                        inputClass(
                          modoOscuro
                        )
                      }
                    />

                  </Campo>

                )}


                {/* APP */}

                {tipo === "app" && (
                  <>

                    <Campo
                      titulo="Plataforma"
                      icon={<FaMobileAlt />}
                    >

                      <select
                        value={
                          plataformaApp
                        }
                        onChange={(e) =>
                          setPlataformaApp(
                            e.target.value
                          )
                        }
                        className={
                          inputClass(
                            modoOscuro
                          )
                        }
                      >

                        <option>
                          Ambas
                        </option>

                        <option>
                          Android
                        </option>

                        <option>
                          iOS
                        </option>

                      </select>

                    </Campo>


                    <div
                      className="
                        grid
                        md:grid-cols-2

                        gap-5
                      "
                    >

                      <Campo
                        titulo="Google Play"
                        icon={<FaAndroid />}
                        opcional
                      >

                        <input
                          type="url"
                          value={
                            playStoreUrl
                          }
                          onChange={(e) =>
                            setPlayStoreUrl(
                              e.target.value
                            )
                          }
                          placeholder="Link de Google Play"
                          className={
                            inputClass(
                              modoOscuro
                            )
                          }
                        />

                      </Campo>


                      <Campo
                        titulo="App Store"
                        icon={<FaApple />}
                        opcional
                      >

                        <input
                          type="url"
                          value={
                            appStoreUrl
                          }
                          onChange={(e) =>
                            setAppStoreUrl(
                              e.target.value
                            )
                          }
                          placeholder="Link de App Store"
                          className={
                            inputClass(
                              modoOscuro
                            )
                          }
                        />

                      </Campo>

                    </div>

                  </>
                )}


                {/* CAMARAS */}

                {tipo === "camaras" && (
                  <div
                    className="
                      grid
                      md:grid-cols-2

                      gap-5
                    "
                  >

                    <Campo
                      titulo="Cantidad de cámaras"
                      icon={<FaCamera />}
                      opcional
                    >

                      <input
                        type="number"
                        min="0"
                        value={
                          cantidadCamaras
                        }
                        onChange={(e) =>
                          setCantidadCamaras(
                            e.target.value
                          )
                        }
                        placeholder="Ej. 8"
                        className={
                          inputClass(
                            modoOscuro
                          )
                        }
                      />

                    </Campo>


                    <Campo
                      titulo="Tipo de instalación"
                      icon={<FaShieldAlt />}
                      opcional
                    >

                      <input
                        type="text"
                        value={
                          tipoInstalacion
                        }
                        onChange={(e) =>
                          setTipoInstalacion(
                            e.target.value
                          )
                        }
                        placeholder="CCTV, IP, inalámbrica..."
                        className={
                          inputClass(
                            modoOscuro
                          )
                        }
                      />

                    </Campo>

                  </div>
                )}


                {/* PUBLICIDAD */}

                {tipo ===
                  "publicidad" && (

                  <div
                    className="
                      grid
                      md:grid-cols-2

                      gap-5
                    "
                  >

                    <Campo
                      titulo="Tipo de campaña"
                      icon={<FaBullhorn />}
                      opcional
                    >

                      <input
                        type="text"
                        value={
                          tipoCampana
                        }
                        onChange={(e) =>
                          setTipoCampana(
                            e.target.value
                          )
                        }
                        placeholder="Redes sociales, branding, anuncios..."
                        className={
                          inputClass(
                            modoOscuro
                          )
                        }
                      />

                    </Campo>


                    <Campo
                      titulo="Plataformas"
                      icon={<FaGlobe />}
                      opcional
                    >

                      <input
                        type="text"
                        value={
                          plataformasPublicidad
                        }
                        onChange={(e) =>
                          setPlataformasPublicidad(
                            e.target.value
                          )
                        }
                        placeholder="Facebook, Instagram, Google..."
                        className={
                          inputClass(
                            modoOscuro
                          )
                        }
                      />

                    </Campo>

                  </div>

                )}

              </div>

            </section>


            {/* ================================================= */}
            {/* 04 MULTIMEDIA */}
            {/* ================================================= */}

            <section
              className={`
                border-t
                pt-9

                ${
                  modoOscuro
                    ? "border-slate-800"
                    : "border-sky-100"
                }
              `}
            >

              <TituloSeccion
                numero="04"
                titulo="Multimedia"
                descripcion="Sube la portada, capturas de pantalla o fotografías del proyecto."
              />


              {/* PRINCIPALES */}

              <div className="mt-6">

                <div
                  className="
                    flex
                    flex-wrap

                    justify-between
                    items-end

                    gap-3

                    mb-3
                  "
                >

                  <div>

                    <p
                      className="
                        font-semibold

                        flex
                        items-center
                        gap-2
                      "
                    >

                      <FaImage className="text-sky-500" />

                      Imágenes principales

                    </p>


                    <p
                      className="
                        text-xs
                        text-slate-500

                        mt-1
                      "
                    >

                      La primera imagen será la portada del proyecto.

                    </p>

                  </div>


                  <ContadorImagenes
                    actual={
                      totalPrincipales
                    }
                    max={
                      MAX_IMAGENES
                    }
                    modoOscuro={
                      modoOscuro
                    }
                  />

                </div>


                <SelectorImagenes
                  titulo="Agregar imágenes principales"
                  descripcion="JPG, PNG o WEBP · Las imágenes grandes se optimizan automáticamente"
                  onChange={
                    handlePreviewImagenes
                  }
                  loading={
                    loading
                  }
                />


                {imagenesExistentes.length >
                  0 && (

                  <GrupoImagenes
                    titulo="Imágenes guardadas"
                  >

                    {imagenesExistentes.map(
                      (
                        img,
                        index
                      ) => (

                        <ImagenPreview
                          key={
                            img
                          }
                          src={
                            img
                          }
                          etiqueta={
                            index ===
                            0
                              ? "PORTADA"
                              : "GUARDADA"
                          }
                          onDelete={() =>
                            eliminarImg(
                              img,
                              "main"
                            )
                          }
                        />

                      )
                    )}

                  </GrupoImagenes>

                )}


                {previewImagenes.length >
                  0 && (

                  <GrupoImagenes
                    titulo="Nuevas imágenes"
                  >

                    {previewImagenes.map(
                      (
                        item,
                        index
                      ) => (

                        <ImagenPreview
                          key={`${item.file.name}-${index}`}
                          src={
                            item.url
                          }
                          etiqueta="NUEVA"
                          onDelete={() =>
                            eliminarNuevaImagen(
                              index
                            )
                          }
                        />

                      )
                    )}

                  </GrupoImagenes>

                )}

              </div>


              {/* GALERIA */}

              <div className="mt-9">

                <div
                  className="
                    flex
                    flex-wrap

                    justify-between
                    items-end

                    gap-3

                    mb-3
                  "
                >

                  <div>

                    <p
                      className="
                        font-semibold

                        flex
                        items-center
                        gap-2
                      "
                    >

                      <FaImages className="text-blue-500" />

                      Galería / capturas

                    </p>


                    <p
                      className="
                        text-xs
                        text-slate-500

                        mt-1
                      "
                    >

                      Pantallas de la app, secciones web, resultados o fotografías adicionales.

                    </p>

                  </div>


                  <ContadorImagenes
                    actual={
                      totalGaleria
                    }
                    max={
                      MAX_GALERIA
                    }
                    modoOscuro={
                      modoOscuro
                    }
                  />

                </div>


                <SelectorImagenes
                  titulo="Agregar capturas o fotografías"
                  descripcion="Hasta 12 imágenes adicionales"
                  onChange={
                    handlePreviewGaleria
                  }
                  loading={
                    loading
                  }
                />


                {galeriaExistente.length >
                  0 && (

                  <GrupoImagenes
                    titulo="Galería guardada"
                  >

                    {galeriaExistente.map(
                      (img) => (

                        <ImagenPreview
                          key={
                            img
                          }
                          src={
                            img
                          }
                          etiqueta="GUARDADA"
                          onDelete={() =>
                            eliminarImg(
                              img,
                              "galeria"
                            )
                          }
                        />

                      )
                    )}

                  </GrupoImagenes>

                )}


                {previewGaleria.length >
                  0 && (

                  <GrupoImagenes
                    titulo="Nuevas capturas"
                  >

                    {previewGaleria.map(
                      (
                        item,
                        index
                      ) => (

                        <ImagenPreview
                          key={`${item.file.name}-${index}`}
                          src={
                            item.url
                          }
                          etiqueta="NUEVA"
                          onDelete={() =>
                            eliminarNuevaGaleria(
                              index
                            )
                          }
                        />

                      )
                    )}

                  </GrupoImagenes>

                )}

              </div>

            </section>


            {/* ================================================= */}
            {/* 05 PUBLICACIÓN */}
            {/* ================================================= */}

            <section
              className={`
                border-t
                pt-9

                ${
                  modoOscuro
                    ? "border-slate-800"
                    : "border-sky-100"
                }
              `}
            >

              <TituloSeccion
                numero="05"
                titulo="Publicación"
                descripcion="Configura la visibilidad del proyecto dentro de Macro."
              />


              <button
                type="button"
                onClick={() =>
                  setDestacado(
                    (actual) =>
                      !actual
                  )
                }
                className={`
                  w-full

                  mt-6

                  rounded-2xl

                  border

                  p-5

                  text-left

                  flex
                  items-center
                  justify-between

                  gap-4

                  transition-all

                  ${
                    destacado
                      ? `
                        bg-sky-50
                        border-sky-400
                      `
                      : modoOscuro
                      ? `
                        bg-slate-950
                        border-slate-700
                      `
                      : `
                        bg-slate-50
                        border-slate-200
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

                  <div
                    className={`
                      w-11
                      h-11

                      rounded-xl

                      border

                      flex
                      items-center
                      justify-center

                      ${
                        destacado
                          ? `
                            bg-sky-400
                            border-sky-400
                            text-white
                          `
                          : `
                            bg-white
                            border-slate-200
                            text-slate-400
                          `
                      }
                    `}
                  >

                    {destacado
                      ? <FaStar />
                      : <FaRegStar />
                    }

                  </div>


                  <div>

                    <p className="font-bold">

                      Proyecto destacado

                    </p>


                    <p
                      className="
                        text-sm
                        text-slate-500

                        mt-1
                      "
                    >

                      Los proyectos destacados tendrán mayor presencia en el Home y el portafolio.

                    </p>

                  </div>

                </div>


                <div
                  className={`
                    relative

                    w-12
                    h-7

                    rounded-full

                    shrink-0

                    transition

                    ${
                      destacado
                        ? "bg-sky-400"
                        : "bg-slate-300"
                    }
                  `}
                >

                  <div
                    className={`
                      absolute
                      top-1

                      w-5
                      h-5

                      rounded-full

                      bg-white

                      shadow

                      transition-all

                      ${
                        destacado
                          ? "left-6"
                          : "left-1"
                      }
                    `}
                  />

                </div>

              </button>


              <div
                className="
                  flex
                  flex-col
                  sm:flex-row

                  gap-3

                  mt-7
                "
              >

                {editId && (

                  <button
                    type="button"
                    onClick={
                      cancelarEdicion
                    }
                    disabled={
                      loading
                    }
                    className={botonSecundario(
                      modoOscuro
                    )}
                  >

                    <FaTimes />

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

                    bg-sky-400
                    hover:bg-sky-500

                    text-white

                    px-6
                    py-4

                    rounded-2xl

                    font-bold

                    flex
                    items-center
                    justify-center
                    gap-3

                    shadow-lg
                    shadow-sky-200/30

                    transition

                    disabled:opacity-50
                    disabled:cursor-not-allowed
                  "
                >

                  {editId
                    ? <FaSave />
                    : <FaCloudUploadAlt />
                  }


                  {loading
                    ? editId
                      ? "Actualizando..."
                      : "Publicando..."
                    : editId
                    ? "Guardar cambios"
                    : "Publicar proyecto"
                  }

                </button>

              </div>

            </section>

          </form>

        </div>


        {/* ================================================= */}
        {/* PROYECTOS PUBLICADOS */}
        {/* ================================================= */}

        <section className="mt-14">

          <div className="mb-6">

            <p
              className="
                text-xs
                uppercase
                tracking-[0.25em]

                text-sky-500

                font-bold
              "
            >

              Portafolio Macro

            </p>


            <h2
              className="
                text-2xl
                md:text-3xl

                font-bold

                mt-2
              "
            >

              Proyectos publicados

            </h2>


            <p
              className="
                text-slate-500

                mt-1
              "
            >

              {proyectos.length}{" "}

              {proyectos.length === 1
                ? "proyecto"
                : "proyectos"
              }

            </p>

          </div>


          {/* BUSCADOR */}

          <div
            className="
              flex
              flex-col
              md:flex-row

              gap-4

              mb-7
            "
          >

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
                value={
                  busqueda
                }
                onChange={(e) =>
                  setBusqueda(
                    e.target.value
                  )
                }
                placeholder="Buscar proyecto, cliente, tecnología..."
                className={`${inputClass(
                  modoOscuro
                )} pl-12 pr-11`}
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

                    text-slate-400
                    hover:text-sky-500
                  "
                >

                  <FaTimes />

                </button>

              )}

            </div>


            <select
              value={
                filtro
              }
              onChange={(e) =>
                setFiltro(
                  e.target.value
                )
              }
              className={`${inputClass(
                modoOscuro
              )} md:w-[260px]`}
            >

              <option value="todos">
                Todos los proyectos
              </option>


              {tiposProyecto.map(
                (item) => (

                  <option
                    key={
                      item.value
                    }
                    value={
                      item.value
                    }
                  >

                    {item.label}

                  </option>

                )
              )}

            </select>

          </div>


          {/* SIN RESULTADOS */}

          {proyectosFiltrados.length ===
          0 ? (

            <div
              className={`
                rounded-[30px]

                border
                border-dashed

                p-12

                text-center

                ${
                  modoOscuro
                    ? `
                      bg-slate-900
                      border-slate-700
                    `
                    : `
                      bg-white
                      border-sky-200
                    `
                }
              `}
            >

              <div
                className="
                  w-14
                  h-14

                  mx-auto

                  rounded-2xl

                  bg-sky-50
                  text-sky-500

                  flex
                  items-center
                  justify-center

                  text-xl
                "
              >

                <FaSearch />

              </div>


              <h3
                className="
                  text-xl
                  font-bold

                  mt-5
                "
              >

                {proyectos.length ===
                0
                  ? "Todavía no hay proyectos"
                  : "No encontramos resultados"
                }

              </h3>


              <p
                className="
                  text-slate-500

                  mt-2
                "
              >

                {proyectos.length ===
                0
                  ? "Publica el primer proyecto tecnológico de Macro."
                  : "Prueba otra búsqueda o cambia el filtro."
                }

              </p>


              {proyectos.length >
                0 && (

                <button
                  type="button"
                  onClick={() => {
                    setBusqueda("");

                    setFiltro(
                      "todos"
                    );
                  }}
                  className="
                    mt-5

                    text-sky-500

                    font-semibold
                  "
                >

                  Ver todos

                </button>

              )}

            </div>

          ) : (

            <div
              className="
                grid
                md:grid-cols-2
                xl:grid-cols-3

                gap-6
              "
            >

              {proyectosFiltrados.map(
                (proyecto) => (

                  <article
                    key={
                      proyecto.id
                    }
                    className={`
                      group

                      rounded-[26px]

                      overflow-hidden

                      border

                      transition-all
                      duration-300

                      hover:-translate-y-1
                      hover:shadow-xl

                      ${
                        modoOscuro
                          ? `
                            bg-slate-900
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

                    {/* FOTO */}

                    <div
                      className="
                        relative

                        h-60

                        bg-gradient-to-br
                        from-sky-100
                        to-blue-100

                        overflow-hidden
                      "
                    >

                      {proyecto.imagen ? (

                        <img
                          src={
                            proyecto.imagen
                          }
                          alt={
                            proyecto.nombre
                          }
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

                          <FaLaptopCode
                            className="
                              text-sky-400
                              text-5xl
                            "
                          />

                        </div>

                      )}


                      <div
                        className="
                          absolute
                          inset-0

                          bg-gradient-to-t
                          from-black/65
                          via-transparent
                          to-transparent
                        "
                      />


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

                        <span
                          className="
                            bg-black/75
                            backdrop-blur

                            border
                            border-white/10

                            text-white

                            px-3
                            py-1.5

                            text-xs

                            rounded-full
                          "
                        >

                          {proyecto.categoria ||
                            obtenerNombreTipo(
                              proyecto.tipo
                            )
                          }

                        </span>


                        {proyecto.destacado && (

                          <span
                            className="
                              bg-sky-400
                              text-white

                              px-3
                              py-1.5

                              text-xs
                              font-bold

                              rounded-full

                              flex
                              items-center
                              gap-1
                            "
                          >

                            <FaStar />

                            Destacado

                          </span>

                        )}

                      </div>


                      {proyecto.estado && (

                        <span
                          className="
                            absolute
                            bottom-4
                            left-4

                            bg-white/90

                            text-slate-700

                            px-3
                            py-1.5

                            rounded-full

                            text-xs
                            font-semibold
                          "
                        >

                          {proyecto.estado}

                        </span>

                      )}

                    </div>


                    {/* INFO */}

                    <div className="p-6">

                      <h3
                        className="
                          text-xl
                          font-bold
                        "
                      >

                        {proyecto.nombre}

                      </h3>


                      {proyecto.cliente && (

                        <p
                          className="
                            text-xs
                            text-sky-500

                            mt-2
                          "
                        >

                          {proyecto.cliente}

                        </p>

                      )}


                      <p
                        className="
                          text-sm
                          text-slate-500

                          line-clamp-3

                          mt-3

                          min-h-[63px]
                        "
                      >

                        {proyecto.descripcion}

                      </p>


                      {Array.isArray(
                        proyecto.tecnologias
                      ) &&
                        proyecto
                          .tecnologias
                          .length > 0 && (

                          <div
                            className="
                              flex
                              flex-wrap

                              gap-2

                              mt-4
                            "
                          >

                            {proyecto.tecnologias
                              .slice(
                                0,
                                4
                              )
                              .map(
                                (
                                  tecnologia
                                ) => (

                                  <span
                                    key={
                                      tecnologia
                                    }
                                    className="
                                      bg-sky-50
                                      text-sky-600

                                      px-2.5
                                      py-1

                                      rounded-full

                                      text-[10px]
                                      font-semibold
                                    "
                                  >

                                    {tecnologia}

                                  </span>

                                )
                              )}

                          </div>

                        )}


                      {proyecto.urlProyecto && (

                        <a
                          href={
                            proyecto.urlProyecto
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="
                            text-sm
                            text-sky-500

                            flex
                            items-center
                            gap-2

                            mt-4

                            hover:text-sky-600
                          "
                        >

                          <FaExternalLinkAlt />

                          Abrir proyecto

                        </a>

                      )}


                      <div
                        className="
                          grid
                          grid-cols-2

                          gap-3

                          mt-6
                        "
                      >

                        <button
                          type="button"
                          onClick={() =>
                            handleEdit(
                              proyecto
                            )
                          }
                          className="
                            border
                            border-blue-200

                            bg-blue-50

                            text-blue-600

                            px-4
                            py-3

                            rounded-xl

                            font-semibold

                            flex
                            items-center
                            justify-center
                            gap-2

                            hover:bg-blue-100

                            transition
                          "
                        >

                          <FaEdit />

                          Editar

                        </button>


                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(
                              proyecto.id
                            )
                          }
                          className="
                            border
                            border-red-200

                            bg-red-50

                            text-red-500

                            px-4
                            py-3

                            rounded-xl

                            font-semibold

                            flex
                            items-center
                            justify-center
                            gap-2

                            hover:bg-red-100

                            transition
                          "
                        >

                          <FaTrash />

                          Eliminar

                        </button>

                      </div>

                    </div>

                  </article>

                )
              )}

            </div>

          )}

        </section>

      </div>

    </div>
  );
}


/* ======================================================
   TITULO SECCIÓN
====================================================== */

function TituloSeccion({
  numero,
  titulo,
  descripcion,
}) {
  return (
    <div
      className="
        flex
        items-start

        gap-4
      "
    >

      <div
        className="
          shrink-0

          w-10
          h-10

          rounded-xl

          bg-sky-50
          border
          border-sky-100

          flex
          items-center
          justify-center

          text-sky-500

          text-xs
          font-bold
        "
      >

        {numero}

      </div>


      <div>

        <h3
          className="
            text-xl
            font-bold
          "
        >

          {titulo}

        </h3>


        <p
          className="
            text-sm
            text-slate-500

            mt-1
          "
        >

          {descripcion}

        </p>

      </div>

    </div>
  );
}


/* ======================================================
   CAMPO
====================================================== */

function Campo({
  titulo,
  icon,
  children,
  opcional = false,
}) {
  return (
    <div>

      <label
        className="
          flex
          items-center
          gap-2

          text-sm
          text-slate-600

          mb-2
        "
      >

        <span className="text-sky-500">

          {icon}

        </span>


        {titulo}


        {opcional && (

          <span
            className="
              text-xs
              text-slate-400
            "
          >

            (opcional)

          </span>

        )}

      </label>


      {children}

    </div>
  );
}


/* ======================================================
   CONTADOR
====================================================== */

function ContadorTexto({
  actual,
  max,
}) {
  return (
    <div
      className="
        text-right
        mt-2
      "
    >

      <span
        className="
          text-xs
          text-slate-400
        "
      >

        {actual}/{max}

      </span>

    </div>
  );
}


/* ======================================================
   CONTADOR IMÁGENES
====================================================== */

function ContadorImagenes({
  actual,
  max,
  modoOscuro,
}) {
  return (
    <span
      className={`
        text-xs

        border

        px-3
        py-1.5

        rounded-full

        ${
          modoOscuro
            ? `
              bg-slate-950
              border-slate-700
              text-slate-400
            `
            : `
              bg-sky-50
              border-sky-100
              text-sky-600
            `
        }
      `}
    >

      {actual}/{max}

    </span>
  );
}


/* ======================================================
   SELECTOR IMÁGENES
====================================================== */

function SelectorImagenes({
  titulo,
  descripcion,
  onChange,
  loading,
}) {
  return (
    <label
      className={`
        block

        border-2
        border-dashed

        border-sky-200

        hover:border-sky-400
        hover:bg-sky-50

        rounded-3xl

        p-8
        md:p-10

        text-center

        cursor-pointer

        transition-all

        ${
          loading
            ? "opacity-60 pointer-events-none"
            : ""
        }
      `}
    >

      <div
        className="
          w-14
          h-14

          rounded-2xl

          bg-sky-50
          border
          border-sky-100

          flex
          items-center
          justify-center

          mx-auto
        "
      >

        <FaCloudUploadAlt
          className="
            text-sky-500
            text-2xl
          "
        />

      </div>


      <p
        className="
          font-bold
          text-slate-900

          mt-4
        "
      >

        {loading
          ? "Preparando imágenes..."
          : titulo
        }

      </p>


      <p
        className="
          text-sm
          text-slate-500

          mt-2
        "
      >

        {descripcion}

      </p>


      <p
        className="
          text-xs
          text-slate-400

          mt-1
        "
      >

        Las fotografías grandes se comprimen automáticamente.

      </p>


      <input
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        disabled={
          loading
        }
        onChange={async (e) => {
          const files =
            e.target.files;

          await onChange(
            files
          );

          e.target.value =
            "";
        }}
      />

    </label>
  );
}


/* ======================================================
   GRUPO DE IMÁGENES
====================================================== */

function GrupoImagenes({
  titulo,
  children,
}) {
  return (
    <div className="mt-5">

      <p
        className="
          text-xs

          uppercase
          tracking-wider

          text-slate-400

          mb-3
        "
      >

        {titulo}

      </p>


      <div
        className="
          grid
          grid-cols-2
          sm:grid-cols-3
          lg:grid-cols-4

          gap-3
        "
      >

        {children}

      </div>

    </div>
  );
}


/* ======================================================
   PREVIEW
====================================================== */

function ImagenPreview({
  src,
  etiqueta,
  onDelete,
}) {
  return (
    <div
      className="
        relative

        aspect-square

        bg-slate-900

        rounded-2xl

        overflow-hidden

        border
        border-slate-200

        group
      "
    >

      <img
        src={
          src
        }
        alt="Vista previa"
        className="
          w-full
          h-full

          object-cover
        "
      />


      <div
        className="
          absolute
          inset-0

          bg-gradient-to-t
          from-black/60
          via-transparent
          to-black/10

          pointer-events-none
        "
      />


      <span
        className="
          absolute
          bottom-2
          left-2

          bg-black/70

          backdrop-blur

          border
          border-white/20

          px-2
          py-1

          rounded-lg

          text-[9px]
          text-white

          font-bold
        "
      >

        {etiqueta}

      </span>


      <button
        type="button"
        onClick={
          onDelete
        }
        aria-label="Eliminar imagen"
        className="
          absolute
          top-2
          right-2

          w-9
          h-9

          rounded-xl

          bg-black/75

          backdrop-blur

          border
          border-red-400/40

          text-red-300

          hover:bg-red-500
          hover:text-white

          flex
          items-center
          justify-center

          transition
        "
      >

        <FaTrash
          size={13}
        />

      </button>

    </div>
  );
}


/* ======================================================
   ESTILOS
====================================================== */

const inputClass =
  (modoOscuro) => `
    w-full

    border

    rounded-2xl

    px-4
    py-3.5

    outline-none

    transition

    focus:border-sky-400
    focus:ring-4
    focus:ring-sky-100

    ${
      modoOscuro
        ? `
          bg-slate-950
          border-slate-700
          text-white
          placeholder:text-slate-500
        `
        : `
          bg-white
          border-slate-200
          text-slate-900
          placeholder:text-slate-400
        `
    }
  `;


const botonSecundario =
  (modoOscuro) => `
    border

    px-5
    py-3.5

    rounded-xl

    font-semibold

    flex
    items-center
    justify-center
    gap-2

    transition

    ${
      modoOscuro
        ? `
          bg-slate-900
          border-slate-700
          text-slate-300

          hover:border-sky-400
          hover:text-sky-400
        `
        : `
          bg-white
          border-slate-200
          text-slate-600

          hover:border-sky-300
          hover:text-sky-600
        `
    }
  `;


export default SubirProyecto;