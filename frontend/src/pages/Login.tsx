import { useState } from "react";

const Login = () => {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {

    const API = "http://127.0.0.1:8000";

    try {

      const formData = new URLSearchParams();
      formData.append("email", email);
      formData.append("password", password);

      const response = await fetch(`${API}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: formData
      });

      const data = await response.json();

      // Debug: see what backend actually returns
      console.log("Login API response:", data);

      if (!response.ok) {

        if (data.error) {
          alert(data.error);
        } else {
          alert("Login failed");
        }

        return;
      }

      // Save correct user_id from backend
      if (data.user_id !== undefined && data.user_id !== null) {
        localStorage.setItem("user_id", data.user_id.toString());
        console.log("Saved user_id:", data.user_id);
      } else {
        console.error("Login response missing user_id", data);
        alert("Login failed: user id not returned");
        return;
      }

      window.location.href = "/";

    } catch (error) {

      alert("Server connection failed");

    }
  };

  return (

<div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">

<div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,#22c55e_1px,transparent_1px)] [background-size:40px_40px]" />

<div className="absolute w-[500px] h-[500px] bg-green-500/20 blur-[150px] rounded-full" />

<div className="relative z-10 bg-black/70 border border-green-500/30 backdrop-blur-lg p-10 rounded-xl w-[380px]">

<h1 className="text-3xl font-bold text-center mb-2">
<span className="text-white">DERM</span>
<span className="text-green-400">AI</span>
</h1>

<p className="text-gray-400 text-center mb-8">
Login to continue
</p>

<input
type="email"
placeholder="Email"
className="w-full p-3 mb-4 bg-black border border-gray-700 rounded text-white focus:border-green-400 outline-none"
onChange={(e)=>setEmail(e.target.value)}
/>

<input
type="password"
placeholder="Password"
className="w-full p-3 mb-6 bg-black border border-gray-700 rounded text-white focus:border-green-400 outline-none"
onChange={(e)=>setPassword(e.target.value)}
/>

<button
onClick={handleLogin}
className="w-full bg-green-500 hover:bg-green-600 text-black font-semibold py-3 rounded"
>
Login
</button>

<p className="text-center text-gray-400 mt-6">
Don't have an account?{" "}
<a href="/signup" className="text-green-400 hover:underline">
Signup
</a>
</p>

</div>

</div>

  );
};

export default Login;