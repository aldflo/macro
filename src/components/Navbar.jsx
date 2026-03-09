import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { signOut } from "firebase/auth"
import { auth } from "../services/firebase"

export default function Navbar(){

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

<h1 className="text-xl text-cyan-400">
Macro
</h1>

<button
onClick={()=>setOpen(!open)}
className="text-2xl"
>
☰
</button>

</div>

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