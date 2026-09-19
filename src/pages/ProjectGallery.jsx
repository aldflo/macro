import {
  useMemo,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  FaArrowRight,
  FaBullhorn,
  FaCamera,
  FaCode,
  FaGlobe,
  FaLaptopCode,
  FaMobileAlt,
  FaStar,
  FaTools,
} from "react-icons/fa";


function ProjectGallery({
  proyectos = [],
  limite = 6,
  titulo = "Proyectos de Macro",
  descripcion = "Explora algunos de nuestros proyectos y soluciones tecnológicas.",
  modoOscuro = false,
  onSelectProject = null,
}) {
  const navigate =
    useNavigate();


  /* ======================================================
     NORMALIZAR PROYECTOS
  ====================================================== */

  const proyectosVisibles =
    useMemo(() => {
      if (
        !Array.isArray(
          proyectos
        )
      ) {
        return [];
      }


      return proyectos
        .filter(Boolean)
        .slice(
          0,
          limite
        );

    }, [
      proyectos,
      limite,
    ]);


  /* ======================================================
     ICONO SEGÚN TIPO
  ====================================================== */

  const obtenerIcono =
    (tipo = "") => {
      const valor =
        String(
          tipo
        ).toLowerCase();


      if (
        valor.includes(
          "web"
        ) ||
        valor.includes(
          "pagina"
        ) ||
        valor.includes(
          "página"
        )
      ) {
        return <FaGlobe />;
      }


      if (
        valor.includes(
          "app"
        ) ||
        valor.includes(
          "movil"
        ) ||
        valor.includes(
          "móvil"
        )
      ) {
        return <FaMobileAlt />;
      }


      if (
        valor.includes(
          "camara"
        ) ||
        valor.includes(
          "cámara"
        ) ||
        valor.includes(
          "seguridad"
        )
      ) {
        return <FaCamera />;
      }


      if (
        valor.includes(
          "publicidad"
        ) ||
        valor.includes(
          "marketing"
        )
      ) {
        return <FaBullhorn />;
      }


      if (
        valor.includes(
          "software"
        ) ||
        valor.includes(
          "sistema"
        )
      ) {
        return <FaLaptopCode />;
      }


      return <FaTools />;
    };


  /* ======================================================
     NOMBRE TIPO
  ====================================================== */

  const obtenerTipo =
    (proyecto) => {
      return (
        proyecto.categoria ||
        proyecto.tipo ||
        "Proyecto"
      );
    };


  /* ======================================================
     ABRIR PROYECTO
  ====================================================== */

  const abrirProyecto =
    (proyecto) => {
      if (
        typeof onSelectProject ===
        "function"
      ) {
        onSelectProject(
          proyecto
        );

        return;
      }


      navigate(
        `/proyecto/${proyecto.id}`
      );
    };


  /* ======================================================
     VACÍO
  ====================================================== */

  if (
    proyectosVisibles.length ===
    0
  ) {
    return (
      <div
        className={`
          w-full

          rounded-3xl

          border
          border-dashed

          p-8

          text-center

          ${
            modoOscuro
              ? `
                bg-slate-900
                border-slate-700
              `
              : `
                bg-sky-50
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

            bg-sky-100
            text-sky-500

            flex
            items-center
            justify-center

            text-xl
          "
        >

          <FaCode />

        </div>


        <h3
          className="
            text-lg
            font-bold

            mt-4
          "
        >

          Aún no hay proyectos

        </h3>


        <p
          className="
            text-sm
            text-slate-500

            mt-2
          "
        >

          Cuando Macro publique proyectos,
          aparecerán aquí.

        </p>

      </div>
    );
  }


  /* ======================================================
     RENDER
  ====================================================== */

  return (
    <div
      className="
        w-full
      "
    >

      {/* HEADER */}

      <div
        className="
          mb-4
        "
      >

        <p
          className="
            text-xs

            uppercase
            tracking-[0.2em]

            text-sky-500

            font-bold
          "
        >

          Portafolio Macro

        </p>


        <h3
          className="
            text-xl
            font-black

            mt-1
          "
        >

          {titulo}

        </h3>


        {descripcion && (

          <p
            className="
              text-sm
              text-slate-500

              mt-1
            "
          >

            {descripcion}

          </p>

        )}

      </div>


      {/* GRID */}

      <div
        className="
          grid
          sm:grid-cols-2

          gap-4
        "
      >

        {proyectosVisibles.map(
          (proyecto) => {

            const tipo =
              obtenerTipo(
                proyecto
              );


            const imagen =
              proyecto.imagen ||
              (
                Array.isArray(
                  proyecto.imagenes
                )
                  ? proyecto.imagenes[0]
                  : ""
              ) ||
              (
                Array.isArray(
                  proyecto.galeria
                )
                  ? proyecto.galeria[0]
                  : ""
              );


            return (
              <button
                key={
                  proyecto.id ||
                  proyecto.nombre
                }
                type="button"
                onClick={() =>
                  abrirProyecto(
                    proyecto
                  )
                }
                className={`
                  group

                  text-left

                  rounded-2xl

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

                {/* IMAGEN */}

                <div
                  className="
                    relative

                    aspect-[16/10]

                    bg-gradient-to-br
                    from-sky-100
                    to-blue-100

                    overflow-hidden
                  "
                >

                  {imagen ? (

                    <img
                      src={
                        imagen
                      }
                      alt={
                        proyecto.nombre ||
                        "Proyecto Macro"
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

                        text-4xl
                        text-sky-400
                      "
                    >

                      {obtenerIcono(
                        tipo
                      )}

                    </div>

                  )}


                  <div
                    className="
                      absolute
                      inset-0

                      bg-gradient-to-t
                      from-black/65
                      via-black/5
                      to-transparent
                    "
                  />


                  {/* TIPO */}

                  <span
                    className="
                      absolute
                      top-3
                      left-3

                      bg-black/70

                      backdrop-blur-md

                      border
                      border-white/10

                      text-white

                      px-3
                      py-1.5

                      rounded-full

                      text-[10px]
                      font-semibold

                      flex
                      items-center
                      gap-1.5
                    "
                  >

                    {obtenerIcono(
                      tipo
                    )}

                    {tipo}

                  </span>


                  {/* DESTACADO */}

                  {proyecto.destacado && (

                    <span
                      className="
                        absolute
                        top-3
                        right-3

                        bg-sky-500
                        text-white

                        w-8
                        h-8

                        rounded-full

                        flex
                        items-center
                        justify-center
                      "
                    >

                      <FaStar
                        size={12}
                      />

                    </span>

                  )}

                </div>


                {/* INFORMACIÓN */}

                <div
                  className="
                    p-4
                  "
                >

                  <h4
                    className="
                      text-base
                      font-bold

                      line-clamp-1
                    "
                  >

                    {proyecto.nombre ||
                      "Proyecto Macro"
                    }

                  </h4>


                  {proyecto.descripcion && (

                    <p
                      className="
                        text-sm
                        text-slate-500

                        mt-2

                        line-clamp-2
                      "
                    >

                      {
                        proyecto.descripcion
                      }

                    </p>

                  )}


                  {/* TECNOLOGÍAS */}

                  {Array.isArray(
                    proyecto.tecnologias
                  ) &&
                    proyecto
                      .tecnologias
                      .length >
                      0 && (

                      <div
                        className="
                          flex
                          flex-wrap

                          gap-1.5

                          mt-3
                        "
                      >

                        {proyecto.tecnologias
                          .slice(
                            0,
                            3
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

                                  px-2
                                  py-1

                                  rounded-full

                                  text-[9px]
                                  font-semibold
                                "
                              >

                                {tecnologia}

                              </span>

                            )
                          )}

                      </div>

                    )}


                  {/* FOOTER */}

                  <div
                    className="
                      mt-4

                      flex
                      items-center
                      justify-between
                      gap-3
                    "
                  >

                    {proyecto.estado ? (

                      <span
                        className="
                          text-[10px]

                          uppercase
                          tracking-wide

                          text-slate-400
                        "
                      >

                        {proyecto.estado}

                      </span>

                    ) : (

                      <span />

                    )}


                    <span
                      className="
                        text-sky-500

                        text-xs
                        font-semibold

                        flex
                        items-center
                        gap-1.5
                      "
                    >

                      Ver proyecto


                      <FaArrowRight
                        className="
                          transition-transform

                          group-hover:translate-x-1
                        "
                      />

                    </span>

                  </div>

                </div>

              </button>
            );
          }
        )}

      </div>

    </div>
  );
}


export default ProjectGallery;