import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  onAuthStateChanged,
} from "firebase/auth";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import {
  auth,
  db,
} from "../firebase.config";

import {
  FaCode,
  FaCommentDots,
  FaHeart,
  FaPaperPlane,
  FaRegHeart,
  FaTrash,
  FaUserCircle,
} from "react-icons/fa";


function PublicacionesFeed({
  modoOscuro = false,
  limite = null,
  titulo = "Novedades de Macro",
  descripcion = "Actualizaciones, proyectos, promociones y noticias.",
}) {
  const navigate =
    useNavigate();


  const [
    usuario,
    setUsuario,
  ] = useState(
    auth.currentUser
  );


  const [
    publicaciones,
    setPublicaciones,
  ] = useState([]);


  const [
    likes,
    setLikes,
  ] = useState({});


  const [
    comentarios,
    setComentarios,
  ] = useState({});


  const [
    textos,
    setTextos,
  ] = useState({});


  const [
    cargando,
    setCargando,
  ] = useState(true);


  /* ======================================================
     AUTH
  ====================================================== */

  useEffect(() => {
    const unsub =
      onAuthStateChanged(
        auth,
        (user) => {
          setUsuario(
            user
          );
        }
      );


    return () =>
      unsub();

  }, []);


  /* ======================================================
     PUBLICACIONES
  ====================================================== */

  useEffect(() => {
    const consulta =
      query(
        collection(
          db,
          "publicaciones"
        ),
        orderBy(
          "fecha",
          "desc"
        )
      );


    const unsub =
      onSnapshot(
        consulta,

        (snapshot) => {
          const data =
            snapshot.docs
              .map(
                (documento) => ({
                  id:
                    documento.id,

                  ...documento.data(),
                })
              )
              .filter(
                (item) =>
                  item.visible !==
                  false
              );


          setPublicaciones(
            data
          );


          setCargando(
            false
          );
        },

        (error) => {
          console.error(
            "Error publicaciones:",
            error
          );


          setCargando(
            false
          );
        }
      );


    return () =>
      unsub();

  }, []);


  /* ======================================================
     LIKES Y COMENTARIOS
  ====================================================== */

  useEffect(() => {
    if (
      publicaciones.length ===
      0
    ) {
      setLikes({});
      setComentarios({});
      return;
    }


    const unsubscribeLikes =
      [];


    const unsubscribeComentarios =
      [];


    publicaciones.forEach(
      (publicacion) => {

        /* LIKES */

        const unsubLikes =
          onSnapshot(
            collection(
              db,
              "publicaciones",
              publicacion.id,
              "likes"
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


              setLikes(
                (prev) => ({
                  ...prev,

                  [publicacion.id]:
                    data,
                })
              );
            }
          );


        unsubscribeLikes.push(
          unsubLikes
        );


        /* COMENTARIOS */

        const consultaComentarios =
          query(
            collection(
              db,
              "publicaciones",
              publicacion.id,
              "comentarios"
            ),

            orderBy(
              "fecha",
              "asc"
            )
          );


        const unsubComentarios =
          onSnapshot(
            consultaComentarios,

            (snapshot) => {
              const data =
                snapshot.docs.map(
                  (documento) => ({
                    id:
                      documento.id,

                    ...documento.data(),
                  })
                );


              setComentarios(
                (prev) => ({
                  ...prev,

                  [publicacion.id]:
                    data,
                })
              );
            }
          );


        unsubscribeComentarios.push(
          unsubComentarios
        );
      }
    );


    return () => {
      unsubscribeLikes.forEach(
        (unsub) =>
          unsub()
      );


      unsubscribeComentarios.forEach(
        (unsub) =>
          unsub()
      );
    };

  }, [
    publicaciones,
  ]);


  /* ======================================================
     LISTA VISIBLE
  ====================================================== */

  const publicacionesVisibles =
    useMemo(() => {
      if (
        limite &&
        limite > 0
      ) {
        return publicaciones.slice(
          0,
          limite
        );
      }


      return publicaciones;

    }, [
      publicaciones,
      limite,
    ]);


  /* ======================================================
     LIKE
  ====================================================== */

  const toggleLike =
    async (
      publicacionId
    ) => {
      if (!usuario) {
        navigate(
          "/login"
        );

        return;
      }


      const likeRef =
        doc(
          db,
          "publicaciones",
          publicacionId,
          "likes",
          usuario.uid
        );


      const likesActuales =
        likes[
          publicacionId
        ] || [];


      const yaDioLike =
        likesActuales.some(
          (item) =>
            item.id ===
            usuario.uid
        );


      try {
        if (yaDioLike) {

          await deleteDoc(
            likeRef
          );

        } else {

          await setDoc(
            likeRef,
            {
              uid:
                usuario.uid,

              nombre:
                usuario.displayName ||
                "Usuario",

              correo:
                usuario.email ||
                "",

              fecha:
                serverTimestamp(),
            }
          );
        }

      } catch (error) {
        console.error(
          "Error like:",
          error
        );
      }
    };


  /* ======================================================
     COMENTAR
  ====================================================== */

  const enviarComentario =
    async (
      publicacionId
    ) => {
      if (!usuario) {
        navigate(
          "/login"
        );

        return;
      }


      const texto =
        String(
          textos[
            publicacionId
          ] || ""
        ).trim();


      if (!texto) {
        return;
      }


      if (
        texto.length >
        500
      ) {
        return;
      }


      try {
        await addDoc(
          collection(
            db,
            "publicaciones",
            publicacionId,
            "comentarios"
          ),
          {
            uid:
              usuario.uid,

            nombre:
              usuario.displayName ||
              usuario.email ||
              "Usuario",

            correo:
              usuario.email ||
              "",

            texto,

            fecha:
              serverTimestamp(),
          }
        );


        setTextos(
          (prev) => ({
            ...prev,

            [publicacionId]:
              "",
          })
        );

      } catch (error) {
        console.error(
          "Error comentario:",
          error
        );
      }
    };


  /* ======================================================
     BORRAR COMENTARIO PROPIO
  ====================================================== */

  const eliminarComentario =
    async (
      publicacionId,
      comentario
    ) => {
      if (!usuario) {
        return;
      }


      if (
        comentario.uid !==
        usuario.uid
      ) {
        return;
      }


      try {
        await deleteDoc(
          doc(
            db,
            "publicaciones",
            publicacionId,
            "comentarios",
            comentario.id
          )
        );

      } catch (error) {
        console.error(
          "Error eliminando comentario:",
          error
        );
      }
    };


  /* ======================================================
     FECHA
  ====================================================== */

  const formatoFecha =
    (timestamp) => {
      if (!timestamp) {
        return "Ahora";
      }


      const fecha =
        timestamp
          ?.toDate?.();


      if (!fecha) {
        return "Ahora";
      }


      return fecha.toLocaleString(
        "es-MX",
        {
          day:
            "numeric",

          month:
            "short",

          hour:
            "numeric",

          minute:
            "2-digit",
        }
      );
    };


  /* ======================================================
     LOADING
  ====================================================== */

  if (cargando) {
    return (
      <div
        className="
          py-10
          text-center
          text-slate-400
        "
      >

        Cargando publicaciones...

      </div>
    );
  }


  /* ======================================================
     VACÍO
  ====================================================== */

  if (
    publicacionesVisibles.length ===
    0
  ) {
    return null;
  }


  /* ======================================================
     RENDER
  ====================================================== */

  return (
    <section>

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

          Comunidad Macro

        </p>


        <h2
          className="
            text-3xl
            md:text-4xl

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

          {descripcion}

        </p>

      </div>


      <div
        className="
          max-w-3xl

          space-y-6
        "
      >

        {publicacionesVisibles.map(
          (publicacion) => {
            const likesPublicacion =
              likes[
                publicacion.id
              ] || [];


            const comentariosPublicacion =
              comentarios[
                publicacion.id
              ] || [];


            const dioLike =
              usuario
                ? likesPublicacion.some(
                    (item) =>
                      item.id ===
                      usuario.uid
                  )
                : false;


            return (
              <article
                key={
                  publicacion.id
                }
                className={`
                  rounded-[26px]

                  border

                  overflow-hidden

                  ${
                    modoOscuro
                      ? `
                        bg-slate-900
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

                {/* HEADER */}

                <div
                  className="
                    px-5
                    pt-5

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

                      bg-gradient-to-br
                      from-sky-400
                      to-blue-600

                      text-white

                      flex
                      items-center
                      justify-center
                    "
                  >

                    <FaCode />

                  </div>


                  <div>

                    <p className="font-bold">

                      Macro

                    </p>


                    <p
                      className="
                        text-xs
                        text-slate-400

                        mt-0.5
                      "
                    >

                      {formatoFecha(
                        publicacion.fecha
                      )}

                    </p>

                  </div>

                </div>


                {/* TEXTO */}

                {publicacion.texto && (

                  <p
                    className="
                      px-5
                      py-5

                      whitespace-pre-wrap

                      leading-relaxed
                    "
                  >

                    {publicacion.texto}

                  </p>

                )}


                {/* IMAGEN */}

                {publicacion.imagen && (

                  <img
                    src={
                      publicacion.imagen
                    }
                    alt="Publicación de Macro"
                    loading="lazy"
                    className="
                      w-full

                      max-h-[620px]

                      object-cover
                    "
                  />

                )}


                {/* CONTADORES */}

                <div
                  className="
                    px-5
                    py-3

                    flex
                    items-center
                    justify-between

                    text-sm
                    text-slate-500

                    border-b
                    border-slate-100
                  "
                >

                  <span
                    className="
                      flex
                      items-center
                      gap-2
                    "
                  >

                    <span
                      className="
                        w-6
                        h-6

                        rounded-full

                        bg-sky-500
                        text-white

                        flex
                        items-center
                        justify-center

                        text-xs
                      "
                    >

                      <FaHeart />

                    </span>


                    {
                      likesPublicacion.length
                    }

                  </span>


                  <span>

                    {
                      comentariosPublicacion.length
                    }{" "}

                    {comentariosPublicacion.length ===
                    1
                      ? "comentario"
                      : "comentarios"
                    }

                  </span>

                </div>


                {/* ACCIONES */}

                <div
                  className="
                    grid
                    grid-cols-2

                    border-b
                    border-slate-100
                  "
                >

                  <button
                    type="button"
                    onClick={() =>
                      toggleLike(
                        publicacion.id
                      )
                    }
                    className={`
                      py-3.5

                      flex
                      items-center
                      justify-center
                      gap-2

                      font-semibold

                      transition

                      ${
                        dioLike
                          ? "text-sky-500"
                          : "text-slate-500 hover:bg-sky-50 hover:text-sky-500"
                      }
                    `}
                  >

                    {dioLike
                      ? <FaHeart />
                      : <FaRegHeart />
                    }


                    Me gusta

                  </button>


                  <button
                    type="button"
                    onClick={() => {
                      if (!usuario) {
                        navigate(
                          "/login"
                        );

                        return;
                      }


                      document
                        .getElementById(
                          `comentario-${publicacion.id}`
                        )
                        ?.focus();
                    }}
                    className="
                      py-3.5

                      flex
                      items-center
                      justify-center
                      gap-2

                      text-slate-500

                      font-semibold

                      hover:bg-sky-50
                      hover:text-sky-500

                      transition
                    "
                  >

                    <FaCommentDots />

                    Comentar

                  </button>

                </div>


                {/* COMENTARIOS */}

                {comentariosPublicacion.length >
                  0 && (

                  <div
                    className="
                      px-5
                      pt-4

                      space-y-3
                    "
                  >

                    {comentariosPublicacion
                      .slice(
                        -6
                      )
                      .map(
                        (
                          comentario
                        ) => (

                          <div
                            key={
                              comentario.id
                            }
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

                                rounded-full

                                bg-sky-50
                                text-sky-500

                                flex
                                items-center
                                justify-center

                                shrink-0
                              "
                            >

                              <FaUserCircle />

                            </div>


                            <div className="flex-1 min-w-0">

                              <div
                                className={`
                                  inline-block

                                  max-w-full

                                  px-4
                                  py-2.5

                                  rounded-2xl

                                  ${
                                    modoOscuro
                                      ? "bg-slate-950"
                                      : "bg-slate-100"
                                  }
                                `}
                              >

                                <p
                                  className="
                                    text-sm
                                    font-bold
                                  "
                                >

                                  {
                                    comentario.nombre ||
                                    "Usuario"
                                  }

                                </p>


                                <p
                                  className="
                                    text-sm
                                    mt-1

                                    break-words
                                  "
                                >

                                  {
                                    comentario.texto
                                  }

                                </p>

                              </div>


                              <div
                                className="
                                  flex
                                  items-center
                                  gap-3

                                  mt-1
                                  ml-2

                                  text-[11px]
                                  text-slate-400
                                "
                              >

                                <span>

                                  {
                                    formatoFecha(
                                      comentario.fecha
                                    )
                                  }

                                </span>


                                {usuario?.uid ===
                                  comentario.uid && (

                                  <button
                                    type="button"
                                    onClick={() =>
                                      eliminarComentario(
                                        publicacion.id,
                                        comentario
                                      )
                                    }
                                    className="
                                      text-red-400

                                      flex
                                      items-center
                                      gap-1
                                    "
                                  >

                                    <FaTrash />

                                    Eliminar

                                  </button>

                                )}

                              </div>

                            </div>

                          </div>

                        )
                      )}

                  </div>

                )}


                {/* ESCRIBIR COMENTARIO */}

                <div className="p-5">

                  {usuario ? (

                    <div
                      className="
                        flex
                        items-center
                        gap-3
                      "
                    >

                      <div
                        className="
                          w-10
                          h-10

                          rounded-full

                          bg-sky-50
                          text-sky-500

                          flex
                          items-center
                          justify-center

                          shrink-0
                        "
                      >

                        <FaUserCircle />

                      </div>


                      <div
                        className={`
                          flex-1

                          border

                          rounded-full

                          flex
                          items-center

                          overflow-hidden

                          ${
                            modoOscuro
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

                        <input
                          id={`comentario-${publicacion.id}`}
                          type="text"
                          maxLength={
                            500
                          }
                          value={
                            textos[
                              publicacion.id
                            ] || ""
                          }
                          onChange={(e) =>
                            setTextos(
                              (
                                prev
                              ) => ({
                                ...prev,

                                [publicacion.id]:
                                  e.target.value,
                              })
                            )
                          }
                          onKeyDown={(e) => {
                            if (
                              e.key ===
                              "Enter"
                            ) {
                              enviarComentario(
                                publicacion.id
                              );
                            }
                          }}
                          placeholder="Escribe un comentario..."
                          className={`
                            flex-1

                            bg-transparent

                            outline-none

                            px-4
                            py-3

                            text-sm

                            ${
                              modoOscuro
                                ? "text-white"
                                : "text-slate-900"
                            }
                          `}
                        />


                        <button
                          type="button"
                          onClick={() =>
                            enviarComentario(
                              publicacion.id
                            )
                          }
                          className="
                            w-11
                            h-11

                            m-1

                            rounded-full

                            bg-sky-500
                            hover:bg-sky-600

                            text-white

                            flex
                            items-center
                            justify-center

                            shrink-0
                          "
                        >

                          <FaPaperPlane />

                        </button>

                      </div>

                    </div>

                  ) : (

                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          "/login"
                        )
                      }
                      className="
                        w-full

                        py-3

                        rounded-xl

                        bg-sky-50
                        hover:bg-sky-100

                        text-sky-600

                        font-semibold
                      "
                    >

                      Inicia sesión para comentar o dar Me gusta

                    </button>

                  )}

                </div>

              </article>
            );
          }
        )}

      </div>

    </section>
  );
}


export default PublicacionesFeed;