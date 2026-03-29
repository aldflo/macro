import Navbar from "../components/Navbar"
import ParkAmigo from "../assets/ParkAmigo.jpg"
import RRHH from "../assets/RRHH.jpg"
import JadayPeChugas from "../assets/logojaday.png"

export default function Proyectos(){

return(

<div className="min-h-screen bg-black text-white">

<Navbar/>

<div className="p-10">

<h1 className="text-3xl text-cyan-400 mb-10">
Mis Proyectos
</h1>

{/* JadayPeChugas */}
<div className="group relative bg-gray-900 rounded-xl overflow-hidden border border-cyan-400/30 shadow-lg hover:shadow-cyan-400/40 transform hover:-translate-y-2 hover:scale-[1.02] transition-all duration-300">

  {/* Glow effect */}
  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition duration-300"></div>

  <div className="relative p-6">

    <img
      src={JadayPeChugas}
      alt="JadayPeChugas"
      className="w-full h-44 object-cover rounded-lg mb-4"
    />

    <h4 className="text-2xl font-bold text-cyan-300 mb-2">
      JadayPeChugas
    </h4>

    <p className="text-gray-300 text-sm mb-4 leading-relaxed">
      Plataforma web para negocio de alimentos donde los clientes pueden
      visualizar productos, conocer el menú y contactar al negocio.
      Diseñada con una interfaz moderna y responsive.
    </p>

    {/* Tecnologías */}
    <div className="flex flex-wrap gap-2 mb-5">

      <span className="bg-blue-500/20 text-blue-300 px-3 py-1 text-xs rounded-full">
        React
      </span>

      <span className="bg-teal-500/20 text-teal-300 px-3 py-1 text-xs rounded-full">
        Tailwind
      </span>

      <span className="bg-purple-500/20 text-purple-300 px-3 py-1 text-xs rounded-full">
        UI Design
      </span>

      <span className="bg-green-500/20 text-green-300 px-3 py-1 text-xs rounded-full">
        Responsive
      </span>

    </div>

    {/* Botones */}
    <div className="flex gap-3">

      <a
        href="TU_LINK_GITHUB"
        target="_blank"
        rel="noopener noreferrer"
        className="px-4 py-2 bg-cyan-400 text-black font-semibold rounded-lg hover:bg-cyan-500 transition"
      >
        Código
      </a>

      <a
        href="TU_LINK_DEMO"
        target="_blank"
        rel="noopener noreferrer"
        className="px-4 py-2 bg-green-400 text-black font-semibold rounded-lg hover:bg-green-500 transition"
      >
        Demo
      </a>

    </div>

  </div>
</div>
</div>
</div>



)

}