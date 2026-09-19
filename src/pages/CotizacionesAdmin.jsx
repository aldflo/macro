import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { db } from "../firebase.config";

import {
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";

import {
  FaBell,
  FaBoxes,
  FaBriefcase,
  FaCalendarAlt,
  FaCheck,
  FaCheckCircle,
  FaChevronDown,
  FaChevronLeft,
  FaChevronRight,
  FaChevronUp,
  FaClock,
  FaDollarSign,
  FaEdit,
  FaEye,
  FaFlagCheckered,
  FaHistory,
  FaImages,
  FaMapMarkerAlt,
  FaPaperPlane,
  FaPhone,
  FaPlay,
  FaSearch,
  FaShieldAlt,
  FaSyncAlt,
  FaTimes,
  FaTools,
  FaTrash,
  FaUndo,
  FaUser,
} from "react-icons/fa";

const ESTADOS_FINALIZADOS = ["finalizada", "terminada", "terminado"];

const ESTADOS_CON_PROPUESTA = [
  "cotizada",
  "propuesta_enviada",
  "propuesta_modificada",
  "aceptada_cliente",
  "cambios_solicitados",
  "rechazada_cliente",
  "cancelada_cliente",
  "confirmada_admin",
  "anticipo_pendiente",
  "anticipo_pagado",
  "anticipo_recibido",
  "en_proceso",
  "proceso",
  "instalacion_programada",
  "instalacion",
];

function CotizacionesAdmin() {
  const outlet = useOutletContext() || {};
  const modoOscuro = outlet?.modoOscuro ?? false;

  const [cotizaciones, setCotizaciones] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [clienteAbierto, setClienteAbierto] = useState(null);
  const [busqueda, setBusqueda] = useState("");

  const [modalCotizacion, setModalCotizacion] = useState(false);
  const [cotizacionActiva, setCotizacionActiva] = useState(null);

  const [presupuestoAdmin, setPresupuestoAdmin] = useState("");
  const [porcentajeAnticipo, setPorcentajeAnticipo] = useState("50");
  const [tiempoEstimado, setTiempoEstimado] = useState("");
  const [fechaEntregaEstimada, setFechaEntregaEstimada] = useState("");
  const [garantia, setGarantia] = useState("");
  const [observacionesAdmin, setObservacionesAdmin] = useState("");
  const [error, setError] = useState("");
  const [procesando, setProcesando] = useState(false);

  const [galeriaOpen, setGaleriaOpen] = useState(false);
  const [imagenesActivas, setImagenesActivas] = useState([]);
  const [indiceImagen, setIndiceImagen] = useState(0);

  const [modalFinalizar, setModalFinalizar] = useState(false);
  const [cotizacionFinalizar, setCotizacionFinalizar] = useState(null);
  const [fotosFinales, setFotosFinales] = useState([]);
  const [previewsFinales, setPreviewsFinales] = useState([]);
  const [errorFinalizar, setErrorFinalizar] = useState("");
  const [subiendoFinales, setSubiendoFinales] = useState(false);

  const [historialOpen, setHistorialOpen] = useState(false);
  const [cotizacionHistorial, setCotizacionHistorial] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "cotizaciones"),
      (snapshot) => {
        const data = snapshot.docs.map((documento) => ({
          id: documento.id,
          ...documento.data(),
        }));

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

        setCotizaciones(data);

        setCotizacionActiva((actual) => {
          if (!actual) return null;
          return data.find((c) => c.id === actual.id) || actual;
        });

        setCotizacionHistorial((actual) => {
          if (!actual) return null;
          return data.find((c) => c.id === actual.id) || actual;
        });

        setCargando(false);
      },
      (err) => {
        console.error("Error cargando cotizaciones:", err);
        setCargando(false);
      }
    );

    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        setUsuarios(
          snapshot.docs.map((documento) => ({
            id: documento.id,
            ...documento.data(),
          }))
        );
      },
      (err) => {
        console.error("Error cargando usuarios:", err);
      }
    );

    return () => unsub();
  }, []);

  const theme = useMemo(() => {
    if (modoOscuro) {
      return {
        page: "min-h-screen bg-[#081223] text-white",
        card: "bg-[#0d1a31] border border-slate-800",
        cardSoft: "bg-[#11203d] border border-slate-800",
        cardMuted: "bg-[#081223] border border-slate-800",
        title: "text-white",
        text: "text-slate-200",
        muted: "text-slate-400",
        lightMuted: "text-slate-500",
        input:
          "w-full rounded-2xl border border-slate-700 bg-[#091526] text-white placeholder:text-slate-500 outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/15",
        modalBg: "bg-[#081223]/80",
        primaryBtn:
          "bg-sky-500 hover:bg-sky-400 text-white shadow-lg shadow-sky-500/20",
        ghostBtn:
          "bg-[#11203d] hover:bg-[#162949] border border-slate-700 text-slate-200",
        dangerBtn:
          "bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300",
        successBtn:
          "bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/20",
      };
    }

    return {
      page: "min-h-screen bg-[#f4f8fc] text-slate-900",
      card: "bg-white border border-slate-200 shadow-sm",
      cardSoft: "bg-[#f8fbff] border border-slate-200",
      cardMuted: "bg-[#eef5ff] border border-slate-200",
      title: "text-slate-900",
      text: "text-slate-700",
      muted: "text-slate-500",
      lightMuted: "text-slate-400",
      input:
        "w-full rounded-2xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/15",
      modalBg: "bg-slate-950/45",
      primaryBtn:
        "bg-sky-500 hover:bg-sky-600 text-white shadow-lg shadow-sky-500/20",
      ghostBtn:
        "bg-white hover:bg-slate-50 border border-slate-300 text-slate-700",
      dangerBtn:
        "bg-red-50 hover:bg-red-100 border border-red-200 text-red-600",
      successBtn:
        "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20",
    };
  }, [modoOscuro]);

  const cotizacionesActivas = useMemo(() => {
    return cotizaciones.filter(
      (c) => !ESTADOS_FINALIZADOS.includes(c.estado)
    );
  }, [cotizaciones]);

  const obtenerUsuarioRegistrado = (cotizacion) => {
    const uid =
      cotizacion.uid ||
      cotizacion.userUid ||
      cotizacion.usuarioId ||
      null;

    const correo =
      cotizacion.correo ||
      cotizacion.email ||
      (typeof cotizacion.usuario === "string" &&
      cotizacion.usuario.includes("@")
        ? cotizacion.usuario
        : "");

    const telefono = String(
      cotizacion.telefono ||
        cotizacion.telefonoCliente ||
        cotizacion.phone ||
        ""
    ).replace(/\D/g, "");

    return usuarios.find((usuario) => {
      if (
        uid &&
        (usuario.id === uid || usuario.uid === uid)
      ) {
        return true;
      }

      const correoUsuario = String(
        usuario.correo || usuario.email || ""
      ).toLowerCase();

      if (
        correo &&
        correoUsuario &&
        correoUsuario === correo.toLowerCase()
      ) {
        return true;
      }

      const telefonoUsuario = String(
        usuario.telefono || usuario.phone || ""
      ).replace(/\D/g, "");

      return (
        telefono &&
        telefonoUsuario &&
        telefonoUsuario === telefono
      );
    });
  };

  const clientes = useMemo(() => {
    const grupos = {};

    cotizacionesActivas.forEach((cotizacion) => {
      const usuarioRegistrado =
        obtenerUsuarioRegistrado(cotizacion);

      const uid =
        cotizacion.uid ||
        cotizacion.userUid ||
        cotizacion.usuarioId ||
        usuarioRegistrado?.id ||
        usuarioRegistrado?.uid ||
        null;

      const correo =
        cotizacion.correo ||
        cotizacion.email ||
        (typeof cotizacion.usuario === "string" &&
        cotizacion.usuario.includes("@")
          ? cotizacion.usuario
          : "") ||
        usuarioRegistrado?.correo ||
        usuarioRegistrado?.email ||
        "";

      const telefono =
        cotizacion.telefono ||
        cotizacion.telefonoCliente ||
        cotizacion.phone ||
        usuarioRegistrado?.telefono ||
        usuarioRegistrado?.phone ||
        "";

      const nombre =
        cotizacion.nombreCliente ||
        cotizacion.clienteNombre ||
        cotizacion.nombreUsuario ||
        usuarioRegistrado?.nombre ||
        usuarioRegistrado?.displayName ||
        usuarioRegistrado?.nombreCompleto ||
        (correo ? correo.split("@")[0] : "Cliente");

      const clave = uid || correo || telefono || cotizacion.id;

      if (!grupos[clave]) {
        grupos[clave] = {
          clave,
          uid,
          nombre,
          correo,
          telefono,
          cotizaciones: [],
        };
      }

      grupos[clave].cotizaciones.push(cotizacion);
    });

    const lista = Object.values(grupos).map((cliente) => {
      const nuevas = cliente.cotizaciones.filter(
        (c) => c.vistoPorAdmin === false
      ).length;

      const ultimaActividad = Math.max(
        0,
        ...cliente.cotizaciones.map(
          (c) =>
            c.fechaActualizacion?.toMillis?.() ||
            c.fecha?.toMillis?.() ||
            0
        )
      );

      const enEjecucion = cliente.cotizaciones.filter((c) =>
        [
          "confirmada_admin",
          "anticipo_pendiente",
          "anticipo_pagado",
          "anticipo_recibido",
          "en_proceso",
          "proceso",
          "instalacion_programada",
          "instalacion",
        ].includes(c.estado)
      ).length;

      return {
        ...cliente,
        nuevas,
        ultimaActividad,
        enEjecucion,
      };
    });

    lista.sort((a, b) => {
      if (a.nuevas > 0 && b.nuevas === 0) return -1;
      if (b.nuevas > 0 && a.nuevas === 0) return 1;
      return b.ultimaActividad - a.ultimaActividad;
    });

    return lista;
  }, [cotizacionesActivas, usuarios]);

  const clientesFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return clientes;

    return clientes.filter((cliente) => {
      const contenido = [
        cliente.nombre,
        cliente.correo,
        cliente.telefono,
        ...cliente.cotizaciones.map(
          (c) => `${c.nombre || ""} ${c.descripcion || ""}`
        ),
      ]
        .join(" ")
        .toLowerCase();

      return contenido.includes(texto);
    });
  }, [clientes, busqueda]);

  const cantidadNovedadesAdmin = cotizacionesActivas.filter(
    (c) => c.vistoPorAdmin === false
  ).length;

  const montoAnticipo = useMemo(() => {
    const total = Number(presupuestoAdmin);
    const porcentaje = Number(porcentajeAnticipo);
    if (!total || Number.isNaN(total)) return 0;
    return (total * porcentaje) / 100;
  }, [presupuestoAdmin, porcentajeAnticipo]);

  const saldoPendiente = useMemo(() => {
    const total = Number(presupuestoAdmin);
    if (!total || Number.isNaN(total)) return 0;
    return total - montoAnticipo;
  }, [presupuestoAdmin, montoAnticipo]);

  const obtenerPrecio = (cotizacion) => {
    return (
      cotizacion?.propuestaActual?.precioTotal ??
      cotizacion?.precioTotal ??
      cotizacion?.presupuestoAdmin ??
      cotizacion?.total ??
      cotizacion?.precio ??
      null
    );
  };

  const tienePropuesta = (cotizacion) => {
    return (
      obtenerPrecio(cotizacion) !== null ||
      ESTADOS_CON_PROPUESTA.includes(cotizacion?.estado)
    );
  };

  const obtenerImagenes = (cotizacion) => {
    return [
      ...new Set([
        ...(cotizacion?.imagenes || []),
        ...(cotizacion?.imagenesProyecto || []),
        ...(cotizacion?.imagenesCliente || []),
      ]),
    ].filter(Boolean);
  };

  const formatoDinero = (valor) => {
    if (valor === null || valor === undefined || valor === "") return "—";

    return Number(valor).toLocaleString("es-MX", {
      style: "currency",
      currency: "MXN",
      maximumFractionDigits: 0,
    });
  };

  const formatearFecha = (fecha) => {
    try {
      const date = fecha?.toDate?.() || new Date(fecha);
      if (!date || Number.isNaN(date.getTime())) return "—";

      return date.toLocaleString("es-MX", {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      return "—";
    }
  };

  const obtenerFechaValida = (fecha) => {
    if (!fecha) return null;

    try {
      if (typeof fecha.toDate === "function") return fecha.toDate();

      const texto = String(fecha).trim();

      if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
        const [anio, mes, dia] = texto.split("-").map(Number);
        const date = new Date(anio, mes - 1, dia, 12, 0, 0);
        return Number.isNaN(date.getTime()) ? null : date;
      }

      const date = new Date(fecha);
      return Number.isNaN(date.getTime()) ? null : date;
    } catch {
      return null;
    }
  };

  const formatearFechaSoloDia = (fecha) => {
    const date = obtenerFechaValida(fecha);
    if (!date) return "—";

    return date.toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const obtenerFechaDeseadaCliente = (cotizacion) => {
    return (
      cotizacion?.fechaDeseada ??
      cotizacion?.fechaNecesaria ??
      cotizacion?.fechaRequerida ??
      cotizacion?.fechaEntregaDeseada ??
      null
    );
  };

  const obtenerFechaEntregaMacro = (cotizacion) => {
    return (
      cotizacion?.propuestaActual?.fechaEntregaEstimada ??
      cotizacion?.fechaEntregaEstimada ??
      cotizacion?.fechaFinInstalacion ??
      null
    );
  };

  const calcularEstadoEntrega = (fechaEntrega) => {
    const entrega = obtenerFechaValida(fechaEntrega);
    if (!entrega) return null;

    const hoy = new Date();
    const inicioHoy = new Date(
      hoy.getFullYear(),
      hoy.getMonth(),
      hoy.getDate()
    );
    const inicioEntrega = new Date(
      entrega.getFullYear(),
      entrega.getMonth(),
      entrega.getDate()
    );

    const diferenciaMs =
      inicioEntrega.getTime() - inicioHoy.getTime();

    const dias = Math.ceil(
      diferenciaMs / (1000 * 60 * 60 * 24)
    );

    if (dias > 5) {
      return {
        dias,
        texto: `Faltan ${dias} días`,
        clase:
          "bg-emerald-50 text-emerald-700 border border-emerald-200",
      };
    }

    if (dias > 1) {
      return {
        dias,
        texto: `Faltan ${dias} días`,
        clase: "bg-sky-50 text-sky-700 border border-sky-200",
      };
    }

    if (dias === 1) {
      return {
        dias,
        texto: "Falta 1 día",
        clase: "bg-sky-50 text-sky-700 border border-sky-200",
      };
    }

    if (dias === 0) {
      return {
        dias,
        texto: "Entrega hoy",
        clase:
          "bg-amber-50 text-amber-700 border border-amber-200",
      };
    }

    return {
      dias,
      texto: `Vencida por ${Math.abs(dias)} ${
        Math.abs(dias) === 1 ? "día" : "días"
      }`,
      clase: "bg-red-50 text-red-700 border border-red-200",
    };
  };

  const getEstadoTexto = (estado) => {
    switch (estado) {
      case "pendiente":
        return "Pendiente";
      case "revision":
      case "en_revision":
        return "En revisión";
      case "cotizada":
      case "propuesta_enviada":
        return "Propuesta enviada";
      case "propuesta_modificada":
        return "Propuesta modificada";
      case "aceptada_cliente":
        return "Aceptada por cliente";
      case "cambios_solicitados":
        return "Cambios solicitados";
      case "rechazada_cliente":
        return "Rechazada por cliente";
      case "cancelada_cliente":
        return "Cancelada por cliente";
      case "confirmada_admin":
        return "Proyecto confirmado";
      case "anticipo_pendiente":
        return "Anticipo pendiente";
      case "anticipo_pagado":
      case "anticipo_recibido":
        return "Anticipo recibido";
      case "proceso":
      case "en_proceso":
        return "En proceso";
      case "instalacion":
      case "instalacion_programada":
        return "Instalación";
      case "rechazada":
        return "Rechazada por Macro";
      default:
        return estado || "Pendiente";
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case "pendiente":
        return "bg-slate-100 text-slate-700 border border-slate-200";
      case "revision":
      case "en_revision":
        return "bg-blue-50 text-blue-700 border border-blue-200";
      case "cotizada":
      case "propuesta_enviada":
        return "bg-sky-50 text-sky-700 border border-sky-200";
      case "propuesta_modificada":
      case "cambios_solicitados":
        return "bg-amber-50 text-amber-700 border border-amber-200";
      case "aceptada_cliente":
      case "confirmada_admin":
      case "anticipo_pagado":
      case "anticipo_recibido":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200";
      case "rechazada_cliente":
      case "cancelada_cliente":
      case "rechazada":
        return "bg-red-50 text-red-700 border border-red-200";
      case "proceso":
      case "en_proceso":
        return "bg-cyan-50 text-cyan-700 border border-cyan-200";
      case "instalacion":
      case "instalacion_programada":
        return "bg-violet-50 text-violet-700 border border-violet-200";
      default:
        return modoOscuro
          ? "bg-slate-800 text-slate-200 border border-slate-700"
          : "bg-slate-100 text-slate-700 border border-slate-200";
    }
  };

  const crearEventoHistorial = (
    tipo,
    titulo,
    descripcion = "",
    actor = "admin",
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

  const obtenerFechaEventoHistorial = (cotizacion, tipos = []) => {
    const historial = Array.isArray(cotizacion?.historial)
      ? cotizacion.historial
      : [];

    const evento = [...historial]
      .filter((item) => item?.fecha && tipos.includes(item?.tipo))
      .sort((a, b) => obtenerMillis(a.fecha) - obtenerMillis(b.fecha))[0];

    return evento?.fecha || null;
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
        titulo: "Solicitud creada",
        descripcion: "El cliente envió la solicitud de cotización.",
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
        titulo: "Propuesta enviada",
        descripcion: "Macro envió una propuesta al cliente.",
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
      let titulo = "Respuesta del cliente";
      let tipo = "respuesta_cliente";
      let descripcion = "El cliente respondió a la propuesta.";

      if (
        cotizacion.respuestaCliente === "aceptada" ||
        cotizacion.estado === "aceptada_cliente"
      ) {
        tipo = "propuesta_aceptada";
        titulo = "Propuesta aceptada";
        descripcion = "El cliente aceptó la propuesta.";
      } else if (
        cotizacion.respuestaCliente === "solicita_modificacion" ||
        cotizacion.estado === "cambios_solicitados"
      ) {
        tipo = "cambios_solicitados";
        titulo = "Cambios solicitados";
        descripcion =
          cotizacion.mensajeCliente ||
          "El cliente solicitó cambios a la propuesta.";
      } else if (
        cotizacion.respuestaCliente === "rechazada" ||
        cotizacion.estado === "rechazada_cliente"
      ) {
        tipo = "propuesta_rechazada";
        titulo = "Propuesta rechazada";
        descripcion = "El cliente rechazó la propuesta.";
      }

      eventos.push({
        tipo,
        titulo,
        descripcion,
        actor: "cliente",
        fecha: cotizacion.fechaRespuestaCliente,
      });
    }

    if (
      cotizacion?.fechaFinalizacion &&
      !eventos.some((evento) => evento.tipo === "proyecto_finalizado")
    ) {
      eventos.push({
        tipo: "proyecto_finalizado",
        titulo: "Proyecto finalizado",
        descripcion: "Macro marcó el proyecto como terminado.",
        actor: "admin",
        fecha: cotizacion.fechaFinalizacion,
      });
    }

    return eventos
      .filter((evento) => evento && evento.fecha)
      .sort((a, b) => obtenerMillis(a.fecha) - obtenerMillis(b.fecha));
  };

  const abrirHistorial = async (cotizacion) => {
    setCotizacionHistorial(cotizacion);
    setHistorialOpen(true);

    if (cotizacion.vistoPorAdmin === false) {
      try {
        await updateDoc(doc(db, "cotizaciones", cotizacion.id), {
          vistoPorAdmin: true,
          fechaVistaAdmin: serverTimestamp(),
        });
      } catch (err) {
        console.error("Error marcando historial como visto:", err);
      }
    }
  };

  const marcarCotizacionesComoVistas = async (lista) => {
    const pendientes = lista.filter(
      (cotizacion) => cotizacion.vistoPorAdmin === false
    );
    if (!pendientes.length) return;

    const batch = writeBatch(db);

    pendientes.forEach((cotizacion) => {
      batch.update(doc(db, "cotizaciones", cotizacion.id), {
        vistoPorAdmin: true,
        fechaVistaAdmin: serverTimestamp(),
      });
    });

    await batch.commit();
  };

  const toggleCliente = async (cliente) => {
    const yaAbierto = clienteAbierto === cliente.clave;
    setClienteAbierto(yaAbierto ? null : cliente.clave);

    if (!yaAbierto) {
      try {
        await marcarCotizacionesComoVistas(cliente.cotizaciones);
      } catch (err) {
        console.error(
          "Error marcando novedades del cliente como vistas:",
          err
        );
      }
    }
  };

  const abrirCotizacion = async (cotizacion) => {
    setCotizacionActiva(cotizacion);

    setPresupuestoAdmin(
      cotizacion.propuestaActual?.precioTotal ??
        cotizacion.precioTotal ??
        cotizacion.presupuestoAdmin ??
        ""
    );

    setPorcentajeAnticipo(
      cotizacion.propuestaActual?.porcentajeAnticipo ??
        cotizacion.porcentajeAnticipo ??
        "50"
    );

    setTiempoEstimado(
      cotizacion.propuestaActual?.tiempoEstimado ??
        cotizacion.tiempoEstimado ??
        ""
    );

    setFechaEntregaEstimada(
      cotizacion.propuestaActual?.fechaEntregaEstimada ??
        cotizacion.fechaEntregaEstimada ??
        cotizacion.fechaFinInstalacion ??
        ""
    );

    setGarantia(
      cotizacion.propuestaActual?.garantia ??
        cotizacion.garantia ??
        ""
    );

    setObservacionesAdmin(
      cotizacion.propuestaActual?.observaciones ??
        cotizacion.observacionesAdmin ??
        cotizacion.observaciones ??
        ""
    );

    setError("");
    setModalCotizacion(true);

    if (cotizacion.vistoPorAdmin === false) {
      try {
        await updateDoc(doc(db, "cotizaciones", cotizacion.id), {
          vistoPorAdmin: true,
          fechaVistaAdmin: serverTimestamp(),
        });
      } catch (err) {
        console.error("Error marcando cotización como vista:", err);
      }
    }
  };

  const cerrarCotizacion = () => {
    setModalCotizacion(false);
    setCotizacionActiva(null);
    setError("");
  };

  const enviarPropuesta = async () => {
    if (!cotizacionActiva) return;

    setError("");
    const total = Number(presupuestoAdmin);
    const porcentaje = Number(porcentajeAnticipo);

    if (!total || total <= 0) {
      setError("Ingresa un precio válido.");
      return;
    }

    if (
      porcentajeAnticipo === "" ||
      porcentaje < 0 ||
      porcentaje > 100
    ) {
      setError("El anticipo debe estar entre 0 y 100%.");
      return;
    }

    try {
      setProcesando(true);

      const yaTeniaPropuesta = tienePropuesta(cotizacionActiva);

      const versionActual =
        Number(cotizacionActiva.versionPropuesta) ||
        Number(cotizacionActiva.propuestaActual?.version) ||
        (yaTeniaPropuesta ? 1 : 0);

      const nuevaVersion = yaTeniaPropuesta ? versionActual + 1 : 1;

      const propuestaActual = {
        version: nuevaVersion,
        precioTotal: total,
        porcentajeAnticipo: porcentaje,
        anticipo: Number(montoAnticipo),
        saldo: Number(saldoPendiente),
        tiempoEstimado: tiempoEstimado.trim(),
        fechaEntregaEstimada: fechaEntregaEstimada.trim() || null,
        garantia: garantia.trim(),
        observaciones: observacionesAdmin.trim(),
        fecha: Timestamp.now(),
      };

      const datos = {
        estado: yaTeniaPropuesta
          ? "propuesta_modificada"
          : "propuesta_enviada",
        propuestaActual,
        precioTotal: total,
        presupuestoAdmin: total,
        porcentajeAnticipo: porcentaje,
        anticipo: Number(montoAnticipo),
        montoAnticipo: Number(montoAnticipo),
        saldo: Number(saldoPendiente),
        saldoPendiente: Number(saldoPendiente),
        tiempoEstimado: tiempoEstimado.trim(),
        fechaEntregaEstimada: fechaEntregaEstimada.trim() || null,
        garantia: garantia.trim(),
        observaciones: observacionesAdmin.trim(),
        observacionesAdmin: observacionesAdmin.trim(),
        versionPropuesta: nuevaVersion,
        respuestaCliente: "sin_respuesta",
        mensajeCliente: "",
        vistoPorAdmin: true,
        vistoPorCliente: false,
        mensajeClienteSistema: yaTeniaPropuesta
          ? "Macro modificó tu propuesta."
          : "Macro envió una nueva propuesta.",
        fechaPropuesta: serverTimestamp(),
        fechaActualizacion: serverTimestamp(),
        historial: arrayUnion(
          crearEventoHistorial(
            yaTeniaPropuesta
              ? "propuesta_modificada"
              : "propuesta_enviada",
            yaTeniaPropuesta
              ? "Propuesta modificada"
              : "Propuesta enviada",
            yaTeniaPropuesta
              ? `Macro envió la versión ${nuevaVersion} de la propuesta.`
              : `Macro envió la propuesta versión ${nuevaVersion}.`
          )
        ),
      };

      const historialAnterior = Array.isArray(
        cotizacionActiva.historialPropuestas
      )
        ? cotizacionActiva.historialPropuestas
        : [];

      if (cotizacionActiva.propuestaActual && yaTeniaPropuesta) {
        datos.historialPropuestas = [
          ...historialAnterior,
          cotizacionActiva.propuestaActual,
        ];
      }

      await updateDoc(doc(db, "cotizaciones", cotizacionActiva.id), datos);
      cerrarCotizacion();
    } catch (err) {
      console.error(err);
      setError("No se pudo enviar la propuesta.");
    } finally {
      setProcesando(false);
    }
  };

  const actualizarEstado = async (
    cotizacion,
    estado,
    mensajeClienteSistema
  ) => {
    const eventosPorEstado = {
      en_revision: {
        tipo: "en_revision",
        titulo: "Solicitud en revisión",
        descripcion: "Macro comenzó a revisar la solicitud.",
      },
      confirmada_admin: {
        tipo: "proyecto_confirmado",
        titulo: "Proyecto confirmado",
        descripcion:
          "Macro confirmó el proyecto aceptado por el cliente.",
      },
      anticipo_pendiente: {
        tipo: "anticipo_pendiente",
        titulo: "Anticipo pendiente",
        descripcion: "Macro indicó que el anticipo está pendiente.",
      },
      anticipo_recibido: {
        tipo: "anticipo_recibido",
        titulo: "Anticipo recibido",
        descripcion:
          "Macro confirmó la recepción del anticipo.",
      },
      en_proceso: {
        tipo: "proyecto_iniciado",
        titulo: "Proyecto en ejecución",
        descripcion: "Macro inició la ejecución del proyecto.",
      },
      rechazada: {
        tipo: "solicitud_rechazada_admin",
        titulo: "Solicitud rechazada por Macro",
        descripcion: "Macro rechazó la solicitud.",
      },
    };

    const evento = eventosPorEstado[estado];

    try {
      const datos = {
        estado,
        vistoPorAdmin: true,
        vistoPorCliente: false,
        mensajeClienteSistema,
        fechaActualizacion: serverTimestamp(),
      };

      if (estado === "confirmada_admin") {
        datos.fechaConfirmacionAdmin = serverTimestamp();
      }

      if (estado === "en_proceso") {
        datos.fechaInicioProyecto = serverTimestamp();
      }

      if (evento) {
        datos.historial = arrayUnion(
          crearEventoHistorial(
            evento.tipo,
            evento.titulo,
            evento.descripcion
          )
        );
      }

      await updateDoc(doc(db, "cotizaciones", cotizacion.id), datos);
    } catch (err) {
      console.error("Error actualizando estado:", err);
      window.alert("No se pudo actualizar el estado.");
    }
  };

  const marcarEnRevision = (cotizacion) =>
    actualizarEstado(
      cotizacion,
      "en_revision",
      "Macro está revisando tu solicitud."
    );

  const confirmarProyecto = (cotizacion) =>
    actualizarEstado(
      cotizacion,
      "confirmada_admin",
      "Macro confirmó el proyecto."
    );

  const marcarAnticipoPendiente = (cotizacion) =>
    actualizarEstado(
      cotizacion,
      "anticipo_pendiente",
      "El anticipo está pendiente."
    );

  const marcarAnticipoRecibido = (cotizacion) =>
    actualizarEstado(
      cotizacion,
      "anticipo_recibido",
      "Macro confirmó la recepción del anticipo."
    );

  const iniciarProyecto = (cotizacion) =>
    actualizarEstado(
      cotizacion,
      "en_proceso",
      "Tu proyecto ya está en proceso."
    );

  const programarInstalacion = async (cotizacion) => {
    const inicio = window.prompt(
      "Fecha de inicio de instalación (AAAA-MM-DD):",
      cotizacion.fechaInicioInstalacion || ""
    );

    if (inicio === null) return;

    const fin = window.prompt(
      "Fecha de término de instalación (AAAA-MM-DD):",
      cotizacion.fechaFinInstalacion || inicio
    );

    if (fin === null) return;

    if (!inicio.trim() || !fin.trim()) {
      window.alert("Debes indicar la fecha de inicio y término.");
      return;
    }

    if (new Date(fin) < new Date(inicio)) {
      window.alert(
        "La fecha de término no puede ser anterior a la fecha de inicio."
      );
      return;
    }

    try {
      await updateDoc(doc(db, "cotizaciones", cotizacion.id), {
        estado: "instalacion_programada",
        fechaInicioInstalacion: inicio.trim(),
        fechaFinInstalacion: fin.trim(),
        fechaInstalacion: serverTimestamp(),
        vistoPorAdmin: true,
        vistoPorCliente: false,
        mensajeClienteSistema: `Instalación programada del ${inicio.trim()} al ${fin.trim()}.`,
        fechaActualizacion: serverTimestamp(),
        historial: arrayUnion(
          crearEventoHistorial(
            "instalacion_programada",
            "Instalación programada",
            `Instalación programada del ${inicio.trim()} al ${fin.trim()}.`,
            "admin",
            {
              fechaInicioInstalacion: inicio.trim(),
              fechaFinInstalacion: fin.trim(),
            }
          )
        ),
      });
    } catch (err) {
      console.error("Error programando instalación:", err);
      window.alert("No se pudo programar la instalación.");
    }
  };

  const rechazarCotizacion = async (cotizacion) => {
    const ok = window.confirm(
      `¿Rechazar la solicitud "${cotizacion.nombre || "Sin nombre"}"?`
    );
    if (!ok) return;

    await actualizarEstado(
      cotizacion,
      "rechazada",
      "Macro rechazó esta solicitud."
    );
  };

  const resetEstado = async (cotizacion) => {
    const ok = window.confirm(
      "¿Reiniciar esta cotización? Se limpiará la propuesta actual."
    );

    if (!ok) return;

    try {
      await updateDoc(doc(db, "cotizaciones", cotizacion.id), {
        estado: "pendiente",
        propuestaActual: null,
        historialPropuestas: [],
        precioTotal: null,
        presupuestoAdmin: null,
        porcentajeAnticipo: null,
        anticipo: null,
        montoAnticipo: null,
        saldo: null,
        saldoPendiente: null,
        tiempoEstimado: "",
        fechaEntregaEstimada: null,
        garantia: "",
        observaciones: "",
        observacionesAdmin: "",
        respuestaCliente: "sin_respuesta",
        mensajeCliente: "",
        vistoPorAdmin: true,
        vistoPorCliente: false,
        versionPropuesta: null,
        mensajeClienteSistema: "La cotización fue reiniciada por Macro.",
        fechaActualizacion: serverTimestamp(),
        historial: arrayUnion(
          crearEventoHistorial(
            "cotizacion_reiniciada",
            "Cotización reiniciada",
            "Macro reinició la cotización para elaborar una nueva propuesta."
          )
        ),
      });
    } catch (err) {
      console.error(err);
      window.alert("No se pudo reiniciar.");
    }
  };

  const eliminarCotizacion = async (cotizacion) => {
    const ok = window.confirm(
      `¿Eliminar definitivamente "${cotizacion.nombre || "esta cotización"}"?`
    );

    if (!ok) return;

    try {
      await deleteDoc(doc(db, "cotizaciones", cotizacion.id));
    } catch (err) {
      console.error(err);
      window.alert("No se pudo eliminar.");
    }
  };

  const abrirGaleria = (cotizacion) => {
    const imagenes = obtenerImagenes(cotizacion);
    if (!imagenes.length) return;

    setImagenesActivas(imagenes);
    setIndiceImagen(0);
    setGaleriaOpen(true);
  };

  const abrirFinalizacion = (cotizacion) => {
    setCotizacionFinalizar(cotizacion);
    setFotosFinales([]);
    setPreviewsFinales([]);
    setErrorFinalizar("");
    setModalFinalizar(true);
  };

  const seleccionarFotosFinales = (e) => {
    const archivos = Array.from(e.target.files || []);
    e.target.value = "";

    const validos = archivos.filter(
      (archivo) =>
        archivo.type?.startsWith("image/") &&
        archivo.size <= 5 * 1024 * 1024
    );

    if (validos.length !== archivos.length) {
      setErrorFinalizar("Solo se aceptan imágenes de máximo 5 MB.");
    } else {
      setErrorFinalizar("");
    }

    const disponibles = Math.max(0, 6 - fotosFinales.length);
    const nuevos = validos.slice(0, disponibles);

    if (validos.length > disponibles) {
      setErrorFinalizar("Máximo 6 fotografías.");
    }

    setFotosFinales((actuales) => [...actuales, ...nuevos]);
    setPreviewsFinales((actuales) => [
      ...actuales,
      ...nuevos.map((archivo) => URL.createObjectURL(archivo)),
    ]);
  };

  const eliminarFotoFinal = (indice) => {
    setPreviewsFinales((actuales) => {
      const url = actuales[indice];
      if (url) URL.revokeObjectURL(url);
      return actuales.filter((_, i) => i !== indice);
    });

    setFotosFinales((actuales) =>
      actuales.filter((_, i) => i !== indice)
    );
  };

  const cerrarFinalizacion = () => {
    previewsFinales.forEach((url) => URL.revokeObjectURL(url));
    setPreviewsFinales([]);
    setFotosFinales([]);
    setCotizacionFinalizar(null);
    setErrorFinalizar("");
    setModalFinalizar(false);
  };

  const subirFotoCloudinary = async (archivo) => {
    const formData = new FormData();
    formData.append("file", archivo);

    const cloudName =
      import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "dxj4iczvk";
    const uploadPreset =
      import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "macroservices";

    formData.append("upload_preset", uploadPreset);

    const respuesta = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!respuesta.ok) {
      const detalle = await respuesta.json().catch(() => null);
      throw new Error(
        detalle?.error?.message || "No se pudo subir una fotografía."
      );
    }

    const data = await respuesta.json();
    if (!data.secure_url) {
      throw new Error("Cloudinary no devolvió la URL.");
    }

    return data.secure_url;
  };

  const terminarProyecto = async () => {
    if (!cotizacionFinalizar) return;

    if (fotosFinales.length === 0) {
      setErrorFinalizar(
        "Agrega por lo menos una fotografía del proyecto terminado."
      );
      return;
    }

    const ok = window.confirm(
      `¿Finalizar "${cotizacionFinalizar.nombre || "este proyecto"}"?`
    );

    if (!ok) return;

    try {
      setSubiendoFinales(true);
      setErrorFinalizar("");

      const fotosProyectoFinal = await Promise.all(
        fotosFinales.map(subirFotoCloudinary)
      );

      const cotizacion = cotizacionFinalizar;

      const eventoFinal = crearEventoHistorial(
        "proyecto_finalizado",
        "Proyecto finalizado",
        "Macro finalizó el proyecto y agregó las fotografías finales."
      );

      const historialFinal = [
        ...obtenerHistorialVisible(cotizacion),
        eventoFinal,
      ];

      const batch = writeBatch(db);
      const proyectoRef = doc(db, "proyectosClientes", cotizacion.id);

      batch.set(
        proyectoRef,
        {
          uid:
            cotizacion.uid ||
            cotizacion.userUid ||
            cotizacion.usuarioId ||
            null,

          usuario:
            cotizacion.usuario ||
            cotizacion.correo ||
            cotizacion.email ||
            "",

          cotizacionId: cotizacion.id,
          nombre: cotizacion.nombre || "Proyecto Macro",
          descripcion: cotizacion.descripcion || "",
          tipo: cotizacion.tipo || "",
          ubicacion: cotizacion.ubicacion || "",
          latitud: cotizacion.latitud ?? null,
          longitud: cotizacion.longitud ?? null,
          medidas: cotizacion.medidas || "",
          fechaDeseada: cotizacion.fechaDeseada || null,
          telefono:
            cotizacion.telefono ||
            cotizacion.telefonoCliente ||
            "",
          imagenes: cotizacion.imagenes || [],
          imagenesProyecto: cotizacion.imagenesProyecto || [],
          imagenesCliente: cotizacion.imagenesCliente || [],
          imagenesProyectoFinal: fotosProyectoFinal,

          precioFinal: obtenerPrecio(cotizacion),
          precioTotal: obtenerPrecio(cotizacion),
          presupuestoAdmin: obtenerPrecio(cotizacion),

          porcentajeAnticipo:
            cotizacion.propuestaActual?.porcentajeAnticipo ??
            cotizacion.porcentajeAnticipo ??
            50,

          anticipo:
            cotizacion.propuestaActual?.anticipo ??
            cotizacion.anticipo ??
            cotizacion.montoAnticipo ??
            null,

          montoAnticipo:
            cotizacion.propuestaActual?.anticipo ??
            cotizacion.montoAnticipo ??
            cotizacion.anticipo ??
            null,

          saldo:
            cotizacion.propuestaActual?.saldo ??
            cotizacion.saldo ??
            cotizacion.saldoPendiente ??
            null,

          saldoPendiente:
            cotizacion.propuestaActual?.saldo ??
            cotizacion.saldoPendiente ??
            cotizacion.saldo ??
            null,

          tiempoEstimado:
            cotizacion.propuestaActual?.tiempoEstimado ??
            cotizacion.tiempoEstimado ??
            "",

          garantia:
            cotizacion.propuestaActual?.garantia ??
            cotizacion.garantia ??
            "",

          observaciones:
            cotizacion.propuestaActual?.observaciones ??
            cotizacion.observacionesAdmin ??
            cotizacion.observaciones ??
            "",

          versionPropuesta:
            cotizacion.propuestaActual?.version ??
            cotizacion.versionPropuesta ??
            1,

          propuestaActual: cotizacion.propuestaActual || null,
          fechaEntregaEstimada: obtenerFechaEntregaMacro(cotizacion),
          historial: historialFinal,

          fechaSolicitud:
            cotizacion.fechaSolicitud ||
            cotizacion.fecha ||
            obtenerFechaEventoHistorial(cotizacion, ["solicitud_creada"]) ||
            null,

          fechaConfirmacionAdmin:
            cotizacion.fechaConfirmacionAdmin ||
            obtenerFechaEventoHistorial(cotizacion, ["proyecto_confirmado"]) ||
            null,

          fechaInicioProyecto:
            cotizacion.fechaInicioProyecto ||
            obtenerFechaEventoHistorial(cotizacion, ["proyecto_iniciado"]) ||
            null,

          fechaInstalacion:
            cotizacion.fechaInstalacion ||
            cotizacion.fechaInicioInstalacion ||
            obtenerFechaEventoHistorial(cotizacion, ["instalacion_programada"]) ||
            null,

          fechaInicioInstalacion: cotizacion.fechaInicioInstalacion || null,
          fechaFinInstalacion: cotizacion.fechaFinInstalacion || null,

          estado: "finalizada",
          fechaFinalizacion: serverTimestamp(),
          fechaActualizacion: serverTimestamp(),
        },
        { merge: true }
      );

      batch.update(doc(db, "cotizaciones", cotizacion.id), {
        estado: "finalizada",
        imagenesProyectoFinal: fotosProyectoFinal,
        vistoPorAdmin: true,
        vistoPorCliente: false,
        mensajeClienteSistema:
          "Tu proyecto fue finalizado. Ya puedes verlo en Mis Proyectos.",
        fechaFinalizacion: serverTimestamp(),
        fechaActualizacion: serverTimestamp(),
        historial: arrayUnion(eventoFinal),
      });

      await batch.commit();
      cerrarFinalizacion();
    } catch (err) {
      console.error(err);
      setErrorFinalizar(
        err?.message || "No se pudo finalizar el proyecto."
      );
    } finally {
      setSubiendoFinales(false);
    }
  };

  const totalClientes = clientes.length;
  const totalEnEjecucion = clientes.reduce(
    (acc, item) => acc + item.enEjecucion,
    0
  );

  if (cargando) {
    return (
      <div className={`${theme.page} flex items-center justify-center p-6`}>
        <div className="text-center">
          <div className="w-14 h-14 rounded-full border-4 border-sky-200 border-t-sky-500 animate-spin mx-auto" />
          <p className={`${theme.muted} mt-4 font-medium`}>
            Cargando cotizaciones...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${theme.page} p-4 md:p-6 lg:p-8`}>
      <div className="max-w-7xl mx-auto space-y-6">
        <section className={`rounded-[30px] overflow-hidden ${theme.card} relative`}>
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-sky-500/10 via-blue-500/5 to-transparent" />

          <div className="relative p-6 md:p-8 lg:p-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <p className="text-sky-500 text-xs font-extrabold uppercase tracking-[0.35em]">
                Panel Macro
              </p>
              <h1 className={`mt-3 text-3xl md:text-4xl font-black ${theme.title}`}>
                Solicitudes y cotizaciones
              </h1>
              <p className={`${theme.muted} mt-3 max-w-2xl`}>
                Administra solicitudes, propuestas, anticipos, instalaciones y cierre de
                proyectos desde una interfaz más clara y ordenada.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full lg:w-auto lg:min-w-[560px]">
              <StatCard
                icon={<FaBriefcase />}
                label="Solicitudes activas"
                value={cotizacionesActivas.length}
                theme={theme}
              />
              <StatCard
                icon={<FaUser />}
                label="Clientes"
                value={totalClientes}
                theme={theme}
              />
              <StatCard
                icon={<FaPlay />}
                label="En ejecución"
                value={totalEnEjecucion}
                theme={theme}
              />
              <StatCard
                icon={<FaBell />}
                label="Novedades"
                value={cantidadNovedadesAdmin}
                theme={theme}
                accent={cantidadNovedadesAdmin > 0}
              />
            </div>
          </div>
        </section>

        <section className={`${theme.card} rounded-[28px] p-4 md:p-5`}>
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
            <div className="relative flex-1">
              <FaSearch className={`absolute left-4 top-1/2 -translate-y-1/2 ${theme.lightMuted}`} />
              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar cliente, correo, teléfono o proyecto..."
                className={`${theme.input} pl-12 pr-4 py-4`}
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <MiniBadge theme={theme} label="Macro" value="Admin" />
              <MiniBadge
                theme={theme}
                label="Pendientes"
                value={
                  cotizacionesActivas.filter((c) => c.estado === "pendiente").length
                }
              />
              <MiniBadge
                theme={theme}
                label="Propuestas"
                value={cotizacionesActivas.filter((c) => tienePropuesta(c)).length}
              />
            </div>
          </div>
        </section>

        {clientesFiltrados.length === 0 ? (
          <section className={`${theme.card} rounded-[30px] p-10 md:p-14 text-center`}>
            <div className="w-20 h-20 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center mx-auto text-3xl">
              <FaBoxes />
            </div>
            <h2 className={`text-2xl font-black mt-5 ${theme.title}`}>
              No hay cotizaciones activas
            </h2>
            <p className={`${theme.muted} mt-2 max-w-xl mx-auto`}>
              Cuando los clientes envíen solicitudes o pidan cambios a sus propuestas,
              aparecerán aquí agrupadas por cliente.
            </p>
          </section>
        ) : (
          <section className="space-y-4">
            {clientesFiltrados.map((cliente) => {
              const abierto = clienteAbierto === cliente.clave;

              return (
                <article
                  key={cliente.clave}
                  className={`${theme.card} rounded-[28px] overflow-hidden ${
                    cliente.nuevas > 0 ? "ring-2 ring-sky-300/70" : ""
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleCliente(cliente)}
                    className="w-full text-left p-5 md:p-6"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                      <div className="flex items-start gap-4">
                        <div className="relative w-16 h-16 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center text-2xl shrink-0">
                          <FaUser />
                          {cliente.nuevas > 0 && (
                            <span className="absolute -top-2 -right-2 min-w-[26px] h-[26px] px-1 rounded-full bg-red-500 text-white text-[11px] font-black flex items-center justify-center">
                              {cliente.nuevas}
                            </span>
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className={`text-xl md:text-2xl font-black ${theme.title}`}>
                              {cliente.nombre}
                            </h2>
                            {cliente.nuevas > 0 && (
                              <span className="px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-600 text-xs font-extrabold uppercase tracking-wide">
                                Nuevo
                              </span>
                            )}
                          </div>

                          <p className={`${theme.muted} mt-1 break-all`}>
                            {cliente.correo || "Sin correo registrado"}
                          </p>

                          {cliente.telefono && (
                            <div className={`mt-2 flex items-center gap-2 ${theme.muted}`}>
                              <FaPhone className="text-sky-500" />
                              <span>{cliente.telefono}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                        <SummaryPill
                          text={`${cliente.cotizaciones.length} ${
                            cliente.cotizaciones.length === 1
                              ? "cotización"
                              : "cotizaciones"
                          }`}
                          theme={theme}
                        />

                        {cliente.enEjecucion > 0 && (
                          <SummaryPill
                            text={`${cliente.enEjecucion} en ejecución`}
                            theme={theme}
                            color="green"
                          />
                        )}

                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${theme.cardSoft}`}>
                          {abierto ? <FaChevronUp /> : <FaChevronDown />}
                        </div>
                      </div>
                    </div>
                  </button>

                  {abierto && (
                    <div className="px-5 md:px-6 pb-6 border-t border-slate-200/80 space-y-4">
                      {cliente.cotizaciones.map((cotizacion) => {
                        const precio = obtenerPrecio(cotizacion);
                        const imagenes = obtenerImagenes(cotizacion);
                        const fechaDeseadaCliente =
                          obtenerFechaDeseadaCliente(cotizacion);
                        const fechaEntregaMacro =
                          obtenerFechaEntregaMacro(cotizacion);
                        const estadoEntrega =
                          calcularEstadoEntrega(fechaEntregaMacro);

                        return (
                          <div
                            key={cotizacion.id}
                            className={`rounded-[24px] p-4 md:p-5 ${
                              cotizacion.vistoPorAdmin === false
                                ? "bg-sky-50 border border-sky-200"
                                : `${theme.cardSoft}`
                            }`}
                          >
                            <div className="flex flex-col xl:flex-row gap-5 xl:justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className={`text-lg md:text-xl font-black ${theme.title}`}>
                                    {cotizacion.nombre || "Solicitud sin nombre"}
                                  </h3>

                                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${getEstadoColor(cotizacion.estado)}`}>
                                    {getEstadoTexto(cotizacion.estado)}
                                  </span>

                                  {cotizacion.tipo && (
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${theme.cardMuted} ${theme.text}`}>
                                      {cotizacion.tipo}
                                    </span>
                                  )}
                                </div>

                                <p className={`${theme.text} mt-3 leading-relaxed`}>
                                  {cotizacion.descripcion || "Sin descripción"}
                                </p>

                                <div className="flex flex-wrap gap-3 mt-4">
                                  {cotizacion.ubicacion && (
                                    <InfoCapsule
                                      theme={theme}
                                      icon={<FaMapMarkerAlt />}
                                      text={cotizacion.ubicacion}
                                    />
                                  )}

                                  <InfoCapsule
                                    theme={theme}
                                    icon={<FaCalendarAlt />}
                                    text={formatearFecha(
                                      cotizacion.fechaActualizacion ||
                                        cotizacion.fecha
                                    )}
                                  />

                                  {precio !== null && (
                                    <InfoCapsule
                                      theme={theme}
                                      icon={<FaDollarSign />}
                                      text={formatoDinero(precio)}
                                      accent="green"
                                    />
                                  )}
                                </div>

                                <div className="grid md:grid-cols-3 gap-3 mt-4">
                                  <SmallPanel
                                    theme={theme}
                                    label="Cliente lo necesita"
                                    value={formatearFechaSoloDia(fechaDeseadaCliente)}
                                  />

                                  <SmallPanel
                                    theme={theme}
                                    label="Entrega Macro"
                                    value={formatearFechaSoloDia(fechaEntregaMacro)}
                                  />

                                  <div className={`rounded-2xl p-4 ${estadoEntrega?.clase || theme.cardMuted}`}>
                                    <p className="text-xs uppercase tracking-[0.18em] font-bold opacity-70">
                                      Tiempo restante
                                    </p>
                                    <p className="mt-2 font-black text-sm md:text-base">
                                      {estadoEntrega?.texto || "Sin fecha de entrega"}
                                    </p>
                                  </div>
                                </div>

                                {cotizacion.mensajeCliente && (
                                  <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                                    <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-700">
                                      Solicitud del cliente
                                    </p>
                                    <p className="text-amber-900 mt-2 leading-relaxed">
                                      {cotizacion.mensajeCliente}
                                    </p>
                                  </div>
                                )}
                              </div>

                              <div className="xl:w-[360px] shrink-0">
                                <div className="grid grid-cols-2 gap-2">
                                  <ActionButton
                                    onClick={() => abrirCotizacion(cotizacion)}
                                    className={theme.primaryBtn}
                                    icon={
                                      tienePropuesta(cotizacion)
                                        ? <FaEdit />
                                        : <FaPaperPlane />
                                    }
                                    text={
                                      tienePropuesta(cotizacion)
                                        ? "Propuesta"
                                        : "Cotizar"
                                    }
                                  />

                                  <ActionButton
                                    onClick={() => abrirHistorial(cotizacion)}
                                    className={theme.ghostBtn}
                                    icon={<FaHistory />}
                                    text="Historial"
                                  />

                                  {imagenes.length > 0 && (
                                    <ActionButton
                                      onClick={() => abrirGaleria(cotizacion)}
                                      className={theme.ghostBtn}
                                      icon={<FaImages />}
                                      text={`Fotos (${imagenes.length})`}
                                    />
                                  )}

                                  {["pendiente", "revision"].includes(cotizacion.estado) && (
                                    <ActionButton
                                      onClick={() => marcarEnRevision(cotizacion)}
                                      className="bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700"
                                      icon={<FaEye />}
                                      text="Revisar"
                                    />
                                  )}

                                  {cotizacion.estado === "aceptada_cliente" && (
                                    <ActionButton
                                      onClick={() => confirmarProyecto(cotizacion)}
                                      className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700"
                                      icon={<FaCheck />}
                                      text="Confirmar"
                                    />
                                  )}

                                  {cotizacion.estado === "confirmada_admin" && (
                                    <ActionButton
                                      onClick={() => marcarAnticipoPendiente(cotizacion)}
                                      className="bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 text-cyan-700"
                                      icon={<FaDollarSign />}
                                      text="Pedir anticipo"
                                    />
                                  )}

                                  {cotizacion.estado === "anticipo_pendiente" && (
                                    <ActionButton
                                      onClick={() => marcarAnticipoRecibido(cotizacion)}
                                      className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700"
                                      icon={<FaCheckCircle />}
                                      text="Anticipo recibido"
                                    />
                                  )}

                                  {[
                                    "confirmada_admin",
                                    "anticipo_recibido",
                                    "anticipo_pagado",
                                  ].includes(cotizacion.estado) && (
                                    <ActionButton
                                      onClick={() => iniciarProyecto(cotizacion)}
                                      className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700"
                                      icon={<FaPlay />}
                                      text="Iniciar"
                                    />
                                  )}

                                  {["proceso", "en_proceso"].includes(cotizacion.estado) && (
                                    <ActionButton
                                      onClick={() => programarInstalacion(cotizacion)}
                                      className="bg-violet-50 hover:bg-violet-100 border border-violet-200 text-violet-700"
                                      icon={<FaTools />}
                                      text="Instalación"
                                    />
                                  )}

                                  {[
                                    "proceso",
                                    "en_proceso",
                                    "instalacion",
                                    "instalacion_programada",
                                  ].includes(cotizacion.estado) && (
                                    <ActionButton
                                      onClick={() => abrirFinalizacion(cotizacion)}
                                      className={theme.successBtn}
                                      icon={<FaFlagCheckered />}
                                      text="Finalizar"
                                    />
                                  )}
                                </div>

                                <div className="grid grid-cols-2 gap-2 mt-2">
                                  <IconButton
                                    onClick={() => resetEstado(cotizacion)}
                                    className={theme.ghostBtn}
                                    title="Reiniciar"
                                    icon={<FaUndo />}
                                  />
                                  <IconButton
                                    onClick={() => rechazarCotizacion(cotizacion)}
                                    className={theme.dangerBtn}
                                    title="Rechazar"
                                    icon={<FaTimes />}
                                  />
                                  <IconButton
                                    onClick={() => eliminarCotizacion(cotizacion)}
                                    className={theme.ghostBtn}
                                    title="Eliminar"
                                    icon={<FaTrash />}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </article>
              );
            })}
          </section>
        )}
      </div>

      {modalCotizacion && cotizacionActiva && (
        <Overlay onClose={cerrarCotizacion} theme={theme}>
          <div className={`${theme.card} rounded-[30px] w-full max-w-5xl overflow-hidden`}>
            <div className="p-6 md:p-7 border-b border-slate-200/80 flex items-start justify-between gap-4">
              <div>
                <p className="text-sky-500 text-xs font-extrabold uppercase tracking-[0.35em]">
                  Macro · Propuesta comercial
                </p>
                <h2 className={`text-2xl md:text-3xl font-black mt-3 ${theme.title}`}>
                  {cotizacionActiva.nombre || "Proyecto"}
                </h2>
                <p className={`${theme.muted} mt-2`}>
                  Define precio, anticipo, tiempos y condiciones para enviar o modificar la propuesta.
                </p>
              </div>

              <button
                onClick={cerrarCotizacion}
                className={`w-11 h-11 rounded-2xl flex items-center justify-center ${theme.ghostBtn}`}
              >
                <FaTimes />
              </button>
            </div>

            <div className="p-6 md:p-7 space-y-6 max-h-[82vh] overflow-y-auto">
              {cotizacionActiva.mensajeCliente && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-amber-700 font-black text-sm uppercase tracking-[0.18em]">
                    Comentario del cliente
                  </p>
                  <p className="text-amber-900 mt-2">
                    {cotizacionActiva.mensajeCliente}
                  </p>
                </div>
              )}

              <div className="grid md:grid-cols-3 gap-4">
                <SmallPanel
                  theme={theme}
                  label="Fecha solicitada"
                  value={formatearFechaSoloDia(
                    obtenerFechaDeseadaCliente(cotizacionActiva)
                  )}
                />
                <SmallPanel
                  theme={theme}
                  label="Entrega estimada"
                  value={
                    fechaEntregaEstimada
                      ? formatearFechaSoloDia(fechaEntregaEstimada)
                      : "Sin definir"
                  }
                />
                <div className={`rounded-2xl p-4 ${calcularEstadoEntrega(fechaEntregaEstimada)?.clase || theme.cardMuted}`}>
                  <p className="text-xs uppercase tracking-[0.18em] font-bold opacity-70">
                    Tiempo restante
                  </p>
                  <p className="mt-2 font-black">
                    {calcularEstadoEntrega(fechaEntregaEstimada)?.texto ||
                      "Sin fecha de entrega"}
                  </p>
                </div>
              </div>

              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-5">
                  <div className="grid md:grid-cols-2 gap-4">
                    <FieldCard label="Precio total" icon={<FaDollarSign />} theme={theme}>
                      <input
                        type="number"
                        value={presupuestoAdmin}
                        onChange={(e) => setPresupuestoAdmin(e.target.value)}
                        className={`${theme.input} px-4 py-3.5`}
                        placeholder="Ej. 25000"
                      />
                    </FieldCard>

                    <FieldCard label="Porcentaje de anticipo" icon={<FaDollarSign />} theme={theme}>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={porcentajeAnticipo}
                        onChange={(e) => setPorcentajeAnticipo(e.target.value)}
                        className={`${theme.input} px-4 py-3.5`}
                      />
                    </FieldCard>

                    <FieldCard label="Tiempo estimado" icon={<FaClock />} theme={theme}>
                      <input
                        value={tiempoEstimado}
                        onChange={(e) => setTiempoEstimado(e.target.value)}
                        className={`${theme.input} px-4 py-3.5`}
                        placeholder="Ej. 15 días"
                      />
                    </FieldCard>

                    <FieldCard label="Fecha estimada de entrega" icon={<FaFlagCheckered />} theme={theme}>
                      <input
                        type="date"
                        value={fechaEntregaEstimada}
                        onChange={(e) => setFechaEntregaEstimada(e.target.value)}
                        className={`${theme.input} px-4 py-3.5`}
                      />
                    </FieldCard>

                    <FieldCard label="Garantía" icon={<FaShieldAlt />} theme={theme}>
                      <input
                        value={garantia}
                        onChange={(e) => setGarantia(e.target.value)}
                        className={`${theme.input} px-4 py-3.5`}
                        placeholder="Ej. 12 meses"
                      />
                    </FieldCard>
                  </div>

                  <FieldCard label="Observaciones" icon={<FaEdit />} theme={theme}>
                    <textarea
                      rows={6}
                      value={observacionesAdmin}
                      onChange={(e) => setObservacionesAdmin(e.target.value)}
                      className={`${theme.input} px-4 py-3.5 resize-none`}
                      placeholder="Alcances, condiciones, entregables, soporte, instalación, etc."
                    />
                  </FieldCard>
                </div>

                <div className="space-y-4">
                  <ResumeCard
                    theme={theme}
                    title="Anticipo"
                    value={formatoDinero(montoAnticipo)}
                  />
                  <ResumeCard
                    theme={theme}
                    title="Saldo pendiente"
                    value={formatoDinero(saldoPendiente)}
                  />
                  <ResumeCard
                    theme={theme}
                    title="Versión"
                    value={
                      cotizacionActiva.propuestaActual?.version ||
                      cotizacionActiva.versionPropuesta ||
                      (tienePropuesta(cotizacionActiva) ? 1 : "Nueva")
                    }
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
                  {error}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={enviarPropuesta}
                  disabled={procesando}
                  className={`flex-1 rounded-2xl px-5 py-4 font-black flex items-center justify-center gap-2 transition ${theme.primaryBtn} disabled:opacity-60`}
                >
                  {procesando ? (
                    <FaSyncAlt className="animate-spin" />
                  ) : (
                    <FaPaperPlane />
                  )}

                  {tienePropuesta(cotizacionActiva)
                    ? "Guardar y enviar modificación"
                    : "Enviar propuesta"}
                </button>

                <button
                  onClick={cerrarCotizacion}
                  className={`sm:w-auto rounded-2xl px-5 py-4 font-bold transition ${theme.ghostBtn}`}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </Overlay>
      )}

      {historialOpen && cotizacionHistorial && (
        <Overlay onClose={() => setHistorialOpen(false)} theme={theme}>
          <div className={`${theme.card} rounded-[30px] w-full max-w-3xl overflow-hidden`}>
            <div className="p-6 md:p-7 border-b border-slate-200/80 flex items-start justify-between gap-4">
              <div>
                <p className="text-sky-500 text-xs font-extrabold uppercase tracking-[0.35em]">
                  Macro · Historial
                </p>
                <h2 className={`text-2xl font-black mt-3 ${theme.title}`}>
                  Historial del proyecto
                </h2>
                <p className={`${theme.muted} mt-2`}>
                  {cotizacionHistorial.nombre || "Cotización"}
                </p>
              </div>

              <button
                onClick={() => setHistorialOpen(false)}
                className={`w-11 h-11 rounded-2xl flex items-center justify-center ${theme.ghostBtn}`}
              >
                <FaTimes />
              </button>
            </div>

            <div className="p-6 md:p-7 max-h-[78vh] overflow-y-auto">
              {obtenerHistorialVisible(cotizacionHistorial).length === 0 ? (
                <div className={`rounded-2xl p-10 text-center ${theme.cardSoft}`}>
                  <FaHistory className="text-3xl text-sky-500 mx-auto" />
                  <p className={`${theme.muted} mt-4`}>
                    Todavía no hay movimientos registrados.
                  </p>
                </div>
              ) : (
                <div className="relative pl-4">
                  <div className="absolute left-[12px] top-0 bottom-0 w-px bg-sky-200" />
                  <div className="space-y-5">
                    {obtenerHistorialVisible(cotizacionHistorial).map(
                      (evento, indice) => (
                        <div
                          key={`${evento.tipo}-${obtenerMillis(evento.fecha)}-${indice}`}
                          className="relative pl-8"
                        >
                          <div className="absolute left-0 top-3 w-6 h-6 rounded-full bg-sky-500 shadow-md shadow-sky-500/20 border-4 border-white" />

                          <div className={`${theme.cardSoft} rounded-2xl p-4 md:p-5`}>
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                              <div>
                                <h3 className={`font-black ${theme.title}`}>
                                  {evento.titulo}
                                </h3>
                                {evento.descripcion && (
                                  <p className={`${theme.text} mt-2 leading-relaxed`}>
                                    {evento.descripcion}
                                  </p>
                                )}
                              </div>

                              <span className="px-3 py-1 rounded-full bg-sky-100 text-sky-700 text-xs font-bold whitespace-nowrap">
                                {evento.actor === "cliente" ? "Cliente" : "Macro"}
                              </span>
                            </div>

                            <p className={`${theme.muted} text-sm mt-3`}>
                              {formatearFecha(evento.fecha)}
                            </p>

                            {evento.fechaInicioInstalacion &&
                              evento.fechaFinInstalacion && (
                                <p className="text-violet-600 text-sm mt-2 font-semibold">
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
        </Overlay>
      )}

      {galeriaOpen && (
        <div className={`fixed inset-0 z-[110] ${theme.modalBg} backdrop-blur-sm p-4 flex items-center justify-center`}>
          <div className="absolute inset-0" onClick={() => setGaleriaOpen(false)} />

          <div className="relative max-w-6xl w-full">
            <button
              onClick={() => setGaleriaOpen(false)}
              className={`absolute -top-14 right-0 w-11 h-11 rounded-2xl flex items-center justify-center ${theme.ghostBtn}`}
            >
              <FaTimes />
            </button>

            <div className={`${theme.card} rounded-[28px] p-4 md:p-5`}>
              <div className="relative rounded-[24px] overflow-hidden bg-slate-100 min-h-[300px] flex items-center justify-center">
                <img
                  src={imagenesActivas[indiceImagen]}
                  alt="Proyecto"
                  className="w-full max-h-[75vh] object-contain"
                />

                {imagenesActivas.length > 1 && (
                  <>
                    <button
                      onClick={() =>
                        setIndiceImagen((prev) =>
                          prev === 0 ? imagenesActivas.length - 1 : prev - 1
                        )
                      }
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 text-slate-700 shadow-lg flex items-center justify-center"
                    >
                      <FaChevronLeft />
                    </button>

                    <button
                      onClick={() =>
                        setIndiceImagen((prev) =>
                          prev === imagenesActivas.length - 1 ? 0 : prev + 1
                        )
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 text-slate-700 shadow-lg flex items-center justify-center"
                    >
                      <FaChevronRight />
                    </button>
                  </>
                )}
              </div>

              <div className="flex flex-wrap justify-center gap-3 mt-4">
                {imagenesActivas.map((img, i) => (
                  <button
                    key={`${img}-${i}`}
                    onClick={() => setIndiceImagen(i)}
                    className={`w-16 h-16 rounded-2xl overflow-hidden border-2 ${
                      i === indiceImagen ? "border-sky-500" : "border-transparent"
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Miniatura ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {modalFinalizar && cotizacionFinalizar && (
        <Overlay onClose={cerrarFinalizacion} theme={theme}>
          <div className={`${theme.card} rounded-[30px] w-full max-w-3xl overflow-hidden`}>
            <div className="p-6 md:p-7 border-b border-slate-200/80 flex items-start justify-between gap-4">
              <div>
                <p className="text-emerald-500 text-xs font-extrabold uppercase tracking-[0.35em]">
                  Macro · Cierre de proyecto
                </p>
                <h2 className={`text-2xl font-black mt-3 ${theme.title}`}>
                  {cotizacionFinalizar.nombre || "Proyecto"}
                </h2>
                <p className={`${theme.muted} mt-2`}>
                  Sube evidencias del proyecto terminado para guardarlas en el expediente del cliente.
                </p>
              </div>

              <button
                onClick={cerrarFinalizacion}
                className={`w-11 h-11 rounded-2xl flex items-center justify-center ${theme.ghostBtn}`}
              >
                <FaTimes />
              </button>
            </div>

            <div className="p-6 md:p-7">
              <label className="block border-2 border-dashed border-sky-300 rounded-[26px] p-8 text-center cursor-pointer bg-sky-50 hover:bg-sky-100 transition">
                <FaImages className="text-4xl text-sky-500 mx-auto" />
                <p className="font-black text-slate-900 mt-4">
                  Agregar fotografías finales
                </p>
                <p className="text-slate-500 mt-2 text-sm">
                  Máximo 6 imágenes · 5 MB cada una
                </p>

                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={seleccionarFotosFinales}
                />
              </label>

              {previewsFinales.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5">
                  {previewsFinales.map((url, i) => (
                    <div
                      key={url}
                      className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200"
                    >
                      <img
                        src={url}
                        alt={`Final ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => eliminarFotoFinal(i)}
                        className="absolute top-2 right-2 w-8 h-8 rounded-xl bg-slate-900/80 text-white flex items-center justify-center"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {errorFinalizar && (
                <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
                  {errorFinalizar}
                </div>
              )}

              <button
                onClick={terminarProyecto}
                disabled={subiendoFinales}
                className={`w-full mt-6 rounded-2xl px-5 py-4 font-black flex items-center justify-center gap-2 transition ${theme.successBtn} disabled:opacity-60`}
              >
                {subiendoFinales ? (
                  <FaSyncAlt className="animate-spin" />
                ) : (
                  <FaFlagCheckered />
                )}

                {subiendoFinales
                  ? "Subiendo y finalizando..."
                  : "Finalizar proyecto"}
              </button>
            </div>
          </div>
        </Overlay>
      )}
    </div>
  );
}

function Overlay({ children, onClose, theme }) {
  return (
    <div className={`fixed inset-0 z-[100] ${theme.modalBg} backdrop-blur-sm p-4 overflow-y-auto`}>
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative min-h-full flex items-start justify-center py-4">
        {children}
      </div>
    </div>
  );
}

function FieldCard({ label, icon, children, theme }) {
  return (
    <div className={`${theme.cardSoft} rounded-[24px] p-4`}>
      <label className="block">
        <span className={`text-sm font-bold mb-3 flex items-center gap-2 ${theme.text}`}>
          <span className="text-sky-500">{icon}</span>
          {label}
        </span>
        {children}
      </label>
    </div>
  );
}

function ResumeCard({ title, value, theme }) {
  return (
    <div className={`${theme.cardSoft} rounded-[24px] p-5`}>
      <p className={`text-xs uppercase tracking-[0.2em] font-bold ${theme.muted}`}>
        {title}
      </p>
      <p className={`text-2xl font-black mt-3 ${theme.title}`}>
        {value}
      </p>
    </div>
  );
}

function StatCard({ icon, label, value, theme, accent = false }) {
  return (
    <div className={`rounded-[24px] p-4 ${accent ? "bg-red-50 border border-red-200" : theme.cardSoft}`}>
      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${accent ? "bg-red-100 text-red-600" : "bg-sky-100 text-sky-600"}`}>
        {icon}
      </div>
      <p className={`text-xs font-bold uppercase tracking-[0.16em] mt-4 ${theme.muted}`}>
        {label}
      </p>
      <p className={`text-2xl md:text-3xl font-black mt-2 ${accent ? "text-red-600" : theme.title}`}>
        {value}
      </p>
    </div>
  );
}

function MiniBadge({ label, value, theme }) {
  return (
    <div className={`${theme.cardSoft} rounded-2xl px-4 py-3 min-w-[120px]`}>
      <p className={`text-[11px] uppercase tracking-[0.18em] font-bold ${theme.muted}`}>
        {label}
      </p>
      <p className={`text-sm font-black mt-1 ${theme.title}`}>
        {value}
      </p>
    </div>
  );
}

function SummaryPill({ text, theme, color = "default" }) {
  const styles =
    color === "green"
      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
      : `${theme.cardMuted} ${theme.text}`;

  return (
    <span className={`px-4 py-2 rounded-2xl text-sm font-bold ${styles}`}>
      {text}
    </span>
  );
}

function InfoCapsule({ icon, text, theme, accent = "default" }) {
  const style =
    accent === "green"
      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
      : `${theme.cardMuted} ${theme.text}`;

  return (
    <div className={`px-3 py-2 rounded-2xl text-sm flex items-center gap-2 ${style}`}>
      <span className={accent === "green" ? "text-emerald-600" : "text-sky-500"}>
        {icon}
      </span>
      <span>{text}</span>
    </div>
  );
}

function SmallPanel({ label, value, theme }) {
  return (
    <div className={`${theme.cardMuted} rounded-2xl p-4`}>
      <p className="text-xs uppercase tracking-[0.18em] font-bold text-slate-500">
        {label}
      </p>
      <p className={`mt-2 font-black ${theme.title}`}>
        {value || "—"}
      </p>
    </div>
  );
}

function ActionButton({ onClick, className, icon, text }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl px-4 py-3 font-bold flex items-center justify-center gap-2 transition ${className}`}
    >
      {icon}
      <span>{text}</span>
    </button>
  );
}

function IconButton({ onClick, className, icon, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`rounded-2xl px-4 py-3 font-bold flex items-center justify-center gap-2 transition ${className}`}
    >
      {icon}
      <span className="text-sm">{title}</span>
    </button>
  );
}

export default CotizacionesAdmin;