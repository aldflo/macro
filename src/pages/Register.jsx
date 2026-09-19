import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Link,
  useNavigate,
  useOutletContext,
} from "react-router-dom";

import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  linkWithCredential,
  RecaptchaVerifier,
  sendEmailVerification,
  signInWithPhoneNumber,
  signInWithPopup,
  signOut,
  updateProfile,
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
  FaGlobe,
  FaLock,
  FaMobileAlt,
  FaPhone,
  FaRedo,
  FaShieldAlt,
  FaShoppingBag,
  FaSms,
  FaUser,
  FaUserPlus,
  FaVideo,
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
   COMPONENTE
====================================================== */

function Register() {
  const navigate =
    useNavigate();


  const {
    modoOscuro = false,
  } =
    useOutletContext() || {};


  /* ======================================================
     MODO
  ====================================================== */

  const [
    modo,
    setModo,
  ] = useState(
    "opciones"
  );


  /* ======================================================
     DATOS
  ====================================================== */

  const [
    nombre,
    setNombre,
  ] = useState("");


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
    confirmarPasswordCorreo,
    setConfirmarPasswordCorreo,
  ] = useState("");


  const [
    mostrarPasswordCorreo,
    setMostrarPasswordCorreo,
  ] = useState(false);


  const [
    mostrarConfirmacionCorreo,
    setMostrarConfirmacionCorreo,
  ] = useState(false);


  /* ======================================================
     TELÉFONO
  ====================================================== */

  const [
    pasoTelefono,
    setPasoTelefono,
  ] = useState(1);


  const [
    telefono,
    setTelefono,
  ] = useState("");


  const [
    telefonoVerificado,
    setTelefonoVerificado,
  ] = useState("");


  const [
    codigo,
    setCodigo,
  ] = useState("");


  const [
    confirmationResult,
    setConfirmationResult,
  ] = useState(null);


  const [
    contador,
    setContador,
  ] = useState(0);


  const [
    passwordTelefono,
    setPasswordTelefono,
  ] = useState("");


  const [
    confirmarPasswordTelefono,
    setConfirmarPasswordTelefono,
  ] = useState("");


  const [
    mostrarPasswordTelefono,
    setMostrarPasswordTelefono,
  ] = useState(false);


  const [
    mostrarConfirmacionTelefono,
    setMostrarConfirmacionTelefono,
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
     PASSWORD
  ====================================================== */

  const calcularSeguridad =
    (password) => {
      let puntos = 0;


      if (
        password.length >=
        8
      ) {
        puntos++;
      }


      if (
        password.length >=
        10
      ) {
        puntos++;
      }


      if (
        /[A-Z]/.test(
          password
        )
      ) {
        puntos++;
      }


      if (
        /[a-z]/.test(
          password
        )
      ) {
        puntos++;
      }


      if (
        /[0-9]/.test(
          password
        )
      ) {
        puntos++;
      }


      if (
        /[^A-Za-z0-9]/.test(
          password
        )
      ) {
        puntos++;
      }


      if (!password) {
        return {
          nivel:
            0,

          texto:
            "",
        };
      }


      if (
        puntos <= 2
      ) {
        return {
          nivel:
            1,

          texto:
            "Débil",
        };
      }


      if (
        puntos <= 4
      ) {
        return {
          nivel:
            2,

          texto:
            "Buena",
        };
      }


      return {
        nivel:
          3,

        texto:
          "Segura",
      };
    };


  const seguridadCorreo =
    useMemo(
      () =>
        calcularSeguridad(
          passwordCorreo
        ),
      [
        passwordCorreo,
      ]
    );


  const seguridadTelefono =
    useMemo(
      () =>
        calcularSeguridad(
          passwordTelefono
        ),
      [
        passwordTelefono,
      ]
    );


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

      } catch (resetError) {
        console.warn(
          "No se pudo resetear reCAPTCHA:",
          resetError
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
          "recaptcha-register"
        );


      if (!container) {
        throw new Error(
          "No se encontró el contenedor de reCAPTCHA."
        );
      }


      const verifier =
        new RecaptchaVerifier(
          auth,
          "recaptcha-register",
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
     CREAR / COMPLETAR PERFIL
  ====================================================== */

  const guardarPerfilUsuario =
    async ({
      user,
      nombrePerfil,
      proveedor,
      proveedores,
      telefonoPerfil = "",
      correoPerfil = "",
      correoInterno = "",
    }) => {
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


      /*
        Si ya existía, conservamos role.
        Así jamás convertimos accidentalmente
        un admin en cliente.
      */

      const perfilExistente =
        snap.exists()
          ? snap.data()
          : {};


      const roleActual =
        perfilExistente.role ||
        "cliente";


      const telefonoFinal =
        telefonoPerfil ||
        user.phoneNumber ||
        perfilExistente.telefono ||
        "";


      const datos = {
        uid:
          user.uid,

        nombre:
          nombrePerfil ||
          user.displayName ||
          perfilExistente.nombre ||
          "Usuario",

        correo:
          correoPerfil ||
          (
            proveedor ===
            "telefono_password"
              ? perfilExistente.correo ||
                ""
              : user.email ||
                perfilExistente.correo ||
                ""
          ),

        telefono:
          telefonoFinal,

        role:
          roleActual,

        estadoCuenta:
          perfilExistente.estadoCuenta ||
          "activa",

        temaPreferido:
          perfilExistente.temaPreferido ||
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

        fechaActualizacion:
          serverTimestamp(),

        ultimoAcceso:
          serverTimestamp(),
      };


      /*
        fechaRegistro solo se crea una vez
      */

      if (
        !snap.exists()
      ) {
        datos.fechaRegistro =
          serverTimestamp();
      }


      if (
        proveedor ===
        "telefono_password"
      ) {
        datos.telefonoNacional =
          telefonoFinal.replace(
            /^\+52/,
            ""
          );


        datos.correoInterno =
          correoInterno ||
          perfilExistente.correoInterno ||
          "";
      }


      await setDoc(
        ref,
        datos,
        {
          merge:
            true,
        }
      );


      return {
        ...perfilExistente,
        ...datos,

        role:
          roleActual,
      };
    };


  /* ======================================================
     REDIRECCIÓN
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
          return "Se hicieron demasiados intentos. Espera un momento e inténtalo nuevamente.";


        case "auth/quota-exceeded":
          return "Se alcanzó temporalmente el límite de SMS.";


        case "auth/invalid-verification-id":
          return "La verificación SMS ya no es válida. Solicita un código nuevo.";


        case "auth/app-not-authorized":
          return "Esta aplicación no está autorizada para utilizar Firebase Authentication.";


        case "auth/billing-not-enabled":
          return "Firebase todavía no tiene habilitada la facturación para SMS reales.";


        case "auth/operation-not-allowed":
          return "El registro por teléfono no está habilitado.";


        case "auth/unauthorized-domain":
          return "Este dominio todavía no está autorizado en Firebase Authentication.";


        case "auth/captcha-check-failed":
        case "auth/invalid-app-credential":
        case "auth/missing-app-credential":
          return "No se pudo validar reCAPTCHA. Inténtalo nuevamente.";


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

  const registrarGoogle =
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


        const user =
          result.user;


        const perfil =
          await guardarPerfilUsuario({
            user,

            nombrePerfil:
              user.displayName ||
              "Usuario",

            proveedor:
              "google",

            proveedores: [
              "google",
            ],

            telefonoPerfil:
              user.phoneNumber ||
              "",

            correoPerfil:
              user.email ||
              "",
          });


        redirigirSegunRol(
          perfil
        );

      } catch (firebaseError) {
        console.error(
          "Registro Google:",
          firebaseError
        );


        if (
          firebaseError?.code ===
          "auth/popup-closed-by-user"
        ) {
          setError(
            "La ventana de Google fue cerrada antes de completar el registro."
          );

        } else if (
          firebaseError?.code ===
          "auth/account-exists-with-different-credential"
        ) {
          setError(
            "Ya existe una cuenta con ese correo usando otro método de acceso."
          );

        } else {
          setError(
            "No se pudo continuar con Google."
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

  const registrarCorreo =
    async (e) => {
      e.preventDefault();


      setError("");
      setMensaje("");


      if (
        nombre.trim().length <
        3
      ) {
        setError(
          "Escribe tu nombre completo."
        );

        return;
      }


      if (
        !correo.trim()
      ) {
        setError(
          "Escribe tu correo electrónico."
        );

        return;
      }


      if (
        passwordCorreo.length <
        8
      ) {
        setError(
          "La contraseña debe tener al menos 8 caracteres."
        );

        return;
      }


      if (
        passwordCorreo !==
        confirmarPasswordCorreo
      ) {
        setError(
          "Las contraseñas no coinciden."
        );

        return;
      }


      try {
        setLoading(
          true
        );


        const correoLimpio =
          correo
            .trim()
            .toLowerCase();


        const result =
          await createUserWithEmailAndPassword(
            auth,
            correoLimpio,
            passwordCorreo
          );


        const user =
          result.user;


        await updateProfile(
          user,
          {
            displayName:
              nombre.trim(),
          }
        );


        const perfil =
          await guardarPerfilUsuario({
            user,

            nombrePerfil:
              nombre.trim(),

            proveedor:
              "password",

            proveedores: [
              "password",
            ],

            correoPerfil:
              correoLimpio,

            telefonoPerfil:
              "",
          });


        await sendEmailVerification(
          user
        );


        setMensaje(
          "Cuenta creada correctamente. Te enviamos un correo de verificación."
        );


        setTimeout(
          () => {
            redirigirSegunRol(
              perfil
            );
          },
          900
        );

      } catch (firebaseError) {
        console.error(
          "Registro correo:",
          firebaseError
        );


        switch (
          firebaseError?.code
        ) {
          case "auth/email-already-in-use":
            setError(
              "Este correo ya tiene una cuenta registrada."
            );

            break;


          case "auth/invalid-email":
            setError(
              "El correo electrónico no es válido."
            );

            break;


          case "auth/weak-password":
            setError(
              "La contraseña es demasiado débil."
            );

            break;


          case "auth/operation-not-allowed":
            setError(
              "El registro con correo y contraseña no está habilitado."
            );

            break;


          default:
            setError(
              "No se pudo crear la cuenta."
            );
        }

      } finally {
        setLoading(
          false
        );
      }
    };


  /* ======================================================
     TELÉFONO PASO 1
  ====================================================== */

  const enviarCodigo =
    async () => {
      setError("");
      setMensaje("");


      if (
        nombre.trim().length <
        3
      ) {
        setError(
          "Escribe tu nombre completo."
        );

        return;
      }


      const telefonoE164 =
        normalizarTelefonoMexico(
          telefono
        );


      if (!telefonoE164) {
        setError(
          "Escribe un teléfono válido de México de 10 dígitos."
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


        setTelefonoVerificado(
          telefonoE164
        );


        setCodigo("");


        setContador(
          SEGUNDOS_REENVIO
        );


        setPasoTelefono(
          2
        );


        setMensaje(
          "Enviamos un código de verificación a tu teléfono."
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
     TELÉFONO PASO 2
  ====================================================== */

  const verificarCodigo =
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


        const perfilRef =
          doc(
            db,
            "users",
            result.user.uid
          );


        const perfilSnap =
          await getDoc(
            perfilRef
          );


        if (
          perfilSnap.exists()
        ) {
          /*
            Si ya existe completamente,
            no creamos otra cuenta.
          */

          await signOut(
            auth
          );


          setError(
            "Este teléfono ya tiene una cuenta Macro. Inicia sesión."
          );


          setPasoTelefono(
            1
          );


          return;
        }


        setTelefonoVerificado(
          result.user.phoneNumber ||
          telefonoVerificado
        );


        setPasoTelefono(
          3
        );


        setMensaje(
          "Teléfono verificado. Ahora crea tu contraseña."
        );

      } catch (firebaseError) {
        console.error(
          "Verificar SMS:",
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
     REENVIAR SMS
  ====================================================== */

  const reenviarCodigo =
    async () => {
      if (
        contador >
          0 ||
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
            telefonoVerificado,
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
     TELÉFONO PASO 3
  ====================================================== */

  const crearCuentaTelefono =
    async () => {
      setError("");
      setMensaje("");


      if (
        !auth.currentUser
      ) {
        setError(
          "La verificación expiró. Comienza nuevamente."
        );


        setPasoTelefono(
          1
        );


        return;
      }


      if (
        passwordTelefono.length <
        8
      ) {
        setError(
          "La contraseña debe tener al menos 8 caracteres."
        );

        return;
      }


      if (
        passwordTelefono !==
        confirmarPasswordTelefono
      ) {
        setError(
          "Las contraseñas no coinciden."
        );

        return;
      }


      try {
        setLoading(
          true
        );


        const telefonoFinal =
          auth.currentUser.phoneNumber ||
          telefonoVerificado;


        const emailInterno =
          telefonoAEmailInterno(
            telefonoFinal
          );


        const credential =
          EmailAuthProvider.credential(
            emailInterno,
            passwordTelefono
          );


        await linkWithCredential(
          auth.currentUser,
          credential
        );


        await updateProfile(
          auth.currentUser,
          {
            displayName:
              nombre.trim(),
          }
        );


        const perfil =
          await guardarPerfilUsuario({
            user:
              auth.currentUser,

            nombrePerfil:
              nombre.trim(),

            proveedor:
              "telefono_password",

            proveedores: [
              "phone",
              "password",
            ],

            telefonoPerfil:
              telefonoFinal,

            correoPerfil:
              "",

            correoInterno:
              emailInterno,
          });


        setMensaje(
          "Cuenta creada correctamente. Entrando a Macro..."
        );


        setTimeout(
          () => {
            redirigirSegunRol(
              perfil
            );
          },
          900
        );

      } catch (firebaseError) {
        console.error(
          "Crear cuenta teléfono:",
          firebaseError
        );


        switch (
          firebaseError?.code
        ) {
          case "auth/email-already-in-use":
          case "auth/credential-already-in-use":

            setError(
              "Este teléfono ya está vinculado a una cuenta Macro."
            );

            break;


          case "auth/provider-already-linked":

            setError(
              "Esta cuenta ya tiene contraseña configurada. Inicia sesión."
            );

            break;


          case "auth/weak-password":

            setError(
              "La contraseña es demasiado débil."
            );

            break;


          default:

            setError(
              "No se pudo completar el registro."
            );
        }

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
          modo ===
            "telefono" &&
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


      setPasoTelefono(
        1
      );


      setError("");
      setMensaje("");


      setCodigo("");


      setConfirmationResult(
        null
      );


      setTelefonoVerificado(
        ""
      );


      setContador(
        0
      );


      setPasswordTelefono(
        ""
      );


      setConfirmarPasswordTelefono(
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
        transition-colors
        duration-300

        ${
          modoOscuro
            ? "bg-slate-950 text-white"
            : "bg-[#f5fbff] text-slate-900"
        }
      `}
    >

      <div className="h-24 md:h-28" />


      <main className="max-w-7xl mx-auto px-4 md:px-6 pb-14">

        <div
          className={`
            overflow-hidden

            rounded-[34px]

            border

            shadow-2xl

            grid
            lg:grid-cols-[0.95fr_1.05fr]

            ${
              modoOscuro
                ? "border-slate-800 bg-slate-900"
                : "border-sky-100 bg-white"
            }
          `}
        >

          {/* ======================================================
              PANEL IZQUIERDO
          ====================================================== */}

          <section
            className={`
              relative

              hidden
              lg:flex

              min-h-[750px]

              flex-col
              justify-between

              p-10
              xl:p-12

              overflow-hidden

              border-r

              ${
                modoOscuro
                  ? "border-slate-800"
                  : "border-sky-100"
              }
            `}
          >

            <div
              className={`
                absolute
                inset-0

                bg-gradient-to-br

                ${
                  modoOscuro
                    ? "from-sky-950 via-slate-950 to-slate-900"
                    : "from-sky-100 via-white to-blue-50"
                }
              `}
            />


            <div className="absolute -top-32 -left-24 w-96 h-96 rounded-full bg-sky-300/30 blur-3xl" />


            <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-blue-300/20 blur-3xl" />


            <div className="relative z-10">

              <div className="inline-flex items-center gap-2 rounded-full bg-white/70 border border-sky-200 px-4 py-2 shadow-sm">

                <div className="w-2.5 h-2.5 rounded-full bg-sky-400" />


                <span className="text-xs uppercase tracking-[0.30em] text-sky-600 font-bold">

                  Macro

                </span>

              </div>


              <h2 className="text-5xl xl:text-6xl font-bold leading-[1.05] mt-7 max-w-lg">

                Tecnología,


                <span className="text-sky-500">

                  {" "}servicios y soluciones

                </span>


                {" "}en un solo lugar.

              </h2>


              <p
                className={`
                  text-lg

                  leading-relaxed

                  mt-6

                  max-w-lg

                  ${
                    modoOscuro
                      ? "text-slate-400"
                      : "text-slate-600"
                  }
                `}
              >

                Crea tu cuenta para contratar servicios,
                solicitar proyectos, comprar productos
                tecnológicos y administrar todo desde Macro.

              </p>

            </div>


            <div className="relative z-10 grid grid-cols-2 gap-4">

              <ServicioCard
                icon={
                  <FaGlobe />
                }
                titulo="Desarrollo web"
                texto="Sitios y plataformas digitales."
              />


              <ServicioCard
                icon={
                  <FaMobileAlt />
                }
                titulo="Apps móviles"
                texto="Soluciones para iOS y Android."
              />


              <ServicioCard
                icon={
                  <FaVideo />
                }
                titulo="Tecnología"
                texto="Cámaras, seguridad y equipos."
              />


              <ServicioCard
                icon={
                  <FaShoppingBag />
                }
                titulo="Tienda Macro"
                texto="Productos y soluciones tecnológicas."
              />

            </div>


            <div
              className={`
                relative
                z-10

                pt-7

                border-t

                ${
                  modoOscuro
                    ? "border-white/10"
                    : "border-sky-200"
                }
              `}
            >

              <div className="flex items-center gap-3 text-slate-500 text-sm">

                <FaShieldAlt className="text-sky-500" />

                Tu cuenta · Tu tecnología · Macro

              </div>

            </div>

          </section>


          {/* ======================================================
              PANEL DERECHO
          ====================================================== */}

          <section className="p-6 sm:p-8 md:p-10 xl:p-12">

            <div className="max-w-xl mx-auto">

              {/* HEADER */}

              <div className="mb-8">

                <div className="w-14 h-14 rounded-2xl bg-sky-100 border border-sky-200 text-sky-500 flex items-center justify-center shadow-sm">

                  <FaUserPlus
                    size={21}
                  />

                </div>


                <p className="text-xs uppercase tracking-[0.28em] text-sky-500 font-bold mt-5">

                  Crear cuenta

                </p>


                <h1 className="text-3xl md:text-4xl font-bold mt-2">

                  Bienvenido a Macro

                </h1>


                <p className="text-slate-500 mt-2 leading-relaxed">

                  {modo ===
                  "opciones"
                    ? "Crea tu cuenta y comienza a explorar todo lo que Macro tiene para ti."
                    : modo ===
                      "correo"
                    ? "Crea tu cuenta utilizando correo y contraseña."
                    : `Registro con teléfono · Paso ${pasoTelefono} de 3`
                  }

                </p>


                {modo ===
                  "telefono" && (

                  <div className="grid grid-cols-3 gap-2 mt-5">

                    {[
                      1,
                      2,
                      3,
                    ].map(
                      (
                        item
                      ) => (

                        <div
                          key={
                            item
                          }
                          className={`
                            h-1.5
                            rounded-full
                            transition

                            ${
                              pasoTelefono >=
                              item
                                ? "bg-sky-400"
                                : modoOscuro
                                ? "bg-slate-700"
                                : "bg-slate-200"
                            }
                          `}
                        />

                      )
                    )}

                  </div>

                )}

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
                      registrarGoogle
                    }
                    disabled={
                      loading
                    }
                    className="
                      w-full

                      bg-white

                      hover:bg-slate-50

                      text-slate-800

                      border
                      border-slate-200

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


                    Registrarme con teléfono


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


                    Registrarme con correo


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
                    registrarCorreo
                  }
                  className="space-y-5"
                >

                  <Campo
                    label="Nombre completo"
                    icon={
                      <FaUser />
                    }
                    modoOscuro={
                      modoOscuro
                    }
                  >

                    <input
                      type="text"
                      autoComplete="name"
                      value={
                        nombre
                      }
                      onChange={(e) =>
                        setNombre(
                          e.target.value
                        )
                      }
                      placeholder="Nombre y apellidos"
                      className={
                        inputClass(
                          modoOscuro
                        )
                      }
                    />

                  </Campo>


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
                        autoComplete="new-password"
                        value={
                          passwordCorreo
                        }
                        onChange={(e) =>
                          setPasswordCorreo(
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


                    <SeguridadPassword
                      seguridad={
                        seguridadCorreo
                      }
                      modoOscuro={
                        modoOscuro
                      }
                    />

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

                    <div className="relative">

                      <input
                        type={
                          mostrarConfirmacionCorreo
                            ? "text"
                            : "password"
                        }
                        autoComplete="new-password"
                        value={
                          confirmarPasswordCorreo
                        }
                        onChange={(e) =>
                          setConfirmarPasswordCorreo(
                            e.target.value
                          )
                        }
                        placeholder="Repite la contraseña"
                        className={`${inputClass(
                          modoOscuro
                        )} pr-12`}
                      />


                      <button
                        type="button"
                        onClick={() =>
                          setMostrarConfirmacionCorreo(
                            (
                              actual
                            ) =>
                              !actual
                          )
                        }
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-sky-500"
                      >

                        {mostrarConfirmacionCorreo
                          ? <FaEyeSlash />
                          : <FaEye />
                        }

                      </button>

                    </div>


                    {confirmarPasswordCorreo && (

                      <p
                        className={`
                          text-xs
                          mt-2

                          ${
                            passwordCorreo ===
                            confirmarPasswordCorreo
                              ? "text-emerald-500"
                              : "text-red-500"
                          }
                        `}
                      >

                        {passwordCorreo ===
                        confirmarPasswordCorreo
                          ? "✓ Las contraseñas coinciden"
                          : "Las contraseñas no coinciden"
                        }

                      </p>

                    )}

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

                    <FaUserPlus />


                    {loading
                      ? "Creando cuenta..."
                      : "Crear cuenta"
                    }


                    {!loading && (
                      <FaArrowRight />
                    )}

                  </button>


                  <button
                    type="button"
                    onClick={
                      volverOpciones
                    }
                    className={
                      botonVolver(
                        modoOscuro
                      )
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

                <div className="space-y-5">

                  {/* PASO 1 */}

                  {pasoTelefono ===
                    1 && (

                    <>

                      <Campo
                        label="Nombre completo"
                        icon={
                          <FaUser />
                        }
                        modoOscuro={
                          modoOscuro
                        }
                      >

                        <input
                          type="text"
                          autoComplete="name"
                          value={
                            nombre
                          }
                          onChange={(e) =>
                            setNombre(
                              e.target.value
                            )
                          }
                          placeholder="Nombre y apellidos"
                          className={
                            inputClass(
                              modoOscuro
                            )
                          }
                        />

                      </Campo>


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


                        <p className="text-xs mt-2 text-slate-500">

                          Recibirás un código SMS para verificar que el número te pertenece.

                        </p>

                      </Campo>


                      <button
                        type="button"
                        onClick={
                          enviarCodigo
                        }
                        disabled={
                          loading
                        }
                        className={
                          botonPrincipal
                        }
                      >

                        <FaSms />


                        {loading
                          ? "Enviando código..."
                          : "Enviar código"
                        }


                        {!loading && (
                          <FaArrowRight />
                        )}

                      </button>


                      <button
                        type="button"
                        onClick={
                          volverOpciones
                        }
                        className={
                          botonVolver(
                            modoOscuro
                          )
                        }
                      >

                        <FaArrowLeft />

                        Volver

                      </button>

                    </>

                  )}


                  {/* PASO 2 */}

                  {pasoTelefono ===
                    2 && (

                    <>

                      <div
                        className={`
                          border

                          rounded-2xl

                          p-4

                          ${
                            modoOscuro
                              ? "bg-sky-500/10 border-sky-500/20"
                              : "bg-sky-50 border-sky-200"
                          }
                        `}
                      >

                        <p className="text-sky-500 font-semibold">

                          Código enviado

                        </p>


                        <p className="text-slate-500 text-sm mt-1">

                          {telefonoVerificado}

                        </p>

                      </div>


                      <Campo
                        label="Código de verificación"
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
                          maxLength={
                            6
                          }
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
                          )} text-center text-2xl font-bold tracking-[0.35em]`}
                        />

                      </Campo>


                      <button
                        type="button"
                        onClick={
                          verificarCodigo
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
                          : "Verificar teléfono"
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
                          botonVolver(
                            modoOscuro
                          )
                        }
                      >

                        <FaArrowLeft />

                        Cambiar método

                      </button>

                    </>

                  )}


                  {/* PASO 3 */}

                  {pasoTelefono ===
                    3 && (

                    <>

                      <div
                        className={`
                          border

                          rounded-2xl

                          p-4

                          flex
                          items-start
                          gap-3

                          ${
                            modoOscuro
                              ? "bg-emerald-500/10 border-emerald-500/20"
                              : "bg-emerald-50 border-emerald-200"
                          }
                        `}
                      >

                        <FaCheckCircle className="text-emerald-500 mt-0.5" />


                        <div>

                          <p className="text-emerald-600 font-semibold">

                            Teléfono verificado

                          </p>


                          <p className="text-slate-500 text-sm mt-1">

                            {telefonoVerificado}

                          </p>

                        </div>

                      </div>


                      <Campo
                        label="Crear contraseña"
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
                            autoComplete="new-password"
                            value={
                              passwordTelefono
                            }
                            onChange={(e) =>
                              setPasswordTelefono(
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


                        <SeguridadPassword
                          seguridad={
                            seguridadTelefono
                          }
                          modoOscuro={
                            modoOscuro
                          }
                        />

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

                        <div className="relative">

                          <input
                            type={
                              mostrarConfirmacionTelefono
                                ? "text"
                                : "password"
                            }
                            autoComplete="new-password"
                            value={
                              confirmarPasswordTelefono
                            }
                            onChange={(e) =>
                              setConfirmarPasswordTelefono(
                                e.target.value
                              )
                            }
                            placeholder="Repite la contraseña"
                            className={`${inputClass(
                              modoOscuro
                            )} pr-12`}
                          />


                          <button
                            type="button"
                            onClick={() =>
                              setMostrarConfirmacionTelefono(
                                (
                                  actual
                                ) =>
                                  !actual
                              )
                            }
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-sky-500"
                          >

                            {mostrarConfirmacionTelefono
                              ? <FaEyeSlash />
                              : <FaEye />
                            }

                          </button>

                        </div>


                        {confirmarPasswordTelefono && (

                          <p
                            className={`
                              text-xs
                              mt-2

                              ${
                                passwordTelefono ===
                                confirmarPasswordTelefono
                                  ? "text-emerald-500"
                                  : "text-red-500"
                              }
                            `}
                          >

                            {passwordTelefono ===
                            confirmarPasswordTelefono
                              ? "✓ Las contraseñas coinciden"
                              : "Las contraseñas no coinciden"
                            }

                          </p>

                        )}

                      </Campo>


                      <button
                        type="button"
                        onClick={
                          crearCuentaTelefono
                        }
                        disabled={
                          loading
                        }
                        className={
                          botonPrincipal
                        }
                      >

                        <FaUserPlus />


                        {loading
                          ? "Creando cuenta..."
                          : "Crear mi cuenta"
                        }


                        {!loading && (
                          <FaArrowRight />
                        )}

                      </button>

                    </>

                  )}

                </div>

              )}


              <div
                id="recaptcha-register"
              />


              {/* LOGIN */}

              <div
                className={`
                  mt-7
                  pt-6

                  border-t

                  text-center

                  ${
                    modoOscuro
                      ? "border-slate-800"
                      : "border-sky-100"
                  }
                `}
              >

                <p className="text-sm text-slate-500">

                  ¿Ya tienes una cuenta?


                  <Link
                    to="/login"
                    className="text-sky-500 hover:text-sky-600 ml-2 font-bold"
                  >

                    Iniciar sesión

                  </Link>

                </p>

              </div>


              <div
                className={`
                  mt-5

                  border

                  rounded-2xl

                  p-4

                  ${
                    modoOscuro
                      ? "bg-slate-900 border-slate-700"
                      : "bg-sky-50 border-sky-100"
                  }
                `}
              >

                <div className="flex items-start gap-3">

                  <FaShieldAlt className="text-sky-500 mt-0.5 shrink-0" />


                  <p className="text-xs leading-relaxed text-slate-500">

                    Tu cuenta Macro te permitirá contratar
                    servicios, administrar proyectos y realizar
                    compras dentro de la plataforma.

                  </p>

                </div>

              </div>

            </div>

          </section>

        </div>

      </main>

    </div>
  );
}


/* ======================================================
   CAMPO
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


/* ======================================================
   SERVICIO CARD
====================================================== */

function ServicioCard({
  icon,
  titulo,
  texto,
}) {
  const {
    modoOscuro = false,
  } =
    useOutletContext() || {};


  return (
    <div
      className={`
        rounded-2xl

        border

        p-4

        ${
          modoOscuro
            ? "bg-slate-900/70 border-slate-700"
            : "bg-white/70 border-sky-100"
        }
      `}
    >

      <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-500 flex items-center justify-center">

        {icon}

      </div>


      <p className="font-semibold mt-3">

        {titulo}

      </p>


      <p className="text-xs text-slate-500 mt-1 leading-relaxed">

        {texto}

      </p>

    </div>
  );
}


/* ======================================================
   SEGURIDAD PASSWORD
====================================================== */

function SeguridadPassword({
  seguridad,
  modoOscuro,
}) {
  if (
    !seguridad?.nivel
  ) {
    return null;
  }


  return (
    <div className="mt-3">

      <div className="grid grid-cols-3 gap-2">

        <BarraSeguridad
          activa={
            seguridad.nivel >=
            1
          }
          clase="bg-red-400"
          modoOscuro={
            modoOscuro
          }
        />


        <BarraSeguridad
          activa={
            seguridad.nivel >=
            2
          }
          clase="bg-sky-400"
          modoOscuro={
            modoOscuro
          }
        />


        <BarraSeguridad
          activa={
            seguridad.nivel >=
            3
          }
          clase="bg-emerald-400"
          modoOscuro={
            modoOscuro
          }
        />

      </div>


      <div className="flex items-center justify-between mt-2">

        <p className="text-xs text-slate-500">

          Mínimo 8 caracteres

        </p>


        <p
          className={`
            text-xs
            font-semibold

            ${
              seguridad.nivel ===
              1
                ? "text-red-400"
                : seguridad.nivel ===
                  2
                ? "text-sky-400"
                : "text-emerald-400"
            }
          `}
        >

          {seguridad.texto}

        </p>

      </div>

    </div>
  );
}


/* ======================================================
   BARRA PASSWORD
====================================================== */

function BarraSeguridad({
  activa,
  clase,
  modoOscuro,
}) {
  return (
    <div
      className={`
        h-1.5
        rounded-full

        ${
          activa
            ? clase
            : modoOscuro
            ? "bg-slate-700"
            : "bg-slate-200"
        }
      `}
    />
  );
}


/* ======================================================
   ALERTAS
====================================================== */

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

    transition

    appearance-none

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
    disabled:cursor-not-allowed

    ${
      modoOscuro
        ? `
          bg-slate-950
          border-slate-700
          text-white

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


const botonVolver =
  (modoOscuro) => `
    w-full

    py-3

    text-sm

    flex
    items-center
    justify-center
    gap-2

    transition

    ${
      modoOscuro
        ? `
          text-slate-400
          hover:text-sky-400
        `
        : `
          text-slate-500
          hover:text-sky-500
        `
    }
  `;


export default Register;