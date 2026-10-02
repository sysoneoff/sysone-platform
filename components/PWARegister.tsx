"use client";

import { useEffect } from "react";

export function PWARegister(){
  useEffect(()=>{
    if(!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js",{updateViaCache:"none"})
      .then((registration)=>registration.update())
      .catch(()=>{});
  },[]);

  return null;
}
