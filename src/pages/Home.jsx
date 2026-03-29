import Navbar from "../components/Navbar"
import { auth } from "../services/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import macro from "../assets/macro.jpg"

export default function Home(){

const [user,setUser] = useState(null)
const navigate = useNavigate()

const nuevaVenta = () => {
  navigate("/ventas")
}

useEffect(()=>{
  const unsubscribe = onAuthStateChanged(auth,(currentUser)=>{
    if(currentUser){
      setUser(currentUser)
    }else{
      navigate("/")
    }
  })
  return ()=> unsubscribe()
},[navigate])

return(

<div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] to-black text-white">

<Navbar user={user}/>

{/* CONTENEDOR CENTRAL */}
<div className="max-w-6xl mx-auto px-4 pb-24">

{/* HERO / BANNER */}
<div className="mt-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between shadow-lg">

  <div>
    <h1 className="text-2xl md:text-4xl font-bold mb-2">
      Bienvenido a Macro
    </h1>

    <p className="text-sm md:text-base text-white/80 max-w-md">
      Centraliza tus proyectos, ventas y herramientas en un solo lugar.
    </p>

    <button
      onClick={nuevaVenta}
      className="mt-4 bg-white text-black px-5 py-2 rounded-full font-semibold hover:scale-105 transition"
    >
      Nueva venta
    </button>
  </div>

  <img
    src={macro}
    alt="Macro"
    className="w-40 mt-4 md:mt-0 rounded-xl shadow-md"
  />

</div>

{/* ACCIONES RÁPIDAS (tipo app) */}
<div className="grid grid-cols-4 gap-4 mt-6">

  {[
    {name:"Ventas", icon:"💰", route:"/ventas"},
    {name:"Proyectos", icon:"📁", route:"/proyectos"},
    {name:"Inventario", icon:"📦"},
    {name:"Finanzas", icon:"📊"},
  ].map((item)=>(
    
    <div
      key={item.name}
      onClick={()=> item.route && navigate(item.route)}
      className="flex flex-col items-center cursor-pointer"
    >
      <div className="bg-zinc-900 p-4 rounded-full shadow-md hover:scale-110 transition">
        {item.icon}
      </div>

      <span className="text-xs mt-2 text-zinc-300 text-center">
        {item.name}
      </span>
    </div>

  ))}

</div>

{/* SECCIÓN PRINCIPAL */}
<div className="mt-8">

  <h2 className="text-xl font-bold text-cyan-400 mb-4">
    Módulos
  </h2>

  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

    {/* CARD REUTILIZABLE */}
    {[
      {
        title:"Ventas",
        desc:"Administrar productos, clientes y ventas.",
        route:"/ventas"
      },
      {
        title:"Proyectos",
        desc:"Gestionar proyectos y desarrollos.",
        route:"/proyectos"
      },
      {
        title:"Inventario",
        desc:"Controlar productos y stock."
      },
      {
        title:"Finanzas",
        desc:"Administrar ingresos y gastos."
      }
    ].map((item)=>(
      
      <div
        key={item.title}
        onClick={()=> item.route && navigate(item.route)}
        className="bg-zinc-900 p-6 rounded-2xl hover:bg-zinc-800 hover:scale-[1.02] transition cursor-pointer shadow-md"
      >

        <h3 className="text-lg text-cyan-400 mb-2">
          {item.title}
        </h3>

        <p className="text-zinc-400 text-sm">
          {item.desc}
        </p>

      </div>

    ))}

  </div>

</div>

</div>

{/* BOTÓN FLOTANTE */}
<button
onClick={nuevaVenta}
className="fixed bottom-6 right-6 bg-cyan-400 text-black px-5 py-3 rounded-full shadow-lg hover:bg-cyan-500 hover:scale-110 transition"
>
+ Venta
</button>

</div>

)
}