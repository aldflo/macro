import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useOutletContext,
} from "react-router-dom";

import {
  EmailAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";

import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import {
  FaArrowLeft,
  FaCheck,
  FaCheckCircle,
  FaCode,
  FaEnvelope,
  FaLock,
  FaMoon,
  FaPhone,
  FaSave,
  FaShieldAlt,
  FaSun,
  FaUser,
} from "react-icons/fa";

import {
  auth,
  db,
} from "../firebase.config";


function Perfil() {
  const navigate =
    useNavigate();

  const {
    modoOscuro,
    actualizarTema,
  } =
    useOutletContext() || {};


  /* ======================================================
     USUARIO
  ====================================================== */

  const [
    usuarioAuth,
    setUsuarioAuth,
  ] = useState(null);


  /* ======================================================
     PERFIL
  ====================================================== */

  const [
    nombre,
    setNombre,
  ] = useState("");

  const [
    correo,
    setCorreo,
  ] = useState("");

  const [
    telefono,
    setTelefono,
  ] = useState("");


  /* ======================================================
     CONTRASEÑA
  ====================================================== */

  const [
    passwordActual,
    setPasswordActual,
  ] = useState("");

  const [
    passwordNueva,
    setPasswordNueva,
  ] = useState("");

  const [
    passwordConfirmar,
    setPasswordConfirmar,
  ] = useState("");


  /* ======================================================
     ESTADOS
  ====================================================== */

  const [
    cargando,
    setCargando,
  ] = useState(true);

  const [
    guardando,
    setGuardando,
  ] = useState(false);

  const [
    cambiandoPassword,
    setCambiandoPassword,
  ] = useState(false);

  const [
    cambiandoTema,
    setCambiandoTema,
  ] = useState(false);

  const [
    mensaje,
    setMensaje,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");


  /* ======================================================
     TEMA
  ====================================================== */

  const [
    temaSeleccionado,
    setTemaSeleccionado,
  ] = useState(
    modoOscuro
      ? "oscuro"
      : "claro"
  );


  useEffect(() => {
    setTemaSeleccionado(
      modoOscuro
        ? "oscuro"
        : "claro"
    );

  }, [
    modoOscuro,
  ]);


  /* ======================================================
     CARGAR PERFIL
  ====================================================== */

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,

        async (user) => {
          if (!user) {
            setUsuarioAuth(
              null
            );

            setCargando(
              false
            );

            return;
          }


          try {
            setUsuarioAuth(
              user
            );


            const referencia =
              doc(
                db,
                "users",
                user.uid
              );


            const snapshot =
              await getDoc(
                referencia
              );


            if (
              snapshot.exists()
            ) {
              const data =
                snapshot.data();


              setNombre(
                data.nombre ||
                ""
              );


              setCorreo(
                data.correo ||
                user.email ||
                ""
              );


              setTelefono(
                data.telefono ||
                ""
              );

            } else {
              setCorreo(
                user.email ||
                ""
              );
            }

          } catch (error) {
            console.error(
              "Error cargando perfil:",
              error
            );


            setError(
              "No se pudo cargar la información del perfil."
            );

          } finally {
            setCargando(
              false
            );
          }
        }
      );


    return () =>
      unsubscribe();

  }, []);


  /* ======================================================
     GUARDAR PERFIL
  ====================================================== */

  const guardarPerfil =
    async () => {
      if (
        !usuarioAuth
      ) {
        return;
      }


      setMensaje("");
      setError("");


      if (
        nombre
          .trim()
          .length <
        3
      ) {
        setError(
          "Escribe tu nombre completo."
        );

        return;
      }


      const telefonoLimpio =
        telefono.replace(
          /\D/g,
          ""
        );


      if (
        telefonoLimpio &&
        telefonoLimpio.length <
          10
      ) {
        setError(
          "Escribe un teléfono válido de al menos 10 dígitos."
        );

        return;
      }


      try {
        setGuardando(
          true
        );


        await setDoc(
          doc(
            db,
            "users",
            usuarioAuth.uid
          ),

          {
            uid:
              usuarioAuth.uid,

            nombre:
              nombre.trim(),

            correo:
              (
                correo ||
                usuarioAuth.email ||
                ""
              )
                .trim()
                .toLowerCase(),

            telefono:
              telefonoLimpio,

            fechaActualizacion:
              serverTimestamp(),
          },

          {
            merge:
              true,
          }
        );


        setTelefono(
          telefonoLimpio
        );


        setMensaje(
          "Perfil actualizado correctamente."
        );

      } catch (error) {
        console.error(
          "Error actualizando perfil:",
          error
        );


        setError(
          "No se pudieron guardar los cambios."
        );

      } finally {
        setGuardando(
          false
        );
      }
    };


  /* ======================================================
     CAMBIAR APARIENCIA
  ====================================================== */

  const cambiarTemaPerfil =
    async (
      nuevoTema
    ) => {
      if (
        !usuarioAuth ||
        cambiandoTema
      ) {
        return;
      }


      if (
        nuevoTema !==
          "claro" &&
        nuevoTema !==
          "oscuro"
      ) {
        return;
      }


      setMensaje("");
      setError("");


      actualizarTema?.(
        nuevoTema
      );


      setTemaSeleccionado(
        nuevoTema
      );


      try {
        setCambiandoTema(
          true
        );


        await setDoc(
          doc(
            db,
            "users",
            usuarioAuth.uid
          ),

          {
            temaPreferido:
              nuevoTema,

            fechaActualizacion:
              serverTimestamp(),
          },

          {
            merge:
              true,
          }
        );


        setMensaje(
          nuevoTema ===
            "oscuro"
            ? "Modo oscuro activado."
            : "Modo claro activado."
        );

      } catch (error) {
        console.error(
          "Error guardando apariencia:",
          error
        );


        setError(
          "El tema cambió en este dispositivo, pero no pudimos guardar la preferencia en tu cuenta."
        );

      } finally {
        setCambiandoTema(
          false
        );
      }
    };


  /* ======================================================
     CAMBIAR CONTRASEÑA
  ====================================================== */

  const cambiarPassword =
    async () => {
      if (
        !usuarioAuth
      ) {
        return;
      }


      setMensaje("");
      setError("");


      if (
        !usuarioAuth.email
      ) {
        setError(
          "Esta cuenta no tiene un correo disponible para cambiar la contraseña."
        );

        return;
      }


      if (
        !passwordActual
      ) {
        setError(
          "Escribe tu contraseña actual."
        );

        return;
      }


      if (
        passwordNueva.length <
        6
      ) {
        setError(
          "La nueva contraseña debe tener al menos 6 caracteres."
        );

        return;
      }


      if (
        passwordNueva !==
        passwordConfirmar
      ) {
        setError(
          "Las nuevas contraseñas no coinciden."
        );

        return;
      }


      try {
        setCambiandoPassword(
          true
        );


        const credencial =
          EmailAuthProvider.credential(
            usuarioAuth.email,
            passwordActual
          );


        await reauthenticateWithCredential(
          usuarioAuth,
          credencial
        );


        await updatePassword(
          usuarioAuth,
          passwordNueva
        );


        setPasswordActual("");
        setPasswordNueva("");
        setPasswordConfirmar("");


        setMensaje(
          "Contraseña actualizada correctamente."
        );

      } catch (error) {
        console.error(
          "Error cambiando contraseña:",
          error
        );


        if (
          error.code ===
          "auth/invalid-credential" ||
          error.code ===
          "auth/wrong-password"
        ) {
          setError(
            "La contraseña actual no es correcta."
          );

        } else if (
          error.code ===
          "auth/requires-recent-login"
        ) {
          setError(
            "Por seguridad, vuelve a iniciar sesión antes de cambiar tu contraseña."
          );

        } else {
          setError(
            "No se pudo cambiar la contraseña."
          );
        }

      } finally {
        setCambiandoPassword(
          false
        );
      }
    };


  /* ======================================================
     INICIALES
  ====================================================== */

  const obtenerIniciales =
    () => {
      if (
        !nombre.trim()
      ) {
        return "M";
      }


      const partes =
        nombre
          .trim()
          .split(/\s+/)
          .filter(Boolean);


      if (
        partes.length ===
        1
      ) {
        return partes[0]
          .slice(
            0,
            2
          )
          .toUpperCase();
      }


      return (
        `${partes[0][0]}${
          partes[
            partes.length -
            1
          ][0]
        }`
      ).toUpperCase();
    };


  /* ======================================================
     LOADING
  ====================================================== */

  if (
    cargando
  ) {
    return (
      <div
        className={`
          min-h-screen

          flex
          items-center
          justify-center

          transition-colors
          duration-300

          ${
            modoOscuro
              ? `
                bg-[#050b18]
                text-white
              `
              : `
                bg-[#f4f8fc]
                text-slate-900
              `
          }
        `}
      >

        <div className="text-center">

          <div
            className={`
              w-12
              h-12

              border-4
              border-t-sky-500

              rounded-full
              animate-spin

              mx-auto

              ${
                modoOscuro
                  ? "border-slate-800"
                  : "border-sky-100"
              }
            `}
          />


          <p
            className={`
              mt-4

              ${
                modoOscuro
                  ? "text-slate-500"
                  : "text-slate-500"
              }
            `}
          >
            Cargando perfil...
          </p>

        </div>

      </div>
    );
  }


  /* ======================================================
     SIN USUARIO
  ====================================================== */

  if (
    !usuarioAuth
  ) {
    return (
      <div
        className={`
          min-h-screen

          flex
          items-center
          justify-center

          px-5

          ${
            modoOscuro
              ? `
                bg-[#050b18]
                text-white
              `
              : `
                bg-[#f4f8fc]
                text-slate-900
              `
          }
        `}
      >

        <div
          className={`
            max-w-md
            w-full

            border

            rounded-[32px]

            p-9

            text-center

            ${
              modoOscuro
                ? `
                  bg-[#0b1424]
                  border-slate-800
                `
                : `
                  bg-white
                  border-sky-100
                  shadow-xl
                  shadow-sky-950/5
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

              border
              border-sky-500/20

              flex
              items-center
              justify-center

              mx-auto
            "
          >

            <FaShieldAlt
              className="
                text-sky-500
                text-2xl
              "
            />

          </div>


          <p
            className="
              text-xs
              uppercase
              tracking-[0.22em]
              text-sky-500
              font-black
              mt-6
            "
          >
            Macro
          </p>


          <h1
            className="
              text-3xl
              font-black
              mt-2
            "
          >
            Inicia sesión
          </h1>


          <p
            className={`
              mt-3

              ${
                modoOscuro
                  ? "text-slate-400"
                  : "text-slate-500"
              }
            `}
          >
            Accede a tu cuenta para consultar y configurar tu perfil.
          </p>


          <button
            type="button"
            onClick={() =>
              navigate(
                "/login"
              )
            }
            className="
              mt-7

              w-full

              bg-sky-500
              hover:bg-sky-600

              text-white

              px-6
              py-4

              rounded-2xl

              font-bold

              transition
            "
          >
            Iniciar sesión
          </button>

        </div>

      </div>
    );
  }


  /* ======================================================
     RENDER
  ====================================================== */

  return (
    <div
      className={`
        min-h-screen

        px-4
        sm:px-5
        md:px-7

        py-8

        transition-colors
        duration-300

        ${
          modoOscuro
            ? `
              bg-[#050b18]
              text-white
            `
            : `
              bg-[#f4f8fc]
              text-slate-950
            `
        }
      `}
    >

      <div
        className="
          max-w-6xl
          mx-auto
        "
      >

        {/* ==================================================
            VOLVER
        ================================================== */}

        <button
          type="button"
          onClick={() =>
            navigate(-1)
          }
          className={`
            flex
            items-center
            gap-2

            text-sm
            font-semibold

            transition

            ${
              modoOscuro
                ? `
                  text-slate-400
                  hover:text-white
                `
                : `
                  text-slate-500
                  hover:text-slate-900
                `
            }
          `}
        >

          <FaArrowLeft />

          Volver

        </button>


        {/* ==================================================
            CABECERA
        ================================================== */}

        <section
          className={`
            relative

            mt-6

            overflow-hidden

            border

            rounded-[34px]

            ${
              modoOscuro
                ? `
                  bg-gradient-to-br
                  from-[#0b1424]
                  via-[#08111f]
                  to-[#062747]

                  border-slate-800
                `
                : `
                  bg-gradient-to-br
                  from-white
                  via-white
                  to-sky-50

                  border-sky-100

                  shadow-sm
                `
            }
          `}
        >

          {/* DECORACIÓN */}

          <div
            className="
              absolute
              -right-24
              -top-24

              w-80
              h-80

              rounded-full

              bg-sky-500/15

              blur-3xl

              pointer-events-none
            "
          />


          <div
            className="
              absolute
              right-32
              -bottom-32

              w-64
              h-64

              rounded-full

              bg-cyan-400/10

              blur-3xl

              pointer-events-none
            "
          />


          <div
            className="
              relative

              p-6
              sm:p-8
              md:p-10
            "
          >

            <div
              className="
                flex
                flex-col
                md:flex-row

                md:items-center

                gap-6
              "
            >

              {/* AVATAR */}

              <div
                className="
                  relative

                  w-24
                  h-24

                  shrink-0

                  rounded-[28px]

                  bg-gradient-to-br
                  from-sky-400
                  via-sky-500
                  to-blue-700

                  text-white

                  flex
                  items-center
                  justify-center

                  text-3xl
                  font-black

                  shadow-xl
                  shadow-sky-500/20
                "
              >

                {obtenerIniciales()}


                <div
                  className="
                    absolute
                    -bottom-2
                    -right-2

                    w-9
                    h-9

                    rounded-xl

                    bg-[#071221]

                    border-2
                    border-white

                    text-sky-400

                    flex
                    items-center
                    justify-center

                    text-sm
                  "
                >

                  <FaCode />

                </div>

              </div>


              {/* INFORMACIÓN */}

              <div
                className="
                  min-w-0
                  flex-1
                "
              >

                <p
                  className="
                    text-xs
                    uppercase

                    tracking-[0.25em]

                    text-sky-500

                    font-black
                  "
                >
                  Cuenta Macro
                </p>


                <h1
                  className="
                    text-3xl
                    md:text-4xl

                    font-black

                    tracking-[-0.04em]

                    mt-2

                    break-words
                  "
                >
                  {nombre ||
                    "Mi perfil"}
                </h1>


                <p
                  className={`
                    mt-2

                    text-sm

                    ${
                      modoOscuro
                        ? "text-slate-400"
                        : "text-slate-500"
                    }
                  `}
                >
                  Administra tu información personal, seguridad y preferencias.
                </p>


                <div
                  className={`
                    flex
                    flex-wrap

                    gap-x-5
                    gap-y-2

                    mt-5

                    text-sm

                    ${
                      modoOscuro
                        ? "text-slate-400"
                        : "text-slate-600"
                    }
                  `}
                >

                  {correo && (

                    <span
                      className="
                        flex
                        items-center
                        gap-2
                      "
                    >

                      <FaEnvelope
                        className="
                          text-sky-500
                        "
                      />

                      {correo}

                    </span>

                  )}


                  {telefono && (

                    <span
                      className="
                        flex
                        items-center
                        gap-2
                      "
                    >

                      <FaPhone
                        className="
                          text-sky-500
                        "
                      />

                      {telefono}

                    </span>

                  )}

                </div>

              </div>


              {/* ESTADO */}

              <div
                className={`
                  self-start

                  inline-flex
                  items-center
                  gap-2

                  px-4
                  py-2.5

                  rounded-full

                  border

                  text-sm
                  font-semibold

                  ${
                    modoOscuro
                      ? `
                        bg-emerald-500/10
                        border-emerald-500/20
                        text-emerald-400
                      `
                      : `
                        bg-emerald-50
                        border-emerald-200
                        text-emerald-700
                      `
                  }
                `}
              >

                <span
                  className="
                    w-2
                    h-2

                    rounded-full

                    bg-emerald-500
                  "
                />

                Cuenta activa

              </div>

            </div>

          </div>

        </section>


        {/* ==================================================
            MENSAJES
        ================================================== */}

        {mensaje && (

          <div
            className={`
              mt-6

              border
              border-emerald-500/30

              bg-emerald-500/10

              rounded-2xl

              p-4

              flex
              items-center
              gap-3

              ${
                modoOscuro
                  ? "text-emerald-300"
                  : "text-emerald-700"
              }
            `}
          >

            <FaCheckCircle
              className="
                shrink-0
              "
            />

            {mensaje}

          </div>

        )}


        {error && (

          <div
            className={`
              mt-6

              bg-red-500/10

              border
              border-red-500/30

              rounded-2xl

              p-4

              ${
                modoOscuro
                  ? "text-red-300"
                  : "text-red-700"
              }
            `}
          >
            {error}
          </div>

        )}


        {/* ==================================================
            GRID PRINCIPAL
        ================================================== */}

        <div
          className="
            grid

            lg:grid-cols-[1.25fr_.75fr]

            gap-7

            mt-7
          "
        >

          {/* ==================================================
              DATOS PERSONALES
          ================================================== */}

          <section
            className={
              cardClass(
                modoOscuro
              )
            }
          >

            <CabeceraSeccion
              modoOscuro={
                modoOscuro
              }
              icon={
                <FaUser />
              }
              titulo="Datos personales"
              descripcion="Información que Macro utilizará para tu cuenta, solicitudes, compras y proyectos."
            />


            <div
              className="
                grid
                md:grid-cols-2

                gap-5

                mt-8
              "
            >

              <Campo
                modoOscuro={
                  modoOscuro
                }
                titulo="Nombre completo"
                icon={
                  <FaUser />
                }
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
                  placeholder="Tu nombre completo"
                  className={
                    inputClass(
                      modoOscuro
                    )
                  }
                />

              </Campo>


              <Campo
                modoOscuro={
                  modoOscuro
                }
                titulo="Teléfono"
                icon={
                  <FaPhone />
                }
              >

                <input
                  type="tel"
                  value={
                    telefono
                  }
                  onChange={(e) =>
                    setTelefono(
                      e.target.value
                    )
                  }
                  placeholder="9811234567"
                  className={
                    inputClass(
                      modoOscuro
                    )
                  }
                />

              </Campo>

            </div>


            <div className="mt-5">

              <Campo
                modoOscuro={
                  modoOscuro
                }
                titulo="Correo electrónico"
                icon={
                  <FaEnvelope />
                }
              >

                <input
                  type="email"
                  value={
                    correo
                  }
                  readOnly
                  className={`
                    ${inputClass(
                      modoOscuro
                    )}

                    opacity-70
                    cursor-not-allowed
                  `}
                />


                <p
                  className={`
                    text-xs
                    mt-2

                    ${
                      modoOscuro
                        ? "text-slate-600"
                        : "text-slate-400"
                    }
                  `}
                >
                  Este correo está asociado a tu acceso a Macro y no puede modificarse desde esta pantalla.
                </p>

              </Campo>

            </div>


            <div
              className="
                flex
                justify-end

                mt-7
              "
            >

              <button
                type="button"
                onClick={
                  guardarPerfil
                }
                disabled={
                  guardando
                }
                className="
                  w-full
                  sm:w-auto

                  bg-sky-500
                  hover:bg-sky-600

                  text-white

                  px-7
                  py-3.5

                  rounded-2xl

                  font-bold

                  flex
                  items-center
                  justify-center
                  gap-2

                  disabled:opacity-50
                  disabled:cursor-not-allowed

                  transition
                "
              >

                <FaSave />

                {guardando
                  ? "Guardando..."
                  : "Guardar cambios"
                }

              </button>

            </div>

          </section>


          {/* ==================================================
              APARIENCIA
          ================================================== */}

          <section
            className={
              cardClass(
                modoOscuro
              )
            }
          >

            <CabeceraSeccion
              modoOscuro={
                modoOscuro
              }
              icon={
                modoOscuro
                  ? <FaMoon />
                  : <FaSun />
              }
              titulo="Apariencia"
              descripcion="Personaliza cómo quieres ver Macro."
            />


            <div
              className="
                grid
                grid-cols-2

                gap-4

                mt-8
              "
            >

              {/* CLARO */}

              <button
                type="button"
                onClick={() =>
                  cambiarTemaPerfil(
                    "claro"
                  )
                }
                disabled={
                  cambiandoTema
                }
                className={`
                  relative

                  min-h-[175px]

                  rounded-[24px]

                  border-2

                  p-5

                  text-left

                  transition-all
                  duration-300

                  hover:-translate-y-1

                  ${
                    temaSeleccionado ===
                    "claro"
                      ? `
                        border-sky-500

                        ring-4
                        ring-sky-500/10
                      `
                      : modoOscuro
                      ? `
                        border-slate-800
                        hover:border-slate-600
                      `
                      : `
                        border-slate-200
                        hover:border-sky-200
                      `
                  }

                  ${
                    modoOscuro
                      ? "bg-[#071221]"
                      : "bg-[#f8fbff]"
                  }
                `}
              >

                {temaSeleccionado ===
                  "claro" && (

                  <Seleccionado />

                )}


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

                    text-xl
                  "
                >

                  <FaSun />

                </div>


                <p
                  className="
                    font-black
                    mt-5
                  "
                >
                  Claro
                </p>


                <p
                  className={`
                    text-xs

                    mt-1

                    ${
                      modoOscuro
                        ? "text-slate-500"
                        : "text-slate-500"
                    }
                  `}
                >
                  Fondo claro y limpio para el uso diario.
                </p>

              </button>


              {/* OSCURO */}

              <button
                type="button"
                onClick={() =>
                  cambiarTemaPerfil(
                    "oscuro"
                  )
                }
                disabled={
                  cambiandoTema
                }
                className={`
                  relative

                  min-h-[175px]

                  rounded-[24px]

                  border-2

                  p-5

                  text-left

                  transition-all
                  duration-300

                  hover:-translate-y-1

                  ${
                    temaSeleccionado ===
                    "oscuro"
                      ? `
                        border-sky-500

                        ring-4
                        ring-sky-500/10
                      `
                      : modoOscuro
                      ? `
                        border-slate-800
                      `
                      : `
                        border-slate-200
                      `
                  }

                  bg-[#071221]

                  text-white
                `}
              >

                {temaSeleccionado ===
                  "oscuro" && (

                  <Seleccionado />

                )}


                <div
                  className="
                    w-12
                    h-12

                    rounded-2xl

                    bg-sky-500/15

                    text-sky-400

                    flex
                    items-center
                    justify-center

                    text-xl
                  "
                >

                  <FaMoon />

                </div>


                <p
                  className="
                    font-black
                    mt-5
                    text-white
                  "
                >
                  Oscuro
                </p>


                <p
                  className="
                    text-xs
                    mt-1
                    text-slate-500
                  "
                >
                  Azul oscuro con menor luminosidad.
                </p>

              </button>

            </div>


            <div
              className={`
                mt-5

                border

                rounded-2xl

                p-4

                ${
                  modoOscuro
                    ? `
                      bg-[#071221]
                      border-slate-800
                    `
                    : `
                      bg-sky-50/60
                      border-sky-100
                    `
                }
              `}
            >

              <p
                className={`
                  text-xs
                  leading-relaxed

                  ${
                    modoOscuro
                      ? "text-slate-500"
                      : "text-slate-500"
                  }
                `}
              >
                Guardaremos esta preferencia en tu cuenta para que Macro pueda utilizarla como configuración inicial cuando inicies sesión desde otro dispositivo.
              </p>

            </div>

          </section>

        </div>


        {/* ==================================================
            SEGURIDAD
        ================================================== */}

        <section
          className={`
            mt-7

            ${cardClass(
              modoOscuro
            )}
          `}
        >

          <CabeceraSeccion
            modoOscuro={
              modoOscuro
            }
            icon={
              <FaLock />
            }
            titulo="Seguridad"
            descripcion="Actualiza tu contraseña para mantener protegida tu cuenta Macro."
          />


          <div
            className="
              grid
              md:grid-cols-3

              gap-5

              mt-8
            "
          >

            <Campo
              modoOscuro={
                modoOscuro
              }
              titulo="Contraseña actual"
              icon={
                <FaLock />
              }
            >

              <input
                type="password"
                value={
                  passwordActual
                }
                onChange={(e) =>
                  setPasswordActual(
                    e.target.value
                  )
                }
                autoComplete="current-password"
                placeholder="••••••••"
                className={
                  inputClass(
                    modoOscuro
                  )
                }
              />

            </Campo>


            <Campo
              modoOscuro={
                modoOscuro
              }
              titulo="Nueva contraseña"
              icon={
                <FaLock />
              }
            >

              <input
                type="password"
                value={
                  passwordNueva
                }
                onChange={(e) =>
                  setPasswordNueva(
                    e.target.value
                  )
                }
                autoComplete="new-password"
                placeholder="Mínimo 6 caracteres"
                className={
                  inputClass(
                    modoOscuro
                  )
                }
              />

            </Campo>


            <Campo
              modoOscuro={
                modoOscuro
              }
              titulo="Confirmar contraseña"
              icon={
                <FaShieldAlt />
              }
            >

              <input
                type="password"
                value={
                  passwordConfirmar
                }
                onChange={(e) =>
                  setPasswordConfirmar(
                    e.target.value
                  )
                }
                autoComplete="new-password"
                placeholder="Repite la contraseña"
                className={
                  inputClass(
                    modoOscuro
                  )
                }
              />

            </Campo>

          </div>


          <div
            className="
              flex
              justify-end

              mt-7
            "
          >

            <button
              type="button"
              onClick={
                cambiarPassword
              }
              disabled={
                cambiandoPassword
              }
              className={`
                w-full
                sm:w-auto

                border

                px-7
                py-3.5

                rounded-2xl

                font-bold

                flex
                items-center
                justify-center
                gap-2

                disabled:opacity-50
                disabled:cursor-not-allowed

                transition

                ${
                  modoOscuro
                    ? `
                      bg-[#071221]
                      hover:bg-[#0b1b31]

                      border-slate-700
                      hover:border-sky-500/40

                      text-white
                    `
                    : `
                      bg-sky-50
                      hover:bg-sky-100

                      border-sky-200

                      text-sky-700
                    `
                }
              `}
            >

              <FaShieldAlt
                className="
                  text-sky-500
                "
              />

              {cambiandoPassword
                ? "Actualizando..."
                : "Cambiar contraseña"
              }

            </button>

          </div>

        </section>


        {/* ==================================================
            FOOTER PERFIL
        ================================================== */}

        <div
          className={`
            mt-8
            mb-3

            flex
            items-center
            justify-center

            gap-2

            text-xs

            ${
              modoOscuro
                ? "text-slate-600"
                : "text-slate-400"
            }
          `}
        >

          <FaShieldAlt />

          Tu información está protegida y asociada a tu cuenta Macro.

        </div>

      </div>

    </div>
  );
}


/* ======================================================
   SELECCIONADO
====================================================== */

function Seleccionado() {
  return (
    <div
      className="
        absolute

        top-4
        right-4

        w-7
        h-7

        rounded-full

        bg-sky-500

        text-white

        flex
        items-center
        justify-center

        text-xs
      "
    >

      <FaCheck />

    </div>
  );
}


/* ======================================================
   CABECERA SECCIÓN
====================================================== */

function CabeceraSeccion({
  modoOscuro,
  icon,
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
          w-12
          h-12

          shrink-0

          rounded-2xl

          border
          border-sky-500/20

          bg-sky-500/10

          text-sky-500

          flex
          items-center
          justify-center
        "
      >
        {icon}
      </div>


      <div>

        <h2
          className="
            text-xl
            font-black
          "
        >
          {titulo}
        </h2>


        <p
          className={`
            text-sm

            mt-1

            ${
              modoOscuro
                ? "text-slate-500"
                : "text-slate-500"
            }
          `}
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
  modoOscuro,
}) {
  return (
    <div>

      <label
        className={`
          text-sm

          flex
          items-center
          gap-2

          mb-2.5

          font-semibold

          ${
            modoOscuro
              ? "text-slate-400"
              : "text-slate-600"
          }
        `}
      >

        <span
          className="
            text-sky-500
          "
        >
          {icon}
        </span>

        {titulo}

      </label>

      {children}

    </div>
  );
}


/* ======================================================
   CARD
====================================================== */

const cardClass =
  (
    modoOscuro
  ) => `
    border

    rounded-[28px]

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
          shadow-sm
        `
    }
  `;


/* ======================================================
   INPUT
====================================================== */

const inputClass =
  (
    modoOscuro
  ) => `
    w-full

    ${
      modoOscuro
        ? `
          bg-[#071221]
          border-slate-700

          text-white

          placeholder:text-slate-600
        `
        : `
          bg-[#f8fbff]
          border-sky-100

          text-slate-900

          placeholder:text-slate-400
        `
    }

    border

    rounded-2xl

    px-4
    py-3.5

    outline-none

    focus:border-sky-500

    focus:ring-4
    focus:ring-sky-500/10

    transition
  `;


export default Perfil;