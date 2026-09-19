import { useEffect, useMemo, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { db, auth } from "../firebase.config";

import {
  arrayUnion,
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";

import { onAuthStateChanged } from "firebase/auth";

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
  FaArrowLeft,
  FaArrowRight,
  FaBell,
  FaCalendarAlt,
  FaCamera,
  FaCheck,
  FaCheckCircle,
  FaCheckSquare,
  FaCloudUploadAlt,
  FaCrosshairs,
  FaDollarSign,
  FaEdit,
  FaEye,
  FaHistory,
  FaImages,
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaPen,
  FaPhone,
  FaRulerCombined,
  FaSave,
  FaSearch,
  FaSquare,
  FaSyncAlt,
  FaTag,
  FaTimes,
  FaTimesCircle,
  FaTrashAlt,
  FaWhatsapp,
} from "react-icons/fa";

/* ======================================================
   CONFIGURACIÓN LEAFLET
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

const POSICION_CAMPECHE = {
  lat: 19.8301,
  lng: -90.5349,
};

const TIPOS_SOLUCION = [
  "Página web",
  "Aplicación móvil",
  "Sistema web",
  "Cámaras y seguridad",
  "Redes y conectividad",
  "Publicidad digital",
  "Soporte y mantenimiento",
  "Otro",
];

const ESTADOS_EDITABLES = ["pendiente", "revision", "en_revision"];

const ESTADOS_RESPUESTA_PROPUESTA = [
  "cotizada",
  "propuesta_enviada",
  "propuesta_modificada",
];

/* ======================================================
   GEOCODIFICACIÓN INVERSA
====================================================== */

async function obtenerDireccion(lat, lng) {
  const params = new URLSearchParams({
    format: "jsonv2",
    lat: String(lat),
    lon: String(lng),
    addressdetails: "1",
    zoom: "18",
    "accept-language": "es",
  });

  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error("No se pudo obtener la dirección.");
  }

  const data = await response.json();
  return data.display_name || "";
}

/* ======================================================
   RECENTRAR MAPA
====================================================== */

function RecentrarMapa({ posicion, zoom = 16 }) {
  const map = useMap();

  useEffect(() => {
    if (!posicion) return;

    map.setView([posicion.lat, posicion.lng], zoom, {
      animate: true,
    });
  }, [posicion, map, zoom]);

  return null;
}

/* ======================================================
   SELECTOR DE UBICACIÓN
====================================================== */

function SelectorUbicacionEditar({
  posicion,
  setPosicion,
  setUbicacion,
  setError,
}) {
  const actualizarUbicacion = async (lat, lng) => {
    setError("");

    setPosicion({ lat, lng });

    try {
      const direccion = await obtenerDireccion(lat, lng);
      setUbicacion(direccion || `${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    } catch (error) {
      console.error("Error obteniendo dirección:", error);
      setUbicacion(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    }
  };

  useMapEvents({
    click(e) {
      actualizarUbicacion(e.latlng.lat, e.latlng.lng);
    },
  });

  if (!posicion) return null;

  return (
    <Marker
      position={[posicion.lat, posicion.lng]}
      draggable
      eventHandlers={{
        dragend: (e) => {
          const nuevaPosicion = e.target.getLatLng();
          actualizarUbicacion(nuevaPosicion.lat, nuevaPosicion.lng);
        },
      }}
    >
      <Popup>Ubicación seleccionada</Popup>
    </Marker>
  );
}

/* ======================================================
   COMPONENTE PRINCIPAL
====================================================== */

function Cotizaciones() {
  const outlet = useOutletContext() || {};
  const modoOscuro = outlet?.modoOscuro ?? false;

  const notificacionesInicialesMarcadas = useRef(false);

  const [solicitudes, setCotizaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [mensajeGeneral, setMensajeGeneral] = useState("");
  const [errorGeneral, setErrorGeneral] = useState("");

  const [modoSeleccion, setModoSeleccion] = useState(false);
  const [seleccionadas, setSeleccionadas] = useState([]);

  const [galeriaOpen, setGaleriaOpen] = useState(false);
  const [imgs, setImgs] = useState([]);
  const [index, setIndex] = useState(0);

  const [propuestaOpen, setPropuestaOpen] = useState(false);
  const [cotizacionSeleccionada, setCotizacionSeleccionada] = useState(null);

  const [historialOpen, setHistorialOpen] = useState(false);
  const [cotizacionHistorial, setCotizacionHistorial] = useState(null);

  const [editarOpen, setEditarOpen] = useState(false);
  const [cotizacionEditando, setCotizacionEditando] = useState(null);
  const [pasoEditar, setPasoEditar] = useState(1);
  const totalPasosEditar = 4;

  const [editNombre, setEditNombre] = useState("");
  const [editDescripcion, setEditDescripcion] = useState("");
  const [editTipo, setEditTipo] = useState("Página web");
  const [editUbicacion, setEditUbicacion] = useState("");
  const [editMedidas, setEditMedidas] = useState("");
  const [editFechaDeseada, setEditFechaDeseada] = useState("");
  const [editPresupuesto, setEditPresupuesto] = useState("");
  const [editTelefono, setEditTelefono] = useState("");
  const [editMetodoContacto, setEditMetodoContacto] = useState("WhatsApp");

  const [editPosicion, setEditPosicion] = useState(POSICION_CAMPECHE);
  const [buscandoUbicacion, setBuscandoUbicacion] = useState(false);
  const [obteniendoGPS, setObteniendoGPS] = useState(false);

  const [imagenesProyectoEdit, setImagenesProyectoEdit] = useState([]);
  const [imagenesClienteEdit, setImagenesClienteEdit] = useState([]);
  const [nuevasImagenes, setNuevasImagenes] = useState([]);

  const previewsNuevos = useMemo(() => {
    return nuevasImagenes.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
  }, [nuevasImagenes]);

  useEffect(() => {
    return () => {
      previewsNuevos.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [previewsNuevos]);

  const theme = useMemo(() => {
    if (modoOscuro) {
      return {
        page: "min-h-screen bg-slate-950 text-white",
        shell: "max-w-7xl mx-auto",
        card: "bg-slate-900 border border-slate-800 shadow-xl shadow-black/10",
        cardSoft: "bg-slate-900/80 border border-slate-800",
        overlay: "bg-slate-950/75",
        title: "text-white",
        text: "text-slate-200",
        muted: "text-slate-400",
        line: "border-slate-800",
        input:
          "w-full rounded-2xl border border-slate-700 bg-slate-950 text-white placeholder:text-slate-500 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-500/15",
        primaryBtn:
          "bg-sky-500 hover:bg-sky-400 text-white border border-sky-500 shadow-lg shadow-sky-500/20",
        secondaryBtn:
          "bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700",
        successBtn:
          "bg-emerald-500 hover:bg-emerald-400 text-white border border-emerald-500 shadow-lg shadow-emerald-500/20",
        warningBtn:
          "bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30",
        dangerBtn:
          "bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30",
        hero:
          "bg-gradient-to-r from-sky-500/15 via-cyan-500/10 to-transparent border border-slate-800",
      };
    }

    return {
      page: "min-h-screen bg-[#f3f8ff] text-slate-900",
      shell: "max-w-7xl mx-auto",
      card: "bg-white border border-slate-200 shadow-sm shadow-slate-200/50",
      cardSoft: "bg-[#f8fbff] border border-slate-200",
      overlay: "bg-slate-900/45",
      title: "text-slate-900",
      text: "text-slate-700",
      muted: "text-slate-500",
      line: "border-slate-200",
      input:
        "w-full rounded-2xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-500/15",
      primaryBtn:
        "bg-sky-500 hover:bg-sky-600 text-white border border-sky-500 shadow-lg shadow-sky-500/20",
      secondaryBtn:
        "bg-white hover:bg-slate-50 text-slate-700 border border-slate-300",
      successBtn:
        "bg-emerald-500 hover:bg-emerald-600 text-white border border-emerald-500 shadow-lg shadow-emerald-500/20",
      warningBtn:
        "bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200",
      dangerBtn:
        "bg-red-50 hover:bg-red-100 text-red-600 border border-red-200",
      hero:
        "bg-gradient-to-r from-sky-100 via-cyan-50 to-white border border-slate-200",
    };
  }, [modoOscuro]);

  /* ======================================================
     FIREBASE EN TIEMPO REAL
  ====================================================== */

  useEffect(() => {
    let unsubCotizaciones = null;

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setCotizaciones([]);
        setCargando(false);
        return;
      }

      const userEmail = user.email;
      const userUid = user.uid;

      const q = query(
        collection(db, "cotizaciones"),
        where("uid", "==", userUid)
      );

      unsubCotizaciones = onSnapshot(
        q,
        (snapshot) => {
          const data = snapshot.docs
            .map((documento) => ({
              id: documento.id,
              ...documento.data(),
            }))
            .filter((c) => {
              const pertenece =
                c.uid === userUid || (userEmail && c.usuario === userEmail);

              const visible = c.ocultoPorCliente !== true;

              const sigueEnCotizaciones = ![
                "finalizada",
                "terminada",
                "terminado",
              ].includes(c.estado);

              return pertenece && visible && sigueEnCotizaciones;
            });

          data.sort((a, b) => {
            const fechaA =
              a.fechaActualizacion?.toMillis?.() ||
              a.fecha?.toMillis?.() ||
              0;

            const fechaB =
              b.fechaActualizacion?.toMillis?.() ||
              b.fecha?.toMillis?.() ||
              0;

            return fechaB - fechaA;
          });

          if (!notificacionesInicialesMarcadas.current) {
            notificacionesInicialesMarcadas.current = true;

            const pendientesDeVista = data.filter(
              (cotizacion) =>
                cotizacion.vistoPorCliente === false &&
                [
                  "cotizada",
                  "propuesta_enviada",
                  "propuesta_modificada",
                  "confirmada_admin",
                  "anticipo_pendiente",
                  "anticipo_pagado",
                  "anticipo_recibido",
                  "en_proceso",
                  "proceso",
                  "instalacion_programada",
                  "instalacion",
                ].includes(cotizacion.estado)
            );

            if (pendientesDeVista.length > 0) {
              const batchVistas = writeBatch(db);

              pendientesDeVista.forEach((cotizacion) => {
                batchVistas.update(doc(db, "cotizaciones", cotizacion.id), {
                  vistoPorCliente: true,
                });
              });

              batchVistas.commit().catch((error) => {
                console.error(
                  "Error marcando novedades del cliente como vistas:",
                  error
                );
              });
            }
          }

          setCotizaciones(data);

          setSeleccionadas((actuales) =>
            actuales.filter((id) => data.some((c) => c.id === id))
          );

          setCotizacionSeleccionada((actual) => {
            if (!actual) return null;
            return data.find((c) => c.id === actual.id) || actual;
          });

          setCotizacionHistorial((actual) => {
            if (!actual) return null;
            return data.find((c) => c.id === actual.id) || actual;
          });

          setCargando(false);
        },
        (error) => {
          console.error("Error cargando solicitudes:", error);
          setErrorGeneral("No se pudieron cargar las solicitudes.");
          setCargando(false);
        }
      );
    });

    return () => {
      unsubAuth();
      if (unsubCotizaciones) unsubCotizaciones();
    };
  }, []);

  /* ======================================================
     HISTORIAL
  ====================================================== */

  const crearEventoHistorial = (
    tipo,
    titulo,
    descripcion = "",
    actor = "cliente",
    extra = {}
  ) => ({
    tipo,
    titulo,
    descripcion,
    actor,
    fecha: Timestamp.now(),
    ...extra,
  });

  const obtenerMillis = (fecha) => {
    if (!fecha) return 0;

    try {
      if (typeof fecha.toMillis === "function") return fecha.toMillis();
      if (typeof fecha.toDate === "function") return fecha.toDate().getTime();
      return new Date(fecha).getTime() || 0;
    } catch {
      return 0;
    }
  };

  const obtenerHistorialVisible = (cotizacion) => {
    const eventos = Array.isArray(cotizacion?.historial)
      ? [...cotizacion.historial]
      : [];

    if (
      cotizacion?.fecha &&
      !eventos.some((evento) => evento.tipo === "solicitud_creada")
    ) {
      eventos.push({
        tipo: "solicitud_creada",
        titulo: "Solicitud enviada",
        descripcion: "Enviaste la solicitud a Macro.",
        actor: "cliente",
        fecha: cotizacion.fecha,
      });
    }

    if (
      cotizacion?.fechaPropuesta &&
      !eventos.some((evento) =>
        ["propuesta_enviada", "propuesta_modificada"].includes(evento.tipo)
      )
    ) {
      eventos.push({
        tipo: "propuesta_enviada",
        titulo: "Propuesta recibida",
        descripcion: "Macro envió una propuesta.",
        actor: "admin",
        fecha: cotizacion.fechaPropuesta,
      });
    }

    if (
      cotizacion?.fechaRespuestaCliente &&
      !eventos.some((evento) =>
        [
          "propuesta_aceptada",
          "cambios_solicitados",
          "propuesta_rechazada",
          "solicitud_cancelada",
        ].includes(evento.tipo)
      )
    ) {
      if (
        cotizacion.respuestaCliente === "aceptada" ||
        cotizacion.estado === "aceptada_cliente"
      ) {
        eventos.push({
          tipo: "propuesta_aceptada",
          titulo: "Propuesta aceptada",
          descripcion: "Aceptaste la propuesta de Macro.",
          actor: "cliente",
          fecha: cotizacion.fechaRespuestaCliente,
        });
      } else if (
        cotizacion.respuestaCliente === "solicita_modificacion" ||
        cotizacion.estado === "cambios_solicitados"
      ) {
        eventos.push({
          tipo: "cambios_solicitados",
          titulo: "Cambios solicitados",
          descripcion:
            cotizacion.mensajeCliente || "Solicitaste cambios a la propuesta.",
          actor: "cliente",
          fecha: cotizacion.fechaRespuestaCliente,
        });
      } else if (
        cotizacion.respuestaCliente === "rechazada" ||
        cotizacion.estado === "rechazada_cliente"
      ) {
        eventos.push({
          tipo: "propuesta_rechazada",
          titulo: "Propuesta rechazada",
          descripcion: "Rechazaste la propuesta.",
          actor: "cliente",
          fecha: cotizacion.fechaRespuestaCliente,
        });
      } else if (cotizacion.respuestaCliente === "cancelada") {
        eventos.push({
          tipo: "solicitud_cancelada",
          titulo: "Solicitud cancelada",
          descripcion: "Cancelaste la solicitud.",
          actor: "cliente",
          fecha: cotizacion.fechaRespuestaCliente,
        });
      }
    }

    return eventos
      .filter((evento) => evento && evento.fecha)
      .sort((a, b) => obtenerMillis(a.fecha) - obtenerMillis(b.fecha));
  };

  /* ======================================================
     ESTADO
  ====================================================== */

  const obtenerEstado = (estado) => {
    const normal = {
      pendiente: {
        texto: "Solicitud enviada",
        clase: modoOscuro
          ? "bg-slate-800 text-slate-200 border border-slate-700"
          : "bg-slate-100 text-slate-700 border border-slate-200",
      },
      revision: {
        texto: "En revisión",
        clase: "bg-blue-50 text-blue-700 border border-blue-200",
      },
      en_revision: {
        texto: "En revisión",
        clase: "bg-blue-50 text-blue-700 border border-blue-200",
      },
      cotizada: {
        texto: "Propuesta recibida",
        clase: "bg-sky-50 text-sky-700 border border-sky-200",
      },
      propuesta_enviada: {
        texto: "Propuesta recibida",
        clase: "bg-sky-50 text-sky-700 border border-sky-200",
      },
      propuesta_modificada: {
        texto: "Propuesta modificada",
        clase: "bg-amber-50 text-amber-700 border border-amber-200",
      },
      aceptada_cliente: {
        texto: "Aceptada",
        clase: "bg-emerald-50 text-emerald-700 border border-emerald-200",
      },
      cambios: {
        texto: "Cambios solicitados",
        clase: "bg-amber-50 text-amber-700 border border-amber-200",
      },
      cambios_solicitados: {
        texto: "Cambios solicitados",
        clase: "bg-amber-50 text-amber-700 border border-amber-200",
      },
      rechazada_cliente: {
        texto: "Propuesta rechazada",
        clase: "bg-red-50 text-red-700 border border-red-200",
      },
      cancelada_cliente: {
        texto: "Solicitud cancelada",
        clase: "bg-red-50 text-red-700 border border-red-200",
      },
      confirmada_admin: {
        texto: "Proyecto confirmado",
        clase: "bg-emerald-50 text-emerald-700 border border-emerald-200",
      },
      anticipo_pendiente: {
        texto: "Anticipo pendiente",
        clase: "bg-cyan-50 text-cyan-700 border border-cyan-200",
      },
      anticipo_pagado: {
        texto: "Anticipo recibido",
        clase: "bg-green-50 text-green-700 border border-green-200",
      },
      anticipo_recibido: {
        texto: "Anticipo recibido",
        clase: "bg-green-50 text-green-700 border border-green-200",
      },
      proceso: {
        texto: "Proyecto en proceso",
        clase: "bg-violet-50 text-violet-700 border border-violet-200",
      },
      en_proceso: {
        texto: "Proyecto en proceso",
        clase: "bg-violet-50 text-violet-700 border border-violet-200",
      },
      instalacion: {
        texto: "Instalación programada",
        clase: "bg-indigo-50 text-indigo-700 border border-indigo-200",
      },
      instalacion_programada: {
        texto: "Instalación programada",
        clase: "bg-indigo-50 text-indigo-700 border border-indigo-200",
      },
      finalizada: {
        texto: "Proyecto finalizado",
        clase: "bg-emerald-50 text-emerald-700 border border-emerald-200",
      },
      terminada: {
        texto: "Proyecto finalizado",
        clase: "bg-emerald-50 text-emerald-700 border border-emerald-200",
      },
    };

    return (
      normal[estado] || {
        texto: estado || "Pendiente",
        clase: modoOscuro
          ? "bg-slate-800 text-slate-200 border border-slate-700"
          : "bg-slate-100 text-slate-700 border border-slate-200",
      }
    );
  };

  const puedeEditarSolicitud = (cotizacion) =>
    ESTADOS_EDITABLES.includes(cotizacion.estado);

  const puedeCancelarSolicitud = (cotizacion) =>
    ESTADOS_EDITABLES.includes(cotizacion.estado);

  const tieneNovedad = (cotizacion) => {
    return (
      cotizacion.vistoPorCliente === false &&
      [
        "cotizada",
        "propuesta_enviada",
        "propuesta_modificada",
        "confirmada_admin",
        "anticipo_pendiente",
        "anticipo_pagado",
        "anticipo_recibido",
        "proceso",
        "en_proceso",
        "instalacion",
        "instalacion_programada",
        "finalizada",
        "terminada",
      ].includes(cotizacion.estado)
    );
  };

  const cantidadNuevas = solicitudes.filter(tieneNovedad).length;

  const obtenerMensajeEstado = (cotizacion) => {
    switch (cotizacion.estado) {
      case "cotizada":
      case "propuesta_enviada":
        return {
          titulo: "Macro envió una propuesta",
          texto: "Revisa el precio y las condiciones del proyecto.",
          clase: "bg-sky-50 border border-sky-200 text-sky-700",
          icono: <FaBell className="text-sky-500" />,
        };

      case "propuesta_modificada":
        return {
          titulo: "Propuesta actualizada",
          texto: "Macro modificó la propuesta con nuevos datos.",
          clase: "bg-amber-50 border border-amber-200 text-amber-700",
          icono: <FaSyncAlt className="text-amber-500" />,
        };

      case "aceptada_cliente":
        return {
          titulo: "Aceptación registrada",
          texto: "Macro ya recibió tu aceptación.",
          clase: "bg-emerald-50 border border-emerald-200 text-emerald-700",
          icono: <FaCheckCircle className="text-emerald-500" />,
        };

      case "cancelada_cliente":
        return {
          titulo: "Solicitud cancelada",
          texto: "Esta solicitud ya no seguirá en proceso.",
          clase: "bg-red-50 border border-red-200 text-red-700",
          icono: <FaTimesCircle className="text-red-500" />,
        };

      case "confirmada_admin":
        return {
          titulo: "Proyecto confirmado",
          texto: "Macro confirmó tu proyecto y pronto seguirá el proceso.",
          clase: "bg-emerald-50 border border-emerald-200 text-emerald-700",
          icono: <FaCheckCircle className="text-emerald-500" />,
        };

      default:
        return null;
    }
  };

  /* ======================================================
     SELECCIÓN
  ====================================================== */

  const alternarModoSeleccion = () => {
    setModoSeleccion((actual) => !actual);
    setSeleccionadas([]);
    setMensajeGeneral("");
    setErrorGeneral("");
  };

  const seleccionarCotizacion = (id) => {
    setSeleccionadas((actuales) => {
      if (actuales.includes(id)) {
        return actuales.filter((item) => item !== id);
      }
      return [...actuales, id];
    });
  };

  const todasSeleccionadas =
    solicitudes.length > 0 && seleccionadas.length === solicitudes.length;

  const seleccionarTodas = () => {
    if (todasSeleccionadas) {
      setSeleccionadas([]);
      return;
    }

    setSeleccionadas(solicitudes.map((c) => c.id));
  };

  const eliminarSeleccionadas = async () => {
    if (seleccionadas.length === 0) return;

    const confirmar = window.confirm(
      `¿Quieres quitar ${seleccionadas.length} ${
        seleccionadas.length === 1 ? "solicitud" : "solicitudes"
      } de tu panel?`
    );

    if (!confirmar) return;

    try {
      setProcesando(true);
      const batch = writeBatch(db);

      seleccionadas.forEach((id) => {
        const cotizacion = solicitudes.find((item) => item.id === id);
        if (!cotizacion) return;

        const yaEsProyecto = [
          "aceptada_cliente",
          "confirmada_admin",
          "anticipo_pendiente",
          "anticipo_pagado",
          "anticipo_recibido",
          "en_proceso",
          "proceso",
          "instalacion_programada",
          "instalacion",
        ].includes(cotizacion.estado);

        if (yaEsProyecto) return;

        batch.update(doc(db, "cotizaciones", id), {
          ocultoPorCliente: true,
          vistoPorAdmin: false,
          mensajeAdmin: "El cliente quitó esta solicitud de su panel.",
          fechaActualizacion: serverTimestamp(),
        });
      });

      await batch.commit();

      setSeleccionadas([]);
      setModoSeleccion(false);
      setMensajeGeneral(
        "Las solicitudes seleccionadas se quitaron de tu panel."
      );
    } catch (error) {
      console.error("Error ocultando solicitudes:", error);
      setErrorGeneral("No se pudieron quitar las solicitudes.");
    } finally {
      setProcesando(false);
    }
  };

  /* ======================================================
     VER / HISTORIAL
  ====================================================== */

  const marcarComoVista = async (cotizacion) => {
    if (cotizacion.vistoPorCliente !== false) return;

    try {
      await updateDoc(doc(db, "cotizaciones", cotizacion.id), {
        vistoPorCliente: true,
      });
    } catch (error) {
      console.error("Error marcando vista:", error);
    }
  };

  const verPropuesta = async (cotizacion) => {
    setCotizacionSeleccionada(cotizacion);
    setPropuestaOpen(true);
    await marcarComoVista(cotizacion);
  };

  const abrirHistorial = async (cotizacion) => {
    setCotizacionHistorial(cotizacion);
    setHistorialOpen(true);
    await marcarComoVista(cotizacion);
  };

  /* ======================================================
     EDICIÓN
  ====================================================== */

  const abrirEdicion = (cotizacion) => {
    if (!puedeEditarSolicitud(cotizacion)) {
      window.alert("Esta solicitud ya no puede modificarse.");
      return;
    }

    setCotizacionEditando(cotizacion);
    setPasoEditar(1);
    setEditNombre(cotizacion.nombre || "");
    setEditDescripcion(cotizacion.descripcion || "");
    setEditTipo(cotizacion.tipo || "Página web");
    setEditUbicacion(cotizacion.ubicacion || "");
    setEditMedidas(cotizacion.medidas || "");
    setEditFechaDeseada(cotizacion.fechaDeseada || "");
    setEditPresupuesto(cotizacion.presupuestoEstimadoCliente ?? "");
    setEditTelefono(cotizacion.telefono || "");
    setEditMetodoContacto(cotizacion.metodoContacto || "WhatsApp");

    const lat = Number(cotizacion.latitud);
    const lng = Number(cotizacion.longitud);

    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      setEditPosicion({ lat, lng });
    } else {
      setEditPosicion(POSICION_CAMPECHE);
    }

    const referencias = Array.isArray(cotizacion.imagenesProyecto)
      ? cotizacion.imagenesProyecto.filter(Boolean)
      : [];

    const cliente = Array.isArray(cotizacion.imagenesCliente)
      ? cotizacion.imagenesCliente.filter(Boolean)
      : [];

    setImagenesProyectoEdit(referencias);
    setImagenesClienteEdit(cliente);
    setNuevasImagenes([]);
    setErrorGeneral("");
    setEditarOpen(true);
  };

  const cerrarEdicion = () => {
    setEditarOpen(false);
    setCotizacionEditando(null);
    setNuevasImagenes([]);
    setErrorGeneral("");
  };

  const validarPasoEditar = () => {
    setErrorGeneral("");

    if (pasoEditar === 1) {
      if (!editNombre.trim()) {
        setErrorGeneral("Escribe el nombre del proyecto.");
        return false;
      }

      if (editDescripcion.trim().length < 10) {
        setErrorGeneral("La descripción debe tener al menos 10 caracteres.");
        return false;
      }
    }

    if (pasoEditar === 2) {
      if (!editUbicacion.trim()) {
        setErrorGeneral("Escribe o selecciona una ubicación.");
        return false;
      }
    }

    if (pasoEditar === 4) {
      const numero = editTelefono.replace(/\D/g, "");
      if (numero.length < 10) {
        setErrorGeneral("Escribe un teléfono válido.");
        return false;
      }
    }

    return true;
  };

  const siguienteEditar = () => {
    if (!validarPasoEditar()) return;

    if (pasoEditar < totalPasosEditar) {
      setPasoEditar((actual) => actual + 1);
      setErrorGeneral("");
    }
  };

  const anteriorEditar = () => {
    if (pasoEditar > 1) {
      setPasoEditar((actual) => actual - 1);
      setErrorGeneral("");
    }
  };

  const buscarDireccionEditar = async () => {
    if (!editUbicacion.trim()) {
      setErrorGeneral("Escribe una dirección.");
      return;
    }

    try {
      setBuscandoUbicacion(true);
      setErrorGeneral("");

      const params = new URLSearchParams({
        q: editUbicacion.trim(),
        format: "jsonv2",
        addressdetails: "1",
        limit: "1",
        countrycodes: "mx",
        "accept-language": "es",
      });

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error("Error buscando ubicación");
      }

      const resultados = await response.json();

      if (resultados.length === 0) {
        setErrorGeneral("No encontramos esa dirección.");
        return;
      }

      const resultado = resultados[0];

      setEditPosicion({
        lat: Number(resultado.lat),
        lng: Number(resultado.lon),
      });

      setEditUbicacion(resultado.display_name || editUbicacion);
    } catch (error) {
      console.error("Error buscando:", error);
      setErrorGeneral("No pudimos buscar esa ubicación.");
    } finally {
      setBuscandoUbicacion(false);
    }
  };

  const usarMiUbicacionEditar = () => {
    setErrorGeneral("");

    if (!navigator.geolocation) {
      setErrorGeneral("Tu navegador no permite obtener tu ubicación.");
      return;
    }

    setObteniendoGPS(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setEditPosicion({ lat, lng });

        try {
          const direccion = await obtenerDireccion(lat, lng);
          setEditUbicacion(direccion || `${lat}, ${lng}`);
        } catch {
          setEditUbicacion(`${lat}, ${lng}`);
        } finally {
          setObteniendoGPS(false);
        }
      },
      () => {
        setObteniendoGPS(false);
        setErrorGeneral("No pudimos obtener tu ubicación.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleNuevasImagenes = (e) => {
    setErrorGeneral("");

    const archivos = Array.from(e.target.files || []);
    const total =
      imagenesClienteEdit.length + nuevasImagenes.length + archivos.length;

    if (total > 6) {
      setErrorGeneral("Puedes tener máximo 6 fotografías propias.");
      e.target.value = "";
      return;
    }

    for (const file of archivos) {
      if (!file.type.startsWith("image/")) {
        setErrorGeneral("Solo puedes subir imágenes.");
        e.target.value = "";
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setErrorGeneral(`La imagen "${file.name}" supera los 5 MB.`);
        e.target.value = "";
        return;
      }
    }

    setNuevasImagenes((actuales) => [...actuales, ...archivos]);
    e.target.value = "";
  };

  const quitarImagenCliente = (indice) => {
    setImagenesClienteEdit((actuales) =>
      actuales.filter((_, i) => i !== indice)
    );
  };

  const quitarNuevaImagen = (indice) => {
    setNuevasImagenes((actuales) => actuales.filter((_, i) => i !== indice));
  };

  const subirImagen = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const cloudName =
      import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "dxj4iczvk";

    const uploadPreset =
      import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "macroservices";

    formData.append("upload_preset", uploadPreset);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error("No se pudo subir una imagen.");
    }

    const data = await response.json();

    if (!data.secure_url) {
      throw new Error("Cloudinary no devolvió una URL.");
    }

    return data.secure_url;
  };

  const guardarCambiosSolicitud = async () => {
    if (!cotizacionEditando) return;
    if (!validarPasoEditar()) return;

    try {
      setProcesando(true);
      setErrorGeneral("");

      let nuevasUrls = [];

      if (nuevasImagenes.length > 0) {
        nuevasUrls = await Promise.all(
          nuevasImagenes.map((file) => subirImagen(file))
        );
      }

      const imagenesClienteFinal = [
        ...new Set([...imagenesClienteEdit, ...nuevasUrls]),
      ];

      const todasLasImagenes = [
        ...new Set([...imagenesProyectoEdit, ...imagenesClienteFinal]),
      ];

      await updateDoc(doc(db, "cotizaciones", cotizacionEditando.id), {
        nombre: editNombre.trim(),
        descripcion: editDescripcion.trim(),
        tipo: editTipo,
        ubicacion: editUbicacion.trim(),
        latitud: editPosicion.lat,
        longitud: editPosicion.lng,
        medidas: editMedidas.trim(),
        fechaDeseada: editFechaDeseada || null,
        presupuestoEstimadoCliente:
          editPresupuesto !== "" ? Number(editPresupuesto) : null,
        telefono: editTelefono.trim(),
        metodoContacto: editMetodoContacto,
        imagenesProyecto: imagenesProyectoEdit,
        imagenesCliente: imagenesClienteFinal,
        imagenes: todasLasImagenes,
        imagen: todasLasImagenes[0] || null,
        solicitudModificadaCliente: true,
        fechaModificacionCliente: serverTimestamp(),
        fechaActualizacion: serverTimestamp(),
        vistoPorAdmin: false,
        vistoPorCliente: true,
        mensajeAdmin: "El cliente modificó su solicitud.",
        historial: arrayUnion(
          crearEventoHistorial(
            "solicitud_modificada",
            "Solicitud modificada",
            "Modificaste los datos de la solicitud."
          )
        ),
      });

      setEditarOpen(false);
      setCotizacionEditando(null);
      setNuevasImagenes([]);
      setMensajeGeneral("✅ La solicitud fue modificada correctamente.");
    } catch (error) {
      console.error("Error modificando solicitud:", error);
      setErrorGeneral("No se pudieron guardar los cambios.");
    } finally {
      setProcesando(false);
    }
  };

  /* ======================================================
     CANCELAR SOLICITUD
  ====================================================== */

  const cancelarSolicitud = async (cotizacion) => {
    if (!puedeCancelarSolicitud(cotizacion)) return;

    const confirmar = window.confirm(
      `¿Cancelar la solicitud "${cotizacion.nombre}"?\n\nMacro dejará de procesarla.`
    );

    if (!confirmar) return;

    try {
      setProcesando(true);

      await updateDoc(doc(db, "cotizaciones", cotizacion.id), {
        estado: "cancelada_cliente",
        respuestaCliente: "cancelada",
        fechaCancelacionCliente: serverTimestamp(),
        fechaActualizacion: serverTimestamp(),
        vistoPorAdmin: false,
        vistoPorCliente: true,
        mensajeAdmin: "El cliente canceló la solicitud.",
        historial: arrayUnion(
          crearEventoHistorial(
            "solicitud_cancelada",
            "Solicitud cancelada",
            "Cancelaste la solicitud antes de que el trabajo fuera confirmado."
          )
        ),
      });

      setMensajeGeneral("Solicitud cancelada.");
    } catch (error) {
      console.error("Error cancelando:", error);
      setErrorGeneral("No se pudo cancelar la solicitud.");
    } finally {
      setProcesando(false);
    }
  };

  /* ======================================================
     PROPUESTA
  ====================================================== */

  const moneda = (cantidad) => {
    if (cantidad === undefined || cantidad === null || cantidad === "") {
      return "Pendiente";
    }

    const numero = Number(cantidad);

    if (Number.isNaN(numero)) return String(cantidad);

    return numero.toLocaleString("es-MX", {
      style: "currency",
      currency: "MXN",
      maximumFractionDigits: 0,
    });
  };

  const obtenerPropuestaActual = (cotizacion) => {
    const propuesta = cotizacion?.propuestaActual || {};

    const precio =
      propuesta.precioTotal ??
      cotizacion?.precioTotal ??
      cotizacion?.presupuestoAdmin ??
      cotizacion?.total ??
      cotizacion?.precio ??
      cotizacion?.propuestaPrecio ??
      null;

    const porcentajeAnticipo =
      propuesta.porcentajeAnticipo ?? cotizacion?.porcentajeAnticipo ?? null;

    let anticipo =
      propuesta.anticipo ?? cotizacion?.anticipo ?? cotizacion?.montoAnticipo ?? null;

    if (anticipo === null && precio !== null && porcentajeAnticipo !== null) {
      anticipo = (Number(precio) * Number(porcentajeAnticipo)) / 100;
    }

    let saldo =
      propuesta.saldo ?? cotizacion?.saldo ?? cotizacion?.saldoPendiente ?? null;

    if (saldo === null && precio !== null && anticipo !== null) {
      saldo = Number(precio) - Number(anticipo);
    }

    return {
      version: propuesta.version ?? cotizacion?.versionPropuesta ?? 1,
      precioTotal: precio,
      porcentajeAnticipo,
      anticipo,
      saldo,
      tiempoEstimado:
        propuesta.tiempoEstimado ?? cotizacion?.tiempoEstimado ?? cotizacion?.tiempo ?? "",
      garantia: propuesta.garantia ?? cotizacion?.garantia ?? "",
      observaciones:
        propuesta.observaciones ??
        cotizacion?.observacionesAdmin ??
        cotizacion?.observaciones ??
        cotizacion?.detallesPropuesta ??
        cotizacion?.mensajePropuesta ??
        "",
      fecha:
        propuesta.fecha ??
        cotizacion?.fechaPropuesta ??
        cotizacion?.fechaActualizacion ??
        null,
    };
  };

  const confirmarPropuesta = async () => {
    if (!cotizacionSeleccionada) return;

    const propuesta = obtenerPropuestaActual(cotizacionSeleccionada);
    const precio = propuesta.precioTotal;

    const confirmar = window.confirm(
      `¿Aceptar la propuesta${precio ? ` por ${moneda(precio)}` : ""}?`
    );

    if (!confirmar) return;

    try {
      setProcesando(true);

      await updateDoc(doc(db, "cotizaciones", cotizacionSeleccionada.id), {
        estado: "aceptada_cliente",
        respuestaCliente: "aceptada",
        precioAceptado:
          precio !== undefined && precio !== null ? Number(precio) : null,
        versionAceptada: propuesta.version || 1,
        fechaRespuestaCliente: serverTimestamp(),
        fechaActualizacion: serverTimestamp(),
        vistoPorAdmin: false,
        vistoPorCliente: true,
        mensajeAdmin: "El cliente aceptó la propuesta.",
        historial: arrayUnion(
          crearEventoHistorial(
            "propuesta_aceptada",
            "Propuesta aceptada",
            precio
              ? `Aceptaste la propuesta por ${moneda(precio)}.`
              : "Aceptaste la propuesta de Macro."
          )
        ),
      });

      window.alert("✅ Propuesta aceptada.");
    } catch (error) {
      console.error("Error aceptando:", error);
    } finally {
      setProcesando(false);
    }
  };

  const solicitarModificacion = async () => {
    if (!cotizacionSeleccionada) return;

    const motivo = window.prompt("Describe qué deseas modificar:");
    if (motivo === null || !motivo.trim()) return;

    try {
      setProcesando(true);

      await updateDoc(doc(db, "cotizaciones", cotizacionSeleccionada.id), {
        estado: "cambios_solicitados",
        respuestaCliente: "solicita_modificacion",
        mensajeCliente: motivo.trim(),
        fechaRespuestaCliente: serverTimestamp(),
        fechaActualizacion: serverTimestamp(),
        vistoPorAdmin: false,
        vistoPorCliente: true,
        mensajeAdmin: "El cliente solicitó cambios.",
        historial: arrayUnion(
          crearEventoHistorial(
            "cambios_solicitados",
            "Cambios solicitados",
            motivo.trim()
          )
        ),
      });

      window.alert("Solicitud de cambios enviada.");
    } catch (error) {
      console.error(error);
    } finally {
      setProcesando(false);
    }
  };

  const rechazarPropuesta = async () => {
    if (!cotizacionSeleccionada) return;

    const confirmar = window.confirm(
      "¿Seguro que deseas rechazar esta propuesta?"
    );
    if (!confirmar) return;

    try {
      setProcesando(true);

      await updateDoc(doc(db, "cotizaciones", cotizacionSeleccionada.id), {
        estado: "rechazada_cliente",
        respuestaCliente: "rechazada",
        fechaRespuestaCliente: serverTimestamp(),
        fechaActualizacion: serverTimestamp(),
        vistoPorAdmin: false,
        vistoPorCliente: true,
        mensajeAdmin: "El cliente rechazó la propuesta.",
        historial: arrayUnion(
          crearEventoHistorial(
            "propuesta_rechazada",
            "Propuesta rechazada",
            "Rechazaste la propuesta de Macro."
          )
        ),
      });

      window.alert("Propuesta rechazada.");
    } catch (error) {
      console.error(error);
    } finally {
      setProcesando(false);
    }
  };

  /* ======================================================
     GALERÍA
  ====================================================== */

  const abrirGaleria = (imagenes, indiceInicial = 0) => {
    const lista = Array.isArray(imagenes)
      ? imagenes.filter(Boolean)
      : imagenes
      ? [imagenes]
      : [];

    if (lista.length === 0) return;

    setImgs(lista);
    setIndex(indiceInicial);
    setGaleriaOpen(true);
  };

  const siguienteImagen = () => {
    setIndex((actual) => (actual + 1 >= imgs.length ? 0 : actual + 1));
  };

  const anteriorImagen = () => {
    setIndex((actual) => (actual === 0 ? imgs.length - 1 : actual - 1));
  };

  /* ======================================================
     FECHAS
  ====================================================== */

  const formatearFecha = (fecha) => {
    if (!fecha) return "";

    try {
      if (fecha.toDate) return fecha.toDate().toLocaleString("es-MX");
      return new Date(fecha).toLocaleString("es-MX");
    } catch {
      return "";
    }
  };

  const formatearFechaCorta = (fecha) => {
    if (!fecha) return "Sin fecha";

    try {
      const date = fecha.toDate ? fecha.toDate() : new Date(fecha);
      if (Number.isNaN(date.getTime())) return "Sin fecha";

      return date.toLocaleDateString("es-MX", {
        day: "numeric",
        month: "numeric",
        year: "numeric",
      });
    } catch {
      return "Sin fecha";
    }
  };

  const porcentajeEditar =
    ((pasoEditar - 1) / (totalPasosEditar - 1)) * 100;

  /* ======================================================
     LOADING
  ====================================================== */

  if (cargando) {
    return (
      <div className={`${theme.page} flex items-center justify-center p-8`}>
        <div className="text-center">
          <div className="w-14 h-14 rounded-full border-4 border-sky-200 border-t-sky-500 animate-spin mx-auto" />
          <p className={`${theme.muted} mt-4 font-medium`}>
            Cargando solicitudes...
          </p>
        </div>
      </div>
    );
  }

  /* ======================================================
     RENDER
  ====================================================== */

  return (
    <div className={`${theme.page} px-4 md:px-6 py-6 md:py-8`}>
      <div className={`${theme.shell} space-y-6`}>
        {solicitudes.length > 0 && (
          <section
            className={`${theme.card} ${theme.hero} rounded-[28px] p-5 md:p-7 overflow-hidden relative`}
          >
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.12),transparent_35%)]" />

            <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
              <div>
                <p className="text-sky-500 text-xs font-extrabold uppercase tracking-[0.3em]">
                  Macro · Mis solicitudes
                </p>

                <h1
                  className={`mt-3 text-3xl md:text-4xl font-black ${theme.title}`}
                >
                  Gestiona tus cotizaciones
                </h1>

                <p className={`${theme.muted} mt-3 max-w-2xl`}>
                  Consulta el estado de tus solicitudes, revisa propuestas,
                  solicita cambios y mantén actualizada tu información.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full lg:w-auto lg:min-w-[520px]">
                <MiniStat
                  theme={theme}
                  label="Solicitudes"
                  value={solicitudes.length}
                  icon={<FaMoneyBillWave />}
                />

                <MiniStat
                  theme={theme}
                  label="Novedades"
                  value={cantidadNuevas}
                  icon={<FaBell />}
                  accent={cantidadNuevas > 0}
                />

                <MiniStat
                  theme={theme}
                  label="Selección"
                  value={modoSeleccion ? seleccionadas.length : 0}
                  icon={<FaCheckSquare />}
                />

                <MiniStat
                  theme={theme}
                  label="Macro"
                  value="Activo"
                  icon={<FaCheckCircle />}
                />
              </div>
            </div>
          </section>
        )}

        {solicitudes.length > 0 && (
          <section className={`${theme.card} rounded-[26px] p-4 md:p-5`}>
            <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
              <div>
                <h2 className={`text-lg md:text-xl font-black ${theme.title}`}>
                  {modoSeleccion
                    ? `${seleccionadas.length} seleccionada${
                        seleccionadas.length === 1 ? "" : "s"
                      }`
                    : `${solicitudes.length} solicitud${
                        solicitudes.length === 1 ? "" : "es"
                      }`}
                </h2>

                <p className={`${theme.muted} text-sm mt-1`}>
                  {modoSeleccion
                    ? "Selecciona las solicitudes que quieres quitar de tu panel."
                    : "Tu panel de seguimiento personal de cotizaciones."}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {modoSeleccion && (
                  <button
                    type="button"
                    onClick={seleccionarTodas}
                    className={`rounded-2xl px-4 py-3 font-semibold text-sm flex items-center gap-2 transition ${theme.secondaryBtn}`}
                  >
                    {todasSeleccionadas ? (
                      <FaCheckSquare className="text-sky-500" />
                    ) : (
                      <FaSquare />
                    )}
                    {todasSeleccionadas ? "Quitar todas" : "Seleccionar todas"}
                  </button>
                )}

                {modoSeleccion && seleccionadas.length > 0 && (
                  <button
                    type="button"
                    onClick={eliminarSeleccionadas}
                    disabled={procesando}
                    className={`rounded-2xl px-4 py-3 font-bold text-sm flex items-center gap-2 transition disabled:opacity-60 ${theme.dangerBtn}`}
                  >
                    <FaTrashAlt />
                    Eliminar seleccionadas
                    <span className="px-2 py-0.5 rounded-full bg-white/70 text-xs">
                      {seleccionadas.length}
                    </span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={alternarModoSeleccion}
                  className={`rounded-2xl px-5 py-3 font-bold text-sm flex items-center gap-2 transition ${
                    modoSeleccion ? theme.primaryBtn : theme.secondaryBtn
                  }`}
                >
                  {modoSeleccion ? <FaTimes /> : <FaCheckSquare />}
                  {modoSeleccion ? "Terminar selección" : "Seleccionar"}
                </button>
              </div>
            </div>
          </section>
        )}

        {mensajeGeneral && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700 flex items-center gap-3">
            <FaCheckCircle />
            <span>{mensajeGeneral}</span>
          </div>
        )}

        {errorGeneral && !editarOpen && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            {errorGeneral}
          </div>
        )}

        {cantidadNuevas > 0 && !modoSeleccion && (
          <div className="rounded-[24px] border border-sky-200 bg-sky-50 p-5 flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white text-sky-500 border border-sky-200 flex items-center justify-center text-xl shrink-0">
              <FaBell />
            </div>

            <div>
              <p className={`font-black ${theme.title}`}>
                {cantidadNuevas === 1
                  ? "Tienes una actualización"
                  : `Tienes ${cantidadNuevas} actualizaciones`}
              </p>

              <p className={`${theme.text} mt-1`}>
                Macro realizó cambios en tus solicitudes. Entra a revisar los
                detalles.
              </p>
            </div>
          </div>
        )}

        {solicitudes.length === 0 ? (
          <div className={`${theme.card} rounded-[30px] p-10 md:p-14 text-center`}>
            <div className="w-20 h-20 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center mx-auto text-3xl">
              <FaMoneyBillWave />
            </div>

            <h2 className={`text-2xl font-black mt-5 ${theme.title}`}>
              Aún no tienes solicitudes
            </h2>

            <p className={`${theme.muted} mt-2`}>
              Tus solicitudes aparecerán aquí cuando envíes una cotización.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {solicitudes.map((cotizacion) => {
              const imagenes =
                Array.isArray(cotizacion.imagenes) &&
                cotizacion.imagenes.length > 0
                  ? cotizacion.imagenes
                  : cotizacion.imagen
                  ? [cotizacion.imagen]
                  : [];

              const estado = obtenerEstado(cotizacion.estado);
              const mensajeEstado = obtenerMensajeEstado(cotizacion);
              const seleccionada = seleccionadas.includes(cotizacion.id);
              const editable = puedeEditarSolicitud(cotizacion);
              const cancelable = puedeCancelarSolicitud(cotizacion);
              const propuesta = obtenerPropuestaActual(cotizacion);
              const precio = propuesta.precioTotal;

              return (
                <article
                  key={cotizacion.id}
                  onClick={() => {
                    if (modoSeleccion) seleccionarCotizacion(cotizacion.id);
                  }}
                  className={`${theme.card} rounded-[28px] overflow-hidden transition-all duration-300 ${
                    modoSeleccion ? "cursor-pointer" : ""
                  } ${seleccionada ? "ring-2 ring-sky-400 border-sky-400" : ""} ${
                    tieneNovedad(cotizacion) ? "ring-1 ring-sky-200" : ""
                  } ${
                    cotizacion.estado === "cancelada_cliente" ? "opacity-85" : ""
                  }`}
                >
                  <div className="relative h-56 bg-gradient-to-br from-slate-100 via-sky-50 to-white border-b border-slate-200">
                    {modoSeleccion && (
                      <div className="absolute top-4 left-4 z-20">
                        <div
                          className={`w-12 h-12 rounded-2xl border shadow-lg flex items-center justify-center ${
                            seleccionada
                              ? "bg-sky-500 border-sky-500 text-white"
                              : "bg-white/95 border-slate-200 text-slate-500"
                          }`}
                        >
                          {seleccionada ? <FaCheck /> : <FaSquare />}
                        </div>
                      </div>
                    )}

                    {tieneNovedad(cotizacion) && !modoSeleccion && (
                      <div className="absolute top-4 left-4 z-10 px-3 py-1 rounded-full bg-red-500 text-white text-xs font-black uppercase tracking-wide">
                        Nuevo
                      </div>
                    )}

                    {imagenes.length > 0 ? (
                      <img
                        src={imagenes[0]}
                        alt={cotizacion.nombre || "Cotización Macro"}
                        onClick={(e) => {
                          e.stopPropagation();

                          if (modoSeleccion) {
                            seleccionarCotizacion(cotizacion.id);
                            return;
                          }

                          abrirGaleria(imagenes);
                        }}
                        className="w-full h-full object-cover cursor-pointer"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                        <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-2xl text-sky-500">
                          <FaImages />
                        </div>
                        <p className="mt-4 font-semibold">Sin imagen</p>
                      </div>
                    )}

                    {imagenes.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          abrirGaleria(imagenes);
                        }}
                        className="absolute bottom-4 right-4 px-3 py-2 rounded-xl bg-white/95 border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-2 shadow"
                      >
                        <FaImages className="text-sky-500" />
                        {imagenes.length} fotos
                      </button>
                    )}
                  </div>

                  <div className="p-5 md:p-6">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className={`text-xl font-black ${theme.title}`}>
                        {cotizacion.nombre || "Cotización"}
                      </h2>

                      <span
                        className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 ${estado.clase}`}
                      >
                        {estado.texto}
                      </span>
                    </div>

                    {cotizacion.descripcion && (
                      <p className={`${theme.text} text-sm leading-relaxed mt-4 min-h-[64px]`}>
                        {cotizacion.descripcion.length > 160
                          ? `${cotizacion.descripcion.slice(0, 160)}...`
                          : cotizacion.descripcion}
                      </p>
                    )}

                    <div className="flex items-center gap-2 mt-4 text-sm text-slate-500">
                      <FaCalendarAlt className="text-sky-500" />
                      {formatearFechaCorta(cotizacion.fecha)}
                    </div>

                    {mensajeEstado && !modoSeleccion && (
                      <div className={`mt-5 rounded-2xl p-4 ${mensajeEstado.clase}`}>
                        <div className="flex items-start gap-3">
                          <div className="text-xl mt-0.5">
                            {mensajeEstado.icono}
                          </div>

                          <div>
                            <p className="font-black text-sm">
                              {mensajeEstado.titulo}
                            </p>
                            <p className="text-sm mt-1 opacity-90">
                              {mensajeEstado.texto}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {precio !== undefined && precio !== null && !modoSeleccion && (
                      <div className={`${theme.cardSoft} rounded-2xl p-4 mt-5`}>
                        <p className="text-xs uppercase tracking-[0.18em] font-black text-sky-600">
                          Propuesta actual
                        </p>

                        <p className={`text-2xl font-black mt-2 ${theme.title}`}>
                          {moneda(precio)}
                        </p>
                      </div>
                    )}

                    {!modoSeleccion && (editable || cancelable) && (
                      <div className="grid grid-cols-2 gap-3 mt-5">
                        {editable && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              abrirEdicion(cotizacion);
                            }}
                            className="rounded-2xl py-3.5 font-bold flex items-center justify-center gap-2 border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
                          >
                            <FaEdit />
                            Modificar
                          </button>
                        )}

                        {cancelable && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              cancelarSolicitud(cotizacion);
                            }}
                            className="rounded-2xl py-3.5 font-bold flex items-center justify-center gap-2 border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition"
                          >
                            <FaTimesCircle />
                            Cancelar
                          </button>
                        )}
                      </div>
                    )}

                    {!modoSeleccion && (
                      <div className="grid grid-cols-2 gap-3 mt-4">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            abrirHistorial(cotizacion);
                          }}
                          className={`rounded-2xl py-3.5 font-bold flex items-center justify-center gap-2 transition ${theme.secondaryBtn}`}
                        >
                          <FaHistory className="text-sky-500" />
                          Historial
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            verPropuesta(cotizacion);
                          }}
                          className={`rounded-2xl py-3.5 font-bold flex items-center justify-center gap-2 transition ${theme.primaryBtn}`}
                        >
                          <FaEye />
                          Ver detalles
                        </button>
                      </div>
                    )}

                    {modoSeleccion && (
                      <div
                        className={`mt-5 rounded-2xl p-3 text-center text-sm font-bold border ${
                          seleccionada
                            ? "bg-sky-50 text-sky-700 border-sky-200"
                            : "bg-slate-50 text-slate-500 border-slate-200"
                        }`}
                      >
                        {seleccionada ? "✓ Seleccionada" : "Seleccionar"}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* =================================================
          MODAL EDITAR
      ================================================= */}

      {editarOpen && cotizacionEditando && (
        <ModalOverlay onClose={cerrarEdicion} theme={theme} z="z-[100]">
          <div className={`${theme.card} w-full max-w-5xl rounded-[30px] overflow-hidden`}>
            <header className={`p-6 md:p-8 border-b ${theme.line} relative`}>
              <button
                type="button"
                onClick={cerrarEdicion}
                className={`absolute right-6 top-6 w-11 h-11 rounded-2xl flex items-center justify-center transition ${theme.secondaryBtn}`}
              >
                <FaTimes />
              </button>

              <p className="text-sky-500 text-xs uppercase tracking-[0.3em] font-extrabold">
                Macro
              </p>

              <h1
                className={`text-3xl md:text-4xl font-black mt-3 pr-14 ${theme.title}`}
              >
                Modificar solicitud
              </h1>

              <p className={`${theme.muted} mt-3 max-w-2xl`}>
                Actualiza la información de tu solicitud con una interfaz más
                clara y ordenada.
              </p>

              <div className="mt-8">
                <div className="flex justify-between text-xs sm:text-sm mb-3">
                  <span className={pasoEditar >= 1 ? "text-sky-500 font-bold" : theme.muted}>
                    Proyecto
                  </span>
                  <span className={pasoEditar >= 2 ? "text-sky-500 font-bold" : theme.muted}>
                    Detalles
                  </span>
                  <span className={pasoEditar >= 3 ? "text-sky-500 font-bold" : theme.muted}>
                    Imágenes
                  </span>
                  <span className={pasoEditar >= 4 ? "text-sky-500 font-bold" : theme.muted}>
                    Confirmar
                  </span>
                </div>

                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-sky-500 rounded-full transition-all duration-300"
                    style={{ width: `${porcentajeEditar}%` }}
                  />
                </div>

                <p className={`${theme.muted} text-xs mt-2`}>
                  Paso {pasoEditar} de {totalPasosEditar}
                </p>
              </div>
            </header>

            <div className="p-6 sm:p-8 md:p-10">
              {errorGeneral && (
                <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
                  {errorGeneral}
                </div>
              )}

              {pasoEditar === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className={`text-2xl font-black ${theme.title}`}>
                      Actualiza tu proyecto
                    </h2>
                    <p className={`${theme.muted} mt-1`}>
                      Modifica la información principal de tu solicitud.
                    </p>
                  </div>

                  {imagenesProyectoEdit.length > 0 && (
                    <div>
                      <div className={`flex items-center gap-2 text-sm mb-3 ${theme.muted}`}>
                        <FaImages className="text-sky-500" />
                        Referencia seleccionada
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {imagenesProyectoEdit.map((imagen, indice) => (
                          <div
                            key={`${imagen}-${indice}`}
                            className="aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200"
                          >
                            <img
                              src={imagen}
                              alt={`Referencia ${indice + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <FieldBlock label="Nombre del proyecto" icon={<FaPen />} theme={theme}>
                    <input
                      type="text"
                      value={editNombre}
                      onChange={(e) => setEditNombre(e.target.value)}
                      className={`${theme.input} px-4 py-3.5`}
                    />
                  </FieldBlock>

                  <FieldBlock label="Tipo de solución" icon={<FaTag />} theme={theme}>
                    <select
                      value={editTipo}
                      onChange={(e) => setEditTipo(e.target.value)}
                      className={`${theme.input} px-4 py-3.5`}
                    >
                      {TIPOS_SOLUCION.map((tipo) => (
                        <option key={tipo} value={tipo}>
                          {tipo}
                        </option>
                      ))}
                    </select>
                  </FieldBlock>

                  <FieldBlock label="¿Qué necesitas realizar?" icon={<FaPen />} theme={theme}>
                    <textarea
                      rows={6}
                      value={editDescripcion}
                      onChange={(e) => setEditDescripcion(e.target.value)}
                      maxLength={1000}
                      className={`${theme.input} px-4 py-3.5 resize-none`}
                    />
                    <p className={`text-xs text-right mt-2 ${theme.muted}`}>
                      {editDescripcion.length}/1000
                    </p>
                  </FieldBlock>
                </div>
              )}

              {pasoEditar === 2 && (
                <div className="space-y-7">
                  <div>
                    <h2 className={`text-2xl font-black ${theme.title}`}>
                      Detalles de tu proyecto
                    </h2>
                    <p className={`${theme.muted} mt-1`}>
                      Ubicación, alcance, fecha deseada y presupuesto aproximado.
                    </p>
                  </div>

                  <div className="grid lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <FieldBlock
                        label="Dirección o referencia"
                        icon={<FaMapMarkerAlt />}
                        theme={theme}
                      >
                        <div className="flex gap-2">
                          <input
                            value={editUbicacion}
                            onChange={(e) => setEditUbicacion(e.target.value)}
                            className={`${theme.input} px-4 py-3.5`}
                          />

                          <button
                            type="button"
                            onClick={buscarDireccionEditar}
                            disabled={buscandoUbicacion}
                            className={`px-5 rounded-2xl flex items-center justify-center transition disabled:opacity-60 ${theme.primaryBtn}`}
                          >
                            <FaSearch />
                          </button>
                        </div>
                      </FieldBlock>

                      <button
                        type="button"
                        onClick={usarMiUbicacionEditar}
                        disabled={obteniendoGPS}
                        className={`w-full rounded-2xl px-4 py-3.5 font-semibold flex items-center justify-center gap-2 transition disabled:opacity-60 ${theme.secondaryBtn}`}
                      >
                        <FaCrosshairs className="text-sky-500" />
                        {obteniendoGPS
                          ? "Obteniendo ubicación..."
                          : "Usar mi ubicación actual"}
                      </button>

                      <div className={`${theme.cardSoft} rounded-2xl p-4`}>
                        <p className={`text-xs uppercase tracking-[0.18em] font-bold ${theme.muted}`}>
                          Coordenadas
                        </p>

                        <div className="grid grid-cols-2 gap-4 mt-3">
                          <div>
                            <p className={`text-xs ${theme.muted}`}>Latitud</p>
                            <p className={`text-sm font-semibold ${theme.title}`}>
                              {editPosicion.lat.toFixed(6)}
                            </p>
                          </div>

                          <div>
                            <p className={`text-xs ${theme.muted}`}>Longitud</p>
                            <p className={`text-sm font-semibold ${theme.title}`}>
                              {editPosicion.lng.toFixed(6)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-3xl overflow-hidden border border-slate-300 bg-white">
                      <MapContainer
                        center={[editPosicion.lat, editPosicion.lng]}
                        zoom={15}
                        scrollWheelZoom
                        style={{ height: "390px", width: "100%" }}
                      >
                        <TileLayer
                          attribution="&copy; OpenStreetMap contributors"
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        <RecentrarMapa posicion={editPosicion} />

                        <SelectorUbicacionEditar
                          posicion={editPosicion}
                          setPosicion={setEditPosicion}
                          setUbicacion={setEditUbicacion}
                          setError={setErrorGeneral}
                        />
                      </MapContainer>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-5">
                    <FieldBlock
                      label="Alcance o información técnica"
                      icon={<FaRulerCombined />}
                      theme={theme}
                    >
                      <input
                        value={editMedidas}
                        onChange={(e) => setEditMedidas(e.target.value)}
                        placeholder="Ej: 1.20 x 2 m"
                        className={`${theme.input} px-4 py-3.5`}
                      />
                    </FieldBlock>

                    <FieldBlock label="Fecha deseada" icon={<FaCalendarAlt />} theme={theme}>
                      <input
                        type="date"
                        value={editFechaDeseada}
                        onChange={(e) => setEditFechaDeseada(e.target.value)}
                        className={`${theme.input} px-4 py-3.5`}
                      />
                    </FieldBlock>
                  </div>

                  <FieldBlock label="Presupuesto aproximado" icon={<FaDollarSign />} theme={theme}>
                    <input
                      type="number"
                      min={0}
                      value={editPresupuesto}
                      onChange={(e) => setEditPresupuesto(e.target.value)}
                      className={`${theme.input} px-4 py-3.5`}
                    />
                  </FieldBlock>
                </div>
              )}

              {pasoEditar === 3 && (
                <div className="space-y-8">
                  <div>
                    <h2 className={`text-2xl font-black ${theme.title}`}>
                      Imágenes
                    </h2>
                    <p className={`${theme.muted} mt-1`}>
                      Conserva, elimina o agrega fotografías de tu proyecto.
                    </p>
                  </div>

                  {imagenesProyectoEdit.length > 0 && (
                    <section>
                      <div className="flex items-center gap-2">
                        <FaImages className="text-sky-500" />
                        <h3 className={`font-black ${theme.title}`}>
                          Referencia seleccionada
                        </h3>
                      </div>

                      <p className={`${theme.muted} text-xs mt-1`}>
                        Estas imágenes pertenecen a la referencia original y se
                        conservan.
                      </p>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                        {imagenesProyectoEdit.map((imagen, indice) => (
                          <div
                            key={`${imagen}-${indice}`}
                            className="aspect-square rounded-2xl overflow-hidden border border-slate-200 bg-slate-100"
                          >
                            <img
                              src={imagen}
                              alt="Referencia"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {imagenesClienteEdit.length > 0 && (
                    <section>
                      <div className="flex items-center gap-2">
                        <FaCamera className="text-blue-500" />
                        <h3 className={`font-black ${theme.title}`}>
                          Fotografías de tu espacio
                        </h3>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                        {imagenesClienteEdit.map((imagen, indice) => (
                          <div
                            key={`${imagen}-${indice}`}
                            className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 bg-slate-100"
                          >
                            <img
                              src={imagen}
                              alt="Cliente"
                              className="w-full h-full object-cover"
                            />

                            <button
                              type="button"
                              onClick={() => quitarImagenCliente(indice)}
                              className="absolute top-2 right-2 w-9 h-9 bg-white/90 hover:bg-red-500 hover:text-white text-slate-700 rounded-full flex items-center justify-center transition"
                            >
                              <FaTimes />
                            </button>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  <label
                    htmlFor="nuevasFotosCotizacion"
                    className="block border-2 border-dashed border-sky-300 hover:border-sky-500 rounded-[28px] p-10 text-center cursor-pointer transition bg-sky-50"
                  >
                    <FaCloudUploadAlt className="text-sky-500 text-4xl mx-auto" />
                    <p className={`font-black mt-3 ${theme.title}`}>
                      Agregar fotografías
                    </p>
                    <p className={`${theme.muted} text-sm mt-2`}>
                      Máximo 6 fotografías propias.
                    </p>

                    <input
                      id="nuevasFotosCotizacion"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleNuevasImagenes}
                      className="hidden"
                    />
                  </label>

                  {previewsNuevos.length > 0 && (
                    <div>
                      <h3 className={`text-sm mb-3 ${theme.muted}`}>
                        Nuevas fotografías
                      </h3>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {previewsNuevos.map((preview, indice) => (
                          <div
                            key={`${preview.file.name}-${indice}`}
                            className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 bg-slate-100"
                          >
                            <img
                              src={preview.url}
                              alt="Nueva"
                              className="w-full h-full object-cover"
                            />

                            <button
                              type="button"
                              onClick={() => quitarNuevaImagen(indice)}
                              className="absolute top-2 right-2 w-9 h-9 bg-white/90 hover:bg-red-500 hover:text-white text-slate-700 rounded-full flex items-center justify-center transition"
                            >
                              <FaTimes />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {pasoEditar === 4 && (
                <div className="space-y-7">
                  <div>
                    <h2 className={`text-2xl font-black ${theme.title}`}>
                      Confirma los cambios
                    </h2>
                    <p className={`${theme.muted} mt-1`}>
                      Revisa la información final antes de guardar.
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-5">
                    <FieldBlock label="Teléfono" icon={<FaPhone />} theme={theme}>
                      <input
                        type="tel"
                        value={editTelefono}
                        onChange={(e) => setEditTelefono(e.target.value)}
                        className={`${theme.input} px-4 py-3.5`}
                      />
                    </FieldBlock>

                    <FieldBlock
                      label="Medio de contacto"
                      icon={<FaWhatsapp />}
                      theme={theme}
                    >
                      <select
                        value={editMetodoContacto}
                        onChange={(e) => setEditMetodoContacto(e.target.value)}
                        className={`${theme.input} px-4 py-3.5`}
                      >
                        <option>WhatsApp</option>
                        <option>Teléfono</option>
                        <option>Correo electrónico</option>
                      </select>
                    </FieldBlock>
                  </div>

                  <div className={`${theme.cardSoft} rounded-[26px] p-6`}>
                    <p className="text-sky-500 text-xs uppercase tracking-[0.25em] font-extrabold">
                      Resumen actualizado
                    </p>

                    <h3 className={`text-xl font-black mt-2 ${theme.title}`}>
                      {editNombre}
                    </h3>

                    <div className="space-y-4 mt-6">
                      <ResumenItem titulo="Tipo" valor={editTipo} theme={theme} />
                      <ResumenItem
                        titulo="Descripción"
                        valor={editDescripcion}
                        theme={theme}
                      />
                      <ResumenItem
                        titulo="Ubicación"
                        valor={editUbicacion}
                        theme={theme}
                      />
                      <ResumenItem
                        titulo="Medidas"
                        valor={editMedidas || "No especificadas"}
                        theme={theme}
                      />
                      <ResumenItem
                        titulo="Fecha"
                        valor={editFechaDeseada || "Sin fecha"}
                        theme={theme}
                      />
                      <ResumenItem
                        titulo="Presupuesto"
                        valor={
                          editPresupuesto
                            ? `$${Number(editPresupuesto).toLocaleString(
                                "es-MX"
                              )} MXN`
                            : "No especificado"
                        }
                        theme={theme}
                      />
                      <ResumenItem
                        titulo="Imágenes de referencia"
                        valor={imagenesProyectoEdit.length}
                        theme={theme}
                      />
                      <ResumenItem
                        titulo="Fotos propias"
                        valor={imagenesClienteEdit.length + nuevasImagenes.length}
                        theme={theme}
                      />
                      <ResumenItem
                        titulo="Contacto"
                        valor={`${editTelefono} · ${editMetodoContacto}`}
                        theme={theme}
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-slate-700">
                    Macro recibirá una notificación indicando que modificaste
                    esta solicitud.
                  </div>
                </div>
              )}

              <div className={`flex flex-col-reverse sm:flex-row justify-between gap-3 mt-10 pt-6 border-t ${theme.line}`}>
                {pasoEditar > 1 ? (
                  <button
                    type="button"
                    onClick={anteriorEditar}
                    disabled={procesando}
                    className={`rounded-2xl px-6 py-4 font-bold flex items-center justify-center gap-2 transition ${theme.secondaryBtn}`}
                  >
                    <FaArrowLeft />
                    Anterior
                  </button>
                ) : (
                  <div />
                )}

                {pasoEditar < totalPasosEditar && (
                  <button
                    type="button"
                    onClick={siguienteEditar}
                    className={`rounded-2xl px-8 py-4 font-black flex items-center justify-center gap-2 transition ${theme.primaryBtn}`}
                  >
                    Continuar
                    <FaArrowRight />
                  </button>
                )}

                {pasoEditar === totalPasosEditar && (
                  <button
                    type="button"
                    onClick={guardarCambiosSolicitud}
                    disabled={procesando}
                    className={`rounded-2xl px-8 py-4 font-black flex items-center justify-center gap-2 transition disabled:opacity-60 ${theme.primaryBtn}`}
                  >
                    <FaSave />
                    {procesando ? "Guardando..." : "Guardar cambios"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* =================================================
          MODAL DETALLES
      ================================================= */}

      {propuestaOpen && cotizacionSeleccionada && (
        <ModalOverlay
          onClose={() => setPropuestaOpen(false)}
          theme={theme}
          z="z-[90]"
        >
          <div
            className={`${theme.card} w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-[30px]`}
          >
            {(() => {
              const c = cotizacionSeleccionada;
              const estado = obtenerEstado(c.estado);
              const propuesta = obtenerPropuestaActual(c);
              const precio = propuesta.precioTotal;
              const puedeResponder = ESTADOS_RESPUESTA_PROPUESTA.includes(
                c.estado
              );

              return (
                <>
                  <header
                    className={`p-6 md:p-8 border-b ${theme.line} flex justify-between gap-4`}
                  >
                    <div>
                      <p className="text-sky-500 text-xs uppercase tracking-[0.25em] font-extrabold">
                        Cotización Macro
                      </p>

                      <h2
                        className={`text-3xl font-black mt-2 ${theme.title}`}
                      >
                        {c.nombre}
                      </h2>

                      <span
                        className={`inline-block mt-3 px-3 py-1 rounded-full text-xs font-bold ${estado.clase}`}
                      >
                        {estado.texto}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setPropuestaOpen(false)}
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center transition ${theme.secondaryBtn}`}
                    >
                      <FaTimes />
                    </button>
                  </header>

                  <div className="p-6 md:p-8">
                    <div className={`${theme.cardSoft} rounded-2xl p-5`}>
                      <p
                        className={`text-xs uppercase tracking-[0.18em] font-bold ${theme.muted}`}
                      >
                        Tu solicitud
                      </p>

                      <p className={`${theme.text} mt-3 whitespace-pre-line`}>
                        {c.descripcion}
                      </p>
                    </div>

                    {puedeEditarSolicitud(c) && (
                      <div className="grid md:grid-cols-2 gap-3 mt-5">
                        <button
                          type="button"
                          onClick={() => {
                            setPropuestaOpen(false);
                            abrirEdicion(c);
                          }}
                          className="rounded-2xl py-4 font-bold flex items-center justify-center gap-2 border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
                        >
                          <FaEdit />
                          Modificar solicitud
                        </button>

                        <button
                          type="button"
                          onClick={() => cancelarSolicitud(c)}
                          className="rounded-2xl py-4 font-bold flex items-center justify-center gap-2 border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition"
                        >
                          <FaTimesCircle />
                          Cancelar solicitud
                        </button>
                      </div>
                    )}

                    {precio !== undefined && precio !== null && (
                      <section className="mt-6">
                        <div className="mb-4">
                          <p className="text-xs uppercase tracking-[0.2em] text-sky-500 font-black">
                            Propuesta de Macro
                          </p>

                          <p className={`${theme.muted} text-sm mt-1`}>
                            Versión {propuesta.version}
                          </p>
                        </div>

                        <div className="grid sm:grid-cols-3 gap-4">
                          <SummaryCard
                            title="Precio total"
                            value={moneda(propuesta.precioTotal)}
                            theme={theme}
                          />

                          <SummaryCard
                            title="Anticipo"
                            value={moneda(propuesta.anticipo)}
                            caption={
                              propuesta.porcentajeAnticipo !== null
                                ? `${propuesta.porcentajeAnticipo}% del total`
                                : ""
                            }
                            theme={theme}
                          />

                          <SummaryCard
                            title="Saldo"
                            value={moneda(propuesta.saldo)}
                            theme={theme}
                          />
                        </div>

                        <div className="grid md:grid-cols-2 gap-4 mt-4">
                          <SummaryCard
                            title="Tiempo estimado"
                            value={propuesta.tiempoEstimado || "No especificado"}
                            theme={theme}
                          />

                          <SummaryCard
                            title="Garantía"
                            value={propuesta.garantia || "No especificada"}
                            theme={theme}
                          />
                        </div>

                        {propuesta.observaciones && (
                          <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 p-5">
                            <p className="text-xs uppercase tracking-[0.18em] text-sky-600 font-black">
                              Observaciones de Macro
                            </p>

                            <p className="text-slate-700 mt-3 whitespace-pre-wrap leading-relaxed">
                              {propuesta.observaciones}
                            </p>
                          </div>
                        )}

                        {propuesta.fecha && (
                          <p className={`${theme.muted} text-xs mt-4`}>
                            Actualizada: {formatearFecha(propuesta.fecha)}
                          </p>
                        )}
                      </section>
                    )}

                    {puedeResponder && (
                      <div className={`mt-8 pt-6 border-t ${theme.line}`}>
                        <h3 className={`text-xl font-black ${theme.title}`}>
                          ¿Qué deseas hacer?
                        </h3>

                        <button
                          type="button"
                          onClick={confirmarPropuesta}
                          disabled={procesando}
                          className={`w-full rounded-2xl mt-5 py-4 font-black flex items-center justify-center gap-2 transition disabled:opacity-60 ${theme.successBtn}`}
                        >
                          <FaCheckCircle />
                          Aceptar propuesta
                        </button>

                        <div className="grid md:grid-cols-2 gap-3 mt-3">
                          <button
                            type="button"
                            onClick={solicitarModificacion}
                            className={`rounded-2xl py-4 font-bold transition ${theme.warningBtn}`}
                          >
                            Solicitar modificación
                          </button>

                          <button
                            type="button"
                            onClick={rechazarPropuesta}
                            className={`rounded-2xl py-4 font-bold transition ${theme.dangerBtn}`}
                          >
                            Rechazar propuesta
                          </button>
                        </div>
                      </div>
                    )}

                    {Array.isArray(c.historialPropuestas) &&
                      c.historialPropuestas.length > 0 && (
                        <div className={`mt-8 pt-6 border-t ${theme.line}`}>
                          <div className="flex items-center gap-2">
                            <FaHistory className="text-sky-500" />
                            <h3 className={`font-black ${theme.title}`}>
                              Historial de propuestas
                            </h3>
                          </div>

                          <div className="space-y-3 mt-4">
                            {c.historialPropuestas.map((propuestaHist, indice) => (
                              <div
                                key={indice}
                                className={`${theme.cardSoft} rounded-2xl p-4`}
                              >
                                <p className={`font-bold ${theme.title}`}>
                                  Propuesta #{propuestaHist.version ?? indice + 1}
                                </p>

                                {propuestaHist.fecha && (
                                  <p className={`${theme.muted} text-xs mt-1`}>
                                    {formatearFecha(propuestaHist.fecha)}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                </>
              );
            })()}
          </div>
        </ModalOverlay>
      )}

      {/* =================================================
          MODAL HISTORIAL
      ================================================= */}

      {historialOpen && cotizacionHistorial && (
        <ModalOverlay
          onClose={() => setHistorialOpen(false)}
          theme={theme}
          z="z-[120]"
        >
          <div className={`${theme.card} w-full max-w-2xl rounded-[30px] overflow-hidden`}>
            <header
              className={`p-6 md:p-8 border-b ${theme.line} flex items-start justify-between gap-4`}
            >
              <div>
                <p className="text-sky-500 text-xs uppercase tracking-[0.2em] font-black">
                  Seguimiento del proyecto
                </p>

                <h2 className={`text-2xl md:text-3xl font-black mt-2 ${theme.title}`}>
                  Historial del proyecto
                </h2>

                <p className={`${theme.muted} mt-1`}>
                  {cotizacionHistorial.nombre || "Cotización"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setHistorialOpen(false)}
                className={`w-11 h-11 rounded-2xl flex items-center justify-center transition ${theme.secondaryBtn}`}
              >
                <FaTimes />
              </button>
            </header>

            <div className="p-6 md:p-8 max-h-[80vh] overflow-y-auto">
              {obtenerHistorialVisible(cotizacionHistorial).length === 0 ? (
                <div className={`${theme.cardSoft} rounded-2xl p-8 text-center ${theme.muted}`}>
                  Todavía no hay movimientos registrados.
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute left-[11px] top-2 bottom-2 w-px bg-sky-200" />

                  <div className="space-y-6">
                    {obtenerHistorialVisible(cotizacionHistorial).map(
                      (evento, indice) => (
                        <div
                          key={`${evento.tipo}-${obtenerMillis(
                            evento.fecha
                          )}-${indice}`}
                          className="relative pl-10"
                        >
                          <div className="absolute left-0 top-1.5 w-[23px] h-[23px] rounded-full bg-white border-2 border-sky-500 flex items-center justify-center">
                            <div className="w-2 h-2 bg-sky-500 rounded-full" />
                          </div>

                          <div className={`${theme.cardSoft} rounded-2xl p-4`}>
                            <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                              <div>
                                <p className={`font-black ${theme.title}`}>
                                  {evento.titulo}
                                </p>

                                {evento.descripcion && (
                                  <p className={`${theme.text} text-sm mt-1`}>
                                    {evento.descripcion}
                                  </p>
                                )}
                              </div>

                              <span className={`${theme.muted} text-xs shrink-0`}>
                                {evento.actor === "cliente" ? "Tú" : "Macro"}
                              </span>
                            </div>

                            <p className="text-sky-600 text-xs mt-3">
                              {formatearFecha(evento.fecha)}
                            </p>

                            {evento.fechaInicioInstalacion &&
                              evento.fechaFinInstalacion && (
                                <p className="text-cyan-600 text-xs mt-2">
                                  Instalación: {evento.fechaInicioInstalacion} →{" "}
                                  {evento.fechaFinInstalacion}
                                </p>
                              )}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* =================================================
          GALERÍA
      ================================================= */}

      {galeriaOpen && imgs.length > 0 && (
        <div
          className="fixed inset-0 z-[130] bg-slate-950/95 flex items-center justify-center"
          onClick={() => setGaleriaOpen(false)}
        >
          {imgs.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                anteriorImagen();
              }}
              className="absolute left-5 text-white text-5xl z-10"
            >
              ❮
            </button>
          )}

          <img
            src={imgs[index]}
            alt="Cotización"
            className="max-w-[90%] max-h-[90%] object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />

          {imgs.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                siguienteImagen();
              }}
              className="absolute right-5 text-white text-5xl z-10"
            >
              ❯
            </button>
          )}

          <button
            type="button"
            onClick={() => setGaleriaOpen(false)}
            className="absolute top-5 right-5 text-white text-5xl"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

/* ======================================================
   COMPONENTES AUXILIARES
====================================================== */

function ModalOverlay({ children, onClose, theme, z = "z-[100]" }) {
  return (
    <div
      className={`fixed inset-0 ${z} ${theme.overlay} backdrop-blur-sm overflow-y-auto p-4`}
    >
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative min-h-full flex items-center justify-center py-4">
        {children}
      </div>
    </div>
  );
}

function FieldBlock({ label, icon, children, theme }) {
  return (
    <div>
      <label className={`text-sm font-bold flex items-center gap-2 mb-2 ${theme.text}`}>
        <span className="text-sky-500">{icon}</span>
        {label}
      </label>
      {children}
    </div>
  );
}

function MiniStat({ theme, label, value, icon, accent = false }) {
  return (
    <div
      className={`rounded-[22px] p-4 ${
        accent
          ? "bg-red-50 border border-red-200"
          : theme.card
      }`}
    >
      <div
        className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
          accent
            ? "bg-red-100 text-red-600"
            : "bg-sky-100 text-sky-600"
        }`}
      >
        {icon}
      </div>

      <p className={`text-[11px] uppercase tracking-[0.18em] font-bold mt-4 ${theme.muted}`}>
        {label}
      </p>

      <p className={`text-2xl font-black mt-2 ${accent ? "text-red-600" : theme.title}`}>
        {value}
      </p>
    </div>
  );
}

function SummaryCard({ title, value, caption = "", theme }) {
  return (
    <div className={`${theme.cardSoft} rounded-2xl p-5`}>
      <p className={`text-xs uppercase tracking-[0.16em] font-bold ${theme.muted}`}>
        {title}
      </p>

      <p className={`text-xl md:text-2xl font-black mt-2 ${theme.title}`}>
        {value}
      </p>

      {caption ? <p className="text-sky-600 text-xs mt-2">{caption}</p> : null}
    </div>
  );
}

function ResumenItem({ titulo, valor, theme }) {
  return (
    <div className="grid sm:grid-cols-[190px_1fr] gap-1 sm:gap-4 text-sm">
      <span className={theme.muted}>{titulo}</span>
      <span className={`${theme.text} break-words`}>{valor}</span>
    </div>
  );
}

export default Cotizaciones;