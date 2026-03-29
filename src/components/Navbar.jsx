import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { signOut } from "firebase/auth"
import { auth } from "../services/firebase"
import { Search, Bell } from "lucide-react"

export default function Navbar({ user }) {

const [open,setOpen] = useState(false)
const navigate = useNavigate()

const cerrarSesion = async () => {

try{

await signOut(auth)
navigate("/")

}catch(error){
console.log(error)
}

}

return(

<div className="bg-zinc-900 text-white p-4">

<div className="flex justify-between items-center">

{/* IZQUIERDA */}
<div className="flex items-center gap-4">

<h1 className="text-xl text-cyan-400">
Macro
</h1>

{/* BUSCADOR */}
<div className="hidden md:flex items-center bg-zinc-800 px-3 py-2 rounded-lg border border-cyan-400/20">

<Search size={16} className="text-gray-400 mr-2"/>

<input
type="text"
placeholder="Buscar..."
className="bg-transparent outline-none text-sm w-40"
/>

</div>

</div>

{/* DERECHA */}
<div className="flex items-center gap-4">

{/* NOTIFICACIONES */}
<button className="relative">

<Bell className="text-cyan-400"/>

<span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1 rounded-full">
3
</span>

</button>

{/* USUARIO */}
{user && (

<div className="flex items-center gap-2">

{user.photoURL && (
<img
src={user.photoURL}
alt="usuario"
className="w-8 h-8 rounded-full"
/>
)}

<span className="text-sm text-zinc-300">
{user.displayName || user.phoneNumber}
</span>

</div>

)}

{/* MENU */}
<button
onClick={()=>setOpen(!open)}
className="text-2xl"
>
☰
</button>

</div>

</div>

{/* MENU DESPLEGABLE */}
{open && (

<div className="mt-4 flex flex-col gap-3">

<Link to="/home">Inicio</Link>

<Link to="/proyectos">Proyectos</Link>

<Link to="/ventas">Ventas</Link>

<button
onClick={cerrarSesion}
className="text-left text-red-400 hover:text-red-500"
>
Cerrar sesión
</button>

</div>

)}

</div>

)

}