import Navbar from "../components/Navbar"
import { useState, useEffect } from "react"
import { db, storage } from "../services/firebase"
import { collection, addDoc, getDocs, serverTimestamp } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"

export default function Ventas(){

const [cliente,setCliente] = useState("")
const [servicio,setServicio] = useState("")
const [precio,setPrecio] = useState("")
const [imagen,setImagen] = useState(null)
const [ventas,setVentas] = useState([])

const ventasRef = collection(db,"ventas")

useEffect(()=>{
cargarVentas()
},[])

const cargarVentas = async ()=>{
try{
const data = await getDocs(ventasRef)
setVentas(data.docs.map(doc=>({...doc.data(),id:doc.id})))
}catch(error){
console.log("error cargando ventas:",error)
}
}

const guardarVenta = async ()=>{

console.log("intentando guardar")

if(!cliente || !servicio || !precio){
alert("Completa todos los campos")
return
}

try{

let imagenURL = ""

if(imagen){

const nombreImagen = Date.now() + "_" + imagen.name

const imageRef = ref(storage,`ventas/${nombreImagen}`)

await uploadBytes(imageRef,imagen)

imagenURL = await getDownloadURL(imageRef)

}

const precioNumero = parseFloat(precio.replace(/[$,]/g,""))

await addDoc(ventasRef,{
cliente,
servicio,
precio:precioNumero,
imagen:imagenURL,
fecha:serverTimestamp()
})

console.log("venta guardada")

setCliente("")
setServicio("")
setPrecio("")
setImagen(null)

cargarVentas()

}catch(error){

console.log("error guardando venta:",error)
alert("Error guardando venta")

}

}

return(

<div className="min-h-screen bg-zinc-100">

<Navbar/>

<div className="max-w-6xl mx-auto p-6">

<h1 className="text-3xl font-bold text-cyan-600 mb-6">
Ventas
</h1>

<div className="bg-white p-6 rounded-xl shadow mb-10 max-w-md">

<input
type="text"
placeholder="Cliente"
value={cliente}
onChange={(e)=>setCliente(e.target.value)}
className="w-full p-3 mb-3 border rounded"
/>

<input
type="text"
placeholder="Servicio"
value={servicio}
onChange={(e)=>setServicio(e.target.value)}
className="w-full p-3 mb-3 border rounded"
/>

<input
type="text"
placeholder="Precio $"
value={precio}
onChange={(e)=>setPrecio(e.target.value)}
className="w-full p-3 mb-3 border rounded"
/>

<input
type="file"
onChange={(e)=>setImagen(e.target.files[0])}
className="mb-4"
/>

<button
onClick={guardarVenta}
className="w-full bg-cyan-500 text-white p-3 rounded hover:bg-cyan-600"
>
Guardar venta
</button>

</div>

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

{ventas.map((venta)=>(

<div
key={venta.id}
className="bg-white rounded-xl shadow hover:shadow-lg transition overflow-hidden"
>

{venta.imagen && (

<img
src={venta.imagen}
className="w-full h-48 object-cover"
/>

)}

<div className="p-4">

<p className="text-2xl font-bold text-green-600 mb-1">
${venta.precio}
</p>

<h3 className="font-semibold text-lg">
{venta.servicio}
</h3>

<p className="text-gray-500">
Cliente: {venta.cliente}
</p>

</div>

</div>

))}

</div>

</div>

</div>

)

}