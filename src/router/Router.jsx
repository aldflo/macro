import { BrowserRouter,Routes,Route } from "react-router-dom"

import Login from "../auth/Login"
import Home from "../pages/Home"
import Proyectos from "../pages/Proyectos"
import Ventas from "../pages/Ventas"


export default function Router(){

return(

<BrowserRouter>

<Routes>

<Route path="/" element={<Login/>}/>

<Route path="/home" element={<Home/>}/>

<Route path="/proyectos" element={<Proyectos/>}/>

<Route path="/ventas" element={<Ventas/>}/>

</Routes>

</BrowserRouter>

)

}