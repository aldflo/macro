import { signInWithPopup, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth"
import { auth, provider } from "../services/firebase"
import { useNavigate } from "react-router-dom"
import { useState } from "react"
import { FcGoogle } from "react-icons/fc"
import { FaPhone } from "react-icons/fa"

export default function Login(){

const navigate = useNavigate()

const [phone, setPhone] = useState("")
const [code, setCode] = useState("")
const [confirmation, setConfirmation] = useState(null)
const [showPhoneLogin, setShowPhoneLogin] = useState(false)

const loginGoogle = async () => {
  try{
    await signInWithPopup(auth, provider)
    navigate("/home")
  }catch(error){
    console.log(error)
  }
}

const setupRecaptcha = () => {

if(!window.recaptchaVerifier){

window.recaptchaVerifier = new RecaptchaVerifier(
auth,
"recaptcha-container",
{
size:"invisible",
callback:(response)=>{
console.log("reCAPTCHA resuelto")
}
}
)

}

}

const sendCode = async () => {

try{

setupRecaptcha()

const appVerifier = window.recaptchaVerifier

const confirmationResult = await signInWithPhoneNumber(
auth,
phone,
appVerifier
)

setConfirmation(confirmationResult)

alert("Código enviado por SMS")

}catch(error){

console.log(error)
alert(error.message)

}

}

const verifyCode = async () => {

try{

await confirmation.confirm(code)

navigate("/home")

}catch(error){

alert("Código incorrecto")

}

}

return(

<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-black to-slate-800">

<div className="bg-white/10 backdrop-blur-lg border border-white/20 p-10 rounded-2xl shadow-2xl text-center w-[380px]">

<h1 className="text-4xl font-bold text-cyan-400 mb-6">
Macro
</h1>

<button
onClick={loginGoogle}
className="flex items-center justify-center gap-3 w-full bg-white text-gray-800 font-semibold py-3 rounded-xl shadow-lg hover:scale-105 transition mb-4"
>

<FcGoogle size={22}/>
Iniciar con Google

</button>

<button
onClick={()=>setShowPhoneLogin(!showPhoneLogin)}
className="flex items-center justify-center gap-3 w-full bg-cyan-500 text-white font-semibold py-3 rounded-xl shadow-lg hover:scale-105 transition mb-6"
>

<FaPhone/>
Iniciar con teléfono

</button>

{showPhoneLogin && (

<>

<input
type="text"
placeholder="+529999999999"
value={phone}
onChange={(e)=>setPhone(e.target.value)}
className="w-full p-3 rounded-lg mb-3 text-black"
/>

<button
onClick={sendCode}
className="bg-cyan-500 text-white w-full py-2 rounded-lg mb-4"
>

Enviar código

</button>

{confirmation && (

<>

<input
type="text"
placeholder="Código SMS"
value={code}
onChange={(e)=>setCode(e.target.value)}
className="w-full p-3 rounded-lg mb-3 text-black"
/>

<button
onClick={verifyCode}
className="bg-green-500 text-white w-full py-2 rounded-lg"
>

Verificar código

</button>

</>

)}

</>

)}

<div id="recaptcha-container"></div>

</div>

</div>

)

}