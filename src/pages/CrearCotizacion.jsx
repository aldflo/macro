import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
  useOutletContext,
} from "react-router-dom";

import {
  auth,
  db,
} from "../firebase.config";

import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";

import L from "leaflet";

import "leaflet/dist/leaflet.css";

import {
  FaAndroid,
  FaArrowLeft,
  FaArrowRight,
  FaBullhorn,
  FaCalendarAlt,
  FaCamera,
  FaCheck,
  FaCheckCircle,
  FaCloudUploadAlt,
  FaCode,
  FaCrosshairs,
  FaDollarSign,
  FaGamepad,
  FaGlobe,
  FaImages,
  FaLaptopCode,
  FaLayerGroup,
  FaLink,
  FaMapMarkerAlt,
  FaMobileAlt,
  FaNetworkWired,
  FaPalette,
  FaPaperPlane,
  FaPen,
  FaPhoneAlt,
  FaPhotoVideo,
  FaProjectDiagram,
  FaSearch,
  FaShieldAlt,
  FaTag,
  FaTimes,
  FaTools,
  FaUpload,
  FaWhatsapp,
  FaWifi,
} from "react-icons/fa";


/* ======================================================
   LEAFLET
====================================================== */

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",

  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",

  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});


/* ======================================================
   CONFIG
====================================================== */

const POSICION_CAMPECHE = {
  lat: 19.8301,
  lng: -90.5349,
};


const TIPOS_SOLUCION = [
  {
    nombre: "Página web",
    icono: <FaGlobe />,
  },
  {
    nombre: "Aplicación móvil",
    icono: <FaMobileAlt />,
  },
  {
    nombre: "Sistema web",
    icono: <FaLaptopCode />,
  },
  {
    nombre: "Videojuego personalizado",
    icono: <FaGamepad />,
  },
  {
    nombre: "Videos con dron",
    icono: <FaPhotoVideo />,
  },
  {
    nombre: "Cámaras y seguridad",
    icono: <FaCamera />,
  },
  {
    nombre: "Redes y conectividad",
    icono: <FaWifi />,
  },
  {
    nombre: "Publicidad digital",
    icono: <FaBullhorn />,
  },
  {
    nombre: "Soporte y mantenimiento",
    icono: <FaTools />,
  },
  {
    nombre: "Otro",
    icono: <FaProjectDiagram />,
  },
];


/* ======================================================
   TIPO SEGÚN CATEGORÍA
====================================================== */

function convertirCategoriaATipo(
  categoria = ""
) {
  const valor =
    categoria
      .toLowerCase()
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        ""
      );


  if (
    valor.includes(
      "dron"
    ) ||
    valor.includes(
      "video"
    )
  ) {
    return "Videos con dron";
  }


  if (
    valor.includes(
      "videojuego"
    ) ||
    valor.includes(
      "juego"
    )
  ) {
    return "Videojuego personalizado";
  }


  if (
    valor.includes(
      "app"
    ) ||
    valor.includes(
      "movil"
    )
  ) {
    return "Aplicación móvil";
  }


  if (
    valor.includes(
      "sistema"
    ) ||
    valor.includes(
      "software"
    ) ||
    valor.includes(
      "plataforma"
    )
  ) {
    return "Sistema web";
  }


  if (
    valor.includes(
      "web"
    ) ||
    valor.includes(
      "pagina"
    ) ||
    valor.includes(
      "sitio"
    )
  ) {
    return "Página web";
  }


  if (
    valor.includes(
      "camara"
    ) ||
    valor.includes(
      "seguridad"
    ) ||
    valor.includes(
      "cctv"
    )
  ) {
    return "Cámaras y seguridad";
  }


  if (
    valor.includes(
      "wifi"
    ) ||
    valor.includes(
      "red"
    ) ||
    valor.includes(
      "conectividad"
    )
  ) {
    return "Redes y conectividad";
  }


  if (
    valor.includes(
      "marketing"
    ) ||
    valor.includes(
      "publicidad"
    )
  ) {
    return "Publicidad digital";
  }


  if (
    valor.includes(
      "soporte"
    ) ||
    valor.includes(
      "mantenimiento"
    )
  ) {
    return "Soporte y mantenimiento";
  }


  return "Página web";
}


/* ======================================================
   IMÁGENES PROYECTO
====================================================== */

function obtenerImagenesProyecto(
  proyecto
) {
  if (!proyecto) {
    return [];
  }


  const lista = [];


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
}


/* ======================================================
   GEOCODIFICACIÓN
====================================================== */

async function obtenerDireccion(
  lat,
  lng
) {
  const params =
    new URLSearchParams({
      format: "jsonv2",
      lat: String(lat),
      lon: String(lng),
      addressdetails: "1",
      zoom: "18",
      "accept-language": "es",
    });


  const response =
    await fetch(
      `https://nominatim.openstreetmap.org/reverse?${params.toString()}`
    );


  if (!response.ok) {
    throw new Error(
      "No se pudo obtener la dirección."
    );
  }


  const data =
    await response.json();


  return (
    data.display_name ||
    ""
  );
}


/* ======================================================
   RECENTRAR
====================================================== */

function RecentrarMapa({
  posicion,
  zoom = 16,
}) {
  const map =
    useMap();


  useEffect(() => {
    if (!posicion) {
      return;
    }


    map.setView(
      [
        posicion.lat,
        posicion.lng,
      ],
      zoom,
      {
        animate: true,
      }
    );

  }, [
    posicion,
    map,
    zoom,
  ]);


  return null;
}


/* ======================================================
   SELECTOR MAPA
====================================================== */

function SelectorUbicacion({
  posicion,
  setPosicion,
  setUbicacion,
  setError,
}) {
  const actualizar =
    async (
      lat,
      lng
    ) => {
      setError("");


      setPosicion({
        lat,
        lng,
      });


      try {
        const direccion =
          await obtenerDireccion(
            lat,
            lng
          );


        setUbicacion(
          direccion ||
            `${lat.toFixed(
              6
            )}, ${lng.toFixed(
              6
            )}`
        );

      } catch {
        setUbicacion(
          `${lat.toFixed(
            6
          )}, ${lng.toFixed(
            6
          )}`
        );
      }
    };


  useMapEvents({
    click(e) {
      actualizar(
        e.latlng.lat,
        e.latlng.lng
      );
    },
  });


  if (!posicion) {
    return null;
  }


  return (
    <Marker
      position={[
        posicion.lat,
        posicion.lng,
      ]}
      draggable
      eventHandlers={{
        dragend: (
          e
        ) => {
          const punto =
            e.target
              .getLatLng();


          actualizar(
            punto.lat,
            punto.lng
          );
        },
      }}
    >
      <Popup>
        Ubicación del proyecto
      </Popup>
    </Marker>
  );
}


/* ======================================================
   COMPONENTE PRINCIPAL
====================================================== */

function CrearCotizacion() {
  const navigate =
    useNavigate();


  const location =
    useLocation();


  const {
    modoOscuro = false,
  } =
    useOutletContext() ||
    {};


  /* ====================================================
     REFERENCIA
  ==================================================== */

  const [
    proyectoReferencia,
    setProyectoReferencia,
  ] = useState(
    location.state
      ?.proyecto ||
      null
  );


  const imagenesProyecto =
    useMemo(
      () =>
        obtenerImagenesProyecto(
          proyectoReferencia
        ),
      [
        proyectoReferencia,
      ]
    );


  /* ====================================================
     PASOS
  ==================================================== */

  const [
    paso,
    setPaso,
  ] = useState(1);


  const totalPasos =
    4;


  /* ====================================================
     DATOS GENERALES
  ==================================================== */

  const [
    nombre,
    setNombre,
  ] = useState(
    proyectoReferencia
      ?.nombre ||
      ""
  );


  const [
    tipo,
    setTipo,
  ] = useState(
    proyectoReferencia
      ? convertirCategoriaATipo(
          proyectoReferencia
            .categoria
        )
      : "Página web"
  );


  const [
    descripcion,
    setDescripcion,
  ] = useState(
    proyectoReferencia
      ? `Quiero un proyecto similar a "${proyectoReferencia.nombre}". ${
          proyectoReferencia
            .descripcion ||
          ""
        }`
      : ""
  );


  /* ====================================================
     REQUERIMIENTOS DINÁMICOS
  ==================================================== */

  const [
    requerimientos,
    setRequerimientos,
  ] = useState({});


  const actualizarReq =
    (
      campo,
      valor
    ) => {
      setRequerimientos(
        (actual) => ({
          ...actual,
          [campo]:
            valor,
        })
      );
    };


  const alternarReqLista =
    (
      campo,
      valor
    ) => {
      setRequerimientos(
        (actual) => {
          const lista =
            Array.isArray(
              actual[campo]
            )
              ? actual[campo]
              : [];


          return {
            ...actual,

            [campo]:
              lista.includes(
                valor
              )
                ? lista.filter(
                    (item) =>
                      item !==
                      valor
                  )
                : [
                    ...lista,
                    valor,
                  ],
          };
        }
      );
    };


  /* ====================================================
     DATOS GENERALES PROYECTO
  ==================================================== */

  const [
    ubicacion,
    setUbicacion,
  ] = useState("");


  const [
    posicion,
    setPosicion,
  ] = useState(
    POSICION_CAMPECHE
  );


  const [
    fechaDeseada,
    setFechaDeseada,
  ] = useState("");


  const [
    presupuestoEstimado,
    setPresupuestoEstimado,
  ] = useState("");


  const [
    informacionTecnica,
    setInformacionTecnica,
  ] = useState("");


  const [
    buscandoUbicacion,
    setBuscandoUbicacion,
  ] = useState(false);


  const [
    obteniendoGPS,
    setObteniendoGPS,
  ] = useState(false);


  /* ====================================================
     CONTACTO
  ==================================================== */

  const [
    telefono,
    setTelefono,
  ] = useState("");


  const [
    metodoContacto,
    setMetodoContacto,
  ] = useState(
    "WhatsApp"
  );


  /* ====================================================
     ARCHIVOS
  ==================================================== */

  const [
    logo,
    setLogo,
  ] = useState(null);


  const [
    menuArchivos,
    setMenuArchivos,
  ] = useState([]);


  const [
    referencias,
    setReferencias,
  ] = useState([]);


  const [
    fotosLugar,
    setFotosLugar,
  ] = useState([]);


  /* ====================================================
     ESTADOS
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


  /* ====================================================
     RESET REQUERIMIENTOS CUANDO CAMBIA TIPO
  ==================================================== */

  useEffect(() => {
    setRequerimientos(
      {}
    );

  }, [
    tipo,
  ]);


  /* ====================================================
     PREVIEWS
  ==================================================== */

  const logoPreview =
    useMemo(
      () =>
        logo
          ? URL.createObjectURL(
              logo
            )
          : "",
      [
        logo,
      ]
    );


  const menuPreviews =
    useMemo(
      () =>
        menuArchivos.map(
          (file) => ({
            file,
            url:
              URL.createObjectURL(
                file
              ),
          })
        ),
      [
        menuArchivos,
      ]
    );


  const referenciaPreviews =
    useMemo(
      () =>
        referencias.map(
          (file) => ({
            file,
            url:
              URL.createObjectURL(
                file
              ),
          })
        ),
      [
        referencias,
      ]
    );


  const lugarPreviews =
    useMemo(
      () =>
        fotosLugar.map(
          (file) => ({
            file,
            url:
              URL.createObjectURL(
                file
              ),
          })
        ),
      [
        fotosLugar,
      ]
    );


  useEffect(() => {
    return () => {
      if (
        logoPreview
      ) {
        URL.revokeObjectURL(
          logoPreview
        );
      }


      [
        ...menuPreviews,
        ...referenciaPreviews,
        ...lugarPreviews,
      ].forEach(
        (preview) =>
          URL.revokeObjectURL(
            preview.url
          )
      );
    };

  }, [
    logoPreview,
    menuPreviews,
    referenciaPreviews,
    lugarPreviews,
  ]);


  /* ====================================================
     TEMA
  ==================================================== */

  const pagina =
    modoOscuro
      ? `
        bg-[#050b18]
        text-white
      `
      : `
        bg-[#f4f8fc]
        text-slate-900
      `;


  const tarjeta =
    modoOscuro
      ? `
        bg-[#0b1424]
        border-slate-800
      `
      : `
        bg-white
        border-slate-200
      `;


  const tarjetaSuave =
    modoOscuro
      ? `
        bg-[#101d31]
        border-slate-700
      `
      : `
        bg-[#f7faff]
        border-slate-200
      `;


  const inputClass =
    modoOscuro
      ? `
        w-full
        px-4
        py-3.5
        rounded-2xl
        bg-[#101d31]
        border
        border-slate-700
        text-white
        placeholder:text-slate-500
        outline-none
        focus:border-sky-500
        focus:ring-2
        focus:ring-sky-500/20
        transition
      `
      : `
        w-full
        px-4
        py-3.5
        rounded-2xl
        bg-white
        border
        border-slate-300
        text-slate-900
        placeholder:text-slate-400
        outline-none
        focus:border-sky-500
        focus:ring-2
        focus:ring-sky-500/20
        transition
      `;


  /* ====================================================
     UBICACIÓN REQUERIDA
  ==================================================== */

  const necesitaUbicacion =
    [
      "Videos con dron",
      "Cámaras y seguridad",
      "Redes y conectividad",
      "Soporte y mantenimiento",
    ].includes(
      tipo
    );


  /* ====================================================
     CLOUDINARY
  ==================================================== */

  const subirImagen =
    async (
      file
    ) => {
      const formData =
        new FormData();


      const cloudName =
        import.meta.env
          .VITE_CLOUDINARY_CLOUD_NAME ||
        "dxj4iczvk";


      const preset =
        import.meta.env
          .VITE_CLOUDINARY_UPLOAD_PRESET ||
        "macroservices";


      formData.append(
        "file",
        file
      );


      formData.append(
        "upload_preset",
        preset
      );


      const response =
        await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          {
            method:
              "POST",

            body:
              formData,
          }
        );


      if (!response.ok) {
        const data =
          await response
            .json()
            .catch(
              () => null
            );


        throw new Error(
          data?.error
            ?.message ||
            "No se pudo subir una imagen."
        );
      }


      const data =
        await response.json();


      return data.secure_url;
    };


  /* ====================================================
     VALIDAR ARCHIVOS
  ==================================================== */

  const validarArchivos =
    (
      archivos,
      maximo
    ) => {
      if (
        archivos.length >
        maximo
      ) {
        setError(
          `Puedes subir máximo ${maximo} imágenes en esta sección.`
        );

        return false;
      }


      for (
        const file of
        archivos
      ) {
        if (
          !file.type.startsWith(
            "image/"
          )
        ) {
          setError(
            "Solo se permiten imágenes."
          );

          return false;
        }


        if (
          file.size >
          5 *
            1024 *
            1024
        ) {
          setError(
            `${file.name} supera los 5 MB.`
          );

          return false;
        }
      }


      return true;
    };


  /* ====================================================
     BUSCAR DIRECCIÓN
  ==================================================== */

  const buscarDireccion =
    async () => {
      if (
        !ubicacion.trim()
      ) {
        setError(
          "Escribe una dirección."
        );

        return;
      }


      try {
        setBuscandoUbicacion(
          true
        );


        setError("");


        const params =
          new URLSearchParams({
            q:
              ubicacion.trim(),

            format:
              "jsonv2",

            addressdetails:
              "1",

            limit:
              "1",

            countrycodes:
              "mx",

            "accept-language":
              "es",
          });


        const response =
          await fetch(
            `https://nominatim.openstreetmap.org/search?${params.toString()}`
          );


        const resultados =
          await response.json();


        if (
          !resultados.length
        ) {
          setError(
            "No encontramos esa dirección."
          );

          return;
        }


        const resultado =
          resultados[0];


        setPosicion({
          lat:
            Number(
              resultado.lat
            ),

          lng:
            Number(
              resultado.lon
            ),
        });


        setUbicacion(
          resultado.display_name ||
            ubicacion
        );

      } catch {
        setError(
          "No pudimos buscar la ubicación."
        );

      } finally {
        setBuscandoUbicacion(
          false
        );
      }
    };


  /* ====================================================
     GPS
  ==================================================== */

  const usarMiUbicacion =
    () => {
      if (
        !navigator.geolocation
      ) {
        setError(
          "Tu navegador no permite obtener tu ubicación."
        );

        return;
      }


      setObteniendoGPS(
        true
      );


      navigator.geolocation.getCurrentPosition(
        async (
          position
        ) => {
          const lat =
            position.coords
              .latitude;


          const lng =
            position.coords
              .longitude;


          setPosicion({
            lat,
            lng,
          });


          try {
            const direccion =
              await obtenerDireccion(
                lat,
                lng
              );


            setUbicacion(
              direccion ||
                `${lat}, ${lng}`
            );

          } catch {
            setUbicacion(
              `${lat}, ${lng}`
            );

          } finally {
            setObteniendoGPS(
              false
            );
          }
        },

        () => {
          setObteniendoGPS(
            false
          );


          setError(
            "No pudimos obtener tu ubicación."
          );
        }
      );
    };


  /* ====================================================
     VALIDACIÓN
  ==================================================== */

  const validarPaso =
    () => {
      setError("");


      if (
        paso ===
        1
      ) {
        if (
          !nombre.trim()
        ) {
          setError(
            "Escribe un nombre para el proyecto."
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
            "Describe un poco mejor lo que necesitas."
          );

          return false;
        }
      }


      if (
        paso ===
        2
      ) {
        if (
          necesitaUbicacion &&
          !ubicacion.trim()
        ) {
          setError(
            "Indica dónde se realizará el servicio."
          );

          return false;
        }
      }


      if (
        paso ===
        4
      ) {
        const telefonoLimpio =
          telefono.replace(
            /\D/g,
            ""
          );


        if (
          telefonoLimpio
            .length <
          10
        ) {
          setError(
            "Ingresa un teléfono válido de al menos 10 dígitos."
          );

          return false;
        }
      }


      return true;
    };


  /* ====================================================
     PASOS
  ==================================================== */

  const siguiente =
    () => {
      if (
        !validarPaso()
      ) {
        return;
      }


      setPaso(
        (actual) =>
          Math.min(
            totalPasos,
            actual + 1
          )
      );


      window.scrollTo({
        top: 0,
        behavior:
          "smooth",
      });
    };


  const anterior =
    () => {
      setPaso(
        (actual) =>
          Math.max(
            1,
            actual - 1
          )
      );


      setError("");


      window.scrollTo({
        top: 0,
        behavior:
          "smooth",
      });
    };


  /* ====================================================
     SUBMIT
  ==================================================== */

  const enviarCotizacion =
    async (
      e
    ) => {
      e.preventDefault();


      if (
        !validarPaso()
      ) {
        return;
      }


      if (
        !auth.currentUser
      ) {
        navigate(
          "/login",
          {
            state: {
              from:
                "/crear-cotizacion",

              mensaje:
                "Inicia sesión para enviar tu cotización.",
            },
          }
        );

        return;
      }


      try {
        setLoading(
          true
        );


        setError("");


        let logoUrl =
          null;


        let menuUrls =
          [];


        let referenciasUrls =
          [];


        let fotosLugarUrls =
          [];


        if (logo) {
          logoUrl =
            await subirImagen(
              logo
            );
        }


        if (
          menuArchivos.length
        ) {
          menuUrls =
            await Promise.all(
              menuArchivos.map(
                subirImagen
              )
            );
        }


        if (
          referencias.length
        ) {
          referenciasUrls =
            await Promise.all(
              referencias.map(
                subirImagen
              )
            );
        }


        if (
          fotosLugar.length
        ) {
          fotosLugarUrls =
            await Promise.all(
              fotosLugar.map(
                subirImagen
              )
            );
        }


        const imagenesCliente =
          [
            ...new Set([
              ...(logoUrl
                ? [
                    logoUrl,
                  ]
                : []),

              ...menuUrls,

              ...referenciasUrls,

              ...fotosLugarUrls,
            ]),
          ];


        const todasImagenes =
          [
            ...new Set([
              ...imagenesProyecto,
              ...imagenesCliente,
            ]),
          ];


        await addDoc(
          collection(
            db,
            "cotizaciones"
          ),
          {
            origenCotizacion:
              proyectoReferencia
                ? "proyecto_catalogo"
                : "solicitud_directa",


            proyectoReferenciaId:
              proyectoReferencia
                ?.id ||
              null,


            proyectoReferenciaNombre:
              proyectoReferencia
                ?.nombre ||
              null,


            proyectoReferenciaCategoria:
              proyectoReferencia
                ?.categoria ||
              null,


            nombre:
              nombre.trim(),


            tipo,


            descripcion:
              descripcion.trim(),


            requerimientos,


            informacionTecnica:
              informacionTecnica.trim(),


            ubicacion:
              ubicacion.trim(),


            latitud:
              necesitaUbicacion
                ? posicion.lat
                : null,


            longitud:
              necesitaUbicacion
                ? posicion.lng
                : null,


            fechaDeseada:
              fechaDeseada ||
              null,


            presupuestoEstimadoCliente:
              presupuestoEstimado
                ? Number(
                    presupuestoEstimado
                  )
                : null,


            telefono:
              telefono.trim(),


            metodoContacto,


            recursos: {
              logo:
                logoUrl,

              menuCatalogo:
                menuUrls,

              referencias:
                referenciasUrls,

              fotosLugar:
                fotosLugarUrls,
            },


            imagenesProyecto,


            imagenesCliente,


            imagenes:
              todasImagenes,


            imagen:
              todasImagenes[0] ||
              null,


            uid:
              auth.currentUser.uid,


            usuario:
              auth.currentUser
                .email ||
              auth.currentUser
                .phoneNumber ||
              "",


            estado:
              "pendiente",


            vistoPorAdmin:
              false,


            vistoPorCliente:
              true,


            leido:
              false,


            precioTotal:
              null,


            presupuestoAdmin:
              null,


            porcentajeAnticipo:
              null,


            anticipo:
              null,


            montoAnticipo:
              null,


            saldo:
              null,


            saldoPendiente:
              null,


            versionPropuesta:
              0,


            propuestaActual:
              null,


            historialPropuestas:
              [],


            respuestaCliente:
              "sin_respuesta",


            mensajeCliente:
              "",


            estadoPago:
              "sin_pago",


            tiempoEstimado:
              "",


            garantia:
              "",


            observacionesAdmin:
              "",


            fecha:
              serverTimestamp(),


            fechaActualizacion:
              serverTimestamp(),
          }
        );


        setMensaje(
          "¡Solicitud enviada! Macro revisará tus requerimientos y preparará una propuesta."
        );


        setPaso(
          1
        );


        setNombre("");
        setDescripcion("");
        setRequerimientos({});
        setUbicacion("");
        setFechaDeseada("");
        setPresupuestoEstimado("");
        setInformacionTecnica("");
        setTelefono("");
        setLogo(null);
        setMenuArchivos([]);
        setReferencias([]);
        setFotosLugar([]);
        setProyectoReferencia(
          null
        );

      } catch (
        error
      ) {
        console.error(
          error
        );


        setError(
          error?.message ||
            "No pudimos enviar tu cotización."
        );

      } finally {
        setLoading(
          false
        );
      }
    };


  /* ====================================================
     PROGRESO
  ==================================================== */

  const progreso =
    (
      (
        paso -
        1
      ) /
      (
        totalPasos -
        1
      )
    ) *
    100;


  /* ====================================================
     RENDER
  ==================================================== */

  return (
    <div
      className={`
        min-h-screen

        py-8

        ${pagina}
      `}
    >

      <div
        className="
          max-w-6xl

          mx-auto

          px-4
          md:px-6
        "
      >

        {/* ================================================= */}
        {/* HERO */}
        {/* ================================================= */}

        <section
          className="
            overflow-hidden

            rounded-[32px]

            bg-gradient-to-r

            from-[#0568d8]
            via-[#088eee]
            to-[#19b5ff]

            text-white

            shadow-xl
          "
        >

          <div
            className="
              grid

              lg:grid-cols-[1.3fr_.7fr]

              gap-8

              p-7
              md:p-10
            "
          >

            <div>

              <p
                className="
                  text-xs

                  uppercase
                  tracking-[0.25em]

                  text-blue-100

                  font-bold
                "
              >
                Macro · Proyectos
              </p>


              <h1
                className="
                  text-4xl
                  md:text-5xl

                  font-black

                  tracking-[-0.04em]

                  mt-3
                "
              >
                Cotiza tu proyecto
              </h1>


              <p
                className="
                  max-w-2xl

                  text-blue-50

                  text-lg

                  leading-relaxed

                  mt-4
                "
              >
                Cuéntanos qué necesitas y el formulario se adaptará
                automáticamente al tipo de proyecto.
              </p>

            </div>


            <div
              className="
                bg-white/10

                border
                border-white/20

                rounded-[26px]

                p-6

                backdrop-blur-sm
              "
            >

              <p
                className="
                  text-sm
                  text-blue-100
                "
              >
                Progreso
              </p>


              <p
                className="
                  text-3xl
                  font-black

                  mt-2
                "
              >
                Paso {paso} de {totalPasos}
              </p>


              <div
                className="
                  h-3

                  bg-white/20

                  rounded-full

                  overflow-hidden

                  mt-5
                "
              >

                <div
                  className="
                    h-full

                    bg-white

                    rounded-full

                    transition-all
                    duration-500
                  "
                  style={{
                    width:
                      `${progreso}%`,
                  }}
                />

              </div>

            </div>

          </div>

        </section>


        {/* ================================================= */}
        {/* PASOS */}
        {/* ================================================= */}

        <section
          className={`
            mt-6

            border

            rounded-[28px]

            p-5
            md:p-6

            shadow-sm

            ${tarjeta}
          `}
        >

          <div
            className="
              grid

              grid-cols-2
              lg:grid-cols-4

              gap-4
            "
          >

            <Paso
              numero="1"
              titulo="Proyecto"
              activo={
                paso === 1
              }
              terminado={
                paso > 1
              }
            />


            <Paso
              numero="2"
              titulo="Requerimientos"
              activo={
                paso === 2
              }
              terminado={
                paso > 2
              }
            />


            <Paso
              numero="3"
              titulo="Archivos"
              activo={
                paso === 3
              }
              terminado={
                paso > 3
              }
            />


            <Paso
              numero="4"
              titulo="Enviar"
              activo={
                paso === 4
              }
            />

          </div>

        </section>


        {/* ================================================= */}
        {/* REFERENCIA */}
        {/* ================================================= */}

        {proyectoReferencia && (

          <section
            className={`
              mt-6

              border

              rounded-[28px]

              p-6

              ${tarjeta}
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
                  w-12
                  h-12

                  rounded-2xl

                  bg-sky-100

                  text-sky-600

                  flex
                  items-center
                  justify-center
                "
              >
                <FaLink />
              </div>


              <div>

                <p
                  className="
                    text-xs

                    uppercase
                    tracking-widest

                    text-sky-500

                    font-bold
                  "
                >
                  Proyecto de referencia
                </p>


                <h2
                  className="
                    text-xl
                    font-black
                  "
                >
                  {proyectoReferencia.nombre}
                </h2>

              </div>

            </div>


            {imagenesProyecto.length >
              0 && (

              <div
                className="
                  grid

                  grid-cols-3
                  sm:grid-cols-5
                  md:grid-cols-7

                  gap-3

                  mt-5
                "
              >

                {imagenesProyecto.map(
                  (
                    imagen,
                    index
                  ) => (

                    <img
                      key={`${imagen}-${index}`}
                      src={imagen}
                      alt=""
                      className="
                        w-full

                        aspect-square

                        object-cover

                        rounded-xl

                        border
                        border-slate-200
                      "
                    />

                  )
                )}

              </div>

            )}

          </section>

        )}


        {/* ================================================= */}
        {/* MENSAJES */}
        {/* ================================================= */}

        {error && (

          <div
            className="
              mt-6

              p-4

              rounded-2xl

              bg-red-50

              border
              border-red-200

              text-red-600
            "
          >
            {error}
          </div>

        )}


        {mensaje && (

          <div
            className="
              mt-6

              p-5

              rounded-2xl

              bg-emerald-50

              border
              border-emerald-200

              text-emerald-700

              flex
              gap-3
            "
          >

            <FaCheckCircle
              className="
                mt-1
                shrink-0
              "
            />

            {mensaje}

          </div>

        )}


        <form
          onSubmit={
            enviarCotizacion
          }
          className="
            mt-6
            space-y-6
          "
        >

          {/* ================================================= */}
          {/* PASO 1 */}
          {/* ================================================= */}

          {paso === 1 && (

            <section
              className={`
                border

                rounded-[30px]

                p-6
                md:p-8

                shadow-sm

                ${tarjeta}
              `}
            >

              <CabeceraPaso
                numero="01"
                titulo="Cuéntanos qué quieres crear"
                texto="Primero selecciona el tipo de solución y describe tu idea."
              />


              <div className="space-y-7 mt-8">

                <Campo
                  label="Nombre del proyecto"
                  icon={
                    <FaPen />
                  }
                  obligatorio
                >

                  <input
                    value={
                      nombre
                    }
                    onChange={(e) =>
                      setNombre(
                        e.target.value
                      )
                    }
                    placeholder="Ej: Página web para restaurante"
                    className={
                      inputClass
                    }
                  />

                </Campo>


                <div>

                  <Label
                    icon={
                      <FaTag />
                    }
                  >
                    Tipo de solución
                  </Label>


                  <div
                    className="
                      grid

                      sm:grid-cols-2
                      lg:grid-cols-3

                      gap-3

                      mt-3
                    "
                  >

                    {TIPOS_SOLUCION.map(
                      (
                        item
                      ) => (

                        <button
                          key={
                            item.nombre
                          }
                          type="button"
                          onClick={() =>
                            setTipo(
                              item.nombre
                            )
                          }
                          className={`
                            p-4

                            rounded-2xl

                            border-2

                            text-left

                            transition

                            ${
                              tipo ===
                              item.nombre
                                ? `
                                  bg-sky-50
                                  border-sky-500
                                  text-sky-700
                                `
                                : `
                                  border-slate-200

                                  ${
                                    modoOscuro
                                      ? `
                                        bg-[#101d31]
                                        text-slate-200
                                      `
                                      : `
                                        bg-white
                                        text-slate-700
                                      `
                                  }
                                `
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

                            <span
                              className="
                                text-xl
                                text-sky-500
                              "
                            >
                              {item.icono}
                            </span>


                            <span className="font-bold">
                              {item.nombre}
                            </span>

                          </div>

                        </button>

                      )
                    )}

                  </div>

                </div>


                <Campo
                  label="Describe tu idea"
                  icon={
                    <FaPen />
                  }
                  obligatorio
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
                    className={
                      inputClass
                    }
                    maxLength={1200}
                    placeholder="Describe qué deseas lograr, para quién será, funciones principales y cualquier detalle importante..."
                  />


                  <p
                    className="
                      text-xs
                      text-slate-400

                      text-right
                    "
                  >
                    {descripcion.length}/1200
                  </p>

                </Campo>

              </div>

            </section>

          )}


          {/* ================================================= */}
          {/* PASO 2 */}
          {/* ================================================= */}

          {paso === 2 && (

            <section
              className={`
                border

                rounded-[30px]

                p-6
                md:p-8

                shadow-sm

                ${tarjeta}
              `}
            >

              <CabeceraPaso
                numero="02"
                titulo={`Requerimientos · ${tipo}`}
                texto="Estas preguntas cambian según el proyecto que seleccionaste."
              />


              <div className="mt-8">

                <FormularioRequerimientos
                  tipo={
                    tipo
                  }
                  datos={
                    requerimientos
                  }
                  actualizar={
                    actualizarReq
                  }
                  alternar={
                    alternarReqLista
                  }
                  inputClass={
                    inputClass
                  }
                />

              </div>


              {/* INFO TÉCNICA */}

              <div
                className="
                  mt-8

                  pt-8

                  border-t
                  border-slate-200
                "
              >

                <Campo
                  label="Información adicional o técnica"
                  icon={
                    <FaCode />
                  }
                >

                  <textarea
                    rows={4}
                    value={
                      informacionTecnica
                    }
                    onChange={(e) =>
                      setInformacionTecnica(
                        e.target.value
                      )
                    }
                    className={
                      inputClass
                    }
                    placeholder="Aquí puedes agregar cantidades, medidas, equipos existentes, integraciones, tecnologías o cualquier otro dato."
                  />

                </Campo>

              </div>


              {/* UBICACIÓN */}

              {necesitaUbicacion && (

                <div
                  className="
                    mt-8

                    pt-8

                    border-t
                    border-slate-200
                  "
                >

                  <h3
                    className="
                      text-xl
                      font-black
                    "
                  >
                    Ubicación del servicio
                  </h3>


                  <p
                    className="
                      text-sm
                      text-slate-500

                      mt-1
                    "
                  >
                    Necesitamos saber dónde se realizará este servicio.
                  </p>


                  <div
                    className="
                      grid

                      lg:grid-cols-[1fr_430px]

                      gap-6

                      mt-5
                    "
                  >

                    <div className="space-y-4">

                      <Campo
                        label="Dirección"
                        icon={
                          <FaMapMarkerAlt />
                        }
                      >

                        <div
                          className="
                            flex
                            flex-col
                            sm:flex-row

                            gap-2
                          "
                        >

                          <input
                            value={
                              ubicacion
                            }
                            onChange={(e) =>
                              setUbicacion(
                                e.target.value
                              )
                            }
                            className={
                              inputClass
                            }
                            placeholder="Dirección, colonia o referencia"
                          />


                          <button
                            type="button"
                            onClick={
                              buscarDireccion
                            }
                            className="
                              px-5
                              py-3

                              bg-sky-500
                              hover:bg-sky-600

                              text-white

                              rounded-2xl

                              font-bold

                              flex
                              items-center
                              justify-center
                              gap-2
                            "
                          >

                            <FaSearch />

                            {buscandoUbicacion
                              ? "Buscando"
                              : "Buscar"
                            }

                          </button>

                        </div>

                      </Campo>


                      <button
                        type="button"
                        onClick={
                          usarMiUbicacion
                        }
                        className={`
                          w-full

                          px-4
                          py-3.5

                          rounded-2xl

                          border

                          font-semibold

                          flex
                          items-center
                          justify-center
                          gap-2

                          ${tarjetaSuave}
                        `}
                      >

                        <FaCrosshairs
                          className="
                            text-sky-500
                          "
                        />

                        {obteniendoGPS
                          ? "Obteniendo ubicación..."
                          : "Usar mi ubicación actual"
                        }

                      </button>


                      <div
                        className={`
                          p-5

                          rounded-2xl

                          border

                          ${tarjetaSuave}
                        `}
                      >

                        <p
                          className="
                            text-xs

                            uppercase
                            tracking-widest

                            text-sky-500

                            font-bold
                          "
                        >
                          Coordenadas
                        </p>


                        <div
                          className="
                            grid
                            grid-cols-2

                            gap-4

                            mt-4
                          "
                        >

                          <div>

                            <p
                              className="
                                text-xs
                                text-slate-400
                              "
                            >
                              Latitud
                            </p>

                            <p className="font-bold">
                              {posicion.lat.toFixed(
                                6
                              )}
                            </p>

                          </div>


                          <div>

                            <p
                              className="
                                text-xs
                                text-slate-400
                              "
                            >
                              Longitud
                            </p>

                            <p className="font-bold">
                              {posicion.lng.toFixed(
                                6
                              )}
                            </p>

                          </div>

                        </div>

                      </div>

                    </div>


                    <div
                      className="
                        h-[400px]

                        rounded-[26px]

                        overflow-hidden

                        border
                        border-slate-200
                      "
                    >

                      <MapContainer
                        center={[
                          posicion.lat,
                          posicion.lng,
                        ]}
                        zoom={14}
                        style={{
                          width:
                            "100%",

                          height:
                            "100%",
                        }}
                      >

                        <TileLayer
                          attribution="&copy; OpenStreetMap contributors"
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />


                        <RecentrarMapa
                          posicion={
                            posicion
                          }
                        />


                        <SelectorUbicacion
                          posicion={
                            posicion
                          }
                          setPosicion={
                            setPosicion
                          }
                          setUbicacion={
                            setUbicacion
                          }
                          setError={
                            setError
                          }
                        />

                      </MapContainer>

                    </div>

                  </div>

                </div>

              )}


              {/* FECHA + PRESUPUESTO */}

              <div
                className="
                  grid

                  md:grid-cols-2

                  gap-5

                  mt-8
                "
              >

                <Campo
                  label={
                    tipo ===
                    "Videos con dron"
                      ? "Fecha aproximada de grabación"
                      : "¿Para cuándo lo necesitas?"
                  }
                  icon={
                    <FaCalendarAlt />
                  }
                >

                  <input
                    type="date"
                    value={
                      fechaDeseada
                    }
                    onChange={(e) =>
                      setFechaDeseada(
                        e.target.value
                      )
                    }
                    className={
                      inputClass
                    }
                  />

                </Campo>


                <Campo
                  label="Presupuesto aproximado"
                  icon={
                    <FaDollarSign />
                  }
                >

                  <input
                    type="number"
                    min="0"
                    value={
                      presupuestoEstimado
                    }
                    onChange={(e) =>
                      setPresupuestoEstimado(
                        e.target.value
                      )
                    }
                    className={
                      inputClass
                    }
                    placeholder="Ej: 15000"
                  />

                </Campo>

              </div>

            </section>

          )}


          {/* ================================================= */}
          {/* PASO 3 */}
          {/* ================================================= */}

          {paso === 3 && (

            <section
              className={`
                border

                rounded-[30px]

                p-6
                md:p-8

                shadow-sm

                ${tarjeta}
              `}
            >

              <CabeceraPaso
                numero="03"
                titulo="Archivos y referencias"
                texto="Comparte lo que ya tengas. No es obligatorio contar con todo."
              />


              <div
                className="
                  grid

                  lg:grid-cols-2

                  gap-6

                  mt-8
                "
              >

                {/* LOGO */}

                {[
                  "Página web",
                  "Aplicación móvil",
                  "Sistema web",
                  "Videojuego personalizado",
                  "Videos con dron",
                  "Publicidad digital",
                ].includes(
                  tipo
                ) && (

                  <UploadIndividual
                    titulo="Logotipo"
                    texto="Si ya tienes logotipo, puedes subirlo aquí."
                    icon={
                      <FaPalette />
                    }
                    preview={
                      logoPreview
                    }
                    onChange={(
                      e
                    ) => {
                      const file =
                        e.target
                          .files?.[0];


                      if (
                        file &&
                        validarArchivos(
                          [
                            file,
                          ],
                          1
                        )
                      ) {
                        setLogo(
                          file
                        );
                      }


                      e.target.value =
                        "";
                    }}
                    onRemove={() =>
                      setLogo(
                        null
                      )
                    }
                  />

                )}


                {/* MENÚ / CATÁLOGO */}

                {tipo ===
                  "Página web" && (

                  <UploadMultiple
                    titulo="Menú, catálogo o lista de servicios"
                    texto="Ideal para restaurantes, tiendas, negocios o empresas."
                    icon={
                      <FaLayerGroup />
                    }
                    previews={
                      menuPreviews
                    }
                    onChange={(
                      e
                    ) => {
                      const archivos =
                        Array.from(
                          e.target
                            .files ||
                            []
                        );


                      const total =
                        [
                          ...menuArchivos,
                          ...archivos,
                        ];


                      if (
                        validarArchivos(
                          total,
                          4
                        )
                      ) {
                        setMenuArchivos(
                          total
                        );
                      }


                      e.target.value =
                        "";
                    }}
                    onRemove={(
                      index
                    ) =>
                      setMenuArchivos(
                        (
                          actual
                        ) =>
                          actual.filter(
                            (
                              _,
                              i
                            ) =>
                              i !==
                              index
                          )
                      )
                    }
                  />

                )}


                {/* FOTOS LUGAR */}

                {[
                  "Videos con dron",
                  "Cámaras y seguridad",
                  "Redes y conectividad",
                  "Soporte y mantenimiento",
                ].includes(
                  tipo
                ) && (

                  <UploadMultiple
                    titulo="Fotografías del lugar"
                    texto={
                      tipo ===
                      "Videos con dron"
                        ? "Puedes subir fotografías del inmueble, terreno o lugar que deseas grabar."
                        : "Ayúdanos a conocer el espacio donde se realizará el servicio."
                    }
                    icon={
                      <FaCamera />
                    }
                    previews={
                      lugarPreviews
                    }
                    onChange={(
                      e
                    ) => {
                      const archivos =
                        Array.from(
                          e.target
                            .files ||
                            []
                        );


                      const total =
                        [
                          ...fotosLugar,
                          ...archivos,
                        ];


                      if (
                        validarArchivos(
                          total,
                          6
                        )
                      ) {
                        setFotosLugar(
                          total
                        );
                      }


                      e.target.value =
                        "";
                    }}
                    onRemove={(
                      index
                    ) =>
                      setFotosLugar(
                        (
                          actual
                        ) =>
                          actual.filter(
                            (
                              _,
                              i
                            ) =>
                              i !==
                              index
                          )
                      )
                    }
                  />

                )}


                {/* REFERENCIAS */}

                <UploadMultiple
                  titulo="Referencias visuales"
                  texto={
                    tipo ===
                    "Videojuego personalizado"
                      ? "Sube personajes, escenarios, bocetos o juegos cuyo estilo te guste."
                      : tipo ===
                        "Videos con dron"
                      ? "Sube ejemplos del estilo de video o tomas que te gustaría obtener."
                      : "Sube capturas, diseños, ejemplos o imágenes que nos ayuden a entender lo que buscas."
                  }
                  icon={
                    <FaImages />
                  }
                  previews={
                    referenciaPreviews
                  }
                  onChange={(
                    e
                  ) => {
                    const archivos =
                      Array.from(
                        e.target
                          .files ||
                          []
                      );


                    const total =
                      [
                        ...referencias,
                        ...archivos,
                      ];


                    if (
                      validarArchivos(
                        total,
                        6
                      )
                    ) {
                      setReferencias(
                        total
                      );
                    }


                    e.target.value =
                      "";
                  }}
                  onRemove={(
                    index
                  ) =>
                    setReferencias(
                      (
                        actual
                      ) =>
                        actual.filter(
                          (
                            _,
                            i
                          ) =>
                            i !==
                            index
                        )
                    )
                  }
                />

              </div>


              {/* RESUMEN ARCHIVOS */}

              <div
                className="
                  mt-7

                  p-5

                  bg-sky-50

                  border
                  border-sky-100

                  rounded-2xl
                "
              >

                <p
                  className="
                    font-black
                    text-slate-900
                  "
                >
                  Archivos que se enviarán
                </p>


                <div
                  className="
                    grid

                    grid-cols-2
                    sm:grid-cols-4

                    gap-4

                    mt-4
                  "
                >

                  <Contador
                    titulo="Logo"
                    valor={
                      logo
                        ? 1
                        : 0
                    }
                  />


                  <Contador
                    titulo="Menú / catálogo"
                    valor={
                      menuArchivos.length
                    }
                  />


                  <Contador
                    titulo="Referencias"
                    valor={
                      referencias.length
                    }
                  />


                  <Contador
                    titulo="Fotos del lugar"
                    valor={
                      fotosLugar.length
                    }
                  />

                </div>

              </div>

            </section>

          )}


          {/* ================================================= */}
          {/* PASO 4 */}
          {/* ================================================= */}

          {paso === 4 && (

            <section
              className={`
                border

                rounded-[30px]

                p-6
                md:p-8

                shadow-sm

                ${tarjeta}
              `}
            >

              <CabeceraPaso
                numero="04"
                titulo="Revisa y envía"
                texto="Confirma tus datos antes de enviar la solicitud a Macro."
              />


              <div
                className="
                  grid

                  lg:grid-cols-[1fr_360px]

                  gap-6

                  mt-8
                "
              >

                <div
                  className={`
                    p-6

                    rounded-[26px]

                    border

                    ${tarjetaSuave}
                  `}
                >

                  <p
                    className="
                      text-xs

                      uppercase
                      tracking-widest

                      text-sky-500

                      font-bold
                    "
                  >
                    Resumen
                  </p>


                  <h3
                    className="
                      text-2xl
                      font-black

                      mt-2
                    "
                  >
                    {nombre}
                  </h3>


                  <span
                    className="
                      inline-flex

                      mt-3

                      bg-sky-500/10

                      text-sky-600

                      px-3
                      py-1.5

                      rounded-full

                      text-sm
                      font-bold
                    "
                  >
                    {tipo}
                  </span>


                  <div
                    className="
                      space-y-5

                      mt-7
                    "
                  >

                    <Resumen
                      titulo="Descripción"
                      valor={
                        descripcion
                      }
                    />


                    {necesitaUbicacion && (

                      <Resumen
                        titulo="Ubicación"
                        valor={
                          ubicacion ||
                          "No especificada"
                        }
                      />

                    )}


                    <Resumen
                      titulo="Fecha deseada"
                      valor={
                        fechaDeseada ||
                        "Sin fecha específica"
                      }
                    />


                    <Resumen
                      titulo="Presupuesto"
                      valor={
                        presupuestoEstimado
                          ? `$${Number(
                              presupuestoEstimado
                            ).toLocaleString(
                              "es-MX"
                            )} MXN`
                          : "No especificado"
                      }
                    />


                    <Resumen
                      titulo="Archivos propios"
                      valor={`${
                        (
                          logo
                            ? 1
                            : 0
                        ) +
                        menuArchivos.length +
                        referencias.length +
                        fotosLugar.length
                      } archivo(s)`}
                    />

                  </div>


                  <div
                    className="
                      mt-7

                      pt-6

                      border-t
                      border-slate-200
                    "
                  >

                    <p className="font-black">
                      Requerimientos registrados
                    </p>


                    <div
                      className="
                        grid

                        sm:grid-cols-2

                        gap-3

                        mt-4
                      "
                    >

                      {Object.entries(
                        requerimientos
                      ).map(
                        ([
                          clave,
                          valor,
                        ]) => (

                          <div
                            key={
                              clave
                            }
                            className="
                              p-3

                              rounded-xl

                              bg-white

                              border
                              border-slate-200
                            "
                          >

                            <p
                              className="
                                text-xs
                                text-slate-400
                              "
                            >
                              {formatearClave(
                                clave
                              )}
                            </p>


                            <p
                              className="
                                text-sm
                                font-bold
                                text-slate-700

                                mt-1
                              "
                            >
                              {formatearValor(
                                valor
                              )}
                            </p>

                          </div>

                        )
                      )}

                    </div>

                  </div>

                </div>


                {/* CONTACTO */}

                <aside
                  className="
                    space-y-5
                  "
                >

                  <div
                    className={`
                      p-6

                      rounded-[26px]

                      border

                      ${tarjetaSuave}
                    `}
                  >

                    <h3
                      className="
                        text-xl
                        font-black
                      "
                    >
                      Tus datos de contacto
                    </h3>


                    <div
                      className="
                        space-y-5

                        mt-5
                      "
                    >

                      <Campo
                        label="Teléfono"
                        icon={
                          <FaPhoneAlt />
                        }
                      >

                        <input
                          value={
                            telefono
                          }
                          onChange={(e) =>
                            setTelefono(
                              e.target
                                .value
                            )
                          }
                          className={
                            inputClass
                          }
                          placeholder="981 123 4567"
                        />

                      </Campo>


                      <Campo
                        label="Medio preferido"
                        icon={
                          <FaWhatsapp />
                        }
                      >

                        <select
                          value={
                            metodoContacto
                          }
                          onChange={(e) =>
                            setMetodoContacto(
                              e.target
                                .value
                            )
                          }
                          className={
                            inputClass
                          }
                        >

                          <option>
                            WhatsApp
                          </option>

                          <option>
                            Teléfono
                          </option>

                          <option>
                            Correo electrónico
                          </option>

                        </select>

                      </Campo>

                    </div>

                  </div>


                  <div
                    className="
                      p-6

                      rounded-[26px]

                      bg-gradient-to-br

                      from-[#071221]
                      to-[#0b3d75]

                      text-white
                    "
                  >

                    <FaCheckCircle
                      className="
                        text-2xl
                        text-sky-400
                      "
                    />


                    <h3
                      className="
                        text-xl
                        font-black

                        mt-4
                      "
                    >
                      ¿Qué sucede después?
                    </h3>


                    <p
                      className="
                        text-sm
                        text-slate-300

                        leading-relaxed

                        mt-3
                      "
                    >
                      Macro revisará tu solicitud y te enviará una propuesta.
                      Podrás consultar su estado en Mis solicitudes.
                    </p>

                  </div>

                </aside>

              </div>

            </section>

          )}


          {/* ================================================= */}
          {/* NAVEGACIÓN */}
          {/* ================================================= */}

          <section
            className={`
              border

              rounded-[26px]

              p-5

              flex
              flex-col-reverse
              sm:flex-row

              justify-between

              gap-3

              ${tarjeta}
            `}
          >

            {paso >
              1 ? (

              <button
                type="button"
                onClick={
                  anterior
                }
                className="
                  px-6
                  py-3.5

                  rounded-2xl

                  border
                  border-slate-300

                  font-bold

                  flex
                  items-center
                  justify-center
                  gap-2
                "
              >

                <FaArrowLeft />

                Anterior

              </button>

            ) : (

              <div />

            )}


            {paso <
              totalPasos ? (

              <button
                type="button"
                onClick={
                  siguiente
                }
                className="
                  px-7
                  py-3.5

                  rounded-2xl

                  bg-sky-500
                  hover:bg-sky-600

                  text-white

                  font-black

                  flex
                  items-center
                  justify-center
                  gap-2

                  transition
                "
              >

                Continuar

                <FaArrowRight />

              </button>

            ) : (

              <button
                type="submit"
                disabled={
                  loading
                }
                className="
                  px-7
                  py-3.5

                  rounded-2xl

                  bg-sky-500
                  hover:bg-sky-600

                  disabled:opacity-50

                  text-white

                  font-black

                  flex
                  items-center
                  justify-center
                  gap-2
                "
              >

                <FaPaperPlane />

                {loading
                  ? "Enviando..."
                  : "Enviar solicitud"
                }

              </button>

            )}

          </section>

        </form>

      </div>

    </div>
  );
}


/* ======================================================
   FORMULARIOS DINÁMICOS
====================================================== */

function FormularioRequerimientos({
  tipo,
  datos,
  actualizar,
  alternar,
  inputClass,
}) {
  if (
    tipo ===
    "Página web"
  ) {
    return (
      <div className="space-y-7">

        <Seleccion
          titulo="¿Para qué será la página?"
          opciones={[
            "Empresa",
            "Restaurante",
            "Tienda",
            "Portafolio",
            "Escuela",
            "Servicio profesional",
            "Otro",
          ]}
          valor={
            datos.finalidad
          }
          onChange={(
            valor
          ) =>
            actualizar(
              "finalidad",
              valor
            )
          }
        />


        <SeleccionMultiple
          titulo="¿Qué secciones necesitas?"
          opciones={[
            "Inicio",
            "Nosotros",
            "Servicios",
            "Galería",
            "Contacto",
            "Tienda",
            "Reservaciones",
            "Blog",
            "Preguntas frecuentes",
          ]}
          valores={
            datos.secciones ||
            []
          }
          onChange={(
            valor
          ) =>
            alternar(
              "secciones",
              valor
            )
          }
        />


        <SiNo
          titulo="¿Necesitas vender productos?"
          valor={
            datos.tiendaOnline
          }
          onChange={(
            valor
          ) =>
            actualizar(
              "tiendaOnline",
              valor
            )
          }
        />


        <SiNo
          titulo="¿Necesitas pagos en línea?"
          valor={
            datos.pagosOnline
          }
          onChange={(
            valor
          ) =>
            actualizar(
              "pagosOnline",
              valor
            )
          }
        />


        <SiNo
          titulo="¿Ya tienes dominio?"
          valor={
            datos.dominio
          }
          onChange={(
            valor
          ) =>
            actualizar(
              "dominio",
              valor
            )
          }
        />


        <SiNo
          titulo="¿Ya tienes logotipo?"
          valor={
            datos.tieneLogo
          }
          onChange={(
            valor
          ) =>
            actualizar(
              "tieneLogo",
              valor
            )
          }
        />


        <SiNo
          titulo="¿Necesitas panel de administrador?"
          valor={
            datos.panelAdministrador
          }
          onChange={(
            valor
          ) =>
            actualizar(
              "panelAdministrador",
              valor
            )
          }
        />


        <Campo
          label="Funciones especiales"
          icon={
            <FaCode />
          }
        >

          <textarea
            rows={4}
            value={
              datos.funcionesEspeciales ||
              ""
            }
            onChange={(e) =>
              actualizar(
                "funcionesEspeciales",
                e.target.value
              )
            }
            className={
              inputClass
            }
            placeholder="Ej: Reservaciones, WhatsApp, cotizador, catálogo, registro de usuarios..."
          />

        </Campo>

      </div>
    );
  }


  if (
    tipo ===
    "Aplicación móvil"
  ) {
    return (
      <div className="space-y-7">

        <SeleccionMultiple
          titulo="¿Para qué dispositivos?"
          opciones={[
            "Android",
            "iPhone",
            "Tablet",
          ]}
          valores={
            datos.plataformas ||
            []
          }
          onChange={(
            valor
          ) =>
            alternar(
              "plataformas",
              valor
            )
          }
        />


        <SiNo
          titulo="¿Necesita registro de usuarios?"
          valor={
            datos.registroUsuarios
          }
          onChange={(
            valor
          ) =>
            actualizar(
              "registroUsuarios",
              valor
            )
          }
        />


        <SiNo
          titulo="¿Necesita inicio de sesión con Google?"
          valor={
            datos.loginGoogle
          }
          onChange={(
            valor
          ) =>
            actualizar(
              "loginGoogle",
              valor
            )
          }
        />


        <SiNo
          titulo="¿Usará ubicación o GPS?"
          valor={
            datos.gps
          }
          onChange={(
            valor
          ) =>
            actualizar(
              "gps",
              valor
            )
          }
        />


        <SiNo
          titulo="¿Necesita notificaciones?"
          valor={
            datos.notificaciones
          }
          onChange={(
            valor
          ) =>
            actualizar(
              "notificaciones",
              valor
            )
          }
        />


        <SiNo
          titulo="¿Necesita pagos dentro de la aplicación?"
          valor={
            datos.pagos
          }
          onChange={(
            valor
          ) =>
            actualizar(
              "pagos",
              valor
            )
          }
        />


        <SiNo
          titulo="¿Necesita utilizar la cámara del teléfono?"
          valor={
            datos.camara
          }
          onChange={(
            valor
          ) =>
            actualizar(
              "camara",
              valor
            )
          }
        />


        <SiNo
          titulo="¿Necesita panel administrador?"
          valor={
            datos.panelAdministrador
          }
          onChange={(
            valor
          ) =>
            actualizar(
              "panelAdministrador",
              valor
            )
          }
        />


        <Campo
          label="Funciones principales"
          icon={
            <FaMobileAlt />
          }
        >

          <textarea
            rows={4}
            value={
              datos.funciones ||
              ""
            }
            onChange={(e) =>
              actualizar(
                "funciones",
                e.target.value
              )
            }
            className={
              inputClass
            }
            placeholder="Describe las pantallas y funciones principales de la app."
          />

        </Campo>

      </div>
    );
  }


  if (
    tipo ===
    "Sistema web"
  ) {
    return (
      <div className="space-y-7">

        <Seleccion
          titulo="¿Para qué área será el sistema?"
          opciones={[
            "Ventas",
            "Inventario",
            "Clientes",
            "Administración",
            "Reservaciones",
            "Escuela",
            "Empresa",
            "Otro",
          ]}
          valor={
            datos.area
          }
          onChange={(
            valor
          ) =>
            actualizar(
              "area",
              valor
            )
          }
        />


        <Campo
          label="Número aproximado de usuarios"
          icon={
            <FaProjectDiagram />
          }
        >

          <input
            type="number"
            min="1"
            value={
              datos.usuarios ||
              ""
            }
            onChange={(e) =>
              actualizar(
                "usuarios",
                e.target.value
              )
            }
            className={
              inputClass
            }
          />

        </Campo>


        <SeleccionMultiple
          titulo="Funciones o módulos"
          opciones={[
            "Usuarios",
            "Clientes",
            "Inventario",
            "Ventas",
            "Cotizaciones",
            "Reportes",
            "Pagos",
            "Agenda",
            "Notificaciones",
          ]}
          valores={
            datos.modulos ||
            []
          }
          onChange={(
            valor
          ) =>
            alternar(
              "modulos",
              valor
            )
          }
        />


        <SiNo
          titulo="¿Necesita distintos roles y permisos?"
          valor={
            datos.roles
          }
          onChange={(
            valor
          ) =>
            actualizar(
              "roles",
              valor
            )
          }
        />


        <SiNo
          titulo="¿Necesita reportes?"
          valor={
            datos.reportes
          }
          onChange={(
            valor
          ) =>
            actualizar(
              "reportes",
              valor
            )
          }
        />


        <Campo
          label="Integraciones necesarias"
          icon={
            <FaCode />
          }
        >

          <textarea
            rows={4}
            value={
              datos.integraciones ||
              ""
            }
            onChange={(e) =>
              actualizar(
                "integraciones",
                e.target.value
              )
            }
            className={
              inputClass
            }
            placeholder="Ej: facturación, WhatsApp, correo, Mercado Pago, Firebase..."
          />

        </Campo>

      </div>
    );
  }


  if (
    tipo ===
    "Videojuego personalizado"
  ) {
    return (
      <div className="space-y-7">

        <SeleccionMultiple
          titulo="¿Dónde quieres que funcione?"
          opciones={[
            "Android",
            "iPhone",
            "Windows",
            "Web",
          ]}
          valores={
            datos.plataformas ||
            []
          }
          onChange={(
            valor
          ) =>
            alternar(
              "plataformas",
              valor
            )
          }
        />


        <Seleccion
          titulo="Tipo de videojuego"
          opciones={[
            "2D",
            "3D",
            "Educativo",
            "Arcade",
            "Aventura",
            "Publicitario",
            "Simulación",
            "Otro",
          ]}
          valor={
            datos.tipoJuego
          }
          onChange={(
            valor
          ) =>
            actualizar(
              "tipoJuego",
              valor
            )
          }
        />


        <Seleccion
          titulo="Modo de juego"
          opciones={[
            "Un jugador",
            "Multijugador",
            "Ambos",
          ]}
          valor={
            datos.modoJuego
          }
          onChange={(
            valor
          ) =>
            actualizar(
              "modoJuego",
              valor
            )
          }
        />


        <SiNo
          titulo="¿Necesitas personajes personalizados?"
          valor={
            datos.personajes
          }
          onChange={(
            valor
          ) =>
            actualizar(
              "personajes",
              valor
            )
          }
        />


        <SiNo
          titulo="¿Ya tienes diseños o personajes?"
          valor={
            datos.tieneDisenos
          }
          onChange={(
            valor
          ) =>
            actualizar(
              "tieneDisenos",
              valor
            )
          }
        />


        <SiNo
          titulo="¿Necesitas música y efectos de sonido?"
          valor={
            datos.audio
          }
          onChange={(
            valor
          ) =>
            actualizar(
              "audio",
              valor
            )
          }
        />


        <Campo
          label="Describe la idea del videojuego"
          icon={
            <FaGamepad />
          }
        >

          <textarea
            rows={5}
            value={
              datos.idea ||
              ""
            }
            onChange={(e) =>
              actualizar(
                "idea",
                e.target.value
              )
            }
            className={
              inputClass
            }
          />

        </Campo>

      </div>
    );
  }


  if (
    tipo ===
    "Videos con dron"
  ) {
    return (
      <div className="space-y-7">

        <Seleccion
          titulo="¿Para qué necesitas el video?"
          opciones={[
            "Inmueble",
            "Terreno",
            "Evento",
            "Negocio",
            "Construcción",
            "Turismo",
            "Publicidad",
            "Otro",
          ]}
          valor={
            datos.finalidad
          }
          onChange={(
            valor
          ) =>
            actualizar(
              "finalidad",
              valor
            )
          }
        />


        <SeleccionMultiple
          titulo="¿Qué material necesitas?"
          opciones={[
            "Video aéreo",
            "Fotografías aéreas",
            "Video vertical",
            "Video horizontal",
            "Clips cortos",
            "Video editado",
          ]}
          valores={
            datos.material ||
            []
          }
          onChange={(
            valor
          ) =>
            alternar(
              "material",
              valor
            )
          }
        />


        <Seleccion
          titulo="Duración aproximada"
          opciones={[
            "15–30 segundos",
            "30–60 segundos",
            "1–3 minutos",
            "Más de 3 minutos",
          ]}
          valor={
            datos.duracion
          }
          onChange={(
            valor
          ) =>
            actualizar(
              "duracion",
              valor
            )
          }
        />


        <SiNo
          titulo="¿Necesitas edición?"
          valor={
            datos.edicion
          }
          onChange={(
            valor
          ) =>
            actualizar(
              "edicion",
              valor
            )
          }
        />


        <SiNo
          titulo="¿Quieres música?"
          valor={
            datos.musica
          }
          onChange={(
            valor
          ) =>
            actualizar(
              "musica",
              valor
            )
          }
        />


        <SiNo
          titulo="¿Necesitas texto o logotipo en el video?"
          valor={
            datos.logoVideo
          }
          onChange={(
            valor
          ) =>
            actualizar(
              "logoVideo",
              valor
            )
          }
        />


        <SeleccionMultiple
          titulo="¿Dónde se utilizará?"
          opciones={[
            "Instagram / TikTok",
            "Facebook",
            "YouTube",
            "Página web",
            "Presentación",
            "Otro",
          ]}
          valores={
            datos.formatos ||
            []
          }
          onChange={(
            valor
          ) =>
            alternar(
              "formatos",
              valor
            )
          }
        />


        <Campo
          label="Describe las tomas que necesitas"
          icon={
            <FaPhotoVideo />
          }
        >

          <textarea
            rows={5}
            value={
              datos.tomas ||
              ""
            }
            onChange={(e) =>
              actualizar(
                "tomas",
                e.target.value
              )
            }
            className={
              inputClass
            }
            placeholder="Ej: Fachada, recorrido alrededor del terreno, alberca, vista aérea completa..."
          />

        </Campo>

      </div>
    );
  }


  if (
    tipo ===
    "Cámaras y seguridad"
  ) {
    return (
      <div className="space-y-7">

        <Campo
          label="¿Cuántas cámaras aproximadamente?"
          icon={
            <FaCamera />
          }
        >

          <input
            type="number"
            min="1"
            value={
              datos.cantidadCamaras ||
              ""
            }
            onChange={(e) =>
              actualizar(
                "cantidadCamaras",
                e.target.value
              )
            }
            className={
              inputClass
            }
          />

        </Campo>


        <SeleccionMultiple
          titulo="Tipo de cámaras"
          opciones={[
            "Interior",
            "Exterior",
            "Ambas",
          ]}
          valores={
            datos.tipoCamaras ||
            []
          }
          onChange={(
            valor
          ) =>
            alternar(
              "tipoCamaras",
              valor
            )
          }
        />


        <SiNo
          titulo="¿Ya cuentas con cámaras?"
          valor={
            datos.tieneCamaras
          }
          onChange={(
            valor
          ) =>
            actualizar(
              "tieneCamaras",
              valor
            )
          }
        />


        <SiNo
          titulo="¿Necesitas grabador?"
          valor={
            datos.grabador
          }
          onChange={(
            valor
          ) =>
            actualizar(
              "grabador",
              valor
            )
          }
        />


        <SiNo
          titulo="¿Quieres ver las cámaras desde tu celular?"
          valor={
            datos.accesoCelular
          }
          onChange={(
            valor
          ) =>
            actualizar(
              "accesoCelular",
              valor
            )
          }
        />


        <Campo
          label="Número de pisos"
          icon={
            <FaLayerGroup />
          }
        >

          <input
            type="number"
            min="1"
            value={
              datos.pisos ||
              ""
            }
            onChange={(e) =>
              actualizar(
                "pisos",
                e.target.value
              )
            }
            className={
              inputClass
            }
          />

        </Campo>


        <SiNo
          titulo="¿Hay internet disponible?"
          valor={
            datos.internet
          }
          onChange={(
            valor
          ) =>
            actualizar(
              "internet",
              valor
            )
          }
        />

      </div>
    );
  }


  if (
    tipo ===
    "Redes y conectividad"
  ) {
    return (
      <div className="space-y-7">

        <Seleccion
          titulo="Tipo de lugar"
          opciones={[
            "Casa",
            "Oficina",
            "Negocio",
            "Hotel",
            "Escuela",
            "Otro",
          ]}
          valor={
            datos.tipoLugar
          }
          onChange={(
            valor
          ) =>
            actualizar(
              "tipoLugar",
              valor
            )
          }
        />


        <Campo
          label="Usuarios aproximados"
          icon={
            <FaNetworkWired />
          }
        >

          <input
            type="number"
            min="1"
            value={
              datos.usuarios ||
              ""
            }
            onChange={(e) =>
              actualizar(
                "usuarios",
                e.target.value
              )
            }
            className={
              inputClass
            }
          />

        </Campo>


        <Campo
          label="Número de pisos"
          icon={
            <FaLayerGroup />
          }
        >

          <input
            type="number"
            min="1"
            value={
              datos.pisos ||
              ""
            }
            onChange={(e) =>
              actualizar(
                "pisos",
                e.target.value
              )
            }
            className={
              inputClass
            }
          />

        </Campo>


        <SiNo
          titulo="¿Ya existe una red?"
          valor={
            datos.redExistente
          }
          onChange={(
            valor
          ) =>
            actualizar(
              "redExistente",
              valor
            )
          }
        />


        <SiNo
          titulo="¿Necesitas cableado?"
          valor={
            datos.cableado
          }
          onChange={(
            valor
          ) =>
            actualizar(
              "cableado",
              valor
            )
          }
        />


        <SiNo
          titulo="¿Necesitas puntos de acceso WiFi?"
          valor={
            datos.accessPoints
          }
          onChange={(
            valor
          ) =>
            actualizar(
              "accessPoints",
              valor
            )
          }
        />


        <SiNo
          titulo="¿Necesitas configuración de equipos?"
          valor={
            datos.configuracion
          }
          onChange={(
            valor
          ) =>
            actualizar(
              "configuracion",
              valor
            )
          }
        />

      </div>
    );
  }


  if (
    tipo ===
    "Publicidad digital"
  ) {
    return (
      <div className="space-y-7">

        <SeleccionMultiple
          titulo="¿Dónde deseas anunciarte?"
          opciones={[
            "Facebook",
            "Instagram",
            "TikTok",
            "Google",
            "YouTube",
          ]}
          valores={
            datos.canales ||
            []
          }
          onChange={(
            valor
          ) =>
            alternar(
              "canales",
              valor
            )
          }
        />


        <Seleccion
          titulo="Objetivo principal"
          opciones={[
            "Conseguir clientes",
            "Vender productos",
            "Dar a conocer la marca",
            "Promocionar evento",
            "Aumentar seguidores",
            "Otro",
          ]}
          valor={
            datos.objetivo
          }
          onChange={(
            valor
          ) =>
            actualizar(
              "objetivo",
              valor
            )
          }
        />


        <SiNo
          titulo="¿Ya tienes logotipo e identidad de marca?"
          valor={
            datos.tieneMarca
          }
          onChange={(
            valor
          ) =>
            actualizar(
              "tieneMarca",
              valor
            )
          }
        />


        <SiNo
          titulo="¿Necesitas creación de contenido?"
          valor={
            datos.creacionContenido
          }
          onChange={(
            valor
          ) =>
            actualizar(
              "creacionContenido",
              valor
            )
          }
        />


        <Campo
          label="Presupuesto mensual estimado para publicidad"
          icon={
            <FaDollarSign />
          }
        >

          <input
            type="number"
            value={
              datos.presupuestoPublicidad ||
              ""
            }
            onChange={(e) =>
              actualizar(
                "presupuestoPublicidad",
                e.target.value
              )
            }
            className={
              inputClass
            }
          />

        </Campo>

      </div>
    );
  }


  if (
    tipo ===
    "Soporte y mantenimiento"
  ) {
    return (
      <div className="space-y-7">

        <SeleccionMultiple
          titulo="¿Qué necesitas?"
          opciones={[
            "Mantenimiento de computadoras",
            "Soporte de software",
            "Redes",
            "Servidores",
            "Respaldos",
            "Configuración",
            "Diagnóstico",
          ]}
          valores={
            datos.tipoSoporte ||
            []
          }
          onChange={(
            valor
          ) =>
            alternar(
              "tipoSoporte",
              valor
            )
          }
        />


        <Campo
          label="Cantidad aproximada de equipos"
          icon={
            <FaTools />
          }
        >

          <input
            type="number"
            min="1"
            value={
              datos.equipos ||
              ""
            }
            onChange={(e) =>
              actualizar(
                "equipos",
                e.target.value
              )
            }
            className={
              inputClass
            }
          />

        </Campo>


        <Seleccion
          titulo="¿Cómo prefieres el servicio?"
          opciones={[
            "Presencial",
            "Remoto",
            "Indistinto",
          ]}
          valor={
            datos.modalidad
          }
          onChange={(
            valor
          ) =>
            actualizar(
              "modalidad",
              valor
            )
          }
        />


        <Seleccion
          titulo="Frecuencia"
          opciones={[
            "Una sola vez",
            "Mensual",
            "Trimestral",
            "Por evento",
          ]}
          valor={
            datos.frecuencia
          }
          onChange={(
            valor
          ) =>
            actualizar(
              "frecuencia",
              valor
            )
          }
        />

      </div>
    );
  }


  return (
    <div className="space-y-7">

      <Campo
        label="Describe detalladamente lo que necesitas"
        icon={
          <FaProjectDiagram />
        }
      >

        <textarea
          rows={7}
          value={
            datos.descripcion ||
            ""
          }
          onChange={(e) =>
            actualizar(
              "descripcion",
              e.target.value
            )
          }
          className={
            inputClass
          }
        />

      </Campo>

    </div>
  );
}


/* ======================================================
   UI
====================================================== */

function Paso({
  numero,
  titulo,
  activo,
  terminado,
}) {
  return (
    <div
      className="
        flex
        items-center
        gap-3
      "
    >

      <div
        className={`
          w-10
          h-10

          rounded-full

          border-2

          flex
          items-center
          justify-center

          font-black

          ${
            terminado
              ? `
                bg-sky-500
                border-sky-500
                text-white
              `
              : activo
              ? `
                bg-sky-50
                border-sky-500
                text-sky-600
              `
              : `
                bg-white
                border-slate-200
                text-slate-400
              `
          }
        `}
      >

        {terminado
          ? <FaCheck />
          : numero
        }

      </div>


      <span
        className={`
          font-bold

          ${
            activo ||
            terminado
              ? "text-sky-600"
              : "text-slate-400"
          }
        `}
      >
        {titulo}
      </span>

    </div>
  );
}


function CabeceraPaso({
  numero,
  titulo,
  texto,
}) {
  return (
    <div>

      <p
        className="
          text-xs

          uppercase
          tracking-[0.2em]

          text-sky-500

          font-black
        "
      >
        Paso {numero}
      </p>


      <h2
        className="
          text-2xl
          md:text-3xl

          font-black

          mt-2
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


function Campo({
  label,
  icon,
  children,
  obligatorio,
}) {
  return (
    <div>

      {label && (

        <Label
          icon={
            icon
          }
        >
          {label}

          {obligatorio && (
            <span className="text-red-500 ml-1">
              *
            </span>
          )}

        </Label>

      )}


      <div className="mt-2">
        {children}
      </div>

    </div>
  );
}


function Label({
  icon,
  children,
}) {
  return (
    <label
      className="
        text-sm
        font-bold

        text-slate-700

        flex
        items-center
        gap-2
      "
    >

      <span className="text-sky-500">
        {icon}
      </span>

      {children}

    </label>
  );
}


function Seleccion({
  titulo,
  opciones,
  valor,
  onChange,
}) {
  return (
    <div>

      <p
        className="
          font-black
          text-slate-800
        "
      >
        {titulo}
      </p>


      <div
        className="
          flex
          flex-wrap

          gap-2

          mt-3
        "
      >

        {opciones.map(
          (
            opcion
          ) => (

            <button
              key={
                opcion
              }
              type="button"
              onClick={() =>
                onChange(
                  opcion
                )
              }
              className={`
                px-4
                py-2.5

                rounded-xl

                border

                text-sm
                font-semibold

                transition

                ${
                  valor ===
                  opcion
                    ? `
                      bg-sky-500
                      border-sky-500
                      text-white
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
              {opcion}
            </button>

          )
        )}

      </div>

    </div>
  );
}


function SeleccionMultiple({
  titulo,
  opciones,
  valores,
  onChange,
}) {
  return (
    <div>

      <p
        className="
          font-black
          text-slate-800
        "
      >
        {titulo}
      </p>


      <p
        className="
          text-xs
          text-slate-400

          mt-1
        "
      >
        Puedes seleccionar varias opciones.
      </p>


      <div
        className="
          flex
          flex-wrap

          gap-2

          mt-3
        "
      >

        {opciones.map(
          (
            opcion
          ) => {
            const activo =
              valores.includes(
                opcion
              );


            return (
              <button
                key={
                  opcion
                }
                type="button"
                onClick={() =>
                  onChange(
                    opcion
                  )
                }
                className={`
                  px-4
                  py-2.5

                  rounded-xl

                  border

                  text-sm
                  font-semibold

                  flex
                  items-center
                  gap-2

                  ${
                    activo
                      ? `
                        bg-sky-500
                        border-sky-500
                        text-white
                      `
                      : `
                        bg-white
                        border-slate-200
                        text-slate-600
                      `
                  }
                `}
              >

                {activo && (
                  <FaCheck />
                )}

                {opcion}

              </button>
            );
          }
        )}

      </div>

    </div>
  );
}


function SiNo({
  titulo,
  valor,
  onChange,
}) {
  return (
    <div
      className="
        flex
        flex-col
        sm:flex-row

        sm:items-center
        sm:justify-between

        gap-4

        p-4

        rounded-2xl

        bg-slate-50

        border
        border-slate-200
      "
    >

      <p
        className="
          font-bold
          text-slate-700
        "
      >
        {titulo}
      </p>


      <div
        className="
          flex
          gap-2
        "
      >

        <button
          type="button"
          onClick={() =>
            onChange(
              true
            )
          }
          className={`
            px-5
            py-2

            rounded-xl

            border

            font-bold

            ${
              valor ===
              true
                ? `
                  bg-sky-500
                  border-sky-500
                  text-white
                `
                : `
                  bg-white
                  border-slate-200
                  text-slate-500
                `
            }
          `}
        >
          Sí
        </button>


        <button
          type="button"
          onClick={() =>
            onChange(
              false
            )
          }
          className={`
            px-5
            py-2

            rounded-xl

            border

            font-bold

            ${
              valor ===
              false
                ? `
                  bg-slate-800
                  border-slate-800
                  text-white
                `
                : `
                  bg-white
                  border-slate-200
                  text-slate-500
                `
            }
          `}
        >
          No
        </button>

      </div>

    </div>
  );
}


function UploadIndividual({
  titulo,
  texto,
  icon,
  preview,
  onChange,
  onRemove,
}) {
  return (
    <div
      className="
        p-5

        rounded-[26px]

        bg-[#f7faff]

        border
        border-slate-200
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
            w-11
            h-11

            rounded-xl

            bg-sky-100

            text-sky-600

            flex
            items-center
            justify-center
          "
        >
          {icon}
        </div>


        <div>

          <h3
            className="
              font-black
              text-slate-900
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
            {texto}
          </p>

        </div>

      </div>


      {!preview ? (

        <label
          className="
            mt-5

            border-2
            border-dashed
            border-sky-300

            rounded-2xl

            p-7

            block

            text-center

            cursor-pointer

            bg-sky-50

            hover:bg-sky-100

            transition
          "
        >

          <FaUpload
            className="
              mx-auto

              text-2xl
              text-sky-500
            "
          />


          <p
            className="
              text-sm
              font-bold

              text-slate-700

              mt-3
            "
          >
            Subir archivo
          </p>


          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={
              onChange
            }
          />

        </label>

      ) : (

        <div
          className="
            relative

            mt-5

            rounded-2xl

            overflow-hidden

            border
            border-slate-200

            bg-white
          "
        >

          <img
            src={
              preview
            }
            alt=""
            className="
              w-full

              h-[230px]

              object-contain
            "
          />


          <button
            type="button"
            onClick={
              onRemove
            }
            className="
              absolute

              top-3
              right-3

              w-9
              h-9

              rounded-full

              bg-red-500

              text-white

              flex
              items-center
              justify-center
            "
          >
            <FaTimes />
          </button>

        </div>

      )}

    </div>
  );
}


function UploadMultiple({
  titulo,
  texto,
  icon,
  previews,
  onChange,
  onRemove,
}) {
  return (
    <div
      className="
        p-5

        rounded-[26px]

        bg-[#f7faff]

        border
        border-slate-200
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
            w-11
            h-11

            rounded-xl

            bg-sky-100

            text-sky-600

            flex
            items-center
            justify-center
          "
        >
          {icon}
        </div>


        <div>

          <h3
            className="
              font-black
              text-slate-900
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
            {texto}
          </p>

        </div>

      </div>


      <label
        className="
          mt-5

          border-2
          border-dashed
          border-sky-300

          rounded-2xl

          p-6

          block

          text-center

          cursor-pointer

          bg-sky-50

          hover:bg-sky-100
        "
      >

        <FaCloudUploadAlt
          className="
            mx-auto

            text-3xl
            text-sky-500
          "
        />


        <p
          className="
            font-bold
            text-slate-700

            mt-2
          "
        >
          Agregar imágenes
        </p>


        <p
          className="
            text-xs
            text-slate-400

            mt-1
          "
        >
          JPG, PNG o WEBP · máximo 5 MB
        </p>


        <input
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={
            onChange
          }
        />

      </label>


      {previews.length >
        0 && (

        <div
          className="
            grid
            grid-cols-3

            gap-3

            mt-5
          "
        >

          {previews.map(
            (
              preview,
              index
            ) => (

              <div
                key={`${preview.url}-${index}`}
                className="
                  relative

                  aspect-square

                  rounded-xl

                  overflow-hidden

                  bg-white

                  border
                  border-slate-200
                "
              >

                <img
                  src={
                    preview.url
                  }
                  alt=""
                  className="
                    w-full
                    h-full

                    object-cover
                  "
                />


                <button
                  type="button"
                  onClick={() =>
                    onRemove(
                      index
                    )
                  }
                  className="
                    absolute

                    top-2
                    right-2

                    w-7
                    h-7

                    rounded-full

                    bg-red-500

                    text-white

                    flex
                    items-center
                    justify-center
                  "
                >
                  <FaTimes />
                </button>

              </div>

            )
          )}

        </div>

      )}

    </div>
  );
}


function Contador({
  titulo,
  valor,
}) {
  return (
    <div
      className="
        bg-white

        border
        border-slate-200

        rounded-xl

        p-3
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
          text-xl
          font-black
          text-slate-900

          mt-1
        "
      >
        {valor}
      </p>

    </div>
  );
}


function Resumen({
  titulo,
  valor,
}) {
  return (
    <div>

      <p
        className="
          text-xs

          uppercase
          tracking-wide

          text-slate-400
        "
      >
        {titulo}
      </p>


      <p
        className="
          mt-1

          text-slate-700

          font-semibold

          break-words

          whitespace-pre-line
        "
      >
        {valor}
      </p>

    </div>
  );
}


function formatearClave(
  clave
) {
  const texto =
    clave
      .replace(
        /([A-Z])/g,
        " $1"
      )
      .replace(
        /_/g,
        " "
      );


  return (
    texto.charAt(0)
      .toUpperCase() +
    texto.slice(1)
  );
}


function formatearValor(
  valor
) {
  if (
    Array.isArray(
      valor
    )
  ) {
    return valor.length
      ? valor.join(
          ", "
        )
      : "No especificado";
  }


  if (
    valor ===
    true
  ) {
    return "Sí";
  }


  if (
    valor ===
    false
  ) {
    return "No";
  }


  if (
    valor ===
      null ||
    valor ===
      undefined ||
    valor ===
      ""
  ) {
    return "No especificado";
  }


  return String(
    valor
  );
}


export default CrearCotizacion;