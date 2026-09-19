import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Link,
  useNavigate,
  useOutletContext,
} from "react-router-dom";

import {
  RecaptchaVerifier,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
} from "firebase/auth";

import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import {
  auth,
  db,
  provider,
} from "../firebase.config";

import {
  FaArrowLeft,
  FaArrowRight,
  FaCheckCircle,
  FaEnvelope,
  FaExclamationTriangle,
  FaEye,
  FaEyeSlash,
  FaKey,
  FaLock,
  FaPhone,
  FaRedo,
  FaShieldAlt,
  FaSms,
  FaUserLock,
} from "react-icons/fa";


/* ======================================================
   CONFIGURACIÓN
====================================================== */

const DOMINIO_INTERNO =
  "macro.local";

const SEGUNDOS_REENVIO =
  60;


/* ======================================================
   TELÉFONO
====================================================== */

const normalizarTelefonoMexico =
  (valor) => {
    const limpio =
      String(
        valor || ""
      )
        .trim()
        .replace(
          /[\s()-]/g,
          ""
        );


    if (
      limpio.startsWith("+")
    ) {
      const numeros =
        limpio
          .slice(1)
          .replace(
            /\D/g,
            ""
          );


      if (
        /^\d{10,15}$/.test(
          numeros
        )
      ) {
        return `+${numeros}`;
      }


      return null;
    }


    const soloNumeros =
      limpio.replace(
        /\D/g,
        ""
      );


    if (
      soloNumeros.length ===
      10
    ) {
      return `+52${soloNumeros}`;
    }


    if (
      soloNumeros.length ===
        12 &&
      soloNumeros.startsWith(
        "52"
      )
    ) {
      return `+${soloNumeros}`;
    }


    return null;
  };


const telefonoAEmailInterno =
  (telefonoE164) => {
    const numeros =
      String(
        telefonoE164 || ""
      ).replace(
        /\D/g,
        ""
      );


    return `${numeros}@${DOMINIO_INTERNO}`;
  };


/* ======================================================
   LOGIN
====================================================== */

function Login() {
  const {
    modoOscuro = false,
  } =
    useOutletContext() || {};


  const navigate =
    useNavigate();


  /* ======================================================
     MODOS
  ====================================================== */

  const [
    modo,
    setModo,
  ] = useState(
    "opciones"
  );


  /* ======================================================
     CORREO
  ====================================================== */

  const [
    correo,
    setCorreo,
  ] = useState("");


  const [
    passwordCorreo,
    setPasswordCorreo,
  ] = useState("");


  const [
    mostrarPasswordCorreo,
    setMostrarPasswordCorreo,
  ] = useState(false);


  /* ======================================================
     TELÉFONO
  ====================================================== */

  const [
    telefono,
    setTelefono,
  ] = useState("");


  const [
    passwordTelefono,
    setPasswordTelefono,
  ] = useState("");


  const [
    mostrarPasswordTelefono,
    setMostrarPasswordTelefono,
  ] = useState(false);


  /* ======================================================
     RECUPERACIÓN TELÉFONO
  ====================================================== */

  const [
    codigo,
    setCodigo,
  ] = useState("");


  const [
    confirmationResult,
    setConfirmationResult,
  ] = useState(null);


  const [
    numeroVerificando,
    setNumeroVerificando,
  ] = useState("");


  const [
    contador,
    setContador,
  ] = useState(0);


  const [
    nuevaPassword,
    setNuevaPassword,
  ] = useState("");


  const [
    confirmarNuevaPassword,
    setConfirmarNuevaPassword,
  ] = useState("");


  const [
    mostrarNuevaPassword,
    setMostrarNuevaPassword,
  ] = useState(false);


  /* ======================================================
     UI
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


  /* ======================================================
     RECAPTCHA
  ====================================================== */

  const recaptchaRef =
    useRef(null);


  const recaptchaWidgetIdRef =
    useRef(null);


  /* ======================================================
     TEMPORIZADOR
  ====================================================== */

  useEffect(() => {
    if (
      contador <= 0
    ) {
      return;
    }


    const timer =
      setInterval(
        () => {
          setContador(
            (actual) =>
              actual > 0
                ? actual - 1
                : 0
          );
        },
        1000
      );


    return () =>
      clearInterval(
        timer
      );

  }, [
    contador,
  ]);


  /* ======================================================
     RECAPTCHA
  ====================================================== */

  const resetearRecaptcha =
    () => {
      try {
        if (
          typeof window !==
            "undefined" &&
          window.grecaptcha &&
          recaptchaWidgetIdRef.current !==
            null
        ) {
          window.grecaptcha.reset(
            recaptchaWidgetIdRef.current
          );
        }

      } catch (err) {
        console.warn(
          "No se pudo resetear reCAPTCHA:",
          err
        );
      }
    };


  const destruirRecaptcha =
    () => {
      try {
        recaptchaRef.current?.clear();

      } catch {
        // ignorar
      }


      recaptchaRef.current =
        null;


      recaptchaWidgetIdRef.current =
        null;
    };


  useEffect(() => {
    return () =>
      destruirRecaptcha();

  }, []);


  const prepararRecaptcha =
    async () => {
      if (
        recaptchaRef.current
      ) {
        return recaptchaRef.current;
      }


      const container =
        document.getElementById(
          "recaptcha-login"
        );


      if (!container) {
        throw new Error(
          "No se encontró el contenedor de reCAPTCHA."
        );
      }


      const verifier =
        new RecaptchaVerifier(
          auth,
          "recaptcha-login",
          {
            size:
              "invisible",

            callback:
              () => {},

            "expired-callback":
              () => {
                resetearRecaptcha();
              },
          }
        );


      recaptchaRef.current =
        verifier;


      recaptchaWidgetIdRef.current =
        await verifier.render();


      return verifier;
    };


  /* ======================================================
     FIRESTORE
     OBTENER PERFIL
  ====================================================== */

  const obtenerPerfil =
    async (user) => {
      if (!user) {
        return null;
      }


      const ref =
        doc(
          db,
          "users",
          user.uid
        );


      const snap =
        await getDoc(
          ref
        );


      if (!snap.exists()) {
        return null;
      }


      return {
        id:
          snap.id,

        ...snap.data(),
      };
    };


  /* ======================================================
     CREAR / REPARAR PERFIL AUTOMÁTICAMENTE
  ====================================================== */

  const asegurarPerfilUsuario =
    async (
      user,
      proveedor = "password",
      datosExtra = {}
    ) => {
      if (!user) {
        throw new Error(
          "No existe un usuario autenticado."
        );
      }


      const ref =
        doc(
          db,
          "users",
          user.uid
        );


      const snap =
        await getDoc(
          ref
        );


      /* =====================================
         PROVEEDORES
      ===================================== */

      let proveedores = [
        "password",
      ];


      if (
        proveedor ===
        "google"
      ) {
        proveedores = [
          "google",
        ];
      }


      if (
        proveedor ===
        "telefono_password"
      ) {
        proveedores = [
          "phone",
          "password",
        ];
      }


      /* =====================================
         CREAR SI NO EXISTE
      ===================================== */

      if (
        !snap.exists()
      ) {
        const telefonoFinal =
          user.phoneNumber ||
          datosExtra.telefono ||
          "";


        const perfilNuevo = {
          uid:
            user.uid,

          nombre:
            user.displayName ||
            datosExtra.nombre ||
            "Usuario",

          correo:
            proveedor ===
            "telefono_password"
              ? ""
              : user.email ||
                "",

          telefono:
            telefonoFinal,

          role:
            "cliente",

          estadoCuenta:
            "activa",

          temaPreferido:
            "claro",

          proveedor,

          proveedores,

          emailVerificado:
            Boolean(
              user.emailVerified
            ),

          telefonoVerificado:
            Boolean(
              telefonoFinal
            ),

          fechaRegistro:
            serverTimestamp(),

          fechaActualizacion:
            serverTimestamp(),

          ultimoAcceso:
            serverTimestamp(),
        };


        if (
          proveedor ===
          "telefono_password"
        ) {
          perfilNuevo.telefonoNacional =
            telefonoFinal.replace(
              /^\+52/,
              ""
            );


          perfilNuevo.correoInterno =
            datosExtra.correoInterno ||
            user.email ||
            "";
        }


        await setDoc(
          ref,
          perfilNuevo
        );


        return {
          ...perfilNuevo,

          role:
            "cliente",
        };
      }


      /* =====================================
         PERFIL YA EXISTE
      ===================================== */

      const perfilActual =
        snap.data();


      /*
        MUY IMPORTANTE:

        Si ya es admin, conservamos admin.
        Nunca reemplazamos admin por cliente.
      */

      const roleActual =
        perfilActual.role ||
        "cliente";


      const telefonoFinal =
        perfilActual.telefono ||
        user.phoneNumber ||
        datosExtra.telefono ||
        "";


      const actualizacion = {
        uid:
          user.uid,

        nombre:
          perfilActual.nombre ||
          user.displayName ||
          datosExtra.nombre ||
          "Usuario",

        correo:
          perfilActual.correo ||
          (
            proveedor ===
            "telefono_password"
              ? ""
              : user.email ||
                ""
          ),

        telefono:
          telefonoFinal,

        role:
          roleActual,

        estadoCuenta:
          perfilActual.estadoCuenta ||
          "activa",

        temaPreferido:
          perfilActual.temaPreferido ||
          "claro",

        proveedor:
          perfilActual.proveedor ||
          proveedor,

        proveedores:
          Array.isArray(
            perfilActual.proveedores
          ) &&
          perfilActual
            .proveedores
            .length >
            0
            ? perfilActual.proveedores
            : proveedores,

        emailVerificado:
          Boolean(
            user.emailVerified ||
            perfilActual.emailVerificado
          ),

        telefonoVerificado:
          Boolean(
            telefonoFinal ||
            perfilActual
              .telefonoVerificado
          ),

        fechaActualizacion:
          serverTimestamp(),

        ultimoAcceso:
          serverTimestamp(),
      };


      if (
        proveedor ===
        "telefono_password"
      ) {
        if (
          !perfilActual
            .telefonoNacional
        ) {
          actualizacion.telefonoNacional =
            telefonoFinal.replace(
              /^\+52/,
              ""
            );
        }


        if (
          !perfilActual
            .correoInterno
        ) {
          actualizacion.correoInterno =
            datosExtra.correoInterno ||
            user.email ||
            "";
        }
      }


      await setDoc(
        ref,
        actualizacion,
        {
          merge:
            true,
        }
      );


      return {
        id:
          snap.id,

        ...perfilActual,

        ...actualizacion,

        role:
          roleActual,
      };
    };


  /* ======================================================
     REDIRECCIÓN SEGÚN ROLE
  ====================================================== */

  const redirigirSegunRol =
    (perfil) => {
      if (
        perfil?.role ===
        "admin"
      ) {
        navigate(
          "/admin",
          {
            replace:
              true,
          }
        );

        return;
      }


      navigate(
        "/cliente",
        {
          replace:
            true,
        }
      );
    };


  /* ======================================================
     ERRORES SMS
  ====================================================== */

  const mensajeErrorSMS =
    (firebaseError) => {
      console.error(
        "Firebase Phone Auth:",
        firebaseError
      );


      switch (
        firebaseError?.code
      ) {
        case "auth/invalid-phone-number":
          return "El número de teléfono no es válido.";


        case "auth/too-many-requests":
          return "Se hicieron demasiados intentos. Espera un momento.";


        case "auth/quota-exceeded":
          return "Se alcanzó temporalmente el límite de SMS.";


        case "auth/invalid-verification-id":
          return "La verificación SMS ya no es válida.";


        case "auth/app-not-authorized":
          return "Esta aplicación no está autorizada para usar Firebase Authentication.";


        case "auth/billing-not-enabled":
          return "Firebase todavía no tiene habilitada la facturación para SMS.";


        case "auth/operation-not-allowed":
          return "El acceso por teléfono no está habilitado.";


        case "auth/unauthorized-domain":
          return "Este dominio todavía no está autorizado.";


        case "auth/captcha-check-failed":
        case "auth/invalid-app-credential":
        case "auth/missing-app-credential":
          return "No se pudo validar reCAPTCHA.";


        default:
          return (
            firebaseError?.message ||
            "No se pudo enviar el código."
          );
      }
    };


  /* ======================================================
     GOOGLE
  ====================================================== */

  const loginGoogle =
    async () => {
      setError("");
      setMensaje("");


      try {
        setLoading(
          true
        );


        const result =
          await signInWithPopup(
            auth,
            provider
          );


        const perfil =
          await asegurarPerfilUsuario(
            result.user,
            "google"
          );


        redirigirSegunRol(
          perfil
        );

      } catch (firebaseError) {
        console.error(
          "Error Google:",
          firebaseError
        );


        if (
          firebaseError?.code ===
          "auth/popup-closed-by-user"
        ) {
          setError(
            "La ventana de Google fue cerrada."
          );

        } else if (
          firebaseError?.code ===
          "auth/account-exists-with-different-credential"
        ) {
          setError(
            "Ya existe una cuenta con ese correo usando otro método."
          );

        } else {
          setError(
            "No se pudo iniciar sesión con Google."
          );
        }

      } finally {
        setLoading(
          false
        );
      }
    };


  /* ======================================================
     CORREO
  ====================================================== */

  const loginCorreo =
    async (e) => {
      e.preventDefault();


      setError("");
      setMensaje("");


      if (
        !correo.trim()
      ) {
        setError(
          "Escribe tu correo electrónico."
        );

        return;
      }


      if (
        !passwordCorreo
      ) {
        setError(
          "Escribe tu contraseña."
        );

        return;
      }


      try {
        setLoading(
          true
        );


        const result =
          await signInWithEmailAndPassword(
            auth,
            correo
              .trim()
              .toLowerCase(),
            passwordCorreo
          );


        /*
          Si existe en Authentication
          pero NO en Firestore,
          se crea automáticamente.
        */

        const perfil =
          await asegurarPerfilUsuario(
            result.user,
            "password"
          );


        redirigirSegunRol(
          perfil
        );

      } catch (firebaseError) {
        console.error(
          "Error correo:",
          firebaseError
        );


        if (
          [
            "auth/invalid-credential",
            "auth/wrong-password",
            "auth/user-not-found",
          ].includes(
            firebaseError?.code
          )
        ) {
          setError(
            "Correo o contraseña incorrectos."
          );

        } else if (
          firebaseError?.code ===
          "auth/too-many-requests"
        ) {
          setError(
            "Demasiados intentos. Intenta más tarde."
          );

        } else {
          setError(
            "No se pudo iniciar sesión."
          );
        }

      } finally {
        setLoading(
          false
        );
      }
    };


  /* ======================================================
     RECUPERAR CORREO
  ====================================================== */

  const recuperarCorreo =
    async () => {
      setError("");
      setMensaje("");


      if (
        !correo.trim()
      ) {
        setError(
          "Escribe primero tu correo."
        );

        return;
      }


      try {
        setLoading(
          true
        );


        await sendPasswordResetEmail(
          auth,
          correo
            .trim()
            .toLowerCase()
        );


        setMensaje(
          `Enviamos un enlace a ${correo.trim()}.`
        );

      } catch (firebaseError) {
        console.error(
          "Recuperación correo:",
          firebaseError
        );


        setError(
          "No se pudo enviar el correo de recuperación."
        );

      } finally {
        setLoading(
          false
        );
      }
    };


  /* ======================================================
     LOGIN TELÉFONO
  ====================================================== */

  const loginTelefono =
    async (e) => {
      e.preventDefault();


      setError("");
      setMensaje("");


      const telefonoE164 =
        normalizarTelefonoMexico(
          telefono
        );


      if (!telefonoE164) {
        setError(
          "Escribe un teléfono válido de México."
        );

        return;
      }


      if (
        !passwordTelefono
      ) {
        setError(
          "Escribe tu contraseña."
        );

        return;
      }


      try {
        setLoading(
          true
        );


        const emailInterno =
          telefonoAEmailInterno(
            telefonoE164
          );


        const result =
          await signInWithEmailAndPassword(
            auth,
            emailInterno,
            passwordTelefono
          );


        const perfil =
          await asegurarPerfilUsuario(
            result.user,
            "telefono_password",
            {
              telefono:
                telefonoE164,

              correoInterno:
                emailInterno,
            }
          );


        redirigirSegunRol(
          perfil
        );

      } catch (firebaseError) {
        console.error(
          "Error login teléfono:",
          firebaseError
        );


        setError(
          "Teléfono o contraseña incorrectos."
        );

      } finally {
        setLoading(
          false
        );
      }
    };


  /* ======================================================
     RECUPERACIÓN TELÉFONO
  ====================================================== */

  const iniciarRecuperacionTelefono =
    async () => {
      setError("");
      setMensaje("");


      const telefonoE164 =
        normalizarTelefonoMexico(
          telefono
        );


      if (!telefonoE164) {
        setError(
          "Escribe primero el teléfono registrado."
        );

        return;
      }


      try {
        setLoading(
          true
        );


        const verifier =
          await prepararRecaptcha();


        resetearRecaptcha();


        const resultado =
          await signInWithPhoneNumber(
            auth,
            telefonoE164,
            verifier
          );


        setConfirmationResult(
          resultado
        );


        setNumeroVerificando(
          telefonoE164
        );


        setCodigo("");


        setContador(
          SEGUNDOS_REENVIO
        );


        setModo(
          "recuperarTelefonoCodigo"
        );


        setMensaje(
          "Enviamos un código de seguridad."
        );

      } catch (firebaseError) {
        setError(
          mensajeErrorSMS(
            firebaseError
          )
        );


        resetearRecaptcha();

      } finally {
        setLoading(
          false
        );
      }
    };


  /* ======================================================
     VERIFICAR CÓDIGO RECUPERACIÓN
  ====================================================== */

  const verificarCodigoRecuperacion =
    async () => {
      setError("");
      setMensaje("");


      const codigoLimpio =
        codigo.replace(
          /\D/g,
          ""
        );


      if (
        codigoLimpio.length !==
        6
      ) {
        setError(
          "El código debe tener 6 dígitos."
        );

        return;
      }


      if (
        !confirmationResult
      ) {
        setError(
          "Solicita un nuevo código."
        );

        return;
      }


      try {
        setLoading(
          true
        );


        const result =
          await confirmationResult.confirm(
            codigoLimpio
          );


        /*
          Si por alguna razón el usuario
          estaba en Authentication pero no
          tenía users/{uid}, también se crea.
        */

        await asegurarPerfilUsuario(
          result.user,
          "telefono_password",
          {
            telefono:
              numeroVerificando,

            correoInterno:
              telefonoAEmailInterno(
                numeroVerificando
              ),
          }
        );


        setModo(
          "recuperarTelefonoPassword"
        );


        setMensaje(
          "Teléfono verificado. Crea una nueva contraseña."
        );

      } catch (firebaseError) {
        console.error(
          "Verificar recuperación:",
          firebaseError
        );


        if (
          firebaseError?.code ===
          "auth/invalid-verification-code"
        ) {
          setError(
            "El código es incorrecto."
          );

        } else if (
          [
            "auth/code-expired",
            "auth/session-expired",
          ].includes(
            firebaseError?.code
          )
        ) {
          setError(
            "El código expiró. Solicita uno nuevo."
          );

        } else {
          setError(
            "No se pudo verificar el código."
          );
        }

      } finally {
        setLoading(
          false
        );
      }
    };


  /* ======================================================
     REENVIAR CÓDIGO
  ====================================================== */

  const reenviarCodigo =
    async () => {
      if (
        contador > 0 ||
        loading
      ) {
        return;
      }


      setError("");
      setMensaje("");


      try {
        setLoading(
          true
        );


        const verifier =
          await prepararRecaptcha();


        resetearRecaptcha();


        const resultado =
          await signInWithPhoneNumber(
            auth,
            numeroVerificando,
            verifier
          );


        setConfirmationResult(
          resultado
        );


        setCodigo("");


        setContador(
          SEGUNDOS_REENVIO
        );


        setMensaje(
          "Enviamos un nuevo código."
        );

      } catch (firebaseError) {
        setError(
          mensajeErrorSMS(
            firebaseError
          )
        );


        resetearRecaptcha();

      } finally {
        setLoading(
          false
        );
      }
    };


  /* ======================================================
     GUARDAR NUEVA PASSWORD
  ====================================================== */

  const guardarNuevaPassword =
    async () => {
      setError("");
      setMensaje("");


      if (
        nuevaPassword.length <
        8
      ) {
        setError(
          "La contraseña debe tener al menos 8 caracteres."
        );

        return;
      }


      if (
        nuevaPassword !==
        confirmarNuevaPassword
      ) {
        setError(
          "Las contraseñas no coinciden."
        );

        return;
      }


      if (
        !auth.currentUser
      ) {
        setError(
          "La sesión de recuperación expiró."
        );

        return;
      }


      try {
        setLoading(
          true
        );


        await updatePassword(
          auth.currentUser,
          nuevaPassword
        );


        await setDoc(
          doc(
            db,
            "users",
            auth.currentUser.uid
          ),
          {
            fechaCambioPassword:
              serverTimestamp(),

            fechaActualizacion:
              serverTimestamp(),

            ultimoAcceso:
              serverTimestamp(),
          },
          {
            merge:
              true,
          }
        );


        const perfil =
          await asegurarPerfilUsuario(
            auth.currentUser,
            "telefono_password",
            {
              telefono:
                numeroVerificando,

              correoInterno:
                telefonoAEmailInterno(
                  numeroVerificando
                ),
            }
          );


        setMensaje(
          "Contraseña actualizada correctamente."
        );


        setTimeout(
          () => {
            redirigirSegunRol(
              perfil
            );
          },
          700
        );

      } catch (firebaseError) {
        console.error(
          "Actualizar contraseña:",
          firebaseError
        );


        setError(
          "No se pudo actualizar la contraseña."
        );

      } finally {
        setLoading(
          false
        );
      }
    };


  /* ======================================================
     VOLVER
  ====================================================== */

  const volverOpciones =
    async () => {
      try {
        if (
          modo.startsWith(
            "recuperarTelefono"
          ) &&
          auth.currentUser
        ) {
          await signOut(
            auth
          );
        }

      } catch {
        // ignorar
      }


      resetearRecaptcha();


      setModo(
        "opciones"
      );


      setError("");
      setMensaje("");


      setPasswordCorreo("");
      setPasswordTelefono("");


      setCodigo("");


      setConfirmationResult(
        null
      );


      setNumeroVerificando(
        ""
      );


      setContador(
        0
      );


      setNuevaPassword(
        ""
      );


      setConfirmarNuevaPassword(
        ""
      );
    };


  /* ======================================================
     RENDER
  ====================================================== */

  return (
    <div
      className={`
        min-h-screen
        relative
        overflow-hidden

        ${
          modoOscuro
            ? "bg-slate-950 text-white"
            : "bg-sky-50 text-slate-900"
        }
      `}
    >

      {/* FONDO */}

      <div className="absolute inset-0">

        <div
          className={`
            absolute
            inset-0

            ${
              modoOscuro
                ? "bg-gradient-to-br from-slate-950 via-sky-950 to-slate-950"
                : "bg-gradient-to-br from-sky-50 via-white to-blue-100"
            }
          `}
        />


        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-sky-300/30 rounded-full blur-3xl" />


        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-blue-300/30 rounded-full blur-3xl" />

      </div>


      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-10">

        <div
          className={`
            w-full
            max-w-md

            rounded-[32px]

            border

            p-7
            sm:p-9

            shadow-2xl

            backdrop-blur-xl

            ${
              modoOscuro
                ? "bg-slate-900/90 border-slate-700"
                : "bg-white/90 border-sky-100"
            }
          `}
        >

          {/* LOGO */}

          <div className="text-center mb-8">

            <div className="w-16 h-16 mx-auto rounded-2xl bg-sky-100 text-sky-500 flex items-center justify-center shadow-sm">

              <FaUserLock
                size={26}
              />

            </div>


            <p className="mt-5 text-xs uppercase tracking-[0.35em] font-bold text-sky-500">

              Macro

            </p>


            <h1 className="text-3xl font-bold mt-3">

              {modo ===
              "opciones"
                ? "Bienvenido"
                : modo.startsWith(
                    "recuperarTelefono"
                  )
                ? "Recuperar acceso"
                : "Iniciar sesión"
              }

            </h1>


            <p className="text-sm mt-2 text-slate-500">

              {modo ===
              "opciones"
                ? "Elige cómo quieres ingresar."
                : modo ===
                  "telefono"
                ? "Ingresa con tu teléfono y contraseña."
                : modo ===
                  "correo"
                ? "Ingresa con tu correo y contraseña."
                : "Verificaremos tu identidad de forma segura."
              }

            </p>

          </div>


          {/* ALERTAS */}

          {error && (

            <Alerta
              tipo="error"
            >

              <FaExclamationTriangle />

              <span>
                {error}
              </span>

            </Alerta>

          )}


          {mensaje && (

            <Alerta
              tipo="ok"
            >

              <FaCheckCircle />

              <span>
                {mensaje}
              </span>

            </Alerta>

          )}


          {/* ======================================================
              OPCIONES
          ====================================================== */}

          {modo ===
            "opciones" && (

            <div className="space-y-3">

              <button
                type="button"
                onClick={
                  loginGoogle
                }
                disabled={
                  loading
                }
                className="
                  w-full

                  bg-white
                  border
                  border-slate-200

                  hover:bg-slate-50

                  text-slate-800

                  px-5
                  py-4

                  rounded-2xl

                  font-semibold

                  flex
                  items-center
                  justify-center
                  gap-3

                  transition

                  shadow-sm

                  disabled:opacity-50
                "
              >

                <img
                  src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg"
                  alt="Google"
                  className="w-5 h-5"
                />


                Continuar con Google

              </button>


              <button
                type="button"
                onClick={() => {
                  setModo(
                    "telefono"
                  );

                  setError("");
                  setMensaje("");
                }}
                className={
                  botonOpcion
                }
              >

                <FaPhone />

                Teléfono + contraseña

                <FaArrowRight />

              </button>


              <button
                type="button"
                onClick={() => {
                  setModo(
                    "correo"
                  );

                  setError("");
                  setMensaje("");
                }}
                className={
                  botonOpcion
                }
              >

                <FaEnvelope />

                Correo + contraseña

                <FaArrowRight />

              </button>

            </div>

          )}


          {/* ======================================================
              CORREO
          ====================================================== */}

          {modo ===
            "correo" && (

            <form
              onSubmit={
                loginCorreo
              }
              className="space-y-5"
            >

              <Campo
                label="Correo electrónico"
                icon={
                  <FaEnvelope />
                }
                modoOscuro={
                  modoOscuro
                }
              >

                <input
                  type="email"
                  autoComplete="email"
                  value={
                    correo
                  }
                  onChange={(e) =>
                    setCorreo(
                      e.target.value
                    )
                  }
                  placeholder="correo@ejemplo.com"
                  className={
                    inputClass(
                      modoOscuro
                    )
                  }
                />

              </Campo>


              <Campo
                label="Contraseña"
                icon={
                  <FaLock />
                }
                modoOscuro={
                  modoOscuro
                }
              >

                <div className="relative">

                  <input
                    type={
                      mostrarPasswordCorreo
                        ? "text"
                        : "password"
                    }
                    autoComplete="current-password"
                    value={
                      passwordCorreo
                    }
                    onChange={(e) =>
                      setPasswordCorreo(
                        e.target.value
                      )
                    }
                    placeholder="Tu contraseña"
                    className={`${inputClass(
                      modoOscuro
                    )} pr-12`}
                  />


                  <button
                    type="button"
                    onClick={() =>
                      setMostrarPasswordCorreo(
                        (
                          actual
                        ) =>
                          !actual
                      )
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-sky-500"
                  >

                    {mostrarPasswordCorreo
                      ? <FaEyeSlash />
                      : <FaEye />
                    }

                  </button>

                </div>

              </Campo>


              <button
                type="submit"
                disabled={
                  loading
                }
                className={
                  botonPrincipal
                }
              >

                <FaUserLock />


                {loading
                  ? "Ingresando..."
                  : "Iniciar sesión"
                }


                {!loading && (
                  <FaArrowRight />
                )}

              </button>


              <button
                type="button"
                onClick={
                  recuperarCorreo
                }
                disabled={
                  loading
                }
                className="w-full text-sm text-slate-500 hover:text-sky-500 flex items-center justify-center gap-2"
              >

                <FaKey />

                ¿Olvidaste tu contraseña?

              </button>


              <button
                type="button"
                onClick={
                  volverOpciones
                }
                className={
                  botonVolver
                }
              >

                <FaArrowLeft />

                Volver

              </button>

            </form>

          )}


          {/* ======================================================
              TELÉFONO
          ====================================================== */}

          {modo ===
            "telefono" && (

            <form
              onSubmit={
                loginTelefono
              }
              className="space-y-5"
            >

              <Campo
                label="Número de teléfono"
                icon={
                  <FaPhone />
                }
                modoOscuro={
                  modoOscuro
                }
              >

                <div className="flex gap-2">

                  <div
                    className={`
                      border
                      rounded-2xl
                      px-4

                      flex
                      items-center

                      font-semibold

                      ${
                        modoOscuro
                          ? "bg-slate-950 border-slate-700 text-slate-300"
                          : "bg-sky-50 border-sky-200 text-sky-700"
                      }
                    `}
                  >

                    +52

                  </div>


                  <input
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    value={
                      telefono
                    }
                    onChange={(e) =>
                      setTelefono(
                        e.target.value
                      )
                    }
                    placeholder="981 123 4567"
                    className={
                      inputClass(
                        modoOscuro
                      )
                    }
                  />

                </div>

              </Campo>


              <Campo
                label="Contraseña"
                icon={
                  <FaLock />
                }
                modoOscuro={
                  modoOscuro
                }
              >

                <div className="relative">

                  <input
                    type={
                      mostrarPasswordTelefono
                        ? "text"
                        : "password"
                    }
                    autoComplete="current-password"
                    value={
                      passwordTelefono
                    }
                    onChange={(e) =>
                      setPasswordTelefono(
                        e.target.value
                      )
                    }
                    placeholder="Tu contraseña"
                    className={`${inputClass(
                      modoOscuro
                    )} pr-12`}
                  />


                  <button
                    type="button"
                    onClick={() =>
                      setMostrarPasswordTelefono(
                        (
                          actual
                        ) =>
                          !actual
                      )
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-sky-500"
                  >

                    {mostrarPasswordTelefono
                      ? <FaEyeSlash />
                      : <FaEye />
                    }

                  </button>

                </div>

              </Campo>


              <button
                type="submit"
                disabled={
                  loading
                }
                className={
                  botonPrincipal
                }
              >

                <FaPhone />


                {loading
                  ? "Ingresando..."
                  : "Iniciar sesión"
                }


                {!loading && (
                  <FaArrowRight />
                )}

              </button>


              <button
                type="button"
                onClick={
                  iniciarRecuperacionTelefono
                }
                disabled={
                  loading
                }
                className="w-full text-sm text-slate-500 hover:text-sky-500 flex items-center justify-center gap-2"
              >

                <FaKey />

                ¿Olvidaste tu contraseña?

              </button>


              <button
                type="button"
                onClick={
                  volverOpciones
                }
                className={
                  botonVolver
                }
              >

                <FaArrowLeft />

                Volver

              </button>

            </form>

          )}


          {/* ======================================================
              CÓDIGO SMS
          ====================================================== */}

          {modo ===
            "recuperarTelefonoCodigo" && (

            <div className="space-y-5">

              <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4">

                <p className="text-sky-600 font-semibold">

                  Código enviado

                </p>


                <p className="text-slate-500 text-sm mt-1">

                  {numeroVerificando}

                </p>

              </div>


              <Campo
                label="Código SMS"
                icon={
                  <FaSms />
                }
                modoOscuro={
                  modoOscuro
                }
              >

                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={
                    codigo
                  }
                  onChange={(e) =>
                    setCodigo(
                      e.target.value
                        .replace(
                          /\D/g,
                          ""
                        )
                        .slice(
                          0,
                          6
                        )
                    )
                  }
                  placeholder="000000"
                  className={`${inputClass(
                    modoOscuro
                  )} text-center text-2xl tracking-[0.35em]`}
                />

              </Campo>


              <button
                type="button"
                onClick={
                  verificarCodigoRecuperacion
                }
                disabled={
                  loading
                }
                className={
                  botonPrincipal
                }
              >

                <FaCheckCircle />


                {loading
                  ? "Verificando..."
                  : "Verificar código"
                }

              </button>


              <button
                type="button"
                onClick={
                  reenviarCodigo
                }
                disabled={
                  contador >
                    0 ||
                  loading
                }
                className={
                  botonSecundario(
                    modoOscuro
                  )
                }
              >

                <FaRedo />


                {contador > 0
                  ? `Reenviar en ${contador}s`
                  : "Reenviar código"
                }

              </button>


              <button
                type="button"
                onClick={
                  volverOpciones
                }
                className={
                  botonVolver
                }
              >

                <FaArrowLeft />

                Cancelar

              </button>

            </div>

          )}


          {/* ======================================================
              NUEVA CONTRASEÑA
          ====================================================== */}

          {modo ===
            "recuperarTelefonoPassword" && (

            <div className="space-y-5">

              <Campo
                label="Nueva contraseña"
                icon={
                  <FaLock />
                }
                modoOscuro={
                  modoOscuro
                }
              >

                <div className="relative">

                  <input
                    type={
                      mostrarNuevaPassword
                        ? "text"
                        : "password"
                    }
                    autoComplete="new-password"
                    value={
                      nuevaPassword
                    }
                    onChange={(e) =>
                      setNuevaPassword(
                        e.target.value
                      )
                    }
                    placeholder="Mínimo 8 caracteres"
                    className={`${inputClass(
                      modoOscuro
                    )} pr-12`}
                  />


                  <button
                    type="button"
                    onClick={() =>
                      setMostrarNuevaPassword(
                        (
                          actual
                        ) =>
                          !actual
                      )
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-sky-500"
                  >

                    {mostrarNuevaPassword
                      ? <FaEyeSlash />
                      : <FaEye />
                    }

                  </button>

                </div>

              </Campo>


              <Campo
                label="Confirmar contraseña"
                icon={
                  <FaShieldAlt />
                }
                modoOscuro={
                  modoOscuro
                }
              >

                <input
                  type="password"
                  autoComplete="new-password"
                  value={
                    confirmarNuevaPassword
                  }
                  onChange={(e) =>
                    setConfirmarNuevaPassword(
                      e.target.value
                    )
                  }
                  placeholder="Repite la contraseña"
                  className={
                    inputClass(
                      modoOscuro
                    )
                  }
                />

              </Campo>


              <button
                type="button"
                onClick={
                  guardarNuevaPassword
                }
                disabled={
                  loading
                }
                className={
                  botonPrincipal
                }
              >

                <FaCheckCircle />


                {loading
                  ? "Guardando..."
                  : "Guardar contraseña"
                }

              </button>


              <button
                type="button"
                onClick={
                  volverOpciones
                }
                className={
                  botonVolver
                }
              >

                <FaArrowLeft />

                Cancelar

              </button>

            </div>

          )}


          <div
            id="recaptcha-login"
          />


          {/* REGISTRO */}

          <div
            className={`
              mt-8
              pt-6

              border-t

              text-center

              ${
                modoOscuro
                  ? "border-slate-700"
                  : "border-slate-200"
              }
            `}
          >

            <p className="text-sm text-slate-500">

              ¿No tienes una cuenta?


              <Link
                to="/register"
                className="text-sky-500 hover:text-sky-600 ml-2 font-bold"
              >

                Registrarse

              </Link>

            </p>

          </div>


          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 mt-5">

            <FaShieldAlt />

            Acceso seguro · Macro

          </div>

        </div>

      </div>

    </div>
  );
}


/* ======================================================
   COMPONENTES
====================================================== */

function Campo({
  label,
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

          mb-2

          ${
            modoOscuro
              ? "text-slate-300"
              : "text-slate-600"
          }
        `}
      >

        <span className="text-sky-500">

          {icon}

        </span>


        {label}

      </label>


      {children}

    </div>
  );
}


function Alerta({
  tipo,
  children,
}) {
  const clase =
    tipo === "error"
      ? "bg-red-50 border-red-200 text-red-600"
      : "bg-emerald-50 border-emerald-200 text-emerald-600";


  return (
    <div
      className={`
        mb-5

        border

        rounded-2xl

        p-4

        text-sm

        flex
        items-start
        gap-3

        ${clase}
      `}
    >

      {children}

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

    focus:border-sky-400
    focus:ring-4
    focus:ring-sky-100

    transition

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


const botonPrincipal = `
  w-full

  bg-sky-400
  hover:bg-sky-500

  text-white

  px-5
  py-4

  rounded-2xl

  font-bold

  flex
  items-center
  justify-center
  gap-3

  transition

  shadow-lg
  shadow-sky-200/40

  disabled:opacity-50
  disabled:cursor-not-allowed
`;


const botonOpcion = `
  w-full

  bg-sky-50

  border
  border-sky-200

  hover:bg-sky-100

  text-sky-700

  px-5
  py-4

  rounded-2xl

  font-semibold

  flex
  items-center
  justify-center
  gap-3

  transition
`;


const botonSecundario =
  (modoOscuro) => `
    w-full

    border

    px-5
    py-3.5

    rounded-2xl

    font-semibold

    flex
    items-center
    justify-center
    gap-2

    transition

    disabled:opacity-40

    ${
      modoOscuro
        ? `
          bg-slate-950
          border-slate-700
          text-slate-300

          hover:border-sky-400
        `
        : `
          bg-slate-50
          border-slate-200
          text-slate-600

          hover:bg-sky-50
          hover:border-sky-300
        `
    }
  `;


const botonVolver = `
  w-full

  py-3

  text-sm
  text-slate-500

  hover:text-sky-500

  flex
  items-center
  justify-center
  gap-2

  transition
`;


export default Login;