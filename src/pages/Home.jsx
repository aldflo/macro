import Navbar from "../components/Navbar"

export default function Home(){

return(

<div className="min-h-screen bg-black text-white">

<Navbar/>

<div className="p-10">

<h1 className="text-4xl text-cyan-400 mb-6">
Bienvenido a Macro
</h1>

<p className="text-zinc-400 max-w-xl">

Macro es una plataforma donde centralizo
mis proyectos, herramientas y servicios.
Desde aquí puedo administrar aplicaciones,
ventas y desarrollos.

</p>

</div>

</div>

)

}
